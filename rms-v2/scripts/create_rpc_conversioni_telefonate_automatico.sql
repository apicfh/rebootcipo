CREATE OR REPLACE FUNCTION rpc_conversioni_catia_telefonate_automatico(
  data_inizio DATE,
  data_fine DATE
)
RETURNS TABLE (
  id UUID,
  "Chiamante" TEXT,
  "Agente" TEXT,
  "Data/Ora Inizio" TEXT,
  "Durata (sec)" INT,
  "Stato" TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ta.id,
    ta."Chiamante",
    ta."Agente",
    ta."Data/Ora Inizio"::TEXT,
    ta."Durata (sec)",
    ta."Stato"
  FROM telefonate_automatico ta
  WHERE ta."Data/Ora Inizio"::DATE >= data_inizio
    AND ta."Data/Ora Inizio"::DATE <= data_fine
    AND ta."Stato" = 'ANSWER'
  ORDER BY ta."Data/Ora Inizio" DESC;
END;
$$ LANGUAGE plpgsql;
