const { chat: claudeChat, TOOL_DEFINITIONS } = require("../../config/claude");
const { checkRateLimit } = require("../../utils/rate_limiter");
const toolHandlers = require("../../tools");

const LANGUAGE_NAMES = {
  en: "English",
  es: "Spanish",
  fr: "French",
  pt: "Portuguese",
  de: "German",
  it: "Italian",
};

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
          reset_at: rateResult.reset_at,
        };
      }

      const languageName = LANGUAGE_NAMES[language] || "English";

      try {
        const messages = [{ role: "user", content: message }];

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

        // Extract text and visualization from response
        let textMessage = "";
        let visualization = null;

        for (const block of assistantContent) {
          if (block.type === "text") {
            textMessage += block.text;
          }
        }

        // Check if any tool results contained prediction data
        for (const msg of messages) {
          if (msg.role === "user" && Array.isArray(msg.content)) {
            for (const item of msg.content) {
              if (item.type === "tool_result") {
                try {
                  const data = JSON.parse(item.content);
                  if (data.homeWin !== undefined && data.draw !== undefined) {
                    visualization = {
                      type: "PROBABILITY_BARS",
                      data,
                    };
                  }
                } catch {
                  // Not JSON or no prediction data
                }
              }
            }
          }
        }

        return {
          message: textMessage,
          visualization,
          remaining_messages: rateResult.remaining,
          reset_at: rateResult.reset_at,
        };
      } catch (err) {
        console.error("[CHAT ERROR]:", err.message);
        return {
          message:
            "Pulpo's tentacles are tangled right now. Please try again in a moment.",
          visualization: null,
          remaining_messages: rateResult.remaining,
          reset_at: rateResult.reset_at,
        };
      }
    },
  },
};

module.exports = chatResolvers;
