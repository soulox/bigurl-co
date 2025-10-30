#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   DOMAIN=bigurl.co EMAIL=admin@bigurl.co GIT_REF=main bash scripts/deploy-prod.sh
#
# Requirements:
#   - Run on the VM where the app will live
#   - Docker & docker compose installed (see scripts/bootstrap-vm.sh)
#   - Repo cloned on the VM

DOMAIN="${DOMAIN:-}"
EMAIL="${EMAIL:-}"
GIT_REF="${GIT_REF:-}"
STAGING_DOMAIN="${STAGING_DOMAIN:-stage.$DOMAIN}"

if [[ -z "$DOMAIN" || -z "$EMAIL" ]]; then
  echo "Please set DOMAIN and EMAIL env vars." >&2
  exit 1
fi

if [[ -n "$GIT_REF" ]]; then
  echo "Checking out $GIT_REF ..."
  git fetch --all --tags || true
  git checkout "$GIT_REF"
fi

echo "Ensuring certbot directories exist ..."
mkdir -p certbot/www certbot/conf

echo "Creating/updating NGINX SSL config for $DOMAIN ..."
if [[ ! -f nginx/conf.d/app-ssl.conf ]]; then
  if [[ -f nginx/conf.d/app-ssl.conf.template ]]; then
    cp nginx/conf.d/app-ssl.conf.template nginx/conf.d/app-ssl.conf
  else
    # fallback minimal https conf will be created during reload after cert issuance
    touch nginx/conf.d/app-ssl.conf
  fi
fi

sed -i "s/example.com www.example.com/$DOMAIN www.$DOMAIN/g" nginx/conf.d/app-ssl.conf || true
sed -i "s#/etc/letsencrypt/live/example.com#/etc/letsencrypt/live/$DOMAIN#g" nginx/conf.d/app-ssl.conf || true
sed -i "s#server_name stage.bigurl.co;#server_name $DOMAIN;#g" nginx/conf.d/app-ssl.conf || true

echo "Bringing up stack (HTTP first) ..."
docker compose up -d --build

# Obtain certificates if not present
if [[ ! -f "certbot/conf/live/$DOMAIN/fullchain.pem" ]]; then
  echo "Requesting Let's Encrypt certificate for $DOMAIN ..."
  docker compose run --rm certbot certbot certonly \
    --webroot -w /var/www/html \
    -d "$DOMAIN" -d "www.$DOMAIN" \
    --agree-tos -m "$EMAIL" --no-eff-email --rsa-key-size 4096
fi

echo "Reloading NGINX with HTTPS config ..."
docker compose restart nginx

echo "Health checks ..."
set +e
for url in "http://localhost/health" "https://$DOMAIN/health"; do
  echo "Checking $url"
  if ! curl -fsSLI --max-time 10 "$url" >/dev/null; then
    echo "WARN: $url not responding yet" >&2
  fi
done
set -e

echo "Deployment finished. Verify DNS points to this VM and test: https://$DOMAIN/health"

