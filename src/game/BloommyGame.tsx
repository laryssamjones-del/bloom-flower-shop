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
import { OnlineOrdersScreen } from './screens/OnlineOrdersScreen';
import { TutorialModal } from './components/TutorialModal';
import { pauseBackgroundMusic, resumeBackgroundMusic } from '../hooks/useBackgroundMusic';

// Module-level telemetry registration (runs once on import)
RundotGameAPI.lifecycles.onPause(() => {
  // Stop the background music when the player leaves the game
  pauseBackgroundMusic();
  // Flush progress immediately — pause fires when the player backgrounds/leaves the game.
  useGameStore.getState().saveGameState();
  RundotGameAPI.analytics.recordCustomEvent('game_paused');
});
RundotGameAPI.lifecycles.onResume(() => {
  // Resume background music when the player returns
  resumeBackgroundMusic();
  RundotGameAPI.analytics.recordCustomEvent('game_resumed');
  // Track tutorial start on resume if it hasn't been completed
  const { tutorialCompleted, tutorialCurrentStep } = useGameStore.getState();
  if (!tutorialCompleted && tutorialCurrentStep === 0) {
    RundotGameAPI.analytics.recordCustomEvent('tutorial_started', {
      timestamp: Date.now(),
    });
  }
});
RundotGameAPI.lifecycles.onSleep(() => {
  pauseBackgroundMusic();
  // Flush progress immediately on sleep so a forced quit can't lose it.
  useGameStore.getState().saveGameState();
  RundotGameAPI.analytics.recordCustomEvent('game_sleep');
});
RundotGameAPI.lifecycles.onQuit(() => {
  pauseBackgroundMusic();
  // Last-chance save when the player exits the game.
  useGameStore.getState().saveGameState();
  RundotGameAPI.analytics.recordCustomEvent('game_quit');
});

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
  }, [loadGameState]);

  // Save right after the player does something, instead of waiting on a timer.
  // We watch the store and save as soon as game state changes. A short minimum
  // gap between writes keeps us within the platform's storage rate limit: an
  // isolated action saves instantly (leading edge), and rapid-fire actions
  // collapse into one trailing save.
  useEffect(() => {
    if (isLoading) return; // don't save until the initial load has finished

    const MIN_SAVE_INTERVAL_MS = 3000;
    let lastSaveAt = 0;
    let trailingTimer: ReturnType<typeof setTimeout> | null = null;

    const requestSave = () => {
      const elapsed = Date.now() - lastSaveAt;
      if (elapsed >= MIN_SAVE_INTERVAL_MS) {
        lastSaveAt = Date.now();
        saveGameState();
      } else if (trailingTimer === null) {
        trailingTimer = setTimeout(() => {
          trailingTimer = null;
          lastSaveAt = Date.now();
          saveGameState();
        }, MIN_SAVE_INTERVAL_MS - elapsed);
      }
    };

    const unsubscribe = useGameStore.subscribe((state, prevState) => {
      // lastUpdated is bumped by every meaningful state mutation.
      if (state.lastUpdated !== prevState.lastUpdated) {
        requestSave();
      }
    });

    return () => {
      if (trailingTimer !== null) clearTimeout(trailingTimer);
      unsubscribe();
    };
  }, [isLoading, saveGameState]);

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
        tutorialCompleted: state.tutorialCompleted,
        tutorialCurrentStep: state.tutorialCurrentStep,
      };
      localStorage.setItem('bloomy-game-state', JSON.stringify(stateToPersist));
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Safe-area padding applied inline (values come from SDK at runtime)
  // Only apply minimal padding to avoid creating excess empty space on mobile
  const safeAreaPadding = {
    paddingTop: 0,
    paddingLeft: Math.max(0, safeArea.left),
    paddingRight: Math.max(0, safeArea.right),
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
        {currentScreen === 'online-orders' && <OnlineOrdersScreen />}

        {/* Tutorial Modal */}
        {shouldShowTutorial && (
          <TutorialModal
            isOpen={shouldShowTutorial}
            currentStep={tutorialCurrentStep}
            onNextStep={(nextStep) => {
              if (nextStep <= 10) {
                // Still on a step (0-10)
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
    </div>
  );
}

export default BloommyGame;
