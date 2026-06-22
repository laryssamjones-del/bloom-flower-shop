import { useState, useEffect, useMemo } from 'react';
import { FLOWERS, GREENERY } from '../../constants/flowers';
import { BOUQUET_RECIPES, type BouquetTier } from '../../data/bouquets';
import { loadTruckCustomizationConfig } from './TruckCustomizer';
import { useGameStore } from '../../stores/gameStore';

const DELIVERY_COST = 65;

export interface SpecialDelivery {
  id: string;
  flowers: Array<{ flowerId: string; quantity: number }>;
  bouquets: Array<(typeof BOUQUET_RECIPES)[0]>;
  createdAt: number;
  isPremiumDelivery?: boolean;
  priceMultiplier?: number;
  isFirstTimeGift?: boolean;
}

function generateSpecialDelivery(flowerCount: number = 15, bouquetCount: number = 2, bouquetTier?: BouquetTier, isPremiumDelivery: boolean = false, priceMultiplier: number = 1): SpecialDelivery {
  // Get all available flowers (both FLOWERS and GREENERY)
  const allFlowerIds = [
    ...Object.keys(FLOWERS),
    ...Object.keys(GREENERY),
  ];

  // Generate random flowers with varying quantities
  const flowers: Array<{ flowerId: string; quantity: number }> = [];
  let remainingCount = flowerCount;
  const maxFlowerTypes = Math.min(Math.ceil(flowerCount / 4), 12);

  while (remainingCount > 0 && flowers.length < maxFlowerTypes && allFlowerIds.length > 0) {
    const randomFlower = allFlowerIds[Math.floor(Math.random() * allFlowerIds.length)]!;
    const quantity = Math.min(remainingCount, Math.ceil(Math.random() * 4));
    flowers.push({ flowerId: randomFlower, quantity });
    remainingCount -= quantity;
  }

  // If we still have flowers left to allocate
  if (remainingCount > 0 && flowers.length > 0) {
    flowers[flowers.length - 1]!.quantity += remainingCount;
  }

  // Pick N random bouquet recipes (filtered by tier if specified)
  const bouquetPool = bouquetTier
    ? BOUQUET_RECIPES.filter((r) => r.tier === bouquetTier)
    : BOUQUET_RECIPES;
  const shuffled = [...bouquetPool].sort(() => 0.5 - Math.random());
  const bouquets = shuffled.slice(0, bouquetCount).filter((b) => b !== undefined) as Array<(typeof BOUQUET_RECIPES)[0]>;

  if (bouquets.length === 0) {
    // Fallback if no recipes available (shouldn't happen)
    bouquets.push(BOUQUET_RECIPES[0]!);
  }

  return {
    id: `delivery-${Date.now()}-${Math.random()}`,
    flowers,
    bouquets,
    createdAt: Date.now(),
    isPremiumDelivery,
    priceMultiplier,
  };
}

interface Props {
  delivery: SpecialDelivery;
  onAccept: (delivery: SpecialDelivery) => void;
  onDeny: () => void;
}

