import {test,expect,type Page} from '@playwright/test';
import {mockShop} from './fixtures';

// Transport/UI-state fixtures only; LIVE tests below must execute actual Qiskit.
async function mockTraining(page:Page){
 await page.route('**/api/training/probe',async route=>{
  const {tool,fault}=route.request().postDataJSON();
  const bits=({z:{I:'0',X:'1',Z:'0',Y:'1'},x:{I:'0',X:'0',Z:'1',Y:'1'},bell:{I:'00',X:'10',Z:'01',Y:'11'}} as Record<string,Record<string,string>>)[tool][fault];
  await route.fulfill({json:{kind:'training',known_fault:fault,reading:{tool,bits,engine:'qiskit-statevector',qubits:tool==='bell'?2:1,query_count:1},circuit_text:'UI FIXTURE ONLY',gates:[],probabilities:{[bits]:1},probe_marginal:{'0':.5,'1':.5},reference_marginal:tool==='bell'?{'0':.5,'1':.5}:null}});
 });
}

test('UI only · a keeper teaches a returned clean bit before exposing real repair controls',async({page})=>{
 await mockShop(page);await mockTraining(page);
 const requests:{path:string;body:unknown}[]=[];
 page.on('request',r=>{if(r.method()==='POST')requests.push({path:new URL(r.url()).pathname,body:r.postDataJSON()});});
 await page.goto('/');await page.locator('[data-action="start"]').click();
 await expect(page.getByRole('button',{name:'Learn the tools',exact:true})).toBeVisible();
 await page.keyboard.press('3');
 await page.getByRole('button',{name:'Learn the tools',exact:true}).click();
 await expect(page.locator('[data-tutorial-stage]')).toHaveAttribute('data-tutorial-stage','0');
 await expect(page.locator('[data-tool],[data-repair],[data-action="probe"]')).toHaveCount(0);
 await expect(page.locator('[data-training-reading]')).toHaveCount(0);
 await page.keyboard.press('1');
 await page.locator('[data-action="tutorial-run"]').click();
 await expect(page.locator('[data-training-reading]')).toHaveText('0');
 await expect(page.locator('[data-action="tutorial-next"]')).toBeEnabled();
 expect(requests).toEqual([{path:'/api/shifts',body:{route:'story'}},{path:'/api/training/probe',body:{tool:'z',fault:'I'}}]);
 await page.locator('[data-action="tutorial-skip"]').click();
 await expect(page.locator('.paper-ticket')).toBeVisible();
 await expect(page.locator('[data-action="probe"]')).toBeDisabled();
 await page.getByRole('button',{name:'Help',exact:true}).click();
 await page.locator('[data-action="tutorial-replay"]').click();
 await expect(page.locator('[data-tutorial-stage]')).toHaveAttribute('data-tutorial-stage','0');
 await expect(page.locator('[data-training-reading]')).toHaveCount(0);
 await expect(page.locator('#tutorial-title')).toBeFocused();
});

test('UI only · stages show the actual preparations and a usable joint-reading repair, not quiz answers',async({page})=>{
 await mockShop(page);await mockTraining(page);await page.goto('/');
 await page.locator('[data-action="start"]').click();await page.getByRole('button',{name:'Learn the tools',exact:true}).click();
 for(let stage=0;stage<6;stage++){
  await expect(page.locator('[data-tutorial-stage]')).toHaveAttribute('data-tutorial-stage',String(stage));
  if(stage<3)await expect(page.locator('[data-preparation]')).toHaveAttribute('data-preparation','|0>');
  if(stage===3){await expect(page.locator('[data-preparation]')).toHaveAttribute('data-preparation','|+>');await expect(page.locator('main')).toContainText('relative');await expect(page.locator('[data-decoder]')).toContainText('H');}
  if(stage===5){await expect(page.locator('[data-reference-path]')).toContainText('stays');await expect(page.locator('[data-decoder]')).toContainText('Joint decoder');await expect(page.locator('main')).toContainText('50/50');}
  await page.locator('[data-action="tutorial-run"]').click();
  await expect(page.locator('[data-action="tutorial-next"]')).toBeVisible();
  if(stage===4)await expect(page.locator('[data-training-reading]')).toHaveText(['0','1','0','1']);
  if(stage===5)await expect(page.locator('[data-training-reading]')).toHaveText(['00','10','01','11']);
  await page.locator('[data-action="tutorial-next"]').click();
 }
 await expect(page.locator('[data-tutorial-stage]')).toHaveAttribute('data-tutorial-stage','6');
 await expect(page.locator('[data-training-reading]')).toHaveText('11');
 await expect(page.locator('[data-training-preview="bit"]')).toHaveText('1');
 await page.getByRole('switch',{name:'Flip bit',exact:true}).click();
 await expect(page.locator('[data-training-preview="bit"]')).toHaveText('0');
 await page.getByRole('switch',{name:'Flip phase',exact:true}).click();
 await expect(page.locator('[data-training-preview="phase"]')).toHaveText('0');
 await page.locator('[data-action="tutorial-apply"]').click();
 await expect(page.locator('main')).toContainText('Mara');
 await page.locator('[data-action="tutorial-next"]').click();
 await expect(page.locator('.paper-ticket')).toBeVisible();
 await expect(page.locator('[data-action="probe"]')).toBeDisabled();
});

