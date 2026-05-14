import type { ReactNode } from 'react';

export interface ShellPanelProps {
  eyebrow: string;
  title: string;
  children: ReactNode;
  side?: ReactNode;
  /** When true, the sidebar is rendered on md+ screens. Defaults to true. */
  showSideOnDesktop?: boolean;
  /** Reduce vertical padding to maximize content area (mobile landscape). */
  dense?: boolean;
}

export function ShellPanel({ eyebrow, title, children, side, showSideOnDesktop = true, dense = false }: ShellPanelProps) {
  // The outer container is clamped to the dynamic viewport so the page
  // itself never forces a scrollbar; inner content scrolls only if needed.
  const verticalPad = dense
    ? 'py-2 sm:py-3 md:py-4'
    : 'py-3 sm:py-4 md:py-6';
  const showSide = side && showSideOnDesktop;

  return (
    <div className="absolute inset-0 z-[80] bg-[#050505] text-white overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black/70 pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-px bg-orange-500/50" />
      <div
        className={`relative z-10 flex h-[100dvh] flex-col px-4 ${verticalPad} pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-[calc(0.5rem+env(safe-area-inset-top))] sm:px-6 md:px-10`}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 pb-2 md:gap-6 md:pb-3">
          <div className="min-w-0">
            <div className="text-[9px] uppercase tracking-[0.24em] text-orange-500 font-bold sm:text-[10px] sm:tracking-[0.35em]">{eyebrow}</div>
            <h1 className="mt-0.5 max-w-full text-xl font-black italic tracking-normal font-serif leading-none sm:text-3xl md:text-4xl break-words">{title}</h1>
          </div>
          <div className="hidden md:flex flex-col items-end text-[10px] font-mono uppercase tracking-[0.22em] text-white/45">
            <span>SKYBREAKER</span>
            <span className="text-emerald-400">LINK STABLE</span>
          </div>
        </header>

        <main
          className={`grid min-h-0 flex-1 gap-3 py-3 md:gap-6 md:py-5 md:items-stretch ${showSide ? 'md:grid-cols-[minmax(0,1fr)_260px]' : ''}`}
        >
          <section className="min-h-0 w-full min-w-0 overflow-y-auto overflow-x-hidden [scrollbar-width:thin]">{children}</section>
          {showSide && (
            <aside className="hidden min-h-0 w-full min-w-0 overflow-y-auto md:block">{side}</aside>
          )}
        </main>
      </div>
    </div>
  );
}
