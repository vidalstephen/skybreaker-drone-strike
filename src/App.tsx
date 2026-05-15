/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import Game from './components/Game';
import {
  BriefingScreen,
  CareerScreen,
  ControlsScreen,
  CreditsScreen,
  LoadoutScreen,
  MainMenu,
  MissionSelectScreen,
  PauseMenu,
  SettingsMenu,
  SplashScreen,
} from './components/menus';
import {
  DEFAULT_APP_SETTINGS,
  DEFAULT_CAMPAIGN_PROGRESS,
  PROGRESS_STORAGE_KEY,
  SETTINGS_STORAGE_KEY,
} from './config/defaults';
import { DEFAULT_MISSION_ID, getMissionById, MISSIONS } from './config/missions';
import { useAudio } from './hooks/useAudio';
import { completeMission, isMissionUnlocked, normalizeCampaignProgress } from './systems/missionSystem';
import { GamePhase, type AppSettings, type CampaignProgress, type MissionCompletionResult, type WeaponId, type WeaponSlot } from './types/game';

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

function clampRange(value: unknown, fallback: number, min: number, max: number) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
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
    hudScale: clampRange(stored?.hudScale, DEFAULT_APP_SETTINGS.hudScale, 85, 115),
    touchControlsScale: clampRange(stored?.touchControlsScale, DEFAULT_APP_SETTINGS.touchControlsScale, 85, 125),
    screenShake: clampPercent(stored?.screenShake, DEFAULT_APP_SETTINGS.screenShake),
    pointerSensitivity: clampRange(stored?.pointerSensitivity, DEFAULT_APP_SETTINGS.pointerSensitivity, 60, 140),
    touchDragSensitivity: clampRange(stored?.touchDragSensitivity, DEFAULT_APP_SETTINGS.touchDragSensitivity, 60, 140),
    showTelemetry: typeof stored?.showTelemetry === 'boolean' ? stored.showTelemetry : DEFAULT_APP_SETTINGS.showTelemetry,
    menuMotion: typeof stored?.menuMotion === 'boolean' ? stored.menuMotion : DEFAULT_APP_SETTINGS.menuMotion,
  } satisfies AppSettings;
}

function loadStoredProgress() {
  const stored = loadStoredJson(PROGRESS_STORAGE_KEY) as Partial<CampaignProgress> | null;
  return normalizeCampaignProgress(stored, MISSIONS);
}

