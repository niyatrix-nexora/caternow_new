import { useState, useEffect } from 'react';
import { MASTER_MENU } from '../../utils/masterMenu';

// ── Image map ─────────────────────────────────────────────────────────────────
const MENU_IMG_MAP = {};
MASTER_MENU.forEach(item => { if (item.name && item.image) MENU_IMG_MAP[item.name] = item.image; });

const EXTRA_MAP = {
  'Steamed Rice':      '/plateimg/rice-real.png',
  'Jeera Rice':        '/plateimg/Jeera Rice.jpeg',
  'Veg Biryani':       '/plateimg/Vegetable Dum Biryani.jpeg',
  'Chicken Biryani':   '/plateimg/chicken biriyani.jpeg',
  'Dal Makhani':       '/plateimg/Dal Makhani.jpeg',
  'Palak Paneer':      '/plateimg/Palak Paneer.jpeg',
  'Shahi Paneer':      '/plateimg/Shahi Paneer.jpeg',
  'Chana Masala':      '/plateimg/Chana Masala.jpeg',
  'Kadai Paneer':      '/plateimg/Kadai Paneer.jpeg',
  'Butter Chicken':    '/plateimg/Butter Chicken.jpeg',
  'Mutton Curry':      '/plateimg/mutton curry.jpeg',
  'Fish Curry':        '/plateimg/fish curry.jpeg',
  'Chicken Curry':     '/plateimg/Chicken Curry.jpeg',
  'Paneer Tikka':      '/plateimg/Paneer Tikka.jpeg',
  'Veg Spring Rolls':  '/plateimg/Veg Spring Rolls.jpeg',
  'Samosa':            '/plateimg/dish-samosa.png',
  'Hara Bhara Kabab':  '/plateimg/Hara Bhara Kabab.jpeg',
  'Chicken Tikka':     '/plateimg/Chicken Tikka.jpeg',
  'Seekh Kabab':       '/plateimg/Chicken Seekh Kebab.jpeg',
  'Tandoori Chicken':  '/plateimg/Tandoori Chicken.jpeg',
  'Chicken Lollipop':  '/plateimg/Chicken Lollipop.jpeg',
  'Butter Naan':       '/plateimg/Butter Naan.jpeg',
  'Paratha':           '/plateimg/parota.jpeg',
  'Roti':              '/plateimg/TandooriRoti.jpeg',
  'Gulab Jamun':       '/plateimg/gulab jamun.jpeg',
  'Kheer':             '/plateimg/kheer.jpeg',
  'Rasgulla':          '/plateimg/rasamalai.jpeg',
  'Kulfi':             '/plateimg/kulfi.jpeg',
  'Ice Cream':         '/plateimg/icecream.jpeg',
  'Rasmalai':          '/plateimg/rasamalai.jpeg',
  'Masala Lassi':      '/plateimg/masala-lassi.jpeg',
  'Buttermilk':        '/plateimg/buttermilk.jpeg',
  'Coconut Water':     '/plateimg/coconut-water.jpeg',
  'Fresh Juice':       '/plateimg/lemonsoda.jpeg',
  'Cold Drinks':       '/plateimg/lemonsoda.jpeg',
  'Mix Veg Curry':     '/plateimg/Veg Kurma.jpeg',
  'Prawn Masala':      '/plateimg/Prawns Curry.jpeg',
  'Prawn Cocktail':    '/plateimg/Prawn Fry.jpeg',
  'Fish Fingers':      '/plateimg/Fish Fry.jpeg',
  'Sambar':            '/plateimg/sambar.jpeg',
  'Rasam':             '/plateimg/rasam.jpeg',
  'Curd':              '/plateimg/curd.jpeg',
  'Raita':             '/plateimg/dish-raita.png',
  'Boondi Raita':      '/plateimg/dish-raita.png',
  'Mint Chutney':      '/plateimg/dish-chutney.png',
  'Pickle':            '/plateimg/dish-chutney.png',
  'Papad':             '/plateimg/dish-naan.png',
  'Green Salad':       '/plateimg/dish-salad.png',
};

function getImg(name) {
  const img = EXTRA_MAP[name] || MENU_IMG_MAP[name] || '/plateimg/dish-dal.png';
  return img.startsWith('/plateimg/') ? img : `/plateimg${img}`;
}

