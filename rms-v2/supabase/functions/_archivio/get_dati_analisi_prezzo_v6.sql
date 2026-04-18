-- Prima droppiamo la funzione esistente
DROP FUNCTION IF EXISTS get_dati_analisi_prezzo(uuid, uuid, uuid, text);

-- Ricreiamo con logica semplificata per non perdere prenotazioni
CREATE OR REPLACE FUNCTION get_dati_analisi_prezzo(
    p_hotel_id UUID,
    p_camera_id UUID,
    p_settimana_id UUID,
    p_stagione TEXT DEFAULT NULL
)
RETURNS TABLE(
    prezzi JSONB,
    prenotazioni JSONB,
    debug_info JSONB
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
            '[]'::JSONB as prenotazioni,
            JSONB_BUILD_OBJECT('error', 'Settimana non trovata', 'settimana_id', p_settimana_id) as debug_info;
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
    -- LOGICA SEMPLIFICATA: Aggrego per settimana di prenotazione
    -- ma conto TUTTE le prenotazioni che soddisfano i filtri
    prenotazioni_raw AS (
        SELECT 
            pr.data_prenotazione,
            pr.totale_soggiorno,
            pr.codice_prenotazione,
            pr.cliente_nome,
            pr.cliente_cognome
        FROM prenotazioni pr
        WHERE pr.id_hotel = p_hotel_id
          AND pr.camera_id = p_camera_id
          AND pr.data_prenotazione IS NOT NULL
          AND settimana_nome = ANY(pr.settimane)
          AND (p_stagione IS NULL OR LOWER(pr.stagione) = LOWER(p_stagione))
    ),
    prenotazioni_aggregate AS (
        SELECT 
            DATE_TRUNC('week', pr.data_prenotazione)::date as settimana_prenotazione,
            COUNT(*) as numero_prenotazioni,
            SUM(pr.totale_soggiorno) as fatturato_totale,
            ARRAY_AGG(pr.codice_prenotazione ORDER BY pr.data_prenotazione) as codici_prenotazione
        FROM prenotazioni_raw pr
        GROUP BY DATE_TRUNC('week', pr.data_prenotazione)
    ),
    prenotazioni_data AS (
        SELECT 
            JSONB_AGG(
                JSONB_BUILD_OBJECT(
                    'settimana_prenotazione', pa.settimana_prenotazione,
                    'numero_prenotazioni', pa.numero_prenotazioni,
                    'fatturato_totale', pa.fatturato_totale,
                    'codici_esempio', pa.codici_prenotazione[1:3]  -- Primi 3 codici per debug
                ) ORDER BY pa.settimana_prenotazione
            ) as prenotazioni_json
        FROM prenotazioni_aggregate pa
    ),
    debug_counts AS (
        SELECT 
            COUNT(*) as total_prenotazioni_raw,
            COUNT(DISTINCT DATE_TRUNC('week', data_prenotazione)) as settimane_uniche,
            MIN(data_prenotazione) as prima_prenotazione,
            MAX(data_prenotazione) as ultima_prenotazione
        FROM prenotazioni_raw
    )
    SELECT 
        COALESCE(pd.prezzi_json, '[]'::JSONB) as prezzi,
        COALESCE(prd.prenotazioni_json, '[]'::JSONB) as prenotazioni,
        JSONB_BUILD_OBJECT(
            'settimana_nome', settimana_nome,
            'filtri', JSONB_BUILD_OBJECT(
                'hotel_id', p_hotel_id,
                'camera_id', p_camera_id,
                'settimana_id', p_settimana_id,
                'stagione', p_stagione
            ),
            'prenotazioni_trovate', dc.total_prenotazioni_raw,
            'settimane_con_prenotazioni', dc.settimane_uniche,
            'periodo_prenotazioni', JSONB_BUILD_OBJECT(
                'da', dc.prima_prenotazione,
                'a', dc.ultima_prenotazione
            ),
            'somma_aggregate', (
                SELECT COALESCE(SUM((value->>'numero_prenotazioni')::INTEGER), 0)
                FROM JSONB_ARRAY_ELEMENTS(COALESCE(prd.prenotazioni_json, '[]'::JSONB))
            )
        ) as debug_info
    FROM prezzi_data pd
    FULL OUTER JOIN prenotazioni_data prd ON true
    FULL OUTER JOIN debug_counts dc ON true;
END;
$$;
