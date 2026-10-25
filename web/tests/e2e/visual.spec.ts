import {test,expect} from '@playwright/test';
import {mockShop} from './fixtures';

for(const width of [1440,768,390,320])test(`UI only · mocked HTTP · responsive bench at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:width>1000?1000:844});
 await page.emulateMedia({reducedMotion:'reduce'});
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await mockShop(page);await page.goto('/');
 await expect(page.getByRole('heading',{name:/Ghost\s*in the\s*Cable/i})).toBeVisible();
 await page.screenshot({path:`tests/evidence/intro-${width}.png`,fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole('button',{name:'Open the shop',exact:true}).click();await page.locator('[data-action="skip-intro"]').click();
 await expect(page.locator('[data-tool="bell"]')).toBeVisible();
 await page.screenshot({path:`tests/evidence/bench-${width}.png`,fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.locator('[data-tool="bell"]').click();await page.getByRole('button',{name:'Test cable'}).click();
 await expect(page.getByRole('heading',{name:'Adjust the repair.'})).toBeVisible();
 await page.screenshot({path:`tests/evidence/diagnose-${width}.png`,fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.locator('[data-repair="bit"]').click();await page.getByRole('button',{name:'Apply repair'}).click();
 await expect(page.getByRole('heading',{name:'It works.'})).toBeVisible();
 await page.screenshot({path:`tests/evidence/debrief-${width}.png`,fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(errors).toEqual([]);
 console.log(JSON.stringify({width,actual:await page.evaluate(()=>({width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,dpr:devicePixelRatio})),runtimeErrors:errors.length}));
});

test('UI only · mocked HTTP · pending probe disables resets without stealing modal focus',async({page})=>{
 await mockShop(page);await page.goto('/');await page.getByRole('button',{name:'Open the shop',exact:true}).click();await page.locator('[data-action="skip-intro"]').click();
 await expect(page.locator('[data-tool="bell"]')).toBeVisible();
 let release!:()=>void;const gate=new Promise<void>(resolve=>release=resolve);
 await page.route('**/api/shifts/*/probe',async route=>{await gate;await route.fallback();});
 await page.locator('[data-tool="bell"]').click();await page.getByRole('button',{name:'Test cable'}).click();
 await page.getByRole('button',{name:'Menu',exact:true}).click();await expect(page.getByRole('button',{name:'New shift',exact:true})).toBeDisabled();await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Help',exact:true}).click();release();
 await expect(page.getByRole('heading',{name:'Adjust the repair.'})).toBeAttached();
 expect(await page.locator('dialog').evaluate(d=>d.contains(document.activeElement))).toBe(true);
 await page.keyboard.press('Escape');
 await expect(page.getByRole('button',{name:'Help',exact:true})).toBeFocused();
});

test('UI only · mocked HTTP · late science errors do not overwrite a newly opened field guide',async({page})=>{
 await mockShop(page);
 let release!:()=>void;const gate=new Promise<void>(resolve=>release=resolve);
 await page.route('**/api/evidence',async route=>{await gate;await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({detail:'Delayed server failure.'})});});
 await page.goto('/');
 const pending=page.waitForRequest('**/api/evidence');
 await page.getByRole('button',{name:'Menu',exact:true}).click();await page.getByRole('button',{name:'The science'}).click();await pending;
 await page.getByRole('button',{name:'Close dialog'}).click();
 await page.getByRole('button',{name:'Help',exact:true}).click();
 const completed=page.waitForResponse('**/api/evidence');release();await completed;
 await expect(page.getByRole('dialog')).toContainText('The bench cheat sheet');
 await expect(page.getByRole('dialog')).not.toContainText('Delayed server failure.');
});

test('UI only · mocked HTTP · focus follows the result, modal traps focus, sound is opt-in',async({page})=>{
 await mockShop(page);await page.goto('/');
 await page.getByRole('button',{name:'Menu',exact:true}).click();
 await expect(page.getByRole('button',{name:'Sound: off'})).toHaveAttribute('aria-pressed','false');
 await page.getByRole('button',{name:'Sound: off'}).click();
 await expect(page.getByRole('button',{name:'Sound: on'})).toHaveAttribute('aria-pressed','true');await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Open the shop',exact:true}).click();await page.locator('[data-action="skip-intro"]').click();
 await expect(page.locator('[data-tool="z"]')).toBeVisible();
 await page.keyboard.press('3');await page.keyboard.press('Enter');
 await expect(page.getByRole('heading',{name:'Adjust the repair.'})).toBeFocused();
 await page.getByRole('button',{name:'Help',exact:true}).click();
 await page.keyboard.press('Shift+Tab');
 await expect(page.getByRole('button',{name:'Close dialog'})).toBeVisible();
 expect(await page.locator('dialog').evaluate(d=>d.contains(document.activeElement))).toBe(true);
 await page.keyboard.press('Escape');
 await expect(page.getByRole('button',{name:'Help',exact:true})).toBeFocused();
});
