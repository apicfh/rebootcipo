CREATE OR REPLACE FUNCTION public.crea_utente(
  p_username TEXT,
  p_password TEXT,
  p_ruolo TEXT DEFAULT 'user'
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  user_id UUID
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verifica se l'estensione pgcrypto è installata
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
    RETURN QUERY SELECT 
      false, 
      'Errore: estensione pgcrypto non installata. Esegui: CREATE EXTENSION pgcrypto;'::TEXT, 
      NULL::UUID;
    RETURN;
  END IF;

  -- Verifica se l'utente esiste già
  IF EXISTS (SELECT 1 FROM accessicipolla WHERE accessicipolla.username = p_username) THEN
    RETURN QUERY SELECT 
      false, 
      'Utente già esistente'::TEXT, 
      NULL::UUID;
    RETURN;
  END IF;
  
  -- Inserisci il nuovo utente con password crittografata
  INSERT INTO accessicipolla (
    username,
    password_hash,
    ruolo,
    attivo,
    creato_il
  ) VALUES (
    p_username,
    crypt(p_password, gen_salt('bf')),
    p_ruolo,
    true,
    NOW()
  ) RETURNING id INTO v_user_id;
  
  -- Restituisci successo
  RETURN QUERY SELECT 
    true, 
    'Utente creato con successo'::TEXT, 
    v_user_id;
END;
$$;
