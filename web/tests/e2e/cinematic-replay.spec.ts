import {test,expect,type Page} from '@playwright/test';
import {mockShop} from './fixtures';

const live=Reflect.get(globalThis,'process').env.LIVE_API==='1';
const storageKey='ghost-in-the-cable-shift';

async function openBench(page:Page):Promise<void>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
 await page.getByRole('button',{name:'Open the shop',exact:true}).click();
 await page.locator('[data-action="skip-intro"]').click();
 await expect(page.locator('.paper-ticket')).toBeVisible();
}
async function restartFromMenu(page:Page):Promise<void>{
 await page.getByRole('button',{name:'Menu',exact:true}).click();
 await page.getByRole('button',{name:'Replay intro',exact:true}).click();
}

test('LIVE Replay intro restarts the whole game through forest, new story, keeper and fresh tutorial',async({page,request})=>{
 test.skip(!live,'Uses and reads back the actual local Qiskit sessions.');
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
 await page.setViewportSize({width:1440,height:900});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
 await page.getByRole('button',{name:'Choose a chapter',exact:true}).click();await page.locator('[data-route="entanglement"]').click();
 await page.locator('[data-tool="bell"]').click();await page.locator('[data-action="probe"]').click();
 await expect(page.locator('[data-repair="phase"]')).toBeVisible();await page.locator('[data-repair="bit"]').click();
 const oldID=await page.evaluate(key=>localStorage.getItem(key),storageKey);expect(oldID).toBeTruthy();
 const oldPath=`/api/shifts/${encodeURIComponent(oldID!)}`;const oldState=await(await request.get(oldPath)).json();
 expect(oldState).toMatchObject({revision:1,route:'entanglement',bell_tokens:2,phase:'diagnose'});
 const writes:string[]=[];page.on('request',r=>{if(r.method()==='POST')writes.push(new URL(r.url()).pathname);});
 await restartFromMenu(page);
 await expect(page.getByRole('heading',{name:'Restart from the beginning?',exact:true})).toBeVisible();
 await page.screenshot({path:'tests/evidence/restart-confirm-1440.png'});
 await page.getByRole('button',{name:'Restart game',exact:true}).click();
 await expect(page.locator('[data-cinema]')).toHaveAttribute('data-cinema-state','ready');
 await expect(page.getByRole('button',{name:'Open the shop',exact:true})).toBeFocused();
 expect(await page.evaluate(key=>localStorage.getItem(key),storageKey)).toBeNull();expect(writes).toEqual([]);
 await page.reload();await expect(page.locator('[data-cinema]')).toHaveAttribute('data-cinema-state','ready');
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.getByRole('button',{name:'Open the shop',exact:true}).click();
 await expect(page.locator('[data-cinema]')).toHaveAttribute('data-cinema-state','entering');
 await expect(page.locator('[data-action="cinema-skip"]')).toBeFocused();
 await expect(page.locator('[data-action="story-continue"]')).toBeVisible();
 const newID=await page.evaluate(key=>localStorage.getItem(key),storageKey);expect(newID).toBeTruthy();expect(newID).not.toBe(oldID);
 const state=await(await request.get(`/api/shifts/${encodeURIComponent(newID!)}`)).json();
 expect(state).toMatchObject({route:'story',revision:0,credits:0,correct:0,bell_tokens:3,ticket_index:0,reading:null,history:[],ticket:{id:'porchlight'}});
 expect(await(await request.get(oldPath)).json()).toEqual(oldState);expect(writes).toEqual(['/api/shifts']);
 await page.getByRole('button',{name:'Learn the tools',exact:true}).click();
 await expect(page.locator('[data-tutorial-stage]')).toHaveAttribute('data-tutorial-stage','0');await expect(page.locator('[data-training-reading]')).toHaveCount(0);
 expect(errors).toEqual([]);
});

