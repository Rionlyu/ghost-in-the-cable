import test from 'node:test';
import assert from 'node:assert/strict';
import * as rules from '../src/rules.ts';
import {readFile} from 'node:fs/promises';
import {stripTypeScriptTypes} from 'node:module';

// Exercise the actual view functions without a Vite build or touching the shared dist.
// Node's native TS loader needs explicit rules/JSON module URLs; Vite resolves these normally.
const source=await readFile(new URL('../src/views.ts',import.meta.url),'utf8');
const moduleSource=stripTypeScriptTypes(source)
 .replace("from './rules'",`from '${new URL('../src/rules.ts',import.meta.url).href}'`)
 .replace("from '../../evidence/benchmark.json'",`from '${new URL('../../evidence/benchmark.json',import.meta.url).href}' with {type:'json'}`);
const views=await import(`data:text/javascript;base64,${Buffer.from(moduleSource).toString('base64')}`);
const noRepair={bit:false,phase:false};
function shift(overrides={}){
 return {id:'public-fixture',route:'story',revision:0,phase:'choose_tool',ticket_index:0,ticket_count:8,correct:0,credits:0,bell_tokens:3,
  ticket:{id:'public-ticket',title:'The unquiet doorbell',customer:'Mara',description:'It rings at midnight. Another sentence.',suspects:['I','X'],reward:20,penalty:5,hint:'PRIVATE_ANSWER_HINT',chapter:'Night'},
  reading:null,debrief:null,history:[],...overrides};
}
function reading(tool,bits){return {tool,bits,engine:'qiskit-statevector',qubits:tool==='bell'?2:1,query_count:1};}

test('customer ticket shows the actual public suspects, never a paraphrase that selects the tool',()=>{
 const families=[['I','X'],['I','Z'],['I','Y'],['X','Z'],['Z','Y'],['I','X','Z','Y']];
 const names={I:'No fault',X:'Bit flip',Z:'Phase flip',Y:'Both flips'};
 for(const suspects of families){
  const s=shift();s.ticket.suspects=suspects;
  const html=views.ticketView(s);
  assert.match(html,/Suspects/);
  for(const fault of suspects)assert.ok(html.includes(`${fault} · ${names[fault]}`),html);
  assert.doesNotMatch(html,/>Check<|PRIVATE_ANSWER_HINT|Try the|Recommended/);
 }
});

test('customer probe choice stays neutral on every chapter and keeper transition',()=>{
 for(const route of ['story','bits','phase','entanglement']){
  for(const [ticket_index,suspects,history] of [[0,['I','X'],[]],[0,['I','Z'],[]],[0,['I','X','Z','Y'],[]],[2,['I','Z'],[{tool:'z'}]],[3,['I','X','Z','Y'],[{tool:'x'}]]]){
   const s=shift({route,ticket_index,history});s.ticket.suspects=suspects;
   const html=views.toolsView(s,{},null,false);
   assert.match(html,/Which probe separates these suspects\?/);
   assert.doesNotMatch(html,/Try the|Keep a reference with|Recommended|keeper-transition|PRIVATE_ANSWER_HINT/);
   assert.match(html,/data-action="probe" disabled/);
  }
 }
 for(const [tool,capability,cost] of [['z','Reads bit; phase stays unknown.','0 link tokens'],['x','Reads phase; bit stays unknown.','0 link tokens'],['bell','Reads bit + phase with a joint decoder.','1 link token']]){
  const html=views.toolsView(shift(),{},tool,false);
  assert.ok(html.includes(capability),html);assert.ok(html.includes(cost),html);
  assert.doesNotMatch(html,/Try the|this ticket needs|recommended/i);
 }
 const exhausted=views.toolsView(shift({bell_tokens:0}),{},'bell',false);
 assert.match(exhausted,/data-tool="bell"[^>]*disabled/);
 assert.match(exhausted,/data-action="probe" disabled/);
});

