CREATE OR REPLACE FUNCTION get_hotel_per_strategia_prezzi()
RETURNS TABLE (
  id uuid,
  nome text
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.id,
    h.nome
  FROM hotel h
  ORDER BY h.nome;
END;
$$;
