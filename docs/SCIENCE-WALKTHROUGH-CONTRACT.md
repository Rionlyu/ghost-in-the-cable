# Science walkthrough and living workshop

Current scope: user-requested teaching/story/animation pass, 2026-10-24. Extends the repair redesign; it does not weaken its secrecy, resource, revision, error-recovery or route contracts. User feedback overrides the earlier assumption that a short customer caption was enough onboarding.

## Experience thesis

Arrive at a workshop in the woods, meet its ghostly keeper, learn by sending signals through a resettable training cable, then help the first customer. The scientific transformation is visible where the player acts. A sentence and a useful action replace paragraphs and unexplained tool choices. More atmosphere, not more decorative slogans.

Keep the cream ticket, original quirky art, existing stack and real Qiskit backend. No paid assets, remote fonts, framework migration, commits, pushes, public deployment or hardware jobs. Original SVG/CSS/procedural sound only. Existing reference-game art, code, copy and audio are not to be copied.

## Progressive playable teaching

Opening story introduces the night workshop and a keeper who teaches on spare cables before Mara's first job. Use a clear Learn the tools action and a secondary Skip to repairs action. Tutorial is replayable from Help/Menu, including during a saved shift, without resetting that shift. Saved games resume normally rather than being forced through onboarding.

Teach in short stages, each with one active instruction, one central apparatus and one primary action:

1. Bit means 0 or 1: send a known 0 through a clean training cable with a Bit probe; real returned 0 lights the output.
2. A bit flip swaps 0 and 1: repeat with known X; show returned 1 and the connection between that result and the repair switch.
3. A phase flip is not a bit swap: a Bit probe sends 0 and cannot distinguish known I from known Z. Do not animate |+> as the preparation for this Z-basis probe; it really prepares |0>.
4. A Phase probe prepares a superposition |+>; a relative-phase flip turns it into |->. Decoding converts that difference to a measurable 0/1. Explain superposition/relative phase visually in plain language; a wave is a schematic, not a second ordinary hidden bit or a literal lamp oscillation. Run actual x/Z to reveal the missed fault, optionally contrast x/I.
5. One ordinary test cannot distinguish all four faults: compare real Bit-probe readings of four separate, resettable training cables, one known fault per cable. Two pairs have identical outputs. Clearly say training cables reset; actual jobs allow one use, so doing Bit then Phase on the same real job is forbidden.
6. Linked means an entangled probe plus a reference: show two paths, only the probe crossing the faulty cable, the reference staying on the bench, both meeting at a joint decoder. Compare real Bell readings of four resettable training cables: I00, X10, Z01, Y11 (display c1c0). Label the first decoded light bit flip and the second phase flip. These are joint-decoder outputs, NOT independent hidden registers. Either qubit alone before decoding is random; a reference is not a second device query.
7. Put the reading to work: let the player manipulate repair switches on a clearly labelled known training result, or use an equivalently concrete final guided demonstration. Leave 0 corrections off, flip the dimensions whose decoded result is 1. Then hand over Mara's real ticket with its query still unused.

Can combine tightly related stages if clearer, but do not omit the demonstrations, the meaning of phase, the one-use constraint, the untouched reference or joint decoding. Never call schematic effects real measurements. Never synthesize a fallback result when a training request fails. Show retry/skip and ignore late responses after skip, exit, restart, chapter change or tutorial replay. Keep keyboard shortcuts from operating the hidden bench during training. Provide Back and Skip controls and sensible focus transitions. A fresh visitor should never need to choose an unexplained probe.

Story should connect repairs to helping the village through the night. Add brief useful transitions where topics change; avoid a story wall before each repair, fabricated user quotes, artificial countdowns and extra quizzes. Do not falsely promise every repair succeeded or that a broken lamp implies a known private fault.

## Training API contract (backend/frontend integration)

POST /api/training/probe
Request JSON: {"tool":"z"|"x"|"bell","fault":"I"|"X"|"Z"|"Y"}
Response JSON:
{
  "kind":"training",
  "known_fault":"I"|"X"|"Z"|"Y",
  "reading":{"tool":...,"bits":...,"engine":"qiskit-statevector","qubits":1|2,"query_count":1},
  "circuit_text":..., "gates":..., "probabilities":...,
  "probe_marginal":..., "reference_marginal":...|null
}

