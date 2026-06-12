import { useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { subscribeToAllRequests } from '../../utils/data';

// Stable, reliable Indian food images (Unsplash with crossOrigin-safe format)
const FOOD_IMAGES = [
  '/spice.jpeg',
  '/royal.jpg',
  '/grandbiriyani.jpeg',
  '/tinnu.jpg',
  'https://images.unsplash.com/photo-1630383249896-424e482df921?w=600&q=80',
  'https://images.unsplash.com/photo-1587899897387-091b99d9b1b5?w=600&q=80',
];

// Map vendor names to their specific images (in order)
const VENDOR_IMAGE_MAP = {
  'Spice Garden Kitchen':  '/spice.jpeg',
  'Royal Feast Caterers':  '/royal.jpg',
  'Grand Biryani House':   '/grandbiriyani.jpeg',
  'TINNU':                 '/tinnu.jpg',
};

function getVendorImage(vendor, index) {
  return VENDOR_IMAGE_MAP[vendor.name] || FOOD_IMAGES[index % FOOD_IMAGES.length];
}

// Fallback gradient colors when image fails to load
const FALLBACK_GRADIENTS = [
  'linear-gradient(135deg,#E8590C,#FF8C42)',
  'linear-gradient(135deg,#7C3AED,#A855F7)',
  'linear-gradient(135deg,#059669,#10B981)',
  'linear-gradient(135deg,#DC2626,#EF4444)',
  'linear-gradient(135deg,#D97706,#F59E0B)',
  'linear-gradient(135deg,#0891B2,#06B6D4)',
];

function imgWithFallback(e, idx) {
  e.currentTarget.style.display = 'none';
  const parent = e.currentTarget.parentElement;
  if (parent) parent.style.background = FALLBACK_GRADIENTS[idx % FALLBACK_GRADIENTS.length];
}

const CATEGORIES = ['Wedding', 'Birthday', 'Corporate', 'Veg', 'Non-Veg', 'Luxury'];

export default function CustomerDashboard() {
  const { user, refresh, requests: allRequests, bids: allBids, vendors } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'customer') navigate('/');
  }, [user, navigate]);

  useEffect(() => {
    if (!user) return undefined;
    const unsub = subscribeToAllRequests(() => refresh());
    return () => unsub();
  }, [user, refresh]);

  if (!user) return null;

  const requests = allRequests.filter((r) => r.customerPhone === user.phone);
  const activeRequests = requests.filter((r) => r.status !== 'completed' && r.status !== 'cancelled');
  const totalBidCount = allBids.filter((bid) => requests.some((req) => req.id === bid.requestId)).length;
  const topVendors = [...vendors].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 4);

  const latestActive = activeRequests[0];

  const packages = [
    { name: 'Royal Wedding', price: 320, meta: '24 dishes | live counters', img: '/royal.jpg', imgIdx: 0 },
    { name: 'Classic Feast', price: 220, meta: '16 dishes | full service', img: '/spice.jpeg', imgIdx: 1 },
    { name: 'Premium Biryani', price: 280, meta: 'Chef special | fast bids', img: '/grandbiriyani.jpeg', imgIdx: 2 },
  ];

  return (
    <div className="app-container premium-shell">
      <div className="home-topbar">
        <button className="location-pill" type="button" onClick={() => alert('Location selector coming soon!')}>
          <span>Hyderabad</span>
          <small>Deliver to current area</small>
        </button>
        <button className="icon-button" type="button" aria-label="Notifications" onClick={() => alert('No new notifications')}>!</button>
        <div className="avatar-button">
          {(user.name || 'CN').slice(0, 1).toUpperCase()}
        </div>
      </div>

      <div className="page home-page">
        <button className="home-search" type="button" onClick={() => navigate('/customer/vendors')}>
          <span>Search vendors, cuisine, events...</span>
          <strong>Search</strong>
        </button>

        <div className="category-rail">
          {CATEGORIES.map((category) => (
            <button key={category} className="category-chip" type="button" onClick={() => navigate('/customer/vendors')}>
              {category}
            </button>
          ))}
        </div>

        <div className="stats-row home-stats">
          <div className="stat-card">
            <div className="stat-value">{requests.length}</div>
            <div className="stat-label">Bookings</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{activeRequests.length}</div>
            <div className="stat-label">Active</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{totalBidCount}</div>
            <div className="stat-label">Bids</div>
          </div>
        </div>

        {latestActive && (
          <section className="tracking-card" onClick={() => navigate(`/customer/request/${latestActive.id}`)}>
            <div>
              <span className="eyebrow">Live Event</span>
              <h3>Catering Order #{latestActive.id?.split('_')[1]?.slice(-4)}</h3>
              <p>{latestActive.plates} guests | {latestActive.currentRadius} km search radius</p>
            </div>
            <span className={`badge badge-${latestActive.status}`}>{latestActive.status}</span>
          </section>
        )}

        <div className="section-heading">
          <h2>Popular Packages</h2>
          <button type="button" onClick={() => navigate('/customer/new-request')}>View all</button>
        </div>

        <div className="package-rail">
          {packages.map((pack) => (
            <button key={pack.name} className="package-card" type="button" onClick={() => navigate('/customer/new-request')}>
              <div className="package-card-img" style={{ background: FALLBACK_GRADIENTS[pack.imgIdx] }}>
                <img
                  src={pack.img}
                  alt={pack.name}
                  loading="eager"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <span className="save-dot">♡</span>
              <strong>{pack.name}</strong>
              <small>{pack.meta}</small>
              <span className="price-line">₹{pack.price}/plate</span>
            </button>
          ))}
        </div>

        <div className="section-heading">
          <h2>Top Vendors</h2>
          <button type="button" onClick={() => navigate('/customer/vendors')}>View all</button>
        </div>

        <div className="vendor-list">
          {topVendors.map((vendor, index) => (
            <button
              key={vendor.id}
              className="vendor-card premium-vendor-card"
              type="button"
              onClick={() => navigate(`/customer/vendors/${vendor.id}`)}
            >
              <div
                className="vendor-photo"
                style={{ background: FALLBACK_GRADIENTS[index % FALLBACK_GRADIENTS.length] }}
              >
                <img
                  src={getVendorImage(vendor, index)}
                  alt={vendor.name}
                  loading="eager"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: 'inherit' }}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
              <div className="vendor-card-body">
                <div className="vendor-card-name">{vendor.name}</div>
                <div className="vendor-card-meta">
                  <span className="rating-pill">★ {(vendor.rating || 4.5).toFixed(1)}</span>
                  <span>{vendor.foodType === 'both' ? 'Veg + Non-Veg' : vendor.foodType}</span>
                </div>
                <div className="vendor-tags">
                  <span>{vendor.radius || 20} km</span>
                  <span>FSSAI verified</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {requests.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">+</div>
            <h3>Create your first event</h3>
            <p>Share guest count, budget, and location to receive nearby vendor bids.</p>
            <button className="btn btn-primary mt-md" type="button" onClick={() => navigate('/customer/new-request')}>
              Create Event Request
            </button>
          </div>
        )}
      </div>

      <div className="bottom-nav">
        <NavLink to="/customer" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
          <span className="nav-icon">⌂</span>
          <span>Home</span>
        </NavLink>
        <NavLink to="/customer/new-request" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">+</span>
          <span>Request</span>
        </NavLink>
        <NavLink to="/customer/vendors" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">⌕</span>
          <span>Search</span>
        </NavLink>
        <NavLink to="/customer/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">◉</span>
          <span>Profile</span>
        </NavLink>
      </div>
    </div>
  );
}
