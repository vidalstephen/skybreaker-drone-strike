import * as THREE from 'three';
import {
  ENGINE_GLOW_BOOST_OPACITY,
  ENGINE_GLOW_SCALE_MAX,
  THRUSTER_INTENSITY_MAX,
} from '../config/constants';

const AIRCRAFT_SCALE = 0.28;

export interface DroneVisualMaterials {
  body: THREE.MeshStandardMaterial;
  wings: THREE.MeshStandardMaterial;
  cockpit: THREE.MeshStandardMaterial;
  accents: THREE.MeshStandardMaterial;
  rotors: THREE.MeshStandardMaterial;
  engineGlow: THREE.MeshBasicMaterial;
  engineCore: THREE.MeshBasicMaterial;
  exhaustGlow: THREE.MeshBasicMaterial;
  exhaustCore: THREE.MeshBasicMaterial;
  aimProjection: THREE.MeshBasicMaterial;
  muzzleFlash: THREE.MeshBasicMaterial;
}

export interface DroneVisualHandles {
  materials: DroneVisualMaterials;
  bodyParts: THREE.Mesh[];
  wingParts: THREE.Mesh[];
  accentParts: THREE.Mesh[];
  rotors: THREE.Mesh[];
  engineGlows: THREE.Mesh[];
  engineCores: THREE.Mesh[];
  podGlows: THREE.Mesh[];
  podCores: THREE.Mesh[];
  exhaustGlows: THREE.Mesh[];
  exhaustCores: THREE.Mesh[];
  podThrusters: THREE.PointLight[];
  exhaustThrusters: THREE.PointLight[];
  thrusters: THREE.PointLight[];
}

export interface DroneModel {
  group: THREE.Group;
  aimProjection: THREE.Mesh;
  muzzleFlash: THREE.Mesh;
  engineGlows: THREE.Mesh[];
  thrusters: THREE.PointLight[];
  visuals: DroneVisualHandles;
}

export interface DroneVisualState {
  throttle: number;
  isBoosting: boolean;
  isFiring: boolean;
  hasRecentDamage: boolean;
  hasRecentFire: boolean;
  frame: number;
  dt: number;
}

interface LoftSection {
  z: number;
  w: number;
  h: number;
  tw?: number;
  y?: number;
}

function easeValue(current: number, target: number, rate: number, dt: number) {
  return current + (target - current) * Math.min(1, rate * dt);
}

function scaled(value: number) {
  return value * AIRCRAFT_SCALE;
}

function point(x: number, y: number, z: number): THREE.Vector3 {
  return new THREE.Vector3(scaled(x), scaled(y), scaled(z));
}

