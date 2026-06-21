-- Backfills the is_active column that login.js already checks but the
-- live users table never had (schema.sql documents it; nobody ever ran
-- an ALTER for it against production). Kept in its own file because
-- SQLite's "ADD COLUMN" has no IF NOT EXISTS guard, and D1 runs an
-- entire --file in one batch that aborts whole on first error — so this
-- must not be bundled with statements that are safe to re-run.
ALTER TABLE users ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1;
