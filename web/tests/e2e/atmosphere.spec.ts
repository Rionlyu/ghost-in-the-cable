import {test,expect,type Page} from '@playwright/test';
import {readFileSync,existsSync} from 'node:fs';
import {env} from 'node:process';
import {transformWithOxc} from 'vite';

// A server-independent DOM harness: production module + actual project CSS. No
// application state, quantum result or Web Audio implementation is mocked here.
const src=new URL('../../src/',import.meta.url);
const moduleURL=new URL('atmosphere.ts',src);
const moduleCode=existsSync(moduleURL)?(await transformWithOxc(readFileSync(moduleURL,'utf8').replace(/^import ['"]\.\/atmosphere\.css['"];?\s*/m,''),moduleURL.pathname)).code:'';
const styles=['tokens.css','styles.css','game.css','atmosphere.css'].map(name=>{
 const url=new URL(name,src);return existsSync(url)?readFileSync(url,'utf8').replace(/@import[^;]+;/g,''):'';
}).join('\n');

const runtimeErrors=new WeakMap<Page,string[]>();
test.beforeEach(async({page})=>{const errors:string[]=[];runtimeErrors.set(page,errors);page.on('pageerror',error=>errors.push(error.message));});
test.afterEach(async({page})=>{expect(runtimeErrors.get(page)??[],'uncaught browser errors').toEqual([]);});

async function installAudioMeter(page:Page):Promise<void>{
 await page.addInitScript(()=>{
  const w=window as any;const Native=window.AudioContext;
  const meter=w.__audio={contexts:[] as AudioContext[],gestures:[] as boolean[],starts:[] as any[],stops:0,connections:new Map<AudioNode,Set<AudioNode>>(),gains:[] as GainNode[]};
  const connect=AudioNode.prototype.connect,disconnect=AudioNode.prototype.disconnect;
  AudioNode.prototype.connect=function(...args:any[]){const result=(connect as any).apply(this,args);if(args[0] instanceof AudioNode){if(!meter.connections.has(this))meter.connections.set(this,new Set());meter.connections.get(this)!.add(args[0]);}return result;};
  AudioNode.prototype.disconnect=function(...args:any[]){const result=(disconnect as any).apply(this,args);if(!args.length)meter.connections.delete(this);else meter.connections.get(this)?.delete(args[0]);return result;};
  w.AudioContext=new Proxy(Native,{construct(Target,args){
   const context=Reflect.construct(Target,args) as AudioContext;meter.contexts.push(context);meter.gestures.push(navigator.userActivation.isActive);
   const gain=context.createGain.bind(context);context.createGain=()=>{const node=gain();meter.gains.push(node);return node;};
   for(const method of ['createOscillator','createBufferSource'] as const){
    const create=context[method].bind(context);(context as any)[method]=()=>{
     const source=create();const start=source.start.bind(source),stop=source.stop.bind(source);
     (source as any).start=(...when:any[])=>{meter.starts.push({kind:method,loop:(source as AudioBufferSourceNode).loop,nonzero:source instanceof AudioBufferSourceNode&&source.buffer?source.buffer.getChannelData(0).some(sample=>sample!==0):null});return (start as any)(...when);};
     source.stop=(when?:number)=>{meter.stops++;return stop(when);};return source;
    };
   }
   return context;
  }});
 });
}

async function harness(page:Page):Promise<void>{
 await installAudioMeter(page);
 await page.route('**/__atmosphere_harness__',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><head><title>Atmosphere test harness</title><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div class="shell"><main id="stage"></main></div></body></html>'}));
 await page.goto('/__atmosphere_harness__');
 await page.addStyleTag({content:styles});
 await page.evaluate(async code=>{
  const url=URL.createObjectURL(new Blob([code],{type:'text/javascript'}));
  (window as any).__exports=await import(/* @vite-ignore */ url);URL.revokeObjectURL(url);
 },moduleCode);
 await expect.poll(()=>page.evaluate(()=>typeof (window as any).__exports.createAtmosphere)).toBe('function');
 await page.evaluate(()=>{
  const w=window as any;const root=document.querySelector<HTMLElement>('#stage')!;
  w.__atmo=w.__exports.createAtmosphere(root);
  w.__draw=(state:any)=>{
   root.innerHTML=state.ticketKey?'<div class="workbench"><article class="paper-ticket"><div class="paper-top">TICKET 01</div><h2>Porch lamp</h2><p class="customer">Mara</p><p class="ticket-description">The porch has gone dark.</p><div class="ticket-terms">1 test</div></article><div class="bench-space"><section class="instrument"><div class="signal-screen"><svg viewBox="0 0 560 88"><path class="signal-line" d="M0 44Q35 0 70 44T140 44T210 44T280 44T350 44T420 44T490 44T560 44"/></svg><p class="preview-label">Preview · not tested</p></div></section><button class="primary">Apply repair</button></div></div>':w.__exports.entranceView();
   w.__atmo.sync(state);
  };
 });
}

test('Atmosphere · ticket arrives once; only a confirmed resolution receives honest ink',async({page})=>{
 await harness(page);
 await page.evaluate(()=>{(window as any).__draw({ticketKey:'shift:public-ticket',phase:'choose_tool',correct:null});});
 await expect(page.locator('.paper-ticket')).toHaveAttribute('data-atmo-arrival','new');
 await expect(page.locator('[data-ticket-stamp]')).toHaveCount(0);
 await page.evaluate(()=>{(window as any).__draw({ticketKey:'shift:public-ticket',phase:'diagnose',correct:true});});
 await expect(page.locator('.paper-ticket')).not.toHaveAttribute('data-atmo-arrival','new');
 await expect(page.locator('[data-ticket-stamp]')).toHaveCount(0); // never infer success from a switch or speculative value
 await page.evaluate(()=>{(window as any).__draw({ticketKey:'shift:public-ticket',phase:'resolved',correct:null});});
 await expect(page.locator('[data-ticket-stamp]')).toHaveCount(0);
 await page.evaluate(()=>{(window as any).__draw({ticketKey:'shift:public-ticket',phase:'resolved',correct:true});});
 await expect(page.locator('.paper-ticket [data-ticket-stamp="repaired"]')).toHaveText('Repaired');
 await expect(page.locator('[data-ticket-stamp]')).toHaveAttribute('data-atmo-impact','new');
 await page.evaluate(()=>{(window as any).__draw({ticketKey:'shift:public-ticket',phase:'resolved',correct:true});});
 await expect(page.locator('[data-ticket-stamp]')).toHaveCount(1);
 await expect(page.locator('[data-ticket-stamp]')).not.toHaveAttribute('data-atmo-impact','new');
 await page.evaluate(()=>{
  (window as any).__draw({ticketKey:null,phase:'tutorial',correct:null});
  (window as any).__draw({ticketKey:'shift:public-ticket',phase:'resolved',correct:true});
 });
 await expect(page.locator('.paper-ticket')).not.toHaveAttribute('data-atmo-arrival','new');
 await expect(page.locator('[data-ticket-stamp]')).not.toHaveAttribute('data-atmo-impact','new');
 await page.evaluate(()=>{(window as any).__draw({ticketKey:'shift:next-ticket',phase:'choose_tool',correct:null});});
 await expect(page.locator('.paper-ticket')).toHaveAttribute('data-atmo-arrival','new');
 await expect(page.locator('[data-ticket-stamp]')).toHaveCount(0);
 await page.evaluate(()=>{(window as any).__draw({ticketKey:'shift:next-ticket',phase:'resolved',correct:false});});
 await expect(page.locator('[data-ticket-stamp="failed"]')).toHaveText('Not fixed');
 await expect(page.locator('[data-ticket-stamp]')).toHaveAttribute('data-atmo-impact','new');
 await page.evaluate(()=>{(window as any).__draw({ticketKey:'saved:already-resolved',phase:'resolved',correct:true});});
 await expect(page.locator('[data-ticket-stamp="repaired"]')).toBeVisible();
 await expect(page.locator('[data-ticket-stamp]')).not.toHaveAttribute('data-atmo-impact','new');
 await expect(page.locator('.paper-ticket')).not.toHaveAttribute('data-atmo-arrival','new');
});

test('Atmosphere · motion preferences preserve the fully revealed scene and final paper state',async({page},testInfo)=>{
 await page.emulateMedia({reducedMotion:'no-preference'});await harness(page);
 await expect.poll(()=>page.evaluate(()=>typeof (window as any).__atmo.setMotion)).toBe('function');
 await page.evaluate(()=>{(window as any).__draw({ticketKey:null,phase:'landing',correct:null});});
 await expect(page.locator('#stage')).toHaveAttribute('data-atmo-motion','on');
 await expect(page.locator('.atmo-scene')).toHaveAttribute('data-atmo-reveal','new');
 for(const width of [1440,1000,768,520,390,320]){
  await page.setViewportSize({width,height:width>=760?1000:844});
  const layout=await page.evaluate(()=>{
   const controls=[...document.querySelectorAll<HTMLButtonElement>('.atmo-entrance button')];
   return {overflow:document.documentElement.scrollWidth>innerWidth,
    controls:controls.map(button=>{const r=button.getBoundingClientRect();return {x:r.x,right:r.right,bottom:r.bottom,height:r.height,visible:getComputedStyle(button).visibility,opacity:getComputedStyle(button).opacity,hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===button||button.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))};})};
  });
  expect(layout.overflow,`${width}px overflow`).toBe(false);
  for(const control of layout.controls){expect(control.x).toBeGreaterThanOrEqual(0);expect(control.right).toBeLessThanOrEqual(width);expect(control.bottom).toBeLessThanOrEqual(width>=760?1000:844);expect(control.height).toBeGreaterThanOrEqual(44);expect(control.visible).toBe('visible');expect(control.opacity).toBe('1');expect(control.hit).toBe(true);}
 }
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:testInfo.outputPath('woods-390.png'),fullPage:true});
 await page.evaluate(()=>{(window as any).__draw({ticketKey:null,phase:'landing',correct:null});});
 await expect(page.locator('.atmo-scene')).not.toHaveAttribute('data-atmo-reveal','new');
 await page.emulateMedia({reducedMotion:'reduce'});
 await expect(page.locator('#stage')).toHaveAttribute('data-atmo-motion','off');
 expect(await page.locator('.atmo-house').evaluate(element=>getComputedStyle(element).opacity)).toBe('1');
 expect(await page.locator('.atmo-scene').evaluate(element=>element.getAnimations({subtree:true}).length)).toBe(0);
 expect(await page.evaluate(()=>(window as any).__atmo.motion)).toBe(false);
 await page.evaluate(()=>{(window as any).__atmo.setMotion(true);(window as any).__draw({ticketKey:'public:t',phase:'choose_tool',correct:null});(window as any).__draw({ticketKey:'public:t',phase:'resolved',correct:false});});
 await expect(page.locator('[data-ticket-stamp]')).toBeVisible();
 expect(await page.locator('[data-ticket-stamp]').evaluate(element=>getComputedStyle(element).animationName)).toBe('none');
 expect(await page.locator('.paper-ticket').evaluate(element=>getComputedStyle(element).animationName)).toBe('none');
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.evaluate(()=>{(window as any).__atmo.setMotion(false);});
 await expect(page.locator('#stage')).toHaveAttribute('data-atmo-motion','off');
 await page.screenshot({path:testInfo.outputPath('failed-stamp-390.png'),fullPage:true});
});


test('Atmosphere · native Web Audio is opt-in, quiet, bounded, muted and disposed',async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await harness(page);
 await expect.poll(()=>page.evaluate(()=>typeof (window as any).__atmo.setSound)).toBe('function');
 await page.evaluate(()=>{
  const w=window as any;w.__draw({ticketKey:'public:audio',phase:'choose_tool',correct:null});
  for(const kind of ['probe','repair','step'])w.__atmo.pulse(kind);
 });
 expect(await page.evaluate(()=>(window as any).__audio.contexts.length)).toBe(0);
 expect(await page.evaluate(()=>(window as any).__atmo.sound)).toBe(false);
 await page.evaluate(()=>{
  const button=document.createElement('button');button.id='opt-in';button.textContent='Sound on';
  button.onclick=()=>{(window as any).__soundResult=(window as any).__atmo.setSound(true);};document.body.prepend(button);
 });
 await page.locator('#opt-in').click();
 expect(await page.evaluate(()=>(window as any).__soundResult)).toBe(true);
 expect(await page.evaluate(()=>(window as any).__atmo.sound)).toBe(true);
 expect(await page.evaluate(()=>(window as any).__audio.contexts.map((context:AudioContext)=>context.state))).toEqual(['running']);
 expect(await page.evaluate(()=>(window as any).__audio.gestures)).toEqual([true]);
 const baseline=await page.evaluate(()=>{
  const meter=(window as any).__audio;
  return {starts:meter.starts.length,noise:meter.starts.some((start:any)=>start.kind==='createBufferSource'&&start.nonzero&&start.loop),edges:meter.connections.size,gains:meter.gains.map((node:GainNode)=>node.gain.value)};
 });
 expect(baseline.starts).toBeGreaterThanOrEqual(2);expect(baseline.noise).toBe(true);
 expect(Math.max(...baseline.gains)).toBeLessThanOrEqual(.2);
 await page.evaluate(()=>{for(let i=0;i<40;i++)(window as any).__atmo.pulse(i%2?'probe':'repair');});
 expect(await page.evaluate(()=>(window as any).__audio.connections.size)).toBeLessThanOrEqual(baseline.edges+16);
 await expect.poll(()=>page.evaluate(()=>(window as any).__audio.connections.size)).toBe(baseline.edges);
 await page.evaluate(()=>{(window as any).__draw({ticketKey:'public:audio',phase:'resolved',correct:true});});
 const stamped=await page.evaluate(()=>(window as any).__audio.starts.length);
 await page.evaluate(()=>{(window as any).__draw({ticketKey:'public:audio',phase:'resolved',correct:true});});
 expect(await page.evaluate(()=>(window as any).__audio.starts.length)).toBe(stamped);
 expect(await page.evaluate(()=>(window as any).__atmo.setSound(false))).toBe(false);
 expect(await page.evaluate(()=>(window as any).__atmo.sound)).toBe(false);
 expect(await page.evaluate(()=>(window as any).__audio.contexts[0].state)).toBe('suspended');
 expect(await page.evaluate(()=>(window as any).__audio.connections.size)).toBe(0);
 const muted=await page.evaluate(()=>(window as any).__audio.starts.length);
 await page.evaluate(()=>{(window as any).__atmo.pulse('step');});
 expect(await page.evaluate(()=>(window as any).__audio.starts.length)).toBe(muted);
 await page.evaluate(()=>{(window as any).__atmo.dispose();(window as any).__atmo.dispose();});
 await expect.poll(()=>page.evaluate(()=>(window as any).__audio.contexts[0].state)).toBe('closed');
 expect(await page.evaluate(()=>(window as any).__atmo.setSound(true))).toBe(false);
 expect(await page.evaluate(()=>(window as any).__audio.contexts.length)).toBe(1);
 expect(errors).toEqual([]);
});

