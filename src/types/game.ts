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
  UPGRADES = 'UPGRADES',
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
  touchDragSensitivity: number;
  showTelemetry: boolean;
  menuMotion: boolean;
}

export interface CampaignProgress {
  /** Schema version used for forward-compatible save migration. Absent in pre-6a saves; treated as version 0. */
  saveVersion?: number;
  unlockedMissionIds: string[];
  completedMissionIds: string[];
  bestMissionTimes: Record<string, number>;
  bestMissionScores: Record<string, number>;
  bestMissionRanks: Record<string, CampaignRank>;
  earnedRewardIds: string[];
  /** Stage 7a: Player loadout and upgrade state. Absent in pre-7a saves; populated by normalizeCampaignProgress. */
  inventory?: PlayerInventory;
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

// ---------------------------------------------------------------------------
// Stage 7a: Player inventory and upgrade progression data model
// ---------------------------------------------------------------------------

/** The five upgrade cores covering different mechanical domains. Stage 7c adds per-tree definitions. */
export type UpgradeCoreId = 'flight' | 'weapons' | 'defense' | 'sensor' | 'payload';

/**
 * Per-player loadout and upgrade state. Stored inside CampaignProgress.
 * All fields are individually validated during normalizeCampaignProgress.
 */
export interface PlayerInventory {
  /** Spare parts — earned from mission bonuses and completion rewards; spent on upgrades. */
  parts: number;
  /** Ids of weapons the player has unlocked (mirrored from earnedRewardIds for loadout slot resolution). */
  unlockedWeaponIds: string[];
  /** Currently equipped weapon per slot. Partial so slots can be empty before unlock. */
  equippedWeaponIds: Partial<Record<WeaponSlot, WeaponId>>;
  /** Current upgrade level per upgrade id. Absent key = level 0 (not purchased). Stage 7c populates this. */
  upgradeLevels: Record<string, number>;
}

export type WeaponSlot = 'PRIMARY' | 'SECONDARY';
export type WeaponId = 'pulse-cannon' | 'ion-missile';
export type EnemyRole = 'fast-interceptor' | 'heavy-gunship' | 'missile-platform' | 'shielded-warden' | 'mini-boss' | 'ace-interceptor' | 'sam-battery' | 'flak-cannon' | 'railgun-emplacement';

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
  blastRadius?: number;
  homing?: boolean;       // Stage 5b: true = missile homes on locked target
  unlockRewardId?: string;
  /** Stage 7b: domains/types where this weapon is especially effective. Drives recommendation tags in loadout. */
  recommendations?: Array<CombatDomain | MissionType>;
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
  /** Stage 5d: marks this enemy as a surface (ground) emplacement. Affects spawn Y, AI, and HUD presentation. */
  groundThreat?: boolean;
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
  /** Optional additive score per destroyed set-piece component. Absent preserves current scoring. */
  setPieceComponentBonus?: number;
  /** Optional additive score per completed set-piece phase. Absent preserves current scoring. */
  setPiecePhaseBonus?: number;
  /** Optional additive score per destroyed optional set-piece component. Absent preserves current scoring. */
  setPieceOptionalComponentBonus?: number;
  rankThresholds: Record<CampaignRank, number>;
}

export interface SetPieceMissionStats {
  componentsDestroyed: number;
  requiredComponentsDestroyed: number;
  optionalComponentsDestroyed: number;
  phasesCompleted: number;
  phaseTimeMs: number;
  movingTargetsEscaped: number;
  protectedAssetsLost: number;
}

