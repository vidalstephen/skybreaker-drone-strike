import { useState } from 'react';
import { ArrowLeft, CheckCircle, Crosshair, Lock, PlaneTakeoff, ScrollText } from 'lucide-react';
import { WEAPONS, getUnlockedWeapons, getWeaponRecommendation } from '../../config/weapons';
import { DEFAULT_PLAYER_INVENTORY } from '../../config/defaults';
import type { CampaignProgress, MissionDefinition, WeaponDefinition, WeaponId, WeaponSlot } from '../../types/game';
import { Carousel } from './Carousel';
import { MenuButton } from './MenuButton';
import { ShellPanel } from './ShellPanel';
import { Tabs, type TabItem } from './Tabs';

export interface LoadoutScreenProps {
  mission: MissionDefinition;
  progress: CampaignProgress;
  onLaunch: () => void;
  onBack: () => void;
  /** Stage 7b: called when the player equips a weapon to a slot. */
  onEquipWeapon: (slot: WeaponSlot, weaponId: WeaponId) => void;
}

type LoadoutTab = 'ordnance' | 'sortie';

const TABS: TabItem[] = [
  { id: 'ordnance', label: 'Ordnance', icon: <Crosshair size={11} /> },
  { id: 'sortie', label: 'Sortie', icon: <ScrollText size={11} /> },
];

function WeaponCard({
  weapon,
  unlocked,
  equipped,
  recommended,
  onClick,
}: {
  weapon: WeaponDefinition;
  unlocked: boolean;
  equipped: boolean;
  recommended: boolean;
  onClick?: () => void;
}) {
  const interactive = unlocked && !!onClick;
  return (
    <button
      type="button"
      disabled={!interactive}
      onClick={interactive ? onClick : undefined}
      className={[
        'h-full w-full border p-3 text-left font-mono transition-colors sm:p-4',
        equipped
          ? 'border-emerald-400/60 bg-emerald-900/20 ring-1 ring-emerald-400/25'
          : unlocked
            ? 'cursor-pointer border-white/10 bg-black/45 hover:border-white/25 hover:bg-black/60'
            : 'cursor-default border-white/10 bg-black/20 opacity-70',
      ].join(' ')}
      aria-pressed={equipped}
    >
      <div className="flex items-start justify-between gap-3 uppercase tracking-[0.16em]">
        <div className="min-w-0">
          <div className="text-[10px] text-orange-400">{weapon.slot}</div>
          <div className="mt-1 text-sm text-white sm:text-base">{weapon.label}</div>
        </div>
        <div
          className={`flex shrink-0 items-center gap-1.5 text-[10px] ${
            equipped ? 'text-emerald-400' : unlocked ? 'text-emerald-400' : 'text-white/35'
          }`}
        >
          {!unlocked && <Lock size={12} />}
          {equipped ? (
            <>
              <CheckCircle size={12} />
              EQUIPPED
            </>
          ) : unlocked ? (
            'ONLINE'
          ) : (
            'LOCKED'
          )}
        </div>
      </div>

      {recommended && (
        <div className="mt-1.5 text-[9px] uppercase tracking-[0.16em] text-sky-400">
          ▲ Recommended for this mission
        </div>
      )}

      <p className="mt-2 text-[11px] leading-relaxed text-white/55 sm:mt-3 sm:text-xs">{weapon.role}</p>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] uppercase tracking-[0.12em] text-white/45 sm:grid-cols-4">
        <div>
          <span className="block text-white/30">Trigger</span>
          <span className="text-white">{weapon.trigger}</span>
        </div>
        <div>
          <span className="block text-white/30">Energy</span>
          <span className="text-white">{weapon.energyCost}</span>
        </div>
        <div>
          <span className="block text-white/30">Damage</span>
          <span className="text-white">{weapon.damage}</span>
        </div>
        <div>
          <span className="block text-white/30">Cooldown</span>
          <span className="text-white">{(weapon.cooldownMs / 1000).toFixed(1)}s</span>
        </div>
      </div>

      {!unlocked && weapon.unlockRewardId && (
        <div className="mt-3 text-[10px] uppercase tracking-[0.14em] text-white/35">
          Unlock reward: {weapon.unlockRewardId}
        </div>
      )}
    </button>
  );
}

