CREATE OR REPLACE FUNCTION update_opzione_2026(
  p_id bigint,
  p_id_hotel uuid,
  p_nome text,
  p_cellulare text,
  p_email text,
  p_note text
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE "opzioni 2026"
  SET 
    id_hotel = p_id_hotel,
    nome = p_nome,
    cellulare = p_cellulare,
    email = p_email,
    note = p_note
  WHERE id = p_id;
  
  RETURN FOUND;
END;
$$;
