DROP FUNCTION IF EXISTS public.get_telefonate_automatico_stats_optimized(date, date, uuid[], boolean);

CREATE OR REPLACE FUNCTION public.get_telefonate_automatico_stats_optimized(
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
  WITH telefonate_processed AS (
    SELECT 
      ta.id,
      -- Scomposizione temporale per ottimizzare aggregazioni
      ta."Data/Ora Inizio"::date AS data_chiamata,
      EXTRACT(hour FROM ta."Data/Ora Inizio") AS ora_chiamata,
      EXTRACT(dow FROM ta."Data/Ora Inizio") AS giorno_settimana,
      ta."Chiamante" AS numero_telefono,
      CASE 
        WHEN ta."Agente" = 'NONE' THEN NULL 
        ELSE ta."Agente" 
      END AS agent,
      ta."Durata (sec)" AS duration,
      ta."Stato" AS result,
      ta."Coda" AS coda,
      h.id AS id_hotel,
      h.nome AS hotel_name,
      -- Rimosso riferimento a ay.codice che non esiste, uso direttamente ta."Agente"
      COALESCE(ay.nome, ta."Agente") AS agent_name
    FROM 
      telefonate_automatico ta
    LEFT JOIN 
      code_Youneed c ON ta."Coda" = c.nome_coda
    LEFT JOIN 
      hotel h ON c.id_hotel = h.id
    LEFT JOIN 
      -- Corretto join con Agenti Youneed usando il campo corretto
      "Agenti Youneed" ay ON ta."Agente" = ay.nome
    WHERE 
      ta."Data/Ora Inizio"::date BETWEEN data_inizio AND data_fine
      AND (hotel_ids IS NULL OR h.id = ANY(hotel_ids))
      -- Filtro per chiamate brevi adattato ai nuovi stati
      AND (NOT filter_short_calls OR 
           (ta."Stato" = 'ANSWER' AND ta."Durata (sec)" >= 10) OR
           (ta."Stato" IN ('ABANDON', 'EXITWITHTIMEOUT') AND ta."Durata (sec)" >= 5))
  ),
  
  stats_totali AS (
    SELECT
      COUNT(*) AS totale_chiamate,
      COUNT(CASE WHEN result = 'ANSWER' THEN 1 END) AS chiamate_risposte,
      COUNT(CASE WHEN result = 'ABANDON' THEN 1 END) AS chiamate_abbandonate,
      COUNT(CASE WHEN result = 'EXITWITHTIMEOUT' THEN 1 END) AS chiamate_timeout,
      COALESCE(AVG(CASE WHEN result = 'ANSWER' THEN duration END), 0) AS durata_media_risposte,
      COALESCE(SUM(CASE WHEN result = 'ANSWER' THEN duration END), 0) AS durata_totale_risposte
    FROM telefonate_processed
  ),
  
  -- Aggregazione per giorno usando il campo data_chiamata estratto
  stats_giornaliere AS (
    SELECT
      data_chiamata,
      COUNT(*) AS chiamate_giorno,
      COUNT(CASE WHEN result = 'ANSWER' THEN 1 END) AS risposte_giorno,
      COALESCE(AVG(CASE WHEN result = 'ANSWER' THEN duration END), 0) AS durata_media_giorno
    FROM telefonate_processed
    GROUP BY data_chiamata
    ORDER BY data_chiamata
  ),
  
  -- Distribuzione oraria usando il campo ora_chiamata estratto
  distribuzione_oraria AS (
    SELECT
      ora_chiamata,
      COUNT(*) AS chiamate_ora,
      COUNT(CASE WHEN result = 'ANSWER' THEN 1 END) AS risposte_ora
    FROM telefonate_processed
    WHERE ora_chiamata BETWEEN 7 AND 23
    GROUP BY ora_chiamata
    ORDER BY ora_chiamata
  ),
  
  stats_per_agente AS (
    SELECT
      COALESCE(agent, 'Sconosciuto') AS agent,
      COALESCE(agent_name, agent, 'Sconosciuto') AS agent_name,
      COUNT(*) AS totale_chiamate_agente,
      COUNT(CASE WHEN result = 'ANSWER' THEN 1 END) AS risposte_agente,
      COALESCE(AVG(CASE WHEN result = 'ANSWER' THEN duration END), 0) AS durata_media_agente
    FROM telefonate_processed
    WHERE agent IS NOT NULL
    GROUP BY agent, agent_name
    ORDER BY risposte_agente DESC
  )
  
  SELECT json_build_object(
    'stats_totali', (SELECT row_to_json(stats_totali) FROM stats_totali),
    'stats_giornaliere', (
      SELECT json_agg(row_to_json(sg))
      FROM stats_giornaliere sg
    ),
    'distribuzione_oraria', (
      SELECT json_agg(row_to_json(dh))
      FROM distribuzione_oraria dh
    ),
    'stats_per_agente', (
      SELECT json_agg(row_to_json(spa))
      FROM stats_per_agente spa
    ),
    'source_table', 'telefonate_automatico',
    'filter_applied', filter_short_calls
  ) INTO result_json;
  
  RETURN result_json;
END;
$function$;
