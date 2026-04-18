-- Crea la tabella tripadvisor_import_log se non esiste
CREATE TABLE IF NOT EXISTS tripadvisor_import_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL,
  data_import TIMESTAMP WITH TIME ZONE DEFAULT now(),
  nuove_recensioni_importate INTEGER NOT NULL,
  recensioni_esistenti INTEGER NOT NULL,
  richieste_effettuate INTEGER NOT NULL
);

-- Aggiungi indici per migliorare le performance delle query
CREATE INDEX IF NOT EXISTS idx_tripadvisor_import_log_hotel_id ON tripadvisor_import_log(hotel_id);
CREATE INDEX IF NOT EXISTS idx_tripadvisor_import_log_data_import ON tripadvisor_import_log(data_import);
