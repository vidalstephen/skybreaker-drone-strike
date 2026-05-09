/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import Game from './components/Game';
import { BriefingScreen, MainMenu, PauseMenu, SettingsMenu } from './components/menus';
import {
  DEFAULT_APP_SETTINGS,
  DEFAULT_CAMPAIGN_PROGRESS,
  PROGRESS_STORAGE_KEY,
  SETTINGS_STORAGE_KEY,
} from './config/defaults';
import { DEFAULT_MISSION_ID, getMissionById, MISSIONS } from './config/missions';
import { useAudio } from './hooks/useAudio';
import { completeMission, isMissionUnlocked } from './systems/missionSystem';
import { GamePhase, type AppSettings, type CampaignProgress, type MissionCompletionResult } from './types/game';

function loadStoredJson(key: string): unknown {
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function clampPercent(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : fallback;
}

function loadStoredSettings() {
  const stored = loadStoredJson(SETTINGS_STORAGE_KEY) as Partial<AppSettings> | null;
  const graphicsQuality = stored?.graphicsQuality === 'LOW' || stored?.graphicsQuality === 'MEDIUM' || stored?.graphicsQuality === 'HIGH'
    ? stored.graphicsQuality
    : DEFAULT_APP_SETTINGS.graphicsQuality;

  return {
    masterVolume: clampPercent(stored?.masterVolume, DEFAULT_APP_SETTINGS.masterVolume),
    musicVolume: clampPercent(stored?.musicVolume, DEFAULT_APP_SETTINGS.musicVolume),
    sfxVolume: clampPercent(stored?.sfxVolume, DEFAULT_APP_SETTINGS.sfxVolume),
    graphicsQuality,
    reduceEffects: typeof stored?.reduceEffects === 'boolean' ? stored.reduceEffects : DEFAULT_APP_SETTINGS.reduceEffects,
    invertY: typeof stored?.invertY === 'boolean' ? stored.invertY : DEFAULT_APP_SETTINGS.invertY,
  } satisfies AppSettings;
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function loadStoredProgress() {
  const stored = loadStoredJson(PROGRESS_STORAGE_KEY) as Partial<CampaignProgress> | null;
  const missionIds = new Set(MISSIONS.map(mission => mission.id));
  const validRanks = new Set(['S', 'A', 'B', 'C']);
  const completedMissionIds = Array.from(new Set(stringArray(stored?.completedMissionIds).filter(id => missionIds.has(id))));
  const completedMissionIdSet = new Set(completedMissionIds);
  const unlockedFromCompleted = MISSIONS
    .filter(mission => mission.unlockAfterMissionId && completedMissionIdSet.has(mission.unlockAfterMissionId))
    .map(mission => mission.id);
  const unlockedMissionIds = Array.from(new Set([
    ...DEFAULT_CAMPAIGN_PROGRESS.unlockedMissionIds,
    ...stringArray(stored?.unlockedMissionIds).filter(id => missionIds.has(id)),
    ...completedMissionIds,
    ...unlockedFromCompleted,
  ]));

  const bestMissionTimes = Object.fromEntries(
    Object.entries(stored?.bestMissionTimes ?? {}).filter(([id, value]) => missionIds.has(id) && typeof value === 'number' && Number.isFinite(value) && value > 0)
  );
  const bestMissionScores = Object.fromEntries(
    Object.entries(stored?.bestMissionScores ?? {}).filter(([id, value]) => missionIds.has(id) && typeof value === 'number' && Number.isFinite(value) && value >= 0)
  );
  const bestMissionRanks = Object.fromEntries(
    Object.entries(stored?.bestMissionRanks ?? {}).filter(([id, value]) => missionIds.has(id) && typeof value === 'string' && validRanks.has(value))
  ) as CampaignProgress['bestMissionRanks'];

  return {
    unlockedMissionIds,
    completedMissionIds,
    bestMissionTimes,
    bestMissionScores,
    bestMissionRanks,
    earnedRewardIds: Array.from(new Set([
      ...stringArray(stored?.earnedRewardIds),
      ...MISSIONS.filter(mission => completedMissionIdSet.has(mission.id)).map(mission => mission.reward.id),
    ])),
  } satisfies CampaignProgress;
}

export default function App() {
  const [phase, setPhase] = useState(GamePhase.MAIN_MENU);
  const [settingsReturnPhase, setSettingsReturnPhase] = useState(GamePhase.MAIN_MENU);
  const [selectedMissionId, setSelectedMissionId] = useState(DEFAULT_MISSION_ID);
  const [missionRunId, setMissionRunId] = useState(0);
  const [settings, setSettings] = useState<AppSettings>(loadStoredSettings);
  const [progress, setProgress] = useState<CampaignProgress>(loadStoredProgress);
  const selectedMission = getMissionById(selectedMissionId);
  const { playCue } = useAudio(settings, phase);

  useEffect(() => {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Escape' && event.code !== 'KeyP') return;
      setPhase(current => {
        if (current === GamePhase.IN_MISSION) return GamePhase.PAUSED;
        if (current === GamePhase.PAUSED) return GamePhase.IN_MISSION;
        return current;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const launchMission = useCallback(() => {
    if (!isMissionUnlocked(selectedMission, progress)) return;
    playCue('ui');
    setMissionRunId(runId => runId + 1);
    setPhase(GamePhase.IN_MISSION);
  }, [playCue, progress, selectedMission]);

  const retryMission = useCallback(() => {
    playCue('ui');
    setMissionRunId(runId => runId + 1);
    setPhase(GamePhase.IN_MISSION);
  }, [playCue]);

  const returnToMenu = useCallback(() => {
    playCue('ui');
    setPhase(GamePhase.MAIN_MENU);
  }, [playCue]);

  const openSettings = useCallback((returnPhase: GamePhase) => {
    playCue('ui');
    setSettingsReturnPhase(returnPhase);
    setPhase(GamePhase.SETTINGS);
  }, [playCue]);

  const handleMissionComplete = useCallback((result: MissionCompletionResult) => {
    playCue('success');
    setProgress(current => completeMission(current, selectedMission, result, MISSIONS));
    setPhase(GamePhase.DEBRIEF);
  }, [playCue, selectedMission]);

  const handleMissionFailed = useCallback(() => {
    playCue('failure');
    setPhase(GamePhase.DEBRIEF);
  }, [playCue]);

  const resetProgress = useCallback(() => {
    playCue('ui');
    setProgress(DEFAULT_CAMPAIGN_PROGRESS);
    setSelectedMissionId(DEFAULT_MISSION_ID);
  }, [playCue]);

  const gamePhase = phase === GamePhase.SETTINGS && settingsReturnPhase === GamePhase.PAUSED ? GamePhase.PAUSED : phase;
  const shouldRenderGame = gamePhase === GamePhase.IN_MISSION || gamePhase === GamePhase.PAUSED || gamePhase === GamePhase.DEBRIEF;

  return (
    <div className="w-full h-screen bg-black">
      {shouldRenderGame && (
        <div key={`${selectedMission.id}-${missionRunId}`} className="w-full h-full">
          <Game
            phase={gamePhase}
            mission={selectedMission}
            progress={progress}
            settings={settings}
            onSettingsChange={setSettings}
            onSound={playCue}
            onMissionComplete={handleMissionComplete}
            onMissionFailed={handleMissionFailed}
            onRetryMission={retryMission}
            onReturnToMenu={returnToMenu}
          />
        </div>
      )}

      {phase === GamePhase.MAIN_MENU && (
        <MainMenu
          missions={MISSIONS}
          selectedMissionId={selectedMissionId}
          progress={progress}
          onSelectMission={setSelectedMissionId}
          onStartMission={() => setPhase(GamePhase.BRIEFING)}
          onOpenSettings={() => openSettings(GamePhase.MAIN_MENU)}
          onResetProgress={resetProgress}
        />
      )}

      {phase === GamePhase.BRIEFING && <BriefingScreen mission={selectedMission} onLaunch={launchMission} onBack={() => setPhase(GamePhase.MAIN_MENU)} />}

      {phase === GamePhase.PAUSED && (
        <PauseMenu
          onResume={() => setPhase(GamePhase.IN_MISSION)}
          onRetry={retryMission}
          onOpenSettings={() => openSettings(GamePhase.PAUSED)}
          onReturnToMenu={returnToMenu}
        />
      )}

      {phase === GamePhase.SETTINGS && (
        <SettingsMenu settings={settings} onChange={setSettings} onBack={() => setPhase(settingsReturnPhase)} />
      )}
    </div>
  );
}
