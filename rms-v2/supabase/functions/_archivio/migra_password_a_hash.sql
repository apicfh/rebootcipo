CREATE OR REPLACE FUNCTION public.migra_password_a_hash()
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_count INTEGER := 0;
  v_user RECORD;
BEGIN
  -- Verifica se l'estensione pgcrypto è installata
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
    RETURN 'Errore: estensione pgcrypto non installata. Esegui: CREATE EXTENSION pgcrypto;';
  END IF;

  -- Itera su tutti gli utenti e aggiorna le password
  FOR v_user IN SELECT id, username, password_hash FROM accessicipolla LOOP
    -- Verifica se la password è già un hash (gli hash bcrypt iniziano con $2a$ o $2b$)
    IF v_user.password_hash NOT LIKE '$2a$%' AND v_user.password_hash NOT LIKE '$2b$%' THEN
      -- Aggiorna la password con un hash bcrypt
      UPDATE accessicipolla
      SET password_hash = crypt(password_hash, gen_salt('bf'))
      WHERE id = v_user.id;
      
      v_count := v_count + 1;
    END IF;
  END LOOP;
  
  RETURN 'Migrazione completata. ' || v_count || ' password aggiornate a hash sicuri.';
END;
$$;
