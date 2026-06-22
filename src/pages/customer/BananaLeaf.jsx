import { useState, useEffect } from 'react';
import { MASTER_MENU } from '../../utils/masterMenu';

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
  'Shahi Paneer':      '/plateimg/Shahi Paneer.jpeg',
  'Chana Masala':      '/plateimg/Chana Masala.jpeg',
  'Kadai Paneer':      '/plateimg/Kadai Paneer.png',
  'Butter Chicken':    '/plateimg/Butter Chicken.jpeg',
  'Mutton Curry':      '/plateimg/mutton curry.jpeg',
  'Fish Curry':        '/plateimg/fish curry.jpeg',
  'Chicken Curry':     '/plateimg/Chicken Curry.jpeg',
  'Paneer Tikka':      '/plateimg/Paneer Tikka.png',
  'Veg Spring Rolls':  '/plateimg/Veg Spring Rolls.png',
  'Samosa':            '/plateimg/dish-samosa.png',
  'Hara Bhara Kabab':  '/plateimg/Hara Bhara Kabab.png',
  'Hara Bhara Kebab':  '/plateimg/Hara Bhara Kabab.png',
  'Chicken Tikka':     '/plateimg/Chicken Tikka.png',
  'Seekh Kabab':       '/plateimg/Chicken Seekh Kebab.jpeg',
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
  'Ice Cream':         '/plateimg/icecream.jpeg',
  'Rasmalai':          '/plateimg/rasmalai.png',
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
  'Crispy Corn':       '/plateimg/Crispy Corn.png',
  'Chilli Paneer':     '/plateimg/Chilli Paneer.png',
  'Gobi 65':           '/plateimg/Gobi 65.png',
  'Mushroom 65':       '/plateimg/Mushroom 65.png',
  'Corn Cheese Balls': '/plateimg/Corn Cheese Balls.png',
  'Chicken 65':        '/plateimg/Chicken 65.png',
  'Chicken Seekh Kebab': '/plateimg/Chicken Seekh Kebab.jpeg',
  'Veg Kurma':         '/plateimg/Veg Kurma.jpeg',
  'Malai Kofta':       '/plateimg/Malai Kofta.png',
  'Gongura Mutton':    '/plateimg/Gongura Mutton.png',
  'Ghee Rice':         '/plateimg/Ghee Rice.png',
  'Pulihora':          '/plateimg/Pulihora.png',
  'Lemon Rice':        '/plateimg/Lemon Rice.png',
  'Coconut Rice':      '/plateimg/Coconut Rice.png',
  'Veg Fried Rice':    '/plateimg/veg-fried-rice.png',
  'Tomato Rice':       '/plateimg/Tomato Rice.png',
  'Paneer Biryani':    '/plateimg/dish-biryani.png',
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

