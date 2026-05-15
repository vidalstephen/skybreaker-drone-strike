import { CAMPAIGN_ARCS } from '../src/config/campaign';
import { MISSIONS } from '../src/config/missions';
import { buildObjectiveSnapshot } from '../src/systems/missionSystem';

const seaWolf = MISSIONS.find(mission => mission.id === 'sea-wolf-prototype');
const failures: string[] = [];

function assert(condition: boolean, message: string): void {
  if (!condition) failures.push(message);
}

if (!seaWolf) {
  failures.push('sea-wolf-prototype mission is missing');
} else {
  const arc = CAMPAIGN_ARCS.find(candidate => candidate.label === seaWolf.campaignArc);
  assert(!!arc, 'sea-wolf mission arc is not registered in CAMPAIGN_ARCS');
  assert(arc?.id === 'prototype-sea', 'sea-wolf mission should live in the prototype-sea arc');
  assert(arc?.status === 'PLANNED', 'sea-wolf arc should remain outside active campaign arcs');
  assert(seaWolf.order >= 90, 'sea-wolf mission should remain outside the main numbered campaign');
  assert(seaWolf.unlockAfterMissionId === 'final-dawn', 'sea-wolf mission should unlock only after final-dawn');
  assert(seaWolf.combatDomain === 'AIR_TO_SEA', 'sea-wolf mission should use AIR_TO_SEA combat domain');
  assert(seaWolf.missionType === 'STRIKE', 'sea-wolf mission should use STRIKE mission type');

  assert(seaWolf.targets.length === 1, 'sea-wolf mission should have exactly one patrol craft target');

  const craft = seaWolf.targets[0];
  assert(craft?.archetype === 'patrol-craft', 'target archetype should be patrol-craft');
  assert(!!craft?.movement, 'patrol craft target must have movement data');
  assert((craft?.movement?.route.length ?? 0) >= 2, 'patrol craft must have at least a 2-waypoint route');
  assert(craft?.movement?.loopMode === 'loop', 'patrol craft should run a looping patrol route');

  const wave = seaWolf.enemyWave;
  assert(!!wave, 'sea-wolf mission must have an enemy wave (air CAP)');
  assert((wave?.triggerTargetsDestroyed ?? -1) === 0, 'CAP fighters must spawn at mission start');
  const capEntry = wave?.composition?.find(entry => entry.role === 'fast-interceptor');
  assert(!!capEntry, 'enemy wave must include fast-interceptor CAP');

  assert(!!seaWolf.extraction, 'sea-wolf mission must have an extraction zone');

  const snapshot = buildObjectiveSnapshot(seaWolf, 0, new Set());
  assert(snapshot.primaryObjectives.length >= 2, 'sea-wolf objective snapshot should include destroy and extract objectives');
  assert(snapshot.activeObjectiveId === 'destroy-targets', 'initial active objective should be destroy-targets');
}

if (failures.length > 0) {
  console.error('\nSea warfare prototype validation FAILED:\n');
  failures.forEach(failure => console.error(`  ✗ ${failure}`));
  process.exit(1);
} else {
  console.log('Sea warfare prototype validation passed.');
}
