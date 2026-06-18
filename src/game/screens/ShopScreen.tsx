import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import RundotGameAPI from '@series-inc/rundot-game-sdk/api';
import { CoinCounter } from '../components/CoinCounter';
import { BottomTabNavigation } from '../components/BottomTabNavigation';
import { CustomerNPCOverlay, NPCVisit, createNPCVisit } from '../components/CustomerNPCOverlay';
import { Bouquet } from '../../types';
import { BOUQUET_RECIPES } from '../../data/bouquets';

const BOUQUETS_PER_SHELF = 5;
// NPC visits: a customer slides in every 45–90 seconds
const NPC_VISIT_MIN = 45000;
const NPC_VISIT_MAX = 90000;

// Lifecycle analytics (module-scope — runs once)
RundotGameAPI.lifecycles.onPause(() => RundotGameAPI.analytics.recordCustomEvent('game_paused'));
RundotGameAPI.lifecycles.onResume(() => RundotGameAPI.analytics.recordCustomEvent('game_resumed'));
RundotGameAPI.lifecycles.onSleep(() => RundotGameAPI.analytics.recordCustomEvent('game_sleep'));
RundotGameAPI.lifecycles.onQuit(() => RundotGameAPI.analytics.recordCustomEvent('game_quit'));

export function ShopScreen() {
  const shelfBouquets = useGameStore((s) => s.shelfBouquets);
  const sellBouquet = useGameStore((s) => s.sellBouquet);
  const removeBouquetFromShelf = useGameStore((s) => s.removeBouquetFromShelf);
  const createOrder = useGameStore((s) => s.createOrder);

  const [purchaseNotification, setPurchaseNotification] = useState<string | null>(null);
  const [longPressId, setLongPressId] = useState<string | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Active NPC visit
  const [activeVisit, setActiveVisit] = useState<NPCVisit | null>(null);
  const npcTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Schedule next NPC visit
  const scheduleNextVisit = () => {
    const delay = NPC_VISIT_MIN + Math.random() * (NPC_VISIT_MAX - NPC_VISIT_MIN);
    npcTimerRef.current = setTimeout(() => {
      // Don't spawn a new NPC if one is already visible
      if (useGameStore.getState().pendingOrders.length < 10) {
        const recipe = BOUQUET_RECIPES[Math.floor(Math.random() * BOUQUET_RECIPES.length)]!;
        const visit = createNPCVisit(recipe.id, recipe.name, recipe.sellPrice);
        setActiveVisit(visit);
        RundotGameAPI.analytics.recordCustomEvent('npc_customer_arrived', {
          recipeId: recipe.id,
          recipeName: recipe.name,
        });
      }
      scheduleNextVisit();
    }, delay);
  };

  useEffect(() => {
    scheduleNextVisit();
    return () => {
      if (npcTimerRef.current) clearTimeout(npcTimerRef.current);
    };
  }, []);

  // Handle NPC accept: create an order from the visit
  const handleNPCAccept = () => {
    if (!activeVisit) return;
    const order = createOrder();
    setActiveVisit(null);
    if (order) {
      RundotGameAPI.analytics.recordCustomEvent('npc_order_accepted', {
        recipeId: activeVisit.recipeId,
        recipeName: activeVisit.recipeName,
      });
    }
  };

  const handleNPCDecline = () => {
    if (activeVisit) {
      RundotGameAPI.analytics.recordCustomEvent('npc_order_declined', {
        recipeId: activeVisit.recipeId,
      });
    }
    setActiveVisit(null);
  };

  // Auto-purchase random bouquet every 60-120 seconds (passive income)
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

    const randomDelay = 60000 + Math.random() * 60000;
    const interval = setInterval(purchaseRandomBouquet, randomDelay);
    return () => clearInterval(interval);
  }, []);

  // Long-press handling for delete
  const handlePointerDown = (bouquetId: string) => {
    longPressTimer.current = setTimeout(() => {
      setLongPressId(bouquetId);
    }, 500);
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleDelete = (bouquetId: string) => {
    removeBouquetFromShelf(bouquetId);
    setLongPressId(null);
    RundotGameAPI.analytics.recordCustomEvent('bouquet_deleted', { bouquetId });
  };

  // Split bouquets into rows of 5 for shelf display
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

      {/* Purchase / Order notification */}
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
            whiteSpace: 'nowrap',
            animation: 'fadeInOut 3s ease-in-out',
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
            top: '22%',
            left: '15%',
            right: '15%',
            display: 'flex',
            flexDirection: 'column',
            gap: '10%',
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
                  onPointerDown={() => handlePointerDown(bouquet.id)}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
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

      {/* NPC Customer Visitor */}
      {activeVisit && (
        <CustomerNPCOverlay
          visit={activeVisit}
          onAccept={handleNPCAccept}
          onDecline={handleNPCDecline}
        />
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
