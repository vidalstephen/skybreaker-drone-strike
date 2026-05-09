import * as THREE from 'three';
import type { EnemyDefinition } from '../types/game';

export function createEnemyModel(enemyDefinition: EnemyDefinition) {
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
