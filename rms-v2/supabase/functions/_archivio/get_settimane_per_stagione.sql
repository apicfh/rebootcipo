CREATE OR REPLACE FUNCTION get_settimane_per_stagione(anno_param integer)
RETURNS TABLE (
  id uuid,
  nome text,
  inizio date,
  fine date
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ss.id,
    ss.nome,
    ss.inizio,
    ss.fine
  FROM settimane_soggiorno ss
  WHERE ss.anno = anno_param
  ORDER BY ss.inizio;
END;
$$;
