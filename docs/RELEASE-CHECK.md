# Release check — 25 October 2026

This records executed local checks, not organizer approval, human learning gains or a completed hackathon submission. Historical verification documents describe earlier source states; the results below supersede their test totals.

## Current source

- Menu → Replay intro now confirms abandoning an active game, clears the browser's saved shift and returns to the ordinary forest title. Opening the shop creates a fresh story shift, keeper introduction and training opportunity. Seven dedicated restart checks pass.
- Customer tickets list suspects without recommending the probe. The original measurement stays fixed while the player chooses a correction. Causal feedback appears only after the server confirms the repair, including explanations of blind probes and lucky guesses.
- Bit/Phase switch changes again animate their corresponding CRT trace. The cosmetic pulse settles back to the recorded evidence; it does not calculate a repair outcome, reveal an unknown dimension, spend a query or send another request. Motion-off and reduced-motion preferences suppress it.
- Loading announcements remain in an accessible, visually hidden live region. Three held-response regressions verify no main/ticket reflow and no pending-focus scroll at 1440, 390 and 320px. The test settles normal click auto-scroll before its baseline and compares document coordinates, so scrolling to a partly visible button is not misreported as loading-row reflow.

## Executed checks

Commands were run from the repository root unless marked `web/`.

| Check | Actual result |
| --- | --- |
| `uv run --frozen pytest -q -W error` | 470 passed |
| Locked install into a separate fresh Python 3.12 virtual environment, then the same full suite | 470 passed; no undeclared developer-environment packages needed |
| `uv run --frozen ruff check .` | All checks passed |
| `uv run --frozen ruff format --check .` | 39 files already formatted |
| `npm test` (`web/`) | 27 passed, no skips |
| `npm run build` (`web/`) | TypeScript checking and Vite production build passed; recorded evidence copied byte-for-byte |
| `LIVE_API=1 ATMOSPHERE_LIVE=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:8000 npx --no-install playwright test --workers=1 --reporter=dot` (`web/`) | 111 passed in 2.5 minutes; no skips |
| New switch-motion regression (`web/`) | Four passed: visible on/off motion at 1440/390/320px, unchanged evidence, no extra POST, no premature result, reduced motion and Menu motion-off |
| `npm audit --audit-level=moderate` (`web/`) | Found 0 vulnerabilities, including development dependencies |
| `uvx pip-audit --path .venv/lib/python3.12/site-packages --format json --output evidence/python-audit-release.json --progress-spinner off` | No known vulnerabilities found |
| Fresh independent benchmark: `uv run --frozen python -m benchmarks --shots 4096 --seed 20261024 --output <scratch>/ghost-final-benchmark.json` | Bit/Z, Phase/X and classically correlated controls: 8192/16384 each; Bell: 16384/16384. Simulation, not hardware |
| Additional production-browser sample, without HTTP fixtures | Actual Linked reading `11`, correction inferred from those bits, server-confirmed successful repair, zero page errors |

The Node view-test loader emits an experimental TypeScript-stripping warning under Node 26.0.0. The tests pass; this is not a claim of warning-free output.

The complete browser suite mixes explicitly marked UI fixtures, real DOM/controller harnesses and explicitly live API/Qiskit tests. It is not 111 separate quantum experiments. Runtime-error assertions cover the exercised states, not every possible browser/platform.

## Rendered evidence

`docs/images/forest.png` shows the original full-screen entrance. `docs/images/workbench.png` was captured from the actual local Qiskit-backed Entanglement chapter, not a transport fixture. No private session identifier is visible in these images.

Switch-motion viewport/full-page captures are generated under `web/test-results/`; routine test screenshots and traces are deliberately ignored by Git. Desktop and 320px pulse screenshots were inspected: measured bits, lane labels, both switches and Apply repair remain readable without horizontal clipping. Short mobile screens may require vertical scrolling.

## Clean staged-tree follow-up

A fresh tree was exported from the intended Git index into an empty scratch directory, without `.venv`, `node_modules`, built assets or local caches. Exact locked Python and npm installs succeeded there; 470 Python tests, 27 Node tests, the production build and `sh -n run.sh` passed again. The clean build produced the same application asset hashes as the running demo.

The clean tree's backend was then started on loopback port 8012 to avoid disturbing the existing game on 8000. Its health check reported Qiskit 2.6.1; a real known-cable training request succeeded. An entire eight-ticket story, choosing probes from public suspect families and repairs only from measured outputs, finished with 8 correct repairs, 8 queries, revision 24 and 0 remaining link tokens. This was an API smoke test of the clean manual server invocation, not a claim that `./run.sh` took over the already occupied port 8000.

The independent benchmark was regenerated; every stored key/value matched apart from `generated_at`. Source/public/build evidence copies remain provenance-bound. All README relative links resolve; the exact quoted presentation script contains 247 whitespace-counted words (about 109.8 seconds at 135 words/minute, before pauses).

Initial independent source/science review passed without blocking security or logic findings; its scope and limitations are recorded in `evidence/release-source-review.json`. The later cosmetic switch-motion change also passed independent final review, with no security/logic findings or suggestions; see `evidence/release-motion-review.json`. That reviewer ran 46 targeted browser checks and two additional restart guards; one opt-in live check was skipped in that isolated scope. The parent's separate full 111-check production run had no skips. Developer-local absolute paths were removed from publication documents and historical verification was marked superseded.

## Public release verification

Published source: https://github.com/Rionlyu/ghost-in-the-cable

The public `main` source revision `c0b2c48dc89353e7a2dd82d3b5db45fa5538074c` was read back from GitHub and matched local HEAD. An unauthenticated GitHub API request confirmed public visibility, MIT license detection, the expected source/README/lockfiles/presentation/audit/images/evidence and an executable launcher. The 120-file upload contains no test-output/cache/environment directories. Bounded credential-pattern and added-line unsafe-code scans found no matches; that is not a guarantee of general security.

A fresh public clone without a configured credential helper matched that revision. Frozen Python install, 470 Python tests, `npm ci`, 27 Node tests and the production build passed again in that clone; its worktree remained clean. Subsequent publication-record edits are documentation-only and do not change the checked game source.

## Release and submission status

Both independent reviews, upload-manifest checks, exact public GitHub readback and the fresh public-clone install/test/build are complete. Earlier local-only snapshots in this repository are historical; they do not override this release follow-up.

The repository contains the MIT licence, credits/AI-assistance disclosure, scientific scope, independent benchmark, setup, tests and a two-minute presentation script. `docs/SUBMISSION-AUDIT.md` distinguishes public organizer facts from entrant-supplied rules and unresolved questions. Exact eligibility/track/hardware/hosting/AI conditions are not inferred from the public FAQ.

The actual demo video, organizer submission and receipt remain outstanding. There is no claimed hosted deployment. Real beginner comprehension, Safari, screen-reader listening, actual 200% browser zoom and human audio evaluation remain unverified.
