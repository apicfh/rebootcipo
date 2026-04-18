-- Fix per la funzione RPC stats - correzione nomi colonne
-- Il problema era che i nomi nel RETURNS TABLE non corrispondevano ai nomi nel SELECT

DROP FUNCTION IF EXISTS get_pressione_domanda_stats_travelbrain(date, date, date, date, integer[]);

CREATE OR REPLACE FUNCTION get_pressione_domanda_stats_travelbrain(
  p_data_richiesta_inizio date DEFAULT NULL,
  p_data_richiesta_fine date DEFAULT NULL,
  p_soggiorno_inizio date DEFAULT NULL,
  p_soggiorno_fine date DEFAULT NULL,
  p_hotel_ids integer[] DEFAULT NULL
)
RETURNS TABLE (
  pressione_totale bigint,
  media_giornaliera numeric,
  picco_massimo bigint,
  giorni_analizzati bigint,
  hotel_distribution jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH filtered_data AS (
    SELECT 
      mv.hotel_id,
      COALESCE(ht.nome_hotel, 'Hotel Sconosciuto') as nome_hotel,
      mv.day_date,
      mv.n as pressione_giornaliera
    FROM analytics.mv_pressione_hotel_giorno mv
    LEFT JOIN analytics.hotel_travelbrain ht ON ht.hotel_id = mv.hotel_id
    WHERE 
      (p_hotel_ids IS NULL OR mv.hotel_id = ANY(p_hotel_ids))
      AND (p_soggiorno_inizio IS NULL OR mv.day_date >= p_soggiorno_inizio)
      AND (p_soggiorno_fine IS NULL OR mv.day_date <= p_soggiorno_fine)
  ),
  stats AS (
    SELECT 
      SUM(pressione_giornaliera) as pressione_totale,
      AVG(pressione_giornaliera) as media_giornaliera,
      MAX(pressione_giornaliera) as picco_massimo,
      COUNT(DISTINCT day_date) as giorni_analizzati
    FROM filtered_data
  ),
  hotel_dist AS (
    SELECT 
      jsonb_agg(
        jsonb_build_object(
          'hotel_id', hotel_id,
          'nome_hotel', nome_hotel,
          'pressione', hotel_pressure
        )
      ) as hotel_distribution
    FROM (
      SELECT 
        hotel_id,
        nome_hotel,
        SUM(pressione_giornaliera) as hotel_pressure
      FROM filtered_data
      GROUP BY hotel_id, nome_hotel
      ORDER BY hotel_pressure DESC
    ) hotel_totals
  )
  SELECT 
    s.pressione_totale,
    s.media_giornaliera,
    s.picco_massimo,
    s.giorni_analizzati,
    COALESCE(hd.hotel_distribution, '[]'::jsonb)
  FROM stats s
  CROSS JOIN hotel_dist hd;
END;
$$;
