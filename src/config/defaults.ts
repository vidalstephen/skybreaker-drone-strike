import type { AppSettings, CampaignProgress } from '../types/game';

export const DEFAULT_APP_SETTINGS: AppSettings = {
  masterVolume: 80,
  musicVolume: 60,
  sfxVolume: 80,
  graphicsQuality: 'HIGH',
  reduceEffects: false,
  invertY: true,
  hudScale: 100,
  touchControlsScale: 100,
  screenShake: 70,
  pointerSensitivity: 100,
  touchDragSensitivity: 100,
  showTelemetry: true,
  menuMotion: true,
};

export const DEFAULT_CAMPAIGN_PROGRESS: CampaignProgress = {
  saveVersion: 1,
  unlockedMissionIds: ['signal-break'],
  completedMissionIds: [],
  bestMissionTimes: {},
  bestMissionScores: {},
  bestMissionRanks: {},
  earnedRewardIds: [],
};

export const SETTINGS_STORAGE_KEY = 'skybreaker.settings.v1';
export const PROGRESS_STORAGE_KEY = 'skybreaker.progress.v1';
/**
 * Increment this when CampaignProgress schema changes require a migration pass.
 * Version 0 = pre-Stage 6a saves (no saveVersion field).
 * Version 1 = Stage 6a baseline (saveVersion field added).
 */
export const CAMPAIGN_SAVE_VERSION = 1;
