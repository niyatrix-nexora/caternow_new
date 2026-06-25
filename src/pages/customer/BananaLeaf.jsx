import { useState, useEffect } from 'react';
import { MASTER_MENU } from '../../utils/masterMenu';
import { Leaf } from 'lucide-react';

// ── Image map ─────────────────────────────────────────────────────────────────
const MENU_IMG_MAP = {};
MASTER_MENU.forEach(item => { if (item.name && item.image) MENU_IMG_MAP[item.name] = item.image; });

const EXTRA_MAP = {
  'Steamed Rice':      '/plateimg/rice-real.png',
  'Jeera Rice':        '/plateimg/Jeera Rice.png',
  'Veg Biryani':       '/plateimg/Vegetable Dum Biryani.png',
  'Chicken Biryani':   '/plateimg/Chicken Biryani.png',
  'Dal Makhani':       '/plateimg/Dal Makhani.png',
  'Palak Paneer':      '/plateimg/Palak Paneer.png',
  'Shahi Paneer':      '/images/Shahi Paneer.jpeg',
  'Chana Masala':      '/images/Chana Masala.jpeg',
  'Kadai Paneer':      '/plateimg/Kadai Paneer.png',
  'Butter Chicken':    '/plateimg/Butter Chicken.png',
  'Mutton Curry':      '/plateimg/Mutton Curry.png',
  'Fish Curry':        '/plateimg/Fish Curry.png',
  'Chicken Curry':     '/plateimg/Chicken Curry.png',
  'Paneer Tikka':      '/plateimg/Paneer Tikka.png',
  'Veg Spring Rolls':  '/plateimg/Veg Spring Rolls.png',
  'Samosa':            '/plateimg/dish-samosa.png',
  'Hara Bhara Kabab':  '/plateimg/Hara Bhara Kabab.png',
  'Hara Bhara Kebab':  '/plateimg/Hara Bhara Kabab.png',
  'Chicken Tikka':     '/plateimg/Chicken Tikka.png',
  'Seekh Kabab':       '/plateimg/Chicken Seekh Kebab.png',
  'Tandoori Chicken':  '/plateimg/Tandoori Chicken.png',
  'Chicken Lollipop':  '/plateimg/Chicken Lollipop.png',
  'Butter Naan':       '/plateimg/Butter Naan.png',
  'Paratha':           '/plateimg/parota.png',
  'Roti':              '/plateimg/TandooriRoti.png',
  'Tandoori Roti':     '/plateimg/TandooriRoti.png',
  'Gulab Jamun':       '/plateimg/gulabjamun.png',
  'Kheer':             '/plateimg/kheer.png',
  'Rasgulla':          '/plateimg/rasmalai.png',
  'Kulfi':             '/plateimg/kulfi.png',
  'Ice Cream':         '/plateimg/Ice cream.png',
  'Rasmalai':          '/plateimg/rasmalai.png',
  'Masala Lassi':      '/images/Masala Lassi.jpeg',
  'Buttermilk':        '/images/buttermilk.jpeg',
  'Coconut Water':     '/images/coconut-water.jpeg',
  'Fresh Juice':       '/images/lemonsoda.jpeg',
  'Cold Drinks':       '/images/lemonsoda.jpeg',
  'Mix Veg Curry':     '/images/Veg Kurma.jpeg',
  'Prawn Masala':      '/plateimg/Prawns Curry.png',
  'Prawn Cocktail':    '/plateimg/Prawn Fry.png',
  'Fish Fingers':      '/plateimg/Fish Fry.png',
  'Sambar':            '/plateimg/Sambar.png',
  'Rasam':             '/plateimg/Rasam.png',
  'Curd':              '/plateimg/Curd.png',
  'Raita':             '/plateimg/dish-raita.png',
  'Boondi Raita':      '/plateimg/dish-raita.png',
  'Mint Chutney':      '/plateimg/dish-chutney.png',
  'Pickle':            '/plateimg/dish-chutney.png',
  'Papad':             '/plateimg/dish-naan.png',
  'Green Salad':       '/plateimg/dish-salad.png',
  'Crispy Corn':       '/plateimg/Crispy Corn.png',
  'Chilli Paneer':     '/plateimg/Chilli Paneer.png',
  'Gobi 65':           '/plateimg/Gobi 65.png',
  'Mushroom 65':       '/plateimg/Mushroom 65.png',
  'Corn Cheese Balls': '/plateimg/Corn Cheese Balls.png',
  'Chicken 65':        '/plateimg/Chicken 65.png',
  'Chicken Seekh Kebab': '/plateimg/Chicken Seekh Kebab.png',
  'Veg Kurma':         '/images/Veg Kurma.jpeg',
  'Malai Kofta':       '/plateimg/Malai Kofta.png',
  'Gongura Mutton':    '/plateimg/Gongura Mutton.png',
  'Ghee Rice':         '/plateimg/Ghee Rice.png',
  'Pulihora':          '/plateimg/Pulihora.png',
  'Lemon Rice':        '/plateimg/Lemon Rice.png',
  'Coconut Rice':      '/plateimg/Coconut Rice.png',
  'Veg Fried Rice':    '/plateimg/veg-fried-rice.png',
  'Tomato Rice':       '/plateimg/Tomato Rice.png',
  'Paneer Biryani':    '/plateimg/Paneer Biryani.png',
  'Mushroom Biryani':  '/plateimg/Mushroom Biryani.png',
  'Chicken Dum Biryani': '/plateimg/Chicken Dum Biryani.png',
  'Mutton Biryani':    '/plateimg/Mutton Biryani.png',
  'Fish Biryani':      '/plateimg/Fish Biryani.png',
  'Prawn Biryani':     '/plateimg/Prawn Biryani.png',
  'Gutti Vankaya Curry': '/plateimg/Gutti Vankaya Kura.png',
  'Potato Fry':        '/plateimg/Potato Fry.png',
  'Plain Naan':        '/plateimg/Plain Naan.png',
  'Garlic Naan':       '/plateimg/Garlic Naan.png',
  'Kulcha':            '/plateimg/kulcha.png',
  'Rumali Roti':       '/plateimg/rumaliroti.png',
  'Poori':             '/plateimg/poori.png',
  'Double Ka Meetha':  '/plateimg/dubkalmeeta.png',
  'Carrot Halwa':      '/plateimg/carrot halwa.png',
};

