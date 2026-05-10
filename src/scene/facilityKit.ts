import * as THREE from 'three';
import type { AppSettings, MissionEnvironmentDefinition, StructureArchetype } from '../types/game';
import type { GraphicsProfile } from './renderer';

// ---------------------------------------------------------------------------
// TV-3: Industrial Structure and Facility Kit
// Reusable low-poly archetypes for arena skyline identity.
// Each builder returns a THREE.Group and a footprint radius for glow splat sizing.
// ---------------------------------------------------------------------------

function buildMonolith(
  structMat: THREE.Material,
  accentMat: THREE.Material,
  beaconMat: THREE.Material,
): { group: THREE.Group; footprint: number } {
  const group = new THREE.Group();
  const bw = 18 + Math.random() * 14;
  const bd = 14 + Math.random() * 14;

  // Base block
  const base = new THREE.Mesh(new THREE.BoxGeometry(bw, 8, bd), structMat);
  base.position.y = 4;
  group.add(base);

  // Mid section — narrower
  const mw = bw * 0.65, md = bd * 0.65;
  const mid = new THREE.Mesh(new THREE.BoxGeometry(mw, 22, md), structMat);
  mid.position.y = 8 + 11;
  group.add(mid);

  // Upper section — narrower again
  const uw = mw * 0.55, ud = md * 0.55;
  const upper = new THREE.Mesh(new THREE.BoxGeometry(uw, 14, ud), structMat);
  upper.position.y = 8 + 22 + 7;
  group.add(upper);

  // Spire
  const spire = new THREE.Mesh(new THREE.BoxGeometry(2.5, 13, 2.5), structMat);
  spire.position.y = 8 + 22 + 14 + 6.5;
  group.add(spire);

  // Emissive accent strip at mid/upper transition
  const accent = new THREE.Mesh(new THREE.BoxGeometry(mw + 0.6, 0.9, md + 0.6), accentMat);
  accent.position.y = 8 + 22 + 0.45;
  group.add(accent);

  // Warning beacon dot at spire peak
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(1.4, 7, 5), beaconMat);
  beacon.position.y = 8 + 22 + 14 + 13 + 1.4;
  group.add(beacon);

  return { group, footprint: bw };
}

function buildCompound(
  structMat: THREE.Material,
  accentMat: THREE.Material,
  beaconMat: THREE.Material,
): { group: THREE.Group; footprint: number } {
  const group = new THREE.Group();
  const bw = 34 + Math.random() * 18;
  const bd = 22 + Math.random() * 14;

  // Wide low base
  const base = new THREE.Mesh(new THREE.BoxGeometry(bw, 5, bd), structMat);
  base.position.y = 2.5;
  group.add(base);

  // Main upper block — offset to +X side
  const uw = bw * 0.52, ud = bd * 0.70;
  const upper = new THREE.Mesh(new THREE.BoxGeometry(uw, 17, ud), structMat);
  upper.position.set(bw * 0.16, 5 + 8.5, 0);
  group.add(upper);

  // Stepped cap on main block
  const capW = uw * 0.58, capD = ud * 0.58;
  const cap = new THREE.Mesh(new THREE.BoxGeometry(capW, 6, capD), structMat);
  cap.position.set(bw * 0.16, 5 + 17 + 3, 0);
  group.add(cap);

  // Low auxiliary block on −X side
  const aux = new THREE.Mesh(new THREE.BoxGeometry(bw * 0.38, 9, bd * 0.58), structMat);
  aux.position.set(-bw * 0.30, 5 + 4.5, 0);
  group.add(aux);

  // Accent strip at base/upper transition
  const accent = new THREE.Mesh(new THREE.BoxGeometry(bw + 0.5, 0.9, bd + 0.5), accentMat);
  accent.position.y = 5.45;
  group.add(accent);

  // Warning beacon dot at cap peak
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(1.2, 7, 5), beaconMat);
  beacon.position.set(bw * 0.16, 5 + 17 + 6 + 1.2, 0);
  group.add(beacon);

  return { group, footprint: bw };
}

