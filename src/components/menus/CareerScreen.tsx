import { ArrowLeft, Award, Star, Trophy } from 'lucide-react';
import { CAMPAIGN_ARCS } from '../../config/campaign';
import { getMissionStatus } from '../../systems/missionSystem';
import type { CampaignProgress, MissionDefinition } from '../../types/game';
import { MenuButton } from './MenuButton';
import { ShellPanel } from './ShellPanel';
import { formatScore, formatTime, getArcProgress, getCareerSummary } from './menuUtils';

export interface CareerScreenProps {
  missions: MissionDefinition[];
  progress: CampaignProgress;
  onBack: () => void;
}

export function CareerScreen({ missions, progress, onBack }: CareerScreenProps) {
  const summary = getCareerSummary(missions, progress);
  const earnedRewards = missions.filter(mission => progress.earnedRewardIds.includes(mission.reward.id));

  // Stage 9a: Separate main campaign missions from optional sorties for distinct display
  const mainMissions = missions.filter(m => !m.sortieType || m.sortieType === 'main');
  const optionalSorties = missions.filter(m => m.sortieType === 'optional');
  const completedOptional = optionalSorties.filter(m => progress.completedMissionIds.includes(m.id));

  return (
    <ShellPanel
      eyebrow="Pilot Record"
      title="CAREER DOSSIER"
      side={
        <div className="border border-white/10 bg-black/45 p-4 backdrop-blur-md sm:p-5">
          <div className="flex items-center gap-3 text-orange-400"><Trophy size={20} /><span className="font-mono text-[10px] uppercase tracking-[0.28em]">Campaign Record</span></div>
          <div className="mt-5 grid grid-cols-2 gap-3 font-mono uppercase tracking-[0.14em]">
            <div className="border border-white/10 bg-white/[0.03] p-3"><div className="text-[9px] text-white/35">Complete</div><div className="mt-2 text-2xl text-white">{summary.completion}%</div></div>
            <div className="border border-white/10 bg-white/[0.03] p-3"><div className="text-[9px] text-white/35">Cleared</div><div className="mt-2 text-2xl text-white">{summary.completedCount}/{missions.length}</div></div>
            <div className="border border-white/10 bg-white/[0.03] p-3"><div className="text-[9px] text-white/35">Unlocked</div><div className="mt-2 text-2xl text-white">{summary.unlockedCount}</div></div>
            <div className="border border-white/10 bg-white/[0.03] p-3"><div className="text-[9px] text-white/35">Rewards</div><div className="mt-2 text-2xl text-white">{summary.earnedRewards}</div></div>
          </div>
          <div className="mt-3 border border-sky-500/30 bg-sky-500/[0.07] p-3 font-mono uppercase tracking-[0.12em]">
            <div className="text-[9px] text-sky-300">Spare Parts</div>
            <div className="mt-2 text-xl text-white">{(progress.inventory?.parts ?? 0).toLocaleString()}</div>
          </div>
          <div className="mt-5 border border-orange-500/20 bg-orange-500/10 p-3 font-mono uppercase tracking-[0.12em]">
            <div className="text-[9px] text-orange-300">Total Best Score</div>
            <div className="mt-2 text-xl text-white">{summary.totalBestScore.toLocaleString()}</div>
          </div>
          <div className="mt-5"><MenuButton icon={<ArrowLeft size={18} />} onClick={onBack}>Hangar</MenuButton></div>
        </div>
      }
    >
      <div className="grid gap-5 max-w-3xl">
        <section className="grid gap-3 sm:grid-cols-3">
          {CAMPAIGN_ARCS.filter(arc => arc.id !== 'optional-sorties' && mainMissions.some(mission => mission.campaignArc === arc.label)).map(arc => (
            <div key={arc.id} className="border border-white/10 bg-black/35 p-4 font-mono uppercase tracking-[0.13em]">
              <div className="text-[10px] text-orange-400">{arc.missionRange}</div>
              <div className="mt-2 text-sm text-white">{arc.label}</div>
              <div className="mt-4 h-1.5 bg-white/10"><div className="h-full bg-orange-500" style={{ width: `${getArcProgress(mainMissions, arc, progress)}%` }} /></div>
              <div className="mt-3 text-[10px] text-white/45">{getArcProgress(mainMissions, arc, progress)}% archived</div>
            </div>
          ))}
        </section>

        <section className="border border-white/10 bg-black/30 p-4 sm:p-5">
          <div className="mb-4 text-[10px] font-mono uppercase tracking-[0.28em] text-white/45">Mission Records</div>
          <div className="grid gap-2">
            {mainMissions.map(mission => (
              <div key={mission.id} className="grid gap-3 border border-white/10 bg-white/[0.03] p-3 font-mono uppercase tracking-[0.12em] sm:grid-cols-[1fr_auto_auto_auto] sm:items-center">
                <div>
                  <div className="text-[9px] text-white/35">Mission {mission.order.toString().padStart(2, '0')}</div>
                  <div className="mt-1 text-sm text-white">{mission.title}</div>
                </div>
                <div className="text-[10px] text-orange-300">{getMissionStatus(mission, progress)}</div>
                <div className="text-[10px] text-white/60">{formatTime(progress.bestMissionTimes[mission.id] ?? null)}</div>
                <div className="text-[10px] text-white/60">{formatScore(progress.bestMissionScores[mission.id])} // {progress.bestMissionRanks[mission.id] ?? '--'}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Stage 9a: Optional sortie records — only shown when any optional sorties exist */}
        {optionalSorties.length > 0 && (
          <section className="border border-sky-500/25 bg-black/30 p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.28em] text-white/45">
              <Star size={14} className="text-sky-400" /> Optional Sorties ({completedOptional.length}/{optionalSorties.length} cleared)
            </div>
            <div className="grid gap-2">
              {optionalSorties.map(mission => {
                const status = getMissionStatus(mission, progress);
                return (
                  <div key={mission.id} className="grid gap-3 border border-white/10 bg-white/[0.03] p-3 font-mono uppercase tracking-[0.12em] sm:grid-cols-[1fr_auto_auto_auto] sm:items-center">
                    <div>
                      <div className="text-[9px] text-sky-400/70">{mission.combatDomain?.replace(/_/g, '-') ?? 'OPTIONAL'}</div>
                      <div className="mt-1 text-sm text-white">{mission.title}</div>
                    </div>
                    <div className={`text-[10px] ${status === 'CLEARED' ? 'text-emerald-400' : status === 'READY' ? 'text-sky-400' : 'text-white/35'}`}>{status}</div>
                    <div className="text-[10px] text-white/60">{formatTime(progress.bestMissionTimes[mission.id] ?? null)}</div>
                    <div className="text-[10px] text-white/60">{formatScore(progress.bestMissionScores[mission.id])} // {progress.bestMissionRanks[mission.id] ?? '--'}</div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="border border-white/10 bg-black/30 p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.28em] text-white/45"><Award size={16} className="text-orange-400" /> Rewards</div>
          <div className="grid gap-3 sm:grid-cols-2">
            {earnedRewards.length > 0 ? earnedRewards.map(mission => (
              <div key={mission.reward.id} className="border border-white/10 bg-white/[0.03] p-3">
                <div className="font-mono text-xs uppercase tracking-[0.14em] text-white">{mission.reward.label}</div>
                <div className="mt-2 text-xs leading-relaxed text-white/50">{mission.reward.description}</div>
              </div>
            )) : <div className="text-xs font-mono uppercase tracking-[0.16em] text-white/45">No campaign rewards archived.</div>}
          </div>
        </section>
      </div>
    </ShellPanel>
  );
}
