import { useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

export default function VendorBookings() {
  const { user, requests, bids } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'vendor') navigate('/');
  }, [user, navigate]);

  // Find all bids by this vendor that are 'accepted'
  const myAcceptedBids = bids.filter(b => b.vendorId === user.id && b.status === 'accepted');

  // Map those bids to their corresponding requests
  const bookings = myAcceptedBids.map(bid => {
    const req = requests.find(r => r.id === bid.requestId);
    return { bid, request: req };
  }).filter(b => b.request); // Ensure request exists

  // Sort by event date (closest first)
  bookings.sort((a, b) => new Date(a.request.eventDate) - new Date(b.request.eventDate));

  return (
    <div className="app-container">
      <div className="page-header">
        <h1>Confirmed Bookings</h1>
      </div>

      <div className="page" style={{ paddingBottom: '80px' }}>
        {bookings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <h3>No Confirmed Bookings Yet</h3>
            <p>Your confirmed catering orders will appear here once customers accept your bids.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {bookings.map(({ bid, request }) => {
              const eventDate = new Date(request.eventDate);
              const isPast = eventDate < new Date();

              return (
                <div key={bid.id} className="card" onClick={() => navigate(`/vendor/request/${request.id}`)} style={{ cursor: 'pointer', opacity: isPast ? 0.7 : 1 }}>
                  <div className="card-header">
                    <span className="card-title">{request.eventName || 'Catering Order'}</span>
                    <span className="badge badge-success">Confirmed</span>
                  </div>
                  
                  <div className="card-meta" style={{ marginTop: '12px' }}>
                    <div className="card-meta-item">
                      <span className="icon">📅</span>
                      <span>{eventDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <div className="card-meta-item">
                      <span className="icon">🍽️</span>
                      <span>{request.plates} plates · {request.foodType === 'veg' ? 'Veg' : request.foodType === 'nonveg' ? 'Non-Veg' : 'Veg + Non-Veg'}</span>
                    </div>
                    <div className="card-meta-item">
                      <span className="icon">💰</span>
                      <span style={{ color: 'var(--success)', fontWeight: '700' }}>Total ₹{bid.totalPrice?.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {request.customerPhone ? '📞 Contact Customer' : 'View Details'}
                    </span>
                    <span style={{ color: 'var(--primary-light)', fontSize: '1.2rem' }}>→</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bottom-nav">
        <NavLink to="/vendor" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
          <span className="nav-icon">🏠</span>
          <span>Home</span>
        </NavLink>
        <NavLink to="/vendor/requests" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">📥</span>
          <span>Requests</span>
        </NavLink>
        <NavLink to="/vendor/bookings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">📅</span>
          <span>Bookings</span>
        </NavLink>
        <NavLink to="/vendor/earnings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">💰</span>
          <span>Earnings</span>
        </NavLink>
        <NavLink to="/vendor/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">☰</span>
          <span>More</span>
        </NavLink>
      </div>
    </div>
  );
}
