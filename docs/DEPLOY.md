# Deployment Guide

Use Docker Compose to run services. Issue certificates with Certbot and then enable an HTTPS NGINX server block.

- Start (HTTP):

```bash
docker compose up -d --build
```

- Issue certs (replace example.com and email):

```bash
docker compose run --rm certbot certbot certonly \
  --webroot -w /var/www/html \
  -d example.com -d www.example.com \
  --agree-tos -m admin@example.com --no-eff-email --rsa-key-size 4096
```

- Create `nginx/conf.d/app-ssl.conf` with your domain paths to certs in `/etc/letsencrypt/live/<domain>/` and restart NGINX:

```bash
docker compose restart nginx
```
