import {test,expect} from '@playwright/test';
import {mockShop} from './fixtures';

for(const width of [1440,390,320]){
 test(`UI only · request announcements do not move or flash above the workbench · ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:width>1000?1000:844});
  await page.emulateMedia({reducedMotion:'reduce'});
  await mockShop(page);
  await page.goto('/');await page.getByRole('button',{name:'Open the shop',exact:true}).click();
  await page.locator('[data-action="skip-intro"]').click();
  await page.locator('[data-tool="z"]').click();
  const documentBox=(selector:string)=>page.locator(selector).evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height};});
  for(const action of ['probe','diagnose','next'] as const){
   if(action==='diagnose')await page.locator('[data-repair="bit"]').click();
   // Settle normal click auto-scroll before the baseline. Result focus and a
   // shorter next ticket may scroll too; document coordinates detect reflow.
   await page.locator(`[data-action="${action}"]`).scrollIntoViewIfNeeded();
   const scrollBefore=await page.evaluate(()=>scrollY);
   let release!:()=>void,arrived!:()=>void;
   const gate=new Promise<void>(resolve=>{release=resolve;});
   const entered=new Promise<void>(resolve=>{arrived=resolve;});
   await page.route(`**/api/shifts/*/${action}`,async route=>{arrived();await gate;await route.fallback();},{times:1});
   const before=await documentBox('#main');
   const ticketBefore=await documentBox('.paper-ticket');
   const status=page.locator('#live-status');
   try{
    await page.locator(`[data-action="${action}"]`).click();await entered;
    await expect(status).toHaveAttribute('role','status');await expect(status).toHaveAttribute('aria-live','polite');
    await expect(status).toHaveText(action==='probe'?'Running one Qiskit device query…':action==='diagnose'?'Applying the repair…':'Bringing over the next ticket…');
    await expect(status).toBeFocused();
    await expect(page.locator(`[data-action="${action}"]`)).toBeDisabled();
    const pending=await documentBox('#main');
    const ticketPending=await documentBox('.paper-ticket');
    const style=await status.evaluate(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return {position:s.position,clipPath:s.clipPath,width:r.width,height:r.height};});
    await page.screenshot({path:`tests/evidence/status-${action}-pending-${width}.png`});
    expect(pending!.y,'Loading announcements must not add a row above the game').toBe(before!.y);
    expect(ticketPending!.y,'The ticket must stay put throughout the pending request').toBe(ticketBefore!.y);
    expect(await page.evaluate(()=>scrollY),'Pending focus must not scroll the workbench').toBe(scrollBefore);
    expect(style.position).toBe('absolute');expect(style.width).toBe(1);expect(style.height).toBe(1);
    expect(style.clipPath).toBe('inset(50%)');
   }finally{
    // Never leave a held route behind, including when an assertion/capture fails.
    release();
   }
   const expected=action==='probe'?'Adjust the repair.':action==='diagnose'?'It works.':'Choose a probe.';
   if(action==='next')await expect(page.locator('[data-tool="z"]')).toBeVisible();
   else await expect(page.getByRole('heading',{name:expected,exact:true})).toBeFocused();
   await expect(status).not.toHaveText(/Running one|Applying the|Bringing over/);
   const after=await documentBox('#main');expect(after!.y).toBe(before!.y);
  }
 });
}
