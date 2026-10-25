import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
const api = await import('../src/api.ts').catch(() => ({}));

test('API transport returns real JSON and fails closed on server errors', async () => {
  assert.equal(typeof api.requestJSON, 'function', 'requestJSON must connect to the real server');
  const server=createServer((req,res)=>{res.setHeader('content-type','application/json');if(req.url==='/fail'){res.statusCode=409;res.end(JSON.stringify({detail:'One probe only.'}));}else res.end(JSON.stringify({phase:'diagnose',bits:'10'}));});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  try {
    assert.deepEqual(await api.requestJSON(base+'/ok'),{phase:'diagnose',bits:'10'});
    await assert.rejects(api.requestJSON(base+'/fail'),error=>error.status===409 && error.message==='One probe only.');
  } finally {await new Promise(resolve=>server.close(resolve));}
});
