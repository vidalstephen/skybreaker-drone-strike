import * as THREE from 'three';
import type { EnemyDefinition } from '../types/game';

export function createEnemyModel(enemyDefinition: EnemyDefinition) {
  if (enemyDefinition.groundThreat) {
    return createGroundThreatModel(enemyDefinition);
  }

  const enemyGroup = new THREE.Group();
  const eBodyGeo = new THREE.BoxGeometry(1.2 * enemyDefinition.scale[0], 0.4 * enemyDefinition.scale[1], 1.2 * enemyDefinition.scale[2]);
  const eBodyMat = new THREE.MeshStandardMaterial({ color: enemyDefinition.color, emissive: enemyDefinition.emissive, emissiveIntensity: 0.5 });
  const eBody = new THREE.Mesh(eBodyGeo, eBodyMat);
  enemyGroup.add(eBody);

  if (enemyDefinition.shields > 0) {
    const shield = new THREE.Mesh(
      new THREE.SphereGeometry(1.2 * Math.max(enemyDefinition.scale[0], enemyDefinition.scale[2]), 16, 8),
      new THREE.MeshBasicMaterial({ color: 0x66ccff, transparent: true, opacity: 0.14, wireframe: true })
    );
    enemyGroup.add(shield);
  }

  const eEyeGeo = new THREE.SphereGeometry(0.3, 8, 8);
  const eEyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const eEye = new THREE.Mesh(eEyeGeo, eEyeMat);
  eEye.position.z = -0.5;
  enemyGroup.add(eEye);

  return enemyGroup;
}

/** Stage 5d: Creates a ground emplacement model for surface threat enemies. */
function createGroundThreatModel(def: EnemyDefinition): THREE.Group {
  const group = new THREE.Group();
  const sx = def.scale[0];
  const sz = def.scale[2];
  const baseMat = new THREE.MeshStandardMaterial({ color: def.color, emissive: def.emissive, emissiveIntensity: 0.4, roughness: 0.8 });
  const accentMat = new THREE.MeshBasicMaterial({ color: def.emissive });

  // Armored base platform
  const baseGeo = new THREE.BoxGeometry(6 * sx, 2.5, 6 * sz);
  group.add(new THREE.Mesh(baseGeo, baseMat));

  if (def.role === 'sam-battery') {
    // Launcher pad + two vertical missile tubes
    const padGeo = new THREE.CylinderGeometry(2.5 * sx, 3 * sx, 1.5, 8);
    const pad = new THREE.Mesh(padGeo, baseMat);
    pad.position.y = 2.0;
    group.add(pad);
    for (const offset of [-1.6 * sx, 1.6 * sx]) {
      const tubeGeo = new THREE.CylinderGeometry(0.5, 0.5, 7, 8);
      const tube = new THREE.Mesh(tubeGeo, baseMat);
      tube.position.set(offset, 6.5, 0);
      group.add(tube);
      // Missile tip glow
      const tipGeo = new THREE.SphereGeometry(0.55, 6, 4);
      const tip = new THREE.Mesh(tipGeo, accentMat);
      tip.position.set(offset, 10.2, 0);
      group.add(tip);
    }
  } else if (def.role === 'flak-cannon') {
    // Rotating turret body + two short barrels
    const turretGeo = new THREE.CylinderGeometry(1.8 * sx, 2 * sx, 2, 8);
    const turret = new THREE.Mesh(turretGeo, baseMat);
    turret.position.y = 2.8;
    group.add(turret);
    for (const offset of [-1.0 * sx, 1.0 * sx]) {
      const barrelGeo = new THREE.CylinderGeometry(0.35, 0.35, 5, 6);
      barrelGeo.rotateX(Math.PI / 2);
      const barrel = new THREE.Mesh(barrelGeo, baseMat);
      barrel.position.set(offset, 3.8, -2);
      group.add(barrel);
      const muzzleGeo = new THREE.RingGeometry(0.3, 0.5, 8);
      const muzzle = new THREE.Mesh(muzzleGeo, accentMat);
      muzzle.position.set(offset, 3.8, -4.6);
      group.add(muzzle);
    }
  } else {
    // railgun-emplacement: long single barrel on low carriage
    const carriageGeo = new THREE.BoxGeometry(3 * sx, 2, 8 * sz);
    const carriage = new THREE.Mesh(carriageGeo, baseMat);
    carriage.position.y = 2.5;
    group.add(carriage);
    const barrelGeo = new THREE.CylinderGeometry(0.4, 0.6, 14, 8);
    barrelGeo.rotateX(Math.PI / 2);
    const barrel = new THREE.Mesh(barrelGeo, baseMat);
    barrel.position.set(0, 3.5, -6);
    group.add(barrel);
    // Charge coils
    for (let i = 0; i < 3; i++) {
      const coilGeo = new THREE.TorusGeometry(0.7, 0.18, 6, 8);
      coilGeo.rotateX(Math.PI / 2);
      const coil = new THREE.Mesh(coilGeo, accentMat);
      coil.position.set(0, 3.5, -3.5 - i * 2.8);
      group.add(coil);
    }
  }

  if (def.shields > 0) {
    const shieldGeo = new THREE.SphereGeometry(5 * Math.max(sx, sz), 16, 8);
    const shieldMat = new THREE.MeshBasicMaterial({ color: 0x66ccff, transparent: true, opacity: 0.12, wireframe: true });
    group.add(new THREE.Mesh(shieldGeo, shieldMat));
  }

  return group;
}
