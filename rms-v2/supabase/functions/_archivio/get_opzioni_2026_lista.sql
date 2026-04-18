-- Funzione per recuperare tutti i dati delle opzioni 2026 con nome hotel
CREATE OR REPLACE FUNCTION get_opzioni_2026_lista()
RETURNS TABLE (
  id bigint,
  created_at timestamp with time zone,
  id_hotel uuid,
  nome_hotel text,
  nome text,
  cellulare text,
  email text,
  note text
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.created_at,
    o.id_hotel,
    h.nome as nome_hotel,
    o.nome,
    o.cellulare,
    o.email,
    o.note
  FROM "opzioni 2026" o
  LEFT JOIN hotel h ON o.id_hotel = h.id
  ORDER BY o.created_at DESC;
END;
$$;
