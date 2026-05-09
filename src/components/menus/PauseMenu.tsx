import { House, Play, RotateCcw, Settings } from 'lucide-react';
import { MenuButton } from './MenuButton';

export interface PauseMenuProps {
  onResume: () => void;
  onRetry: () => void;
  onOpenSettings: () => void;
  onReturnToMenu: () => void;
}

export function PauseMenu({ onResume, onRetry, onOpenSettings, onReturnToMenu }: PauseMenuProps) {
  return (
    <div className="absolute inset-0 z-[75] bg-black/78 backdrop-blur-md flex items-center justify-center p-6">
      <div className="w-full max-w-sm border border-white/10 bg-black/70 p-5">
        <div className="text-[10px] uppercase tracking-[0.35em] text-orange-500 font-bold mb-2">Paused</div>
        <h2 className="text-3xl font-black italic font-serif mb-6">MISSION HOLD</h2>
        <div className="grid gap-3">
          <MenuButton variant="primary" icon={<Play size={18} />} onClick={onResume}>Resume</MenuButton>
          <MenuButton icon={<RotateCcw size={18} />} onClick={onRetry}>Retry</MenuButton>
          <MenuButton icon={<Settings size={18} />} onClick={onOpenSettings}>Settings</MenuButton>
          <MenuButton icon={<House size={18} />} onClick={onReturnToMenu}>Return To Menu</MenuButton>
        </div>
      </div>
    </div>
  );
}
