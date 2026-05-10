# Skybreaker Drone Strike Development Checklist

Use this file to track the staged work required to evolve the current prototype into a complete arcade drone combat game without breaking the existing playable slice.

## Status Key

- [ ] Not started
- [~] In progress
- [x] Complete

## Product Target

- Mid-size arcade campaign: 8-12 missions
- Preserve the current chase camera readability, clean HUD language, tactical radar, and reliable mission loop
- Keep the game playable after every phase

## Current Baseline

- [x] Core flight model playable
- [x] Combat loop playable
- [x] HUD and radar readable
- [x] Mission 1 vertical slice complete
- [x] Mission complete and mission failed overlays working
- [x] Docker build and deploy path working
- [x] Non-regression checklist written down in project docs (this file + DEV-CHECKLIST.md)

## Phase 0 - Baseline Lock

Status: Complete

Goal: protect the current prototype before larger refactors.

- [x] Document the current controls, mission rules, and expected flows (tracked in session notes)
- [x] Write a standalone BASELINE.md covering controls, mission rules, expected flows, and UI readability rules
- [x] Document non-regression rules for camera readability, HUD clarity, radar readability, and extraction flow
- [x] Record current mission acceptance checks for local validation
- [x] Define what must not change during architecture work

Exit criteria:

- [x] BASELINE.md exists in the project root with controls reference, mission walkthrough, and non-regression rules
- [x] Baseline behavior is documented before major refactors start

Completion summary:

- Shipped: Baseline lock documentation for controls, Mission 1 rules, HUD readability expectations, camera behavior, and non-regression constraints.
- Changed: `BASELINE.md`, `DEV-CHECKLIST.md`.
- Verification: Documentation review against the current playable prototype behavior.
- Notes/Risks: Future architecture and content phases must preserve the documented flight, HUD, radar, extraction, and terminal overlay behavior unless a later phase explicitly changes it.

## Phase 1 - Architecture Stabilization

Status: Complete

Goal: stop scaling the game through a single monolithic gameplay file. Work is broken into steps. Complete each step and verify the build passes before moving to the next.

### Step 1.1 — Target folder structure

Create the following empty directories and index files to establish the module layout before any code moves:

```
src/
  config/          ← tuning constants and game settings defaults
  types/           ← shared TypeScript interfaces and enums
  systems/         ← game logic (flight, combat, mission)
  components/
    hud/           ← HUD overlay components
    overlays/      ← full-screen state overlays (mission complete, game over)
    menus/         ← menu screens (Phase 2)
  hooks/           ← input and utility hooks
```

- [x] Create folder structure above (empty files/dirs only, no logic moved yet)
- [x] Confirm build still passes after structure creation

### Step 1.2 — Extract shared types

Target file: `src/types/game.ts`

Types to extract from `Game.tsx`:
- `GamePhase` enum: `BOOT | MAIN_MENU | BRIEFING | IN_MISSION | PAUSED | DEBRIEF | SETTINGS`
- `Target` interface
- `Enemy` interface
- `Projectile` interface
- `Explosion` interface
- `GameState` interface
- `CameraMode` type

- [x] Create `src/types/game.ts` with all shared types and the `GamePhase` enum
- [x] Update `Game.tsx` imports to use `src/types/game.ts`
- [x] Confirm build and lint still pass

### Step 1.3 — Extract tuning constants

Target file: `src/config/constants.ts`

Constants to extract from the top of `Game.tsx`:
- All physics constants (`BASE_SPEED`, `BOOST_MULTIPLIER`, `ROTATION_SPEED`, etc.)
- All visual tuning constants (streak, glow, FOV, explosion, HIT_FLASH, etc.)
- All color/environment constants (`WATER_COLOR`, `SKY_COLOR`, `FOG_COLOR`, `ACCENT_COLOR`)
- All range/timing constants (`RADAR_RANGE`, `MIN_MARKER_SPACING`, etc.)

- [x] Create `src/config/constants.ts` with all constants
- [x] Update `Game.tsx` to import from `src/config/constants.ts`
- [x] Confirm build and lint still pass

### Step 1.4 — Extract HUD components

Target directory: `src/components/hud/`

Components to extract from `Game.tsx`:
- [x] `src/components/hud/Compass.tsx` (currently `function Compass` at ~line 105)
- [x] `src/components/hud/Radar.tsx` (currently `function Radar` at ~line 152)
- [x] `src/components/hud/Crosshair.tsx` (aim reticle and SVG aim line markup)
- [x] `src/components/hud/Vitals.tsx` (shields, energy, health bars)
- [x] `src/components/hud/Objectives.tsx` (objective panel + message strip)
- [x] `src/components/hud/SpeedDisplay.tsx` (speedometer + boost indicator)
- [x] `src/components/hud/TargetMarkers.tsx` (off-screen and on-screen target/extraction markers)
- [x] `src/components/hud/index.ts` (barrel export)

For each component:
- Extract with its props interface
- Replace inline JSX in `Game.tsx` with the new import
- Verify build passes after each extraction before moving on

### Step 1.5 — Extract full-screen overlays

Target directory: `src/components/overlays/`

- [x] `src/components/overlays/MissionComplete.tsx` (current success overlay + stats grid + Return to Hangar button)
- [x] `src/components/overlays/GameOver.tsx` (current game over overlay + stats + Retry button)
- [x] `src/components/overlays/OutOfBoundsWarning.tsx` (current warning banner)
- [x] `src/components/overlays/index.ts` (barrel export)
- [x] Confirm build still passes

### Step 1.6 — Introduce app-level GamePhase state

Target file: `src/App.tsx`

- [x] Add `GamePhase` state to `App.tsx` (starts at `IN_MISSION` for now — no menu yet)
- [x] Pass phase down to `Game.tsx` as a prop so it can gate overlays and game flow on phase
- [x] `Game.tsx` reads phase and calls back to set phase on mission complete, game over, etc.
- [x] Confirm the current mission runs correctly through this wiring
- [x] Confirm build and lint still pass

### Step 1.7 — Extract game loop systems (optional for this phase, required before Phase 3)

These can be deferred to Phase 3 if Phase 1 is already proving large, but should be planned now:

- [ ] `src/systems/flightPhysics.ts` — speed, boost, boundary check, auto-level functions
- [ ] `src/systems/combatSystem.ts` — projectile spawn, collision detection, explosion creation
- [ ] `src/systems/missionSystem.ts` — objective tracking, extraction logic, fail conditions
- [ ] `src/hooks/useGameInput.ts` — unified keyboard + touch + gamepad input handler replacing the ref-based approach

Note: the above systems live inside `useEffect` in the current `animate()` loop. Extracting them requires passing refs as arguments — plan carefully to avoid breaking the frame loop.

Deferral note: Step 1.7 is intentionally deferred to Phase 3. Phase 1 now has the required type, constant, HUD, overlay, and app phase boundaries without moving the frame-loop systems.

### Phase 1 exit criteria

- [x] `Game.tsx` no longer contains inline `Compass`, `Radar`, success/fail overlay, or constant declarations
- [x] At minimum, types, constants, and HUD components live in their own modules
- [x] `App.tsx` owns a `GamePhase` state that can drive the shell in Phase 2
- [x] The existing mission still starts, runs, and ends correctly
- [x] `npm run lint` and `npm run build` both pass
- [x] Docker rebuild and deploy succeed

Completion summary:

- Shipped: Phase 1 architecture boundary for shared types, tuning constants, HUD components, full-screen overlays, and app-level `GamePhase` ownership while preserving the Mission 1 playable slice.
- Changed: `src/App.tsx`, `src/components/Game.tsx`, `src/components/hud/*`, `src/components/overlays/*`, `src/types/game.ts`, `src/config/constants.ts`.
- Verification: VS Code diagnostics reported no errors; `docker run --rm -v "$PWD":/app -v skybreaker-drone-strike-node-modules:/app/node_modules -w /app node:20-alpine sh -lc "npm ci && npm run lint"` passed; `docker compose build` passed and produced `skybreaker-drone-strike:latest`; `docker compose up -d && docker compose ps` started `skybreaker-drone-strike` with status `Up`.
- Notes/Risks: Host shell does not have `npm`, so npm scripts were verified in a Node 20 Docker container. Step 1.7 game-loop system extraction remains deferred to Phase 3 to avoid destabilizing the frame loop during the UI architecture pass.

