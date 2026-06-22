import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { getRequest, getBidsForRequest, getVendor } from '../../utils/data';

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

  useEffect(() => {
    if (!user || user.role !== 'customer') navigate('/');
  }, [user, navigate]);

  useEffect(() => {
    let isMounted = true;

    async function loadTrackingData() {
      try {
        // 1. Find or fetch request
        let req = requests.find(r => r.id === id);
        if (!req) {
          req = await getRequest(id);
        }
        if (!isMounted || !req) return;
        setRequest(req);

        // 2. Find or fetch confirmed bid
        let confirmedBid = bids.find(b => b.id === req.confirmedBidId) || 
                           bids.find(b => b.requestId === req.id && b.status === 'accepted');
        if (!confirmedBid) {
          const reqBids = await getBidsForRequest(id);
          confirmedBid = reqBids.find(b => b.id === req.confirmedBidId) || 
                         reqBids.find(b => b.status === 'accepted');
        }
        if (!isMounted || !confirmedBid) return;
        setBid(confirmedBid);

        // 3. Find or fetch vendor
        let v = vendors.find(vendor => vendor.id === confirmedBid.vendorId);
        if (!v) {
          v = await getVendor(confirmedBid.vendorId);
        }
        if (!isMounted || !v) return;
        setVendor(v);
      } catch (err) {
        console.error('Failed to load tracking data:', err);
      }
    }

    loadTrackingData();

    return () => {
      isMounted = false;
    };
  }, [id, requests, bids, vendors]);

  if (!request || !bid || !vendor) {
    return (
      <div className="app-container">
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate(-1)}>←</button>
          <h1>Event Tracking</h1>
        </div>
        <div className="page" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div className="loading-spinner" />
          <p style={{ marginTop: '20px', color: 'var(--text-muted)' }}>Loading tracking details...</p>
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

  return (
    <div className="app-container">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <h1>Event Tracking</h1>
      </div>

      <div className="page">
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '8px', fontSize: '1.1rem' }}>{request.eventName || 'Catering Order'}</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
            📅 {formattedDate}
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
              <a href={`tel:${vendor.phone}`} className="btn btn-primary btn-sm" style={{ padding: '6px 12px', textDecoration: 'none' }}>📞 Call</a>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '24px 20px' }}>
          <h3 style={{ marginBottom: '24px', fontSize: '1rem' }}>Tracking Status</h3>
          
          <div className="tracking-timeline">
            {TRACKING_STEPS.map((step, idx) => {
              const isCompleted = idx <= currentIndex;
              const isCurrent = idx === currentIndex;
              const isLast = idx === TRACKING_STEPS.length - 1;
              
              // Calculate a simulated time based on event date minus some offset
              // For a real app, this would be actual timestamps stored in DB
              const time = new Date(eventDateObj.getTime() - (300 - step.timeOffset) * 60000);
              const timeStr = time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

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
                    background: isCompleted ? 'var(--success)' : 'var(--surface)',
                    border: `2px solid ${isCompleted ? 'var(--success)' : 'var(--border)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '12px',
                    zIndex: 2,
                    marginRight: '16px',
                    flexShrink: 0
                  }}>
                    {isCompleted && '✓'}
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
                    {isCompleted ? timeStr : '--:--'}
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
