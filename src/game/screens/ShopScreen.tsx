import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useBackgroundMusic } from '../../hooks/useBackgroundMusic';
import { setSFXVolume, setSFXMuted } from '../../services/audio';
import { getServerNow } from '../../services/time';
import RundotGameAPI from '@series-inc/rundot-game-sdk/api';
import { CoinCounter } from '../components/CoinCounter';
import { BottomTabNavigation } from '../components/BottomTabNavigation';
import { CustomerNPCOverlay, NPCVisit, createNPCVisit } from '../components/CustomerNPCOverlay';
import { ShelfCheckoutDialog } from '../components/ShelfCheckoutDialog';
import {
  ShelfLayoutEditor,
  loadShelfLayoutConfig,
  BOUQUETS_PER_SHELF,
  type ShelfLayoutConfig,
} from '../components/ShelfLayoutEditor';
import {
  generateSpecialDelivery,
  type SpecialDelivery,
} from '../components/SpecialDeliveryOverlay';
import { NPCCustomizer } from '../components/NPCCustomizer';
import { ShelfNPCCustomizer } from '../components/ShelfNPCCustomizer';
import { TruckCustomizer } from '../components/TruckCustomizer';
import { FlowerUnlockNotification } from '../components/FlowerUnlockNotification';
import { OrderThankYouOverlay } from '../components/OrderThankYouOverlay';
import { SettingsModal } from '../components/SettingsModal';
import { NotificationBell } from '../components/NotificationBell';
import { NotificationCenter } from '../components/NotificationCenter';
import { NotificationPopup } from '../components/NotificationPopup';
import { Bouquet } from '../../types';
import { BOUQUET_RECIPES, isBouquetUnlocked } from '../../data/bouquets';
import { getCurrentLevel, getLevelProgress } from '../../data/progression';
import { FLOWERS } from '../../constants/flowers';
import shopBackground from '/bloomy_shop_background.png';

// NPC visits: a customer slides in every 15–45 seconds
const NPC_VISIT_MIN = 15000;
const NPC_VISIT_MAX = 45000;

// Online orders: one spawns every 15–120 seconds (when slot is empty and daily limit not reached)
const ONLINE_ORDER_SPAWN_MIN = 15000;
const ONLINE_ORDER_SPAWN_MAX = 120000;

// Lifecycle handlers (module-scope — runs once)
// Store timer refs at module level so they can be cleared on pause/resume
let moduleNpcTimerRef: ReturnType<typeof setTimeout> | null = null;
let moduleShelfPurchaseTimerRef: ReturnType<typeof setTimeout> | null = null;
let moduleDeliveryTimerRef: ReturnType<typeof setTimeout> | null = null;
let moduleOnlineOrderTimerRef: ReturnType<typeof setTimeout> | null = null;

RundotGameAPI.lifecycles.onPause(() => {
  // Clear all timers when game pauses
  if (moduleNpcTimerRef) clearTimeout(moduleNpcTimerRef);
  if (moduleShelfPurchaseTimerRef) clearTimeout(moduleShelfPurchaseTimerRef);
  if (moduleDeliveryTimerRef) clearTimeout(moduleDeliveryTimerRef);
  if (moduleOnlineOrderTimerRef) clearTimeout(moduleOnlineOrderTimerRef);
  RundotGameAPI.analytics.recordCustomEvent('game_paused');
});

RundotGameAPI.lifecycles.onResume(() => {
  // Timers will be rescheduled by the component on resume
  RundotGameAPI.analytics.recordCustomEvent('game_resumed');
});

RundotGameAPI.lifecycles.onSleep(() => RundotGameAPI.analytics.recordCustomEvent('game_sleep'));
RundotGameAPI.lifecycles.onQuit(() => RundotGameAPI.analytics.recordCustomEvent('game_quit'));

