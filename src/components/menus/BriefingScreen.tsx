import { ArrowLeft, PlaneTakeoff } from 'lucide-react';
import type { MissionDefinition } from '../../types/game';
import { MenuButton } from './MenuButton';
import { ShellPanel } from './ShellPanel';
import { formatParTime } from './menuUtils';

export interface BriefingScreenProps {
  mission: MissionDefinition;
  onContinue: () => void;
  onBack: () => void;
}

export function BriefingScreen({ mission, onContinue, onBack }: BriefingScreenProps) {
  const hazardLabels = mission.environment.hazards.length > 0 ? mission.environment.hazards.map(hazard => hazard.label).join(', ') : 'Clear';
  const enemyComposition = mission.enemyWave.composition.map(entry => `${entry.count} ${entry.role.replaceAll('-', ' ')}`).join(', ');

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
            <span>{hazardLabels}</span>
          </div>
          <div className="border border-white/10 bg-black/45 p-3 flex justify-between gap-4 sm:p-4">
            <span className="text-white/45">Par Time</span>
            <span>{formatParTime(mission.scoring.parTimeMs)}</span>
          </div>
          <div className="border border-white/10 bg-black/45 p-3 flex justify-between gap-4 sm:p-4">
            <span className="text-white/45">Reward</span>
            <span>{mission.reward.label}</span>
          </div>
        </div>
      }
    >
      <div className="grid gap-4 max-w-2xl">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="border border-white/10 bg-black/35 p-4 font-mono uppercase tracking-[0.13em]"><div className="text-[10px] text-white/35">Targets</div><div className="mt-2 text-xl text-white">{mission.targets.length}</div></div>
          <div className="border border-white/10 bg-black/35 p-4 font-mono uppercase tracking-[0.13em]"><div className="text-[10px] text-white/35">Threat</div><div className="mt-2 text-xl text-white">{mission.difficulty}</div></div>
          <div className="border border-white/10 bg-black/35 p-4 font-mono uppercase tracking-[0.13em]"><div className="text-[10px] text-white/35">Wave</div><div className="mt-2 text-xl text-white">{mission.enemyWave.count}</div></div>
        </div>

        <div className="border border-white/10 bg-black/35 p-4 font-mono sm:p-5">
          <div className="text-[10px] uppercase tracking-[0.24em] text-orange-400">Objective</div>
          <div className="mt-3 text-sm uppercase tracking-[0.14em] text-white">{mission.initialObjective}</div>
          <div className="mt-4 grid gap-3 text-xs uppercase tracking-[0.12em] text-white/55 sm:grid-cols-2">
            <div>Extraction: {mission.extraction.label}</div>
            <div>Enemy Wave: {enemyComposition}</div>
            <div>Failure: {mission.failureConditions.map(condition => condition.label).join(', ')}</div>
            <div>Rank S: {mission.scoring.rankThresholds.S.toLocaleString()}</div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <MenuButton variant="primary" icon={<PlaneTakeoff size={18} />} onClick={onContinue}>Loadout</MenuButton>
          <MenuButton icon={<ArrowLeft size={18} />} onClick={onBack}>Campaign</MenuButton>
        </div>
      </div>
    </ShellPanel>
  );
}
