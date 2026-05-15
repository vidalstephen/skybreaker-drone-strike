/**
 * Stage 7c — Upgrade Trees
 * Defines upgrade nodes, trees, effects, and purchase helpers.
 * Effects are applied at mission-start time in Game.tsx via resolveUpgradeEffects().
 */

import type { PlayerInventory, UpgradeCoreId } from '../types/game';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UpgradeNode {
  /** Unique key used as the record key in PlayerInventory.upgradeLevels. */
  id: string;
  /** Which core tree this belongs to. */
  coreId: UpgradeCoreId;
  /** Display label. */
  label: string;
  /** One-line effect description shown in UI. */
  description: string;
  /** Spare parts required to purchase. */
  costParts: number;
  /** If set, this node.id must already be purchased (upgradeLevels[requires] >= 1) before this node is available. */
  requires?: string;
}

export interface UpgradeTree {
  coreId: UpgradeCoreId;
  label: string;
  description: string;
  nodes: UpgradeNode[];
}

/** Computed multipliers / flat bonuses derived from PlayerInventory.upgradeLevels. All multipliers start at 1. */
export interface UpgradeEffects {
  /** Multiplier applied to getFlightSpeed() result. */
  maxSpeedMultiplier: number;
  /** Multiplier applied to boost-energy regen rate per frame. */
  boostEnergyRegenMultiplier: number;
  /** Multiplier applied to weapon-energy regen rate per frame. */
  weaponEnergyRegenMultiplier: number;
  /** Multiplier applied to weapon damage stored in each fired projectile. */
  weaponDamageMultiplier: number;
  /** Multiplier applied to shield regen rate per frame. */
  shieldRechargeMultiplier: number;
  /** Multiplier applied to radar display range. */
  radarRangeMultiplier: number;
  /** Multiplier applied to LOCK_ACQUIRE_RATE per frame. */
  lockSpeedMultiplier: number;
  /** Multiplier applied to missile blast radius. */
  missileBlastRadiusMultiplier: number;
}

// ---------------------------------------------------------------------------
// Upgrade Trees
// ---------------------------------------------------------------------------

