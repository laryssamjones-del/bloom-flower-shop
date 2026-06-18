import { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { FLOWERS } from '../../constants/flowers';
import { GREENERY } from '../../constants/flowers';
import { BOUQUET_RECIPES, getRecipeById, TIER_LABELS, TIER_COLORS, BouquetTier } from '../../data/bouquets';
import RundotGameAPI from '@series-inc/rundot-game-sdk/api';
import { ScreenNavigation } from '../components/ScreenNavigation';

type Phase = 'pick-recipe' | 'check-ingredients';

const TIER_ORDER: BouquetTier[] = ['budget', 'standard', 'premium', 'deluxe'];

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
  const selectedRecipeId = useGameStore((s) => s.selectedRecipeId);
  const fulfillOrderId = useGameStore((s) => s.fulfillOrderId);
  const canMakeRecipe = useGameStore((s) => s.canMakeRecipe);
  const getRecipeMissingIngredients = useGameStore((s) => s.getRecipeMissingIngredients);
  const selectRecipe = useGameStore((s) => s.selectRecipe);
  const clearSelectedRecipe = useGameStore((s) => s.clearSelectedRecipe);
  const inventory = useGameStore((s) => s.inventory);

  // If a recipe is already selected (e.g. from orders screen), start in ingredient check phase
  const [phase, setPhase] = useState<Phase>(selectedRecipeId ? 'check-ingredients' : 'pick-recipe');
  const [localRecipeId, setLocalRecipeId] = useState<string | null>(selectedRecipeId ?? null);
  const [filterTier, setFilterTier] = useState<BouquetTier | 'all'>('all');

  const activeRecipe = localRecipeId ? getRecipeById(localRecipeId) : null;
  const canMake = localRecipeId ? canMakeRecipe(localRecipeId) : false;
  const missing = localRecipeId ? getRecipeMissingIngredients(localRecipeId) : [];

  const handlePickRecipe = (recipeId: string) => {
    setLocalRecipeId(recipeId);
    setPhase('check-ingredients');
    RundotGameAPI.analytics.recordCustomEvent('recipe_selected', { recipeId });
  };

  const handleMakeBouquet = () => {
    if (!localRecipeId || !canMake) return;
    selectRecipe(localRecipeId, fulfillOrderId ?? undefined);
    RundotGameAPI.analytics.recordCustomEvent('bouquet_arrangement_complete', {
      recipeId: localRecipeId,
    });
    setCurrentScreen('wrapping');
  };

  const handleBack = () => {
    if (phase === 'check-ingredients' && !selectedRecipeId) {
      setPhase('pick-recipe');
      setLocalRecipeId(null);
    } else {
      clearSelectedRecipe();
      setCurrentScreen(fulfillOrderId ? 'orders' : 'shop');
    }
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
            background: '#B8A890',
            color: '#F5E6D3',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          {phase === 'check-ingredients' && !selectedRecipeId ? '← Recipes' : 'Back'}
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
              const canMakeThis = canMakeRecipe(recipe.id);
              const invCount = recipe.ingredients.reduce((sum, ing) => {
                const inv = inventory.find((i) => i.flowerId === ing.flowerId);
                return sum + Math.min(inv ? inv.quantity : 0, ing.quantity);
              }, 0);
              const totalNeeded = recipe.ingredients.reduce((s, i) => s + i.quantity, 0);
              const hasPartial = invCount > 0 && !canMakeThis;

              return (
                <button
                  key={recipe.id}
                  onClick={() => handlePickRecipe(recipe.id)}
                  style={{
                    background: canMakeThis
                      ? 'rgba(255,255,255,0.9)'
                      : hasPartial
                      ? 'rgba(255,255,255,0.6)'
                      : 'rgba(255,255,255,0.4)',
                    border: `2px solid ${TIER_COLORS[recipe.tier]}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    textAlign: 'center',
                  }}
                >
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
                  {canMakeThis && (
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
                  return (
                    <div
                      key={item.flowerId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px',
                        background: ok ? 'rgba(106,154,80,0.1)' : 'rgba(255,100,100,0.08)',
                        borderRadius: '6px',
                        border: `1px solid ${ok ? '#6A9A50' : '#E74C3C'}`,
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
                You're missing some ingredients. Visit the Shop to buy what you need!
                <div style={{ marginTop: '8px' }}>
                  <button
                    onClick={() => setCurrentScreen('wholesale')}
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
                    🛍️ Go to Shop
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
            }}
          >
            <button
              onClick={handleMakeBouquet}
              disabled={!canMake}
              style={{
                width: '100%',
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
              {canMake ? '🌸 Make Bouquet →' : '🔒 Missing Ingredients'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
