import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';

// Inspect repeatable native production keyframes, not mocked scene images.
const base=process.env.PLAYWRIGHT_BASE_URL??'http://127.0.0.1:8000';
const evidence=new URL('../tests/evidence/',import.meta.url);
const sizes=[{width:1440,height:900},{width:768,height:1024},{width:390,height:844},{width:320,height:844},{width:844,height:390},{width:568,height:320},{width:640,height:360}];
await mkdir(evidence,{recursive:true});
const browser=await chromium.launch({headless:true});
const records=[];
try{
 for(const viewport of sizes){
  const context=await browser.newContext({viewport,reducedMotion:'no-preference'});
  const page=await context.newPage();
  const errors=[],posts=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  page.on('request',r=>{if(r.method()==='POST')posts.push(new URL(r.url()).pathname);});
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.locator('[data-cinema]').waitFor({state:'visible'});
  await page.getByRole('button',{name:'Open the shop',exact:true}).click();
  const frames=[];
  for(const [name,ms] of [['start',0],['mid',1200],['close',2280]]){
   const actual=await page.evaluate(time=>{
    const scene=document.querySelector('[data-cinema]');
    if(!scene)throw new Error('Cinematic completed before the sampled keyframe');
    for(const a of document.getAnimations()){
     const timing=a.effect?.getTiming();
     if(timing?.iterations===1&&typeof timing.duration==='number'){
      a.pause();a.currentTime=Math.min(time,timing.duration);
     }
    }
    const camera=scene.querySelector('[data-forest-camera]');
    const r=scene.getBoundingClientRect();
    const skip=scene.querySelector('[data-action="cinema-skip"]').getBoundingClientRect();
    return {time,scale:new DOMMatrix(getComputedStyle(camera).transform).a,frame:{x:r.x,y:r.y,width:r.width,height:r.height},viewport:{width:innerWidth,height:innerHeight},scrollWidth:document.documentElement.scrollWidth,skip:{x:skip.x,y:skip.y,width:skip.width,height:skip.height}};
   },ms);
   assert.deepEqual(actual.frame,{x:0,y:0,...viewport});
   assert.deepEqual(actual.viewport,viewport);assert.equal(actual.scrollWidth,viewport.width);
   assert.ok(actual.skip.x>=0&&actual.skip.y>=0&&actual.skip.x+actual.skip.width<=viewport.width&&actual.skip.y+actual.skip.height<=viewport.height);
   assert.deepEqual(posts,[],'No customer session or query exists during travel');
   await page.screenshot({path:new URL(`cinematic-journey-${name}-${viewport.width}.png`,evidence).pathname});
   frames.push({name,...actual});
  }
  await page.locator('[data-forest-camera]').evaluate(el=>{for(const a of el.getAnimations())if(a.playState==='paused')a.play();});
  await page.locator('[data-action="skip-intro"]').waitFor({state:'visible'});
  await page.screenshot({path:new URL(`cinematic-journey-inside-${viewport.width}.png`,evidence).pathname});
  const id=await page.evaluate(()=>localStorage.getItem('ghost-in-the-cable-shift'));
  const response=await page.request.get(`${base}/api/shifts/${encodeURIComponent(id)}`);
  assert.equal(response.status(),200);
  const state=await response.json();
  assert.equal(state.revision,0);assert.equal(state.phase,'choose_tool');assert.equal(state.reading,null);
  assert.deepEqual(posts,['/api/shifts']);assert.deepEqual(errors,[]);
  records.push({viewport,frames,server:{revision:state.revision,phase:state.phase,reading:state.reading},posts,errors});
  await context.close();
 }
 const result={capturedAt:new Date().toISOString(),base,method:'Actual production/native WAAPI and CSS keyframes sampled at 0/1200/2280ms; the final 120ms completes naturally against the real API.',records};
 await writeFile(new URL('cinematic-journey.json',evidence),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result,null,2));
}finally{await browser.close();}
