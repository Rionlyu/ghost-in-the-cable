# Ghost in the Cable
A solo Qiskit Fall Fest hackathon game, authorized by the user for implementation. No public deployment, submissions, paid resources, credentials, or QPU jobs without permission.

## Product truth
A Halloween repair-shop puzzle about choosing one-query experiments. Actual Qiskit circuits generate measurements. The server hides the fault until diagnosis. Deterministic toy I/X/Z/Y faults are not arbitrary stochastic hardware noise. The 50% versus 100% ideal comparison concerns unassisted versus entanglement-assisted QUANTUM probes for four equiprobable faults and one device use, not classical simulation speed or general quantum advantage.

## Scope
Playable eight-ticket story shift plus short focused Bit (three tickets), Phase (two) and Entanglement (three) chapters. Current teaching/atmosphere scope is docs/SCIENCE-WALKTHROUGH-CONTRACT.md, extending the earlier docs/REDESIGN-CONTRACT.md. A skippable, replayable apprenticeship teaches the probes through separate resettable known training cables and real Qiskit requests, without spending a customer's one-use query. Players then select an understood probe, inspect its test result and set bit/phase repair switches rather than choosing a multiple-choice diagnosis. One current instruction and primary action per stage. Three Bell-reference tokens in story/entanglement; none in the ordinary-probe chapters. Preserve the cream ticket and quirky art; add purposeful house/fog reveal, ticket arrival/stamps, restrained CRT motion and opt-in procedural sound rather than decorative slogans or repeated captions. Private faults, real post-round circuits, optional Help/science/evidence, final report/export, responsive keyboard operation and honest error recovery remain. Local offline operation after dependencies installed. No account, remote assets, analytics, credentials or fabricated results.

## Acceptance
Real Qiskit measurement per accepted probe; only one probe per ticket, token budget enforced on server, no fault leak before resolution, complete shift/reset/recovery behavior, benchmark with recorded seed and versions, browser E2E on desktop/mobile, docs including prior art, limitations, and genuine novice-playtest template. Original SVG/CSS art. User provides actual novice playtests and any official rules not publicly available.

## Architecture
Python 3.12, FastAPI/Pydantic/Qiskit Statevector/NumPy, server-owned local in-memory sessions (explicitly ephemeral), vanilla TypeScript + Vite + CSS, no UI framework. Python serves built web/dist for one-port demo. Vite proxy /api to local backend for development. uv.lock and npm package-lock.json. pytest and Playwright. No git commits/pushes.
