-- Funzione RPC per interrogare la vista materializzata mv_pressione_hotel_giorno
-- Filtra per date di richiesta, date di soggiorno e hotel selezionati

CREATE OR REPLACE FUNCTION get_pressione_domanda_travelbrain(
  p_data_richiesta_inizio date DEFAULT NULL,
  p_data_richiesta_fine date DEFAULT NULL,
  p_soggiorno_inizio date DEFAULT NULL,
  p_soggiorno_fine date DEFAULT NULL,
  p_hotel_ids integer[] DEFAULT NULL
)
RETURNS TABLE (
  hotel_id integer,
  nome_hotel text,
  day_date date,
  pressione_giornaliera bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mv.hotel_id,
    COALESCE(ht.nome_hotel, 'Hotel Sconosciuto') as nome_hotel,
    mv.day_date,
    mv.n as pressione_giornaliera
  FROM analytics.mv_pressione_hotel_giorno mv
  LEFT JOIN analytics.hotel_travelbrain ht ON ht.hotel_id = mv.hotel_id
  WHERE 
    -- Filtro per hotel selezionati
    (p_hotel_ids IS NULL OR mv.hotel_id = ANY(p_hotel_ids))
    -- Filtro per date di soggiorno (day_date è la data del soggiorno)
    AND (p_soggiorno_inizio IS NULL OR mv.day_date >= p_soggiorno_inizio)
    AND (p_soggiorno_fine IS NULL OR mv.day_date <= p_soggiorno_fine)
    -- Per ora non filtriamo per data richiesta perché la vista materializzata 
    -- non contiene questa informazione. Potremmo aggiungerla in futuro.
  ORDER BY mv.day_date, mv.hotel_id;
END;
$$;

-- Funzione per ottenere statistiche aggregate
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
    s.total_pressure,
    s.avg_daily,
    s.max_peak,
    s.days_analyzed,
    COALESCE(hd.distribution, '[]'::jsonb)
  FROM stats s
  CROSS JOIN hotel_dist hd;
END;
$$;
