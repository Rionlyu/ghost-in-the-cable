import {test,expect} from '@playwright/test';
import type {Page} from '@playwright/test';
import {mockShop} from './fixtures';

// These cases exercise UI-state fixtures, not Qiskit physics or novice comprehension.
const answerGuidance=/Try the (Bit|Phase|Linked) probe|Keep a reference with|Try the switch|switching back|Preview aligned|Aim for aligned/;
async function chapter(page:Page,route:'bits'|'phase'|'entanglement'){
 await page.goto('/');
 await page.getByRole('button',{name:'Choose a chapter',exact:true}).click();
 await page.locator(`[data-route="${route}"]`).click();
 await expect(page.locator('.paper-ticket')).toBeVisible();
}
async function noPrematureAnswer(page:Page){
 await expect(page.locator('main')).not.toContainText(answerGuidance);
 await expect(page.locator('main')).not.toContainText(/Revealed:|Exact output probabilities|TEST CIRCUIT|UI fixture explanation/);
 await expect(page.locator('[data-reasoning]')).toHaveCount(0);
}

for(const fixture of [
 {route:'bits' as const,suspects:['I · No fault','X · Bit flip']},
 {route:'phase' as const,suspects:['I · No fault','Z · Phase flip']},
 {route:'entanglement' as const,suspects:['I · No fault','X · Bit flip','Z · Phase flip','Y · Both flips']},
]){
 test(`UI reasoning · ${fixture.route} shows suspects without selecting an experiment`,async({page})=>{
  await mockShop(page);await chapter(page,fixture.route);
  for(const suspect of fixture.suspects)await expect(page.locator('.ticket-family')).toContainText(suspect);
  await expect(page.locator('.context-tip')).toContainText('Which probe separates these suspects?');
  await expect(page.locator('[data-tool][aria-pressed="true"]')).toHaveCount(0);
  await expect(page.locator('[data-action="probe"]')).toBeDisabled();
  await noPrematureAnswer(page);
  await page.locator('[data-tool="z"]').click();
  await expect(page.locator('.context-tip')).toContainText('Reads bit; phase stays unknown. Costs 0 link tokens.');
  await page.locator('[data-tool="x"]').click();
  await expect(page.locator('.context-tip')).toContainText('Reads phase; bit stays unknown. Costs 0 link tokens.');
  if(fixture.route==='entanglement'){
   await page.locator('[data-tool="bell"]').click();
   await expect(page.locator('.context-tip')).toContainText('joint decoder. Costs 1 link token.');
  }
  await noPrematureAnswer(page);
 });
}

test('UI reasoning · the keeper never supplies the next customer probe',async({page})=>{
 await mockShop(page);await page.goto('/');await page.locator('[data-action="start"]').click();await page.locator('[data-action="skip-intro"]').click();
 await page.locator('[data-tool="z"]').click();await page.locator('[data-action="probe"]').click();
 await page.locator('[data-repair="bit"]').click();await page.locator('[data-action="diagnose"]').click();await page.locator('[data-action="next"]').click();
 await expect(page.locator('.ticket-family')).toContainText('Z · Phase flip');
 await expect(page.locator('.context-tip')).toContainText('Which probe separates these suspects?');
 await noPrematureAnswer(page);
});

test('UI reasoning · an unsuitable Phase probe returns 0 without proving the bit cable clean',async({page})=>{
 await mockShop(page);await chapter(page,'bits');
 await page.locator('[data-tool="x"]').click();await page.locator('[data-action="probe"]').click();
 await expect(page.locator('.reading-bits')).toHaveText('0');
 await expect(page.locator('[data-signal="bit"]')).toContainText('Unknown');
 await expect(page.locator('.context-tip')).toContainText('Some information was not measured.');
 const evidence=await page.locator('.signal-screen').innerHTML();
 const tip=await page.locator('.context-tip').innerText();
 const mutations:string[]=[];page.on('request',request=>{if(request.method()==='POST')mutations.push(new URL(request.url()).pathname)});
 for(const checked of ['true','false']){
  await page.getByRole('switch',{name:'Flip bit',exact:true}).click();
  await expect(page.getByRole('switch',{name:'Flip bit',exact:true})).toHaveAttribute('aria-checked',checked);
  expect(await page.locator('.signal-screen').innerHTML()).toBe(evidence);
  await expect(page.locator('.context-tip')).toHaveText(tip);
  await noPrematureAnswer(page);
 }
 expect(mutations).toEqual([]);
 const sent=page.waitForRequest('**/diagnose');await page.locator('[data-action="diagnose"]').click();
 expect((await sent).postDataJSON()).toEqual({fault:'I',expected_revision:1});
 await expect(page.locator('.instrument')).toHaveAttribute('data-device-state','failed');
 await expect(page.locator('[data-reasoning="probe"]')).toContainText('I · No fault / X · Bit flip both give 0');
 await expect(page.locator('[data-reasoning="probe"]')).toContainText('bit was not measured');
 await expect(page.locator('[data-reasoning="probe"]')).toContainText('0 was not proof of no fault');
 await expect(page.locator('[data-reasoning="repair"]')).toContainText('Your I repair made no change, leaving X · Bit flip');
});

