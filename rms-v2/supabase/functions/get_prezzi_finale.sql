-- Funzione per recuperare i prezzi finali con dettagli
CREATE OR REPLACE FUNCTION get_prezzi_finale(
  hotel_id_param uuid DEFAULT NULL,
  stagione_param text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  id_hotel uuid,
  nome_hotel text,
  stagione text,
  camera_id uuid,
  nome_camera text,
  prezzo numeric,
  valido_da date,
  valido_a date,
  settimana_id uuid,
  settimana_nome text,
  settimana_inizio date,
  settimana_fine date
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pf.id,
    pf.id_hotel,
    h.nome as nome_hotel,
    pf.stagione,
    pf.camera_id,
    pf.nome_camera,
    pf.prezzo,
    pf.valido_da,
    pf.valido_a,
    pf.settimana as settimana_id,
    ss.nome as settimana_nome,
    ss.inizio as settimana_inizio,
    ss.fine as settimana_fine
  FROM prezzi_finale pf
  LEFT JOIN hotel h ON pf.id_hotel = h.id
  LEFT JOIN settimane_soggiorno ss ON pf.settimana = ss.id
  WHERE 
    (hotel_id_param IS NULL OR pf.id_hotel = hotel_id_param)
    AND (stagione_param IS NULL OR pf.stagione = stagione_param)
  ORDER BY 
    h.nome, 
    pf.stagione, 
    ss.inizio, 
    pf.nome_camera;
END;
$$;

-- Concedi i permessi
GRANT EXECUTE ON FUNCTION get_prezzi_finale TO authenticated;
GRANT EXECUTE ON FUNCTION get_prezzi_finale TO anon;
