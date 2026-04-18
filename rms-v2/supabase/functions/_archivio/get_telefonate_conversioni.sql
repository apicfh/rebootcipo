CREATE OR REPLACE FUNCTION public.get_telefonate_conversioni(
  p_data_inizio date,
  p_data_fine date,
  p_hotel_ids uuid[] DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
AS $function$
DECLARE
  result_json json;
BEGIN
  WITH telefonate_risposte AS (
    -- Seleziona tutte le chiamate risposte nel periodo specificato
    SELECT 
      t.date AS data_chiamata,
      t.time AS ora_chiamata,
      t.cid AS numero_telefono,
      t.agent,
      t.agent_name,
      t.qdescr,
      t.duration,
      h.id AS id_hotel,
      h.nome AS hotel_name
    FROM 
      telefonate t
    LEFT JOIN 
      code_Youneed c ON t.qdescr = c.nome_coda
    LEFT JOIN 
      hotel h ON c.id_hotel = h.id
    WHERE 
      t.date BETWEEN p_data_inizio AND p_data_fine
      AND (p_hotel_ids IS NULL OR h.id = ANY(p_hotel_ids))
      AND (t.result = 'ANSWER' OR t.result = 'ANSWERED')
      AND t.cid IS NOT NULL
      AND t.cid != ''
  ),
  
  prenotazioni_periodo AS (
    -- Seleziona tutte le prenotazioni nel periodo specificato
    SELECT 
      p.id AS id_prenotazione,
      p.data_prenotazione,
      p.cliente_cellulare AS numero_telefono,
      p.id_hotel,
      p.hotel_nome,
      p.totale_soggiorno,
      p.notti,
      p.pax
    FROM 
      prenotazioni p
    WHERE 
      p.data_prenotazione BETWEEN p_data_inizio AND p_data_fine
      AND (p_hotel_ids IS NULL OR p.id_hotel = ANY(p_hotel_ids))
      AND p.cliente_cellulare IS NOT NULL
      AND p.cliente_cellulare != ''
  ),
  
  conversioni AS (
    -- Unisce le chiamate risposte con le prenotazioni basandosi sul numero di telefono
    SELECT 
      t.agent,
      t.agent_name,
      t.hotel_name,
      t.data_chiamata,
      t.ora_chiamata,
      p.data_prenotazione,
      p.id_prenotazione,
      p.totale_soggiorno,
      p.notti,
      p.pax,
      -- Calcola i giorni tra la chiamata e la prenotazione
      (p.data_prenotazione - t.data_chiamata) AS giorni_conversione
    FROM 
      telefonate_risposte t
    JOIN 
      prenotazioni_periodo p ON t.numero_telefono = p.numero_telefono
    WHERE
      -- La prenotazione deve essere successiva alla chiamata
      p.data_prenotazione >= t.data_chiamata
  ),
  
  -- Statistiche per agente
  agent_stats AS (
    SELECT
      agent,
      agent_name,
      hotel_name,
      COUNT(DISTINCT id_prenotazione) AS num_prenotazioni,
      SUM(totale_soggiorno) AS valore_totale,
      SUM(notti) AS notti_totali,
      SUM(pax) AS ospiti_totali,
      AVG(giorni_conversione) AS media_giorni_conversione
    FROM
      conversioni
    GROUP BY
      agent, agent_name, hotel_name
  ),
  
  -- Statistiche per hotel
  hotel_stats AS (
    SELECT
      hotel_name,
      COUNT(DISTINCT id_prenotazione) AS num_prenotazioni,
      SUM(totale_soggiorno) AS valore_totale,
      COUNT(DISTINCT agent) AS num_agenti
    FROM
      conversioni
    GROUP BY
      hotel_name
  ),
  
  -- Statistiche temporali
  time_stats AS (
    SELECT
      data_chiamata,
      COUNT(DISTINCT id_prenotazione) AS num_prenotazioni,
      SUM(totale_soggiorno) AS valore_totale
    FROM
      conversioni
    GROUP BY
      data_chiamata
    ORDER BY
      data_chiamata
  ),
  
  -- Totale chiamate risposte per agente (per calcolare il tasso di conversione)
  total_calls AS (
    SELECT
      agent,
      agent_name,
      hotel_name,
      COUNT(*) AS total_answered_calls
    FROM
      telefonate_risposte
    GROUP BY
      agent, agent_name, hotel_name
  )
  
  SELECT json_build_object(
    'agent_stats', (
      SELECT json_agg(
        json_build_object(
          'agent', a.agent,
          'agent_name', a.agent_name,
          'hotel_name', a.hotel_name,
          'num_prenotazioni', a.num_prenotazioni,
          'valore_totale', a.valore_totale,
          'notti_totali', a.notti_totali,
          'ospiti_totali', a.ospiti_totali,
          'media_giorni_conversione', a.media_giorni_conversione,
          'total_answered_calls', COALESCE(t.total_answered_calls, 0),
          'tasso_conversione', CASE 
                                WHEN COALESCE(t.total_answered_calls, 0) > 0 
                                THEN (a.num_prenotazioni::float / t.total_answered_calls) * 100 
                                ELSE 0 
                              END
        )
      )
      FROM agent_stats a
      LEFT JOIN total_calls t ON a.agent = t.agent AND a.hotel_name = t.hotel_name
    ),
    'hotel_stats', (SELECT json_agg(hotel_stats) FROM hotel_stats),
    'time_stats', (SELECT json_agg(time_stats) FROM time_stats),
    'totals', (
      SELECT json_build_object(
        'total_prenotazioni', COUNT(DISTINCT id_prenotazione),
        'valore_totale', SUM(totale_soggiorno),
        'notti_totali', SUM(notti),
        'ospiti_totali', SUM(pax),
        'media_giorni_conversione', AVG(giorni_conversione)
      )
      FROM conversioni
    )
  ) INTO result_json;
  
  RETURN result_json;
END;
$function$;

COMMENT ON FUNCTION public.get_telefonate_conversioni IS 'Recupera statistiche sulle conversioni da chiamate telefoniche a prenotazioni';
