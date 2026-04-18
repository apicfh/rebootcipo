-- Funzione RPC per ottenere i dati della Falza Challenge
CREATE OR REPLACE FUNCTION get_falza_challenge(
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  nome_hotel TEXT,
  id_hotel UUID,
  mese NUMERIC,
  giorno NUMERIC,
  data_formato TEXT,
  prenotazioni_2024 BIGINT,
  prenotazioni_2025 BIGINT,
  differenza BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fc.nome_hotel,
    fc.id_hotel,
    fc.mese,
    fc.giorno,
    fc.data_formato,
    fc.prenotazioni_2024,
    fc.prenotazioni_2025,
    fc.differenza
  FROM 
    falza_challenge fc
  WHERE 
    fc.mese = EXTRACT(MONTH FROM p_date)
    AND fc.giorno = EXTRACT(DAY FROM p_date);
END;
$$ LANGUAGE plpgsql;

-- Funzione RPC per ottenere i dati della Falza Challenge per un hotel specifico
CREATE OR REPLACE FUNCTION get_falza_challenge_by_hotel(
  p_hotel_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  nome_hotel TEXT,
  id_hotel UUID,
  mese NUMERIC,
  giorno NUMERIC,
  data_formato TEXT,
  prenotazioni_2024 BIGINT,
  prenotazioni_2025 BIGINT,
  differenza BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fc.nome_hotel,
    fc.id_hotel,
    fc.mese,
    fc.giorno,
    fc.data_formato,
    fc.prenotazioni_2024,
    fc.prenotazioni_2025,
    fc.differenza
  FROM 
    falza_challenge fc
  WHERE 
    fc.id_hotel = p_hotel_id
    AND fc.mese = EXTRACT(MONTH FROM p_date)
    AND fc.giorno = EXTRACT(DAY FROM p_date);
END;
$$ LANGUAGE plpgsql;
