-- RPC: studiorevenue_recupera_prenotazioni_card
-- Recupera TUTTI i campi della tabella prenotazioni con filtri su hotel e cancellazioni
-- Parametri:
--   p_hotel_id: UUID dell'hotel (NULL = tutti gli hotel)
--   p_includi_cancellazioni: boolean (true = includi cancellazioni, false = escludi stato_prenotazione = '8')
-- Restituisce: TUTTI i 29 campi della tabella prenotazioni

CREATE OR REPLACE FUNCTION studiorevenue_recupera_prenotazioni_card(
  p_hotel_id uuid DEFAULT NULL,
  p_includi_cancellazioni boolean DEFAULT FALSE
)
RETURNS TABLE (
  id uuid,
  oid_pms integer,
  id_hotel uuid,
  id_cliente uuid,
  arrivo date,
  partenza date,
  totale_soggiorno numeric,
  stato_prenotazione text,
  notti integer,
  oid_cliente integer,
  tipo_camera text,
  "motivoCancellazione" text,
  pax integer,
  codice_prenotazione text,
  adr_soggiorno numeric,
  booking_window integer,
  motivo_cancellazione text,
  data_prenotazione date,
  camera_id uuid,
  caparra numeric,
  cliente_nome text,
  cliente_cognome text,
  cliente_email text,
  cliente_telefono text,
  cliente_cellulare text,
  hotel_nome text,
  settimane text[],
  stagione text,
  stagione_tariffa uuid
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.oid_pms,
    p.id_hotel,
    p.id_cliente,
    p.arrivo,
    p.partenza,
    p.totale_soggiorno,
    p.stato_prenotazione,
    p.notti,
    p.oid_cliente,
    p.tipo_camera,
    p."motivoCancellazione",
    p.pax,
    p.codice_prenotazione,
    p.adr_soggiorno,
    p.booking_window,
    p.motivo_cancellazione,
    p.data_prenotazione,
    p.camera_id,
    p.caparra,
    p.cliente_nome,
    p.cliente_cognome,
    p.cliente_email,
    p.cliente_telefono,
    p.cliente_cellulare,
    p.hotel_nome,
    p.settimane,
    p.stagione,
    p.stagione_tariffa
  FROM prenotazioni p
  WHERE
    (p_hotel_id IS NULL OR p.id_hotel = p_hotel_id)
    AND (p_includi_cancellazioni = TRUE OR p.stato_prenotazione::text != '8')
  ORDER BY p.data_prenotazione DESC
  LIMIT 1000000;
END;
$$ LANGUAGE plpgsql;
