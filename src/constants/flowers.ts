import { Flower } from '../types';

export const FLOWERS: Record<string, Flower> = {
  // Common tier
  daisy: {
    id: 'daisy',
    name: 'Daisy',
    tier: 'common',
    pricePerStem: 4,
    spriteUrl: '/flowers/daisy.png',
  },
  babys_breath: {
    id: 'babys_breath',
    name: "Baby's Breath",
    tier: 'common',
    pricePerStem: 4,
    spriteUrl: '/flowers/babys-breath.png',
  },
  dried_wheat: {
    id: 'dried_wheat',
    name: 'Dried Wheat',
    tier: 'common',
    pricePerStem: 6,
    spriteUrl: '/flowers/dried-wheat.png',
  },

  // Mid tier
  tulip: {
    id: 'tulip',
    name: 'Tulip',
    tier: 'mid',
    pricePerStem: 8,
    spriteUrl: '/flowers/tulip.png',
  },
  cosmos: {
    id: 'cosmos',
    name: 'Cosmos',
    tier: 'mid',
    pricePerStem: 8,
    spriteUrl: '/flowers/cosmos.png',
  },
  lavender: {
    id: 'lavender',
    name: 'Lavender',
    tier: 'mid',
    pricePerStem: 8,
    spriteUrl: '/flowers/lavender.png',
  },
  carnation: {
    id: 'carnation',
    name: 'Carnation',
    tier: 'mid',
    pricePerStem: 8,
    spriteUrl: '/flowers/carnation.png',
  },
  marigold: {
    id: 'marigold',
    name: 'Marigold',
    tier: 'mid',
    pricePerStem: 10,
    spriteUrl: '/flowers/marigold.png',
  },
  sunflower: {
    id: 'sunflower',
    name: 'Sunflower',
    tier: 'mid',
    pricePerStem: 10,
    spriteUrl: '/flowers/sunflower.png',
  },
  anemone: {
    id: 'anemone',
    name: 'Anemone',
    tier: 'mid',
    pricePerStem: 10,
    spriteUrl: '/flowers/anemone.png',
  },

  // Premium tier
  rose: {
    id: 'rose',
    name: 'Rose',
    tier: 'premium',
    pricePerStem: 14,
    spriteUrl: '/flowers/rose.png',
  },
  white_rose: {
    id: 'white_rose',
    name: 'White Rose',
    tier: 'premium',
    pricePerStem: 16,
    spriteUrl: '/flowers/white-rose.png',
  },
  peony: {
    id: 'peony',
    name: 'Peony',
    tier: 'premium',
    pricePerStem: 16,
    spriteUrl: '/flowers/peony.png',
  },
  lily: {
    id: 'lily',
    name: 'Lily',
    tier: 'premium',
    pricePerStem: 16,
    spriteUrl: '/flowers/lily.png',
  },
  orchid: {
    id: 'orchid',
    name: 'Orchid',
    tier: 'premium',
    pricePerStem: 18,
    spriteUrl: '/flowers/orchid.png',
  },
  ranunculus: {
    id: 'ranunculus',
    name: 'Ranunculus',
    tier: 'premium',
    pricePerStem: 16,
    spriteUrl: '/flowers/ranunculus.png',
  },
  hydrangea: {
    id: 'hydrangea',
    name: 'Hydrangea',
    tier: 'premium',
    pricePerStem: 16,
    spriteUrl: '/flowers/hydrangea.png',
  },
  lisianthus: {
    id: 'lisianthus',
    name: 'Lisianthus',
    tier: 'premium',
    pricePerStem: 14,
    spriteUrl: '/flowers/lisianthus.png',
  },

  // Rare / statement tier
  cherry_blossom: {
    id: 'cherry_blossom',
    name: 'Cherry Blossom',
    tier: 'rare',
    pricePerStem: 24,
    spriteUrl: '/flowers/cherry-blossom.png',
  },
  protea: {
    id: 'protea',
    name: 'Protea',
    tier: 'rare',
    pricePerStem: 28,
    spriteUrl: '/flowers/protea.png',
  },
  lilac: {
    id: 'lilac',
    name: 'Lilac',
    tier: 'rare',
    pricePerStem: 22,
    spriteUrl: '/flowers/lilac.png',
  },
  poppy: {
    id: 'poppy',
    name: 'Poppy',
    tier: 'rare',
    pricePerStem: 24,
    spriteUrl: '/flowers/poppy.png',
  },
  sweet_pea: {
    id: 'sweet_pea',
    name: 'Sweet Pea',
    tier: 'rare',
    pricePerStem: 22,
    spriteUrl: '/flowers/sweet-pea.png',
  },
};

export const GREENERY = {
  eucalyptus: {
    id: 'eucalyptus',
    name: 'Eucalyptus',
    spriteUrl: '/flowers/eucalyptus.png',
    pricePerStem: 2,
  },
  fern: {
    id: 'fern',
    name: 'Fern',
    spriteUrl: '/flowers/fern.png',
    pricePerStem: 2,
  },
  monstera: {
    id: 'monstera',
    name: 'Monstera',
    spriteUrl: '/flowers/monstera.png',
    pricePerStem: 2,
  },
  olive_branch: {
    id: 'olive_branch',
    name: 'Olive Branch',
    spriteUrl: '/flowers/olive-branch.png',
    pricePerStem: 2,
  },
  ruscus: {
    id: 'ruscus',
    name: 'Ruscus',
    spriteUrl: '/flowers/ruscus.png',
    pricePerStem: 2,
  },
};

export const FLOWER_IDS = Object.keys(FLOWERS);

export const INITIAL_UNLOCKED_FLOWERS = new Set([
  // Common
  'daisy',
  'babys_breath',
  'dried_wheat',
  // Mid
  'tulip',
  'cosmos',
  'lavender',
  'carnation',
  'marigold',
  'sunflower',
  'anemone',
  // Premium
  'rose',
  'white_rose',
  'peony',
  'lily',
  'orchid',
  'ranunculus',
  'hydrangea',
  'lisianthus',
  // Rare
  'cherry_blossom',
  'protea',
  'lilac',
  'poppy',
  'sweet_pea',
]);

export const CUSTOMER_MOODS = [
  { text: 'Something soft and romantic 🌸', emoji: '🌸' },
  { text: 'Bright and bold please!', emoji: '✨' },
  { text: 'A gift for someone very special 💛', emoji: '💛' },
  { text: 'Wild and garden-fresh!', emoji: '🌿' },
  { text: 'Something purple and dreamy', emoji: '💜' },
  { text: 'Just a simple little bunch', emoji: '🤍' },
];
