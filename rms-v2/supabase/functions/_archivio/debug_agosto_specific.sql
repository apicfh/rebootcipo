-- Debug specifico per I Agosto con tutti i dettagli
CREATE OR REPLACE FUNCTION debug_agosto_specific()
RETURNS TABLE (
  debug_type text,
  info json
) 
LANGUAGE plpgsql
AS $$
BEGIN
  -- 1. Verifica esistenza settimana "I Agosto"
  RETURN QUERY
  SELECT 
    'settimane_agosto'::text as debug_type,
    json_agg(
      json_build_object(
        'id', ss.id,
        'nome', ss.nome,
        'inizio', ss.inizio,
        'fine', ss.fine,
        'anno', ss.anno
      )
    ) as info
  FROM settimane_soggiorno ss
  WHERE LOWER(ss.nome) LIKE '%agosto%'
    AND ss.anno IN (2024, 2025);

  -- 2. Verifica Family Room disponibili
  RETURN QUERY
  SELECT 
    'family_rooms'::text as debug_type,
    json_agg(
      json_build_object(
        'hotel_id', h.id,
        'hotel_nome', h.nome,
        'camera_id', tc.id,
        'camera_nome', tc.nome,
        'categoria', tc.categoria
      )
    ) as info
  FROM hotel h
  JOIN tipi_camere tc ON tc.id_hotel = h.id
  WHERE tc.nome ILIKE '%family%room%';

  -- 3. Verifica prezzi per I Agosto + Family Room + tosi_2025
  RETURN QUERY
  SELECT 
    'prezzi_agosto_family'::text as debug_type,
    json_agg(
      json_build_object(
        'prezzo_id', pf.id,
        'hotel_nome', h.nome,
        'camera_nome', tc.nome,
        'settimana_nome', ss.nome,
        'stagione', pf.stagione,
        'prezzo', pf.prezzo,
        'valido_da', pf.valido_da,
        'valido_a', pf.valido_a,
        'created_at', pf.created_at
      )
    ) as info
  FROM prezzi_finale pf
  JOIN hotel h ON h.id = pf.id_hotel
  JOIN tipi_camere tc ON tc.id = pf.camera_id
  JOIN settimane_soggiorno ss ON ss.id = pf.settimana
  WHERE LOWER(ss.nome) LIKE '%agosto%'
    AND tc.nome ILIKE '%family%room%'
    AND pf.stagione ILIKE '%tosi_2025%';

  -- 4. Verifica tutti i prezzi Family Room per tosi_2025 (sample)
  RETURN QUERY
  SELECT 
    'sample_prezzi_family_tosi'::text as debug_type,
    json_agg(
      json_build_object(
        'hotel_nome', h.nome,
        'camera_nome', tc.nome,
        'settimana_nome', ss.nome,
        'stagione', pf.stagione,
        'prezzo', pf.prezzo
      )
    ) as info
  FROM prezzi_finale pf
  JOIN hotel h ON h.id = pf.id_hotel
  JOIN tipi_camere tc ON tc.id = pf.camera_id
  JOIN settimane_soggiorno ss ON ss.id = pf.settimana
  WHERE tc.nome ILIKE '%family%room%'
    AND pf.stagione ILIKE '%tosi_2025%'
  LIMIT 10;

END;
$$;

-- Concedi i permessi
GRANT EXECUTE ON FUNCTION debug_agosto_specific TO authenticated;
GRANT EXECUTE ON FUNCTION debug_agosto_specific TO anon;