export interface MissionCompletionStats {
  elapsedMs: number;
  targetsDestroyed: number;
  enemiesDestroyed: number;
  health: number;
  setPieceStats?: SetPieceMissionStats;
  setPieceScore?: number;
  /** Number of optional objectives completed this mission (populated by Stage 2d runtime). */
  optionalObjectivesCompleted?: number;
  /** Ids of bonus conditions that were satisfied (populated by Stage 2d runtime). */
  bonusConditionsEarned?: string[];
  /** Total bonus score from satisfied bonus conditions (populated by Stage 2d runtime). */
  bonusScore?: number;
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

export type LevelKitId = 'night-grid' | 'ash-ridge' | 'storm-coast' | 'arctic-shelf' | 'red-canyon' | 'skybreaker-core' | 'ocean-platform';
export type BiomeId =
  | 'night-grid'
  | 'ash-ridge'
  | 'storm-coast'
  | 'arctic-shelf'
  | 'ocean-platform'
  | 'urban-ruin';
export type WeatherId =
  | 'clear'
  | 'crosswind'
  | 'rain'
  | 'lightning-storm'
  | 'ash-storm'
  | 'snow-frost'
  | 'sea-squall'
  | 'em-interference';
export type WaypointStyleId = 'signal-array' | 'ash-relay' | 'ocean-buoys';
export type TargetWeakPointLayoutId = 'radar-array' | 'relay-core' | 'patrol-craft-vitals';

// ---------------------------------------------------------------------------
// Mission classification types (Stage 2 data model)
// ---------------------------------------------------------------------------
/** The combat theater for a mission. Used for future enemy spawning, objective types, and biome selection. */
export type CombatDomain = 'AIR_TO_AIR' | 'AIR_TO_LAND' | 'AIR_TO_SEA' | 'MIXED';

/** The structural objective role of a mission. Determines progression rules, scoring weighting, and future HUD behavior. */
export type MissionType =
  | 'STRIKE'
  | 'INTERCEPT'
  | 'DEFENSE'
  | 'ESCORT'
  | 'RECON'
  | 'SABOTAGE'
  | 'SURVIVAL'
  | 'BOSS'
  | 'FINALE';

/** The time of day context for a mission. Will drive future lighting presets, visibility modifiers, and briefing display. */
export type TimeOfDayId = 'dawn' | 'day' | 'dusk' | 'night';

// ---------------------------------------------------------------------------
// Objective model (Stage 2b)
// ---------------------------------------------------------------------------
/** Structural type of a mission objective. Drives HUD display, event routing, and future branching logic. */
export type ObjectiveType =
  | 'DESTROY_ALL'
  | 'DESTROY_WEAK_POINTS'
  | 'INTERCEPT'
  | 'DEFEND_ZONE'
  | 'ESCORT_ASSET'
  | 'RECON_SCAN'
  | 'DISABLE_SHIELDS'
  | 'SURVIVE_UNTIL'
  | 'ELIMINATE_BOSS'
  | 'EXTRACT';

/** Type of bonus scoring condition. Rewards high performance without blocking mission completion. */
export type BonusConditionType =
  | 'TIME_THRESHOLD'
  | 'HULL_THRESHOLD'
  | 'DESTROY_OPTIONAL'
  | 'AVOID_HAZARD'
  | 'PRESERVE_ALLY';

/**
 * A bonus condition that awards extra score when a performance goal is met.
 * Bonus conditions never block mission completion — they are purely additive.
 */
export interface BonusCondition {
  /** Unique identifier within the mission. */
  id: string;
  type: BonusConditionType;
  /** Short label shown in debrief and briefing. */
  label: string;
  /** Longer description shown in mission briefing. */
  description?: string;
  /**
   * Numeric goal threshold.
   * - TIME_THRESHOLD: complete mission in fewer ms than this value.
   * - HULL_THRESHOLD: minimum hull % remaining on extraction.
   * - DESTROY_OPTIONAL: number of optional targets to destroy.
   */
  goalValue?: number;
  /** Bonus score awarded when this condition is satisfied. */
  scoreBonus: number;
  /** Message shown in the centre feed when this condition is earned. */
  earnedMessage?: string;
}

// ---------------------------------------------------------------------------
// Stage 2g: Multi-stage objective schema
// ---------------------------------------------------------------------------
/** Role of a child entity track within an objective phase. */
export type ObjectiveChildRole = 'gate' | 'core' | 'optional' | 'escort' | 'hazard';

/**
 * Controls when child tracks in an objective phase are revealed to the player.
 * - 'always': visible from phase entry (default).
 * - 'on-phase-enter': revealed when the phase becomes active.
 * - 'on-gate-destroyed': revealed when this phase's gate-role child is destroyed.
 * - 'on-scan': requires a future recon-scan mechanic (Stage 5+).
 */
export type ObjectivePhaseExposureRule = 'always' | 'on-phase-enter' | 'on-gate-destroyed' | 'on-scan';

/** What causes a phase to complete and advance to the next phase or finish the objective. */
export type PhaseCompletionTrigger =
  | 'all-required-destroyed'  // every required child track is destroyed (default)
  | 'any-required-destroyed'  // the first required child track is destroyed
  | 'timer-elapsed'           // a survival/escape countdown expires
  | 'player-in-zone';         // player enters the designated zone track

/** Condition that must be satisfied for a phase to complete. */
export interface ObjectivePhaseCompletionCondition {
  trigger: PhaseCompletionTrigger;
  /** Duration in milliseconds for 'timer-elapsed' phases (escape windows, survival waves). */
  timerMs?: number;
  /** Track id of the zone to enter for 'player-in-zone' phases. */
  zoneTrackId?: string;
}

/** A single tracked entity that participates in an objective phase. */
export interface ObjectiveChildTrackDefinition {
  /** Id of the entity this child references — must match a registered track id or a virtual sub-track. */
  trackId: string;
  /** Role of this child within the phase. */
  role: ObjectiveChildRole;
  /** Whether destroying/completing this child is required for phase completion. */
  required: boolean;
  /** Exposure rule override for this child specifically. Falls back to the phase's exposureRule when absent. */
  exposureRule?: ObjectivePhaseExposureRule;
  /** Tracking metadata override for this child within this phase. */
  trackingMeta?: TrackingMetaDefinition;
}

/** A single phase within a multi-stage objective. */
export interface ObjectivePhaseDefinition {
  /** Unique id within the parent objective (e.g. 'shield-gate', 'reactor-core', 'escape-window'). */
  id: string;
  /** Short label shown in HUD chip while this phase is active. Falls back to parent objective label. */
  label?: string;
  /** HUD text override for this phase. Falls back to parent objective hudText when absent. */
  hudText?: string;
  /** Centre-feed message when this phase completes. Falls back to parent objective completionMessage. */
  completionMessage?: string;
  /** Default exposure rule for all child tracks in this phase. Defaults to 'always'. */
  exposureRule?: ObjectivePhaseExposureRule;
  /** Entities that participate in this phase. */
  childTracks?: ObjectiveChildTrackDefinition[];
  /** What causes this phase to end. Defaults to 'all-required-destroyed' when absent. */
  completionCondition?: ObjectivePhaseCompletionCondition;
}

/** A single mission objective with progress tracking, HUD display, and event metadata. */
export interface ObjectiveDefinition {
  /** Unique identifier within the mission. */
  id: string;
  type: ObjectiveType;
  /** Short label shown in HUD chip and briefing. */
  label: string;
  /** Optional longer description for briefing / tooltip. */
  description?: string;
  /** Whether the mission fails if this objective is not completed. */
  required: boolean;
  /** Whether this objective is optional — completing it earns bonus rewards but is not required. */
  optional?: boolean;
  /** Total count for progress-tracked objectives (e.g. destroy 3 of 3 targets). */
  totalCount?: number;
  /** Text shown in the HUD objective chip while this objective is active. */
  hudText: string;
  /** Message shown in the centre feed when this objective completes. */
  completionMessage: string;
  /** Whether completing this objective activates the extraction zone. */
  activatesExtraction?: boolean;
  /** Id of the next objective that becomes active after this one completes. */
  successorObjectiveId?: string;
  /** Optional authored tracking metadata. Controls radar label, marker label, priority, and discovery behaviour. */
  trackingMeta?: TrackingMetaDefinition;
  /**
   * Ordered phase sequence for multi-stage objectives (shield gates, reactor phases, boss phases, escape windows).
   * When absent the objective is treated as single-phase. Phases are indexed 0-based and advance in order.
   */
  phases?: ObjectivePhaseDefinition[];
}

/** Ordered set of primary and optional objectives for a mission, plus bonus scoring conditions. */
export interface MissionObjectiveSet {
  primary: ObjectiveDefinition[];
  /** Optional side objectives that can be completed for bonus rewards but do not block completion. */
  optional?: ObjectiveDefinition[];
  /** Bonus conditions that award score when met without blocking mission completion. */
  bonusConditions?: BonusCondition[];
}

// ---------------------------------------------------------------------------
// Stage 2d: objective runtime state (serializable snapshots for React UI)
// ---------------------------------------------------------------------------
/** Serializable snapshot of a single objective's runtime state — safe to store in React state. */
export interface ObjectiveRuntimeState {
  id: string;
  label: string;
  hudText: string;
  completed: boolean;
  failed: boolean;
  optional: boolean;
  currentCount?: number;
  totalCount?: number;
  // Stage 2g phase support
  /** Index of the currently active phase (0-based). Absent for single-phase objectives. */
  activePhaseIndex?: number;
  /** Total number of authored phases. Absent for single-phase objectives. */
  totalPhases?: number;
}

/** Serializable snapshot of all objective states for a mission frame — drives HUD and debrief UI. */
export interface MissionObjectiveSnapshot {
  primaryObjectives: ObjectiveRuntimeState[];
  optionalObjectives: ObjectiveRuntimeState[];
  /** Id of the currently active primary objective. */
  activeObjectiveId: string | null;
  /** Ids of bonus conditions satisfied at extraction (empty until mission completes). */
  bonusConditionsEarned: string[];
}

// ---------------------------------------------------------------------------
// Stage 2e: Mission event bus
// ---------------------------------------------------------------------------
/** Discrete event types emitted during a mission session. */
export type MissionEventType =
  | 'OBJECTIVE_PHASE_CHANGE'
  | 'EXTRACTION_ACTIVATED'
  | 'REINFORCEMENTS_INBOUND'
  | 'HAZARD_ENTERED'
  | 'HAZARD_EXITED'
  | 'TIMED_WARNING'
  | 'WEATHER_CHANGED'
  | 'MISSION_FAILURE_WINDOW';

/** A single timestamped event emitted during a mission session. */
export interface MissionEvent {
  type: MissionEventType;
  /** Timestamp from Date.now() when the event was emitted. */
  timestamp: number;
  /** Optional contextual data (hazard id, objective id, weather id, etc.). */
  data?: Record<string, string | number | boolean>;
}

/**
 * Accumulated mission event state — stored in a ref (never in React state).
 * Tracks in-mission behavior needed to evaluate bonus conditions at extraction.
 */
export interface MissionEventAccumulator {
  /** Ids of hazard zones the player entered this mission. Used for AVOID_HAZARD bonus conditions. */
  hazardContactIds: Set<string>;
  /** Number of ally entities lost this mission. Used for PRESERVE_ALLY bonus conditions. */
  alliesLost: number;
  /** Full ordered event log for this mission session. */
  events: MissionEvent[];
}

export type MissionTargetArchetype = 'tower' | 'relay-spire' | 'facility-node' | 'bomber' | 'transport' | 'patrol-craft';

// ---------------------------------------------------------------------------
// Stage 2f: Mission-authored tracking metadata
// ---------------------------------------------------------------------------
/**
 * Controls when a tracked entity becomes visible on the radar and HUD markers.
 * - 'always': visible from mission start (default).
 * - 'hidden-until-active': hidden while state is 'inactive' or 'detected'; revealed on state advance.
 * - 'hidden-until-scanned': same behaviour as hidden-until-active for now; future recon-scan reveal.
 * - 'urgent-only': visible only when within danger range or at top priority score.
 */
export type TrackDiscoveryBehavior = 'always' | 'hidden-until-active' | 'hidden-until-scanned' | 'urgent-only';

/**
 * Optional authored tracking metadata for a mission entity.
 * All fields are optional and fall back to system defaults when absent.
 */
export interface TrackingMetaDefinition {
  /** Radar blip label override. Defaults to the entity label. */
  radarLabel?: string;
  /** World marker label override. Defaults to the entity label. */
  markerLabel?: string;
  /** Additive priority score bonus applied on top of the type-based base score. */
  priorityBonus?: number;
  /** Discovery and visibility rule. Defaults to 'always'. */
  discoveryBehavior?: TrackDiscoveryBehavior;
  /** Short message shown while the player is approaching this entity. */
  approachHint?: string;
  /** Human-readable attention reason shown in radar attention states. */
  attentionReason?: string;
  /** Direction or route hint shown when this entity is the active target. */
  routeHint?: string;
  /** Stage 5f: combat domain — drives radar blip shape and HUD badge. */
  domain?: 'air' | 'ground' | 'sea';
}

// ---------------------------------------------------------------------------
// Stage 4a: set-piece objective archetype schema
// ---------------------------------------------------------------------------
export type SetPieceArchetypeId =
  | 'legacy-tower'
  | 'legacy-relay-spire'
  | 'radar-network'
  | 'shield-generator'
  | 'convoy'
  | 'sam-site'
  | 'reactor'
  | 'bridge'
  | 'carrier'
  | 'platform'
  | 'frigate'
  | 'mega-core';

export type TargetComponentRole =
  | 'core'
  | 'weak-point'
  | 'radar-array'
  | 'shield-node'
  | 'engine'
  | 'weapon'
  | 'reactor'
  | 'bridge-span'
  | 'cargo'
  | 'escort'
  | 'optional-system';

export type TargetComponentExposureState = 'exposed' | 'hidden' | 'shielded' | 'phase-gated';

export type SetPiecePhaseTrigger =
  | 'mission-start'
  | 'component-destroyed'
  | 'all-required-components-destroyed'
  | 'health-threshold'
  | 'timer-elapsed'
  | 'player-in-zone';

export interface TargetComponentDefinition {
  id: string;
  label: string;
  role: TargetComponentRole;
  health: number;
  required: boolean;
  exposure: TargetComponentExposureState;
  /** Optional local-space offset for simple static target components. */
  offset?: [number, number, number];
  /** Optional collision/marker radius override for this component. */
  radius?: number;
  /** Optional phase id that initially owns this component. */
  phaseId?: string;
  trackingMeta?: TrackingMetaDefinition;
}

export interface SetPiecePhaseDefinition {
  id: string;
  label: string;
  trigger: SetPiecePhaseTrigger;
  activeComponentIds: string[];
  /** Components revealed when this phase begins or its trigger resolves. */
  exposesComponentIds?: string[];
  /** Components hidden or deprecated when this phase begins or its trigger resolves. */
  hidesComponentIds?: string[];
  /** Component ids that must resolve for component-driven triggers. */
  requiredComponentIds?: string[];
  /** Health percentage for health-threshold triggers. */
  healthThreshold?: number;
  /** Duration in milliseconds for timer-elapsed phases. */
  timerMs?: number;
  nextPhaseId?: string;
}

export interface SetPieceArchetypeDefinition {
  id: SetPieceArchetypeId;
  label: string;
  description: string;
  combatDomains: CombatDomain[];
  missionTypes: MissionType[];
  /** Runtime visual fallback used until Stage 4b+ implements bespoke renderers. */
  renderArchetype?: MissionTargetArchetype;
  /** Current simple target archetypes this definition can represent. */
  compatibleTargetArchetypes?: MissionTargetArchetype[];
  components: TargetComponentDefinition[];
  phases: SetPiecePhaseDefinition[];
  defaultTrackingMeta?: TrackingMetaDefinition;
}

export interface TargetComponentRuntimeState {
  id: string;
  label: string;
  role: TargetComponentRole;
  health: number;
  maxHealth: number;
  required: boolean;
  exposure: TargetComponentExposureState;
  active: boolean;
  destroyed: boolean;
  offset?: [number, number, number];
  radius?: number;
  phaseId?: string;
  trackingMeta?: TrackingMetaDefinition;
}

export interface TargetSetPieceRuntimeState {
  archetypeId: SetPieceArchetypeId;
  label: string;
  components: TargetComponentRuntimeState[];
  phases: SetPiecePhaseDefinition[];
  activePhaseIndex: number;
  completedPhaseIds: string[];
}

export interface MissionWeakPointDefinition {
  id: string;
  label: string;
  offset: [number, number, number];
  health: number;
  radius: number;
  required?: boolean;
}

export type TargetMovementLoopMode = 'once' | 'loop' | 'ping-pong';

export type TargetMovementEndBehavior = 'stop' | 'fail-mission';

export interface TargetRouteWaypointDefinition {
  position: [number, number, number];
  holdMs?: number;
  speed?: number;
}

export interface MissionTargetMovementDefinition {
  route: TargetRouteWaypointDefinition[];
  speed?: number;
  loopMode?: TargetMovementLoopMode;
  startDelayMs?: number;
  endBehavior?: TargetMovementEndBehavior;
  escapeMessage?: string;
}

export interface MissionTargetDefinition {
  id: string;
  position: [number, number, number];
  health: number;
  archetype?: MissionTargetArchetype;
  /** Optional set-piece archetype for Stage 4+ component/phase semantics. */
  setPieceArchetypeId?: SetPieceArchetypeId;
  /** Optional per-target component overrides. Stage 4a data-only; Stage 4b wires runtime behavior. */
  components?: TargetComponentDefinition[];
  weakPoints?: MissionWeakPointDefinition[];
  movement?: MissionTargetMovementDefinition;
  /** Optional authored tracking metadata for this target. */
  trackingMeta?: TrackingMetaDefinition;
}

// ---------------------------------------------------------------------------
// Stage 2h: Extraction policy
// ---------------------------------------------------------------------------
/**
 * What happens when the player leaves the extraction radius after entering it.
 * - 'none': no warning; player can leave freely (default).
 * - 'warn': show a warning message but do not abort.
 * - 'countdown': start an abort countdown; mission fails if it reaches zero.
 * - 'abort': mission fails immediately on leaving the radius.
 */
export type ExtractionWarningBehavior = 'none' | 'warn' | 'countdown' | 'abort';

/**
 * Governs what makes the extraction succeed.
 * - 'enter-radius': mission completes on first frame inside radius (default).
 * - 'dwell': player must remain inside the radius for `dwellMs` milliseconds.
 * - 'confirm': player must press a confirm input while inside the radius (future).
 */
export type ExtractionCompletionMode = 'enter-radius' | 'dwell' | 'confirm';

/**
 * Authored extraction policy attached to a mission's extraction definition.
 * All fields are optional and fall back to safe defaults when absent.
 */
export interface ExtractionPolicyDefinition {
  /** Approach threshold in world units — distance at which the state changes to 'approaching'. Defaults to 3x radius. */
  approachThreshold?: number;
  /** What happens when the player exits the radius after entering it. Defaults to 'none'. */
  warningBehavior?: ExtractionWarningBehavior;
  /** Countdown duration in milliseconds for 'countdown' warningBehavior. */
  countdownMs?: number;
  /** Warning message shown when the player leaves the radius. */
  leaveMessage?: string;
  /** How the extraction is confirmed. Defaults to 'enter-radius'. */
  completionMode?: ExtractionCompletionMode;
  /** Dwell duration in milliseconds for 'dwell' completionMode. */
  dwellMs?: number;
}

export interface MissionExtractionDefinition {
  label: string;
  position: [number, number, number];
  activationObjective: string;
  approachObjective: string;
  completionObjective: string;
  radius: number;
  /** Optional authored tracking metadata for the extraction zone. */
  trackingMeta?: TrackingMetaDefinition;
  /** Optional extraction policy. Controls approach detection, completion mode, and warning behavior. */
  policy?: ExtractionPolicyDefinition;
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

// ---------------------------------------------------------------------------
// Stage 3a: Biome registry types
// ---------------------------------------------------------------------------

/**
 * Sky, fog, and lighting parameters that constitute an atmosphere.
 * Used as a biome's default atmosphere and as a base for time-of-day presets.
 */
export interface AtmosphereDefinition {
  skyColor: number;
  fogColor: number;
  fogNear: number;
  fogFar: number;
  skyDepth: MissionSkyDepthDefinition;
  fogProfile: MissionFogProfileDefinition;
  ambientLight: MissionLightDefinition;
  sunLight: MissionDirectionalLightDefinition;
}

/**
 * A lighting preset keyed by time of day.
 * Carries per-biome atmosphere overrides so each biome can have correctly tuned
 * sky/fog/lighting per time of day.  Falls back to the biome's defaultAtmosphere
 * when no override is present for that biome.
 */
export interface TimeOfDayPreset {
  id: TimeOfDayId;
  label: string;
  /** Per-biome atmosphere overrides.  Falls back to biome.defaultAtmosphere when absent. */
  atmospheres: Partial<Record<BiomeId, AtmosphereDefinition>>;
}

/**
 * Biome spatial and color identity — independent of sky/lighting.
 * Contains a defaultAtmosphere used when no time-of-day or weather override is provided.
 * Composes with an AtmosphereDefinition via composeEnvironment() to produce a MissionEnvironmentDefinition.
 */
export interface BiomeDefinition {
  id: BiomeId;
  label: string;
  /** Accent grid color tied to the biome's visual identity. */
  gridColor: number;
  surfaceColor: number;
  structureColor: number;
  plateauColor: number;
  beaconPalette: MissionBeaconPaletteDefinition;
  floorMaterial: MissionFloorMaterialDefinition;
  /** Grid layout profile. The color field should match gridColor. */
  gridProfile: MissionGridProfileDefinition;
  landmarkStyle: 'monoliths' | 'ridges' | 'buoys' | 'ice-formations' | 'platforms' | 'ruins';
  landmarkCount: number;
  plateauCount: number;
  boundaryRadius: number;
  structureKit?: StructureKitDefinition;
  hazards: MissionHazardDefinition[];
  /** Default atmosphere used when no explicit time-of-day or weather override is provided. */
  defaultAtmosphere: AtmosphereDefinition;
}

// ---------------------------------------------------------------------------
// Stage 3c: Weather definition types
// ---------------------------------------------------------------------------

/** Visual atmosphere overrides applied on top of the biome+TOD environment when weather is active. */
export interface WeatherVisualParams {
  /** Multiplier applied to both fogNear and fogFar (< 1 = denser fog). Absent = no change. */
  fogMultiplier?: number;
  /** Particle effect type to spawn. */
  particleEffect?: 'rain' | 'snow' | 'ash' | 'lightning' | 'none';
  /** Density of particle effect, 0–1. */
  particleDensity?: number;
  /** Additive RGB tint applied to sky color (hex). */
  skyColorShift?: number;
  /** Multiplier on ambient light intensity. */
  ambientIntensityMultiplier?: number;
  /** Screen overlay opacity for storm lightning flash effects (0–1). */
  lightningFlashOpacity?: number;
}

/** Gameplay modifiers applied to the player aircraft and projectiles while weather is active. */
export interface WeatherGameplayModifiers {
  /** Lateral force applied to projectiles and player aircraft (units per second). */
  windDrift?: number;
  /** Multiplier on effective visibility / weapon lock range. */
  visibilityMultiplier?: number;
  /** Multiplier on boost energy recovery rate. */
  boostRecoveryMultiplier?: number;
  /** Multiplier on shield recharge rate. */
  shieldRechargeMultiplier?: number;
  /** Persistent energy drain per second from electromagnetic or environmental effects. */
  energyDrainPerSecond?: number;
}

/** Sensor and radar modifiers applied while weather is active. */
export interface WeatherSensorModifiers {
  /** Multiplier on effective radar detection range. */
  radarRangeMultiplier?: number;
  /** Multiplier on target lock acquisition speed. */
  lockSpeedMultiplier?: number;
  /** Sensor noise level 0–1; can drive static on radar or HUD. */
  sensorNoiseLevel?: number;
}

/**
 * Full weather condition definition.
 * Added to a mission via MissionDefinition.weatherId.  Absent or 'clear' = no effect.
 * Stage 3d wires gameplay/sensor modifiers into the runtime; Stage 3f validates readability.
 */
export interface WeatherDefinition {
  id: WeatherId;
  label: string;
  /** Short warning text displayed in-mission when weather is active (e.g. "CROSSWIND ACTIVE"). */
  warningText: string;
  /** Optional sentence for briefing display (e.g. "Crosswind conditions expected during approach"). */
  briefingNote?: string;
  /** Visual atmosphere overrides layered on top of biome + TOD environment. */
  visual: WeatherVisualParams;
  /** Gameplay modifiers applied while weather is active. */
  gameplay: WeatherGameplayModifiers;
  /** Sensor and radar modifiers applied while weather is active. */
  sensors: WeatherSensorModifiers;
  /** Reduced visual parameters used when graphics quality is low or reduced-effects mode is active. */
  reducedEffects?: WeatherVisualParams;
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
  landmarkStyle: 'monoliths' | 'ridges' | 'buoys' | 'ice-formations' | 'platforms' | 'ruins';
  landmarkCount: number;
  plateauCount: number;
  boundaryRadius: number;
  structureKit?: StructureKitDefinition;
  hazards: MissionHazardDefinition[];
}

export interface LevelKitTargetDefaults {
  archetype: MissionTargetArchetype;
  setPieceArchetypeId?: SetPieceArchetypeId;
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
  /** Optional authored tracking metadata for this hazard zone. */
  trackingMeta?: TrackingMetaDefinition;
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
  /** Combat theater: air-to-air, air-to-land, air-to-sea, or mixed. */
  combatDomain?: CombatDomain;
  /** Structural mission role: strike, intercept, boss, finale, etc. */
  missionType?: MissionType;
  /** Time-of-day context for future lighting and visibility modifiers. */
  timeOfDay?: TimeOfDayId;
  /** Weather condition for this mission. Absent or 'clear' = no gameplay or visual modification. */
  weatherId?: WeatherId;
  /** Structured objective definitions. When absent, the runtime derives objectives from existing mission fields. */
  objectiveSet?: MissionObjectiveSet;
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
  maxHealth: number;
  mesh: THREE.Group;
  destroyed: boolean;
  weakPoints?: TargetWeakPoint[];
  setPiece?: TargetSetPieceRuntimeState;
  movement?: TargetMovementRuntimeState;
}

export interface TargetMovementRuntimeState {
  route: THREE.Vector3[];
  routeHoldMs: number[];
  speed: number;
  loopMode: TargetMovementLoopMode;
  startDelayMs: number;
  endBehavior: TargetMovementEndBehavior;
  escapeMessage?: string;
  currentWaypointIndex: number;
  direction: 1 | -1;
  holdMsRemaining: number;
  elapsedMs: number;
  completed: boolean;
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
  blastRadius?: number;
  enemyRole?: EnemyRole;
  isEnemy?: boolean;
  targetId?: string | null;  // Stage 5b: homing guidance target (null = fly straight)
}

export interface Explosion {
  mesh: THREE.Group;
  life: number;
  maxLife: number;
}

// ---------------------------------------------------------------------------
// Tracking System — Stage 1c
// Serializable HUD snapshots — no Three.js refs; safe to pass to React state
// ---------------------------------------------------------------------------

export enum TrackedEntityType {
  OBJECTIVE  = 'OBJECTIVE',
  WEAK_POINT = 'WEAK_POINT',
  ENEMY      = 'ENEMY',
  EXTRACTION = 'EXTRACTION',
  HAZARD     = 'HAZARD',
  /** Stage 5f: allied units — stub for future use, not yet spawned. */
  ALLY       = 'ALLY',
}

export type TrackedEntityState =
  | 'inactive'
  | 'detected'
  | 'active'
  | 'priority'
  | 'damaged'
  | 'completed'
  | 'destroyed'
  // Stage 2h: extraction-specific states
  /** Extraction activated this frame — brief transitional state before 'active'. */
  | 'activating'
  /** Player is within the approach threshold but not yet inside the radius. */
  | 'approaching'
  /** Player is inside the extraction radius (mission completing). */
  | 'inside-radius'
  /** Extraction point is contested — used when enemies are within the radius. Future use. */
  | 'contested'
  /** An alternate extraction point has been designated. Future use. */
  | 'alternate'
  /** Extraction point is relocating. Future use. */
  | 'moving'
  /** Emergency extraction with modified policy. Future use. */
  | 'emergency';

// ---------------------------------------------------------------------------
// Stage 5a: Target lock types
// ---------------------------------------------------------------------------

/** Phase of lock-on acquisition for the currently selected target. */
export type TargetLockState = 'none' | 'acquiring' | 'locked';

/**
 * Serializable lock state for the currently selected target.
 * Passed to HUD components via GameState. Null when no target is selected.
 */
export interface TargetLockSnapshot {
  /** Track id of the locked/acquiring target. */
  id: string;
  /** Display label. */
  label: string;
  /** Entity type — drives icon and color. */
  type: TrackedEntityType;
  /** Current distance from player to target in world units. */
  distance: number;
  /** Current health fraction (0–maxHealth). Absent for entities without health. */
  health?: number;
  /** Max health. */
  maxHealth?: number;
  /** Current lock phase. */
  lockState: TargetLockState;
  /** Lock progress 0–1. Drives the lock ring arc on the HUD. */
  lockProgress: number;
  /** True when the player manually cycled to this target rather than auto-priority. */
  isManual: boolean;
  /** Stage 5f: combat domain — drives badge label in TargetLock HUD. */
  domain?: 'air' | 'ground' | 'sea';
  /** Stage 5f: routing hint forwarded from tracking metadata when present. */
  routeHint?: string;
}

/** Serializable snapshot passed to HUD components — updated each frame tick */
export interface TrackedEntitySnapshot {
  id:               string;
  type:             TrackedEntityType;
  label:            string;
  worldX:           number;
  worldY:           number;
  worldZ:           number;
  state:            TrackedEntityState;
  priorityScore:    number;
  isSelected:       boolean;
  radarPulse:       boolean;
  isRequired:       boolean;
  health?:          number;
  maxHealth?:       number;
  shields?:         number;
  maxShield?:       number;
  distanceToPlayer: number;
  // Stage 2f authored tracking metadata (optional; absent = system defaults apply)
  radarLabel?:        string;
  markerLabel?:       string;
  priorityBonus?:     number;
  discoveryBehavior?: TrackDiscoveryBehavior;
  approachHint?:      string;
  attentionReason?:   string;
  routeHint?:         string;
  /** Stage 5f: combat domain — air / ground / sea. Drives radar blip shape. */
  domain?:            'air' | 'ground' | 'sea';
}

// ---------------------------------------------------------------------------
// Player systems (health, shields, energy)
// ---------------------------------------------------------------------------
export interface PlayerSystems {
  health: number;
  shields: number;
  energy: number;       // weapon energy — costs per shot
  boostEnergy: number;  // boost/afterburner energy — separate cooldown
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
  /** Set of objective ids that have been marked complete this mission. */
  completedObjectiveIds: Set<string>;
  /** Per-objective phase progress: maps objective id → current phase index (0-based). */
  objectivePhaseIndices: Map<string, number>;
  /** Mission event accumulator — tracks hazard contacts, ally losses, and event history. */
  missionEvents: MissionEventAccumulator;
  setPieceStats: SetPieceMissionStats;
  destroyedComponentKeys: Set<string>;
  completedPhaseKeys: Set<string>;
  phaseStartedAtMs: Map<string, number>;
  // Stage 5a: target lock
  /** Lock progress 0–1 for the currently selected target. Reset when selection changes. */
  lockProgress: number;
  /** Track id of the last entity for which lock progress was accumulating. */
  lockTargetId: string | null;
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
  energy: number;       // weapon energy
  boostEnergy: number;  // boost/afterburner energy
  enemiesDestroyed: number;
  activeWeaponLabel: string;
  secondaryWeaponLabel: string;
  secondaryReady: boolean;
  startTime: number;
  aimScreenPos?: { x: number; y: number };
  droneScreenPos?: { x: number; y: number };
  settings: {
    invertY: boolean;
  };
  /** Serializable snapshot of mission objective state. Null until first game tick. */
  objectiveSnapshot: MissionObjectiveSnapshot | null;
  /** Serializable target lock state for the HUD lock indicator. Null when no target is selected. */
  targetLock: TargetLockSnapshot | null;
  /** Stage 5d: true when a ground threat emplacement has the player within firing range. */
  surfaceWarning?: boolean;
}
