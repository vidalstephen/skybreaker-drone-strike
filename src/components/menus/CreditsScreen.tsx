import { ArrowLeft, Cpu, RadioTower } from 'lucide-react';
import { MenuButton } from './MenuButton';
import { ShellPanel } from './ShellPanel';

export interface CreditsScreenProps {
  onBack: () => void;
}

export function CreditsScreen({ onBack }: CreditsScreenProps) {
  return (
    <ShellPanel
      eyebrow="Signal Archive"
      title="CREDITS"
      side={
        <div className="border border-white/10 bg-black/45 p-4 backdrop-blur-md sm:p-5">
          <div className="flex items-center gap-3 text-orange-400"><RadioTower size={20} /><span className="font-mono text-[10px] uppercase tracking-[0.28em]">Skybreaker</span></div>
          <div className="mt-5 grid gap-2 font-mono text-[11px] uppercase tracking-[0.13em] text-white/55">
            <div className="border border-white/10 bg-white/[0.03] p-3">Arcade Drone Combat</div>
            <div className="border border-white/10 bg-white/[0.03] p-3">Procedural Three.js Theatre</div>
            <div className="border border-white/10 bg-white/[0.03] p-3">React Tactical Shell</div>
          </div>
          <div className="mt-5"><MenuButton icon={<ArrowLeft size={18} />} onClick={onBack}>Hangar</MenuButton></div>
        </div>
      }
    >
      <div className="grid gap-5 max-w-2xl">
        <div className="border border-orange-500/25 bg-orange-500/10 p-5 sm:p-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-orange-300">Project</div>
          <h2 className="mt-3 text-3xl font-black italic font-serif leading-none sm:text-4xl">SKYBREAKER DRONE STRIKE</h2>
          <p className="mt-5 text-sm leading-relaxed text-white/60">A compact tactical arcade campaign built around fast drone flight, projected weapon paths, readable target markers, and responsive mobile controls.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="border border-white/10 bg-black/35 p-4">
            <div className="mb-3 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.24em] text-orange-400"><Cpu size={16} /> Systems</div>
            <div className="space-y-2 text-xs leading-relaxed text-white/55">
              <div>React 19</div>
              <div>Vite 6</div>
              <div>Three.js</div>
              <div>Motion</div>
            </div>
          </div>
          <div className="border border-white/10 bg-black/35 p-4">
            <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-orange-400">Production Notes</div>
            <div className="space-y-2 text-xs leading-relaxed text-white/55">
              <div>Procedural Web Audio</div>
              <div>Data-driven campaign missions</div>
              <div>Responsive tactical HUD</div>
              <div>Docker-deployed static build</div>
            </div>
          </div>
        </div>
      </div>
    </ShellPanel>
  );
}
