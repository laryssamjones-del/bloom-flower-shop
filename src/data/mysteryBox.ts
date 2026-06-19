export interface MysteryBouquetRecipe {
  id: string;
  name: string;
  imageUrl: string;
  sellPrice: number;
}

export const MYSTERY_BOUQUETS: MysteryBouquetRecipe[] = [
  {
    id: 'starfall-crown',
    name: 'Starfall Crown',
    imageUrl: './bouquets/mystery/starfall-crown.png',
    sellPrice: 420,
  },
  {
    id: 'solstice-blossom',
    name: 'Solstice Blossom',
    imageUrl: './bouquets/mystery/solstice-blossom.png',
    sellPrice: 430,
  },
  {
    id: 'pixie-hollow',
    name: 'Pixie Hollow',
    imageUrl: './bouquets/mystery/pixie-hollow.png',
    sellPrice: 410,
  },
  {
    id: 'moonveil',
    name: 'Moonveil',
    imageUrl: './bouquets/mystery/moonveil.png',
    sellPrice: 440,
  },
  {
    id: 'fae-court',
    name: 'Fae Court',
    imageUrl: './bouquets/mystery/fae-court.png',
    sellPrice: 450,
  },
  {
    id: 'enchanted-briar',
    name: 'Enchanted Briar',
    imageUrl: './bouquets/mystery/enchanted-briar.png',
    sellPrice: 425,
  },
  {
    id: 'dreamwillow',
    name: 'Dreamwillow',
    imageUrl: './bouquets/mystery/dreamwillow.png',
    sellPrice: 435,
  },
];

export const MYSTERY_BOX_COST_RUN_BUCKS = 250;

export function getRandomMysteryBouquet(): MysteryBouquetRecipe {
  return MYSTERY_BOUQUETS[Math.floor(Math.random() * MYSTERY_BOUQUETS.length)]!;
}
