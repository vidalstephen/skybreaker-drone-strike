import { CAMPAIGN_ARCS } from '../src/config/campaign';
import { DEFAULT_CAMPAIGN_PROGRESS } from '../src/config/defaults';
import { MISSIONS } from '../src/config/missions';
import { buildObjectiveSnapshot, calculateMissionResult, completeMission, isMissionUnlocked } from '../src/systems/missionSystem';
import type { MissionCompletionResult, MissionTargetDefinition } from '../src/types/game';

const prototype = MISSIONS.find(mission => mission.id === 'set-piece-proving-ground');
const finalMission = MISSIONS.find(mission => mission.id === 'final-dawn');
const failures: string[] = [];

function assert(condition: boolean, message: string): void {
  if (!condition) failures.push(message);
}

function componentIds(target: MissionTargetDefinition): Set<string> {
  return new Set((target.components ?? []).map(component => component.id));
}

if (!prototype) {
  failures.push('set-piece prototype mission is missing');
} else {
  const arc = CAMPAIGN_ARCS.find(candidate => candidate.label === prototype.campaignArc);
  assert(!!arc, 'prototype mission arc is not registered');
  assert(arc?.id === 'prototype-range', 'prototype mission should live in the prototype-range arc');
  assert(arc?.status === 'PLANNED', 'prototype arc should remain outside active campaign arcs');
  assert(prototype.order >= 90, 'prototype mission should remain outside the main numbered campaign');
  assert(prototype.unlockAfterMissionId === 'final-dawn', 'prototype mission should unlock only after Final Dawn');
  assert(prototype.targets.length === 3, 'prototype mission should contain exactly three set-piece targets');
  assert(prototype.scoring.setPieceComponentBonus === 125, 'component score hook mismatch');
  assert(prototype.scoring.setPiecePhaseBonus === 250, 'phase score hook mismatch');
  assert(prototype.scoring.setPieceOptionalComponentBonus === 300, 'optional component score hook mismatch');

  const archetypes = new Set(prototype.targets.map(target => target.setPieceArchetypeId));
  ['sam-site', 'reactor', 'convoy'].forEach(archetype => {
    assert(archetypes.has(archetype as MissionTargetDefinition['setPieceArchetypeId']), `missing ${archetype} prototype target`);
  });

  prototype.targets.forEach(target => {
    assert(!!target.setPieceArchetypeId, `${target.id} is missing setPieceArchetypeId`);
    assert((target.components ?? []).length > 0, `${target.id} is missing components`);
    assert((target.weakPoints ?? []).length > 0, `${target.id} is missing weak points`);
    const ids = componentIds(target);
    target.weakPoints?.forEach(weakPoint => {
      assert(ids.has(weakPoint.id), `${target.id} weak point ${weakPoint.id} does not map to a component`);
    });
  });

  const convoy = prototype.targets.find(target => target.setPieceArchetypeId === 'convoy');
  assert(!!convoy?.movement, 'convoy target is missing movement data');
  assert(convoy?.movement?.endBehavior === 'fail-mission', 'convoy should fail the mission if it escapes');
  assert((convoy?.movement?.route.length ?? 0) >= 3, 'convoy route should include a multi-point escape path');

  const optionalComponents = prototype.targets.flatMap(target => target.components ?? []).filter(component => !component.required);
  assert(optionalComponents.length >= 2, 'prototype should include optional set-piece components');

  const snapshot = buildObjectiveSnapshot(prototype, 0, new Set());
  assert(snapshot.primaryObjectives.length >= 2, 'prototype objective snapshot should include destroy and extract objectives');
  assert(snapshot.activeObjectiveId === 'destroy-targets', 'prototype initial active objective should be destroy-targets');

  const result = calculateMissionResult(prototype, {
    elapsedMs: 210000,
    targetsDestroyed: prototype.targets.length,
    enemiesDestroyed: 4,
    health: 88,
    setPieceStats: {
      componentsDestroyed: 8,
      requiredComponentsDestroyed: 6,
      optionalComponentsDestroyed: 2,
      phasesCompleted: 5,
      phaseTimeMs: 150000,
      movingTargetsEscaped: 0,
      protectedAssetsLost: 0,
    },
  });
  assert(result.setPieceScore === 2850, `set-piece score expected 2850, got ${result.setPieceScore}`);
  assert(result.score > prototype.scoring.baseScore, 'prototype score should include normal and set-piece bonuses');
}

if (prototype && finalMission) {
  const finalResult: MissionCompletionResult = {
    elapsedMs: finalMission.scoring.parTimeMs,
    targetsDestroyed: finalMission.targets.length,
    enemiesDestroyed: 0,
    health: 100,
    score: finalMission.scoring.baseScore,
    rank: 'C',
    reward: finalMission.reward,
  };
  const progressAfterFinal = completeMission(DEFAULT_CAMPAIGN_PROGRESS, finalMission, finalResult, MISSIONS);
  assert(isMissionUnlocked(prototype, progressAfterFinal), 'prototype mission should unlock after completing Final Dawn');
} else {
  failures.push('final-dawn mission is missing');
}

if (failures.length > 0) {
  console.error('Set-piece prototype validation failed:');
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Set-piece prototype mission validation passed.');
console.log('- Isolated prototype arc registered');
console.log('- SAM, reactor, and convoy targets validate');
console.log('- Convoy escape failure route is authored');
console.log('- Objective snapshot and set-piece scoring hooks validate');
