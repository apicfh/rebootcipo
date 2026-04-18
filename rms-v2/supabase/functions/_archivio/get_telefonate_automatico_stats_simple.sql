-- Drop existing function
DROP FUNCTION IF EXISTS get_telefonate_automatico_stats_simple(date, date);

-- Added unique callers calculation per day
CREATE OR REPLACE FUNCTION get_telefonate_automatico_stats_simple(
    data_inizio date,
    data_fine date
)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    result json;
BEGIN
    -- Fixed query structure to properly aggregate data without column reference errors
    WITH stats_base AS (
        SELECT 
            COUNT(*) as totale_telefonate,
            COUNT(*) FILTER (WHERE "Stato" = 'ANSWER') as telefonate_risposte,
            ROUND(AVG("Durata (sec)") FILTER (WHERE "Stato" = 'ANSWER'), 2) as durata_media_risposte
        FROM telefonate_automatico
        WHERE DATE("Data/Ora Inizio") >= data_inizio 
          AND DATE("Data/Ora Inizio") <= data_fine
    ),
    -- Added CTE for unique callers calculation
    chiamanti_unici AS (
        SELECT 
            COUNT(DISTINCT concat("Chiamante", '|', DATE("Data/Ora Inizio"))) as totale_chiamanti_unici,
            COUNT(DISTINCT concat("Chiamante", '|', DATE("Data/Ora Inizio"))) FILTER (WHERE "Stato" = 'ANSWER') as chiamanti_unici_risposte
        FROM telefonate_automatico
        WHERE DATE("Data/Ora Inizio") >= data_inizio 
          AND DATE("Data/Ora Inizio") <= data_fine
    ),
    stati_dist AS (
        SELECT json_agg(
            json_build_object(
                'stato', "Stato",
                'count', count_stato
            )
        ) as distribuzione_stati
        FROM (
            SELECT 
                "Stato",
                COUNT(*) as count_stato
            FROM telefonate_automatico
            WHERE DATE("Data/Ora Inizio") >= data_inizio 
              AND DATE("Data/Ora Inizio") <= data_fine
            GROUP BY "Stato"
        ) stati_aggregati
    )
    -- Added unique callers fields to result
    SELECT json_build_object(
        'totale_telefonate', sb.totale_telefonate,
        'telefonate_risposte', sb.telefonate_risposte,
        'durata_media_risposte', sb.durata_media_risposte,
        'totale_chiamanti_unici', cu.totale_chiamanti_unici,
        'chiamanti_unici_risposte', cu.chiamanti_unici_risposte,
        'distribuzione_stati', sd.distribuzione_stati
    )
    INTO result
    FROM stats_base sb, chiamanti_unici cu, stati_dist sd;
    
    RETURN result;
END;
$$;
