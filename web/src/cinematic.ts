import './cinematic.css';

/** Game title UI over an original world, not a picture beside a website pitch. */
export function cinematicView(sceneHTML:string):string {
 return `<section class="cinema" data-cinema data-cinema-state="ready" aria-label="The forest outside the midnight repair shop">
 <div class="cinema-landscape">${sceneHTML}</div><div class="cinema-vignette" aria-hidden="true"></div><div class="cinema-cut" aria-hidden="true"></div>
 <div class="cinema-title"><p>The midnight repair shift</p><h1><span>Ghost</span><small>in the</small><span>Cable</span></h1></div>
 <div class="cinema-actions"><button class="cinema-start" data-action="start">Open the shop <kbd aria-hidden="true">↵</kbd></button><button class="cinema-chapters" data-action="chapters">Choose a chapter</button></div>
 <button class="cinema-menu" data-action="menu">Menu</button><button class="cinema-help" data-action="guide">Help</button>
 <button class="cinema-skip" data-action="cinema-skip" hidden>Skip animation <kbd aria-hidden="true">Esc</kbd></button>
 </section>`;
}

export type Cinematic={sync():void;dispose():void};
type EntryOptions={onEnter:()=>void;motion:()=>boolean};

/** Owns scenery only. No session, experiment or game result exists during travel. */
export function createCinematic(root:HTMLElement,options:EntryOptions):Cinematic {
 const doc=root.ownerDocument,view=doc.defaultView!;
 const reduced=view.matchMedia('(prefers-reduced-motion: reduce)');
 let scene:HTMLElement|null=null,camera:HTMLElement|null=null;
 let epoch=0,disposed=false,entering=false,entered=false,timer:number|undefined;
 const effects=new Set<Animation>();
 const moves=()=>options.motion()&&!reduced.matches&&!doc.hidden;
 function cancel():void{epoch++;view.clearTimeout(timer);timer=undefined;for(const effect of effects)effect.cancel();effects.clear();entering=false;}
 function complete():void{if(disposed||!entering||entered||!scene?.isConnected)return;entered=true;cancel();options.onEnter();}
 function animate(element:HTMLElement,frames:Keyframe[],timing:KeyframeAnimationOptions):Animation|null{
  try{if(typeof element.animate!=='function')return null;const effect=element.animate(frames,timing);effects.add(effect);void effect.finished.catch(()=>{});return effect;}catch{return null;}
 }
 function reset():void{cancel();if(!scene)return;scene.dataset.cinemaState='ready';scene.querySelectorAll<HTMLButtonElement>('.cinema-actions button').forEach(button=>{button.disabled=false;});scene.querySelector<HTMLButtonElement>('[data-action="cinema-skip"]')!.hidden=true;}
 function sync():void{
  if(disposed)return;
  const next=root.querySelector<HTMLElement>('[data-cinema]');
  root.classList.toggle('cinematic-mode',!!next);
  if(next===scene){if(!moves()){if(entering)complete();else{cancel();if(camera)camera.style.transform='scale(1.08)';}}return;}
  cancel();scene=next;camera=scene?.querySelector<HTMLElement>('[data-forest-camera]')??null;entered=false;
  if(camera&&moves())animate(camera,[{transform:'scale(1)'},{transform:'scale(1.12)'}],{duration:6500,easing:'ease-out',fill:'forwards'});
 }
 function enter():void{
  if(!scene||entering||entered)return;
  const transform=camera?view.getComputedStyle(camera).transform:'none';
  cancel();entering=true;const generation=epoch;
  scene.dataset.cinemaState='entering';
  const skip=scene.querySelector<HTMLButtonElement>('[data-action="cinema-skip"]')!;skip.hidden=false;skip.focus({preventScroll:true});
  scene.querySelectorAll<HTMLButtonElement>('.cinema-actions button').forEach(button=>{button.disabled=true;});
  const finish=()=>{if(generation===epoch)complete();};
  if(!camera||!moves()){finish();return;}
  const effect=animate(camera,[{transform},{transform:'scale(6)'}],{duration:2400,easing:'cubic-bezier(.35,.02,.65,1)',fill:'forwards'});
  if(!effect){finish();return;}
  timer=view.setTimeout(finish,2800);
  void effect.finished.then(finish).catch(finish);
 }
 function click(event:MouseEvent):void{
  const button=(event.target as Element).closest<HTMLButtonElement>('button');
  if(!button||button.disabled||!scene?.contains(button))return;
  if(button.dataset.action==='start'){event.stopImmediatePropagation();enter();}
  else if(button.dataset.action==='cinema-skip'){event.stopImmediatePropagation();complete();}
  else if(entering&&['menu','guide','chapters'].includes(button.dataset.action??''))reset();
 }
 function key(event:KeyboardEvent):void{
  if(disposed||!scene?.isConnected||root.querySelector('dialog[open]')||event.repeat||event.altKey||event.ctrlKey||event.metaKey)return;
  if(event.key==='Escape'&&entering){event.preventDefault();complete();}
  else if(event.key==='Enter'&&!entering&&!entered&&!scene.querySelector<HTMLButtonElement>('[data-action="start"]')?.disabled&&!(event.target instanceof Element&&event.target.closest('button,a,input,select,textarea,[contenteditable="true"]'))){event.preventDefault();enter();}
 }
 root.addEventListener('click',click,true);
 doc.addEventListener('keydown',key);
 reduced.addEventListener('change',sync);doc.addEventListener('visibilitychange',sync);
 function dispose():void{if(disposed)return;disposed=true;cancel();root.removeEventListener('click',click,true);doc.removeEventListener('keydown',key);reduced.removeEventListener('change',sync);doc.removeEventListener('visibilitychange',sync);root.classList.remove('cinematic-mode');scene=camera=null;}
 return {sync,dispose};
}
