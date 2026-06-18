import { useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore';

// Bell sound effect - using Web Audio API to generate a simple bell sound
const playBellSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Create oscillators for bell-like sound
    const now = audioContext.currentTime;

    // Main bell tone
    const osc1 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(800, now);
    osc1.frequency.exponentialRampToValueAtTime(400, now + 0.5);

    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    osc1.connect(gain1);
    gain1.connect(audioContext.destination);

    osc1.start(now);
    osc1.stop(now + 0.5);

    // Secondary tone for richness
    const osc2 = audioContext.createOscillator();
    const gain2 = audioContext.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1200, now);
    osc2.frequency.exponentialRampToValueAtTime(600, now + 0.5);

    gain2.gain.setValueAtTime(0.2, now);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    osc2.connect(gain2);
    gain2.connect(audioContext.destination);

    osc2.start(now);
    osc2.stop(now + 0.5);
  } catch (e) {
    console.log('Could not play bell sound:', e);
  }
};

export function NotificationBell() {
  const lastNotification = useGameStore((s) => s.lastNotification);
  const clearNotification = useGameStore((s) => s.clearNotification);

  useEffect(() => {
    if (!lastNotification) return;

    playBellSound();

    // Auto-clear after 3 seconds
    const timer = setTimeout(() => {
      clearNotification();
    }, 3000);

    return () => clearTimeout(timer);
  }, [lastNotification, clearNotification]);

  if (!lastNotification) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        animation: 'popInSubtle 0.3s ease-out',
      }}
    >
      <style>{`
        @keyframes popInSubtle {
          0% {
            opacity: 0;
            transform: translateX(-50%) translateY(-10px);
          }
          100% {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
      <div
        style={{
          padding: '10px 16px',
          background: '#FFF8DC',
          border: '2px solid #FFD700',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#2A1408',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          minWidth: '140px',
        }}
      >
        🔔 {lastNotification}
      </div>
    </div>
  );
}
