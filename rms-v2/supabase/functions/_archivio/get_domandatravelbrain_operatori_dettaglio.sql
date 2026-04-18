CREATE OR REPLACE FUNCTION get_domandatravelbrain_operatori_dettaglio(
    p_creation_date_start timestamptz DEFAULT NULL,
    p_creation_date_end timestamptz DEFAULT NULL,
    p_checkin_start date DEFAULT NULL,
    p_checkout_end date DEFAULT NULL,
    p_hotel_ids integer[] DEFAULT NULL,
    p_stati_ids integer[] DEFAULT NULL
)
RETURNS TABLE (
    operatore text,
    numero_preventivi bigint,
    percentuale numeric,
    media_giornaliera numeric,
    trend_7_giorni numeric
) 
LANGUAGE plpgsql
AS $$
DECLARE
    total_preventivi bigint;
    giorni_periodo integer;
BEGIN
    -- Calcola il totale dei preventivi e i giorni del periodo
    SELECT COUNT(*), 
           GREATEST(1, EXTRACT(days FROM (COALESCE(p_creation_date_end, NOW()) - COALESCE(p_creation_date_start, NOW() - INTERVAL '30 days')))::integer)
    INTO total_preventivi, giorni_periodo
    FROM analytics.v_essenziale_preventivi2025 v
    WHERE 
        (p_creation_date_start IS NULL OR v.creation_date >= p_creation_date_start)
        AND (p_creation_date_end IS NULL OR v.creation_date <= p_creation_date_end)
        AND (p_checkin_start IS NULL OR v.checkout > p_checkin_start)
        AND (p_checkout_end IS NULL OR v.checkin <= p_checkout_end)
        AND (p_hotel_ids IS NULL OR v.hotel_id = ANY(p_hotel_ids))
        AND (p_stati_ids IS NULL OR v.state_id = ANY(p_stati_ids));

    -- Restituisce i dettagli degli operatori
    RETURN QUERY
    WITH operatori_stats AS (
        SELECT 
            COALESCE(v.creation_operator_name, 'Sconosciuto') as op_name,
            COUNT(*) as count_preventivi,
            COUNT(*) / GREATEST(giorni_periodo::numeric, 1) as media_giornaliera_calc
        FROM analytics.v_essenziale_preventivi2025 v
        WHERE 
            (p_creation_date_start IS NULL OR v.creation_date >= p_creation_date_start)
            AND (p_creation_date_end IS NULL OR v.creation_date <= p_creation_date_end)
            AND (p_checkin_start IS NULL OR v.checkout > p_checkin_start)
            AND (p_checkout_end IS NULL OR v.checkin <= p_checkout_end)
            AND (p_hotel_ids IS NULL OR v.hotel_id = ANY(p_hotel_ids))
            AND (p_stati_ids IS NULL OR v.state_id = ANY(p_stati_ids))
        GROUP BY v.creation_operator_name
    ),
    trend_stats AS (
        SELECT 
            COALESCE(v.creation_operator_name, 'Sconosciuto') as op_name,
            COUNT(*) as preventivi_ultimi_7_giorni
        FROM analytics.v_essenziale_preventivi2025 v
        WHERE 
            v.creation_date >= (COALESCE(p_creation_date_end, NOW()) - INTERVAL '7 days')
            AND (p_creation_date_end IS NULL OR v.creation_date <= p_creation_date_end)
            AND (p_checkin_start IS NULL OR v.checkout > p_checkin_start)
            AND (p_checkout_end IS NULL OR v.checkin <= p_checkout_end)
            AND (p_hotel_ids IS NULL OR v.hotel_id = ANY(p_hotel_ids))
            AND (p_stati_ids IS NULL OR v.state_id = ANY(p_stati_ids))
        GROUP BY v.creation_operator_name
    )
    SELECT 
        os.op_name::text as operatore,
        os.count_preventivi as numero_preventivi,
        ROUND((os.count_preventivi::numeric / NULLIF(total_preventivi::numeric, 0)) * 100, 2) as percentuale,
        ROUND(os.media_giornaliera_calc, 2) as media_giornaliera,
        ROUND((COALESCE(ts.preventivi_ultimi_7_giorni, 0)::numeric / 7), 2) as trend_7_giorni
    FROM operatori_stats os
    LEFT JOIN trend_stats ts ON os.op_name = ts.op_name
    ORDER BY os.count_preventivi DESC;
END;
$$;
