import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { createCustomer } from '../../utils/data';
import { sanitizeText } from '../../utils/security';
import { User, Check } from 'lucide-react';

export default function CustomerRegister() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useApp();
  
  const phone = location.state?.phone;

  useEffect(() => {
    if (!phone) {
      navigate('/');
    }
  }, [phone, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setLoading(true);
    setError('');

    const customerData = {
      id: location.state?.firebaseUid,
      phone,
      name: sanitizeText(name, 60),
      email: sanitizeText(email, 100),
    };

    const newCustomer = await createCustomer(customerData);
    
    if (newCustomer) {
      login({ ...newCustomer, role: 'customer' });
      navigate('/customer/new-request');
    } else {
      setError('Unable to link your account. Please check your internet and try once more.');
    }
    setLoading(false);
  };

  if (!phone) return null;

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh', padding: '24px' }}>
      <div className="text-center" style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          Complete Registration <User size={24} style={{ color: 'var(--primary)' }} />
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Secure your account and personalize your experience.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="animate-fade-in card" style={{ padding: '24px' }}>
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label className="form-label" style={{ fontSize: '0.85rem' }}>Verified Phone</label>
          <input
            className="form-input"
            value={`+91 ${phone}`}
            disabled
            style={{ opacity: 0.7, background: 'var(--bg-card)' }}
          />
          <p style={{ fontSize: '0.7rem', color: 'var(--success)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Check size={12} strokeWidth={3} /> Secured and verified
          </p>
        </div>

        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label className="form-label" style={{ fontSize: '0.85rem' }}>Full Name *</label>
          <input
            className="form-input"
            placeholder="e.g. Rahul Sharma"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        <div className="form-group" style={{ marginBottom: '24px' }}>
          <label className="form-label" style={{ fontSize: '0.85rem' }}>Email Address (Optional)</label>
          <input
            type="email"
            className="form-input"
            placeholder="For order receipts"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '16px', textAlign: 'center' }}>{error}</p>}

        <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
          {loading ? 'Securing Account...' : 'Create Account →'}
        </button>
      </form>
    </div>
  );
}
