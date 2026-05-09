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
