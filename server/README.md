# Backend interfaces and local-demo boundary

Run from the project root (one worker only):

```sh
uv run uvicorn server.app:app --host 127.0.0.1 --port 8000
uv run pytest tests/backend -q
```

No server is started by importing `server.app`. Its `app` is the ASGI application.
`create_app(*, store=None, dist_dir=None)` creates an isolated application; the
optional build directory otherwise defaults to project `web/dist`. The fallback
is GET-only and does not turn unknown `/api` paths into HTML successes. Builds
created after application construction are recognized without a restart.

## Physics / benchmark imports

Import directly from `server.engine`:

- `build_circuit(tool: str, fault: str) -> QuantumCircuit`: includes final
  measurements, with qubit index i measured to classical-bit index i.
- `exact_probabilities(tool: str, fault: str) -> dict[str, float]`: computes from
  `Statevector` of the actual measurement-free circuit. Includes zero outcomes;
  rounds numerical floating-point residue to 15 decimals.
- `run_probe(tool: str, fault: str, seed: int | None = None) -> dict`: calls
  Qiskit `sample_memory(shots=1)`. The optional seed exists for offline Python
  benchmarks only, not as a web input. Returns the public reading fields plus
  `circuit_text`, `gates`, `probabilities`, `probe_marginal`,
  `reference_marginal`. **Do not serialize this whole dict before diagnosis.**

Accepted strings are exactly tools `z`, `x`, `bell` and faults `I`, `X`, `Z`,
`Y`. Invalid values raise `ValueError`. Bell faults act on q0. Display order is
c1c0 (reference then probe): I=00, X=10, Z=01, Y=11. All returned outcomes come
from the simulated circuit, not this explanatory mapping. Marginals are actual
reduced-density populations immediately after the fault, before decoding. Both
Bell marginals are 50/50. The actual Qiskit text drawing has only its box/wire
glyphs transliterated to portable ASCII; gate metadata retains barriers and
measurement operations (`id`, `h`, `cx`, `measure`, etc.).

## Public resettable training cables

POST `/api/training/probe` accepts exactly `{tool, fault}` with the same tool/fault enums, forbidding extra fields (including customer IDs, seeds, shots and revision selectors). `server.training.run_training_probe` calls the actual engine once, then returns a tagged `kind: training` response with the known selected fault, nested public reading and allowlisted circuit/probability/marginal data. Both top-level and nested gate data are allowlisted. This endpoint does not reference the session store. It cannot select or inspect a private customer fault, consume their query, alter their revision or spend a link token. Invalid input is422; simulator or invalid engine-result failure is a safe503, with no replacement reading.

The tutorial deliberately compares separate resettable cables. It is not permission for two probes on one customer's single-use device. Its exposed fault/circuit belongs only to the public training cable; the customer-secrecy rule above remains unchanged. `tests/backend/test_training.py` verifies all12 literal mappings, actual simulator calls, one device gate, Bell pre-decoder marginals, strict input/output boundaries and unchanged public/private customer state.

## Sessions and HTTP behavior

The HTTP contract is the parent-owned `API-CONTRACT.md`. Successful mutations
return HTTP 200. Unknown/expired/lost IDs return 404, invalid bodies or
out-of-family diagnoses 422, illegal phases, stale revisions and exhausted tokens 409. Bodies
are strict Pydantic models with extra fields forbidden. A successful probe
commits its reading and token cost atomically; recovery GET never resamples.

POST `/api/shifts` accepts `{}` for the default story, or a single optional
`route` field with exactly `story`, `bits`, `phase`, or `entanglement`. All other
fields remain forbidden: clients cannot choose ticket IDs, faults, seeds or budgets.
Every Shift includes its public `route` string (default `story`) and actual
`ticket_count`:

