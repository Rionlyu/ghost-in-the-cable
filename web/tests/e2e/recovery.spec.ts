import {test,expect} from '@playwright/test';
import {mockShop} from './fixtures';

test('UI only · mocked HTTP · a full eight-ticket shift, reload, exhausted Bell budget, receipt, export',async({page})=>{
 await mockShop(page,{fullFamily:true});await page.goto('/');await page.getByRole('button',{name:'Open the shop',exact:true}).click();await page.locator('[data-action="skip-intro"]').click();
 for(let i=0;i<8;i++){
  await expect(page.locator('[data-tool="z"]')).toBeVisible();
  await page.keyboard.press(i<3?'3':'1');await page.keyboard.press('Enter');
  await expect(page.getByRole('heading',{name:'Adjust the repair.'})).toBeVisible();
  if(i===0){await page.reload();await expect(page.locator('.reading-bits')).toHaveText('10');await expect(page.locator('[data-tool]')).toHaveCount(0);}
  await page.keyboard.press('1');await page.keyboard.press('Enter');
  await expect(page.getByRole('heading',{name:'It works.'})).toBeVisible();
  await page.getByRole('button',{name:i===7?'Close the shop':'Next ticket',exact:true}).click();
  if(i===2)await expect(page.locator('[data-tool="bell"]')).toBeDisabled();
 }
 await expect(page.getByRole('heading',{name:'Night-shift receipt'})).toBeVisible();
 await expect(page.locator('.receipt-jobs li')).toHaveCount(8);
 await page.screenshot({path:`tests/evidence/receipt-${page.viewportSize()!.width}.png`,fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Export shift JSON'}).click();
 expect((await download).suggestedFilename()).toBe('ghost-in-the-cable-shift.json');
 await page.getByRole('button',{name:'Work another shift'}).click();
 await expect(page.getByRole('dialog')).toBeVisible();
 await page.getByRole('button',{name:'Keep this shift'}).click();
 await expect(page.getByRole('heading',{name:'Night-shift receipt'})).toBeVisible();
});

test('UI only · mocked HTTP · mutations bind the rendered revision and 409 refresh never retries',async({page})=>{
 await mockShop(page);await page.goto('/');await page.getByRole('button',{name:'Open the shop',exact:true}).click();await page.locator('[data-action="skip-intro"]').click();
 const path='/api/shifts/ui-fixture-only';
 async function action(suffix:string,selector:string,expected:object){
  const sending=page.waitForRequest(request=>new URL(request.url()).pathname===path+suffix&&request.method()==='POST');
  await page.locator(selector).click();
  expect((await sending).postDataJSON()).toEqual(expected);
 }
 await page.locator('[data-tool="z"]').click();
 await action('/probe','[data-action="probe"]',{tool:'z',expected_revision:0});
 await expect(page.getByRole('heading',{name:'Adjust the repair.'})).toBeVisible();
 await page.locator('[data-repair="bit"]').click();
 await action('/diagnose','[data-action="diagnose"]',{fault:'X',expected_revision:1});
 await expect(page.getByRole('heading',{name:'It works.'})).toBeVisible();
 await action('/next','[data-action="next"]',{expected_revision:2});
 await expect(page.locator('[data-tool="z"]')).toBeVisible();
 let attempts=0;
 await page.route('**/api/shifts/ui-fixture-only/probe',async route=>{
  attempts++;await route.fulfill({status:409,json:{detail:'This bench has changed.'}});
 });
 await page.locator('[data-tool="bell"]').click();
 await action('/probe','[data-action="probe"]',{tool:'bell',expected_revision:3});
 await expect(page.getByRole('alert')).toContainText('The bench was refreshed from the server.');
 expect(attempts).toBe(1);
 await expect(page.getByRole('region',{name:'Shift progress'})).toContainText('3');
 await expect(page.getByRole('button',{name:'Test cable',exact:true})).toBeDisabled();
});

test('UI only · mocked HTTP · server loss is explicit and offers a new shift',async({page})=>{
 await mockShop(page);
 await page.addInitScript(()=>localStorage.setItem('ghost-in-the-cable-shift','expired-shift'));
 await page.route('**/api/shifts/expired-shift',route=>route.fulfill({status:404,contentType:'application/json',body:JSON.stringify({detail:'Shift not found.'})}));
 await page.goto('/');
 await expect(page.getByRole('heading',{name:'This shift has slipped away.'})).toBeVisible();
 await expect(page.getByRole('button',{name:'Start a new shift'})).toBeVisible();
 await expect(page.locator('[data-tool]')).toHaveCount(0);
 await page.getByRole('button',{name:'Start a new shift'}).click();await page.locator('[data-action="skip-intro"]').click();
 await expect(page.getByRole('heading',{name:'The unquiet doorbell'})).toBeVisible();
});

test('UI only · mocked HTTP · unreachable backend never invents a result',async({page})=>{
 await page.route('**/api/**',route=>route.abort('connectionrefused'));
 await page.goto('/');await page.getByRole('button',{name:'Open the shop',exact:true}).click();
 await expect(page.getByRole('alert')).toContainText('could not be reached');
 await expect(page.locator('[data-tool]')).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Retry',exact:true})).toBeEnabled();
});

test('UI only · mocked HTTP · unconfirmed mutation blocks repeat probing until refresh',async({page})=>{
 await mockShop(page);await page.goto('/');await page.getByRole('button',{name:'Open the shop',exact:true}).click();await page.locator('[data-action="skip-intro"]').click();
 await page.route('**/api/shifts/ui-fixture-only/**',route=>route.abort('connectionrefused'));
 await page.route('**/api/shifts/ui-fixture-only',route=>route.abort('connectionrefused'));
 await page.locator('[data-tool="bell"]').click();await page.getByRole('button',{name:'Test cable'}).click();
 await expect(page.getByRole('alert')).toContainText('could not confirm');
 await expect(page.locator('[data-tool="bell"]')).toBeDisabled();
 await expect(page.getByRole('button',{name:'Refresh bench'})).toBeEnabled();
});
