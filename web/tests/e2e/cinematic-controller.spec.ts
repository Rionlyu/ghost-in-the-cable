import {test,expect,type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {transformWithOxc} from 'vite';
const src=new URL('../../src/',import.meta.url);
const url=new URL('cinematic.ts',src);
const code=(await transformWithOxc(readFileSync(url,'utf8').replace(/^import ['"]\.\/cinematic\.css['"];?\s*/m,''),url.pathname)).code;
const css=['tokens.css','styles.css','game.css','cinematic.css'].map(name=>readFileSync(new URL(name,src),'utf8').replace(/@import[^;]+;/g,'')).join('\n');
async function harness(page:Page):Promise<void>{
 await page.route('**/__cinema_controller__',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><div id="app"><div class="shell"><header class="masthead">Website header</header><main id="main"></main><footer class="footer">Qiskit simulation</footer></div><dialog></dialog></div>'}));
 await page.goto('/__cinema_controller__');await page.addStyleTag({content:css});
 await page.evaluate(async code=>{const url=URL.createObjectURL(new Blob([code],{type:'text/javascript'}));(window as any).__module=await import(/* @vite-ignore */url);URL.revokeObjectURL(url);},code);
 expect(await page.evaluate(()=>typeof(window as any).__module.createCinematic)).toBe('function');
 await page.evaluate(()=>{
  const w=window as any;w.__enters=0;w.__motion=true;
  const app=document.querySelector<HTMLElement>('#app')!;
  // Explicit geometry fixture: this tests native controller behavior, not art or Qiskit.
  w.__scene=()=>w.__module.cinematicView('<div class="forest-world" style="position:absolute;inset:0"><div data-forest-camera style="width:100%;height:100%;transform-origin:50% 60%;background:linear-gradient(#10231e,#253528)"></div></div>');
  app.querySelector('main')!.innerHTML=w.__scene();
  w.__cinema=w.__module.createCinematic(app,{motion:()=>w.__motion,onEnter:()=>{w.__enters++;app.querySelector('main')!.innerHTML='<h1 id="inside">Inside the shop</h1>';w.__cinema.sync();}});
  w.__cinema.sync();
 });
}

test('native camera travels forward and naturally hands control to the shop once',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});await harness(page);
 const camera=page.locator('[data-forest-camera]');
 expect(await camera.evaluate(el=>el.getAnimations().length)).toBeGreaterThan(0);
 const width=await camera.evaluate(el=>el.getBoundingClientRect().width);
 await page.getByRole('button',{name:'Open the shop',exact:true}).click();
 await expect(page.locator('[data-cinema]')).toHaveAttribute('data-cinema-state','entering');
 await expect(page.getByRole('button',{name:'Skip animation',exact:true})).toBeFocused();
 await camera.evaluate(el=>{for(const a of el.getAnimations())a.currentTime=1000;});
 expect(await camera.evaluate(el=>el.getBoundingClientRect().width)).toBeGreaterThan(width*1.3);
 await expect(page.locator('#inside')).toBeVisible({timeout:5000});
 expect(await page.evaluate(()=>(window as any).__enters)).toBe(1);
 await expect(page.locator('#app')).not.toHaveClass(/cinematic-mode/);
});

for(const method of ['button','Escape']){
 test(`entry ${method} skips immediately and late camera completion cannot enter twice`,async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});await harness(page);
  await page.getByRole('button',{name:'Open the shop',exact:true}).click();
  await page.evaluate(()=>(window as any).__oldEffects=document.querySelector('[data-forest-camera]')!.getAnimations());
  if(method==='button')await page.getByRole('button',{name:'Skip animation',exact:true}).click();else await page.keyboard.press('Escape');
  expect(await page.evaluate(()=>(window as any).__enters)).toBe(1);
  await expect(page.locator('#inside')).toBeVisible();
  await page.evaluate(async()=>{for(const a of(window as any).__oldEffects){a.finish();await a.finished.catch(()=>{});}});
  expect(await page.evaluate(()=>(window as any).__enters)).toBe(1);
 });
}

test('opening game options cancels travel and ignores the old finished animation',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});await harness(page);
 await page.getByRole('button',{name:'Open the shop',exact:true}).click();
 await page.evaluate(()=>(window as any).__oldEffects=document.querySelector('[data-forest-camera]')!.getAnimations());
 await page.getByRole('button',{name:'Menu',exact:true}).click();
 await expect(page.locator('[data-cinema]')).toHaveAttribute('data-cinema-state','ready');
 await expect(page.getByRole('button',{name:'Open the shop',exact:true})).toBeEnabled();
 await page.evaluate(async()=>{for(const a of(window as any).__oldEffects){a.finish();await a.finished.catch(()=>{});}});
 expect(await page.evaluate(()=>(window as any).__enters)).toBe(0);
});

for(const failure of ['unavailable','throws']){
 test(`a native animation API that ${failure} never blocks entry`,async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.addInitScript(failure=>{HTMLElement.prototype.animate=failure==='unavailable'?undefined as any:()=>{throw new Error('Native animation failed')};},failure);
  await harness(page);await page.getByRole('button',{name:'Open the shop',exact:true}).click();
  expect(await page.evaluate(()=>(window as any).__enters)).toBe(1);
  await expect(page.locator('#inside')).toBeVisible();
 });
}

test('a paused native animation has a bounded safety exit',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});await harness(page);
 await page.getByRole('button',{name:'Open the shop',exact:true}).click();
 await page.locator('[data-forest-camera]').evaluate(el=>el.getAnimations().forEach(a=>a.pause()));
 await expect(page.locator('#inside')).toBeVisible({timeout:3600});
 expect(await page.evaluate(()=>(window as any).__enters)).toBe(1);
});

for(const preference of ['system','menu']){
 test(`${preference} motion-off change ends active travel immediately`,async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});await harness(page);
  await page.getByRole('button',{name:'Open the shop',exact:true}).click();
  if(preference==='system')await page.emulateMedia({reducedMotion:'reduce'});else await page.evaluate(()=>{(window as any).__motion=false;(window as any).__cinema.sync();});
  await expect.poll(()=>page.evaluate(()=>(window as any).__enters),{timeout:400}).toBe(1);
 });
}

test('the game title can be entered with Enter without first tabbing through a website',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});await harness(page);
 await page.keyboard.press('Enter');
 await expect(page.locator('[data-cinema]')).toHaveAttribute('data-cinema-state','entering',{timeout:400});
 await page.keyboard.press('Escape');
 expect(await page.evaluate(()=>(window as any).__enters)).toBe(1);
});

test('faded title actions cannot receive invisible keyboard focus during approach',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});await harness(page);
 await page.getByRole('button',{name:'Open the shop',exact:true}).click();
 expect(await page.locator('.cinema-actions button:not(:disabled)').count()).toBe(0);
 await page.getByRole('button',{name:'Menu',exact:true}).click();
 await expect(page.getByRole('button',{name:'Open the shop',exact:true})).toBeEnabled();
 await expect(page.getByRole('button',{name:'Choose a chapter',exact:true})).toBeEnabled();
});
