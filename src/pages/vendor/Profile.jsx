import { useState, useEffect, useCallback } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { saveVendorMenu, loadVendorMenu } from '../../utils/data';
import { Icon } from '../../utils/iconHelper';
import {
  Mail, ClipboardList, Check, Clock, X, Utensils, Pencil, Save, RotateCcw,
  Smartphone, LogOut, Home, Inbox, Calendar, DollarSign, Menu, CheckCircle, AlertTriangle
} from 'lucide-react';

// ─── Item pool per food type ──────────────────────────────────────────────────
const ITEM_POOL = {
  starters: {
    veg:    ['Paneer Tikka','Veg Spring Rolls','Samosa','Hara Bhara Kabab','Soup of the Day','Dahi Puri','Papdi Chaat','Veg Cutlet','Corn Chaat','Bruschetta','Aloo Tikki','Mushroom Skewer'],
    nonveg: ['Chicken Tikka','Seekh Kabab','Fish Fingers','Mutton Shammi Kabab','Chicken Wings','Prawn Cocktail','Tandoori Chicken','Chicken Lollipop'],
  },
  mains: {
    veg:    ['Dal Makhani','Palak Paneer','Shahi Paneer','Chana Masala','Aloo Gobi','Mix Veg Curry','Veg Biryani','Veg Fried Rice','Kadai Paneer','Matar Paneer','Pav Bhaji'],
    nonveg: ['Butter Chicken','Chicken Biryani','Mutton Curry','Fish Curry','Chicken Curry','Egg Curry','Prawn Masala','Chicken Korma'],
    breads: ['Naan','Butter Roti','Paratha','Steamed Rice','Jeera Rice'],
  },
  desserts:  ['Gulab Jamun','Rasgulla','Kheer','Halwa','Kulfi','Ice Cream','Fruit Salad','Jalebi','Brownie','Rasmalai','Payasam','Double Ka Meetha'],
  beverages: ['Masala Lassi','Buttermilk','Lemon Water','Cold Drinks','Fresh Juice','Tea / Coffee','Mineral Water','Coconut Water','Rose Sharbat','Jaljeera'],
};

function getDefaultPrice(cat, name) {
  const nonvegStarters = ITEM_POOL.starters.nonveg;
  const nonvegMains    = ITEM_POOL.mains.nonveg;
  const breads         = ITEM_POOL.mains.breads;
  if (cat === 'starters' || cat === 'startersNonveg') return nonvegStarters.includes(name) ? 110 : 45;
  if (cat === 'mainsNonveg') return 150;
  if (cat === 'breads')      return breads.includes(name) ? 20 : 50;
  if (cat === 'mainsVeg')    return 70;
  if (cat === 'mains')       return nonvegMains.includes(name) ? 150 : breads.includes(name) ? 20 : 70;
  if (cat === 'desserts')    return 40;
  if (cat === 'beverages')   return 25;
  return 50;
}


// Build the full menu split into separate sub-categories
function buildFullMenu(foodType) {
  const { starters, mains, desserts, beverages } = ITEM_POOL;

  function toRows(cat, items) {
    return items.map(name => ({
      name,
      enabled: true,
      price: getDefaultPrice(cat, name),
    }));
  }

  const isVeg    = foodType === 'veg'    || foodType === 'both';
  const isNonveg = foodType === 'nonveg' || foodType === 'both';

  // Starters: show veg always; nonveg only if vendor serves nonveg
  const starterItems = isNonveg
    ? [...starters.veg, ...starters.nonveg]
    : starters.veg;

  const result = {
    starters:  toRows('starters', starterItems),
    desserts:  toRows('desserts', desserts),
    beverages: toRows('beverages', beverages),
    breads:    toRows('breads', mains.breads),
  };

  if (isVeg)    result.mainsVeg    = toRows('mainsVeg',    mains.veg);
  if (isNonveg) result.mainsNonveg = toRows('mainsNonveg', mains.nonveg);

  return result;
}

// Merge saved menu with full pool — also handles old flat 'mains' data
function mergeMenu(full, saved) {
  const result = {};
  for (const cat of Object.keys(full)) {
    // Try the exact key first; fall back to the old 'mains' key for migration
    const savedCat = saved[cat] || saved['mains'] || [];
    result[cat] = full[cat].map(row => {
      const s = savedCat.find(r => r.name === row.name);
      return s ? { ...row, enabled: s.enabled, price: s.price ?? row.price, customName: s.customName ?? row.customName } : row;
    });
  }
  return result;
}

