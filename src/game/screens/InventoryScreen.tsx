import { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { FLOWERS, GREENERY } from '../../constants/flowers';
import RundotGameAPI from '@series-inc/rundot-game-sdk/api';
import { ScreenNavigation } from '../components/ScreenNavigation';

export function InventoryScreen() {
  const setCurrentScreen = useGameStore((s) => s.setCurrentScreen);
  const inventory = useGameStore((s) => s.inventory);
  const mysteryBouquets = useGameStore((s) => s.mysteryBouquets);
  const exclusiveBouquets = useGameStore((s) => s.exclusiveBouquets);
  const sellMysteryBouquet = useGameStore((s) => s.sellMysteryBouquet);
  const sellExclusiveBouquet = useGameStore((s) => s.sellExclusiveBouquet);
  const displayExclusiveBouquetOnShelf = useGameStore((s) => s.displayExclusiveBouquetOnShelf);
  const displayedBouquets = useGameStore((s) => s.displayedBouquets);
  const unclaimedRewards = useGameStore((s) => s.unclaimedRewards);
  const getUnclaimedRewardCount = useGameStore((s) => s.getUnclaimedRewardCount);
  const claimLevelReward = useGameStore((s) => s.claimLevelReward);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showRewardsModal, setShowRewardsModal] = useState(false);

  const getItem = (id: string) => FLOWERS[id] || (GREENERY as Record<string, any>)[id];

  const totalStems = inventory.reduce((sum, item) => sum + item.quantity, 0);

  const handleSellMysteryBouquet = (bouquetId: string, bouquetName: string, price: number) => {
    if (sellMysteryBouquet(bouquetId)) {
      const msg = `✨ Sold ${bouquetName} for ${price} 🌼`;
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(null), 2000);

      RundotGameAPI.analytics.recordCustomEvent('mystery_bouquet_sold', {
        bouquetId,
        price,
      });
    }
  };

  const handleSellExclusiveBouquet = (bouquetId: string, bouquetName: string, price: number) => {
    if (sellExclusiveBouquet(bouquetId)) {
      const msg = `✨ Sold ${bouquetName} for ${price} 🌼`;
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(null), 2000);

      RundotGameAPI.analytics.recordCustomEvent('exclusive_bouquet_sold', {
        bouquetId,
        bouquetName,
        price,
      });
    }
  };

  const handleDisplayOnShelf = (bouquetId: string, bouquetName: string) => {
    const emptySlots = displayedBouquets.filter((b) => b === null).length;
    if (emptySlots === 0) {
      const msg = '❌ Your shelf is full! Remove a bouquet to make space.';
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(null), 3000);

      RundotGameAPI.analytics.recordCustomEvent('exclusive_bouquet_inventory_full', {
        bouquetId,
        bouquetName,
      });
      return;
    }

    if (displayExclusiveBouquetOnShelf(bouquetId)) {
      const msg = `✨ ${bouquetName} displayed on shelf!`;
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(null), 2000);

      RundotGameAPI.analytics.recordCustomEvent('exclusive_bouquet_displayed_on_shelf', {
        bouquetId,
        bouquetName,
      });
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
        <h1 style={{ margin: 0, fontSize: '18px' }}>📦 Inventory</h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => setShowRewardsModal(true)}
            style={{
              padding: '8px 12px',
              background: '#F39C12',
              color: '#FFF',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
              position: 'relative',
            }}
          >
            🎁 Claim Rewards
            {getUnclaimedRewardCount() > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  width: '10px',
                  height: '10px',
                  background: '#E74C3C',
                  borderRadius: '50%',
                  border: '2px solid #FFF',
                }}
              />
            )}
          </button>
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
            Back to Home
          </button>
        </div>
      </div>

      {/* Quick Navigation */}
      <ScreenNavigation currentScreen="inventory" />

      {/* Success message */}
      {successMessage && (
        <div
          style={{
            padding: '12px 16px',
            background: 'linear-gradient(135deg, rgba(155, 89, 182, 0.2), rgba(52, 152, 219, 0.2))',
            color: '#9B59B6',
            fontSize: '14px',
            fontWeight: 'bold',
            textAlign: 'center',
            borderBottom: '2px solid #9B59B6',
          }}
        >
          {successMessage}
        </div>
      )}

      {/* Inventory List */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '12px',
        }}
      >
        {inventory.length === 0 && mysteryBouquets.length === 0 ? (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              color: '#666',
            }}
          >
            <p style={{ fontSize: '14px', marginBottom: '8px' }}>Your inventory is empty</p>
            <p style={{ fontSize: '12px', opacity: 0.7 }}>Visit the Nursery to buy stems!</p>
          </div>
        ) : (
          <>
            <div
              style={{
                marginBottom: '16px',
                padding: '12px',
                background: 'rgba(0,0,0,0.05)',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              Total stems: {totalStems}
            </div>

            <div
              style={{
                display: 'grid',
                gap: '8px',
              }}
            >
              {inventory.map((item) => {
                const flower = getItem(item.flowerId);
                if (!flower) return null;

                return (
                  <div
                    key={item.flowerId}
                    style={{
                      padding: '12px',
                      background: 'rgba(255,255,255,0.5)',
                      border: '2px solid #DDD',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <img
                      src={flower.spriteUrl}
                      alt={flower.name}
                      style={{
                        width: '48px',
                        height: '48px',
                        objectFit: 'contain',
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{flower.name}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {item.quantity} stems @ {flower.pricePerStem} 🌼 each
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: '#6A9A50',
                        minWidth: '60px',
                        textAlign: 'right',
                      }}
                    >
                      {item.quantity}x
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Exclusive Bouquets Section */}
        {exclusiveBouquets.length > 0 && (
          <div style={{ marginTop: '24px' }}>
            <div
              style={{
                fontSize: '16px',
                fontWeight: 'bold',
                marginBottom: '12px',
                color: '#FF8C00',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              ✨ Exclusive Bouquets
            </div>
            <div
              style={{
                display: 'grid',
                gap: '10px',
              }}
            >
              {exclusiveBouquets.map((bouquet) => {
                const emptySlots = displayedBouquets.filter((b) => b === null).length;
                const canDisplay = emptySlots > 0;

                return (
                  <div
                    key={bouquet.id}
                    style={{
                      padding: '12px',
                      background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.15), rgba(255, 152, 0, 0.1))',
                      border: '2px solid #FFB300',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <img
                      src={bouquet.imageUrl}
                      alt={bouquet.name}
                      style={{
                        width: '60px',
                        height: '60px',
                        objectFit: 'contain',
                      }}
                    />
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                        {bouquet.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#FF8C00', marginTop: '4px' }}>
                        Sells for {bouquet.sellPrice} 🌼
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        minWidth: '90px',
                      }}
                    >
                      <button
                        onClick={() => handleDisplayOnShelf(bouquet.id, bouquet.name)}
                        disabled={!canDisplay}
                        style={{
                          padding: '6px 10px',
                          background: canDisplay ? '#FFB300' : '#CCC',
                          color: '#FFF',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: canDisplay ? 'pointer' : 'not-allowed',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          if (canDisplay) {
                            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                        }}
                      >
                        📊 Display
                      </button>
                      <button
                        onClick={() => handleSellExclusiveBouquet(bouquet.id, bouquet.name, bouquet.sellPrice)}
                        style={{
                          padding: '6px 10px',
                          background: '#FF6B6B',
                          color: '#FFF',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                        }}
                      >
                        💚 Sell
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Mystery Bouquets Section */}
        {mysteryBouquets.length > 0 && (
          <div style={{ marginTop: '24px' }}>
            <div
              style={{
                fontSize: '16px',
                fontWeight: 'bold',
                marginBottom: '12px',
                color: '#9B59B6',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              🎁 Special Mystery Bouquets
            </div>
            <div
              style={{
                display: 'grid',
                gap: '10px',
              }}
            >
              {mysteryBouquets.map((bouquet) => (
                <button
                  key={bouquet.id}
                  onClick={() => handleSellMysteryBouquet(bouquet.id, bouquet.name, bouquet.sellPrice)}
                  style={{
                    padding: '12px',
                    background: 'linear-gradient(135deg, rgba(155, 89, 182, 0.15), rgba(52, 152, 219, 0.15))',
                    border: '2px solid #9B59B6',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(155, 89, 182, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <img
                    src={bouquet.imageUrl}
                    alt={bouquet.name}
                    style={{
                      width: '60px',
                      height: '60px',
                      objectFit: 'contain',
                    }}
                  />
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                      {bouquet.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#9B59B6', fontWeight: 'bold' }}>
                      Click to sell for {bouquet.sellPrice} 🌼
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: '#9B59B6',
                      minWidth: '80px',
                      textAlign: 'right',
                    }}
                  >
                    ✨ Rare
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Claim Rewards Modal */}
        {showRewardsModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
            }}
            onClick={() => setShowRewardsModal(false)}
          >
            <div
              style={{
                background: '#F5F1E8',
                borderRadius: '12px',
                padding: '20px',
                maxWidth: '400px',
                width: '90%',
                maxHeight: '80vh',
                overflow: 'auto',
                border: '2px solid #D4A574',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ margin: '0 0 16px 0', color: '#333', textAlign: 'center' }}>
                🎁 Level Up Rewards!
              </h2>

              {unclaimedRewards.length === 0 ? (
                <div style={{ fontSize: '14px', color: '#666', textAlign: 'center', padding: '20px 0' }}>
                  No rewards available yet. Keep selling bouquets to level up! 🌸
                </div>
              ) : (
                <>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '16px', textAlign: 'center' }}>
                    You have {unclaimedRewards.length} unclaimed reward(s)
                  </div>

                  {unclaimedRewards.map((level) => {
                const rewardCoins = 150 + Math.floor(level / 5) * 10;
                return (
                  <div
                    key={level}
                    style={{
                      padding: '12px',
                      background: 'rgba(243, 156, 18, 0.1)',
                      border: '1px solid #F39C12',
                      borderRadius: '8px',
                      marginBottom: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                        Level {level} Reward
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                        📦 Random Bouquet + {rewardCoins} 🌼
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        claimLevelReward(level);
                        if (unclaimedRewards.length === 1) {
                          setShowRewardsModal(false);
                        }
                        RundotGameAPI.analytics.recordCustomEvent('reward_claimed_from_inventory', {
                          level,
                        });
                      }}
                      style={{
                        padding: '6px 12px',
                        background: '#F39C12',
                        color: '#FFF',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Claim
                    </button>
                  </div>
                );
              })}
                </>
              )}

              <button
                onClick={() => setShowRewardsModal(false)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#B8A890',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  marginTop: '12px',
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
