-- Droppiamo la funzione esistente per evitare conflitti
DROP FUNCTION IF EXISTS get_hotel_prenotazioni_inserite(date, date);

-- Creiamo la funzione corretta che mantiene la struttura originale della view
CREATE OR REPLACE FUNCTION get_hotel_prenotazioni_inserite(data_inizio date, data_fine date)
RETURNS TABLE (
  hotel_nome text,
  data_prenotazione date,
  prenotazioni_inserite bigint
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.hotel_nome,
    v.data_prenotazione,
    v.prenotazioni_inserite
  FROM 
    v_hotel_prenotazioni_inserite v
  WHERE 
    v.data_prenotazione BETWEEN data_inizio AND data_fine
  ORDER BY 
    v.hotel_nome, v.data_prenotazione;
END;
$$;
