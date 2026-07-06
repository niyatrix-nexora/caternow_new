import { useState, useEffect, useMemo } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  CATEGORY_EMOJI,
  getDishImage,
  groupByCategory,
  getMenuItems,
  getLiveCounters,
  getAddons,
  loadVendorMenuSelection,
  saveVendorMenuSelection,
  loadVendorDishNames,
  saveVendorDishNames,
  loadVendorDishPrices,
  saveVendorDishPrices,
} from '../../utils/masterMenu';
import { Icon } from '../../utils/iconHelper';
import {
  Sparkles, Save, Search, Check, CheckCircle, X, Pencil, ArrowLeft,
  Home, Inbox, Calendar, IndianRupee, Menu
} from 'lucide-react';

const SUB_DOT = {
  veg:       { color: '#16a34a', label: 'Veg' },
  'non-veg': { color: '#dc2626', label: 'Non-Veg' },
  na:        { color: '#9ca3af', label: '—' },
};

const TAB_CONFIG = [
  { key: 'menu',   label: 'Menu Items',    iconName: 'Utensils', getItems: getMenuItems  },
  { key: 'live',   label: 'Live Counters', iconName: 'Flame', getItems: getLiveCounters },
  { key: 'addons', label: 'Add-ons',       iconName: 'Sparkles', getItems: getAddons     },
];

