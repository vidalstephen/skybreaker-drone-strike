import * as THREE from 'three';
import type { EnemyDefinition, EnemyVisualHandles } from '../types/game';

/** Stage 8a: return type bundles the scene group with named visual handles. */
export interface EnemyModelResult {
  group: THREE.Group;
  visualHandles: EnemyVisualHandles;
}

/**
 * Stage 8a: upgraded entry point — dispatches to role-specific model builders.
 * All air enemy roles now produce role-recognizable silhouettes anchored to the
 * AIRCRAFT_SCALE = 0.28 world-scale reference. Ground threat models are
 * unchanged from Stage 5d.
 */
export function createEnemyModel(def: EnemyDefinition): EnemyModelResult {
  if (def.groundThreat) {
    return createGroundThreatModel(def);
  }
  return createAirEnemyModel(def);
}

// ---------------------------------------------------------------------------
// Air enemy model — role-specific silhouettes
// ---------------------------------------------------------------------------

function createAirEnemyModel(def: EnemyDefinition): EnemyModelResult {
  const sx = def.scale[0];
  const sy = def.scale[1];
  const sz = def.scale[2];

  const group = new THREE.Group();
  const bodyMeshes: THREE.Mesh[] = [];
  const engineGlows: THREE.Mesh[] = [];
  let shieldMesh: THREE.Mesh | null = null;

  // Each structural mesh gets a cloned material so per-mesh flash updates are independent.
  const baseMat = () =>
    new THREE.MeshStandardMaterial({ color: def.color, emissive: def.emissive, emissiveIntensity: 0.5 });
  const glowMat = () => new THREE.MeshBasicMaterial({ color: def.emissive });
  const accentMat = () =>
    new THREE.MeshStandardMaterial({ color: def.emissive, emissive: def.emissive, emissiveIntensity: 1.0 });

  const addBody = (geo: THREE.BufferGeometry, mat: THREE.Material, pos?: [number, number, number]): THREE.Mesh => {
    const mesh = new THREE.Mesh(geo, mat);
    if (pos) mesh.position.set(...pos);
    group.add(mesh);
    bodyMeshes.push(mesh);
    return mesh;
  };

  const addGlow = (radius: number, pos: [number, number, number]): THREE.Mesh => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 6, 4), glowMat());
    mesh.position.set(...pos);
    group.add(mesh);
    engineGlows.push(mesh);
    return mesh;
  };

  switch (def.silhouette) {
    // -------------------------------------------------------------------
    // fast-interceptor, ace-interceptor
    // Sleek delta-wing needle fighter: narrow tapered fuselage, swept wings, twin engine glow
    // -------------------------------------------------------------------
    case 'needle-frame': {
      // Main fuselage — slim and elongated
      addBody(new THREE.BoxGeometry(0.7 * sx, 0.28 * sy, 1.6 * sz), baseMat());

      // Swept-back wings (one each side)
      for (const sign of [-1, 1]) {
        addBody(
          new THREE.BoxGeometry(1.0 * sx, 0.06 * sy, 0.55 * sz),
          baseMat(),
          [sign * 0.85 * sx, 0, 0.2 * sz],
        );
      }

      // Nose cone — tapered forward tip
      const noseConeGeo = new THREE.ConeGeometry(0.22 * sx, 0.55 * sz, 5);
      noseConeGeo.rotateX(-Math.PI / 2);
      addBody(noseConeGeo, baseMat(), [0, 0, -1.075 * sz]);

      // Twin engine glows at rear
      addGlow(0.18 * sx, [-0.22 * sx, 0, 0.85 * sz]);
      addGlow(0.18 * sx, [0.22 * sx, 0, 0.85 * sz]);
      break;
    }

    // -------------------------------------------------------------------
    // heavy-gunship
    // Wide armored airframe: broad fuselage, stubby wings, under-wing weapon pods, single large nacelle
    // -------------------------------------------------------------------
    case 'wide-armored-frame': {
      // Wide armored fuselage
      addBody(new THREE.BoxGeometry(1.6 * sx, 0.52 * sy, 1.4 * sz), baseMat());

      // Stubby wings + weapon pods
      for (const sign of [-1, 1]) {
        addBody(
          new THREE.BoxGeometry(0.7 * sx, 0.12 * sy, 0.6 * sz),
          baseMat(),
          [sign * 1.55 * sx, 0, 0.1 * sz],
        );
        addBody(
          new THREE.BoxGeometry(0.22 * sx, 0.2 * sy, 0.65 * sz),
          accentMat(),
          [sign * 1.55 * sx, -0.3 * sy, 0.1 * sz],
        );
      }

      // Engine nacelle
      const nacelleGeo = new THREE.CylinderGeometry(0.38 * sx, 0.28 * sx, 0.6 * sz, 8);
      nacelleGeo.rotateX(Math.PI / 2);
      addBody(nacelleGeo, baseMat(), [0, 0, 0.9 * sz]);

      // Single wide engine glow
      addGlow(0.32 * sx, [0, 0, 1.22 * sz]);
      break;
    }

    // -------------------------------------------------------------------
    // missile-platform
    // Long-range rail frame: elongated fuselage, small canards, twin launch pods
    // -------------------------------------------------------------------
    case 'long-range-rail-frame': {
      // Long slim fuselage
      addBody(new THREE.BoxGeometry(0.6 * sx, 0.25 * sy, 2.2 * sz), baseMat());

      // Small canard fins near the nose
      for (const sign of [-1, 1]) {
        addBody(
          new THREE.BoxGeometry(0.5 * sx, 0.06 * sy, 0.22 * sz),
          baseMat(),
          [sign * 0.55 * sx, 0, -0.82 * sz],
        );
      }

      // Twin launcher pods under fuselage
      for (const sign of [-1, 1]) {
        addBody(
          new THREE.BoxGeometry(0.18 * sx, 0.14 * sy, 1.6 * sz),
          accentMat(),
          [sign * 0.45 * sx, -0.22 * sy, 0.15 * sz],
        );
      }

      addGlow(0.2 * sx, [0, 0, 1.2 * sz]);
      break;
    }

    // -------------------------------------------------------------------
    // shielded-warden
    // Shield-core frame: stocky body, side shield emitter arms with spheres, forward cannon
    // -------------------------------------------------------------------
    case 'shield-core-frame': {
      // Compact stocky body (taller than other roles)
      addBody(new THREE.BoxGeometry(0.9 * sx, 0.7 * sy, 0.9 * sz), baseMat());

      // Forward cannon barrel
      const barrelGeo = new THREE.CylinderGeometry(0.12 * sx, 0.12 * sx, 0.65 * sz, 6);
      barrelGeo.rotateX(Math.PI / 2);
      addBody(barrelGeo, baseMat(), [0, 0, -0.75 * sz]);

      // Shield emitter arms + sphere emitters
      for (const sign of [-1, 1]) {
        addBody(
          new THREE.BoxGeometry(0.6 * sx, 0.08 * sy, 0.12 * sz),
          baseMat(),
          [sign * 0.65 * sx, 0, 0],
        );
        addBody(
          new THREE.SphereGeometry(0.2 * sx, 8, 6),
          accentMat(),
          [sign * 0.96 * sx, 0, 0],
        );
      }

      addGlow(0.18 * sx, [0, 0, 0.55 * sz]);
      break;
    }

    // -------------------------------------------------------------------
    // mini-boss
    // Boss command frigate: large dominant silhouette, swept wings, command bridge dome, triple engines
    // -------------------------------------------------------------------
    case 'boss-command-frame': {
      // Large command fuselage
      addBody(new THREE.BoxGeometry(1.8 * sx, 0.65 * sy, 2.4 * sz), baseMat());

      // Swept wings
      for (const sign of [-1, 1]) {
        addBody(
          new THREE.BoxGeometry(1.2 * sx, 0.1 * sy, 1.0 * sz),
          baseMat(),
          [sign * 2.2 * sx, 0, -0.2 * sz],
        );
      }

      // Command bridge base + dome
      addBody(
        new THREE.BoxGeometry(0.5 * sx, 0.35 * sy, 0.7 * sz),
        baseMat(),
        [0, 0.5 * sy, -0.4 * sz],
      );
      addBody(
        new THREE.SphereGeometry(0.35 * sx, 8, 6),
        accentMat(),
        [0, 0.78 * sy, -0.4 * sz],
      );

      // Triple engine glows
      for (const ox of [-0.7 * sx, 0, 0.7 * sx]) {
        addGlow(0.35 * sx, [ox, 0, 1.35 * sz]);
      }
      break;
    }

    default: {
      // Safety fallback — visible box so placeholder geometry is never invisible.
      addBody(new THREE.BoxGeometry(1.0 * sx, 0.4 * sy, 1.0 * sz), baseMat());
      addGlow(0.2 * sx, [0, 0, 0.6 * sz]);
      break;
    }
  }

  // Shield bubble — present for any role that has shields defined.
  if (def.shields > 0) {
    const shieldRadius = 1.2 * Math.max(def.scale[0], def.scale[2]);
    const shieldMeshObj = new THREE.Mesh(
      new THREE.SphereGeometry(shieldRadius, 16, 8),
      new THREE.MeshBasicMaterial({ color: 0x66ccff, transparent: true, opacity: 0.14, wireframe: true }),
    );
    group.add(shieldMeshObj);
    shieldMesh = shieldMeshObj;
  }

  return { group, visualHandles: { shieldMesh, bodyMeshes, engineGlows } };
}