## Phase 2 - Menu and Flow Shell

Status: Complete

Goal: add the surrounding game shell before adding more content.

- [x] Main menu screen
- [x] Pause menu
- [x] Settings menu shell
- [x] Mission start flow
- [x] Retry mission flow
- [x] Return to menu flow
- [x] Mission complete flow routed through shell state
- [x] Mission failed flow routed through shell state
- [x] Basic local persistence for settings and progression

Settings scope for this phase:

- [x] Audio master volume
- [x] Music volume
- [x] SFX volume
- [x] Graphics quality preset
- [x] Performance-oriented effects toggles
- [x] Controls/invert options
- [x] Keybind and control configuration plan defined

Exit criteria:

- [x] Player can boot into a menu, start the mission, pause, retry, and return to the menu cleanly
- [x] Settings survive a page reload
- [x] Current gameplay feel is unchanged once the mission starts

Completion summary:

- Shipped: App-level shell flow that boots to the hangar menu, routes through briefing into Mission 1, supports pause/resume, retry, return-to-menu, and shell-routed debrief actions without browser reloads.
- Changed: `src/App.tsx`, `src/components/Game.tsx`, `src/components/menus/*`, `src/config/defaults.ts`, `src/types/game.ts`, `DEV-CHECKLIST.md`.
- Verification: VS Code diagnostics for `src` reported no errors; Node 20 Docker `npm run lint` passed; Docker build/deploy passed; browser smoke test through `https://skybreaker.nsystems.live` confirmed main menu render, briefing launch, WebGL mission canvas, pause/settings/return-to-menu flow, retry flow, and settings persistence after reload.
- Notes/Risks: Audio and graphics controls are persisted shell settings only; final audio mixing and graphics preset wiring remain Phase 7 polish tasks. Keybind remapping is planned after input extraction so the current keyboard/touch defaults remain stable during Phase 2.

## Phase 3 - Mission Framework

Status: Complete

Goal: convert the current hardcoded mission into reusable mission structure.

- [x] Define a mission data format
- [x] Separate mission briefings from gameplay scene logic
- [x] Add mission debrief/results screen structure
- [x] Support reusable objective definitions
- [x] Support reusable failure conditions
- [x] Support reusable extraction and completion rules
- [x] Support mission-specific environment parameters
- [x] Support mission-specific enemy wave definitions
- [x] Convert current Mission 1 into the new framework
- [x] Add at least one second mission using the same framework

Mission types to support over time:

- [ ] Destroy priority targets
- [ ] Intercept enemy flights
- [ ] Defend or hold a zone
- [ ] Survive timed assault
- [ ] Escort or protect allied asset
- [ ] Mixed-objective finale missions

Exit criteria:

- [x] At least two missions run through the same mission framework
- [x] Briefing, live objective tracking, fail states, and debrief all work through shared systems
- [x] Mission content can be extended without expanding one giant file again

Completion summary:

- Mission catalog, progress helpers, mission objective formatting, unlock checks, and best-time tracking are now shared systems.
- Mission 1 `Signal Break` and Mission 2 `Iron Veil` run through the same briefing, gameplay, extraction, enemy wave, failure, and result-overlay paths.
- Core flight and combat frame-loop logic remains in `Game.tsx`; deeper loop extraction should stay incremental in later phases.

## Phase 4 - Campaign and Progression

Status: Complete

Goal: connect missions into a structured arcade campaign.

- [x] Campaign map or mission selection screen
- [x] Mission unlock rules
- [x] Campaign progress save data
- [x] Score or rank model
- [x] Mission rewards model
- [x] Difficulty progression plan
- [x] Clear onboarding arc for early missions
- [x] Mid-campaign escalation arc
- [x] Final mission arc and climax structure
- [x] Replay and best-score tracking

Recommended campaign pacing:

- [x] Arc 1 introduces core flight, target destruction, extraction, and one enemy type at a time
- [x] Arc 2 introduces mixed objectives, denser combat, and the first weapon expansion
- [x] Arc 3 combines multiple threats, resource pressure, and finale mission structures

Exit criteria:

- [x] Player can unlock and replay missions through a persistent campaign structure
- [x] Mission rewards and progression survive reloads
- [x] Difficulty rises cleanly without sudden readability collapse

Completion summary:

- Shipped: campaign-aware hangar selection with completion percentage, total best score, rewards earned, best rank, best time, mission difficulty, next-sortie routing, and campaign arc context.
- Changed: `src/types/game.ts`, `src/config/defaults.ts`, `src/config/missions.ts`, `src/config/campaign.ts`, `src/systems/missionSystem.ts`, `src/App.tsx`, `src/components/Game.tsx`, `src/components/menus/MainMenu.tsx`, `src/components/overlays/MissionComplete.tsx`.
- Verification: VS Code diagnostics for `src`, containerized `npm run lint`, Docker production rebuild/deploy, and browser smoke on `https://skybreaker.nsystems.live` all passed.
- Notes/Risks: Phase 4 defines campaign structure and scoring for the current two playable missions plus planned arcs; later content phases still need actual additional missions, weapons, enemy roles, and hands-on flight/combat regression passes.

## Phase 5 - Weapons, Enemies, and Combat Growth

Status: Complete

Goal: deepen combat only after the mission and campaign framework is stable.

Weapons:

- [x] Define weapon slot or loadout structure
- [x] Add one secondary weapon type
- [x] Add upgrade or unlock path for weapons
- [x] Add weapon stats/config data definitions
- [x] Add HUD support for multiple weapons

Enemies:

- [x] Fast interceptor enemy
- [x] Heavy or armored enemy
- [x] Missile or artillery threat
- [x] Shielded or priority target unit
- [x] Boss or mini-boss encounter pattern
- [x] Enemy behavior definitions separated from spawn placement

Combat progression rules:

- [x] Introduce one major new enemy or weapon concept at a time
- [x] Pair new mechanics with a mission that teaches them clearly
- [x] Keep radar and HUD readability intact as enemy density increases

Exit criteria:

- [x] Every new weapon has a clear tactical role
- [x] Every new enemy has a readable silhouette and combat role
- [x] Combat remains readable at campaign mid-point and endgame intensity

Completion summary:

- Shipped: data-driven weapon definitions with primary/secondary slots, an Ion Missile secondary unlocked by the Extraction Protocol reward, configured projectile damage/energy/cooldowns, secondary keyboard/touch controls, and HUD loadout status.
- Shipped: data-driven enemy role definitions for fast interceptor, heavy gunship, missile platform, shielded warden, and mini-boss, with mission wave composition separated from spawn placement.
- Changed: `src/types/game.ts`, `src/config/weapons.ts`, `src/config/enemies.ts`, `src/config/missions.ts`, `src/App.tsx`, `src/components/Game.tsx`, `src/components/hud/Objectives.tsx`, `DEV-CHECKLIST.md`.
- Verification: VS Code diagnostics for `src`, containerized `npm run lint`, Docker production build/deploy, and browser smoke on `https://skybreaker.nsystems.live` all passed.
- Notes/Risks: Current playable missions introduce the first three enemy roles directly; shielded and mini-boss roles are config-ready for later mission content so future phases can add them without changing spawn logic.

## Phase 6 - Level and Environment Variety

Status: Complete

Goal: create mission variety without losing navigation clarity.

- [x] Define environment parameter system
- [x] Add visual variants for sky, fog, water, and lighting
- [x] Add landmark or obstacle variation by mission
- [x] Add terrain or arena identity differences
- [x] Add hazard zones or navigation pressure in later missions
- [x] Validate objective marker readability in all environment variants
- [x] Validate radar readability in all environment variants

Exit criteria:

- [x] Missions feel visually distinct without harming pursuit camera clarity
- [x] Navigation, objectives, and combat remain readable in all supported environments

Completion summary:

