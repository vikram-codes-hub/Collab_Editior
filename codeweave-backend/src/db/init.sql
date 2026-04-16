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

-- ── Migrations: room_members ─────────────────────────────────
-- Rename legacy "userid" → "user_id" BEFORE CREATE TABLE / INDEX
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'room_members' AND column_name = 'userid'
  ) THEN
    ALTER TABLE room_members RENAME COLUMN userid TO user_id;
  END IF;
END $$;

-- Drop legacy index on old column name if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'room_members' AND indexname = 'idx_room_members_user'
  ) THEN
    DROP INDEX idx_room_members_user;
  END IF;
END $$;

-- ── Room Members ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS room_members (
  room_id   UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_room_members_user ON room_members(user_id);

-- ── Migrations: snapshots ────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'snapshots' AND column_name = 'content'
  ) THEN
    ALTER TABLE snapshots RENAME COLUMN content TO data;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'snapshots' AND column_name = 'saved_at'
  ) THEN
    ALTER TABLE snapshots RENAME COLUMN saved_at TO updated_at;
  END IF;
END $$;

-- ── Document Snapshots ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS snapshots (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id    UUID UNIQUE REFERENCES rooms(id) ON DELETE CASCADE,
  data       BYTEA NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_snapshots_room ON snapshots(room_id);

-- ── Migrations: notes ────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notes' AND column_name = 'userid'
  ) THEN
    ALTER TABLE notes RENAME COLUMN userid TO user_id;
  END IF;
END $$;

-- ── Notes (private per user per room) ───────────────────────
CREATE TABLE IF NOT EXISTS notes (
  room_id    UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_notes_room ON notes(room_id);
CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id);