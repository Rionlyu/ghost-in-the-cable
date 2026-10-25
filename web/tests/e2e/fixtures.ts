import type {Page} from '@playwright/test';
import type {Shift,Route,Fault,Tool,History} from '../../src/types';
// UI-state fixtures only. These are NOT quantum-engine or integration evidence.
export async function mockShop(page:Page,options:{fullFamily?:boolean}={}) {
 const sessions=new Map<string,Shift>();let serial=0;
 const families:Record<Route,Fault[][]>={story:[['I','X'],['I','Z'],['I','X','Z','Y'],['I','X'],['I','X','Z','Y'],['I','Z'],['I','X','Z','Y'],['I','X']],bits:[['I','X'],['I','X'],['I','X']],phase:[['I','Z'],['I','Z']],entanglement:[['I','X','Z','Y'],['I','X','Z','Y'],['I','X','Z','Y']]};
 function ticket(route:Route,index:number){return {id:`fixture-${index}`,title:'The unquiet doorbell',customer:'Mara, the night librarian',description:'It rings when nobody is there. A fictional ticket for UI testing.',suspects:options.fullFamily?['I','X','Z','Y'] as Fault[]:families[route][index],reward:20,penalty:5,hint:'A bit flip changes a Z reading.',chapter:'The first knock'};}
 function create(route:Route):Shift{serial++;const id=serial===1?'ui-fixture-only':`ui-fixture-only-${serial}`;const shift:Shift={id,route,revision:0,phase:'choose_tool',ticket_index:0,ticket_count:families[route].length,correct:0,credits:0,bell_tokens:route==='bits'||route==='phase'?0:3,ticket:ticket(route,0),reading:null,debrief:null,history:[]};sessions.set(id,shift);return shift;}
 await page.route('**/api/**',async response=>{
  const request=response.request();const path=new URL(request.url()).pathname;
  const refuse=async(status:number,detail:string)=>response.fulfill({status,json:{detail}});
  if(path==='/api/meta'){await response.fulfill({json:{title:'Ghost in the Cable',faults:[{id:'I',name:'No fault',description:'Identity.'},{id:'X',name:'Bit flip',description:'Flips the bit.'},{id:'Z',name:'Phase flip',description:'Flips phase.'},{id:'Y',name:'Both flips',description:'Bit and phase.'}],tools:[{id:'z',name:'Z probe',description:'Watch the bit.',measurement_hint:'I / Z → 0 · X / Y → 1',cost_tokens:0},{id:'x',name:'X probe',description:'Watch the phase.',measurement_hint:'I / X → 0 · Z / Y → 1',cost_tokens:0},{id:'bell',name:'Bell probe',description:'Use a reference.',measurement_hint:'I 00 · X 10 · Z 01 · Y 11',cost_tokens:1}]}});return;}
  if(path==='/api/shifts'&&request.method()==='POST'){const route=(request.postDataJSON()?.route??'story') as Route;if(!Object.hasOwn(families,route)){await refuse(422,'Unknown route.');return;}await response.fulfill({json:create(route)});return;}
  const [,id,action]=path.match(/^\/api\/shifts\/([^/]+)(?:\/(\w+))?$/)??[];
  const s=sessions.get(id);if(!s){await refuse(404,'Shift not found.');return;}
  if(request.method()==='POST'){
   const body=request.postDataJSON();const expected=body.expected_revision;
   if(!Number.isInteger(expected)||expected<0){await refuse(422,'expected_revision must be a nonnegative integer.');return;}
   if(expected!==s.revision){await refuse(409,'This bench has changed. Refresh it before acting again.');return;}
   const fault:Fault=s.ticket!.suspects.includes('X')?'X':'Z';
   if(action==='probe'){
    if(s.phase!=='choose_tool'){await refuse(409,'One query per ticket.');return;}
    const tool=body.tool as Tool;if(tool==='bell'&&s.bell_tokens===0){await refuse(409,'No link tokens remain.');return;}
    s.phase='diagnose';if(tool==='bell')s.bell_tokens--;
    const bits=tool==='bell'?(fault==='X'?'10':'01'):tool==='z'?(fault==='X'?'1':'0'):(fault==='Z'?'1':'0');
    s.reading={tool,bits,engine:'qiskit-statevector',qubits:tool==='bell'?2:1,query_count:1};
   }else if(action==='diagnose'){
    if(s.phase!=='diagnose'){await refuse(409,'No measured ticket to repair.');return;}
    const guessed=body.fault as Fault;if(!s.ticket!.suspects.includes(guessed)){await refuse(422,'Repair outside the ticket family.');return;}
    const correct=guessed===fault;const delta=correct?20:-5;s.phase='resolved';s.correct+=Number(correct);s.credits+=delta;
    s.debrief={fault,guessed_fault:guessed,correct,explanation:'UI fixture explanation.',lesson:'A reference separates the four ideal faults.',circuit_text:'TEST CIRCUIT — UI FIXTURE ONLY',gates:[],probabilities:{[s.reading!.bits]:1},reward_delta:delta,probe_marginal:{'0':.5,'1':.5},reference_marginal:s.reading!.tool==='bell'?{'0':.5,'1':.5}:null};
    s.history.push({ticket_id:s.ticket!.id,title:s.ticket!.title,tool:s.reading!.tool,bits:s.reading!.bits,fault,guess:guessed,correct,delta} satisfies History);
   }else if(action==='next'){
    if(s.phase!=='resolved'){await refuse(409,'Apply the repair first.');return;}
    s.ticket_index++;s.phase=s.ticket_index===s.ticket_count?'complete':'choose_tool';s.reading=null;s.debrief=null;s.ticket=s.phase==='complete'?null:ticket(s.route,s.ticket_index);
   }else{await refuse(404,'Unknown action.');return;}
   s.revision++;
  }
  if(action==='report'&&s.phase!=='complete'){await refuse(409,'Finish the shift first.');return;}
  await response.fulfill({json:action==='report'?{...s,note:'UI FIXTURE ONLY'}:s});
 });
}
