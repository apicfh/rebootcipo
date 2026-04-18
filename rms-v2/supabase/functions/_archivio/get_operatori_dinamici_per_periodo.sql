DROP FUNCTION IF EXISTS get_operatori_dinamici_per_periodo(date, date);

CREATE OR REPLACE FUNCTION get_operatori_dinamici_per_periodo(
    data_inizio date,
    data_fine date
)
RETURNS TABLE (
    agente text,
    nome_display text,
    totale_chiamate bigint
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ta."Agente" as agente,
        COALESCE(ay.nome, ta."Agente") as nome_display,
        COUNT(*) as totale_chiamate
    FROM telefonate_automatico ta
    LEFT JOIN "Agenti Youneed" ay ON ay."Profilo" = ta."Agente"
    WHERE ta."Agente" IS NOT NULL 
        AND ta."Agente" != 'NONE'
        AND ta."Agente" != ''
        AND DATE(ta."Data/Ora Inizio") >= data_inizio
        AND DATE(ta."Data/Ora Inizio") <= data_fine
    GROUP BY ta."Agente", ay.nome
    HAVING COUNT(*) > 0
    ORDER BY COUNT(*) DESC;
END;
$$;
