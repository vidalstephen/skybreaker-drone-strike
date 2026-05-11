import * as THREE from 'three';

// ---------------------------------------------------------------------------
// App-level game phase — drives the top-level shell state in App.tsx
// ---------------------------------------------------------------------------
export enum GamePhase {
  BOOT = 'BOOT',
  MAIN_MENU = 'MAIN_MENU',
  MISSION_SELECT = 'MISSION_SELECT',
  BRIEFING = 'BRIEFING',
  LOADOUT = 'LOADOUT',
  CAREER = 'CAREER',
  CONTROLS = 'CONTROLS',
  CREDITS = 'CREDITS',
  IN_MISSION = 'IN_MISSION',
  PAUSED = 'PAUSED',
  DEBRIEF = 'DEBRIEF',
  SETTINGS = 'SETTINGS',
}

export type GraphicsQuality = 'LOW' | 'MEDIUM' | 'HIGH';

export interface AppSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  graphicsQuality: GraphicsQuality;
  reduceEffects: boolean;
  invertY: boolean;
  hudScale: number;
  touchControlsScale: number;
  screenShake: number;
  pointerSensitivity: number;
  showTelemetry: boolean;
  menuMotion: boolean;
}

export interface CampaignProgress {
  unlockedMissionIds: string[];
  completedMissionIds: string[];
  bestMissionTimes: Record<string, number>;
  bestMissionScores: Record<string, number>;
  bestMissionRanks: Record<string, CampaignRank>;
  earnedRewardIds: string[];
}

export interface CampaignArcDefinition {
  id: string;
  label: string;
  missionRange: string;
  focus: string;
  escalation: string;
  status: 'ACTIVE' | 'PLANNED';
}

export type CampaignRank = 'S' | 'A' | 'B' | 'C';

export type WeaponSlot = 'PRIMARY' | 'SECONDARY';
export type WeaponId = 'pulse-cannon' | 'ion-missile';
export type EnemyRole = 'fast-interceptor' | 'heavy-gunship' | 'missile-platform' | 'shielded-warden' | 'mini-boss';

export interface WeaponDefinition {
  id: WeaponId;
  slot: WeaponSlot;
  label: string;
  role: string;
  trigger: string;
  damage: number;
  energyCost: number;
  cooldownMs: number;
  projectileSpeed: number;
  projectileLife: number;
  color: number;
  lockRequired?: boolean;
  antiAirOnly?: boolean;
  lockRange?: number;
  lockCone?: number;
  lockAcquireMs?: number;
  turnRate?: number;
  blastRadius?: number;
  unlockRewardId?: string;
}

export interface EnemyDefinition {
  role: EnemyRole;
  label: string;
  silhouette: string;
  health: number;
  shields: number;
  speed: number;
  minRange: number;
  maxRange: number;
  drift: number;
  fireCooldownMs: number;
  projectileSpeed: number;
  projectileDamage: number;
  scoreValue: number;
  color: number;
  emissive: number;
  scale: [number, number, number];
}

export interface MissionRewardDefinition {
  id: string;
  label: string;
  description: string;
}

export interface MissionScoringDefinition {
  parTimeMs: number;
  baseScore: number;
  targetBonus: number;
  enemyBonus: number;
  healthBonus: number;
  timeBonus: number;
  rankThresholds: Record<CampaignRank, number>;
}

export interface MissionCompletionStats {
  elapsedMs: number;
  targetsDestroyed: number;
  enemiesDestroyed: number;
  health: number;
}

export interface MissionCompletionResult extends MissionCompletionStats {
  score: number;
  rank: CampaignRank;
  reward: MissionRewardDefinition;
}

export interface MissionBriefingItem {
  label: string;
  value: string;
}

export type LevelKitId = 'night-grid' | 'ash-ridge';
export type WaypointStyleId = 'signal-array' | 'ash-relay';
export type TargetWeakPointLayoutId = 'radar-array' | 'relay-core';
export type MissionTargetArchetype = 'tower' | 'relay-spire' | 'facility-node';

