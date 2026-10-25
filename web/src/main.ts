import './styles.css';
import './game.css';
import './evidence.css';
import './tutorial.css';
import {createTutorial,tutorialView} from './tutorial';
import {createAtmosphere} from './atmosphere';
import {cinematicView,createCinematic} from './cinematic';
import {forestScene} from './forest-scene';
import {ApiError,requestJSON} from './api';
import {canProbe,repairFault,routePlan} from './rules';
import type {Repair} from './rules';
import type {Shift,Meta,Tool,Evidence,Route} from './types';
import {escapeHTML as e,chaptersView,guideView,shiftStrip,ticketView,benchView,toolsView,diagnosisView,debriefView,circuitView,receiptView,evidenceView} from './views';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `<div class="shell"><header class="masthead"><div class="brand"><img src="/favicon.svg" alt="" width="36" height="36"><span class="brand-name">Ghost in the Cable</span></div><nav class="nav" aria-label="Shop resources"><button data-action="guide">Help</button><button data-action="menu">Menu</button></nav></header><main id="main" tabindex="-1">${cinematicView(forestScene())}</main><footer class="footer">Qiskit simulation</footer></div><dialog aria-labelledby="dialog-title"><div class="dialog-head"><h2 id="dialog-title"></h2><button class="icon-button" data-action="close" aria-label="Close dialog">×</button></div><div class="dialog-body"></div></dialog>`;
const dialog = document.querySelector<HTMLDialogElement>('dialog')!;
const main=document.querySelector<HTMLElement>('#main')!;
const intro=main.innerHTML;
const atmosphere=createAtmosphere(app);
const cinema=createCinematic(app,{motion:()=>atmosphere.motion,onEnter:()=>{if(dialog.open)dialog.close();void startShift();}});
let tutorial:ReturnType<typeof createTutorial>|null=null;
let tutorialFromWelcome=false;
const status=document.createElement('div');
status.id='live-status'; status.className='global-status status';status.tabIndex=-1;status.setAttribute('role','status');status.setAttribute('aria-live','polite');main.before(status);
let opener:HTMLElement|null=null;
let dialogEpoch=0;
let shift:Shift|null=null, meta:Meta|null=null;
let selectedTool:Tool|null=null;
let repair:Repair={bit:false,phase:false};
let storyIntro=false;

