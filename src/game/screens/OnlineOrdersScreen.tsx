import { useEffect, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { getRecipeById, TIER_LABELS, TIER_COLORS } from '../../data/bouquets';
import { getOrderRarity } from '../../utils/orderUtils';
import RundotGameAPI from '@series-inc/rundot-game-sdk/api';

const DAILY_ONLINE_ORDER_LIMIT = 15;

/** Format remaining milliseconds as "Xh Ym" or "Ym" when under 1 hour */
function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return 'Expired';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return 'Less than 1m';
}

export function OnlineOrdersScreen() {
  const setCurrentScreen = useGameStore((s) => s.setCurrentScreen);
  const pendingOnlineOrders = useGameStore((s) => s.pendingOnlineOrders);
  const onlineOrdersCompletedToday = useGameStore((s) => s.onlineOrdersCompletedToday);
  const acceptOnlineOrder = useGameStore((s) => s.acceptOnlineOrder);
  const denyOnlineOrder = useGameStore((s) => s.denyOnlineOrder);
  const expirePendingOnlineOrders = useGameStore((s) => s.expirePendingOnlineOrders);

  // Live countdown — tick every second
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Check for expired orders on each tick
  useEffect(() => {
    expirePendingOnlineOrders();
  }, [now, expirePendingOnlineOrders]);

  const handleAccept = (orderId: string) => {
    acceptOnlineOrder(orderId);
    // No notification-center entry on accept — the red dot on the Orders tab
    // already signals the new order, so this would just be clutter.
    RundotGameAPI.analytics.recordCustomEvent('online_order_screen_accepted', { orderId });
    setCurrentScreen('orders');
  };

  const handleDeny = (orderId: string) => {
    denyOnlineOrder(orderId);
    RundotGameAPI.analytics.recordCustomEvent('online_order_screen_denied', { orderId });
  };

  // Show only the first pending order at a time
  const currentOrder = pendingOnlineOrders[0] ?? null;

  const limitReached = onlineOrdersCompletedToday >= DAILY_ONLINE_ORDER_LIMIT;

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '2px solid rgba(0,0,0,0.1)',
          background: 'rgba(255,255,255,0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '18px' }}>🌐 Online Orders</h1>
        <button
          onClick={() => setCurrentScreen('orders')}
          style={{
            padding: '8px 12px',
            background: '#4A90E2',
            color: '#FFF',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          ← Back to Orders
        </button>
      </div>

      {/* Daily progress */}
      <div
        style={{
          padding: '10px 16px',
          background: 'rgba(255,255,255,0.2)',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: '13px', color: '#555', fontWeight: 600 }}>
          Completed today:
        </span>
        <span
          style={{
            fontSize: '14px',
            fontWeight: 'bold',
            color: limitReached ? '#C0392B' : '#6A9A50',
          }}
        >
          {onlineOrdersCompletedToday}/{DAILY_ONLINE_ORDER_LIMIT}
        </span>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {limitReached ? (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              color: '#666',
              background: 'rgba(255,255,255,0.6)',
              borderRadius: '12px',
              border: '2px solid #E8C5A0',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🌸</div>
            <p style={{ fontSize: '15px', fontWeight: 'bold', color: '#333', marginBottom: '6px' }}>
              Daily limit reached!
            </p>
            <p style={{ fontSize: '13px', opacity: 0.8 }}>
              You've completed {DAILY_ONLINE_ORDER_LIMIT} online orders today. Come back tomorrow for more!
            </p>
          </div>
        ) : currentOrder ? (
          (() => {
            const recipe = getRecipeById(currentOrder.recipeId);
            const remaining = currentOrder.expiresAt - now;
            const isUrgent = remaining < 30 * 60 * 1000; // less than 30 min
            const rarity = getOrderRarity(currentOrder.quantity);

            return (
              <div
                style={{
                  padding: '16px',
                  background: 'rgba(255,255,255,0.85)',
                  borderRadius: '14px',
                  border: '2px solid #6A9A50',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
              >
                {/* Online Order badge */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: '#E8F4FD',
                    border: '1px solid #4A90E2',
                    borderRadius: '20px',
                    padding: '3px 10px',
                    fontSize: '11px',
                    color: '#4A90E2',
                    fontWeight: 'bold',
                    marginBottom: '12px',
                  }}
                >
                  🌐 Online Order
                </div>

                {/* Bouquet info row */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '14px' }}>
                  {recipe && (
                    <img
                      src={recipe.imageUrl}
                      alt={recipe.name}
                      style={{ width: '72px', height: '72px', objectFit: 'contain', flexShrink: 0 }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap' }}>
                      {recipe && (
                        <div
                          style={{
                            display: 'inline-block',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            color: '#FFF',
                            background: TIER_COLORS[recipe.tier],
                            borderRadius: '8px',
                            padding: '2px 6px',
                          }}
                        >
                          {TIER_LABELS[recipe.tier]}
                        </div>
                      )}
                      {currentOrder.quantity > 1 && (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            color: '#FFF',
                            background: rarity === 'common' ? '#6A9A50' : rarity === 'uncommon' ? '#D4AF37' : '#9B59B6',
                            borderRadius: '8px',
                            padding: '2px 8px',
                            gap: '3px',
                          }}
                        >
                          ×{currentOrder.quantity}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
                      {currentOrder.recipeName}
                    </div>
                    <div
                      style={{
                        marginTop: '6px',
                        fontSize: '15px',
                        fontWeight: 'bold',
                        color: '#6A9A50',
                      }}
                    >
                      Reward: {currentOrder.reward} 🌼
                      <span
                        style={{
                          marginLeft: '6px',
                          fontSize: '11px',
                          color: '#4A90E2',
                          fontWeight: 'normal',
                        }}
                      >
                        {currentOrder.quantity > 1 ? `(×${currentOrder.quantity} bouquets, +10%)` : '(+10% bonus)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expiry timer */}
                <div
                  style={{
                    padding: '10px 14px',
                    background: isUrgent ? 'rgba(231,76,60,0.08)' : 'rgba(106,154,80,0.08)',
                    border: `1px solid ${isUrgent ? '#E74C3C' : '#6A9A50'}`,
                    borderRadius: '8px',
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: '12px', color: '#555' }}>
                    ⏰ Expires in:
                  </span>
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: isUrgent ? '#E74C3C' : '#333',
                    }}
                  >
                    {formatTimeRemaining(remaining)}
                  </span>
                </div>

                {/* Accept / Deny buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    onClick={() => handleDeny(currentOrder.id)}
                    style={{
                      padding: '12px',
                      background: 'rgba(200,100,100,0.15)',
                      color: '#C0392B',
                      border: '1.5px solid #C0392B',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 'bold',
                    }}
                  >
                    ✕ Deny
                  </button>
                  <button
                    onClick={() => handleAccept(currentOrder.id)}
                    style={{
                      padding: '12px',
                      background: '#6A9A50',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 'bold',
                    }}
                  >
                    ✓ Accept{currentOrder.quantity > 1 && ` ×${currentOrder.quantity}`}
                  </button>
                </div>
              </div>
            );
          })()
        ) : (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              color: '#666',
              background: 'rgba(255,255,255,0.6)',
              borderRadius: '12px',
              border: '2px solid #E8C5A0',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
            <p style={{ fontSize: '15px', fontWeight: 'bold', color: '#333', marginBottom: '6px' }}>
              No online orders right now
            </p>
            <p style={{ fontSize: '13px', opacity: 0.8 }}>
              New online orders arrive over time. Check back soon!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
