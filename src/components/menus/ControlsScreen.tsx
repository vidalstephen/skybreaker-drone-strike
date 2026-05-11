import { ArrowLeft, Gamepad2, Keyboard, MousePointer2, Smartphone } from 'lucide-react';
import type { ReactNode } from 'react';
import { MenuButton } from './MenuButton';
import { ShellPanel } from './ShellPanel';

export interface ControlsScreenProps {
  onBack: () => void;
}

const keyboardRows = [
  ['W / S', 'Pitch'],
  ['A / D', 'Bank-Turn'],
  ['Q / E', 'Yaw Correct'],
  ['R / F', 'Throttle'],
  ['Ctrl', 'Brake'],
  ['Shift', 'Boost'],
  ['Space', 'Primary Fire'],
  ['Alt', 'Missile'],
  ['Tab / T', 'Target Lock'],
  ['X', 'Auto-Level'],
  ['C', 'View'],
];

const pointerRows = [
  ['Left Mouse', 'Primary Fire'],
  ['Right Mouse', 'Missile'],
  ['Pointer Drag', 'Fine Control'],
];

const touchRows = [
  ['Joystick', 'Pitch / Bank-Turn'],
  ['FIRE', 'Primary Fire'],
  ['BOOST', 'Boost'],
  ['MSL', 'Missile'],
  ['BRK', 'Brake'],
  ['LOCK', 'Target Lock'],
  ['LEVEL', 'Auto-Level'],
  ['VIEW', 'Camera'],
];

function ControlGroup({ icon, title, rows }: { icon: ReactNode; title: string; rows: string[][] }) {
  return (
    <section className="border border-white/10 bg-black/35 p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.26em] text-orange-400">{icon}<span>{title}</span></div>
      <div className="grid gap-2">
        {rows.map(([input, action]) => (
          <div key={`${input}-${action}`} className="flex items-center justify-between gap-4 border border-white/10 bg-white/[0.03] p-3 font-mono uppercase tracking-[0.13em]">
            <span className="text-white/45 text-[10px]">{action}</span>
            <span className="text-right text-xs text-white">{input}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ControlsScreen({ onBack }: ControlsScreenProps) {
  return (
    <ShellPanel
      eyebrow="Input Matrix"
      title="CONTROLS"
      side={
        <div className="border border-white/10 bg-black/45 p-4 font-mono backdrop-blur-md sm:p-5">
          <div className="flex items-center gap-3 text-orange-400"><Gamepad2 size={20} /><span className="text-[10px] uppercase tracking-[0.28em]">Arcade Assist</span></div>
          <div className="mt-5 grid gap-2 text-[11px] uppercase tracking-[0.12em] text-white/60">
            <div className="border border-white/10 bg-white/[0.03] p-3">Assisted bank-turn on A / D</div>
            <div className="border border-white/10 bg-white/[0.03] p-3">Yaw correction on Q / E</div>
            <div className="border border-white/10 bg-white/[0.03] p-3">Auto-level on X / LEVEL</div>
          </div>
          <div className="mt-5"><MenuButton icon={<ArrowLeft size={18} />} onClick={onBack}>Back</MenuButton></div>
        </div>
      }
    >
      <div className="grid gap-4 max-w-3xl lg:grid-cols-2">
        <ControlGroup icon={<Keyboard size={17} />} title="Keyboard" rows={keyboardRows} />
        <ControlGroup icon={<MousePointer2 size={17} />} title="Mouse" rows={pointerRows} />
        <div className="lg:col-span-2"><ControlGroup icon={<Smartphone size={17} />} title="Touch" rows={touchRows} /></div>
      </div>
    </ShellPanel>
  );
}
