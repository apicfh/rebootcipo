-- Tabella per registrare l'esecuzione dei cron job
CREATE TABLE IF NOT EXISTS cron_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_name TEXT NOT NULL,
  status TEXT NOT NULL,
  hotels_processed INTEGER,
  hotels_success INTEGER,
  hotels_error INTEGER,
  reviews_imported INTEGER,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indice per migliorare le performance delle query
CREATE INDEX IF NOT EXISTS idx_cron_log_job_name ON cron_log(job_name);
CREATE INDEX IF NOT EXISTS idx_cron_log_created_at ON cron_log(created_at);
