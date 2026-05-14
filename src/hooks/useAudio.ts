import { useCallback, useEffect, useRef } from 'react';
import { GamePhase, type AppSettings } from '../types/game';

export type AudioCue = 'ui' | 'primary-fire' | 'secondary-fire' | 'hit' | 'damage' | 'success' | 'failure' | 'component-break' | 'phase-change' | 'set-piece-destroyed';

type AudioNodes = {
  context: AudioContext;
  master: GainNode;
  music: GainNode;
  sfx: GainNode;
  lowDrone?: OscillatorNode;
  highDrone?: OscillatorNode;
  musicFilter?: BiquadFilterNode;
};

function getAudioContextConstructor() {
  return window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
}

function volume(value: number) {
  return Math.max(0, Math.min(1, value / 100));
}

function cueProfile(cue: AudioCue) {
  switch (cue) {
    case 'primary-fire':
      return { frequency: 420, endFrequency: 160, duration: 0.09, type: 'square' as OscillatorType, gain: 0.08 };
    case 'secondary-fire':
      return { frequency: 150, endFrequency: 70, duration: 0.24, type: 'sawtooth' as OscillatorType, gain: 0.13 };
    case 'hit':
      return { frequency: 260, endFrequency: 520, duration: 0.12, type: 'triangle' as OscillatorType, gain: 0.08 };
    case 'damage':
      return { frequency: 95, endFrequency: 48, duration: 0.18, type: 'sawtooth' as OscillatorType, gain: 0.12 };
    case 'component-break':
      return { frequency: 520, endFrequency: 180, duration: 0.16, type: 'square' as OscillatorType, gain: 0.075 };
    case 'phase-change':
      return { frequency: 190, endFrequency: 470, duration: 0.28, type: 'triangle' as OscillatorType, gain: 0.085 };
    case 'set-piece-destroyed':
      return { frequency: 120, endFrequency: 44, duration: 0.42, type: 'sawtooth' as OscillatorType, gain: 0.13 };
    case 'success':
      return { frequency: 360, endFrequency: 720, duration: 0.35, type: 'triangle' as OscillatorType, gain: 0.09 };
    case 'failure':
      return { frequency: 180, endFrequency: 55, duration: 0.45, type: 'sawtooth' as OscillatorType, gain: 0.1 };
    case 'ui':
    default:
      return { frequency: 520, endFrequency: 680, duration: 0.06, type: 'triangle' as OscillatorType, gain: 0.045 };
  }
}

function musicGainForPhase(phase: GamePhase) {
  if (phase === GamePhase.IN_MISSION) return 0.18;
  if (
    phase === GamePhase.BOOT ||
    phase === GamePhase.MAIN_MENU ||
    phase === GamePhase.MISSION_SELECT ||
    phase === GamePhase.BRIEFING ||
    phase === GamePhase.LOADOUT ||
    phase === GamePhase.CAREER ||
    phase === GamePhase.CONTROLS ||
    phase === GamePhase.CREDITS ||
    phase === GamePhase.SETTINGS
  ) return 0.1;
  if (phase === GamePhase.PAUSED) return 0.06;
  return 0.0;
}

export function useAudio(settings: AppSettings, phase: GamePhase) {
  const nodesRef = useRef<AudioNodes | null>(null);
  const phaseRef = useRef(phase);
  const settingsRef = useRef(settings);

  const applyMix = useCallback(() => {
    const nodes = nodesRef.current;
    if (!nodes) return;

    const now = nodes.context.currentTime;
    nodes.master.gain.setTargetAtTime(volume(settingsRef.current.masterVolume), now, 0.04);
    nodes.music.gain.setTargetAtTime(volume(settingsRef.current.musicVolume) * musicGainForPhase(phaseRef.current), now, 0.18);
    nodes.sfx.gain.setTargetAtTime(volume(settingsRef.current.sfxVolume), now, 0.04);
    nodes.musicFilter?.frequency.setTargetAtTime(phaseRef.current === GamePhase.IN_MISSION ? 780 : 420, now, 0.2);
  }, []);

  const ensureAudio = useCallback(() => {
    if (nodesRef.current) {
      if (nodesRef.current.context.state === 'suspended') void nodesRef.current.context.resume();
      return nodesRef.current;
    }

    const AudioContextConstructor = getAudioContextConstructor();
    if (!AudioContextConstructor) return null;

    const context = new AudioContextConstructor();
    const master = context.createGain();
    const music = context.createGain();
    const sfx = context.createGain();
    const musicFilter = context.createBiquadFilter();

    master.gain.value = volume(settingsRef.current.masterVolume);
    music.gain.value = 0;
    sfx.gain.value = volume(settingsRef.current.sfxVolume);
    musicFilter.type = 'lowpass';
    musicFilter.frequency.value = 420;

    music.connect(musicFilter);
    musicFilter.connect(master);
    sfx.connect(master);
    master.connect(context.destination);

    const lowDrone = context.createOscillator();
    lowDrone.type = 'sine';
    lowDrone.frequency.value = 46;
    lowDrone.connect(music);
    lowDrone.start();

    const highDrone = context.createOscillator();
    highDrone.type = 'triangle';
    highDrone.frequency.value = 92;
    highDrone.detune.value = -8;
    highDrone.connect(music);
    highDrone.start();

    nodesRef.current = { context, master, music, sfx, lowDrone, highDrone, musicFilter };
    applyMix();
    return nodesRef.current;
  }, [applyMix]);

  useEffect(() => {
    phaseRef.current = phase;
    settingsRef.current = settings;
    applyMix();
  }, [applyMix, phase, settings]);

  useEffect(() => {
    const unlock = () => ensureAudio();
    window.addEventListener('pointerdown', unlock, { once: true, passive: true });
    window.addEventListener('keydown', unlock, { once: true });

    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [ensureAudio]);

  useEffect(() => () => {
    const nodes = nodesRef.current;
    nodes?.lowDrone?.stop();
    nodes?.highDrone?.stop();
    void nodes?.context.close();
  }, []);

  const playCue = useCallback((cue: AudioCue) => {
    const nodes = ensureAudio();
    if (!nodes || volume(settingsRef.current.masterVolume) === 0 || volume(settingsRef.current.sfxVolume) === 0) return;

    const profile = cueProfile(cue);
    const now = nodes.context.currentTime;
    const oscillator = nodes.context.createOscillator();
    const gain = nodes.context.createGain();

    oscillator.type = profile.type;
    oscillator.frequency.setValueAtTime(profile.frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, profile.endFrequency), now + profile.duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(profile.gain, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + profile.duration);

    oscillator.connect(gain);
    gain.connect(nodes.sfx);
    oscillator.start(now);
    oscillator.stop(now + profile.duration + 0.03);
  }, [ensureAudio]);

  return { playCue };
}
