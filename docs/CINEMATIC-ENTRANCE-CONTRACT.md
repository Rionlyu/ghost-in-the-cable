# Full-viewport game opening

2026-10-24. Latest user feedback overrides the earlier front-page approval: the framed illustration beside a website headline is rejected. The tutorial is liked but still not understood; this pass preserves its content and does not claim that teaching problem is solved.

## Required experience

- Fill the actual browser viewport, edge to edge, on desktop and portrait/landscape phones. No max-width shell, website header/footer, illustration card, split hero, premise paragraph or marketing CTA panel on the entrance.
- The visitor is in a forest, not looking at a small picture of one. Layer near trunks/branches, deeper trees, ground/path, low fog and a distant warm workshop. Original art only; no downloaded game assets, remote fonts, dependencies or public services.
- Begin with a slow forward establishing camera move. The game title and immediately usable Open the shop action overlay the scene. Choose a chapter and small Help/Menu game-option controls remain available, but do not form a website navbar.
- Open the shop makes a visible camera push through the woods toward the workshop, then cuts into the existing keeper/tutorial welcome. It must not simply hide a full-screen still or zoom a small illustration card.
- Skip animation and Escape finish the entry immediately. Reduced motion and Motion off bypass travel. Controls never require an animation to end before they can be used. No forced fullscreen/browser permission request.
- Keep sound off by default. No flashing. Full-screen clipping belongs to the scenic world, not to content/errors/controls. Native keyboard navigation, visible focus, safe areas and short-landscape controls must work.

## Technical boundary and shared files

- Existing real backend at localhost:8000 stays running; no backend/session-store restart. Only frontend is rebuilt. Preserve saved-shift immediate resume, real API errors/retry, chapter selection, tutorial content, one-query/revision/fault concealment and all repair behavior.
- Parent owns main.ts integration, cinematic.ts controller/markup, cinematic.css full-screen layout, all integration tests and docs. The artist owns only forest-scene.ts, forest-scene.css and its separate unit/harness assets.
- Artist exports forestScene(): string from web/src/forest-scene.ts, importing ./forest-scene.css. Return a full-bleed .forest-world containing exactly one [data-forest-camera] element. Camera fills the viewport, has transform-origin:50% 60%, and is stable at transform:none before the parent controller starts. Place the house/approach focus near that origin.
- Parent controller animates that camera using real Web Animations: an establishing forward push, then a stronger entry push from its actual computed transform. Artist may animate ambient fog/branches but must NOT animate the camera transform itself.
- Use multiple meaningful depths and mobile edge framing; cropping one wide SVG must not remove all the foreground trees on portrait phones. No title/buttons/text in forestScene; parent overlays those.
- Parent scene section is [data-cinema] with data-cinema-state=ready|entering. App gets .cinematic-mode only while that scene exists. Existing [data-atmo-motion=on|off] and [data-atmo-visible=on|off] expose atmosphere preferences. Respect both in artist CSS.
- Camera completion only starts the existing story-session call. A latest-only generation/one-shot guard prevents duplicate start calls after double clicks, skipping, route changes, DOM replacement or late animation promises. No gate/state result waits behind a cinematic timer: no customer query exists during travel. If native animation fails or is absent, open directly; provide a bounded safety fallback.
- On an API failure, retain the full-screen scene with a readable usable real error/retry panel. Resuming an existing shift, choosing a chapter or restarting from inside the bench must not force a cinematic trip.

## Acceptance / proof

1. Observe the old page fail new full-viewport/no-navbar and camera-travel assertions before changing its production behavior.
2. Inspect actual start/mid/end frames at1440,768,390,320px and a short landscape. The entire frame should be forest/cinema, not negative space around an illustration. Verify near/far depth and visible change of camera scale using native animation state, not only CSS source strings.
3. Test natural completion, Skip, Escape, reduced motion, Motion off, unavailable/cancelled animation, duplicate clicks, route-change cancellation, errors/retry and saved resume. No duplicate session creation and no customer probe/diagnosis from the entrance.
4. Rebuild the real production bundle; run Node/type/build and all live browser regressions against localhost:8000. Keep meaningful old science/state assertions; migrate only deliberately replaced entrance copy/selectors.
5. Obtain independent review and record its real verdict. No novice comprehension, cinematic quality approval or perceptual audio testing is fabricated.
