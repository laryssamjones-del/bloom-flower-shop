import { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { FLOWERS } from '../../constants/flowers';
import { GREENERY } from '../../constants/flowers';
import { BOUQUET_RECIPES, getRecipeById, TIER_LABELS, TIER_COLORS, BouquetTier, isBouquetUnlocked, getBouquetUnlockThreshold } from '../../data/bouquets';
import { FLOWER_TIERS } from '../../data/progression';
import RundotGameAPI from '@series-inc/rundot-game-sdk/api';
import { ScreenNavigation } from '../components/ScreenNavigation';

type Phase = 'pick-recipe' | 'check-ingredients';

const TIER_ORDER: BouquetTier[] = ['budget', 'standard', 'premium', 'deluxe'];

// Determine if a tier is unlocked based on cumulative bouquets sold
function isTierUnlocked(tier: BouquetTier, cumulativeSold: number): boolean {
  const tierDef = FLOWER_TIERS.find((t) => t.tier === tier);
  if (!tierDef) return false;
  return cumulativeSold >= tierDef.unlockedAt;
}

function getFlowerOrGreeneryName(flowerId: string): string {
  const flower = FLOWERS[flowerId];
  if (flower) return flower.name;
  const greenery = GREENERY[flowerId as keyof typeof GREENERY];
  if (greenery) return greenery.name;
  return flowerId;
}

function getFlowerOrGreenerySprite(flowerId: string): string {
  const flower = FLOWERS[flowerId];
  if (flower) return flower.spriteUrl;
  const greenery = GREENERY[flowerId as keyof typeof GREENERY];
  if (greenery) return greenery.spriteUrl;
  return '';
}

export function BouquetArrangementScreen() {
  const setCurrentScreen = useGameStore((s) => s.setCurrentScreen);
  const setNeededFlowers = useGameStore((s) => s.setNeededFlowers);
  const selectedRecipeId = useGameStore((s) => s.selectedRecipeId);
  const fulfillOrderId = useGameStore((s) => s.fulfillOrderId);
  const canMakeRecipe = useGameStore((s) => s.canMakeRecipe);
  const getRecipeMissingIngredients = useGameStore((s) => s.getRecipeMissingIngredients);
  const getMaxBouquetsThatCanBeMade = useGameStore((s) => s.getMaxBouquetsThatCanBeMade);
  const selectRecipe = useGameStore((s) => s.selectRecipe);
  const clearSelectedRecipe = useGameStore((s) => s.clearSelectedRecipe);
  const inventory = useGameStore((s) => s.inventory);
  const cumulativeBouquetsSold = useGameStore((s) => s.cumulativeBouquetsSold);

  // Store the recipe ID selection in the store so it persists when navigating away
  const storeRecipeSelection = (recipeId: string | undefined) => {
    useGameStore.setState({
      selectedRecipeId: recipeId,
      lastUpdated: Date.now(),
    });
  };

  // If a recipe is already selected (e.g. from orders screen), start in ingredient check phase
  const [phase, setPhase] = useState<Phase>(selectedRecipeId ? 'check-ingredients' : 'pick-recipe');
  const [localRecipeId, setLocalRecipeId] = useState<string | null>(selectedRecipeId ?? null);
  const [filterTier, setFilterTier] = useState<BouquetTier | 'all'>('all');
  const [quantityToBuild, setQuantityToBuild] = useState<number>(1);

  const activeRecipe = localRecipeId ? getRecipeById(localRecipeId) : null;
  const canMake = localRecipeId ? canMakeRecipe(localRecipeId) : false;
  const missing = localRecipeId ? getRecipeMissingIngredients(localRecipeId) : [];

  const handlePickRecipe = (recipeId: string) => {
    setLocalRecipeId(recipeId);
    storeRecipeSelection(recipeId);
    setPhase('check-ingredients');
    RundotGameAPI.analytics.recordCustomEvent('recipe_selected', { recipeId });
  };

  const handleMakeBouquet = () => {
    if (!localRecipeId || !canMake) return;
    selectRecipe(localRecipeId, fulfillOrderId ?? undefined, quantityToBuild);
    RundotGameAPI.analytics.recordCustomEvent('bouquet_arrangement_complete', {
      recipeId: localRecipeId,
      quantity: quantityToBuild,
    });
    setCurrentScreen('wrapping');
  };

  const handleBack = () => {
    if (phase === 'check-ingredients' && !selectedRecipeId) {
      setPhase('pick-recipe');
      setLocalRecipeId(null);
      storeRecipeSelection(undefined);
    } else {
      clearSelectedRecipe();
      storeRecipeSelection(undefined);
      setCurrentScreen(fulfillOrderId ? 'orders' : 'shop');
    }
  };

  const handleBackToRecipePicker = () => {
    setPhase('pick-recipe');
    setLocalRecipeId(null);
    storeRecipeSelection(undefined);
  };

  const filteredRecipes =
    filterTier === 'all'
      ? BOUQUET_RECIPES
      : BOUQUET_RECIPES.filter((r) => r.tier === filterTier);

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '2px solid rgba(0,0,0,0.1)',
          background: 'rgba(255,255,255,0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '18px' }}>
          💐 {phase === 'pick-recipe' ? 'Recipe Book' : activeRecipe?.name ?? 'Recipe'}
        </h1>
        <button
          onClick={handleBack}
          style={{
            padding: '8px 12px',
            background: '#4A90E2',
            color: '#FFF',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          {phase === 'check-ingredients' && !selectedRecipeId ? '← Recipes' : 'Back to Home'}
        </button>
      </div>

      {/* Quick Navigation */}
      <ScreenNavigation currentScreen="arrangement" />

      {/* ── PHASE 1: Recipe Picker ── */}
      {phase === 'pick-recipe' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {/* Tier filter tabs */}
          <div
            style={{
              display: 'flex',
              gap: '4px',
              padding: '8px 12px',
              background: 'rgba(255,255,255,0.2)',
              overflowX: 'auto',
            }}
          >
            {(['all', ...TIER_ORDER] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterTier(t)}
                style={{
                  padding: '4px 10px',
                  background: filterTier === t
                    ? (t === 'all' ? '#666' : TIER_COLORS[t])
                    : 'rgba(255,255,255,0.5)',
                  color: filterTier === t ? '#FFF' : '#444',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap',
                }}
              >
                {t === 'all' ? 'All' : TIER_LABELS[t]}
              </button>
            ))}
          </div>

          {/* Recipe grid */}
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              WebkitOverflowScrolling: 'touch',
              padding: '10px',
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px',
              alignContent: 'start',
            }}
          >
            {filteredRecipes.map((recipe) => {
              const tierUnlocked = isTierUnlocked(recipe.tier, cumulativeBouquetsSold);
              const bouquetUnlocked = isBouquetUnlocked(recipe.id, cumulativeBouquetsSold);
              const isUnlocked = tierUnlocked && bouquetUnlocked;
              const canMakeThis = isUnlocked && canMakeRecipe(recipe.id);
              const invCount = recipe.ingredients.reduce((sum, ing) => {
                const inv = inventory.find((i) => i.flowerId === ing.flowerId);
                return sum + Math.min(inv ? inv.quantity : 0, ing.quantity);
              }, 0);
              const totalNeeded = recipe.ingredients.reduce((s, i) => s + i.quantity, 0);
              const hasPartial = isUnlocked && invCount > 0 && !canMakeThis;
              const unlockRequirement = getBouquetUnlockThreshold(recipe.id);

              return (
                <button
                  key={recipe.id}
                  onClick={() => isUnlocked && handlePickRecipe(recipe.id)}
                  disabled={!isUnlocked}
                  style={{
                    background: !isUnlocked
                      ? 'rgba(0,0,0,0.25)'
                      : canMakeThis
                      ? 'rgba(255,255,255,0.9)'
                      : hasPartial
                      ? 'rgba(255,255,255,0.6)'
                      : 'rgba(255,255,255,0.4)',
                    border: `2px solid ${!isUnlocked ? '#999' : TIER_COLORS[recipe.tier]}`,
                    borderRadius: '8px',
                    cursor: isUnlocked ? 'pointer' : 'not-allowed',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    textAlign: 'center',
                    animation: canMakeThis ? 'readyGlow 2s ease-in-out infinite' : 'none',
                    opacity: isUnlocked ? 1 : 0.5,
                    filter: isUnlocked ? 'none' : 'grayscale(100%) brightness(0.8)',
                    position: 'relative',
                  }}
                >
                  {!isUnlocked && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '32px',
                        zIndex: 10,
                      }}
                    >
                      🔒
                    </div>
                  )}
                  <img
                    src={recipe.imageUrl}
                    alt={recipe.name}
                    style={{
                      width: '80px',
                      height: '80px',
                      objectFit: 'contain',
                    }}
                  />
                  <div
                    style={{
                      fontSize: '10px',
                      fontWeight: 'bold',
                      color: '#FFF',
                      background: TIER_COLORS[recipe.tier],
                      borderRadius: '8px',
                      padding: '2px 6px',
                    }}
                  >
                    {TIER_LABELS[recipe.tier]}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#444', lineHeight: 1.2 }}>
                    {recipe.name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6A9A50', fontWeight: 'bold' }}>
                    {recipe.sellPrice} 🌼
                  </div>
                  {!isUnlocked && (
                    <div style={{ fontSize: '9px', color: '#666', fontWeight: 'bold' }}>
                      Unlocks at {unlockRequirement} bouquets sold
                    </div>
                  )}
                  {isUnlocked && canMakeThis && (
                    <div style={{ fontSize: '10px', color: '#6A9A50' }}>✅ Ready to make!</div>
                  )}
                  {hasPartial && (
                    <div style={{ fontSize: '10px', color: '#E67E22' }}>
                      {invCount}/{totalNeeded} ingredients
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── PHASE 2: Ingredient Check ── */}
      {phase === 'check-ingredients' && activeRecipe && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              WebkitOverflowScrolling: 'touch',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {/* Recipe preview */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                padding: '12px',
                background: 'rgba(255,255,255,0.6)',
                borderRadius: '8px',
                alignItems: 'center',
              }}
            >
              <img
                src={activeRecipe.imageUrl}
                alt={activeRecipe.name}
                style={{ width: '80px', height: '80px', objectFit: 'contain' }}
              />
              <div>
                <div
                  style={{
                    display: 'inline-block',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    color: '#FFF',
                    background: TIER_COLORS[activeRecipe.tier],
                    borderRadius: '8px',
                    padding: '2px 8px',
                    marginBottom: '4px',
                  }}
                >
                  {TIER_LABELS[activeRecipe.tier]}
                </div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
                  {activeRecipe.name}
                </div>
                <div style={{ fontSize: '14px', color: '#6A9A50', fontWeight: 'bold' }}>
                  Sells for {activeRecipe.sellPrice} 🌼
                </div>
              </div>
            </div>

            {/* Ingredients checklist */}
            <div
              style={{
                padding: '12px',
                background: 'rgba(255,255,255,0.5)',
                borderRadius: '8px',
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
                Ingredients needed:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {missing.map((item) => {
                  const ok = item.have >= item.needed;
                  const sprite = getFlowerOrGreenerySprite(item.flowerId);
                  const name = getFlowerOrGreeneryName(item.flowerId);
                  const handleMissingIngredientClick = () => {
                    if (!ok) {
                      // Collect all missing ingredients for this recipe (pass total needed, shop will calc remaining)
                      const allMissing = missing
                        .filter((m) => m.have < m.needed)
                        .map((m) => ({
                          flowerId: m.flowerId,
                          quantity: m.needed,
                        }));
                      setNeededFlowers(allMissing);
                      RundotGameAPI.analytics.recordCustomEvent('missing_ingredients_shop_navigation', {
                        recipeId: localRecipeId,
                        missingCount: allMissing.length,
                      });
                      setCurrentScreen('wholesale');
                    }
                  };
                  return (
                    <div
                      key={item.flowerId}
                      onClick={handleMissingIngredientClick}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px',
                        background: ok ? 'rgba(106,154,80,0.1)' : 'rgba(255,100,100,0.08)',
                        borderRadius: '6px',
                        border: `1px solid ${ok ? '#6A9A50' : '#E74C3C'}`,
                        cursor: ok ? 'default' : 'pointer',
                        transition: ok ? 'none' : 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        if (!ok) {
                          (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,100,100,0.15)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!ok) {
                          (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,100,100,0.08)';
                        }
                      }}
                    >
                      {sprite && (
                        <img
                          src={sprite}
                          alt={name}
                          style={{ width: '36px', height: '36px', objectFit: 'contain' }}
                        />
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#333' }}>{name}</div>
                        <div style={{ fontSize: '11px', color: '#666' }}>
                          Need {item.needed} · Have {item.have}
                        </div>
                      </div>
                      <div style={{ fontSize: '18px' }}>{ok ? '✅' : '❌'}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quantity selector for bulk creation */}
            {canMake && (
              <div
                style={{
                  padding: '12px',
                  background: 'rgba(106, 154, 80, 0.1)',
                  border: '2px solid #6A9A50',
                  borderRadius: '8px',
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', color: '#333', textAlign: 'center' }}>
                  📦 How many bouquets?
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                  <button
                    onClick={() => setQuantityToBuild(Math.max(1, quantityToBuild - 1))}
                    style={{
                      width: '40px',
                      height: '40px',
                      padding: 0,
                      background: '#6A9A50',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '18px',
                      fontWeight: 'bold',
                    }}
                  >
                    ➖
                  </button>
                  <div
                    style={{
                      minWidth: '60px',
                      textAlign: 'center',
                      fontSize: '24px',
                      fontWeight: 'bold',
                      color: '#6A9A50',
                    }}
                  >
                    {quantityToBuild}
                  </div>
                  <button
                    onClick={() => {
                      const maxBouquets = getMaxBouquetsThatCanBeMade(localRecipeId!);
                      setQuantityToBuild(Math.min(maxBouquets, quantityToBuild + 1));
                    }}
                    disabled={getMaxBouquetsThatCanBeMade(localRecipeId!) <= quantityToBuild}
                    style={{
                      width: '40px',
                      height: '40px',
                      padding: 0,
                      background: getMaxBouquetsThatCanBeMade(localRecipeId!) <= quantityToBuild ? '#CCC' : '#6A9A50',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: getMaxBouquetsThatCanBeMade(localRecipeId!) <= quantityToBuild ? 'not-allowed' : 'pointer',
                      fontSize: '18px',
                      fontWeight: 'bold',
                    }}
                  >
                    ➕
                  </button>
                </div>
                <div style={{ fontSize: '11px', color: '#666', textAlign: 'center', marginTop: '8px' }}>
                  Max: {getMaxBouquetsThatCanBeMade(localRecipeId!)} bouquets with current ingredients
                </div>
              </div>
            )}

            {/* Missing ingredients hint */}
            {!canMake && (
              <div
                style={{
                  padding: '10px',
                  background: 'rgba(255,200,100,0.2)',
                  border: '1px solid #F39C12',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#8B6914',
                  textAlign: 'center',
                }}
              >
                You're missing some ingredients. Visit the Market to buy what you need!
                <div style={{ marginTop: '8px' }}>
                  <button
                    onClick={() => {
                      // Collect all missing ingredients for this recipe (pass total needed, shop will calc remaining)
                      const allMissing = missing
                        .filter((m) => m.have < m.needed)
                        .map((m) => ({
                          flowerId: m.flowerId,
                          quantity: m.needed,
                        }));
                      setNeededFlowers(allMissing);
                      setCurrentScreen('wholesale');
                    }}
                    style={{
                      padding: '6px 16px',
                      background: '#F39C12',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                  >
                    🏪 Go to Market
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '12px',
              borderTop: '2px solid rgba(0,0,0,0.1)',
              background: 'rgba(255,255,255,0.3)',
              display: 'flex',
              gap: '8px',
            }}
          >
            <button
              onClick={handleBackToRecipePicker}
              style={{
                flex: 0.3,
                padding: '14px',
                background: '#D4D4D4',
                color: '#444',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: 'bold',
              }}
            >
              ← Back
            </button>
            <button
              onClick={handleMakeBouquet}
              disabled={!canMake}
              style={{
                flex: 1,
                padding: '14px',
                background: canMake ? '#6A9A50' : '#CCC',
                color: '#FFF',
                border: 'none',
                borderRadius: '6px',
                cursor: canMake ? 'pointer' : 'not-allowed',
                fontSize: '15px',
                fontWeight: 'bold',
              }}
            >
              {canMake ? `🌸 Make ${quantityToBuild} Bouquet${quantityToBuild > 1 ? 's' : ''} →` : '🔒 Missing Ingredients'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
