import type { EnemyDefinition, EnemyRole, FactionId, MissionEnemyWaveEntry } from '../types/game';

export const ENEMY_DEFINITIONS: Record<EnemyRole, EnemyDefinition> = {
  'fast-interceptor': {
    role: 'fast-interceptor',
    label: 'Fast Interceptor',
    silhouette: 'needle-frame',
    health: 45,
    shields: 0,
    speed: 0.55,
    minRange: 55,
    maxRange: 95,
    drift: 0.16,
    fireCooldownMs: 2200,
    projectileSpeed: 2.7,
    projectileDamage: 9,
    scoreValue: 250,
    color: 0xff2a2a,
    emissive: 0xff0000,
    scale: [1, 1, 1],
  },
  'heavy-gunship': {
    role: 'heavy-gunship',
    label: 'Heavy Gunship',
    silhouette: 'wide-armored-frame',
    health: 95,
    shields: 20,
    speed: 0.32,
    minRange: 85,
    maxRange: 150,
    drift: 0.08,
    fireCooldownMs: 3000,
    projectileSpeed: 2.3,
    projectileDamage: 13,
    scoreValue: 425,
    color: 0xff6a00,
    emissive: 0xaa2200,
    scale: [1.45, 1.15, 1.45],
  },
  'missile-platform': {
    role: 'missile-platform',
    label: 'Missile Platform',
    silhouette: 'long-range-rail-frame',
    health: 65,
    shields: 10,
    speed: 0.24,
    minRange: 140,
    maxRange: 260,
    drift: 0.05,
    fireCooldownMs: 3600,
    projectileSpeed: 2.0,
    projectileDamage: 18,
    scoreValue: 500,
    color: 0xff0044,
    emissive: 0xff0033,
    scale: [1.2, 0.9, 1.8],
  },
  'shielded-warden': {
    role: 'shielded-warden',
    label: 'Shielded Warden',
    silhouette: 'shield-core-frame',
    health: 80,
    shields: 60,
    speed: 0.28,
    minRange: 95,
    maxRange: 180,
    drift: 0.06,
    fireCooldownMs: 3300,
    projectileSpeed: 2.2,
    projectileDamage: 12,
    scoreValue: 550,
    color: 0x7c4dff,
    emissive: 0x4b22ff,
    scale: [1.25, 1.4, 1.25],
  },
  'mini-boss': {
    role: 'mini-boss',
    label: 'Command Frigate',
    silhouette: 'boss-command-frame',
    health: 220,
    shields: 120,
    speed: 0.18,
    minRange: 180,
    maxRange: 320,
    drift: 0.03,
    fireCooldownMs: 2200,
    projectileSpeed: 2.4,
    projectileDamage: 16,
    scoreValue: 1500,
    color: 0xffffff,
    emissive: 0xff5500,
    scale: [2.2, 1.4, 2.8],
  },
  // Stage 5c: ace enemy for air-to-air intercept missions
  'ace-interceptor': {
    role: 'ace-interceptor',
    label: 'Ace Fighter',
    silhouette: 'needle-frame',
    health: 160,
    shields: 80,
    speed: 0.72,
    minRange: 40,
    maxRange: 110,
    drift: 0.42,
    fireCooldownMs: 1400,
    projectileSpeed: 3.4,
    projectileDamage: 11,
    scoreValue: 900,
    color: 0xff4466,
    emissive: 0xff0033,
    scale: [0.85, 0.85, 0.85],
  },
  // Stage 8c: naval surface units — move along sea level, telegraph before firing
  'patrol-craft': {
    role: 'patrol-craft',
    label: 'Patrol Craft',
    silhouette: 'naval-patrol-frame',
    health: 90,
    shields: 0,
    speed: 0.18,
    minRange: 80,
    maxRange: 280,
    drift: 0,
    fireCooldownMs: 2800,
    projectileSpeed: 2.2,
    projectileDamage: 14,
    scoreValue: 600,
    color: 0x1a3a5c,
    emissive: 0x0066aa,
    scale: [2.0, 0.7, 3.5],
    navalThreat: true,
  },
  'destroyer': {
    role: 'destroyer',
    label: 'Destroyer',
    silhouette: 'naval-destroyer-frame',
    health: 200,
    shields: 40,
    speed: 0.12,
    minRange: 150,
    maxRange: 450,
    drift: 0,
    fireCooldownMs: 4200,
    projectileSpeed: 2.8,
    projectileDamage: 28,
    scoreValue: 1200,
    color: 0x1c2e3e,
    emissive: 0x0044bb,
    scale: [2.8, 0.9, 5.5],
    navalThreat: true,
  },
  // Stage 5d: ground threat emplacements — stationary, fire at player from range
  'sam-battery': {
    role: 'sam-battery',
    label: 'SAM Battery',
    silhouette: 'ground-sam',
    health: 180,
    shields: 0,
    speed: 0,
    minRange: 0,
    maxRange: 550,
    drift: 0,
    fireCooldownMs: 3200,
    projectileSpeed: 4.2,
    projectileDamage: 22,
    scoreValue: 700,
    color: 0x556655,
    emissive: 0x004400,
    scale: [1.4, 1.4, 1.4],
    groundThreat: true,
  },
  'flak-cannon': {
    role: 'flak-cannon',
    label: 'Flak Cannon',
    silhouette: 'ground-flak',
    health: 120,
    shields: 0,
    speed: 0,
    minRange: 0,
    maxRange: 220,
    drift: 0,
    fireCooldownMs: 900,
    projectileSpeed: 3.0,
    projectileDamage: 9,
    scoreValue: 400,
    color: 0x774433,
    emissive: 0x441100,
    scale: [1.1, 1.1, 1.1],
    groundThreat: true,
  },
  'railgun-emplacement': {
    role: 'railgun-emplacement',
    label: 'Railgun',
    silhouette: 'ground-railgun',
    health: 260,
    shields: 60,
    speed: 0,
    minRange: 0,
    maxRange: 800,
    drift: 0,
    fireCooldownMs: 6500,
    projectileSpeed: 7.0,
    projectileDamage: 45,
    scoreValue: 1100,
    color: 0x334455,
    emissive: 0x002244,
    scale: [1.6, 1.0, 1.6],
    groundThreat: true,
  },
};

