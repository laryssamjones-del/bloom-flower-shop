import { useEffect, useRef } from 'react';

export function useBackgroundMusic(audioUrl: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element if it doesn't exist
    if (!audioRef.current) {
      const audio = new Audio(audioUrl);
      audio.loop = true;
      audio.volume = 0.3; // Set volume to 30% to not be overwhelming
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

  return audioRef.current;
}
