import { create } from 'zustand';
import {
  ShopState,
  Bouquet,
  BouquetStem,
  RibbonColor,
  WrappingPaperType,
  StemInInventory,
  Order,
  MysteryBouquetItem,
  BouquetTier,
} from '../types';
import { FLOWERS, INITIAL_UNLOCKED_FLOWERS, CUSTOMER_MOODS } from '../constants/flowers';
import { BOUQUET_RECIPES, getRecipeById } from '../data/bouquets';
import { MYSTERY_BOX_COST_RUN_BUCKS, getRandomMysteryBouquet } from '../data/mysteryBox';
import { getUnlockedFlowersAt } from '../data/progression';

const STARTING_COINS = 300;
const MAX_INVENTORY_STEMS = 200;
const STARTING_SHELF_CAPACITY = 15;
const DAILY_PURCHASE_LIMIT = 50; // 50 stems per flower per day

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
  inventoryCapacity: MAX_INVENTORY_STEMS,
  mysteryBouquets: [],

  // Shop
  shelfCapacity: STARTING_SHELF_CAPACITY,
  shelfBouquets: [],
  pendingBouquets: [],
  displayedBouquets: Array(STARTING_SHELF_CAPACITY).fill(null),

  // Customers & Orders
  activeCustomers: [],
  totalCustomersServed: 0,
  pendingOrders: [],
  completedOrders: [],

  // Notifications
  lastNotification: null,

  // Progression
  unlockedFlowers: new Set(INITIAL_UNLOCKED_FLOWERS),
  unlockedRibbons: ['blush', 'ivory'],
  unlockedWrappings: ['plain-white', 'kraft'],
  cumulativeBouquetsSold: 0,
  unlockedTiers: new Set<BouquetTier>(['budget']),

  // Daily limits
  dailyPurchases: {},
  lastPurchaseDate: getTodayDateString(),

  // Meta
  lastUpdated: Date.now(),
  sessionStarted: Date.now(),

  // UI state
  currentScreen: 'shop',
  stemsInArrangement: [],
  shoppingForOrderId: undefined,
  orderJustCompleted: false,
  completedOrderCustomerImage: undefined,
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
  selectRecipe: (recipeId: string, fulfillOrderId?: string) => boolean;
  clearSelectedRecipe: () => void;
  canMakeRecipe: (recipeId: string) => boolean;
  getRecipeMissingIngredients: (recipeId: string) => Array<{ flowerId: string; needed: number; have: number }>;

  // Shelf
  addBouquetToShelf: (bouquet: Bouquet) => boolean;
  removeBouquetFromShelf: (bouquetId: string) => void;
  getShelfDisplay: () => (Bouquet | null)[];

  // Shelf expansion
  expandShelf: () => boolean;
  getShelfExpansionCost: () => number;

  // Screen navigation
  setCurrentScreen: (screen: 'shop' | 'wholesale' | 'arrangement' | 'wrapping' | 'inventory' | 'orders') => void;

  // Customer management
  addActiveCustomer: () => void;
  removeActiveCustomer: (customerId: string) => void;
  sellBouquet: (bouquetId: string, priceOverride?: number) => boolean;

  // Order management
  createOrder: () => Order | null;
  completeOrder: (orderId: string, reward: number) => void;
  removeOrder: (orderId: string) => void;
  getPendingOrders: () => Order[];
  triggerNotification: (message: string) => void;
  clearNotification: () => void;
  setShoppingForOrderId: (orderId?: string) => void;
  getOrderForShopping: (orderId: string) => Order | undefined;

  // Mystery box management
  purchaseMysteryBox: () => boolean;
  sellMysteryBouquet: (bouquetId: string) => boolean;
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
}

