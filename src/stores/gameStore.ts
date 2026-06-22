import { create } from 'zustand';
import {
  ShopState,
  Bouquet,
  BouquetStem,
  RibbonColor,
  WrappingPaperType,
  StemInInventory,
  Order,
  PendingOnlineOrder,
  MysteryBouquetItem,
  BouquetTier,
  Notification,
} from '../types';
import { FLOWERS, INITIAL_UNLOCKED_FLOWERS, CUSTOMER_MOODS } from '../constants/flowers';
import { BOUQUET_RECIPES, getRecipeById, isBouquetUnlocked } from '../data/bouquets';
import { MYSTERY_BOX_COST_RUN_BUCKS, getRandomMysteryBouquet } from '../data/mysteryBox';
import { EXCLUSIVE_BOX_COSTS } from '../data/exclusiveBouquets';
import { generateExclusiveBoxContents } from '../data/mysteryBoxContents';
import { getUnlockedFlowersAt } from '../data/progression';
import { getOrderQuantity, calculateScaledReward, getOrderRarity } from '../utils/orderUtils';
import RundotGameAPI from '@series-inc/rundot-game-sdk/api';
import { playChaChingSound, playSuccessSound } from '../services/audio';
import { loadNPCCustomizationConfig } from '../game/components/NPCCustomizer';
import { loadShelfNPCCustomizationConfig } from '../game/components/ShelfNPCCustomizer';
import { loadShelfLayoutConfig } from '../game/components/ShelfLayoutEditor';
import { loadTruckCustomizationConfig } from '../game/components/TruckCustomizer';

const STARTING_COINS = 250;
const STARTING_INVENTORY_CAPACITY = 125;
const MAX_INVENTORY_CAPACITY = 450;
const STARTING_SHELF_CAPACITY = 15;
const DAILY_PURCHASE_LIMIT = 999999; // Unlimited stems per flower per day

const getTodayDateString = () => {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
};

const createInitialState = (): ShopState => ({
  // Economy
  coins: STARTING_COINS,
  totalEarned: 0,
  premiumCurrency: 0,

  // Inventory
  inventory: [],
  inventoryCapacity: STARTING_INVENTORY_CAPACITY,
  mysteryBouquets: [],
  exclusiveBouquets: [],

  // Shop
  shelfCapacity: STARTING_SHELF_CAPACITY,
  shelfBouquets: [],
  bouquetStorageCapacity: 50, // Max bouquets in inventory
  pendingBouquets: [],
  displayedBouquets: Array(STARTING_SHELF_CAPACITY).fill(null),

  // Customers & Orders
  activeCustomers: [],
  totalCustomersServed: 0,
  pendingOrders: [],
  completedOrders: [],

  // Notifications
  notifications: [],
  lastNotification: null,

  // Progression
  unlockedFlowers: new Set(INITIAL_UNLOCKED_FLOWERS),
  unlockedRibbons: ['blush', 'ivory'],
  unlockedWrappings: ['plain-white', 'kraft'],
  cumulativeBouquetsSold: 0,
  unlockedTiers: new Set<BouquetTier>(['budget']),

  // Online Orders
  pendingOnlineOrders: [],
  onlineOrdersCompletedToday: 0,
  lastOnlineOrderResetDate: getTodayDateString(),

  // Daily limits
  dailyPurchases: {},
  lastPurchaseDate: getTodayDateString(),

  // Rewards
  unclaimedRewards: [],
  hasReceivedFirstTimeGift: false,

  // Meta
  lastUpdated: Date.now(),
  sessionStarted: Date.now(),

  // UI state
  currentScreen: 'shop',
  stemsInArrangement: [],
  bouquetQuantityToBuild: 1,
  shoppingForOrderId: undefined,
  neededFlowerId: undefined,
  neededFlowerQuantity: 0,
  neededFlowersList: [] as Array<{ flowerId: string; quantity: number }>,
  orderJustCompleted: false,
  completedOrderCustomerImage: undefined,
  pendingBoxReveal: undefined,

  // Shelf Layout (load from localStorage to persist across sessions)
  shelfLayoutConfig: loadShelfLayoutConfig(),

  // NPC Customization (load from localStorage to persist across sessions)
  npcCustomizationConfig: loadNPCCustomizationConfig(),

  // Shelf NPC Customization (load from localStorage to persist across sessions)
  shelfNPCCustomizationConfig: loadShelfNPCCustomizationConfig(),

  // Truck Customization (load from localStorage to persist across sessions)
  truckCustomizationConfig: loadTruckCustomizationConfig(),

  // Tutorial
  tutorialCompleted: false,
  tutorialCurrentStep: 0,
});

interface GameStoreActions {
  // Economy
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;

  // Inventory
  addStemsToInventory: (flowerId: string, quantity: number) => boolean;
  removeStemsFromInventory: (flowerId: string, quantity: number) => boolean;
  getTotalStemsInInventory: () => number;

  // Daily limits
  checkDailyLimit: (flowerId: string, quantity: number) => { canBuy: boolean; remaining: number };
  recordDailyPurchase: (flowerId: string, quantity: number) => void;

  // Bouquet creation
  addStemToArrangement: (flowerId: string) => boolean;
  removeStemFromArrangement: (order: number) => void;
  clearArrangement: () => void;
  getStemsInArrangement: () => BouquetStem[];

  // Wrapping
  setWrappingSelection: (wrapping: WrappingPaperType, ribbon: RibbonColor) => void;
  createBouquet: () => Bouquet | null;

  // Recipe system
  selectRecipe: (recipeId: string, fulfillOrderId?: string, quantity?: number) => boolean;
  clearSelectedRecipe: () => void;
  canMakeRecipe: (recipeId: string, orderId?: string) => boolean;
  getRecipeMissingIngredients: (recipeId: string, orderId?: string) => Array<{ flowerId: string; needed: number; have: number }>;
  getMaxBouquetsThatCanBeMade: (recipeId: string) => number;
  setBouquetQuantityToBuild: (quantity: number) => void;
  createBouquets: () => Bouquet[];

  // Shelf
  addBouquetToShelf: (bouquet: Bouquet) => boolean;
  addBouquetToPending: (bouquet: Bouquet) => void;
  removeBouquetFromPending: (bouquetId: string) => void;
  removeBouquetFromShelf: (bouquetId: string) => void;
  getShelfDisplay: () => (Bouquet | null)[];

  // Shelf expansion
  expandShelf: () => boolean;
  getShelfExpansionCost: () => number;

  // Screen navigation
  setCurrentScreen: (screen: 'shop' | 'wholesale' | 'arrangement' | 'wrapping' | 'inventory' | 'orders' | 'online-orders') => void;

  // Customer management
  addActiveCustomer: () => void;
  removeActiveCustomer: (customerId: string) => void;
  sellBouquet: (bouquetId: string, priceOverride?: number) => boolean;
  sellPendingBouquet: (bouquetId: string, priceOverride?: number) => boolean;

  // Order management
  createOrder: (npcImage?: string) => Order | null;
  completeOrder: (orderId: string, reward: number) => void;
  removeOrder: (orderId: string) => void;
  getPendingOrders: () => Order[];
  triggerNotification: (message: string) => void;
  clearNotification: () => void;
  setShoppingForOrderId: (orderId?: string) => void;
  getOrderForShopping: (orderId: string) => Order | undefined;
  setNeededFlower: (flowerId?: string, quantity?: number) => void;
  setNeededFlowers: (flowers: Array<{ flowerId: string; quantity: number }>) => void;

