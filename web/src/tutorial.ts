import type {Tool,Fault,Reading} from './types';
import {repairPreview} from './rules.ts';
import type {Repair} from './rules';

export interface TrainingResult {
 kind:'training'; known_fault:Fault; reading:Reading; circuit_text:string;
 gates:{gate:string;qubits:number[]}[]; probabilities:Record<string,number>;
 probe_marginal:Record<string,number>; reference_marginal:Record<string,number>|null;
}
export interface TutorialState {stage:number; pending:boolean; results:TrainingResult[]; error:string; repair:Repair; repaired:boolean; applied:boolean}
type Transport=(url:string,body:{tool:Tool;fault:Fault})=>Promise<TrainingResult>;
const faults:Fault[]=['I','X','Z','Y'];
const plans:{tool:Tool;fault:Fault}[][]=[
 [{tool:'z',fault:'I'}],[{tool:'z',fault:'X'}],[{tool:'z',fault:'Z'}],[{tool:'x',fault:'Z'}],
 faults.map(fault=>({tool:'z',fault})),faults.map(fault=>({tool:'bell',fault})),
];
export function createTutorial(request:Transport){
 const state:TutorialState={stage:0,pending:false,results:[],error:'',repair:{bit:false,phase:false},repaired:false,applied:false};
 const cache=new Map<number,TrainingResult[]>();
 let epoch=0,disposed=false;
 function cancel(){epoch++;state.pending=false;}
 function enter(stage:number){cancel();state.stage=stage;state.error='';state.results=stage===6?cache.get(5)?.filter(r=>r.known_fault==='Y')??[]:cache.get(stage)??[];}
 return {
  state,
  async run(){
   if(disposed||state.pending||state.stage===6)return;
   const token=++epoch,stage=state.stage;
   state.pending=true;state.error='';state.results=[];
   const results:TrainingResult[]=[];
   try{
    for(const body of plans[stage]){
     const result=await request('/api/training/probe',body);
     if(disposed||token!==epoch)return;
     if(result?.kind!=='training'||result.known_fault!==body.fault||result.reading?.tool!==body.tool||result.reading.engine!=='qiskit-statevector'||result.reading.query_count!==1||result.reading.qubits!==(body.tool==='bell'?2:1)||!(body.tool==='bell'?/^[01]{2}$/:/^[01]$/).test(result.reading.bits))throw new Error('The training response did not match this experiment. No reading was substituted.');
     results.push(result);
    }
    state.results=results;cache.set(stage,results);
   }catch(cause){if(!disposed&&token===epoch)state.error=cause instanceof Error?cause.message:'The training circuit could not run. No reading was substituted.';}
   finally{if(!disposed&&token===epoch)state.pending=false;}
  },
  next(){if(disposed||state.pending||!state.results.length||state.stage===6)return false;enter(state.stage+1);return true;},
  back(){if(disposed||!state.stage)return false;enter(state.stage-1);return true;},
  toggle(dimension:keyof Repair){if(disposed||state.stage!==6)return;state.repair[dimension]=!state.repair[dimension];state.repaired=false;state.applied=false;},
  apply(){if(disposed||state.stage!==6||!state.results.length)return false;const preview=repairPreview(state.results[0].reading,state.repair);state.repaired=preview.bit===0&&preview.phase===0;state.applied=true;return state.repaired;},
  dispose(){disposed=true;cancel();},
 };
}

