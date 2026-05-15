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

/** Stage 5c: Builds a bomber-silhouette mesh for airborne mission targets. */
function createBomberTargetModel(): THREE.Group {
  const group = new THREE.Group();

  // Fuselage — long tapered body
  const fuselageGeo = new THREE.BoxGeometry(8, 6, 50);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x555577, roughness: 0.6 });
  const fuselage = new THREE.Mesh(fuselageGeo, bodyMat);
  group.add(fuselage);

  // Nose cone
  const noseGeo = new THREE.ConeGeometry(3.5, 12, 6);
  noseGeo.rotateX(Math.PI / 2);
  const nose = new THREE.Mesh(noseGeo, bodyMat);
  nose.position.z = -31;
  group.add(nose);

  // Wings — wide delta shape approximated as a flat box
  const wingGeo = new THREE.BoxGeometry(90, 2, 22);
  const wingMat = new THREE.MeshStandardMaterial({ color: 0x444466, roughness: 0.7 });
  const wings = new THREE.Mesh(wingGeo, wingMat);
  wings.position.z = 4;
  group.add(wings);

  // Tail fins (horizontal)
  const tailGeo = new THREE.BoxGeometry(30, 2, 8);
  const tail = new THREE.Mesh(tailGeo, wingMat);
  tail.position.z = 22;
  group.add(tail);

  // Vertical tail fin
  const vFinGeo = new THREE.BoxGeometry(2, 12, 8);
  const vFin = new THREE.Mesh(vFinGeo, wingMat);
  vFin.position.set(0, 7, 21);
  group.add(vFin);

  // Engine nacelles (left + right under wings)
  const nacelleMat = new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.5 });
  const nacelleGeo = new THREE.CylinderGeometry(3, 2.5, 16, 6);
  nacelleGeo.rotateX(Math.PI / 2);
  for (const side of [-1, 1]) {
    const nacelle = new THREE.Mesh(nacelleGeo, nacelleMat);
    nacelle.position.set(side * 28, -4, 2);
    group.add(nacelle);

    // Engine glow
    const glowGeo = new THREE.CircleGeometry(2.5, 8);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xff4400, side: THREE.DoubleSide });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.rotation.y = Math.PI / 2;
    glow.position.set(side * 28, -4, 10);
    group.add(glow);
  }

  // Emissive underbelly stripe (threat indicator)
  const stripeGeo = new THREE.BoxGeometry(4, 1, 40);
  const stripeMat = new THREE.MeshBasicMaterial({ color: 0xff2222 });
  const stripe = new THREE.Mesh(stripeGeo, stripeMat);
  stripe.position.set(0, -3.5, 0);
  group.add(stripe);

  return group;
}

