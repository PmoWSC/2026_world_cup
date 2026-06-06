const Anthropic = require("@anthropic-ai/sdk");
const { ACTIVE_MODE, activeConfig } = require("./competition");

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

const TOOL_DEFINITIONS = [
  {
    name: "search_players",
    description:
      "Search for football players. Provide at least one of: query (player name fragment), club (substring of club name, e.g. 'Junior', 'Tolima', 'Real Madrid'), or nationality. To list a club's roster pass only club. Returns player profiles with stats and market values.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Optional. Player name fragment (e.g. 'Nunez', 'Vinicius'). Leave empty to list everyone matching the other filters." },
        position: {
          type: "string",
          description: "Filter by position (e.g. Forward, Midfielder, Defender, Goalkeeper)",
        },
        club: { type: "string", description: "Substring of the club name. ALWAYS pass the SHORT/common name only (e.g. 'Junior', 'Tolima', 'Boca', 'Real Madrid'), NEVER the full descriptive name (e.g. 'Junior de Barranquilla' or 'Boca Juniors of Argentina'). Match is accent-insensitive and case-insensitive against both full and short names." },
        nationality: { type: "string", description: "Filter by nationality" },
        limit: { type: "integer", description: "Max results (default 10)", default: 10 },
      },
    },
  },
  {
    name: "get_squad",
    description:
      "Get the full squad roster for a team, including positions, shirt numbers, and market values.",
    input_schema: {
      type: "object",
      properties: {
        country: { type: "string", description: "Country name or FIFA code" },
        competition: { type: "string", description: "Competition slug (e.g. la_liga_2025)" },
      },
      required: ["country"],
    },
  },
  {
    name: "predict_match",
    description:
      "Generate win/draw/loss probability predictions for a match between two teams using multiple statistical models.",
    input_schema: {
      type: "object",
      properties: {
        home_team: { type: "string", description: "Home team name" },
        away_team: { type: "string", description: "Away team name" },
        competition: { type: "string", description: "Competition slug" },
      },
      required: ["home_team", "away_team"],
    },
  },
  {
    name: "find_connections",
    description:
      "Find connections between two national teams: shared club history, transfers, common agents, and personnel links.",
    input_schema: {
      type: "object",
      properties: {
        team_a: { type: "string", description: "First team name or FIFA code" },
        team_b: { type: "string", description: "Second team name or FIFA code" },
      },
      required: ["team_a", "team_b"],
    },
  },
  {
    name: "get_head_to_head",
    description:
      "Get historical head-to-head record between two teams, including past results and patterns.",
    input_schema: {
      type: "object",
      properties: {
        team_a: { type: "string", description: "First team name" },
        team_b: { type: "string", description: "Second team name" },
        competition: { type: "string", description: "Filter by competition" },
      },
      required: ["team_a", "team_b"],
    },
  },
  {
    name: "get_fixtures",
    description:
      "Get upcoming or past fixtures filtered by competition, team, date range, or status.",
    input_schema: {
      type: "object",
      properties: {
        competition: { type: "string", description: "Competition slug" },
        team: { type: "string", description: "Team name to filter" },
        status: {
          type: "string",
          description: "Match status: scheduled, live, finished",
        },
        date_from: { type: "string", description: "Start date (YYYY-MM-DD)" },
        date_to: { type: "string", description: "End date (YYYY-MM-DD)" },
        limit: { type: "integer", description: "Max results (default 10)", default: 10 },
      },
    },
  },
  {
    name: "get_tentacle_factors",
    description:
      "Get hidden match factors: altitude, climate, recovery days, travel distance, and referee tendencies. Only available in World Cup mode.",
    input_schema: {
      type: "object",
      properties: {
        home_team: { type: "string", description: "Home team name" },
        away_team: { type: "string", description: "Away team name" },
        venue: { type: "string", description: "Venue name" },
      },
      required: ["home_team", "away_team"],
    },
  },
  {
    name: "get_group_standings",
    description:
      "Get current standings for a World Cup group or league competition.",
    input_schema: {
      type: "object",
      properties: {
        competition: { type: "string", description: "Competition slug" },
        group: { type: "string", description: "Group name (e.g. A, B)" },
      },
      required: ["competition"],
    },
  },
  {
    name: "semantic_search",
    description:
      "Search for relevant football data using natural language. Uses vector embeddings for semantic matching across players, stats, and history.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Natural language search query" },
        limit: { type: "integer", description: "Max results (default 5)", default: 5 },
      },
      required: ["query"],
    },
  },
  {
    name: "get_live_scores",
    description: "Get current live match scores and status updates.",
    input_schema: {
      type: "object",
      properties: {
        competition: { type: "string", description: "Filter by competition slug" },
      },
    },
  },
  {
    name: "get_league_standings",
    description:
      "Get current league table with positions, points, wins, draws, losses, and goal difference.",
    input_schema: {
      type: "object",
      properties: {
        competition: {
          type: "string",
          description: "Competition slug (e.g. la_liga_2025, premier_league_2025)",
        },
      },
      required: ["competition"],
    },
  },
];

