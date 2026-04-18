-- Funzione di debug per verificare come sono collegati prenotazioni e settimane
CREATE OR REPLACE FUNCTION debug_prenotazioni_settimane_link(
    p_hotel_id UUID,
    p_camera_id UUID,
    p_settimana_id UUID
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
    settimana_inizio DATE;
    settimana_fine DATE;
BEGIN
    -- Ottieni dettagli settimana
    SELECT nome, inizio::date, fine::date 
    INTO settimana_nome, settimana_inizio, settimana_fine
    FROM settimane_soggiorno 
    WHERE id = p_settimana_id;
    
    -- Step 1: Verifica struttura settimana
    RETURN QUERY
    SELECT 
        'Step 1: Dettagli settimana selezionata' as step_name,
        1 as count_result,
        JSONB_BUILD_OBJECT(
            'settimana_id', p_settimana_id,
            'settimana_nome', settimana_nome,
            'inizio', settimana_inizio,
            'fine', settimana_fine
        ) as sample_data;
    
    -- Step 2: Prenotazioni base (hotel + camera)
    RETURN QUERY
    SELECT 
        'Step 2: Prenotazioni hotel+camera' as step_name,
        COUNT(*)::INTEGER as count_result,
        JSONB_AGG(
            JSONB_BUILD_OBJECT(
                'id', pr.id,
                'codice', pr.codice_prenotazione,
                'arrivo', pr.arrivo,
                'partenza', pr.partenza,
                'settimane_array', pr.settimane,
                'stagione', pr.stagione,
                'data_prenotazione', pr.data_prenotazione
            )
        ) FILTER (WHERE pr.id IS NOT NULL) as sample_data
    FROM prenotazioni pr
    WHERE pr.id_hotel = p_hotel_id
      AND pr.camera_id = p_camera_id
    LIMIT 5;
    
    -- Step 3: Verifica se settimana_id è nell'array settimane (come UUID)
    RETURN QUERY
    SELECT 
        'Step 3: Settimana UUID nell''array settimane' as step_name,
        COUNT(*)::INTEGER as count_result,
        JSONB_AGG(
            JSONB_BUILD_OBJECT(
                'id', pr.id,
                'codice', pr.codice_prenotazione,
                'settimane_array', pr.settimane,
                'contiene_uuid', (p_settimana_id::text = ANY(pr.settimane))
            )
        ) FILTER (WHERE pr.id IS NOT NULL) as sample_data
    FROM prenotazioni pr
    WHERE pr.id_hotel = p_hotel_id
      AND pr.camera_id = p_camera_id
      AND p_settimana_id::text = ANY(pr.settimane)
    LIMIT 5;
    
    -- Step 4: Verifica se nome settimana è nell'array settimane (come testo)
    RETURN QUERY
    SELECT 
        'Step 4: Nome settimana nell''array settimane' as step_name,
        COUNT(*)::INTEGER as count_result,
        JSONB_AGG(
            JSONB_BUILD_OBJECT(
                'id', pr.id,
                'codice', pr.codice_prenotazione,
                'settimane_array', pr.settimane,
                'contiene_nome', (settimana_nome = ANY(pr.settimane))
            )
        ) FILTER (WHERE pr.id IS NOT NULL) as sample_data
    FROM prenotazioni pr
    WHERE pr.id_hotel = p_hotel_id
      AND pr.camera_id = p_camera_id
      AND settimana_nome = ANY(pr.settimane)
    LIMIT 5;
    
    -- Step 5: Verifica sovrapposizione date (arrivo/partenza con settimana)
    RETURN QUERY
    SELECT 
        'Step 5: Sovrapposizione date arrivo/partenza' as step_name,
        COUNT(*)::INTEGER as count_result,
        JSONB_AGG(
            JSONB_BUILD_OBJECT(
                'id', pr.id,
                'codice', pr.codice_prenotazione,
                'arrivo', pr.arrivo,
                'partenza', pr.partenza,
                'settimana_inizio', settimana_inizio,
                'settimana_fine', settimana_fine,
                'si_sovrappone', (
                    pr.arrivo <= settimana_fine AND pr.partenza >= settimana_inizio
                )
            )
        ) FILTER (WHERE pr.id IS NOT NULL) as sample_data
    FROM prenotazioni pr
    WHERE pr.id_hotel = p_hotel_id
      AND pr.camera_id = p_camera_id
      AND pr.arrivo IS NOT NULL 
      AND pr.partenza IS NOT NULL
      AND pr.arrivo <= settimana_fine 
      AND pr.partenza >= settimana_inizio
    LIMIT 5;
    
END;
$$;
