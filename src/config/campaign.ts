import type { CampaignArcDefinition } from '../types/game';

export const CAMPAIGN_ARCS: CampaignArcDefinition[] = [
  {
    id: 'signal-war',
    label: 'Arc 1 // Signal War',
    missionRange: 'Missions 01-03',
    focus: 'Teach target destruction, extraction, basic interceptors, and replay scoring.',
    escalation: 'Adds more targets and heavier patrol pressure without changing the core flight loop.',
    status: 'ACTIVE',
  },
  {
    id: 'blackout-line',
    label: 'Arc 2 // Blackout Line',
    missionRange: 'Missions 04-06',
    focus: 'Introduce mixed objectives, denser combat, and the first loadout expansion.',
    escalation: 'Pairs new enemy roles with broader arenas and tighter resource pressure.',
    status: 'ACTIVE',
  },
  {
    id: 'skybreaker-finale',
    label: 'Arc 3 // Skybreaker Finale',
    missionRange: 'Missions 07-08',
    focus: 'Combine all mission types into high-pressure finale sorties.',
    escalation: 'Moves from survival pressure into boss-pattern and mixed-objective climax missions.',
    status: 'ACTIVE',
  },
];