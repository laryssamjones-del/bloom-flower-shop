import { useEffect, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import RundotGameAPI from '@series-inc/rundot-game-sdk/api';
import { CoinCounter } from '../components/CoinCounter';
import { BouquetPreview } from '../components/BouquetPreview';

const CUSTOMER_SPAWN_INTERVAL = 20000; // 20 seconds

export function ShopScreen() {
  const [menuOpen, setMenuOpen] = useState(false);
  const setCurrentScreen = useGameStore((s) => s.setCurrentScreen);
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

      {/* Dropdown menu - positioned from top left */}
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
              setCurrentScreen('inventory');
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
            📦 Inventory
          </button>

          <button
            onClick={() => {
              setCurrentScreen('orders');
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
            📋 Orders
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
        {/* Shop shelves and display area - integrated into background */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'center',
            padding: '80px 20px 20px 20px',
            minHeight: 0,
            position: 'relative',
          }}
        >
          {/* Display shelf - bouquets placed on background shelves */}
          {displayedBouquets.length === 0 || displayedBouquets.every((b) => b === null) ? (
            <div
              style={{
                padding: '20px',
                color: '#ccc',
                fontSize: '13px',
                textAlign: 'center',
              }}
            >
              Arrange bouquets to display
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                gap: '16px',
                width: '100%',
                maxWidth: '360px',
              }}
            >
              {displayedBouquets.map((bouquet, idx) =>
                bouquet ? (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <BouquetPreview
                      bouquet={bouquet}
                      size="medium"
                      clickable={true}
                      onClickHandler={() => {
                        useGameStore.getState().sellBouquet(bouquet.id);
                        RundotGameAPI.analytics.recordCustomEvent('bouquet_sold', {
                          price: bouquet.sellPrice,
                        });
                      }}
                    />
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#d4a574',
                        fontWeight: '500',
                        textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                      }}
                    >
                      {bouquet.sellPrice}💰
                    </div>
                  </div>
                ) : null
              )}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
