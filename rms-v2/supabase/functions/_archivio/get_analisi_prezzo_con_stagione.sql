-- Nuova versione che usa il campo stagione invece del range calcolato
DROP FUNCTION IF EXISTS get_analisi_prezzo_semplificata(uuid,uuid,uuid,text,boolean);

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
  v_prezzi jsonb;
  v_prenotazioni jsonb;
  v_range jsonb;
  filtro_stagione_info text;
BEGIN
  -- Ottieni dettagli della settimana selezionata
  SELECT ss.inizio, ss.fine, ss.anno, ss.nome 
  INTO settimana_inizio, settimana_fine, settimana_anno, settimana_nome
  FROM settimane_soggiorno ss 
  WHERE ss.id = p_settimana_id;
  
  -- Ottieni info stagione se specificata (solo per info di debug)
  IF p_stagione IS NOT NULL THEN
    SELECT s.apertura::date, s.chiusura::date 
    INTO stagione_apertura, stagione_chiusura
    FROM stagioni s
    WHERE s.hotel_id = p_hotel_id 
    AND s.stagione = p_stagione
    LIMIT 1;
    
    filtro_stagione_info := 'Filtrato per stagione: ' || p_stagione;
  ELSE
    filtro_stagione_info := 'Nessun filtro stagione - tutte le prenotazioni';
  END IF;
  
  RAISE NOTICE 'Filtro applicato: % per settimana %', filtro_stagione_info, settimana_nome;
  
  -- Recupera i prezzi (invariato)
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
  
  -- ✅ NUOVA LOGICA: Usa campo stagione invece di range temporale
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'data_prenotazione', p.data_prenotazione::text,
        'numero_prenotazioni', 1,
        'fatturato', p.totale_soggiorno,
        'stato_prenotazione', p.stato_prenotazione,
        'arrivo', p.arrivo::text,
        'partenza', p.partenza::text,
        'stagione', p.stagione
      )
    ),
    '[]'::jsonb
  ) INTO v_prenotazioni
  FROM prenotazioni p
  WHERE p.id_hotel = p_hotel_id
  AND p.camera_id = p_camera_id
  AND p.data_prenotazione IS NOT NULL
  -- ✅ FILTRO PRINCIPALE: Usa campo stagione se specificato
  AND (p_stagione IS NULL OR p.stagione = p_stagione)
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
  
  -- Costruisce il range temporale (ora più informativo)
  v_range := jsonb_build_object(
    'metodo_filtro', 'campo_stagione',
    'stagione_richiesta', COALESCE(p_stagione, 'tutte'),
    'stagione_apertura', COALESCE(stagione_apertura::text, 'N/A'),
    'stagione_chiusura', COALESCE(stagione_chiusura::text, 'N/A'),
    'settimana_anno', settimana_anno,
    'settimana_nome', settimana_nome,
    'filtro_applicato', filtro_stagione_info,
    'note', 'Usa campo stagione delle prenotazioni - nessun limite temporale artificiale'
  );
  
  -- Ritorna i risultati
  RETURN QUERY SELECT v_prezzi, v_prenotazioni, v_range;
END;
$$;
