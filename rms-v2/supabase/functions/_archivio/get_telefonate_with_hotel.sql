CREATE OR REPLACE FUNCTION public.get_telefonate_with_hotel(
  p_data_inizio date,
  p_data_fine date,
  p_hotel_ids uuid[] DEFAULT NULL
)
RETURNS TABLE (
  date date,
  call_time time without time zone,
  agent text,
  agent_name text,
  qdescr text,
  result text,
  duration integer,
  id_hotel uuid,
  hotel_name text
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.date,
    t.time AS call_time,
    t.agent,
    t.agent_name,
    t.qdescr,
    t.result,
    t.duration,
    h.id AS id_hotel,
    h.nome AS hotel_name
  FROM 
    telefonate t
  LEFT JOIN 
    code_Youneed c ON t.qdescr = c.nome_coda
  LEFT JOIN 
    hotel h ON c.id_hotel = h.id
  WHERE 
    t.date BETWEEN p_data_inizio AND p_data_fine
    AND (p_hotel_ids IS NULL OR h.id = ANY(p_hotel_ids))
  ORDER BY 
    t.date DESC, t.time DESC;
END;
$$;

COMMENT ON FUNCTION public.get_telefonate_with_hotel IS 'Recupera le telefonate con informazioni sull''hotel associato';