function SortiePanel({
  mission,
  onLaunch,
  onBack,
}: {
  mission: MissionDefinition;
  onLaunch: () => void;
  onBack: () => void;
}) {
  return (
    <div className="border border-white/10 bg-black/45 p-4 font-mono backdrop-blur-md sm:p-5">
      <div className="text-[10px] uppercase tracking-[0.28em] text-white/45">Sortie Target</div>
      <div className="mt-2 text-lg uppercase tracking-[0.14em] text-white">{mission.title}</div>
      <div className="mt-1 text-xs uppercase tracking-[0.14em] text-orange-400">Threat {mission.difficulty}</div>
      <div className="mt-4 grid gap-2 text-[11px] uppercase tracking-[0.12em]">
        <div className="flex justify-between gap-4 border border-white/10 bg-white/[0.03] p-2.5">
          <span className="text-white/40">Targets</span>
          <span>{mission.targets.length}</span>
        </div>
        <div className="flex justify-between gap-4 border border-white/10 bg-white/[0.03] p-2.5">
          <span className="text-white/40">Extraction</span>
          <span>{mission.extraction.label}</span>
        </div>
        <div className="flex justify-between gap-4 border border-white/10 bg-white/[0.03] p-2.5">
          <span className="text-white/40">Environment</span>
          <span>{mission.environment.label}</span>
        </div>
      </div>
      <div className="mt-4 grid gap-2">
        <MenuButton variant="primary" icon={<PlaneTakeoff size={18} />} onClick={onLaunch}>
          Launch
        </MenuButton>
        <MenuButton icon={<ArrowLeft size={18} />} onClick={onBack}>
          Briefing
        </MenuButton>
      </div>
    </div>
  );
}

export function LoadoutScreen({ mission, progress, onLaunch, onBack, onEquipWeapon }: LoadoutScreenProps) {
  const [activeTab, setActiveTab] = useState<LoadoutTab>('ordnance');

  const unlockedWeaponIds = new Set(getUnlockedWeapons(progress).map(weapon => weapon.id));
  const equippedIds = progress.inventory?.equippedWeaponIds ?? DEFAULT_PLAYER_INVENTORY.equippedWeaponIds;

  return (
    <ShellPanel
      eyebrow="Aircraft Bay"
      title="LOADOUT SELECTION"
      side={<SortiePanel mission={mission} onLaunch={onLaunch} onBack={onBack} />}
    >
      <div className="flex h-full flex-col gap-3" data-menu="loadout">
        <Tabs
          tabs={TABS}
          activeId={activeTab}
          onChange={(id) => setActiveTab(id as LoadoutTab)}
          ariaLabel="Loadout sections"
        />

        <div className="min-h-0 flex-1">
          {activeTab === 'ordnance' && (
            <div role="tabpanel" aria-label="Ordnance" data-tab-panel="ordnance" className="grid max-w-3xl gap-3">
              <div className="border border-white/10 bg-black/30 p-3 font-mono uppercase tracking-[0.14em] text-white/55 sm:p-4">
                <div className="text-[10px] text-orange-400">Ordnance Authority</div>
                <div className="mt-1 text-xs text-white">Select active loadout — tap a weapon to equip</div>
              </div>
              <Carousel
                items={WEAPONS}
                getKey={weapon => weapon.id}
                ariaLabel="Weapon ordnance"
                itemMinWidth="min(20rem, 88%)"
                renderItem={(weapon) => {
                  const unlocked = unlockedWeaponIds.has(weapon.id);
                  const equipped = equippedIds[weapon.slot as WeaponSlot] === weapon.id;
                  const recommended = getWeaponRecommendation(weapon, mission);
                  return (
                    <WeaponCard
                      weapon={weapon}
                      unlocked={unlocked}
                      equipped={equipped}
                      recommended={recommended}
                      onClick={
                        unlocked && !equipped
                          ? () => onEquipWeapon(weapon.slot as WeaponSlot, weapon.id as WeaponId)
                          : undefined
                      }
                    />
                  );
                }}
              />
            </div>
          )}

          {activeTab === 'sortie' && (
            <div role="tabpanel" aria-label="Sortie" data-tab-panel="sortie" className="grid max-w-xl gap-3 md:hidden">
              <SortiePanel mission={mission} onLaunch={onLaunch} onBack={onBack} />
            </div>
          )}

          {/* Desktop: Sortie tab — sidebar already shows the panel; render a quiet placeholder. */}
          {activeTab === 'sortie' && (
            <div className="hidden md:block">
              <div className="border border-white/10 bg-black/25 p-4 font-mono text-xs uppercase tracking-[0.13em] text-white/55">
                Sortie summary pinned to the right panel.
              </div>
            </div>
          )}
        </div>
      </div>
    </ShellPanel>
  );
}
