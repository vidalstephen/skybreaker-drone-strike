import { CAMPAIGN_ARCS } from '../src/config/campaign';
import { LEVEL_KITS } from '../src/config/levelKits';
import { MISSIONS } from '../src/config/missions';
import { buildObjectiveSnapshot } from '../src/systems/missionSystem';

const SKYBREAKER_CORE_IDS = ['core-needle', 'carrier-eclipse', 'skybreaker-heart', 'last-light'];
const EXPECTED_UNLOCKS: Record<string, string> = {
  'core-needle': 'bastion-fall',
  'carrier-eclipse': 'core-needle',
  'skybreaker-heart': 'carrier-eclipse',
  'last-light': 'skybreaker-heart',
};

const failures: string[] = [];

function assert(condition: boolean, message: string): void {
  if (!condition) failures.push(message);
}

const arc = CAMPAIGN_ARCS.find(candidate => candidate.id === 'skybreaker-core');
assert(!!arc, 'skybreaker-core arc is missing from CAMPAIGN_ARCS');
assert(arc?.label === 'Arc 7 // Skybreaker Core', 'skybreaker-core arc label changed unexpectedly');
assert(arc?.status === 'ACTIVE', 'skybreaker-core arc should be ACTIVE once missions are authored');
assert(arc?.missionRange === 'Missions 21-24', 'skybreaker-core arc should cover Missions 21-24');

const coreKit = LEVEL_KITS['skybreaker-core'];
assert(!!coreKit, 'skybreaker-core level kit is missing');
assert(coreKit?.environment.levelKitId === 'skybreaker-core', 'skybreaker-core environment should preserve its levelKitId');
assert(coreKit?.waypointStyle === 'signal-array', 'skybreaker-core should use signal-array markers for finale readability');
assert(coreKit?.defaultTarget.setPieceArchetypeId === 'reactor', 'skybreaker-core default target should use reactor set pieces');

const coreMissions = SKYBREAKER_CORE_IDS.map(id => MISSIONS.find(mission => mission.id === id));

coreMissions.forEach((mission, index) => {
  const id = SKYBREAKER_CORE_IDS[index];
  assert(!!mission, `${id} mission is missing`);
  if (!mission) return;

  assert(mission.order === 21 + index, `${id} should be mission order ${21 + index}`);
  assert(mission.campaignArc === 'Arc 7 // Skybreaker Core', `${id} should live in Arc 7 // Skybreaker Core`);
  assert(mission.levelKitId === 'skybreaker-core', `${id} should use the skybreaker-core level kit`);
  assert(mission.environment.levelKitId === 'skybreaker-core', `${id} environment should be composed from skybreaker-core`);
  assert(mission.unlockAfterMissionId === EXPECTED_UNLOCKS[id], `${id} unlockAfterMissionId should be ${EXPECTED_UNLOCKS[id]}`);
  assert(!!mission.objectiveSet, `${id} must author objectiveSet`);
  assert((mission.objectiveSet?.primary.length ?? 0) >= 2, `${id} objectiveSet should include destroy and extract primary objectives`);

  const destroyObjective = mission.objectiveSet?.primary[0];
  assert(destroyObjective?.id === 'destroy-targets', `${id} first primary objective should be destroy-targets`);
  assert(destroyObjective?.totalCount === mission.targets.length, `${id} destroy objective totalCount should match target count`);
  assert(destroyObjective?.activatesExtraction === true, `${id} destroy objective should activate extraction`);
  assert(destroyObjective?.successorObjectiveId === 'extract', `${id} destroy objective should hand off to extraction`);
  assert(mission.objectiveSet?.primary[1]?.id === 'extract', `${id} second primary objective should be extract`);
  assert((mission.objectiveSet?.bonusConditions?.length ?? 0) >= 2, `${id} should define finale bonus conditions`);

  const snapshot = buildObjectiveSnapshot(mission, 0, new Set());
  assert(snapshot.activeObjectiveId === 'destroy-targets', `${id} initial active objective should be destroy-targets`);
  assert(snapshot.primaryObjectives[0]?.totalCount === mission.targets.length, `${id} objective snapshot total should match target count`);

  mission.targets.forEach(target => {
    assert(!!target.trackingMeta?.radarLabel, `${id}/${target.id} should have a radar label for finale readability`);
    assert(!!target.trackingMeta?.markerLabel, `${id}/${target.id} should have a marker label for finale readability`);
  });
});

const domains = new Set(coreMissions.flatMap(mission => mission?.combatDomain ? [mission.combatDomain] : []));
assert(domains.has('MIXED'), 'Skybreaker Core should use mixed-domain missions');

const targetArchetypes = new Set(coreMissions.flatMap(mission => mission?.targets.map(target => target.archetype) ?? []));
assert(targetArchetypes.has('patrol-craft'), 'Skybreaker Core should include sea-domain patrol craft targets');
assert(targetArchetypes.has('bomber'), 'Skybreaker Core finale should include airborne escape pressure');
assert(targetArchetypes.has('facility-node'), 'Skybreaker Core should include ground set-piece gates');
assert(targetArchetypes.has('relay-spire'), 'Skybreaker Core should include mega-core reactor/spire targets');

const setPieceTargets = coreMissions.flatMap(mission => mission?.targets.filter(target => !!target.setPieceArchetypeId) ?? []);
assert(setPieceTargets.length >= 8, 'Skybreaker Core should heavily use mature set-piece mechanics');
assert(coreMissions.some(mission => mission?.weatherId === 'lightning-storm'), 'Skybreaker Core should include lightning storm pressure');
assert(coreMissions.some(mission => mission?.weatherId === 'em-interference'), 'Skybreaker Core should include EM sensor pressure');
assert(coreMissions.every(mission => mission?.enemyWave && mission.enemyWave.count >= 8), 'Skybreaker Core missions should apply high-pressure enemy waves');
assert(coreMissions.slice(1).every(mission => mission?.objectiveSet?.primary[0]?.type === 'ELIMINATE_BOSS'), 'Skybreaker Core escalation missions should use boss objective semantics');

const finale = MISSIONS.find(mission => mission.id === 'last-light');
assert(finale?.missionType === 'FINALE', 'last-light should be typed as the finale mission');
assert(finale?.reward.id === 'skybreaker-core-complete', 'last-light should award skybreaker-core-complete');
assert(finale?.objectiveSet?.primary[1]?.completionMessage === 'CAMPAIGN COMPLETE', 'last-light extraction should complete the campaign');
assert(finale?.targets.length === 7, 'last-light should combine seven final targets across domains');
assert(!MISSIONS.some(mission => mission.unlockAfterMissionId === 'last-light'), 'No authored campaign mission should unlock after last-light');

if (failures.length > 0) {
  console.error('\nSkybreaker Core validation FAILED:\n');
  failures.forEach(failure => console.error(`  x ${failure}`));
  process.exit(1);
}

console.log('Skybreaker Core campaign arc validation passed.');
