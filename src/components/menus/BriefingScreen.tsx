import { ArrowLeft, PlaneTakeoff } from 'lucide-react';
import type { MissionDefinition } from '../../types/game';
import { MenuButton } from './MenuButton';
import { ShellPanel } from './ShellPanel';

export interface BriefingScreenProps {
  mission: MissionDefinition;
  onLaunch: () => void;
  onBack: () => void;
}

export function BriefingScreen({ mission, onLaunch, onBack }: BriefingScreenProps) {
  return (
    <ShellPanel
      eyebrow="Mission Briefing"
      title={mission.title}
      side={
        <div className="grid gap-2 text-[11px] font-mono uppercase tracking-[0.12em] sm:gap-3 sm:text-xs sm:tracking-[0.16em]">
          {mission.briefing.map(item => (
            <div key={item.label} className="border border-white/10 bg-black/45 p-3 flex justify-between gap-4 sm:p-4">
              <span className="text-white/45">{item.label}</span>
              <span>{item.value}</span>
            </div>
          ))}
          <div className="border border-white/10 bg-black/45 p-3 flex justify-between gap-4 sm:p-4">
            <span className="text-white/45">Environment</span>
            <span>{mission.environment.label}</span>
          </div>
          <div className="border border-white/10 bg-black/45 p-3 flex justify-between gap-4 sm:p-4">
            <span className="text-white/45">Hazards</span>
            <span>{mission.environment.hazards.length > 0 ? mission.environment.hazards.map(hazard => hazard.label).join(', ') : 'Clear'}</span>
          </div>
        </div>
      }
    >
      <div className="grid gap-4 max-w-md">
        <MenuButton variant="primary" icon={<PlaneTakeoff size={18} />} onClick={onLaunch}>Launch</MenuButton>
        <MenuButton icon={<ArrowLeft size={18} />} onClick={onBack}>Back</MenuButton>
      </div>
    </ShellPanel>
  );
}
