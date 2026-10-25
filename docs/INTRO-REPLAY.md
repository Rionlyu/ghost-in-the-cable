# Replay intro means a full game restart

Latest entrant clarification: Replay intro must restart the whole game, not play a presentation-only detour and return to the old ticket.

Menu → Replay intro asks for confirmation if a game, tutorial or old save exists. Keep playing leaves the current ticket, selected probe, tutorial and saved ID unchanged. Restart game clears the browser's saved shift, disposes tutorial results, resets the current route/score/selection/repair state and returns to the original forest title. Open the shop then runs the normal cinematic entry, opens a fresh story session, shows the keeper and offers a fresh tutorial from stage zero.

The title alone creates no API request or session. Refreshing there cannot resume the cleared save. The old server session is not altered or deleted; it remains subject to normal ephemeral-session expiry. Only deliberate Open the shop creates the new story session, with a new ID, zero credits, no readings/history and three link tokens. This does not allow a second query on the old cable.

Sound and reduced-motion preferences stay intact. The existing cinematic controller still owns natural completion, Skip, Escape and stale-animation cancellation. Replay is disabled during pending customer/training requests. If browser storage removal fails, the UI warns that refresh may restore the earlier save; it does not falsely claim the old save was removed.

Verification on rebuilt production http://127.0.0.1:8000:

    LIVE_API=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:8000 ./node_modules/.bin/playwright test tests/e2e/cinematic-replay.spec.ts --workers=1 --reporter=dot

Result: 7 passed (6.3s). The new full-restart test first failed against the earlier preserving-replay implementation, then passed after the change. Live checks cover confirmation/cancellation, desktop natural entry, 390px Skip, 320px Escape, saved-ID clearing across refresh, new session/resource reset, unchanged old server session, disposed tutorial cache, fresh stage zero and title-only restart. Two explicitly labeled held-response UI guards cover pending customer/training requests. No external novice or screen-reader claim is made.
