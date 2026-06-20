interface TutorialModalProps {
  isOpen: boolean;
  currentStep: number;
  onNextStep: (step: number) => void;
  onPreviousStep: () => void;
  onSkip: () => void;
}

export function TutorialModal({
  isOpen,
  currentStep,
  onNextStep,
  onPreviousStep,
  onSkip,
}: TutorialModalProps) {
  if (!isOpen) return null;

  // Tutorial messages
  const tutorials = [
    {
      title: 'Welcome to Bloom!',
      message: '',
    },
    {
      title: '',
      message: 'You are the owner of your own floral shop!',
    },
    {
      title: '',
      message:
        'Your task is to buy flowers, create beautiful bouquets (that can be displayed on your shelf), and fulfill customer orders.',
    },
    {
      title: '📱 The Tabs',
      message:
        'The tabs below is where all the magic happens. Click the next steps of the tutorial to read what each tab does!',
    },
    {
      title: '📦 Inventory',
      message:
        'Inventory is where you keep all the flowers and bouquets that you acquire in the game.',
    },
    {
      title: '📋 Orders',
      message:
        'Orders is where customer orders are located and where you can fulfill them.',
    },
    {
      title: '🎨 Arrange',
      message: 'Arrange is where you can create beautiful bouquets.',
    },
    {
      title: '🏪 Market',
      message:
        'Market is where you can buy flowers to create bouquets and is also where you will find the Premium Shop.',
    },
    {
      title: '⚙️ Settings',
      message:
        'Settings is where you can adjust the music volume and where you can reset the game.',
    },
    {
      title: '⭐ Level Up!',
      message:
        'Sell bouquets to level up and unlock new bouquets! Don\'t forget to claim your level up rewards as well!',
    },
    {
      title: '',
      message:
        'That is all for now! Go ahead and start making your first bouquet! Have fun!',
    },
  ];

  const current = tutorials[currentStep] || tutorials[0];
  const isLastStep = currentStep === 10;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
      onClick={() => onNextStep(currentStep + 1)}
    >
      {/* Bubble Container */}
      <div
        style={{
          background: '#F5F1E8',
          border: '4px solid #D4A574',
          borderRadius: '16px',
          padding: '32px 24px',
          maxWidth: '320px',
          width: '85%',
          textAlign: 'center',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        {current!.title && (
          <h2
            style={{
              margin: '0 0 16px 0',
              fontSize: '24px',
              color: '#333',
              fontWeight: 'bold',
            }}
          >
            {current!.title}
          </h2>
        )}

        {/* Message */}
        <p
          style={{
            margin: '0 0 24px 0',
            fontSize: '14px',
            lineHeight: '1.6',
            color: '#555',
          }}
        >
          {current!.message}
        </p>

        {/* Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <button
            onClick={onSkip}
            style={{
              padding: '10px 16px',
              background: 'transparent',
              border: '2px solid #D4A574',
              color: '#D4A574',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
          >
            Skip Tutorial
          </button>

          {/* Back Button - Only visible if not on first step */}
          {currentStep > 0 && (
            <button
              onClick={onPreviousStep}
              style={{
                padding: '10px 20px',
                background: '#D4A574',
                color: '#FFF',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold',
              }}
            >
              Back
            </button>
          )}

          <button
            onClick={() => onNextStep(currentStep + 1)}
            style={{
              padding: '10px 20px',
              background: '#D4A574',
              color: '#FFF',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
          >
            {isLastStep ? 'Done!' : 'Next'}
          </button>
        </div>

        {/* Step Indicator */}
        <div
          style={{
            marginTop: '16px',
            fontSize: '11px',
            color: '#999',
          }}
        >
          Step {currentStep + 1} of 11
        </div>
      </div>
    </div>
  );
}
