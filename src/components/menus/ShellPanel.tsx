import type { ReactNode } from 'react';

export interface ShellPanelProps {
  eyebrow: string;
  title: string;
  children: ReactNode;
  side?: ReactNode;
}

export function ShellPanel({ eyebrow, title, children, side }: ShellPanelProps) {
  return (
    <div className="absolute inset-0 z-[80] bg-[#050505] text-white overflow-y-auto overflow-x-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black/70 pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-px bg-orange-500/50" />
      <div className="relative z-10 min-h-dvh px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-6 md:px-12 md:py-10 flex flex-col">
        <header className="flex items-start justify-between gap-4 border-b border-white/10 pb-4 md:gap-6 md:pb-5">
          <div className="min-w-0">
            <div className="text-[9px] uppercase tracking-[0.24em] text-orange-500 font-bold sm:text-[10px] sm:tracking-[0.35em]">{eyebrow}</div>
            <h1 className="mt-1 max-w-full text-2xl font-black italic tracking-normal font-serif leading-none sm:text-3xl md:text-5xl break-words">{title}</h1>
          </div>
          <div className="hidden md:flex flex-col items-end text-[10px] font-mono uppercase tracking-[0.22em] text-white/45">
            <span>SKYBREAKER</span>
            <span className="text-emerald-400">LINK STABLE</span>
          </div>
        </header>

        <main className="grid flex-1 gap-5 py-5 md:gap-8 md:py-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-center">
          <section className="w-full max-w-3xl min-w-0">{children}</section>
          {side && <aside className="w-full min-w-0 max-w-none lg:justify-self-end lg:max-w-sm">{side}</aside>}
        </main>
      </div>
    </div>
  );
}
