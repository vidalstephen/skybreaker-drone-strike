import { useState } from 'react';
import { ArrowLeft, Crosshair, Lock, PlaneTakeoff, ScrollText } from 'lucide-react';
import { WEAPONS, getUnlockedWeapons } from '../../config/weapons';
import type { CampaignProgress, MissionDefinition, WeaponDefinition } from '../../types/game';
import { Carousel } from './Carousel';
import { MenuButton } from './MenuButton';
import { ShellPanel } from './ShellPanel';
import { Tabs, type TabItem } from './Tabs';

export interface LoadoutScreenProps {
  mission: MissionDefinition;
  progress: CampaignProgress;
  onLaunch: () => void;
  onBack: () => void;
}

type LoadoutTab = 'ordnance' | 'sortie';

const TABS: TabItem[] = [
  { id: 'ordnance', label: 'Ordnance', icon: <Crosshair size={11} /> },
  { id: 'sortie', label: 'Sortie', icon: <ScrollText size={11} /> },
];

function WeaponCard({ weapon, unlocked }: { weapon: WeaponDefinition; unlocked: boolean }) {
  return (
    <div className={`h-full border p-3 font-mono sm:p-4 ${unlocked ? 'border-white/10 bg-black/45' : 'border-white/10 bg-black/20 opacity-70'}`}>
      <div className="flex items-start justify-between gap-3 uppercase tracking-[0.16em]">
        <div className="min-w-0">
          <div className="text-[10px] text-orange-400">{weapon.slot}</div>
          <div className="mt-1 text-sm text-white sm:text-base">{weapon.label}</div>
        </div>
        <div className={`flex items-center gap-1.5 text-[10px] ${unlocked ? 'text-emerald-400' : 'text-white/35'}`}>
          {!unlocked && <Lock size={12} />}
          {unlocked ? 'ONLINE' : 'LOCKED'}
        </div>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-white/55 sm:mt-3 sm:text-xs">{weapon.role}</p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] uppercase tracking-[0.12em] text-white/45 sm:grid-cols-4">
        <div><span className="block text-white/30">Trigger</span><span className="text-white">{weapon.trigger}</span></div>
        <div><span className="block text-white/30">Energy</span><span className="text-white">{weapon.energyCost}</span></div>
        <div><span className="block text-white/30">Damage</span><span className="text-white">{weapon.damage}</span></div>
        <div><span className="block text-white/30">Cooldown</span><span className="text-white">{(weapon.cooldownMs / 1000).toFixed(1)}s</span></div>
      </div>
      {!unlocked && weapon.unlockRewardId && <div className="mt-3 text-[10px] uppercase tracking-[0.14em] text-white/35">Unlock reward: {weapon.unlockRewardId}</div>}
    </div>
  );
}

function SortiePanel({ mission, onLaunch, onBack }: { mission: MissionDefinition; onLaunch: () => void; onBack: () => void; }) {
  return (
    <div className="border border-white/10 bg-black/45 p-4 font-mono backdrop-blur-md sm:p-5">
      <div className="text-[10px] uppercase tracking-[0.28em] text-white/45">Sortie Target</div>
      <div className="mt-2 text-lg uppercase tracking-[0.14em] text-white">{mission.title}</div>
      <div className="mt-1 text-xs uppercase tracking-[0.14em] text-orange-400">Threat {mission.difficulty}</div>
      <div className="mt-4 grid gap-2 text-[11px] uppercase tracking-[0.12em]">
        <div className="flex justify-between gap-4 border border-white/10 bg-white/[0.03] p-2.5"><span className="text-white/40">Targets</span><span>{mission.targets.length}</span></div>
        <div className="flex justify-between gap-4 border border-white/10 bg-white/[0.03] p-2.5"><span className="text-white/40">Extraction</span><span>{mission.extraction.label}</span></div>
        <div className="flex justify-between gap-4 border border-white/10 bg-white/[0.03] p-2.5"><span className="text-white/40">Environment</span><span>{mission.environment.label}</span></div>
      </div>
      <div className="mt-4 grid gap-2">
        <MenuButton variant="primary" icon={<PlaneTakeoff size={18} />} onClick={onLaunch}>Launch</MenuButton>
        <MenuButton icon={<ArrowLeft size={18} />} onClick={onBack}>Briefing</MenuButton>
      </div>
    </div>
  );
}

export function LoadoutScreen({ mission, progress, onLaunch, onBack }: LoadoutScreenProps) {
  const [activeTab, setActiveTab] = useState<LoadoutTab>('ordnance');
  const unlockedWeaponIds = new Set(getUnlockedWeapons(progress).map(weapon => weapon.id));

  return (
    <ShellPanel
      eyebrow="Aircraft Bay"
      title="LOADOUT REVIEW"
      side={<SortiePanel mission={mission} onLaunch={onLaunch} onBack={onBack} />}
    >
      <div className="flex h-full flex-col gap-3" data-menu="loadout">
        <Tabs tabs={TABS} activeId={activeTab} onChange={(id) => setActiveTab(id as LoadoutTab)} ariaLabel="Loadout sections" />

        <div className="min-h-0 flex-1">
          {activeTab === 'ordnance' && (
            <div role="tabpanel" aria-label="Ordnance" data-tab-panel="ordnance" className="grid gap-3 max-w-3xl">
              <div className="border border-white/10 bg-black/30 p-3 font-mono uppercase tracking-[0.14em] text-white/55 sm:p-4">
                <div className="text-[10px] text-orange-400">Ordnance Authority</div>
                <div className="mt-1 text-xs text-white">Campaign Clearance Synced</div>
              </div>
              <Carousel
                items={WEAPONS}
                getKey={weapon => weapon.id}
                ariaLabel="Weapon ordnance"
                itemMinWidth="min(20rem, 88%)"
                renderItem={(weapon) => (
                  <WeaponCard weapon={weapon} unlocked={unlockedWeaponIds.has(weapon.id)} />
                )}
              />
            </div>
          )}

          {activeTab === 'sortie' && (
            <div role="tabpanel" aria-label="Sortie" data-tab-panel="sortie" className="grid gap-3 max-w-xl md:hidden">
              <SortiePanel mission={mission} onLaunch={onLaunch} onBack={onBack} />
            </div>
          )}

          {/* Desktop: when Sortie tab is active, the sidebar already shows it; render a quiet placeholder. */}
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
