import type {
  LevelKitDefinition,
  LevelKitId,
  MissionDefinition,
  MissionEnvironmentDefinition,
  MissionTargetDefinition,
  MissionWeakPointDefinition,
  TargetWeakPointLayoutId,
} from '../types/game';

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
};

export const LEVEL_KITS: Record<LevelKitId, LevelKitDefinition> = {
  'night-grid': {
    id: 'night-grid',
    label: 'Night Grid',
    arenaKit: 'cinematic-black-grid',
    waypointStyle: 'signal-array',
    defaultTarget: { archetype: 'tower', weakPointLayoutId: 'radar-array' },
    environment: {
      id: 'night-grid',
      levelKitId: 'night-grid',
      label: 'Night Grid',
      skyColor: 0x030407,
      fogColor: 0x050609,
      fogNear: 30,
      fogFar: 620,
      surfaceColor: 0x080808,
      gridColor: 0xf27d26,
      structureColor: 0x0e1016,
      plateauColor: 0x0c0c0e,
      skyDepth: {
        topColor: 0x010309,
        horizonColor: 0x1e2e3c,
        bottomColor: 0x020506,
        hazeColor: 0x455f72,
        horizonIntensity: 0.92,
        hazeOpacity: 0.28,
      },
      fogProfile: { color: 0x0c1820, near: 56, far: 800 },
      floorMaterial: { color: 0x0c0b09, roughness: 0.32, metalness: 0.50 },
      gridProfile: { color: 0xf27d26, opacity: 0.025, size: 3000, divisions: 300, y: -0.5, majorDivisions: 60, majorOpacity: 0.072, minorOpacity: 0.025 },
      beaconPalette: { primary: 0xf27d26, secondary: 0x00ffff, warning: 0xff2a2a, extraction: 0x00ffff },
      ambientLight: { color: 0xc8d8ee, intensity: 0.58 },
      sunLight: { color: 0xffffff, intensity: 0.70, position: [50, 100, 50] },
      landmarkStyle: 'monoliths',
      landmarkCount: 68,
      plateauCount: 15,
      boundaryRadius: 1500,
      structureKit: {
        archetypes: ['monolith', 'platform-cluster', 'gantry', 'antenna-array', 'beacon-mast', 'perimeter-light'],
        minDist: 285,
        maxDist: 680,
      },
      hazards: [],
    },
  },
  'ash-ridge': {
    id: 'ash-ridge',
    label: 'Ash Ridge',
    arenaKit: 'cinematic-ash-grid',
    waypointStyle: 'ash-relay',
    defaultTarget: { archetype: 'relay-spire', weakPointLayoutId: 'relay-core' },
    environment: {
      id: 'ash-ridge',
      levelKitId: 'ash-ridge',
      label: 'Ash Ridge',
      skyColor: 0x050404,
      fogColor: 0x090706,
      fogNear: 45,
      fogFar: 760,
      surfaceColor: 0x0b0907,
      gridColor: 0xffaa3d,
      structureColor: 0x120f0b,
      plateauColor: 0x17130f,
      skyDepth: {
        topColor: 0x060304,
        horizonColor: 0x2f2418,
        bottomColor: 0x080504,
        hazeColor: 0x685446,
        horizonIntensity: 0.82,
        hazeOpacity: 0.24,
      },
      fogProfile: { color: 0x140e0a, near: 58, far: 900 },
      floorMaterial: { color: 0x0d0b09, roughness: 0.34, metalness: 0.48 },
      gridProfile: { color: 0xffaa3d, opacity: 0.022, size: 3000, divisions: 300, y: -0.5, majorDivisions: 60, majorOpacity: 0.066, minorOpacity: 0.022 },
      beaconPalette: { primary: 0xffaa3d, secondary: 0x00d7ff, warning: 0xff3a2a, extraction: 0x00ffff },
      ambientLight: { color: 0xffd8b8, intensity: 0.50 },
      sunLight: { color: 0xffb46a, intensity: 0.95, position: [-80, 120, 40] },
      landmarkStyle: 'ridges',
      landmarkCount: 50,
      plateauCount: 22,
      boundaryRadius: 1700,
      structureKit: {
        archetypes: ['compound', 'platform-cluster', 'pylon', 'antenna-array', 'beacon-mast', 'perimeter-light'],
        minDist: 320,
        maxDist: 740,
      },
      hazards: [
        {
          id: 'ash-static-west',
          label: 'Ash Static',
          message: 'ASH STATIC DRAINING SYSTEMS',
          position: [-420, 0, 180],
          radius: 180,
          color: 0xff6a2a,
          shieldDrainPerSecond: 5,
          energyDrainPerSecond: 7,
        },
        {
          id: 'ash-static-east',
          label: 'Ash Static',
          message: 'ASH STATIC DRAINING SYSTEMS',
          position: [610, 0, -260],
          radius: 150,
          color: 0xff6a2a,
          shieldDrainPerSecond: 4,
          energyDrainPerSecond: 6,
        },
      ],
    },
  },
};

export type MissionConfig = Omit<MissionDefinition, 'environment'> & {
  levelKitId?: LevelKitId;
  environment?: MissionEnvironmentDefinition;
  useLevelKitTargetDefaults?: boolean;
  targetDefaults?: Partial<Pick<MissionTargetDefinition, 'archetype' | 'weakPoints'>> & {
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
  const weakPointLayoutId = config.targetDefaults?.weakPointLayoutId ?? kitDefaults?.weakPointLayoutId;
  const weakPoints = target.weakPoints ?? config.targetDefaults?.weakPoints ?? (config.useLevelKitTargetDefaults && weakPointLayoutId ? resolveWeakPointLayout(weakPointLayoutId) : undefined);

  return {
    ...target,
    archetype,
    weakPoints,
  };
}

export function defineMission(config: MissionConfig): MissionDefinition {
  const levelKitId = config.levelKitId ?? config.environment?.levelKitId;
  const levelKitEnvironment = levelKitId ? resolveLevelKitEnvironment(levelKitId) : undefined;
  const environment = config.environment ?? levelKitEnvironment;

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