// ---------------------------------------------------------------------------
// Ground emplacement model — Stage 5d, unchanged
// ---------------------------------------------------------------------------

/** Stage 5d: Creates a ground emplacement model for surface threat enemies. */
function createGroundThreatModel(def: EnemyDefinition): EnemyModelResult {
  const group = new THREE.Group();
  const sx = def.scale[0];
  const sz = def.scale[2];
  const baseMat = new THREE.MeshStandardMaterial({ color: def.color, emissive: def.emissive, emissiveIntensity: 0.4, roughness: 0.8 });
  const accentMat = new THREE.MeshBasicMaterial({ color: def.emissive });

  const bodyMeshes: THREE.Mesh[] = [];
  const engineGlows: THREE.Mesh[] = [];

  const addPart = (mesh: THREE.Mesh): THREE.Mesh => { group.add(mesh); bodyMeshes.push(mesh); return mesh; };

  // Armored base platform
  addPart(new THREE.Mesh(new THREE.BoxGeometry(6 * sx, 2.5, 6 * sz), baseMat));

  if (def.role === 'sam-battery') {
    // Launcher pad + two vertical missile tubes
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(2.5 * sx, 3 * sx, 1.5, 8), baseMat);
    pad.position.y = 2.0;
    addPart(pad);
    for (const offset of [-1.6 * sx, 1.6 * sx]) {
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 7, 8), baseMat);
      tube.position.set(offset, 6.5, 0);
      addPart(tube);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.55, 6, 4), accentMat);
      tip.position.set(offset, 10.2, 0);
      group.add(tip);
    }
  } else if (def.role === 'flak-cannon') {
    // Rotating turret body + two short barrels
    const turret = new THREE.Mesh(new THREE.CylinderGeometry(1.8 * sx, 2 * sx, 2, 8), baseMat);
    turret.position.y = 2.8;
    addPart(turret);
    for (const offset of [-1.0 * sx, 1.0 * sx]) {
      const barrelGeo = new THREE.CylinderGeometry(0.35, 0.35, 5, 6);
      barrelGeo.rotateX(Math.PI / 2);
      const barrel = new THREE.Mesh(barrelGeo, baseMat);
      barrel.position.set(offset, 3.8, -2);
      addPart(barrel);
      const muzzle = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.5, 8), accentMat);
      muzzle.position.set(offset, 3.8, -4.6);
      group.add(muzzle);
    }
  } else {
    // railgun-emplacement: long single barrel on low carriage
    const carriage = new THREE.Mesh(new THREE.BoxGeometry(3 * sx, 2, 8 * sz), baseMat);
    carriage.position.y = 2.5;
    addPart(carriage);
    const barrelGeo = new THREE.CylinderGeometry(0.4, 0.6, 14, 8);
    barrelGeo.rotateX(Math.PI / 2);
    const barrel = new THREE.Mesh(barrelGeo, baseMat);
    barrel.position.set(0, 3.5, -6);
    addPart(barrel);
    for (let i = 0; i < 3; i++) {
      const coilGeo = new THREE.TorusGeometry(0.7, 0.18, 6, 8);
      coilGeo.rotateX(Math.PI / 2);
      const coil = new THREE.Mesh(coilGeo, accentMat);
      coil.position.set(0, 3.5, -3.5 - i * 2.8);
      group.add(coil);
    }
  }

  let shieldMesh: THREE.Mesh | null = null;
  if (def.shields > 0) {
    const shieldGeo = new THREE.SphereGeometry(5 * Math.max(sx, sz), 16, 8);
    const shieldMat = new THREE.MeshBasicMaterial({ color: 0x66ccff, transparent: true, opacity: 0.12, wireframe: true });
    shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    group.add(shieldMesh);
  }

  return { group, visualHandles: { shieldMesh, bodyMeshes, engineGlows } };
}

