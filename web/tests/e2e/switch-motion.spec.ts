import {test,expect,type Page} from '@playwright/test';
import {mockShop} from './fixtures';

// UI-state fixtures: visual response, not evidence of quantum execution.
async function measuredBench(page:Page){
 await mockShop(page,{fullFamily:true});await page.goto('/');
 await page.locator('[data-action="start"]').click();await page.locator('[data-action="skip-intro"]').click();
 await page.locator('[data-tool="bell"]').click();await page.locator('[data-action="probe"]').click();
 await expect(page.locator('.reading-bits')).toHaveText('10');
 await expect.poll(()=>page.locator('.signal-line').evaluateAll(lines=>lines.flatMap(line=>line.getAnimations()).length)).toBe(0);
}

for(const width of [1440,390,320]){
 test(`UI motion · switches visibly move the CRT without evaluating a repair · ${width}px`,async({page},testInfo)=>{
  await page.setViewportSize({width,height:width===1440?1000:844});await page.emulateMedia({reducedMotion:'no-preference'});
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await measuredBench(page);
  const evidence=await page.locator('.signal-screen').innerHTML();
  const posts:string[]=[];page.on('request',request=>{if(request.method()==='POST')posts.push(new URL(request.url()).pathname);});
  for(const dimension of ['bit','phase'] as const){
   for(const on of [true,false]){
    await page.locator(`[data-repair="${dimension}"]`).click();
    await expect(page.locator(`[data-repair="${dimension}"]`)).toHaveAttribute('aria-checked',String(on));
    const trace=page.locator(`[data-signal="${dimension}"] .signal-line`);
    await expect.poll(()=>trace.evaluate(line=>line.getAnimations().length)).toBe(1);
    const motion=await trace.evaluate(line=>{
     const animation=line.getAnimations()[0];animation.pause();animation.currentTime=200;
     return {frames:(animation.effect as KeyframeEffect).getKeyframes(),transform:getComputedStyle(line).transform};
    });
    expect(motion.frames.some(frame=>frame.transform&&frame.transform!=='none')).toBe(true);
    expect(motion.transform).not.toBe('none');
    expect(await page.locator('.signal-screen').innerHTML()).toBe(evidence);
    await expect(page.locator('.reading-bits')).toHaveText('10');
    await expect(page.locator('[data-reasoning],[data-ticket-stamp]')).toHaveCount(0);
    if(on&&dimension==='phase')await page.screenshot({path:testInfo.outputPath(`switch-motion-${width}.png`),fullPage:width<1000});
    await trace.evaluate(async line=>{const animation=line.getAnimations()[0];animation.play();await animation.finished;});
    expect(await trace.evaluate(line=>line.getAnimations().length)).toBe(0);
   }
  }
  expect(posts).toEqual([]);expect(errors).toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
 });
}

test('UI motion · reduced motion and Menu motion-off keep switches functional but traces still',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await measuredBench(page);
 await page.locator('[data-repair="bit"]').click();
 await expect(page.locator('[data-repair="bit"]')).toHaveAttribute('aria-checked','true');
 expect(await page.locator('.signal-line').evaluateAll(lines=>lines.flatMap(line=>line.getAnimations()).length)).toBe(0);
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.locator('[data-action="menu"]').click();await page.locator('[data-action="motion"]').click();await page.locator('[data-action="close"]').click();
 await expect(page.locator('#app')).toHaveAttribute('data-atmo-motion','off');
 await page.locator('[data-repair="phase"]').click();
 await expect(page.locator('[data-repair="phase"]')).toHaveAttribute('aria-checked','true');
 expect(await page.locator('.signal-line').evaluateAll(lines=>lines.flatMap(line=>line.getAnimations()).length)).toBe(0);
 await expect(page.locator('.reading-bits')).toHaveText('10');
});
