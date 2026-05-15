// --- FIRST PLAYABLE LOCK: Skybreaker: Drone Strike ---
// Feature Set:
// - Pilotable drone with 6DOF flight model (Keyboard & Mobile Joystick)
// - Data-driven arcade missions with objective targets and extraction protocol
// - Systems: Health (Global), Regenerative Shields, Energy (Costs: Boost/Fire)
// - Combat: Primary energy weapon system vs AI Interceptor Drones
// - UI: Dynamic HUD indicators (Off-screen objective tracking)
// - States: Dynamic Mission Success/Failure screens with stat tracking
// -------------------------------------------------------------------------

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Compass, Crosshair, Objectives, Radar, SpeedDisplay, SurfaceWarning, TargetLock, Vitals } from './hud';
import { GameOver, MissionComplete, OutOfBoundsWarning } from './overlays';

// --- Phase 1: types and constants live in dedicated modules ---
import {
  BASE_SPEED,
  CAMERA_LERP,
  BOOST_FOV,
  NORMAL_FOV,
  CAMERA_REF_ASPECT,
  HIT_FLASH_EMISSIVE,
  LOCK_RANGE,
  LOCK_CONE_DOT,
  LOCK_ACQUIRE_RATE,
  LOCK_DRAIN_RATE,
  MISSILE_TURN_RATE,
  MISSILE_MIN_LOCK,
} from '../config/constants';
import { expandEnemyWaveGrouped, WING_OFFSETS } from '../config/enemies';
import { getEquippedWeapons } from '../config/weapons';
import { resolveUpgradeEffects } from '../config/upgrades';
import type { AudioCue } from '../hooks/useAudio';
import {
  SPEED_STREAK_OPACITY,
  createCombatResources,
  createSetPieceComponentBreakEffect,
  createSetPieceFinalDestructionEffect,
  createSetPiecePhaseChangeEffect,
  createDroneModel,
  createEnemyModel,
  createExtractionZone,
  createGameCamera,
  createGameRenderer,
  createGameScene,
  createMissionEnvironment,
  createMissionLighting,
  createMissionTarget,
  createSpeedStreaks,
  disposeCombatResources,
  updateDroneVisualState,
  updateMissionAtmosphere,
  updateWaypointIllustration,
  type CombatResources,
  type DroneVisualHandles,
  type GraphicsProfile,
  type TargetVisualHandles,
  type WaypointIllustrationHandles,
} from '../scene';
import {
  advancePosition,
  applyAutoLevel,
  applyFlightRotation,
  consumeBoostEnergy,
  getBoostState,
  getFlightSpeed,
  getForwardVector,
  isBrakeActive,
  shouldAutoLevel,
  updateThrottle,
  type FlightControlState,
} from '../systems/flightPhysics';
import { calculateMissionResult, buildObjectiveSnapshot, evaluateBonusConditions, formatMissionObjective, getActiveObjective } from '../systems/missionSystem';
import { advanceTargetSetPiecePhase, applyTargetSetPieceVisibility, isTargetComponentDamageable, syncTargetSetPieceRuntime } from '../systems/setPieceSystem';
import { updateTargetMovement } from '../systems/targetMovementSystem';
import { tickEnemyBehavior } from '../systems/enemyBehavior';
import { GamePhase, TrackedEntityType, type AppSettings, type CampaignProgress, type MissionCompletionResult, type MissionDefinition, type MissionEnemyWaveDefinition, type Target, type TargetWeakPoint, type Enemy, type Projectile, type Explosion, type GameState, type WeaponDefinition, type MissionEvent, type ObjectiveRuntimeState, type SetPieceMissionStats, type TargetComponentRuntimeState, type TrackedEntityState, type TargetLockSnapshot } from '../types/game';
import { createTrackingSystem } from '../systems/trackingSystem';
import { RADAR_RANGE } from '../config/constants';
import { resolveMissionWeather } from '../config/weather';

function getTargetVisualHandles(target: Target): TargetVisualHandles | undefined {
  return target.mesh.userData.targetHandles as TargetVisualHandles | undefined;
}

function getActiveWeakPoints(target: Target): TargetWeakPoint[] {
  return target.weakPoints?.filter(weakPoint => !weakPoint.destroyed && isTargetComponentDamageable(target, weakPoint.id)) ?? [];
}

function findWeakPointImpact(target: Target, projectilePosition: THREE.Vector3, impactRadius: number): TargetWeakPoint | null {
  const activeWeakPoints = getActiveWeakPoints(target);
  let closestWeakPoint: TargetWeakPoint | null = null;
  let closestDistance = Infinity;

  activeWeakPoints.forEach(weakPoint => {
    const hitRadius = Math.max(weakPoint.radius, impactRadius);
    const distance = projectilePosition.distanceTo(weakPoint.position);
    if (distance < hitRadius && distance < closestDistance) {
      closestWeakPoint = weakPoint;
      closestDistance = distance;
    }
  });

  return closestWeakPoint;
}

function closestPointOnSegment(point: THREE.Vector3, segmentStart: THREE.Vector3, segmentEnd: THREE.Vector3): THREE.Vector3 {
  const segment = segmentEnd.clone().sub(segmentStart);
  const lengthSq = segment.lengthSq();
  if (lengthSq <= 0) return segmentStart.clone();
  const t = THREE.MathUtils.clamp(point.clone().sub(segmentStart).dot(segment) / lengthSq, 0, 1);
  return segmentStart.clone().addScaledVector(segment, t);
}

function distancePointToSegment(point: THREE.Vector3, segmentStart: THREE.Vector3, segmentEnd: THREE.Vector3): number {
  return point.distanceTo(closestPointOnSegment(point, segmentStart, segmentEnd));
}

function segmentIntersectsSphere(segmentStart: THREE.Vector3, segmentEnd: THREE.Vector3, center: THREE.Vector3, radius: number): boolean {
  return distancePointToSegment(center, segmentStart, segmentEnd) <= radius;
}

function findWeakPointImpactOnSegment(target: Target, segmentStart: THREE.Vector3, segmentEnd: THREE.Vector3, impactRadius: number): TargetWeakPoint | null {
  const activeWeakPoints = getActiveWeakPoints(target);
  let closestWeakPoint: TargetWeakPoint | null = null;
  let closestDistance = Infinity;

  activeWeakPoints.forEach(weakPoint => {
    const hitRadius = Math.max(weakPoint.radius, impactRadius, 16);
    const distance = distancePointToSegment(weakPoint.position, segmentStart, segmentEnd);
    if (distance <= hitRadius && distance < closestDistance) {
      closestWeakPoint = weakPoint;
      closestDistance = distance;
    }
  });

  return closestWeakPoint;
}

function findNearestWeakPoint(target: Target, position: THREE.Vector3): TargetWeakPoint | null {
  const activeWeakPoints = getActiveWeakPoints(target);
  let closestWeakPoint: TargetWeakPoint | null = null;
  let closestDistance = Infinity;

  activeWeakPoints.forEach(weakPoint => {
    const distance = weakPoint.position.distanceTo(position);
    if (distance < closestDistance) {
      closestWeakPoint = weakPoint;
      closestDistance = distance;
    }
  });

  return closestWeakPoint;
}

function updateAggregateTargetHealth(target: Target): void {
  const requiredWeakPoints = target.weakPoints?.filter(weakPoint => weakPoint.required) ?? [];
  if (requiredWeakPoints.length === 0) return;
  target.health = requiredWeakPoints.reduce((remainingHealth, weakPoint) => remainingHealth + (weakPoint.destroyed ? 0 : Math.max(0, weakPoint.health)), 0);
  syncTargetSetPieceRuntime(target);
}

function areRequiredWeakPointsDestroyed(target: Target): boolean {
  const requiredWeakPoints = target.weakPoints?.filter(weakPoint => weakPoint.required) ?? [];
  return requiredWeakPoints.length > 0 && requiredWeakPoints.every(weakPoint => weakPoint.destroyed);
}

function getTargetTrackingState(target: Target): TrackedEntityState | undefined {
  if (target.health < target.maxHealth) return 'damaged';
  if (target.movement && !target.movement.completed) return 'moving';
  return undefined;
}

function addEffect(scene: THREE.Scene, explosions: Explosion[], effect: THREE.Group, life: number): void {
  scene.add(effect);
  explosions.push({ mesh: effect, life, maxLife: life });
}

function createEmptySetPieceStats(): SetPieceMissionStats {
  return {
    componentsDestroyed: 0,
    requiredComponentsDestroyed: 0,
    optionalComponentsDestroyed: 0,
    phasesCompleted: 0,
    phaseTimeMs: 0,
    movingTargetsEscaped: 0,
    protectedAssetsLost: 0,
  };
}

function getGraphicsProfile(settings: AppSettings): GraphicsProfile {
  const effectScale = settings.reduceEffects ? 0.45 : 1;

  if (settings.graphicsQuality === 'LOW') {
    return { pixelRatio: 1, antialias: false, effectScale: Math.min(effectScale, 0.5), fogScale: 0.82 };
  }

  if (settings.graphicsQuality === 'MEDIUM') {
    return { pixelRatio: 1.5, antialias: true, effectScale: Math.min(effectScale, 0.75), fogScale: 0.92 };
  }

  return { pixelRatio: 2, antialias: true, effectScale, fogScale: 1 };
}

interface GameProps {
  phase: GamePhase;
  mission: MissionDefinition;
  progress: CampaignProgress;
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
  onSound: (cue: AudioCue) => void;
  onMissionComplete: (result: MissionCompletionResult) => void;
  onMissionFailed: () => void;
  onRetryMission: () => void;
  onReturnToMenu: () => void;
}

