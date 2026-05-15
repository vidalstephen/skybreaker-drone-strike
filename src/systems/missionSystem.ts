import type { BonusCondition, CampaignProgress, MissionCompletionResult, MissionCompletionStats, MissionDefinition, MissionEventAccumulator, MissionObjectiveSet, MissionObjectiveSnapshot, ObjectiveDefinition, ObjectivePhaseDefinition, PlayerInventory, ObjectiveRuntimeState } from '../types/game';
import { CAMPAIGN_ARCS } from '../config/campaign';
import { DEV_UNLOCK_PROTOTYPES } from '../config/buildMeta';
import { CAMPAIGN_SAVE_VERSION, DEFAULT_CAMPAIGN_PROGRESS, DEFAULT_PLAYER_INVENTORY } from '../config/defaults';

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

/**
 * Build a standard two-phase (destroy-all → extract) objective set derived from
 * existing mission fields. Used when a mission has no explicitly authored objectiveSet.
 */
export function buildObjectiveSet(mission: MissionDefinition): MissionObjectiveSet {
  return {
    primary: [
      {
        id: 'destroy-targets',
        type: 'DESTROY_ALL',
        label: mission.targetLabel,
        required: true,
        totalCount: mission.targets.length,
        hudText: mission.initialObjective,
        completionMessage: mission.allTargetsDestroyedMessage,
        activatesExtraction: true,
        successorObjectiveId: 'extract',
      },
      {
        id: 'extract',
        type: 'EXTRACT',
        label: mission.extraction.label,
        required: true,
        hudText: mission.extraction.activationObjective,
        completionMessage: mission.extraction.completionObjective,
      },
    ],
  };
}

/**
 * Return the currently active ObjectiveDefinition for the given destroy progress.
 * Uses the mission's authored objectiveSet if present; otherwise derives one from
 * existing mission fields via buildObjectiveSet.
 */
export function getActiveObjective(mission: MissionDefinition, destroyedCount: number): ObjectiveDefinition | null {
  const set = mission.objectiveSet ?? buildObjectiveSet(mission);
  const primary = set.primary;
  if (!primary.length) return null;
  for (const obj of primary) {
    const isDestroyPhase =
      obj.type === 'DESTROY_ALL' ||
      obj.type === 'DESTROY_WEAK_POINTS' ||
      obj.type === 'ELIMINATE_BOSS';
    if (isDestroyPhase) {
      if (destroyedCount < (obj.totalCount ?? mission.targets.length)) return obj;
    } else {
      if (destroyedCount >= mission.targets.length) return obj;
    }
  }
  return primary[primary.length - 1] ?? null;
}

export function formatMissionObjective(mission: MissionDefinition, destroyedCount: number): string {
  const active = getActiveObjective(mission, destroyedCount);
  if (!active) return `${mission.initialObjective}: ${destroyedCount} / ${mission.targets.length}`;
  const isDestroyPhase =
    active.type === 'DESTROY_ALL' ||
    active.type === 'DESTROY_WEAK_POINTS' ||
    active.type === 'ELIMINATE_BOSS';
  if (isDestroyPhase) {
    return `${active.hudText}: ${destroyedCount} / ${active.totalCount ?? mission.targets.length}`;
  }
  return active.hudText;
}

/**
 * Return the active ObjectivePhaseDefinition for a multi-stage objective.
 * Returns null when the objective has no authored phases (single-phase).
 * The phase index is clamped to the valid range.
 */
export function getActivePhase(
  objective: ObjectiveDefinition,
  phaseIndex: number,
): ObjectivePhaseDefinition | null {
  if (!objective.phases?.length) return null;
  const clamped = Math.max(0, Math.min(phaseIndex, objective.phases.length - 1));
  return objective.phases[clamped] ?? null;
}

