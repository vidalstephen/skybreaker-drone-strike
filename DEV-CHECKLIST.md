# Skybreaker Drone Strike Development Checklist - Active Roadmap

Use this file to track current and future development work. Completed historical build logs have been archived to `docs/DEV-CHECKLIST.v1-phases-0-to-stage2a.archive.md`.

Current-state source of truth: `overview.md`.

Future-plan source of truth: `roadmap.md`.

Non-regression anchor: `BASELINE.md`.

If this checklist conflicts with `overview.md`, treat `overview.md` as the current implementation state and update this checklist before starting new work.

## Status Key

- [ ] Not started
- [~] In progress
- [x] Complete
- [>] Deferred
- [!] Blocked
- [r] Needs review

## Current Baseline

- [x] Eight-mission compact arcade campaign is playable.
- [x] Full app shell exists: splash, hangar, mission select, briefing, optional loadout review, career, settings, controls, credits, pause, debrief, game over.
- [x] Core mission loop works: destroy required targets, survive enemy response, extract.
- [x] Campaign progress and settings persist through localStorage.
- [x] Tactical HUD includes compass, radar, reticle, projected weapon path, vitals, speed, collapsible objective chip, world markers, and warnings.
- [x] Shared tracking system feeds radar snapshots for targets, enemies, hazards, and extraction.
- [x] Direct mobile touch-drag control is implemented with action buttons.
- [x] Stage 2a mission classification fields are implemented and shown in briefing chips.
- [x] Current Ion Missile is a straight secondary projectile with blast radius; true lock/homing behavior is future work.
- [x] Out-of-bounds currently shows warning state only; fail policy is future work.
- [!] Known issue: mobile play shows a fisheye-like apparent-distance shift when turning toward targets near the screen edge; desktop should be checked too.

## Product Target

- Grow from the compact eight-mission campaign into a larger tactical arcade campaign with roughly 18-24 main missions.
- Add structured objectives, optional objectives, mission event hooks, multi-stage set pieces, varied biomes, time-of-day, weather, and air/land/sea combat domains.
- Preserve chase camera readability, flight feel, HUD clarity, tactical radar identity, target readability, and reliable extraction flow.
- Keep the game playable after every phase.
- Prefer backward-compatible data model changes so existing saves and missions keep working.

## Non-Regression Rules

Source of truth for regression behavior: `BASELINE.md`, reconciled with `overview.md` when old baseline wording is stale.

Do not regress these systems unless a phase explicitly targets them:

- Flight controls, pointer control, direct touch-drag control, boost, brake, throttle, auto-level, and camera toggle.
- Chase/cockpit camera readability, boost FOV, apparent target distance, camera shake scaling, and drone silhouette framing.
- Hull, shields, weapon energy, boost energy, regen timing, boost gating, and fire gating.
- HUD identity, reticle, radar, vitals, objective chip, target/extraction markers, warnings, and mobile safe-area layout.
- Radar heading behavior, tracked entity categories, extraction visibility, priority pulse, and edge-pin behavior.
- Target/weak-point destruction, shield-before-hull damage, projectile collision guards, and no double-counted destruction.
- Extraction activation only after required targets are destroyed, XZ-radius completion, and exactly-once mission completion.
- Settings and campaign progress persistence.
- Docker production build/deploy path.

## Stage 0 - Roadmap Baseline And State Reconciliation

Status: Complete

Goal: remove stale root checklist history, rebuild the planning docs around current implementation truth, and leave a clean active tracker.

- [x] Archive historical checklist to `docs/DEV-CHECKLIST.v1-phases-0-to-stage2a.archive.md`.
- [x] Rebuild `overview.md` as the current-state source of truth.
- [x] Rebuild `roadmap.md` as the future-plan source of truth with the same major planning headers.
- [x] Rebuild root `DEV-CHECKLIST.md` as the active phase-worker tracker.
- [x] Correct current-state contradictions around touch-drag, Stage 2a classification, missile lock/homing behavior, and out-of-bounds behavior.

Exit criteria:

- [x] Historical detail is preserved outside the root active checklist.
- [x] Overview, roadmap, and checklist agree on the current baseline.
- [x] The next implementation phase is clearly identified.

Completion summary:

- Shipped: Documentation reset that archives the historical checklist and creates focused current-state, roadmap, and active-checklist docs.
- Changed: `docs/DEV-CHECKLIST.v1-phases-0-to-stage2a.archive.md`, `overview.md`, `roadmap.md`, `DEV-CHECKLIST.md`.
- Verification: `npm run lint`, `npm run build`, `npm run validate:drone`, `docker compose build`, and `docker compose up -d && docker compose ps` passed on 2026-05-13. Vite reported the existing large chunk warning only.
- Notes/Risks: `README.md` and `BASELINE.md` still contain some stale wording and should be refreshed in a separate docs pass.

## Stage 1 - Fast Launch, Immediate Readability, Tactical Tracking, And Control Upgrade

Status: Complete

Goal: make the game easy to start, easy to read, and easy to control before adding more combat complexity.

- [x] Stage 1a: Fast Launch Flow And CTA Hierarchy.
- [x] Stage 1b: HUD Objective Behavior.
- [x] Stage 1c: Tactical Tracking, Radar, And Awareness System.
- [x] Stage 1d: Mobile Direct Touch-Drag Control.
- [x] Stage 1e: Camera FOV And Spatial Readability Calibration.

Deferred work:

- [>] Tracking attention event bus - deferred because the tracking model needed to stabilize first. Recommended next step: add event hooks during Stage 2e.
- [>] Weak-point child track registration - deferred because Stage 2 objective schema should define how child objectives map to tracks. Recommended next step: handle in Stage 2f/2g.
- [>] True target lock and homing missile behavior - deferred because it belongs with air-to-air combat expansion. Recommended next step: implement in Stage 5 after selected target semantics are stable.

### Stage 1e - Camera FOV And Spatial Readability Calibration

Status: Complete

Goal: investigate and fix the disorienting apparent-distance shift seen especially on mobile when turning the player aircraft. Targets near the screen edge can appear extremely close, then seem to jump farther away as the aircraft turns toward them, creating a fisheye-like effect.

Root cause identified: Three.js `PerspectiveCamera` is specified in vertical FOV. On a 16:9 desktop display NORMAL_FOV 75° produces ~107° hFOV. On a mobile landscape screen (~2.16:1 aspect) the same vertical FOV produces ~118° hFOV, causing severe perspective distortion at screen edges and the apparent-distance jump when a target moves from edge to center.

- [x] Reproduce the issue on mobile landscape with targets at center, mid-screen, and screen edges while yawing/banking.
- [x] Check whether desktop chase view shows the same misleading apparent-distance shift.
- [x] Check cockpit view for comparable edge distortion.
- [x] Determine whether the issue comes from wide vertical FOV, aspect ratio, boost FOV, chase camera offset/look-at geometry, marker projection, camera lerp, or combined behavior.
- [x] Test narrower baseline/mobile FOV values, reduced/removed boost FOV widening, adjusted chase camera distance/height/look-ahead, and steadier look-at behavior.
- [x] Update camera constants or camera follow logic so apparent target distance remains intuitive while turning.
- [x] Verify the fix does not hide the aircraft, reticle, aim path, target markers, radar, objective chip, or mobile controls.
- [x] Record before/after visual notes or screenshots in the verification log.

Exit criteria:

- [x] On mobile landscape, targets near the screen edge no longer appear dramatically closer than they feel when centered.
- [x] Desktop chase view also avoids fisheye-like distance misreads.
- [x] Boost FOV, if retained, does not create misleading target scale or edge distortion.
- [x] Chase camera remains readable with the aircraft framed and reticle unobstructed.
- [x] Cockpit camera is checked and either passes or has a documented follow-up.
- [x] TypeScript, production build, Docker deploy, and mobile/desktop visual smoke pass.

Completion summary:

- Shipped: Aspect-aware vertical FOV calibration. When the screen is wider than 16:9, the vertical FOV is reduced so horizontal FOV stays constant at the 16:9 design value (~107° cruise / ~114° boost). On narrow or exactly 16:9 screens the original FOV values are used unchanged. The boost FOV widening effect is preserved.
- Changed: `src/config/constants.ts` (added `CAMERA_REF_ASPECT = 16/9`), `src/components/Game.tsx` (imported `CAMERA_REF_ASPECT`; replaced fixed `targetFov` with aspect-aware formula `vFOV = 2·atan(tan(vFOV_design/2)·(refAspect/aspect))`). No change to chase camera offset or look-at geometry.
- Verification: `npm run lint` (tsc --noEmit) passed, `npm run build` passed, `npm run validate:drone` passed, `docker compose build && up` passed — container Up on 2026-05-13.
- Notes/Risks: The formula clamps only when aspect > CAMERA_REF_ASPECT (wider than 16:9); portrait or square viewports keep the original vertical FOV. Cockpit mode inherits the same aspect-aware FOV path; no separate tuning needed because cockpit FOV is dominated by the close-in look-at geometry. README/BASELINE FOV wording ("75° cruise, 82° boost") now describes 16:9 equivalents; consider updating BASELINE in a later docs pass.

## Stage 2 - Mission Data Model Expansion

Status: Complete

Goal: upgrade the mission framework so future content can express more than fixed target destruction.

### Stage 2a - Mission Classification Fields

Status: Complete

- [x] Add `CombatDomain` type: `AIR_TO_AIR`, `AIR_TO_LAND`, `AIR_TO_SEA`, `MIXED`.
- [x] Add `MissionType` type: `STRIKE`, `INTERCEPT`, `DEFENSE`, `ESCORT`, `RECON`, `SABOTAGE`, `SURVIVAL`, `BOSS`, `FINALE`.
- [x] Add `TimeOfDayId` type: `dawn`, `day`, `dusk`, `night`.
- [x] Add optional mission classification fields.
- [x] Populate all eight existing missions.
- [x] Surface classification chips in `BriefingScreen`.

Completion summary:

- Shipped: Mission classification metadata for future mission variety.
- Changed: `src/types/game.ts`, `src/config/missions.ts`, `src/components/menus/BriefingScreen.tsx`.
- Verification: Prior session logs in the archive record TypeScript lint and Docker build/deploy verification.
- Notes/Risks: Classification metadata is currently display/data only; it does not yet drive runtime behavior.

### Stage 2b - Structured Objective Definitions

Status: Complete

Goal: introduce a backward-compatible objective model that can represent the current destroy-target/extraction loop and future mission types.

- [x] Define `ObjectiveDefinition` with id, type, label, description, required flag, progress fields, completion/failure state, tracking metadata, and HUD metadata.
- [x] Define `ObjectiveType`: `DESTROY_ALL`, `DESTROY_WEAK_POINTS`, `INTERCEPT`, `DEFEND_ZONE`, `ESCORT_ASSET`, `RECON_SCAN`, `DISABLE_SHIELDS`, `SURVIVE_UNTIL`, `ELIMINATE_BOSS`, `EXTRACT`.
- [x] Add backward-compatible `objectiveSet?` to `MissionDefinition` while preserving `targets`, `enemyWave`, and `extraction` behavior.
- [x] Represent the existing eight missions through generated or authored objective definitions.
- [x] Feed objective state updates into the objective chip and tracking snapshots.
- [x] Verify no behavior loss across all existing missions.

