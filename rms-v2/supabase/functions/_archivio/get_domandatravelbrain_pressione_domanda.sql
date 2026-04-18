-- Nuova funzione RPC per pressione domanda con aggregazione settimanale sabato-venerdì
CREATE OR REPLACE FUNCTION get_domandatravelbrain_pressione_domanda(
    p_creation_date_start timestamptz DEFAULT NULL,
    p_creation_date_end timestamptz DEFAULT NULL,
    p_hotel_ids integer[] DEFAULT NULL,
    p_stati_ids integer[] DEFAULT NULL,
    p_show_sdly boolean DEFAULT false
)
RETURNS TABLE (
    settimana_inizio date,
    settimana_fine date,
    numero_preventivi bigint,
    hotel_id integer,
    anno_soggiorno integer
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH preventivi_con_settimana AS (
        SELECT 
            v.*,
            -- Calcola l'inizio della settimana (sabato precedente)
            (DATE(v.creation_date) - INTERVAL '1 day' * ((EXTRACT(DOW FROM v.creation_date)::integer + 1) % 7))::date as settimana_start,
            -- Determina l'anno di soggiorno basato sulla creation_date
            CASE 
                WHEN EXTRACT(MONTH FROM v.creation_date) >= 9 THEN EXTRACT(YEAR FROM v.creation_date)::integer + 1
                ELSE EXTRACT(YEAR FROM v.creation_date)::integer
            END as anno_soggiorno
        FROM analytics.v_essenziale_preventivi2025 v
        WHERE 
            (p_creation_date_start IS NULL OR v.creation_date >= p_creation_date_start)
            AND (p_creation_date_end IS NULL OR v.creation_date <= p_creation_date_end)
            AND (p_hotel_ids IS NULL OR v.hotel_id = ANY(p_hotel_ids))
            AND (p_stati_ids IS NULL OR v.state_id = ANY(p_stati_ids))
    )
    SELECT 
        pcs.settimana_start as settimana_inizio,
        (pcs.settimana_start + INTERVAL '6 days')::date as settimana_fine,
        COUNT(*) as numero_preventivi,
        pcs.hotel_id,
        pcs.anno_soggiorno
    FROM preventivi_con_settimana pcs
    GROUP BY pcs.settimana_start, pcs.hotel_id, pcs.anno_soggiorno
    ORDER BY pcs.settimana_start, pcs.hotel_id;
END;
$$;
