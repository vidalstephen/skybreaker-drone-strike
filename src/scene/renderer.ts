import * as THREE from 'three';
import {
  STREAK_COUNT,
  STREAK_INNER_RADIUS,
  STREAK_LENGTH,
  STREAK_OPACITY_BOOST,
  STREAK_OPACITY_CRUISE,
  STREAK_OPACITY_FAST,
  STREAK_OUTER_RADIUS,
  STREAK_WIDTH,
} from '../config/constants';
import type { MissionEnvironmentDefinition } from '../types/game';

export interface GraphicsProfile {
  pixelRatio: number;
  antialias: boolean;
  effectScale: number;
  fogScale: number;
}

export function createGameScene(environment: MissionEnvironmentDefinition, graphicsProfile: GraphicsProfile) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(environment.skyDepth.topColor);
  scene.fog = new THREE.Fog(environment.fogProfile.color, environment.fogProfile.near, environment.fogProfile.far * graphicsProfile.fogScale);
  return scene;
}

export function createGameCamera(width: number, height: number) {
  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.set(0, 5, 10);
  return camera;
}

export function createGameRenderer(canvas: HTMLCanvasElement, graphicsProfile: GraphicsProfile) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: graphicsProfile.antialias,
    powerPreference: 'high-performance',
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, graphicsProfile.pixelRatio));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  return renderer;
}

export function createSpeedStreaks(graphicsProfile: GraphicsProfile) {
  const streaksGroup = new THREE.Group();
  const streakGeo = new THREE.BoxGeometry(STREAK_WIDTH, STREAK_WIDTH, STREAK_LENGTH);
  const streakMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.0 });
  const streakCount = Math.max(8, Math.round(STREAK_COUNT * graphicsProfile.effectScale));

  for (let i = 0; i < streakCount; i++) {
    const streak = new THREE.Mesh(streakGeo, streakMat);
    const angle = Math.random() * Math.PI * 2;
    const radius = STREAK_INNER_RADIUS + Math.random() * (STREAK_OUTER_RADIUS - STREAK_INNER_RADIUS);
    streak.position.set(
      Math.cos(angle) * radius,
      Math.sin(angle) * (radius * 0.6),
      -10 - Math.random() * 40
    );
    streaksGroup.add(streak);
  }

  return streaksGroup;
}

export const SPEED_STREAK_OPACITY = {
  boost: STREAK_OPACITY_BOOST,
  cruise: STREAK_OPACITY_CRUISE,
  fast: STREAK_OPACITY_FAST,
};
