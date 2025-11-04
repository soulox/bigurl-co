# SSL Certificate Setup Guide

## Step-by-Step SSL Configuration

### Step 1: Make Sure Docker is Running

```powershell
docker compose up -d
```

Wait for all containers to start.

### Step 2: Verify Nginx is Serving HTTP

```powershell
# Check if nginx is running
docker compose ps nginx

# Should show "Up"
```

### Step 3: Test HTTP Access

Open browser to: `http://stage.bigurl.co`

Make sure the site loads! If not, fix nginx first before getting SSL.

### Step 4: Get SSL Certificates

```powershell
docker compose run --rm certbot certbot certonly \
  --webroot -w /var/www/html \
  -d stage.bigurl.co \
  --agree-tos -m your-email@example.com --no-eff-email --rsa-key-size 4096
```

**Replace `your-email@example.com` with your real email!**

You should see:
```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/stage.bigurl.co/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/stage.bigurl.co/privkey.pem
```

### Step 5: Enable SSL Config

```powershell
# Rename the SSL config back
Rename-Item -Path "nginx/conf.d/app-ssl.conf.disabled" -NewName "app-ssl.conf"
```

### Step 6: Restart Nginx

```powershell
docker compose restart nginx
```

### Step 7: Test HTTPS

Open browser to: `https://stage.bigurl.co`

You should see:
- ✅ The site loads
- ✅ Green padlock in browser
- ✅ New beautiful UI with gradients

### Step 8: Force HTTPS (Optional)

Add this to `nginx/conf.d/app.conf` at the top of the server block:

```nginx
server {
  listen 80;
  server_name stage.bigurl.co;
  
  # Force HTTPS
  return 301 https://$server_name$request_uri;
}
```

Then restart: `docker compose restart nginx`

## Troubleshooting

### Issue: "Cannot load certificate"

**Check if certificates exist:**
```powershell
docker compose exec nginx ls -la /etc/letsencrypt/live/stage.bigurl.co/
```

Should show: `fullchain.pem` and `privkey.pem`

If missing, run certbot again (Step 4).

### Issue: "Certbot failed - Challenge failed"

**Make sure:**
1. Domain `stage.bigurl.co` points to your server IP
2. Port 80 is accessible from internet
3. Nginx is running and serving `/var/www/html`

**Check DNS:**
```powershell
nslookup stage.bigurl.co
```

Should return your server's IP.

**Test from outside:**
```powershell
curl http://stage.bigurl.co/health
```

Should return: `{"status":"ok"}`

### Issue: Nginx won't start with SSL

**Check nginx config syntax:**
```powershell
docker compose exec nginx nginx -t
```

**View nginx logs:**
```powershell
docker compose logs nginx
```

### Issue: Domain not accessible

1. **Check firewall** - Allow ports 80 and 443
2. **Check DNS** - Domain must point to your server
3. **Check router** - Port forwarding if behind NAT

## Certificate Renewal

Let's Encrypt certificates expire in 90 days. To renew:

```powershell
# Test renewal (dry run)
docker compose run --rm certbot certbot renew --dry-run

# Actual renewal
docker compose run --rm certbot certbot renew

# Restart nginx to use new cert
docker compose restart nginx
```

### Auto-Renewal with Cron

On your server, add to crontab:

```bash
# Renew at 2am daily
0 2 * * * cd /path/to/bigurl-co && docker compose run --rm certbot certbot renew && docker compose restart nginx
```

## Quick Commands

```powershell
# Check certificate expiry
docker compose exec nginx openssl x509 -noout -dates -in /etc/letsencrypt/live/stage.bigurl.co/fullchain.pem

# View all certificates
docker compose run --rm certbot certbot certificates

# Delete certificate (if you need to start over)
docker compose run --rm certbot certbot delete --cert-name stage.bigurl.co
```

## Security Best Practices

Your `app-ssl.conf` already includes:
- ✅ TLS 1.2 and 1.3 only
- ✅ Strong ciphers
- ✅ HTTP/2 support

Consider adding:
- HSTS header
- OCSP stapling
- Certificate transparency

## Need Help?

If certbot keeps failing, you might need to:

1. **Temporarily disable app-ssl.conf** (already done)
2. **Make sure port 80 is open** on firewall
3. **Verify DNS** points to correct IP
4. **Check nginx is serving** the webroot

Once you have certificates, re-enable SSL config and restart nginx.

---

**Current Status**: SSL config is disabled, app runs on HTTP  
**Goal**: Get certificates, enable SSL, run on HTTPS  
**Time**: About 5 minutes once domain/ports are set up correctly

