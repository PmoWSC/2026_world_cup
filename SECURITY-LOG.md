# SECURITY-LOG · CVE-2026-111497 (Node2Shell, RCE en el decodificador Brotli de Node)

Registro del 2026-10-26. Horas en UTC. Operador: Claude Code con autorización explícita de David Blanco. Droplet previsto: `pulpo` (67.205.131.134, compartido con Reputation), `/opt/pulpo`, `infra/deploy.sh`, `pulpo.white-systems.com`.

## Estado del droplet (sin cambios posibles)

Inalcanzable durante toda la jornada: SSH cerrado en 22 y puertos alternos, ICMP sin respuesta, TCP 80/443 aceptan pero no responden. Sin `doctl` en este equipo. Detalle e hipótesis en el `SECURITY-LOG.md` de Reputation (mismo droplet). Requiere consola de recuperación o revisión del firewall en DigitalOcean.

## Cambios en el repo (mezclados, sin desplegar)

| Hora | Acción | Resultado |
|---|---|---|
| 12:15Z | Merge de PR #3 → develop: `backend/Dockerfile` a `node:22.23.4-alpine`, `engines >=22.23.4`, `.nvmrc`, guard de CI | MERGED |

Entrada HTTP: Express 4.21.2 (body-parser 1.x) no descomprime `br`; el riesgo era el runtime Node 20 (sin parche) al descomprimir respuestas de la API de Anthropic.

## Pendiente cuando el droplet vuelva

1. `cd /opt/pulpo && git fetch && git checkout develop && git pull --ff-only` (o `DEPLOY_REF=develop ./infra/deploy.sh`).
2. `docker tag <imagen backend actual> pulpo-backend:pre-cve-2026-111497-<fecha>`.
3. `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build --force-recreate backend`.
4. Verificar `docker exec <backend> node -v` = v22.23.4, healthcheck, un endpoint de lectura, logs 5 min.

## Verificación final (13:15Z)

Sin cambios: SSH cerrado, `https://pulpo.white-systems.com` sin respuesta. Todo lo pendiente requiere acceso al droplet.