export default function Game({
  phase,
  mission,
  progress,
  settings,
  onSettingsChange,
  onSound,
  onMissionComplete,
  onMissionFailed,
  onRetryMission,
  onReturnToMenu,
}: GameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef(phase);
  const settingsRef = useRef(settings);

  // Resolve weather definition once for this mission (immutable for mission duration).
  const weatherDef = resolveMissionWeather(mission.weatherId);
  // Stage 7c: resolve upgrade effects once for this mission start (based on equipped upgrades at launch).
  const upgradeEffects = resolveUpgradeEffects(progress.inventory?.upgradeLevels ?? {});
  // Derive effective radar range so the Radar HUD component can scale accordingly.
  const effectiveRadarRange = RADAR_RANGE * (weatherDef.sensors.radarRangeMultiplier ?? 1) * upgradeEffects.radarRangeMultiplier;

  const initialWeapons = getEquippedWeapons(progress);
  const initialPrimaryWeapon = initialWeapons.primary;
  const initialSecondaryWeapon = initialWeapons.secondary;
  
  // Game state for UI
  const [gameState, setGameState] = useState<GameState>({
    health: 100,
    shields: 100,
    energy: 100,
    boostEnergy: 100,
    speed: 0,
    fps: 60,
    boosting: false,
    score: 0,
    objective: formatMissionObjective(mission, 0),
    targetsDestroyed: 0,
    outOfBounds: false,
    cameraMode: 'CHASE',
    message: weatherDef.warningText || 'READY FOR SORTIE',
    missionComplete: false,
    gameOver: false,
    missionResult: null,
    enemiesDestroyed: 0,
    activeWeaponLabel: initialPrimaryWeapon.label,
    secondaryWeaponLabel: initialSecondaryWeapon?.label ?? 'Locked',
    secondaryReady: !!initialSecondaryWeapon,
    startTime: Date.now(),
    settings: {
      invertY: settings.invertY,
    },
    objectiveSnapshot: buildObjectiveSnapshot(mission, 0, new Set()),
    targetLock: null,
  });

  // --- Input & Simulation Refs ---
  const keysRef = useRef<Record<string, boolean>>({});
  const gameLogicRef = useRef({
    missionComplete: false,
    gameOver: false,
    cameraMode: 'CHASE' as 'CHASE' | 'COCKPIT',
    targetsDestroyed: 0,
    enemiesDestroyed: 0,
    invertY: settings.invertY,
    completedObjectiveIds: new Set<string>(),
    objectivePhaseIndices: new Map<string, number>(),
    missionEvents: {
      hazardContactIds: new Set<string>(),
      alliesLost: 0,
      events: [] as MissionEvent[],
    },
    setPieceStats: createEmptySetPieceStats(),
    destroyedComponentKeys: new Set<string>(),
    completedPhaseKeys: new Set<string>(),
    phaseStartedAtMs: new Map<string, number>(),
    // Stage 5a: target lock state
    lockProgress:  0,
    lockTargetId:  null as string | null,
  });

  const recordSetPieceComponentDestroyed = (target: Target, component?: TargetComponentRuntimeState): void => {
    if (!component) return;
    const key = `${target.id}:${component.id}`;
    if (gameLogicRef.current.destroyedComponentKeys.has(key)) return;
    gameLogicRef.current.destroyedComponentKeys.add(key);
    gameLogicRef.current.setPieceStats.componentsDestroyed += 1;
    if (component.required) {
      gameLogicRef.current.setPieceStats.requiredComponentsDestroyed += 1;
    } else {
      gameLogicRef.current.setPieceStats.optionalComponentsDestroyed += 1;
    }
  };

  const recordSetPiecePhaseCompleted = (target: Target, phaseId: string): void => {
    const key = `${target.id}:${phaseId}`;
    if (gameLogicRef.current.completedPhaseKeys.has(key)) return;
    gameLogicRef.current.completedPhaseKeys.add(key);
    const now = Date.now();
    const startedAt = gameLogicRef.current.phaseStartedAtMs.get(key) ?? gameState.startTime;
    gameLogicRef.current.setPieceStats.phasesCompleted += 1;
    gameLogicRef.current.setPieceStats.phaseTimeMs += Math.max(0, now - startedAt);

    const nextPhase = target.setPiece?.phases[target.setPiece.activePhaseIndex];
    if (nextPhase && nextPhase.id !== phaseId) {
      gameLogicRef.current.phaseStartedAtMs.set(`${target.id}:${nextPhase.id}`, now);
    }
  };

  // Three.js Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const droneRef = useRef<THREE.Group | null>(null);
  const frameIdRef = useRef<number>(0);
  const projectilesRef = useRef<Projectile[]>([]);
  const explosionsRef = useRef<Explosion[]>([]);
  const aimProjectionRef = useRef<THREE.Mesh | null>(null);
  const droneVisualsRef = useRef<DroneVisualHandles | null>(null);
  const speedStreaksRef = useRef<THREE.Group | null>(null);
  const enemiesRef = useRef<Enemy[]>([]);
  const enemySequenceRef = useRef(0);
  const lastFireTime = useRef(0);
  const lastSecondaryFireTime = useRef(0);
  const lastSecondaryAttemptTime = useRef(0);
  const hitTimeRef = useRef(0);
  const muzzleFlashTimeRef = useRef(0);
  const muzzleFlashRef = useRef<THREE.Mesh | null>(null);
  const targetsRef = useRef<Target[]>([]);
  const tracksRef = useRef(createTrackingSystem());
  const boundaryRef = useRef<number>(1500);
  const enemiesSpawned = useRef(false);
  // Stage 8d: tracks which enemies have already triggered a pre-fire warning this cycle
  const preFiringEnemies = useRef<Set<string>>(new Set());
  // Stage 8d: escalation wave (second enemy wave at higher threshold)
  const escalationSpawnedRef = useRef(false);
  const extractionMeshRef = useRef<THREE.Group | null>(null);
  const lastDamageTime = useRef(0);
  const fpsSample = useRef({ frames: 0, elapsed: 0, value: 60 });
  const currentSystems = useRef({ shields: 100, energy: 100, boostEnergy: 100, health: 100 });
  const cameraShake = useRef(0);
  const [damageFlash, setDamageFlash] = useState(false);

  // Flight variables
  const velocity = useRef(new THREE.Vector3(0, 0, -BASE_SPEED));
  const rotation = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const touchDrag = useRef({ x: 0, y: 0, active: false, identifier: -1, originX: 0, originY: 0 });
  const touchActions = useRef({ boost: false, brake: false, fire: false, secondary: false, level: false });
  const fineControlRef = useRef({ active: false, lastX: 0, lastY: 0, deltaX: 0, deltaY: 0 });
  const wasBoosting = useRef(false);
  const throttleRef = useRef(1);

  const toggleCameraMode = () => {
    gameLogicRef.current.cameraMode = gameLogicRef.current.cameraMode === 'CHASE' ? 'COCKPIT' : 'CHASE';
    setGameState(prev => ({
      ...prev,
      cameraMode: gameLogicRef.current.cameraMode,
    }));
  };

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    gameLogicRef.current.invertY = settings.invertY;
    setGameState(prev => ({ ...prev, settings: { ...prev.settings, invertY: settings.invertY } }));
  }, [settings.invertY]);

  // ... (existing helper functions if any)
  const [dragOriginPos, setDragOriginPos] = useState<{ x: number; y: number } | null>(null);
  const MAX_DRAG_RADIUS = 80;

  const handleTouchDragStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (touchDrag.current.active) return;
    const touch = e.changedTouches[0];
    touchDrag.current.active = true;
    touchDrag.current.identifier = touch.identifier;
    touchDrag.current.originX = touch.clientX;
    touchDrag.current.originY = touch.clientY;
    touchDrag.current.x = 0;
    touchDrag.current.y = 0;
    setDragOriginPos({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchDragMove = (e: React.TouchEvent) => {
    const touch = Array.from(e.changedTouches).find(t => (t as React.Touch).identifier === touchDrag.current.identifier) as React.Touch | undefined;
    if (!touch || !touchDrag.current.active) return;
    const dx = touch.clientX - touchDrag.current.originX;
    const dy = touch.clientY - touchDrag.current.originY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const dragRadius = MAX_DRAG_RADIUS * (100 / (settingsRef.current.touchDragSensitivity ?? 100));
    const strength = Math.min(1, distance / dragRadius);
    const curved = Math.pow(strength, 1.25);
    touchDrag.current.x = distance > 0 ? (dx / distance) * curved : 0;
    touchDrag.current.y = distance > 0 ? (dy / distance) * curved : 0;
  };

  const handleTouchDragEnd = (e: React.TouchEvent) => {
    if (!Array.from(e.changedTouches).some(t => (t as React.Touch).identifier === touchDrag.current.identifier)) return;
    touchDrag.current.active = false;
    touchDrag.current.identifier = -1;
    touchDrag.current.x = 0;
    touchDrag.current.y = 0;
    setDragOriginPos(null);
  };

  // Shared Resources (Pre-created for performance)
  const sharedResources = useRef<CombatResources | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Ignore if clicking on UI elements with pointer-events-auto (buttons, joystick handle)
    if ((e.target as HTMLElement).closest('.pointer-events-auto') && !(e.target as HTMLElement).classList.contains('canvas-area')) return;

    if (e.pointerType === 'mouse') {
      if (e.button === 0) touchActions.current.fire = true;
      if (e.button === 2) {
        touchActions.current.secondary = true;
        return;
      }
    }
    
    fineControlRef.current.active = true;
    fineControlRef.current.lastX = e.clientX;
    fineControlRef.current.lastY = e.clientY;
    fineControlRef.current.deltaX = 0;
    fineControlRef.current.deltaY = 0;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!fineControlRef.current.active) return;
    
    const sensitivityScale = settingsRef.current.pointerSensitivity / 100;
    fineControlRef.current.deltaX = (e.clientX - fineControlRef.current.lastX) * sensitivityScale;
    fineControlRef.current.deltaY = (e.clientY - fineControlRef.current.lastY) * sensitivityScale;
    fineControlRef.current.lastX = e.clientX;
    fineControlRef.current.lastY = e.clientY;
  };

  const handlePointerUp = (e?: React.PointerEvent) => {
    if (!e || e.pointerType === 'mouse') {
      touchActions.current.fire = false;
      touchActions.current.secondary = false;
    }
    fineControlRef.current.active = false;
    fineControlRef.current.deltaX = 0;
    fineControlRef.current.deltaY = 0;
  };

  useEffect(() => {
    sharedResources.current = createCombatResources();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyC' && !e.repeat && phaseRef.current === GamePhase.IN_MISSION && !gameLogicRef.current.missionComplete && !gameLogicRef.current.gameOver) {
        toggleCameraMode();
      }
      // Tab key — cycle manual target selection
      if (e.code === 'Tab' && !e.repeat && phaseRef.current === GamePhase.IN_MISSION && !gameLogicRef.current.missionComplete && !gameLogicRef.current.gameOver) {
        e.preventDefault();
        tracksRef.current.cycleManualTarget();
        // Reset lock progress when the player manually changes targets
        gameLogicRef.current.lockProgress = 0;
        gameLogicRef.current.lockTargetId = null;
      }
      keysRef.current[e.code] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => { keysRef.current[e.code] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (sharedResources.current) {
        disposeCombatResources(sharedResources.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;
    tracksRef.current.reset();
    const hullFailure = mission.failureConditions.find(condition => condition.id === 'hull-depleted');
    const unlockedWeapons = getEquippedWeapons(progress);
    const primaryWeapon = unlockedWeapons.primary;
    const secondaryWeapon = unlockedWeapons.secondary;
    const graphicsProfile = getGraphicsProfile(settings);

    // --- Scene Setup ---
    const scene = createGameScene(mission.environment, graphicsProfile);
    sceneRef.current = scene;
    boundaryRef.current = mission.environment.boundaryRadius;

    // --- Camera Setup ---
    const camera = createGameCamera(window.innerWidth, window.innerHeight);
    scene.add(camera);
    cameraRef.current = camera;
    
    // --- Speed Streaks ---
    const streaksGroup = createSpeedStreaks(graphicsProfile);
    camera.add(streaksGroup);
    speedStreaksRef.current = streaksGroup;

    // --- Renderer Setup ---
    const renderer = createGameRenderer(canvasRef.current, graphicsProfile);
    rendererRef.current = renderer;

    // --- Lighting ---
    createMissionLighting(scene, mission.environment);

    // --- Ground / Environment ---
    const environmentVisuals = createMissionEnvironment(scene, mission.environment, graphicsProfile, settings);

    // --- Drone Model (Low Poly) ---
    const droneModel = createDroneModel();
    const drone = droneModel.group;
    aimProjectionRef.current = droneModel.aimProjection;
    muzzleFlashRef.current = droneModel.muzzleFlash;
    droneVisualsRef.current = droneModel.visuals;
    scene.add(drone);
    droneRef.current = drone;

    // --- Mission Targets ---
    targetsRef.current = mission.targets.map(target => (
      createMissionTarget(scene, new THREE.Vector3(...target.position), target)
    ));
    targetsRef.current.forEach(target => applyTargetSetPieceVisibility(target));
    // Register targets with tracking system
    mission.targets.forEach((targetDef, index) => {
      const target = targetsRef.current[index];
      tracksRef.current.registerTrack(
        target.id,
        TrackedEntityType.OBJECTIVE,
        mission.targetLabel,
        {
          worldX: targetDef.position[0],
          worldY: targetDef.position[1],
          worldZ: targetDef.position[2],
          health: targetDef.health,
          maxHealth: targetDef.health,
          state: 'detected',
        },
        true, // isRequired
        targetDef.trackingMeta,
      );
    });
    // Register hazards
    mission.environment.hazards.forEach(hazard => {
      tracksRef.current.registerTrack(
        hazard.id,
        TrackedEntityType.HAZARD,
        hazard.label,
        {
          worldX: hazard.position[0],
          worldY: hazard.position[1],
          worldZ: hazard.position[2],
          state: 'detected',
        },
        false,
        hazard.trackingMeta,
      );
    });

    // --- Extraction Zone ---
    extractionMeshRef.current = createExtractionZone(scene, mission.extraction.position);
    // Register extraction track as inactive (activates when all targets destroyed)
    tracksRef.current.registerTrack(
      'extraction',
      TrackedEntityType.EXTRACTION,
      mission.extraction.label,
      {
        worldX: mission.extraction.position[0],
        worldY: 0,
        worldZ: mission.extraction.position[2],
        state: 'inactive',
      },
      false,
      mission.extraction.trackingMeta,
    );

    // --- Resize Handler ---
    const handleResize = () => {
      if (!containerRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    // --- Game Loop ---
    const clock = new THREE.Clock();
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      fpsSample.current.frames += 1;
      fpsSample.current.elapsed += delta;
      if (fpsSample.current.elapsed >= 0.5) {
        fpsSample.current.value = Math.round(fpsSample.current.frames / fpsSample.current.elapsed);
        fpsSample.current.frames = 0;
        fpsSample.current.elapsed = 0;
      }
      // Normalize delta for logic (target 60fps)
      const dt = delta * 60;

      if (droneRef.current && cameraRef.current && phaseRef.current === GamePhase.IN_MISSION && !gameLogicRef.current.missionComplete && !gameLogicRef.current.gameOver) {
        const keys = keysRef.current;
        // --- Collision Check: Ground ---
        if (droneRef.current.position.y < 2) {
          droneRef.current.position.y = 2;
          // Soft damage on ground graze
          if (Math.abs(velocity.current.y) > 0.1) {
            currentSystems.current.health -= 0.1 * dt;
          }
        }

        // --- System Health Check ---
        if (currentSystems.current.health <= 0 && !gameLogicRef.current.gameOver) {
          gameLogicRef.current.gameOver = true;
          onSound('failure');
          setGameState(prev => ({ ...prev, gameOver: true, message: hullFailure?.message ?? 'CRITICAL HULL FAILURE' }));
          onMissionFailed();
          return;
        }

        // --- System Regeneration ---
        const now = Date.now();
        
        // Shield Regeneration (after 5 seconds of peace)
        if (now - lastDamageTime.current > 5000 && currentSystems.current.shields < 100) {
          currentSystems.current.shields = Math.min(100, currentSystems.current.shields + 0.1 * (weatherDef.gameplay.shieldRechargeMultiplier ?? 1) * upgradeEffects.shieldRechargeMultiplier * dt);
        }

        // Weapon Energy Regeneration
        currentSystems.current.energy = Math.min(100, currentSystems.current.energy + 0.2 * upgradeEffects.weaponEnergyRegenMultiplier * dt);
        // Boost Energy Regeneration (slightly faster when not boosting)
        currentSystems.current.boostEnergy = Math.min(100, currentSystems.current.boostEnergy + 0.3 * (weatherDef.gameplay.boostRecoveryMultiplier ?? 1) * upgradeEffects.boostEnergyRegenMultiplier * dt);

        // --- Controls & Energy Consumption ---
        const flightControls: FlightControlState = {
          keys,
          joystick: touchDrag.current,
          actions: touchActions.current,
          fineControl: fineControlRef.current,
          invertY: gameLogicRef.current.invertY,
        };
        const { isBoosting } = getBoostState(flightControls, currentSystems.current.boostEnergy);
        const isBraking = isBrakeActive(flightControls);

        const screenShakeScale = settingsRef.current.screenShake / 100;

        if (isBoosting && !wasBoosting.current) {
          // Add mild camera shake on boost activation
          cameraShake.current = Math.max(cameraShake.current, 0.4 * screenShakeScale);
        }
        wasBoosting.current = isBoosting;

        currentSystems.current.boostEnergy = consumeBoostEnergy(currentSystems.current.boostEnergy, isBoosting, dt);
  throttleRef.current = updateThrottle(throttleRef.current, flightControls, dt);

  const currentSpeed = getFlightSpeed(isBoosting, dt, throttleRef.current, isBraking) * upgradeEffects.maxSpeedMultiplier;

        // Visual Speed Feedback: named drone material and thruster handles
        const throttleTarget = isBoosting ? 1.0 : 0.4;
        if (droneVisualsRef.current) {
          updateDroneVisualState(droneVisualsRef.current, {
            throttle: throttleTarget,
            isBoosting,
            isFiring: keys['Space'] || touchActions.current.fire,
            hasRecentDamage: now - lastDamageTime.current < 160,
            hasRecentFire: now - muzzleFlashTimeRef.current < 120,
            frame: frameIdRef.current,
            dt,
          });
        }

        // Muzzle Flash update
        if (muzzleFlashRef.current) {
          const mFlashAge = now - muzzleFlashTimeRef.current;
          const mat = muzzleFlashRef.current.material as THREE.MeshBasicMaterial;
          if (mFlashAge < 100) {
            mat.opacity = 0.8 * (1 - mFlashAge / 100);
            muzzleFlashRef.current.scale.set(1 - mFlashAge/200, 1 + mFlashAge/100, 1 - mFlashAge/200);
          } else {
            mat.opacity = 0;
          }
        }

        // Speed Streaks Effect
        if (speedStreaksRef.current) {
          const opacityTarget = isBoosting ? SPEED_STREAK_OPACITY.boost : (currentSpeed > BASE_SPEED * 1.3 ? SPEED_STREAK_OPACITY.fast : SPEED_STREAK_OPACITY.cruise);
            speedStreaksRef.current.children.forEach(streak => {
                const mat = (streak as THREE.Mesh).material as THREE.MeshBasicMaterial;
                mat.opacity += (opacityTarget - mat.opacity) * 0.05 * dt;
                
                streak.position.z += (isBoosting ? 8 : 2) * dt;
                if (streak.position.z > 10) {
                    streak.position.z = -50 - Math.random() * 50;
                }
            });
        }

        applyFlightRotation(rotation.current, flightControls, dt);
        applyAutoLevel(rotation.current, shouldAutoLevel(flightControls), dt);

        // Update Drone Rotation
        droneRef.current.rotation.copy(rotation.current);

        // Update Position
        advancePosition(droneRef.current.position, droneRef.current.quaternion, currentSpeed);

        // Boundaries (Keep drone above ground and within mission zone)
        if (droneRef.current.position.y < 2) droneRef.current.position.y = 2;
        
        const distFromOrigin = droneRef.current.position.length();
        const isOutOfBounds = distFromOrigin > boundaryRef.current;
        const activeHazard = mission.environment.hazards.find(hazard => {
          const dx = droneRef.current!.position.x - hazard.position[0];
          const dz = droneRef.current!.position.z - hazard.position[2];
          return Math.sqrt(dx * dx + dz * dz) < hazard.radius;
        });

        if (activeHazard) {
          // Track first contact with each hazard zone for AVOID_HAZARD bonus condition evaluation.
          if (!gameLogicRef.current.missionEvents.hazardContactIds.has(activeHazard.id)) {
            gameLogicRef.current.missionEvents.hazardContactIds.add(activeHazard.id);
            gameLogicRef.current.missionEvents.events.push({
              type: 'HAZARD_ENTERED',
              timestamp: Date.now(),
              data: { hazardId: activeHazard.id },
            });
          }
          currentSystems.current.shields = Math.max(0, currentSystems.current.shields - activeHazard.shieldDrainPerSecond * delta);
          currentSystems.current.energy = Math.max(0, currentSystems.current.energy - activeHazard.energyDrainPerSecond * delta);
        }

        // Weather: persistent energy drain and wind drift
        if (weatherDef.gameplay.energyDrainPerSecond) {
          currentSystems.current.energy = Math.max(0, currentSystems.current.energy - weatherDef.gameplay.energyDrainPerSecond * delta);
        }
        if (weatherDef.gameplay.windDrift && droneRef.current) {
          // Constant world-space lateral push (+X axis) — player must compensate on attack runs.
          droneRef.current.position.x += weatherDef.gameplay.windDrift * delta;
        }

        const fireProjectile = (weapon: WeaponDefinition, secondary: boolean) => {
          if (!sharedResources.current || !droneRef.current) return;
          const projectile = new THREE.Mesh(
            secondary ? sharedResources.current.missileGeo : sharedResources.current.boltGeo,
            secondary ? sharedResources.current.secondaryBoltMat : sharedResources.current.playerBoltMat
          );
          projectile.position.copy(droneRef.current.position);
          projectile.quaternion.copy(droneRef.current.quaternion);
          projectile.rotateX(Math.PI / 2);

          const projectileVelocity = new THREE.Vector3(0, 0, -weapon.projectileSpeed).applyQuaternion(droneRef.current.quaternion).multiplyScalar(dt);

          // Stage 5b: capture homing target when weapon is homing and lock is fully acquired
          const homingTargetId = weapon.homing && gameLogicRef.current.lockProgress >= MISSILE_MIN_LOCK
            ? gameLogicRef.current.lockTargetId
            : null;

          scene.add(projectile);
          projectilesRef.current.push({
            mesh: projectile,
            velocity: projectileVelocity,
            life: weapon.projectileLife / dt,
          damage: weapon.damage * upgradeEffects.weaponDamageMultiplier,
            weaponId: weapon.id,
            blastRadius: weapon.blastRadius != null ? weapon.blastRadius * upgradeEffects.missileBlastRadiusMultiplier : undefined,
            targetId: homingTargetId,
          });
        };

        const canFirePrimary = currentSystems.current.energy > primaryWeapon.energyCost;
        if ((keys['Space'] || touchActions.current.fire) && now - lastFireTime.current > primaryWeapon.cooldownMs && canFirePrimary) {
          lastFireTime.current = now;
          currentSystems.current.energy = Math.max(0, currentSystems.current.energy - primaryWeapon.energyCost);
          cameraShake.current = Math.max(cameraShake.current, 0.15 * screenShakeScale);
          muzzleFlashTimeRef.current = now;
          onSound('primary-fire');
          fireProjectile(primaryWeapon, false);
        }

        if (secondaryWeapon && (keys['AltLeft'] || keys['AltRight'] || touchActions.current.secondary) && now - lastSecondaryFireTime.current > secondaryWeapon.cooldownMs && currentSystems.current.energy > secondaryWeapon.energyCost) {
          lastSecondaryFireTime.current = now;
          currentSystems.current.energy = Math.max(0, currentSystems.current.energy - secondaryWeapon.energyCost);
          cameraShake.current = Math.max(cameraShake.current, 0.35 * screenShakeScale);
          muzzleFlashTimeRef.current = now;
          onSound('secondary-fire');
          setGameState(prev => ({ ...prev, message: `${secondaryWeapon.label.toUpperCase()} AWAY` }));
          fireProjectile(secondaryWeapon, true);
          touchActions.current.secondary = false;
        }

        // Spawn Enemies Trigger
        // Stage 8d: Shared helper — spawns an enemy wave definition into the scene.
        const spawnEnemyWave = (waveDef: MissionEnemyWaveDefinition) => {
          gameLogicRef.current.missionEvents.events.push({
            type: 'REINFORCEMENTS_INBOUND',
            timestamp: Date.now(),
            data: { count: waveDef.count },
          });
          setGameState(prev => ({ ...prev, message: waveDef.message }));

          const waveDefinitions = expandEnemyWaveGrouped(waveDef.composition).slice(0, waveDef.count);
          // Stage 8b: track leader spawn positions by formationId so wings spawn near the leader
          const leaderSpawnPositions = new Map<string, THREE.Vector3>();
          waveDefinitions.forEach(({ definition: enemyDefinition, formationId, formationRole, wingIndex }) => {
            const { group: enemyGroup, visualHandles: enemyVisualHandles } = createEnemyModel(enemyDefinition);
            let spawnPos: THREE.Vector3;
            if (formationId && formationRole === 'wing' && leaderSpawnPositions.has(formationId)) {
              const leaderPos = leaderSpawnPositions.get(formationId)!;
              const off = WING_OFFSETS[wingIndex % WING_OFFSETS.length];
              spawnPos = leaderPos.clone().add(new THREE.Vector3(off[0], off[1], off[2]));
            } else if (enemyDefinition.navalThreat) {
              spawnPos = new THREE.Vector3(
                (Math.random() - 0.5) * 1400,
                0,
                (Math.random() - 0.5) * 1400
              );
            } else if (enemyDefinition.groundThreat) {
              spawnPos = new THREE.Vector3(
                (Math.random() - 0.5) * 1200,
                2,
                (Math.random() - 0.5) * 1200
              );
            } else {
              spawnPos = droneRef.current!.position.clone().add(new THREE.Vector3(
                (Math.random() - 0.5) * 400,
                50,
                (Math.random() - 0.5) * 400
              ));
            }
            if (formationId && formationRole === 'leader') {
              leaderSpawnPositions.set(formationId, spawnPos.clone());
            }
            enemyGroup.position.copy(spawnPos);
            scene.add(enemyGroup);
            const enemyId = `enemy_${enemySequenceRef.current++}`;
            const formationOffset = formationId && formationRole === 'wing' && leaderSpawnPositions.has(formationId)
              ? spawnPos.clone().sub(leaderSpawnPositions.get(formationId)!)
              : new THREE.Vector3();
            enemiesRef.current.push({
              id: enemyId,
              role: enemyDefinition.role,
              label: enemyDefinition.label,
              mesh: enemyGroup,
              health: enemyDefinition.health,
              shields: enemyDefinition.shields,
              destroyed: false,
              velocity: new THREE.Vector3(),
              lastFireTime: (enemyDefinition.groundThreat || enemyDefinition.navalThreat) ? Date.now() + 2500 : 0,
              definition: enemyDefinition,
              behaviorState: 'spawn',
              visualHandles: enemyVisualHandles,
              formationId,
              formationRole,
              formationOffset,
            });
            tracksRef.current.registerTrack(
              enemyId,
              TrackedEntityType.ENEMY,
              enemyDefinition.label,
              {
                worldX: spawnPos.x,
                worldY: spawnPos.y,
                worldZ: spawnPos.z,
                distanceToPlayer: spawnPos.distanceTo(droneRef.current!.position),
                health: enemyDefinition.health,
                maxHealth: enemyDefinition.health,
                shields: enemyDefinition.shields,
                maxShield: enemyDefinition.shields,
                state: 'detected',
              },
              false,
              { domain: enemyDefinition.navalThreat ? 'sea' : enemyDefinition.groundThreat ? 'ground' : undefined, formationRole },
            );
          });
        };

        // Spawn Enemies Trigger (primary wave)
        if (gameLogicRef.current.targetsDestroyed >= mission.enemyWave.triggerTargetsDestroyed && !enemiesSpawned.current) {
          enemiesSpawned.current = true;
          spawnEnemyWave(mission.enemyWave);
        }

        // Stage 8d: Escalation wave — second reinforcement at higher target threshold
        if (mission.escalationWave && gameLogicRef.current.targetsDestroyed >= mission.escalationWave.triggerTargetsDestroyed && !escalationSpawnedRef.current) {
          escalationSpawnedRef.current = true;
          spawnEnemyWave(mission.escalationWave);
        }

        // Update Enemies AI — Stage 8a: behavior routed through controller system
        enemiesRef.current = enemiesRef.current.filter(enemy => {
          if (enemy.destroyed) return false;

          // Stage 8b: resolve formation leader position for wing enemies.
          let formationLeaderPosition: THREE.Vector3 | undefined;
          if (enemy.formationRole === 'wing' && enemy.formationId) {
            const leader = enemiesRef.current.find(
              e => e.formationId === enemy.formationId && e.formationRole === 'leader' && !e.destroyed
            );
            formationLeaderPosition = leader?.mesh.position;
          }

          // Stage 8a: delegate movement/orientation to the behavior controller.
          const prevBehaviorState = enemy.behaviorState;
          enemy.behaviorState = tickEnemyBehavior(enemy, {
            playerPosition: droneRef.current!.position,
            frameId: frameIdRef.current,
            now: Date.now(),
            dt,
            formationLeaderPosition,
          });

          // Stage 8d: pre-fire telegraph — audio on first transition into pre-fire
          if (enemy.behaviorState === 'pre-fire' && prevBehaviorState !== 'pre-fire') {
            if (!preFiringEnemies.current.has(enemy.id)) {
              preFiringEnemies.current.add(enemy.id);
              onSound(enemy.role === 'railgun-emplacement' ? 'railgun-charge' : 'enemy-warning');
            }
          } else if (enemy.behaviorState !== 'pre-fire') {
            preFiringEnemies.current.delete(enemy.id);
          }

          // Stage 8d: pre-fire telegraph — pulse body mesh emissive (skipped when reduceEffects)
          if (enemy.behaviorState === 'pre-fire' && !settingsRef.current.reduceEffects) {
            const pulse = 0.6 + 0.55 * Math.sin(now * 0.012);
            enemy.visualHandles.bodyMeshes.forEach(mesh => {
              const mat = mesh.material as THREE.MeshStandardMaterial;
              if (mat.emissiveIntensity < 3.0) mat.emissiveIntensity = 1.0 + pulse;
            });
          } else if (enemy.behaviorState !== 'pre-fire') {
            // Restore default emissive so glow doesn't linger after pre-fire ends
            enemy.visualHandles.bodyMeshes.forEach(mesh => {
              const mat = mesh.material as THREE.MeshStandardMaterial;
              if (mat.emissiveIntensity > 0.5 && mat.emissiveIntensity < 3.0) mat.emissiveIntensity = 0.5;
            });
          }

          // Stage 8e: boss phase transitions — cue + message on expose entry and retreat entry
          if (enemy.behaviorState === 'boss-expose' && prevBehaviorState !== 'boss-expose') {
            onSound('boss-phase-shift');
            setGameState(prev => ({ ...prev, message: `${enemy.label.toUpperCase()} STRUCTURE EXPOSED — CRITICAL WINDOW` }));
          }
          if (enemy.behaviorState === 'boss-retreat' && prevBehaviorState !== 'boss-retreat') {
            onSound('enemy-warning');
            setGameState(prev => ({ ...prev, message: `${enemy.label.toUpperCase()} RETREATING — INTERCEPT NOW` }));
          }
          // Stage 8e: expose window visual — strong full-body pulse to signal vulnerability
          if (enemy.behaviorState === 'boss-expose' && !settingsRef.current.reduceEffects) {
            const exposePulse = 1.0 + 1.2 * Math.abs(Math.sin(now * 0.018));
            enemy.visualHandles.bodyMeshes.forEach(mesh => {
              const mat = mesh.material as THREE.MeshStandardMaterial;
              if (mat.emissiveIntensity < 3.0) mat.emissiveIntensity = exposePulse;
            });
          }

          // Enemy Firing (unchanged — controller handles movement only)
          const dist = droneRef.current!.position.distanceTo(enemy.mesh.position);
          const nowTime = Date.now();
          if (dist < enemy.definition.maxRange + 80 && nowTime - enemy.lastFireTime > enemy.definition.fireCooldownMs) {
            enemy.lastFireTime = nowTime + Math.random() * 1000;
            if (sharedResources.current) {
              const eBolt = new THREE.Mesh(sharedResources.current.boltGeo, sharedResources.current.enemyBoltMat);
              eBolt.position.copy(enemy.mesh.position);
              eBolt.lookAt(droneRef.current!.position);
              eBolt.rotateX(Math.PI / 2);
              
              const eBoltVel = droneRef.current!.position.clone().sub(enemy.mesh.position).normalize().multiplyScalar(enemy.definition.projectileSpeed);
              scene.add(eBolt);
              projectilesRef.current.push({ mesh: eBolt, velocity: eBoltVel, life: 200, damage: enemy.definition.projectileDamage, enemyRole: enemy.role, isEnemy: true });
            }
          }

          return true;
        });

        // Handle Extraction Zone
        if (gameLogicRef.current.targetsDestroyed >= mission.targets.length && extractionMeshRef.current) {
          if (!extractionMeshRef.current.visible) {
            extractionMeshRef.current.visible = true;
            // Mark as 'activating' this frame; subsequent frames will resolve to 'active' or 'approaching'.
            tracksRef.current.updateTrack('extraction', { state: 'activating' });
            gameLogicRef.current.missionEvents.events.push({
              type: 'EXTRACTION_ACTIVATED',
              timestamp: Date.now(),
            });
            console.log('[Mission] Extraction zone activated');
          }

          // Extraction completion — guarded by missionComplete flag to fire exactly once
          if (!gameLogicRef.current.missionComplete) {
            const dronePos2D = new THREE.Vector2(droneRef.current!.position.x, droneRef.current!.position.z);
            const extPos2D = new THREE.Vector2(extractionMeshRef.current.position.x, extractionMeshRef.current.position.z);
            const distToExtraction = dronePos2D.distanceTo(extPos2D);

            // Update objective panel with live distance while approaching
            if (frameIdRef.current % 10 === 0) {
              setGameState(prev => ({
                ...prev,
                objective: `${mission.extraction.approachObjective} — ${Math.round(distToExtraction)}m`,
              }));
            }

            if (distToExtraction < mission.extraction.radius) {
              gameLogicRef.current.missionComplete = true;
              const elapsedMs = Date.now() - gameState.startTime;
              const healthAtExtraction = Math.round(currentSystems.current.health);
              // Evaluate bonus conditions against final stats
              const bonusConditions = mission.objectiveSet?.bonusConditions ?? [];
              const { earnedIds, totalBonus } = evaluateBonusConditions(bonusConditions, {
                elapsedMs,
                health: healthAtExtraction,
                targetsDestroyed: gameLogicRef.current.targetsDestroyed,
              }, gameLogicRef.current.missionEvents);
              // Mark the extract objective complete
              const extractObj = getActiveObjective(mission, mission.targets.length);
              if (extractObj) gameLogicRef.current.completedObjectiveIds.add(extractObj.id);
              const missionCompleteSnapshot = buildObjectiveSnapshot(
                mission,
                gameLogicRef.current.targetsDestroyed,
                gameLogicRef.current.completedObjectiveIds,
                earnedIds,
                gameLogicRef.current.objectivePhaseIndices,
              );
              const setPieceStats = {
                ...gameLogicRef.current.setPieceStats,
                protectedAssetsLost: gameLogicRef.current.missionEvents.alliesLost,
              };
              const result = calculateMissionResult(mission, {
                elapsedMs,
                targetsDestroyed: gameLogicRef.current.targetsDestroyed,
                enemiesDestroyed: gameLogicRef.current.enemiesDestroyed,
                health: healthAtExtraction,
                bonusConditionsEarned: earnedIds,
                bonusScore: totalBonus,
                setPieceStats,
              });
              console.log('[Mission] Extraction complete — mission success');
              setGameState(prev => ({
                ...prev,
                health: result.health,
                missionComplete: true,
                missionResult: result,
                message: 'EXTRACTION CONFIRMED',
                objective: mission.extraction.completionObjective,
                objectiveSnapshot: missionCompleteSnapshot,
              }));
              onMissionComplete(result);
            }
          }
          
          const extractionWaypoint = extractionMeshRef.current.userData.waypoint as WaypointIllustrationHandles | undefined;
          if (extractionWaypoint) {
            updateWaypointIllustration(extractionWaypoint, {
              elapsed: clock.elapsedTime,
              cameraPosition: cameraRef.current?.position,
              active: true,
            });
          }

          const rotatingBase = extractionMeshRef.current.userData.rotatingBase as THREE.Object3D | undefined;
          (rotatingBase ?? extractionMeshRef.current.children[0]).rotation.y += 0.02;
        }

        targetsRef.current.forEach(target => {
          const movementUpdate = updateTargetMovement(target, delta);
          if (movementUpdate.failedMission && !gameLogicRef.current.gameOver) {
            gameLogicRef.current.gameOver = true;
            gameLogicRef.current.setPieceStats.movingTargetsEscaped += 1;
            tracksRef.current.updateTrack(target.id, { state: 'completed' });
            onSound('failure');
            setGameState(prev => ({ ...prev, gameOver: true, message: movementUpdate.message ?? `${target.id.toUpperCase()} ESCAPED` }));
            onMissionFailed();
            return;
          }

          const waypoint = target.mesh.userData.waypoint as WaypointIllustrationHandles | undefined;
          if (!waypoint) return;
          waypoint.group.visible = !target.destroyed;
          if (!target.destroyed) {
            updateWaypointIllustration(waypoint, {
              elapsed: clock.elapsedTime,
              cameraPosition: cameraRef.current?.position,
              active: true,
            });
          }
        });

        // Update Projectiles (with Player Hit Detection)
        projectilesRef.current = projectilesRef.current.filter(p => {
          const projectileStart = p.mesh.position.clone();

          // Stage 5b: homing guidance — steer toward locked target before moving
          if (p.targetId && !p.isEnemy) {
            let targetWorldPos: THREE.Vector3 | null = null;
            const homingEnemy = enemiesRef.current.find(e => e.id === p.targetId && !e.destroyed);
            if (homingEnemy) {
              targetWorldPos = homingEnemy.mesh.position;
            } else {
              const homingTarget = targetsRef.current.find(t => t.id === p.targetId && !t.destroyed);
              if (homingTarget) targetWorldPos = homingTarget.position.clone().add(new THREE.Vector3(0, 40, 0));
            }
            if (targetWorldPos) {
              const currentDir = p.velocity.clone().normalize();
              const toTarget = targetWorldPos.clone().sub(p.mesh.position).normalize();
              const angle = currentDir.angleTo(toTarget);
              if (angle > 0.001) {
                const maxTurn = MISSILE_TURN_RATE * delta;
                const t = Math.min(1, maxTurn / angle);
                const newDir = new THREE.Vector3().lerpVectors(currentDir, toTarget, t).normalize();
                const speed = p.velocity.length();
                p.velocity.copy(newDir.multiplyScalar(speed));
              }
            } else {
              // Target gone — fly straight for remaining life
              p.targetId = null;
            }
          }

          p.mesh.position.add(p.velocity);
          const projectileEnd = p.mesh.position.clone();
          p.life--;
          
          let collided = false;

          if (p.isEnemy) {
            // Check collision with player
            if (segmentIntersectsSphere(projectileStart, projectileEnd, droneRef.current!.position, 5)) {
              collided = true;
              lastDamageTime.current = Date.now();
              
              const damage = p.damage;
              if (currentSystems.current.shields > 0) {
                const absorbed = Math.min(currentSystems.current.shields, damage);
                currentSystems.current.shields -= absorbed;
                const leftover = damage - absorbed;
                currentSystems.current.health -= leftover;
              } else {
                currentSystems.current.health -= damage;
              }
              
              currentSystems.current.health = Math.max(0, currentSystems.current.health);
              
              cameraShake.current = 1.0 * screenShakeScale;
              onSound('damage');
              setDamageFlash(true);
              setTimeout(() => setDamageFlash(false), 150);

              setGameState(prev => ({ 
                ...prev, 
                message: 'HULL BREACH DETECTED'
              }));
              setTimeout(() => setGameState(prev => ({
                ...prev,
                message: prev.targetsDestroyed >= mission.targets.length ? prev.message : 'ENGAGING ADVERSARY'
              })), 1000);
            }
          } else {
            // Check collision with targets
            targetsRef.current.forEach(target => {
              if (target.destroyed || collided) return;
              const impactRadius = p.blastRadius ?? 0;
              const activeWeakPoints = getActiveWeakPoints(target);
              const directWeakPointImpact = findWeakPointImpactOnSegment(target, projectileStart, projectileEnd, impactRadius) ?? findWeakPointImpact(target, p.mesh.position, impactRadius);
              const targetCorePosition = target.position.clone().add(new THREE.Vector3(0, 40, 0));
              const coreHit = segmentIntersectsSphere(projectileStart, projectileEnd, targetCorePosition, Math.max(36, impactRadius));
              const weakPointImpact = directWeakPointImpact ?? (coreHit && activeWeakPoints.length > 0 ? findNearestWeakPoint(target, targetCorePosition) : null);

              if (weakPointImpact || coreHit) {
                collided = true;
                hitTimeRef.current = Date.now();
                onSound('hit');
                const hitWorldPosition = weakPointImpact ? closestPointOnSegment(weakPointImpact.position, projectileStart, projectileEnd) : closestPointOnSegment(targetCorePosition, projectileStart, projectileEnd);
                
                // Hit sparks
                const sparkGroup = new THREE.Group();
                for (let i = 0; i < 4; i++) {
                  const sparkGeo = new THREE.BoxGeometry(1, 1, 1);
                  const spark = new THREE.Mesh(sparkGeo, sharedResources.current?.explosionMat);
                  spark.position.set((Math.random()-0.5)*4, (Math.random()-0.5)*4, (Math.random()-0.5)*4);
                  sparkGroup.add(spark);
                }
                sparkGroup.position.copy(hitWorldPosition);
                scene.add(sparkGroup);
                explosionsRef.current.push({ mesh: sparkGroup, life: 10, maxLife: 10 });

                const targetHandles = getTargetVisualHandles(target);
                const damageMesh = weakPointImpact?.damageMesh instanceof THREE.Mesh
                  ? weakPointImpact.damageMesh
                  : targetHandles?.damageMesh ?? target.mesh.children[1] as THREE.Mesh;

                damageMesh.material = new THREE.MeshStandardMaterial({
                  color: weakPointImpact ? 0xff8a2a : 0xff4400,
                  emissive: 0xff0000,
                  emissiveIntensity: HIT_FLASH_EMISSIVE,
                });

                if (weakPointImpact) {
                  weakPointImpact.health -= p.damage;
                  updateAggregateTargetHealth(target);
                  setTimeout(() => {
                    if (!weakPointImpact.destroyed && !target.destroyed && weakPointImpact.damageMesh instanceof THREE.Mesh) {
                      const defaultMaterial = weakPointImpact.damageMesh.userData.defaultMaterial as THREE.Material | undefined;
                      weakPointImpact.damageMesh.material = defaultMaterial ?? new THREE.MeshStandardMaterial({ color: 0xff2a2a, emissive: 0xff2a2a, emissiveIntensity: 1.2 });
                    }
                  }, 50);

                  if (weakPointImpact.health <= 0 && !weakPointImpact.destroyed) {
                    weakPointImpact.destroyed = true;
                    weakPointImpact.health = 0;
                    weakPointImpact.mesh.visible = false;
                    syncTargetSetPieceRuntime(target);
                    const completedPhase = advanceTargetSetPiecePhase(target);
                    if (completedPhase) {
                      tracksRef.current.updateTrack(target.id, { state: 'priority' });
                      onSound('phase-change');
                      addEffect(scene, explosionsRef.current, createSetPiecePhaseChangeEffect(target.position.clone().add(new THREE.Vector3(0, 48, 0)), graphicsProfile.effectScale), 24);
                      recordSetPiecePhaseCompleted(target, completedPhase.id);
                      gameLogicRef.current.missionEvents.events.push({
                        type: 'OBJECTIVE_PHASE_CHANGE',
                        timestamp: Date.now(),
                        data: { targetId: target.id, phaseId: completedPhase.id },
                      });
                    }
                    recordSetPieceComponentDestroyed(target, target.setPiece?.components.find(component => component.id === weakPointImpact.id));
                    onSound('component-break');
                    addEffect(scene, explosionsRef.current, createSetPieceComponentBreakEffect(weakPointImpact.position, graphicsProfile.effectScale), 18);

                    if (!areRequiredWeakPointsDestroyed(target)) {
                      setGameState(prev => ({ ...prev, message: `${weakPointImpact.label.toUpperCase()} DISABLED` }));
                    }
                  }
                } else if (activeWeakPoints.length > 0) {
                  setGameState(prev => ({ ...prev, message: 'WEAK POINTS REQUIRED' }));
                  setTimeout(() => {
                    if (!target.destroyed && targetHandles?.damageMesh) {
                      targetHandles.damageMesh.material = targetHandles.damageDefaultMaterial;
                    }
                  }, 50);
                } else {
                  target.health -= p.damage;
                  syncTargetSetPieceRuntime(target);
                  const completedPhase = advanceTargetSetPiecePhase(target);
                  if (completedPhase) {
                    tracksRef.current.updateTrack(target.id, { state: 'priority' });
                    onSound('phase-change');
                    addEffect(scene, explosionsRef.current, createSetPiecePhaseChangeEffect(target.position.clone().add(new THREE.Vector3(0, 48, 0)), graphicsProfile.effectScale), 24);
                    recordSetPiecePhaseCompleted(target, completedPhase.id);
                    gameLogicRef.current.missionEvents.events.push({
                      type: 'OBJECTIVE_PHASE_CHANGE',
                      timestamp: Date.now(),
                      data: { targetId: target.id, phaseId: completedPhase.id },
                    });
                  }
                  setTimeout(() => {
                    if (!target.destroyed && targetHandles?.damageMesh) {
                      targetHandles.damageMesh.material = targetHandles.damageDefaultMaterial;
                    }
                  }, 50);
                }

                if ((target.health <= 0 || areRequiredWeakPointsDestroyed(target)) && !target.destroyed) {
                  // Guard: only destroy once — prevents double-count from simultaneous hits
                  if (!target.weakPoints?.length) {
                    const completedCore = target.setPiece?.components.find(component => component.required && (component.destroyed || component.health <= 0)) ?? target.setPiece?.components.find(component => component.required);
                    recordSetPieceComponentDestroyed(target, completedCore);
                  }
                  target.destroyed = true;
                  tracksRef.current.markDestroyed(target.id);
                  onSound('set-piece-destroyed');
                  target.health = 0;
                  addEffect(scene, explosionsRef.current, createSetPieceFinalDestructionEffect(target.mesh.position.clone().add(new THREE.Vector3(0, 38, 0)), graphicsProfile.effectScale), 32);
                  const finalMeshes = targetHandles?.finalMeshes ?? [target.mesh.children[1], target.mesh.children[2], target.mesh.children[3]];
                  finalMeshes.forEach(finalMesh => { finalMesh.visible = false; });
                  const waypoint = target.mesh.userData.waypoint as WaypointIllustrationHandles | undefined;
                  if (waypoint) waypoint.group.visible = false;
                  
                  // Recalculate destroyed count from source of truth to avoid double-count
                  const newCount = targetsRef.current.filter(t => t.destroyed).length;
                  gameLogicRef.current.targetsDestroyed = newCount;
                  console.log(`[Mission] Target destroyed: ${target.id} | Total: ${newCount}/${mission.targets.length}`);
                  
                  if (newCount >= mission.targets.length) {
                    // Mark the active destroy objective complete in the ref-side tracker
                    gameLogicRef.current.missionEvents.events.push({
                      type: 'OBJECTIVE_PHASE_CHANGE',
                      timestamp: Date.now(),
                      data: { from: 'DESTROY_ALL', to: 'EXTRACT' },
                    });
                    const completedDestroyObj = getActiveObjective(mission, newCount - 1);
                    if (completedDestroyObj) gameLogicRef.current.completedObjectiveIds.add(completedDestroyObj.id);
                    const allDestroyedSnapshot = buildObjectiveSnapshot(mission, newCount, gameLogicRef.current.completedObjectiveIds, [], gameLogicRef.current.objectivePhaseIndices);
                    const msg = mission.allTargetsDestroyedMessage;
                    setGameState(prev => ({ ...prev, targetsDestroyed: newCount, objective: mission.extraction.activationObjective, message: msg, objectiveSnapshot: allDestroyedSnapshot }));
                    console.log('[Mission] All objectives complete — extraction active');
                  } else {
                    setGameState(prev => ({ ...prev, targetsDestroyed: newCount, objective: formatMissionObjective(mission, newCount), message: mission.targetDestroyedMessage }));
                    setTimeout(() => setGameState(prev => ({
                      ...prev,
                      message: gameLogicRef.current.targetsDestroyed >= mission.targets.length ? prev.message : mission.nextTargetMessage
                    })), 3000);
                  }
                }
              }
            });

            // Check collision with enemies
            enemiesRef.current.forEach(enemy => {
              if (enemy.destroyed || collided) return;
              if (segmentIntersectsSphere(projectileStart, projectileEnd, enemy.mesh.position, Math.max(p.blastRadius ?? 10, 10))) {
                collided = true;
                hitTimeRef.current = Date.now();
                onSound('hit');
                // Stage 8e: expose window grants 1.5x damage to the boss
                const damageMult = enemy.behaviorState === 'boss-expose' ? 1.5 : 1.0;
                if (enemy.shields > 0) {
                  const absorbed = Math.min(enemy.shields, p.damage);
                  enemy.shields -= absorbed;
                  enemy.health -= (p.damage - absorbed) * damageMult;
                  // Stage 8a: hide shield mesh when shields are fully depleted
                  if (enemy.shields <= 0 && enemy.visualHandles.shieldMesh) {
                    enemy.visualHandles.shieldMesh.visible = false;
                  }
                  setGameState(prev => ({ ...prev, message: `${enemy.label.toUpperCase()} SHIELDS HIT` }));
                } else {
                  enemy.health -= p.damage * damageMult;
                }

                // Stage 8a: body flash on hit using named material handles
                enemy.visualHandles.bodyMeshes.forEach(mesh => {
                  (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 3.5;
                });
                setTimeout(() => {
                  if (!enemy.destroyed) {
                    enemy.visualHandles.bodyMeshes.forEach(mesh => {
                      (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5;
                    });
                  }
                }, 80);
                
                // Hit sparks
                const sparkGroup = new THREE.Group();
                for (let i = 0; i < 4; i++) {
                  const sparkGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
                  const spark = new THREE.Mesh(sparkGeo, sharedResources.current?.explosionMat);
                  spark.position.set((Math.random()-0.5)*2, (Math.random()-0.5)*2, (Math.random()-0.5)*2);
                  sparkGroup.add(spark);
                }
                sparkGroup.position.copy(p.mesh.position);
                scene.add(sparkGroup);
                explosionsRef.current.push({ mesh: sparkGroup, life: 10, maxLife: 10 });
                if (enemy.health <= 0) {
                  enemy.destroyed = true;
                  tracksRef.current.markDestroyed(enemy.id);
                  onSound('success');
                  const exp = new THREE.Group();
                  for(let i=0; i<5; i++) {
                    const pGeo = new THREE.SphereGeometry(2, 4, 4);
                    const pMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
                    exp.add(new THREE.Mesh(pGeo, pMat));
                  }
                  exp.position.copy(enemy.mesh.position);
                  scene.add(exp);
                  explosionsRef.current.push({ mesh: exp, life: 20, maxLife: 20 });
                  scene.remove(enemy.mesh);
                  gameLogicRef.current.enemiesDestroyed++;
                  setGameState(prev => ({ 
                    ...prev, 
                    message: 'ADVERSARY NEUTRALIZED',
                    enemiesDestroyed: gameLogicRef.current.enemiesDestroyed
                  }));
                }
              }
            });
          }

          if (p.life <= 0 || collided) {
            scene.remove(p.mesh);
            return false;
          }
          return true;
        });

        // Update Explosions
        explosionsRef.current = explosionsRef.current.filter(e => {
          e.life--;
          e.mesh.scale.multiplyScalar(1.05);
          e.mesh.children.forEach(c => {
            const mesh = c as THREE.Mesh;
            const mat = mesh.material as THREE.MeshBasicMaterial;
            mat.transparent = true;
            mat.opacity = e.life / e.maxLife;
          });
          if (e.life <= 0) {
            scene.remove(e.mesh);
            return false;
          }
          return true;
        });

        // Camera Follow Logic (Smooth & Dynamic)
        let idealOffset: THREE.Vector3;
        let lookAtTarget: THREE.Vector3;
        let lerpFactor = CAMERA_LERP;

        if (gameLogicRef.current.cameraMode === 'COCKPIT') {
          idealOffset = new THREE.Vector3(0, 0.2, -0.6);
          lookAtTarget = new THREE.Vector3(0, 0, -10);
          lerpFactor = 0.85;
          if (droneRef.current) droneRef.current.visible = false;
        } else {
          // Chase Mode: Aircraft sits close, seen from above, lower in the frame
          idealOffset = new THREE.Vector3(0, 5.5, 3.8);
          lookAtTarget = new THREE.Vector3(0, 3.0, -14);
          lerpFactor = CAMERA_LERP;
          if (droneRef.current) droneRef.current.visible = true;
        }

        idealOffset.applyQuaternion(droneRef.current.quaternion);
        const targetCamPos = droneRef.current.position.clone().add(idealOffset);
        
        const camLerp = Math.min(1, lerpFactor * dt);
        cameraRef.current.position.lerp(targetCamPos, camLerp);
        
        // Camera and UI shake
        if (cameraShake.current > 0.01) {
          cameraRef.current.position.x += (Math.random() - 0.5) * cameraShake.current;
          cameraRef.current.position.y += (Math.random() - 0.5) * cameraShake.current;
          cameraShake.current *= Math.pow(0.9, dt);
        }
        
        const worldLookAt = lookAtTarget.applyQuaternion(droneRef.current.quaternion).add(droneRef.current.position);
        cameraRef.current.lookAt(worldLookAt);
 
        // Dynamic FOV for boost — on wide screens (mobile landscape) scale vFOV down so
        // hFOV stays constant at the 16:9 design value, preventing edge fisheye distortion.
        const aspect = cameraRef.current.aspect;
        const baseTargetFov = isBoosting ? BOOST_FOV : NORMAL_FOV;
        const targetFov =
          aspect > CAMERA_REF_ASPECT
            ? (2 * Math.atan(Math.tan(((baseTargetFov * Math.PI) / 180) / 2) * (CAMERA_REF_ASPECT / aspect)) * 180) / Math.PI
            : baseTargetFov;
        cameraRef.current.fov += (targetFov - cameraRef.current.fov) * Math.min(1, 0.05 * dt);
        cameraRef.current.updateProjectionMatrix();

        const isFiring = (keys['Space'] || touchActions.current.fire) && currentSystems.current.energy > 0;
        
        // Update aim projection opacity
        if (aimProjectionRef.current) {
          const mat = aimProjectionRef.current.material as THREE.MeshBasicMaterial;
          // Only visible when actively firing — zero artifact at idle
          const opacityTarget = isFiring ? 0.5 : 0.0;
          mat.opacity += (opacityTarget - mat.opacity) * 0.2;
          // Subtle scale pulse while firing to signal active state
          const scaleTarget = isFiring ? 1.0 + Math.sin(now * 0.025) * 0.12 : 1.0;
          aimProjectionRef.current.scale.setScalar(scaleTarget);
        }

        // Calculate exact point where drone is aiming on screen
        const widthHalf = window.innerWidth / 2;
        const heightHalf = window.innerHeight / 2;
        const aimDist = 260;
        const forwardAim = new THREE.Vector3(0, 0, -aimDist).applyQuaternion(droneRef.current.quaternion).add(droneRef.current.position);
        
        // Convert to screen space
        const vector = forwardAim.clone().project(cameraRef.current);
        const aimScreenX = (vector.x * widthHalf) + widthHalf;
        const aimScreenY = -(vector.y * heightHalf) + heightHalf;

        // Drone screen space
        const droneVector = droneRef.current.position.clone().project(cameraRef.current);
        const droneScreenX = (droneVector.x * widthHalf) + widthHalf;
        const droneScreenY = -(droneVector.y * heightHalf) + heightHalf;
        
        // Calculate alignment with screen center
        // WidthHalf and HeightHalf represent the center of the screen
        const alignDist = Math.sqrt(
          Math.pow(aimScreenX - widthHalf, 2) + 
          Math.pow(aimScreenY - heightHalf, 2)
        );
        const isAligned = alignDist < 30;

          // Update HUD display data
        if (frameIdRef.current % 4 === 0) {
            const secondaryReady = !!secondaryWeapon && now - lastSecondaryFireTime.current > secondaryWeapon.cooldownMs && currentSystems.current.energy > secondaryWeapon.energyCost;

          // Update tracking system with current entity positions and states
          const dronePos = droneRef.current!.position;
          targetsRef.current.forEach(target => {
            if (!target.destroyed) {
              tracksRef.current.updateTrack(target.id, {
                worldX: target.position.x,
                worldY: target.position.y,
                worldZ: target.position.z,
                health: target.health,
                distanceToPlayer: target.position.distanceTo(dronePos),
                state: getTargetTrackingState(target),
              });
            }
          });
          enemiesRef.current.forEach(enemy => {
            if (!enemy.destroyed) {
              tracksRef.current.updateTrack(enemy.id, {
                worldX: enemy.mesh.position.x,
                worldY: enemy.mesh.position.y,
                worldZ: enemy.mesh.position.z,
                health: enemy.health,
                shields: enemy.shields,
                distanceToPlayer: enemy.mesh.position.distanceTo(dronePos),
              });
            }
          });
          if (extractionMeshRef.current) {
            const extractionActive = gameLogicRef.current.targetsDestroyed >= mission.targets.length;
            if (extractionActive) {
              const extPos3D = extractionMeshRef.current.position;
              const distToExt = extPos3D.distanceTo(dronePos);
              const approachThreshold =
                mission.extraction.policy?.approachThreshold ?? mission.extraction.radius * 3;
              let extractState: import('../types/game').TrackedEntityState;
              if (distToExt < mission.extraction.radius) {
                extractState = 'inside-radius';
              } else if (distToExt < approachThreshold) {
                extractState = 'approaching';
              } else {
                extractState = 'active';
              }
              tracksRef.current.updateTrack('extraction', {
                worldX: extPos3D.x,
                worldY: extPos3D.y,
                worldZ: extPos3D.z,
                distanceToPlayer: distToExt,
                state: extractState,
              });
            } else {
              tracksRef.current.updateTrack('extraction', {
                worldX: extractionMeshRef.current.position.x,
                worldY: extractionMeshRef.current.position.y,
                worldZ: extractionMeshRef.current.position.z,
                distanceToPlayer: extractionMeshRef.current.position.distanceTo(dronePos),
                state: 'inactive',
              });
            }
          }
          tracksRef.current.recomputePriority();

          // ---- Stage 5a: lock progress computation ----------------------
          let targetLockSnapshot: TargetLockSnapshot | null = null;
          const selectedSnap = tracksRef.current.getSelectedTrack();
          const lockableTypes = [TrackedEntityType.OBJECTIVE, TrackedEntityType.WEAK_POINT, TrackedEntityType.ENEMY];
          if (
            selectedSnap &&
            lockableTypes.includes(selectedSnap.type) &&
            selectedSnap.state !== 'destroyed' &&
            selectedSnap.state !== 'completed'
          ) {
            const isNewTarget = gameLogicRef.current.lockTargetId !== selectedSnap.id;
            if (isNewTarget) {
              // Selection changed — reset lock progress without triggering extra drain
              gameLogicRef.current.lockProgress = 0;
              gameLogicRef.current.lockTargetId = selectedSnap.id;
            }
            // Check if target is within lock range and inside the forward cone
            const targetPos  = new THREE.Vector3(selectedSnap.worldX, selectedSnap.worldY, selectedSnap.worldZ);
            const toTarget   = targetPos.clone().sub(dronePos).normalize();
            const forward    = getForwardVector(droneRef.current!.quaternion);
            const dotProduct = forward.dot(toTarget);
            const inCone     = dotProduct >= LOCK_CONE_DOT && selectedSnap.distanceToPlayer <= LOCK_RANGE;

            if (inCone) {
              gameLogicRef.current.lockProgress = Math.min(1, gameLogicRef.current.lockProgress + LOCK_ACQUIRE_RATE * upgradeEffects.lockSpeedMultiplier * delta);
            } else {
              gameLogicRef.current.lockProgress = Math.max(0, gameLogicRef.current.lockProgress - LOCK_DRAIN_RATE * delta);
            }

            const lockProgress = gameLogicRef.current.lockProgress;
            const lockState = lockProgress >= 1 ? 'locked' : lockProgress > 0 ? 'acquiring' : 'none';
            targetLockSnapshot = {
              id:          selectedSnap.id,
              label:       selectedSnap.radarLabel ?? selectedSnap.label,
              type:        selectedSnap.type,
              distance:    Math.round(selectedSnap.distanceToPlayer),
              health:      selectedSnap.health,
              maxHealth:   selectedSnap.maxHealth,
              lockState,
              lockProgress,
              isManual:    tracksRef.current.isManualTargeting(),
              // Stage 5f: forward domain and route hint for HUD badge and hint line
              domain:      selectedSnap.domain,
              routeHint:   selectedSnap.routeHint,
            };
          } else {
            // No lockable target selected — drain any residual progress
            if (gameLogicRef.current.lockProgress > 0) {
              gameLogicRef.current.lockProgress = Math.max(0, gameLogicRef.current.lockProgress - LOCK_DRAIN_RATE * delta);
            }
            if (gameLogicRef.current.lockProgress === 0) {
              gameLogicRef.current.lockTargetId = null;
            }
          }
          // ---- end lock computation -------------------------------------

          // Stage 5d: surface warning — true while any ground threat has the player within firing range
          const surfaceWarning = enemiesRef.current.some(e =>
            e.definition.groundThreat && !e.destroyed &&
            droneRef.current!.position.distanceTo(e.mesh.position) < e.definition.maxRange + 80
          );

          setGameState(prev => ({
            ...prev,
            speed: Math.round(currentSpeed * 960),
                        fps: fpsSample.current.value,
            boosting: isBoosting,
            firing: isFiring,
            aligned: isAligned,
            hitConfirmed: now - hitTimeRef.current < 200,
            recoil: now - muzzleFlashTimeRef.current < 100,
            outOfBounds: isOutOfBounds,
            health: Math.round(currentSystems.current.health),
            shields: Math.round(currentSystems.current.shields),
            energy: Math.round(currentSystems.current.energy),
            boostEnergy: Math.round(currentSystems.current.boostEnergy),
            activeWeaponLabel: primaryWeapon.label,
            secondaryWeaponLabel: secondaryWeapon?.label ?? 'Locked',
            secondaryReady,
            message: activeHazard ? activeHazard.message : prev.message,
            aimScreenPos: { x: aimScreenX, y: aimScreenY },
            droneScreenPos: { x: droneScreenX, y: droneScreenY },
            targetLock: targetLockSnapshot,
            surfaceWarning,
          }));
        }
      }

      updateMissionAtmosphere(environmentVisuals.atmosphere, camera);
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameIdRef.current);
      resizeObserver.disconnect();
      // Clean up resources
      renderer.dispose();
      scene.clear();
    };
  }, []);

  const hudScale = settings.hudScale / 100;
  const touchControlsScale = settings.touchControlsScale / 100;

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-dvh bg-[#050505] overflow-hidden font-sans text-white select-none touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onContextMenu={(event) => event.preventDefault()}
    >
      <canvas ref={canvasRef} className="block w-full h-full cursor-crosshair canvas-area" />

      {/* --- HUD OVERLAY: Sophisticated Dark --- */}
      
      {/* Scanline / Vignette Layer */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-black/40 shadow-[inset_0_0_150px_rgba(0,0,0,1)] z-10" />
      
      {/* DAMAGE FLASH */}
      {damageFlash && (
        <div className="absolute inset-0 bg-red-600/30 z-[100] pointer-events-none transition-opacity duration-150 animate-pulse" />
      )}

      <div className="absolute inset-0 pointer-events-none z-20 p-3 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex flex-col justify-between sm:p-5 md:p-8" data-hud-root style={{ transform: `scale(${hudScale})`, transformOrigin: 'center center' }}>
        
        {gameState.outOfBounds && <OutOfBoundsWarning />}
        {/* Stage 5d: surface warning — absolute top-center, independent of bottom HUD layout */}
        <SurfaceWarning active={gameState.surfaceWarning} reduceEffects={settings.reduceEffects} />
        
        {/* HUD: Top Bar */}
        <div className="flex justify-between items-start gap-3" data-hud-region="top">
          <div className="flex min-w-0 max-w-[46vw] flex-col gap-1 sm:max-w-none" data-hud-region="top-left">
            <button
              onClick={toggleCameraMode}
              className="pointer-events-auto self-start bg-black/60 border border-white/20 hover:border-orange-500 px-2 py-0.5 text-[8px] uppercase tracking-widest text-white/70 font-bold transition-colors"
              title="Toggle camera view"
            >
              {gameState.cameraMode} VIEW
            </button>
            {settings.showTelemetry && <div className="text-[8px] text-white/35 font-mono uppercase tracking-[0.12em] sm:text-[9px] sm:tracking-[0.18em]">{settings.graphicsQuality} // {gameState.fps} FPS</div>}
          </div>

          {/* Compass Inserted Here */}
          <div className="absolute left-1/2 -translate-x-1/2 top-[calc(0.75rem+env(safe-area-inset-top))] sm:top-6 md:top-12 z-50" data-hud-region="top-center">
            <Compass rotationY={rotation.current.y} />
            {weatherDef.warningText && (
              <div className="mt-1 text-center text-[7px] sm:text-[8px] font-bold uppercase tracking-[0.3em] text-amber-400/90 pointer-events-none select-none">
                {weatherDef.warningText}
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2" data-hud-region="top-right">
            <div className="flex gap-1 mb-1 sm:gap-2 sm:mb-2">
              <button 
                onClick={() => {
                  onSettingsChange({ ...settings, invertY: !settings.invertY });
                }}
                className="pointer-events-auto min-h-8 bg-black/60 border border-white/20 hover:border-orange-500 px-2 py-1 text-[7px] tracking-[0.12em] text-white uppercase font-bold transition-colors sm:px-3 sm:text-[8px] sm:tracking-widest"
                title="Toggle Pitch Inversion"
              >
                INV_Y: {gameState.settings.invertY ? '[ON]' : '[OFF]'}
              </button>
            </div>
            
            {/* Relocated Radar */}
            <div className="mt-1 origin-top-right scale-[0.68] md:mt-2 md:scale-100">
              <Radar
                dronePos={droneRef.current?.position ?? new THREE.Vector3()}
                tracks={tracksRef.current.getSnapshots()}
                rotationY={rotation.current.y}
                reduceEffects={settings.reduceEffects}
                radarRange={effectiveRadarRange}
              />
            </div>
          </div>
        </div>

        <Crosshair
          cameraMode={gameLogicRef.current.cameraMode}
          boosting={gameState.boosting}
          aligned={gameState.aligned}
          recoil={gameState.recoil}
          firing={gameState.firing}
          hitConfirmed={gameState.hitConfirmed}
          aimScreenPos={gameState.aimScreenPos}
          droneScreenPos={gameState.droneScreenPos}
        />

        {/* HUD: Bottom Layout */}
        <div className="mission-bottom-hud absolute inset-x-3 bottom-[calc(8.25rem+env(safe-area-inset-bottom))] pointer-events-none z-20 sm:inset-x-5 sm:bottom-40 md:inset-x-12 md:bottom-12" data-hud-region="bottom">
          <div className="flex w-full flex-col items-stretch gap-2 md:flex-row md:items-end md:justify-between">
            <div className="flex items-end justify-between gap-2 md:flex-col md:items-start md:gap-6" data-hud-region="bottom-left">
              <SpeedDisplay speed={gameState.speed} boosting={gameState.boosting} />
              <Vitals shields={currentSystems.current.shields} energy={currentSystems.current.energy} boostEnergy={currentSystems.current.boostEnergy} health={currentSystems.current.health} />
              {gameState.targetLock && (
                <TargetLock lock={gameState.targetLock} reduceEffects={settings.reduceEffects} />
              )}
            </div>

            <div className="pointer-events-auto" data-hud-region="bottom-right">
              <Objectives
                objective={gameState.objective}
                enemiesDestroyed={gameState.enemiesDestroyed}
                message={gameState.message}
                activeWeaponLabel={gameState.activeWeaponLabel}
                secondaryWeaponLabel={gameState.secondaryWeaponLabel}
                secondaryReady={gameState.secondaryReady}
                optionalObjectives={gameState.objectiveSnapshot?.optionalObjectives as ObjectiveRuntimeState[] | undefined}
              />
            </div>
          </div>
        </div>

      </div>

      {/* --- TOUCH CONTROLS (Overlay) --- */}
      <div className="touch-controls absolute inset-x-0 bottom-0 pointer-events-none z-40 justify-between px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] items-end" style={{ transform: `scale(${touchControlsScale})`, transformOrigin: 'bottom center' }}>
        
        {/* Left Side: Touch Drag Zone */}
        <div
          className="touch-drag-zone pointer-events-auto flex-1 self-stretch min-h-[7rem]"
          onTouchStart={handleTouchDragStart}
          onTouchMove={handleTouchDragMove}
          onTouchEnd={handleTouchDragEnd}
          onTouchCancel={handleTouchDragEnd}
          aria-label="Drag to steer"
        />

        {/* Right Side: Action Buttons */}
        <div className="touch-action-cluster flex flex-col gap-2 pointer-events-auto sm:gap-4">
          <div className="touch-action-row flex gap-2 sm:gap-4">
             <button 
              className="touch-action-primary w-16 h-16 rounded-full border border-white/20 bg-orange-500/20 active:bg-orange-500 text-orange-500 active:text-black flex items-center justify-center font-black tracking-widest text-[10px] transition-colors sm:w-20 sm:h-20 sm:text-xs"
              onTouchStart={() => touchActions.current.fire = true}
              onTouchEnd={() => touchActions.current.fire = false}
            >
              FIRE
            </button>
            <button 
              className="touch-action-boost w-14 h-14 rounded-full border border-white/10 bg-white/5 active:bg-white text-white active:text-black flex items-center justify-center font-bold tracking-widest text-[8px] transition-colors sm:w-16 sm:h-16 sm:text-[10px]"
              onTouchStart={() => touchActions.current.boost = true}
              onTouchEnd={() => touchActions.current.boost = false}
            >
              BOOST
            </button>
          </div>
          <div className="touch-action-row flex gap-2 justify-end sm:gap-4">
            <button 
              className="touch-action-small w-11 h-11 rounded-full border border-orange-500/30 bg-orange-500/10 active:bg-orange-500 text-orange-400 active:text-black flex items-center justify-center font-bold tracking-widest text-[7px] transition-colors sm:w-12 sm:h-12 sm:text-[8px]"
              onTouchStart={() => touchActions.current.secondary = true}
              onTouchEnd={() => touchActions.current.secondary = false}
            >
              MSL
            </button>
            <button 
              className="touch-action-small w-11 h-11 rounded-full border border-white/10 bg-white/5 active:bg-white text-white active:text-black flex items-center justify-center font-bold tracking-widest text-[7px] transition-colors sm:w-12 sm:h-12 sm:text-[8px]"
              onTouchStart={() => touchActions.current.brake = true}
              onTouchEnd={() => touchActions.current.brake = false}
            >
              BRK
            </button>
            <button 
              className="touch-action-small w-11 h-11 rounded-full border border-white/10 bg-white/5 active:bg-white text-white active:text-black flex items-center justify-center font-bold tracking-widest text-[7px] transition-colors sm:w-12 sm:h-12 sm:text-[8px]"
              onTouchStart={() => touchActions.current.level = true}
              onTouchEnd={() => touchActions.current.level = false}
            >
              LEVEL
            </button>
            {/* Stage 5a: cycle target button */}
            <button
              className="touch-action-small w-11 h-11 rounded-full border border-orange-400/30 bg-orange-500/10 active:bg-orange-500 text-orange-400 active:text-black flex items-center justify-center font-bold tracking-widest text-[7px] transition-colors sm:w-12 sm:h-12 sm:text-[8px]"
              onTouchEnd={() => {
                tracksRef.current.cycleManualTarget();
                gameLogicRef.current.lockProgress = 0;
                gameLogicRef.current.lockTargetId = null;
              }}
            >
              LOCK
            </button>
            <button 
              className="touch-action-small w-11 h-11 rounded-full border border-white/10 bg-white/5 active:bg-white text-white active:text-black flex items-center justify-center font-bold tracking-widest text-[7px] transition-colors sm:w-12 sm:h-12 sm:text-[8px]"
              onClick={toggleCameraMode}
            >
              VIEW
            </button>
          </div>
        </div>
        {dragOriginPos && (
          <div
            className="pointer-events-none fixed z-50 w-10 h-10 rounded-full border border-orange-400/25 -translate-x-1/2 -translate-y-1/2"
            style={{ left: dragOriginPos.x, top: dragOriginPos.y }}
          />
        )}
      </div>

      {/* Key Overlay Hint */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[9px] text-white/20 uppercase tracking-[0.4em] font-medium z-30 pointer-events-none text-center hidden xl:block">
        <div className="flex gap-2 mb-3 justify-center">
          {['Q', 'W', 'E', 'A', 'S', 'D', 'Space', 'Alt', 'Shift', 'Ctrl', 'R', 'F', 'X', 'Tab', 'C'].map(key => {
            const code = key === 'Space' ? 'Space' : key === 'Shift' ? 'ShiftLeft' : key === 'Ctrl' ? 'ControlLeft' : key === 'Alt' ? 'AltLeft' : key === 'Tab' ? 'Tab' : `Key${key}`;
            const isPressed = keysRef.current[code];
            return (
              <div key={key} className={`px-1.5 py-0.5 border transition-all duration-75 ${
                isPressed ? 'bg-orange-500 border-orange-500 text-black' : 'border-white/10'
              }`}>
                {key === 'Space' ? 'FIRE' : key === 'Alt' ? 'MSL' : key === 'Ctrl' ? 'BRK' : key === 'R' ? 'THR+' : key === 'F' ? 'THR-' : key === 'X' ? 'LVL' : key === 'Tab' ? 'LOCK' : key}
              </div>
            );
          })}
        </div>
        [W/S] Pitch • [A/D] Bank-Turn • [Q/E] Yaw Correct • [R/F] Throttle • [CTRL] Brake • [SHIFT] Boost • [SPACE] Fire • [ALT] Missile • [TAB/T] Lock • [X] Level
      </div>

      {/* Decorative HUD Elements */}
      <div className="absolute top-1/2 left-0 w-12 h-64 border-l border-white/5 -translate-y-1/2 m-4 pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-12 h-64 border-r border-white/5 -translate-y-1/2 m-4 pointer-events-none" />

      {phase === GamePhase.DEBRIEF && gameState.missionComplete && (
        <MissionComplete
          startTime={gameState.startTime}
          enemiesDestroyed={gameState.enemiesDestroyed}
          health={gameState.health}
          targetsDestroyed={gameState.targetsDestroyed}
          totalTargets={mission.targets.length}
          result={gameState.missionResult}
          bonusConditions={mission.objectiveSet?.bonusConditions}
          onReturnToHangar={onReturnToMenu}
        />
      )}

      {phase === GamePhase.DEBRIEF && gameState.gameOver && (
        <GameOver
          targetsDestroyed={gameState.targetsDestroyed}
          totalTargets={mission.targets.length}
          enemiesDestroyed={gameState.enemiesDestroyed}
          onRetryMission={onRetryMission}
          onReturnToHangar={onReturnToMenu}
        />
      )}
    </div>
  );
}

