-- Prima droppiamo la funzione esistente
DROP FUNCTION IF EXISTS get_dati_analisi_prezzo(uuid, uuid, uuid, text);

-- Poi la ricreiamo con la logica corretta (senza funzioni aggregate annidate)
CREATE OR REPLACE FUNCTION get_dati_analisi_prezzo(
    p_hotel_id UUID,
    p_camera_id UUID,
    p_settimana_id UUID,
    p_stagione TEXT DEFAULT NULL
)
RETURNS TABLE(
    prezzi JSONB,
    prenotazioni JSONB
) 
LANGUAGE plpgsql
AS $$
DECLARE
    settimana_nome TEXT;
BEGIN
    -- Ottieni il nome della settimana selezionata
    SELECT nome INTO settimana_nome
    FROM settimane_soggiorno 
    WHERE id = p_settimana_id;
    
    -- Se non trova la settimana, restituisci array vuoti
    IF settimana_nome IS NULL THEN
        RETURN QUERY SELECT 
            '[]'::JSONB as prezzi,
            '[]'::JSONB as prenotazioni;
        RETURN;
    END IF;

    RETURN QUERY
    WITH prezzi_data AS (
        SELECT JSONB_AGG(
            JSONB_BUILD_OBJECT(
                'data', pf.valido_da,
                'prezzo', pf.prezzo,
                'valido_da', pf.valido_da,
                'valido_a', COALESCE(pf.valido_a, '2025-09-30')
            ) ORDER BY pf.valido_da
        ) as prezzi_json
        FROM prezzi_finale pf
        WHERE pf.id_hotel = p_hotel_id
          AND pf.camera_id = p_camera_id
          AND pf.settimana = p_settimana_id
          AND (p_stagione IS NULL OR LOWER(pf.stagione) = LOWER(p_stagione))
    ),
    -- Prima aggrego le prenotazioni per settimana, poi creo il JSON
    prenotazioni_aggregate AS (
        SELECT 
            DATE_TRUNC('week', pr.data_prenotazione)::date as settimana_prenotazione,
            COUNT(*) as numero_prenotazioni,
            SUM(pr.totale_soggiorno) as fatturato_totale
        FROM prenotazioni pr
        WHERE pr.id_hotel = p_hotel_id
          AND pr.camera_id = p_camera_id
          AND pr.data_prenotazione IS NOT NULL
          AND settimana_nome = ANY(pr.settimane)
          AND (p_stagione IS NULL OR LOWER(pr.stagione) = LOWER(p_stagione))
        GROUP BY DATE_TRUNC('week', pr.data_prenotazione)
    ),
    prenotazioni_data AS (
        SELECT JSONB_AGG(
            JSONB_BUILD_OBJECT(
                'settimana_prenotazione', pa.settimana_prenotazione,
                'numero_prenotazioni', pa.numero_prenotazioni,
                'fatturato_totale', pa.fatturato_totale
            ) ORDER BY pa.settimana_prenotazione
        ) as prenotazioni_json
        FROM prenotazioni_aggregate pa
    )
    SELECT 
        COALESCE(pd.prezzi_json, '[]'::JSONB) as prezzi,
        COALESCE(prd.prenotazioni_json, '[]'::JSONB) as prenotazioni
    FROM prezzi_data pd
    FULL OUTER JOIN prenotazioni_data prd ON true;
END;
$$;
