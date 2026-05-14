import { useEffect, useRef, useState } from 'react';
import { ChevronUp, Target as TargetIcon } from 'lucide-react';
import type { ObjectiveRuntimeState } from '../../types/game';

export interface ObjectivesProps {
  objective: string;
  enemiesDestroyed: number;
  message: string;
  activeWeaponLabel: string;
  secondaryWeaponLabel: string;
  secondaryReady: boolean;
  optionalObjectives?: ObjectiveRuntimeState[];
}

export function Objectives({ objective, enemiesDestroyed, message, activeWeaponLabel, secondaryWeaponLabel, secondaryReady, optionalObjectives }: ObjectivesProps) {
  const [expanded, setExpanded] = useState(false);
  const collapseTimer = useRef<number | null>(null);

  // Auto-collapse 4 s after expanding.
  useEffect(() => {
    if (!expanded) return;
    if (collapseTimer.current) window.clearTimeout(collapseTimer.current);
    collapseTimer.current = window.setTimeout(() => setExpanded(false), 4000);
    return () => {
      if (collapseTimer.current) window.clearTimeout(collapseTimer.current);
    };
  }, [expanded]);

  // Mission-start intro: expand on mount; expand whenever the objective text
  // changes so players never miss a state update.
  useEffect(() => {
    setExpanded(true);
  }, [objective]);

  return (
    <div
      className="objectives-panel flex flex-col items-end gap-2 w-[min(20rem,calc(100vw-1.5rem))] sm:gap-3 md:gap-4 md:w-80"
      data-hud-region="objectives"
      data-objectives-expanded={expanded ? 'true' : 'false'}
    >
      <button
        type="button"
        className="objectives-chip pointer-events-auto hidden w-full items-center gap-2 border border-orange-500/40 bg-black/70 px-2.5 py-1 text-left"
        onClick={() => setExpanded(value => !value)}
        aria-expanded={expanded}
        aria-label="Objective"
      >
        <TargetIcon size={11} className="text-orange-500 shrink-0" />
        <span className="flex-1 truncate text-[10px] font-mono uppercase tracking-[0.12em] text-white/90">{objective}</span>
        <span className="shrink-0 text-[9px] font-mono text-orange-400 font-bold">{enemiesDestroyed}</span>
        <ChevronUp size={11} className={`text-white/60 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      <div className="objectives-full p-2 w-full sm:p-3">
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
          {optionalObjectives && optionalObjectives.length > 0 && (
            <div className="pt-2 border-t border-white/10 space-y-1">
              <div className="text-[8px] text-white/30 uppercase tracking-widest">Optional</div>
              {optionalObjectives.map(obj => (
                <div key={obj.id} className={`flex items-center gap-1 text-[9px] font-mono leading-tight sm:text-[10px] ${obj.completed ? 'text-emerald-400/80' : 'text-white/45'}`}>
                  {obj.completed && <span className="shrink-0">✓</span>}
                  <span>{obj.label}</span>
                </div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 font-mono uppercase tracking-[0.08em] sm:tracking-[0.12em]">
            <div>
              <div className="text-[8px] text-white/35">Primary</div>
              <div className="mt-1 text-[9px] text-cyan-300 sm:text-[10px]">{activeWeaponLabel}</div>
            </div>
            <div className="text-right">
              <div className="text-[8px] text-white/35">Secondary</div>
              <div className={`mt-1 text-[9px] sm:text-[10px] ${secondaryReady ? 'text-orange-400' : 'text-white/35'}`}>{secondaryWeaponLabel}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="objectives-message min-h-9 w-full flex items-center justify-end px-3 py-2 overflow-hidden bg-gradient-to-l from-orange-500/10 to-transparent border-r-2 border-orange-500/50 sm:min-h-12 sm:px-4" aria-live="polite">
        <span className="text-[9px] font-mono text-orange-500/80 animate-pulse tracking-[0.12em] text-right break-words sm:text-[10px] sm:tracking-widest">{message}</span>
      </div>
    </div>
  );
}
