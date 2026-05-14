import type {
  AtmosphereDefinition,
  BiomeId,
  TimeOfDayId,
  TimeOfDayPreset,
} from '../types/game';

// ---------------------------------------------------------------------------
// Time-of-day preset registry (Stage 3b)
// ---------------------------------------------------------------------------
// Each TimeOfDayPreset holds per-biome AtmosphereDefinition overrides.
// composeEnvironment() uses these to override sky/fog/lighting while keeping
// the biome's spatial identity (grid, surface, structures, hazards) intact.
//
// Preset atmospheres for the "native" time of day of each biome exactly match
// that biome's defaultAtmosphere so existing missions produce identical output:
//   night-grid + night   → same as defaultAtmosphere
//   ash-ridge  + dusk    → same as defaultAtmosphere
//
// Dawn missions on ash-ridge (missions 6 and 8) get a distinct pre-sunrise
// atmosphere — this is an intentional visual change documented in Stage 3b.

const NIGHT_GRID_NIGHT: AtmosphereDefinition = {
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
};

const NIGHT_GRID_DAWN: AtmosphereDefinition = {
  skyColor: 0x060810,
  fogColor: 0x080b14,
  fogNear: 32,
  fogFar: 680,
  skyDepth: {
    topColor: 0x030508,
    horizonColor: 0x1e3055,
    bottomColor: 0x050708,
    hazeColor: 0x3a5878,
    horizonIntensity: 1.05,
    hazeOpacity: 0.30,
  },
  fogProfile: { color: 0x0a1628, near: 52, far: 880 },
  ambientLight: { color: 0xb8c8e0, intensity: 0.52 },
  sunLight: { color: 0xa0b8d0, intensity: 0.55, position: [120, 18, -90] },
};

const NIGHT_GRID_DUSK: AtmosphereDefinition = {
  skyColor: 0x050609,
  fogColor: 0x080a0e,
  fogNear: 28,
  fogFar: 600,
  skyDepth: {
    topColor: 0x030408,
    horizonColor: 0x28243a,
    bottomColor: 0x050608,
    hazeColor: 0x504860,
    horizonIntensity: 0.88,
    hazeOpacity: 0.26,
  },
  fogProfile: { color: 0x12101c, near: 50, far: 780 },
  ambientLight: { color: 0xc0b8e0, intensity: 0.55 },
  sunLight: { color: 0xdda080, intensity: 0.60, position: [-70, 35, 60] },
};

const NIGHT_GRID_DAY: AtmosphereDefinition = {
  skyColor: 0x0a0f18,
  fogColor: 0x0e1422,
  fogNear: 45,
  fogFar: 900,
  skyDepth: {
    topColor: 0x070c14,
    horizonColor: 0x243858,
    bottomColor: 0x0a0e18,
    hazeColor: 0x4a6888,
    horizonIntensity: 0.70,
    hazeOpacity: 0.18,
  },
  fogProfile: { color: 0x121a2e, near: 75, far: 1100 },
  ambientLight: { color: 0xd8e4f4, intensity: 0.82 },
  sunLight: { color: 0xffffff, intensity: 1.05, position: [20, 180, 20] },
};

const ASH_RIDGE_DUSK: AtmosphereDefinition = {
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
};

const ASH_RIDGE_DAWN: AtmosphereDefinition = {
  skyColor: 0x060402,
  fogColor: 0x0c0804,
  fogNear: 38,
  fogFar: 700,
  skyDepth: {
    topColor: 0x040302,
    horizonColor: 0x5e2e0e,
    bottomColor: 0x080502,
    hazeColor: 0x9e4c28,
    horizonIntensity: 1.18,
    hazeOpacity: 0.32,
  },
  fogProfile: { color: 0x180c06, near: 50, far: 860 },
  ambientLight: { color: 0xffc898, intensity: 0.44 },
  sunLight: { color: 0xff7428, intensity: 1.15, position: [130, 22, -80] },
};

const ASH_RIDGE_NIGHT: AtmosphereDefinition = {
  skyColor: 0x030202,
  fogColor: 0x060403,
  fogNear: 50,
  fogFar: 720,
  skyDepth: {
    topColor: 0x020101,
    horizonColor: 0x1c1008,
    bottomColor: 0x040202,
    hazeColor: 0x422e1e,
    horizonIntensity: 0.62,
    hazeOpacity: 0.19,
  },
  fogProfile: { color: 0x0c0804, near: 62, far: 840 },
  ambientLight: { color: 0xffc0a0, intensity: 0.34 },
  sunLight: { color: 0xff9040, intensity: 0.52, position: [-80, 80, 40] },
};

