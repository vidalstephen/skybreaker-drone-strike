# Skybreaker Drone Strike - Future Roadmap

This roadmap starts from the current state described in `overview.md` and turns known gaps into staged future work. The current game is an eight-mission compact arcade campaign. The future target is a larger tactical arcade campaign with structured objectives, varied biomes, weather, time-of-day, air/land/sea combat domains, richer set pieces, clearer progression, and stronger long-term replay value.

## Roadmap Principles

- Keep the game playable after every stage.
- Build reusable systems before adding large amounts of content.
- Make objective type, combat domain, biome, time of day, weather, enemy type, and extraction behavior data-driven instead of one-off mission code.
- Keep the HUD focused on immediate flight/combat awareness; objectives and supporting data should expand only when useful.
- Treat radar and tracking as tactical tools for priority, threat, direction, and extraction awareness.
- Preserve the faster launch path and direct mobile touch-drag control already implemented.
- Increase mission grandeur through target structure, staged destruction, moving entities, and combat context instead of only larger health pools.
- Expand the campaign in arcs so new mechanics are introduced, tested, remixed, and then escalated.
- Prefer backward-compatible schema changes so existing saves and existing missions continue to work.

## Gap Audit From Current Overview

| Gap or weakness | Current state | Future target | Roadmap stage |
|---|---|---|---|
| Documentation drift | Historical checklist and some README/BASELINE wording conflict with current code | Current overview, roadmap, and active checklist stay synchronized | Stage 0 |
| Mission variety | Eight missions mostly use destroy-target-then-extract structure | Structured objective families: strike, intercept, defense, escort, recon, sabotage, survival, boss, finale | Stage 2, Stage 4, Stage 5 |
| Objective data | Targets/extraction/enemy waves are data-defined; objective lifecycle is not fully structured | `ObjectiveDefinition` model with independent progress, failure, optional goals, HUD/tracking metadata | Stage 2 |
| Campaign breadth | Eight chained missions across current arcs | 18-24 main missions plus optional sorties and challenge variants | Stage 6, Stage 9 |
| Weather | Not implemented as gameplay | Weather affects visibility, drift, radar/sensor behavior, energy/shields, or projectile handling fairly | Stage 3 |
| Time of day | Mission field exists; runtime variation is limited | Lighting/readability presets for dawn, day, dusk, night, storm night, blackout/eclipse | Stage 3 |
| Biomes | Night Grid and Ash Ridge kits | Storm Coast, Arctic Shelf, Ocean Platform, Urban Ruin, Red Canyon, Stratosphere/Orbital Relay | Stage 3, Stage 6 |
| Air-to-air combat | Basic enemy drones in mixed waves | Intercepts, bomber hunts, escort screens, ace enemies, target lock/homing systems | Stage 5 |
| Air-to-land combat | Fixed towers/facilities and weak points | Convoys, SAMs, artillery, shield generators, mobile command vehicles, base assaults | Stage 4, Stage 5 |
| Air-to-sea combat | Not implemented | Carriers, patrol boats, platforms, naval AA, wakes, sea mines, moving ships | Stage 5, Stage 6 |
| Destruction objectives | Weak points exist on early facility targets; later targets are mostly direct health | Multi-stage set pieces, exposed components, chained failures, reactors, bridges, carriers, command cores | Stage 4 |
| Camera spatial distortion | Mobile play shows misleading apparent target distance near screen edges during turns; desktop should be checked too | Calibrated chase/cockpit camera FOV, look-at, and projection behavior so target distance feels stable and non-fisheye while turning | Stage 1e |
| Tactical tracking | Shared tracking/radar exists for targets, enemies, hazards, extraction | Mission-authored tracking metadata, child weak-point tracks, attention events, audio/radar pings | Stage 2 |
| Missile lock | UI/copy references lock, but current secondary projectile does not home or require lock | Selected target, lock acquisition, homing/projectile guidance, lock-required firing where appropriate | Stage 5 |
| Out-of-bounds | Warning state only | Mission-authored warning, timed fail, hard fail, or retreat-window rules | Stage 0, Stage 2 |
| Loadout/progression | Review screen and one secondary unlock | Selectable weapons, upgrades, currency/parts, mechanical rewards, recommendations | Stage 7 |
| Enemy depth | Roles differ by stats/meshes but share basic pursuit/fire behavior | Behavior controllers, formations, ground/naval threats, telegraphs, bosses with phases | Stage 8 |
| Procedural/replay content | Not implemented | Optional sorties and semi-procedural contracts from authored modules | Stage 9 |

