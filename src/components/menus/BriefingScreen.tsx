import { useState } from 'react';
import { ArrowLeft, ClipboardList, FileText, PlaneTakeoff } from 'lucide-react';
import type { MissionDefinition } from '../../types/game';
import { resolveMissionWeather } from '../../config/weather';
import { MenuButton } from './MenuButton';
import { ShellPanel } from './ShellPanel';
import { Tabs, type TabItem } from './Tabs';
import { formatParTime } from './menuUtils';

export interface BriefingScreenProps {
  mission: MissionDefinition;
  onContinue: () => void;
  onLoadout?: () => void;
  onBack: () => void;
}

type BriefingTab = 'objective' | 'details';

const TABS: TabItem[] = [
  { id: 'objective', label: 'Objective', icon: <ClipboardList size={11} /> },
  { id: 'details', label: 'Details', icon: <FileText size={11} /> },
];

export function BriefingScreen({ mission, onContinue, onLoadout, onBack }: BriefingScreenProps) {
  const [activeTab, setActiveTab] = useState<BriefingTab>('objective');
  const hazardLabels = mission.environment.hazards.length > 0 ? mission.environment.hazards.map(hazard => hazard.label).join(', ') : 'Clear';
  const enemyComposition = mission.enemyWave.composition.map(entry => `${entry.count} ${entry.role.replaceAll('-', ' ')}`).join(', ');
  const weatherDef = resolveMissionWeather(mission.weatherId);
  const hasWeather = weatherDef.id !== 'clear';

  const classificationChips = [
    mission.missionType,
    mission.combatDomain?.replace(/_/g, ' '),
    mission.timeOfDay?.toUpperCase(),
    hasWeather ? weatherDef.label.toUpperCase() : null,
  ].filter(Boolean) as string[];

  const detailsSidebar = (
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
      {hasWeather && (
        <div className="border border-amber-400/20 bg-amber-400/5 p-3 flex justify-between gap-4 sm:p-4">
          <span className="text-white/45">Weather</span>
          <span className="text-amber-300/90">{weatherDef.label}</span>
        </div>
      )}
      <div className="border border-white/10 bg-black/45 p-3 flex justify-between gap-4 sm:p-4">
        <span className="text-white/45">Par Time</span>
        <span>{formatParTime(mission.scoring.parTimeMs)}</span>
      </div>
      <div className="border border-white/10 bg-black/45 p-3 flex justify-between gap-4 sm:p-4">
        <span className="text-white/45">Reward</span>
        <span>{mission.reward.label}</span>
      </div>
    </div>
  );

  return (
    <ShellPanel
      eyebrow="Mission Briefing"
      title={mission.title}
      side={detailsSidebar}
    >
      <div className="flex h-full flex-col gap-3" data-menu="briefing">
        <Tabs tabs={TABS} activeId={activeTab} onChange={(id) => setActiveTab(id as BriefingTab)} ariaLabel="Briefing sections" />

        <div className="min-h-0 flex-1">
          {activeTab === 'objective' && (
            <div role="tabpanel" aria-label="Objective" data-tab-panel="objective" className="grid gap-3 max-w-2xl">
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="border border-white/10 bg-black/35 p-3 font-mono uppercase tracking-[0.13em] sm:p-4"><div className="text-[10px] text-white/35">Targets</div><div className="mt-1 text-xl text-white">{mission.targets.length}</div></div>
                <div className="border border-white/10 bg-black/35 p-3 font-mono uppercase tracking-[0.13em] sm:p-4"><div className="text-[10px] text-white/35">Threat</div><div className="mt-1 text-xl text-white">{mission.difficulty}</div></div>
                <div className="border border-white/10 bg-black/35 p-3 font-mono uppercase tracking-[0.13em] sm:p-4"><div className="text-[10px] text-white/35">Wave</div><div className="mt-1 text-xl text-white">{mission.enemyWave.count}</div></div>
              </div>

              {classificationChips.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {classificationChips.map(chip => (
                    <span key={chip} className="border border-orange-400/30 bg-orange-400/5 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.22em] text-orange-300/70">{chip}</span>
                  ))}
                </div>
              )}

              <div className="border border-white/10 bg-black/35 p-3 font-mono sm:p-5">
                <div className="text-[10px] uppercase tracking-[0.24em] text-orange-400">Objective</div>
                <div className="mt-2 text-sm uppercase tracking-[0.14em] text-white">{mission.initialObjective}</div>
                <div className="mt-3 grid gap-2 text-xs uppercase tracking-[0.12em] text-white/55 sm:grid-cols-2">
                  <div>Extraction: {mission.extraction.label}</div>
                  <div>Enemy Wave: {enemyComposition}</div>
                  <div>Failure: {mission.failureConditions.map(condition => condition.label).join(', ')}</div>
                  <div>Rank S: {mission.scoring.rankThresholds.S.toLocaleString()}</div>
                </div>
              </div>

              {hasWeather && weatherDef.briefingNote && (
                <div className="border border-amber-400/20 bg-amber-400/5 p-3 font-mono sm:p-5">
                  <div className="text-[10px] uppercase tracking-[0.24em] text-amber-400/80">Weather Advisory</div>
                  <div className="mt-2 text-xs uppercase tracking-[0.12em] text-amber-200/70">{weatherDef.warningText}</div>
                  <div className="mt-1.5 text-[11px] normal-case tracking-normal text-white/55 capitalize">{weatherDef.briefingNote}</div>
                </div>
              )}

              {mission.objectiveSet?.optional && mission.objectiveSet.optional.length > 0 && (
                <div className="border border-white/10 bg-black/35 p-3 font-mono sm:p-5">
                  <div className="text-[10px] uppercase tracking-[0.24em] text-white/45">Optional Objectives</div>
                  <div className="mt-2 grid gap-1.5">
                    {mission.objectiveSet.optional.map(obj => (
                      <div key={obj.id} className="text-xs uppercase tracking-[0.12em] text-white/65">{obj.label}{obj.description ? <span className="ml-2 text-white/35 normal-case tracking-normal capitalize">{obj.description}</span> : null}</div>
                    ))}
                  </div>
                </div>
              )}

              {mission.objectiveSet?.bonusConditions && mission.objectiveSet.bonusConditions.length > 0 && (
                <div className="border border-white/10 bg-black/35 p-3 font-mono sm:p-5">
                  <div className="text-[10px] uppercase tracking-[0.24em] text-white/45">Bonus Conditions</div>
                  <div className="mt-2 grid gap-1.5">
                    {mission.objectiveSet.bonusConditions.map(cond => (
                      <div key={cond.id} className="flex justify-between gap-2">
                        <span className="text-xs uppercase tracking-[0.12em] text-white/65">{cond.label}</span>
                        <span className="text-xs font-mono text-emerald-400/70 shrink-0">+{cond.scoreBonus.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid gap-2">
                <MenuButton variant="primary" icon={<PlaneTakeoff size={18} />} onClick={onContinue}>Launch</MenuButton>
                <div className="grid gap-2 sm:grid-cols-2">
                  <MenuButton icon={<ArrowLeft size={18} />} onClick={onBack}>Campaign</MenuButton>
                  {onLoadout && <MenuButton onClick={onLoadout}>Loadout Review</MenuButton>}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <div role="tabpanel" aria-label="Details" data-tab-panel="details" className="grid gap-3 max-w-2xl">
              {/* On mobile, show the full detail list inline (sidebar is hidden below md). */}
              <div className="md:hidden">{detailsSidebar}</div>
              {/* On desktop, sidebar carries this content — show a hint to keep the tab useful. */}
              <div className="hidden md:block border border-white/10 bg-black/25 p-4 font-mono text-xs uppercase tracking-[0.13em] text-white/55">
                Mission details are pinned to the right panel.
              </div>

              <div className="grid gap-2">
                <MenuButton variant="primary" icon={<PlaneTakeoff size={18} />} onClick={onContinue}>Launch</MenuButton>
                <div className="grid gap-2 sm:grid-cols-2">
                  <MenuButton icon={<ArrowLeft size={18} />} onClick={onBack}>Campaign</MenuButton>
                  {onLoadout && <MenuButton onClick={onLoadout}>Loadout Review</MenuButton>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ShellPanel>
  );
}
