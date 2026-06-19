import { useEffect, useState, useMemo } from 'react';
import { Bouquet } from '../../types';
import { loadNPCCustomizationConfig } from './NPCCustomizer';

const COMPLIMENT_TEMPLATES = [
  (name: string) => `I love this ${name}! 🌸`,
  (name: string) => `Oh, this ${name} is beautiful! ✨`,
  (name: string) => `This ${name} is absolutely gorgeous! 💐`,
  (name: string) => `I need this ${name} right now! 💕`,
  (name: string) => `That ${name} is perfect! 🌺`,
  (name: string) => `I'm taking this ${name}! It's so lovely! 🌼`,
];

interface ShelfPurchaseNPCProps {
  npcImage: string;
  bouquet: Bouquet;
  onComplete: () => void;
}

export function ShelfPurchaseNPC({ npcImage, bouquet, onComplete }: ShelfPurchaseNPCProps) {
  const [phase, setPhase] = useState<'entering' | 'visible' | 'sold' | 'leaving'>('entering');
  const npcConfig = useMemo(() => loadNPCCustomizationConfig(), []);

  // Animation sequence
  useEffect(() => {
    const enterTimer = setTimeout(() => setPhase('visible'), 600);
    return () => clearTimeout(enterTimer);
  }, []);

  useEffect(() => {
    if (phase === 'visible') {
      const soldTimer = setTimeout(() => setPhase('sold'), 2500);
      return () => clearTimeout(soldTimer);
    }
    return undefined;
  }, [phase]);

  useEffect(() => {
    if (phase === 'sold') {
      const leaveTimer = setTimeout(() => {
        setPhase('leaving');
        setTimeout(() => onComplete(), 500);
      }, 1500);
      return () => clearTimeout(leaveTimer);
    }
    return undefined;
  }, [phase, onComplete]);

  const isLeaving = phase === 'leaving';
  const bouquetName = bouquet.recipeName || 'bouquet';
  const compliment = COMPLIMENT_TEMPLATES[Math.floor(Math.random() * COMPLIMENT_TEMPLATES.length)]!(bouquetName);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: npcConfig.bottomOffset,
        right: npcConfig.rightOffset,
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
      {/* Chat bubble + Bouquet */}
      {phase !== 'entering' && (
        <div
          style={{
            marginRight: '90px',
            marginBottom: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            animation: 'bubblePop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
          }}
        >
          {/* Compliment bubble */}
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
            }}
          >
            {compliment}
            {/* Bubble tail */}
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

          {/* Bouquet preview + Sold status */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255,255,255,0.5)',
              borderRadius: '10px',
              padding: '6px 10px',
            }}
          >
            <img
              src={bouquet.thumbnailUrl || '/bouquets/sunshine-bunch.png'}
              alt={bouquetName}
              style={{
                width: '50px',
                height: '65px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                imageRendering: 'crisp-edges',
              }}
            />
            {phase === 'sold' && (
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 'bold',
                  color: '#6A9A50',
                  textAlign: 'center',
                }}
              >
                ✓ Sold!
              </div>
            )}
          </div>
        </div>
      )}

      {/* NPC character */}
      <img
        src={npcImage}
        alt="Customer"
        style={{
          height: npcConfig.height,
          width: 'auto',
          objectFit: 'contain',
          filter: 'drop-shadow(-4px 0 8px rgba(0,0,0,0.25))',
          imageRendering: 'crisp-edges',
        }}
      />
    </div>
  );
}
