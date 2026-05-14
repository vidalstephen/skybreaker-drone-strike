/**
 * Tracking System — Stage 1c
 *
 * Owns registration, update, removal, priority scoring, and query helpers for
 * all mission entities that need HUD representation (objectives, enemies,
 * extraction, hazards).
 *
 * Three.js refs are deliberately excluded from this module. Game.tsx extracts
 * plain numeric positions from Three.js objects before calling updateTrack so
 * that the tracking state is a serializable, React-friendly data layer.
 */

import { TrackedEntityType, type TrackDiscoveryBehavior, type TrackingMetaDefinition, type TrackedEntitySnapshot, type TrackedEntityState } from '../types/game';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface TrackUpdate {
  worldX?:           number;
  worldY?:           number;
  worldZ?:           number;
  distanceToPlayer?: number;
  health?:           number;
  maxHealth?:        number;
  shields?:          number;
  maxShield?:        number;
  state?:            TrackedEntityState;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createTrackingSystem() {
  const registry = new Map<string, TrackedEntitySnapshot>();

  // ---- mutation helpers --------------------------------------------------

  function registerTrack(
    id: string,
    type: TrackedEntityType,
    label: string,
    initial: TrackUpdate,
    isRequired = false,
    meta?: TrackingMetaDefinition,
  ): void {
    registry.set(id, {
      id,
      type,
      label,
      worldX:           initial.worldX           ?? 0,
      worldY:           initial.worldY           ?? 0,
      worldZ:           initial.worldZ           ?? 0,
      state:            initial.state            ?? 'detected',
      priorityScore:    0,
      isSelected:       false,
      radarPulse:       false,
      isRequired,
      health:           initial.health,
      maxHealth:        initial.maxHealth        ?? initial.health,
      shields:          initial.shields,
      maxShield:        initial.maxShield        ?? initial.shields,
      distanceToPlayer: initial.distanceToPlayer ?? 0,
      radarLabel:        meta?.radarLabel,
      markerLabel:       meta?.markerLabel,
      priorityBonus:     meta?.priorityBonus,
      discoveryBehavior: meta?.discoveryBehavior,
      approachHint:      meta?.approachHint,
      attentionReason:   meta?.attentionReason,
      routeHint:         meta?.routeHint,
    });
  }

  function updateTrack(id: string, update: TrackUpdate): void {
    const snap = registry.get(id);
    if (!snap) return;
    if (update.worldX           !== undefined) snap.worldX           = update.worldX;
    if (update.worldY           !== undefined) snap.worldY           = update.worldY;
    if (update.worldZ           !== undefined) snap.worldZ           = update.worldZ;
    if (update.distanceToPlayer !== undefined) snap.distanceToPlayer = update.distanceToPlayer;
    if (update.health           !== undefined) snap.health           = update.health;
    if (update.maxHealth        !== undefined) snap.maxHealth        = update.maxHealth;
    if (update.shields          !== undefined) snap.shields          = update.shields;
    if (update.maxShield        !== undefined) snap.maxShield        = update.maxShield;
    if (update.state            !== undefined) snap.state            = update.state;
  }

  function markDestroyed(id: string): void {
    const snap = registry.get(id);
    if (snap) snap.state = 'destroyed';
  }

  function reset(): void {
    registry.clear();
  }

  // ---- priority scoring --------------------------------------------------

  function recomputePriority(): void {
    const extractionSnap = [...registry.values()].find(s => s.type === TrackedEntityType.EXTRACTION);
    const extractionIsActive = extractionSnap?.state === 'active';

    let maxScore = -Infinity;
    let selectedId: string | null = null;

    registry.forEach(snap => {
      const inactive = snap.state === 'destroyed' || snap.state === 'completed' || snap.state === 'inactive';
      if (inactive) {
        snap.priorityScore = -1;
        snap.isSelected    = false;
        snap.radarPulse    = false;
        return;
      }

      const distPenalty = Math.min(snap.distanceToPlayer * 0.02, 50);
      let score = 0;

      switch (snap.type) {
        case TrackedEntityType.EXTRACTION:
          score           = extractionIsActive ? 900 - distPenalty : -1;
          snap.radarPulse = extractionIsActive;
          break;
        case TrackedEntityType.OBJECTIVE:
          score           = snap.isRequired ? 700 - distPenalty : 200 - distPenalty;
          snap.radarPulse = false;
          break;
        case TrackedEntityType.WEAK_POINT:
          score           = snap.isRequired ? 600 - distPenalty : 100;
          snap.radarPulse = false;
          break;
        case TrackedEntityType.ENEMY:
          score           = 400 - distPenalty;
          snap.radarPulse = snap.distanceToPlayer < 180;
          break;
        case TrackedEntityType.HAZARD:
          score           = snap.distanceToPlayer < 120 ? 500 : 50;
          snap.radarPulse = snap.distanceToPlayer < 120;
          break;
        default:
          score = 0;
      }

      snap.priorityScore = score;
      if (score > 0) snap.priorityScore = score + (snap.priorityBonus ?? 0);
      if (snap.priorityScore > maxScore) {
        maxScore   = snap.priorityScore;
        selectedId = snap.id;
      }
    });

    registry.forEach(snap => {
      snap.isSelected = snap.id === selectedId && maxScore > 0;
    });
  }

  // ---- query helpers -----------------------------------------------------

  function getSnapshots(): TrackedEntitySnapshot[] {
    return [...registry.values()]
      .filter(s => {
        if (s.state === 'destroyed' || s.state === 'completed') return false;
        const discovery: TrackDiscoveryBehavior = s.discoveryBehavior ?? 'always';
        switch (discovery) {
          case 'hidden-until-active':
          case 'hidden-until-scanned':
            // Only show once state advances past inactive/detected.
            return s.state !== 'inactive' && s.state !== 'detected';
          case 'urgent-only':
            // Only show when near the player or at high priority score.
            return s.priorityScore > 300 || s.distanceToPlayer < 200;
          default: // 'always'
            return s.state !== 'inactive';
        }
      })
      .sort((a, b) => b.priorityScore - a.priorityScore);
  }

  function getSelectedTrack(): TrackedEntitySnapshot | null {
    return [...registry.values()].find(s => s.isSelected) ?? null;
  }

  // ---- public interface --------------------------------------------------

  return { registerTrack, updateTrack, markDestroyed, recomputePriority, getSnapshots, getSelectedTrack, reset };
}

export type TrackingSystem = ReturnType<typeof createTrackingSystem>;
