import { useGameStore } from '../../stores/gameStore';
import { Notification } from '../../types';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const NOTIFICATION_TITLES: Record<Notification['type'], string> = {
  level_up: '🎉 Level Up!',
  bouquet_unlocked: '🌸 New Bouquet Unlocked!',
  claim_rewards: '🎁 Rewards Waiting',
  order_pending: '📋 Order Pending',
};

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const notifications = useGameStore((s) => s.notifications);
  const markAsRead = useGameStore((s) => s.markNotificationAsRead);
  const removeNotification = useGameStore((s) => s.removeNotification);

  if (!isOpen) return null;

  // Mark all notifications as read when opening the center
  if (notifications.some((notif) => !notif.isRead)) {
    notifications.forEach((notif) => {
      if (!notif.isRead) {
        markAsRead(notif.id);
      }
    });
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#F5F1E8',
          borderRadius: '16px',
          padding: '24px',
          width: '90%',
          maxWidth: '500px',
          maxHeight: '70vh',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          border: '2px solid #E8C5A0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <h2
          style={{
            margin: '0 0 16px 0',
            fontSize: '20px',
            color: '#333',
            textAlign: 'center',
          }}
        >
          🔔 Notifications
        </h2>

        {/* Notifications List */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {notifications.length === 0 ? (
            <div
              style={{
                padding: '24px',
                textAlign: 'center',
                color: '#999',
                fontSize: '14px',
              }}
            >
              No notifications yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {notifications
                .sort((a, b) => b.createdAt - a.createdAt) // Most recent first
                .map((notif) => (
                  <div
                    key={notif.id}
                    style={{
                      padding: '12px',
                      background: notif.isRead ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.9)',
                      border: `1px solid ${notif.isRead ? '#E0D5C7' : '#D4A57C'}`,
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '12px',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: 'bold',
                          color: '#333',
                          marginBottom: '4px',
                        }}
                      >
                        {NOTIFICATION_TITLES[notif.type] || notif.title}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#666',
                          marginBottom: '6px',
                          lineHeight: 1.3,
                        }}
                      >
                        {notif.message}
                      </div>
                      <div
                        style={{
                          fontSize: '10px',
                          color: '#999',
                        }}
                      >
                        {new Date(notif.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                    <button
                      onClick={() => removeNotification(notif.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#999',
                        cursor: 'pointer',
                        fontSize: '18px',
                        padding: '0',
                        minWidth: '24px',
                        flexShrink: 0,
                      }}
                      title="Dismiss"
                    >
                      ×
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            marginTop: '16px',
            padding: '12px',
            background: '#C8A96E',
            color: '#FFF8EE',
            border: '1.5px solid #A07840',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = '#B8985E';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = '#C8A96E';
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
