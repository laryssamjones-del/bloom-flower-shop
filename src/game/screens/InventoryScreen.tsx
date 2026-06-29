import { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { FLOWERS, GREENERY } from '../../constants/flowers';
import RundotGameAPI from '@series-inc/rundot-game-sdk/api';
import { ScreenNavigation } from '../components/ScreenNavigation';

export function InventoryScreen() {
  const setCurrentScreen = useGameStore((s) => s.setCurrentScreen);
  const inventory = useGameStore((s) => s.inventory);
  const inventoryCapacity = useGameStore((s) => s.inventoryCapacity);
  const pendingBouquets = useGameStore((s) => s.pendingBouquets);
  const mysteryBouquets = useGameStore((s) => s.mysteryBouquets);
  const exclusiveBouquets = useGameStore((s) => s.exclusiveBouquets);
  const sellMysteryBouquet = useGameStore((s) => s.sellMysteryBouquet);
  const sellExclusiveBouquet = useGameStore((s) => s.sellExclusiveBouquet);
  const displayExclusiveBouquetOnShelf = useGameStore((s) => s.displayExclusiveBouquetOnShelf);
  const addBouquetToShelf = useGameStore((s) => s.addBouquetToShelf);
  const displayedBouquets = useGameStore((s) => s.displayedBouquets);
  const unclaimedRewards = useGameStore((s) => s.unclaimedRewards);
  const getUnclaimedRewardCount = useGameStore((s) => s.getUnclaimedRewardCount);
  const claimLevelReward = useGameStore((s) => s.claimLevelReward);
  const removeBouquetFromPending = useGameStore((s) => s.removeBouquetFromPending);
  const sellStems = useGameStore((s) => s.sellStems);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [claimingRewards, setClaimingRewards] = useState<Set<number>>(new Set());

  const getItem = (id: string) => FLOWERS[id] || (GREENERY as Record<string, any>)[id];

  const totalStems = inventory.reduce((sum, item) => sum + item.quantity, 0);

  const handleSellStems = (flowerId: string, flowerName: string, quantity: number) => {
    const refund = sellStems(flowerId, quantity);
    if (refund > 0) {
      setSuccessMessage(`✅ Sold ${quantity} ${flowerName} for ${refund} 🌼`);
      setTimeout(() => setSuccessMessage(null), 2000);

      RundotGameAPI.analytics.recordCustomEvent('stems_sold', {
        flowerId,
        quantity,
        refund,
      });
    }
  };

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

  const handleCloseRewardsModal = () => {
    setShowRewardsModal(false);
    setClaimingRewards(new Set());
  };

  const handleAddPendingBouquetToShelf = (bouquetId: string, bouquetName: string) => {
    const bouquet = pendingBouquets.find((b) => b.id === bouquetId);
    if (!bouquet) return;

    const emptySlots = displayedBouquets.filter((b) => b === null).length;
    if (emptySlots === 0) {
      const msg = '❌ Your shelf is full! Remove a bouquet to make space.';
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(null), 3000);
      return;
    }

    if (addBouquetToShelf(bouquet)) {
      removeBouquetFromPending(bouquetId);
      const msg = `✨ ${bouquetName} added to shelf!`;
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(null), 2000);
      RundotGameAPI.analytics.recordCustomEvent('pending_bouquet_added_to_shelf', {
        bouquetId,
        bouquetName,
      });
    }
  };

  const handleRemovePendingBouquet = (bouquetId: string) => {
    const bouquet = pendingBouquets.find((b) => b.id === bouquetId);
    if (!bouquet) return;

    removeBouquetFromPending(bouquetId);
    const msg = `🗑️ ${bouquet.recipeName || 'Bouquet'} removed`;
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 2000);

    RundotGameAPI.analytics.recordCustomEvent('bouquet_deleted_from_storage', {
      bouquetId,
      bouquetName: bouquet.recipeName,
      source: bouquet.source,
    });
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
            disabled={getUnclaimedRewardCount() === 0}
            style={{
              padding: '8px 12px',
              background: getUnclaimedRewardCount() > 0 ? '#F39C12' : '#A9A9A9',
              color: '#FFF',
              border: 'none',
              borderRadius: '4px',
              cursor: getUnclaimedRewardCount() > 0 ? 'pointer' : 'not-allowed',
              fontSize: '12px',
              fontWeight: 'bold',
              position: 'relative',
              opacity: getUnclaimedRewardCount() > 0 ? 1 : 0.7,
              transition: 'all 0.3s ease',
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
                  animation: 'pulse 2s infinite',
                }}
              />
            )}
          </button>
          <button
            onClick={() => setCurrentScreen('shop')}
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
        {inventory.length === 0 && mysteryBouquets.length === 0 && pendingBouquets.length === 0 && exclusiveBouquets.length === 0 ? (
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
              Total stems: {totalStems}/{inventoryCapacity}
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
                    {(() => {
                      // 50% of the buy price (rounded), per stem — matches sellStems in the store.
                      const refundPerStem = Math.round(flower.pricePerStem * 0.5);
                      return (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-end',
                            gap: '6px',
                            minWidth: '78px',
                          }}
                        >
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#6A9A50' }}>
                            {item.quantity}x
                          </div>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              onClick={() => handleSellStems(item.flowerId, flower.name, 1)}
                              style={{
                                padding: '5px 8px',
                                background: '#E8A87C',
                                color: '#FFF',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              Sell 1 (+{refundPerStem})
                            </button>
                            <button
                              onClick={() => handleSellStems(item.flowerId, flower.name, item.quantity)}
                              style={{
                                padding: '5px 8px',
                                background: '#C97B4A',
                                color: '#FFF',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              All (+{refundPerStem * item.quantity})
                            </button>
                          </div>
                        </div>
                      );
                    })()}
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

        {/* Bouquets Section (Storage) — always visible */}
        <div style={{ marginTop: '24px' }}>
          <div
            style={{
              fontSize: '16px',
              fontWeight: 'bold',
              marginBottom: '8px',
              color: '#E8964E',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              justifyContent: 'space-between',
            }}
          >
            <span>💐 Bouquets</span>
            <span style={{ fontSize: '12px', color: '#999', fontWeight: 'normal' }}>
              {pendingBouquets.length} / 50
            </span>
          </div>
          {pendingBouquets.length >= 50 && (
            <div
              style={{
                padding: '10px',
                background: '#FFEBEE',
                border: '1px solid #FF6B6B',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#C92A2A',
                marginBottom: '12px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              ⚠️ Storage is full! Delete bouquets to make space.
            </div>
          )}
          {pendingBouquets.length === 0 ? (
            <div
              style={{
                padding: '16px',
                background: 'rgba(232, 150, 78, 0.08)',
                border: '1px dashed #E8964E',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#999',
                textAlign: 'center',
              }}
            >
              No bouquets yet. Go to Arrange to make one!
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gap: '10px',
              }}
            >
              {pendingBouquets.map((bouquet) => {
                const emptySlots = displayedBouquets.filter((b) => b === null).length;
                const canDisplay = emptySlots > 0;

                return (
                  <div
                    key={bouquet.id}
                    style={{
                      padding: '12px',
                      background: 'linear-gradient(135deg, rgba(232, 150, 78, 0.15), rgba(230, 126, 34, 0.1))',
                      border: '2px solid #E8964E',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <img
                      src={bouquet.thumbnailUrl || 'https://via.placeholder.com/60'}
                      alt="Pending Bouquet"
                      style={{
                        width: '60px',
                        height: '60px',
                        objectFit: 'contain',
                      }}
                    />
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                          {bouquet.recipeName || 'Custom Bouquet'}
                        </div>
                        {/* Source Badge */}
                        {bouquet.source && (
                          <span
                            style={{
                              fontSize: '9px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontWeight: 'bold',
                              backgroundColor:
                                bouquet.source === 'reward'
                                  ? '#FFD700'
                                  : bouquet.source === 'delivery'
                                  ? '#87CEEB'
                                  : bouquet.source === 'overflow'
                                  ? '#FFB6C1'
                                  : '#DDA0DD',
                              color:
                                bouquet.source === 'reward'
                                  ? '#333'
                                  : bouquet.source === 'delivery'
                                  ? '#333'
                                  : '#333',
                            }}
                          >
                            {bouquet.source === 'reward'
                              ? '🎁 Reward'
                              : bouquet.source === 'delivery'
                              ? '🚚 Delivery'
                              : bouquet.source === 'overflow'
                              ? '📋 Overflow'
                              : '⭐ Premium'}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                        {bouquet.stems.length} stems • {bouquet.wrappingPaper} • {bouquet.ribbonColor}
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#E8964E', marginTop: '4px' }}>
                        💰 Sells for {bouquet.sellPrice} 🌼
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
                        onClick={() => handleAddPendingBouquetToShelf(bouquet.id, bouquet.recipeName || 'Bouquet')}
                        disabled={!canDisplay}
                        style={{
                          padding: '6px 10px',
                          background: canDisplay ? '#E8964E' : '#CCC',
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
                        📊 Place on Shelf
                      </button>
                      <button
                        onClick={() => handleRemovePendingBouquet(bouquet.id)}
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
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

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
            onClick={() => handleCloseRewardsModal()}
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
                const isClaiming = claimingRewards.has(level);
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
                      disabled={isClaiming}
                      onClick={() => {
                        // Prevent double-clicks by marking as claiming
                        setClaimingRewards((prev) => new Set([...prev, level]));
                        claimLevelReward(level);
                        RundotGameAPI.analytics.recordCustomEvent('reward_claimed_from_inventory', {
                          level,
                        });
                      }}
                      style={{
                        padding: '6px 12px',
                        background: isClaiming ? '#CCC' : '#F39C12',
                        color: '#FFF',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isClaiming ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                        opacity: isClaiming ? 0.6 : 1,
                      }}
                    >
                      {isClaiming ? 'Claiming...' : 'Claim'}
                    </button>
                  </div>
                );
              })}
                </>
              )}

              <button
                onClick={() => handleCloseRewardsModal()}
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

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
