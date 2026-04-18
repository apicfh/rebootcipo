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
      COALESCE(t.agent, t.agent_name) AS agent_name, -- Usa agent come fallback
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
      p.totale_soggiorno
    FROM 
      prenotazioni p
    WHERE 
      p.data_prenotazione BETWEEN p_data_inizio AND p_data_fine
      -- Non filtriamo per hotel nelle prenotazioni
      AND p.cliente_cellulare IS NOT NULL
      AND p.cliente_cellulare != ''
  ),
  
  conversioni AS (
    -- Unisce le chiamate risposte con le prenotazioni basandosi SOLO sul numero di telefono
    -- Indipendentemente dall'hotel
    SELECT 
      t.agent,
      t.agent_name,
      t.hotel_name,
      t.id_hotel,
      p.id_prenotazione,
      p.hotel_nome AS hotel_prenotazione
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
      COUNT(DISTINCT id_prenotazione) AS num_prenotazioni
    FROM
      conversioni
    GROUP BY
      agent, agent_name, hotel_name
  ),
  
  -- Totale chiamate risposte per agente
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
          'agent', COALESCE(a.agent, t.agent),
          'agent_name', COALESCE(a.agent_name, t.agent_name),
          'hotel_name', COALESCE(a.hotel_name, t.hotel_name),
          'num_prenotazioni', COALESCE(a.num_prenotazioni, 0),
          'total_answered_calls', t.total_answered_calls,
          'tasso_conversione', CASE 
                                WHEN t.total_answered_calls > 0 
                                THEN (COALESCE(a.num_prenotazioni, 0)::float / t.total_answered_calls) * 100 
                                ELSE 0 
                              END
        )
      )
      FROM total_calls t
      LEFT JOIN agent_stats a ON t.agent = a.agent AND t.hotel_name = a.hotel_name
    )
  ) INTO result_json;
  
  RETURN result_json;
END;
$function$;

COMMENT ON FUNCTION public.get_telefonate_conversioni IS 'Recupera statistiche sulle conversioni da chiamate telefoniche a prenotazioni';