export default function App() {
  const [phase, setPhase] = useState(GamePhase.BOOT);
  const [settingsReturnPhase, setSettingsReturnPhase] = useState(GamePhase.MAIN_MENU);
  const [controlsReturnPhase, setControlsReturnPhase] = useState(GamePhase.MAIN_MENU);
  const [selectedMissionId, setSelectedMissionId] = useState(DEFAULT_MISSION_ID);
  const [missionRunId, setMissionRunId] = useState(0);
  const [settings, setSettings] = useState<AppSettings>(loadStoredSettings);
  const [progress, setProgress] = useState<CampaignProgress>(loadStoredProgress);
  // Portrait lock: true when width < height on a touch device
  const [showPortraitOverlay, setShowPortraitOverlay] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(pointer: coarse)').matches && window.innerWidth < window.innerHeight;
  });
  const selectedMission = getMissionById(selectedMissionId);
  const { playCue } = useAudio(settings, phase);

  // Attempt landscape orientation lock + track portrait state on touch devices
  useEffect(() => {
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
    if (!isTouchDevice) return;

    // Try native orientation lock (requires user gesture / PWA context)
    const orient = window.screen?.orientation as (ScreenOrientation & { lock?: (o: 'landscape' | 'portrait' | 'any' | 'natural' | 'portrait-primary' | 'portrait-secondary' | 'landscape-primary' | 'landscape-secondary') => Promise<void> }) | undefined;
    orient?.lock?.('landscape').catch(() => { /* not available in all browsers */ });

    const update = () => {
      setShowPortraitOverlay(window.innerWidth < window.innerHeight);
    };
    window.addEventListener('resize', update);
    window.screen.orientation?.addEventListener('change', update);
    return () => {
      window.removeEventListener('resize', update);
      window.screen.orientation?.removeEventListener('change', update);
    };
  }, []);

  const nextSortieMission = MISSIONS.find(mission => isMissionUnlocked(mission, progress) && !progress.completedMissionIds.includes(mission.id))
    ?? MISSIONS.find(mission => mission.id === selectedMissionId)
    ?? MISSIONS[0];

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

  const openBriefing = useCallback((missionId = selectedMission.id) => {
    const mission = getMissionById(missionId);
    if (!isMissionUnlocked(mission, progress)) return;
    playCue('ui');
    setSelectedMissionId(mission.id);
    setPhase(GamePhase.BRIEFING);
  }, [playCue, progress, selectedMission.id]);

  const continueSortie = useCallback(() => {
    openBriefing(nextSortieMission.id);
  }, [nextSortieMission.id, openBriefing]);

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

  const openControls = useCallback((returnPhase: GamePhase) => {
    playCue('ui');
    setControlsReturnPhase(returnPhase);
    setPhase(GamePhase.CONTROLS);
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

  /** Stage 7b: equip a weapon to a slot and persist via the progress state. */
  const handleEquipWeapon = useCallback((slot: WeaponSlot, weaponId: WeaponId) => {
    playCue('ui');
    setProgress(current => ({
      ...current,
      inventory: {
        ...current.inventory!,
        equippedWeaponIds: {
          ...current.inventory?.equippedWeaponIds,
          [slot]: weaponId,
        },
      },
    }));
  }, [playCue]);

  const gamePhase = (phase === GamePhase.SETTINGS && settingsReturnPhase === GamePhase.PAUSED) || (phase === GamePhase.CONTROLS && controlsReturnPhase === GamePhase.PAUSED) ? GamePhase.PAUSED : phase;
  const shouldRenderGame = gamePhase === GamePhase.IN_MISSION || gamePhase === GamePhase.PAUSED || gamePhase === GamePhase.DEBRIEF;

  return (
    <div className="w-full h-screen bg-black">
      {/* Portrait orientation overlay — shown on touch devices when height > width */}
      {showPortraitOverlay && (
        <div className="absolute inset-0 z-[200] bg-[#030303] flex flex-col items-center justify-center gap-6 p-8 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(249,115,22,0.12),transparent_60%)]" />
          <div className="absolute inset-x-0 top-0 h-px bg-orange-500/50" />
          <div className="relative z-10 flex flex-col items-center gap-5 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400 animate-[spin_2s_ease-in-out_infinite]" style={{animationName:'none',transform:'rotate(90deg)'}}>
              <rect x="5" y="2" width="14" height="20" rx="2" /><path d="M12 18h.01"/>
            </svg>
            <div className="text-[9px] font-mono uppercase tracking-[0.4em] text-orange-400">Skybreaker Drone Strike</div>
            <div className="text-xl font-black uppercase tracking-[0.18em]">Rotate Device</div>
            <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/45">Landscape mode required</div>
          </div>
        </div>
      )}
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

      {phase === GamePhase.BOOT && <SplashScreen motionEnabled={settings.menuMotion} onComplete={() => setPhase(GamePhase.MAIN_MENU)} />}

      {phase === GamePhase.MAIN_MENU && (
        <MainMenu
          missions={MISSIONS}
          nextMissionId={nextSortieMission.id}
          progress={progress}
          onContinue={continueSortie}
          onOpenCampaign={() => setPhase(GamePhase.MISSION_SELECT)}
          onOpenLoadout={() => setPhase(GamePhase.LOADOUT)}
          onOpenCareer={() => setPhase(GamePhase.CAREER)}
          onOpenSettings={() => openSettings(GamePhase.MAIN_MENU)}
          onOpenControls={() => openControls(GamePhase.MAIN_MENU)}
          onOpenCredits={() => setPhase(GamePhase.CREDITS)}
          onResetProgress={resetProgress}
        />
      )}

      {phase === GamePhase.MISSION_SELECT && (
        <MissionSelectScreen
          missions={MISSIONS}
          selectedMissionId={selectedMissionId}
          progress={progress}
          onSelectMission={setSelectedMissionId}
          onStartMission={() => openBriefing(selectedMissionId)}
          onBack={() => setPhase(GamePhase.MAIN_MENU)}
        />
      )}

      {phase === GamePhase.BRIEFING && <BriefingScreen mission={selectedMission} onContinue={launchMission} onLoadout={() => setPhase(GamePhase.LOADOUT)} onBack={() => setPhase(GamePhase.MISSION_SELECT)} />}

      {phase === GamePhase.LOADOUT && <LoadoutScreen mission={selectedMission} progress={progress} onLaunch={launchMission} onBack={() => setPhase(GamePhase.BRIEFING)} onEquipWeapon={handleEquipWeapon} />}

      {phase === GamePhase.CAREER && <CareerScreen missions={MISSIONS} progress={progress} onBack={() => setPhase(GamePhase.MAIN_MENU)} />}

      {phase === GamePhase.CONTROLS && <ControlsScreen onBack={() => setPhase(controlsReturnPhase)} />}

      {phase === GamePhase.CREDITS && <CreditsScreen onBack={() => setPhase(GamePhase.MAIN_MENU)} />}

      {phase === GamePhase.PAUSED && (
        <PauseMenu
          mission={selectedMission}
          onResume={() => setPhase(GamePhase.IN_MISSION)}
          onRetry={retryMission}
          onOpenSettings={() => openSettings(GamePhase.PAUSED)}
          onOpenControls={() => openControls(GamePhase.PAUSED)}
          onReturnToMenu={returnToMenu}
        />
      )}

      {phase === GamePhase.SETTINGS && (
        <SettingsMenu settings={settings} onChange={setSettings} onBack={() => setPhase(settingsReturnPhase)} />
      )}
    </div>
  );
}
