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
      {/* NPC positioned on left-bottom (consistent with order NPCs) */}
      <div
        style={{
          position: 'fixed',
          bottom: `${npcBottomOffset}px`,
          right: `${npcRightOffset}px`,
          height: `${npcHeight}px`,
          width: 'auto',
          animation:
            phase === 'asking'
              ? 'npcSlideIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
              : phase === 'closing'
                ? 'npcSlideOut 0.5s ease-in'
                : 'none',
          opacity: phase === 'closing' ? 0 : 1,
          transition: 'opacity 0.5s ease-in',
        }}
      >
        <img
          src={npcImage}
          alt="Customer"
          style={{
            height: '100%',
            objectFit: 'contain',
          }}
        />
      </div>

      {/* Dialog modal (centered) */}
      <div
        style={{
          background: '#F5F1E8',
          border: '3px solid #D4A574',
          borderRadius: '12px',
          padding: '24px 20px',
          maxWidth: '320px',
          width: '90%',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          animation:
            phase === 'asking'
              ? 'bubblePop 0.35s cubic-bezier(0.68, -0.55, 0.27, 1.55)'
              : 'none',
          opacity: phase === 'closing' ? 0 : 1,
          transition: 'opacity 0.5s ease-in',
        }}
      >
        {/* Chat bubble message */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.8)',
            border: '2px solid #D4A574',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '16px',
            fontSize: '14px',
            color: '#333',
            fontWeight: '500',
          }}
        >
          {phase === 'asking' && "I'd like to buy this bouquet."}
          {phase === 'confirming' && `I'd like to buy this bouquet.`}
          {phase === 'closing' && 'Thanks!'}
        </div>

        {/* Bouquet preview */}
        {(phase === 'asking' || phase === 'confirming') && (
          <div
            style={{
              marginBottom: '16px',
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.4)',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {bouquet.thumbnailUrl ? (
              <img
                src={bouquet.thumbnailUrl}
                alt={bouquet.recipeName || 'Bouquet'}
                style={{
                  width: '80px',
                  height: '80px',
                  objectFit: 'contain',
                }}
              />
            ) : (
              <div style={{ fontSize: '48px' }}>💐</div>
            )}
            <div style={{ fontSize: '12px', color: '#666', fontWeight: 'bold' }}>
              {bouquet.recipeName || 'Custom Bouquet'}
            </div>
            <div style={{ fontSize: '13px', color: '#6A9A50', fontWeight: 'bold' }}>
              {bouquet.sellPrice} 🌼
            </div>
          </div>
        )}

        {/* Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            flexDirection: 'column',
          }}
        >
          {phase === 'asking' && (
            <>
              <button
                onClick={handleDeclareClick}
                style={{
                  padding: '12px 16px',
                  background: 'transparent',
                  border: '2px solid #D4A574',
                  color: '#D4A574',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#D4A574';
                  e.currentTarget.style.color = '#FFF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#D4A574';
                }}
              >
                Come back later
              </button>
              <button
                onClick={handleCheckoutClick}
                style={{
                  padding: '12px 16px',
                  background: '#6A9A50',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#5A8A40';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#6A9A50';
                }}
              >
                Checkout
              </button>
            </>
          )}

          {phase === 'confirming' && (
            <button
              onClick={handleConfirmClick}
              style={{
                padding: '14px 16px',
                background: '#6A9A50',
                color: '#FFF',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 'bold',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#5A8A40';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#6A9A50';
              }}
            >
              Sell {bouquet.recipeName || 'Bouquet'} for {bouquet.sellPrice} 🌼
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
