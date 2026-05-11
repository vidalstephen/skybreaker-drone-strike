import { ArrowLeft, Lock, PlaneTakeoff } from 'lucide-react';
import { WEAPONS, getUnlockedWeapons } from '../../config/weapons';
import type { CampaignProgress, MissionDefinition, WeaponDefinition } from '../../types/game';
import { MenuButton } from './MenuButton';
import { ShellPanel } from './ShellPanel';

export interface LoadoutScreenProps {
  mission: MissionDefinition;
  progress: CampaignProgress;
  onLaunch: () => void;
  onBack: () => void;
}

function WeaponCard({ weapon, unlocked }: { weapon: WeaponDefinition; unlocked: boolean }) {
  return (
    <div className={`border p-4 font-mono ${unlocked ? 'border-white/10 bg-black/45' : 'border-white/10 bg-black/20 opacity-70'}`}>
      <div className="flex items-start justify-between gap-4 uppercase tracking-[0.16em]">
        <div>
          <div className="text-[10px] text-orange-400">{weapon.slot}</div>
          <div className="mt-2 text-base text-white">{weapon.label}</div>
        </div>
        <div className={`flex items-center gap-2 text-[10px] ${unlocked ? 'text-emerald-400' : 'text-white/35'}`}>
          {!unlocked && <Lock size={13} />}
          {unlocked ? 'ONLINE' : 'LOCKED'}
        </div>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-white/55">{weapon.role}</p>
      <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] uppercase tracking-[0.12em] text-white/45 sm:grid-cols-4">
        <div><span className="block text-white/30">Trigger</span><span className="text-white">{weapon.trigger}</span></div>
        <div><span className="block text-white/30">Energy</span><span className="text-white">{weapon.energyCost}</span></div>
        <div><span className="block text-white/30">Damage</span><span className="text-white">{weapon.damage}</span></div>
        <div><span className="block text-white/30">Cooldown</span><span className="text-white">{(weapon.cooldownMs / 1000).toFixed(1)}s</span></div>
      </div>
      {weapon.lockRequired && <div className="mt-4 border border-cyan-300/20 bg-cyan-300/10 p-3 text-[10px] uppercase tracking-[0.14em] text-cyan-100">Requires airborne target lock</div>}
      {!unlocked && weapon.unlockRewardId && <div className="mt-4 text-[10px] uppercase tracking-[0.14em] text-white/35">Unlock reward: {weapon.unlockRewardId}</div>}
    </div>
  );
}

export function LoadoutScreen({ mission, progress, onLaunch, onBack }: LoadoutScreenProps) {
  const unlockedWeaponIds = new Set(getUnlockedWeapons(progress).map(weapon => weapon.id));

  return (
    <ShellPanel
      eyebrow="Aircraft Bay"
      title="LOADOUT REVIEW"
      side={
        <div className="border border-white/10 bg-black/45 p-4 font-mono backdrop-blur-md sm:p-5">
          <div className="text-[10px] uppercase tracking-[0.28em] text-white/45">Sortie Target</div>
          <div className="mt-3 text-lg uppercase tracking-[0.14em] text-white">{mission.title}</div>
          <div className="mt-2 text-xs uppercase tracking-[0.14em] text-orange-400">Threat {mission.difficulty}</div>
          <div className="mt-5 grid gap-2 text-[11px] uppercase tracking-[0.12em]">
            <div className="flex justify-between gap-4 border border-white/10 bg-white/[0.03] p-3"><span className="text-white/40">Targets</span><span>{mission.targets.length}</span></div>
            <div className="flex justify-between gap-4 border border-white/10 bg-white/[0.03] p-3"><span className="text-white/40">Extraction</span><span>{mission.extraction.label}</span></div>
            <div className="flex justify-between gap-4 border border-white/10 bg-white/[0.03] p-3"><span className="text-white/40">Environment</span><span>{mission.environment.label}</span></div>
          </div>
          <div className="mt-5 grid gap-3">
            <MenuButton variant="primary" icon={<PlaneTakeoff size={18} />} onClick={onLaunch}>Launch</MenuButton>
            <MenuButton icon={<ArrowLeft size={18} />} onClick={onBack}>Briefing</MenuButton>
          </div>
        </div>
      }
    >
      <div className="grid gap-4 max-w-2xl">
        <div className="border border-white/10 bg-black/30 p-4 font-mono uppercase tracking-[0.14em] text-white/55 sm:p-5">
          <div className="text-[10px] text-orange-400">Ordnance Authority</div>
          <div className="mt-2 text-xs text-white">Campaign Clearance Synced</div>
        </div>
        {WEAPONS.map(weapon => <div key={weapon.id}><WeaponCard weapon={weapon} unlocked={unlockedWeaponIds.has(weapon.id)} /></div>)}
      </div>
    </ShellPanel>
  );
}
