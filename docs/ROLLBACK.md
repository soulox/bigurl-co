# Rollback Plan

If issues occur after cutover:

1. Switch DNS back
   - Re-enable Cloudflare proxy (orange cloud) or point A/AAAA to previous origin.
   - Lower TTL ahead of cutover to enable quick changes.

2. Verify old stack
   - Check Worker route health.
   - Validate critical paths and redirects.

3. Preserve new data
   - Export `server` SQLite DB (`/data/links.db`) for later merge.

4. Root-cause and retry
   - Review `docker compose logs -f nginx server next`.
   - Fix, redeploy, test on staging, then re-cutover.
