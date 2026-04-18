-- Funzione per contare il numero totale di preventivi attivi (StateId 1 e 2)
-- per la card "Preventivi Totali" nella sezione Pressione Domanda
-- Modificata per restituire JSON con dettagli quando count < 10

-- Aggiunto DROP della versione precedente prima di ricreare la funzione
DROP FUNCTION IF EXISTS get_cardconteggiototalepreventivi_pressione(date, date, integer[]);

CREATE OR REPLACE FUNCTION get_cardconteggiototalepreventivi_pressione(
    p_soggiorno_inizio date DEFAULT NULL,
    p_soggiorno_fine date DEFAULT NULL,
    p_hotel_ids integer[] DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_count bigint;
    v_result jsonb;
    v_details jsonb;
BEGIN
    SELECT COUNT(DISTINCT "Id")
    INTO v_count
    FROM public.preventivi_elaborati_travelbrain
    WHERE 
        -- Filtro per stati attivi: 1 = Non Letto, 2 = Letto
        "StateId" IN (1, 2)
        -- Filtro per hotel (se specificato)
        AND (p_hotel_ids IS NULL OR "HotelId" = ANY(p_hotel_ids))
        -- Filtro per date soggiorno con overlap logic
        -- Il preventivo è incluso se c'è sovrapposizione tra le date del preventivo e il range richiesto
        AND (
            p_soggiorno_inizio IS NULL 
            OR p_soggiorno_fine IS NULL 
            OR (
                "CheckIn" <= p_soggiorno_fine 
                AND "CheckOut" >= p_soggiorno_inizio
            )
        );
    
    -- Se il count è minore di 10, includi i dettagli dei preventivi
    IF v_count < 10 THEN
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', "Id",
                'hotel_id', "HotelId",
                'check_in', "CheckIn",
                'check_out', "CheckOut",
                'state_id', "StateId",
                'contact_email', "ContactEmail",
                'creation_date', "CreationDate"
            )
        )
        INTO v_details
        FROM public.preventivi_elaborati_travelbrain
        WHERE 
            "StateId" IN (1, 2)
            AND (p_hotel_ids IS NULL OR "HotelId" = ANY(p_hotel_ids))
            AND (
                p_soggiorno_inizio IS NULL 
                OR p_soggiorno_fine IS NULL 
                OR (
                    "CheckIn" <= p_soggiorno_fine 
                    AND "CheckOut" >= p_soggiorno_inizio
                )
            );
        
        v_result := jsonb_build_object(
            'count', COALESCE(v_count, 0),
            'details', COALESCE(v_details, '[]'::jsonb)
        );
    ELSE
        v_result := jsonb_build_object(
            'count', COALESCE(v_count, 0)
        );
    END IF;
    
    RETURN v_result;
END;
$$;

-- Commento sulla funzione
COMMENT ON FUNCTION get_cardconteggiototalepreventivi_pressione IS 
'Conta il numero totale di preventivi distinti attivi (StateId 1 e 2) per il periodo di soggiorno specificato. Restituisce JSON con count e dettagli (se count < 10). Utilizzata nella card Preventivi Totali della sezione Pressione Domanda.';
