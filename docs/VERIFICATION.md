# Verification ledger — science walkthrough and living workshop

Superseded for current release totals and the resolved cinematic portrait-error regression by [RELEASE-CHECK.md](RELEASE-CHECK.md). The records below are historical scopes, not additive test counts. `<scratch>` replaces the original developer-local scratch path for publication.

Executed locally on2026-10-24. Requirements: docs/SCIENCE-WALKTHROUGH-CONTRACT.md, extending docs/REDESIGN-CONTRACT.md.

LATEST FOLLOW-UP: the request-status layout jump has a scoped CSS fix,20 passing Node tests, a rebuilt production bundle and89 passing browser checks with no skips. The3 new pending-geometry tests were observed failing before the fix. Independent status-fix review PASS, with no security/logic findings. The nonblocking test cleanup is applied and its3 targeted checks pass again; see docs/STATUS-LAYOUT-FIX.md.

CURRENT ENTRANCE GATE: requested cinematic entrance engineering/rendered checks and scoped independent RE-REVIEW PASS. Final parent reruns:470 Python tests,20 Node tests and86 browser checks with no skips; TypeScript/Vite, Ruff and formatting pass. Both narrow-landscape review findings are resolved. A pre-existing very-long-error portrait stress case remains documented, not claimed fixed; see docs/CINEMATIC-VERIFICATION.md and evidence/cinematic-review.json. The science-walkthrough record below is historical and its framed entrance is superseded. Novice comprehension remains explicitly unresolved. This is not a completed hackathon submission.

## Independently re-run parent checks

- `uv run pytest -q -W error`: 470 passed.
- `uv run ruff check .`: all checks passed.
- `uv run ruff format --check .`:31 files already formatted.
- `UV_PROJECT_ENVIRONMENT=<scratch>/ghost-clean-venv uv run --frozen pytest -q -W error`: 470 passed, using the separately frozen environment.
- From web/: `npm test`:14 passed; `npm run build`: TypeScript and Vite production build passed.
- From web/: `LIVE_API=1 ATMOSPHERE_LIVE=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:8000 npx playwright test --workers=1 --reporter=dot`: 59 passed (32.6s), no skips, on the rebuilt production bundle served by the real one-port Qiskit backend.
- Some browser tests deliberately mock UI failures or use a standalone native-audio harness. Only explicitly LIVE/integration checks are real-Qiskit evidence; do not describe every one of the59 as a quantum experiment.
- Bounded static scan of changed server/tutorial/atmosphere/integration production sources found no hardcoded secret assignments, shell=True calls or eval. This is not a security guarantee. No dependencies or lockfiles were changed in this pass; earlier audit results are historical, not a new vulnerability scan.

## Real tutorial and game behavior

- Strict stateless POST /api/training/probe permits only fixed known tool/fault enums. Each accepted request calls real Qiskit once. All12 tool/fault outputs, gate allowlisting, Bell pre-decoder50/50 marginals, repeated fresh execution, error503 behavior and unchanged customer state are covered by80 new Python tests within the470-test run.
- Seven playable stages cover clean Bit, X bit swap, Bit missing Z, H/Z/H phase decoding, four-cable ordinary ambiguity, retained-reference joint decoding and repair switches. Customer fault data is never used to construct demonstrations.
- Training completion and replay preserve customer revision, phase, reading, query budget and link resources. Skipping, Back, Help/Menu replay, saved-shift resume, duplicate clicks, failures and late responses are tested. No fallback or fabricated measurements are accepted.
- The ordinary/Bell comparisons use separate resettable known cables. Only one partner traverses each cable; the reference bypass and joint decoder are visible. Final c1c0 lights are labelled bit-flip then phase-flip. The50/50 marginal statement belongs before decoding, not to deterministic final decoded bits.
- All four actual routes still complete with server-owned sequences, budgets, receipts and downloads checked against server readback. Stale captured actions are409 with no automatic retry. Unknown preview dimensions, all-off identity repairs, real wrong repairs and uncertain-network reconciliation remain tested.
- Main localhost:8000 was restarted onto the new backend and production bundle. Health returned Qiskit2.6.1; a real training Bell/Y request returned11 with the reference/probe pre-decoder marginals. Restart loses old in-memory shifts; no recovery is claimed.

## Actual RED → GREEN findings

