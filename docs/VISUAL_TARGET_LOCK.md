# Skybreaker Drone Strike Visual Target Lock

This document locks the visual direction for the tactical arcade combat evolution. It is a guardrail for staged implementation, not a request to replace the working prototype.

## Source References

Future visual phases must check these project-root concept artifacts before implementation:

- `upgrade-plan-concept.md` - written concept plan and staged design direction
- `upgrade-plan-concept-reference.png` - visual target reference for mood, arena composition, lighting, wet floor/grid treatment, industrial structures, tactical reticle language, and waypoint/extraction clarity

If either source reference changes, update this target lock and `DEV-CHECKLIST.md` before continuing visual implementation.

## Target Identity

- Dark cinematic tactical drone-combat arena
- Orange tactical HUD language
- Teal/cyan player drone accents
- Low-poly industrial combat zones
- Reflective dark floor with readable grid
- Atmospheric fog and horizon depth
- Structured assault targets, not isolated towers only
- Clean tactical reticle with projected weapon path
- Readable extraction and objective waypoints
- Restrained VFX with no visual chaos

## Preservation Rules

- Preserve the current chase-view flight controls and camera readability.
- Preserve mission state, objective tracking, extraction tracking, and radar behavior.
- Preserve the orange/teal/black tactical identity.
- Keep HUD changes restrained; prefer world-space illustration for new navigation clarity.
- Favor reusable scene, target, and level modules over one-off hardcoded visuals.
- Keep every implementation phase playable and independently verifiable.

## First Implementation Boundary

The first implementation phase extracts scene visual builders from `src/components/Game.tsx` without intentionally changing gameplay or visible behavior. Cinematic lighting, reflective floor polish, industrial structures, weak points, and level-kit configuration come after the extraction pass is verified.
