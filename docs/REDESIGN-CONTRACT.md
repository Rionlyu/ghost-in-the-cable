# Story-led repair redesign

Current user feedback supersedes older density/composition decisions: keep the cream ticket and quirky artwork, remove decorative copy, replace the quiz feel with a guided visual repair. Do not merely rename multiple-choice answers.

## Screen contract
- Opening: title, a single short story premise, original shop art, one primary `Open the shop` button (data-action=start), secondary `Choose a chapter` (data-action=chapters). No feature grid, slogans, timestamps, decorative subtitles or three simultaneous explanations.
- Opening the shop starts a real story shift but first shows an inline story beat with one short customer line and `Show me` (data-action=story-continue). `Skip intro` (data-action=skip-intro) is an unobtrusive alternative. It must not sample/probe/diagnose for the player. Saved shifts resume directly without replaying the intro.
- First repair is guided, one instruction at a time: select the Bit probe, run the test, see a measured signal, flip the bit repair switch if necessary, apply repair. The next lessons introduce phase then entanglement through the same physical bench. Do not auto-select the winning repair or expose the hidden fault.
- Game desktop: compact taped ticket left; large device/signal and the current action right. A single current-step headline. Mobile: concise ticket, visual signal, controls; do not put a giant decorative illustration between the reading and action.
- Tool choice: compact native buttons `Bit probe`, `Phase probe`, `Linked probe` using data-tool=z/x/bell; one-line selected-tool help only. `Test cable` data-action=probe. Tokens are scarce resources and remain server-enforced.
- Repair: no I/X/Z/Y multiple-choice cards and no `Name the fault` screen. Native buttons role=switch with aria-checked and data-repair=bit/phase, accessible names `Flip bit` and `Flip phase`. Derive I/X/Z/Y from the two switch states and send the existing diagnose endpoint on `Apply repair` (data-action=diagnose). For I/X tickets show only bit switch; I/Z only phase; four suspects both. All-off is the valid no-change repair and must be submittable.
- Visual repair preview must be derived ONLY from the public reading and selected switches. It is not another physical experiment, cannot reveal an unmeasured phase/bit, and must not declare a confirmed repair before server diagnosis. Unknown dimensions remain explicitly unknown; ambiguous tools warn succinctly. Bell bits stay reference-then-probe c1c0: bit fault is FIRST displayed bit, phase fault SECOND.
- After applying: device visibly changes on actual success/failure; brief outcome, one short line, one continue action. Detailed science, fault explanation and circuits are opt-in, not paragraphs permanently occupying the bench.
- After the first story repair: a small chapter/route choice is available (continue story or choose a focused path). No false branching: topic paths must actually run different server-owned tickets.
- Header: brand, Help, Menu only. Science, sound, new shift and chapter navigation move into Menu. Footer: one quiet `Qiskit simulation` disclosure; detailed limitations stay in science. Preserve keyboard access, modal focus, reduced motion and real error recovery.
- Retain real report export and the original recorded science/evidence in optional views. No fake readings or invented playtest claims.

## Backend route extension (shared integration contract)
POST /api/shifts accepts {} (same default story) or {route: 'story'|'bits'|'phase'|'entanglement'} with strict forbidden extras. Shift adds required public route with default story. Other mutation payloads and mandatory expected_revision remain unchanged.
Canonical route ticket IDs, in order:
  story: all existing eight IDs in existing order
  bits: porchlight, skeleton-sign, dawn-bell
  phase: whisperphone, moon-radio
  entanglement: mirror-organ, fog-machine, midnight-projector
Ticket count is actual route length. Initial Bell tokens: story=3, bits=0, phase=0, entanglement=3. Each session owns its frozen route, and advancement uses that route. All probes are still real Qiskit, one per ticket. Every probe/diagnose/next validates expected_revision under the existing lock before simulation or changes. A route change starts a NEW session; never mutates/rerolls the active ticket. Complete reports work for all routes, not just eight-ticket story.

## Ownership
Backend worker owns server/ and tests/backend/ only; do not alter engine/evidence physics except if a specific new test requires it. Frontend worker owns web/src/, web/public/ (preserve bench.svg), and EXISTING web/tests files plus its own new unit tests. Parent owns root docs, API-CONTRACT.md, PRODUCT.md, DESIGN.md, independent tests/replay and web/tests/e2e/story-redesign.spec.ts. No commits, deployment, paid services, QPU jobs or server restarts by workers.

## Acceptance
One primary action per stage; drastically shorter visible copy; cream ticket preserved; guided intro can be skipped; no quiz answer cards; interactive repair preview; real focused routes; one-query/revision/secrecy invariants intact. Full story and every focused route finish against the real backend, exported report matches readback, stale-tab protection still works. Inspect real desktop plus 390 and 320 CSS-pixel screenshots; verify no overflow or runtime errors. Automated checks cannot prove the game is fun; ask for the user's next playtest after delivery.
