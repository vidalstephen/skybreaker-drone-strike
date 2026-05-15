import type { AppSettings, CampaignProgress, PlayerInventory } from '../types/game';

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

/** Stage 7a: Default player inventory applied to new saves and to saves missing the inventory field. */
export const DEFAULT_PLAYER_INVENTORY: PlayerInventory = {
  parts: 25, // Stage 7e: balanced starter — enough for one tier-1 upgrade, earns more throughout campaign
  unlockedWeaponIds: ['pulse-cannon'],
  equippedWeaponIds: { PRIMARY: 'pulse-cannon' },
  upgradeLevels: {},
};

export const DEFAULT_CAMPAIGN_PROGRESS: CampaignProgress = {
  saveVersion: 2,
  unlockedMissionIds: ['signal-break'],
  completedMissionIds: [],
  bestMissionTimes: {},
  bestMissionScores: {},
  bestMissionRanks: {},
  earnedRewardIds: [],
  inventory: DEFAULT_PLAYER_INVENTORY,
};

export const SETTINGS_STORAGE_KEY = 'skybreaker.settings.v1';
export const PROGRESS_STORAGE_KEY = 'skybreaker.progress.v1';
export const DEV_PROGRESS_STORAGE_KEY = 'skybreaker.dev-progress.v1';
export const DEV_MODE_STORAGE_KEY = 'skybreaker.dev-mode';
/**
 * Increment this when CampaignProgress schema changes require a migration pass.
 * Version 0 = pre-Stage 6a saves (no saveVersion field).
 * Version 1 = Stage 6a baseline (saveVersion field added).
 * Version 2 = Stage 7a (inventory field added).
 */
export const CAMPAIGN_SAVE_VERSION = 2;