export interface MissionWeakPointDefinition {
  id: string;
  label: string;
  offset: [number, number, number];
  health: number;
  radius: number;
  required?: boolean;
}

export interface MissionTargetDefinition {
  id: string;
  position: [number, number, number];
  health: number;
  archetype?: MissionTargetArchetype;
  weakPoints?: MissionWeakPointDefinition[];
}

export interface MissionExtractionDefinition {
  label: string;
  position: [number, number, number];
  activationObjective: string;
  approachObjective: string;
  completionObjective: string;
  radius: number;
}

export interface MissionEnemyWaveDefinition {
  triggerTargetsDestroyed: number;
  count: number;
  message: string;
  composition: MissionEnemyWaveEntry[];
}

export interface MissionEnemyWaveEntry {
  role: EnemyRole;
  count: number;
}

// TV-3: Industrial structure archetypes
export type StructureArchetype =
  | 'monolith'
  | 'compound'
  | 'gantry'
  | 'pylon'
  | 'beacon-mast'
  | 'antenna-array'
  | 'perimeter-light'
  | 'platform-cluster';

export interface StructureKitDefinition {
  archetypes: StructureArchetype[];
  minDist?: number; // radial min from origin; defaults to 280
  maxDist?: number; // radial max from origin; defaults to 660
}

export interface MissionEnvironmentDefinition {
  id: string;
  levelKitId?: LevelKitId;
  label: string;
  skyColor: number;
  fogColor: number;
  fogNear: number;
  fogFar: number;
  surfaceColor: number;
  gridColor: number;
  structureColor: number;
  plateauColor: number;
  skyDepth: MissionSkyDepthDefinition;
  fogProfile: MissionFogProfileDefinition;
  floorMaterial: MissionFloorMaterialDefinition;
  gridProfile: MissionGridProfileDefinition;
  beaconPalette: MissionBeaconPaletteDefinition;
  ambientLight: MissionLightDefinition;
  sunLight: MissionDirectionalLightDefinition;
  landmarkStyle: 'monoliths' | 'ridges';
  landmarkCount: number;
  plateauCount: number;
  boundaryRadius: number;
  structureKit?: StructureKitDefinition;
  hazards: MissionHazardDefinition[];
}

export interface LevelKitTargetDefaults {
  archetype: MissionTargetArchetype;
  weakPointLayoutId?: TargetWeakPointLayoutId;
}

export interface LevelKitDefinition {
  id: LevelKitId;
  label: string;
  arenaKit: string;
  waypointStyle: WaypointStyleId;
  defaultTarget: LevelKitTargetDefaults;
  environment: MissionEnvironmentDefinition;
}

export interface MissionSkyDepthDefinition {
  topColor: number;
  horizonColor: number;
  bottomColor: number;
  hazeColor: number;
  horizonIntensity: number;
  hazeOpacity: number;
}

export interface MissionFogProfileDefinition {
  color: number;
  near: number;
  far: number;
}

export interface MissionFloorMaterialDefinition {
  color: number;
  roughness: number;
  metalness: number;
}

export interface MissionGridProfileDefinition {
  color: number;
  opacity: number;
  size: number;
  divisions: number;
  y: number;
  // TV-2: major/minor grid hierarchy
  majorDivisions?: number;  // coarser grid division count; defaults to divisions / 5
  majorOpacity?: number;    // major line opacity; defaults to opacity * 2.5
  minorOpacity?: number;    // minor line opacity; defaults to opacity
}

export interface MissionBeaconPaletteDefinition {
  primary: number;
  secondary: number;
  warning: number;
  extraction: number;
}

export interface MissionLightDefinition {
  color: number;
  intensity: number;
}

export interface MissionDirectionalLightDefinition extends MissionLightDefinition {
  position: [number, number, number];
}

export interface MissionHazardDefinition {
  id: string;
  label: string;
  message: string;
  position: [number, number, number];
  radius: number;
  color: number;
  shieldDrainPerSecond: number;
  energyDrainPerSecond: number;
}

export interface MissionFailureConditionDefinition {
  id: 'hull-depleted' | 'out-of-bounds';
  label: string;
  message: string;
}

