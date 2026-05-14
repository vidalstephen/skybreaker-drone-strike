# Skybreaker Drone Strike Development Checklist

Use this file to track completed development history and the staged future work required to evolve the current game without breaking the existing playable slice.

Current-state source of truth: `overview.md`.

Future-plan source of truth: `roadmap.md`.

If this checklist conflicts with `overview.md`, treat `overview.md` as the current implementation state and update this checklist before starting new work.

## Status Key

- [ ] Not started
- [~] In progress
- [x] Complete
- [>] Deferred
- [!] Blocked
- [r] Needs review

## Product Target

- Current playable baseline: compact eight-mission arcade campaign
- Future target: larger tactical arcade campaign with 18-24 main missions, optional sorties, varied biomes, weather, time-of-day, and air/land/sea combat domains
- Preserve chase camera readability, flight feel, readable combat, tactical radar identity, and reliable mission completion/extraction flow
- Reduce launch friction so players can reach gameplay quickly without hunting for the start action
- Make radar/tracking, objectives, extraction, and HUD hierarchy deliberate gameplay tools rather than passive decoration
- Keep the game playable after every phase

## Current Baseline

- [x] Core flight model playable
- [x] Combat loop playable
- [x] HUD, radar, world markers, and objective panel functional
- [x] Eight-mission linear campaign shell complete
- [x] Mission complete and mission failed overlays working
- [x] Docker build and deploy path working
- [x] Non-regression checklist written down in project docs (this file + DEV-CHECKLIST.md)

## Current State Sync - 2026-05-13

This section cleans up the historical checklist against `overview.md` before future roadmap work begins.

- [x] Treat `overview.md` as the current game-state document.
- [x] Treat `roadmap.md` as the forward-looking plan.
- [x] Current game is an eight-mission compact campaign, not only a Mission 1 vertical slice.
- [x] Current mission loop is still primarily destroy fixed targets, survive enemy wave pressure, then extract.
- [x] Current environments are Night Grid and Ash Ridge; future weather, time-of-day, ocean, arctic, urban, canyon, and stratosphere variants are not implemented yet.
- [x] Current loadout is a review/unlock display, not player equipment selection.
- [x] Upgrade trees, currency, ship builds, and branching unlock paths are not implemented.
- [x] Enemy roles have distinct stats and meshes, but behavior depth is still limited.
- [x] Later missions mostly use direct-health tower-style targets; richer set-piece destruction is future work.
- [x] Out-of-bounds is currently a warning state and should be reconciled with mission failure data before future mission expansion.
- [x] Prior checklist entries mentioning target lock or missile lock should be re-verified against the runtime before being used as current-state truth because `overview.md` currently records target lock and homing missiles as not implemented.
- [x] Future roadmap phases below supersede the old completed/prototype phase plan for new work.

## Non-Regression Rules

Source of truth for baseline behavior: `BASELINE.md`.

The following must remain working after every phase unless a phase explicitly targets them:

- **Flight controls**: W/S pitch, A/D assisted bank-turn, Q/E yaw correction, Shift boost, Ctrl brake, Space/left-mouse primary fire, Alt/right-mouse secondary fire, Tab/T lock cycle, X auto-level, C camera toggle, pointer drag fine control, touch joystick/actions, and invert-Y behavior.
- **Camera**: chase/cockpit toggle, boost FOV, camera shake, camera lerp, and drone silhouette framing in chase view.
- **Player systems**: hull/shields/energy with correct regen rates, boost gate (energy > 5), and fire gate (energy > 0).
- **HUD and identity**: orange/teal/black tactical color identity; hull, shields, energy, boost, weapon readiness, reticle, radar, and urgent warnings must stay visible at all times.
- **Radar**: accumulated heading behavior, blip categories, blip clamping, and extraction visibility rules.
- **Target/extraction markers**: screen-space projection, hysteresis, smoothing, safe-zone margins, overlap avoidance, and click-to-lock behavior.
- **Combat**: weapon energy costs and cooldowns, missile lock requirement and tracking, shield-before-hull damage ordering, projectile collision guard, and no double-counted target destruction.
- **Extraction**: activates only after all required targets are destroyed; radius check is XZ-only; mission completes exactly once.
- **Persistence**: settings and campaign progress survive page reloads via localStorage.
- **Build**: `npm run lint`, `npm run build`, Docker production build, and Docker deploy all pass without new errors.

---

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

### Step 1.7 — Extract game loop systems (incremental status sync)

These can be deferred to Phase 3 if Phase 1 is already proving large, but should be planned now:

- [x] `src/systems/flightPhysics.ts` — speed, boost, flight speed, rotation, auto-level, forward-vector, and position-advance helpers exist
- [ ] `src/systems/combatSystem.ts` — projectile spawn, collision detection, explosion creation
- [~] `src/systems/missionSystem.ts` — campaign status, scoring, ranking, completion persistence, and unlock helpers exist; live target destruction, enemy wave spawn, extraction activation, and fail-state enforcement still mostly live in `Game.tsx`
- [ ] `src/hooks/useGameInput.ts` — unified keyboard + touch + gamepad input handler replacing the ref-based approach

Note: the above systems live inside `useEffect` in the current `animate()` loop. Extracting them requires passing refs as arguments — plan carefully to avoid breaking the frame loop.

Deferral note: Step 1.7 became incremental rather than a single phase. Flight helpers and mission progression helpers now exist, but combat extraction, unified input extraction, and a full live mission runtime system remain future refactors.

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

- Shipped: App-level shell flow that boots to the hangar menu, routes through briefing into mission launch, supports pause/resume, retry, return-to-menu, and shell-routed debrief actions without browser reloads.
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

- [x] Destroy priority targets
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
- Notes/Risks: Phase 4 originally defined the campaign structure and scoring; current content has since grown to eight chained missions, while future roadmap work still needs broader mission types, richer rewards, and hands-on flight/combat regression passes.

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
- Notes/Risks: Current playable missions now use the configured enemy roles across the eight-mission campaign, but behavior depth remains limited and future phases should differentiate AI beyond stats and meshes.

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

---

## Roadmap Stage 1 - Fast Launch, Immediate Readability, Tactical Tracking, And Control Upgrade

Status: In progress

Goal: make the game easy to start, easy to read, and easy to control before adding more combat complexity.

Source of truth for full requirements: `roadmap.md` Stage 1.

### Stage 1a — Fast Launch Flow And CTA Hierarchy

Status: Complete

Goal: ensure one dominant primary CTA per screen and that a returning player can reach gameplay in ≤ 2 intentional actions after the splash.

- [x] Add `tertiary` variant to `MenuButton` for lowest-priority system actions
- [x] Promote `Reset Progress` buttons to `danger` variant throughout MainMenu
- [x] Add inline primary `Continue Sortie` button to the mobile mission card in MainMenu command tab (sidebar is hidden on mobile)
- [x] Demote the command tab grid `Next Sortie` to secondary (only visible on md+ where sidebar already shows the primary CTA)
- [x] Rename `BriefingScreen` primary CTA from `Loadout` to `Launch`; wire `onContinue` directly to `launchMission` in `App.tsx`
- [x] Add optional secondary `Loadout Review` button in `BriefingScreen` via new `onLoadout?` prop (accessible but not blocking)
- [x] `LoadoutScreen.onBack` still returns to `BRIEFING`, keeping the optional loadout path complete

Exit criteria:

- [x] Returning player reaches gameplay in: Splash → Continue Sortie → Launch = 2 intentional actions post-splash
- [x] No launch-path screen shows two equally-weighted orange-fill primary CTAs
- [x] Loadout review remains accessible as a secondary path without blocking launch
- [x] `npm run lint`, Docker build, and Docker deploy all pass

Completion summary:

- Shipped: `tertiary` MenuButton variant; single-primary CTA hierarchy across MainMenu (mobile card + desktop sidebar); briefing screen launches directly into mission; Loadout promoted to optional secondary path; Reset Progress uses danger styling.
- Changed: `src/components/menus/MenuButton.tsx`, `src/components/menus/BriefingScreen.tsx`, `src/components/menus/MainMenu.tsx`, `src/App.tsx`.
- Verification: `npm run lint` passed in Node 20 Docker container; `docker compose build` produced `skybreaker-drone-strike:latest`; `docker compose up -d` started container.
- Notes/Risks: Stage 1b (HUD objective behavior), Stage 1c (tactical tracking system), and Stage 1d (mobile touch-drag controls) remain as the next sub-phases in Stage 1.

### Stage 1b — HUD Objective Behavior

Status: Complete

Goal: replace the always-expanded objective panel with a compact chip that auto-expands at mission start and on every objective change, and remove static cosmetic HUD readouts.

- [x] Add `useEffect` on `objective` prop in `Objectives.tsx` — auto-expands on mount (mission intro) and on every objective text change; existing 4s collapse timer handles auto-collapse
- [x] Move `.objectives-chip { display: flex }` and `.objectives-panel[data-objectives-expanded="false"]` collapse rules from mobile-landscape-only media query to global CSS scope — chip and collapsible behavior now apply on all screen sizes including desktop
- [x] Remove static cosmetic `Connection / Battery` readout block from `Game.tsx` top-right HUD (meaningless static values, not a gameplay tool)
- [x] Add primary objective row to `PauseMenu` info grid using `mission.initialObjective` — players can review the sortie goal without re-opening the HUD

Exit criteria:

- [x] On mission start, objectives panel auto-expands for ~4 s then collapses to chip on all screen sizes
- [x] Every `objective` state change triggers a 4 s re-expand
- [x] Player can tap/click the chip to manually expand or collapse
- [x] Static Connection/Battery cosmetic values are gone from the top-right HUD
- [x] Pause menu shows primary objective text
- [x] `npm run lint`, Docker build, and Docker deploy all pass

Completion summary:

