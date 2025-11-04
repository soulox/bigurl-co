# Quick Wins Testing Checklist

## Automated Tests

Run on the server:
```bash
bash scripts/test-quick-wins.sh
```

## Manual Browser Tests

### 1. Error Handling - API Response

**Test duplicate slug:**
1. Open http://stage.bigurl.co (or http://localhost)
2. Create a short link with custom slug "test123"
3. Try creating another link with the same slug "test123"
4. ✅ **Expected**: Red error box appears with message "This custom slug is already taken. Try a different one."

**Test rate limiting:**
1. Open browser console
2. Run this in console:
```javascript
for(let i=0; i<25; i++) {
  fetch('/api/shorten', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({url: `https://example.com/${i}`})
  }).then(r => console.log(r.status));
}
```
3. ✅ **Expected**: Some requests return 429, UI shows "Too many requests. Please slow down and try again."

**Test network error:**
1. Open DevTools → Network tab
2. Enable "Offline" mode
3. Try to shorten a URL
4. ✅ **Expected**: Red error box shows "Network error. Check your connection and try again."

### 2. Copy Button Improvements

**Test successful copy (HTTPS):**
1. Create a short link
2. Click "Copy" button
3. ✅ **Expected**: 
   - Button turns green
   - Text changes to "Copied!"
   - Returns to normal after 1.5 seconds

**Test successful copy (HTTP fallback):**
1. Access via HTTP (http://localhost or http://stage.bigurl.co)
2. Create a short link
3. Click "Copy" button
4. ✅ **Expected**: Still works using fallback method

**Test copy failure:**
1. Open console, run: `navigator.clipboard = undefined`
2. Also block `document.execCommand`
3. Try copying
4. ✅ **Expected**: Button turns red, shows "Failed"

### 3. User Experience

**Test input clearing:**
1. Enter a URL and custom slug
2. Click "Shorten"
3. ✅ **Expected**: Both input fields are cleared after successful creation

**Test error styling:**
1. Trigger any error (duplicate slug, rate limit, etc.)
2. ✅ **Expected**: Error appears in a styled red box with border and background

### 4. Rate Limiting (Server-side)

**Test API rate limit:**
```bash
# Run on server
for i in {1..25}; do 
  curl -sS -o /dev/null -w "%{http_code}\n" \
    -X POST http://localhost/api/shorten \
    -H "content-type: application/json" \
    -d '{"url":"https://example.com/test-'$i'"}' &
done | sort | uniq -c
```
✅ **Expected**: Some 429 responses after burst is exceeded

**Test redirect rate limit:**
```bash
# Run on server - need a valid short code first
SHORT_CODE="abc123"  # replace with actual code
for i in {1..120}; do 
  curl -sS -o /dev/null -w "%{http_code}\n" http://localhost/$SHORT_CODE &
done | sort | uniq -c
```
✅ **Expected**: Some 429 responses after 100 req/s + burst

### 5. Database Backup

**Test manual backup:**
```bash
# On server
bash scripts/backup-db.sh

# Check results
ls -lh backups/
sqlite3 backups/links_*.db "SELECT COUNT(*) FROM links;"
```
✅ **Expected**: 
- Backup file created with timestamp
- Integrity check passes
- Can query the backup database

**Test backup script with cleanup:**
```bash
# Create 35 fake backups to test cleanup
mkdir -p backups
for i in {1..35}; do 
  touch backups/links_2024010${i}_120000.db
  sleep 0.1
done

# Run backup (should clean up old ones, keeping 30)
bash scripts/backup-db.sh

# Check count
ls backups/links_*.db | wc -l
```
✅ **Expected**: Only 31 backups remain (30 old + 1 new)

**Test cron setup:**
```bash
# On server
bash scripts/setup-backup-cron.sh
crontab -l | grep backup-db.sh
```
✅ **Expected**: Cron job added for 2 AM daily

### 6. Docker Improvements

**Test no version warning:**
```bash
docker compose config 2>&1 | grep -i "version\|obsolete"
```
✅ **Expected**: No output (no warnings)

**Test .dockerignore working:**
```bash
# Rebuild and check image size is smaller
docker compose build next
docker images bigurl/next

# Exec into container and verify exclusions
docker run --rm bigurl/next ls -la / | grep -E "node_modules|.git"
```
✅ **Expected**: Excluded files not in image

### 7. Documentation

**Check README:**
1. Open README.md
2. ✅ **Verify sections exist:**
   - Quick Start
   - API documentation
   - Rate limiting configuration
   - Backup instructions
   - Monitoring/health checks
   - Architecture diagram

## Performance Baseline

Run these to establish performance metrics:

```bash
# Test redirect speed
ab -n 1000 -c 10 http://localhost/abc123

# Test API speed
ab -n 100 -c 5 -p post.json -T application/json http://localhost/api/shorten

# Where post.json contains:
echo '{"url":"https://example.com"}' > post.json
```

## Results Template

```
Date: ___________
Tester: ___________

[ ] All automated tests pass
[ ] Duplicate slug error works
[ ] Rate limit error works  
[ ] Network error works
[ ] Copy button success (HTTPS)
[ ] Copy button fallback (HTTP)
[ ] Copy button error state
[ ] Input clearing works
[ ] Error styling correct
[ ] API rate limiting triggers
[ ] Redirect rate limiting triggers
[ ] Manual backup works
[ ] Backup cleanup works
[ ] Cron setup works
[ ] No docker-compose warnings
[ ] .dockerignore reduces image size
[ ] README is comprehensive

Notes:
_________________________________
_________________________________
```

## Troubleshooting

**If rate limiting doesn't trigger:**
- Requests may be too slow
- Try using `ab` or parallel curl with `&`
- Check nginx logs: `docker compose logs nginx | grep limit`

**If copy button fails:**
- Check browser console for errors
- Verify HTTPS vs HTTP
- Test in different browsers

**If backup fails:**
- Check container name: `docker ps`
- Verify DB path: `docker exec bigurl-co-server-1 ls -l /data/`
- Check logs in `backups/backup.log`

**If services are unhealthy:**
- Check logs: `docker compose logs [service]`
- Restart: `docker compose restart [service]`
- Rebuild: `docker compose build [service] --no-cache`

