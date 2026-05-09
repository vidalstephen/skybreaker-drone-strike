import type { CampaignProgress, MissionCompletionResult, MissionCompletionStats, MissionDefinition } from '../types/game';

export function formatMissionObjective(mission: MissionDefinition, destroyedCount: number) {
  return `${mission.initialObjective}: ${destroyedCount} / ${mission.targets.length}`;
}

export function isMissionUnlocked(mission: MissionDefinition, progress: CampaignProgress) {
  return progress.unlockedMissionIds.includes(mission.id);
}

export function getMissionBestTime(missionId: string, progress: CampaignProgress) {
  return progress.bestMissionTimes[missionId] ?? null;
}

export function getMissionBestScore(missionId: string, progress: CampaignProgress) {
  return progress.bestMissionScores[missionId] ?? null;
}

export function getMissionBestRank(missionId: string, progress: CampaignProgress) {
  return progress.bestMissionRanks[missionId] ?? null;
}

export function getMissionStatus(mission: MissionDefinition, progress: CampaignProgress) {
  if (progress.completedMissionIds.includes(mission.id)) return 'CLEARED';
  if (isMissionUnlocked(mission, progress)) return 'READY';
  return 'LOCKED';
}

export function calculateMissionResult(mission: MissionDefinition, stats: MissionCompletionStats): MissionCompletionResult {
  const timeRatio = Math.max(0, 1 - stats.elapsedMs / mission.scoring.parTimeMs);
  const score = Math.round(
    mission.scoring.baseScore +
    stats.targetsDestroyed * mission.scoring.targetBonus +
    stats.enemiesDestroyed * mission.scoring.enemyBonus +
    Math.max(0, stats.health) * mission.scoring.healthBonus +
    timeRatio * mission.scoring.timeBonus
  );

  const rank = score >= mission.scoring.rankThresholds.S
    ? 'S'
    : score >= mission.scoring.rankThresholds.A
      ? 'A'
      : score >= mission.scoring.rankThresholds.B
        ? 'B'
        : 'C';

  return {
    ...stats,
    score,
    rank,
    reward: mission.reward,
  };
}

export function completeMission(progress: CampaignProgress, mission: MissionDefinition, result: MissionCompletionResult, missions: MissionDefinition[]) {
  const completedMissionIds = progress.completedMissionIds.includes(mission.id)
    ? progress.completedMissionIds
    : [...progress.completedMissionIds, mission.id];

  const nextMissionIds = missions
    .filter(candidate => candidate.unlockAfterMissionId === mission.id)
    .map(candidate => candidate.id);

  const unlockedMissionIds = Array.from(new Set([...progress.unlockedMissionIds, ...nextMissionIds]));
  const previousBest = progress.bestMissionTimes[mission.id];
  const previousBestScore = progress.bestMissionScores[mission.id];
  const earnedRewardIds = Array.from(new Set([...progress.earnedRewardIds, mission.reward.id]));

  return {
    ...progress,
    unlockedMissionIds,
    completedMissionIds,
    earnedRewardIds,
    bestMissionTimes: {
      ...progress.bestMissionTimes,
      [mission.id]: previousBest === undefined ? result.elapsedMs : Math.min(previousBest, result.elapsedMs),
    },
    bestMissionScores: {
      ...progress.bestMissionScores,
      [mission.id]: previousBestScore === undefined ? result.score : Math.max(previousBestScore, result.score),
    },
    bestMissionRanks: {
      ...progress.bestMissionRanks,
      [mission.id]: previousBestScore === undefined || result.score >= previousBestScore ? result.rank : progress.bestMissionRanks[mission.id],
    },
  };
}

export function getCampaignCompletion(missions: MissionDefinition[], progress: CampaignProgress) {
  if (missions.length === 0) return 0;
  return Math.round((progress.completedMissionIds.length / missions.length) * 100);
}
