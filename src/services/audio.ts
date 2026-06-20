/**
 * Simple, lightweight audio playback for sound effects
 * Uses pre-recorded files to avoid conflicts with background music
 */

// Module-level SFX volume state (persists across individual sound plays)
let sfxVolume = 0.7;
let sfxMuted = false;

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

/**
 * Play the cha-ching cash register sound
 * Used when bouquets are sold or orders are completed
 */
export function playChaChingSound() {
  try {
    const audio = new Audio('./sounds/cha-ching.mp3');
    audio.volume = sfxMuted ? 0 : sfxVolume;
    audio.play().catch((err) => {
      console.warn('Failed to play cha-ching sound:', err);
    });
  } catch (err) {
    console.warn('Failed to play cha-ching sound:', err);
  }
}

/**
 * Play a success/positive sound effect
 * Used for level ups, rewards, etc.
 */
export function playSuccessSound() {
  try {
    const audio = new Audio('./sounds/cha-ching.mp3');
    audio.volume = sfxMuted ? 0 : sfxVolume;
    audio.play().catch((err) => {
      console.warn('Failed to play success sound:', err);
    });
  } catch (err) {
    console.warn('Failed to play success sound:', err);
  }
}

/**
 * Play a notification/popup sound effect
 * Used when NPCs arrive, orders appear, etc.
 */
export function playNotificationSound() {
  try {
    const audio = new Audio('./sounds/cha-ching.mp3');
    audio.volume = sfxMuted ? 0 : sfxVolume;
    audio.play().catch((err) => {
      console.warn('Failed to play notification sound:', err);
    });
  } catch (err) {
    console.warn('Failed to play notification sound:', err);
  }
}