const ASH_RIDGE_DAY: AtmosphereDefinition = {
  skyColor: 0x100a06,
  fogColor: 0x180e08,
  fogNear: 58,
  fogFar: 1050,
  skyDepth: {
    topColor: 0x0e0804,
    horizonColor: 0x543a1e,
    bottomColor: 0x100906,
    hazeColor: 0x846040,
    horizonIntensity: 0.62,
    hazeOpacity: 0.16,
  },
  fogProfile: { color: 0x201408, near: 85, far: 1250 },
  ambientLight: { color: 0xfff0d8, intensity: 0.78 },
  sunLight: { color: 0xffcc80, intensity: 1.20, position: [0, 220, 0] },
};

// ---------------------------------------------------------------------------
// Stage 3e: Storm Coast atmospheres
// ---------------------------------------------------------------------------

const STORM_COAST_NIGHT: AtmosphereDefinition = {
  skyColor: 0x030608,
  fogColor: 0x060b10,
  fogNear: 22,
  fogFar: 380,
  skyDepth: {
    topColor: 0x020406,
    horizonColor: 0x0c1e2e,
    bottomColor: 0x040608,
    hazeColor: 0x183048,
    horizonIntensity: 1.10,
    hazeOpacity: 0.44,
  },
  fogProfile: { color: 0x081420, near: 32, far: 480 },
  ambientLight: { color: 0x90b8d0, intensity: 0.40 },
  sunLight: { color: 0x88a8c8, intensity: 0.38, position: [-40, 70, 80] },
};

const STORM_COAST_DAWN: AtmosphereDefinition = {
  skyColor: 0x050a10,
  fogColor: 0x08101c,
  fogNear: 26,
  fogFar: 420,
  skyDepth: {
    topColor: 0x030608,
    horizonColor: 0x102840,
    bottomColor: 0x05080e,
    hazeColor: 0x1e4862,
    horizonIntensity: 1.18,
    hazeOpacity: 0.42,
  },
  fogProfile: { color: 0x0a1a28, near: 36, far: 540 },
  ambientLight: { color: 0xa0c4e0, intensity: 0.44 },
  sunLight: { color: 0x90b8d8, intensity: 0.48, position: [110, 18, -70] },
};

const STORM_COAST_DUSK: AtmosphereDefinition = {
  skyColor: 0x05090c,
  fogColor: 0x080e14,
  fogNear: 25,
  fogFar: 420,
  skyDepth: {
    topColor: 0x030608,
    horizonColor: 0x102030,
    bottomColor: 0x040608,
    hazeColor: 0x1c3850,
    horizonIntensity: 0.98,
    hazeOpacity: 0.40,
  },
  fogProfile: { color: 0x0a1620, near: 34, far: 520 },
  ambientLight: { color: 0x9ab8d4, intensity: 0.42 },
  sunLight: { color: 0x80a8c8, intensity: 0.42, position: [-60, 30, 80] },
};

const STORM_COAST_DAY: AtmosphereDefinition = {
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
};

// ---------------------------------------------------------------------------
// Stage 3e: Arctic Shelf atmospheres
// ---------------------------------------------------------------------------

const ARCTIC_SHELF_NIGHT: AtmosphereDefinition = {
  skyColor: 0x030508,
  fogColor: 0x060a10,
  fogNear: 28,
  fogFar: 420,
  skyDepth: {
    topColor: 0x020406,
    horizonColor: 0x101c30,
    bottomColor: 0x040608,
    hazeColor: 0x203050,
    horizonIntensity: 0.75,
    hazeOpacity: 0.32,
  },
  fogProfile: { color: 0x0a121e, near: 42, far: 540 },
  ambientLight: { color: 0xb0c8e8, intensity: 0.42 },
  sunLight: { color: 0xc0d8ff, intensity: 0.40, position: [0, 55, 100] },
};

