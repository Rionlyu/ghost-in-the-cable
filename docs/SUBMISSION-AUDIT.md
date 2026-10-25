# Submission audit — Ghost in the Cable

Parent release follow-up: the actual-backend workbench screenshot now exists, README relative links pass, and the rebuilt production application passes 470 Python tests, 27 Node tests and 111 browser checks. See [the current release check](RELEASE-CHECK.md), which supersedes the earlier local readiness snapshot below. An initial independent source/science review and a focused review including the subsequently restored cosmetic switch motion both passed with no blocking security or logic findings. Public repository readback and a fresh public-clone install/test/build are now verified at https://github.com/Rionlyu/ghost-in-the-cable. The actual video and submission receipt remain outstanding.

**Checked: Sunday, 25 October 2026, Warsaw (CET, UTC+01:00).**
**Verdict: public source published and clean-clone checks passed; hackathon submission is not complete.** The actual demo video and submission receipt remain outstanding. The repository includes the MIT licence; eligibility and challenge-specific rules are not settled by the public pages.

Original audit scope (before the parent release follow-up): read-only review of the official Warsaw pages and local project evidence, followed by creation of this new document only. This audit did not edit existing project files, publish a repository, create a deployment, send a message, register an account or run a QPU job. Application tests were not rerun for this audit. Recommendations below are not additional organizer rules.

## 1. What the public sources actually establish

Use these provenance labels throughout:

- **LIVE** — directly inspected public organizer material on 25 October 2026.
- **ENTRANT-SUPPLIED** — organizer announcement preserved in `docs/RULES-CHECKLIST.md`; the original post was not independently inspected here.
- **LOCAL** — a file, recorded result or Git observation, not organizer approval.
- **UNCONFIRMED** — no adequate rule text obtained; do not turn an assumption into a requirement or permission.

| Finding | Provenance and consequence |
| --- | --- |
| Warsaw event: 19–26 October; online hackathon: 23–25 October. | **LIVE** official programme and linked Luma listing.[1][2] |
| Exact deadline is posted on Discord in UTC; team limits and submission rules are also on Discord. | **LIVE**, not a publicly verified exact cutoff.[1] |
| Registration requires host approval on Luma. | **LIVE**; this audit did not verify the entrant's registration/approval.[2] |
| The linked prerequisites cover setup/accounts, not a challenge-specific hardware mandate. | **LIVE**; an IBM account being discussed for hardware/hosted simulators does not establish required QPU execution.[3] |
| Code of Conduct applies across the event; do not expose others' private information or record/share participants without permission. | **LIVE**; keep the demo to the app and consented material.[6] |

The public FAQ explicitly says: “Team size limits and the submission rules are posted on Discord.”[1]
The official invite reached a registration/login page, not readable channel messages; no private announcement or challenge brief was authenticated in this audit.[5]
No separate public challenge brief was linked from the inspected programme, Luma or prerequisites pages; this is a bounded search result, not proof none exists.[1][2][3]

On this check, the `www` entry redirected to the bare-domain site; do not treat a cached older variant as an independent rulebook.[4]
Monday's programme ends at 15:00 on the main site but 17:00 on Luma; neither time is a submission deadline.[1][2]
General attendance is described as separable, but finalist/showcase obligations remain unconfirmed; do not declare Monday attendance mandatory or guaranteed unnecessary.[1]

## 2. Working submission requirements — entrant-supplied, not live-confirmed

Source for **every row below**: `docs/RULES-CHECKLIST.md`, “Confirmed in the organizer announcement supplied by the entrant.” This is a local record of the supplied announcement, not independent public verification or proof that no later Discord update exists.

| Item | Working requirement from that announcement | Current action/status |
| --- | --- | --- |
| Deadline | Sunday **25 October 2026, 16:00 UTC / 17:00 Warsaw CET**; late entries are not judged. | Treat as the working cutoff unless a later official announcement supersedes it. The UTC-to-Warsaw conversion was checked with `Europe/Warsaw`. |
| Repository | Public repository, licence and README. | README and root MIT `LICENSE` exist at final recheck; public URL not verified. |
| Video | Actual **1–3 minute** demo. | An actual recording and accessible sharing link remain outstanding. |
| Delivery | Email **submission@aiqtlab.com**, then check the event's submissions channel. | Address/channel instruction is entrant-supplied only. Nothing sent or acknowledged by this audit. |
| Reuse | Retain licences and credit reused open-source code. | Review actual code/assets/dependencies before release; a prior-art citation alone is not a reuse audit. |
| Blocking errors | Use the designated mentor-help channel. | Operational help route, not a substitute for submission. |

