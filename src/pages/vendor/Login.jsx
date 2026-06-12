import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../../utils/firebase';
import { sanitizePhone, isValidPhone } from '../../utils/security';
import { getVendor, getVendorByPhone } from '../../utils/data';

// Helper: create a fresh invisible reCAPTCHA verifier
function setupRecaptcha() {
  if (window.vendorRecaptchaVerifier) {
    try { window.vendorRecaptchaVerifier.clear(); } catch (_e) { /* ignore */ }
    window.vendorRecaptchaVerifier = null;
  }

  window.vendorRecaptchaVerifier = new RecaptchaVerifier(auth, 'vendor-recaptcha-container', {
    size: 'invisible',
    'expired-callback': () => {
      window.vendorRecaptchaVerifier = null;
    },
  });

  return window.vendorRecaptchaVerifier;
}

// Map Firebase error codes to friendly messages
function getFirebaseErrorMessage(err) {
  const code = err?.code || '';
  switch (code) {
    case 'auth/invalid-phone-number':
      return 'Invalid phone number format. Please check and try again.';
    case 'auth/too-many-requests':
      return 'Too many OTP requests. Please wait a few minutes and try again.';
    case 'auth/invalid-verification-code':
      return 'Invalid OTP. Please check and try again.';
    case 'auth/code-expired':
      return 'OTP has expired. Please request a new one.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    case 'auth/internal-error':
      return 'Firebase Phone Auth may not be enabled. Please enable it in Firebase Console → Authentication → Sign-in method → Phone.';
    case 'auth/captcha-check-failed':
      return 'reCAPTCHA verification failed. Please try again.';
    case 'auth/quota-exceeded':
      return 'SMS quota exceeded. Please try again later.';
    default:
      return err?.message || 'Something went wrong. Please try again.';
  }
}