export function ShopScreen() {
  const shelfBouquets = useGameStore((s) => s.shelfBouquets);
  const displayedBouquets = useGameStore((s) => s.displayedBouquets);
  const sellBouquet = useGameStore((s) => s.sellBouquet);
  const removeBouquetFromShelf = useGameStore((s) => s.removeBouquetFromShelf);
  const createOrder = useGameStore((s) => s.createOrder);
  const unlockedFlowers = useGameStore((s) => s.unlockedFlowers);
  const cumulativeBouquetsSold = useGameStore((s) => s.cumulativeBouquetsSold);
  const orderJustCompleted = useGameStore((s) => s.orderJustCompleted);
  const completedOrderCustomerImage = useGameStore((s) => s.completedOrderCustomerImage);
  const addUnclaimedReward = useGameStore((s) => s.addUnclaimedReward);
  const addNotification = useGameStore((s) => s.addNotification);
  const unclaimedRewards = useGameStore((s) => s.unclaimedRewards);
  const claimedRewards = useGameStore((s) => s.claimedRewards);
  const addCoins = useGameStore((s) => s.addCoins);
  const expirePendingOnlineOrders = useGameStore((s) => s.expirePendingOnlineOrders);
  const checkAndResetOnlineOrderDaily = useGameStore((s) => s.checkAndResetOnlineOrderDaily);
  const hasReceivedFirstTimeGift = useGameStore((s) => s.hasReceivedFirstTimeGift);
  // NPC state from gameStore (persists across screens)
  const activeVisit = useGameStore((s) => s.activeNPCVisit);
  const setActiveVisitInStore = useGameStore((s) => s.setActiveNPCVisit);
  const clearActiveVisitInStore = useGameStore((s) => s.clearActiveNPCVisit);
  const shelfPurchaseNPC = useGameStore((s) => s.shelfPurchaseNPC);
  const setShelfPurchaseNPCInStore = useGameStore((s) => s.setShelfPurchaseNPC);

  // Background music — load from localStorage on mount
  const musicHook = useBackgroundMusic();
  const [musicVolume, setMusicVolumeState] = useState<number>(() => {
    const saved = localStorage.getItem('bloommy_music_volume');
    const vol = saved !== null ? parseFloat(saved) : 0.3;
    musicHook.setVolume(vol);
    return vol;
  });
  const [isMusicMuted, setIsMusicMutedState] = useState<boolean>(() => {
    const saved = localStorage.getItem('bloommy_music_muted');
    const muted = saved === 'true';
    if (muted) {
      musicHook.toggleMute();
    }
    return muted;
  });

  const handleMusicVolumeChange = (volume: number) => {
    musicHook.setVolume(volume);
    setMusicVolumeState(volume);
    localStorage.setItem('bloommy_music_volume', String(volume));
    // Auto-unmute when user adjusts volume while muted
    if (isMusicMuted) {
      musicHook.toggleMute();
      setIsMusicMutedState(false);
      localStorage.setItem('bloommy_music_muted', 'false');
    }
  };

  const handleToggleMusicMute = () => {
    musicHook.toggleMute();
    const next = !isMusicMuted;
    setIsMusicMutedState(next);
    localStorage.setItem('bloommy_music_muted', String(next));
  };

  // SFX volume — load from localStorage on mount
  const [sfxVolume, setSfxVolumeState] = useState<number>(() => {
    const saved = localStorage.getItem('bloommy_sfx_volume');
    const vol = saved !== null ? parseFloat(saved) : 0.7;
    setSFXVolume(vol);
    return vol;
  });
  const [isSfxMuted, setIsSfxMuted] = useState<boolean>(() => {
    const saved = localStorage.getItem('bloommy_sfx_muted');
    const muted = saved === 'true';
    setSFXMuted(muted);
    return muted;
  });

  const handleSfxVolumeChange = (volume: number) => {
    setSFXVolume(volume);
    setSfxVolumeState(volume);
    localStorage.setItem('bloommy_sfx_volume', String(volume));
  };

  const handleToggleSfxMute = () => {
    const next = !isSfxMuted;
    setSFXMuted(next);
    setIsSfxMuted(next);
    localStorage.setItem('bloommy_sfx_muted', String(next));
  };

  // Settings modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Notification system
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [pendingPopupNotifications, setPendingPopupNotifications] = useState<Array<{
    id: string;
    title: string;
    message: string;
    emoji: string;
  }>>([]);
  const [currentPopupNotification, setCurrentPopupNotification] = useState<{
    id: string;
    title: string;
    message: string;
    emoji: string;
  } | null>(null);

  const [longPressId, setLongPressId] = useState<string | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track flower unlocks for notifications
  const [pendingUnlockNotifications, setPendingUnlockNotifications] = useState<string[]>([]);
  const [currentUnlock, setCurrentUnlock] = useState<string | null>(null);
  const previousUnlockedFlowers = useRef<Set<string>>(new Set(unlockedFlowers));

  // Detect new flower unlocks
  useEffect(() => {
    const newFlowers: string[] = [];
    for (const flowerId of unlockedFlowers) {
      if (!previousUnlockedFlowers.current.has(flowerId)) {
        newFlowers.push(flowerId);
      }
    }

    if (newFlowers.length > 0) {
      setPendingUnlockNotifications((prev) => [...prev, ...newFlowers]);
      previousUnlockedFlowers.current = new Set(unlockedFlowers);
    }
  }, [unlockedFlowers]);

  // Show unlock notifications one at a time
  useEffect(() => {
    if (currentUnlock === null && pendingUnlockNotifications.length > 0) {
      const nextUnlock = pendingUnlockNotifications[0] ?? null;
      setCurrentUnlock(nextUnlock);

      // Also add to popup notifications
      if (nextUnlock) {
        const notificationId = `bouquet_unlocked_${Date.now()}`;
        addNotification('bouquet_unlocked', '🌸 New Bouquet Unlocked!', 'A new bouquet design is now available!', true);
        setPendingPopupNotifications((prev) => [
          ...prev,
          {
            id: notificationId,
            title: '🌸 New Bouquet Unlocked!',
            message: 'A new bouquet design is now available!',
            emoji: '🌸',
          },
        ]);
      }

      RundotGameAPI.analytics.recordCustomEvent('flower_unlocked', {
        flowerId: nextUnlock,
      });
    }
  }, [currentUnlock, pendingUnlockNotifications, addNotification]);

  const handleUnlockNotificationComplete = () => {
    setPendingUnlockNotifications((prev) => prev.slice(1));
    setCurrentUnlock(null);
  };

  // Manage popup notification queue (show one at a time)
  useEffect(() => {
    if (currentPopupNotification === null && pendingPopupNotifications.length > 0) {
      const nextNotification = pendingPopupNotifications[0]!;
      setCurrentPopupNotification(nextNotification);
    }
  }, [currentPopupNotification, pendingPopupNotifications]);

  const handlePopupNotificationComplete = () => {
    setPendingPopupNotifications((prev) => prev.slice(1));
    setCurrentPopupNotification(null);
  };

  const handleNotificationClick = (notificationType: string) => {
    if (notificationType === 'claim_rewards') {
      // Navigate to inventory screen where claim rewards is shown
      useGameStore.setState({ currentScreen: 'inventory' });
      setIsNotificationCenterOpen(false);
      RundotGameAPI.analytics.recordCustomEvent('notification_action_taken', {
        notificationType: 'claim_rewards',
      });
    } else if (notificationType === 'special_delivery') {
      // Navigate to the Market where the delivery overlay lives
      useGameStore.setState({ currentScreen: 'wholesale' });
      setIsNotificationCenterOpen(false);
      RundotGameAPI.analytics.recordCustomEvent('notification_action_taken', {
        notificationType: 'special_delivery',
      });
    }
  };

  // Track unclaimed rewards and trigger silent notification
  const previousUnclaimedRewardsRef = useRef<Set<number>>(new Set());
  useEffect(() => {
    const newRewards = unclaimedRewards.filter((level) => !previousUnclaimedRewardsRef.current.has(level));

    if (newRewards.length > 0) {
      // Trigger silent notification (goes directly to notification center)
      addNotification('claim_rewards', '🎁 Rewards Waiting', `You have unclaimed rewards from level ${newRewards[0]}!`, false);
      RundotGameAPI.analytics.recordCustomEvent('unclaimed_rewards_notification', {
        levels: newRewards,
      });
      previousUnclaimedRewardsRef.current = new Set(unclaimedRewards);
    }
  }, [unclaimedRewards, addNotification]);

  // Track level-up events
  const previousLevelRef = useRef<number>(getCurrentLevel(cumulativeBouquetsSold));
  const hasInitializedRewardsRef = useRef(false);

  useEffect(() => {
    const currentLevel = getCurrentLevel(cumulativeBouquetsSold);

    // On first load, ensure all rewards up to current level are available (starting from level 2+)
    if (!hasInitializedRewardsRef.current) {
      hasInitializedRewardsRef.current = true;
      for (let level = 2; level <= currentLevel; level++) {
        if (!unclaimedRewards.includes(level) && !claimedRewards.includes(level)) {
          addUnclaimedReward(level);
        }
      }
    }

    // On level up, add the new level's reward and trigger notification
    if (currentLevel > previousLevelRef.current) {
      if (!unclaimedRewards.includes(currentLevel) && !claimedRewards.includes(currentLevel)) {
        addUnclaimedReward(currentLevel);
      }

      // Add pop-up notification for level up
      const notificationId = `level_up_${Date.now()}`;
      addNotification('level_up', '🎉 Level Up!', `You've reached Level ${currentLevel}!`, true);
      setPendingPopupNotifications((prev) => [
        ...prev,
        {
          id: notificationId,
          title: '🎉 Level Up!',
          message: `You've reached Level ${currentLevel}!`,
          emoji: '🎉',
        },
      ]);

      RundotGameAPI.analytics.recordCustomEvent('player_leveled_up', {
        newLevel: currentLevel,
        bouquetsSold: cumulativeBouquetsSold,
      });
      previousLevelRef.current = currentLevel;
    }
  }, [cumulativeBouquetsSold, unclaimedRewards, claimedRewards, addUnclaimedReward, addNotification]);

  // NPC timers
  const npcTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shelfPurchaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Shelf checkout state (local only, not persisted)
  const [shelfCheckoutInProgress, setShelfCheckoutInProgress] = useState(false);

  // Wrapper functions to interact with store setters
  const setActiveVisit = (visit: NPCVisit | null) => {
    if (visit) {
      setActiveVisitInStore(visit);
    } else {
      clearActiveVisitInStore();
    }
  };

  const setShelfPurchaseNPC = (npc: { npcImage: string; bouquet: Bouquet } | null) => {
    setShelfPurchaseNPCInStore(npc);
  };

  // Layout editor
  const [editingLayout, setEditingLayout] = useState(false);
  const storedShelfLayoutConfig = useGameStore((s) => s.shelfLayoutConfig);
  const [shelfConfig, setShelfConfig] = useState<ShelfLayoutConfig>(() => {
    // Try to use stored config first, fall back to localStorage
    if (storedShelfLayoutConfig) {
      return {
        shelves: storedShelfLayoutConfig.shelves,
        gap: storedShelfLayoutConfig.gap,
        bouquetWidth: storedShelfLayoutConfig.bouquetWidth,
        bouquetHeight: storedShelfLayoutConfig.bouquetHeight,
      };
    }
    return loadShelfLayoutConfig();
  });

  // NPC customizer
  const [customizingNPC, setCustomizingNPC] = useState(false);

  // Shelf NPC customizer
  const [customizingShelfNPC, setCustomizingShelfNPC] = useState(false);

  // Truck customizer
  const [customizingTruck, setCustomizingTruck] = useState(false);

  // Special delivery truck - restore from localStorage if available
  const [activeDelivery, setActiveDelivery] = useState<SpecialDelivery | null>(() => {
    const saved = localStorage.getItem('activeDelivery');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Validate that the delivery has flowers and bouquets
        if (parsed && Array.isArray(parsed.flowers) && Array.isArray(parsed.bouquets) && parsed.flowers.length > 0 && parsed.bouquets.length > 0) {
          return parsed;
        }
      } catch (e) {
        // Invalid JSON or parsing error, clear it
        localStorage.removeItem('activeDelivery');
      }
    }
    return null;
  });
  const deliveryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onlineOrderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check if delivery should appear on mount based on stored timestamp
  useEffect(() => {
    const nextDeliveryTime = localStorage.getItem('nextDeliveryTime');
    if (nextDeliveryTime) {
      const deliveryTime = parseInt(nextDeliveryTime);
      const now = Date.now();
      if (now >= deliveryTime && !activeDelivery) {
        // Delivery is ready!
        const newDelivery = generateSpecialDelivery();

        // Only show delivery if it has items
        if (newDelivery.flowers.length > 0 && newDelivery.bouquets.length > 0) {
          setActiveDelivery(newDelivery);

          // Add notification to notification center
          addNotification('special_delivery', '🚚 Special Delivery!', 'Your delivery truck has arrived!', true);

          RundotGameAPI.analytics.recordCustomEvent('special_delivery_arrived', {
            deliveryId: newDelivery.id,
          });
        } else {
          // Empty delivery, skip and schedule next one
          localStorage.removeItem('nextDeliveryTime');
          // This will trigger a new delivery to be scheduled
        }
      }
    }
  }, [addNotification]);

  // Check if player should receive first-time gift delivery
  useEffect(() => {
    if (!hasReceivedFirstTimeGift && !activeDelivery) {
      // Generate a gift delivery (free, no cost)
      const giftDelivery = generateSpecialDelivery();
      // Mark it as a gift
      const markedGift: SpecialDelivery = {
        ...giftDelivery,
        isFirstTimeGift: true,
        isPremiumDelivery: false,
        priceMultiplier: 0, // Free gift
      };
      setActiveDelivery(markedGift);

      // Add notification
      addNotification('special_delivery', '🎁 Welcome Gift!', 'A special welcome gift delivery has arrived!', true);

      // Mark as received so it only appears once
      useGameStore.setState({ hasReceivedFirstTimeGift: true });

      RundotGameAPI.analytics.recordCustomEvent('first_time_gift_generated', {
        deliveryId: markedGift.id,
      });
    }
  }, [hasReceivedFirstTimeGift, activeDelivery, addNotification]);

  // Schedule next NPC visit
  const scheduleNextVisit = () => {
    const delay = NPC_VISIT_MIN + Math.random() * (NPC_VISIT_MAX - NPC_VISIT_MIN);
    npcTimerRef.current = setTimeout(() => {
      // Don't spawn a new NPC if one is already visible
      const state = useGameStore.getState();
      if (state.pendingOrders.length < 10) {
        // Pick only from unlocked bouquets (same logic as createOrder)
        const unlockedRecipes = BOUQUET_RECIPES.filter(
          (recipe) =>
            state.unlockedTiers.has(recipe.tier) &&
            isBouquetUnlocked(recipe.id, state.cumulativeBouquetsSold)
        );

        // Only spawn NPC if there are unlocked bouquets available
        if (unlockedRecipes.length > 0) {
          const recipe = unlockedRecipes[Math.floor(Math.random() * unlockedRecipes.length)]!;
          const visit = createNPCVisit(recipe.id, recipe.name, recipe.sellPrice);
          setActiveVisit(visit);
          RundotGameAPI.analytics.recordCustomEvent('npc_customer_arrived', {
            recipeId: recipe.id,
            recipeName: recipe.name,
          });
        }
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

  // Handle app pause/resume to reschedule timers on mobile
  useEffect(() => {
    const handleResume = () => {
      // Clear old timers and reschedule immediately
      if (npcTimerRef.current) clearTimeout(npcTimerRef.current);
      if (shelfPurchaseTimerRef.current) clearTimeout(shelfPurchaseTimerRef.current);
      if (deliveryTimerRef.current) clearTimeout(deliveryTimerRef.current);
      if (onlineOrderTimerRef.current) clearTimeout(onlineOrderTimerRef.current);

      // Reschedule timers with fresh timing
      scheduleNextVisit();
      scheduleNextShelfPurchase();
      scheduleNextDelivery();
      scheduleNextOnlineOrder();
    };

    // Subscribe to resume event
    const subscription = RundotGameAPI.lifecycles.onResume(handleResume);

    return () => {
      // Unsubscribe from resume event
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Handle NPC accept: create an order from the visit
  const handleNPCAccept = () => {
    if (!activeVisit) return;
    const order = createOrder(activeVisit.npcImage);
    setActiveVisit(null);
    if (order) {
      // Trigger silent notification for order pending (link to order so it marks fulfilled when completed)
      addNotification('order_pending', '📋 Order Pending', `${activeVisit.recipeName} needs to be fulfilled!`, false, order.id);
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

  // Shelf purchase NPC - shows a checkout dialog every 8-25 seconds
  // Only appears if no other NPCs are active (order requests, delivery trucks)
  const scheduleNextShelfPurchase = () => {
    const delay = 8000 + Math.random() * 17000;
    shelfPurchaseTimerRef.current = setTimeout(() => {
      const bouquets = useGameStore.getState().shelfBouquets;
      // Only spawn if:
      // 1. There are bouquets on shelf
      // 2. No active order NPC
      // 3. No active delivery truck
      // 4. No shelf checkout currently in progress
      // 5. No shelf purchase NPC currently showing
      if (
        bouquets.length > 0 &&
        !activeVisit &&
        !activeDelivery &&
        !shelfCheckoutInProgress &&
        !shelfPurchaseNPC
      ) {
        const randomBouquet = bouquets[Math.floor(Math.random() * bouquets.length)];
        if (randomBouquet) {
          const NPC_IMAGES = [
            './npcs/npc-young-woman-01.png',
            './npcs/npc-young-woman-02.png',
            './npcs/npc-young-woman-03.png',
            './npcs/npc-young-woman-04.png',
            './npcs/npc-woman-braid-glasses.png',
            './npcs/npc-elder-woman-white-hair.png',
            './npcs/npc-elder-woman-grey-curly.png',
            './npcs/npc-woman-auburn-curly.png',
            './npcs/npc-woman-curly-afro.png',
            './npcs/npc-woman-dark-updo.png',
            './npcs/npc-man-bald-beard.png',
            './npcs/npc-man-black-hair-linen.png',
            './npcs/npc-man-brown-hair-sweater.png',
            './npcs/npc-man-curly-hair.png',
            './npcs/npc-man-grey-beard-blue.png',
            './npcs/npc-man-grey-hair-navy.png',
            './npcs/npc-man-locs-sweater.png',
            './npcs/npc-nonbinary-mint-hair.png',
          ];
          const randomNPC = NPC_IMAGES[Math.floor(Math.random() * NPC_IMAGES.length)]!;
          setShelfPurchaseNPC({ npcImage: randomNPC, bouquet: randomBouquet });
          setShelfCheckoutInProgress(true);

          RundotGameAPI.analytics.recordCustomEvent('shelf_checkout_started', {
            bouquetId: randomBouquet.id,
            price: randomBouquet.sellPrice,
            recipeName: randomBouquet.recipeName,
          });
        }
      } else if (bouquets.length > 0 && (activeVisit || activeDelivery || shelfCheckoutInProgress)) {
        // If blocked by another NPC, reschedule check in 5 seconds
        scheduleNextShelfPurchase();
        return;
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

  // Handle checkout confirmation
  const handleShelfCheckoutConfirm = () => {
    if (shelfPurchaseNPC) {
      sellBouquet(shelfPurchaseNPC.bouquet.id);

      RundotGameAPI.analytics.recordCustomEvent('shelf_checkout_completed', {
        bouquetId: shelfPurchaseNPC.bouquet.id,
        price: shelfPurchaseNPC.bouquet.sellPrice,
        recipeName: shelfPurchaseNPC.bouquet.recipeName,
      });

      // Wait for NPC animation to finish, then clear state and schedule next one
      setTimeout(() => {
        setShelfPurchaseNPC(null);
        setShelfCheckoutInProgress(false);
        scheduleNextShelfPurchase();
      }, 2000);
    }
  };

  // Handle checkout decline
  const handleShelfCheckoutDecline = () => {
    if (shelfPurchaseNPC) {
      RundotGameAPI.analytics.recordCustomEvent('shelf_checkout_declined', {
        bouquetId: shelfPurchaseNPC.bouquet.id,
        price: shelfPurchaseNPC.bouquet.sellPrice,
      });
    }

    // Wait for NPC animation to finish, then clear state and schedule next one
    setTimeout(() => {
      setShelfPurchaseNPC(null);
      setShelfCheckoutInProgress(false);
      scheduleNextShelfPurchase();
    }, 2000);
  };

  // Schedule special deliveries (4 hours)
  const scheduleNextDelivery = () => {
    try {
      if (deliveryTimerRef.current) clearTimeout(deliveryTimerRef.current);

      const triggerDelivery = () => {
        // Use localStorage to check active delivery to avoid stale closure
        if (!localStorage.getItem('activeDelivery') && !customizingTruck) {
          const newDelivery = generateSpecialDelivery();
          // Only show delivery if it has items
          if (newDelivery.flowers.length > 0 && newDelivery.bouquets.length > 0) {
            setActiveDelivery(newDelivery);
            addNotification('special_delivery', '🚚 Special Delivery!', 'Your delivery truck has arrived!', true);
            RundotGameAPI.analytics.recordCustomEvent('special_delivery_arrived', {
              deliveryId: newDelivery.id,
            });
          }
        }
      };

      const stored = localStorage.getItem('nextDeliveryTime');
      if (stored) {
        const remaining = parseInt(stored) - Date.now();
        if (remaining <= 0) {
          // Delivery is overdue (e.g. player returned after a long break) — trigger now
          // Don't clear nextDeliveryTime yet - it will be cleared when player accepts/denies
          triggerDelivery();
          return;
        }
        // Resume the existing countdown — don't reset it to a fresh 4 hours
        deliveryTimerRef.current = setTimeout(triggerDelivery, remaining);
      } else {
        // No scheduled delivery yet — set a fresh 4-hour timer
        const delay = 4 * 60 * 60 * 1000;
        const nextTime = Date.now() + delay;
        localStorage.setItem('nextDeliveryTime', nextTime.toString());
        deliveryTimerRef.current = setTimeout(triggerDelivery, delay);
      }
    } catch (error) {
      console.error('Error scheduling delivery:', error);
    }
    // Don't schedule next delivery yet - wait for player to accept/deny current one
  };

  // Sync activeDelivery to localStorage
  useEffect(() => {
    if (activeDelivery) {
      localStorage.setItem('activeDelivery', JSON.stringify(activeDelivery));
    } else {
      localStorage.removeItem('activeDelivery');
    }
  }, [activeDelivery]);

  useEffect(() => {
    scheduleNextDelivery();
    return () => {
      if (deliveryTimerRef.current) clearTimeout(deliveryTimerRef.current);
    };
  }, []);

  // Online order spawn timer
  const scheduleNextOnlineOrder = () => {
    const delay = ONLINE_ORDER_SPAWN_MIN + Math.random() * (ONLINE_ORDER_SPAWN_MAX - ONLINE_ORDER_SPAWN_MIN);
    onlineOrderTimerRef.current = setTimeout(async () => {
      moduleOnlineOrderTimerRef = onlineOrderTimerRef.current;
      const state = useGameStore.getState();

      // Expire any stale pending online orders first
      state.expirePendingOnlineOrders();

      // Check daily reset using server time
      try {
        const serverNow = await getServerNow();
        const d = new Date(serverNow);
        const serverDateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
        state.checkAndResetOnlineOrderDaily(serverDateStr);
      } catch {
        // best-effort: fall back to client time for date
      }

      // Try to spawn a new online order
      const freshState = useGameStore.getState();
      if (
        freshState.pendingOnlineOrders.length === 0 &&
        freshState.onlineOrdersCompletedToday < 15
      ) {
        const newOrder = freshState.createPendingOnlineOrder();
        if (newOrder) {
          // Trigger notification (link to pending order, will be updated to link to accepted order if accepted)
          freshState.addNotification(
            'online_order',
            '🌐 New Online Order!',
            `Someone wants a ${newOrder.recipeName}! Check Online Orders.`,
            true,
            newOrder.id
          );
          RundotGameAPI.analytics.recordCustomEvent('online_order_notification_sent', {
            recipeId: newOrder.recipeId,
            reward: newOrder.reward,
          });
        }
      }

      scheduleNextOnlineOrder();
    }, delay);
  };

  useEffect(() => {
    // Also check for daily reset and expired orders on mount
    const initOnlineOrders = async () => {
      try {
        const serverNow = await getServerNow();
        const d = new Date(serverNow);
        const serverDateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
        checkAndResetOnlineOrderDaily(serverDateStr);
      } catch {
        // best-effort
      }
      expirePendingOnlineOrders();
    };
    initOnlineOrders();
    scheduleNextOnlineOrder();
    return () => {
      if (onlineOrderTimerRef.current) clearTimeout(onlineOrderTimerRef.current);
    };
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

  // Calculate total cost of ingredients for a bouquet
  const calculateBouquetCost = (bouquet: Bouquet): number => {
    let totalCost = 0;
    for (const stem of bouquet.stems) {
      const flower = FLOWERS[stem.flowerId];
      if (flower) {
        totalCost += flower.pricePerStem;
      }
    }
    return totalCost;
  };

  const handleConfirmDelete = () => {
    if (longPressId) {
      const bouquet = shelfBouquets.find((b) => b.id === longPressId);
      if (bouquet) {
        const refundAmount = calculateBouquetCost(bouquet);
        addCoins(refundAmount);
        removeBouquetFromShelf(longPressId);
        RundotGameAPI.analytics.recordCustomEvent('bouquet_deleted', {
          bouquetId: longPressId,
          refundAmount,
        });
      }
      setLongPressId(null);
    }
  };

  const handleCancelDelete = () => {
    setLongPressId(null);
  };

  const handleEditorClose = () => {
    setShelfConfig(loadShelfLayoutConfig());
    setEditingLayout(false);
  };

  const handleNPCCustomizerClose = () => {
    setCustomizingNPC(false);
  };

  const handleShelfNPCCustomizerClose = () => {
    setCustomizingShelfNPC(false);
  };

  const handleTruckCustomizerClose = () => {
    setCustomizingTruck(false);
  };

  // Split displayed bouquets into rows of BOUQUETS_PER_SHELF for shelf display
  const shelfRows: (Bouquet | null)[][] = [];
  for (let i = 0; i < displayedBouquets.length; i += BOUQUETS_PER_SHELF) {
    shelfRows.push(displayedBouquets.slice(i, i + BOUQUETS_PER_SHELF));
  }

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        overflow: 'hidden',
        backgroundImage: `url(${shopBackground})`,
        backgroundSize: '100% 100%',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
      }}
    >
      {/* Top bar with level, notification bell, and coins */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: 0,
          right: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: '12px',
          paddingRight: '12px',
        }}
      >
        {/* Level display — left */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#C09840',
            background: '#F5F1E8',
            border: '2px solid #C09840',
            borderRadius: '50px',
            padding: '8px 14px',
            minWidth: '180px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ fontSize: '18px' }}>⭐</span>
          <span>Level {getCurrentLevel(cumulativeBouquetsSold)} ({getLevelProgress(cumulativeBouquetsSold)[0]}/{getLevelProgress(cumulativeBouquetsSold)[1]})</span>
        </div>

        {/* Notification Bell — center */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <NotificationBell onOpen={() => setIsNotificationCenterOpen(true)} />
        </div>

        {/* Coin Counter — right */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            flexDirection: 'column',
            alignItems: 'flex-end',
          }}
        >
          <CoinCounter />
        </div>
      </div>

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
            {row.map((bouquet, _idx) => {
              // Skip rendering empty slots (null bouquets)
              if (!bouquet) return null;

              return (
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
                    src={bouquet.thumbnailUrl || './bouquets/sunshine-bunch.png'}
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

                {/* Delete confirmation shown on long-press */}
                {longPressId === bouquet.id && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      background: '#FFFDF5',
                      border: '2px solid #E8C5A0',
                      borderRadius: '12px',
                      padding: '14px 16px',
                      maxWidth: '220px',
                      textAlign: 'center',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                      zIndex: 20,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '13px',
                        color: '#4A2C17',
                        fontWeight: '600',
                        lineHeight: 1.4,
                      }}
                    >
                      Would you like to delete your bouquet? All costs for ingredients will be refunded.
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        justifyContent: 'center',
                        marginTop: '6px',
                      }}
                    >
                      <button
                        onClick={handleCancelDelete}
                        style={{
                          background: '#F5E6D8',
                          border: '1.5px solid #D4A57C',
                          borderRadius: '18px',
                          padding: '6px 14px',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          color: '#6A4C3A',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#E8D5C5';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#F5E6D8';
                        }}
                      >
                        Not now
                      </button>
                      <button
                        onClick={handleConfirmDelete}
                        style={{
                          background: '#C0392B',
                          border: '1.5px solid #A93226',
                          borderRadius: '18px',
                          padding: '6px 14px',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          color: '#FFF',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#A93226';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#C0392B';
                        }}
                      >
                        Yes
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
            })}
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

      {/* Shelf Checkout Dialog — only show if no other NPCs are active */}
      {shelfPurchaseNPC && !activeVisit && !activeDelivery && (
        <ShelfCheckoutDialog
          npcImage={shelfPurchaseNPC.npcImage}
          bouquet={shelfPurchaseNPC.bouquet}
          onConfirm={handleShelfCheckoutConfirm}
          onDecline={handleShelfCheckoutDecline}
        />
      )}

      {/* Order Thank You Animation */}
      {orderJustCompleted && completedOrderCustomerImage && (
        <OrderThankYouOverlay
          customerImage={completedOrderCustomerImage}
          onComplete={() => useGameStore.setState({ orderJustCompleted: false, completedOrderCustomerImage: undefined })}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        musicVolume={musicVolume}
        onMusicVolumeChange={handleMusicVolumeChange}
        isMusicMuted={isMusicMuted}
        onToggleMusicMute={handleToggleMusicMute}
        sfxVolume={sfxVolume}
        onSfxVolumeChange={handleSfxVolumeChange}
        isSfxMuted={isSfxMuted}
        onToggleSfxMute={handleToggleSfxMute}
      />

      {/* Notification Center Modal */}
      <NotificationCenter
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        onNotificationClick={handleNotificationClick}
      />

      {/* Notification Popup */}
      {currentPopupNotification && (
        <NotificationPopup
          title={currentPopupNotification.title}
          message={currentPopupNotification.message}
          emoji={currentPopupNotification.emoji}
          onComplete={handlePopupNotificationComplete}
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
        <BottomTabNavigation onSettingsClick={() => setIsSettingsOpen(true)} />
      </div>

      {/* Shelf Layout Editor overlay */}
      {editingLayout && <ShelfLayoutEditor onClose={handleEditorClose} />}

      {/* NPC Customizer overlay */}
      {customizingNPC && <NPCCustomizer onClose={handleNPCCustomizerClose} />}

      {/* Shelf NPC Customizer overlay */}
      {customizingShelfNPC && <ShelfNPCCustomizer onClose={handleShelfNPCCustomizerClose} />}

      {/* Truck Customizer overlay */}
      {customizingTruck && <TruckCustomizer onClose={handleTruckCustomizerClose} />}

      {/* Flower Unlock Notification */}
      {currentUnlock && (
        <FlowerUnlockNotification
          flowerId={currentUnlock}
          onComplete={handleUnlockNotificationComplete}
        />
      )}
    </div>
  );
}
