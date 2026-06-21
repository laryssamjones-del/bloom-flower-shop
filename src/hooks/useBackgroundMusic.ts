import { useEffect, useRef, useState } from 'react';

// Module-level flag to track if we've already set up the user interaction handler
let userInteractionHandlerSetUp = false;
let audioContextInitialized = false;

// Initialize audio context aggressively on page load
function initializeAudioContext() {
  if (!audioContextInitialized && typeof document !== 'undefined') {
    try {
      // Create and attempt to play a silent audio element to initialize audio context
      const silentAudio = new Audio();
      silentAudio.volume = 0;
      silentAudio.src = 'data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAAA=';
      silentAudio.play().catch(() => {
        // Silent, ignore errors
      });
      audioContextInitialized = true;
      console.log('✓ Audio context initialized');
    } catch (err) {
      // Ignore
    }
  }
}

// Initialize on module load
initializeAudioContext();

export function useBackgroundMusic(audioUrl: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [volume, setVolume] = useState(0.3);
  const [isMuted, setIsMuted] = useState(false);
  const previousVolumeRef = useRef(0.3);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      // Make sure audio context is initialized
      initializeAudioContext();

      const audio = new Audio(audioUrl);
      audio.loop = true;
      audio.volume = volume;
      audioRef.current = audio;

      // Aggressively try to start playing
      const playAttempt = audio.play();
      if (playAttempt !== undefined) {
        playAttempt
          .then(() => {
            console.log('✓ Background music started playing');
            setAutoplayBlocked(false);
          })
          .catch(() => {
            // Autoplay is blocked on mobile - will resume on user interaction
            console.log('Background music autoplay blocked (mobile). Will resume on user interaction.');
            setAutoplayBlocked(true);
          });
      }
    }

    return () => {
      // Don't stop music on unmount - let it continue across screens
    };
  }, [audioUrl, volume]);

  // Set up ONE-TIME user interaction handler to resume audio on mobile
  useEffect(() => {
    if (autoplayBlocked && !userInteractionHandlerSetUp) {
      const resumeAudio = () => {
        if (audioRef.current) {
          audioRef.current.play().then(() => {
            console.log('✓ Background music resumed after user interaction');
            setAutoplayBlocked(false);
          }).catch((err) => {
            console.warn('Failed to resume audio:', err);
          });
        }
        // Remove listeners after first successful interaction
        document.removeEventListener('click', resumeAudio);
        document.removeEventListener('touchstart', resumeAudio);
        document.removeEventListener('keydown', resumeAudio);
      };

      // Listen for any user interaction
      document.addEventListener('click', resumeAudio);
      document.addEventListener('touchstart', resumeAudio);
      document.addEventListener('keydown', resumeAudio);

      userInteractionHandlerSetUp = true;

      return () => {
        document.removeEventListener('click', resumeAudio);
        document.removeEventListener('touchstart', resumeAudio);
        document.removeEventListener('keydown', resumeAudio);
      };
    }
    return undefined;
  }, [autoplayBlocked]);

  // Update volume when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const toggleMute = () => {
    if (isMuted) {
      // Unmute - restore previous volume
      setIsMuted(false);
      setVolume(previousVolumeRef.current);
    } else {
      // Mute - save current volume and set to 0
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
