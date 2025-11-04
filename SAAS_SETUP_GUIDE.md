# BigURL SaaS Setup Guide

This guide covers setting up BigURL as a complete SaaS application with authentication, subscriptions, and email integration.

## Features Implemented

### Authentication & User Management
- Email/password authentication
- Google OAuth integration
- JWT-based sessions
- User profiles
- Multi-tenant architecture (each user manages their own links)

### Subscription Tiers
- **Free**: 5 links
- **Basic**: 20 links ($9/month)
- **Pro**: 100 links ($29/month)

### Email Integration
- Welcome emails for new users
- Contact form submissions
- Password reset emails (when implemented)
- Powered by Mailgun

### New Pages
- `/auth/signin` - Sign in/sign up page
- `/pricing` - Pricing comparison page
- `/faq` - Frequently asked questions
- `/contact` - Contact form
- `/settings` - User account & subscription management
- `/dashboard` - Per-user link dashboard (now requires authentication)

## Setup Instructions

### 1. Install Dependencies

```bash
# Frontend dependencies
npm install

# Server dependencies
cd server
npm install
cd ..
```

### 2. Configure Environment Variables

Copy `env.example` to create your `.env` files:

**For the server** (create `server/.env`):
```env
PORT=3000
DB_PATH=./data/links.db
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=mg.yourdomain.com
FROM_EMAIL="BigURL <noreply@yourdomain.com>"
ADMIN_EMAIL=admin@yourdomain.com
```

**For Next.js** (create `.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-nextauth-secret-min-32-chars
GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
```

### 3. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Add authorized redirect URI: `http://localhost:3001/api/auth/callback/google` (or your production URL)
6. Copy Client ID and Secret to your `.env.local`

### 4. Set Up Mailgun

1. Sign up at [Mailgun](https://www.mailgun.com/)
2. Add and verify your domain
3. Get your API key from Settings → API Keys
4. Update `server/.env` with your credentials

### 5. Database Migration

The database will automatically create the new `users` table and add `user_id` to the `links` table on first run. Any existing links will be assigned to an "anonymous" user.

### 6. Build and Run

**Development:**
```bash
# Terminal 1: Run server
cd server
npm run dev

# Terminal 2: Run Next.js
npm run dev
```

**Production with Docker:**
```bash
docker compose up -d --build
```

## API Changes

### Authentication Required

Most API endpoints now require authentication. Include the JWT token in the Authorization header:

```javascript
headers: {
  'Authorization': `Bearer ${token}`
}
```

### New Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/google` - Handle Google OAuth
- `GET /api/auth/me` - Get current user info

#### User Management
- `POST /api/user/upgrade` - Change subscription plan
- `GET /api/user/stats` - Get user usage stats

#### Contact
- `POST /api/contact` - Submit contact form

### Modified Endpoints

#### Link Creation (now requires auth)
```javascript
POST /api/shorten
Headers: { Authorization: 'Bearer <token>' }
Body: {
  url: string,
  customSlug?: string,
  title?: string,
  description?: string,
  expiresAt?: number,
  maxClicks?: number
}

Response (403 if limit reached):
{
  error: 'Link limit reached',
  message: 'You've reached your limit of 5 links...',
  package: 'free',
  limit: 5
}
```

#### Link Management (now filtered by user)
- `GET /api/links` - Returns only current user's links
- `PUT /api/links/:id` - Update only if user owns link
- `DELETE /api/links/:id` - Delete only if user owns link
- `POST /api/links/bulk-delete` - Delete only owned links
- `POST /api/links/bulk-update` - Update only owned links

## Frontend Integration

### Storing Auth Token

The frontend stores the JWT token in localStorage:

```javascript
localStorage.setItem('auth_token', data.token);
localStorage.setItem('user', JSON.stringify(data.user));
```

### Making Authenticated Requests

All API calls in `src/lib/api.ts` now automatically include the auth token from localStorage.

### Protected Routes

Pages that require authentication (dashboard, settings) check for the token and redirect to `/auth/signin` if not found.

## Subscription Management

### Package Limits

- Free: 5 links
- Basic: 20 links
- Pro: 100 links

### Upgrading

Users can upgrade from Settings page or when they hit their limit. The system will:
1. Check current link count
2. Prevent downgrade if user has too many links
3. Update package and limit immediately
4. No payment processing (add Stripe/Paddle later if needed)

### Downgrading

Users must delete excess links before downgrading to a lower tier.

## Email Templates

Email templates are defined in `server/src/email.ts`. You can customize:
- Welcome email
- Contact form notification
- Password reset email (todo)

## Security Notes

1. **JWT Secret**: Use a strong, random secret (min 32 characters)
2. **Password Hashing**: Uses bcrypt with 10 salt rounds
3. **HTTPS**: Required for production (already configured in docker-compose)
4. **CORS**: Configured to allow frontend requests
5. **Rate Limiting**: Already configured in Nginx

## Production Deployment

Update your `docker-compose.yml` environment variables or create `.env` files for each service.

For production domains:
- `NEXT_PUBLIC_API_URL=https://yourdomain.com`
- `NEXT_PUBLIC_APP_URL=https://yourdomain.com`
- `NEXTAUTH_URL=https://yourdomain.com`

## Testing

### Create a Test User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### Create a Link (with auth)

```bash
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{"url":"https://example.com"}'
```

## Next Steps (Optional Enhancements)

1. **Payment Integration**: Add Stripe or Paddle for subscription payments
2. **Email Verification**: Add email verification flow
3. **Password Reset**: Implement forgot password flow
4. **2FA**: Add two-factor authentication
5. **Team Accounts**: Allow multiple users per account
6. **Custom Domains**: Let users use their own domains
7. **Webhooks**: Notify external services on link clicks
8. **API Keys**: Alternative to JWT for programmatic access

## Troubleshooting

### "Unauthorized" errors
- Check that JWT_SECRET is the same in server environment
- Verify token is being sent in Authorization header
- Check token hasn't expired (7-day expiry)

### Email not sending
- Verify Mailgun API key and domain
- Check Mailgun domain is verified
- Review server logs for email errors

### Google OAuth not working
- Verify redirect URI matches exactly
- Check Google Client ID/Secret are correct
- Ensure Google+ API is enabled

## Support

For issues or questions, contact support@bigurl.co or visit /contact

