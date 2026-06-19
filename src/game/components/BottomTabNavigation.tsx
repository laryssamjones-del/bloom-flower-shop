import { useGameStore } from '../../stores/gameStore';

export function BottomTabNavigation() {
  const setCurrentScreen = useGameStore((s) => s.setCurrentScreen);
  const pendingOrders = useGameStore((s) => s.pendingOrders);
  const hasOrders = pendingOrders.length > 0;

  const navItems = [
    { screen: 'inventory' as const, label: '📦 Inventory' },
    { screen: 'orders' as const, label: '📋 Orders', badge: hasOrders },
    { screen: 'arrangement' as const, label: '💐 Arrange' },
    { screen: 'wholesale' as const, label: '🌱 Nursery' },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '6px',
        padding: '8px',
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
            padding: '8px 6px',
            background: '#F5F0E8',
            color: '#2A1408',
            border: '2px solid #D4AF37',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600',
            transition: 'all 0.2s',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
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
          <div style={{ fontSize: '18px' }}>
            {item.label.split(' ')[0]}
          </div>
          <div style={{ fontSize: '10px' }}>
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
