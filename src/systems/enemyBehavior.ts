/**
 * Stage 8a — Enemy Behavior Controller Architecture
 *
 * Separates enemy movement AI from visual/stat definitions.
 * Each enemy is assigned a controller derived from its role; the controller
 * owns the per-tick movement/state logic and returns the active behavior
 * state after each update.
 *
 * Current controllers:
 *   DefaultAirController  — preserves the inline pursue/orbit/retreat logic
 *                           that was in Game.tsx before Stage 8a.
 *   GroundThreatController — stationary emplacements; only face the player.
 *
 * Future controllers (Stage 8b+) can be registered in CONTROLLER_REGISTRY
 * and assigned via a mission's enemy wave entry or via a role default in
 * getControllerForEnemy().
 */

import * as THREE from 'three';
import type { Enemy, EnemyBehaviorStateId, EnemyDefinition } from '../types/game';

// ---------------------------------------------------------------------------
// Context passed to every controller tick
// ---------------------------------------------------------------------------

export interface EnemyAIContext {
  /** Current world position of the player drone. */
  playerPosition: THREE.Vector3;
  /** Monotonic frame counter from the game loop (used for drift oscillation). */
  frameId: number;
  /** Epoch milliseconds at the start of this frame. */
  now: number;
  /** Delta time (delta * 60) — available for future frame-rate-independent controllers.
   *  The default air controller does NOT use dt to preserve existing movement feel. */
  dt: number;
  /** Stage 8b: world position of the formation leader this frame.
   *  Present for wing enemies when the leader is alive; absent for solo enemies and leaders. */
  formationLeaderPosition?: THREE.Vector3;
}

// ---------------------------------------------------------------------------
// Controller interface
// ---------------------------------------------------------------------------

export interface EnemyBehaviorController {
  readonly id: string;
  /**
   * Update the enemy's mesh position and orientation in place.
   * Returns the behavior state that best describes what the enemy is doing
   * this frame (used for HUD/debug and future conditional logic).
   * Must not fire projectiles — firing is handled by Game.tsx using
   * enemy.lastFireTime and enemy.definition.fireCooldownMs.
   */
  tick(enemy: Enemy, context: EnemyAIContext): EnemyBehaviorStateId;
}

// ---------------------------------------------------------------------------
// Default air controller — preserves the original Game.tsx inline behavior
// ---------------------------------------------------------------------------

const DefaultAirController: EnemyBehaviorController = {
  id: 'default-air',

  tick(enemy, { playerPosition, frameId }) {
    const toPlayer = playerPosition.clone().sub(enemy.mesh.position);
    const dist = toPlayer.length();
    toPlayer.normalize();

    const { maxRange, minRange, speed, drift } = enemy.definition;

    // Pursue when too far; retreat when too close.
    if (dist > maxRange) {
      enemy.mesh.position.addScaledVector(toPlayer, speed);
    } else if (dist < minRange) {
      enemy.mesh.position.addScaledVector(toPlayer, -speed * 0.5);
    }

    // Lateral oscillation drift (frame-rate coupled, matches original behavior).
    const driftVec = new THREE.Vector3(Math.cos(frameId * 0.01), Math.sin(frameId * 0.02), 0);
    driftVec.applyQuaternion(enemy.mesh.quaternion);
    enemy.mesh.position.addScaledVector(driftVec, drift);

    // Always face the player.
    enemy.mesh.lookAt(playerPosition);

    // Classify behavior state for observers.
    if (dist > maxRange) return 'pursue';
    if (dist < minRange) return 'retreat';
    return 'orbit';
  },
};

// ---------------------------------------------------------------------------
// Ground threat controller — stationary emplacements
// ---------------------------------------------------------------------------

/** Minimum cooldown (ms) before the telegraph window is applied. Rapid-fire units (< threshold) skip telegraph. */
const GROUND_TELEGRAPH_THRESHOLD_MS = 1500;
/** Duration of the pre-fire telegraph window in ms. */
const GROUND_TELEGRAPH_MS = 1000;

const GroundThreatController: EnemyBehaviorController = {
  id: 'ground-threat',

  tick(enemy, { playerPosition, now }) {
    // Stationary — only rotate toward the player.
    enemy.mesh.lookAt(playerPosition);

    // Stage 8c: telegraph — return 'pre-fire' in the final window before each shot.
    // Skip for rapid-fire units (cooldown < threshold) where the window would dominate.
    const cooldown = enemy.definition.fireCooldownMs;
    if (cooldown >= GROUND_TELEGRAPH_THRESHOLD_MS) {
      const readyIn = cooldown - (now - enemy.lastFireTime);
      if (readyIn > 0 && readyIn <= GROUND_TELEGRAPH_MS) return 'pre-fire';
    }

    return 'guard';
  },
};

