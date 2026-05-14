import * as THREE from 'three';

export interface CombatResources {
  boltGeo: THREE.CylinderGeometry;
  missileGeo: THREE.ConeGeometry;
  playerBoltMat: THREE.MeshBasicMaterial;
  secondaryBoltMat: THREE.MeshBasicMaterial;
  enemyBoltMat: THREE.MeshBasicMaterial;
  explosionMat: THREE.MeshBasicMaterial;
}

export function createCombatResources(): CombatResources {
  return {
    boltGeo: new THREE.CylinderGeometry(0.05, 0.05, 8, 4),
    missileGeo: new THREE.ConeGeometry(0.45, 5, 8),
    playerBoltMat: new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending }),
    secondaryBoltMat: new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending }),
    enemyBoltMat: new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending }),
    explosionMat: new THREE.MeshBasicMaterial({ color: 0xff7700, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending }),
  };
}

export function disposeCombatResources(resources: CombatResources) {
  resources.boltGeo.dispose();
  resources.missileGeo.dispose();
  resources.playerBoltMat.dispose();
  resources.secondaryBoltMat.dispose();
  resources.enemyBoltMat.dispose();
  resources.explosionMat.dispose();
}

function scaledCount(base: number, effectScale: number, minimum = 1): number {
  return Math.max(minimum, Math.round(base * Math.max(0.35, effectScale)));
}

function createAdditiveMaterial(color: number, opacity: number): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

function addScatterDebris(group: THREE.Group, count: number, radius: number, color: number): void {
  for (let index = 0; index < count; index += 1) {
    const shard = new THREE.Mesh(
      new THREE.BoxGeometry(Math.random() * 2.4 + 1, Math.random() * 1.4 + 0.6, Math.random() * 2.4 + 1),
      createAdditiveMaterial(color, 0.72),
    );
    shard.position.set(
      (Math.random() - 0.5) * radius,
      (Math.random() - 0.15) * radius * 0.55,
      (Math.random() - 0.5) * radius,
    );
    shard.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    group.add(shard);
  }
}

function addSmokeColumn(group: THREE.Group, count: number, height: number, color = 0x2f2a24): void {
  for (let index = 0; index < count; index += 1) {
    const puff = new THREE.Mesh(
      new THREE.SphereGeometry(4 + Math.random() * 5, 7, 5),
      createAdditiveMaterial(color, 0.28),
    );
    puff.position.set(
      (Math.random() - 0.5) * 14,
      index * (height / Math.max(1, count - 1)) + Math.random() * 5,
      (Math.random() - 0.5) * 14,
    );
    group.add(puff);
  }
}

export function createSetPieceComponentBreakEffect(position: THREE.Vector3, effectScale: number): THREE.Group {
  const group = new THREE.Group();
  group.position.copy(position);

  const flash = new THREE.Mesh(
    new THREE.SphereGeometry(5.5 * Math.max(0.6, effectScale), 10, 8),
    createAdditiveMaterial(0xff8a2a, 0.86),
  );
  group.add(flash);

  const sparks = scaledCount(8, effectScale, 3);
  addScatterDebris(group, sparks, 18 * Math.max(0.7, effectScale), 0xffaa44);
  addSmokeColumn(group, scaledCount(3, effectScale, 1), 16 * Math.max(0.7, effectScale));

  return group;
}

export function createSetPiecePhaseChangeEffect(position: THREE.Vector3, effectScale: number): THREE.Group {
  const group = new THREE.Group();
  group.position.copy(position);

  const shockRing = new THREE.Mesh(
    new THREE.TorusGeometry(18 * Math.max(0.65, effectScale), 0.9, 8, 40),
    createAdditiveMaterial(0xffd166, 0.55),
  );
  shockRing.rotation.x = Math.PI / 2;
  group.add(shockRing);

  const verticalPulse = new THREE.Mesh(
    new THREE.CylinderGeometry(1.4, 7, 36 * Math.max(0.7, effectScale), 12),
    createAdditiveMaterial(0xff7a2a, 0.24),
  );
  verticalPulse.position.y = 14;
  group.add(verticalPulse);

  addScatterDebris(group, scaledCount(6, effectScale, 2), 24 * Math.max(0.7, effectScale), 0xff7a2a);
  return group;
}

export function createSetPieceFinalDestructionEffect(position: THREE.Vector3, effectScale: number): THREE.Group {
  const group = new THREE.Group();
  group.position.copy(position);

  const blast = new THREE.Mesh(
    new THREE.SphereGeometry(14 * Math.max(0.7, effectScale), 10, 8),
    createAdditiveMaterial(0xff5a18, 0.76),
  );
  blast.position.y = 8;
  group.add(blast);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(28 * Math.max(0.65, effectScale), 1.2, 8, 48),
    createAdditiveMaterial(0xffaa44, 0.42),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 5;
  group.add(ring);

  addScatterDebris(group, scaledCount(12, effectScale, 4), 46 * Math.max(0.7, effectScale), 0xff7a2a);
  addSmokeColumn(group, scaledCount(7, effectScale, 2), 46 * Math.max(0.7, effectScale), 0x403326);

  return group;
}
