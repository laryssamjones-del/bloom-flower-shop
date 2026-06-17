import { Flower } from '../types';

export const FLOWERS: Record<string, Flower> = {
  // Common tier
  daisy: {
    id: 'daisy',
    name: 'Daisy',
    tier: 'common',
    pricePerStem: 4,
    spriteUrl: '/sprites/bloomy_flower_daisy.png',
  },
  babys_breath: {
    id: 'babys_breath',
    name: "Baby's Breath",
    tier: 'common',
    pricePerStem: 4,
    spriteUrl: '/sprites/bloomy_flower_babys_breath.png',
  },
  dried_wheat: {
    id: 'dried_wheat',
    name: 'Dried Wheat',
    tier: 'common',
    pricePerStem: 6,
    spriteUrl: '/sprites/bloomy_flower_dried_wheat.png',
  },

  // Mid tier
  tulip: {
    id: 'tulip',
    name: 'Tulip',
    tier: 'mid',
    pricePerStem: 8,
    spriteUrl: '/sprites/bloomy_flower_tulip.png',
  },
  cosmos: {
    id: 'cosmos',
    name: 'Cosmos',
    tier: 'mid',
    pricePerStem: 8,
    spriteUrl: '/sprites/bloomy_flower_cosmos.png',
  },
  lavender: {
    id: 'lavender',
    name: 'Lavender',
    tier: 'mid',
    pricePerStem: 8,
    spriteUrl: '/sprites/bloomy_flower_lavender.png',
  },
  carnation: {
    id: 'carnation',
    name: 'Carnation',
    tier: 'mid',
    pricePerStem: 8,
    spriteUrl: '/sprites/bloomy_flower_carnation.png',
  },
  marigold: {
    id: 'marigold',
    name: 'Marigold',
    tier: 'mid',
    pricePerStem: 10,
    spriteUrl: '/sprites/bloomy_flower_marigold.png',
  },
  sunflower: {
    id: 'sunflower',
    name: 'Sunflower',
    tier: 'mid',
    pricePerStem: 10,
    spriteUrl: '/sprites/bloomy_flower_sunflower.png',
  },
  anemone: {
    id: 'anemone',
    name: 'Anemone',
    tier: 'mid',
    pricePerStem: 10,
    spriteUrl: '/sprites/bloomy_flower_anemone.png',
  },

  // Premium tier
  rose: {
    id: 'rose',
    name: 'Rose',
    tier: 'premium',
    pricePerStem: 14,
    spriteUrl: '/sprites/bloomy_flower_rose.png',
  },
  white_rose: {
    id: 'white_rose',
    name: 'White Rose',
    tier: 'premium',
    pricePerStem: 16,
    spriteUrl: '/sprites/bloomy_flower_white_rose.png',
  },
  peony: {
    id: 'peony',
    name: 'Peony',
    tier: 'premium',
    pricePerStem: 16,
    spriteUrl: '/sprites/bloomy_flower_peony.png',
  },
  lily: {
    id: 'lily',
    name: 'Lily',
    tier: 'premium',
    pricePerStem: 16,
    spriteUrl: '/sprites/bloomy_flower_lily.png',
  },
  orchid: {
    id: 'orchid',
    name: 'Orchid',
    tier: 'premium',
    pricePerStem: 18,
    spriteUrl: '/sprites/bloomy_flower_orchid.png',
  },
  ranunculus: {
    id: 'ranunculus',
    name: 'Ranunculus',
    tier: 'premium',
    pricePerStem: 16,
    spriteUrl: '/sprites/bloomy_flower_ranunculus.png',
  },
  hydrangea: {
    id: 'hydrangea',
    name: 'Hydrangea',
    tier: 'premium',
    pricePerStem: 16,
    spriteUrl: '/sprites/bloomy_flower_hydrangea.png',
  },
  lisianthus: {
    id: 'lisianthus',
    name: 'Lisianthus',
    tier: 'premium',
    pricePerStem: 14,
    spriteUrl: '/sprites/bloomy_flower_lisianthus.png',
  },

  // Rare / statement tier
  cherry_blossom: {
    id: 'cherry_blossom',
    name: 'Cherry Blossom',
    tier: 'rare',
    pricePerStem: 24,
    spriteUrl: '/sprites/bloomy_flower_cherry_blossom.png',
  },
  protea: {
    id: 'protea',
    name: 'Protea',
    tier: 'rare',
    pricePerStem: 28,
    spriteUrl: '/sprites/bloomy_flower_protea.png',
  },
  lilac: {
    id: 'lilac',
    name: 'Lilac',
    tier: 'rare',
    pricePerStem: 22,
    spriteUrl: '/sprites/bloomy_flower_lilac.png',
  },
  poppy: {
    id: 'poppy',
    name: 'Poppy',
    tier: 'rare',
    pricePerStem: 24,
    spriteUrl: '/sprites/bloomy_flower_poppy.png',
  },
  sweet_pea: {
    id: 'sweet_pea',
    name: 'Sweet Pea',
    tier: 'rare',
    pricePerStem: 22,
    spriteUrl: '/sprites/bloomy_flower_sweet_pea.png',
  },
};

export const GREENERY = {
  eucalyptus: {
    id: 'eucalyptus',
    name: 'Eucalyptus',
    spriteUrl: '/sprites/bloomy_green_eucalyptus.png',
    pricePerStem: 2,
  },
  dried_wheat_green: {
    id: 'dried_wheat_green',
    name: 'Dried Wheat',
    spriteUrl: '/sprites/bloomy_green_dried_wheat.png',
    pricePerStem: 2,
  },
};

export const FLOWER_IDS = Object.keys(FLOWERS);

export const INITIAL_UNLOCKED_FLOWERS = new Set([
  'daisy',
  'babys_breath',
  'dried_wheat',
  'tulip',
  'cosmos',
  'lavender',
  'carnation',
]);

export const CUSTOMER_MOODS = [
  { text: 'Something soft and romantic 🌸', emoji: '🌸' },
  { text: 'Bright and bold please!', emoji: '✨' },
  { text: 'A gift for someone very special 💛', emoji: '💛' },
  { text: 'Wild and garden-fresh!', emoji: '🌿' },
  { text: 'Something purple and dreamy', emoji: '💜' },
  { text: 'Just a simple little bunch', emoji: '🤍' },
];
