CREATE OR REPLACE FUNCTION get_domandatravelbrain_stati_preventivi()
RETURNS TABLE (
    id_stato integer,
    descrizione text,
    categoria text
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sp.id_stato,
        sp.descrizione,
        sp.categoria
    FROM stati_preventivi sp
    ORDER BY sp.descrizione;
END;
$$;
