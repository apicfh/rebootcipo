-- Query di verifica per la settimana "I Agosto"
CREATE OR REPLACE FUNCTION check_agosto_prezzi()
RETURNS TABLE (
  settimana_nome text,
  settimana_periodo text,
  hotel_nome text,
  camera_nome text,
  stagione text,
  prezzi_count bigint,
  prezzi_dettagli json,
  copertura_inizio date,
  copertura_fine date
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ss.nome as settimana_nome,
    CONCAT(ss.inizio::text, ' - ', ss.fine::text) as settimana_periodo,
    h.nome as hotel_nome,
    tc.nome as camera_nome,
    pf.stagione,
    COUNT(pf.id) as prezzi_count,
    json_agg(
      json_build_object(
        'prezzo', pf.prezzo,
        'valido_da', pf.valido_da,
        'valido_a', pf.valido_a,
        'created_at', pf.created_at
      ) ORDER BY pf.valido_da
    ) FILTER (WHERE pf.id IS NOT NULL) as prezzi_dettagli,
    MIN(pf.valido_da) as copertura_inizio,
    MAX(pf.valido_a) as copertura_fine
  FROM settimane_soggiorno ss
  LEFT JOIN prezzi_finale pf ON pf.settimana = ss.id
  LEFT JOIN hotel h ON h.id = pf.id_hotel
  LEFT JOIN tipi_camere tc ON tc.id = pf.camera_id
  WHERE LOWER(ss.nome) LIKE '%agosto%'
    AND ss.anno IN (2024, 2025)
    AND (pf.id IS NULL OR (
      tc.nome ILIKE '%family%room%' 
      AND pf.stagione ILIKE '%tosi_2025%'
    ))
  GROUP BY ss.id, ss.nome, ss.inizio, ss.fine, h.nome, tc.nome, pf.stagione
  ORDER BY ss.inizio;
END;
$$;

-- Concedi i permessi
GRANT EXECUTE ON FUNCTION check_agosto_prezzi TO authenticated;
GRANT EXECUTE ON FUNCTION check_agosto_prezzi TO anon;
