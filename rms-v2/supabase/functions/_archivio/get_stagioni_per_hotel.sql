CREATE OR REPLACE FUNCTION get_stagioni_per_hotel(hotel_id_param uuid)
RETURNS TABLE (
  id uuid,
  stagione text,
  anno integer,
  apertura date,
  chiusura date
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.stagione,
    s.anno,
    s.apertura,
    s.chiusura
  FROM stagioni s
  WHERE s.hotel_id = hotel_id_param
  ORDER BY s.anno DESC, s.apertura;
END;
$$;
