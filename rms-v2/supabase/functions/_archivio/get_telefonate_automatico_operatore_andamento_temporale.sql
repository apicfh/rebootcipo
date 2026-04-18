DROP FUNCTION IF EXISTS get_telefonate_automatico_operatore_andamento_temporale(text, date, date);

CREATE OR REPLACE FUNCTION get_telefonate_automatico_operatore_andamento_temporale(
    agente_param text,
    data_inizio date,
    data_fine date
)
RETURNS TABLE (
    data_chiamata date,
    totale_chiamate bigint,
    chiamate_risposte bigint,
    chiamate_perse bigint
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH date_series AS (
        SELECT generate_series(data_inizio, data_fine, '1 day'::interval)::date as data
    ),
    telefonate_giornaliere AS (
        SELECT 
            DATE(ta."Data/Ora Inizio") as data_chiamata,
            COUNT(*) as totale_chiamate,
            COUNT(*) FILTER (WHERE ta."Stato" = 'ANSWER') as chiamate_risposte,
            COUNT(*) FILTER (WHERE ta."Stato" IN ('ABANDON', 'EXITWITHTIMEOUT')) as chiamate_perse
        FROM telefonate_automatico ta
        WHERE ta."Agente" = agente_param
          AND DATE(ta."Data/Ora Inizio") >= data_inizio
          AND DATE(ta."Data/Ora Inizio") <= data_fine
        GROUP BY DATE(ta."Data/Ora Inizio")
    )
    SELECT 
        ds.data as data_chiamata,
        COALESCE(tg.totale_chiamate, 0) as totale_chiamate,
        COALESCE(tg.chiamate_risposte, 0) as chiamate_risposte,
        COALESCE(tg.chiamate_perse, 0) as chiamate_perse
    FROM date_series ds
    LEFT JOIN telefonate_giornaliere tg ON ds.data = tg.data_chiamata
    ORDER BY ds.data;
END;
$$;
