import { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { FLOWERS, GREENERY, INITIAL_UNLOCKED_FLOWERS } from '../../constants/flowers';
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
  const checkDailyLimit = useGameStore((s) => s.checkDailyLimit);
  const recordDailyPurchase = useGameStore((s) => s.recordDailyPurchase);
  const dailyPurchases = useGameStore((s) => s.dailyPurchases);

  const [selectedFlower, setSelectedFlower] = useState<string | null>(null);
  const [selectedBulk, setSelectedBulk] = useState<BulkOption>(1);

  const availableFlowers = Array.from(INITIAL_UNLOCKED_FLOWERS);
  const availableGreenery = Object.keys(GREENERY);
  const allAvailable = [...availableFlowers, ...availableGreenery];

  const getItem = (id: string) => FLOWERS[id] || (GREENERY as Record<string, any>)[id];

  const handleBuyFlowers = () => {
    if (!selectedFlower) return;

    const item = getItem(selectedFlower);
    if (!item) return;

    // Check daily limit
    const { canBuy } = checkDailyLimit(selectedFlower, selectedBulk);
    if (!canBuy) {
      RundotGameAPI.analytics.recordCustomEvent('daily_limit_reached', {
        flowerId: selectedFlower,
        attemptedQuantity: selectedBulk,
      });
      return;
    }

    const discount = BULK_DISCOUNTS[selectedBulk];
    const baseCost = item.pricePerStem * selectedBulk;
    const totalCost = Math.round(baseCost * (1 - discount));

    if (coins >= totalCost) {
      if (spendCoins(totalCost) && addStemsToInventory(selectedFlower, selectedBulk)) {
        recordDailyPurchase(selectedFlower, selectedBulk);
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
        {/* Flower & Greenery grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
            gap: '8px',
            marginBottom: '16px',
          }}
        >
          {allAvailable.map((itemId) => {
            const item = getItem(itemId);
            if (!item) return null;

            const isSelected = selectedFlower === itemId;
            const isGreenery = availableGreenery.includes(itemId);

            return (
              <div
                key={itemId}
                onClick={() => setSelectedFlower(itemId)}
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
                  opacity: isGreenery ? 0.9 : 1,
                }}
              >
                <img
                  src={item.spriteUrl}
                  alt={item.name}
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
                  {item.name}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: '#666',
                  }}
                >
                  {item.pricePerStem} 🌼/stem
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
              {selectedFlower && getItem(selectedFlower)?.name}
            </h3>

            {/* Daily limit indicator */}
            {selectedFlower && (
              <div
                style={{
                  fontSize: '12px',
                  color: '#666',
                  marginBottom: '12px',
                  padding: '8px',
                  background: 'rgba(0,0,0,0.05)',
                  borderRadius: '4px',
                }}
              >
                <div>📊 Daily limit: {dailyPurchases[selectedFlower] || 0}/50 stems bought</div>
                <div style={{ color: (dailyPurchases[selectedFlower] || 0) >= 40 ? '#c45d5d' : '#666' }}>
                  Remaining today: {Math.max(0, 50 - (dailyPurchases[selectedFlower] || 0))} stems
                </div>
              </div>
            )}

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
                const item = selectedFlower ? getItem(selectedFlower) : null;
                if (!item) return null;
                const baseCost = item.pricePerStem * bulk;
                const discount = BULK_DISCOUNTS[bulk];
                const totalCost = Math.round(baseCost * (1 - discount));
                const isBulkSelected = selectedBulk === bulk;

                // Calculate remaining limit after this purchase
                const alreadyBought = dailyPurchases[selectedFlower!] || 0;
                const remainingAfterPurchase = 50 - (alreadyBought + bulk);
                const canAffordThisBulk = remainingAfterPurchase >= 0;

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
                      opacity: canAffordThisBulk ? 1 : 0.5,
                    }}
                  >
                    <div>{bulk} stems</div>
                    <div>{totalCost} 🌼</div>
                    {discount > 0 && (
                      <div style={{ color: '#6A9A50', fontSize: '10px' }}>
                        -{(discount * 100).toFixed(0)}%
                      </div>
                    )}
                    <div style={{ color: canAffordThisBulk ? '#666' : '#c45d5d', fontSize: '9px', marginTop: '4px' }}>
                      {canAffordThisBulk ? `→ ${remainingAfterPurchase}/50` : '❌ exceeds limit'}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Buy button */}
            {selectedFlower && getItem(selectedFlower) && (
            (() => {
              const item = getItem(selectedFlower)!;
              const totalCost = Math.round(item.pricePerStem * selectedBulk * (1 - BULK_DISCOUNTS[selectedBulk]));
              const { canBuy } = checkDailyLimit(selectedFlower, selectedBulk);
              const insufficientCoins = coins < totalCost;
              const isDisabled = insufficientCoins || !canBuy;
              const buttonText = !canBuy ? '❌ Daily limit reached' : insufficientCoins ? '❌ Not enough coins' : `💚 Buy ${selectedBulk} stems`;

              return (
                <button
                  onClick={handleBuyFlowers}
                  disabled={isDisabled}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: isDisabled ? '#CCC' : '#6A9A50',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                  }}
                >
                  {buttonText}
                </button>
              );
            })()
            )}
          </div>
        )}
      </div>
    </div>
  );
}
