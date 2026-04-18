CREATE OR REPLACE FUNCTION get_travelbrain_operatori_v2(
  p_creation_date_start timestamptz DEFAULT NULL,
  p_creation_date_end timestamptz DEFAULT NULL,
  p_checkin_start date DEFAULT NULL,
  p_checkout_end date DEFAULT NULL,
  p_hotel_ids integer[] DEFAULT NULL
)
RETURNS TABLE (
  operatore text,
  numero_preventivi bigint,
  percentuale numeric
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH operatori_stats AS (
    SELECT 
      v.creation_operator_name as operatore,
      COUNT(*) as numero_preventivi
    FROM analytics.v_essenziale_preventivi2025 v
    WHERE 
      (p_creation_date_start IS NULL OR v.creation_date >= p_creation_date_start)
      AND (p_creation_date_end IS NULL OR v.creation_date <= p_creation_date_end)
      AND (p_checkin_start IS NULL OR p_checkout_end IS NULL OR 
           (v.checkout > p_checkin_start AND v.checkin <= p_checkout_end))
      AND (p_hotel_ids IS NULL OR v.hotel_id = ANY(p_hotel_ids))
    GROUP BY v.creation_operator_name
  ),
  totale AS (
    SELECT SUM(numero_preventivi) as totale_preventivi
    FROM operatori_stats
  )
  SELECT 
    o.operatore,
    o.numero_preventivi,
    ROUND((o.numero_preventivi::numeric / t.totale_preventivi::numeric) * 100, 2) as percentuale
  FROM operatori_stats o
  CROSS JOIN totale t
  ORDER BY o.numero_preventivi DESC;
END;
$$;