test('Atmosphere · latest sound intent wins delayed resume failures and pending mute',async({page})=>{
 await harness(page);
 await page.evaluate(()=>{
  const w=window as any;const button=document.createElement('button');button.id='race';button.textContent='Enable sound';
  button.onclick=()=>{w.__enabled=w.__atmo.setSound(true);};document.body.prepend(button);
 });
 await page.locator('#race').click();expect(await page.evaluate(()=>(window as any).__enabled)).toBe(true);
 await page.evaluate(()=>{
  const w=window as any,context=w.__audio.contexts[0];w.__nativeResume=context.resume.bind(context);
  w.__resumes=[];context.resume=()=>{const native=w.__nativeResume();return new Promise((resolve,reject)=>w.__resumes.push({pass:()=>native.then(resolve,reject),fail:()=>reject(new Error('old resume rejected'))}));};
  document.querySelector<HTMLButtonElement>('#race')!.onclick=()=>{w.__older=w.__atmo.setSound(true);w.__newer=w.__atmo.setSound(true);};
 });
 await page.locator('#race').click();
 await page.evaluate(()=>{(window as any).__resumes[1].pass();});
 expect(await page.evaluate(()=>(window as any).__newer)).toBe(true);
 await page.evaluate(()=>{(window as any).__resumes[0].fail();});
 expect(await page.evaluate(()=>(window as any).__older)).toBe(true);
 expect(await page.evaluate(()=>(window as any).__atmo.sound)).toBe(true);
 await page.evaluate(()=>{
  const w=window as any,context=w.__audio.contexts[0];context.resume=w.__nativeResume;
  const suspend=context.suspend.bind(context);
  context.suspend=()=>new Promise((resolve,reject)=>{w.__releaseMute=()=>suspend().then(resolve,reject);});
  w.__muting=w.__atmo.setSound(false);
  document.querySelector<HTMLButtonElement>('#race')!.onclick=()=>{w.__reenabling=w.__atmo.setSound(true);};
 });
 await page.locator('#race').click();
 await page.evaluate(()=>{(window as any).__releaseMute();});
 expect(await page.evaluate(()=>(window as any).__reenabling)).toBe(true);
 expect(await page.evaluate(()=>(window as any).__atmo.sound)).toBe(true);
 await expect.poll(()=>page.evaluate(()=>(window as any).__audio.contexts[0].state)).toBe('running');
 expect(await page.evaluate(()=>(window as any).__audio.connections.size)).toBeGreaterThan(0);
 await page.evaluate(()=>{(window as any).__atmo.dispose();});
});