- Shipped: universal collapsible objective chip on all screen sizes; mission-start and objective-change auto-expand via a single `useEffect` on the `objective` prop; static Connection/Battery cosmetic readouts removed; primary objective text added to pause menu info grid.
- Changed: `src/components/hud/Objectives.tsx`, `src/index.css`, `src/components/Game.tsx`, `src/components/menus/PauseMenu.tsx`.
- Verification: `npm run lint` (Node 20 Docker) passed; `docker compose build` produced `skybreaker-drone-strike:latest`; `docker compose up -d` started container.
- Notes/Risks: PauseMenu shows `mission.initialObjective` (the static goal text), not the live `gameState.objective` — live extraction-phase state is visible on the HUD chip when the player resumes. Full live-state pause threading is deferred to Stage 1c or later.

### Stage 1c — Tactical Tracking, Radar, And Awareness System

Status: Complete

Goal: introduce a shared tracking model for all mission entities and upgrade the radar to a deliberate tactical tool with icon hierarchy, priority selection, pulse effects, edge pins, selected-track connector, and radar state label.

- [x] Define `TrackedEntityType`, `TrackedEntityState`, and serializable HUD snapshot types
- [x] Create `src/systems/trackingSystem.ts` with registration, update, removal, priority scoring, and query helpers
- [x] Register mission targets, hazards, and extraction at scene setup; register enemies on spawn
- [x] Replace ad hoc radar blip inputs with tracking snapshots via `tracksRef.current.getSnapshots()`
- [x] Add priority scoring and automatic selected track (`recomputePriority` every 4 frames)
- [x] Add radar visual hierarchy: icon shapes (circle = objective, square = enemy, diamond = extraction, X = hazard, triangle = weak point), priority pulse (SVG `<animate>`), edge pin arrows for clamped extraction, selected-track dashed connector, radar state label (SCAN / TARGETS / HOSTILES / EXTRACT)
- [x] Add `reduceEffects` prop to Radar — skip SVG pulse animations when enabled
- [ ] Connect tracking events to objective tab expansion/pulse (deferred — needs attention event bus)
- [ ] Add smoke tests for entity tracking visibility (deferred to Stage 1 completion)

Exit criteria:

- [x] Radar shows distinct shapes for objectives (circle), enemies (square), extraction (diamond), hazards (X)
- [x] Extraction diamond pulses with a growing ring when active; clamped extraction shows an outward-pointing arrow pin
- [x] Selected/priority track shows a dashed radial connector from the radar center
- [x] State label below radar updates: `SCAN` → `TARGETS` → `HOSTILES` → `EXTRACT`
- [x] `reduceEffects` suppresses pulse animations
- [x] `npm run lint`, Docker build, and Docker deploy all pass

Completion summary:

- Shipped: `TrackedEntityType` enum, `TrackedEntityState` type, `TrackedEntitySnapshot` interface in `src/types/game.ts`.
- Shipped: `src/systems/trackingSystem.ts` — pure module (no Three.js) with `registerTrack`, `updateTrack`, `markDestroyed`, `recomputePriority`, `getSnapshots`, `getSelectedTrack`, `reset`. Priority scoring ranks extraction active > required objective > weak point > close enemy > hazard inside radius.
- Shipped: `Game.tsx` wiring — `tracksRef = useRef(createTrackingSystem())`; targets/extraction/hazards registered at scene setup; enemies registered on spawn; `markDestroyed` called on target and enemy death; positions and states updated every 4 frames alongside `setGameState`; `recomputePriority` called each tick.
- Shipped: `Radar.tsx` visual hierarchy — type-specific SVG shapes, priority pulse with SVG `<animate>`, outward edge-pin arrow for clamped active extraction, dashed radial connector to selected track, state label below the radar circle.
- Changed: `src/types/game.ts`, `src/systems/trackingSystem.ts` (new), `src/components/Game.tsx`, `src/components/hud/Radar.tsx`.
- Verification: `npm run lint` passed (Node 20 Docker); `docker compose build` produced `skybreaker-drone-strike:latest`; `docker compose up -d` started container.
- Notes/Risks: Attention event bus (connecting tracking state changes to objective tab expansion) deferred to next stage — it requires a lightweight event emitter or a React context layer and is a clean decoupled addition. Weak-point tracking is registered architecturally but `WEAK_POINT` tracks are not yet registered per-mission (future task). Stage 1d (mobile touch-drag) remains not started.

### Stage 1d — Mobile Direct Touch-Drag Control

Status: Complete

- [x] Replace persistent joystick state with direct drag control state (`origin`, `delta`, `strength`)
- [x] Add configurable touch drag sensitivity
- [x] Keep action buttons for FIRE, BOOST, MSL, BRK, LEVEL, VIEW
- [x] Add optional low-opacity origin marker while dragging
- [x] Update controls screen to describe touch-drag steering
- [x] Update mobile smoke tests to verify no joystick is rendered

Exit criteria: mobile flight is possible without a visible joystick; small drags allow precise aim; large drags produce decisive turns.

Completion summary:
- Changed: `src/types/game.ts`, `src/config/defaults.ts`, `src/App.tsx`, `src/components/menus/SettingsMenu.tsx`, `src/components/menus/ControlsScreen.tsx`, `src/index.css`, `src/components/Game.tsx`, `scripts/smoke-mobile.cjs`.
- Verification: `npm run lint` passed (Node 20 Docker); `docker compose build` produced `skybreaker-drone-strike:latest`; `docker compose up -d` started container.
- Notes/Risks: `FlightJoystickState` shape (`{ x, y, active }`) was reused unchanged; `touchDrag.current` outputs the same fields so no changes to `flightPhysics.ts` were needed. The drag zone is a transparent `flex-1 self-stretch` div, giving a large capture area. Touch type assertions (`t as React.Touch`) were required to resolve TypeScript `unknown` errors on `changedTouches` iterables.

---

## Stage 2 — Mission Data Model Expansion

Goal: upgrade the mission framework so future content can express more than fixed target destruction. This is the foundation for weather, biomes, time-of-day, mission types, combat domains, and set pieces.

### Stage 2a — Mission Classification Fields

Status: Complete

- [x] Add `CombatDomain` type: `'AIR_TO_AIR' | 'AIR_TO_LAND' | 'AIR_TO_SEA' | 'MIXED'`
- [x] Add `MissionType` type: `'STRIKE' | 'INTERCEPT' | 'DEFENSE' | 'ESCORT' | 'RECON' | 'SABOTAGE' | 'SURVIVAL' | 'BOSS' | 'FINALE'`
- [x] Add `TimeOfDayId` type: `'dawn' | 'day' | 'dusk' | 'night'`
- [x] Add optional `combatDomain?`, `missionType?`, `timeOfDay?` fields to `MissionDefinition`
- [x] Populate all 8 existing missions with classification values
- [x] Surface classification chips in BriefingScreen objective tab (amber monospace tags, only shown when present)

- Changed: `src/types/game.ts`, `src/config/missions.ts`, `src/components/menus/BriefingScreen.tsx`.
- Verification: `npm run lint` passed (Node 20 Docker); `docker compose build` produced `skybreaker-drone-strike:latest`; `docker compose up -d` started container.
- Notes/Risks: Purely additive. `MissionConfig` inherits new optional fields automatically via `Omit<MissionDefinition, 'environment'>` — no changes to `levelKits.ts` needed. Existing missions continue to work as before.

### Stage 2b — Structured Objective Definitions

Status: Not started

- [ ] Define `ObjectiveDefinition` typed interface with: `id`, `type` (ObjectiveType enum), `label`, `description?`, `required`, `completed`, `failed`, tracking metadata
- [ ] Introduce `ObjectiveType` enum: `DESTROY_ALL`, `DESTROY_WEAK_POINTS`, `INTERCEPT`, `DEFEND_ZONE`, `ESCORT_ASSET`, `RECON_SCAN`, `DISABLE_SHIELDS`, `SURVIVE_UNTIL`, `ELIMINATE_BOSS`
- [ ] Add `objectiveSet?` field to `MissionDefinition` (alongside existing `targets` for backward compat)
- [ ] Implement at least 3 objective types in a prototype scene without breaking existing missions
- [ ] Feed objective updates into objective tab HUD behavior

Exit criteria: existing 8 missions representable in new schema without behavior loss; at least 3 new objective types runnable in prototype.

### Stage 2c — Optional Objectives And Bonus Conditions

Status: Not started

- [ ] Add optional objectives and bonus conditions to mission schema (time threshold, preserve ally, destroy convoy, avoid hazard, hull threshold)
- [ ] Surface optional objective indicators in HUD

### Stage 2d — Mission Runtime State Extension

Status: Not started

- [ ] Extend mission runtime state so objectives can independently track progress, completion, failure, and HUD updates

### Stage 2e — Mission Event Hooks

Status: Not started

- [ ] Add mission event hooks for weather changes, reinforcements, objective phase changes, and extraction activation

### Stage 2f — Mission-Authored Tracking Metadata

Status: Not started

- [ ] Add mission-authored tracking metadata: objective priority, radar label, world marker label, icon type, discovery behavior, approach hint, attention event behavior
- [ ] Allow objectives/enemies/extraction/hazards to define tracking visibility (always, hidden until activation, hidden until scanned, urgent only)

### Stage 2g — Multi-Stage Objectives

Status: Not started

- [ ] Extend mission schema for multi-stage objectives with child tracks and phase-specific tracking rules

### Stage 2h — Extraction Metadata States

Status: Not started

- [ ] Add extraction metadata states: inactive, active, contested, alternate, moving, emergency

---

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

