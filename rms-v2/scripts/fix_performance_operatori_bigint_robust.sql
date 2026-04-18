-- Robust fix for the bigint type mismatch in performance operatori RPC
-- This script safely drops and recreates the function with correct types

-- Drop the function with all possible signatures to ensure clean slate
DROP FUNCTION IF EXISTS get_performance_operatori_travelbrain_data(date, date, text, integer[]) CASCADE;
DROP FUNCTION IF EXISTS analytics.get_performance_operatori_travelbrain_data(date, date, text, integer[]) CASCADE;

-- Verify the materialized view exists and check its structure
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'analytics' 
        AND table_name = 'mw_operatori_preventivi'
    ) THEN
        RAISE EXCEPTION 'Materialized view analytics.mw_operatori_preventivi does not exist';
    END IF;
END $$;

-- Create the function with correct bigint type for quotes
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
  quotes bigint  -- Using bigint to match the actual data type from COUNT operations
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log the function call for debugging
  RAISE NOTICE 'Calling get_performance_operatori_travelbrain_data with: start_date=%, end_date=%, operator_email=%, hotel_ids=%', 
    start_date, end_date, operator_email, hotel_ids;
  
  RETURN QUERY
  SELECT 
    mop.day,
    mop.hotel_id,
    mop.operator_name,
    mop.quotes  -- No casting needed, keeping original bigint type
  FROM analytics.mw_operatori_preventivi mop
  WHERE mop.day >= start_date
    AND mop.day <= end_date
    AND mop.operator_name = operator_email
    AND mop.hotel_id = ANY(hotel_ids)
  ORDER BY mop.day, mop.hotel_id;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_performance_operatori_travelbrain_data(date, date, text, integer[]) TO anon;
GRANT EXECUTE ON FUNCTION get_performance_operatori_travelbrain_data(date, date, text, integer[]) TO authenticated;

-- Test the function with a simple query to verify it works
DO $$
DECLARE
    test_result RECORD;
BEGIN
    -- Test with a basic query to ensure the function works
    SELECT COUNT(*) as total_rows INTO test_result
    FROM get_performance_operatori_travelbrain_data(
        '2024-01-01'::date, 
        '2024-12-31'::date, 
        'test@example.com', 
        ARRAY[1420, 1440]
    );
    
    RAISE NOTICE 'Function test completed successfully. Test query returned % rows', test_result.total_rows;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Function test failed with error: %', SQLERRM;
END $$;
