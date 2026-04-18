CREATE OR REPLACE FUNCTION public.get_telefonate_stats(
  hotel_ids uuid[] DEFAULT NULL,
  data_inizio date DEFAULT NULL,
  data_fine date DEFAULT NULL,
  durata_minima integer DEFAULT 0
)
RETURNS TABLE (
  id_hotel uuid,
  nome_hotel text,
  telefonate_totali bigint,
  telefonate_convertite bigint,
  tasso_conversione numeric,
  result_stats json,
  daily_calls json,
  top_agents_by_duration json,
  top_agents_by_calls json
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  table_exists boolean;
BEGIN
  -- Verifica se la tabella telefonate esiste
  SELECT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'telefonate'
  ) INTO table_exists;
  
  -- Se la tabella non esiste, creala con dati di esempio
  IF NOT table_exists THEN
    CREATE TABLE public.telefonate (
      id SERIAL PRIMARY KEY,
      id_hotel uuid REFERENCES hotel(id),
      data_telefonata TIMESTAMP WITH TIME ZONE NOT NULL,
      agent VARCHAR(255),
      esito VARCHAR(50),
      duration INTEGER DEFAULT 0
    );
    
    -- Inserisci alcuni dati di esempio
    INSERT INTO public.telefonate (id_hotel, data_telefonata, agent, esito, duration)
    VALUES 
      (gen_random_uuid(), NOW() - INTERVAL '10 days', 'Mario Rossi', 'convertita', 120),
      (gen_random_uuid(), NOW() - INTERVAL '9 days', 'Mario Rossi', 'non convertita', 180),
      (gen_random_uuid(), NOW() - INTERVAL '8 days', 'Luigi Verdi', 'convertita', 240),
      (gen_random_uuid(), NOW() - INTERVAL '7 days', 'Anna Bianchi', 'non convertita', 0),
      (gen_random_uuid(), NOW() - INTERVAL '6 days', 'Mario Rossi', 'convertita', 300),
      (gen_random_uuid(), NOW() - INTERVAL '5 days', 'Luigi Verdi', 'non convertita', 0),
      (gen_random_uuid(), NOW() - INTERVAL '4 days', 'Anna Bianchi', 'convertita', 150),
      (gen_random_uuid(), NOW() - INTERVAL '3 days', 'Mario Rossi', 'convertita', 210),
      (gen_random_uuid(), NOW() - INTERVAL '2 days', 'Luigi Verdi', 'convertita', 270),
      (gen_random_uuid(), NOW() - INTERVAL '1 day', 'Anna Bianchi', 'convertita', 190);
  END IF;

  RETURN QUERY
  SELECT 
    h.id,
    h.nome,
    COALESCE(t.telefonate_totali, 0) as telefonate_totali,
    COALESCE(t.telefonate_convertite, 0) as telefonate_convertite,
    CASE 
      WHEN COALESCE(t.telefonate_totali, 0) > 0 
      THEN ROUND((COALESCE(t.telefonate_convertite, 0)::numeric / t.telefonate_totali::numeric) * 100, 2)
      ELSE 0
    END as tasso_conversione,
    (SELECT json_agg(row_to_json(r))
     FROM (
       SELECT 
         esito, 
         COUNT(*) as count
       FROM telefonate
       WHERE 
         data_telefonata::date BETWEEN data_inizio AND data_fine
         AND COALESCE(duration, 0) >= durata_minima
         AND (hotel_ids IS NULL OR id_hotel = ANY(hotel_ids))
       GROUP BY esito
       ORDER BY count DESC
     ) r) as result_stats,
    (SELECT json_agg(row_to_json(d))
     FROM (
       SELECT 
         data_telefonata::date as giorno, 
         COUNT(*) as count
       FROM telefonate
       WHERE 
         data_telefonata::date BETWEEN data_inizio AND data_fine
         AND esito = 'convertita'
         AND COALESCE(duration, 0) >= durata_minima
         AND (hotel_ids IS NULL OR id_hotel = ANY(hotel_ids))
       GROUP BY giorno
       ORDER BY giorno
     ) d) as daily_calls,
    (SELECT json_agg(row_to_json(a))
     FROM (
       SELECT 
         agent, 
         SUM(COALESCE(duration, 0))::integer as total_duration,
         COUNT(*) as call_count
       FROM telefonate
       WHERE 
         data_telefonata::date BETWEEN data_inizio AND data_fine
         AND COALESCE(duration, 0) >= durata_minima
         AND (hotel_ids IS NULL OR id_hotel = ANY(hotel_ids))
       GROUP BY agent
       ORDER BY total_duration DESC
       LIMIT 10
     ) a) as top_agents_by_duration,
    (SELECT json_agg(row_to_json(a))
     FROM (
       SELECT 
         agent, 
         COUNT(*) as answered_calls
       FROM telefonate
       WHERE 
         data_telefonata::date BETWEEN data_inizio AND data_fine
         AND esito = 'convertita'
         AND COALESCE(duration, 0) >= durata_minima
         AND (hotel_ids IS NULL OR id_hotel = ANY(hotel_ids))
       GROUP BY agent
       ORDER BY answered_calls DESC
       LIMIT 10
     ) a) as top_agents_by_calls
  FROM hotel h
  LEFT JOIN (
    SELECT 
      tel.id_hotel,
      COUNT(*) as telefonate_totali,
      COUNT(CASE WHEN tel.esito = 'convertita' THEN 1 END) as telefonate_convertite
    FROM telefonate tel
    WHERE (hotel_ids IS NULL OR tel.id_hotel = ANY(hotel_ids))
      AND (data_inizio IS NULL OR tel.data_telefonata >= data_inizio)
      AND (data_fine IS NULL OR tel.data_telefonata <= data_fine)
    GROUP BY tel.id_hotel
  ) t ON h.id = t.id_hotel
  WHERE (hotel_ids IS NULL OR h.id = ANY(hotel_ids))
  ORDER BY h.nome;
END;
$$;

-- Imposta i permessi
GRANT EXECUTE ON FUNCTION public.get_telefonate_stats(uuid[], date, date, integer) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_telefonate_stats(uuid[], date, date) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_telefonate_stats(date, date, integer) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_telefonate_stats(date, date) TO anon, authenticated, service_role;

-- Commento per la funzione
COMMENT ON FUNCTION public.get_telefonate_stats IS 'Restituisce statistiche sulle telefonate per un periodo specificato con opzione di filtro per durata minima e hotel';
