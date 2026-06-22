import { useState, useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { getRecipeById } from '../../data/bouquets';
import RundotGameAPI from '@series-inc/rundot-game-sdk/api';

export function WrappingScreen() {
  const setCurrentScreen = useGameStore((s) => s.setCurrentScreen);
  const selectedRecipeId = useGameStore((s) => s.selectedRecipeId);
  const fulfillOrderId = useGameStore((s) => s.fulfillOrderId);
  const setWrappingSelection = useGameStore((s) => s.setWrappingSelection);
  const createBouquets = useGameStore((s) => s.createBouquets);
  const addBouquetToShelf = useGameStore((s) => s.addBouquetToShelf);
  const bouquetQuantityToBuild = useGameStore((s) => s.bouquetQuantityToBuild);
  const completeOrder = useGameStore((s) => s.completeOrder);
  const getOrderForShopping = useGameStore((s) => s.getOrderForShopping);

  const [isAnimating, setIsAnimating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [bouquetsCreated, setBouquetsCreated] = useState(0);

  const activeRecipe = selectedRecipeId ? getRecipeById(selectedRecipeId) : undefined;

  // Trigger animation for 3 seconds when wrapping is started
  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setIsComplete(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isAnimating]);

  const handleAddWrapping = () => {
    setWrappingSelection('plain-white', 'blush');
    setIsAnimating(true);
    RundotGameAPI.analytics.recordCustomEvent('wrapping_started', {
      recipeId: selectedRecipeId ?? 'none',
      quantity: bouquetQuantityToBuild,
    });
  };

  const handleFinishBouquet = () => {
    const bouquets = createBouquets();

    if (bouquets.length > 0) {
      RundotGameAPI.analytics.recordCustomEvent('bouquets_completed', {
        quantity: bouquets.length,
        totalStemCount: (bouquets[0]?.stems?.length ?? 0) * bouquets.length,
        totalSellPrice: bouquets.reduce((sum, b) => sum + b.sellPrice, 0),
        recipeId: selectedRecipeId ?? 'none',
        forOrder: !!fulfillOrderId,
      });

      // If fulfilling an order, the first bouquet is for the order, rest go to shelf/inventory
      let bouquetsToShelf = bouquets;
      if (fulfillOrderId && bouquets.length > 0) {
        // Complete the order with the first bouquet
        const order = getOrderForShopping(fulfillOrderId);
        if (order) {
          completeOrder(fulfillOrderId, order.reward);
        }
        // Additional bouquets should go to shelf/inventory
        bouquetsToShelf = bouquets.slice(1);
      }

      // Add bouquets to shelf or inventory
      for (const bouquet of bouquetsToShelf) {
        // Try to add to shelf; if it fails, add to pending bouquets
        const addedToShelf = addBouquetToShelf(bouquet);

        if (!addedToShelf) {
          // No shelf space - add to inventory (pending bouquets)
          useGameStore.setState((s) => ({
            pendingBouquets: [...s.pendingBouquets, bouquet],
            lastUpdated: Date.now(),
          }));
        }
      }

      setBouquetsCreated(bouquets.length);
      if (!fulfillOrderId) {
        setCurrentScreen('shop');
      }
    }
  };

  const handleBack = () => {
    if (isComplete) {
      setIsComplete(false);
      setIsAnimating(false);
    } else {
      setCurrentScreen('arrangement');
    }
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
        <h1 style={{ margin: 0, fontSize: '18px' }}>
          {isComplete
            ? `✨ ${bouquetsCreated} Bouquet${bouquetsCreated > 1 ? 's' : ''} Ready!`
            : `🎁 Wrapping ${bouquetQuantityToBuild} Bouquet${bouquetQuantityToBuild > 1 ? 's' : ''}`}
        </h1>
        {isComplete && (
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
            Back
          </button>
        )}
      </div>

      {/* Main content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          gap: '20px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Animation / Result Display */}
        {!isComplete ? (
          <>
            {/* Pre-animation: Show bouquet preview */}
            <div
              style={{
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                position: 'relative',
                zIndex: 1,
              }}
            >
              <div style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>
                {activeRecipe?.name || 'Your Bouquet'}
              </div>
              <div
                style={{
                  padding: '16px',
                  background: 'rgba(255,255,255,0.5)',
                  borderRadius: '8px',
                  minHeight: '120px',
                  minWidth: '120px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {activeRecipe ? (
                  <img
                    src={activeRecipe.imageUrl}
                    alt={activeRecipe.name}
                    style={{
                      width: '100px',
                      height: '100px',
                      objectFit: 'contain',
                      animation: isAnimating ? 'magicalSparkle 3s ease-in-out' : 'none',
                    }}
                  />
                ) : (
                  <div style={{ fontSize: '48px' }}>💐</div>
                )}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {activeRecipe
                  ? `Sells for ${activeRecipe.sellPrice} 🌼${bouquetQuantityToBuild > 1
                    ? ` × ${bouquetQuantityToBuild} = ${activeRecipe.sellPrice * bouquetQuantityToBuild}`
                    : ''}`
                  : ''}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Post-animation: Show result */}
            <div style={{ fontSize: '32px' }}>🌸</div>
            <div
              style={{
                padding: '20px',
                background: 'rgba(255,255,255,0.6)',
                borderRadius: '8px',
                textAlign: 'center',
                minHeight: '140px',
                minWidth: '140px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {activeRecipe ? (
                <>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    {activeRecipe.name}
                  </div>
                  <img
                    src={activeRecipe.imageUrl}
                    alt={activeRecipe.name}
                    style={{
                      width: '100px',
                      height: '100px',
                      objectFit: 'contain',
                    }}
                  />
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#6A9A50', marginTop: '4px' }}>
                    {activeRecipe.sellPrice} 🌼
                  </div>
                </>
              ) : (
                <div style={{ fontSize: '36px' }}>💐</div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer - action button */}
      <div
        style={{
          padding: '12px',
          borderTop: '2px solid rgba(0,0,0,0.1)',
          background: 'rgba(255,255,255,0.3)',
          display: 'flex',
          gap: '8px',
        }}
      >
        {!isComplete && !isAnimating && (
          <button
            onClick={handleAddWrapping}
            style={{
              flex: 1,
              padding: '12px',
              background: '#6A9A50',
              color: '#FFF',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            ✨ Add Wrapping Paper + Ribbon
          </button>
        )}
        {isAnimating && (
          <div
            style={{
              flex: 1,
              padding: '12px',
              background: '#F0EFE4',
              color: '#6A9A50',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: 'bold',
              textAlign: 'center',
            }}
          >
            Wrapping...
          </div>
        )}
        {isComplete && (
          <>
            <button
              onClick={handleBack}
              style={{
                flex: 0.3,
                padding: '12px',
                background: '#D4D4D4',
                color: '#444',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              ← Back
            </button>
            <button
              onClick={handleFinishBouquet}
              style={{
                flex: 1,
                padding: '12px',
                background: '#6A9A50',
                color: '#FFF',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              {fulfillOrderId
                ? '✓ Complete Order'
                : `✓ Add ${bouquetQuantityToBuild} Bouquet${bouquetQuantityToBuild > 1 ? 's' : ''} to Shelf`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