let requestedRoute:Route='story';
let busy=false, uncertain=false, lost=false, error='', storageWarning='';
let retry:'start'|'sync'|'export'='start';
const storageKey='ghost-in-the-cable-shift';
function savedID():string|null {try{return localStorage.getItem(storageKey);}catch{storageWarning='Local saving is unavailable in this browser. Keep this tab open to finish your shift.';return null;}}
function saveID(id:string):void {try{localStorage.setItem(storageKey,id);}catch{storageWarning='Local saving is unavailable. Keep this tab open to finish your shift.';}}
function endpoint(suffix=''):string{return `/api/shifts/${encodeURIComponent(shift!.id)}${suffix}`;}
function notify(message:string):void{status.textContent=message;status.classList.toggle('pending',busy);}
function render():void {renderContent();atmosphere.sync({ticketKey:!tutorial&&!storyIntro&&shift?.ticket?`${shift.id}:${shift.ticket.id}`:null,phase:tutorial?'tutorial':storyIntro?'welcome':shift?.phase??'landing',correct:!tutorial&&!storyIntro&&shift?.phase==='resolved'?shift.debrief!.correct:null});cinema.sync();}
function renderContent():void {
 if(tutorial){const active=document.activeElement as HTMLElement|null;const action=active&&main.contains(active)?active.dataset.action:null;main.innerHTML=tutorialView(tutorial.state,!shift?'shop':shift.route==='story'&&shift.revision===0?'first-ticket':'shift');if(action)main.querySelector<HTMLElement>(`[data-action="${action}"]`)?.focus({preventScroll:true});return;}
 const active=document.activeElement as HTMLElement|null;
 const selector=active?.dataset.tool?`[data-tool="${active.dataset.tool}"]`:active?.dataset.repair?`[data-repair="${active.dataset.repair}"]`:null;
 const errorPanel=error?`<aside class="error" role="alert"><p class="error-title">The connection needs attention.</p><p>${e(error)}</p><div class="error-actions"><button class="secondary" data-action="retry" ${busy?'disabled':''}>${retry==='sync'?'Refresh bench':'Retry'}</button>${shift?'':'<button class="text-button" data-action="dismiss-error">Back to shop</button>'}</div></aside>`:'';
 const warning=storageWarning?`<p class="storage-warning">${e(storageWarning)}</p>`:'';
 if(lost){main.innerHTML=`<section class="lost-state"><p class="eyebrow amber">THE SERVER’S NOTEBOOK IS EMPTY</p><h1>This shift has slipped away.</h1><p>The server no longer has this shift. Local sessions are temporary and can disappear after a restart or expiry. Your saved ID cannot recover a missing server session.</p><button class="primary" data-action="start" ${busy?'disabled':''}>Start a new shift <span aria-hidden="true">→</span></button>${errorPanel}</section>`;return;}
 if(!shift){main.innerHTML=errorPanel+warning+intro;main.querySelector<HTMLButtonElement>('[data-action="start"]')!.disabled=busy;return;}
 if(storyIntro){main.innerHTML=errorPanel+`<section class="story-beat"><img src="/favicon.svg" width="76" height="76" alt=""><p class="eyebrow">THE WORKSHOP KEEPER</p><h1 tabindex="-1" data-focus>The village is counting on us.</h1><p class="welcome-copy">“I keep this little shop through the night. Mara’s porchlight is our first job. Let’s try the tools on spare cables before we touch hers.”</p><div class="cta-row"><button class="primary" data-action="story-continue">Learn the tools <span aria-hidden="true">→</span></button><button class="text-button" data-action="skip-intro">Skip to repairs</button></div></section>`;return;}
 main.innerHTML=shiftStrip(shift)+errorPanel+warning+(shift.phase==='complete'?receiptView(shift):`<div class="workbench phase-${shift.phase}">${ticketView(shift)}<div class="bench-space">${benchView(shift,repair)}${shift.phase==='choose_tool'&&meta?toolsView(shift,meta,selectedTool,busy||uncertain):shift.phase==='diagnose'?diagnosisView(shift,repair,busy||uncertain):debriefView(shift,busy||uncertain)}</div></div>`);
 if(busy)main.querySelectorAll<HTMLButtonElement>('button').forEach(button=>{button.disabled=true;});
 if(selector&&!busy)main.querySelector<HTMLElement>(selector)?.focus({preventScroll:true});
}
function setPending(message:string):void{busy=true;error='';notify(message);status.focus({preventScroll:true});render();}
function finish(message=''):void{const retain=document.activeElement===status;busy=false;render();notify(message);if(retain){const target=main.querySelector<HTMLElement>('#station-title[data-focus],#debrief-title[data-focus]')??main.querySelector<HTMLElement>('[data-focus]')??main.querySelector<HTMLElement>('h1')??main;target.setAttribute('tabindex','-1');target.focus({preventScroll:true});}}
function accept(next:Shift):void{shift=next;saveID(next.id);lost=false;uncertain=false;selectedTool=null;repair={bit:false,phase:false};}
async function ensureMeta():Promise<void>{meta??=await requestJSON<Meta>('/api/meta');}
async function startShift(route:Route='story'):Promise<void>{if(busy)return;endTutorial(false);storyIntro=false;requestedRoute=route;retry='start';setPending('Opening the shop…');try{await ensureMeta();accept(await requestJSON<Shift>('/api/shifts',{route}));storyIntro=route==='story';atmosphere.pulse('step');finish('Shift opened. Read your first ticket.');}catch(cause){error=message(cause);finish('Could not open the shift.');}}
function message(cause:unknown):string{return cause instanceof Error?cause.message:'An unexpected connection error occurred. No result was invented.';}
async function sync(id=shift?.id??savedID()):Promise<void>{if(busy||!id)return;endTutorial(false);storyIntro=false;retry='sync';setPending('Restoring the bench from the server…');try{await ensureMeta();accept(await requestJSON<Shift>(`/api/shifts/${encodeURIComponent(id)}`));finish('Your saved shift is back on the bench.');}catch(cause){if(cause instanceof ApiError&&cause.status===404){lost=true;error='';}else error=message(cause);finish(lost?'The server no longer has this shift. Start a new shift to continue.':'Could not restore the shift.');}}
async function mutate(action:'probe'|'diagnose'|'next'):Promise<void>{if(busy||uncertain||!shift||tutorial||storyIntro)return;const expected=action==='probe'?'choose_tool':action==='diagnose'?'diagnose':'resolved';if(shift.phase!==expected)return;if(action==='probe'&&(!selectedTool||!canProbe(shift,selectedTool)))return;const fault=repairFault(repair);if(action==='diagnose'&&!shift.ticket!.suspects.includes(fault))return;
 const expected_revision=shift.revision;
 const body=action==='probe'?{tool:selectedTool,expected_revision}:action==='diagnose'?{fault,expected_revision}:{expected_revision};
 retry='sync';setPending(action==='probe'?'Running one Qiskit device query…':action==='diagnose'?'Applying the repair…':'Bringing over the next ticket…');
 try{const next=await requestJSON<Shift>(endpoint('/'+action),body);accept(next);atmosphere.pulse(action==='probe'?'probe':action==='diagnose'?'repair':'step');finish(action==='probe'?'Signal received. Adjust the repair switches.':action==='diagnose'?'Repair checked. The result and circuit are now available.':next.phase==='complete'?'Shift complete. Your receipt is ready.':'The next ticket is ready.');}
 catch(cause){error=message(cause);try{const current=await requestJSON<Shift>(endpoint());accept(current);error+=' The bench was refreshed from the server. Review its current state before continuing.';}catch(recovery){if(recovery instanceof ApiError&&recovery.status===404){lost=true;error='';}else {uncertain=true;error+=' We could not confirm whether that action arrived. Refresh the bench before trying again.';}}finish('The action could not be confirmed. Check the connection message.');}}