export default function VendorLogin() {
  const [step, setStep] = useState('phone'); // phone | otp
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const otpRefs = useRef([]);
  const navigate = useNavigate();
  const { login } = useApp();

  // Countdown timer for resend OTP
  useEffect(() => {
    if (otpTimer <= 0) return;
    const interval = setInterval(() => {
      setOtpTimer((t) => (t <= 1 ? 0 : t - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toastVisible) return;
    const timer = setTimeout(() => {
      setToastVisible(false);
    }, 6000);
    return () => clearTimeout(timer);
  }, [toastVisible]);

  // Cleanup reCAPTCHA on unmount
  useEffect(() => {
    return () => {
      if (window.vendorRecaptchaVerifier) {
        try { window.vendorRecaptchaVerifier.clear(); } catch (_e) { /* ignore */ }
        window.vendorRecaptchaVerifier = null;
      }
    };
  }, []);

  const showToast = useCallback((message) => {
    setToastMessage(message);
    setToastVisible(true);
  }, []);

  // Send OTP via Firebase
  const handleSendOtp = useCallback(async (cleanPhone) => {
    setLoading(true);
    setError('');

    try {
      const appVerifier = setupRecaptcha();

      const confirmationResult = await signInWithPhoneNumber(
        auth,
        `+91${cleanPhone}`,
        appVerifier
      );

      window.confirmationResult = confirmationResult;

      setOtp(['', '', '', '', '', '']);
      setOtpTimer(30);
      showToast('OTP sent to your mobile number.');
      setLoading(false);
      return true;
    } catch (err) {
      console.error('Send OTP error:', err);
      if (window.vendorRecaptchaVerifier) {
        try { window.vendorRecaptchaVerifier.clear(); } catch (_e) { /* ignore */ }
        window.vendorRecaptchaVerifier = null;
      }
      setError(getFirebaseErrorMessage(err));
      setLoading(false);
      return false;
    }
  }, [showToast]);

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    const clean = sanitizePhone(phone);

    if (!isValidPhone(clean)) {
      setError('Please enter a valid 10-digit Indian mobile number (starts with 6-9). Repeating or sequential numbers are not allowed.');
      return;
    }

    setPhone(clean);
    setError('');

    const sent = await handleSendOtp(clean);
    if (sent) {
      setStep('otp');
    }
  };

  const handleResendOtp = async () => {
    if (otpTimer > 0) return;
    const clean = sanitizePhone(phone);
    await handleSendOtp(clean);
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const digits = pasted.split('');
      setOtp(digits);
      otpRefs.current[5]?.focus();
    }
  };

  // Verify OTP via Firebase
  const handleOtpSubmit = async (e) => {
    e.preventDefault();

    const code = otp.join('');
    if (code.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    const clean = sanitizePhone(phone);

    try {
      if (!window.confirmationResult) {
        setError('OTP session expired. Please request a new OTP.');
        setLoading(false);
        return;
      }

      const result = await window.confirmationResult.confirm(code);
      const firebaseUser = result.user;

      console.log('Firebase auth success — UID:', firebaseUser.uid);

      const vendor = await getVendorByPhone(clean) || await getVendor(`v_${clean}`) || await getVendor(firebaseUser.uid);
      if (vendor) {
        login({ ...vendor, role: 'vendor', firebaseUid: firebaseUser.uid });
        navigate('/vendor');
      } else {
        navigate('/vendor/register', { state: { phone: clean, firebaseUid: firebaseUser.uid } });
      }
    } catch (err) {
      console.error('Verify OTP error:', err);
      setError(getFirebaseErrorMessage(err));
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleChangeNumber = () => {
    setStep('phone');
    setOtp(['', '', '', '', '', '']);
    setError('');
    setOtpTimer(0);
    window.confirmationResult = null;
  };

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh', padding: '24px' }}>
      {/* Firebase reCAPTCHA container (invisible) */}
      <div id="vendor-recaptcha-container"></div>

      {toastVisible && (
        <div
          className="animate-slide-in"
          style={{
            position: 'fixed',
            top: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            maxWidth: '420px',
            width: 'calc(100% - 32px)',
            padding: '14px 20px',
            background: 'linear-gradient(135deg, #1a2a1a, #1a3a1a)',
            border: '1px solid rgba(5, 150, 105, 0.4)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--success)',
            fontSize: '0.85rem',
            fontWeight: 600,
            textAlign: 'center',
            zIndex: 200,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          {toastMessage}
        </div>
      )}

      <div className="text-center" style={{ marginBottom: '48px' }}>
        <div className="logo" style={{ justifyContent: 'center', marginBottom: '8px' }}>
          <span className="logo-icon">👨‍🍳</span>
          <span className="logo-text">CaterNow Vendor</span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Partner with us and grow your business
        </p>
      </div>

      {step === 'phone' && (
        <form onSubmit={handlePhoneSubmit} className="animate-fade-in">
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>Vendor Portal 🚀</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '0.9rem' }}>
            Enter your business number to access your dashboard
          </p>

          <div className="form-group">
            <label className="form-label" htmlFor="phone-input">Mobile Number</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{
                padding: '14px 12px',
                background: 'var(--bg-input)',
                border: '1.5px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-secondary)',
                fontWeight: 600,
              }}>+91</div>
              <input
                id="phone-input"
                type="tel"
                className="form-input"
                placeholder="10-digit number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                autoFocus
                aria-label="10-digit mobile number"
              />
            </div>
          </div>

          {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '16px' }}>{error}</p>}

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? 'Sending OTP...' : 'Send OTP →'}
          </button>

          <p className="text-center mt-lg" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Looking for catering? <Link to="/" style={{ color: 'var(--primary)', fontWeight: 600 }}>Login as Customer</Link>
          </p>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleOtpSubmit} className="animate-fade-in">
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>Verify OTP 🔐</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.9rem' }}>
            We sent a code to <strong>+91 {phone}</strong>
          </p>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '8px 12px',
            background: 'rgba(37, 99, 235, 0.08)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '16px',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
          }}>
            <span>🛡️ Enter the 6-digit OTP sent to your phone</span>
          </div>

          <div className="otp-inputs" onPaste={handleOtpPaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (otpRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                className="otp-input"
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                autoFocus={i === 0}
                maxLength={1}
                disabled={loading}
              />
            ))}
          </div>

          {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '16px', textAlign: 'center' }}>{error}</p>}

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify & Continue →'}
          </button>

          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button type="button" className="btn btn-secondary btn-block" onClick={handleChangeNumber} disabled={loading}>
              ← Back
            </button>
            <button
              type="button"
              className={`btn btn-block ${otpTimer > 0 ? 'btn-secondary' : 'btn-primary'}`}
              onClick={handleResendOtp}
              disabled={otpTimer > 0 || loading}
            >
              {otpTimer > 0 ? `Resend (${otpTimer}s)` : '🔄 Resend OTP'}
            </button>
          </div>
        </form>
      )}

    </div>
  );
}
