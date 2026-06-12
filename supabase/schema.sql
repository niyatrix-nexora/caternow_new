-- ============================================
-- CaterNow FINAL PRODUCTION DATABASE SCHEMA
-- ============================================

-- Wipe old tables to ensure clean schema update
DROP TABLE IF EXISTS otp_sessions CASCADE;
DROP TABLE IF EXISTS bids CASCADE;
DROP TABLE IF EXISTS requests CASCADE;
DROP TABLE IF EXISTS vendors CASCADE;
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- CUSTOMERS
-- ==========================================
CREATE TABLE customers (
  id TEXT PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  name TEXT,
  email TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_phone ON customers(phone);

-- ==========================================
-- VENDORS
-- ==========================================
CREATE TABLE vendors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  business_name TEXT,
  email TEXT,
  phone TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  food_type TEXT NOT NULL CHECK (food_type IN ('veg','nonveg','both')),
  radius INTEGER DEFAULT 20,
  fssai TEXT,
  rating DOUBLE PRECISION DEFAULT 0,
  menu JSONB DEFAULT '{}'::jsonb,
  is_on_duty BOOLEAN DEFAULT TRUE,
  min_price_per_plate INTEGER DEFAULT 150,
  todays_menu TEXT,
  additional_capacity INTEGER DEFAULT 0,
  live_price_range TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- REQUESTS
-- ==========================================
CREATE TABLE requests (
  id TEXT PRIMARY KEY,
  customer_phone TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_date TEXT NOT NULL,
  plates INTEGER CHECK (plates >= 10),
  food_type TEXT CHECK (food_type IN ('veg','nonveg','both')),
  menu_notes TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  status TEXT CHECK (status IN ('searching','bidding','confirmed','completed','cancelled')),
  current_radius INTEGER DEFAULT 10,
  accepted_vendors TEXT[] DEFAULT '{}',
  confirmed_bid_id TEXT,
  confirmed_vendor_id TEXT,
  customer_addons JSONB DEFAULT '[]'::jsonb,
  budget_per_plate INTEGER,
  initial_budget INTEGER,
  coupon_code TEXT,
  discount_percent INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_requests_phone ON requests(customer_phone);
CREATE INDEX idx_requests_status ON requests(status);

-- Production Performance Indexes
CREATE INDEX idx_requests_customer_status_created ON requests(customer_phone, status, created_at DESC);
CREATE INDEX idx_requests_status_created ON requests(status, created_at DESC);

-- ==========================================
-- BIDS
-- ==========================================
CREATE TABLE bids (
  id TEXT PRIMARY KEY,
  request_id TEXT REFERENCES requests(id) ON DELETE CASCADE,
  vendor_id TEXT NOT NULL,
  vendor_name TEXT,
  price_per_plate INTEGER CHECK (price_per_plate >= 50),
  total_price INTEGER,
  menu_details TEXT,
  notes TEXT,
  distance DOUBLE PRECISION,
  status TEXT CHECK (status IN ('pending','accepted','rejected','skipped','hidden')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bids_request ON bids(request_id);
CREATE INDEX idx_bids_vendor ON bids(vendor_id);
CREATE INDEX idx_bids_request_status_created ON bids(request_id, status, created_at DESC);
CREATE INDEX idx_bids_vendor_status_created ON bids(vendor_id, status, created_at DESC);

-- ==========================================
-- OTP SESSIONS (SECURE LOGIN)
-- ==========================================
CREATE TABLE otp_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT NOT NULL,
  customer_id TEXT REFERENCES customers(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  attempts INTEGER DEFAULT 0 CHECK (attempts <= 5),
  locked_until TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_otp_phone ON otp_sessions(phone);
CREATE INDEX idx_otp_customer ON otp_sessions(customer_id);
CREATE INDEX idx_otp_expiry ON otp_sessions(expires_at);

-- ==========================================
-- ENABLE RLS
-- ==========================================
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_sessions ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- RLS POLICIES (PRODUCTION MODE)
-- ==========================================

CREATE OR REPLACE FUNCTION app_jwt()
RETURNS JSONB AS $$
  SELECT COALESCE(NULLIF(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb);
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION app_user_id()
RETURNS TEXT AS $$
  SELECT COALESCE(app_jwt()->>'sub', app_jwt()->>'user_id', '');
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION app_user_phone()
RETURNS TEXT AS $$
  SELECT COALESCE(app_jwt()->>'phone', '');
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION app_user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(app_jwt()->>'role', '');
$$ LANGUAGE sql STABLE;

-- CUSTOMERS
CREATE POLICY "Customers read own profile"
ON customers FOR SELECT
USING (phone = app_user_phone() OR id = app_user_id());

CREATE POLICY "Customers insert own profile"
ON customers FOR INSERT
WITH CHECK (phone = app_user_phone() OR id = app_user_id());

CREATE POLICY "Customers update own profile"
ON customers FOR UPDATE
USING (phone = app_user_phone() OR id = app_user_id())
WITH CHECK (phone = app_user_phone() OR id = app_user_id());

-- VENDORS
CREATE POLICY "Public read vendors"
ON vendors FOR SELECT
USING (true);

CREATE POLICY "Vendors insert own profile"
ON vendors FOR INSERT
WITH CHECK (id = app_user_id() AND app_user_role() = 'vendor');

CREATE POLICY "Vendors update own profile"
ON vendors FOR UPDATE
USING (id = app_user_id() AND app_user_role() = 'vendor')
WITH CHECK (id = app_user_id() AND app_user_role() = 'vendor');

-- REQUESTS
CREATE POLICY "Customers read own requests"
ON requests FOR SELECT
USING (customer_phone = app_user_phone());

CREATE POLICY "Vendors read active nearby candidates"
ON requests FOR SELECT
USING (app_user_role() = 'vendor' AND status IN ('searching','bidding'));

CREATE POLICY "Customers insert own requests"
ON requests FOR INSERT
WITH CHECK (customer_phone = app_user_phone());

CREATE POLICY "Customers update own requests"
ON requests FOR UPDATE
USING (customer_phone = app_user_phone())
WITH CHECK (customer_phone = app_user_phone());

-- BIDS
CREATE POLICY "Customers read bids for own requests"
ON bids FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM requests
    WHERE requests.id = bids.request_id
      AND requests.customer_phone = app_user_phone()
  )
);

CREATE POLICY "Vendors read own bids"
ON bids FOR SELECT
USING (vendor_id = app_user_id() AND app_user_role() = 'vendor');

CREATE POLICY "Vendors insert own bids"
ON bids FOR INSERT
WITH CHECK (vendor_id = app_user_id() AND app_user_role() = 'vendor');

CREATE POLICY "Bid owner or request owner updates bids"
ON bids FOR UPDATE
USING (
  (vendor_id = app_user_id() AND app_user_role() = 'vendor')
  OR EXISTS (
    SELECT 1
    FROM requests
    WHERE requests.id = bids.request_id
      AND requests.customer_phone = app_user_phone()
  )
)
WITH CHECK (
  (vendor_id = app_user_id() AND app_user_role() = 'vendor')
  OR EXISTS (
    SELECT 1
    FROM requests
    WHERE requests.id = bids.request_id
      AND requests.customer_phone = app_user_phone()
  )
);

-- OTP (STRICT: NO CLIENT ACCESS)
CREATE POLICY "OTP blocked"
ON otp_sessions FOR ALL USING (false);

-- ==========================================
-- DEMO DATA
-- ==========================================
INSERT INTO vendors (id,name,phone,lat,lng,food_type,radius,fssai,rating)
VALUES
('v1','Royal Feast Caterers','9876543210',12.9716,77.5946,'both',20,'FSSAI12345671',4.5),
('v2','Spice Garden Kitchen','9876543211',12.9352,77.6245,'veg',15,'FSSAI12345672',4.8),
('v3','Grand Biryani House','9876543212',12.9611,77.6387,'nonveg',25,'FSSAI12345673',4.2)
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- ATOMIC TRANSACTIONS (RPC)
-- ==========================================

/**
 * Accepts a bid atomically, updating the request and all associated bids.
 * This prevents race conditions and inconsistent states.
 */
CREATE OR REPLACE FUNCTION accept_bid_v1(
  p_request_id TEXT, 
  p_bid_id TEXT, 
  p_vendor_id TEXT,
  p_addons JSONB DEFAULT '[]'::jsonb,
  p_coupon_code TEXT DEFAULT NULL,
  p_discount_percent INTEGER DEFAULT 0
)
RETURNS void AS $$
DECLARE
  v_locked_request requests%ROWTYPE;
BEGIN
  SELECT *
  INTO v_locked_request
  FROM requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request % not found', p_request_id;
  END IF;

  IF v_locked_request.status IN ('cancelled', 'completed') THEN
    RAISE EXCEPTION 'Request % is closed', p_request_id;
  END IF;

  IF v_locked_request.status = 'confirmed'
     AND v_locked_request.confirmed_bid_id IS NOT NULL
     AND v_locked_request.confirmed_bid_id <> p_bid_id THEN
    RAISE EXCEPTION 'Request % already confirmed with another bid', p_request_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM bids
    WHERE id = p_bid_id
      AND request_id = p_request_id
      AND vendor_id = p_vendor_id
  ) THEN
    RAISE EXCEPTION 'Bid % does not belong to request % and vendor %', p_bid_id, p_request_id, p_vendor_id;
  END IF;

  -- 1. Update the request status and confirmation details
  UPDATE requests
  SET 
    status = 'confirmed',
    confirmed_bid_id = p_bid_id,
    confirmed_vendor_id = p_vendor_id,
    customer_addons = p_addons,
    coupon_code = p_coupon_code,
    discount_percent = p_discount_percent
  WHERE id = p_request_id;

  -- 2. Mark the selected bid as accepted
  UPDATE bids
  SET status = 'accepted'
  WHERE id = p_bid_id;

  -- 3. Mark all other bids for this request as rejected
  UPDATE bids
  SET status = 'rejected'
  WHERE request_id = p_request_id 
    AND id != p_bid_id
    AND status IN ('pending', 'hidden');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

/**
 * Creates a bid and moves the request to bidding in one transaction.
 * This prevents UI/data gaps where a request status changes without a matching bid.
 */
CREATE OR REPLACE FUNCTION create_bid_v1(p_bid JSONB)
RETURNS bids AS $$
DECLARE
  v_request requests%ROWTYPE;
  v_bid bids%ROWTYPE;
BEGIN
  SELECT *
  INTO v_request
  FROM requests
  WHERE id = p_bid->>'request_id'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request % not found', p_bid->>'request_id';
  END IF;

  IF v_request.status NOT IN ('searching', 'bidding') THEN
    RAISE EXCEPTION 'Request % is not accepting bids', v_request.id;
  END IF;

  INSERT INTO bids (
    id,
    request_id,
    vendor_id,
    vendor_name,
    price_per_plate,
    total_price,
    menu_details,
    notes,
    distance,
    status,
    created_at
  )
  VALUES (
    p_bid->>'id',
    p_bid->>'request_id',
    p_bid->>'vendor_id',
    p_bid->>'vendor_name',
    (p_bid->>'price_per_plate')::INTEGER,
    (p_bid->>'total_price')::INTEGER,
    p_bid->>'menu_details',
    p_bid->>'notes',
    NULLIF(p_bid->>'distance', '')::DOUBLE PRECISION,
    COALESCE(p_bid->>'status', 'pending'),
    COALESCE((p_bid->>'created_at')::TIMESTAMPTZ, NOW())
  )
  RETURNING * INTO v_bid;

  UPDATE requests
  SET status = 'bidding'
  WHERE id = v_request.id;

  RETURN v_bid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
