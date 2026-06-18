import { useEffect, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import RundotGameAPI from '@series-inc/rundot-game-sdk/api';
import { CoinCounter } from '../components/CoinCounter';
import { BottomTabNavigation } from '../components/BottomTabNavigation';
import { Bouquet } from '../../types';

const CUSTOMER_SPAWN_INTERVAL = 20000; // 20 seconds
const BOUQUETS_PER_SHELF = 5;

export function ShopScreen() {
  const shelfBouquets = useGameStore((s) => s.shelfBouquets);
  const sellBouquet = useGameStore((s) => s.sellBouquet);
  const [purchaseNotification, setPurchaseNotification] = useState<string | null>(null);

  // Spawn customers periodically
  useEffect(() => {
    const spawnCustomer = () => {
      useGameStore.getState().addActiveCustomer();
      RundotGameAPI.analytics.recordCustomEvent('customer_entered_shop');
    };

    const interval = setInterval(spawnCustomer, CUSTOMER_SPAWN_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const handleSellBouquet = (bouquet: Bouquet) => {
    if (sellBouquet(bouquet.id)) {
      setPurchaseNotification('A customer bought your bouquet from the shelf!');
      setTimeout(() => setPurchaseNotification(null), 2500);

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
      {/* Top bar with coin counter */}
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

      {/* Purchase Notification */}
      {purchaseNotification && (
        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#6A9A50',
            color: '#FFF',
            padding: '10px 16px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: 15,
            animation: 'fadeInOut 2.5s ease-in-out',
          }}
        >
          {purchaseNotification}
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

      {/* Bottom Tab Navigation */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 10,
        }}
      >
        <BottomTabNavigation />
      </div>
    </div>
  );
}
