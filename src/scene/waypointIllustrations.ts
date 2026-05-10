import * as THREE from 'three';

export interface WaypointIllustrationHandles {
  group: THREE.Group;
  groundRing?: THREE.Mesh;
  pulseRing?: THREE.Mesh;
  approachRing?: THREE.Mesh;
  verticalStem?: THREE.Mesh;
  beaconCap?: THREE.Object3D;
  chevrons?: THREE.Object3D[];
}

export interface WaypointAnimationState {
  elapsed: number;
  cameraPosition?: THREE.Vector3;
  active?: boolean;
}

function createAdditiveMaterial(color: number, opacity: number): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}

function createFlatRing(innerRadius: number, outerRadius: number, color: number, opacity: number, segments = 64): THREE.Mesh {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(innerRadius, outerRadius, segments),
    createAdditiveMaterial(color, opacity),
  );
  ring.rotation.x = -Math.PI / 2;
  return ring;
}

function createChevron(color: number, opacity: number): THREE.Group {
  const group = new THREE.Group();
  const material = createAdditiveMaterial(color, opacity);
  const left = new THREE.Mesh(new THREE.BoxGeometry(7, 0.7, 1.4), material);
  const right = new THREE.Mesh(new THREE.BoxGeometry(7, 0.7, 1.4), material);
  left.position.x = -2.6;
  right.position.x = 2.6;
  left.rotation.y = Math.PI / 5;
  right.rotation.y = -Math.PI / 5;
  group.add(left, right);
  return group;
}

function createTargetClassIcon(color: number): THREE.Group {
  const icon = new THREE.Group();
  const material = createAdditiveMaterial(color, 0.9);
  const barW = 5.2;
  const barH = 0.8;
  const barD = 0.8;

  const top = new THREE.Mesh(new THREE.BoxGeometry(barW, barH, barD), material);
  top.position.y = 3.2;
  const bottom = top.clone();
  bottom.position.y = -3.2;

  const left = new THREE.Mesh(new THREE.BoxGeometry(barH, barW, barD), material);
  left.position.x = -3.2;
  const right = left.clone();
  right.position.x = 3.2;

  icon.add(top, bottom, left, right);
  icon.rotation.z = Math.PI / 4;
  return icon;
}

export function createTargetWaypointIllustration(color = 0xff6a18): WaypointIllustrationHandles {
  const group = new THREE.Group();

  const groundRing = createFlatRing(16, 18, color, 0.58);
  groundRing.position.y = 0.35;
  group.add(groundRing);

  const pulseRing = createFlatRing(24, 26, color, 0.22);
  pulseRing.position.y = 0.32;
  group.add(pulseRing);

  const approachRing = createFlatRing(33, 34.5, color, 0.14);
  approachRing.position.y = 0.30;
  group.add(approachRing);

  const stemMaterial = createAdditiveMaterial(color, 0.5);
  const verticalStem = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 78, 8), stemMaterial);
  verticalStem.position.y = 39;
  group.add(verticalStem);

  const cap = new THREE.Group();
  const capRing = new THREE.Mesh(new THREE.TorusGeometry(8.5, 0.45, 8, 32), createAdditiveMaterial(color, 0.82));
  capRing.rotation.x = Math.PI / 2;
  cap.add(capRing);
  const capIcon = createTargetClassIcon(color);
  cap.add(capIcon);
  cap.position.y = 86;
  cap.userData.baseY = cap.position.y;
  group.add(cap);

  const chevrons: THREE.Object3D[] = [];
  for (let i = 0; i < 3; i++) {
    const chevron = createChevron(color, 0.32 - i * 0.06);
    chevron.position.set(0, 1.2 + i * 0.05, -22 - i * 11);
    chevron.rotation.x = -Math.PI / 2;
    chevron.userData.baseZ = chevron.position.z;
    group.add(chevron);
    chevrons.push(chevron);
  }

  group.userData.kind = 'target-waypoint';
  return { group, groundRing, pulseRing, approachRing, verticalStem, beaconCap: cap, chevrons };
}

