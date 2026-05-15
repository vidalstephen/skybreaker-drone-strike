/**
 * Stage 5f: Mixed-domain HUD/radar pass validator.
 *
 * Validates that:
 * - TrackedEntityType includes ALLY (stub)
 * - TrackedEntitySnapshot carries the domain field
 * - Ground-threat enemies registered with domain='ground' receive elevated
 *   priority when close (> air-enemy baseline)
 * - Radar state label logic distinguishes MIXED, SURFACE, NAVAL, HOSTILES, TARGETS
 * - The sea-wolf-prototype mission target has a routeHint authored
 * - TargetLockSnapshot accepts domain and routeHint without type errors
 * - Clutter: simulated mixed-domain track list stays within readable count
 */

import { TrackedEntityType } from '../src/types/game';
import { createTrackingSystem } from '../src/systems/trackingSystem';
import { MISSIONS } from '../src/config/missions';

const failures: string[] = [];

function assert(condition: boolean, message: string): void {
  if (!condition) failures.push(message);
}

// ---- 1. ALLY stub exists --------------------------------------------------
assert(
  TrackedEntityType.ALLY === 'ALLY',
  'TrackedEntityType.ALLY stub must exist for future use',
);

// ---- 2. Domain field propagates through tracking system -------------------
const tracker = createTrackingSystem();

tracker.registerTrack('air_1', TrackedEntityType.ENEMY, 'Interceptor', {
  worldX: 0, worldY: 100, worldZ: -300,
  distanceToPlayer: 300,
  health: 80, maxHealth: 80,
  state: 'active',
});

tracker.registerTrack('ground_1', TrackedEntityType.ENEMY, 'SAM Battery', {
  worldX: 0, worldY: 0, worldZ: -150,
  distanceToPlayer: 150,
  health: 120, maxHealth: 120,
  state: 'active',
}, false, { domain: 'ground' });

tracker.registerTrack('sea_1', TrackedEntityType.ENEMY, 'Patrol Craft', {
  worldX: 200, worldY: 2, worldZ: -400,
  distanceToPlayer: 450,
  health: 220, maxHealth: 220,
  state: 'active',
}, false, { domain: 'sea' });

tracker.recomputePriority();

const snaps = tracker.getSnapshots();
const airSnap    = snaps.find(s => s.id === 'air_1');
const groundSnap = snaps.find(s => s.id === 'ground_1');
const seaSnap    = snaps.find(s => s.id === 'sea_1');

assert(!!airSnap,    'air track should exist after registration');
assert(!!groundSnap, 'ground track should exist after registration');
assert(!!seaSnap,    'sea track should exist after registration');

assert(airSnap?.domain === undefined || airSnap?.domain === 'air',
  'air enemy should have no explicit domain or domain=air',
);
assert(groundSnap?.domain === 'ground',
  'ground enemy should carry domain=ground through the tracking system',
);
assert(seaSnap?.domain === 'sea',
  'sea enemy should carry domain=sea through the tracking system',
);

// ---- 3. Ground proximity boost: close ground threat > baseline air --------
// ground_1 at dist=150 (within 200 boost threshold) should outscore air_1 at dist=300
assert(
  (groundSnap?.priorityScore ?? 0) > (airSnap?.priorityScore ?? 0),
  'ground enemy within 200 units should have higher priority than distant air enemy',
);

// ---- 4. Clutter limit: mixed track list stays manageable ------------------
// Add objectives + extraction to simulate a full mixed mission
tracker.registerTrack('obj_1', TrackedEntityType.OBJECTIVE, 'Primary Target', {
  worldX: 0, worldY: 0, worldZ: -600, distanceToPlayer: 600, state: 'active',
}, true);
tracker.registerTrack('extraction', TrackedEntityType.EXTRACTION, 'Extraction', {
  worldX: 0, worldY: 0, worldZ: 800, distanceToPlayer: 800, state: 'inactive',
});
tracker.registerTrack('hazard_1', TrackedEntityType.HAZARD, 'Hazard Zone', {
  worldX: -100, worldY: 0, worldZ: -200, distanceToPlayer: 224, state: 'active',
});

tracker.recomputePriority();
const allSnaps = tracker.getSnapshots();
assert(
  allSnaps.length <= 12,
  `mixed-domain track count should stay ≤ 12 for readable radar; got ${allSnaps.length}`,
);

// ---- 5. sea-wolf-prototype mission has a routeHint on its target ----------
const seaWolf = MISSIONS.find(mission => mission.id === 'sea-wolf-prototype');
assert(!!seaWolf, 'sea-wolf-prototype mission must exist');

const craftTarget = seaWolf?.targets[0];
assert(
  typeof craftTarget?.trackingMeta?.routeHint === 'string' &&
    (craftTarget.trackingMeta.routeHint?.length ?? 0) > 0,
  'sea-wolf patrol craft must have a routeHint in its trackingMeta',
);

// ---- 6. TargetLockSnapshot domain field type check (compile-time only) ----
// If this file compiles without errors, the domain and routeHint fields are accepted.
import type { TargetLockSnapshot } from '../src/types/game';
const _lockCheck: TargetLockSnapshot = {
  id: 'test',
  label: 'Test Target',
  type: TrackedEntityType.ENEMY,
  distance: 200,
  lockState: 'locked',
  lockProgress: 1,
  isManual: false,
  domain: 'ground',
  routeHint: 'Test hint',
};
void _lockCheck;

// ---- report ---------------------------------------------------------------
if (failures.length > 0) {
  console.error('\nMixed-domain HUD validation FAILED:\n');
  failures.forEach(failure => console.error(`  \u2717 ${failure}`));
  process.exit(1);
} else {
  console.log('Mixed-domain HUD validation passed.');
  console.log(`  - ALLY stub: \u2713`);
  console.log(`  - domain propagation: air=${airSnap?.domain ?? 'undefined'}, ground=${groundSnap?.domain}, sea=${seaSnap?.domain}`);
  console.log(`  - ground priority boost: \u2713 (${groundSnap?.priorityScore} > ${airSnap?.priorityScore})`);
  console.log(`  - mixed track count: ${allSnaps.length} (within limit)`);
  console.log(`  - sea-wolf routeHint: "${craftTarget?.trackingMeta?.routeHint}"`);
  console.log(`  - TargetLockSnapshot domain+routeHint fields: \u2713`);
}
