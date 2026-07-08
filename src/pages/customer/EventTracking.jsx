import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { getRequest, getBidsForRequest, getVendor, subscribeToRequest } from '../../utils/data';
import { Calendar, Phone, Check, ArrowLeft } from 'lucide-react';

const TRACKING_STEPS = [
  { id: 'confirmed', label: 'Order Confirmed', timeOffset: 0 },
  { id: 'preparing', label: 'Preparing', timeOffset: 30 },
  { id: 'cooking', label: 'Cooking in Progress', timeOffset: 120 },
  { id: 'on_the_way', label: 'On the Way', timeOffset: 240 },
  { id: 'delivered', label: 'Delivered', timeOffset: 300 }
];

export default function EventTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, requests, vendors, bids } = useApp();
  
  const [request, setRequest] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [bid, setBid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'customer') navigate('/');
  }, [user, navigate]);

  useEffect(() => {
    let isMounted = true;
    let unsubRequest = () => {};

    async function loadTrackingData() {
      try {
        setLoading(true);
        setError('');

        // 1. Find or fetch request
        let req = requests.find(r => r.id === id);
        if (!req) {
          req = await getRequest(id);
        }
        if (!isMounted) return;

        if (!req) {
          setError('Order request not found.');
          setLoading(false);
          return;
        }
        setRequest(req);

        // Subscribe to real-time updates for this request
        unsubRequest = subscribeToRequest(id, (updated) => {
          if (isMounted) {
            setRequest(updated);
          }
        });

        // 2. Find or fetch confirmed bid
        let confirmedBid = bids.find(b => b.id === req.confirmedBidId) || 
                           bids.find(b => b.requestId === req.id && b.status === 'accepted');
        if (!confirmedBid) {
          const reqBids = await getBidsForRequest(id);
          confirmedBid = reqBids.find(b => b.id === req.confirmedBidId) || 
                         reqBids.find(b => b.status === 'accepted');
        }
        
        if (!isMounted) return;

        if (!confirmedBid) {
          setLoading(false);
          return;
        }
        setBid(confirmedBid);

        // 3. Find or fetch vendor
        let v = vendors.find(vendor => vendor.id === confirmedBid.vendorId);
        if (!v) {
          v = await getVendor(confirmedBid.vendorId);
        }
        
        if (!isMounted) return;

        if (!v) {
          setError('Vendor details not found.');
          setLoading(false);
          return;
        }
        setVendor(v);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load tracking data:', err);
        if (isMounted) {
          setError('Failed to load tracking details. Please try again.');
          setLoading(false);
        }
      }
    }

    loadTrackingData();

    return () => {
      isMounted = false;
      unsubRequest();
    };
  }, [id, requests, bids, vendors]);

  if (loading) {
    return (
      <div className="app-container">
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={20} />
          </button>
          <h1>Event Tracking</h1>
        </div>
        <div className="page" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div className="loading-spinner" />
          <p style={{ marginTop: '20px', color: 'var(--text-muted)' }}>Loading tracking details...</p>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="app-container">
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={20} />
          </button>
          <h1>Event Tracking</h1>
        </div>
        <div className="page" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ color: 'var(--danger)', fontSize: '2rem', marginBottom: '12px' }}>⚠️</div>
          <h3>Error</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>{error || 'Request not found'}</p>
          <button className="btn btn-primary" onClick={() => navigate('/customer')}>
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (!bid || !vendor) {
    return (
      <div className="app-container">
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={20} />
          </button>
          <h1>Event Tracking</h1>
        </div>
        <div className="page" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ color: 'var(--primary)', fontSize: '2.5rem', marginBottom: '16px' }}>⏳</div>
          <h3>Order Confirmed but Pending Setup</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>
            Tracking status is only available once a vendor's bid is accepted and confirmed. If you just completed payment, please wait a moment.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/customer')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Determine current step based on request trackingStatus or default to 'confirmed'
  const currentStatusId = request.trackingStatus || 'confirmed';
  const currentIndex = TRACKING_STEPS.findIndex(s => s.id === currentStatusId);

  // Format date helper
  const eventDateObj = new Date(request.eventDate || new Date());
  const formattedDate = eventDateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  // Calculate actual timestamps if available
  const confirmedTime = request.confirmedAt || request.createdAt;
  const statusUpdatedTime = request.trackingStatusUpdatedAt;

  const getStepTime = (step, idx) => {
    // If the step is confirmed, return the time the request was confirmed
    if (step.id === 'confirmed' && confirmedTime) {
      return new Date(confirmedTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    }
    // If the step is the current one, return the update time if available, or current time
    if (idx === currentIndex && statusUpdatedTime) {
      return new Date(statusUpdatedTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    }
    // Otherwise, calculate relative simulated time based on confirmed time for completed ones
    if (idx < currentIndex && confirmedTime) {
      const baseTime = new Date(confirmedTime);
      const stepTime = new Date(baseTime.getTime() + step.timeOffset * 60000);
      return stepTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    }
    return null;
  };

  const progressPercent = Math.round(((currentIndex + 1) / TRACKING_STEPS.length) * 100);

  return (
    <div className="app-container">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={20} />
        </button>
        <h1>Event Tracking</h1>
      </div>

      <div className="page">
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '8px', fontSize: '1.1rem' }}>{request.eventName || 'Catering Order'}</h3>
          <p style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
            <Calendar size={14} style={{ color: 'var(--primary)' }} /> {formattedDate}
          </p>

          <div className="vendor-info" style={{ background: 'var(--surface-light)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
            <div className="vendor-avatar" style={{ background: 'linear-gradient(135deg,#E8590C,#7C3AED)' }}>
              {vendor.name.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <div className="vendor-name">{vendor.name}</div>
              <div className="vendor-distance">
                <span className="distance-badge">Vendor</span>
              </div>
            </div>
            <div>
              <a href={`tel:${vendor.phone}`} className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', textDecoration: 'none' }}>
                <Phone size={12} /> Call
              </a>
            </div>
          </div>
        </div>

        {/* Dynamic progress bar */}
        <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Overall Progress</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--primary)' }}>{progressPercent}%</span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.4s ease' }} />
          </div>
        </div>

        <div className="card" style={{ padding: '24px 20px' }}>
          <h3 style={{ marginBottom: '24px', fontSize: '1rem' }}>Tracking Status</h3>
          
          <div className="tracking-timeline">
            {TRACKING_STEPS.map((step, idx) => {
              const isCompleted = idx <= currentIndex;
              const isCurrent = idx === currentIndex;
              const isLast = idx === TRACKING_STEPS.length - 1;
              
              const stepTimeStr = getStepTime(step, idx);

              return (
                <div key={step.id} style={{ display: 'flex', marginBottom: isLast ? 0 : '24px', position: 'relative' }}>
                  {/* Line connecting steps */}
                  {!isLast && (
                    <div style={{
                      position: 'absolute',
                      left: '11px',
                      top: '24px',
                      bottom: '-24px',
                      width: '2px',
                      background: isCompleted && idx < currentIndex ? 'var(--success)' : 'var(--border)',
                      zIndex: 1
                    }} />
                  )}
                  
                  {/* Icon dot */}
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: isCompleted ? 'var(--success)' : 'var(--bg-elevated)',
                    border: `2px solid ${isCompleted ? 'var(--success)' : 'var(--border)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '12px',
                    zIndex: 2,
                    marginRight: '16px',
                    flexShrink: 0,
                    boxShadow: isCurrent ? '0 0 0 4px rgba(232, 89, 12, 0.2)' : 'none'
                  }}>
                    {isCompleted ? <Check size={12} strokeWidth={3} /> : <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)' }} />}
                  </div>
                  
                  {/* Content */}
                  <div style={{ flex: 1, marginTop: '2px' }}>
                    <div style={{ 
                      fontSize: '0.95rem', 
                      fontWeight: isCurrent ? '700' : (isCompleted ? '600' : '400'),
                      color: isCurrent ? 'var(--text)' : (isCompleted ? 'var(--text-secondary)' : 'var(--text-muted)')
                    }}>
                      {step.label}
                    </div>
                  </div>
                  
                  {/* Time */}
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: isCompleted ? 'var(--text-secondary)' : 'var(--text-muted)',
                    marginTop: '4px'
                  }}>
                    {isCompleted ? (stepTimeStr || 'Done') : '--:--'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
