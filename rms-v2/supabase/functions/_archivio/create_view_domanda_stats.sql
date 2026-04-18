-- Crea una vista per le statistiche della domanda
CREATE OR REPLACE VIEW v_domanda_stats AS
SELECT 
  h.id as id_hotel,
  h.nome as nome_hotel,
  pd.data_richiesta,
  pd.richieste_totali,
  LAG(pd.richieste_totali) OVER (PARTITION BY h.id ORDER BY pd.data_richiesta) as richieste_precedenti,
  CASE 
    WHEN LAG(pd.richieste_totali) OVER (PARTITION BY h.id ORDER BY pd.data_richiesta) IS NULL THEN 'nuovo'
    WHEN pd.richieste_totali > LAG(pd.richieste_totali) OVER (PARTITION BY h.id ORDER BY pd.data_richiesta) THEN 'crescita'
    WHEN pd.richieste_totali < LAG(pd.richieste_totali) OVER (PARTITION BY h.id ORDER BY pd.data_richiesta) THEN 'calo'
    ELSE 'stabile'
  END as trend,
  AVG(pd.richieste_totali) OVER (
    PARTITION BY h.id 
    ORDER BY pd.data_richiesta 
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ) as media_7_giorni,
  SUM(pd.richieste_totali) OVER (
    PARTITION BY h.id, EXTRACT(WEEK FROM pd.data_richiesta)
  ) as totale_settimana,
  SUM(pd.richieste_totali) OVER (
    PARTITION BY h.id, EXTRACT(MONTH FROM pd.data_richiesta)
  ) as totale_mese
FROM hotel h
LEFT JOIN pressione_domanda pd ON h.id = pd.id_hotel
WHERE pd.data_richiesta IS NOT NULL
ORDER BY h.nome, pd.data_richiesta;

-- Funzione per ottenere statistiche aggregate della domanda
CREATE OR REPLACE FUNCTION get_domanda_stats_aggregate(
  p_hotel_ids uuid[] DEFAULT NULL,
  p_data_inizio date DEFAULT NULL,
  p_data_fine date DEFAULT NULL
)
RETURNS TABLE (
  id_hotel uuid,
  nome_hotel text,
  richieste_totali bigint,
  richieste_media_giornaliera numeric,
  picco_massimo bigint,
  data_picco date,
  trend_generale text,
  crescita_percentuale numeric
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vds.id_hotel,
    vds.nome_hotel,
    SUM(vds.richieste_totali) as richieste_totali,
    AVG(vds.richieste_totali) as richieste_media_giornaliera,
    MAX(vds.richieste_totali) as picco_massimo,
    (SELECT data_richiesta FROM v_domanda_stats WHERE id_hotel = vds.id_hotel AND richieste_totali = MAX(vds.richieste_totali) LIMIT 1) as data_picco,
    CASE 
      WHEN AVG(CASE WHEN vds.trend = 'crescita' THEN 1.0 WHEN vds.trend = 'calo' THEN -1.0 ELSE 0.0 END) > 0.2 THEN 'crescita'
      WHEN AVG(CASE WHEN vds.trend = 'crescita' THEN 1.0 WHEN vds.trend = 'calo' THEN -1.0 ELSE 0.0 END) < -0.2 THEN 'calo'
      ELSE 'stabile'
    END as trend_generale,
    CASE 
      WHEN MIN(vds.data_richiesta) = MAX(vds.data_richiesta) THEN 0
      ELSE ROUND(
        ((MAX(vds.richieste_totali) - MIN(vds.richieste_totali))::numeric / NULLIF(MIN(vds.richieste_totali), 0)::numeric) * 100, 
        2
      )
    END as crescita_percentuale
  FROM v_domanda_stats vds
  WHERE (p_hotel_ids IS NULL OR vds.id_hotel = ANY(p_hotel_ids))
    AND (p_data_inizio IS NULL OR vds.data_richiesta >= p_data_inizio)
    AND (p_data_fine IS NULL OR vds.data_richiesta <= p_data_fine)
  GROUP BY vds.id_hotel, vds.nome_hotel
  ORDER BY vds.nome_hotel;
END;
$$;
