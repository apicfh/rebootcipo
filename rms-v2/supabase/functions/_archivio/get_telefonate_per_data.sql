-- Funzione per ottenere il conteggio delle telefonate per data
CREATE OR REPLACE FUNCTION get_telefonate_per_data(
  data_inizio date,
  data_fine date,
  filter_short_calls boolean DEFAULT false
)
RETURNS TABLE (
  data date,
  conteggio bigint
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    date::date as data,
    COUNT(*)::bigint as conteggio
  FROM 
    telefonate
  WHERE 
    date >= data_inizio
    AND date <= data_fine
    AND (
      NOT filter_short_calls 
      OR (
        filter_short_calls AND (
          (result = 'ANSWER' AND duration >= 10) OR
          (result = 'ABANDON' AND duration >= 5) OR
          (result != 'ANSWER' AND result != 'ABANDON')
        )
      )
    )
  GROUP BY 
    date::date
  ORDER BY 
    date::date;
END;
$$;
