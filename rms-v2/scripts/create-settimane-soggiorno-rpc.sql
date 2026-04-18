-- Script per creare la funzione RPC get_settimane_soggiorno
-- Da eseguire nel SQL Editor di Supabase

-- Elimina la funzione se esiste già
DROP FUNCTION IF EXISTS get_settimane_soggiorno(integer);

-- Crea la funzione RPC per recuperare le settimane di soggiorno
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
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM pg_proc 
    WHERE proname = 'get_settimane_soggiorno'
  ) THEN
    RAISE NOTICE 'Funzione get_settimane_soggiorno creata con successo!';
  ELSE
    RAISE EXCEPTION 'Errore nella creazione della funzione get_settimane_soggiorno';
  END IF;
END $$;

-- Test della funzione (decommenta per testare)
-- SELECT * FROM get_settimane_soggiorno(2025);
