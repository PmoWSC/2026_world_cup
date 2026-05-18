#!/usr/bin/env bash
# PULPO.ai — Deploy script
#
# Idempotent: pulls latest code from a branch and rebuilds the stack.
#
# Usage (from /opt/pulpo on the Droplet, as user 'pulpo' or root):
#   ./infra/deploy.sh                  # uses DEPLOY_REF=main
#   DEPLOY_REF=develop ./infra/deploy.sh
#
# Pre-requisites (one-time, done by setup-droplet.sh + manual steps):
#   - Repo cloned at /opt/pulpo
#   - backend/.env present with production values
#   - Caddy already configured and running (handles TLS)
#   - User 'pulpo' is member of group 'docker'

set -euo pipefail
trap 'echo "✗ deploy.sh FAILED at line $LINENO" >&2' ERR

DEPLOY_REF="${DEPLOY_REF:-main}"
REPO_DIR="${REPO_DIR:-/opt/pulpo}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:4000/healthz}"

echo "▶ PULPO.ai deploy"
echo "  ref:  $DEPLOY_REF"
echo "  dir:  $REPO_DIR"
echo ""

cd "$REPO_DIR"

# Refuse to deploy with uncommitted changes — protects against accidental
# overwrites of debug edits made on the server.
if [ -n "$(git status --porcelain)" ]; then
  echo "✗ Working tree is not clean. Commit or stash before deploying:" >&2
  git status --short >&2
  exit 1
fi

echo "▶ [1/4] git fetch + checkout $DEPLOY_REF"
git fetch origin --prune
git checkout "$DEPLOY_REF"
git pull --ff-only origin "$DEPLOY_REF"

echo "▶ [2/4] docker compose up (with prod overlay)"
docker compose \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  up -d --build

echo "▶ [3/4] containers"
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

echo "▶ [4/4] smoke test: $HEALTH_URL"
# Wait up to 30s for /healthz to respond (container start_period is 30s).
for i in $(seq 1 15); do
  if curl -sf "$HEALTH_URL" >/dev/null 2>&1; then
    echo "  ✓ healthcheck OK"
    curl -s "$HEALTH_URL"
    echo ""
    echo ""
    echo "✓ Deploy OK"
    exit 0
  fi
  sleep 2
done

echo "✗ Healthcheck failed after 30s. Last container logs:" >&2
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs backend --tail=40 >&2
exit 1
