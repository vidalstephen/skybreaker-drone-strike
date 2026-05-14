# Skybreaker Drone Strike - Current Game Overview

Current-state snapshot date: 2026-05-13.

This document describes the implemented game as it exists now. It is the current-state source of truth for planning. Future goals belong in `roadmap.md`; completed historical work lives in `docs/DEV-CHECKLIST.v1-phases-0-to-stage2a.archive.md`; regression expectations live in `BASELINE.md`.

## Current State Summary

Skybreaker Drone Strike is a browser-based 3D arcade drone combat game built with React, TypeScript, Vite, Tailwind CSS, Motion, and Three.js. The current playable game is a compact eight-mission tactical arcade campaign plus one isolated post-campaign set-piece proving-ground sortie, not a single-mission prototype and not a simulation-grade flight/combat sim.

The core loop is:

1. Open the splash screen and hangar hub.
2. Continue the next unlocked sortie or browse mission select.
3. Review a compact briefing and optionally inspect loadout.
4. Launch into a Three.js arena.
5. Fly the drone, destroy required mission targets, and survive the enemy response wave.
6. Reach the extraction zone after all required targets are destroyed.
7. Receive score, rank, reward, best-time/best-score persistence, and the next mission unlock.

Implemented pillars:

- Full app shell with splash, hangar, mission select, briefing, optional loadout review, career, settings, controls, credits, pause, mission complete, and game over screens.
- Eight chained mission definitions grouped across campaign arcs.
- Arcade flight with chase/cockpit camera modes, boost, brake, throttle, auto-level, pointer fine control, and direct touch-drag mobile steering.
- Primary Pulse Cannon and unlockable Ion Missile secondary projectile.
- Procedural player drone, enemy meshes, facility targets, weak-point target layouts, extraction zones, arena structures, effects, and Web Audio cues.
- HUD with compass, reticle, projected weapon path, radar, vitals, speed, collapsible objective chip, world markers, telemetry, and warning overlays.
- Shared tactical tracking snapshots for radar/objective/extraction/enemy awareness.
- Persistent settings and campaign progress through localStorage.
- Docker/nginx production deployment path.

## Application Architecture

Top-level phase routing is owned by `src/App.tsx` using `GamePhase` from `src/types/game.ts`.

Implemented phases:

- `BOOT`
- `MAIN_MENU`
- `MISSION_SELECT`
- `BRIEFING`
- `LOADOUT`
- `CAREER`
- `CONTROLS`
- `CREDITS`
- `IN_MISSION`
- `PAUSED`
- `DEBRIEF`
- `SETTINGS`

The live Three.js runtime is owned by `src/components/Game.tsx`. It orchestrates scene setup, refs, flight, combat, enemy updates, projectile collision, mission target destruction, extraction completion, HUD state, input, and animation.

Config modules:

- `src/config/missions.ts` defines the eight authored missions.
- `src/config/campaign.ts` defines campaign arc metadata.
- `src/config/levelKits.ts` defines reusable level kits and weak-point layouts.
- `src/config/weapons.ts` defines weapon stats and unlock requirements.
- `src/config/enemies.ts` defines enemy roles and stats.
- `src/config/environments.ts` defines environment visuals, hazards, and structure kits.
- `src/config/defaults.ts` defines default settings and progress.
- `src/config/constants.ts` defines flight, camera, effect, radar, and HUD tuning.

Runtime systems:

- `src/systems/flightPhysics.ts` handles arcade movement helpers, throttle, boost, brake, rotation, and auto-level.
- `src/systems/missionSystem.ts` handles mission unlocks, completion persistence, scoring, and ranking.
- `src/systems/trackingSystem.ts` stores serializable tracked entity snapshots and priority scoring.
- `src/systems/targetingProjection.ts` handles world-to-screen projection helpers.

Scene construction:

- `src/scene/renderer.ts` creates the renderer, scene, camera, and speed streaks.
- `src/scene/environment.ts` creates sky, floor, grid, haze, boundary, hazards, plateaus, and atmosphere.
- `src/scene/facilityKit.ts` creates industrial structures.
- `src/scene/droneModel.ts` creates the player aircraft.
- `src/scene/enemyModels.ts` creates enemy visuals.
- `src/scene/objectiveModels.ts` creates mission targets, weak points, and extraction zones.
- `src/scene/waypointIllustrations.ts` creates world-space target/extraction callouts.
- `src/scene/effects.ts` creates projectile and explosion resources.

## Campaign And Missions

