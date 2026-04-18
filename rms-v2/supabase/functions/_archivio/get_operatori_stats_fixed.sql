-- Funzione corretta per recuperare le statistiche degli operatori
CREATE OR REPLACE FUNCTION public.get_operatori_stats(
  p_data_inizio_soggiorno date DEFAULT NULL,
  p_data_fine_soggiorno date DEFAULT NULL,
  p_data_inizio_richiesta date DEFAULT NULL,
  p_data_fine_richiesta date DEFAULT NULL,
  p_hotels uuid[] DEFAULT NULL,
  p_operatore text DEFAULT NULL,
  p_tipo_periodo text DEFAULT 'soggiorno'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  result json;
  operatori_stats json;
  hotel_stats json;
  conversion_stats json;
BEGIN
  -- Statistiche per operatore
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
      -- Filtro per operatore
      AND (p_operatore IS NULL OR p_operatore = 'tutti' OR pe.operatore_creazione = p_operatore)
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
      -- Filtro per date richiesta
      AND (
        p_tipo_periodo != 'richiesta' 
        OR (
          p_data_inizio_richiesta IS NULL 
          OR p_data_fine_richiesta IS NULL 
          OR (
            pe.data_creazione BETWEEN p_data_inizio_richiesta AND p_data_fine_richiesta
          )
        )
      )
  ),
  prenotazioni_filtrate AS (
    SELECT 
      p.*
    FROM 
      prenotazioni p
    WHERE 
      -- Filtro per hotel
      (p_hotels IS NULL OR p.id_hotel = ANY(p_hotels))
      -- Filtro per date soggiorno
      AND (
        p_tipo_periodo != 'soggiorno' 
        OR (
          p_data_inizio_soggiorno IS NULL 
          OR p_data_fine_soggiorno IS NULL 
          OR (
            p.arrivo <= p_data_fine_soggiorno 
            AND p.partenza >= p_data_inizio_soggiorno
          )
        )
      )
      -- Filtro per date richiesta
      AND (
        p_tipo_periodo != 'richiesta' 
        OR (
          p_data_inizio_richiesta IS NULL 
          OR p_data_fine_richiesta IS NULL 
          OR (
            p.data_prenotazione BETWEEN p_data_inizio_richiesta AND p_data_fine_richiesta
          )
        )
      )
      -- Solo prenotazioni non cancellate
      AND p.stato_prenotazione != 'cancellata'
  ),
  operatori_data AS (
    SELECT
      operatore_creazione,
      COUNT(*) AS totale_preventivi,
      SUM(importo_totale) AS importo_totale,
      COUNT(DISTINCT id_preventivo_ricevuto) AS clienti_unici
    FROM
      preventivi_filtrati
    GROUP BY
      operatore_creazione
  ),
  conversioni_data AS (
    SELECT
      pf.operatore_creazione,
      COUNT(DISTINCT pr.id) AS prenotazioni_convertite
    FROM
      preventivi_filtrati pf
    JOIN
      prenotazioni_filtrate pr ON pf.id_hotel = pr.id_hotel
    GROUP BY
      pf.operatore_creazione
  ),
  hotel_distribution AS (
    SELECT
      operatore_creazione,
      id_hotel,
      nome_hotel,
      COUNT(*) AS preventivi_per_hotel
    FROM
      preventivi_filtrati
    GROUP BY
      operatore_creazione, id_hotel, nome_hotel
  )
  
  -- Statistiche per operatore
  SELECT json_agg(row_to_json(op_stats))
  INTO operatori_stats
  FROM (
    SELECT
      od.operatore_creazione,
      od.totale_preventivi,
      od.importo_totale,
      od.clienti_unici,
      COALESCE(cd.prenotazioni_convertite, 0) AS prenotazioni_convertite,
      CASE 
        WHEN od.totale_preventivi > 0 THEN 
          ROUND((COALESCE(cd.prenotazioni_convertite, 0)::numeric / od.totale_preventivi) * 100, 2)
        ELSE 0
      END AS tasso_conversione
    FROM
      operatori_data od
    LEFT JOIN
      conversioni_data cd ON od.operatore_creazione = cd.operatore_creazione
    ORDER BY
      od.totale_preventivi DESC
  ) op_stats;
  
  -- Distribuzione per hotel
  SELECT json_agg(row_to_json(h_stats))
  INTO hotel_stats
  FROM (
    SELECT
      operatore_creazione,
      id_hotel,
      nome_hotel,
      preventivi_per_hotel,
      ROUND(
        (preventivi_per_hotel::numeric / SUM(preventivi_per_hotel) OVER (PARTITION BY operatore_creazione)) * 100,
        2
      ) AS percentuale
    FROM
      hotel_distribution
    ORDER BY
      operatore_creazione, preventivi_per_hotel DESC
  ) h_stats;
  
  -- Statistiche di conversione
  SELECT json_agg(row_to_json(c_stats))
  INTO conversion_stats
  FROM (
    SELECT
      pf.id_hotel,
      h.nome AS nome_hotel,
      COUNT(DISTINCT pf.id) AS totale_preventivi,
      COUNT(DISTINCT pr.id) AS prenotazioni_convertite,
      CASE 
        WHEN COUNT(DISTINCT pf.id) > 0 THEN 
          ROUND((COUNT(DISTINCT pr.id)::numeric / COUNT(DISTINCT pf.id)) * 100, 2)
        ELSE 0
      END AS tasso_conversione
    FROM
      preventivi_filtrati pf
    LEFT JOIN
      prenotazioni_filtrate pr ON pf.id_hotel = pr.id_hotel
    LEFT JOIN
      hotel h ON pf.id_hotel = h.id
    GROUP BY
      pf.id_hotel, h.nome
    ORDER BY
      COUNT(DISTINCT pf.id) DESC
  ) c_stats;
  
  -- Costruisci il risultato finale
  RETURN json_build_object(
    'operatori', operatori_stats,
    'hotel_distribution', hotel_stats,
    'conversion_stats', conversion_stats
  );
END;
$function$;

-- Imposta i permessi
COMMENT ON FUNCTION public.get_operatori_stats IS 'Recupera le statistiche degli operatori con filtri per date e hotel';
GRANT EXECUTE ON FUNCTION public.get_operatori_stats TO anon, authenticated, service_role;