- Shipped: typed mission environment presets for sky, fog, surface color, grid color, structure color, lighting, landmark style/counts, plateau density, boundary radius, and hazard zones.
- Shipped: Signal Break keeps the original dark grid identity while Iron Veil now uses an Ash Ridge environment with warmer lighting, ridge-style landmarks, denser plateaus, and system-draining ash static hazard zones.
- Changed: `src/types/game.ts`, `src/config/environments.ts`, `src/config/missions.ts`, `src/components/Game.tsx`, `DEV-CHECKLIST.md`.
- Verification: VS Code diagnostics for `src`, containerized `npm run lint`, Docker production build/deploy, and browser smoke on both playable missions at `https://skybreaker.nsystems.live` all passed.
- Notes/Risks: Hazard zones are visually present and apply shield/energy drain when entered; future mission content can tune placement and hazard density without changing scene setup logic.

## Phase 7 - Audio, Polish, and Production Readiness

Status: Complete

Goal: finish the game loop with presentation and release safety.

- [x] Core SFX pass
- [x] Music pass
- [x] Mix settings connected to settings menu
- [x] Performance profiling pass
- [x] Graphics settings fully wired
- [x] Save/progression edge-case validation
- [x] UX pass on menus, briefings, debriefs, retries, and failures
- [x] Accessibility and readability pass
- [x] Final regression checklist
- [x] Release candidate checklist

Exit criteria:

- [x] Audio, menus, progression, and gameplay all work as one complete loop
- [x] Performance is acceptable on target hardware
- [x] No critical regressions remain in the original flight and mission experience

Completion summary:

- Shipped: procedural Web Audio music/SFX layer with Master/Music/SFX mix settings, UI/combat/success/failure cues, and browser-safe first-input audio unlock behavior.
- Shipped: graphics quality presets now affect renderer pixel ratio, antialiasing, fog distance, effect density, landmark/plateau density, and reduced hazard visuals; HUD includes a live quality/FPS readout.
- Shipped: persisted settings/progress validation, accessible menu pressed states and labeled sliders, live objective-message announcements, and briefing environment/hazard context.
- Changed: `src/hooks/useAudio.ts`, `src/App.tsx`, `src/components/Game.tsx`, `src/components/menus/*`, `src/components/hud/Objectives.tsx`, `src/types/game.ts`, `DEV-CHECKLIST.md`.
- Verification: VS Code diagnostics, containerized `npm run lint`, Docker production build/deploy, and live browser release smoke at `https://skybreaker.nsystems.live` all passed.
- Notes/Risks: Audio is procedural and intentionally lightweight for production safety; the existing Vite large chunk warning remains a non-blocking future optimization.

## Post-Phase Mobile Responsiveness Pass

Status: Complete

Goal: make the full game shell usable on phone-sized touch viewports, from menus and briefings through overlays, HUD, and in-mission controls.

- [x] Main menu and mission selection scale to mobile width without horizontal scrolling
- [x] Settings controls remain readable and tappable on mobile
- [x] Briefing/loading flow scrolls cleanly and preserves mission context on mobile
- [x] Mission complete and game over overlays fit mobile screens with safe-area padding
- [x] In-mission HUD uses compact mobile placement for status, compass, radar, vitals, objectives, speed, and markers
- [x] Touch controls remain visible, tappable, and separated from bottom HUD content
- [x] Safe-area padding is applied to top and bottom HUD surfaces
- [x] Real 390px mobile viewport smoke passes on deployed production build
- [x] Real mobile landscape viewport smoke passes on deployed production build
- [x] Favicon is present and served from the production build

Completion summary:

- Shipped: responsive menu shell, compact menu controls, mobile briefing and overlay layouts, compact HUD widgets, mobile-scaled radar/compass placement, safe-area HUD padding, orientation-aware touch controls, and a game favicon.
- Changed: `index.html`, `public/favicon.svg`, `src/components/Game.tsx`, `src/index.css`, `src/components/menus/*`, `src/components/overlays/*`, `src/components/hud/Compass.tsx`, `src/components/hud/Objectives.tsx`, `src/components/hud/SpeedDisplay.tsx`, `src/components/hud/Vitals.tsx`, `DEV-CHECKLIST.md`.
- Verification: VS Code diagnostics, containerized `npm run lint`, Docker production build/deploy, and real 390x844 portrait plus 844x390 landscape Playwright mobile smoke at `https://skybreaker.nsystems.live` all passed.
- Notes/Risks: Compass tape segments intentionally extend inside a clipped mask; document scroll width remains equal to viewport width, so this is not page-level horizontal overflow.

## Testing Checklist

Build and toolchain:

- [x] `npm run lint`
- [x] `npm run build`
- [x] Docker rebuild succeeds
- [x] Docker deploy succeeds

Gameplay regression:

- [x] Drone flight remains responsive
- [x] Chase camera remains readable
- [x] HUD remains legible in combat
- [x] Radar heading and blips remain readable
- [x] Target destruction counts remain correct
- [x] Extraction completes reliably
- [x] Mission success and failure flows still trigger correctly

Menu and progression:

- [x] Main menu navigation works
- [x] Pause and resume work
- [x] Retry mission works
- [x] Return to menu works
- [x] Settings persist across reloads
- [x] Campaign unlocks persist across reloads
- [x] Mission select respects unlock state

Mobile responsiveness:

- [x] Main menu has no horizontal overflow at 390px width
- [x] Settings screen has no horizontal overflow at 390px width
- [x] Briefing screen has no horizontal overflow at 390px width
- [x] Mission canvas fills the 390x844 mobile viewport
- [x] Touch controls render in mission at 390px width
- [x] Objective, HUD, FPS readout, and radar remain visible at 390px width
- [x] Landscape mission canvas fills an 844x390 mobile viewport
- [x] Landscape touch controls render on coarse-pointer devices above the tablet CSS breakpoint
- [x] Favicon SVG is served successfully in production

## Verification Log

- 2026-05-09: TV-1 cinematic arena foundation `docker run --rm -v "$PWD":/app -v skybreaker-drone-strike-node-modules:/app/node_modules -w /app node:20-alpine sh -lc "npm run lint"` - passed; TypeScript `tsc --noEmit` completed with zero errors in the container.
- 2026-05-09: TV-1 cinematic arena foundation `docker compose build --progress=plain && docker compose up -d && docker compose ps` - passed; Vite production build completed with the existing large chunk warning, image `skybreaker-drone-strike:latest` rebuilt, and container `skybreaker-drone-strike` reported `Up`.
- 2026-05-09: TV-1 deployed URL smoke `curl -I -L --max-time 20 https://skybreaker.nsystems.live` - returned HTTP 200 after deploy; hands-on visual browser review remains recommended because no browser page is shared in this session.
- 2026-05-09: Tactical visual foundation `docker run --rm -v "$PWD":/app -v skybreaker-drone-strike-node-modules:/app/node_modules -w /app node:20-alpine sh -lc "npm run lint"` - passed; TypeScript `tsc --noEmit` completed with zero errors in the container.
- 2026-05-09: Tactical visual foundation `docker compose build --progress=plain && docker compose up -d && docker compose ps` - passed; Vite production build completed with the existing large chunk warning, image `skybreaker-drone-strike:latest` rebuilt, and container `skybreaker-drone-strike` reported `Up`.
- 2026-05-10: TV-4 world-space waypoint illustrations `docker run --rm -v "$PWD":/app -v skybreaker-drone-strike-node-modules:/app/node_modules -w /app node:20-alpine sh -lc "npm run lint"` - passed; TypeScript `tsc --noEmit` completed with zero errors in the container.
- 2026-05-10: TV-4 world-space waypoint illustrations `docker compose build --progress=plain && docker compose up -d && docker compose ps` - passed; Vite production build completed with the existing large chunk warning, image `skybreaker-drone-strike:latest` rebuilt, and container `skybreaker-drone-strike` reported `Up`.
- 2026-05-10: TV-4 deployed URL smoke `curl -I -L --max-time 20 https://skybreaker.nsystems.live` - returned HTTP 200 after deploy.
- 2026-05-10: TV-5 facility weak-point targets `docker run --rm -v "$PWD":/app -v skybreaker-drone-strike-node-modules:/app/node_modules -w /app node:20-alpine sh -lc "npm run lint"` - passed; TypeScript `tsc --noEmit` completed with zero errors in the container.
- 2026-05-10: TV-5 facility weak-point targets `docker compose build --progress=plain && docker compose up -d && docker compose ps` - passed; Vite production build completed with the existing large chunk warning, image `skybreaker-drone-strike:latest` rebuilt, and container `skybreaker-drone-strike` reported `Up`.
- 2026-05-10: TV-5 deployed URL smoke `curl -I -L --max-time 20 https://skybreaker.nsystems.live` - returned HTTP 200 after deploy.

