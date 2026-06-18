import { useGameStore } from '../../stores/gameStore';
import { FLOWERS } from '../../constants/flowers';
import RundotGameAPI from '@series-inc/rundot-game-sdk/api';

export function OrdersScreen() {
  const setCurrentScreen = useGameStore((s) => s.setCurrentScreen);
  const pendingOrders = useGameStore((s) => s.pendingOrders);
  const stemsInArrangement = useGameStore((s) => s.stemsInArrangement);
  const completeOrder = useGameStore((s) => s.completeOrder);

  const handleConfirmOrder = (orderId: string, reward: number) => {
    // Check if the arrangement matches the order
    completeOrder(orderId, reward);

    RundotGameAPI.analytics.recordCustomEvent('order_completed', {
      orderId,
      reward,
      stemCount: stemsInArrangement.length,
    });

    // Go back to shop
    setCurrentScreen('shop');
  };

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
        <h1 style={{ margin: 0, fontSize: '18px' }}>📋 Orders ({pendingOrders.length})</h1>
        <button
          onClick={() => setCurrentScreen('shop')}
          style={{
            padding: '8px 12px',
            background: '#B8A890',
            color: '#F5E6D3',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          Back to Shop
        </button>
      </div>

      {/* Orders List */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '12px',
        }}
      >
        {pendingOrders.length === 0 ? (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              color: '#666',
            }}
          >
            <p style={{ fontSize: '14px', marginBottom: '8px' }}>No pending orders</p>
            <p style={{ fontSize: '12px', opacity: 0.7 }}>Check back soon for customer orders!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {pendingOrders.map((order) => (
              <div
                key={order.id}
                style={{
                  padding: '12px',
                  background: 'rgba(255,255,255,0.6)',
                  border: '2px solid #6A9A50',
                  borderRadius: '6px',
                }}
              >
                {/* Customer Info */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
                    {order.customerMood}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Customer Type: {order.customerType}</div>
                </div>

                {/* Required Stems */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>
                    Required Stems:
                  </div>
                  <div style={{ display: 'grid', gap: '6px' }}>
                    {order.requiredStems.map((stem, idx) => {
                      const flower = FLOWERS[stem.flowerId];
                      return (
                        <div
                          key={idx}
                          style={{
                            padding: '8px',
                            background: 'rgba(0,0,0,0.05)',
                            borderRadius: '4px',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          {flower && (
                            <>
                              <img
                                src={flower.spriteUrl}
                                alt={flower.name}
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  objectFit: 'contain',
                                }}
                              />
                              <span>{flower.name}</span>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Reward */}
                <div
                  style={{
                    padding: '8px',
                    background: '#d4f1d4',
                    borderRadius: '4px',
                    marginBottom: '12px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    color: '#2A5A2A',
                    textAlign: 'center',
                  }}
                >
                  Reward: {order.reward} 🌼
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    onClick={() => setCurrentScreen('arrangement')}
                    style={{
                      padding: '10px',
                      background: '#6A9A50',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                  >
                    Arrange Bouquet
                  </button>
                  <button
                    onClick={() => handleConfirmOrder(order.id, order.reward)}
                    style={{
                      padding: '10px',
                      background: '#6A9A50',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                  >
                    ✅ Confirm
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
