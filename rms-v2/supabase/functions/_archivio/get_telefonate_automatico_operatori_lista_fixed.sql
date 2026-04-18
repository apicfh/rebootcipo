-- Correzione del filtro temporale nella RPC operatori
DROP FUNCTION IF EXISTS get_operatori_telefonate_automatico(date, date);

CREATE OR REPLACE FUNCTION get_operatori_telefonate_automatico(
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
    INNER JOIN telefonate_automatico ta ON ta."Agente" = ay."Profilo"
    WHERE ay."Profilo" IS NOT NULL 
      AND ay."Profilo" != 'NONE'
      AND ay."Profilo" != ''
      AND ta."Agente" != 'NONE'
      AND ta."Agente" IS NOT NULL
      AND DATE(ta."Data/Ora Inizio") >= data_inizio
      AND DATE(ta."Data/Ora Inizio") <= data_fine
    GROUP BY ay."Profilo", ay.nome
    HAVING COUNT(ta.*) > 0
    ORDER BY totale_chiamate DESC, ay.nome ASC;
END;
$$;
