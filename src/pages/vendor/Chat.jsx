import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { getChatMessages, saveChatMessages } from '../../utils/packages';
import { getBid, getBidByRequestAndVendor, getRequest, saveBidChat, subscribeToBid, isSupabaseConfigured } from '../../utils/data';
import { Check, X, Clock, CheckCircle, IndianRupee, RotateCcw, Send, ArrowLeft } from 'lucide-react';

// ── Offer card (vendor view) ──────────────────────────────────────────────────
function OfferCard({ offer, onAccept, onCounter, isVendor }) {
  const statusColor = offer.status === 'accepted' ? '#059669' : offer.status === 'rejected' ? '#DC2626' : '#D97706';
  const statusLabel = offer.status === 'accepted' ? 'Accepted' : offer.status === 'rejected' ? 'Rejected' : 'Pending';

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(255,107,0,0.06), rgba(255,107,0,0.02))',
      border: '1.5px solid rgba(255,107,0,0.25)',
      borderRadius: '18px', padding: '16px', maxWidth: '280px', width: '100%',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <IndianRupee size={16} style={{ color: '#FF6B00' }} />
        <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#FF6B00' }}>
          {offer.isCounter ? 'Counter Offer' : 'Customer Offer'}
        </span>
        <span style={{
          marginLeft: 'auto', fontSize: '0.68rem', fontWeight: 700,
          color: statusColor, background: `${statusColor}18`,
          padding: '2px 8px', borderRadius: '999px',
          display: 'inline-flex', alignItems: 'center', gap: '4px'
        }}>
          {offer.status === 'accepted' && <CheckCircle size={10} />}
          {offer.status === 'rejected' && <X size={10} />}
          {offer.status === 'pending' && <Clock size={10} />}
          <span>{statusLabel}</span>
        </span>
      </div>

      <div style={{ marginBottom: '8px' }}>
        <div style={{ fontSize: '0.7rem', color: '#9CA3AF', marginBottom: '2px' }}>Package</div>
        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{offer.packageName || 'Special Package'}</div>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>Offered price</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#FF6B00' }}>₹{offer.pricePerPlate}</div>
        </div>
        {offer.guests && (
          <div>
            <div style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>Guests</div>
            <div style={{ fontSize: '1rem', fontWeight: 700 }}>{offer.guests}</div>
          </div>
        )}
      </div>

      {offer.note && (
        <div style={{
          fontSize: '0.78rem', color: '#5F6368',
          background: 'rgba(0,0,0,0.04)', borderRadius: '10px',
          padding: '8px 10px', marginBottom: '12px',
        }}>
          "{offer.note}"
        </div>
      )}

      {offer.status === 'pending' && isVendor && (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => onAccept(offer.id)}
            style={{
              flex: 1, padding: '9px', borderRadius: '12px', border: 'none',
              background: 'linear-gradient(135deg, #059669, #047857)',
              color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
            }}
          >
            <Check size={14} /> Accept
          </button>
          <button
            onClick={() => onCounter(offer)}
            style={{
              flex: 1, padding: '9px', borderRadius: '12px',
              border: '1.5px solid rgba(255,107,0,0.4)',
              background: 'transparent', color: '#FF6B00',
              fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
            }}
          >
            <RotateCcw size={14} /> Counter
          </button>
        </div>
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '10px 14px', background: '#fff', borderRadius: '16px 16px 16px 0', border: '1px solid var(--border)', width: 'fit-content' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#9CA3AF', animation: `typingDot 1.2s ease ${i * 0.2}s infinite` }} />
      ))}
    </div>
  );
}

