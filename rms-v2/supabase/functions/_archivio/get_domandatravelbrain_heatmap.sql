-- Funzione RPC per ottenere la densità di richieste per ogni singola notte
-- Conta quanti preventivi includono ogni specifica notte nel periodo stagionale
CREATE OR REPLACE FUNCTION get_domandatravelbrain_heatmap(
    p_creation_date_start timestamptz DEFAULT NULL,
    p_creation_date_end timestamptz DEFAULT NULL,
    p_hotel_ids integer[] DEFAULT NULL,
    -- Limitato periodo default a 30 giorni invece di 120 per evitare timeout
    p_season_start date DEFAULT '2025-07-01',
    p_season_end date DEFAULT '2025-07-31',
    -- aggiunto parametro per filtrare stati preventivi
    p_stati_ids integer[] DEFAULT NULL
)
RETURNS TABLE (
    data_notte date,
    numero_richieste bigint,
    hotel_id integer
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH date_series AS (
        SELECT generate_series(p_season_start, p_season_end, '1 day'::interval)::date as data_notte
    ),
    hotel_series AS (
        SELECT DISTINCT v.hotel_id 
        FROM analytics.v_essenziale_preventivi2025 v
        WHERE (p_hotel_ids IS NULL OR v.hotel_id = ANY(p_hotel_ids))
        -- aggiunto filtro stati anche nella selezione hotel
        AND (p_stati_ids IS NULL OR v.state_id = ANY(p_stati_ids))
    ),
    date_hotel_combinations AS (
        SELECT ds.data_notte, hs.hotel_id
        FROM date_series ds
        CROSS JOIN hotel_series hs
    )
    SELECT 
        dhc.data_notte,
        COALESCE(COUNT(v.id), 0) as numero_richieste,
        dhc.hotel_id
    FROM date_hotel_combinations dhc
    LEFT JOIN analytics.v_essenziale_preventivi2025 v ON (
        v.hotel_id = dhc.hotel_id
        AND v.checkin <= dhc.data_notte 
        AND v.checkout > dhc.data_notte
        AND (p_creation_date_start IS NULL OR v.creation_date >= p_creation_date_start)
        AND (p_creation_date_end IS NULL OR v.creation_date <= p_creation_date_end)
        AND (p_hotel_ids IS NULL OR v.hotel_id = ANY(p_hotel_ids))
        -- aggiunto filtro per stati preventivi nel JOIN
        AND (p_stati_ids IS NULL OR v.state_id = ANY(p_stati_ids))
    )
    GROUP BY dhc.data_notte, dhc.hotel_id
    ORDER BY dhc.data_notte, dhc.hotel_id;
END;
$$;