The internal target in the local checklist is **25 October, 14:30 UTC / 15:30 Warsaw CET**. It is a self-imposed buffer, not the organizer's deadline. Do not apply the previous day's UTC+02:00 offset to the Sunday cutoff.

### Rules still unconfirmed

- Solo eligibility and minimum/maximum team size; “you need not arrive with a team” is not proof that solo submissions are eligible.
- AI-assisted coding/content/art permissions and required disclosure; existing disclosure is not evidence of permission.
- Official Track 3 name, scope, scoring rubric and evidence requirements. Do not borrow another city's track labels, rubrics or thresholds.
- Whether physical hardware, a hosted playable link or a particular deployment format is required.
- Required subject line, attachments, repo tag/commit, team/contact fields, video host/access settings or extra submission form.
- Monday, 26 October presentation/finalist attendance obligations, if any.

**Practical handling:** check existing event announcements, schedule and challenge posts if already accessible; record the exact dated rule text, not just someone's recollection. Keep preparing the known repo/video/email package meanwhile. If the remaining rules cannot be obtained, preserve these uncertainties and make a human go/no-go decision; this audit cannot certify eligibility or acceptance and does not invent a new organizer-confirmation prerequisite.

## 3. Local readiness audit

Snapshot from inspected files and local Git; it is not a promise about a later release. Concurrent release preparation changed the README and added `LICENSE`/`NOTICE.md` during this audit; the licence/status rows reflect the final recheck at **12:27 CET on 25 October 2026**. This audit did not make those changes. Recheck the frozen release rather than assuming this working tree stayed unchanged.

| Deliverable | Status | Evidence / remaining work |
| --- | --- | --- |
| README and local run path | **PRESENT; final link/clean-checkout check pending** | `README.md` documents Python/Node/uv, `./run.sh`, manual setup, Qiskit simulation and limitations. Its proposed GitHub clone URL is not proof of publication. Documentation links are checked in the current release record. |
| Project licence | **PRESENT LOCALLY** | Root `LICENSE` contains MIT text and a 2026 entrant copyright notice; `NOTICE.md` records credits, AI assistance and dependency notices. Entrant review/approval and final actual-reuse checking remain separate from file presence. |
| Attribution/reuse | **DOCUMENTED; final audit pending** | `docs/PRIOR-ART.md` credits established protocols and existing educational games, describes the intended game-design contribution and states an original asset ledger. Independently review actual reuse; do not claim worldwide novelty or “first quantum repair game.” |
| Scientific conditions | **DOCUMENTED** | `docs/SCIENCE.md` specifies fault family/prior, one device use, retained reference, joint decoding, bit order, controls and limits. Keep those conditions in narration and evidence captions. |
| Benchmark artifact | **PRESENT; parsed, not regenerated here** | `evidence/benchmark.json`, generated 24 October 2026, records 393,216 sampled outcomes and `hardware_used: false`. Ideal entries: Z, X and correlated-reference controls each 8,192/16,384; Bell 16,384/16,384. Parsing confirms the stored values, not a fresh experiment. |
| Automated/browser verification | **HISTORICALLY RECORDED, not rerun here** | `docs/VERIFICATION.md` reports 470 Python tests and 20 Node tests; its latest follow-up and `docs/STATUS-LAYOUT-FIX.md` report 89 browser checks with no skips. Earlier 59/86 browser records are earlier scopes, not additive totals. Fixtures/harnesses are not all Qiskit experiments. |
| Remaining UX/platform limits | **OPEN** | `docs/CINEMATIC-VERIFICATION.md` retains a very-long-error portrait stress case and unverified Safari, screen-reader, true 200% zoom and human audio checks. Do not present a scoped pass as accessibility certification. |
| Beginner comprehension | **OPEN** | `docs/PLAYTEST.md` remains a blank protocol; no real beginner results are established. Automated passes cannot stand in for volunteers or learning gains. This is a quality/evidence gap, not a newly discovered public submission rule. |
| Git/public release | **NOT VERIFIED / NOT RELEASED BY THIS AUDIT** | At inspection: no local commits, no configured remote, project files untracked. No exact public repository URL or public clean-clone result was available. A GitHub login alone is not publication. |
| Video | **OUTSTANDING** | Local docs explicitly do not claim a recorded demo. Record, measure duration, and verify the actual shared file/link; no demo URL is invented here. |
| Hosting | **NOT ESTABLISHED; requirement unconfirmed** | README describes a local, in-memory hackathon demo, not hardened multi-tenant hosting. A Python/Qiskit backend is required; publishing static frontend files alone is not a playable deployment. Do not substitute localhost for a judge-accessible hosted URL. |
| Submission/receipt | **OUTSTANDING** | No sent email, organizer acceptance or submissions-channel confirmation was inspected. The email below is a draft only. |

