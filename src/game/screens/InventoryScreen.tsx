import { useGameStore } from '../../stores/gameStore';
import { FLOWERS, GREENERY } from '../../constants/flowers';
import { ScreenNavigation } from '../components/ScreenNavigation';

export function InventoryScreen() {
  const setCurrentScreen = useGameStore((s) => s.setCurrentScreen);
  const inventory = useGameStore((s) => s.inventory);

  const getItem = (id: string) => FLOWERS[id] || (GREENERY as Record<string, any>)[id];

  const totalStems = inventory.reduce((sum, item) => sum + item.quantity, 0);

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
        <h1 style={{ margin: 0, fontSize: '18px' }}>📦 Inventory</h1>
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

      {/* Quick Navigation */}
      <ScreenNavigation currentScreen="inventory" />

      {/* Inventory List */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '12px',
        }}
      >
        {inventory.length === 0 ? (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              color: '#666',
            }}
          >
            <p style={{ fontSize: '14px', marginBottom: '8px' }}>Your inventory is empty</p>
            <p style={{ fontSize: '12px', opacity: 0.7 }}>Visit the wholesale market to buy stems!</p>
          </div>
        ) : (
          <>
            <div
              style={{
                marginBottom: '16px',
                padding: '12px',
                background: 'rgba(0,0,0,0.05)',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              Total stems: {totalStems}
            </div>

            <div
              style={{
                display: 'grid',
                gap: '8px',
              }}
            >
              {inventory.map((item) => {
                const flower = getItem(item.flowerId);
                if (!flower) return null;

                return (
                  <div
                    key={item.flowerId}
                    style={{
                      padding: '12px',
                      background: 'rgba(255,255,255,0.5)',
                      border: '2px solid #DDD',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <img
                      src={flower.spriteUrl}
                      alt={flower.name}
                      style={{
                        width: '48px',
                        height: '48px',
                        objectFit: 'contain',
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{flower.name}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {item.quantity} stems @ {flower.pricePerStem} 🌼 each
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: '#6A9A50',
                        minWidth: '60px',
                        textAlign: 'right',
                      }}
                    >
                      {item.quantity}x
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