test('Atmosphere · hidden pages disconnect every voice without reviving a muted preference',async({page})=>{
 await harness(page);
 await page.evaluate(()=>{
  const w=window as any;const button=document.createElement('button');button.id='visibility-sound';button.textContent='Sound on';
  button.onclick=()=>{w.__enabled=w.__atmo.setSound(true);};document.body.prepend(button);
  // Visibility is controlled, but all audio nodes and operations remain native.
  w.__visibility=(hidden:boolean)=>{Object.defineProperty(document,'hidden',{configurable:true,value:hidden});document.dispatchEvent(new Event('visibilitychange'));};
 });
 await page.locator('#visibility-sound').click();expect(await page.evaluate(()=>(window as any).__enabled)).toBe(true);
 await page.evaluate(()=>{(window as any).__visibility(true);});
 await expect(page.locator('#stage')).toHaveAttribute('data-atmo-visible','off');
 expect(await page.evaluate(()=>(window as any).__audio.connections.size)).toBe(0);
 expect(await page.evaluate(()=>(window as any).__atmo.sound)).toBe(true);
 const hiddenStarts=await page.evaluate(()=>(window as any).__audio.starts.length);
 await page.evaluate(()=>{(window as any).__atmo.pulse('probe');});
 expect(await page.evaluate(()=>(window as any).__audio.starts.length)).toBe(hiddenStarts);
 await page.evaluate(()=>{(window as any).__visibility(false);});
 await expect(page.locator('#stage')).toHaveAttribute('data-atmo-visible','on');
 expect(await page.evaluate(()=>(window as any).__audio.contexts.length)).toBe(1);
 expect(await page.evaluate(()=>(window as any).__audio.connections.size)).toBeGreaterThan(0);
 await page.evaluate(async()=>{const w=window as any;w.__visibility(true);await w.__atmo.setSound(false);w.__visibility(false);});
 expect(await page.evaluate(()=>(window as any).__audio.contexts[0].state)).toBe('suspended');
 expect(await page.evaluate(()=>(window as any).__audio.connections.size)).toBe(0);
 await page.evaluate(()=>{(window as any).__atmo.dispose();(window as any).__visibility(true);});
 await expect(page.locator('#stage')).toHaveAttribute('data-atmo-visible','on'); // listener was removed
});

