import test from 'node:test';
import assert from 'node:assert/strict';

const rules = await import('../src/rules.ts').catch(() => ({}));

test('a Bell probe requires a token and a fresh ticket', () => {
  assert.equal(typeof rules.canProbe, 'function', 'canProbe must implement the server phase and budget guard');
  assert.equal(rules.canProbe({ phase: 'choose_tool', bell_tokens: 0 }, 'bell'), false);
  assert.equal(rules.canProbe({ phase: 'choose_tool', bell_tokens: 1 }, 'bell'), true);
  assert.equal(rules.canProbe({ phase: 'diagnose', bell_tokens: 3 }, 'z'), false);
  assert.equal(rules.canProbe({ phase: 'choose_tool', bell_tokens: 0 }, 'x'), true);
});
