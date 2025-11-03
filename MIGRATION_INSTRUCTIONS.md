# Database Migration Instructions

## Problem Fixed

Your database had the old schema without the new columns. I've added automatic migration code that will:

1. Check which columns exist in your `links` table
2. Add any missing columns: `title`, `description`, `expires_at`, `max_clicks`, `click_count`
3. Initialize `click_count` to 0 for existing records
4. Create the new `clicks` table for analytics

## How to Apply the Migration

### Option 1: Rebuild and Restart Docker (Recommended)

```bash
# Rebuild the server container with the new migration code
docker compose up -d --build server

# Check the logs to see the migration happening
docker compose logs -f server
```

You should see messages like:
```
Adding column title to links table...
Adding column description to links table...
Adding column expires_at to links table...
Adding column max_clicks to links table...
Adding column click_count to links table...
Server listening on http://127.0.0.1:3000
```

### Option 2: Full Rebuild (If Option 1 Doesn't Work)

```bash
# Stop all containers
docker compose down

# Rebuild and start
docker compose up -d --build

# Check logs
docker compose logs -f
```

## Verify Migration

After restarting, test that everything works:

```bash
# 1. Check health endpoint
curl http://localhost:3000/health

# 2. Test creating a link
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'

# 3. Check the database columns
docker compose exec server sqlite3 /data/links.db "PRAGMA table_info(links)"
```

You should see all the new columns listed.

## What Changed

**File Updated**: `server/src/db.ts`

- Added `migrateLinksTable()` method that runs on startup
- Uses SQLite's `PRAGMA table_info()` to check existing columns
- Adds missing columns with `ALTER TABLE ADD COLUMN`
- Safe to run multiple times (checks before adding)

## Your Existing Data

✅ **All existing links are preserved**
✅ **Short codes still work**
✅ **New columns default to NULL** (which is fine)
✅ **Backwards compatible**

## If You Still See Errors

If you still get "no such column" errors:

1. **Check you rebuilt the server container:**
   ```bash
   docker compose ps
   # Look for when the server container was created
   ```

2. **Verify the build used the new code:**
   ```bash
   docker compose logs server | grep "Adding column"
   ```

3. **Manually check database:**
   ```bash
   docker compose exec server sqlite3 /data/links.db "PRAGMA table_info(links)"
   ```

4. **If all else fails, backup and restart fresh:**
   ```bash
   # Backup database
   docker compose exec server cp /data/links.db /data/links-backup.db
   
   # Stop and remove volumes
   docker compose down -v
   
   # Start fresh (will create new database)
   docker compose up -d --build
   ```

## Success Indicators

You'll know the migration worked when:

✅ Server starts without errors
✅ You see "Adding column..." messages in logs
✅ Creating a link with advanced options works
✅ Dashboard loads without errors
✅ Analytics page shows data

## Next Steps

Once the migration is complete:

1. ✅ Create a short link with expiration date
2. ✅ Test the dashboard at http://your-domain.com/dashboard
3. ✅ View analytics for a link
4. ✅ Try bulk operations
5. ✅ Generate QR codes

Everything should work perfectly now! 🎉