const PLATE_FILE_MAP = {};
[
  'Andhra Chicken Curry.png',
  'Andhra Sambar.png',
  'Apollo Fish.png',
  'Butter Chicken.png',
  'Butter Naan.png',
  'Chicken 65.png',
  'Chicken Biryani.png',
  'Chicken Curry.png',
  'Chicken Dum Biryani.png',
  'Chicken Lollipop.png',
  'Chicken Seekh Kebab.png',
  'Chicken Tikka.png',
  'Chilli Paneer.png',
  'Coconut Rice.png',
  'Corn Cheese Balls.png',
  'Crispy Corn.png',
  'Curd.png',
  'Dal Makhani.png',
  'Fish Biryani.png',
  'Fish Curry.png',
  'Fish Fry.png',
  'Garlic Naan.png',
  'Ghee Rice.png',
  'Gobi 65.png',
  'Gongura Mutton.png',
  'Gutti Vankaya Kura.png',
  'Hara Bhara Kabab.png',
  'Ice cream.png',
  'Jeera Rice.png',
  'Kadai Chicken.png',
  'Kadai Paneer.png',
  'Lemon Rice.png',
  'Malai Kofta.png',
  'Mushroom 65.png',
  'Mushroom Biryani.png',
  'Mutton Biryani.png',
  'Mutton Curry.png',
  'Palak Paneer.png',
  'Paneer Biryani.png',
  'Paneer Tikka.png',
  'Plain Naan.png',
  'Potato Fry.png',
  'Prawn Biryani.png',
  'Prawn Fry.png',
  'Prawns Curry.png',
  'Pulihora.png',
  'Rasam.png',
  'Sambar.png',
  'Semaya Payasam.png',
  'Tandoori Chicken.png',
  'TandooriRoti.png',
  'Tomato Rasam.png',
  'Tomato Rice.png',
  'Ulavacharu.png',
  'Veg Spring Rolls.png',
  'Vegetable Dum Biryani.png',
  'banana-leaf-real.png',
  'carrot halwa.png',
  'dish-butter-chicken.png',
  'dish-chutney.png',
  'dish-dal.png',
  'dish-gulab.png',
  'dish-naan.png',
  'dish-paneer.png',
  'dish-raita.png',
  'dish-salad.png',
  'dish-samosa.png',
  'dubkalmeeta.png',
  'gulabjamun.png',
  'kheer.png',
  'kulcha.png',
  'kulfi.png',
  'parota.png',
  'poori.png',
  'rasmalai.png',
  'rice-real.png',
  'rumaliroti.png',
  'veg-fried-rice.png'
].forEach(f => {
  PLATE_FILE_MAP[f.toLowerCase()] = f;
});

