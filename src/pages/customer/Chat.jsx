import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { getChatMessages, saveChatMessages } from '../../utils/packages';
import { getBid, getRequest, saveBidChat, subscribeToBid, isSupabaseConfigured } from '../../utils/data';

// ── Offer card inside chat ────────────────────────────────────────────────────
function OfferCard({ offer, onAccept, onCounter, isCustomer }) {
  const statusColor = offer.status === 'accepted' ? '#059669' : offer.status === 'rejected' ? '#DC2626' : '#D97706';
  const statusLabel = offer.status === 'accepted' ? '✅ Accepted' : offer.status === 'rejected' ? '✕ Rejected' : '⏳ Pending';

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(255,107,0,0.06), rgba(255,107,0,0.02))',
      border: '1.5px solid rgba(255,107,0,0.25)',
      borderRadius: '18px',
      padding: '16px',
      maxWidth: '280px',
      width: '100%',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <span style={{ fontSize: '1.1rem' }}>💰</span>
        <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#FF6B00' }}>
          {offer.isCounter ? 'Counter Offer' : 'Price Offer'}
        </span>
        <span style={{
          marginLeft: 'auto', fontSize: '0.68rem', fontWeight: 700,
          color: statusColor, background: `${statusColor}18`,
          padding: '2px 8px', borderRadius: '999px',
        }}>
          {statusLabel}
        </span>
      </div>

      <div style={{ marginBottom: '8px' }}>
        <div style={{ fontSize: '0.7rem', color: '#9CA3AF', marginBottom: '2px' }}>Package</div>
        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{offer.packageName || 'Special Package'}</div>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>Price / plate</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#FF6B00' }}>₹{offer.pricePerPlate}</div>
        </div>
        {offer.guests && (
          <div>
            <div style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>Guests</div>
            <div style={{ fontSize: '1rem', fontWeight: 700 }}>{offer.guests}</div>
          </div>
        )}
        {offer.guests && (
          <div>
            <div style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>Total</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#059669' }}>
              ₹{(offer.pricePerPlate * offer.guests).toLocaleString('en-IN')}
            </div>
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

      {/* Action buttons — only show if pending and it's the customer's turn */}
      {offer.status === 'pending' && isCustomer && (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => onAccept(offer.id)}
            style={{
              flex: 1, padding: '9px', borderRadius: '12px', border: 'none',
              background: 'linear-gradient(135deg, #059669, #047857)',
              color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            ✓ Accept
          </button>
          <button
            onClick={() => onCounter(offer)}
            style={{
              flex: 1, padding: '9px', borderRadius: '12px',
              border: '1.5px solid rgba(255,107,0,0.4)',
              background: 'transparent', color: '#FF6B00',
              fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            ↩ Counter
          </button>
        </div>
      )}
    </div>
  );
}

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '10px 14px', background: '#fff', borderRadius: '16px 16px 16px 0', border: '1px solid var(--border)', width: 'fit-content' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: '7px', height: '7px', borderRadius: '50%', background: '#9CA3AF',
          animation: `typingDot 1.2s ease ${i * 0.2}s infinite`,
        }} />
      ))}
    </div>
  );
}