const ARCTIC_SHELF_DAWN: AtmosphereDefinition = {
  skyColor: 0x050810,
  fogColor: 0x090e18,
  fogNear: 32,
  fogFar: 470,
  skyDepth: {
    topColor: 0x030608,
    horizonColor: 0x162034,
    bottomColor: 0x050810,
    hazeColor: 0x284868,
    horizonIntensity: 1.10,
    hazeOpacity: 0.34,
  },
  fogProfile: { color: 0x0c1628, near: 46, far: 600 },
  ambientLight: { color: 0xc0d8f8, intensity: 0.50 },
  sunLight: { color: 0xd0e8ff, intensity: 0.60, position: [100, 15, -80] },
};

const ARCTIC_SHELF_DUSK: AtmosphereDefinition = {
  skyColor: 0x04060e,
  fogColor: 0x07091a,
  fogNear: 30,
  fogFar: 460,
  skyDepth: {
    topColor: 0x02040a,
    horizonColor: 0x142030,
    bottomColor: 0x04070e,
    hazeColor: 0x244060,
    horizonIntensity: 0.82,
    hazeOpacity: 0.30,
  },
  fogProfile: { color: 0x0c1428, near: 44, far: 580 },
  ambientLight: { color: 0xb8d4f0, intensity: 0.46 },
  sunLight: { color: 0xc8dcff, intensity: 0.52, position: [-75, 28, 90] },
};

const ARCTIC_SHELF_DAY: AtmosphereDefinition = {
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
};

// ---------------------------------------------------------------------------
// Stage 3e: Ocean Platform atmospheres
// ---------------------------------------------------------------------------

const OCEAN_PLATFORM_NIGHT: AtmosphereDefinition = {
  skyColor: 0x02030a,
  fogColor: 0x050710,
  fogNear: 36,
  fogFar: 520,
  skyDepth: {
    topColor: 0x010206,
    horizonColor: 0x081830,
    bottomColor: 0x030510,
    hazeColor: 0x102040,
    horizonIntensity: 0.90,
    hazeOpacity: 0.34,
  },
  fogProfile: { color: 0x060e20, near: 55, far: 660 },
  ambientLight: { color: 0x9ab8d8, intensity: 0.38 },
  sunLight: { color: 0xb0ccee, intensity: 0.44, position: [50, 90, 30] },
};

const OCEAN_PLATFORM_DAWN: AtmosphereDefinition = {
  skyColor: 0x030510,
  fogColor: 0x060a1a,
  fogNear: 38,
  fogFar: 560,
  skyDepth: {
    topColor: 0x020408,
    horizonColor: 0x0e1e38,
    bottomColor: 0x04060e,
    hazeColor: 0x142838,
    horizonIntensity: 1.05,
    hazeOpacity: 0.36,
  },
  fogProfile: { color: 0x080e22, near: 58, far: 720 },
  ambientLight: { color: 0xa8c4e0, intensity: 0.44 },
  sunLight: { color: 0xb8d4f0, intensity: 0.62, position: [120, 15, -80] },
};

const OCEAN_PLATFORM_DUSK: AtmosphereDefinition = {
  skyColor: 0x040610,
  fogColor: 0x07091a,
  fogNear: 38,
  fogFar: 550,
  skyDepth: {
    topColor: 0x02040a,
    horizonColor: 0x0c1c38,
    bottomColor: 0x040610,
    hazeColor: 0x123050,
    horizonIntensity: 0.92,
    hazeOpacity: 0.32,
  },
  fogProfile: { color: 0x080c22, near: 55, far: 700 },
  ambientLight: { color: 0xa0bcd8, intensity: 0.42 },
  sunLight: { color: 0xb0cce8, intensity: 0.58, position: [-65, 28, 80] },
};

const OCEAN_PLATFORM_DAY: AtmosphereDefinition = {
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
};

// ---------------------------------------------------------------------------
// Stage 3e: Urban Ruin atmospheres
// ---------------------------------------------------------------------------

const URBAN_RUIN_NIGHT: AtmosphereDefinition = {
  skyColor: 0x070402,
  fogColor: 0x0e0704,
  fogNear: 16,
  fogFar: 300,
  skyDepth: {
    topColor: 0x060302,
    horizonColor: 0x28100a,
    bottomColor: 0x080402,
    hazeColor: 0x561a0c,
    horizonIntensity: 0.85,
    hazeOpacity: 0.45,
  },
  fogProfile: { color: 0x140804, near: 24, far: 380 },
  ambientLight: { color: 0xff9860, intensity: 0.44 },
  sunLight: { color: 0xff6020, intensity: 0.85, position: [-50, 80, 60] },
};

