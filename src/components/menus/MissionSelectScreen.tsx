import { ArrowLeft, Lock, PlaneTakeoff, Star } from 'lucide-react';
import { CAMPAIGN_ARCS } from '../../config/campaign';
import { getMissionBestTime, getMissionStatus, isMissionUnlocked } from '../../systems/missionSystem';
import type { CampaignProgress, MissionDefinition } from '../../types/game';
import { MenuButton } from './MenuButton';
import { ShellPanel } from './ShellPanel';
import { formatScore, formatTime, getArcForMission, getMissionStatRows } from './menuUtils';

export interface MissionSelectScreenProps {
  missions: MissionDefinition[];
  selectedMissionId: string;
  progress: CampaignProgress;
  onSelectMission: (missionId: string) => void;
  onStartMission: () => void;
  onBack: () => void;
}

export function MissionSelectScreen({ missions, selectedMissionId, progress, onSelectMission, onStartMission, onBack }: MissionSelectScreenProps) {
  const selectedMission = missions.find(mission => mission.id === selectedMissionId) ?? missions[0];
  const selectedUnlocked = isMissionUnlocked(selectedMission, progress);
  const selectedArc = getArcForMission(selectedMission);

  // Separate main campaign missions from optional sorties
  const mainMissions = missions.filter(m => !m.sortieType || m.sortieType === 'main');
  const optionalSorties = missions.filter(m => m.sortieType === 'optional');
  // Show optional sorties section only if at least one is unlocked
  const anyOptionalUnlocked = optionalSorties.some(m => isMissionUnlocked(m, progress));

  return (
    <ShellPanel
      eyebrow="Campaign Command"
      title="MISSION SELECT"
      side={
        <div className="border border-white/10 bg-black/45 p-4 backdrop-blur-md sm:p-5">
          <div className="text-[10px] uppercase tracking-[0.28em] text-white/45 font-mono mb-4">Selected Sortie</div>
          <div className="font-mono uppercase tracking-[0.14em]">
            <div className="text-[10px] text-orange-400">Mission {selectedMission.order.toString().padStart(2, '0')}</div>
            <div className="mt-2 text-lg text-white">{selectedMission.title}</div>
            <div className="mt-2 text-xs text-white/45">{selectedArc.label}</div>
          </div>
          <div className="mt-5 grid gap-2 text-[11px] font-mono uppercase tracking-[0.14em]">
            {getMissionStatRows(selectedMission, progress).map(row => (
              <div key={row.label} className="flex justify-between gap-4 border border-white/10 bg-white/[0.03] p-3">
                <span className="text-white/40">{row.label}</span>
                <span>{row.value}</span>
              </div>
            ))}
            <div className="flex justify-between gap-4 border border-white/10 bg-white/[0.03] p-3">
              <span className="text-white/40">Reward</span>
              <span className={progress.earnedRewardIds.includes(selectedMission.reward.id) ? 'text-emerald-400' : 'text-orange-300'}>{selectedMission.reward.label}</span>
            </div>
          </div>
          <div className="mt-5 grid gap-3">
            <MenuButton variant="primary" icon={<PlaneTakeoff size={18} />} onClick={onStartMission} disabled={!selectedUnlocked}>Briefing</MenuButton>
            <MenuButton icon={<ArrowLeft size={18} />} onClick={onBack}>Hangar</MenuButton>
          </div>
        </div>
      }
    >
      <div className="grid gap-5 max-w-3xl">
        {CAMPAIGN_ARCS.filter(arc => arc.id !== 'optional-sorties').map(arc => {
          const arcMissions = mainMissions.filter(mission => mission.campaignArc === arc.label);
          if (arcMissions.length === 0) return null;

          return (
            <section key={arc.id} className="border border-white/10 bg-black/30 p-4 sm:p-5">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3 font-mono uppercase tracking-[0.16em]">
                <div>
                  <div className="text-[10px] text-orange-400">{arc.missionRange}</div>
                  <h2 className="mt-1 text-base text-white sm:text-lg">{arc.label}</h2>
                </div>
                <div className="text-[10px] text-white/40">{arc.status}</div>
              </div>
              <div className="grid gap-3">
                {arcMissions.map(mission => {
                  const status = getMissionStatus(mission, progress);
                  const selected = mission.id === selectedMissionId;
                  const unlocked = isMissionUnlocked(mission, progress);
                  return (
                    <button
                      key={mission.id}
                      className={`pointer-events-auto w-full border p-3 text-left font-mono transition-colors sm:p-4 ${selected ? 'border-orange-500 bg-orange-500/10' : 'border-white/10 bg-black/35 hover:border-white/30'} ${!unlocked ? 'opacity-65' : ''}`}
                      onClick={() => onSelectMission(mission.id)}
                      type="button"
                      aria-pressed={selected}
                    >
                      <div className="flex items-start justify-between gap-4 uppercase tracking-[0.14em]">
                        <div className="min-w-0">
                          <div className="text-[10px] text-white/40">Mission {mission.order.toString().padStart(2, '0')}</div>
                          <div className="mt-2 text-sm text-white sm:text-base">{mission.title}</div>
                        </div>
                        <div className={`flex items-center gap-2 text-[10px] ${status === 'CLEARED' ? 'text-emerald-400' : status === 'READY' ? 'text-orange-400' : 'text-white/35'}`}>
                          {!unlocked && <Lock size={13} />}
                          {status}
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-2 text-[10px] uppercase tracking-[0.12em] text-white/45">
                        <span>Threat {mission.difficulty}</span>
                        <span>{formatTime(getMissionBestTime(mission.id, progress))}</span>
                        <span className="text-right">{formatScore(progress.bestMissionScores[mission.id])}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* Stage 9a: Optional Sorties section — shown only when at least one sortie is unlocked */}
        {anyOptionalUnlocked && (
          <section className="border border-sky-500/25 bg-black/30 p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3 font-mono uppercase tracking-[0.16em]">
              <div className="flex items-center gap-3">
                <Star size={14} className="text-sky-400" />
                <div>
                  <div className="text-[10px] text-sky-400">Optional</div>
                  <h2 className="mt-1 text-base text-white sm:text-lg">Optional Sorties</h2>
                </div>
              </div>
              <div className="text-[10px] text-white/40">Not required for campaign completion</div>
            </div>
            <div className="grid gap-3">
              {optionalSorties.map(mission => {
                const status = getMissionStatus(mission, progress);
                const selected = mission.id === selectedMissionId;
                const unlocked = isMissionUnlocked(mission, progress);
                return (
                  <button
                    key={mission.id}
                    className={`pointer-events-auto w-full border p-3 text-left font-mono transition-colors sm:p-4 ${selected ? 'border-sky-500 bg-sky-500/10' : 'border-white/10 bg-black/35 hover:border-sky-500/30'} ${!unlocked ? 'opacity-65' : ''}`}
                    onClick={() => onSelectMission(mission.id)}
                    type="button"
                    aria-pressed={selected}
                  >
                    <div className="flex items-start justify-between gap-4 uppercase tracking-[0.14em]">
                      <div className="min-w-0">
                        <div className="text-[10px] text-sky-400/70">Sortie // {mission.combatDomain?.replace('_', '-') ?? 'SPECIAL'}</div>
                        <div className="mt-2 text-sm text-white sm:text-base">{mission.title}</div>
                      </div>
                      <div className={`flex items-center gap-2 text-[10px] ${status === 'CLEARED' ? 'text-emerald-400' : status === 'READY' ? 'text-sky-400' : 'text-white/35'}`}>
                        {!unlocked && <Lock size={13} />}
                        {status}
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-[10px] uppercase tracking-[0.12em] text-white/45">
                      <span>Threat {mission.difficulty}</span>
                      <span>{formatTime(getMissionBestTime(mission.id, progress))}</span>
                      <span className="text-right">{formatScore(progress.bestMissionScores[mission.id])}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </ShellPanel>
  );
}