const escape=(value:unknown):string=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const titles=['A bit is 0 or 1.','A flip swaps the bit.','Some faults leave 0 alone.','Phase is a relation, not another bit.','One test leaves a blind spot.','Linked uses a pair.','Turn the reading into a repair.'];
const instructions=[
 'Send a known 0 through this clean spare cable. Watch the test light—not the customer’s lamp.',
 'This spare has X: a bit flip. Send the same 0 again, and watch what changes.',
 'Z flips phase, not 0 into 1. Try our Bit probe on this known phase-flip cable.',
 'A superposition combines 0 and 1 in one quantum state—not a random choice between them. Here, phase is their relative +/− sign.',
 'Four separate spares, four known faults. Send one Bit probe through each and compare the returned readings.',
 'Entangle a pair. Only the probe crosses the faulty cable.',
 'Use the returned Y-cable reading. Leave a correction off for 0; turn it on for 1. The same switches await on real jobs.',
];
const names:Record<Fault,string>={I:'Clean',X:'Bit flip',Z:'Phase flip',Y:'Both flips'};
const wire='<span class="training-wire" aria-hidden="true"></span>';
function measured(result:TrainingResult|undefined):string{return result?`<output data-training-reading="${escape(result.reading.bits)}" aria-label="Measured ${escape(result.reading.bits)}">${escape(result.reading.bits)}</output>`:'<strong class="training-unknown" aria-label="Not measured">?</strong>';}
function bitApparatus(state:TutorialState):string{
 const fault=plans[state.stage][0].fault;
 return `<div class="training-path"><div class="training-node" data-preparation="|0&gt;"><small>Bit probe sends</small><strong>|0⟩</strong></div>${wire}<div class="training-node training-cable"><small>Known cable</small><strong>${fault} · ${names[fault].toLowerCase()}</strong></div>${wire}<div class="training-node training-output"><small>Measured bit</small>${measured(state.results[0])}</div></div>`;
}
function phaseApparatus(state:TutorialState):string{
 return `<div class="phase-path"><div class="phase-preparation training-node" data-preparation="|+&gt;"><small>Prepare · H</small><div class="phase-relation" aria-label="Equal superposition of 0 and 1 with plus relative sign"><span>0</span><b>+</b><span>1</span></div><strong>|+⟩</strong></div>${wire}<div class="training-node training-cable"><small>Cable · Z</small><div class="phase-relation inverted" aria-label="Equal superposition with minus relative sign"><span>0</span><b>−</b><span>1</span></div><strong>|−⟩</strong></div>${wire}<div class="training-node phase-decoder" data-decoder><small>Decode</small><strong>H</strong><small>sign → bit</small></div>${wire}<div class="training-node training-output"><small>Measured</small>${measured(state.results[0])}</div></div><p class="apparatus-note">|0⟩ → H → |+⟩ → Z → |−⟩ → H → test. Signs show a schematic relation—not brightness or another bit.</p>`;
}
function comparison(state:TutorialState):string{
 return `<div class="training-comparison" aria-label="Four separate resettable cables">${faults.map(fault=>`<div class="comparison-cable" data-training-cable="${fault}"><span class="comparison-name"><b>${fault}</b><span>${names[fault]}</span></span><span class="training-wire" aria-hidden="true"></span><span class="training-output">${measured(state.results.find(r=>r.known_fault===fault))}</span></div>`).join('')}</div>`;
}
function linkedApparatus():string{
 return `<div class="linked-path" aria-label="One entangled partner crosses the cable, the reference bypasses it, both enter a joint decoder"><div class="linked-source training-node" data-preparation="entangled"><small>Prepare an</small><strong>entangled pair</strong><span class="linked-pair" aria-hidden="true">●—●</span></div><div class="linked-routes"><div class="probe-route"><span>Probe →</span><span class="training-cable">Faulty cable</span><span aria-hidden="true">→</span></div><div class="reference-route" data-reference-path><span>Reference stays on bench</span><span aria-hidden="true">→</span></div></div><div class="joint-decoder training-node" data-decoder><small>Both meet at</small><strong>Joint decoder</strong><small>CX + H → c1c0</small></div></div><p class="apparatus-note">Before decoding: each alone is 50/50. Kept reference = no extra cable use.</p><div class="decoded-labels"><span>First light: <b>BIT-FLIP</b></span><span>Second light: <b>PHASE-FLIP</b></span></div>`;
}
function repairApparatus(state:TutorialState):string{
 const result=state.results[0];
 const preview=repairPreview(result?.reading??null,state.repair);
 return `<div class="training-raw"><span>Known Y cable · actual joint reading</span><span class="training-output">${measured(result)}</span></div><div class="practice-preview" aria-label="Repair preview, not another measurement">${(['bit','phase'] as const).map(dimension=>`<div class="practice-lane" data-training-signal="${dimension}"><span>${dimension==='bit'?'BIT-FLIP':'PHASE-FLIP'}</span><strong data-training-preview="${dimension}">${preview[dimension]??'?'}</strong><span>${preview[dimension]===0?'aligned':'inverted'}</span></div>`).join('')}</div><p class="apparatus-note">Preview · no new measurement. A 1 needs its matching correction; 0 needs no change.</p><div class="repair-controls training-switches" role="group" aria-label="Training repair switches">${(['bit','phase'] as const).map(dimension=>`<button type="button" role="switch" aria-label="Flip ${dimension}" aria-checked="${state.repair[dimension]}" data-training-switch="${dimension}"><span class="switch-track" aria-hidden="true"><span></span></span><span>Flip ${dimension}</span></button>`).join('')}</div>`;
}
type ReturnTo='first-ticket'|'shift'|'shop';
function feedback(state:TutorialState,returnTo:ReturnTo):string{
 if(state.pending)return 'Running Qiskit on the resettable training cable…';
 if(state.error)return `${state.error} Retry or skip; no reading was substituted.`;
 if(state.stage===6)return state.repaired?(returnTo==='first-ticket'?'Practice aligned. Mara is waiting: her real cable has not been tested.':returnTo==='shift'?'Practice aligned. Your saved shift is exactly as you left it.':'Practice aligned. The workshop is ready when you are.'):state.applied?'An inversion remains in the preview. Match each switch to its measured light.':'These lights are test values, not whether a customer’s device works. The real repair is checked only after Apply repair.';
 if(!state.results.length)return state.stage===4?'Training cables reset. On real jobs, you get one use—not Bit then Phase.':state.stage===5?'Compare the same four known faults, now with a kept reference.':'This spare resets. No customer query or link token will be spent.';
 return [
  `We sent 0. Qiskit returned ${state.results[0].reading.bits}. The clean cable leaves it unchanged.`,
  `We sent 0. Qiskit returned ${state.results[0].reading.bits}. “Flip bit” reverses this swap during a repair.`,
  `Qiskit returned ${state.results[0].reading.bits}—the same as the clean cable. This probe cannot see the phase flip.`,
  `Qiskit returned ${state.results[0].reading.bits}. The H decoder made the phase flip visible.`,
  'Two matching pairs: I / Z look alike, and X / Y look alike. One ordinary test cannot identify all four. Real jobs allow one use.',
  'Four distinct joint readings. Neither partner alone could identify the fault.',
 ][state.stage];
}
export function tutorialView(state:TutorialState,returnTo:ReturnTo='first-ticket'):string {
 const done=state.results.length>0;
 const apparatus=state.stage<3?bitApparatus(state):state.stage===3?phaseApparatus(state):state.stage===4?`<div class="comparison-preparation" data-preparation="|0&gt;">Bit probe · each cable starts at <strong>|0⟩</strong></div>${comparison(state)}`:state.stage===5?linkedApparatus()+comparison(state):repairApparatus(state);
 const action=state.stage===6?(state.repaired?'tutorial-next':'tutorial-apply'):done?'tutorial-next':'tutorial-run';
 const label=state.pending?'Testing…':state.stage===6?(state.repaired?(returnTo==='first-ticket'?'Take the real ticket':returnTo==='shift'?'Return to shift':'Back to workshop'):'Apply practice repair'):done?'Continue':state.error?'Retry training test':state.stage<2?'Send 0':state.stage===2?'Test with Bit':state.stage===3?'Test with Phase':'Compare four cables';
 return `<section class="tutorial" data-tutorial-stage="${state.stage}" aria-labelledby="tutorial-title"><div class="tutorial-top"><span>Resettable training · ${state.stage+1} / 7</span><button class="text-button" data-action="tutorial-skip">${returnTo==='shop'?'Back to shop':'Skip to repairs'}</button></div><div class="keeper-line"><img src="/favicon.svg" width="36" height="36" alt=""><span>The workshop keeper</span></div><h1 id="tutorial-title" tabindex="-1" data-focus>${titles[state.stage]}</h1><p class="tutorial-instruction">${instructions[state.stage]}</p><div class="training-apparatus ${state.pending?'is-running':''} ${done?'has-result':''}">${apparatus}</div><p class="training-feedback ${state.error?'training-error':''}" role="status">${escape(feedback(state,returnTo))}</p><div class="tutorial-actions"><button class="primary" data-action="${action}" ${state.pending?'disabled':''}>${label}</button><button class="text-button" data-action="tutorial-back">Back</button>${done&&state.stage<6?'<button class="text-button" data-action="tutorial-run">Reset & test again</button>':''}</div></section>`;
}
