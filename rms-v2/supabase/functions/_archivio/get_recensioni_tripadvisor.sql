CREATE OR REPLACE FUNCTION public.get_recensioni_tripadvisor(
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0
)
RETURNS SETOF tripadvisor_recensioni
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM tripadvisor_recensioni
  ORDER BY data_pubblicazione DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;
