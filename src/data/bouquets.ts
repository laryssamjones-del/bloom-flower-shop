export interface RecipeIngredient {
  flowerId: string;
  quantity: number;
}

export type BouquetTier = 'budget' | 'standard' | 'premium' | 'deluxe';

export interface BouquetRecipe {
  id: string;
  name: string;
  tier: BouquetTier;
  sellPrice: number;
  ingredients: RecipeIngredient[];
  imageUrl: string;
  totalStems: number;
  unlockedAt: number; // cumulative bouquets sold to unlock this bouquet
}

export const BOUQUET_RECIPES: BouquetRecipe[] = [
  // ── BUDGET ────────────────────────────────────────────────────────────────
  {
    id: 'daisy-and-fern',
    name: 'Daisy & Fern',
    tier: 'budget',
    sellPrice: 39,
    ingredients: [
      { flowerId: 'daisy', quantity: 4 },
      { flowerId: 'fern', quantity: 2 },
    ],
    imageUrl: './bouquets/daisy-and-fern.png',
    totalStems: 6,
    unlockedAt: 0,
  },
  {
    id: 'wheat-and-herb',
    name: 'Wheat & Herb',
    tier: 'budget',
    sellPrice: 31,
    ingredients: [
      { flowerId: 'dried_wheat', quantity: 3 },
      { flowerId: 'eucalyptus', quantity: 1 },
      { flowerId: 'ruscus', quantity: 1 },
    ],
    imageUrl: './bouquets/wheat-and-herb.png',
    totalStems: 5,
    unlockedAt: 0,
  },
  {
    id: 'sunshine-bunch',
    name: 'Sunshine Bunch',
    tier: 'budget',
    sellPrice: 25,
    ingredients: [
      { flowerId: 'daisy', quantity: 3 },
      { flowerId: 'babys_breath', quantity: 1 },
      { flowerId: 'fern', quantity: 1 },
    ],
    imageUrl: './bouquets/sunshine-bunch.png',
    totalStems: 5,
    unlockedAt: 0,
  },
  {
    id: 'spring-cosmos',
    name: 'Spring Cosmos',
    tier: 'budget',
    sellPrice: 39,
    ingredients: [
      { flowerId: 'cosmos', quantity: 3 },
      { flowerId: 'daisy', quantity: 2 },
      { flowerId: 'babys_breath', quantity: 1 },
    ],
    imageUrl: './bouquets/spring-cosmos.png',
    totalStems: 6,
    unlockedAt: 0,
  },
  {
    id: 'lavender-dream',
    name: 'Lavender Dream',
    tier: 'budget',
    sellPrice: 31,
    ingredients: [
      { flowerId: 'lavender', quantity: 1 },
      { flowerId: 'daisy', quantity: 2 },
      { flowerId: 'eucalyptus', quantity: 1 },
    ],
    imageUrl: './bouquets/lavender-dream.png',
    totalStems: 4,
    unlockedAt: 0,
  },
  {
    id: 'golden-meadow',
    name: 'Golden Meadow',
    tier: 'budget',
    sellPrice: 34,
    ingredients: [
      { flowerId: 'sunflower', quantity: 1 },
      { flowerId: 'marigold', quantity: 2 },
      { flowerId: 'dried_wheat', quantity: 2 },
      { flowerId: 'ruscus', quantity: 1 },
    ],
    imageUrl: './bouquets/golden-meadow.png',
    totalStems: 6,
    unlockedAt: 0,
  },

  // ── STANDARD ──────────────────────────────────────────────────────────────
  {
    id: 'marigold-sunrise',
    name: 'Marigold Sunrise',
    tier: 'standard',
    sellPrice: 39,
    ingredients: [
      { flowerId: 'marigold', quantity: 3 },
      { flowerId: 'cosmos', quantity: 2 },
      { flowerId: 'dried_wheat', quantity: 2 },
    ],
    imageUrl: './bouquets/marigold-sunrise.png',
    totalStems: 7,
    unlockedAt: 80,
  },
  {
    id: 'carnation-kiss',
    name: 'Carnation Kiss',
    tier: 'standard',
    sellPrice: 42,
    ingredients: [
      { flowerId: 'carnation', quantity: 3 },
      { flowerId: 'sweet_pea', quantity: 2 },
      { flowerId: 'ruscus', quantity: 1 },
    ],
    imageUrl: './bouquets/carnation-kiss.png',
    totalStems: 6,
    unlockedAt: 80,
  },
  {
    id: 'tulip-garden',
    name: 'Tulip Garden',
    tier: 'standard',
    sellPrice: 45,
    ingredients: [
      { flowerId: 'tulip', quantity: 3 },
      { flowerId: 'carnation', quantity: 1 },
      { flowerId: 'eucalyptus', quantity: 1 },
    ],
    imageUrl: './bouquets/tulip-garden.png',
    totalStems: 5,
    unlockedAt: 40,
  },
  {
    id: 'sweet-meadow',
    name: 'Sweet Meadow',
    tier: 'standard',
    sellPrice: 46,
    ingredients: [
      { flowerId: 'sweet_pea', quantity: 2 },
      { flowerId: 'cosmos', quantity: 2 },
      { flowerId: 'daisy', quantity: 2 },
      { flowerId: 'olive_branch', quantity: 1 },
    ],
    imageUrl: './bouquets/sweet-meadow.png',
    totalStems: 7,
    unlockedAt: 140,
  },
  {
    id: 'violet-anemone',
    name: 'Violet Anemone',
    tier: 'standard',
    sellPrice: 34,
    ingredients: [
      { flowerId: 'anemone', quantity: 2 },
      { flowerId: 'lavender', quantity: 1 },
      { flowerId: 'sweet_pea', quantity: 1 },
      { flowerId: 'fern', quantity: 1 },
    ],
    imageUrl: './bouquets/violet-anemone.png',
    totalStems: 5,
    unlockedAt: 40,
  },
  {
    id: 'tulip-and-lilac',
    name: 'Tulip & Lilac',
    tier: 'standard',
    sellPrice: 50,
    ingredients: [
      { flowerId: 'tulip', quantity: 2 },
      { flowerId: 'lilac', quantity: 1 },
      { flowerId: 'babys_breath', quantity: 1 },
    ],
    imageUrl: './bouquets/tulip-and-lilac.png',
    totalStems: 4,
    unlockedAt: 140,
  },
  {
    id: 'poppy-field',
    name: 'Poppy Field',
    tier: 'standard',
    sellPrice: 53,
    ingredients: [
      { flowerId: 'poppy', quantity: 2 },
      { flowerId: 'cosmos', quantity: 2 },
      { flowerId: 'babys_breath', quantity: 1 },
      { flowerId: 'olive_branch', quantity: 1 },
    ],
    imageUrl: './bouquets/poppy-field.png',
    totalStems: 6,
    unlockedAt: 40,
  },

  // ── PREMIUM ───────────────────────────────────────────────────────────────
  {
    id: 'golden-luxury',
    name: 'Golden Luxury',
    tier: 'premium',
    sellPrice: 73,
    ingredients: [
      { flowerId: 'sunflower', quantity: 1 },
      { flowerId: 'rose', quantity: 2 },
      { flowerId: 'marigold', quantity: 2 },
      { flowerId: 'monstera', quantity: 1 },
    ],
    imageUrl: './bouquets/golden-luxury.png',
    totalStems: 6,
    unlockedAt: 140,
  },
  {
    id: 'lisianthus-and-rose',
    name: 'Lisianthus & Rose',
    tier: 'premium',
    sellPrice: 76,
    ingredients: [
      { flowerId: 'lisianthus', quantity: 2 },
      { flowerId: 'rose', quantity: 1 },
      { flowerId: 'carnation', quantity: 1 },
      { flowerId: 'eucalyptus', quantity: 1 },
    ],
    imageUrl: './bouquets/lisianthus-rose.png',
    totalStems: 5,
    unlockedAt: 350,
  },
  {
    id: 'orchard-blossom',
    name: 'Orchard Blossom',
    tier: 'premium',
    sellPrice: 77,
    ingredients: [
      { flowerId: 'cherry_blossom', quantity: 1 },
      { flowerId: 'tulip', quantity: 2 },
      { flowerId: 'babys_breath', quantity: 1 },
      { flowerId: 'fern', quantity: 1 },
    ],
    imageUrl: './bouquets/orchard-blossom.png',
    totalStems: 5,
    unlockedAt: 350,
  },
  {
    id: 'hydrangea-cloud',
    name: 'Hydrangea Cloud',
    tier: 'premium',
    sellPrice: 78,
    ingredients: [
      { flowerId: 'hydrangea', quantity: 1 },
      { flowerId: 'white_rose', quantity: 2 },
      { flowerId: 'sweet_pea', quantity: 1 },
      { flowerId: 'olive_branch', quantity: 1 },
    ],
    imageUrl: './bouquets/hydrangea-cloud.png',
    totalStems: 5,
    unlockedAt: 230,
  },
  {
    id: 'rose-garden',
    name: 'Rose Garden',
    tier: 'premium',
    sellPrice: 81,
    ingredients: [
      { flowerId: 'rose', quantity: 2 },
      { flowerId: 'white_rose', quantity: 2 },
      { flowerId: 'babys_breath', quantity: 1 },
      { flowerId: 'eucalyptus', quantity: 1 },
    ],
    imageUrl: './bouquets/rose-garden.png',
    totalStems: 6,
    unlockedAt: 140,
  },
  {
    id: 'tropical-sunset',
    name: 'Tropical Sunset',
    tier: 'premium',
    sellPrice: 84,
    ingredients: [
      { flowerId: 'protea', quantity: 1 },
      { flowerId: 'marigold', quantity: 3 },
      { flowerId: 'monstera', quantity: 1 },
      { flowerId: 'ruscus', quantity: 1 },
    ],
    imageUrl: './bouquets/tropical-sunset.png',
    totalStems: 6,
    unlockedAt: 350,
  },
  {
    id: 'peony-blush',
    name: 'Peony Blush',
    tier: 'premium',
    sellPrice: 87,
    ingredients: [
      { flowerId: 'peony', quantity: 1 },
      { flowerId: 'ranunculus', quantity: 2 },
      { flowerId: 'lilac', quantity: 1 },
      { flowerId: 'fern', quantity: 1 },
    ],
    imageUrl: './bouquets/peony-blush.png',
    totalStems: 5,
    unlockedAt: 140,
  },
  {
    id: 'lily-orchid',
    name: 'Lily & Orchid',
    tier: 'premium',
    sellPrice: 126,
    ingredients: [
      { flowerId: 'lily', quantity: 1 },
      { flowerId: 'orchid', quantity: 1 },
      { flowerId: 'lisianthus', quantity: 2 },
      { flowerId: 'ruscus', quantity: 1 },
    ],
    imageUrl: './bouquets/lily-orchid.png',
    totalStems: 5,
    unlockedAt: 230,
  },

  // ── DELUXE ────────────────────────────────────────────────────────────────
  {
    id: 'enchanted-lilac',
    name: 'Enchanted Lilac',
    tier: 'deluxe',
    sellPrice: 115,
    ingredients: [
      { flowerId: 'lilac', quantity: 2 },
      { flowerId: 'peony', quantity: 1 },
      { flowerId: 'cherry_blossom', quantity: 1 },
      { flowerId: 'sweet_pea', quantity: 2 },
    ],
    imageUrl: './bouquets/enchanted-lilac.png',
    totalStems: 6,
    unlockedAt: 500,
  },
  {
    id: 'cherry-blossom-dream',
    name: 'Cherry Blossom Dream',
    tier: 'deluxe',
    sellPrice: 119,
    ingredients: [
      { flowerId: 'cherry_blossom', quantity: 1 },
      { flowerId: 'ranunculus', quantity: 2 },
      { flowerId: 'babys_breath', quantity: 1 },
      { flowerId: 'eucalyptus', quantity: 1 },
    ],
    imageUrl: './bouquets/cherry-blossom-dream.png',
    totalStems: 5,
    unlockedAt: 350,
  },
  {
    id: 'midnight-poppy',
    name: 'Midnight Poppy',
    tier: 'deluxe',
    sellPrice: 123,
    ingredients: [
      { flowerId: 'poppy', quantity: 2 },
      { flowerId: 'anemone', quantity: 2 },
      { flowerId: 'orchid', quantity: 1 },
      { flowerId: 'fern', quantity: 1 },
    ],
    imageUrl: './bouquets/midnight-poppy.png',
    totalStems: 6,
    unlockedAt: 500,
  },
  {
    id: 'woodland-crown',
    name: 'Woodland Crown',
    tier: 'deluxe',
    sellPrice: 123,
    ingredients: [
      { flowerId: 'anemone', quantity: 2 },
      { flowerId: 'sweet_pea', quantity: 2 },
      { flowerId: 'ranunculus', quantity: 2 },
      { flowerId: 'fern', quantity: 1 },
      { flowerId: 'monstera', quantity: 1 },
      { flowerId: 'olive_branch', quantity: 1 },
    ],
    imageUrl: './bouquets/woodland-crown.png',
    totalStems: 9,
    unlockedAt: 680,
  },
  {
    id: 'autumn-ember',
    name: 'Autumn Ember',
    tier: 'deluxe',
    sellPrice: 126,
    ingredients: [
      { flowerId: 'protea', quantity: 1 },
      { flowerId: 'poppy', quantity: 2 },
      { flowerId: 'marigold', quantity: 2 },
      { flowerId: 'ranunculus', quantity: 2 },
      { flowerId: 'dried_wheat', quantity: 1 },
      { flowerId: 'olive_branch', quantity: 1 },
    ],
    imageUrl: './bouquets/autumn-ember.png',
    totalStems: 9,
    unlockedAt: 680,
  },
  {
    id: 'protea-statement',
    name: 'Protea Statement',
    tier: 'deluxe',
    sellPrice: 129,
    ingredients: [
      { flowerId: 'protea', quantity: 1 },
      { flowerId: 'rose', quantity: 2 },
      { flowerId: 'monstera', quantity: 1 },
      { flowerId: 'ruscus', quantity: 1 },
    ],
    imageUrl: './bouquets/protea-statement.png',
    totalStems: 5,
    unlockedAt: 350,
  },
  {
    id: 'rose-orchid-luxe',
    name: 'Rose & Orchid Luxe',
    tier: 'deluxe',
    sellPrice: 133,
    ingredients: [
      { flowerId: 'rose', quantity: 3 },
      { flowerId: 'orchid', quantity: 1 },
      { flowerId: 'peony', quantity: 1 },
      { flowerId: 'eucalyptus', quantity: 1 },
    ],
    imageUrl: './bouquets/rose-and-orchid-luxe.png',
    totalStems: 6,
    unlockedAt: 680,
  },
  {
    id: 'moonlit-garden',
    name: 'Moonlit Garden',
    tier: 'deluxe',
    sellPrice: 134,
    ingredients: [
      { flowerId: 'white_rose', quantity: 2 },
      { flowerId: 'hydrangea', quantity: 1 },
      { flowerId: 'lilac', quantity: 1 },
      { flowerId: 'sweet_pea', quantity: 1 },
      { flowerId: 'ruscus', quantity: 1 },
    ],
    imageUrl: './bouquets/moonlit-garden.png',
    totalStems: 6,
    unlockedAt: 680,
  },
  {
    id: 'grand-opulence',
    name: 'Grand Opulence',
    tier: 'deluxe',
    sellPrice: 154,
    ingredients: [
      { flowerId: 'rose', quantity: 2 },
      { flowerId: 'peony', quantity: 1 },
      { flowerId: 'orchid', quantity: 1 },
      { flowerId: 'lily', quantity: 1 },
      { flowerId: 'protea', quantity: 1 },
      { flowerId: 'eucalyptus', quantity: 1 },
    ],
    imageUrl: './bouquets/grand-opulence.png',
    totalStems: 7,
    unlockedAt: 500,
  },
];

export const TIER_LABELS: Record<BouquetTier, string> = {
  budget: 'Budget',
  standard: 'Standard',
  premium: 'Premium',
  deluxe: 'Deluxe',
};

export const TIER_COLORS: Record<BouquetTier, string> = {
  budget: '#8BC34A',
  standard: '#2196F3',
  premium: '#9C27B0',
  deluxe: '#FF9800',
};

export function getRecipeById(id: string): BouquetRecipe | undefined {
  return BOUQUET_RECIPES.find((r) => r.id === id);
}

/**
 * Check if a bouquet recipe is unlocked at a given bouquet sales count
 */
export function isBouquetUnlocked(recipeId: string, cumulativeBouquetsSold: number): boolean {
  const recipe = getRecipeById(recipeId);
  return recipe ? cumulativeBouquetsSold >= recipe.unlockedAt : false;
}

/**
 * Get the bouquet count at which a recipe unlocks
 */
export function getBouquetUnlockThreshold(recipeId: string): number {
  const recipe = getRecipeById(recipeId);
  return recipe?.unlockedAt ?? 0;
}
