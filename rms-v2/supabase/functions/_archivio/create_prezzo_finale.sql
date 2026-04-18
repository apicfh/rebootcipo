-- Elimino la funzione esistente
DROP FUNCTION IF EXISTS create_prezzo_finale(uuid, text, uuid, text, numeric);
DROP FUNCTION IF EXISTS create_prezzo_finale(uuid, text, uuid, text, numeric, uuid);

-- Ricreo la funzione con la struttura corretta della tabella
CREATE OR REPLACE FUNCTION create_prezzo_finale(
  id_hotel_param uuid,
  stagione_param text,
  camera_id_param uuid,
  nome_camera_param text,
  prezzo_param numeric,
  settimana_id_param uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id uuid;
BEGIN
  -- Log per debug
  RAISE NOTICE 'Creazione prezzo per hotel: %, camera: %, prezzo: %, settimana: %', 
    id_hotel_param, camera_id_param, prezzo_param, settimana_id_param;

  -- Verifica che l'hotel esista
  IF NOT EXISTS (SELECT 1 FROM hotel WHERE id = id_hotel_param) THEN
    RAISE EXCEPTION 'Hotel con ID % non trovato', id_hotel_param;
  END IF;
  
  -- Verifica che la camera esista e appartenga all'hotel
  IF NOT EXISTS (
    SELECT 1 FROM tipi_camere 
    WHERE id = camera_id_param AND id_hotel = id_hotel_param
  ) THEN
    RAISE EXCEPTION 'Tipo camera con ID % non trovato o non appartiene all''hotel %', 
      camera_id_param, id_hotel_param;
  END IF;
  
  -- Verifica che la settimana esista
  IF NOT EXISTS (SELECT 1 FROM settimane_soggiorno WHERE id = settimana_id_param) THEN
    RAISE EXCEPTION 'Settimana con ID % non trovata', settimana_id_param;
  END IF;
  
  -- Verifica che il prezzo sia valido
  IF prezzo_param <= 0 THEN
    RAISE EXCEPTION 'Il prezzo deve essere maggiore di zero, ricevuto: %', prezzo_param;
  END IF;
  
  -- Inserisce il nuovo prezzo con la struttura corretta della tabella
  INSERT INTO prezzi_finale (
    id_hotel,
    stagione,
    camera_id,
    nome_camera,
    prezzo,
    valido_da,
    valido_a,
    settimana
  ) VALUES (
    id_hotel_param,
    stagione_param,
    camera_id_param,
    nome_camera_param,
    prezzo_param,
    CURRENT_DATE + INTERVAL '1 day', -- domani
    NULL, -- viene gestito dal trigger se esiste
    settimana_id_param -- nuovo campo settimana
  )
  RETURNING id INTO new_id;
  
  RAISE NOTICE 'Prezzo creato con successo, ID: %', new_id;
  
  RETURN new_id;
END;
$$;

-- Concedi i permessi necessari
GRANT EXECUTE ON FUNCTION create_prezzo_finale TO authenticated;
GRANT EXECUTE ON FUNCTION create_prezzo_finale TO anon;
