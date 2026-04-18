-- Funzione RPC per ottenere le statistiche aggregate per un operatore
CREATE OR REPLACE FUNCTION get_performance_operatori_travelbrain_stats(
  p_date_start DATE DEFAULT NULL,
  p_date_end DATE DEFAULT NULL,
  p_operator_name TEXT DEFAULT NULL,
  p_hotel_ids INTEGER[] DEFAULT NULL
)
RETURNS TABLE (
  operator_total_quotes BIGINT,
  hotel_total_quotes BIGINT,
  operator_percentage NUMERIC,
  hotel_distribution JSONB
) 
LANGUAGE plpgsql
AS $$
DECLARE
  v_operator_total BIGINT;
  v_hotel_total BIGINT;
  v_percentage NUMERIC;
  v_distribution JSONB;
BEGIN
  -- Calcola il totale quotes dell'operatore nel periodo
  SELECT COALESCE(SUM(mop.quotes), 0)
  INTO v_operator_total
  FROM analytics.mw_operatori_preventivi mop
  WHERE 
    (p_date_start IS NULL OR mop.day >= p_date_start)
    AND (p_date_end IS NULL OR mop.day <= p_date_end)
    AND (p_operator_name IS NULL OR mop.operator_name = p_operator_name)
    AND (p_hotel_ids IS NULL OR mop.hotel_id = ANY(p_hotel_ids));

  -- Calcola il totale quotes degli hotel nel periodo (tutti gli operatori)
  SELECT COALESCE(SUM(mop.quotes), 0)
  INTO v_hotel_total
  FROM analytics.mw_operatori_preventivi mop
  WHERE 
    (p_date_start IS NULL OR mop.day >= p_date_start)
    AND (p_date_end IS NULL OR mop.day <= p_date_end)
    AND (p_hotel_ids IS NULL OR mop.hotel_id = ANY(p_hotel_ids));

  -- Calcola la percentuale
  IF v_hotel_total > 0 THEN
    v_percentage := ROUND((v_operator_total::NUMERIC / v_hotel_total::NUMERIC) * 100, 2);
  ELSE
    v_percentage := 0;
  END IF;

  -- Calcola la distribuzione per hotel
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'hotel_id', hotel_id,
        'quotes', quotes_sum
      )
    ), 
    '[]'::jsonb
  )
  INTO v_distribution
  FROM (
    SELECT 
      mop.hotel_id,
      SUM(mop.quotes) as quotes_sum
    FROM analytics.mw_operatori_preventivi mop
    WHERE 
      (p_date_start IS NULL OR mop.day >= p_date_start)
      AND (p_date_end IS NULL OR mop.day <= p_date_end)
      AND (p_operator_name IS NULL OR mop.operator_name = p_operator_name)
      AND (p_hotel_ids IS NULL OR mop.hotel_id = ANY(p_hotel_ids))
    GROUP BY mop.hotel_id
    ORDER BY quotes_sum DESC
  ) sub;

  RETURN QUERY
  SELECT 
    v_operator_total,
    v_hotel_total,
    v_percentage,
    v_distribution;
END;
$$;
