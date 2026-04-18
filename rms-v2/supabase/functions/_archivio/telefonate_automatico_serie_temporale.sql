-- Drop existing function
DROP FUNCTION IF EXISTS telefonate_automatico_serie_temporale(date);

-- Added data_fine parameter and corrected WHERE clause to use both start and end dates
CREATE OR REPLACE FUNCTION telefonate_automatico_serie_temporale(
    data_inizio date,
    data_fine date
)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    result json;
BEGIN
    SELECT json_agg(
        json_build_object(
            'data', data_chiamata,
            'totale', totale_giorno,
            'answer', answer_count,
            'abandon', abandon_count,
            'exitwithtimeout', timeout_count
        ) ORDER BY data_chiamata
    )
    INTO result
    FROM (
        SELECT 
            DATE("Data/Ora Inizio") as data_chiamata,
            COUNT(*) as totale_giorno,
            COUNT(*) FILTER (WHERE "Stato" = 'ANSWER') as answer_count,
            COUNT(*) FILTER (WHERE "Stato" = 'ABANDON') as abandon_count,
            COUNT(*) FILTER (WHERE "Stato" = 'EXITWITHTIMEOUT') as timeout_count
        FROM telefonate_automatico
        WHERE DATE("Data/Ora Inizio") >= data_inizio 
          AND DATE("Data/Ora Inizio") <= data_fine
        GROUP BY DATE("Data/Ora Inizio")
        ORDER BY DATE("Data/Ora Inizio")
    ) serie_giornaliera;
    
    RETURN result;
END;
$$;
