import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { FLOWERS, GREENERY } from '../../constants/flowers';
import { PETAL_COINS_PACKAGES } from '../../data/petalCoinsPackages';
import { EXCLUSIVE_BOX_COSTS } from '../../data/exclusiveBouquets';
import RundotGameAPI from '@series-inc/rundot-game-sdk/api';
import { ScreenNavigation } from '../components/ScreenNavigation';
import {
  generateSpecialDelivery,
  type SpecialDelivery,
} from '../components/SpecialDeliveryOverlay';
import { openPlatformStore, getRunbucksBalance } from '../../services/iap';
import ExclusiveBoxRevealOverlay from './ExclusiveBoxRevealOverlay';
import deliveryTruckImage from '../../assets/delivery-truck.png';
import { Bouquet } from '../../types';

type BulkOption = 1 | 5 | 10 | 20;

const BULK_DISCOUNTS: Record<BulkOption, number> = {
  1: 0,
  5: 0.1,
  10: 0.2,
  20: 0.3,
};

const STORAGE_UPGRADE_SMALL = { slots: 25, cost: 15 };
const STORAGE_UPGRADE_LARGE = { slots: 50, cost: 25 };
const MAX_INVENTORY_CAPACITY = 450;

export function WholesaleMarketScreen() {
  const setCurrentScreen = useGameStore((s) => s.setCurrentScreen);
  const coins = useGameStore((s) => s.coins);
  const premiumCurrency = useGameStore((s) => s.premiumCurrency);
  const addStemsToInventory = useGameStore((s) => s.addStemsToInventory);
  const spendCoins = useGameStore((s) => s.spendCoins);
  const checkDailyLimit = useGameStore((s) => s.checkDailyLimit);
  const recordDailyPurchase = useGameStore((s) => s.recordDailyPurchase);
  const purchaseExclusiveBox = useGameStore((s) => s.purchaseExclusiveBox);
  const setPendingBoxReveal = useGameStore((s) => s.setPendingBoxReveal);
  const pendingBoxReveal = useGameStore((s) => s.pendingBoxReveal);
  const dailyPurchases = useGameStore((s) => s.dailyPurchases);
  const shoppingForOrderId = useGameStore((s) => s.shoppingForOrderId);
  const getOrderForShopping = useGameStore((s) => s.getOrderForShopping);
  const setShoppingForOrderId = useGameStore((s) => s.setShoppingForOrderId);
  const neededFlowerId = useGameStore((s) => s.neededFlowerId);
  const neededFlowerQuantity = useGameStore((s) => s.neededFlowerQuantity);
  const neededFlowersList = useGameStore((s) => s.neededFlowersList);
  const setNeededFlower = useGameStore((s) => s.setNeededFlower);
  const setNeededFlowers = useGameStore((s) => s.setNeededFlowers);
  const inventory = useGameStore((s) => s.inventory);
  const inventoryCapacity = useGameStore((s) => s.inventoryCapacity);

  const [selectedFlower, setSelectedFlower] = useState<string | null>(null);
  const [selectedBulk, setSelectedBulk] = useState<number>(1);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deliverySuccessMessage, setDeliverySuccessMessage] = useState<string | null>(null);
  const [countdownDisplay, setCountdownDisplay] = useState<string>('4:00:00');
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [storeError, setStoreError] = useState<string | null>(null);
  const [showBoxReveal, setShowBoxReveal] = useState(false);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const SPEEDUP_DELIVERY_COST = 5;

  // Active delivery state — this is where the delivery overlay lives
  const [activeDelivery, setActiveDelivery] = useState<SpecialDelivery | null>(() => {
    const saved = localStorage.getItem('activeDelivery');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.flowers) && Array.isArray(parsed.bouquets) && parsed.flowers.length > 0 && parsed.bouquets.length > 0) {
          return parsed;
        }
      } catch {
        localStorage.removeItem('activeDelivery');
      }
    }
    return null;
  });
  const [showDeliveryModal, setShowDeliveryModal] = useState<boolean>(() => !!localStorage.getItem('activeDelivery'));

  // Countdown timer effect
  useEffect(() => {
    countdownIntervalRef.current = setInterval(() => {
      const nextDeliveryTime = localStorage.getItem('nextDeliveryTime');
      if (nextDeliveryTime) {
        const now = Date.now();
        const remaining = Math.max(0, parseInt(nextDeliveryTime) - now);
        const hours = Math.floor(remaining / 3600000);
        const minutes = Math.floor((remaining % 3600000) / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        setCountdownDisplay(`${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
      }
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // Sync activeDelivery to localStorage
  useEffect(() => {
    if (activeDelivery) {
      localStorage.setItem('activeDelivery', JSON.stringify(activeDelivery));
    } else {
      localStorage.removeItem('activeDelivery');
    }
  }, [activeDelivery]);

  // When Market opens, show overlay if delivery is waiting or timer has expired
  useEffect(() => {
    if (activeDelivery) {
      setShowDeliveryModal(true);
      return;
    }
    const nextDeliveryTime = localStorage.getItem('nextDeliveryTime');
    if (nextDeliveryTime) {
      const now = Date.now();
      if (now >= parseInt(nextDeliveryTime)) {
        const newDelivery = generateSpecialDelivery();
        if (newDelivery.flowers.length > 0 && newDelivery.bouquets.length > 0) {
          setActiveDelivery(newDelivery);
          setShowDeliveryModal(true);
          RundotGameAPI.analytics.recordCustomEvent('special_delivery_arrived', {
            deliveryId: newDelivery.id,
          });
        }
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Build map of needed flowers when shopping for an order or arrangement
  const neededFlowersMap = (() => {
    const map = new Map<string, number>();

    // From order shopping
    if (shoppingForOrderId) {
      const order = getOrderForShopping(shoppingForOrderId);
      if (order) {
        order.requiredStems.forEach((stem) => {
          map.set(stem.flowerId, (map.get(stem.flowerId) || 0) + 1);
        });
      }
    }

    // From arrangement shopping (multiple flowers)
    if (neededFlowersList && neededFlowersList.length > 0) {
      neededFlowersList.forEach((item: { flowerId: string; quantity: number }) => {
        map.set(item.flowerId, item.quantity);
      });
    } else if (neededFlowerId && neededFlowerQuantity) {
      // Fallback to single flower (backward compatibility)
      map.set(neededFlowerId, neededFlowerQuantity);
    }

    return map;
  })();

  // Auto-return to arrangement when all ingredients for an order are purchased
  useEffect(() => {
    // Only auto-return if shopping for an order
    if (!shoppingForOrderId) return;

    // Check if all needed flowers are in inventory
    let allIngredientsObtained = true;
    for (const [flowerId, neededQty] of neededFlowersMap) {
      const inventoryItem = inventory.find((item) => item.flowerId === flowerId);
      const haveQty = inventoryItem ? inventoryItem.quantity : 0;
      if (haveQty < neededQty) {
        allIngredientsObtained = false;
        break;
      }
    }

    // If all ingredients are obtained, auto-return to arrangement
    if (allIngredientsObtained && neededFlowersMap.size > 0) {
      // Small delay to ensure UI updates smoothly
      setTimeout(() => {
        // Set up the recipe for the order before navigating
        const state = useGameStore.getState();
        const order = state.getOrderForShopping(shoppingForOrderId);
        if (order) {
          state.selectRecipe(order.recipeId, shoppingForOrderId);
        }
        setCurrentScreen('arrangement');
      }, 500);
    }
  }, [inventory, neededFlowersMap, shoppingForOrderId, setCurrentScreen]);

  // Clear shopping context on unmount
  useEffect(() => {
    return () => {
      if (shoppingForOrderId) {
        setShoppingForOrderId(undefined);
      }
      if (neededFlowerId) {
        setNeededFlower(undefined, 0);
      }
      if (neededFlowersList && neededFlowersList.length > 0) {
        setNeededFlowers([]);
      }
    };
  }, []);

  // Track premium modal open
  useEffect(() => {
    if (showPremiumModal) {
      RundotGameAPI.analytics.recordCustomEvent('premium_modal_opened', {
        currentBalance: premiumCurrency,
      });
    }
  }, [showPremiumModal]);

  // All flowers and greenery are available for purchase in the shop
  const availableFlowers = Object.keys(FLOWERS);
  const availableGreenery = Object.keys(GREENERY);

  const getItem = (id: string) => FLOWERS[id] || (GREENERY as Record<string, any>)[id];

  // Sort all items alphabetically by name
  const allAvailable = [
    ...availableFlowers,
    ...availableGreenery,
  ].sort((a, b) => {
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

    // Check inventory space
    const state = useGameStore.getState();
    const currentStemsTotal = state.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
    if (currentStemsTotal + quantityToBuy > inventoryCapacity) {
      setStoreError(`❌ Inventory full! You have ${inventoryCapacity} slots. Upgrade your storage or sell items.`);
      setTimeout(() => setStoreError(null), 4000);
      RundotGameAPI.analytics.recordCustomEvent('inventory_full_blocked', {
        flowerId: selectedFlower,
        attemptedQuantity: quantityToBuy,
        currentCapacity: inventoryCapacity,
        currentUsed: currentStemsTotal,
      });
      return;
    }

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

        RundotGameAPI.analytics.recordCustomEvent('flowers_purchased', {
          flowerId: selectedFlower,
          quantity: quantityToBuy,
          cost: totalCost,
          discount: discount > 0 ? `${(discount * 100).toFixed(0)}%` : 'none',
        });

        // Check if all needed ingredients for bouquet arrangement are now satisfied
        if (neededFlowersList && neededFlowersList.length > 0) {
          const state = useGameStore.getState();
          const allNeeded = neededFlowersList.every((needed) => {
            const currentInventory = state.inventory.find((inv) => inv.flowerId === needed.flowerId)?.quantity || 0;
            return currentInventory >= needed.quantity;
          });

          if (allNeeded) {
            // All ingredients bought! Return to arrangement screen
            setNeededFlowers([]);
            setCurrentScreen('arrangement');
            return;
          }
        }

        // Clear success message after 2 seconds (only if not returning to arrangement)
        setTimeout(() => setSuccessMessage(null), 2000);
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

  const INSTANT_DELIVERY_COST = 75;
  const DELUXE_DELIVERY_COST = 150;

  const handleBuyInstantDelivery = () => {
    if (premiumCurrency < INSTANT_DELIVERY_COST) {
      return;
    }

    // Deduct run bucks
    const state = useGameStore.getState();
    if (state.premiumCurrency >= INSTANT_DELIVERY_COST) {
      // Generate delivery and save to localStorage (15 flowers + 2 deluxe bouquets at 3x price)
      const delivery = generateSpecialDelivery(15, 2, 'deluxe', true, 3);
      localStorage.setItem('activeDelivery', JSON.stringify(delivery));

      // Deduct the cost directly via Zustand
      useGameStore.setState((s) => ({
        premiumCurrency: s.premiumCurrency - INSTANT_DELIVERY_COST,
        lastUpdated: Date.now(),
      }));

      // Schedule next delivery timer
      const nextDeliveryTime = Date.now() + 4 * 60 * 60 * 1000;
      localStorage.setItem('nextDeliveryTime', nextDeliveryTime.toString());

      const successMsg = `🚚 Delivery truck incoming! ${INSTANT_DELIVERY_COST} 💎 Run Bucks spent`;
      setDeliverySuccessMessage(successMsg);
      setTimeout(() => setDeliverySuccessMessage(null), 3000);

      RundotGameAPI.analytics.recordCustomEvent('instant_delivery_purchased', {
        cost: INSTANT_DELIVERY_COST,
        type: 'premium',
      });

      // Navigate back to shop after a short delay so they can see the message
      setTimeout(() => {
        setCurrentScreen('shop');
      }, 500);
    }
  };

  const handleBuyDeluxeDelivery = () => {
    if (premiumCurrency < DELUXE_DELIVERY_COST) {
      return;
    }

    // Deduct run bucks
    const state = useGameStore.getState();
    if (state.premiumCurrency >= DELUXE_DELIVERY_COST) {
      // Generate delivery and save to localStorage (45 flowers + 8 deluxe bouquets at 2x price)
      const delivery = generateSpecialDelivery(45, 8, 'deluxe', true, 2);
      localStorage.setItem('activeDelivery', JSON.stringify(delivery));

      // Deduct the cost directly via Zustand
      useGameStore.setState((s) => ({
        premiumCurrency: s.premiumCurrency - DELUXE_DELIVERY_COST,
        lastUpdated: Date.now(),
      }));

      // Schedule next delivery timer
      const nextDeliveryTime = Date.now() + 4 * 60 * 60 * 1000;
      localStorage.setItem('nextDeliveryTime', nextDeliveryTime.toString());

      const successMsg = `🚚 DELUXE delivery truck incoming! ${DELUXE_DELIVERY_COST} 💎 Run Bucks spent`;
      setDeliverySuccessMessage(successMsg);
      setTimeout(() => setDeliverySuccessMessage(null), 3000);

      RundotGameAPI.analytics.recordCustomEvent('instant_delivery_purchased', {
        cost: DELUXE_DELIVERY_COST,
        type: 'deluxe',
      });

      // Navigate back to shop after a short delay so they can see the message
      setTimeout(() => {
        setCurrentScreen('shop');
      }, 500);
    }
  };

  const handleSpeedupDelivery = () => {
    if (premiumCurrency < SPEEDUP_DELIVERY_COST) {
      return;
    }

    // Deduct run bucks
    const state = useGameStore.getState();
    if (state.premiumCurrency >= SPEEDUP_DELIVERY_COST) {
      // Set delivery time to now (delivery arrives immediately)
      localStorage.setItem('nextDeliveryTime', Date.now().toString());

      // Deduct the cost directly via Zustand
      useGameStore.setState((s) => ({
        premiumCurrency: s.premiumCurrency - SPEEDUP_DELIVERY_COST,
        lastUpdated: Date.now(),
      }));

      const successMsg = `⚡ Delivery sped up! ${SPEEDUP_DELIVERY_COST} 💎 Run Bucks spent`;
      setDeliverySuccessMessage(successMsg);
      setTimeout(() => setDeliverySuccessMessage(null), 3000);

      RundotGameAPI.analytics.recordCustomEvent('delivery_speedup_purchased', {
        cost: SPEEDUP_DELIVERY_COST,
      });

      // Reset countdown to trigger delivery
      setCountdownDisplay('0:00:00');
    }
  };

  const handleBuyStorageUpgrade = (slots: number, cost: number) => {
    if (premiumCurrency < cost) {
      return;
    }

    const state = useGameStore.getState();
    const newCapacity = Math.min(state.inventoryCapacity + slots, MAX_INVENTORY_CAPACITY);

    if (newCapacity > MAX_INVENTORY_CAPACITY) {
      // At max capacity
      return;
    }

    // Deduct run bucks and increase inventory capacity
    useGameStore.setState((s) => ({
      premiumCurrency: s.premiumCurrency - cost,
      inventoryCapacity: newCapacity,
      lastUpdated: Date.now(),
    }));

    const successMsg = `📦 +${slots} Inventory Slots! ${cost} 💎 Run Bucks spent`;
    setSuccessMessage(successMsg);
    setTimeout(() => setSuccessMessage(null), 3000);

    RundotGameAPI.analytics.recordCustomEvent('inventory_storage_purchased', {
      slots,
      cost,
      newCapacity,
    });
  };

  const handleBuyPetalCoinsPackage = (packageId: string) => {
    const pkg = PETAL_COINS_PACKAGES.find((p) => p.id === packageId);
    if (!pkg) return;

    if (premiumCurrency < pkg.cost) {
      return;
    }

    // Deduct run bucks
    const state = useGameStore.getState();
    if (state.premiumCurrency >= pkg.cost) {
      // Add coins to inventory
      useGameStore.setState((s) => ({
        premiumCurrency: s.premiumCurrency - pkg.cost,
        coins: s.coins + pkg.coins,
        lastUpdated: Date.now(),
      }));

      const successMsg = `✨ ${pkg.emoji} ${pkg.coins} Petal Coins added! ${pkg.cost} 💎 Run Bucks spent`;
      setSuccessMessage(successMsg);
      setTimeout(() => setSuccessMessage(null), 3000);

      RundotGameAPI.analytics.recordCustomEvent('petal_coins_purchased', {
        packageId: packageId,
        packageName: pkg.name,
        coins: pkg.coins,
        cost: pkg.cost,
      });
    }
  };

  const handleBuyExclusiveBox = (quantity: 1 | 2 | 3) => {
    if (purchaseExclusiveBox(quantity)) {
      RundotGameAPI.analytics.recordCustomEvent('exclusive_box_purchased', {
        quantity: quantity,
        cost: EXCLUSIVE_BOX_COSTS[quantity],
        remainingRunBucks: premiumCurrency - EXCLUSIVE_BOX_COSTS[quantity],
      });
      setShowBoxReveal(true);
    }
  };

  // Show reveal overlay when pending box reveal is set
  useEffect(() => {
    if (pendingBoxReveal && pendingBoxReveal.length > 0) {
      setShowBoxReveal(true);
    }
  }, [pendingBoxReveal]);

  const handleRevealComplete = () => {
    setShowBoxReveal(false);
    setPendingBoxReveal(undefined);
  };

  const handleDeliveryAccept = (delivery: SpecialDelivery) => {
    const state = useGameStore.getState();
    const spendCoinsLocal = state.spendCoins;
    const addStemsToInventoryLocal = state.addStemsToInventory;
    const addBouquetToShelf = state.addBouquetToShelf;
    const currentShelfBouquets = state.shelfBouquets;
    const currentShelfCapacity = state.shelfCapacity;

    const DELIVERY_COST = 65;
    const isGift = delivery.isFirstTimeGift ?? false;

    if (!isGift && !spendCoinsLocal(DELIVERY_COST)) {
      RundotGameAPI.analytics.recordCustomEvent('special_delivery_rejected', {
        reason: 'insufficient_coins',
        deliveryId: delivery.id,
      });
      setActiveDelivery(null);
      return;
    }

    for (const { flowerId, quantity } of delivery.flowers) {
      addStemsToInventoryLocal(flowerId, quantity);
    }

    let shelfSpaceLeft = currentShelfCapacity - currentShelfBouquets.length;
    const isPremium = delivery.isPremiumDelivery ?? false;
    const priceMultiplier = delivery.priceMultiplier ?? (isPremium ? 3 : 1);

    for (const bouquetRecipe of delivery.bouquets) {
      const bouquetToAdd: Bouquet = {
        id: `delivery-bouquet-${Date.now()}-${Math.random()}`,
        stems: bouquetRecipe.ingredients.flatMap((ing, idx) =>
          Array.from({ length: ing.quantity }, (_, i) => ({
            flowerId: ing.flowerId,
            order: idx * 10 + i,
          }))
        ),
        wrappingPaper: 'plain-white',
        ribbonColor: 'blush',
        sellPrice: Math.round(bouquetRecipe.sellPrice * priceMultiplier),
        thumbnailUrl: bouquetRecipe.imageUrl,
        createdAt: Date.now(),
        recipeName: bouquetRecipe.name,
        fromPremiumDelivery: isPremium,
        source: 'delivery',
      };

      if (shelfSpaceLeft > 0) {
        addBouquetToShelf(bouquetToAdd);
        shelfSpaceLeft--;
      } else {
        useGameStore.setState((s) => ({
          pendingBouquets: [...s.pendingBouquets, bouquetToAdd],
          lastUpdated: Date.now(),
        }));
      }
    }

    RundotGameAPI.analytics.recordCustomEvent('special_delivery_accepted', {
      deliveryId: delivery.id,
      flowerCount: delivery.flowers.reduce((sum, f) => sum + f.quantity, 0),
      bouquetCount: delivery.bouquets.length,
      isPremiumDelivery: isPremium,
      isFirstTimeGift: isGift,
    });

    setShowDeliveryModal(false);
    setActiveDelivery(null);
    // Reset the 4-hour timer
    localStorage.removeItem('nextDeliveryTime');
    const nextTime = Date.now() + 4 * 60 * 60 * 1000;
    localStorage.setItem('nextDeliveryTime', nextTime.toString());
    setCountdownDisplay('4:00:00');
  };

  const handleDeliveryDeny = () => {
    if (activeDelivery) {
      RundotGameAPI.analytics.recordCustomEvent('special_delivery_denied', {
        deliveryId: activeDelivery.id,
      });
    }
    setShowDeliveryModal(false);
    setActiveDelivery(null);
    // Reset the 4-hour timer
    localStorage.removeItem('nextDeliveryTime');
    const nextTime = Date.now() + 4 * 60 * 60 * 1000;
    localStorage.setItem('nextDeliveryTime', nextTime.toString());
    setCountdownDisplay('4:00:00');
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
          gap: '12px',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '18px' }}>🏪 Market</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div
            style={{
              padding: '6px 12px',
              background: 'rgba(255,255,255,0.4)',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#333',
            }}
          >
            {coins} 🌼
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowPremiumModal(true)}
            style={{
              padding: '8px 12px',
              background: '#DA70D6',
              color: '#FFF',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
          >
            💎 Premium
          </button>
          <button
            onClick={() => {
              // If shopping for an order, return to arrangement to complete the order
              // Otherwise, return to home shop
              const screen = shoppingForOrderId ? 'arrangement' : 'shop';
              setCurrentScreen(screen);
            }}
            style={{
              padding: '8px 12px',
              background: '#4A90E2',
              color: '#FFF',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            {shoppingForOrderId ? 'Back to Order' : 'Back to Home'}
          </button>
          </div>
        </div>
      </div>

      {/* Quick Navigation */}
      <ScreenNavigation currentScreen="wholesale" />

      {/* Special delivery countdown */}
      <div
        style={{
          padding: '10px 16px',
          background: activeDelivery ? 'rgba(255, 215, 0, 0.95)' : 'rgba(255, 107, 157, 0.95)',
          color: activeDelivery ? '#333' : '#FFF',
          fontSize: '13px',
          fontWeight: 'bold',
          borderBottom: '2px solid ' + (activeDelivery ? 'rgba(255, 215, 0, 0.7)' : 'rgba(255, 107, 157, 0.7)'),
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          cursor: activeDelivery ? 'pointer' : 'default',
          transition: 'all 0.3s ease',
        }}
        onClick={() => activeDelivery && setShowDeliveryModal(true)}
      >
        {activeDelivery ? (
          <>
            <img
              src={deliveryTruckImage}
              alt="Delivery Truck"
              style={{
                width: '40px',
                height: 'auto',
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
              }}
            />
            <span>🎉 Delivery Truck Arrived! Click to claim or deny</span>
          </>
        ) : (
          <>
            <span>🚚 Special delivery truck in: {countdownDisplay}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSpeedupDelivery();
              }}
              disabled={premiumCurrency < SPEEDUP_DELIVERY_COST}
              style={{
                padding: '6px 12px',
                background: premiumCurrency < SPEEDUP_DELIVERY_COST ? '#CCC' : '#FFD700',
                color: premiumCurrency < SPEEDUP_DELIVERY_COST ? '#999' : '#333',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: premiumCurrency < SPEEDUP_DELIVERY_COST ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              ⚡ Speed Up ({SPEEDUP_DELIVERY_COST} 💎)
            </button>
          </>
        )}
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
      {/* Delivery Success Message */}
      {deliverySuccessMessage && (
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(255, 107, 157, 0.2)',
            color: '#FF6B9D',
            fontSize: '14px',
            fontWeight: 'bold',
            textAlign: 'center',
            borderBottom: '2px solid #FF6B9D',
            transition: 'opacity 0.3s ease-in-out',
          }}
        >
          {deliverySuccessMessage}
        </div>
      )}

      {/* Delivery Modal Dialog */}
      {activeDelivery && showDeliveryModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={() => setShowDeliveryModal(false)}
        >
          <div
            style={{
              background: '#FFF',
              borderRadius: '12px',
              padding: '20px',
              maxWidth: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ marginBottom: '16px', textAlign: 'center' }}>
              <h2 style={{ margin: '0 0 12px 0', color: '#333' }}>
                🚚 Special Delivery Truck Arrived!
              </h2>
              {activeDelivery.isFirstTimeGift && (
                <div style={{ color: '#22BB44', fontWeight: 'bold', marginBottom: '8px' }}>
                  🎁 Welcome Gift - FREE!
                </div>
              )}
              <div style={{ fontSize: '14px', color: '#666' }}>
                Cost: {activeDelivery.isFirstTimeGift ? 'FREE' : '65 🌼'}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
                📦 Flowers:
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {activeDelivery.flowers.map((f, idx) => {
                  const flower = FLOWERS[f.flowerId] || (GREENERY as Record<string, any>)[f.flowerId];
                  return (
                    <div key={idx} style={{ fontSize: '13px', color: '#555' }}>
                      {flower?.name || f.flowerId} ×{f.quantity}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
                💐 Bonus Bouquets:
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {activeDelivery.bouquets.map((b, idx) => (
                  <div key={idx} style={{ fontSize: '13px', color: '#555' }}>
                    • {b.name}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  handleDeliveryDeny();
                  setShowDeliveryModal(false);
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#EEE',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  color: '#666',
                }}
              >
                Deny
              </button>
              <button
                onClick={() => {
                  handleDeliveryAccept(activeDelivery);
                  setShowDeliveryModal(false);
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#FF6B9D',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  color: '#FFF',
                }}
              >
                Claim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content - Flower & Greenery grid */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '12px',
          paddingBottom: selectedFlower ? '155px' : '12px',
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

            // Calculate remaining needed after inventory
            const inventoryQuantity = inventory.find((stem) => stem.flowerId === itemId)?.quantity || 0;
            const remainingNeeded = neededQuantity !== undefined ? Math.max(0, neededQuantity - inventoryQuantity) : undefined;

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
                title={item.name}
                style={{
                  padding: '8px',
                  background: isSelected
                    ? 'rgba(100,150,100,0.3)'
                    : 'rgba(255,255,255,0.5)',
                  border: isSelected
                    ? '2px solid #6A9A50'
                    : '2px solid #DDD',
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
                {remainingNeeded !== undefined && remainingNeeded > 0 && (
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
                    {remainingNeeded}
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
          let itemCount = 0;
          for (const itemId of allAvailable) {
            const item = getItem(itemId);
            if (item) {
              totalCostForAll += item.pricePerStem;
              itemCount++;
            }
          }

          return (
            <button
              onClick={handleBuyAllItems}
              style={{
                width: '100%',
                padding: '12px',
                background: '#E8A87C',
                color: '#FFF',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold',
                marginTop: '12px',
              }}
            >
              🌸 Buy 1 of Each ({itemCount} items, {totalCostForAll} 🌼)
            </button>
          );
        })()}

      </div>

      {/* Premium Modal */}
      {showPremiumModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 100,
          }}
          onClick={() => setShowPremiumModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ padding: '20px', borderBottom: '1px solid #EEE' }}>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#333' }}>💎 Premium Shop</h2>
              <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#666' }}>
                You have <strong>{premiumCurrency} 💎 Run Bucks</strong>
              </p>
              {storeError && (
                <div style={{ margin: '0 0 12px 0', padding: '10px', background: '#FFE6E6', border: '2px solid #FF6B6B', borderRadius: '6px', fontSize: '11px', color: '#C92A2A', fontWeight: 'bold' }}>
                  {storeError}
                </div>
              )}
              <button
                onClick={async () => {
                  setStoreError(null);
                  RundotGameAPI.analytics.recordCustomEvent('premium_get_runbucks_clicked', {
                    currentBalance: premiumCurrency,
                  });
                  try {
                    await openPlatformStore();
                    try {
                      const newBalance = await getRunbucksBalance();
                      if (newBalance > premiumCurrency) {
                        useGameStore.setState({ premiumCurrency: newBalance });
                        RundotGameAPI.analytics.recordCustomEvent('runbucks_purchased', {
                          newBalance: newBalance,
                        });
                      }
                    } catch {
                      // Balance fetch failed, but store might have worked
                    }
                  } catch (err) {
                    const errorMsg = err instanceof Error ? err.message : String(err);
                    console.error('Failed to open platform store:', errorMsg);
                    setStoreError('Could not open the store. Please try again.');
                  }
                }}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#DA70D6',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 'bold',
                }}
              >
                ✨ Get Run Bucks
              </button>
            </div>

            {/* Scrollable Premium Items */}
            <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
              {/* Buy Instant Special Delivery Button */}
              <div
                style={{
                  marginBottom: '12px',
                  padding: '12px',
                  background: premiumCurrency < INSTANT_DELIVERY_COST
                    ? 'rgba(200, 200, 200, 0.3)'
                    : 'linear-gradient(135deg, rgba(255, 107, 157, 0.15), rgba(255, 180, 200, 0.15))',
                  borderRadius: '8px',
                  border: `2px solid ${premiumCurrency < INSTANT_DELIVERY_COST ? '#999' : '#FF6B9D'}`,
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '8px', textAlign: 'center' }}>
                  🚚 Special Delivery (Premium)
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '10px' }}>
                  <img
                    src={deliveryTruckImage}
                    alt="Delivery Truck"
                    style={{
                      width: '50px',
                      height: 'auto',
                      objectFit: 'contain',
                      filter: premiumCurrency < INSTANT_DELIVERY_COST ? 'grayscale(100%) brightness(0.7)' : 'none',
                      opacity: premiumCurrency < INSTANT_DELIVERY_COST ? 0.6 : 1,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>
                      15 flowers + 2 Deluxe bouquets (worth 3x 💰)
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#FF6B9D' }}>
                      Cost: {INSTANT_DELIVERY_COST} 💎
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleBuyInstantDelivery}
                  disabled={premiumCurrency < INSTANT_DELIVERY_COST}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: premiumCurrency < INSTANT_DELIVERY_COST ? '#CCC' : '#FF6B9D',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: premiumCurrency < INSTANT_DELIVERY_COST ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                >
                  {premiumCurrency < INSTANT_DELIVERY_COST ? `❌ Need ${INSTANT_DELIVERY_COST - premiumCurrency}` : '🚚 Buy'}
                </button>
              </div>

              {/* Buy Deluxe Special Delivery Button */}
              <div
                style={{
                  marginBottom: '12px',
                  padding: '12px',
                  background: premiumCurrency < DELUXE_DELIVERY_COST
                    ? 'rgba(200, 200, 200, 0.3)'
                    : 'linear-gradient(135deg, rgba(218, 112, 214, 0.15), rgba(230, 140, 200, 0.15))',
                  borderRadius: '8px',
                  border: `2px solid ${premiumCurrency < DELUXE_DELIVERY_COST ? '#999' : '#DA70D6'}`,
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '8px', textAlign: 'center' }}>
                  👑 Special Delivery (Deluxe)
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '10px' }}>
                  <img
                    src={deliveryTruckImage}
                    alt="Deluxe Delivery Truck"
                    style={{
                      width: '50px',
                      height: 'auto',
                      objectFit: 'contain',
                      filter: premiumCurrency < DELUXE_DELIVERY_COST ? 'grayscale(100%) brightness(0.7)' : 'drop-shadow(0 0 8px rgba(218, 112, 214, 0.4))',
                      opacity: premiumCurrency < DELUXE_DELIVERY_COST ? 0.6 : 1,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>
                      45 flowers + 8 Deluxe bouquets (worth 2x 💰)
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#DA70D6' }}>
                      Cost: {DELUXE_DELIVERY_COST} 💎
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleBuyDeluxeDelivery}
                  disabled={premiumCurrency < DELUXE_DELIVERY_COST}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: premiumCurrency < DELUXE_DELIVERY_COST ? '#CCC' : '#DA70D6',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: premiumCurrency < DELUXE_DELIVERY_COST ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                >
                  {premiumCurrency < DELUXE_DELIVERY_COST ? `❌ Need ${DELUXE_DELIVERY_COST - premiumCurrency}` : '👑 Buy'}
                </button>
              </div>

              {/* Inventory Storage Upgrades */}
              <div style={{ marginBottom: '12px' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#333', fontWeight: 'bold' }}>
                  📦 Inventory Storage
                </h3>
                <div style={{ fontSize: '11px', color: '#666', marginBottom: '12px', lineHeight: 1.4 }}>
                  Current: <strong>{Math.round((inventory.reduce((sum, inv) => sum + inv.quantity, 0) / inventoryCapacity) * 100)}%</strong> full ({inventory.reduce((sum, inv) => sum + inv.quantity, 0)}/{inventoryCapacity} slots)
                </div>

                {/* +25 Storage for 15 💎 */}
                <div style={{ marginBottom: '10px', padding: '12px', background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.15), rgba(129, 199, 132, 0.1))', borderRadius: '8px', border: '2px solid #4CAF50' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#333' }}>+25 Slots</div>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#4CAF50' }}>{STORAGE_UPGRADE_SMALL.cost} 💎</div>
                  </div>
                  <button
                    onClick={() => handleBuyStorageUpgrade(STORAGE_UPGRADE_SMALL.slots, STORAGE_UPGRADE_SMALL.cost)}
                    disabled={premiumCurrency < STORAGE_UPGRADE_SMALL.cost || inventoryCapacity >= MAX_INVENTORY_CAPACITY}
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: (premiumCurrency < STORAGE_UPGRADE_SMALL.cost || inventoryCapacity >= MAX_INVENTORY_CAPACITY) ? '#CCC' : '#4CAF50',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: (premiumCurrency < STORAGE_UPGRADE_SMALL.cost || inventoryCapacity >= MAX_INVENTORY_CAPACITY) ? 'not-allowed' : 'pointer',
                      fontSize: '11px',
                      fontWeight: 'bold',
                    }}
                  >
                    {inventoryCapacity >= MAX_INVENTORY_CAPACITY ? '✓ Max' : premiumCurrency < STORAGE_UPGRADE_SMALL.cost ? `❌ Need ${STORAGE_UPGRADE_SMALL.cost - premiumCurrency}` : '📦 Buy'}
                  </button>
                </div>

                {/* +50 Storage for 25 💎 */}
                <div style={{ marginBottom: '10px', padding: '12px', background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.15), rgba(100, 181, 246, 0.1))', borderRadius: '8px', border: '2px solid #2196F3' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#333' }}>+50 Slots</div>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#2196F3' }}>{STORAGE_UPGRADE_LARGE.cost} 💎</div>
                  </div>
                  <button
                    onClick={() => handleBuyStorageUpgrade(STORAGE_UPGRADE_LARGE.slots, STORAGE_UPGRADE_LARGE.cost)}
                    disabled={premiumCurrency < STORAGE_UPGRADE_LARGE.cost || inventoryCapacity >= MAX_INVENTORY_CAPACITY}
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: (premiumCurrency < STORAGE_UPGRADE_LARGE.cost || inventoryCapacity >= MAX_INVENTORY_CAPACITY) ? '#CCC' : '#2196F3',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: (premiumCurrency < STORAGE_UPGRADE_LARGE.cost || inventoryCapacity >= MAX_INVENTORY_CAPACITY) ? 'not-allowed' : 'pointer',
                      fontSize: '11px',
                      fontWeight: 'bold',
                    }}
                  >
                    {inventoryCapacity >= MAX_INVENTORY_CAPACITY ? '✓ Max' : premiumCurrency < STORAGE_UPGRADE_LARGE.cost ? `❌ Need ${STORAGE_UPGRADE_LARGE.cost - premiumCurrency}` : '📦 Buy'}
                  </button>
                </div>
              </div>

              {/* Exclusive Mystery Box Section */}
              <div style={{ marginBottom: '12px' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#333', fontWeight: 'bold' }}>
                  ✨ Exclusive Mystery Boxes
                </h3>
                <div style={{ fontSize: '11px', color: '#666', marginBottom: '12px', lineHeight: 1.4 }}>
                  Get random exclusive bouquets, petal coins, and flower stems!
                </div>

                {/* 1 Box - 500 💎 */}
                <div style={{ marginBottom: '10px', padding: '12px', background: 'linear-gradient(135deg, rgba(218, 165, 32, 0.15), rgba(255, 215, 0, 0.1))', borderRadius: '8px', border: '2px solid #DAA520' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#333' }}>🎁 Buy 1 Box</div>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#DAA520' }}>{EXCLUSIVE_BOX_COSTS[1]} 💎</div>
                  </div>
                  <div style={{ fontSize: '10px', color: '#666', marginBottom: '8px' }}>5-8 exclusive bouquets + flowers + coins</div>
                  <button
                    onClick={() => handleBuyExclusiveBox(1)}
                    disabled={premiumCurrency < EXCLUSIVE_BOX_COSTS[1]}
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: premiumCurrency < EXCLUSIVE_BOX_COSTS[1] ? '#CCC' : '#DAA520',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: premiumCurrency < EXCLUSIVE_BOX_COSTS[1] ? 'not-allowed' : 'pointer',
                      fontSize: '11px',
                      fontWeight: 'bold',
                    }}
                  >
                    {premiumCurrency < EXCLUSIVE_BOX_COSTS[1] ? `❌ Need ${EXCLUSIVE_BOX_COSTS[1] - premiumCurrency}` : '✨ Buy'}
                  </button>
                </div>

                {/* 2 Boxes - 750 💎 (Better Value) */}
                <div style={{ marginBottom: '10px', padding: '12px', background: 'linear-gradient(135deg, rgba(218, 112, 214, 0.15), rgba(255, 165, 0, 0.1))', borderRadius: '8px', border: '2px solid #DA70D6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#333' }}>🎁🎁 Buy 2 Boxes</div>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#DA70D6' }}>{EXCLUSIVE_BOX_COSTS[2]} 💎</div>
                  </div>
                  <div style={{ fontSize: '9px', color: '#888', marginBottom: '8px', fontStyle: 'italic' }}>Better value!</div>
                  <button
                    onClick={() => handleBuyExclusiveBox(2)}
                    disabled={premiumCurrency < EXCLUSIVE_BOX_COSTS[2]}
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: premiumCurrency < EXCLUSIVE_BOX_COSTS[2] ? '#CCC' : '#DA70D6',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: premiumCurrency < EXCLUSIVE_BOX_COSTS[2] ? 'not-allowed' : 'pointer',
                      fontSize: '11px',
                      fontWeight: 'bold',
                    }}
                  >
                    {premiumCurrency < EXCLUSIVE_BOX_COSTS[2] ? `❌ Need ${EXCLUSIVE_BOX_COSTS[2] - premiumCurrency}` : '✨ Buy'}
                  </button>
                </div>

                {/* 3 Boxes - 1000 💎 (Best Value) */}
                <div style={{ padding: '12px', background: 'linear-gradient(135deg, rgba(255, 105, 180, 0.15), rgba(220, 20, 60, 0.1))', borderRadius: '8px', border: '2px solid #FF69B4' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#333' }}>🎁🎁🎁 Buy 3 Boxes</div>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#FF69B4' }}>{EXCLUSIVE_BOX_COSTS[3]} 💎</div>
                  </div>
                  <div style={{ fontSize: '9px', color: '#888', marginBottom: '8px', fontStyle: 'italic' }}>Best value!</div>
                  <button
                    onClick={() => handleBuyExclusiveBox(3)}
                    disabled={premiumCurrency < EXCLUSIVE_BOX_COSTS[3]}
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: premiumCurrency < EXCLUSIVE_BOX_COSTS[3] ? '#CCC' : '#FF69B4',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: premiumCurrency < EXCLUSIVE_BOX_COSTS[3] ? 'not-allowed' : 'pointer',
                      fontSize: '11px',
                      fontWeight: 'bold',
                    }}
                  >
                    {premiumCurrency < EXCLUSIVE_BOX_COSTS[3] ? `❌ Need ${EXCLUSIVE_BOX_COSTS[3] - premiumCurrency}` : '✨ Buy'}
                  </button>
                </div>
              </div>

              {/* Petal Coins Packages */}
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '2px solid #EEE' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#333' }}>💚 Boost Your Coins</h3>
                {PETAL_COINS_PACKAGES.map((pkg) => {
                  const canAfford = premiumCurrency >= pkg.cost;
                  return (
                    <div
                      key={pkg.id}
                      style={{
                        marginBottom: '10px',
                        padding: '12px',
                        background: canAfford
                          ? 'linear-gradient(135deg, rgba(106, 154, 80, 0.15), rgba(175, 215, 120, 0.15))'
                          : 'rgba(200, 200, 200, 0.3)',
                        borderRadius: '8px',
                        border: `2px solid ${canAfford ? '#6A9A50' : '#999'}`,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#333' }}>
                          {pkg.emoji} {pkg.name}
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#6A9A50' }}>
                          {pkg.coins} 🌼
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ fontSize: '11px', color: '#666' }}>
                          Cost: {pkg.cost} 💎
                        </div>
                        <div style={{ fontSize: '11px', color: canAfford ? '#6A9A50' : '#C0392B', fontWeight: 'bold' }}>
                          {canAfford ? `✓ ${premiumCurrency - pkg.cost} left` : `Need ${pkg.cost - premiumCurrency}`}
                        </div>
                      </div>
                      <button
                        onClick={() => handleBuyPetalCoinsPackage(pkg.id)}
                        disabled={!canAfford}
                        style={{
                          width: '100%',
                          padding: '8px',
                          background: canAfford ? '#6A9A50' : '#CCC',
                          color: '#FFF',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: canAfford ? 'pointer' : 'not-allowed',
                          fontSize: '11px',
                          fontWeight: 'bold',
                        }}
                      >
                        {canAfford ? '💚 Buy' : '❌ Not enough'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer with Close Button */}
            <div style={{ padding: '12px', borderTop: '1px solid #EEE' }}>
              <button
                onClick={() => setShowPremiumModal(false)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#DDD',
                  color: '#333',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 'bold',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Purchase Details Panel */}
      {selectedFlower && (
        <div
          style={{
            position: 'fixed',
            bottom: '0',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'min(100vw, calc(100vh * 9 / 16))',
            maxWidth: '480px',
            padding: '6px',
            background: 'rgba(255,255,255,0.95)',
            borderTop: '2px solid rgba(0,0,0,0.1)',
            maxHeight: '145px',
            overflow: 'auto',
            zIndex: 10,
          }}
        >
          <div
            style={{
              padding: '6px',
              background: 'rgba(255,255,255,0.5)',
              borderRadius: '6px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold' }}>
                {selectedFlower && getItem(selectedFlower)?.name}
              </h3>
              <button
                onClick={() => setSelectedFlower(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '16px',
                  cursor: 'pointer',
                  padding: '0 4px',
                  color: '#666',
                }}
                title="Close"
              >
                ✕
              </button>
            </div>

{/* Custom quantity controls */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '6px',
                padding: '8px',
                background: 'rgba(0,0,0,0.05)',
                borderRadius: '4px',
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', flex: 1 }}>
                Qty:
              </span>
              <button
                onClick={() => setSelectedBulk(Math.max(1, selectedBulk - 1))}
                style={{
                  width: '32px',
                  height: '32px',
                  padding: 0,
                  background: '#DDD',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                ➖
              </button>
              <div
                style={{
                  minWidth: '45px',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#2A1408',
                }}
              >
                {selectedBulk}
              </div>
              <button
                onClick={() => {
                  const maxRemaining = Math.max(0, 50 - (dailyPurchases[selectedFlower!] || 0));
                  setSelectedBulk(Math.min(maxRemaining, selectedBulk + 1));
                }}
                style={{
                  width: '32px',
                  height: '32px',
                  padding: 0,
                  background: (selectedBulk + 1) > Math.max(0, 50 - (dailyPurchases[selectedFlower!] || 0)) ? '#CCC' : '#DDD',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: (selectedBulk + 1) > Math.max(0, 50 - (dailyPurchases[selectedFlower!] || 0)) ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
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

              // Current selected amount
              const discount = getDiscount(selectedBulk);
              const totalCost = Math.round(item.pricePerStem * selectedBulk * (1 - discount));
              const { canBuy } = checkDailyLimit(selectedFlower, selectedBulk);
              const insufficientCoins = coins < totalCost;
              const isDisabled = insufficientCoins || !canBuy;
              const buttonText = !canBuy ? '❌ Daily limit reached' : insufficientCoins ? '❌ Not enough coins' : `💚 Buy ${selectedBulk} stems for ${totalCost} 🌼`;

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <button
                    onClick={() => handleBuyFlowers()}
                    disabled={isDisabled}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: isDisabled ? '#CCC' : '#6A9A50',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      fontSize: '13px',
                      fontWeight: 'bold',
                    }}
                  >
                    {buttonText}
                  </button>
                </div>
              );
            })()
            )}
          </div>
        </div>
      )}

      {/* Exclusive Box Reveal Overlay */}
      {showBoxReveal && pendingBoxReveal && (
        <ExclusiveBoxRevealOverlay contents={pendingBoxReveal} onComplete={handleRevealComplete} />
      )}
    </div>
  );
}
