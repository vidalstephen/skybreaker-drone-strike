import { CAMPAIGN_ARCS } from '../src/config/campaign';
import { LEVEL_KITS } from '../src/config/levelKits';
import { MISSIONS } from '../src/config/missions';
import { buildObjectiveSnapshot } from '../src/systems/missionSystem';

const FROZEN_RELAY_IDS = ['frost-needle', 'whiteout-run', 'ghost-link', 'zero-sun-crown'];
const EXPECTED_UNLOCKS: Record<string, string> = {
  'frost-needle': 'tempest-spear',
  'whiteout-run': 'frost-needle',
  'ghost-link': 'whiteout-run',
  'zero-sun-crown': 'ghost-link',
};

const failures: string[] = [];

function assert(condition: boolean, message: string): void {
  if (!condition) failures.push(message);
}

const arc = CAMPAIGN_ARCS.find(candidate => candidate.id === 'frozen-relay');
assert(!!arc, 'frozen-relay arc is missing from CAMPAIGN_ARCS');
assert(arc?.label === 'Arc 5 // Frozen Relay', 'frozen-relay arc label changed unexpectedly');
assert(arc?.status === 'ACTIVE', 'frozen-relay arc should be ACTIVE once missions are authored');
assert(arc?.missionRange === 'Missions 13-16', 'frozen-relay arc should cover Missions 13-16');

const arcticKit = LEVEL_KITS['arctic-shelf'];
assert(!!arcticKit, 'arctic-shelf level kit is missing');
assert(arcticKit?.environment.levelKitId === 'arctic-shelf', 'arctic-shelf environment should preserve its levelKitId');
assert(arcticKit?.environment.landmarkStyle === 'ice-formations', 'arctic-shelf should use ice-formations landmarks');
assert(arcticKit?.defaultTarget.weakPointLayoutId === 'relay-core', 'arctic-shelf default target should use relay-core weak points');

const frozenRelayMissions = FROZEN_RELAY_IDS.map(id => MISSIONS.find(mission => mission.id === id));

frozenRelayMissions.forEach((mission, index) => {
  const id = FROZEN_RELAY_IDS[index];
  assert(!!mission, `${id} mission is missing`);
  if (!mission) return;

  assert(mission.order === 13 + index, `${id} should be mission order ${13 + index}`);
  assert(mission.campaignArc === 'Arc 5 // Frozen Relay', `${id} should live in Arc 5 // Frozen Relay`);
  assert(mission.levelKitId === 'arctic-shelf', `${id} should use the arctic-shelf level kit`);
  assert(mission.environment.levelKitId === 'arctic-shelf', `${id} environment should be composed from arctic-shelf`);
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

  mission.targets.forEach(target => {
    assert(!!target.trackingMeta?.radarLabel, `${id}/${target.id} should have a radar label for low-visibility readability`);
    assert(!!target.trackingMeta?.markerLabel, `${id}/${target.id} should have a marker label for low-visibility readability`);
  });
});

const weatherIds = new Set(frozenRelayMissions.flatMap(mission => mission?.weatherId ? [mission.weatherId] : []));
assert(weatherIds.has('snow-frost'), 'Frozen Relay should include snow-frost weather pressure');
assert(weatherIds.has('em-interference'), 'Frozen Relay should include EM interference sensor pressure');

const timeOfDayIds = new Set(frozenRelayMissions.flatMap(mission => mission?.timeOfDay ? [mission.timeOfDay] : []));
assert(timeOfDayIds.has('day'), 'Frozen Relay should include a bright daytime arctic readability mission');
assert(timeOfDayIds.has('night'), 'Frozen Relay should include a low-light sensor-pressure mission');
assert(timeOfDayIds.has('dawn'), 'Frozen Relay should include a dawn glare finale mission');

const whiteoutRun = MISSIONS.find(mission => mission.id === 'whiteout-run');
assert(whiteoutRun?.missionType === 'INTERCEPT', 'whiteout-run should use INTERCEPT mission type');
assert(whiteoutRun?.combatDomain === 'AIR_TO_AIR', 'whiteout-run should use AIR_TO_AIR combat domain');
assert(whiteoutRun?.targets.length === 2, 'whiteout-run should have two courier targets');
whiteoutRun?.targets.forEach(target => {
  assert(target.archetype === 'transport', `whiteout-run/${target.id} should use transport target archetype`);
  assert(!!target.movement, `whiteout-run/${target.id} should move across the shelf`);
  assert(target.movement?.loopMode === 'once', `whiteout-run/${target.id} should be a one-way intercept target`);
  assert(target.movement?.endBehavior === 'fail-mission', `whiteout-run/${target.id} should fail the mission if it escapes`);
  assert((target.position[1] ?? 0) > 100, `whiteout-run/${target.id} should be airborne`);
});
assert(whiteoutRun?.enemyWave.triggerTargetsDestroyed === 0, 'whiteout-run escort should spawn at mission start');
assert(whiteoutRun?.enemyWave.composition.some(entry => entry.role === 'ace-interceptor'), 'whiteout-run should include ace interceptor escort');

const zeroSun = MISSIONS.find(mission => mission.id === 'zero-sun-crown');
assert(zeroSun?.missionType === 'BOSS', 'zero-sun-crown should be the Frozen Relay boss mission');
assert(zeroSun?.objectiveSet?.primary[0]?.type === 'ELIMINATE_BOSS', 'zero-sun-crown should use ELIMINATE_BOSS objective semantics');
assert(zeroSun?.reward.id === 'frozen-relay-secured', 'zero-sun-crown should award frozen-relay-secured');

const nextArcUnlocks = MISSIONS.filter(mission => mission.unlockAfterMissionId === 'zero-sun-crown');
assert(nextArcUnlocks.length === 1, 'Exactly one Red Canyon mission should unlock from zero-sun-crown');
assert(nextArcUnlocks[0]?.id === 'canyon-vanguard', 'canyon-vanguard should be the first Red Canyon unlock after zero-sun-crown');

if (failures.length > 0) {
  console.error('\nFrozen Relay validation FAILED:\n');
  failures.forEach(failure => console.error(`  x ${failure}`));
  process.exit(1);
}

console.log('Frozen Relay campaign arc validation passed.');
