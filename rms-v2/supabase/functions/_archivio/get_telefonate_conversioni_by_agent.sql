CREATE OR REPLACE FUNCTION public.get_telefonate_conversioni_by_agent(
  p_data_inizio date,
  p_data_fine date
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
      t.cid,  -- Nome originale della colonna
      t.agent,
      COALESCE(t.agent, t.agent_name) AS agent_name, -- Usa agent come fallback
      t.qdescr,
      t.duration
    FROM 
      telefonate t
    WHERE 
      t.date BETWEEN p_data_inizio AND p_data_fine
      AND (t.result = 'ANSWER' OR t.result = 'ANSWERED')
      AND t.cid IS NOT NULL
      AND t.cid != ''
  ),
  
  prenotazioni_periodo AS (
    -- Seleziona tutte le prenotazioni nel periodo specificato
    SELECT 
      p.id AS id_prenotazione,
      p.data_prenotazione,
      p.cliente_cellulare,  -- Nome originale della colonna
      p.id_hotel,
      p.hotel_nome,
      p.totale_soggiorno,
      p.notti
    FROM 
      prenotazioni p
    WHERE 
      p.data_prenotazione BETWEEN p_data_inizio AND p_data_fine
      AND p.cliente_cellulare IS NOT NULL
      AND p.cliente_cellulare != ''
  ),
  
  conversioni AS (
    -- Unisce le chiamate risposte con le prenotazioni basandosi sui numeri di telefono
    SELECT 
      t.agent,
      t.agent_name,
      t.cid,  -- Includo la colonna originale
      p.id_prenotazione,
      p.totale_soggiorno,
      p.notti,
      p.data_prenotazione - t.data_chiamata AS giorni_conversione
    FROM 
      telefonate_risposte t
    JOIN 
      prenotazioni_periodo p ON t.cid = p.cliente_cellulare  -- Join con i nomi originali
    WHERE
      -- La prenotazione deve essere successiva alla chiamata
      p.data_prenotazione >= t.data_chiamata
  ),
  
  -- Statistiche per agente
  agent_stats AS (
    SELECT
      agent,
      agent_name,
      COUNT(DISTINCT id_prenotazione) AS num_prenotazioni,
      SUM(totale_soggiorno) AS valore_totale,
      SUM(notti) AS notti_totali,
      AVG(giorni_conversione) AS media_giorni_conversione
    FROM
      conversioni
    GROUP BY
      agent, agent_name
  ),
  
  -- Totale chiamate risposte per agente
  total_calls AS (
    SELECT
      agent,
      agent_name,
      COUNT(*) AS total_answered_calls
    FROM
      telefonate_risposte
    GROUP BY
      agent, agent_name
  ),
  
  -- Statistiche temporali
  time_stats AS (
    SELECT
      DATE_TRUNC('day', t.data_chiamata) AS data_chiamata,
      COUNT(DISTINCT c.id_prenotazione) AS num_prenotazioni,
      SUM(c.totale_soggiorno) AS valore_totale
    FROM
      telefonate_risposte t
    LEFT JOIN
      conversioni c ON t.agent = c.agent AND t.cid = c.cid  -- Join con i nomi originali
    GROUP BY
      DATE_TRUNC('day', t.data_chiamata)
    ORDER BY
      data_chiamata
  ),
  
  -- Totali generali
  totals AS (
    SELECT
      COUNT(DISTINCT id_prenotazione) AS total_prenotazioni,
      SUM(totale_soggiorno) AS valore_totale,
      SUM(notti) AS notti_totali,
      AVG(giorni_conversione) AS media_giorni_conversione
    FROM
      conversioni
  )
  
  SELECT json_build_object(
    'agent_stats', (
      SELECT json_agg(
        json_build_object(
          'agent', COALESCE(a.agent, t.agent),
          'agent_name', COALESCE(a.agent_name, t.agent_name),
          'num_prenotazioni', COALESCE(a.num_prenotazioni, 0),
          'valore_totale', COALESCE(a.valore_totale, 0),
          'notti_totali', COALESCE(a.notti_totali, 0),
          'media_giorni_conversione', COALESCE(a.media_giorni_conversione, 0),
          'total_answered_calls', t.total_answered_calls,
          'tasso_conversione', CASE 
                                WHEN t.total_answered_calls > 0 
                                THEN (COALESCE(a.num_prenotazioni, 0)::float / t.total_answered_calls) * 100 
                                ELSE 0 
                              END
        )
      )
      FROM total_calls t
      LEFT JOIN agent_stats a ON t.agent = a.agent
    ),
    'time_stats', (
      SELECT json_agg(time_stats)
      FROM time_stats
    ),
    'totals', (
      SELECT row_to_json(totals)
      FROM totals
    )
  ) INTO result_json;
  
  RETURN result_json;
END;
$function$;

COMMENT ON FUNCTION public.get_telefonate_conversioni_by_agent IS 'Recupera statistiche sulle conversioni da chiamate telefoniche a prenotazioni aggregate per agente';
