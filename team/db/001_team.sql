CREATE TABLE IF NOT EXISTS team_member (
  email text PRIMARY KEY,
  role text NOT NULL CHECK (role IN ('admin', 'editor', 'reviewer', 'viewer')),
  invited_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content_series (
  id uuid PRIMARY KEY,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
  document jsonb NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'scheduled', 'published')),
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_by text NOT NULL,
  updated_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS content_series_updated_idx ON content_series (updated_at DESC);
CREATE INDEX IF NOT EXISTS content_series_status_idx ON content_series (status, updated_at DESC);

CREATE TABLE IF NOT EXISTS content_series_history (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  series_id uuid NOT NULL REFERENCES content_series(id) ON DELETE CASCADE,
  revision integer NOT NULL,
  document jsonb NOT NULL,
  status text NOT NULL,
  changed_by text NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (series_id, revision)
);

CREATE TABLE IF NOT EXISTS content_series_comment (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  series_id uuid NOT NULL REFERENCES content_series(id) ON DELETE CASCADE,
  slide_id text,
  author_name text NOT NULL,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS content_series_comment_series_idx ON content_series_comment (series_id, id DESC);

CREATE TABLE IF NOT EXISTS content_media (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  mime text NOT NULL CHECK (mime IN ('image/jpeg', 'image/png', 'image/webp')),
  data bytea NOT NULL CHECK (octet_length(data) BETWEEN 12 AND 5000000),
  preview bytea NOT NULL CHECK (octet_length(preview) BETWEEN 12 AND 250000),
  tags text NOT NULL,
  credit text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content_format_draft (
  id uuid PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('email', 'threads')),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
  document jsonb NOT NULL,
  revision integer NOT NULL DEFAULT 1,
  updated_by text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS content_format_draft_kind_idx ON content_format_draft (kind, updated_at DESC);