test('customer bench preserves original evidence for every reading and every switch combination',()=>{
 const settings=[noRepair,{bit:true,phase:false},{bit:false,phase:true},{bit:true,phase:true}];
 for(const [tool,bits] of [['z','0'],['z','1'],['x','0'],['x','1'],['bell','00'],['bell','10'],['bell','01'],['bell','11']]){
  const s=shift({phase:'diagnose',revision:1,reading:reading(tool,bits)});
  const original=views.benchView(s,noRepair);
  assert.match(original,/Original measurement · unchanged by switches/);
  assert.doesNotMatch(original,/aligned|inverted|Preview|not tested|Working|Not fixed|probabilities|circuit_text/);
  for(const repair of settings)assert.equal(views.benchView(s,repair),original,`${tool} ${bits}: switches must not turn the CRT into an answer checker`);
  assert.ok(original.includes(`<strong class="reading-bits">${bits}</strong>`));
  if(tool==='z')assert.match(original,/data-signal="phase"[^]*?Unknown/);
  if(tool==='x')assert.match(original,/data-signal="bit"[^]*?Unknown/);
 }
 const unmeasured=views.benchView(shift(),{bit:true,phase:true});
 assert.match(unmeasured,/No signal yet/);assert.doesNotMatch(unmeasured,/Working|aligned|inverted/);
 const resolved=shift({phase:'resolved',reading:reading('z','1'),debrief:{correct:true,guessed_fault:'X'}});
 const html=views.benchView(resolved,noRepair);
 assert.match(html,/data-device-state="repaired"/);
 assert.match(html,/Working/);
 assert.match(html,/1 · measured/);
 assert.match(html,/Original measurement · repair checked/);
});

test('customer diagnosis asks for an inference and never evaluates a tentative repair',()=>{
 for(const [suspects,tool,bits] of [[['I','X'],'z','1'],[['I','Z'],'x','1'],[['I','X','Z','Y'],'bell','11'],[['I','Z'],'z','0'],[['I','X'],'x','0']]){
  const s=shift({phase:'diagnose',reading:reading(tool,bits)});s.ticket.suspects=suspects;
  const tip=html=>html.match(/<p class="context-tip">(.*?)<\/p>/)[1];
  const initial=views.diagnosisView(s,noRepair,false);
  assert.match(initial,/Infer the correction from the reading and suspects/);
  assert.match(initial,/All switches off means no change/);
  assert.match(initial,/data-action="diagnose" >Apply repair/);
  for(const repair of [noRepair,{bit:true,phase:false},{bit:false,phase:true},{bit:true,phase:true}]){
   const html=views.diagnosisView(s,repair,false);
   assert.equal(tip(html),tip(initial));
   assert.doesNotMatch(html,/Try the switch|switching back|Preview aligned|Aim for aligned|Leave unneeded|Apply repair to check|data-fault/);
  }
  if(suspects.includes('Z')&&tool==='z'||suspects.includes('X')&&tool==='x')assert.match(initial,/Some information was not measured/);
  assert.equal(initial.includes('data-repair="bit"'),suspects.some(f=>['X','Y'].includes(f)));
  assert.equal(initial.includes('data-repair="phase"'),suspects.some(f=>['Z','Y'].includes(f)));
 }
});

function resolvedShift(suspects,tool,bits,fault,guess){
 const s=shift({phase:'resolved',reading:reading(tool,bits),debrief:{fault,guessed_fault:guess,correct:fault===guess,reward_delta:fault===guess?20:-5,
  explanation:'SERVER_EXPLANATION_IN_OPTIONAL_CIRCUIT',lesson:'SERVER_LESSON',circuit_text:'PRIVATE_CIRCUIT',probabilities:{PRIVATE_PROBABILITY:1}}});
 s.ticket.suspects=suspects;return s;
}

test('resolved feedback explains distinguishing evidence and the physical correction',()=>{
 const cases=[
  [['I','X'],'z','1','X','X',/I → 0; X → 1/,/cancelled the bit flip/],
  [['I','Z'],'x','1','Z','Z',/I → 0; Z → 1/,/cancelled the phase flip/],
  [['I','X','Z','Y'],'bell','11','Y','Y',/joint decoder.*different bit \+ phase pair/,/cancelled both flips/],
  [['I','X'],'z','0','I','I',/I → 0; X → 1/,/No change was needed/],
  [['I','X'],'z','1','X','I',/I → 0; X → 1/,/made no change.*X · Bit flip/],
  [['I','X','Z','Y'],'bell','11','Y','X',/joint decoder/,/flipped bit.*Z · Phase flip/],
  [['I','X'],'z','0','I','X',/I → 0; X → 1/,/flipped bit.*X · Bit flip/],
 ];
 for(const [suspects,tool,bits,fault,guess,probeWhy,repairWhy] of cases){
  const html=views.debriefView(resolvedShift(suspects,tool,bits,fault,guess),false);
  assert.match(html,/data-reasoning="probe"/);assert.match(html,probeWhy);
  assert.match(html,/data-reasoning="repair"/);assert.match(html,repairWhy);
  assert.ok(html.includes(`Revealed: ${fault} · ${views.faultName(fault)}`),html);
  assert.doesNotMatch(html,/PRIVATE_CIRCUIT|PRIVATE_PROBABILITY|SERVER_EXPLANATION/);
 }
});

