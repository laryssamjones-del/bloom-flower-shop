import { useState, useEffect } from 'react';
import { FLOWERS, GREENERY } from '../../constants/flowers';

interface Props {
  flowerId: string;
  onComplete: () => void;
}

export function FlowerUnlockNotification({ flowerId, onComplete }: Props) {
  const [isVisible, setIsVisible] = useState(true);

  const flower = FLOWERS[flowerId] || GREENERY[flowerId as keyof typeof GREENERY];

  useEffect(() => {
    // Auto-dismiss after 3 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500); // Wait for fade-out animation
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!flower || !isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        pointerEvents: 'none',
        animation: isVisible ? 'fadeIn 0.5s ease-out' : 'fadeOut 0.5s ease-out',
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes fadeOut {
          from {
            opacity: 1;
            transform: scale(1);
          }
          to {
            opacity: 0;
            transform: scale(0.8);
          }
        }

        @keyframes sparkle {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        .sparkle-particle {
          position: absolute;
          animation: sparkle 1.5s ease-in-out infinite, float 2s ease-in-out infinite;
        }
      `}</style>

      {/* Background overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.3)',
          pointerEvents: 'all',
        }}
      />

      {/* Sparkle particles */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const distance = 80;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        const delay = i * 0.15;

        return (
          <div
            key={i}
            className="sparkle-particle"
            style={{
              left: '50%',
              top: '50%',
              width: '12px',
              height: '12px',
              marginLeft: '-6px',
              marginTop: '-6px',
              transform: `translate(${x}px, ${y}px)`,
              animationDelay: `${delay}s`,
            }}
          >
            ✨
          </div>
        );
      })}

      {/* Notification card */}
      <div
        style={{
          position: 'relative',
          background: 'linear-gradient(135deg, #FFB6D9 0%, #FFD9E8 100%)',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
          textAlign: 'center',
          maxWidth: '280px',
          border: '3px solid #FF69B4',
          zIndex: 10,
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🌸</div>

        <h2
          style={{
            margin: '0 0 8px 0',
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#333',
          }}
        >
          New Flower Unlocked!
        </h2>

        <p
          style={{
            margin: '8px 0 0 0',
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#FF1493',
          }}
        >
          {flower.name}
        </p>

      </div>
    </div>
  );
}
