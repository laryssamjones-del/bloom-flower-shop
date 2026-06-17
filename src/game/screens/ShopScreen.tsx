import { useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore';
import RundotGameAPI from '@series-inc/rundot-game-sdk/api';
import { ShelfDisplay } from '../components/ShelfDisplay';
import { InventoryDrawer } from '../components/InventoryDrawer';
import { CoinCounter } from '../components/CoinCounter';
import { FloristCharacter } from '../components/FloristCharacter';

const CUSTOMER_SPAWN_INTERVAL = 20000; // 20 seconds

export function ShopScreen() {
  const setCurrentScreen = useGameStore((s) => s.setCurrentScreen);
  const shelfCapacity = useGameStore((s) => s.shelfCapacity);

  // Spawn customers periodically
  useEffect(() => {
    const spawnCustomer = () => {
      useGameStore.getState().addActiveCustomer();
      RundotGameAPI.analytics.recordCustomEvent('customer_entered_shop');
    };

    const interval = setInterval(spawnCustomer, CUSTOMER_SPAWN_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const handleOpenWholesale = () => {
    RundotGameAPI.analytics.recordCustomEvent('shop_wholesale_opened');
    setCurrentScreen('wholesale');
  };

  const handleExpandShelf = () => {
    const state = useGameStore.getState();
    const cost = state.getShelfExpansionCost();

    if (state.expandShelf()) {
      RundotGameAPI.analytics.recordCustomEvent('shelf_expanded', {
        newCapacity: state.shelfCapacity,
        cost,
      });
    }
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
      {/* Header with coin counter */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '2px solid rgba(0,0,0,0.1)',
          background: 'rgba(255,255,255,0.3)',
        }}
      >
        <CoinCounter />
      </div>

      {/* Main content area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '12px 8px',
        }}
      >
        {/* Florist character and welcome */}
        <FloristCharacter />

        {/* Display shelf - the main storefront */}
        <div
          style={{
            marginBottom: '16px',
            padding: '12px',
            background: 'rgba(255,255,255,0.5)',
            borderRadius: '8px',
            minHeight: '200px',
          }}
        >
          <h2 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold' }}>
            Display Shelf {shelfCapacity}/50
          </h2>
          <ShelfDisplay />
        </div>

        {/* Action buttons */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginBottom: '12px',
          }}
        >
          <button
            onClick={handleOpenWholesale}
            style={{
              padding: '12px 16px',
              background: '#B8A890',
              color: '#F5E6D3',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            🌾 Wholesale Market
          </button>

          <button
            onClick={handleExpandShelf}
            style={{
              padding: '12px 16px',
              background: '#C8B8A0',
              color: '#F5E6D3',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            📦 Expand Shelf (150 coins)
          </button>
        </div>
      </div>

      {/* Inventory drawer at the bottom */}
      <div
        style={{
          borderTop: '2px solid rgba(0,0,0,0.1)',
          background: 'rgba(255,255,255,0.3)',
          padding: '8px',
          maxHeight: '120px',
          overflow: 'hidden',
        }}
      >
        <h3 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 'bold' }}>
          Inventory
        </h3>
        <InventoryDrawer />
      </div>
    </div>
  );
}