test('Atmosphere · a response pulse follows the replacement DOM, never creates a result, and stops with motion',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});await harness(page);
 await page.evaluate(()=>{
  const w=window as any;w.__draw({ticketKey:'public:pulse',phase:'choose_tool',correct:null});
  w.__atmo.pulse('probe'); // The real main renderer pulses just before finish() replaces its DOM.
  w.__draw({ticketKey:'public:pulse',phase:'diagnose',correct:null});
 });
 expect(await page.locator('.signal-line').evaluate(element=>element.getAnimations().length)).toBe(1);
 await expect(page.locator('[data-ticket-stamp]')).toHaveCount(0);
 await page.evaluate(()=>{(window as any).__atmo.setMotion(false);});
 expect(await page.locator('.signal-line').evaluate(element=>element.getAnimations().length)).toBe(0);
 await page.evaluate(()=>{(window as any).__atmo.pulse('probe');});
 expect(await page.locator('.signal-line').evaluate(element=>element.getAnimations().length)).toBe(0);
 expect(await page.evaluate(()=>(window as any).__audio.contexts.length)).toBe(0);
});


test('Atmosphere · pending enable cannot resurrect sound after off or disposal',async({page})=>{
 await harness(page);
 await page.evaluate(()=>{
  const w=window as any;const button=document.createElement('button');button.id='late';button.textContent='Sound';
  button.onclick=()=>{w.__pending=w.__atmo.setSound(true);};document.body.prepend(button);
 });
 await page.locator('#late').click();await page.evaluate(()=>(window as any).__pending);
 await page.evaluate(()=>{
  const w=window as any,context=w.__audio.contexts[0],resume=context.resume.bind(context);
  context.resume=()=>new Promise((resolve,reject)=>{w.__releaseResume=()=>resume().then(resolve,reject);});
 });
 await page.locator('#late').click();
 expect(await page.evaluate(()=>(window as any).__atmo.setSound(false))).toBe(false);
 await page.evaluate(()=>{(window as any).__releaseResume();});
 expect(await page.evaluate(()=>(window as any).__pending)).toBe(false);
 expect(await page.evaluate(()=>(window as any).__audio.contexts[0].state)).toBe('suspended');
 expect(await page.evaluate(()=>(window as any).__audio.connections.size)).toBe(0);
 await page.locator('#late').click();
 await page.evaluate(()=>{const w=window as any;w.__atmo.dispose();w.__releaseResume();});
 expect(await page.evaluate(()=>(window as any).__pending)).toBe(false);
 await expect.poll(()=>page.evaluate(()=>(window as any).__audio.contexts[0].state)).toBe('closed');
});

