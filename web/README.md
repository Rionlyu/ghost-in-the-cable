# Ghost in the Cable — frontend

Original, local-only vanilla TypeScript/Vite application. No remote fonts, artwork, analytics, framework, or client-synthesized quantum results.

## Run

```sh
npm run dev
# 127.0.0.1:5173; /api proxies to 127.0.0.1:8000
npm run build
# web/dist is ready for the Python server's same-origin static serving
npm test
npm run test:e2e
```

The local FastAPI/Qiskit server must be running on port 8000 for actual gameplay. The opening shop and field guide can render without it; unavailable API requests produce explicit errors, never substitute results.

## Real integration check

With Vite and the actual backend both running:

```sh
LIVE_API=1 npm run test:e2e -- tests/e2e/live.spec.ts
PLAYWRIGHT_VIEWPORT_WIDTH=390 LIVE_API=1 npm run test:e2e -- tests/e2e/live.spec.ts
```

For the built one-port application, prepend `PLAYWRIGHT_BASE_URL=http://127.0.0.1:8000`. The live test does not mock HTTP: it completes all eight tickets, chooses appropriate tools from public suspect families, checks restored readings, opens the resolved circuit and science dialogs, and compares the downloaded JSON with the real report endpoint.

Default browser tests explicitly label their HTTP fixtures **UI only**. They verify interaction/state handling, not Qiskit physics or hardware. A live test skipped without `LIVE_API=1` is not an integration pass.

## Source

- `src/main.ts`: API-controlled state, delegated interactions, resume/recovery, sound, focus and download.
- `src/views.ts`: escaped markup for tickets, guide, instrument, tool station, diagnosis, circuit, evidence and receipt.
- `src/api.ts`: same-origin JSON transport; typed HTTP/network errors, bounded timeout, no fabricated fallback.
- `src/rules.ts`: preflight phase/token guard. The server remains authoritative.
- `src/tokens.css`, `src/styles.css`, `src/game.css`: shared palette/type and responsive analog-shop layout.
- `public/bench.svg`, `public/favicon.svg`: bespoke original illustration assets.
- `tests/e2e/fixtures.ts`: test-only fictional HTTP fixtures, not shipped in the bundle.

Only a shift ID is persisted in localStorage. A reload fetches authoritative server state; a missing/expired server shift offers an explicit new shift. Ambiguous failed mutations are reconciled with GET, and if reconciliation also fails the controls lock until a refresh. New shifts require confirmation when a current shift exists.

Keyboard: Tab/Enter operate native buttons. On a fresh ticket, 1–3 selects a tool and focuses Connect; during diagnosis 1–4 selects a listed fault and focuses Stamp. Escape closes dialogs. Sound is off on every page load and only enabled by an explicit user gesture. Reduced-motion preference disables the loading spinner.

Scientific wording distinguishes random **pre-decoder** single-qubit marginals from deterministic **post-decoder** Bell bits. `/api/evidence` shows exact statevector probabilities, not an empirical benchmark or hardware data.
