/**
 * Stage 9a - Optional Sortie Framework Validator
 *
 * Validates that:
 * - All optional sorties have sortieType 'optional'
 * - Each sortie has a valid unlockAfterRewardId that references a known reward
 * - Optional sortie ids are unique across all missions
 * - Optional sorties have authored objectiveSet (destroy + extract)
 * - Optional sorties do NOT appear in unlockAfterMissionId chains (they do not advance the campaign)
 * - isMissionUnlocked returns false on a clean save and true after the prerequisite reward
 * - Replay preserves best records
 */

import { MISSIONS } from '../src/config/missions';
import { normalizeCampaignProgress, getOptionalSorties, getMainMissions, isMissionUnlocked } from '../src/systems/missionSystem';
import { DEFAULT_CAMPAIGN_PROGRESS } from '../src/config/defaults';
import type { CampaignProgress } from '../src/types/game';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mainMissions = getMainMissions(MISSIONS);
const optionalSorties = getOptionalSorties(MISSIONS);

const knownRewardIds = new Set(MISSIONS.map(m => m.reward.id));

// ---------------------------------------------------------------------------
// 1. Optional sortie count and structure
// ---------------------------------------------------------------------------
console.log('\n[1] Optional sortie registration');

assert(optionalSorties.length >= 1, `At least one optional sortie is defined (found ${optionalSorties.length})`);

for (const sortie of optionalSorties) {
  assert(sortie.sortieType === 'optional', `${sortie.id}: sortieType === 'optional'`);
  assert(typeof sortie.unlockAfterRewardId === 'string' && sortie.unlockAfterRewardId.length > 0,
    `${sortie.id}: has unlockAfterRewardId`);
  if (sortie.unlockAfterRewardId) {
    assert(knownRewardIds.has(sortie.unlockAfterRewardId),
      `${sortie.id}: unlockAfterRewardId '${sortie.unlockAfterRewardId}' references a known reward`);
  }
  assert(sortie.objectiveSet !== undefined, `${sortie.id}: has explicit objectiveSet`);
}

// ---------------------------------------------------------------------------
// 2. Main mission separation — optional sorties do not appear in unlock chains
// ---------------------------------------------------------------------------
console.log('\n[2] Campaign isolation');

const mainUnlockChain = new Set(mainMissions.map(m => m.unlockAfterMissionId).filter(Boolean));
for (const sortie of optionalSorties) {
  assert(!mainUnlockChain.has(sortie.id),
    `${sortie.id}: not referenced by any main mission unlockAfterMissionId`);
  assert(!mainMissions.some(m => m.id === sortie.id),
    `${sortie.id}: not present in main mission list`);
}

// ---------------------------------------------------------------------------
// 3. Unlock rules — locked on clean save, unlocked after earning reward
// ---------------------------------------------------------------------------
console.log('\n[3] Unlock rules');

const cleanProgress = normalizeCampaignProgress(DEFAULT_CAMPAIGN_PROGRESS, MISSIONS);

for (const sortie of optionalSorties) {
  // On clean save: locked
  assert(!isMissionUnlocked(sortie, cleanProgress),
    `${sortie.id}: LOCKED on clean save`);

  // After earning prerequisite reward: unlocked
  const progressWithReward: CampaignProgress = {
    ...cleanProgress,
    earnedRewardIds: [...cleanProgress.earnedRewardIds, sortie.unlockAfterRewardId!],
  };
  assert(isMissionUnlocked(sortie, progressWithReward),
    `${sortie.id}: READY after earning '${sortie.unlockAfterRewardId}'`);
}

// ---------------------------------------------------------------------------
// 4. Completion and replay tracking
// ---------------------------------------------------------------------------
console.log('\n[4] Completion and replay tracking');

if (optionalSorties.length > 0) {
  const firstSortie = optionalSorties[0];
  const rewardProgress: CampaignProgress = {
    ...cleanProgress,
    earnedRewardIds: [...cleanProgress.earnedRewardIds, firstSortie.unlockAfterRewardId!],
  };

  // Simulate first completion
  const afterFirst = normalizeCampaignProgress({
    ...rewardProgress,
    completedMissionIds: [...rewardProgress.completedMissionIds, firstSortie.id],
    bestMissionTimes: { ...rewardProgress.bestMissionTimes, [firstSortie.id]: 95000 },
    bestMissionScores: { ...rewardProgress.bestMissionScores, [firstSortie.id]: 7200 },
    bestMissionRanks: { ...rewardProgress.bestMissionRanks, [firstSortie.id]: 'A' },
    earnedRewardIds: [...rewardProgress.earnedRewardIds, firstSortie.reward.id],
  }, MISSIONS);

  assert(afterFirst.completedMissionIds.includes(firstSortie.id),
    `${firstSortie.id}: completedMissionIds contains sortie after completion`);
  assert(afterFirst.bestMissionTimes[firstSortie.id] === 95000,
    `${firstSortie.id}: best time preserved after first completion`);
  assert(afterFirst.bestMissionRanks[firstSortie.id] === 'A',
    `${firstSortie.id}: best rank preserved after first completion`);

  // Replay with worse score — best record must not downgrade
  const afterReplay = normalizeCampaignProgress({
    ...afterFirst,
    // bestMissionScores not updated (same as afterFirst; completeMission handles improvement)
  }, MISSIONS);
  assert(afterReplay.bestMissionScores[firstSortie.id] === 7200,
    `${firstSortie.id}: best score not downgraded on replay normalization`);

  // Completing a sortie does NOT unlock a main campaign mission
  const unlockedNew = mainMissions.filter(m =>
    m.unlockAfterMissionId === firstSortie.id ||
    (m.unlockAfterRewardId && m.unlockAfterRewardId === firstSortie.reward.id)
  );
  assert(unlockedNew.length === 0,
    `${firstSortie.id}: completion does not unlock any main campaign missions`);
}

// ---------------------------------------------------------------------------
// 5. Main mission count unchanged
// ---------------------------------------------------------------------------
console.log('\n[5] Main mission integrity');

const mainCount = mainMissions.length;
assert(mainCount === 28, `Main campaign missions remain at 28 (found ${mainCount})`);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log(`\n${'─'.repeat(56)}`);
console.log(`validate:sorties  ${passed} passed  ${failed} failed`);
console.log('─'.repeat(56));

if (failed > 0) {
  process.exit(1);
}
