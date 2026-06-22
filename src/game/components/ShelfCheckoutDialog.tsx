import { useState, useEffect, useRef } from 'react';
import { Bouquet } from '../../types';
import { useGameStore } from '../../stores/gameStore';
import { playDoorBellSound } from '../../services/audio';
import { loadShelfNPCCustomizationConfig } from './ShelfNPCCustomizer';

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
  const [timeRemaining, setTimeRemaining] = useState(15);
  const [isExplicitConfirm, setIsExplicitConfirm] = useState(false);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const storedShelfNPCConfig = useGameStore((s) => s.shelfNPCCustomizationConfig);
  const npcConfig = storedShelfNPCConfig || loadShelfNPCCustomizationConfig();

  // Play door bell sound when NPC arrives
  useEffect(() => {
    playDoorBellSound();
  }, []);

  // Handle 15-second countdown and auto-dismiss
  useEffect(() => {
    if (phase === 'asking') {
      countdownIntervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Time's up - auto-dismiss
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            setPhase('closing');
            if (autoTimeoutRef.current) clearTimeout(autoTimeoutRef.current);
            autoTimeoutRef.current = setTimeout(() => onDecline(), 500);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      };
    }
    return undefined;
  }, [phase, onDecline]);

  // Auto-close when phase is 'closing' after a delay
  useEffect(() => {
    if (phase === 'closing' && isExplicitConfirm) {
      const timer = setTimeout(() => {
        onConfirm();
      }, 1500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [phase, isExplicitConfirm, onConfirm]);

  const handleCheckoutClick = () => {
    setPhase('confirming');
  };

  const handleConfirmClick = () => {
    setIsExplicitConfirm(true);
    setPhase('closing');
  };

  const handleDeclareClick = () => {
    onDecline();
  };

  // NPC positioning (consistent with order NPCs)
  const npcHeight = npcConfig?.height ?? 420;
  const npcBottomOffset = npcConfig?.bottomOffset ?? 0;  // Use ?? to handle 0 correctly (0 is falsy with ||)
  const npcRightOffset = npcConfig?.rightOffset ?? 0;

  return (
    <>
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
          position: 'absolute',
          bottom: `${npcHeight + npcBottomOffset - 80}px`,
          left: '50%',
          transform: 'translateX(-50%)',
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
          zIndex: 9,
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
          {phase === 'asking' && "This bouquet is beautiful! I'd like to buy this from your shelf, please."}
          {phase === 'confirming' && `Sell for ${bouquet.sellPrice} 🌼?`}
          {phase === 'closing' && 'Thanks!'}
        </div>

        {/* Timer display in asking phase */}
        {phase === 'asking' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              color: timeRemaining <= 3 ? '#C85A3A' : '#999',
              fontWeight: 'bold',
              opacity: 0.8,
            }}
          >
            <span>⏱️</span>
            <span>{timeRemaining}s</span>
          </div>
        )}

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
              Sell ✓
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
    </>
  );
}
