/**
 * Background music hook.
 * The music file is imported so the bundler resolves the correct URL in both
 * dev and deployed builds (avoids 404s from hardcoded absolute paths).
 * Music only starts after the player's first tap/click — browser autoplay rule.
 */
import { useEffect, useRef, useState } from 'react';
import musicUrl from '../audio/petals-on-repeat.mp3';

// Module-level flag so the interaction listener is only registered once
let interactionListenerSetUp = false;

// Callbacks registered by hook instances waiting for the first interaction
const onInteractionCallbacks: Array<() => void> = [];

// Module-level audio element reference so lifecycle handlers can control it
let globalAudioElement: HTMLAudioElement | null = null;

export function pauseBackgroundMusic() {
  if (globalAudioElement) {
    globalAudioElement.pause();
  }
}

export function resumeBackgroundMusic() {
  if (globalAudioElement) {
    globalAudioElement.play().catch(() => {});
  }
}

function armInteractionListeners() {
  if (interactionListenerSetUp || typeof window === 'undefined') return;
  interactionListenerSetUp = true;

  const onInteraction = () => {
    window.removeEventListener('pointerdown', onInteraction);
    window.removeEventListener('keydown', onInteraction);
    window.removeEventListener('touchstart', onInteraction);
    // Fire all waiting callbacks
    onInteractionCallbacks.forEach((cb) => cb());
    onInteractionCallbacks.length = 0;
  };

  window.addEventListener('pointerdown', onInteraction);
  window.addEventListener('keydown', onInteraction);
  window.addEventListener('touchstart', onInteraction);
}

// The hook still accepts an optional URL parameter so existing callers continue
// to work, but it defaults to the bundled music file.
export function useBackgroundMusic(_audioUrl?: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [volume, setVolume] = useState(0.3);
  const [isMuted, setIsMuted] = useState(false);
  const previousVolumeRef = useRef(0.3);

  // Create the audio element once
  useEffect(() => {
    if (audioRef.current) return;

    const audio = new Audio(musicUrl);
    audio.loop = true;
    audio.volume = volume;
    audio.preload = 'auto';
    audioRef.current = audio;
    globalAudioElement = audio;

    // Start playing as soon as the user first interacts
    const startMusic = () => {
      // IMPORTANT (iOS): play() must be called synchronously in the interaction
      // handler — no await before it.
      audio.play().catch(() => {});
    };

    armInteractionListeners();
    onInteractionCallbacks.push(startMusic);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep volume in sync
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      setVolume(previousVolumeRef.current);
    } else {
      previousVolumeRef.current = volume;
      setIsMuted(true);
    }
  };

  return {
    audio: audioRef.current,
    volume,
    setVolume,
    isMuted,
    toggleMute,
  };
}
