# Quick Fix: Rebuild Everything

The dashboard is returning 410 because the server needs to be rebuilt. Here's the complete fix:

## Step 1: Rebuild Server (TypeScript)

```powershell
cd server
npm run build
cd ..
```

## Step 2: Rebuild and Restart Docker Containers

```powershell
# Stop everything
docker compose down

# Rebuild and start
docker compose up -d --build

# Watch the logs
docker compose logs -f
```

## Step 3: Verify It's Working

```powershell
# Test health endpoint
curl http://localhost:3000/health

# Test API (should work)
curl http://localhost:3000/api/links

# Now test in browser
# Go to: http://localhost (or your domain)
```

## If Docker Desktop Isn't Running

1. **Start Docker Desktop** application
2. Wait for it to fully start (whale icon in taskbar should be steady)
3. Then run the commands above

## Alternative: Development Mode

If Docker is being difficult, use dev mode to see the UI immediately:

```powershell
# Terminal 1: Backend
cd server
npm install
npm run dev

# Terminal 2: Frontend  
npm install
npm run dev
```

Then visit: `http://localhost:3000`

## Expected Result

After rebuild:
- ✅ Home page loads with new gradient design
- ✅ Dashboard works (no 410 error)
- ✅ Creating links works
- ✅ Short links redirect properly

## Troubleshooting

### Issue: "Docker is not running"
**Fix**: Start Docker Desktop application, wait until fully started

### Issue: Still getting 410 on dashboard
**Fix**: Clear browser cache or use incognito mode

### Issue: Can't find `npm` or `node`
**Fix**: Make sure Node.js is installed: https://nodejs.org/

### Issue: Port conflicts
**Fix**: Make sure ports 3000, 3001, 80, 443 aren't in use by other apps

## Quick Commands Reference

```powershell
# Check if Docker is running
docker ps

# Stop all containers
docker compose down

# Rebuild everything
docker compose up -d --build

# View logs
docker compose logs -f server
docker compose logs -f next

# Restart specific service
docker compose restart server
docker compose restart next

# Check service status
docker compose ps
```

## What Gets Fixed

1. ✅ Route order (/:code moved to end)
2. ✅ Database migration (new columns added)
3. ✅ New UI (gradients, modern design)
4. ✅ Dashboard works properly
5. ✅ All API endpoints functional

Run these commands now and your app will be fully working with the new design! 🚀

