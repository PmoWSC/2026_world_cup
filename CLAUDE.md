# CLAUDE.md — Reglas del proyecto PULPO.ai

Este archivo es de lectura obligatoria al inicio de cada sesión. Define cómo se debe trabajar en este repositorio.

---

## 1. Identidad del proyecto

**PULPO.ai** — backend Node.js + Apollo GraphQL con integración Claude (Anthropic SDK), base de datos PostgreSQL + pgvector, y app móvil React Native + Expo Router. Cubre dos modos de competición: `league_demo` (La Liga + Premier) y `world_cup` (Copa del Mundo 2026).

Documentación técnica completa: [docs/system/scafold.md](docs/system/scafold.md) *(carpeta `docs/` está gitignored — uso interno).*

---

## 2. Ciclo de desarrollo obligatorio

Ninguna tarea no trivial puede saltarse este ciclo:

| Fase | Qué se hace | Quién aprueba | Salida |
|------|-------------|---------------|--------|
| **1. Planeación** | Definir alcance, archivos a tocar, riesgos, criterios de aceptación. Para cambios > 1 archivo, escribir un plan corto antes de tocar código. | — | Plan en chat o `docs/plans/<tarea>.md` |
| **2. Aprobación** | El usuario revisa el plan y confirma explícitamente (`OK`, `aprobado`, `procede`). Sin aprobación no se implementa. | Usuario | Confirmación explícita |
| **3. Implementación** | Cambios mínimos al alcance aprobado. No agregar features no pedidos, no refactor oportunista. | — | Diff acotado |
| **4. Test** | Probar el camino feliz **y** los bordes. Para UI: abrir en navegador/simulador. Para backend: probar el endpoint. Para DB: validar migración con datos reales. | — | Evidencia (logs, screenshots, query results) |
| **5. Entrega** | Commit con mensaje claro (qué + por qué), push a rama feature, PR con descripción y test plan. | Reviewer humano | PR aprobado y mergeado |

**Si algo no encaja en el plan aprobado, parar y volver a Planeación.** No improvisar.

---

## 3. Reglas duras (hard rules)

### Git y ramas
- **NUNCA** `git push` directo a `main`, `master` o `staging`. Hay un hook que lo bloquea — no intentes saltarlo.
- **NUNCA** `--no-verify`, `--no-gpg-sign` o equivalentes para saltar hooks.
- **NUNCA** `git push --force` o `-f`. Si necesitas reescribir historia compartida, pídelo al usuario.
- **NUNCA** `git reset --hard` contra ramas remotas (`origin/main`, `origin/staging`).
- Las ramas de trabajo se nombran `feature/<slug>`, `fix/<slug>`, `chore/<slug>`, `docs/<slug>`.
- Un commit = una intención. No mezclar refactor con features.
- Mensaje de commit: imperativo, breve, en español o inglés (consistente con el repo).

### Secretos y datos
- **NUNCA** committear `.env`, `.env.*` (excepto `.env.example`), `credentials.json`, llaves privadas. El `.gitignore` ya los protege — no lo modifiques sin avisar.
- **NUNCA** loggear `JWT_SECRET`, `CLAUDE_API_KEY`, `FOOTBALL_DATA_API_KEY`, contraseñas, tokens, ni cuerpos de respuesta de auth.
- **NUNCA** imprimir queries con datos personales identificables (PII) en consola.

### Base de datos
- El schema está en [db_init/seed.sql](db_init/seed.sql). Cambios al schema **siempre** se hacen vía migración versionada (no editar `seed.sql` directamente para producción).
- Migraciones destructivas (drop column/table, alter type incompatible) requieren aprobación explícita y plan de rollback.
- Nunca correr `DROP`, `TRUNCATE`, `DELETE` sin `WHERE` contra una base con datos reales sin confirmación previa.

### Código y dependencias
- No agregar dependencias nuevas sin justificación. Antes de `npm install <pkg>`, considerar si la stdlib o algo ya instalado lo resuelve.
- No subir `node_modules/`, `dist/`, `build/`, archivos `.log`. El `.gitignore` los cubre.
- Mantener compatibilidad con Node `>=20.0.0` (backend) y la versión de Expo declarada en [mobile/package.json](mobile/package.json).