const URBAN_RUIN_DAWN: AtmosphereDefinition = {
  skyColor: 0x0a0502,
  fogColor: 0x140804,
  fogNear: 18,
  fogFar: 340,
  skyDepth: {
    topColor: 0x080402,
    horizonColor: 0x521c08,
    bottomColor: 0x0a0604,
    hazeColor: 0x8a3010,
    horizonIntensity: 1.20,
    hazeOpacity: 0.48,
  },
  fogProfile: { color: 0x1c0e06, near: 28, far: 440 },
  ambientLight: { color: 0xffb070, intensity: 0.48 },
  sunLight: { color: 0xff7020, intensity: 1.00, position: [130, 18, -80] },
};

const URBAN_RUIN_DUSK: AtmosphereDefinition = {
  skyColor: 0x080504,
  fogColor: 0x100a06,
  fogNear: 20,
  fogFar: 360,
  skyDepth: {
    topColor: 0x060402,
    horizonColor: 0x3a1a0e,
    bottomColor: 0x080604,
    hazeColor: 0x6e2a14,
    horizonIntensity: 1.08,
    hazeOpacity: 0.44,
  },
  fogProfile: { color: 0x180e06, near: 30, far: 460 },
  ambientLight: { color: 0xffa860, intensity: 0.50 },
  sunLight: { color: 0xff6818, intensity: 0.95, position: [-70, 32, 80] },
};

const URBAN_RUIN_DAY: AtmosphereDefinition = {
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
};

// ---------------------------------------------------------------------------
// Preset registry
// ---------------------------------------------------------------------------

export const TIME_OF_DAY_PRESETS: Record<TimeOfDayId, TimeOfDayPreset> = {
  night: {
    id: 'night',
    label: 'Night',
    atmospheres: {
      'night-grid': NIGHT_GRID_NIGHT,
      'ash-ridge': ASH_RIDGE_NIGHT,
      'storm-coast': STORM_COAST_NIGHT,
      'arctic-shelf': ARCTIC_SHELF_NIGHT,
      'ocean-platform': OCEAN_PLATFORM_NIGHT,
      'urban-ruin': URBAN_RUIN_NIGHT,
    },
  },
  dawn: {
    id: 'dawn',
    label: 'Dawn',
    atmospheres: {
      'night-grid': NIGHT_GRID_DAWN,
      'ash-ridge': ASH_RIDGE_DAWN,
      'storm-coast': STORM_COAST_DAWN,
      'arctic-shelf': ARCTIC_SHELF_DAWN,
      'ocean-platform': OCEAN_PLATFORM_DAWN,
      'urban-ruin': URBAN_RUIN_DAWN,
    },
  },
  dusk: {
    id: 'dusk',
    label: 'Dusk',
    atmospheres: {
      'night-grid': NIGHT_GRID_DUSK,
      'ash-ridge': ASH_RIDGE_DUSK,
      'storm-coast': STORM_COAST_DUSK,
      'arctic-shelf': ARCTIC_SHELF_DUSK,
      'ocean-platform': OCEAN_PLATFORM_DUSK,
      'urban-ruin': URBAN_RUIN_DUSK,
    },
  },
  day: {
    id: 'day',
    label: 'Day',
    atmospheres: {
      'night-grid': NIGHT_GRID_DAY,
      'ash-ridge': ASH_RIDGE_DAY,
      'storm-coast': STORM_COAST_DAY,
      'arctic-shelf': ARCTIC_SHELF_DAY,
      'ocean-platform': OCEAN_PLATFORM_DAY,
      'urban-ruin': URBAN_RUIN_DAY,
    },
  },
};

// ---------------------------------------------------------------------------
// Registry helpers
// ---------------------------------------------------------------------------

export function getTimeOfDayPreset(id: TimeOfDayId): TimeOfDayPreset {
  return TIME_OF_DAY_PRESETS[id];
}

/**
 * Return the atmosphere for a given biome + time-of-day combination.
 * Returns undefined when no override exists — callers should fall back to
 * the biome's defaultAtmosphere (composeEnvironment does this automatically).
 */
export function getAtmosphereForTimeOfDay(
  biomeId: BiomeId,
  timeOfDayId: TimeOfDayId,
): AtmosphereDefinition | undefined {
  return TIME_OF_DAY_PRESETS[timeOfDayId]?.atmospheres[biomeId];
}
