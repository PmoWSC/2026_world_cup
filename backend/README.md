# PULPO.ai Backend

Apollo GraphQL Server con integración Claude (Anthropic) y motor de predicciones multi-modelo. Node.js 20+ · PostgreSQL 16 + pgvector.

---

## Quickstart (standalone, sin Docker)

```bash
cd backend
cp .env.example .env
# editar .env con CLAUDE_API_KEY, JWT_SECRET, JWT_REFRESH_SECRET, DATABASE_URL
npm install
npm run dev          # node --watch server.js
```

El backend espera una base postgres con pgvector escuchando en `DATABASE_URL`. Para usar la del compose root: `docker compose up postgres` desde la raíz.

---

## Variables de entorno

Ver [.env.example](.env.example). Resumen:

| Variable | Por qué | Cómo generar |
|----------|---------|--------------|
| `NODE_ENV` | `development` o `production` | — |
| `PORT` | Puerto del API | `4000` por default |
| `DATABASE_URL` | Postgres con pgvector | `postgresql://user:pass@host:5432/db` (URL-encode el password) |
| `CLAUDE_API_KEY` | Anthropic | https://console.anthropic.com/settings/keys |
| `JWT_SECRET` | Firma de access tokens | `openssl rand -base64 32` |
| `JWT_REFRESH_SECRET` | Firma de refresh tokens | `openssl rand -base64 32` (distinto al anterior) |
| `FOOTBALL_DATA_API_KEY` | Ingesta de fixtures | https://www.football-data.org/client/register |
| `ANON_MSG_LIMIT` | Mensajes para invitados | `5` |
| `DAILY_MSG_LIMIT` | Mensajes para autenticados | `30` |
| `COMPETITION_MODE` | `league_demo` o `world_cup` | `league_demo` por default |
| `CORS_ORIGIN` | Orígenes permitidos (csv) | `http://localhost:8081` y los puertos LAN de Expo |
| `GRAPHQL_INTROSPECTION_ENABLED` | Sandbox / SDL público | `false` en producción |

⚠️ **NUNCA committear `.env`.** Está en `.gitignore`.

---

## Estructura

```
backend/
├── server.js                  Entry point: Express + Apollo + Helmet + CORS
├── package.json               name: pulpo-ai-backend
├── Dockerfile
├── auth/
│   ├── jwt.js                 sign() / verify() de access + refresh
│   └── middleware.js          extractUser() inyectado al context Apollo
├── config/
│   ├── claude.js              Cliente Anthropic + 12 TOOL_DEFINITIONS + buildSystemPrompt
│   ├── competition.js         Modos league_demo / world_cup
│   └── db.js                  Pool pg
├── graphql/
│   ├── typeDefs.js            Schema completo (Query, Mutation, types)
│   ├── resolvers.js           Merge resolvers + scalar JSON
│   └── resolvers/             auth, chat, players, fixtures, predictions, connections, polla
├── jobs/
│   ├── refresh_leaderboard.js Recomputa rankings de Polla
│   ├── resolve_bets.js        Calcula puntos al cerrar partidos
│   └── sync_live_scores.js    Pull de scores en vivo
├── prediction/
│   ├── index.js               Composición ponderada + normalización
│   ├── historical_model.js    H2H y tendencias
│   ├── market_value_model.js  Diferencia de market value
│   └── form_model.js          Resultados recientes (últimos N)
├── tools/                     Implementación de las 12 tools de Claude
│   ├── index.js               Dispatcher por nombre
│   ├── search_players.js
│   ├── get_squad.js
│   ├── predict_match.js
│   ├── find_connections.js
│   ├── get_head_to_head.js
│   ├── get_fixtures.js
│   ├── get_tentacle_factors.js
│   ├── get_group_standings.js
│   ├── get_league_standings.js
│   ├── get_live_scores.js
│   └── semantic_search.js     Vector search con pgvector
├── scripts/
│   └── ingest/                ETL desde football-data, transfermarkt, statsbomb...
└── utils/
    └── rate_limiter.js
```

---

## Scripts

```bash
npm start                # node server.js
npm run dev              # node --watch server.js (recompila al guardar)
npm run ingest           # corre scripts/ingest/run_all.js
```

---

## API

### Health check

```bash
curl http://127.0.0.1:4000/health
# -> {"status":"ok","mode":"league_demo","tools":11,"timestamp":"..."}
```

### GraphQL endpoint

`POST http://127.0.0.1:4000/graphql`

Si `GRAPHQL_INTROSPECTION_ENABLED=true` (solo desarrollo), abre el Apollo Sandbox en el browser. En producción, deshabilitado.

#### Mutaciones de auth

