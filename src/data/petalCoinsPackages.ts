export interface PetalCoinsPackage {
  id: string;
  name: string;
  coins: number;
  cost: number; // in Run Bucks
  emoji: string;
}

export const PETAL_COINS_PACKAGES: PetalCoinsPackage[] = [
  {
    id: 'pot-of-petals',
    name: 'A Pot of Petals',
    coins: 200,
    cost: 50,
    emoji: '🌼',
  },
  {
    id: 'garden-of-petals',
    name: 'A Garden of Petals',
    coins: 650,
    cost: 100,
    emoji: '🌸',
  },
  {
    id: 'field-of-petals',
    name: 'A Field of Petals',
    coins: 1500,
    cost: 200,
    emoji: '🌺',
  },
];
