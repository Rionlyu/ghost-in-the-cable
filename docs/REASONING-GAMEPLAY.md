# Evidence-led customer repairs

This pass supersedes the **customer repair-preview and probe-recommendation** parts of the earlier redesign/walkthrough documents. The resettable, hands-on training tutorial stays scaffolded and unchanged. Backend ticket families, routes, budgets, revisions, simulator execution and API payloads are unchanged.

## Customer loop

1. **Read the suspects.** The cream ticket lists the actual public fault symbols and names: I · No fault, X · Bit flip, Z · Phase flip, Y · Both flips, limited to that ticket’s existing family. It does not translate the family into “Check bit/phase.” Existing IX, IZ and IXYZ jobs are sufficient; this change does not depend on new server families.
2. **Choose an experiment.** Unselected tools ask “Which probe separates these suspects?” No first-job or keeper-transition recommendation chooses the probe. Selecting a tool explains only its capabilities and cost: Bit reads bit, Phase reads phase, Linked uses a joint decoder to read both for one link token. Ordinary probes cost no link tokens.
3. **Keep the evidence fixed.** The customer CRT displays the original measured reading and schematic measured signal. Switching repairs cannot move a signal toward zero, change the measured bits, reveal an unmeasured dimension, or produce a repair prediction. A brief switch-driven pulse moves the corresponding trace, then settles back to that original measurement; this is cosmetic feedback, not another measurement or a live answer evaluator. Unknown remains Unknown. Switches still operate normally and make no request; all-off I remains a valid repair.
4. **Infer and commit.** The repair prompt asks the player to infer the correction from reading plus suspects. It never changes to “try the switch,” “switch back,” “aligned,” or another answer-evaluating instruction. A missing-information notice says only that some information was not measured. Apply repair retains the existing captured-revision mutation and server authority.
5. **Explain after confirmation.** Only the resolved server response unlocks the causal feedback. Success/failure still comes from `debrief.correct`, not a local signal calculation. The CRT retains the original measurement even after resolution; the device indicator and ticket stamp show the confirmed outcome.

Help distinguishes this fixed customer evidence from the resettable training cable’s guided correction preview. Optional Help and circuit inspection retain tool semantics, science and the detailed server explanation. No raw circuit/probability fields appear on the customer bench or in its concise feedback.

### Why a result did or did not identify a repair

Resolved feedback combines the public family, chosen tool, recorded reading and resolved fault/applied repair:

- On IX with Bit, I → 0 and X → 1 separate the suspects. On IZ with Phase, I → 0 and Z → 1 separate them.
- On IX with Phase, **both I and X give 0**: bit was not measured. On IZ with Bit, **both I and Z give 0**: phase was not measured. A zero is not proof of a clean cable. A correct guess in either case is still explicitly described as not identified by the reading alone.
- On IXYZ, an ordinary probe leaves a pair indistinguishable. Feedback names the pair actually consistent with the reading and the missing dimension; it does not imply the revealed fault was already known.
- Linked’s joint decoder gives each suspect a different bit/phase pair. Display order remains c1c0: bit-flip syndrome first, phase-flip syndrome second.
- The repair explanation names the revealed fault and what the submitted correction did: cancelled the flip(s), correctly made no change, or left a named residual fault. For example, applying Y to an X fault leaves a phase flip. This is an explanation of the resolved ideal Pauli model, not a second measurement.

The public ideal-model outcome table in `debriefView` is explanatory only. It never generates a measurement, picks a live repair, or substitutes for the server result. `debriefView` returns no markup before `phase === 'resolved'`.

## Parent integration follow-up

The rebuilt production bundle now passes all 470 Python tests, 27 Node tests and 111 browser checks; see [RELEASE-CHECK.md](RELEASE-CHECK.md). The old tutorial-transition assertions mentioned below have been migrated. The customer switch motion was restored as a transient cosmetic trace pulse, not a correction preview. `<scratch>` below replaces the original developer-local output directory; it is a placeholder, not a literal shell argument.

