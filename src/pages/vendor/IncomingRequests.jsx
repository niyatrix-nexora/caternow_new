import { useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Package, Inbox, Home, Calendar, IndianRupee, Menu } from 'lucide-react';

export default function IncomingRequests() {
  const { user, requests, bids, loading } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'vendor') navigate('/');
  }, [user, navigate]);

  const newRequests = requests.filter(req => {
    if (req.status !== 'searching' && req.status !== 'bidding') return false;
    const existingBid = bids.find(b => b.vendorId === user.id && b.requestId === req.id);
    return !existingBid;
  });

  return (
    <div className="app-container">
      <div className="page-header">
        <h1>Incoming Requests</h1>
      </div>

      <div className="page" style={{ paddingBottom: '80px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button className="btn btn-sm" style={{ background: 'var(--primary)', color: 'white' }} onClick={() => alert('Filter: All Requests')}>All ({newRequests.length})</button>
          <button className="btn btn-secondary btn-sm" onClick={() => alert('Filter: New Requests')}>New</button>
          <button className="btn btn-secondary btn-sm" onClick={() => alert('Filter: Viewed Requests')}>Viewed</button>
        </div>

        {loading ? (
          <div className="loading-spinner" style={{ margin: '40px auto' }}></div>
        ) : newRequests.length > 0 ? (
          newRequests.map((req, i) => (
            <div
              key={req.id}
              className="card"
              style={{ cursor: 'pointer', marginBottom: '12px', animationDelay: `${i * 0.05}s` }}
              onClick={() => navigate(`/vendor/request/${req.id}`)}
            >
              <div className="card-header">
                <span className="card-title">{req.eventName || 'Catering Order'} #{req.id?.split('_')[1]?.slice(-4)}</span>
                <span className="distance-badge">{req.distance?.toFixed(1)} km</span>
              </div>
              <div className="card-meta">
                <div className="card-meta-item">
                  <span className="icon">#</span>
                  <span>{req.plates} plates</span>
                  <span className={`badge ${req.foodType === 'veg' ? 'badge-veg' : req.foodType === 'nonveg' ? 'badge-nonveg' : 'badge-both'}`} style={{ marginLeft: '8px' }}>
                    {req.foodType === 'veg' ? 'Veg' : req.foodType === 'nonveg' ? 'Non-Veg' : 'Both'}
                  </span>
                </div>
                {req.packageType && (
                  <div className="card-meta-item" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="icon" style={{ display: 'flex', alignItems: 'center' }}><Package size={14} /></span>
                    <span style={{ color: 'var(--success)', fontWeight: '700' }}>Package: {req.packageType}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
              <Inbox size={40} style={{ color: 'var(--text-muted)' }} />
            </div>
            <h3>No new requests</h3>
            <p>You have responded to all available requests.</p>
          </div>
        )}
      </div>

      <div className="bottom-nav">
        <NavLink to="/vendor" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
          <Home size={20} className="nav-icon" />
          <span>Home</span>
        </NavLink>
        <NavLink to="/vendor/requests" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Inbox size={20} className="nav-icon" />
          <span>Requests</span>
        </NavLink>
        <NavLink to="/vendor/bookings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Calendar size={20} className="nav-icon" />
          <span>Bookings</span>
        </NavLink>
        <NavLink to="/vendor/earnings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <IndianRupee size={20} className="nav-icon" />
          <span>Earnings</span>
        </NavLink>
        <NavLink to="/vendor/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Menu size={20} className="nav-icon" />
          <span>More</span>
        </NavLink>
      </div>
    </div>
  );
}
