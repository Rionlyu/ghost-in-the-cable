import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {registerHooks} from 'node:module';

// Node has no CSS loader. Replace only that side-effect stylesheet import;
// Node's native TS loader executes the production module without test doubles.
const sourceURL=new URL('../src/atmosphere.ts',import.meta.url);
const cssURL=new URL('../src/atmosphere.css',import.meta.url);
const hooks=registerHooks({load(url,context,next){return url===cssURL.href?{format:'module',source:'',shortCircuit:true}:next(url,context);}});
const atmosphere=existsSync(sourceURL)?await import(sourceURL.href):{};
hooks.deregister();

test('entrance preserves the short welcome and immediately usable actions beside original woods artwork',()=>{
 assert.equal(typeof atmosphere.entranceView,'function','missing entranceView');
 const html=atmosphere.entranceView();
 assert.match(html,/The <em>ghost<\/em> is<br>in the cable\./);
 assert.match(html,/Eight strange devices\. One night to put them right\./);
 assert.match(html,/<button[^>]*data-action="start"[^>]*>Open the shop/);
 assert.match(html,/<button[^>]*data-action="chapters"[^>]*>Choose a chapter/);
 assert.match(html,/<svg[^>]*class="atmo-scene"/);
 for(const layer of ['atmo-house','atmo-woods-left','atmo-woods-right','atmo-fog','atmo-window','atmo-keeper'])assert.ok(html.includes(layer),`missing ${layer}`);
 assert.doesNotMatch(html,/<button[^>]*(?:disabled|hidden|inert)/);
 assert.doesNotMatch(html,/(?:https?:|<audio|autoplay|<script)/);
 assert.equal(atmosphere.entranceView(),html,'stable, original artwork without random render changes');
});
