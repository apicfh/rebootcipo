-- Fix column name mismatch in get_pressione_domanda_stats_travelbrain function
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
      SUM(pressione_giornaliera) as total_pressure,
      AVG(pressione_giornaliera) as avg_daily,
      MAX(pressione_giornaliera) as max_peak,
      COUNT(DISTINCT day_date) as days_analyzed
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
      ) as distribution
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
    s.total_pressure as pressione_totale,
    s.avg_daily as media_giornaliera,
    s.max_peak as picco_massimo,
    s.days_analyzed as giorni_analizzati,
    COALESCE(hd.distribution, '[]'::jsonb) as hotel_distribution
  FROM stats s
  CROSS JOIN hotel_dist hd;
END;
$$;