export function isMissionUnlocked(mission: MissionDefinition, progress: CampaignProgress) {
  if (DEV_UNLOCK_PROTOTYPES) {
    const arc = CAMPAIGN_ARCS.find(a => a.label === mission.campaignArc);
    if (arc?.status === 'PLANNED') return true;
  }
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

function normalizeInventory(raw: unknown): PlayerInventory {
  const stored = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  const parts = typeof stored['parts'] === 'number' && Number.isFinite(stored['parts'])
    ? Math.max(0, Math.floor(stored['parts']))
    : DEFAULT_PLAYER_INVENTORY.parts;
  const unlockedWeaponIds = Array.isArray(stored['unlockedWeaponIds'])
    ? Array.from(new Set([
        ...DEFAULT_PLAYER_INVENTORY.unlockedWeaponIds,
        ...(stored['unlockedWeaponIds'] as unknown[]).filter((id): id is string => typeof id === 'string'),
      ]))
    : [...DEFAULT_PLAYER_INVENTORY.unlockedWeaponIds];
  const rawEquipped = stored['equippedWeaponIds'] && typeof stored['equippedWeaponIds'] === 'object'
    ? stored['equippedWeaponIds'] as Record<string, unknown>
    : {};
  const equippedWeaponIds: PlayerInventory['equippedWeaponIds'] = {};
  const validSlots = ['PRIMARY', 'SECONDARY'] as const;
  for (const slot of validSlots) {
    const val = rawEquipped[slot];
    if (typeof val === 'string' && unlockedWeaponIds.includes(val)) {
      equippedWeaponIds[slot] = val as PlayerInventory['equippedWeaponIds'][typeof slot];
    } else if (slot === 'PRIMARY') {
      equippedWeaponIds[slot] = DEFAULT_PLAYER_INVENTORY.equippedWeaponIds.PRIMARY;
    }
  }
  const rawLevels = stored['upgradeLevels'] && typeof stored['upgradeLevels'] === 'object'
    ? stored['upgradeLevels'] as Record<string, unknown>
    : {};
  const upgradeLevels: Record<string, number> = {};
  for (const [key, val] of Object.entries(rawLevels)) {
    if (typeof val === 'number' && Number.isFinite(val) && val > 0) {
      upgradeLevels[key] = Math.floor(val);
    }
  }
  return { parts, unlockedWeaponIds, equippedWeaponIds, upgradeLevels };
}

export function normalizeCampaignProgress(
  stored: Partial<CampaignProgress> | null | undefined,
  missions: MissionDefinition[],
): CampaignProgress {
  const storedVersion = typeof stored?.saveVersion === 'number' ? stored.saveVersion : 0;
  // v0 -> v1: no structural data change; version stamp is added below.
  // v1 -> v2 (Stage 7a): inventory field added; absent field is populated from DEFAULT_PLAYER_INVENTORY.
  // Add version-ordered migration blocks here when future CampaignProgress schemas change.
  void storedVersion;

  const missionIds = new Set(missions.map(mission => mission.id));
  const validRanks = new Set(['S', 'A', 'B', 'C']);
  const completedMissionIds = Array.from(new Set(stringArray(stored?.completedMissionIds).filter(id => missionIds.has(id))));
  const completedMissionIdSet = new Set(completedMissionIds);
  const unlockedFromCompleted = missions
    .filter(mission => mission.unlockAfterMissionId && completedMissionIdSet.has(mission.unlockAfterMissionId))
    .map(mission => mission.id);
  const unlockedMissionIds = Array.from(new Set([
    ...DEFAULT_CAMPAIGN_PROGRESS.unlockedMissionIds,
    ...stringArray(stored?.unlockedMissionIds).filter(id => missionIds.has(id)),
    ...completedMissionIds,
    ...unlockedFromCompleted,
  ]));

  const bestMissionTimes = Object.fromEntries(
    Object.entries(stored?.bestMissionTimes ?? {}).filter(([id, value]) => missionIds.has(id) && typeof value === 'number' && Number.isFinite(value) && value > 0)
  );
  const bestMissionScores = Object.fromEntries(
    Object.entries(stored?.bestMissionScores ?? {}).filter(([id, value]) => missionIds.has(id) && typeof value === 'number' && Number.isFinite(value) && value >= 0)
  );
  const bestMissionRanks = Object.fromEntries(
    Object.entries(stored?.bestMissionRanks ?? {}).filter(([id, value]) => missionIds.has(id) && typeof value === 'string' && validRanks.has(value))
  ) as CampaignProgress['bestMissionRanks'];

  return {
    saveVersion: CAMPAIGN_SAVE_VERSION,
    unlockedMissionIds,
    completedMissionIds,
    bestMissionTimes,
    bestMissionScores,
    bestMissionRanks,
    earnedRewardIds: Array.from(new Set([
      ...stringArray(stored?.earnedRewardIds),
      ...missions.filter(mission => completedMissionIdSet.has(mission.id)).map(mission => mission.reward.id),
    ])),
    inventory: normalizeInventory(stored?.inventory),
  } satisfies CampaignProgress;
}

export function getMissionStatus(mission: MissionDefinition, progress: CampaignProgress) {
  if (progress.completedMissionIds.includes(mission.id)) return 'CLEARED';
  if (isMissionUnlocked(mission, progress)) return 'READY';
  return 'LOCKED';
}

/**
 * Evaluate a set of bonus conditions against final mission stats.
 * Returns the ids of satisfied conditions and the total bonus score.
 * AVOID_HAZARD and PRESERVE_ALLY require an event accumulator from Stage 2e event hooks.
 */
export function evaluateBonusConditions(
  conditions: BonusCondition[],
  stats: { elapsedMs: number; health: number; targetsDestroyed: number },
  accumulator?: MissionEventAccumulator,
): { earnedIds: string[]; totalBonus: number } {
  if (!conditions.length) return { earnedIds: [], totalBonus: 0 };
  const earnedIds: string[] = [];
  let totalBonus = 0;
  for (const cond of conditions) {
    let earned = false;
    switch (cond.type) {
      case 'TIME_THRESHOLD':
        earned = cond.goalValue !== undefined && stats.elapsedMs <= cond.goalValue;
        break;
      case 'HULL_THRESHOLD':
        earned = cond.goalValue !== undefined && stats.health >= cond.goalValue;
        break;
      case 'DESTROY_OPTIONAL':
        earned = cond.goalValue !== undefined && stats.targetsDestroyed >= cond.goalValue;
        break;
      case 'AVOID_HAZARD':
        // Earned when the player never entered any hazard zone this mission.
        earned = accumulator ? accumulator.hazardContactIds.size === 0 : false;
        break;
      case 'PRESERVE_ALLY':
        // Earned when no ally was lost this mission.
        earned = accumulator ? accumulator.alliesLost === 0 : false;
        break;
      default:
        earned = false;
    }
    if (earned) {
      earnedIds.push(cond.id);
      totalBonus += cond.scoreBonus;
    }
  }
  return { earnedIds, totalBonus };
}

/**
 * Build a serializable snapshot of all objective states for the React UI.
 * Safe to store in React state — contains no Three.js refs or mutable sim objects.
 */
export function buildObjectiveSnapshot(
  mission: MissionDefinition,
  destroyedCount: number,
  completedObjectiveIds: Set<string>,
  bonusConditionsEarned: string[] = [],
  phaseIndices: Map<string, number> = new Map(),
): MissionObjectiveSnapshot {
  const set = mission.objectiveSet ?? buildObjectiveSet(mission);
  const activeObjective = getActiveObjective(mission, destroyedCount);

  const primaryObjectives: ObjectiveRuntimeState[] = set.primary.map(obj => {
    const isDestroyPhase =
      obj.type === 'DESTROY_ALL' || obj.type === 'DESTROY_WEAK_POINTS' || obj.type === 'ELIMINATE_BOSS';
    const totalCount = obj.totalCount ?? mission.targets.length;
    return {
      id: obj.id,
      label: obj.label,
      hudText: obj.hudText,
      completed: completedObjectiveIds.has(obj.id),
      failed: false,
      optional: obj.optional ?? false,
      currentCount: isDestroyPhase ? Math.min(destroyedCount, totalCount) : undefined,
      totalCount: isDestroyPhase ? totalCount : undefined,
      activePhaseIndex: obj.phases?.length ? (phaseIndices.get(obj.id) ?? 0) : undefined,
      totalPhases: obj.phases?.length ?? undefined,
    };
  });

  const optionalObjectives: ObjectiveRuntimeState[] = (set.optional ?? []).map(obj => ({
    id: obj.id,
    label: obj.label,
    hudText: obj.hudText,
    completed: completedObjectiveIds.has(obj.id),
    failed: false,
    optional: true,
    currentCount: undefined,
    totalCount: undefined,
    activePhaseIndex: obj.phases?.length ? (phaseIndices.get(obj.id) ?? 0) : undefined,
    totalPhases: obj.phases?.length ?? undefined,
  }));

  return {
    primaryObjectives,
    optionalObjectives,
    activeObjectiveId: activeObjective?.id ?? null,
    bonusConditionsEarned,
  };
}

export function calculateMissionResult(mission: MissionDefinition, stats: MissionCompletionStats): MissionCompletionResult {
  const timeRatio = Math.max(0, 1 - stats.elapsedMs / mission.scoring.parTimeMs);
  const setPieceScore = stats.setPieceStats
    ? Math.round(
        stats.setPieceStats.componentsDestroyed * (mission.scoring.setPieceComponentBonus ?? 0) +
        stats.setPieceStats.phasesCompleted * (mission.scoring.setPiecePhaseBonus ?? 0) +
        stats.setPieceStats.optionalComponentsDestroyed * (mission.scoring.setPieceOptionalComponentBonus ?? 0)
      )
    : 0;
  const score = Math.round(
    mission.scoring.baseScore +
    stats.targetsDestroyed * mission.scoring.targetBonus +
    stats.enemiesDestroyed * mission.scoring.enemyBonus +
    Math.max(0, stats.health) * mission.scoring.healthBonus +
    timeRatio * mission.scoring.timeBonus +
    setPieceScore +
    (stats.bonusScore ?? 0)
  );

  const rank = score >= mission.scoring.rankThresholds.S
    ? 'S'
    : score >= mission.scoring.rankThresholds.A
      ? 'A'
      : score >= mission.scoring.rankThresholds.B
        ? 'B'
        : 'C';

  // Stage 7d: rank-based parts + 5 per bonus condition earned
  const rankPartsBase = rank === 'S' ? 50 : rank === 'A' ? 30 : rank === 'B' ? 20 : 10;
  const partsEarned = rankPartsBase + (stats.bonusConditionsEarned?.length ?? 0) * 5;

  return {
    ...stats,
    setPieceScore,
    score,
    rank,
    reward: mission.reward,
    partsEarned,
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

  // Stage 7d: accumulate earned parts into the player inventory on every completion
  const updatedInventory = progress.inventory
    ? { ...progress.inventory, parts: progress.inventory.parts + result.partsEarned }
    : progress.inventory;

  return {
    ...progress,
    unlockedMissionIds,
    completedMissionIds,
    earnedRewardIds,
    inventory: updatedInventory,
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
