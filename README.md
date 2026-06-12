# CaterNow 🍽️

CaterNow is a real-time platform that connects **customers** planning events with **catering vendors** nearby. Customers create requests, discover vendors, receive bids, and confirm the best option. Vendors receive incoming requests matched to their service radius, place bids, manage menus, and track bookings/earnings.

---

## 1) Product Features (End-to-End)

### 1.1 Customer capabilities

**Authentication (OTP / phone-based)**
- Customer logs in using phone OTP.
- Session/user details are stored in the app context (and persisted in localStorage for offline/demo).

**Event request creation (multi-step flow)**
- Step 1: Event details
  - Event name, date/time
  - Guests/plates (min enforced in client: >= 10)
  - Food type: `veg | nonveg | both`
  - Location: interactive **Leaflet map** where the customer taps/selects the venue
- Step 2: Menu builder
  - Choose menu items (plus/minus quantities per item)
  - Builds a menu summary string for request submission
- Step 3: Add-ons
  - Add-ons split into categories (e.g. Food + Services)
  - Select add-ons with a toggle (Add / Added)
- Step 4: Price estimation & submit
  - Base package price computed from menu item selection
  - Add-ons price computed from selected add-ons
  - Final estimated price is shown
  - Request is created and sent to vendors

**Vendor discovery (search + filters + sorting)**
- Browse vendors list.
- Filter by food type: `all | veg | nonveg | both`.
- Sort by: top rated / nearest / A–Z.
- Vendor cards include image/avatar, food badge, rating stars, distance, radius.

**Request tracking & bidding**
- Customer can open a request detail screen.
- Customer sees bids for their request.
- Customer can:
  - Accept a bid (confirms vendor and locks request state)
  - Skip a bid
  - Hide/unhide a bid (reversible from UI side)
  - Cancel a request
  - Restore a cancelled request

**Vendor-facing request communication**
- Customer chat routes exist (chat UI in customer pages).

### 1.2 Vendor capabilities

**Vendor onboarding**
- Vendor registration + login routes.
- Vendor profile includes:
  - Name, phone
  - Business name
  - Lat/Lng and location
  - Service radius (km)
  - Food type
  - FSSAI (optional)
  - Rating and menu JSON
  - On-duty status

**Incoming requests (lead generation)**
- Vendor sees requests with statuses like `searching` / `bidding`.
- Geofence logic is enforced client-side in `utils/data.js` using:
  - distance between vendor location and request location
  - request geofence radius (`requests.currentRadius`)
  - vendor service radius (`vendors.radius`)

**Bidding**
- Vendor can submit bids for a request.
- Bid includes pricing and menu details.
- Bid lifecycle states:
  - `pending | accepted | rejected | skipped | hidden`

**Request lifecycle controls**
- Vendors can expand radius for a request (client-side helper exists).
- Vendors can accept/track incoming request interest (acceptedVendors array).

**Bookings & earnings**
- Vendor pages exist for:
  - Bookings
  - Earnings

**Menu management**
- Vendor can manage menu entries and public catalog.

**Chat**
- Vendor chat route exists.

---

## 2) Real-time Behavior (Supabase Realtime)

The data layer provides helper subscriptions:

- `subscribeToRequest(requestId, onUpdate)`
  - Subscribes to changes on `public.requests` for a single request.

- `subscribeToBidsForRequest(requestId, onUpdate)`
  - Subscribes to changes on `public.bids` for a request.
  - Currently triggers a re-fetch callback pattern (safe approach to keep UI consistent).

- `subscribeToAllRequests(onUpdate)`
  - Subscribes to INSERT/UPDATE events for `public.requests`.

---

## 3) Maps & Location Features

### 3.1 Customer location selection
- Uses **React-Leaflet** + **Leaflet**.
- Customer taps the map to set `[lat, lng]`.
- A circle overlay visualizes a large radius area around the selected point.

### 3.2 Distance calculations
- Implemented in `src/utils/data.js` using the Haversine formula (`getDistance`).
- Used to:
  - compute nearest vendors
  - determine vendor/request geofence eligibility

---

## 4) Data Layer & Offline/Local Mode

This project is designed to run in two modes:

1) **Supabase configured**
- Uses `@supabase/supabase-js`.
- Tables: `customers`, `vendors`, `requests`, `bids`, `otp_sessions`.

2) **Offline / LocalStorage mode**
- If Supabase credentials are missing or placeholders are detected, the app falls back to localStorage.
- Seed vendors are inserted into localStorage, and all CRUD uses localStorage.

Key files:
- `src/utils/supabaseClient.js`
- `src/utils/data.js`
- `src/utils/security.js`

---

## 5) Supabase Database Schema (What exists in `supabase/schema.sql`)

### 5.1 Tables

**`customers`**
- `id` (text PK)
- `phone` (unique)
- `name`, `email`
- `is_verified`
- `created_at`

**`vendors`**
- `id` (text PK)
- `name`, `business_name`
- `email`, `phone`
- `lat`, `lng`
- `food_type`: `veg | nonveg | both`
- `radius` (km)
- `fssai`
- `rating`
- `menu` (JSONB)
- `is_on_duty`
- `min_price_per_plate`
- `todays_menu`
- `additional_capacity`
- `live_price_range`
- `created_at`

