import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { Activity, Flame, Shield, Zap } from 'lucide-react';

export interface VitalsProps {
  shields: number;
  energy: number;
  boostEnergy: number;
  health: number;
}

interface BarProps {
  label: string;
  value: number;
  icon: ReactNode;
  iconColor: string;
  barColor: string;
  textColor: string;
}

function VitalBar({ label, value, icon, iconColor, barColor, textColor }: BarProps) {
  return (
    <div className="vitals-row flex items-center gap-2 w-28 sm:w-48 md:w-56 sm:gap-3" aria-label={label}>
      <span className={`shrink-0 ${iconColor}`}>{icon}</span>
      <div className="flex-1 h-1.5 bg-white/10 overflow-hidden rounded-full">
        <motion.div initial={false} animate={{ width: `${value}%` }} className={`h-full ${barColor}`} />
      </div>
      <span className={`text-[10px] font-mono w-7 text-right font-bold ${textColor}`}>{Math.round(value)}</span>
    </div>
  );
}

export function Vitals({ shields, energy, boostEnergy, health }: VitalsProps) {
  return (
    <div
      className="vitals-panel grid grid-cols-1 gap-1.5 p-2 sm:gap-2 sm:p-3"
      data-hud-region="vitals"
    >
      <VitalBar label="Shields" value={shields} icon={<Shield size={13} />} iconColor="text-cyan-500" barColor="bg-cyan-400" textColor="text-cyan-500" />
      <VitalBar label="Boost" value={boostEnergy} icon={<Flame size={13} />} iconColor="text-amber-400" barColor="bg-amber-400" textColor="text-amber-400" />
      <VitalBar label="Energy" value={energy} icon={<Zap size={13} />} iconColor="text-orange-500" barColor="bg-orange-400" textColor="text-orange-500" />
      <VitalBar label="Health" value={health} icon={<Activity size={13} />} iconColor="text-red-500" barColor="bg-red-500" textColor="text-red-500" />
    </div>
  );
}
