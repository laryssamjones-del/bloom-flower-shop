import { useState, useEffect } from 'react';
import { FLOWERS, GREENERY } from '../../constants/flowers';
import { BOUQUET_RECIPES } from '../../data/bouquets';
import { loadTruckCustomizationConfig } from './TruckCustomizer';

const DELIVERY_COST = 25;

export interface SpecialDelivery {
  id: string;
  flowers: Array<{ flowerId: string; quantity: number }>;
  bouquet: (typeof BOUQUET_RECIPES)[0];
  createdAt: number;
}

function generateSpecialDelivery(): SpecialDelivery {
  // Get all available flowers (both FLOWERS and GREENERY)
  const allFlowerIds = [
    ...Object.keys(FLOWERS),
    ...Object.keys(GREENERY),
  ];

  // Generate 10 random flowers with varying quantities
  const flowers: Array<{ flowerId: string; quantity: number }> = [];
  let remainingCount = 10;

  while (remainingCount > 0 && flowers.length < 5 && allFlowerIds.length > 0) {
    const randomFlower = allFlowerIds[Math.floor(Math.random() * allFlowerIds.length)]!;
    const quantity = Math.min(remainingCount, Math.ceil(Math.random() * 4));
    flowers.push({ flowerId: randomFlower, quantity });
    remainingCount -= quantity;
  }

  // If we still have flowers left to allocate
  if (remainingCount > 0 && flowers.length > 0) {
    flowers[flowers.length - 1]!.quantity += remainingCount;
  }

  // Pick a random bouquet recipe
  const randomBouquet = BOUQUET_RECIPES[Math.floor(Math.random() * BOUQUET_RECIPES.length)];

  if (!randomBouquet) {
    // Fallback if no recipes available (shouldn't happen)
    return {
      id: `delivery-${Date.now()}-${Math.random()}`,
      flowers,
      bouquet: BOUQUET_RECIPES[0]!,
      createdAt: Date.now(),
    };
  }

  return {
    id: `delivery-${Date.now()}-${Math.random()}`,
    flowers,
    bouquet: randomBouquet,
    createdAt: Date.now(),
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
  const truckConfig = loadTruckCustomizationConfig();

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
      {/* Overlay bg */}
      <div
        onClick={onDeny}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'transparent',
          pointerEvents: 'all',
        }}
      />

      {/* Truck sliding in and shaking */}
      <div
        style={{
          position: 'absolute',
          top: truckConfig.topOffset,
          left: `${truckConfig.leftOffset}%`,
          transform: 'translateX(-50%)',
          animation: isSliding ? 'slideInTruck 0.6s ease-out forwards, shakeTruck 0.5s ease-in-out 0.6s' : 'none',
          pointerEvents: 'all',
          zIndex: 151,
        }}
      >
        <style>{`
          @keyframes slideInTruck {
            from {
              transform: translateX(-50%) translateY(-100%);
              opacity: 0;
            }
            to {
              transform: translateX(-50%) translateY(0);
              opacity: 1;
            }
          }

          @keyframes shakeTruck {
            0%, 100% { transform: translateX(-50%) translateY(0) rotate(0deg); }
            10% { transform: translateX(-50%) translateY(-3px) rotate(-1deg); }
            20% { transform: translateX(-50%) translateY(3px) rotate(1deg); }
            30% { transform: translateX(-50%) translateY(-3px) rotate(-1deg); }
            40% { transform: translateX(-50%) translateY(3px) rotate(1deg); }
            50% { transform: translateX(-50%) translateY(-2px) rotate(-0.5deg); }
            60% { transform: translateX(-50%) translateY(2px) rotate(0.5deg); }
            70% { transform: translateX(-50%) translateY(-1px) rotate(0); }
            80% { transform: translateX(-50%) translateY(1px) rotate(0); }
            90% { transform: translateX(-50%) translateY(0) rotate(0); }
          }
        `}</style>

        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            padding: '12px',
          }}
        >
          {/* "Special Delivery!" label */}
          {!showContents && (
            <div
              style={{
                position: 'absolute',
                top: '-28px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#FF6B9D',
                color: '#FFF',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                zIndex: 10,
              }}
            >
              ✨ Special Delivery!
            </div>
          )}

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
              <div
                style={{
                  textAlign: 'center',
                  fontSize: '10px',
                  color: '#999',
                  marginTop: '4px',
                  fontWeight: 'bold',
                }}
              >
                Tap to open
              </div>
            </div>
          )}

          {/* Shipment details panel - only show when contents are viewed */}
          {showContents && (
            <div
              style={{
                background: 'rgba(255,255,255,0.95)',
                borderRadius: '12px',
                padding: '12px',
                maxWidth: '200px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
            >
            {/* Flowers in shipment */}
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#666', marginBottom: '6px' }}>
                📦 Flowers:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {flowers.map((flower, idx) => (
                  <div
                    key={idx}
                    style={{
                      fontSize: '11px',
                      color: '#555',
                      display: 'flex',
                      gap: '4px',
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

            {/* Bouquet */}
            <div style={{ marginBottom: '8px', paddingTop: '8px', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#666', marginBottom: '4px' }}>
                💐 Bonus Bouquet:
              </div>
              <div style={{ fontSize: '11px', color: '#555' }}>
                {delivery.bouquet.name}
              </div>
            </div>

              {/* Cost */}
              <div style={{ paddingTop: '8px', borderTop: '1px solid rgba(0,0,0,0.1)', fontSize: '13px', fontWeight: 'bold', color: '#FF6B9D' }}>
                💰 {DELIVERY_COST} Petal Coins
              </div>
            </div>
          )}

          {/* Buttons - only show when contents are open */}
          {showContents && (
            <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '4px' }}>
              {!isAccepted ? (
                <>
                  <button
                    onClick={onDeny}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      background: '#EEE',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '12px',
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
                      padding: '8px 12px',
                      background: '#FF6B9D',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '12px',
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
                    padding: '8px 12px',
                    background: '#6A9A50',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '12px',
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
