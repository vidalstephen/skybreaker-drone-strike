import { CAMPAIGN_ARCS } from '../src/config/campaign';
import { MISSIONS } from '../src/config/missions';
import { buildObjectiveSnapshot } from '../src/systems/missionSystem';

const intercept = MISSIONS.find(mission => mission.id === 'raven-break-prototype');
const failures: string[] = [];

function assert(condition: boolean, message: string): void {
  if (!condition) failures.push(message);
}

if (!intercept) {
  failures.push('raven-break-prototype intercept mission is missing');
} else {
  const arc = CAMPAIGN_ARCS.find(candidate => candidate.label === intercept.campaignArc);
  assert(!!arc, 'intercept mission arc is not registered in CAMPAIGN_ARCS');
  assert(arc?.id === 'prototype-intercept', 'intercept mission should live in the prototype-intercept arc');
  assert(arc?.status === 'PLANNED', 'intercept arc should remain outside active campaign arcs');
  assert(intercept.order >= 90, 'intercept mission should remain outside the main numbered campaign');
  assert(intercept.unlockAfterMissionId === 'final-dawn', 'intercept mission should unlock only after final-dawn');
  assert(intercept.combatDomain === 'AIR_TO_AIR', 'intercept mission should use AIR_TO_AIR combat domain');
  assert(intercept.missionType === 'INTERCEPT', 'intercept mission should use INTERCEPT mission type');

  assert(intercept.targets.length === 1, 'intercept mission should have exactly one bomber target');

  const bomber = intercept.targets[0];
  assert(bomber?.archetype === 'bomber', 'target archetype should be bomber');
  assert(!!bomber?.movement, 'bomber target must have movement data');
  assert(bomber?.movement?.endBehavior === 'fail-mission', 'bomber should trigger mission failure if not intercepted');
  assert((bomber?.movement?.route.length ?? 0) >= 1, 'bomber must have an escape route');

  const wave = intercept.enemyWave;
  assert(!!wave, 'intercept mission must have an enemy wave');
  assert((wave?.triggerTargetsDestroyed ?? -1) === 0, 'ace escort must spawn at mission start (triggerTargetsDestroyed: 0)');
  const acesInWave = wave?.composition?.find(entry => entry.role === 'ace-interceptor');
  assert(!!acesInWave, 'enemy wave must include ace-interceptor escort');

  assert(!!intercept.extraction, 'intercept mission must have an extraction zone');
  assert((intercept.extraction?.radius ?? 0) >= 200, 'extraction zone should be large enough for a post-intercept approach');

  const snapshot = buildObjectiveSnapshot(intercept, 0, new Set());
  assert(snapshot.primaryObjectives.length >= 2, 'intercept objective snapshot should include destroy and extract objectives');
  assert(snapshot.activeObjectiveId === 'destroy-targets', 'initial active objective should be destroy-targets');
}

if (failures.length > 0) {
  console.error('\nIntercept prototype validation FAILED:\n');
  failures.forEach(failure => console.error(`  ✗ ${failure}`));
  process.exit(1);
} else {
  console.log('Intercept prototype validation passed.');
}
