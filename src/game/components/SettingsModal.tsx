import { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import RundotGameAPI from '@series-inc/rundot-game-sdk/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  musicVolume: number;
  onMusicVolumeChange: (volume: number) => void;
  isMusicMuted: boolean;
  onToggleMusicMute: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  musicVolume,
  onMusicVolumeChange,
  isMusicMuted,
  onToggleMusicMute,
}: SettingsModalProps) {
  const resetGame = useGameStore((s) => s.resetGame);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);

  const handleResetGame = () => {
    resetGame();
    RundotGameAPI.analytics.recordCustomEvent('game_reset', {});
    setShowResetConfirmation(false);
    onClose();
  };

  if (!isOpen) return null;

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
          maxWidth: '400px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          border: '2px solid #E8C5A0',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            margin: '0 0 20px 0',
            fontSize: '20px',
            color: '#333',
            textAlign: 'center',
          }}
        >
          ⚙️ Settings
        </h2>

        {/* Music Volume Control */}
        <div style={{ marginBottom: '24px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#555',
              marginBottom: '10px',
            }}
          >
            🔊 Music Volume
          </label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <input
              type="range"
              min="0"
              max="100"
              value={isMusicMuted ? 0 : musicVolume * 100}
              onChange={(e) => {
                const newVolume = parseFloat(e.target.value) / 100;
                onMusicVolumeChange(newVolume);
                RundotGameAPI.analytics.recordCustomEvent('music_volume_changed', {
                  volume: Math.round(newVolume * 100),
                });
              }}
              style={{
                flex: 1,
                height: '6px',
                borderRadius: '3px',
                background: '#E8C5A0',
                outline: 'none',
                accentColor: '#C09840',
              }}
            />
            <span
              style={{
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#666',
                minWidth: '35px',
              }}
            >
              {isMusicMuted ? '0%' : Math.round(musicVolume * 100) + '%'}
            </span>
          </div>

          {/* Mute Button */}
          <button
            onClick={() => {
              onToggleMusicMute();
              RundotGameAPI.analytics.recordCustomEvent('music_muted_toggled', {
                isMuted: !isMusicMuted,
              });
            }}
            style={{
              marginTop: '10px',
              width: '100%',
              padding: '10px',
              background: isMusicMuted ? '#D4A57C' : '#E8D5C4',
              color: isMusicMuted ? '#FFF' : '#555',
              border: `1.5px solid ${isMusicMuted ? '#A07840' : '#D4A57C'}`,
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 'bold',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              const btn = e.currentTarget as HTMLElement;
              if (isMusicMuted) {
                btn.style.background = '#C8985E';
              } else {
                btn.style.background = '#DEC4B3';
              }
            }}
            onMouseLeave={(e) => {
              const btn = e.currentTarget as HTMLElement;
              if (isMusicMuted) {
                btn.style.background = '#D4A57C';
              } else {
                btn.style.background = '#E8D5C4';
              }
            }}
          >
            {isMusicMuted ? '🔇 Unmute' : '🔊 Mute'}
          </button>
        </div>

        {/* Reset Game Button */}
        <div style={{ marginBottom: '16px' }}>
          <button
            onClick={() => setShowResetConfirmation(true)}
            style={{
              width: '100%',
              padding: '12px',
              background: 'rgba(200, 100, 100, 0.15)',
              color: '#C0392B',
              border: '1.5px solid #C0392B',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(200, 100, 100, 0.25)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(200, 100, 100, 0.15)';
            }}
          >
            🔄 Reset Game
          </button>
          <p
            style={{
              fontSize: '11px',
              color: '#999',
              margin: '8px 0 0 0',
              textAlign: 'center',
            }}
          >
            Start a fresh game and erase all progress
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            width: '100%',
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

        {/* Reset Confirmation Modal */}
        {showResetConfirmation && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
            }}
            onClick={() => setShowResetConfirmation(false)}
          >
            <div
              style={{
                background: '#F5F1E8',
                borderRadius: '16px',
                padding: '24px',
                width: '90%',
                maxWidth: '350px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                border: '2px solid #E8C5A0',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3
                style={{
                  margin: '0 0 16px 0',
                  fontSize: '18px',
                  color: '#C0392B',
                  textAlign: 'center',
                }}
              >
                ⚠️ Are you sure?
              </h3>
              <p
                style={{
                  fontSize: '14px',
                  color: '#555',
                  textAlign: 'center',
                  margin: '0 0 20px 0',
                  lineHeight: 1.4,
                }}
              >
                This will erase all your progress, coins, bouquets, and unlocked items. This cannot be undone!
              </p>

              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                }}
              >
                <button
                  onClick={() => setShowResetConfirmation(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#E8D5C4',
                    color: '#555',
                    border: '1.5px solid #D4A57C',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 'bold',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetGame}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#C0392B',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 6px rgba(192, 57, 43, 0.3)',
                  }}
                >
                  Reset Game
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
