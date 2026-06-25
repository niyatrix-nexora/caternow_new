import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { acceptBid } from '../../utils/data';
import { Smartphone, CreditCard, Landmark, Lock } from 'lucide-react';

export default function Payment() {
  const { id } = useParams(); // bidId
  const navigate = useNavigate();
  const { user, bids, requests, refresh } = useApp();
  
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'customer') navigate('/');
  }, [user, navigate]);

  const bid = bids.find(b => b.id === id);
  const request = requests.find(r => r.id === bid?.requestId);

  if (!bid || !request) return <div className="app-container"><div className="page-header"><h1>Loading...</h1></div></div>;

  const handlePayment = async () => {
    setProcessing(true);
    
    // Simulate payment processing delay
    setTimeout(async () => {
      // Upon successful payment, accept the bid
      const success = await acceptBid(bid.id);
      if (success) {
        await refresh();
        // Redirect to event tracking / booking confirmation
        navigate(`/customer/tracking/${request.id}`);
      } else {
        alert('Failed to process booking.');
        setProcessing(false);
      }
    }, 2000);
  };

  return (
    <div className="app-container">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button className="back-btn" onClick={() => navigate(-1)}>{'<'}</button>
        <h1>Payment</h1>
      </div>

      <div className="page" style={{ paddingBottom: '80px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>Total Amount</p>
          <h2 style={{ fontSize: '2.5rem', margin: 0 }}>₹{bid.totalPrice?.toLocaleString('en-IN')}</h2>
        </div>

        <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Choose Payment Method</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
          {/* UPI */}
          <div 
            onClick={() => setPaymentMethod('upi')}
            style={{ 
              padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px',
              border: paymentMethod === 'upi' ? '2px solid var(--primary)' : '1px solid var(--border)',
              background: 'white', cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Smartphone size={24} style={{ color: 'var(--primary)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600' }}>UPI</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Google Pay, PhonePe, Paytm</div>
            </div>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid', borderColor: paymentMethod === 'upi' ? 'var(--primary)' : 'var(--border)', background: paymentMethod === 'upi' ? 'var(--primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {paymentMethod === 'upi' && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'white' }} />}
            </div>
          </div>

          {/* Card */}
          <div 
            onClick={() => setPaymentMethod('card')}
            style={{ 
              padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px',
              border: paymentMethod === 'card' ? '2px solid var(--primary)' : '1px solid var(--border)',
              background: 'white', cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={24} style={{ color: 'var(--primary)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600' }}>Credit / Debit Card</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Visa, Mastercard, RuPay</div>
            </div>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid', borderColor: paymentMethod === 'card' ? 'var(--primary)' : 'var(--border)', background: paymentMethod === 'card' ? 'var(--primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {paymentMethod === 'card' && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'white' }} />}
            </div>
          </div>

          {/* Net Banking */}
          <div 
            onClick={() => setPaymentMethod('netbanking')}
            style={{ 
              padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px',
              border: paymentMethod === 'netbanking' ? '2px solid var(--primary)' : '1px solid var(--border)',
              background: 'white', cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Landmark size={24} style={{ color: 'var(--primary)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600' }}>Net Banking</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>All major banks</div>
            </div>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid', borderColor: paymentMethod === 'netbanking' ? 'var(--primary)' : 'var(--border)', background: paymentMethod === 'netbanking' ? 'var(--primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {paymentMethod === 'netbanking' && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'white' }} />}
            </div>
          </div>
        </div>

        <button 
          className="btn btn-primary btn-block" 
          onClick={handlePayment}
          disabled={processing}
          style={{ height: '56px', fontSize: '1.1rem' }}
        >
          {processing ? 'Processing Secure Payment...' : `Pay ₹${bid.totalPrice?.toLocaleString('en-IN')}`}
        </button>
        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <Lock size={14} style={{ color: 'var(--text-muted)' }} /> 100% Secure Payment
        </div>
      </div>
    </div>
  );
}
