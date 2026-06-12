# CaterNow Large-Scale Production Readiness Plan

Date: May 6, 2026

## Goal

This document lists the changes needed to make CaterNow ready for a large-scale production launch.

Current stack:

- Frontend: React + Vite
- App packaging: Capacitor
- Authentication: Firebase Phone OTP
- Database: Supabase Postgres

Current status:

- Good for demo, MVP, or small beta.
- Not yet ready for hundreds or thousands of active simultaneous users.
- Main issue: repeated full-table polling from the frontend.

## Target Architecture

For large scale, CaterNow should move from this pattern:

```text
Every user -> every few seconds -> fetch all requests + all bids + all vendors
```

To this pattern:

```text
Every user -> fetch only their own needed data
Important changes -> pushed through Realtime or targeted refresh
Database -> protected with strict RLS and proper indexes
```

## Priority 1: Fix Current Functional Issues

Before scaling, fix the bugs already detected by tests.

### Required Changes

- Fix Indian phone number validation.
- Fix request creation returning `null`.
- Fix bid-flow test failures.
- Make sure customer request creation works with valid user data.
- Make sure vendor bid creation works after request creation.
- Make sure accepting/cancelling/restoring bids works consistently.

### Why This Matters

Scaling a broken flow only creates more failed users. These issues can cause real users to fail during signup, request creation, or bid submission.

### Verification

Run:

```bash
npm.cmd test
npm.cmd run build
```

Required result:

```text
All tests pass
Production build succeeds
```

## Priority 2: Replace Global Polling

The current app refreshes broad app data every few seconds. This is the biggest performance problem.

### Current Problem

The shared refresh function loads:

- all requests
- all bids
- all vendors

This runs repeatedly from multiple screens.

### Required Changes

Replace global refresh with page-specific fetch functions.

Customer dashboard should fetch:

```text
requests where customer_phone = current user's phone
```

Customer request detail should fetch:

```text
one request by id
bids where request_id = current request id
vendors only for bid vendor ids
```

Vendor dashboard should fetch:

```text
vendor profile by current vendor id
open requests near that vendor
bids where vendor_id = current vendor id
```

Vendor request detail should fetch:

```text
one request by id
existing bid for current vendor and request
```

### Expected Impact

This can reduce database load by 80% to 95% depending on traffic and table size.

## Priority 3: Use Supabase Realtime For Active Order Updates

Polling every 2.5 to 5 seconds is not efficient for large scale.

### Required Changes

Use Supabase Realtime subscriptions for:

- new bids on a request
- request status changes
- accepted/rejected bid status changes
- vendor dashboard incoming request updates

Example design:

```text
Customer request detail:
Subscribe to bids where request_id = current request id
Subscribe to request row where id = current request id
```

```text
Vendor dashboard:
Subscribe to active requests
Subscribe to bids where vendor_id = current vendor id
```

### Important Note

Supabase Realtime also has plan limits. On Free plan, concurrent Realtime connections are limited, so for serious production traffic use Supabase Pro or higher.

Source: https://supabase.com/docs/guides/realtime/rate-limits

## Priority 4: Add Proper Database Indexes

Indexes are required so Supabase/Postgres can find data quickly as tables grow.

### Existing Helpful Indexes

Your schema already has:

```sql
idx_customers_phone
idx_requests_phone
idx_requests_status
idx_bids_request
idx_bids_vendor
```

### Recommended New Indexes

Add indexes for common production queries:

```sql
create index if not exists idx_requests_customer_status_created
on requests (customer_phone, status, created_at desc);

create index if not exists idx_requests_status_created
on requests (status, created_at desc);

create index if not exists idx_bids_request_status_created
on bids (request_id, status, created_at desc);

create index if not exists idx_bids_vendor_status_created
on bids (vendor_id, status, created_at desc);

create index if not exists idx_vendors_food_type
on vendors (food_type);
```

### Location Search Improvement

Currently vendor/request distance filtering is mostly done in JavaScript. For larger scale, move location filtering into the database.

Best option:

- Enable PostGIS in Supabase.
- Store vendor and request location as geography/geometry.
- Query nearby vendors/requests directly in SQL.

Example future approach:

```sql
create extension if not exists postgis;

alter table vendors
add column if not exists location geography(point, 4326);

create index if not exists idx_vendors_location
on vendors using gist (location);
```

## Priority 5: Tighten Supabase RLS Policies

Current RLS policies are too open for production because many policies use `USING (true)` and `WITH CHECK (true)`.

### Required Changes

Customers table:

- Customers can read only their own profile.
- Customers can update only their own profile.
- Public clients should not read all customers.

Requests table:

- Customers can read and update their own requests.
- Vendors can read only active nearby/open requests, depending on business rules.
- Customers should not update another customer's request.

Bids table:

- Vendors can create bids only for themselves.
- Vendors can update only their own bids.
- Customers can read bids only for their own requests.
- Customers can accept/reject bids only for their own requests.

Vendors table:

- Public read can be allowed if vendor discovery is public.
- Vendors can update only their own profile.

### Important Design Issue

Firebase Auth and Supabase RLS do not automatically know about each other.

You need one of these production-safe approaches:

1. Use Supabase Auth instead of Firebase Auth.
2. Keep Firebase Auth, but use a backend/API layer that verifies Firebase ID tokens and talks to Supabase securely.
3. Use Supabase custom JWT integration if you want Firebase identity to map into Supabase RLS.

For production, option 2 is often easiest with the current app:

```text
Frontend -> Firebase login -> gets Firebase ID token
Frontend -> sends token to backend
Backend -> verifies token
Backend -> performs Supabase queries with service role
Backend -> returns only allowed data
```

Never expose the Supabase service role key in the frontend.

## Priority 6: Add Backend API For Sensitive Operations

Currently most database operations are directly from the frontend. For a serious production app, sensitive operations should move to a trusted backend.

### Move These To Backend

- Creating requests
- Accepting bids
- Cancelling requests
- Restoring requests
- Vendor bid creation
- Vendor profile updates
- Any payment-related logic
- Any notification sending

### Why

A backend can:

- verify Firebase ID tokens
- prevent fake user IDs
- enforce business rules
- rate-limit abuse
- hide service keys
- run transactions safely

## Priority 7: Use Database Transactions / RPC For Bid Acceptance

Bid acceptance is a critical flow.

Current behavior updates multiple bids and the request separately. At scale, two users/actions can race.

### Required Change

Create a Supabase Postgres function or backend transaction for accepting a bid.

It should atomically:

1. Check the request belongs to the customer.
2. Check the request is still open.
3. Mark selected bid as accepted.
4. Mark other bids as rejected.
5. Update request status to confirmed.
6. Store confirmed bid/vendor id.

### Why

This prevents inconsistent states like:

- two accepted bids for one request
- request confirmed but bid still pending
- bid accepted after request was cancelled

## Priority 8: Add Pagination and Limits

Any list screen should have a limit.

### Required Changes

Use `.limit()` and range pagination for:

- vendor list
- customer request history
- vendor bid history
- bid lists
- admin/report screens if added later

Example:

```js
supabase
  .from('requests')
  .select('*')
  .eq('customer_phone', phone)
  .order('created_at', { ascending: false })
  .range(0, 19)
```

## Priority 9: Improve Frontend Bundle and Runtime Performance

The production JS bundle is currently around 813 KB minified and 228 KB gzip.

This is acceptable for MVP, but for production mobile users it should be improved.

### Required Changes

- Add route-level code splitting.
- Lazy-load map pages.
- Lazy-load Leaflet only when a map is visible.
- Remove unused imports.
- Avoid loading vendor/request/bid data globally.
- Add loading/error states for every async operation.

### Example

Use React lazy loading:

```js
const ViewBids = lazy(() => import('./pages/customer/ViewBids'));
```

## Priority 10: Add Production Monitoring

You need to know when the app is slow or broken.

### Required Tools

Frontend monitoring:

- Sentry, Firebase Crashlytics, or similar.
- Track React errors.
- Track failed network requests.
- Track slow screen loads.

