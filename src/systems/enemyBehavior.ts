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

const GroundThreatController: EnemyBehaviorController = {
  id: 'ground-threat',

  tick(enemy, { playerPosition }) {
    // Stationary — only rotate toward the player.
    enemy.mesh.lookAt(playerPosition);
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
// Controller registry — future controllers register here
// ---------------------------------------------------------------------------

const CONTROLLER_REGISTRY: Record<string, EnemyBehaviorController> = {
  [DefaultAirController.id]: DefaultAirController,
  [GroundThreatController.id]: GroundThreatController,
  [FormationWingController.id]: FormationWingController,
};

/**
 * Returns the behavior controller to use for a given enemy definition.
 * Falls back to DefaultAirController for unknown roles.
 * Future: missions can author a `behaviorControllerId` on EnemyDefinition
 * to assign specialised controllers without touching this function.
 */
export function getControllerForEnemy(def: EnemyDefinition): EnemyBehaviorController {
  if (def.groundThreat) return GroundThreatController;
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
