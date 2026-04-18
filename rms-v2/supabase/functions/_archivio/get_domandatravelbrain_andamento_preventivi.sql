-- Ripristinando RPC alla versione semplice che funzionava
CREATE OR REPLACE FUNCTION get_domandatravelbrain_andamento_preventivi(
    p_creation_date_start timestamptz DEFAULT NULL,
    p_creation_date_end timestamptz DEFAULT NULL,
    p_checkin_start date DEFAULT NULL,
    p_checkout_end date DEFAULT NULL,
    p_hotel_ids integer[] DEFAULT NULL,
    p_stati_ids integer[] DEFAULT NULL,
    p_show_sdly boolean DEFAULT false
)
RETURNS TABLE (
    data_creazione date,
    hotel_id integer,
    numero_preventivi bigint,
    preventivi_accettati bigint,
    preventivi_non_accettati bigint
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.giorno as data_creazione,
        v.hotel_id,
        v.num_preventivi as numero_preventivi,
        v.confermato_si as preventivi_accettati,
        v.confermato_no as preventivi_non_accettati
    FROM analytics.v_preventivi_conteggio_settimanale v
    WHERE 
        (p_creation_date_start IS NULL OR v.giorno >= p_creation_date_start::date)
        AND (p_creation_date_end IS NULL OR v.giorno <= p_creation_date_end::date)
        AND (p_hotel_ids IS NULL OR v.hotel_id = ANY(p_hotel_ids))
    ORDER BY v.giorno, v.hotel_id;
END;
$$;
