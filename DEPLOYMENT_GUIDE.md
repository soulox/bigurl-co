# Deployment Guide for New Features

This guide will help you deploy the new analytics, QR code, and link management features.

## Prerequisites

- Cloudflare account with:
  - D1 database created
  - KV namespace created
  - Analytics Engine enabled
  - Workers enabled

## Step 1: Database Schema

The database schema is already defined in `workers/src/db/schema.sql`. If you haven't run it yet, or need to verify:

```bash
# Apply the schema to your D1 database
wrangler d1 execute bigurl_db --file=workers/src/db/schema.sql

# Or if you need to update an existing database, the schema is backward compatible
# All new columns have defaults or allow NULL
```

The schema includes:
- `links` table with all necessary columns (title, description, expires_at, max_clicks, etc.)
- `clicks` table with detailed analytics columns
- Proper indexes for performance

## Step 2: Install Dependencies

Install the new QR code package:

```bash
npm install
```

This will install `qrcode.react` which is needed for QR code generation.

## Step 3: Configure Wrangler

Ensure your `workers/wrangler.toml` is properly configured:

```toml
name = "bigurl-workers"
main = "src/index.ts"
compatibility_date = "2024-10-01"

[[d1_databases]]
binding = "DB"
database_name = "bigurl_db"
database_id = "YOUR_D1_DATABASE_ID"  # Replace with your actual ID

[[kv_namespaces]]
binding = "KV"
id = "YOUR_KV_NAMESPACE_ID"  # Replace with your actual ID

[[analytics_engine_datasets]]
binding = "ANALYTICS"
```

## Step 4: Test Locally

Test the workers locally:

```bash
cd workers
npm run dev
```

Test the Next.js frontend:

```bash
npm run dev
```

Visit:
- Homepage: http://localhost:3000
- Dashboard: http://localhost:3000/dashboard

## Step 5: Deploy Workers

Deploy the updated workers with new API endpoints:

```bash
cd workers
npm run deploy
```

This deploys:
- Updated redirect logic with expiration/max clicks checking
- Enhanced analytics tracking
- New API endpoints:
  - GET `/api/analytics/:code`
  - GET `/api/links`
  - GET `/api/links/:id`
  - PUT `/api/links/:id`
  - DELETE `/api/links/:id`
  - POST `/api/links/bulk-delete`
  - POST `/api/links/bulk-update`
  - GET `/api/qr/:code`

## Step 6: Deploy Frontend

Deploy the Next.js application:

```bash
npm run build
npm run deploy
```

Or if using Cloudflare Pages:

```bash
# The build output will be in .vercel/output or .next depending on your setup
# Follow your usual deployment process
```

## Step 7: Verify Deployment

### Test Analytics
1. Create a short link
2. Click it a few times (use different browsers/devices if possible)
3. Go to Dashboard → Click analytics icon
4. Verify you see click data, countries, devices, etc.

### Test QR Codes
1. Create or view a short link
2. Click the QR code button
3. Verify QR code appears
4. Test download functionality

### Test Link Management
1. Go to Dashboard
2. Create multiple links
3. Test selection and bulk operations
4. Test individual delete/view analytics

### Test Expiration & Max Clicks
1. Create a link with expiration (e.g., 1 day)
2. Create a link with max clicks (e.g., 3)
3. Click the max clicks link until it's disabled
4. Verify proper error messages

## Troubleshooting

### Issue: Database errors
**Solution:** Ensure schema is applied to D1 database. Run the schema file again - it uses `IF NOT EXISTS` so it's safe.

### Issue: Analytics not showing
**Solution:** 
- Verify Analytics Engine is enabled in Cloudflare dashboard
- Check that the `ANALYTICS` binding is in wrangler.toml
- Wait a few minutes - Analytics Engine can have a slight delay

### Issue: QR codes not generating
**Solution:**
- Verify `qrcode.react` is installed
- Check browser console for errors
- The component uses SVG rendering which should work in all modern browsers

### Issue: Links not appearing in dashboard
**Solution:**
- Check that workers deployment was successful
- Verify the API proxy route in Next.js is working
- Check browser network tab for API call errors
- Ensure D1 database binding is correct

### Issue: Bulk operations not working
**Solution:**
- Ensure you're selecting links with checkboxes
- Check browser console for errors
- Verify workers API is deployed and accessible

## Environment Variables

If you're deploying to different environments, you may need to set:

```bash
# For development
NEXT_PUBLIC_API_URL=http://localhost:8787

# For production (usually not needed as it uses relative URLs)
# NEXT_PUBLIC_API_URL=https://your-worker.workers.dev
```

## Database Migrations

If you have existing data and the schema was updated:

```bash
# Backup your database first!
wrangler d1 backup create bigurl_db

# Then apply schema (it's designed to be idempotent)
wrangler d1 execute bigurl_db --file=workers/src/db/schema.sql
```

## Performance Optimization

### KV Cache
The application uses KV for caching redirects with a 1-hour TTL. This is automatically managed.

### Analytics Engine
Analytics are written asynchronously using `waitUntil()` so they don't slow down redirects.

### Database Indexes
The schema includes indexes on:
- `short_code` (for fast lookups)
- `user_id` (for future multi-user support)
- `created_at` (for sorting)
- `link_id` in clicks table (for analytics queries)

## Monitoring

After deployment, monitor:

1. **Workers Analytics** (Cloudflare dashboard)
   - Request success rate
   - Response times
   - Error rates

2. **D1 Database Usage**
   - Query performance
   - Storage usage

3. **KV Usage**
   - Read/write operations
   - Cache hit rate

4. **Analytics Engine Usage**
   - Data points written
   - Query performance

## Next Steps

Consider implementing:
- Rate limiting on API endpoints
- User authentication
- Custom domains
- Link folders/categories
- API keys for programmatic access
- Webhook notifications
- Export analytics to CSV

## Support

If you encounter issues:
1. Check Cloudflare Workers logs: `wrangler tail`
2. Check browser console for frontend errors
3. Verify all bindings in wrangler.toml
4. Ensure all environment variables are set
5. Review the FEATURES.md document for usage examples

---

**Deployment Checklist:**

- [ ] Database schema applied
- [ ] Dependencies installed
- [ ] Wrangler.toml configured with correct IDs
- [ ] Workers deployed successfully
- [ ] Frontend built and deployed
- [ ] Analytics tested and working
- [ ] QR codes generating properly
- [ ] Dashboard accessible
- [ ] Bulk operations working
- [ ] Expiration/max clicks tested
- [ ] Monitoring set up

Congratulations! Your enhanced URL shortener is now live! 🎉

