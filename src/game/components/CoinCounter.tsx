import { useGameStore } from '../../stores/gameStore';

export function CoinCounter() {
  const coins = useGameStore((s) => s.coins);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#333',
        background: '#F5F1E8',
        border: '2px solid #C09840',
        borderRadius: '50px',
        padding: '10px 18px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}
    >
      <span style={{ fontSize: '24px' }}>🌼</span>
      <span style={{ color: '#C09840' }}>{coins.toLocaleString()} Petal Coins</span>
    </div>
  );
}