| Route | Ticket IDs in order | Initial Bell tokens |
| --- | --- | --- |
| `story` | porchlight, whisperphone, mirror-organ, skeleton-sign, fog-machine, moon-radio, midnight-projector, dawn-bell | 3 |
| `bits` | porchlight, skeleton-sign, dawn-bell | 0 |
| `phase` | whisperphone, moon-radio | 0 |
| `entanglement` | mirror-organ, fog-machine, midnight-projector | 3 |

`SessionStore.create(route="story")` snapshots the selected sequence and ticket
definitions at creation. Advancement uses that private snapshot, not a mutable
global catalogue. Choosing another route creates a new independent shift; it
cannot alter or reroll the existing one. Free tools remain available on every
route, including ambiguous choices, and every accepted probe still runs Qiskit.

Every Shift includes `revision`, initially `0`. All three mutation bodies require
`expected_revision`: `{tool: "z", expected_revision: 0}` for probe,
`{fault: "I", expected_revision: 1}` for diagnose, and `{expected_revision: 2}`
for next in a simple first-ticket sequence. Creation does not accept a revision.
The revision is a strict nonnegative integer; missing values, null, booleans,
strings, floats and negative values return 422. There is no optional legacy path.
Under the existing lock, the store compares the expected and actual revision
before phase checks, Qiskit execution, token use, scores or history changes.
A mismatch returns 409 without changing game state. Every successful mutation
increments revision exactly once; GET and failed actions never do. The final
completion transition increments it too, to `3 * ticket_count`: 24 for story,
9 for bits/entanglement, and 6 for phase. Delayed
requests therefore cannot act on a later ticket when its phase cycles back.

The UI sends the revision captured from its rendered shift, not one fetched
just before an action. After a 409 it refreshes and asks the player to review
the bench; it never retries the captured action against the new revision.

A Qiskit failure returns 503 without spending a query or token; unexpected
internal failures return generic JSON 500 and instruct the client to reload.

State is ephemeral process memory: a server restart or reload loses all shifts.
Use one worker, not a multi-process deployment. The default store holds at most
128 shifts, expires them after 7,200 idle seconds, and evicts the least-recently
accessed shift at capacity. Expiration is checked lazily on session access or
creation. `SessionStore(max_sessions=..., idle_ttl_seconds=..., clock=...)`
allows deterministic capacity/expiry tests. A reset creates a new independent
shift, not a reroll or deletion of the old one.

After the final resolved route ticket, POST `next` moves to `complete`, leaves the
zero-based `ticket_index` at `ticket_count - 1`, and clears `ticket`, `reading`,
and `debrief`. History has `ticket_count` resolved entries. GET `report` remains 409 until this final
transition. Its full JSON export shape (the shared contract does not specify
report subfields) is:

```text
{
  schema_version: 1,
  title: string,
  engine: "qiskit-statevector",
  qiskit_version: string,
  shift: Shift,                       // complete public shift + history
  resolved_tickets: [
    { ticket: Ticket, reading: Reading, debrief: Debrief }
  ],                                 // every actual circuit debrief in this route
  limitations: string[]
}
```

This is a local educational demo, not production authentication or anti-cheat.
The unguessable shift ID is a bearer capability: anyone holding it can control
that shift. A player with local Python/filesystem/process-memory access can
inspect the hidden state. The supported boundary is an ordinary browser using
the API: no hidden fault/circuit/debug field before diagnosis, no extra probes,
no cross-shift budget sharing, no wildcard CORS, no remote documentation assets,
no analytics or account infrastructure. All API responses are no-store JSON;
local HTML has a same-origin CSP and basic security headers. Do not expose the
loopback server publicly without a separate deployment/security design.

The evidence endpoint is exact ideal-circuit math, not an empirical experiment
or hardware run. Its 50% / 100% comparison assumes four equiprobable Paulis and
one device use, comparing unassisted versus entanglement-assisted quantum
probes—not classical computation speed. Two-suspect jobs can be solved exactly
without Bell tokens. No remote QPU, credentials, or hardware services are used.
