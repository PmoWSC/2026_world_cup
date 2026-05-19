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

## Regla de idioma (REGLA DURA — sin excepciones)

**Todo texto que Claude genere — respuestas de chat, documentos, páginas web, comentarios de UI, mensajes de commit, copy de la app, descripciones de Test Information, etc. — debe estar escrito en español con dialecto colombiano neutro. Sin voseo. Sin excepciones.**

David lo ha corregido dos veces (privacy policy + testers guide) — la regla no es opcional.

### Voseo PROHIBIDO

Lista no exhaustiva de formas argentinas/rioplatenses que **NUNCA** se deben usar:

| Categoría | Prohibido (voseo) | Correcto en `tú` | Correcto en `usted` |
|---|---|---|---|
| Pres. ind. 2ª pers. | tenés, podés, sabés, querés, decís, vos, sos | tienes, puedes, sabes, quieres, dices, tú, eres | tiene, puede, sabe, quiere, dice, usted, es |
| Imperativos | armá, registrate, unite, cerrá, volvé, hacé, mirá, vení, comé, escribí, tocá, pegá, llená, instalá | arma, regístrate, únete, cierra, vuelve, haz, mira, ven, come, escribe, toca, pega, llena, instala | arme, regístrese, únase, cierre, vuelva, haga, mire, venga, coma, escriba, toque, pegue, llene, instale |
| Pronombres enclíticos | compartilo, aceptalo, contame, decime, escribime, mandalo | compártelo, acéptalo, cuéntame, dime, escríbeme, mándalo | compártalo, acéptelo, cuénteme, dígame, escríbame, mándelo |
| Pres. ind. otros | elegís, ponés, tomás, mandás, quedás | eliges, pones, tomas, mandas, quedas | elige, pone, toma, manda, queda |
| Otros marcadores | dale, che, boludo, pibe, mirá vos, sabelo | (sin equivalente — eliminar) | (sin equivalente — eliminar) |

### Cómo elegir tú vs. usted

- **`tú`**: UI casual, chat con amigos, testers guide, copy de la app, marketing en redes.
- **`usted`**: documentos legales (privacy, términos), manuales técnicos formales, contactos con clientes corporativos.

### Otras reglas

- Documentos bilingües (ES + EN) son válidos cuando el público objetivo lo requiere (ej. privacy policy). La porción en español sigue las reglas anteriores; la porción en inglés se mantiene en su redacción original.
- Identificadores técnicos (variables, funciones, comandos, claves de config, nombres propios) se quedan en su idioma original — no se traduce `commit`, `merge`, `healthz`, `bundleIdentifier`, etc.

### Checklist mental antes de mandar texto en español

1. ¿Hay imperativos? Verificar que están en forma `tú` o `usted`, no en `vos`.
2. ¿Hay verbos 2ª persona presente? Buscar las terminaciones sospechosas `-ás`, `-és`, `-ís` finales — son banderas rojas.
3. ¿Hay enclíticos? Verificar que el acento cae donde debe (`compártelo`, no `compartilo`).
4. ¿Aparece la palabra `vos` o `sos`? Reescribir.
5. Cuando dudes, leer en voz alta con acento bogotano. Si suena raro, está mal.

---

## Hooks futuros candidatos (NO implementados)

Estos no están activos pero serían buenos siguientes pasos. Discutir antes de implementar:

- **PostToolUse / Write|Edit:** correr `prettier --write` automáticamente sobre archivos `.js`/`.jsx`.
- **PostToolUse / Edit en `db_init/seed.sql`:** alertar — recordar que producción usa migraciones, no `seed.sql`.
- **PreToolUse / Bash:** bloquear `npm install -g` (no queremos instalar global desde el agente).
- **UserPromptSubmit:** detectar prompts que mencionen secretos (regex sobre `sk-`, `Bearer`, `eyJ...`) y advertir.
- **Stop:** verificar que no hay `console.log` con `JWT` o `password` introducidos en el turno.
