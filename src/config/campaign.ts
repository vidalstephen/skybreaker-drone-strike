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
  {
    id: 'prototype-range',
    label: 'Prototype Range // Set-Piece Lab',
    missionRange: 'Prototype 90',
    focus: 'Isolated post-campaign proving ground for set-piece components, phases, movement, failure, and debrief scoring.',
    escalation: 'Exercises multiple objective systems without inserting prototype content into the main campaign arc.',
    status: 'PLANNED',
  },
  // Stage 5c: air-to-air intercept prototype arc
  {
    id: 'prototype-intercept',
    label: 'Prototype Range // Intercept Lab',
    missionRange: 'Prototype 91',
    focus: 'Isolated intercept prototype for moving airborne objectives, ace escort, and fail-mission end behavior.',
    escalation: 'Single bomber with ace escort; validates AIR_TO_AIR domain and bomber archetype without inserting into main campaign.',
    status: 'PLANNED',
  },
];