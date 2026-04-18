-- Funzione definitiva per comparazione prezzi con struttura corretta
CREATE OR REPLACE FUNCTION get_prezzi_finale_comparazione_definitiva(
  data_arrivo_param date,
  data_partenza_param date
)
RETURNS TABLE (
  id_hotel uuid,
  nome_hotel text,
  camera_id uuid,
  nome_camera text,
  prezzo_totale numeric,
  notti_totali integer,
  dettaglio_settimane jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notti_soggiorno integer;
BEGIN
  -- Calcola il numero totale di notti
  notti_soggiorno := data_partenza_param - data_arrivo_param;
  
  RETURN QUERY
  WITH settimane_coinvolte AS (
    -- Step 1: Identifica le settimane coinvolte dal soggiorno
    SELECT 
      ss.id as settimana_id,
      ss.nome as settimana_nome,
      ss.inizio,
      ss.fine,
      -- Calcola le notti effettive in questa settimana per il soggiorno
      CASE 
        WHEN data_arrivo_param >= ss.inizio AND data_partenza_param <= ss.fine THEN
          -- Caso A: soggiorno completamente dentro una settimana
          notti_soggiorno
        ELSE
          -- Caso B: soggiorno attraversa più settimane, calcola notti in questa settimana
          LEAST(ss.fine, data_partenza_param) - GREATEST(ss.inizio, data_arrivo_param)
      END as notti_in_settimana
    FROM settimane_soggiorno ss
    WHERE ss.inizio < data_partenza_param 
      AND ss.fine > data_arrivo_param
  ),
  prezzi_per_settimana AS (
    -- Step 2: Per ogni camera e settimana, prende il prezzo con valido_da maggiore
    SELECT DISTINCT ON (pf.id_hotel, pf.camera_id, sc.settimana_id)
      pf.id_hotel,
      h.nome as nome_hotel,
      pf.camera_id,
      pf.nome_camera,
      pf.prezzo,
      sc.settimana_id,
      sc.settimana_nome,
      sc.notti_in_settimana,
      pf.valido_da
    FROM settimane_coinvolte sc
    JOIN prezzi_finale pf ON pf.settimana = sc.settimana_id
    LEFT JOIN hotel h ON pf.id_hotel = h.id
    WHERE pf.valido_da <= data_partenza_param
      AND (pf.valido_a IS NULL OR pf.valido_a >= data_arrivo_param)
    ORDER BY pf.id_hotel, pf.camera_id, sc.settimana_id, pf.valido_da DESC
  ),
  prezzi_aggregati AS (
    -- Step 3: Aggrega i prezzi per hotel e camera
    SELECT 
      pps.id_hotel,
      pps.nome_hotel,
      pps.camera_id,
      pps.nome_camera,
      SUM(pps.prezzo * pps.notti_in_settimana) as prezzo_totale,
      SUM(pps.notti_in_settimana) as notti_totali,
      jsonb_agg(
        jsonb_build_object(
          'settimana', pps.settimana_nome,
          'prezzo_notte', pps.prezzo,
          'notti', pps.notti_in_settimana,
          'subtotale', pps.prezzo * pps.notti_in_settimana
        )
      ) as dettaglio_settimane
    FROM prezzi_per_settimana pps
    GROUP BY pps.id_hotel, pps.nome_hotel, pps.camera_id, pps.nome_camera
  )
  SELECT * FROM prezzi_aggregati
  ORDER BY nome_hotel, nome_camera;
END;
$$;

-- Concedi i permessi
GRANT EXECUTE ON FUNCTION get_prezzi_finale_comparazione_definitiva TO authenticated;
GRANT EXECUTE ON FUNCTION get_prezzi_finale_comparazione_definitiva TO anon;
