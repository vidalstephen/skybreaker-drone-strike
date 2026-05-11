# Skybreaker Drone Strike Regression Smoke

Use this checklist after visual, HUD, renderer, mission, input, or level-kit changes. It is intentionally manual/browser-driven because the game depends on live WebGL rendering, local storage, responsive layout, and real input timing.

## Required Build Checks

Run from the project root:

```bash
docker run --rm -v "$PWD":/app -v skybreaker-drone-strike-node-modules:/app/node_modules -w /app node:20-alpine sh -lc "npm run lint"
docker compose build --progress=plain && docker compose up -d && docker compose ps
```

Expected result:

- TypeScript exits with zero errors.
- Vite production build completes. The existing large-chunk warning is acceptable.
- `skybreaker-drone-strike` reports `Up` after deploy.

## Desktop Smoke

Viewport target: desktop, roughly 1000px wide or larger.

1. Open `https://skybreaker.nsystems.live`.
2. Confirm the animated splash auto-advances or skips on input and reaches the hangar hub.
3. Confirm the hangar hub renders without horizontal overflow and shows Next Sortie, Campaign, Loadout, Pilot Record, Settings, Controls, Credits, and Reset Progress actions.
4. Open Campaign and verify:
   - All eight campaign missions render in arc groups.
   - Mission lock/ready/cleared states match the current save.
   - Selecting a mission updates the selected sortie panel.
5. Open Settings and verify:
   - Audio, Video, Controls, and System tabs are visible and tappable.
   - Graphics quality buttons show LOW, MEDIUM, HIGH.
   - Reduced Effects toggles and persists after reload.
   - Invert Y toggles and persists after reload.
   - HUD Scale, Touch Scale, Screen Shake, Pointer Sensitivity, Telemetry, and Menu Motion persist after reload.
6. Open Controls and verify the keyboard, mouse, and touch control matrices render without overflow.
7. Open Pilot Record and Loadout and verify career records and weapon cards render from current progress.
8. Start Mission 1: Signal Break through Campaign -> Briefing -> Loadout -> Launch.
9. Confirm briefing shows:
   - Environment: Night Grid.
   - Hazards: Clear.
   - Par time, reward, failure conditions, and enemy wave context.
10. Confirm Loadout shows Pulse Cannon and Ion Missile with locked/unlocked state from campaign rewards.
11. Launch Mission 1 and confirm:
   - WebGL canvas fills the viewport.
   - Revised player aircraft silhouette is visible in chase view, forward-facing, and does not occlude the reticle, projected weapon path, objective panel, radar, or target markers.
   - HUD shows CHASE VIEW, compass, radar, vitals, speed, objective panel, and target markers.
   - Objective reads `DESTROY RADAR TOWERS: 0 / 3`.
   - W/S/A/D, Q/E, R, C, Shift, Space, and F do not break the mission loop.
   - Boost changes speed/FOV/thruster feedback while energy drains.
   - Primary fire consumes energy and shows recoil/weapon-path feedback.
   - Muzzle flash and projected weapon path align with the aircraft nose/firing direction.
   - Secondary without a target reports a no-lock or acquiring state instead of firing blindly.
   - Radar heading moves smoothly and blips remain clamped/readable.
   - Target markers remain inside safe zones and can be clicked to navigation-lock.
   - C toggles cockpit view and hides the aircraft; toggling back restores chase view and the aircraft silhouette.
   - Telemetry visibility follows the Show Telemetry setting.
   - Pointer fine control, screen shake, HUD scale, and touch-control scale settings do not break mission input or layout.
12. Pause and verify Resume, Retry, Settings, Controls, and Return To Menu work; Settings/Controls opened from pause return to the pause overlay.
13. Simulate or play through target destruction if time permits:
   - Weak points take damage first on configured targets.
   - Target destroyed count increments once per installation.
   - Extraction marker appears only after all targets are destroyed.
   - Entering extraction completes the mission once.
14. Trigger failure once during a regression pass:
   - Leave the mission boundary or reduce hull to zero.
   - Confirm warning/failure overlay appears and Retry/Return to Hangar flows still work.

## Mission 2 Smoke

Use an existing save or temporary localStorage progress that unlocks Mission 2.

1. Select Mission 2: Iron Veil.
2. Confirm briefing shows:
   - Environment: Ash Ridge.
   - Hazards: Ash Static.