## Stage 0 - Roadmap Baseline And State Reconciliation

Status: Complete for this documentation reset. Keep this stage open as a recurring gate when major implementation truth changes.

Goal: cleanly align documentation, current implementation, and future direction before adding systems.

Completed in the reset:

- Archived the old root checklist to `docs/DEV-CHECKLIST.v1-phases-0-to-stage2a.archive.md`.
- Rebuilt `overview.md` as the current-state source of truth.
- Rebuilt `roadmap.md` as the future-state source of truth.
- Rebuilt `DEV-CHECKLIST.md` as the active phase-worker tracker.
- Corrected current-state contradictions around touch-drag, Stage 2a classification fields, missile lock/homing behavior, and out-of-bounds behavior.

Remaining policy decisions:

- Decide whether out-of-bounds should be warning-only, timed fail, hard fail, or mission-specific.
- Refresh stale `README.md` and `BASELINE.md` wording in a separate docs pass.

Exit criteria:

- Current-state docs and roadmap do not contradict each other.
- Future features have stage assignments.
- The next implementation stage can begin without open documentation ambiguity.

## Stage 1 - Fast Launch, Immediate Readability, Tactical Tracking, And Control Upgrade

Status: In progress, reopened for camera/FOV spatial readability.

Goal: make the game easy to start, easy to read, and easy to control before adding more combat complexity.

Completed work:

- Fast launch flow and CTA hierarchy: the hangar and briefing flow expose a dominant continue/launch path, with loadout review optional while loadout has no choices.
- HUD objective behavior: objective panel collapses into a chip, expands at mission start, and re-expands when objective text changes.
- Tactical tracking/radar: shared tracking snapshots feed radar hierarchy, priority scoring, extraction edge pins, type-specific icons, selected connector, and radar state label.
- Mobile direct touch-drag control: persistent joystick was replaced by drag-origin steering plus action buttons and configurable sensitivity.

### Stage 1e - Camera FOV And Spatial Readability Calibration

Status: Not started.

Goal: investigate and fix the disorienting apparent-distance shift seen especially on mobile when turning the player aircraft. Targets near the screen edge can appear extremely close, then seem to jump farther away as the aircraft turns toward them, creating a fisheye-like effect.

Current camera facts to inspect:

- `src/scene/renderer.ts` creates a `THREE.PerspectiveCamera` at FOV 75.
- `src/config/constants.ts` sets `NORMAL_FOV = 75` and `BOOST_FOV = 82`.
- `src/components/Game.tsx` chase camera uses local offset `(0, 5.5, 3.8)`, look-at target `(0, 3.0, -14)`, quaternion-relative camera motion, and dynamic FOV interpolation.

Work to implement:

- Reproduce on mobile first, then desktop, with targets at center, mid-screen, and screen edges while yawing/banking.
- Determine whether the issue is caused by wide vertical FOV, aspect-ratio effects, boost FOV, chase camera offset/look-at geometry, marker projection, camera lerp, or a combination.
- Test narrower baseline/mobile FOV values, reduced/removed boost FOV widening, adjusted chase camera distance/height/look-ahead, and steadier look-at behavior.
- Update camera constants or camera logic so apparent target distance remains intuitive while turning.
- Verify the fix does not hide the aircraft, reticle, aim path, target markers, radar, or mobile controls.

Acceptance criteria:

- On mobile landscape, targets near the screen edge no longer appear dramatically closer than they feel when centered.
- Desktop chase view also avoids fisheye-like distance misreads.
- Boost FOV, if retained, does not create misleading target scale or edge distortion.
- Chase camera remains readable with the aircraft framed and reticle unobstructed.
- Cockpit camera is checked for comparable distortion.
- Playwright/mobile smoke or hands-on visual smoke records before/after screenshots or notes.

Deferred from Stage 1 into later stages:

- Full tracking attention event bus.
- Weak-point child track registration.
- Audio/radar pings for tracking changes.
- True target lock/homing missile behavior.

## Stage 2 - Mission Data Model Expansion

Status: In progress.

Goal: upgrade the mission framework so future content can express more than fixed target destruction.

This stage is the foundation for structured objectives, optional objectives, mission-authored tracking, extraction variants, weather hooks, biome/time/weather data, set pieces, and later campaign expansion.

### Stage 2a - Mission Classification Fields

Status: Complete.

Completed work:

- Added `CombatDomain`: `AIR_TO_AIR`, `AIR_TO_LAND`, `AIR_TO_SEA`, `MIXED`.
- Added `MissionType`: `STRIKE`, `INTERCEPT`, `DEFENSE`, `ESCORT`, `RECON`, `SABOTAGE`, `SURVIVAL`, `BOSS`, `FINALE`.
- Added `TimeOfDayId`: `dawn`, `day`, `dusk`, `night`.
- Added optional mission fields for classification.
- Populated all eight existing missions.
- Surfaced classification chips in the briefing UI.

### Stage 2b - Structured Objective Definitions

Status: Not started.

Goal: introduce a backward-compatible objective model that can represent current destroy-target missions and future non-target-only missions.

Work to implement:

- Define `ObjectiveDefinition` with `id`, `type`, `label`, `description`, `required`, progress fields, failure fields, tracking metadata, and HUD metadata.
- Define `ObjectiveType`: `DESTROY_ALL`, `DESTROY_WEAK_POINTS`, `INTERCEPT`, `DEFEND_ZONE`, `ESCORT_ASSET`, `RECON_SCAN`, `DISABLE_SHIELDS`, `SURVIVE_UNTIL`, `ELIMINATE_BOSS`, `EXTRACT`.
- Add backward-compatible `objectiveSet?` to `MissionDefinition` while keeping existing `targets`, `enemyWave`, and `extraction` behavior working.
- Represent the existing eight missions through generated or authored objective definitions without behavior loss.
- Feed objective state updates into the existing objective chip and tracking snapshots.
- Avoid adding per-mission custom branches inside `Game.tsx`.

Acceptance criteria:

- Existing eight missions remain playable with no behavior loss.
- Current target-destruction and extraction objectives are expressible in the new schema.
- Objective updates can drive HUD text, tracking priority, and future event hooks.
- TypeScript, build, Docker deploy, and a focused gameplay smoke pass succeed.

### Stage 2c - Optional Objectives And Bonus Conditions

Status: Not started.

Work to implement:

- Add optional objectives and bonus conditions to mission schema.
- Support time thresholds, preserve-ally goals, optional convoy/ship/antenna destruction, hazard avoidance, and hull threshold bonuses.
- Surface optional objective status in HUD and debrief without cluttering combat view.

### Stage 2d - Mission Runtime State Extension

Status: Not started.

Work to implement:

- Extend mission runtime state so objectives can independently track progress, completion, failure, optional status, and HUD updates.
- Keep authoritative simulation refs out of React state; publish serializable snapshots for UI.

### Stage 2e - Mission Event Hooks

Status: Not started.

Work to implement:

- Add mission event hooks for weather changes, reinforcements, objective phase changes, extraction activation, warnings, and timed conditions.
- Connect objective/tracking changes to objective chip expansion and radar attention states.

### Stage 2f - Mission-Authored Tracking Metadata

Status: Not started.

Work to implement:

- Add objective priority, radar label, world marker label, icon type, discovery behavior, approach hint, route hint, attention reason, and visibility behavior to mission data.
- Allow objectives, enemies, extraction, hazards, and weak points to define always tracked, hidden until activation, hidden until scanned, or urgent-only presentation.

### Stage 2g - Multi-Stage Objectives

Status: Not started.

Work to implement:

- Extend mission schema for multi-stage objectives with child tracks and phase-specific tracking rules.
- Support exposed/hidden subcomponents, shield gates, reactor phases, boss phases, and final escape windows.

### Stage 2h - Extraction Metadata States

Status: Not started.

Work to implement:

- Add extraction states: inactive, activating, active, approaching, inside-radius, completed, contested, alternate, moving, and emergency.
- Let mission data choose extraction policy and warning behavior.