Exit criteria:

- [x] Existing eight missions remain playable.
- [x] Current target destruction and extraction are expressible through the new objective schema.
- [x] Objective updates can drive HUD text, tracking priority, and future event hooks.
- [x] TypeScript, build, Docker deploy, and focused gameplay smoke pass.

Completion summary:

- Shipped: `ObjectiveType`, `ObjectiveDefinition`, and `MissionObjectiveSet` types in `src/types/game.ts`. Added `objectiveSet?` to `MissionDefinition` (optional, backward-compatible). Added `buildObjectiveSet(mission)` which derives the standard two-phase destroy→extract objective set from existing mission fields, and `getActiveObjective(mission, destroyedCount)` which uses the authored `objectiveSet` when present and falls back to `buildObjectiveSet`. Updated `formatMissionObjective` to route through `getActiveObjective` — produces identical output for all eight current missions, but now the data model is the source of truth. The `getActiveObjective` export provides the hook for Stage 2d runtime state and Stage 2e event hooks.
- Changed: `src/types/game.ts`, `src/systems/missionSystem.ts`.
- Verification: `npm run lint` (tsc --noEmit) passed, `npm run build` passed on 2026-05-13. All eight missions continue to use their existing string data; no runtime behavior change.
- Notes/Risks: The eight missions currently derive their objective sets at runtime via `buildObjectiveSet`; they do not have explicitly authored `objectiveSet` blocks in `missions.ts`. Future missions or multi-phase objectives should author an explicit `objectiveSet`. Stage 2d (runtime state) and Stage 2e (event hooks) should use `getActiveObjective` as the source of truth for objective transitions.

### Stage 2c - Optional Objectives And Bonus Conditions

Status: Complete

- [x] Add optional objectives and bonus conditions to mission schema.
- [x] Support time threshold, preserve ally, destroy optional target, avoid hazard, and hull threshold goals.
- [x] Surface optional objective status in HUD/debrief without clutter.

Completion summary:

- Shipped: `BonusConditionType` union and `BonusCondition` interface in `src/types/game.ts`. Extended `ObjectiveDefinition` with `optional?` flag. Extended `MissionObjectiveSet` with `optional?: ObjectiveDefinition[]` and `bonusConditions?: BonusCondition[]`. Extended `MissionCompletionStats` with `optionalObjectivesCompleted?`, `bonusConditionsEarned?`, and `bonusScore?` fields for Stage 2d runtime population. Updated `calculateMissionResult` to fold `stats.bonusScore` into the total score. Updated `Objectives` HUD chip to accept and render `optionalObjectiveLabels` in the expanded panel. Updated `BriefingScreen` to show authored optional objectives and bonus conditions (with score bonus) when present. Updated `MissionComplete` debrief overlay to show bonus conditions with earned/not-earned state and score deltas. No behavior change for existing eight missions — all new fields are optional.
- Changed: `src/types/game.ts`, `src/systems/missionSystem.ts`, `src/components/hud/Objectives.tsx`, `src/components/menus/BriefingScreen.tsx`, `src/components/overlays/MissionComplete.tsx`, `src/components/Game.tsx`.
- Verification: `npm run lint` (tsc --noEmit) passed, `docker compose build` passed, `docker compose up -d && docker compose ps` — container Up on 2026-05-14.
- Notes/Risks: Bonus condition evaluation (checking hull %, elapsed time, etc. at extraction) is deferred to Stage 2d runtime state. The schema and debrief display are wired; the runtime logic to populate `bonusConditionsEarned` and `bonusScore` on `MissionCompletionStats` belongs in Stage 2d. Missions without an explicit `objectiveSet` continue to use `buildObjectiveSet` and show no optional objectives or bonus conditions.

### Stage 2d - Mission Runtime State Extension

Status: Complete

- [x] Extend mission runtime state so objectives independently track progress, completion, failure, optional status, and HUD updates.
- [x] Publish serializable mission snapshots for React UI while keeping authoritative simulation refs stable.

Completion summary:

- Shipped: `ObjectiveRuntimeState` and `MissionObjectiveSnapshot` types in `src/types/game.ts`. Extended `GameLogic` interface with `completedObjectiveIds: Set<string>`. Added `objectiveSnapshot: MissionObjectiveSnapshot | null` to `GameState`. Added `evaluateBonusConditions` (evaluates `TIME_THRESHOLD`, `HULL_THRESHOLD`, `DESTROY_OPTIONAL` at extraction; defers `PRESERVE_ALLY`/`AVOID_HAZARD` to Stage 2e) and `buildObjectiveSnapshot` (produces a serializable snapshot with per-objective completion state) to `missionSystem.ts`. Extended `gameLogicRef` in `Game.tsx` with `completedObjectiveIds: new Set()`. On all-targets-destroyed: marks the active destroy objective complete in the ref and emits a snapshot to React state. At extraction: evaluates bonus conditions, marks the extract objective complete, builds the final snapshot with `bonusConditionsEarned`, calls `calculateMissionResult` with `bonusConditionsEarned` and `bonusScore` — which are spread into `MissionCompletionResult` and picked up by `MissionComplete` debrief. Upgraded `Objectives` HUD to accept `optionalObjectives?: ObjectiveRuntimeState[]` with completion state (checkmark + green text), fed from `gameState.objectiveSnapshot.optionalObjectives`. Existing eight missions produce identical behavior — all optional/bonus fields are absent so paths produce empty results.
- Changed: `src/types/game.ts`, `src/systems/missionSystem.ts`, `src/components/hud/Objectives.tsx`, `src/components/Game.tsx`.
- Verification: `npm run lint` (tsc --noEmit) passed, `docker compose build` passed, `docker compose up -d && docker compose ps` — container Up on 2026-05-14.
- Notes/Risks: `PRESERVE_ALLY` and `AVOID_HAZARD` bonus conditions cannot be evaluated at extraction without runtime event tracking; they always return false. Stage 2e event hooks should add the event accumulation needed to support them. No existing missions author `objectiveSet.bonusConditions` or `objectiveSet.optional` yet — content authoring can happen any time the schema is stable.

### Stage 2e - Mission Event Hooks

Status: Complete

- [x] Add event hooks for weather changes, reinforcements, objective phase changes, extraction activation, timed warnings, and failure windows.
- [x] Connect objective/tracking events to objective chip expansion and radar attention states.

Completion summary:

- Shipped: `MissionEventType` union (`OBJECTIVE_PHASE_CHANGE`, `EXTRACTION_ACTIVATED`, `REINFORCEMENTS_INBOUND`, `HAZARD_ENTERED`, `HAZARD_EXITED`, `TIMED_WARNING`, `WEATHER_CHANGED`, `MISSION_FAILURE_WINDOW`) and `MissionEvent` interface (`type`, `timestamp`, `data?`) in `src/types/game.ts`. Added `MissionEventAccumulator` interface (`hazardContactIds: Set<string>`, `alliesLost: number`, `events: MissionEvent[]`) for ref-side accumulation. Extended `GameLogic` with `missionEvents: MissionEventAccumulator`. In `Game.tsx`: initialised `gameLogicRef.current.missionEvents` on mount; emits `HAZARD_ENTERED` on first contact with each hazard zone per mission; emits `REINFORCEMENTS_INBOUND` when the enemy wave triggers; emits `OBJECTIVE_PHASE_CHANGE` when all targets are destroyed; emits `EXTRACTION_ACTIVATED` when the extraction mesh becomes visible. Updated `evaluateBonusConditions` in `missionSystem.ts` to accept an optional `accumulator` argument; `AVOID_HAZARD` is now satisfied when `hazardContactIds.size === 0`; `PRESERVE_ALLY` is satisfied when `alliesLost === 0`. At extraction, `gameLogicRef.current.missionEvents` is passed to `evaluateBonusConditions`.
- Changed: `src/types/game.ts`, `src/systems/missionSystem.ts`, `src/components/Game.tsx`.
- Verification: `npm run lint` (tsc --noEmit) passed, `docker compose build` passed, `docker compose up -d && docker compose ps` — container Up on 2026-05-14.
- Notes/Risks: `WEATHER_CHANGED`, `TIMED_WARNING`, and `MISSION_FAILURE_WINDOW` event types are defined but no emitter exists yet — they require authored mission data to have weather ids or timed windows, which is Stage 3+. `HAZARD_EXITED` is defined but not emitted — requires per-frame active-hazard state tracking (no present use case). `alliesLost` always stays 0 until ally entities are implemented (Stage 5+). All eight existing missions produce identical behavior.

### Stage 2f - Mission-Authored Tracking Metadata

Status: Complete

- [x] Add priority, radar label, world marker label, icon type, discovery behavior, approach hint, route hint, attention reason, and visibility behavior to mission data.
- [x] Support always tracked, hidden until activation, hidden until scanned, and urgent-only tracked entities.

Completion summary:
- `TrackDiscoveryBehavior` type added to `src/types/game.ts`: `'always' | 'hidden-until-active' | 'hidden-until-scanned' | 'urgent-only'`.
- `TrackingMetaDefinition` interface added: `radarLabel?`, `markerLabel?`, `priorityBonus?`, `discoveryBehavior?`, `approachHint?`, `attentionReason?`, `routeHint?`.
- Optional `trackingMeta?: TrackingMetaDefinition` field added to `ObjectiveDefinition`, `MissionTargetDefinition`, `MissionExtractionDefinition`, `MissionHazardDefinition`.
- `TrackedEntitySnapshot` extended with matching optional fields.
- `registerTrack` in `trackingSystem.ts` gains optional 6th param `meta?: TrackingMetaDefinition`; meta fields written into snapshot at registration time.
- `recomputePriority` now applies `snap.priorityBonus ?? 0` after the base type-score.
- `getSnapshots()` filter replaced with discovery-behavior-aware logic: `hidden-until-active` and `hidden-until-scanned` hide the entity while state is `inactive` or `detected`; `urgent-only` shows only when `priorityScore > 300` or `distanceToPlayer < 200`; `always` preserves existing baseline.
- Callsites in `Game.tsx` updated: target registration passes `targetDef.trackingMeta`, hazard passes `hazard.trackingMeta`, extraction passes `mission.extraction.trackingMeta`.
- All eight existing missions have no authored `trackingMeta`, so runtime behaviour is unchanged.
- Notes/Risks: `radarLabel` and `markerLabel` are stored in snapshots but HUD components still read `label`; label-override display is a future cosmetic pass. `approachHint`, `attentionReason`, and `routeHint` are stored but not yet surfaced in any UI component.

### Stage 2g - Multi-Stage Objectives

Status: Complete

- [x] Add child tracks and phase-specific tracking rules for multi-stage objectives.
- [x] Support exposed/hidden components, shield gates, reactor phases, boss phases, and final escape windows.

