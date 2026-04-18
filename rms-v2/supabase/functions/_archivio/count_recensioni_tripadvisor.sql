CREATE OR REPLACE FUNCTION public.count_recensioni_tripadvisor()
RETURNS TABLE(total_count bigint)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT COUNT(*) as total_count
  FROM tripadvisor_recensioni;
END;
$$;
