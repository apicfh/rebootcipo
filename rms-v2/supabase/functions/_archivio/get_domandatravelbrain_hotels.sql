-- Semplificando drasticamente per evitare timeout - solo lista hotel senza conteggi
CREATE OR REPLACE FUNCTION get_domandatravelbrain_hotels()
RETURNS TABLE (
    hotel_id integer,
    hotel_name text
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.hotel_id,
        h.nome_hotel as hotel_name
    FROM analytics.hotel_travelbrain h
    ORDER BY h.nome_hotel;
END;
$$;
