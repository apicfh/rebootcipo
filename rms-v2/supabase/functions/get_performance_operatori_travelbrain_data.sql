-- Funzione RPC per ottenere i dati della performance operatori da mw_operatori_preventivi
CREATE OR REPLACE FUNCTION get_performance_operatori_travelbrain_data(
  p_date_start DATE DEFAULT NULL,
  p_date_end DATE DEFAULT NULL,
  p_operator_name TEXT DEFAULT NULL,
  p_hotel_ids INTEGER[] DEFAULT NULL
)
RETURNS TABLE (
  day DATE,
  hotel_id INTEGER,
  operator_name TEXT,
  quotes INTEGER
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mop.day,
    mop.hotel_id,
    mop.operator_name,
    mop.quotes
  FROM analytics.mw_operatori_preventivi mop
  WHERE 
    (p_date_start IS NULL OR mop.day >= p_date_start)
    AND (p_date_end IS NULL OR mop.day <= p_date_end)
    AND (p_operator_name IS NULL OR mop.operator_name = p_operator_name)
    AND (p_hotel_ids IS NULL OR mop.hotel_id = ANY(p_hotel_ids))
  ORDER BY mop.day ASC, mop.hotel_id ASC;
END;
$$;
