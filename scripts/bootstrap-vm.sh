#!/usr/bin/env bash
set -euo pipefail

# Usage: sudo bash scripts/bootstrap-vm.sh

if [[ $EUID -ne 0 ]]; then
  echo "Please run as root: sudo bash scripts/bootstrap-vm.sh" >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y
apt-get install -y \
  ca-certificates curl gnupg lsb-release \
  git ufw wget

# Install Docker Engine + compose plugin
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

systemctl enable docker
systemctl start docker

# Add current user to docker group (effective on next login)
if id -nG "$SUDO_USER" | grep -qw docker; then
  echo "User $SUDO_USER already in docker group"
else
  usermod -aG docker "$SUDO_USER" || true
  echo "Added $SUDO_USER to docker group (log out/in to take effect)"
fi

# Basic firewall: allow SSH, HTTP, HTTPS
ufw allow OpenSSH || true
ufw allow 80/tcp || true
ufw allow 443/tcp || true
echo "y" | ufw enable || true

# Create directories for certbot shared volumes
mkdir -p /opt/bigurl/certbot/www
mkdir -p /opt/bigurl/certbot/conf

echo "Bootstrap complete. Clone your repo to this VM and run the deploy script."