## Stage 3 - Biomes, Time Of Day, And Weather With Gameplay Effects

Status: Not started.

Goal: make mission spaces feel varied and make weather matter in play without frustrating arcade readability.

Biomes to add:

- Storm Coast.
- Arctic Shelf.
- Ocean Platform.
- Urban Ruin.
- Red Canyon.
- Stratosphere/Orbital Relay.

Time-of-day presets to add:

- Dawn.
- Day.
- Dusk.
- Night.
- Storm Night.
- Blackout/Eclipse.

Weather types to add:

- Clear.
- Crosswind.
- Rain.
- Lightning storm.
- Ash storm.
- Snow/frost.
- Sea squall.
- Electromagnetic interference.

Acceptance criteria:

- Weather has noticeable but fair gameplay effects.
- HUD, reticle, radar, and objective markers remain readable.
- Biome, time, and weather combine without one-off mission branches.

## Stage 4 - Grand Destruction And Objective Set Pieces

Status: Not started.

Goal: replace repeated tower destruction with memorable strike objectives and staged destruction.

Objective families:

- Radar network collapse.
- Shield generator assault.
- Convoy strike.
- SAM suppression.
- Reactor sabotage.
- Bridge/rail cut.
- Carrier strike.
- Naval platform raid.
- Command frigate operation.
- Skybreaker mega-core finale.

Acceptance criteria:

- At least four distinct objective archetypes exist before campaign expansion.
- Set-piece progress is visible in world, HUD, radar, and debrief.
- Performance and readability remain stable.

## Stage 5 - Combat Domain Expansion: Air, Land, And Sea

Status: Not started.

Goal: make the campaign mechanically broad enough to support varied theaters.

Air-to-air work:

- Dedicated intercept missions.
- Bomber/transport enemies with escorts.
- Ace enemies with readable evasive behavior.
- True selected target, lock acquisition, and homing missile behavior where appropriate.

Air-to-land work:

- SAM sites, turrets, artillery, shield nodes, convoys, railguns, and mobile command units.
- Ground threat telegraphs and attack-run incentives.

Air-to-sea work:

- Ocean/sea rendering, moving ships, platforms, wakes, carrier groups, patrol boats, naval AA, and sea mines.

Acceptance criteria:

- Each combat domain has unique enemies, objectives, and tactical pressure.
- Mixed-domain missions remain readable through radar/HUD distinctions.

## Stage 6 - Campaign Expansion Wave 1

Status: Not started.

Goal: use the new mission, objective, environment, weather, and combat-domain systems to grow the campaign backbone.

Target scope:

- Expand from eight missions to roughly 18-24 main campaign missions.
- Organize missions into 5-6 arcs.
- Add missions in batches of 3-4.
- Pair each new mechanic with a teaching mission and later remix mission.
- Preserve old saves through migration.

Suggested arcs:

1. Signal War.
2. Blackout Line.
3. Storm Coast.
4. Frozen Relay.
5. Red Canyon Siege.
6. Skybreaker Core.

## Stage 7 - Player Progression, Loadout, And Upgrade Paths

Status: Not started.

Goal: add meaningful between-mission decisions and make rewards mechanically useful.

Work to implement:

- Player inventory/progression state.
- Upgrade definitions and unlock requirements.
- Currency, parts, or upgrade points.
- Loadout Review becomes Loadout Selection.
- Hangar/Upgrades screen.
- Mission tags that recommend or require payload categories.
- Rewards that alter gameplay rather than only adding archive text.

Suggested upgrade trees:

- Flight Core.
- Weapons Core.
- Defense Core.
- Sensor Core.
- Payload Core.

## Stage 8 - Enemy AI, Factions, Bosses, And Reactive Encounters

Status: Not started.

Goal: make expanded combat feel varied through behavior, not only stats.

Work to implement:

- Separate enemy behavior controllers from visual definitions.
- Add formation, pursuit, retreat, guard, patrol, strafing, and objective-attack behaviors.
- Add ground and naval targeting logic.
- Add telegraphs for missiles, railguns, beam attacks, and area denial.
- Add faction/theater variants.
- Add boss phase controller.

## Stage 9 - Campaign Expansion Wave 2 And Optional Sorties

