import { CAMPAIGN_ARCS } from '../src/config/campaign';
import { CAMPAIGN_SAVE_VERSION, DEFAULT_CAMPAIGN_PROGRESS, DEFAULT_PLAYER_INVENTORY } from '../src/config/defaults';
import { MISSIONS } from '../src/config/missions';
import {
  buildObjectiveSnapshot,
  calculateMissionResult,
  completeMission,
  getCampaignCompletion,
  getMissionStatus,
  normalizeCampaignProgress,
} from '../src/systems/missionSystem';
import type { CampaignProgress, MissionCompletionResult, MissionDefinition } from '../src/types/game';

const failures: string[] = [];

function assert(condition: boolean, message: string): void {
  if (!condition) failures.push(message);
}

function missionResult(mission: MissionDefinition, intensity: 'baseline' | 'worse' | 'best'): MissionCompletionResult {
  const bonusScore = intensity === 'best'
    ? (mission.objectiveSet?.bonusConditions ?? []).reduce((total, condition) => total + condition.scoreBonus, 0)
    : 0;

  return calculateMissionResult(mission, {
    elapsedMs: intensity === 'best'
      ? Math.max(1000, Math.round(mission.scoring.parTimeMs * 0.35))
      : intensity === 'worse'
        ? Math.round(mission.scoring.parTimeMs * 1.5)
        : Math.round(mission.scoring.parTimeMs * 0.85),
    targetsDestroyed: mission.targets.length,
    enemiesDestroyed: intensity === 'worse' ? 0 : mission.enemyWave.count,
    health: intensity === 'best' ? 100 : intensity === 'worse' ? 25 : 80,
    bonusConditionsEarned: intensity === 'best' ? (mission.objectiveSet?.bonusConditions ?? []).map(condition => condition.id) : [],
    bonusScore,
  });
}

function assertProgressContains(progress: CampaignProgress, mission: MissionDefinition, result: MissionCompletionResult): void {
  assert(progress.completedMissionIds.includes(mission.id), `${mission.id} should be marked completed`);
  assert(progress.earnedRewardIds.includes(mission.reward.id), `${mission.id} reward ${mission.reward.id} should be recorded`);
  assert(progress.bestMissionTimes[mission.id] === result.elapsedMs, `${mission.id} best time should be ${result.elapsedMs}`);
  assert(progress.bestMissionScores[mission.id] === result.score, `${mission.id} best score should be ${result.score}`);
  assert(progress.bestMissionRanks[mission.id] === result.rank, `${mission.id} best rank should be ${result.rank}`);
}

const mainMissions = MISSIONS
  .filter(mission => mission.order >= 1 && mission.order <= 24)
  .sort((a, b) => a.order - b.order);
const prototypeMissions = MISSIONS.filter(mission => mission.order >= 90);

assert(mainMissions.length === 24, `Expected 24 main campaign missions, found ${mainMissions.length}`);
mainMissions.forEach((mission, index) => {
  const expectedOrder = index + 1;
  assert(mission.order === expectedOrder, `${mission.id} should have contiguous order ${expectedOrder}`);
  assert(!!mission.objectiveSet, `${mission.id} should author objectiveSet for campaign regression`);
  assert((mission.objectiveSet?.primary.length ?? 0) >= 2, `${mission.id} should have destroy and extract primary objectives`);
  assert(mission.objectiveSet?.primary[0]?.totalCount === mission.targets.length, `${mission.id} objective target count should match target count`);
  assert(mission.objectiveSet?.primary[1]?.id === 'extract', `${mission.id} second primary objective should be extract`);
  assert(mission.extraction.radius > 0, `${mission.id} extraction radius should be positive`);
  assert(mission.scoring.rankThresholds.S > mission.scoring.rankThresholds.A, `${mission.id} S threshold should exceed A threshold`);
  assert(mission.scoring.rankThresholds.A > mission.scoring.rankThresholds.B, `${mission.id} A threshold should exceed B threshold`);
  assert(mission.scoring.rankThresholds.B > mission.scoring.rankThresholds.C, `${mission.id} B threshold should exceed C threshold`);

  const initialSnapshot = buildObjectiveSnapshot(mission, 0, new Set());
  assert(initialSnapshot.activeObjectiveId === 'destroy-targets', `${mission.id} should start on destroy-targets`);
  assert(initialSnapshot.primaryObjectives[0]?.currentCount === 0, `${mission.id} initial objective count should be 0`);
  const extractSnapshot = buildObjectiveSnapshot(mission, mission.targets.length, new Set(['destroy-targets']));
  assert(extractSnapshot.activeObjectiveId === 'extract', `${mission.id} should switch to extract after all targets are destroyed`);
});

const activeMainArcs = CAMPAIGN_ARCS.filter(arc => arc.status === 'ACTIVE' && arc.missionRange.startsWith('Missions'));
assert(activeMainArcs.length === 7, `Expected 7 active main campaign arcs, found ${activeMainArcs.length}`);
activeMainArcs.forEach(arc => {
  assert(mainMissions.some(mission => mission.campaignArc === arc.label), `${arc.id} should contain at least one main campaign mission`);
});

