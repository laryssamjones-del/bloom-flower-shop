import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { FLOWERS, GREENERY, INITIAL_UNLOCKED_FLOWERS } from '../../constants/flowers';
import { MYSTERY_BOX_COST_RUN_BUCKS } from '../../data/mysteryBox';
import RundotGameAPI from '@series-inc/rundot-game-sdk/api';
import { ScreenNavigation } from '../components/ScreenNavigation';

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
  const premiumCurrency = useGameStore((s) => s.premiumCurrency);
  const addStemsToInventory = useGameStore((s) => s.addStemsToInventory);
  const spendCoins = useGameStore((s) => s.spendCoins);
  const checkDailyLimit = useGameStore((s) => s.checkDailyLimit);
  const recordDailyPurchase = useGameStore((s) => s.recordDailyPurchase);
  const purchaseMysteryBox = useGameStore((s) => s.purchaseMysteryBox);
  const dailyPurchases = useGameStore((s) => s.dailyPurchases);
  const shoppingForOrderId = useGameStore((s) => s.shoppingForOrderId);
  const getOrderForShopping = useGameStore((s) => s.getOrderForShopping);
  const setShoppingForOrderId = useGameStore((s) => s.setShoppingForOrderId);

  const [selectedFlower, setSelectedFlower] = useState<string | null>(null);
  const [selectedBulk, setSelectedBulk] = useState<number>(1);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [misterySuccessMessage, setMysterySuccessMessage] = useState<string | null>(null);
  const [countdownDisplay, setCountdownDisplay] = useState<string>('15:00');
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown timer effect
  useEffect(() => {
    countdownIntervalRef.current = setInterval(() => {
      const nextDeliveryTime = localStorage.getItem('nextDeliveryTime');
      if (nextDeliveryTime) {
        const now = Date.now();
        const remaining = Math.max(0, parseInt(nextDeliveryTime) - now);
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        setCountdownDisplay(`${minutes}:${String(seconds).padStart(2, '0')}`);
      }
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // Build map of needed flowers when shopping for an order
  const neededFlowersMap = (() => {
    if (!shoppingForOrderId) return new Map<string, number>();
    const order = getOrderForShopping(shoppingForOrderId);
    if (!order) return new Map<string, number>();

    const map = new Map<string, number>();
    order.requiredStems.forEach((stem) => {
      map.set(stem.flowerId, (map.get(stem.flowerId) || 0) + 1);
    });
    return map;
  })();

  // Clear shopping context on unmount
  useEffect(() => {
    return () => {
      if (shoppingForOrderId) {
        setShoppingForOrderId(undefined);
      }
    };
  }, []);

  const availableFlowers = Array.from(INITIAL_UNLOCKED_FLOWERS);
  const availableGreenery = Object.keys(GREENERY);

  const getItem = (id: string) => FLOWERS[id] || (GREENERY as Record<string, any>)[id];

  // Sort all items alphabetically by name
  const allAvailable = [...availableFlowers, ...availableGreenery].sort((a, b) => {
    const itemA = getItem(a);
    const itemB = getItem(b);
    if (!itemA || !itemB) return 0;
    return itemA.name.localeCompare(itemB.name);
  });

  // Get discount for any quantity
  const getDiscount = (qty: number): number => {
    if (qty >= 20) return BULK_DISCOUNTS[20];
    if (qty >= 10) return BULK_DISCOUNTS[10];
    if (qty >= 5) return BULK_DISCOUNTS[5];
    return 0;
  };

  const handleBuyFlowers = (customQuantity?: number) => {
    if (!selectedFlower) return;

    const item = getItem(selectedFlower);
    if (!item) return;

    const quantityToBuy = customQuantity || selectedBulk;

    // Check daily limit
    const { canBuy } = checkDailyLimit(selectedFlower, quantityToBuy);
    if (!canBuy) {
      RundotGameAPI.analytics.recordCustomEvent('daily_limit_reached', {
        flowerId: selectedFlower,
        attemptedQuantity: quantityToBuy,
      });
      return;
    }

    const discount = getDiscount(quantityToBuy);
    const baseCost = item.pricePerStem * quantityToBuy;
    const totalCost = Math.round(baseCost * (1 - discount));

    if (coins >= totalCost) {
      if (spendCoins(totalCost) && addStemsToInventory(selectedFlower, quantityToBuy)) {
        recordDailyPurchase(selectedFlower, quantityToBuy);

        // Show success message
        const itemName = item.name;
        const successMsg = `✅ Bought ${quantityToBuy} ${itemName} for ${totalCost} 🌼`;
        setSuccessMessage(successMsg);

        // Clear success message after 2 seconds
        setTimeout(() => setSuccessMessage(null), 2000);

        RundotGameAPI.analytics.recordCustomEvent('flowers_purchased', {
          flowerId: selectedFlower,
          quantity: quantityToBuy,
          cost: totalCost,
          discount: discount > 0 ? `${(discount * 100).toFixed(0)}%` : 'none',
        });
      }
    }
  };

  const handleBuyAllItems = () => {
    let totalCost = 0;
    let itemsBought = 0;
    const purchases: { itemId: string; cost: number }[] = [];

    // Try to buy 1 of each item
    for (const itemId of allAvailable) {
      const item = getItem(itemId);
      if (!item) continue;

      const quantityToBuy = 1;
      const { canBuy } = checkDailyLimit(itemId, quantityToBuy);

      if (canBuy && coins >= totalCost + item.pricePerStem) {
        totalCost += item.pricePerStem;
        purchases.push({ itemId, cost: item.pricePerStem });
      }
    }

    // Execute all purchases
    if (purchases.length > 0 && spendCoins(totalCost)) {
      for (const { itemId } of purchases) {
        addStemsToInventory(itemId, 1);
        recordDailyPurchase(itemId, 1);
        itemsBought++;
      }

      // Show success message
      const successMsg = `✅ Bought 1 of ${itemsBought} items for ${totalCost} 🌼`;
      setSuccessMessage(successMsg);
      setTimeout(() => setSuccessMessage(null), 2000);

      RundotGameAPI.analytics.recordCustomEvent('buy_all_items', {
        itemCount: itemsBought,
        totalCost: totalCost,
      });
    }
  };

  const handlePurchaseMysteryBox = () => {
    if (premiumCurrency < MYSTERY_BOX_COST_RUN_BUCKS) {
      return;
    }

    if (purchaseMysteryBox()) {
      const successMsg = `✨ Mystery Box unlocked! Check your inventory 🎁`;
      setMysterySuccessMessage(successMsg);
      setTimeout(() => setMysterySuccessMessage(null), 3000);

      RundotGameAPI.analytics.recordCustomEvent('mystery_box_purchased', {
        cost: MYSTERY_BOX_COST_RUN_BUCKS,
      });
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
        <h1 style={{ margin: 0, fontSize: '18px' }}>🛍️ Shop</h1>
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

      {/* Quick Navigation */}
      <ScreenNavigation currentScreen="wholesale" />

      {/* Special delivery countdown */}
      <div
        style={{
          padding: '10px 16px',
          background: 'rgba(255, 107, 157, 0.95)',
          color: '#FFF',
          fontSize: '13px',
          fontWeight: 'bold',
          textAlign: 'center',
          borderBottom: '2px solid rgba(255, 107, 157, 0.7)',
        }}
      >
        🚚 Special delivery truck in: {countdownDisplay}
      </div>

      {/* Order context header */}
      {shoppingForOrderId && (() => {
        const order = getOrderForShopping(shoppingForOrderId);
        if (!order) return null;
        return (
          <div
            style={{
              padding: '12px 16px',
              background: 'linear-gradient(135deg, rgba(52, 152, 219, 0.2), rgba(149, 165, 166, 0.2))',
              borderBottom: '2px solid #3498DB',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div>
              <div style={{ fontSize: '12px', color: '#555', fontWeight: 'bold' }}>
                📋 Shopping for order:
              </div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#2C3E50', marginTop: '2px' }}>
                {order.recipeName} ({order.customerMood})
              </div>
            </div>
            <button
              onClick={() => setShoppingForOrderId(undefined)}
              style={{
                padding: '6px 10px',
                background: '#6A9A50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold',
              }}
            >
              ✓ Done
            </button>
          </div>
        );
      })()}

      {/* Success message */}
      {successMessage && (
        <div
          style={{
            padding: '12px 16px',
            background: '#d4f1d4',
            color: '#2A5A2A',
            fontSize: '14px',
            fontWeight: 'bold',
            textAlign: 'center',
            borderBottom: '2px solid #A8D5A8',
            transition: 'opacity 0.3s ease-in-out',
          }}
        >
          {successMessage}
        </div>
      )}

      {/* Mystery Box Success Message */}
      {misterySuccessMessage && (
        <div
          style={{
            padding: '12px 16px',
            background: 'linear-gradient(135deg, rgba(155, 89, 182, 0.2), rgba(52, 152, 219, 0.2))',
            color: '#9B59B6',
            fontSize: '14px',
            fontWeight: 'bold',
            textAlign: 'center',
            borderBottom: '2px solid #9B59B6',
            transition: 'opacity 0.3s ease-in-out',
          }}
        >
          {misterySuccessMessage}
        </div>
      )}

      {/* Main content - Flower & Greenery grid */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '12px',
          paddingBottom: selectedFlower ? '300px' : '12px', // Make room for fixed purchase panel
        }}
      >
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
            const neededQuantity = neededFlowersMap.get(itemId);

            return (
              <div
                key={itemId}
                onClick={() => {
                  if (isSelected) {
                    setSelectedFlower(null);
                  } else {
                    setSelectedFlower(itemId);
                    setSelectedBulk(1);
                  }
                }}
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
                  position: 'relative',
                }}
              >
                {neededQuantity !== undefined && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '4px',
                      right: '4px',
                      background: '#E74C3C',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      border: '1px solid white',
                    }}
                  >
                    {neededQuantity}
                  </div>
                )}
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

        {/* Buy All Items Button */}
        {(() => {
          let totalCostForAll = 0;
          for (const itemId of allAvailable) {
            const item = getItem(itemId);
            if (item) {
              totalCostForAll += item.pricePerStem;
            }
          }

          return (
            <button
              onClick={handleBuyAllItems}
              style={{
                width: '100%',
                padding: '14px',
                background: '#E8A87C',
                color: '#FFF',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                marginTop: '12px',
              }}
            >
              🌸 Buy 1 of Each ({totalCostForAll} 🌼)
            </button>
          );
        })()}

        {/* Mystery Box Section — hidden until ready */}
        {false && <div
          style={{
            marginTop: '24px',
            padding: '16px',
            background: 'linear-gradient(135deg, rgba(155, 89, 182, 0.15), rgba(52, 152, 219, 0.15))',
            borderRadius: '10px',
            border: '2px solid #9B59B6',
          }}
        >
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
            🎁 Deluxe Mystery Box
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '12px', lineHeight: 1.4 }}>
            Unlock a random exclusive bouquet! Each mystery box contains one special, rare bouquet worth a fortune when sold.
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
              padding: '8px',
              background: 'rgba(255,255,255,0.6)',
              borderRadius: '6px',
            }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#333' }}>Cost</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#9B59B6' }}>
                {MYSTERY_BOX_COST_RUN_BUCKS} 💎 Run Bucks
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#333' }}>You have</div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: premiumCurrency >= MYSTERY_BOX_COST_RUN_BUCKS ? '#6A9A50' : '#C0392B',
                }}
              >
                {premiumCurrency} 💎
              </div>
            </div>
          </div>
          <button
            onClick={handlePurchaseMysteryBox}
            disabled={premiumCurrency < MYSTERY_BOX_COST_RUN_BUCKS}
            style={{
              width: '100%',
              padding: '12px',
              background:
                premiumCurrency < MYSTERY_BOX_COST_RUN_BUCKS ? '#CCC' : 'linear-gradient(135deg, #9B59B6, #3498DB)',
              color: '#FFF',
              border: 'none',
              borderRadius: '6px',
              cursor: premiumCurrency < MYSTERY_BOX_COST_RUN_BUCKS ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              boxShadow: premiumCurrency >= MYSTERY_BOX_COST_RUN_BUCKS ? '0 4px 12px rgba(155, 89, 182, 0.3)' : 'none',
            }}
          >
            {premiumCurrency < MYSTERY_BOX_COST_RUN_BUCKS ? '❌ Not enough Run Bucks' : '🎲 Unlock Mystery Box'}
          </button>
        </div>}
      </div>

      {/* Fixed Purchase Details Panel */}
      {selectedFlower && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '12px',
            background: 'rgba(255,255,255,0.95)',
            borderTop: '2px solid rgba(0,0,0,0.1)',
            maxHeight: '280px',
            overflow: 'auto',
            zIndex: 10,
          }}
        >
          <div
            style={{
              padding: '12px',
              background: 'rgba(255,255,255,0.5)',
              borderRadius: '6px',
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

            {/* Custom quantity controls */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px',
                padding: '12px',
                background: 'rgba(0,0,0,0.05)',
                borderRadius: '4px',
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', flex: 1 }}>
                Custom qty:
              </span>
              <button
                onClick={() => setSelectedBulk(Math.max(1, selectedBulk - 1))}
                style={{
                  width: '36px',
                  height: '36px',
                  padding: 0,
                  background: '#DDD',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '18px',
                  fontWeight: 'bold',
                }}
              >
                ➖
              </button>
              <div
                style={{
                  minWidth: '60px',
                  textAlign: 'center',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#2A1408',
                }}
              >
                {selectedBulk} stems
              </div>
              <button
                onClick={() => {
                  const maxRemaining = Math.max(0, 50 - (dailyPurchases[selectedFlower!] || 0));
                  setSelectedBulk(Math.min(maxRemaining, selectedBulk + 1));
                }}
                style={{
                  width: '36px',
                  height: '36px',
                  padding: 0,
                  background: (selectedBulk + 1) > Math.max(0, 50 - (dailyPurchases[selectedFlower!] || 0)) ? '#CCC' : '#DDD',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: (selectedBulk + 1) > Math.max(0, 50 - (dailyPurchases[selectedFlower!] || 0)) ? 'not-allowed' : 'pointer',
                  fontSize: '18px',
                  fontWeight: 'bold',
                }}
              >
                ➕
              </button>
            </div>

            {/* Buy buttons */}
            {selectedFlower && getItem(selectedFlower) && (
            (() => {
              const item = getItem(selectedFlower)!;
              const alreadyBought = dailyPurchases[selectedFlower] || 0;
              const maxAvailable = 50 - alreadyBought;

              // Current selected amount
              const discount = getDiscount(selectedBulk);
              const totalCost = Math.round(item.pricePerStem * selectedBulk * (1 - discount));
              const { canBuy } = checkDailyLimit(selectedFlower, selectedBulk);
              const insufficientCoins = coins < totalCost;
              const isDisabled = insufficientCoins || !canBuy;
              const buttonText = !canBuy ? '❌ Daily limit reached' : insufficientCoins ? '❌ Not enough coins' : `💚 Buy ${selectedBulk} stems`;

              // Buy all calculation
              const buyAllDiscount = getDiscount(maxAvailable);
              const buyAllCost = Math.round(item.pricePerStem * maxAvailable * (1 - buyAllDiscount));
              const canBuyAll = checkDailyLimit(selectedFlower, maxAvailable).canBuy;
              const insufficientCoinsForAll = coins < buyAllCost;
              const isBuyAllDisabled = insufficientCoinsForAll || !canBuyAll || maxAvailable <= 0;

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    onClick={() => handleBuyFlowers()}
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

                  {maxAvailable > 0 && (
                    <button
                      onClick={() => handleBuyFlowers(maxAvailable)}
                      disabled={isBuyAllDisabled}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: isBuyAllDisabled ? '#CCC' : '#C8956E',
                        color: '#FFF',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isBuyAllDisabled ? 'not-allowed' : 'pointer',
                        fontSize: '13px',
                        fontWeight: 'bold',
                      }}
                    >
                      {insufficientCoinsForAll ? `❌ Can't afford all (${buyAllCost} 🌼)` : `🌟 Buy All ${maxAvailable} (${buyAllCost} 🌼)`}
                    </button>
                  )}
                </div>
              );
            })()
            )}
          </div>
        </div>
      )}
    </div>
  );
}
