/**
 * Audio service for sound effects and music.
 * Files are imported so the bundler resolves correct URLs in both dev and production.
 * Audio only starts after the player's first tap/click (browser autoplay rule).
 */

import chaChingUrl from '../audio/cha-ching.mp3';
import doorBellUrl from '../audio/shop-door-bell.mp3';

// --- SFX volume state ---
let sfxVolume = 0.7;
let sfxMuted = false;

// --- Pre-created Audio elements (one per sound so they don't fight each other) ---
const sfxChaChingEl = new Audio(chaChingUrl);
const sfxDoorBellEl = new Audio(doorBellUrl);
[sfxChaChingEl, sfxDoorBellEl].forEach((s) => {
  s.preload = 'auto';
});

// --- User interaction tracking ---
let userHasInteracted = false;

function playSfxEl(el: HTMLAudioElement, volume: number) {
  if (sfxMuted) return;
  el.volume = Math.max(0, Math.min(1, volume));
  el.currentTime = 0;
  el.play().catch(() => {});
}

// Arm auto-start: audio can only begin after a user gesture on mobile/modern browsers
if (typeof window !== 'undefined') {
  const onInteraction = () => {
    userHasInteracted = true;
    window.removeEventListener('pointerdown', onInteraction);
    window.removeEventListener('keydown', onInteraction);
    window.removeEventListener('touchstart', onInteraction);
  };
  window.addEventListener('pointerdown', onInteraction);
  window.addEventListener('keydown', onInteraction);
  window.addEventListener('touchstart', onInteraction);
}

// --- Public volume controls ---
export function setSFXVolume(volume: number) {
  sfxVolume = Math.max(0, Math.min(1, volume));
}

export function getSFXVolume(): number {
  return sfxVolume;
}

export function setSFXMuted(muted: boolean) {
  sfxMuted = muted;
}

export function isSFXMuted(): boolean {
  return sfxMuted;
}

// --- Sound effect exports ---

/** Play the cha-ching cash register sound */
export function playChaChingSound() {
  if (!userHasInteracted) return;
  playSfxEl(sfxChaChingEl, sfxVolume);
}

/** Play the shop door bell (customer arrives) */
export function playDoorBellSound() {
  if (!userHasInteracted) return;
  playSfxEl(sfxDoorBellEl, sfxVolume);
}

/** Play a success/positive sound effect */
export function playSuccessSound() {
  playChaChingSound();
}

/** Play a notification/popup sound effect */
export function playNotificationSound() {
  playDoorBellSound();
}

/**
 * Generic audio playback — kept for backwards compatibility.
 * Prefer the specific named functions above.
 */
export function playAudio(_audioPath: string, _volume: number = 0.5) {
  // No-op: callers have been updated to use named functions.
  // Kept so old imports don't break during the transition.
}
