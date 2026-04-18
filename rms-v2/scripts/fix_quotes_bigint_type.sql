-- Fix the type mismatch by changing quotes column from integer to bigint
DROP FUNCTION IF EXISTS get_performance_operatori_travelbrain_data(date, date, text, integer[]);

CREATE OR REPLACE FUNCTION get_performance_operatori_travelbrain_data(
  start_date date,
  end_date date,
  operator_email text,
  hotel_ids integer[]
)
RETURNS TABLE (
  day date,
  hotel_id integer,
  operator_name text,
  quotes bigint  -- Changed from integer to bigint to match actual data type
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mop.day,
    mop.hotel_id,
    mop.operator_name,
    mop.quotes  -- Removed ::integer cast since we now return bigint
  FROM analytics.mw_operatori_preventivi mop
  WHERE mop.day >= start_date
    AND mop.day <= end_date
    AND mop.operator_name = operator_email
    AND mop.hotel_id = ANY(hotel_ids)
  ORDER BY mop.day, mop.hotel_id;
END;
$$;
