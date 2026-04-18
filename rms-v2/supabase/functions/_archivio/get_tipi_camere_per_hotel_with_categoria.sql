-- Aggiorna la funzione per filtrare per categoria
CREATE OR REPLACE FUNCTION get_tipi_camere_per_hotel(
  hotel_id_param TEXT,
  categoria_filter TEXT DEFAULT 'attivo'
)
RETURNS TABLE (
  id TEXT,
  nome TEXT,
  tipo TEXT,
  livello TEXT,
  letti INTEGER,
  paxmax INTEGER
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tc.id::TEXT,
    tc.nome::TEXT,
    tc.tipo::TEXT,
    tc.livello::TEXT,
    tc.letti::INTEGER,
    tc.paxmax::INTEGER
  FROM tipi_camere tc
  WHERE tc.hotel_id = hotel_id_param::UUID
    AND tc.categoria = categoria_filter
  ORDER BY tc.nome;
END;
$$;
