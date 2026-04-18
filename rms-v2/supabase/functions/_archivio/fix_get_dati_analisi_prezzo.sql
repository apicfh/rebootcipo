-- Versione corretta che risolve il problema di popolamento incompleto
CREATE OR REPLACE FUNCTION get_dati_analisi_prezzo_fixed_v2(
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
  
  -- Log per debug
  RAISE NOTICE 'Parametri: hotel=%, camera=%, settimana=% (%), stagione=%', 
    p_hotel_id, p_camera_id, settimana_nome, p_settimana_id, p_stagione;
  
  RETURN QUERY
  SELECT 
    -- ✅ PREZZI: Query semplificata e corretta
    (SELECT json_agg(
      json_build_object(
        'data', pf.valido_da::text,
        'prezzo', pf.prezzo::numeric,
        'valido_da', pf.valido_da::text,
        'valido_a', COALESCE(pf.valido_a, '2025-09-30'::date)::text,
        'stagione', pf.stagione,
        'nome_camera', pf.nome_camera,
        'settimana_id', pf.settimana::text
      ) ORDER BY pf.valido_da
    ) FROM prezzi_finale pf 
    WHERE pf.id_hotel = p_hotel_id 
      AND pf.camera_id = p_camera_id 
      AND pf.settimana = p_settimana_id
      AND (p_stagione IS NULL OR pf.stagione ILIKE p_stagione)
      -- ✅ FILTRO AGGIUNTIVO: Solo prezzi che coprono il periodo attuale
      AND pf.valido_da <= CURRENT_DATE
      AND (pf.valido_a IS NULL OR pf.valido_a >= CURRENT_DATE)
    ) as prezzi,
    
    -- ✅ PRENOTAZIONI: Logica semplificata per soggiorno che interseca settimana
    (SELECT json_agg(
      json_build_object(
        'settimana_prenotazione', data_settimana::text,
        'numero_prenotazioni', num_prenotazioni::integer,
        'fatturato_totale', fatturato_totale::numeric,
        'anno_prenotazione', anno_prenotazione::integer
      ) ORDER BY data_settimana
    ) FROM (
      SELECT 
        DATE_TRUNC('week', p.data_prenotazione)::date as data_settimana,
        EXTRACT(YEAR FROM p.data_prenotazione)::integer as anno_prenotazione,
        COUNT(*) as num_prenotazioni,
        SUM(p.totale_soggiorno) as fatturato_totale
      FROM prenotazioni p
      WHERE p.id_hotel = p_hotel_id
        AND p.camera_id = p_camera_id
        AND p.data_prenotazione IS NOT NULL
        AND p.arrivo IS NOT NULL 
        AND p.partenza IS NOT NULL
        -- ✅ LOGICA CORRETTA: Soggiorno interseca settimana selezionata
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
        -- Filtro anno: solo prenotazioni per soggiorni nell'anno della settimana
        AND EXTRACT(YEAR FROM p.arrivo) = settimana_anno
      GROUP BY 
        DATE_TRUNC('week', p.data_prenotazione), 
        EXTRACT(YEAR FROM p.data_prenotazione)
    ) sub) as prenotazioni;
END;
$$;

-- Concedi i permessi
GRANT EXECUTE ON FUNCTION get_dati_analisi_prezzo_fixed_v2 TO authenticated;
GRANT EXECUTE ON FUNCTION get_dati_analisi_prezzo_fixed_v2 TO anon;