function createIndexedGeometry(vertices: THREE.Vector3[], faces: [number, number, number][]) {
  const geometry = new THREE.BufferGeometry();
  geometry.setFromPoints(vertices);
  geometry.setIndex(faces.flat());
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function mirrorGeometryX(geometry: THREE.BufferGeometry) {
  const mirrored = geometry.clone();
  const position = mirrored.getAttribute('position') as THREE.BufferAttribute;
  for (let index = 0; index < position.count; index += 1) {
    position.setX(index, -position.getX(index));
  }

  const geometryIndex = mirrored.getIndex();
  if (geometryIndex) {
    const source = Array.from(geometryIndex.array, value => Number(value));
    for (let index = 0; index < source.length; index += 3) {
      const next = source[index + 1];
      source[index + 1] = source[index + 2];
      source[index + 2] = next;
    }
    mirrored.setIndex(source);
  }

  position.needsUpdate = true;
  mirrored.computeVertexNormals();
  mirrored.computeBoundingSphere();
  return mirrored;
}

function signedGeometry(sign: -1 | 1, factory: () => THREE.BufferGeometry) {
  const geometry = factory();
  return sign === 1 ? geometry : mirrorGeometryX(geometry);
}

function tagMirror<T extends THREE.Object3D>(object: T, key: string, side: 'left' | 'right') {
  object.userData.mirrorKey = key;
  object.userData.mirrorSide = side;
  return object;
}

function tagCenterline<T extends THREE.Object3D>(object: T, key: string) {
  object.userData.centerlineKey = key;
  return object;
}

function mirrorSide(sign: -1 | 1): 'left' | 'right' {
  return sign < 0 ? 'left' : 'right';
}

function ringPoints(section: LoftSection) {
  const width = section.w;
  const height = section.h;
  const topWidth = section.tw ?? section.w * 0.52;
  const y = section.y ?? 0;

  return [
    point(-width * 0.46, y - height * 0.42, section.z),
    point(width * 0.46, y - height * 0.42, section.z),
    point(width * 0.52, y - height * 0.07, section.z),
    point(topWidth * 0.5, y + height * 0.36, section.z),
    point(topWidth * 0.22, y + height * 0.52, section.z),
    point(-topWidth * 0.22, y + height * 0.52, section.z),
    point(-topWidth * 0.5, y + height * 0.36, section.z),
    point(-width * 0.52, y - height * 0.07, section.z),
  ];
}

function createLoftGeometry(sections: LoftSection[]) {
  const rings = sections.map(ringPoints);
  const vertices = rings.flat();
  const sides = rings[0].length;
  const faces: [number, number, number][] = [];

  for (let ring = 0; ring < rings.length - 1; ring += 1) {
    const current = ring * sides;
    const nextRing = (ring + 1) * sides;
    for (let index = 0; index < sides; index += 1) {
      const next = (index + 1) % sides;
      faces.push([current + index, nextRing + index, nextRing + next]);
      faces.push([current + index, nextRing + next, current + next]);
    }
  }

  const firstSection = sections[0];
  const front = vertices.length;
  vertices.push(point(0, firstSection.y ?? 0, firstSection.z));
  for (let index = 0; index < sides; index += 1) {
    faces.push([front, index, (index + 1) % sides]);
  }

  const lastSection = sections[sections.length - 1];
  const back = vertices.length;
  const backOffset = (rings.length - 1) * sides;
  vertices.push(point(0, lastSection.y ?? 0, lastSection.z));
  for (let index = 0; index < sides; index += 1) {
    faces.push([back, backOffset + ((index + 1) % sides), backOffset + index]);
  }

  return createIndexedGeometry(vertices, faces);
}

function createWingGeometry(sign: -1 | 1, inset = false) {
  return signedGeometry(sign, () => createRightWingGeometry(inset));
}

function createRightWingGeometry(inset = false) {
  const xInner = inset ? 2.24 : 1.42;
  const xOuter = inset ? 8.82 : 9.42;
  const zInner = inset ? 0.03 : -0.2;
  const zOuter = inset ? 0.58 : 0.7;
  const chordInner = inset ? 0.76 : 2.46;
  const chordOuter = inset ? 0.26 : 0.78;
  const yTop = inset ? 0.36 : 0.2;
  const yBottom = inset ? 0.28 : -0.3;
  const vertices = [
    point(xInner, yTop, zInner - chordInner / 2),
    point(xInner, yTop, zInner + chordInner / 2),
    point(xOuter, yTop, zOuter - chordOuter / 2),
    point(xOuter, yTop, zOuter + chordOuter / 2),
    point(xInner, yBottom, zInner - chordInner / 2),
    point(xInner, yBottom, zInner + chordInner / 2),
    point(xOuter, yBottom, zOuter - chordOuter / 2),
    point(xOuter, yBottom, zOuter + chordOuter / 2),
  ];
  const faces: [number, number, number][] = [
    [0, 2, 3], [0, 3, 1], [4, 5, 7], [4, 7, 6],
    [0, 4, 6], [0, 6, 2], [1, 3, 7], [1, 7, 5],
    [2, 6, 7], [2, 7, 3], [0, 1, 5], [0, 5, 4],
  ];
  return createIndexedGeometry(vertices, faces);
}

function createStrutGeometry(sign: -1 | 1) {
  return signedGeometry(sign, createRightStrutGeometry);
}

function createRightStrutGeometry() {
  const x0 = 0.34;
  const x1 = 0.94;
  const z0 = 1.25;
  const z1 = 2.95;
  const top = -1.05;
  const bottom = -1.72;
  const vertices = [
    point(x0, top, z0), point(x1, top - 0.08, z0 + 0.15), point(x0, top, z1), point(x1, top - 0.08, z1 - 0.12),
    point(x0, bottom, z0 + 0.28), point(x1, bottom - 0.05, z0 + 0.4), point(x0, bottom, z1 - 0.22), point(x1, bottom - 0.05, z1 - 0.33),
  ];
  const faces: [number, number, number][] = [
    [0, 2, 3], [0, 3, 1], [4, 5, 7], [4, 7, 6],
    [0, 4, 6], [0, 6, 2], [1, 3, 7], [1, 7, 5],
    [2, 6, 7], [2, 7, 3], [0, 1, 5], [0, 5, 4],
  ];
  return createIndexedGeometry(vertices, faces);
}

function createCanopyGeometry() {
  const z0 = -3.65;
  const z1 = -1.05;
  const vertices = [
    point(-0.78, 0.78, z0), point(0.78, 0.78, z0), point(-0.36, 1.52, z0 + 0.22), point(0.36, 1.52, z0 + 0.22),
    point(-1.1, 0.94, z1), point(1.1, 0.94, z1), point(-0.74, 1.86, z1 - 0.25), point(0.74, 1.86, z1 - 0.25),
  ];
  const faces: [number, number, number][] = [
    [0, 1, 3], [0, 3, 2], [4, 6, 7], [4, 7, 5],
    [0, 2, 6], [0, 6, 4], [1, 5, 7], [1, 7, 3],
    [2, 3, 7], [2, 7, 6], [0, 4, 5], [0, 5, 1],
  ];
  return createIndexedGeometry(vertices, faces);
}

function createQuadGeometry(points: [number, number, number][]) {
  return createIndexedGeometry(points.map(([x, y, z]) => point(x, y, z)), [[0, 1, 2], [0, 2, 3]]);
}

function createSignedQuadGeometry(sign: -1 | 1, points: [number, number, number][]) {
  return signedGeometry(sign, () => createQuadGeometry(points));
}

function createBoxMesh(
  center: [number, number, number],
  size: [number, number, number],
  material: THREE.Material,
) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(scaled(size[0]), scaled(size[1]), scaled(size[2])),
    material,
  );
  mesh.position.set(scaled(center[0]), scaled(center[1]), scaled(center[2]));
  return mesh;
}