Supabase monitoring:

- CPU usage.
- Memory usage.
- API request count.
- slow queries.
- database size.
- connection usage.

Firebase monitoring:

- OTP send failures.
- quota errors.
- blocked/abuse events.
- auth conversion rate.

## Priority 11: Add Rate Limiting and Abuse Protection

Public apps are attacked quickly once launched.

### Required Changes

- Rate-limit OTP requests.
- Rate-limit request creation.
- Rate-limit bid creation.
- Add CAPTCHA where needed.
- Prevent duplicate bids from the same vendor on one request.
- Prevent spam requests from the same customer.
- Validate all user input on backend/database, not only frontend.

## Priority 12: Upgrade Hosting and Plans

### Firebase

For real phone OTP:

- Use Firebase Blaze plan.
- Monitor SMS cost.
- Configure allowed domains.
- Configure app verification/reCAPTCHA correctly.

Source: https://firebase.google.com/docs/auth/limits

### Supabase

For real production:

- Use Supabase Pro or higher.
- Avoid Free plan for launch.
- Enable backups.
- Consider PITR if real business orders are stored.
- Upgrade compute if CPU or memory becomes high.

Source: https://supabase.com/docs/guides/platform/compute-and-disk

## Priority 13: Add Load Testing

Before launch, run load tests on staging.

### Recommended Tool

Use k6.

### Test Scenarios

Test at least:

- 50 active users
- 100 active users
- 300 active users
- 1,000 active users if that is the launch goal

### Simulate These Flows

- Customer login
- Customer creates request
- Vendors view available requests
- Vendors submit bids
- Customer views bids
- Customer accepts a bid
- Dashboard refresh/realtime updates

### Success Criteria

Set targets:

```text
95% of API requests under 500 ms
No database errors
No auth quota errors
No duplicate accepted bids
No failed request creation
Frontend stays responsive
```

## Suggested Implementation Phases

### Phase 1: Stability

Estimated time: 1 to 3 days

- Fix failing tests.
- Fix phone validation.
- Fix request creation.
- Confirm build and tests pass.
- Add error handling for failed Supabase writes.

### Phase 2: Data Access Optimization

Estimated time: 3 to 7 days

- Remove global full-table refresh.
- Add page-specific queries.
- Add database indexes.
- Add pagination.
- Reduce polling intervals.

### Phase 3: Security

Estimated time: 3 to 7 days

- Replace open RLS policies.
- Decide Firebase + backend or Supabase Auth.
- Move sensitive writes to backend/API.
- Add rate limits.

### Phase 4: Realtime and Transactions

Estimated time: 4 to 10 days

- Add Supabase Realtime subscriptions.
- Replace polling on active screens.
- Add atomic bid acceptance transaction.
- Test race conditions.

### Phase 5: Production Operations

Estimated time: 2 to 5 days

- Add monitoring.
- Add crash reporting.
- Configure production Firebase.
- Upgrade Supabase plan.
- Run load tests.
- Prepare rollback plan.

## Minimum Checklist Before Public Launch

- [ ] All tests pass.
- [ ] Production build passes.
- [ ] Firebase Phone OTP works on real devices.
- [ ] Supabase is on a paid production-ready plan.
- [ ] Global full-table polling is removed.
- [ ] Important queries are indexed.
- [ ] RLS policies are strict.
- [ ] Sensitive writes are protected by backend/RPC.
- [ ] Bid acceptance is atomic.
- [ ] Lists are paginated.
- [ ] Error monitoring is installed.
- [ ] Load test is completed.
- [ ] Backup/restore plan is ready.

## Final Recommendation

Do not launch CaterNow publicly at large scale with the current architecture.

Safe current target:

```text
50 to 100 active simultaneous users
```

Production-ready target after changes:

```text
300 to 1,000+ active simultaneous users, depending on Supabase plan, query optimization, Realtime usage, and load test results
```

The most important work is:

1. Fix failing tests.
2. Remove full-table polling.
3. Add user-specific queries.
4. Secure RLS/auth.
5. Add transactions for bid acceptance.
6. Run load testing before launch.