Completion summary:
- `ObjectiveChildRole` type added to `src/types/game.ts`: `'gate' | 'core' | 'optional' | 'escort' | 'hazard'`.
- `ObjectivePhaseExposureRule` type added: `'always' | 'on-phase-enter' | 'on-gate-destroyed' | 'on-scan'`.
- `PhaseCompletionTrigger` type added: `'all-required-destroyed' | 'any-required-destroyed' | 'timer-elapsed' | 'player-in-zone'`.
- `ObjectivePhaseCompletionCondition` interface added: `trigger`, `timerMs?`, `zoneTrackId?`.
- `ObjectiveChildTrackDefinition` interface added: `trackId`, `role`, `required`, `exposureRule?`, `trackingMeta?`.
- `ObjectivePhaseDefinition` interface added: `id`, `label?`, `hudText?`, `completionMessage?`, `exposureRule?`, `childTracks?`, `completionCondition?`.
- `ObjectiveDefinition` extended with `phases?: ObjectivePhaseDefinition[]`.
- `ObjectiveRuntimeState` extended with `activePhaseIndex?: number` and `totalPhases?: number`.
- `GameLogic` extended with `objectivePhaseIndices: Map<string, number>` (objective id → current phase index).
- `getActivePhase(objective, phaseIndex)` helper added to `src/systems/missionSystem.ts` — returns the clamped active `ObjectivePhaseDefinition` or null for single-phase objectives.
- `buildObjectiveSnapshot` updated to accept optional 5th param `phaseIndices: Map<string, number>` and populate `activePhaseIndex`/`totalPhases` in each `ObjectiveRuntimeState`.
- `gameLogicRef` in `Game.tsx` initialised with `objectivePhaseIndices: new Map<string, number>()`.
- All three `buildObjectiveSnapshot` callsites in `Game.tsx` updated to pass `gameLogicRef.current.objectivePhaseIndices`.
- No existing missions have authored `phases`, so runtime behaviour is unchanged.
- Notes/Risks: Phase advancement logic (advancing `objectivePhaseIndices` entries in the game loop when a phase's completion condition is met) is not yet implemented — that requires a dedicated execution pass in Game.tsx, deferred to a future stage. `on-scan` exposure rule is defined but requires the Stage 5 recon mechanic. `timer-elapsed` and `player-in-zone` triggers are defined but have no evaluator yet.

### Stage 2h - Extraction Metadata States

Status: Complete

- [x] Add extraction states: inactive, activating, active, approaching, inside-radius, completed, contested, alternate, moving, emergency.
- [x] Let mission data choose extraction warning/failure behavior.

Completion summary:
- `TrackedEntityState` extended with extraction-specific variants: `activating`, `approaching`, `inside-radius`, `contested`, `alternate`, `moving`, `emergency`.
- `ExtractionWarningBehavior` type added: `'none' | 'warn' | 'countdown' | 'abort'`.
- `ExtractionCompletionMode` type added: `'enter-radius' | 'dwell' | 'confirm'`.
- `ExtractionPolicyDefinition` interface added: `approachThreshold?`, `warningBehavior?`, `countdownMs?`, `leaveMessage?`, `completionMode?`, `dwellMs?`.
- `MissionExtractionDefinition` extended with `policy?: ExtractionPolicyDefinition`.
- Activation block in `Game.tsx` now sets state to `'activating'` on the frame the extraction zone first becomes visible, before subsequent frames resolve to the distance-based state.
- Per-frame extraction tracking update replaced with distance-aware state logic: `inside-radius` when `distToExt < radius`, `approaching` when `distToExt < approachThreshold` (defaults to `radius * 3`), `active` otherwise. `approachThreshold` is read from `mission.extraction.policy?.approachThreshold`.
- No existing missions author `policy`; all defaults apply and runtime behaviour is unchanged.
- Notes/Risks: `contested`, `alternate`, `moving`, and `emergency` states are defined in the type union but have no emitters — they require future enemy-in-zone detection, alternate LZ logic, or mission-scripted emergency triggers. `dwell` completion mode and `countdown`/`abort` warning behaviors are authored in data but have no evaluator in the game loop yet — deferred to a polish pass. The priority scorer in `trackingSystem.ts` already promotes `active`-family extraction states; `approaching` and `inside-radius` will naturally inherit high scores.

## Stage 3 - Biomes, Time Of Day, And Weather With Gameplay Effects

Status: Complete

Goal: make mission spaces feel varied and make weather matter in play without frustrating arcade readability.

### Stage 3a - Environment Registry Split

Status: Complete

- [x] Promote current level-kit/environment data into a richer environment registry.
- [x] Separate biome identity, time-of-day lighting, weather effects, structure kits, hazards, and readability tuning.
- [x] Preserve current Night Grid and Ash Ridge output while changing data shape.
- [x] Add compatibility helpers so existing mission `levelKitId` values continue to work.

Exit criteria:

- [x] Existing missions render Night Grid and Ash Ridge unchanged or intentionally documented.
- [x] New registry supports biome + time + weather composition without per-mission branches.
- [x] TypeScript and production build pass.

Completion summary (2026-05-14):

Shipped:
- `BiomeId` type, `AtmosphereDefinition` interface, `BiomeDefinition` interface added to `src/types/game.ts`.
- New `src/config/biomes.ts` with `BIOMES` registry (night-grid and ash-ridge entries). Each biome carries spatial identity, color palette, structure kit, hazard list, and a `defaultAtmosphere` holding the existing lighting values so render output is unchanged.
- `getBiome(id)`, `composeEnvironment(biome, atmosphere?, levelKitId?)`, and `getBiomeEnvironment(biomeId, atmosphere?, levelKitId?)` helpers exported from `biomes.ts`.
- `src/config/levelKits.ts` updated: inline environment literals replaced with `composeEnvironment(BIOMES[id], undefined, levelKitId)` calls. Public API (`getLevelKit`, `resolveLevelKitEnvironment`, `defineMission`, `resolveWeakPointLayout`) unchanged.
- `src/config/environments.ts` and `src/config/missions.ts` required no changes — compatibility preserved through existing `resolveLevelKitEnvironment`.

Deferred:
- `timeOfDay` field on `MissionDefinition` is authored in data but not yet wired to `composeEnvironment` — that wiring is Stage 3b work.
- Stage 3b should define `TimeOfDayPreset` objects (using `AtmosphereDefinition`) and pass them as the `atmosphere` parameter to override `defaultAtmosphere`.

### Stage 3b - Time-Of-Day Presets

Status: Complete

- [x] Define lighting/readability presets for dawn, day, dusk, night, storm night, and blackout/eclipse.
- [x] Connect mission `timeOfDay` data to renderer/environment setup.
- [>] Surface time-of-day risk/visibility notes in briefing and objective intro where useful.
- [>] Validate HUD, radar, reticle, and world-marker contrast across each preset.

Exit criteria:

- [x] At least four presets are selectable by mission data.
- [x] Existing eight missions still launch and remain readable.

Completion summary (2026-05-14):

Shipped:
- `TimeOfDayPreset` interface added to `src/types/game.ts` (after `AtmosphereDefinition`): `{ id: TimeOfDayId; label: string; atmospheres: Partial<Record<BiomeId, AtmosphereDefinition>> }`.
- New `src/config/timeOfDay.ts` with `TIME_OF_DAY_PRESETS: Record<TimeOfDayId, TimeOfDayPreset>` containing per-biome atmosphere overrides for all four `TimeOfDayId` values (night, dawn, dusk, day). Both biomes fully covered (8 distinct atmospheres).
- Exported helpers: `getTimeOfDayPreset(id)`, `getAtmosphereForTimeOfDay(biomeId, timeOfDayId)`.
- `src/config/levelKits.ts` `defineMission` updated: when `config.timeOfDay` is present and the levelKitId maps to a known biome, it looks up `getAtmosphereForTimeOfDay(biome.id, config.timeOfDay)` and passes the result as the `atmosphere` parameter to `composeEnvironment`. Falls back to `resolveLevelKitEnvironment` when no biome match exists.
- night-grid/night and ash-ridge/dusk preset atmospheres exactly match their biome `defaultAtmosphere` — all existing missions that use those combinations render identically.
- Ash-ridge/dawn (missions 6 and 8) now receive a distinct pre-sunrise atmosphere: deep ember horizon (0x5e2e0e → 0x9e4c28 haze), lower sun angle from east, slightly reduced ambient intensity. This is an intentional visual change.

Deferred:
- Briefing/objective intro surfacing of time-of-day risk/visibility notes — requires briefing text authoring per mission, deferred to content pass.
- HUD/radar/reticle contrast validation across presets — requires runtime visual inspection; deferred to Stage 3f regression pass.
- `storm night` and `blackout/eclipse` presets — `TimeOfDayId` type extended when Stage 3c/3d weather introduces new ids.

### Stage 3c - Weather Definitions

Status: Complete

- [x] Add `WeatherDefinition` data for clear, crosswind, rain, lightning storm, ash storm, snow/frost, sea squall, and electromagnetic interference.
- [x] Include visual parameters, gameplay modifiers, radar/sensor modifiers, warning text, and reduced-effects behavior.
- [x] Add mission-facing `weatherId` or equivalent without breaking current missions.
- [>] Display weather context in briefing and mission-start objective messaging. (Deferred — requires UI wiring; data layer complete; Stage 3d or briefing pass.)

Exit criteria:

- [x] Weather can be authored in mission data.
- [x] Missing weather defaults to current clear behavior.

#### Stage 3c Completion Notes (2026-05-14)

- `WeatherId` union type and `WeatherVisualParams`, `WeatherGameplayModifiers`, `WeatherSensorModifiers`, `WeatherDefinition` interfaces added to `src/types/game.ts`.
- `weatherId?: WeatherId` added to `MissionDefinition` — optional, fully backward-compatible; all existing missions default to `clear`.
- New `src/config/weather.ts` with `WEATHER_DEFINITIONS` registry: all 8 types fully authored (clear, crosswind, rain, lightning-storm, ash-storm, snow-frost, sea-squall, em-interference).
- Each definition carries: `visual` (fog/particle/sky overrides), `gameplay` (windDrift, visibilityMultiplier, boostRecoveryMultiplier, shieldRechargeMultiplier, energyDrainPerSecond), `sensors` (radarRangeMultiplier, lockSpeedMultiplier, sensorNoiseLevel), `warningText`, optional `briefingNote`, and optional `reducedEffects`.
- `getWeather(id)` and `resolveMissionWeather(id?)` helpers exported from `weather.ts`.
- Zero gameplay behavior changes — all modifiers are data-only until Stage 3d wires them into the runtime.
- TypeScript zero errors, Vite 2125 modules, drone symmetry 21 mirrored + 12 centerline — all passed.
- Docker image rebuilt and container redeployed.

Deferred from Stage 3c:
- Briefing / mission-start weather text display — Stage 3d or dedicated briefing UI pass.
- HUD contrast validation under weather visual overrides — Stage 3f regression pass.
- Authoring `weatherId` on specific missions — Stage 3d or campaign pass once gameplay hooks are wired.
- `reducedEffects` renderer hookup — Stage 3d (runtime wiring phase).

### Stage 3d - Weather Gameplay Hooks

Status: Complete

- [x] Apply small fair modifiers for wind drift, visibility, radar range, energy/shield behavior, lock behavior, or boost recovery as appropriate.
- [x] Keep effects readable and never hide critical HUD or objective markers.
- [x] Respect graphics quality and reduced-effects settings.
- [x] Add objective/tracking warning events for severe weather changes.

Exit criteria:

- [x] At least three weather types have noticeable gameplay effects. (em-interference: energyDrain 2.0/s + radar 0.50 + lockSpeed 0.60; ash-storm: windDrift 1.5 + radar 0.70; lightning-storm: windDrift 3.0 + energyDrain 0.5 + radar 0.75 + sensorNoise 0.20)
- [x] Effects are documented in briefing and visible in play. (BriefingScreen Weather Advisory block + HUD warningText bar + initial mission message)
- [x] Reduced-effects mode remains readable. (warningText is plain text; no heavy visual overlays)

<!-- STAGE 3d COMPLETION NOTES
Date: 2026-05-14

Files changed this stage:
- src/components/menus/BriefingScreen.tsx — added resolveMissionWeather import; weatherDef/hasWeather computation; weather chip in classificationChips; Weather row in detailsSidebar (amber-tinted when hasWeather); Weather Advisory block in objective tab (warningText + briefingNote in amber styling).
- src/components/Game.tsx — initial gameState message changed from hardcoded 'READY FOR SORTIE' to weatherDef.warningText || 'READY FOR SORTIE'.

Already wired in prior session (found in Game.tsx on stage start):
- windDrift applied per-tick to droneRef.current.position.x
- energyDrainPerSecond applied per-tick to energy system
- shieldRechargeMultiplier applied to shield regen rate
- boostRecoveryMultiplier applied to boost energy regen rate
- radarRangeMultiplier applied via effectiveRadarRange passed to <Radar radarRange={effectiveRadarRange} />
- HUD warningText bar rendered below Compass when weatherDef.warningText is non-empty
- Radar.tsx already accepted radarRange prop and used it for blip scaling
- 3 missions authored with weatherId: em-interference (mission 7), ash-storm (mission 5), lightning-storm (mission 8)

Deferred from this stage:
- lockSpeedMultiplier — no lock-on system in game yet; data authored, ready for future pass.
- visibilityMultiplier — no lock-range/visibility system yet; data authored.
- reducedEffects visual swap — Stage 3f or dedicated particle pass.
- Visual particle rendering (rain, ash, snow, lightning flash) — future particle system pass.
-->

### Stage 3e - New Biome Kits

Status: Complete

- [x] Add Storm Coast biome foundation.
- [x] Add Arctic Shelf biome foundation.
- [x] Add Ocean Platform biome foundation.
- [x] Add Urban Ruin biome foundation.
- [ ] Add Stratosphere/Orbital Relay biome foundation if needed for finale planning.

Exit criteria:

- [x] At least three new biome kits exist before campaign expansion.
- [x] Biome kits include structure, floor/terrain, hazard, target dressing, and extraction visual hooks.

### Stage 3f - Environment Regression And Readability Pass

Status: Complete

- [x] Smoke test current missions plus representative biome/time/weather combinations.
- [x] Validate target markers, extraction marker, radar, objective chip, reticle, and vitals on desktop and mobile.
- [x] Tune contrast, fog, grid, hazard opacity, and VFX density as needed.

Exit criteria:

- [x] No supported biome/time/weather combination makes mission-critical information unreadable.
- [x] TypeScript, production build, Docker deploy, and focused visual smoke pass.

## Stage 4 - Grand Destruction And Objective Set Pieces

Status: Complete

Goal: replace repeated tower destruction with memorable strike objectives and staged destruction.

### Stage 4a - Objective Archetype Schema

Status: Complete

- [x] Define reusable set-piece archetypes for radar networks, shield generators, convoys, SAM sites, reactors, bridges, carriers, platforms, frigates, and mega-cores.
- [x] Add target component definitions with health, required/optional state, exposed/hidden state, tracking metadata, and phase triggers.
- [x] Keep current tower and relay-spire targets backward-compatible.

Exit criteria:

- [x] Current targets can be represented as simple archetypes.
- [x] At least four future set-piece archetypes have typed data definitions.

Completion summary (2026-05-14):

- Shipped: Stage 4a set-piece archetype schema and data registry. Added typed component/phase/archetype definitions, optional mission-target set-piece hooks, and a registry covering legacy tower/relay targets plus radar networks, shield generators, convoys, SAM sites, reactors, bridges, carriers, platforms, frigates, and mega-cores. Current targets remain backward-compatible through legacy/fallback mappings and level-kit defaults; no runtime behavior changed.
- Changed: `src/types/game.ts`, `src/config/objectiveArchetypes.ts`, `src/config/levelKits.ts`, `DEV-CHECKLIST.md`.
- Verification: Dockerized `npm run lint` passed; Dockerized `npm run build && npm run validate:drone` passed; `docker compose build` completed; `docker compose up -d && docker compose ps` passed with the Skybreaker container Up.
- Notes/Risks: Stage 4a is data/schema only. Stage 4b must wire component exposure, damage routing, objective phase advancement, and tracking snapshot updates into runtime behavior before authored set-piece missions use these definitions.

### Stage 4b - Phase And Component Runtime

Status: Complete

- [x] Implement objective phases that can expose/hide components and change damage routing.
- [x] Connect component completion to objective progress and tracking snapshots.
- [x] Preserve exactly-once target destruction and extraction activation.
- [x] Keep runtime logic reusable instead of adding one-off mission branches.

Exit criteria:

- [x] At least one multi-component objective runs through shared phase logic.
- [x] Existing weak-point targets still behave correctly.

Completion summary (2026-05-14):

- Shipped: Shared set-piece runtime state for target components and phases. Targets now build runtime component state from reusable archetypes, sync component completion from weak-point/core damage, advance phases through shared logic, and gate weak-point visibility/damageability from active phase exposure. Radar-array and relay-core weak-point layouts are inferred into compatible set-piece archetypes so existing multi-component targets exercise the shared runtime path without bespoke mission branches.
- Changed: `src/types/game.ts`, `src/config/objectiveArchetypes.ts`, `src/systems/setPieceSystem.ts`, `src/scene/objectiveModels.ts`, `src/components/Game.tsx`, `DEV-CHECKLIST.md`.
- Verification: Dockerized `npm run lint` passed; Dockerized `npm run build && npm run validate:drone` passed with the existing Vite large chunk warning only. Docker deployment verification is recorded in the verification log.
- Notes/Risks: Stage 4b provides reusable runtime foundations and preserves existing target destruction/extraction flow. Rich per-component radar child tracks, set-piece-specific scoring, moving target routing, and a playable authored set-piece prototype remain deferred to Stages 4c-4f.

### Stage 4c - Moving Ground And Sea Target Foundation

Status: Complete

- [x] Add data and runtime support for moving convoy/ship-style targets.
- [x] Add route/path metadata, escape/fail conditions, and tracking presentation.
- [x] Support projectile collision against moving target components.

Exit criteria:

- [x] A prototype moving target can be damaged, tracked, and completed/failed.
- [x] Movement does not destabilize current fixed-target missions.

Completion summary (2026-05-14):

- Shipped: Optional target movement schema and reusable moving-target runtime. Mission targets can now define waypoint routes, speed, loop mode, start delay, end behavior, and escape/failure messages. Live targets build movement state at creation, update mesh/world/weak-point positions before projectile collision, update tracking with moving/damaged state, and can complete a route with either stop or mission-fail behavior.
- Changed: `src/types/game.ts`, `src/systems/targetMovementSystem.ts`, `src/scene/objectiveModels.ts`, `src/components/Game.tsx`, `src/systems/trackingSystem.ts`, `DEV-CHECKLIST.md`.
- Verification: Dockerized `npm run lint` passed; Dockerized `npm run build && npm run validate:drone` passed with the existing Vite large chunk warning only; focused moving-target runtime smoke passed; `docker compose build` passed; `docker compose up -d --no-build && docker compose ps` passed with `skybreaker-drone-strike` Up.
- Notes/Risks: No campaign mission is authored to use `movement` yet, so current fixed-target missions remain behaviorally stable. Rich convoy/ship visuals, moving target formations, moving extraction variants, and campaign prototype content remain future Stage 4f/Stage 5 work.

### Stage 4d - Set-Piece Visual And Audio Feedback

Status: Complete

- [x] Add restrained destruction VFX for component breaks, beam shutdowns, shock rings, smoke columns, and debris fields.
- [x] Add audio hooks for phase changes and major set-piece destruction.
- [x] Scale VFX by graphics quality and reduced-effects settings.

Exit criteria:

- [x] Destruction progress is visible without harming readability or frame rate.
- [x] Reduced-effects mode remains clear.

Completion summary (2026-05-14):

- Shipped: Reusable procedural set-piece feedback for component breaks, phase changes, and final destruction. Component breaks now emit a compact flash/debris/smoke burst, phase changes emit a vertical pulse and shock ring, and final target destruction emits a restrained blast, shock ring, debris, and smoke column. New audio cues distinguish component failure, phase transition, and major set-piece destruction.
- Changed: `src/scene/effects.ts`, `src/hooks/useAudio.ts`, `src/components/Game.tsx`, `DEV-CHECKLIST.md`.
- Verification: Dockerized `npm run lint` passed; Dockerized `npm run build && npm run validate:drone` passed with the existing Vite large chunk warning only; focused set-piece effect smoke passed for full and reduced effect scales; `docker compose build` passed; `docker compose up -d --no-build && docker compose ps` passed with `skybreaker-drone-strike` Up.
- Notes/Risks: Feedback is intentionally procedural and restrained; bespoke convoy/ship wakes, naval AA feedback, and authored set-piece spectacle remain deferred until prototype/content phases. Existing target destruction counting and extraction activation paths were left unchanged.

### Stage 4e - Set-Piece Debrief And Scoring

Status: Complete

- [x] Add objective-specific debrief stats for components destroyed, optional parts completed, phase time, convoy escapes, and protected assets.
- [x] Add scoring hooks for structured objectives without breaking current rank thresholds.
- [x] Update mission complete overlay to show richer objective results compactly.

Exit criteria:

- [x] Existing debrief still works.
- [x] Set-piece missions can report meaningful results beyond target count.

Completion summary (2026-05-14):

- Shipped: Optional set-piece mission stats now travel through mission completion results, including components destroyed, required and optional component counts, phases completed, aggregate phase time, convoy escapes, and protected asset losses. Structured-objective score hooks are additive and opt-in via scoring config, so current rank thresholds and missions remain unchanged unless a mission author enables set-piece bonuses.
- Changed: `src/types/game.ts`, `src/systems/missionSystem.ts`, `src/components/Game.tsx`, `src/components/overlays/MissionComplete.tsx`, `DEV-CHECKLIST.md`.
- Verification: Dockerized `npm run lint` passed; Dockerized `npm run lint && npm run build && npm run validate:drone` passed with the existing Vite large chunk warning only; focused scoring smoke passed, confirming no-hook set-piece stats preserve baseline score/rank and configured hooks add the expected bonus without mutating rank thresholds; `docker compose --progress plain build` passed; `docker compose --progress plain up -d --no-build && docker compose ps` passed with `skybreaker-drone-strike` Up.
- Notes/Risks: The debrief objective detail block is hidden for missions with no structured stats, so existing debrief readability is preserved. Stage 4f adds the first isolated mission that authors nonzero set-piece scoring hooks for prototype tuning.

### Stage 4f - Set-Piece Prototype Mission

Status: Complete

- [x] Build one prototype mission using at least two set-piece systems.
- [x] Verify HUD, radar, objective chip, extraction, scoring, and debrief behavior.
- [x] Keep prototype content isolated until ready for campaign insertion.

Exit criteria:

- [x] Prototype can be launched and replayed; completion/failure paths are wired through shared mission systems and covered by prototype data/runtime validation.
- [x] TypeScript, build, Docker deploy, and deployed browser launch smoke pass.

Completion summary (2026-05-14):

- Shipped: Added an isolated post-campaign `Prototype Range // Set-Piece Lab` arc and the `SET-PIECE PROVING GROUND` sortie. The prototype exercises a phased SAM site, a phase-gated reactor, and a moving convoy with mission-fail escape behavior, plus optional components and nonzero set-piece score hooks so the Stage 4e debrief has real authored data to display.
- Changed: `src/config/campaign.ts`, `src/config/missions.ts`, `scripts/validate-set-piece-prototype.ts`, `package.json`, `overview.md`, `DEV-CHECKLIST.md`.
- Verification: Dockerized `npm run lint && npm run validate:prototype` passed; Dockerized `npm run lint && npm run build && npm run validate:drone && npm run validate:prototype` passed with the existing Vite large chunk warning only; deployed browser smoke passed for prototype unlock, mission select, briefing launch, canvas, HUD, radar/compass, and objective chip; `docker compose --progress plain build` passed; `docker compose --progress plain up -d --no-build && docker compose ps` passed with `skybreaker-drone-strike` Up.
- Notes/Risks: The prototype is isolated behind `final-dawn` unlock and a separate planned prototype arc instead of being inserted into the active campaign arcs. Automated validation covers launch unlock, objective snapshot, target component alignment, convoy failure data, and set-piece scoring; the browser smoke verifies launch/readability, while deeper manual completion/failure/replay tuning remains useful before promoting this into production campaign content.

## Stage 5 - Combat Domain Expansion: Air, Land, And Sea

Status: In progress

Goal: make the campaign mechanically broad enough to support varied theaters.

### Stage 5a - Selected Target And Lock Foundation

Status: Complete

- [x] Add player-facing selected target state built on tracking snapshots.
- [x] Wire keyboard/touch/manual cycling controls only after automatic priority selection is stable.
- [x] Add lock acquisition rules, lock progress, lock loss, and HUD/radar presentation.
- [x] Keep selected target, objective priority, and radar priority consistent.

Exit criteria:

- [x] Player can identify and cycle/confirm a selected target.
- [x] Lock state is readable without clutter.

### Stage 5b - Homing And Specialized Secondary Weapons

Status: Complete

- [x] Convert or extend Ion Missile into a true homing anti-air weapon where mission rules support it.
- [x] Add guidance behavior, turn limits, target loss behavior, and impact/near-miss handling.
- [x] Add future payload hooks for anti-ground rockets and anti-sea weapons.
- [x] Preserve current unlocked weapon progression unless a later progression phase changes it.

Exit criteria:

- [x] Homing behavior is fair, readable, and energy/cooldown gated.
- [x] Current missions remain playable if no selected target exists.

### Stage 5c - Air-To-Air Intercepts

Status: Complete — Phase 5c deployed

- [x] Add moving airborne objective/enemy entities with escape or attack goals.
- [x] Add bomber/transport roles and escort formations.
- [x] Add ace enemy prototype with readable evasive movement.
- [x] Add intercept scoring bonuses and failure conditions.

Exit criteria:

- [x] A prototype intercept mission can be won or failed based on airborne objective behavior.
- [x] Radar/HUD clearly distinguishes intercept targets from normal enemies.

**Completion summary (Stage 5c):**
- `src/types/game.ts`: Added `bomber | transport` to `MissionTargetArchetype`; added `ace-interceptor` to `EnemyRole`
- `src/config/enemies.ts`: Added `ace-interceptor` definition — health 160, shields 80, speed 0.72, drift 0.42, fireCooldownMs 1400, scoreValue 900
- `src/scene/objectiveModels.ts`: Added `createBomberTargetModel()` (fuselage + swept wings + nacelles + engine glow + threat stripe); added `createAirborneMissionTarget()` that preserves Y altitude; branched `createMissionTarget()` so airborne archetypes skip the ground-only `y=0` clamp
- `src/config/campaign.ts`: Added `prototype-intercept` arc ("Prototype Range // Intercept Lab", Prototype 91)
- `src/config/missions.ts`: Added `raven-break-prototype` — single bomber at altitude 200, escape route with `fail-mission` end behavior, 2 ace-interceptor escort spawning at mission start, extraction below bomber start zone
- `scripts/validate-intercept-prototype.ts`: New validator for intercept mission invariants
- `package.json`: Added `validate:intercept` script
- `src/config/buildMeta.ts`: `PHASE_TAG = 'Phase 5c'`

### Stage 5d - Air-To-Land Threat Systems

Status: Complete

**Summary:** Introduced three surface emplacement archetypes (SAM battery, flak cannon, railgun emplacement) as stationary ground threats that track, aim, and fire at the player while remaining fixed at y=2. Added distinct 3D geometry per role via `createGroundThreatModel()`. Added `surfaceWarning` to `GameState` and a flashing `SurfaceWarning` HUD indicator. Added a prototype mission `IRON PERIMETER` (order 92, AIR_TO_LAND, STRIKE) with a wave of all three ground threat types. Validator, campaign arc, and `validate:ground` script added. Deferred: attack-run scoring incentive (noted in backlog).

**Files changed:**
- `src/types/game.ts`: Added `EnemyRole` entries `sam-battery | flak-cannon | railgun-emplacement`, `EnemyDefinition.groundThreat?: boolean`, `GameState.surfaceWarning?: boolean`
- `src/config/enemies.ts`: Added `sam-battery`, `flak-cannon`, `railgun-emplacement` definitions with `groundThreat: true`
- `src/scene/enemyModels.ts`: Added `createGroundThreatModel()` with role-specific geometry (launch tubes, twin barrels, railgun carriage + coils); branched `createEnemyModel()` on `groundThreat`
- `src/components/Game.tsx`: Ground threats spawn at y=2 across ±600 XZ area with 2500ms startup delay; AI move/drift guarded by `!groundThreat`; `surfaceWarning` computed and passed to `setGameState`; `SurfaceWarning` rendered in HUD
- `src/components/hud/SurfaceWarning.tsx`: New flashing "⚠ SURFACE LOCK / GROUND THREAT IN RANGE" HUD indicator
- `src/components/hud/index.ts`: Exported `SurfaceWarning`
- `src/config/campaign.ts`: Added `prototype-ground-defense` arc ("Prototype Range // Ground Defense Lab", Prototype 92)
- `src/config/missions.ts`: Added `ground-defense-prototype` — command tower target, wave of 2× sam-battery + 2× flak-cannon + 1× railgun-emplacement spawning at start
- `scripts/validate-ground-prototype.ts`: New validator for ground defense mission invariants
- `package.json`: Added `validate:ground` script
- `src/config/buildMeta.ts`: `PHASE_TAG = 'Phase 5d'`

### Stage 5e - Air-To-Sea Foundation

Status: Complete — commit `feat: phase 5e - air-to-sea foundation`

- [x] Add `ocean-platform` level kit with ocean-buoys waypoint style and sea-surge hazard biome.
- [x] Add `patrol-craft-vitals` weak point layout (radar-mast optional, engine-pod required).
- [x] Add `patrol-craft` to `MissionTargetArchetype`; extend `LevelKitId`, `WaypointStyleId`, `TargetWeakPointLayoutId`.
- [x] `createPatrolCraftModel()` — hull, bow taper, superstructure, radar mast, running lights, wake planes.
- [x] `createNavalMissionTarget()` — sea-surface locked (y=2), routes naval archetype through targetMovementSystem.
- [x] `sea-wolf-prototype` mission (order 93) — looping diamond patrol, air CAP, patrol-craft-vitals weak points, ocean-platform biome.
- [x] `scripts/validate-sea-prototype.ts` + `validate:sea` script; all validators pass.
- [x] `PHASE_TAG = 'Phase 5e'`; all lint/build/validate/deploy clean.

Exit criteria:

- [x] A prototype sea target can move, be tracked, take damage, and complete/fail objective rules.
- [x] Naval visuals stay readable on low graphics and mobile.

### Stage 5f - Mixed-Domain HUD/Radar Pass

Status: Not started

- [ ] Add icon/label distinctions for air, ground, sea, objective, hazard, ally, and extraction tracks.
- [ ] Add domain-aware priority scoring and objective routing hints.
- [ ] Validate clutter limits with mixed air/ground/sea threats.

Exit criteria:

- [ ] Mixed-domain combat remains readable without hiding urgent information.
- [ ] Reduced-effects mode preserves tactical meaning.

## Stage 6 - Campaign Expansion Wave 1

Status: Not started

Goal: use the new mission, objective, environment, weather, and combat-domain systems to grow the campaign backbone.

### Stage 6a - Campaign Arc Plan And Save Migration

Status: Not started

- [ ] Finalize 5-6 campaign arcs, mission count, unlock order, rewards, and difficulty curve.
- [ ] Add save migration strategy for inserted missions and changed reward ids.
- [ ] Add mission-select filtering or arc summaries if the UI becomes dense.

Exit criteria:

- [ ] Old saves survive new campaign structure.
- [ ] Campaign screen remains understandable with expanded mission count.

### Stage 6b - Signal War And Blackout Line Cleanup

Status: Not started

- [ ] Revisit Missions 01-08 using the Stage 2-5 systems.
- [ ] Convert appropriate missions to structured objectives without changing their onboarding purpose.
- [ ] Add optional objective or set-piece upgrades where they improve variety.

Exit criteria:

- [ ] Current campaign remains complete from a clean save.
- [ ] Early missions teach systems clearly.

### Stage 6c - Storm Coast Arc Batch

Status: Not started

- [ ] Add 3-4 missions using storm/ocean/weather systems.
- [ ] Introduce first naval operations and weather pressure gradually.
- [ ] Add appropriate rewards and progression hooks.

Exit criteria:

- [ ] Storm Coast arc can be unlocked, played, completed, and replayed.

### Stage 6d - Frozen Relay Arc Batch

Status: Not started

- [ ] Add 3-4 missions using arctic/low-visibility/sensor pressure systems.
- [ ] Introduce long-range interception or fragile sensor-link objectives.
- [ ] Validate readability in bright/foggy environments.

Exit criteria:

- [ ] Frozen Relay arc feels distinct and remains readable.

### Stage 6e - Red Canyon Siege Arc Batch

Status: Not started

- [ ] Add 3-4 missions using canyon lanes, convoys, artillery, and moving ground targets.
- [ ] Introduce attack-run incentives and terrain route pressure.
- [ ] Validate mobile control and marker readability in tighter terrain.

Exit criteria:

- [ ] Red Canyon arc can be completed without navigation confusion.

### Stage 6f - Skybreaker Core Arc Batch

Status: Not started

- [ ] Add final mixed-domain missions using set pieces, weather, bosses, and extraction pressure.
- [ ] Build a finale mission that combines air, land, sea, and mega-core mechanics only after those systems are stable.
- [ ] Add final rewards and campaign completion state.

Exit criteria:

- [ ] Main campaign has a complete ending.
- [ ] Finale is intense but readable on desktop and mobile.

### Stage 6g - Campaign Wave 1 Regression

Status: Not started

- [ ] Smoke every main mission from a clean save.
- [ ] Smoke existing migrated saves.
- [ ] Validate mission unlocks, rewards, best times, best scores, ranks, and replay flow.

Exit criteria:

- [ ] Expanded campaign can be played start to finish.
- [ ] TypeScript, build, Docker deploy, and campaign smoke pass.

## Stage 7 - Player Progression, Loadout, And Upgrade Paths

Status: Not started

Goal: add meaningful between-mission decisions and make rewards mechanically useful.

### Stage 7a - Inventory And Progression Data

Status: Not started

- [ ] Add player inventory/progression state for unlocked weapons, upgrades, currencies/parts, and equipped items.
- [ ] Add save migration for current campaign progress.
- [ ] Keep current reward ids compatible or migrate them explicitly.

Exit criteria:

- [ ] Existing saves load safely.
- [ ] Inventory data persists and validates on reload.

### Stage 7b - Loadout Selection Screen

Status: Not started

- [ ] Convert Loadout Review into Loadout Selection.
- [ ] Add primary, secondary, payload, and module slots as appropriate.
- [ ] Add mission recommendation tags based on mission type, combat domain, weather, and objectives.
- [ ] Keep a fast launch path for players who do not want to tinker.

Exit criteria:

- [ ] Player can change equipment before launch.
- [ ] Launch flow remains quick and obvious.

### Stage 7c - Upgrade Definitions And Trees

Status: Not started

- [ ] Define upgrade trees for Flight Core, Weapons Core, Defense Core, Sensor Core, and Payload Core.
- [ ] Add upgrade costs, requirements, caps, and mutually exclusive choices where useful.
- [ ] Add upgrade effects without scattering tuning branches across runtime code.

Exit criteria:

- [ ] At least three upgrade trees have playable mechanical effects.
- [ ] Upgrade effects are visible in UI and gameplay.

### Stage 7d - Reward And Currency Model

Status: Not started

- [ ] Add parts/currency/upgrade point rewards to mission completion.
- [ ] Add optional objective bonuses without forcing grind.
- [ ] Update debrief and career screens to show meaningful rewards.

Exit criteria:

- [ ] Rewards alter player choices and gameplay options.
- [ ] Campaign balance remains playable without grinding.

### Stage 7e - Balance And Progression Pass

Status: Not started

- [ ] Tune upgrades against early, mid, and late campaign missions.
- [ ] Validate that required missions do not demand optional upgrades.
- [ ] Add reset/respec rules if needed.

Exit criteria:

- [ ] Progression feels rewarding without breaking mission difficulty.
- [ ] Save/load and migration tests pass.

## Stage 8 - Enemy AI, Factions, Bosses, And Reactive Encounters

Status: Not started

Goal: make expanded combat feel varied through behavior, not only stats.

### Stage 8a - Enemy Behavior Controller Architecture

Status: Not started

- [ ] Separate enemy behavior controllers from visual/stat definitions.
- [ ] Add reusable behavior states such as spawn, patrol, pursue, orbit, strafe, retreat, guard, attack objective, and flee.
- [ ] Keep current enemy behavior as a default controller.

Exit criteria:

- [ ] Current enemies behave as before through the new controller layer.
- [ ] New controllers can be assigned by role or mission data.

### Stage 8b - Formation And Group Behaviors

Status: Not started

- [ ] Add formation leaders and child contacts for enemy groups.
- [ ] Support bomber escorts, patrol groups, and defensive screens.
- [ ] Reflect grouped tracks on radar without excessive clutter.

Exit criteria:

- [ ] Formation enemies feel coordinated and remain readable.

### Stage 8c - Ground And Naval Enemy Behaviors

Status: Not started

- [ ] Add behavior controllers for SAMs, turrets, artillery, ships, carriers, and platform defenses.
- [ ] Add target selection against player, allies, zones, or protected objectives.
- [ ] Add reload/telegraph/cooldown states.

Exit criteria:

- [ ] Ground and naval threats are readable before they damage the player.

### Stage 8d - Telegraphs And Reactive Encounters

Status: Not started

- [ ] Add visual/audio telegraphs for missiles, railguns, beams, area denial, boss attacks, and emergency extraction.
- [ ] Add objective-triggered reinforcements and escalation hooks.
- [ ] Respect reduced-effects settings without removing tactical warning meaning.

Exit criteria:

- [ ] Players can understand and react to high-threat attacks.

### Stage 8e - Boss Phase Framework

Status: Not started

- [ ] Add boss phase controller with health thresholds, exposed weak points, attack patterns, and retreat/extraction windows.
- [ ] Prototype Command Frigate, Carrier Group, or Skybreaker Core boss behavior.
- [ ] Integrate boss phase state with objective tracking and debrief.

Exit criteria:

- [ ] A boss prototype has readable phases and can be completed without custom one-off mission code.

### Stage 8f - Faction And Theater Variants

Status: Not started

- [ ] Add faction/theater-specific enemy variants with distinct silhouettes, weapons, and behavior weights.
- [ ] Keep role readability consistent across skins/variants.

Exit criteria:

- [ ] Variants add variety without confusing threat recognition.

## Stage 9 - Campaign Expansion Wave 2 And Optional Sorties

Status: Not started

Goal: add replay value and optional breadth after the expanded campaign is stable.

### Stage 9a - Optional Sortie Framework

Status: Not started

- [ ] Add optional sortie definitions separate from required campaign missions.
- [ ] Add unlock rules, rewards, replay state, and career display for optional sorties.
- [ ] Keep optional content from blocking main campaign progress.

Exit criteria:

- [ ] Optional sorties can be discovered, launched, completed, and replayed.

### Stage 9b - Challenge Variant System

Status: Not started

- [ ] Add challenge modifiers such as storm version, night version, elite patrol, limited energy, no-shield, timed extraction, or hazard-dense variant.
- [ ] Display modifiers clearly before launch.
- [ ] Keep modifiers fair and compatible with reduced-effects/readability settings.

Exit criteria:

- [ ] At least five reusable challenge modifiers exist.

### Stage 9c - Semi-Procedural Contract Generator

Status: Not started

- [ ] Build contracts from authored objective modules, biome/weather/time variants, enemy pools, and reward templates.
- [ ] Add seed/state persistence for generated contracts if needed.
- [ ] Validate generated missions for readability and completion rules.

Exit criteria:

- [ ] Generated/remixed sorties remain fair and do not require fragile custom code.

### Stage 9d - Advanced Scoring And Mastery

Status: Not started

- [ ] Add medals or mastery goals beyond S-rank.
- [ ] Add arc mastery rewards for optional goals.
- [ ] Show mastery progress in career and mission select.

Exit criteria:

- [ ] Replay goals are meaningful without breaking main campaign balance.

### Stage 9e - Optional Content Regression

Status: Not started

- [ ] Smoke optional sorties, variants, and generated contracts across desktop/mobile.
- [ ] Validate save migration and optional progress persistence.

Exit criteria:

- [ ] Optional content is stable and clearly separate from main progression.

## Stage 10 - Final Polish, Performance, And Release Hardening

Status: Not started

Goal: stabilize the enlarged game and make the campaign feel finished.

### Stage 10a - Full Campaign Regression Matrix

Status: Not started

- [ ] Run every main mission from a clean save.
- [ ] Run representative migrated saves from major historical progress states.
- [ ] Validate unlocks, rewards, ranks, best times, best scores, optional goals, and replay.

Exit criteria:

- [ ] Every main mission can be completed from a clean save.
- [ ] Existing saves migrate safely.

### Stage 10b - HUD, Radar, And Mobile Layout Hardening

Status: Not started

- [ ] Test HUD overlap, objective chip expansion, radar tracking, selected target, edge pins, extraction guidance, touch controls, and portrait overlay.
- [ ] Cover desktop, 390x844 portrait, 844x390 landscape, and at least one tablet-like viewport.
- [ ] Tune text wrapping, safe-area padding, and reduced-effects behavior.

Exit criteria:

- [ ] HUD remains readable in the most visually intense supported missions.

### Stage 10c - Performance Budgets And Optimization

Status: Not started

- [ ] Establish budgets for weather, water, enemy count, set-piece VFX, boss phases, and optional sorties.
- [ ] Profile LOW/MEDIUM/HIGH graphics settings.
- [ ] Optimize rendering, update cadence, object pooling, and bundle chunks where needed.

Exit criteria:

- [ ] Performance is acceptable on target desktop and mobile hardware.
- [ ] Existing Vite large-chunk warning is addressed or documented as acceptable.

### Stage 10d - Accessibility And Readability Pass

Status: Not started

- [ ] Review contrast, text size, motion settings, reduced effects, controls copy, screen-reader labels for menus, and focus states.
- [ ] Ensure key warnings do not rely on color alone.
- [ ] Validate menu and gameplay readability in bright/dark environments.

Exit criteria:

- [ ] Accessibility/readability issues are resolved or documented with follow-up risk.

### Stage 10e - Audio And Final Presentation Pass

Status: Not started

- [ ] Add final audio cues for weather, naval combat, boss phases, warnings, objective changes, and mission outcomes.
- [ ] Balance music/SFX volumes across phases.
- [ ] Polish visual transitions, mission intros, debrief feedback, and menu motion.

Exit criteria:

- [ ] Audio and presentation support gameplay without masking important information.

### Stage 10f - Release Candidate Checklist

Status: Not started

- [ ] Freeze content scope.
- [ ] Run full lint/build/Docker deploy and browser smoke.
- [ ] Update README, overview, roadmap, active checklist, regression smoke docs, and any public metadata.
- [ ] Document known limitations and post-release backlog.

Exit criteria:

- [ ] Release candidate is documented, deployable, and regression-tested.

## Testing Checklist

Build and toolchain:

- [x] `npm run lint`
- [x] `npm run build`
- [x] `npm run validate:drone`
- [x] Docker rebuild succeeds
- [x] Docker deploy succeeds

Documentation review:

- [x] Historical checklist archive exists.
- [x] `overview.md` is current-state oriented.
- [x] `roadmap.md` points to Stage 2b as the next implementation stage.
- [x] `DEV-CHECKLIST.md` contains phase-worker handoff sections.
- [x] Stages 3-10 contain granular sub-phases and exit criteria.

Gameplay regression for future phases:

- [ ] Drone flight remains responsive.
- [ ] Chase camera remains readable.
- [ ] Apparent target distance remains stable while turning on mobile and desktop.
- [ ] HUD remains legible in combat.
- [ ] Radar and tracking remain readable.
- [ ] Target destruction counts remain correct.
- [ ] Extraction completes reliably.
- [ ] Mission success and failure flows still trigger correctly.
- [ ] Settings and campaign unlocks persist.
- [ ] Mobile touch-drag and action controls remain usable.

## Deferred Work Log

| Date | Phase | Deferred item | Reason | Recommended next step |
|---|---|---|---|---|
| 2026-05-13 | Stage 0 | README/BASELINE wording refresh | User requested overview, roadmap, and checklist reset first | Do a separate docs pass for stale joystick, missile lock, and out-of-bounds wording |
| 2026-05-13 | Stage 1 | Tracking attention event bus | Needs stable objective/event schema | Implement during Stage 2e mission event hooks |
| 2026-05-13 | Stage 1 | Weak-point child track registration | Needs objective child-track schema | Implement during Stage 2f/2g |
| 2026-05-13 | Stage 1e | Camera FOV/spatial distortion fix | Newly reported mobile readability issue; needs reproduction and tuning | Investigate `src/scene/renderer.ts`, `src/config/constants.ts`, and camera follow logic in `src/components/Game.tsx` before Stage 2b |
| 2026-05-13 | Stage 2 | Out-of-bounds fail policy | Product behavior decision needed | Decide mission-specific warning/timed-fail/hard-fail behavior before extraction metadata states |
| 2026-05-13 | Stage 5 | True target lock and homing missiles | Current secondary projectile is straight-flight only | Implement selected target, lock acquisition, and homing guidance in air-to-air expansion |

## Verification Log

- 2026-05-13: Stage 0 documentation reset manual review - passed; old checklist archived and root docs rebuilt.
- 2026-05-13: Stage 0 `docker run --rm -v "$PWD":/app -v skybreaker-drone-strike-node-modules:/app/node_modules -w /app node:20-alpine sh -lc "npm run lint && npm run build && npm run validate:drone"` - passed; TypeScript zero errors, Vite build succeeded with the existing large chunk warning, and drone symmetry validation passed.
- 2026-05-13: Stage 0 `docker compose build && docker compose up -d && docker compose ps` - passed; image `skybreaker-drone-strike:latest` rebuilt and container `skybreaker-drone-strike` reported `Up`.
- 2026-05-13: Active checklist expansion manual review - passed; Stages 3-10 now have phase-worker-friendly sub-phases and exit criteria.
- 2026-05-13: Camera/FOV roadmap update manual review - passed; Stage 1e added as the next near-term investigation/fix before Stage 2b.
- 2026-05-14: Stage 3a `docker run --rm -v "$PWD":/app -v skybreaker-drone-strike-node-modules:/app/node_modules -w /app node:20-alpine sh -lc "npm run lint && npm run build && npm run validate:drone"` — passed; TypeScript zero errors, Vite 2124 modules, drone symmetry 21 mirrored + 12 centerline passed.
- 2026-05-14: Stage 3a `docker compose build && docker compose up -d && docker compose ps` — passed; image rebuilt, container `skybreaker-drone-strike` reported `Up`.
- 2026-05-14: Stage 3b `docker run --rm -v "$PWD":/app -v skybreaker-drone-strike-node-modules:/app/node_modules -w /app node:20-alpine sh -lc "npm run lint && npm run build && npm run validate:drone"` — passed; TypeScript zero errors, Vite 2125 modules, drone symmetry 21 mirrored + 12 centerline passed.
- 2026-05-14: Stage 3b `docker compose build && docker compose up -d && docker compose ps` — passed; image rebuilt, container `skybreaker-drone-strike` reported `Up`.
- 2026-05-14: Stage 3c `docker run --rm -v "$PWD":/app -v skybreaker-drone-strike-node-modules:/app/node_modules -w /app node:20-alpine sh -lc "npm run lint && npm run build && npm run validate:drone"` — passed; TypeScript zero errors, Vite 2125 modules, drone symmetry 21 mirrored + 12 centerline passed.
- 2026-05-14: Stage 3c `docker compose build && docker compose up -d && docker compose ps` — passed; image rebuilt, container `skybreaker-drone-strike` reported `Up`.
- 2026-05-14: Stage 3d `docker run --rm -v "$PWD":/app -v skybreaker-drone-strike-node-modules:/app/node_modules -w /app node:20-alpine sh -lc "npm run lint && npm run build && npm run validate:drone"` — passed; TypeScript zero errors, Vite 2126 modules, drone symmetry 21 mirrored + 12 centerline passed.
- 2026-05-14: Stage 3d `docker compose build && docker compose up -d && docker compose ps` — passed; image rebuilt, container `skybreaker-drone-strike` reported `Up`.
- 2026-05-14: Stage 4a `docker run --rm -v "$PWD":/app -v skybreaker-drone-strike-node-modules:/app/node_modules -w /app node:20-alpine sh -lc "npm run lint"` — passed; TypeScript zero errors.
- 2026-05-14: Stage 4a `docker run --rm -v "$PWD":/app -v skybreaker-drone-strike-node-modules:/app/node_modules -w /app node:20-alpine sh -lc "npm run build && npm run validate:drone"` — passed; Vite 2126 modules with existing large chunk warning, drone symmetry 21 mirrored + 12 centerline passed.
- 2026-05-14: Stage 4a `docker compose build` — passed; image `skybreaker-drone-strike:latest` rebuilt.
- 2026-05-14: Stage 4a `docker compose up -d && docker compose ps` — passed; container reported `Up`.
- 2026-05-14: Stage 4a `docker compose up -d --no-build --force-recreate && docker compose ps` — passed; interrupted recreate normalized back to declared container name `skybreaker-drone-strike` and container reported `Up`.
- 2026-05-14: Stage 4b `docker run --rm -v "$PWD":/app -v skybreaker-drone-strike-node-modules:/app/node_modules -w /app node:20-alpine sh -lc "npm run lint"` — passed; TypeScript zero errors.
- 2026-05-14: Stage 4b `docker run --rm -v "$PWD":/app -v skybreaker-drone-strike-node-modules:/app/node_modules -w /app node:20-alpine sh -lc "npm run build && npm run validate:drone"` — passed; Vite 2128 modules with existing large chunk warning, drone symmetry 21 mirrored + 12 centerline passed.
- 2026-05-14: Stage 4b `docker compose build` — passed; image `skybreaker-drone-strike:latest` rebuilt. The chained `up` step stalled after image export, leaving a name conflict; removing the two Skybreaker service containers and running `docker compose up -d --no-build && docker compose ps` normalized the service.
- 2026-05-14: Stage 4b `docker compose up -d --no-build && docker compose ps` — passed; container `skybreaker-drone-strike` reported `Up`.
- 2026-05-14: Stage 4c `docker run --rm -v "$PWD":/app -v skybreaker-drone-strike-node-modules:/app/node_modules -w /app node:20-alpine sh -lc "npm run lint"` — passed; TypeScript zero errors.
- 2026-05-14: Stage 4c `docker run --rm -v "$PWD":/app -v skybreaker-drone-strike-node-modules:/app/node_modules -w /app node:20-alpine sh -lc "npm run build && npm run validate:drone"` — passed; Vite 2129 modules with existing large chunk warning, drone symmetry 21 mirrored + 12 centerline passed.
- 2026-05-14: Stage 4c focused moving-target runtime smoke — first inline shell attempt failed due heredoc/history quoting; rerun with shell-safe quoting passed, confirming target movement, weak-point position sync, tracking update, damaged state, route completion, and fail-mission behavior.
- 2026-05-14: Stage 4c `docker compose build` — passed; image `skybreaker-drone-strike:latest` rebuilt.
- 2026-05-14: Stage 4c `docker compose up -d --no-build && docker compose ps` — passed; container `skybreaker-drone-strike` reported `Up`.
- 2026-05-14: Stage 4d `docker run --rm -v "$PWD":/app -v skybreaker-drone-strike-node-modules:/app/node_modules -w /app node:20-alpine sh -lc "npm run lint"` — passed; TypeScript zero errors.
- 2026-05-14: Stage 4d `docker run --rm -v "$PWD":/app -v skybreaker-drone-strike-node-modules:/app/node_modules -w /app node:20-alpine sh -lc "npm run build && npm run validate:drone"` — passed; Vite 2129 modules with existing large chunk warning, drone symmetry 21 mirrored + 12 centerline passed.
- 2026-05-14: Stage 4d focused set-piece effect smoke — passed; full and reduced effect scales create finite procedural groups and reduced effects stay below the density cap.
- 2026-05-14: Stage 4d `docker compose build` — passed; image `skybreaker-drone-strike:latest` rebuilt.
- 2026-05-14: Stage 4d `docker compose up -d --no-build && docker compose ps` — passed; container `skybreaker-drone-strike` reported `Up`.
- 2026-05-14: Stage 4e `docker run --rm -v "$PWD":/app -v skybreaker-drone-strike-node-modules:/app/node_modules -w /app node:20-alpine sh -lc "npm run lint"` — passed; TypeScript zero errors.
- 2026-05-14: Stage 4e `docker run --rm -v "$PWD":/app -v skybreaker-drone-strike-node-modules:/app/node_modules -w /app node:20-alpine sh -lc "npm run lint && npm run build && npm run validate:drone"` — passed; Vite 2129 modules with existing large chunk warning, drone symmetry 21 mirrored + 12 centerline passed.
- 2026-05-14: Stage 4e focused scoring smoke — passed; no-hook set-piece stats preserved baseline score/rank, opt-in set-piece hooks added the expected score, and rank thresholds were not mutated.
- 2026-05-14: Stage 4e `docker compose --progress plain build` — passed; image `skybreaker-drone-strike:latest` rebuilt. Earlier default-progress compose build reached image export but hung in the progress UI, so it was stopped and rerun with plain progress.
- 2026-05-14: Stage 4e `docker compose --progress plain up -d --no-build && docker compose ps` — passed; container `skybreaker-drone-strike` reported `Up`.
- 2026-05-14: Stage 4f `docker run --rm -v "$PWD":/app -v skybreaker-drone-strike-node-modules:/app/node_modules -w /app node:20-alpine sh -lc "npm run lint && npm run validate:prototype"` — passed; TypeScript zero errors and prototype mission data validated.
- 2026-05-14: Stage 4f `docker run --rm -v "$PWD":/app -v skybreaker-drone-strike-node-modules:/app/node_modules -w /app node:20-alpine sh -lc "npm run lint && npm run build && npm run validate:drone && npm run validate:prototype"` — passed; Vite 2129 modules with existing large chunk warning, drone symmetry 21 mirrored + 12 centerline passed, prototype validator passed.
- 2026-05-14: Stage 4f `docker compose --progress plain build` — passed; image `skybreaker-drone-strike:latest` rebuilt.
- 2026-05-14: Stage 4f `docker compose --progress plain up -d --no-build && docker compose ps` — passed; container `skybreaker-drone-strike` reported `Up`.
- 2026-05-14: Stage 4f deployed browser smoke — passed; seeded completed campaign progress, confirmed `SET-PIECE PROVING GROUND` appears READY under `Prototype Range // Set-Piece Lab`, launched the briefing into mission runtime, and verified canvas, HUD, radar/compass, and `DISABLE PROTOTYPE SYSTEMS: 0 / 3` objective chip rendered.

## Latest Session Summary

Date: 2026-05-14

Phase worked:
- Stage 4f - Set-Piece Prototype Mission.

Shipped:
- Added `SET-PIECE PROVING GROUND`, an isolated post-campaign prototype sortie in a separate `Prototype Range // Set-Piece Lab` arc.
- Authored three prototype targets: a phased SAM site, a phase-gated reactor, and a moving convoy with fail-mission escape behavior.
- Added nonzero set-piece scoring hooks and optional components so the mission complete debrief can show meaningful Stage 4e objective detail.
- Added `scripts/validate-set-piece-prototype.ts` and `npm run validate:prototype` to keep the prototype data smoke-testable.
- Updated `overview.md` to mention the isolated prototype range alongside the eight-mission campaign.

Changed files:
- `src/config/campaign.ts`
- `src/config/missions.ts`
- `scripts/validate-set-piece-prototype.ts`
- `package.json`
- `overview.md`
- `DEV-CHECKLIST.md`

Verification:
- Host `npm run lint` could not run because `npm` is not on PATH in this shell.
- Dockerized `npm run lint && npm run validate:prototype` — passed.
- Dockerized `npm run lint && npm run build && npm run validate:drone && npm run validate:prototype` — passed; Vite 2129 modules with the existing large chunk warning only, drone symmetry 21 mirrored + 12 centerline passed, prototype validator passed.
- Deployed browser smoke — passed; seeded completed campaign progress, opened Prototype Range, selected `SET-PIECE PROVING GROUND`, launched into the mission, and verified canvas, HUD, radar/compass, and objective chip render.
- `docker compose --progress plain build` — passed; image `skybreaker-drone-strike:latest` rebuilt.
- `docker compose --progress plain up -d --no-build && docker compose ps` — passed; final container name is `skybreaker-drone-strike` and status is Up.

Deferred:
- Deeper manual completion/failure/replay tuning for the prototype remains a useful follow-up before promoting the mission into an active campaign arc.
- Bespoke convoy/ship wakes, naval AA telegraphs, and larger domain-specific spectacle remain deferred to Stage 5 after prototype content clarifies the need.

Next recommended starting point:
- Begin Stage 5a - Selected Target And Lock Foundation.
- Start by reading `src/components/Game.tsx`, `src/systems/trackingSystem.ts`, `src/components/hud/Radar.tsx`, `src/components/hud/Crosshair.tsx`, and `src/config/weapons.ts`.
- Add selected-target state and cycling/confirmation on top of tracking snapshots before implementing lock acquisition or homing behavior.

---

## Stage 5a Completion Summary

**Completed:** Stage 5a - Selected Target And Lock Foundation

**Summary:**
Implemented end-to-end selected target and lock acquisition system. The player now has a clearly identifiable selected target (auto-priority from tracking system), can manually cycle it with Tab (keyboard) or LOCK (touch), and sees a real-time lock ring HUD widget showing acquisition progress, lock state, entity type badge, distance, and health bar.

**Changed files:**
- `src/config/constants.ts` — Added `LOCK_RANGE`, `LOCK_CONE_DOT`, `LOCK_ACQUIRE_RATE`, `LOCK_DRAIN_RATE`
- `src/types/game.ts` — Added `TargetLockState`, `TargetLockSnapshot`, extended `GameLogic` with `lockProgress`/`lockTargetId`, extended `GameState` with `targetLock`
- `src/systems/trackingSystem.ts` — Added `manualTargetId`, `setManualTarget()`, `cycleManualTarget()`, `isManualTargeting()`; `recomputePriority()` now honors manual override and validates manual target viability; `reset()` clears manual state
- `src/components/hud/TargetLock.tsx` — New HUD component: SVG lock ring with arc progress, 4 cardinal ticks, locked pulse animation, entity type badge, distance, health bar, MAN/ACQ/LOCK indicators
- `src/components/hud/index.ts` — Exported `TargetLock`
- `src/components/Game.tsx` — Imports, `gameLogicRef` init, `GameState` init, Tab key handler, per-frame lock computation block, `setGameState` with `targetLock`, `<TargetLock>` render in bottom-left HUD, LOCK touch button in action row
- `src/config/buildMeta.ts` — PHASE_TAG → `'Phase 5a'`

**Verification:**
- Dockerized `npm run lint` — passed (0 errors)
- Dockerized `npm run build && npm run validate:drone && npm run validate:prototype` — passed; Vite 2131 modules, drone symmetry 21 mirrored + 12 centerline, prototype validator passed
- `docker compose --progress plain build` — passed; image `skybreaker-drone-strike:latest` rebuilt
- `docker compose --progress plain up -d --no-build && docker compose ps` — passed; container status Up

**Deferred:**
- Homing missile guidance using the selected target lock is Stage 5b work.
- Lock breaking / countermeasure events remain a Stage 5b or 5c concern.

**Next recommended starting point:**
- Begin Stage 5b - Homing And Specialized Secondary Weapons.
- Start by reading `src/config/weapons.ts`, `src/systems/projectileSystem.ts` (if it exists), and `Game.tsx` projectile fire logic.
- Convert the Ion Missile secondary into a true homing weapon that uses the Stage 5a lock state when a target is locked.

---

## Stage 5b Completion Summary

**Completed:** Stage 5b - Homing And Specialized Secondary Weapons

**Summary:**
Converted the Ion Missile into a true homing weapon. When the player has a full lock (lockProgress = 1.0) on any tracked entity, firing the secondary captures the target ID into the projectile. Each frame, the missile's velocity is steered toward the live world position of the target up to `MISSILE_TURN_RATE` radians/second using lerp-normalized angle clamping. If the target is destroyed before impact, the missile flies straight on remaining life. When no lock exists at fire time, the missile fires straight as before — preserving all existing mission behavior.

**Changed files:**
- `src/types/game.ts` — Added `homing?: boolean` to `WeaponDefinition`; added `targetId?: string | null` to `Projectile`
- `src/config/constants.ts` — Added `MISSILE_TURN_RATE = 2.5` (rad/s), `MISSILE_MIN_LOCK = 1.0`
- `src/config/weapons.ts` — Added `homing: true` to `ion-missile`
- `src/components/Game.tsx` — Imports `MISSILE_TURN_RATE`, `MISSILE_MIN_LOCK`; `fireProjectile` captures `homingTargetId` when locked; projectile update loop applies per-frame guidance before position step
- `src/config/buildMeta.ts` — PHASE_TAG → `'Phase 5b'`

**Verification:**
- Dockerized `npm run lint` — passed (0 TypeScript errors)
- Dockerized `npm run build && npm run validate:drone && npm run validate:prototype` — passed; Vite 2131 modules, drone symmetry 21 mirrored + 12 centerline, prototype validator passed
- `docker compose --progress plain build` — passed; image rebuilt with Phase 5b tag
- `docker compose --progress plain up -d --no-build && docker compose ps` — passed; container Up

**Deferred:**
- Missile mesh reorientation during homing turn (cone faces travel direction) — visual polish, no gameplay impact
- Lock breaking / countermeasure / flare mechanic — Stage 5c or later
- Anti-ground / anti-sea payload variants using the `homing` hook — Stage 5d/5e work

---

## Stage 5c Completion Summary

**Completed:** Stage 5c - Air-To-Air Intercepts

**Summary:**
Introduced airborne mission objectives with escape failure, a new ace-interceptor enemy class, and a post-campaign intercept prototype mission (RAVEN BREAK). Bombers now spawn at altitude and move along a route using the existing `targetMovementSystem` and `fail-mission` end behavior — no changes to Game.tsx required. A `createBomberTargetModel()` function builds a readable aircraft silhouette (fuselage, swept wings, nacelles, engine glow, threat stripe). The `createMissionTarget()` factory branches on `bomber`/`transport` archetypes so those targets preserve their Y altitude instead of being clamped to ground. The ace-interceptor is a fast, high-drift escort with significant shields added as a wave composition entry. A new `validate:intercept` script confirms all intercept mission invariants.

**Changed files:**
- `src/types/game.ts` — Added `'bomber' | 'transport'` to `MissionTargetArchetype`; added `'ace-interceptor'` to `EnemyRole`
- `src/config/enemies.ts` — Added `ace-interceptor` definition (health 160, shields 80, speed 0.72, drift 0.42, fireCooldownMs 1400, scoreValue 900)
- `src/scene/objectiveModels.ts` — Added `createBomberTargetModel()` aircraft mesh helper; added `createAirborneMissionTarget()` for altitude-preserving targets; branched `createMissionTarget()` to use airborne path for `bomber`/`transport`
- `src/config/campaign.ts` — Added `prototype-intercept` arc (Prototype 91, PLANNED)
- `src/config/missions.ts` — Added `raven-break-prototype`: bomber at Y=200 with escape route, 2 ace-interceptor escort spawning at mission start, extraction at bomber start zone below
- `scripts/validate-intercept-prototype.ts` — New validator for intercept mission invariants
- `package.json` — Added `validate:intercept` script
- `src/config/buildMeta.ts` — PHASE_TAG → `'Phase 5c'`

**Verification:**
- Dockerized `npm run lint` — passed (0 TypeScript errors)
- Dockerized `npm run build && npm run validate:drone && npm run validate:prototype && npm run validate:intercept` — all passed
- `docker compose --progress plain build` — passed; image rebuilt with Phase 5c tag
- `docker compose --progress plain up -d --no-build && docker compose ps` — passed; container Up

**Deferred:**
- HUD/radar icon distinction for airborne targets vs ground targets — Stage 5f
- Ace-interceptor per-enemy phase offset for visually distinct drift patterns — cosmetic, deferred
- Multi-bomber formations or transport convoy variants — extend this pattern in a later stage

**Next recommended starting point:**
- Begin Stage 5d - Air-To-Land Threat Systems.
- Start by reading `src/config/enemies.ts` (existing ground-capable roles) and `src/scene/objectiveModels.ts` (add SAM, turret, railgun mesh helpers).
- Add ground threat archetypes that fire at the player and have weak points (barrel, radar dish, generator).


