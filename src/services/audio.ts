/**
 * Simple, lightweight audio playback for sound effects
 * Uses pre-recorded files to avoid conflicts with background music
 */

/**
 * Play the cha-ching cash register sound
 * Used when bouquets are sold or orders are completed
 */
export function playChaChingSound() {
  try {
    const audio = new Audio('./sounds/cha-ching.mp3');
    audio.volume = 0.7;
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
    audio.volume = 0.7;
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
    audio.volume = 0.6;
    audio.play().catch((err) => {
      console.warn('Failed to play notification sound:', err);
    });
  } catch (err) {
    console.warn('Failed to play notification sound:', err);
  }
}
