import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';

test('LIVE redesign · first repair keeps its primary action in the narrow viewport',async({page})=>{
 test.skip(Reflect.get(globalThis,'process').env.LIVE_API!=='1','Actual Qiskit backend required.');
 await page.setViewportSize({width:320,height:844});await page.goto('/');
 await page.locator('[data-action="start"]').click();await page.locator('[data-action="skip-intro"]').click();
 const action=await page.locator('[data-action="probe"]').boundingBox();
 expect(action!.y+action!.height).toBeLessThanOrEqual(844);
 const tiny=await page.locator('main').evaluate(main=>{const walker=document.createTreeWalker(main,NodeFilter.SHOW_TEXT);const small:string[]=[];let node;while((node=walker.nextNode())){if(node.textContent?.trim()&&node.parentElement&&parseFloat(getComputedStyle(node.parentElement).fontSize)<13)small.push(node.textContent.trim())}return small});
 expect(tiny).toEqual([]);
});

for(const fixture of [
 {route:'bits',count:3,tokens:0,width:1440,ids:['porchlight','skeleton-sign','dawn-bell']},
 {route:'phase',count:2,tokens:0,width:320,ids:['whisperphone','moon-radio']},
 {route:'entanglement',count:3,tokens:3,width:390,ids:['mirror-organ','fog-machine','midnight-projector']},
])test(`LIVE redesign · ${fixture.route} is a complete server-owned chapter with matching export`,async({page,request})=>{
 test.skip(Reflect.get(globalThis,'process').env.LIVE_API!=='1','Actual Qiskit server required; no HTTP mocks.');
 await page.setViewportSize({width:fixture.width,height:900});await page.emulateMedia({reducedMotion:'reduce'});
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/');await page.locator('[data-action="chapters"]').click();
 await page.screenshot({path:`tests/evidence/redesign-chapters-${fixture.width}.png`});
 await page.locator(`[data-route="${fixture.route}"]`).click();
 await expect(page.locator('[data-tool="z"]')).toBeVisible();
 const id=await page.evaluate(()=>localStorage.getItem('ghost-in-the-cable-shift'));const path=`/api/shifts/${id}`;
 const created=await(await request.get(path)).json();expect(created.route).toBe(fixture.route);expect(created.ticket_count).toBe(fixture.count);expect(created.bell_tokens).toBe(fixture.tokens);
 const tool=fixture.route==='bits'?'z':fixture.route==='phase'?'x':'bell';
 const switches:Record<string,Record<string,{bit:boolean;phase:boolean}>>={z:{'0':{bit:false,phase:false},'1':{bit:true,phase:false}},x:{'0':{bit:false,phase:false},'1':{bit:false,phase:true}},bell:{'00':{bit:false,phase:false},'10':{bit:true,phase:false},'01':{bit:false,phase:true},'11':{bit:true,phase:true}}};
 for(let index=0;index<fixture.count;index++){
  const before=await(await request.get(path)).json();expect(before.ticket.id).toBe(fixture.ids[index]);expect(before.ticket).not.toHaveProperty('fault');expect(before.debrief).toBeNull();
  await page.locator(`[data-tool="${tool}"]`).click();await page.locator('[data-action="probe"]').click();
  await expect(page.locator('[data-action="diagnose"]')).toBeVisible();
  const measured=await(await request.get(path)).json();expect(measured.reading.engine).toBe('qiskit-statevector');expect(measured.reading.query_count).toBe(1);expect(measured.debrief).toBeNull();
  const repair=switches[tool][measured.reading.bits];
  if(index===0){await page.screenshot({path:`tests/evidence/redesign-measured-${fixture.width}.png`,fullPage:true});}
  if(repair.bit)await page.locator('[data-repair="bit"]').click();if(repair.phase)await page.locator('[data-repair="phase"]').click();
  if(index===0){await page.screenshot({path:`tests/evidence/redesign-preview-${fixture.width}.png`,fullPage:true});expect(await(await request.get(path)).json()).toEqual(measured);}
  await page.locator('[data-action="diagnose"]').click();await expect(page.locator('.instrument')).toHaveAttribute('data-device-state','repaired');
  const resolved=await(await request.get(path)).json();expect(resolved.debrief.correct).toBe(true);
  if(index===0)await page.screenshot({path:`tests/evidence/redesign-repaired-${fixture.width}.png`,fullPage:true});
  await page.locator('[data-action="next"]').click();
 }
 await expect(page.getByRole('heading',{name:'Shift complete.',exact:true})).toBeVisible();
 const final=await(await request.get(path)).json();expect(final.phase).toBe('complete');expect(final.correct).toBe(fixture.count);expect(final.revision).toBe(fixture.count*3);expect(final.history).toHaveLength(fixture.count);
 const expected=await(await request.get(path+'/report')).json();const downloading=page.waitForEvent('download');await page.locator('[data-action="export"]').click();const download=await downloading;expect(JSON.parse(await readFile((await download.path())!,'utf8'))).toEqual(expected);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
});