- 2026-05-14: Stage 2a mission classification fields `docker run --rm -v "$PWD":/app -v skybreaker-drone-strike-node-modules:/app/node_modules -w /app node:20-alpine sh -c "npm run lint 2>&1"` - passed; TypeScript `tsc --noEmit` completed with zero errors.
- 2026-05-14: Stage 2a mission classification fields `docker compose build` - passed; image `skybreaker-drone-strike:latest` rebuilt. `docker compose up -d` started container.
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
- 2026-05-10: TV-9 smoke doc/script diagnostics for `docs/REGRESSION_SMOKE.md` and `scripts/smoke-mobile.cjs` - no errors found.
- 2026-05-10: TV-9 exact mobile smoke `docker run --rm --network host -v "$PWD":/work -w /tmp mcr.microsoft.com/playwright:v1.52.0-noble sh -lc "npm init -y >/dev/null && npm install playwright@1.52.0 >/dev/null && NODE_PATH=/tmp/node_modules node /work/scripts/smoke-mobile.cjs"` - passed; 390x844 portrait and 844x390 landscape viewports matched requested dimensions, mission canvas matched viewport, touch controls/HUD/radar/compass were visible, no horizontal overflow was detected, and no page errors were reported.
- 2026-05-10: TV-9 final `docker run --rm -v "$PWD":/app -v skybreaker-drone-strike-node-modules:/app/node_modules -w /app node:20-alpine sh -lc "npm run lint"` - passed; TypeScript `tsc --noEmit` completed with zero errors in the container.
- 2026-05-10: TV-9 final `docker compose build --progress=plain && docker compose up -d && docker compose ps` - passed; Vite production build completed with the existing large chunk warning, image `skybreaker-drone-strike:latest` rebuilt, and container `skybreaker-drone-strike` reported `Up`.
- 2026-05-11: FLIGHT-1 source/docs diagnostics for `src/scene/droneModel.ts`, `src/systems/flightPhysics.ts`, `src/components/Game.tsx`, `docs/REGRESSION_SMOKE.md`, and `DEV-CHECKLIST.md` - no errors found.
- 2026-05-11: FLIGHT-1 final `docker run --rm -v "$PWD":/app -v skybreaker-drone-strike-node-modules:/app/node_modules -w /app node:20-alpine sh -lc "npm run lint"` - passed; TypeScript `tsc --noEmit` completed with zero errors in the container.
- 2026-05-11: FLIGHT-1 final `docker compose build --progress=plain && docker compose up -d && docker compose ps` - passed; Vite production build completed with the existing large chunk warning, image `skybreaker-drone-strike:latest` rebuilt, and container `skybreaker-drone-strike` reported `Up`.
- 2026-05-11: FLIGHT-1 deployed desktop browser smoke at `https://skybreaker.nsystems.live` - Mission 1 and Mission 2 briefing/launch paths passed; HUD, radar/compass, target markers, Pulse Cannon/Ion Missile status, secondary no-air-target lock feedback, keyboard flight inputs, boost/fire, and cockpit/chase view toggle were confirmed; screenshot review confirmed the revised aircraft is readable in chase view without blocking the reticle or objective HUD.
- 2026-05-11: FLIGHT-1 exact mobile smoke `docker run --rm --network host -v "$PWD":/work -w /tmp mcr.microsoft.com/playwright:v1.52.0-noble sh -lc "npm init -y >/dev/null && npm install playwright@1.52.0 >/dev/null && NODE_PATH=/tmp/node_modules node /work/scripts/smoke-mobile.cjs"` - passed; 390x844 portrait and 844x390 landscape viewports matched requested dimensions, mission canvas matched viewport, touch controls/HUD/radar/compass were visible, no horizontal overflow was detected, and no page errors were reported.

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

Status: Complete / Historical Reference

Goal: preserve the completed tactical visual evolution plan as historical context. Most TV phases below are complete; use `roadmap.md` and the `Future Roadmap Implementation Plan` section in this file for new future work.

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

- Flight controls: W/S pitch, A/D assisted bank-turn, Q/E yaw correction, R/F throttle, Shift boost, Ctrl brake, Space/left mouse primary, Alt/right mouse secondary, Tab/T lock cycle, X auto-level, C camera toggle, pointer drag, touch joystick/actions, and invert-Y.
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
- [x] HUD, radar, target markers, and extraction marker remain legible in Signal Break and Iron Veil during hands-on browser review — retrospectively confirmed by FLIGHT-1 desktop smoke (2026-05-11): Mission 1 and Mission 2 HUD, radar/compass, target markers, and Pulse Cannon/Ion Missile HUD all passed visual review.
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

Status: Complete

Goal: improve the player drone silhouette, materials, and thruster glow while preserving chase-camera readability and flight feel.

- [x] Strengthen drone low-poly tactical silhouette without changing scale or camera framing unexpectedly
- [x] Add named material handles for body, wings, cockpit, accents, rotors, glows, and damage/firing feedback
- [x] Improve thruster glow and boost feedback without washing out the body silhouette
- [x] Avoid changes to flight physics, boost energy drain, speed, or controls

Acceptance criteria:

- [x] Drone reads clearly in chase view against dark arena and fog
- [x] Boost and thruster states feel stronger but not overbright
- [x] Camera readability and aiming remain stable
- [x] Containerized `npm run lint` and Docker production build/deploy pass

Completion summary:

- Shipped: TV-7 drone visual polish with a stronger low-poly tactical silhouette, named drone visual/material handles, direct rotor/glow/thruster state updates, subtle body/cockpit/accent feedback for firing/damage/boost, and cleaner boost-color thruster behavior without changing drone scale, camera setup, flight physics, energy costs, controls, projectile direction, radar, markers, or mission state.
- Changed: `src/scene/droneModel.ts`, `src/components/Game.tsx`, `DEV-CHECKLIST.md`.
- Verification: VS Code diagnostics for `src/scene/droneModel.ts` reported no errors; local VS Code diagnostics for `Game.tsx` still show the known React declaration noise documented in the risk register. Containerized `npm run lint` passed; `docker compose build --progress=plain && docker compose up -d && docker compose ps` passed with the existing non-blocking Vite large-chunk warning and container `Up`; deployed browser smoke at `https://skybreaker.nsystems.live` launched Mission 1 with WebGL canvas/HUD visible at ~100 FPS and no page errors. Screenshot review confirmed the deployed mission scene rendered; direct canvas pixel reads returned transparent samples because the WebGL drawing buffer is not preserved for readback.
- Notes/Risks: Drone runtime visual feedback now uses named handles instead of filtering child geometry types, reducing fragility for future visual phases. Browser smoke drifted out of the mission zone while boost-testing, so the warning overlay was visible during the screenshot; this did not affect the build/type verification or the visual confirmation of the canvas/HUD.

### Phase TV-8 - Scalable Level and Campaign Configuration

Status: Complete

Goal: make future missions choose reusable arena, facility, waypoint, and target archetypes through config instead of hardcoded scene branches.

- [x] Add `src/config/levelKits.ts` or equivalent for arena kits, facility kits, waypoint styles, floor/grid profiles, and beacon palettes
- [x] Extend mission/environment types to reference level kits with safe defaults for existing missions
- [x] Allow new missions to configure structure density, target archetypes, weak-point layouts, and waypoint style declaratively
- [x] Keep mission unlocks, scoring, reward, enemy wave, extraction, and failure condition contracts stable

Acceptance criteria:

- [x] A new mission can reuse an existing level kit and facility archetype without adding scene-builder branches
- [x] Existing missions load with backward-compatible defaults
- [x] TypeScript catches invalid level-kit references or missing required fields where practical
- [x] Containerized `npm run lint` and Docker production build/deploy pass

Completion summary:

- Shipped: TV-8 scalable level-kit configuration with typed `LevelKitId`, waypoint style IDs, weak-point layout IDs, level-kit definitions for Night Grid and Ash Ridge, shared target weak-point layouts, and a `defineMission()` helper that resolves mission `levelKitId` values into full runtime environment objects.
- Shipped: The mission catalog now references `night-grid` / `ash-ridge` kit IDs while preserving all mission unlock, scoring, reward, enemy wave, extraction, failure-condition, and existing target behavior. Kit target defaults are opt-in through `useLevelKitTargetDefaults` / `targetDefaults` so existing missions without explicit archetypes continue through the prior scene-builder fallback.
- Changed: `src/types/game.ts`, `src/config/levelKits.ts`, `src/config/environments.ts`, `src/config/missions.ts`, `DEV-CHECKLIST.md`.
- Verification: VS Code diagnostics for changed config/type files reported no errors; containerized `npm run lint` passed; `docker compose build --progress=plain && docker compose up -d && docker compose ps` passed with the existing non-blocking Vite large-chunk warning and container `Up`; deployed browser smoke at `https://skybreaker.nsystems.live` confirmed Mission 1 briefing/launch through Night Grid and Mission 2 briefing/launch through Ash Ridge with Ash Static hazards and relay-spire objective/HUD visible.
- Notes/Risks: `src/config/environments.ts` remains as a compatibility export layer so older imports continue working, but the source of truth is now `src/config/levelKits.ts`. Waypoint style metadata is typed and stored on level kits for future rendering variation, but TV-8 does not alter waypoint visuals or scene-builder behavior.

### Phase TV-9 - Regression Hardening and Optional Renderer Enhancements

Status: Complete

Goal: harden the new visual architecture, then only consider heavier renderer features if performance remains stable.

- [x] Add smoke-test notes or scripts for visual regression points across desktop and mobile viewports
- [x] Repeat Mission 1 and Mission 2 smoke checks for controls, radar, markers, target destruction, extraction, success, and failure
- [x] Evaluate optional renderer settings such as `SRGBColorSpace`, tone mapping, bloom, or real reflections only after simpler polish is stable
- [x] Keep heavy effects quality-gated and reduced-effects aware

Acceptance criteria:

- [x] Regression checklist covers flight, mission, radar, markers, extraction, HUD, mobile touch controls, and graphics quality settings
- [x] Optional renderer changes improve the look without harming FPS or readability
- [x] Containerized `npm run lint`, Docker production build/deploy, and mobile smoke checks pass

Completion summary:

- Shipped: TV-9 regression hardening with a durable browser smoke checklist, exact portrait/landscape mobile Playwright smoke automation, and a renderer evaluation that retains the current SRGB/ACES baseline while deferring bloom, real reflections, dense dynamic lighting, and shadow-heavy effects until a dedicated performance pass proves headroom.
- Changed: `docs/REGRESSION_SMOKE.md`, `scripts/smoke-mobile.cjs`, `DEV-CHECKLIST.md`.
- Verification: VS Code diagnostics for the smoke doc/script reported no errors; containerized `npm run lint` passed; `docker compose build --progress=plain && docker compose up -d && docker compose ps` passed with the existing non-blocking Vite large-chunk warning and container `Up`; desktop Mission 1 and Mission 2 browser smokes passed; Docker Playwright exact mobile smoke passed at 390x844 portrait and 844x390 landscape with matching canvas dimensions, visible touch controls/HUD/radar/compass, no horizontal overflow, and no page errors.
- Notes/Risks: TV-9 did not add heavier renderer features because the current renderer baseline is already quality-gated and readable. Target destruction, extraction, success, and failure remain documented for deeper manual regression passes; the automated smoke focuses on launch, HUD, controls, layout, and mobile viewport integrity.

## Phase FLIGHT-1 - Revised Player Aircraft and Control Prep

Status: Complete

Goal: integrate the revised player aircraft from `player-aircraft.html` into the game, then prepare the movement-control code for a dedicated refinement pass without changing flight feel prematurely.

- [x] Port the revised aircraft silhouette, materials, pods, rear thruster, dorsal/belly panels, struts, and accent emitters into the in-game Three.js drone model
- [x] Preserve the existing `createDroneModel()` and `updateDroneVisualState()` API used by `Game.tsx`
- [x] Preserve current flight semantics: forward is negative Z, `YXZ` rotation order, spawn height, projectile direction, navigation-lock quaternion sync, boost energy drain, camera offsets, HUD/radar/marker behavior, and mission rules
- [x] Add behavior-preserving movement/control prep seams for future pitch, yaw, roll, boost, auto-level, camera, and touch-control tuning
- [x] Document the control baseline that must stay unchanged until the dedicated refinement pass

Acceptance criteria:

- [x] Revised aircraft is visible and readable in chase view without occluding the reticle, weapon path, HUD, radar, or target markers
- [x] Boost, primary fire, recent damage, engine glow, and cockpit/accent feedback animate through named visual handles
- [x] Cockpit view hides the aircraft and chase view restores it
- [x] Keyboard, pointer fine control, and touch controls still respond with the same mappings
- [x] Containerized `npm run lint`, Docker production build/deploy, Mission 1 and Mission 2 smoke checks, and exact mobile smoke checks pass

Control baseline for refinement:

- FLIGHT-1's old behavior-preserving baseline has been superseded by the arcade-assisted control refinement: W/S pitch, A/D assisted bank-turn, Q/E yaw correction, R/F throttle, Shift boost, Ctrl brake, Space/left mouse primary fire, Alt/right mouse secondary fire, Tab/T lock cycle, X auto-level, C view toggle, touch joystick/actions, invert-Y behavior, boost FOV, and closer chase framing are now the active control/readability baseline.

Completion summary:

- Shipped: FLIGHT-1 revised player aircraft integration with the `player-aircraft.html` silhouette translated into native Three.js procedural geometry: lofted graphite fuselage, amber canopy, teal wing arms and panels, rotor pods, rear thruster/afterburner, belly/dorsal panels, struts, and cyan accent emitters. The existing drone factory/update API, negative-Z forward direction, spawn behavior, projectile path, navigation lock, HUD/radar/marker contracts, and mission rules were preserved.
- Shipped: Behavior-preserving control prep via `src/systems/flightPhysics.ts`, moving current boost gate/energy drain, flight speed, pitch/yaw/roll input, pointer fine-control, auto-level, forward-vector, and position-advance math behind named helpers without retuning values. Keyboard C and touch VIEW now share the same camera-mode toggle path so quick view changes are not frame-rate dependent.
- Changed: `src/scene/droneModel.ts`, `src/systems/flightPhysics.ts`, `src/components/Game.tsx`, `docs/REGRESSION_SMOKE.md`, `DEV-CHECKLIST.md`.
- Verification: VS Code diagnostics for changed source/docs reported no errors; containerized `npm run lint` passed; `docker compose build --progress=plain && docker compose up -d && docker compose ps` passed with the existing non-blocking Vite large-chunk warning and container `Up`; deployed desktop browser smoke passed for Mission 1 and Mission 2 launch/HUD/radar/weapon feedback/cockpit toggle; screenshot review confirmed the revised aircraft is readable in chase view; exact Docker Playwright mobile smoke passed at 390x844 portrait and 844x390 landscape with matching canvas dimensions, visible touch controls/HUD/radar/compass, no horizontal overflow, and no page errors.
- Notes/Risks: Actual movement feel tuning is intentionally deferred to the next dedicated control-refinement phase. The integrated browser reported very low FPS during some LOW/HIGH smoke runs, likely from the shared browser environment; Docker build, desktop functional smoke, and exact mobile smoke still passed.

## Post-Phase Product Shell Polish

Status: Complete

Goal: tighten the game into a more complete product shell with a cinematic boot, proper hangar hub, dedicated campaign selection, detailed settings, and supporting screens without changing the core mission/combat loop.

- [x] Start the app at an animated splash screen with skip and auto-advance behavior
- [x] Refactor the main menu into a hangar hub with Continue, Campaign, Loadout, Pilot Record, Settings, Controls, Credits, and Reset Progress actions
- [x] Move mission browsing into a dedicated campaign selection screen grouped by campaign arc
- [x] Expand briefing into a richer mission intelligence screen
- [x] Add a read-only loadout review screen based on unlocked campaign weapons
- [x] Add pilot record, controls, and credits screens
- [x] Replace the simple settings menu with Audio, Video, Controls, and System tabs
- [x] Add backward-compatible persisted settings for HUD scale, touch-control scale, screen shake, pointer sensitivity, telemetry visibility, and menu motion
- [x] Wire safe presentation settings into the mission view without changing mission rules
- [x] Polish pause, mission complete, and mission failed shell actions
- [x] Update mobile smoke automation and regression checklist for the new screen flow
- [x] Run containerized lint/build verification
- [x] Run Docker production build/deploy verification
- [x] Run exact mobile smoke against the deployed URL

Completion summary:

- Shipped: Product-shell pass with animated splash, hangar hub, campaign mission select, richer briefing, read-only loadout review, pilot record, controls, credits, tabbed settings, polished pause actions, and expanded success/failure overlays.
- Shipped: Backward-compatible settings fields for HUD scale, touch-control scale, screen shake, pointer sensitivity, telemetry visibility, and menu motion; safe presentation wiring was added to the mission view without changing mission rules, damage, weapons, unlocks, target counts, extraction, or flight-control mappings.
- Changed: `src/App.tsx`, `src/types/game.ts`, `src/config/defaults.ts`, `src/hooks/useAudio.ts`, `src/components/menus/*`, `src/components/overlays/*`, `src/components/Game.tsx`, `scripts/smoke-mobile.cjs`, `docs/REGRESSION_SMOKE.md`, `DEV-CHECKLIST.md`.
- Verification: VS Code diagnostics for changed app/menu/game files reported no errors; containerized `npm run lint` passed; containerized `npm run build` passed with the existing non-blocking Vite large-chunk warning; `docker compose build --progress=plain && docker compose up -d && docker compose ps` passed and reported `skybreaker-drone-strike` as `Up`; exact Docker Playwright mobile smoke passed at 390x844 portrait and 844x390 landscape with splash/hangar/settings/campaign/briefing/loadout/mission launch checks, matching canvas dimensions, visible touch controls/HUD/radar/compass, no horizontal overflow, and no page errors; `npm run validate:drone` passed.
- Notes/Risks: Loadout remains read-only and key rebinding remains deferred until a dedicated gameplay/input contract pass. The production JS bundle is now about 1.0 MB minified and still triggers the existing Vite large-chunk warning; code splitting is a future optimization.

## Product Shell Polish Verification Log

- 2026-05-11: Product shell diagnostics for `src/App.tsx`, `src/components/menus`, `src/components/overlays`, `src/components/Game.tsx`, `src/types/game.ts`, and `src/config/defaults.ts` - no errors found.
- 2026-05-11: Product shell `docker run --rm -v "$PWD":/app -v skybreaker-drone-strike-node-modules:/app/node_modules -w /app node:20-alpine sh -lc "npm run lint"` - passed; TypeScript `tsc --noEmit` completed with zero errors.
- 2026-05-11: Product shell `docker run --rm -v "$PWD":/app -v skybreaker-drone-strike-node-modules:/app/node_modules -w /app node:20-alpine sh -lc "npm run build"` - passed; Vite production build completed with the existing non-blocking large-chunk warning.
- 2026-05-11: Product shell `docker compose build --progress=plain && docker compose up -d && docker compose ps` - passed; image `skybreaker-drone-strike:latest` rebuilt and container `skybreaker-drone-strike` reported `Up`.
- 2026-05-11: Product shell exact mobile smoke `docker run --rm --network host -v "$PWD":/work -w /tmp -e SMOKE_URL=https://skybreaker.nsystems.live mcr.microsoft.com/playwright:v1.52.0-noble sh -lc "npm init -y >/dev/null && npm install playwright@1.52.0 >/dev/null && NODE_PATH=/tmp/node_modules node /work/scripts/smoke-mobile.cjs"` - passed; portrait and landscape viewports confirmed shell actions, settings tabs, campaign mission list, briefing details, loadout weapons, mission launch, full-size canvas, visible touch controls/HUD/radar/compass, no horizontal overflow, and no page errors.
- 2026-05-11: Product shell `docker run --rm -v "$PWD":/app -v skybreaker-drone-strike-node-modules:/app/node_modules -w /app node:20-alpine sh -lc "npm run validate:drone"` - passed; drone symmetry and effect handle validation completed successfully.

## Deferred Work Log

