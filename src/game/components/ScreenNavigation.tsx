import { useGameStore } from '../../stores/gameStore';

interface ScreenNavigationProps {
  currentScreen: 'inventory' | 'orders' | 'arrangement' | 'wholesale';
}

export function ScreenNavigation({ currentScreen }: ScreenNavigationProps) {
  const setCurrentScreen = useGameStore((s) => s.setCurrentScreen);

  const navItems = [
    { screen: 'inventory' as const, label: '📦 Inventory' },
    { screen: 'orders' as const, label: '📋 Orders' },
    { screen: 'arrangement' as const, label: '💐 Arrange' },
    { screen: 'wholesale' as const, label: '🌱 Nursery' },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '6px',
        padding: '8px 12px',
        background: 'rgba(255,255,255,0.2)',
        borderBottom: '1px solid rgba(0,0,0,0.1)',
      }}
    >
      {navItems.map((item) => (
        <button
          key={item.screen}
          onClick={() => setCurrentScreen(item.screen)}
          style={{
            padding: '8px 6px',
            background:
              currentScreen === item.screen ? 'rgba(200, 150, 100, 0.4)' : 'rgba(255,255,255,0.3)',
            color: '#333',
            border: '1px solid rgba(0,0,0,0.1)',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '500',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (currentScreen !== item.screen) {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.5)';
            }
          }}
          onMouseLeave={(e) => {
            if (currentScreen !== item.screen) {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.3)';
            }
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
