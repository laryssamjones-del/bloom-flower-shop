export interface PreMadeBouquet {
  id: number;
  name: string;
  imageUrl: string;
}

export const preMadeBouquets: PreMadeBouquet[] = [
  { id: 1, name: 'Sunshine Bunch', imageUrl: '/bouquets/sunshine-bunch.png' },
  { id: 2, name: 'Lavender Dream', imageUrl: '/bouquets/lavender-dream.png' },
  { id: 3, name: 'Golden Meadow', imageUrl: '/bouquets/golden-meadow.png' },
  { id: 4, name: 'Spring Cosmos', imageUrl: '/bouquets/spring-cosmos.png' },
  { id: 5, name: 'Tulip Garden', imageUrl: '/bouquets/tulip-garden.png' },
  { id: 6, name: 'Violet Anemone', imageUrl: '/bouquets/violet-anemone.png' },
  { id: 7, name: 'Poppy Field', imageUrl: '/bouquets/poppy-field.png' },
  { id: 8, name: 'Carnation Kiss', imageUrl: '/bouquets/carnation-kiss.png' },
  { id: 9, name: 'Golden Luxury', imageUrl: '/bouquets/golden-luxury.png' },
  { id: 10, name: 'Rose Garden', imageUrl: '/bouquets/rose-garden.png' },
  { id: 11, name: 'Peony Blush', imageUrl: '/bouquets/peony-blush.png' },
  { id: 12, name: 'Lily & Orchid', imageUrl: '/bouquets/lily-orchid.png' },
  { id: 13, name: 'Hydrangea Cloud', imageUrl: '/bouquets/hydrangea-cloud.png' },
  { id: 14, name: 'Cherry Blossom Dream', imageUrl: '/bouquets/cherry-blossom-dream.png' },
  { id: 15, name: 'Protea Statement', imageUrl: '/bouquets/protea-statement.png' },
  { id: 16, name: 'Midnight Poppy', imageUrl: '/bouquets/midnight-poppy.png' },
  { id: 17, name: 'Enchanted Lilac', imageUrl: '/bouquets/enchanted-lilac.png' },
  { id: 18, name: 'Grand Opulence', imageUrl: '/bouquets/grand-opulence.png' },
];

// Set recipes: specific flower combinations always map to the same bouquet
interface BouquetRecipe {
  flowers: string[]; // sorted flower IDs for this recipe
  imageUrl: string;
}