export default function VendorChat() {
  const { id } = useParams(); // requestId
  const navigate = useNavigate();
  const { user, requests, bids } = useApp();

  const [activeRequest, setActiveRequest] = useState(null);
  const [activeBid, setActiveBid] = useState(null);
  const request = activeRequest;
  const myBid = activeBid;
  const roomId = myBid ? `${id}_${user?.id}` : id;

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showOfferPanel, setShowOfferPanel] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerNote, setOfferNote] = useState('');
  const [counterOffer, setCounterOffer] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!user || user.role !== 'vendor') navigate('/');
  }, [user, navigate]);

  // Initialize and load bid / request
  useEffect(() => {
    async function loadData() {
      let r = requests.find(x => x.id === id);
      if (!r) {
        r = await getRequest(id);
      }
      if (r) {
        setActiveRequest(r);
      }
      if (user?.id) {
        let b = bids.find(x => x.requestId === id && x.vendorId === user.id);
        if (!b) {
          b = await getBidByRequestAndVendor(id, user.id);
        }
        if (b) {
          setActiveBid(b);
        }
      }
    }
    loadData();
  }, [id, bids, requests, user]);

  // Load persisted messages on mount
  useEffect(() => {
    if (!myBid) return;

    const history = myBid.chatHistory || [];
    if (history.length > 0) {
      setMessages(history);
    } else {
      const saved = getChatMessages(roomId);
      if (saved.length > 0) {
        setMessages(saved);
      } else {
        const initial = [
          {
            id: 'init_1',
            sender: 'vendor',
            text: `Hello! I've submitted my bid for your ${request?.eventName || 'event'}. I'm ready to provide excellent catering service!`,
            time: '10:00 AM',
            timestamp: new Date().toISOString(),
          },
        ];
        setMessages(initial);
        saveBidChat(myBid.id, initial, myBid.notes || '');
      }
    }
  }, [myBid, roomId, request]);

  // Realtime subscription for the activeBid (myBid)
  useEffect(() => {
    if (!myBid || !myBid.id) return;

    const unsubscribe = subscribeToBid(myBid.id, (updatedBid) => {
      if (updatedBid && updatedBid.chatHistory) {
        setMessages(updatedBid.chatHistory);
      }
      if (updatedBid) {
        setActiveBid(updatedBid);
      }
    });

    return () => unsubscribe();
  }, [myBid?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const persistAndSet = useCallback(async (msgs) => {
    setMessages(msgs);
    if (myBid) {
      let latestBid = myBid;
      if (isSupabaseConfigured()) {
        latestBid = await getBid(myBid.id) || myBid;
      }
      await saveBidChat(myBid.id, msgs, latestBid.notes || '');
    }
  }, [myBid]);

  const simulateCustomerReply = useCallback((replyText, delay = 1800) => {
    setIsTyping(true);
    setTimeout(async () => {
      setIsTyping(false);
      if (myBid) {
        const latestBid = isSupabaseConfigured() ? (await getBid(myBid.id) || myBid) : myBid;
        const currentMessages = latestBid.chatHistory || messages;
        const newReply = {
          id: `cust_${Date.now()}`,
          sender: 'customer',
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: new Date().toISOString(),
        };
        const updated = [...currentMessages, newReply];
        await saveBidChat(myBid.id, updated, latestBid.notes || '');
        setMessages(updated);
      } else {
        setMessages(prev => {
          const updated = [...prev, {
            id: `cust_${Date.now()}`,
            sender: 'customer',
            text: replyText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: new Date().toISOString(),
          }];
          saveChatMessages(roomId, updated);
          return updated;
        });
      }
    }, delay);
  }, [myBid, messages, roomId]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text) return;
    const newMsg = {
      id: `v_${Date.now()}`,
      sender: 'vendor',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: new Date().toISOString(),
    };
    await persistAndSet([...messages, newMsg]);
    setInputText('');

    const lower = text.toLowerCase();
    if (lower.includes('discount') || lower.includes('offer') || lower.includes('deal')) {
      simulateCustomerReply('That sounds interesting! Can you send me a formal price offer?');
    } else if (lower.includes('menu') || lower.includes('food')) {
      simulateCustomerReply('I\'d like to know more about the menu options. Can you share the full list?');
    } else if (lower.includes('confirm') || lower.includes('book')) {
      simulateCustomerReply('Let me discuss with my family and get back to you. What\'s the last date to confirm?');
    } else {
      simulateCustomerReply('Thanks! I\'ll review this and let you know soon.');
    }
  };

  const handleSendOffer = async () => {
    const price = parseInt(offerPrice);
    if (!price || price < 50) return;

    const offerId = `offer_${Date.now()}`;
    const offerMsg = {
      id: `v_offer_${Date.now()}`,
      sender: 'vendor',
      type: 'offer',
      offer: {
        id: offerId,
        pricePerPlate: price,
        packageName: counterOffer?.packageName || (myBid ? 'My Bid Package' : 'Special Package'),
        guests: request?.plates,
        note: offerNote.trim() || null,
        isCounter: !!counterOffer,
        status: 'pending',
      },
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: new Date().toISOString(),
    };

    await persistAndSet([...messages, offerMsg]);
    setOfferPrice('');
    setOfferNote('');
    setShowOfferPanel(false);
    setCounterOffer(null);

    simulateCustomerReply(`₹${price}/plate looks reasonable. Let me check my budget and confirm.`, 2200);
  };

  const handleAcceptOffer = async (offerId) => {
    const updated = messages.map(m =>
      m.type === 'offer' && m.offer?.id === offerId
        ? { ...m, offer: { ...m.offer, status: 'accepted' } }
        : m
    );
    await persistAndSet(updated);
    simulateCustomerReply('I\'ve accepted your offer! Looking forward to working with you.', 1000);
  };

  const handleCounterOffer = (offer) => {
    setCounterOffer(offer);
    setOfferPrice(String(Math.max(50, offer.pricePerPlate + 10)));
    setShowOfferPanel(true);
    inputRef.current?.focus();
  };

  if (!request) {
    return (
      <div className="app-container">
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={18} />
          </button>
          <h1>Chat</h1>
        </div>
        <div className="page" style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#F7F7F7' }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '14px 16px', paddingTop: 'max(14px, env(safe-area-inset-top))',
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <button className="back-btn" onClick={() => navigate(-1)} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={18} />
        </button>
        <div style={{
          width: '40px', height: '40px', borderRadius: '14px', flexShrink: 0,
          background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 900, fontSize: '1rem',
        }}>
          {request.customerName?.charAt(0) || 'C'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {request.customerName || 'Customer'}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>
            ● {request.eventName} · {request.plates} guests
          </div>
        </div>
        <button
          onClick={() => { setShowOfferPanel(v => !v); setCounterOffer(null); }}
          style={{
            padding: '7px 14px', borderRadius: '12px', border: 'none',
            background: showOfferPanel ? '#FF6B00' : 'rgba(255,107,0,0.1)',
            color: showOfferPanel ? '#fff' : '#FF6B00',
            fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: '4px'
          }}
        >
          <IndianRupee size={12} />
          <span>Offer</span>
        </button>
      </div>

      {/* ── Offer panel ── */}
      {showOfferPanel && (
        <div style={{
          background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.06)',
          padding: '16px', animation: 'fadeInUp 0.2s ease',
        }}>
          <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '12px', color: '#FF6B00', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <IndianRupee size={16} />
            <span>{counterOffer ? `Counter Offer (was ₹${counterOffer.pricePerPlate}/plate)` : 'Send Price Offer to Customer'}</span>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#FF6B00' }}>₹</span>
              <input
                ref={inputRef}
                type="number"
                className="form-input"
                style={{ paddingLeft: '28px', minHeight: '44px', fontWeight: 800 }}
                placeholder="Your price per plate"
                value={offerPrice}
                onChange={e => setOfferPrice(e.target.value)}
              />
            </div>
            <button
              onClick={handleSendOffer}
              disabled={!offerPrice || parseInt(offerPrice) < 50}
              style={{
                padding: '0 20px', borderRadius: '14px', border: 'none',
                background: 'linear-gradient(135deg, #FF6B00, #FF8C42)',
                color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                opacity: (!offerPrice || parseInt(offerPrice) < 50) ? 0.5 : 1,
              }}
            >
              Send
            </button>
          </div>
          <input
            type="text"
            className="form-input"
            style={{ minHeight: '40px', fontSize: '0.85rem' }}
            placeholder="Add a note (e.g. includes live counter)..."
            value={offerNote}
            onChange={e => setOfferNote(e.target.value)}
          />
          {myBid && (
            <div style={{ fontSize: '0.72rem', color: '#9CA3AF', marginTop: '6px' }}>
              Your bid: ₹{myBid.pricePerPlate}/plate · Total ₹{myBid.totalPrice?.toLocaleString('en-IN')}
            </div>
          )}
        </div>
      )}

      {/* ── Messages ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ textAlign: 'center', fontSize: '0.72rem', color: '#9CA3AF', padding: '4px 12px', background: 'rgba(0,0,0,0.04)', borderRadius: '999px', alignSelf: 'center' }}>
          Today · {request.eventName}
        </div>

        {messages.map(msg => {
          const isMe = msg.sender === 'vendor';
          if (msg.type === 'offer') {
            return (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', gap: '4px' }}>
                <OfferCard
                  offer={msg.offer}
                  onAccept={handleAcceptOffer}
                  onCounter={handleCounterOffer}
                  isVendor={true}
                />
                <span style={{ fontSize: '0.68rem', color: '#9CA3AF' }}>{msg.time}</span>
              </div>
            );
          }
          return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', gap: '3px' }}>
              <div style={{
                background: isMe ? 'linear-gradient(135deg, #FF6B00, #FF8C42)' : '#fff',
                color: isMe ? '#fff' : '#1E1E1E',
                padding: '11px 15px',
                borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                maxWidth: '78%', fontSize: '0.9rem', lineHeight: 1.45,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                border: isMe ? 'none' : '1px solid rgba(0,0,0,0.06)',
              }}>
                {msg.text}
              </div>
              <span style={{ fontSize: '0.68rem', color: '#9CA3AF' }}>{msg.time}</span>
            </div>
          );
        })}

        {isTyping && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '3px' }}>
            <TypingIndicator />
            <span style={{ fontSize: '0.68rem', color: '#9CA3AF' }}>typing...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input bar ── */}
      <div style={{
        display: 'flex', gap: '10px', alignItems: 'center',
        padding: '12px 16px', paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(0,0,0,0.06)',
      }}>
        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Message customer..."
          style={{
            flex: 1, padding: '11px 16px', borderRadius: '22px',
            border: '1.5px solid rgba(0,0,0,0.08)', background: '#F7F7F7',
            outline: 'none', fontFamily: 'inherit', fontSize: '0.9rem',
          }}
          onFocus={e => e.target.style.borderColor = 'rgba(255,107,0,0.5)'}
          onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.08)'}
        />
        <button
          onClick={handleSend}
          disabled={!inputText.trim()}
          style={{
            width: '44px', height: '44px', borderRadius: '14px', border: 'none', flexShrink: 0,
            background: inputText.trim() ? 'linear-gradient(135deg, #FF6B00, #FF8C42)' : '#E5E7EB',
            color: inputText.trim() ? '#fff' : '#9CA3AF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: inputText.trim() ? 'pointer' : 'default', fontSize: '1.1rem',
            boxShadow: inputText.trim() ? '0 4px 12px rgba(255,107,0,0.3)' : 'none',
          }}
        >
          <Send size={16} />
        </button>
      </div>

      <style>{`
        @keyframes typingDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
