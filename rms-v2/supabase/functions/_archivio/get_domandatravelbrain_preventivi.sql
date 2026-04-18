-- Funzione RPC per ottenere l'andamento dei preventivi nel tempo
-- Basata sulla view v_essenziale_preventivi2025
CREATE OR REPLACE FUNCTION get_domandatravelbrain_preventivi(
    p_creation_date_start timestamptz DEFAULT NULL,
    p_creation_date_end timestamptz DEFAULT NULL,
    p_checkin_start date DEFAULT NULL,
    p_checkout_end date DEFAULT NULL,
    p_hotel_ids integer[] DEFAULT NULL,
    -- aggiunto parametro per filtrare stati preventivi
    p_stati_ids integer[] DEFAULT NULL
)
RETURNS TABLE (
    data_creazione date,
    numero_preventivi bigint,
    hotel_id integer
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(v.creation_date) as data_creazione,
        COUNT(*) as numero_preventivi,
        v.hotel_id
    FROM analytics.v_essenziale_preventivi2025 v
    WHERE 
        (p_creation_date_start IS NULL OR v.creation_date >= p_creation_date_start)
        AND (p_creation_date_end IS NULL OR v.creation_date <= p_creation_date_end)
        -- Logica overlap: preventivi che includono almeno una notte nel periodo
        AND (p_checkin_start IS NULL OR v.checkout > p_checkin_start)
        AND (p_checkout_end IS NULL OR v.checkin <= p_checkout_end)
        AND (p_hotel_ids IS NULL OR v.hotel_id = ANY(p_hotel_ids))
        -- aggiunto filtro per stati preventivi
        AND (p_stati_ids IS NULL OR v.state_id = ANY(p_stati_ids))
    GROUP BY DATE(v.creation_date), v.hotel_id
    ORDER BY data_creazione, v.hotel_id;
END;
$$;
