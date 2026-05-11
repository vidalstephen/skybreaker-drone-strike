import { Gamepad2, House, Play, RotateCcw, Settings } from 'lucide-react';
import type { MissionDefinition } from '../../types/game';
import { MenuButton } from './MenuButton';

export interface PauseMenuProps {
  mission: MissionDefinition;
  onResume: () => void;
  onRetry: () => void;
  onOpenSettings: () => void;
  onOpenControls: () => void;
  onReturnToMenu: () => void;
}

export function PauseMenu({ mission, onResume, onRetry, onOpenSettings, onOpenControls, onReturnToMenu }: PauseMenuProps) {
  return (
    <div className="absolute inset-0 z-[75] bg-black/78 backdrop-blur-md flex items-center justify-center p-6">
      <div className="w-full max-w-md border border-white/10 bg-black/70 p-5">
        <div className="text-[10px] uppercase tracking-[0.35em] text-orange-500 font-bold mb-2">Paused</div>
        <h2 className="text-3xl font-black italic font-serif mb-6">MISSION HOLD</h2>
        <div className="mb-5 grid grid-cols-2 gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/55">
          <div className="border border-white/10 bg-white/[0.03] p-3"><div className="text-white/35">Sortie</div><div className="mt-1 text-white">{mission.title}</div></div>
          <div className="border border-white/10 bg-white/[0.03] p-3"><div className="text-white/35">Targets</div><div className="mt-1 text-white">{mission.targets.length}</div></div>
        </div>
        <div className="grid gap-3">
          <MenuButton variant="primary" icon={<Play size={18} />} onClick={onResume}>Resume</MenuButton>
          <MenuButton icon={<RotateCcw size={18} />} onClick={onRetry}>Retry</MenuButton>
          <MenuButton icon={<Settings size={18} />} onClick={onOpenSettings}>Settings</MenuButton>
          <MenuButton icon={<Gamepad2 size={18} />} onClick={onOpenControls}>Controls</MenuButton>
          <MenuButton icon={<House size={18} />} onClick={onReturnToMenu}>Return To Menu</MenuButton>
        </div>
      </div>
    </div>
  );
}