test('Atmosphere · unavailable audio fails quietly and a rejected unlock remains muted',async({page})=>{
 await harness(page);
 await page.evaluate(()=>{(window as any).__savedContext=window.AudioContext;(window as any).AudioContext=undefined;});
 expect(await page.evaluate(()=>(window as any).__atmo.setSound(true))).toBe(false);
 expect(await page.evaluate(()=>(window as any).__atmo.sound)).toBe(false);
 await page.evaluate(()=>{
  const w=window as any;w.AudioContext=w.__savedContext;
  const Native=w.AudioContext;w.AudioContext=new Proxy(Native,{construct(Target,args){const context=Reflect.construct(Target,args) as AudioContext;context.resume=()=>Promise.reject(new Error('unlock refused'));return context;}});
  const button=document.createElement('button');button.id='refused';button.textContent='Sound';button.onclick=()=>{w.__refused=w.__atmo.setSound(true);};document.body.prepend(button);
 });
 await page.locator('#refused').click();
 expect(await page.evaluate(()=>(window as any).__refused)).toBe(false);
 expect(await page.evaluate(()=>(window as any).__audio.connections.size)).toBe(0);
 expect(await page.evaluate(()=>(window as any).__audio.contexts[0].state)).toBe('suspended');
 await page.evaluate(()=>{(window as any).__atmo.dispose();});
});

