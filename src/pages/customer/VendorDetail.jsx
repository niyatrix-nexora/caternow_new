import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { getVendor, getDistance } from '../../utils/data';
import { loadVendorPackages, PACKAGE_META, toggleWishlist, isWishlisted } from '../../utils/packages';
import {
  getVendorMenuForDisplay,
  getVendorLiveCounters,
  loadVendorMenuSelection,
  getDishImage,
  CATEGORY_EMOJI,
  CATEGORY_ORDER,
  groupByCategory,
  MASTER_MENU,
} from '../../utils/masterMenu';

// ── Dot indicator (like Swiggy / Zomato) ──────────────────────────────────────
const SUB_DOT = {
  veg:       { color: '#16a34a', border: '#16a34a' },
  'non-veg': { color: '#dc2626', border: '#dc2626' },
  na:        { color: '#9ca3af', border: '#9ca3af' },
};

function DietDot({ subCategory }) {
  const d = SUB_DOT[subCategory] || SUB_DOT.na;
  if (subCategory === 'na') return null;
  return (
    <div style={{
      width: '14px', height: '14px', borderRadius: '3px', flexShrink: 0,
      border: `1.5px solid ${d.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: d.color }} />
    </div>
  );
}

// ── Fallback: build a display menu from the vendor's package dishes ────────────
function buildFallbackMenu(packages) {
  const seen = new Set();
  const allDishes = [];
  for (const pkg of packages) {
    if (!pkg.isActive) continue;
    for (const dishName of (pkg.dishes || [])) {
      if (seen.has(dishName)) continue;           // ← no duplicates
      seen.add(dishName);
      // Spread the full master item so image, price, etc. are all present
      const master = MASTER_MENU.find(m => m.name === dishName);
      allDishes.push(master
        ? { ...master }                           // ← use real image & price
        : { id: dishName, name: dishName, category: 'Other', subCategory: 'na', type: 'menu_item' }
      );
    }
  }
  if (allDishes.length === 0) return null;
  return groupByCategory(allDishes);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function ratingStars(r) {
  const full = Math.floor(r), half = r % 1 >= 0.5;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - (half ? 1 : 0));
}
function getInitials(name) { return (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(); }
function avatarGrad(type) {
  if (type === 'veg') return 'linear-gradient(135deg,#059669,#047857)';
  if (type === 'nonveg') return 'linear-gradient(135deg,#DC2626,#B91C1C)';
  return 'linear-gradient(135deg,#E8590C,#7C3AED)';
}
const VENDOR_IMAGE_MAP = {
  'Spice Garden Kitchen': '/spice.jpeg',
  'Royal Feast Caterers': '/royal.jpg',
  'Grand Biryani House':  '/grandbiriyani.jpeg',
  'TINNU':                '/tinnu.jpg',
};

// ── Menu search + filter state (local to menu tab) ────────────────────────────
function MenuTab({ vendor, packages }) {
  const [search,    setSearch]    = useState('');
  const [subFilter, setSubFilter] = useState('all');
  const [activecat, setActivecat] = useState('all');

  const configuredMenu = getVendorMenuForDisplay(vendor.id);
  const liveCounters   = getVendorLiveCounters(vendor.id);
  const displayMenu    = configuredMenu || buildFallbackMenu(packages);
  const hasFallback    = !configuredMenu && !!displayMenu;

  if (!displayMenu) {
    return (
      <div className="empty-state" style={{ padding: '32px 16px' }}>
        <div className="empty-icon">🍽️</div>
        <h3>Menu not configured</h3>
        <p>This vendor hasn't published their menu yet.</p>
      </div>
    );
  }

  const allCategories = Object.keys(displayMenu);
  const totalItems    = Object.values(displayMenu).reduce((s, arr) => s + arr.length, 0);

  const filteredMenu = {};
  for (const [cat, items] of Object.entries(displayMenu)) {
    if (activecat !== 'all' && cat !== activecat) continue;
    const filtered = items.filter(item => {
      const searchTarget = (item.displayName || item.name).toLowerCase();
      const matchName = searchTarget.includes(search.toLowerCase());
      const matchSub  = subFilter === 'all' || item.subCategory === subFilter;
      return matchName && matchSub;
    });
    if (filtered.length > 0) filteredMenu[cat] = filtered;
  }

  return (
    <div className="vd-menu">
      {/* Info strip */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px',
        padding: '10px 12px', borderRadius: '14px',
        background: hasFallback ? 'rgba(217,119,6,0.08)' : 'rgba(5,150,105,0.08)',
        border: `1px solid ${hasFallback ? 'rgba(217,119,6,0.2)' : 'rgba(5,150,105,0.2)'}`,
      }}>
        <span style={{ fontSize: '1rem' }}>{hasFallback ? '📦' : '✅'}</span>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: hasFallback ? '#D97706' : '#059669' }}>
            {hasFallback ? 'Menu from packages' : 'Vendor curated menu'}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            {totalItems} items · prices per plate
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        background: 'var(--bg-input)', border: '1.5px solid var(--border)',
        borderRadius: '12px', padding: '9px 12px', marginBottom: '10px',
      }}>
        <span style={{ opacity: 0.4 }}>🔍</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search dishes…"
          style={{ flex: 1, border: 'none', background: 'transparent', color: 'var(--text)', fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit' }}
        />
        {search && (
          <button onClick={() => setSearch('')}
            style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem', padding: 0 }}>✕</button>
        )}
      </div>

      {/* Sub-category filter */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
        {['all', 'veg', 'non-veg'].map(f => (
          <button key={f} onClick={() => setSubFilter(f)} style={{
            padding: '5px 12px', borderRadius: '999px',
            border: `1.5px solid ${subFilter === f ? '#FF6B00' : 'var(--border)'}`,
            background: subFilter === f ? 'rgba(255,107,0,0.1)' : 'var(--bg-card)',
            color: subFilter === f ? '#FF6B00' : 'var(--text-muted)',
            fontWeight: subFilter === f ? 700 : 500, fontSize: '0.75rem',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            {f === 'all' ? '🍽️ All' : f === 'veg' ? '🟢 Veg' : '🔴 Non-Veg'}
          </button>
        ))}
      </div>

      {/* Category quick-jump pills */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '14px' }}>
        <button
          onClick={() => setActivecat('all')}
          style={{
            padding: '4px 10px', borderRadius: '999px', whiteSpace: 'nowrap', flexShrink: 0,
            border: `1.5px solid ${activecat === 'all' ? '#FF6B00' : 'var(--border)'}`,
            background: activecat === 'all' ? 'rgba(255,107,0,0.1)' : 'var(--bg-card)',
            color: activecat === 'all' ? '#FF6B00' : 'var(--text-muted)',
            fontSize: '0.7rem', fontWeight: activecat === 'all' ? 700 : 500,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >All</button>
        {allCategories.map(cat => (
          <button key={cat} onClick={() => setActivecat(cat)} style={{
            padding: '4px 10px', borderRadius: '999px', whiteSpace: 'nowrap', flexShrink: 0,
            border: `1.5px solid ${activecat === cat ? '#FF6B00' : 'var(--border)'}`,
            background: activecat === cat ? 'rgba(255,107,0,0.1)' : 'var(--bg-card)',
            color: activecat === cat ? '#FF6B00' : 'var(--text-muted)',
            fontSize: '0.7rem', fontWeight: activecat === cat ? 700 : 500,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            {CATEGORY_EMOJI[cat] || '🍽️'} {cat}
          </button>
        ))}
      </div>

      {/* Empty */}
      {Object.keys(filteredMenu).length === 0 && (
        <div className="empty-state" style={{ padding: '24px 16px' }}>
          <div className="empty-icon" style={{ fontSize: '2rem' }}>🔍</div>
          <p style={{ fontSize: '0.88rem' }}>No dishes match your search.</p>
        </div>
      )}

      {/* Category sections — image-card style */}
      {Object.entries(filteredMenu).map(([catLabel, items]) => (
        <div key={catLabel} style={{
          marginBottom: '16px', borderRadius: '18px', overflow: 'hidden',
          border: '1.5px solid var(--border)', background: 'var(--bg-card)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '12px 14px', borderBottom: '1px solid var(--border)',
            background: 'var(--bg-elevated)',
          }}>
            <span style={{ fontSize: '1.1rem' }}>{CATEGORY_EMOJI[catLabel] || '🍽️'}</span>
            <span style={{ fontWeight: 800, fontSize: '0.9rem', flex: 1 }}>{catLabel}</span>
            <span style={{
              fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px',
              background: 'rgba(255,107,0,0.1)', color: '#FF6B00', border: '1px solid rgba(255,107,0,0.2)',
            }}>{items.length} items</span>
          </div>
          {items.map((item, idx) => {
            const dishName  = item.displayName || item.name;
            const dishPrice = item.displayPrice ?? item.price ?? 0;
            const dotColor  = item.subCategory === 'non-veg' ? '#dc2626'
                            : item.subCategory === 'veg'     ? '#16a34a' : null;
            return (
              <div key={item.id || item.name} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px',
                borderBottom: idx < items.length - 1 ? '1px solid var(--border)' : 'none',
                animation: `fadeInUp 0.3s ease ${idx * 0.03}s both`,
              }}>
                <div style={{
                  width: 72, height: 72, borderRadius: 14, flexShrink: 0,
                  overflow: 'hidden', border: '1px solid var(--border)',
                  background: 'var(--bg-elevated)', position: 'relative',
                }}>
                  <img
                    src={getDishImage(item)}
                    alt={dishName}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    onError={e => {
                      const fallbacks = {
                        'Beverages': '/dish-raita.png',
                        'Desserts & Sweets': '/dish-gulab.png',
                        'Indian Breads': '/dish-naan.png',
                        'Rice Items': '/rice-real.png',
                        'Biryanis': '/dish-biryani.png',
                        'Non-Veg Curries': '/dish-butter-chicken.png',
                        'Non-Veg Starters': '/dish-samosa.png',
                        'South Indian Specials': '/dish-dal.png',
                        'Salads & Accompaniments': '/dish-raita.png',
                        'Live Counters': '/dish-chutney.png',
                      };
                      e.currentTarget.src = fallbacks[item.category] || '/dish-paneer.png';
                    }}
                  />
                  {dotColor && (
                    <div style={{
                      position: 'absolute', top: 4, left: 4,
                      width: 14, height: 14, borderRadius: 3,
                      background: '#fff', border: `1.5px solid ${dotColor}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor }} />
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>{dishName}</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FF6B00' }}>
                    ₹{dishPrice}<span style={{ fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.72rem' }}>/plate</span>
                  </div>
                  {item.name !== dishName && (
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 2 }}>also known as {item.name}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {/* Live counters */}
      {liveCounters.length > 0 && (
        <div style={{
          marginBottom: '16px', borderRadius: '18px', overflow: 'hidden',
          border: '1.5px solid rgba(234,88,12,0.25)', background: 'var(--bg-card)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '12px 14px', borderBottom: '1px solid var(--border)',
            background: 'rgba(234,88,12,0.06)',
          }}>
            <span style={{ fontSize: '1.1rem' }}>🔥</span>
            <span style={{ fontWeight: 800, fontSize: '0.9rem', flex: 1 }}>Live Counters</span>
            <span style={{
              fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px',
              background: 'rgba(234,88,12,0.12)', color: '#EA580C', border: '1px solid rgba(234,88,12,0.25)',
            }}>Live</span>
          </div>
          {liveCounters.map((item, idx) => (
            <div key={item.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
              borderBottom: idx < liveCounters.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: 14, flexShrink: 0,
                overflow: 'hidden', border: '1px solid rgba(234,88,12,0.25)',
                background: 'var(--bg-elevated)',
              }}>
                <img
                  src={getDishImage(item)}
                  alt={item.displayName || item.name}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  onError={e => { e.currentTarget.src = '/dish-chutney.png'; }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>{item.displayName || item.name}</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#EA580C' }}>
                  ₹{item.displayPrice ?? item.price ?? 0}<span style={{ fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.72rem' }}>/plate</span>
                </div>
              </div>
              <span style={{
                fontSize: '0.65rem', fontWeight: 700, padding: '3px 8px', borderRadius: '999px',
                background: 'rgba(234,88,12,0.1)', border: '1px solid rgba(234,88,12,0.25)', color: '#EA580C',
              }}>🔥 Live</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function VendorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useApp();
  const [vendor,    setVendor]    = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState('packages');
  const [packages,  setPackages]  = useState([]);
  const [wishlisted, setWishlisted] = useState(false);
  const [wishAnim,   setWishAnim]   = useState(false);

  useEffect(() => { if (!user || user.role !== 'customer') navigate('/'); }, [user, navigate]);

  useEffect(() => {
    getVendor(id).then(v => {
      if (v) {
        setVendor({ ...v, distance: getDistance(12.9716, 77.5946, v.lat, v.lng) });
        setPackages(loadVendorPackages(v.id));
        setWishlisted(isWishlisted(user?.id || 'guest', v.id));
      }
      setLoading(false);
    });
  }, [id, user?.id]);

  const handleWishlist = () => {
    const newList = toggleWishlist(user?.id || 'guest', id);
    setWishlisted(newList.includes(id));
    setWishAnim(true);
    setTimeout(() => setWishAnim(false), 600);
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="app-container">
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate('/customer/vendors')}>←</button>
          <h1>Vendor Profile</h1>
        </div>
        <div className="page" style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="app-container">
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate('/customer/vendors')}>←</button>
          <h1>Not Found</h1>
        </div>
        <div className="page">
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>Vendor not found</h3>
            <p>This vendor may no longer be active.</p>
            <button className="btn btn-secondary mt-md" onClick={() => navigate('/customer/vendors')}>Back to Search</button>
          </div>
        </div>
      </div>
    );
  }

  const foodLabel  = { veg: '🟢 Veg', nonveg: '🔴 Non-Veg', both: '🟠 Veg + Non-Veg' };
  const badgeCls   = { veg: 'badge-veg', nonveg: 'badge-nonveg', both: 'badge-both' };
  const vendorImg  = VENDOR_IMAGE_MAP[vendor.name] || null;
  const activePackages = packages.filter(p => p.isActive);

  // Count menu items for stats
  const enabledIds     = loadVendorMenuSelection(vendor.id);
  const menuItemCount  = enabledIds.size || packages.reduce((s, p) => s + (p.isActive ? (p.dishes || []).length : 0), 0);

  return (
    <div className="app-container">
      {/* ── Header ── */}
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/customer/vendors')}>←</button>
        <h1>Vendor Profile</h1>
        <button
          onClick={handleWishlist}
          style={{
            width: '36px', height: '36px', borderRadius: '50%',
            border: '1px solid var(--border)', background: 'var(--bg-card)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: '1.2rem',
            transform: wishAnim ? 'scale(1.4)' : 'scale(1)',
            transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          }}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          {wishlisted ? '❤️' : '🤍'}
        </button>
      </div>

      <div className="page">

        {/* ── Hero ── */}
        <div
          className="vd-hero"
          style={vendorImg ? {
            backgroundImage: `linear-gradient(0deg, rgba(30,30,30,0.82), rgba(30,30,30,0.16)), url('${vendorImg}')`,
            backgroundSize: 'cover', backgroundPosition: 'center',
          } : undefined}
        >
          <div className="vd-avatar" style={{ background: avatarGrad(vendor.foodType), overflow: 'hidden', padding: 0 }}>
            {vendorImg ? (
              <img src={vendorImg} alt={vendor.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement.textContent = getInitials(vendor.name); }} />
            ) : getInitials(vendor.name)}
          </div>
          <div className="vd-hero-body">
            <h2 className="vd-name">{vendor.name}</h2>
            <div className="vd-meta-row">
              <span className={`badge ${badgeCls[vendor.foodType]}`}>{foodLabel[vendor.foodType]}</span>
              <span className="vd-dist">📍 {vendor.distance?.toFixed(1)} km away</span>
            </div>
            {vendor.rating > 0 && (
              <div className="vd-rating">
                <span className="vd-stars">{ratingStars(vendor.rating)}</span>
                <span className="vd-rating-num">{vendor.rating.toFixed(1)}</span>
                <span className="vd-rating-max">/ 5.0</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="vd-stats">
          <div className="vd-stat">
            <span className="vd-stat-icon">📡</span>
            <span className="vd-stat-value">{vendor.radius} km</span>
            <span className="vd-stat-label">Service Radius</span>
          </div>
          <div className="vd-stat-divider" />
          <div className="vd-stat">
            <span className="vd-stat-icon">🍽️</span>
            <span className="vd-stat-value">{menuItemCount}</span>
            <span className="vd-stat-label">Menu Items</span>
          </div>
          <div className="vd-stat-divider" />
          <div className="vd-stat">
            <span className="vd-stat-icon">📦</span>
            <span className="vd-stat-value">{activePackages.length}</span>
            <span className="vd-stat-label">Packages</span>
          </div>
        </div>

        {/* ── Info card ── */}
        <div className="vd-info-card">
          {vendor.fssai && (
            <div className="vd-info-row">
              <span className="vd-info-icon">✅</span>
              <div>
                <div className="vd-info-label">FSSAI License</div>
                <div className="vd-info-value vd-fssai">{vendor.fssai}</div>
              </div>
            </div>
          )}
          <div className="vd-info-row">
            <span className="vd-info-icon">📞</span>
            <div>
              <div className="vd-info-label">Contact</div>
              <div className="vd-info-value">Available after booking</div>
            </div>
          </div>
          <div className="vd-info-row">
            <span className="vd-info-icon">🍱</span>
            <div>
              <div className="vd-info-label">Speciality</div>
              <div className="vd-info-value">{foodLabel[vendor.foodType]} Cuisine</div>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="vd-tabs">
          <button className={`vd-tab ${activeTab === 'packages' ? 'active' : ''}`} onClick={() => setActiveTab('packages')}>
            📦 Packages
          </button>
          <button className={`vd-tab ${activeTab === 'menu' ? 'active' : ''}`} onClick={() => setActiveTab('menu')}>
            📋 Menu
          </button>
          <button className={`vd-tab ${activeTab === 'about' ? 'active' : ''}`} onClick={() => setActiveTab('about')}>
            ℹ️ About
          </button>
        </div>

        {/* ── PACKAGES TAB ── */}
        {activeTab === 'packages' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Choose a package that fits your event. Price is <strong>per plate</strong> — final amount confirmed when vendor bids.
            </p>

            {activePackages.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 16px' }}>
                <div className="empty-icon">📦</div>
                <h3>No packages yet</h3>
                <p>This vendor hasn't set up packages. Post a request and they'll send a custom bid.</p>
              </div>
            ) : (
              activePackages.map((pkg, i) => {
                const meta = PACKAGE_META[pkg.category] || PACKAGE_META.custom;
                return (
                  <div
                    key={pkg.category}
                    style={{
                      background: meta.bg,
                      border: `1.5px solid ${meta.border}`,
                      borderRadius: '22px',
                      padding: '18px',
                      animation: `fadeInUp 0.3s ease ${i * 0.07}s both`,
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                    }}
                    onClick={() => navigate('/customer/new-request')}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                  >
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.6rem' }}>{meta.emoji}</span>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '1rem', color: meta.color }}>{pkg.title}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                            {(pkg.dishes || []).length} dishes included
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: meta.color, lineHeight: 1 }}>
                          ₹{pkg.pricePerPlate}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>/plate</div>
                      </div>
                    </div>

                    {/* Description */}
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
                      {pkg.description}
                    </p>

                    {/* Dish chips with veg/non-veg dots */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '12px' }}>
                      {(pkg.dishes || []).slice(0, 8).map(dishName => {
                        const master = MASTER_MENU.find(m => m.name === dishName);
                        const dotColor = master?.subCategory === 'non-veg' ? '#dc2626' : master?.subCategory === 'veg' ? '#16a34a' : null;
                        return (
                          <span key={dishName} style={{
                            padding: '3px 9px', borderRadius: '999px',
                            background: 'rgba(255,255,255,0.7)',
                            border: `1px solid ${meta.border}`,
                            fontSize: '0.72rem', fontWeight: 600, color: meta.color,
                            display: 'flex', alignItems: 'center', gap: '4px',
                          }}>
                            {dotColor && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: dotColor, flexShrink: 0 }} />}
                            {dishName}
                          </span>
                        );
                      })}
                      {(pkg.dishes || []).length > 8 && (
                        <span style={{
                          padding: '3px 9px', borderRadius: '999px',
                          background: meta.bg, border: `1px solid ${meta.border}`,
                          fontSize: '0.72rem', fontWeight: 700, color: meta.color,
                        }}>
                          +{(pkg.dishes || []).length - 8} more
                        </span>
                      )}
                    </div>

                    {/* Add-ons preview */}
                    {(pkg.addOns || []).length > 0 && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                        ✨ Add-ons: {(pkg.addOns || []).slice(0, 2).join(' · ')}{(pkg.addOns || []).length > 2 ? ` +${(pkg.addOns || []).length - 2} more` : ''}
                      </div>
                    )}

                    {/* CTA */}
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      paddingTop: '10px', borderTop: `1px solid ${meta.border}`,
                    }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: meta.color }}>
                        Select this package →
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Tap to book
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── MENU TAB (Swiggy style) ── */}
        {activeTab === 'menu' && <MenuTab vendor={vendor} packages={packages} />}

        {/* ── ABOUT TAB ── */}
        {activeTab === 'about' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontWeight: 700, marginBottom: '12px' }}>📋 Vendor Details</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { icon: '🍱', label: 'Cuisine Type',   value: foodLabel[vendor.foodType] },
                  { icon: '📡', label: 'Service Radius', value: `${vendor.radius} km` },
                  { icon: '⭐', label: 'Rating',          value: vendor.rating > 0 ? `${vendor.rating.toFixed(1)} / 5.0` : 'Not rated yet' },
                  { icon: '✅', label: 'FSSAI License',   value: vendor.fssai || 'Not provided' },
                  { icon: '📞', label: 'Contact',         value: 'Available after booking confirmation' },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '1rem', flexShrink: 0 }}>{row.icon}</span>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '2px' }}>{row.label}</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{row.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── CTA ── */}
        <div className="vd-cta">
          <button className="btn btn-primary btn-block btn-lg" onClick={() => navigate('/customer/new-request')}>
            🚀 Post a Request
          </button>
          <p className="vd-cta-note">
            Create a catering request and {vendor.name} will be notified if they cover your area.
          </p>
        </div>
      </div>
    </div>
  );
}
