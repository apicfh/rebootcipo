-- Crea la tabella per i competitor
CREATE TABLE IF NOT EXISTS competitor (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotel(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tripadvisor_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crea un indice per velocizzare le query per hotel_id
CREATE INDEX IF NOT EXISTS competitor_hotel_id_idx ON competitor(hotel_id);

-- Aggiungi i permessi per gli utenti autenticati
ALTER TABLE competitor ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gli utenti autenticati possono leggere i competitor"
  ON competitor FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Gli utenti autenticati possono inserire i competitor"
  ON competitor FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Gli utenti autenticati possono aggiornare i competitor"
  ON competitor FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Gli utenti autenticati possono eliminare i competitor"
  ON competitor FOR DELETE
  TO authenticated
  USING (true);
