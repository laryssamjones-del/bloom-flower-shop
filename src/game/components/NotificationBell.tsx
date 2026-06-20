import { useGameStore } from '../../stores/gameStore';

interface NotificationBellProps {
  onOpen: () => void;
}

export function NotificationBell({ onOpen }: NotificationBellProps) {
  const unreadCount = useGameStore((s) => s.getUnreadNotificationCount());

  return (
    <>
      <button
        onClick={onOpen}
        style={{
          position: 'relative',
          padding: '8px 12px',
          background: '#F5E6D3',
          color: '#8B5E3C',
          border: '2px solid #D4A57C',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '44px',
          minHeight: '44px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = '#E8D5C4';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = '#F5E6D3';
        }}
        title="Notifications"
      >
        🔔
        {/* Red dot badge for unread notifications */}
        {unreadCount > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              width: '12px',
              height: '12px',
              background: '#E74C3C',
              borderRadius: '50%',
              border: '2px solid #F5E6D3',
              animation: 'pulse 2s infinite',
            }}
          />
        )}
      </button>

      {/* Pulse animation for the dot */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </>
  );
}
