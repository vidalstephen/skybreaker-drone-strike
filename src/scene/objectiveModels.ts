import * as THREE from 'three';
import type { MissionTargetDefinition, MissionWeakPointDefinition, Target, TargetWeakPoint } from '../types/game';
import { buildTargetSetPieceRuntime } from '../systems/setPieceSystem';
import { buildTargetMovementRuntime } from '../systems/targetMovementSystem';
import {
  createExtractionWaypointIllustration,
  createTargetWaypointIllustration,
} from './waypointIllustrations';

export interface TargetVisualHandles {
  damageMesh: THREE.Mesh;
  damageDefaultMaterial: THREE.Material;
  beaconGlow: THREE.Object3D;
  signalBeam: THREE.Object3D;
  finalMeshes: THREE.Object3D[];
}

function createWeakPointMesh(definition: MissionWeakPointDefinition, warningColor = 0xff2a2a): { group: THREE.Group; damageMesh: THREE.Mesh } {
  const group = new THREE.Group();

  const socket = new THREE.Mesh(
    new THREE.BoxGeometry(definition.radius * 1.35, definition.radius * 0.62, 2.2),
    new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.82, metalness: 0.12 }),
  );
  socket.position.z = -1.4;
  group.add(socket);

  const coreMaterial = new THREE.MeshStandardMaterial({
    color: warningColor,
    emissive: warningColor,
    emissiveIntensity: 1.55,
    roughness: 0.48,
    metalness: 0.0,
  });
  const core = new THREE.Mesh(new THREE.SphereGeometry(definition.radius * 0.34, 8, 6), coreMaterial);
  core.userData.defaultMaterial = coreMaterial;
  group.add(core);

  const guard = new THREE.Mesh(
    new THREE.TorusGeometry(definition.radius * 0.56, 0.42, 6, 20),
    new THREE.MeshBasicMaterial({ color: warningColor, transparent: true, opacity: 0.72, depthWrite: false }),
  );
  guard.rotation.x = Math.PI / 2;
  group.add(guard);

  group.position.set(...definition.offset);
  group.userData.defaultScale = group.scale.clone();
  return { group, damageMesh: core };
}

function addFacilityTargetDetails(group: THREE.Group, archetype: MissionTargetDefinition['archetype'], structureMaterial: THREE.Material, accentMaterial: THREE.Material): THREE.Object3D[] {
  const finalMeshes: THREE.Object3D[] = [];

  const plinth = new THREE.Mesh(new THREE.BoxGeometry(30, 8, 22), structureMaterial);
  plinth.position.y = 4;
  group.add(plinth);
  finalMeshes.push(plinth);

  const deck = new THREE.Mesh(new THREE.BoxGeometry(44, 3, 34), structureMaterial);
  deck.position.y = 12;
  group.add(deck);
  finalMeshes.push(deck);

  const railFront = new THREE.Mesh(new THREE.BoxGeometry(36, 1.1, 1), accentMaterial);
  railFront.position.set(0, 16, -17.5);
  group.add(railFront);
  finalMeshes.push(railFront);

  const railBack = railFront.clone();
  railBack.position.z = 17.5;
  group.add(railBack);
  finalMeshes.push(railBack);

  if (archetype === 'relay-spire') {
    const sideCore = new THREE.Mesh(new THREE.BoxGeometry(10, 42, 10), structureMaterial);
    sideCore.position.set(-11, 33, 0);
    group.add(sideCore);
    finalMeshes.push(sideCore);

    const upperDish = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 1.5, 12), accentMaterial);
    upperDish.rotation.z = Math.PI / 2;
    upperDish.position.set(10, 66, -6);
    group.add(upperDish);
    finalMeshes.push(upperDish);
  } else {
    const arrayArm = new THREE.Mesh(new THREE.BoxGeometry(26, 2, 2), accentMaterial);
    arrayArm.position.y = 48;
    group.add(arrayArm);
    finalMeshes.push(arrayArm);

    const serviceBox = new THREE.Mesh(new THREE.BoxGeometry(9, 14, 8), structureMaterial);
    serviceBox.position.set(13, 23, 0);
    group.add(serviceBox);
    finalMeshes.push(serviceBox);
  }

  return finalMeshes;
}

export function createMissionTarget(scene: THREE.Scene, pos: THREE.Vector3, definition: MissionTargetDefinition): Target {
  const group = new THREE.Group();
  const archetype = definition.archetype ?? 'tower';

  const baseGeo = new THREE.CylinderGeometry(10, 15, 20, 4);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.86, metalness: 0.08 });
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

  const structureMaterial = new THREE.MeshStandardMaterial({
    color: archetype === 'relay-spire' ? 0x17110d : 0x101216,
    roughness: 0.86,
    metalness: 0.10,
    emissive: archetype === 'relay-spire' ? 0x120804 : 0x080b10,
    emissiveIntensity: 0.18,
  });
  const accentMaterial = new THREE.MeshStandardMaterial({
    color: archetype === 'relay-spire' ? 0xff8a2a : 0xff5a18,
    emissive: archetype === 'relay-spire' ? 0xff8a2a : 0xff5a18,
    emissiveIntensity: 1.4,
    roughness: 0.55,
  });
  const finalMeshes = [base, tower, glow, beam, ...addFacilityTargetDetails(group, archetype, structureMaterial, accentMaterial)];

  const weakPoints: TargetWeakPoint[] | undefined = definition.weakPoints?.map(weakPointDefinition => {
    const weakPointVisual = createWeakPointMesh(weakPointDefinition, archetype === 'relay-spire' ? 0xff7a2a : 0xff2a2a);
    group.add(weakPointVisual.group);
    finalMeshes.push(weakPointVisual.group);

    const localOffset = new THREE.Vector3(...weakPointDefinition.offset);
    return {
      id: weakPointDefinition.id,
      label: weakPointDefinition.label,
      position: pos.clone().add(localOffset),
      localOffset,
      health: weakPointDefinition.health,
      maxHealth: weakPointDefinition.health,
      radius: weakPointDefinition.radius,
      required: weakPointDefinition.required ?? true,
      destroyed: false,
      mesh: weakPointVisual.group,
      damageMesh: weakPointVisual.damageMesh,
    };
  });

  const handles: TargetVisualHandles = {
    damageMesh: tower,
    damageDefaultMaterial: towerMat,
    beaconGlow: glow,
    signalBeam: beam,
    finalMeshes,
  };
  group.userData.targetHandles = handles;

  const waypoint = createTargetWaypointIllustration(0xff6a18);
  group.add(waypoint.group);
  group.userData.waypoint = waypoint;

  group.position.copy(pos);
  group.position.y = 0;
  scene.add(group);

  return { id: definition.id, position: pos, health: definition.health, maxHealth: definition.health, mesh: group, destroyed: false, weakPoints, setPiece: buildTargetSetPieceRuntime(definition), movement: buildTargetMovementRuntime(definition) };
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

  const waypoint = createExtractionWaypointIllustration(0x00ffff);
  extractionGroup.add(waypoint.group);
  extractionGroup.userData.waypoint = waypoint;
  extractionGroup.userData.rotatingBase = extBase;

  extractionGroup.position.set(...position);
  extractionGroup.visible = false;
  scene.add(extractionGroup);
  return extractionGroup;
}
