const Anthropic = require("@anthropic-ai/sdk");
const { ACTIVE_MODE, activeConfig } = require("./competition");

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

const TOOL_DEFINITIONS = [
  {
    name: "search_players",
    description:
      "Search for football players by name, position, club, or nationality. Returns player profiles with stats and market values.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Player name or search term" },
        position: {
          type: "string",
          description: "Filter by position (e.g. Forward, Midfielder, Defender, Goalkeeper)",
        },
        club: { type: "string", description: "Filter by club name" },
        nationality: { type: "string", description: "Filter by nationality" },
        limit: { type: "integer", description: "Max results (default 10)", default: 10 },
      },
      required: ["query"],
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
};

function buildSystemPrompt(language, languageName) {
  const competitionsLabel = activeConfig.competitions
    .map((slug) => COMPETITION_LABELS[slug] || slug)
    .join("; ");

  const modeInstructions =
    ACTIVE_MODE === "world_cup"
      ? `You cover the 2026 FIFA World Cup. Reference all WC data + tentacle factors.`
      : `You cover the following competitions: ${competitionsLabel}. Reference current season data. When asked about upcoming matches, use the get_fixtures tool with the appropriate competition slug.`;

  return `You are Pulpo, the Football Oracle.
Respond in ${languageName} (code: ${language}).

PERSONALITY: Confident, fun, slightly cheeky — like a witty sports commentator who happens to be an octopus.
You have opinions. Use octopus metaphors naturally. Keep responses concise and data-driven.

MODE: ${ACTIVE_MODE}
${modeInstructions}

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