prototypeMissions.forEach(mission => {
  assert(mission.order >= 90, `${mission.id} prototype should remain outside the main campaign order`);
  assert(!mainMissions.some(candidate => candidate.id === mission.id), `${mission.id} prototype should not appear in main campaign smoke`);
});

let progress: CampaignProgress = structuredClone(DEFAULT_CAMPAIGN_PROGRESS);
assert(progress.saveVersion === CAMPAIGN_SAVE_VERSION, 'Default progress should be stamped with current save version');
assert(progress.inventory !== undefined, 'Default progress should include inventory (Stage 7a)');
assert(progress.inventory?.parts === DEFAULT_PLAYER_INVENTORY.parts, 'Default progress inventory should have default parts');
assert(progress.inventory?.equippedWeaponIds?.PRIMARY === DEFAULT_PLAYER_INVENTORY.equippedWeaponIds?.PRIMARY, 'Default progress inventory should have default primary weapon equipped');
assert(getMissionStatus(mainMissions[0], progress) === 'READY', 'Clean save should start with Mission 01 READY');
assert(getMissionStatus(mainMissions[1], progress) === 'LOCKED', 'Clean save should keep Mission 02 locked before Mission 01 clear');

mainMissions.forEach((mission, index) => {
  assert(getMissionStatus(mission, progress) === 'READY', `${mission.id} should be READY before clean-save completion`);

  const baselineResult = missionResult(mission, 'baseline');
  progress = completeMission(progress, mission, baselineResult, MISSIONS);
  assertProgressContains(progress, mission, baselineResult);
  assert(progress.completedMissionIds.filter(id => id === mission.id).length === 1, `${mission.id} should not duplicate completion ids`);
  assert(progress.earnedRewardIds.filter(id => id === mission.reward.id).length === 1, `${mission.id} should not duplicate reward ids`);

  const nextMission = mainMissions[index + 1];
  if (nextMission) {
    assert(progress.unlockedMissionIds.includes(nextMission.id), `${nextMission.id} should unlock after ${mission.id}`);
  } else {
    assert(!MISSIONS.some(candidate => candidate.unlockAfterMissionId === mission.id), 'No mission should unlock after final main campaign mission');
  }

  const afterBaseline = progress;
  const worseResult = missionResult(mission, 'worse');
  const afterWorseReplay = completeMission(afterBaseline, mission, worseResult, MISSIONS);
  assert(afterWorseReplay.bestMissionTimes[mission.id] === baselineResult.elapsedMs, `${mission.id} replay with worse time should preserve best time`);
  assert(afterWorseReplay.bestMissionScores[mission.id] === baselineResult.score, `${mission.id} replay with lower score should preserve best score`);
  assert(afterWorseReplay.bestMissionRanks[mission.id] === baselineResult.rank, `${mission.id} replay with lower score should preserve best rank`);

  const bestResult = missionResult(mission, 'best');
  assert(bestResult.score >= baselineResult.score, `${mission.id} best replay fixture should improve or match score`);
  progress = completeMission(afterWorseReplay, mission, bestResult, MISSIONS);
  assert(progress.bestMissionTimes[mission.id] === bestResult.elapsedMs, `${mission.id} best replay should update best time`);
  assert(progress.bestMissionScores[mission.id] === bestResult.score, `${mission.id} best replay should update best score`);
  assert(progress.bestMissionRanks[mission.id] === bestResult.rank, `${mission.id} best replay should update best rank`);
});

assert(getCampaignCompletion(mainMissions, progress) === 100, 'Main campaign completion should be 100% after Mission 24');
assert(mainMissions.every(mission => getMissionStatus(mission, progress) === 'CLEARED'), 'Every main mission should be CLEARED after clean-save campaign smoke');
assert(new Set(progress.completedMissionIds).size === mainMissions.length, 'Completed mission ids should remain unique after replay smoke');
assert(new Set(progress.earnedRewardIds).size === mainMissions.length, 'Earned reward ids should remain unique after replay smoke');

const migratedMidCampaign = normalizeCampaignProgress({
  completedMissionIds: ['signal-break', 'iron-veil', 'black-sky-hook', 'not-a-real-mission', 'signal-break'],
  unlockedMissionIds: ['signal-break', 'retired-mission'],
  bestMissionTimes: { 'signal-break': 90000, 'retired-mission': 10, 'iron-veil': -1 },
  bestMissionScores: { 'signal-break': 5000, 'retired-mission': 9999, 'iron-veil': -5 },
  bestMissionRanks: { 'signal-break': 'S', 'iron-veil': 'Z' as never },
  earnedRewardIds: ['legacy-reward'],
}, MISSIONS);

