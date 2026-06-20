import { useEffect, useState } from 'react';

interface NotificationPopupProps {
  title: string;
  message: string;
  emoji?: string;
  onComplete: () => void;
}

export function NotificationPopup({ title, message, emoji = '🔔', onComplete }: NotificationPopupProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Auto-dismiss after 3 seconds
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onComplete, 300); // Wait for fade-out animation
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      style={{
        position: 'fixed',
        top: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 8000,
        animation: isExiting ? 'slideUpFade 0.3s ease-out forwards' : 'slideDownFade 0.3s ease-out forwards',
      }}
    >
      <div
        style={{
          background: '#F5F1E8',
          border: '2px solid #D4A574',
          borderRadius: '12px',
          padding: '16px 20px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
          maxWidth: '280px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '28px', marginBottom: '8px' }}>
          {emoji}
        </div>
        <div
          style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#333',
            marginBottom: '6px',
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: '13px',
            color: '#666',
            lineHeight: 1.4,
          }}
        >
          {message}
        </div>
      </div>

      <style>{`
        @keyframes slideDownFade {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        @keyframes slideUpFade {
          from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
          to {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
        }
      `}</style>
    </div>
  );
}
