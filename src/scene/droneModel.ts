import * as THREE from 'three';

export interface DroneModel {
  group: THREE.Group;
  aimProjection: THREE.Mesh;
  muzzleFlash: THREE.Mesh;
  engineGlows: THREE.Mesh[];
  thrusters: THREE.PointLight[];
}

export function createDroneModel(): DroneModel {
  const drone = new THREE.Group();
  const engineGlows: THREE.Mesh[] = [];
  const thrusters: THREE.PointLight[] = [];

  const bodyGeo = new THREE.BoxGeometry(0.8, 0.25, 2.2);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x1f242c,
    roughness: 0.7,
    metalness: 0.5,
    emissive: 0x08101a,
    emissiveIntensity: 0.3,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  drone.add(body);

  const rimLight = new THREE.PointLight(0xffffff, 0.25, 12);
  rimLight.position.set(0, 2.5, -1);
  drone.add(rimLight);

  const underLight = new THREE.PointLight(0x202428, 0.6, 8);
  underLight.position.set(0, -2, 0);
  drone.add(underLight);

  const wingGeo = new THREE.BoxGeometry(3.2, 0.05, 0.6);
  const wingMat = new THREE.MeshStandardMaterial({
    color: 0x1a1e24,
    emissive: 0x050a10,
    emissiveIntensity: 0.3,
  });
  const wings = new THREE.Mesh(wingGeo, wingMat);
  wings.position.set(0, 0, 0.2);
  drone.add(wings);

  const stripGeo = new THREE.BoxGeometry(0.06, 0.06, 0.6);
  const stripMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0.8 });
  const stripL = new THREE.Mesh(stripGeo, stripMat);
  stripL.position.set(-1.56, 0, 0.2);
  const stripR = new THREE.Mesh(stripGeo, stripMat);
  stripR.position.set(1.56, 0, 0.2);
  drone.add(stripL, stripR);

  const cockpitGeo = new THREE.SphereGeometry(0.25, 8, 8);
  const cockpitMat = new THREE.MeshStandardMaterial({ color: 0xf27d26, transparent: true, opacity: 0.6, emissive: 0xf27d26, emissiveIntensity: 0.2 });
  const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
  cockpit.position.set(0, 0.15, -0.6);
  cockpit.scale.z = 1.6;
  drone.add(cockpit);

  const rotorGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.08, 8);
  const rotorMat = new THREE.MeshStandardMaterial({ color: 0x050505 });
  const glowGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.1, 8);
  const glowMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.35 });
  const positions = [
    [-1.4, 0, 0.2],
    [1.4, 0, 0.2],
  ];

  positions.forEach(([x, y, z]) => {
    const rotor = new THREE.Mesh(rotorGeo, rotorMat);
    rotor.position.set(x, y, z);
    drone.add(rotor);

    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.set(x, y, z);
    drone.add(glow);
    engineGlows.push(glow);

    const thrusterLight = new THREE.PointLight(0x00ffff, 0.3, 4);
    thrusterLight.position.set(x, y, z + 0.2);
    drone.add(thrusterLight);
    thrusters.push(thrusterLight);
  });

  const aimGlowGeo = new THREE.RingGeometry(0.08, 0.14, 6);
  const aimGlowMat = new THREE.MeshBasicMaterial({
    color: 0xf27d26,
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const aimProjection = new THREE.Mesh(aimGlowGeo, aimGlowMat);
  aimProjection.position.set(0, 0, -6);
  drone.add(aimProjection);

  const muzzleFlashGeo = new THREE.CylinderGeometry(0.3, 0.8, 4, 8);
  muzzleFlashGeo.translate(0, 2, 0);
  const muzzleFlashMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false });
  const muzzleFlash = new THREE.Mesh(muzzleFlashGeo, muzzleFlashMat);
  muzzleFlash.rotation.x = -Math.PI / 2;
  muzzleFlash.position.set(0, 0, -1.2);
  drone.add(muzzleFlash);

  drone.position.y = 20;

  return { group: drone, aimProjection, muzzleFlash, engineGlows, thrusters };
}
