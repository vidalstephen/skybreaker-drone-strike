import { CAMPAIGN_ARCS } from '../src/config/campaign';
import { LEVEL_KITS } from '../src/config/levelKits';
import { MISSIONS } from '../src/config/missions';
import { buildObjectiveSnapshot } from '../src/systems/missionSystem';

const RED_CANYON_IDS = ['canyon-vanguard', 'railfire-pass', 'scarlet-siege', 'bastion-fall'];
const EXPECTED_UNLOCKS: Record<string, string> = {
  'canyon-vanguard': 'zero-sun-crown',
  'railfire-pass': 'canyon-vanguard',
  'scarlet-siege': 'railfire-pass',
  'bastion-fall': 'scarlet-siege',
};

const failures: string[] = [];

function assert(condition: boolean, message: string): void {
  if (!condition) failures.push(message);
}

const arc = CAMPAIGN_ARCS.find(candidate => candidate.id === 'red-canyon-siege');
assert(!!arc, 'red-canyon-siege arc is missing from CAMPAIGN_ARCS');
assert(arc?.label === 'Arc 6 // Red Canyon Siege', 'red-canyon-siege arc label changed unexpectedly');
assert(arc?.status === 'ACTIVE', 'red-canyon-siege arc should be ACTIVE once missions are authored');
assert(arc?.missionRange === 'Missions 17-20', 'red-canyon-siege arc should cover Missions 17-20');

const redCanyonKit = LEVEL_KITS['red-canyon'];
assert(!!redCanyonKit, 'red-canyon level kit is missing');
assert(redCanyonKit?.environment.levelKitId === 'red-canyon', 'red-canyon environment should preserve its levelKitId');
assert(redCanyonKit?.environment.landmarkStyle === 'ruins', 'red-canyon should use dense ruin/canyon route landmarks');
assert(redCanyonKit?.waypointStyle === 'ash-relay', 'red-canyon should use high-contrast ash relay markers');

const redCanyonMissions = RED_CANYON_IDS.map(id => MISSIONS.find(mission => mission.id === id));

redCanyonMissions.forEach((mission, index) => {
  const id = RED_CANYON_IDS[index];
  assert(!!mission, `${id} mission is missing`);
  if (!mission) return;

  assert(mission.order === 17 + index, `${id} should be mission order ${17 + index}`);
  assert(mission.campaignArc === 'Arc 6 // Red Canyon Siege', `${id} should live in Arc 6 // Red Canyon Siege`);
  assert(mission.levelKitId === 'red-canyon', `${id} should use the red-canyon level kit`);
  assert(mission.environment.levelKitId === 'red-canyon', `${id} environment should be composed from red-canyon`);
  assert(mission.unlockAfterMissionId === EXPECTED_UNLOCKS[id], `${id} unlockAfterMissionId should be ${EXPECTED_UNLOCKS[id]}`);
  assert(!!mission.objectiveSet, `${id} must author objectiveSet`);
  assert((mission.objectiveSet?.primary.length ?? 0) >= 2, `${id} objectiveSet should include destroy and extract primary objectives`);

  const destroyObjective = mission.objectiveSet?.primary[0];
  assert(destroyObjective?.id === 'destroy-targets', `${id} first primary objective should be destroy-targets`);
  assert(destroyObjective?.totalCount === mission.targets.length, `${id} destroy objective totalCount should match target count`);
  assert(destroyObjective?.activatesExtraction === true, `${id} destroy objective should activate extraction`);
  assert(destroyObjective?.successorObjectiveId === 'extract', `${id} destroy objective should hand off to extraction`);
  assert(mission.objectiveSet?.primary[1]?.id === 'extract', `${id} second primary objective should be extract`);
  assert((mission.objectiveSet?.bonusConditions?.length ?? 0) >= 2, `${id} should define attack-run bonus conditions`);

  const snapshot = buildObjectiveSnapshot(mission, 0, new Set());
  assert(snapshot.activeObjectiveId === 'destroy-targets', `${id} initial active objective should be destroy-targets`);
  assert(snapshot.primaryObjectives[0]?.totalCount === mission.targets.length, `${id} objective snapshot total should match target count`);

  mission.targets.forEach(target => {
    assert(!!target.trackingMeta?.radarLabel, `${id}/${target.id} should have a radar label for canyon readability`);
    assert(!!target.trackingMeta?.markerLabel, `${id}/${target.id} should have a marker label for canyon readability`);
  });
});

const movingTargets = redCanyonMissions.flatMap(mission => mission?.targets.filter(target => !!target.movement) ?? []);
assert(movingTargets.length >= 4, 'Red Canyon should feature multiple moving ground targets');
movingTargets.forEach(target => {
  assert((target.movement?.route.length ?? 0) >= 1, `${target.id} should define a readable canyon route`);
  assert(!!target.trackingMeta?.routeHint, `${target.id} should include routeHint text for lane pressure`);
});

const artilleryTargets = redCanyonMissions.flatMap(mission => mission?.targets.filter(target => target.setPieceArchetypeId === 'sam-site') ?? []);
assert(artilleryTargets.length >= 4, 'Red Canyon should include artillery/SAM-style set-piece pressure');
assert(redCanyonMissions.some(mission => mission?.objectiveSet?.primary[0]?.type === 'ELIMINATE_BOSS'), 'Red Canyon should culminate in a boss-style bastion objective');

const weatherIds = new Set(redCanyonMissions.flatMap(mission => mission?.weatherId ? [mission.weatherId] : []));
assert(weatherIds.has('crosswind'), 'Red Canyon should include canyon crosswind pressure');
assert(weatherIds.has('ash-storm'), 'Red Canyon should include ash storm route pressure');
assert(weatherIds.has('em-interference'), 'Red Canyon should include marker/radar pressure');

const nextArcUnlocks = MISSIONS.filter(mission => mission.unlockAfterMissionId === 'bastion-fall');
assert(nextArcUnlocks.length === 1, 'Exactly one Skybreaker Core mission should unlock from bastion-fall');
assert(nextArcUnlocks[0]?.id === 'core-needle', 'core-needle should be the first Skybreaker Core unlock after bastion-fall');

if (failures.length > 0) {
  console.error('\nRed Canyon validation FAILED:\n');
  failures.forEach(failure => console.error(`  x ${failure}`));
  process.exit(1);
}

console.log('Red Canyon campaign arc validation passed.');
