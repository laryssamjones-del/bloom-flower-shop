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

// Maps the dominant flower in an arrangement to the best-matching bouquet image
const FLOWER_TO_BOUQUET: Record<string, string> = {
  daisy: '/bouquets/sunshine-bunch.png',
  sunflower: '/bouquets/sunshine-bunch.png',
  babys_breath: '/bouquets/sunshine-bunch.png',
  lavender: '/bouquets/lavender-dream.png',
  sweet_pea: '/bouquets/lavender-dream.png',
  marigold: '/bouquets/golden-meadow.png',
  dried_wheat: '/bouquets/golden-meadow.png',
  cosmos: '/bouquets/spring-cosmos.png',
  tulip: '/bouquets/tulip-garden.png',
  anemone: '/bouquets/violet-anemone.png',
  poppy: '/bouquets/poppy-field.png',
  carnation: '/bouquets/carnation-kiss.png',
  rose: '/bouquets/rose-garden.png',
  white_rose: '/bouquets/rose-garden.png',
  peony: '/bouquets/peony-blush.png',
  lily: '/bouquets/lily-orchid.png',
  orchid: '/bouquets/lily-orchid.png',
  hydrangea: '/bouquets/hydrangea-cloud.png',
  lisianthus: '/bouquets/hydrangea-cloud.png',
  cherry_blossom: '/bouquets/cherry-blossom-dream.png',
  protea: '/bouquets/protea-statement.png',
  lilac: '/bouquets/enchanted-lilac.png',
  ranunculus: '/bouquets/golden-luxury.png',
};

/**
 * Picks a bouquet image based on the dominant flower in the arrangement.
 * Falls back to a random bouquet if no match found.
 */
export function getBouquetImageForStems(stemIds: string[]): string {
  // Count how many of each flower type are in the arrangement
  const frequency: Record<string, number> = {};
  for (const id of stemIds) {
    frequency[id] = (frequency[id] || 0) + 1;
  }

  // Find the most-used flower
  const dominantFlower = Object.entries(frequency).sort(([, a], [, b]) => b - a)[0]?.[0];

  if (dominantFlower && FLOWER_TO_BOUQUET[dominantFlower]) {
    return FLOWER_TO_BOUQUET[dominantFlower]!;
  }

  return getRandomBouquetImage();
}

export function getRandomBouquetImage(): string {
  const randomIndex = Math.floor(Math.random() * preMadeBouquets.length);
  return preMadeBouquets[randomIndex]!.imageUrl;
}