test('UI only · training error, Back and a late reply never replace or preselect the real bench',async({page})=>{
 await mockShop(page);await mockTraining(page);await page.goto('/');
 await page.locator('[data-action="start"]').click();await page.getByRole('button',{name:'Learn the tools',exact:true}).click();
 await page.route('**/api/training/probe',route=>route.fulfill({status:503,json:{detail:'Training simulator unavailable.'}}));
 await page.locator('[data-action="tutorial-run"]').click();
 await expect(page.locator('.training-feedback')).toContainText('Training simulator unavailable');
 await expect(page.locator('[data-training-reading]')).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Retry training test',exact:true})).toBeVisible();
 let release!:()=>void;const gate=new Promise<void>(resolve=>release=resolve);
 await page.route('**/api/training/probe',async route=>{await gate;await route.fallback();});
 const pending=page.waitForRequest('**/api/training/probe');
 await page.locator('[data-action="tutorial-run"]').click();await pending;
 await expect(page.locator('[data-action="tutorial-skip"]')).toBeEnabled();
 await page.locator('[data-action="tutorial-skip"]').click();
 await expect(page.locator('.paper-ticket')).toBeVisible();
 const arrived=page.waitForResponse('**/api/training/probe');release();await arrived;
 await expect(page.locator('.paper-ticket')).toBeVisible();
 await expect(page.locator('[data-tutorial-stage]')).toHaveCount(0);
 await expect(page.locator('[data-action="probe"]')).toBeDisabled();
 await page.getByRole('button',{name:'Menu',exact:true}).click();await page.locator('[data-action="tutorial-replay"]').click();
 await expect(page.locator('[data-tutorial-stage]')).toHaveAttribute('data-tutorial-stage','0');
 await page.locator('[data-action="tutorial-back"]').click();
 await expect(page.locator('.paper-ticket')).toBeVisible();
 await page.reload();
 await expect(page.locator('.paper-ticket')).toBeVisible();
 await expect(page.locator('[data-action="story-continue"]')).toHaveCount(0);
});

test('UI only · customer topic changes leave probe choice to the player',async({page})=>{
 await mockShop(page);await page.goto('/');await page.locator('[data-action="start"]').click();await page.locator('[data-action="skip-intro"]').click();
 await page.locator('[data-tool="z"]').click();await page.locator('[data-action="probe"]').click();await page.locator('[data-repair="bit"]').click();await page.locator('[data-action="diagnose"]').click();await page.locator('[data-action="next"]').click();
 await expect(page.locator('.tool-station .context-tip')).toHaveText('Which probe separates these suspects? One test per device.');
 await expect(page.locator('.keeper-transition')).toHaveCount(0);
 await page.locator('[data-tool="x"]').click();await page.locator('[data-action="probe"]').click();await page.locator('[data-repair="phase"]').click();await page.locator('[data-action="diagnose"]').click();await page.locator('[data-action="next"]').click();
 await expect(page.locator('.tool-station .context-tip')).toHaveText('Which probe separates these suspects? One test per device.');
 await expect(page.locator('.keeper-transition')).toHaveCount(0);
});

test('UI only · the motion switch stops training transport effects without blocking real feedback',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});
 await mockShop(page);await mockTraining(page);await page.goto('/');
 await page.locator('[data-action="start"]').click();await page.getByRole('button',{name:'Learn the tools',exact:true}).click();
 let release!:()=>void;const gate=new Promise<void>(resolve=>release=resolve);
 await page.route('**/api/training/probe',async route=>{await gate;await route.fallback();});
 await page.locator('[data-action="tutorial-run"]').click();
 const animation=()=>page.locator('.training-wire').first().evaluate(el=>getComputedStyle(el,'::after').animationName);
 expect(await animation()).not.toBe('none');
 await page.getByRole('button',{name:'Menu',exact:true}).click();
 await page.getByRole('button',{name:'Motion: on',exact:true}).click();
 await page.keyboard.press('Escape');
 expect(await animation()).toBe('none');
 release();await expect(page.locator('[data-training-reading]')).toHaveText('0');
});

test('UI only · a training response preserves keyboard focus moved to Skip while waiting',async({page})=>{
 await mockShop(page);await mockTraining(page);await page.goto('/');
 await page.locator('[data-action="start"]').click();await page.getByRole('button',{name:'Learn the tools',exact:true}).click();
 let release!:()=>void;const gate=new Promise<void>(resolve=>release=resolve);
 await page.route('**/api/training/probe',async route=>{await gate;await route.fallback();});
 await page.locator('[data-action="tutorial-run"]').click();
 await page.locator('[data-action="tutorial-skip"]').focus();
 release();await expect(page.locator('[data-training-reading]')).toHaveText('0');
 await expect(page.locator('[data-action="tutorial-skip"]')).toBeFocused();
});

test('UI only · a returned circuit animates the signal path without delaying Continue',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});await mockShop(page);await mockTraining(page);await page.goto('/');
 await page.locator('[data-action="start"]').click();await page.getByRole('button',{name:'Learn the tools',exact:true}).click();
 await page.locator('[data-action="tutorial-run"]').click();
 await expect(page.locator('[data-training-reading]')).toHaveText('0');
 await expect(page.locator('[data-action="tutorial-next"]')).toBeEnabled();
 expect(await page.locator('.training-wire').first().evaluate(el=>getComputedStyle(el,'::after').animationName)).toBe('training-transit');
 await page.emulateMedia({reducedMotion:'reduce'});
 expect(await page.locator('.training-wire').first().evaluate(el=>getComputedStyle(el,'::after').animationName)).toBe('none');
 await expect(page.locator('[data-training-reading]')).toHaveText('0');
});
