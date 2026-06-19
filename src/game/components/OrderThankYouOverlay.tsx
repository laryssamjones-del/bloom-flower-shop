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

  const isLeaving = phase === 'leaving';

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        zIndex: 8,
        animation: isLeaving
          ? 'npcSlideOut 0.5s ease-in forwards'
          : 'npcSlideIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        pointerEvents: 'none',
      }}
    >
      {/* Chat bubble */}
      {phase !== 'entering' && (
        <div
          style={{
            marginRight: '90px',
            marginBottom: '6px',
            animation: 'bubblePop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
          }}
        >
          <div
            style={{
              background: '#FFFDF5',
              border: '1.5px solid #E8C5A0',
              borderRadius: '14px',
              padding: '8px 11px',
              maxWidth: '170px',
              fontSize: '12px',
              color: '#4A2C17',
              lineHeight: 1.3,
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div>Thanks! 💐</div>

            {/* Chat bubble tail pointing right-down */}
            <div
              style={{
                position: 'absolute',
                bottom: '-10px',
                right: '24px',
                width: 0,
                height: 0,
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: '10px solid #E8C5A0',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '-7px',
                right: '25px',
                width: 0,
                height: 0,
                borderLeft: '7px solid transparent',
                borderRight: '7px solid transparent',
                borderTop: '9px solid #FFFDF5',
              }}
            />
          </div>
        </div>
      )}

      {/* NPC character image */}
      <img
        src={customerImage}
        alt="Customer"
        style={{
          height: '420px',
          width: 'auto',
          objectFit: 'contain',
          filter: 'drop-shadow(-4px 0 8px rgba(0,0,0,0.25))',
          imageRendering: 'crisp-edges',
        }}
      />
    </div>
  );
}
