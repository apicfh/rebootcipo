CREATE OR REPLACE FUNCTION public.get_telefonate_conversioni_v3(
  data_inizio date,
  data_fine date,
  hotel_ids uuid[] DEFAULT NULL,
  filter_short_calls boolean DEFAULT false
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
      COALESCE(t.agent_name, t.agent) AS agent_name,
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
      t.date BETWEEN data_inizio AND data_fine
      AND (hotel_ids IS NULL OR h.id = ANY(hotel_ids))
      AND (t.result = 'ANSWER' OR t.result = 'ANSWERED')
      AND t.cid IS NOT NULL
      AND t.cid != ''
      -- Filtro per chiamate brevi
      AND (NOT filter_short_calls OR t.duration >= 10)
  ),
  
  -- Identificazione del primo contatto per ogni cliente
  primo_contatto AS (
    SELECT 
      numero_telefono,
      agent,
      agent_name,
      data_chiamata,
      ora_chiamata
    FROM (
      SELECT 
        numero_telefono,
        agent,
        agent_name,
        data_chiamata,
        ora_chiamata,
        ROW_NUMBER() OVER (PARTITION BY numero_telefono ORDER BY data_chiamata, ora_chiamata) AS rn
      FROM 
        telefonate_risposte
    ) ranked
    WHERE rn = 1
  ),
  
  -- Identificazione dell'operatore con durata massima per ogni cliente
  durata_massima AS (
    SELECT 
      numero_telefono,
      agent,
      agent_name
    FROM (
      SELECT 
        numero_telefono,
        agent,
        agent_name,
        SUM(duration) AS durata_totale,
        ROW_NUMBER() OVER (PARTITION BY numero_telefono ORDER BY SUM(duration) DESC) AS rn
      FROM 
        telefonate_risposte
      GROUP BY 
        numero_telefono, agent, agent_name
    ) ranked
    WHERE rn = 1
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
      p.notti
    FROM 
      prenotazioni p
    WHERE 
      p.data_prenotazione BETWEEN data_inizio AND data_fine
      AND p.cliente_cellulare IS NOT NULL
      AND p.cliente_cellulare != ''
  ),
  
  -- Conversioni con logica originale (tutti gli operatori)
  conversioni_originale AS (
    SELECT 
      t.agent,
      t.agent_name,
      p.id_prenotazione,
      p.totale_soggiorno,
      p.notti,
      (p.data_prenotazione - t.data_chiamata)::integer AS giorni_conversione
    FROM 
      telefonate_risposte t
    JOIN 
      prenotazioni_periodo p ON t.numero_telefono = p.numero_telefono
    WHERE
      -- La prenotazione deve essere successiva alla chiamata
      p.data_prenotazione >= t.data_chiamata
  ),
  
  -- Conversioni con logica primo contatto
  conversioni_primo_contatto AS (
    SELECT 
      pc.agent,
      pc.agent_name,
      p.id_prenotazione,
      p.totale_soggiorno,
      p.notti,
      (p.data_prenotazione - pc.data_chiamata)::integer AS giorni_conversione
    FROM 
      primo_contatto pc
    JOIN 
      prenotazioni_periodo p ON pc.numero_telefono = p.numero_telefono
    WHERE
      -- La prenotazione deve essere successiva alla chiamata
      p.data_prenotazione >= pc.data_chiamata
  ),
  
  -- Conversioni con logica durata massima
  conversioni_durata_massima AS (
    SELECT 
      dm.agent,
      dm.agent_name,
      p.id_prenotazione,
      p.totale_soggiorno,
      p.notti,
      NULL AS giorni_conversione -- Non abbiamo la data della chiamata qui
    FROM 
      durata_massima dm
    JOIN 
      prenotazioni_periodo p ON dm.numero_telefono = p.numero_telefono
    JOIN
      telefonate_risposte t ON t.numero_telefono = p.numero_telefono AND t.agent = dm.agent
    WHERE
      -- La prenotazione deve essere successiva alla chiamata
      p.data_prenotazione >= t.data_chiamata
    GROUP BY
      dm.agent, dm.agent_name, p.id_prenotazione, p.totale_soggiorno, p.notti
  ),
  
  -- Statistiche totali
  total_stats AS (
    SELECT
      COUNT(DISTINCT id_prenotazione) AS total_bookings,
      COALESCE(SUM(totale_soggiorno), 0) AS total_value,
      COALESCE(SUM(notti), 0) AS total_nights
    FROM
      conversioni_originale
  ),
  
  -- Conversioni per operatore (logica originale)
  agent_conversions_originale AS (
    SELECT
      agent,
      agent_name,
      COUNT(DISTINCT id_prenotazione) AS num_bookings,
      COALESCE(SUM(totale_soggiorno), 0) AS total_value,
      COALESCE(SUM(notti), 0) AS total_nights,
      COALESCE(AVG(giorni_conversione)::numeric, 0) AS avg_conversion_days
    FROM
      conversioni_originale
    GROUP BY
      agent, agent_name
  ),
  
  -- Conversioni per operatore (logica primo contatto)
  agent_conversions_primo_contatto AS (
    SELECT
      agent,
      agent_name,
      COUNT(DISTINCT id_prenotazione) AS num_bookings,
      COALESCE(SUM(totale_soggiorno), 0) AS total_value,
      COALESCE(SUM(notti), 0) AS total_nights,
      COALESCE(AVG(giorni_conversione)::numeric, 0) AS avg_conversion_days
    FROM
      conversioni_primo_contatto
    GROUP BY
      agent, agent_name
  ),
  
  -- Conversioni per operatore (logica durata massima)
  agent_conversions_durata_massima AS (
    SELECT
      agent,
      agent_name,
      COUNT(DISTINCT id_prenotazione) AS num_bookings,
      COALESCE(SUM(totale_soggiorno), 0) AS total_value,
      COALESCE(SUM(notti), 0) AS total_nights,
      0 AS avg_conversion_days -- Non abbiamo i giorni di conversione qui
    FROM
      conversioni_durata_massima
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
  
  -- Risultati aggregati con ordinamento
  agent_results AS (
    SELECT
      t.agent,
      t.agent_name,
      t.total_answered_calls,
      o.num_bookings AS original_num_bookings,
      o.conversion_rate AS original_conversion_rate,
      o.total_value AS original_total_value,
      o.total_nights AS original_total_nights,
      o.avg_conversion_days AS original_avg_conversion_days,
      pc.num_bookings AS first_contact_num_bookings,
      pc.conversion_rate AS first_contact_conversion_rate,
      pc.total_value AS first_contact_total_value,
      pc.total_nights AS first_contact_total_nights,
      pc.avg_conversion_days AS first_contact_avg_conversion_days,
      dm.num_bookings AS max_duration_num_bookings,
      dm.conversion_rate AS max_duration_conversion_rate,
      dm.total_value AS max_duration_total_value,
      dm.total_nights AS max_duration_total_nights,
      dm.avg_conversion_days AS max_duration_avg_conversion_days
    FROM
      total_calls t
    LEFT JOIN (
      SELECT
        agent,
        agent_name,
        num_bookings,
        CASE 
          WHEN COUNT(*) OVER (PARTITION BY agent) > 0 
          THEN (num_bookings::numeric / COUNT(*) OVER (PARTITION BY agent)) * 100
          ELSE 0 
        END AS conversion_rate,
        total_value,
        total_nights,
        avg_conversion_days
      FROM
        agent_conversions_originale
    ) o ON t.agent = o.agent AND t.agent_name = o.agent_name
    LEFT JOIN (
      SELECT
        agent,
        agent_name,
        num_bookings,
        CASE 
          WHEN COUNT(*) OVER (PARTITION BY agent) > 0 
          THEN (num_bookings::numeric / COUNT(*) OVER (PARTITION BY agent)) * 100
          ELSE 0 
        END AS conversion_rate,
        total_value,
        total_nights,
        avg_conversion_days
      FROM
        agent_conversions_primo_contatto
    ) pc ON t.agent = pc.agent AND t.agent_name = pc.agent_name
    LEFT JOIN (
      SELECT
        agent,
        agent_name,
        num_bookings,
        CASE 
          WHEN COUNT(*) OVER (PARTITION BY agent) > 0 
          THEN (num_bookings::numeric / COUNT(*) OVER (PARTITION BY agent)) * 100
          ELSE 0 
        END AS conversion_rate,
        total_value,
        total_nights,
        avg_conversion_days
      FROM
        agent_conversions_durata_massima
    ) dm ON t.agent = dm.agent AND t.agent_name = dm.agent_name
    ORDER BY COALESCE(o.num_bookings, 0) DESC
  )
  
  SELECT json_build_object(
    'total_stats', (SELECT row_to_json(total_stats) FROM total_stats),
    'agent_conversions', (
      SELECT json_agg(
        json_build_object(
          'agent', COALESCE(ar.agent, ''),
          'agent_name', COALESCE(ar.agent_name, ar.agent, 'Sconosciuto'),
          'total_answered_calls', ar.total_answered_calls,
          'original', json_build_object(
            'num_bookings', COALESCE(ar.original_num_bookings, 0),
            'conversion_rate', CASE 
                                WHEN ar.total_answered_calls > 0 
                                THEN (COALESCE(ar.original_num_bookings, 0)::numeric / ar.total_answered_calls) * 100
                                ELSE 0 
                              END,
            'total_value', COALESCE(ar.original_total_value, 0),
            'total_nights', COALESCE(ar.original_total_nights, 0),
            'avg_conversion_days', COALESCE(ar.original_avg_conversion_days, 0)
          ),
          'first_contact', json_build_object(
            'num_bookings', COALESCE(ar.first_contact_num_bookings, 0),
            'conversion_rate', CASE 
                                WHEN ar.total_answered_calls > 0 
                                THEN (COALESCE(ar.first_contact_num_bookings, 0)::numeric / ar.total_answered_calls) * 100
                                ELSE 0 
                              END,
            'total_value', COALESCE(ar.first_contact_total_value, 0),
            'total_nights', COALESCE(ar.first_contact_total_nights, 0),
            'avg_conversion_days', COALESCE(ar.first_contact_avg_conversion_days, 0)
          ),
          'max_duration', json_build_object(
            'num_bookings', COALESCE(ar.max_duration_num_bookings, 0),
            'conversion_rate', CASE 
                                WHEN ar.total_answered_calls > 0 
                                THEN (COALESCE(ar.max_duration_num_bookings, 0)::numeric / ar.total_answered_calls) * 100
                                ELSE 0 
                              END,
            'total_value', COALESCE(ar.max_duration_total_value, 0),
            'total_nights', COALESCE(ar.max_duration_total_nights, 0),
            'avg_conversion_days', COALESCE(ar.max_duration_avg_conversion_days, 0)
          )
        )
      )
      FROM agent_results ar
    ),
    'filter_applied', filter_short_calls
  ) INTO result_json;
  
  RETURN result_json;
END;
$function$;
