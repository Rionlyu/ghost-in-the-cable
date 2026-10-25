import test from 'node:test';
import assert from 'node:assert/strict';
import {tutorialView} from '../src/tutorial.ts';

test('phase teaching distinguishes a coherent superposition from a random classical choice',()=>{
 const html=tutorialView({stage:3,pending:false,results:[],error:'',repair:{bit:false,phase:false},repaired:false,applied:false});
 assert.match(html,/not a random choice/i,'superposition must not be defined as a classical equal mixture');
 assert.doesNotMatch(html,/equal mix/i,'visible and accessible copy must not call the coherent plus/minus states mixtures');
 assert.match(html,/relative.*sign/i);
 assert.match(html,/data-decoder/);
});
