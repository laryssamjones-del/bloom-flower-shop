import { useGameStore } from '../../stores/gameStore';
import { FLOWERS, GREENERY } from '../../constants/flowers';
import { getRecipeById, TIER_LABELS, TIER_COLORS } from '../../data/bouquets';
import RundotGameAPI from '@series-inc/rundot-game-sdk/api';
import { ScreenNavigation } from '../components/ScreenNavigation';

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

export function OrdersScreen() {
  const setCurrentScreen = useGameStore((s) => s.setCurrentScreen);
  const pendingOrders = useGameStore((s) => s.pendingOrders);
  const selectRecipe = useGameStore((s) => s.selectRecipe);
  const inventory = useGameStore((s) => s.inventory);
  const canMakeRecipe = useGameStore((s) => s.canMakeRecipe);
  const removeOrder = useGameStore((s) => s.removeOrder);

  const handleFulfillOrder = (orderId: string, recipeId: string) => {
    selectRecipe(recipeId, orderId);
    RundotGameAPI.analytics.recordCustomEvent('order_fulfill_started', {
      orderId,
      recipeId,
    });
    setCurrentScreen('arrangement');
  };

  const handleDeclineOrder = (orderId: string) => {
    removeOrder(orderId);
    RundotGameAPI.analytics.recordCustomEvent('order_declined', { orderId });
  };

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
        <h1 style={{ margin: 0, fontSize: '18px' }}>📋 Orders ({pendingOrders.length}/10)</h1>
        <button
          onClick={() => setCurrentScreen('shop')}
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
          Back to Shop
        </button>
      </div>

      {/* Quick Navigation */}
      <ScreenNavigation currentScreen="orders" />

      {/* Orders List */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '12px',
        }}
      >
        {pendingOrders.length === 0 ? (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              color: '#666',
            }}
          >
            <p style={{ fontSize: '14px', marginBottom: '8px' }}>No pending orders 🌸</p>
            <p style={{ fontSize: '12px', opacity: 0.7 }}>Check back soon — new orders arrive every 25–90 seconds!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pendingOrders.map((order) => {
              const recipe = getRecipeById(order.recipeId);
              const canMake = canMakeRecipe(order.recipeId);

              // Build unique ingredient summary from recipe
              const ingredientSummary = recipe
                ? recipe.ingredients.map((ing) => {
                    const inv = inventory.find((i) => i.flowerId === ing.flowerId);
                    const have = inv ? inv.quantity : 0;
                    return {
                      flowerId: ing.flowerId,
                      needed: ing.quantity,
                      have,
                      ok: have >= ing.quantity,
                    };
                  })
                : [];

              return (
                <div
                  key={order.id}
                  style={{
                    padding: '12px',
                    background: 'rgba(255,255,255,0.7)',
                    border: `2px solid ${canMake ? '#6A9A50' : '#D4AF37'}`,
                    borderRadius: '10px',
                  }}
                >
                  {/* Order title row */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'flex-start',
                      marginBottom: '10px',
                    }}
                  >
                    {recipe && (
                      <img
                        src={recipe.imageUrl}
                        alt={recipe.name}
                        style={{ width: '64px', height: '64px', objectFit: 'contain', flexShrink: 0 }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      {recipe && (
                        <div
                          style={{
                            display: 'inline-block',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            color: '#FFF',
                            background: TIER_COLORS[recipe.tier],
                            borderRadius: '8px',
                            padding: '2px 6px',
                            marginBottom: '4px',
                          }}
                        >
                          {TIER_LABELS[recipe.tier]}
                        </div>
                      )}
                      <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#333' }}>
                        {order.recipeName}
                      </div>
                      <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                        {order.customerMood}
                      </div>
                      <div
                        style={{
                          marginTop: '4px',
                          fontSize: '13px',
                          fontWeight: 'bold',
                          color: '#6A9A50',
                        }}
                      >
                        Reward: {order.reward} 🌼
                      </div>
                    </div>
                  </div>

                  {/* Ingredient checklist */}
                  {ingredientSummary.length > 0 && (
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#555', marginBottom: '6px' }}>
                        What you need:
                      </div>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(2, 1fr)',
                          gap: '4px',
                        }}
                      >
                        {ingredientSummary.map((item) => {
                          const sprite = getFlowerOrGreenerySprite(item.flowerId);
                          const name = getFlowerOrGreeneryName(item.flowerId);
                          return (
                            <div
                              key={item.flowerId}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '4px 6px',
                                background: item.ok
                                  ? 'rgba(106,154,80,0.1)'
                                  : 'rgba(255,100,100,0.08)',
                                borderRadius: '4px',
                                border: `1px solid ${item.ok ? '#6A9A50' : '#E74C3C'}`,
                              }}
                            >
                              {sprite && (
                                <img
                                  src={sprite}
                                  alt={name}
                                  style={{ width: '24px', height: '24px', objectFit: 'contain' }}
                                />
                              )}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {name}
                                </div>
                                <div style={{ fontSize: '9px', color: '#777' }}>
                                  {item.have}/{item.needed}
                                </div>
                              </div>
                              <div style={{ fontSize: '12px' }}>{item.ok ? '✅' : '❌'}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                      onClick={() => handleDeclineOrder(order.id)}
                      style={{
                        padding: '10px',
                        background: 'rgba(200,100,100,0.15)',
                        color: '#C0392B',
                        border: '1px solid #C0392B',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                    >
                      ✕ Decline
                    </button>
                    <button
                      onClick={() => handleFulfillOrder(order.id, order.recipeId)}
                      style={{
                        padding: '10px',
                        background: canMake ? '#6A9A50' : '#D4AF37',
                        color: '#FFF',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                    >
                      {canMake ? '✅ Fulfill Now' : '💐 Start Making'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
