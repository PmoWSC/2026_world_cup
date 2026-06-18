#!/usr/bin/env bash
# .claude/hooks/check_no_voseo.sh
#
# Stop hook: bloquea respuestas de Claude que contienen voseo
# (argentino/rioplatense). Implementa la regla dura de idioma
# definida en HOOKS.md ("Regla de idioma — REGLA DURA") y
# CLAUDE.md §3 ("Idioma").
#
# Mecanica:
#   1. Lee la transcripcion JSONL desde el campo transcript_path.
#   2. Extrae el ultimo mensaje del asistente (todos sus bloques text).
#   3. Quita bloques de codigo (``` ``` y `...`) para no flaggear
#      ejemplos cuando se documenta la regla en si.
#   4. Hace grep case-insensitive contra una lista de formas voseo.
#   5. Si encuentra alguna, devuelve JSON {"decision":"block","reason":...}
#      que obliga a Claude a reescribir la respuesta.
#
# Si jq o perl no estan instalados, el hook hace exit 0 (no rompe).

set -eu

INPUT=$(cat)

if ! command -v jq >/dev/null 2>&1; then
  exit 0
fi

TRANSCRIPT_PATH=$(echo "$INPUT" | jq -r '.transcript_path // ""')

if [ -z "$TRANSCRIPT_PATH" ] || [ ! -f "$TRANSCRIPT_PATH" ]; then
  exit 0
fi

# Concat all text blocks of the last assistant message in the transcript.
LAST_MSG=$(jq -rs '[.[] | select(.message.role == "assistant")] | last | .message.content[]? | select(.type == "text") | .text' "$TRANSCRIPT_PATH" 2>/dev/null || echo "")

if [ -z "$LAST_MSG" ]; then
  exit 0
fi

# Strip code blocks (``` ... ```) and inline code (`...`) para no
# flaggear cuando se documenta la regla con ejemplos en codigo.
if command -v perl >/dev/null 2>&1; then
  CLEANED=$(printf '%s' "$LAST_MSG" | perl -0777 -pe 's/```.*?```//gs; s/`[^`\n]*`//g')
else
  CLEANED="$LAST_MSG"
fi

# Patrones voseo prohibidos. Acentos requeridos para minimizar falsos
# positivos (palabras como "tomas" sin acento NO son voseo; "tomás" si).
PATTERN='\b(tenés|podés|sabés|querés|decís|sos|armá|registrate|unite|cerrá|cerralo|volvé|hacé|hacelo|mirá|miralo|vení|comé|escribí|escribime|tocá|tocala|pegá|llená|instalá|dale|contame|decime|compartilo|aceptalo|probá|probalo|elegís|ponés|tomás|mandás|mandalo|quedás|andá|sentí|sentate|fijate|escuchá|encontrá|seguí|usá|usalo|cargá|enviá|abrí|copiate|comprate|leéte|olvidate|consultá|chequeá|veni|tomate|hacete|generá|verificá|revisá|ejecutá|pegale|reiniciá|guardá|borrá|publicá|subí|llamá|tirá|esperá|cliqueá|reemplazá|seleccioná|presioná|arrastrá|deslizá)\b'

if echo "$CLEANED" | grep -iqE "$PATTERN"; then
  MATCHED=$(echo "$CLEANED" | grep -ioE "$PATTERN" | sort -u | head -8 | tr '\n' ',' | sed 's/,$//')
  jq -n --arg matched "$MATCHED" '{
    "decision": "block",
    "reason": ("BLOQUEADO por regla de idioma del proyecto: tu respuesta contiene voseo prohibido (formas detectadas: " + $matched + "). Reescribir COMPLETA en espanol colombiano neutro: usar forma tu (haz, ve, registra, cierra, vuelve, toca) o forma usted (haga, vea, registrese, cierre, vuelva, toque) segun el registro. NO usar voseo argentino (hacé, registrate, cerrá, volvé, tocá, tenés, podés, vos, sos, etc.). Ver HOOKS.md y CLAUDE.md seccion Idioma.")
  }'
fi

exit 0
