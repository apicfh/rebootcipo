-- Drop della funzione esistente
DROP FUNCTION IF EXISTS debug_settimane_specifico(text, text, text, text);

CREATE OR REPLACE FUNCTION debug_settimane_specifico(
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
    -- Step 1: Verifica prenotazioni che hanno la settimana nell'array
    RETURN QUERY
    SELECT 
        1 as step_number,
        'Prenotazioni con settimana "' || p_settimana || '" nell''array settimane' as step_description,
        COUNT(*)::INTEGER as count_result,
        (SELECT STRING_AGG(sub.info, ' | ')
         FROM (SELECT pr.id::TEXT || ' (settimane: [' || ARRAY_TO_STRING(pr.settimane, ', ') || ']) (data_pren: ' || pr.data_prenotazione::TEXT || ')' as info
               FROM prenotazioni pr
               JOIN hotel h ON pr.id_hotel = h.id
               WHERE h.nome = p_hotel_nome
               AND pr.tipo_camera = p_camera_nome
               AND pr.data_prenotazione IS NOT NULL
               AND pr.settimane IS NOT NULL
               AND p_settimana = ANY(pr.settimane)
               AND (p_stagione IS NULL OR pr.stagione = p_stagione)
               ORDER BY pr.data_prenotazione
               LIMIT 3) sub) as sample_data
    FROM prenotazioni pr
    JOIN hotel h ON pr.id_hotel = h.id
    WHERE h.nome = p_hotel_nome
    AND pr.tipo_camera = p_camera_nome
    AND pr.data_prenotazione IS NOT NULL
    AND pr.settimane IS NOT NULL
    AND p_settimana = ANY(pr.settimane)
    AND (p_stagione IS NULL OR pr.stagione = p_stagione);

    -- Step 2: Raggruppa per settimana di prenotazione (DATE_TRUNC)
    RETURN QUERY
    SELECT 
        2 as step_number,
        'Raggruppa per settimana di prenotazione (DATE_TRUNC)' as step_description,
        COUNT(DISTINCT DATE_TRUNC('week', pr.data_prenotazione))::INTEGER as count_result,
        (SELECT STRING_AGG(sub.info, ' | ')
         FROM (SELECT DATE_TRUNC('week', pr.data_prenotazione)::TEXT || ' (' || COUNT(*)::TEXT || ' prenotazioni)' as info
               FROM prenotazioni pr
               JOIN hotel h ON pr.id_hotel = h.id
               WHERE h.nome = p_hotel_nome
               AND pr.tipo_camera = p_camera_nome
               AND pr.data_prenotazione IS NOT NULL
               AND pr.settimane IS NOT NULL
               AND p_settimana = ANY(pr.settimane)
               AND (p_stagione IS NULL OR pr.stagione = p_stagione)
               GROUP BY DATE_TRUNC('week', pr.data_prenotazione)
               ORDER BY DATE_TRUNC('week', pr.data_prenotazione)
               LIMIT 5) sub) as sample_data
    FROM prenotazioni pr
    JOIN hotel h ON pr.id_hotel = h.id
    WHERE h.nome = p_hotel_nome
    AND pr.tipo_camera = p_camera_nome
    AND pr.data_prenotazione IS NOT NULL
    AND pr.settimane IS NOT NULL
    AND p_settimana = ANY(pr.settimane)
    AND (p_stagione IS NULL OR pr.stagione = p_stagione);

    -- Step 3: Somma finale delle prenotazioni
    RETURN QUERY
    SELECT 
        3 as step_number,
        'Somma finale delle prenotazioni per settimana' as step_description,
        SUM(weekly_count)::INTEGER as count_result,
        (SELECT STRING_AGG(sub.info, ' | ')
         FROM (SELECT weekly_data.week_start::TEXT || ': ' || weekly_data.weekly_count::TEXT || ' prenotazioni' as info
               FROM (
                   SELECT 
                       DATE_TRUNC('week', pr.data_prenotazione) as week_start,
                       COUNT(*) as weekly_count
                   FROM prenotazioni pr
                   JOIN hotel h ON pr.id_hotel = h.id
                   WHERE h.nome = p_hotel_nome
                   AND pr.tipo_camera = p_camera_nome
                   AND pr.data_prenotazione IS NOT NULL
                   AND pr.settimane IS NOT NULL
                   AND p_settimana = ANY(pr.settimane)
                   AND (p_stagione IS NULL OR pr.stagione = p_stagione)
                   GROUP BY DATE_TRUNC('week', pr.data_prenotazione)
                   ORDER BY DATE_TRUNC('week', pr.data_prenotazione)
               ) weekly_data
               LIMIT 5) sub) as sample_data
    FROM (
        SELECT 
            DATE_TRUNC('week', pr.data_prenotazione) as week_start,
            COUNT(*) as weekly_count
        FROM prenotazioni pr
        JOIN hotel h ON pr.id_hotel = h.id
        WHERE h.nome = p_hotel_nome
        AND pr.tipo_camera = p_camera_nome
        AND pr.data_prenotazione IS NOT NULL
        AND pr.settimane IS NOT NULL
        AND p_settimana = ANY(pr.settimane)
        AND (p_stagione IS NULL OR pr.stagione = p_stagione)
        GROUP BY DATE_TRUNC('week', pr.data_prenotazione)
    ) weekly_data;

    -- Step 4: Analisi dettagliata delle date
    RETURN QUERY
    SELECT 
        4 as step_number,
        'Analisi date prenotazione vs settimane soggiorno' as step_description,
        COUNT(*)::INTEGER as count_result,
        (SELECT STRING_AGG(sub.info, ' | ')
         FROM (SELECT 'ID:' || pr.id::TEXT || ' DataPren:' || pr.data_prenotazione::TEXT || ' Settimane:[' || ARRAY_TO_STRING(pr.settimane, ',') || ']' as info
               FROM prenotazioni pr
               JOIN hotel h ON pr.id_hotel = h.id
               WHERE h.nome = p_hotel_nome
               AND pr.tipo_camera = p_camera_nome
               AND pr.data_prenotazione IS NOT NULL
               AND pr.settimane IS NOT NULL
               AND p_settimana = ANY(pr.settimane)
               AND (p_stagione IS NULL OR pr.stagione = p_stagione)
               ORDER BY pr.data_prenotazione
               LIMIT 3) sub) as sample_data
    FROM prenotazioni pr
    JOIN hotel h ON pr.id_hotel = h.id
    WHERE h.nome = p_hotel_nome
    AND pr.tipo_camera = p_camera_nome
    AND pr.data_prenotazione IS NOT NULL
    AND pr.settimane IS NOT NULL
    AND p_settimana = ANY(pr.settimane)
    AND (p_stagione IS NULL OR pr.stagione = p_stagione);

END;
$$ LANGUAGE plpgsql;
