export interface ExclusiveBouquetRecipe {
  id: string;
  name: string;
  baseSellPrice: number; // Original price
  sellPrice: number; // 2x base price
  imageUrl: string;
}

export const EXCLUSIVE_BOUQUETS: ExclusiveBouquetRecipe[] = [
  {
    id: 'lantern-grove',
    name: 'Lantern Grove',
    baseSellPrice: 298,
    sellPrice: 596,
    imageUrl: './bouquets/exclusive/lantern-grove.png',
  },
  {
    id: 'dreaming-orchard',
    name: 'Dreaming Orchard',
    baseSellPrice: 302,
    sellPrice: 604,
    imageUrl: './bouquets/exclusive/dreaming-orchard.png',
  },
  {
    id: 'selenes-altar',
    name: "Selene's Altar",
    baseSellPrice: 305,
    sellPrice: 610,
    imageUrl: './bouquets/exclusive/selenes-altar.png',
  },
  {
    id: 'moonlit-porcelain',
    name: 'Moonlit Porcelain',
    baseSellPrice: 310,
    sellPrice: 620,
    imageUrl: './bouquets/exclusive/moonlit-porcelain.png',
  },
  {
    id: 'abyssal-bloom',
    name: 'Abyssal Bloom',
    baseSellPrice: 312,
    sellPrice: 624,
    imageUrl: './bouquets/exclusive/abyssal-bloom.png',
  },
  {
    id: 'spring-throne',
    name: 'Spring Throne',
    baseSellPrice: 315,
    sellPrice: 630,
    imageUrl: './bouquets/exclusive/spring-throne.png',
  },
  {
    id: 'gilded-paradise',
    name: 'Gilded Paradise',
    baseSellPrice: 318,
    sellPrice: 636,
    imageUrl: './bouquets/exclusive/gilded-paradise.png',
  },
  {
    id: 'everbloom-crystal',
    name: 'Everbloom Crystal',
    baseSellPrice: 320,
    sellPrice: 640,
    imageUrl: './bouquets/exclusive/everbloom-crystal.png',
  },
  {
    id: 'oracles-reliquary',
    name: "Oracle's Reliquary",
    baseSellPrice: 330,
    sellPrice: 660,
    imageUrl: './bouquets/exclusive/oracles-reliquary.png',
  },
  {
    id: 'dragons-hoard',
    name: "Dragon's Hoard",
    baseSellPrice: 335,
    sellPrice: 670,
    imageUrl: './bouquets/exclusive/dragons-hoard.png',
  },
  {
    id: 'starweaver-spire',
    name: 'Starweaver Spire',
    baseSellPrice: 340,
    sellPrice: 680,
    imageUrl: './bouquets/exclusive/starweaver-spire.png',
  },
  {
    id: 'voidspire',
    name: 'Voidspire',
    baseSellPrice: 345,
    sellPrice: 690,
    imageUrl: './bouquets/exclusive/voidspire.png',
  },
  {
    id: 'celestial-cathedral',
    name: 'Celestial Cathedral',
    baseSellPrice: 350,
    sellPrice: 700,
    imageUrl: './bouquets/exclusive/celestial-cathedral.png',
  },
  {
    id: 'rose-eternal-shrine',
    name: 'Rose Eternal Shrine',
    baseSellPrice: 355,
    sellPrice: 710,
    imageUrl: './bouquets/exclusive/rose-eternal-shrine.png',
  },
];

export const EXCLUSIVE_BOX_COSTS = {
  1: 500,
  2: 750,
  3: 1000,
} as const;

export function getRandomExclusiveBouquets(count: number): ExclusiveBouquetRecipe[] {
  const shuffled = [...EXCLUSIVE_BOUQUETS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
