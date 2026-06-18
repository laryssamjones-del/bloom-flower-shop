import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import RundotGameAPI from '@series-inc/rundot-game-sdk/api';
import { CoinCounter } from '../components/CoinCounter';
import { BottomTabNavigation } from '../components/BottomTabNavigation';
import { CustomerNPCOverlay, NPCVisit, createNPCVisit } from '../components/CustomerNPCOverlay';
import { ShelfPurchaseNPC } from '../components/ShelfPurchaseNPC';
import { Bouquet } from '../../types';
import { BOUQUET_RECIPES } from '../../data/bouquets';

const BOUQUETS_PER_SHELF = 5;
// NPC visits: a customer slides in every 25–90 seconds
const NPC_VISIT_MIN = 25000;
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

  const [longPressId, setLongPressId] = useState<string | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Active NPC visit (order requests)
  const [activeVisit, setActiveVisit] = useState<NPCVisit | null>(null);
  const npcTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Shelf purchase NPC
  const [shelfPurchaseNPC, setShelfPurchaseNPC] = useState<{
    npcImage: string;
    bouquet: Bouquet;
  } | null>(null);
  const shelfPurchaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Shelf purchase NPC - shows an NPC complimenting and buying a bouquet every 60-120 seconds
  const scheduleNextShelfPurchase = () => {
    const delay = 60000 + Math.random() * 60000;
    shelfPurchaseTimerRef.current = setTimeout(() => {
      const bouquets = useGameStore.getState().shelfBouquets;
      // Don't spawn if another NPC is already visible
      if (bouquets.length > 0 && !shelfPurchaseNPC && !activeVisit) {
        const randomBouquet = bouquets[Math.floor(Math.random() * bouquets.length)];
        if (randomBouquet) {
          const NPC_IMAGES = [
            '/npcs/npc-young-woman-01.png',
            '/npcs/npc-young-woman-02.png',
            '/npcs/npc-young-woman-03.png',
            '/npcs/npc-young-woman-04.png',
            '/npcs/npc-woman-braid-glasses.png',
            '/npcs/npc-elder-woman-white-hair.png',
            '/npcs/npc-elder-woman-grey-curly.png',
            '/npcs/npc-woman-auburn-curly.png',
            '/npcs/npc-woman-curly-afro.png',
            '/npcs/npc-woman-dark-updo.png',
            '/npcs/npc-girl-pigtails.png',
            '/npcs/npc-girl-ponytail.png',
            '/npcs/npc-boy-brown-hair.png',
            '/npcs/npc-teen-purple-hair.png',
            '/npcs/npc-man-bald-beard.png',
            '/npcs/npc-man-black-hair-linen.png',
            '/npcs/npc-man-brown-hair-sweater.png',
            '/npcs/npc-man-curly-hair.png',
            '/npcs/npc-man-grey-beard-blue.png',
            '/npcs/npc-man-grey-hair-navy.png',
            '/npcs/npc-man-locs-sweater.png',
            '/npcs/npc-nonbinary-mint-hair.png',
          ];
          const randomNPC = NPC_IMAGES[Math.floor(Math.random() * NPC_IMAGES.length)]!;
          setShelfPurchaseNPC({ npcImage: randomNPC, bouquet: randomBouquet });
        }
      }
      scheduleNextShelfPurchase();
    }, delay);
  };

  useEffect(() => {
    scheduleNextShelfPurchase();
    return () => {
      if (shelfPurchaseTimerRef.current) clearTimeout(shelfPurchaseTimerRef.current);
    };
  }, []);

  const handleShelfPurchaseComplete = () => {
    if (shelfPurchaseNPC) {
      sellBouquet(shelfPurchaseNPC.bouquet.id);
      RundotGameAPI.analytics.recordCustomEvent('shelf_bouquet_sold', {
        bouquetId: shelfPurchaseNPC.bouquet.id,
        price: shelfPurchaseNPC.bouquet.sellPrice,
      });
    }
    setShelfPurchaseNPC(null);
  };

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

      {/* Grid overlay for positioning (debug) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      >
        {/* Y% labels on left */}
        {Array.from({ length: 21 }, (_, i) => i * 5).map((y) => (
          <div
            key={`y-${y}`}
            style={{
              position: 'absolute',
              left: '2px',
              top: `${y}%`,
              transform: 'translateY(-50%)',
              fontSize: '10px',
              color: '#FF0000',
              fontWeight: 'bold',
            }}
          >
            Y{y}%
          </div>
        ))}

        {/* X% labels on top */}
        {Array.from({ length: 21 }, (_, i) => i * 5).map((x) => (
          <div
            key={`x-${x}`}
            style={{
              position: 'absolute',
              top: '2px',
              left: `${x}%`,
              transform: 'translateX(-50%)',
              fontSize: '10px',
              color: '#FF0000',
              fontWeight: 'bold',
            }}
          >
            X{x}%
          </div>
        ))}

        {/* Grid lines */}
        {Array.from({ length: 21 }, (_, i) => i * 5).map((pos) => (
          <div key={`vline-${pos}`} style={{
            position: 'absolute',
            left: `${pos}%`,
            top: 0,
            bottom: 0,
            width: '1px',
            background: '#FF000033',
          }} />
        ))}
        {Array.from({ length: 21 }, (_, i) => i * 5).map((pos) => (
          <div key={`hline-${pos}`} style={{
            position: 'absolute',
            top: `${pos}%`,
            left: 0,
            right: 0,
            height: '1px',
            background: '#FF000033',
          }} />
        ))}
      </div>

      {/* Shelf bouquet display — centered and stacked */}
      {shelfBouquets.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 5,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '60px',
            paddingTop: '40px',
          }}
        >
          {shelfRows.map((row) => (
            <div
              key={row[0]?.id}
              style={{
                display: 'flex',
                gap: '20px',
                justifyContent: 'center',
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
                        maxWidth: '90px',
                        height: '110px',
                        objectFit: 'contain',
                        backgroundColor: 'transparent',
                        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
                        imageRendering: 'crisp-edges',
                        marginBottom: '2px',
                      }}
                    />
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

      {/* NPC Customer Visitor (Order Requests) */}
      {activeVisit && (
        <CustomerNPCOverlay
          visit={activeVisit}
          onAccept={handleNPCAccept}
          onDecline={handleNPCDecline}
        />
      )}

      {/* NPC Shelf Purchase */}
      {shelfPurchaseNPC && (
        <ShelfPurchaseNPC
          npcImage={shelfPurchaseNPC.npcImage}
          bouquet={shelfPurchaseNPC.bouquet}
          onComplete={handleShelfPurchaseComplete}
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
