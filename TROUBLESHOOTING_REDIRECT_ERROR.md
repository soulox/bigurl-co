# Troubleshooting: "Link not found, expired, or max clicks reached"

## Quick Diagnosis

Run these commands to identify the issue:

### 1. Check if the server restarted with the migration
```bash
# Check when the container was created
docker compose ps

# Look for migration messages in logs
docker compose logs server | grep -E "(Adding column|Server listening)"
```

You should see:
- "Adding column..." messages (one for each new column)
- "Server listening on http://127.0.0.1:3000"

### 2. Verify the database has the new columns
```bash
docker compose exec server sqlite3 /data/links.db "PRAGMA table_info(links)"
```

You should see columns: `expires_at`, `max_clicks`, `click_count`, `title`, `description`

### 3. Check your existing links
```bash
docker compose exec server sqlite3 /data/links.db "SELECT short_code, original_url, expires_at, max_clicks, click_count, is_active FROM links"
```

Look for:
- ✅ `is_active` should be `1`
- ✅ `expires_at` should be NULL or a future timestamp
- ✅ `max_clicks` should be NULL or a high number
- ✅ `click_count` should be `0` or a number (not NULL)

## Common Issues and Fixes

### Issue 1: Container Wasn't Rebuilt

**Symptom**: No "Adding column..." messages in logs

**Fix**:
```bash
# Force rebuild
docker compose stop server
docker compose rm -f server
docker compose up -d --build server

# Check logs
docker compose logs -f server
```

### Issue 2: Existing Links Have click_count = NULL

**Symptom**: Links work but clicks aren't counted

**Fix**:
```bash
# Manually update NULL values
docker compose exec server sqlite3 /data/links.db "UPDATE links SET click_count = 0 WHERE click_count IS NULL"
```

### Issue 3: Link is Marked as Inactive

**Symptom**: All your links return the error

**Check**:
```bash
docker compose exec server sqlite3 /data/links.db "SELECT short_code, is_active FROM links"
```

**Fix** (if all are 0):
```bash
# Reactivate all links
docker compose exec server sqlite3 /data/links.db "UPDATE links SET is_active = 1"
```

### Issue 4: Database Query Issue

**Symptom**: Migration ran but links still don't work

**Fix**: Update the query to be more defensive:

Add this fix to `server/src/db.ts`:

```typescript
// Around line 89-103, update getOriginalUrlByCode:
getOriginalUrlByCode(code: string): string | undefined {
  const stmt = this.db.prepare(
    'SELECT original_url, expires_at, max_clicks, COALESCE(click_count, 0) as click_count FROM links WHERE short_code = ? AND is_active = 1'
  );
  const row = stmt.get(code) as { original_url?: string; expires_at?: number | null; max_clicks?: number | null; click_count: number } | undefined;
  
  if (!row) return undefined;
  
  // Check expiration (null/undefined means no expiration)
  if (row.expires_at && row.expires_at < Date.now()) return undefined;
  
  // Check max clicks (null/undefined means no limit)
  if (row.max_clicks && row.click_count >= row.max_clicks) return undefined;
  
  return row.original_url;
}
```

Then rebuild:
```bash
cd server && npm run build && cd ..
docker compose up -d --build server
```

## Step-by-Step Recovery

If you're still having issues, follow these steps:

### Step 1: Backup Your Data
```bash
docker compose exec server sqlite3 /data/links.db ".backup '/data/links-backup.db'"
docker cp $(docker compose ps -q server):/data/links-backup.db ./links-backup.db
```

### Step 2: Check Database Integrity
```bash
docker compose exec server sqlite3 /data/links.db "PRAGMA integrity_check"
```

Should return: `ok`

### Step 3: Verify Schema
```bash
# Check links table
docker compose exec server sqlite3 /data/links.db ".schema links"
```

Expected output should include:
```sql
CREATE TABLE links (
  id TEXT PRIMARY KEY,
  short_code TEXT UNIQUE NOT NULL,
  original_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  created_at INTEGER NOT NULL,
  expires_at INTEGER,
  max_clicks INTEGER,
  click_count INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1
);
```

### Step 4: Manual Column Addition (If Migration Didn't Run)

If the columns are still missing:

```bash
docker compose exec server sqlite3 /data/links.db << 'EOF'
ALTER TABLE links ADD COLUMN title TEXT;
ALTER TABLE links ADD COLUMN description TEXT;
ALTER TABLE links ADD COLUMN expires_at INTEGER;
ALTER TABLE links ADD COLUMN max_clicks INTEGER;
ALTER TABLE links ADD COLUMN click_count INTEGER DEFAULT 0;
UPDATE links SET click_count = 0 WHERE click_count IS NULL;
EOF
```

### Step 5: Test a Link
```bash
# Get a short code
SHORT_CODE=$(docker compose exec server sqlite3 /data/links.db "SELECT short_code FROM links LIMIT 1" | tr -d '\r')

# Test the redirect
curl -v http://localhost:3000/$SHORT_CODE
```

Should return a 301 redirect.

## Debug Output

Run this comprehensive debug check:

```bash
echo "=== Server Status ==="
docker compose ps server

echo -e "\n=== Recent Logs ==="
docker compose logs --tail=20 server

echo -e "\n=== Database Columns ==="
docker compose exec server sqlite3 /data/links.db "PRAGMA table_info(links)"

echo -e "\n=== Sample Link Data ==="
docker compose exec server sqlite3 /data/links.db "SELECT short_code, original_url, is_active, expires_at, max_clicks, click_count FROM links LIMIT 3"

echo -e "\n=== Health Check ==="
curl -s http://localhost:3000/health

echo -e "\n=== Test Link Creation ==="
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/test"}'
```

Copy the output and review it to identify the issue.

## Still Not Working?

If none of the above works, there might be a code issue. Let's add better error logging:

1. Edit `server/src/index.ts` around line 76-82 to add debug logging:

```typescript
app.get('/:code', async (c: Context) => {
  const code = c.req.param('code');

  // Debug logging
  console.log(`Redirect request for code: ${code}`);
  
  // Check database for link (to validate expiration/max clicks)
  let target = db.getOriginalUrlByCode(code);
  
  console.log(`Target for ${code}:`, target);
  
  if (!target) {
    console.log(`Link not found or invalid: ${code}`);
    return c.json({ error: 'Link not found, expired, or max clicks reached' }, 410);
  }
  // ... rest of the code
```

2. Rebuild and check logs:
```bash
cd server && npm run build && cd ..
docker compose up -d --build server
docker compose logs -f server
```

3. Try accessing a link and watch the logs

## Contact Information

If you've tried all the above and it's still not working, provide this information:

1. Output of the "Debug Output" script above
2. Docker compose logs: `docker compose logs server`
3. Database schema: `docker compose exec server sqlite3 /data/links.db ".schema links"`
4. Sample row: `docker compose exec server sqlite3 /data/links.db "SELECT * FROM links LIMIT 1"`

This will help identify the exact issue!

