import { useGameStore } from '../../stores/gameStore';

export function CoinCounter() {
  const coins = useGameStore((s) => s.coins);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#C09840',
      }}
    >
      <span style={{ fontSize: '24px' }}>🌼</span>
      <span>{coins.toLocaleString()} Petal Coins</span>
    </div>
  );
}
