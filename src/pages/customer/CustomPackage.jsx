import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BananaLeaf from './BananaLeaf';
import { Search, X, Leaf } from 'lucide-react';
import {
  CATEGORY_ORDER,
  getDishImage,
  groupByCategory,
  getMenuItems,
  MASTER_MENU,
  loadVendorMenuSelection,
  loadVendorDishNames,
  loadVendorDishPrices,
} from '../../utils/masterMenu';

// Short unique labels — no duplicates, no emoji
const CAT_LABEL = {
  'all':                     'All',
  'Veg Starters':            'Veg Starters',
  'Non-Veg Starters':        'Non-Veg Starters',
  'Veg Curries':             'Veg Curries',
  'Non-Veg Curries':         'Non-Veg Curries',
  'Rice Items':              'Rice',
  'Biryanis':                'Biryani',
  'South Indian Specials':   'South Indian',
  'Indian Breads':           'Breads',
  'Salads & Accompaniments': 'Salads',
  'Desserts & Sweets':       'Desserts',
  'Beverages':               'Beverages',
  'Live Counters':           'Live Counters',
  'Add-ons':                 'Add-ons',
};

// Veg/Non-Veg dot indicator
function VegDot({ subCategory }) {
  const color = subCategory === 'non-veg' ? '#dc2626' : subCategory === 'veg' ? '#16a34a' : null;
  if (!color) return null;
  return (
    <div style={{
      width: 16, height: 16, borderRadius: 3, flexShrink: 0,
      border: `1.5px solid ${color}`, background: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
    </div>
  );
}

// Swiggy-style dish card
function DishCard({ item, isSelected, onToggle }) {
  return (
    <div
      onClick={() => onToggle(item.name)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px',
        background: isSelected ? 'rgba(255,107,0,0.04)' : '#fff',
        borderBottom: '1px solid #f0f0f0',
        cursor: 'pointer', transition: 'background 0.15s',
      }}
    >
      {/* Food image */}
      <div style={{
        width: 90, height: 90, borderRadius: 16, flexShrink: 0,
        overflow: 'hidden', background: '#f5f5f5',
        border: isSelected ? '2px solid #FF6B00' : '1px solid #eee',
        position: 'relative', transition: 'border 0.15s',
      }}>
        <img
          src={getDishImage(item)}
          alt={item.name}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={e => {
            const fb = { 'Beverages': '/dish-raita.png', 'Desserts & Sweets': '/dish-gulab.png', 'Indian Breads': '/dish-naan.png', 'Rice Items': '/rice-real.png', 'Biryanis': '/dish-biryani.png', 'Non-Veg Curries': '/dish-butter-chicken.png' };
            e.currentTarget.src = fb[item.category] || '/dish-paneer.png';
          }}
        />
        {item.subCategory !== 'na' && (
          <div style={{ position: 'absolute', top: 4, left: 4 }}>
            <VegDot subCategory={item.subCategory} />
          </div>
        )}
      </div>

      {/* Name + price */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight: isSelected ? 700 : 500, fontSize: '0.9rem',
          color: isSelected ? '#1a1a1a' : '#333', lineHeight: 1.2, marginBottom: 4,
        }}>
          {item.name}
        </div>
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FF6B00' }}>
          ₹{item.price}
          <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: '0.72rem' }}>/plate</span>
        </div>
        {item.desc && (
          <div style={{ fontSize: '0.68rem', color: '#9ca3af', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.desc}
          </div>
        )}
      </div>

      {/* ADD / counter button */}
      <div style={{ flexShrink: 0 }}>
        {isSelected ? (
          <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #FF6B00', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FF6B00', color: '#fff', fontSize: '1.1rem', fontWeight: 900 }}>−</div>
            <div style={{ width: 28, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', color: '#FF6B00', fontSize: '0.8rem', fontWeight: 800 }}>1</div>
            <div style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FF6B00', color: '#fff', fontSize: '1.1rem', fontWeight: 900 }}>+</div>
          </div>
        ) : (
          <div style={{ padding: '6px 16px', borderRadius: 8, border: '1.5px solid #FF6B00', color: '#FF6B00', fontWeight: 700, fontSize: '0.82rem', background: '#fff' }}>
            ADD
          </div>
        )}
      </div>
    </div>
  );
}

export default function CustomPackage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { foodType = 'both', guests = 100, vendorId = null, vendorName = null } = location.state || {};

  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showLeaf, setShowLeaf] = useState(false);

  // Build the base item list:
  // If a vendorId is provided, show ONLY that vendor's enabled menu items
  // (with their custom names & prices). Otherwise fall back to full master menu.
  const allowedItems = useMemo(() => {
    let baseItems;
    if (vendorId) {
      const enabledIds    = loadVendorMenuSelection(vendorId);
      const customNames   = loadVendorDishNames(vendorId);
      const customPrices  = loadVendorDishPrices(vendorId);
      baseItems = MASTER_MENU
        .filter(d => d.type === 'menu_item' && enabledIds.has(d.id))
        .map(d => ({
          ...d,
          name:  customNames[d.id]  || d.name,
          price: customPrices[d.id] ?? d.price,
        }));
      if (baseItems.length === 0) {
        // Vendor hasn't configured their menu yet — fall back to all dishes
        baseItems = getMenuItems();
      }
    } else {
      baseItems = getMenuItems();
    }

    // Apply food-type filter
    return baseItems.filter(item => {
      if (foodType === 'veg' && item.subCategory === 'non-veg') return false;
      if (foodType === 'nonveg' && item.subCategory === 'veg' &&
        !['Indian Breads', 'Rice Items', 'Desserts & Sweets', 'Beverages', 'Salads & Accompaniments'].includes(item.category)) return false;
      return true;
    });
  }, [foodType, vendorId]);

  // Build unique categories list (no duplicates)
  const categories = useMemo(() => {
    const cats = [...new Set(allowedItems.map(i => i.category))];
    return ['all', ...CATEGORY_ORDER.filter(c => cats.includes(c))];
  }, [allowedItems]);

  const filtered = useMemo(() =>
    allowedItems.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = activeCategory === 'all' || item.category === activeCategory;
      return matchSearch && matchCat;
    }),
  [allowedItems, search, activeCategory]);

  const grouped = useMemo(() => groupByCategory(filtered), [filtered]);

  const toggle = (dishName) => {
    setSelected(prev =>
      prev.includes(dishName) ? prev.filter(d => d !== dishName) : [...prev, dishName]
    );
  };



  return (
    <div className="app-container" style={{ background: '#f8f8f8', minHeight: '100vh' }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '14px 16px', paddingTop: 'max(14px, env(safe-area-inset-top))',
        background: '#fff', borderBottom: '1px solid #f0f0f0',
        position: 'sticky', top: 0, zIndex: 50,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}>
        <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, borderRadius: '50%', background: '#f5f5f5', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', cursor: 'pointer' }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: '1rem', color: '#1a1a1a' }}>
            {vendorName ? `${vendorName}'s Menu` : 'Build Your Thali'}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '1px' }}>
            {selected.length} selected · {foodType === 'veg' ? 'Veg' : foodType === 'nonveg' ? 'Non-Veg' : 'All'} · {guests} guests
            {vendorId && <span style={{ marginLeft: 6, color: '#FF6B00', fontWeight: 700 }}>· Vendor menu</span>}
          </div>
        </div>
        {selected.length > 0 && (
          <div style={{ background: '#FF6B00', color: '#fff', borderRadius: '999px', padding: '4px 12px', fontSize: '0.78rem', fontWeight: 700 }}>
            {selected.length} items
          </div>
        )}
      </div>


      {/* ── Search bar ── */}
      <div style={{ padding: '10px 16px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f5f5f5', borderRadius: '12px', padding: '10px 14px' }}>
          <Search size={16} style={{ opacity: 0.5 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search dishes..."
            style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '0.88rem', fontFamily: 'inherit', outline: 'none', color: '#1a1a1a' }}
          />
          {search && <button onClick={() => setSearch('')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center', padding: 0 }}><X size={16} /></button>}
        </div>
      </div>

      {/* ── Banana leaf preview ── */}
      {selected.length > 0 && (
        <div style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', padding: '10px 16px' }}>
          <button
            onClick={() => setShowLeaf(v => !v)}
            style={{
              width: '100%', padding: '11px', borderRadius: '12px',
              background: showLeaf ? 'linear-gradient(135deg, #15803d, #166534)' : 'rgba(34,197,94,0.08)',
              color: showLeaf ? '#fff' : '#16a34a',
              fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'inherit',
              border: '1.5px solid rgba(34,197,94,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'all 0.2s',
            }}
          >
            {showLeaf ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><X size={16} /> Hide Plating Preview</span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Leaf size={16} /> Preview on Banana Leaf ({selected.length} dishes)</span>
            )}
          </button>
          {showLeaf && (
            <div style={{ marginTop: '12px', animation: 'fadeInUp 0.3s ease' }}>
              <BananaLeaf dishes={selected} interactive={true} onDishClick={dish => setSelected(prev => prev.filter(d => d !== dish))} />
              <p style={{ textAlign: 'center', fontSize: '0.72rem', color: '#9ca3af', marginTop: '6px' }}>Tap any dish to remove it from the thali</p>
            </div>
          )}
        </div>
      )}

      {/* ── Category tabs — NO icons, NO duplicates ── */}
      <div style={{ display: 'flex', gap: '0', overflowX: 'auto', background: '#fff', borderBottom: '1px solid #f0f0f0', scrollbarWidth: 'none' }}>
        {categories.map(cat => {
          const label = CAT_LABEL[cat] || cat;
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                flexShrink: 0, padding: '10px 14px',
                border: 'none', background: 'transparent',
                fontFamily: 'inherit', cursor: 'pointer',
                fontWeight: isActive ? 800 : 500, fontSize: '0.78rem',
                color: isActive ? '#FF6B00' : '#666',
                borderBottom: isActive ? '2.5px solid #FF6B00' : '2.5px solid transparent',
                transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Dish list ── */}
      <div style={{ paddingBottom: '100px' }}>
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat}>
            {/* Section header — no emoji icon */}
            <div style={{ padding: '14px 16px 8px', background: '#fff', marginTop: '8px', borderBottom: '1px solid #f5f5f5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1a1a1a' }}>{cat}</span>
                <span style={{ marginLeft: 'auto', fontSize: '0.68rem', fontWeight: 700, color: '#FF6B00', background: 'rgba(255,107,0,0.1)', padding: '2px 8px', borderRadius: '999px' }}>
                  {items.filter(i => selected.includes(i.name)).length}/{items.length}
                </span>
              </div>
            </div>
            <div style={{ background: '#fff' }}>
              {items.map(item => (
                <DishCard key={item.id} item={item} isSelected={selected.includes(item.name)} onToggle={toggle} />
              ))}
            </div>
          </div>
        ))}

        {Object.keys(grouped).length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: '#9ca3af' }}>
            <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center', color: '#9ca3af' }}><Search size={40} /></div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>No dishes found</div>
          </div>
        )}
      </div>

      {/* ── Bottom confirm bar ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: '480px',
        padding: '12px 16px', paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        background: '#fff', borderTop: '1px solid #f0f0f0',
        boxShadow: '0 -4px 16px rgba(0,0,0,0.08)',
      }}>
        {selected.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#666', marginBottom: '10px' }}>
            <span>{selected.length} dish{selected.length !== 1 ? 'es' : ''} selected</span>
          </div>
        )}
        <button
          onClick={() => {
            if (selected.length === 0) return;
            navigate(-1, { state: { customDishes: selected, customBudget: 0, vendorId, vendorName } });
          }}
          disabled={selected.length === 0}
          style={{
            width: '100%', padding: '15px', borderRadius: '14px', border: 'none',
            background: selected.length > 0 ? 'linear-gradient(135deg, #FF6B00, #FF8C42)' : '#e5e7eb',
            color: selected.length > 0 ? '#fff' : '#9ca3af',
            fontWeight: 800, fontSize: '1rem',
            cursor: selected.length > 0 ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit',
            boxShadow: selected.length > 0 ? '0 6px 20px rgba(255,107,0,0.3)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          {selected.length === 0
            ? 'Select dishes to build your thali'
            : `Confirm ${selected.length} dishes`}
        </button>
      </div>
    </div>
  );
}
