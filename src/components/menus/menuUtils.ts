import { CAMPAIGN_ARCS } from '../../config/campaign';
import { getCampaignCompletion, getMissionBestRank, getMissionBestScore, getMissionBestTime, getMissionStatus, isMissionUnlocked } from '../../systems/missionSystem';
import type { CampaignArcDefinition, CampaignProgress, MissionDefinition } from '../../types/game';

export function formatTime(ms: number | null) {
  if (ms === null) return '--:--';
  return `${Math.floor(ms / 60000)}:${Math.floor((ms % 60000) / 1000).toString().padStart(2, '0')}`;
}

export function formatParTime(ms: number) {
  return formatTime(ms);
}

export function formatScore(score: number | null | undefined) {
  return score == null ? '0' : score.toLocaleString();
}

export function getTotalBestScore(progress: CampaignProgress) {
  return Object.values(progress.bestMissionScores).reduce((sum, score) => sum + score, 0);
}

export function getEarnedRewardCount(missions: MissionDefinition[], progress: CampaignProgress) {
  return missions.filter(mission => progress.earnedRewardIds.includes(mission.reward.id)).length;
}

export function getNextSortie(missions: MissionDefinition[], progress: CampaignProgress, fallbackMissionId: string) {
  return missions.find(mission => isMissionUnlocked(mission, progress) && !progress.completedMissionIds.includes(mission.id))
    ?? missions.find(mission => mission.id === fallbackMissionId)
    ?? missions[0];
}

export function getArcForMission(mission: MissionDefinition) {
  return CAMPAIGN_ARCS.find(arc => arc.label === mission.campaignArc) ?? CAMPAIGN_ARCS[0];
}

export function getArcMissions(missions: MissionDefinition[], arc: CampaignArcDefinition) {
  return missions.filter(mission => mission.campaignArc === arc.label);
}

export function getArcProgress(missions: MissionDefinition[], arc: CampaignArcDefinition, progress: CampaignProgress) {
  const arcMissions = getArcMissions(missions, arc);
  if (arcMissions.length === 0) return 0;
  const completed = arcMissions.filter(mission => progress.completedMissionIds.includes(mission.id)).length;
  return Math.round((completed / arcMissions.length) * 100);
}

export function getCareerSummary(missions: MissionDefinition[], progress: CampaignProgress) {
  return {
    completion: getCampaignCompletion(missions, progress),
    completedCount: missions.filter(mission => progress.completedMissionIds.includes(mission.id)).length,
    unlockedCount: missions.filter(mission => isMissionUnlocked(mission, progress)).length,
    totalBestScore: getTotalBestScore(progress),
    earnedRewards: getEarnedRewardCount(missions, progress),
  };
}

export function getMissionStatRows(mission: MissionDefinition, progress: CampaignProgress) {
  return [
    { label: 'Status', value: getMissionStatus(mission, progress) },
    { label: 'Best Time', value: formatTime(getMissionBestTime(mission.id, progress)) },
    { label: 'Best Rank', value: getMissionBestRank(mission.id, progress) ?? '--' },
    { label: 'Best Score', value: formatScore(getMissionBestScore(mission.id, progress)) },
  ];
}
