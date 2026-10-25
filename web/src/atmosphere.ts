import './atmosphere.css';

/** Original cut-paper woods. Essential copy/actions never wait for the reveal. */
export function entranceView(): string {
 return `<section class="intro atmo-entrance"><div class="hero-copy atmo-copy"><h1>The <em>ghost</em> is<br>in the cable.</h1><p class="lede">Eight strange devices. One night to put them right.</p><div class="cta-row"><button class="primary" data-action="start">Open the shop <span aria-hidden="true">→</span></button><button class="text-button" data-action="chapters">Choose a chapter</button></div></div><figure class="hero-art atmo-art"><svg class="atmo-scene" viewBox="0 0 800 660" role="img" aria-label="A crooked little repair workshop appears between pine trees and low fog. A friendly ghost waits in the warm doorway.">
 <defs>
  <linearGradient id="atmo-night" x2="0" y2="1"><stop stop-color="#26382f"/><stop offset="1" stop-color="#151b18"/></linearGradient>
  <linearGradient id="atmo-glass" x2="0" y2="1"><stop stop-color="#f5bb70"/><stop offset="1" stop-color="#ce985b"/></linearGradient>
  <symbol id="atmo-pine" viewBox="0 0 150 490"><path d="M77 4L48 79L62 75L24 150L47 145L8 228L35 219L0 300L52 283L48 478L87 473L83 289L144 312L113 235L142 245L102 159L123 168L91 90L108 96Z" fill="currentColor"/><path d="M74 70L68 470M69 209L37 187M70 264L109 220M72 139L91 119M67 357L46 330" fill="none" stroke="#b7c2ad" stroke-opacity=".13" stroke-width="3"/></symbol>
 </defs>
 <path d="M71 513Q7 321 123 155Q254 15 477 76Q691 73 748 265Q808 476 658 568Q410 647 176 559Z" fill="url(#atmo-night)"/>
 <g fill="#b7c2ad" opacity=".5"><circle cx="286" cy="99" r="1.7"/><circle cx="542" cy="137" r="1.5"/><circle cx="610" cy="194" r="1.5"/><path d="M391 102v9m-4-4h8" stroke="#b7c2ad" stroke-width="1.2"/></g>
 <path d="M486 107a29 29 0 1 0 25 45a26 26 0 0 1-25-45" fill="#eee6cf" opacity=".8"/>
 <g class="atmo-woods-back" color="#304538"><use href="#atmo-pine" x="172" y="123" width="108" height="352"/><use href="#atmo-pine" x="530" y="151" width="107" height="350"/><use href="#atmo-pine" x="620" y="151" width="105" height="342"/></g>
 <path d="M75 505Q221 432 425 469Q616 427 735 522L660 570Q432 609 179 559Z" fill="#25392b"/>
 <path d="M421 500Q381 534 349 553Q309 575 279 577L422 585Q431 541 469 505" fill="#56634a" opacity=".55"/>
 <g class="atmo-house" stroke="#111d17" stroke-width="4" stroke-linejoin="round">
  <path d="M286 305L439 225L586 314L568 506L292 500Z" fill="#53634b"/>
  <path d="M443 239L578 311L568 505L444 491Z" fill="#3c4e3e"/>
  <g fill="none" stroke="#202e22" stroke-width="2" opacity=".65"><path d="M302 348L437 330M300 382L437 369M300 418L437 407M298 455L437 446M456 347L573 374M455 386L572 412M454 426L569 450M452 466L568 487"/></g>
  <path d="M510 241L512 175L546 181L540 268" fill="#6b7155"/>
  <path d="M507 174L550 179L550 193L508 189Z" fill="#9c9c75"/>
  <path d="M257 319L433 198L613 313L596 334L434 240L276 338Z" fill="#1e2c23"/>
  <path d="M284 305L433 213L585 306M309 303L434 229L559 305" fill="none" stroke="#788369" stroke-width="2"/>
  <path d="M434 243V493" fill="none" stroke="#849076"/>
  <path d="M316 364L390 356L392 425L314 431Z" fill="#111d17"/>
  <path class="atmo-window" d="M322 370L384 364L386 419L320 424Z" fill="url(#atmo-glass)" stroke-width="2"/>
  <path d="M353 367L353 423M321 395L385 390" fill="none" stroke="#344333" stroke-width="5"/>
  <path d="M307 434L399 427" stroke="#a5aa82" stroke-width="5"/>
  <path d="M477 384Q476 346 511 351Q541 354 539 393L536 500L474 498Z" fill="#17231a"/>
  <path class="atmo-window" d="M484 387Q483 358 510 362Q533 364 531 392L528 496L482 496Z" fill="#d1a05f" stroke="none"/>
  <path d="M465 498L544 501L553 513L455 509Z" fill="#8c9471"/>
  <path d="M472 515L546 518L555 528L464 525Z" fill="#606f54"/>
  <circle cx="437" cy="287" r="24" fill="#263b2e"/><path d="M424 295Q431 277 450 279M426 305L448 302" fill="none" stroke="#bfe3a4" stroke-width="2"/>
  <path d="M299 455L392 451L390 480L302 486Z" fill="#eee6cf" stroke-width="2"/>
  <path d="M314 465L377 461M316 473L356 470" stroke="#52604a" stroke-width="3"/>
  <path d="M562 412Q604 407 605 450Q606 478 627 480" fill="none" stroke="#b58350" stroke-width="5"/>
  <path d="M625 470L625 488L638 486L638 471M628 464V471M635 463V470" fill="#b58350" stroke-width="2"/>
 </g>
 <g class="atmo-keeper" transform="translate(490 424) rotate(5)" stroke="#243b2a" stroke-width="2.5" stroke-linejoin="round"><path d="M-10 55L-12 12Q-11-17 12-17Q36-16 36 12L35 54L24 47L13 56L2 48Z" fill="#c1d6a7"/><path d="M-9 22Q-29 14-24 1M36 19Q52 11 51-1" fill="none" stroke="#c1d6a7" stroke-width="8" stroke-linecap="round"/><ellipse cx="5" cy="8" rx="2.4" ry="4" fill="#243b2a" stroke="none"/><ellipse cx="23" cy="8" rx="2.4" ry="4" fill="#243b2a" stroke="none"/><path d="M10 22Q15 26 21 20" fill="none" stroke-linecap="round"/></g>
 <g class="atmo-woods-left" color="#17291f"><use href="#atmo-pine" x="65" y="45" width="154" height="503"/><use href="#atmo-pine" x="2" y="183" width="118" height="385"/></g>
 <g class="atmo-woods-right" color="#17291f"><use href="#atmo-pine" x="624" y="40" width="157" height="513"/><use href="#atmo-pine" x="717" y="231" width="93" height="303"/></g>
 <g fill="none" stroke="#738366" stroke-linecap="round" stroke-width="2" opacity=".65"><path d="M213 536l-7-14m7 14l9-18m-5 20l13-5M609 541l7-19m-7 19l-8-12M170 561l-9-12m9 12l6-17"/></g>
 <g class="atmo-fog" fill="#b7c2ad"><path d="M28 521Q153 480 280 515T535 512T783 518L768 541Q638 518 527 544T276 541T42 548Z" opacity=".12"/><path d="M96 561Q225 534 360 562T686 549L663 575Q515 599 365 580T113 582Z" opacity=".1"/></g>
 </svg></figure></section>`;
}

