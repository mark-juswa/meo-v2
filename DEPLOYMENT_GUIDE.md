# Deployment Guide for MEO Online Services

## Environment Variables for Production

Update your `.env` file (or environment variables on your hosting platform) with these values:

### Required Environment Variables

```env
# Database
MONGODB_URI=your_production_mongodb_connection_string

# JWT Secrets (use strong random strings)
JWT_SECRET=your_strong_jwt_secret_here
JWT_REFRESH_SECRET=your_strong_refresh_secret_here

# Email Configuration
EMAIL_USERNAME=your_gmail@gmail.com
EMAIL_PASSWORD=your_gmail_app_password

# CLIENT URL - IMPORTANT FOR EMAILS!
CLIENT_URL=https://your-production-domain.com
# Example: CLIENT_URL=https://svmeo-online-services.onrender.com

# Server Configuration
PORT=5000
NODE_ENV=production
```

## Important Notes

### 1. CLIENT_URL Configuration

**DO NOT REMOVE `CLIENT_URL`** - It's essential for:
- Email verification links after user registration
- Password reset links for forgotten passwords

**Development:**
```env
CLIENT_URL=http://localhost:5173
```

**Production:**
```env
CLIENT_URL=https://your-actual-production-domain.com
```

### 2. CORS Origins

Make sure the `CLIENT_URL` matches one of the allowed origins in `backend/server.js`:
```javascript
cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://svmeo-online-services.onrender.com"  // Your production URL
  ],
  credentials: true,
})
```

### 3. Email Setup

For Gmail:
1. Enable 2-Factor Authentication
2. Generate an App Password (not your regular password)
3. Use the App Password for `EMAIL_PASSWORD`

## Deployment Steps

### 1. Build the Frontend
```bash
npm run build
```

### 2. Set Environment Variables
On your hosting platform (Render, Heroku, etc.), set all the environment variables listed above.

### 3. Update CORS
Add your production domain to the CORS allowed origins in `backend/server.js`.

### 4. Deploy
Deploy your application to your hosting platform.

### 5. Test Email Functionality
- Register a new user
- Verify the email link points to your production domain
- Test password reset

## Common Issues

### ❌ Email links point to localhost
**Problem:** `CLIENT_URL` is not set or still pointing to localhost
**Solution:** Update `CLIENT_URL` to your production domain

### ❌ CORS errors
**Problem:** Production domain not in allowed origins
**Solution:** Add your domain to the `cors` configuration in `backend/server.js`

### ❌ Email not sending
**Problem:** Invalid Gmail credentials or App Password not used
**Solution:** Use Gmail App Password, not your regular password
