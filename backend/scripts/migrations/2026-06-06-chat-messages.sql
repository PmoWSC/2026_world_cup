-- Migration: chat_messages table for conversation context.
--
-- Pulpo's chat is fully stateless today (each message goes to Claude
-- with no history). This table lets the resolver load the last N
-- user/assistant turns so Claude has conversational memory, without
-- any frontend or GraphQL schema changes.
--
-- session_id = the same identifier already used for rate limiting
-- (sessionId for anonymous users, user.id for authenticated ones).
-- Only the final plain-text content of each turn is stored — tool-use
-- intermediate blocks are not persisted.
--
-- Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_created
  ON chat_messages (session_id, created_at DESC);
