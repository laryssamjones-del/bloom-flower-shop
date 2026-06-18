import { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { WrappingPaperType, RibbonColor } from '../../types';
import RundotGameAPI from '@series-inc/rundot-game-sdk/api';

const WRAPPING_COLORS = {
  'spring-floral': { name: 'Spring Floral', hex: '#F4C0D1' },
  'kraft': { name: 'Kraft Paper', hex: '#C09840' },
  'pastel-stripe': { name: 'Pastel Stripe', hex: '#CECBF6' },
  'tissue': { name: 'Tissue Paper', hex: '#F0EFE4' },
  'plain-white': { name: 'Plain White', hex: '#FEFEFE' },
} as const;

const RIBBON_COLORS = {
  'blush': { name: 'Blush', hex: '#F4C0D1' },
  'sage': { name: 'Sage', hex: '#5A8C50' },
  'butter-yellow': { name: 'Butter Yellow', hex: '#FAC040' },
  'lavender': { name: 'Lavender', hex: '#AFA9EC' },
  'ivory': { name: 'Ivory', hex: '#FFF8E8' },
  'dusty-rose': { name: 'Dusty Rose', hex: '#D4537E' },
} as const;

export function WrappingScreen() {
  const setCurrentScreen = useGameStore((s) => s.setCurrentScreen);
  const stemsInArrangement = useGameStore((s) => s.stemsInArrangement);
  const setWrappingSelection = useGameStore((s) => s.setWrappingSelection);
  const createBouquet = useGameStore((s) => s.createBouquet);
  const addBouquetToShelf = useGameStore((s) => s.addBouquetToShelf);
  const calculateBouquetPrice = useGameStore((s) => s.calculateBouquetPrice);

  const [selectedWrapping, setSelectedWrapping] = useState<WrappingPaperType>('plain-white');
  const [selectedRibbon, setSelectedRibbon] = useState<RibbonColor>('blush');

  const estimatedPrice = calculateBouquetPrice(stemsInArrangement);

  const handleFinishBouquet = () => {
    setWrappingSelection(selectedWrapping, selectedRibbon);
    const bouquet = createBouquet();

    if (bouquet && addBouquetToShelf(bouquet)) {
      RundotGameAPI.analytics.recordCustomEvent('bouquet_completed', {
        bouquetId: bouquet.id,
        stemCount: bouquet.stems.length,
        wrapping: selectedWrapping,
        ribbon: selectedRibbon,
        estimatedPrice: bouquet.sellPrice,
        bouquetImage: bouquet.thumbnailUrl,
      });

      setCurrentScreen('shop');
    }
  };

  const handleBack = () => {
    setCurrentScreen('arrangement');
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
        <h1 style={{ margin: 0, fontSize: '18px' }}>🎁 Wrap Your Bouquet</h1>
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
      </div>

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
        {/* Preview */}
        <div
          style={{
            padding: '12px',
            background: 'rgba(255,255,255,0.5)',
            borderRadius: '6px',
            textAlign: 'center',
          }}
        >
          <h2 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Preview</h2>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              padding: '16px',
              background: selectedWrapping ? WRAPPING_COLORS[selectedWrapping as WrappingPaperType].hex : '#FFF',
              borderRadius: '4px',
              minHeight: '120px',
              justifyContent: 'center',
            }}
          >
            <div style={{ fontSize: '36px' }}>💐</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {stemsInArrangement.length} stems
            </div>
            <div
              style={{
                padding: '4px 8px',
                background: selectedRibbon ? RIBBON_COLORS[selectedRibbon as RibbonColor].hex : '#FFF',
                borderRadius: '3px',
                fontSize: '10px',
                color: '#666',
              }}
            >
              with {selectedRibbon} ribbon
            </div>
          </div>

          <div
            style={{
              marginTop: '8px',
              padding: '8px',
              background: 'rgba(106,154,80,0.1)',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#6A9A50',
            }}
          >
            Estimated sale price: {estimatedPrice} 🌼
          </div>
        </div>

        {/* Wrapping paper selection */}
        <div
          style={{
            padding: '12px',
            background: 'rgba(255,255,255,0.5)',
            borderRadius: '6px',
          }}
        >
          <h2 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Wrapping Paper</h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
              gap: '8px',
            }}
          >
            {Object.entries(WRAPPING_COLORS).map(([key, { name, hex }]) => (
              <button
                key={key}
                onClick={() => setSelectedWrapping(key as WrappingPaperType)}
                style={{
                  padding: '8px',
                  background: hex,
                  border: selectedWrapping === key ? '3px solid #333' : '2px solid #999',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  minHeight: '60px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  color: key === 'plain-white' ? '#666' : '#FFF',
                }}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* Ribbon selection */}
        <div
          style={{
            padding: '12px',
            background: 'rgba(255,255,255,0.5)',
            borderRadius: '6px',
          }}
        >
          <h2 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Ribbon Color</h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
              gap: '8px',
            }}
          >
            {Object.entries(RIBBON_COLORS).map(([key, { name, hex }]) => (
              <button
                key={key}
                onClick={() => setSelectedRibbon(key as RibbonColor)}
                style={{
                  padding: '8px',
                  background: hex,
                  border: selectedRibbon === key ? '3px solid #333' : '2px solid #999',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  minHeight: '60px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  color: key === 'ivory' ? '#666' : '#FFF',
                }}
              >
                {name}
              </button>
            ))}
          </div>
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
          onClick={handleFinishBouquet}
          style={{
            width: '100%',
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
          ✓ Place on Shelf
        </button>
      </div>
    </div>
  );
}
