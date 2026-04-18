CREATE OR REPLACE FUNCTION get_hotels_travelbrain()
RETURNS TABLE (
  hotel_id integer,
  nome_hotel text
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ht.hotel_id,
    ht.nome_hotel
  FROM analytics.hotel_travelbrain ht
  ORDER BY ht.nome_hotel;
END;
$$;
