import * as THREE from 'three';
import { createDroneModel } from '../src/scene/droneModel';

interface PairBounds {
  left?: THREE.Box3;
  right?: THREE.Box3;
}

const tolerance = 1e-5;
const model = createDroneModel();
const pairs = new Map<string, PairBounds>();
const centerline = new Map<string, THREE.Box3>();

model.group.updateMatrixWorld(true);
model.group.traverse((object) => {
  if (!(object instanceof THREE.Mesh)) return;
  const key = object.userData.mirrorKey as string | undefined;
  const side = object.userData.mirrorSide as 'left' | 'right' | undefined;
  const bounds = new THREE.Box3().setFromObject(object);

  const centerlineKey = object.userData.centerlineKey as string | undefined;
  if (centerlineKey) {
    const existing = centerline.get(centerlineKey);
    centerline.set(centerlineKey, existing ? existing.union(bounds) : bounds);
  }

  if (!key || !side) return;

  const entry = pairs.get(key) ?? {};
  entry[side] = entry[side] ? entry[side]!.union(bounds) : bounds;
  pairs.set(key, entry);
});

const failures: string[] = [];

for (const [key, pair] of pairs) {
  if (!pair.left || !pair.right) {
    failures.push(`${key}: missing ${pair.left ? 'right' : 'left'} side`);
    continue;
  }

  const checks = [
    Math.abs(pair.left.min.x + pair.right.max.x),
    Math.abs(pair.left.max.x + pair.right.min.x),
    Math.abs(pair.left.min.y - pair.right.min.y),
    Math.abs(pair.left.max.y - pair.right.max.y),
    Math.abs(pair.left.min.z - pair.right.min.z),
    Math.abs(pair.left.max.z - pair.right.max.z),
  ];

  if (checks.some((delta) => delta > tolerance)) {
    failures.push(`${key}: mirrored bounds differ by ${checks.map((value) => value.toExponential(2)).join(', ')}`);
  }
}

for (const [key, bounds] of centerline) {
  const delta = Math.abs(bounds.min.x + bounds.max.x);
  if (delta > tolerance) {
    failures.push(`${key}: centerline X bounds drift by ${delta.toExponential(2)}`);
  }
}

const expectedEffectCounts = [
  ['podGlows', model.visuals.podGlows.length, 2],
  ['podCores', model.visuals.podCores.length, 2],
  ['podThrusters', model.visuals.podThrusters.length, 2],
  ['exhaustGlows', model.visuals.exhaustGlows.length, 2],
  ['exhaustCores', model.visuals.exhaustCores.length, 2],
  ['exhaustThrusters', model.visuals.exhaustThrusters.length, 1],
] as const;

for (const [label, actual, expected] of expectedEffectCounts) {
  if (actual !== expected) {
    failures.push(`${label}: expected ${expected}, found ${actual}`);
  }
}

const orderedKeys = Array.from(pairs.keys()).sort();
const orderedCenterlineKeys = Array.from(centerline.keys()).sort();
console.log(`Validated ${orderedKeys.length} mirrored aircraft component groups:`);
orderedKeys.forEach((key) => console.log(`- ${key}`));
console.log(`Validated ${orderedCenterlineKeys.length} centerline aircraft components:`);
orderedCenterlineKeys.forEach((key) => console.log(`- ${key}`));

if (failures.length > 0) {
  console.error('Drone symmetry validation failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Drone symmetry and effect handle validation passed.');
