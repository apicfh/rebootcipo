CREATE OR REPLACE FUNCTION get_travelbrain_hotels_v2(
  p_creation_date_start timestamptz DEFAULT NULL,
  p_creation_date_end timestamptz DEFAULT NULL,
  p_checkin_start date DEFAULT NULL,
  p_checkout_end date DEFAULT NULL
)
RETURNS TABLE (
  hotel_id integer,
  nome_hotel text,
  numero_preventivi bigint
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.hotel_id,
    h.nome_hotel,
    COALESCE(COUNT(v.id), 0) as numero_preventivi
  FROM analytics.hotel_travelbrain h
  LEFT JOIN analytics.v_essenziale_preventivi2025 v ON h.hotel_id = v.hotel_id
    AND (p_creation_date_start IS NULL OR v.creation_date >= p_creation_date_start)
    AND (p_creation_date_end IS NULL OR v.creation_date <= p_creation_date_end)
    AND (p_checkin_start IS NULL OR p_checkout_end IS NULL OR 
         (v.checkout > p_checkin_start AND v.checkin <= p_checkout_end))
  GROUP BY h.hotel_id, h.nome_hotel
  ORDER BY h.hotel_id;
END;
$$;
