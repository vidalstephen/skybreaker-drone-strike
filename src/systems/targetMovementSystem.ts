import * as THREE from 'three';
import type { MissionTargetDefinition, Target, TargetMovementRuntimeState, TargetRouteWaypointDefinition } from '../types/game';

export interface TargetMovementUpdate {
  moved: boolean;
  routeCompleted: boolean;
  failedMission: boolean;
  message?: string;
}

function toVector(waypoint: TargetRouteWaypointDefinition): THREE.Vector3 {
  return new THREE.Vector3(...waypoint.position);
}

function samePoint(a: THREE.Vector3, b: THREE.Vector3): boolean {
  return a.distanceToSquared(b) < 0.01;
}

function syncTargetWorldPosition(target: Target, position: THREE.Vector3): void {
  target.position.copy(position);
  target.mesh.position.copy(position);
  target.weakPoints?.forEach(weakPoint => {
    weakPoint.position.copy(target.position).add(weakPoint.localOffset);
  });
}

export function buildTargetMovementRuntime(target: MissionTargetDefinition): TargetMovementRuntimeState | undefined {
  const movement = target.movement;
  if (!movement || movement.route.length === 0) return undefined;

  const start = new THREE.Vector3(...target.position);
  const authoredRoute = movement.route.map(toVector);
  const route = samePoint(start, authoredRoute[0]) ? authoredRoute : [start, ...authoredRoute];
  const routeHoldMs = samePoint(start, authoredRoute[0])
    ? movement.route.map(waypoint => waypoint.holdMs ?? 0)
    : [0, ...movement.route.map(waypoint => waypoint.holdMs ?? 0)];
  if (route.length < 2) return undefined;

  return {
    route,
    routeHoldMs,
    speed: movement.speed ?? movement.route[0]?.speed ?? 40,
    loopMode: movement.loopMode ?? 'once',
    startDelayMs: movement.startDelayMs ?? 0,
    endBehavior: movement.endBehavior ?? 'stop',
    escapeMessage: movement.escapeMessage,
    currentWaypointIndex: 0,
    direction: 1,
    holdMsRemaining: routeHoldMs[0] ?? 0,
    elapsedMs: 0,
    completed: false,
  };
}

function getNextWaypointIndex(movement: TargetMovementRuntimeState): number | null {
  const nextIndex = movement.currentWaypointIndex + movement.direction;
  if (nextIndex >= 0 && nextIndex < movement.route.length) return nextIndex;

  if (movement.loopMode === 'loop') {
    return movement.direction > 0 ? 0 : movement.route.length - 1;
  }

  if (movement.loopMode === 'ping-pong') {
    movement.direction = movement.direction === 1 ? -1 : 1;
    const reversedIndex = movement.currentWaypointIndex + movement.direction;
    return reversedIndex >= 0 && reversedIndex < movement.route.length ? reversedIndex : null;
  }

  return null;
}

function waypointHoldMs(target: Target, waypointIndex: number): number {
  return target.movement?.routeHoldMs[waypointIndex] ?? 0;
}

export function updateTargetMovement(target: Target, deltaSeconds: number): TargetMovementUpdate {
  const movement = target.movement;
  if (!movement || target.destroyed || movement.completed) {
    return { moved: false, routeCompleted: false, failedMission: false };
  }

  movement.elapsedMs += deltaSeconds * 1000;
  if (movement.elapsedMs < movement.startDelayMs) {
    return { moved: false, routeCompleted: false, failedMission: false };
  }

  if (movement.holdMsRemaining > 0) {
    movement.holdMsRemaining = Math.max(0, movement.holdMsRemaining - deltaSeconds * 1000);
    return { moved: false, routeCompleted: false, failedMission: false };
  }

  let travelRemaining = movement.speed * deltaSeconds;
  let moved = false;

  while (travelRemaining > 0 && !movement.completed) {
    const nextIndex = getNextWaypointIndex(movement);
    if (nextIndex === null) {
      movement.completed = true;
      return {
        moved,
        routeCompleted: true,
        failedMission: movement.endBehavior === 'fail-mission',
        message: movement.escapeMessage,
      };
    }

    const targetPosition = movement.route[nextIndex];
    const toWaypoint = targetPosition.clone().sub(target.position);
    const distance = toWaypoint.length();

    if (distance <= travelRemaining || distance < 0.01) {
      syncTargetWorldPosition(target, targetPosition);
      movement.currentWaypointIndex = nextIndex;
      movement.holdMsRemaining = waypointHoldMs(target, nextIndex);
      travelRemaining -= distance;
      moved = true;
      if (movement.holdMsRemaining > 0) break;
    } else {
      const nextPosition = target.position.clone().addScaledVector(toWaypoint.normalize(), travelRemaining);
      syncTargetWorldPosition(target, nextPosition);
      travelRemaining = 0;
      moved = true;
    }
  }

  return { moved, routeCompleted: false, failedMission: false };
}