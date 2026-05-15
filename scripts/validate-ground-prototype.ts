import { CAMPAIGN_ARCS } from '../src/config/campaign';
import { MISSIONS } from '../src/config/missions';
import { buildObjectiveSnapshot } from '../src/systems/missionSystem';

const ground = MISSIONS.find(mission => mission.id === 'ground-defense-prototype');
const failures: string[] = [];

function assert(condition: boolean, message: string): void {
  if (!condition) failures.push(message);
}

if (!ground) {
  failures.push('ground-defense-prototype mission is missing');
} else {
  const arc = CAMPAIGN_ARCS.find(candidate => candidate.label === ground.campaignArc);
  assert(!!arc, 'ground-defense mission arc is not registered in CAMPAIGN_ARCS');
  assert(arc?.id === 'prototype-ground-defense', 'ground-defense mission should live in the prototype-ground-defense arc');
  assert(arc?.status === 'PLANNED', 'ground-defense arc should remain outside active campaign arcs');
  assert(ground.order >= 90, 'ground-defense mission should remain outside the main numbered campaign');
  assert(ground.unlockAfterMissionId === 'final-dawn', 'ground-defense mission should unlock only after final-dawn');
  assert(ground.combatDomain === 'AIR_TO_LAND', 'ground-defense mission should use AIR_TO_LAND combat domain');
  assert(ground.missionType === 'STRIKE', 'ground-defense mission should use STRIKE mission type');

  assert(ground.targets.length === 1, 'ground-defense mission should have exactly one target');

  const wave = ground.enemyWave;
  assert(!!wave, 'ground-defense mission must have an enemy wave');
  assert((wave?.triggerTargetsDestroyed ?? -1) === 0, 'defense grid must spawn at mission start (triggerTargetsDestroyed: 0)');

  const samEntry = wave?.composition?.find(entry => entry.role === 'sam-battery');
  assert(!!samEntry, 'enemy wave must include sam-battery emplacements');
  assert((samEntry?.count ?? 0) >= 2, 'at least 2 sam-battery emplacements required');

  const flakEntry = wave?.composition?.find(entry => entry.role === 'flak-cannon');
  assert(!!flakEntry, 'enemy wave must include flak-cannon emplacements');
  assert((flakEntry?.count ?? 0) >= 2, 'at least 2 flak-cannon emplacements required');

  const railgunEntry = wave?.composition?.find(entry => entry.role === 'railgun-emplacement');
  assert(!!railgunEntry, 'enemy wave must include railgun-emplacement');

  assert(!!ground.extraction, 'ground-defense mission must have an extraction zone');

  const snapshot = buildObjectiveSnapshot(ground, 0, new Set());
  assert(snapshot.primaryObjectives.length >= 2, 'ground-defense objective snapshot should include destroy and extract objectives');
  assert(snapshot.activeObjectiveId === 'destroy-targets', 'initial active objective should be destroy-targets');
}

if (failures.length > 0) {
  console.error('\nGround defense prototype validation FAILED:\n');
  failures.forEach(failure => console.error(`  ✗ ${failure}`));
  process.exit(1);
} else {
  console.log('Ground defense prototype validation passed.');
}
