import { useGameStore } from '../../stores/gameStore';

export function RunBucksCounter() {
  const premiumCurrency = useGameStore((s) => s.premiumCurrency);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#333',
        background: '#F5F1E8',
        border: '2px solid #DA70D6',
        borderRadius: '50px',
        padding: '8px 14px',
        minWidth: '160px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: '18px' }}>💎</span>
      <span style={{ color: '#DA70D6' }}>{premiumCurrency.toLocaleString()} Run Bucks</span>
    </div>
  );
}
