-- Crea la funzione completa per le statistiche telefonate
CREATE OR REPLACE FUNCTION get_telefonate_stats_complete(
  hotel_ids uuid[] DEFAULT NULL,
  data_inizio date DEFAULT NULL,
  data_fine date DEFAULT NULL,
  operatore_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id_hotel uuid,
  nome_hotel text,
  telefonate_totali bigint,
  telefonate_convertite bigint,
  telefonate_perse bigint,
  telefonate_in_corso bigint,
  tasso_conversione numeric,
  fatturato_generato numeric,
  durata_media_minuti numeric,
  telefonate_oggi bigint,
  telefonate_ieri bigint,
  trend_giornaliero text
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.id,
    h.nome,
    COALESCE(stats.telefonate_totali, 0) as telefonate_totali,
    COALESCE(stats.telefonate_convertite, 0) as telefonate_convertite,
    COALESCE(stats.telefonate_perse, 0) as telefonate_perse,
    COALESCE(stats.telefonate_in_corso, 0) as telefonate_in_corso,
    CASE 
      WHEN COALESCE(stats.telefonate_totali, 0) > 0 
      THEN ROUND((COALESCE(stats.telefonate_convertite, 0)::numeric / stats.telefonate_totali::numeric) * 100, 2)
      ELSE 0
    END as tasso_conversione,
    COALESCE(stats.fatturato_generato, 0) as fatturato_generato,
    COALESCE(stats.durata_media_minuti, 0) as durata_media_minuti,
    COALESCE(stats.telefonate_oggi, 0) as telefonate_oggi,
    COALESCE(stats.telefonate_ieri, 0) as telefonate_ieri,
    CASE 
      WHEN COALESCE(stats.telefonate_ieri, 0) = 0 THEN 'nuovo'
      WHEN COALESCE(stats.telefonate_oggi, 0) > COALESCE(stats.telefonate_ieri, 0) THEN 'crescita'
      WHEN COALESCE(stats.telefonate_oggi, 0) < COALESCE(stats.telefonate_ieri, 0) THEN 'calo'
      ELSE 'stabile'
    END as trend_giornaliero
  FROM hotel h
  LEFT JOIN (
    SELECT 
      tel.id_hotel,
      COUNT(*) as telefonate_totali,
      COUNT(CASE WHEN tel.esito = 'convertita' THEN 1 END) as telefonate_convertite,
      COUNT(CASE WHEN tel.esito = 'persa' THEN 1 END) as telefonate_perse,
      COUNT(CASE WHEN tel.esito = 'in_corso' THEN 1 END) as telefonate_in_corso,
      SUM(CASE WHEN tel.esito = 'convertita' THEN COALESCE(tel.valore_prenotazione, 0) ELSE 0 END) as fatturato_generato,
      AVG(CASE WHEN tel.durata_minuti > 0 THEN tel.durata_minuti ELSE NULL END) as durata_media_minuti,
      COUNT(CASE WHEN tel.data_telefonata = CURRENT_DATE THEN 1 END) as telefonate_oggi,
      COUNT(CASE WHEN tel.data_telefonata = CURRENT_DATE - INTERVAL '1 day' THEN 1 END) as telefonate_ieri
    FROM telefonate tel
    WHERE (hotel_ids IS NULL OR tel.id_hotel = ANY(hotel_ids))
      AND (data_inizio IS NULL OR tel.data_telefonata >= data_inizio)
      AND (data_fine IS NULL OR tel.data_telefonata <= data_fine)
      AND (operatore_id IS NULL OR tel.operatore_id = operatore_id)
    GROUP BY tel.id_hotel
  ) stats ON h.id = stats.id_hotel
  WHERE (hotel_ids IS NULL OR h.id = ANY(hotel_ids))
  ORDER BY h.nome;
END;
$$;