type AtmosphereState = {ticketKey: string|null; phase: string; correct: boolean|null};
type PulseKind = 'probe'|'repair'|'step'|'switch-bit'|'switch-phase';
type Voice = {source: AudioScheduledSourceNode; nodes: AudioNode[]; cue: boolean};

export type Atmosphere = {
 sync(state: AtmosphereState): void;
 pulse(kind: PulseKind): void;
 setSound(enabled: boolean): Promise<boolean>;
 setMotion(enabled: boolean): void;
 readonly sound: boolean;
 readonly motion: boolean;
 dispose(): void;
};

/** Uses only the renderer's public ticket identity and confirmed debrief. */
export function createAtmosphere(root: HTMLElement): Atmosphere {
 let ticketKey: string|null = null;
 let confirmed: boolean|null = null;
 let entranceSeen = false;
 let motionRequested = true;
 let disposed = false;
 let soundWanted = false;
 let soundEpoch = 0;
 let suspension: Promise<void> = Promise.resolve();
 let audio: AudioContext|null = null;
 let output: GainNode|null = null;
 let noise: AudioBuffer|null = null;
 const voices = new Set<Voice>();
 const effects = new Set<Animation>();
 let pulseEpoch = 0;
 const doc = root.ownerDocument;
 const view = doc.defaultView!;
 const reduced = view.matchMedia('(prefers-reduced-motion: reduce)');
 root.classList.add('atmo-surface');
 const motion = (): boolean => !disposed && motionRequested && !reduced.matches;
 function cancelEffects(): void {for(const effect of effects) effect.cancel(); effects.clear();}
 function clearOneShots(): void {
  for(const element of root.querySelectorAll('[data-atmo-arrival], [data-atmo-impact], [data-atmo-reveal]')) {
   element.removeAttribute('data-atmo-arrival'); element.removeAttribute('data-atmo-impact'); element.removeAttribute('data-atmo-reveal');
  }
 }
 function consumeAnimation(event: AnimationEvent): void {
  const element = event.target as Element;
  if(event.animationName === 'atmo-ticket-arrive') element.removeAttribute('data-atmo-arrival');
  if(event.animationName === 'atmo-ink-land') element.removeAttribute('data-atmo-impact');
  if(event.animationName === 'atmo-fog-part') element.closest('.atmo-scene')?.removeAttribute('data-atmo-reveal');
 }
 function updateMotion(): void {
  root.dataset.atmoMotion = motion() ? 'on' : 'off';
  if(!motion()) {cancelEffects(); clearOneShots();}
 }
 function setMotion(enabled: boolean): void {if(!disposed) {motionRequested = enabled; updateMotion();}}
 reduced.addEventListener('change', updateMotion);
 doc.addEventListener('visibilitychange', updateVisibility);
 root.addEventListener('animationend', consumeAnimation);
 updateMotion();
 updateVisibility();

 function updateVisibility(): void {
  root.dataset.atmoVisible = doc.hidden ? 'off' : 'on';
  if(doc.hidden) {cancelEffects(); stopGraph();}
  // Keep the explicitly unlocked context, but no active/connected voices while
  // hidden. Returning starts no context and calls no non-gesture resume.
  else if(soundWanted && !disposed) startGraph();
 }
 function release(voice: Voice, stop = true): void {
  voice.source.onended = null;
  if(stop) {try {voice.source.stop();} catch {/* Already ended. */}}
  for(const node of voice.nodes) node.disconnect();
  voices.delete(voice);
 }
 function stopGraph(): void {
  if(output && audio && audio.state !== 'closed') {
   output.gain.cancelScheduledValues(audio.currentTime);
   output.gain.setValueAtTime(0, audio.currentTime);
  }
  for(const voice of voices) release(voice);
  output?.disconnect();
  output = null;
 }
 function noiseBuffer(): AudioBuffer {
  if(noise) return noise;
  const context = audio!;
  noise = context.createBuffer(1, Math.ceil(context.sampleRate * 1.5), context.sampleRate);
  const samples = noise.getChannelData(0);
  let seed = 15873;
  for(let i = 0; i < samples.length; i++) {
   seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
   samples[i] = seed / 2147483648 - 1;
  }
  return noise;
 }
 function attach(source: AudioScheduledSourceNode, nodes: AudioNode[], cue: boolean): Voice {
  const voice = {source, nodes: [source, ...nodes], cue};
  voices.add(voice);
  source.onended = () => release(voice, false);
  return voice;
 }
 function startGraph(): void {
  if(output || !audio || audio.state !== 'running' || !soundWanted || disposed || doc.hidden) return;
  const context = audio;
  output = context.createGain();
  output.gain.setValueAtTime(0, context.currentTime);
  output.gain.linearRampToValueAtTime(.08, context.currentTime + .045);
  output.connect(context.destination);
  const hum = context.createOscillator(), humGain = context.createGain();
  hum.type = 'sine'; hum.frequency.value = 58; humGain.gain.value = .035;
  hum.connect(humGain); humGain.connect(output);
  attach(hum, [humGain], false); hum.start();
  const hiss = context.createBufferSource(), filter = context.createBiquadFilter(), hissGain = context.createGain();
  hiss.buffer = noiseBuffer(); hiss.loop = true;
  filter.type = 'lowpass'; filter.frequency.value = 550; hissGain.gain.value = .012;
  hiss.connect(filter); filter.connect(hissGain); hissGain.connect(output);
  attach(hiss, [filter, hissGain], false); hiss.start();
 }
 function foley(kind: 'probe'|'repair'|'step'|'stamp'): void {
  if(!soundWanted || disposed || doc.hidden || !audio || audio.state !== 'running' || !output) return;
  // A rapid sequence cannot accumulate an unbounded collection of sources.
  const cues = [...voices].filter(voice => voice.cue);
  if(cues.length >= 4) release(cues[0]);
  const duration = kind === 'stamp' ? .12 : .055;
  const source = audio.createBufferSource(), filter = audio.createBiquadFilter(), gain = audio.createGain();
  source.buffer = noiseBuffer();
  filter.type = 'bandpass'; filter.frequency.value = ({stamp:170, repair:1100, probe:420, step:760})[kind]; filter.Q.value = .7;
  const now = audio.currentTime;
  gain.gain.setValueAtTime(.0001, now);
  gain.gain.linearRampToValueAtTime(kind === 'stamp' ? .16 : .07, now + .004);
  gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
  source.connect(filter); filter.connect(gain); gain.connect(output);
  attach(source, [filter, gain], true);
  source.start(now, 0, duration); source.stop(now + duration + .01);
 }
 function pulse(kind: PulseKind): void {
  if(disposed) return;
  const adjustment = kind === 'switch-bit' ? 'bit' : kind === 'switch-phase' ? 'phase' : null;
  foley(adjustment ? 'repair' : kind as 'probe'|'repair'|'step');
  cancelEffects();
  const epoch = ++pulseEpoch;
  // Main may pulse immediately before its synchronous DOM replacement. Only
  // the visual waits one microtask; public feedback/state is already final.
  queueMicrotask(() => {
   if(epoch !== pulseEpoch || !motion() || doc.hidden) return;
   const selector = adjustment ? `[data-signal="${adjustment}"] .signal-line` : kind === 'probe' ? '.signal-line' : kind === 'repair' ? '.device-knob' : '.atmo-keeper, .device-symbol';
   for(const element of [...root.querySelectorAll<HTMLElement|SVGElement>(selector)].slice(0, 8)) {
    // A switch sends a cosmetic pulse through its own trace, then settles back
    // to the original measurement. No tentative correction is evaluated here.
    const frames = adjustment ? [
     {transform:'translate(0,0)',strokeDasharray:'16 10',strokeDashoffset:'52'},
     {transform:adjustment === 'bit' ? 'translate(0,-12px)' : 'translate(24px,0)',offset:.25},
     {transform:adjustment === 'bit' ? 'translate(0,7px)' : 'translate(-12px,0)',offset:.55},
     {transform:'translate(0,0)',strokeDasharray:'16 10',strokeDashoffset:'0'},
    ] : kind === 'probe' ? [{strokeDasharray:'16 10', strokeDashoffset:'52'}, {strokeDasharray:'16 10', strokeDashoffset:'0'}] : [{translate:'0 0'}, {translate:'0 -2px', offset:.45}, {translate:'0 0'}];
    const effect = element.animate(frames, {duration:adjustment ? 720 : kind === 'probe' ? 620 : 180, easing:'ease-out'});
    effects.add(effect);
    effect.onfinish = effect.oncancel = () => {effects.delete(effect);};
   }
  });
 }
 function suspendAudio(): Promise<void> {
  if(!audio || audio.state === 'closed') return suspension;
  try {
   const pending = audio.suspend().catch(() => {});
   suspension = Promise.all([suspension, pending]).then(() => {});
  } catch {/* The disconnected graph remains muted even if suspension is unavailable. */}
  return suspension;
 }
 async function setSound(enabled: boolean): Promise<boolean> {
  if(disposed) return false;
  const epoch = ++soundEpoch;
  soundWanted = enabled; // Reflect pending intent so a second click really mutes.
  if(!enabled) {
   stopGraph();
   await suspendAudio();
   return soundWanted && !disposed;
  }
  try {
   // No await before creation/resume: caller invokes this in its click handler.
   audio ??= new view.AudioContext();
   const resumed = audio.resume();
   await Promise.all([resumed, suspension]);
   if(epoch !== soundEpoch || disposed) {
    if(!soundWanted && !disposed) await suspendAudio();
    return soundWanted && !disposed;
   }
   if(doc.hidden) return soundWanted;
   // A mute already in flight can land after the gesture's first resume.
   if(audio.state !== 'running') await audio.resume();
   if(epoch === soundEpoch && soundWanted && !disposed && !doc.hidden) startGraph();
   return soundWanted && !disposed;
  } catch {
   if(epoch === soundEpoch && !disposed) {
    soundWanted = false; stopGraph(); await suspendAudio();
   }
   return soundWanted && !disposed;
  }
 }
 function dispose(): void {
  if(disposed) return;
  disposed = true; soundWanted = false; soundEpoch++;
  reduced.removeEventListener('change', updateMotion);
  doc.removeEventListener('visibilitychange', updateVisibility);
  root.removeEventListener('animationend', consumeAnimation);
  cancelEffects(); stopGraph(); updateMotion();
  if(audio && audio.state !== 'closed') void audio.close().catch(() => {});
  noise = null;
 }

 function sync(state: AtmosphereState): void {
  if(disposed) return;
  const scene = root.querySelector<SVGElement>('.atmo-scene');
  if(scene) {
   if(!entranceSeen && motion()) scene.dataset.atmoReveal = 'new';
   entranceSeen = true;
  }
  if(state.ticketKey === null) return; // Visiting Help/training is not a new ticket.
  const isNew = state.ticketKey !== ticketKey;
  if(isNew) confirmed = null;
  const ticket = root.querySelector<HTMLElement>('.paper-ticket');
  if(ticket) {
   if(isNew && state.phase !== 'resolved' && motion()) ticket.dataset.atmoArrival = 'new';
   else delete ticket.dataset.atmoArrival;
   const resolved = state.phase === 'resolved' && typeof state.correct === 'boolean';
   let stamp = ticket.querySelector<HTMLElement>('[data-ticket-stamp]');
   if(!resolved) stamp?.remove();
   else {
    if(!stamp) {
     stamp = root.ownerDocument.createElement('p');
     stamp.className = 'atmo-stamp';
     ticket.append(stamp);
     if(!isNew && confirmed === null) {
      if(motion()) stamp.dataset.atmoImpact = 'new';
      foley('stamp');
     }
    }
    stamp.dataset.ticketStamp = state.correct ? 'repaired' : 'failed';
    stamp.textContent = state.correct ? 'Repaired' : 'Not fixed';
    stamp.setAttribute('aria-label', `Repair confirmed: ${state.correct ? 'repaired' : 'not fixed'}`);
   }
  }
  if(state.phase === 'resolved' && typeof state.correct === 'boolean') confirmed = state.correct;
  ticketKey = state.ticketKey;
 }
 return {sync, pulse, setSound, setMotion, get sound(): boolean {return soundWanted;}, get motion(): boolean {return motion();}, dispose};
}