export function SpecialDeliveryOverlay({ delivery, onAccept, onDeny }: Props) {
  const [isSliding, setIsSliding] = useState(false);
  const [showContents, setShowContents] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const storedTruckConfig = useGameStore((s) => s.truckCustomizationConfig);
  const truckConfig = useMemo(() => {
    // Use stored config if available, fall back to localStorage
    if (storedTruckConfig) {
      return storedTruckConfig;
    }
    return loadTruckCustomizationConfig();
  }, [storedTruckConfig]);

  useEffect(() => {
    setIsSliding(true);
  }, []);

  const flowers = delivery.flowers
    .map(({ flowerId, quantity }) => {
      const flower = FLOWERS[flowerId];
      if (flower) return { ...flower, quantity };
      const greenery = GREENERY[flowerId as keyof typeof GREENERY];
      if (greenery) return { ...greenery, quantity, tier: 'greenery' as const };
      return null;
    })
    .filter((f): f is NonNullable<typeof f> => f !== null);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        top: 0,
        zIndex: 150,
        pointerEvents: 'none',
      }}
    >
      {/* Overlay bg - no click dismiss, only via buttons */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'transparent',
          pointerEvents: 'none',
        }}
      />

      {/* Truck sliding in and shaking */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          top: truckConfig.topOffset,
          right: `${truckConfig.rightOffset}%`,
          transform: 'translateX(50%)',
          animation: isSliding ? 'slideInTruck 0.6s ease-out forwards, shakeTruck 0.5s ease-in-out 0.6s' : 'none',
          pointerEvents: 'all',
          zIndex: 151,
        }}
      >
        <style>{`
          @keyframes slideInTruck {
            from {
              transform: translateX(50%) translateY(-100%);
              opacity: 0;
            }
            to {
              transform: translateX(50%) translateY(0);
              opacity: 1;
            }
          }

          @keyframes shakeTruck {
            0%, 100% { transform: translateX(50%) translateY(0) rotate(0deg); }
            10% { transform: translateX(50%) translateY(-3px) rotate(-1deg); }
            20% { transform: translateX(50%) translateY(3px) rotate(1deg); }
            30% { transform: translateX(50%) translateY(-3px) rotate(-1deg); }
            40% { transform: translateX(50%) translateY(3px) rotate(1deg); }
            50% { transform: translateX(50%) translateY(-2px) rotate(-0.5deg); }
            60% { transform: translateX(50%) translateY(2px) rotate(0.5deg); }
            70% { transform: translateX(50%) translateY(-1px) rotate(0); }
            80% { transform: translateX(50%) translateY(1px) rotate(0); }
            90% { transform: translateX(50%) translateY(0) rotate(0); }
          }
        `}</style>

        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            padding: '8px',
          }}
        >
          {/* Truck - clickable to show contents */}
          {!showContents && !isAccepted && (
            <div
              onClick={() => setShowContents(true)}
              style={{
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)';
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,200,0,0.1)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              <img
                src="/delivery-truck.png"
                alt="Delivery Truck"
                style={{
                  width: truckConfig.width,
                  height: 'auto',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))',
                  userSelect: 'none',
                }}
              />
            </div>
          )}

          {/* Shipment details panel - only show when contents are viewed */}
          {showContents && (
            <div
              style={{
                background: 'rgba(255,255,255,0.95)',
                borderRadius: '12px',
                padding: '4px',
                maxWidth: '200px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
            >
            {/* Flowers in shipment */}
            <div style={{ marginBottom: '2px' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#666', marginBottom: '3px' }}>
                📦 Flowers:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {flowers.map((flower, idx) => (
                  <div
                    key={idx}
                    style={{
                      fontSize: '10px',
                      color: '#555',
                      display: 'flex',
                      gap: '3px',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: '14px' }}>🌸</span>
                    <span>{flower.name}</span>
                    <span style={{ fontWeight: 'bold', color: '#FF6B9D' }}>×{flower.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bouquets */}
            <div style={{ marginBottom: '3px', paddingTop: '3px', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#666', marginBottom: '2px' }}>
                💐 Bonus Bouquets:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {delivery.bouquets.map((bouquet, idx) => (
                  <div key={idx} style={{ fontSize: '10px', color: '#555' }}>
                    • {bouquet.name}
                  </div>
                ))}
              </div>
            </div>

              {/* Cost */}
              <div style={{ paddingTop: '3px', borderTop: '1px solid rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold', color: delivery.isFirstTimeGift ? '#22BB44' : '#FF6B9D' }}>
                {delivery.isFirstTimeGift ? '🎁 FREE GIFT!' : `💰 ${DELIVERY_COST} Petal Coins`}
              </div>
            </div>
          )}

          {/* Buttons - only show when contents are open */}
          {showContents && (
            <div style={{ display: 'flex', gap: '6px', width: '100%', marginTop: '2px' }}>
              {!isAccepted ? (
                <>
                  <button
                    onClick={onDeny}
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      background: '#EEE',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      color: '#666',
                    }}
                  >
                    Deny
                  </button>
                  <button
                    onClick={() => {
                      setIsAccepted(true);
                      onAccept(delivery);
                    }}
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      background: '#FF6B9D',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      color: '#FFF',
                    }}
                  >
                    Accept
                  </button>
                </>
              ) : (
                <button
                  onClick={onDeny}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    background: '#6A9A50',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    color: '#FFF',
                  }}
                >
                  ✓ Done
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { generateSpecialDelivery };
