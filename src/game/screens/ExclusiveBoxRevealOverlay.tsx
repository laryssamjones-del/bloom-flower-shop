import { useState, useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { ExclusiveBoxContents } from '../../types';
import { FLOWERS } from '../../constants/flowers';
import RundotGameAPI from '@series-inc/rundot-game-sdk/api';

interface ExclusiveBoxRevealOverlayProps {
  contents: ExclusiveBoxContents[];
  onComplete: () => void;
}

export default function ExclusiveBoxRevealOverlay({
  contents,
  onComplete,
}: ExclusiveBoxRevealOverlayProps) {
  const addCoins = useGameStore((s) => s.addCoins);
  const addStemsToInventory = useGameStore((s) => s.addStemsToInventory);
  const [phase, setPhase] = useState<'shaking' | 'opening' | 'revealed'>('shaking');
  const [totalCoins, setTotalCoins] = useState(0);
  const [totalFlowers, setTotalFlowers] = useState<{ flowerId: string; quantity: number }[]>([]);
  const [totalBouquets, setTotalBouquets] = useState<any[]>([]);

  // Process all contents on mount
  useEffect(() => {
    let coins = 0;
    const flowers: { [key: string]: number } = {};
    const bouquets: any[] = [];

    // Aggregate all contents
    for (const box of contents) {
      coins += box.petalCoins;

      for (const flower of box.flowers) {
        flowers[flower.flowerId] = (flowers[flower.flowerId] || 0) + flower.quantity;
      }

      for (const bouquet of box.exclusiveBouquets) {
        bouquets.push(bouquet);
      }
    }

    setTotalCoins(coins);
    setTotalFlowers(
      Object.entries(flowers).map(([flowerId, quantity]) => ({ flowerId, quantity }))
    );
    setTotalBouquets(bouquets);

    // Add coins to player
    addCoins(coins);

    // Add flower stems to inventory
    for (const [flowerId, quantity] of Object.entries(flowers)) {
      addStemsToInventory(flowerId, quantity);
    }

    // Add exclusive bouquets to inventory
    useGameStore.setState((s) => ({
      exclusiveBouquets: [...s.exclusiveBouquets, ...bouquets],
      lastUpdated: Date.now(),
    }));

    // Record analytics
    RundotGameAPI.analytics.recordCustomEvent('exclusive_box_revealed', {
      boxCount: contents.length,
      totalCoins: coins,
      totalFlowers: Object.values(flowers).reduce((a, b) => a + b, 0),
      exclusiveBouquetCount: bouquets.length,
    });

    // Phase transitions
    const openTimeout = setTimeout(() => setPhase('opening'), 500);
    const revealTimeout = setTimeout(() => setPhase('revealed'), 2500);

    return () => {
      clearTimeout(openTimeout);
      clearTimeout(revealTimeout);
    };
  }, [contents, addCoins, addStemsToInventory]);

  const getFlowerName = (flowerId: string) => {
    return (FLOWERS as Record<string, any>)[flowerId]?.name || flowerId;
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000,
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          animation:
            phase === 'shaking'
              ? 'shake 0.5s ease-in-out'
              : phase === 'opening'
                ? 'none'
                : 'none',
        }}
      >
        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10% { transform: translateX(-8px); }
            20% { transform: translateX(8px); }
            30% { transform: translateX(-8px); }
            40% { transform: translateX(8px); }
            50% { transform: translateX(-8px); }
            60% { transform: translateX(8px); }
            70% { transform: translateX(-8px); }
            80% { transform: translateX(8px); }
            90% { transform: translateX(-4px); }
          }
        `}</style>

        {phase === 'shaking' && (
          <div>
            <div style={{ fontSize: '80px', marginBottom: '16px' }}>🎁</div>
            <h2 style={{ margin: '0 0 12px 0', fontSize: '24px', color: '#333' }}>Opening Box...</h2>
            <p style={{ color: '#666', fontSize: '14px' }}>The box is trembling with excitement!</p>
          </div>
        )}

        {(phase === 'opening' || phase === 'revealed') && (
          <div style={{ animation: phase === 'revealed' ? 'fadeIn 0.8s ease-in' : 'none' }}>
            <style>{`
              @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
            `}</style>

            <h2 style={{ margin: '0 0 20px 0', fontSize: '28px', color: '#333', fontWeight: 'bold' }}>
              ✨ You Got! ✨
            </h2>

            {/* Petal Coins */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(106, 154, 80, 0.15), rgba(175, 215, 120, 0.15))',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px',
                border: '2px solid #6A9A50',
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🌼</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#6A9A50' }}>{totalCoins} Petal Coins</div>
            </div>

            {/* Flowers */}
            {totalFlowers.length > 0 && (
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.15), rgba(139, 195, 74, 0.15))',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '16px',
                  border: '2px solid #4CAF50',
                }}
              >
                <div style={{ fontSize: '24px', marginBottom: '12px' }}>💐 Flower Stems</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {totalFlowers.map((f) => (
                    <div key={f.flowerId} style={{ fontSize: '12px', color: '#333', fontWeight: 'bold' }}>
                      {getFlowerName(f.flowerId)} ×{f.quantity}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Exclusive Bouquets */}
            {totalBouquets.length > 0 && (
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.2), rgba(255, 152, 0, 0.1))',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '16px',
                  border: '2px solid #FFB300',
                }}
              >
                <div style={{ fontSize: '24px', marginBottom: '12px', color: '#FF8C00', fontWeight: 'bold' }}>
                  ✨ Exclusive Bouquets
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {totalBouquets.map((bouquet) => (
                    <div
                      key={bouquet.id}
                      style={{
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: '#333',
                        padding: '8px',
                        background: 'rgba(255, 255, 255, 0.7)',
                        borderRadius: '6px',
                        border: '1px solid #FFB300',
                      }}
                    >
                      {bouquet.name}
                      <div style={{ fontSize: '10px', color: '#FF8C00' }}>sells for {bouquet.sellPrice} 🌼</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {phase === 'revealed' && (
              <button
                onClick={onComplete}
                style={{
                  marginTop: '24px',
                  padding: '14px 28px',
                  background: 'linear-gradient(135deg, #FF69B4, #FFB300)',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  width: '100%',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 20px rgba(255, 105, 180, 0.4)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                }}
              >
                🎉 Hooray!
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
