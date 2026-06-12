# Firebase Phone OTP Migration — Complete

## ✅ Architecture

```
┌─────────────────────────────────┐
│         FIREBASE                │
│   Phone OTP Authentication     │
│   signInWithPhoneNumber()      │
│   confirmationResult.confirm() │
└──────────────┬──────────────────┘
               │ user.uid
               ▼
┌─────────────────────────────────┐
│         SUPABASE                │
│   Database ONLY (no auth)      │
│   customers, vendors, requests │
│   bids tables                  │
└─────────────────────────────────┘
```

---

## 📁 Files Changed

### Created
| File | Purpose |
|------|---------|
| [firebase.js](file:///c:/Users/Naga%20sai%20nithin/Downloads/caternow/caternowv2/src/utils/firebase.js) | Firebase client — `getAuth` for OTP only |

### Updated
| File | What Changed |
|------|-------------|
| [.env](file:///c:/Users/Naga%20sai%20nithin/Downloads/caternow/caternowv2/.env) | Added `VITE_FIREBASE_*` vars, removed `VITE_SUPABASE_ANON_KEY` |
| [Login.jsx](file:///c:/Users/Naga%20sai%20nithin/Downloads/caternow/caternowv2/src/pages/Login.jsx) | `supabase.auth.signInWithOtp` → `signInWithPhoneNumber` (Firebase) |
| [vendor/Login.jsx](file:///c:/Users/Naga%20sai%20nithin/Downloads/caternow/caternowv2/src/pages/vendor/Login.jsx) | Same Firebase migration |
| [AppContext.jsx](file:///c:/Users/Naga%20sai%20nithin/Downloads/caternow/caternowv2/src/context/AppContext.jsx) | `supabase.auth.*` → `onAuthStateChanged` / `signOut` (Firebase) |
| [data.js](file:///c:/Users/Naga%20sai%20nithin/Downloads/caternow/caternowv2/src/utils/data.js) | Removed `supabase.auth.signOut()` from `logout()` |

### Verified Clean
- ✅ **Zero** `supabase.auth` references remain in the codebase
- ✅ Build passes with no errors
- ✅ Supabase client (`supabaseClient.js`) still works for database only

---

## 🔥 Firebase Console Setup (YOU MUST DO THIS)

> [!IMPORTANT]
> OTP will NOT work until you complete these steps.

1. Go to **https://console.firebase.google.com**
2. **Create a project** (or use existing)
3. Go to **Authentication → Sign-in method**
4. **Enable Phone** provider
5. Go to **Project Settings → General** → scroll to "Your apps"
6. Click **Add app → Web** (</> icon)
7. Copy the config values and paste into your `.env`:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_APP_ID=1:123456:web:abc123
```

8. **Restart your dev server** after updating `.env`

> [!TIP]
> For testing, go to **Authentication → Settings → Phone numbers for testing** and add test numbers with fixed OTPs (e.g., `+919876543210` → `123456`). This avoids reCAPTCHA issues and SMS costs.

---

## 🚀 Run & Test

```bash
# Restart dev server (required after .env changes)
npm run dev
```

### Testing Checklist

| # | Check | Status |
|---|-------|--------|
| 1 | Enter phone → OTP is sent via Firebase | ⬜ |
| 2 | reCAPTCHA verification passes invisibly | ⬜ |
| 3 | Enter correct OTP → `user.uid` returned | ⬜ |
| 4 | User data loads from Supabase DB | ⬜ |
| 5 | No `supabase.auth` errors in console | ⬜ |
| 6 | Refresh page → user stays logged in | ⬜ |
| 7 | Logout → Firebase session cleared | ⬜ |
| 8 | Vendor login flow works end-to-end | ⬜ |

---

## 🔒 Security Notes

- Firebase API key is **safe for frontend** (it's restricted by domain in Firebase Console)
- Supabase `service_role` key is **never** exposed
- reCAPTCHA (invisible) prevents automated abuse
- 30-minute session timeout still enforced
- Phone validation (repeating/sequential blocking) still active