- 2026-05-09: VS Code diagnostics for `src` - no errors found after HUD, overlay, and phase-state extraction.
- 2026-05-09: `docker run --rm -v "$PWD":/app -v skybreaker-drone-strike-node-modules:/app/node_modules -w /app node:20-alpine sh -lc "npm ci && npm run lint"` - passed; TypeScript `tsc --noEmit` completed with zero errors.
- 2026-05-09: `npm run lint` on host shell - blocked because `npm` is not installed on the host PATH; verified through the Node 20 Docker container instead.
- 2026-05-09: `docker compose build` - passed; Vite production build completed inside the Docker builder, with only the existing large chunk warning.
- 2026-05-09: `docker compose up -d && docker compose ps` - passed; `skybreaker-drone-strike` container started and reported `Up`.
- 2026-05-09: Final post-Compass check: `docker run --rm -v "$PWD":/app -v skybreaker-drone-strike-node-modules:/app/node_modules -w /app node:20-alpine sh -lc "npm run lint"` passed; `docker compose build && docker compose up -d && docker compose ps` passed; container reported `Up`.
- 2026-05-09: Phase 2 diagnostics for `src` - no errors found after menu shell, persistence, and game callback wiring.
- 2026-05-09: Phase 2 `docker run --rm -v "$PWD":/app -v skybreaker-drone-strike-node-modules:/app/node_modules -w /app node:20-alpine sh -lc "npm run lint"` - passed after correcting menu button prop typing.
- 2026-05-09: Phase 2 `docker compose build && docker compose up -d && docker compose ps` - passed; Vite production build completed with the existing large chunk warning, image `skybreaker-drone-strike:latest` rebuilt, and container `skybreaker-drone-strike` reported `Up`.
- 2026-05-09: Phase 2 browser smoke via `https://skybreaker.nsystems.live` - main menu rendered; briefing launched Mission 1; WebGL2 canvas and HUD rendered; pause/settings/return-to-menu and retry flows worked; master volume persisted across reload through `localStorage`.
- 2026-05-09: Phase 3 diagnostics for `src` - no errors found after mission catalog, mission helper, menu, briefing, Game, and overlay wiring.
- 2026-05-09: Phase 3 `docker run --rm -v "$PWD":/app -v skybreaker-drone-strike-node-modules:/app/node_modules -w /app node:20-alpine sh -lc "npm run lint"` - passed; TypeScript `tsc --noEmit` completed with zero errors.
- 2026-05-09: Phase 3 `docker compose build && docker compose up -d && docker compose ps` - passed; image `skybreaker-drone-strike:latest` rebuilt and container `skybreaker-drone-strike` reported `Up`.
- 2026-05-09: Phase 3 browser smoke via `https://skybreaker.nsystems.live` - menu listed Mission 01 and Mission 02; persisted progress unlocked Mission 2; Iron Veil briefing rendered with 4 spires; Mission 2 launched a WebGL canvas with objective `DESTROY RELAY SPIRES: 0 / 4`; returning to Mission 1 restored the Signal Break briefing.
- 2026-05-09: Phase 4 diagnostics for `src` - no errors found after campaign scoring, rewards, arc config, result overlay, and hangar progression UI changes.
- 2026-05-09: Phase 4 `docker run --rm -v "$PWD":/app -v skybreaker-drone-strike-node-modules:/app/node_modules -w /app node:20-alpine sh -lc "npm run lint"` - passed; TypeScript `tsc --noEmit` completed with zero errors.
- 2026-05-09: Phase 4 `docker compose build && docker compose up -d && docker compose ps` - passed; Vite production build completed with the existing large chunk warning, image `skybreaker-drone-strike:latest` rebuilt, and container `skybreaker-drone-strike` reported `Up`.
- 2026-05-09: Phase 4 browser smoke via `https://skybreaker.nsystems.live` - old progress save loaded without crashing; campaign completion, best score, best rank, rewards, mission unlock state, and Mission 2 selection rendered from persisted progress; Iron Veil briefing launched with 4 spires and East Ridge extraction.
- 2026-05-09: Phase 5 diagnostics for `src` - no errors found after weapon loadout, enemy role, projectile damage, shield handling, and HUD changes.
- 2026-05-09: Phase 5 `docker run --rm -v "$PWD":/app -v skybreaker-drone-strike-node-modules:/app/node_modules -w /app node:20-alpine sh -lc "npm run lint"` - passed; TypeScript `tsc --noEmit` completed with zero errors.
- 2026-05-09: Phase 5 Docker production build/deploy - Vite production build completed with the existing large chunk warning, image `skybreaker-drone-strike:latest` rebuilt, and `docker compose up -d && docker compose ps` reported `skybreaker-drone-strike` as `Up`.
- 2026-05-09: Phase 5 browser smoke via `https://skybreaker.nsystems.live` - campaign reward text showed Ion Missile unlock; Iron Veil briefing launched; WebGL canvas rendered at 1008x897; in-mission HUD showed Pulse Cannon and Ion Missile; pressing `F` fired the secondary and displayed `ION MISSILE AWAY`.
- 2026-05-09: Phase 6 diagnostics for `src` - no errors found after environment preset, scene variant, and hazard-zone wiring.
- 2026-05-09: Phase 6 `docker run --rm -v "$PWD":/app -v skybreaker-drone-strike-node-modules:/app/node_modules -w /app node:20-alpine sh -lc "npm run lint"` - passed; TypeScript `tsc --noEmit` completed with zero errors.
- 2026-05-09: Phase 6 `docker compose build --progress=plain` - passed; Vite production build completed with the existing large chunk warning and image `skybreaker-drone-strike:latest` rebuilt.
- 2026-05-09: Phase 6 `docker compose up -d && docker compose ps` - passed; container `skybreaker-drone-strike` reported `Up`.
- 2026-05-09: Phase 6 browser smoke via `https://skybreaker.nsystems.live` - Iron Veil launched with WebGL canvas 1008x897, objective `DESTROY RELAY SPIRES: 0 / 4`, readable radar headings, and visible Pulse Cannon/Ion Missile HUD; Signal Break launched with WebGL canvas 1008x897, objective `DESTROY RADAR TOWERS: 0 / 3`, readable radar headings, and target markers.
- 2026-05-09: Phase 7 diagnostics for `src` - no errors found after audio, graphics settings, saved-state validation, and menu/HUD accessibility changes.
- 2026-05-09: Phase 7 `docker run --rm -v "$PWD":/app -v skybreaker-drone-strike-node-modules:/app/node_modules -w /app node:20-alpine sh -lc "npm run lint"` - passed after repairing the scene setup patch; TypeScript `tsc --noEmit` completed with zero errors.
- 2026-05-09: Phase 7 `docker compose build --progress=plain` - passed; Vite production build completed with the existing large chunk warning and image `skybreaker-drone-strike:latest` rebuilt.
- 2026-05-09: Phase 7 `docker compose up -d && docker compose ps` - passed; container `skybreaker-drone-strike` reported `Up`.
- 2026-05-09: Phase 7 browser release smoke via `https://skybreaker.nsystems.live` - intentionally corrupted localStorage settings/progress were sanitized; LOW graphics and reduced effects persisted; Iron Veil briefing showed Ash Ridge and Ash Static context; mission launched with WebGL canvas 1008x897, `LOW // 54 FPS`, objective `DESTROY RELAY SPIRES: 0 / 4`, readable radar headings, and available Web Audio context after user gesture. Smoke storage was restored to the normal sample campaign progress afterward.
- 2026-05-09: Mobile responsiveness diagnostics for `src` - no errors found after menu, overlay, HUD, and touch-control responsive layout changes.
- 2026-05-09: Mobile responsiveness `docker run --rm -v "$PWD":/app -v skybreaker-drone-strike-node-modules:/app/node_modules -w /app node:20-alpine sh -lc "npm run lint"` - passed; TypeScript `tsc --noEmit` completed with zero errors.
- 2026-05-09: Mobile responsiveness `docker compose build --progress=plain && docker compose up -d && docker compose ps` - passed; Vite production build completed with the existing large chunk warning, image `skybreaker-drone-strike:latest` rebuilt, and container `skybreaker-drone-strike` reported `Up`.
- 2026-05-09: Mobile responsiveness real-device-width smoke via Playwright Docker at `https://skybreaker.nsystems.live` - 390x844 touch viewport confirmed; main menu, settings, and briefing each had `scrollWidth` 390 and no visible page overflow; Iron Veil launched with canvas 390x844, objective HUD, FPS/quality HUD, and FIRE/BOOST/SEC/LEVEL/VIEW touch controls visible; no page errors were reported.
- 2026-05-09: Mobile orientation and favicon smoke via Playwright Docker at `https://skybreaker.nsystems.live` - 390x844 portrait and 844x390 landscape touch viewports confirmed; main menu, settings, and briefing had no horizontal page overflow in both orientations; Iron Veil launched with matching canvas dimensions, objective HUD, FPS/quality HUD, and visible FIRE/BOOST/SEC/LEVEL/VIEW touch controls in both orientations; `/favicon.svg` returned status 200 with `image/svg+xml`; no page errors were reported.

