# Cinematic entrance verification

Historical record. [RELEASE-CHECK.md](RELEASE-CHECK.md) supersedes its totals and the long cinematic portrait-error limitation below: the later dedicated portrait regression now passes. Other unverified platforms and human playtests remain unverified.

2026-10-24. Status: requested cinematic entrance engineering, rendered checks and scoped independent RE-REVIEW PASS. Parent reran the entire expanded86-check browser suite with no skips,20 Node tests, production build and470 Python tests. The earlier independent review's two narrow-landscape defects are fixed and their six failing-before-fix regressions pass. A separate pre-existing very-long-error portrait limitation remains documented below. Current user scope is docs/CINEMATIC-ENTRANCE-CONTRACT.md. Tutorial comprehension is still unresolved; this pass preserves its content.

## Real pre-change RED

`PLAYWRIGHT_BASE_URL=http://127.0.0.1:8000 npx playwright test tests/e2e/cinematic.spec.ts --workers=1 --reporter=line` failed: the old main frame began at x108 instead of x0. It retained website chrome and did not fill the viewport.

The new cinematicView Node test failed with missing export before implementation, then passed after the overlaid game-title/controls renderer was written.

## Controller vertical slices, actually executed

Native Chromium tests in tests/e2e/cinematic-controller.spec.ts use the production controller and project CSS in an explicit geometry-only harness. This is UI/native-animation evidence, NOT forest-art approval or Qiskit evidence.

Observed RED before each change:

- Missing createCinematic export blocked natural camera entry.
- Skip button and Escape left the callback count at0 instead of immediately1.
- Opening Menu failed to cancel travel; the old animation entered the shop behind the options action.
- Missing/throwing native animation APIs threw instead of opening directly.
- A paused animation had no bounded exit.
- System/Menu motion-off changes did not end the active trip.
- Enter on the title screen did nothing without first navigating the page.
- The faded chapter action remained focusable during approach.

After the corresponding changes:

`PLAYWRIGHT_BASE_URL=http://127.0.0.1:8000 npx playwright test tests/e2e/cinematic-controller.spec.ts --workers=1 --reporter=dot`

Result:11 passed (6.8s). `node --test tests/cinematic.test.mjs`:1 passed.

The controller animates an establishing camera move, then a forward trip from the current computed transform; completion is one-shot and generation-bound. Skip/Escape, API-unavailable fallback, a bounded safety exit and explicit motion changes are covered. Game-state creation begins only after travel/skip; no probe result is fabricated or delayed behind animation.

## Integrated production verification

The original artwork is integrated through forestScene(): full-frame trees, independently edge-anchored near trunks, ground/path, moonlight, fog, chimney smoke and the crooked warm workshop. Title and controls overlay that world. The outer website header/footer are absent only during the title sequence; useful workshop chrome returns inside. The actual main rectangle starts at0,0 and equals the viewport at1440×900,768×1024,390×844,320×844,844×390,568×320 and640×360; visible title controls have at least44px height and remain in bounds.

Final parent commands, from web/:

    npm test
    npm run build
    LIVE_API=1 ATMOSPHERE_LIVE=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:8000 npx playwright test --workers=1 --reporter=dot
    PLAYWRIGHT_BASE_URL=http://127.0.0.1:8000 node scripts/capture-cinematic.mjs
    PLAYWRIGHT_BASE_URL=http://127.0.0.1:8000 node scripts/capture-story-motion.mjs

Results:20 Node tests passed; TypeScript/Vite build passed;86 browser checks passed in1.9m with no skips after the scoped review fixes. Explicit native-animation/geometry/audio harnesses and failure fixtures are included, not falsely counted as separate quantum experiments. Real tutorial, chapter, replay and production paths still exercise the actual one-port Qiskit backend.

From the repository root:

    uv run --frozen pytest -q -W error
    uv run --frozen ruff check .
    uv run --frozen ruff format --check .

Results:470 passed in3.96s; All checks passed;33 files already formatted. No dependency was added for the entrance. The running backend was not restarted; its in-memory user shifts were preserved.

Live production entry checks cover natural completion at1440 and390px, button Skip, keyboard Escape and saved-shift immediate resume. Each entry creates one actual server shift only after the camera finishes/skips, with phase=choose_tool, revision=0 and reading=null. Resume reads back the same complete state without another POST or query. An explicit503 UI fixture leaves a readable error with Retry/Back to shop; removing that fixture and clicking Retry reaches a real untouched shift. Old image/headline selectors were migrated only for the deliberately replaced entrance; meaningful physics/state assertions remain intact.

## Production CSP regression found and fixed

The first integrated full browser run had4 failures/67 passes: the otherwise successful three-repair checks at1440/768/390/320px recorded blocked inline styling. The SVG artist harness had not served the production CSP. The reported style hash matched exactly the forest's inline mix-blend-mode:soft-light attribute. A new forest unit assertion was observed failing before the fix. The declaration moved to .forest-earth-texture in external CSS; server CSP was not relaxed and console errors were not filtered. Targeted production checks then passed5/5, followed by all80 browser checks.