export const ENEMY_PROGRESSION_PLAN: MissionEnemyWaveEntry[] = [
  { role: 'fast-interceptor', count: 2 },
  { role: 'heavy-gunship', count: 2 },
  { role: 'missile-platform', count: 1 },
  { role: 'shielded-warden', count: 1 },
  { role: 'mini-boss', count: 1 },
];

export function getEnemyDefinition(role: EnemyRole) {
  return ENEMY_DEFINITIONS[role];
}

export function expandEnemyWave(composition: MissionEnemyWaveEntry[]) {
  return composition.flatMap(entry => Array.from({ length: entry.count }, () => getEnemyDefinition(entry.role)));
}

// ---------------------------------------------------------------------------
// Stage 8b: Formation-aware wave expansion
// ---------------------------------------------------------------------------

/** One slot in an expanded enemy wave — carries formation metadata through to spawn. */
export interface ExpandedWaveEntry {
  definition: EnemyDefinition;
  formationId?: string;
  formationRole?: 'leader' | 'wing';
  /** 0-based index of this slot within its formation (used to compute the spawn offset). */
  wingIndex: number;
}

/**
 * Expands the wave composition into individual spawn slots while preserving
 * formation group metadata. The first enemy in a formation entry marked
 * 'leader' becomes the anchor; subsequent entries marked 'wing' become child
 * contacts. Non-formation entries behave identically to expandEnemyWave.
 */
export function expandEnemyWaveGrouped(composition: MissionEnemyWaveEntry[]): ExpandedWaveEntry[] {
  const result: ExpandedWaveEntry[] = [];
  for (const entry of composition) {
    const def = getEnemyDefinition(entry.role);
    for (let i = 0; i < entry.count; i++) {
      result.push({
        definition: def,
        formationId: entry.formationId,
        formationRole: entry.formationRole,
        wingIndex: entry.formationRole === 'wing' ? i : 0,
      });
    }
  }
  return result;
}

/** Standard wing position offsets (index 0-4) relative to the formation leader. */
export const WING_OFFSETS: [number, number, number][] = [
  [ 36,  0,  16],
  [-36,  0,  16],
  [ 22, 10, -12],
  [-22, 10, -12],
  [  0, -8,  26],
];

// ---------------------------------------------------------------------------
// Stage 8f: Faction/theater variant palettes
// ---------------------------------------------------------------------------

/** Color palette applied to all enemies spawned within a given faction/theater. */
export interface FactionVariantColors {
  color: number;
  emissive: number;
}

/**
 * Per-faction color overrides. Enemies in these theaters receive the palette
 * across all roles. Geometry, hitbox, and material handles are always preserved.
 * 'signal-war' entries are not overridden — enemies use their base def colors.
 */
export const FACTION_VARIANT_COLORS: Record<FactionId, FactionVariantColors> = {
  'signal-war':   { color: 0xff2a2a, emissive: 0xff0000 }, // default — not applied (see LEVEL_KIT_FACTION)
  'storm-coast':  { color: 0x1a5c7e, emissive: 0x00aacc }, // ocean teal
  'frozen-relay': { color: 0x7ab0cc, emissive: 0x44c8ff }, // arctic ice blue
  'red-canyon':   { color: 0x7a3018, emissive: 0xcc4400 }, // burnt rust
  'skybreaker':   { color: 0x2a0a4a, emissive: 0x9900ff }, // void violet
};

/**
 * Maps a mission levelKitId to its theater faction.
 * Level kits absent from this map default to signal-war (base def colors).
 */
export const LEVEL_KIT_FACTION: Partial<Record<string, FactionId>> = {
  'storm-coast':    'storm-coast',
  'ocean-platform': 'storm-coast',
  'arctic-shelf':   'frozen-relay',
  'red-canyon':     'red-canyon',
  'skybreaker-core': 'skybreaker',
};
