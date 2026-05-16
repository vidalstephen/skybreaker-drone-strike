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
  // Stage 5d: air-to-land ground threat prototype arc
  {
    id: 'prototype-ground-defense',
    label: 'Prototype Range // Ground Defense Lab',
    missionRange: 'Prototype 92',
    focus: 'Isolated ground threat prototype for SAM batteries, flak cannons, railgun emplacements, and surface warning HUD.',
    escalation: 'Static surface emplacements firing at player without inserting into main campaign.',
    status: 'PLANNED',
  },
  // Stage 5e: air-to-sea naval prototype arc
  {
    id: 'prototype-sea',
    label: 'Prototype Range // Sea Warfare Lab',
    missionRange: 'Prototype 93',
    focus: 'Isolated naval prototype for moving patrol craft, ocean-platform biome, patrol-craft-vitals weak points, and sea-surface target movement.',
    escalation: 'Single looping patrol craft with air CAP; validates AIR_TO_SEA domain and patrol-craft archetype.',
    status: 'PLANNED',
  },
  // Stage 6a: expanded campaign arcs — missions authored in Stage 6c-6f
  {
    id: 'storm-coast',
    label: 'Arc 4 // Storm Coast',
    missionRange: 'Missions 09-12',
    focus: 'Introduce naval operations, storm weather pressure, and sea-to-air engagement variety.',
    escalation: 'Missions escalate from coastal patrol interdiction through naval strike with full-weather modifiers and moving targets.',
    status: 'ACTIVE',
  },
  {
    id: 'frozen-relay',
    label: 'Arc 5 // Frozen Relay',
    missionRange: 'Missions 13-16',
    focus: 'Arctic low-visibility operations, sensor pressure, and long-range interception objectives.',
    escalation: 'Snow/frost weather degrades radar and locks; fragile sensor-link objectives force precision play under reduced information.',
    status: 'ACTIVE',
  },
  {
    id: 'red-canyon-siege',
    label: 'Arc 6 // Red Canyon Siege',
    missionRange: 'Missions 17-20',
    focus: 'Canyon-lane combat, moving convoys, artillery emplacements, and terrain-route pressure.',
    escalation: 'Attack-run scoring incentives reward precision low passes; terrain funnels engagements and tests mobile marker readability.',
    status: 'ACTIVE',
  },
  {
    id: 'skybreaker-core',
    label: 'Arc 7 // Skybreaker Core',
    missionRange: 'Missions 21-24',
    focus: 'Final mixed-domain climax missions combining air, land, sea, set pieces, weather, and bosses.',
    escalation: 'Builds to a finale mission that requires mastery of all combat domains; campaign completion state and final rewards.',
    status: 'ACTIVE',
  },
  // Stage 9a: optional sorties — separate section, unlocked by arc reward, not required for campaign completion
  {
    id: 'optional-sorties',
    label: 'Optional Sorties',
    missionRange: 'Sorties',
    focus: 'High-difficulty domain-specific challenges unlocked by completing campaign arcs.',
    escalation: 'Each sortie isolates a single combat domain under pressure. Not required to complete the campaign.',
    status: 'ACTIVE',
  },
];