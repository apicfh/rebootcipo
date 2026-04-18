-- Funzione RPC per recuperare i dati di recap dalla tabella exp_hotel_giornaliero
CREATE OR REPLACE FUNCTION get_recap_data(
  p_hotel_ids uuid[] DEFAULT NULL,
  p_data_inizio date DEFAULT NULL,
  p_data_fine date DEFAULT NULL
)
RETURNS TABLE (
  hotel_id uuid,
  hotel_nome text,
  total_roombook bigint,
  total_invenduto bigint,
  total_rev numeric,
  data_dettaglio jsonb
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.id as hotel_id,
    h.nome as hotel_nome,
    COALESCE(SUM(ehg.roombook), 0)::bigint as total_roombook,
    COALESCE(SUM(ehg.invenduto), 0)::bigint as total_invenduto,
    COALESCE(SUM(ehg.rev), 0)::numeric as total_rev,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'data_soggiorno', ehg.data_soggiorno,
          'roombook', ehg.roombook,
          'invenduto', ehg.invenduto,
          'rev', ehg.rev
        ) ORDER BY ehg.data_soggiorno
      ) FILTER (WHERE ehg.id IS NOT NULL),
      '[]'::jsonb
    ) as data_dettaglio
  FROM hotel h
  LEFT JOIN exp_hotel_giornaliero ehg ON h.id = ehg.hotel
    AND (p_data_inizio IS NULL OR ehg.data_soggiorno >= p_data_inizio)
    AND (p_data_fine IS NULL OR ehg.data_soggiorno <= p_data_fine)
  WHERE (p_hotel_ids IS NULL OR h.id = ANY(p_hotel_ids))
  GROUP BY h.id, h.nome
  ORDER BY h.nome;
END;
$$;
