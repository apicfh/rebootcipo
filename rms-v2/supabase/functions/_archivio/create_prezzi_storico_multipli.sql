-- Funzione per creare più prezzi storici in una sola chiamata
CREATE OR REPLACE FUNCTION create_prezzi_storico_multipli(
  richieste jsonb
)
RETURNS uuid[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  richiesta jsonb;
  id_hotel_param uuid;
  stagione_param text;
  camera_id_param uuid;
  nome_camera_param text;
  prezzo_param numeric;
  settimana_id_param uuid;
  valido_da_param date;
  valido_a_param date;
  new_id uuid;
  risultati uuid[] := '{}';
BEGIN
  -- Itera su ogni richiesta nell'array JSON
  FOR richiesta IN SELECT * FROM jsonb_array_elements(richieste)
  LOOP
    -- Estrai i parametri dalla richiesta
    id_hotel_param := (richiesta->>'idHotel')::uuid;
    stagione_param := richiesta->>'stagione';
    camera_id_param := (richiesta->>'cameraId')::uuid;
    nome_camera_param := richiesta->>'nomeCamera';
    prezzo_param := (richiesta->>'prezzo')::numeric;
    settimana_id_param := (richiesta->>'settimanaId')::uuid;
    valido_da_param := (richiesta->>'validoDa')::date;
    
    -- Gestisci il campo opzionale validoA
    IF richiesta->>'validoA' IS NOT NULL AND richiesta->>'validoA' != 'null' THEN
      valido_a_param := (richiesta->>'validoA')::date;
    ELSE
      valido_a_param := NULL;
    END IF;

    -- Log per debug
    RAISE NOTICE 'Creazione prezzo storico per hotel: %, camera: %, prezzo: %, settimana: %, valido_da: %, valido_a: %', 
      id_hotel_param, camera_id_param, prezzo_param, settimana_id_param, valido_da_param, valido_a_param;

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
    
    -- Verifica che la data valido_da sia valida
    IF valido_da_param IS NULL THEN
      RAISE EXCEPTION 'La data di validità iniziale è obbligatoria';
    END IF;
    
    -- Verifica che valido_a sia maggiore di valido_da se specificato
    IF valido_a_param IS NOT NULL AND valido_a_param <= valido_da_param THEN
      RAISE EXCEPTION 'La data di fine validità deve essere successiva alla data di inizio validità';
    END IF;
    
    -- Inserisce il nuovo prezzo
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
      valido_da_param,
      valido_a_param,
      settimana_id_param
    )
    RETURNING id INTO new_id;
    
    -- Aggiungi l'ID al array dei risultati
    risultati := risultati || new_id;
    
    RAISE NOTICE 'Prezzo storico creato con successo, ID: %', new_id;
  END LOOP;
  
  RETURN risultati;
END;
$$;

-- Concedi i permessi necessari
GRANT EXECUTE ON FUNCTION create_prezzi_storico_multipli TO authenticated;
GRANT EXECUTE ON FUNCTION create_prezzi_storico_multipli TO anon;
