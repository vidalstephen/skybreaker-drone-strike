import type {
  MissionTargetArchetype,
  MissionTargetDefinition,
  SetPieceArchetypeDefinition,
  SetPieceArchetypeId,
} from '../types/game';

export const SET_PIECE_ARCHETYPES: Record<SetPieceArchetypeId, SetPieceArchetypeDefinition> = {
  'legacy-tower': {
    id: 'legacy-tower',
    label: 'Legacy Tower',
    description: 'Simple destroyable tower target used by current strike missions.',
    combatDomains: ['AIR_TO_LAND'],
    missionTypes: ['STRIKE', 'SABOTAGE'],
    renderArchetype: 'tower',
    compatibleTargetArchetypes: ['tower', 'facility-node'],
    components: [
      { id: 'tower-core', label: 'Tower Core', role: 'core', health: 100, required: true, exposure: 'exposed', radius: 16 },
    ],
    phases: [
      { id: 'neutralize', label: 'Neutralize Core', trigger: 'all-required-components-destroyed', activeComponentIds: ['tower-core'], requiredComponentIds: ['tower-core'] },
    ],
    defaultTrackingMeta: { radarLabel: 'TWR', markerLabel: 'TOWER', priorityBonus: 20 },
  },
  'legacy-relay-spire': {
    id: 'legacy-relay-spire',
    label: 'Legacy Relay Spire',
    description: 'Current relay-spire target with required exposed relay components.',
    combatDomains: ['AIR_TO_LAND'],
    missionTypes: ['STRIKE', 'SABOTAGE'],
    renderArchetype: 'relay-spire',
    compatibleTargetArchetypes: ['relay-spire'],
    components: [
      { id: 'relay-core', label: 'Relay Core', role: 'core', health: 45, required: true, exposure: 'exposed', offset: [0, 38, 7], radius: 12 },
      { id: 'upper-node', label: 'Upper Node', role: 'weak-point', health: 45, required: true, exposure: 'exposed', offset: [0, 64, -6], radius: 12 },
      { id: 'stabilizer', label: 'Stabilizer', role: 'weak-point', health: 35, required: true, exposure: 'exposed', offset: [8, 24, 0], radius: 11 },
    ],
    phases: [
      { id: 'collapse-relay', label: 'Collapse Relay', trigger: 'all-required-components-destroyed', activeComponentIds: ['relay-core', 'upper-node', 'stabilizer'], requiredComponentIds: ['relay-core', 'upper-node', 'stabilizer'] },
    ],
    defaultTrackingMeta: { radarLabel: 'RLY', markerLabel: 'RELAY', priorityBonus: 30 },
  },
  'radar-network': {
    id: 'radar-network',
    label: 'Radar Network',
    description: 'Linked radar arrays with optional dishes and a protected uplink core.',
    combatDomains: ['AIR_TO_LAND', 'MIXED'],
    missionTypes: ['STRIKE', 'RECON', 'SABOTAGE'],
    renderArchetype: 'tower',
    compatibleTargetArchetypes: ['tower'],
    components: [
      { id: 'array-left', label: 'Left Array', role: 'radar-array', health: 50, required: true, exposure: 'exposed', offset: [-7, 44, 0], radius: 13 },
      { id: 'array-right', label: 'Right Array', role: 'radar-array', health: 50, required: true, exposure: 'exposed', offset: [7, 44, 0], radius: 13 },
      { id: 'uplink-core', label: 'Uplink Core', role: 'core', health: 100, required: true, exposure: 'shielded', radius: 16 },
    ],
    phases: [
      { id: 'break-arrays', label: 'Break Arrays', trigger: 'all-required-components-destroyed', activeComponentIds: ['array-left', 'array-right'], requiredComponentIds: ['array-left', 'array-right'], exposesComponentIds: ['uplink-core'], nextPhaseId: 'burn-core' },
      { id: 'burn-core', label: 'Burn Uplink Core', trigger: 'all-required-components-destroyed', activeComponentIds: ['uplink-core'], requiredComponentIds: ['uplink-core'] },
    ],
    defaultTrackingMeta: { radarLabel: 'RAD', markerLabel: 'RADAR', priorityBonus: 35, attentionReason: 'Sensor coverage node' },
  },
  'shield-generator': {
    id: 'shield-generator',
    label: 'Shield Generator',
    description: 'Shielded generator with exposed stabilizers before the core can be damaged.',
    combatDomains: ['AIR_TO_LAND', 'MIXED'],
    missionTypes: ['STRIKE', 'SABOTAGE', 'BOSS'],
    renderArchetype: 'relay-spire',
    compatibleTargetArchetypes: ['relay-spire', 'facility-node'],
    components: [
      { id: 'stabilizer-a', label: 'Stabilizer A', role: 'shield-node', health: 55, required: true, exposure: 'exposed', radius: 12 },
      { id: 'stabilizer-b', label: 'Stabilizer B', role: 'shield-node', health: 55, required: true, exposure: 'exposed', radius: 12 },
      { id: 'generator-core', label: 'Generator Core', role: 'core', health: 180, required: true, exposure: 'shielded', radius: 18 },
    ],
    phases: [
      { id: 'drop-shield', label: 'Drop Shield', trigger: 'all-required-components-destroyed', activeComponentIds: ['stabilizer-a', 'stabilizer-b'], requiredComponentIds: ['stabilizer-a', 'stabilizer-b'], exposesComponentIds: ['generator-core'], nextPhaseId: 'destroy-generator' },
      { id: 'destroy-generator', label: 'Destroy Generator', trigger: 'all-required-components-destroyed', activeComponentIds: ['generator-core'], requiredComponentIds: ['generator-core'] },
    ],
    defaultTrackingMeta: { radarLabel: 'SHD', markerLabel: 'SHIELD', priorityBonus: 45, attentionReason: 'Shield gate active' },
  },
  convoy: {
    id: 'convoy',
    label: 'Armored Convoy',
    description: 'Moving ground convoy with lead, cargo, escort, and optional support vehicles.',
    combatDomains: ['AIR_TO_LAND', 'MIXED'],
    missionTypes: ['INTERCEPT', 'SABOTAGE', 'ESCORT'],
    components: [
      { id: 'lead-vehicle', label: 'Lead Vehicle', role: 'core', health: 140, required: true, exposure: 'exposed', radius: 18 },
      { id: 'cargo-vehicle', label: 'Cargo Vehicle', role: 'cargo', health: 110, required: true, exposure: 'exposed', radius: 18 },
      { id: 'escort-vehicle', label: 'Escort Vehicle', role: 'escort', health: 90, required: false, exposure: 'exposed', radius: 16 },
    ],
    phases: [
      { id: 'intercept-route', label: 'Intercept Route', trigger: 'component-destroyed', activeComponentIds: ['lead-vehicle', 'cargo-vehicle', 'escort-vehicle'], requiredComponentIds: ['lead-vehicle', 'cargo-vehicle'] },
    ],
    defaultTrackingMeta: { radarLabel: 'CNV', markerLabel: 'CONVOY', priorityBonus: 40, routeHint: 'Cut off the route' },
  },
  'sam-site': {
    id: 'sam-site',
    label: 'SAM Site',
    description: 'Surface-to-air missile site with launcher, radar, and optional ammo stores.',
    combatDomains: ['AIR_TO_LAND', 'MIXED'],
    missionTypes: ['STRIKE', 'DEFENSE', 'SABOTAGE'],
    renderArchetype: 'facility-node',
    compatibleTargetArchetypes: ['facility-node', 'tower'],
    components: [
      { id: 'tracking-radar', label: 'Tracking Radar', role: 'radar-array', health: 80, required: true, exposure: 'exposed', radius: 14 },
      { id: 'launcher', label: 'Launcher', role: 'weapon', health: 130, required: true, exposure: 'exposed', radius: 18 },
      { id: 'ammo-cache', label: 'Ammo Cache', role: 'optional-system', health: 70, required: false, exposure: 'hidden', radius: 14 },
    ],
    phases: [
      { id: 'blind-site', label: 'Blind Site', trigger: 'component-destroyed', activeComponentIds: ['tracking-radar'], requiredComponentIds: ['tracking-radar'], exposesComponentIds: ['launcher', 'ammo-cache'], nextPhaseId: 'destroy-launcher' },
      { id: 'destroy-launcher', label: 'Destroy Launcher', trigger: 'all-required-components-destroyed', activeComponentIds: ['launcher', 'ammo-cache'], requiredComponentIds: ['launcher'] },
    ],
    defaultTrackingMeta: { radarLabel: 'SAM', markerLabel: 'SAM', priorityBonus: 60, attentionReason: 'Surface missile threat' },
  },
  reactor: {
    id: 'reactor',
    label: 'Reactor Complex',
    description: 'Industrial reactor objective with coolant nodes and a final core exposure.',
    combatDomains: ['AIR_TO_LAND', 'MIXED'],
    missionTypes: ['SABOTAGE', 'STRIKE', 'BOSS'],
    renderArchetype: 'facility-node',
    compatibleTargetArchetypes: ['facility-node', 'relay-spire'],
    components: [
      { id: 'coolant-a', label: 'Coolant A', role: 'weak-point', health: 70, required: true, exposure: 'exposed', radius: 13 },
      { id: 'coolant-b', label: 'Coolant B', role: 'weak-point', health: 70, required: true, exposure: 'exposed', radius: 13 },
      { id: 'reactor-core', label: 'Reactor Core', role: 'reactor', health: 220, required: true, exposure: 'phase-gated', radius: 22 },
    ],
    phases: [
      { id: 'rupture-coolant', label: 'Rupture Coolant', trigger: 'all-required-components-destroyed', activeComponentIds: ['coolant-a', 'coolant-b'], requiredComponentIds: ['coolant-a', 'coolant-b'], exposesComponentIds: ['reactor-core'], nextPhaseId: 'overload-core' },
      { id: 'overload-core', label: 'Overload Core', trigger: 'health-threshold', activeComponentIds: ['reactor-core'], requiredComponentIds: ['reactor-core'], healthThreshold: 0 },
    ],
    defaultTrackingMeta: { radarLabel: 'RCT', markerLabel: 'REACTOR', priorityBonus: 55, attentionReason: 'Volatile objective' },
  },
  bridge: {
    id: 'bridge',
    label: 'Bridge Span',
    description: 'Multi-span bridge target for route denial and convoy interruption.',
    combatDomains: ['AIR_TO_LAND', 'MIXED'],
    missionTypes: ['SABOTAGE', 'INTERCEPT', 'DEFENSE'],
    components: [
      { id: 'north-pylon', label: 'North Pylon', role: 'bridge-span', health: 120, required: true, exposure: 'exposed', radius: 18 },
      { id: 'center-span', label: 'Center Span', role: 'bridge-span', health: 150, required: true, exposure: 'exposed', radius: 22 },
      { id: 'south-pylon', label: 'South Pylon', role: 'bridge-span', health: 120, required: true, exposure: 'exposed', radius: 18 },
    ],
    phases: [
      { id: 'cut-span', label: 'Cut Span', trigger: 'all-required-components-destroyed', activeComponentIds: ['north-pylon', 'center-span', 'south-pylon'], requiredComponentIds: ['north-pylon', 'center-span', 'south-pylon'] },
    ],
    defaultTrackingMeta: { radarLabel: 'BRG', markerLabel: 'BRIDGE', priorityBonus: 35, routeHint: 'Break crossing route' },
  },
  carrier: {
    id: 'carrier',
    label: 'Carrier Group',
    description: 'Large naval objective with deck guns, radar mast, engines, and command tower.',
    combatDomains: ['AIR_TO_SEA', 'MIXED'],
    missionTypes: ['BOSS', 'STRIKE', 'FINALE'],
    components: [
      { id: 'radar-mast', label: 'Radar Mast', role: 'radar-array', health: 120, required: true, exposure: 'exposed', radius: 16 },
      { id: 'deck-gun-port', label: 'Port Deck Gun', role: 'weapon', health: 100, required: false, exposure: 'exposed', radius: 15 },
      { id: 'deck-gun-starboard', label: 'Starboard Deck Gun', role: 'weapon', health: 100, required: false, exposure: 'exposed', radius: 15 },
      { id: 'engine-room', label: 'Engine Room', role: 'engine', health: 180, required: true, exposure: 'phase-gated', radius: 20 },
      { id: 'command-tower', label: 'Command Tower', role: 'core', health: 260, required: true, exposure: 'shielded', radius: 24 },
    ],
    phases: [
      { id: 'silence-deck', label: 'Silence Deck', trigger: 'component-destroyed', activeComponentIds: ['radar-mast', 'deck-gun-port', 'deck-gun-starboard'], requiredComponentIds: ['radar-mast'], exposesComponentIds: ['engine-room'], nextPhaseId: 'disable-mobility' },
      { id: 'disable-mobility', label: 'Disable Mobility', trigger: 'component-destroyed', activeComponentIds: ['engine-room'], requiredComponentIds: ['engine-room'], exposesComponentIds: ['command-tower'], nextPhaseId: 'decapitate-command' },
      { id: 'decapitate-command', label: 'Decapitate Command', trigger: 'all-required-components-destroyed', activeComponentIds: ['command-tower'], requiredComponentIds: ['command-tower'] },
    ],
    defaultTrackingMeta: { radarLabel: 'CV', markerLabel: 'CARRIER', priorityBonus: 80, attentionReason: 'Capital target' },
  },
  platform: {
    id: 'platform',
    label: 'Ocean Platform',
    description: 'Fixed sea platform with crane arms, generators, and central command module.',
    combatDomains: ['AIR_TO_SEA', 'AIR_TO_LAND', 'MIXED'],
    missionTypes: ['STRIKE', 'DEFENSE', 'SABOTAGE'],
    renderArchetype: 'facility-node',
    components: [
      { id: 'generator-a', label: 'Generator A', role: 'shield-node', health: 90, required: true, exposure: 'exposed', radius: 15 },
      { id: 'generator-b', label: 'Generator B', role: 'shield-node', health: 90, required: true, exposure: 'exposed', radius: 15 },
      { id: 'command-module', label: 'Command Module', role: 'core', health: 180, required: true, exposure: 'shielded', radius: 20 },
      { id: 'crane-arm', label: 'Crane Arm', role: 'optional-system', health: 70, required: false, exposure: 'exposed', radius: 16 },
    ],
    phases: [
      { id: 'drop-platform-shield', label: 'Drop Platform Shield', trigger: 'all-required-components-destroyed', activeComponentIds: ['generator-a', 'generator-b', 'crane-arm'], requiredComponentIds: ['generator-a', 'generator-b'], exposesComponentIds: ['command-module'], nextPhaseId: 'destroy-command' },
      { id: 'destroy-command', label: 'Destroy Command', trigger: 'all-required-components-destroyed', activeComponentIds: ['command-module'], requiredComponentIds: ['command-module'] },
    ],
    defaultTrackingMeta: { radarLabel: 'PLT', markerLabel: 'PLATFORM', priorityBonus: 45 },
  },
  frigate: {
    id: 'frigate',
    label: 'Command Frigate',
    description: 'Mobile naval or airborne command target with weapons and command core.',
    combatDomains: ['AIR_TO_SEA', 'AIR_TO_AIR', 'MIXED'],
    missionTypes: ['BOSS', 'INTERCEPT', 'FINALE'],
    components: [
      { id: 'port-cannon', label: 'Port Cannon', role: 'weapon', health: 95, required: false, exposure: 'exposed', radius: 14 },
      { id: 'starboard-cannon', label: 'Starboard Cannon', role: 'weapon', health: 95, required: false, exposure: 'exposed', radius: 14 },
      { id: 'drive-core', label: 'Drive Core', role: 'engine', health: 150, required: true, exposure: 'phase-gated', radius: 18 },
      { id: 'command-core', label: 'Command Core', role: 'core', health: 220, required: true, exposure: 'shielded', radius: 22 },
    ],
    phases: [
      { id: 'disarm-frigate', label: 'Disarm Frigate', trigger: 'component-destroyed', activeComponentIds: ['port-cannon', 'starboard-cannon'], exposesComponentIds: ['drive-core'], nextPhaseId: 'break-drive' },
      { id: 'break-drive', label: 'Break Drive', trigger: 'component-destroyed', activeComponentIds: ['drive-core'], requiredComponentIds: ['drive-core'], exposesComponentIds: ['command-core'], nextPhaseId: 'finish-command' },
      { id: 'finish-command', label: 'Finish Command', trigger: 'all-required-components-destroyed', activeComponentIds: ['command-core'], requiredComponentIds: ['command-core'] },
    ],
    defaultTrackingMeta: { radarLabel: 'FRG', markerLabel: 'FRIGATE', priorityBonus: 75, attentionReason: 'Command unit' },
  },
  'mega-core': {
    id: 'mega-core',
    label: 'Mega-Core',
    description: 'Finale-scale multi-phase core with shield gates, reactor nodes, and escape window hooks.',
    combatDomains: ['MIXED'],
    missionTypes: ['FINALE', 'BOSS'],
    renderArchetype: 'relay-spire',
    components: [
      { id: 'shield-gate-a', label: 'Shield Gate A', role: 'shield-node', health: 140, required: true, exposure: 'exposed', radius: 18 },
      { id: 'shield-gate-b', label: 'Shield Gate B', role: 'shield-node', health: 140, required: true, exposure: 'exposed', radius: 18 },
      { id: 'reactor-ring', label: 'Reactor Ring', role: 'reactor', health: 260, required: true, exposure: 'phase-gated', radius: 26 },
      { id: 'skybreaker-core', label: 'Skybreaker Core', role: 'core', health: 420, required: true, exposure: 'shielded', radius: 32 },
    ],
    phases: [
      { id: 'open-gates', label: 'Open Shield Gates', trigger: 'all-required-components-destroyed', activeComponentIds: ['shield-gate-a', 'shield-gate-b'], requiredComponentIds: ['shield-gate-a', 'shield-gate-b'], exposesComponentIds: ['reactor-ring'], nextPhaseId: 'rupture-ring' },
      { id: 'rupture-ring', label: 'Rupture Reactor Ring', trigger: 'component-destroyed', activeComponentIds: ['reactor-ring'], requiredComponentIds: ['reactor-ring'], exposesComponentIds: ['skybreaker-core'], nextPhaseId: 'destroy-core' },
      { id: 'destroy-core', label: 'Destroy Core', trigger: 'health-threshold', activeComponentIds: ['skybreaker-core'], requiredComponentIds: ['skybreaker-core'], healthThreshold: 0 },
    ],
    defaultTrackingMeta: { radarLabel: 'CORE', markerLabel: 'MEGA CORE', priorityBonus: 100, attentionReason: 'Final objective' },
  },
};

export const LEGACY_TARGET_SET_PIECE_MAP: Partial<Record<MissionTargetArchetype, SetPieceArchetypeId>> = {
  tower: 'legacy-tower',
  'relay-spire': 'legacy-relay-spire',
  'facility-node': 'legacy-tower',
};

export function getSetPieceArchetype(id: SetPieceArchetypeId): SetPieceArchetypeDefinition {
  return SET_PIECE_ARCHETYPES[id];
}

export function resolveSetPieceArchetypeForTarget(target: MissionTargetDefinition): SetPieceArchetypeDefinition {
  const weakPointIds = new Set((target.weakPoints ?? []).map(weakPoint => weakPoint.id));
  const inferredId = weakPointIds.has('array-left') && weakPointIds.has('array-right')
    ? 'radar-network'
    : weakPointIds.has('relay-core') && weakPointIds.has('upper-node')
      ? 'legacy-relay-spire'
      : undefined;
  const id = target.setPieceArchetypeId ?? inferredId ?? (target.archetype ? LEGACY_TARGET_SET_PIECE_MAP[target.archetype] : undefined) ?? 'legacy-tower';
  return getSetPieceArchetype(id);
}