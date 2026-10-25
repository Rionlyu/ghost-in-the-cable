# Request-status layout fix

Scope: remove the transient orange loading row that made the repair interface jump/flicker after actions. Tutorial content, experiments, backend and game state logic are unchanged.

## Cause and pre-fix reproduction

The live status div sits between the masthead and main. styles.css hid it only while not pending; pending changed it into a normal-flow amber row with vertical padding. Native browser regressions failed before the production edit:

- 1440px: main top88 before a probe,127 while pending.
- 390px and320px: main top76 before,115 while pending.

These are delayed-response UI fixtures, not Qiskit-engine evidence. Screenshots status-probe-before-{1440,390,320}.png show the actual offending row.

## Minimal fix

Replace the pending/nonpending/empty CSS rules with one consistently visually hidden, absolutely positioned .global-status rule. Keep role=status, aria-live=polite, live text updates and the existing pending/completion focus transfer. Do not use display:none or delete announcements. The separate cinematic pending overlay remains anchored and explicitly visible only on the title screen; real alert/error panels remain visible.

Only production edit: web/src/styles.css. Regression tests: web/tests/e2e/status-layout.spec.ts.

## Actual verification

    npm test
    npm run build
    PLAYWRIGHT_BASE_URL=http://127.0.0.1:8000 npx playwright test tests/e2e/status-layout.spec.ts --workers=1 --reporter=dot
    LIVE_API=1 ATMOSPHERE_LIVE=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:8000 npx playwright test --workers=1 --reporter=dot

Results:20 Node tests passed; TypeScript/Vite production build passed; the3 new regressions changed from failing to passing; full89-check browser suite passed with no skips. Each new test holds probe, repair and next-ticket responses, checks unchanged main/ticket top coordinates while pending, verifies hidden status geometry and live semantics, and checks the existing focus handoff after completion. The full suite includes real Qiskit tutorial/customer/route/replay checks as well as labelled fixtures/harnesses. Backend was not restarted.

Parent inspected actual before/after pending screenshots at390px and after-fix1440px. Orange request text is absent after the change; the ticket/monitor no longer drop below an inserted loading row. Disabled controls remain visible while busy. Evidence: web/tests/evidence/status-{probe,diagnose,next}-pending-{1440,390,320}.png.

Independent scoped review: PASS, with no security or logic findings. Its separate Chromium checks confirmed stable main/ticket positions during probe, repair and next-ticket requests at1440/390/320px, live-region accessibility/focus retention, completion focus handoff, an unclipped cinematic loading overlay and a visibly readable mocked error. The reviewer used mocked APIs and did not modify repository files or real backend state. Its nonblocking test-cleanup suggestion was applied: held responses now release in finally even if an assertion or screenshot fails; all3 targeted tests passed again afterward. No claim of human screen-reader listening or complete accessibility certification; announcement semantics and focusability are verified in Chromium.
