CREATE TABLE owners (
  id UUID PRIMARY KEY,
  site_slug TEXT NOT NULL UNIQUE CHECK (site_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  display_name TEXT NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 120),
  username TEXT NOT NULL UNIQUE CHECK (username ~ '^[a-z0-9-]{3,32}$'),
  password_hash TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE owner_sessions (
  token_hash CHAR(64) PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  csrf_token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL CHECK (expires_at > created_at)
);
CREATE INDEX owner_sessions_owner_expiry ON owner_sessions(owner_id, expires_at);

CREATE TABLE enquiries (
  id UUID PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  visitor_name TEXT NOT NULL CHECK (char_length(visitor_name) BETWEEN 1 AND 120),
  visitor_email TEXT NOT NULL CHECK (char_length(visitor_email) BETWEEN 3 AND 254),
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 10 AND 4000),
  request_key UUID NOT NULL,
  payload_hash CHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (owner_id, request_key)
);
CREATE INDEX enquiries_owner_recent ON enquiries(owner_id, created_at DESC, id DESC);