  // Online Order management
  createPendingOnlineOrder: () => PendingOnlineOrder | null;
  acceptOnlineOrder: (orderId: string) => void;
  denyOnlineOrder: (orderId: string) => void;
  expirePendingOnlineOrders: () => void;
  checkAndResetOnlineOrderDaily: (serverDateStr: string) => void;

  // Mystery box management
  purchaseMysteryBox: () => boolean;
  sellMysteryBouquet: (bouquetId: string) => boolean;

  // Exclusive mystery box management
  purchaseExclusiveBox: (quantity: 1 | 2 | 3) => boolean;
  addExclusiveBouquetToShelf: (bouquetId: string) => boolean;
  displayExclusiveBouquetOnShelf: (bouquetId: string) => boolean;
  sellExclusiveBouquet: (bouquetId: string) => boolean;
  setPendingBoxReveal: (contents: any[] | undefined) => void;

  addPremiumCurrency: (amount: number) => void;

  // Progression
  unlockFlower: (flowerId: string) => void;
  unlockRibbon: (ribbon: RibbonColor) => void;
  unlockWrapping: (wrapping: WrappingPaperType) => void;
  unlockTier: (tier: BouquetTier) => void;
  isFlowerUnlocked: (flowerId: string) => boolean;
  isTierUnlocked: (tier: BouquetTier) => boolean;
  getCumulativeBouquetsSold: () => number;

  // Save/load
  saveGameState: () => void;
  loadGameState: () => void;
  resetGame: () => void;

  // Utilities
  getTotalInventoryValue: () => number;
  calculateBouquetPrice: (stems: BouquetStem[]) => number;

  // Rewards
  addUnclaimedReward: (level: number) => void;
  claimLevelReward: (level: number) => void;
  getUnclaimedRewardCount: () => number;

  // Notifications
  addNotification: (type: Notification['type'], title: string, message: string, showPopup: boolean, linkedOrderId?: string) => void;
  markNotificationAsRead: (notificationId: string) => void;
  markNotificationAsFulfilled: (notificationId: string) => void;
  removeNotification: (notificationId: string) => void;
  getUnreadNotificationCount: () => number;

  // Shelf Layout
  saveShelfLayoutConfig: (config: {
    shelves: Array<{ x: number; y: number }>;
    gap: number;
    bouquetWidth: number;
    bouquetHeight: number;
  }) => void;

  // NPC Customization
  saveNPCCustomizationConfig: (config: {
    height: number;
    bottomOffset: number;
    rightOffset: number;
  }) => void;

  // Shelf NPC Customization
  saveShelfNPCCustomizationConfig: (config: {
    height: number;
    bottomOffset: number;
    rightOffset: number;
  }) => void;

  // Truck Customization
  saveTruckCustomizationConfig: (config: {
    width: number;
    topOffset: number;
    rightOffset: number;
  }) => void;

  // Tutorial
  setTutorialStep: (step: number) => void;
  completeTutorial: () => void;
}

