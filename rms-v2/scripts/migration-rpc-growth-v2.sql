-- Migration: Growth RPC Functions v2
-- Description: Improved growth pace RPC functions with better structure and window functions
-- Created: 2026-02-01

-- Drop old RPC functions
DROP FUNCTION IF EXISTS public.rpc_growth_quotes_pace(uuid, text, text[], text, boolean) CASCADE;
DROP FUNCTION IF EXISTS public.rpc_growth_bookings_pace(uuid, text, text[], text, boolean) CASCADE;
DROP FUNCTION IF EXISTS public.rpc_growth_pace_combined(uuid, text, text[], text, boolean) CASCADE;

-- RPC 1: Growth Quotes Pace v2
-- Returns quotes growth data with actual/forecast separated and cumulative/incremental via computation
CREATE OR REPLACE FUNCTION public.rpc_growth_quotes_pace_v2(
  p_hotel_id uuid,
  p_stay_week_start text,
  p_room_type_ids text[] DEFAULT NULL,
  p_mode text DEFAULT 'incremental',
  p_include_forecast boolean DEFAULT true
)
RETURNS TABLE (
  request_week_start date,
  weeks_to_arrival integer,
  actual_value numeric,
  actual_low numeric,
  actual_up numeric,
  forecast_value numeric,
  forecast_low numeric,
  forecast_up numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH filtered_data AS (
    SELECT
      q.room_type_id,
      q.request_week_start,
      q.stay_week_start,
      q.quotes_num,
      q.quotes_num_low,
      q.quotes_num_up,
      q.is_forecast,
      (q.stay_week_start::date - q.request_week_start::date)::integer / 7 AS weeks_to_arrival
    FROM forecast_quotes_travelbrain q
    WHERE q.stay_week_start = p_stay_week_start::date
      AND q.hotel_id = p_hotel_id
      AND (p_room_type_ids IS NULL OR q.room_type_id = ANY(p_room_type_ids))
  ),
  with_cumulative AS (
    SELECT
      fd.request_week_start,
      fd.weeks_to_arrival,
      fd.is_forecast,
      fd.quotes_num,
      fd.quotes_num_low,
      fd.quotes_num_up,
      CASE 
        WHEN p_mode = 'cumulative' 
        THEN SUM(fd.quotes_num) OVER (
          PARTITION BY fd.is_forecast 
          ORDER BY fd.request_week_start ASC 
          ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        )
        ELSE fd.quotes_num
      END AS final_value,
      CASE 
        WHEN p_mode = 'cumulative' AND fd.quotes_num_low IS NOT NULL
        THEN SUM(fd.quotes_num_low) OVER (
          PARTITION BY fd.is_forecast 
          ORDER BY fd.request_week_start ASC 
          ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        )
        ELSE fd.quotes_num_low
      END AS final_low,
      CASE 
        WHEN p_mode = 'cumulative' AND fd.quotes_num_up IS NOT NULL
        THEN SUM(fd.quotes_num_up) OVER (
          PARTITION BY fd.is_forecast 
          ORDER BY fd.request_week_start ASC 
          ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        )
        ELSE fd.quotes_num_up
      END AS final_up
    FROM filtered_data fd
  ),
  pivoted AS (
    SELECT
      wc.request_week_start,
      wc.weeks_to_arrival,
      MAX(CASE WHEN wc.is_forecast = false THEN wc.final_value ELSE NULL END) AS actual_value,
      MAX(CASE WHEN wc.is_forecast = false THEN wc.final_low ELSE NULL END) AS actual_low,
      MAX(CASE WHEN wc.is_forecast = false THEN wc.final_up ELSE NULL END) AS actual_up,
      MAX(CASE WHEN wc.is_forecast = true THEN wc.final_value ELSE NULL END) AS forecast_value,
      MAX(CASE WHEN wc.is_forecast = true THEN wc.final_low ELSE NULL END) AS forecast_low,
      MAX(CASE WHEN wc.is_forecast = true THEN wc.final_up ELSE NULL END) AS forecast_up
    FROM with_cumulative wc
    GROUP BY wc.request_week_start, wc.weeks_to_arrival
  )
  SELECT
    p.request_week_start,
    CAST(p.weeks_to_arrival AS integer),
    COALESCE(p.actual_value, 0),
    p.actual_low,
    p.actual_up,
    COALESCE(p.forecast_value, 0),
    p.forecast_low,
    p.forecast_up
  FROM pivoted p
  WHERE (p_include_forecast = true OR p.forecast_value IS NULL)
  ORDER BY p.request_week_start ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- RPC 2: Growth Bookings Pace v2
-- Returns bookings growth data with actual/forecast separated and cumulative/incremental via computation
CREATE OR REPLACE FUNCTION public.rpc_growth_bookings_pace_v2(
  p_hotel_id uuid,
  p_stay_week_start text,
  p_room_type_ids text[] DEFAULT NULL,
  p_mode text DEFAULT 'incremental',
  p_include_forecast boolean DEFAULT true
)
RETURNS TABLE (
  request_week_start date,
  weeks_to_arrival integer,
  actual_value numeric,
  actual_low numeric,
  actual_up numeric,
  forecast_value numeric,
  forecast_low numeric,
  forecast_up numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH filtered_data AS (
    SELECT
      b.room_type_id,
      b.request_week_start,
      b.stay_week_start,
      b.reservation_num,
      b.reservation_num_low,
      b.reservation_num_up,
      b.is_forecast,
      (b.stay_week_start::date - b.request_week_start::date)::integer / 7 AS weeks_to_arrival
    FROM forecast_bookings_travelbrain b
    WHERE b.stay_week_start = p_stay_week_start::date
      AND b.hotel_id = p_hotel_id
      AND (p_room_type_ids IS NULL OR b.room_type_id = ANY(p_room_type_ids))
  ),
  with_cumulative AS (
    SELECT
      fd.request_week_start,
      fd.weeks_to_arrival,
      fd.is_forecast,
      fd.reservation_num,
      fd.reservation_num_low,
      fd.reservation_num_up,
      CASE 
        WHEN p_mode = 'cumulative' 
        THEN SUM(fd.reservation_num) OVER (
          PARTITION BY fd.is_forecast 
          ORDER BY fd.request_week_start ASC 
          ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        )
        ELSE fd.reservation_num
      END AS final_value,
      CASE 
        WHEN p_mode = 'cumulative' AND fd.reservation_num_low IS NOT NULL
        THEN SUM(fd.reservation_num_low) OVER (
          PARTITION BY fd.is_forecast 
          ORDER BY fd.request_week_start ASC 
          ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        )
        ELSE fd.reservation_num_low
      END AS final_low,
      CASE 
        WHEN p_mode = 'cumulative' AND fd.reservation_num_up IS NOT NULL
        THEN SUM(fd.reservation_num_up) OVER (
          PARTITION BY fd.is_forecast 
          ORDER BY fd.request_week_start ASC 
          ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        )
        ELSE fd.reservation_num_up
      END AS final_up
    FROM filtered_data fd
  ),
  pivoted AS (
    SELECT
      wc.request_week_start,
      wc.weeks_to_arrival,
      MAX(CASE WHEN wc.is_forecast = false THEN wc.final_value ELSE NULL END) AS actual_value,
      MAX(CASE WHEN wc.is_forecast = false THEN wc.final_low ELSE NULL END) AS actual_low,
      MAX(CASE WHEN wc.is_forecast = false THEN wc.final_up ELSE NULL END) AS actual_up,
      MAX(CASE WHEN wc.is_forecast = true THEN wc.final_value ELSE NULL END) AS forecast_value,
      MAX(CASE WHEN wc.is_forecast = true THEN wc.final_low ELSE NULL END) AS forecast_low,
      MAX(CASE WHEN wc.is_forecast = true THEN wc.final_up ELSE NULL END) AS forecast_up
    FROM with_cumulative wc
    GROUP BY wc.request_week_start, wc.weeks_to_arrival
  )
  SELECT
    p.request_week_start,
    CAST(p.weeks_to_arrival AS integer),
    COALESCE(p.actual_value, 0),
    p.actual_low,
    p.actual_up,
    COALESCE(p.forecast_value, 0),
    p.forecast_low,
    p.forecast_up
  FROM pivoted p
  WHERE (p_include_forecast = true OR p.forecast_value IS NULL)
  ORDER BY p.request_week_start ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- RPC 3: Growth Combined v2
-- Returns both quotes and bookings data in single output
CREATE OR REPLACE FUNCTION public.rpc_growth_combined_v2(
  p_hotel_id uuid,
  p_stay_week_start text,
  p_room_type_ids text[] DEFAULT NULL,
  p_mode text DEFAULT 'incremental',
  p_include_forecast boolean DEFAULT true
)
RETURNS TABLE (
  request_week_start date,
  weeks_to_arrival integer,
  quotes_actual_value numeric,
  quotes_actual_low numeric,
  quotes_actual_up numeric,
  quotes_forecast_value numeric,
  quotes_forecast_low numeric,
  quotes_forecast_up numeric,
  bookings_actual_value numeric,
  bookings_actual_low numeric,
  bookings_actual_up numeric,
  bookings_forecast_value numeric,
  bookings_forecast_low numeric,
  bookings_forecast_up numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH quotes_data AS (
    SELECT * FROM rpc_growth_quotes_pace_v2(
      p_hotel_id,
      p_stay_week_start,
      p_room_type_ids,
      p_mode,
      p_include_forecast
    )
  ),
  bookings_data AS (
    SELECT * FROM rpc_growth_bookings_pace_v2(
      p_hotel_id,
      p_stay_week_start,
      p_room_type_ids,
      p_mode,
      p_include_forecast
    )
  ),
  merged AS (
    SELECT
      COALESCE(q.request_week_start, b.request_week_start) AS request_week_start,
      COALESCE(q.weeks_to_arrival, b.weeks_to_arrival) AS weeks_to_arrival,
      q.actual_value AS quotes_actual_value,
      q.actual_low AS quotes_actual_low,
      q.actual_up AS quotes_actual_up,
      q.forecast_value AS quotes_forecast_value,
      q.forecast_low AS quotes_forecast_low,
      q.forecast_up AS quotes_forecast_up,
      b.actual_value AS bookings_actual_value,
      b.actual_low AS bookings_actual_low,
      b.actual_up AS bookings_actual_up,
      b.forecast_value AS bookings_forecast_value,
      b.forecast_low AS bookings_forecast_low,
      b.forecast_up AS bookings_forecast_up
    FROM quotes_data q
    FULL OUTER JOIN bookings_data b
      ON q.request_week_start = b.request_week_start
  )
  SELECT
    m.request_week_start,
    CAST(m.weeks_to_arrival AS integer),
    m.quotes_actual_value,
    m.quotes_actual_low,
    m.quotes_actual_up,
    m.quotes_forecast_value,
    m.quotes_forecast_low,
    m.quotes_forecast_up,
    m.bookings_actual_value,
    m.bookings_actual_low,
    m.bookings_actual_up,
    m.bookings_forecast_value,
    m.bookings_forecast_low,
    m.bookings_forecast_up
  FROM merged m
  ORDER BY m.request_week_start ASC;
END;
$$ LANGUAGE plpgsql STABLE;