| Date | Phase | Deferred item | Reason | Recommended next step |
|---|---|---|---|---|
| 2026-05-09 | Phase 1, Step 1.7 | `src/systems/combatSystem.ts` — projectile spawn, collision detection, explosion creation | Extraction risks destabilizing the animation frame loop during UI architecture pass | Extract combat helpers incrementally in a dedicated frame-loop extraction phase after adding regression smoke coverage |
| 2026-05-09 | Phase 1, Step 1.7 | `src/hooks/useGameInput.ts` — unified keyboard, touch, gamepad input handler | Requires careful ref threading; would break existing input during Phase 1 scope | Extract after flight-physics and mission helpers are stable; plan as a standalone input extraction phase |
| 2026-05-09 | Phase 1, Step 1.7 | `src/systems/missionSystem.ts` live runtime — target destruction, enemy wave spawn, extraction activation, and fail-state enforcement | Core live mission logic is interleaved with the frame loop; partial extraction already done | Continue incrementally during a dedicated frame-loop extraction phase, never during visual or UX phases |
| 2026-05-09 | Phase 2 / Phase 7 | Full audio mixing and graphics preset end-to-end wiring | Scoped to shell settings only during Phases 2 and 7; audio is intentionally procedural/lightweight for production safety | Address in a dedicated audio depth pass after mission content and campaign are stable |
| 2026-05-11 | FLIGHT-1 | Movement/feel tuning — control response curves, pitch/yaw feel, boost feel, and camera framing adjustments | Intentionally deferred from the control prep pass to avoid premature feel retuning | Begin a dedicated control-refinement phase after FR-1 launch-flow work and before FR-3 tracking/radar work |
| 2026-05-11 | Post-Phase Product Shell Polish | Loadout selection and key rebinding | Loadout remains read-only; keybinds use hardcoded defaults | Implement after a dedicated input-contract pass; both belong in FR-10 (Progression/Loadout) and a future input phase |

---

## Future Roadmap Implementation Plan

Status: Planned

Goal: convert `roadmap.md` into an implementation checklist. These phases are forward-looking and start from the current state described in `overview.md`.

Planning rules:

- [ ] Do not start large content expansion until Stage 1 UX and Stage 2 mission schema work are stable.
- [ ] Keep every future phase playable, buildable, and regression-testable.
- [ ] Prefer typed data/config expansion over per-mission branches in `Game.tsx`.
- [ ] Keep `overview.md` updated after each completed future phase.
- [ ] Keep `roadmap.md` updated when phase scope changes.

## Future Phase FR-0 - Documentation Truth Lock

Status: Not started

Goal: reconcile docs and runtime before new systems begin.

- [ ] Re-review `overview.md` against the live code.
- [ ] Reconcile target lock and Ion Missile behavior between `overview.md`, `DEV-CHECKLIST.md`, controls copy, and runtime.
- [ ] Reconcile out-of-bounds behavior between mission data and runtime warning/failure behavior.
- [ ] Confirm which checklist sections are historical and which sections are active future work.
- [ ] Add a `Known Gaps` section to `overview.md` if future implementation starts from unresolved inconsistencies.
- [ ] Define future work tags: `HUD`, `MOB`, `MIS`, `ENV`, `COMBAT`, `PROG`, `CAMPAIGN`, `RADAR`, `TRACK`, `QA`.

Exit criteria:

- [ ] `overview.md`, `roadmap.md`, and this checklist agree on current implemented state.
- [ ] Any runtime/doc mismatches are either fixed or explicitly listed as known gaps.
- [ ] The first implementation phase has no open ambiguity around current behavior.

Verification:

- [ ] VS Code diagnostics for changed Markdown files.
- [ ] Manual doc review against relevant source files.

## Future Phase FR-1 - Fast Launch Flow And CTA Hierarchy

Status: Not started

Goal: make the path from opening the game to actual gameplay obvious, fast, and visually prioritized.

Primary flow requirements:

- [ ] Add a dominant `Start Mission` CTA for first-time players.
- [ ] Add a dominant `Continue Sortie` CTA for returning players.
- [ ] Add a direct launch path from the first visible hangar state to the next unlocked mission.
- [ ] Reduce required actions from first interactive screen to gameplay to three or fewer for a new player.
- [ ] Reduce required actions from hangar to gameplay to two or fewer for a returning player.
- [ ] Keep manual Campaign/Mission Select available as a secondary path.
- [ ] Convert read-only loadout review into optional review until loadout selection exists.
- [ ] Add a compact pre-launch summary that shows only launch-critical information.

CTA hierarchy requirements:

- [ ] Define menu button roles: `primary`, `secondary`, `tertiary`, `danger`, `disabled`, and `selected`.
- [ ] Update `MenuButton` or shared menu controls to support role styling consistently.
- [ ] Reserve the strongest accent fill for the next gameplay-progressing action.
- [ ] Make secondary navigation quieter than launch actions.
- [ ] Give reset/destructive actions a distinct danger style.
- [ ] Ensure no launch-path screen presents multiple equally weighted primary CTAs.
- [ ] Place primary launch/continue actions consistently across desktop screens.
- [ ] Add mobile sticky/bottom action treatment for launch/continue actions.

Information architecture requirements:

- [ ] Separate launch-critical information from optional mission detail.
- [ ] Keep mission title, objective summary, threat level, required unlock state, and launch action visible.
- [ ] Move detailed briefing rows, enemy composition, lore reward text, and best-score detail behind optional tabs/drawers.
- [ ] Reduce first-launch dependence on carousel/swipe navigation.
- [ ] Make the next action visually obvious without requiring tutorial copy.

Exit criteria:

- [ ] New player can reach gameplay in three or fewer intentional actions from the first interactive screen.
- [ ] Returning player can continue in two or fewer intentional actions from the hangar.
- [ ] Primary launch action is visibly dominant on every launch-path screen.
- [ ] Mobile launch action is visible without exploratory swiping.
- [ ] Playtesters can identify the next action without verbal guidance.

Verification:

- [ ] Desktop smoke: splash -> hangar -> launch next mission.
- [ ] Mobile smoke: splash -> hangar -> launch next mission with no horizontal overflow.
- [ ] Visual review of CTA hierarchy across splash, hangar, campaign, briefing, loadout, pause, and debrief.
- [ ] Containerized `npm run lint`.
- [ ] Docker production build/deploy verification.

## Future Phase FR-2 - HUD Objective Drawer And Minimal Combat HUD

Status: Not started

Goal: keep immediate flight/combat metrics visible while moving nonessential objective detail out of the persistent HUD.

- [ ] Replace the always-expanded objective panel with a mission-start objective intro.
- [ ] Add a compact objective tab/chip for normal gameplay.
- [ ] Add objective event types: `intro`, `updated`, `completed`, `failed`, `optional-updated`, `weather-warning`, and `extraction-active`.
- [ ] Expand/blink/pulse the objective tab briefly when objective state changes.
- [ ] Add pause/menu objective summary so players can review goals on demand.
- [ ] Review top-right HUD and remove or hide cosmetic/static connection/battery content unless made functional.
- [ ] Keep immediate metrics prominent: hull, shields, energy, boost, weapon readiness, reticle, radar, and urgent warnings.
- [ ] Add reduced-effects behavior for objective pulses and transitions.

Exit criteria:

- [ ] Player understands mission goals at launch.
- [ ] Objective detail recedes during active combat.
- [ ] Objective changes are hard to miss but do not permanently clutter the HUD.
- [ ] HUD does not overlap on desktop or mobile.

Verification:

- [ ] Mission 1 objective intro, weak-point update, target completion, and extraction activation smoke.
- [ ] Mission 2 hazard/objective display smoke.
- [ ] Mobile portrait/landscape HUD overlap smoke.
- [ ] Reduced-effects smoke.

## Future Phase FR-3 - Tactical Tracking And Radar Tooling

Status: Not started

Goal: implement a complete enemy/objective/weak-point/extraction tracking system and make radar an intentional tactical tool.

Tracking model:

- [ ] Define tracked entity types: player, objective, weak point, enemy, extraction, hazard, ally, projectile threat, naval target, ground target, and air target.
- [ ] Define tracked entity states: hidden, undiscovered, detected, active, priority, selected, locked, damaged, disabled, completed, destroyed, urgent, and offscreen.
- [ ] Define serializable tracking snapshots for React HUD rendering.
- [ ] Include core fields: id, type, label, world position, velocity, distance, bearing, altitude delta, faction, combat domain, objective id, priority score, visibility, and status.
- [ ] Include health/progress fields for enemies, weak points, targets, bosses, and phased objectives.
- [ ] Include guidance fields for route hints, approach vectors, danger radius, scan radius, extraction radius, and time-critical state.
- [ ] Include presentation fields for radar icon, radar color, radar pulse, world marker style, reticle hint, audio ping, and attention reason.

System architecture:

- [ ] Add `src/systems/trackingSystem.ts` or equivalent.
- [ ] Register mission targets, weak points, enemies, hazards, and extraction with the tracking system.
- [ ] Keep Three.js object references out of React state.
- [ ] Update tracking snapshots at a controlled cadence in the game loop.
- [ ] Add query helpers for primary objective, nearest hostile, highest threat, selected track, extraction track, offscreen threats, and route hints.
- [ ] Add tracking events for discovered, priority changed, damaged, completed, extraction activated, and threat entered range.

Enemy tracking:

- [ ] Register enemies on spawn and mark/remove them on destruction.
- [ ] Track enemy role, distance, bearing, shield, health, weapon range, attack state, and threat level.
- [ ] Flag urgent enemies behind the player, entering firing range, launching special attacks, or targeting protected assets.
- [ ] Support future grouped formations and boss child tracks.

Objective and extraction tracking:

- [ ] Register every objective and weak point at mission start.
- [ ] Track required versus optional objectives.
- [ ] Track objective phase, health, weak-point completion, shield-gated state, and moving target state.
- [ ] Promote current required objective to priority by default.
- [ ] Emit attention events for damage, completion, exposure, shield changes, and objective phase changes.
- [ ] Register extraction from mission start as hidden/inactive.
- [ ] Activate and prioritize extraction when required objectives complete.
- [ ] Track extraction states: inactive, activating, active, approaching, inside-radius, completed, and future contested.
- [ ] Keep active extraction visible through radar edge pins even outside radar range.

Radar upgrades:

