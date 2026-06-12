# CaterNow Verified Bug Report

Date: May 8, 2026

## Verification Summary

| Check | Result | Notes |
| --- | --- | --- |
| Full lint | PASS | `npm.cmd run lint`: 0 errors, 0 warnings. |
| Unit tests | PASS | `npm.cmd test`: 4 test files, 58 tests passed. Required escalation because sandbox blocks Vite/Vitest child-process spawn with `EPERM`. |
| Production build | PASS WITH WARNING | `npm.cmd run build` succeeded. Bundle warning remains: `dist/assets/index-Cy5IS4-D.js` is 829.18 kB minified, above Vite's 500 kB warning threshold. |
| Database sync/read-write review | PASS | Critical stale refresh, fake bid success, and undefined RPC argument bugs fixed. |
| Supabase schema safety | PASS WITH DEPLOYMENT REQUIREMENT | RLS policies are now identity-aware and RPC writes are transactional. Production must provide Supabase JWT claims: `sub`/`user_id`, `phone`, and `role`. |

## Current Technical Verdict

**STATUS: STABLE FOR PRODUCTION CANDIDATE**

The active source tree now builds, passes lint, and passes tests. The main runtime sync/read-write bugs found in the previous report have been fixed.

Production deployment requirement: because the app uses Firebase auth and Supabase data, Supabase must receive trusted auth claims or writes should go through a trusted backend. The updated schema is designed for that production model.

---

## Fixed Bugs

### BUG-001: Customer refresh could crash after requests exist
- **Status:** FIXED
- **Files:** `src/context/AppContext.jsx`, `src/utils/data.js`
- **Fix:** Added `getBidsForRequests()` to the data layer and removed direct unimported `supabase`/`toCamel` calls from context refresh.

### BUG-002: Accept bid RPC referenced undefined coupon variables
- **Status:** FIXED
- **Files:** `src/utils/data.js`, `src/pages/customer/ViewBids.jsx`
- **Fix:** `acceptBid()` now accepts and persists add-ons, coupon code, and discount percent in both Supabase and localStorage paths.
- **Test:** Added regression coverage for accepted bid add-ons/coupon persistence.

### BUG-003: Failed bid insert could still return success
- **Status:** FIXED
- **Files:** `src/utils/data.js`, `supabase/schema.sql`
- **Fix:** Supabase bid creation now uses `create_bid_v1` RPC for atomic bid insert + request status update. Fallback insert returns `null` on errors instead of fake success.

### BUG-004: Vendor dashboard violated React hook order
- **Status:** FIXED
- **File:** `src/pages/vendor/Dashboard.jsx`
- **Fix:** Moved all hooks before early returns and removed synchronous state-setting effect that React 19 lint rejects.

### BUG-005: Customer registration used undefined ID helper
- **Status:** FIXED
- **File:** `src/pages/customer/Register.jsx`
- **Fix:** Registration now lets `createCustomer()` generate an ID unless Firebase UID is present.

### BUG-006: Vendor bid form could block all submissions
- **Status:** FIXED
- **File:** `src/pages/vendor/RequestDetail.jsx`
- **Fix:** Validation now uses the displayed effective bid price instead of a removed price input state.

### BUG-007: App boot fetched broad request/bid data
- **Status:** FIXED
- **File:** `src/context/AppContext.jsx`
- **Fix:** Initial load now fetches scoped customer/vendor data when a saved user exists.

### BUG-008: RLS policies were public
- **Status:** FIXED IN SCHEMA
- **File:** `supabase/schema.sql`
- **Fix:** Replaced public read/write policies with identity-aware policies using JWT claims and added secured RPCs with explicit `search_path`.

### BUG-009: Duplicate unsafe Supabase client existed
- **Status:** FIXED
- **File:** `src/utils/supabase.js`
- **Fix:** Removed the unused unguarded client module. The app now standardizes on `src/utils/supabaseClient.js`, which supports offline/localStorage mode when credentials are missing.

## Remaining Production Work

- Add route-level code splitting to reduce the 829 kB minified JS chunk.
- Ensure Firebase-to-Supabase auth bridging or backend RPC mediation is deployed before applying strict RLS in production.
