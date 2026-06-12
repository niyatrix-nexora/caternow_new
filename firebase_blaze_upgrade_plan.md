# 🚀 Firebase Blaze Plan Upgrade — Real SMS OTP Guide

## Why This Is Needed

Your Firebase project **caternow-3dbd9** is currently on the **Spark (free) plan**.
On the Spark plan, Firebase Phone Auth **only works with test phone numbers** (fixed OTP like `123456`).

To send **real SMS OTPs** to actual phone numbers (random codes like `G-881999`), you must upgrade to the **Blaze (pay-as-you-go) plan**.

---

## 💰 Cost — Don't Worry

| Item | Free Tier (Blaze) | After Free Tier |
|------|-------------------|-----------------|
| Phone verifications | **10,000/month FREE** | ~$0.01–$0.06 per SMS |
| Firestore reads | 50,000/day FREE | $0.06 per 100K |
| Firestore writes | 20,000/day FREE | $0.18 per 100K |
| Storage | 5 GB FREE | $0.026/GB |

> **Bottom line**: For a small app like CaterNow, you'll likely pay **₹0/month** — the free tier covers most use cases. You only pay if you exceed the limits above.

---

## 📋 Step-by-Step Upgrade Plan

### Step 1 — Open Firebase Console

1. Go to **https://console.firebase.google.com**
2. Select the **caternow** project

---

### Step 2 — Start Plan Upgrade

1. Click the **⚙️ gear icon** (bottom-left sidebar) → **Usage and billing**
2. Or go directly to: **https://console.firebase.google.com/project/caternow-3dbd9/usage**
3. Click the **"Modify plan"** button (next to "Spark" badge)

---

### Step 3 — Select Blaze Plan

1. A dialog appears showing **Spark** and **Blaze** options
2. Click **"Select plan"** under **Blaze (pay as you go)**

---

### Step 4 — Set Up Billing Account

Firebase will ask you to create or link a **Google Cloud Billing Account**.

1. Click **"Create a Cloud Billing Account"** (or select an existing one)
2. Fill in:
   - **Country**: India
   - **Account type**: Individual
   - **Name and address**: Your details
3. Click **Continue**

---

### Step 5 — Add Payment Method

You need to add a payment method. Options available in India:

| Method | Details |
|--------|---------|
| **Debit Card** | Visa/Mastercard debit cards work |
| **Credit Card** | Any Visa/Mastercard/Amex |
| **UPI** | Google Pay UPI may work through Google Cloud |
| **Net Banking** | Some banks supported |

> **Note**: Google may charge a small temporary hold (₹1–₹2) to verify your card. It gets refunded.

1. Enter your card details
2. Click **"Start free trial"** or **"Submit and enable billing"**

---

### Step 6 — Set Budget Alert (Recommended)

After upgrading, set a budget alert so you're never surprised:

1. Go to **Usage and billing** → **Details & settings**
2. Click **"Set a budget alert"**
3. Set budget to **₹100/month** (or any amount)
4. You'll get an email if spending approaches this limit

---

### Step 7 — Remove Test Phone Number

Once on Blaze, real SMS will work. Remove the test number:

1. Go to **Authentication** → **Sign-in method** → **Phone**
2. Under **"Phone numbers for testing"**, delete `+917416504297`
3. Click **Save**

> Or keep it for development/testing — test numbers bypass SMS and don't cost anything.

---

### Step 8 — Test Real OTP

1. Open your app: **http://localhost:5173**
2. Enter a **real phone number** (your number)
3. Click **Send OTP**
4. You should receive an SMS like:

```
G-881999 is your Google verification code.
Don't share your code with anyone.
```

5. Enter the code → Click **Verify** → ✅ Done!

---

## 🔒 No Code Changes Needed

The app code is **already set up** for real SMS. The Firebase SDK handles everything:
- Random 6-digit OTP generation → **Firebase handles this**
- SMS delivery → **Firebase handles this via Google's SMS infrastructure**
- OTP verification → **Firebase handles this**

You don't need to change any code — just upgrade the plan.

---

## ⏱️ Total Time Required

| Step | Time |
|------|------|
| Upgrade plan + billing | ~5 minutes |
| Remove test phone | ~1 minute |
| Test real OTP | ~2 minutes |
| **Total** | **~8 minutes** |

---

## 📌 Quick Links

- [Firebase Console — Usage & Billing](https://console.firebase.google.com/project/caternow-3dbd9/usage)
- [Firebase Console — Phone Auth Settings](https://console.firebase.google.com/project/caternow-3dbd9/authentication/providers)
- [Firebase Pricing Details](https://firebase.google.com/pricing)
- [Phone Auth Quotas](https://firebase.google.com/docs/auth/limits)

---

## ❓ FAQ

**Q: Will I be charged immediately?**
A: No. Blaze is pay-as-you-go with a generous free tier. You'll pay ₹0 unless you send 10,000+ OTPs/month.

**Q: Can I downgrade back to Spark?**
A: Yes, anytime from Usage and billing → Modify plan → Select Spark.

**Q: What if my card gets charged?**
A: Set a budget alert (Step 6). For a small app, monthly costs are typically ₹0–₹10.

**Q: Is UPI supported for billing?**
A: Google Cloud primarily accepts credit/debit cards in India. UPI support is limited.
