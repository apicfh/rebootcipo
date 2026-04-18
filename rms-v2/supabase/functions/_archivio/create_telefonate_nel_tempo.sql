-- Funzione per ottenere l'andamento delle telefonate nel tempo
CREATE OR REPLACE FUNCTION telefonate_nel_tempo(
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
  -- Costruisci la query con filtro opzionale per le chiamate brevi
  WITH filtered_calls AS (
    SELECT *
    FROM telefonate
    WHERE date BETWEEN data_inizio AND data_fine
    AND (
      NOT filter_short_calls
      OR (
        (telefonate.result = 'ANSWER' OR telefonate.result = 'ANSWERED') AND telefonate.duration >= 10
        OR
        (telefonate.result = 'ABANDON' OR telefonate.result = 'NO ANSWER' OR telefonate.result = 'NOANSWER') AND telefonate.duration >= 5
        OR
        (telefonate.result != 'ANSWER' AND telefonate.result != 'ANSWERED' AND telefonate.result != 'ABANDON' AND telefonate.result != 'NO ANSWER' AND telefonate.result != 'NOANSWER')
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
  -- Distribuzione per hotel (qdescr)
  hotel_distribution AS (
    SELECT 
      date,
      qdescr,
      COUNT(*) AS calls
    FROM filtered_calls
    GROUP BY date, qdescr
    ORDER BY date, qdescr
  ),
  -- Andamento per tipo di risultato
  result_trends AS (
    SELECT 
      date,
      CASE 
        WHEN filtered_calls.result = 'ANSWER' OR filtered_calls.result = 'ANSWERED' THEN 'ANSWERED'
        WHEN filtered_calls.result = 'ABANDON' OR filtered_calls.result = 'NO ANSWER' OR filtered_calls.result = 'NOANSWER' THEN 'NO ANSWER'
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
    'result_trends', (SELECT jsonb_agg(jsonb_build_object('date', date, 'result_type', result_type, 'calls', calls)) FROM result_trends)
  ) INTO result_json;
  
  RETURN result_json;
END;
$$;
