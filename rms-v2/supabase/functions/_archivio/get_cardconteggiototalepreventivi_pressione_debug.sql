-- Funzione DEBUG per vedere quali preventivi vengono contati
-- Restituisce gli ID e le date dei preventivi che soddisfano i criteri
CREATE OR REPLACE FUNCTION get_cardconteggiototalepreventivi_pressione_debug(
    p_soggiorno_inizio date DEFAULT NULL,
    p_soggiorno_fine date DEFAULT NULL,
    p_hotel_ids integer[] DEFAULT NULL
)
RETURNS TABLE (
    preventivo_id uuid,
    hotel_id integer,
    check_in date,
    check_out date,
    state_id integer,
    contact_email text
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        "Id" as preventivo_id,
        "HotelId" as hotel_id,
        "CheckIn" as check_in,
        "CheckOut" as check_out,
        "StateId" as state_id,
        "ContactEmail" as contact_email
    FROM public.preventivi_elaborati_travelbrain
    WHERE 
        -- Filtro per stati attivi: 1 = Non Letto, 2 = Letto
        "StateId" IN (1, 2)
        -- Filtro per hotel (se specificato)
        AND (p_hotel_ids IS NULL OR "HotelId" = ANY(p_hotel_ids))
        -- Filtro per date soggiorno con overlap logic
        AND (
            p_soggiorno_inizio IS NULL 
            OR p_soggiorno_fine IS NULL 
            OR (
                "CheckIn" <= p_soggiorno_fine 
                AND "CheckOut" >= p_soggiorno_inizio
            )
        )
    ORDER BY "CheckIn", "CheckOut";
END;
$$;

COMMENT ON FUNCTION get_cardconteggiototalepreventivi_pressione_debug IS 
'Funzione DEBUG: restituisce i dettagli dei preventivi contati dalla funzione principale per verificare la logica di filtraggio.';
