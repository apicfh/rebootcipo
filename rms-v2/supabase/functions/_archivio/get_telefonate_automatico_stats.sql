-- Funzione per statistiche telefonate dalla tabella telefonate_automatico
CREATE OR REPLACE FUNCTION public.get_telefonate_automatico_stats(
  p_data_inizio date,
  p_data_fine date,
  p_hotel_ids uuid[] DEFAULT NULL,
  p_filter_short_calls boolean DEFAULT false
)
RETURNS json
LANGUAGE plpgsql
AS $function$
DECLARE
  result_json json;
BEGIN
  WITH telefonate_filtered AS (
    SELECT 
      -- Adattamento campi per telefonate_automatico
      DATE(ta."Data/Ora Inizio") as date,
      EXTRACT(HOUR FROM ta."Data/Ora Inizio") as hour,
      ta."Agente" as agent,
      ta."Agente" as agent_name, -- Stesso campo per compatibilità
      ta."Coda" as qdescr,
      ta."Stato" as result,
      ta."Durata (sec)" as duration,
      0 as hold, -- Non disponibile in telefonate_automatico
      false as recalled, -- Non disponibile in telefonate_automatico
      h.id AS id_hotel,
      h.nome AS hotel_name,
      ta."Durata (sec)" AS duration_seconds,
      0 AS hold_seconds
    FROM 
      telefonate_automatico ta
    LEFT JOIN 
      code_Youneed c ON ta."Coda" = c.nome_coda
    LEFT JOIN 
      hotel h ON c.id_hotel = h.id
    WHERE 
      DATE(ta."Data/Ora Inizio") BETWEEN p_data_inizio AND p_data_fine
      AND (p_hotel_ids IS NULL OR h.id = ANY(p_hotel_ids))
      -- Filtro chiamate brevi adattato per telefonate_automatico
      AND (
        NOT p_filter_short_calls 
        OR (
          NOT (
            (ta."Stato" = 'ABANDON' AND ta."Durata (sec)" < 5) 
            OR 
            ((ta."Stato" = 'ANSWER' OR ta."Stato" = 'ANSWERED') AND ta."Durata (sec)" < 10)
          )
        )
      )
  ),
  
  -- Statistiche per agente
  agent_stats AS (
    SELECT
      agent,
      agent_name,
      hotel_name,
      COUNT(*) AS total_calls,
      COUNT(CASE WHEN result = 'ANSWERED' OR result = 'ANSWER' THEN 1 END) AS answered_calls,
      SUM(duration_seconds) AS total_duration_seconds
    FROM
      telefonate_filtered
    WHERE
      agent != 'NONE' -- Esclude agenti nulli specifici di telefonate_automatico
    GROUP BY
      agent, agent_name, hotel_name
  ),
  
  -- Statistiche giornaliere
  daily_stats AS (
    SELECT
      date AS giorno,
      hotel_name,
      result,
      COUNT(*) AS count
    FROM
      telefonate_filtered
    GROUP BY
      date, hotel_name, result
  ),
  
  -- Statistiche per risultato
  result_stats AS (
    SELECT
      result,
      hotel_name,
      COUNT(*) AS count
    FROM
      telefonate_filtered
    GROUP BY
      result, hotel_name
  ),
  
  -- Statistiche recalled non disponibili in telefonate_automatico
  recalled_stats AS (
    SELECT
      'N/A' as recalled,
      0 AS count
    WHERE FALSE -- Sempre vuoto per telefonate_automatico
  ),
  
  -- Statistiche temporali per chiamate risposte e abbandonate
  time_series_stats AS (
    SELECT
      date,
      SUM(CASE WHEN result = 'ANSWERED' OR result = 'ANSWER' THEN 1 ELSE 0 END) AS answered_calls,
      SUM(CASE WHEN result = 'ABANDON' OR result = 'EXITWITHTIMEOUT' THEN 1 ELSE 0 END) AS abandoned_calls
    FROM
      telefonate_filtered
    GROUP BY
      date
    ORDER BY
      date
  ),
  
  -- Elenco degli hotel
  hotel_list AS (
    SELECT DISTINCT
      id_hotel,
      hotel_name
    FROM
      telefonate_filtered
    WHERE
      hotel_name IS NOT NULL
  )
  
  SELECT json_build_object(
    'top_agents', (SELECT json_agg(agent_stats) FROM agent_stats),
    'daily_calls', (SELECT json_agg(daily_stats) FROM daily_stats),
    'result_stats', (SELECT json_agg(result_stats) FROM result_stats),
    'recalled_stats', (SELECT json_agg(recalled_stats) FROM recalled_stats),
    'time_series_stats', (SELECT json_agg(time_series_stats) FROM time_series_stats),
    'hotels', (SELECT json_agg(hotel_list) FROM hotel_list),
    'filter_applied', p_filter_short_calls,
    'source_table', 'telefonate_automatico'
  ) INTO result_json;
  
  RETURN result_json;
END;
$function$;

COMMENT ON FUNCTION public.get_telefonate_automatico_stats IS 'Recupera statistiche delle telefonate dalla tabella telefonate_automatico, adattata per la nuova struttura dati.';
