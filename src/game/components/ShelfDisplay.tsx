import { useGameStore } from '../../stores/gameStore';
import { FLOWERS } from '../../constants/flowers';
import RundotGameAPI from '@series-inc/rundot-game-sdk/api';

export function ShelfDisplay() {
  const shelfDisplay = useGameStore((s) => s.getShelfDisplay());
  const sellBouquet = useGameStore((s) => s.sellBouquet);

  const handleBouquetClick = (bouquetId: string) => {
    // Customer buys the bouquet
    if (sellBouquet(bouquetId)) {
      RundotGameAPI.analytics.recordCustomEvent('bouquet_sold', {
        bouquetId,
        timestamp: Date.now(),
      });
    }
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
        gap: '8px',
        minHeight: '140px',
      }}
    >
      {shelfDisplay.map((bouquet, idx) => (
        <div
          key={idx}
          onClick={() => {
            if (bouquet) {
              handleBouquetClick(bouquet.id);
            }
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100px',
            padding: '8px',
            background: bouquet ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.05)',
            border: `2px dashed ${bouquet ? '#CCC' : '#DDD'}`,
            borderRadius: '6px',
            cursor: bouquet ? 'pointer' : 'default',
            transition: 'all 0.2s',
            opacity: bouquet ? 1 : 0.7,
          }}
          onMouseEnter={(e) => {
            if (bouquet) {
              (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.7)';
              (e.currentTarget as HTMLDivElement).style.borderColor = '#AAA';
            }
          }}
          onMouseLeave={(e) => {
            if (bouquet) {
              (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.5)';
              (e.currentTarget as HTMLDivElement).style.borderColor = '#CCC';
            }
          }}
        >
          {bouquet ? (
            <>
              <div
                style={{
                  display: 'flex',
                  gap: '4px',
                  marginBottom: '4px',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}
              >
                {bouquet.stems.slice(0, 2).map((stem, stemIdx) => {
                  const flower = FLOWERS[stem.flowerId];
                  return (
                    <img
                      key={stemIdx}
                      src={flower?.spriteUrl}
                      alt={flower?.name}
                      style={{
                        width: '24px',
                        height: '24px',
                        objectFit: 'contain',
                      }}
                    />
                  );
                })}
              </div>
              <div
                style={{
                  fontSize: '10px',
                  color: '#666',
                  textAlign: 'center',
                }}
              >
                {bouquet.stems.length} stems
              </div>
              <div
                style={{
                  fontSize: '9px',
                  color: '#999',
                  marginTop: '2px',
                }}
              >
                💰 {bouquet.sellPrice}
              </div>
            </>
          ) : (
            <div
              style={{
                fontSize: '24px',
                color: '#DDD',
              }}
            >
              +
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
