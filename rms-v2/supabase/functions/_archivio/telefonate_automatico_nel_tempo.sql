-- Funzione per ottenere l'andamento delle telefonate nel tempo da telefonate_automatico
CREATE OR REPLACE FUNCTION telefonate_automatico_nel_tempo(
  data_inizio DATE,
  data_fine DATE,
  filter_short_calls BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  result_json JSONB;
BEGIN
  -- Query adattata per telefonate_automatico
  WITH filtered_calls AS (
    SELECT 
      DATE(ta."Data/Ora Inizio") as date,
      ta."Coda" as qdescr,
      ta."Stato" as result,
      ta."Durata (sec)" as duration
    FROM telefonate_automatico ta
    WHERE DATE(ta."Data/Ora Inizio") BETWEEN data_inizio AND data_fine
    AND (
      NOT filter_short_calls
      OR (
        (ta."Stato" = 'ANSWER' OR ta."Stato" = 'ANSWERED') AND ta."Durata (sec)" >= 10
        OR
        (ta."Stato" = 'ABANDON' OR ta."Stato" = 'EXITWITHTIMEOUT') AND ta."Durata (sec)" >= 5
        OR
        (ta."Stato" NOT IN ('ANSWER', 'ANSWERED', 'ABANDON', 'EXITWITHTIMEOUT'))
      )
    )
  ),
  -- Totale chiamate per giorno
  daily_totals AS (
    SELECT 
      date,
      COUNT(*) AS total_calls
    FROM filtered_calls
    GROUP BY date
    ORDER BY date
  ),
  -- Distribuzione per hotel (coda)
  hotel_distribution AS (
    SELECT 
      date,
      qdescr,
      COUNT(*) AS calls
    FROM filtered_calls
    GROUP BY date, qdescr
    ORDER BY date, qdescr
  ),
  -- Andamento per tipo di risultato adattato per telefonate_automatico
  result_trends AS (
    SELECT 
      date,
      CASE 
        WHEN result = 'ANSWER' OR result = 'ANSWERED' THEN 'ANSWERED'
        WHEN result = 'ABANDON' OR result = 'EXITWITHTIMEOUT' THEN 'NO ANSWER'
        ELSE 'OTHER'
      END AS result_type,
      COUNT(*) AS calls
    FROM filtered_calls
    GROUP BY date, result_type
    ORDER BY date, result_type
  )
  
  -- Costruisci il risultato JSON
  SELECT jsonb_build_object(
    'daily_totals', (SELECT jsonb_agg(jsonb_build_object('date', date, 'total_calls', total_calls)) FROM daily_totals),
    'hotel_distribution', (SELECT jsonb_agg(jsonb_build_object('date', date, 'qdescr', qdescr, 'calls', calls)) FROM hotel_distribution),
    'result_trends', (SELECT jsonb_agg(jsonb_build_object('date', date, 'result_type', result_type, 'calls', calls)) FROM result_trends),
    'source_table', 'telefonate_automatico'
  ) INTO result_json;
  
  RETURN result_json;
END;
$$;

COMMENT ON FUNCTION telefonate_automatico_nel_tempo IS 'Andamento temporale delle telefonate dalla tabella telefonate_automatico.';
