import { useGameStore } from '../../stores/gameStore';

export function BottomTabNavigation() {
  const setCurrentScreen = useGameStore((s) => s.setCurrentScreen);
  const pendingOrders = useGameStore((s) => s.pendingOrders);
  const hasOrders = pendingOrders.length > 0;

  const navItems = [
    { screen: 'inventory' as const, label: '📦 Inventory' },
    { screen: 'orders' as const, label: '📋 Orders', badge: hasOrders },
    { screen: 'arrangement' as const, label: '💐 Create Bouquet' },
    { screen: 'wholesale' as const, label: '🛍️ Shop' },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '8px',
        padding: '12px',
        background: 'rgba(255,255,255,0.3)',
        borderTop: '2px solid rgba(0,0,0,0.1)',
        backdropFilter: 'blur(10px)',
      }}
    >
      {navItems.map((item) => (
        <button
          key={item.screen}
          onClick={() => setCurrentScreen(item.screen)}
          style={{
            padding: '12px 8px',
            background: '#F5F0E8',
            color: '#2A1408',
            border: '2px solid #D4AF37',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600',
            transition: 'all 0.2s',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            position: 'relative',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = '#FFFBF5';
            (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = '#F5F0E8';
            (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
          }}
        >
          <div style={{ fontSize: '20px' }}>
            {item.label.split(' ')[0]}
          </div>
          <div style={{ fontSize: '11px' }}>
            {item.label.split(' ').slice(1).join(' ')}
          </div>
          {/* Red badge indicator for pending orders */}
          {(item as any).badge && (
            <div
              style={{
                position: 'absolute',
                top: '6px',
                right: '6px',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#E74C3C',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