test('Atmosphere · consumed arrivals and ink never replay when motion is re-enabled',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});await harness(page);
 await page.evaluate(()=>{const w=window as any;w.__atmo.setMotion(false);w.__draw({ticketKey:'public:static',phase:'choose_tool',correct:null});w.__draw({ticketKey:'public:static',phase:'resolved',correct:true});w.__atmo.setMotion(true);});
 expect(await page.locator('.paper-ticket').evaluate(element=>element.getAnimations().length)).toBe(0);
 expect(await page.locator('[data-ticket-stamp]').evaluate(element=>element.getAnimations().length)).toBe(0);
 await page.evaluate(()=>{const w=window as any;w.__draw({ticketKey:'public:animated',phase:'choose_tool',correct:null});w.__draw({ticketKey:'public:animated',phase:'resolved',correct:false});});
 await expect(page.locator('[data-ticket-stamp]')).toHaveAttribute('data-atmo-impact','new');
 await page.evaluate(async()=>{await Promise.all(document.querySelector('[data-ticket-stamp]')!.getAnimations().map(animation=>animation.finished.catch(()=>{})));});
 await page.evaluate(()=>{const w=window as any;w.__atmo.setMotion(false);w.__atmo.setMotion(true);});
 expect(await page.locator('[data-ticket-stamp]').evaluate(element=>element.getAnimations().length)).toBe(0);
 await expect(page.locator('[data-ticket-stamp="failed"]')).toBeVisible();
});