const ALL_PLATE_FILES = new Set([
  'Butter Chicken.jpeg',
  'Butter Naan.jpeg',
  'Butter Naan.png',
  'Chana Masala.jpeg',
  'Chicken 65.png',
  'Chicken Biryani.png',
  'Chicken Curry.jpeg',
  'Chicken Dum Biryani.png',
  'Chicken Lollipop.jpeg',
  'Chicken Lollipop.png',
  'Chicken Seekh Kebab.jpeg',
  'Chicken Tikka.jpeg',
  'Chicken Tikka.png',
  'Chilli Paneer.png',
  'Coconut Rice.png',
  'Corn Cheese Balls.png',
  'Crispy Corn.png',
  'Dal Makhani.jpeg',
  'Dal Makhani.png',
  'Fish Biryani.png',
  'Fish Fry.jpeg',
  'Garlic Naan.png',
  'Ghee Rice.png',
  'Gobi 65.png',
  'Gongura Mutton.png',
  'Gutti Vankaya Kura.png',
  'Hara Bhara Kabab.jpeg',
  'Hara Bhara Kabab.png',
  'Jeera Rice.jpeg',
  'Jeera Rice.png',
  'Kadai Paneer.jpeg',
  'Kadai Paneer.png',
  'Lemon Rice.png',
  'Malai Kofta.png',
  'Mushroom 65.png',
  'Mushroom Biryani.png',
  'Mutton Biryani.png',
  'Palak Paneer.jpeg',
  'Palak Paneer.png',
  'Paneer Tikka.jpeg',
  'Paneer Tikka.png',
  'Plain Naan.png',
  'Potato Fry.png',
  'Prawn Biryani.png',
  'Prawn Fry.jpeg',
  'Prawns Curry.jpeg',
  'Pulihora.png',
  'Shahi Paneer.jpeg',
  'Tandoori Chicken.jpeg',
  'Tandoori Chicken.png',
  'TandooriRoti.jpeg',
  'TandooriRoti.png',
  'Tomato Rice.png',
  'Veg Kurma.jpeg',
  'Veg Spring Rolls.jpeg',
  'Veg Spring Rolls.png',
  'Vegetable Dum Biryani.jpeg',
  'Vegetable Dum Biryani.png',
  'buttermilk.jpeg',
  'carrot halwa.png',
  'chicken biriyani.jpeg',
  'coconut-water.jpeg',
  'curd.jpeg',
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
  'fish curry.jpeg',
  'gulab jamun.jpeg',
  'gulabjamun.png',
  'icecream.jpeg',
  'kheer.jpeg',
  'kheer.png',
  'kulcha.png',
  'kulfi.jpeg',
  'kulfi.png',
  'lemonsoda.jpeg',
  'masala-lassi.jpeg',
  'mutton curry.jpeg',
  'parota.jpeg',
  'parota.png',
  'poori.png',
  'rasam.jpeg',
  'rasamalai.jpeg',
  'rasmalai.png',
  'rice-real.png',
  'rumaliroti.png',
  'sambar.jpeg',
  'veg-fried-rice.png',
]);

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
      if (ALL_PLATE_FILES.has(pngFilename)) {
        return `/plateimg/${pngFilename}`;
      }
      // Try to find the exact file in plateimg
      if (ALL_PLATE_FILES.has(filename)) {
        return `/plateimg/${filename}`;
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
      if (ALL_PLATE_FILES.has(pngFilename)) {
        return `/plateimg/${pngFilename}`;
      }
      if (ALL_PLATE_FILES.has(filename)) {
        return `/plateimg/${filename}`;
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

  const layout = [];

  // 3. Place Rice (first rice item is central)
  let mainRice = null;
  if (riceItems.length > 0) {
    mainRice = riceItems[0];
    layout.push({ dish: mainRice, isRice: true, x: 50, y: 52 });
  }

  // Remaining rice items are treated as arc items
  const extraRice = riceItems.slice(1);
  const arcDishes = [...otherItems, ...extraRice];

  // 4. Sort arc dishes by Zone Order for clean arrangement from left to right
  const ZONE_ORDER = ['condiment', 'starter', 'curry_nonveg', 'curry_veg', 'other', 'sweet'];
  arcDishes.sort((a, b) => ZONE_ORDER.indexOf(zone(a)) - ZONE_ORDER.indexOf(zone(b)));

  // 5. Place Arc Dishes in a semi-circle along the leaf
  const N = arcDishes.length;
  if (N > 0) {
    const cx = 50; // horizontal center
    const cy = 48; // vertical center
    const rx = 36; // horizontal radius
    const ry = 26; // vertical radius
    
    // Spanning angle from 195 degrees (bottom left) to -15 degrees (bottom right)
    const startAngle = 195 * (Math.PI / 180);
    const endAngle = -15 * (Math.PI / 180);

    arcDishes.forEach((dish, i) => {
      let angle;
      if (N === 1) {
        angle = 90 * (Math.PI / 180); // directly on top
      } else {
        angle = startAngle + i * ((endAngle - startAngle) / (N - 1));
      }
      
      const x = cx + rx * Math.cos(angle);
      const y = cy - ry * Math.sin(angle);
      layout.push({ dish, x: clamp(x, 14, 86), y: clamp(y, 16, 78) });
    });
  }

  // 6. Place Breads in the lower middle area, flanking the rice
  const M = breadItems.length;
  if (M > 0) {
    breadItems.forEach((dish, i) => {
      let x, y;
      if (M === 1) {
        x = 34;
        y = 60;
      } else if (M === 2) {
        x = i === 0 ? 34 : 66;
        y = 60;
      } else if (M === 3) {
        if (i === 0) { x = 34; y = 60; }
        else if (i === 1) { x = 66; y = 60; }
        else { x = 50; y = 70; }
      } else {
        // Distribute 4 or more breads symmetrically
        const step = 40 / (M - 1);
        x = 30 + i * step;
        y = 65 + (i % 2 === 0 ? 3 : -3); // slight zigzag
      }
      layout.push({ dish, x: clamp(x, 18, 82), y: clamp(y, 50, 80) });
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
  const imgSrc = getImg(dish);
  const isPng = imgSrc.endsWith('.png');

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
        // Transparent PNGs do not need circular borders or background masks!
        borderRadius: isPng ? '0%' : '50%',
        overflow: isPng ? 'visible' : 'hidden',
        boxShadow: isPng 
          ? 'none' 
          : '0 4px 16px rgba(0,0,0,0.55), 0 1px 4px rgba(0,0,0,0.3)',
        // Apply a high quality shape-based drop shadow for transparent PNG items
        filter: isPng ? 'drop-shadow(0 6px 12px rgba(0,0,0,0.6))' : 'none',
      }}
    >
      <img
        src={imgSrc}
        alt={dish}
        loading="eager"
        style={{
          width: '100%', height: '100%',
          // 'contain' displays transparent PNG plates/bowls in their native aspect ratio
          // 'cover' scales standard circular JPEGs to fill the container fully
          objectFit: isPng ? 'contain' : 'cover',
          display: 'block',
          transform: isPng ? 'scale(1.2)' : 'scale(1.08)',
        }}
        onError={e => {
          // If it fails, fallback to generic PNG or generic catalog JPG
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
