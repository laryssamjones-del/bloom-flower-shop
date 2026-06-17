import { useEffect, useState } from 'react';
import { getSafeArea } from '../services/environment';
import { useGameStore } from '../stores/gameStore';
import RundotGameAPI from '@series-inc/rundot-game-sdk/api';
import { ShopScreen } from './screens/ShopScreen';
import { WholesaleMarketScreen } from './screens/WholesaleMarketScreen';
import { BouquetArrangementScreen } from './screens/BouquetArrangementScreen';
import { WrappingScreen } from './screens/WrappingScreen';

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
      // Try to save synchronously via localStorage if SDK storage is not available
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

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F5E6D3',
          color: '#2A1408',
          fontSize: '18px',
          paddingTop: safeArea.top,
          paddingBottom: safeArea.bottom,
        }}
      >
        🌸 Bloomy is loading...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#F5E6D3',
        color: '#2A1408',
        paddingTop: safeArea.top,
        paddingBottom: safeArea.bottom,
        paddingLeft: safeArea.left,
        paddingRight: safeArea.right,
      }}
    >
      {currentScreen === 'shop' && <ShopScreen />}
      {currentScreen === 'wholesale' && <WholesaleMarketScreen />}
      {currentScreen === 'arrangement' && <BouquetArrangementScreen />}
      {currentScreen === 'wrapping' && <WrappingScreen />}
    </div>
  );
}

export default BloommyGame;
