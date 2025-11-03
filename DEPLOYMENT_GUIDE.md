# Deployment Guide for New Features

This guide will help you deploy the new analytics, QR code, and link management features to your self-hosted server.

## Prerequisites

- Docker and Docker Compose installed
- Your server with nginx configured
- Node.js 20+ (for local development)

## Step 1: Database Schema

The database schema is automatically applied when the server starts! The `DataStore` class in `server/src/db.ts` uses `CREATE TABLE IF NOT EXISTS`, so:

- **New installations**: Tables will be created automatically
- **Existing installations**: New columns will be added automatically using SQLite's `ALTER TABLE` compatibility

The schema includes:
- `links` table with all necessary columns (title, description, expires_at, max_clicks, etc.)
- `clicks` table with detailed analytics columns  
- Proper indexes for performance
- Foreign key constraints with CASCADE delete

## Step 2: Install Dependencies

Install the new QR code package:

```bash
npm install
```

This will install `qrcode.react` which is needed for QR code generation.

## Step 3: Review Configuration

Your `docker-compose.yml` is already set up correctly. The server will use:

- **SQLite database**: Stored in `/data/links.db` (persisted via Docker volume)
- **LRU Cache**: In-memory cache for fast redirects (100k items, 1-hour TTL)
- **Port 3000**: Backend server port
- **Port 3001**: Next.js frontend port  
- **Ports 80/443**: Nginx reverse proxy

No additional configuration needed!

## Step 4: Build Server

Build the TypeScript server:

```bash
cd server
npm install
npm run build
cd ..
```

Build the Next.js frontend:

```bash
npm install
npm run build
```

## Step 5: Deploy with Docker

Deploy using Docker Compose:

```bash
# Build and start all services
docker compose up -d --build

# Check logs
docker compose logs -f

# Verify services are running
docker compose ps
```

This deploys:
- **server**: Node.js backend with all new API endpoints
  - GET `/api/analytics/:code` - Get link analytics
  - GET `/api/links` - List all links
  - GET `/api/links/:id` - Get single link
  - PUT `/api/links/:id` - Update link
  - DELETE `/api/links/:id` - Delete link
  - POST `/api/links/bulk-delete` - Bulk delete
  - POST `/api/links/bulk-update` - Bulk update
  - GET `/api/qr/:code` - QR code data
- **next**: Next.js frontend with dashboard
- **nginx**: Reverse proxy with caching

## Step 6: Access the Application

After deployment, access your application:

- **HTTP**: http://your-domain.com
- **HTTPS**: https://your-domain.com (after SSL setup)

The nginx reverse proxy routes:
- `/` → Next.js frontend (port 3001)
- `/api/*` → Backend server (port 3000)
- `/:code` → Backend server for redirects (port 3000)

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

## Step 7: (Optional) Enable GeoIP in Nginx

For country/city tracking, you can enable nginx GeoIP module:

```bash
# Install GeoIP module
apt-get install nginx-module-geoip geoip-database

# Add to nginx config
load_module modules/ngx_http_geoip_module.so;

http {
    geoip_country /usr/share/GeoIP/GeoIP.dat;
    geoip_city /usr/share/GeoIP/GeoIPCity.dat;
    
    # Set headers for backend
    proxy_set_header X-GeoIP-Country $geoip_country_code;
    proxy_set_header X-GeoIP-City $geoip_city;
}
```

## Troubleshooting

### Issue: Database errors
**Solution:** The schema is auto-applied. If you have issues:
```bash
# Check database file
docker compose exec server ls -lh /data/
# Restart server to reinitialize
docker compose restart server
```

### Issue: Analytics not showing
**Solution:**
- Wait for some clicks to be tracked first
- Check server logs: `docker compose logs server`
- Verify clicks are being inserted: Check SQLite database
- Analytics are tracked asynchronously - may take a few seconds

### Issue: QR codes not generating
**Solution:**
- Verify `qrcode.react` is installed
- Check browser console for errors
- The component uses SVG rendering which should work in all modern browsers

