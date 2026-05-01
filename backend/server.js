try {
  require("dotenv").config();

  const express = require("express");
  const cors = require("cors");
  const helmet = require("helmet");
  const { ApolloServer } = require("@apollo/server");
  const { expressMiddleware } = require("@apollo/server/express4");
  const typeDefs = require("./graphql/typeDefs");
  const resolvers = require("./graphql/resolvers");
  const { extractUser } = require("./auth/middleware");
  const { TOOL_DEFINITIONS } = require("./config/claude");
  const { ACTIVE_MODE } = require("./config/competition");

  const app = express();
  const PORT = process.env.PORT || 4000;

  const introspectionEnabled =
    process.env.GRAPHQL_INTROSPECTION_ENABLED === "true";

  async function start() {
    const server = new ApolloServer({
      typeDefs,
      resolvers,
      introspection: introspectionEnabled,
      formatError: (formattedError) => {
        console.error("[GRAPHQL ERROR]:", formattedError.message);
        return {
          message: formattedError.message,
          locations: formattedError.locations,
          path: formattedError.path,
        };
      },
    });

    await server.start();

    const isProduction = process.env.NODE_ENV === "production";

    app.use(
      helmet({
        contentSecurityPolicy: isProduction ? undefined : false,
        crossOriginEmbedderPolicy: false,
      })
    );

    // Minimal liveness probe for Caddy / Docker HEALTHCHECK.
    // No internal info leaked.
    app.get("/healthz", (_req, res) => {
      res.status(200).json({ status: "ok" });
    });

    // Verbose health for internal dashboards. May reveal mode + tool count.
    app.get("/health", (_req, res) => {
      res.json({
        status: "ok",
        mode: ACTIVE_MODE,
        tools: TOOL_DEFINITIONS.length,
        timestamp: new Date().toISOString(),
      });
    });

    const allowedOrigins = process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    // Native mobile apps do not send an Origin header. Requests without
    // Origin are allowed; browser requests must match the allowlist.
    const corsOptions = {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`CORS: origin ${origin} not allowed`));
      },
    };

    app.use(
      "/graphql",
      cors(corsOptions),
      express.json(),
      expressMiddleware(server, {
        context: async ({ req }) => {
          const user = extractUser(req);
          return { user };
        },
      })
    );

    app.listen(PORT, () => {
      console.log(`[INFO] Apollo Server started on port ${PORT}`);
      console.log(`[INFO] Competition mode: ${ACTIVE_MODE}`);
      console.log(`[INFO] ${TOOL_DEFINITIONS.length} tools registered`);
      console.log(
        `[INFO] GraphQL introspection: ${introspectionEnabled ? "enabled" : "disabled"}`
      );
    });
  }

  start();
} catch (error) {
  console.error("[FATAL STARTUP ERROR]:", error);
  process.exit(1);
}
