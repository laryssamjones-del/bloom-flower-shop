import { useEffect, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import RundotGameAPI from '@series-inc/rundot-game-sdk/api';
import { CoinCounter } from '../components/CoinCounter';
import { Bouquet } from '../../types';

const CUSTOMER_SPAWN_INTERVAL = 20000; // 20 seconds
const BOUQUETS_PER_SHELF = 4;

export function ShopScreen() {
  const [menuOpen, setMenuOpen] = useState(false);
  const setCurrentScreen = useGameStore((s) => s.setCurrentScreen);
  const coins = useGameStore((s) => s.coins);
  const shelfBouquets = useGameStore((s) => s.shelfBouquets);
  const sellBouquet = useGameStore((s) => s.sellBouquet);

  // Spawn customers periodically
  useEffect(() => {
    const spawnCustomer = () => {
      useGameStore.getState().addActiveCustomer();
      RundotGameAPI.analytics.recordCustomEvent('customer_entered_shop');
    };

    const interval = setInterval(spawnCustomer, CUSTOMER_SPAWN_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const handleCreateOwn = () => {
    RundotGameAPI.analytics.recordCustomEvent('shop_create_own_started');
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

  const handleSellBouquet = (bouquet: Bouquet) => {
    if (sellBouquet(bouquet.id)) {
      RundotGameAPI.analytics.recordCustomEvent('bouquet_sold', {
        bouquetId: bouquet.id,
        price: bouquet.sellPrice,
      });
    }
  };

  // Split bouquets into rows of 4 for shelf display
  const shelfRows: Bouquet[][] = [];
  for (let i = 0; i < shelfBouquets.length; i += BOUQUETS_PER_SHELF) {
    shelfRows.push(shelfBouquets.slice(i, i + BOUQUETS_PER_SHELF));
  }

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        overflow: 'hidden',
        backgroundImage: 'url(/bloomy_shop_background.png)',
        backgroundSize: '100% 100%',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
      }}
    >
      {/* Top bar with menu and coin counter */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          right: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 10,
          gap: '12px',
        }}
      >
        {/* Menu button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            padding: '8px 12px',
            background: 'rgba(255, 255, 255, 0.9)',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '18px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          ☰
        </button>

        {/* Coin counter */}
        <div>
          <CoinCounter />
        </div>
      </div>

      {/* Dropdown menu */}
      {menuOpen && (
        <div
          style={{
            position: 'absolute',
            top: '50px',
            left: '12px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(4px)',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: 100,
            overflow: 'hidden',
            minWidth: '200px',
          }}
        >
          {[
            { label: '✨ Create Your Own', action: handleCreateOwn },
            { label: '🌾 Wholesale Market', action: handleOpenWholesale },
            { label: '📦 Inventory', action: () => setCurrentScreen('inventory') },
            { label: '📋 Orders', action: () => setCurrentScreen('orders') },
          ].map(({ label, action }) => (
            <button
              key={label}
              onClick={() => { action(); setMenuOpen(false); }}
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
              {label}
            </button>
          ))}
          <button
            onClick={() => { handleExpandShelf(); setMenuOpen(false); }}
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

      {/* Shelf bouquet display — overlaid on the background shelves */}
      {shelfBouquets.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '10%',
            right: '10%',
            display: 'flex',
            flexDirection: 'column',
            gap: '12%',
            zIndex: 5,
          }}
        >
          {shelfRows.map((row, rowIdx) => (
            <div
              key={rowIdx}
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${BOUQUETS_PER_SHELF}, 1fr)`,
                gap: '12px',
                justifyItems: 'center',
                alignItems: 'flex-end',
              }}
            >
              {row.map((bouquet) => (
                <button
                  key={bouquet.id}
                  onClick={() => handleSellBouquet(bouquet)}
                  title={`Sell for ${bouquet.sellPrice} 🌼`}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    transition: 'transform 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = 'scale(1.08)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                  }}
                >
                  <img
                    src={bouquet.thumbnailUrl || '/bouquets/sunshine-bunch.png'}
                    alt="Bouquet"
                    style={{
                      width: '100%',
                      maxWidth: '80px',
                      height: '100px',
                      objectFit: 'contain',
                      backgroundColor: 'transparent',
                      filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
                      imageRendering: 'crisp-edges',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 'bold',
                      color: '#5A3820',
                      background: 'rgba(255,255,255,0.75)',
                      borderRadius: '3px',
                      padding: '1px 4px',
                    }}
                  >
                    {bouquet.sellPrice} 🌼
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Click-anywhere to close menu */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 50,
          }}
        />
      )}
    </div>
  );
}
