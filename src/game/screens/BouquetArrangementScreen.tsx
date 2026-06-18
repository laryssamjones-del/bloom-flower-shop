import { useGameStore } from '../../stores/gameStore';
import { FLOWERS } from '../../constants/flowers';
import RundotGameAPI from '@series-inc/rundot-game-sdk/api';
import { ScreenNavigation } from '../components/ScreenNavigation';

export function BouquetArrangementScreen() {
  const setCurrentScreen = useGameStore((s) => s.setCurrentScreen);
  const inventory = useGameStore((s) => s.inventory);
  const stemsInArrangement = useGameStore((s) => s.stemsInArrangement);
  const addStemToArrangement = useGameStore((s) => s.addStemToArrangement);
  const removeStemFromArrangement = useGameStore((s) => s.removeStemFromArrangement);
  const calculateBouquetPrice = useGameStore((s) => s.calculateBouquetPrice);
  const clearArrangement = useGameStore((s) => s.clearArrangement);

  const handleStartWrapping = () => {
    if (stemsInArrangement.length > 0) {
      RundotGameAPI.analytics.recordCustomEvent('bouquet_arrangement_complete', {
        stemCount: stemsInArrangement.length,
      });
      setCurrentScreen('wrapping');
    }
  };

  const handleAddStem = (flowerId: string) => {
    if (addStemToArrangement(flowerId)) {
      RundotGameAPI.analytics.recordCustomEvent('stem_added_to_arrangement', {
        flowerId,
      });
    }
  };

  const estimatedPrice = calculateBouquetPrice(stemsInArrangement);

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
        <h1 style={{ margin: 0, fontSize: '18px' }}>✨ Create Your Own</h1>
        <button
          onClick={() => {
            clearArrangement();
            setCurrentScreen('shop');
          }}
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
      </div>

      {/* Quick Navigation */}
      <ScreenNavigation currentScreen="arrangement" />

      {/* Main content */}
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
        {/* Workstation - show arranged stems */}
        <div
          style={{
            padding: '12px',
            background: 'rgba(255,255,255,0.5)',
            borderRadius: '6px',
          }}
        >
          <h2 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
            Workstation ({stemsInArrangement.length}/7 stems)
          </h2>

          {stemsInArrangement.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '20px',
                color: '#999',
                fontSize: '12px',
              }}
            >
              Click stems below to add them to your bouquet
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              {stemsInArrangement.map((stem, idx) => {
                const flower = FLOWERS[stem.flowerId];
                return (
                  <div
                    key={idx}
                    onClick={() => removeStemFromArrangement(idx)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px',
                      background: 'rgba(200,150,100,0.2)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      opacity: 0.8,
                    }}
                    title="Click to remove"
                  >
                    <img
                      src={flower?.spriteUrl}
                      alt={flower?.name}
                      style={{
                        width: '40px',
                        height: '40px',
                        objectFit: 'contain',
                      }}
                    />
                    <div style={{ fontSize: '10px', color: '#666' }}>
                      {flower?.name}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {stemsInArrangement.length > 0 && (
            <div
              style={{
                marginTop: '8px',
                padding: '8px',
                background: 'rgba(106,154,80,0.1)',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#6A9A50',
              }}
            >
              Estimated sale price: {estimatedPrice} 🌼
            </div>
          )}
        </div>

        {/* Available stems */}
        <div
          style={{
            padding: '12px',
            background: 'rgba(255,255,255,0.5)',
            borderRadius: '6px',
          }}
        >
          <h2 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Available Stems</h2>

          {inventory.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '12px',
                color: '#999',
                fontSize: '12px',
              }}
            >
              No stems in inventory. Visit the Wholesale Market!
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                gap: '8px',
              }}
            >
              {inventory.map((item) => {
                const flower = FLOWERS[item.flowerId];
                if (!flower) return null;

                const canAdd = stemsInArrangement.length < 7;

                return (
                  <button
                    key={item.flowerId}
                    onClick={() => handleAddStem(item.flowerId)}
                    disabled={!canAdd || item.quantity === 0}
                    style={{
                      padding: '8px',
                      background: canAdd && item.quantity > 0 ? 'rgba(255,255,255,0.8)' : '#EEE',
                      border: '2px solid #DDD',
                      borderRadius: '4px',
                      cursor: canAdd && item.quantity > 0 ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      opacity: canAdd && item.quantity > 0 ? 1 : 0.5,
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
                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: '#666',
                      }}
                    >
                      ×{item.quantity}
                    </div>
                    <div
                      style={{
                        fontSize: '9px',
                        color: '#999',
                        textAlign: 'center',
                      }}
                    >
                      {flower.name}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer - action button */}
      <div
        style={{
          padding: '12px',
          borderTop: '2px solid rgba(0,0,0,0.1)',
          background: 'rgba(255,255,255,0.3)',
        }}
      >
        <button
          onClick={handleStartWrapping}
          disabled={stemsInArrangement.length === 0}
          style={{
            width: '100%',
            padding: '12px',
            background:
              stemsInArrangement.length > 0 ? '#6A9A50' : '#CCC',
            color: '#FFF',
            border: 'none',
            borderRadius: '4px',
            cursor: stemsInArrangement.length > 0 ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            fontWeight: 'bold',
          }}
        >
          Next: Wrap It! →
        </button>
      </div>
    </div>
  );
}
