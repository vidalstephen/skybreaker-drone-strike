import type { CampaignProgress } from '../types/game';
import { MISSIONS } from './missions';
import { WEAPONS } from './weapons';

/**
 * Applies a developer override on top of the current dev save:
 * - All missions unlocked
 * - All weapons unlocked (via earnedRewardIds covering all weapon unlock gates)
 * - Parts raised to 9999 so every upgrade node is affordable
 *
 * The underlying save data (completed missions, scores, ranks, earned rewards) is
 * preserved so playtesting results accumulate normally. Mutations during dev mode
 * still save to the isolated dev save key, never polluting the real user save.
 */
export function buildDevProgress(save: CampaignProgress): CampaignProgress {
  const allMissionIds = MISSIONS.map(m => m.id);
  const allWeaponIds = WEAPONS.map(w => w.id as string);

  // Collect all weapon unlock reward IDs so getUnlockedWeapons() passes the gate check.
  const weaponUnlockRewardIds = WEAPONS.flatMap(w => (w.unlockRewardId ? [w.unlockRewardId] : []));
  const allRewardIds = Array.from(new Set([...save.earnedRewardIds, ...weaponUnlockRewardIds]));

  return {
    ...save,
    unlockedMissionIds: allMissionIds,
    earnedRewardIds: allRewardIds,
    inventory: save.inventory
      ? {
          ...save.inventory,
          parts: Math.max(save.inventory.parts, 9999),
          unlockedWeaponIds: allWeaponIds,
        }
      : save.inventory,
  };
}
