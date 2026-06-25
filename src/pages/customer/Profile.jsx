import { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { updateCustomer } from '../../utils/data';
import { getWishlist, toggleWishlist } from '../../utils/packages';
import {
  Heart, Star, Search, MapPin, Check, Home, PlusCircle, User, Utensils, Leaf, Sparkles, X, Mail, Phone, Save, ClipboardList, CheckCircle2, IndianRupee, LogOut, ArrowLeft, Eye, Clock, AlertTriangle, MessageSquare, PartyPopper, XCircle, Pencil
} from 'lucide-react';
import { Icon } from '../../utils/iconHelper';

const STATUS_MAP = {
  searching: { cls: 'badge-searching', label: 'Searching', iconName: 'Search' },
  bidding:   { cls: 'badge-bidding',   label: 'Bids In',   iconName: 'IndianRupee' },
  confirmed: { cls: 'badge-confirmed', label: 'Confirmed',  iconName: 'CheckCircle2' },
  completed: { cls: 'badge-confirmed', label: 'Completed',  iconName: 'PartyPopper' },
  cancelled: { cls: 'badge-cancelled', label: 'Cancelled',  iconName: 'XCircle'  },
};

const FOOD_LABEL = { veg: 'Veg', nonveg: 'Non-Veg', both: 'Both' };

function getInitials(name, phone) {
  if (name && name.trim()) {
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return String(phone || '').replace(/\D/g, '').slice(-2);
}

function formatPhoneDisplay(phone) {
  const d = String(phone || '').replace(/\D/g, '');
  if (d.length === 10) return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
  if (d.length === 12 && d.startsWith('91')) return `+91 ${d.slice(2, 7)} ${d.slice(7)}`;
  return phone || '—';
}

export default function CustomerProfile() {
  const { user, logout, updateUser, requests: allRequests, bids: allBids, vendors: allVendors } = useApp();
  const navigate = useNavigate();

  const [editing, setEditing]       = useState(false);
  const [name, setName]             = useState('');
  const [email, setEmail]           = useState('');
  const [saveFeedback, setSaveFeedback] = useState('');
  const [activeTab, setActiveTab]   = useState('history');
  const [wishlist, setWishlist]     = useState([]);
  const [wishVendors, setWishVendors] = useState([]);

  useEffect(() => {
    if (!user || user.role !== 'customer') navigate('/');
  }, [user, navigate]);

  useEffect(() => {
    if (!user) return;
    const list = getWishlist(user.id);
    setWishlist(list);
    if (list.length > 0 && allVendors.length > 0) {
      setWishVendors(allVendors.filter(v => list.includes(v.id)));
    }
  }, [user, allVendors]);

  if (!user) return null;

  const requests      = allRequests.filter(r => r.customerPhone === user.phone);
  const totalOrders   = requests.length;
  const confirmed     = requests.filter(r => r.status === 'confirmed' || r.status === 'completed').length;
  const totalBidsRcvd = allBids.filter(b => requests.some(r => r.id === b.requestId)).length;

  const history = [...requests].sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });

  const getBidCount = (reqId) => allBids.filter(b => b.requestId === reqId).length;

  const handleSave = async () => {
    const trimmedName  = name.trim();
    const trimmedEmail = email.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setSaveFeedback('error:Enter a valid email address.');
      return;
    }
    updateUser({ name: trimmedName, email: trimmedEmail });
    await updateCustomer(user.phone, { name: trimmedName, email: trimmedEmail });
    setEditing(false);
    setSaveFeedback('success:Profile updated!');
    setTimeout(() => setSaveFeedback(''), 2500);
  };

  const handleRemoveWishlist = (e, vendorId) => {
    e.stopPropagation();
    const newList = toggleWishlist(user.id, vendorId);
    setWishlist(newList);
    setWishVendors(prev => prev.filter(v => v.id !== vendorId));
  };

  return (
    <div className="app-container">
      <div className="page-header">
        <div style={{ flex: 1 }}>
          <div className="logo" style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Utensils size={24} style={{ color: 'var(--primary)' }} />
            <span className="logo-text">My Profile</span>
          </div>
        </div>
      </div>

      <div className="page">

        {/* ── Profile Hero ── */}
        <div className="profile-hero">
          <div className="profile-avatar">
            {getInitials(user.name, user.phone)}
          </div>
          <div className="profile-info">
            <div className="profile-name">{user.name || 'Customer'}</div>
            <div className="profile-phone">{formatPhoneDisplay(user.phone)}</div>
            {user.email && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Mail size={12} /> {user.email}
              </div>
            )}
            <div className="profile-role-badge">Customer Account</div>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            style={{ marginLeft: 'auto', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
            onClick={() => {
              if (!editing) { setName(user?.name || ''); setEmail(user?.email || ''); }
              setEditing(e => !e);
              setSaveFeedback('');
            }}
          >
            {editing ? <><X size={14} /> Close</> : <><Pencil size={14} /> Edit</>}
          </button>
        </div>

        {/* ── Edit Form ── */}
        {editing && (
          <div className="card" style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="section-title" style={{ marginBottom: '4px' }}>Edit Profile</div>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Full Name</label>
              <input className="form-input" type="text" placeholder="e.g. Ravi Kumar" value={name} maxLength={60} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Email Address <span style={{ color: 'var(--text-muted)' }}>(optional)</span></label>
              <input className="form-input" type="email" placeholder="e.g. ravi@gmail.com" value={email} maxLength={100} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Mobile Number</label>
              <input className="form-input" type="text" value={formatPhoneDisplay(user.phone)} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Phone size={12} /> Phone number cannot be changed.
              </p>
            </div>
            {saveFeedback && (
              <p style={{ fontSize: '0.82rem', color: saveFeedback.startsWith('error:') ? 'var(--danger)' : 'var(--success)', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                {saveFeedback.startsWith('error:') ? <AlertTriangle size={14} /> : <Check size={14} />}
                {saveFeedback.split(':')[1]}
              </p>
            )}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} onClick={handleSave}><Save size={16} /> Save Changes</button>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setEditing(false); }}>Cancel</button>
            </div>
          </div>
        )}

        {saveFeedback && !editing && (
          <p style={{ fontSize: '0.82rem', color: saveFeedback.startsWith('error:') ? 'var(--danger)' : 'var(--success)', marginBottom: '12px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            {saveFeedback.startsWith('error:') ? <AlertTriangle size={14} /> : <Check size={14} />}
            {saveFeedback.split(':')[1]}
          </p>
        )}

        {/* ── Stats ── */}
        <div className="vd-stats" style={{ marginBottom: '20px' }}>
          <div className="vd-stat">
            <span className="vd-stat-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ClipboardList size={18} style={{ color: 'var(--primary)' }} /></span>
            <span className="vd-stat-value">{totalOrders}</span>
            <span className="vd-stat-label">Total Orders</span>
          </div>
          <div className="vd-stat-divider" />
          <div className="vd-stat">
            <span className="vd-stat-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle2 size={18} style={{ color: 'var(--success)' }} /></span>
            <span className="vd-stat-value">{confirmed}</span>
            <span className="vd-stat-label">Confirmed</span>
          </div>
          <div className="vd-stat-divider" />
          <div className="vd-stat">
            <span className="vd-stat-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IndianRupee size={18} style={{ color: '#059669' }} /></span>
            <span className="vd-stat-value">{totalBidsRcvd}</span>
            <span className="vd-stat-label">Active Bids</span>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="vd-tabs" style={{ marginBottom: '16px' }}>
          <button className={`vd-tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <ClipboardList size={14} /> Orders
          </button>
          <button className={`vd-tab ${activeTab === 'wishlist' ? 'active' : ''}`} onClick={() => setActiveTab('wishlist')} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Heart size={14} fill={activeTab === 'wishlist' ? 'var(--primary)' : 'transparent'} color={activeTab === 'wishlist' ? 'var(--primary)' : 'currentColor'} /> Saved{wishlist.length > 0 ? ` (${wishlist.length})` : ''}
          </button>
        </div>

        {/* ── Order History Tab ── */}
        {activeTab === 'history' && (
          <div>
            {history.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><ClipboardList size={40} style={{ color: 'var(--text-muted)' }} /></div>
                <h3>No orders yet</h3>
                <p>Your catering request history will appear here.</p>
                <button className="btn btn-primary mt-md" onClick={() => navigate('/customer/new-request')}>
                  Create First Request
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {history.map((req, i) => {
                  const s = STATUS_MAP[req.status] || { cls: 'badge-pending', label: req.status, iconName: 'HelpCircle' };
                  const bidCount = getBidCount(req.id);
                  return (
                    <div
                      key={req.id}
                      className="history-card"
                      onClick={() => navigate(`/customer/request/${req.id}`)}
                      style={{ animationDelay: `${i * 0.04}s` }}
                    >
                      <div className="history-card-left">
                        <div className={`history-status-dot ${req.status}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon name={s.iconName} size={12} />
                        </div>
                      </div>
                      <div className="history-card-body">
                        <div className="history-card-title">
                          Catering Order #{req.id?.split('_')[1]?.slice(-4) || i + 1}
                        </div>
                        <div className="history-card-meta">
                          <span>{req.plates} plates</span>
                          <span>·</span>
                          <span>{FOOD_LABEL[req.foodType] || req.foodType}</span>
                          {bidCount > 0 && (
                            <>
                              <span>·</span>
                              <span style={{ color: 'var(--primary-light)' }}>{bidCount} bid{bidCount !== 1 ? 's' : ''}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="history-card-right">
                        <span className={`badge ${s.cls}`} style={{ fontSize: '0.65rem' }}>{s.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Wishlist Tab ── */}
        {activeTab === 'wishlist' && (
          <div>
            {wishlist.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 16px' }}>
                <div className="empty-icon"><Heart size={40} style={{ color: 'var(--text-muted)' }} /></div>
                <h3>Your wishlist is empty</h3>
                <p>Tap the heart icon on any vendor to save them here for quick access.</p>
                <button className="btn btn-primary mt-md" onClick={() => navigate('/customer/vendors')}>
                  Browse Vendors
                </button>
              </div>
            ) : wishVendors.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {wishVendors.map((vendor, i) => (
                  <div
                    key={vendor.id}
                    className="history-card"
                    onClick={() => navigate(`/customer/vendors/${vendor.id}`)}
                    style={{ animationDelay: `${i * 0.04}s` }}
                  >
                    <div className="history-card-left">
                      <div style={{
                        width: '38px', height: '38px', borderRadius: '12px',
                        background: vendor.foodType === 'veg'
                          ? 'linear-gradient(135deg,#059669,#047857)'
                          : vendor.foodType === 'nonveg'
                          ? 'linear-gradient(135deg,#DC2626,#B91C1C)'
                          : 'linear-gradient(135deg,#E8590C,#7C3AED)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 800, fontSize: '0.85rem',
                      }}>
                        {(vendor.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                    </div>
                    <div className="history-card-body">
                      <div className="history-card-title">{vendor.name}</div>
                      <div className="history-card-meta">
                        <span>{FOOD_LABEL[vendor.foodType] || vendor.foodType}</span>
                        <span>·</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><Star size={12} fill="var(--warning)" color="var(--warning)" /> {vendor.rating?.toFixed(1) || '—'}</span>
                        {vendor.fssai && (
                          <>
                            <span>·</span>
                            <span style={{ color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}><Check size={12} strokeWidth={3} /> FSSAI</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="history-card-right">
                      <button
                        onClick={e => handleRemoveWishlist(e, vendor.id)}
                        style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', padding: '4px' }}
                        aria-label="Remove from wishlist"
                      >
                        <Heart size={16} fill="#dc2626" color="#dc2626" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'center', color: 'var(--text-muted)' }}><Heart size={36} /></div>
                <h3>No saved vendors</h3>{wishlist.length} saved vendor{wishlist.length !== 1 ? 's' : ''} ·{' '}
                <button
                  onClick={() => navigate('/customer/vendors')}
                  style={{ color: 'var(--primary)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  View all →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Logout ── */}
        <div style={{ marginTop: '32px', paddingBottom: '8px' }}>
          <button
            className="btn btn-secondary btn-block"
            onClick={logout}
            style={{ borderColor: 'rgba(239,68,68,0.3)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <LogOut size={16} /> Logout
          </button>
          <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '10px' }}>
            CaterNow · All data is encrypted &amp; secure
          </p>
        </div>
      </div>

      <div className="bottom-nav">
        <NavLink to="/customer" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
          <span className="nav-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Home size={20} /></span><span>Home</span>
        </NavLink>
        <NavLink to="/customer/new-request" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PlusCircle size={20} /></span><span>New</span>
        </NavLink>
        <NavLink to="/customer/vendors" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Search size={20} /></span><span>Vendors</span>
        </NavLink>
        <NavLink to="/customer/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={20} /></span><span>Profile</span>
        </NavLink>
      </div>
    </div>
  );
}
