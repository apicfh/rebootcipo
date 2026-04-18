-- Drop della funzione esistente
DROP FUNCTION IF EXISTS debug_prenotazioni_step_by_step(text, text, text, text);

CREATE OR REPLACE FUNCTION debug_prenotazioni_step_by_step(
    p_hotel_nome TEXT,
    p_camera_nome TEXT,
    p_settimana TEXT,
    p_stagione TEXT DEFAULT NULL
)
RETURNS TABLE(
    step_number INTEGER,
    step_description TEXT,
    count_result INTEGER,
    sample_data TEXT
) AS $$
BEGIN
    -- Step 1: Tutte le prenotazioni dell'hotel
    RETURN QUERY
    SELECT 
        1 as step_number,
        'Prenotazioni totali hotel' as step_description,
        COUNT(*)::INTEGER as count_result,
        (SELECT STRING_AGG(sub.id::TEXT, ', ')
         FROM (SELECT pr.id FROM prenotazioni pr
               JOIN hotel h ON pr.id_hotel = h.id
               WHERE h.nome = p_hotel_nome
               ORDER BY pr.data_prenotazione
               LIMIT 5) sub) as sample_data
    FROM prenotazioni pr
    JOIN hotel h ON pr.id_hotel = h.id
    WHERE h.nome = p_hotel_nome;

    -- Step 2: + Filtro tipo camera
    RETURN QUERY
    SELECT 
        2 as step_number,
        'Prenotazioni hotel + camera specifica' as step_description,
        COUNT(*)::INTEGER as count_result,
        (SELECT STRING_AGG(sub.id::TEXT, ', ')
         FROM (SELECT pr.id FROM prenotazioni pr
               JOIN hotel h ON pr.id_hotel = h.id
               WHERE h.nome = p_hotel_nome
               AND pr.tipo_camera = p_camera_nome
               ORDER BY pr.data_prenotazione
               LIMIT 5) sub) as sample_data
    FROM prenotazioni pr
    JOIN hotel h ON pr.id_hotel = h.id
    WHERE h.nome = p_hotel_nome
    AND pr.tipo_camera = p_camera_nome;

    -- Step 3: + Filtro data_prenotazione non null
    RETURN QUERY
    SELECT 
        3 as step_number,
        'Prenotazioni con data_prenotazione valida' as step_description,
        COUNT(*)::INTEGER as count_result,
        (SELECT STRING_AGG(sub.id::TEXT, ', ')
         FROM (SELECT pr.id FROM prenotazioni pr
               JOIN hotel h ON pr.id_hotel = h.id
               WHERE h.nome = p_hotel_nome
               AND pr.tipo_camera = p_camera_nome
               AND pr.data_prenotazione IS NOT NULL
               ORDER BY pr.data_prenotazione
               LIMIT 5) sub) as sample_data
    FROM prenotazioni pr
    JOIN hotel h ON pr.id_hotel = h.id
    WHERE h.nome = p_hotel_nome
    AND pr.tipo_camera = p_camera_nome
    AND pr.data_prenotazione IS NOT NULL;

    -- Step 4: + Filtro settimana nell'array
    RETURN QUERY
    SELECT 
        4 as step_number,
        'Prenotazioni con settimana specifica nell''array' as step_description,
        COUNT(*)::INTEGER as count_result,
        (SELECT STRING_AGG(sub.info, ', ')
         FROM (SELECT pr.id::TEXT || ' (settimane: ' || COALESCE(ARRAY_TO_STRING(pr.settimane, ','), 'NULL') || ')' as info
               FROM prenotazioni pr
               JOIN hotel h ON pr.id_hotel = h.id
               WHERE h.nome = p_hotel_nome
               AND pr.tipo_camera = p_camera_nome
               AND pr.data_prenotazione IS NOT NULL
               AND pr.settimane IS NOT NULL
               AND p_settimana = ANY(pr.settimane)
               ORDER BY pr.data_prenotazione
               LIMIT 5) sub) as sample_data
    FROM prenotazioni pr
    JOIN hotel h ON pr.id_hotel = h.id
    WHERE h.nome = p_hotel_nome
    AND pr.tipo_camera = p_camera_nome
    AND pr.data_prenotazione IS NOT NULL
    AND pr.settimane IS NOT NULL
    AND p_settimana = ANY(pr.settimane);

    -- Step 5: + Filtro stagione (se specificata)
    IF p_stagione IS NOT NULL THEN
        RETURN QUERY
        SELECT 
            5 as step_number,
            'Prenotazioni con stagione specifica' as step_description,
            COUNT(*)::INTEGER as count_result,
            (SELECT STRING_AGG(sub.info, ', ')
             FROM (SELECT pr.id::TEXT || ' (stagione: ' || COALESCE(pr.stagione, 'NULL') || ')' as info
                   FROM prenotazioni pr
                   JOIN hotel h ON pr.id_hotel = h.id
                   WHERE h.nome = p_hotel_nome
                   AND pr.tipo_camera = p_camera_nome
                   AND pr.data_prenotazione IS NOT NULL
                   AND pr.settimane IS NOT NULL
                   AND p_settimana = ANY(pr.settimane)
                   AND pr.stagione = p_stagione
                   ORDER BY pr.data_prenotazione
                   LIMIT 5) sub) as sample_data
        FROM prenotazioni pr
        JOIN hotel h ON pr.id_hotel = h.id
        WHERE h.nome = p_hotel_nome
        AND pr.tipo_camera = p_camera_nome
        AND pr.data_prenotazione IS NOT NULL
        AND pr.settimane IS NOT NULL
        AND p_settimana = ANY(pr.settimane)
        AND pr.stagione = p_stagione;
    END IF;

    -- Step 6: Verifica array settimane
    RETURN QUERY
    SELECT 
        6 as step_number,
        'Settimane uniche trovate nell''array' as step_description,
        COUNT(DISTINCT settimana_singola)::INTEGER as count_result,
        STRING_AGG(DISTINCT settimana_singola, ', ') as sample_data
    FROM (
        SELECT unnest(pr.settimane) as settimana_singola
        FROM prenotazioni pr
        JOIN hotel h ON pr.id_hotel = h.id
        WHERE h.nome = p_hotel_nome
        AND pr.tipo_camera = p_camera_nome
        AND pr.data_prenotazione IS NOT NULL
        AND pr.settimane IS NOT NULL
        AND p_settimana = ANY(pr.settimane)
        AND (p_stagione IS NULL OR pr.stagione = p_stagione)
    ) settimane_espanse;

END;
$$ LANGUAGE plpgsql;
