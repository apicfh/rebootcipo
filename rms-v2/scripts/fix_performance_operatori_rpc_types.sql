-- Fix per il type mismatch nella funzione get_performance_operatori_travelbrain_data
-- Il problema è che quotes è bigint nella vista materializzata ma la funzione restituisce integer

DROP FUNCTION IF EXISTS get_performance_operatori_travelbrain_data(date, date, text, integer);

-- Cambiato il tipo di ritorno di quotes da integer a bigint per risolvere il type mismatch
CREATE OR REPLACE FUNCTION get_performance_operatori_travelbrain_data(
    p_start_date date,
    p_end_date date,
    p_operator_name text DEFAULT NULL,
    p_hotel_id integer DEFAULT NULL
)
RETURNS TABLE (
    day date,
    hotel_id integer,
    operator_name text,
    operator_display_name text,
    hotel_display_name text,
    quotes bigint
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mop.day,
        mop.hotel_id::integer,
        mop.operator_name,
        CASE 
            WHEN oht.nome IS NOT NULL THEN oht.nome || ' (' || mop.operator_name || ')'
            ELSE mop.operator_name
        END as operator_display_name,
        CASE 
            WHEN ht.nome_hotel IS NOT NULL THEN ht.nome_hotel || ' (ID: ' || mop.hotel_id::text || ')'
            ELSE 'Hotel ID: ' || mop.hotel_id::text
        END as hotel_display_name,
        mop.quotes -- Rimosso il cast ::integer perché quotes è già bigint
    FROM analytics.mw_operatori_preventivi mop
    LEFT JOIN analytics.operatori_hoteldoor_travelbrain oht ON oht.email = mop.operator_name
    LEFT JOIN analytics.hotel_travelbrain ht ON ht.hotel_id = mop.hotel_id::integer
    WHERE mop.day >= p_start_date 
    AND mop.day <= p_end_date
    AND (p_operator_name IS NULL OR mop.operator_name = p_operator_name)
    AND (p_hotel_id IS NULL OR mop.hotel_id::integer = p_hotel_id)
    AND mop.operator_name IS NOT NULL 
    AND mop.operator_name != '(sconosciuto)'
    ORDER BY mop.day, mop.hotel_id, mop.operator_name;
END;
$$;
