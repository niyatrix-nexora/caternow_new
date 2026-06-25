import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  getRequest, 
  createBid, 
  vendorAcceptRequest, 
  getDistance, 
  ADDON_SUGGESTIONS,
  subscribeToRequest,
  subscribeToBidsForRequest,
  updateRequest
} from '../../utils/data';
import { sanitizeText } from '../../utils/security';
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import BananaLeaf from '../customer/BananaLeaf';
import { Utensils, Package, ClipboardList, CheckCircle, MessageSquare, Sparkles, Zap, Send } from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});


export default function VendorRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, refresh, bids: allBids, requests } = useApp();

  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [price, setPrice] = useState('');
  const [request, setRequest] = useState(null);
  const [loadingRequest, setLoadingRequest] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'vendor') navigate('/');
  }, [user, navigate]);

  useEffect(() => {
    const fromContext = requests.find((r) => r.id === id);
    if (fromContext) {
      setRequest(fromContext);
      setLoadingRequest(false);
    }
  }, [requests, id]);

  useEffect(() => {
    if (!id) {
      setRequest(null);
      setLoadingRequest(false);
      return;
    }

    const fromContext = requests.find((r) => r.id === id);
    if (!fromContext) setLoadingRequest(true);

    let isMounted = true;
    async function loadRequest() {
      const fresh = await getRequest(id);
      if (!isMounted) return;
      setRequest(fresh || fromContext || null);
      setLoadingRequest(false);
    }
    loadRequest();
    return () => { isMounted = false; };
  }, [id, requests]);

  useEffect(() => {
    if (!id) return undefined;
    
    // Subscribe to request changes (status, radius, etc.)
    const unsubReq = subscribeToRequest(id, (updated) => {
      setRequest(updated);
    });

    // Subscribe to bids (when a new bid is placed, we refresh global context to update counts)
    const unsubBids = subscribeToBidsForRequest(id, () => {
      refresh();
    });

    return () => {
      unsubReq();
      unsubBids();
    };
  }, [id, refresh]);

  if (!user) return null;

  if (loadingRequest && !request) {
    return (
      <div className="app-container">
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate('/vendor')}>{'<'}</button>
          <h1>Request Details</h1>
        </div>
        <div className="page">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
            <div className="loading-spinner" style={{ marginBottom: '16px' }}></div>
            <p style={{ color: 'var(--text-muted)' }}>Loading request...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="app-container">
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate('/vendor')}>{'<'}</button>
          <h1>Request Not Found</h1>
        </div>
        <div className="page">
          <div className="empty-state">
            <div className="empty-icon">!</div>
            <h3>Request not found</h3>
            <p>This request may have been cancelled.</p>
          </div>
        </div>
      </div>
    );
  }

  const vendorId = user.id;
  const existingBid = allBids.find((b) => b.vendorId === vendorId && b.requestId === id);
  const distance = getDistance(user.lat || 12.9716, user.lng || 77.5946, request.lat, request.lng);
  const foodLabel = { veg: 'Veg', nonveg: 'Non-Veg', both: 'Veg + Non-Veg' };
  const canBid = request.status === 'searching' || request.status === 'bidding';
  const isBidAccepted = existingBid?.status === 'accepted' || (request.status === 'confirmed' && request.confirmedBidId === existingBid?.id);
  const isBidRejected = existingBid?.status === 'rejected' || existingBid?.status === 'skipped' || (request.status === 'confirmed' && request.confirmedBidId !== existingBid?.id);

  const formatPhone = (phone) => {
    const digits = String(phone || '').replace(/\D/g, '');
    if (digits.length === 10) return `+91 ${digits}`;
    if (digits.length === 12 && digits.startsWith('91')) return `+91 ${digits.slice(2)}`;
    return phone || 'Not available';
  };
  const formatPhoneHref = (phone) => {
    const digits = String(phone || '').replace(/\D/g, '');
    if (digits.length === 10) return `+91${digits}`;
    if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
    return digits || phone || '';
  };

  const handleSubmitBid = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!canBid) { setError('This request is no longer accepting bids.'); return; }

    const menuDetails = request.packageDishes?.join(', ') || 'Custom Package';

    if (!price || parseInt(price) < 50) return setError('Please enter a valid price (min ₹50)');

    setSubmitting(true);
    setError('');

    await vendorAcceptRequest(id, vendorId);

    const finalPrice = parseInt(price);
    
    const bid = await createBid({
      requestId: id,
      vendorId: user.id,
      vendorName: user.name || 'Vendor',
      pricePerPlate: finalPrice,
      totalPrice: finalPrice * request.plates,
      menuDetails,
      notes: sanitizeText(notes, 500),
      distance,
    });

    if (!bid) {
      setError('Unable to submit bid right now. Please try again.');
      setSubmitting(false);
      return;
    }

    await refresh();
    setSubmitting(false);
    setSubmitted(true);
  };

  return (
    <div className="app-container">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/vendor')}>{'<'}</button>
        <h1>Request Details</h1>
        {/* Chat button — always visible once vendor has a bid */}
        {(existingBid || submitted) && (
          <button
            onClick={() => navigate(`/vendor/chat/${request.id}`)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', borderRadius: '14px', border: 'none',
              background: 'linear-gradient(135deg, #FF6B00, #FF8C42)',
              color: '#fff', fontWeight: 700, fontSize: '0.82rem',
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 4px 12px rgba(255,107,0,0.3)',
            }}
          >
            <MessageSquare size={16} /> Chat
          </button>
        )}
      </div>

      <div className="page">
        {/* Request Info Card */}
        <div className="card" style={{ marginBottom: '16px' }}>
          <div className="card-header">
            <span className="card-title">Catering Request</span>
            <span className="distance-badge">{distance.toFixed(1)} km</span>
          </div>

          <div className="card-meta">
            <div className="card-meta-item">
              <span className="icon">#</span>
              <span>Req ID: {request.id?.split('_')[1]}</span>
            </div>
            <div className="card-meta-item" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="icon" style={{ display: 'flex', alignItems: 'center' }}><Utensils size={16} /></span>
              <span>{request.plates} plates · {foodLabel[request.foodType]}</span>
            </div>
            {request.packageType && (
              <div className="card-meta-item" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="icon" style={{ display: 'flex', alignItems: 'center' }}><Package size={16} /></span>
                <span style={{ color: 'var(--success)', fontWeight: '700' }}>Package: {request.packageType}</span>
              </div>
            )}
          </div>

          <div className="map-container" style={{ height: '180px', marginTop: '16px' }}>
            <MapContainer center={[request.lat, request.lng]} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl={false}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[request.lat, request.lng]} />
              <Circle
                center={[request.lat, request.lng]}
                radius={request.currentRadius * 1000}
                pathOptions={{ color: '#E8590C', fillColor: '#E8590C', fillOpacity: 0.08, weight: 2, dashArray: '8 4' }}
              />
            </MapContainer>
          </div>
        </div>

        {/* Customer's Selected Menu Card */}
        {request.packageDishes && request.packageDishes.length > 0 && (
          <div className="card" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '0.95rem', margin: 0, fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ClipboardList size={18} style={{ color: 'var(--primary)' }} /> Customer's Menu Selection
              </h3>
              <span style={{
                background: 'rgba(5, 150, 105, 0.1)',
                color: 'var(--success)',
                fontSize: '0.75rem',
                fontWeight: '700',
                padding: '4px 10px',
                borderRadius: '10px',
                border: '1px solid rgba(5, 150, 105, 0.2)'
              }}>
                {request.packageType || 'Custom'}
              </span>
            </div>

            {/* Banana Leaf Plating Preview */}
            <div style={{ marginBottom: '16px' }}>
              <BananaLeaf dishes={request.packageDishes} interactive={false} />
            </div>

            {/* List of Dishes */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              padding: '12px',
              background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-md)'
            }}>
              {request.packageDishes.map((dish) => (
                <span key={dish} style={{
                  padding: '4px 10px',
                  borderRadius: '999px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  background: 'var(--bg-card)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)'
                }}>
                  {dish}
                </span>
              ))}
            </div>
            {request.menuNotes && (
              <div style={{ marginTop: '12px', fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                Customer notes: "{request.menuNotes}"
              </div>
            )}
          </div>
        )}

        {/* Bid submitted state */}
        {(existingBid || submitted) && (
          <div className="card" style={{ borderColor: 'var(--success)', background: 'rgba(5, 150, 105, 0.08)' }}>
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                <CheckCircle size={40} style={{ color: 'var(--success)' }} />
              </div>
              <h3 style={{ color: 'var(--success)', marginBottom: '4px' }}>Bid Submitted</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                {isBidAccepted
                  ? 'Customer accepted your bid. Please contact them to coordinate the order.'
                  : 'Your bid is under review. You will see the result when the customer responds.'}
              </p>
              {existingBid && (
                <div style={{ marginTop: '12px' }}>
                  <span className="price-tag">Rs {existingBid.totalPrice?.toLocaleString('en-IN')}</span>
                  <span className="price-per-plate"> | Rs {existingBid.pricePerPlate}/plate</span>
                </div>
              )}
              <div style={{ marginTop: '12px' }}>
                {existingBid && (
                  <span className={`badge ${isBidAccepted ? 'badge-confirmed' : isBidRejected ? 'badge-cancelled' : 'badge-bidding'}`}>
                    {isBidAccepted ? 'Accepted' : isBidRejected ? 'Not Selected' : 'Pending'}
                  </span>
                )}
              </div>
              <button className="btn btn-outline btn-block mt-md" onClick={() => navigate(`/vendor/chat/${request.id}`)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <MessageSquare size={16} /> Chat with Customer
              </button>
              {isBidAccepted && request.customerPhone && (
                <div style={{ marginTop: '12px' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>Customer mobile</div>
                  <a href={`tel:${formatPhoneHref(request.customerPhone)}`} style={{ color: 'var(--success)', fontWeight: 700, textDecoration: 'none' }}>
                    {formatPhone(request.customerPhone)}
                  </a>
                </div>
              )}

              {/* ── Order Progress Tracker for Vendor ── */}
              {isBidAccepted && (
                <div style={{
                  marginTop: '16px',
                  padding: '16px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'left',
                }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ClipboardList size={16} style={{ color: 'var(--primary)' }} /> Update Order Progress
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {[
                      { id: 'confirmed', label: 'Order Confirmed' },
                      { id: 'preparing', label: 'Preparing' },
                      { id: 'cooking', label: 'Cooking in Progress' },
                      { id: 'on_the_way', label: 'On the Way' },
                      { id: 'delivered', label: 'Delivered' }
                    ].map((step) => {
                      const isActive = (request.trackingStatus || 'confirmed') === step.id;
                      return (
                        <button
                          key={step.id}
                          type="button"
                          onClick={async () => {
                            await updateRequest(request.id, { trackingStatus: step.id });
                            await refresh();
                          }}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: '10px',
                            border: '1px solid',
                            borderColor: isActive ? 'var(--primary)' : 'var(--border)',
                            background: isActive ? 'var(--primary)' : 'var(--bg-card)',
                            color: isActive ? 'white' : 'var(--text)',
                            fontWeight: 600,
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span>{step.label}</span>
                          {isActive && <CheckCircle size={14} style={{ color: 'white' }} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Customer Add-on Requests ── */}
              {isBidAccepted && request.customerAddons && request.customerAddons.length > 0 && (() => {
                // Look up price for each add-on from ADDON_SUGGESTIONS
                const allSuggestions = [
                  ...(ADDON_SUGGESTIONS.veg || []),
                  ...(ADDON_SUGGESTIONS.nonveg || []),
                  ...(ADDON_SUGGESTIONS.both || []),
                ];
                const uniqueSuggestions = allSuggestions.filter(
                  (s, idx, arr) => arr.findIndex(x => x.item === s.item) === idx
                );
                const addonsWithPrice = request.customerAddons.map(name => {
                  const match = uniqueSuggestions.find(s => s.item === name);
                  return { name, price: match?.price || 0 };
                });
                const addonTotal = addonsWithPrice.reduce((sum, a) => sum + a.price * (request.plates || 0), 0);
                return (
                  <div style={{
                    marginTop: '16px',
                    padding: '14px',
                    background: 'rgba(232,89,12,0.08)',
                    border: '1px solid rgba(232,89,12,0.28)',
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'left',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                      <Sparkles size={16} style={{ color: 'var(--primary-light)' }} />
                      <span style={{ fontSize: '0.83rem', fontWeight: 700, color: 'var(--primary-light)' }}>
                        Customer Requested Extras
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {addonsWithPrice.map(addon => (
                        <div key={addon.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>• {addon.name}</span>
                          {addon.price > 0 && (
                            <span style={{ fontSize: '0.78rem', color: 'var(--primary-light)', fontWeight: 600 }}>
                              +₹{addon.price}/plate
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    {addonTotal > 0 && (
                      <div style={{
                        marginTop: '10px',
                        paddingTop: '8px',
                        borderTop: '1px solid rgba(232,89,12,0.2)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Estimated extras total</span>
                        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--primary-light)' }}>
                          ₹{addonTotal.toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '10px', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MessageSquare size={12} /> Discuss and confirm pricing for these extras when you contact the customer.
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Bid form */}
        {!existingBid && !submitted && canBid && (
          <>
            <div className="section-title">Submit Your Bid</div>
            <form onSubmit={handleSubmitBid}>

              {/* ===== LIVE CAPACITY SUGGESTION ===== */}
              {user.todaysMenu && user.additionalCapacity > 0 && (
                <div style={{
                  marginBottom: '20px',
                  padding: '12px',
                  background: 'rgba(5, 150, 105, 0.1)',
                  border: '1px solid rgba(5, 150, 105, 0.3)',
                  borderRadius: 'var(--radius-md)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Zap size={18} style={{ color: 'var(--success)' }} />
                    <span style={{ fontWeight: 700, color: 'var(--success)', fontSize: '0.9rem' }}>Live Capacity Tip</span>
                  </div>
                  {user.livePriceRange && (
                    <>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                        Reminder: You are offering service in the <strong>₹{user.livePriceRange}</strong> range today.
                      </p>
                      <button 
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--primary)', padding: 0, fontWeight: 700, fontSize: '0.75rem', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => {
                          setNotes(prev => `Today I'm offering a special price range of ₹${user.livePriceRange}. ${prev}`);
                        }}
                      >
                        <Zap size={12} /> Mention my range in bid
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Bid Price Input */}
              <div className="form-group">
                <label className="form-label">Bid Price (per plate)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 600 }}>₹</span>
                  <input
                    type="number"
                    className="form-input"
                    style={{ paddingLeft: '28px' }}
                    placeholder="e.g. 250"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
                <p className="map-hint" style={{ marginTop: '4px' }}>Enter your price per plate for the {request.packageType} Package.</p>
              </div>

              {/* Additional Notes */}
              <div className="form-group">
                <label className="form-label">Additional Notes (Optional)</label>
                <textarea
                  className="form-input"
                  placeholder="Any special offers, experience details, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>

              {error && (
                <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '16px' }}>{error}</p>
              )}

              <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                {submitting ? 'Submitting...' : (
                  <>
                    <Send size={18} />
                    <span>Submit Bid</span>
                  </>
                )}
              </button>

              <button type="button" className="btn btn-secondary btn-block mt-md" onClick={() => navigate('/vendor')}>
                Decline
              </button>
            </form>
          </>
        )}

        {!existingBid && !submitted && !canBid && (
          <div className="card" style={{ borderColor: 'var(--warning)' }}>
            <h3 style={{ marginBottom: '6px' }}>Request Closed</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              This request is currently in status: {request.status}
            </p>
            <button className="btn btn-secondary btn-block mt-md" onClick={() => navigate('/vendor')}>
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
