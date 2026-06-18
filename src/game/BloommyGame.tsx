import { useEffect, useState } from 'react';
import { getSafeArea } from '../services/environment';
import { useGameStore } from '../stores/gameStore';
import RundotGameAPI from '@series-inc/rundot-game-sdk/api';
import { ShopScreen } from './screens/ShopScreen';
import { WholesaleMarketScreen } from './screens/WholesaleMarketScreen';
import { BouquetArrangementScreen } from './screens/BouquetArrangementScreen';
import { WrappingScreen } from './screens/WrappingScreen';
import { InventoryScreen } from './screens/InventoryScreen';
import { OrdersScreen } from './screens/OrdersScreen';
import { NotificationBell } from './components/NotificationBell';

// Module-level telemetry registration (runs once on import)
RundotGameAPI.lifecycles.onPause(() => RundotGameAPI.analytics.recordCustomEvent('game_paused'));
RundotGameAPI.lifecycles.onResume(() => RundotGameAPI.analytics.recordCustomEvent('game_resumed'));
RundotGameAPI.lifecycles.onSleep(() => RundotGameAPI.analytics.recordCustomEvent('game_sleep'));
RundotGameAPI.lifecycles.onQuit(() => RundotGameAPI.analytics.recordCustomEvent('game_quit'));

export function BloommyGame() {
  const safeArea = getSafeArea();
  const currentScreen = useGameStore((s) => s.currentScreen);
  const loadGameState = useGameStore((s) => s.loadGameState);
  const saveGameState = useGameStore((s) => s.saveGameState);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize game on mount
  useEffect(() => {
    const initGame = async () => {
      await loadGameState();
      setIsLoading(false);

      // Record game start
      RundotGameAPI.analytics.recordCustomEvent('game_started', {
        timestamp: Date.now(),
      });
    };

    initGame();

    // Auto-save on intervals
    const saveInterval = setInterval(() => {
      saveGameState();
    }, 30000); // Save every 30 seconds
    return () => clearInterval(saveInterval);
  }, [loadGameState, saveGameState]);

  // Save game when leaving
  useEffect(() => {
    const handleBeforeUnload = () => {
      const state = useGameStore.getState();
      const stateToPersist = {
        coins: state.coins,
        totalEarned: state.totalEarned,
        inventory: state.inventory,
        inventoryCapacity: state.inventoryCapacity,
        shelfCapacity: state.shelfCapacity,
        shelfBouquets: state.shelfBouquets,
        displayedBouquets: state.displayedBouquets,
        totalCustomersServed: state.totalCustomersServed,
        unlockedFlowers: Array.from(state.unlockedFlowers),
        unlockedRibbons: state.unlockedRibbons,
        unlockedWrappings: state.unlockedWrappings,
      };
      localStorage.setItem('bloomy-game-state', JSON.stringify(stateToPersist));
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Order generation - spawn orders every 20 seconds
  useEffect(() => {
    const createOrder = useGameStore.getState().createOrder;
    const triggerNotification = useGameStore.getState().triggerNotification;

    const orderInterval = setInterval(() => {
      const order = createOrder();
      if (order) {
        triggerNotification('New Order!');
        RundotGameAPI.analytics.recordCustomEvent('order_generated', {
          orderId: order.id,
          customerType: order.customerType,
          stemCount: order.requiredStems.length,
          reward: order.reward,
        });
      }
    }, 20000); // Generate order every 20 seconds

    return () => clearInterval(orderInterval);
  }, []);

  // Safe-area padding applied inline (values come from SDK at runtime)
  const safeAreaPadding = {
    paddingTop: safeArea.top,
    paddingBottom: safeArea.bottom,
    paddingLeft: safeArea.left,
    paddingRight: safeArea.right,
  };

  if (isLoading) {
    return (
      <div className="bloomy-phone-outer">
        <div
          className="bloomy-phone-inner"
          style={{
            ...safeAreaPadding,
            alignItems: 'center',
            justifyContent: 'center',
            background: '#F5E6D3',
            fontSize: '18px',
          }}
        >
          🌸 Bloomy is loading...
        </div>
      </div>
    );
  }

  return (
    <div className="bloomy-phone-outer">
      <div className="bloomy-phone-inner" style={safeAreaPadding}>
        {currentScreen === 'shop' && <ShopScreen />}
        {currentScreen === 'wholesale' && <WholesaleMarketScreen />}
        {currentScreen === 'arrangement' && <BouquetArrangementScreen />}
        {currentScreen === 'wrapping' && <WrappingScreen />}
        {currentScreen === 'inventory' && <InventoryScreen />}
        {currentScreen === 'orders' && <OrdersScreen />}
      </div>
      <NotificationBell />
    </div>
  );
}

export default BloommyGame;
