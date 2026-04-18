CREATE OR REPLACE FUNCTION public.get_telefonate_stats_by_hotel(
  p_data_inizio date,
  p_data_fine date,
  p_hotel_ids uuid[] DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  result_json json;
BEGIN
  WITH telefonate_with_hotel AS (
    SELECT 
      t.date,
      t.time,
      t.agent,
      t.agent_name,
      t.qdescr,
      t.result,
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
  ),
  
  -- Statistiche per agente
  agent_stats AS (
    SELECT
      agent,
      agent_name,
      hotel_name,
      COUNT(*) AS total_calls,
      COUNT(CASE WHEN result = 'ANSWERED' OR result = 'ANSWER' THEN 1 END) AS answered_calls,
      SUM(CASE WHEN result = 'ANSWERED' OR result = 'ANSWER' THEN duration ELSE 0 END) AS total_duration_seconds
    FROM
      telefonate_with_hotel
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
      telefonate_with_hotel
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
      telefonate_with_hotel
    GROUP BY
      result, hotel_name
  ),
  
  -- Elenco degli hotel
  hotel_list AS (
    SELECT DISTINCT
      id_hotel,
      hotel_name
    FROM
      telefonate_with_hotel
    WHERE
      hotel_name IS NOT NULL
  )
  
  SELECT json_build_object(
    'top_agents', (SELECT json_agg(agent_stats) FROM agent_stats),
    'daily_calls', (SELECT json_agg(daily_stats) FROM daily_stats),
    'result_stats', (SELECT json_agg(result_stats) FROM result_stats),
    'hotels', (SELECT json_agg(hotel_list) FROM hotel_list),
    'raw_data', (SELECT json_agg(telefonate_with_hotel) FROM telefonate_with_hotel)
  ) INTO result_json;
  
  RETURN result_json;
END;
$$;

COMMENT ON FUNCTION public.get_telefonate_stats_by_hotel IS 'Recupera statistiche delle telefonate raggruppate per hotel';
