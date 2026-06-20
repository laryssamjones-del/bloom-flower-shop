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
import { TutorialModal } from './components/TutorialModal';

// Module-level telemetry registration (runs once on import)
RundotGameAPI.lifecycles.onPause(() => RundotGameAPI.analytics.recordCustomEvent('game_paused'));
RundotGameAPI.lifecycles.onResume(() => {
  RundotGameAPI.analytics.recordCustomEvent('game_resumed');
  // Track tutorial start on resume if it hasn't been completed
  const { tutorialCompleted, tutorialCurrentStep } = useGameStore.getState();
  if (!tutorialCompleted && tutorialCurrentStep === 0) {
    RundotGameAPI.analytics.recordCustomEvent('tutorial_started', {
      timestamp: Date.now(),
    });
  }
});
RundotGameAPI.lifecycles.onSleep(() => RundotGameAPI.analytics.recordCustomEvent('game_sleep'));
RundotGameAPI.lifecycles.onQuit(() => RundotGameAPI.analytics.recordCustomEvent('game_quit'));

export function BloommyGame() {
  const safeArea = getSafeArea();
  const currentScreen = useGameStore((s) => s.currentScreen);
  const loadGameState = useGameStore((s) => s.loadGameState);
  const saveGameState = useGameStore((s) => s.saveGameState);
  const tutorialCompleted = useGameStore((s) => s.tutorialCompleted);
  const tutorialCurrentStep = useGameStore((s) => s.tutorialCurrentStep);
  const setTutorialStep = useGameStore((s) => s.setTutorialStep);
  const completeTutorial = useGameStore((s) => s.completeTutorial);
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

  const shouldShowTutorial = !tutorialCompleted && currentScreen === 'shop';

  return (
    <div className="bloomy-phone-outer">
      <div className="bloomy-phone-inner" style={safeAreaPadding}>
        {currentScreen === 'shop' && <ShopScreen />}
        {currentScreen === 'wholesale' && <WholesaleMarketScreen />}
        {currentScreen === 'arrangement' && <BouquetArrangementScreen />}
        {currentScreen === 'wrapping' && <WrappingScreen />}
        {currentScreen === 'inventory' && <InventoryScreen />}
        {currentScreen === 'orders' && <OrdersScreen />}

        {/* Tutorial Modal */}
        {shouldShowTutorial && (
          <TutorialModal
            isOpen={shouldShowTutorial}
            currentStep={tutorialCurrentStep}
            onNextStep={(nextStep) => {
              if (nextStep <= 9) {
                // Still on a step (0-9)
                setTutorialStep(nextStep);
                RundotGameAPI.analytics.recordCustomEvent('tutorial_step_completed', {
                  step: nextStep,
                  timestamp: Date.now(),
                });
              } else {
                // Completed all steps
                completeTutorial();
                RundotGameAPI.analytics.recordCustomEvent('tutorial_completed', {
                  timestamp: Date.now(),
                });
              }
            }}
            onPreviousStep={() => {
              if (tutorialCurrentStep > 0) {
                setTutorialStep(tutorialCurrentStep - 1);
              }
            }}
            onSkip={() => {
              completeTutorial();
              RundotGameAPI.analytics.recordCustomEvent('tutorial_skipped', {
                stepWhenSkipped: tutorialCurrentStep,
                timestamp: Date.now(),
              });
            }}
          />
        )}
      </div>
      <NotificationBell />
    </div>
  );
}

export default BloommyGame;
