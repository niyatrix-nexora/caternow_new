import { supabase, isSupabaseConfigured } from './supabaseClient';

const PKG_KEY  = (vendorId) => `caternow_packages_${vendorId}`;
const WISH_KEY = (userId)   => `caternow_wishlist_${userId}`;
const CHAT_KEY = (roomId)   => `caternow_chat_${roomId}`;

// ── Package category metadata ─────────────────────────────────────────────────
export const PACKAGE_META = {
  standard: { emoji: '🌿', color: '#059669', bg: 'rgba(5,150,105,0.09)',  border: 'rgba(5,150,105,0.22)',  label: 'Standard' },
  special:  { emoji: '⭐', color: '#D97706', bg: 'rgba(217,119,6,0.09)',  border: 'rgba(217,119,6,0.22)',  label: 'Special'  },
  premium:  { emoji: '👑', color: '#7C3AED', bg: 'rgba(124,58,237,0.09)', border: 'rgba(124,58,237,0.22)', label: 'Premium'  },
  custom:   { emoji: '✏️', color: '#FF6B00', bg: 'rgba(255,107,0,0.09)',  border: 'rgba(255,107,0,0.22)',  label: 'Custom'   },
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

// ── Load / save packages ──────────────────────────────────────────────────────
export function loadVendorPackages(vendorId) {
  try {
    const raw = localStorage.getItem(PKG_KEY(vendorId));
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return DEFAULT_PACKAGES.map(p => ({ ...p, id: `${vendorId}_${p.category}`, vendorId }));
}

export async function saveVendorPackages(vendorId, packages) {
  try { localStorage.setItem(PKG_KEY(vendorId), JSON.stringify(packages)); } catch { /* ignore */ }
  if (isSupabaseConfigured()) {
    const { error } = await supabase
      .from('vendors')
      .update({ menu: { packages } })
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