// Order of display in the UI
const CATEGORY_META = {
  starters:    { icon: 'Salad', label: 'Starters' },
  mainsVeg:    { icon: 'Leaf', label: 'Veg Mains' },
  mainsNonveg: { icon: 'Flame', label: 'Non-Veg Mains' },
  breads:      { icon: 'UtensilsCrossed', label: 'Breads & Rice' },
  desserts:    { icon: 'Cake', label: 'Desserts' },
  beverages:   { icon: 'Coffee', label: 'Beverages' },
};

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
  const [menu, setMenu]            = useState(null);
  const [saved, setSaved]          = useState(false);
  // Accordion: only one category open at a time
  const [openCat, setOpenCat]      = useState('starters');
  // Inline dish-name editing
  const [renamingItem, setRenamingItem] = useState(null); // { cat, name }
  const [renameValue,  setRenameValue]  = useState('');

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
    // Load from Supabase first, fall back to localStorage
    loadVendorMenu(user.id).then(stored => {
      const full = buildFullMenu(user.foodType || 'both');
      setMenu(stored ? mergeMenu(full, stored) : full);
    });
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

  // Toggle item on/off
  const toggleItem = useCallback((cat, name) => {
    setSaved(false);
    setMenu(prev => ({
      ...prev,
      [cat]: prev[cat].map(r => r.name === name ? { ...r, enabled: !r.enabled } : r),
    }));
  }, []);

  // Update price for an item
  const updatePrice = useCallback((cat, name, raw) => {
    const price = parseInt(raw, 10);
    setSaved(false);
    setMenu(prev => ({
      ...prev,
      [cat]: prev[cat].map(r => r.name === name ? { ...r, price: isNaN(price) ? '' : price } : r),
    }));
  }, []);

  // Rename a dish (custom display name)
  const commitRename = useCallback((cat, name) => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== name) {
      setSaved(false);
      setMenu(prev => ({
        ...prev,
        [cat]: prev[cat].map(r => r.name === name ? { ...r, customName: trimmed } : r),
      }));
    }
    setRenamingItem(null);
    setRenameValue('');
  }, [renameValue]);

  const startRename = useCallback((cat, row) => {
    setRenamingItem({ cat, name: row.name });
    setRenameValue(row.customName || row.name);
  }, []);

  const handleSave = async () => {
    await saveVendorMenu(user.id, menu);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    setMenu(buildFullMenu(user.foodType || 'both'));
    setSaved(false);
  };

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

  if (!user || !menu) return null;

  const enabledCount = Object.values(menu).flat().filter(r => r.enabled).length;
  const totalCount   = Object.values(menu).flat().length;

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
          <button className={`vd-tab ${activeTab === 'menu' ? 'active' : ''}`}
            onClick={() => setActiveTab('menu')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Utensils size={16} /> My Menu
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

        {/* ══════════ MY MENU ══════════ */}
        {activeTab === 'menu' && (
          <div>
            {/* Header bar */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
              <p style={{ fontSize:'0.8rem', color:'var(--text-muted)', margin:0 }}>
                <strong style={{ color:'var(--primary-light)' }}>{enabledCount}</strong> of {totalCount} items offered
              </p>
              <p style={{ fontSize:'0.72rem', color:'var(--text-muted)', margin:0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                Toggle · edit ₹ price · <Pencil size={10} /> rename
              </p>
            </div>

            {Object.entries(CATEGORY_META).map(([cat, meta]) => {
              // Skip categories not applicable to this vendor's food type
              if (!menu[cat]) return null;
              const rows    = menu[cat] || [];
              const enabled = rows.filter(r => r.enabled).length;
              const isOpen  = openCat === cat;
              const toggle  = () => setOpenCat(prev => prev === cat ? '' : cat);

              return (
                <div key={cat} className="vm-category" style={{ marginBottom: '10px' }}>
                  {/* Category header — tap to open/close */}
                  <button className="vm-cat-header" onClick={toggle} style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <span className="vm-cat-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name={meta.icon} size={18} style={{ color: 'var(--primary)' }} />
                    </span>
                    <span className="vm-cat-label" style={{ marginLeft: '10px' }}>{meta.label}</span>
                    <span className="vm-cat-count" style={{ marginLeft: 'auto' }}>{enabled}/{rows.length}</span>
                    <span className="vm-cat-arrow" style={{ marginLeft: '10px' }}>{isOpen ? '▲' : '▼'}</span>
                  </button>

                  {/* Items — shown when open */}
                  {isOpen && (
                    <div className="vm-item-list">
                      <div className="vm-col-header">
                        <span style={{ flex:1 }}></span>
                        <span>Item</span>
                        <span style={{ marginLeft:'auto', color:'var(--text-muted)', fontSize:'0.7rem' }}>₹/plate</span>
                      </div>

                      {rows.map((row, idx) => (
                        <div
                          key={row.name}
                          className={`vm-item-row ${row.enabled ? 'enabled' : 'disabled'}`}
                          style={{ animationDelay:`${idx * 0.02}s` }}
                        >
                          {/* Toggle */}
                          <button
                            className={`vm-toggle ${row.enabled ? 'on' : 'off'}`}
                            onClick={() => toggleItem(cat, row.name)}
                            title={row.enabled ? 'Click to hide from menu' : 'Click to show on menu'}
                          >
                            <span className="vm-toggle-knob" />
                          </button>

                          {/* Item name — tap Pencil to rename */}
                          {renamingItem?.cat === cat && renamingItem?.name === row.name ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flex: 1, minWidth: 0 }}>
                              <input
                                autoFocus
                                type="text"
                                value={renameValue}
                                onChange={e => setRenameValue(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') commitRename(cat, row.name);
                                  if (e.key === 'Escape') { setRenamingItem(null); setRenameValue(''); }
                                }}
                                maxLength={60}
                                style={{
                                  flex: 1, minWidth: 0, border: '1.5px solid var(--primary)',
                                  borderRadius: '8px', padding: '4px 8px',
                                  fontSize: '0.82rem', fontFamily: 'inherit',
                                  background: 'var(--bg-input)', color: 'var(--text)',
                                  outline: 'none',
                                }}
                              />
                              <button
                                onClick={() => commitRename(cat, row.name)}
                                title="Confirm rename"
                                style={{
                                  width: 26, height: 26, borderRadius: '50%', border: 'none',
                                  background: 'var(--success)', color: '#fff', cursor: 'pointer',
                                  fontSize: '0.75rem', display: 'flex', alignItems: 'center',
                                  justifyContent: 'center', flexShrink: 0,
                                }}
                              ><Check size={14} /></button>
                              <button
                                onClick={() => { setRenamingItem(null); setRenameValue(''); }}
                                title="Cancel"
                                style={{
                                  width: 26, height: 26, borderRadius: '50%', border: 'none',
                                  background: 'var(--bg-elevated)', color: 'var(--text-muted)',
                                  cursor: 'pointer', fontSize: '0.75rem',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  flexShrink: 0,
                                }}
                              ><X size={14} /></button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flex: 1, minWidth: 0 }}>
                              <span className="vm-item-name" style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {row.customName || row.name}
                                {row.customName && row.customName !== row.name && (
                                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: '4px', fontStyle: 'italic' }}>
                                    ({row.name})
                                  </span>
                                )}
                              </span>
                              <button
                                onClick={() => startRename(cat, row)}
                                title="Customize dish name"
                                style={{
                                  border: 'none', background: 'transparent', cursor: 'pointer',
                                  color: 'var(--text-muted)', fontSize: '0.75rem', padding: '2px 4px',
                                  borderRadius: '6px', flexShrink: 0, opacity: 0.6,
                                  transition: 'opacity 0.15s, color 0.15s',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--primary)'; }}
                                onMouseLeave={e => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                              ><Pencil size={12} /></button>
                            </div>
                          )}

                          {/* Price input */}
                          <div className="vm-price-field">
                            <span className="vm-price-rs">₹</span>
                            <input
                              type="number"
                              className="vm-price-input"
                              value={row.price}
                              min={1}
                              max={9999}
                              disabled={!row.enabled}
                              onChange={e => updatePrice(cat, row.name, e.target.value)}
                              placeholder="—"
                            />
                            <span className="vm-price-unit">/pl</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Save / Reset */}
            <div style={{ display:'flex', gap:'10px', marginTop:'20px' }}>
              <button className="btn btn-primary" style={{ flex:1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} onClick={handleSave}>
                {saved ? (
                  <>
                    <Check size={18} />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    <span>Save Menu</span>
                  </>
                )}
              </button>
              <button className="btn btn-secondary" style={{ flex:1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} onClick={handleReset}>
                <RotateCcw size={18} />
                <span>Reset</span>
              </button>
            </div>
            <p style={{ fontSize:'0.7rem', color:'var(--text-muted)', textAlign:'center', marginTop:'10px' }}>
              Customers see your enabled items with these prices on your profile page.
            </p>
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
