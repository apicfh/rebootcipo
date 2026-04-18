-- Funzione per recuperare i dati della domanda provvisoria
CREATE OR REPLACE FUNCTION public.get_domanda_provvisorio(
  data_inizio date DEFAULT NULL,
  data_fine date DEFAULT NULL
)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Se non viene specificata una data di inizio, usa gli ultimi 7 giorni
  IF data_inizio IS NULL THEN
    data_inizio := CURRENT_DATE - INTERVAL '7 days';
  END IF;
  
  -- Se non viene specificata una data di fine, usa oggi
  IF data_fine IS NULL THEN
    data_fine := CURRENT_DATE;
  END IF;

  -- Restituisci i dati dalla tabella provvisorio_domanda (nome corretto)
  RETURN QUERY
  SELECT row_to_json(t)
  FROM (
    SELECT *
    FROM provvisorio_domanda
    WHERE data BETWEEN data_inizio AND data_fine
    ORDER BY data DESC
  ) t;
END;
$$;

-- Concedi i permessi per eseguire la funzione
GRANT EXECUTE ON FUNCTION public.get_domanda_provvisorio(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_domanda_provvisorio(date, date) TO service_role;
