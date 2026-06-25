import { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { getVendors, getDistance } from '../../utils/data';
import { loadVendorPackages, toggleWishlist } from '../../utils/packages';
import { Heart, Search, X, MapPin, Check, Home, PlusCircle, User, Utensils, Leaf, Sparkles, Star } from 'lucide-react';

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

  const foodTypeLabel = { veg: 'Veg', nonveg: 'Non-Veg', both: 'Both' };

  const filtered = vendors
    .filter(v => {
      const matchQuery = v.name.toLowerCase().includes(query.toLowerCase());
      const matchFood = foodFilter === 'all' || v.foodType === foodFilter || v.foodType === 'both';
      return matchQuery && matchFood;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'distance') return (a.distance || 0) - (b.distance || 0);
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
          <div className="logo" style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Utensils size={24} style={{ color: 'var(--primary)' }} />
            <span className="logo-text">Explore Vendors</span>
          </div>
        </div>
      </div>

      <div className="page">
        <div className="vendor-search-bar" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: '12px', marginBottom: '14px' }}>
          <Search size={18} style={{ opacity: 0.5 }} />
          <input
            className="vendor-search-input"
            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', color: 'var(--text)', fontFamily: 'inherit', fontSize: '0.88rem' }}
            placeholder="Search vendors, cuisine..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && <button className="search-clear" onClick={() => setQuery('')} style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}><X size={16} /></button>}
        </div>

        {/* Filters */}
        <div className="filter-row">
          <div className="filter-chips">
            {['all', 'veg', 'nonveg', 'both'].map(f => (
              <button key={f} className={`filter-chip ${foodFilter === f ? 'active' : ''}`} onClick={() => setFoodFilter(f)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                {f === 'all' ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Utensils size={12} /> All</span>
                ) : f === 'veg' ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Leaf size={12} style={{ color: '#10b981' }} /> Veg</span>
                ) : f === 'nonveg' ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Utensils size={12} style={{ color: '#ef4444' }} /> Non-Veg</span>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Sparkles size={12} style={{ color: '#f59e0b' }} /> Both</span>
                )}
              </button>
            ))}
          </div>
          <select className="sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="rating">Top Rated</option>
            <option value="distance">Nearest</option>
            <option value="name">A–Z</option>
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
          <div className="empty-state" style={{ padding: '32px 16px', textAlign: 'center' }}>
            <div className="empty-icon" style={{ display: 'flex', justifyContent: 'center' }}><Search size={32} style={{ color: 'var(--text-muted)' }} /></div>
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
                      <span className="vendor-card-dist" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <MapPin size={10} /> {vendor.distance?.toFixed(1)} km
                      </span>
                    </div>
                    {vendor.rating > 0 && (
                      <div className="vendor-card-rating">
                        <span style={{ color: 'var(--warning)', fontSize: '0.82rem', letterSpacing: '-1px' }}>{ratingStars(vendor.rating)}</span>
                        <span style={{ marginLeft: '5px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{vendor.rating.toFixed(1)}</span>
                      </div>
                    )}
                    {vendor.fssai && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--success)', marginTop: '4px' }}>
                        <Check size={12} /> FSSAI Verified
                      </div>
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
                      {isWished ? <Heart size={16} fill="#DC2626" color="#DC2626" /> : <Heart size={16} color="var(--text-secondary)" />}
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
