-- Funzione RPC per ottenere la lista degli operatori disponibili
CREATE OR REPLACE FUNCTION get_performance_operatori_travelbrain_operators()
RETURNS TABLE (
  operator_name TEXT,
  total_quotes BIGINT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mop.operator_name,
    SUM(mop.quotes) as total_quotes
  FROM analytics.mw_operatori_preventivi mop
  WHERE mop.operator_name IS NOT NULL 
    AND mop.operator_name != '(sconosciuto)'
  GROUP BY mop.operator_name
  ORDER BY total_quotes DESC;
END;
$$;
