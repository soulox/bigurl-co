# BigURL SaaS - Quick Deployment Guide

## What's New 🎉

Your URL shortener is now a **complete SaaS application** with:

✅ **User Authentication** (Email/Password + Google OAuth)  
✅ **3 Subscription Tiers** (Free: 5 links, Basic: 20 links, Pro: 100 links)  
✅ **Email Integration** (Welcome emails, contact form via Mailgun)  
✅ **Pricing Page** with beautiful plan comparison  
✅ **FAQ Page** with common questions  
✅ **Contact Page** with email form  
✅ **Settings Page** for account & subscription management  
✅ **Per-User Dashboards** (users only see their own links)  
✅ **Usage Limits** enforced based on plan  
✅ **Beautiful Confirmation Dialogs** (replaced browser alerts)

## Deploy on Your Ubuntu Server

### Step 1: Pull Latest Code

```bash
cd /home/support/bigurl-co
git pull origin main
```

### Step 2: Set Environment Variables

Create a `.env` file in the project root:

```bash
nano .env
```

Add these variables (customize the values):

```env
# IMPORTANT: Change these secrets!
JWT_SECRET=your-random-32-character-secret-key-here
NEXTAUTH_SECRET=another-random-32-character-secret

# Your domain
NEXT_PUBLIC_API_URL=https://stage.bigurl.co
NEXT_PUBLIC_APP_URL=https://stage.bigurl.co

# Google OAuth (optional - get from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Mailgun (optional - get from Mailgun dashboard)
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=mg.yourdomain.com
FROM_EMAIL="BigURL <noreply@yourdomain.com>"
ADMIN_EMAIL=admin@yourdomain.com
```

**Generate secure secrets:**
```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate NEXTAUTH_SECRET
openssl rand -base64 32
```

### Step 3: Install New Dependencies

```bash
# Install frontend dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..
```

### Step 4: Rebuild Everything

```bash
# Stop services
docker compose down

# Remove old images to force rebuild
docker rmi bigurl/server bigurl/next

# Rebuild and start
docker compose up -d --build

# Watch the build
docker compose logs -f
```

### Step 5: Verify Deployment

```bash
# Check services are running
docker compose ps

# Test health endpoint
curl http://localhost:3000/health

# Test the site
curl http://localhost
```

## First Steps After Deployment

### 1. Create Your First User

Visit `https://stage.bigurl.co/auth/signin` and click "Don't have an account? Sign up"

### 2. Explore New Pages

- **Pricing**: `https://stage.bigurl.co/pricing`
- **FAQ**: `https://stage.bigurl.co/faq`
- **Contact**: `https://stage.bigurl.co/contact`
- **Settings**: `https://stage.bigurl.co/settings` (when logged in)

### 3. Test Features

1. **Sign Up** - Create a new account
2. **Create Links** - Try creating links (you'll have 5 on the free plan)
3. **Hit the Limit** - Try creating a 6th link to see the upgrade prompt
4. **Upgrade** - Go to Settings and upgrade to Basic or Pro
5. **Delete Links** - Try the new beautiful confirmation dialogs
6. **Contact Form** - Test the contact form

## Optional: Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select project
3. Enable **Google+ API**
4. Create OAuth 2.0 credentials
5. Add redirect URI: `https://stage.bigurl.co/api/auth/callback/google`
6. Update `.env` with Client ID and Secret
7. Rebuild: `docker compose up -d --build`

## Optional: Set Up Mailgun

1. Sign up at [Mailgun](https://www.mailgun.com/)
2. Add your domain
3. Verify domain (add DNS records)
4. Get API key from Settings
5. Update `.env` with credentials
6. Rebuild: `docker compose up -d --build`

## How It Works Now

### User Flow

1. **New User** → Signs up (free plan, 5 links)
2. **Creates Links** → Limited by their plan
3. **Hits Limit** → Prompted to upgrade
4. **Upgrades** → Gets more link capacity
5. **Manages Links** → Only sees their own links in dashboard

### Multi-Tenancy

- Each user has their own isolated links
- Users can only view/edit/delete their own links
- Anonymous user created for existing links (email: `anonymous@bigurl.co`)

### Authentication

- JWT tokens (7-day expiry)
- Stored in localStorage
- Included in all API requests
- Auto-redirect to sign-in if expired

## Migration Notes

### Existing Links

All your existing 100+ links are now owned by an "anonymous user" with unlimited quota. They will continue to work perfectly.

To transfer them to a real user:
1. Update the database manually, or
2. Leave them as-is (they still redirect fine)

### Database Changes

The migration will:
- Create `users` table
- Add `user_id` column to `links` table
- Create anonymous user for existing links
- No data loss!

## Troubleshooting

### "Unauthorized" Errors

- Check `JWT_SECRET` is set in server environment
- Verify token in browser's localStorage
- Try signing out and signing in again

### Google OAuth Not Working

- Verify redirect URI matches exactly
- Check Client ID/Secret in environment
- Make sure Google+ API is enabled

### Emails Not Sending

- Check Mailgun API key is correct
- Verify Mailgun domain is verified (DNS records)
- Check server logs: `docker compose logs server`

### Can't Create Links

- Sign in first (authentication now required)
- Check if you've hit your plan limit
- Try upgrading your plan

## Important Files

- `SAAS_SETUP_GUIDE.md` - Complete technical documentation
- `env.example` - Environment variable template
- `server/src/auth.ts` - JWT authentication logic
- `server/src/email.ts` - Email sending functions
- `src/lib/auth.ts` - NextAuth configuration
- `src/app/auth/signin/page.tsx` - Sign in/up page
- `src/app/pricing/page.tsx` - Pricing page
- `src/app/settings/page.tsx` - User settings

## Quick Commands

```bash
# Update and restart
cd /home/support/bigurl-co
git pull origin main
docker compose up -d --build

# View logs
docker compose logs -f

# Clear Nginx cache (if needed)
docker compose exec nginx rm -rf /var/cache/nginx/*

# Check database
docker compose exec server sh
sqlite3 /data/links.db
SELECT * FROM users;
.exit
exit
```

## Support

See `SAAS_SETUP_GUIDE.md` for detailed technical documentation.

---

**Enjoy your new SaaS application! 🚀**

