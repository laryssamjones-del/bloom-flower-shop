/**
 * Core type definitions for Bloomy
 */

export type FlowerTier = 'common' | 'mid' | 'premium' | 'rare';

export interface Flower {
  id: string;
  name: string;
  tier: FlowerTier;
  pricePerStem: number;
  spriteUrl: string;
}

export interface GreeneryItem {
  id: string;
  name: string;
  spriteUrl: string;
  pricePerStem: number;
}

export interface StemInInventory {
  flowerId: string;
  quantity: number;
}

export interface BouquetStem {
  flowerId: string;
  order: number; // 0-6 for up to 7 stems
}

export interface Bouquet {
  id: string;
  stems: BouquetStem[];
  wrappingPaper: WrappingPaperType;
  ribbonColor: RibbonColor;
  sellPrice: number;
  thumbnailUrl?: string;
  createdAt: number;
  fromSpecialBox?: boolean;
}

export type WrappingPaperType = 'spring-floral' | 'kraft' | 'pastel-stripe' | 'tissue' | 'plain-white';

export type RibbonColor = 'blush' | 'sage' | 'butter-yellow' | 'lavender' | 'ivory' | 'dusty-rose';

export interface Customer {
  id: string;
  name: string;
  type: 'customer-a' | 'customer-b' | 'customer-c';
  mood: string;
  mood_emoji: string;
}

export interface GameState {
  // Economy
  coins: number;
  totalEarned: number;

  // Inventory
  inventory: StemInInventory[];
  inventoryCapacity: number;

  // Shop
  shelfCapacity: number;
  shelfBouquets: Bouquet[];
  displayedBouquets: (Bouquet | null)[]; // Array matching shelf capacity, null = empty spot

  // Customers
  activeCustomers: Customer[];
  totalCustomersServed: number;

  // Progression
  unlockedFlowers: Set<string>;
  unlockedRibbons: RibbonColor[];
  unlockedWrappings: WrappingPaperType[];

  // Meta
  lastUpdated: number;
  sessionStarted: number;
}

export interface ShopState extends GameState {
  // Shop UI state
  currentScreen: 'shop' | 'wholesale' | 'arrangement' | 'wrapping';
  selectedBouquetForWrapping?: Bouquet;
  stemsInArrangement: BouquetStem[];
  inProgressWrapping?: {
    wrapping: WrappingPaperType;
    ribbon: RibbonColor;
  };
}

export interface SpecialBox {
  id: string;
  type: 'seasonal' | 'rare-bloom' | 'grand-florist';
  cost: number;
  bouquets: Bouquet[];
  stock: number;
  description: string;
}

export interface MysteryBoxReveal {
  boxType: 'seasonal' | 'rare-bloom' | 'grand-florist';
  bouquets: Bouquet[];
  totalValue: number;
}
