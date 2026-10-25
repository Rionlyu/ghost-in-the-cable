import {test,expect} from '@playwright/test';

test('LIVE redesign · switches preserve measured evidence and never spend another device query',async({page,request})=>{
 test.skip(Reflect.get(globalThis,'process').env.LIVE_API!=='1','Actual Qiskit backend required.');
 await page.goto('/');
 await page.getByRole('button',{name:'Choose a chapter',exact:true}).click();
 await page.locator('[data-route="entanglement"]').click();
 await expect(page.locator('.paper-ticket')).toBeVisible();
 const id=await page.evaluate(()=>localStorage.getItem('ghost-in-the-cable-shift'));
 expect(id).toBeTruthy();
 const path=`/api/shifts/${encodeURIComponent(id!)}`;
 const mutations:string[]=[];
 page.on('request',r=>{const suffix=new URL(r.url()).pathname.slice(path.length);if(r.method()==='POST'&&['/probe','/diagnose','/next'].includes(suffix))mutations.push(suffix)});
 await page.locator('[data-tool="bell"]').click();
 await page.getByRole('button',{name:'Test cable',exact:true}).click();
 await expect(page.getByRole('switch',{name:'Flip bit',exact:true})).toBeVisible();
 const measured=await(await request.get(path)).json();
 expect(measured.reading.engine).toBe('qiskit-statevector');
 expect(measured.reading.query_count).toBe(1);
 expect(measured.debrief).toBeNull();
 const bit=page.locator('[data-signal="bit"] path');
 const phase=page.locator('[data-signal="phase"] path');
 const before={bit:await bit.getAttribute('d'),phase:await phase.getAttribute('d')};
 await page.getByRole('switch',{name:'Flip bit',exact:true}).click();
 await expect(bit).toHaveAttribute('d',before.bit!);
 await expect(phase).toHaveAttribute('d',before.phase!);
 await page.getByRole('switch',{name:'Flip phase',exact:true}).click();
 await expect(phase).toHaveAttribute('d',before.phase!);
 await expect(page.locator('.instrument')).toHaveAttribute('data-device-state','preview');
 await expect(page.locator('.preview-label')).toHaveText('Original measurement · unchanged by switches');
 expect(await(await request.get(path)).json()).toEqual(measured);
 expect(mutations).toEqual(['/probe']);
 const corrections:Record<string,{bit:boolean;phase:boolean}>={'00':{bit:false,phase:false},'10':{bit:true,phase:false},'01':{bit:false,phase:true},'11':{bit:true,phase:true}};
 const repair=corrections[measured.reading.bits];
 if(!repair.bit)await page.getByRole('switch',{name:'Flip bit',exact:true}).click();
 if(!repair.phase)await page.getByRole('switch',{name:'Flip phase',exact:true}).click();
 await page.getByRole('button',{name:'Apply repair',exact:true}).click();
 await expect(page.locator('.instrument')).toHaveAttribute('data-device-state','repaired');
 expect((await(await request.get(path)).json()).debrief.correct).toBe(true);
 expect(mutations).toEqual(['/probe','/diagnose']);
});

test('LIVE redesign · an unsuitable probe leaves missing evidence unknown while switches change',async({page,request})=>{
 test.skip(Reflect.get(globalThis,'process').env.LIVE_API!=='1','Actual Qiskit backend required.');
 await page.goto('/');
 await page.getByRole('button',{name:'Choose a chapter',exact:true}).click();
 await page.locator('[data-route="phase"]').click();
 await expect(page.locator('.paper-ticket')).toBeVisible();
 const id=await page.evaluate(()=>localStorage.getItem('ghost-in-the-cable-shift'));
 expect(id).toBeTruthy();
 const path=`/api/shifts/${encodeURIComponent(id!)}`;
 await page.locator('[data-tool="z"]').click();
 await page.getByRole('button',{name:'Test cable',exact:true}).click();
 await expect(page.locator('[data-signal="phase"]')).toContainText('Unknown');
 const measured=await(await request.get(path)).json();
 const before=await page.locator('[data-signal="phase"] path').getAttribute('d');
 await page.getByRole('switch',{name:'Flip phase',exact:true}).click();
 await expect(page.locator('[data-signal="phase"]')).toContainText('Unknown');
 await expect(page.locator('[data-signal="phase"] path')).toHaveAttribute('d',before!);
 await expect(page.locator('main .context-tip')).toContainText('Some information was not measured.');
 await expect(page.locator('.instrument')).toHaveAttribute('data-device-state','preview');
 expect(await(await request.get(path)).json()).toEqual(measured);
});

test('LIVE redesign · a short guided opening comes before the first repair', async({page,request})=>{
 test.skip(Reflect.get(globalThis,'process').env.LIVE_API!=='1','Actual Qiskit server required; no mocked readings.');
 await page.goto('/');
 await page.getByRole('button',{name:'Open the shop',exact:true}).click();
 await expect(page.getByRole('button',{name:'Skip to repairs',exact:true})).toBeVisible();
 const id=await page.evaluate(()=>localStorage.getItem('ghost-in-the-cable-shift'));
 expect(id).toBeTruthy();
 const state=await(await request.get(`/api/shifts/${encodeURIComponent(id!)}`)).json();
 expect(state.revision).toBe(0);
 expect(state.reading).toBeNull();
 await expect(page.locator('[data-action="probe"]')).toHaveCount(0);
 await page.getByRole('button',{name:'Skip to repairs',exact:true}).click();
 await expect(page.locator('.paper-ticket')).toBeVisible();
 await expect(page.getByRole('button',{name:'Test cable',exact:true})).toBeVisible();
 expect((await page.locator('main').innerText()).split(/\s+/).length).toBeLessThan(125);
 await expect(page.locator('.fault-options')).toHaveCount(0);
 await expect(page.getByRole('heading',{name:'Name the fault.'})).toHaveCount(0);
});

for(const route of ['bits','phase','entanglement']){
 test(`LIVE redesign · ${route} first instruction leaves probe choice to the player`,async({page})=>{
  test.skip(Reflect.get(globalThis,'process').env.LIVE_API!=='1','Actual backend chapter required.');
  await page.goto('/');
  await page.getByRole('button',{name:'Choose a chapter',exact:true}).click();
  await page.locator(`[data-route="${route}"]`).click();
  await expect(page.locator('.paper-ticket')).toBeVisible();
  await expect(page.locator('main .context-tip')).toContainText('Which probe separates these suspects?');
  await expect(page.locator('main')).not.toContainText(/Try the (Bit|Phase|Linked) probe|Keep a reference with/);
  await expect(page.locator('.ticket-family')).toContainText('Suspects');
  await expect(page.locator('[data-action="probe"]')).toBeDisabled();
 });
}
