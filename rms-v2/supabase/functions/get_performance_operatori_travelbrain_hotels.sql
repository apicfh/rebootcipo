-- Funzione RPC per ottenere la lista degli hotel disponibili
CREATE OR REPLACE FUNCTION get_performance_operatori_travelbrain_hotels()
RETURNS TABLE (
  hotel_id INTEGER,
  total_quotes BIGINT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mop.hotel_id,
    SUM(mop.quotes) as total_quotes
  FROM analytics.mw_operatori_preventivi mop
  WHERE mop.hotel_id IS NOT NULL
  GROUP BY mop.hotel_id
  ORDER BY total_quotes DESC;
END;
$$;
