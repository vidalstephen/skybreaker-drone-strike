# SKYBREAKER: Drone Strike

A browser-based 3D arcade flight game where you pilot a futuristic combat drone through tactical strike missions. Built entirely with React, Three.js, and TypeScript — no game engine required.

**Live:** [skybreaker.nsystems.live](https://skybreaker.nsystems.live)

---

## Stack

| Layer | Technology |
|---|---|
| UI / Shell | React 19, Tailwind CSS 4, Motion (Framer) |
| 3D Engine | Three.js 0.184 (WebGL) |
| Language | TypeScript 5.8 |
| Build | Vite 6 |
| Deploy | Docker · nginx · docker compose |

---

## Features

- **Full game shell** — animated splash screen, hangar hub menu, campaign mission browser, pre-mission briefing, weapon loadout review, pilot career stats, controls reference, and settings
- **Arcade flight physics** — assisted roll/pitch/yaw with boost, inertia, and altitude hold
- **3D procedural drone model** — symmetric wing geometry, pod emitters, thruster flame/glow effects, and ventral panels — all validated for bilateral symmetry
- **Chase & cockpit camera modes** — high-angle chase camera shows top-surface detail; cockpit mode for first-person immersion
- **Targeting system** — projected weapon path, aim convergence markers, secondary lock ring with progress arc
- **HUD** — compass, radar, speed display, vitals (shield/energy/hull), objective tracker, target markers
- **Campaign system** — multi-arc mission progression with unlock gates, scoring, time records, and rewards
- **Environments** — night-grid desert terrain with facility kits (relay spires, sensor arrays, command nodes)
- **Procedural audio** — Web Audio API, phase-aware music gain, SFX for weapons and flight events
- **Mobile support** — responsive layout, touch joystick controls, portrait and landscape tested

---

## Game Screens

```
BOOT → Splash Screen
  └─ MAIN_MENU → Hangar Hub
       ├─ MISSION_SELECT → Campaign browser
       │    └─ BRIEFING → Pre-mission intel
       │         └─ LOADOUT → Weapon review
       │              └─ IN_MISSION ──┬─ PAUSED
       │                              └─ DEBRIEF (MissionComplete / GameOver)
       ├─ CAREER → Pilot stats
       ├─ SETTINGS → Audio / Video / Gameplay
       ├─ CONTROLS → Key reference
       └─ CREDITS
```

---

## Development

**Prerequisites:** Docker (no local Node required)

```bash
# Install dependencies into a named volume (one-time)
docker run --rm \
  -v "$PWD":/app \
  -v skybreaker-drone-strike-node-modules:/app/node_modules \
  -w /app node:20-alpine sh -lc "npm ci"

# Dev server (hot-reload)
docker run --rm -it \
  -v "$PWD":/app \
  -v skybreaker-drone-strike-node-modules:/app/node_modules \
  -w /app -p 3000:3000 node:20-alpine sh -lc "npm run dev"

# Type-check
docker run --rm \
  -v "$PWD":/app \
  -v skybreaker-drone-strike-node-modules:/app/node_modules \
  -w /app node:20-alpine sh -lc "npm run lint"

# Validate drone model symmetry
docker run --rm \
  -v "$PWD":/app \
  -v skybreaker-drone-strike-node-modules:/app/node_modules \
  -w /app node:20-alpine sh -lc "npm run validate:drone"
```

### Production Build & Deploy

```bash
docker compose build && docker compose up -d
```

---

## Project Structure

```
src/
  App.tsx                  # Top-level phase router
  components/
    Game.tsx               # Main game loop, physics, rendering
    hud/                   # Compass, Crosshair, Radar, Vitals, TargetMarkers…
    menus/                 # All shell screens (SplashScreen, MainMenu, …)
    overlays/              # MissionComplete, GameOver, OutOfBoundsWarning
  config/
    campaign.ts            # Arc / mission definitions
    weapons.ts             # Weapon stats and unlock conditions
    enemies.ts             # Enemy type definitions
    environments.ts        # Terrain and sky configs
    levelKits.ts           # Facility kit placements
  scene/
    droneModel.ts          # Procedural aircraft geometry
    effects.ts             # Particle and glow effects
    environment.ts         # Ground, sky, fog
    facilityKit.ts         # Objective structure builder
    renderer.ts            # Three.js renderer setup
  systems/
    flightPhysics.ts       # Arcade flight model
    missionSystem.ts       # Objective tracking and scoring
    targetingProjection.ts # World-to-screen aim projection
  types/
    game.ts                # Shared TypeScript types and enums
scripts/
  smoke-mobile.cjs         # Playwright mobile smoke test
  validate-drone-symmetry.ts
docs/
  REGRESSION_SMOKE.md      # Manual regression checklist
```

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server on port 3000 |
| `npm run build` | Production build to `dist/` |
| `npm run lint` | TypeScript type-check (`tsc --noEmit`) |
| `npm run validate:drone` | Assert bilateral symmetry of all drone components |
| `npm run validate:storm` | Validate Storm Coast campaign mission data and unlock chain |
| `npm run validate:frozen` | Validate Frozen Relay campaign mission data and unlock chain |
| `npm run validate:canyon` | Validate Red Canyon campaign mission data and unlock chain |
| `npm run validate:core` | Validate Skybreaker Core finale mission data and unlock chain |
