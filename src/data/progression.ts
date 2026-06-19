/**
 * Progression system for Bloomy flower shop game
 * Tracks flower and tier unlocks based on cumulative bouquets sold
 */

export type FlowerTier = 'budget' | 'standard' | 'premium' | 'deluxe';

export interface FlowerTierDef {
  tier: FlowerTier;
  flowerIds: string[];
  unlockedAt: number; // cumulative bouquets sold to unlock tier
  label: string;
}

export interface FlowerUnlock {
  flowerId: string;
  tier: FlowerTier;
  unlockedAt: number; // cumulative bouquets sold to unlock this flower
}

/**
 * Flower assignments by tier
 * Users start with Budget tier (2 flowers initially)
 * Each tier requires previous tier to be maxed out
 */
export const FLOWER_TIERS: FlowerTierDef[] = [
  {
    tier: 'budget',
    label: 'Budget',
    unlockedAt: 0, // available from start
    flowerIds: ['rose', 'tulip', 'daisy', 'sunflower', 'carnation', 'lavender'],
  },
  {
    tier: 'standard',
    label: 'Standard',
    unlockedAt: 40, // unlock after 40 bouquets sold + budget tier complete
    flowerIds: ['orchid', 'peony', 'hydrangea', 'lily', 'iris', 'freesia', 'anemone'],
  },
  {
    tier: 'premium',
    label: 'Premium',
    unlockedAt: 140, // unlock after 140 bouquets sold + standard tier complete
    flowerIds: ['protea', 'ranunculus', 'chrysanthemum', 'cosmos', 'dahlia', 'zinnia', 'lisianthus', 'sweet-pea'],
  },
  {
    tier: 'deluxe',
    label: 'Deluxe',
    unlockedAt: 350, // unlock after 350 bouquets sold + premium tier complete
    flowerIds: ['magnolia', 'camellia', 'hibiscus', 'bougainvillea', 'bird-of-paradise', 'passionflower', 'amaryllis', 'calla-lily', 'gladiolus'],
  },
];

/**
 * Within-tier unlock schedule
 * Flowers unlock progressively as player sells more bouquets
 */
export const FLOWER_UNLOCKS: FlowerUnlock[] = [
  // Budget tier (6 flowers)
  // Start with 2, unlock +2 at 15 sales, +2 at 40 sales
  { flowerId: 'rose', tier: 'budget', unlockedAt: 0 },
  { flowerId: 'tulip', tier: 'budget', unlockedAt: 0 },
  { flowerId: 'daisy', tier: 'budget', unlockedAt: 15 },
  { flowerId: 'sunflower', tier: 'budget', unlockedAt: 15 },
  { flowerId: 'carnation', tier: 'budget', unlockedAt: 40 },
  { flowerId: 'lavender', tier: 'budget', unlockedAt: 40 },

  // Standard tier (7 flowers)
  // Start with 2 (when tier unlocks at 40), unlock +2 at 80, +3 at 140
  { flowerId: 'orchid', tier: 'standard', unlockedAt: 40 },
  { flowerId: 'peony', tier: 'standard', unlockedAt: 40 },
  { flowerId: 'hydrangea', tier: 'standard', unlockedAt: 80 },
  { flowerId: 'lily', tier: 'standard', unlockedAt: 80 },
  { flowerId: 'iris', tier: 'standard', unlockedAt: 140 },
  { flowerId: 'freesia', tier: 'standard', unlockedAt: 140 },
  { flowerId: 'anemone', tier: 'standard', unlockedAt: 140 },

  // Premium tier (8 flowers)
  // Start with 2 (when tier unlocks at 140), unlock +3 at 230, +3 at 350
  { flowerId: 'protea', tier: 'premium', unlockedAt: 140 },
  { flowerId: 'ranunculus', tier: 'premium', unlockedAt: 140 },
  { flowerId: 'chrysanthemum', tier: 'premium', unlockedAt: 230 },
  { flowerId: 'cosmos', tier: 'premium', unlockedAt: 230 },
  { flowerId: 'dahlia', tier: 'premium', unlockedAt: 230 },
  { flowerId: 'zinnia', tier: 'premium', unlockedAt: 350 },
  { flowerId: 'lisianthus', tier: 'premium', unlockedAt: 350 },
  { flowerId: 'sweet-pea', tier: 'premium', unlockedAt: 350 },

  // Deluxe tier (9 flowers)
  // Start with 3 (when tier unlocks at 350), unlock +3 at 500, +3 at 680
  { flowerId: 'magnolia', tier: 'deluxe', unlockedAt: 350 },
  { flowerId: 'camellia', tier: 'deluxe', unlockedAt: 350 },
  { flowerId: 'hibiscus', tier: 'deluxe', unlockedAt: 350 },
  { flowerId: 'bougainvillea', tier: 'deluxe', unlockedAt: 500 },
  { flowerId: 'bird-of-paradise', tier: 'deluxe', unlockedAt: 500 },
  { flowerId: 'passionflower', tier: 'deluxe', unlockedAt: 500 },
  { flowerId: 'amaryllis', tier: 'deluxe', unlockedAt: 680 },
  { flowerId: 'calla-lily', tier: 'deluxe', unlockedAt: 680 },
  { flowerId: 'gladiolus', tier: 'deluxe', unlockedAt: 680 },
];

/**
 * Helper function to get the next flower unlock milestone
 */
export function getNextFlowerUnlock(currentSalesCount: number): FlowerUnlock | null {
  const nextUnlock = FLOWER_UNLOCKS.find((unlock) => unlock.unlockedAt > currentSalesCount);
  return nextUnlock || null;
}

/**
 * Helper function to check if a flower is available at a given sales count
 */
export function isFlowerUnlockedAt(flowerId: string, salesCount: number): boolean {
  const unlock = FLOWER_UNLOCKS.find((u) => u.flowerId === flowerId);
  return unlock ? unlock.unlockedAt <= salesCount : false;
}

/**
 * Helper to get tier unlock requirement
 */
export function getTierUnlockRequirement(tier: FlowerTier): number {
  const tierDef = FLOWER_TIERS.find((t) => t.tier === tier);
  return tierDef ? tierDef.unlockedAt : 0;
}

/**
 * Helper to get all unlocked flowers at a given sales count
 */
export function getUnlockedFlowersAt(salesCount: number): string[] {
  return FLOWER_UNLOCKS.filter((unlock) => unlock.unlockedAt <= salesCount).map((u) => u.flowerId);
}
