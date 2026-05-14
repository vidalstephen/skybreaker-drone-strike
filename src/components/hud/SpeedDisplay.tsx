export interface SpeedDisplayProps {
  speed: number;
  boosting: boolean;
}

export function SpeedDisplay({ speed, boosting }: SpeedDisplayProps) {
  return (
    <div className="flex flex-col gap-1 px-2 py-1 sm:p-0">
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-mono font-bold tracking-tighter text-white sm:text-4xl">{speed}</span>
        <span className="text-[10px] text-white/40 font-mono uppercase tracking-widest">KM/H</span>
      </div>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${boosting ? 'bg-orange-500 animate-pulse' : 'bg-white/20'}`} />
        <span className="text-[8px] font-mono text-white/40 uppercase tracking-[0.14em] sm:text-[9px] sm:tracking-[0.2em]">
          {boosting ? 'OVERDRIVE ACTIVE' : 'CRUISE VELOCITY'}
        </span>
      </div>
    </div>
  );
}
