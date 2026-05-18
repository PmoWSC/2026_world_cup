# infra/ — Droplet bootstrap & deploy

Scripts y plantillas para correr Pulpo.ai en un Droplet Ubuntu 24.04.

| Archivo | Rol |
|---|---|
| [`setup-droplet.sh`](./setup-droplet.sh) | Bootstrap one-time del server (Docker + Caddy + UFW + fail2ban + user `pulpo` + dirs). Idempotente. |
| [`Caddyfile.example`](./Caddyfile.example) | Plantilla del reverse proxy con TLS automático. Copiar a `/etc/caddy/Caddyfile`. |
| [`deploy.sh`](./deploy.sh) | Pull + build + up del stack. Usa `docker-compose.prod.yml` overlay. |

> El runbook detallado de despliegue inicial (DNS, secrets, deploy key) vive en [`docs/deploy.md`](../docs/deploy.md).

---

## Flujo de despliegue inicial (resumen)

1. **Provisionar Droplet** Ubuntu 24.04 (2 GB RAM mínimo).
2. **Bootstrap**:
   ```bash
   curl -fsSL https://raw.githubusercontent.com/PmoWSC/2026_world_cup/main/infra/setup-droplet.sh -o setup-droplet.sh
   sudo bash setup-droplet.sh
   ```
3. **DNS**: registro A `pulpo.white-systems.com → <IP>`.
4. **Deploy key** SSH (read-only) y clonar repo en `/opt/pulpo` (instrucciones en el output del bootstrap).
5. **Secrets**: `cp backend/.env.example backend/.env` y reemplazar todos los `CHANGE_ME` con valores nuevos generados con `openssl rand -base64 32`.
6. **Caddy**: `sudo cp infra/Caddyfile.example /etc/caddy/Caddyfile && sudo systemctl reload caddy`.
7. **Primer deploy**: `./infra/deploy.sh` (default branch: `main`).
8. **Verificar**: `curl https://pulpo.white-systems.com/healthz`.

---

## Deploys recurrentes

Desde el Droplet, como user `pulpo`:

```bash
cd /opt/pulpo
./infra/deploy.sh                       # default: rama main
DEPLOY_REF=develop ./infra/deploy.sh    # para probar develop primero
```

El script:
1. Verifica que el working tree está limpio (rechaza si hay cambios sin commit).
2. `git fetch && git checkout $DEPLOY_REF && git pull --ff-only`.
3. `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build`.
4. Smoke test contra `http://127.0.0.1:4000/healthz`. Espera hasta 30s.
5. Si falla el health, imprime los últimos 40 logs del backend y `exit 1`.

---

## Rollback

Sin script dedicado — manual y deliberado:

```bash
cd /opt/pulpo
git log --oneline -10              # ver commits recientes
git checkout <commit-anterior>
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Si el commit anterior tenía un schema distinto, podés necesitar restaurar Postgres desde backup antes (no incluido en v0.0.2).

---

## Logs

```bash
# Backend (Apollo + tools de Claude)
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f backend

# Postgres
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f postgres

# Caddy (acceso + TLS)
sudo tail -f /var/log/caddy/pulpo.log

# UFW (intentos bloqueados)
sudo tail -f /var/log/ufw.log

# fail2ban (IPs baneadas por intentos de SSH)
sudo fail2ban-client status sshd
```

---

## Variables de entorno

`deploy.sh` respeta:

| Var | Default | Descripción |
|---|---|---|
| `DEPLOY_REF` | `main` | Rama o tag a deployar |
| `REPO_DIR` | `/opt/pulpo` | Path al checkout del repo |
| `HEALTH_URL` | `http://127.0.0.1:4000/healthz` | Endpoint del smoke test |

---

## Notas de seguridad

- **UFW** solo permite 22 (SSH), 80 (HTTP para Let's Encrypt challenge) y 443 (HTTPS). Postgres (5432) NO está expuesto al host gracias al overlay `docker-compose.prod.yml`.
- **fail2ban** bloquea IPs con intentos fallidos repetidos de SSH.
- **TLS** lo emite Caddy automáticamente desde Let's Encrypt. Renovación automática.
- El backend bindea solo a `127.0.0.1:4000` (overlay), no a `0.0.0.0`. Caddy es la única vía pública.
- La **deploy key del Droplet** debe ser **read-only** en GitHub (sin "Allow write access"). El server no necesita pushear nada.