// ---------------------------------------------------------------------------
// Stage 8b: Formation wing controller — follows leader with an offset
// ---------------------------------------------------------------------------

const FormationWingController: EnemyBehaviorController = {
  id: 'formation-wing',

  tick(enemy, { playerPosition, frameId, formationLeaderPosition }) {
    // If the leader has been destroyed, fall back to solo pursuit.
    if (!formationLeaderPosition) {
      return DefaultAirController.tick(enemy, { playerPosition, frameId, now: 0, dt: 0 });
    }

    const { speed, drift } = enemy.definition;

    // Target: leader position + pre-computed spawn offset.
    const targetPos = formationLeaderPosition.clone().add(enemy.formationOffset);
    const toTarget = targetPos.clone().sub(enemy.mesh.position);
    const dist = toTarget.length();
    toTarget.normalize();

    // Chase the slot position. Tighter engagement range than the default controller.
    const SLOT_FAR = 32;
    const SLOT_NEAR = 10;
    if (dist > SLOT_FAR) {
      enemy.mesh.position.addScaledVector(toTarget, speed * 1.25);
    } else if (dist > SLOT_NEAR) {
      enemy.mesh.position.addScaledVector(toTarget, speed * 0.65);
    }

    // Lateral drift — halved relative to solo AI to preserve tight formation shape.
    const driftVec = new THREE.Vector3(Math.cos(frameId * 0.01), Math.sin(frameId * 0.02), 0);
    driftVec.applyQuaternion(enemy.mesh.quaternion);
    enemy.mesh.position.addScaledVector(driftVec, drift * 0.5);

    // Always face the player (maintains threat readability).
    enemy.mesh.lookAt(playerPosition);

    return 'patrol';
  },
};

// ---------------------------------------------------------------------------
// Stage 8c: Naval surface controller — ships patrol the sea surface
// ---------------------------------------------------------------------------

/** Duration of the pre-fire telegraph window for naval units (ms). */
const NAVAL_TELEGRAPH_MS = 1200;

const NavalSurfaceController: EnemyBehaviorController = {
  id: 'naval-surface',

  tick(enemy, { playerPosition, now }) {
    // Lock to sea surface — Y never changes.
    enemy.mesh.position.y = 0;

    const { maxRange, minRange, speed } = enemy.definition;

    // Compute XZ-plane direction toward player (ignore altitude).
    const toPlayer = new THREE.Vector3(
      playerPosition.x - enemy.mesh.position.x,
      0,
      playerPosition.z - enemy.mesh.position.z,
    );
    const dist = toPlayer.length();
    toPlayer.normalize();

    // Advance or retreat along the sea surface only.
    if (dist > maxRange) {
      enemy.mesh.position.addScaledVector(toPlayer, speed);
    } else if (dist < minRange) {
      enemy.mesh.position.addScaledVector(toPlayer, -speed * 0.5);
    }

    // Yaw only — ships don't pitch or roll toward the player.
    const lookTarget = new THREE.Vector3(playerPosition.x, enemy.mesh.position.y, playerPosition.z);
    enemy.mesh.lookAt(lookTarget);

    // Stage 8c: pre-fire telegraph window.
    const readyIn = enemy.definition.fireCooldownMs - (now - enemy.lastFireTime);
    if (readyIn > 0 && readyIn <= NAVAL_TELEGRAPH_MS) return 'pre-fire';

    if (dist > maxRange) return 'pursue';
    if (dist < minRange) return 'retreat';
    return 'patrol';
  },
};

// ---------------------------------------------------------------------------
// Stage 8e: Boss phase controller — multi-phase behavior for mini-boss role
// ---------------------------------------------------------------------------

/** HP ratio thresholds that trigger phase escalation. */
const BOSS_PHASE2_HP_RATIO = 0.60;
const BOSS_PHASE3_HP_RATIO = 0.30;
/** HP ratio at which the boss abandons combat and retreats off-map. */
const BOSS_RETREAT_HP_RATIO = 0.15;
/** Duration (ms) of the expose vulnerability window after each phase transition. */
const BOSS_EXPOSE_DURATION_MS = 1800;