function createCylinderYMesh(
  center: [number, number, number],
  radius: number,
  height: number,
  sides: number,
  material: THREE.Material,
) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(scaled(radius), scaled(radius), scaled(height), sides), material);
  mesh.position.set(scaled(center[0]), scaled(center[1]), scaled(center[2]));
  return mesh;
}

function createCylinderZMesh(
  center: [number, number, number],
  radius: number,
  length: number,
  sides: number,
  material: THREE.Material,
) {
  const geometry = new THREE.CylinderGeometry(scaled(radius), scaled(radius), scaled(length), sides);
  geometry.rotateX(Math.PI / 2);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(scaled(center[0]), scaled(center[1]), scaled(center[2]));
  return mesh;
}

function createConeZMesh(
  center: [number, number, number],
  radius: number,
  length: number,
  sides: number,
  material: THREE.Material,
) {
  const geometry = new THREE.ConeGeometry(scaled(radius), scaled(length), sides);
  geometry.rotateX(Math.PI / 2);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(scaled(center[0]), scaled(center[1]), scaled(center[2]));
  return mesh;
}

function createTorusYMesh(
  center: [number, number, number],
  major: number,
  minor: number,
  material: THREE.Material,
) {
  const geometry = new THREE.TorusGeometry(scaled(major), scaled(minor), 10, 48);
  geometry.rotateX(Math.PI / 2);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(scaled(center[0]), scaled(center[1]), scaled(center[2]));
  return mesh;
}

function createTorusZMesh(
  center: [number, number, number],
  major: number,
  minor: number,
  material: THREE.Material,
) {
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(scaled(major), scaled(minor), 10, 48), material);
  mesh.position.set(scaled(center[0]), scaled(center[1]), scaled(center[2]));
  return mesh;
}

