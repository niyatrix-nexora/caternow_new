import { useEffect, useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  getRequestsForVendor, 
  upsertVendorProfile, 
  subscribeToAllRequests 
} from '../../utils/data';
import { loadVendorPackages, PACKAGE_META } from '../../utils/packages';

const VENDOR_IMAGE_MAP = {
  'Spice Garden Kitchen': '/spice.jpeg',
  'Royal Feast Caterers': '/royal.jpg',
  'Grand Biryani House':  '/grandbiriyani.jpeg',
  'TINNU':                '/tinnu.jpg',
};

function getVendorImage(user) {
  return VENDOR_IMAGE_MAP[user?.businessName] || VENDOR_IMAGE_MAP[user?.name] || null;
}

function getInitials(name) {
  if (!name?.trim()) return '??';
  const parts = name.trim().split(' ');
  return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].slice(0, 2).toUpperCase();
}

export default function VendorDashboard() {
  const { user, updateUser, refresh, bids: allBids, requests } = useApp();
  const navigate = useNavigate();
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [livePriceRange, setLivePriceRange] = useState(user?.livePriceRange || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isEditingCapacity, setIsEditingCapacity] = useState(!user?.todaysMenu);
  const [packages, setPackages] = useState([]);

  useEffect(() => {
    if (!user) return;
    setPackages(loadVendorPackages(user.id));
  }, [user?.id]);

  useEffect(() => {
    if (!user || user.role !== 'vendor') navigate('/');
  }, [user, navigate]);

  useEffect(() => {
    if (!user) return;

    async function loadRequests() {
      await upsertVendorProfile(user);
      const reqs = await getRequestsForVendor(user.id);
      setIncomingRequests(reqs);
      setLoading(false);
    }

    loadRequests();
  }, [user, allBids]);

  // Realtime subscription instead of polling
  useEffect(() => {
    if (!user) return undefined;

    const unsub = subscribeToAllRequests(async () => {
      // When any request is added or updated, we re-fetch relevant requests for this vendor
      const reqs = await getRequestsForVendor(user.id);
      setIncomingRequests(reqs);
      setLastRefreshed(new Date());
      refresh(); // update global context too
    });

    return () => unsub();
  }, [user, refresh]);



  const toggleDuty = async () => {
    if (refreshing) return;
    const nextStatus = user.isOnDuty === false ? true : false;
    const nextUser = { ...user, isOnDuty: nextStatus };
    updateUser({ isOnDuty: nextStatus });
    
    // Explicitly update profile before fetching requests
    await upsertVendorProfile(nextUser);
    
    // After toggling, we should immediately refresh
    await refresh();
    const reqs = await getRequestsForVendor(user.id);
    setIncomingRequests(reqs);
    setLastRefreshed(new Date());
  };

  const saveTodayStatus = async () => {
    setIsSaving(true);
    setShowSuccess(false);
    const updates = { 
      livePriceRange,
      isOnDuty: true 
    };
    
    await upsertVendorProfile({ ...user, ...updates });
    updateUser(updates);
    
    // Refresh the data to show matching requests for new capacity
    await refresh();
    const reqs = await getRequestsForVendor(user.id);
    setIncomingRequests(reqs);
    setLastRefreshed(new Date());
    
    setIsSaving(false);
    setShowSuccess(true);
    setIsEditingCapacity(false); 
    setTimeout(() => setShowSuccess(false), 3000);
  };

  if (!user) return null;

  const vendorId = user.id;
  
  const getBidEffectiveStatus = (bid) => {
    const req = requests.find(r => r.id === bid.requestId);
    if (!req) return bid.status;
    if (req.status === 'confirmed') {
      return req.confirmedBidId === bid.id ? 'accepted' : 'rejected';
    }
    return bid.status;
  };

  const myBids = allBids.filter((b) => b.vendorId === vendorId).map(b => ({ ...b, status: getBidEffectiveStatus(b) }));
  const pendingBids = myBids.filter((b) => b.status === 'pending');
  const wonBids = myBids.filter((b) => b.status === 'accepted');

  const biddedRequestIds = myBids.map((b) => b.requestId);
  const newRequests = incomingRequests.filter((r) => !biddedRequestIds.includes(r.id));

  const getStatusBadge = (status) => {
    const map = {
      pending: { cls: 'badge-bidding', label: 'Pending' },
      accepted: { cls: 'badge-confirmed', label: 'Won' },
      rejected: { cls: 'badge-cancelled', label: 'Rejected' },
      skipped: { cls: 'badge-cancelled', label: 'Skipped' },
    };

    const s = map[status] || { cls: 'badge-pending', label: status };
    return <span className={`badge ${s.cls}`}>{s.label}</span>;
  };

  return (
    <div className="app-container">
      <div className="page-header">
        <div style={{ flex: 1 }}>
          <div className="logo" style={{ fontSize: '1.1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Vendor photo avatar — decorative only, navigate via bottom nav Profile */}
              {(() => {
                const img = getVendorImage(user);
                return (
                  <div
                    style={{
                      width: '36px', height: '36px', borderRadius: '12px',
                      overflow: 'hidden', flexShrink: 0,
                      background: 'linear-gradient(135deg,#E8590C,#7C3AED)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontWeight: 800, fontSize: '0.78rem',
                      boxShadow: '0 4px 12px rgba(232,89,12,0.25)',
                    }}
                  >
                    {img ? (
                      <img
                        src={img}
                        alt={user.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement.textContent = getInitials(user.name); }}
                      />
                    ) : getInitials(user.name)}
                  </div>
                );
              })()}
              <div>
                <span className="logo-icon" style={{ fontSize: '1.4rem' }}>🍽️</span>
                <span className="logo-text">CaterNow Vendor</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '600', color: user.isOnDuty !== false ? 'var(--success)' : 'var(--text-muted)' }}>
                {user.isOnDuty !== false ? 'On Duty' : 'Off Duty'}
              </span>
              <div 
                onClick={toggleDuty}
                style={{ 
                  width: '40px', height: '22px', borderRadius: '12px', 
                  background: user.isOnDuty !== false ? 'var(--success)' : '#444', 
                  position: 'relative', cursor: 'pointer', transition: '0.3s'
                }}>
                <div style={{ 
                  width: '18px', height: '18px', borderRadius: '50%', background: '#fff', 
                  position: 'absolute', top: '2px', left: user.isOnDuty !== false ? '20px' : '2px', 
                  transition: '0.3s'
                }} />
              </div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'6px', marginTop:'3px' }}>
            <span style={{
              width:'7px', height:'7px', borderRadius:'50%',
              background: user.isOnDuty !== false ? 'var(--success)' : '#444', display:'inline-block',
              animation: user.isOnDuty !== false ? 'pulse 2s infinite' : 'none'
            }} />
            <span style={{ fontSize:'0.68rem', color:'var(--text-muted)' }}>
              Auto-refreshes every 5 s
              {lastRefreshed && ` · last at ${lastRefreshed.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}`}
            </span>
          </div>
        </div>
      </div>

      <div className="page">
        {user.isOnDuty !== false && (
          <div className="card" style={{ marginBottom: '20px', border: '1.5px solid rgba(232,89,12,0.2)', background: 'rgba(232,89,12,0.02)' }}>
            <div style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isEditingCapacity ? '12px' : '0' }}>
                <h3 style={{ fontSize: '0.95rem', margin: 0, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>⚡</span> Today's Price Range
                </h3>
                {!isEditingCapacity && (
                  <button 
                    className="btn-ghost" 
                    onClick={() => {
                      setLivePriceRange(user.livePriceRange || '');
                      setIsEditingCapacity(true);
                    }}
                    style={{ padding: '4px', color: 'var(--text-muted)' }}
                  >
                    ✏️
                  </button>
                )}
              </div>

              {!isEditingCapacity ? (
                <div style={{ marginTop: '12px' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Active Range Today</p>
                      <p style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--primary)' }}>₹{user.livePriceRange || 'Not set'}</p>
                    </div>
                  </div>
                  {showSuccess && (
                    <p style={{ color: 'var(--success)', fontSize: '0.7rem', marginTop: '12px', fontWeight: '600', animation: 'fadeIn 0.3s' }}>
                      ✓ Price range updated!
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div className="form-group" style={{ marginBottom: '16px', marginTop: '12px' }}>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: '600' }}>Enter your price range for today (₹)</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      style={{ fontSize: '1rem', padding: '12px' }}
                      placeholder="e.g. 200-500"
                      value={livePriceRange}
                      onChange={(e) => setLivePriceRange(e.target.value)}
                    />
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                      This range will be shown to customers to get you faster deals.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className="btn btn-primary btn-block btn-sm" 
                      onClick={saveTodayStatus}
                      disabled={isSaving}
                      style={{ flex: 2 }}
                    >
                      {isSaving ? 'Saving...' : 'Update Range'}
                    </button>
                    {user.livePriceRange && (
                      <button 
                        className="btn btn-secondary btn-sm" 
                        onClick={() => setIsEditingCapacity(false)}
                        disabled={isSaving}
                        style={{ flex: 1 }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-value">{newRequests.length}</div>
            <div className="stat-label">New</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{pendingBids.length}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{wonBids.length}</div>
            <div className="stat-label">Won</div>
          </div>
        </div>

        {/* ── My Packages ── */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div className="section-title" style={{ margin: 0 }}>My Packages</div>
            <button
              onClick={() => navigate('/vendor/packages/new')}
              style={{
                padding: '6px 14px', borderRadius: '12px', border: 'none',
                background: 'linear-gradient(135deg, #FF6B00, #FF8C42)',
                color: '#fff', fontWeight: 700, fontSize: '0.78rem',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              ✏️ Manage
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {packages.filter(p => p.isActive).map(pkg => {
              const meta = PACKAGE_META[pkg.category] || PACKAGE_META.custom;
              return (
                <div
                  key={pkg.category}
                  onClick={() => navigate('/vendor/packages/new')}
                  style={{
                    padding: '14px', borderRadius: '18px', cursor: 'pointer',
                    background: meta.bg,
                    border: `1.5px solid ${meta.border}`,
                    transition: 'transform 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '1.3rem' }}>{meta.emoji}</span>
                    <span style={{ fontWeight: 800, fontSize: '0.82rem', color: meta.color }}>{meta.label}</span>
                  </div>
                  <div style={{ fontWeight: 900, fontSize: '1.1rem', color: meta.color }}>
                    ₹{pkg.pricePerPlate}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    /plate · {(pkg.dishes || []).length} dishes
                  </div>
                </div>
              );
            })}
            {packages.filter(p => p.isActive).length === 0 && (
              <div
                onClick={() => navigate('/vendor/packages/new')}
                style={{
                  gridColumn: 'span 2', padding: '16px', borderRadius: '18px',
                  border: '1.5px dashed var(--border)', textAlign: 'center',
                  cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.85rem',
                }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>📦</div>
                No packages set up yet — tap to create
              </div>
            )}
          </div>
        </div>

        {newRequests.length > 0 && (
          <>
            <div className="section-title">Incoming Requests</div>
            {newRequests.map((req, i) => (
              <div
                key={req.id}
                className="card"
                style={{ cursor: 'pointer', animationDelay: `${i * 0.05}s` }}
                onClick={() => navigate(`/vendor/request/${req.id}`)}
              >
                <div className="card-header">
                  <span className="card-title">Catering Order #{req.id?.split('_')[1]?.slice(-4)}</span>
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
                    <div className="card-meta-item">
                      <span className="icon">📦</span>
                      <span style={{ color: 'var(--success)', fontWeight: '700' }}>Package: {req.packageType}</span>
                    </div>
                  )}
                </div>
                <div className="card-actions">
                  <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={(e) => { e.stopPropagation(); navigate(`/vendor/request/${req.id}`); }}>
                    View and Bid
                  </button>
                </div>
              </div>
            ))}
          </>
        )}

        {newRequests.length === 0 && myBids.length === 0 && !loading && (
          <div className="empty-state">
            <div className="empty-icon">...</div>
            <h3>{user.isOnDuty !== false ? 'No requests nearby' : 'You are Off Duty'}</h3>
            <p>{user.isOnDuty !== false ? 'When customers near you create catering requests, they will appear here.' : 'Turn on your duty status to receive new catering requests.'}</p>
          </div>
        )}

        {myBids.length > 0 && (
          <>
            <div className="section-title">My Bids</div>
            {myBids.map((bid) => (
              <div
                key={bid.id}
                className="card"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/vendor/request/${bid.requestId}`)}
              >
                <div className="card-header">
                  <span className="card-title">Catering Order #{bid.requestId?.split('_')[1]?.slice(-4)}</span>
                  {getStatusBadge(bid.status)}
                </div>
                <div className="card-meta">
                  <div className="card-meta-item">
                    <span className="icon">₹</span>
                    <span>{bid.pricePerPlate}/plate | Total ₹{bid.totalPrice?.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            ))}
          </>
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
