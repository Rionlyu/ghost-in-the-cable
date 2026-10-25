import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';

for (const width of [1440,768,390,320]) {
 test(`LIVE production · three real repairs and visual states at ${width}px`, async({page,request})=>{
  test.skip(process.env.LIVE_API!=='1','Actual Qiskit server required; no HTTP mocks.');
  await page.setViewportSize({width,height:width<800?844:1000});
  await page.emulateMedia({reducedMotion:'reduce'});
  const errors:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.goto('/');
  await page.screenshot({path:`tests/evidence/live-intro-${width}.png`,fullPage:true});
  await page.getByRole('button',{name:'Open the shop',exact:true}).click();await page.locator('[data-action="skip-intro"]').click();
  await expect(page.locator('.paper-ticket')).toBeVisible();
  const id=await page.evaluate(()=>localStorage.getItem('ghost-in-the-cable-shift'));
  const path=`/api/shifts/${encodeURIComponent(id!)}`;
  for(let i=0;i<3;i++) {
   const current=await(await request.get(path)).json();
   const tool=i===0?'z':i===1?'x':'bell';
   await page.locator(`[data-tool="${tool}"]`).click();
   if(i===0)await page.screenshot({path:`tests/evidence/live-bench-${width}.png`,fullPage:true});
   await page.locator('[data-action="probe"]').click();
   await expect(page.getByRole('heading',{name:'Adjust the repair.'})).toBeVisible();
   const measured=await(await request.get(path)).json();
   expect(measured.debrief).toBeNull();expect(measured.reading.query_count).toBe(1);
   expect(current.ticket).not.toHaveProperty('fault');
   const maps:Record<string,Record<string,string>>={z:{'0':'I','1':'X'},x:{'0':'I','1':'Z'},bell:{'00':'I','10':'X','01':'Z','11':'Y'}};
   if(i===2)await page.screenshot({path:`tests/evidence/live-bell-${width}.png`,fullPage:true});
   const fault=maps[tool][measured.reading.bits];if(['X','Y'].includes(fault))await page.locator('[data-repair="bit"]').click();if(['Z','Y'].includes(fault))await page.locator('[data-repair="phase"]').click();
   await page.locator('[data-action="diagnose"]').click();
   await expect(page.getByRole('heading',{name:'It works.'})).toBeVisible();
   const dimensions=await page.evaluate(()=>({w:innerWidth,scroll:document.documentElement.scrollWidth}));
   expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.w);
   if(i===2){await page.getByRole('button',{name:'Inspect circuit'}).click();await expect(page.getByRole('dialog')).toContainText('Before decoding');await page.screenshot({path:`tests/evidence/live-circuit-${width}.png`,fullPage:true});await page.screenshot({path:`tests/evidence/live-circuit-viewport-${width}.png`,fullPage:false});await page.keyboard.press('Escape');}
   await page.locator('[data-action="next"]').click();
  }
  expect(errors).toEqual([]);
 });
}

test('LIVE production · scientific evidence includes the recorded experiment with actual data', async({page})=>{
 test.skip(process.env.LIVE_API!=='1','Actual Qiskit server required; no HTTP mocks.');
 const report=JSON.parse(await readFile('../evidence/benchmark.json','utf8'));
 await page.goto('/');await page.getByRole('button',{name:'Menu',exact:true}).click();await page.getByRole('button',{name:'The science'}).click();
 const dialog=page.getByRole('dialog');
 await expect(dialog.getByRole('heading',{name:'The recorded experiment.'})).toBeVisible();
 await expect(dialog).toContainText(`${report.shots_per_fault.toLocaleString('en-US')} shots per fault`);
 await expect(dialog.getByRole('link',{name:'Download experiment JSON'})).toHaveAttribute('href','/evidence/benchmark.json');
 const image=dialog.locator('img[alt*="synthetic depolarizing"]');
 await expect(image).toBeVisible();
 expect(await image.evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true);
});
