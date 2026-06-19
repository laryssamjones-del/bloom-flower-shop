import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import RundotGameAPI from '@series-inc/rundot-game-sdk/api';
import { CoinCounter } from '../components/CoinCounter';
import { BottomTabNavigation } from '../components/BottomTabNavigation';
import { CustomerNPCOverlay, NPCVisit, createNPCVisit } from '../components/CustomerNPCOverlay';
import { ShelfPurchaseNPC } from '../components/ShelfPurchaseNPC';
import {
  ShelfLayoutEditor,
  loadShelfLayoutConfig,
  BOUQUETS_PER_SHELF,
  type ShelfLayoutConfig,
} from '../components/ShelfLayoutEditor';
import {
  SpecialDeliveryOverlay,
  generateSpecialDelivery,
  type SpecialDelivery,
} from '../components/SpecialDeliveryOverlay';
import { NPCCustomizer } from '../components/NPCCustomizer';
import { TruckCustomizer } from '../components/TruckCustomizer';
import { Bouquet } from '../../types';
import { BOUQUET_RECIPES } from '../../data/bouquets';

// NPC visits: a customer slides in every 15–45 seconds
const NPC_VISIT_MIN = 15000;
const NPC_VISIT_MAX = 45000;

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

  // Layout editor
  const [editingLayout, setEditingLayout] = useState(false);
  const [shelfConfig, setShelfConfig] = useState<ShelfLayoutConfig>(() => loadShelfLayoutConfig());

  // NPC customizer
  const [customizingNPC, setCustomizingNPC] = useState(false);

  // Truck customizer
  const [customizingTruck, setCustomizingTruck] = useState(false);

  // Special delivery truck
  const [activeDelivery, setActiveDelivery] = useState<SpecialDelivery | null>(null);
  const deliveryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Schedule special deliveries (30 sec for testing, 15 min for production)
  const scheduleNextDelivery = () => {
    const delay = 30 * 1000; // 30 sec for testing
    const nextTime = Date.now() + delay;
    localStorage.setItem('nextDeliveryTime', nextTime.toString());

    deliveryTimerRef.current = setTimeout(() => {
      if (!activeDelivery) {
        const newDelivery = generateSpecialDelivery();
        setActiveDelivery(newDelivery);
        RundotGameAPI.analytics.recordCustomEvent('special_delivery_arrived', {
          deliveryId: newDelivery.id,
        });
      }
      scheduleNextDelivery();
    }, delay);
  };

  useEffect(() => {
    scheduleNextDelivery();
    return () => {
      if (deliveryTimerRef.current) clearTimeout(deliveryTimerRef.current);
    };
  }, []);

  const handleDeliveryAccept = (delivery: SpecialDelivery) => {
    const spendCoins = useGameStore.getState().spendCoins;
    const addStemsToInventory = useGameStore.getState().addStemsToInventory;
    const addBouquetToShelf = useGameStore.getState().addBouquetToShelf;

    const DELIVERY_COST = 65;

    if (!spendCoins(DELIVERY_COST)) {
      // Not enough coins
      RundotGameAPI.analytics.recordCustomEvent('special_delivery_rejected', {
        reason: 'insufficient_coins',
        deliveryId: delivery.id,
      });
      setActiveDelivery(null);
      return;
    }

    // Add flowers to inventory
    for (const { flowerId, quantity } of delivery.flowers) {
      addStemsToInventory(flowerId, quantity);
    }

    // Create and add bouquet to shelf
    const bouquetToAdd: Bouquet = {
      id: `delivery-bouquet-${Date.now()}`,
      stems: delivery.bouquet.ingredients.flatMap((ing, idx) =>
        Array.from({ length: ing.quantity }, (_, i) => ({
          flowerId: ing.flowerId,
          order: idx * 10 + i,
        }))
      ),
      wrappingPaper: 'plain-white',
      ribbonColor: 'blush',
      sellPrice: delivery.bouquet.sellPrice,
      thumbnailUrl: delivery.bouquet.imageUrl,
      createdAt: Date.now(),
      recipeName: delivery.bouquet.name,
    };

    addBouquetToShelf(bouquetToAdd);

    RundotGameAPI.analytics.recordCustomEvent('special_delivery_accepted', {
      deliveryId: delivery.id,
      flowerCount: delivery.flowers.reduce((sum, f) => sum + f.quantity, 0),
      bouquetName: delivery.bouquet.name,
    });

    setActiveDelivery(null);
  };

  const handleDeliveryDeny = () => {
    if (activeDelivery) {
      RundotGameAPI.analytics.recordCustomEvent('special_delivery_denied', {
        deliveryId: activeDelivery.id,
      });
    }
    setActiveDelivery(null);
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

  const handleEditorClose = () => {
    setShelfConfig(loadShelfLayoutConfig());
    setEditingLayout(false);
  };

  const handleNPCCustomizerClose = () => {
    setCustomizingNPC(false);
  };

  const handleTruckCustomizerClose = () => {
    setCustomizingTruck(false);
  };

  // Split bouquets into rows of BOUQUETS_PER_SHELF for shelf display
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


      {/* Edit Layout button — top-left (dev only) */}
      {import.meta.env.DEV && (
        <div style={{ position: 'fixed', top: '20px', left: '20px', display: 'flex', gap: '12px', zIndex: 10000 }}>
          <button
            onClick={() => {
              setEditingLayout(true);
              RundotGameAPI.analytics.recordCustomEvent('shelf_layout_editor_opened');
            }}
            style={{
              background: '#FFD700',
              border: '3px solid #000',
              borderRadius: '8px',
              padding: '10px 16px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 6px 16px rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            ⚙️ Layout
          </button>
          <button
            onClick={() => {
              setCustomizingNPC(true);
              RundotGameAPI.analytics.recordCustomEvent('npc_customizer_opened');
            }}
            style={{
              background: '#FFD700',
              border: '3px solid #000',
              borderRadius: '8px',
              padding: '10px 16px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 6px 16px rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            👤 NPC
          </button>
          <button
            onClick={() => {
              setCustomizingTruck(true);
              RundotGameAPI.analytics.recordCustomEvent('truck_customizer_opened');
            }}
            style={{
              background: '#FFD700',
              border: '3px solid #000',
              borderRadius: '8px',
              padding: '10px 16px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 6px 16px rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            🚚 Truck
          </button>
        </div>
      )}

      {/* Shelf bouquet display — positioned via saved layout config */}
      {shelfRows.map((row, rowIdx) => {
        const shelfPos = shelfConfig.shelves[rowIdx];
        if (!shelfPos) return null;

        return (
          <div
            key={`shelf-row-${rowIdx}`}
            style={{
              position: 'absolute',
              left: `${shelfPos.x}%`,
              top: `${shelfPos.y}%`,
              transform: 'translate(-50%, -100%)',
              display: 'flex',
              gap: `${shelfConfig.gap}px`,
              alignItems: 'flex-end',
              zIndex: 5,
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
                      width: shelfConfig.bouquetWidth,
                      height: shelfConfig.bouquetHeight,
                      objectFit: 'contain',
                      backgroundColor: 'transparent',
                      filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
                      imageRendering: 'crisp-edges',
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
        );
      })}

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

      {/* Special Delivery Truck */}
      {activeDelivery && (
        <SpecialDeliveryOverlay
          delivery={activeDelivery}
          onAccept={handleDeliveryAccept}
          onDeny={handleDeliveryDeny}
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

      {/* Shelf Layout Editor overlay */}
      {editingLayout && <ShelfLayoutEditor onClose={handleEditorClose} />}

      {/* NPC Customizer overlay */}
      {customizingNPC && <NPCCustomizer onClose={handleNPCCustomizerClose} />}

      {/* Truck Customizer overlay */}
      {customizingTruck && <TruckCustomizer onClose={handleTruckCustomizerClose} />}
    </div>
  );
}
