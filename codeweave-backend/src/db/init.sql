-- ── Enable UUID extension ───────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Users ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email      TEXT UNIQUE NOT NULL,
  username   TEXT NOT NULL,
  password   TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ── Rooms ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rooms (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  language   TEXT NOT NULL DEFAULT 'javascript',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rooms_created_by ON rooms(created_by);

-- ── Room Members ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS room_members (
  room_id   UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_room_members_user ON room_members(user_id);

-- ── Document Snapshots ──────────────────────────────────────
-- Stores Yjs binary (BYTEA). Column is named "data".
CREATE TABLE IF NOT EXISTS snapshots (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id    UUID UNIQUE REFERENCES rooms(id) ON DELETE CASCADE,
  data       BYTEA NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fix column name if table was created with "content" instead of "data"
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'snapshots' AND column_name = 'content'
  ) THEN
    ALTER TABLE snapshots RENAME COLUMN content TO data;
  END IF;
END $$;

-- Fix column name if table was created with "saved_at" instead of "updated_at"
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'snapshots' AND column_name = 'saved_at'
  ) THEN
    ALTER TABLE snapshots RENAME COLUMN saved_at TO updated_at;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_snapshots_room ON snapshots(room_id);

-- ── Notes (private per user per room) ───────────────────────
-- Each user has their own private notepad in each room.
-- Other users cannot see or know who wrote what.
CREATE TABLE IF NOT EXISTS notes (
  room_id    UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_notes_room ON notes(room_id);
CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id);