import { Target as TargetIcon } from 'lucide-react';

export interface ObjectivesProps {
  objective: string;
  enemiesDestroyed: number;
  message: string;
  activeWeaponLabel: string;
  secondaryWeaponLabel: string;
  secondaryReady: boolean;
  secondaryLockLabel: string;
}

export function Objectives({ objective, enemiesDestroyed, message, activeWeaponLabel, secondaryWeaponLabel, secondaryReady, secondaryLockLabel }: ObjectivesProps) {
  return (
    <div className="flex flex-col items-end gap-2 w-[min(20rem,calc(100vw-1.5rem))] sm:gap-4 md:gap-6 md:w-80">
      <div className="bg-black/65 p-3 border border-white/5 backdrop-blur-md w-full sm:p-4">
        <div className="flex items-center gap-2 mb-2 border-b border-white/10 pb-2 sm:mb-3">
          <TargetIcon size={13} className="text-orange-500 sm:size-3.5" />
          <span className="text-[9px] font-bold text-orange-500 uppercase tracking-[0.18em] sm:text-[10px] sm:tracking-[0.3em]">Operational Objectives</span>
        </div>
        <div className="space-y-2">
          <div className="text-[11px] font-medium text-white/90 leading-tight sm:text-xs">{objective}</div>
          <div className="flex justify-between items-center text-[10px] font-mono">
            <span className="text-white/40 uppercase tracking-widest text-[8px]">Enemies Neutralized</span>
            <span className="text-orange-500 font-bold">{enemiesDestroyed}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 font-mono uppercase tracking-[0.08em] sm:tracking-[0.12em]">
            <div>
              <div className="text-[8px] text-white/35">Primary</div>
              <div className="mt-1 text-[9px] text-cyan-300 sm:text-[10px]">{activeWeaponLabel}</div>
            </div>
            <div className="text-right">
              <div className="text-[8px] text-white/35">Secondary</div>
              <div className={`mt-1 text-[9px] sm:text-[10px] ${secondaryReady ? 'text-orange-400' : 'text-white/35'}`}>{secondaryWeaponLabel}</div>
              <div className={`mt-1 text-[8px] ${secondaryLockLabel.startsWith('LOCKED') ? 'text-emerald-400' : 'text-white/35'}`}>{secondaryLockLabel}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-9 w-full flex items-center justify-end px-3 py-2 overflow-hidden bg-gradient-to-l from-orange-500/10 to-transparent border-r-2 border-orange-500/50 sm:min-h-12 sm:px-4" aria-live="polite">
        <span className="text-[9px] font-mono text-orange-500/80 animate-pulse tracking-[0.12em] text-right break-words sm:text-[10px] sm:tracking-widest">{message}</span>
      </div>
    </div>
  );
}