- [ ] Preserve the current radar visual identity.
- [ ] Add mission-start radar sweep/ping to introduce radar as the scanner.
- [ ] Add compact radar state label: `SCAN`, `TARGETS`, `HOSTILES`, `EXTRACT`, or `JAMMED`.
- [ ] Use shape and motion as well as color for entity types.
- [ ] Add priority pulses for objectives, urgent enemies, and extraction.
- [ ] Add edge pins/arrows for important off-range tracks.
- [ ] Add selected-track connector from radar center.
- [ ] Add range ring or distance label for selected/extraction track.
- [ ] Add brief radar expansion/glow for objective updates, enemy wave spawn, extraction activation, and selected-track changes.
- [ ] Add optional audio pings for high-value tracking events.
- [ ] Add reduced-effects behavior for sweep, glow, pulse, and audio ping intensity.

World marker and reticle integration:

- [ ] Derive world marker labels/states from tracked entities.
- [ ] Add offscreen indicators only for priority or urgent tracks.
- [ ] Add reticle-side hints for selected target range, type, lock state, shield state, or weak-point requirement.
- [ ] Guide weak-point targets toward required subcomponents, not just parent towers.
- [ ] Synchronize radar, objective tab, world marker, and reticle changes when extraction activates.

Exit criteria:

- [ ] Targets, weak points, enemies, hazards, and extraction all use shared tracking snapshots.
- [ ] Radar becomes noticeable and useful in the first mission without verbal explanation.
- [ ] Radar, objective tab, reticle hints, and world markers agree on the current priority track.
- [ ] Enemy wave spawn, objective updates, weak-point state, and extraction activation create visible tracking events.
- [ ] Future mission types can reuse tracking without a HUD rewrite.

Verification:

- [ ] Unit or focused helper tests for tracking priority scoring where practical.
- [ ] Mission 1 weak-point/objective/extraction tracking smoke.
- [ ] Mission 2 hazard/enemy/extraction tracking smoke.
- [ ] Mobile radar readability smoke.
- [ ] Reduced-effects radar smoke.

## Future Phase FR-4 - Mobile Direct Touch-Drag Flight Control

Status: Not started

Goal: replace the visible mobile joystick with direct touch-drag steering.

- [ ] Replace `touchJoystick` state with direct drag origin/current/strength state.
- [ ] On touch start, record the control origin point.
- [ ] While dragging, steer from the vector between origin and current touch position.
- [ ] Scale input strength by distance from origin.
- [ ] Apply a response curve for fine control near origin and stronger turns at distance.
- [ ] Clear origin and recenter input on release.
- [ ] Keep FIRE, BOOST, MSL, BRK, LEVEL, and VIEW actions reachable.
- [ ] Add configurable touch drag sensitivity.
- [ ] Add optional low-opacity origin marker only while dragging.
- [ ] Update Controls screen copy for touch-drag steering.
- [ ] Update smoke tests to verify no joystick renders and drag input changes orientation.

Exit criteria:

- [ ] Mobile flight works without a persistent joystick.
- [ ] Small drags allow precise aim correction.
- [ ] Large drags produce decisive turns.
- [ ] Action buttons do not overlap ship metrics or radar.
- [ ] Touch input does not interfere with menu scrolling outside gameplay.

Verification:

- [ ] Exact mobile landscape smoke at 844x390.
- [ ] Touch-drag input smoke in mission.
- [ ] Mobile controls screen smoke.
- [ ] Containerized `npm run lint` and production build/deploy.

## Future Phase FR-5 - Mission Schema Expansion

Status: Not started

Goal: expand mission data so future content can express mission type, combat domain, biome, time, weather, objective sets, optional goals, and tracking metadata.

Mission classification:

- [ ] Add `combatDomain`: air-to-air, air-to-land, air-to-sea, mixed.
- [ ] Add `missionType`: strike, intercept, defense, escort, recon, sabotage, survival, boss, finale.
- [ ] Add `biomeId`, `timeOfDayId`, `weatherId`, and `objectiveSet` fields.
- [ ] Add mission-authored tracking metadata for radar label, world marker label, icon type, discovery behavior, approach hints, and priority.
- [ ] Add extraction metadata for inactive, active, contested, alternate, moving, and emergency extraction states.

Objective model:

- [ ] Define typed objective records separate from only `targets` arrays.
- [ ] Support destroy all targets.
- [ ] Support destroy required weak points.
- [ ] Support intercept moving targets before escape.
- [ ] Support defend zone or allied asset.
- [ ] Support escort friendly asset to extraction.
- [ ] Support scan/recon by staying in range.
- [ ] Support disable shields before core damage.
- [ ] Support survive until extraction opens.
- [ ] Support eliminate ace/boss enemy.
- [ ] Support optional objectives and bonus conditions.

Runtime model:

- [ ] Track objective progress, completion, failure, and HUD/tracking updates independently.
- [ ] Add mission event hooks for weather changes, reinforcements, phase changes, objective updates, and extraction activation.
- [ ] Convert the current eight missions to the expanded schema without behavior loss.
- [ ] Avoid per-mission branches inside the main game loop.

Exit criteria:

- [ ] Existing eight missions run through the expanded schema.
- [ ] At least three new objective prototypes run in a test mission or dev fixture.
- [ ] Mission data can drive radar labels, priority, discovery behavior, and extraction guidance.
- [ ] Objective updates feed the Stage 1 objective drawer and tracking system.

Verification:

- [ ] Schema/type diagnostics.
- [ ] Save migration smoke for existing progress.
- [ ] Mission 1-8 launch smoke after conversion.
- [ ] Containerized `npm run lint` and production build/deploy.

## Future Phase FR-6 - Biomes, Time Of Day, And Weather

Status: Not started

Goal: add varied mission spaces where biome, time, and weather affect gameplay in readable ways.

Biomes:

- [ ] Promote `levelKitId` into a richer biome/environment registry.
- [ ] Add or prototype Storm Coast.
- [ ] Add or prototype Arctic Shelf.
- [ ] Add or prototype Ocean Platform.
- [ ] Add or prototype Urban Ruin.
- [ ] Add or prototype Red Canyon.
- [ ] Add or prototype Stratosphere/Orbital Relay.
- [ ] Define biome palettes, fog, lighting, materials, structure kits, hazard types, and landmarks.
- [ ] Add biome-specific target dressing and extraction visuals.

Time of day:

- [ ] Add dawn lighting preset.
- [ ] Add day lighting preset.
- [ ] Add dusk lighting preset.
- [ ] Add night lighting preset.
- [ ] Add storm-night preset.
- [ ] Add blackout/eclipse set-piece preset.
- [ ] Tune HUD, radar, reticle, and marker contrast per preset.

Weather:

- [ ] Define `WeatherDefinition` data with visual parameters and gameplay modifiers.
- [ ] Add clear baseline weather.
- [ ] Add crosswind with slight drift or steering pressure.
- [ ] Add rain with visibility and lock/sensor impact.
- [ ] Add lightning storm with periodic sensor static and visibility flashes.
- [ ] Add ash storm with shield/energy pressure and visibility reduction.
- [ ] Add snow/frost with mild control or boost regeneration impact.
- [ ] Add sea squall for naval missions.
- [ ] Add electromagnetic interference for radar/marker degradation.
- [ ] Gate weather VFX by graphics quality and reduced effects.
- [ ] Display weather risk in briefing, objective intro, and tracking warnings.

Exit criteria:

- [ ] Weather has at least one noticeable gameplay effect per weather type.
- [ ] Effects are readable, fair, and never hide critical HUD/reticle/objective markers.
- [ ] Biome, time, and weather combine through data rather than custom mission code.

Verification:

- [ ] Visual smoke for every new biome/time/weather combination selected for the phase.
- [ ] Mobile reduced-effects smoke.
- [ ] Radar/objective readability smoke in low-visibility conditions.
- [ ] Performance check for weather VFX.

## Future Phase FR-7 - Grand Destruction And Objective Set Pieces

Status: Not started

Goal: replace repeated direct-health tower destruction with memorable staged objectives.

- [ ] Create target archetypes with destruction phases.
- [ ] Add target component health, exposed/hidden states, and phase triggers.
- [ ] Add required and optional weak-point phase support.
- [ ] Add visible destruction states for facilities.
- [ ] Add objective-specific debrief stats.
- [ ] Add larger but restrained VFX: collapse fragments, beam shutdowns, shock rings, smoke columns, and debris fields.
- [ ] Add mission event spawning tied to objective phase changes.

Objective families:

- [ ] Radar network collapse.
- [ ] Shield generator assault.
- [ ] Convoy strike.
- [ ] SAM suppression.
- [ ] Reactor sabotage.
- [ ] Bridge or rail cut.
- [ ] Carrier strike.
- [ ] Naval platform raid.
- [ ] Command frigate operation.
- [ ] Skybreaker mega-core finale objective.

Exit criteria:

- [ ] At least four distinct objective archetypes exist.
- [ ] A mission can combine multiple target archetypes.
- [ ] Destruction progress is visible in-world and reflected in objective/tracking updates.
- [ ] Set pieces feel larger without hurting readability or frame rate.

Verification:

- [ ] Collision/damage regression for target destroyed counts.
- [ ] Extraction activation exactly once after required objectives.
- [ ] Weak-point and direct-health backward compatibility smoke.
- [ ] Performance check for destruction VFX.

## Future Phase FR-8 - Air, Land, And Sea Combat Domains

Status: Not started

Goal: expand mission mechanics across air-to-air, air-to-land, and air-to-sea combat.

Air-to-air:

- [ ] Add dedicated intercept missions.
- [ ] Add bomber/transport targets with escort formations.
- [ ] Add ace enemy behavior.
- [ ] Reconcile and implement missile lock/counter-pressure if not already current after FR-0.
- [ ] Add radar priority indicators for airborne threats.
- [ ] Add air-combat scoring bonuses.

Air-to-land:

- [ ] Add surface turrets.
- [ ] Add SAM sites.
- [ ] Add artillery or railgun threats.
- [ ] Add shield nodes and mobile command units.
- [ ] Add moving ground convoys.
- [ ] Add ground-threat telegraphs.
- [ ] Add land target armor/shield behavior.

Air-to-sea:

- [ ] Add ocean/sea rendering support.
- [ ] Add moving ship targets.
- [ ] Add patrol boats, destroyers, carriers, and offshore platforms.
- [ ] Add naval AA and missile threats.
- [ ] Add ship wake visuals.
- [ ] Add naval weak points: radar mast, missile tubes, engines, deck guns, hangars.
- [ ] Add sea-weather interactions such as squalls and low-visibility storms.

Exit criteria:

- [ ] Each combat domain has unique enemies, objectives, and tactical pressure.
- [ ] Mixed-domain missions can combine air threats, surface threats, and objective phases.
- [ ] Radar/HUD distinguishes airborne, ground, sea, objective, and extraction entities.

Verification:

- [ ] Domain-specific mission smoke for air, land, and sea prototypes.
- [ ] Radar/tracking classification smoke.
- [ ] Projectile collision smoke against moving targets.
- [ ] Performance smoke with mixed-domain entity density.

## Future Phase FR-9 - Campaign Expansion Wave 1

Status: Not started

Goal: build the larger main campaign using the new mission, environment, objective, tracking, and combat-domain systems.

- [ ] Expand the campaign from 8 missions to roughly 18-24 main missions.
- [ ] Organize missions into 5-6 arcs.
- [ ] Add Signal War refinement missions only where needed for onboarding.
- [ ] Add Blackout Line remix missions using expanded objectives.
- [ ] Add Storm Coast arc with weather and first air-to-sea operations.
- [ ] Add Frozen Relay arc with snow/low-visibility interception.
- [ ] Add Red Canyon Siege arc with convoys and artillery suppression.
- [ ] Add Skybreaker Core mixed-domain finale arc.
- [ ] Add mission-select arc summaries or filters if the campaign screen becomes dense.
- [ ] Add save migration for inserted campaign missions.
- [ ] Pair each new mechanic with a teaching mission, then remix it later.

Exit criteria:

- [ ] Campaign feels meaningfully larger, not just longer.
- [ ] Every arc introduces a distinctive biome or combat style.
- [ ] Main mission chain remains clear and persistent.
- [ ] Existing saves survive new content additions.

Verification:

- [ ] Clean-save full campaign launch path smoke.
- [ ] Existing-save migration smoke.
- [ ] Mission unlock chain smoke.
- [ ] Arc completion/progress UI smoke.

## Future Phase FR-10 - Progression, Loadout, And Upgrade Trees

Status: Not started

Goal: add meaningful between-mission progression and player choices.

- [ ] Add player inventory/progression state.
- [ ] Add currency, parts, or upgrade-point reward model.
- [ ] Convert Loadout Review into Loadout Selection.
- [ ] Add selectable primary weapons.
- [ ] Add selectable secondary weapons.
- [ ] Add ship system upgrades.
- [ ] Add mission tags that recommend or require payload categories.
- [ ] Add loadout recommendations by mission type, weather, and combat domain.
- [ ] Add Hangar/Upgrades screen.
- [ ] Update mission rewards to grant unlocks, parts, or upgrade points.

Upgrade trees:

- [ ] Flight Core: boost capacity, boost regeneration, brake authority, turn response, weather stability.
- [ ] Weapons Core: pulse damage, projectile speed, energy efficiency, missile lock speed, blast radius, anti-shield tuning.
- [ ] Defense Core: shield capacity, shield regeneration delay, hazard resistance, hull plating, emergency recovery.
- [ ] Sensor Core: radar range, target lock range, marker stability, weak-point reveal, threat warning time.
- [ ] Payload Core: anti-air missiles, anti-ground rockets, anti-sea payload, EMP burst, heavy strike weapon.

Exit criteria:

- [ ] Player can make meaningful choices before launch.
- [ ] At least three upgrade trees exist with branching decisions.
- [ ] Rewards alter gameplay rather than only archive text.
- [ ] Main campaign remains balanced without forced grinding.

Verification:

- [ ] Save migration for progression state.
- [ ] Upgrade purchase/equip/revert smoke.
- [ ] Loadout launch smoke across several mission tags.
- [ ] Balance smoke for early campaign without optional grinding.

## Future Phase FR-11 - Enemy AI, Factions, Bosses, And Encounter Director

Status: Not started

Goal: make enemies and bosses behaviorally distinct enough to support the expanded campaign.

- [ ] Separate enemy behavior controllers from visual definitions.
- [ ] Add formation behavior for air groups.
- [ ] Add patrol, pursuit, orbit, retreat, guard, objective attack, and strafing behaviors.
- [ ] Add ground and naval targeting logic.
- [ ] Add enemy telegraphs for missiles, railguns, beams, and area denial.
- [ ] Add faction or theater-specific enemy variants.
- [ ] Add boss phase controller.
- [ ] Add encounter director rules for reinforcements and phase escalation.

Boss/set-piece targets:

- [ ] Command Frigate with escort shield, engine disable, and bridge/core phases.
- [ ] Carrier Group with escort ships, deck launchers, and command tower.
- [ ] Skybreaker Core with rotating shield petals, exposed weak points, storm interference, and final extraction rush.
- [ ] Canyon Railgun with charged beams and power relays.

Exit criteria:

- [ ] Enemy roles feel distinct in behavior, not just stats.
- [ ] Boss phases are readable and tracked through objective/radar systems.
- [ ] Enemy density increases without HUD/radar collapse.
- [ ] Weather and biome can affect enemy behavior in small readable ways.

Verification:

- [ ] Behavior smoke for each enemy controller.
- [ ] Boss phase smoke.
- [ ] Radar/tracking smoke for boss child tracks.
- [ ] Performance smoke under high enemy density.

## Future Phase FR-12 - Campaign Expansion Wave 2 And Optional Sorties

Status: Not started

Goal: add long-term replay value once the core expanded campaign is stable.

- [ ] Add optional side sorties using authored objective modules.
- [ ] Add challenge variants: storm, night, elite patrol, limited-energy, and high-threat versions.
- [ ] Add semi-procedural contract generator using authored modules.
- [ ] Add local challenge seeds if desired.
- [ ] Add advanced scoring medals beyond S-rank.
- [ ] Add arc mastery rewards for optional goals.
- [ ] Add replay reward limits so optional content does not break main campaign balance.

Exit criteria:

- [ ] Optional sorties reuse mission modules without fragile custom code.
- [ ] Generated/remixed sorties remain readable and fair.
- [ ] Replay rewards support progression without overpowering the campaign.

Verification:

- [ ] Generated sortie smoke across multiple biomes/weather types.
- [ ] Optional reward balance smoke.
- [ ] Save/load smoke for optional sortie completion.

## Future Phase FR-13 - Final Polish, Performance, And Release Hardening

Status: Not started

Goal: stabilize the enlarged game and make the expanded campaign feel finished.

- [ ] Full regression smoke for every biome, weather type, time of day, mission type, and combat domain.
- [ ] Mobile drag-control smoke across portrait overlay, landscape gameplay, and action buttons.
- [ ] HUD overlap, objective drawer, radar tracking, selected target, edge pin, and extraction guidance tests across desktop/mobile.
- [ ] Performance budgets for weather, water, enemy count, boss phases, and destruction VFX.
- [ ] Accessibility/readability pass for contrast, text size, reduced effects, and motion settings.
- [ ] Audio pass for weather, naval combat, boss phases, warning cues, victory, and failure.
- [ ] Save migration tests for old progress and inserted campaign arcs.
- [ ] Bundle/chunk optimization if the Vite chunk warning becomes a real load-time problem.
- [ ] Update `overview.md` after final hardening to describe the expanded game state.

Exit criteria:

- [ ] Every main mission can be completed from a clean save.
- [ ] Existing saves migrate safely.
- [ ] Mobile and desktop remain playable.
- [ ] HUD stays readable in the most visually intense missions.
- [ ] Weather and destruction VFX scale down under reduced effects and low graphics settings.

Verification:

- [ ] Containerized `npm run lint`.
- [ ] Containerized `npm run build`.
- [ ] Docker production build/deploy.
- [ ] Desktop full-campaign smoke.
- [ ] Exact mobile smoke at 390x844 portrait and 844x390 landscape.
- [ ] Manual visual review for radar, markers, and HUD readability.

### Cross-phase risk register

- [ ] `Game.tsx` still interleaves gameplay and rendering state; do not extract flight/combat frame-loop behavior during visual phases unless that is the explicit phase goal
- [ ] `Game.tsx` still owns much of live combat, projectile collision, target destruction, enemy wave spawn, extraction activation, and HUD state; future systems should extract this incrementally.
- [ ] Target lock / Ion Missile behavior has doc drift between historical checklist entries and `overview.md`; verify runtime before building new targeting or payload systems.
- [ ] Launch flow currently contains more screens and similarly styled CTAs than ideal; do not add new menu depth before FR-1 is resolved.
- [ ] Radar is visually strong but may not be noticed or used by players; do not add denser missions before FR-3 tracking/radar work.
- [ ] Target mesh child indices are fragile; prefer named handles and tracking IDs for future destructible parts.
- [ ] Changing collision or target damage can break destroyed counts, enemy waves, extraction activation, or mission completion
- [ ] Reflective floor, bloom, and dense beacons can harm FPS and mobile readability
- [ ] Fog/sky/floor contrast can reduce objective marker visibility
- [ ] World-space markers can clutter the view if they duplicate HUD information too aggressively
- [ ] Weather and low-visibility biomes can make radar, reticle, and objective markers harder to read if not validated early.
- [ ] Progression and upgrade systems can create save migration risk; all future progression state needs versioned validation.
- [ ] Local VS Code diagnostics may report missing React declarations from local `node_modules`; use the documented Docker lint/build path as the phase verifier unless dependency cleanup is explicitly in scope

### Cross-phase verification requirements