/** Stage 5e: Builds a naval patrol craft silhouette — bow at -Z, stern at +Z. */
function createPatrolCraftModel(): THREE.Group {
  const group = new THREE.Group();

  const hullMat = new THREE.MeshStandardMaterial({ color: 0x334455, roughness: 0.72, metalness: 0.38 });
  const superMat = new THREE.MeshStandardMaterial({ color: 0x445566, roughness: 0.68, metalness: 0.30 });
  const accentMat = new THREE.MeshBasicMaterial({ color: 0xffdd44, transparent: true, opacity: 0.85 });
  const wakeMat = new THREE.MeshBasicMaterial({
    color: 0x4488cc,
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  // --- Main hull (tapered flat body) ---
  const hullGeo = new THREE.BoxGeometry(8, 3, 44);
  const hull = new THREE.Mesh(hullGeo, hullMat);
  hull.position.y = 1.5;
  group.add(hull);

  // Bow taper (wedge nose)
  const bowGeo = new THREE.ConeGeometry(3, 8, 4);
  bowGeo.rotateX(-Math.PI / 2);
  const bow = new THREE.Mesh(bowGeo, hullMat);
  bow.position.set(0, 1.5, -26);
  group.add(bow);

  // --- Superstructure (forward) ---
  const superGeo = new THREE.BoxGeometry(6, 5, 12);
  const superstructure = new THREE.Mesh(superGeo, superMat);
  superstructure.position.set(0, 6, -6);
  group.add(superstructure);

  // --- Radar mast ---
  const mastGeo = new THREE.CylinderGeometry(0.3, 0.3, 8, 5);
  const mast = new THREE.Mesh(mastGeo, superMat);
  mast.position.set(0, 13, -4);
  group.add(mast);

  const radarDishGeo = new THREE.CylinderGeometry(2.8, 2.8, 0.5, 8);
  const radarDish = new THREE.Mesh(radarDishGeo, superMat);
  radarDish.position.set(0, 17.5, -4);
  group.add(radarDish);

  // Radar dish warning glow
  const radarGlowMat = new THREE.MeshBasicMaterial({ color: 0xff2222, transparent: true, opacity: 0.55 });
  const radarGlow = new THREE.Mesh(new THREE.SphereGeometry(1.0, 6, 4), radarGlowMat);
  radarGlow.position.set(0, 17.5, -4);
  group.add(radarGlow);

  // --- Stern deck (lower) ---
  const sternDeckGeo = new THREE.BoxGeometry(7, 1.5, 10);
  const sternDeck = new THREE.Mesh(sternDeckGeo, superMat);
  sternDeck.position.set(0, 4.25, 14);
  group.add(sternDeck);

  // --- Engine exhaust ports ---
  const exhaustMat = new THREE.MeshBasicMaterial({ color: 0xff6620, transparent: true, opacity: 0.72 });
  for (const side of [-2, 2]) {
    const exhaustGeo = new THREE.CylinderGeometry(0.8, 1.0, 1.5, 6);
    const exhaust = new THREE.Mesh(exhaustGeo, exhaustMat);
    exhaust.position.set(side, 1.5, 20);
    group.add(exhaust);
  }

  // --- Running lights (port red, starboard green) ---
  const portLightMat = new THREE.MeshBasicMaterial({ color: 0xff2244 });
  const stbdLightMat = new THREE.MeshBasicMaterial({ color: 0x22ff66 });
  const lightGeo = new THREE.SphereGeometry(0.35, 4, 3);
  const portLight = new THREE.Mesh(lightGeo, portLightMat);
  portLight.position.set(-4.2, 3, -8);
  group.add(portLight);
  const stbdLight = new THREE.Mesh(lightGeo, stbdLightMat);
  stbdLight.position.set(4.2, 3, -8);
  group.add(stbdLight);

  // --- Deck accent stripe ---
  const stripeGeo = new THREE.BoxGeometry(7.2, 0.3, 40);
  const stripe = new THREE.Mesh(stripeGeo, accentMat);
  stripe.position.set(0, 3.1, -2);
  group.add(stripe);

  // --- Wake planes (static — trail behind stern in local space) ---
  const wakeGeo = new THREE.PlaneGeometry(18, 28);
  const wakePort = new THREE.Mesh(wakeGeo, wakeMat);
  wakePort.rotation.x = -Math.PI / 2;
  wakePort.rotation.z = 0.28;
  wakePort.position.set(-7, 0.1, 32);
  group.add(wakePort);

  const wakeStbd = new THREE.Mesh(wakeGeo, wakeMat);
  wakeStbd.rotation.x = -Math.PI / 2;
  wakeStbd.rotation.z = -0.28;
  wakeStbd.position.set(7, 0.1, 32);
  group.add(wakeStbd);

  return group;
}

/** Stage 5e: Creates a naval surface target (patrol craft) locked to sea level. */
function createNavalMissionTarget(
  scene: THREE.Scene,
  pos: THREE.Vector3,
  definition: MissionTargetDefinition,
): Target {
  const group = new THREE.Group();
  const craftModel = createPatrolCraftModel();
  group.add(craftModel);

  // Weak points mapped from definition
  const weakPoints: TargetWeakPoint[] = definition.weakPoints?.map(weakPointDef => {
    const weakPointVisual = createWeakPointMesh(weakPointDef, 0xff4422);
    group.add(weakPointVisual.group);
    const localOffset = new THREE.Vector3(...weakPointDef.offset);
    return {
      id: weakPointDef.id,
      label: weakPointDef.label,
      position: pos.clone().add(localOffset),
      localOffset,
      health: weakPointDef.health,
      maxHealth: weakPointDef.health,
      radius: weakPointDef.radius,
      required: weakPointDef.required ?? true,
      destroyed: false,
      mesh: weakPointVisual.group,
      damageMesh: weakPointVisual.damageMesh,
    };
  }) ?? [];

  const waypoint = createTargetWaypointIllustration(0x0090ff);
  group.add(waypoint.group);
  group.userData.waypoint = waypoint;
  group.userData.targetHandles = { weakPoints };

  // Sea-surface lock: preserve XZ, fix Y to sea level
  group.position.set(pos.x, 2, pos.z);
  scene.add(group);

  const seaPos = new THREE.Vector3(pos.x, 2, pos.z);

  return {
    id: definition.id,
    position: seaPos,
    health: definition.health,
    maxHealth: definition.health,
    mesh: group,
    destroyed: false,
    weakPoints,
    setPiece: buildTargetSetPieceRuntime(definition),
    movement: buildTargetMovementRuntime(definition),
  };
}

/** Stage 5c: Creates an airborne mission target (bomber / transport) that preserves Y altitude. */
function createAirborneMissionTarget(
  scene: THREE.Scene,
  pos: THREE.Vector3,
  definition: MissionTargetDefinition,
  _archetype: string,
): Target {
  const group = new THREE.Group();
  const bomberModel = createBomberTargetModel();
  group.add(bomberModel);

  // Health bar (reuse existing helper via group userData path)
  const weakPoints: TargetWeakPoint[] = [];

  const waypoint = createTargetWaypointIllustration(0xff2200);
  group.add(waypoint.group);
  group.userData.waypoint = waypoint;
  group.userData.targetHandles = { weakPoints };

  // Preserve full XYZ from the route position — bomber flies at altitude
  group.position.copy(pos);
  scene.add(group);

  return {
    id: definition.id,
    position: pos,
    health: definition.health,
    maxHealth: definition.health,
    mesh: group,
    destroyed: false,
    weakPoints,
    setPiece: buildTargetSetPieceRuntime(definition),
    movement: buildTargetMovementRuntime(definition),
  };
}

export function createMissionTarget(scene: THREE.Scene, pos: THREE.Vector3, definition: MissionTargetDefinition): Target {
  const archetype = definition.archetype ?? 'tower';
  const isAirborne = archetype === 'bomber' || archetype === 'transport';
  const isNaval = archetype === 'patrol-craft';

  if (isAirborne) {
    return createAirborneMissionTarget(scene, pos, definition, archetype);
  }

  if (isNaval) {
    return createNavalMissionTarget(scene, pos, definition);
  }

  const group = new THREE.Group();

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
