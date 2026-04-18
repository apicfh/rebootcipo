-- Ricrea la funzione get_recensioni_tripadvisor
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
  voti_utili integer,
  tipo_viaggio text,
  data_viaggio date,
  nome_utente text,
  provenienza_utente text,
  avatar_thumbnail text,
  avatar_small text,
  avatar_medium text,
  avatar_large text,
  avatar_original text,
  importato_il timestamp with time zone,
  aggiornato_il timestamp with time zone,
  hotel_nome text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.tripadvisor_review_id,
    r.hotel_id,
    r.location_id,
    r.titolo,
    r.testo,
    r.valutazione,
    r.data_pubblicazione,
    r.lingua,
    r.url,
    r.voti_utili,
    r.tipo_viaggio,
    r.data_viaggio,
    r.nome_utente,
    r.provenienza_utente,
    r.avatar_thumbnail,
    r.avatar_small,
    r.avatar_medium,
    r.avatar_large,
    r.avatar_original,
    r.importato_il,
    r.aggiornato_il,
    h.nome AS hotel_nome
  FROM 
    tripadvisor_recensioni r
  LEFT JOIN 
    hotel h ON r.hotel_id = h.id
  ORDER BY 
    r.data_pubblicazione DESC
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
  total_count integer;
BEGIN
  SELECT COUNT(*) INTO total_count FROM tripadvisor_recensioni;
  RETURN total_count;
END;
$$;

-- Crea una funzione per recuperare le recensioni di un hotel specifico
CREATE OR REPLACE FUNCTION public.get_recensioni_hotel(
  p_hotel_id uuid,
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
  voti_utili integer,
  tipo_viaggio text,
  data_viaggio date,
  nome_utente text,
  provenienza_utente text,
  avatar_thumbnail text,
  avatar_small text,
  avatar_medium text,
  avatar_large text,
  avatar_original text,
  importato_il timestamp with time zone,
  aggiornato_il timestamp with time zone,
  hotel_nome text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.tripadvisor_review_id,
    r.hotel_id,
    r.location_id,
    r.titolo,
    r.testo,
    r.valutazione,
    r.data_pubblicazione,
    r.lingua,
    r.url,
    r.voti_utili,
    r.tipo_viaggio,
    r.data_viaggio,
    r.nome_utente,
    r.provenienza_utente,
    r.avatar_thumbnail,
    r.avatar_small,
    r.avatar_medium,
    r.avatar_large,
    r.avatar_original,
    r.importato_il,
    r.aggiornato_il,
    h.nome AS hotel_nome
  FROM 
    tripadvisor_recensioni r
  LEFT JOIN 
    hotel h ON r.hotel_id = h.id
  WHERE 
    r.hotel_id = p_hotel_id
  ORDER BY 
    r.data_pubblicazione DESC
  LIMIT p_limit
  OFFSET p_offset;
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
