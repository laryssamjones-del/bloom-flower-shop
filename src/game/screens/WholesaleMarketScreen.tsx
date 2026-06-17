import { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { FLOWERS, INITIAL_UNLOCKED_FLOWERS } from '../../constants/flowers';
import RundotGameAPI from '@series-inc/rundot-game-sdk/api';

type BulkOption = 1 | 5 | 10 | 20;

const BULK_DISCOUNTS: Record<BulkOption, number> = {
  1: 0,
  5: 0.1,
  10: 0.2,
  20: 0.3,
};

export function WholesaleMarketScreen() {
  const setCurrentScreen = useGameStore((s) => s.setCurrentScreen);
  const coins = useGameStore((s) => s.coins);
  const addStemsToInventory = useGameStore((s) => s.addStemsToInventory);
  const spendCoins = useGameStore((s) => s.spendCoins);

  const [selectedFlower, setSelectedFlower] = useState<string | null>(null);
  const [selectedBulk, setSelectedBulk] = useState<BulkOption>(1);

  const availableFlowers = Array.from(INITIAL_UNLOCKED_FLOWERS);

  const handleBuyFlowers = () => {
    if (!selectedFlower) return;

    const flower = FLOWERS[selectedFlower];
    if (!flower) return;

    const discount = BULK_DISCOUNTS[selectedBulk];
    const baseCost = flower.pricePerStem * selectedBulk;
    const totalCost = Math.round(baseCost * (1 - discount));

    if (coins >= totalCost) {
      if (spendCoins(totalCost) && addStemsToInventory(selectedFlower, selectedBulk)) {
        RundotGameAPI.analytics.recordCustomEvent('flowers_purchased', {
          flowerId: selectedFlower,
          quantity: selectedBulk,
          cost: totalCost,
          discount: discount > 0 ? `${(discount * 100).toFixed(0)}%` : 'none',
        });
      }
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
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '2px solid rgba(0,0,0,0.1)',
          background: 'rgba(255,255,255,0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '18px' }}>🌾 Wholesale Market</h1>
        <button
          onClick={() => setCurrentScreen('shop')}
          style={{
            padding: '8px 12px',
            background: '#B8A890',
            color: '#F5E6D3',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          Back to Shop
        </button>
      </div>

      {/* Main content */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '12px',
        }}
      >
        {/* Flower grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
            gap: '8px',
            marginBottom: '16px',
          }}
        >
          {availableFlowers.map((flowerId) => {
            const flower = FLOWERS[flowerId];
            if (!flower) return null;

            const isSelected = selectedFlower === flowerId;

            return (
              <div
                key={flowerId}
                onClick={() => setSelectedFlower(flowerId)}
                style={{
                  padding: '8px',
                  background: isSelected ? 'rgba(100,150,100,0.3)' : 'rgba(255,255,255,0.5)',
                  border: isSelected ? '2px solid #6A9A50' : '2px solid #DDD',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <img
                  src={flower.spriteUrl}
                  alt={flower.name}
                  style={{
                    width: '60px',
                    height: '60px',
                    objectFit: 'contain',
                  }}
                />
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                  }}
                >
                  {flower.name}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: '#666',
                  }}
                >
                  {flower.pricePerStem} 🌼/stem
                </div>
              </div>
            );
          })}
        </div>

        {/* Purchase details */}
        {selectedFlower && (
          <div
            style={{
              padding: '12px',
              background: 'rgba(255,255,255,0.5)',
              borderRadius: '6px',
              marginBottom: '16px',
            }}
          >
            <h3 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
              {selectedFlower && FLOWERS[selectedFlower]?.name}
            </h3>

            {/* Bulk options */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
                marginBottom: '12px',
              }}
            >
              {([1, 5, 10, 20] as BulkOption[]).map((bulk) => {
                const flower = selectedFlower ? FLOWERS[selectedFlower] : null;
                if (!flower) return null;
                const baseCost = flower.pricePerStem * bulk;
                const discount = BULK_DISCOUNTS[bulk];
                const totalCost = Math.round(baseCost * (1 - discount));
                const isBulkSelected = selectedBulk === bulk;

                return (
                  <button
                    key={bulk}
                    onClick={() => setSelectedBulk(bulk)}
                    style={{
                      padding: '8px',
                      background: isBulkSelected ? '#C8B8A0' : '#DDD',
                      color: '#2A1408',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 'bold',
                    }}
                  >
                    <div>{bulk} stems</div>
                    <div>{totalCost} 🌼</div>
                    {discount > 0 && (
                      <div style={{ color: '#6A9A50', fontSize: '10px' }}>
                        -{(discount * 100).toFixed(0)}%
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Buy button */}
            {selectedFlower && FLOWERS[selectedFlower] && (
            <button
              onClick={handleBuyFlowers}
              disabled={coins < Math.round(FLOWERS[selectedFlower]!.pricePerStem * selectedBulk * (1 - BULK_DISCOUNTS[selectedBulk]))}
              style={{
                width: '100%',
                padding: '12px',
                background:
                  coins <
                  Math.round(FLOWERS[selectedFlower]!.pricePerStem * selectedBulk * (1 - BULK_DISCOUNTS[selectedBulk]))
                    ? '#CCC'
                    : '#6A9A50',
                color: '#FFF',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              Buy {selectedBulk} stems
            </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
