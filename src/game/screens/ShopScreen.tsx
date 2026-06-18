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
  const removeBouquetFromShelf = useGameStore((s) => s.removeBouquetFromShelf);
  const [purchaseNotification, setPurchaseNotification] = useState<string | null>(null);
  const [longPressId, setLongPressId] = useState<string | null>(null);

  // Spawn customers periodically
  useEffect(() => {
    const spawnCustomer = () => {
      useGameStore.getState().addActiveCustomer();
      RundotGameAPI.analytics.recordCustomEvent('customer_entered_shop');
    };

    const interval = setInterval(spawnCustomer, CUSTOMER_SPAWN_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // Auto-purchase random bouquet every 60-120 seconds
  useEffect(() => {
    const purchaseRandomBouquet = () => {
      const bouquets = useGameStore.getState().shelfBouquets;
      if (bouquets.length > 0) {
        const randomBouquet = bouquets[Math.floor(Math.random() * bouquets.length)];
        if (randomBouquet && sellBouquet(randomBouquet.id)) {
          setPurchaseNotification('A customer bought your bouquet from the shelf!');
          setTimeout(() => setPurchaseNotification(null), 2500);

          RundotGameAPI.analytics.recordCustomEvent('bouquet_sold', {
            bouquetId: randomBouquet.id,
            price: randomBouquet.sellPrice,
          });
        }
      }
    };

    // Random interval between 60-120 seconds
    const randomDelay = 60000 + Math.random() * 60000;
    const interval = setInterval(purchaseRandomBouquet, randomDelay);
    return () => clearInterval(interval);
  }, []);

  // Long-press handling for delete
  const handleTouchStart = (bouquetId: string) => {
    const timer = setTimeout(() => {
      setLongPressId(bouquetId);
    }, 500); // 500ms long-press

    return () => clearTimeout(timer);
  };

  const handleTouchEnd = () => {
    if (longPressId) {
      removeBouquetFromShelf(longPressId);
      setLongPressId(null);
      RundotGameAPI.analytics.recordCustomEvent('bouquet_deleted', {
        bouquetId: longPressId,
      });
    }
  };

  const handleDelete = (bouquetId: string) => {
    removeBouquetFromShelf(bouquetId);
    setLongPressId(null);
    RundotGameAPI.analytics.recordCustomEvent('bouquet_deleted', {
      bouquetId: bouquetId,
    });
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

      {/* Grid Overlay for positioning (temporary debug) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 1,
          backgroundImage: `
            linear-gradient(0deg, transparent 24%, rgba(255,0,0,0.1) 25%, rgba(255,0,0,0.1) 26%, transparent 27%, transparent 74%, rgba(255,0,0,0.1) 75%, rgba(255,0,0,0.1) 76%, transparent 77%, transparent),
            linear-gradient(90deg, transparent 24%, rgba(255,0,0,0.1) 25%, rgba(255,0,0,0.1) 26%, transparent 27%, transparent 74%, rgba(255,0,0,0.1) 75%, rgba(255,0,0,0.1) 76%, transparent 77%, transparent)
          `,
          backgroundSize: '10% 10%',
        }}
      >
        {/* Y-axis label */}
        <div style={{ position: 'absolute', top: '0px', left: '2px', fontSize: '10px', color: 'red', fontWeight: 'bold', background: 'rgba(255,255,255,0.8)' }}>Y%</div>

        {/* Y-axis percentage markers (left side) */}
        <div style={{ position: 'absolute', top: '10%', left: '2px', fontSize: '10px', color: 'red', fontWeight: 'bold' }}>10%</div>
        <div style={{ position: 'absolute', top: '20%', left: '2px', fontSize: '10px', color: 'red', fontWeight: 'bold' }}>20%</div>
        <div style={{ position: 'absolute', top: '30%', left: '2px', fontSize: '10px', color: 'red', fontWeight: 'bold' }}>30%</div>
        <div style={{ position: 'absolute', top: '40%', left: '2px', fontSize: '10px', color: 'red', fontWeight: 'bold' }}>40%</div>
        <div style={{ position: 'absolute', top: '50%', left: '2px', fontSize: '10px', color: 'red', fontWeight: 'bold' }}>50%</div>
        <div style={{ position: 'absolute', top: '60%', left: '2px', fontSize: '10px', color: 'red', fontWeight: 'bold' }}>60%</div>
        <div style={{ position: 'absolute', top: '70%', left: '2px', fontSize: '10px', color: 'red', fontWeight: 'bold' }}>70%</div>
        <div style={{ position: 'absolute', top: '80%', left: '2px', fontSize: '10px', color: 'red', fontWeight: 'bold' }}>80%</div>

        {/* X-axis label */}
        <div style={{ position: 'absolute', top: '2px', left: '10%', fontSize: '10px', color: 'red', fontWeight: 'bold', background: 'rgba(255,255,255,0.8)' }}>X%</div>

        {/* X-axis percentage markers (top) */}
        <div style={{ position: 'absolute', top: '2px', left: '10%', fontSize: '9px', color: 'red', fontWeight: 'bold', marginLeft: '20px' }}>10%</div>
        <div style={{ position: 'absolute', top: '2px', left: '20%', fontSize: '9px', color: 'red', fontWeight: 'bold', marginLeft: '20px' }}>20%</div>
        <div style={{ position: 'absolute', top: '2px', left: '30%', fontSize: '9px', color: 'red', fontWeight: 'bold', marginLeft: '20px' }}>30%</div>
        <div style={{ position: 'absolute', top: '2px', left: '40%', fontSize: '9px', color: 'red', fontWeight: 'bold', marginLeft: '20px' }}>40%</div>
        <div style={{ position: 'absolute', top: '2px', left: '50%', fontSize: '9px', color: 'red', fontWeight: 'bold', marginLeft: '20px' }}>50%</div>
        <div style={{ position: 'absolute', top: '2px', left: '60%', fontSize: '9px', color: 'red', fontWeight: 'bold', marginLeft: '20px' }}>60%</div>
        <div style={{ position: 'absolute', top: '2px', left: '70%', fontSize: '9px', color: 'red', fontWeight: 'bold', marginLeft: '20px' }}>70%</div>
        <div style={{ position: 'absolute', top: '2px', left: '80%', fontSize: '9px', color: 'red', fontWeight: 'bold', marginLeft: '20px' }}>80%</div>
        <div style={{ position: 'absolute', top: '2px', left: '90%', fontSize: '9px', color: 'red', fontWeight: 'bold', marginLeft: '20px' }}>90%</div>
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
            top: '18%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90%',
            display: 'flex',
            flexDirection: 'column',
            gap: '13%',
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
                <div
                  key={bouquet.id}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                  }}
                  onTouchStart={() => handleTouchStart(bouquet.id)}
                  onTouchEnd={handleTouchEnd}
                  onMouseDown={() => handleTouchStart(bouquet.id)}
                  onMouseUp={handleTouchEnd}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      transition: 'transform 0.15s',
                      cursor: 'grab',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)';
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
                        maxWidth: '70px',
                        height: '90px',
                        objectFit: 'contain',
                        backgroundColor: 'transparent',
                        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
                        imageRendering: 'crisp-edges',
                        marginBottom: '2px',
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
                  </div>

                  {/* Delete button shown on long-press */}
                  {longPressId === bouquet.id && (
                    <button
                      onClick={() => handleDelete(bouquet.id)}
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: '#C0392B',
                        color: '#FFF',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        zIndex: 20,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      }}
                    >
                      🗑️ Delete
                    </button>
                  )}
                </div>
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