export const UPGRADE_TREES: UpgradeTree[] = [
  {
    coreId: 'flight',
    label: 'Flight Core',
    description: 'Improve thrust, maneuverability, and boost endurance.',
    nodes: [
      {
        id: 'flight-speed-1',
        coreId: 'flight',
        label: 'Afterburner I',
        description: '+10% max flight speed.',
        costParts: 15,
      },
      {
        id: 'flight-speed-2',
        coreId: 'flight',
        label: 'Afterburner II',
        description: '+20% max flight speed total.',
        costParts: 40,
        requires: 'flight-speed-1',
      },
      {
        id: 'flight-boost-1',
        coreId: 'flight',
        label: 'Boost Cell I',
        description: '+15% boost energy regen.',
        costParts: 20,
      },
    ],
  },
  {
    coreId: 'weapons',
    label: 'Weapons Core',
    description: 'Amplify ordnance output and weapon energy recovery.',
    nodes: [
      {
        id: 'weapons-damage-1',
        coreId: 'weapons',
        label: 'Charge Amp I',
        description: '+10% weapon damage.',
        costParts: 15,
      },
      {
        id: 'weapons-damage-2',
        coreId: 'weapons',
        label: 'Charge Amp II',
        description: '+20% weapon damage total.',
        costParts: 40,
        requires: 'weapons-damage-1',
      },
      {
        id: 'weapons-regen-1',
        coreId: 'weapons',
        label: 'Energy Conduit I',
        description: '+15% weapon energy regen.',
        costParts: 20,
      },
    ],
  },
  {
    coreId: 'defense',
    label: 'Defense Core',
    description: 'Reinforce hull integrity and shield recharge rate.',
    nodes: [
      {
        id: 'defense-shield-1',
        coreId: 'defense',
        label: 'Shield Dynamo I',
        description: '+20% shield recharge rate.',
        costParts: 20,
      },
      {
        id: 'defense-shield-2',
        coreId: 'defense',
        label: 'Shield Dynamo II',
        description: '+40% shield recharge rate total.',
        costParts: 45,
        requires: 'defense-shield-1',
      },
    ],
  },
  {
    coreId: 'sensor',
    label: 'Sensor Core',
    description: 'Extend radar reach and accelerate target lock acquisition.',
    nodes: [
      {
        id: 'sensor-radar-1',
        coreId: 'sensor',
        label: 'Signal Amplifier I',
        description: '+20% radar range.',
        costParts: 15,
      },
      {
        id: 'sensor-lock-1',
        coreId: 'sensor',
        label: 'Lock Processor I',
        description: '+25% target lock speed.',
        costParts: 15,
      },
      {
        id: 'sensor-lock-2',
        coreId: 'sensor',
        label: 'Lock Processor II',
        description: '+50% target lock speed total.',
        costParts: 35,
        requires: 'sensor-lock-1',
      },
    ],
  },
  {
    coreId: 'payload',
    label: 'Payload Core',
    description: 'Increase missile yield and warhead blast radius.',
    nodes: [
      {
        id: 'payload-blast-1',
        coreId: 'payload',
        label: 'Warhead Boost I',
        description: '+20% missile blast radius.',
        costParts: 20,
      },
      {
        id: 'payload-blast-2',
        coreId: 'payload',
        label: 'Warhead Boost II',
        description: '+40% missile blast radius total.',
        costParts: 45,
        requires: 'payload-blast-1',
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Node effect table — each entry is the delta added to UpgradeEffects when owned
// ---------------------------------------------------------------------------

const NODE_EFFECT_DELTAS: Record<string, Partial<UpgradeEffects>> = {
  'flight-speed-1':    { maxSpeedMultiplier: 0.10 },
  'flight-speed-2':    { maxSpeedMultiplier: 0.10 },   // stacks → +20% total
  'flight-boost-1':    { boostEnergyRegenMultiplier: 0.15 },
  'weapons-damage-1':  { weaponDamageMultiplier: 0.10 },
  'weapons-damage-2':  { weaponDamageMultiplier: 0.10 },
  'weapons-regen-1':   { weaponEnergyRegenMultiplier: 0.15 },
  'defense-shield-1':  { shieldRechargeMultiplier: 0.20 },
  'defense-shield-2':  { shieldRechargeMultiplier: 0.20 },
  'sensor-radar-1':    { radarRangeMultiplier: 0.20 },
  'sensor-lock-1':     { lockSpeedMultiplier: 0.25 },
  'sensor-lock-2':     { lockSpeedMultiplier: 0.25 },
  'payload-blast-1':   { missileBlastRadiusMultiplier: 0.20 },
  'payload-blast-2':   { missileBlastRadiusMultiplier: 0.20 },
};

export const DEFAULT_UPGRADE_EFFECTS: Readonly<UpgradeEffects> = {
  maxSpeedMultiplier: 1,
  boostEnergyRegenMultiplier: 1,
  weaponEnergyRegenMultiplier: 1,
  weaponDamageMultiplier: 1,
  shieldRechargeMultiplier: 1,
  radarRangeMultiplier: 1,
  lockSpeedMultiplier: 1,
  missileBlastRadiusMultiplier: 1,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Compute cumulative UpgradeEffects from the player's current upgradeLevels record. */
export function resolveUpgradeEffects(upgradeLevels: Record<string, number>): UpgradeEffects {
  const out: UpgradeEffects = { ...DEFAULT_UPGRADE_EFFECTS };
  for (const [nodeId, level] of Object.entries(upgradeLevels)) {
    if (level > 0) {
      const deltas = NODE_EFFECT_DELTAS[nodeId];
      if (deltas) {
        for (const [key, delta] of Object.entries(deltas) as Array<[keyof UpgradeEffects, number]>) {
          out[key] += delta;
        }
      }
    }
  }
  return out;
}

/** Flat list of all nodes across all trees, in tree order. */
export function allUpgradeNodes(): UpgradeNode[] {
  return UPGRADE_TREES.flatMap(tree => tree.nodes);
}

/** Return true if the player can purchase this upgrade node right now. */
export function canPurchaseUpgrade(nodeId: string, inventory: PlayerInventory): boolean {
  const node = allUpgradeNodes().find(n => n.id === nodeId);
  if (!node) return false;
  if ((inventory.upgradeLevels[nodeId] ?? 0) >= 1) return false;               // already owned
  if (node.requires && !(inventory.upgradeLevels[node.requires] ?? 0)) return false; // prereq not met
  return inventory.parts >= node.costParts;
}

/** Return a new PlayerInventory with the upgrade purchased (parts deducted, level set to 1). */
export function applyUpgradePurchase(inventory: PlayerInventory, nodeId: string): PlayerInventory {
  const node = allUpgradeNodes().find(n => n.id === nodeId);
  if (!node || !canPurchaseUpgrade(nodeId, inventory)) return inventory;
  return {
    ...inventory,
    parts: inventory.parts - node.costParts,
    upgradeLevels: { ...inventory.upgradeLevels, [nodeId]: 1 },
  };
}
