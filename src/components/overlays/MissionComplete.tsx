import { motion } from 'motion/react';
import type { BonusCondition, MissionCompletionResult } from '../../types/game';

export interface MissionCompleteProps {
  startTime: number;
  enemiesDestroyed: number;
  health: number;
  targetsDestroyed: number;
  totalTargets: number;
  result: MissionCompletionResult | null;
  bonusConditions?: BonusCondition[];
  onReturnToHangar: () => void;
}

export function MissionComplete({ startTime, enemiesDestroyed, health, targetsDestroyed, totalTargets, result, bonusConditions, onReturnToHangar }: MissionCompleteProps) {
  const elapsedMs = result?.elapsedMs ?? Date.now() - startTime;
  const setPieceStats = result?.setPieceStats;
  const showSetPieceStats = !!setPieceStats && (
    setPieceStats.componentsDestroyed > 0 ||
    setPieceStats.phasesCompleted > 0 ||
    setPieceStats.movingTargetsEscaped > 0 ||
    setPieceStats.protectedAssetsLost > 0
  );
  const phaseSeconds = setPieceStats ? Math.round(setPieceStats.phaseTimeMs / 1000) : 0;

  return (
    <div className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center overflow-y-auto p-4 py-[calc(1rem+env(safe-area-inset-top))] backdrop-blur-xl sm:p-8">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-md w-full border border-orange-500/30 p-1 bg-black/40 my-auto"
      >
        <div className="border border-orange-500/50 p-4 flex flex-col items-center text-center sm:p-8">
          <div className="text-orange-500 text-[10px] tracking-[0.45em] mb-2 uppercase font-mono sm:text-xs sm:tracking-[1em]">Mission Status</div>
          <h1 className="text-3xl text-white font-black italic tracking-tighter mb-6 serif sm:text-4xl sm:mb-8">MISSION ACCOMPLISHED</h1>

          <div className="w-full h-px bg-white/10 mb-6 sm:mb-8" />

          <div className="grid grid-cols-2 gap-4 w-full mb-6 sm:gap-8 sm:mb-12">
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Time Elapsed</span>
              <span className="text-xl font-mono text-white sm:text-2xl">
                {Math.floor(elapsedMs / 60000)}:
                {Math.floor((elapsedMs % 60000) / 1000).toString().padStart(2, '0')}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Combat Rank</span>
              <span className="text-xl font-mono text-emerald-400 sm:text-2xl">{result?.rank ?? '--'}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Enemies Downed</span>
              <span className="text-xl font-mono text-red-400 sm:text-2xl">{enemiesDestroyed}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Hull Integrity</span>
              <span className="text-xl font-mono text-orange-400 sm:text-2xl">{health}%</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Targets Destroyed</span>
              <span className="text-xl font-mono text-white sm:text-2xl">{targetsDestroyed} / {totalTargets}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Score</span>
              <span className="text-xl font-mono text-white sm:text-2xl">{result?.score.toLocaleString() ?? '0'}</span>
            </div>
          </div>

          {result && (
            <div className="w-full grid gap-3 mb-6 text-left sm:mb-8">
              <div className="border border-white/10 bg-white/[0.03] p-3 sm:p-4">
                <div className="text-[10px] uppercase tracking-[0.25em] text-orange-400 font-mono mb-2">Reward Unlocked</div>
                <div className="text-sm uppercase tracking-[0.16em] text-white font-mono">{result.reward.label}</div>
                <div className="mt-2 text-xs leading-relaxed text-white/55">{result.reward.description}</div>
              </div>
              <div className="grid grid-cols-2 gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-white/55">
                <div className="border border-white/10 bg-white/[0.03] p-3"><span className="block text-white/35">Target Bonus</span><span className="mt-1 block text-white">{targetsDestroyed} x</span></div>
                <div className="border border-white/10 bg-white/[0.03] p-3"><span className="block text-white/35">Enemy Bonus</span><span className="mt-1 block text-white">{enemiesDestroyed} x</span></div>
              </div>
            </div>
          )}

          {showSetPieceStats && (
            <div className="w-full grid gap-2 mb-6 text-left sm:mb-8">
              <div className="text-[10px] uppercase tracking-[0.25em] text-white/40 font-mono">Objective Detail</div>
              <div className="grid grid-cols-2 gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-white/55">
                <div className="border border-white/10 bg-white/[0.03] p-3"><span className="block text-white/35">Components</span><span className="mt-1 block text-white">{setPieceStats.componentsDestroyed}</span></div>
                <div className="border border-white/10 bg-white/[0.03] p-3"><span className="block text-white/35">Optional Parts</span><span className="mt-1 block text-white">{setPieceStats.optionalComponentsDestroyed}</span></div>
                <div className="border border-white/10 bg-white/[0.03] p-3"><span className="block text-white/35">Phases Cleared</span><span className="mt-1 block text-white">{setPieceStats.phasesCompleted}</span></div>
                <div className="border border-white/10 bg-white/[0.03] p-3"><span className="block text-white/35">Phase Time</span><span className="mt-1 block text-white">{Math.floor(phaseSeconds / 60)}:{(phaseSeconds % 60).toString().padStart(2, '0')}</span></div>
                <div className="border border-white/10 bg-white/[0.03] p-3"><span className="block text-white/35">Escapes</span><span className="mt-1 block text-white">{setPieceStats.movingTargetsEscaped}</span></div>
                <div className="border border-white/10 bg-white/[0.03] p-3"><span className="block text-white/35">Assets Lost</span><span className="mt-1 block text-white">{setPieceStats.protectedAssetsLost}</span></div>
                {(result?.setPieceScore ?? 0) > 0 && (
                  <div className="col-span-2 border border-orange-400/20 bg-orange-500/[0.06] p-3"><span className="block text-orange-300/60">Set-Piece Bonus</span><span className="mt-1 block text-orange-200">+{result?.setPieceScore?.toLocaleString()}</span></div>
                )}
              </div>
            </div>
          )}

          {bonusConditions && bonusConditions.length > 0 && (
            <div className="w-full grid gap-2 mb-6 text-left sm:mb-8">
              <div className="text-[10px] uppercase tracking-[0.25em] text-white/40 font-mono">Bonus Conditions</div>
              {bonusConditions.map(cond => {
                const earned = result?.bonusConditionsEarned?.includes(cond.id) ?? false;
                return (
                  <div key={cond.id} className="border border-white/10 bg-white/[0.03] p-3 flex justify-between items-center gap-3 font-mono text-[10px] uppercase tracking-[0.12em]">
                    <span className={earned ? 'text-emerald-400' : 'text-white/35'}>{cond.label}</span>
                    <span className={earned ? 'text-emerald-400 font-bold' : 'text-white/20'}>{earned ? `+${cond.scoreBonus.toLocaleString()}` : '—'}</span>
                  </div>
                );
              })}
            </div>
          )}

          <button
            onClick={onReturnToHangar}
            className="w-full min-h-12 py-3 bg-orange-500 text-black font-black tracking-[0.16em] hover:bg-white transition-colors duration-300 uppercase italic sm:py-4 sm:tracking-[0.2em]"
          >
            Return to Hangar
          </button>
        </div>
      </motion.div>
    </div>
  );
}
