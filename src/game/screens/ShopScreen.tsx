import { useEffect, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import RundotGameAPI from '@series-inc/rundot-game-sdk/api';
import { InventoryDrawer } from '../components/InventoryDrawer';
import { CoinCounter } from '../components/CoinCounter';

const CUSTOMER_SPAWN_INTERVAL = 20000; // 20 seconds

export function ShopScreen() {
  const [menuOpen, setMenuOpen] = useState(false);
  const setCurrentScreen = useGameStore((s) => s.setCurrentScreen);
  const shelfCapacity = useGameStore((s) => s.shelfCapacity);
  const coins = useGameStore((s) => s.coins);
  const displayedBouquets = useGameStore((s) => s.displayedBouquets);

  // Spawn customers periodically
  useEffect(() => {
    const spawnCustomer = () => {
      useGameStore.getState().addActiveCustomer();
      RundotGameAPI.analytics.recordCustomEvent('customer_entered_shop');
    };

    const interval = setInterval(spawnCustomer, CUSTOMER_SPAWN_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const handleArrangeBouquet = () => {
    RundotGameAPI.analytics.recordCustomEvent('shop_arrange_started');
    setCurrentScreen('arrangement');
  };

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
        backgroundImage: 'url(/bloomy_shop_background.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Coin counter - top right */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          zIndex: 10,
        }}
      >
        <CoinCounter />
      </div>

      {/* Main shop content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          padding: '0',
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Shop shelves and display area */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            minHeight: 0,
          }}
        >
          {/* Display shelf - showing arranged bouquets on counter */}
          <div
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.6)',
              borderRadius: '8px',
              backdropFilter: 'blur(4px)',
              textAlign: 'center',
            }}
          >
            <h2 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold' }}>
              💐 Display Shelf
            </h2>

            {displayedBouquets.length === 0 || displayedBouquets.every((b) => b === null) ? (
              <div
                style={{
                  padding: '20px',
                  color: '#999',
                  fontSize: '14px',
                }}
              >
                No bouquets on display. Arrange one to sell!
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
                  gap: '8px',
                  marginBottom: '12px',
                }}
              >
                {displayedBouquets.map((bouquet, idx) =>
                  bouquet ? (
                    <div
                      key={idx}
                      onClick={() => {
                        useGameStore.getState().sellBouquet(bouquet.id);
                        RundotGameAPI.analytics.recordCustomEvent('bouquet_sold', {
                          price: bouquet.sellPrice,
                        });
                      }}
                      style={{
                        padding: '8px',
                        background: 'rgba(200, 150, 100, 0.2)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '60px',
                        transition: 'transform 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                      }}
                      title={`Sell for ${bouquet.sellPrice} coins`}
                    >
                      💐
                    </div>
                  ) : null
                )}
              </div>
            )}

            <div
              style={{
                fontSize: '12px',
                color: '#666',
                marginBottom: '12px',
              }}
            >
              Capacity: {displayedBouquets.length}/{shelfCapacity}
            </div>
          </div>
        </div>

        {/* Menu button with dropdown */}
        <div
          style={{
            position: 'relative',
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(4px)',
            padding: '12px',
            borderTop: '2px solid rgba(0,0,0,0.1)',
          }}
        >
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              width: '100%',
              padding: '12px',
              background: '#D4A574',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            ⚙️ Menu {menuOpen ? '▲' : '▼'}
          </button>

          {/* Dropdown menu */}
          {menuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: '12px',
                right: '12px',
                marginTop: '8px',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(4px)',
                borderRadius: '6px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: 100,
                overflow: 'hidden',
              }}
            >
              <button
                onClick={() => {
                  handleArrangeBouquet();
                  setMenuOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#333',
                  textAlign: 'left',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(200, 150, 100, 0.1)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                💐 Arrange Bouquet
              </button>

              <button
                onClick={() => {
                  handleOpenWholesale();
                  setMenuOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#333',
                  textAlign: 'left',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(200, 150, 100, 0.1)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                🌾 Wholesale Market
              </button>

              <button
                onClick={() => {
                  handleExpandShelf();
                  setMenuOpen(false);
                }}
                disabled={coins < 150}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'transparent',
                  border: 'none',
                  cursor: coins >= 150 ? 'pointer' : 'not-allowed',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: coins >= 150 ? '#333' : '#999',
                  textAlign: 'left',
                  opacity: coins >= 150 ? 1 : 0.6,
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (coins >= 150) {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(200, 150, 100, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                📦 Expand Shelf (150 coins)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Inventory drawer - mobile optimized */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(4px)',
          padding: '8px',
          maxHeight: '100px',
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch',
          borderTop: '2px solid rgba(0,0,0,0.1)',
        }}
      >
        <InventoryDrawer />
      </div>
    </div>
  );
}