**`requests`**
- `id`
- `customer_phone`
- `event_name`, `event_date`
- `plates` (min constraint in schema)
- `food_type`
- `menu_notes`
- `lat`, `lng`
- `status`: `searching | bidding | confirmed | completed | cancelled`
- `current_radius`
- `accepted_vendors` (text[])
- `confirmed_bid_id`, `confirmed_vendor_id`
- `customer_addons` (JSONB)
- `budget_per_plate`, `initial_budget`
- `coupon_code`, `discount_percent`
- `created_at`

**`bids`**
- `id`
- `request_id` FK -> `requests(id)` (cascade delete)
- `vendor_id`
- `vendor_name`
- `price_per_plate`, `total_price`
- `menu_details`, `notes`
- `distance`
- `status`: `pending | accepted | rejected | skipped | hidden`
- `created_at`

**`otp_sessions`**
- `id` (UUID PK)
- `phone`, `customer_id` FK
- `code_hash`
- `attempts`, `locked_until`
- `expires_at`
- `verified`
- `created_at`

### 5.2 Row Level Security (RLS)

RLS is enabled on all main tables and policies are defined to restrict access by role (customer vs vendor).

- Customers can read/write their own profile and requests.
- Vendors can read active nearby requests (client handles geofence) and manage their own vendor/bids.
- OTP table access is blocked for client: `ON otp_sessions FOR ALL USING (false)`.

### 5.3 Demo seed
- `vendors` are seeded with demo rows (`v1..v3`) using `ON CONFLICT (id) DO NOTHING`.

### 5.4 RPC / Atomic Functions

Two key stored procedures exist:

**`create_bid_v1(p_bid JSONB)`**
- Creates a bid and moves the request to `bidding` in one transaction.

**`accept_bid_v1(p_request_id, p_bid_id, p_vendor_id, p_addons, p_coupon_code, p_discount_percent)`**
- Atomically:
  - Updates request to `confirmed`
  - Marks selected bid `accepted`
  - Marks all other bids `rejected`

---

## 6) App Routes (UI Mapping)

Routing is handled in `src/App.jsx`.

### Customer routes
- `/` → redirects based on role
- `/customer` → Dashboard
- `/customer/new-request` → New Request (multi-step)
- `/customer/request/:id` → ViewBids
- `/customer/chat/:id` → Chat
- `/customer/payment/:id` → Payment
- `/customer/tracking/:id` → EventTracking
- `/customer/vendors` → VendorSearch
- `/customer/vendors/:id` → VendorDetail
- `/customer/profile` → CustomerProfile

### Vendor routes
- `/vendor` → VendorDashboard
- `/vendor/requests` → IncomingRequests
- `/vendor/packages/new` → CreatePackage
- `/vendor/menu` → MenuManagement
- `/vendor/request/:id` → VendorRequestDetail
- `/vendor/chat/:id` → VendorChat
- `/vendor/bookings` → VendorBookings
- `/vendor/earnings` → VendorEarnings
- `/vendor/profile` → VendorProfile

---

## 7) Authentication & OTP Notes

- Phone OTP authentication is configured using Firebase (`src/utils/firebase.js`).
- Supabase is used for the database; OTP session table is present with strict RLS (blocked to client).

---

## 8) Project Setup

### 8.1 Prerequisites
- Node.js
- Supabase project (recommended)

### 8.2 Install
```bash
npm install
```

### 8.3 Configure environment
Create `.env` and set at least:
```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### 8.4 Initialize database
- Run all SQL from:
  - `supabase/schema.sql`

### 8.5 Run (web)
```bash
npm run dev
```

### 8.6 Build & mobile packaging (Capacitor)
```bash
npm run build
npx cap sync
```

---

## 9) Scripts

- `npm run dev` — Vite dev server
- `npm run build` — Production build
- `npm run lint` — ESLint
- `npm run preview` — Preview production
- `npm run test` — Vitest
- `npm run test:watch` — Vitest watch

---

## 10) Testing

Unit tests exist under `src/utils/__tests__/`:
- `bidFlow.test.js`
- `data.test.js`
- `otpEngine.test.js`
- `security.test.js`

---

## 11) Notes / Implementation Details (Important)

### 11.1 Schema evolution fallback
`src/utils/data.js` includes “missing column” retry behavior.
- If Supabase insert/update fails because new columns are missing (e.g. during schema rollout), the code retries without the new fields.

### 11.2 Request geofence matching
Vendor dashboard eligibility uses:
- distance(vendor, request) <= request.currentRadius
- distance(vendor, request) <= vendor.radius

---

## 12) Assets

- Static vendor images are mapped by name in `VendorSearch`.
- Public assets are located under:
  - `public/` (icons, sw, images)
  - `images/` (source images)

---

## 13) Supabase Schema File

The authoritative database definition is:
- `supabase/schema.sql`

(Contains tables, indexes, RLS policies, demo seed, and RPC functions.)

