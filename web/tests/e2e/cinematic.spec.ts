import {test,expect} from '@playwright/test';

const live=Reflect.get(globalThis,'process').env.LIVE_API==='1';
const narrowLandscape=[{width:568,height:320},{width:640,height:360}];
const sizes=[{width:1440,height:900},{width:768,height:1024},{width:390,height:844},{width:320,height:844},{width:844,height:390},...narrowLandscape];

for(const size of sizes){
 test(`cinematic title is a full viewport, not a website card · ${size.width}×${size.height}`,async({page})=>{
  const errors:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.setViewportSize(size);
  await page.goto('/');
  const geometry=await page.locator('main').evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,viewportWidth:innerWidth,viewportHeight:innerHeight,scrollWidth:document.documentElement.scrollWidth};});
  expect(geometry).toEqual({x:0,y:0,...size,viewportWidth:size.width,viewportHeight:size.height,scrollWidth:size.width});
  await expect(page.locator('.masthead')).not.toBeVisible();
  await expect(page.locator('.footer')).not.toBeVisible();
  await expect(page.locator('[data-cinema]')).toBeVisible();
  await expect(page.locator('.forest-world')).toBeVisible();
  await expect(page.getByRole('button',{name:'Open the shop',exact:true})).toBeVisible();
  const title=await page.locator('.cinema-title').boundingBox(),actions=await page.locator('.cinema-actions').boundingBox();
  expect(title).not.toBeNull();expect(actions).not.toBeNull();
  expect(title!.y+title!.height,'Title and actions must remain separate at short heights').toBeLessThanOrEqual(actions!.y);
  for(const control of await page.locator('[data-cinema] button:visible').all()){
   const r=await control.boundingBox();expect(r).not.toBeNull();
   expect(r!.x).toBeGreaterThanOrEqual(0);expect(r!.y).toBeGreaterThanOrEqual(0);
   expect(r!.x+r!.width).toBeLessThanOrEqual(size.width);expect(r!.y+r!.height).toBeLessThanOrEqual(size.height);
   expect(r!.height).toBeGreaterThanOrEqual(44);
  }
  await page.screenshot({path:`tests/evidence/cinematic-title-${size.width}.png`});
  expect(errors).toEqual([]);
 });
}

for(const size of [sizes[0],sizes[2]]){
 test(`LIVE cinematic natural camera entry creates only one untouched shift · ${size.width}px`,async({page,request})=>{
  test.skip(!live,'Requires the actual Qiskit API; no responses are mocked.');
  await page.setViewportSize(size);await page.emulateMedia({reducedMotion:'no-preference'});
  const errors:string[]=[],writes:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  page.on('request',r=>{if(r.method()==='POST')writes.push(new URL(r.url()).pathname);});
  await page.goto('/');
  await page.getByRole('button',{name:'Open the shop',exact:true}).click();
  await expect(page.locator('[data-cinema]')).toHaveAttribute('data-cinema-state','entering');
  await expect(page.locator('[data-action="cinema-skip"]')).toBeFocused();
  await expect.poll(()=>page.locator('[data-forest-camera]').evaluate(el=>el.getAnimations()[0]?.effect?.getComputedTiming().progress??0)).toBeGreaterThan(.35);
  const scale=await page.locator('[data-forest-camera]').evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).a);
  expect(scale).toBeGreaterThan(1.5);expect(writes).toEqual([]);
  await page.screenshot({path:`tests/evidence/cinematic-travel-${size.width}.png`});
  await expect(page.locator('[data-action="skip-intro"]')).toBeVisible();
  await expect(page.locator('[data-cinema]')).toHaveCount(0);
  const id=await page.evaluate(()=>localStorage.getItem('ghost-in-the-cable-shift'));
  expect(id).toBeTruthy();
  const before=await(await request.get(`/api/shifts/${encodeURIComponent(id!)}`)).json();
  expect(before).toMatchObject({phase:'choose_tool',revision:0,route:'story',reading:null});
  expect(writes).toEqual(['/api/shifts']);
  await page.screenshot({path:`tests/evidence/cinematic-inside-${size.width}.png`});
  await page.reload();
  await expect(page.locator('.paper-ticket')).toBeVisible();
  await expect(page.locator('[data-cinema]')).toHaveCount(0);
  const after=await(await request.get(`/api/shifts/${encodeURIComponent(id!)}`)).json();
  expect(after).toEqual(before);expect(writes).toEqual(['/api/shifts']);expect(errors).toEqual([]);
 });
}

