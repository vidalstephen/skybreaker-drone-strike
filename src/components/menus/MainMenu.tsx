import { Award, Gamepad2, Info, ListChecks, Play, RotateCcw, Settings, SlidersHorizontal, Trophy } from 'lucide-react';
import { CAMPAIGN_ARCS } from '../../config/campaign';
import type { CampaignProgress, MissionDefinition } from '../../types/game';
import { MenuButton } from './MenuButton';
import { ShellPanel } from './ShellPanel';
import { formatScore, formatTime, getArcProgress, getCareerSummary, getMissionStatRows } from './menuUtils';

export interface MainMenuProps {
  missions: MissionDefinition[];
  nextMissionId: string;
  progress: CampaignProgress;
  onContinue: () => void;
  onOpenCampaign: () => void;
  onOpenLoadout: () => void;
  onOpenCareer: () => void;
  onOpenSettings: () => void;
  onOpenControls: () => void;
  onOpenCredits: () => void;
  onResetProgress: () => void;
}

export function MainMenu({ missions, nextMissionId, progress, onContinue, onOpenCampaign, onOpenLoadout, onOpenCareer, onOpenSettings, onOpenControls, onOpenCredits, onResetProgress }: MainMenuProps) {
  const nextMission = missions.find(mission => mission.id === nextMissionId) ?? missions[0];
  const summary = getCareerSummary(missions, progress);
  const earnedRewards = missions.filter(mission => progress.earnedRewardIds.includes(mission.reward.id));
  const bestTime = formatTime(progress.bestMissionTimes[nextMission.id] ?? null);

  return (
    <ShellPanel
      eyebrow="Hangar Command"
      title="SKYBREAKER DRONE STRIKE"
      side={
        <div className="border border-white/10 bg-black/45 p-4 backdrop-blur-md sm:p-5">
          <div className="text-[10px] uppercase tracking-[0.28em] text-white/45 font-mono mb-4">Next Sortie</div>
          <div className="font-mono uppercase tracking-[0.14em]">
            <div className="text-[10px] text-orange-400">Mission {nextMission.order.toString().padStart(2, '0')}</div>
            <div className="mt-2 text-lg text-white">{nextMission.title}</div>
            <div className="mt-2 text-xs text-white/45">{nextMission.campaignArc}</div>
          </div>
          <div className="mt-5 grid gap-2 text-[11px] font-mono uppercase tracking-[0.12em]">
            {getMissionStatRows(nextMission, progress).map(row => (
              <div key={row.label} className="flex justify-between gap-4 border border-white/10 bg-white/[0.03] p-3">
                <span className="text-white/40">{row.label}</span>
                <span>{row.value}</span>
              </div>
            ))}
            <div className="flex justify-between gap-4 border border-white/10 bg-white/[0.03] p-3">
              <span className="text-white/40">Par</span>
              <span>{formatTime(nextMission.scoring.parTimeMs)}</span>
            </div>
          </div>
          <div className="mt-5"><MenuButton variant="primary" icon={<Play size={18} />} onClick={onContinue}>Continue</MenuButton></div>
        </div>
      }
    >
      <div className="grid gap-5 max-w-3xl">
        <div className="grid grid-cols-3 gap-2 font-mono sm:gap-3">
          <div className="border border-white/10 bg-white/[0.03] p-3 sm:p-4">
            <div className="text-[9px] uppercase tracking-[0.24em] text-white/45">Campaign</div>
            <div className="mt-2 text-xl text-white sm:text-2xl">{summary.completion}%</div>
          </div>
          <div className="border border-white/10 bg-white/[0.03] p-3 sm:p-4">
            <div className="text-[9px] uppercase tracking-[0.24em] text-white/45">Best Score</div>
            <div className="mt-2 text-xl text-white sm:text-2xl">{formatScore(summary.totalBestScore)}</div>
          </div>
          <div className="border border-white/10 bg-white/[0.03] p-3 sm:p-4">
            <div className="text-[9px] uppercase tracking-[0.24em] text-white/45">Rewards</div>
            <div className="mt-2 text-xl text-white sm:text-2xl">{earnedRewards.length} / {missions.length}</div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <MenuButton variant="primary" icon={<Play size={18} />} onClick={onContinue}>Next Sortie</MenuButton>
          <MenuButton icon={<ListChecks size={18} />} onClick={onOpenCampaign}>Campaign</MenuButton>
          <MenuButton icon={<SlidersHorizontal size={18} />} onClick={onOpenLoadout}>Loadout</MenuButton>
          <MenuButton icon={<Trophy size={18} />} onClick={onOpenCareer}>Pilot Record</MenuButton>
          <MenuButton icon={<Settings size={18} />} onClick={onOpenSettings}>Settings</MenuButton>
          <MenuButton icon={<Gamepad2 size={18} />} onClick={onOpenControls}>Controls</MenuButton>
          <MenuButton icon={<Info size={18} />} onClick={onOpenCredits}>Credits</MenuButton>
          <MenuButton icon={<RotateCcw size={18} />} onClick={onResetProgress}>Reset Progress</MenuButton>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {CAMPAIGN_ARCS.map(arc => (
            <div key={arc.id} className="border border-white/10 bg-black/25 p-4 font-mono uppercase tracking-[0.13em]">
              <div className="text-[10px] text-orange-400">{arc.missionRange}</div>
              <div className="mt-2 text-sm text-white">{arc.label}</div>
              <div className="mt-4 h-1.5 bg-white/10"><div className="h-full bg-orange-500" style={{ width: `${getArcProgress(missions, arc, progress)}%` }} /></div>
              <div className="mt-3 text-[10px] text-white/45">{getArcProgress(missions, arc, progress)}%</div>
            </div>
          ))}
        </div>

        <div className="border border-white/10 bg-black/25 p-4 font-mono text-xs uppercase tracking-[0.13em] text-white/55 sm:p-5">
          <div className="mb-3 flex items-center gap-3 text-orange-400"><Award size={16} /> Clearance</div>
          <div className="grid gap-2 sm:grid-cols-3">
            <div>Next: {nextMission.title}</div>
            <div>Best: {bestTime}</div>
            <div>Rewards: {earnedRewards.length}</div>
          </div>
        </div>
      </div>
    </ShellPanel>
  );
}
