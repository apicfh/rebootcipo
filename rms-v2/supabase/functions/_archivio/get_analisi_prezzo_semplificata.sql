-- Drop della funzione esistente se presente
DROP FUNCTION IF EXISTS get_analisi_prezzo_semplificata(uuid,uuid,uuid,text,boolean);

-- Funzione semplificata per analisi prezzi - DEFINITIVA
CREATE OR REPLACE FUNCTION get_analisi_prezzo_semplificata(
  p_hotel_id uuid,
  p_camera_id uuid,
  p_settimana_id uuid,
  p_stagione text DEFAULT NULL,
  p_includi_stato_8 boolean DEFAULT false
)
RETURNS TABLE (
  prezzi jsonb,
  prenotazioni jsonb,
  range_temporale jsonb
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
  v_prezzi jsonb;
  v_prenotazioni jsonb;
  v_range jsonb;
BEGIN
  -- Ottieni dettagli della settimana selezionata
  SELECT ss.inizio, ss.fine, ss.anno, ss.nome 
  INTO settimana_inizio, settimana_fine, settimana_anno, settimana_nome
  FROM settimane_soggiorno ss 
  WHERE ss.id = p_settimana_id;
  
  -- Determina il range temporale dalla stagione
  IF p_stagione IS NOT NULL THEN
    SELECT s.apertura::date, s.chiusura::date 
    INTO stagione_apertura, stagione_chiusura
    FROM stagioni s
    WHERE s.hotel_id = p_hotel_id 
    AND s.stagione = p_stagione
    LIMIT 1;
  END IF;
  
  -- Se non abbiamo trovato la stagione, usa un range di default
  IF stagione_apertura IS NULL THEN
    stagione_apertura := CURRENT_DATE;
    stagione_chiusura := CURRENT_DATE + INTERVAL '1 year';
  END IF;
  
  -- Range da ottobre precedente alla chiusura stagione
  range_inizio := DATE_TRUNC('month', stagione_apertura - INTERVAL '1 year') + INTERVAL '9 months';
  range_fine := stagione_chiusura;
  
  -- Recupera i prezzi (SENZA window function dentro aggregate)
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'data', pf.valido_da::text,
        'prezzo', pf.prezzo::numeric,
        'valido_da', pf.valido_da::text,
        'valido_a', pf.valido_a::text,
        'stagione', pf.stagione,
        'nome_camera', pf.nome_camera
      ) ORDER BY pf.valido_da
    ),
    '[]'::jsonb
  ) INTO v_prezzi
  FROM prezzi_finale pf 
  WHERE pf.id_hotel = p_hotel_id
  AND pf.camera_id = p_camera_id
  AND pf.settimana = p_settimana_id
  AND (p_stagione IS NULL OR LOWER(pf.stagione) = LOWER(p_stagione));
  
  -- Recupera le prenotazioni
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'data_prenotazione', p.data_prenotazione::text,
        'numero_prenotazioni', 1,
        'fatturato', p.totale_soggiorno,
        'stato_prenotazione', p.stato_prenotazione,
        'arrivo', p.arrivo::text,
        'partenza', p.partenza::text
      )
    ),
    '[]'::jsonb
  ) INTO v_prenotazioni
  FROM prenotazioni p
  WHERE p.id_hotel = p_hotel_id
  AND p.camera_id = p_camera_id
  AND p.data_prenotazione IS NOT NULL
  AND p.data_prenotazione BETWEEN range_inizio AND range_fine
  -- Filtro settimana: deve essere nell'array delle settimane del soggiorno
  AND EXISTS (
    SELECT 1 FROM unnest(
      ARRAY(
        SELECT generate_series(
          p.arrivo::date,
          p.partenza::date - INTERVAL '1 day',
          INTERVAL '1 day'
        )::date
      )
    ) AS giorno_soggiorno
    WHERE giorno_soggiorno BETWEEN settimana_inizio AND settimana_fine
  )
  -- Filtro stato prenotazione
  AND (p_includi_stato_8 OR p.stato_prenotazione != '8');
  
  -- Costruisce il range temporale
  v_range := jsonb_build_object(
    'inizio', range_inizio::text,
    'fine', range_fine::text,
    'stagione_apertura', stagione_apertura::text,
    'stagione_chiusura', stagione_chiusura::text
  );
  
  -- Ritorna i risultati
  RETURN QUERY SELECT v_prezzi, v_prenotazioni, v_range;
END;
$$;
