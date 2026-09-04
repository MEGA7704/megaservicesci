PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT 'Diabo',
  contract_type TEXT NOT NULL DEFAULT 'À définir',
  description TEXT NOT NULL,
  requirements TEXT,
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by TEXT
);

CREATE TABLE IF NOT EXISTS job_applications (
  id TEXT PRIMARY KEY,
  job_id TEXT,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  locality TEXT,
  position_sought TEXT,
  education TEXT,
  experience TEXT,
  skills TEXT,
  cv_url TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','reviewed','shortlisted','rejected','archived')),
  created_at TEXT NOT NULL,
  FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_jobs_active_created ON jobs(active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_status_created ON job_applications(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_job ON job_applications(job_id);