The current campaign contains eight authored missions. A separate prototype range sortie exists after the campaign for set-piece validation and tuning:

| Order | Mission | Current domain/type/time data |
|---|---|---|
| 01 | Signal Break | `AIR_TO_LAND`, `STRIKE`, `night` |
| 02 | Iron Veil | `AIR_TO_LAND`, `STRIKE`, `dusk` |
| 03 | Black Sky Hook | `AIR_TO_LAND`, `STRIKE`, `night` |
| 04 | Deep Veil | `AIR_TO_LAND`, `STRIKE`, `dusk` |
| 05 | Warden Break | `AIR_TO_LAND`, `STRIKE`, `dusk` |
| 06 | Ember Crown | `MIXED`, `STRIKE`, `dawn` |
| 07 | Skybreaker Gate | `MIXED`, `BOSS`, `night` |
| 08 | Final Dawn | `MIXED`, `FINALE`, `dawn` |
| 90 | Set-Piece Proving Ground | `MIXED`, `SABOTAGE`, `dawn`, prototype range |

The missions are data-defined and hand-authored. They use target arrays, extraction definitions, enemy wave definitions, failure condition labels, scoring definitions, reward definitions, unlock gates, campaign arc metadata, and Stage 2a classification fields.

Current runtime mission behavior is still centered on required target destruction followed by extraction. The Stage 2a classification fields are present for future systems, but combat domain, mission type, and time of day do not yet drive specialized runtime mechanics.

## Mission Loop

Each mission begins with required targets active. The objective text is formatted from mission data and displayed through the collapsible objective HUD.

When enough targets are destroyed, the mission's enemy wave spawns. This threshold is controlled by `mission.enemyWave.triggerTargetsDestroyed`.

When all mission targets are destroyed:

- The objective changes to extraction.
- The extraction zone becomes visible.
- Radar and world markers show extraction guidance.
- Entering the extraction radius completes the mission exactly once.

Mission failure currently occurs when hull health reaches zero. Leaving the mission boundary currently sets the out-of-bounds warning state, but the runtime does not currently enforce boundary crossing as mission failure.

## Flight And Controls

The flight model is an arcade forward-flight model. It is intentionally readable and responsive rather than physically simulated.

Desktop controls:

- `W / S`: pitch.
- `A / D`: assisted bank-turn.
- `Q / E`: yaw correction.
- `R / F`: throttle up/down.
- `Ctrl`: brake.
- `Shift`: boost.
- `Space`: primary fire.
- `Alt` or right mouse: secondary weapon when unlocked.
- `X`: auto-level.
- `C`: camera toggle.
- `Escape` or `P`: pause/resume.
- Pointer drag: fine pitch/yaw control.

Mobile controls:

- Direct touch-drag zone for pitch and turn input.
- FIRE, BOOST, MSL, BRK, LEVEL, and VIEW action buttons.
- Touch drag sensitivity and touch control scale settings.

The controls UI/key hint still references `Tab / T` target lock in places, but target cycling/lock control is not currently wired into runtime target selection.

## Weapons And Combat

Implemented player weapons:

- Pulse Cannon: always available primary projectile, low energy cost, short cooldown.
- Ion Missile: secondary projectile unlocked through the `extraction-protocol` reward after Mission 01.

Current Ion Missile behavior is an anti-air-flavored secondary projectile with higher damage and blast radius. It does not currently home, seek, require a runtime lock, or track a selected target in `Game.tsx`.

Projectile simulation is mesh-based. Player projectiles travel in the drone's forward direction at fire time. Enemy projectiles travel toward the player's position at fire time. Collision checks use segment-style movement between previous/current projectile positions to reduce tunneling.

Player projectiles can hit:

- Mission target weak points.
- Mission target cores when weak points do not block damage.
- Enemy drones.

Enemy projectiles can hit the player. Shields absorb damage before hull health.

## Targets And Weak Points

Mission targets support direct-health destruction and optional weak-point layouts.

Current weak-point layouts:

- Radar Array: left and right required array weak points.
- Relay Core: relay core, upper node, and stabilizer weak points.

When active required weak points exist, target body hits can redirect damage to weak points and the target core is protected until required weak points are destroyed. Later missions mostly rely on tower-style direct-health targets until structured objective work expands target archetypes.

Target destruction hides final meshes, hides world-space callouts, spawns explosion feedback, updates target count, updates tracking state, and can activate extraction.

## Enemies

Implemented enemy roles:

- Fast Interceptor.
- Heavy Gunship.
- Missile Platform.
- Shielded Warden.
- Mini-Boss / Command Frigate.

