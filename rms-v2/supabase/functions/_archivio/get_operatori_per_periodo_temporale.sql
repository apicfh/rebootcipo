DROP FUNCTION IF EXISTS public.get_operatori_per_periodo_temporale(date, date);

CREATE OR REPLACE FUNCTION public.get_operatori_per_periodo_temporale(
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
        ay."Profilo" as agente,
        ay.nome as nome_display,
        COUNT(ta.*) as totale_chiamate
    FROM "Agenti Youneed" ay
    INNER JOIN telefonate_automatico ta ON ay."Profilo" = ta."Agente"
    WHERE ta."Agente" != 'NONE' 
        AND ta."Agente" IS NOT NULL
        AND DATE(ta."Data/Ora Inizio") >= data_inizio
        AND DATE(ta."Data/Ora Inizio") <= data_fine
    GROUP BY ay."Profilo", ay.nome
    HAVING COUNT(ta.*) > 0
    ORDER BY COUNT(ta.*) DESC;
END;
$$;
