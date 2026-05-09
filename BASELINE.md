# Skybreaker Drone Strike — Baseline Reference

This file documents the current working prototype state as a non-regression anchor. Any change that breaks the described controls, mission rules, or HUD behavior must be an explicit, intentional pass — not an accidental side effect of an architecture refactor.

---

## Controls

| Input | Action |
|---|---|
| W | Pitch nose down |
| S | Pitch nose up |
| A | Yaw left |
| D | Yaw right |
| Q | Roll left |
| E | Roll right |
| Shift (held) | Boost — 2× speed, drains energy |
| Space | Fire primary weapon (energy cannon, costs 4 energy, 150ms cooldown) |
| R | Auto-level — smoothly returns roll and pitch to horizon |
| C | Toggle camera mode (CHASE / COCKPIT) |
| Mouse drag | Fine attitude control (pitch/yaw) via pointer lock |

### Mobile controls

| Input | Action |
|---|---|
| Left joystick | Pitch + yaw |
| FIRE button | Fire primary weapon |
| BOOST button | Boost |
| LEVEL button | Auto-level |
| VIEW button | Toggle camera mode |

INV_Y toggle (top-right HUD button) flips joystick vertical axis.

---

## Player Systems

| System | Baseline | Regen | Notes |
|---|---|---|---|
| Hull / Health | 100 | None | Damage from enemy projectiles and terrain collision |
| Shields | 100 | +0.1/frame after 5 s of no damage | Absorbs damage before hull |
| Energy | 100 | +0.2/frame constant | Consumed by boost (−0.5/frame) and fire (−4/shot) |

Boost is gated: requires energy > 5. Fire is gated: requires energy > 0.

---

## Mission 1: Signal Break

### Objective

Destroy 3 radar tower installations, then retreat to the extraction zone.

### Tower positions (approximate world-space coordinates)

- Tower 0: (400, 0, −400) — north-east quadrant
- Tower 1: (−550, 0, 200) — west quadrant
- Tower 2: (100, 0, 700) — south quadrant

### Extraction zone

- Position: (0, 0, −1200) — far north
- Visible: only after all 3 towers are destroyed
- Completion radius: 80 world units (2D XZ distance check)
- Visual: cyan cylinder base + vertical beam column

### Enemy spawning

- AI interceptor drones spawn after 2 towers are destroyed
- Enemy behavior: pursue player and fire projectiles

### Failure conditions

- Hull health drops to 0 (`game over`)
- Drone leaves the mission boundary (out-of-bounds warning, then forced game over)

### Completion flow

1. All 3 towers destroyed → objective updates to "RETREAT TO EXTRACTION POINT"
2. Extraction zone becomes visible
3. Player enters 80m radius at any altitude → mission complete
4. Mission complete overlay shows elapsed time, enemies destroyed, hull integrity, targets hit

---

## HUD Elements

| Element | Location | Description |
|---|---|---|
| Title / camera mode badge | Top left | "SKYBREAKER DRONE STRIKE" + CHASE/COCKPIT badge |
| Compass | Top centre | Scrolling tape with cardinal N/E/S/W markers |
| Connection + battery | Top right | Static readout (cosmetic, not game-logic) |
| Radar | Top right (below stats) | 128×128 px SVG radar with range rings, sweep, blips |
| Crosshair / reticle | Screen centre | Orange bracket reticle with boost pulse and hit flash |
| Aim convergence line | Chase mode only | Dashed SVG line from drone to convergence point |
| Target markers | Tracked 3D → screen | Orange bracket markers on-screen; directional arrows off-screen |
| Extraction marker | Same as targets | Emerald colour; appears after all towers destroyed |
| Speed display | Bottom left | Numeric km/h readout + OVERDRIVE/CRUISE label |
| Vitals bars | Bottom left | Shields (cyan), Energy (orange), Health (red) |
| Objectives panel | Bottom right | Current objective text + enemies destroyed counter |
| Message strip | Bottom right | Animated status line (tower destroyed, neutralized, etc.) |
| Out-of-bounds warning | Full-screen overlay | Pulsing red border + warning text |
| Mission complete overlay | Full-screen overlay | Stats grid + "Return to Hangar" button (page reload) |
| Game over overlay | Full-screen overlay | Stats grid + "Retry Mission" button (page reload) |
| Key hints bar | Bottom centre (desktop only) | Visual keyboard indicator, hidden on mobile |

### Radar categories

| Blip | Shape | Colour |
|---|---|---|
| Objective towers | Circle | Orange |
| Enemy drones | Square | Red |
| Extraction zone | Circle | Emerald |
| Player | Fixed arrow | Teal |

Radar range: 700 world units. Blips outside range clamp to edge.

---

## Camera Modes

**CHASE (default)**
- Camera trails 12 units behind and 4 units above the drone
- Smooth lerp factor: 0.08
- FOV: 75° cruise, 82° boost (smooth transition)
- Camera shake on collision and boost activation

**COCKPIT**
- Camera locks to drone position/orientation
- Cockpit overlay: pitch/yaw guide lines, horizon data

---

## Visual Non-Regression Rules

The following must not regress as a side effect of refactoring or new feature work:

1. Chase camera must remain readable — drone silhouette centred, horizon visible
2. Target markers must not clip into the HUD bars (bottom 120px, top 80px safe zones)
3. Radar heading must not snap at 0°/360° wrap
4. Speed streaks must be invisible at cruise, subtle at boost
5. Engine glow must not wash out the drone body silhouette
6. Explosion size must not fill the screen on single tower destruction
7. Mission success overlay must display correct elapsed time and stat values
8. Extraction trigger must fire exactly once at ≤80m XZ distance
9. Tower destruction count must be accurate — no double-count on simultaneous hits
10. Game over must trigger on health ≤ 0 and not be suppressible by being out-of-bounds

---

## Build Verification

Run these after every architectural change before considering a phase complete:

```bash
npm run lint         # TypeScript type-check
npm run build        # Vite production build
# Then from stack directory:
docker compose build
docker compose up -d && docker compose ps
```

Expected outcomes:
- `npm run lint` — zero errors
- `npm run build` — no type errors; chunk size warning at ~1.4MB is acceptable
- Container shows `Up` status after deploy