export const useGameStore = create<ShopState & GameStoreActions>((set, get) => ({
  ...createInitialState(),

  // Economy
  addCoins: (amount: number) => {
    const state = get();
    console.log('💰 addCoins called:', { amount, previousCoins: state.coins, newCoins: state.coins + amount });
    set((state) => ({
      coins: state.coins + amount,
      totalEarned: state.totalEarned + amount,
      lastUpdated: Date.now(),
    }));
  },

  spendCoins: (amount: number) => {
    const state = get();
    if (state.coins >= amount) {
      set((s) => ({ coins: s.coins - amount, lastUpdated: Date.now() }));
      return true;
    }
    return false;
  },

  // Inventory
  addStemsToInventory: (flowerId: string, quantity: number) => {
    const state = get();
    const totalStemsAfter = state.getTotalStemsInInventory() + quantity;

    if (totalStemsAfter > state.inventoryCapacity) {
      return false;
    }

    set((s) => {
      const existing = s.inventory.find((item) => item.flowerId === flowerId);
      if (existing) {
        return {
          inventory: s.inventory.map((item) =>
            item.flowerId === flowerId ? { ...item, quantity: item.quantity + quantity } : item
          ),
          lastUpdated: Date.now(),
        };
      }
      return {
        inventory: [...s.inventory, { flowerId, quantity }],
        lastUpdated: Date.now(),
      };
    });
    return true;
  },

  removeStemsFromInventory: (flowerId: string, quantity: number) => {
    const state = get();
    const existing = state.inventory.find((item) => item.flowerId === flowerId);

    if (!existing || existing.quantity < quantity) {
      return false;
    }

    set((s) => ({
      inventory: s.inventory
        .map((item) =>
          item.flowerId === flowerId ? { ...item, quantity: item.quantity - quantity } : item
        )
        .filter((item) => item.quantity > 0),
      lastUpdated: Date.now(),
    }));
    return true;
  },

  getTotalStemsInInventory: () => {
    const state = get();
    return state.inventory.reduce((sum, item) => sum + item.quantity, 0);
  },

  // Daily limits
  checkDailyLimit: (flowerId: string, quantity: number) => {
    const state = get();
    const today = getTodayDateString();

    // Reset if it's a new day
    if (state.lastPurchaseDate !== today) {
      set({ dailyPurchases: {}, lastPurchaseDate: today });
      return { canBuy: true, remaining: DAILY_PURCHASE_LIMIT };
    }

    const alreadyBought = state.dailyPurchases[flowerId] || 0;
    const remaining = DAILY_PURCHASE_LIMIT - alreadyBought;
    const canBuy = remaining >= quantity;

    return { canBuy, remaining: Math.max(0, remaining - quantity) };
  },

  recordDailyPurchase: (flowerId: string, quantity: number) => {
    const state = get();
    const today = getTodayDateString();

    set({
      dailyPurchases: {
        ...state.dailyPurchases,
        [flowerId]: (state.dailyPurchases[flowerId] || 0) + quantity,
      },
      lastPurchaseDate: today,
    });
  },

  // Bouquet arrangement
  addStemToArrangement: (flowerId: string) => {
    const state = get();
    if (state.stemsInArrangement.length >= 10) return false;
    if (!state.inventory.find((item) => item.flowerId === flowerId && item.quantity > 0)) {
      return false;
    }

    set((s) => ({
      stemsInArrangement: [
        ...s.stemsInArrangement,
        { flowerId, order: s.stemsInArrangement.length },
      ],
    }));
    return true;
  },

  removeStemFromArrangement: (order: number) => {
    set((s) => ({
      stemsInArrangement: s.stemsInArrangement
        .filter((stem) => stem.order !== order)
        .map((stem, idx) => ({ ...stem, order: idx })),
    }));
  },

  clearArrangement: () => {
    set({ stemsInArrangement: [], inProgressWrapping: undefined, selectedRecipeId: undefined, fulfillOrderId: undefined });
  },

  getStemsInArrangement: () => {
    return get().stemsInArrangement;
  },

  // Recipe system
  selectRecipe: (recipeId: string, fulfillOrderId?: string, quantity: number = 1) => {
    const recipe = getRecipeById(recipeId);
    if (!recipe) return false;
    // Build stemsInArrangement from recipe ingredients (expanded per quantity)
    const stems: BouquetStem[] = [];
    let idx = 0;
    for (const ing of recipe.ingredients) {
      for (let q = 0; q < ing.quantity; q++) {
        stems.push({ flowerId: ing.flowerId, order: idx++ });
      }
    }
    set({
      selectedRecipeId: recipeId,
      fulfillOrderId,
      stemsInArrangement: stems,
      bouquetQuantityToBuild: quantity,
    });
    return true;
  },

  clearSelectedRecipe: () => {
    set({ selectedRecipeId: undefined, fulfillOrderId: undefined, stemsInArrangement: [] });
  },

  canMakeRecipe: (recipeId: string, orderId?: string) => {
    const state = get();
    const recipe = getRecipeById(recipeId);
    if (!recipe) return false;

    // Get order quantity if fulfilling an order
    let orderQuantity = 1;
    if (orderId) {
      const order = state.pendingOrders.find((o) => o.id === orderId);
      if (order) {
        orderQuantity = order.quantity;
      }
    }

    // Check inventory for (quantity * ingredients needed)
    for (const ing of recipe.ingredients) {
      const needed = ing.quantity * orderQuantity;
      const inv = state.inventory.find((i) => i.flowerId === ing.flowerId);
      if (!inv || inv.quantity < needed) return false;
    }
    return true;
  },

  getRecipeMissingIngredients: (recipeId: string, orderId?: string) => {
    const state = get();
    const recipe = getRecipeById(recipeId);
    if (!recipe) return [];

    // Get order quantity if fulfilling an order
    let orderQuantity = 1;
    if (orderId) {
      const order = state.pendingOrders.find((o) => o.id === orderId);
      if (order) {
        orderQuantity = order.quantity;
      }
    }

    return recipe.ingredients.map((ing) => {
      const needed = ing.quantity * orderQuantity;
      const inv = state.inventory.find((i) => i.flowerId === ing.flowerId);
      return {
        flowerId: ing.flowerId,
        needed,
        have: inv ? inv.quantity : 0,
      };
    });
  },

  getMaxBouquetsThatCanBeMade: (recipeId: string) => {
    const state = get();
    const recipe = getRecipeById(recipeId);
    if (!recipe) return 0;

    let maxBouquets = Infinity;
    for (const ing of recipe.ingredients) {
      const inv = state.inventory.find((i) => i.flowerId === ing.flowerId);
      const available = inv ? inv.quantity : 0;
      const bouquetsFromThisFlower = Math.floor(available / ing.quantity);
      maxBouquets = Math.min(maxBouquets, bouquetsFromThisFlower);
    }

    return maxBouquets === Infinity ? 0 : maxBouquets;
  },

  setBouquetQuantityToBuild: (quantity: number) => {
    set({ bouquetQuantityToBuild: Math.max(1, quantity) });
  },

  createBouquets: () => {
    const state = get();
    const stems = state.stemsInArrangement;
    const wrapping = state.inProgressWrapping;
    const quantity = state.bouquetQuantityToBuild;

    if (stems.length === 0 || !wrapping || quantity < 1) return [];

    const bouquets: Bouquet[] = [];

    // Create the requested number of bouquets
    for (let i = 0; i < quantity; i++) {
      // Remove stems from inventory for this bouquet
      for (const stem of stems) {
        if (!state.removeStemsFromInventory(stem.flowerId, 1)) {
          // If we can't remove a stem, stop creating bouquets
          return bouquets;
        }
      }

      // Use recipe data if a recipe is selected
      const recipe = state.selectedRecipeId ? getRecipeById(state.selectedRecipeId) : undefined;
      const price = recipe ? recipe.sellPrice : state.calculateBouquetPrice(stems);
      const thumbnailUrl = recipe ? recipe.imageUrl : './bouquets/sunshine-bunch.png';

      const bouquet: Bouquet = {
        id: `bouquet-${Date.now()}-${Math.random()}-${i}`,
        stems: [...stems],
        wrappingPaper: wrapping.wrapping,
        ribbonColor: wrapping.ribbon,
        sellPrice: price,
        thumbnailUrl,
        createdAt: Date.now(),
        recipeName: recipe?.name,
      };

      bouquets.push(bouquet);
    }

    // Clear the arrangement and reset quantity
    set({
      stemsInArrangement: [],
      inProgressWrapping: undefined,
      selectedRecipeId: undefined,
      bouquetQuantityToBuild: 1,
      currentScreen: 'shop',
    });

    return bouquets;
  },

  // Wrapping
  setWrappingSelection: (wrapping: WrappingPaperType, ribbon: RibbonColor) => {
    set({ inProgressWrapping: { wrapping, ribbon } });
  },

  createBouquet: () => {
    const state = get();
    const stems = state.stemsInArrangement;
    const wrapping = state.inProgressWrapping;

    if (stems.length === 0 || !wrapping) return null;

    // Remove stems from inventory (1 per stem entry)
    for (const stem of stems) {
      if (!state.removeStemsFromInventory(stem.flowerId, 1)) {
        return null;
      }
    }

    // Use recipe data if a recipe is selected, otherwise fall back to calculation
    const recipe = state.selectedRecipeId ? getRecipeById(state.selectedRecipeId) : undefined;
    const price = recipe ? recipe.sellPrice : state.calculateBouquetPrice(stems);
    const thumbnailUrl = recipe ? recipe.imageUrl : './bouquets/sunshine-bunch.png';

    const bouquet: Bouquet = {
      id: `bouquet-${Date.now()}-${Math.random()}`,
      stems,
      wrappingPaper: wrapping.wrapping,
      ribbonColor: wrapping.ribbon,
      sellPrice: price,
      thumbnailUrl,
      createdAt: Date.now(),
      recipeName: recipe?.name,
    };

    // If fulfilling an order, complete it instead of going to shop shelf
    const fulfillOrderId = state.fulfillOrderId;
    if (fulfillOrderId) {
      const order = state.pendingOrders.find((o) => o.id === fulfillOrderId);
      if (order) {
        // For online orders, pay the stored reward (includes 10% bonus)
        // For NPC orders, pay the recipe price
        const actualPrice = order.isOnlineOrder ? order.reward : price;
        const customerImage = order.npcImage || undefined;

        set((s) => ({
          pendingOrders: s.pendingOrders.filter((o) => o.id !== fulfillOrderId),
          completedOrders: [...s.completedOrders, { ...order, status: 'completed' }],
          totalCustomersServed: s.totalCustomersServed + 1,
          // Increment online daily counter if applicable
          onlineOrdersCompletedToday: order.isOnlineOrder
            ? s.onlineOrdersCompletedToday + 1
            : s.onlineOrdersCompletedToday,
          stemsInArrangement: [],
          inProgressWrapping: undefined,
          selectedRecipeId: undefined,
          fulfillOrderId: undefined,
          // Only show thank-you animation for NPC orders (they have a character image)
          orderJustCompleted: !order.isOnlineOrder,
          completedOrderCustomerImage: order.isOnlineOrder ? undefined : customerImage,
          // Mark corresponding order notifications as fulfilled
          notifications: s.notifications.map((notif) =>
            (notif.linkedOrderId === fulfillOrderId) ? { ...notif, fulfilled: true } : notif
          ),
          currentScreen: 'shop',
          lastUpdated: Date.now(),
        }));
        state.addCoins(actualPrice);
        playChaChingSound();
        return bouquet;
      }
    }

    set({
      stemsInArrangement: [],
      inProgressWrapping: undefined,
      selectedRecipeId: undefined,
      currentScreen: 'shop',
    });

    return bouquet;
  },

  // Shelf
  addBouquetToShelf: (bouquet: Bouquet) => {
    const state = get();
    const emptySpotIndex = state.displayedBouquets.findIndex((b) => b === null);

    if (emptySpotIndex === -1) {
      return false;
    }

    set((s) => {
      const newDisplayed = [...s.displayedBouquets];
      newDisplayed[emptySpotIndex] = bouquet;
      return {
        displayedBouquets: newDisplayed,
        shelfBouquets: [...s.shelfBouquets, bouquet],
        lastUpdated: Date.now(),
      };
    });
    return true;
  },

  addBouquetToPending: (bouquet: Bouquet) => {
    set((s) => {
      // Check if storage is full (50 bouquet limit)
      if (s.pendingBouquets.length >= s.bouquetStorageCapacity) {
        // Storage is full - don't add
        return s;
      }
      return {
        pendingBouquets: [...s.pendingBouquets, bouquet],
        lastUpdated: Date.now(),
      };
    });
  },

  removeBouquetFromPending: (bouquetId: string) => {
    set((s) => ({
      pendingBouquets: s.pendingBouquets.filter((b) => b.id !== bouquetId),
      lastUpdated: Date.now(),
    }));
  },

  removeBouquetFromShelf: (bouquetId: string) => {
    set((s) => ({
      displayedBouquets: s.displayedBouquets.map((b) => (b?.id === bouquetId ? null : b)),
      shelfBouquets: s.shelfBouquets.filter((b) => b.id !== bouquetId),
      lastUpdated: Date.now(),
    }));
  },

  getShelfDisplay: () => {
    return get().displayedBouquets;
  },

  // Shelf expansion
  expandShelf: () => {
    const state = get();
    const cost = state.getShelfExpansionCost();

    if (state.shelfCapacity >= 50 || !state.spendCoins(cost)) {
      return false;
    }

    set((s) => ({
      shelfCapacity: Math.min(s.shelfCapacity + 5, 50),
      displayedBouquets: [
        ...s.displayedBouquets,
        ...Array(5).fill(null),
      ],
      lastUpdated: Date.now(),
    }));
    return true;
  },

  getShelfExpansionCost: () => 150,

  // Screen navigation
  setCurrentScreen: (screen) => {
    set({ currentScreen: screen });
  },

  // Customer management
  addActiveCustomer: () => {
    const customerId = `customer-${Date.now()}`;
    const types: Array<'customer-a' | 'customer-b' | 'customer-c'> = [
      'customer-a',
      'customer-b',
      'customer-c',
    ];
    const selectedType = types[Math.floor(Math.random() * types.length)]!;

    set((s) => ({
      activeCustomers: [
        ...s.activeCustomers,
        {
          id: customerId,
          name: `Customer ${s.activeCustomers.length + 1}`,
          type: selectedType,
          mood: 'browsing',
          mood_emoji: '👀',
        },
      ],
    }));
  },

  removeActiveCustomer: (customerId: string) => {
    set((s) => ({
      activeCustomers: s.activeCustomers.filter((c) => c.id !== customerId),
    }));
  },

  sellBouquet: (bouquetId: string, priceOverride?: number) => {
    const state = get();
    const bouquet = state.shelfBouquets.find((b) => b.id === bouquetId);

    if (!bouquet) return false;

    const price = priceOverride || bouquet.sellPrice;
    playChaChingSound();

    const newCumulativeSales = state.cumulativeBouquetsSold + 1;
    const newUnlockedFlowers = new Set(state.unlockedFlowers);
    const newUnlockedTiers = new Set(state.unlockedTiers);

    // Check for flower unlocks at new sales count
    const availableFlowers = getUnlockedFlowersAt(newCumulativeSales);
    availableFlowers.forEach((flowerId) => newUnlockedFlowers.add(flowerId));

    // Remove sold bouquet from shelf
    const updatedShelfBouquets = state.shelfBouquets.filter((b) => b.id !== bouquetId);
    const updatedDisplayedBouquets = state.displayedBouquets.map((b) => (b?.id === bouquetId ? null : b));

    // Move pending bouquets to shelf if there's space
    const pendingBouquets = [...state.pendingBouquets];
    const currentShelfSize = updatedShelfBouquets.length;
    const shelfSpaceAvailable = state.shelfCapacity - currentShelfSize;

    if (pendingBouquets.length > 0 && shelfSpaceAvailable > 0) {
      const bouquetsToMove = pendingBouquets.splice(0, shelfSpaceAvailable);
      for (const pendingBouquet of bouquetsToMove) {
        updatedShelfBouquets.push(pendingBouquet);
        const displayIndex = updatedDisplayedBouquets.findIndex((b) => b === null);
        if (displayIndex !== -1) {
          updatedDisplayedBouquets[displayIndex] = pendingBouquet;
        }
      }
    }

    // Atomic update: coins, shelf, pending, and stats all at once
    set((s) => ({
      coins: s.coins + price,
      totalEarned: s.totalEarned + price,
      shelfBouquets: updatedShelfBouquets,
      displayedBouquets: updatedDisplayedBouquets,
      pendingBouquets: pendingBouquets,
      totalCustomersServed: s.totalCustomersServed + 1,
      cumulativeBouquetsSold: newCumulativeSales,
      unlockedFlowers: newUnlockedFlowers,
      unlockedTiers: newUnlockedTiers,
      lastUpdated: Date.now(),
    }));

    return true;
  },

  sellPendingBouquet: (bouquetId: string, priceOverride?: number) => {
    const state = get();
    const bouquet = state.pendingBouquets.find((b) => b.id === bouquetId);

    if (!bouquet) return false;

    const price = priceOverride || bouquet.sellPrice;
    playChaChingSound();

    const newCumulativeSales = state.cumulativeBouquetsSold + 1;
    const newUnlockedFlowers = new Set(state.unlockedFlowers);
    const newUnlockedTiers = new Set(state.unlockedTiers);

    // Check for flower unlocks at new sales count
    const availableFlowers = getUnlockedFlowersAt(newCumulativeSales);
    availableFlowers.forEach((flowerId) => newUnlockedFlowers.add(flowerId));

    // Atomic update: coins and pending bouquets all at once
    set((s) => ({
      coins: s.coins + price,
      totalEarned: s.totalEarned + price,
      pendingBouquets: s.pendingBouquets.filter((b) => b.id !== bouquetId),
      totalCustomersServed: s.totalCustomersServed + 1,
      cumulativeBouquetsSold: newCumulativeSales,
      unlockedFlowers: newUnlockedFlowers,
      unlockedTiers: newUnlockedTiers,
      lastUpdated: Date.now(),
    }));

    return true;
  },

  // Order management
  createOrder: (npcImage?: string) => {
    const state = get();

    // Don't create orders if there are already 10 pending
    if (state.pendingOrders.length >= 10) {
      return null;
    }

    const types: Array<'customer-a' | 'customer-b' | 'customer-c'> = [
      'customer-a',
      'customer-b',
      'customer-c',
    ];
    const selectedType = types[Math.floor(Math.random() * types.length)]!;
    const mood = CUSTOMER_MOODS[Math.floor(Math.random() * CUSTOMER_MOODS.length)]!;

    // Pick a random recipe from only unlocked bouquets
    const unlockedRecipes = BOUQUET_RECIPES.filter(
      (recipe) =>
        state.unlockedTiers.has(recipe.tier) &&
        isBouquetUnlocked(recipe.id, state.cumulativeBouquetsSold)
    );

    // If no unlocked recipes (shouldn't happen), don't create order
    if (unlockedRecipes.length === 0) {
      return null;
    }

    const recipe = unlockedRecipes[Math.floor(Math.random() * unlockedRecipes.length)]!;

    // Determine quantity with rarity tiers
    const quantity = getOrderQuantity(state.cumulativeBouquetsSold);

    // Build requiredStems from recipe ingredients (expanded per quantity)
    const requiredStems: BouquetStem[] = [];
    let idx = 0;
    for (let bouquetIdx = 0; bouquetIdx < quantity; bouquetIdx++) {
      for (const ing of recipe.ingredients) {
        for (let q = 0; q < ing.quantity; q++) {
          requiredStems.push({ flowerId: ing.flowerId, order: idx++ });
        }
      }
    }

    // Use provided NPC image or pick a random one
    const NPC_IMAGES = [
      './npcs/npc-young-woman-01.png',
      './npcs/npc-young-woman-02.png',
      './npcs/npc-young-woman-03.png',
      './npcs/npc-young-woman-04.png',
      './npcs/npc-woman-braid-glasses.png',
      './npcs/npc-elder-woman-white-hair.png',
      './npcs/npc-elder-woman-grey-curly.png',
      './npcs/npc-woman-auburn-curly.png',
      './npcs/npc-woman-auburn-curly-yellow-blouse.png',
      './npcs/npc-woman-black-braid-cream-sweater.png',
      './npcs/npc-woman-black-coily-denim-jacket.png',
      './npcs/npc-woman-silver-hair-sage-cardigan.png',
      './npcs/npc-woman-curly-afro.png',
      './npcs/npc-woman-dark-updo.png',
      './npcs/npc-man-bald-beard.png',
      './npcs/npc-man-black-hair-linen.png',
      './npcs/npc-man-brown-hair-sweater.png',
      './npcs/npc-man-curly-hair.png',
      './npcs/npc-man-grey-beard-blue.png',
      './npcs/npc-man-grey-hair-navy.png',
      './npcs/npc-man-locs-sweater.png',
      './npcs/npc-man-black-fade-tan-jacket.png',
      './npcs/npc-man-black-wavy-denim-shirt.png',
      './npcs/npc-man-blonde-curly-lilac-sweater.png',
      './npcs/npc-man-red-hair-navy-sweater.png',
      './npcs/npc-nonbinary-mint-hair.png',
    ];
    const finalNpcImage = npcImage || NPC_IMAGES[Math.floor(Math.random() * NPC_IMAGES.length)]!;

    // Calculate scaled reward: base + (base * 0.25 * (quantity - 1))
    const scaledReward = calculateScaledReward(recipe.sellPrice, quantity);

    const order: Order = {
      id: `order-${Date.now()}-${Math.random()}`,
      customerId: `customer-${Date.now()}`,
      customerType: selectedType,
      customerMood: mood.text,
      recipeId: recipe.id,
      recipeName: recipe.name,
      requiredStems,
      quantity,
      reward: scaledReward,
      status: 'pending',
      createdAt: Date.now(),
      npcImage: finalNpcImage,
    };

    set((s) => ({
      pendingOrders: [...s.pendingOrders, order],
      lastUpdated: Date.now(),
    }));

    const rarity = getOrderRarity(quantity);
    RundotGameAPI.analytics.recordCustomEvent('npc_order_created', {
      bouquetId: recipe.id,
      bouquetName: recipe.name,
      bouquetTier: recipe.tier,
      quantity,
      reward: scaledReward,
      rarity,
    });

    return order;
  },

  completeOrder: (orderId: string, reward: number) => {
    const state = get();
    const order = state.pendingOrders.find((o) => o.id === orderId);

    console.log('🔍 completeOrder called:', { orderId, reward, orderFound: !!order, currentCoins: state.coins });

    if (!order) {
      console.warn('⚠️ Order not found!', orderId);
      return;
    }

    const newCumulativeSales = state.cumulativeBouquetsSold + 1;
    const newUnlockedFlowers = new Set(state.unlockedFlowers);
    const newUnlockedTiers = new Set(state.unlockedTiers);

    // Check for flower unlocks at new sales count
    const availableFlowers = getUnlockedFlowersAt(newCumulativeSales);
    availableFlowers.forEach((flowerId) => newUnlockedFlowers.add(flowerId));

    set((s) => ({
      pendingOrders: s.pendingOrders.filter((o) => o.id !== orderId),
      completedOrders: [...s.completedOrders, { ...order, status: 'completed' }],
      totalCustomersServed: s.totalCustomersServed + 1,
      cumulativeBouquetsSold: newCumulativeSales,
      unlockedFlowers: newUnlockedFlowers,
      unlockedTiers: newUnlockedTiers,
      // Increment online daily counter if applicable
      onlineOrdersCompletedToday: order.isOnlineOrder
        ? s.onlineOrdersCompletedToday + 1
        : s.onlineOrdersCompletedToday,
      // Only show thank-you animation for NPC orders
      orderJustCompleted: !order.isOnlineOrder,
      completedOrderCustomerImage: order.isOnlineOrder ? undefined : order.npcImage,
      // Mark corresponding order notifications as fulfilled
      notifications: s.notifications.map((notif) =>
        (notif.linkedOrderId === orderId) ? { ...notif, fulfilled: true } : notif
      ),
      lastUpdated: Date.now(),
    }));

    console.log('✅ Order completed, adding coins:', reward);
    state.addCoins(reward);
    playChaChingSound();
  },

  removeOrder: (orderId: string) => {
    set((s) => ({
      pendingOrders: s.pendingOrders.filter((o) => o.id !== orderId),
      lastUpdated: Date.now(),
    }));
  },

  getPendingOrders: () => {
    return get().pendingOrders;
  },

  triggerNotification: (message: string) => {
    set({ lastNotification: message });
  },

  clearNotification: () => {
    set({ lastNotification: null });
  },

  setShoppingForOrderId: (orderId?: string) => {
    set({ shoppingForOrderId: orderId });
  },

  setNeededFlower: (flowerId?: string, quantity?: number) => {
    set({ neededFlowerId: flowerId, neededFlowerQuantity: quantity ?? 0 });
  },

  setNeededFlowers: (flowers: Array<{ flowerId: string; quantity: number }>) => {
    set({ neededFlowersList: flowers });
  },

  // Online Order management
  createPendingOnlineOrder: () => {
    const state = get();

    // Only one pending online order at a time
    if (state.pendingOnlineOrders.length > 0) return null;

    // Daily limit reached
    if (state.onlineOrdersCompletedToday >= 15) return null;

    // Pick a random unlocked recipe
    const unlockedRecipes = BOUQUET_RECIPES.filter(
      (recipe) =>
        state.unlockedTiers.has(recipe.tier) &&
        isBouquetUnlocked(recipe.id, state.cumulativeBouquetsSold)
    );
    if (unlockedRecipes.length === 0) return null;

    const recipe = unlockedRecipes[Math.floor(Math.random() * unlockedRecipes.length)]!;

    // Determine quantity with rarity tiers
    const quantity = getOrderQuantity(state.cumulativeBouquetsSold);

    // Calculate reward with 10% online bonus + quantity scaling
    const baseRewardWithBonus = Math.round(recipe.sellPrice * 1.1);
    const scaledReward = calculateScaledReward(baseRewardWithBonus, quantity);
    const now = Date.now();

    const order: PendingOnlineOrder = {
      id: `online-pending-${now}-${Math.random()}`,
      recipeId: recipe.id,
      recipeName: recipe.name,
      imageUrl: recipe.imageUrl,
      quantity,
      reward: scaledReward,
      createdAt: now,
      expiresAt: now + 3 * 60 * 60 * 1000, // 3 hours
    };

    set((s) => ({
      pendingOnlineOrders: [...s.pendingOnlineOrders, order],
      lastUpdated: Date.now(),
    }));

    const rarity = getOrderRarity(quantity);
    RundotGameAPI.analytics.recordCustomEvent('online_order_created', {
      recipeId: recipe.id,
      recipeName: recipe.name,
      quantity,
      reward: scaledReward,
      rarity,
    });

    return order;
  },

  acceptOnlineOrder: (orderId: string) => {
    const state = get();
    const onlineOrder = state.pendingOnlineOrders.find((o) => o.id === orderId);
    if (!onlineOrder) return;

    // Check daily limit
    if (state.onlineOrdersCompletedToday >= 15) return;

    // Build requiredStems from recipe (multiplied by order quantity)
    const recipe = getRecipeById(onlineOrder.recipeId);
    const requiredStems: BouquetStem[] = [];
    if (recipe) {
      let idx = 0;
      for (let bouquetIdx = 0; bouquetIdx < onlineOrder.quantity; bouquetIdx++) {
        for (const ing of recipe.ingredients) {
          for (let q = 0; q < ing.quantity; q++) {
            requiredStems.push({ flowerId: ing.flowerId, order: idx++ });
          }
        }
      }
    }

    const acceptedOrder: Order = {
      id: `accepted-online-${onlineOrder.id}`,
      customerId: 'online',
      customerType: 'customer-a',
      customerMood: 'Online Customer',
      recipeId: onlineOrder.recipeId,
      recipeName: onlineOrder.recipeName,
      requiredStems,
      quantity: onlineOrder.quantity,
      reward: onlineOrder.reward,
      status: 'pending',
      createdAt: Date.now(),
      npcImage: '',
      isOnlineOrder: true,
    };

    set((s) => ({
      pendingOnlineOrders: s.pendingOnlineOrders.filter((o) => o.id !== orderId),
      pendingOrders: [...s.pendingOrders, acceptedOrder],
      // Update any online_order notifications to link to the new Order (for fulfillment tracking)
      notifications: s.notifications.map((notif) =>
        (notif.type === 'online_order' && notif.linkedOrderId === orderId)
          ? { ...notif, linkedOrderId: acceptedOrder.id }
          : notif
      ),
      lastUpdated: Date.now(),
    }));

    RundotGameAPI.analytics.recordCustomEvent('online_order_accepted', {
      orderId,
      recipeId: onlineOrder.recipeId,
      quantity: onlineOrder.quantity,
      reward: onlineOrder.reward,
    });
  },

  denyOnlineOrder: (orderId: string) => {
    set((s) => ({
      pendingOnlineOrders: s.pendingOnlineOrders.filter((o) => o.id !== orderId),
      lastUpdated: Date.now(),
    }));
    RundotGameAPI.analytics.recordCustomEvent('online_order_denied', { orderId });
  },

  expirePendingOnlineOrders: () => {
    const state = get();
    const now = Date.now();
    const expired = state.pendingOnlineOrders.filter((o) => o.expiresAt <= now);
    if (expired.length === 0) return;

    set((s) => ({
      pendingOnlineOrders: s.pendingOnlineOrders.filter((o) => o.expiresAt > now),
      lastUpdated: Date.now(),
    }));

    // Send notification for each expired order
    expired.forEach((o) => {
      state.addNotification(
        'online_order',
        '⏰ Online Order Expired',
        `Your ${o.recipeName} order has expired.`,
        true
      );
      RundotGameAPI.analytics.recordCustomEvent('online_order_expired', {
        orderId: o.id,
        recipeId: o.recipeId,
      });
    });
  },

  checkAndResetOnlineOrderDaily: (serverDateStr: string) => {
    const state = get();
    if (state.lastOnlineOrderResetDate !== serverDateStr) {
      set({
        onlineOrdersCompletedToday: 0,
        lastOnlineOrderResetDate: serverDateStr,
        lastUpdated: Date.now(),
      });
    }
  },

  getOrderForShopping: (orderId: string) => {
    return get().pendingOrders.find((o) => o.id === orderId);
  },

  // Mystery box management
  purchaseMysteryBox: () => {
    const state = get();
    if (state.premiumCurrency < MYSTERY_BOX_COST_RUN_BUCKS) {
      return false;
    }

    const randomMystery = getRandomMysteryBouquet();
    const bouquet: MysteryBouquetItem = {
      id: `mystery-${Date.now()}-${Math.random()}`,
      mysteryBouquetId: randomMystery.id,
      name: randomMystery.name,
      imageUrl: randomMystery.imageUrl,
      sellPrice: randomMystery.sellPrice,
      createdAt: Date.now(),
    };

    set((s) => ({
      premiumCurrency: s.premiumCurrency - MYSTERY_BOX_COST_RUN_BUCKS,
      mysteryBouquets: [...s.mysteryBouquets, bouquet],
      lastUpdated: Date.now(),
    }));

    return true;
  },

  sellMysteryBouquet: (bouquetId: string) => {
    const state = get();
    const bouquet = state.mysteryBouquets.find((b) => b.id === bouquetId);

    if (!bouquet) return false;

    state.addCoins(bouquet.sellPrice);
    playChaChingSound();
    set((s) => ({
      mysteryBouquets: s.mysteryBouquets.filter((b) => b.id !== bouquetId),
      totalCustomersServed: s.totalCustomersServed + 1,
      lastUpdated: Date.now(),
    }));

    return true;
  },

  purchaseExclusiveBox: (quantity: 1 | 2 | 3) => {
    const state = get();
    const cost = EXCLUSIVE_BOX_COSTS[quantity];

    if (state.premiumCurrency < cost) {
      return false;
    }

    // Generate contents for each box
    const allContents = Array(quantity)
      .fill(null)
      .map(() => generateExclusiveBoxContents());

    // Set pending reveal and deduct Run Bucks
    set((s) => ({
      premiumCurrency: s.premiumCurrency - cost,
      pendingBoxReveal: allContents,
      lastUpdated: Date.now(),
    }));

    return true;
  },

  addExclusiveBouquetToShelf: (bouquetId: string) => {
    const state = get();
    const bouquet = state.exclusiveBouquets.find((b) => b.id === bouquetId);

    if (!bouquet) return false;

    // Check if shelf has space
    const emptySlots = state.displayedBouquets.filter((b) => b === null).length;
    if (emptySlots === 0) {
      return false;
    }

    // Find first empty slot and place bouquet
    const emptyIndex = state.displayedBouquets.findIndex((b) => b === null);

    // Create a regular Bouquet from exclusive bouquet item
    const newBouquet: Bouquet = {
      id: `exclusive-display-${bouquetId}`,
      stems: [],
      wrappingPaper: 'plain-white',
      ribbonColor: 'ivory',
      sellPrice: bouquet.sellPrice,
      thumbnailUrl: bouquet.imageUrl,
      createdAt: bouquet.createdAt,
      fromExclusiveBox: true,
    };

    set((s) => ({
      displayedBouquets: s.displayedBouquets.map((b, i) => (i === emptyIndex ? newBouquet : b)),
      shelfBouquets: [...s.shelfBouquets, newBouquet],
      exclusiveBouquets: s.exclusiveBouquets.filter((b) => b.id !== bouquetId),
      lastUpdated: Date.now(),
    }));

    return true;
  },

  displayExclusiveBouquetOnShelf: (bouquetId: string) => {
    const state = get();
    const bouquet = state.exclusiveBouquets.find((b) => b.id === bouquetId);

    if (!bouquet) return false;

    return state.addExclusiveBouquetToShelf(bouquetId);
  },

  sellExclusiveBouquet: (bouquetId: string) => {
    const state = get();
    const bouquetInInventory = state.exclusiveBouquets.find((b) => b.id === bouquetId);
    const bouquetOnShelf = state.shelfBouquets.find((b) => b.id === `exclusive-display-${bouquetId}`);

    if (!bouquetInInventory && !bouquetOnShelf) return false;

    const sellPrice = bouquetInInventory?.sellPrice || bouquetOnShelf?.sellPrice || 0;
    state.addCoins(sellPrice);
    playChaChingSound();

    set((s) => ({
      exclusiveBouquets: s.exclusiveBouquets.filter((b) => b.id !== bouquetId),
      shelfBouquets: s.shelfBouquets.filter((b) => b.id !== `exclusive-display-${bouquetId}`),
      displayedBouquets: s.displayedBouquets.map((b) =>
        b?.id === `exclusive-display-${bouquetId}` ? null : b
      ),
      totalCustomersServed: s.totalCustomersServed + 1,
      lastUpdated: Date.now(),
    }));

    return true;
  },

  setPendingBoxReveal: (contents: any[] | undefined) => {
    set(() => ({
      pendingBoxReveal: contents,
      lastUpdated: Date.now(),
    }));
  },

  addPremiumCurrency: (amount: number) => {
    set((s) => ({
      premiumCurrency: s.premiumCurrency + amount,
      lastUpdated: Date.now(),
    }));
  },

  // Progression
  unlockFlower: (flowerId: string) => {
    set((s) => ({
      unlockedFlowers: new Set([...s.unlockedFlowers, flowerId]),
    }));
  },

  unlockRibbon: (ribbon: RibbonColor) => {
    set((s) => ({
      unlockedRibbons: s.unlockedRibbons.includes(ribbon)
        ? s.unlockedRibbons
        : [...s.unlockedRibbons, ribbon],
    }));
  },

  unlockWrapping: (wrapping: WrappingPaperType) => {
    set((s) => ({
      unlockedWrappings: s.unlockedWrappings.includes(wrapping)
        ? s.unlockedWrappings
        : [...s.unlockedWrappings, wrapping],
    }));
  },

  unlockTier: (tier: BouquetTier) => {
    set((s) => ({
      unlockedTiers: new Set([...s.unlockedTiers, tier]),
      inventoryCapacity: Math.min(s.inventoryCapacity + 50, MAX_INVENTORY_CAPACITY),
      lastUpdated: Date.now(),
    }));
  },

  isFlowerUnlocked: (flowerId: string) => {
    return get().unlockedFlowers.has(flowerId);
  },

  isTierUnlocked: (tier: BouquetTier) => {
    return get().unlockedTiers.has(tier);
  },

  getCumulativeBouquetsSold: () => {
    return get().cumulativeBouquetsSold;
  },

  // Save/load - uses both localStorage for quick access and SDK storage for persistence
  saveGameState: async () => {
    const state = get();
    const stateToPersist = {
      coins: state.coins,
      totalEarned: state.totalEarned,
      premiumCurrency: state.premiumCurrency,
      inventory: state.inventory,
      inventoryCapacity: state.inventoryCapacity,
      shelfCapacity: state.shelfCapacity,
      bouquetStorageCapacity: state.bouquetStorageCapacity,
      shelfBouquets: state.shelfBouquets,
      pendingBouquets: state.pendingBouquets,
      displayedBouquets: state.displayedBouquets,
      mysteryBouquets: state.mysteryBouquets,
      totalCustomersServed: state.totalCustomersServed,
      unlockedFlowers: Array.from(state.unlockedFlowers),
      unlockedRibbons: state.unlockedRibbons,
      unlockedWrappings: state.unlockedWrappings,
      cumulativeBouquetsSold: state.cumulativeBouquetsSold,
      unlockedTiers: Array.from(state.unlockedTiers),
      unclaimedRewards: state.unclaimedRewards,
      hasReceivedFirstTimeGift: state.hasReceivedFirstTimeGift,
      tutorialCompleted: state.tutorialCompleted,
      tutorialCurrentStep: state.tutorialCurrentStep,
      // Online orders
      pendingOnlineOrders: state.pendingOnlineOrders,
      onlineOrdersCompletedToday: state.onlineOrdersCompletedToday,
      lastOnlineOrderResetDate: state.lastOnlineOrderResetDate,
      // Accepted online orders that are in the pending queue
      pendingOrders: state.pendingOrders,
    };

    // Save to localStorage first for quick access
    localStorage.setItem('bloomy-game-state', JSON.stringify(stateToPersist));

    // Try to save to SDK storage (fire and forget)
    try {
      const { persistSave } = await import('../services/storage');
      await persistSave({
        version: 1,
        savedAt: Date.now(),
        data: stateToPersist,
      });
    } catch (err) {
      console.warn('Failed to persist to SDK storage:', err);
    }
  },

  loadGameState: async () => {
    try {
      const { loadSave } = await import('../services/storage');
      const saved = await loadSave();
      if (saved && saved.data) {
        const data = saved.data as Record<string, unknown>;
        const unlockedFlowers = new Set(
          Array.isArray(data['unlockedFlowers']) ? (data['unlockedFlowers'] as string[]) : []
        );
        const unlockedTiers = new Set<BouquetTier>(
          Array.isArray(data['unlockedTiers']) ? (data['unlockedTiers'] as BouquetTier[]) : (['budget'] as BouquetTier[])
        );
        set({
          coins: typeof data['coins'] === 'number' ? (data['coins'] as number) : 250,
          totalEarned: typeof data['totalEarned'] === 'number' ? (data['totalEarned'] as number) : 0,
          premiumCurrency: typeof data['premiumCurrency'] === 'number' ? (data['premiumCurrency'] as number) : 0,
          inventory: Array.isArray(data['inventory']) ? (data['inventory'] as StemInInventory[]) : [],
          inventoryCapacity: typeof data['inventoryCapacity'] === 'number' ? (data['inventoryCapacity'] as number) : STARTING_INVENTORY_CAPACITY,
          shelfCapacity: typeof data['shelfCapacity'] === 'number' ? (data['shelfCapacity'] as number) : 20,
          bouquetStorageCapacity: typeof data['bouquetStorageCapacity'] === 'number' ? (data['bouquetStorageCapacity'] as number) : 50,
          shelfBouquets: Array.isArray(data['shelfBouquets']) ? (data['shelfBouquets'] as Bouquet[]) : [],
          pendingBouquets: Array.isArray(data['pendingBouquets']) ? (data['pendingBouquets'] as Bouquet[]) : [],
          displayedBouquets: Array.isArray(data['displayedBouquets']) ? (data['displayedBouquets'] as (Bouquet | null)[]) : Array(STARTING_SHELF_CAPACITY).fill(null),
          mysteryBouquets: Array.isArray(data['mysteryBouquets']) ? (data['mysteryBouquets'] as MysteryBouquetItem[]) : [],
          totalCustomersServed: typeof data['totalCustomersServed'] === 'number' ? (data['totalCustomersServed'] as number) : 0,
          unlockedFlowers,
          unlockedRibbons: Array.isArray(data['unlockedRibbons']) ? (data['unlockedRibbons'] as RibbonColor[]) : ['blush', 'ivory'],
          unlockedWrappings: Array.isArray(data['unlockedWrappings']) ? (data['unlockedWrappings'] as WrappingPaperType[]) : ['plain-white', 'kraft'],
          cumulativeBouquetsSold: typeof data['cumulativeBouquetsSold'] === 'number' ? (data['cumulativeBouquetsSold'] as number) : 0,
          unlockedTiers,
          unclaimedRewards: Array.isArray(data['unclaimedRewards']) ? ((data['unclaimedRewards'] as number[]).filter((level) => level >= 2)) : [],
          hasReceivedFirstTimeGift: typeof data['hasReceivedFirstTimeGift'] === 'boolean' ? (data['hasReceivedFirstTimeGift'] as boolean) : false,
          tutorialCompleted: typeof data['tutorialCompleted'] === 'boolean' ? (data['tutorialCompleted'] as boolean) : false,
          tutorialCurrentStep: typeof data['tutorialCurrentStep'] === 'number' ? (data['tutorialCurrentStep'] as number) : 0,
          // Online orders — filter expired pending orders on load
          pendingOnlineOrders: Array.isArray(data['pendingOnlineOrders'])
            ? (data['pendingOnlineOrders'] as PendingOnlineOrder[]).filter((o) => o.expiresAt > Date.now())
            : [],
          onlineOrdersCompletedToday: typeof data['onlineOrdersCompletedToday'] === 'number' ? (data['onlineOrdersCompletedToday'] as number) : 0,
          lastOnlineOrderResetDate: typeof data['lastOnlineOrderResetDate'] === 'string' ? (data['lastOnlineOrderResetDate'] as string) : getTodayDateString(),
          // Restore accepted online orders in pending queue
          pendingOrders: Array.isArray(data['pendingOrders']) ? (data['pendingOrders'] as Order[]) : [],
          lastUpdated: Date.now(),
        });
      }
    } catch (err) {
      console.warn('Failed to load from SDK storage, falling back to localStorage:', err);
      // Fallback to localStorage
      const saved = localStorage.getItem('bloomy-game-state');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const unlockedFlowers = new Set(parsed.unlockedFlowers || []);
          const unlockedTiers = new Set(parsed.unlockedTiers || ['budget']);
          set({
            ...parsed,
            coins: parsed.coins ?? 250,
            premiumCurrency: parsed.premiumCurrency ?? 0,
            mysteryBouquets: parsed.mysteryBouquets ?? [],
            pendingBouquets: parsed.pendingBouquets ?? [],
            bouquetStorageCapacity: parsed.bouquetStorageCapacity ?? 50,
            shelfBouquets: parsed.shelfBouquets ?? [],
            displayedBouquets: parsed.displayedBouquets ?? Array(STARTING_SHELF_CAPACITY).fill(null),
            unlockedFlowers,
            unlockedTiers,
            cumulativeBouquetsSold: parsed.cumulativeBouquetsSold ?? 0,
            unclaimedRewards: (parsed.unclaimedRewards ?? []).filter((level: number) => level >= 2),
            hasReceivedFirstTimeGift: parsed.hasReceivedFirstTimeGift ?? false,
            tutorialCompleted: parsed.tutorialCompleted ?? false,
            tutorialCurrentStep: parsed.tutorialCurrentStep ?? 0,
            lastUpdated: Date.now(),
          });
        } catch {
          console.error('Failed to load game state from localStorage');
        }
      }
    }
  },

  resetGame: () => {
    set(createInitialState());
  },

  // Utilities
  getTotalInventoryValue: () => {
    const state = get();
    return state.inventory.reduce((sum, item) => {
      const flower = FLOWERS[item.flowerId];
      return sum + (flower?.pricePerStem || 0) * item.quantity;
    }, 0);
  },

  calculateBouquetPrice: (stems: BouquetStem[]) => {
    const basePrice = stems.reduce((sum, stem) => {
      const flower = FLOWERS[stem.flowerId];
      return sum + (flower?.pricePerStem || 0) * 2.5; // 2.5x markup
    }, 0);

    // Add variety bonus: more unique flowers = higher price
    const uniqueFlowers = new Set(stems.map((s) => s.flowerId)).size;
    const varietyBonus = (uniqueFlowers - 1) * 3;

    return Math.round(basePrice + varietyBonus);
  },

  // Tutorial
  setTutorialStep: (step: number) => {
    set({ tutorialCurrentStep: step, lastUpdated: Date.now() });
  },

  addUnclaimedReward: (level: number) => {
    set((s) => ({
      unclaimedRewards: [...s.unclaimedRewards, level],
      lastUpdated: Date.now(),
    }));
  },

  claimLevelReward: (level: number) => {
    const rewardCoins = 150 + Math.floor(level / 5) * 10; // +10 coins every 5 levels

    // Get a random bouquet (excluding exclusive bouquets)
    const regularBouquets = BOUQUET_RECIPES;
    const randomBouquet = regularBouquets[Math.floor(Math.random() * regularBouquets.length)]!;

    // Create the reward bouquet
    const rewardBouquet: Bouquet = {
      id: `reward-${Date.now()}-${Math.random()}`,
      stems: randomBouquet.ingredients.map((ing, idx) => ({
        flowerId: ing.flowerId,
        order: idx,
      })),
      wrappingPaper: 'kraft',
      ribbonColor: 'blush',
      sellPrice: randomBouquet.sellPrice,
      createdAt: Date.now(),
      recipeName: randomBouquet.name,
      source: 'reward',
    };

    const state = get();
    const updatedUnclaimedRewards = state.unclaimedRewards.filter((l) => l !== level);
    const allRewardsClaimed = updatedUnclaimedRewards.length === 0;

    set((s) => ({
      unclaimedRewards: updatedUnclaimedRewards,
      pendingBouquets: [...s.pendingBouquets, rewardBouquet],
      coins: s.coins + rewardCoins,
      totalEarned: s.totalEarned + rewardCoins,
      // Mark all claim_rewards notifications as fulfilled when all rewards are claimed
      notifications: allRewardsClaimed
        ? s.notifications.map((notif) =>
            notif.type === 'claim_rewards' ? { ...notif, fulfilled: true } : notif
          )
        : s.notifications,
      lastUpdated: Date.now(),
    }));

    RundotGameAPI.analytics.recordCustomEvent('level_reward_claimed', {
      level: level,
      coinsAwarded: rewardCoins,
      bouquetRecipe: randomBouquet.id,
    });

    playSuccessSound();
  },

  getUnclaimedRewardCount: () => {
    return get().unclaimedRewards.length;
  },

  // Notifications
  addNotification: (type: Notification['type'], title: string, message: string, showPopup: boolean, linkedOrderId?: string) => {
    const notificationId = `notification-${Date.now()}-${Math.random()}`;
    const notification: Notification = {
      id: notificationId,
      type,
      title,
      message,
      isRead: false,
      createdAt: Date.now(),
      showPopup,
      fulfilled: false,
      linkedOrderId,
    };
    set((s) => ({
      notifications: [...s.notifications, notification],
      lastUpdated: Date.now(),
    }));
  },

  markNotificationAsRead: (notificationId: string) => {
    set((s) => ({
      notifications: s.notifications.map((notif) =>
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      ),
      lastUpdated: Date.now(),
    }));
  },

  markNotificationAsFulfilled: (notificationId: string) => {
    set((s) => ({
      notifications: s.notifications.map((notif) =>
        notif.id === notificationId ? { ...notif, fulfilled: true } : notif
      ),
      lastUpdated: Date.now(),
    }));
  },

  removeNotification: (notificationId: string) => {
    set((s) => ({
      notifications: s.notifications.filter((notif) => notif.id !== notificationId),
      lastUpdated: Date.now(),
    }));
  },

  getUnreadNotificationCount: () => {
    return get().notifications.filter((notif) => !notif.isRead).length;
  },

  saveShelfLayoutConfig: (config) => {
    set({
      shelfLayoutConfig: config,
      lastUpdated: Date.now(),
    });
  },

  saveNPCCustomizationConfig: (config) => {
    set({
      npcCustomizationConfig: config,
      lastUpdated: Date.now(),
    });
  },

  saveShelfNPCCustomizationConfig: (config) => {
    set({
      shelfNPCCustomizationConfig: config,
      lastUpdated: Date.now(),
    });
  },

  saveTruckCustomizationConfig: (config) => {
    set({
      truckCustomizationConfig: config,
      lastUpdated: Date.now(),
    });
  },

  completeTutorial: () => {
    set({
      tutorialCompleted: true,
      tutorialCurrentStep: 11,
      lastUpdated: Date.now(),
    });
  },
}));
