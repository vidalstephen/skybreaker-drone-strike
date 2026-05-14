import type { CampaignProgress, WeaponDefinition } from '../types/game';

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
    unlockRewardId: 'extraction-protocol',
  },
];

export const DEFAULT_PRIMARY_WEAPON = WEAPONS[0];

export function getUnlockedWeapons(progress: CampaignProgress) {
  return WEAPONS.filter(weapon => !weapon.unlockRewardId || progress.earnedRewardIds.includes(weapon.unlockRewardId));
}

export function getWeaponById(weaponId: string) {
  return WEAPONS.find(weapon => weapon.id === weaponId) ?? DEFAULT_PRIMARY_WEAPON;
}
