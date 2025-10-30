# Decommission Cloudflare Resources

Once production is stable on the VM:

1. Disable deployments
   - Remove CI deploys to Workers/Pages.

2. Remove Worker and bindings
   - Delete Worker in the Cloudflare dashboard.
   - Remove KV namespaces, D1 DBs, Analytics Engine datasets that are no longer used.

3. Billing
   - Review Cloudflare subscriptions and remove paid add-ons.

4. DNS cleanup
   - Keep DNS on Cloudflare if desired (free) but disable proxy for origin (grey cloud), or move DNS to your registrar.

5. Backups
   - Ensure server DB backups are scheduled.