### Issue: Links not appearing in dashboard
**Solution:**
- Check that all containers are running: `docker compose ps`
- Verify backend is accessible: `curl http://localhost:3000/health`
- Check browser network tab for API call errors
- Review nginx logs: `docker compose logs nginx`
- Ensure the proxy configuration in nginx is correct

### Issue: Bulk operations not working
**Solution:**
- Ensure you're selecting links with checkboxes
- Check browser console for errors
- Verify backend API is responding: `curl http://localhost:3000/api/links`

### Issue: Port conflicts
**Solution:**
```bash
# Check if ports are already in use
netstat -tulpn | grep -E ':(80|443|3000|3001)'

# Change ports in docker-compose.yml if needed
# Then restart
docker compose down
docker compose up -d
```

## Database Backup

To backup your SQLite database:

```bash
# Create backup
docker compose exec server sqlite3 /data/links.db ".backup '/data/links-backup.db'"

# Or copy from volume
docker compose exec server cp /data/links.db /data/links-backup-$(date +%Y%m%d).db

# Download backup to host
docker cp bigurl-server-1:/data/links-backup.db ./backups/
```

You can also use the provided backup script:
```bash
./scripts/backup-db.sh
```

## Performance Optimization

### LRU Cache
The server uses an in-memory LRU cache:
- **Capacity**: 100,000 entries
- **TTL**: 1 hour
- **Invalidation**: Automatic on link updates/deletes

### Nginx Caching
Nginx caches redirects with `proxy_cache`:
- Reduces database load
- Sub-millisecond response times
- Configured in `nginx/conf.d/app.conf`

### Database Indexes
The schema includes indexes on:
- `short_code` (for fast redirect lookups)
- `created_at` (for sorting in dashboard)
- `link_id` in clicks table (for analytics queries)

### SQLite Performance
- **WAL mode**: Enabled for better concurrency
- **In-memory temp store**: For faster queries
- **Foreign keys**: Enforce data integrity

## Monitoring

After deployment, monitor:

1. **Docker Container Health**
   ```bash
   docker compose ps
   docker compose logs -f
   docker stats
   ```

2. **Server Performance**
   ```bash
   # Check server logs
   docker compose logs server
   
   # Check nginx access logs
   docker compose logs nginx | grep "GET /"
   
   # Monitor container resources
   docker stats
   ```

3. **Database Size**
   ```bash
   docker compose exec server ls -lh /data/
   docker compose exec server sqlite3 /data/links.db "SELECT COUNT(*) FROM links"
   docker compose exec server sqlite3 /data/links.db "SELECT COUNT(*) FROM clicks"
   ```

4. **Application Health**
   - Health endpoint: http://your-domain.com/health
   - Should return `{"status":"ok"}`

## Next Steps

Consider implementing:
- Rate limiting on API endpoints
- User authentication
- Custom domains
- Link folders/categories
- API keys for programmatic access
- Webhook notifications
- Export analytics to CSV

## Local Development

For local development without Docker:

```bash
# Terminal 1: Start backend
cd server
npm install
npm run dev

# Terminal 2: Start frontend
npm install
npm run dev

# Access at:
# - Frontend: http://localhost:3000
# - Backend: http://localhost:3000 (proxied by Next.js)
```

## SSL/HTTPS Setup

Follow the existing guide in `docs/DEPLOY.md` for SSL certificate setup with Let's Encrypt.

## Support

If you encounter issues:
1. Check container logs: `docker compose logs -f`
2. Check browser console for frontend errors
3. Verify all containers are running: `docker compose ps`
4. Test backend directly: `curl http://localhost:3000/health`
5. Review the FEATURES.md document for usage examples

---

**Deployment Checklist:**

- [ ] Dependencies installed (server + frontend)
- [ ] Server built successfully
- [ ] Frontend built successfully
- [ ] Docker images built
- [ ] All containers running
- [ ] Database auto-created and accessible
- [ ] Analytics tested and working
- [ ] QR codes generating properly
- [ ] Dashboard accessible
- [ ] Bulk operations working
- [ ] Expiration/max clicks tested
- [ ] Nginx properly routing requests
- [ ] SSL certificates configured (optional)
- [ ] Backups configured

Congratulations! Your enhanced URL shortener is now live on your server! 🎉

