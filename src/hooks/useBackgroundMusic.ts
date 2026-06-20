import { useEffect, useRef, useState } from 'react';

export function useBackgroundMusic(audioUrl: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [volume, setVolume] = useState(0.3);
  const [isMuted, setIsMuted] = useState(false);
  const previousVolumeRef = useRef(0.3);

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio(audioUrl);
      audio.loop = true;
      audio.volume = volume;
      audioRef.current = audio;

      // Start playing
      audio.play().catch(() => {
        // Autoplay might be blocked - this is fine, will play on user interaction
        console.log('Background music autoplay prevented (user interaction required)');
      });
    }

    return () => {
      // Don't stop music on unmount - let it continue across screens
    };
  }, [audioUrl]);

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
