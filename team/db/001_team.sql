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
