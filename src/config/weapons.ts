import type { CampaignProgress, MissionDefinition, WeaponDefinition, WeaponId } from '../types/game';

export const WEAPONS: WeaponDefinition[] = [
  {
    id: 'pulse-cannon',
    slot: 'PRIMARY',
    label: 'Pulse Cannon',
    role: 'Reliable sustained fire for towers and light drones.',
    trigger: 'Space',
    damage: 10,
    energyCost: 4,
    cooldownMs: 150,
    projectileSpeed: 5,
    projectileLife: 100,
    color: 0x00ffff,
    recommendations: ['AIR_TO_LAND', 'AIR_TO_SEA', 'STRIKE', 'SABOTAGE'],
  },
  {
    id: 'ion-missile',
    slot: 'SECONDARY',
    label: 'Ion Missile',
    role: 'Anti-air missile for interceptors, gunships, and missile platforms.',
    trigger: 'Alt / Right Mouse',
    damage: 90,
    energyCost: 24,
    cooldownMs: 2200,
    projectileSpeed: 4.4,
    projectileLife: 210,
    color: 0xffaa00,
    blastRadius: 18,
    homing: true,        // Stage 5b: homes on locked target when lockProgress >= MISSILE_MIN_LOCK
    unlockRewardId: 'extraction-protocol',
    recommendations: ['AIR_TO_AIR', 'INTERCEPT', 'DEFENSE'],
  },
];

export const DEFAULT_PRIMARY_WEAPON = WEAPONS[0];

export function getUnlockedWeapons(progress: CampaignProgress) {
  return WEAPONS.filter(weapon => !weapon.unlockRewardId || progress.earnedRewardIds.includes(weapon.unlockRewardId));
}

/**
 * Stage 7b: Return the equipped primary and secondary weapons for the current loadout.
 * Falls back to the first unlocked weapon per slot when no explicit equip is recorded.
 */
export function getEquippedWeapons(progress: CampaignProgress): { primary: WeaponDefinition; secondary: WeaponDefinition | null } {
  const unlocked = getUnlockedWeapons(progress);
  const equippedPrimaryId = progress.inventory?.equippedWeaponIds?.PRIMARY;
  const equippedSecondaryId = progress.inventory?.equippedWeaponIds?.SECONDARY;
  const primary =
    (equippedPrimaryId ? unlocked.find(w => w.slot === 'PRIMARY' && w.id === equippedPrimaryId) : undefined)
    ?? unlocked.find(w => w.slot === 'PRIMARY')
    ?? DEFAULT_PRIMARY_WEAPON;
  const secondary =
    (equippedSecondaryId ? unlocked.find(w => w.slot === 'SECONDARY' && w.id === equippedSecondaryId) : undefined)
    ?? unlocked.find(w => w.slot === 'SECONDARY')
    ?? null;
  return { primary, secondary };
}

/**
 * Stage 7b: Return true if this weapon is specifically recommended for the given mission.
 */
export function getWeaponRecommendation(weapon: WeaponDefinition, mission: MissionDefinition): boolean {
  if (!weapon.recommendations?.length) return false;
  return weapon.recommendations.some(tag => tag === mission.combatDomain || tag === mission.missionType);
}

export function getWeaponById(weaponId: string): WeaponDefinition {
  return WEAPONS.find(weapon => weapon.id === weaponId) ?? DEFAULT_PRIMARY_WEAPON;
}

export function getWeaponByIdTyped(weaponId: WeaponId): WeaponDefinition {
  return WEAPONS.find(weapon => weapon.id === weaponId) ?? DEFAULT_PRIMARY_WEAPON;
}
