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
// Controller registry — future controllers register here
// ---------------------------------------------------------------------------

const CONTROLLER_REGISTRY: Record<string, EnemyBehaviorController> = {
  [DefaultAirController.id]: DefaultAirController,
  [GroundThreatController.id]: GroundThreatController,
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
 */
export function tickEnemyBehavior(enemy: Enemy, context: EnemyAIContext): EnemyBehaviorStateId {
  const controller = getControllerForEnemy(enemy.definition);
  return controller.tick(enemy, context);
}

// Re-export for external use (e.g. future validator scripts).
export type { EnemyBehaviorStateId };
