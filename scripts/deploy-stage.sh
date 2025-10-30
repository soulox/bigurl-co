#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   DOMAIN=stage.bigurl.co EMAIL=admin@bigurl.co GIT_REF=main bash scripts/deploy-stage.sh

DOMAIN="${DOMAIN:-}"
EMAIL="${EMAIL:-}"
GIT_REF="${GIT_REF:-}"

if [[ -z "$DOMAIN" || -z "$EMAIL" ]]; then
  echo "Please set DOMAIN and EMAIL env vars." >&2
  exit 1
fi

if [[ -n "$GIT_REF" ]]; then
  echo "Checking out $GIT_REF ..."
  git fetch --all --tags || true
  git checkout "$GIT_REF"
fi

mkdir -p certbot/www certbot/conf

# Write an SSL conf for the staging domain
if [[ -f nginx/conf.d/app-ssl.conf.template ]]; then
  cp nginx/conf.d/app-ssl.conf.template nginx/conf.d/app-ssl.conf
  sed -i "s/example.com www.example.com/$DOMAIN/g" nginx/conf.d/app-ssl.conf || true
  sed -i "s#/etc/letsencrypt/live/example.com#/etc/letsencrypt/live/$DOMAIN#g" nginx/conf.d/app-ssl.conf || true
  sed -i "s#server_name stage.bigurl.co;#server_name $DOMAIN;#g" nginx/conf.d/app-ssl.conf || true
fi

docker compose up -d --build

if [[ ! -f "certbot/conf/live/$DOMAIN/fullchain.pem" ]]; then
  docker compose run --rm certbot certbot certonly \
    --webroot -w /var/www/html \
    -d "$DOMAIN" \
    --agree-tos -m "$EMAIL" --no-eff-email --rsa-key-size 4096
fi

docker compose restart nginx

echo "Validate: https://$DOMAIN/health"