export interface MissionDefinition {
  id: string;
  order: number;
  title: string;
  levelKitId?: LevelKitId;
  campaignArc: string;
  difficulty: number;
  targetLabel: string;
  initialObjective: string;
  targetDestroyedMessage: string;
  nextTargetMessage: string;
  allTargetsDestroyedMessage: string;
  briefing: MissionBriefingItem[];
  targets: MissionTargetDefinition[];
  extraction: MissionExtractionDefinition;
  enemyWave: MissionEnemyWaveDefinition;
  environment: MissionEnvironmentDefinition;
  failureConditions: MissionFailureConditionDefinition[];
  scoring: MissionScoringDefinition;
  reward: MissionRewardDefinition;
  unlockAfterMissionId?: string;
}

// ---------------------------------------------------------------------------
// Camera
// ---------------------------------------------------------------------------
export type CameraMode = 'CHASE' | 'COCKPIT';

// ---------------------------------------------------------------------------
// In-mission entities
// ---------------------------------------------------------------------------
export interface Target {
  id: string;
  position: THREE.Vector3;
  health: number;
  mesh: THREE.Group;
  destroyed: boolean;
  weakPoints?: TargetWeakPoint[];
  screenPos?: {
    x: number;
    y: number;
    visible: boolean;
    offScreen?: boolean;
    angle?: number;
  };
}

export interface TargetWeakPoint {
  id: string;
  label: string;
  position: THREE.Vector3;
  localOffset: THREE.Vector3;
  health: number;
  maxHealth: number;
  radius: number;
  required: boolean;
  destroyed: boolean;
  mesh: THREE.Object3D;
  damageMesh?: THREE.Object3D;
}

export interface Enemy {
  id: string;
  role: EnemyRole;
  label: string;
  mesh: THREE.Group;
  health: number;
  shields: number;
  destroyed: boolean;
  velocity: THREE.Vector3;
  lastFireTime: number;
  definition: EnemyDefinition;
}

export interface Projectile {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  damage: number;
  weaponId?: WeaponId;
  targetEnemyId?: string;
  trackingSpeed?: number;
  turnRate?: number;
  blastRadius?: number;
  enemyRole?: EnemyRole;
  isEnemy?: boolean;
}

export interface Explosion {
  mesh: THREE.Group;
  life: number;
  maxLife: number;
}

// ---------------------------------------------------------------------------
// Player systems (health, shields, energy)
// ---------------------------------------------------------------------------
export interface PlayerSystems {
  health: number;
  shields: number;
  energy: number;
}

// ---------------------------------------------------------------------------
// Per-mission game logic state (lives in a ref, not React state)
// ---------------------------------------------------------------------------
export interface GameLogic {
  targetsDestroyed: number;
  missionComplete: boolean;
  gameOver: boolean;
  invertY: boolean;
  cameraMode: CameraMode;
}

// ---------------------------------------------------------------------------
// React UI state (drives HUD and overlay rendering)
// ---------------------------------------------------------------------------
export interface GameState {
  health: number;
  speed: number;
  fps: number;
  boosting: boolean;
  firing?: boolean;
  aligned?: boolean;
  hitConfirmed?: boolean;
  recoil?: boolean;
  score: number;
  objective: string;
  targetsDestroyed: number;
  outOfBounds: boolean;
  cameraMode: CameraMode;
  message: string;
  missionComplete: boolean;
  gameOver: boolean;
  missionResult: MissionCompletionResult | null;
  shields: number;
  energy: number;
  enemiesDestroyed: number;
  activeWeaponLabel: string;
  secondaryWeaponLabel: string;
  secondaryReady: boolean;
  secondaryLockLabel: string;
  secondaryLockProgress: number;
  secondaryLockAcquired: boolean;
  secondaryLockHasTarget: boolean;
  startTime: number;
  lockedTargetId: string | null;
  aimScreenPos?: { x: number; y: number };
  droneScreenPos?: { x: number; y: number };
  settings: {
    invertY: boolean;
  };
}
