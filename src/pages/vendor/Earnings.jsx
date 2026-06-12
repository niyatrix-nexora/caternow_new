import { useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

export default function VendorEarnings() {
  const { user, requests, bids } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'vendor') navigate('/');
  }, [user, navigate]);

  // Find all bids by this vendor that are 'accepted' (meaning successful booking)
  const myAcceptedBids = bids.filter(b => b.vendorId === user.id && b.status === 'accepted');

  // Calculate earnings
  const totalEarnings = myAcceptedBids.reduce((sum, bid) => sum + (bid.totalPrice || 0), 0);
  
  // Calculate this month's earnings
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const thisMonthEarnings = myAcceptedBids.reduce((sum, bid) => {
    const req = requests.find(r => r.id === bid.requestId);
    if (req) {
      const eventDate = new Date(req.eventDate);
      if (eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear) {
        return sum + (bid.totalPrice || 0);
      }
    }
    return sum;
  }, 0);

  const pendingPayments = myAcceptedBids.length > 0 ? myAcceptedBids.reduce((sum, bid) => sum + (bid.totalPrice || 0) * 0.2, 0) : 0; // Simulated pending 20%

  return (
    <div className="app-container">
      <div className="page-header">
        <h1>Earnings Dashboard</h1>
      </div>

      <div className="page" style={{ paddingBottom: '80px' }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, #111827, #374151)', color: 'white', border: 'none', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.85rem', color: '#9CA3AF', marginBottom: '4px' }}>Total Earnings</p>
              <h2 style={{ fontSize: '2rem', margin: 0 }}>₹{totalEarnings.toLocaleString('en-IN')}</h2>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.7rem', color: '#9CA3AF', marginBottom: '2px', textTransform: 'uppercase' }}>This Month</p>
              <p style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0, color: 'var(--success)' }}>+₹{thisMonthEarnings.toLocaleString('en-IN')}</p>
            </div>
          </div>
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: '#9CA3AF', marginBottom: '2px' }}>Total Bookings</p>
              <p style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0 }}>{myAcceptedBids.length}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.75rem', color: '#9CA3AF', marginBottom: '2px' }}>Pending Payments</p>
              <p style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0, color: 'var(--warning)' }}>₹{pendingPayments.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>

        <h3 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>Recent Transactions</h3>
        
        {myAcceptedBids.length === 0 ? (
          <div className="empty-state" style={{ padding: '20px' }}>
            <p style={{ margin: 0 }}>No transactions yet. Complete bookings to earn!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {myAcceptedBids.slice(0, 5).map(bid => {
              const req = requests.find(r => r.id === bid.requestId);
              if (!req) return null;
              
              return (
                <div key={bid.id} className="card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.95rem', marginBottom: '4px' }}>{req.eventName || 'Order'} #{req.id.split('_')[1].slice(-4)}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(req.eventDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '700', color: 'var(--success)', fontSize: '1.05rem' }}>
                      +₹{bid.totalPrice?.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Completed</div>
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
