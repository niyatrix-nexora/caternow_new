import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SLIDES = [
  {
    emoji: '🍽️',
    title: 'Welcome Back!',
    subtitle: 'Find the best caterers and compare the best prices for your event.',
    bg: 'linear-gradient(135deg, rgba(255,107,0,0.12), rgba(255,140,66,0.06))',
  },
  {
    emoji: '📋',
    title: 'Create Event Request',
    subtitle: 'Share your event details, guest count, and budget. Get bids from nearby caterers instantly.',
    bg: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(167,139,250,0.06))',
  },
  {
    emoji: '💰',
    title: 'Compare & Save',
    subtitle: 'Compare bids from multiple vendors, negotiate, and book the best deal for your event.',
    bg: 'linear-gradient(135deg, rgba(5,150,105,0.12), rgba(16,185,129,0.06))',
  },
];

export default function Onboarding() {
  const [slide, setSlide] = useState(0);
  const navigate = useNavigate();

  const current = SLIDES[slide];
  const isLast = slide === SLIDES.length - 1;

  const handleNext = () => {
    if (isLast) {
      navigate('/', { replace: true });
    } else {
      setSlide((s) => s + 1);
    }
  };

  const handleSkip = () => {
    navigate('/', { replace: true });
  };

  return (
    <div className="app-container onboarding-screen">
      {/* Hero illustration area */}
      <div
        className="onboarding-hero"
        style={{ background: current.bg, transition: 'background 0.4s ease' }}
      >
        <div style={{ textAlign: 'center', animation: 'fadeInUp 0.4s ease' }} key={slide}>
          <div
            style={{
              fontSize: '5rem',
              marginBottom: '16px',
              filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.12))',
            }}
          >
            {current.emoji}
          </div>
          {/* Illustration placeholder — decorative food icons */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              opacity: 0.5,
              fontSize: '1.8rem',
            }}
          >
            <span>🥘</span>
            <span>🍛</span>
            <span>🎂</span>
            <span>🥗</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="onboarding-content">
        {/* Dots */}
        <div className="onboarding-dots">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className={`onboarding-dot ${i === slide ? 'active' : ''}`}
              onClick={() => setSlide(i)}
              style={{ cursor: 'pointer' }}
            />
          ))}
        </div>

        {/* Text */}
        <div
          key={slide}
          style={{ animation: 'fadeInUp 0.35s ease', marginBottom: '32px' }}
        >
          <h2
            style={{
              fontSize: '1.6rem',
              fontWeight: 800,
              marginBottom: '12px',
              lineHeight: 1.2,
            }}
          >
            {current.title}
          </h2>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.95rem',
              lineHeight: 1.6,
            }}
          >
            {current.subtitle}
          </p>
        </div>

        {/* Actions */}
        <button
          className="btn btn-primary btn-block btn-lg"
          onClick={handleNext}
          style={{ marginBottom: '12px' }}
        >
          {isLast ? 'Get Started →' : 'Next →'}
        </button>

        {!isLast && (
          <button
            className="btn btn-ghost btn-block"
            onClick={handleSkip}
            style={{ color: 'var(--text-muted)' }}
          >
            Skip
          </button>
        )}

        {/* Social login hint (decorative, matches design) */}
        {isLast && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginTop: '16px',
            }}
          >
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              or continue with
            </span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>
        )}
        {isLast && (
          <div
            style={{
              display: 'flex',
              gap: '12px',
              marginTop: '12px',
              justifyContent: 'center',
            }}
          >
            <button
              className="btn btn-secondary"
              style={{ flex: 1, gap: '8px' }}
              onClick={() => navigate('/')}
            >
              <span>G</span> Google
            </button>
            <button
              className="btn btn-secondary"
              style={{ flex: 1, gap: '8px' }}
              onClick={() => navigate('/')}
            >
              <span>f</span> Facebook
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
