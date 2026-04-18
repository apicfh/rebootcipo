-- Funzione di debug per capire perché non vediamo i prezzi
CREATE OR REPLACE FUNCTION debug_analisi_prezzo(
  p_hotel_id uuid,
  p_camera_id uuid,
  p_settimana_id uuid,
  p_stagione text DEFAULT NULL
)
RETURNS TABLE (
  step text,
  count_result integer,
  sample_data json
) 
LANGUAGE plpgsql
AS $$
BEGIN
  -- Step 1: Verifica se esistono prezzi per questo hotel
  RETURN QUERY
  SELECT 
    'Step 1: Prezzi per hotel'::text,
    COUNT(*)::integer,
    json_agg(json_build_object('id_hotel', pf.id_hotel, 'camera_id', pf.camera_id, 'settimana', pf.settimana, 'stagione', pf.stagione))
  FROM prezzi_finale pf 
  WHERE pf.id_hotel = p_hotel_id
  LIMIT 5;

  -- Step 2: Verifica se esistono prezzi per questa camera
  RETURN QUERY
  SELECT 
    'Step 2: Prezzi per camera'::text,
    COUNT(*)::integer,
    json_agg(json_build_object('camera_id', pf.camera_id, 'nome_camera', pf.nome_camera, 'prezzo', pf.prezzo))
  FROM prezzi_finale pf 
  WHERE pf.id_hotel = p_hotel_id 
    AND pf.camera_id = p_camera_id
  LIMIT 5;

  -- Step 3: Verifica se esistono prezzi per questa settimana
  RETURN QUERY
  SELECT 
    'Step 3: Prezzi per settimana'::text,
    COUNT(*)::integer,
    json_agg(json_build_object('settimana', pf.settimana, 'valido_da', pf.valido_da, 'prezzo', pf.prezzo))
  FROM prezzi_finale pf 
  WHERE pf.id_hotel = p_hotel_id 
    AND pf.camera_id = p_camera_id
    AND pf.settimana = p_settimana_id
  LIMIT 5;

  -- Step 4: Verifica se esistono prezzi per questa stagione
  RETURN QUERY
  SELECT 
    'Step 4: Prezzi per stagione'::text,
    COUNT(*)::integer,
    json_agg(json_build_object('stagione', pf.stagione, 'prezzo', pf.prezzo))
  FROM prezzi_finale pf 
  WHERE pf.id_hotel = p_hotel_id 
    AND pf.camera_id = p_camera_id
    AND pf.settimana = p_settimana_id
    AND (p_stagione IS NULL OR pf.stagione = p_stagione)
  LIMIT 5;

  -- Step 5: Mostra i parametri ricevuti
  RETURN QUERY
  SELECT 
    'Step 5: Parametri ricevuti'::text,
    1::integer,
    json_build_object(
      'p_hotel_id', p_hotel_id,
      'p_camera_id', p_camera_id, 
      'p_settimana_id', p_settimana_id,
      'p_stagione', p_stagione
    );

  -- Step 6: Mostra tutte le stagioni disponibili per questo hotel
  RETURN QUERY
  SELECT 
    'Step 6: Stagioni disponibili'::text,
    COUNT(*)::integer,
    json_agg(DISTINCT pf.stagione)
  FROM prezzi_finale pf 
  WHERE pf.id_hotel = p_hotel_id;

  -- Step 7: Mostra tutte le settimane disponibili per questo hotel/camera
  RETURN QUERY
  SELECT 
    'Step 7: Settimane disponibili'::text,
    COUNT(*)::integer,
    json_agg(DISTINCT pf.settimana)
  FROM prezzi_finale pf 
  WHERE pf.id_hotel = p_hotel_id 
    AND pf.camera_id = p_camera_id;

END;
$$;
