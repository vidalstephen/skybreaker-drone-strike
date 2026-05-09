import { Award, Play, RotateCcw, Settings, Trophy } from 'lucide-react';
import { CAMPAIGN_ARCS } from '../../config/campaign';
import { getCampaignCompletion, getMissionBestRank, getMissionBestScore, getMissionBestTime, getMissionStatus, isMissionUnlocked } from '../../systems/missionSystem';
import type { CampaignProgress, MissionDefinition } from '../../types/game';
import { MenuButton } from './MenuButton';
import { ShellPanel } from './ShellPanel';

export interface MainMenuProps {
  missions: MissionDefinition[];
  selectedMissionId: string;
  progress: CampaignProgress;
  onSelectMission: (missionId: string) => void;
  onStartMission: () => void;
  onOpenSettings: () => void;
  onResetProgress: () => void;
}

function formatTime(ms: number | null) {
  if (ms === null) return '--:--';
  return `${Math.floor(ms / 60000)}:${Math.floor((ms % 60000) / 1000).toString().padStart(2, '0')}`;
}

export function MainMenu({ missions, selectedMissionId, progress, onSelectMission, onStartMission, onOpenSettings, onResetProgress }: MainMenuProps) {
  const selectedMission = missions.find(mission => mission.id === selectedMissionId) ?? missions[0];
  const selectedUnlocked = isMissionUnlocked(selectedMission, progress);
  const selectedStatus = getMissionStatus(selectedMission, progress);
  const selectedRank = getMissionBestRank(selectedMission.id, progress) ?? '--';
  const selectedScore = getMissionBestScore(selectedMission.id, progress);
  const campaignCompletion = getCampaignCompletion(missions, progress);
  const totalBestScore = Object.values(progress.bestMissionScores).reduce((sum, score) => sum + score, 0);
  const earnedRewards = missions.filter(mission => progress.earnedRewardIds.includes(mission.reward.id));
  const selectedArc = CAMPAIGN_ARCS.find(arc => arc.label === selectedMission.campaignArc) ?? CAMPAIGN_ARCS[0];

  return (
    <ShellPanel
      eyebrow="Hangar Command"
      title="SKYBREAKER DRONE STRIKE"
      side={
        <div className="border border-white/10 bg-black/45 p-5 backdrop-blur-md">
          <div className="text-[10px] uppercase tracking-[0.28em] text-white/45 font-mono mb-4">Campaign</div>
          <div className="space-y-3 font-mono text-xs">
            {missions.map(mission => {
              const status = getMissionStatus(mission, progress);
              const selected = mission.id === selectedMissionId;
              return (
                <button
                  key={mission.id}
                  className={`pointer-events-auto w-full border p-3 text-left transition-colors ${selected ? 'border-orange-500 bg-orange-500/10' : 'border-white/10 bg-black/30 hover:border-white/30'}`}
                  onClick={() => onSelectMission(mission.id)}
                  type="button"
                  aria-pressed={selected}
                >
                  <div className="flex justify-between gap-4 uppercase tracking-[0.14em]">
                    <span className="text-white/45">Mission {mission.order.toString().padStart(2, '0')}</span>
                    <span className={status === 'CLEARED' ? 'text-emerald-400' : status === 'READY' ? 'text-orange-400' : 'text-white/35'}>{status}</span>
                  </div>
                  <div className="mt-2 flex justify-between gap-4 uppercase tracking-[0.12em]">
                    <span>{mission.title}</span>
                    <span className="text-white/45">{formatTime(getMissionBestTime(mission.id, progress))}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      }
    >
      <div className="grid gap-6 max-w-2xl">
        <div className="grid grid-cols-3 gap-2 font-mono sm:gap-3">
          <div className="border border-white/10 bg-white/[0.03] p-3 sm:p-4">
            <div className="text-[9px] uppercase tracking-[0.24em] text-white/45">Campaign</div>
            <div className="mt-2 text-xl text-white sm:text-2xl">{campaignCompletion}%</div>
          </div>
          <div className="border border-white/10 bg-white/[0.03] p-3 sm:p-4">
            <div className="text-[9px] uppercase tracking-[0.24em] text-white/45">Best Score</div>
            <div className="mt-2 text-xl text-white sm:text-2xl">{totalBestScore.toLocaleString()}</div>
          </div>
          <div className="border border-white/10 bg-white/[0.03] p-3 sm:p-4">
            <div className="text-[9px] uppercase tracking-[0.24em] text-white/45">Rewards</div>
            <div className="mt-2 text-xl text-white sm:text-2xl">{earnedRewards.length} / {missions.length}</div>
          </div>
        </div>

        <div className="border border-white/10 bg-black/35 p-4 font-mono sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 uppercase tracking-[0.18em]">
            <div>
              <div className="text-[10px] text-orange-400">{selectedMission.campaignArc}</div>
              <div className="mt-2 text-lg text-white sm:text-xl">{selectedMission.title}</div>
            </div>
            <div className="text-right">
              <div className={selectedStatus === 'CLEARED' ? 'text-emerald-400' : selectedStatus === 'READY' ? 'text-orange-400' : 'text-white/35'}>{selectedStatus}</div>
              <div className="mt-1 text-white/45">Threat {selectedMission.difficulty}</div>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3 text-xs uppercase tracking-[0.12em]">
            <div>
              <div className="text-white/35">Best Time</div>
              <div className="mt-1 text-white">{formatTime(getMissionBestTime(selectedMission.id, progress))}</div>
            </div>
            <div>
              <div className="text-white/35">Best Rank</div>
              <div className="mt-1 text-emerald-400">{selectedRank}</div>
            </div>
            <div>
              <div className="text-white/35">Best Score</div>
              <div className="mt-1 text-white">{selectedScore?.toLocaleString() ?? '0'}</div>
            </div>
          </div>
          <div className="mt-5 flex gap-3 border-t border-white/10 pt-4 text-xs text-white/55">
            <Award size={16} className="mt-0.5 shrink-0 text-orange-400" />
            <div>
              <div className="uppercase tracking-[0.14em] text-white/70">{selectedMission.reward.label}</div>
              <div className="mt-1 leading-relaxed">{progress.earnedRewardIds.includes(selectedMission.reward.id) ? selectedMission.reward.description : 'Reward locked until this mission is cleared.'}</div>
            </div>
          </div>
        </div>

        <div className="border border-white/10 bg-black/25 p-4 font-mono sm:p-5">
          <div className="flex flex-wrap justify-between gap-3 uppercase tracking-[0.16em]">
            <div>
              <div className="text-[10px] text-white/35">Campaign Arc</div>
              <div className="mt-2 text-sm text-white">{selectedArc.label}</div>
            </div>
            <div className="text-right text-xs text-orange-400">{selectedArc.missionRange}</div>
          </div>
          <div className="mt-4 grid gap-4 text-xs leading-relaxed text-white/55 sm:grid-cols-2">
            <div>{selectedArc.focus}</div>
            <div>{selectedArc.escalation}</div>
          </div>
        </div>

        <MenuButton variant="primary" icon={<Play size={18} />} onClick={onStartMission} disabled={!selectedUnlocked}>Start Mission</MenuButton>
        <MenuButton icon={<Settings size={18} />} onClick={onOpenSettings}>Settings</MenuButton>
        <MenuButton icon={<Trophy size={18} />} onClick={() => onSelectMission(missions.find(mission => isMissionUnlocked(mission, progress) && !progress.completedMissionIds.includes(mission.id))?.id ?? selectedMission.id)}>Next Sortie</MenuButton>
        <MenuButton icon={<RotateCcw size={18} />} onClick={onResetProgress}>Reset Progress</MenuButton>
      </div>
    </ShellPanel>
  );
}
