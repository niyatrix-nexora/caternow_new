import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { createRequest, getVendorsInRadius } from '../../utils/data';
import { PACKAGE_META } from '../../utils/packages';
import BananaLeaf from './BananaLeaf';
import { Icon } from '../../utils/iconHelper';
import { Leaf, Utensils, Sparkle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function LocationPicker({ position, setPosition }) {
  useMapEvents({ click(e) { setPosition([e.latlng.lat, e.latlng.lng]); } });
  return position ? (
    <>
      <Marker position={position} />
      <Circle center={position} radius={10000} pathOptions={{ color: '#FF6B00', fillColor: '#FF6B00', fillOpacity: 0.08, weight: 2, dashArray: '8 4' }} />
    </>
  ) : null;
}

// ── Dish pools split by food type ────────────────────────────────────────────
const VEG_STARTERS   = ['Paneer Tikka', 'Veg Spring Rolls', 'Samosa', 'Hara Bhara Kabab', 'Dahi Puri', 'Aloo Tikki'];
const NONVEG_STARTERS = ['Chicken Tikka', 'Seekh Kabab', 'Fish Fingers', 'Tandoori Chicken', 'Chicken Lollipop', 'Prawn Cocktail'];
const VEG_MAINS      = ['Dal Makhani', 'Palak Paneer', 'Shahi Paneer', 'Chana Masala', 'Kadai Paneer', 'Veg Biryani', 'Mix Veg Curry'];
const NONVEG_MAINS   = ['Butter Chicken', 'Chicken Biryani', 'Mutton Curry', 'Fish Curry', 'Chicken Curry', 'Prawn Masala'];
const BREADS         = ['Butter Naan', 'Paratha', 'Steamed Rice', 'Jeera Rice'];
const DESSERTS       = ['Gulab Jamun', 'Kheer', 'Rasgulla', 'Kulfi', 'Ice Cream', 'Rasmalai'];
const BEVERAGES      = ['Masala Lassi', 'Fresh Juice', 'Cold Drinks', 'Buttermilk'];

// Build dishes list based on food type
function buildDishes(foodType, tier) {
  const isVeg    = foodType === 'veg';
  const isNonveg = foodType === 'nonveg';

  const starters = isVeg    ? VEG_STARTERS.slice(0, tier === 'standard' ? 2 : tier === 'special' ? 3 : 4)
                 : isNonveg ? NONVEG_STARTERS.slice(0, tier === 'standard' ? 2 : tier === 'special' ? 3 : 4)
                 : /* both */ [...VEG_STARTERS.slice(0, tier === 'standard' ? 1 : 2), ...NONVEG_STARTERS.slice(0, tier === 'standard' ? 1 : tier === 'special' ? 2 : 3)];

  const mains = isVeg    ? VEG_MAINS.slice(0, tier === 'standard' ? 3 : tier === 'special' ? 4 : 5)
              : isNonveg ? [...NONVEG_MAINS.slice(0, tier === 'standard' ? 2 : tier === 'special' ? 3 : 4), ...VEG_MAINS.slice(0, 1)]
              : /* both */ [...VEG_MAINS.slice(0, tier === 'standard' ? 2 : 3), ...NONVEG_MAINS.slice(0, tier === 'standard' ? 1 : tier === 'special' ? 2 : 3)];

  const breads   = BREADS.slice(0, tier === 'standard' ? 2 : 3);
  const desserts = DESSERTS.slice(0, tier === 'standard' ? 2 : tier === 'special' ? 3 : 4);
  const drinks   = BEVERAGES.slice(0, tier === 'standard' ? 1 : 2);

  return [...starters, ...mains, ...breads, ...desserts, ...drinks];
}

// ── Package definitions (food-type aware) ─────────────────────────────────────
function getPackages(foodType) {
  const ft = foodType || 'both';
  return [
    {
      category: 'standard',
      title: 'Standard',
      price: 220,
      description: 'Full course meal · 2 starters · 3 mains · breads · 2 desserts · beverage',
      dishes: buildDishes(ft, 'standard'),
      iconName: 'Leaf',
    },
    {
      category: 'special',
      title: 'Special',
      price: 320,
      description: 'Premium ingredients · live counters · 3 starters · 4 mains · 3 desserts · 2 beverages',
      dishes: buildDishes(ft, 'special'),
      iconName: 'Star',
    },
    {
      category: 'premium',
      title: 'Premium',
      price: 550,
      description: 'Luxury gourmet spread · 5+ starters · 6+ mains · unlimited desserts · live counters',
      dishes: buildDishes(ft, 'premium'),
      iconName: 'Crown',
    },
    {
      category: 'custom',
      title: 'Custom',
      price: null,
      description: 'Fully customizable menu. Discuss directly with vendors to get the best deal.',
      dishes: [],
      iconName: 'Pencil',
    },
  ];
}

const STEPS = ['Details', 'Package', 'Review'];

export default function NewRequest() {
  const { user, refresh } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Step 1
  const [eventName, setEventName] = useState('Wedding Reception');
  const [eventDate, setEventDate] = useState('');
  const [guests, setGuests] = useState('300');
  const [foodType, setFoodType] = useState('both');
  const [position, setPosition] = useState(null);
  const [vendorCount, setVendorCount] = useState(0);

  // Vendor pre-selection (when navigating from a specific vendor's page)
  const fromVendorId   = location.state?.vendorId   || null;
  const fromVendorName = location.state?.vendorName || null;
  const fromPkgCat     = location.state?.packageCategory || null;

  // Step 2
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showLeafPreview, setShowLeafPreview] = useState(false);
  // Custom package data returned from CustomPackage screen
  const [customDishes, setCustomDishes] = useState([]);
  const [customBudget, setCustomBudget] = useState(0);



  // Pre-select the package when arriving from a vendor's package card
  useEffect(() => {
    if (fromPkgCat) {
      const matched = getPackages(foodType).find(p => p.category === fromPkgCat);
      if (matched) setSelectedPackage(matched);
    }
  }, [fromPkgCat]);

  // Pick up custom package data when navigating back from CustomPackage
  useEffect(() => {
    if (location.state?.customDishes) {
      setCustomDishes(location.state.customDishes);
      setCustomBudget(location.state.customBudget || 0);
      const customPkg = getPackages(foodType).find(p => p.category === 'custom');
      if (customPkg) {
        setSelectedPackage({ ...customPkg, dishes: location.state.customDishes, price: location.state.customBudget || null });
      }
      setStep(2);
    }
  }, [location.state]);

  useEffect(() => {
    if (!user || user.role !== 'customer') navigate('/');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0);
    setEventDate(tomorrow.toISOString().slice(0, 16));
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setPosition([pos.coords.latitude, pos.coords.longitude]),
        () => setPosition([12.9716, 77.5946])
      );
    } else {
      setTimeout(() => setPosition([12.9716, 77.5946]), 0);
    }
  }, [user, navigate]);

  useEffect(() => {
    if (position) {
      getVendorsInRadius(position[0], position[1], 10, foodType).then(v => setVendorCount(v.length));
    }
  }, [position, foodType]);



  const validateStep = () => {
    setError('');
    if (step === 1) {
      if (!eventName.trim()) return setError('Event name is required');
      if (!eventDate) return setError('Event date is required');
      if (!guests || parseInt(guests) < 10) return setError('Minimum 10 guests required');
      if (!position) return setError('Please select a location on the map');
    }
    if (step === 2) {
      if (!selectedPackage) return setError('Please select a package');
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    // If a package is already pre-selected (from dashboard or vendor page),
    // skip the package-selection step and jump straight to review.
    if (step === 1 && selectedPackage) {
      setStep(3);
    } else {
      setStep(s => s + 1);
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    const menuNotes = selectedPackage?.category === 'custom'
      ? 'Custom package — discuss with vendor'
      : (selectedPackage?.dishes || []).slice(0, 5).join(', ');

    const req = await createRequest({
      eventName: eventName.trim(),
      eventDate,
      plates: parseInt(guests),
      foodType,
      menuNotes,
      packageType: selectedPackage?.title || 'Custom',
      packageDishes: selectedPackage?.dishes || [],
      packageCategory: selectedPackage?.category,
      lat: position[0],
      lng: position[1],
      customerId: user.id,
      customerName: user.name || 'Customer',
      customerPhone: user.phone || '',
      // Pre-link to a specific vendor when coming from their page
      ...(fromVendorId ? { preferredVendorId: fromVendorId, preferredVendorName: fromVendorName } : {}),
    });

    if (req) {
      await refresh();
      navigate('/customer');
    } else {
      setError('Failed to create request. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="app-container">
      {/* ── Header ── */}
      <div className="page-header">
        <button className="back-btn" onClick={() => {
          if (step === 3 && selectedPackage && (fromPkgCat)) {
            // Came from a pre-selected package: back goes to step 1, not step 2
            setStep(1);
          } else if (step > 1) {
            setStep(s => s - 1);
          } else {
            navigate('/customer');
          }
        }}>←</button>
        <h1>{STEPS[step - 1]}</h1>
      </div>

      {/* ── Progress stepper ── */}
      <div style={{ display: 'flex', padding: '14px 18px 10px', gap: '0', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
        {STEPS.map((label, i) => {
          const num = i + 1;
          const done = step > num;
          const active = step === num;
          return (
            <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', position: 'relative' }}>
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div style={{
                  position: 'absolute', top: '12px', left: '50%', width: '100%', height: '2px',
                  background: done ? '#FF6B00' : 'var(--border)', zIndex: 0,
                }} />
              )}
              <div style={{
                width: '24px', height: '24px', borderRadius: '50%', zIndex: 1,
                background: done ? '#FF6B00' : active ? '#FF6B00' : 'var(--border)',
                color: (done || active) ? '#fff' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 800,
                boxShadow: active ? '0 0 0 4px rgba(255,107,0,0.2)' : 'none',
                transition: 'all 0.3s',
              }}>
                {done ? <Icon name="Check" size={12} strokeWidth={3} /> : num}
              </div>
              <div style={{ fontSize: '0.6rem', fontWeight: 700, color: active ? '#FF6B00' : done ? '#FF6B00' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                {label}
              </div>
            </div>
          );
        })}
      </div>

      <div className="page" style={{ paddingBottom: '90px' }}>
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#FEE2E2', color: '#991B1B', padding: '12px 16px', borderRadius: '14px', marginBottom: '16px', fontSize: '0.88rem', fontWeight: 500 }}>
            <Icon name="AlertTriangle" size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Vendor-targeted banner */}
        {fromVendorName && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            background: 'rgba(232,89,12,0.08)', border: '1.5px solid rgba(232,89,12,0.25)',
            borderRadius: '16px', padding: '12px 16px', marginBottom: '16px',
          }}>
            <Icon name="Target" size={24} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--primary)' }}>
                Requesting from {fromVendorName}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {selectedPackage ? `${selectedPackage.title} package pre-selected` : 'Will go directly to this vendor.'}
                {selectedPackage && (
                  <button onClick={() => setStep(2)} style={{
                    marginLeft: '8px', border: 'none', background: 'transparent',
                    color: 'var(--primary)', fontSize: '0.72rem', fontWeight: 700,
                    cursor: 'pointer', padding: 0, textDecoration: 'underline',
                  }}>Change ›</button>
                )}
              </div>
            </div>
            <button
              onClick={() => navigate(`/customer/vendors/${fromVendorId}`)}
              style={{
                border: '1px solid rgba(232,89,12,0.3)', background: 'transparent',
                color: 'var(--primary)', borderRadius: '10px', padding: '5px 10px',
                fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >View ›</button>
          </div>
        )}

        {/* Package-only pre-selection banner (from dashboard, no vendor) */}
        {!fromVendorName && selectedPackage && fromPkgCat && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: 'rgba(5,150,105,0.07)', border: '1.5px solid rgba(5,150,105,0.2)',
            borderRadius: '16px', padding: '10px 14px', marginBottom: '16px',
          }}>
            <Icon name="Utensils" size={20} style={{ color: '#059669', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#059669' }}>
                {selectedPackage.title} Package pre-selected
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Fill your event details below · <button onClick={() => setStep(2)} style={{ border: 'none', background: 'transparent', color: '#059669', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>Change package ›</button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 1: Event Details ── */}
        {step === 1 && (
          <div style={{ animation: 'fadeInUp 0.3s ease' }}>
            <div className="form-group">
              <label className="form-label">Event Type</label>
              <input type="text" className="form-input" value={eventName} onChange={e => setEventName(e.target.value)} placeholder="e.g. Wedding Reception" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label className="form-label">Date & Time</label>
                <input type="datetime-local" className="form-input" value={eventDate} onChange={e => setEventDate(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Guests</label>
                <input type="number" className="form-input" value={guests} onChange={e => setGuests(e.target.value)} placeholder="e.g. 300" min={10} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Food Type</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[['veg', 'Veg'], ['nonveg', 'Non-Veg'], ['both', 'Both']].map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => { setFoodType(val); setSelectedPackage(null); }}
                    style={{
                      flex: 1, padding: '10px 8px', borderRadius: '14px', border: 'none', fontFamily: 'inherit',
                      background: foodType === val ? 'linear-gradient(135deg, #FF6B00, #FF8C42)' : 'var(--bg-elevated)',
                      color: foodType === val ? '#fff' : 'var(--text-secondary)',
                      fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s',
                      boxShadow: foodType === val ? '0 4px 12px rgba(255,107,0,0.25)' : 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    {val === 'veg' && <Leaf size={14} style={{ marginRight: '6px', color: foodType === val ? '#fff' : '#10b981' }} />}
                    {val === 'nonveg' && <Utensils size={14} style={{ marginRight: '6px', color: foodType === val ? '#fff' : '#ef4444' }} />}
                    {val === 'both' && <Sparkle size={14} style={{ marginRight: '6px', color: foodType === val ? '#fff' : '#f59e0b' }} />}
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Event Location</label>
              <div style={{ height: '200px', borderRadius: '18px', overflow: 'hidden', border: '1px solid var(--border)', position: 'relative', boxShadow: 'var(--shadow-md)' }}>
                {!position && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, background: 'rgba(255,255,255,0.9)' }}>
                    <div className="loading-spinner" />
                  </div>
                )}
                {position && (
                  <MapContainer center={position} zoom={12} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <LocationPicker position={position} setPosition={setPosition} />
                  </MapContainer>
                )}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Icon name="MapPin" size={12} style={{ color: 'var(--primary)' }} />
                Tap map to set venue · {vendorCount} vendors found nearby
              </span>
              </p>
            </div>

            <button className="btn btn-primary btn-block btn-lg" onClick={handleNext} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              Next: Choose Package <Icon name="ArrowRight" size={16} />
            </button>
          </div>
        )}

        {/* ── STEP 2: Package Selection ── */}
        {step === 2 && (
          <div style={{ animation: 'fadeInUp 0.3s ease' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>
              Select a package. Tap <strong>Preview Leaf</strong> to see what's served.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              {getPackages(foodType).map((pkg) => {
                const meta = PACKAGE_META[pkg.category];
                const isSelected = selectedPackage?.category === pkg.category;
                const isCustom = pkg.category === 'custom';
                return (
                  <button
                    key={pkg.category}
                    onClick={() => {
                      if (isCustom) {
                        // Navigate to custom builder
                        navigate('/customer/custom-package', {
                          state: { foodType, guests: parseInt(guests) || 100, vendorId: fromVendorId || null, vendorName: fromVendorName || null },
                        });
                        return;
                      }
                      setSelectedPackage(pkg);
                      setShowLeafPreview(false);
                    }}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: '14px',
                      padding: '16px', borderRadius: '20px', fontFamily: 'inherit',
                      background: isSelected ? meta.bg : 'var(--bg-card)',
                      border: `2px solid ${isSelected ? meta.color : 'var(--border)'}`,
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                      boxShadow: isSelected ? `0 8px 24px ${meta.color}22` : 'var(--shadow-sm)',
                      transform: isSelected ? 'scale(1.01)' : 'scale(1)',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: isSelected ? meta.color : 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }}>
                      <Icon name={meta.iconName} size={28} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: isSelected ? meta.color : 'var(--text)' }}>
                          {pkg.title} Package
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '8px' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.82rem', color: meta.color }}>
                            {isCustom ? (customDishes.length > 0 ? `${customDishes.length} dishes` : 'Build →') : `${pkg.dishes.length} dishes`}
                          </div>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: '0 0 8px' }}>
                        {isCustom && customDishes.length > 0
                          ? `Your custom thali: ${customDishes.slice(0, 3).join(', ')}${customDishes.length > 3 ? ` +${customDishes.length - 3} more` : ''}`
                          : pkg.description}
                      </p>
                      {!isCustom && pkg.dishes.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {pkg.dishes.slice(0, 4).map(d => (
                            <span key={d} style={{
                              padding: '2px 8px', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 600,
                              background: isSelected ? `${meta.color}18` : 'var(--bg-elevated)',
                              color: isSelected ? meta.color : 'var(--text-muted)',
                              border: `1px solid ${isSelected ? meta.border : 'var(--border)'}`,
                            }}>{d}</span>
                          ))}
                          {pkg.dishes.length > 4 && (
                            <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 700, color: meta.color }}>
                              +{pkg.dishes.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                      {isCustom && customDishes.length === 0 && (
                        <div style={{ fontSize: '0.75rem', color: meta.color, fontWeight: 700 }}>
                          Tap to open the Thali Builder →
                        </div>
                      )}
                    </div>
                    <div style={{
                      width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, marginTop: '2px',
                      border: `2px solid ${isSelected ? meta.color : 'var(--border)'}`,
                      background: isSelected ? meta.color : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}>
                      {isSelected && <Icon name="Check" size={12} strokeWidth={3} style={{ color: '#fff' }} />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Banana Leaf Preview for selected non-custom package */}
            {selectedPackage && selectedPackage.category !== 'custom' && (
              <div style={{ marginBottom: '20px' }}>
                <button
                  onClick={() => setShowLeafPreview(v => !v)}
                  style={{
                    width: '100%', padding: '12px', borderRadius: '16px',
                    background: showLeafPreview
                      ? 'linear-gradient(135deg, #15803d, #166534)'
                      : 'rgba(34,197,94,0.1)',
                    color: showLeafPreview ? '#fff' : '#16a34a',
                    fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                    fontFamily: 'inherit', marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  {showLeafPreview ? (
                    <>
                      <Icon name="X" size={16} /> Hide Leaf Preview
                    </>
                  ) : (
                    <>
                      <Icon name="Leaf" size={16} /> Preview on Banana Leaf
                    </>
                  )}
                </button>

                {showLeafPreview && (
                  <div style={{
                    background: 'linear-gradient(180deg, #0d1f0d, #1a3a1a)',
                    borderRadius: '22px', padding: '20px',
                    border: '1px solid rgba(34,197,94,0.2)',
                    animation: 'fadeInUp 0.3s ease',
                  }}>
                    <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#22c55e' }}>
                        {selectedPackage.title} Package — Your Thali
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                        {selectedPackage.dishes.length} dishes · served on banana leaf
                      </div>
                    </div>
                    <BananaLeaf dishes={selectedPackage.dishes} interactive={false} />
                    <div style={{
                      marginTop: '12px', padding: '10px 14px', borderRadius: '12px',
                      background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
                    }}>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', marginBottom: '6px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Dishes included
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {selectedPackage.dishes.map(d => (
                          <span key={d} style={{
                            padding: '3px 8px', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 600,
                            background: 'rgba(34,197,94,0.15)', color: '#86efac',
                            border: '1px solid rgba(34,197,94,0.25)',
                          }}>{d}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Custom package leaf preview */}
            {selectedPackage?.category === 'custom' && customDishes.length > 0 && (
              <div style={{
                background: 'linear-gradient(180deg, #0d1f0d, #1a3a1a)',
                borderRadius: '22px', padding: '20px', marginBottom: '20px',
                border: '1px solid rgba(34,197,94,0.2)',
                animation: 'fadeInUp 0.3s ease',
              }}>
                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#22c55e' }}>
                    Your Custom Thali
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                    {customDishes.length} dishes · ₹{customBudget}/plate
                  </div>
                </div>
                <BananaLeaf dishes={customDishes} interactive={false} />
                <button
                  onClick={() => navigate('/customer/custom-package', { state: { foodType, guests: parseInt(guests) || 100, vendorId: fromVendorId || null, vendorName: fromVendorName || null } })}
                  style={{
                    width: '100%', marginTop: '12px', padding: '10px', borderRadius: '12px',
                    background: 'rgba(34,197,94,0.15)', color: '#22c55e',
                    fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit',
                    border: '1px solid rgba(34,197,94,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                  }}
                >
                  <Icon name="Pencil" size={14} /> Edit My Thali
                </button>
              </div>
            )}

            <button
              className="btn btn-primary btn-block btn-lg"
              onClick={handleNext}
              disabled={!selectedPackage || (selectedPackage.category === 'custom' && customDishes.length === 0)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              Next: Review <Icon name="ArrowRight" size={16} />
            </button>
          </div>
        )}



        {/* ── STEP 3: Review & Submit ── */}
        {step === 3 && (
          <div style={{ animation: 'fadeInUp 0.3s ease' }}>
            {/* Summary card */}
            <div style={{
              background: 'var(--bg-card)', borderRadius: '22px', padding: '20px',
              border: '1px solid var(--border)', marginBottom: '16px',
              boxShadow: 'var(--shadow-md)',
            }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="ClipboardList" size={18} style={{ color: 'var(--primary)' }} /> Event Summary
              </div>

              {[
                { iconName: 'PartyPopper', label: 'Event', value: eventName },
                { iconName: 'Calendar', label: 'Date', value: new Date(eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) },
                { iconName: 'Users', label: 'Guests', value: `${guests} people` },
                { iconName: 'Utensils', label: 'Food Type', value: foodType === 'veg' ? 'Veg' : foodType === 'nonveg' ? 'Non-Veg' : 'Veg + Non-Veg' },
                ...(fromVendorName ? [{ iconName: 'Target', label: 'Vendor', value: fromVendorName }] : []),
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', gap: '10px', alignItems: 'center', paddingBottom: '10px', marginBottom: '10px', borderBottom: '1px solid var(--border)' }}>
                  <Icon name={row.iconName} size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', width: '70px', flexShrink: 0 }}>{row.label}</span>
                  <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{row.value}</span>
                </div>
              ))}

              {/* Package */}
              {selectedPackage && (() => {
                const meta = PACKAGE_META[selectedPackage.category];
                return (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', paddingBottom: '10px', marginBottom: '10px', borderBottom: '1px solid var(--border)' }}>
                    <Icon name={meta.iconName} size={16} style={{ color: meta.color, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', width: '70px', flexShrink: 0 }}>Package</span>
                    <span style={{ fontWeight: 700, color: meta.color }}>{selectedPackage.title} Package</span>
                  </div>
                );
              })()}

            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>
              {fromVendorName ? (
                <>
                  <Icon name="Target" size={14} style={{ color: 'var(--primary)' }} />
                  This request will go directly to {fromVendorName} for a personalised bid.
                </>
              ) : (
                <>
                  <Icon name="Sparkles" size={14} style={{ color: 'var(--primary)' }} />
                  Vendors near you will receive this request and submit competitive bids.
                </>
              )}
            </div>

            <button className="btn btn-primary btn-block btn-lg" onClick={handleSubmit} disabled={submitting} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              {submitting ? (
                <>
                  <Icon name="Clock" size={18} className="animate-spin" /> Sending...
                </>
              ) : (
                <>
                  <Icon name="Send" size={18} />
                  {fromVendorName ? `Send Request to ${fromVendorName}` : 'Send Request to Vendors'}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
