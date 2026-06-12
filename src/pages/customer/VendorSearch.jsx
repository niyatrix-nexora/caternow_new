import { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { getVendors, getDistance } from '../../utils/data';
import { loadVendorPackages, toggleWishlist } from '../../utils/packages';

const VENDOR_IMAGE_MAP = {
  'Spice Garden Kitchen': '/spice.jpeg',
  'Royal Feast Caterers': '/royal.jpg',
  'Grand Biryani House': '/grandbiriyani.jpeg',
  'TINNU': '/tinnu.jpg',
};
const FALLBACK_GRADIENTS = {
  veg: 'linear-gradient(135deg,#059669,#047857)',
  nonveg: 'linear-gradient(135deg,#DC2626,#B91C1C)',
  both: 'linear-gradient(135deg,#E8590C,#7C3AED)',
};

function getStartingPrice(vendorId) {
  try {
    const pkgs = loadVendorPackages(vendorId);
    const active = pkgs.filter(p => p.isActive);
    if (active.length === 0) return null;
    return Math.min(...active.map(p => p.pricePerPlate));
  } catch { return null; }
}

export default function VendorSearch() {
  const { user } = useApp();
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [query, setQuery] = useState('');
  const [foodFilter, setFoodFilter] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    if (!user || user.role !== 'customer') navigate('/');
  }, [user, navigate]);

  useEffect(() => {
    getVendors().then(list => {
      const userLat = 12.9716, userLng = 77.5946;
      setVendors(list.map(v => ({ ...v, distance: getDistance(userLat, userLng, v.lat, v.lng) })));
      setLoading(false);
    });
    // Load wishlist
    try {
      const saved = JSON.parse(localStorage.getItem(`caternow_wishlist_${user?.id || 'guest'}`) || '[]');
      setWishlist(saved);
    } catch { /* ignore */ }
  }, [user?.id]);

  const foodTypeLabel = { veg: '🟢 Veg', nonveg: '🔴 Non-Veg', both: '🟠 Both' };

  const filtered = vendors
    .filter(v => {
      const matchQuery = v.name.toLowerCase().includes(query.toLowerCase());
      const matchFood = foodFilter === 'all' || v.foodType === foodFilter || v.foodType === 'both';
      return matchQuery && matchFood;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'distance') return (a.distance || 0) - (b.distance || 0);
      if (sortBy === 'price') return (getStartingPrice(a.id) || 999) - (getStartingPrice(b.id) || 999);
      return a.name.localeCompare(b.name);
    });

  const getInitials = (name) => (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const ratingStars = (rating) => {
    const r = Math.round(rating * 2) / 2;
    const full = Math.floor(r), half = r % 1 !== 0;
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - (half ? 1 : 0));
  };

  const handleWishlist = (e, vendorId) => {
    e.stopPropagation();
    const newList = toggleWishlist(user?.id || 'guest', vendorId);
    setWishlist(newList);
  };

  return (
    <div className="app-container">
      <div className="page-header">
        <div style={{ flex: 1 }}>
          <div className="logo" style={{ fontSize: '1.1rem' }}>
            <span className="logo-icon" style={{ fontSize: '1.4rem' }}>🍽️</span>
            <span className="logo-text">Explore Vendors</span>
          </div>
        </div>
      </div>

      <div className="page">
        {/* Search bar */}
        <div className="vendor-search-bar">
          <span className="search-icon">🔍</span>
          <input
            className="vendor-search-input"
            placeholder="Search vendors, cuisine..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && <button className="search-clear" onClick={() => setQuery('')}>✕</button>}
        </div>

        {/* Filters */}
        <div className="filter-row">
          <div className="filter-chips">
            {['all', 'veg', 'nonveg', 'both'].map(f => (
              <button key={f} className={`filter-chip ${foodFilter === f ? 'active' : ''}`} onClick={() => setFoodFilter(f)}>
                {f === 'all' ? '🍽️ All' : foodTypeLabel[f]}
              </button>
            ))}
          </div>
          <select className="sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="rating">⭐ Top Rated</option>
            <option value="distance">📍 Nearest</option>
            <option value="price">💰 Lowest Price</option>
            <option value="name">🔤 A–Z</option>
          </select>
        </div>

        {!loading && (
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
            {filtered.length} vendor{filtered.length !== 1 ? 's' : ''} found
          </p>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '60px' }}>
            <div className="loading-spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>No vendors found</h3>
            <p>Try a different search term or filter.</p>
          </div>
        ) : (
          <div className="vendor-list">
            {filtered.map((vendor, i) => {
              const img = VENDOR_IMAGE_MAP[vendor.name];
              const grad = FALLBACK_GRADIENTS[vendor.foodType] || FALLBACK_GRADIENTS.both;
              const startingPrice = getStartingPrice(vendor.id);
              const isWished = wishlist.includes(vendor.id);

              return (
                <div
                  key={vendor.id}
                  className="vendor-card"
                  style={{ animationDelay: `${i * 0.04}s`, cursor: 'pointer', position: 'relative' }}
                  onClick={() => navigate(`/customer/vendors/${vendor.id}`)}
                >
                  {/* Vendor photo */}
                  <div className="vendor-avatar-lg" style={{ padding: 0, overflow: 'hidden', background: grad, flexShrink: 0 }}>
                    {img ? (
                      <img src={img} alt={vendor.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement.textContent = getInitials(vendor.name); e.currentTarget.parentElement.style.display = 'flex'; e.currentTarget.parentElement.style.alignItems = 'center'; e.currentTarget.parentElement.style.justifyContent = 'center'; }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '1rem' }}>
                        {getInitials(vendor.name)}
                      </div>
                    )}
                  </div>

                  <div className="vendor-card-body">
                    <div className="vendor-card-name">{vendor.name}</div>
                    <div className="vendor-card-meta">
                      <span className={`badge ${vendor.foodType === 'veg' ? 'badge-veg' : vendor.foodType === 'nonveg' ? 'badge-nonveg' : 'badge-both'}`}>
                        {foodTypeLabel[vendor.foodType] || vendor.foodType}
                      </span>
                      <span className="vendor-card-dist">📍 {vendor.distance?.toFixed(1)} km</span>
                    </div>
                    {vendor.rating > 0 && (
                      <div className="vendor-card-rating">
                        <span style={{ color: 'var(--warning)', fontSize: '0.82rem', letterSpacing: '-1px' }}>{ratingStars(vendor.rating)}</span>
                        <span style={{ marginLeft: '5px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{vendor.rating.toFixed(1)}</span>
                      </div>
                    )}
                    {/* Starting price from packages */}
                    {startingPrice && (
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        marginTop: '5px', padding: '3px 8px', borderRadius: '999px',
                        background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.2)',
                      }}>
                        <span style={{ fontSize: '0.68rem', color: '#059669', fontWeight: 700 }}>
                          From ₹{startingPrice}/plate
                        </span>
                      </div>
                    )}
                    {vendor.fssai && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--success)', marginTop: '4px' }}>✅ FSSAI Verified</div>
                    )}
                  </div>

                  <div className="vendor-card-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    {/* Wishlist button */}
                    <button
                      onClick={e => handleWishlist(e, vendor.id)}
                      style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        border: '1px solid var(--border)', background: 'var(--bg-card)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', fontSize: '1rem',
                        transition: 'transform 0.2s',
                      }}
                      aria-label="Toggle wishlist"
                    >
                      {isWished ? '❤️' : '🤍'}
                    </button>
                    <div className="vendor-card-radius">Serves {vendor.radius} km</div>
                    <div style={{ color: 'var(--primary-light)', fontSize: '1rem' }}>›</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bottom-nav">
        <NavLink to="/customer" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
          <span className="nav-icon">🏠</span><span>Home</span>
        </NavLink>
        <NavLink to="/customer/new-request" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">➕</span><span>New</span>
        </NavLink>
        <NavLink to="/customer/vendors" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">🔍</span><span>Vendors</span>
        </NavLink>
        <NavLink to="/customer/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">👤</span><span>Profile</span>
        </NavLink>
      </div>
    </div>
  );
}