function getImg(name) {
  // 1. Direct EXTRA_MAP override
  if (EXTRA_MAP[name]) {
    return EXTRA_MAP[name];
  }

  // 2. Resolve from MENU_IMG_MAP
  const img = MENU_IMG_MAP[name];
  if (img) {
    if (img.startsWith('/images/')) {
      const filename = img.substring('/images/'.length); // e.g. "Paneer Tikka.jpeg"
      const pngFilename = filename.replace(/\.(jpeg|jpg)$/i, '.png');
      
      // Try to find a transparent PNG first
      const lowerPng = pngFilename.toLowerCase();
      if (PLATE_FILE_MAP[lowerPng]) {
        return `/plateimg/${PLATE_FILE_MAP[lowerPng]}`;
      }
      // Try to find the exact file in plateimg
      const lowerFilename = filename.toLowerCase();
      if (PLATE_FILE_MAP[lowerFilename]) {
        return `/plateimg/${PLATE_FILE_MAP[lowerFilename]}`;
      }
      // If neither is in plateimg, fall back to the catalog image in /images/
      return img;
    }
    
    if (img.startsWith('/plateimg/')) {
      return img;
    }
    
    if (img.startsWith('/')) {
      // Check if the filename without slash exists in plateimg
      const filename = img.substring(1);
      const pngFilename = filename.replace(/\.(jpeg|jpg)$/i, '.png');
      const lowerPng = pngFilename.toLowerCase();
      if (PLATE_FILE_MAP[lowerPng]) {
        return `/plateimg/${PLATE_FILE_MAP[lowerPng]}`;
      }
      const lowerFilename = filename.toLowerCase();
      if (PLATE_FILE_MAP[lowerFilename]) {
        return `/plateimg/${PLATE_FILE_MAP[lowerFilename]}`;
      }
    }
    return img;
  }

  // 3. Absolute fallback
  return '/plateimg/dish-dal.png';
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

function getFallbackCatalog(name) {
  const n = name.toLowerCase();
  if (/rice|biryani/.test(n)) return '/images/rice-real.png';
  if (/naan|paratha|roti|bread/.test(n)) return '/images/dish-naan.png';
  if (/chicken|mutton|fish|prawn/.test(n)) return '/images/dish-butter-chicken.png';
  if (/gulab|rasgulla|kulfi|kheer|rasmalai|sweet/.test(n)) return '/images/dish-gulab.png';
  if (/lassi|buttermilk|water|juice|drink|curd|raita/.test(n)) return '/images/dish-raita.png';
  return '/images/dish-paneer.png';
}

// ── Zone classifier ───────────────────────────────────────────────────────────
function zone(name) {
  const n = name.toLowerCase();
  if (/rice|biryani/.test(n))                                                              return 'rice';
  if (/sambar|rasam|curd|raita|buttermilk|lassi|water|juice|drink/.test(n))                 return 'condiment_liquid';
  if (/chutney|pickle|papad|salad/.test(n))                                                 return 'condiment_dry';
  if (/tikka|kabab|samosa|spring roll|lollipop|finger|cocktail|aloo tikki|hara bhara|65|fry/.test(n)) return 'starter';
  if (/dal|palak|shahi|chana|kadai|mix veg|kurma|malai|curry|mutton|prawn|fish|chicken/.test(n)) return 'curry';
  if (/naan|paratha|roti|poori|kulcha|rumali/.test(n))                                     return 'bread';
  if (/gulab|rasgulla|kulfi|ice cream|rasmalai|kheer|halwa|semaya|carrot|sweet|double ka/.test(n)) return 'sweet';
  return 'other';
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ── Layout builder ────────────────────────────────────────────────────────────
function buildLayout(dishes) {
  if (!dishes.length) return [];

  // 1. Deduplicate case-insensitively, keeping first occurrence
  const unique = [];
  const seenNames = new Set();
  for (const d of dishes) {
    if (!d) continue;
    const norm = d.toLowerCase().trim();
    if (!seenNames.has(norm)) {
      seenNames.add(norm);
      unique.push(d);
    }
  }

  // Ensure steamed rice if no rice/biryani is present
  const hasRice = unique.some(d => /rice|biryani/i.test(d));
  const all = hasRice ? unique : ['Steamed Rice', ...unique];

  // 2. Separate into categories
  const riceItems = all.filter(d => zone(d) === 'rice');
  const breadItems = all.filter(d => zone(d) === 'bread');
  const otherItems = all.filter(d => zone(d) !== 'rice' && zone(d) !== 'bread');

  // Compute sizes dynamically based on numbers of items
  const arcDishes = [...otherItems, ...riceItems.slice(1)];
  const N = arcDishes.length;
  
  // Calculate base katori size as a percentage of container width
  // Limit to max 13.5% and scale down to prevent overlap
  const katoriSize = N <= 1 ? 13.5 : Math.max(5.5, Math.min(13.5, (31 * 3.3) / (N + 1)));
  const breadSize = Math.max(7.5, Math.min(15.5, katoriSize * 1.25));

  const layout = [];

  // 3. Place Rice (first rice item is central, positioned slightly higher to leave room below)
  let mainRice = null;
  if (riceItems.length > 0) {
    mainRice = riceItems[0];
    layout.push({ dish: mainRice, isRice: true, x: 50, y: 49, sizeW: 23, sizeH: 33 });
  }

  // 4. Sort arc dishes by Zone Order for clean arrangement from left to right:
  // Condiments/Dry Starters -> Main Curries (top center) -> Liquid Condiments (Sambar, Rasam, Curd) -> Desserts -> Extra Biryani/Rice (bottom right)
  const ZONE_ORDER = ['condiment_dry', 'starter', 'curry', 'condiment_liquid', 'other', 'sweet', 'rice'];
  arcDishes.sort((a, b) => ZONE_ORDER.indexOf(zone(a)) - ZONE_ORDER.indexOf(zone(b)));

  // 5. Place Arc Dishes in a semi-circle along the leaf
  if (N > 0) {
    const cx = 50; // horizontal center
    const cy = 47; // vertical center (slightly shifted up to match the leaf shape and leave room)
    const rx = 33; // horizontal radius
    const ry = 22; // vertical radius
    
    const startAngle = 195 * (Math.PI / 180);
    const endAngle = -15 * (Math.PI / 180);

    arcDishes.forEach((dish, i) => {
      let angle;
      if (N === 1) {
        angle = 90 * (Math.PI / 180);
      } else {
        angle = startAngle + i * ((endAngle - startAngle) / (N - 1));
      }
      
      const x = cx + rx * Math.cos(angle);
      const y = cy - ry * Math.sin(angle);
      layout.push({ dish, x: clamp(x, 18, 82), y: clamp(y, 18, 75), size: katoriSize });
    });
  }

  // 6. Place Breads in the lower middle area, flanking the rice
  const M = breadItems.length;
  if (M > 0) {
    breadItems.forEach((dish, i) => {
      let x, y;
      if (M === 1) {
        x = 32;
        y = 66;
      } else if (M === 2) {
        x = i === 0 ? 32 : 68;
        y = 66;
      } else if (M === 3) {
        if (i === 0) { x = 32; y = 62; }
        else if (i === 1) { x = 68; y = 62; }
        else { x = 50; y = 74; }
      } else {
        // Distribute 4 or more breads symmetrically
        const step = 38 / (M - 1);
        x = 31 + i * step;
        y = 70 + (i % 2 === 0 ? 2 : -2);
      }
      layout.push({ dish, x: clamp(x, 18, 82), y: clamp(y, 50, 80), size: breadSize });
    });
  }

  return layout;
}

// ── Katori component ──────────────────────────────────────────────────────────
function Katori({ dish, x, y, size, visible, delay, interactive, onRemove }) {
  const imgSrc = getImg(dish);
  const isPng = imgSrc.endsWith('.png');

  return (
    <div
      onClick={() => interactive && onRemove && onRemove(dish)}
      title={dish}
      style={{
        position: 'absolute',
        left: `${x}%`, top: `${y}%`,
        width: `${size}%`, height: `${size / 0.58}%`,
        transform: `translate(-50%,-50%) ${visible ? 'scale(1)' : 'scale(0) translateY(-8px)'}`,
        opacity: visible ? 1 : 0,
        transition: `transform 0.42s cubic-bezier(0.34,1.56,0.64,1) ${delay}s, opacity 0.35s ease ${delay}s`,
        zIndex: 4,
        cursor: interactive ? 'pointer' : 'default',
        // Transparent PNGs sit directly on the leaf; JPG curries are rendered inside metallic steel cups (katoris)
        borderRadius: isPng ? '0%' : '50%',
        overflow: isPng ? 'visible' : 'hidden',
        border: isPng ? 'none' : '2.5px solid #d5d8dc', // sleek silver steel cup border
        boxShadow: isPng 
          ? 'none' 
          : '0 4px 12px rgba(0,0,0,0.55), inset 0 2px 4px rgba(255,255,255,0.4)',
        // Apply drop shadow for PNG dry items
        filter: isPng ? 'drop-shadow(0 6px 12px rgba(0,0,0,0.6))' : 'none',
      }}
    >
      <img
        src={imgSrc}
        alt={dish}
        loading="eager"
        style={{
          width: '100%', height: '100%',
          objectFit: isPng ? 'contain' : 'cover',
          display: 'block',
          transform: isPng ? 'scale(1.2)' : 'scale(1.08)',
        }}
        onError={e => {
          e.currentTarget.src = isPng ? getFallback(dish) : getFallbackCatalog(dish);
          e.currentTarget.onerror = null;
        }}
      />
      {interactive && (
        <div style={{
          position: 'absolute', top: isPng ? '-4px' : '2px', right: isPng ? '-4px' : '2px',
          width: '15px', height: '15px', borderRadius: '50%',
          background: '#ef4444', color: '#fff', fontSize: '0.6rem',
          fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10,
          boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
        }}>×</div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function BananaLeaf({ dishes = [], interactive = false, onDishClick }) {
  const [shown, setShown] = useState([]);

  // Deduplicate case-insensitively, keeping first occurrence
  const unique = [];
  const seenNames = new Set();
  for (const d of dishes) {
    if (!d) continue;
    const norm = d.toLowerCase().trim();
    if (!seenNames.has(norm)) {
      seenNames.add(norm);
      unique.push(d);
    }
  }

  const layout = buildLayout(unique);

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
            const w = item.sizeW || 23;
            const h = item.sizeH || 33;
            return (
              <div
                key="rice"
                style={{
                  position: 'absolute',
                  left: `${item.x}%`, top: `${item.y}%`,
                  width: `${w}%`,
                  height: `${h}%`,
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
                    width: '100%', height: '100%',
                    objectFit: 'cover',
                    borderRadius: '50%',
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
              size={item.size}
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
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
              <Leaf size={32} style={{ color: '#22c55e' }} />
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>Select a package to preview your thali</div>
          </div>
        )}
      </div>
    </div>
  );
}
