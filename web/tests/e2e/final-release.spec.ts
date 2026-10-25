import {test,expect} from '@playwright/test';

test('release check · a very long connection error stays readable on a portrait phone',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});
 const detail='The workshop connection failed while opening your shift. Your cable was not queried. '.repeat(30);
 await page.route('**/api/shifts',route=>route.fulfill({status:503,json:{detail}}));
 await page.goto('/');await page.getByRole('button',{name:'Open the shop',exact:true}).click();
 const alert=page.getByRole('alert');await expect(alert).toContainText(detail);
 const box=await alert.boundingBox();expect(box).not.toBeNull();expect(box!.y).toBeGreaterThanOrEqual(0);expect(box!.y+box!.height).toBeLessThanOrEqual(844);
 const scrolling=await alert.evaluate(el=>({overflow:getComputedStyle(el).overflowY,content:el.scrollHeight,viewport:el.clientHeight}));
 expect(scrolling.overflow).toBe('auto');expect(scrolling.content).toBeGreaterThan(scrolling.viewport);
 await alert.getByRole('button',{name:'Retry',exact:true}).scrollIntoViewIfNeeded();await expect(alert.getByRole('button',{name:'Retry',exact:true})).toBeInViewport();
});
