import { useCallback, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { PHASE_TAG } from '../../config/buildMeta';

export interface SplashScreenProps {
  motionEnabled: boolean;
  onComplete: () => void;
}

export function SplashScreen({ motionEnabled, onComplete }: SplashScreenProps) {
  const completedRef = useRef(false);

  const complete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    const handleInput = () => complete();

    window.addEventListener('keydown', handleInput);
    window.addEventListener('pointerdown', handleInput);

    return () => {
      window.removeEventListener('keydown', handleInput);
      window.removeEventListener('pointerdown', handleInput);
    };
  }, [complete]);

  const motionProps = motionEnabled
    ? {
        initial: { opacity: 0, scale: 0.96 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration: 0.65 },
      }
    : {};

  return (
    <div className="absolute inset-0 z-[100] bg-[#030303] text-white overflow-hidden flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(249,115,22,0.16),transparent_34%),linear-gradient(180deg,rgba(0,0,0,0.05),rgba(0,0,0,0.9))]" />
      <div className="absolute inset-x-0 top-0 h-px bg-orange-500/70" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-cyan-300/30" />
      <div className="absolute bottom-3 right-4 z-20 text-[9px] font-mono uppercase tracking-[0.2em] text-white/25" aria-hidden="true">{PHASE_TAG}</div>
      <div className="absolute inset-0 opacity-[0.07] bg-[linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px)] bg-[length:100%_4px]" />

      <motion.div {...motionProps} className="relative z-10 w-full max-w-3xl text-center">
        <div className="mx-auto mb-8 h-20 w-20 border border-orange-500/45 bg-orange-500/10 p-2 shadow-[0_0_50px_rgba(249,115,22,0.2)] sm:h-24 sm:w-24">
          <div className="h-full w-full border border-white/20 flex items-center justify-center">
            <div className="h-8 w-8 rotate-45 border-l-2 border-t-2 border-orange-400 sm:h-10 sm:w-10" />
          </div>
        </div>
        <div className="text-[10px] font-mono uppercase tracking-[0.42em] text-orange-400 sm:text-xs sm:tracking-[0.6em]">Command Link Established</div>
        <h1 className="mt-4 text-4xl font-black italic leading-none tracking-normal font-serif sm:text-6xl md:text-7xl">SKYBREAKER</h1>
        <div className="mt-2 text-lg font-black uppercase tracking-[0.28em] text-white/70 sm:text-2xl">Drone Strike</div>
        <div className="mx-auto mt-8 h-px max-w-xl bg-gradient-to-r from-transparent via-orange-500/70 to-transparent" />
        <div className="mt-6 grid gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-white/45 sm:grid-cols-3">
          <span>Flight Core Online</span>
          <span className="text-emerald-400/80">Weapons Safe</span>
          <span>Tactical Feed Ready</span>
        </div>
        <button className="pointer-events-auto mt-10 text-[10px] font-bold uppercase tracking-[0.28em] text-white/35 transition-colors hover:text-orange-300" onClick={complete} type="button">
          Press Any Key
        </button>
      </motion.div>
    </div>
  );
}
