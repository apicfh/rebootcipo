-- Funzione per ottenere le prenotazioni raggruppate per mese di arrivo per la dashboard mobile
CREATE OR REPLACE FUNCTION get_prenotazioni_per_mese_mobile(
  p_start_date DATE,
  p_end_date DATE,
  p_hotel_id TEXT DEFAULT NULL,
  p_alta_stagione BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  mese INTEGER,
  nome_mese TEXT,
  numero_prenotazioni BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXTRACT(MONTH FROM p.arrivo)::INTEGER AS mese,
    CASE 
      WHEN EXTRACT(MONTH FROM p.arrivo) = 5 THEN 'Maggio'
      WHEN EXTRACT(MONTH FROM p.arrivo) = 6 THEN 'Giugno'
      WHEN EXTRACT(MONTH FROM p.arrivo) = 7 THEN 'Luglio'
      WHEN EXTRACT(MONTH FROM p.arrivo) = 8 THEN 'Agosto'
      WHEN EXTRACT(MONTH FROM p.arrivo) = 9 THEN 'Settembre'
      ELSE 'Altro'
    END AS nome_mese,
    COUNT(p.id)::BIGINT AS numero_prenotazioni
  FROM 
    prenotazioni p
  WHERE 
    p.data_prenotazione >= p_start_date
    AND p.data_prenotazione <= p_end_date
    AND (
      p_hotel_id IS NULL 
      OR p_hotel_id = 'tutti' 
      OR p.id_hotel = p_hotel_id::UUID
    )
    AND EXTRACT(MONTH FROM p.arrivo) BETWEEN 5 AND 9
    AND (
      NOT p_alta_stagione 
      OR (
        p.arrivo >= (EXTRACT(YEAR FROM CURRENT_DATE)::TEXT || '-05-17')::DATE
        AND p.partenza <= (EXTRACT(YEAR FROM CURRENT_DATE)::TEXT || '-09-12')::DATE
      )
    )
  GROUP BY 
    mese, nome_mese
  ORDER BY 
    mese;
END;
$$;
