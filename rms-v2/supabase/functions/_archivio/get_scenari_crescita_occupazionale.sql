CREATE OR REPLACE FUNCTION get_scenari_crescita_occupazionale(
    p_id_hotel UUID
)
RETURNS TABLE (
    data_soggiorno DATE,
    occupazione_attuale INTEGER,
    capacita_hotel INTEGER,
    notti_storiche INTEGER,
    notti_recenti INTEGER,
    notti_attuali INTEGER,
    giorni_rimanenti INTEGER,
    trend_storico NUMERIC,
    trend_recente NUMERIC,
    trend_attuale NUMERIC
) 
LANGUAGE plpgsql
AS $$
DECLARE
    data_oggi DATE := CURRENT_DATE;
BEGIN
    RETURN QUERY
    WITH hotel_info AS (
        SELECT 
            numero_camere,
            data_apertura,
            data_chiusura
        FROM hotel 
        WHERE id = p_id_hotel
    ),
    date_series AS (
        SELECT generate_series(
            (SELECT data_apertura FROM hotel_info), 
            (SELECT data_chiusura FROM hotel_info), 
            '1 day'::interval
        )::date AS data_soggiorno
    ),
    -- Spacchetto ogni prenotazione nelle sue notti costituenti
    notti_spacchettate AS (
        SELECT 
            p.id,
            p.data_prenotazione,
            generate_series(p.arrivo, p.partenza - 1, '1 day'::interval)::date AS data_notte
        FROM prenotazioni p
        CROSS JOIN hotel_info hi
        WHERE p.id_hotel = p_id_hotel
            AND p.stato_prenotazione != '8'
            -- Solo prenotazioni per l'estate 2025
            AND p.arrivo >= '2025-06-01'
            AND p.arrivo <= '2025-09-30'
            -- Prenotazioni che hanno almeno una notte nel periodo operativo dell'hotel
            AND p.arrivo < hi.data_chiusura 
            AND p.partenza > hi.data_apertura
    ),
    -- Filtro solo le notti che cadono nel periodo operativo dell'hotel
    notti_nel_periodo AS (
        SELECT 
            ns.*
        FROM notti_spacchettate ns
        CROSS JOIN hotel_info hi
        WHERE ns.data_notte >= hi.data_apertura 
            AND ns.data_notte <= hi.data_chiusura
    ),
    -- Calcolo l'occupazione attuale per ogni data
    occupazione_per_data AS (
        SELECT 
            ds.data_soggiorno,
            COUNT(nnp.id) as occupazione_attuale
        FROM date_series ds
        LEFT JOIN notti_nel_periodo nnp ON ds.data_soggiorno = nnp.data_notte
        GROUP BY ds.data_soggiorno
    ),
    -- Calcolo il trend per ogni data di soggiorno basato sulle notti aggiunte nel tempo
    trend_per_data AS (
        SELECT 
            ds.data_soggiorno,
            -- Trend storico: notti aggiunte per questa data dal 1 nov 2024
            CASE 
                WHEN (data_oggi - '2024-11-01'::date) > 0 
                THEN COUNT(CASE WHEN nnp.data_notte = ds.data_soggiorno AND nnp.data_prenotazione >= '2024-11-01' THEN 1 END)::numeric 
                     / (data_oggi - '2024-11-01'::date)
                ELSE 0
            END as trend_storico_data,
            -- Trend recente: notti aggiunte per questa data dal 1 gen 2025
            CASE 
                WHEN (data_oggi - '2025-01-01'::date) > 0 
                THEN COUNT(CASE WHEN nnp.data_notte = ds.data_soggiorno AND nnp.data_prenotazione >= '2025-01-01' THEN 1 END)::numeric 
                     / (data_oggi - '2025-01-01'::date)
                ELSE 0
            END as trend_recente_data,
            -- Trend attuale: notti aggiunte per questa data dal 1 mag 2025
            CASE 
                WHEN (data_oggi - '2025-05-01'::date) > 0 
                THEN COUNT(CASE WHEN nnp.data_notte = ds.data_soggiorno AND nnp.data_prenotazione >= '2025-05-01' THEN 1 END)::numeric 
                     / (data_oggi - '2025-05-01'::date)
                ELSE 0
            END as trend_attuale_data,
            -- Conteggi per debug
            COUNT(CASE WHEN nnp.data_notte = ds.data_soggiorno AND nnp.data_prenotazione >= '2024-11-01' THEN 1 END) as notti_storiche_totali,
            COUNT(CASE WHEN nnp.data_notte = ds.data_soggiorno AND nnp.data_prenotazione >= '2025-01-01' THEN 1 END) as notti_recenti_totali,
            COUNT(CASE WHEN nnp.data_notte = ds.data_soggiorno AND nnp.data_prenotazione >= '2025-05-01' THEN 1 END) as notti_attuali_totali
        FROM date_series ds
        LEFT JOIN notti_nel_periodo nnp ON nnp.data_notte = ds.data_soggiorno  -- JOIN CORRETTO!
        GROUP BY ds.data_soggiorno
    ),
    -- Applico smoothing settimanale (sab-ven) ai trend
    trend_smoothed AS (
        SELECT 
            tpd.data_soggiorno,
            tpd.notti_storiche_totali,
            tpd.notti_recenti_totali,
            tpd.notti_attuali_totali,
            -- Media mobile settimanale del trend (3 giorni prima + giorno + 3 giorni dopo)
            AVG(tpd.trend_storico_data) OVER (
                ORDER BY tpd.data_soggiorno 
                ROWS BETWEEN 3 PRECEDING AND 3 FOLLOWING
            ) as trend_storico_smooth,
            AVG(tpd.trend_recente_data) OVER (
                ORDER BY tpd.data_soggiorno 
                ROWS BETWEEN 3 PRECEDING AND 3 FOLLOWING
            ) as trend_recente_smooth,
            AVG(tpd.trend_attuale_data) OVER (
                ORDER BY tpd.data_soggiorno 
                ROWS BETWEEN 3 PRECEDING AND 3 FOLLOWING
            ) as trend_attuale_smooth
        FROM trend_per_data tpd
    )
    SELECT 
        ds.data_soggiorno,
        COALESCE(opd.occupazione_attuale, 0)::integer as occupazione_attuale,
        hi.numero_camere as capacita_hotel,
        ts.notti_storiche_totali::integer as notti_storiche,
        ts.notti_recenti_totali::integer as notti_recenti,
        ts.notti_attuali_totali::integer as notti_attuali,
        GREATEST(0, ds.data_soggiorno - data_oggi) as giorni_rimanenti,
        COALESCE(ts.trend_storico_smooth, 0) as trend_storico,
        COALESCE(ts.trend_recente_smooth, 0) as trend_recente,
        COALESCE(ts.trend_attuale_smooth, 0) as trend_attuale
    FROM date_series ds
    CROSS JOIN hotel_info hi
    LEFT JOIN occupazione_per_data opd ON ds.data_soggiorno = opd.data_soggiorno
    LEFT JOIN trend_smoothed ts ON ds.data_soggiorno = ts.data_soggiorno
    ORDER BY ds.data_soggiorno;
END;
$$;
