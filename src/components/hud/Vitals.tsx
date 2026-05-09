import { motion } from 'motion/react';
import { Activity, Shield, Zap } from 'lucide-react';

export interface VitalsProps {
  shields: number;
  energy: number;
  health: number;
}

export function Vitals({ shields, energy, health }: VitalsProps) {
  return (
    <div className="flex flex-col gap-2 bg-black/55 p-2 border-l-2 border-white/10 backdrop-blur-sm sm:gap-4 sm:p-4">
      <div className="flex items-center gap-2 w-36 sm:w-56 sm:gap-4">
        <Shield size={13} className="text-cyan-500 shrink-0 sm:size-3.5" />
        <div className="flex-1 h-1.5 bg-white/10 overflow-hidden rounded-full">
          <motion.div initial={false} animate={{ width: `${shields}%` }} className="h-full bg-cyan-400" />
        </div>
        <span className="text-[10px] font-mono text-cyan-500 w-8 text-right font-bold">{Math.round(shields)}</span>
      </div>
      <div className="flex items-center gap-2 w-36 sm:w-56 sm:gap-4">
        <Zap size={13} className="text-orange-500 shrink-0 sm:size-3.5" />
        <div className="flex-1 h-1.5 bg-white/10 overflow-hidden rounded-full">
          <motion.div initial={false} animate={{ width: `${energy}%` }} className="h-full bg-orange-400" />
        </div>
        <span className="text-[10px] font-mono text-orange-500 w-8 text-right font-bold">{Math.round(energy)}</span>
      </div>
      <div className="flex items-center gap-2 w-36 sm:w-56 sm:gap-4">
        <Activity size={13} className="text-red-500 shrink-0 sm:size-3.5" />
        <div className="flex-1 h-1.5 bg-white/10 overflow-hidden rounded-full">
          <motion.div initial={false} animate={{ width: `${health}%` }} className="h-full bg-red-500" />
        </div>
        <span className="text-[10px] font-mono text-red-500 w-8 text-right font-bold">{Math.round(health)}</span>
      </div>
    </div>
  );
}
