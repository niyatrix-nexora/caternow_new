import { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Icon } from '../../utils/iconHelper';
import {
  Mail, ClipboardList, Check, Clock, X, Utensils, Pencil, Save,
  Smartphone, LogOut, Home, Inbox, Calendar, DollarSign, Menu, CheckCircle, AlertTriangle
} from 'lucide-react';



const BID_STATUS = {
  pending:  { cls: 'badge-bidding',   label: 'Pending', icon: 'Clock' },
  accepted: { cls: 'badge-confirmed', label: 'Won', icon: 'CheckCircle' },
  rejected: { cls: 'badge-cancelled', label: 'Rejected', icon: 'X' },
  hidden:   { cls: 'badge-cancelled', label: 'Hidden', icon: 'X' },
};

function getInitials(name, phone) {
  if (name && name.trim()) {
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  const d = String(phone || '').replace(/\D/g, '');
  return d.slice(-2) || '??';
}

// Vendor name → real food photo (same map used across the whole app)
const VENDOR_IMAGE_MAP = {
  'Spice Garden Kitchen': '/spice.jpeg',
  'Royal Feast Caterers': '/royal.jpg',
  'Grand Biryani House':  '/grandbiriyani.jpeg',
  'TINNU':                '/tinnu.jpg',
};

function getVendorImage(user) {
  // Try business name first, then name
  return VENDOR_IMAGE_MAP[user?.businessName] || VENDOR_IMAGE_MAP[user?.name] || null;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function VendorProfile() {
  const { user, logout, updateUser, bids: allBids, requests } = useApp();
  const navigate = useNavigate();

  const [activeTab, setActiveTab]  = useState('history');

  // Edit profile state
  const [name, setName]               = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail]             = useState('');
  const [fssai, setFssai]             = useState('');
  const [minPricePerPlate, setMinPricePerPlate] = useState(150);
  const [saveFeedback, setSaveFeedback] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'vendor') navigate('/');
  }, [user, navigate]);

  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setBusinessName(user.businessName || '');
    setEmail(user.email || '');
    setFssai(user.fssai || '');
    setMinPricePerPlate(user.minPricePerPlate || 150);
  }, [user]);

  const getBidEffectiveStatus = (bid) => {
    const req = requests.find(r => r.id === bid.requestId);
    if (!req) return bid.status;
    if (req.status === 'confirmed') {
      return req.confirmedBidId === bid.id ? 'accepted' : 'rejected';
    }
    return bid.status;
  };

  const myBids      = allBids.filter(b => b.vendorId === user?.id).map(b => ({ ...b, status: getBidEffectiveStatus(b) }));
  const wonBids     = myBids.filter(b => b.status === 'accepted');
  const pendingBids = myBids.filter(b => b.status === 'pending');



  const handleSaveProfile = () => {
    const trimmedEmail = email.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setSaveFeedback({ isError: true, msg: 'Enter a valid email address.' });
      return;
    }
    updateUser({ 
      name: name.trim(), 
      businessName: businessName.trim(), 
      email: trimmedEmail, 
      fssai: fssai.trim(),
      minPricePerPlate: parseInt(minPricePerPlate) || 150
    });
    setSaveFeedback({ isError: false, msg: 'Profile updated!' });
    setTimeout(() => setSaveFeedback(null), 2500);
  };

  if (!user) return null;

  return (
    <div className="app-container">
      <div className="page-header">
        <div style={{ flex: 1 }}>
          <div className="logo" style={{ fontSize: '1.1rem' }}>
            <span className="logo-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Utensils size={20} color="var(--primary)" /></span>
            <span className="logo-text">My Profile</span>
          </div>
        </div>
      </div>

      <div className="page">

        {/* ── Hero ── */}
        {(() => {
          const vendorImg = getVendorImage(user);
          return (
            <div
              className="profile-hero"
              style={vendorImg ? {
                position: 'relative',
                overflow: 'hidden',
                backgroundImage: `linear-gradient(135deg, rgba(30,30,30,0.55), rgba(30,30,30,0.25)), url('${vendorImg}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                color: '#fff',
                border: 'none',
              } : undefined}
            >
              <div
                className="profile-avatar"
                style={{
                  background: 'linear-gradient(135deg,#E8590C,#7C3AED)',
                  overflow: 'hidden',
                  padding: 0,
                  flexShrink: 0,
                }}
              >
                {vendorImg ? (
                  <img
                    src={vendorImg}
                    alt={user.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement.textContent = getInitials(user.name, user.phone);
                    }}
                  />
                ) : (
                  getInitials(user.name, user.phone)
                )}
              </div>
              <div className="profile-info">
                <div className="profile-name" style={vendorImg ? { color: '#fff' } : undefined}>
                  {user.name || user.businessName || 'Vendor'}
                </div>
                <div className="profile-phone" style={vendorImg ? { color: 'rgba(255,255,255,0.82)' } : undefined}>
                  +91 {String(user.phone || '').replace(/\D/g,'').slice(-10).replace(/(\d{5})(\d{5})/,'$1 $2')}
                </div>
                {user.email && (
                  <div style={{ fontSize: '0.78rem', color: vendorImg ? 'rgba(255,255,255,0.72)' : 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={12} /> {user.email}
                  </div>
                )}
                <div
                  className="profile-role-badge"
                  style={vendorImg
                    ? { background: 'rgba(255,255,255,0.18)', borderColor: 'rgba(255,255,255,0.35)', color: '#fff' }
                    : { background:'rgba(124,58,237,0.15)', borderColor:'rgba(124,58,237,0.3)', color:'#A78BFA' }
                  }
                >
                  Vendor Account
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── Stats ── */}
        <div className="vd-stats" style={{ marginBottom:'20px' }}>
          <div className="vd-stat" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <ClipboardList size={20} style={{ color: 'var(--primary)', marginBottom: '4px' }} />
            <span className="vd-stat-value">{myBids.length}</span>
            <span className="vd-stat-label">Total Bids</span>
          </div>
          <div className="vd-stat-divider" />
          <div className="vd-stat" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CheckCircle size={20} style={{ color: 'var(--success)', marginBottom: '4px' }} />
            <span className="vd-stat-value">{wonBids.length}</span>
            <span className="vd-stat-label">Won</span>
          </div>
          <div className="vd-stat-divider" />
          <div className="vd-stat" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Clock size={20} style={{ color: 'var(--warning)', marginBottom: '4px' }} />
            <span className="vd-stat-value">{pendingBids.length}</span>
            <span className="vd-stat-label">Pending</span>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="vd-tabs">
          <button className={`vd-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <ClipboardList size={16} /> Bid History
          </button>

          <button className={`vd-tab ${activeTab === 'account' ? 'active' : ''}`}
            onClick={() => setActiveTab('account')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Pencil size={16} /> Account
          </button>
        </div>

        {/* ══════════ BID HISTORY ══════════ */}
        {activeTab === 'history' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            {myBids.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon" style={{ display: 'flex', justifyContent: 'center' }}>
                  <ClipboardList size={40} style={{ color: 'var(--text-muted)' }} />
                </div>
                <h3>No bids yet</h3>
                <p>Your submitted bids and outcomes will appear here.</p>
                <button className="btn btn-primary mt-md" onClick={() => navigate('/vendor')}>View Requests</button>
              </div>
            ) : (
              [...myBids].reverse().map((bid, i) => {
                const s = BID_STATUS[bid.status] || { cls:'badge-pending', label: bid.status, icon: 'Clock' };
                return (
                  <div key={bid.id} className="history-card"
                    onClick={() => navigate(`/vendor/request/${bid.requestId}`)}
                    style={{ animationDelay:`${i * 0.04}s` }}>
                    <div className="history-card-left">
                      <div className={`history-status-dot ${bid.status}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {bid.status === 'accepted' ? <Check size={10} style={{ color: 'white' }} /> : bid.status === 'pending' ? <Clock size={10} style={{ color: 'white' }} /> : <X size={10} style={{ color: 'white' }} />}
                      </div>
                    </div>
                    <div className="history-card-body">
                      <div className="history-card-title">
                        Order #{bid.requestId?.split('_')[1]?.slice(-4) || i + 1}
                      </div>
                      <div className="history-card-meta">
                        <span style={{ color:'var(--primary-light)', fontWeight:700 }}>₹{bid.pricePerPlate}/plate</span>
                        <span>·</span>
                        <span>Total ₹{bid.totalPrice?.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                    <div className="history-card-right">
                      <span className={`badge ${s.cls}`} style={{ fontSize:'0.65rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Icon name={s.icon} size={10} />
                        {s.label}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}



        {/* ══════════ ACCOUNT EDIT ══════════ */}
        {activeTab === 'account' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Your Name</label>
              <input className="form-input" type="text" placeholder="e.g. Ravi Kumar" value={name} maxLength={60} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Business / Brand Name</label>
              <input className="form-input" type="text" placeholder="e.g. Ravi's Royal Kitchen" value={businessName} maxLength={80} onChange={e => setBusinessName(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Email Address <span style={{ color: 'var(--text-muted)' }}>(optional)</span></label>
              <input className="form-input" type="email" placeholder="e.g. ravi@gmail.com" value={email} maxLength={100} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>FSSAI License No. <span style={{ color: 'var(--text-muted)' }}>(optional)</span></label>
              <input className="form-input" type="text" placeholder="14-digit FSSAI Number" value={fssai} maxLength={14} onChange={e => setFssai(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Minimum Service Price (per plate)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 600 }}>₹</span>
                <input 
                  className="form-input" 
                  style={{ paddingLeft: '28px' }}
                  type="number" 
                  placeholder="e.g. 200" 
                  value={minPricePerPlate} 
                  onChange={e => setMinPricePerPlate(e.target.value)} 
                />
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>You will only see customer requests with a budget ≥ this amount.</p>
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Mobile Number</label>
              <input className="form-input" type="text"
                value={'+91 ' + String(user.phone || '').replace(/\D/g,'').slice(-10).replace(/(\d{5})(\d{5})/,'$1 $2')}
                disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Smartphone size={12} /> Phone number is used for login and cannot be changed.
              </p>
            </div>
            {saveFeedback && (
              <p style={{
                fontSize: '0.82rem',
                color: saveFeedback.isError ? 'var(--warning)' : 'var(--success)',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                {saveFeedback.isError ? <AlertTriangle size={14} /> : <CheckCircle size={14} />}
                {saveFeedback.msg}
              </p>
            )}
            <button className="btn btn-primary btn-block" onClick={handleSaveProfile} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Save size={18} /> Save Profile
            </button>
          </div>
        )}

        {/* ── Logout ── */}
        <div style={{ marginTop:'32px', paddingBottom:'8px' }}>
          <button className="btn btn-secondary btn-block" onClick={logout}
            style={{ borderColor:'rgba(239,68,68,0.3)', color:'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
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
          <DollarSign size={20} className="nav-icon" />
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
