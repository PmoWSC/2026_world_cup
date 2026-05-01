# HOOKS.md — Hooks activos en el proyecto

Los hooks son comandos que el harness de Claude Code ejecuta automáticamente en respuesta a eventos del ciclo de vida (antes de una tool, al iniciar sesión, etc.). Están definidos en [.claude/settings.json](.claude/settings.json).

**Importante:** los hooks corren en tu máquina, no en Claude. Modificarlos requiere que reinicies la sesión o ejecutes `/hooks` para que tomen efecto.

---

## Hooks activos

### 1. `PreToolUse` — Bloquear push a `main` / `master` / `staging`

| Campo | Valor |
|-------|-------|
| Evento | `PreToolUse` |
| Matcher | `Bash` |
| Filtro `if` | `Bash(git push*)` (solo se ejecuta si el comando empieza con `git push`) |
| Tipo | `command` |
| Timeout | 5s |

**Qué hace:** intercepta cualquier llamada a la tool `Bash` con un comando `git push` y, si el destino contiene `main`, `master` o `staging`, devuelve un JSON con `permissionDecision: "deny"` y un mensaje explicando la política.

**Comando (resumido):**
```bash
CMD=$(jq -r '.tool_input.command // ""')
case "$CMD" in
  *"git push"*main*|*"git push"*master*|*"git push"*staging*)
    echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"BLOQUEADO ..."}}'
    ;;
esac
```

**Por qué:** las ramas `main` y `staging` se actualizan exclusivamente vía Pull Request mergeado por un humano. Esto previene pushes accidentales que romperían CI o deployments.

**Cómo desactivarlo (solo emergencias documentadas):** editar [.claude/settings.json](.claude/settings.json) y comentar la entrada del hook. Cualquier desactivación debe quedar registrada en commit con justificación.

---

### 2. `SessionStart` — Inyectar reglas del proyecto

| Campo | Valor |
|-------|-------|
| Evento | `SessionStart` |
| Matcher | `""` (todas las sesiones) |
| Tipo | `command` |
| Timeout | 5s |

**Qué hace:** al iniciar la sesión, inyecta un recordatorio en el contexto del modelo: nombre del proyecto, ciclo obligatorio, prohibición de push a main/staging.

**Por qué:** garantiza que aún sin haber leído `CLAUDE.md` Claude tenga las reglas críticas de seguridad antes del primer turno.

---

## Cómo agregar un nuevo hook

1. **Identificar evento** — ¿`PreToolUse`, `PostToolUse`, `Stop`, `UserPromptSubmit`, `SessionStart`? La lista completa está en el [schema de settings](https://json.schemastore.org/claude-code-settings.json).
2. **Definir matcher** — `Bash`, `Write|Edit`, etc.
3. **Pipe-test antes de comprometerlo:**
   ```bash
   echo '{"tool_name":"Bash","tool_input":{"command":"<ejemplo>"}}' | <tu-comando>
   ```
4. **Validar JSON resultante** después de editar:
   ```bash
   jq empty .claude/settings.json
   ```
5. **Documentarlo aquí** — sección, motivo, cómo desactivar.
6. **Reiniciar sesión** o ejecutar `/hooks` para que el cambio tome efecto.

---

## Eventos disponibles (referencia rápida)

| Evento | Cuándo | Puede bloquear |
|--------|--------|----------------|
| `PreToolUse` | Antes de ejecutar una tool | Sí (`permissionDecision: "deny"`) |
| `PostToolUse` | Después de tool exitosa | Solo loggear / inyectar contexto |
| `PostToolUseFailure` | Después de tool con error | No |
| `UserPromptSubmit` | Cada vez que el usuario envía un mensaje | Puede inyectar contexto |
| `SessionStart` | Al iniciar la sesión | Solo inyectar contexto |
| `Stop` | Cuando Claude termina su turno | Puede pedir continuar (`asyncRewake`) |
| `PreCompact` / `PostCompact` | Antes/después de compactar | Inyectar contexto |
| `Notification` | Notificaciones del sistema | No |

---

## Convenciones para hooks de este proyecto

- **Siempre `timeout` explícito.** Default razonable: 5–30s.
- **Nunca depender de red** en hooks PreToolUse — bloquearían cada llamada.
- **Output silencioso por default.** Solo emitir JSON cuando hay decisión que comunicar.
- **No leer `.env`** desde un hook. Si necesitas un secreto, pásalo vía variable de entorno explícita en `env` de settings.
- **Hooks que escriben a disco** deben ser idempotentes (rerunable sin efecto secundario raro).

---

## Hooks futuros candidatos (NO implementados)

Estos no están activos pero serían buenos siguientes pasos. Discutir antes de implementar:

- **PostToolUse / Write|Edit:** correr `prettier --write` automáticamente sobre archivos `.js`/`.jsx`.
- **PostToolUse / Edit en `db_init/seed.sql`:** alertar — recordar que producción usa migraciones, no `seed.sql`.
- **PreToolUse / Bash:** bloquear `npm install -g` (no queremos instalar global desde el agente).
- **UserPromptSubmit:** detectar prompts que mencionen secretos (regex sobre `sk-`, `Bearer`, `eyJ...`) y advertir.
- **Stop:** verificar que no hay `console.log` con `JWT` o `password` introducidos en el turno.
