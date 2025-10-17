# Quick Start: Enable Email Notifications

## Why Emails Aren't Sending Yet

Email notifications require **Firebase Cloud Functions**, which:
1. Run on Firebase's servers (not in your browser)
2. Need the **Blaze (pay-as-you-go) plan** to work
3. Require a **SendGrid account** to send emails

Currently, you only have the documentation - the actual functions haven't been created yet.

---

## 5-Minute Setup Guide

### Step 1: Upgrade Firebase to Blaze Plan

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`benthic-ai`)
3. Click ⚙️ Settings → Usage and billing → **Modify plan**
4. Choose **Blaze (Pay as you go)**

**Cost:** 
- Cloud Functions: **2 million invocations/month FREE**
- After that: $0.40 per million invocations
- For email notifications: ~$0.01-$5/month depending on user activity

### Step 2: Create SendGrid Account

1. Go to [SendGrid.com](https://sendgrid.com/)
2. Sign up for a **free account** (100 emails/day)
3. Verify your email address

### Step 3: Get SendGrid API Key

1. In SendGrid dashboard, go to **Settings → API Keys**
2. Click **Create API Key**
3. Name it: `AquaSense`
4. Choose **Restricted Access**
5. Enable **Mail Send** permission
6. Click **Create & View**
7. **Copy the API key** (you won't see it again!)

### Step 4: Verify Sender Email

1. In SendGrid, go to **Settings → Sender Authentication**
2. Click **Verify a Single Sender**
3. Enter your email (e.g., `your-email@gmail.com`)
4. Fill out the form
5. Check your email and click the verification link

### Step 5: Initialize Firebase Functions

Run these commands:

```bash
cd /Users/georgebeck/Downloads/Econ_web/AquaSense_FINAL

# Login to Firebase
firebase login

# Initialize Functions (if not already done)
firebase init functions
```

When prompted:
- Select your project: **benthic-ai**
- Language: **JavaScript** (or TypeScript if you prefer)
- ESLint: **Yes**
- Install dependencies: **Yes**

### Step 6: Install SendGrid Package

```bash
cd functions
npm install @sendgrid/mail
cd ..
```

### Step 7: Configure SendGrid API Key

```bash
firebase functions:config:set \
  sendgrid.api_key="YOUR_SENDGRID_API_KEY_HERE" \
  sendgrid.from_email="your-verified-email@gmail.com" \
  sendgrid.from_name="AquaSense Team"
```

Replace:
- `YOUR_SENDGRID_API_KEY_HERE` with your actual SendGrid API key
- `your-verified-email@gmail.com` with your verified sender email

### Step 8: Create the Functions Code

Replace the contents of `functions/index.js` with the code from `EMAIL_SETUP.md` (lines 61-316).

**Important:** Update these URLs in the code:
- Replace `https://your-app-url.vercel.app` with your actual Vercel URL
- Example: `https://aqua-sense-final.vercel.app`

### Step 9: Deploy Functions

```bash
firebase deploy --only functions
```

This will deploy two functions:
- `sendWelcomeEmail` - Triggered when users sign up
- `sendProjectInvitationEmail` - Triggered when users are added to projects

### Step 10: Test It!

1. **Test Welcome Email:**
   - Create a new user account
   - Check the email inbox

2. **Test Project Invitation:**
   - Add a user to a project
   - Check the invited user's email

---

## Troubleshooting

### "Firebase project is not on the Blaze plan"
→ Upgrade to Blaze plan (Step 1)

### "The from address does not match a verified Sender Identity"
→ Verify your sender email in SendGrid (Step 4)

### "Cannot find module '@sendgrid/mail'"
→ Run `cd functions && npm install @sendgrid/mail`

### Emails going to spam
→ Check spam folder, or configure SPF/DKIM in SendGrid

### Check function logs
```bash
firebase functions:log
```

---

## Alternative: Skip Cloud Functions (Manual Approach)

If you don't want to set up Cloud Functions right now, you could:

1. **Use a third-party service:**
   - Zapier: Trigger emails from Firestore changes
   - Make.com (Integromat): Similar to Zapier
   - n8n: Self-hosted automation

2. **Send emails from your frontend** (not recommended):
   - Use EmailJS or similar
   - Less secure (API keys exposed)
   - Can't trigger on server-side events

---

## Cost Estimate

**Free Tier (SendGrid):**
- 100 emails/day = 3,000/month
- Perfect for small teams

**Firebase Costs (typical usage):**
- 10 users signing up/day = 300 emails/month
- 20 project invitations/day = 600 emails/month
- Total: 900 emails/month = **FREE** ✅

**If you exceed free tier:**
- Cloud Functions: First 2M invocations free, then $0.40/million
- Estimated: **$1-5/month** for moderate usage

---

## Ready to Set This Up?

Follow the steps above, and your users will start receiving:
- 🎉 Welcome emails when they sign up
- 📧 Invitation emails when added to projects
- 📊 Beautiful HTML-formatted emails

Need help? Check the full `EMAIL_SETUP.md` guide for more details!

