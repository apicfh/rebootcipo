-- Drop existing problematic functions
DROP FUNCTION IF EXISTS analytics.get_pressione_domanda_stats_travelbrain(date, date, integer[]);
DROP FUNCTION IF EXISTS analytics.get_pressione_domanda_travelbrain(date, date, date, date, integer[]);

-- Create simple function to query mv_pressione_hotel_giorno
CREATE OR REPLACE FUNCTION analytics.get_pressione_domanda_data_travelbrain(
  p_request_start_date date,
  p_request_end_date date,
  p_stay_start_date date,
  p_stay_end_date date,
  p_hotel_ids integer[]
)
RETURNS TABLE (
  hotel_id integer,
  day_date date,
  n bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mv.hotel_id,
    mv.day_date,
    mv.n
  FROM analytics.mv_pressione_hotel_giorno mv
  WHERE 
    mv.day_date >= p_stay_start_date
    AND mv.day_date <= p_stay_end_date
    AND (p_hotel_ids IS NULL OR mv.hotel_id = ANY(p_hotel_ids))
  ORDER BY mv.day_date, mv.hotel_id;
END;
$$;

-- Create simple stats function
CREATE OR REPLACE FUNCTION analytics.get_pressione_domanda_stats_travelbrain(
  p_request_start_date date,
  p_request_end_date date,
  p_stay_start_date date,
  p_stay_end_date date,
  p_hotel_ids integer[]
)
RETURNS TABLE (
  total_pressure bigint,
  avg_daily_pressure numeric,
  max_daily_pressure bigint,
  days_analyzed bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(mv.n), 0) as total_pressure,
    COALESCE(AVG(mv.n), 0) as avg_daily_pressure,
    COALESCE(MAX(mv.n), 0) as max_daily_pressure,
    COUNT(DISTINCT mv.day_date) as days_analyzed
  FROM analytics.mv_pressione_hotel_giorno mv
  WHERE 
    mv.day_date >= p_stay_start_date
    AND mv.day_date <= p_stay_end_date
    AND (p_hotel_ids IS NULL OR mv.hotel_id = ANY(p_hotel_ids));
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION analytics.get_pressione_domanda_data_travelbrain(date, date, date, date, integer[]) TO authenticated;
GRANT EXECUTE ON FUNCTION analytics.get_pressione_domanda_stats_travelbrain(date, date, date, date, integer[]) TO authenticated;
