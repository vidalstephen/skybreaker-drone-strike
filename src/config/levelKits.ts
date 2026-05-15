import type {
  BiomeId,
  LevelKitDefinition,
  LevelKitId,
  MissionDefinition,
  MissionEnvironmentDefinition,
  MissionTargetDefinition,
  MissionWeakPointDefinition,
  TargetWeakPointLayoutId,
} from '../types/game';
import { BIOMES, composeEnvironment } from './biomes';
import { getAtmosphereForTimeOfDay } from './timeOfDay';

export const TARGET_WEAK_POINT_LAYOUTS: Record<TargetWeakPointLayoutId, MissionWeakPointDefinition[]> = {
  'radar-array': [
    { id: 'array-left', label: 'Left Array', offset: [-7, 44, 0], health: 50, radius: 13, required: true },
    { id: 'array-right', label: 'Right Array', offset: [7, 44, 0], health: 50, radius: 13, required: true },
  ],
  'relay-core': [
    { id: 'relay-core', label: 'Relay Core', offset: [0, 38, 7], health: 45, radius: 12, required: true },
    { id: 'upper-node', label: 'Upper Node', offset: [0, 64, -6], health: 45, radius: 12, required: true },
    { id: 'stabilizer', label: 'Stabilizer', offset: [8, 24, 0], health: 35, radius: 11, required: true },
  ],
  // Stage 5e: patrol craft vitals
  'patrol-craft-vitals': [
    { id: 'radar-mast', label: 'Radar Mast', offset: [0, 14, -4], health: 40, radius: 10, required: false },
    { id: 'engine-pod', label: 'Engine Pod', offset: [0, 2, 16], health: 60, radius: 12, required: true },
  ],
};

export const LEVEL_KITS: Record<LevelKitId, LevelKitDefinition> = {
  'night-grid': {
    id: 'night-grid',
    label: 'Night Grid',
    arenaKit: 'cinematic-black-grid',
    waypointStyle: 'signal-array',
    defaultTarget: { archetype: 'tower', setPieceArchetypeId: 'radar-network', weakPointLayoutId: 'radar-array' },
    environment: composeEnvironment(BIOMES['night-grid'], undefined, 'night-grid'),
  },
  'ash-ridge': {
    id: 'ash-ridge',
    label: 'Ash Ridge',
    arenaKit: 'cinematic-ash-grid',
    waypointStyle: 'ash-relay',
    defaultTarget: { archetype: 'relay-spire', setPieceArchetypeId: 'shield-generator', weakPointLayoutId: 'relay-core' },
    environment: composeEnvironment(BIOMES['ash-ridge'], undefined, 'ash-ridge'),
  },
  // Stage 5e: ocean platform kit — sea-surface arena for naval combat
  'ocean-platform': {
    id: 'ocean-platform',
    label: 'Ocean Platform',
    arenaKit: 'cinematic-ocean-grid',
    waypointStyle: 'ocean-buoys',
    defaultTarget: { archetype: 'patrol-craft' },
    environment: composeEnvironment(BIOMES['ocean-platform'], undefined, 'ocean-platform'),
  },
};

export type MissionConfig = Omit<MissionDefinition, 'environment'> & {
  levelKitId?: LevelKitId;
  environment?: MissionEnvironmentDefinition;
  useLevelKitTargetDefaults?: boolean;
  targetDefaults?: Partial<Pick<MissionTargetDefinition, 'archetype' | 'setPieceArchetypeId' | 'weakPoints'>> & {
    weakPointLayoutId?: TargetWeakPointLayoutId;
  };
};

export function getLevelKit(levelKitId: LevelKitId): LevelKitDefinition {
  return LEVEL_KITS[levelKitId];
}

export function resolveLevelKitEnvironment(levelKitId: LevelKitId): MissionEnvironmentDefinition {
  return getLevelKit(levelKitId).environment;
}

export function resolveWeakPointLayout(layoutId: TargetWeakPointLayoutId): MissionWeakPointDefinition[] {
  return TARGET_WEAK_POINT_LAYOUTS[layoutId];
}

function applyTargetDefaults(target: MissionTargetDefinition, config: MissionConfig): MissionTargetDefinition {
  const levelKit = config.levelKitId ? getLevelKit(config.levelKitId) : undefined;
  const kitDefaults = config.useLevelKitTargetDefaults ? levelKit?.defaultTarget : undefined;
  const archetype = target.archetype ?? config.targetDefaults?.archetype ?? kitDefaults?.archetype;
  const setPieceArchetypeId = target.setPieceArchetypeId ?? config.targetDefaults?.setPieceArchetypeId ?? kitDefaults?.setPieceArchetypeId;
  const weakPointLayoutId = config.targetDefaults?.weakPointLayoutId ?? kitDefaults?.weakPointLayoutId;
  const weakPoints = target.weakPoints ?? config.targetDefaults?.weakPoints ?? (config.useLevelKitTargetDefaults && weakPointLayoutId ? resolveWeakPointLayout(weakPointLayoutId) : undefined);

  return {
    ...target,
    archetype,
    setPieceArchetypeId,
    weakPoints,
  };
}

export function defineMission(config: MissionConfig): MissionDefinition {
  const levelKitId = config.levelKitId ?? config.environment?.levelKitId;

  let environment = config.environment;
  if (!environment && levelKitId) {
    const biome = BIOMES[levelKitId as BiomeId];
    const todAtmosphere =
      biome && config.timeOfDay
        ? getAtmosphereForTimeOfDay(biome.id, config.timeOfDay)
        : undefined;
    environment = biome
      ? composeEnvironment(biome, todAtmosphere, levelKitId)
      : resolveLevelKitEnvironment(levelKitId);
  }

  if (!environment) {
    throw new Error(`Mission ${config.id} is missing an environment or levelKitId.`);
  }

  const { targetDefaults, useLevelKitTargetDefaults, ...mission } = config;

  return {
    ...mission,
    levelKitId,
    environment,
    targets: config.targets.map(target => applyTargetDefaults(target, config)),
  };
}
