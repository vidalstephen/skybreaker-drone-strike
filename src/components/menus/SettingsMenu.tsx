import { ArrowLeft, Check } from 'lucide-react';
import type { AppSettings, GraphicsQuality } from '../../types/game';
import { MenuButton } from './MenuButton';
import { ShellPanel } from './ShellPanel';

export interface SettingsMenuProps {
  settings: AppSettings;
  onChange: (settings: AppSettings) => void;
  onBack: () => void;
}

function RangeRow({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="grid gap-2 border border-white/10 bg-black/45 p-3 sm:p-4">
      <div className="flex items-center justify-between gap-4 text-xs font-mono uppercase tracking-[0.18em]">
        <span className="text-white/55">{label}</span>
        <span>{value}</span>
      </div>
      <input className="accent-orange-500" type="range" min="0" max="100" value={value} aria-label={`${label} volume`} onChange={event => onChange(Number(event.target.value))} />
    </label>
  );
}

export function SettingsMenu({ settings, onChange, onBack }: SettingsMenuProps) {
  const setSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  const qualities: GraphicsQuality[] = ['LOW', 'MEDIUM', 'HIGH'];

  return (
    <ShellPanel eyebrow="System Settings" title="CONFIGURATION">
      <div className="grid gap-4 max-w-2xl">
        <div className="grid gap-3 md:grid-cols-3">
          <RangeRow label="Master" value={settings.masterVolume} onChange={value => setSetting('masterVolume', value)} />
          <RangeRow label="Music" value={settings.musicVolume} onChange={value => setSetting('musicVolume', value)} />
          <RangeRow label="SFX" value={settings.sfxVolume} onChange={value => setSetting('sfxVolume', value)} />
        </div>

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
          <button className="border border-white/10 bg-black/45 p-3 flex items-center justify-between text-xs font-mono uppercase tracking-[0.16em] sm:p-4" onClick={() => setSetting('reduceEffects', !settings.reduceEffects)} type="button" aria-pressed={settings.reduceEffects}>
            <span className="text-white/55">Reduced Effects</span>
            {settings.reduceEffects ? <Check size={16} className="text-orange-500" /> : <span className="text-white/35">Off</span>}
          </button>
          <button className="border border-white/10 bg-black/45 p-3 flex items-center justify-between text-xs font-mono uppercase tracking-[0.16em] sm:p-4" onClick={() => setSetting('invertY', !settings.invertY)} type="button" aria-pressed={settings.invertY}>
            <span className="text-white/55">Invert Y</span>
            {settings.invertY ? <Check size={16} className="text-orange-500" /> : <span className="text-white/35">Off</span>}
          </button>
        </div>

        <MenuButton icon={<ArrowLeft size={18} />} onClick={onBack}>Back</MenuButton>
      </div>
    </ShellPanel>
  );
}
