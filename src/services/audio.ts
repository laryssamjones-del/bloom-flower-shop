/**
 * Simple, lightweight audio playback for sound effects
 * Uses pre-recorded files to avoid conflicts with background music
 * Handles mobile autoplay restrictions by allowing user interaction to enable audio
 */

// Module-level SFX volume state (persists across individual sound plays)
let sfxVolume = 0.7;
let sfxMuted = false;
let audioContextResumed = false;

// Initialize audio context on first user interaction (required on mobile)
function ensureAudioContextResumed() {
  if (!audioContextResumed) {
    // Try to resume audio context by creating and playing a silent sound
    try {
      const audio = new Audio();
      audio.volume = 0;
      audio.play().catch(() => {
        // Silent, ignore errors
      });
      audioContextResumed = true;
      console.log('✓ Audio context initialized');
    } catch (err) {
      // Ignore
    }
  }
}

// Listen for user interaction to enable audio on mobile
if (typeof document !== 'undefined') {
  const handleUserInteraction = () => {
    ensureAudioContextResumed();
    document.removeEventListener('click', handleUserInteraction);
    document.removeEventListener('touchstart', handleUserInteraction);
    document.removeEventListener('keydown', handleUserInteraction);
  };
  document.addEventListener('click', handleUserInteraction);
  document.addEventListener('touchstart', handleUserInteraction);
  document.addEventListener('keydown', handleUserInteraction);
}

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
 * Generic function to play any audio file with proper mobile autoplay handling
 */
export function playAudio(audioPath: string, volume: number = 0.5) {
  try {
    ensureAudioContextResumed();
    const audio = new Audio(audioPath);
    audio.volume = volume;
    audio.play().catch((err) => {
      console.warn(`Failed to play audio (${audioPath}):`, err);
    });
  } catch (err) {
    console.warn(`Failed to play audio (${audioPath}):`, err);
  }
}

/**
 * Play the cha-ching cash register sound
 * Used when bouquets are sold or orders are completed
 */
export function playChaChingSound() {
  try {
    ensureAudioContextResumed();
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
    ensureAudioContextResumed();
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
    ensureAudioContextResumed();
    const audio = new Audio('./sounds/cha-ching.mp3');
    audio.volume = sfxMuted ? 0 : sfxVolume;
    audio.play().catch((err) => {
      console.warn('Failed to play notification sound:', err);
    });
  } catch (err) {
    console.warn('Failed to play notification sound:', err);
  }
}
