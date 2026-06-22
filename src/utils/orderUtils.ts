/**
 * Order utility functions for multi-bouquet orders
 */

/**
 * Determines order quantity based on progression with rarity tiers
 *
 * Rarity System:
 * - 2-3 bouquets: 60% (common)
 * - 4-5 bouquets: 30% (uncommon)
 * - 6-7 bouquets: 10% (rare)
 *
 * Progression Gates:
 * - 0-25 sales: Only 1-2 bouquets
 * - 26-75 sales: Common tier (2-3) + uncommon (4-5) at 20% + reduced rare
 * - 76+ sales: Full rarity system
 */
export function getOrderQuantity(cumulativeSales: number): number {
  const rand = Math.random();

  if (cumulativeSales < 26) {
    // Early game: only single or pairs
    return Math.random() < 0.5 ? 1 : 2;
  }

  if (cumulativeSales < 76) {
    // Mid game: introduce uncommon, rare at lower rate
    if (rand < 0.6) return Math.random() < 0.5 ? 2 : 3;      // 60% common (2-3)
    if (rand < 0.8) return Math.random() < 0.5 ? 4 : 5;      // 20% uncommon (4-5)
    return Math.random() < 0.5 ? 6 : 7;                      // 20% rare (6-7)
  }

  // Late game: full rarity system
  if (rand < 0.6) return Math.random() < 0.5 ? 2 : 3;        // 60% common (2-3)
  if (rand < 0.9) return Math.random() < 0.5 ? 4 : 5;        // 30% uncommon (4-5)
  return Math.random() < 0.5 ? 6 : 7;                        // 10% rare (6-7)
}

/**
 * Determines rarity tier name based on quantity
 */
export function getOrderRarity(quantity: number): 'common' | 'uncommon' | 'rare' {
  if (quantity <= 3) return 'common';
  if (quantity <= 5) return 'uncommon';
  return 'rare';
}

/**
 * Calculates scaled reward for multi-bouquet orders
 * Formula: baseReward + (baseReward * 0.25 * (quantity - 1))
 *
 * Examples:
 * - 1 @ 45 = 45
 * - 2 @ 45 = 45 + (45 * 0.25) = 56.25 → 56
 * - 3 @ 45 = 45 + (45 * 0.5) = 67.5 → 68
 */
export function calculateScaledReward(baseReward: number, quantity: number): number {
  const scaledReward = baseReward + baseReward * 0.25 * (quantity - 1);
  return Math.round(scaledReward);
}

/**
 * Gets color for rarity tier for UI display
 */
export function getRarityColor(quantity: number): string {
  const rarity = getOrderRarity(quantity);
  switch (rarity) {
    case 'common':
      return '#6A9A50'; // Green
    case 'uncommon':
      return '#D4AF37'; // Gold
    case 'rare':
      return '#9B59B6'; // Purple
  }
}

/**
 * Gets border style for rarity tier
 */
export function getRarityBorder(quantity: number): string {
  const color = getRarityColor(quantity);
  return `2px solid ${color}`;
}