function setShadow(mesh: THREE.Mesh) {
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  return mesh;
}

export function createDroneModel(): DroneModel {
  const drone = new THREE.Group();
  const bodyParts: THREE.Mesh[] = [];
  const wingParts: THREE.Mesh[] = [];
  const accentParts: THREE.Mesh[] = [];
  const rotors: THREE.Mesh[] = [];
  const engineGlows: THREE.Mesh[] = [];
  const engineCores: THREE.Mesh[] = [];
  const podGlows: THREE.Mesh[] = [];
  const podCores: THREE.Mesh[] = [];
  const exhaustGlows: THREE.Mesh[] = [];
  const exhaustCores: THREE.Mesh[] = [];
  const podThrusters: THREE.PointLight[] = [];
  const exhaustThrusters: THREE.PointLight[] = [];
  const thrusters: THREE.PointLight[] = [];

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x20282b,
    roughness: 0.66,
    metalness: 0.42,
    emissive: 0x08101a,
    emissiveIntensity: 0.3,
    flatShading: true,
  });
  const bodyDarkMat = new THREE.MeshStandardMaterial({
    color: 0x101416,
    roughness: 0.72,
    metalness: 0.5,
    emissive: 0x020405,
    emissiveIntensity: 0.12,
    flatShading: true,
  });
  const panelMat = new THREE.MeshStandardMaterial({
    color: 0x141a1d,
    roughness: 0.74,
    metalness: 0.46,
    emissive: 0x030506,
    emissiveIntensity: 0.12,
    flatShading: true,
  });
  const wingMat = new THREE.MeshStandardMaterial({
    color: 0x09aeb0,
    roughness: 0.58,
    metalness: 0.36,
    emissive: 0x00383b,
    emissiveIntensity: 0.24,
    flatShading: true,
  });
  const wingInsetMat = new THREE.MeshStandardMaterial({
    color: 0x10383c,
    roughness: 0.68,
    metalness: 0.44,
    emissive: 0x001d22,
    emissiveIntensity: 0.18,
    flatShading: true,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0x43f6ff,
    roughness: 0.34,
    metalness: 0.2,
    emissive: 0x43f6ff,
    emissiveIntensity: 0.85,
    flatShading: true,
  });
  const cockpitMat = new THREE.MeshStandardMaterial({
    color: 0xff8c25,
    transparent: true,
    opacity: 0.72,
    emissive: 0xff6b16,
    emissiveIntensity: 0.28,
    roughness: 0.24,
    metalness: 0.16,
    flatShading: true,
  });
  const rotorMat = new THREE.MeshStandardMaterial({
    color: 0x06080a,
    roughness: 0.55,
    metalness: 0.68,
    flatShading: true,
  });
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.28,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0x8affff,
    transparent: true,
    opacity: 0.36,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const exhaustGlowMat = new THREE.MeshBasicMaterial({
    color: 0xffb241,
    transparent: true,
    opacity: 0.22,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const exhaustCoreMat = new THREE.MeshBasicMaterial({
    color: 0x9cffff,
    transparent: true,
    opacity: 0.36,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const afterburnerMat = new THREE.MeshBasicMaterial({
    color: 0xff8f21,
    transparent: true,
    opacity: 0.32,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const fuselage = tagCenterline(setShadow(new THREE.Mesh(createLoftGeometry([
    { z: -6.0, w: 0.5, h: 0.5, tw: 0.24 },
    { z: -4.75, w: 2.0, h: 1.18, tw: 0.92 },
    { z: -3.05, w: 3.3, h: 2.05, tw: 1.65 },
    { z: -0.4, w: 4.0, h: 2.42, tw: 2.18 },
    { z: 3.25, w: 3.2, h: 2.0, tw: 1.74 },
    { z: 5.45, w: 2.3, h: 1.5, tw: 1.1 },
  ]), bodyMat)), 'fuselage');
  drone.add(fuselage);
  bodyParts.push(fuselage);

  const canopy = tagCenterline(setShadow(new THREE.Mesh(createCanopyGeometry(), cockpitMat)), 'canopy');
  drone.add(canopy);
  bodyParts.push(canopy);

  const dorsal = tagCenterline(setShadow(createBoxMesh([0, 1.22, 1.55], [2.8, 0.28, 3.62], panelMat)), 'dorsal-panel');
  const belly = tagCenterline(setShadow(createBoxMesh([0, -1.12, 1.4], [2.1, 0.2, 4.3], bodyDarkMat)), 'belly-panel');
  drone.add(dorsal, belly);
  bodyParts.push(dorsal, belly);

  const rimLight = new THREE.PointLight(0xffffff, 0.2, 12);
  rimLight.position.set(0, scaled(2.5), scaled(-1));
  drone.add(rimLight);

  const underLight = new THREE.PointLight(0x202428, 0.45, 8);
  underLight.position.set(0, scaled(-2), 0);
  drone.add(underLight);

  ([-1, 1] as const).forEach((sign) => {
    const side = mirrorSide(sign);
    const mainWing = tagMirror(setShadow(new THREE.Mesh(createWingGeometry(sign, false), wingMat)), 'wing-main', side);
    const insetWing = tagMirror(setShadow(new THREE.Mesh(createWingGeometry(sign, true), wingInsetMat)), 'wing-inset', side);
    drone.add(mainWing, insetWing);
    wingParts.push(mainWing, insetWing);

    const rootX = 1.78;
    const tipX = 8.95;
    const topY = 0.43;

    const upperPanel = tagMirror(setShadow(new THREE.Mesh(createSignedQuadGeometry(sign, [
      [rootX, topY, -0.88],
      [tipX, topY + 0.02, 0.29],
      [tipX, topY + 0.02, 0.49],
      [rootX, topY, 0.36],
    ]), panelMat)), 'wing-upper-panel', side);
    const edgeRail = tagMirror(setShadow(new THREE.Mesh(createSignedQuadGeometry(sign, [
      [rootX + 0.08, topY + 0.04, -1.08],
      [tipX, topY + 0.05, 0.14],
      [tipX, topY + 0.05, 0.27],
      [rootX + 0.08, topY + 0.04, -0.82],
    ]), accentMat)), 'wing-edge-rail', side);
    const trailingPanel = tagMirror(setShadow(new THREE.Mesh(createSignedQuadGeometry(sign, [
      [rootX + 0.2, topY + 0.035, 0.56],
      [tipX - 0.1, topY + 0.05, 0.72],
      [tipX - 0.1, topY + 0.05, 0.86],
      [rootX + 0.2, topY + 0.035, 0.92],
    ]), wingInsetMat)), 'wing-trailing-panel', side);
    const rootPanel = tagMirror(setShadow(new THREE.Mesh(createSignedQuadGeometry(sign, [
      [1.42, 0.24, -1.16],
      [3.45, 0.34, -0.72],
      [3.22, 0.34, 0.9],
      [1.4, 0.2, 0.74],
    ]), panelMat)), 'wing-root-panel', side);
    const wingTip = tagMirror(setShadow(new THREE.Mesh(createSignedQuadGeometry(sign, [
      [tipX - 0.55, 0.3, 0.04],
      [9.72, 0.24, 0],
      [9.72, 0.24, 1.3],
      [tipX - 0.55, 0.3, 1.02],
    ]), panelMat)), 'wing-tip-panel', side);
    drone.add(upperPanel, edgeRail, trailingPanel, rootPanel, wingTip);
    wingParts.push(upperPanel, trailingPanel, rootPanel, wingTip);
    accentParts.push(edgeRail);

    for (let index = 0; index < 4; index += 1) {
      const x = 3.35 + index * 1.12;
      const z = -0.38 + index * 0.13;
      const ribWidth = 0.42 - index * 0.045;
      const rib = tagMirror(setShadow(new THREE.Mesh(createSignedQuadGeometry(sign, [
        [x - 0.18, topY + 0.07, z - ribWidth],
        [x + 0.18, topY + 0.07, z - ribWidth * 0.8],
        [x + 0.18, topY + 0.07, z + ribWidth],
        [x - 0.18, topY + 0.07, z + ribWidth * 0.8],
      ]), panelMat)), `wing-rib-${index + 1}`, side);
      drone.add(rib);
      wingParts.push(rib);
    }

    const tipEmitter = tagMirror(setShadow(new THREE.Mesh(createSignedQuadGeometry(sign, [
      [7.95, topY + 0.09, 0.52],
      [9.2, topY + 0.09, 0.58],
      [9.2, topY + 0.09, 0.76],
      [7.95, topY + 0.09, 0.72],
    ]), accentMat)), 'wing-tip-emitter-panel', side);
    const outerEmitter = tagMirror(setShadow(createBoxMesh([sign * 8.3, 0.34, 0.63], [0.62, 0.08, 0.16], accentMat)), 'outer-emitter', side);
    drone.add(tipEmitter, outerEmitter);
    accentParts.push(tipEmitter, outerEmitter);

    const podId = sign < 0 ? -1 : 1;
    const podX = sign * 9.7;
    const podZ = 0.65;
    const podShell = tagMirror(setShadow(createCylinderYMesh([podX, 0, podZ], 1.3, 0.6, 32, rotorMat)), 'pod-shell', side);
    const podBase = tagMirror(setShadow(createCylinderYMesh([podX, -0.38, podZ], 1.12, 0.18, 32, bodyDarkMat)), 'pod-base', side);
    const podCore = tagMirror(setShadow(createCylinderYMesh([podX, 0.39, podZ], 0.28, 0.1, 24, coreMat)), 'pod-core', side);
    const podRing = tagMirror(setShadow(createTorusYMesh([podX, 0.35, podZ], 0.78, 0.075, glowMat)), 'pod-glow-ring', side);
    const podOuter = tagMirror(setShadow(createTorusYMesh([podX, 0.32, podZ], 1.27, 0.045, wingInsetMat)), 'pod-outer-ring', side);
    drone.add(podShell, podBase, podCore, podRing, podOuter);
    rotors.push(podShell, podOuter);
    engineCores.push(podCore);
    engineGlows.push(podRing);
    podCores.push(podCore);
    podGlows.push(podRing);

    const podLight = new THREE.PointLight(0x00ffff, 0.32, 5);
    podLight.position.set(scaled(podX), scaled(0.34), scaled(podZ));
    drone.add(podLight);
    thrusters.push(podLight);
    podThrusters.push(podLight);

    podRing.userData.spinDirection = podId;
    podOuter.userData.spinDirection = -podId;
  });

  const thrusterShell = tagCenterline(setShadow(createCylinderZMesh([0, 0, 6.75], 1, 2.4, 32, panelMat)), 'thruster-shell');
  const thrusterCollar = tagCenterline(setShadow(createTorusZMesh([0, 0, 5.55], 1.08, 0.16, bodyDarkMat)), 'thruster-collar');
  const thrusterNozzle = tagCenterline(setShadow(createTorusZMesh([0, 0, 7.95], 0.68, 0.13, exhaustGlowMat)), 'thruster-nozzle');
  const thrusterCore = tagCenterline(setShadow(createCylinderZMesh([0, 0, 8.02], 0.48, 0.12, 24, exhaustCoreMat)), 'thruster-core');
  const flame = tagCenterline(setShadow(createConeZMesh([0, 0, 8.72], 0.55, 1.35, 32, afterburnerMat)), 'thruster-flame');
  const afterburner = tagCenterline(setShadow(createConeZMesh([0, 0, 9.1], 0.78, 2.25, 32, exhaustGlowMat)), 'afterburner-glow');
  const afterburnerCore = tagCenterline(setShadow(createConeZMesh([0, 0, 8.85], 0.28, 1.45, 32, exhaustCoreMat)), 'afterburner-core');
  drone.add(thrusterShell, thrusterCollar, thrusterNozzle, thrusterCore, flame, afterburner, afterburnerCore);
  bodyParts.push(thrusterShell, thrusterCollar);
  engineGlows.push(thrusterNozzle, afterburner);
  engineCores.push(thrusterCore, afterburnerCore);
  exhaustGlows.push(thrusterNozzle, afterburner);
  exhaustCores.push(thrusterCore, afterburnerCore);

  const rearLight = new THREE.PointLight(0xff8f21, 0.36, 6);
  rearLight.position.set(0, 0, scaled(8.4));
  drone.add(rearLight);
  thrusters.push(rearLight);
  exhaustThrusters.push(rearLight);

  const strutL = tagMirror(setShadow(new THREE.Mesh(createStrutGeometry(-1), bodyDarkMat)), 'ventral-strut', 'left');
  const strutR = tagMirror(setShadow(new THREE.Mesh(createStrutGeometry(1), bodyDarkMat)), 'ventral-strut', 'right');
  drone.add(strutL, strutR);
  bodyParts.push(strutL, strutR);

  const emitters: Array<[[number, number, number], [number, number, number]]> = [
    [[-1.76, 0.02, -2.55], [0.08, 0.16, 0.68]],
    [[1.76, 0.02, -2.55], [0.08, 0.16, 0.68]],
    [[-1.5, -0.08, 2.55], [0.08, 0.16, 0.58]],
    [[1.5, -0.08, 2.55], [0.08, 0.16, 0.58]],
    [[0, -1.25, -2.0], [0.22, 0.08, 0.84]],
  ];
  emitters.forEach(([center, size]) => {
    const mirrored = center[0] === 0 ? null : center[0] < 0 ? 'left' : 'right';
    const emitter = setShadow(createBoxMesh(center, size, accentMat));
    if (mirrored) tagMirror(emitter, `hull-emitter-${center[2]}`, mirrored);
    else tagCenterline(emitter, 'belly-emitter');
    drone.add(emitter);
    accentParts.push(emitter);
  });

  const aimGlowGeo = new THREE.RingGeometry(0.08, 0.14, 6);
  const aimGlowMat = new THREE.MeshBasicMaterial({
    color: 0xf27d26,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const aimProjection = new THREE.Mesh(aimGlowGeo, aimGlowMat);
  aimProjection.position.set(0, 0, -6);
  drone.add(aimProjection);

  const muzzleFlashGeo = new THREE.CylinderGeometry(0.3, 0.8, 4, 8);
  muzzleFlashGeo.translate(0, 2, 0);
  const muzzleFlashMat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const muzzleFlash = new THREE.Mesh(muzzleFlashGeo, muzzleFlashMat);
  muzzleFlash.rotation.x = -Math.PI / 2;
  muzzleFlash.position.set(0, scaled(0.1), scaled(-5.95));
  drone.add(muzzleFlash);

  drone.position.y = 20;

  const visuals: DroneVisualHandles = {
    materials: {
      body: bodyMat,
      wings: wingMat,
      cockpit: cockpitMat,
      accents: accentMat,
      rotors: rotorMat,
      engineGlow: glowMat,
      engineCore: coreMat,
      exhaustGlow: exhaustGlowMat,
      exhaustCore: exhaustCoreMat,
      aimProjection: aimGlowMat,
      muzzleFlash: muzzleFlashMat,
    },
    bodyParts,
    wingParts,
    accentParts,
    rotors,
    engineGlows,
    engineCores,
    podGlows,
    podCores,
    exhaustGlows,
    exhaustCores,
    podThrusters,
    exhaustThrusters,
    thrusters,
  };

  return { group: drone, aimProjection, muzzleFlash, engineGlows, thrusters, visuals };
}

export function updateDroneVisualState(handles: DroneVisualHandles, state: DroneVisualState): void {
  const throttle = THREE.MathUtils.clamp(state.throttle, 0, 1);
  const boostPulse = state.isBoosting ? 0.5 + Math.sin(state.frame * 0.35) * 0.5 : 0;
  const damagePulse = state.hasRecentDamage ? 1 : 0;
  const firePulse = state.hasRecentFire || state.isFiring ? 1 : 0;

  handles.materials.body.emissive.setHex(damagePulse > 0 ? 0x44100c : 0x08101a);
  handles.materials.body.emissiveIntensity = easeValue(handles.materials.body.emissiveIntensity, 0.26 + damagePulse * 0.5 + firePulse * 0.12, 0.08, state.dt);
  handles.materials.wings.emissiveIntensity = easeValue(handles.materials.wings.emissiveIntensity, 0.22 + damagePulse * 0.35 + boostPulse * 0.08, 0.08, state.dt);
  handles.materials.cockpit.emissiveIntensity = easeValue(handles.materials.cockpit.emissiveIntensity, 0.28 + firePulse * 0.2 + boostPulse * 0.12, 0.1, state.dt);
  handles.materials.accents.emissiveIntensity = easeValue(handles.materials.accents.emissiveIntensity, 0.85 + throttle * 0.35 + boostPulse * 0.28, 0.1, state.dt);

  const glowColor = state.isBoosting ? 0xffaa00 : 0x00ffff;
  const coreColor = state.isBoosting ? 0xffcc66 : 0x8affff;
  handles.materials.engineGlow.color.setHex(0x00ffff);
  handles.materials.engineCore.color.setHex(0x8affff);
  handles.materials.exhaustGlow.color.setHex(glowColor);
  handles.materials.exhaustCore.color.setHex(coreColor);
  handles.materials.engineGlow.opacity = easeValue(handles.materials.engineGlow.opacity, 0.22 + throttle * 0.24, 0.12, state.dt);
  handles.materials.engineCore.opacity = easeValue(handles.materials.engineCore.opacity, 0.28 + throttle * 0.32, 0.12, state.dt);
  handles.materials.exhaustGlow.opacity = easeValue(handles.materials.exhaustGlow.opacity, 0.14 + throttle * ENGINE_GLOW_BOOST_OPACITY + boostPulse * 0.1, 0.12, state.dt);
  handles.materials.exhaustCore.opacity = easeValue(handles.materials.exhaustCore.opacity, 0.24 + throttle * 0.38 + boostPulse * 0.12, 0.12, state.dt);

  const glowScale = 1 + throttle * (ENGINE_GLOW_SCALE_MAX - 1);
  handles.podGlows.forEach((glow, index) => {
    const direction = typeof glow.userData.spinDirection === 'number' ? glow.userData.spinDirection : (index === 0 ? 1 : -1);
    glow.scale.set(glowScale, glowScale + throttle * 0.35, glowScale);
    glow.rotation.y += (0.08 + throttle * 0.12) * state.dt * direction;
  });

  handles.exhaustGlows.forEach((glow) => {
    glow.scale.set(0.84 + throttle * 0.18, 0.84 + throttle * 0.18, 1 + throttle * 0.72 + boostPulse * 0.2);
    glow.rotation.z += (0.05 + throttle * 0.08) * state.dt;
  });

  handles.podCores.forEach((core, index) => {
    core.scale.set(0.85 + throttle * 0.18, 1.05 + throttle * 0.8, 0.85 + throttle * 0.18);
    core.rotation.y += (0.18 + throttle * 0.25) * state.dt * (index === 0 ? -1 : 1);
  });

  handles.exhaustCores.forEach((core) => {
    core.scale.set(0.9 + throttle * 0.12, 0.9 + throttle * 0.12, 1 + throttle * 0.7 + boostPulse * 0.25);
    core.rotation.z += (0.12 + throttle * 0.2) * state.dt;
  });

  handles.rotors.forEach((rotor, index) => {
    const direction = typeof rotor.userData.spinDirection === 'number' ? rotor.userData.spinDirection : (index === 0 ? 1 : -1);
    rotor.rotation.y += (0.28 + throttle * 0.62) * state.dt * direction;
  });

  handles.podThrusters.forEach(light => {
    const targetIntensity = throttle * THRUSTER_INTENSITY_MAX * (state.isBoosting ? 0.74 : 0.58);
    light.color.setHex(0x00ffff);
    light.intensity = easeValue(light.intensity, targetIntensity, 0.12, state.dt);
  });

  handles.exhaustThrusters.forEach(light => {
    const targetIntensity = throttle * THRUSTER_INTENSITY_MAX * (state.isBoosting ? 1.2 : 0.74);
    light.color.setHex(state.isBoosting ? 0xffaa00 : 0xff8f21);
    light.intensity = easeValue(light.intensity, targetIntensity, 0.12, state.dt);
  });
}