Status: Not started.

Goal: add replay value and optional breadth after the expanded campaign is stable.

Work to implement:

- Optional side sorties.
- Challenge variants.
- Semi-procedural contract generator using authored modules.
- Local challenge seeds if desired.
- Advanced scoring medals beyond S-rank.
- Arc mastery rewards.

## Stage 10 - Final Polish, Performance, And Release Hardening

Status: Not started.

Goal: stabilize the enlarged game and make the campaign feel finished.

Work to implement:

- Full regression smoke for every biome, weather type, time of day, mission type, and combat domain.
- Mobile control smoke across portrait overlay, landscape gameplay, and action buttons.
- HUD/radar/objective overlap tests across desktop and mobile.
- Performance budgets for weather, water, enemy count, and destruction VFX.
- Accessibility/readability pass.
- Audio pass for weather, naval combat, boss phases, warnings, and mission outcomes.
- Save migration tests.
- Bundle/chunk optimization if the large Vite chunk becomes a real load-time issue.

## Work Index By Feature

| Future work | Stage |
|---|---|
| Current-state docs and historical checklist archive | Stage 0 |
| Decide out-of-bounds warning/fail behavior | Stage 0, Stage 2 |
| Refresh stale README/BASELINE wording | Stage 0 |
| Fast start/continue launch flow | Stage 1 complete |
| Objective chip and objective-change expansion | Stage 1 complete |
| Shared tactical tracking/radar model | Stage 1 complete |
| Direct mobile touch-drag steering | Stage 1 complete |
| Camera FOV/spatial distortion investigation and fix | Stage 1e |
| Combat domain, mission type, and time-of-day fields | Stage 2a complete |
| Structured objective definitions | Stage 2b |
| Optional objectives and bonus conditions | Stage 2c |
| Runtime objective state snapshots | Stage 2d |
| Mission event hooks | Stage 2e |
| Mission-authored tracking metadata | Stage 2f |
| Multi-stage objective schema | Stage 2g |
| Extraction state metadata | Stage 2h |
| Weather definitions and gameplay modifiers | Stage 3 |
| Multiple biomes and time-of-day presets | Stage 3 |
| Grand multi-stage destruction objectives | Stage 4 |
| Moving convoy and sea target support | Stage 4, Stage 5 |
| True target lock and homing missiles | Stage 5 |
| Air-to-air mission mechanics | Stage 5 |
| Air-to-land mission mechanics | Stage 5 |
| Air-to-sea mission mechanics | Stage 5 |
| Expanded campaign arcs and 18-24 main missions | Stage 6 |
| Loadout selection | Stage 7 |
| Upgrade trees and unlock paths | Stage 7 |
| Enemy behavior controllers | Stage 8 |
| Boss phases | Stage 8 |
| Optional sorties and challenge variants | Stage 9 |
| Semi-procedural contract generator | Stage 9 |
| Full expanded-game regression and performance pass | Stage 10 |

## Recommended Implementation Order

1. Stage 1e: camera FOV and spatial readability calibration.
2. Stage 2b: structured objective definitions.
3. Stage 2c: optional objectives and bonus conditions.
4. Stage 2d: mission runtime state extension.
5. Stage 2e: mission event hooks.
6. Stage 2f: mission-authored tracking metadata.
7. Stage 2g: multi-stage objectives.
8. Stage 2h: extraction metadata states.
9. Stage 3: biome/time/weather systems.
10. Stage 4: destruction objective archetypes.
11. Stage 5: air/land/sea combat domains.
12. Stage 6: campaign expansion wave 1.
13. Stage 7: progression and upgrade trees.
14. Stage 8: enemy AI and bosses.
15. Stage 9: optional sorties and replay expansion.
16. Stage 10: polish, optimize, test, and harden.

## Immediate Next Step

Begin Stage 1e - Camera FOV And Spatial Readability Calibration.

Start by reading `src/scene/renderer.ts`, `src/config/constants.ts`, and the camera follow block in `src/components/Game.tsx`. Reproduce the mobile target-distance distortion, test narrower FOV and chase-camera/look-at adjustments, then verify mobile and desktop chase/cockpit readability before returning to Stage 2b.
