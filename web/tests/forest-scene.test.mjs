import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {registerHooks} from 'node:module';

const sourceURL = new URL('../src/forest-scene.ts', import.meta.url);
const cssURL = new URL('../src/forest-scene.css', import.meta.url);
const hooks = registerHooks({load(url, context, next) {
 return url === cssURL.href ? {format: 'module', source: '', shortCircuit: true} : next(url, context);
}});
const scene = existsSync(sourceURL) ? await import(sourceURL.href) : {};
hooks.deregister();

test('forestScene renders a deterministic, original world with one camera and meaningful depths, without interface content', () => {
 assert.equal(typeof scene.forestScene, 'function', 'missing forestScene export');
 const html = scene.forestScene();
 assert.match(html, /^\s*<div class="forest-world"[^>]*>/);
 assert.equal((html.match(/data-forest-camera(?:\s|>)/g) || []).length, 1, 'one parent-controlled camera');
 for (const depth of ['far', 'middle', 'ground', 'workshop', 'near-left', 'near-right', 'fog']) {
  assert.ok(html.includes(`data-forest-depth="${depth}"`), `missing ${depth} depth`);
 }
 assert.match(html, /aria-hidden="true"/);
 assert.doesNotMatch(html, /<(?:text|button|a|h[1-6]|p|img|script|audio)\b/);
 assert.doesNotMatch(html, /(?:https?:\/\/|Math\.random|<animate(?:Transform)?\b)/);
 assert.equal(scene.forestScene(), html, 'no randomness, time or render counters');
});

test('forest markup respects the production CSP without inline style attributes', () => {
 assert.doesNotMatch(scene.forestScene(), /\sstyle\s*=/i);
});

test('narrow tree symbols stretch to their authored ground plane rather than floating through preserveAspectRatio letterboxing', () => {
 const html = scene.forestScene();
 assert.match(html, /<symbol[^>]*id="forest-bare"[^>]*preserveAspectRatio="none"/);
});

test('the full-viewport camera is initially stable at the workshop origin and responsive foregrounds are independently edge anchored', () => {
 const css = readFileSync(cssURL, 'utf8');
 assert.match(css, /\.forest-camera\s*\{[^}]*inset:\s*0\s*;/);
 assert.match(css, /\.forest-camera\s*\{[^}]*transform:\s*none\s*;/);
 assert.match(css, /\.forest-camera\s*\{[^}]*transform-origin:\s*50%\s+60%\s*;/);
 assert.doesNotMatch(css, /\.forest-camera\s*\{[^}]*(?:animation|transition)\s*:/);
 assert.match(css, /\.forest-near-left\s*\{[^}]*left:\s*0/);
 assert.match(css, /\.forest-near-right\s*\{[^}]*right:\s*0/);
});

test('ambient motion is opt-out and visibility-safe, with a static reduced-motion world and no CSS camera animation', () => {
 const css = readFileSync(cssURL, 'utf8');
 assert.match(css, /animation:\s*forest-fog-drift\s/);
 assert.match(css, /\[data-atmo-motion="off"\][\s\S]*?animation:\s*none\s*!important/);
 assert.match(css, /\[data-atmo-visible="off"\][\s\S]*?animation-play-state:\s*paused\s*!important/);
 assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?animation:\s*none\s*!important/);
 assert.doesNotMatch(css, /@keyframes\s+forest-(?:camera|travel|push)/);
});
