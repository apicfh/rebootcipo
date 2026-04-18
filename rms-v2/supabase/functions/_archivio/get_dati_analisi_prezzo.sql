-- Drop della versione esistente che non funziona
DROP FUNCTION IF EXISTS get_dati_analisi_prezzo(uuid,uuid,uuid,text);

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
                'valido_a', COALESCE(pf.valido_a, '2025-09-30'),
                'stagione', pf.stagione,
                'nome_camera', pf.nome_camera
            ) ORDER BY pf.valido_da
        ) as prezzi_json
        FROM prezzi_finale pf
        WHERE pf.id_hotel = p_hotel_id
          AND pf.camera_id = p_camera_id
          AND pf.settimana = p_settimana_id
          AND (p_stagione IS NULL OR LOWER(pf.stagione) = LOWER(p_stagione))
    ),
    prenotazioni_data AS (
        SELECT JSONB_AGG(
            JSONB_BUILD_OBJECT(
                'settimana_prenotazione', DATE_TRUNC('week', pr.data_prenotazione)::date,
                'numero_prenotazioni', COUNT(*),
                'fatturato_totale', SUM(pr.totale_soggiorno),
                'anno_prenotazione', EXTRACT(YEAR FROM pr.data_prenotazione)::integer
            ) ORDER BY DATE_TRUNC('week', pr.data_prenotazione)
        ) as prenotazioni_json
        FROM prenotazioni pr
        WHERE pr.id_hotel = p_hotel_id
          AND pr.camera_id = p_camera_id
          AND pr.data_prenotazione IS NOT NULL
          -- ✅ LOGICA SEMPLIFICATA: usa direttamente i campi della tabella
          AND pr.tipo_camera = (SELECT nome FROM tipi_camere WHERE id = p_camera_id)
          AND settimana_nome = ANY(pr.settimane)
          AND (p_stagione IS NULL OR LOWER(pr.stagione) = LOWER(p_stagione))
        GROUP BY DATE_TRUNC('week', pr.data_prenotazione), EXTRACT(YEAR FROM pr.data_prenotazione)
    )
    SELECT 
        COALESCE(pd.prezzi_json, '[]'::JSONB) as prezzi,
        COALESCE(prd.prenotazioni_json, '[]'::JSONB) as prenotazioni
    FROM prezzi_data pd
    FULL OUTER JOIN prenotazioni_data prd ON true;
END;
$$;
