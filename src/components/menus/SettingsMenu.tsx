import { ArrowLeft, Check, Monitor, RotateCcw, SlidersHorizontal, Volume2 } from 'lucide-react';
import { useState } from 'react';
import { DEFAULT_APP_SETTINGS } from '../../config/defaults';
import type { AppSettings, GraphicsQuality } from '../../types/game';
import { MenuButton } from './MenuButton';
import { ShellPanel } from './ShellPanel';

export interface SettingsMenuProps {
  settings: AppSettings;
  onChange: (settings: AppSettings) => void;
  onBack: () => void;
}

type SettingsTab = 'AUDIO' | 'VIDEO' | 'CONTROLS' | 'SYSTEM';

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

function TabButton({ active, children, onClick }: { active: boolean; children: string; onClick: () => void }) {
  return (
    <button
      className={`min-h-10 border px-3 text-[10px] font-black uppercase tracking-[0.16em] transition-colors ${active ? 'border-orange-500 bg-orange-500 text-black' : 'border-white/15 bg-black/35 text-white hover:border-orange-500'}`}
      onClick={onClick}
      type="button"
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

export function SettingsMenu({ settings, onChange, onBack }: SettingsMenuProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('AUDIO');
  const qualities: GraphicsQuality[] = ['LOW', 'MEDIUM', 'HIGH'];

  const setSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  const renderTab = () => {
    if (activeTab === 'AUDIO') {
      return (
        <div className="grid gap-3 md:grid-cols-3">
          <RangeRow label="Master" value={settings.masterVolume} suffix="%" onChange={value => setSetting('masterVolume', value)} />
          <RangeRow label="Music" value={settings.musicVolume} suffix="%" onChange={value => setSetting('musicVolume', value)} />
          <RangeRow label="SFX" value={settings.sfxVolume} suffix="%" onChange={value => setSetting('sfxVolume', value)} />
        </div>
      );
    }

    if (activeTab === 'VIDEO') {
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

    if (activeTab === 'CONTROLS') {
      return (
        <div className="grid gap-3 md:grid-cols-2">
          <ToggleRow label="Invert Y" checked={settings.invertY} onChange={() => setSetting('invertY', !settings.invertY)} />
          <RangeRow label="Pointer Sens" value={settings.pointerSensitivity} min={60} max={140} suffix="%" onChange={value => setSetting('pointerSensitivity', value)} />
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
      <div className="grid gap-4 max-w-3xl">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <TabButton active={activeTab === 'AUDIO'} onClick={() => setActiveTab('AUDIO')}>Audio</TabButton>
          <TabButton active={activeTab === 'VIDEO'} onClick={() => setActiveTab('VIDEO')}>Video</TabButton>
          <TabButton active={activeTab === 'CONTROLS'} onClick={() => setActiveTab('CONTROLS')}>Controls</TabButton>
          <TabButton active={activeTab === 'SYSTEM'} onClick={() => setActiveTab('SYSTEM')}>System</TabButton>
        </div>
        <div className="border border-white/10 bg-black/25 p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.26em] text-orange-400">
            {activeTab === 'AUDIO' ? <Volume2 size={16} /> : <Monitor size={16} />}
            {activeTab}
          </div>
          {renderTab()}
        </div>
      </div>
    </ShellPanel>
  );
}