A scoped scan of main.ts, cinematic.ts/.css and forest-scene.ts/.css found no hardcoded-credential patterns, dynamic eval/Function calls or inline style attributes. This is a focused engineering check, not a comprehensive security certification.

## Rendered evidence and observations

The native capture script samples actual production WAAPI/CSS keyframes at0,1200 and2280ms; this is repeatable keyframe inspection, not a claim of real-time video capture. It then resumes the final120ms naturally and verifies a real server-created untouched shift. Latest seven-size metadata was captured2026-10-24T20:45:00.622Z. Every recorded viewport has no horizontal overflow, an in-bounds Skip target and zero page/console errors. Camera scales progress from approximately1 through3.5375 to5.96729, rather than merely toggling a scenic CSS class.

Under web/tests/evidence/:

- cinematic-title-{1440,768,390,320,844,568,640}.png: static reduced-motion title/control coverage.
- cinematic-journey-{start,mid,close,inside}-{1440,768,390,320,844,568,640}.png: actual integrated native frames and keeper arrival at all seven sizes.
- cinematic-journey.json: viewport, measured scale/geometry, safe public state and request-count record; no session IDs.
- cinematic-journey-contact-sheet.png: labelled downsized overview of all21 scenic keyframes.
- cinematic-travel-{1440,390}.png: frames from naturally advancing live browser tests.
- cinematic-error-390.png: real rendered503 fixture; its subsequent retry uses the real backend.
- cinematic-motion-woods-{start,end}.png, cinematic-motion-ticket-arrival.png and cinematic-motion-stamp-{impact,final}.png: the existing motion capture helper now follows the current entrance. Its real repair was confirmed correct with queryCount=1, active arrival/stamp/CRT effects and no page errors.

Parent inspected full-resolution desktop, portrait and short-landscape title screens, natural travel frames, the error overlay and the seven-size native-keyframe contact sheet. Observed: the world reaches all viewport edges, near trees frame portrait screens, title/actions clear during travel, the workshop visibly grows toward a facade close-up, and Menu/Help/Skip remain legible. Short-landscape title, house and primary action do not overlap. Tight portrait approach crops the facade as a close-up; no exposed scene edges or clipped controls were observed. This is stylized original2D vector scenery, not photorealistic or3D footage. The subjective cinematic result still awaits the user's judgment.

## Fresh independent review

First review: FAIL, with no security findings and two reproducible narrow-landscape layout findings. At568×320 and640×360 the title overlaps start/chapter actions; the error heading/message can be clipped above the viewport because the short-height CSS excludes widths≤640px. Reviewer checked actual source and isolated native Chromium behavior at seven sizes; mutation requests were intercepted, so this review is not successful-Qiskit-session evidence. Parent separately owns the real entry/repair/readback checks above.

Parent confirmed both findings from the reviewer's screenshots and added six production regressions before editing CSS. All six were observed failing: title bottom265.14 versus action top140/180; short error y=-59.5/-19.5; long error y=-899.5/-859.5. New assertions require title/action separation, viewport-contained error/heading, scrollable long errors and a usable Retry that subsequently opens a real untouched server shift. A separate fix context changed only two substrings in cinematic.css:35: removed the min-width restriction from the existing short-height rules, and bounded error max-height to min(220px,calc(100svh - 142px)) while retaining overflow:auto. Parent verified the actual source, rebuilt production and reran all86 browser checks with no skips,20 Node tests and470 Python tests; all pass. After-fix screenshots at568/640px show separate title/actions and onscreen headings; long content scrolls and real-server Retry/readback passes. The seven-size native keyframe capture also passes. Fresh scoped independent re-review PASS.

Final re-review independently reconstructed the original CSS in the browser and reproduced the six failures, then verified the actual served fix. At568×320 and640×360, title/action gaps are72.65625/106.34375px; short errors start at24.5/64.5px; long errors start at16px and genuinely scroll. Native Tab brings Retry into view with a visible3px outline, and Enter triggers exactly one intercepted retry. Seven title sizes and three animated Skip checks pass. No related regression or security finding was reported. Reviewer made no repository edits, installs, backend restart or real API writes; successful-Qiskit evidence remains the parent's separate live suite. Parent read back the actual review report, not only the completion notice. Verdict is saved in evidence/cinematic-review.json.

Nonblocking pre-existing limitation: a30-repeat error message at390×844 starts above the viewport with no internal scrolling; reconstructing the original CSS produces identical behavior. Normal portrait error/title checks pass, and the narrow-landscape long-content issue is fixed, but long-message portrait containment is explicitly NOT certified. This stress-case limitation is retained as a separate follow-up rather than hidden by the scoped PASS.

## Remaining human/platform limits

The tutorial's content was intentionally preserved. The user's continued science confusion remains unresolved; automated passes do not establish beginner comprehension. Safari, screen-reader use, perceptual audio testing and true200% browser zoom remain unverified. No public deployment, submission, commit/push or recorded demo video is claimed.
