import type {
  AtmosphereDefinition,
  BiomeDefinition,
  BiomeId,
  LevelKitId,
  MissionEnvironmentDefinition,
} from '../types/game';

// ---------------------------------------------------------------------------
// Biome registry (Stage 3a)
// ---------------------------------------------------------------------------
// Each BiomeDefinition holds the spatial / color identity of a biome and a
// defaultAtmosphere that represents its canonical lighting.  Future stages add
// TimeOfDayPreset and WeatherDefinition objects that override the atmosphere
// via composeEnvironment().

export const BIOMES: Record<BiomeId, BiomeDefinition> = {
  'night-grid': {
    id: 'night-grid',
    label: 'Night Grid',
    gridColor: 0xf27d26,
    surfaceColor: 0x080808,
    structureColor: 0x0e1016,
    plateauColor: 0x0c0c0e,
    beaconPalette: { primary: 0xf27d26, secondary: 0x00ffff, warning: 0xff2a2a, extraction: 0x00ffff },
    floorMaterial: { color: 0x0c0b09, roughness: 0.32, metalness: 0.50 },
    gridProfile: {
      color: 0xf27d26,
      opacity: 0.025,
      size: 3000,
      divisions: 300,
      y: -0.5,
      majorDivisions: 60,
      majorOpacity: 0.072,
      minorOpacity: 0.025,
    },
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
    defaultAtmosphere: {
      skyColor: 0x030407,
      fogColor: 0x050609,
      fogNear: 30,
      fogFar: 620,
      skyDepth: {
        topColor: 0x010309,
        horizonColor: 0x1e2e3c,
        bottomColor: 0x020506,
        hazeColor: 0x455f72,
        horizonIntensity: 0.92,
        hazeOpacity: 0.28,
      },
      fogProfile: { color: 0x0c1820, near: 56, far: 800 },
      ambientLight: { color: 0xc8d8ee, intensity: 0.58 },
      sunLight: { color: 0xffffff, intensity: 0.70, position: [50, 100, 50] },
    },
  },

  'ash-ridge': {
    id: 'ash-ridge',
    label: 'Ash Ridge',
    gridColor: 0xffaa3d,
    surfaceColor: 0x0b0907,
    structureColor: 0x120f0b,
    plateauColor: 0x17130f,
    beaconPalette: { primary: 0xffaa3d, secondary: 0x00d7ff, warning: 0xff3a2a, extraction: 0x00ffff },
    floorMaterial: { color: 0x0d0b09, roughness: 0.34, metalness: 0.48 },
    gridProfile: {
      color: 0xffaa3d,
      opacity: 0.022,
      size: 3000,
      divisions: 300,
      y: -0.5,
      majorDivisions: 60,
      majorOpacity: 0.066,
      minorOpacity: 0.022,
    },
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
    defaultAtmosphere: {
      skyColor: 0x050404,
      fogColor: 0x090706,
      fogNear: 45,
      fogFar: 760,
      skyDepth: {
        topColor: 0x060304,
        horizonColor: 0x2f2418,
        bottomColor: 0x080504,
        hazeColor: 0x685446,
        horizonIntensity: 0.82,
        hazeOpacity: 0.24,
      },
      fogProfile: { color: 0x140e0a, near: 58, far: 900 },
      ambientLight: { color: 0xffd8b8, intensity: 0.50 },
      sunLight: { color: 0xffb46a, intensity: 0.95, position: [-80, 120, 40] },
    },
  },

  // ---------------------------------------------------------------------------
  // Stage 3e: New Biome Kits
  // ---------------------------------------------------------------------------

  'storm-coast': {
    id: 'storm-coast',
    label: 'Storm Coast',
    gridColor: 0x00c8d4,
    surfaceColor: 0x060808,
    structureColor: 0x0a1012,
    plateauColor: 0x0c1214,
    beaconPalette: { primary: 0x00c8d4, secondary: 0xffee00, warning: 0xff3030, extraction: 0x00ffff },
    floorMaterial: { color: 0x080a0a, roughness: 0.28, metalness: 0.55 },
    gridProfile: {
      color: 0x00c8d4,
      opacity: 0.020,
      size: 3000,
      divisions: 300,
      y: -0.5,
      majorDivisions: 60,
      majorOpacity: 0.065,
      minorOpacity: 0.022,
    },
    landmarkStyle: 'buoys',
    landmarkCount: 45,
    plateauCount: 18,
    boundaryRadius: 1600,
    structureKit: {
      archetypes: ['platform-cluster', 'gantry', 'antenna-array', 'beacon-mast', 'perimeter-light', 'pylon'],
      minDist: 300,
      maxDist: 700,
    },
    hazards: [
      {
        id: 'storm-surge-north',
        label: 'Storm Surge',
        message: 'STORM SURGE — BRACE SHIELD',
        position: [0, 0, -520],
        radius: 220,
        color: 0x00aac8,
        shieldDrainPerSecond: 3,
        energyDrainPerSecond: 4,
      },
      {
        id: 'storm-surge-south',
        label: 'Storm Surge',
        message: 'STORM SURGE — BRACE SHIELD',
        position: [380, 0, 440],
        radius: 190,
        color: 0x00aac8,
        shieldDrainPerSecond: 3,
        energyDrainPerSecond: 4,
      },
    ],
    defaultAtmosphere: {
      skyColor: 0x050a0e,
      fogColor: 0x08101a,
      fogNear: 28,
      fogFar: 450,
      skyDepth: {
        topColor: 0x030608,
        horizonColor: 0x0f2233,
        bottomColor: 0x050a0e,
        hazeColor: 0x1e4460,
        horizonIntensity: 1.05,
        hazeOpacity: 0.38,
      },
      fogProfile: { color: 0x0a1c2c, near: 40, far: 580 },
      ambientLight: { color: 0xb8d4e8, intensity: 0.48 },
      sunLight: { color: 0xc0d8f0, intensity: 0.55, position: [40, 90, -60] },
    },
  },

  'arctic-shelf': {
    id: 'arctic-shelf',
    label: 'Arctic Shelf',
    gridColor: 0x7ecfff,
    surfaceColor: 0x090b0f,
    structureColor: 0x10141c,
    plateauColor: 0x12161e,
    beaconPalette: { primary: 0x7ecfff, secondary: 0xffffff, warning: 0xff3a3a, extraction: 0xaaeeff },
    floorMaterial: { color: 0x0c0e12, roughness: 0.20, metalness: 0.55 },
    gridProfile: {
      color: 0x7ecfff,
      opacity: 0.022,
      size: 3000,
      divisions: 300,
      y: -0.5,
      majorDivisions: 60,
      majorOpacity: 0.068,
      minorOpacity: 0.022,
    },
    landmarkStyle: 'ice-formations',
    landmarkCount: 45,
    plateauCount: 18,
    boundaryRadius: 1800,
    structureKit: {
      archetypes: ['platform-cluster', 'compound', 'antenna-array', 'beacon-mast', 'pylon'],
      minDist: 310,
      maxDist: 760,
    },
    hazards: [
      {
        id: 'cryo-field-west',
        label: 'Cryo Field',
        message: 'CRYO FIELD — ENERGY DRAINING',
        position: [-500, 0, 150],
        radius: 200,
        color: 0x4ab8ff,
        shieldDrainPerSecond: 0,
        energyDrainPerSecond: 5,
      },
      {
        id: 'cryo-field-east',
        label: 'Cryo Field',
        message: 'CRYO FIELD — ENERGY DRAINING',
        position: [460, 0, -320],
        radius: 170,
        color: 0x4ab8ff,
        shieldDrainPerSecond: 0,
        energyDrainPerSecond: 5,
      },
    ],
    defaultAtmosphere: {
      skyColor: 0x060810,
      fogColor: 0x0a0e18,
      fogNear: 35,
      fogFar: 500,
      skyDepth: {
        topColor: 0x04060c,
        horizonColor: 0x1a2840,
        bottomColor: 0x060810,
        hazeColor: 0x3060a0,
        horizonIntensity: 0.78,
        hazeOpacity: 0.30,
      },
      fogProfile: { color: 0x0c1830, near: 50, far: 650 },
      ambientLight: { color: 0xd0e8ff, intensity: 0.62 },
      sunLight: { color: 0xe0f0ff, intensity: 0.72, position: [0, 60, 120] },
    },
  },

  'ocean-platform': {
    id: 'ocean-platform',
    label: 'Ocean Platform',
    gridColor: 0x0090ff,
    surfaceColor: 0x050810,
    structureColor: 0x090d16,
    plateauColor: 0x0b101a,
    beaconPalette: { primary: 0x0090ff, secondary: 0xffdd00, warning: 0xff2020, extraction: 0x00ffff },
    floorMaterial: { color: 0x06090f, roughness: 0.15, metalness: 0.65 },
    gridProfile: {
      color: 0x0090ff,
      opacity: 0.023,
      size: 3000,
      divisions: 300,
      y: -0.5,
      majorDivisions: 60,
      majorOpacity: 0.070,
      minorOpacity: 0.023,
    },
    landmarkStyle: 'platforms',
    landmarkCount: 25,
    plateauCount: 5,
    boundaryRadius: 2000,
    structureKit: {
      archetypes: ['platform-cluster', 'gantry', 'antenna-array', 'beacon-mast', 'perimeter-light'],
      minDist: 350,
      maxDist: 800,
    },
    hazards: [
      {
        id: 'sea-surge-central',
        label: 'Sea Surge',
        message: 'SEA SURGE — SHIELD COMPROMISED',
        position: [0, 0, 0],
        radius: 160,
        color: 0x0066ff,
        shieldDrainPerSecond: 2,
        energyDrainPerSecond: 0,
      },
    ],
    defaultAtmosphere: {
      skyColor: 0x04060e,
      fogColor: 0x070a18,
      fogNear: 42,
      fogFar: 600,
      skyDepth: {
        topColor: 0x020408,
        horizonColor: 0x0c2040,
        bottomColor: 0x040610,
        hazeColor: 0x183060,
        horizonIntensity: 0.85,
        hazeOpacity: 0.32,
      },
      fogProfile: { color: 0x081228, near: 65, far: 780 },
      ambientLight: { color: 0xb0c8e8, intensity: 0.52 },
      sunLight: { color: 0xd0e8ff, intensity: 0.80, position: [60, 120, 30] },
    },
  },

  'urban-ruin': {
    id: 'urban-ruin',
    label: 'Urban Ruin',
    gridColor: 0xff5520,
    surfaceColor: 0x0a0806,
    structureColor: 0x170e0a,
    plateauColor: 0x1a110d,
    beaconPalette: { primary: 0xff5520, secondary: 0xffdd00, warning: 0xff2020, extraction: 0xff8040 },
    floorMaterial: { color: 0x0e0a07, roughness: 0.45, metalness: 0.30 },
    gridProfile: {
      color: 0xff5520,
      opacity: 0.024,
      size: 3000,
      divisions: 300,
      y: -0.5,
      majorDivisions: 60,
      majorOpacity: 0.072,
      minorOpacity: 0.024,
    },
    landmarkStyle: 'ruins',
    landmarkCount: 60,
    plateauCount: 25,
    boundaryRadius: 1400,
    structureKit: {
      archetypes: ['compound', 'platform-cluster', 'pylon', 'antenna-array', 'beacon-mast', 'monolith'],
      minDist: 260,
      maxDist: 640,
    },
    hazards: [
      {
        id: 'fire-zone-west',
        label: 'Fire Zone',
        message: 'FIRE ZONE — SYSTEMS OVERHEATING',
        position: [-350, 0, 200],
        radius: 170,
        color: 0xff4408,
        shieldDrainPerSecond: 4,
        energyDrainPerSecond: 3,
      },
      {
        id: 'fire-zone-east',
        label: 'Fire Zone',
        message: 'FIRE ZONE — SYSTEMS OVERHEATING',
        position: [500, 0, -180],
        radius: 140,
        color: 0xff4408,
        shieldDrainPerSecond: 4,
        energyDrainPerSecond: 3,
      },
    ],
    defaultAtmosphere: {
      skyColor: 0x0c0603,
      fogColor: 0x160b05,
      fogNear: 22,
      fogFar: 400,
      skyDepth: {
        topColor: 0x0a0402,
        horizonColor: 0x402010,
        bottomColor: 0x0c0604,
        hazeColor: 0x803418,
        horizonIntensity: 1.12,
        hazeOpacity: 0.42,
      },
      fogProfile: { color: 0x1c0e06, near: 35, far: 520 },
      ambientLight: { color: 0xffc090, intensity: 0.56 },
      sunLight: { color: 0xff7830, intensity: 1.10, position: [-60, 100, 60] },
    },
  },
};

