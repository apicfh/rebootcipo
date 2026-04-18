-- Funzione RPC corretta per ottenere i dati dell'analisi prezzi
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
BEGIN
  RETURN QUERY
  SELECT 
    -- Prezzi nel tempo per la combinazione hotel/camera/settimana/stagione
    (SELECT json_agg(
      json_build_object(
        'data', pf.valido_da::text,
        'prezzo', pf.prezzo::numeric,
        'valido_da', pf.valido_da::text,
        'valido_a', COALESCE(pf.valido_a::text, '2025-09-30'),
        'stagione', pf.stagione,
        'nome_camera', pf.nome_camera,
        'settimana_nome', pf.settimana_nome
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
        'settimana_prenotazione', DATE_TRUNC('week', p.data_prenotazione)::date::text,
        'numero_prenotazioni', COUNT(*)::integer,
        'fatturato_totale', SUM(p.totale_soggiorno)::numeric,
        'anno_prenotazione', EXTRACT(YEAR FROM p.data_prenotazione)::integer
      ) ORDER BY DATE_TRUNC('week', p.data_prenotazione)
    ) FROM (
      SELECT 
        p.data_prenotazione,
        p.totale_soggiorno
      FROM prenotazioni p
      INNER JOIN settimane_soggiorno ss ON ss.id = p_settimana_id
      WHERE p.id_hotel = p_hotel_id
        AND p.camera_id = p_camera_id
        AND p.data_prenotazione IS NOT NULL
        AND p.settimane IS NOT NULL
        AND ss.nome = ANY(p.settimane)
        AND EXTRACT(YEAR FROM p.arrivo) = ss.anno
      GROUP BY p.data_prenotazione, p.totale_soggiorno
    ) sub
    GROUP BY DATE_TRUNC('week', sub.data_prenotazione)
    ) as prenotazioni;
END;
$$;
