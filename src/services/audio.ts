/**
 * Simple, lightweight audio playback for sound effects
 * Uses pre-recorded files to avoid conflicts with background music
 * Handles mobile autoplay restrictions by initializing audio context immediately
 */

// Module-level SFX volume state (persists across individual sound plays)
let sfxVolume = 0.7;
let sfxMuted = false;
let audioContextInitialized = false;

// Initialize audio context immediately on page load
function initializeAudioContext() {
  if (!audioContextInitialized) {
    try {
      // Create and play a completely silent audio element to prime the audio context
      const silentAudio = new Audio();
      silentAudio.volume = 0;
      // Minimal WAV file (1ms of silence)
      silentAudio.src = 'data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAAA=';
      const playAttempt = silentAudio.play();
      if (playAttempt !== undefined) {
        playAttempt.catch(() => {
          // Ignore errors - this is just to initialize the context
        });
      }
      audioContextInitialized = true;
      console.log('✓ Audio context initialized on page load');
    } catch (err) {
      // Ignore errors
    }
  }
}

// Initialize audio context immediately on module load
initializeAudioContext();

// Also listen for user interaction to ensure audio is enabled on mobile
if (typeof document !== 'undefined') {
  const handleUserInteraction = () => {
    initializeAudioContext();
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
    initializeAudioContext();
    const audio = new Audio(audioPath);
    audio.volume = sfxMuted ? 0 : volume;
    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous';

    // Try to play immediately
    const attemptPlay = () => {
      audio.play().catch((err) => {
        console.warn(`Failed to play audio (${audioPath}):`, err);
      });
    };

    // If audio is already loading/loaded, play immediately
    if (audio.readyState >= 2) {
      attemptPlay();
    } else {
      // Wait for audio to be ready, then play
      audio.addEventListener('canplay', attemptPlay, { once: true });
      // Fallback: try after short delay
      setTimeout(attemptPlay, 300);
    }
  } catch (err) {
    console.warn(`Failed to play audio (${audioPath}):`, err);
  }
}

/**
 * Play the cha-ching cash register sound
 * Used when bouquets are sold or orders are completed
 */
export function playChaChingSound() {
  playAudio('/sounds/cha-ching.mp3', sfxVolume);
}

/**
 * Play a success/positive sound effect
 * Used for level ups, rewards, etc.
 */
export function playSuccessSound() {
  playAudio('/sounds/cha-ching.mp3', sfxVolume);
}

/**
 * Play a notification/popup sound effect
 * Used when NPCs arrive, orders appear, etc.
 */
export function playNotificationSound() {
  playAudio('/sounds/cha-ching.mp3', sfxVolume);
}
