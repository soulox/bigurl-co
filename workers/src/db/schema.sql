CREATE TABLE IF NOT EXISTS links (
  id TEXT PRIMARY KEY,
  short_code TEXT UNIQUE NOT NULL,
  original_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  created_at INTEGER NOT NULL,
  expires_at INTEGER,
  password_hash TEXT,
  max_clicks INTEGER,
  click_count INTEGER DEFAULT 0,
  user_id TEXT,
  is_active BOOLEAN DEFAULT 1,
  custom_domain TEXT
);

CREATE INDEX IF NOT EXISTS idx_short_code ON links(short_code);
CREATE INDEX IF NOT EXISTS idx_user_id ON links(user_id);
CREATE INDEX IF NOT EXISTS idx_created_at ON links(created_at);

CREATE TABLE IF NOT EXISTS clicks (
  id TEXT PRIMARY KEY,
  link_id TEXT NOT NULL,
  clicked_at INTEGER NOT NULL,
  ip_address TEXT,
  country TEXT,
  city TEXT,
  referrer TEXT,
  user_agent TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT
);

CREATE INDEX IF NOT EXISTS idx_link_id ON clicks(link_id);
CREATE INDEX IF NOT EXISTS idx_clicked_at ON clicks(clicked_at);







