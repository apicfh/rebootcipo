DROP FUNCTION IF EXISTS get_telefonate_automatico_operatore_statistiche(text, date, date);

CREATE OR REPLACE FUNCTION get_telefonate_automatico_operatore_statistiche(
    agente_param text,
    data_inizio date,
    data_fine date
)
RETURNS TABLE (
    totale_chiamate bigint,
    chiamate_risposte bigint,
    chiamate_perse bigint,
    durata_media_risposte numeric,
    tasso_risposta numeric
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as totale_chiamate,
        COUNT(*) FILTER (WHERE ta."Stato" = 'ANSWER') as chiamate_risposte,
        COUNT(*) FILTER (WHERE ta."Stato" IN ('ABANDON', 'EXITWITHTIMEOUT')) as chiamate_perse,
        ROUND(AVG(ta."Durata (sec)") FILTER (WHERE ta."Stato" = 'ANSWER'), 2) as durata_media_risposte,
        ROUND(
            (COUNT(*) FILTER (WHERE ta."Stato" = 'ANSWER')::numeric / 
             NULLIF(COUNT(*), 0) * 100), 2
        ) as tasso_risposta
    FROM telefonate_automatico ta
    WHERE ta."Agente" = agente_param
      AND DATE(ta."Data/Ora Inizio") >= data_inizio
      AND DATE(ta."Data/Ora Inizio") <= data_fine;
END;
$$;