### Calidad
- No introducir vulnerabilidades OWASP top 10 (SQL injection, XSS, command injection, etc.). Usar siempre queries parametrizadas (`pg` con `$1, $2`).
- Validar entrada de usuario en resolvers GraphQL. Nunca confiar en `prediction: JSON!` sin sanitizar.
- Rate limiting sigue activo en chat ([backend/utils/rate_limiter.js](backend/utils/rate_limiter.js)). No bypassearlo en pruebas que toquen prod.

---

## 4. Buenas prácticas (soft rules)

- **Cambios pequeños y enfocados.** Un PR debería ser revisable en < 15 min.
- **Tests primero cuando cambias lógica de predicción.** Los modelos en [backend/prediction/](backend/prediction/) son el corazón del producto.
- **Lee antes de escribir.** Antes de modificar un archivo, léelo entero. Antes de tocar un módulo, entiende sus consumidores.
- **Pregunta cuando dudes.** El costo de pausar a confirmar es bajo; el costo de un cambio incorrecto es alto.
- **Comentarios solo cuando el *por qué* no es obvio.** No documentes lo que el código ya dice.
- **i18n:** los strings de usuario van en [mobile/src/i18n/locales/](mobile/src/i18n/locales/), no hardcoded.
- **GraphQL schema first:** cualquier cambio al API empieza en [backend/graphql/typeDefs.js](backend/graphql/typeDefs.js).

---

## 5. Comunicación con el usuario

- **Idioma:** responder siempre en **español dialecto colombiano neutro**. Excepción: documentos técnicos (READMEs, código, scripts, archivos `.md` del repo) — el contenido técnico se mantiene en su idioma original, pero la conversación de chat es siempre en español.
- **Tono:** evitar tecnicismos innecesarios. Si hay que usar un término técnico, explicarlo en una línea la primera vez.
- **Longitud:** respuestas **cortas y concisas**. Ir al grano. Sin preámbulos largos ni relleno.
- **Pedir decisiones al usuario:** cuando se necesite una respuesta del usuario para tomar una decisión (elegir entre opciones, confirmar enfoque, resolver ambigüedad), **usar siempre la herramienta `AskUserQuestion`** en vez de listar opciones en texto plano. Excepción única: confirmaciones triviales de una sola línea (ej. "¿Procedo?") inmediatamente después de un plan que el usuario ya leyó.

---

## 6. Cómo trabajar con Claude Code en este repo

- **Usa Plan Mode** (`/plan`) para tareas que tocan más de 2 archivos.
- **Respeta los permisos** definidos en [.claude/settings.json](.claude/settings.json). Si algo está en `ask`, espera aprobación humana.
- **Antes de commit/push:** corre `npm test` en backend y verifica que la app móvil arranca (`npm start` en `mobile/`).
- **Hooks activos** documentados en [HOOKS.md](HOOKS.md). Si un hook bloquea algo, lee el motivo — no intentes burlarlo.
- **Memoria persistente:** los hechos del proyecto que vale la pena recordar entre sesiones se guardan en memoria automática. No dupliques nada que ya esté en este `CLAUDE.md`.

---

## 7. Estructura del repo (resumen)

```
2026_world_cup/
├── backend/          Node.js + Apollo GraphQL + Claude SDK
├── mobile/           React Native + Expo Router
├── db_init/          Schema PostgreSQL inicial (seed.sql)
├── docs/             Documentación interna (gitignored)
├── docker-compose.yml
├── CLAUDE.md         (este archivo)
├── HOOKS.md          documentación de hooks
└── .claude/
    └── settings.json permisos + hooks de Claude Code
```

Detalle completo: [docs/system/scafold.md](docs/system/scafold.md).

---

## 8. Contacto y escalación

- Cambios en `main`/`staging`/CI → solo lead técnico.
- Cambios en `db_init/seed.sql` → revisión obligatoria por backend lead.
- Cambios en costos (Claude API, infra) → aprobación previa.
- Si encuentras un secreto committeado por error: **rotarlo inmediatamente** y avisar.
