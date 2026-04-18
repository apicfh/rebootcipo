CREATE OR REPLACE FUNCTION get_tipi_camere_per_hotel(hotel_id_param uuid)
RETURNS TABLE (
  id uuid,
  nome text,
  tipo text,
  livello text,
  letti integer,
  paxmax integer
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tc.id,
    tc.nome,
    tc.tipo,
    tc.livello,
    tc.letti,
    tc.paxmax
  FROM tipi_camere tc
  WHERE tc.id_hotel = hotel_id_param
  ORDER BY tc.livello, tc.nome;
END;
$$;
