# 🚨 IMPORTANT: Server Deployment Guide

## What to Use for Server Deployment

Your application is **self-hosted on your server**, NOT deployed to Cloudflare Workers. Here's what's relevant:

### ✅ USE THESE FILES

#### Server Backend
- `server/src/index.ts` - Main server with all API endpoints
- `server/src/db.ts` - Database layer with SQLite
- `server/src/util.ts` - Utility functions
- `server/package.json` - Server dependencies
- `server/tsconfig.json` - TypeScript config

#### Frontend
- `src/` - All frontend files (Next.js app)
- `package.json` - Frontend dependencies
- `next.config.ts` - Next.js configuration

#### Infrastructure
- `docker-compose.yml` - Service orchestration
- `nginx/conf.d/*.conf` - Nginx configuration
- `Dockerfile` - Frontend container
- `server/Dockerfile` - Backend container

#### Documentation
- `DEPLOYMENT_GUIDE.md` - **Start here for deployment**
- `SERVER_IMPLEMENTATION.md` - Technical details
- `FEATURES.md` - Feature documentation
- `API_DOCUMENTATION.md` - API reference
- `docs/DEPLOY.md` - SSL/HTTPS setup

### ❌ IGNORE THESE FILES

These are for Cloudflare Workers deployment (not used):

- `workers/` - **Entire directory can be ignored**
- `workers/src/index.ts` - Old Cloudflare Workers code
- `workers/wrangler.toml` - Cloudflare configuration
- `workers/package.json` - Workers dependencies
- `wrangler.jsonc` - Cloudflare config

**Note**: The `workers` directory contains the original Cloudflare implementation. Your actual backend is in the `server` directory.

---

## 🚀 Quick Start for Deployment

1. **Install Dependencies**
   ```bash
   npm install
   cd server && npm install && npm run build && cd ..
   ```

2. **Deploy with Docker**
   ```bash
   docker compose up -d --build
   ```

3. **Verify Deployment**
   ```bash
   docker compose ps
   docker compose logs -f
   curl http://localhost:3000/health
   ```

4. **Access Application**
   - Frontend: http://your-domain.com
   - Dashboard: http://your-domain.com/dashboard
   - API: http://your-domain.com/api/*

---

## 📁 File Structure Overview

```
bigurl-co/
├── server/              ✅ Your backend (Node.js + Hono)
│   ├── src/
│   │   ├── index.ts    ✅ Main server with all endpoints
│   │   ├── db.ts       ✅ SQLite database layer
│   │   └── util.ts     ✅ Helper functions
│   └── package.json    ✅ Server dependencies
│
├── src/                 ✅ Your frontend (Next.js)
│   ├── app/            ✅ Pages and layouts
│   ├── components/     ✅ React components
│   ├── lib/            ✅ API client
│   └── types/          ✅ TypeScript types
│
├── nginx/              ✅ Reverse proxy config
│   └── conf.d/
│
├── docker-compose.yml  ✅ Service orchestration
│
├── workers/            ❌ IGNORE (Cloudflare Workers)
│   └── ...             ❌ Not used for server deployment
│
└── docs/               ✅ Deployment guides
    ├── DEPLOYMENT_GUIDE.md      ✅ Main guide
    └── SERVER_IMPLEMENTATION.md ✅ Technical details
```

---

## 🔑 Key Differences from Cloudflare

| Feature | Cloudflare Workers | Your Server |
|---------|-------------------|-------------|
| **Backend** | `workers/src/index.ts` | `server/src/index.ts` |
| **Database** | D1 (remote SQLite) | SQLite (local file) |
| **Cache** | KV Namespace | LRU Cache (in-memory) |
| **Analytics** | Analytics Engine | SQLite clicks table |
| **Deployment** | `wrangler deploy` | `docker compose up` |
| **Config** | `wrangler.toml` | `docker-compose.yml` |
| **Location** | Edge (global) | Your server |

---

## 🔄 How Your Stack Works

```
User Request
     ↓
┌────────────────┐
│     Nginx      │  (Port 80/443)
│  Reverse Proxy │
└────┬─────┬─────┘
     │     │
     │     └──────→ Next.js Frontend (Port 3001)
     │              - Dashboard
     │              - QR code UI
     │              - Link management
     │
     └────────────→ Node.js Server (Port 3000)
                    - API endpoints
                    - Redirects
                    - Analytics
                    ↓
                  SQLite Database
                    - links table
                    - clicks table
```

---

## 📊 Database Location

Your SQLite database is stored at:
- **In container**: `/data/links.db`
- **On host**: Docker volume `server-data`

### Backup Database
```bash
# Using provided script
./scripts/backup-db.sh

# Or manually
docker compose exec server sqlite3 /data/links.db ".backup '/data/backup.db'"
```

---

## 🔧 Common Commands

### Development
```bash
# Server
cd server
npm run dev

# Frontend
npm run dev
```

### Production
```bash
# Build and start
docker compose up -d --build

# View logs
docker compose logs -f

# Restart service
docker compose restart server

# Stop all
docker compose down

# Update after code changes
docker compose up -d --build
```

### Database
```bash
# Check database
docker compose exec server sqlite3 /data/links.db "SELECT COUNT(*) FROM links"

# Backup
docker compose exec server sqlite3 /data/links.db ".backup '/data/backup.db'"

# Access SQLite shell
docker compose exec server sqlite3 /data/links.db
```

---

## ⚡ Performance

### Expected Performance
- **Redirect time**: < 10ms (with cache)
- **API response**: < 50ms
- **Dashboard load**: < 500ms
- **Analytics query**: < 100ms (for 1000 clicks)

### Optimization Tips
1. **nginx caching** is configured in `nginx/conf.d/app.conf`
2. **LRU cache** handles 100k short codes in memory
3. **SQLite WAL mode** allows concurrent reads
4. **Indexes** on all frequently queried columns

---

## 🎯 Your Implementation Summary

You have a **modern, self-hosted URL shortener** with:

✅ **Backend**: Node.js server (Hono framework)  
✅ **Database**: SQLite with WAL mode  
✅ **Cache**: In-memory LRU cache  
✅ **Frontend**: Next.js 15 with React 19  
✅ **Proxy**: Nginx with caching  
✅ **Analytics**: Full click tracking  
✅ **QR Codes**: Generation and download  
✅ **Dashboard**: Link management UI  
✅ **Docker**: Easy deployment

All running on **your server** with **full control** over your data!

---

## 📖 Next Steps

1. ✅ Review `DEPLOYMENT_GUIDE.md` for deployment steps
2. ✅ Run `docker compose up -d --build`
3. ✅ Access your app and test features
4. ✅ Set up SSL with Let's Encrypt (see `docs/DEPLOY.md`)
5. ✅ Configure backups with `./scripts/backup-db.sh`

---

## 🆘 Need Help?

1. Check logs: `docker compose logs -f`
2. Review `DEPLOYMENT_GUIDE.md` troubleshooting section
3. Test backend: `curl http://localhost:3000/health`
4. Check database: `docker compose exec server ls -lh /data/`

---

## 🎉 You're Ready!

Your enhanced URL shortener is fully implemented and ready to deploy. All the code is in place, TypeScript is properly typed, and the Docker setup is configured.

Just run `docker compose up -d --build` and you're live! 🚀

