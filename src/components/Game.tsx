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
import { Compass, Crosshair, Objectives, Radar, SpeedDisplay, TargetMarkers, Vitals } from './hud';
import { GameOver, MissionComplete, OutOfBoundsWarning } from './overlays';

// --- Phase 1: types and constants live in dedicated modules ---
import {
  BASE_SPEED,
  CAMERA_LERP,
  BOOST_FOV,
  NORMAL_FOV,
  EXPLOSION_RADIUS_MIN,
  EXPLOSION_RADIUS_MAX,
  EXPLOSION_SCATTER,
  HIT_FLASH_EMISSIVE,
  MIN_MARKER_SPACING,
} from '../config/constants';
import { expandEnemyWave } from '../config/enemies';
import { DEFAULT_PRIMARY_WEAPON, getUnlockedWeapons } from '../config/weapons';
import type { AudioCue } from '../hooks/useAudio';
import {
  SPEED_STREAK_OPACITY,
  createCombatResources,
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
  isBrakeActive,
  shouldAutoLevel,
  updateThrottle,
  type FlightControlState,
} from '../systems/flightPhysics';
import { calculateMissionResult, formatMissionObjective } from '../systems/missionSystem';
import { calculateScreenPosition } from '../systems/targetingProjection';
import { GamePhase, type AppSettings, type CampaignProgress, type MissionCompletionResult, type MissionDefinition, type Target, type TargetWeakPoint, type Enemy, type Projectile, type Explosion, type GameState, type WeaponDefinition } from '../types/game';

function getTargetVisualHandles(target: Target): TargetVisualHandles | undefined {
  return target.mesh.userData.targetHandles as TargetVisualHandles | undefined;
}

function getActiveWeakPoints(target: Target): TargetWeakPoint[] {
  return target.weakPoints?.filter(weakPoint => !weakPoint.destroyed) ?? [];
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
}

