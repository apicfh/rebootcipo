-- Semplificando parametri e correggendo logica overlap
CREATE OR REPLACE FUNCTION get_domandatravelbrain_operatori(
    p_creation_date_start timestamptz DEFAULT NULL,
    p_creation_date_end timestamptz DEFAULT NULL,
    p_checkin_start date DEFAULT NULL,
    p_checkout_end date DEFAULT NULL,
    p_hotel_ids integer[] DEFAULT NULL,
    -- aggiunto parametro per filtrare stati preventivi
    p_stati_ids integer[] DEFAULT NULL
)
RETURNS TABLE (
    operatore text,
    numero_preventivi bigint,
    percentuale numeric
) 
LANGUAGE plpgsql
AS $$
DECLARE
    total_preventivi bigint;
BEGIN
    -- Calcola il totale dei preventivi
    SELECT COUNT(*) INTO total_preventivi
    FROM analytics.v_essenziale_preventivi2025 v
    WHERE 
        (p_creation_date_start IS NULL OR v.creation_date >= p_creation_date_start)
        AND (p_creation_date_end IS NULL OR v.creation_date <= p_creation_date_end)
        -- Logica overlap corretta: preventivi che includono almeno una notte nel periodo
        AND (p_checkin_start IS NULL OR v.checkout > p_checkin_start)
        AND (p_checkout_end IS NULL OR v.checkin <= p_checkout_end)
        AND (p_hotel_ids IS NULL OR v.hotel_id = ANY(p_hotel_ids))
        -- aggiunto filtro per stati preventivi
        AND (p_stati_ids IS NULL OR v.state_id = ANY(p_stati_ids));

    -- Restituisce i top 5 operatori
    RETURN QUERY
    WITH operatori_stats AS (
        SELECT 
            COALESCE(v.creation_operator_name, 'Sconosciuto') as op_name,
            COUNT(*) as count_preventivi
        FROM analytics.v_essenziale_preventivi2025 v
        WHERE 
            (p_creation_date_start IS NULL OR v.creation_date >= p_creation_date_start)
            AND (p_creation_date_end IS NULL OR v.creation_date <= p_creation_date_end)
            -- Logica overlap corretta anche qui
            AND (p_checkin_start IS NULL OR v.checkout > p_checkin_start)
            AND (p_checkout_end IS NULL OR v.checkin <= p_checkout_end)
            AND (p_hotel_ids IS NULL OR v.hotel_id = ANY(p_hotel_ids))
            -- aggiunto filtro per stati preventivi anche nella CTE
            AND (p_stati_ids IS NULL OR v.state_id = ANY(p_stati_ids))
        GROUP BY v.creation_operator_name
        ORDER BY count_preventivi DESC
    ),
    top_5 AS (
        SELECT op_name, count_preventivi
        FROM operatori_stats
        LIMIT 5
    ),
    altri AS (
        SELECT 
            'Altri' as op_name,
            -- Aggiunto cast esplicito ::bigint per mantenere il tipo corretto
            COALESCE(SUM(count_preventivi)::bigint, 0) as count_preventivi
        FROM operatori_stats
        WHERE op_name NOT IN (SELECT op_name FROM top_5)
    )
    SELECT 
        op_name::text as operatore,
        -- Mantengo count_preventivi come bigint senza cast
        count_preventivi as numero_preventivi,
        -- Cast a numeric solo per il calcolo della percentuale
        ROUND((count_preventivi::numeric / NULLIF(total_preventivi::numeric, 0)) * 100, 2) as percentuale
    FROM (
        SELECT * FROM top_5
        UNION ALL
        SELECT * FROM altri WHERE count_preventivi > 0
    ) combined
    ORDER BY numero_preventivi DESC;
END;
$$;
