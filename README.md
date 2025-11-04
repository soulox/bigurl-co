# BigURL - Modern URL Shortener

A fast, scalable URL shortener built with Next.js, Hono, and SQLite. Features custom short codes, caching, and analytics.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/templates/tree/main/next-starter-template)

## Features

- ⚡ **Fast redirects** - Cached at multiple levels (Nginx, in-memory LRU, SQLite WAL)
- 🎯 **Custom slugs** - Choose your own short codes
- 📊 **Analytics ready** - Track clicks, referrers, and geo data (coming soon)
- 🔒 **Rate limited** - Built-in protection against abuse
- 🐳 **Docker ready** - Full stack with Nginx, Next.js, and Hono API
- 🌐 **Edge deployable** - Alternative Cloudflare Workers implementation included

## Architecture

```
┌─────────┐     ┌───────┐     ┌──────────┐     ┌────────┐
│ Browser │ ──> │ Nginx │ ──> │ Next.js  │ ──> │ Server │
│         │     │       │     │ Frontend │     │ (Hono) │
└─────────┘     └───────┘     └──────────┘     └────────┘
                    │                               │
                    │          Redirects            │
                    └───────────────────────────────┘
                                                    │
                                              ┌──────────┐
                                              │ SQLite   │
                                              │ Database │
                                              └──────────┘
```

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

### Docker Deployment

```bash
# Build and start all services
docker compose up -d --build

# View logs
docker compose logs -f

# Check health
curl http://localhost/health
```

### Production (with SSL)

```bash
# Deploy to staging
DOMAIN=stage.bigurl.co EMAIL=admin@example.com bash scripts/deploy-stage.sh

# The script will:
# - Configure Nginx with your domain
# - Issue Let's Encrypt SSL certificate
# - Start all services
```

## API

### Shorten URL

```bash
POST /api/shorten
Content-Type: application/json

{
  "url": "https://example.com/very/long/url",
  "customSlug": "mylink"  # optional
}

# Response
{
  "id": "uuid",
  "shortCode": "mylink",
  "shortUrl": "https://bigurl.co/mylink"
}
```

### Redirect

```bash
GET /:code
# Returns 301 redirect to original URL
```

## Configuration

### Environment Variables

**Server (Hono API)**
- `PORT` - Server port (default: 3000)
- `DB_PATH` - SQLite database path (default: /data/links.db)

**Next.js Frontend**
- `WORKER_BASE_URL` - Backend API URL (default: http://server:3000)

### Rate Limits (Nginx)

- **API endpoints**: 10 requests/second per IP (burst: 20)
- **Redirects**: 100 requests/second per IP (burst: 50)

Adjust in `nginx/conf.d/app.conf`:
```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
```

## Database Backups

### Manual Backup

```bash
# Backup to ./backups/
bash scripts/backup-db.sh

# Backup to custom location
bash scripts/backup-db.sh /path/to/backups
```

### Automated Backups (Cron)

```bash
# Setup daily backups at 2 AM
bash scripts/setup-backup-cron.sh
```

Backups are stored with timestamps and automatically cleaned up (keeps last 30 by default).

## Monitoring

### Health Checks

```bash
# Overall health
curl http://localhost/health

# Server container
docker exec bigurl-co-server-1 wget -qO- http://localhost:3000/health

# Next.js container
docker exec bigurl-co-next-1 wget -qO- http://localhost:3000
```

### Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f nginx
docker compose logs -f server
docker compose logs -f next
```

### Nginx Cache Stats

Check response headers for cache status:
```bash
curl -I http://localhost/api/shorten
# X-Cache-Status: HIT | MISS | BYPASS
```

## Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling

### Backend
- **Hono** - Fast web framework for Node.js
- **better-sqlite3** - SQLite with WAL mode
- **LRU Cache** - In-memory caching layer

### Infrastructure
- **Nginx** - Reverse proxy, SSL termination, caching
- **Docker Compose** - Container orchestration
- **Let's Encrypt** - Free SSL certificates

### Alternative: Cloudflare Workers
- See `workers/` directory for edge deployment
- Uses Cloudflare D1 (SQLite), KV, and Analytics Engine

## Project Structure

```
.
├── src/                    # Next.js frontend
│   ├── app/               # App router pages
│   ├── components/        # React components
│   └── lib/               # Utilities
├── server/                # Hono backend API
│   ├── src/
│   │   ├── index.ts      # Main server
│   │   ├── db.ts         # Database layer
│   │   └── util.ts       # Helpers
│   └── Dockerfile
├── nginx/                 # Nginx configuration
│   └── conf.d/
├── scripts/               # Deployment & backup scripts
├── workers/               # Cloudflare Workers version
└── docker-compose.yml     # Service orchestration
```

## Performance

- **Redirects**: ~10ms average (cached)
- **API**: ~50ms average (includes database write)
- **Caching**: 3-tier (Nginx → LRU → SQLite)
- **Concurrent**: Handles 1000+ req/s per core

## Security

- ✅ Rate limiting per IP
- ✅ Input validation (URL protocol check)
- ✅ SQLite prepared statements (SQL injection protection)
- ✅ CORS configured
- ⚠️ No authentication (anyone can create links)
- ⚠️ No URL blacklist (phishing/malware check needed)

## Roadmap

- [ ] User authentication & accounts
- [ ] Analytics dashboard (clicks, referrers, geo)
- [ ] QR code generation
- [ ] Link expiration & max clicks
- [ ] Custom domains
- [ ] Bulk operations
- [ ] URL blacklist/whitelist
- [ ] CAPTCHA for public shortening

## Contributing

Contributions welcome! Please:
1. Fork the repo
2. Create a feature branch
3. Add tests if applicable
4. Submit a pull request

## License

MIT

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/bigurl-co/issues)
- **Docs**: See `docs/` directory
- **Email**: admin@bigurl.co
