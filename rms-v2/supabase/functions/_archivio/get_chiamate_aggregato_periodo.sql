-- Funzione RPC per recuperare i dati aggregati delle telefonate per periodo
CREATE OR REPLACE FUNCTION get_chiamate_aggregato_periodo(
  data_inizio date,
  data_fine date,
  p_descrizione text DEFAULT NULL
)
RETURNS TABLE (
  data date,
  descrizione text,
  chiamate_ricevute integer,
  chiamate_risposte integer,
  chiamate_non_risposte integer,
  chiamate_timeout integer,
  attesa_media numeric,
  durata_media numeric,
  percentuale_risposta numeric
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.data,
    r.descrizione,
    r.chiamate_ricevute,
    r.chiamate_risposte,
    r.chiamate_non_risposte,
    r.chiamate_timeout,
    r.attesa_media,
    r.durata_media,
    CASE 
      WHEN r.chiamate_ricevute > 0 
      THEN ROUND((r.chiamate_risposte::numeric / r.chiamate_ricevute::numeric) * 100, 2)
      ELSE 0
    END as percentuale_risposta
  FROM report_code_aggregato r
  WHERE r.data >= data_inizio 
    AND r.data <= data_fine
    AND (p_descrizione IS NULL OR r.descrizione = p_descrizione)
  ORDER BY r.data DESC, r.descrizione;
END;
$$;

-- Funzione per recuperare le descrizioni disponibili (per il filtro)
CREATE OR REPLACE FUNCTION get_descrizioni_telefonate()
RETURNS TABLE (
  descrizione text
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT r.descrizione
  FROM report_code_aggregato r
  WHERE r.descrizione IS NOT NULL
  ORDER BY r.descrizione;
END;
$$;

-- Verifica creazione funzioni
SELECT 'Funzioni per telefonate auto create con successo!' as messaggio;
