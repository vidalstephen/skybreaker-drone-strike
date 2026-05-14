import * as THREE from 'three';
import {
  BASE_SPEED,
  BOOST_MULTIPLIER,
  FINE_CONTROL_SENSITIVITY,
  ROTATION_SPEED,
} from '../config/constants';

const MIN_THROTTLE = 0.58;
const MAX_THROTTLE = 1.22;
const THROTTLE_STEP = 0.018;
const THROTTLE_DECAY = 0.006;
const BRAKE_SPEED_MULTIPLIER = 0.45;
const BANK_TURN_YAW_ASSIST = 1.15;
const BANK_TURN_ROLL_ASSIST = 0.82;
const SHARP_TURN_MULTIPLIER = 1.48;
const YAW_CORRECTION_MULTIPLIER = 0.72;
const HARD_JOYSTICK_TURN = 0.78;

export interface FlightJoystickState {
  x: number;
  y: number;
  active: boolean;
}

export interface FlightActionState {
  boost: boolean;
  brake?: boolean;
  fire: boolean;
  secondary: boolean;
  level: boolean;
}

export interface FineControlState {
  active: boolean;
  deltaX: number;
  deltaY: number;
}

export interface FlightControlState {
  keys: Record<string, boolean>;
  joystick: FlightJoystickState;
  actions: FlightActionState;
  fineControl: FineControlState;
  invertY: boolean;
}

export interface BoostState {
  wantsBoost: boolean;
  canBoost: boolean;
  isBoosting: boolean;
}

export function getBoostState(control: FlightControlState, boostEnergy: number): BoostState {
  const wantsBoost = control.keys['ShiftLeft'] || control.keys['ShiftRight'] || control.actions.boost;
  const canBoost = boostEnergy > 5;
  return { wantsBoost, canBoost, isBoosting: wantsBoost && canBoost };
}

export function consumeBoostEnergy(boostEnergy: number, isBoosting: boolean, dt: number): number {
  return isBoosting ? Math.max(0, boostEnergy - 0.5 * dt) : boostEnergy;
}

export function isBrakeActive(control: FlightControlState): boolean {
  return !!(control.keys['ControlLeft'] || control.keys['ControlRight'] || control.actions.brake);
}

export function updateThrottle(currentThrottle: number, control: FlightControlState, dt: number): number {
  let targetThrottle = currentThrottle;

  if (control.keys['KeyR']) targetThrottle += THROTTLE_STEP * dt;
  if (control.keys['KeyF']) targetThrottle -= THROTTLE_STEP * dt;
  if (!control.keys['KeyR'] && !control.keys['KeyF']) {
    targetThrottle += (1 - targetThrottle) * Math.min(1, THROTTLE_DECAY * dt);
  }

  return THREE.MathUtils.clamp(targetThrottle, MIN_THROTTLE, MAX_THROTTLE);
}

export function getFlightSpeed(isBoosting: boolean, dt: number, throttle = 1, isBraking = false): number {
  const brakeScale = isBraking ? BRAKE_SPEED_MULTIPLIER : 1;
  return BASE_SPEED * throttle * brakeScale * (isBoosting ? BOOST_MULTIPLIER : 1) * dt;
}

export function applyFlightRotation(rotation: THREE.Euler, control: FlightControlState, dt: number): void {
  const invertFactor = control.invertY ? 1 : -1;
  const keyboardTurn = (control.keys['KeyA'] ? 1 : 0) - (control.keys['KeyD'] ? 1 : 0);
  const joystickTurn = control.joystick.active ? -control.joystick.x : 0;
  const turnInput = THREE.MathUtils.clamp(keyboardTurn + joystickTurn, -1, 1);
  const sharpTurn = control.keys['ShiftLeft'] || control.keys['ShiftRight'] || Math.abs(control.joystick.x) > HARD_JOYSTICK_TURN;
  const turnScale = sharpTurn ? SHARP_TURN_MULTIPLIER : 1;
  const yawCorrection = (control.keys['KeyQ'] ? 1 : 0) - (control.keys['KeyE'] ? 1 : 0);

  if (control.keys['KeyW']) rotation.x -= ROTATION_SPEED * invertFactor * dt;
  if (control.keys['KeyS']) rotation.x += ROTATION_SPEED * invertFactor * dt;
  if (control.joystick.active) {
    rotation.x -= control.joystick.y * ROTATION_SPEED * invertFactor * dt;
  }

  if (turnInput !== 0) {
    rotation.y += turnInput * ROTATION_SPEED * BANK_TURN_YAW_ASSIST * turnScale * dt;
    rotation.z += turnInput * ROTATION_SPEED * BANK_TURN_ROLL_ASSIST * dt;
  }

  if (yawCorrection !== 0) {
    rotation.y += yawCorrection * ROTATION_SPEED * YAW_CORRECTION_MULTIPLIER * turnScale * dt;
    rotation.z += yawCorrection * ROTATION_SPEED * 0.24 * dt;
  }

  if (control.fineControl.active) {
    rotation.y -= control.fineControl.deltaX * FINE_CONTROL_SENSITIVITY * dt;
    rotation.x -= control.fineControl.deltaY * FINE_CONTROL_SENSITIVITY * invertFactor * dt;
    control.fineControl.deltaX = 0;
    control.fineControl.deltaY = 0;
  }
}

export function shouldAutoLevel(control: FlightControlState): boolean {
  if (control.keys['KeyX'] || control.actions.level) return true;
  const hasPitch = control.keys['KeyW'] || control.keys['KeyS'] || (control.joystick.active && Math.abs(control.joystick.y) > 0.08);
  const hasTurn = control.keys['KeyA'] || control.keys['KeyD'] || control.keys['KeyQ'] || control.keys['KeyE'] || (control.joystick.active && Math.abs(control.joystick.x) > 0.08);
  return !hasPitch && !hasTurn;
}

export function applyAutoLevel(rotation: THREE.Euler, isActive: boolean, dt: number): void {
  const levelingSpeed = isActive ? Math.pow(0.8, dt) : Math.pow(0.96, dt);
  rotation.x *= levelingSpeed;
  rotation.z *= levelingSpeed;
}

export function getForwardVector(quaternion: THREE.Quaternion): THREE.Vector3 {
  return new THREE.Vector3(0, 0, -1).applyQuaternion(quaternion);
}

export function advancePosition(position: THREE.Vector3, quaternion: THREE.Quaternion, currentSpeed: number): void {
  position.addScaledVector(getForwardVector(quaternion), currentSpeed);
}
