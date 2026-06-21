import { useEffect, useState, useMemo, useRef } from 'react';
import { loadNPCCustomizationConfig } from './NPCCustomizer';
import { useGameStore } from '../../stores/gameStore';
import { playAudio } from '../../services/audio';
import RundotGameAPI from '@series-inc/rundot-game-sdk/api';

const NPC_IMAGES = [
  // Young women
  './npcs/npc-young-woman-01.png',
  './npcs/npc-young-woman-02.png',
  './npcs/npc-young-woman-03.png',
  './npcs/npc-young-woman-04.png',
  // Adult women
  './npcs/npc-woman-braid-glasses.png',
  './npcs/npc-elder-woman-white-hair.png',
  './npcs/npc-elder-woman-grey-curly.png',
  './npcs/npc-woman-auburn-curly.png',
  './npcs/npc-woman-auburn-curly-yellow-blouse.png',
  './npcs/npc-woman-black-braid-cream-sweater.png',
  './npcs/npc-woman-black-coily-denim-jacket.png',
  './npcs/npc-woman-silver-hair-sage-cardigan.png',
  './npcs/npc-woman-curly-afro.png',
  './npcs/npc-woman-dark-updo.png',
  // Men
  './npcs/npc-man-bald-beard.png',
  './npcs/npc-man-black-hair-linen.png',
  './npcs/npc-man-brown-hair-sweater.png',
  './npcs/npc-man-curly-hair.png',
  './npcs/npc-man-grey-beard-blue.png',
  './npcs/npc-man-grey-hair-navy.png',
  './npcs/npc-man-locs-sweater.png',
  './npcs/npc-man-black-fade-tan-jacket.png',
  './npcs/npc-man-black-wavy-denim-shirt.png',
  './npcs/npc-man-blonde-curly-lilac-sweater.png',
  './npcs/npc-man-red-hair-navy-sweater.png',
  // Other
  './npcs/npc-nonbinary-mint-hair.png',
];

const REQUEST_TEMPLATES = [
  (name: string) => `Hi there! I'd love to order a ${name}! 🌸`,
  (name: string) => `Excuse me! Could I get a ${name}, please? 💐`,
  (name: string) => `Oh wow, this shop is gorgeous! Can I get a ${name}?`,
  (name: string) => `Hello! I'm looking for a ${name} — do you make those?`,
  (name: string) => `I heard you make the best bouquets! I'd like a ${name}! ✨`,
  (name: string) => `My friend recommended your shop! I'd love a ${name}!`,
  (name: string) => `Perfect timing! I need a ${name} for a special occasion! 🌺`,
  (name: string) => `This place is adorable! Can I order a ${name}?`,
  (name: string) => `Oh, I've been looking everywhere for a ${name}! Do you have it?`,
  (name: string) => `Hi! Can you make me a ${name}? It's for someone special! 💕`,
];

const DECLINE_LINES = [
  "Oh, okay! I'll come back later! 🌸",
  "No worries, I'll check again soon!",
  "Alright! Maybe next time! 💐",
  "That's okay! Your shop is still lovely!",
  "I'll pop back in a bit. Thanks anyway!",
];

export interface NPCVisit {
  id: string;
  npcImage: string;
  message: string;
  recipeId: string;
  recipeName: string;
  reward: number;
}

interface CustomerNPCOverlayProps {
  visit: NPCVisit;
  onAccept: () => void;
  onDecline: () => void;
}

export function CustomerNPCOverlay({ visit, onAccept, onDecline }: CustomerNPCOverlayProps) {
  const [phase, setPhase] = useState<'entering' | 'visible' | 'leaving'>('entering');
  const [showDeclineLine, setShowDeclineLine] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(15);
  const storedNPCConfig = useGameStore((s) => s.npcCustomizationConfig);
  const npcConfig = useMemo(() => {
    // Use stored config if available, fall back to localStorage
    if (storedNPCConfig) {
      return storedNPCConfig;
    }
    return loadNPCCustomizationConfig();
  }, [storedNPCConfig]);
  const autoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Play door bell sound when NPC arrives
  useEffect(() => {
    playAudio('/shop-door-bell.mp3', 0.5);
    RundotGameAPI.analytics.recordCustomEvent('npc_customer_sound_played');
  }, []);

  // After entering animation completes, switch to visible
  useEffect(() => {
    const t = setTimeout(() => setPhase('visible'), 600);
    return () => clearTimeout(t);
  }, []);

  // Handle 15-second countdown and auto-dismiss
  useEffect(() => {
    if (phase === 'visible' && !showDeclineLine) {
      // Start countdown
      countdownIntervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Time's up - auto-dismiss
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            setPhase('leaving');
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
  }, [phase, showDeclineLine, onDecline]);

  const handleAccept = () => {
    // Clear timers
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (autoTimeoutRef.current) clearTimeout(autoTimeoutRef.current);

    setPhase('leaving');
    setTimeout(() => onAccept(), 500);
  };

  const handleDecline = () => {
    // Clear timers
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (autoTimeoutRef.current) clearTimeout(autoTimeoutRef.current);

    const line = DECLINE_LINES[Math.floor(Math.random() * DECLINE_LINES.length)]!;
    setShowDeclineLine(line);
    setTimeout(() => {
      setPhase('leaving');
      setTimeout(() => onDecline(), 500);
    }, 1200);
  };

  const isLeaving = phase === 'leaving';

  return (
    <div
      style={{
        position: 'absolute',
        bottom: `${npcConfig.bottomOffset}px`,
        right: `${npcConfig.rightOffset}px`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        zIndex: 8,
        animation: isLeaving
          ? 'npcSlideOut 0.5s ease-in forwards'
          : 'npcSlideIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        pointerEvents: isLeaving ? 'none' : 'auto',
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
            <div>{showDeclineLine ?? visit.message}</div>

            {/* Timer display */}
            {!showDeclineLine && (
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

          {/* Accept / Decline buttons — only show when not declining */}
          {!showDeclineLine && (
            <div
              style={{
                display: 'flex',
                gap: '6px',
                marginTop: '6px',
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={handleDecline}
                style={{
                  background: '#F5E6D8',
                  border: '1.5px solid #D4A57C',
                  borderRadius: '18px',
                  padding: '5px 11px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  color: '#8B5E3C',
                  cursor: 'pointer',
                }}
              >
                Not now
              </button>
              <button
                onClick={handleAccept}
                style={{
                  background: '#C8A96E',
                  border: '1.5px solid #A07840',
                  borderRadius: '18px',
                  padding: '5px 11px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  color: '#FFF8EE',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                }}
              >
                Accept ✓
              </button>
            </div>
          )}
        </div>
      )}

      {/* NPC character image */}
      <img
        src={visit.npcImage}
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

export function createNPCVisit(recipeId: string, recipeName: string, reward: number): NPCVisit {
  const npcImage = NPC_IMAGES[Math.floor(Math.random() * NPC_IMAGES.length)]!;
  const template = REQUEST_TEMPLATES[Math.floor(Math.random() * REQUEST_TEMPLATES.length)]!;
  return {
    id: `npc-${Date.now()}-${Math.random()}`,
    npcImage,
    message: template(recipeName),
    recipeId,
    recipeName,
    reward,
  };
}
