import * as THREE from 'three';
import type { Target } from '../types/game';

export function createMissionTarget(scene: THREE.Scene, pos: THREE.Vector3, id: string, health: number): Target {
  const group = new THREE.Group();

  const baseGeo = new THREE.CylinderGeometry(10, 15, 20, 4);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  group.add(base);

  const towerGeo = new THREE.BoxGeometry(4, 80, 4);
  const towerMat = new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0xff0000, emissiveIntensity: 0.1 });
  const tower = new THREE.Mesh(towerGeo, towerMat);
  tower.position.y = 40;
  group.add(tower);

  const glowGeo = new THREE.SphereGeometry(3, 8, 8);
  const glowMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 1 });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.position.y = 80;
  group.add(glow);

  const beamGeo = new THREE.CylinderGeometry(0.5, 2, 2000, 8);
  const beamMat = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.2 });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.position.y = 1000;
  group.add(beam);

  group.position.copy(pos);
  group.position.y = 0;
  scene.add(group);

  return { id, position: pos, health, mesh: group, destroyed: false };
}

export function createExtractionZone(scene: THREE.Scene, position: [number, number, number]) {
  const extractionGroup = new THREE.Group();
  const extBaseGeo = new THREE.CylinderGeometry(40, 40, 2, 32);
  const extBaseMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.3 });
  const extBase = new THREE.Mesh(extBaseGeo, extBaseMat);
  extractionGroup.add(extBase);

  const extBeamGeo = new THREE.CylinderGeometry(20, 20, 2000, 32);
  const extBeamMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.1 });
  const extBeam = new THREE.Mesh(extBeamGeo, extBeamMat);
  extBeam.position.y = 1000;
  extractionGroup.add(extBeam);

  extractionGroup.position.set(...position);
  extractionGroup.visible = false;
  scene.add(extractionGroup);
  return extractionGroup;
}
