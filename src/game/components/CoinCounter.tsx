import { useGameStore } from '../../stores/gameStore';

export function CoinCounter() {
  const coins = useGameStore((s) => s.coins);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#333',
        background: '#F5F1E8',
        border: '2px solid #C09840',
        borderRadius: '50px',
        padding: '8px 14px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: '18px' }}>🌼</span>
      <span style={{ color: '#C09840' }}>{coins.toLocaleString()} Petal Coins</span>
    </div>
  );
}
