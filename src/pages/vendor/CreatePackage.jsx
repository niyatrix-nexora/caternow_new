import { useState, useEffect, useMemo } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { loadVendorPackages, saveVendorPackages, PACKAGE_META, DEFAULT_PACKAGES } from '../../utils/packages';
import {
  MASTER_MENU,
  CATEGORY_ORDER,
  CATEGORY_EMOJI,
  getDishImage,
  groupByCategory,
} from '../../utils/masterMenu';

// ── Items from global master menu ─────────────────────────────────────────────
const DISH_ITEMS  = MASTER_MENU.filter(d => d.type === 'menu_item');
const ADDON_ITEMS = MASTER_MENU.filter(d => d.type === 'addon' || d.type === 'live_counter');

const SUB_DOT_COLOR = { veg: '#16a34a', 'non-veg': '#dc2626', na: '#6b7280' };

// ── Single dish image-card row (used in selected list & picker) ───────────────
function DishRow({ item, isSelected, onToggle, metaColor, metaBg, metaBorder, showPrice = true }) {
  const dotColor = SUB_DOT_COLOR[item.subCategory] || '#6b7280';
  return (
    <div
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 12px',
        background: isSelected ? metaBg : 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        cursor: 'pointer', transition: 'background 0.15s',
      }}
    >
      {/* Dish image */}
      <div style={{
        width: 58, height: 58, borderRadius: 12, flexShrink: 0,
        overflow: 'hidden', border: `1.5px solid ${isSelected ? metaBorder : 'var(--border)'}`,
        background: 'var(--bg-elevated)', position: 'relative',
      }}>
        <img
          src={getDishImage(item)}
          alt={item.name}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={e => { e.currentTarget.src = '/dish-paneer.png'; }}
        />
        {/* Veg/non-veg dot */}
        {item.subCategory !== 'na' && (
          <div style={{
            position: 'absolute', top: 3, left: 3,
            width: 12, height: 12, borderRadius: 2,
            background: '#fff', border: `1.5px solid ${dotColor}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor }} />
          </div>
        )}
      </div>

      {/* Name + price */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight: isSelected ? 700 : 500, fontSize: '0.88rem',
          color: isSelected ? 'var(--text)' : 'var(--text-secondary)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{item.name}</div>
        {showPrice && item.price > 0 && (
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FF6B00', marginTop: 2 }}>
            ₹{item.price}<span style={{ fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.68rem' }}>/plate</span>
          </div>
        )}
      </div>

      {/* Checkbox toggle */}
      <div style={{
        width: 22, height: 22, borderRadius: 6, flexShrink: 0,
        border: `2px solid ${isSelected ? metaColor : 'var(--border)'}`,
        background: isSelected ? metaColor : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s',
      }}>
        {isSelected && <span style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 900 }}>✓</span>}
      </div>
    </div>
  );
}

export default function CreatePackage() {
  const { user } = useApp();
  const navigate = useNavigate();
  const [packages,       setPackages]       = useState([]);
  const [activeIdx,      setActiveIdx]      = useState(0);
  const [saved,          setSaved]          = useState(false);
  const [showPicker,     setShowPicker]     = useState(false);   // combined dish+addon picker
  const [pickerTab,      setPickerTab]      = useState('dishes'); // 'dishes' | 'addons'
  const [dishSearch,     setDishSearch]     = useState('');
  const [dishCatFilter,  setDishCatFilter]  = useState('all');
  const [dishSubFilter,  setDishSubFilter]  = useState('all');

  useEffect(() => { if (!user || user.role !== 'vendor') navigate('/'); }, [user, navigate]);
  useEffect(() => { if (!user) return; setPackages(loadVendorPackages(user.id)); }, [user]);

  if (!user || packages.length === 0) return null;

  const pkg  = packages[activeIdx];
  const meta = PACKAGE_META[pkg.category] || PACKAGE_META.custom;

  const updatePkg = (field, value) => {
    setSaved(false);
    setPackages(prev => prev.map((p, i) => i === activeIdx ? { ...p, [field]: value } : p));
  };

  // ── Toggle dish (by name, dedup guaranteed) ──────────────────────────────────
  const toggleDish = (name) => {
    const current = [...new Set(pkg.dishes || [])]; // ensure no dupes
    updatePkg('dishes', current.includes(name) ? current.filter(d => d !== name) : [...current, name]);
  };

  const toggleAddon = (name) => {
    const current = [...new Set(pkg.addOns || [])];
    updatePkg('addOns', current.includes(name) ? current.filter(a => a !== name) : [...current, name]);
  };

  const handleSave = () => {
    // Deduplicate before saving
    const clean = packages.map(p => ({
      ...p,
      dishes: [...new Set(p.dishes || [])],
      addOns: [...new Set(p.addOns || [])],
    }));
    saveVendorPackages(user.id, clean);
    setPackages(clean);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    setPackages(DEFAULT_PACKAGES.map(p => ({ ...p, id: `${user.id}_${p.category}`, vendorId: user.id })));
    setSaved(false);
  };

  // ── Filtered dish items ───────────────────────────────────────────────────────
  const dishCategories = CATEGORY_ORDER.filter(c => DISH_ITEMS.some(d => d.category === c));

  const filteredDishes = useMemo(() =>
    DISH_ITEMS.filter(item => {
      const matchName = item.name.toLowerCase().includes(dishSearch.toLowerCase());
      const matchCat  = dishCatFilter === 'all' || item.category === dishCatFilter;
      const matchSub  = dishSubFilter === 'all' || item.subCategory === dishSubFilter;
      return matchName && matchCat && matchSub;
    }),
  [dishSearch, dishCatFilter, dishSubFilter]);

  const groupedDishes = useMemo(() => groupByCategory(filteredDishes), [filteredDishes]);

  // ── Selected dishes as full master menu objects (no duplicates) ───────────────
  const selectedDishNames = [...new Set(pkg.dishes || [])];
  const selectedDishObjects = selectedDishNames
    .map(name => MASTER_MENU.find(m => m.name === name))
    .filter(Boolean);
  const selectedDishGrouped = groupByCategory(selectedDishObjects);

  const selectedAddonNames = [...new Set(pkg.addOns || [])];

  return (
    <div className="app-container">
      {/* ── Header ── */}
      <div className="page-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '10px', paddingBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
          <button className="back-btn" onClick={() => navigate('/vendor')}>←</button>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: '1.1rem' }}>Package Management</h1>
            <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {selectedDishNames.length} dishes in {meta.label} package
            </p>
          </div>
          <button
            onClick={handleSave}
            style={{
              padding: '8px 16px', borderRadius: '12px', border: 'none',
              background: saved ? '#059669' : `linear-gradient(135deg,${meta.color},${meta.color}cc)`,
              color: '#fff', fontWeight: 700, fontSize: '0.8rem',
              cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
              boxShadow: `0 4px 12px ${meta.color}40`,
            }}
          >
            {saved ? '✅ Saved!' : '💾 Save'}
          </button>
        </div>

        {/* ── Package tabs ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', width: '100%' }}>
          {packages.map((p, i) => {
            const m = PACKAGE_META[p.category] || PACKAGE_META.custom;
            const isAct = i === activeIdx;
            return (
              <button
                key={p.category}
                onClick={() => { setActiveIdx(i); setShowPicker(false); setDishSearch(''); setDishCatFilter('all'); setDishSubFilter('all'); }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                  padding: '8px 4px', borderRadius: '14px',
                  border: `2px solid ${isAct ? m.color : 'var(--border)'}`,
                  background: isAct ? m.bg : 'var(--bg-card)',
                  cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>{m.emoji}</span>
                <span style={{ fontSize: '0.6rem', fontWeight: 800, color: isAct ? m.color : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  {m.label}
                </span>
                <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>
                  {(p.dishes || []).length} dishes
                </span>
                {!p.isActive && <span style={{ fontSize: '0.5rem', color: '#9CA3AF' }}>OFF</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="page" style={{ paddingBottom: '100px', paddingTop: '8px' }}>

        {/* ── Package settings card ── */}
        <div style={{
          background: meta.bg, border: `1.5px solid ${meta.border}`,
          borderRadius: '20px', padding: '16px', marginBottom: '14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <span style={{ fontSize: '1.4rem' }}>{meta.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: meta.color }}>{meta.label} Package</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                {selectedDishNames.length} dishes · {selectedAddonNames.length} add-ons
              </div>
            </div>
            {/* Active toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{pkg.isActive ? 'Active' : 'Off'}</span>
              <div
                onClick={() => updatePkg('isActive', !pkg.isActive)}
                style={{
                  width: '38px', height: '20px', borderRadius: '10px',
                  background: pkg.isActive ? meta.color : '#D1D5DB',
                  position: 'relative', cursor: 'pointer', transition: '0.3s',
                }}
              >
                <div style={{
                  width: '16px', height: '16px', borderRadius: '50%', background: '#fff',
                  position: 'absolute', top: '2px',
                  left: pkg.isActive ? '20px' : '2px', transition: '0.3s',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                }} />
              </div>
            </label>
          </div>

          {/* Title + Price in a row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', marginBottom: '10px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.7rem' }}>Package Title</label>
              <input className="form-input" value={pkg.title} onChange={e => updatePkg('title', e.target.value)} placeholder="e.g. Standard Package" style={{ minHeight: '40px' }} />
            </div>
            <div className="form-group" style={{ marginBottom: 0, minWidth: '90px' }}>
              <label className="form-label" style={{ fontSize: '0.7rem' }}>₹ / Plate</label>
              <input
                type="number"
                className="form-input"
                style={{ paddingLeft: '12px', minHeight: '40px', fontWeight: 800, fontSize: '1rem', width: '90px' }}
                value={pkg.pricePerPlate}
                onChange={e => updatePkg('pricePerPlate', parseInt(e.target.value) || 0)}
                min={50}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.7rem' }}>Description</label>
            <textarea className="form-input" rows={2} value={pkg.description} onChange={e => updatePkg('description', e.target.value)} placeholder="Describe this package..." style={{ minHeight: '60px', resize: 'none' }} />
          </div>
        </div>

        {/* ── Selected Dishes — IMAGE CARD VIEW ── */}
        <div style={{
          borderRadius: '18px', overflow: 'hidden',
          border: '1.5px solid var(--border)', background: 'var(--bg-card)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.05)', marginBottom: '12px',
        }}>
          {/* Section header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '12px 14px', background: 'var(--bg-elevated)',
            borderBottom: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: '1.1rem' }}>🍽️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>Included Dishes</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{selectedDishNames.length} dishes selected</div>
            </div>
            <button
              onClick={() => { setShowPicker(v => !v); setPickerTab('dishes'); }}
              style={{
                padding: '6px 14px', borderRadius: '10px',
                border: `1.5px solid ${meta.color}`,
                background: showPicker && pickerTab === 'dishes' ? meta.bg : 'transparent',
                color: meta.color, fontWeight: 700, fontSize: '0.75rem',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {showPicker && pickerTab === 'dishes' ? 'Done ✓' : '+ Edit'}
            </button>
          </div>

          {/* Selected dishes by category — image-card style */}
          {selectedDishNames.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🍽️</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No dishes selected — tap Edit to add dishes</div>
            </div>
          ) : (
            Object.entries(selectedDishGrouped).map(([catLabel, items]) => (
              <div key={catLabel}>
                {/* Category mini-header */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 14px',
                  background: 'var(--bg-elevated)',
                  borderBottom: '1px solid var(--border)',
                  borderTop: '1px solid var(--border)',
                }}>
                  <span style={{ fontSize: '0.9rem' }}>{CATEGORY_EMOJI[catLabel] || '🍽️'}</span>
                  <span style={{ fontWeight: 700, fontSize: '0.78rem', flex: 1 }}>{catLabel}</span>
                  <span style={{
                    fontSize: '0.6rem', fontWeight: 700, padding: '2px 7px', borderRadius: '999px',
                    background: `${meta.color}18`, color: meta.color, border: `1px solid ${meta.color}30`,
                  }}>{items.length}</span>
                </div>
                {items.map((item, idx) => (
                  <DishRow
                    key={item.id}
                    item={item}
                    isSelected
                    onToggle={() => toggleDish(item.name)}
                    metaColor={meta.color}
                    metaBg={meta.bg}
                    metaBorder={meta.border}
                    showPrice
                  />
                ))}
              </div>
            ))
          )}
        </div>

        {/* ── Selected Add-ons ── */}
        <div style={{
          borderRadius: '18px', overflow: 'hidden',
          border: '1.5px solid rgba(124,58,237,0.2)', background: 'var(--bg-card)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.05)', marginBottom: '14px',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '12px 14px', background: 'rgba(124,58,237,0.05)',
            borderBottom: selectedAddonNames.length > 0 ? '1px solid var(--border)' : 'none',
          }}>
            <span style={{ fontSize: '1.1rem' }}>✨</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>Add-ons & Live Counters</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{selectedAddonNames.length} selected</div>
            </div>
            <button
              onClick={() => { setShowPicker(v => !v); setPickerTab('addons'); }}
              style={{
                padding: '6px 14px', borderRadius: '10px',
                border: '1.5px solid #7C3AED',
                background: showPicker && pickerTab === 'addons' ? 'rgba(124,58,237,0.08)' : 'transparent',
                color: '#7C3AED', fontWeight: 700, fontSize: '0.75rem',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {showPicker && pickerTab === 'addons' ? 'Done ✓' : '+ Edit'}
            </button>
          </div>
          {selectedAddonNames.length === 0 && (
            <div style={{ padding: '16px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              No add-ons selected
            </div>
          )}
          {selectedAddonNames.map(addonName => {
            const item = MASTER_MENU.find(m => m.name === addonName);
            if (!item) return null;
            return (
              <DishRow
                key={addonName}
                item={item}
                isSelected
                onToggle={() => toggleAddon(addonName)}
                metaColor="#7C3AED"
                metaBg="rgba(124,58,237,0.07)"
                metaBorder="rgba(124,58,237,0.25)"
                showPrice
              />
            );
          })}
        </div>

        {/* ── PICKER PANEL ── */}
        {showPicker && (
          <div style={{
            borderRadius: '18px', overflow: 'hidden',
            border: '1.5px solid var(--border)', background: 'var(--bg-card)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginBottom: '14px',
          }}>
            {/* Picker header */}
            <div style={{
              padding: '12px 14px',
              background: 'var(--bg-elevated)',
              borderBottom: '1px solid var(--border)',
            }}>
              {/* Tab switcher */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                {[
                  { key: 'dishes', label: '🍽️ Dishes', color: meta.color },
                  { key: 'addons', label: '✨ Add-ons', color: '#7C3AED' },
                ].map(t => (
                  <button key={t.key} onClick={() => setPickerTab(t.key)} style={{
                    flex: 1, padding: '7px', borderRadius: '10px',
                    border: `1.5px solid ${pickerTab === t.key ? t.color : 'var(--border)'}`,
                    background: pickerTab === t.key ? `${t.color}15` : 'var(--bg-card)',
                    color: pickerTab === t.key ? t.color : 'var(--text-muted)',
                    fontWeight: pickerTab === t.key ? 800 : 500, fontSize: '0.78rem',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>{t.label}</button>
                ))}
              </div>

              {/* Search + filter (dishes only) */}
              {pickerTab === 'dishes' && (
                <>
                  <div style={{
                    display: 'flex', gap: '6px', marginBottom: '8px',
                  }}>
                    <div style={{
                      flex: 1, display: 'flex', alignItems: 'center', gap: '6px',
                      background: 'var(--bg-input)', border: '1.5px solid var(--border)',
                      borderRadius: '10px', padding: '6px 10px',
                    }}>
                      <span style={{ opacity: 0.4 }}>🔍</span>
                      <input
                        value={dishSearch}
                        onChange={e => setDishSearch(e.target.value)}
                        placeholder="Search dishes…"
                        style={{ flex: 1, border: 'none', background: 'transparent', color: 'var(--text)', fontSize: '0.8rem', outline: 'none', fontFamily: 'inherit' }}
                      />
                      {dishSearch && (
                        <button onClick={() => setDishSearch('')} style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}>✕</button>
                      )}
                    </div>
                    <select value={dishSubFilter} onChange={e => setDishSubFilter(e.target.value)}
                      style={{ padding: '6px 8px', borderRadius: '10px', border: '1.5px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text)', fontSize: '0.75rem', fontFamily: 'inherit', outline: 'none' }}>
                      <option value="all">All</option>
                      <option value="veg">🟢 Veg</option>
                      <option value="non-veg">🔴 Non-Veg</option>
                    </select>
                  </div>

                  {/* Category pills */}
                  <div style={{ display: 'flex', gap: '5px', overflowX: 'auto', paddingBottom: '2px' }}>
                    {['all', ...dishCategories].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setDishCatFilter(cat)}
                        style={{
                          padding: '4px 9px', borderRadius: '999px', whiteSpace: 'nowrap', flexShrink: 0,
                          border: `1.5px solid ${dishCatFilter === cat ? meta.color : 'var(--border)'}`,
                          background: dishCatFilter === cat ? meta.bg : 'var(--bg-input)',
                          color: dishCatFilter === cat ? meta.color : 'var(--text-muted)',
                          fontSize: '0.65rem', fontWeight: dishCatFilter === cat ? 700 : 500,
                          cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        {cat === 'all' ? '🌐 All' : `${CATEGORY_EMOJI[cat] || ''} ${cat}`}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Dish list */}
            {pickerTab === 'dishes' && (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {Object.entries(groupedDishes).map(([cat, items]) => (
                  <div key={cat}>
                    <div style={{
                      padding: '8px 14px', fontSize: '0.68rem', fontWeight: 800,
                      color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px',
                      background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', gap: '5px',
                    }}>
                      <span>{CATEGORY_EMOJI[cat] || '🍽️'}</span> {cat}
                      <span style={{
                        marginLeft: 'auto', fontSize: '0.6rem', fontWeight: 700,
                        padding: '1px 6px', borderRadius: '999px',
                        background: `${meta.color}18`, color: meta.color,
                      }}>
                        {items.filter(i => selectedDishNames.includes(i.name)).length}/{items.length}
                      </span>
                    </div>
                    {items.map(item => (
                      <DishRow
                        key={item.id}
                        item={item}
                        isSelected={selectedDishNames.includes(item.name)}
                        onToggle={() => toggleDish(item.name)}
                        metaColor={meta.color}
                        metaBg={meta.bg}
                        metaBorder={meta.border}
                        showPrice
                      />
                    ))}
                  </div>
                ))}
                {Object.keys(groupedDishes).length === 0 && (
                  <div style={{ padding: '24px', textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    No dishes match your filters
                  </div>
                )}
              </div>
            )}

            {/* Addon list */}
            {pickerTab === 'addons' && (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {['addon', 'live_counter'].map(type => {
                  const typeItems = ADDON_ITEMS.filter(i => i.type === type);
                  const typeLabel = type === 'addon' ? '✨ Add-ons' : '🔥 Live Counters';
                  return (
                    <div key={type}>
                      <div style={{
                        padding: '8px 14px', fontSize: '0.68rem', fontWeight: 800,
                        color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px',
                        background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)',
                      }}>{typeLabel}</div>
                      {typeItems.map(item => (
                        <DishRow
                          key={item.id}
                          item={item}
                          isSelected={selectedAddonNames.includes(item.name)}
                          onToggle={() => toggleAddon(item.name)}
                          metaColor="#7C3AED"
                          metaBg="rgba(124,58,237,0.07)"
                          metaBorder="rgba(124,58,237,0.25)"
                          showPrice
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── All packages summary ── */}
        <div style={{
          borderRadius: '18px', overflow: 'hidden',
          border: '1.5px solid var(--border)', background: 'var(--bg-card)',
          marginBottom: '14px',
        }}>
          <div style={{
            padding: '12px 14px', fontWeight: 800, fontSize: '0.88rem',
            borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)',
          }}>📊 All Packages</div>
          {packages.map((p, i) => {
            const m = PACKAGE_META[p.category] || PACKAGE_META.custom;
            return (
              <div key={p.category} onClick={() => setActiveIdx(i)} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '11px 14px',
                background: i === activeIdx ? m.bg : 'var(--bg-card)',
                borderBottom: i < packages.length - 1 ? '1px solid var(--border)' : 'none',
                cursor: 'pointer', transition: 'background 0.15s',
              }}>
                <span style={{ fontSize: '1.1rem' }}>{m.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: i === activeIdx ? m.color : 'var(--text)' }}>{p.title}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{(p.dishes || []).length} dishes · {(p.addOns || []).length} add-ons</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, color: m.color, fontSize: '0.95rem' }}>₹{p.pricePerPlate}</div>
                  <div style={{ fontSize: '0.62rem', color: p.isActive ? '#059669' : '#9CA3AF', fontWeight: 700 }}>
                    {p.isActive ? '● Active' : '○ Off'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Save / Reset ── */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-primary"
            style={{ flex: 2, background: `linear-gradient(135deg,${meta.color},${meta.color}cc)`, border: 'none' }}
            onClick={handleSave}
          >
            {saved ? '✅ Saved!' : '💾 Save All Packages'}
          </button>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleReset}>↺ Reset</button>
        </div>
        {saved && (
          <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#059669', marginTop: '10px' }}>
            ✓ All packages saved — customers can now see your pricing
          </p>
        )}
      </div>

      {/* ── Bottom nav ── */}
      <div className="bottom-nav">
        <NavLink to="/vendor" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
          <span className="nav-icon">🏠</span><span>Home</span>
        </NavLink>
        <NavLink to="/vendor/requests" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">📥</span><span>Requests</span>
        </NavLink>
        <NavLink to="/vendor/bookings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">📅</span><span>Bookings</span>
        </NavLink>
        <NavLink to="/vendor/earnings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">💰</span><span>Earnings</span>
        </NavLink>
        <NavLink to="/vendor/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">☰</span><span>More</span>
        </NavLink>
      </div>
    </div>
  );
}