- Parent baseline was390 Python and6 Node tests. Parent live Learn-the-tools acceptance initially failed against the old app.
- Worker endpoint tests observed missing-route405, invalid-request500/accepted extras, nested metadata leaks and unhandled simulator failures before their respective fixes. Tutorial/atmosphere worker records also contain observed failures for progression, duplicate requests, stale responses, replacement-DOM pulses and motion-toggle stamp replay.
- Parent's additional scientific-copy test failed on “equal mix ... is a superposition”. Visible and accessible text now distinguishes one quantum superposition from a random classical choice. The new test passes.
- That copy change exposed a real320px regression: Phase Continue was clipped below the844px viewport. Parent retained the full-control-in-viewport assertion, compacted only phase-panel whitespace, rebuilt, re-ran the320px test, then passed all59 production browser tests. No hidden overflow or reduced-font workaround was used.

## Rendered and native-animation review

- Live tutorial/first-repair runs cover1440×1000,820×1024,768×1024,390×844 and320×844. Screenshots include all stages, actual unchanged-session readbacks and first real repairs.
- Parent visually inspected the landing on desktop/768px, first Bit stage390px, corrected Phase320px, Linked390/1440px, aligned practice320px, and confirmed repair320px. Text, diagrams, decoded-bit labels, tape/paper and stamp are readable; no horizontal overflow or overlap was observed. At320px a long resolved customer ticket still scrolls vertically to reveal the whole Next ticket control; this is not a promise that every screen fits without scrolling.
- From web/, `node scripts/capture-story-motion.mjs` exercised the actual localhost:8000 app in normal-motion Chromium: six finite woods/house/window reveal animations, one ticket-arrival animation, one confirmed-success stamp, active scan/grain animations and zero page runtime errors. The real repair used one customer query and was read back as correct at revision2.
- Motion evidence: web/tests/evidence/science-motion-woods-{start,end}.png, science-motion-ticket-arrival.png and science-motion-stamp-{impact,final}.png. The impact screenshot deliberately pauses the production CSS animation at130ms for a deterministic visual frame; it does not fabricate a physics result or a real-time timing measurement.
- Native audio tests exercise opt-in activation, bounded nodes, mute/unlock races, disposal, hidden-page cancellation and live success/failure effects. They do not constitute human listening or Safari certification.
- Representative contrast checks: muted ink9.43:1; training-label/surface8.67:1; stamp/paper5.94:1. Keyboard/focus/modal/reduced-motion tests pass. No full accessibility certification is claimed.

## Unchanged independent quantum evidence

- Previously generated benchmark command: `uv run python -m benchmarks --shots 4096 --seed 20261024 --output evidence/benchmark.json`. It was not regenerated in this pass; artifact-integrity and distribution tests still pass.
- The existing artifact records393,216 sampled outcomes across four strategies, four equally weighted faults and six synthetic-noise levels. Ideal ordinary Z/X and classically correlated-reference controls are50%; ideal Bell assistance100%. These are four-equiprobable-fault, one-device-use conditions, not the easier two-suspect Mara ticket.
- The suite independently compares all12 game distributions against reference circuits. Exact probabilities, sampled evidence, synthetic noise and ideal gameplay remain separate. No physical QPU execution or computational speedup is claimed.

## Review and remaining limits

- The fresh independent read-only teaching/atmosphere review returned passed=true, security_concerns=[], logic_errors=[]. It reported passing 133 training/physics/replay Python checks, 310 API/route checks, 14 Node tests, TypeScript, targeted Ruff and 18 Playwright checks, explicitly distinguishing fixtures from live evidence. Additional live exercises verified all 12 mappings, customer-state isolation, full tutorials at 1440/768/390/320px, retained repair switches, resume, five late-response races and stale-tab409 reconciliation without retry. The reviewer rechecked the latest mobile change: Phase Continue ends at837.47px within the844px viewport. No source files were changed by the reviewer.
- One nonblocking visual suggestion remains: a return arrow between the mobile Phase diagram's rows would clarify its sequential path. The explicit circuit sequence is correct; this is not a scientific or gameplay blocker. Temporary worker preview servers were stopped after review; the main localhost:8000 app remains healthy.
- No external novice playtest, screen-reader session, true200% browser zoom, human sound evaluation or physical-QPU validation has been performed. docs/PLAYTEST.md is a blank protocol, not invented observations.
- The supplied organizer announcement confirms a public licensed repo/README,1–3 minute video and email submission by2026-10-25 at16:00UTC/17:00Warsaw. AI/reuse details, eligibility, final rubric and hosting still require confirmation. docs/DEMO-SCRIPT.md is updated; no video, public deployment, git commit/push or submission has been made.
