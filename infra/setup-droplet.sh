#!/usr/bin/env bash
# PULPO.ai — Droplet bootstrap
#
# Idempotent: safe to run twice. Each step checks before acting.
#
# Usage (from root, on the Droplet):
#   curl -fsSL https://raw.githubusercontent.com/PmoWSC/2026_world_cup/main/infra/setup-droplet.sh -o setup-droplet.sh
#   sudo bash setup-droplet.sh
#
# After it finishes, follow the steps in the final summary.

set -euo pipefail
trap 'echo "✗ setup-droplet.sh FAILED at line $LINENO" >&2' ERR

# ---------------------------------------------------------------------------
# 0. Pre-flight
# ---------------------------------------------------------------------------
if [ "$(id -u)" -ne 0 ]; then
  echo "✗ This script must be run as root (use: sudo bash setup-droplet.sh)" >&2
  exit 1
fi

if ! grep -q "Ubuntu 24" /etc/os-release; then
  echo "⚠ This script is tested on Ubuntu 24.04 LTS. Detected:"
  cat /etc/os-release | grep PRETTY_NAME
  read -p "Continue anyway? [y/N] " ans
  [ "${ans:-N}" = "y" ] || exit 1
fi

echo "▶ PULPO.ai Droplet bootstrap — Ubuntu 24.04"
echo ""

# ---------------------------------------------------------------------------
# 1. System update
# ---------------------------------------------------------------------------
echo "▶ [1/8] System update"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq

# ---------------------------------------------------------------------------
# 2. Base prerequisites
# ---------------------------------------------------------------------------
echo "▶ [2/8] Installing base prerequisites"
apt-get install -y -qq \
  ca-certificates curl gnupg lsb-release \
  ufw fail2ban \
  debian-keyring debian-archive-keyring apt-transport-https

# ---------------------------------------------------------------------------
# 3. Docker Engine + Compose plugin (official repo)
# ---------------------------------------------------------------------------
echo "▶ [3/8] Docker Engine"
if command -v docker >/dev/null 2>&1; then
  echo "  ✓ docker already installed ($(docker --version))"
else
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg

  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list

  apt-get update -qq
  apt-get install -y -qq \
    docker-ce docker-ce-cli containerd.io \
    docker-buildx-plugin docker-compose-plugin
  systemctl enable --now docker
fi

# ---------------------------------------------------------------------------
# 4. Caddy (official repo)
# ---------------------------------------------------------------------------
echo "▶ [4/8] Caddy"
if command -v caddy >/dev/null 2>&1; then
  echo "  ✓ caddy already installed ($(caddy version))"
else
  curl -fsSL https://dl.cloudsmith.io/public/caddy/stable/gpg.key \
    | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -fsSL https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt \
    > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -qq
  apt-get install -y -qq caddy
  systemctl enable --now caddy
fi

# ---------------------------------------------------------------------------
# 5. Firewall (UFW)
# ---------------------------------------------------------------------------
echo "▶ [5/8] Firewall"
ufw --force reset >/dev/null
ufw default deny incoming >/dev/null
ufw default allow outgoing >/dev/null
ufw allow 22/tcp comment 'SSH' >/dev/null
ufw allow 80/tcp comment 'HTTP (LE challenge)' >/dev/null
ufw allow 443/tcp comment 'HTTPS' >/dev/null
ufw --force enable >/dev/null
echo "  ✓ ufw enabled: 22, 80, 443 allowed; everything else blocked"

# ---------------------------------------------------------------------------
# 6. fail2ban
# ---------------------------------------------------------------------------
echo "▶ [6/8] fail2ban"
systemctl enable --now fail2ban
echo "  ✓ fail2ban enabled (default jail.conf protects SSH)"

# ---------------------------------------------------------------------------
# 7. Application user
# ---------------------------------------------------------------------------
echo "▶ [7/8] Application user 'pulpo'"
if id -u pulpo >/dev/null 2>&1; then
  echo "  ✓ user 'pulpo' already exists"
else
  useradd -m -s /bin/bash pulpo
  echo "  ✓ user 'pulpo' created"
fi
usermod -aG docker pulpo

# ---------------------------------------------------------------------------
# 8. Directories
# ---------------------------------------------------------------------------
echo "▶ [8/8] Directories"
mkdir -p /opt/pulpo /var/log/caddy /var/www/pulpo
chown -R pulpo:pulpo /opt/pulpo /var/www/pulpo
if id -u caddy >/dev/null 2>&1; then
  chown -R caddy:caddy /var/log/caddy
fi
echo "  ✓ /opt/pulpo, /var/log/caddy, /var/www/pulpo"

# ---------------------------------------------------------------------------
# Final summary
# ---------------------------------------------------------------------------
cat <<'EOF'

────────────────────────────────────────────────────────────────────
✓ Bootstrap completo.

Próximos pasos (manuales):

1. DNS:
   - Configurar registro A en tu proveedor:
       pulpo.white-systems.com  →  <IP pública del Droplet>
   - Esperar propagación (5-30 min). Verificar con:
       dig +short pulpo.white-systems.com

2. Deploy key SSH para clonar el repo (read-only):
   - Generar como user pulpo:
       su - pulpo
       ssh-keygen -t ed25519 -f ~/.ssh/pulpo_droplet -N "" -C "droplet-pull-only"
       cat ~/.ssh/pulpo_droplet.pub
   - Pegar la pública en:
       https://github.com/PmoWSC/2026_world_cup/settings/keys
       (NO marcar "Allow write access" — solo lectura)
   - Configurar SSH para usarla:
       echo 'Host github.com
         IdentityFile ~/.ssh/pulpo_droplet
         IdentitiesOnly yes' >> ~/.ssh/config
       chmod 600 ~/.ssh/config

3. Clonar el repo:
       cd /opt/pulpo
       git clone git@github.com:PmoWSC/2026_world_cup.git .

4. Configurar secretos:
       cp backend/.env.example backend/.env
       # Editar backend/.env y reemplazar CHANGE_ME con valores reales.
       # Generar secrets nuevos:
       #   JWT_SECRET=$(openssl rand -base64 32)
       #   JWT_REFRESH_SECRET=$(openssl rand -base64 32)
       #   POSTGRES_PASSWORD=$(openssl rand -base64 24)
       # NO reutilizar los de dev.

5. Configurar Caddy:
       sudo cp infra/Caddyfile.example /etc/caddy/Caddyfile
       sudo systemctl reload caddy
       # Verificar TLS:
       curl -I https://pulpo.white-systems.com/healthz

6. Primer deploy:
       cd /opt/pulpo
       ./infra/deploy.sh

7. Verificar:
       curl https://pulpo.white-systems.com/healthz
       # → {"status":"ok"}
────────────────────────────────────────────────────────────────────
EOF
