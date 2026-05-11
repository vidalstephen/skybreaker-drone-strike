import { motion } from 'motion/react';
import { Activity } from 'lucide-react';

export interface GameOverProps {
  targetsDestroyed: number;
  totalTargets: number;
  enemiesDestroyed: number;
  onRetryMission: () => void;
  onReturnToHangar: () => void;
}

export function GameOver({ targetsDestroyed, totalTargets, enemiesDestroyed, onRetryMission, onReturnToHangar }: GameOverProps) {
  return (
    <div className="absolute inset-0 bg-black/95 z-50 flex items-center justify-center overflow-y-auto p-4 py-[calc(1rem+env(safe-area-inset-top))] backdrop-blur-2xl sm:p-8">
      <motion.div
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-md w-full border border-red-500/30 p-1 bg-black/60 my-auto"
      >
        <div className="border border-red-500/50 p-4 flex flex-col items-center text-center sm:p-8">
          <div className="w-14 h-14 border-2 border-red-500 flex items-center justify-center mb-5 animate-pulse sm:w-16 sm:h-16 sm:mb-6">
            <Activity size={28} className="text-red-500" />
          </div>
          <div className="text-red-500 text-[10px] tracking-[0.45em] mb-2 uppercase font-mono sm:text-xs sm:tracking-[1em]">Mission Failed</div>
          <h1 className="text-3xl text-white font-black italic tracking-tighter mb-6 serif sm:text-4xl sm:mb-8">SIGNAL LOST</h1>

          <div className="w-full h-px bg-white/10 mb-6 sm:mb-8" />

          <div className="grid grid-cols-2 gap-4 w-full mb-8 sm:gap-8 sm:mb-12">
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Targets Destroyed</span>
              <span className="text-xl font-mono text-white sm:text-2xl">{targetsDestroyed} / {totalTargets}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Enemies Downed</span>
              <span className="text-xl font-mono text-red-500 sm:text-2xl">{enemiesDestroyed}</span>
            </div>
          </div>

          <div className="grid w-full gap-3">
            <button
              onClick={onRetryMission}
              className="w-full min-h-12 py-3 bg-red-600 text-white font-black tracking-[0.16em] hover:bg-white hover:text-black transition-colors duration-300 uppercase italic sm:py-4 sm:tracking-[0.2em]"
            >
              Retry Mission
            </button>
            <button
              onClick={onReturnToHangar}
              className="w-full min-h-12 py-3 border border-white/15 bg-black/45 text-white font-black tracking-[0.16em] hover:border-orange-500 hover:text-orange-300 transition-colors duration-300 uppercase italic sm:py-4 sm:tracking-[0.2em]"
            >
              Return to Hangar
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
