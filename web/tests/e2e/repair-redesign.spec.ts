import {test,expect} from '@playwright/test';
import {mockShop} from './fixtures';

test('UI only · story starts with a customer, not a wall of controls',async({page})=>{
 await mockShop(page);const posts:string[]=[];
 page.on('request',r=>{if(r.method()==='POST')posts.push(new URL(r.url()).pathname)});
 await page.goto('/');
 await expect(page.locator('header button')).toHaveText(['Help','Menu']);
 await page.getByRole('button',{name:'Open the shop',exact:true}).click();
 await expect(page.getByRole('button',{name:'Skip to repairs',exact:true})).toBeVisible();
 await expect(page.locator('[data-tool],[data-action="probe"]')).toHaveCount(0);
 expect(posts).toEqual(['/api/shifts']);
 await page.keyboard.press('1'); // intro is not a hidden tool picker
 await page.getByRole('button',{name:'Skip to repairs',exact:true}).click();
 await expect(page.getByRole('button',{name:'Test cable',exact:true})).toBeDisabled();
 await expect(page.locator('[data-tool]')).toHaveText(['Bit probe','Phase probe','Linked probe']);
 expect((await page.locator('main').innerText()).split(/\s+/).length).toBeLessThan(125);
 await page.reload();
 await expect(page.locator('[data-tool="z"]')).toBeVisible();
 await expect(page.locator('[data-action="story-continue"]')).toHaveCount(0);
});

test('UI only · switches preserve the original public evidence without a query, then apply the repair',async({page})=>{
 await mockShop(page,{fullFamily:true});await page.goto('/');await page.locator('[data-action="start"]').click();await page.locator('[data-action="skip-intro"]').click();
 await page.locator('[data-tool="z"]').click();await page.locator('[data-action="probe"]').click();
 await expect(page.getByRole('heading',{name:'Adjust the repair.'})).toBeVisible();
 await expect(page.locator('.fault-options,[data-fault]')).toHaveCount(0);
 const bit=page.getByRole('switch',{name:'Flip bit',exact:true});
 const phase=page.getByRole('switch',{name:'Flip phase',exact:true});
 await expect(bit).toHaveAttribute('aria-checked','false');await expect(phase).toHaveAttribute('aria-checked','false');
 await expect(page.locator('[data-action="diagnose"]')).toBeEnabled();
 await expect(page.locator('[data-signal="phase"]')).toContainText('Unknown');
 const before=await page.locator('[data-signal="bit"] path.signal-line').getAttribute('d');
 const mutations:string[]=[];page.on('request',r=>{if(r.method()==='POST')mutations.push(new URL(r.url()).pathname)});
 await bit.click();await expect(bit).toHaveAttribute('aria-checked','true');
 expect(await page.locator('[data-signal="bit"] path.signal-line').getAttribute('d')).toBe(before);
 await expect(page.locator('.preview-label')).toHaveText('Original measurement · unchanged by switches');
 await expect(page.locator('.reading-bits')).toHaveText('1');
 await phase.click();await expect(page.locator('[data-signal="phase"]')).toContainText('Unknown');await phase.click();
 expect(mutations).toEqual([]);
 const sent=page.waitForRequest('**/diagnose');await page.locator('[data-action="diagnose"]').click();
 expect((await sent).postDataJSON()).toEqual({fault:'X',expected_revision:1});
 await expect(page.locator('.instrument')).toHaveAttribute('data-device-state','repaired');
 await expect(page.getByRole('heading',{name:'It works.'})).toBeVisible();
 await expect(page.locator('.debrief .primary')).toHaveCount(1);
});

test('UI only · chapter routes create real sessions and confirm abandoning an active shift',async({page})=>{
 await mockShop(page);await page.goto('/');
 await page.getByRole('button',{name:'Choose a chapter',exact:true}).click();
 await expect(page.getByRole('dialog')).toHaveAccessibleName('Choose a chapter');
 const creating=page.waitForRequest(r=>new URL(r.url()).pathname==='/api/shifts'&&r.method()==='POST');
 await page.locator('[data-route="bits"]').click();
 expect((await creating).postDataJSON()).toEqual({route:'bits'});
 await expect(page.locator('[data-tool="z"]')).toBeVisible();
 await expect(page.locator('[data-action="story-continue"]')).toHaveCount(0);
 await expect(page.getByRole('region',{name:'Shift progress'})).toContainText('1 / 3');
 await expect(page.locator('[data-tool="bell"]')).toBeDisabled();
 const first=await page.evaluate(()=>localStorage.getItem('ghost-in-the-cable-shift'));
 const posts:string[]=[];page.on('request',r=>{if(r.method()==='POST')posts.push(r.url())});
 await page.getByRole('button',{name:'Menu',exact:true}).click();
 await page.getByRole('button',{name:'Choose a chapter',exact:true}).click();
 await page.locator('[data-route="phase"]').click();
 await expect(page.getByRole('dialog')).toContainText('starts a new shift');
 await page.getByRole('button',{name:'Keep this shift',exact:true}).click();
 expect(posts).toEqual([]);expect(await page.evaluate(()=>localStorage.getItem('ghost-in-the-cable-shift'))).toBe(first);
 await page.getByRole('button',{name:'Menu',exact:true}).click();await page.getByRole('button',{name:'Choose a chapter',exact:true}).click();
 await page.locator('[data-route="entanglement"]').click();
 const replacing=page.waitForRequest(r=>new URL(r.url()).pathname==='/api/shifts'&&r.method()==='POST');
 await page.getByRole('button',{name:'Start chapter',exact:true}).click();
 expect((await replacing).postDataJSON()).toEqual({route:'entanglement'});
 await expect(page.locator('[data-tool="bell"]')).toBeEnabled();
 expect(await page.evaluate(()=>localStorage.getItem('ghost-in-the-cable-shift'))).not.toBe(first);
});