assert(migratedMidCampaign.saveVersion === CAMPAIGN_SAVE_VERSION, 'Migrated save should be stamped with current save version');
assert(migratedMidCampaign.inventory !== undefined, 'Migrated save with no inventory should receive default inventory');
assert(migratedMidCampaign.inventory?.parts === 0, 'Migrated save inventory should start with 0 parts');
assert(migratedMidCampaign.completedMissionIds.join(',') === 'signal-break,iron-veil,black-sky-hook', 'Migrated save should keep valid completed ids once, in stored order');
assert(migratedMidCampaign.unlockedMissionIds.includes(mainMissions[3].id), 'Migrated save should unlock the next mission from completed ids');
assert(!migratedMidCampaign.unlockedMissionIds.includes('retired-mission'), 'Migrated save should drop stale unlocked mission ids');
assert(migratedMidCampaign.earnedRewardIds.includes('legacy-reward'), 'Migrated save should preserve unknown historical rewards');
assert(migratedMidCampaign.earnedRewardIds.includes('arc-two-clearance'), 'Migrated save should derive rewards from completed missions');
assert(migratedMidCampaign.bestMissionTimes['signal-break'] === 90000, 'Migrated save should preserve valid best times');
assert(migratedMidCampaign.bestMissionTimes['iron-veil'] === undefined, 'Migrated save should drop invalid best times');
assert(migratedMidCampaign.bestMissionScores['signal-break'] === 5000, 'Migrated save should preserve valid best scores');
assert(migratedMidCampaign.bestMissionScores['iron-veil'] === undefined, 'Migrated save should drop invalid best scores');
assert(migratedMidCampaign.bestMissionRanks['signal-break'] === 'S', 'Migrated save should preserve valid ranks');
assert(migratedMidCampaign.bestMissionRanks['iron-veil'] === undefined, 'Migrated save should drop invalid ranks');

const migratedLateCampaign = normalizeCampaignProgress({
  saveVersion: 0,
  completedMissionIds: mainMissions.slice(0, 23).map(mission => mission.id),
  unlockedMissionIds: ['signal-break'],
  bestMissionTimes: {},
  bestMissionScores: {},
  bestMissionRanks: {},
  earnedRewardIds: [],
}, MISSIONS);
assert(migratedLateCampaign.unlockedMissionIds.includes('last-light'), 'Migrated late-campaign save should unlock Mission 24 from Mission 23 completion');
assert(getMissionStatus(mainMissions[23], migratedLateCampaign) === 'READY', 'Migrated late-campaign save should make finale READY');

// Stage 7a: validate inventory round-trip for saves that already have inventory data
const savedWithInventory = normalizeCampaignProgress({
  saveVersion: 2,
  completedMissionIds: [],
  unlockedMissionIds: ['signal-break'],
  bestMissionTimes: {},
  bestMissionScores: {},
  bestMissionRanks: {},
  earnedRewardIds: [],
  inventory: {
    parts: 750,
    unlockedWeaponIds: ['pulse-cannon', 'ion-missile'],
    equippedWeaponIds: { PRIMARY: 'pulse-cannon', SECONDARY: 'ion-missile' },
    upgradeLevels: { 'flight-boost-1': 2, 'weapons-damage-1': 1 },
  },
}, MISSIONS);
assert(savedWithInventory.inventory?.parts === 750, 'Normalized save should preserve valid parts value');
assert(savedWithInventory.inventory?.unlockedWeaponIds.includes('ion-missile'), 'Normalized save should preserve unlocked weapon ids');
assert(savedWithInventory.inventory?.equippedWeaponIds?.SECONDARY === 'ion-missile', 'Normalized save should preserve equipped secondary weapon');
assert(savedWithInventory.inventory?.upgradeLevels['flight-boost-1'] === 2, 'Normalized save should preserve positive upgrade levels');

const savedWithBadInventory = normalizeCampaignProgress({
  saveVersion: 2,
  completedMissionIds: [],
  unlockedMissionIds: ['signal-break'],
  bestMissionTimes: {},
  bestMissionScores: {},
  bestMissionRanks: {},
  earnedRewardIds: [],
  inventory: {
    parts: -100,
    unlockedWeaponIds: ['pulse-cannon'],
    equippedWeaponIds: { PRIMARY: 'pulse-cannon', SECONDARY: 'locked-weapon' as never },
    upgradeLevels: { 'bad-upgrade': -1 },
  },
}, MISSIONS);
assert(savedWithBadInventory.inventory?.parts === 0, 'Normalized save should clamp negative parts to 0');
assert(savedWithBadInventory.inventory?.equippedWeaponIds?.SECONDARY === undefined, 'Normalized save should drop equipped weapon not in unlockedWeaponIds');
assert(savedWithBadInventory.inventory?.upgradeLevels['bad-upgrade'] === undefined, 'Normalized save should drop negative upgrade levels');

if (failures.length > 0) {
  console.error('\nCampaign Wave 1 regression validation FAILED:\n');
  failures.forEach(failure => console.error(`  x ${failure}`));
  process.exit(1);
}

console.log('Campaign Wave 1 regression validation passed.');