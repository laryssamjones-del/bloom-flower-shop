/**
 * Core type definitions for Bloomy
 */

export type FlowerTier = 'common' | 'mid' | 'premium' | 'rare';
export type BouquetTier = 'budget' | 'standard' | 'premium' | 'deluxe';

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
  fromPremiumDelivery?: boolean;
  fromExclusiveBox?: boolean;
  recipeName?: string;
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

export interface Order {
  id: string;
  customerId: string;
  customerType: 'customer-a' | 'customer-b' | 'customer-c';
  customerMood: string;
  recipeId: string;
  recipeName: string;
  requiredStems: BouquetStem[];
  reward: number;
  status: 'pending' | 'completed';
  createdAt: number;
}

export interface MysteryBouquetItem {
  id: string;
  mysteryBouquetId: string;
  name: string;
  imageUrl: string;
  sellPrice: number;
  createdAt: number;
}

export interface ExclusiveBouquetItem extends MysteryBouquetItem {
  fromExclusiveBox: true;
  baseSellPrice: number;
}

export interface ExclusiveBoxContents {
  petalCoins: number;
  flowers: { flowerId: string; quantity: number }[];
  exclusiveBouquets: ExclusiveBouquetItem[];
}

export interface GameState {
  // Economy
  coins: number;
  totalEarned: number;
  premiumCurrency: number; // Run Bucks

  // Inventory
  inventory: StemInInventory[];
  inventoryCapacity: number;
  mysteryBouquets: MysteryBouquetItem[]; // Special mystery box bouquets
  exclusiveBouquets: ExclusiveBouquetItem[]; // Exclusive mystery box bouquets

  // Shop
  shelfCapacity: number;
  shelfBouquets: Bouquet[];
  displayedBouquets: (Bouquet | null)[]; // Array matching shelf capacity, null = empty spot
  pendingBouquets: Bouquet[]; // Bouquets waiting to be placed on shelf

  // Customers & Orders
  activeCustomers: Customer[];
  totalCustomersServed: number;
  pendingOrders: Order[];
  completedOrders: Order[];

  // Notifications
  lastNotification: string | null;

  // Progression
  unlockedFlowers: Set<string>;
  unlockedRibbons: RibbonColor[];
  unlockedWrappings: WrappingPaperType[];
  cumulativeBouquetsSold: number;
  unlockedTiers: Set<BouquetTier>;

  // Daily limits
  dailyPurchases: Record<string, number>;
  lastPurchaseDate: string;

  // Rewards
  unclaimedRewards: number[]; // Array of levels that have unclaimed rewards

  // Shelf Layout
  shelfLayoutConfig?: {
    shelves: Array<{ x: number; y: number }>;
    gap: number;
    bouquetWidth: number;
    bouquetHeight: number;
  };

  // Meta
  lastUpdated: number;
  sessionStarted: number;
}

export interface ShopState extends GameState {
  // Shop UI state
  currentScreen: 'shop' | 'wholesale' | 'arrangement' | 'wrapping' | 'inventory' | 'orders';
  selectedBouquetForWrapping?: Bouquet;
  stemsInArrangement: BouquetStem[];
  inProgressWrapping?: {
    wrapping: WrappingPaperType;
    ribbon: RibbonColor;
  };
  selectedOrderId?: string;
  // Recipe system
  selectedRecipeId?: string;    // which recipe the player is currently making
  fulfillOrderId?: string;      // if making a bouquet to fulfill a specific order
  shoppingForOrderId?: string;  // if shopping for flowers to fulfill a specific order
  neededFlowerId?: string;      // if shopping for a specific flower for arrangement
  neededFlowerQuantity?: number; // quantity needed for that flower
  neededFlowersList: Array<{ flowerId: string; quantity: number }>; // multiple flowers needed for arrangement
  orderJustCompleted?: boolean; // flag to show order thank you animation
  completedOrderCustomerImage?: string; // NPC image for thank you animation
  // Exclusive mystery box reveal animation
  pendingBoxReveal?: ExclusiveBoxContents[]; // Contents waiting to be revealed in animation
  // Tutorial
  tutorialCompleted: boolean;
  tutorialCurrentStep: number;
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
