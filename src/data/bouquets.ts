export interface PreMadeBouquet {
  id: number;
  name: string;
  imageUrl: string;
}

export const preMadeBouquets: PreMadeBouquet[] = [
  {
    id: 1,
    name: 'Roses & Peony',
    imageUrl: '/bloomy_bouquet_01_roses_peony_kraft.png',
  },
  {
    id: 2,
    name: 'Sunflower & Daisy',
    imageUrl: '/bloomy_bouquet_02_sunflower_daisy_kraft.png',
  },
  {
    id: 3,
    name: 'Lavender & Sweet Pea',
    imageUrl: '/bloomy_bouquet_03_lavender_sweetpea_blush.png',
  },
  {
    id: 4,
    name: 'Wildflower',
    imageUrl: '/bloomy_bouquet_04_wildflower_sage.png',
  },
  {
    id: 5,
    name: 'Hydrangea & Orchid',
    imageUrl: '/bloomy_bouquet_05_hydrangea_orchid_blush.png',
  },
  {
    id: 7,
    name: 'Tulips',
    imageUrl: '/bloomy_bouquet_07_tulips_ivory.png',
  },
  {
    id: 8,
    name: 'White Rose & Lily',
    imageUrl: '/bloomy_bouquet_08_whiterose_lily_sage.png',
  },
  {
    id: 9,
    name: 'Carnations',
    imageUrl: '/bloomy_bouquet_09_carnations_blush.png',
  },
  {
    id: 10,
    name: 'Poppy & Wheat',
    imageUrl: '/bloomy_bouquet_10_poppy_wheat_kraft.png',
  },
  {
    id: 11,
    name: 'Cherry Blossom & Sweet Pea',
    imageUrl: '/bloomy_bouquet_11_cherry_sweetpea_lavender.png',
  },
  {
    id: 12,
    name: 'Peony & Daisy',
    imageUrl: '/bloomy_bouquet_12_peony_daisy_teal.png',
  },
  {
    id: 13,
    name: 'Rainbow Roses',
    imageUrl: '/bloomy_bouquet_13_rainbow_roses_blush.png',
  },
  {
    id: 14,
    name: 'Lily & Lisianthus',
    imageUrl: '/bloomy_bouquet_14_lily_lisianthus_sage.png',
  },
  {
    id: 15,
    name: 'Ranunculus & Cosmos',
    imageUrl: '/bloomy_bouquet_15_ranunculus_cosmos_ivory.png',
  },
  {
    id: 16,
    name: 'Orchid & Hydrangea',
    imageUrl: '/bloomy_bouquet_16_orchid_hydrangea_lavender.png',
  },
  {
    id: 17,
    name: 'Warm Tones',
    imageUrl: '/bloomy_bouquet_17_warm_tones_kraft.png',
  },
  {
    id: 18,
    name: 'Cool Tones',
    imageUrl: '/bloomy_bouquet_18_cool_tones_teal.png',
  },
];

export function getRandomBouquetImage(): string {
  const randomIndex = Math.floor(Math.random() * preMadeBouquets.length);
  return preMadeBouquets[randomIndex]!.imageUrl;
}