Enemy roles have separate stats, silhouettes, shields, health, ranges, damage, speed, and score values. Behavior is still shared and simple: enemies pursue or back away based on range, drift/orbit slightly, face the player, and fire direct projectiles. Missile platforms do not launch homing missiles, and the mini-boss is currently a stronger enemy rather than a multi-phase boss encounter.

## HUD, Tracking, And Radar

The in-mission HUD includes:

- Compass.
- Crosshair and projected weapon path.
- Radar with type-specific tracked entity shapes, priority pulse support, extraction edge pins, selected-track connector, and state label.
- Speed display.
- Vitals for hull, shields, weapon energy, and boost energy.
- Collapsible objective chip/panel that expands on mission start and objective changes.
- Weapon status rows.
- World-space and screen-space target/extraction markers.
- Camera and invert-Y toggles.
- Optional telemetry.
- Damage flash and out-of-bounds warning.
- Mobile action controls.

The tracking system can register objectives, enemies, hazards, and extraction as serializable snapshots. Radar uses those snapshots instead of ad hoc blip arrays. Tracking events are not yet wired to a full attention event bus for objective-chip pulses beyond objective text changes.

## Environments

Two level kits are implemented:

- Night Grid: dark tactical grid arena with signal-array target language and industrial structures.
- Ash Ridge: warmer ash-grid arena with ridge/relay identity, industrial structures, and Ash Static hazard zones.

Environment visuals include sky depth, horizon haze, fog, grid hierarchy, floor material tuning, industrial structure kits, plateaus, boundary ring, hazard rings, extraction visuals, and world-space waypoint illustrations.

Future biome/time/weather systems are planned, but the current runtime does not yet combine arbitrary biome, time-of-day, and weather definitions into gameplay effects.

## Progression, Scoring, And Persistence

Campaign progress persists through localStorage and includes:

- Unlocked mission ids.
- Completed mission ids.
- Best mission times.
- Best mission scores.
- Best mission ranks.
- Earned reward ids.

Settings also persist through localStorage and include audio volumes, graphics quality, reduced effects, invert Y, HUD scale, touch scale, pointer sensitivity, touch drag sensitivity, screen shake, telemetry, and menu motion.

Mission scoring uses mission-specific base score, target bonus, enemy bonus, health bonus, time bonus, par time, and rank thresholds. Mission completion unlocks follow-on missions and rewards.

Loadout is currently a review screen. The runtime automatically equips the first unlocked primary weapon and first unlocked secondary weapon. Player-selectable weapons, ship modules, upgrade trees, currencies, and branching unlock paths are not implemented yet.

## Audio And Presentation

Audio is implemented with the Web Audio API in `src/hooks/useAudio.ts`. It includes procedural UI, weapon, hit, damage, success, failure, and phase-aware music cues. Audio starts safely after user interaction and respects master/music/SFX settings.

Presentation includes procedural low-poly models, tactical arena lighting, speed streaks, muzzle flashes, explosions, facility structures, weak-point visuals, world-space callouts, damage flash, and reduced-effects/graphics-quality scaling.

## Known Gaps

- Structured objective definitions are not implemented yet; missions still rely primarily on target arrays.
- Optional objectives and bonus conditions are not implemented yet.
- Weather definitions and gameplay effects are not implemented yet.
- Time-of-day fields exist but do not yet drive lighting/gameplay variants.
- Biome expansion beyond Night Grid and Ash Ridge is not implemented yet.
- True target lock, target cycling, homing missiles, and lock-required secondary fire are not implemented in the current runtime.
- Out-of-bounds behavior is warning-only and needs a policy decision before mission expansion depends on boundaries.
- Tracking attention events are not fully connected to objective tab/radar/audio pings.
- Weak-point tracking is not fully represented as child tracked entities.
- Loadout selection, upgrade trees, currency, and mechanical reward choices are not implemented yet.
- Enemy behavior depth is limited; roles mostly differ by stats, visuals, and firing ranges.
- Air-to-air, air-to-sea, moving convoy, escort, defense, recon, and multi-stage boss mission types are future work.

## Source Of Truth Rules

- Treat this file as current implemented state.
- Treat `roadmap.md` as future staged work.
- Treat `DEV-CHECKLIST.md` as the active phase tracker.
- Treat `docs/DEV-CHECKLIST.v1-phases-0-to-stage2a.archive.md` as historical build context.
- Treat `BASELINE.md` as the non-regression anchor, but verify old baseline wording against this overview and current code before using it as implementation truth.