### Before authorizing a GitHub release

- [ ] Review/approve the included MIT licence and `NOTICE.md`; check real third-party notices/credits and all README links on the frozen release.
- [ ] Review the intended upload file set, including untracked files. Do not blindly stage every screenshot, log, cache or local experiment.
- [ ] Inspect for credentials, private keys, personal files, bearer session identifiers, `.env` variants and accidental recordings. Current `.gitignore` covers `.env`, common Python caches and Node/build/test-output directories; that is not proof every sensitive file is excluded.
- [ ] Re-run the required release checks against the exact intended source state; record failures honestly. Use the existing README verification commands rather than inventing passing output.
- [ ] After explicit authorization to publish, verify the exact repository is public and includes README, licence, source, lockfiles and intended evidence; test a fresh checkout without a developer's private environment.
- [ ] Give judges a truthful access path: verified public deployment only if actually provided, otherwise the real local setup instructions, with hosting eligibility still unresolved.
- [ ] Preserve the final submitted revision and actual repo/video URLs. Do not label any release, deployment or email completed until its exact target has been read back.

## 4. Minimal submission email — NOT SENT

Use only after the human entrant supplies the actual registered identity/team, checks available current rules, verifies real links and authorizes sending. Recipient below is from the entrant-supplied announcement, **not independently public-confirmed**. Subject/body layout is proposed, not organizer-mandated. Replace every bracketed placeholder; omit an optional hosted-play line if there is no deployment.

```text
To: submission@aiqtlab.com
Subject: Warsaw Qiskit Fall Fest 2026 — Ghost in the Cable

Hello organizers,

Please find our submission, Ghost in the Cable.
Entrant/team: [actual registered name(s) and team name]
Track: [verified official track name/number]
Public repository: [verified public repository URL]
Demo: [verified accessible video URL; actual duration]
Run instructions: README in the repository (./run.sh)
Optional hosted play: [actual verified URL, or omit this line]

The game teaches one-use Pauli-fault identification through Qiskit
simulation and an entangled-reference repair mechanic. It does not claim
physical-QPU execution, computational speedup or measured learning gains.

AI assistance: Hermes Agent and parallel coding/research agents assisted
development; [state the human review actually performed and any additional
rule-required disclosure]. Attribution and limitations are in the repository.

Contact: [entrant's actual contact details]
Thank you,
[entrant name]
```

After an authorized send, verify the sent message's recipient, timestamp and actual links, then follow the supplied submissions-channel instruction. A sent message is evidence of sending, not proof of organizer acceptance. If anything is inaccessible or unresolved, report that plainly rather than claiming a completed submission.

## 5. Source scope and limitations

All external sources below were checked on **25 October 2026**. The programme, Luma, prerequisites and conduct text were retrieved directly from their live public URLs; the Discord check used the public browser invite only. Search results from other cities were not used as Warsaw rules. The configured text-extraction backend could not extract pages; direct retrieval provided the page text instead. No Discord login or server-channel access was attempted.

Local evidence inspected on the same date: `README.md`, `.gitignore`, `pyproject.toml`, `LICENSE`, `NOTICE.md`, `docs/RULES-CHECKLIST.md`, `docs/PRIOR-ART.md`, `docs/SCIENCE.md`, `docs/VERIFICATION.md`, `docs/CINEMATIC-VERIFICATION.md`, `docs/STATUS-LAYOUT-FIX.md`, `docs/PLAYTEST.md`, and the stored `evidence/benchmark.json`. Local Git observations establish only this checkout's state. This document is not a full dependency, security, legal or science-reproduction audit.

## Sources

[1] https://qfest2026.com — Qiskit Fall Fest 2026 Warsaw — official programme and FAQ
[2] https://luma.com/4mjpbt0m — Warsaw Qiskit Fall Fest 2026 — official linked registration
[3] https://qfest2026.com/prerequisites — Warsaw event prerequisites
[4] https://www.qfest2026.com — www event URL — redirect check
[5] https://discord.gg/Jvp4hdKGAy — Official event Discord invite — public access boundary
[6] https://qfest2026.com/code-of-conduct — Warsaw event Code of Conduct