## Initial implementation boundaries (historical)

- Production edits are restricted to `web/src/views.ts`; training, main event handling, atmospheric effects, cinematic entrance, styles and server files are untouched.
- Existing `data-tool`, `data-action`, `data-repair`, `data-signal`, `.reading-bits` and `.preview-label` selectors remain. The legacy `data-device-state="preview"` value remains for style/selector compatibility during diagnosis; its visible content now labels fixed evidence, not a preview.
- New `data-reasoning="probe"` / `data-reasoning="repair"` markers identify the two concise resolved explanations.
- No shared fixture migration is required. The existing UI fixture’s fixed X/Z faults suffice. Parent-owned `web/tests/e2e/tutorial.spec.ts` currently has old `.keeper-transition` expectations at lines 98 and 100; migrate those customer-transition assertions to the neutral question while retaining all actual training-preview assertions.
- This changes the reasoning opportunity, not proof of beginner comprehension or enjoyment. Human novice playtesting remains necessary.

## Test-first and executed verification

Working directory for commands below: `web/`.

Each new view behavior was first asserted in `tests/repair.test.mjs`, executed and observed failing against the previous implementation, then implemented and rerun green. RED selectors were `customer ticket`, `customer probe choice`, `customer bench`, `customer diagnosis`, `resolved feedback`, and `Help distinguishes`. Failures showed the old Check label, recommended probe, changing preview/answer guidance, missing causal explanation, or outdated Help copy, respectively.

Executed checks:

```sh
node --test tests/repair.test.mjs
npx --no-install tsc --noEmit
```

Result: **9 Node tests passed**, typecheck exited 0. Tests cover all eight legal probe readings against every repair-switch combination, all-off I, Unknown dimensions, neutral chapter/keeper guidance, distinguishing evidence, ambiguous zero and nonzero readings, lucky repairs, failed corrections and the resolution guard. The test loader uses Node’s built-in TypeScript stripping and explicit module URLs, so it exercises actual view functions without writing `web/dist`. Node 26 emits an ExperimentalWarning for that loader API; it is not a failing test.

An isolated source Vite server was started on `http://127.0.0.1:5187`, leaving the parent’s production `:8000` build untouched. Its API proxy used the existing local backend.

```sh
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5187 npx --no-install playwright test \
  tests/e2e/reasoning.spec.ts tests/e2e/repair-redesign.spec.ts \
  --workers=1 --output=<scratch>/ghost-reasoning-e2e

LIVE_API=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:5187 npx --no-install playwright test \
  tests/e2e/story-redesign.spec.ts --workers=1 \
  --output=<scratch>/ghost-reasoning-live
```

Results: **15 UI-fixture browser tests passed** and **6 live-backend browser tests passed**. The fixture cases are UI tests, not quantum-engine evidence. A held diagnose response verifies that causal feedback and repaired/failed status do not appear merely because the player committed. Live cases verify unchanged public server state after switches, a single accepted query, actual Qiskit reading metadata and repair confirmation.

Additional reduced-motion Chromium captures exercised choice → fixed evidence → failed correction at 320, 390, 768 and 1440 CSS pixels; no console/page errors or horizontal overflow were recorded. The 320/390 full-family choose-probe actions ended within the 844px viewport. Visually inspected 320px choice/debrief, 390px evidence and 1440px debrief: suspect names, measured lanes, switches and causal feedback remain readable without clipping. The repair and debrief may require vertical scrolling on short/narrow screens; this pass does not claim every resolution action is above the fold.

Screenshot paths in scratch (not bundled output):

- `<scratch>/reasoning-320-choice.png`
- `<scratch>/reasoning-390-evidence.png`
- `<scratch>/reasoning-320-debrief.png`
- `<scratch>/reasoning-1440-debrief.png`

Parent integration still owns the rebuilt production-bundle run, full suites, tutorial/replay regression pass and migration of tests outside this slice. No production build, commit, publication or backend change was performed here.
