import type { AppSettings, CampaignProgress } from '../types/game';

export const DEFAULT_APP_SETTINGS: AppSettings = {
  masterVolume: 80,
  musicVolume: 60,
  sfxVolume: 80,
  graphicsQuality: 'HIGH',
  reduceEffects: false,
  invertY: true,
};

export const DEFAULT_CAMPAIGN_PROGRESS: CampaignProgress = {
  unlockedMissionIds: ['signal-break'],
  completedMissionIds: [],
  bestMissionTimes: {},
  bestMissionScores: {},
  bestMissionRanks: {},
  earnedRewardIds: [],
};

export const SETTINGS_STORAGE_KEY = 'skybreaker.settings.v1';
export const PROGRESS_STORAGE_KEY = 'skybreaker.progress.v1';
