import test from 'node:test';
import assert from 'node:assert/strict';
import * as rules from '../src/rules.ts';

test('chapter navigation plans a new route, never silently abandons an unfinished shift',()=>{
 assert.equal(typeof rules.routePlan,'function');
 for(const route of ['story','bits','phase','entanglement']){
  assert.deepEqual(rules.routePlan(route,null),{route,confirm:false});
  assert.deepEqual(rules.routePlan(route,'complete'),{route,confirm:false});
  for(const phase of ['choose_tool','diagnose','resolved'])assert.deepEqual(rules.routePlan(route,phase),{route,confirm:true});
 }
 for(const route of ['bit','Phase','__proto__','',null])assert.equal(rules.routePlan(route,'diagnose'),null);
});