// ---------------------------------------------------------------------------
// Registry helpers
// ---------------------------------------------------------------------------

export function getBiome(id: BiomeId): BiomeDefinition {
  return BIOMES[id];
}

/**
 * Compose a MissionEnvironmentDefinition from a biome and an optional atmosphere override.
 * When atmosphere is absent the biome's defaultAtmosphere is used, preserving the
 * biome's canonical appearance.
 * When a TimeOfDayPreset or WeatherDefinition is available (Stage 3b/3d), pass its
 * atmosphere here to override sky, fog, and lighting while keeping biome spatial identity.
 */
export function composeEnvironment(
  biome: BiomeDefinition,
  atmosphere?: AtmosphereDefinition,
  levelKitId?: LevelKitId,
): MissionEnvironmentDefinition {
  const atm = atmosphere ?? biome.defaultAtmosphere;
  return {
    id: biome.id,
    levelKitId,
    label: biome.label,
    skyColor: atm.skyColor,
    fogColor: atm.fogColor,
    fogNear: atm.fogNear,
    fogFar: atm.fogFar,
    surfaceColor: biome.surfaceColor,
    gridColor: biome.gridColor,
    structureColor: biome.structureColor,
    plateauColor: biome.plateauColor,
    skyDepth: atm.skyDepth,
    fogProfile: atm.fogProfile,
    floorMaterial: biome.floorMaterial,
    gridProfile: biome.gridProfile,
    beaconPalette: biome.beaconPalette,
    ambientLight: atm.ambientLight,
    sunLight: atm.sunLight,
    landmarkStyle: biome.landmarkStyle,
    landmarkCount: biome.landmarkCount,
    plateauCount: biome.plateauCount,
    boundaryRadius: biome.boundaryRadius,
    structureKit: biome.structureKit,
    hazards: biome.hazards,
  };
}

/**
 * Compatibility helper: compose a MissionEnvironmentDefinition directly from a BiomeId.
 * Uses the biome's defaultAtmosphere. Pass an optional atmosphere to override lighting.
 */
export function getBiomeEnvironment(
  biomeId: BiomeId,
  atmosphere?: AtmosphereDefinition,
  levelKitId?: LevelKitId,
): MissionEnvironmentDefinition {
  return composeEnvironment(BIOMES[biomeId], atmosphere, levelKitId);
}