// ── Edit-name modal ────────────────────────────────────────
function EditDishModal({ item, customName, customPrice, onSave, onClose }) {
  const [name,  setName]  = useState(customName  || item.name);
  const [price, setPrice] = useState(customPrice ?? item.price ?? '');

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '480px',
          background: 'var(--bg-card)',
          borderRadius: '24px 24px 0 0',
          padding: '24px 20px 32px',
          animation: 'slideUp 0.25s ease',
        }}
      >
        {/* Handle */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border)', margin: '0 auto 20px' }} />

        {/* Dish preview */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 20 }}>
          <img
            src={getDishImage(item)}
            alt={item.name}
            style={{ width: 64, height: 64, borderRadius: 14, objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border)' }}
            onError={e => { e.currentTarget.src = '/dish-paneer.png'; }}
          />
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>Global name</div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.name}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{item.category}</div>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
            Your Custom Display Name
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={item.name}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '12px 14px', borderRadius: 14,
              border: '1.5px solid var(--border)',
              background: 'var(--bg-input)',
              color: 'var(--text)', fontSize: '0.95rem',
              fontFamily: 'inherit', outline: 'none',
            }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
            Price per Plate (₹)
          </label>
          <input
            type="number"
            value={price}
            onChange={e => setPrice(e.target.value)}
            placeholder={item.price ?? ''}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '12px 14px', borderRadius: 14,
              border: '1.5px solid var(--border)',
              background: 'var(--bg-input)',
              color: 'var(--text)', fontSize: '0.95rem',
              fontFamily: 'inherit', outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '13px', borderRadius: 14, border: '1.5px solid var(--border)',
              background: 'var(--bg-elevated)', color: 'var(--text-muted)',
              fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >Cancel</button>
          <button
            onClick={() => onSave(name.trim() || item.name, price !== '' ? Number(price) : item.price)}
            style={{
              flex: 2, padding: '13px', borderRadius: 14, border: 'none',
              background: 'linear-gradient(135deg,#FF6B00,#FF8C42)',
              color: '#fff', fontWeight: 800, fontSize: '0.88rem',
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}
          >
            <Check size={18} />
            <span>Save</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Dish card (card-style like the reference image) ─────────
function DishCard({ item, isOn, customName, customPrice, onToggle, onEdit }) {
  const dot   = SUB_DOT[item.subCategory] || SUB_DOT.na;
  const dName = customName  || item.name;
  const dPrice = customPrice ?? item.price ?? 0;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 14px',
      background: isOn ? 'rgba(255,107,0,0.04)' : 'var(--bg-card)',
      borderBottom: '1px solid var(--border)',
      transition: 'background 0.15s',
    }}>
      {/* Dish image */}
      <div style={{
        width: 68, height: 68, borderRadius: 14, flexShrink: 0,
        overflow: 'hidden', border: '1px solid var(--border)',
        background: 'var(--bg-elevated)',
        position: 'relative',
      }}>
        <img
          src={getDishImage(item)}
          alt={dName}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={e => { e.currentTarget.src = '/dish-paneer.png'; }}
        />
        {/* Veg/non-veg dot overlay */}
        {item.subCategory !== 'na' && (
          <div style={{
            position: 'absolute', top: 4, left: 4,
            width: 14, height: 14, borderRadius: 3,
            background: '#fff', border: `1.5px solid ${dot.color}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: dot.color }} />
          </div>
        )}
      </div>

      {/* Name + price */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight: isOn ? 700 : 500, fontSize: '0.88rem',
          color: isOn ? 'var(--text)' : 'var(--text-secondary)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {dName}
          {customName && customName !== item.name && (
            <Pencil size={10} style={{ marginLeft: 5, color: '#FF6B00', display: 'inline-block' }} />
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FF6B00' }}>₹{dPrice}<span style={{ fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.7rem' }}>/plate</span></span>
          {customPrice !== undefined && customPrice !== item.price && (
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>₹{item.price}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {/* Edit pencil */}
        <button
          onClick={e => { e.stopPropagation(); onEdit(); }}
          style={{
            width: 32, height: 32, borderRadius: 10,
            border: '1.5px solid var(--border)',
            background: 'var(--bg-elevated)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: '0.85rem',
          }}
          title="Edit display name & price"
        >
          <Pencil size={14} style={{ color: 'var(--text-secondary)' }} />
        </button>

        {/* Toggle */}
        <div
          onClick={onToggle}
          style={{
            width: 40, height: 22, borderRadius: 11, cursor: 'pointer',
            background: isOn ? '#FF6B00' : 'var(--border)',
            position: 'relative', transition: 'background 0.25s', flexShrink: 0,
          }}
        >
          <div style={{
            width: 18, height: 18, borderRadius: '50%', background: '#fff',
            position: 'absolute', top: 2,
            left: isOn ? '20px' : '2px', transition: 'left 0.25s',
            boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
          }} />
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────
export default function MenuManagement() {
  const { user } = useApp();
  const navigate = useNavigate();

  const [tab,          setTab]          = useState('menu');
  const [enabledIds,   setEnabledIds]   = useState(new Set());
  const [customNames,  setCustomNames]  = useState({});
  const [customPrices, setCustomPrices] = useState({});
  const [search,       setSearch]       = useState('');
  const [subFilter,    setSubFilter]    = useState('all');
  const [collapsed,    setCollapsed]    = useState({});
  const [saved,        setSaved]        = useState(false);
  const [saveAnim,     setSaveAnim]     = useState(false);
  const [editItem,     setEditItem]     = useState(null);

  useEffect(() => { if (!user || user.role !== 'vendor') navigate('/'); }, [user, navigate]);

  useEffect(() => {
    if (!user) return;
    setEnabledIds(loadVendorMenuSelection(user.id));
    setCustomNames(loadVendorDishNames(user.id));
    setCustomPrices(loadVendorDishPrices(user.id));
  }, [user]);

  const toggle = (id) => {
    setSaved(false);
    setEnabledIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSave = () => {
    saveVendorMenuSelection(user.id, enabledIds);
    saveVendorDishNames(user.id, customNames);
    saveVendorDishPrices(user.id, customPrices);
    setSaved(true);
    setSaveAnim(true);
    setTimeout(() => setSaveAnim(false), 600);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleEditSave = (name, price) => {
    if (!editItem) return;
    setCustomNames(prev => ({ ...prev, [editItem.id]: name }));
    setCustomPrices(prev => ({ ...prev, [editItem.id]: price }));
    setSaved(false);
    setEditItem(null);
  };

  const currentTab = TAB_CONFIG.find(t => t.key === tab);
  const allItems   = currentTab.getItems();

  const filtered = useMemo(() =>
    allItems.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
                          (customNames[item.id] || '').toLowerCase().includes(search.toLowerCase());
      const matchSub    = subFilter === 'all' || item.subCategory === subFilter;
      return matchSearch && matchSub;
    }),
  [allItems, search, subFilter, customNames]);

  const grouped        = groupByCategory(filtered);
  const totalSelected  = enabledIds.size;

  const toggleCollapse = cat => setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }));

  const selectAll = items => {
    setSaved(false);
    setEnabledIds(prev => { const n = new Set(prev); items.forEach(i => n.add(i.id)); return n; });
  };
  const clearAll = items => {
    setSaved(false);
    setEnabledIds(prev => { const n = new Set(prev); items.forEach(i => n.delete(i.id)); return n; });
  };

  if (!user) return null;

  return (
    <div className="app-container">
      {/* ── Header ── */}
      <div className="page-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '12px', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
          <button className="back-btn" onClick={() => navigate('/vendor')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={18} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 800 }}>Manage Menu</h1>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {totalSelected} dish{totalSelected !== 1 ? 'es' : ''} active · tap <Pencil size={9} /> to rename a dish
            </p>
          </div>
          <button
            onClick={handleSave}
            style={{
              padding: '8px 16px', borderRadius: '12px', border: 'none',
              background: saved ? '#059669' : 'linear-gradient(135deg,#FF6B00,#FF8C42)',
              color: '#fff', fontWeight: 700, fontSize: '0.8rem',
              cursor: 'pointer', fontFamily: 'inherit',
              transform: saveAnim ? 'scale(0.95)' : 'scale(1)',
              transition: 'all 0.2s', whiteSpace: 'nowrap',
              boxShadow: saved ? '0 4px 12px rgba(5,150,105,0.3)' : '0 4px 12px rgba(255,107,0,0.3)',
            }}
          >
            {saved ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <CheckCircle size={16} /> Saved!
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <Save size={16} /> Save
              </span>
            )}
          </button>
        </div>

        {/* ── Type tabs ── */}
        <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
          {TAB_CONFIG.map(t => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setSearch(''); setSubFilter('all'); }}
              style={{
                flex: 1, padding: '8px 4px', borderRadius: '12px',
                border: `2px solid ${tab === t.key ? '#FF6B00' : 'var(--border)'}`,
                background: tab === t.key ? 'rgba(255,107,0,0.1)' : 'var(--bg-card)',
                color: tab === t.key ? '#FF6B00' : 'var(--text-muted)',
                fontWeight: tab === t.key ? 800 : 500, fontSize: '0.7rem',
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
              }}
            >
              <Icon name={t.iconName} size={16} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="page" style={{ paddingBottom: '90px', paddingTop: '8px' }}>

        {/* ── Search + filter ── */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: '8px',
            background: 'var(--bg-input)', border: '1.5px solid var(--border)',
            borderRadius: '12px', padding: '8px 12px',
          }}>
            <Search size={16} style={{ color: 'var(--text-muted)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search dishes…"
              style={{
                flex: 1, border: 'none', background: 'transparent',
                color: 'var(--text)', fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit',
              }}
            />
            {search && (
              <button onClick={() => setSearch('')}
                style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}>
                <X size={14} />
              </button>
            )}
          </div>
          {tab === 'menu' && (
            <select
              value={subFilter}
              onChange={e => setSubFilter(e.target.value)}
              style={{
                padding: '8px 10px', borderRadius: '12px',
                border: '1.5px solid var(--border)', background: 'var(--bg-input)',
                color: 'var(--text)', fontSize: '0.78rem', fontFamily: 'inherit', outline: 'none',
              }}
            >
              <option value="all">All</option>
              <option value="veg">Veg</option>
              <option value="non-veg">Non-Veg</option>
            </select>
          )}
        </div>

        {/* ── Quick actions ── */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            onClick={() => selectAll(filtered)}
            style={{
              flex: 1, padding: '7px', borderRadius: '10px',
              border: '1.5px solid #FF6B00', background: 'rgba(255,107,0,0.08)',
              color: '#FF6B00', fontWeight: 700, fontSize: '0.75rem',
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
            }}
          >
            <Check size={14} />
            <span>Select All</span>
          </button>
          <button
            onClick={() => clearAll(filtered)}
            style={{
              flex: 1, padding: '7px', borderRadius: '10px',
              border: '1.5px solid var(--border)', background: 'var(--bg-card)',
              color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem',
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
            }}
          >
            <X size={14} />
            <span>Deselect All</span>
          </button>
        </div>

        {/* ── Empty state ── */}
        {Object.keys(grouped).length === 0 && (
          <div className="empty-state">
            <div className="empty-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
              <Search size={40} style={{ color: 'var(--text-muted)' }} />
            </div>
            <h3>No dishes found</h3>
            <p>Try a different search term.</p>
          </div>
        )}

        {/* ── Category sections ── */}
        {Object.entries(grouped).map(([cat, items]) => {
          const catSelected = items.filter(i => enabledIds.has(i.id)).length;
          const isCollapsed = collapsed[cat];
          const emoji = CATEGORY_EMOJI[cat] || 'Utensils';

          return (
            <div key={cat} style={{
              marginBottom: '12px', borderRadius: '18px', overflow: 'hidden',
              border: '1.5px solid var(--border)', background: 'var(--bg-card)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
            }}>
              {/* Category header */}
              <div
                onClick={() => toggleCollapse(cat)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '13px 14px', cursor: 'pointer',
                  borderBottom: isCollapsed ? 'none' : '1px solid var(--border)',
                  background: 'var(--bg-elevated)',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <Icon name={emoji} size={20} style={{ color: 'var(--primary)' }} />
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text)' }}>{cat}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                    {catSelected}/{items.length} enabled
                  </div>
                </div>
                {catSelected > 0 && (
                  <span style={{
                    padding: '3px 10px', borderRadius: '999px', fontSize: '0.65rem', fontWeight: 700,
                    background: 'rgba(255,107,0,0.12)', color: '#FF6B00', border: '1px solid rgba(255,107,0,0.2)',
                  }}>
                    {catSelected} active
                  </span>
                )}
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '4px' }}>
                  {isCollapsed ? '▸' : '▾'}
                </span>
              </div>

              {/* Dish cards */}
              {!isCollapsed && (
                <div>
                  {items.map(item => (
                    <DishCard
                      key={item.id}
                      item={item}
                      isOn={enabledIds.has(item.id)}
                      customName={customNames[item.id]}
                      customPrice={customPrices[item.id]}
                      onToggle={() => toggle(item.id)}
                      onEdit={() => setEditItem(item)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* ── Save reminder ── */}
        {!saved && totalSelected > 0 && (
          <div style={{
            textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)',
            padding: '12px', marginTop: '4px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
          }}>
            <Sparkles size={14} style={{ color: 'var(--primary)' }} />
            <span>Tap <strong>Save</strong> to publish your menu</span>
          </div>
        )}
      </div>

      {/* ── Bottom nav ── */}
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
          <IndianRupee size={20} className="nav-icon" />
          <span>Earnings</span>
        </NavLink>
        <NavLink to="/vendor/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Menu size={20} className="nav-icon" />
          <span>More</span>
        </NavLink>
      </div>

      {/* ── Edit dish name/price modal ── */}
      {editItem && (
        <EditDishModal
          item={editItem}
          customName={customNames[editItem.id]}
          customPrice={customPrices[editItem.id]}
          onSave={handleEditSave}
          onClose={() => setEditItem(null)}
        />
      )}
    </div>
  );
}
