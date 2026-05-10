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

  const padWidth = bw * 0.28;
  const padDepth = bd * 0.28;
  const padOffsetX = bw * 0.46;
  const padOffsetZ = bd * 0.46;
  const padPositions: [number, number][] = [
    [-padOffsetX, -padOffsetZ],
    [padOffsetX, -padOffsetZ],
    [-padOffsetX, padOffsetZ],
    [padOffsetX, padOffsetZ],
  ];
  padPositions.forEach(([padX, padZ]) => {
    const pad = new THREE.Mesh(new THREE.BoxGeometry(padWidth, 1.6, padDepth), structMat);
    pad.position.set(padX, 0.8, padZ);
    group.add(pad);
  });

  const sideRail = new THREE.Mesh(new THREE.BoxGeometry(1.2, 12, bd + 1), accentMat);
  sideRail.position.set(-bw * 0.34, 20, 0);
  group.add(sideRail);

  const antenna = new THREE.Mesh(new THREE.BoxGeometry(0.9, 9, 0.9), structMat);
  antenna.position.set(uw * 0.45, 8 + 22 + 14 + 4.5, 0);
  group.add(antenna);

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

  const railFront = new THREE.Mesh(new THREE.BoxGeometry(bw * 0.82, 1.1, 1.0), accentMat);
  railFront.position.set(0, 8.6, -bd * 0.52);
  group.add(railFront);

  const railBack = new THREE.Mesh(new THREE.BoxGeometry(bw * 0.82, 1.1, 1.0), accentMat);
  railBack.position.set(0, 8.6, bd * 0.52);
  group.add(railBack);

  const servicePipe = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.0, bd * 0.9), structMat);
  servicePipe.position.set(-bw * 0.46, 8.5, 0);
  group.add(servicePipe);

  const roofAntenna = new THREE.Mesh(new THREE.BoxGeometry(1.0, 8, 1.0), structMat);
  roofAntenna.position.set(bw * 0.34, 23, -bd * 0.18);
  group.add(roofAntenna);

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

  const basePadLeft = new THREE.Mesh(new THREE.BoxGeometry(7, 1.8, 7), structMat);
  basePadLeft.position.set(-sep / 2, 0.9, 0);
  group.add(basePadLeft);

  const basePadRight = new THREE.Mesh(new THREE.BoxGeometry(7, 1.8, 7), structMat);
  basePadRight.position.set(sep / 2, 0.9, 0);
  group.add(basePadRight);

  const braceLeft = new THREE.Mesh(new THREE.BoxGeometry(2, height * 0.74, 1.6), structMat);
  braceLeft.position.set(-sep * 0.25, height * 0.44, 0);
  braceLeft.rotation.z = -0.42;
  group.add(braceLeft);

  const braceRight = new THREE.Mesh(new THREE.BoxGeometry(2, height * 0.74, 1.6), structMat);
  braceRight.position.set(sep * 0.25, height * 0.44, 0);
  braceRight.rotation.z = 0.42;
  group.add(braceRight);

  const lamp = new THREE.Mesh(new THREE.BoxGeometry(3.5, 2.2, 3.5), accentMat);
  lamp.position.y = height - 4.8;
  group.add(lamp);

  return { group, footprint: sep + 6 };
}

function buildPylon(
  structMat: THREE.Material,
  accentMat: THREE.Material,
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

  const lowerCollar = new THREE.Mesh(new THREE.CylinderGeometry(botR * 0.88, botR, 1.8, 8), structMat);
  lowerCollar.position.y = height * 0.28;
  group.add(lowerCollar);

  const midBand = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.6, 1.4, 8), accentMat);
  midBand.position.y = height * 0.62;
  group.add(midBand);

  const finWidth = botR * 1.45;
  const finA = new THREE.Mesh(new THREE.BoxGeometry(finWidth, height * 0.34, 1.1), structMat);
  finA.position.y = height * 0.35;
  group.add(finA);

  const finB = new THREE.Mesh(new THREE.BoxGeometry(1.1, height * 0.34, finWidth), structMat);
  finB.position.y = height * 0.35;
  group.add(finB);

  return { group, footprint: botR * 2 };
}