function openDialog(title:string,html:string,button?:HTMLElement):void{dialogEpoch++;const source=button??document.activeElement as HTMLElement;if(!dialog.open||!dialog.contains(source))opener=source;document.querySelector('#dialog-title')!.textContent=title;document.querySelector('.dialog-body')!.innerHTML=html;if(!dialog.open)dialog.showModal();dialog.scrollTop=0;dialog.querySelector<HTMLButtonElement>('[data-action="close"]')!.focus({preventScroll:true});}
async function showEvidence(button:HTMLElement):Promise<void>{openDialog('The science under the counter.','<p role="status">Fetching exact circuit probabilities from the server…</p>',button);const epoch=dialogEpoch;try{const data=await requestJSON<Evidence>('/api/evidence');if(dialog.open&&epoch===dialogEpoch)document.querySelector('.dialog-body')!.innerHTML=evidenceView(data);}catch(cause){if(dialog.open&&epoch===dialogEpoch)document.querySelector('.dialog-body')!.innerHTML=`<p role="alert">${e(message(cause))}</p><p>No circuit data was substituted.</p><button class="secondary" data-action="evidence-retry">Retry science request</button>`;}}
async function exportReport():Promise<void>{if(busy||shift?.phase!=='complete')return;retry='export';setPending('Requesting the complete shift report…');try{const report=await requestJSON<unknown>(endpoint('/report'));const blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='ghost-in-the-cable-shift.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);finish('Shift JSON downloaded.');}catch(cause){error=message(cause);finish('Could not download the report.');}}

async function toggleSound(button:HTMLButtonElement):Promise<void>{const enabled=await atmosphere.setSound(!atmosphere.sound);if(button.isConnected){button.textContent=`Sound: ${enabled?'on':'off'}`;button.setAttribute('aria-pressed',String(enabled));}}
function focusCurrent():void{main.querySelector<HTMLElement>('[data-focus]')?.focus({preventScroll:true});}
function restartFromIntro():void{if(busy||tutorial?.state.pending)return;endTutorial(false);tutorialFromWelcome=false;shift=null;selectedTool=null;repair={bit:false,phase:false};storyIntro=false;requestedRoute='story';uncertain=false;lost=false;error='';retry='start';try{localStorage.removeItem(storageKey);}catch{storageWarning='This tab has restarted, but the browser could not clear the old save. Refresh may restore the earlier shift.';}dialogEpoch++;if(dialog.open)dialog.close();notify('New game. Open the shop to begin again.');render();main.querySelector<HTMLElement>('[data-action="start"]')?.focus({preventScroll:true});window.scrollTo(0,0);}
function endTutorial(showBench=true):void{tutorial?.dispose();tutorial=null;if(showBench){storyIntro=false;notify('Back at your unchanged customer ticket.');render();focusCurrent();}}
function beginTutorial():void{if(busy)return;tutorialFromWelcome=storyIntro;tutorial?.dispose();tutorial=createTutorial(requestJSON);storyIntro=false;if(dialog.open)dialog.close();render();focusCurrent();notify('Resettable training cables. Your real shift stays untouched.');}
async function runTraining():Promise<void>{const current=tutorial;if(!current||current.state.pending)return;const stage=current.state.stage;status.focus({preventScroll:true});const pending=current.run();notify('Running a separate training circuit…');render();await pending;if(tutorial!==current||current.state.stage!==stage)return;const retain=document.activeElement===status;render();notify(current.state.error?'Training did not finish. Retry or skip.':'Training reading received.');if(retain&&!dialog.open)focusCurrent();}

app.addEventListener('click',event=>{const button=(event.target as Element).closest<HTMLButtonElement>('button');if(!button||button.disabled)return;const action=button.dataset.action;
 if(action==='intro-replay'){if(busy||tutorial?.state.pending)return;if(shift||tutorial||lost||savedID())openDialog('Restart from the beginning?',`<p>This restarts the whole game: the forest, the keeper, training and a fresh story shift. Your current game will no longer be resumed in this browser.</p><div class="dialog-actions"><button class="secondary" data-action="close">Keep playing</button><button class="primary" data-action="confirm-intro-restart">Restart game</button></div>`,button);else restartFromIntro();return;}
 if(action==='confirm-intro-restart'){restartFromIntro();return;}
 if(action==='tutorial-replay'||action==='story-continue'){beginTutorial();return;}
 if(action==='tutorial-skip'){endTutorial();return;}
 if(action==='tutorial-run'){void runTraining();return;}
 if(action==='tutorial-back'&&tutorial){if(!tutorial.back()){const welcome=tutorialFromWelcome;endTutorial(false);storyIntro=welcome;}render();focusCurrent();return;}
 if(action==='tutorial-next'&&tutorial){if(tutorial.state.stage===6){if(tutorial.state.repaired)endTutorial();}else if(tutorial.next()){render();focusCurrent();atmosphere.pulse('step');}return;}
 if(button.dataset.trainingSwitch&&tutorial){tutorial.toggle(button.dataset.trainingSwitch as keyof Repair);render();main.querySelector<HTMLElement>(`[data-training-switch="${button.dataset.trainingSwitch}"]`)?.focus({preventScroll:true});return;}
 if(action==='tutorial-apply'&&tutorial){tutorial.apply();render();focusCurrent();atmosphere.pulse('repair');return;}
 if(button.dataset.tool&&!tutorial&&!storyIntro&&!busy&&!uncertain&&shift?.phase==='choose_tool'){selectedTool=button.dataset.tool as Tool;render();main.querySelector<HTMLElement>(`[data-tool="${selectedTool}"]`)?.focus({preventScroll:true});return;}
 if(button.dataset.repair&&!tutorial&&!storyIntro&&!busy&&!uncertain&&shift?.phase==='diagnose'){const dimension=button.dataset.repair as keyof Repair;const allowed=dimension==='bit'?['X','Y']:dimension==='phase'?['Z','Y']:[];if(shift.ticket!.suspects.some(f=>allowed.includes(f))){repair[dimension]=!repair[dimension];render();atmosphere.pulse(dimension==='bit'?'switch-bit':'switch-phase');main.querySelector<HTMLElement>(`[data-repair="${dimension}"]`)?.focus({preventScroll:true});}return;}
 if(button.dataset.route&&!busy){const plan=routePlan(button.dataset.route,shift?.phase??null);if(!plan)return;if(plan.confirm)openDialog('Leave this shift?',`<p>This starts a new shift. Your current progress stays on the old shift; this browser will switch to the ${e(plan.route)} chapter.</p><div class="dialog-actions"><button class="secondary" data-action="close">Keep this shift</button><button class="primary" data-action="confirm-route" data-route-target="${plan.route}">Start chapter</button></div>`,button);else{dialog.close();void startShift(plan.route);}return;}
 if(action==='chapters'&&!busy)openDialog('Choose a chapter',chaptersView(),button);
 else if(action==='confirm-route'&&!busy){const plan=routePlan(button.dataset.routeTarget,shift?.phase??null);if(plan){dialog.close();void startShift(plan.route);}}
 else if(action==='guide')openDialog('Help',guideView(),button);
 else if(action==='skip-intro'){storyIntro=false;render();focusCurrent();}
 else if(action==='menu')openDialog('Menu',`<div class="menu-list"><button data-action="intro-replay" ${busy||tutorial?.state.pending?'disabled':''}>Replay intro</button><button data-action="tutorial-replay" ${busy?'disabled':''}>Learn the tools</button><button data-action="chapters">Choose a chapter</button><button data-action="evidence">The science</button><button data-action="sound" aria-pressed="${atmosphere.sound}">Sound: ${atmosphere.sound?'on':'off'}</button><button data-action="motion" aria-pressed="${atmosphere.motion}">Motion: ${atmosphere.motion?'on':'off'}</button><button data-action="reset" ${busy?'disabled':''}>New shift</button></div>`,button);
 else if(action==='close')dialog.close();
 else if(action==='evidence'||action==='evidence-retry')void showEvidence(action==='evidence'?button:opener!);
 else if(action==='start'){if(dialog.open)dialog.close();void startShift();}
 else if(action==='probe'||action==='diagnose'||action==='next')void mutate(action);
 else if(action==='retry')void (retry==='start'?startShift(requestedRoute):retry==='export'?exportReport():sync());
 else if(action==='dismiss-error'){error='';render();main.querySelector<HTMLElement>('[data-action="start"]')?.focus();}
 else if(action==='circuit'&&shift?.phase==='resolved')openDialog('Inside this repair.',circuitView(shift),button);
 else if(action==='reset'&&!busy)openDialog('Hang up this shift?',`<p>Start the eight-repair story again? This browser will switch to a new shift. Your current ticket will not be changed.</p><div class="dialog-actions"><button class="secondary" data-action="close">Keep this shift</button><button class="primary" data-action="start">Start a new shift</button></div>`,button);
 else if(action==='export')void exportReport();
 else if(action==='sound')void toggleSound(button);
 else if(action==='motion'){atmosphere.setMotion(!atmosphere.motion);cinema.sync();button.textContent=`Motion: ${atmosphere.motion?'on':'off'}`;button.setAttribute('aria-pressed',String(atmosphere.motion));}
});
dialog.addEventListener('close',()=>{if(main.contains(document.activeElement))return;if(opener?.isConnected)opener.focus({preventScroll:true});else main.querySelector<HTMLElement>('[data-focus]')?.focus({preventScroll:true});});
dialog.addEventListener('click',event=>{if(event.target===dialog){const box=dialog.getBoundingClientRect();const mouse=event as MouseEvent;if(mouse.clientX<box.left||mouse.clientX>box.right||mouse.clientY<box.top||mouse.clientY>box.bottom)dialog.close();}});
document.addEventListener('keydown',event=>{if(dialog.open||storyIntro||tutorial||busy||uncertain||event.altKey||event.ctrlKey||event.metaKey||event.target instanceof HTMLInputElement||event.target instanceof HTMLTextAreaElement)return;if(!['1','2','3','4'].includes(event.key))return;const index=Number(event.key)-1;if(shift?.phase==='choose_tool'){const id=(['z','x','bell'] as Tool[])[index];if(id&&canProbe(shift,id)){selectedTool=id;render();main.querySelector<HTMLElement>('[data-action="probe"]')?.focus({preventScroll:true});event.preventDefault();}}else if(shift?.phase==='diagnose'){const dimension=(['bit','phase'] as const)[index];const control=main.querySelector<HTMLButtonElement>(`[data-repair="${dimension}"]`);if(control){control.click();main.querySelector<HTMLElement>('[data-action="diagnose"]')?.focus({preventScroll:true});event.preventDefault();}}});
const existing=savedID();if(existing)void sync(existing);else render();
