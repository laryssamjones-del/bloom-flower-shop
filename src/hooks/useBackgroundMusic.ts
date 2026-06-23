/**
 * Background music — single shared audio engine.
 *
 * The audio element lives at module scope (a singleton) so there is exactly ONE
 * music track no matter how many times a screen mounts/unmounts. This is what
 * lets the Settings volume/mute controls reliably reach the audible track, and
 * lets the game stop the music when the player leaves (see
 * {@link pauseBackgroundMusic} wired into the SDK lifecycle hooks).
 *
 * The music file is imported so the bundler resolves the correct URL in both dev
 * and deployed builds. Playback can only begin after the player's first
 * tap/click — browser autoplay rule.
 */
import { useEffect, useState } from 'react';
import musicUrl from '../audio/petals-on-repeat.mp3';

// --- Module-level singleton state ---
let audioEl: HTMLAudioElement | null = null;
let currentVolume = 0.3;
let currentMuted = false;
let hasStarted = false; // true once the first user interaction has kicked off playback
let listenersArmed = false;

// React components subscribe so they can re-render when state changes elsewhere.
const subscribers = new Set<() => void>();
function notify() {
  subscribers.forEach((cb) => cb());
}

function ensureAudio(): HTMLAudioElement {
  if (!audioEl) {
    audioEl = new Audio(musicUrl);
    audioEl.loop = true;
    audioEl.preload = 'auto';
    audioEl.volume = currentMuted ? 0 : currentVolume;
  }
  return audioEl;
}

function applyVolume() {
  if (audioEl) audioEl.volume = currentMuted ? 0 : currentVolume;
}

/** Set music volume (0–1). Takes effect immediately on the live track. */
export function setMusicVolume(v: number) {
  currentVolume = Math.max(0, Math.min(1, v));
  applyVolume();
  notify();
}

export function getMusicVolume(): number {
  return currentVolume;
}

/** Mute/unmute the music. Muting drops volume to 0; unmuting restores it. */
export function setMusicMuted(muted: boolean) {
  currentMuted = muted;
  applyVolume();
  notify();
}

export function getMusicMuted(): boolean {
  return currentMuted;
}

/** Stop playback entirely — call when the player leaves the game. */
export function pauseBackgroundMusic() {
  if (audioEl) audioEl.pause();
}

/** Resume playback if the player had started it (and it isn't paused for mute). */
export function resumeBackgroundMusic() {
  if (hasStarted && audioEl) {
    applyVolume();
    audioEl.play().catch(() => {});
  }
}

function startOnInteraction() {
  hasStarted = true;
  const audio = ensureAudio();
  applyVolume();
  // IMPORTANT (iOS): play() must be called synchronously in the interaction
  // handler — no await before it.
  audio.play().catch(() => {});
}

function armListeners() {
  if (listenersArmed || typeof window === 'undefined') return;
  listenersArmed = true;

  const onInteraction = () => {
    window.removeEventListener('pointerdown', onInteraction);
    window.removeEventListener('keydown', onInteraction);
    window.removeEventListener('touchstart', onInteraction);
    startOnInteraction();
  };
  window.addEventListener('pointerdown', onInteraction);
  window.addEventListener('keydown', onInteraction);
  window.addEventListener('touchstart', onInteraction);

  // Safety net: stop music if the page/iframe is hidden or torn down (e.g. the
  // player navigates back to the Run.Game menu). The SDK lifecycle hooks are the
  // primary signal (see BloommyGame.tsx); these cover browser-driven cases.
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        pauseBackgroundMusic();
      } else {
        resumeBackgroundMusic();
      }
    });
  }
  window.addEventListener('pagehide', pauseBackgroundMusic);
}

// Create the element and arm listeners as soon as the module loads.
ensureAudio();
armListeners();

/**
 * Hook wrapper kept for backwards compatibility. Returns the current music
 * state and the shared control functions, and re-renders the caller when the
 * state changes from anywhere (Settings, lifecycle hooks, etc.).
 */
export function useBackgroundMusic(_audioUrl?: string) {
  const [, forceRender] = useState(0);

  useEffect(() => {
    const cb = () => forceRender((n) => n + 1);
    subscribers.add(cb);
    return () => {
      subscribers.delete(cb);
    };
  }, []);

  return {
    audio: audioEl,
    volume: currentVolume,
    setVolume: setMusicVolume,
    isMuted: currentMuted,
    toggleMute: () => setMusicMuted(!currentMuted),
  };
}
