import { create } from 'zustand';
import {
  ShopState,
  Bouquet,
  BouquetStem,
  RibbonColor,
  WrappingPaperType,
  StemInInventory,
} from '../types';
import { FLOWERS, INITIAL_UNLOCKED_FLOWERS } from '../constants/flowers';

const STARTING_COINS = 500;
const MAX_INVENTORY_STEMS = 200;
const STARTING_SHELF_CAPACITY = 20;

const createInitialState = (): ShopState => ({
  // Economy
  coins: STARTING_COINS,
  totalEarned: 0,

  // Inventory
  inventory: [],
  inventoryCapacity: MAX_INVENTORY_STEMS,

  // Shop
  shelfCapacity: STARTING_SHELF_CAPACITY,
  shelfBouquets: [],
  displayedBouquets: Array(STARTING_SHELF_CAPACITY).fill(null),

  // Customers
  activeCustomers: [],
  totalCustomersServed: 0,

  // Progression
  unlockedFlowers: new Set(INITIAL_UNLOCKED_FLOWERS),
  unlockedRibbons: ['blush', 'ivory'],
  unlockedWrappings: ['plain-white', 'kraft'],

  // Meta
  lastUpdated: Date.now(),
  sessionStarted: Date.now(),

  // UI state
  currentScreen: 'shop',
  stemsInArrangement: [],
});

interface GameStoreActions {
  // Economy
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;

  // Inventory
  addStemsToInventory: (flowerId: string, quantity: number) => boolean;
  removeStemsFromInventory: (flowerId: string, quantity: number) => boolean;
  getTotalStemsInInventory: () => number;

  // Bouquet creation
  addStemToArrangement: (flowerId: string) => boolean;
  removeStemFromArrangement: (order: number) => void;
  clearArrangement: () => void;
  getStemsInArrangement: () => BouquetStem[];

  // Wrapping
  setWrappingSelection: (wrapping: WrappingPaperType, ribbon: RibbonColor) => void;
  createBouquet: () => Bouquet | null;

  // Shelf
  addBouquetToShelf: (bouquet: Bouquet) => boolean;
  removeBouquetFromShelf: (bouquetId: string) => void;
  getShelfDisplay: () => (Bouquet | null)[];

  // Shelf expansion
  expandShelf: () => boolean;
  getShelfExpansionCost: () => number;

  // Screen navigation
  setCurrentScreen: (screen: 'shop' | 'wholesale' | 'arrangement' | 'wrapping') => void;

  // Customer management
  addActiveCustomer: () => void;
  removeActiveCustomer: (customerId: string) => void;
  sellBouquet: (bouquetId: string, priceOverride?: number) => boolean;

  // Progression
  unlockFlower: (flowerId: string) => void;
  unlockRibbon: (ribbon: RibbonColor) => void;
  unlockWrapping: (wrapping: WrappingPaperType) => void;

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

  // Bouquet arrangement
  addStemToArrangement: (flowerId: string) => {
    const state = get();
    if (state.stemsInArrangement.length >= 7) return false;
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
    set({ stemsInArrangement: [], inProgressWrapping: undefined });
  },

  getStemsInArrangement: () => {
    return get().stemsInArrangement;
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

    // Remove stems from inventory
    for (const stem of stems) {
      if (!state.removeStemsFromInventory(stem.flowerId, 1)) {
        return null;
      }
    }

    const price = state.calculateBouquetPrice(stems);
    const bouquet: Bouquet = {
      id: `bouquet-${Date.now()}-${Math.random()}`,
      stems,
      wrappingPaper: wrapping.wrapping,
      ribbonColor: wrapping.ribbon,
      sellPrice: price,
      createdAt: Date.now(),
    };

    set({
      stemsInArrangement: [],
      inProgressWrapping: undefined,
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
    set((s) => ({
      totalCustomersServed: s.totalCustomersServed + 1,
      lastUpdated: Date.now(),
    }));

    return true;
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

  // Save/load - uses both localStorage for quick access and SDK storage for persistence
  saveGameState: async () => {
    const state = get();
    const stateToPersist = {
      coins: state.coins,
      totalEarned: state.totalEarned,
      inventory: state.inventory,
      inventoryCapacity: state.inventoryCapacity,
      shelfCapacity: state.shelfCapacity,
      shelfBouquets: state.shelfBouquets,
      displayedBouquets: state.displayedBouquets,
      totalCustomersServed: state.totalCustomersServed,
      unlockedFlowers: Array.from(state.unlockedFlowers),
      unlockedRibbons: state.unlockedRibbons,
      unlockedWrappings: state.unlockedWrappings,
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
        set({
          coins: typeof data['coins'] === 'number' ? (data['coins'] as number) : 50,
          totalEarned: typeof data['totalEarned'] === 'number' ? (data['totalEarned'] as number) : 0,
          inventory: Array.isArray(data['inventory']) ? (data['inventory'] as StemInInventory[]) : [],
          inventoryCapacity: typeof data['inventoryCapacity'] === 'number' ? (data['inventoryCapacity'] as number) : 200,
          shelfCapacity: typeof data['shelfCapacity'] === 'number' ? (data['shelfCapacity'] as number) : 20,
          shelfBouquets: Array.isArray(data['shelfBouquets']) ? (data['shelfBouquets'] as Bouquet[]) : [],
          displayedBouquets: Array.isArray(data['displayedBouquets']) ? (data['displayedBouquets'] as (Bouquet | null)[]) : Array(20).fill(null),
          totalCustomersServed: typeof data['totalCustomersServed'] === 'number' ? (data['totalCustomersServed'] as number) : 0,
          unlockedFlowers,
          unlockedRibbons: Array.isArray(data['unlockedRibbons']) ? (data['unlockedRibbons'] as RibbonColor[]) : ['blush', 'ivory'],
          unlockedWrappings: Array.isArray(data['unlockedWrappings']) ? (data['unlockedWrappings'] as WrappingPaperType[]) : ['plain-white', 'kraft'],
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
          set({
            ...parsed,
            unlockedFlowers,
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
