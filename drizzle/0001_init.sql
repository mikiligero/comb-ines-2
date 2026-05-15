-- Comb-ines — schema v2 (sin Supabase, PostgreSQL puro)
-- Ejecutar como: psql $DATABASE_URL -f drizzle/0001_init.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL DEFAULT '',
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ropes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  color      TEXT NOT NULL,
  weight_g   INT  NOT NULL DEFAULT 0,
  rope_type  TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exercises (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS routines (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  description    TEXT DEFAULT '',
  transition_sec INT  NOT NULL DEFAULT 15,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS routine_blocks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  rope_id    UUID NOT NULL REFERENCES ropes(id),
  letter     TEXT NOT NULL,
  position   INT  NOT NULL,
  UNIQUE (routine_id, position)
);

CREATE TABLE IF NOT EXISTS routine_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id    UUID NOT NULL REFERENCES routine_blocks(id) ON DELETE CASCADE,
  position    INT  NOT NULL,
  kind        TEXT NOT NULL CHECK (kind IN ('ex','rest')),
  exercise_id UUID REFERENCES exercises(id),
  mode        TEXT CHECK (mode IN ('time','reps')),
  value       INT  NOT NULL,
  UNIQUE (block_id, position)
);

CREATE TABLE IF NOT EXISTS workouts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  routine_id            UUID REFERENCES routines(id),
  routine_name_snapshot TEXT,
  started_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at              TIMESTAMPTZ,
  duration_sec          INT,
  jumps                 INT DEFAULT 0,
  avg_hr                INT,
  calories              INT,
  ropes                 TEXT[] DEFAULT '{}',
  completed             BOOLEAN DEFAULT FALSE,
  notes                 TEXT
);
