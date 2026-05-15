import { CAMPAIGN_ARCS } from '../src/config/campaign';
import { MISSIONS } from '../src/config/missions';
import { buildObjectiveSnapshot } from '../src/systems/missionSystem';

const STORM_COAST_IDS = ['coastal-knife', 'squall-hook', 'tidebreaker-array', 'tempest-spear'];
const EXPECTED_UNLOCKS: Record<string, string> = {
  'coastal-knife': 'final-dawn',
  'squall-hook': 'coastal-knife',
  'tidebreaker-array': 'squall-hook',
  'tempest-spear': 'tidebreaker-array',
};

const failures: string[] = [];

function assert(condition: boolean, message: string): void {
  if (!condition) failures.push(message);
}

const arc = CAMPAIGN_ARCS.find(candidate => candidate.id === 'storm-coast');
assert(!!arc, 'storm-coast arc is missing from CAMPAIGN_ARCS');
assert(arc?.label === 'Arc 4 // Storm Coast', 'storm-coast arc label changed unexpectedly');
assert(arc?.status === 'ACTIVE', 'storm-coast arc should be ACTIVE once missions are authored');
assert(arc?.missionRange === 'Missions 09-12', 'storm-coast arc should cover Missions 09-12');

const stormCoastMissions = STORM_COAST_IDS.map(id => MISSIONS.find(mission => mission.id === id));

stormCoastMissions.forEach((mission, index) => {
  const id = STORM_COAST_IDS[index];
  assert(!!mission, `${id} mission is missing`);
  if (!mission) return;

  assert(mission.order === 9 + index, `${id} should be mission order ${9 + index}`);
  assert(mission.campaignArc === 'Arc 4 // Storm Coast', `${id} should live in Arc 4 // Storm Coast`);
  assert(mission.levelKitId === 'storm-coast', `${id} should use the storm-coast level kit`);
  assert(mission.environment.levelKitId === 'storm-coast', `${id} environment should be composed from storm-coast`);
  assert(mission.unlockAfterMissionId === EXPECTED_UNLOCKS[id], `${id} unlockAfterMissionId should be ${EXPECTED_UNLOCKS[id]}`);
  assert(!!mission.objectiveSet, `${id} must author objectiveSet`);
  assert((mission.objectiveSet?.primary.length ?? 0) >= 2, `${id} objectiveSet should include destroy and extract primary objectives`);

  const destroyObjective = mission.objectiveSet?.primary[0];
  assert(destroyObjective?.id === 'destroy-targets', `${id} first primary objective should be destroy-targets`);
  assert(destroyObjective?.totalCount === mission.targets.length, `${id} destroy objective totalCount should match target count`);
  assert(destroyObjective?.activatesExtraction === true, `${id} destroy objective should activate extraction`);
  assert(destroyObjective?.successorObjectiveId === 'extract', `${id} destroy objective should hand off to extraction`);
  assert(mission.objectiveSet?.primary[1]?.id === 'extract', `${id} second primary objective should be extract`);
  assert((mission.objectiveSet?.bonusConditions?.length ?? 0) >= 2, `${id} should define score bonus conditions`);

  const snapshot = buildObjectiveSnapshot(mission, 0, new Set());
  assert(snapshot.activeObjectiveId === 'destroy-targets', `${id} initial active objective should be destroy-targets`);
  assert(snapshot.primaryObjectives[0]?.totalCount === mission.targets.length, `${id} objective snapshot total should match target count`);

  const navalTargets = mission.targets.filter(target => target.archetype === 'patrol-craft');
  assert(navalTargets.length >= 1, `${id} should include at least one patrol craft target`);
  navalTargets.forEach(target => {
    assert(!!target.movement, `${id}/${target.id} patrol craft should have movement data`);
    assert((target.movement?.route.length ?? 0) >= 2, `${id}/${target.id} patrol craft route should have at least two waypoints`);
    assert((target.weakPoints?.some(point => point.required) ?? false), `${id}/${target.id} patrol craft should keep required naval weak points`);
  });
});

const weatherIds = new Set(stormCoastMissions.flatMap(mission => mission?.weatherId ? [mission.weatherId] : []));
assert(weatherIds.has('rain'), 'Storm Coast should introduce rain weather pressure');
assert(weatherIds.has('sea-squall'), 'Storm Coast should include sea-squall weather pressure');
assert(weatherIds.has('lightning-storm'), 'Storm Coast should escalate into lightning storm pressure');

const lastStormMission = MISSIONS.find(mission => mission.id === 'tempest-spear');
const nextArcUnlocks = MISSIONS.filter(mission => mission.unlockAfterMissionId === 'tempest-spear');
assert(nextArcUnlocks.length === 1, 'Exactly one Frozen Relay mission should unlock from tempest-spear');
assert(nextArcUnlocks[0]?.id === 'frost-needle', 'frost-needle should be the first Frozen Relay unlock after tempest-spear');
assert(lastStormMission?.reward.id === 'storm-coast-secured', 'tempest-spear should award storm-coast-secured');

if (failures.length > 0) {
  console.error('\nStorm Coast validation FAILED:\n');
  failures.forEach(failure => console.error(`  x ${failure}`));
  process.exit(1);
}

console.log('Storm Coast campaign arc validation passed.');