for(const [width,skip] of [[390,'button'],[320,'escape']] as const){
 test(`LIVE restart confirmation can be cancelled, then starts a fresh game · ${width}px`,async({page,request})=>{
  test.skip(!live,'Reads back real old and newly created sessions.');
  await page.setViewportSize({width,height:844});await openBench(page);await page.locator('[data-tool="z"]').click();
  const id=await page.evaluate(key=>localStorage.getItem(key),storageKey);const path=`/api/shifts/${encodeURIComponent(id!)}`;
  const before=await(await request.get(path)).json();
  await restartFromMenu(page);await page.getByRole('button',{name:'Keep playing',exact:true}).click();
  await expect(page.locator('[data-tool="z"]')).toHaveAttribute('aria-pressed','true');expect(await page.evaluate(key=>localStorage.getItem(key),storageKey)).toBe(id);
  expect(await(await request.get(path)).json()).toEqual(before);
  await restartFromMenu(page);await page.getByRole('button',{name:'Restart game',exact:true}).click();
  await expect(page.locator('[data-cinema]')).toHaveAttribute('data-cinema-state','ready');
  await page.screenshot({path:`tests/evidence/restart-forest-${width}.png`});
  await page.keyboard.press('3');await expect(page.locator('[data-cinema]')).toHaveAttribute('data-cinema-state','ready');
  await page.emulateMedia({reducedMotion:'no-preference'});await page.getByRole('button',{name:'Open the shop',exact:true}).click();
  await expect(page.locator('[data-cinema]')).toHaveAttribute('data-cinema-state','entering');
  if(skip==='button')await page.locator('[data-action="cinema-skip"]').click();else await page.keyboard.press('Escape');
  await expect(page.locator('[data-action="story-continue"]')).toBeVisible();
  await page.locator('[data-action="skip-intro"]').click();
  await expect(page.locator('[data-tool="z"]')).toHaveAttribute('aria-pressed','false');
  await expect(page.locator('[data-action="probe"]')).toBeDisabled();
  const freshID=await page.evaluate(key=>localStorage.getItem(key),storageKey);expect(freshID).not.toBe(id);
  const fresh=await(await request.get(`/api/shifts/${encodeURIComponent(freshID!)}`)).json();
  expect(fresh).toMatchObject({revision:0,credits:0,bell_tokens:3,history:[],reading:null,ticket:{id:'porchlight'}});
 });
}

test('LIVE restarting during training discards cached stage and results',async({page})=>{
 test.skip(!live,'Runs the real training circuit.');
 await openBench(page);await page.getByRole('button',{name:'Menu',exact:true}).click();await page.locator('[data-action="tutorial-replay"]').click();
 await page.locator('[data-action="tutorial-run"]').click();await expect(page.locator('[data-training-reading]')).toHaveText('0');
 await page.locator('[data-action="tutorial-next"]').click();
 await expect(page.locator('[data-tutorial-stage]')).toHaveAttribute('data-tutorial-stage','1');
 await restartFromMenu(page);await page.getByRole('button',{name:'Restart game',exact:true}).click();
 await page.getByRole('button',{name:'Open the shop',exact:true}).click();await page.locator('[data-action="story-continue"]').click();
 await expect(page.locator('[data-tutorial-stage]')).toHaveAttribute('data-tutorial-stage','0');await expect(page.locator('[data-training-reading]')).toHaveCount(0);
 await expect(page.locator('#tutorial-title')).toBeFocused();
});

test('LIVE title restart needs no confirmation and creates no session before Open the shop',async({page})=>{
 test.skip(!live,'Normal entry uses the real API.');
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
 const writes:string[]=[];page.on('request',r=>{if(r.method()==='POST')writes.push(new URL(r.url()).pathname);});
 await restartFromMenu(page);await expect(page.locator('dialog')).not.toBeVisible();await expect(page.getByRole('button',{name:'Open the shop',exact:true})).toBeFocused();
 expect(await page.evaluate(key=>localStorage.getItem(key),storageKey)).toBeNull();expect(writes).toEqual([]);
 await page.getByRole('button',{name:'Open the shop',exact:true}).click();await expect(page.locator('[data-action="story-continue"]')).toBeVisible();expect(writes).toEqual(['/api/shifts']);
});

for(const action of ['customer','training']){
 test(`UI guard · restart is disabled during a pending ${action} response`,async({page})=>{
  await mockShop(page);await openBench(page);
  const target=action==='customer'?'**/api/shifts/*/probe':'**/api/training/probe';
  let release!:()=>void;const gate=new Promise<void>(resolve=>release=resolve);
  await page.route(target,async route=>{await gate;if(action==='customer')await route.fallback();else await route.fulfill({status:503,json:{detail:'Held training response; UI fixture only.'}});});
  try{
   if(action==='customer'){await page.locator('[data-tool="z"]').click();await page.locator('[data-action="probe"]').click();}
   else {await page.getByRole('button',{name:'Menu',exact:true}).click();await page.locator('[data-action="tutorial-replay"]').click();await page.locator('[data-action="tutorial-run"]').click();}
   await page.getByRole('button',{name:'Menu',exact:true}).click();await expect(page.getByRole('button',{name:'Replay intro',exact:true})).toBeDisabled();await expect(page.locator('[data-cinema]')).toHaveCount(0);
  }finally{const received=page.waitForResponse(target);release();await received;}
 });
}