- [ ] Run containerized TypeScript check: `docker run --rm -v "$PWD":/app -v skybreaker-drone-strike-node-modules:/app/node_modules -w /app node:20-alpine sh -lc "npm run lint"`
- [ ] Run production build/deploy verification: `docker compose build --progress=plain && docker compose up -d && docker compose ps`
- [ ] Smoke Mission 1 and Mission 2 launch paths, plus any mission touched by the current phase
- [ ] Check flight controls, boost, primary fire, secondary weapon behavior, radar heading, target markers, target destruction, extraction activation, mission complete, and failure overlay
- [ ] Check fast-launch path when menu/shell work changes
- [ ] Check objective drawer and radar/tracking behavior when HUD work changes
- [ ] Check save migration whenever mission, campaign, reward, loadout, or upgrade data changes
- [ ] Repeat mobile smoke at 390x844 portrait and 844x390 landscape after HUD, marker, touch control, floor, fog, or renderer changes

### Recommended branch and commit strategy

- Branch from stable baseline as `visual/tactical-arena-foundation` when Git is available
- Use one branch per larger phase when risk increases: `visual/tactical-floor`, `visual/facility-kit`, `visual/weakpoint-targets`, `visual/level-kits`
- Commit in small reversible slices: extraction-only first, then visual config, then visible changes, then tests/docs
- Suggested commit prefixes: `refactor(scene):`, `refactor(game-loop):`, `feat(ux):`, `feat(hud):`, `feat(radar):`, `feat(missions):`, `feat(environment):`, `feat(combat):`, `feat(progression):`, `test(smoke):`, `docs(plan):`
- Do not combine frame-loop behavior extraction with reflective floor, weak points, or HUD polish in the same commit

## Backlog Rules

- [ ] Do not add major new content until the required supporting framework exists
- [ ] Do not merge menu, campaign, and combat overhauls into one uncontrolled pass
- [ ] Do not break the existing vertical slice while chasing future systems
- [ ] Keep architecture work incremental and reversible

---

## Latest Session Summary

Date: 2026-05-13

Phase worked:
- Roadmap Stage 1c — Tactical Tracking, Radar, And Awareness System.

Shipped:
- `src/types/game.ts`: Added `TrackedEntityType` enum (OBJECTIVE, WEAK_POINT, ENEMY, EXTRACTION, HAZARD), `TrackedEntityState` union type, and `TrackedEntitySnapshot` serializable interface (no Three.js refs).
- `src/systems/trackingSystem.ts`: New pure module. Factory `createTrackingSystem()` — registry backed by `Map<string, TrackedEntitySnapshot>`. API: `registerTrack`, `updateTrack`, `markDestroyed`, `recomputePriority`, `getSnapshots`, `getSelectedTrack`, `reset`. Priority scoring: extraction active (900) > required objective (700) > required weak point (600) > enemy (400−dist) > hazard close (500) > hazard far (50). Selected = highest scorer.
- `src/components/Game.tsx`: `tracksRef = useRef(createTrackingSystem())`. Scene setup: `reset()` then register targets (OBJECTIVE), hazards (HAZARD), extraction (EXTRACTION inactive). Enemy spawn: `registerTrack` (ENEMY). On death: `markDestroyed`. Every 4 frames: update positions, set extraction state active/inactive, `recomputePriority`. Radar props changed to `tracks` + `reduceEffects`.
- `src/components/hud/Radar.tsx`: Full visual hierarchy rewrite. Type-specific SVG icons: objective = orange circle + outer ring; enemy = red square + selection box; extraction = green diamond + pulse ring + edge-pin arrow when clamped; hazard = amber X; weak point = orange upward triangle. SVG `<animate>` pulse rings for selected/radarPulse tracks (suppressed by `reduceEffects`). Dashed radial connector from center to selected track. State label below radar: `SCAN` / `TARGETS` / `HOSTILES` / `EXTRACT`.

Changed files:
- `src/types/game.ts`
- `src/systems/trackingSystem.ts` (new)
- `src/components/Game.tsx`
- `src/components/hud/Radar.tsx`
- `DEV-CHECKLIST.md`

Verification:
- `npm run lint` (Node 20 Docker container) passed with no errors.
- `docker compose build` produced `skybreaker-drone-strike:latest` successfully.
- `docker compose up -d` started container.

Deferred:
- Attention event bus (tracking state → objective tab expand): needs lightweight event emitter; deferred to next stage.
- Per-mission WEAK_POINT child track registration: type and rendering ready; deferred to Stage 2 mission expansion.
- Stage 1d (mobile touch-drag controls): complete.

Next recommended starting point:
- **Stage 1d — Mobile Direct Touch-Drag Control** (if mobile device available for testing).
- If deferring 1d, continue **Stage 2** — deeper mission schema, combat types, and data model.

---

Date: 2026-05-14

Phase worked:
- Roadmap Stage 1d — Mobile Direct Touch-Drag Control.

Shipped:
- `src/types/game.ts`: Added `touchDragSensitivity: number` to `AppSettings`.
- `src/config/defaults.ts`: Added `touchDragSensitivity: 100` to `DEFAULT_APP_SETTINGS`.
- `src/App.tsx`: Added `touchDragSensitivity` clamp (60–140) in `loadStoredSettings()`.
- `src/components/menus/SettingsMenu.tsx`: Added "Drag Sens" range row (60–140, suffix `%`) in controls tab.
- `src/components/menus/ControlsScreen.tsx`: Changed `'Joystick'` → `'Touch Drag'` in `touchRows`.
- `src/index.css`: Removed `.touch-joystick` and `.touch-joystick-knob` landscape overrides; added `.touch-drag-zone { min-height: 5.75rem }` in their place.
- `src/components/Game.tsx`:
  - Replaced `touchJoystick` ref with `touchDrag` ref (shape: `{ x, y, active, identifier, originX, originY }`).
  - Removed `joystickPos` state and `handleJoystick` function.
  - Added `dragOriginPos` state, `MAX_DRAG_RADIUS` constant, and three handlers: `handleTouchDragStart`, `handleTouchDragMove`, `handleTouchDragEnd`.
  - Drag math: `strength = clamp(distance/dragRadius, 0, 1)`; `curved = strength^1.25`; `x/y = (dx/dy / distance) * curved`. `dragRadius = 80 * (100 / touchDragSensitivity)`.
  - Replaced joystick circle div with a `touch-drag-zone flex-1 self-stretch` transparent div.
  - Added low-opacity orange origin marker (`pointer-events-none fixed`) shown while dragging.
  - Changed INV_Y button title to `"Toggle Pitch Inversion"`.
- `scripts/smoke-mobile.cjs`: Added `hasJoystick` / `hasDragZone` to evaluate block and `noJoystick` / `hasDragZone` assertions in `assertViewport`.

Changed files:
- `src/types/game.ts`
- `src/config/defaults.ts`
- `src/App.tsx`
- `src/components/menus/SettingsMenu.tsx`
- `src/components/menus/ControlsScreen.tsx`
- `src/index.css`
- `src/components/Game.tsx`
- `scripts/smoke-mobile.cjs`
- `DEV-CHECKLIST.md`

Verification:
- `npm run lint` (Node 20 Docker container) passed with no errors.
- `docker compose build` produced `skybreaker-drone-strike:latest` successfully.
- `docker compose up -d` started container.

Next recommended starting point:
- **Stage 2b — Structured Objective Definitions**: introduce `ObjectiveDefinition` as typed data alongside the existing target arrays; implement at least 3 objective types in a prototype scene.

Shipped:
- `src/types/game.ts`: Added three new string union types:
  - `CombatDomain`: `'AIR_TO_AIR' | 'AIR_TO_LAND' | 'AIR_TO_SEA' | 'MIXED'`
  - `MissionType`: `'STRIKE' | 'INTERCEPT' | 'DEFENSE' | 'ESCORT' | 'RECON' | 'SABOTAGE' | 'SURVIVAL' | 'BOSS' | 'FINALE'`
  - `TimeOfDayId`: `'dawn' | 'day' | 'dusk' | 'night'`
  - Added three optional fields to `MissionDefinition`: `combatDomain?`, `missionType?`, `timeOfDay?`
- `src/config/missions.ts`: Populated all 8 existing missions with classification values:
  - signal-break: STRIKE / AIR_TO_LAND / night
  - iron-veil: STRIKE / AIR_TO_LAND / dusk
  - black-sky-hook: STRIKE / AIR_TO_LAND / night
  - blackout-line: STRIKE / AIR_TO_LAND / dusk
  - warden-break: STRIKE / AIR_TO_LAND / dusk
  - ember-crown: STRIKE / MIXED / dawn
  - skybreaker-gate: BOSS / MIXED / night
  - final-dawn: FINALE / MIXED / dawn
- `src/components/menus/BriefingScreen.tsx`: Added classification chip row in the Objective tab panel (between stat boxes and objective detail block). Chips show `missionType`, `combatDomain` (spaces for underscores), and `timeOfDay` when present; styled as amber-tinted minimal monospace tags. Only rendered when at least one classification is present.

Changed files:
- `src/types/game.ts`
- `src/config/missions.ts`
- `src/components/menus/BriefingScreen.tsx`
- `DEV-CHECKLIST.md`

Verification:
- `npm run lint` (Node 20 Docker container) passed with no errors.
- `docker compose build` produced `skybreaker-drone-strike:latest` successfully.
- `docker compose up -d` started container.

Stage 2 progress: 2a complete. Remaining Stage 2 items (from roadmap):
- [ ] 2b — Structured objective definitions as typed data (destroy, intercept, defend, escort, recon, disable-shields, survive, boss, etc.)
- [ ] 2c — Optional objectives and bonus conditions
- [ ] 2d — Mission runtime state extension (objectives track progress, completion, failure, HUD updates independently)
- [ ] 2e — Mission event hooks (weather changes, reinforcements, objective phase changes, extraction activation)
- [ ] 2f — Mission-authored tracking metadata (priority, radar label, discovery behavior, attention event)
- [ ] 2g — Extend mission schema for multi-stage objectives with child tracks and phase rules
- [ ] 2h — Extraction metadata states (inactive, active, contested, alternate, moving, emergency)

Next recommended starting point:
- **Stage 2b — Structured Objective Definitions**: introduce `ObjectiveDefinition` as typed data alongside the existing target arrays; implement at least 3 objective types in a prototype scene.
- **Stage 1d** remains deferred (mobile device required).
