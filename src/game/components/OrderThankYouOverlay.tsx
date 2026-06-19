import { useEffect, useState } from 'react';

interface OrderThankYouOverlayProps {
  customerImage: string;
  onComplete: () => void;
}

export function OrderThankYouOverlay({ customerImage, onComplete }: OrderThankYouOverlayProps) {
  const [phase, setPhase] = useState<'entering' | 'visible' | 'leaving'>('entering');

  // Entering animation: 0.6s
  useEffect(() => {
    const t = setTimeout(() => setPhase('visible'), 600);
    return () => clearTimeout(t);
  }, []);

  // Visible phase: 2s, then leaving
  useEffect(() => {
    if (phase === 'visible') {
      const t = setTimeout(() => setPhase('leaving'), 2000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [phase]);

  // Leaving animation: 0.6s, then complete
  useEffect(() => {
    if (phase === 'leaving') {
      const t = setTimeout(() => onComplete(), 600);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [phase, onComplete]);

  const getTransform = () => {
    if (phase === 'entering') return 'translateX(120%)';
    if (phase === 'leaving') return 'translateX(120%)';
    return 'translateX(0)';
  };

  const getOpacity = () => {
    if (phase === 'visible') return 1;
    return 0.8;
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          transform: getTransform(),
          opacity: getOpacity(),
          transition: phase === 'entering' ? 'none' : 'transform 0.6s ease-in-out, opacity 0.6s ease-in-out',
        }}
      >
        <img
          src={customerImage}
          alt="Customer"
          style={{
            width: '140px',
            height: '140px',
            objectFit: 'contain',
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))',
          }}
        />
        <div
          style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#333',
            textShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          Thanks! 💐
        </div>
      </div>
    </div>
  );
}