export default function Chat() {
  const { id } = useParams(); // bidId
  const navigate = useNavigate();
  const { user, bids, requests } = useApp();

  const [activeBid, setActiveBid] = useState(null);
  const [activeRequest, setActiveRequest] = useState(null);
  const bid = activeBid;
  const request = activeRequest;
  const roomId = bid ? `${bid.requestId}_${bid.vendorId}` : id;

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showOfferPanel, setShowOfferPanel] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerNote, setOfferNote] = useState('');
  const [counterOffer, setCounterOffer] = useState(null); // offer being countered
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize and load bid / request
  useEffect(() => {
    async function loadData() {
      let b = bids.find(x => x.id === id);
      if (!b) {
        b = await getBid(id);
      }
      if (b) {
        setActiveBid(b);
        let r = requests.find(x => x.id === b.requestId);
        if (!r) {
          r = await getRequest(b.requestId);
        }
        if (r) {
          setActiveRequest(r);
        }
      }
    }
    loadData();
  }, [id, bids, requests]);

  // Load persisted messages on mount
  useEffect(() => {
    if (!bid) return;

    const history = bid.chatHistory || [];
    if (history.length > 0) {
      setMessages(history);
    } else {
      const saved = getChatMessages(roomId);
      if (saved.length > 0) {
        setMessages(saved);
      } else {
        // Seed initial vendor message
        const initial = [
          {
            id: 'init_1',
            sender: 'vendor',
            text: `Hi! I saw your catering request for ${request?.eventName || 'your event'}. I'd love to cater for you! 🍽️`,
            time: '10:00 AM',
            timestamp: new Date().toISOString(),
          },
          {
            id: 'init_2',
            sender: 'vendor',
            text: `I can offer you a great deal for ${request?.plates || 'your'} guests. Want to see my packages?`,
            time: '10:01 AM',
            timestamp: new Date().toISOString(),
          },
        ];
        setMessages(initial);
        saveBidChat(bid.id, initial, bid.notes || '');
      }
    }
  }, [bid, roomId, request]);

  // Realtime subscription for the activeBid
  useEffect(() => {
    if (!bid || !bid.id) return;

    const unsubscribe = subscribeToBid(bid.id, (updatedBid) => {
      if (updatedBid && updatedBid.chatHistory) {
        setMessages(updatedBid.chatHistory);
      }
      if (updatedBid) {
        setActiveBid(updatedBid);
      }
    });

    return () => unsubscribe();
  }, [bid?.id]);

  useEffect(() => {
    if (!user || user.role !== 'customer') navigate('/');
  }, [user, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const persistAndSet = useCallback(async (msgs) => {
    setMessages(msgs);
    if (bid) {
      let latestBid = bid;
      if (isSupabaseConfigured()) {
        latestBid = await getBid(bid.id) || bid;
      }
      await saveBidChat(bid.id, msgs, latestBid.notes || '');
    }
  }, [bid]);

  const simulateVendorReply = useCallback((replyText, delay = 1500) => {
    setIsTyping(true);
    setTimeout(async () => {
      setIsTyping(false);
      if (bid) {
        const latestBid = isSupabaseConfigured() ? (await getBid(bid.id) || bid) : bid;
        const currentMessages = latestBid.chatHistory || messages;
        const newReply = {
          id: `v_${Date.now()}`,
          sender: 'vendor',
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: new Date().toISOString(),
        };
        const updated = [...currentMessages, newReply];
        await saveBidChat(bid.id, updated, latestBid.notes || '');
        setMessages(updated);
      } else {
        setMessages(prev => {
          const updated = [...prev, {
            id: `v_${Date.now()}`,
            sender: 'vendor',
            text: replyText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: new Date().toISOString(),
          }];
          saveChatMessages(roomId, updated);
          return updated;
        });
      }
    }, delay);
  }, [bid, messages, roomId]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text) return;
    const newMsg = {
      id: `c_${Date.now()}`,
      sender: 'customer',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: new Date().toISOString(),
    };
    await persistAndSet([...messages, newMsg]);
    setInputText('');

    // Smart vendor replies
    const lower = text.toLowerCase();
    if (lower.includes('price') || lower.includes('cost') || lower.includes('rate')) {
      simulateVendorReply(`Our Special Package starts at ₹${bid?.pricePerPlate || 320}/plate. I can offer a small discount for larger groups!`);
    } else if (lower.includes('discount') || lower.includes('reduce') || lower.includes('less')) {
      simulateVendorReply(`I can do ₹${Math.max(150, (bid?.pricePerPlate || 320) - 20)}/plate if you confirm today. Want me to send a formal offer?`);
    } else if (lower.includes('menu') || lower.includes('food') || lower.includes('dish')) {
      simulateVendorReply('I can customize the menu based on your preferences. What cuisine do you prefer — North Indian, South Indian, or a mix?');
    } else if (lower.includes('confirm') || lower.includes('book') || lower.includes('ok') || lower.includes('deal')) {
      simulateVendorReply('Great! I\'ll send you a formal offer card. Please review and accept it to confirm the booking. 🎉');
    } else {
      simulateVendorReply('Thanks for your message! I\'ll get back to you shortly. Feel free to ask about pricing or menu options.');
    }
  };

  const handleSendOffer = async () => {
    const price = parseInt(offerPrice);
    if (!price || price < 50) return;

    const offerId = `offer_${Date.now()}`;
    const offerMsg = {
      id: `c_offer_${Date.now()}`,
      sender: 'customer',
      type: 'offer',
      offer: {
        id: offerId,
        pricePerPlate: price,
        packageName: counterOffer?.packageName || 'Special Package',
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

    // Vendor responds to offer
    const diff = price - (bid?.pricePerPlate || 320);
    if (diff < -50) {
      simulateVendorReply(`₹${price}/plate is a bit low for me. My minimum is ₹${Math.max(150, (bid?.pricePerPlate || 320) - 30)}. Can we meet in the middle?`, 2000);
    } else if (diff < 0) {
      simulateVendorReply(`₹${price}/plate works for me! I'll accept your offer. Looking forward to catering your event! 🎊`, 1800);
    } else {
      simulateVendorReply(`Thank you for the offer! ₹${price}/plate is accepted. I'll prepare everything for your event.`, 1500);
    }
  };

  const handleAcceptOffer = async (offerId) => {
    const updated = messages.map(m =>
      m.type === 'offer' && m.offer?.id === offerId
        ? { ...m, offer: { ...m.offer, status: 'accepted' } }
        : m
    );
    await persistAndSet(updated);
    simulateVendorReply('Excellent! Your booking is confirmed. I\'ll contact you soon to finalize the details. 🎉🍽️', 1000);
  };

  const handleCounterOffer = (offer) => {
    setCounterOffer(offer);
    setOfferPrice(String(Math.max(50, offer.pricePerPlate - 20)));
    setShowOfferPanel(true);
    inputRef.current?.focus();
  };

  if (!bid || !request) {
    return (
      <div className="app-container">
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate(-1)}>←</button>
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
        <button className="back-btn" onClick={() => navigate(-1)} style={{ flexShrink: 0 }}>←</button>
        <div style={{
          width: '40px', height: '40px', borderRadius: '14px', flexShrink: 0,
          background: 'linear-gradient(135deg, #FF6B00, #FF8C42)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 900, fontSize: '1rem',
          boxShadow: '0 4px 12px rgba(255,107,0,0.3)',
        }}>
          {bid.vendorName?.charAt(0) || 'V'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {bid.vendorName || 'Vendor'}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>● Online · Negotiation Chat</div>
        </div>
        <button
          onClick={() => { setShowOfferPanel(v => !v); setCounterOffer(null); }}
          style={{
            padding: '7px 14px', borderRadius: '12px', border: 'none',
            background: showOfferPanel ? '#FF6B00' : 'rgba(255,107,0,0.1)',
            color: showOfferPanel ? '#fff' : '#FF6B00',
            fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          💰 Offer
        </button>
      </div>

      {/* ── Offer panel ── */}
      {showOfferPanel && (
        <div style={{
          background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.06)',
          padding: '16px', animation: 'fadeInUp 0.2s ease',
        }}>
          <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '12px', color: '#FF6B00' }}>
            {counterOffer ? `↩ Counter Offer (was ₹${counterOffer.pricePerPlate}/plate)` : '💰 Send Price Offer'}
          </div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#FF6B00' }}>₹</span>
              <input
                ref={inputRef}
                type="number"
                className="form-input"
                style={{ paddingLeft: '28px', minHeight: '44px', fontWeight: 800 }}
                placeholder="Price per plate"
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
            placeholder="Add a note (optional)..."
            value={offerNote}
            onChange={e => setOfferNote(e.target.value)}
          />
          <div style={{ fontSize: '0.72rem', color: '#9CA3AF', marginTop: '6px' }}>
            Current bid: ₹{bid.pricePerPlate}/plate · {request.plates} guests · Total ₹{bid.totalPrice?.toLocaleString('en-IN')}
          </div>
        </div>
      )}

      {/* ── Messages ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ textAlign: 'center', fontSize: '0.72rem', color: '#9CA3AF', padding: '4px 12px', background: 'rgba(0,0,0,0.04)', borderRadius: '999px', alignSelf: 'center' }}>
          Today · {request.eventName}
        </div>

        {messages.map(msg => {
          const isMe = msg.sender === 'customer';
          if (msg.type === 'offer') {
            return (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', gap: '4px' }}>
                <OfferCard
                  offer={msg.offer}
                  onAccept={handleAcceptOffer}
                  onCounter={handleCounterOffer}
                  isCustomer={true}
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
                maxWidth: '78%',
                fontSize: '0.9rem',
                lineHeight: 1.45,
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
          placeholder="Message..."
          style={{
            flex: 1, padding: '11px 16px', borderRadius: '22px',
            border: '1.5px solid rgba(0,0,0,0.08)', background: '#F7F7F7',
            outline: 'none', fontFamily: 'inherit', fontSize: '0.9rem',
            transition: 'border-color 0.2s',
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
            cursor: inputText.trim() ? 'pointer' : 'default',
            fontSize: '1.1rem', transition: 'all 0.2s',
            boxShadow: inputText.trim() ? '0 4px 12px rgba(255,107,0,0.3)' : 'none',
          }}
        >
          ➤
        </button>
      </div>

      {/* Typing dot animation */}
      <style>{`
        @keyframes typingDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
