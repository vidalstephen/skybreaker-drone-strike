// ---------------------------------------------------------------------------
// Skybreaker Drone Strike — central tuning constants
// Extracted from Game.tsx (Phase 1, Step 1.3)
// Modify here; Game.tsx imports from this file.
// ---------------------------------------------------------------------------

// --- Flight physics ---
export const BASE_SPEED = 0.5;
export const BOOST_MULTIPLIER = 2.0;
export const ROTATION_SPEED = 0.022;
export const FINE_CONTROL_SENSITIVITY = 0.0015;
export const CAMERA_LERP = 0.08;

// --- Environment colours ---
export const WATER_COLOR = 0x050505;
export const SKY_COLOR = 0x030407;
export const FOG_COLOR = 0x050609;
export const ACCENT_COLOR = 0xf27d26;

// --- Pass 5.1: Visual tuning ---
export const STREAK_COUNT = 30;
export const STREAK_LENGTH = 8;
export const STREAK_WIDTH = 0.04;
export const STREAK_OPACITY_BOOST = 0.18;
export const STREAK_OPACITY_CRUISE = 0.0;
export const STREAK_OPACITY_FAST = 0.06;
export const STREAK_INNER_RADIUS = 9;
export const STREAK_OUTER_RADIUS = 20;
export const BOOST_FOV = 82;
export const NORMAL_FOV = 75;
// Reference aspect ratio for FOV calibration. NORMAL_FOV/BOOST_FOV are tuned for 16:9.
// On wider screens the vertical FOV is reduced so horizontal FOV stays constant.
export const CAMERA_REF_ASPECT = 16 / 9;
export const ENGINE_GLOW_BOOST_OPACITY = 0.65;
export const ENGINE_GLOW_SCALE_MAX = 1.25;
export const THRUSTER_INTENSITY_MAX = 0.9;
export const EXPLOSION_RADIUS_MIN = 1;
export const EXPLOSION_RADIUS_MAX = 4;
export const EXPLOSION_SCATTER = 10;
export const HIT_FLASH_EMISSIVE = 0.8;

// --- Radar ---
export const RADAR_RANGE = 700; // world units shown at full radar radius

// --- Targeting HUD ---
export const AIM_PATH_OPACITY_IDLE    = 0.25; // weapon path line opacity during normal flight
export const AIM_PATH_OPACITY_FIRING  = 0.70; // weapon path line opacity while firing
export const AIM_PATH_WIDTH           = 1.5;  // weapon path stroke width (px)
export const AIM_PATH_DASH            = '6 9'; // strokeDasharray: dash + gap (px)
export const AIM_PATH_FADE_MS         = 150;  // ms for path to return to idle after firing
export const RETICLE_PULSE_MS         = 200;  // ms for reticle pulse on fire
export const CENTER_MARKER_SIZE       = 8;    // reference size for center aim dot (px)
export const AIM_CONVERGENCE_MARKERS  = 3;    // small path brackets near reticle

// --- Target lock ---
export const LOCK_RANGE        = 500;  // world units — max range to acquire lock on a target
export const LOCK_CONE_DOT     = 0.5;  // min dot product of forward → target direction (~60° half-angle cone)
export const LOCK_ACQUIRE_RATE = 0.65; // lock progress gained per second when eligible (~1.5 s to full lock)
export const LOCK_DRAIN_RATE   = 1.5;  // lock progress drained per second when not eligible
