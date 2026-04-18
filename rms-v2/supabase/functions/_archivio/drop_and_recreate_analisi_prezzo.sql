-- Prima elimina la funzione esistente
DROP FUNCTION IF EXISTS get_dati_analisi_prezzo(uuid, uuid, uuid, text);

-- Poi ricrea la funzione con la struttura originale ma logica corretta
CREATE OR REPLACE FUNCTION get_dati_analisi_prezzo(
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
  settimana_nome text;
  settimana_anno integer;
BEGIN
  -- Ottieni nome e anno della settimana selezionata
  SELECT ss.nome, ss.anno 
  INTO settimana_nome, settimana_anno
  FROM settimane_soggiorno ss 
  WHERE ss.id = p_settimana_id;
  
  RETURN QUERY
  SELECT 
    -- Prezzi per la combinazione hotel/camera/settimana/stagione
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
      AND (p_stagione IS NULL OR pf.stagione ILIKE p_stagione)
    ) as prezzi,
    
    -- Prenotazioni che coinvolgono la settimana selezionata
    (SELECT json_agg(
      json_build_object(
        'settimana_prenotazione', data_settimana::text,
        'numero_prenotazioni', num_prenotazioni::integer,
        'fatturato_totale', fatturato_totale::numeric,
        'anno_prenotazione', anno_prenotazione::integer
      ) ORDER BY data_settimana
    ) FROM (
      SELECT 
        DATE_TRUNC('week', pr.data_prenotazione)::date as data_settimana,
        EXTRACT(YEAR FROM pr.data_prenotazione)::integer as anno_prenotazione,
        COUNT(*) as num_prenotazioni,
        SUM(pr.totale_soggiorno) as fatturato_totale
      FROM prenotazioni pr
      WHERE pr.id_hotel = p_hotel_id
        AND pr.camera_id = p_camera_id
        AND pr.data_prenotazione IS NOT NULL
        AND settimana_nome = ANY(pr.settimane)
        AND EXTRACT(YEAR FROM pr.arrivo) = settimana_anno
      GROUP BY DATE_TRUNC('week', pr.data_prenotazione), EXTRACT(YEAR FROM pr.data_prenotazione)
    ) sub) as prenotazioni;
END;
$$;
