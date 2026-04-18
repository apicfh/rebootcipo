CREATE OR REPLACE FUNCTION public.get_telefonate_per_operatore_giorno(
  data_inizio date,
  data_fine date,
  filter_short_calls boolean DEFAULT true
)
RETURNS TABLE(
  data date,
  agent_name text,
  total_calls bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.date::date AS data,
    COALESCE(t.agent_name, a.nome, t.agent) AS agent_name,
    COUNT(*)::bigint AS total_calls
  FROM 
    telefonate t
  LEFT JOIN 
    "Agenti Youneed" a ON t.agent = a.nome
  WHERE 
    t.date::date BETWEEN data_inizio AND data_fine
    AND (NOT filter_short_calls OR t.duration > 10) -- Filtra chiamate brevi se richiesto
    AND t.result = 'ANSWERED' -- Solo chiamate risposte
  GROUP BY 
    t.date::date, 
    COALESCE(t.agent_name, a.nome, t.agent)
  ORDER BY 
    t.date::date, 
    COALESCE(t.agent_name, a.nome, t.agent);
END;
$$;
