import {test, expect} from '@playwright/test';
import {mockShop} from './fixtures';

test('the illustrated shop introduces its real rules and an accessible field guide', async ({page}) => {
  await page.goto('/');
  await expect(page.getByRole('heading',{name:/Ghost\s*in the\s*Cable/i})).toBeVisible();
  await expect(page.getByRole('button',{name:'Open the shop',exact:true})).toBeVisible();
  await expect(page.getByRole('region',{name:'The forest outside the midnight repair shop'})).toBeVisible();
  await expect(page.locator('.forest-world')).toBeVisible();
  await page.getByRole('button',{name:'Help',exact:true}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('heading',{name:'Help'})).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText('repair switches');
  await expect(page.getByRole('dialog')).not.toContainText('choose a listed fault');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('button',{name:'Help',exact:true})).toBeFocused();
});

test('UI only · mocked HTTP · one probe, concealed circuit, diagnosis, then debrief', async ({page})=>{
 await mockShop(page);
 await page.goto('/');
 await page.getByRole('button',{name:'Open the shop',exact:true}).click();await page.locator('[data-action="skip-intro"]').click();
 await expect(page.getByRole('heading',{name:'The unquiet doorbell'})).toBeVisible();
 await expect(page.locator('pre')).toHaveCount(0);
 await page.locator('[data-tool="bell"]').click();
 await page.getByRole('button',{name:'Test cable'}).click();
 await expect(page.getByRole('heading',{name:'Adjust the repair.'})).toBeVisible();
 await expect(page.locator('.reading-bits')).toHaveText('10');
 await expect(page.locator('[data-action="circuit"]')).toHaveCount(0);
 await page.locator('[data-repair="bit"]').click();
 await page.getByRole('button',{name:'Apply repair'}).click();
 await expect(page.getByRole('heading',{name:'It works.'})).toBeVisible();
 await page.getByRole('button',{name:'Inspect circuit'}).click();
 await expect(page.getByRole('dialog')).toContainText('TEST CIRCUIT');
 await expect(page.getByRole('dialog')).toContainText('Before decoding');
});