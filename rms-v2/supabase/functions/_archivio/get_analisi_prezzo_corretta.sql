-- Drop della funzione esistente
DROP FUNCTION IF EXISTS get_analisi_prezzo_semplificata(uuid,uuid,uuid,text,boolean);

-- Nuova funzione corretta per analisi prezzi
CREATE OR REPLACE FUNCTION get_analisi_prezzo_semplificata(
  p_hotel_id uuid,
  p_camera_id uuid,
  p_settimana_id uuid,
  p_stagione text DEFAULT NULL,
  p_includi_stato_8 boolean DEFAULT false
)
RETURNS TABLE (
  prezzi json,
  prenotazioni json,
  range_temporale json
) 
LANGUAGE plpgsql
AS $$
DECLARE
  settimana_inizio date;
  settimana_fine date;
  settimana_anno integer;
  settimana_nome text;
  stagione_apertura date;
  stagione_chiusura date;
  range_inizio date;
  range_fine date;
BEGIN
  -- Ottieni dettagli della settimana selezionata
  SELECT ss.inizio::date, ss.fine::date, ss.anno, ss.nome 
  INTO settimana_inizio, settimana_fine, settimana_anno, settimana_nome
  FROM settimane_soggiorno ss 
  WHERE ss.id = p_settimana_id;
  
  -- Se settimana non trovata, restituisci vuoto
  IF settimana_nome IS NULL THEN
    RETURN QUERY SELECT 
      '[]'::json as prezzi,
      '[]'::json as prenotazioni,
      '{"error": "Settimana non trovata"}'::json as range_temporale;
    RETURN;
  END IF;
  
  -- Ottieni date apertura/chiusura stagione
  SELECT s.apertura::date, s.chiusura::date
  INTO stagione_apertura, stagione_chiusura
  FROM stagioni s
  WHERE s.hotel_id = p_hotel_id 
    AND s.stagione = p_stagione
    AND s.anno = settimana_anno;
  
  -- Calcola range temporale: da ottobre precedente a chiusura stagione
  range_inizio := DATE(settimana_anno - 1 || '-10-01');
  range_fine := COALESCE(stagione_chiusura, DATE(settimana_anno || '-09-30'));
  
  RETURN QUERY
  SELECT 
    -- Prezzi dalla tabella prezzi_finale
    (SELECT json_agg(
      json_build_object(
        'data', pf.valido_da::text,
        'prezzo', pf.prezzo::numeric,
        'valido_da', pf.valido_da::text,
        'valido_a', COALESCE(pf.valido_a::text, '2025-09-30'),
        'stagione', pf.stagione,
        'nome_camera', pf.nome_camera
      ) ORDER BY pf.valido_da
    ) FROM prezzi_finale pf 
    WHERE pf.id_hotel = p_hotel_id 
      AND pf.camera_id = p_camera_id 
      AND pf.settimana = p_settimana_id
      AND (p_stagione IS NULL OR LOWER(pf.stagione) = LOWER(p_stagione))
    ) as prezzi,
    
    -- Prenotazioni con logica multipla di ricerca
    (SELECT json_agg(
      json_build_object(
        'data_prenotazione', p.data_prenotazione::text,
        'numero_prenotazioni', 1,
        'fatturato', p.totale_soggiorno::numeric,
        'stato_prenotazione', p.stato_prenotazione,
        'arrivo', p.arrivo::text,
        'partenza', p.partenza::text,
        'codice', p.codice_prenotazione,
        'metodo_match', CASE 
          WHEN p_settimana_id::text = ANY(p.settimane) THEN 'uuid_in_array'
          WHEN settimana_nome = ANY(p.settimane) THEN 'nome_in_array'  
          WHEN p.arrivo <= settimana_fine AND p.partenza >= settimana_inizio THEN 'date_overlap'
          ELSE 'unknown'
        END
      ) ORDER BY p.data_prenotazione
    ) FROM prenotazioni p
    WHERE p.id_hotel = p_hotel_id
      AND p.camera_id = p_camera_id
      AND p.data_prenotazione IS NOT NULL
      AND p.data_prenotazione BETWEEN range_inizio AND range_fine
      -- LOGICA MULTIPLA per trovare prenotazioni che riguardano questa settimana
      AND (
        -- Opzione 1: UUID settimana nell'array settimane
        p_settimana_id::text = ANY(p.settimane)
        OR
        -- Opzione 2: Nome settimana nell'array settimane  
        settimana_nome = ANY(p.settimane)
        OR
        -- Opzione 3: Sovrapposizione date arrivo/partenza con settimana
        (p.arrivo IS NOT NULL AND p.partenza IS NOT NULL 
         AND p.arrivo <= settimana_fine AND p.partenza >= settimana_inizio)
      )
      -- Filtro stato prenotazione
      AND (p_includi_stato_8 OR p.stato_prenotazione != '8')
      -- Filtro stagione se specificata
      AND (p_stagione IS NULL OR LOWER(p.stagione) = LOWER(p_stagione))
    ) as prenotazioni,
    
    -- Range temporale per il frontend
    (SELECT json_build_object(
      'inizio', range_inizio::text,
      'fine', range_fine::text,
      'stagione_apertura', COALESCE(stagione_apertura::text, 'N/A'),
      'stagione_chiusura', COALESCE(stagione_chiusura::text, 'N/A'),
      'settimana_nome', settimana_nome,
      'settimana_periodo', settimana_inizio::text || ' - ' || settimana_fine::text
    )) as range_temporale;
END;
$$;