function areRequiredWeakPointsDestroyed(target: Target): boolean {
  const requiredWeakPoints = target.weakPoints?.filter(weakPoint => weakPoint.required) ?? [];
  return requiredWeakPoints.length > 0 && requiredWeakPoints.every(weakPoint => weakPoint.destroyed);
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
  const initialWeapons = getUnlockedWeapons(progress);
  const initialPrimaryWeapon = initialWeapons.find(weapon => weapon.slot === 'PRIMARY') ?? DEFAULT_PRIMARY_WEAPON;
  const initialSecondaryWeapon = initialWeapons.find(weapon => weapon.slot === 'SECONDARY') ?? null;
  
  // Game state for UI
  const [gameState, setGameState] = useState<GameState>({
    health: 100,
    shields: 100,
    energy: 100,
    speed: 0,
    fps: 60,
    boosting: false,
    score: 0,
    objective: formatMissionObjective(mission, 0),
    targetsDestroyed: 0,
    outOfBounds: false,
    cameraMode: 'CHASE',
    message: 'READY FOR SORTIE',
    missionComplete: false,
    gameOver: false,
    missionResult: null,
    enemiesDestroyed: 0,
    activeWeaponLabel: initialPrimaryWeapon.label,
    secondaryWeaponLabel: initialSecondaryWeapon?.label ?? 'Locked',
    secondaryReady: !!initialSecondaryWeapon,
    secondaryLockLabel: initialSecondaryWeapon?.lockRequired ? 'NO AIR TARGET' : 'READY',
    secondaryLockProgress: 0,
    secondaryLockAcquired: !initialSecondaryWeapon?.lockRequired,
    secondaryLockHasTarget: false,
    startTime: Date.now(),
    lockedTargetId: null,
    settings: {
      invertY: settings.invertY,
    },
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
  });

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
  const navigationLockRef = useRef<string | null>(null);
  const secondaryLockRef = useRef<{ candidateEnemyId: string | null; lockedEnemyId: string | null; startedAt: number }>({
    candidateEnemyId: null,
    lockedEnemyId: null,
    startedAt: 0,
  });
  const lastFireTime = useRef(0);
  const lastSecondaryFireTime = useRef(0);
  const lastSecondaryAttemptTime = useRef(0);
  const hitTimeRef = useRef(0);
  const muzzleFlashTimeRef = useRef(0);
  const muzzleFlashRef = useRef<THREE.Mesh | null>(null);
  const targetsRef = useRef<Target[]>([]);
  const boundaryRef = useRef<number>(1500);
  const enemiesSpawned = useRef(false);
  const extractionMeshRef = useRef<THREE.Group | null>(null);
  const extractionScreenPosRef = useRef<{x: number, y: number, visible: boolean, offScreen: boolean, angle: number}>({ x: 0, y: 0, visible: false, offScreen: false, angle: 0 });
  const lastDamageTime = useRef(0);
  const fpsSample = useRef({ frames: 0, elapsed: 0, value: 60 });
  const currentSystems = useRef({ shields: 100, energy: 100, health: 100 });
  const cameraShake = useRef(0);
  const [damageFlash, setDamageFlash] = useState(false);

  // Flight variables
  const velocity = useRef(new THREE.Vector3(0, 0, -BASE_SPEED));
  const rotation = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const touchJoystick = useRef({ x: 0, y: 0, active: false, identifier: -1 });
  const touchActions = useRef({ boost: false, brake: false, fire: false, secondary: false, level: false });
  const fineControlRef = useRef({ active: false, lastX: 0, lastY: 0, deltaX: 0, deltaY: 0 });
  const wasBoosting = useRef(false);
  const throttleRef = useRef(1);

  const setNavigationLock = (id: string | null) => {
    navigationLockRef.current = id;
    setGameState(prev => ({ ...prev, lockedTargetId: id }));
  };

  const cycleNavigationLock = () => {
    const availableLocks = targetsRef.current
      .filter(target => !target.destroyed)
      .map(target => target.id);

    if (gameLogicRef.current.targetsDestroyed >= mission.targets.length && extractionMeshRef.current) {
      availableLocks.push('EXTRACTION');
    }

    if (availableLocks.length === 0) {
      setNavigationLock(null);
      return;
    }

    const currentIndex = navigationLockRef.current ? availableLocks.indexOf(navigationLockRef.current) : -1;
    setNavigationLock(availableLocks[(currentIndex + 1) % availableLocks.length]);
  };

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
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });

  const handleJoystick = (e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    if (!touchJoystick.current.active) return;
    
    let clientX, clientY;
    
    if ('touches' in e) {
      // Find the specific touch that started on the joystick
      const touch = Array.from(e.touches).find(t => (t as React.Touch).identifier === touchJoystick.current.identifier) as React.Touch | undefined;
      if (!touch) return;
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    
    const radius = rect.width / 2;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > radius) {
      dx *= radius / distance;
      dy *= radius / distance;
    }
    
    setJoystickPos({ x: dx, y: dy });
    touchJoystick.current.x = dx / radius;
    touchJoystick.current.y = dy / radius;
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
      if ((e.code === 'Tab' || e.code === 'KeyT') && !e.repeat && phaseRef.current === GamePhase.IN_MISSION && !gameLogicRef.current.missionComplete && !gameLogicRef.current.gameOver) {
        e.preventDefault();
        cycleNavigationLock();
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
    const hullFailure = mission.failureConditions.find(condition => condition.id === 'hull-depleted');
    const unlockedWeapons = getUnlockedWeapons(progress);
    const primaryWeapon = unlockedWeapons.find(weapon => weapon.slot === 'PRIMARY') ?? DEFAULT_PRIMARY_WEAPON;
    const secondaryWeapon = unlockedWeapons.find(weapon => weapon.slot === 'SECONDARY') ?? null;
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

    // --- Extraction Zone ---
    extractionMeshRef.current = createExtractionZone(scene, mission.extraction.position);

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
          currentSystems.current.shields = Math.min(100, currentSystems.current.shields + 0.1 * dt);
        }

        // Energy Regeneration
        currentSystems.current.energy = Math.min(100, currentSystems.current.energy + 0.2 * dt);

        // --- Controls & Energy Consumption ---
        const flightControls: FlightControlState = {
          keys,
          joystick: touchJoystick.current,
          actions: touchActions.current,
          fineControl: fineControlRef.current,
          invertY: gameLogicRef.current.invertY,
        };
        const { isBoosting } = getBoostState(flightControls, currentSystems.current.energy);
        const isBraking = isBrakeActive(flightControls);

        const screenShakeScale = settingsRef.current.screenShake / 100;

        if (isBoosting && !wasBoosting.current) {
          // Add mild camera shake on boost activation
          cameraShake.current = Math.max(cameraShake.current, 0.4 * screenShakeScale);
        }
        wasBoosting.current = isBoosting;

        currentSystems.current.energy = consumeBoostEnergy(currentSystems.current.energy, isBoosting, dt);
  throttleRef.current = updateThrottle(throttleRef.current, flightControls, dt);

  const currentSpeed = getFlightSpeed(isBoosting, dt, throttleRef.current, isBraking);

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

        // --- Autopilot Logic: Guide to Locked Target ---
        const navigationLockId = navigationLockRef.current;
        if (navigationLockId) {
          let targetPos: THREE.Vector3 | null = null;
          if (navigationLockId === 'EXTRACTION') {
            targetPos = extractionMeshRef.current?.position || null;
          } else {
            const target = targetsRef.current.find(t => t.id === navigationLockId && !t.destroyed);
            targetPos = target?.position || null;
          }

          if (targetPos) {
            const dronePos = droneRef.current.position;
            const targetDir = targetPos.clone().sub(dronePos).normalize();
            
            // Create a dummy matrix to extract target rotation
            const dummy = new THREE.Object3D();
            dummy.position.copy(dronePos);
            dummy.lookAt(targetPos);
            
            // SLowly lerp current rotation towards target dir
            droneRef.current.quaternion.slerp(dummy.quaternion, 0.02 * dt);
            
            // Sync internal rotation ref to new orientation
            rotation.current.setFromQuaternion(droneRef.current.quaternion, 'YXZ');

            // If we are facing the target closely, unlock
            const currentDir = new THREE.Vector3(0, 0, -1).applyQuaternion(droneRef.current.quaternion);
            if (currentDir.dot(targetDir) > 0.99) {
              setNavigationLock(null);
            }
          } else {
            setNavigationLock(null);
          }
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
          currentSystems.current.shields = Math.max(0, currentSystems.current.shields - activeHazard.shieldDrainPerSecond * delta);
          currentSystems.current.energy = Math.max(0, currentSystems.current.energy - activeHazard.energyDrainPerSecond * delta);
        }

        // Weapon Firing Logic
        const updateSecondaryLock = (weapon: WeaponDefinition | null) => {
          if (!weapon) return { enemy: null as Enemy | null, acquired: false, label: 'LOCKED', progress: 0, hasTarget: false };
          if (!weapon.lockRequired) return { enemy: null as Enemy | null, acquired: true, label: 'READY', progress: 1, hasTarget: false };
          if (!droneRef.current) return { enemy: null as Enemy | null, acquired: false, label: 'NO AIR TARGET', progress: 0, hasTarget: false };

          const range = weapon.lockRange ?? 700;
          const cone = weapon.lockCone ?? 0.8;
          const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(droneRef.current.quaternion).normalize();
          const dronePosition = droneRef.current.position;
          let bestEnemy: Enemy | null = null;
          let bestScore = -Infinity;

          enemiesRef.current.forEach(enemy => {
            if (enemy.destroyed) return;
            const toEnemy = enemy.mesh.position.clone().sub(dronePosition);
            const distance = toEnemy.length();
            if (distance > range || distance <= 0) return;
            const dot = forward.dot(toEnemy.normalize());
            if (dot < cone) return;
            const score = dot - (distance / range) * 0.18;
            if (score > bestScore) {
              bestScore = score;
              bestEnemy = enemy;
            }
          });

          if (!bestEnemy) {
            secondaryLockRef.current = { candidateEnemyId: null, lockedEnemyId: null, startedAt: 0 };
            return { enemy: null as Enemy | null, acquired: false, label: 'NO AIR TARGET', progress: 0, hasTarget: false };
          }

          if (secondaryLockRef.current.candidateEnemyId !== bestEnemy.id) {
            secondaryLockRef.current = { candidateEnemyId: bestEnemy.id, lockedEnemyId: null, startedAt: now };
          }

          const acquireMs = weapon.lockAcquireMs ?? 500;
          const progress = THREE.MathUtils.clamp((now - secondaryLockRef.current.startedAt) / acquireMs, 0, 1);
          const acquired = progress >= 1;
          if (acquired) secondaryLockRef.current.lockedEnemyId = bestEnemy.id;

          return {
            enemy: bestEnemy,
            acquired,
            progress,
            hasTarget: true,
            label: acquired ? `LOCKED ${bestEnemy.label.toUpperCase()}` : `LOCKING ${bestEnemy.label.toUpperCase()}`,
          };
        };

        const secondaryLock = updateSecondaryLock(secondaryWeapon);

        const fireProjectile = (weapon: WeaponDefinition, secondary: boolean, targetEnemy?: Enemy | null) => {
          if (!sharedResources.current || !droneRef.current) return;
          const projectile = new THREE.Mesh(
            secondary ? sharedResources.current.missileGeo : sharedResources.current.boltGeo,
            secondary ? sharedResources.current.secondaryBoltMat : sharedResources.current.playerBoltMat
          );
          projectile.position.copy(droneRef.current.position);
          projectile.quaternion.copy(droneRef.current.quaternion);
          projectile.rotateX(Math.PI / 2);

          const projectileVelocity = new THREE.Vector3(0, 0, -weapon.projectileSpeed).applyQuaternion(droneRef.current.quaternion).multiplyScalar(dt);

          scene.add(projectile);
          projectilesRef.current.push({
            mesh: projectile,
            velocity: projectileVelocity,
            life: weapon.projectileLife / dt,
            damage: weapon.damage,
            weaponId: weapon.id,
            targetEnemyId: targetEnemy?.id,
            trackingSpeed: targetEnemy ? weapon.projectileSpeed : undefined,
            turnRate: targetEnemy ? weapon.turnRate : undefined,
            blastRadius: weapon.blastRadius,
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
          if (secondaryWeapon.lockRequired && (!secondaryLock.acquired || !secondaryLock.enemy)) {
            if (now - lastSecondaryAttemptTime.current > 500) {
              lastSecondaryAttemptTime.current = now;
              setGameState(prev => ({ ...prev, message: secondaryLock.enemy ? 'MISSILE SEEKER ACQUIRING' : 'NO AIR TARGET LOCK' }));
            }
            touchActions.current.secondary = false;
          } else {
            lastSecondaryFireTime.current = now;
            currentSystems.current.energy = Math.max(0, currentSystems.current.energy - secondaryWeapon.energyCost);
            cameraShake.current = Math.max(cameraShake.current, 0.35 * screenShakeScale);
            muzzleFlashTimeRef.current = now;
            onSound('secondary-fire');
            setGameState(prev => ({ ...prev, message: `${secondaryWeapon.label.toUpperCase()} AWAY // ${secondaryLock.enemy?.label.toUpperCase() ?? 'DIRECT'}` }));
            fireProjectile(secondaryWeapon, true, secondaryLock.enemy);
            touchActions.current.secondary = false;
          }
        }

        // Spawn Enemies Trigger
        if (gameLogicRef.current.targetsDestroyed >= mission.enemyWave.triggerTargetsDestroyed && !enemiesSpawned.current) {
          enemiesSpawned.current = true;
          setGameState(prev => ({ ...prev, message: mission.enemyWave.message }));
          
          const waveDefinitions = expandEnemyWave(mission.enemyWave.composition).slice(0, mission.enemyWave.count);
          waveDefinitions.forEach(enemyDefinition => {
            const enemyGroup = createEnemyModel(enemyDefinition);
            const spawnPos = droneRef.current.position.clone().add(new THREE.Vector3(
              (Math.random() - 0.5) * 400,
              50,
              (Math.random() - 0.5) * 400
            ));
            enemyGroup.position.copy(spawnPos);
            scene.add(enemyGroup);
            enemiesRef.current.push({
              id: `enemy_${enemySequenceRef.current++}`,
              role: enemyDefinition.role,
              label: enemyDefinition.label,
              mesh: enemyGroup,
              health: enemyDefinition.health,
              shields: enemyDefinition.shields,
              destroyed: false,
              velocity: new THREE.Vector3(),
              lastFireTime: 0,
              definition: enemyDefinition,
            });
          });
        }

        // Update Enemies AI
        enemiesRef.current = enemiesRef.current.filter(enemy => {
          if (enemy.destroyed) return false;

          const toPlayer = droneRef.current!.position.clone().sub(enemy.mesh.position);
          const dist = toPlayer.length();
          toPlayer.normalize();

          // Move towards player but keep role-defined distance
          if (dist > enemy.definition.maxRange) {
            enemy.mesh.position.addScaledVector(toPlayer, enemy.definition.speed);
          } else if (dist < enemy.definition.minRange) {
            enemy.mesh.position.addScaledVector(toPlayer, -enemy.definition.speed * 0.5);
          }
          
          // Orbit/drift
          const drift = new THREE.Vector3(Math.cos(frameIdRef.current * 0.01), Math.sin(frameIdRef.current * 0.02), 0);
          drift.applyQuaternion(enemy.mesh.quaternion);
          enemy.mesh.position.addScaledVector(drift, enemy.definition.drift);

          enemy.mesh.lookAt(droneRef.current!.position);

          // Enemy Firing
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
              const result = calculateMissionResult(mission, {
                elapsedMs,
                targetsDestroyed: gameLogicRef.current.targetsDestroyed,
                enemiesDestroyed: gameLogicRef.current.enemiesDestroyed,
                health: Math.round(currentSystems.current.health),
              });
              console.log('[Mission] Extraction complete — mission success');
              setGameState(prev => ({
                ...prev,
                health: result.health,
                missionComplete: true,
                missionResult: result,
                message: 'EXTRACTION CONFIRMED',
                objective: mission.extraction.completionObjective,
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
          if (!p.isEnemy && p.targetEnemyId && p.trackingSpeed) {
            const trackedEnemy = enemiesRef.current.find(enemy => enemy.id === p.targetEnemyId && !enemy.destroyed);
            if (trackedEnemy) {
              const desiredVelocity = trackedEnemy.mesh.position.clone().sub(p.mesh.position).normalize().multiplyScalar(p.trackingSpeed * dt);
              p.velocity.lerp(desiredVelocity, Math.min(1, (p.turnRate ?? 0.08) * dt));
              p.mesh.lookAt(trackedEnemy.mesh.position);
              p.mesh.rotateX(Math.PI / 2);
            }
          }

          const projectileStart = p.mesh.position.clone();
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
                    const weakPointExplosion = new THREE.Group();
                    for (let i = 0; i < 5; i++) {
                      const partGeo = new THREE.SphereGeometry(Math.random() * 2 + 1.4, 4, 4);
                      const part = new THREE.Mesh(partGeo, sharedResources.current?.explosionMat || new THREE.MeshBasicMaterial({ color: 0xff7700 }));
                      part.position.set((Math.random()-0.5)*14, (Math.random()-0.5)*14, (Math.random()-0.5)*14);
                      weakPointExplosion.add(part);
                    }
                    weakPointExplosion.position.copy(weakPointImpact.position);
                    scene.add(weakPointExplosion);
                    explosionsRef.current.push({ mesh: weakPointExplosion, life: 18, maxLife: 18 });

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
                  setTimeout(() => {
                    if (!target.destroyed && targetHandles?.damageMesh) {
                      targetHandles.damageMesh.material = targetHandles.damageDefaultMaterial;
                    }
                  }, 50);
                }

                if ((target.health <= 0 || areRequiredWeakPointsDestroyed(target)) && !target.destroyed) {
                  // Guard: only destroy once — prevents double-count from simultaneous hits
                  target.destroyed = true;
                  onSound('success');
                  target.health = 0;
                  const explosionGroup = new THREE.Group();
                  for(let i=0; i<8; i++) {
                    const partGeo = new THREE.SphereGeometry(Math.random() * (EXPLOSION_RADIUS_MAX - EXPLOSION_RADIUS_MIN) + EXPLOSION_RADIUS_MIN, 4, 4);
                    // Use shared material
                    const part = new THREE.Mesh(partGeo, sharedResources.current?.explosionMat || new THREE.MeshBasicMaterial({ color: 0xff7700 }));
                    part.position.set((Math.random()-0.5)*EXPLOSION_SCATTER*2, (Math.random()-0.5)*EXPLOSION_SCATTER*2, (Math.random()-0.5)*EXPLOSION_SCATTER*2);
                    explosionGroup.add(part);
                  }
                  explosionGroup.position.copy(target.mesh.position);
                  explosionGroup.position.y += 40;
                  scene.add(explosionGroup);
                  explosionsRef.current.push({ mesh: explosionGroup, life: 30, maxLife: 30 });
                  const finalMeshes = targetHandles?.finalMeshes ?? [target.mesh.children[1], target.mesh.children[2], target.mesh.children[3]];
                  finalMeshes.forEach(finalMesh => { finalMesh.visible = false; });
                  const waypoint = target.mesh.userData.waypoint as WaypointIllustrationHandles | undefined;
                  if (waypoint) waypoint.group.visible = false;
                  
                  // Recalculate destroyed count from source of truth to avoid double-count
                  const newCount = targetsRef.current.filter(t => t.destroyed).length;
                  gameLogicRef.current.targetsDestroyed = newCount;
                  console.log(`[Mission] Target destroyed: ${target.id} | Total: ${newCount}/${mission.targets.length}`);
                  
                  if (newCount >= mission.targets.length) {
                    const msg = mission.allTargetsDestroyedMessage;
                    setGameState(prev => ({ ...prev, targetsDestroyed: newCount, objective: mission.extraction.activationObjective, message: msg }));
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
                if (enemy.shields > 0) {
                  const absorbed = Math.min(enemy.shields, p.damage);
                  enemy.shields -= absorbed;
                  enemy.health -= p.damage - absorbed;
                  setGameState(prev => ({ ...prev, message: `${enemy.label.toUpperCase()} SHIELDS HIT` }));
                } else {
                  enemy.health -= p.damage;
                }
                
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
                  if (secondaryLockRef.current.lockedEnemyId === enemy.id || secondaryLockRef.current.candidateEnemyId === enemy.id) {
                    secondaryLockRef.current = { candidateEnemyId: null, lockedEnemyId: null, startedAt: 0 };
                  }
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
 
        // Dynamic FOV for boost
        const targetFov = isBoosting ? BOOST_FOV : NORMAL_FOV;
        cameraRef.current.fov += (targetFov - cameraRef.current.fov) * Math.min(1, 0.05 * dt);
        cameraRef.current.updateProjectionMatrix();

        // --- HUD Indicator Projection ---
        const widthHalf = window.innerWidth / 2;
        const heightHalf = window.innerHeight / 2;

        const allMarkers: { id: string, pos: { x: number, y: number, offScreen: boolean, angle: number } }[] = [];

        targetsRef.current.forEach(t => {
          if (t.destroyed) {
            t.screenPos = { x: 0, y: 0, visible: false };
            return;
          }
          
          const targetWorldPos = t.position.clone().add(new THREE.Vector3(0, 40, 0));
          const posInfo = calculateScreenPosition(targetWorldPos, cameraRef.current!, 40, t.screenPos?.offScreen, t.screenPos?.angle);

          let screenX = posInfo.x;
          let screenY = posInfo.y;

          if (t.screenPos?.visible) {
             const didSwitch = posInfo.offScreen !== t.screenPos.offScreen;
             screenX = didSwitch ? posInfo.x : t.screenPos.x + (posInfo.x - t.screenPos.x) * 0.5;
             screenY = didSwitch ? posInfo.y : t.screenPos.y + (posInfo.y - t.screenPos.y) * 0.5;
          }
          
          t.screenPos = { ...posInfo, x: screenX, y: screenY, visible: true };
          allMarkers.push({ id: t.id, pos: t.screenPos });
        });

        // Compute extraction point
        if (gameLogicRef.current.targetsDestroyed >= mission.targets.length && extractionMeshRef.current) {
          const extWorldPos = extractionMeshRef.current.position;
          const extPrev = extractionScreenPosRef.current;
          const posInfo = calculateScreenPosition(extWorldPos, cameraRef.current!, 40, extPrev?.offScreen, extPrev?.angle);

          let screenX = posInfo.x;
          let screenY = posInfo.y;

          if (extPrev?.visible) {
             const didSwitch = posInfo.offScreen !== extPrev.offScreen;
             screenX = didSwitch ? posInfo.x : extPrev.x + (posInfo.x - extPrev.x) * 0.5;
             screenY = didSwitch ? posInfo.y : extPrev.y + (posInfo.y - extPrev.y) * 0.5;
          }
          
          extractionScreenPosRef.current = { ...posInfo, x: screenX, y: screenY, visible: true };
          allMarkers.push({ id: 'EXTRACTION', pos: extractionScreenPosRef.current });
        } else {
          extractionScreenPosRef.current = { x: 0, y: 0, visible: false, offScreen: false, angle: 0 };
        }

        // Overlap Avoidance for Off-Screen Markers
        const offScreenMarkers = allMarkers.filter(m => m.pos.offScreen);
        for (let i = 0; i < offScreenMarkers.length; i++) {
          for (let j = i + 1; j < offScreenMarkers.length; j++) {
            const m1 = offScreenMarkers[i];
            const m2 = offScreenMarkers[j];
            
            const dx = m1.pos.x - m2.pos.x;
            const dy = m1.pos.y - m2.pos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            const minSpacing = MIN_MARKER_SPACING;
            if (dist < minSpacing && dist > 0.01) {
              // Extraction gets priority, meaning objective markers push away from it
              const pushFactor = (minSpacing - dist) / 2;
              const pushX = (dx / dist) * pushFactor;
              const pushY = (dy / dist) * pushFactor;
              
              if (m1.id === 'EXTRACTION') {
                m2.pos.x -= pushX * 2;
                m2.pos.y -= pushY * 2;
              } else if (m2.id === 'EXTRACTION') {
                m1.pos.x += pushX * 2;
                m1.pos.y += pushY * 2;
              } else {
                m1.pos.x += pushX;
                m1.pos.y += pushY;
                m2.pos.x -= pushX;
                m2.pos.y -= pushY;
              }
            }
          }
        }

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
            const secondaryReady = !!secondaryWeapon && now - lastSecondaryFireTime.current > secondaryWeapon.cooldownMs && currentSystems.current.energy > secondaryWeapon.energyCost && (!secondaryWeapon.lockRequired || secondaryLock.acquired);
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
            activeWeaponLabel: primaryWeapon.label,
            secondaryWeaponLabel: secondaryWeapon?.label ?? 'Locked',
            secondaryReady,
            secondaryLockLabel: secondaryWeapon ? secondaryLock.label : 'LOCKED',
            secondaryLockProgress: secondaryWeapon?.lockRequired ? secondaryLock.progress : 0,
            secondaryLockAcquired: secondaryWeapon?.lockRequired ? secondaryLock.acquired : false,
            secondaryLockHasTarget: secondaryWeapon?.lockRequired ? secondaryLock.hasTarget : false,
            message: activeHazard ? activeHazard.message : prev.message,
            aimScreenPos: { x: aimScreenX, y: aimScreenY },
            droneScreenPos: { x: droneScreenX, y: droneScreenY }
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

      <div className="absolute inset-0 pointer-events-none z-20 p-3 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex flex-col justify-between sm:p-5 md:p-8" style={{ transform: `scale(${hudScale})`, transformOrigin: 'center center' }}>
        
        {gameState.outOfBounds && <OutOfBoundsWarning />}
        
        {/* HUD: Top Bar */}
        <div className="flex justify-between items-start gap-3">
          <div className="flex min-w-0 max-w-[46vw] flex-col gap-1 sm:max-w-none">
            <div className="text-[8px] uppercase tracking-[0.18em] text-orange-500 font-bold sm:text-[10px] sm:tracking-[0.3em]">System Status: Active</div>
            <h1 className="hidden text-3xl font-light tracking-tighter italic font-serif sm:block">
              SKYBREAKER <span className="font-black tracking-normal text-orange-500">DRONE STRIKE</span>
            </h1>
            <div className="flex gap-2 mt-1">
              <div className="text-[9px] uppercase tracking-widest bg-orange-500 text-black px-2 font-bold select-none">
                {gameState.cameraMode} VIEW
              </div>
            </div>
            {settings.showTelemetry && <div className="text-[8px] text-white/35 font-mono uppercase tracking-[0.12em] mt-1 sm:text-[9px] sm:tracking-[0.18em]">{settings.graphicsQuality} // {gameState.fps} FPS</div>}
          </div>

          {/* Compass Inserted Here */}
          <div className="absolute left-1/2 -translate-x-1/2 top-[calc(0.75rem+env(safe-area-inset-top))] sm:top-6 md:top-12 z-50">
            <Compass rotationY={rotation.current.y} />
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-1 mb-1 sm:gap-2 sm:mb-2">
              <button 
                onClick={() => {
                  onSettingsChange({ ...settings, invertY: !settings.invertY });
                }}
                className="pointer-events-auto min-h-8 bg-black/60 border border-white/20 hover:border-orange-500 px-2 py-1 text-[7px] tracking-[0.12em] text-white uppercase font-bold transition-colors sm:px-3 sm:text-[8px] sm:tracking-widest"
                title="Toggle Joystick Inversion"
              >
                INV_Y: {gameState.settings.invertY ? '[ON]' : '[OFF]'}
              </button>
              <button 
                onClick={toggleCameraMode}
                className="pointer-events-auto min-h-8 bg-black/60 border border-white/20 hover:border-orange-500 px-3 py-1 text-[8px] tracking-widest text-white uppercase font-bold transition-colors md:hidden"
              >
                VIEW
              </button>
            </div>
            <div className="hidden items-center gap-4 bg-black/40 border border-white/10 px-4 py-2 backdrop-blur-md rounded-sm sm:flex">
              <div className="flex flex-col items-end">
                <span className="text-[9px] uppercase tracking-widest text-white/50 font-mono">Connection</span>
                <span className="text-xs font-mono text-emerald-400">STABLE (14ms)</span>
              </div>
              <div className="w-px h-6 bg-white/20"></div>
              <div className="flex flex-col items-end">
                <span className="text-[9px] uppercase tracking-widest text-white/50 font-mono">Battery</span>
                <span className="text-xs font-mono">88%</span>
              </div>
            </div>
            
            {/* Relocated Radar */}
            <div className="mt-1 origin-top-right scale-[0.68] md:mt-2 md:scale-100">
              <Radar 
                dronePos={droneRef.current?.position || new THREE.Vector3()} 
                targets={targetsRef.current} 
                enemies={enemiesRef.current} 
                rotationY={rotation.current.y}
                extractionPos={extractionMeshRef.current?.position}
                extractionActive={gameState.targetsDestroyed >= mission.targets.length}
              />
            </div>
          </div>
        </div>

        <TargetMarkers
          targets={targetsRef.current}
          dronePosition={droneRef.current?.position}
          lockedTargetId={gameState.lockedTargetId}
          extractionActive={gameLogicRef.current.targetsDestroyed >= mission.targets.length}
          extractionScreenPosition={extractionScreenPosRef.current}
          extractionPosition={extractionMeshRef.current?.position}
          onToggleLock={(id) => setNavigationLock(navigationLockRef.current === id ? null : id)}
        />

        <Crosshair
          cameraMode={gameLogicRef.current.cameraMode}
          boosting={gameState.boosting}
          aligned={gameState.aligned}
          recoil={gameState.recoil}
          firing={gameState.firing}
          hitConfirmed={gameState.hitConfirmed}
          secondaryLockProgress={gameState.secondaryLockProgress}
          secondaryLockAcquired={gameState.secondaryLockAcquired}
          secondaryLockHasTarget={gameState.secondaryLockHasTarget}
          aimScreenPos={gameState.aimScreenPos}
          droneScreenPos={gameState.droneScreenPos}
        />

        {/* HUD: Bottom Layout */}
        <div className="mission-bottom-hud absolute inset-x-3 bottom-[calc(8.25rem+env(safe-area-inset-bottom))] pointer-events-none z-20 sm:inset-x-5 sm:bottom-40 md:inset-x-12 md:bottom-12">
          <div className="flex w-full flex-col items-stretch gap-2 md:flex-row md:items-end md:justify-between">
            <div className="flex items-end justify-between gap-2 md:flex-col md:items-start md:gap-6">
              <SpeedDisplay speed={gameState.speed} boosting={gameState.boosting} />
              <Vitals shields={currentSystems.current.shields} energy={currentSystems.current.energy} health={currentSystems.current.health} />
            </div>

            <Objectives
              objective={gameState.objective}
              enemiesDestroyed={gameState.enemiesDestroyed}
              message={gameState.message}
              activeWeaponLabel={gameState.activeWeaponLabel}
              secondaryWeaponLabel={gameState.secondaryWeaponLabel}
              secondaryReady={gameState.secondaryReady}
              secondaryLockLabel={gameState.secondaryLockLabel}
            />
          </div>
        </div>

      </div>

      {/* --- TOUCH CONTROLS (Overlay) --- */}
      <div className="touch-controls absolute inset-x-0 bottom-0 pointer-events-none z-40 justify-between px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] items-end" style={{ transform: `scale(${touchControlsScale})`, transformOrigin: 'bottom center' }}>
        
        {/* Left Side: Joystick */}
        <div 
          className="touch-joystick pointer-events-auto relative w-24 h-24 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm flex items-center justify-center sm:w-32 sm:h-32"
          onTouchStart={(e) => { 
            const touch = e.touches[e.touches.length - 1];
            touchJoystick.current.active = true; 
            touchJoystick.current.identifier = touch.identifier;
            handleJoystick(e); 
          }}
          onTouchMove={handleJoystick}
          onTouchEnd={(e) => { 
            // Only stop if the specific touch ended
            const touchEnded = Array.from(e.changedTouches).some(t => (t as React.Touch).identifier === touchJoystick.current.identifier);
            if (touchEnded) {
              touchJoystick.current.active = false; 
              touchJoystick.current.identifier = -1;
              touchJoystick.current.x = 0; 
              touchJoystick.current.y = 0; 
              setJoystickPos({ x: 0, y: 0 }); 
            }
          }}
          onMouseDown={(e) => { touchJoystick.current.active = true; handleJoystick(e as any); }}
          onMouseMove={(e) => { if (touchJoystick.current.active) handleJoystick(e as any); }}
          onMouseUp={() => { 
            touchJoystick.current.active = false; 
            touchJoystick.current.x = 0; 
            touchJoystick.current.y = 0; 
            setJoystickPos({ x: 0, y: 0 }); 
          }}
          onMouseLeave={() => {
            if (touchJoystick.current.active) {
              touchJoystick.current.active = false;
              touchJoystick.current.x = 0;
              touchJoystick.current.y = 0;
              setJoystickPos({ x: 0, y: 0 });
            }
          }}
        >
          <div 
            className="touch-joystick-knob w-9 h-9 rounded-full bg-orange-500 shadow-[0_0_15px_rgba(242,125,38,0.5)] border border-white/20 transition-transform duration-75 sm:w-12 sm:h-12"
            style={{ transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)` }}
          />
          {/* Guides */}
          <div className="absolute w-full h-[1px] bg-white/5" />
          <div className="absolute h-full w-[1px] bg-white/5" />
        </div>

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
              className="touch-action-small w-11 h-11 rounded-full border border-cyan-400/20 bg-cyan-400/10 active:bg-cyan-300 text-cyan-200 active:text-black flex items-center justify-center font-bold tracking-widest text-[7px] transition-colors sm:w-12 sm:h-12 sm:text-[8px]"
              onClick={cycleNavigationLock}
            >
              LOCK
            </button>
            <button 
              className="touch-action-small w-11 h-11 rounded-full border border-white/10 bg-white/5 active:bg-white text-white active:text-black flex items-center justify-center font-bold tracking-widest text-[7px] transition-colors sm:w-12 sm:h-12 sm:text-[8px]"
              onTouchStart={() => touchActions.current.level = true}
              onTouchEnd={() => touchActions.current.level = false}
            >
              LEVEL
            </button>
            <button 
              className="touch-action-small w-11 h-11 rounded-full border border-white/10 bg-white/5 active:bg-white text-white active:text-black flex items-center justify-center font-bold tracking-widest text-[7px] transition-colors sm:w-12 sm:h-12 sm:text-[8px]"
              onClick={toggleCameraMode}
            >
              VIEW
            </button>
          </div>
        </div>
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

