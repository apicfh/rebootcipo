-- Versione corretta della funzione RPC per analisi prezzi
CREATE OR REPLACE FUNCTION get_dati_analisi_prezzo_fixed(
  p_hotel_id uuid,
  p_camera_id uuid,
  p_settimana_id uuid,
  p_stagione text DEFAULT NULL
)
RETURNS TABLE (
  prezzi json,
  prenotazioni json
) 
LANGUAGE plpgsql
AS $$
DECLARE
  settimana_inizio date;
  settimana_fine date;
  settimana_anno integer;
  settimana_nome text;
BEGIN
  -- Ottieni dettagli della settimana selezionata
  SELECT ss.inizio, ss.fine, ss.anno, ss.nome 
  INTO settimana_inizio, settimana_fine, settimana_anno, settimana_nome
  FROM settimane_soggiorno ss 
  WHERE ss.id = p_settimana_id;
  
  -- Debug log
  RAISE NOTICE 'Settimana selezionata: % (% - %) Anno: %', 
    settimana_nome, settimana_inizio, settimana_fine, settimana_anno;
  
  RETURN QUERY
  SELECT 
    -- Prezzi nel tempo per la combinazione hotel/camera/settimana/stagione
    (SELECT json_agg(
      json_build_object(
        'data', pf.valido_da::text,
        'prezzo', pf.prezzo::numeric,
        'valido_da', pf.valido_da::text,
        'valido_a', pf.valido_a::text,
        'stagione', pf.stagione,
        'nome_camera', pf.nome_camera
      ) ORDER BY pf.valido_da
    ) FROM prezzi_finale pf 
    WHERE pf.id_hotel = p_hotel_id 
      AND pf.camera_id = p_camera_id 
      AND pf.settimana = p_settimana_id
      AND (p_stagione IS NULL OR LOWER(pf.stagione) = LOWER(p_stagione))
    ) as prezzi,
    
    -- ✅ LOGICA CORRETTA: Prenotazioni con soggiorno che interseca la settimana
    (SELECT json_agg(
      json_build_object(
        'settimana_prenotazione', data_settimana::text,
        'numero_prenotazioni', num_prenotazioni::integer,
        'fatturato_totale', fatturato_totale::numeric,
        'anno_prenotazione', anno_prenotazione::integer,
        'periodo_soggiorno', periodo_soggiorno::text
      ) ORDER BY data_settimana
    ) FROM (
      SELECT 
        DATE_TRUNC('week', p.data_prenotazione)::date as data_settimana,
        EXTRACT(YEAR FROM p.data_prenotazione)::integer as anno_prenotazione,
        COUNT(*) as num_prenotazioni,
        SUM(p.totale_soggiorno) as fatturato_totale,
        CONCAT(MIN(p.arrivo)::text, ' - ', MAX(p.partenza)::text) as periodo_soggiorno
      FROM prenotazioni p
      WHERE p.id_hotel = p_hotel_id
        AND p.camera_id = p_camera_id
        AND p.data_prenotazione IS NOT NULL
        AND p.arrivo IS NOT NULL 
        AND p.partenza IS NOT NULL
        -- ✅ LOGICA SEMPLIFICATA: Soggiorno interseca settimana selezionata
        AND (
          -- Caso 1: Arrivo nella settimana
          (p.arrivo BETWEEN settimana_inizio AND settimana_fine)
          OR
          -- Caso 2: Partenza nella settimana  
          (p.partenza BETWEEN settimana_inizio AND settimana_fine)
          OR
          -- Caso 3: Soggiorno comprende tutta la settimana
          (p.arrivo <= settimana_inizio AND p.partenza >= settimana_fine)
        )
        -- Filtro aggiuntivo: solo prenotazioni dello stesso anno
        AND EXTRACT(YEAR FROM p.arrivo) = settimana_anno
      GROUP BY 
        DATE_TRUNC('week', p.data_prenotazione), 
        EXTRACT(YEAR FROM p.data_prenotazione)
    ) sub) as prenotazioni;
END;
$$;
