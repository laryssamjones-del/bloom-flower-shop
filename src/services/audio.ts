import RundotGameAPI from '@series-inc/rundot-game-sdk/api';

// Cache for generated sounds to avoid regenerating on every play
const audioCache: Record<string, string> = {};

/**
 * Generate and play a cha-ching sound effect
 * Uses audio generation on first call, then caches the result
 */
export async function playChaChingSound() {
  try {
    // Check if we already have a cached cha-ching sound
    if (!audioCache['cha-ching']) {
      // Generate the sound effect
      const result = await RundotGameAPI.audioGen.generate({
        type: 'sfx',
        description: 'Cheerful cha-ching cash register sound, coins dropping in, bright and happy',
        durationSec: 0.8,
        clientRef: 'cha-ching-sfx',
      });

      audioCache['cha-ching'] = result.audioUrl;
    }

    // Play the cached sound
    const audio = new Audio(audioCache['cha-ching']);
    audio.volume = 0.7; // Set volume to 70% to not be too loud
    audio.play().catch((err) => {
      console.warn('Failed to play cha-ching sound:', err);
    });
  } catch (err) {
    console.warn('Failed to generate or play cha-ching sound:', err);
    // Silently fail - don't disrupt gameplay if audio fails
  }
}

/**
 * Play a success/positive sound effect
 * Used for level ups, rewards, etc.
 */
export async function playSuccessSound() {
  try {
    if (!audioCache['success']) {
      const result = await RundotGameAPI.audioGen.generate({
        type: 'sfx',
        description: 'Bright, cheerful success sound with ascending notes, positive and uplifting',
        durationSec: 0.6,
        clientRef: 'success-sfx',
      });

      audioCache['success'] = result.audioUrl;
    }

    const audio = new Audio(audioCache['success']);
    audio.volume = 0.7;
    audio.play().catch((err) => {
      console.warn('Failed to play success sound:', err);
    });
  } catch (err) {
    console.warn('Failed to generate or play success sound:', err);
  }
}

/**
 * Play a notification/popup sound effect
 * Used when NPCs arrive, orders appear, etc.
 */
export async function playNotificationSound() {
  try {
    if (!audioCache['notification']) {
      const result = await RundotGameAPI.audioGen.generate({
        type: 'sfx',
        description: 'Gentle ding or bell sound, soft and pleasant, notification-style',
        durationSec: 0.4,
        clientRef: 'notification-sfx',
      });

      audioCache['notification'] = result.audioUrl;
    }

    const audio = new Audio(audioCache['notification']);
    audio.volume = 0.6;
    audio.play().catch((err) => {
      console.warn('Failed to play notification sound:', err);
    });
  } catch (err) {
    console.warn('Failed to generate or play notification sound:', err);
  }
}
