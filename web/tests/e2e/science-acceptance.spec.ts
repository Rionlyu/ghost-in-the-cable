import {test,expect} from '@playwright/test';

// Parent-owned independent integration checks. Never mock the quantum boundary.
const live=Reflect.get(globalThis,'process').env.LIVE_API==='1';
test.describe('science walkthrough — independent real-backend acceptance',()=>{
 test.skip(!live,'Requires the actual local Qiskit backend and a rebuilt frontend.');
 test('a new player learns on a separate cable before spending the first customer query',async({page,request})=>{
  const customerActions:string[]=[];
  page.on('request',r=>{if(r.method()==='POST'&&/\/api\/shifts\/[^/]+\/(probe|diagnose|next)$/.test(new URL(r.url()).pathname))customerActions.push(new URL(r.url()).pathname);});
  await page.goto('/');
  await page.getByRole('button',{name:/Open the shop/}).click();
  await expect(page.getByRole('button',{name:'Learn the tools',exact:true})).toBeVisible({timeout:5000});
  const id=await page.evaluate(()=>localStorage.getItem('ghost-in-the-cable-shift'));
  expect(id).toBeTruthy();
  const before=await (await request.get(`/api/shifts/${encodeURIComponent(id!)}`)).json();
  expect(before.revision).toBe(0);
  expect(before.phase).toBe('choose_tool');
  expect(before.reading).toBeNull();
  await page.getByRole('button',{name:'Learn the tools',exact:true}).click();
  await expect(page.locator('[data-tutorial-stage]')).toBeVisible();
  await expect(page.locator('[data-action="probe"]')).toHaveCount(0);
  await page.locator('[data-action="tutorial-skip"]').click();
  await expect(page.locator('.paper-ticket')).toBeVisible();
  const after=await (await request.get(`/api/shifts/${encodeURIComponent(id!)}`)).json();
  expect(after).toEqual(before);
  expect(customerActions).toEqual([]);
 });
});