const COMPETITION_LABELS = {
  la_liga_2025: "La Liga 2025-2026 (Spain)",
  premier_league_2025: "Premier League 2025-2026 (England)",
  libertadores_2026: "Copa Libertadores 2026 (CONMEBOL, includes Colombian clubs)",
  world_cup_2026: "2026 FIFA World Cup",
  internationals_2026: "2026 national-team friendlies (warm-up matches before the World Cup)",
};

function buildSystemPrompt(language, languageName) {
  const competitionsLabel = activeConfig.competitions
    .map((slug) => `\`${slug}\` — ${COMPETITION_LABELS[slug] || slug}`)
    .join("; ");
  const validSlugs = activeConfig.competitions.join(", ");

  const modeInstructions =
    ACTIVE_MODE === "world_cup"
      ? `You cover the 2026 FIFA World Cup and national-team friendlies. Reference all WC data + tentacle factors. Use these competition slugs when calling tools (exact, in backticks): ${competitionsLabel}. Use \`world_cup_2026\` for tournament matches and \`internationals_2026\` for warm-up friendlies. Never invent or guess slug variants.`
      : `You cover the following competitions (use the exact slug shown in backticks when calling tools): ${competitionsLabel}. Reference current season data. When asked about upcoming matches, call the get_fixtures tool with one of these slugs ONLY: ${validSlugs}. Never invent or guess slug variants.`;

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const weekday = now.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
  const time = now.toISOString().slice(11, 16);

  return `You are Pulpo, the Football Oracle.
Respond in ${languageName} (code: ${language}).

TODAY IS ${today} (${weekday}), current time ${time} UTC. Treat this as the present moment.
When the user asks about the "next", "upcoming", or "próximo" match, call get_fixtures
with date_from = ${today} and status "scheduled", then pick the soonest one. Do not call a
match "next" or "upcoming" without checking its date against today. A match whose date is
before today has already been played — use its result, do not predict it.

PERSONALITY: Confident, fun, slightly cheeky — like a witty sports commentator who happens to be an octopus.
You have opinions. Use octopus metaphors naturally. Keep responses concise and data-driven.

DEBATE STANCE (very important — apply to ANY pushback from the user about a prediction or claim):
- Defend your predictions with concrete numbers from the model. Example:
  "Le doy 65% al Madrid porque su valor de plantilla es €1.4B vs €800M del Barça,
   y su forma reciente en los últimos 10 es 7W-2D-1L".
- Do NOT cave to vague pushback like "te equivocas", "el Madrid está mal", "Barça
  los va a ganar". Push back politely but firmly: "¿En qué te basas? Mis datos
  apuntan a lo contrario porque [razón concreta]". Ask the user for specifics
  before you reconsider anything.
- Reconsider ONLY when the user gives you a NEW concrete data point that your
  model could not have known: an injury, a suspension, a manager change, a
  motivational angle, a tactical decision, recent news. When that happens:
    1. Acknowledge it openly: "Si esa lesión es cierta, sí cambia el cuadro".
    2. Estimate a new percentage VERBALLY (no need to recompute the model).
    3. Be transparent that the model still says the original number until the
       new fact is in the database. Show both: "Modelo: 65/18/17 · Con la lesión: 55/22/23".
- Never become sycophantic. Never agree just to please the user. If the user
  insists with no new data, hold your ground with humour, not aggression.
- Treat football debate as the core of the experience: a smart football fan
  should leave a chat with you feeling they had a real conversation, not a
  yes-machine. You ARE allowed to disagree, you ARE allowed to be wrong, but
  always with reasons.

MODE: ${ACTIVE_MODE}
${modeInstructions}

DATA SCOPE — what you HAVE for each player in the database:
- Full name and short name
- Position (Goalkeeper, Defender, Midfielder, Forward)
- Date of birth and nationality
- Current club
- Market value in euros (when available)

DATA SCOPE — what you DO NOT have (be upfront, do NOT invent these):
- Per-season stats: goals scored, assists, minutes played, appearances,
  yellow/red cards, shots, pass completion, xG, etc.
- Per-match player events (who scored, who assisted)
- Injury status, suspensions, contract details
- Transfer history beyond the current club

If the user asks for any of the unavailable fields, say briefly that
you don't have that data right now and offer what you CAN do instead
(plantilla / squad, posición, valor de mercado, predicciones, fixtures,
clasificación, cara a cara con históricos de Copa del Mundo).

RULES:
- Always use tools to fetch real data before making claims. Never fabricate statistics.
- When showing predictions, explain the model breakdown briefly.
- Use the user's language for all responses, but keep team/player names in their original form.
- If a user asks about something outside your data scope, say so honestly.`;
}

async function chat(messages, language = "en", languageName = "English") {
  const systemPrompt = buildSystemPrompt(language, languageName);

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: systemPrompt,
    tools: TOOL_DEFINITIONS,
    messages,
  });

  return response;
}

module.exports = { client, TOOL_DEFINITIONS, chat, buildSystemPrompt };
