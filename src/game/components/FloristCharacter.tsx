import { useState, useEffect } from 'react';

const GREETINGS = [
  'Welcome back to Bloomy! ✨',
  'Ready to create some beautiful bouquets? 🌸',
  'Your shop is looking lovely today!',
  'So many happy customers are waiting! 💐',
  'Another wonderful day at the shop!',
];

export function FloristCharacter() {
  const [greeting, setGreeting] = useState(GREETINGS[0]);

  useEffect(() => {
    // Change greeting every 5 seconds
    const interval = setInterval(() => {
      const random = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
      setGreeting(random);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '16px',
        padding: '12px',
        background: 'rgba(255,255,255,0.3)',
        borderRadius: '8px',
      }}
    >
      {/* Character sprite placeholder - using emoji for now */}
      <div
        style={{
          fontSize: '48px',
          width: '80px',
          height: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255,255,255,0.5)',
          borderRadius: '8px',
        }}
      >
        🌸
      </div>

      {/* Greeting speech bubble */}
      <div
        style={{
          background: 'rgba(255,255,255,0.6)',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '14px',
          textAlign: 'center',
          minHeight: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#2A1408',
          maxWidth: '90%',
        }}
      >
        {greeting}
      </div>
    </div>
  );
}
