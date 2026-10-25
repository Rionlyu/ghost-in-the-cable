import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';

test('LIVE Qiskit integration · eight repairs, real evidence, resume, circuit, report export',async({page,request})=>{
 test.skip(process.env.LIVE_API!=='1','Requires the actual FastAPI/Qiskit server; no HTTP mocks are used.');
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/');
 await page.getByRole('button',{name:'Open the shop',exact:true}).click();await page.locator('[data-action="skip-intro"]').click();
 await expect(page.locator('.paper-ticket')).toBeVisible();
 const id=await page.evaluate(()=>localStorage.getItem('ghost-in-the-cable-shift'));
 expect(id).toBeTruthy();
 const path=`/api/shifts/${encodeURIComponent(id!)}`;
 for(let i=0;i<8;i++){
  const before=await (await request.get(path)).json();
  expect(before.phase).toBe('choose_tool');expect(before.debrief).toBeNull();
  expect(before.ticket).not.toHaveProperty('fault');
  const family=before.ticket.suspects as string[];
  const tool=family.length===4?'bell':family.includes('Z')?'x':'z';
  await page.locator(`[data-tool="${tool}"]`).click();
  await page.locator('[data-action="probe"]').click();
  await expect(page.getByRole('heading',{name:'Adjust the repair.'})).toBeVisible();
  const measured=await (await request.get(path)).json();
  expect(measured.reading.engine).toBe('qiskit-statevector');
  expect(measured.reading.query_count).toBe(1);expect(measured.debrief).toBeNull();
  expect(await page.locator('[data-action="circuit"]').count()).toBe(0);
  const mapping:Record<string,Record<string,string>>={z:{'0':'I','1':'X'},x:{'0':'I','1':'Z'},bell:{'00':'I','10':'X','01':'Z','11':'Y'}};
  const fault=mapping[tool][measured.reading.bits];
  if(i===1){await page.reload();await expect(page.locator('.reading-bits')).toHaveText(measured.reading.bits);}
  if(['X','Y'].includes(fault))await page.locator('[data-repair="bit"]').click();if(['Z','Y'].includes(fault))await page.locator('[data-repair="phase"]').click();await page.locator('[data-action="diagnose"]').click();
  await expect(page.getByRole('heading',{name:'It works.'})).toBeVisible();
  if(tool==='bell'){
   await page.getByRole('button',{name:'Inspect circuit'}).click();
   await expect(page.locator('.circuit')).not.toBeEmpty();
   await expect(page.getByRole('dialog')).toContainText('Before decoding');
   await page.keyboard.press('Escape');
  }
  await page.locator('[data-action="next"]').click();
  if(i<7)await expect(page.locator('[data-tool="z"]')).toBeVisible();
 }
 await expect(page.getByRole('heading',{name:'Night-shift receipt'})).toBeVisible();
 await expect(page.locator('.receipt-total')).toContainText('8 / 8');
 const final=await (await request.get(path)).json();
 expect(final.phase).toBe('complete');expect(final.bell_tokens).toBe(0);expect(final.history).toHaveLength(8);
 await page.getByRole('button',{name:'Menu',exact:true}).click();await page.getByRole('button',{name:'The science'}).click();
 await expect(page.getByRole('dialog')).toContainText('EXACT CIRCUIT PROBABILITIES');
 await page.keyboard.press('Escape');
 const expected=await (await request.get(path+'/report')).json();
 const downloading=page.waitForEvent('download');await page.locator('[data-action="export"]').click();
 const download=await downloading;
 expect(JSON.parse(await readFile((await download.path())!,'utf8'))).toEqual(expected);
 expect(errors).toEqual([]);
 await page.screenshot({path:'tests/evidence/live-receipt.png',fullPage:true});
});