test('Atmosphere · LIVE integration uses real returned readings for repaired and failed stamps',async({page},testInfo)=>{
 test.skip(!env.ATMOSPHERE_LIVE,'Opt in with ATMOSPHERE_LIVE=1 against a running app + local simulator.');
 await installAudioMeter(page);await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/');
 await expect(page.locator('.forest-world')).toBeVisible();
 expect(await page.evaluate(()=>(window as any).__audio.contexts.length)).toBe(0);
 for(const width of [1440,768,390,320]){
  await page.setViewportSize({width,height:width>=760?1000:844});
  const metrics=await page.locator('[data-cinema] button:visible').evaluateAll(buttons=>buttons.map(button=>{const r=button.getBoundingClientRect();return {left:r.left,right:r.right,bottom:r.bottom,height:r.height};}));
  expect(metrics.length).toBeGreaterThanOrEqual(4);
  for(const rect of metrics){expect(rect.left).toBeGreaterThanOrEqual(0);expect(rect.right).toBeLessThanOrEqual(width);expect(rect.bottom).toBeLessThanOrEqual(width>=760?1000:844);expect(rect.height).toBeGreaterThanOrEqual(44);}
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
  await page.screenshot({path:testInfo.outputPath(`live-woods-${width}.png`),fullPage:true});
 }
 await page.locator('[data-action="chapters"]').click();await page.locator('[data-route="bits"]').click();
 await expect(page.locator('.paper-ticket')).toHaveAttribute('data-atmo-arrival','new');
 await page.locator('[data-tool="z"]').click();
 await expect(page.locator('.paper-ticket')).not.toHaveAttribute('data-atmo-arrival','new');
 await page.locator('[data-action="probe"]').click();
 await expect(page.locator('.reading-bits')).toHaveText(/^[01]$/);
 await expect(page.locator('[data-ticket-stamp]')).toHaveCount(0);
 const bit=(await page.locator('.reading-bits').innerText()).trim();
 if(bit==='1')await page.locator('[data-repair="bit"]').click();
 await expect(page.locator('[data-ticket-stamp]')).toHaveCount(0);
 await page.locator('[data-action="diagnose"]').click();
 await expect(page.locator('[data-ticket-stamp="repaired"]')).toHaveText('Repaired');
 await expect(page.locator('.instrument')).toHaveAttribute('data-device-state','repaired');
 // Final feedback remains present without motion; no timeout determines outcome.
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const width of [1440,768,390,320]){
  await page.setViewportSize({width,height:width>=760?1000:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
  await page.screenshot({path:testInfo.outputPath(`live-repaired-${width}.png`),fullPage:true});
 }
 await page.getByRole('button',{name:'Menu',exact:true}).click();
 await expect(page.locator('[data-action="sound"]')).toHaveText('Sound: off');
 await page.locator('[data-action="sound"]').click();
 await expect(page.locator('[data-action="sound"]')).toHaveText('Sound: on');
 expect(await page.evaluate(()=>(window as any).__audio.gestures)).toEqual([true]);
 await page.locator('[data-action="sound"]').click();
 await expect(page.locator('[data-action="sound"]')).toHaveText('Sound: off');
 expect(await page.evaluate(()=>(window as any).__audio.contexts[0].state)).toBe('suspended');
 expect(await page.evaluate(()=>(window as any).__audio.connections.size)).toBe(0);
 await page.locator('[data-action="close"]').click();await page.locator('[data-action="next"]').click();
 await page.locator('[data-tool="z"]').click();await page.locator('[data-action="probe"]').click();
 await expect(page.locator('.reading-bits')).toHaveText(/^[01]$/);
 const next=(await page.locator('.reading-bits').innerText()).trim();
 // Deliberately choose the opposite repair, using only the measured public bit.
 if(next==='0')await page.locator('[data-repair="bit"]').click();
 await page.locator('[data-action="diagnose"]').click();
 await expect(page.locator('[data-ticket-stamp="failed"]')).toHaveText('Not fixed');
 await expect(page.locator('.instrument')).toHaveAttribute('data-device-state','failed');
 await page.screenshot({path:testInfo.outputPath('live-failed-320.png'),fullPage:true});
});
