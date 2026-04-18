CREATE OR REPLACE FUNCTION get_opzioni_2026_statistiche()
RETURNS TABLE (
  data date,
  id_hotel uuid,
  nome_hotel text,
  totale_opzioni bigint
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(o.created_at) as data,
    o.id_hotel,
    h.nome as nome_hotel,
    COUNT(*) as totale_opzioni
  FROM "opzioni 2026" o
  JOIN hotel h ON o.id_hotel = h.id
  WHERE DATE(o.created_at) BETWEEN '2025-05-24' AND '2025-09-12'
  GROUP BY DATE(o.created_at), o.id_hotel, h.nome
  ORDER BY data ASC, h.nome ASC;
END;
$$;
