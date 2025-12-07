# SendGrid Setup Guide for MEO System

## ⚠️ Why SendGrid?
Render blocks all SMTP ports (25, 465, 587) to prevent spam. SendGrid uses HTTP API and works perfectly on cloud platforms.

## 🚀 Quick Setup (5 minutes)

### Step 1: Create SendGrid Account
1. Go to https://sendgrid.com/
2. Click "Start for Free"
3. Sign up with your email
4. Verify your email address

### Step 2: Verify Sender Identity
1. After login, go to **Settings → Sender Authentication**
2. Click **Verify a Single Sender**
3. Fill in your details:
   - **From Name**: MEO San Vicente
   - **From Email Address**: meo.sanvicente@gmail.com
   - **Reply To**: meo.sanvicente@gmail.com
   - **Company Address**: San Vicente, Palawan
   - **Nickname**: MEO System
4. Click **Create**
5. Check your email (meo.sanvicente@gmail.com) for verification link
6. Click the verification link
7. ✅ Sender verified!

### Step 3: Create API Key
1. Go to **Settings → API Keys**
2. Click **Create API Key**
3. Name: `MEO System Email`
4. Permissions: **Full Access** (or at least "Mail Send")
5. Click **Create & View**
6. **COPY THE API KEY NOW** (you can only see it once!)
   - It looks like: `SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Step 4: Add to Render Environment Variables
1. Go to your Render dashboard
2. Select your backend service
3. Go to **Environment** tab
4. Add these environment variables:
   ```
   SENDGRID_API_KEY=SG.your_actual_api_key_here
   SENDGRID_FROM_EMAIL=meo.sanvicente@gmail.com
   ```
5. Click **Save Changes**
6. Render will automatically redeploy

### Step 5: Deploy Code Changes
1. Commit the changes:
   ```bash
   git add .
   git commit -m "Switch to SendGrid for email (Render blocks SMTP)"
   git push
   ```
2. Render will auto-deploy (or deploy manually in dashboard)

### Step 6: Test
1. Register a new account
2. Check Render logs for:
   ```
   ✅ SendGrid - SMTP connection verified successfully!
   ✅ SendGrid - Verification email sent successfully
   ```
3. Check your email inbox (or spam folder)
4. Click verification link
5. ✅ Account verified!

## 📋 Environment Variables Summary

### Required Variables:
```
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=meo.sanvicente@gmail.com
CLIENT_URL=https://meo-sv.onrender.com
```

### Optional (old Gmail vars - can keep or remove):
```
EMAIL_USERNAME=meo.sanvicente@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
```

## 🎯 SendGrid Free Tier Limits
- ✅ 100 emails per day (forever free)
- ✅ Perfect for development and small production
- ✅ If you need more, paid tiers start at $15/month for 40,000 emails

## 🔍 Troubleshooting

### Error: "SendGrid configuration missing"
**Solution:** Check that SENDGRID_API_KEY is set in Render environment variables

### Error: "From email is not verified"
**Solution:** Complete Step 2 (Verify Sender Identity) and check verification email

### Error: "Invalid API key"
**Solution:** 
1. Make sure you copied the full API key (starts with SG.)
2. Create a new API key in SendGrid
3. Update SENDGRID_API_KEY in Render

### Emails going to spam
**Solution:**
1. This is normal initially
2. Users should mark as "Not Spam"
3. For better deliverability, verify a custom domain in SendGrid

### Need to send from custom domain (e.g., noreply@meo-sanvicente.gov.ph)
**Solution:**
1. Go to SendGrid → Settings → Sender Authentication
2. Click "Authenticate Your Domain"
3. Follow DNS setup instructions
4. Update SENDGRID_FROM_EMAIL to your custom domain email

## 📊 Monitoring Emails

### View Sent Emails
1. Go to SendGrid dashboard
2. Click **Activity** in left menu
3. See all sent emails, deliveries, bounces, opens, clicks

### Check Delivery Issues
1. Go to **Activity**
2. Filter by status: Delivered, Bounced, Dropped
3. Click on an email to see detailed logs

## ✅ Advantages Over Gmail

| Feature | Gmail SMTP | SendGrid |
|---------|-----------|----------|
| Works on Render | ❌ No (ports blocked) | ✅ Yes |
| Daily limit | 500 emails | 100 (free tier) |
| Setup time | 2 minutes | 5 minutes |
| Deliverability | Good | Excellent |
| Analytics | None | Full dashboard |
| Custom domain | No | Yes (optional) |
| Cloud-friendly | ❌ No | ✅ Yes |

## 🔄 Switching Back to Gmail (If Needed)

If you want to switch back to Gmail later (e.g., if Render unblocks ports):

1. Change import in `authController.js`:
   ```javascript
   import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/sendEmail.js';
   ```

2. Make sure Gmail environment variables are set:
   ```
   EMAIL_USERNAME=meo.sanvicente@gmail.com
   EMAIL_PASSWORD=your-16-char-app-password
   ```

## 📞 Support

If you have issues:
1. Check Render logs for detailed error messages
2. Check SendGrid Activity dashboard
3. Verify all environment variables are set correctly
4. Make sure sender email is verified in SendGrid

## 🎉 Done!

Once you complete the setup, your system will send emails reliably through SendGrid!
