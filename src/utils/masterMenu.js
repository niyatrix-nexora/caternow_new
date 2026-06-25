// ============================================================
// CaterNow — Global Master Menu Database
// All dishes visible to every vendor. Vendors choose which
// dishes to include in their profile / packages.
// ============================================================

// ── Category-level fallback images (already in /public/images) ─────
const CAT_IMG = {
  'Veg Starters':                '/plateimg/dish-paneer.png',
  'Non-Veg Starters':            '/plateimg/dish-samosa.png',
  'Veg Curries':                 '/plateimg/dish-paneer.png',
  'Non-Veg Curries':             '/plateimg/dish-butter-chicken.png',
  'Rice Items':                  '/plateimg/rice-real.png',
  'Biryanis':                    '/plateimg/Vegetable Dum Biryani.png',
  'South Indian Specials':       '/plateimg/dish-dal.png',
  'Indian Breads':               '/plateimg/dish-naan.png',
  'Salads & Accompaniments':     '/plateimg/dish-raita.png',
  'Desserts & Sweets':           '/plateimg/dish-gulab.png',
  'Beverages':                   '/plateimg/dish-raita.png',
  'Live Counters':               '/plateimg/dish-chutney.png',
  'Add-ons':                     '/plateimg/banana-leaf-real.png',
};

