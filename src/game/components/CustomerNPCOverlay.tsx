import { useEffect, useState } from 'react';

const NPC_IMAGES = [
  // Young women
  '/npcs/npc-young-woman-01.png',
  '/npcs/npc-young-woman-02.png',
  '/npcs/npc-young-woman-03.png',
  '/npcs/npc-young-woman-04.png',
  // Adult women
  '/npcs/npc-woman-braid-glasses.png',
  '/npcs/npc-elder-woman-white-hair.png',
  '/npcs/npc-elder-woman-grey-curly.png',
  '/npcs/npc-woman-auburn-curly.png',
  '/npcs/npc-woman-curly-afro.png',
  '/npcs/npc-woman-dark-updo.png',
  // Children
  '/npcs/npc-girl-pigtails.png',
  '/npcs/npc-girl-ponytail.png',
  '/npcs/npc-boy-brown-hair.png',
  '/npcs/npc-teen-purple-hair.png',
  // Men
  '/npcs/npc-man-bald-beard.png',
  '/npcs/npc-man-black-hair-linen.png',
  '/npcs/npc-man-brown-hair-sweater.png',
  '/npcs/npc-man-curly-hair.png',
  '/npcs/npc-man-grey-beard-blue.png',
  '/npcs/npc-man-grey-hair-navy.png',
  '/npcs/npc-man-locs-sweater.png',
  // Other
  '/npcs/npc-nonbinary-mint-hair.png',
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

  // After entering animation completes, switch to visible
  useEffect(() => {
    const t = setTimeout(() => setPhase('visible'), 600);
    return () => clearTimeout(t);
  }, []);

  const handleAccept = () => {
    setPhase('leaving');
    setTimeout(() => onAccept(), 500);
  };

  const handleDecline = () => {
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
        bottom: '70px', // just above tab bar
        right: 0,
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
            }}
          >
            {showDeclineLine ?? visit.message}
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
