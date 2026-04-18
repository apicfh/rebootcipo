-- Funzione per recuperare statistiche complete degli operatori
CREATE OR REPLACE FUNCTION get_operatori_stats_complete(
  p_data_inizio_soggiorno DATE DEFAULT NULL,
  p_data_fine_soggiorno DATE DEFAULT NULL,
  p_data_inizio_richiesta DATE DEFAULT NULL,
  p_data_fine_richiesta DATE DEFAULT NULL,
  p_hotels UUID[] DEFAULT NULL,
  p_tipo_periodo TEXT DEFAULT 'entrambi'
)
RETURNS JSON AS $$
DECLARE
  result JSON;
  operatori_stats JSON;
  hotel_distribution JSON;
  conversion_stats JSON;
  performance_mensile JSON;
BEGIN
  -- Costruisci la query per recuperare le statistiche degli operatori
  WITH preventivi_filtrati AS (
    SELECT 
      pe.*,
      h.nome AS nome_hotel
    FROM 
      preventivi_elaborati pe
    LEFT JOIN 
      hotel h ON pe.id_hotel = h.id
    WHERE 
      -- Filtro per hotel
      (p_hotels IS NULL OR pe.id_hotel = ANY(p_hotels))
      -- Filtro per date soggiorno
      AND (
        p_tipo_periodo != 'soggiorno' 
        OR (
          p_data_inizio_soggiorno IS NULL 
          OR p_data_fine_soggiorno IS NULL
          OR (
            pe.data_arrivo <= p_data_fine_soggiorno
            AND pe.data_partenza >= p_data_inizio_soggiorno
          )
        )
      )
      -- Filtro per date richiesta - MODIFICATO per usare data_elaborazione e ripiegare su data_creazione
      AND (
        p_tipo_periodo != 'richiesta' 
        OR (
          p_data_inizio_richiesta IS NULL 
          OR p_data_fine_richiesta IS NULL
          OR (
            (
              (pe.data_elaborazione IS NOT NULL AND pe.data_elaborazione >= p_data_inizio_richiesta AND pe.data_elaborazione <= p_data_fine_richiesta)
              OR 
              (pe.data_elaborazione IS NULL AND pe.data_creazione IS NOT NULL AND pe.data_creazione >= p_data_inizio_richiesta AND pe.data_creazione <= p_data_fine_richiesta)
            )
          )
        )
      )
  ),
  
  -- Calcola le statistiche per operatore
  stats_operatori AS (
    SELECT
      operatore_creazione,
      COUNT(*) AS totale_preventivi,
      SUM(importo_totale) AS importo_totale,
      COUNT(DISTINCT id_preventivo_ricevuto) AS clienti_unici,
      SUM(adulti) AS adulti_totali,
      SUM(bambini) AS bambini_totali,
      SUM(CASE 
        WHEN stato = 4 OR stato = 5 THEN 1 
        ELSE 0 
      END) AS prenotazioni_convertite,
      CASE 
        WHEN COUNT(*) > 0 THEN SUM(adulti)::FLOAT / COUNT(*) 
        ELSE 0 
      END AS media_adulti,
      CASE 
        WHEN COUNT(*) > 0 THEN SUM(bambini)::FLOAT / COUNT(*) 
        ELSE 0 
      END AS media_bambini,
      CASE 
        WHEN COUNT(*) > 0 THEN 
          (SUM(CASE 
            WHEN stato = 4 OR stato = 5 THEN 1 
            ELSE 0 
          END)::FLOAT / COUNT(*)) * 100
        ELSE 0 
      END AS tasso_conversione
    FROM 
      preventivi_filtrati
    WHERE
      operatore_creazione IS NOT NULL
    GROUP BY 
      operatore_creazione
  ),
  
  -- Calcola la distribuzione per hotel
  distribuzione_hotel AS (
    SELECT
      operatore_creazione,
      id_hotel,
      nome_hotel,
      COUNT(*) AS preventivi_per_hotel
    FROM 
      preventivi_filtrati
    WHERE
      operatore_creazione IS NOT NULL
    GROUP BY 
      operatore_creazione, id_hotel, nome_hotel
  ),
  
  -- Calcola le statistiche di conversione per hotel
  conversione_hotel AS (
    SELECT
      id_hotel,
      nome_hotel,
      COUNT(*) AS totale_preventivi,
      SUM(CASE 
        WHEN stato = 4 OR stato = 5 THEN 1 
        ELSE 0 
      END) AS prenotazioni_convertite,
      CASE 
        WHEN COUNT(*) > 0 THEN 
          (SUM(CASE 
            WHEN stato = 4 OR stato = 5 THEN 1 
            ELSE 0 
          END)::FLOAT / COUNT(*)) * 100
        ELSE 0 
      END AS tasso_conversione
    FROM 
      preventivi_filtrati
    GROUP BY 
      id_hotel, nome_hotel
  ),
  
  -- Calcola le performance mensili
  performance_mensile AS (
    SELECT
      operatore_creazione,
      DATE_TRUNC('month', COALESCE(data_elaborazione, data_creazione)) AS mese,
      COUNT(*) AS totale_preventivi,
      SUM(CASE 
        WHEN stato = 4 OR stato = 5 THEN 1 
        ELSE 0 
      END) AS prenotazioni_convertite,
      CASE 
        WHEN COUNT(*) > 0 THEN 
          (SUM(CASE 
            WHEN stato = 4 OR stato = 5 THEN 1 
            ELSE 0 
          END)::FLOAT / COUNT(*)) * 100
        ELSE 0 
      END AS tasso_conversione
    FROM 
      preventivi_filtrati
    WHERE
      operatore_creazione IS NOT NULL AND
      (data_elaborazione IS NOT NULL OR data_creazione IS NOT NULL)
    GROUP BY 
      operatore_creazione, DATE_TRUNC('month', COALESCE(data_elaborazione, data_creazione))
    ORDER BY 
      operatore_creazione, DATE_TRUNC('month', COALESCE(data_elaborazione, data_creazione))
  )
  
  -- Costruisci il risultato JSON
  SELECT json_build_object(
    'operatoriStats', (SELECT COALESCE(json_agg(stats_operatori), '[]'::json)),
    'hotelDistribution', (SELECT COALESCE(json_agg(distribuzione_hotel), '[]'::json)),
    'conversionStats', (SELECT COALESCE(json_agg(conversione_hotel), '[]'::json)),
    'performanceMensile', (SELECT COALESCE(json_agg(performance_mensile), '[]'::json))
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
