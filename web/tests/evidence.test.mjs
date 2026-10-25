import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';

test('the build publishes the exact recorded experiment, not invented frontend metrics', async () => {
  const result = spawnSync(process.execPath, ['scripts/sync-evidence.mjs'], {encoding:'utf8'});
  assert.equal(result.status, 0, result.stderr);
  for (const name of ['benchmark.json', 'benchmark.svg']) {
    assert.equal(await readFile(`public/evidence/${name}`, 'utf8'), await readFile(`../evidence/${name}`, 'utf8'));
  }
  const report = JSON.parse(await readFile('public/evidence/benchmark.json', 'utf8'));
  assert.equal(report.hardware_used, false);
  assert.equal(report.results.length, 24);
  assert.ok(report.results.every(row => row.total === report.shots_per_fault * 4));
});