This deliberately public known-fault endpoint executes server.engine.run_probe on a separate stateless training cable. It must never read/create/alter a game session, accept shift IDs, arbitrary circuits, client seeds, shot counts or private target selectors. Whitelist tools/faults, forbid extra request fields, and allowlist response fields. The training result is tagged, so its deliberately public fault is never confused with a concealed customer fault. Every click runs the real Qiskit boundary. Prove all 12 literal mappings, Bell pre-decoder marginals, one device gate, validation, secrecy and unchanged game revision/token/query/history state around training. Handle simulator failure honestly and preserve security headers.

## Atmosphere integration contract (parallel frontend work)

A separate web/src/atmosphere.ts imports ./atmosphere.css and exports:
- entranceView(): string. Entire landing section with the existing data-action=start button labelled Open the shop, data-action=chapters, existing title/compact copy, and an original layered woods/fog/ghost-house scene. All essential controls work immediately, without waiting for an animation.
- createAtmosphere(root: HTMLElement), returning:
  sync(state: {ticketKey: string|null; phase: string; correct: boolean|null}): void;
  pulse(kind: 'probe'|'repair'|'step'): void;
  setSound(enabled: boolean): Promise<boolean>;
  setMotion(enabled: boolean): void;
  readonly sound: boolean; readonly motion: boolean;
  dispose(): void.

The main renderer calls sync after DOM replacement; ticketKey is shift ID plus public ticket ID, or null off the bench. phase is the public phase, tutorial, welcome or landing; correct is only server-confirmed debrief.correct. The atmosphere module can add a data-ticket-stamp element with an honest status label when resolved. Ticket arrival/stamp effects only animate on actual transitions, not each switch/tool selection re-render. Include deliberate failed-repair stamp treatment; never stamp success early. pulse is optional foley/animation, never a result source. Frontend worker uses these exports instead of the old sound oscillator, and exposes sound and motion controls in Menu.

Signature motion: foreground trees/fog part to reveal the workshop, a warm window wakes, ticket slides/taps onto the bench, a physical ink stamp lands after resolution, the CRT has subtle scanline drift and near-static texture, and real circuit responses animate along the visible path. Motion conveys place and causality, not seizure-like flashing. Sound is quiet, procedural CRT hum/static plus brief switch/stamp cues and stays OFF until a direct user gesture. AudioContext creation/resume occurs inside that gesture; mute must cancel/suspend sound and survive asynchronous toggles. Pause/mute for hidden pages as appropriate. No autoplay exception spam.

Provide a motion toggle and respect prefers-reduced-motion. With reduced motion, show the fully revealed house, static readable apparatus, final ticket/stamp state and all feedback immediately. No animation may block a control or determine whether an API result is accepted. Do not rely on timeouts for state correctness.

## Verified acceptance, not just a build

- Fresh-user full tutorial executes actual training circuits, demonstrates ordinary ambiguity and Bell separation, and reaches an unchanged/unqueried first customer session.
- Skip, back, replay from Help, saved-session resume and late-result/error recovery all work; focused routes stay intact.
- Original gameplay keeps one query per ticket, mandatory captured expected_revision, private-fault concealment, public-only preview, all-off I repair and true server-confirmed success/failure.
- Full Python/Node/build/live browser checks, including existing stale-tab/reconciliation checks. Record RED/GREEN for new behavior.
- Visually inspect landing, tutorial and stamped repair at desktop, 768, 390 and 320 widths; check intermediate widths, keyboard, reduced motion, sound opt-in/off and runtime errors. No novice-playtest or audio-listening claims without performing them.
- Update research/design/demo/verification and submission checklist. User supplied new confirmed requirements: public licensed repo and README; 1–3 minute video; email submission@aiqtlab.com, then check submissions. Deadline 2026-10-25 16:00 UTC / 17:00 Warsaw. Do not actually publish/email/submit without permission. AI-use policy and hosting requirements remain unknown.