```graphql
mutation Register {
  register(email:"a@b.com", password:"P@ssw0rd!", displayName:"Ana") {
    token
    refreshToken
    user { id email displayName }
  }
}

mutation Login {
  login(email:"a@b.com", password:"P@ssw0rd!") { token refreshToken }
}

mutation Refresh {
  refreshToken(refreshToken:"...") { token refreshToken }
}
```

Pasa el `token` en el header `Authorization: Bearer <token>` para queries autenticadas.

#### Chat (ejemplo)

```graphql
mutation {
  chat(message:"Who wins Real Madrid vs Barcelona this weekend?", language:"en", sessionId:"sess-1") {
    message
    visualization { type data }
    remaining_messages
    reset_at
  }
}
```

#### Predicción directa

```graphql
{
  predictMatch(homeTeam:"Real Madrid", awayTeam:"Barcelona") {
    homeWin draw awayWin
    models { name homeWin draw awayWin }
  }
}
```

---

## Tools registradas para Claude

12 herramientas definidas en [config/claude.js](config/claude.js). Claude las invoca según la pregunta del usuario; el resolver las dispatchea desde [tools/index.js](tools/index.js).

| Tool | Propósito | Solo World Cup |
|------|-----------|:---:|
| `search_players` | Búsqueda por nombre / posición / club / nacionalidad | |
| `get_squad` | Roster de selección o club | |
| `predict_match` | Predicción win/draw/loss multi-modelo | |
| `find_connections` | Vínculos entre selecciones | ✓ |
| `get_head_to_head` | H2H histórico | |
| `get_fixtures` | Fixtures con filtros | |
| `get_tentacle_factors` | Altitud, clima, recovery, viaje, árbitro | ✓ |
| `get_group_standings` | Standings de grupo / liga | |
| `get_league_standings` | Tabla de liga | |
| `get_live_scores` | Scores en vivo | |
| `semantic_search` | Búsqueda vectorial (pgvector) | |

Para añadir una tool: define el schema en `config/claude.js` y la implementación en `tools/<name>.js`. Registra el dispatch en `tools/index.js`.

---

## Motor de predicción

Tres modelos en demo, seis en World Cup. Corren en paralelo (`Promise.all`) y se combinan con pesos.

```js
// backend/prediction/index.js
WEIGHTS.league_demo = { historical: 0.20, market_value: 0.35, form: 0.45 }
WEIGHTS.world_cup   = { historical: 0.15, market_value: 0.25, form: 0.25,
                        cohesion: 0.15, pedigree: 0.10, tentacles: 0.10 }
```

Composición: suma ponderada → normalización a 1.0. La respuesta incluye breakdown por modelo para que el cliente pueda mostrar transparencia.

---

## Jobs

Los archivos en `jobs/` son scripts standalone que se ejecutan vía cron (no incluido en el repo). En producción:

```bash
*/2 * * * * docker compose exec backend node jobs/sync_live_scores.js
*/5 * * * * docker compose exec backend node jobs/resolve_bets.js
0 * * * *   docker compose exec backend node jobs/refresh_leaderboard.js
```

---

## Seguridad

- Helmet activo (CSP off para Apollo Sandbox en dev).
- CORS restringido a orígenes en `CORS_ORIGIN`.
- Queries 100% parametrizadas (`pg.query("... WHERE id = $1", [id])`).
- Passwords con bcrypt cost 10.
- JWT secrets rotables; refresh tokens con vida limitada.
- Rate limit por usuario/día en tabla `rate_limits`.
- `GRAPHQL_INTROSPECTION_ENABLED=false` en producción.

Antes de deploy a producción consulta el checklist en [../docs/system/scafold.md](../docs/system/scafold.md) sección 10.

---

## Testing manual rápido

```bash
# Health
curl http://127.0.0.1:4000/health

# Registrar
curl -s http://127.0.0.1:4000/graphql -H "Content-Type: application/json" \
  -d '{"query":"mutation { register(email:\"test@x.com\", password:\"Test1234!\", displayName:\"Test\") { token } }"}'
```

---

## Troubleshooting

| Síntoma | Causa probable | Fix |
|---------|----------------|-----|
| `[FATAL STARTUP ERROR]: connect ECONNREFUSED` | Postgres no levantó | `docker compose ps postgres`; revisar healthcheck |
| `[FATAL STARTUP ERROR]: extension "vector" is not available` | Imagen postgres equivocada | Asegurar `pgvector/pgvector:pg16` en compose |
| Chat devuelve "rate_limit.exhausted" | Llegaste a `DAILY_MSG_LIMIT` | Esperar al reset (00:00 UTC) o subir el límite |
| 403 en CORS | Origen no listado | Añadir a `CORS_ORIGIN` (csv) |
| `Authentication error` | Token vencido o ausente | `refreshToken` mutation o re-login |

---

🐙 Más detalle en [../docs/system/scafold.md](../docs/system/scafold.md).