export function createExtractionWaypointIllustration(color = 0x00ffff): WaypointIllustrationHandles {
  const group = new THREE.Group();

  const groundRing = createFlatRing(38, 42, color, 0.44, 96);
  groundRing.position.y = 0.65;
  group.add(groundRing);

  const pulseRing = createFlatRing(52, 55, color, 0.20, 96);
  pulseRing.position.y = 0.58;
  group.add(pulseRing);

  const approachRing = createFlatRing(70, 72, color, 0.12, 96);
  approachRing.position.y = 0.52;
  group.add(approachRing);

  const padMaterial = createAdditiveMaterial(color, 0.38);
  const laneA = new THREE.Mesh(new THREE.BoxGeometry(72, 0.55, 2.2), padMaterial);
  laneA.position.y = 0.8;
  const laneB = laneA.clone();
  laneB.rotation.y = Math.PI / 2;
  group.add(laneA, laneB);

  const verticalStem = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.9, 96, 8), createAdditiveMaterial(color, 0.36));
  verticalStem.position.y = 48;
  group.add(verticalStem);

  const beaconCap = new THREE.Group();
  const torus = new THREE.Mesh(new THREE.TorusGeometry(13, 0.55, 8, 36), createAdditiveMaterial(color, 0.75));
  torus.rotation.x = Math.PI / 2;
  beaconCap.add(torus);

  const arrow = new THREE.Group();
  const arrowMat = createAdditiveMaterial(color, 0.85);
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.8, 13), arrowMat);
  const headL = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.8, 8), arrowMat);
  const headR = headL.clone();
  headL.position.set(-2.7, 0, -5.4);
  headR.position.set(2.7, 0, -5.4);
  headL.rotation.y = -Math.PI / 4;
  headR.rotation.y = Math.PI / 4;
  arrow.add(shaft, headL, headR);
  arrow.rotation.x = Math.PI / 2;
  beaconCap.add(arrow);

  beaconCap.position.y = 72;
  beaconCap.userData.baseY = beaconCap.position.y;
  group.add(beaconCap);

  const chevrons: THREE.Object3D[] = [];
  for (let i = 0; i < 4; i++) {
    const chevron = createChevron(color, 0.44 - i * 0.07);
    chevron.position.set(0, 1.1 + i * 0.04, -42 - i * 13);
    chevron.rotation.x = -Math.PI / 2;
    chevron.userData.baseZ = chevron.position.z;
    group.add(chevron);
    chevrons.push(chevron);
  }

  group.userData.kind = 'extraction-waypoint';
  return { group, groundRing, pulseRing, approachRing, verticalStem, beaconCap, chevrons };
}

export function updateWaypointIllustration(handles: WaypointIllustrationHandles, state: WaypointAnimationState): void {
  const elapsed = state.elapsed;
  const active = state.active ?? true;

  const pulseScale = 1 + (Math.sin(elapsed * 2.4) + 1) * 0.08;
  const activeAlpha = active ? 1 : 0.55;

  if (handles.groundRing) {
    handles.groundRing.rotation.z = -elapsed * 0.18;
  }

  if (handles.pulseRing) {
    handles.pulseRing.scale.setScalar(pulseScale);
    const material = handles.pulseRing.material as THREE.MeshBasicMaterial;
    material.opacity = (0.18 + (Math.sin(elapsed * 2.4) + 1) * 0.05) * activeAlpha;
  }

  if (handles.approachRing) {
    handles.approachRing.rotation.z = elapsed * 0.11;
    handles.approachRing.scale.setScalar(1 + (Math.sin(elapsed * 1.35 + 0.7) + 1) * 0.04);
  }

  if (handles.verticalStem) {
    const material = handles.verticalStem.material as THREE.MeshBasicMaterial;
    material.opacity = (0.24 + (Math.sin(elapsed * 3.1) + 1) * 0.08) * activeAlpha;
  }

  if (handles.beaconCap) {
    handles.beaconCap.rotation.y = elapsed * 0.55;
    handles.beaconCap.position.y = (handles.beaconCap.userData.baseY ?? handles.beaconCap.position.y) + Math.sin(elapsed * 2.2) * 0.55;
  }

  handles.chevrons?.forEach((chevron, index) => {
    chevron.position.z = (chevron.userData.baseZ ?? chevron.position.z) + Math.sin(elapsed * 2.8 + index) * 1.2;
    chevron.scale.setScalar(1 + (Math.sin(elapsed * 3.4 + index * 0.8) + 1) * 0.045);
  });

  if (state.cameraPosition) {
    const distance = handles.group.getWorldPosition(new THREE.Vector3()).distanceTo(state.cameraPosition);
    const distanceScale = THREE.MathUtils.clamp(distance / 720, 0.72, 1.42);
    handles.group.scale.setScalar(distanceScale);
  }
}