test('resolved feedback names indistinguishable candidates instead of treating a zero or lucky repair as proof',()=>{
 for(const [suspects,tool,bits,fault,guess,collision,blind] of [
  [['I','Z'],'z','0','Z','I','I · No fault / Z · Phase flip','phase'],
  [['I','Z'],'z','0','Z','Z','I · No fault / Z · Phase flip','phase'],
  [['I','X'],'x','0','X','I','I · No fault / X · Bit flip','bit'],
  [['I','X','Z','Y'],'z','1','Y','X','X · Bit flip / Y · Both flips','phase'],
  [['I','X','Z','Y'],'x','1','Y','Z','Z · Phase flip / Y · Both flips','bit'],
 ]){
  const html=views.debriefView(resolvedShift(suspects,tool,bits,fault,guess),false);
  assert.ok(html.includes(`${collision} both give ${bits}`),html);
  assert.ok(html.includes(`${blind} was not measured`),html);
  assert.match(html,/reading alone did not identify the repair/);
  if(bits==='0')assert.match(html,/0 was not proof of no fault/);
 }
 const guarded=resolvedShift(['I','X'],'z','1','X','X');guarded.phase='diagnose';
 assert.equal(views.debriefView(guarded,false),'');
});

test('Help distinguishes fixed customer evidence from the resettable training preview',()=>{
 const html=views.guideView();
 assert.match(html,/customer.*measurement stays fixed/i);
 assert.match(html,/switches do not predict or confirm/i);
 assert.match(html,/training.*preview/i);
 assert.match(html,/one.*test|test.*once/i);
 assert.match(html,/All switches off|Both off/);
 assert.doesNotMatch(html,/aligned means 0|predict the effect of your switches|What the preview means/);
});

test('physical repair switches map to independent literal Pauli fixtures, including all-off',()=>{
 assert.equal(typeof rules.repairFault,'function');
 const fixtures=[
  [{bit:false,phase:false},'I'],[{bit:true,phase:false},'X'],
  [{bit:false,phase:true},'Z'],[{bit:true,phase:true},'Y'],
 ];
 for(const [switches,fault] of fixtures) assert.equal(rules.repairFault(switches),fault);
});

test('repair preview uses only measured dimensions; Bell c1c0 first bit is bit, second is phase',()=>{
 assert.equal(typeof rules.repairPreview,'function');
 const fixtures=[
  ['z','0',{bit:0,phase:null}],['z','1',{bit:1,phase:null}],
  ['x','0',{bit:null,phase:0}],['x','1',{bit:null,phase:1}],
  ['bell','00',{bit:0,phase:0}],['bell','10',{bit:1,phase:0}],
  ['bell','01',{bit:0,phase:1}],['bell','11',{bit:1,phase:1}],
 ];
 for(const [tool,bits,plain] of fixtures){
  const reading={tool,bits,engine:'qiskit-statevector',qubits:tool==='bell'?2:1,query_count:1};
  assert.deepEqual(rules.repairPreview(reading,{bit:false,phase:false}),plain);
  assert.deepEqual(rules.repairPreview(reading,{bit:true,phase:true}),{bit:plain.bit===null?null:1-plain.bit,phase:plain.phase===null?null:1-plain.phase});
 }
 assert.deepEqual(rules.repairPreview(null,{bit:true,phase:true}),{bit:null,phase:null});
 assert.deepEqual(rules.repairPreview({tool:'bell',bits:'wrong'},{bit:true,phase:true}),{bit:null,phase:null});
});