test('UI reasoning · a correct guess after a blind probe is not presented as an identified repair',async({page})=>{
 await mockShop(page);await chapter(page,'phase');
 await page.locator('[data-tool="z"]').click();await page.locator('[data-action="probe"]').click();
 await expect(page.locator('.reading-bits')).toHaveText('0');
 await expect(page.locator('[data-signal="phase"]')).toContainText('Unknown');
 await noPrematureAnswer(page);
 await page.locator('[data-repair="phase"]').click();
 await expect(page.locator('[data-signal="phase"]')).toContainText('Unknown');
 await noPrematureAnswer(page);
 await page.locator('[data-action="diagnose"]').click();
 await expect(page.locator('.instrument')).toHaveAttribute('data-device-state','repaired');
 await expect(page.locator('[data-reasoning="probe"]')).toContainText('I · No fault / Z · Phase flip both give 0');
 await expect(page.locator('[data-reasoning="probe"]')).toContainText('The reading alone did not identify the repair');
 await expect(page.locator('[data-reasoning="repair"]')).toContainText('Revealed: Z · Phase flip. Your Z repair cancelled the phase flip');
});

test('UI reasoning · linked evidence stays fixed and causal feedback waits for the server result',async({page})=>{
 await mockShop(page);await chapter(page,'entanglement');
 await page.locator('[data-tool="bell"]').click();await page.locator('[data-action="probe"]').click();
 await expect(page.locator('.reading-bits')).toHaveText('10');
 const evidence=await page.locator('.signal-screen').innerHTML();
 await page.locator('[data-repair="bit"]').click();await page.locator('[data-repair="phase"]').click();
 expect(await page.locator('.signal-screen').innerHTML()).toBe(evidence);
 await noPrematureAnswer(page);
 let release!:()=>void;const held=new Promise<void>(resolve=>release=resolve);
 await page.route('**/diagnose',async route=>{await held;await route.fallback()});
 const sent=page.waitForRequest('**/diagnose');await page.locator('[data-action="diagnose"]').click();
 expect((await sent).postDataJSON()).toEqual({fault:'Y',expected_revision:1});
 try{
  await expect(page.locator('[data-action="diagnose"]')).toBeDisabled();
  await noPrematureAnswer(page);
  await expect(page.locator('.instrument')).toHaveAttribute('data-device-state','preview');
 }finally{release();}
 await expect(page.locator('.instrument')).toHaveAttribute('data-device-state','failed');
 await expect(page.locator('[data-reasoning="probe"]')).toContainText('joint decoder gives a different bit + phase pair');
 await expect(page.locator('[data-reasoning="repair"]')).toContainText('Your Y repair flipped bit + phase, leaving Z · Phase flip');
 await expect(page.locator('.reading-bits')).toHaveText('10');
});

for(const width of [320,390]){
 test(`UI reasoning · full-family suspect names and the next action fit at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:844});await mockShop(page);await chapter(page,'entanglement');
  const geometry=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
  expect(geometry.width).toBe(width);expect(geometry.scroll).toBeLessThanOrEqual(geometry.client);
  await expect(page.locator('.ticket-family')).toContainText('Y · Both flips');
  const action=await page.locator('[data-action="probe"]').boundingBox();expect(action).toBeTruthy();expect(action!.y+action!.height).toBeLessThanOrEqual(844);
  await noPrematureAnswer(page);
 });
}
