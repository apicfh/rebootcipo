CREATE OR REPLACE FUNCTION delete_opzione_2026(p_id bigint)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM "opzioni 2026" WHERE id = p_id;
  RETURN FOUND;
END;
$$;