function buildGantry(
  structMat: THREE.Material,
  accentMat: THREE.Material,
): { group: THREE.Group; footprint: number } {
  const group = new THREE.Group();
  const sep = 14 + Math.random() * 10;
  const height = 22 + Math.random() * 12;

  // Left post
  const postL = new THREE.Mesh(new THREE.BoxGeometry(3, height, 3), structMat);
  postL.position.set(-sep / 2, height / 2, 0);
  group.add(postL);

  // Right post
  const postR = new THREE.Mesh(new THREE.BoxGeometry(3, height, 3), structMat);
  postR.position.set(sep / 2, height / 2, 0);
  group.add(postR);

  // Horizontal crossbar — accent material for glow
  const bar = new THREE.Mesh(new THREE.BoxGeometry(sep + 3, 2.8, 2.8), accentMat);
  bar.position.y = height - 1.4;
  group.add(bar);

  // Vertical detail pin above bar centre
  const pin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 6, 1.6), structMat);
  pin.position.y = height + 3;
  group.add(pin);

  return { group, footprint: sep + 6 };
}

function buildPylon(
  structMat: THREE.Material,
  beaconMat: THREE.Material,
): { group: THREE.Group; footprint: number } {
  const group = new THREE.Group();
  const height = 18 + Math.random() * 14;
  const botR = 5 + Math.random() * 2;

  // Tapered shaft
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(2.2, botR, height, 6), structMat);
  shaft.position.y = height / 2;
  group.add(shaft);

  // Collar disc at top
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(4, 3, 2, 8), structMat);
  collar.position.y = height + 1;
  group.add(collar);

  // Warning beacon at peak
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(1.3, 7, 5), beaconMat);
  beacon.position.y = height + 3;
  group.add(beacon);

  return { group, footprint: botR * 2 };
}

function buildBeaconMast(
  structMat: THREE.Material,
  beaconMat: THREE.Material,
): { group: THREE.Group; footprint: number } {
  const group = new THREE.Group();
  const height = 28 + Math.random() * 16;

  // Mast shaft — thin tapered cylinder
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.8, height, 5), structMat);
  mast.position.y = height / 2;
  group.add(mast);

  // Cross-arm at 2/3 height
  const armY = height * 0.66;
  const arm = new THREE.Mesh(new THREE.BoxGeometry(13, 1.2, 1.2), structMat);
  arm.position.y = armY;
  group.add(arm);

  // Arm-end beacon caps
  const capL = new THREE.Mesh(new THREE.SphereGeometry(1.0, 6, 4), beaconMat);
  capL.position.set(-6.5, armY, 0);
  group.add(capL);

  const capR = new THREE.Mesh(new THREE.SphereGeometry(1.0, 6, 4), beaconMat);
  capR.position.set(6.5, armY, 0);
  group.add(capR);

  // Top beacon
  const topBeacon = new THREE.Mesh(new THREE.SphereGeometry(1.6, 7, 5), beaconMat);
  topBeacon.position.y = height + 1.6;
  group.add(topBeacon);

  return { group, footprint: 14 };
}

// ---------------------------------------------------------------------------
// Archetype dispatch
// ---------------------------------------------------------------------------

function buildArchetype(
  archetype: StructureArchetype,
  structMat: THREE.Material,
  accentMat: THREE.Material,
  beaconMat: THREE.Material,
): { group: THREE.Group; footprint: number } {
  switch (archetype) {
    case 'compound':    return buildCompound(structMat, accentMat, beaconMat);
    case 'gantry':      return buildGantry(structMat, accentMat);
    case 'pylon':       return buildPylon(structMat, beaconMat);
    case 'beacon-mast': return buildBeaconMast(structMat, beaconMat);
    case 'monolith':
    default:            return buildMonolith(structMat, accentMat, beaconMat);
  }
}

