import { useState, useEffect } from 'react';
import { Bouquet } from '../../types';
import { useGameStore } from '../../stores/gameStore';

interface ShelfCheckoutDialogProps {
  npcImage: string;
  bouquet: Bouquet;
  onConfirm: () => void;
  onDecline: () => void;
}

type DialogPhase = 'asking' | 'confirming' | 'closing';

export function ShelfCheckoutDialog({
  npcImage,
  bouquet,
  onConfirm,
  onDecline,
}: ShelfCheckoutDialogProps) {
  const [phase, setPhase] = useState<DialogPhase>('asking');
  const npcConfig = useGameStore((s) => s.npcCustomizationConfig);

  // Auto-close when phase is 'closing' after a delay
  useEffect(() => {
    if (phase === 'closing') {
      const timer = setTimeout(() => {
        onConfirm();
      }, 1500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [phase, onConfirm]);

  const handleCheckoutClick = () => {
    setPhase('confirming');
  };

  const handleConfirmClick = () => {
    setPhase('closing');
  };

  const handleDeclareClick = () => {
    onDecline();
  };

  // NPC positioning (consistent with order NPCs)
  const npcHeight = npcConfig?.height || 420;
  const npcBottomOffset = npcConfig?.bottomOffset || 70;
  const npcRightOffset = npcConfig?.rightOffset || 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 5000,
      }}
    >
      {/* NPC positioned on right-bottom (same as order NPCs) */}
      <div
        style={{
          position: 'absolute',
          bottom: `${npcBottomOffset}px`,
          right: `${npcRightOffset}px`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          zIndex: 8,
          animation:
            phase === 'asking'
              ? 'npcSlideIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
              : phase === 'closing'
                ? 'npcSlideOut 0.5s ease-in'
                : 'none',
          opacity: phase === 'closing' ? 0 : 1,
          transition: 'opacity 0.5s ease-in',
          pointerEvents: 'none',
        }}
      >
        <img
          src={npcImage}
          alt="Customer"
          style={{
            height: `${npcHeight}px`,
            width: 'auto',
            objectFit: 'contain',
            filter: 'drop-shadow(-4px 0 8px rgba(0,0,0,0.25))',
            imageRendering: 'crisp-edges',
          }}
        />
      </div>

      {/* Dialog modal (compact, matching order NPC styling) */}
      <div
        style={{
          background: '#FFFDF5',
          border: '1.5px solid #E8C5A0',
          borderRadius: '14px',
          padding: '8px 11px',
          maxWidth: '200px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          animation:
            phase === 'asking'
              ? 'bubblePop 0.35s cubic-bezier(0.68, -0.55, 0.27, 1.55)'
              : 'none',
          opacity: phase === 'closing' ? 0 : 1,
          transition: 'opacity 0.5s ease-in',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        {/* Message text */}
        <div
          style={{
            fontSize: '12px',
            color: '#4A2C17',
            fontWeight: '500',
            lineHeight: 1.3,
          }}
        >
          {phase === 'asking' && "I'd like to buy this bouquet."}
          {phase === 'confirming' && `Sell for ${bouquet.sellPrice} 🌼?`}
          {phase === 'closing' && 'Thanks!'}
        </div>

        {/* Buttons (compact, matching order NPC buttons) */}
        {phase === 'asking' && (
          <div
            style={{
              display: 'flex',
              gap: '6px',
              justifyContent: 'center',
              marginTop: '4px',
            }}
          >
            <button
              onClick={handleDeclareClick}
              style={{
                background: '#F5E6D8',
                border: '1.5px solid #D4A57C',
                borderRadius: '18px',
                padding: '5px 11px',
                cursor: 'pointer',
                fontSize: '10px',
                fontWeight: 'bold',
                color: '#6A4C3A',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#E8D5C5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#F5E6D8';
              }}
            >
              Not now
            </button>
            <button
              onClick={handleCheckoutClick}
              style={{
                background: '#D4A574',
                border: '1.5px solid #C09840',
                borderRadius: '18px',
                padding: '5px 11px',
                cursor: 'pointer',
                fontSize: '10px',
                fontWeight: 'bold',
                color: '#FFF',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#C09840';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#D4A574';
              }}
            >
              Buy ✓
            </button>
          </div>
        )}

        {phase === 'confirming' && (
          <button
            onClick={handleConfirmClick}
            style={{
              background: '#D4A574',
              border: '1.5px solid #C09840',
              borderRadius: '18px',
              padding: '5px 11px',
              cursor: 'pointer',
              fontSize: '10px',
              fontWeight: 'bold',
              color: '#FFF',
              marginTop: '4px',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#C09840';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#D4A574';
            }}
          >
            Confirm
          </button>
        )}
      </div>
    </div>
  );
}
