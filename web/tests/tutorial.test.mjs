import test from 'node:test';
import assert from 'node:assert/strict';
const tutorial = await import('../src/tutorial.ts').catch(()=>({}));

// Transport fixtures are explicitly UI/controller tests, never physics evidence.
const result=(tool,fault,bits)=>({kind:'training',known_fault:fault,reading:{tool,bits,engine:'qiskit-statevector',qubits:tool==='bell'?2:1,query_count:1},circuit_text:'UI FIXTURE',gates:[],probabilities:{[bits]:1},probe_marginal:{'0':.5,'1':.5},reference_marginal:tool==='bell'?{'0':.5,'1':.5}:null});

test('a clean training cable sends only a known tool/fault and displays the returned bit',async()=>{
 assert.equal(typeof tutorial.createTutorial,'function','playable training controller is missing');
 const calls=[];
 const session=tutorial.createTutorial(async(url,body)=>{calls.push([url,body]);return result('z','I','0');});
 assert.equal(session.state.stage,0);
 assert.equal(session.state.results.length,0);
 assert.equal(session.next(),false,'a demonstration precedes the next stage');
 await session.run();
 assert.deepEqual(calls,[['/api/training/probe',{tool:'z',fault:'I'}]]);
 assert.equal(session.state.results[0].reading.bits,'0');
 assert.equal(session.next(),true);
 assert.equal(session.state.stage,1);
});
test('progressive experiments teach invisible phase, ordinary ambiguity and all four joint outcomes',async()=>{
 const calls=[];
 const mappings={z:{I:'0',X:'1',Z:'0',Y:'1'},x:{I:'0',X:'0',Z:'1',Y:'1'},bell:{I:'00',X:'10',Z:'01',Y:'11'}};
 const session=tutorial.createTutorial(async(url,{tool,fault})=>{calls.push([tool,fault]);return result(tool,fault,mappings[tool][fault]);});
 const expected=[
  [['z','I']],[['z','X']],[['z','Z']],[['x','Z']],
  [['z','I'],['z','X'],['z','Z'],['z','Y']],
  [['bell','I'],['bell','X'],['bell','Z'],['bell','Y']],
 ];
 for(const [stage,plan] of expected.entries()){
  assert.equal(session.state.stage,stage);
  const before=calls.length;
  await session.run();
  assert.deepEqual(calls.slice(before),plan);
  assert.deepEqual(session.state.results.map(r=>r.reading.bits),plan.map(([tool,fault])=>mappings[tool][fault]));
  assert.equal(session.next(),true);
 }
 assert.equal(session.state.stage,6);
 assert.equal(session.state.results[0].known_fault,'Y','repair uses a real previous Bell reading, not an invented one');
 assert.equal(session.back(),true);
 assert.equal(session.state.stage,5);
 assert.equal(session.state.results.length,4,'back restores completed demonstrations');
});

test('back, exit and replay invalidate late training responses and duplicate runs',async()=>{
 let resolve,requests=0;
 const session=tutorial.createTutorial(()=>{requests++;return new Promise(r=>resolve=r);});
 const pending=session.run();
 const duplicate=session.run();
 assert.equal(requests,1,'pending double click must not start another circuit');
 session.dispose();
 resolve(result('z','I','0'));
 await pending;
 assert.equal(session.state.results.length,0,'disposed tutorial cannot receive a late result');
 assert.equal(session.state.pending,false);
 const replay=tutorial.createTutorial(async()=>result('z','I','0'));
 assert.equal(replay.state.stage,0);
 assert.equal(replay.state.results.length,0);
});

test('failed or malformed training replies fail closed, allow retry and never invent a reading',async()=>{
 let tries=0;
 const session=tutorial.createTutorial(async()=>{if(++tries===1)throw new Error('Simulator unavailable');return result('z','I','0');});
 await session.run();
 assert.equal(session.state.pending,false);
 assert.equal(session.state.results.length,0);
 assert.match(session.state.error,/Simulator unavailable/);
 assert.equal(session.next(),false);
 await session.run();
 assert.equal(session.state.results[0].reading.bits,'0');
 assert.equal(session.state.error,'');
 const invalid=tutorial.createTutorial(async()=>result('bell','Y','11'));
 await invalid.run();
 assert.equal(invalid.state.results.length,0,'wrong training circuit must not be shown as this experiment');
 assert.match(invalid.state.error,/training response/i);
});

test('practice repair transforms a returned joint reading using switches without another query',async()=>{
 let queries=0;
 const mapping={z:{I:'0',X:'1',Z:'0',Y:'1'},x:{Z:'1'},bell:{I:'00',X:'10',Z:'01',Y:'11'}};
 const session=tutorial.createTutorial(async(_,{tool,fault})=>{queries++;return result(tool,fault,mapping[tool][fault]);});
 for(let i=0;i<6;i++){await session.run();session.next();}
 const before=queries;
 assert.deepEqual(session.state.repair,{bit:false,phase:false});
 assert.equal(session.apply(),false);
 assert.equal(session.state.repaired,false);
 session.toggle('bit');
 assert.equal(session.apply(),false);
 session.toggle('phase');
 assert.equal(session.apply(),true);
 assert.equal(session.state.repaired,true);
 assert.equal(session.state.results[0].reading.bits,'11','measured bits never change with repair');
 assert.equal(queries,before,'switches and practice apply are a prediction, not a cable query');
});

test('replay completion does not pretend a saved or absent customer ticket is still unqueried',()=>{
 const state={stage:6,pending:false,results:[result('bell','Y','11')],error:'',repair:{bit:true,phase:true},repaired:true,applied:true};
 const replay=tutorial.tutorialView(state,'shift');
 assert.match(replay,/Return to shift/);
 assert.doesNotMatch(replay,/Mara|has not been tested/);
 const landing=tutorial.tutorialView(state,'shop');
 assert.match(landing,/Back to workshop/);
 assert.doesNotMatch(landing,/Mara|has not been tested/);
 assert.match(tutorial.tutorialView(state,'first-ticket'),/Mara/);
});