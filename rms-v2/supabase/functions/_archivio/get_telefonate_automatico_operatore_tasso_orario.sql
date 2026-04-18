DROP FUNCTION IF EXISTS get_telefonate_automatico_operatore_tasso_orario(text, date, date);

CREATE OR REPLACE FUNCTION get_telefonate_automatico_operatore_tasso_orario(
    agente_param text,
    data_inizio date,
    data_fine date
)
RETURNS TABLE (
    ora_giorno integer,
    totale_chiamate bigint,
    chiamate_risposte bigint,
    tasso_risposta numeric
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        EXTRACT(hour FROM ta."Data/Ora Inizio")::integer as ora_giorno,
        COUNT(*) as totale_chiamate,
        COUNT(*) FILTER (WHERE ta."Stato" = 'ANSWER') as chiamate_risposte,
        ROUND(
            (COUNT(*) FILTER (WHERE ta."Stato" = 'ANSWER')::numeric / 
             NULLIF(COUNT(*), 0) * 100), 2
        ) as tasso_risposta
    FROM telefonate_automatico ta
    WHERE ta."Agente" = agente_param
      AND DATE(ta."Data/Ora Inizio") >= data_inizio
      AND DATE(ta."Data/Ora Inizio") <= data_fine
      AND EXTRACT(hour FROM ta."Data/Ora Inizio") BETWEEN 7 AND 23
    GROUP BY EXTRACT(hour FROM ta."Data/Ora Inizio")
    ORDER BY ora_giorno;
END;
$$;