export const useGameStore = create<ShopState & GameStoreActions>((set, get) => ({
  ...createInitialState(),

  // Economy
  addCoins: (amount: number) => {
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
  selectRecipe: (recipeId: string, fulfillOrderId?: string) => {
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
    });
    return true;
  },

  clearSelectedRecipe: () => {
    set({ selectedRecipeId: undefined, fulfillOrderId: undefined, stemsInArrangement: [] });
  },

  canMakeRecipe: (recipeId: string) => {
    const state = get();
    const recipe = getRecipeById(recipeId);
    if (!recipe) return false;
    for (const ing of recipe.ingredients) {
      const inv = state.inventory.find((i) => i.flowerId === ing.flowerId);
      if (!inv || inv.quantity < ing.quantity) return false;
    }
    return true;
  },

  getRecipeMissingIngredients: (recipeId: string) => {
    const state = get();
    const recipe = getRecipeById(recipeId);
    if (!recipe) return [];
    return recipe.ingredients.map((ing) => {
      const inv = state.inventory.find((i) => i.flowerId === ing.flowerId);
      return {
        flowerId: ing.flowerId,
        needed: ing.quantity,
        have: inv ? inv.quantity : 0,
      };
    });
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
        // NPC images for thank you animation
        const npcImages = [
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
        const randomCustomerImage = npcImages[Math.floor(Math.random() * npcImages.length)];

        set((s) => ({
          pendingOrders: s.pendingOrders.filter((o) => o.id !== fulfillOrderId),
          completedOrders: [...s.completedOrders, { ...order, status: 'completed' }],
          totalCustomersServed: s.totalCustomersServed + 1,
          stemsInArrangement: [],
          inProgressWrapping: undefined,
          selectedRecipeId: undefined,
          fulfillOrderId: undefined,
          orderJustCompleted: true,
          completedOrderCustomerImage: randomCustomerImage,
          currentScreen: 'shop',
          lastUpdated: Date.now(),
        }));
        state.addCoins(price);
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
    state.addCoins(price);
    state.removeBouquetFromShelf(bouquetId);

    const newCumulativeSales = state.cumulativeBouquetsSold + 1;
    const newUnlockedFlowers = new Set(state.unlockedFlowers);
    const newUnlockedTiers = new Set(state.unlockedTiers);

    // Check for flower unlocks at new sales count
    const availableFlowers = getUnlockedFlowersAt(newCumulativeSales);
    availableFlowers.forEach((flowerId) => newUnlockedFlowers.add(flowerId));

    // Move pending bouquets to shelf if there's space
    const pendingBouquets = [...state.pendingBouquets];
    let movedBouquets = 0;
    const currentShelfSize = state.shelfBouquets.length - 1; // -1 because we just removed one
    const shelfSpaceAvailable = state.shelfCapacity - currentShelfSize;

    if (pendingBouquets.length > 0 && shelfSpaceAvailable > 0) {
      const bouquetsToMove = pendingBouquets.splice(0, shelfSpaceAvailable);
      for (const pendingBouquet of bouquetsToMove) {
        state.addBouquetToShelf(pendingBouquet);
        movedBouquets++;
      }
    }

    set((s) => ({
      totalCustomersServed: s.totalCustomersServed + 1,
      cumulativeBouquetsSold: newCumulativeSales,
      unlockedFlowers: newUnlockedFlowers,
      unlockedTiers: newUnlockedTiers,
      pendingBouquets: pendingBouquets,
      lastUpdated: Date.now(),
    }));

    return true;
  },

  // Order management
  createOrder: () => {
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

    // Pick a random recipe from the full recipe book
    const recipe = BOUQUET_RECIPES[Math.floor(Math.random() * BOUQUET_RECIPES.length)]!;

    // Build requiredStems from recipe ingredients (expanded per quantity)
    const requiredStems: BouquetStem[] = [];
    let idx = 0;
    for (const ing of recipe.ingredients) {
      for (let q = 0; q < ing.quantity; q++) {
        requiredStems.push({ flowerId: ing.flowerId, order: idx++ });
      }
    }

    const order: Order = {
      id: `order-${Date.now()}-${Math.random()}`,
      customerId: `customer-${Date.now()}`,
      customerType: selectedType,
      customerMood: mood.text,
      recipeId: recipe.id,
      recipeName: recipe.name,
      requiredStems,
      reward: recipe.sellPrice,
      status: 'pending',
      createdAt: Date.now(),
    };

    set((s) => ({
      pendingOrders: [...s.pendingOrders, order],
      lastUpdated: Date.now(),
    }));

    return order;
  },

  completeOrder: (orderId: string, reward: number) => {
    const state = get();
    const order = state.pendingOrders.find((o) => o.id === orderId);

    if (!order) return;

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
      lastUpdated: Date.now(),
    }));

    state.addCoins(reward);
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
    set((s) => ({
      mysteryBouquets: s.mysteryBouquets.filter((b) => b.id !== bouquetId),
      totalCustomersServed: s.totalCustomersServed + 1,
      lastUpdated: Date.now(),
    }));

    return true;
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
        // Boost coins to 650 if needed
        const coins = typeof data['coins'] === 'number' ? (data['coins'] as number) : 50;
        const boostedCoins = coins < 650 ? 650 : coins;
        set({
          coins: boostedCoins,
          totalEarned: typeof data['totalEarned'] === 'number' ? (data['totalEarned'] as number) : 0,
          premiumCurrency: typeof data['premiumCurrency'] === 'number' ? (data['premiumCurrency'] as number) : 0,
          inventory: Array.isArray(data['inventory']) ? (data['inventory'] as StemInInventory[]) : [],
          inventoryCapacity: typeof data['inventoryCapacity'] === 'number' ? (data['inventoryCapacity'] as number) : 200,
          shelfCapacity: typeof data['shelfCapacity'] === 'number' ? (data['shelfCapacity'] as number) : 20,
          shelfBouquets: Array.isArray(data['shelfBouquets']) ? (data['shelfBouquets'] as Bouquet[]) : [],
          pendingBouquets: Array.isArray(data['pendingBouquets']) ? (data['pendingBouquets'] as Bouquet[]) : [],
          displayedBouquets: Array.isArray(data['displayedBouquets']) ? (data['displayedBouquets'] as (Bouquet | null)[]) : Array(20).fill(null),
          mysteryBouquets: Array.isArray(data['mysteryBouquets']) ? (data['mysteryBouquets'] as MysteryBouquetItem[]) : [],
          totalCustomersServed: typeof data['totalCustomersServed'] === 'number' ? (data['totalCustomersServed'] as number) : 0,
          unlockedFlowers,
          unlockedRibbons: Array.isArray(data['unlockedRibbons']) ? (data['unlockedRibbons'] as RibbonColor[]) : ['blush', 'ivory'],
          unlockedWrappings: Array.isArray(data['unlockedWrappings']) ? (data['unlockedWrappings'] as WrappingPaperType[]) : ['plain-white', 'kraft'],
          cumulativeBouquetsSold: typeof data['cumulativeBouquetsSold'] === 'number' ? (data['cumulativeBouquetsSold'] as number) : 0,
          unlockedTiers,
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
          // Boost coins to 650 if needed
          const coins = parsed.coins < 650 ? 650 : parsed.coins;
          set({
            ...parsed,
            coins,
            premiumCurrency: parsed.premiumCurrency ?? 0,
            mysteryBouquets: parsed.mysteryBouquets ?? [],
            pendingBouquets: parsed.pendingBouquets ?? [],
            unlockedFlowers,
            unlockedTiers,
            cumulativeBouquetsSold: parsed.cumulativeBouquetsSold ?? 0,
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
}));
