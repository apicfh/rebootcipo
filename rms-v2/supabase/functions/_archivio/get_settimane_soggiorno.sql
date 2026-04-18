-- Funzione RPC per recuperare le settimane di soggiorno disponibili
CREATE OR REPLACE FUNCTION get_settimane_soggiorno(
  p_anno integer DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  inizio date,
  fine date,
  nome text,
  anno integer
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.inizio,
    s.fine,
    s.nome,
    s.anno
  FROM settimane_soggiorno s
  WHERE (p_anno IS NULL OR s.anno = p_anno)
  ORDER BY s.inizio;
END;
$$;

-- Verifica che la funzione sia stata creata
SELECT 'Funzione get_settimane_soggiorno creata con successo!' as messaggio;
