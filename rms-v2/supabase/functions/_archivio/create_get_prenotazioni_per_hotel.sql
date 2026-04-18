-- Funzione per ottenere le prenotazioni raggruppate per hotel
CREATE OR REPLACE FUNCTION get_prenotazioni_per_hotel(
  p_start_date DATE,
  p_end_date DATE,
  p_alta_stagione BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  id TEXT,
  nome TEXT,
  numero_prenotazioni BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.id::TEXT, 
    h.nome, 
    COUNT(p.id)::BIGINT AS numero_prenotazioni
  FROM 
    prenotazioni p
  JOIN 
    hotel h ON p.id_hotel = h.id
  WHERE 
    p.data_prenotazione >= p_start_date
    AND p.data_prenotazione <= p_end_date
    AND (
      NOT p_alta_stagione 
      OR (
        p.arrivo >= (EXTRACT(YEAR FROM CURRENT_DATE)::TEXT || '-05-17')::DATE
        AND p.partenza <= (EXTRACT(YEAR FROM CURRENT_DATE)::TEXT || '-09-12')::DATE
      )
    )
  GROUP BY 
    h.id, h.nome
  ORDER BY 
    numero_prenotazioni DESC;
END;
$$;
