-- Drop existing functions and recreate with proper table joins
-- Drop delle funzioni RPC esistenti
DROP FUNCTION IF EXISTS get_performance_operatori_travelbrain_data(date, date, text, integer);
DROP FUNCTION IF EXISTS get_performance_operatori_travelbrain_operators();
DROP FUNCTION IF EXISTS get_performance_operatori_travelbrain_hotels();
DROP FUNCTION IF EXISTS get_performance_operatori_travelbrain_stats(date, date, text, integer);

-- Funzione per ottenere la lista degli operatori con nomi comprensibili
CREATE OR REPLACE FUNCTION get_performance_operatori_travelbrain_operators()
RETURNS TABLE (
    email text,
    nome text,
    display_name text
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT 
        mop.operator_name as email,
        COALESCE(oht.nome, 'Nome non disponibile') as nome,
        CASE 
            WHEN oht.nome IS NOT NULL THEN oht.nome || ' (' || mop.operator_name || ')'
            ELSE mop.operator_name
        END as display_name
    FROM analytics.mw_operatori_preventivi mop
    LEFT JOIN analytics.operatori_hoteldoor_travelbrain oht ON oht.email = mop.operator_name
    WHERE mop.operator_name IS NOT NULL 
    AND mop.operator_name != '(sconosciuto)'
    ORDER BY display_name;
END;
$$;

-- Funzione per ottenere la lista degli hotel con nomi comprensibili
CREATE OR REPLACE FUNCTION get_performance_operatori_travelbrain_hotels()
RETURNS TABLE (
    hotel_id integer,
    nome_hotel text,
    display_name text
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT 
        mop.hotel_id::integer,
        COALESCE(ht.nome_hotel, 'Hotel ID: ' || mop.hotel_id::text) as nome_hotel,
        CASE 
            WHEN ht.nome_hotel IS NOT NULL THEN ht.nome_hotel || ' (ID: ' || mop.hotel_id::text || ')'
            ELSE 'Hotel ID: ' || mop.hotel_id::text
        END as display_name
    FROM analytics.mw_operatori_preventivi mop
    LEFT JOIN analytics.hotel_travelbrain ht ON ht.hotel_id = mop.hotel_id::integer
    WHERE mop.hotel_id IS NOT NULL
    ORDER BY display_name;
END;
$$;

-- Funzione per ottenere i dati filtrati per il grafico
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
    quotes integer
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
        mop.quotes::integer
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

-- Funzione per ottenere le statistiche aggregate
CREATE OR REPLACE FUNCTION get_performance_operatori_travelbrain_stats(
    p_start_date date,
    p_end_date date,
    p_operator_name text DEFAULT NULL,
    p_hotel_id integer DEFAULT NULL
)
RETURNS TABLE (
    total_quotes bigint,
    operator_quotes bigint,
    operator_percentage numeric,
    hotel_distribution jsonb
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_total_quotes bigint;
    v_operator_quotes bigint;
    v_hotel_distribution jsonb;
BEGIN
    -- Calcola il totale delle quotes per il periodo e hotel specificati
    SELECT COALESCE(SUM(mop.quotes::integer), 0)
    INTO v_total_quotes
    FROM analytics.mw_operatori_preventivi mop
    WHERE mop.day >= p_start_date 
    AND mop.day <= p_end_date
    AND (p_hotel_id IS NULL OR mop.hotel_id::integer = p_hotel_id)
    AND mop.operator_name IS NOT NULL 
    AND mop.operator_name != '(sconosciuto)';

    -- Calcola le quotes dell'operatore specificato
    SELECT COALESCE(SUM(mop.quotes::integer), 0)
    INTO v_operator_quotes
    FROM analytics.mw_operatori_preventivi mop
    WHERE mop.day >= p_start_date 
    AND mop.day <= p_end_date
    AND (p_operator_name IS NULL OR mop.operator_name = p_operator_name)
    AND (p_hotel_id IS NULL OR mop.hotel_id::integer = p_hotel_id)
    AND mop.operator_name IS NOT NULL 
    AND mop.operator_name != '(sconosciuto)';

    -- Calcola la distribuzione per hotel dell'operatore
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'hotel_id', hotel_id,
                'hotel_name', hotel_display_name,
                'quotes', quotes
            )
        ), 
        '[]'::jsonb
    )
    INTO v_hotel_distribution
    FROM (
        SELECT 
            mop.hotel_id::integer,
            CASE 
                WHEN ht.nome_hotel IS NOT NULL THEN ht.nome_hotel
                ELSE 'Hotel ID: ' || mop.hotel_id::text
            END as hotel_display_name,
            SUM(mop.quotes::integer) as quotes
        FROM analytics.mw_operatori_preventivi mop
        LEFT JOIN analytics.hotel_travelbrain ht ON ht.hotel_id = mop.hotel_id::integer
        WHERE mop.day >= p_start_date 
        AND mop.day <= p_end_date
        AND (p_operator_name IS NULL OR mop.operator_name = p_operator_name)
        AND mop.operator_name IS NOT NULL 
        AND mop.operator_name != '(sconosciuto)'
        GROUP BY mop.hotel_id, ht.nome_hotel
        ORDER BY quotes DESC
    ) hotel_stats;

    RETURN QUERY
    SELECT 
        v_total_quotes,
        v_operator_quotes,
        CASE 
            WHEN v_total_quotes > 0 THEN ROUND((v_operator_quotes::numeric / v_total_quotes::numeric) * 100, 2)
            ELSE 0::numeric
        END,
        v_hotel_distribution;
END;
$$;