// ---------------------------------------------------------------------------
// Public entry point — builds all facility structures for a mission environment
// ---------------------------------------------------------------------------

export function createFacilityStructures(
  environment: MissionEnvironmentDefinition,
  graphicsProfile: GraphicsProfile,
  settings: AppSettings,
): THREE.Group {
  const envGroup = new THREE.Group();

  const structMat = new THREE.MeshStandardMaterial({
    color: environment.structureColor,
    roughness: 0.88,
    metalness: 0.08,
    emissive: new THREE.Color(environment.structureColor),
    emissiveIntensity: 0.16,
    fog: true,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: environment.beaconPalette.primary,
    emissive: new THREE.Color(environment.beaconPalette.primary),
    emissiveIntensity: 1.8,
    roughness: 0.55,
    metalness: 0.0,
  });

  const beaconMat = new THREE.MeshStandardMaterial({
    color: environment.beaconPalette.warning,
    emissive: new THREE.Color(environment.beaconPalette.warning),
    emissiveIntensity: 2.4,
    roughness: 0.6,
    metalness: 0.0,
  });

  const useEffects = !settings.reduceEffects && graphicsProfile.effectScale > 0.5;
  const streakMat = useEffects
    ? new THREE.MeshBasicMaterial({
        color: environment.beaconPalette.primary,
        transparent: true,
        opacity: 0.014,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      })
    : null;

  const kit = environment.structureKit;
  const archetypes: StructureArchetype[] = kit?.archetypes ??
    (environment.landmarkStyle === 'ridges'
      ? ['compound', 'pylon', 'beacon-mast']
      : ['monolith', 'gantry', 'beacon-mast']);
  const minDist = kit?.minDist ?? 280;
  const maxDist = kit?.maxDist ?? 660;

  const count = Math.max(12, Math.round(environment.landmarkCount * graphicsProfile.effectScale));

  for (let i = 0; i < count; i++) {
    const archetype = archetypes[Math.floor(Math.random() * archetypes.length)];
    const { group, footprint } = buildArchetype(archetype, structMat, accentMat, beaconMat);

    const angle = Math.random() * Math.PI * 2;
    const dist = minDist + Math.random() * (maxDist - minDist);
    group.position.set(Math.cos(angle) * dist, -1, Math.sin(angle) * dist);
    group.rotation.y = Math.random() * Math.PI;
    envGroup.add(group);

    if (!useEffects) continue;

    // Two-layer beacon glow splat — inner core + wide soft falloff
    const innerGeo = new THREE.CircleGeometry(footprint * 1.6, 20);
    const innerMat = new THREE.MeshBasicMaterial({
      color: environment.beaconPalette.primary,
      transparent: true,
      opacity: 0.028,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const inner = new THREE.Mesh(innerGeo, innerMat);
    inner.rotation.x = -Math.PI / 2;
    inner.position.set(group.position.x, -0.44, group.position.z);
    envGroup.add(inner);

    const outerGeo = new THREE.CircleGeometry(footprint * 3.4, 24);
    const outerMat = new THREE.MeshBasicMaterial({
      color: environment.beaconPalette.primary,
      transparent: true,
      opacity: 0.011,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const outer = new THREE.Mesh(outerGeo, outerMat);
    outer.rotation.x = -Math.PI / 2;
    outer.position.set(group.position.x, -0.46, group.position.z);
    envGroup.add(outer);

    // Directional floor streak on ~42% of structures
    if (streakMat && Math.random() < 0.42) {
      const streakLen = footprint * 2.6;
      const streakGeo = new THREE.PlaneGeometry(footprint * 0.26, streakLen);
      const streak = new THREE.Mesh(streakGeo, streakMat);
      streak.rotation.x = -Math.PI / 2;
      streak.rotation.z = angle;
      streak.position.set(group.position.x, -0.42, group.position.z);
      envGroup.add(streak);
    }
  }

  return envGroup;
}