const BOUQUET_RECIPES: BouquetRecipe[] = [
  // Sunshine bouquets
  { flowers: ['daisy', 'sunflower', 'babys_breath'].sort(), imageUrl: '/bouquets/sunshine-bunch.png' },
  { flowers: ['daisy', 'sunflower'].sort(), imageUrl: '/bouquets/sunshine-bunch.png' },
  { flowers: ['sunflower', 'babys_breath'].sort(), imageUrl: '/bouquets/sunshine-bunch.png' },

  // Lavender dreams
  { flowers: ['lavender', 'sweet_pea', 'anemone'].sort(), imageUrl: '/bouquets/lavender-dream.png' },
  { flowers: ['lavender', 'sweet_pea'].sort(), imageUrl: '/bouquets/lavender-dream.png' },

  // Golden
  { flowers: ['marigold', 'dried_wheat', 'ranunculus'].sort(), imageUrl: '/bouquets/golden-meadow.png' },
  { flowers: ['marigold', 'dried_wheat'].sort(), imageUrl: '/bouquets/golden-meadow.png' },
  { flowers: ['ranunculus', 'marigold'].sort(), imageUrl: '/bouquets/golden-luxury.png' },

  // Spring cosmos
  { flowers: ['cosmos', 'daisy', 'babys_breath'].sort(), imageUrl: '/bouquets/spring-cosmos.png' },
  { flowers: ['cosmos', 'daisy'].sort(), imageUrl: '/bouquets/spring-cosmos.png' },

  // Tulips
  { flowers: ['tulip', 'eucalyptus'].sort(), imageUrl: '/bouquets/tulip-garden.png' },
  { flowers: ['tulip', 'fern'].sort(), imageUrl: '/bouquets/tulip-garden.png' },
  { flowers: ['tulip'].sort(), imageUrl: '/bouquets/tulip-garden.png' },

  // Anemone
  { flowers: ['anemone', 'olive_branch'].sort(), imageUrl: '/bouquets/violet-anemone.png' },
  { flowers: ['anemone', 'lavender'].sort(), imageUrl: '/bouquets/violet-anemone.png' },

  // Poppy
  { flowers: ['poppy', 'dried_wheat'].sort(), imageUrl: '/bouquets/poppy-field.png' },
  { flowers: ['poppy', 'wheat'].sort(), imageUrl: '/bouquets/midnight-poppy.png' },

  // Carnation
  { flowers: ['carnation', 'babys_breath'].sort(), imageUrl: '/bouquets/carnation-kiss.png' },
  { flowers: ['carnation'].sort(), imageUrl: '/bouquets/carnation-kiss.png' },

  // Rose garden
  { flowers: ['rose', 'white_rose', 'peony'].sort(), imageUrl: '/bouquets/rose-garden.png' },
  { flowers: ['rose', 'white_rose'].sort(), imageUrl: '/bouquets/rose-garden.png' },
  { flowers: ['rose', 'peony'].sort(), imageUrl: '/bouquets/rose-garden.png' },

  // Peony blush
  { flowers: ['peony', 'daisy', 'babys_breath'].sort(), imageUrl: '/bouquets/peony-blush.png' },
  { flowers: ['peony', 'daisy'].sort(), imageUrl: '/bouquets/peony-blush.png' },
  { flowers: ['peony'].sort(), imageUrl: '/bouquets/peony-blush.png' },

  // Lily & Orchid
  { flowers: ['lily', 'orchid', 'eucalyptus'].sort(), imageUrl: '/bouquets/lily-orchid.png' },
  { flowers: ['lily', 'orchid'].sort(), imageUrl: '/bouquets/lily-orchid.png' },

  // Hydrangea
  { flowers: ['hydrangea', 'lisianthus'].sort(), imageUrl: '/bouquets/hydrangea-cloud.png' },
  { flowers: ['hydrangea'].sort(), imageUrl: '/bouquets/hydrangea-cloud.png' },

  // Cherry blossom
  { flowers: ['cherry_blossom', 'sweet_pea'].sort(), imageUrl: '/bouquets/cherry-blossom-dream.png' },
  { flowers: ['cherry_blossom'].sort(), imageUrl: '/bouquets/cherry-blossom-dream.png' },

  // Protea
  { flowers: ['protea', 'monstera'].sort(), imageUrl: '/bouquets/protea-statement.png' },
  { flowers: ['protea'].sort(), imageUrl: '/bouquets/protea-statement.png' },

  // Lilac
  { flowers: ['lilac', 'lavender'].sort(), imageUrl: '/bouquets/enchanted-lilac.png' },
  { flowers: ['lilac'].sort(), imageUrl: '/bouquets/enchanted-lilac.png' },

  // Grand opulence (premium mix)
  { flowers: ['rose', 'orchid', 'ranunculus'].sort(), imageUrl: '/bouquets/grand-opulence.png' },
];

/**
 * Picks a bouquet image based on the exact flower combination (set recipe).
 * Same flower combination always produces the same bouquet.
 */
export function getBouquetImageForStems(stemIds: string[]): string {
  // Sort and deduplicate flower types for recipe matching
  const uniqueFlowers = Array.from(new Set(stemIds)).sort();
  const recipeKey = uniqueFlowers.join(',');

  // Look for exact match
  for (const recipe of BOUQUET_RECIPES) {
    if (recipe.flowers.join(',') === recipeKey) {
      return recipe.imageUrl;
    }
  }

  // If no exact match, try subset matching (find recipe with most matching flowers)
  let bestMatch: BouquetRecipe | null = null;
  let bestMatchCount = 0;

  for (const recipe of BOUQUET_RECIPES) {
    const matchCount = recipe.flowers.filter(f => uniqueFlowers.includes(f)).length;
    if (matchCount > bestMatchCount) {
      bestMatchCount = matchCount;
      bestMatch = recipe;
    }
  }

  if (bestMatch) {
    return bestMatch.imageUrl;
  }

  // Fallback: return a consistent bouquet based on hash of flowers
  const hash = uniqueFlowers.reduce((acc, f) => acc + f.charCodeAt(0), 0);
  const bouquetIndex = hash % preMadeBouquets.length;
  return preMadeBouquets[bouquetIndex]!.imageUrl;
}

export function getRandomBouquetImage(): string {
  const randomIndex = Math.floor(Math.random() * preMadeBouquets.length);
  return preMadeBouquets[randomIndex]!.imageUrl;
}