3. Launch Mission 2 and confirm:
   - Objective reads `DESTROY RELAY SPIRES: 0 / 4`.
   - Relay-spire markers, radar blips, HUD panels, and weak-point visuals render.
   - Revised aircraft boost, primary fire, secondary lock, and cockpit/chase view feedback remain readable in Ash Ridge lighting.
   - Ash Static hazard zones are visible and drain shields/energy only when entered.
   - Heavy gunship and missile platform enemy roles can spawn without HUD/radar collapse.

## Mobile Smoke

Run after any HUD, marker, touch-control, floor, fog, renderer, or responsive-menu change.

Exact portrait and landscape touch smoke can be run without installing Playwright in the app image:

```bash
docker run --rm --network host -v "$PWD":/work -w /tmp mcr.microsoft.com/playwright:v1.52.0-noble sh -lc "npm init -y >/dev/null && npm install playwright@1.52.0 >/dev/null && NODE_PATH=/tmp/node_modules node /work/scripts/smoke-mobile.cjs"
```

Set `SMOKE_URL` to test another deployed URL:

```bash
docker run --rm --network host -v "$PWD":/work -w /tmp -e SMOKE_URL=https://example.test mcr.microsoft.com/playwright:v1.52.0-noble sh -lc "npm init -y >/dev/null && npm install playwright@1.52.0 >/dev/null && NODE_PATH=/tmp/node_modules node /work/scripts/smoke-mobile.cjs"
```

Portrait viewport: 390x844.

- Splash, Hangar, Campaign, Settings, Controls, Briefing, Loadout, Mission Complete, and Game Over views fit without horizontal page overflow.
- Hangar hub actions remain tappable: Campaign, Loadout, Pilot Record, Settings, Controls, Credits.
- Settings tabs fit and expose Audio, Video, Controls, and System groups.
- Campaign select renders mission cards and selected sortie details.
- Briefing and Loadout render before mission launch.
- Mission canvas fills 390x844.
- Touch joystick and FIRE, BOOST, MSL, BRK, LOCK, LEVEL, VIEW controls are visible and separated from bottom HUD content.
- Touch joystick and action buttons preserve current mappings: joystick pitch and assisted bank-turn, FIRE primary, BOOST energy drain/FOV feedback, MSL secondary, BRK air brake, LOCK target cycle, LEVEL auto-level, and VIEW cockpit/chase toggle.
- Compass, radar, objective, vitals, speed, FPS/quality, and target markers remain legible.
- Reduced Effects + LOW graphics still render a readable arena and HUD.

Landscape viewport: 844x390.

- Splash, Hangar, Campaign, Settings, Controls, Briefing, and Loadout fit without horizontal page overflow.
- Mission canvas fills 844x390.
- Touch controls render above bottom safe-area content.
- Radar, target markers, objective panel, and crosshair do not overlap incoherently.

## Product Shell Baseline

- Boot flow starts at the animated splash and reaches the hangar without user input.
- Hangar is the first actionable screen, not a landing page.
- Campaign selection owns mission browsing; briefing owns mission intelligence; loadout is currently a read-only campaign-clearance review.
- Pilot Record is local progress only; no cloud/account/leaderboard behavior is expected.
- Controls screen is a reference/configuration surface; editable key rebinding is deferred until input mapping is extracted.
- Settings are persisted under `skybreaker.settings.v1` with backward-compatible defaults for newly added fields.

## Flight Control Baseline

Current arcade-assisted flight baseline:

- W/S pitch, A/D assisted bank-turn, Q/E yaw correction, pointer drag fine control, R/F throttle up/down, Shift boost, Ctrl brake, Space or left mouse primary fire, Alt or right mouse secondary fire, Tab/T target lock cycle, X or LEVEL auto-level, C/VIEW camera toggle, touch joystick/actions, and invert-Y behavior.
- Boost still requires energy, drains energy while active, and triggers speed, FOV, camera shake, thruster, and streak feedback.
- Auto-level still decays pitch and roll only; yaw remains untouched.
- Forward flight and projectiles still use the drone local negative-Z direction.

## Renderer Evaluation

Current accepted renderer baseline:

- `THREE.SRGBColorSpace` output is enabled.
- `THREE.ACESFilmicToneMapping` is enabled.
- Exposure is conservative and readable for the dark tactical arena.
- Pixel ratio, antialiasing, fog distance, effect density, structures, plateaus, haze, hazard visuals, and speed streaks are already quality-gated or reduced-effects aware.

Deferred unless a dedicated performance pass proves headroom:

- Bloom/post-processing.
- Real mirror/SSR reflections.
- Dense dynamic lights or shadow maps.
- Higher floor reflection fidelity.

Do not add heavier renderer features unless the desktop and mobile smoke checks above still pass with readable HUD, stable FPS, and no objective/radar/marker readability regression.
