import type { WeatherDefinition, WeatherId } from '../types/game';

// ---------------------------------------------------------------------------
// Weather definition registry (Stage 3c)
// ---------------------------------------------------------------------------
// Each WeatherDefinition carries:
//   visual   — fog/particle/sky overrides layered on top of the biome+TOD environment
//   gameplay — aircraft and projectile modifiers (applied in Stage 3d)
//   sensors  — radar/lock modifiers (applied in Stage 3d)
//
// Absent or 'clear' weatherId on a MissionDefinition = no effect; all runtimes
// should default to WEATHER_DEFINITIONS.clear when no weatherId is specified.
//
// 'reducedEffects' overrides the visual block when the player's graphics quality
// is low or reduced-effects mode is enabled — always keep particle counts low
// and avoid flash effects that could affect readability.

export const WEATHER_DEFINITIONS: Record<WeatherId, WeatherDefinition> = {
  // -------------------------------------------------------------------------
  // Clear — identity; no overrides
  // -------------------------------------------------------------------------
  clear: {
    id: 'clear',
    label: 'Clear',
    warningText: '',
    visual: {},
    gameplay: {},
    sensors: {},
  },

  // -------------------------------------------------------------------------
  // Crosswind — lateral drift, slight visibility reduction, no sensor effect
  // -------------------------------------------------------------------------
  crosswind: {
    id: 'crosswind',
    label: 'Crosswind',
    warningText: 'CROSSWIND ACTIVE',
    briefingNote: 'Crosswind conditions expected throughout the operation. Compensate on attack runs.',
    visual: {
      fogMultiplier: 0.95,
    },
    gameplay: {
      windDrift: 2.0,
      visibilityMultiplier: 0.95,
    },
    sensors: {},
    reducedEffects: {
      fogMultiplier: 0.95,
    },
  },

  // -------------------------------------------------------------------------
  // Rain — reduced visibility, rain particles, mild radar degradation
  // -------------------------------------------------------------------------
  rain: {
    id: 'rain',
    label: 'Rain',
    warningText: 'RAIN — REDUCED VISIBILITY',
    briefingNote: 'Heavy rainfall forecast. Visibility and radar range reduced.',
    visual: {
      fogMultiplier: 0.75,
      particleEffect: 'rain',
      particleDensity: 0.55,
      ambientIntensityMultiplier: 0.88,
    },
    gameplay: {
      visibilityMultiplier: 0.85,
    },
    sensors: {
      radarRangeMultiplier: 0.90,
    },
    reducedEffects: {
      fogMultiplier: 0.75,
      particleEffect: 'rain',
      particleDensity: 0.20,
    },
  },

  // -------------------------------------------------------------------------
  // Lightning Storm — severe visibility loss, wind drift, radar and lock degraded
  // -------------------------------------------------------------------------
  'lightning-storm': {
    id: 'lightning-storm',
    label: 'Lightning Storm',
    warningText: 'LIGHTNING STORM — HIGH RISK',
    briefingNote: 'Active electrical storm. Severe visibility loss, sensor interference, and strong wind shear expected.',
    visual: {
      fogMultiplier: 0.60,
      particleEffect: 'lightning',
      particleDensity: 0.70,
      ambientIntensityMultiplier: 0.72,
      lightningFlashOpacity: 0.18,
    },
    gameplay: {
      windDrift: 3.0,
      visibilityMultiplier: 0.70,
      boostRecoveryMultiplier: 0.90,
    },
    sensors: {
      radarRangeMultiplier: 0.75,
      lockSpeedMultiplier: 0.80,
      sensorNoiseLevel: 0.20,
    },
    reducedEffects: {
      fogMultiplier: 0.60,
      particleEffect: 'rain',
      particleDensity: 0.25,
      ambientIntensityMultiplier: 0.72,
    },
  },

  // -------------------------------------------------------------------------
  // Ash Storm — severe sensor disruption, reduced radar range, warm sky tint
  // -------------------------------------------------------------------------
  'ash-storm': {
    id: 'ash-storm',
    label: 'Ash Storm',
    warningText: 'ASH STORM — SENSOR DISRUPTION',
    briefingNote: 'Volcanic ash cloud active over the operational area. Radar degraded, intake systems stressed.',
    visual: {
      fogMultiplier: 0.55,
      particleEffect: 'ash',
      particleDensity: 0.80,
      skyColorShift: 0x110800,
      ambientIntensityMultiplier: 0.78,
    },
    gameplay: {
      windDrift: 1.5,
      visibilityMultiplier: 0.65,
      boostRecoveryMultiplier: 0.85,
    },
    sensors: {
      radarRangeMultiplier: 0.70,
      lockSpeedMultiplier: 0.85,
      sensorNoiseLevel: 0.30,
    },
    reducedEffects: {
      fogMultiplier: 0.55,
      particleEffect: 'ash',
      particleDensity: 0.30,
      skyColorShift: 0x110800,
    },
  },

  // -------------------------------------------------------------------------
  // Snow / Frost — moderate visibility loss, energy drain (cold), mild sensor effect
  // -------------------------------------------------------------------------
  'snow-frost': {
    id: 'snow-frost',
    label: 'Snow / Frost',
    warningText: 'SNOW — SYSTEMS COOLING',
    briefingNote: 'Sub-zero conditions with active snowfall. Energy drain due to thermal load.',
    visual: {
      fogMultiplier: 0.80,
      particleEffect: 'snow',
      particleDensity: 0.50,
      ambientIntensityMultiplier: 0.92,
    },
    gameplay: {
      energyDrainPerSecond: 1.0,
      visibilityMultiplier: 0.88,
    },
    sensors: {
      radarRangeMultiplier: 0.88,
    },
    reducedEffects: {
      fogMultiplier: 0.80,
      particleEffect: 'snow',
      particleDensity: 0.20,
    },
  },

  // -------------------------------------------------------------------------
  // Sea Squall — strong wind drift, rain, shield disruption, degraded radar
  // -------------------------------------------------------------------------
  'sea-squall': {
    id: 'sea-squall',
    label: 'Sea Squall',
    warningText: 'SEA SQUALL — SHIELD DISRUPTION',
    briefingNote: 'Coastal squall system active. Expect heavy wind shear and intermittent shield interference.',
    visual: {
      fogMultiplier: 0.70,
      particleEffect: 'rain',
      particleDensity: 0.65,
      ambientIntensityMultiplier: 0.80,
    },
    gameplay: {
      windDrift: 4.0,
      visibilityMultiplier: 0.78,
      shieldRechargeMultiplier: 0.82,
    },
    sensors: {
      radarRangeMultiplier: 0.80,
      lockSpeedMultiplier: 0.90,
    },
    reducedEffects: {
      fogMultiplier: 0.70,
      particleEffect: 'rain',
      particleDensity: 0.25,
    },
  },

  // -------------------------------------------------------------------------
  // EM Interference — pure sensor disruption, no visual change, energy drain
  // -------------------------------------------------------------------------
  'em-interference': {
    id: 'em-interference',
    label: 'EM Interference',
    warningText: 'EM INTERFERENCE — SENSORS DEGRADED',
    briefingNote: 'Active electromagnetic interference field. Radar, lock systems, and energy reserves compromised.',
    visual: {
      // No fog or sky change — disruption is electronic, not atmospheric
    },
    gameplay: {
      energyDrainPerSecond: 2.0,
      boostRecoveryMultiplier: 0.88,
    },
    sensors: {
      radarRangeMultiplier: 0.50,
      lockSpeedMultiplier: 0.60,
      sensorNoiseLevel: 0.50,
    },
    reducedEffects: {},
  },
};

// ---------------------------------------------------------------------------
// Registry helpers
// ---------------------------------------------------------------------------

export function getWeather(id: WeatherId): WeatherDefinition {
  return WEATHER_DEFINITIONS[id];
}

/**
 * Resolve the active WeatherDefinition for a mission.
 * Returns the 'clear' definition when no weatherId is specified.
 */
export function resolveMissionWeather(weatherId?: WeatherId): WeatherDefinition {
  return WEATHER_DEFINITIONS[weatherId ?? 'clear'];
}