## Post-Phase Campaign Continuity and Missile Lock Pass

Status: Complete

Goal: remove the campaign dead-end after Mission 2 and make the secondary weapon behave like an anti-air tracking missile with a lock requirement.

- [x] Extend the playable campaign from 2 missions to 8 chained missions
- [x] Unlock Mission 3 after clearing Mission 2
- [x] Migrate existing saves so already-cleared missions grant newly available next-mission unlocks
- [x] Migrate completed mission rewards so existing saves regain missing secondary-weapon unlocks
- [x] Convert Ion Missile into a lock-on anti-air seeker
- [x] Require an airborne target lock before Ion Missile launch
- [x] Display missile lock status in the in-mission HUD
- [x] Verify progression and missile lock behavior against the deployed production build

Completion summary:

- Shipped: Missions 03-08, active Arc 2/Arc 3 campaign ranges, existing-save unlock/reward migration, Ion Missile lock acquisition, missile tracking guidance, lock-required firing behavior, and HUD lock status.
- Changed: `src/config/missions.ts`, `src/config/campaign.ts`, `src/config/weapons.ts`, `src/types/game.ts`, `src/App.tsx`, `src/components/Game.tsx`, `src/components/hud/Objectives.tsx`, `DEV-CHECKLIST.md`.
- Verification: VS Code diagnostics, containerized `npm run lint`, Docker production build/deploy, and live Playwright smoke at `https://skybreaker.nsystems.live` all passed.
- Notes/Risks: The current mission framework still uses destroy-target sorties with escalating enemy compositions; later content can add new objective types without blocking campaign continuity.

## Campaign Continuity Verification Log

- 2026-05-09: Campaign continuity and missile smoke via Playwright Docker at `https://skybreaker.nsystems.live` - simulated an existing save with Missions 1-2 completed, only Missions 1-2 unlocked, and no earned rewards; loader migrated Mission 3 to READY, preserved Mission 1/2 cleared state, displayed Missions 01-08, launched Mission 3 `BLACK SKY HOOK`, showed objective `DESTROY UPLINK MASTS: 0 / 5`, restored Ion Missile availability from completed Mission 1, and confirmed the missile reports a no-air-target lock state instead of launching without a lock; no page errors were reported.

## Post-Phase Targeting HUD Refinement: Direction B

Status: Complete

Goal: replace the visually ambiguous multi-element targeting HUD with a unified tactical projected weapon path system.

- [x] Identify all targeting elements in `Crosshair.tsx` and confirm shot-direction alignment with `Game.tsx` projectile velocity
- [x] Remove the SVG secondary orange pipper (`<circle>` at `aimScreenPos`) — the primary source of aim ambiguity
- [x] Remove the inner aim box (`inset-[40%]`) — redundant with the cardinal ticks and center dot
- [x] Remove both outer corner bracket divs — no distinct gameplay function
- [x] Refine the SVG weapon path line: 4-stop gradient (0% → 25% → 75% → 100%) that fades from the drone origin and sharpens toward the reticle; wider dash spacing for a clean tactical look; brightens when firing
- [x] Repurpose the center recoil dot as a persistent, subtle aim indicator (opacity 0.25 idle → 0.9 + glow on recoil/firing)
- [x] Add tuning constants to `src/config/constants.ts`: `AIM_PATH_OPACITY_IDLE`, `AIM_PATH_OPACITY_FIRING`, `AIM_PATH_WIDTH`, `AIM_PATH_DASH`, `AIM_PATH_FADE_MS`, `RETICLE_PULSE_MS`, `CENTER_MARKER_SIZE`
- [x] Import and wire constants in `Crosshair.tsx`
- [x] Confirm no changes to camera, flight controls, objective markers, radar, mission panel, or speed HUD

Completion summary:

- Shipped: Unified tactical projected weapon path — single clear reticle ring with cardinal ticks, persistent center aim dot, gradient segmented path from drone nose to aim point (brightens on fire), no floating secondary pipper, no redundant brackets. Shot direction unchanged; projectile velocity and `aimScreenPos` both use the same drone quaternion so visual aim matches actual bullets.
- Changed: `src/components/hud/Crosshair.tsx`, `src/config/constants.ts`.
- Verification: VS Code diagnostics (no errors), containerized `npm run lint` (exit 0), Docker production build/deploy (935.69 kB JS, container up), orientation smoke (portrait + landscape both pass with canvas, HUD, and objective confirmed).
- Notes/Risks: The `aimProjectionRef` 3D ring mesh on the drone (activates only while firing) was intentionally preserved — it is a world-space depth cue, not a HUD confusion source.

## Post-Phase Tactical Visual Evolution Foundation

Status: Complete

Goal: begin the visual evolution safely by locking the target direction and extracting scene visual builders before introducing new cinematic rendering, reflective floors, facility targets, or weak-point gameplay.

- [x] Create a visual target lock for the tactical arena direction
- [x] Extract renderer/scene visual construction from `Game.tsx` without changing gameplay behavior
- [x] Extract environment, drone, objective, extraction, enemy, and projection helpers into focused modules
- [x] Preserve flight controls, camera behavior, mission state, extraction tracking, target counting, radar, and HUD marker behavior
- [x] Verify the extraction pass with the containerized TypeScript check and production Docker build path

Exit criteria:

- [x] `Game.tsx` remains the gameplay/frame-loop orchestrator, but no longer owns every visual builder inline
- [x] No new visual polish is mixed into the extraction pass beyond modular parity
- [x] Current missions still launch, targets can be destroyed, extraction activates, radar remains readable, and the HUD markers remain stable

Completion summary:

- Shipped: Visual target lock plus extraction-only scene builder modules for renderer/camera/streaks, mission environment/lighting, drone model, objective/extraction models, enemy visuals, shared combat resources, and screen-space targeting projection.
- Changed: `docs/VISUAL_TARGET_LOCK.md`, `src/components/Game.tsx`, `src/scene/*`, `src/systems/targetingProjection.ts`, `DEV-CHECKLIST.md`.
- Verification: Containerized `npm run lint` passed; `docker compose build --progress=plain && docker compose up -d && docker compose ps` passed and reported `skybreaker-drone-strike` as `Up`.
- Notes/Risks: The workspace is not a Git repository, so the recommended implementation branch could not be created here. Cinematic lighting, reflective floor changes, facility kits, weak points, and level-kit config are intentionally deferred to later phases.

## Tactical Visual Evolution Roadmap

Status: Planned

Goal: evolve Skybreaker Drone Strike from a functional prototype into a polished tactical arcade combat experience through staged, reversible phases. This roadmap is the source of truth for future visual and structural work.