const BossPhaseController: EnemyBehaviorController = {
  id: 'boss-phase',

  tick(enemy, { playerPosition, frameId, now }) {
    const maxHp = enemy.definition.health;
    const hpRatio = enemy.health / maxHp;

    // Determine target phase from current HP.
    const targetPhase: 1 | 2 | 3 =
      hpRatio > BOSS_PHASE2_HP_RATIO ? 1
      : hpRatio > BOSS_PHASE3_HP_RATIO ? 2
      : 3;

    // Initialise phase on first tick and escalate on phase change.
    if (!enemy.bossPhase) enemy.bossPhase = 1;
    if (targetPhase > enemy.bossPhase) {
      enemy.bossPhase = targetPhase;
      enemy.bossExposeUntil = now + BOSS_EXPOSE_DURATION_MS;
    }

    // Expose window — boss stops advancing and becomes vulnerable.
    if (enemy.bossExposeUntil && now < enemy.bossExposeUntil) {
      enemy.mesh.lookAt(playerPosition);
      return 'boss-expose';
    }

    // Retreat at critical HP — moves away from player at high speed.
    if (hpRatio <= BOSS_RETREAT_HP_RATIO) {
      const awayFromPlayer = enemy.mesh.position.clone().sub(playerPosition).normalize();
      enemy.mesh.position.addScaledVector(awayFromPlayer, enemy.definition.speed * 2.2);
      enemy.mesh.lookAt(playerPosition);
      return 'boss-retreat';
    }

    // Phase-specific engagement.
    const { maxRange, minRange, speed, drift } = enemy.definition;
    const toPlayer = playerPosition.clone().sub(enemy.mesh.position);
    const dist = toPlayer.length();
    toPlayer.normalize();

    // Higher phases tighten the engagement envelope and increase aggression.
    const speedMult = enemy.bossPhase === 3 ? 1.85 : enemy.bossPhase === 2 ? 1.40 : 1.0;
    const rangeMult = enemy.bossPhase === 3 ? 0.70 : enemy.bossPhase === 2 ? 0.85 : 1.0;
    const effectiveMax = maxRange * rangeMult;
    const effectiveMin = minRange * rangeMult;

    if (dist > effectiveMax) {
      enemy.mesh.position.addScaledVector(toPlayer, speed * speedMult);
    } else if (dist < effectiveMin && enemy.bossPhase < 3) {
      // Phase 3: no retreat — pure aggression.
      enemy.mesh.position.addScaledVector(toPlayer, -speed * 0.5);
    }

    // Slow drift oscillation (more deliberate than standard air enemies).
    const driftVec = new THREE.Vector3(Math.cos(frameId * 0.008), Math.sin(frameId * 0.015), 0);
    driftVec.applyQuaternion(enemy.mesh.quaternion);
    enemy.mesh.position.addScaledVector(driftVec, drift);

    enemy.mesh.lookAt(playerPosition);

    if (enemy.bossPhase === 3) return 'boss-phase-3';
    if (enemy.bossPhase === 2) return 'boss-phase-2';
    return 'boss-phase-1';
  },
};

// ---------------------------------------------------------------------------
// Controller registry — future controllers register here
// ---------------------------------------------------------------------------

const CONTROLLER_REGISTRY: Record<string, EnemyBehaviorController> = {
  [DefaultAirController.id]: DefaultAirController,
  [GroundThreatController.id]: GroundThreatController,
  [FormationWingController.id]: FormationWingController,
  [NavalSurfaceController.id]: NavalSurfaceController,
  [BossPhaseController.id]: BossPhaseController,
};

/**
 * Returns the behavior controller to use for a given enemy definition.
 * Falls back to DefaultAirController for unknown roles.
 * Future: missions can author a `behaviorControllerId` on EnemyDefinition
 * to assign specialised controllers without touching this function.
 */
export function getControllerForEnemy(def: EnemyDefinition): EnemyBehaviorController {
  if (def.navalThreat) return NavalSurfaceController;
  if (def.groundThreat) return GroundThreatController;
  // Stage 8e: mini-boss uses the multi-phase boss controller.
  if (def.role === 'mini-boss') return BossPhaseController;
  return DefaultAirController;
}

/**
 * Main per-frame update entry point called by Game.tsx.
 * Updates the enemy mesh in place and returns the new behavior state.
 *
 * Stage 8b: formation wings are routed to FormationWingController when their
 * leader is alive (formationLeaderPosition present in context). When the
 * leader is destroyed, wings fall back to DefaultAirController automatically.
 */
export function tickEnemyBehavior(enemy: Enemy, context: EnemyAIContext): EnemyBehaviorStateId {
  if (enemy.formationRole === 'wing' && context.formationLeaderPosition) {
    return FormationWingController.tick(enemy, context);
  }
  const controller = getControllerForEnemy(enemy.definition);
  return controller.tick(enemy, context);
}

// Re-export for external use (e.g. future validator scripts).
export type { EnemyBehaviorStateId };