function getFallback(name) {
  const n = name.toLowerCase();
  if (/rice|biryani/.test(n)) return '/plateimg/rice-real.png';
  if (/naan|paratha|roti|bread/.test(n)) return '/plateimg/dish-naan.png';
  if (/chicken|mutton|fish|prawn/.test(n)) return '/plateimg/dish-butter-chicken.png';
  if (/gulab|rasgulla|kulfi|kheer|rasmalai|sweet/.test(n)) return '/plateimg/dish-gulab.png';
  if (/lassi|buttermilk|water|juice|drink|curd|raita/.test(n)) return '/plateimg/dish-raita.png';
  return '/plateimg/dish-paneer.png';
}

// ── Zone classifier ───────────────────────────────────────────────────────────
function zone(name) {
  const n = name.toLowerCase();
  if (/rice|biryani/.test(n))                                                              return 'rice';
  if (/sambar|rasam|curd|raita|chutney|pickle|papad|buttermilk|lassi|water|juice|drink/.test(n)) return 'condiment';
  if (/dal|palak|shahi|chana|kadai|mix veg|kurma|malai/.test(n))                           return 'curry_veg';
  if (/butter chicken|mutton|prawn masala|fish curry|kadai chicken|andhra|chicken curry/.test(n)) return 'curry_nonveg';
  if (/tikka|kabab|samosa|spring roll|lollipop|finger|cocktail|aloo tikki|hara bhara|65|fry/.test(n)) return 'starter';
  if (/naan|paratha|roti|poori|kulcha|rumali/.test(n))                                     return 'bread';
  if (/gulab|rasgulla|kulfi|ice cream|rasmalai|kheer|halwa|semaya|carrot/.test(n))         return 'sweet';
  return 'other';
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ── Layout builder ────────────────────────────────────────────────────────────
function buildLayout(dishes) {
  if (!dishes.length) return [];

  // Ensure rice
  const hasRice = dishes.some(d => /rice|biryani/i.test(d));
  const all = hasRice ? [...dishes] : ['Steamed Rice', ...dishes];

  // Deduplicate
  const seen = new Set();
  const unique = all.filter(d => { if (seen.has(d)) return false; seen.add(d); return true; });

  // Separate rice from rest
  const riceIdx = unique.findIndex(d => /rice|biryani/i.test(d));
  const riceItem = unique[riceIdx];
  const rest = unique.filter((_, i) => i !== riceIdx);

  // Sort by zone: starters → curries → condiments → breads → sweets
  const ORDER = ['starter', 'curry_nonveg', 'curry_veg', 'condiment', 'bread', 'sweet', 'other'];
  const sorted = [...rest].sort((a, b) => ORDER.indexOf(zone(a)) - ORDER.indexOf(zone(b)));

  const total = sorted.length;
  const topN = Math.ceil(total / 2);
  const botN = total - topN;

  const layout = [{ dish: riceItem, isRice: true, x: 50, y: 50 }];

  // Top rows — y: 24%, 38%
  for (let r = 0; r < Math.ceil(topN / 5); r++) {
    const row = sorted.slice(r * 5, r * 5 + 5);
    const y = 24 + r * 14;
    const spread = Math.min((row.length - 1) * 13, 60);
    row.forEach((dish, c) => {
      const x = row.length === 1 ? 50 : (50 - spread / 2) + c * (spread / (row.length - 1));
      layout.push({ dish, x: clamp(x, 18, 82), y });
    });
  }

  // Bottom rows — y: 62%, 76%
  const botItems = sorted.slice(topN);
  for (let r = 0; r < Math.ceil(botN / 5); r++) {
    const row = botItems.slice(r * 5, r * 5 + 5);
    const y = 62 + r * 14;
    const spread = Math.min((row.length - 1) * 13, 60);
    row.forEach((dish, c) => {
      const x = row.length === 1 ? 50 : (50 - spread / 2) + c * (spread / (row.length - 1));
      layout.push({ dish, x: clamp(x, 18, 82), y });
    });
  }

  return layout;
}

function bowlPx(total) {
  if (total <= 6)  return 58;
  if (total <= 10) return 52;
  if (total <= 15) return 46;
  if (total <= 20) return 40;
  return 36;
}

// ── Katori component ──────────────────────────────────────────────────────────
function Katori({ dish, x, y, size, visible, delay, interactive, onRemove }) {
  return (
    <div
      onClick={() => interactive && onRemove && onRemove(dish)}
      title={dish}
      style={{
        position: 'absolute',
        left: `${x}%`, top: `${y}%`,
        width: size, height: size,
        transform: `translate(-50%,-50%) ${visible ? 'scale(1)' : 'scale(0) translateY(-8px)'}`,
        opacity: visible ? 1 : 0,
        transition: `transform 0.42s cubic-bezier(0.34,1.56,0.64,1) ${delay}s, opacity 0.35s ease ${delay}s`,
        zIndex: 4,
        cursor: interactive ? 'pointer' : 'default',
        borderRadius: '50%',
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0,0,0,0.55), 0 1px 4px rgba(0,0,0,0.3)',
      }}
    >
      <img
        src={getImg(dish)}
        alt={dish}
        loading="eager"
        style={{
          width: '100%', height: '100%',
          objectFit: 'cover', display: 'block',
          transform: 'scale(1.08)',
        }}
        onError={e => { e.currentTarget.src = getFallback(dish); e.currentTarget.onerror = null; }}
      />
      {interactive && (
        <div style={{
          position: 'absolute', top: '2px', right: '2px',
          width: '15px', height: '15px', borderRadius: '50%',
          background: '#ef4444', color: '#fff', fontSize: '0.6rem',
          fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10,
        }}>×</div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function BananaLeaf({ dishes = [], interactive = false, onDishClick }) {
  const [shown, setShown] = useState([]);

  // Deduplicate only — no auto-add, show exactly what's in the package
  const unique = [...new Set(dishes)];

  const layout = buildLayout(unique);
  const sz = bowlPx(layout.length);

  useEffect(() => {
    setShown([]);
    const timers = layout.map((_, i) =>
      setTimeout(() => setShown(p => [...p, i]), 40 + i * 65)
    );
    return () => timers.forEach(clearTimeout);
  }, [unique.join(',')]);

  return (
    <div style={{ background: '#111a0a', borderRadius: '16px', padding: '10px', width: '100%' }}>
      <div style={{ position: 'relative', width: '100%', paddingBottom: '58%' }}>

        {/* Banana leaf */}
        <img
          src="/plateimg/banana-leaf-real.png"
          alt=""
          loading="eager"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center',
            borderRadius: '8px',
          }}
        />

        {/* Dishes */}
        {layout.map((item, i) => {
          if (item.isRice) {
            return (
              <div
                key="rice"
                style={{
                  position: 'absolute',
                  left: '50%', top: '50%',
                  transform: `translate(-50%,-50%) ${shown.includes(i) ? 'scale(1)' : 'scale(0)'}`,
                  opacity: shown.includes(i) ? 1 : 0,
                  transition: `transform 0.5s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.055}s, opacity 0.4s ease ${i * 0.055}s`,
                  zIndex: 5, pointerEvents: 'none',
                  filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.45))',
                }}
              >
                <img
                  src="/plateimg/rice-real.png"
                  alt="Rice"
                  loading="eager"
                  style={{
                    width: `${sz + 44}px`, height: `${sz + 18}px`,
                    objectFit: 'cover',
                    borderRadius: '50% 50% 44% 44% / 55% 55% 45% 45%',
                    display: 'block',
                  }}
                />
              </div>
            );
          }
          return (
            <Katori
              key={item.dish + i}
              dish={item.dish}
              x={item.x}
              y={item.y}
              size={sz}
              visible={shown.includes(i)}
              delay={i * 0.055}
              interactive={interactive}
              onRemove={onDishClick}
            />
          );
        })}

        {/* Empty state */}
        {unique.length === 0 && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            textAlign: 'center', color: '#fff',
            textShadow: '0 2px 8px rgba(0,0,0,0.9)', zIndex: 6,
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '4px' }}>🍃</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>Select a package to preview your thali</div>
          </div>
        )}
      </div>
    </div>
  );
}