function buildBeaconMast(
  structMat: THREE.Material,
  accentMat: THREE.Material,
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

  const base = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 5.5, 2.2, 8), structMat);
  base.position.y = 1.1;
  group.add(base);

  const serviceBox = new THREE.Mesh(new THREE.BoxGeometry(5, 4, 4), structMat);
  serviceBox.position.set(4.5, 3.4, 0);
  group.add(serviceBox);

  const lowerArm = new THREE.Mesh(new THREE.BoxGeometry(8, 1.0, 1.0), accentMat);
  lowerArm.position.y = height * 0.42;
  lowerArm.rotation.y = Math.PI / 2;
  group.add(lowerArm);

  return { group, footprint: 14 };
}

function buildAntennaArray(
  structMat: THREE.Material,
  accentMat: THREE.Material,
  beaconMat: THREE.Material,
): { group: THREE.Group; footprint: number } {
  const group = new THREE.Group();
  const platformWidth = 30 + Math.random() * 12;
  const platformDepth = 18 + Math.random() * 8;

  const platform = new THREE.Mesh(new THREE.BoxGeometry(platformWidth, 3.5, platformDepth), structMat);
  platform.position.y = 1.75;
  group.add(platform);

  const railFront = new THREE.Mesh(new THREE.BoxGeometry(platformWidth * 0.9, 1.0, 0.9), accentMat);
  railFront.position.set(0, 4.1, -platformDepth * 0.48);
  group.add(railFront);

  const railBack = new THREE.Mesh(new THREE.BoxGeometry(platformWidth * 0.9, 1.0, 0.9), accentMat);
  railBack.position.set(0, 4.1, platformDepth * 0.48);
  group.add(railBack);

  const mastOffsets = [-platformWidth * 0.28, 0, platformWidth * 0.24];
  mastOffsets.forEach((mastOffset, index) => {
    const mastHeight = 18 + index * 5 + Math.random() * 4;
    const mast = new THREE.Mesh(new THREE.BoxGeometry(1.2, mastHeight, 1.2), structMat);
    mast.position.set(mastOffset, 3.5 + mastHeight / 2, 0);
    group.add(mast);

    const crossArm = new THREE.Mesh(new THREE.BoxGeometry(9 + index * 2, 1.0, 1.0), accentMat);
    crossArm.position.set(mastOffset, 3.5 + mastHeight * 0.7, 0);
    group.add(crossArm);

    const topBeacon = new THREE.Mesh(new THREE.SphereGeometry(1.0, 6, 4), beaconMat);
    topBeacon.position.set(mastOffset, 3.5 + mastHeight + 1.0, 0);
    group.add(topBeacon);
  });

  const dish = new THREE.Mesh(new THREE.CylinderGeometry(5.4, 5.4, 1.1, 12), structMat);
  dish.rotation.z = Math.PI / 2;
  dish.position.set(platformWidth * 0.34, 13, -platformDepth * 0.16);
  group.add(dish);

  const dishStem = new THREE.Mesh(new THREE.BoxGeometry(1.4, 10, 1.4), structMat);
  dishStem.position.set(platformWidth * 0.34, 8, -platformDepth * 0.16);
  group.add(dishStem);

  const dishAccent = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 8), accentMat);
  dishAccent.position.set(platformWidth * 0.34, 13, -platformDepth * 0.16);
  group.add(dishAccent);

  return { group, footprint: platformWidth };
}

function buildPerimeterLight(
  structMat: THREE.Material,
  accentMat: THREE.Material,
  beaconMat: THREE.Material,
): { group: THREE.Group; footprint: number } {
  const group = new THREE.Group();
  const railLength = 24 + Math.random() * 10;
  const postHeight = 8 + Math.random() * 5;

  const groundRail = new THREE.Mesh(new THREE.BoxGeometry(railLength, 1.4, 2.4), structMat);
  groundRail.position.y = 0.7;
  group.add(groundRail);

  const postOffsets = [-railLength * 0.36, 0, railLength * 0.36];
  postOffsets.forEach((postOffset, index) => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(1.4, postHeight, 1.4), structMat);
    post.position.set(postOffset, 1.4 + postHeight / 2, 0);
    group.add(post);

    const lightHead = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.6, 2.4), accentMat);
    lightHead.position.set(postOffset, postHeight + 2.4, 0);
    lightHead.rotation.y = index % 2 === 0 ? 0.16 : -0.16;
    group.add(lightHead);

    const warningTip = new THREE.Mesh(new THREE.SphereGeometry(0.8, 6, 4), beaconMat);
    warningTip.position.set(postOffset, postHeight + 3.5, 0);
    group.add(warningTip);
  });

  const shieldFront = new THREE.Mesh(new THREE.BoxGeometry(railLength * 0.78, 4.5, 0.9), structMat);
  shieldFront.position.set(0, 3.1, -2.9);
  shieldFront.rotation.x = 0.18;
  group.add(shieldFront);

  return { group, footprint: railLength };
}

