CREATE OR REPLACE FUNCTION public.get_hotel_disponibili()
RETURNS TABLE (
  id UUID,
  nome TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    h.id,
    h.nome
  FROM
    hotel h
  ORDER BY
    h.nome;
END;
$$ LANGUAGE plpgsql;
