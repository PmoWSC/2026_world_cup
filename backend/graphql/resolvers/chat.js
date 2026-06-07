const { chat: claudeChat } = require("../../config/claude");
const { checkRateLimit } = require("../../utils/rate_limiter");
const { query } = require("../../config/db");
const toolHandlers = require("../../tools");

// How many previous turns (user + assistant pairs) to load as context.
// 5 pairs = up to 10 rows from chat_messages.
const HISTORY_PAIRS = 5;

const LANGUAGE_NAMES = {
  en: "English",
  es: "Spanish",
  fr: "French",
  pt: "Portuguese",
  de: "German",
  it: "Italian",
};

// Load the last HISTORY_PAIRS turns for a session from chat_messages,
// ordered oldest-first so they form a valid alternating messages array.
// Returns [] gracefully if the table does not yet exist (pre-migration).
async function loadHistory(sessionId) {
  try {
    const r = await query(
      `SELECT role, content FROM (
         SELECT role, content, created_at
         FROM chat_messages
         WHERE session_id = $1
         ORDER BY created_at DESC
         LIMIT $2
       ) recent
       ORDER BY created_at ASC`,
      [sessionId, HISTORY_PAIRS * 2]
    );
    return r.rows.map((row) => ({ role: row.role, content: row.content }));
  } catch {
    // chat_messages table not yet created — run the migration.
    return [];
  }
}

// Persist a single user or assistant turn. Fire-and-forget (errors
// are logged but do not break the response flow).
async function saveMessage(sessionId, role, content) {
  try {
    await query(
      "INSERT INTO chat_messages (session_id, role, content) VALUES ($1, $2, $3)",
      [sessionId, role, content]
    );
  } catch (err) {
    console.warn("[CHAT HISTORY] save failed:", err.message);
  }
}

const chatResolvers = {
  Mutation: {
    async chat(_parent, { message, language = "en", sessionId }, context) {
      const isAnonymous = !context.user;
      const identifier = isAnonymous ? sessionId : context.user.id;
      if (!identifier) {
        throw new Error("Session ID is required for anonymous users");
      }

      const rateResult = await checkRateLimit(identifier, isAnonymous);
      if (!rateResult.allowed) {
        return {
          message: "",
          visualization: null,
          remaining_messages: 0,
          daily_limit: rateResult.limit,
          reset_at: rateResult.reset_at,
        };
      }

      const languageName = LANGUAGE_NAMES[language] || "English";

      try {
        // Load conversation history, then append the new user message.
        const history = await loadHistory(identifier);
        const messages = [...history, { role: "user", content: message }];

        let response = await claudeChat(messages, language, languageName);
        let assistantContent = response.content;

        // Process tool use loop
        while (response.stop_reason === "tool_use") {
          const toolUseBlocks = assistantContent.filter(
            (block) => block.type === "tool_use"
          );

          const toolResults = [];
          for (const toolUse of toolUseBlocks) {
            const handler = toolHandlers[toolUse.name];
            let result;
            if (handler) {
              try {
                result = await handler(toolUse.input);
              } catch (err) {
                result = { error: err.message };
              }
            } else {
              result = { error: `Unknown tool: ${toolUse.name}` };
            }

            toolResults.push({
              type: "tool_result",
              tool_use_id: toolUse.id,
              content: JSON.stringify(result),
            });
          }

          messages.push({ role: "assistant", content: assistantContent });
          messages.push({ role: "user", content: toolResults });

          response = await claudeChat(messages, language, languageName);
          assistantContent = response.content;
        }

        // Extract text and visualization from final response.
        let textMessage = "";
        let visualization = null;

        for (const block of assistantContent) {
          if (block.type === "text") {
            textMessage += block.text;
          }
        }

        for (const msg of messages) {
          if (msg.role === "user" && Array.isArray(msg.content)) {
            for (const item of msg.content) {
              if (item.type === "tool_result") {
                try {
                  const data = JSON.parse(item.content);
                  if (data.homeWin !== undefined && data.draw !== undefined) {
                    visualization = { type: "PROBABILITY_BARS", data };
                  }
                } catch {
                  // Not JSON or no prediction data.
                }
              }
            }
          }
        }

        // Persist this turn so the next message can load it as context.
        // Only the plain-text content is stored (no tool-use blocks).
        await saveMessage(identifier, "user", message);
        if (textMessage) await saveMessage(identifier, "assistant", textMessage);

        return {
          message: textMessage,
          visualization,
          remaining_messages: rateResult.remaining,
          daily_limit: rateResult.limit,
          reset_at: rateResult.reset_at,
        };
      } catch (err) {
        console.error("[CHAT ERROR]:", err.message);
        return {
          message:
            "Pulpo's tentacles are tangled right now. Please try again in a moment.",
          visualization: null,
          remaining_messages: rateResult.remaining,
          daily_limit: rateResult.limit,
          reset_at: rateResult.reset_at,
        };
      }
    },
  },
};

module.exports = chatResolvers;