function buildPlatformCluster(
  structMat: THREE.Material,
  accentMat: THREE.Material,
  beaconMat: THREE.Material,
): { group: THREE.Group; footprint: number } {
  const group = new THREE.Group();
  const deckWidth = 44 + Math.random() * 16;
  const deckDepth = 26 + Math.random() * 10;

  const deck = new THREE.Mesh(new THREE.BoxGeometry(deckWidth, 4, deckDepth), structMat);
  deck.position.y = 2;
  group.add(deck);

  const padA = new THREE.Mesh(new THREE.BoxGeometry(deckWidth * 0.42, 10, deckDepth * 0.48), structMat);
  padA.position.set(-deckWidth * 0.20, 9, -deckDepth * 0.12);
  group.add(padA);

  const padB = new THREE.Mesh(new THREE.BoxGeometry(deckWidth * 0.30, 15, deckDepth * 0.36), structMat);
  padB.position.set(deckWidth * 0.23, 11.5, deckDepth * 0.10);
  group.add(padB);

  const serviceBlock = new THREE.Mesh(new THREE.BoxGeometry(deckWidth * 0.22, 6, deckDepth * 0.30), structMat);
  serviceBlock.position.set(deckWidth * 0.08, 7, -deckDepth * 0.34);
  group.add(serviceBlock);

  const gantryArm = new THREE.Mesh(new THREE.BoxGeometry(deckWidth * 0.78, 2.2, 2.2), accentMat);
  gantryArm.position.set(0, 18.5, deckDepth * 0.26);
  group.add(gantryArm);

  const supportLeft = new THREE.Mesh(new THREE.BoxGeometry(2.2, 18, 2.2), structMat);
  supportLeft.position.set(-deckWidth * 0.35, 11, deckDepth * 0.26);
  group.add(supportLeft);

  const supportRight = new THREE.Mesh(new THREE.BoxGeometry(2.2, 18, 2.2), structMat);
  supportRight.position.set(deckWidth * 0.35, 11, deckDepth * 0.26);
  group.add(supportRight);

  const beaconLeft = new THREE.Mesh(new THREE.SphereGeometry(1.2, 7, 5), beaconMat);
  beaconLeft.position.set(-deckWidth * 0.35, 21, deckDepth * 0.26);
  group.add(beaconLeft);

  const beaconRight = new THREE.Mesh(new THREE.SphereGeometry(1.2, 7, 5), beaconMat);
  beaconRight.position.set(deckWidth * 0.35, 21, deckDepth * 0.26);
  group.add(beaconRight);

  const railFront = new THREE.Mesh(new THREE.BoxGeometry(deckWidth * 0.9, 1.0, 1.0), accentMat);
  railFront.position.set(0, 5, -deckDepth * 0.52);
  group.add(railFront);

  const railBack = new THREE.Mesh(new THREE.BoxGeometry(deckWidth * 0.9, 1.0, 1.0), accentMat);
  railBack.position.set(0, 5, deckDepth * 0.52);
  group.add(railBack);

  return { group, footprint: deckWidth };
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
    case 'antenna-array':    return buildAntennaArray(structMat, accentMat, beaconMat);
    case 'compound':    return buildCompound(structMat, accentMat, beaconMat);
    case 'gantry':      return buildGantry(structMat, accentMat);
    case 'perimeter-light':  return buildPerimeterLight(structMat, accentMat, beaconMat);
    case 'platform-cluster': return buildPlatformCluster(structMat, accentMat, beaconMat);
    case 'pylon':       return buildPylon(structMat, accentMat, beaconMat);
    case 'beacon-mast': return buildBeaconMast(structMat, accentMat, beaconMat);
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
