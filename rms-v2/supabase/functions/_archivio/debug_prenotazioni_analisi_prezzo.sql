-- Query di debug per confrontare i risultati
CREATE OR REPLACE FUNCTION debug_prenotazioni_analisi_prezzo(
    p_hotel_id UUID,
    p_camera_id UUID,
    p_settimana_id UUID,
    p_stagione TEXT DEFAULT NULL
)
RETURNS TABLE(
    step_name TEXT,
    count_result INTEGER,
    sample_data JSONB
) 
LANGUAGE plpgsql
AS $$
DECLARE
    settimana_nome TEXT;
    hotel_nome TEXT;
    camera_nome TEXT;
BEGIN
    -- Ottieni i nomi per il debug
    SELECT nome INTO settimana_nome FROM settimane_soggiorno WHERE id = p_settimana_id;
    SELECT nome INTO hotel_nome FROM hotel WHERE id = p_hotel_id;
    SELECT nome INTO camera_nome FROM tipi_camere WHERE id = p_camera_id;
    
    -- Step 1: Tutte le prenotazioni dell'hotel
    RETURN QUERY
    SELECT 
        'Step 1: Prenotazioni hotel ' || COALESCE(hotel_nome, 'UNKNOWN') as step_name,
        COUNT(*)::INTEGER as count_result,
        JSONB_AGG(
            JSONB_BUILD_OBJECT(
                'id', pr.id,
                'codice', pr.codice_prenotazione,
                'data_prenotazione', pr.data_prenotazione,
                'settimane', pr.settimane,
                'stagione', pr.stagione
            )
        ) FILTER (WHERE pr.id IS NOT NULL) as sample_data
    FROM prenotazioni pr
    WHERE pr.id_hotel = p_hotel_id;
    
    -- Step 2: Prenotazioni hotel + camera
    RETURN QUERY
    SELECT 
        'Step 2: + Camera ' || COALESCE(camera_nome, 'UNKNOWN') as step_name,
        COUNT(*)::INTEGER as count_result,
        JSONB_AGG(
            JSONB_BUILD_OBJECT(
                'id', pr.id,
                'codice', pr.codice_prenotazione,
                'data_prenotazione', pr.data_prenotazione,
                'settimane', pr.settimane,
                'stagione', pr.stagione
            )
        ) FILTER (WHERE pr.id IS NOT NULL) as sample_data
    FROM prenotazioni pr
    WHERE pr.id_hotel = p_hotel_id
      AND pr.camera_id = p_camera_id;
    
    -- Step 3: + Data prenotazione non null
    RETURN QUERY
    SELECT 
        'Step 3: + Data prenotazione valida' as step_name,
        COUNT(*)::INTEGER as count_result,
        JSONB_AGG(
            JSONB_BUILD_OBJECT(
                'id', pr.id,
                'codice', pr.codice_prenotazione,
                'data_prenotazione', pr.data_prenotazione,
                'settimane', pr.settimane,
                'stagione', pr.stagione
            )
        ) FILTER (WHERE pr.id IS NOT NULL) as sample_data
    FROM prenotazioni pr
    WHERE pr.id_hotel = p_hotel_id
      AND pr.camera_id = p_camera_id
      AND pr.data_prenotazione IS NOT NULL;
    
    -- Step 4: + Settimana nel array
    RETURN QUERY
    SELECT 
        'Step 4: + Settimana "' || COALESCE(settimana_nome, 'UNKNOWN') || '" in array' as step_name,
        COUNT(*)::INTEGER as count_result,
        JSONB_AGG(
            JSONB_BUILD_OBJECT(
                'id', pr.id,
                'codice', pr.codice_prenotazione,
                'data_prenotazione', pr.data_prenotazione,
                'settimane', pr.settimane,
                'stagione', pr.stagione
            )
        ) FILTER (WHERE pr.id IS NOT NULL) as sample_data
    FROM prenotazioni pr
    WHERE pr.id_hotel = p_hotel_id
      AND pr.camera_id = p_camera_id
      AND pr.data_prenotazione IS NOT NULL
      AND settimana_nome = ANY(pr.settimane);
    
    -- Step 5: + Stagione
    RETURN QUERY
    SELECT 
        'Step 5: + Stagione "' || COALESCE(p_stagione, 'ANY') || '"' as step_name,
        COUNT(*)::INTEGER as count_result,
        JSONB_AGG(
            JSONB_BUILD_OBJECT(
                'id', pr.id,
                'codice', pr.codice_prenotazione,
                'data_prenotazione', pr.data_prenotazione,
                'settimane', pr.settimane,
                'stagione', pr.stagione
            )
        ) FILTER (WHERE pr.id IS NOT NULL) as sample_data
    FROM prenotazioni pr
    WHERE pr.id_hotel = p_hotel_id
      AND pr.camera_id = p_camera_id
      AND pr.data_prenotazione IS NOT NULL
      AND settimana_nome = ANY(pr.settimane)
      AND (p_stagione IS NULL OR LOWER(pr.stagione) = LOWER(p_stagione));
    
    -- Step 6: Dopo aggregazione per settimana
    RETURN QUERY
    SELECT 
        'Step 6: Dopo aggregazione per settimana di prenotazione' as step_name,
        COUNT(*)::INTEGER as count_result,
        JSONB_AGG(
            JSONB_BUILD_OBJECT(
                'settimana_prenotazione', pa.settimana_prenotazione,
                'numero_prenotazioni', pa.numero_prenotazioni,
                'fatturato_totale', pa.fatturato_totale
            )
        ) as sample_data
    FROM (
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
    ) pa;
    
END;
$$;
