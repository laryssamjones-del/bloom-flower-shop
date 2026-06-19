import { FLOWERS } from '../constants/flowers';
import { getRandomExclusiveBouquets } from './exclusiveBouquets';
import { ExclusiveBoxContents, ExclusiveBouquetItem } from '../types';

export interface RandomFlowerContent {
  flowerId: string;
  quantity: number;
}

/**
 * Generate randomized contents for an exclusive mystery box
 */
export function generateExclusiveBoxContents(): ExclusiveBoxContents {
  // Random petal coins: 300-750
  const petalCoins = Math.floor(Math.random() * 451) + 300;

  // Random flower count: 55-70 stems
  const totalFlowerStems = Math.floor(Math.random() * 16) + 55; // 55-70

  // Get all available flowers
  const allFlowerIds = Object.keys(FLOWERS);

  // Distribute stems across random flowers
  const flowers: RandomFlowerContent[] = [];
  let stemsRemaining = totalFlowerStems;

  // Pick 5-10 random flowers to include
  const flowerCountToInclude = Math.floor(Math.random() * 6) + 5; // 5-10 different flowers
  const selectedFlowers = allFlowerIds.sort(() => Math.random() - 0.5).slice(0, flowerCountToInclude);

  for (const flowerId of selectedFlowers) {
    if (stemsRemaining <= 0) break;

    // Give each flower 1-15 stems
    const maxStemsForThis = Math.min(15, stemsRemaining);
    const quantity = Math.floor(Math.random() * maxStemsForThis) + 1;
    flowers.push({ flowerId, quantity });
    stemsRemaining -= quantity;
  }

  // If we still have stems left, add to the last flower
  if (stemsRemaining > 0 && flowers.length > 0) {
    flowers[flowers.length - 1]!.quantity += stemsRemaining;
  }

  // Random exclusive bouquets: 5-8
  const exclusiveBouquetCount = Math.floor(Math.random() * 4) + 5; // 5-8
  const bouquetRecipes = getRandomExclusiveBouquets(exclusiveBouquetCount);

  // Convert recipes to items
  const exclusiveBouquets: ExclusiveBouquetItem[] = bouquetRecipes.map((recipe) => ({
    id: `exclusive-${Date.now()}-${Math.random()}`,
    mysteryBouquetId: recipe.id,
    name: recipe.name,
    imageUrl: recipe.imageUrl,
    sellPrice: recipe.sellPrice,
    baseSellPrice: recipe.baseSellPrice,
    fromExclusiveBox: true as const,
    createdAt: Date.now(),
  }));

  return {
    petalCoins,
    flowers,
    exclusiveBouquets,
  };
}
