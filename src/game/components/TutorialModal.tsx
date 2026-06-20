interface TutorialModalProps {
  isOpen: boolean;
  currentStep: number;
  onNextStep: (step: number) => void;
  onSkip: () => void;
}

export function TutorialModal({
  isOpen,
  currentStep,
  onNextStep,
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
        'You will also be able to fulfill customer orders and earn Petal Coins to buy more flowers from the shop!',
    },
    {
      title: '',
      message:
        'Fulfill orders, create bouquets and sell them to customers. Each bouquet sold gets you closer to leveling up to unlock rewards and higher tier bouquets!',
    },
    {
      title: '📱 Explore the tabs below!',
      message: 'Explore the tabs below at the bottom of the screen!',
    },
    {
      title: '📦 Inventory',
      message:
        'Inventory is where you keep all the flowers and bouquets that you acquire in the game.',
    },
    {
      title: '📋 Orders',
      message: 'Orders is where customer orders are located.',
    },
    {
      title: '🎨 Arrange',
      message: 'Arrange is where you can create beautiful bouquets.',
    },
    {
      title: '🏪 Shop',
      message:
        'Shop is where you can buy flowers to create bouquets and is also where you will find the Premium Shop.',
    },
    {
      title: '⚙️ Settings',
      message:
        'Settings is where you can adjust the music volume and where you can reset the game.',
    },
    {
      title: 'Have fun!',
      message: '',
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
        {/* Skip Button */}
        <button
          onClick={onSkip}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'transparent',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          ✕
        </button>

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
            gap: '12px',
            justifyContent: 'center',
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
