import { ArrowLeft, Check, Cpu, Gamepad2, Monitor, RotateCcw, SlidersHorizontal, Volume2 } from 'lucide-react';
import { useState } from 'react';
import { DEFAULT_APP_SETTINGS } from '../../config/defaults';
import type { AppSettings, GraphicsQuality } from '../../types/game';
import { MenuButton } from './MenuButton';
import { ShellPanel } from './ShellPanel';
import { Tabs, type TabItem } from './Tabs';

export interface SettingsMenuProps {
  settings: AppSettings;
  onChange: (settings: AppSettings) => void;
  onBack: () => void;
}

type SettingsTab = 'audio' | 'video' | 'controls' | 'system';

const TABS: TabItem[] = [
  { id: 'audio', label: 'Audio', icon: <Volume2 size={11} /> },
  { id: 'video', label: 'Video', icon: <Monitor size={11} /> },
  { id: 'controls', label: 'Controls', icon: <Gamepad2 size={11} /> },
  { id: 'system', label: 'System', icon: <Cpu size={11} /> },
];

interface RangeRowProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
}

function RangeRow({ label, value, min = 0, max = 100, step = 1, suffix = '', onChange }: RangeRowProps) {
  return (
    <label className="grid gap-2 border border-white/10 bg-black/45 p-3 sm:p-4">
      <div className="flex items-center justify-between gap-4 text-xs font-mono uppercase tracking-[0.18em]">
        <span className="text-white/55">{label}</span>
        <span>{value}{suffix}</span>
      </div>
      <input className="accent-orange-500" type="range" min={min} max={max} step={step} value={value} aria-label={label} onChange={event => onChange(Number(event.target.value))} />
    </label>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button className="border border-white/10 bg-black/45 p-3 flex items-center justify-between text-xs font-mono uppercase tracking-[0.16em] sm:p-4" onClick={onChange} type="button" aria-pressed={checked}>
      <span className="text-white/55">{label}</span>
      {checked ? <Check size={16} className="text-orange-500" /> : <span className="text-white/35">Off</span>}
    </button>
  );
}

export function SettingsMenu({ settings, onChange, onBack }: SettingsMenuProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('audio');
  const qualities: GraphicsQuality[] = ['LOW', 'MEDIUM', 'HIGH'];

  const setSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  const renderTab = () => {
    if (activeTab === 'audio') {
      return (
        <div className="grid gap-3 md:grid-cols-3">
          <RangeRow label="Master" value={settings.masterVolume} suffix="%" onChange={value => setSetting('masterVolume', value)} />
          <RangeRow label="Music" value={settings.musicVolume} suffix="%" onChange={value => setSetting('musicVolume', value)} />
          <RangeRow label="SFX" value={settings.sfxVolume} suffix="%" onChange={value => setSetting('sfxVolume', value)} />
        </div>
      );
    }

    if (activeTab === 'video') {
      return (
        <div className="grid gap-3">
          <div className="border border-white/10 bg-black/45 p-3 sm:p-4">
            <div className="text-xs font-mono uppercase tracking-[0.18em] text-white/55 mb-3">Graphics</div>
            <div className="grid grid-cols-3 gap-2" role="group" aria-label="Graphics quality">
              {qualities.map(quality => (
                <button
                  key={quality}
                  className={`min-h-10 border text-[10px] font-black tracking-[0.16em] ${settings.graphicsQuality === quality ? 'bg-orange-500 text-black border-orange-500' : 'border-white/15 text-white hover:border-orange-500'}`}
                  onClick={() => setSetting('graphicsQuality', quality)}
                  type="button"
                  aria-pressed={settings.graphicsQuality === quality}
                >
                  {quality}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <RangeRow label="HUD Scale" value={settings.hudScale} min={85} max={115} suffix="%" onChange={value => setSetting('hudScale', value)} />
            <RangeRow label="Screen Shake" value={settings.screenShake} suffix="%" onChange={value => setSetting('screenShake', value)} />
            <ToggleRow label="Reduced Effects" checked={settings.reduceEffects} onChange={() => setSetting('reduceEffects', !settings.reduceEffects)} />
            <ToggleRow label="Telemetry" checked={settings.showTelemetry} onChange={() => setSetting('showTelemetry', !settings.showTelemetry)} />
          </div>
        </div>
      );
    }

    if (activeTab === 'controls') {
      return (
        <div className="grid gap-3 md:grid-cols-2">
          <ToggleRow label="Invert Y" checked={settings.invertY} onChange={() => setSetting('invertY', !settings.invertY)} />
          <RangeRow label="Pointer Sens" value={settings.pointerSensitivity} min={60} max={140} suffix="%" onChange={value => setSetting('pointerSensitivity', value)} />
          <RangeRow label="Drag Sens" value={settings.touchDragSensitivity} min={60} max={140} suffix="%" onChange={value => setSetting('touchDragSensitivity', value)} />
          <RangeRow label="Touch Scale" value={settings.touchControlsScale} min={85} max={125} suffix="%" onChange={value => setSetting('touchControlsScale', value)} />
        </div>
      );
    }

    return (
      <div className="grid gap-3 md:grid-cols-2">
        <ToggleRow label="Menu Motion" checked={settings.menuMotion} onChange={() => setSetting('menuMotion', !settings.menuMotion)} />
        <button className="border border-white/10 bg-black/45 p-3 flex items-center justify-between text-xs font-mono uppercase tracking-[0.16em] sm:p-4" onClick={() => onChange(DEFAULT_APP_SETTINGS)} type="button">
          <span className="text-white/55">Defaults</span>
          <RotateCcw size={16} className="text-orange-500" />
        </button>
      </div>
    );
  };

  return (
    <ShellPanel
      eyebrow="System Settings"
      title="CONFIGURATION"
      side={
        <div className="border border-white/10 bg-black/45 p-4 backdrop-blur-md sm:p-5">
          <div className="flex items-center gap-3 text-orange-400"><SlidersHorizontal size={20} /><span className="font-mono text-[10px] uppercase tracking-[0.28em]">Settings Bank</span></div>
          <div className="mt-5 grid gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-white/55">
            <div className="flex justify-between border border-white/10 bg-white/[0.03] p-3"><span>Quality</span><span>{settings.graphicsQuality}</span></div>
            <div className="flex justify-between border border-white/10 bg-white/[0.03] p-3"><span>HUD</span><span>{settings.hudScale}%</span></div>
            <div className="flex justify-between border border-white/10 bg-white/[0.03] p-3"><span>Touch</span><span>{settings.touchControlsScale}%</span></div>
          </div>
          <div className="mt-5"><MenuButton icon={<ArrowLeft size={18} />} onClick={onBack}>Back</MenuButton></div>
        </div>
      }
    >
      <div className="flex h-full flex-col gap-3" data-menu="settings">
        <Tabs tabs={TABS} activeId={activeTab} onChange={(id) => setActiveTab(id as SettingsTab)} ariaLabel="Settings categories" />
        <div className="min-h-0 flex-1">
          <div className="border border-white/10 bg-black/25 p-3 sm:p-4">
            <div className="mb-3 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.26em] text-orange-400">
              {activeTab === 'audio' ? <Volume2 size={16} /> : activeTab === 'video' ? <Monitor size={16} /> : activeTab === 'controls' ? <Gamepad2 size={16} /> : <Cpu size={16} />}
              {activeTab.toUpperCase()}
            </div>
            {renderTab()}
          </div>
        </div>
      </div>
    </ShellPanel>
  );
}
