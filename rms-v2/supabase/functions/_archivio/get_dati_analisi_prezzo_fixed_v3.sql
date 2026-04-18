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
    prezzi_result JSONB;
    prenotazioni_result JSONB;
BEGIN
    -- Debug dei parametri
    RAISE NOTICE 'Parametri ricevuti: hotel_id=%, camera_id=%, settimana_id=%, stagione=%', 
        p_hotel_id, p_camera_id, p_settimana_id, p_stagione;

    -- Query per i prezzi
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'data', pf.valido_da,
            'prezzo', pf.prezzo,
            'valido_da', pf.valido_da,
            'valido_a', COALESCE(pf.valido_a, '2025-09-30'::date)
        ) ORDER BY pf.valido_da
    ), '[]'::jsonb)
    INTO prezzi_result
    FROM prezzi_finale pf
    WHERE pf.id_hotel = p_hotel_id
      AND pf.camera_id = p_camera_id
      AND pf.settimana = p_settimana_id
      AND (p_stagione IS NULL OR pf.stagione ILIKE p_stagione);

    RAISE NOTICE 'Prezzi trovati: %', jsonb_array_length(prezzi_result);

    -- Query per le prenotazioni
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'settimana_prenotazione', s.nome,
            'numero_prenotazioni', COUNT(pr.id),
            'fatturato_totale', COALESCE(SUM(pr.totale_soggiorno), 0)
        ) ORDER BY s.inizio
    ), '[]'::jsonb)
    INTO prenotazioni_result
    FROM prenotazioni pr
    JOIN settimane_soggiorno s ON s.id = ANY(pr.settimane)
    WHERE pr.id_hotel = p_hotel_id
      AND pr.camera_id = p_camera_id
      AND s.id = p_settimana_id
      AND pr.stato_prenotazione IN ('confermata', 'check-in', 'check-out');

    RAISE NOTICE 'Prenotazioni trovate: %', jsonb_array_length(prenotazioni_result);

    -- Restituisci i risultati
    RETURN QUERY SELECT prezzi_result, prenotazioni_result;
END;
$$;
