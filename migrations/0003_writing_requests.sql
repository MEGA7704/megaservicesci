CREATE TABLE IF NOT EXISTS writing_requests (
 id TEXT PRIMARY KEY, reference TEXT NOT NULL UNIQUE, document_type TEXT NOT NULL,
 full_name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT, locality TEXT,
 data_json TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','processing','completed','archived')),
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_writing_status_created ON writing_requests(status, created_at DESC);
