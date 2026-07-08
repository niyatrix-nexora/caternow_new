import { supabase, isSupabaseConfigured } from './supabaseClient';

const PKG_KEY  = (vendorId) => `caternow_packages_${vendorId}`;
const WISH_KEY = (userId)   => `caternow_wishlist_${userId}`;
const CHAT_KEY = (roomId)   => `caternow_chat_${roomId}`;

// ── Package category metadata ─────────────────────────────────────────────────
export const PACKAGE_META = {
  standard: { iconName: 'Leaf', color: '#059669', bg: 'rgba(5,150,105,0.09)',  border: 'rgba(5,150,105,0.22)',  label: 'Standard' },
  special:  { iconName: 'Star', color: '#D97706', bg: 'rgba(217,119,6,0.09)',  border: 'rgba(217,119,6,0.22)',  label: 'Special'  },
  premium:  { iconName: 'Crown', color: '#7C3AED', bg: 'rgba(124,58,237,0.09)', border: 'rgba(124,58,237,0.22)', label: 'Premium'  },
  custom:   { iconName: 'Pencil', color: '#FF6B00', bg: 'rgba(255,107,0,0.09)',  border: 'rgba(255,107,0,0.22)',  label: 'Custom'   },
};

// ── Default package templates (uses global master menu names) ─────────────────
export const DEFAULT_PACKAGES = [
  {
    category: 'standard',
    title: 'Standard Package',
    description: 'Perfect for family gatherings and small events. Full course meal with quality ingredients.',
    pricePerPlate: 220,
    dishes: [
      'Paneer Tikka', 'Dal Makhani', 'Veg Kurma',
      'Steamed Rice', 'Veg Biryani', 'Butter Naan',
      'Gulab Jamun', 'Buttermilk',
      'Green Salad', 'Papad', 'Mint Chutney',
    ],
    addOns: ['Welcome Drink Service', 'Banana Leaf Service'],
    isActive: true,
  },
  {
    category: 'special',
    title: 'Special Package',
    description: 'Ideal for weddings and corporate events. Premium ingredients with live counters.',
    pricePerPlate: 320,
    dishes: [
      'Paneer Tikka', 'Chicken Tikka',
      'Shahi Paneer', 'Dal Makhani', 'Butter Chicken',
      'Jeera Rice', 'Veg Fried Rice', 'Chicken Biryani',
      'Butter Naan', 'Garlic Naan',
      'Gulab Jamun', 'Kheer',
      'Masala Lassi', 'Welcome Drink',
      'Green Salad', 'Boondi Raita', 'Papad',
    ],
    addOns: ['Welcome Drink Service', 'Waiter Service', 'Banana Leaf Service'],
    isActive: true,
  },
  {
    category: 'premium',
    title: 'Premium Package',
    description: 'Luxury catering for grand events. Gourmet spread with unlimited servings.',
    pricePerPlate: 550,
    dishes: [
      'Paneer Tikka', 'Hara Bhara Kebab', 'Chicken Tikka', 'Tandoori Chicken',
      'Paneer Butter Masala', 'Shahi Paneer', 'Dal Makhani', 'Butter Chicken', 'Mutton Curry',
      'Ghee Rice', 'Jeera Rice', 'Veg Biryani', 'Chicken Dum Biryani',
      'Butter Naan', 'Garlic Naan', 'Rumali Roti',
      'Gulab Jamun', 'Rasmalai', 'Kulfi',
      'Masala Lassi', 'Welcome Drink', 'Coconut Water',
      'Green Salad', 'Boondi Raita', 'Mint Chutney', 'Papad',
    ],
    addOns: ['Welcome Drink Service', 'Premium Dessert Counter', 'Mocktail Station', 'Waiter Service', 'Live Counter Setup'],
    isActive: true,
  },
  {
    category: 'custom',
    title: 'Custom Package',
    description: 'Fully customizable menu tailored to your exact requirements and budget.',
    pricePerPlate: 250,
    dishes: [],
    addOns: [],
    isActive: true,
  },
];

// ── Sanitize a package: ensure no null/undefined fields overwrite real data ────
function sanitizePackage(pkg) {
  return {
    ...pkg,
    title:         pkg.title         ?? '',
    description:   pkg.description   ?? '',
    pricePerPlate: pkg.pricePerPlate ?? 0,
    dishes:        [...new Set((pkg.dishes || []).filter(Boolean))],
    addOns:        [...new Set((pkg.addOns || []).filter(Boolean))],
    isActive:      pkg.isActive !== undefined ? pkg.isActive : true,
  };
}

// ── Load / save packages ──────────────────────────────────────────────────────
export async function loadVendorPackages(vendorId) {
  // 1. Try Supabase first (source of truth)
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('menu')
        .eq('id', vendorId)
        .single();
      if (!error && data?.menu?.packages?.length) {
        const pkgs = data.menu.packages.map(p => sanitizePackage(p));
        // ponytail: cache to localStorage for offline/fast reload
        try { localStorage.setItem(PKG_KEY(vendorId), JSON.stringify(pkgs)); } catch { /* ignore */ }
        return pkgs;
      }
    } catch { /* fall through */ }
  }
  // 2. Fall back to localStorage
  try {
    const raw = localStorage.getItem(PKG_KEY(vendorId));
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  // 3. Defaults
  return DEFAULT_PACKAGES.map(p => ({ ...p, id: `${vendorId}_${p.category}`, vendorId }));
}

export async function saveVendorPackages(vendorId, packages) {
  const clean = packages.map(sanitizePackage);
  try { localStorage.setItem(PKG_KEY(vendorId), JSON.stringify(clean)); } catch { /* ignore */ }
  if (isSupabaseConfigured()) {
    // ponytail: merge into existing menu JSON — don't overwrite other keys
    let existingMenu = {};
    try {
      const { data } = await supabase
        .from('vendors')
        .select('menu')
        .eq('id', vendorId)
        .single();
      if (data?.menu && typeof data.menu === 'object') existingMenu = data.menu;
    } catch { /* ignore, will just write { packages } */ }

    const { error } = await supabase
      .from('vendors')
      .update({ menu: { ...existingMenu, packages: clean } })
      .eq('id', vendorId);
    if (error) {
      console.error('saveVendorPackages error:', error);
    }
  }
}

// ── Wishlist ──────────────────────────────────────────────────────────────────
export function getWishlist(userId) {
  try { return JSON.parse(localStorage.getItem(WISH_KEY(userId)) || '[]'); } catch { return []; }
}

export function toggleWishlist(userId, vendorId) {
  const list = getWishlist(userId);
  const idx = list.indexOf(vendorId);
  if (idx === -1) list.push(vendorId); else list.splice(idx, 1);
  localStorage.setItem(WISH_KEY(userId), JSON.stringify(list));
  return [...list];
}

export function isWishlisted(userId, vendorId) {
  return getWishlist(userId).includes(vendorId);
}

// ── Chat persistence ──────────────────────────────────────────────────────────
export function getChatMessages(roomId) {
  try { return JSON.parse(localStorage.getItem(CHAT_KEY(roomId)) || '[]'); } catch { return []; }
}

export function saveChatMessages(roomId, messages) {
  try { localStorage.setItem(CHAT_KEY(roomId), JSON.stringify(messages)); } catch { /* ignore */ }
}