### Concept reference artifacts

Future tactical visual work must actively reference these project-root artifacts before implementation:

- `upgrade-plan-concept.md` - original written visual evolution concept and phase direction
- `upgrade-plan-concept-reference.png` - visual target reference image for mood, arena composition, lighting, floor/grid feel, industrial silhouettes, reticle language, and waypoint/extraction clarity

If either concept artifact changes, update this roadmap and `docs/VISUAL_TARGET_LOCK.md` before implementing the next visual phase.

### Visual target

- Cinematic dark tactical arena
- Reflective/wet dark floor with readable tactical grid
- Atmospheric horizon fog and sky depth
- Stronger low-poly industrial structures
- Tactical reticle with projected weapon path
- Clearer world-space waypoint and extraction illustrations
- Facility assault targets with destructible building key points
- Better lighting, emissive accents, and structure beacons
- Polished drone visuals and thruster glow
- Scalable level configuration for campaign missions

### Current architecture findings

- Renderer setup: `Game.tsx` now calls extracted renderer/camera/streak builders in `src/scene/renderer.ts`; there is still no post-processing pipeline.
- Scene setup: `Game.tsx` remains the runtime orchestrator for refs, frame loop, flight, combat, mission state, and HUD data.
- Lighting/fog/background: `src/scene/environment.ts` builds the current ambient light, directional light, background color, and mission fog from `src/config/environments.ts`.
- Ground/grid: `src/scene/environment.ts` builds the current matte floor plane and low-opacity `GridHelper`; reflective/wet treatment is still pending.
- Drone mesh/materials: `src/scene/droneModel.ts` builds the current procedural drone and returns named handles for aim projection, muzzle flash, engine glows, and thruster lights.
- Reticle and aim guide: `src/components/hud/Crosshair.tsx` owns the screen-space reticle and SVG weapon path; `Game.tsx` still computes aim/drone screen points.
- Waypoint/objective markers: `src/components/hud/TargetMarkers.tsx` renders marker UI; `src/systems/targetingProjection.ts` owns projection math that was extracted from `Game.tsx`.
- Radar: `src/components/hud/Radar.tsx` preserves accumulated heading, blip clamping, target/enemy/extraction categories, and extraction conditional rendering.
- Tower/objective entities: `src/scene/objectiveModels.ts` builds the current target tower and extraction zone meshes, but targets are not yet facility/weak-point driven.
- Projectile/hit/damage logic: `Game.tsx` still owns projectile spawn, tracking, collision, shield/health damage, spark/explosion feedback, and target destruction counting.
- Mission state logic: `src/systems/missionSystem.ts` owns campaign/result helpers; in-mission target destruction, enemy wave spawn, extraction activation, and completion guards remain in `Game.tsx`.
- Level/world generation: mission/environment data exists, but arena kits, structure kits, waypoint styles, and target archetypes are not yet data-driven.

### Systems to preserve exactly

- Flight controls: W/S pitch, A/D yaw, Q/E roll, Shift boost, Space primary, F secondary, R auto-level, C camera toggle, pointer drag, touch joystick/actions, and invert-Y.
- Chase/cockpit camera readability, camera lerp, boost FOV, camera shake, and drone silhouette framing.
- Mission runtime refs: `gameLogicRef`, `currentSystems`, `targetsRef`, `enemiesRef`, `projectilesRef`, and `extractionMeshRef` until a later dedicated frame-loop extraction.
- Objective/extraction state: target destroyed recount from source of truth, extraction activation only after all targets, XZ-only extraction radius, and exactly-once mission completion guard.
- Radar accumulated heading behavior, radar range, blip categories, clamping, and extraction visibility rules.
- Target/extraction marker projection, hysteresis, smoothing, safe margins, overlap avoidance, and click-to-lock behavior.
- Weapon energy costs/cooldowns, missile lock requirement/tracking, shield-before-health damage, projectile collision guard, and no double-count target destruction.
- HUD density and orange/teal/black tactical identity.

### Systems to refactor over time

- Scene setup and renderer/camera lifecycle into small helpers without moving gameplay behavior prematurely.
- Ground/grid/floor construction into a tactical arena builder with richer material and grid configuration.
- Landmark, plateau, hazard, structure, target, extraction, drone, enemy, and effect visuals into reusable procedural builders.
- Target projection and marker layout into pure helpers that keep the same output shape.
- Mission target config from flat `position + health` into backward-compatible archetypes with optional weak points.
- Visual tuning from scattered literals into typed environment, arena, level-kit, and facility-kit configuration.

### Systems to create

- Tactical arena material system for wet dark floor, readable grid hierarchy, fog/horizon depth, and lighting presets.
- Industrial facility kit system for low-poly structures, beacons, emissive accents, target installations, and set-piece density.
- Objective weak-point model with local offsets, health, visual state, damage routing, and final target destruction aggregation.
- World-space waypoint/extraction illustration system separate from HUD marker projection.
- Drone visual handle system for material/thruster updates without child-index or generic child-type queries.
- Level kit config for campaign scalability across arena style, facility composition, waypoint style, target archetype, beacon palette, and ambient lighting.

### Phase TV-1 - Cinematic Arena Foundation

Status: Complete

Goal: make the existing arena read as a deeper dark tactical combat space without adding facility gameplay or changing controls.

- [x] Extend environment config with sky depth, horizon color, fog profile, floor material profile, grid profile, and beacon palette fields
- [x] Add a sky/horizon visual layer or gradient dome that preserves a dark navy/black tactical mood
- [x] Tune fog for atmospheric horizon depth while keeping target markers and radar readable
- [x] Keep current mission behavior and target/extraction state unchanged

Acceptance criteria:

- [x] Arena has a darker sky-depth and horizon-haze foundation without becoming pure black
- [x] Distant structures use the new fog profile and horizon layer for deeper atmospheric fade
- [ ] HUD, radar, target markers, and extraction marker remain legible in Signal Break and Iron Veil during hands-on browser review
- [x] Containerized `npm run lint` and Docker production build/deploy pass

Completion summary:

- Shipped: TV-1 cinematic arena foundation with typed environment visual profiles, ACES/sRGB renderer settings, camera-following sky dome, low horizon haze bands, mission-specific fog profiles, and configurable floor/grid/beacon palette handles for later phases.
- Changed: `src/types/game.ts`, `src/config/environments.ts`, `src/scene/renderer.ts`, `src/scene/environment.ts`, `src/components/Game.tsx`, `DEV-CHECKLIST.md`.
- Verification: Containerized `npm run lint` passed; `docker compose build --progress=plain && docker compose up -d && docker compose ps` passed; `https://skybreaker.nsystems.live` responded HTTP 200 after deploy.
- Notes/Risks: No browser page is shared in this session, so a hands-on visual pass should still confirm HUD/radar/marker readability in Signal Break and Iron Veil before beginning TV-2.

### Phase TV-2 - Reflective Tactical Floor and Grid

Status: Complete

Goal: create a wet, dark tactical floor with a readable grid, starting with low-risk material and line work before considering expensive reflections.

- [x] Add floor material tuning for dark graphite, lower roughness, subtle metalness, and controlled specular response
- [x] Add readable major/minor grid hierarchy, center lanes, and scale cues
- [x] Add optional fake ground highlights under bright beacons or thrusters without using a real mirror first
- [x] Gate density and glow by graphics quality and reduced-effects settings

Acceptance criteria:

- [x] Floor feels polished and slightly wet without becoming a bright mirror
- [x] Grid remains readable at speed and does not compete with HUD text
- [x] Drone thruster and facility light reflections are subtle
- [x] LOW/reduced-effects profile remains usable on mobile-sized viewports
- [x] Containerized `npm run lint` and Docker production build/deploy pass

Completion summary:

- Shipped: TV-2 reflective tactical floor and major/minor grid hierarchy. Floor material updated to `roughness: 0.38–0.40, metalness: 0.42–0.44` (dark graphite, slightly wet). Replaced single `GridHelper` with a two-layer hierarchy — fine minor grid (300 divisions, ~0.036–0.038 opacity) and coarser major grid (60 divisions, ~0.108–0.116 opacity, offset 0.08 units to avoid z-fighting). Added additive beacon glow splats (CircleGeometry, opacity 0.04) under each landmark structure, gated by `!reduceEffects && effectScale > 0.5`. Extended `MissionGridProfileDefinition` type with `majorDivisions?`, `majorOpacity?`, `minorOpacity?`. Both `SIGNAL_BREAK_ENVIRONMENT` and `IRON_VEIL_ENVIRONMENT` updated with new floor and grid values.
- Changed: `src/types/game.ts`, `src/config/environments.ts`, `src/scene/environment.ts`.
- Verification: Containerized `npm run lint` passed; `docker compose build && docker compose up -d` passed; container Running.
- Notes/Risks: No real mirror/SSR — the metalness response depends on the scene's IBL/env-map probe, which is not yet set; subtle metalness will show as a desaturated highlight. Full wet-floor look may require an env map in a later phase.

### Phase TV-3 - Industrial Structure and Facility Kit

Status: Complete — `visual/facility-kit` branch

Goal: replace simple decorative silhouettes over time with reusable low-poly industrial structures that support stronger arena identity.

- [x] Create reusable structure archetypes: blocks, gantries, pylons, antenna arrays, beacon masts, perimeter lights, and platform clusters
- [x] Add structure kit config for density, spacing, beacon color, height ranges, and mission style
- [x] Keep structures non-colliding unless a later explicit obstacle/collision phase is created
- [x] Preserve target marker readability and avoid blocking extraction or mission-critical targets

Acceptance criteria:

- [x] Skyline and arena navigation improve without harming chase-camera readability
- [x] Industrial structures feel low-poly and tactical, not decorative clutter
- [x] Radar and objective markers remain readable around structures
- [x] Containerized `npm run lint` and Docker production build/deploy pass

Completion summary:

- Shipped: `src/scene/facilityKit.ts` — new module with eight distinct low-poly archetype builders: `monolith` (stepped multi-section spire with pads, side rail, antenna, and beacon), `compound` (wide stepped industrial block with auxiliary wing, rails, pipe, roof antenna, and beacon), `gantry` (twin-post with pads, cross-braces, emissive crossbar, lamp, and pin), `pylon` (tapered CylinderGeometry post with collars, fins, emissive mid-band, and beacon), `beacon-mast` (thin shaft with base, service box, cross-arms, warning tips, and top beacon), `antenna-array` (platform deck with rails, three masts, cross-arms, beacons, and dish assembly), `perimeter-light` (low rail with three light posts, shield panel, and warning caps), and `platform-cluster` (multi-deck industrial cluster with service blocks, elevated gantry, rails, supports, and twin beacons). Each returns a `THREE.Group` plus a footprint radius for glow splat sizing. Shared materials (`structMat`, `accentMat`, `beaconMat`) created once per call. Two-layer beacon glow splats and directional floor streaks carried forward from TV-2 and keyed per-structure footprint. `createFacilityStructures()` is the public entry, callable with environment + graphicsProfile + settings.
- Added: `StructureArchetype` union type and `StructureKitDefinition` interface to `src/types/game.ts`. Optional `structureKit?` field added to `MissionEnvironmentDefinition`. TV-3 detail pass extended `StructureArchetype` with `antenna-array`, `perimeter-light`, and `platform-cluster`.
- Changed: `src/scene/environment.ts` landmark block replaced with a single call to `createFacilityStructures`. `src/scene/index.ts` barrel extended with `facilityKit`. `src/config/environments.ts` — both environments updated with richer `structureKit` configs: Signal Break uses `['monolith', 'platform-cluster', 'gantry', 'antenna-array', 'beacon-mast', 'perimeter-light']` (minDist 285, maxDist 680, landmarkCount 68); Iron Veil uses `['compound', 'platform-cluster', 'pylon', 'antenna-array', 'beacon-mast', 'perimeter-light']` (minDist 320, maxDist 740, landmarkCount 50).
- Verification: Containerized `npm run lint` passed after the TV-3 detail pass; `docker compose build && docker compose up -d` passed; container `Up`.
- Notes/Risks: Structures have no collision volumes — this is intentional (collision is scoped to a later phase). Landmark placement is radial random only; if a future phase needs clustering or zone-aware placement, the `minDist/maxDist` range on `StructureKitDefinition` can be extended per-archetype. Ridge-style monolith path removed — `landmarkStyle` is now only used as a fallback default when `structureKit` is absent.

### Phase TV-4 - World-Space Waypoint and Extraction Illustrations

Status: Complete — `visual/world-space-waypoints` branch

Goal: make objectives and extraction clearer in the world while preserving the existing screen-space marker and radar systems.

- [x] Add reusable world-space target callouts: ground rings, vertical stems, beacon caps, class icons, and distance-scaled effects
- [x] Upgrade extraction visuals with a clearer landing/exfiltration illustration and approach affordance
- [x] Keep `TargetMarkers.tsx` props and click-to-lock behavior stable
- [x] Keep marker safe-zone and overlap behavior unchanged unless explicitly refactored with tests

Acceptance criteria:

- [x] Player can visually identify target/extraction zones in-world before relying on HUD brackets
- [x] Screen-space marker positions, off-screen arrows, and extraction priority remain unchanged
- [x] No added HUD panel clutter
- [x] Containerized `npm run lint` and Docker production build/deploy pass

Completion summary:

- Shipped: `src/scene/waypointIllustrations.ts` — reusable world-space waypoint illustration module with target and extraction builders plus `updateWaypointIllustration()` animation. Target callouts now include orange ground rings, pulse/approach rings, a vertical stem, rotating beacon cap, diamond class icon, and directional chevrons. Extraction now includes cyan landing/exfiltration rings, cross-lane pad affordance, vertical guide stem, rotating beacon/arrow cap, and approach chevrons.
- Changed: `src/scene/objectiveModels.ts` attaches waypoint handles to target and extraction groups through `userData` while preserving the existing target child order used by hit flash/destruction code. `src/components/Game.tsx` animates named waypoint handles per-frame, hides target callouts on destruction, and rotates the extraction base via `userData.rotatingBase` instead of relying on `children[0]`. `src/scene/index.ts` exports the waypoint module.
- Verification: Containerized `npm run lint` passed; `docker compose build --progress=plain && docker compose up -d && docker compose ps` passed; `curl -I -L --max-time 20 https://skybreaker.nsystems.live` returned HTTP 200.
- Notes/Risks: `TargetMarkers.tsx`, marker projection math, click-to-lock behavior, safe-zone margins, and extraction priority were intentionally unchanged. VS Code diagnostics still show the known local React type-resolution noise; Docker TypeScript remains the phase verifier.

### Phase TV-5 - Facility Assault Targets and Weak Points

Status: Complete — `visual/weakpoint-targets` branch

Goal: evolve isolated towers into structured facility assault targets with destructible key points while preserving mission counting and extraction rules.

- [x] Extend `MissionTargetDefinition` with backward-compatible target archetype and optional weak-point definitions
- [x] Add runtime target handles for weak points, damage meshes, beacon/glow parts, and final destroyed visuals
- [x] Route projectile hits to weak points first where configured, then aggregate final installation destruction
- [x] Preserve `target.destroyed` as the source of truth for mission objective counts
- [x] Preserve exactly-once target destruction and exactly-once extraction completion

Acceptance criteria:

- [x] Weak points take damage and provide clear hit/destruction feedback
- [x] Destroying all required weak points destroys the facility target once
- [x] Target destroyed count cannot double-count simultaneous hits
- [x] Extraction activates only after all mission targets are destroyed
- [x] Existing missions without weak-point config still behave as before
- [x] Containerized `npm run lint` and Docker production build/deploy pass

Completion summary:

- Shipped: Backward-compatible facility target and weak-point model. `MissionTargetDefinition` now supports optional `archetype` plus `weakPoints`; `MissionWeakPointDefinition`, `MissionTargetArchetype`, and runtime `TargetWeakPoint` types were added. Targets without weak-point config still use legacy direct health damage.
- Shipped: Facility target visuals in `src/scene/objectiveModels.ts` now include named `TargetVisualHandles`, expanded target bases/decks/rails/service structures, relay-spire detail variants, weak-point sockets/cores/guard rings, final destroyed mesh lists, and runtime weak-point positions/health/radii.
- Changed: `src/config/missions.ts` adds weak-point layouts to Signal Break radar towers and Iron Veil relay spires. Later campaign targets remain without weak-point config to validate the backward-compatible path. `src/components/Game.tsx` now routes player projectile impacts to active weak points first, blocks core damage while required weak points remain, disables weak-point meshes with localized explosion feedback, aggregates required weak-point health into target health, and destroys the final facility exactly once through `target.destroyed`.
- Verification: Containerized `npm run lint` passed; `docker compose build --progress=plain && docker compose up -d && docker compose ps` passed; `curl -I -L --max-time 20 https://skybreaker.nsystems.live` returned HTTP 200.
- Notes/Risks: Target damage routing still lives inside `Game.tsx` with the rest of projectile collision logic; a later combat-system extraction can move the helper functions once frame-loop refactoring is explicitly in scope. Weak-point collision uses simple spherical radii around configured local offsets; no physical obstacle collision was added.

### Phase TV-6 - Tactical Reticle and Weapon Path Polish

Status: Complete - `visual/reticle-path-polish` branch

Goal: refine shot readability and tactical feedback without returning to a cluttered HUD.

- [x] Refine `Crosshair.tsx` projected weapon path with convergence, firing, and hit-confirm readability
- [x] Evaluate optional world-space path/convergence cues near the drone or target line; keep this pass screen-space to avoid duplicating HUD information
- [x] Integrate missile lock and primary-fire feedback without adding extra panels
- [x] Preserve actual projectile direction and current aim-screen calculation semantics

Acceptance criteria:

- [x] Reticle and projected path clarify shot direction in chase view
- [x] Missile lock and hit-confirm remain readable but restrained
- [x] No new redundant pippers, brackets, or HUD clutter
- [x] Containerized `npm run lint` and Docker production build/deploy pass

Completion summary:

- Shipped: Tactical reticle polish with a restrained secondary lock progress ring, acquired-lock color feedback, and convergence markers along the existing projected weapon path. The path still runs from the drone nose screen point to `aimScreenPos`, preserving shot direction semantics while improving chase-view readability.
- Changed: `src/components/hud/Crosshair.tsx` now renders lock-progress arcs and small path brackets using HUD constants; `src/components/Game.tsx` exposes visual-only secondary lock progress/acquired/target state; `src/types/game.ts` adds the new HUD fields; `src/config/constants.ts` adds reticle tuning constants.
- Verification: Containerized `npm run lint` passed; `docker compose build --progress=plain && docker compose up -d && docker compose ps` passed; `curl -I -L --max-time 20 https://skybreaker.nsystems.live` returned HTTP 200.
- Notes/Risks: No world-space path cues were added because the screen-space reticle now carries the extra feedback without increasing scene clutter. Local VS Code diagnostics still show the known React declaration noise, but Docker TypeScript/build verification is clean.

### Phase TV-7 - Drone Visual Polish

Status: Pending

Goal: improve the player drone silhouette, materials, and thruster glow while preserving chase-camera readability and flight feel.

- [ ] Strengthen drone low-poly tactical silhouette without changing scale or camera framing unexpectedly
- [ ] Add named material handles for body, wings, cockpit, accents, rotors, glows, and damage/firing feedback
- [ ] Improve thruster glow and boost feedback without washing out the body silhouette
- [ ] Avoid changes to flight physics, boost energy drain, speed, or controls

Acceptance criteria:

- [ ] Drone reads clearly in chase view against dark arena and fog
- [ ] Boost and thruster states feel stronger but not overbright
- [ ] Camera readability and aiming remain stable
- [ ] Containerized `npm run lint` and Docker production build/deploy pass

### Phase TV-8 - Scalable Level and Campaign Configuration

Status: Pending

Goal: make future missions choose reusable arena, facility, waypoint, and target archetypes through config instead of hardcoded scene branches.

- [ ] Add `src/config/levelKits.ts` or equivalent for arena kits, facility kits, waypoint styles, floor/grid profiles, and beacon palettes
- [ ] Extend mission/environment types to reference level kits with safe defaults for existing missions
- [ ] Allow new missions to configure structure density, target archetypes, weak-point layouts, and waypoint style declaratively
- [ ] Keep mission unlocks, scoring, reward, enemy wave, extraction, and failure condition contracts stable

Acceptance criteria:

- [ ] A new mission can reuse an existing level kit and facility archetype without adding scene-builder branches
- [ ] Existing missions load with backward-compatible defaults
- [ ] TypeScript catches invalid level-kit references or missing required fields where practical
- [ ] Containerized `npm run lint` and Docker production build/deploy pass

### Phase TV-9 - Regression Hardening and Optional Renderer Enhancements

Status: Pending

Goal: harden the new visual architecture, then only consider heavier renderer features if performance remains stable.

- [ ] Add smoke-test notes or scripts for visual regression points across desktop and mobile viewports
- [ ] Repeat Mission 1 and Mission 2 smoke checks for controls, radar, markers, target destruction, extraction, success, and failure
- [ ] Evaluate optional renderer settings such as `SRGBColorSpace`, tone mapping, bloom, or real reflections only after simpler polish is stable
- [ ] Keep heavy effects quality-gated and reduced-effects aware

Acceptance criteria:

- [ ] Regression checklist covers flight, mission, radar, markers, extraction, HUD, mobile touch controls, and graphics quality settings
- [ ] Optional renderer changes improve the look without harming FPS or readability
- [ ] Containerized `npm run lint`, Docker production build/deploy, and mobile smoke checks pass

### Cross-phase risk register

- [ ] `Game.tsx` still interleaves gameplay and rendering state; do not extract flight/combat frame-loop behavior during visual phases unless that is the explicit phase goal
- [ ] Target mesh child indices are fragile; weak-point work should replace them with named handles before adding destructible parts
- [ ] Changing collision or target damage can break destroyed counts, enemy waves, extraction activation, or mission completion
- [ ] Reflective floor, bloom, and dense beacons can harm FPS and mobile readability
- [ ] Fog/sky/floor contrast can reduce objective marker visibility
- [ ] World-space markers can clutter the view if they duplicate HUD information too aggressively
- [ ] Local VS Code diagnostics may report missing React declarations from local `node_modules`; use the documented Docker lint/build path as the phase verifier unless dependency cleanup is explicitly in scope

### Cross-phase verification requirements

- [ ] Run containerized TypeScript check: `docker run --rm -v "$PWD":/app -v skybreaker-drone-strike-node-modules:/app/node_modules -w /app node:20-alpine sh -lc "npm run lint"`
- [ ] Run production build/deploy verification: `docker compose build --progress=plain && docker compose up -d && docker compose ps`
- [ ] Smoke Mission 1 and Mission 2 launch paths
- [ ] Check flight controls, boost, primary fire, secondary lock state, radar heading, target markers, target destruction, extraction activation, mission complete, and failure overlay
- [ ] Repeat mobile smoke at 390x844 portrait and 844x390 landscape after HUD, marker, touch control, floor, fog, or renderer changes

### Recommended branch and commit strategy

- Branch from stable baseline as `visual/tactical-arena-foundation` when Git is available
- Use one branch per larger phase when risk increases: `visual/tactical-floor`, `visual/facility-kit`, `visual/weakpoint-targets`, `visual/level-kits`
- Commit in small reversible slices: extraction-only first, then visual config, then visible changes, then tests/docs
- Suggested commit prefixes: `refactor(scene):`, `feat(visual):`, `feat(targets):`, `test(smoke):`, `docs(plan):`
- Do not combine frame-loop behavior extraction with reflective floor, weak points, or HUD polish in the same commit

## Backlog Rules

- [ ] Do not add major new content until the required supporting framework exists
- [ ] Do not merge menu, campaign, and combat overhauls into one uncontrolled pass
- [ ] Do not break the existing vertical slice while chasing future systems
- [ ] Keep architecture work incremental and reversible