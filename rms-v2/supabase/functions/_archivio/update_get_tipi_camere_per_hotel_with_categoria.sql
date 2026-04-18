-- Aggiorna la funzione esistente per supportare il filtro categoria
CREATE OR REPLACE FUNCTION get_tipi_camere_per_hotel(
  hotel_id_param TEXT,
  categoria_filter TEXT DEFAULT NULL
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
  WHERE tc.id_hotel = hotel_id_param::UUID
    AND (categoria_filter IS NULL OR tc.categoria = categoria_filter)
  ORDER BY tc.nome;
END;
$$;
