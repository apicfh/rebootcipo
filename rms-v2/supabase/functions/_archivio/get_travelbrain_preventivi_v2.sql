CREATE OR REPLACE FUNCTION get_travelbrain_preventivi_v2(
  p_creation_date_start timestamptz DEFAULT NULL,
  p_creation_date_end timestamptz DEFAULT NULL,
  p_checkin_start date DEFAULT NULL,
  p_checkout_end date DEFAULT NULL,
  p_hotel_ids integer[] DEFAULT NULL
)
RETURNS TABLE (
  data_creazione date,
  numero_preventivi bigint
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.creation_date::date as data_creazione,
    COUNT(*) as numero_preventivi
  FROM analytics.v_essenziale_preventivi2025 v
  WHERE 
    (p_creation_date_start IS NULL OR v.creation_date >= p_creation_date_start)
    AND (p_creation_date_end IS NULL OR v.creation_date <= p_creation_date_end)
    AND (p_checkin_start IS NULL OR p_checkout_end IS NULL OR 
         (v.checkout > p_checkin_start AND v.checkin <= p_checkout_end))
    AND (p_hotel_ids IS NULL OR v.hotel_id = ANY(p_hotel_ids))
  GROUP BY v.creation_date::date
  ORDER BY v.creation_date::date;
END;
$$;