test('UI only · focused shifts close with their actual ticket count, not an eight-ticket story receipt',async({page})=>{
 await mockShop(page);await page.goto('/');await page.locator('[data-action="chapters"]').click();await page.locator('[data-route="bits"]').click();
 for(let i=0;i<3;i++){
  await page.locator('[data-tool="z"]').click();await page.locator('[data-action="probe"]').click();
  await expect(page.locator('[data-repair="phase"]')).toHaveCount(0);
  await page.locator('[data-repair="bit"]').click();await page.locator('[data-action="diagnose"]').click();
  await expect(page.locator('.instrument')).toHaveAttribute('data-device-state','repaired');await page.locator('[data-action="next"]').click();
 }
 await expect(page.getByRole('heading',{name:'Shift complete.',exact:true})).toBeVisible();
 await expect(page.locator('.receipt-total')).toContainText('3 / 3');
 await expect(page.locator('.closing')).not.toContainText('Eight');
 await expect(page.locator('.receipt-jobs li')).toHaveCount(3);
});

test('UI only · all-off is sent as I and only the true server result marks failure',async({page})=>{
 await mockShop(page);await page.goto('/');await page.locator('[data-action="start"]').click();await page.locator('[data-action="skip-intro"]').click();
 await page.locator('[data-tool="z"]').click();await page.locator('[data-action="probe"]').click();
 await expect(page.locator('[data-repair="phase"]')).toHaveCount(0);
 await expect(page.locator('.instrument')).toHaveAttribute('data-device-state','preview');
 const sent=page.waitForRequest('**/diagnose');await page.locator('[data-action="diagnose"]').click();
 expect((await sent).postDataJSON()).toEqual({fault:'I',expected_revision:1});
 await expect(page.locator('.instrument')).toHaveAttribute('data-device-state','failed');
 await expect(page.getByRole('heading',{name:'Still a little haunted.'})).toBeVisible();
 await page.locator('[data-action="next"]').click();
 await page.locator('[data-tool="x"]').click();await page.locator('[data-action="probe"]').click();
 await expect(page.locator('[data-repair="bit"]')).toHaveCount(0);
 await expect(page.getByRole('switch',{name:'Flip phase',exact:true})).toHaveAttribute('aria-checked','false');
 await page.keyboard.press('2');
 await expect(page.getByRole('switch',{name:'Flip phase',exact:true})).toHaveAttribute('aria-checked','true');
 await page.keyboard.press('Enter');
 await expect(page.locator('.instrument')).toHaveAttribute('data-device-state','repaired');
});

test('UI only · first customer repair requires an inference, without live answer guidance',async({page})=>{
 await mockShop(page);await page.goto('/');await page.locator('[data-action="start"]').click();await page.locator('[data-action="skip-intro"]').click();
 await page.locator('[data-tool="z"]').click();await page.locator('[data-action="probe"]').click();
 await expect(page.getByRole('switch',{name:'Flip bit',exact:true})).toHaveAttribute('aria-checked','false');
 const evidence=await page.locator('.signal-screen').innerHTML();
 const prompt=await page.locator('.context-tip').innerText();
 await expect(page.locator('.context-tip')).toContainText('Infer the correction from the reading and suspects.');
 await expect(page.locator('.context-tip')).not.toContainText(/Try|aligned|inverted|switching back/);
 await page.locator('[data-repair="bit"]').click();
 await expect(page.getByRole('switch',{name:'Flip bit',exact:true})).toHaveAttribute('aria-checked','true');
 await expect(page.locator('.context-tip')).toHaveText(prompt);
 expect(await page.locator('.signal-screen').innerHTML()).toBe(evidence);
 await expect(page.locator('.preview-label')).toContainText('Original measurement');
});
