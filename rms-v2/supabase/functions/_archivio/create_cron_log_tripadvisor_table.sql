-- Creazione della tabella per il logging dei cron job di Tripadvisor
CREATE TABLE IF NOT EXISTS cron_log_tripadvisor (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_name TEXT NOT NULL,
  status TEXT NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  hotels_processed INTEGER DEFAULT 0,
  hotels_success INTEGER DEFAULT 0,
  hotels_error INTEGER DEFAULT 0,
  reviews_imported INTEGER DEFAULT 0,
  details JSONB,
  error_message TEXT
);

-- Indice per migliorare le performance delle query
CREATE INDEX IF NOT EXISTS idx_cron_log_tripadvisor_job_name ON cron_log_tripadvisor(job_name);
CREATE INDEX IF NOT EXISTS idx_cron_log_tripadvisor_executed_at ON cron_log_tripadvisor(executed_at);
CREATE INDEX IF NOT EXISTS idx_cron_log_tripadvisor_status ON cron_log_tripadvisor(status);

-- Commento sulla tabella
COMMENT ON TABLE cron_log_tripadvisor IS 'Tabella per registrare le esecuzioni dei cron job di sincronizzazione Tripadvisor';
