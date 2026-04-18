-- Ricrea la funzione get_recensioni_tripadvisor con l'implementazione corretta
CREATE OR REPLACE FUNCTION public.get_recensioni_tripadvisor(
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid, 
  tripadvisor_review_id bigint, 
  hotel_id uuid, 
  location_id bigint, 
  titolo text, 
  testo text, 
  valutazione numeric, 
  data_pubblicazione timestamp with time zone, 
  lingua text, 
  url text, 
  data_viaggio date, 
  nome_utente text, 
  provenienza_utente text, 
  importato_il timestamp with time zone, 
  aggiornato_il timestamp with time zone, 
  hotel_nome text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tr.id,
    tr.tripadvisor_review_id,
    tr.hotel_id,
    tr.location_id,
    tr.titolo,
    tr.testo,
    tr.valutazione,
    tr.data_pubblicazione,
    tr.lingua,
    tr.url,
    tr.data_viaggio,
    tr.nome_utente,
    tr.provenienza_utente,
    tr.importato_il,
    tr.aggiornato_il,
    h.nome AS hotel_nome
  FROM 
    tripadvisor_recensioni tr
  LEFT JOIN 
    hotel h ON tr.hotel_id = h.id
  ORDER BY 
    tr.data_pubblicazione DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Crea una funzione per contare le recensioni
CREATE OR REPLACE FUNCTION public.count_recensioni_tripadvisor()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  recensioni_count integer;
BEGIN
  SELECT COUNT(*) INTO recensioni_count FROM tripadvisor_recensioni;
  RETURN recensioni_count;
END;
$$;

-- Crea una funzione per verificare la struttura della tabella
CREATE OR REPLACE FUNCTION public.check_tripadvisor_recensioni_table()
RETURNS TABLE(
  column_name text,
  data_type text,
  is_nullable text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.column_name::text,
    c.data_type::text,
    c.is_nullable::text
  FROM 
    information_schema.columns c
  WHERE 
    c.table_name = 'tripadvisor_recensioni'
  ORDER BY 
    c.ordinal_position;
END;
$$;