export const MASTER_MENU = [
  // ── Veg Starters ───────────────────────────────────────────
  { id: 'vs-01', name: 'Paneer Tikka',      category: 'Veg Starters',     subCategory: 'veg',     type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/Paneer Tikka.jpeg',          price: 120 },
  { id: 'vs-02', name: 'Hara Bhara Kebab',  category: 'Veg Starters',     subCategory: 'veg',     type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/Hara Bhara Kabab.jpeg',      price: 100 },
  { id: 'vs-03', name: 'Crispy Corn',        category: 'Veg Starters',     subCategory: 'veg',     type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/Crispy Corn.jpeg',            price: 90  },
  { id: 'vs-04', name: 'Veg Spring Rolls',  category: 'Veg Starters',     subCategory: 'veg',     type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/Veg Spring Rolls.jpeg',      price: 95  },
  { id: 'vs-05', name: 'Chilli Paneer',      category: 'Veg Starters',     subCategory: 'veg',     type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/Chilli Paneer.jpeg',          price: 130 },
  { id: 'vs-06', name: 'Gobi 65',            category: 'Veg Starters',     subCategory: 'veg',     type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/Gobi 65.jpeg',                price: 100 },
  { id: 'vs-07', name: 'Mushroom 65',        category: 'Veg Starters',     subCategory: 'veg',     type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/Mushroom 65.jpeg',            price: 110 },
  { id: 'vs-08', name: 'Corn Cheese Balls', category: 'Veg Starters',     subCategory: 'veg',     type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/Corn Cheese Balls.jpeg',     price: 115 },

  // ── Non-Veg Starters ───────────────────────────────────────
  { id: 'ns-01', name: 'Chicken Tikka',       category: 'Non-Veg Starters', subCategory: 'non-veg', type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/Chicken Tikka.jpeg',          price: 160 },
  { id: 'ns-02', name: 'Tandoori Chicken',    category: 'Non-Veg Starters', subCategory: 'non-veg', type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/Tandoori Chicken.jpeg',       price: 180 },
  { id: 'ns-03', name: 'Chicken 65',          category: 'Non-Veg Starters', subCategory: 'non-veg', type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/Chicken 65.jpeg',              price: 150 },
  { id: 'ns-04', name: 'Chicken Lollipop',    category: 'Non-Veg Starters', subCategory: 'non-veg', type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/Chicken Lollipop.jpeg',       price: 170 },
  { id: 'ns-05', name: 'Fish Fry',            category: 'Non-Veg Starters', subCategory: 'non-veg', type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/Fish Fry.jpeg',                price: 200 },
  { id: 'ns-06', name: 'Apollo Fish',         category: 'Non-Veg Starters', subCategory: 'non-veg', type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/Apollo Fish.jpeg',             price: 210 },
  { id: 'ns-07', name: 'Prawn Fry',           category: 'Non-Veg Starters', subCategory: 'non-veg', type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/Prawn Fry.jpeg',               price: 220 },
  { id: 'ns-08', name: 'Chicken Seekh Kebab', category: 'Non-Veg Starters', subCategory: 'non-veg', type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/Chicken Seekh Kebab.jpeg',    price: 190 },

  // ── Veg Curries ────────────────────────────────────────────
  { id: 'vc-01', name: 'Paneer Butter Masala', category: 'Veg Curries',     subCategory: 'veg',     type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/Paneer Butter Masala.jpeg',  price: 140 },
  { id: 'vc-02', name: 'Shahi Paneer',          category: 'Veg Curries',     subCategory: 'veg',     type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/Shahi Paneer.jpeg',           price: 150 },
  { id: 'vc-03', name: 'Kadai Paneer',           category: 'Veg Curries',     subCategory: 'veg',     type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/Kadai Paneer.jpeg',            price: 140 },
  { id: 'vc-04', name: 'Palak Paneer',           category: 'Veg Curries',     subCategory: 'veg',     type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/Palak Paneer.jpeg',            price: 130 },
  { id: 'vc-05', name: 'Dal Makhani',            category: 'Veg Curries',     subCategory: 'veg',     type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/Dal Makhani.jpeg',             price: 110 },
  { id: 'vc-06', name: 'Veg Kurma',              category: 'Veg Curries',     subCategory: 'veg',     type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/Veg Kurma.jpeg',               price: 120 },
  { id: 'vc-07', name: 'Malai Kofta',            category: 'Veg Curries',     subCategory: 'veg',     type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/Malai Kofta.jpeg',             price: 145 },
  { id: 'vc-08', name: 'Chana Masala',           category: 'Veg Curries',     subCategory: 'veg',     type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/Chana Masala.jpeg',            price: 115 },

  // ── Non-Veg Curries ────────────────────────────────────────
  { id: 'nc-01', name: 'Butter Chicken',       category: 'Non-Veg Curries',  subCategory: 'non-veg', type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/Butter Chicken.jpeg',         price: 180 },
  { id: 'nc-02', name: 'Chicken Curry',         category: 'Non-Veg Curries',  subCategory: 'non-veg', type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/Chicken Curry.jpeg',           price: 160 },
  { id: 'nc-03', name: 'Kadai Chicken',         category: 'Non-Veg Curries',  subCategory: 'non-veg', type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/Kadai Chicken.jpeg',           price: 170 },
  { id: 'nc-04', name: 'Andhra Chicken Curry',  category: 'Non-Veg Curries',  subCategory: 'non-veg', type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/andra chicken curry.jpeg',    price: 175 },
  { id: 'nc-05', name: 'Mutton Curry',          category: 'Non-Veg Curries',  subCategory: 'non-veg', type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/mutton curry.jpeg',            price: 220 },
  { id: 'nc-06', name: 'Fish Curry',            category: 'Non-Veg Curries',  subCategory: 'non-veg', type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/fish curry.jpeg',              price: 200 },
  { id: 'nc-07', name: 'Prawn Curry',           category: 'Non-Veg Curries',  subCategory: 'non-veg', type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/Prawns Curry.jpeg',            price: 230 },
  { id: 'nc-08', name: 'Gongura Mutton',        category: 'Non-Veg Curries',  subCategory: 'non-veg', type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/Gongura Mutton.jpeg',          price: 240 },

  // ── Rice Items ─────────────────────────────────────────────
  { id: 'ri-01', name: 'Steamed Rice',    category: 'Rice Items',            subCategory: 'veg',     type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/rice-real.png',               price: 60  },
  { id: 'ri-02', name: 'Jeera Rice',      category: 'Rice Items',            subCategory: 'veg',     type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/Jeera Rice.jpeg',             price: 80  },
  { id: 'ri-03', name: 'Ghee Rice',       category: 'Rice Items',            subCategory: 'veg',     type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/ghee rice.jpeg',              price: 90  },
  { id: 'ri-04', name: 'Pulihora',        category: 'Rice Items',            subCategory: 'veg',     type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/pulihora.jpeg',               price: 85  },
  { id: 'ri-05', name: 'Lemon Rice',      category: 'Rice Items',            subCategory: 'veg',     type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/Lemon rice.jpeg',             price: 80  },
  { id: 'ri-06', name: 'Coconut Rice',    category: 'Rice Items',            subCategory: 'veg',     type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/Coconut rice.jpeg',           price: 85  },
  { id: 'ri-07', name: 'Veg Fried Rice',  category: 'Rice Items',            subCategory: 'veg',     type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/veg-fried-rice.jpg',          price: 100 },
  { id: 'ri-08', name: 'Tomato Rice',     category: 'Rice Items',            subCategory: 'veg',     type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/tamota rice.jpeg',            price: 85  },

  // ── Biryanis ───────────────────────────────────────────────
  { id: 'bi-01', name: 'Veg Biryani',         category: 'Biryanis',          subCategory: 'veg',     type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/Vegetable Dum Biryani.jpeg',  price: 140 },
  { id: 'bi-02', name: 'Paneer Biryani',       category: 'Biryanis',          subCategory: 'veg',     type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/paneer biriyani.jpeg',         price: 160 },
  { id: 'bi-03', name: 'Mushroom Biryani',     category: 'Biryanis',          subCategory: 'veg',     type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/mushroom biriyani.jpeg',       price: 150 },
  { id: 'bi-04', name: 'Chicken Biryani',      category: 'Biryanis',          subCategory: 'non-veg', type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/chicken biriyani.jpeg',        price: 180 },
  { id: 'bi-05', name: 'Chicken Dum Biryani',  category: 'Biryanis',          subCategory: 'non-veg', type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/Chicken dum Biryani.jpeg',    price: 200 },
  { id: 'bi-06', name: 'Mutton Biryani',       category: 'Biryanis',          subCategory: 'non-veg', type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/mutton biryani.jpeg',          price: 230 },
  { id: 'bi-07', name: 'Fish Biryani',         category: 'Biryanis',          subCategory: 'non-veg', type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/Fish biriyani.jpeg',           price: 220 },
  { id: 'bi-08', name: 'Prawn Biryani',        category: 'Biryanis',          subCategory: 'non-veg', type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/Prawn Biryani.jpeg',           price: 240 },

  // ── South Indian Specials ──────────────────────────────────
  { id: 'si-01', name: 'Sambar',                category: 'South Indian Specials', subCategory: 'veg', type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/sambar.jpeg',                 price: 60  },
  { id: 'si-02', name: 'Andhra Sambar',          category: 'South Indian Specials', subCategory: 'veg', type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/Andhra Sambar.jpeg',           price: 65  },
  { id: 'si-03', name: 'Rasam',                  category: 'South Indian Specials', subCategory: 'veg', type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/rasam.jpeg',                   price: 55  },
  { id: 'si-04', name: 'Tomato Rasam',           category: 'South Indian Specials', subCategory: 'veg', type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/Tomato Rasam.jpeg',            price: 55  },
  { id: 'si-05', name: 'Uluva Charu',            category: 'South Indian Specials', subCategory: 'veg', type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/Ulavacharu.jpeg',              price: 60  },
  { id: 'si-06', name: 'Majjiga Pulusu',         category: 'South Indian Specials', subCategory: 'veg', type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/Majjiga Pulusu.jpeg',          price: 60  },
  { id: 'si-07', name: 'Gutti Vankaya Curry',    category: 'South Indian Specials', subCategory: 'veg', type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/Gutti Vankaya Kura.jpeg',     price: 120 },
  { id: 'si-08', name: 'Potato Fry',             category: 'South Indian Specials', subCategory: 'veg', type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/potato fry.jpeg',              price: 90  },

  // ── Indian Breads ──────────────────────────────────────────
  { id: 'ib-01', name: 'Butter Naan',    category: 'Indian Breads',          subCategory: 'veg',     type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/Butter Naan.jpeg',            price: 40  },
  { id: 'ib-02', name: 'Plain Naan',     category: 'Indian Breads',          subCategory: 'veg',     type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/plain naan.jpeg',             price: 30  },
  { id: 'ib-03', name: 'Garlic Naan',    category: 'Indian Breads',          subCategory: 'veg',     type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/Garlic Naan.jpeg',            price: 45  },
  { id: 'ib-04', name: 'Kulcha',         category: 'Indian Breads',          subCategory: 'veg',     type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/Kulcha.jpeg',                 price: 35  },
  { id: 'ib-05', name: 'Tandoori Roti',  category: 'Indian Breads',          subCategory: 'veg',     type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/TandooriRoti.jpeg',           price: 25  },
  { id: 'ib-06', name: 'Rumali Roti',    category: 'Indian Breads',          subCategory: 'veg',     type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/rumali roti.jpeg',            price: 30  },
  { id: 'ib-07', name: 'Paratha',        category: 'Indian Breads',          subCategory: 'veg',     type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/parota.jpeg',                 price: 35  },
  { id: 'ib-08', name: 'Poori',          category: 'Indian Breads',          subCategory: 'veg',     type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/poori.jpeg',                  price: 30  },

  // ── Salads & Accompaniments ────────────────────────────────
  { id: 'sa-01', name: 'Green Salad',       category: 'Salads & Accompaniments', subCategory: 'veg', type: 'menu_item',    isActive: true, isGlobal: true, image: '/plateimg/dish-salad.png',              price: 50  },
  { id: 'sa-02', name: 'Onion Salad',       category: 'Salads & Accompaniments', subCategory: 'veg', type: 'menu_item',    isActive: true, isGlobal: true, image: '/plateimg/dish-salad.png',              price: 40  },
  { id: 'sa-03', name: 'Cucumber Salad',    category: 'Salads & Accompaniments', subCategory: 'veg', type: 'menu_item',    isActive: true, isGlobal: true, image: '/plateimg/dish-salad.png',              price: 45  },
  { id: 'sa-04', name: 'Boondi Raita',      category: 'Salads & Accompaniments', subCategory: 'veg', type: 'menu_item',    isActive: true, isGlobal: true, image: '/plateimg/dish-raita.png',              price: 55  },
  { id: 'sa-05', name: 'Vegetable Raita',   category: 'Salads & Accompaniments', subCategory: 'veg', type: 'menu_item',    isActive: true, isGlobal: true, image: '/plateimg/dish-raita.png',              price: 60  },
  { id: 'sa-09', name: 'Curd',              category: 'Salads & Accompaniments', subCategory: 'veg', type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/curd.jpeg',                   price: 30  },
  { id: 'sa-06', name: 'Mint Chutney',      category: 'Salads & Accompaniments', subCategory: 'veg', type: 'menu_item',    isActive: true, isGlobal: true, image: '/plateimg/dish-chutney.png',            price: 30  },
  { id: 'sa-07', name: 'Pickle',            category: 'Salads & Accompaniments', subCategory: 'veg', type: 'menu_item',    isActive: true, isGlobal: true, image: '/plateimg/dish-chutney.png',            price: 20  },
  { id: 'sa-08', name: 'Papad',             category: 'Salads & Accompaniments', subCategory: 'veg', type: 'menu_item',    isActive: true, isGlobal: true, image: '/plateimg/dish-naan.png',               price: 15  },

  // ── Desserts & Sweets ──────────────────────────────────────
  { id: 'ds-01', name: 'Gulab Jamun',        category: 'Desserts & Sweets',    subCategory: 'veg',   type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/gulab jamun.jpeg',            price: 80  },
  { id: 'ds-02', name: 'Rasmalai',            category: 'Desserts & Sweets',    subCategory: 'veg',   type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/rasamalai.jpeg',              price: 90  },
  { id: 'ds-03', name: 'Kheer',               category: 'Desserts & Sweets',    subCategory: 'veg',   type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/kheer.jpeg',                  price: 75  },
  { id: 'ds-04', name: 'Semiya Payasam',      category: 'Desserts & Sweets',    subCategory: 'veg',   type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/semaya payasam.jpeg',         price: 70  },
  { id: 'ds-05', name: 'Double Ka Meetha',    category: 'Desserts & Sweets',    subCategory: 'veg',   type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/double kaa meeta.jpeg',       price: 85  },
  { id: 'ds-06', name: 'Carrot Halwa',        category: 'Desserts & Sweets',    subCategory: 'veg',   type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/carrot halwa.jpeg',           price: 80  },
  { id: 'ds-07', name: 'Kulfi',               category: 'Desserts & Sweets',    subCategory: 'veg',   type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/kulfi.jpeg',                  price: 70  },
  { id: 'ds-08', name: 'Ice Cream',           category: 'Desserts & Sweets',    subCategory: 'veg',   type: 'menu_item',    isActive: true, isGlobal: true, image: '/images/icecream.jpeg',               price: 65  },

  // ── Beverages ──────────────────────────────────────────────
  { id: 'bv-01', name: 'Welcome Drink',    category: 'Beverages', subCategory: 'na', type: 'menu_item', isActive: true, isGlobal: true, image: '/images/welcomedrink.jpeg',    price: 50 },
  { id: 'bv-02', name: 'Fresh Lime Soda',  category: 'Beverages', subCategory: 'na', type: 'menu_item', isActive: true, isGlobal: true, image: '/images/lemonsoda.jpeg',       price: 40 },
  { id: 'bv-03', name: 'Tea',              category: 'Beverages', subCategory: 'na', type: 'menu_item', isActive: true, isGlobal: true, image: '/images/tea.jpeg',             price: 20 },
  { id: 'bv-04', name: 'Coffee',           category: 'Beverages', subCategory: 'na', type: 'menu_item', isActive: true, isGlobal: true, image: '/images/coffee.jpeg',          price: 30 },
  { id: 'bv-05', name: 'Masala Lassi',     category: 'Beverages', subCategory: 'na', type: 'menu_item', isActive: true, isGlobal: true, image: '/images/Masala Lassi.jpeg',    price: 65 },
  { id: 'bv-06', name: 'Buttermilk',       category: 'Beverages', subCategory: 'na', type: 'menu_item', isActive: true, isGlobal: true, image: '/images/buttermilk.jpeg',      price: 35 },
  { id: 'bv-07', name: 'Coconut Water',    category: 'Beverages', subCategory: 'na', type: 'menu_item', isActive: true, isGlobal: true, image: '/images/coconut-water.jpeg',   price: 50 },
  { id: 'bv-08', name: 'Mineral Water',    category: 'Beverages', subCategory: 'na', type: 'menu_item', isActive: true, isGlobal: true, image: '/images/water.jpeg',           price: 20 },

  // ── Live Counters ──────────────────────────────────────────
  { id: 'lc-01', name: 'Live Dosa Counter',       category: 'Live Counters',        subCategory: 'na',      type: 'live_counter', isActive: true, isGlobal: true, image: '/plateimg/dish-naan.png',           price: 120 },
  { id: 'lc-02', name: 'Live Chaat Counter',       category: 'Live Counters',        subCategory: 'na',      type: 'live_counter', isActive: true, isGlobal: true, image: '/plateimg/dish-samosa.png',         price: 100 },
  { id: 'lc-03', name: 'Live Pani Puri Counter',   category: 'Live Counters',        subCategory: 'na',      type: 'live_counter', isActive: true, isGlobal: true, image: '/plateimg/dish-salad.png',          price: 90  },
  { id: 'lc-04', name: 'Live Pasta Counter',       category: 'Live Counters',        subCategory: 'na',      type: 'live_counter', isActive: true, isGlobal: true, image: '/plateimg/dish-salad.png',          price: 130 },
  { id: 'lc-05', name: 'Live Jalebi Counter',      category: 'Live Counters',        subCategory: 'na',      type: 'live_counter', isActive: true, isGlobal: true, image: '/plateimg/dish-gulab.png',          price: 80  },
  { id: 'lc-06', name: 'Live BBQ Counter',         category: 'Live Counters',        subCategory: 'na',      type: 'live_counter', isActive: true, isGlobal: true, image: '/plateimg/dish-butter-chicken.png', price: 200 },
  { id: 'lc-07', name: 'Live Mocktail Counter',    category: 'Live Counters',        subCategory: 'na',      type: 'live_counter', isActive: true, isGlobal: true, image: '/plateimg/dish-raita.png',          price: 150 },
  { id: 'lc-08', name: 'Live Ice Cream Counter',   category: 'Live Counters',        subCategory: 'na',      type: 'live_counter', isActive: true, isGlobal: true, image: '/images/icecream.jpeg',               price: 120 },

  // ── Add-ons ────────────────────────────────────────────────
  { id: 'ao-01', name: 'Welcome Drink Service',    category: 'Add-ons',             subCategory: 'na',      type: 'addon',        isActive: true, isGlobal: true, image: '/plateimg/dish-raita.png',          price: 25  },
  { id: 'ao-02', name: 'Premium Dessert Counter',  category: 'Add-ons',             subCategory: 'na',      type: 'addon',        isActive: true, isGlobal: true, image: '/plateimg/dish-gulab.png',          price: 80  },
  { id: 'ao-03', name: 'Mocktail Station',          category: 'Add-ons',             subCategory: 'na',      type: 'addon',        isActive: true, isGlobal: true, image: '/plateimg/dish-raita.png',          price: 60  },
  { id: 'ao-04', name: 'Waiter Service',            category: 'Add-ons',             subCategory: 'na',      type: 'addon',        isActive: true, isGlobal: true, image: '/plateimg/banana-leaf-real.png',    price: 30  },
  { id: 'ao-05', name: 'Live Counter Setup',        category: 'Add-ons',             subCategory: 'na',      type: 'addon',        isActive: true, isGlobal: true, image: '/plateimg/banana-leaf-real.png',    price: 50  },
  { id: 'ao-06', name: 'Banana Leaf Service',       category: 'Add-ons',             subCategory: 'na',      type: 'addon',        isActive: true, isGlobal: true, image: '/plateimg/banana-leaf-real.png',    price: 20  },
  { id: 'ao-07', name: 'Extra Serving Staff',       category: 'Add-ons',             subCategory: 'na',      type: 'addon',        isActive: true, isGlobal: true, image: '/plateimg/banana-leaf-real.png',    price: 40  },
  { id: 'ao-08', name: 'Disposable Plates Setup',  category: 'Add-ons',             subCategory: 'na',      type: 'addon',        isActive: true, isGlobal: true, image: '/plateimg/banana-leaf-real.png',    price: 15  },
];

// ── Category order for display ─────────────────────────────
export const CATEGORY_ORDER = [
  'Veg Starters',
  'Non-Veg Starters',
  'Veg Curries',
  'Non-Veg Curries',
  'Rice Items',
  'Biryanis',
  'South Indian Specials',
  'Indian Breads',
  'Desserts & Sweets',
  'Beverages',
  'Live Counters',
  'Add-ons',
];

// ── Category icon map ─────────────────────────────────────
export const CATEGORY_ICON = {
  'Veg Starters':          'Salad',
  'Non-Veg Starters':      'Drumstick',
  'Veg Curries':           'Soup',
  'Non-Veg Curries':       'Utensils',
  'Rice Items':            'CookingPot',
  'Biryanis':              'CookingPot',
  'South Indian Specials': 'Soup',
  'Indian Breads':         'Utensils',
  'Desserts & Sweets':     'Cake',
  'Beverages':             'Coffee',
  'Live Counters':         'Flame',
  'Add-ons':               'Sparkles',
};

// Fallback alias for backward compatibility
export const CATEGORY_EMOJI = CATEGORY_ICON;

// ── Get image for an item (with category fallback) ─────────
export function getDishImage(item) {
  if (!item) return '/plateimg/dish-paneer.png';
  // If image is set and is a known-good path (not a broken external filename), use it
  if (item.image) return item.image;
  // Fall back to category image
  return CAT_IMG[item.category] || '/plateimg/dish-paneer.png';
}

// ── Global package templates ───────────────────────────────
export const GLOBAL_PACKAGE_TEMPLATES = [
  {
    category: 'standard',
    isActive: true,
    isGlobal: true,
    label: 'Standard',
    suggestedCount: '10–12 items',
    slots: '1 Veg Starter, 2 Curries, 1 Rice, 1 Biryani, 1 Bread, 1 Sweet, 1 Beverage, Salad & Papad',
    defaultDishes: [
      'Paneer Tikka', 'Dal Makhani', 'Veg Kurma', 'Steamed Rice',
      'Veg Biryani', 'Butter Naan', 'Gulab Jamun', 'Buttermilk',
      'Green Salad', 'Papad', 'Mint Chutney',
    ],
    defaultAddons: ['Welcome Drink Service', 'Banana Leaf Service'],
  },
  {
    category: 'special',
    isActive: true,
    isGlobal: true,
    label: 'Special',
    suggestedCount: '15–18 items',
    slots: '2 Starters, 3 Curries, 2 Rice Items, 1 Biryani, 2 Breads, 2 Desserts, 2 Beverages',
    defaultDishes: [
      'Paneer Tikka', 'Chicken Tikka',
      'Shahi Paneer', 'Dal Makhani', 'Butter Chicken',
      'Jeera Rice', 'Veg Fried Rice', 'Chicken Biryani',
      'Butter Naan', 'Garlic Naan',
      'Gulab Jamun', 'Kheer',
      'Masala Lassi', 'Welcome Drink',
      'Green Salad', 'Boondi Raita', 'Papad',
    ],
    defaultAddons: ['Welcome Drink Service', 'Waiter Service', 'Banana Leaf Service'],
  },
  {
    category: 'premium',
    isActive: true,
    isGlobal: true,
    label: 'Premium',
    suggestedCount: '22–28 items',
    slots: '3–4 Starters, 4–5 Curries, 2 Rice Items, 2 Biryanis, 3 Breads, 3 Desserts, 3 Beverages, 1 Live Counter',
    defaultDishes: [
      'Paneer Tikka', 'Hara Bhara Kebab', 'Chicken Tikka', 'Tandoori Chicken',
      'Paneer Butter Masala', 'Shahi Paneer', 'Dal Makhani', 'Butter Chicken', 'Mutton Curry',
      'Ghee Rice', 'Jeera Rice', 'Veg Biryani', 'Chicken Dum Biryani',
      'Butter Naan', 'Garlic Naan', 'Rumali Roti',
      'Gulab Jamun', 'Rasmalai', 'Kulfi',
      'Masala Lassi', 'Welcome Drink', 'Coconut Water',
      'Green Salad', 'Boondi Raita', 'Mint Chutney', 'Papad',
    ],
    defaultAddons: ['Welcome Drink Service', 'Premium Dessert Counter', 'Mocktail Station', 'Waiter Service', 'Live Counter Setup'],
  },
  {
    category: 'custom',
    isActive: true,
    isGlobal: true,
    label: 'Custom',
    suggestedCount: 'No limit',
    slots: 'Vendor selects any combination from all categories',
    defaultDishes: [],
    defaultAddons: [],
  },
];

// ── Helper: get all menu_item dishes (for package builder) ──
export function getMenuItems() {
  return MASTER_MENU.filter(d => d.type === 'menu_item');
}

// ── Helper: get live counter items ─────────────────────────
export function getLiveCounters() {
  return MASTER_MENU.filter(d => d.type === 'live_counter');
}

// ── Helper: get addon items ────────────────────────────────
export function getAddons() {
  return MASTER_MENU.filter(d => d.type === 'addon');
}

// ── Helper: group by category ──────────────────────────────
export function groupByCategory(items) {
  const grouped = {};
  for (const item of items) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  }
  // Return in canonical order
  const ordered = {};
  for (const cat of CATEGORY_ORDER) {
    if (grouped[cat]) ordered[cat] = grouped[cat];
  }
  return ordered;
}

// ── Vendor menu persistence ────────────────────────────────
const VENDOR_MENU_KEY    = (vendorId) => `caternow_vendor_menu_${vendorId}`;
const VENDOR_NAMES_KEY   = (vendorId) => `caternow_vendor_dish_names_${vendorId}`;
const VENDOR_PRICES_KEY  = (vendorId) => `caternow_vendor_dish_prices_${vendorId}`;

/**
 * Returns the set of dish ids the vendor has enabled.
 */
export function loadVendorMenuSelection(vendorId) {
  try {
    const raw = localStorage.getItem(VENDOR_MENU_KEY(vendorId));
    if (raw) return new Set(JSON.parse(raw));
  } catch { /* ignore */ }
  return new Set();
}

export function saveVendorMenuSelection(vendorId, enabledIds) {
  try {
    localStorage.setItem(VENDOR_MENU_KEY(vendorId), JSON.stringify([...enabledIds]));
  } catch { /* ignore */ }
}

/**
 * Vendor custom dish display names  { [dishId]: customName }
 */
export function loadVendorDishNames(vendorId) {
  try {
    const raw = localStorage.getItem(VENDOR_NAMES_KEY(vendorId));
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

export function saveVendorDishNames(vendorId, names) {
  try {
    localStorage.setItem(VENDOR_NAMES_KEY(vendorId), JSON.stringify(names));
  } catch { /* ignore */ }
}

/**
 * Vendor custom dish prices  { [dishId]: price }
 */
export function loadVendorDishPrices(vendorId) {
  try {
    const raw = localStorage.getItem(VENDOR_PRICES_KEY(vendorId));
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

export function saveVendorDishPrices(vendorId, prices) {
  try {
    localStorage.setItem(VENDOR_PRICES_KEY(vendorId), JSON.stringify(prices));
  } catch { /* ignore */ }
}

/**
 * Returns the vendor's selected dishes as a display-ready structure,
 * grouped by category. Falls back to null if nothing selected.
 * Injects vendor's custom names and prices.
 */
export function getVendorMenuForDisplay(vendorId) {
  const enabled = loadVendorMenuSelection(vendorId);
  if (enabled.size === 0) return null;

  const customNames  = loadVendorDishNames(vendorId);
  const customPrices = loadVendorDishPrices(vendorId);

  const selectedItems = MASTER_MENU.filter(
    d => d.type === 'menu_item' && enabled.has(d.id)
  ).map(d => ({
    ...d,
    displayName: customNames[d.id] || d.name,
    displayPrice: customPrices[d.id] ?? d.price,
  }));
  return groupByCategory(selectedItems);
}

/**
 * Returns the vendor's selected live counters (with custom names/prices).
 */
export function getVendorLiveCounters(vendorId) {
  const enabled      = loadVendorMenuSelection(vendorId);
  const customNames  = loadVendorDishNames(vendorId);
  const customPrices = loadVendorDishPrices(vendorId);
  return MASTER_MENU
    .filter(d => d.type === 'live_counter' && enabled.has(d.id))
    .map(d => ({
      ...d,
      displayName:  customNames[d.id]  || d.name,
      displayPrice: customPrices[d.id] ?? d.price,
    }));
}