for(const method of ['skip','escape'] as const){
 test(`LIVE cinematic ${method} completes once without querying a customer`,async({page,request})=>{
  test.skip(!live,'Requires the actual Qiskit API; no responses are mocked.');
  await page.setViewportSize(sizes[2]);await page.emulateMedia({reducedMotion:'no-preference'});
  const writes:string[]=[];page.on('request',r=>{if(r.method()==='POST')writes.push(new URL(r.url()).pathname);});
  await page.goto('/');await page.getByRole('button',{name:'Open the shop',exact:true}).click();
  if(method==='skip')await page.getByRole('button',{name:'Skip animation'}).click();else await page.keyboard.press('Escape');
  await expect(page.locator('[data-action="skip-intro"]')).toBeVisible();
  const id=await page.evaluate(()=>localStorage.getItem('ghost-in-the-cable-shift'));
  const state=await(await request.get(`/api/shifts/${encodeURIComponent(id!)}`)).json();
  expect(state).toMatchObject({revision:0,reading:null,phase:'choose_tool'});
  expect(writes).toEqual(['/api/shifts']);
 });
}

test('cinematic API error remains readable and retries against the real server',async({page,request})=>{
 test.skip(!live,'The failure is a UI fixture; retry and state readback require the real API.');
 await page.setViewportSize(sizes[2]);await page.emulateMedia({reducedMotion:'reduce'});
 await page.route('**/api/shifts',route=>route.fulfill({status:503,json:{detail:'The workshop is unavailable.'}}));
 await page.goto('/');await page.getByRole('button',{name:'Open the shop',exact:true}).click();
 const alert=page.getByRole('alert');await expect(alert).toContainText('The workshop is unavailable.');
 await expect(alert.getByRole('button',{name:'Retry',exact:true})).toBeVisible();
 const rect=await alert.boundingBox();expect(rect).not.toBeNull();
 expect(rect!.y).toBeGreaterThanOrEqual(0);expect(rect!.y+rect!.height).toBeLessThanOrEqual(sizes[2].height);
 expect(await page.evaluate(()=>localStorage.getItem('ghost-in-the-cable-shift'))).toBeNull();
 await page.screenshot({path:'tests/evidence/cinematic-error-390.png'});
 await page.unroute('**/api/shifts');
 await alert.getByRole('button',{name:'Retry',exact:true}).click();
 await expect(page.locator('[data-action="skip-intro"]')).toBeVisible();
 const id=await page.evaluate(()=>localStorage.getItem('ghost-in-the-cable-shift'));
 const state=await(await request.get(`/api/shifts/${encodeURIComponent(id!)}`)).json();
 expect(state).toMatchObject({revision:0,reading:null,phase:'choose_tool'});
});

for(const size of narrowLandscape){
 for(const length of ['short','long'] as const){
  test(`cinematic narrow-landscape ${length} error is contained and retryable · ${size.width}×${size.height}`,async({page,request})=>{
   test.skip(!live,'The failure is a UI fixture; retry reads back the real server state.');
   await page.setViewportSize(size);await page.emulateMedia({reducedMotion:'reduce'});
   const detail=length==='short'?'The workshop server could not be reached. Check the connection, then retry.':'The workshop connection failed while opening your shift. Your cable was not queried. '.repeat(30);
   await page.route('**/api/shifts',route=>route.fulfill({status:503,json:{detail}}));
   await page.goto('/');await page.getByRole('button',{name:'Open the shop',exact:true}).click();
   const alert=page.getByRole('alert');await expect(alert).toContainText(detail);
   const box=await alert.boundingBox();expect(box).not.toBeNull();
   expect(box!.y,'Error panel must not start above the viewport').toBeGreaterThanOrEqual(0);
   expect(box!.y+box!.height).toBeLessThanOrEqual(size.height);
   const heading=await alert.locator('.error-title').boundingBox();expect(heading).not.toBeNull();
   expect(heading!.y).toBeGreaterThanOrEqual(0);expect(heading!.y+heading!.height).toBeLessThanOrEqual(size.height);
   if(length==='long'){
    const scroll=await alert.evaluate(el=>({overflow:getComputedStyle(el).overflowY,scrollHeight:el.scrollHeight,clientHeight:el.clientHeight}));
    expect(scroll.overflow).toBe('auto');expect(scroll.scrollHeight).toBeGreaterThan(scroll.clientHeight);
   }
   await page.screenshot({path:`tests/evidence/cinematic-error-${length}-${size.width}.png`});
   await alert.getByRole('button',{name:'Retry',exact:true}).scrollIntoViewIfNeeded();
   const retry=await alert.getByRole('button',{name:'Retry',exact:true}).boundingBox();
   expect(retry).not.toBeNull();expect(retry!.y).toBeGreaterThanOrEqual(0);expect(retry!.y+retry!.height).toBeLessThanOrEqual(size.height);
   expect(await page.evaluate(()=>localStorage.getItem('ghost-in-the-cable-shift'))).toBeNull();
   await page.unroute('**/api/shifts');await alert.getByRole('button',{name:'Retry',exact:true}).click();
   await expect(page.locator('[data-action="skip-intro"]')).toBeVisible();
   const id=await page.evaluate(()=>localStorage.getItem('ghost-in-the-cable-shift'));
   const state=await(await request.get(`/api/shifts/${encodeURIComponent(id!)}`)).json();
   expect(state).toMatchObject({revision:0,reading:null,phase:'choose_tool'});
  });
 }
}
