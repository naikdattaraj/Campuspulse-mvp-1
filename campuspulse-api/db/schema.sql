-- AI CampusPulse: PostgreSQL schema (safe to run more than once)

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL,
  email         TEXT        NOT NULL,
  password_hash TEXT        NOT NULL,
  role          TEXT        NOT NULL CHECK (role IN ('student', 'admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx ON users (lower(email));

-- Polls (US-04, US-05)
CREATE TABLE IF NOT EXISTS polls (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT        NOT NULL,
  expires_on DATE        NOT NULL,
  created_by UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS poll_options (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id  UUID    NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  label    TEXT    NOT NULL,
  position INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS poll_options_poll_idx ON poll_options (poll_id);

CREATE TABLE IF NOT EXISTS poll_votes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id    UUID        NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id  UUID        NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (poll_id, user_id)              -- one vote per student per poll
);

-- Events (US-11)
CREATE TABLE IF NOT EXISTS events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT        NOT NULL,
  event_date  DATE        NOT NULL,
  event_time  TIME        NOT NULL DEFAULT '10:00',
  location    TEXT        NOT NULL,
  description TEXT        NOT NULL DEFAULT '',
  created_by  UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_registrations (
  event_id   UUID        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);

-- Academic assessments (US-06)
CREATE TABLE IF NOT EXISTS assessments (
  id                 TEXT PRIMARY KEY,
  title              TEXT    NOT NULL,
  time_limit_minutes INTEGER NOT NULL,
  passing_score      INTEGER NOT NULL,
  instructions       JSONB   NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS assessment_questions (
  id            TEXT PRIMARY KEY,
  assessment_id TEXT    NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  position      INTEGER NOT NULL,
  category      TEXT    NOT NULL,
  text          TEXT    NOT NULL,
  options       JSONB   NOT NULL,          -- ["Queue", "Stack", ...]
  correct_index INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS assessment_attempts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id TEXT        NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score_percent INTEGER     NOT NULL,
  passed        BOOLEAN     NOT NULL,
  result        JSONB       NOT NULL,      -- full AssessmentResult payload
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS attempts_user_idx ON assessment_attempts (user_id, assessment_id, created_at DESC);

-- Career readiness (US-08, US-09)
CREATE TABLE IF NOT EXISTS career_questions (
  id       TEXT PRIMARY KEY,
  position INTEGER NOT NULL,
  category TEXT    NOT NULL CHECK (category IN ('technical', 'soft', 'aptitude')),
  skill    TEXT    NOT NULL,
  text     TEXT    NOT NULL,
  options  JSONB   NOT NULL                -- [{"text": "...", "points": 100}]
);

CREATE TABLE IF NOT EXISTS career_results (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  overall      INTEGER     NOT NULL,
  label        TEXT        NOT NULL,
  categories   JSONB       NOT NULL,
  improvements JSONB       NOT NULL,
  gaps         JSONB       NOT NULL,
  answers      JSONB       NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS career_user_idx ON career_results (user_id, created_at DESC);
