import { useEffect, useState } from 'react';

const NPC_IMAGES = [
  '/npcs/npc-couple.png',
  '/npcs/npc-young-women.png',
  '/npcs/npc-elderly.png',
  '/npcs/npc-kids.png',
  '/npcs/npc-young-men.png',
  '/npcs/npc-varied.png',
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

  // Auto-dismiss after 20 seconds if player doesn't interact
  useEffect(() => {
    const t = setTimeout(() => {
      handleDecline();
    }, 20000);
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
        zIndex: 30,
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
            marginRight: '100px',
            marginBottom: '8px',
            animation: 'bubblePop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
          }}
        >
          <div
            style={{
              background: '#FFFDF5',
              border: '2px solid #E8C5A0',
              borderRadius: '16px',
              padding: '10px 14px',
              maxWidth: '200px',
              fontSize: '13px',
              color: '#4A2C17',
              lineHeight: 1.4,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
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
                gap: '8px',
                marginTop: '8px',
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={handleDecline}
                style={{
                  background: '#F5E6D8',
                  border: '2px solid #D4A57C',
                  borderRadius: '20px',
                  padding: '6px 14px',
                  fontSize: '12px',
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
                  border: '2px solid #A07840',
                  borderRadius: '20px',
                  padding: '6px 14px',
                  fontSize: '12px',
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
          height: '220px',
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
