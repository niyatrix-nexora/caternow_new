import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Splash() {
  const navigate = useNavigate();
  const { user } = useApp();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (user) {
        navigate(user.role === 'vendor' ? '/vendor' : '/customer', { replace: true });
      } else {
        navigate('/onboarding', { replace: true });
      }
    }, 2200);
    return () => clearTimeout(timer);
  }, [user, navigate]);

  return (
    <div
      className="app-container splash-screen"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        background: 'linear-gradient(160deg, #1E1E1E 0%, #2D1A0E 60%, #3D2010 100%)',
      }}
    >
      {/* Logo */}
      <div style={{ textAlign: 'center', animation: 'fadeInUp 0.6s ease' }}>
        <div
          style={{
            width: '88px',
            height: '88px',
            borderRadius: '28px',
            background: 'linear-gradient(135deg, #FF6B00, #FF8C42)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.8rem',
            margin: '0 auto 20px',
            boxShadow: '0 20px 60px rgba(255,107,0,0.4)',
          }}
        >
          🍽️
        </div>
        <h1
          style={{
            fontSize: '2.4rem',
            fontWeight: 900,
            color: '#fff',
            letterSpacing: '-0.5px',
            marginBottom: '8px',
          }}
        >
          CaterNow
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '1rem', fontWeight: 400 }}>
          Best Catering, Best Price
        </p>
      </div>

      {/* Tagline */}
      <p
        style={{
          color: 'rgba(255,255,255,0.45)',
          fontSize: '0.82rem',
          marginTop: '40px',
          animation: 'fadeIn 1.2s ease 0.8s both',
        }}
      >
        Find the best caterers and compare the best prices for your event
      </p>

      {/* Loading dots */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          marginTop: '16px',
          animation: 'fadeIn 0.8s ease 1s both',
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'rgba(255,107,0,0.7)',
              animation: `pulse 1.2s ease ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
