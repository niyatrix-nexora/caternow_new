# 🔧 Firebase OTP Fix — Morning Checklist

The code is ready. The `auth/internal-error` is a **Firebase Console configuration issue**, not a code issue.

Do these 2 things in your browser:

---

## ✅ Step 1 — Enable reCAPTCHA Enterprise API

1. Open: **https://console.cloud.google.com/apis/library/recaptchaenterprise.googleapis.com?project=caternow-3dbd9**
2. Click **"Enable"** (if not already enabled)
3. Wait for it to say "API Enabled"

> This is required because Firebase Phone Auth uses reCAPTCHA Enterprise under the hood.

---

## ✅ Step 2 — Add Test Phone Number

1. Open: **https://console.firebase.google.com/project/caternow-3dbd9/authentication/providers**
2. Click on **Phone** provider to expand it
3. Under **"Phone numbers for testing"**, add:
   - Phone number: `+917416504297`
   - Verification code: `123456`
4. Click **Add** → then click **Save**

> Test numbers bypass reCAPTCHA and SMS entirely — they work on the free Spark plan.

---

## ✅ Step 3 — Test it

1. Restart dev server: `npm run dev`
2. Enter `7416504297` → click Send OTP
3. Enter `123456` → click Verify

That's it! 🎉
