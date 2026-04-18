-- Modifica il filtro paxmax per corrispondenza esatta invece di maggiore-uguale
DROP FUNCTION IF EXISTS get_prezzi_finale_comparazione_definitiva CASCADE;

CREATE OR REPLACE FUNCTION get_prezzi_finale_comparazione_definitiva(
  data_arrivo_param date,
  data_partenza_param date,
  paxmax_filter integer DEFAULT NULL,
  livello_filter text DEFAULT NULL
)
RETURNS TABLE (
  id_hotel uuid,
  nome_hotel text,
  camera_id uuid,
  nome_camera text,
  paxmax integer,
  livello text,
  prezzo_totale numeric,
  notti_totali bigint,
  dettaglio_settimane jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notti_soggiorno integer;
BEGIN
  notti_soggiorno := data_partenza_param - data_arrivo_param;
  
  RETURN QUERY
  WITH settimane_coinvolte AS (
    SELECT 
      ss.id as settimana_id,
      ss.nome as settimana_nome,
      ss.inizio,
      ss.fine,
      CASE 
        WHEN data_arrivo_param >= ss.inizio AND data_partenza_param <= ss.fine THEN
          notti_soggiorno
        ELSE
          LEAST(ss.fine, data_partenza_param) - GREATEST(ss.inizio, data_arrivo_param)
      END as notti_in_settimana
    FROM settimane_soggiorno ss
    WHERE ss.inizio < data_partenza_param 
      AND ss.fine > data_arrivo_param
  ),
  prezzi_per_settimana AS (
    SELECT DISTINCT ON (pf.id_hotel, pf.camera_id, sc.settimana_id)
      pf.id_hotel,
      h.nome as nome_hotel,
      pf.camera_id,
      pf.nome_camera,
      tc.paxmax,
      tc.livello,
      pf.prezzo,
      sc.settimana_id,
      sc.settimana_nome,
      sc.notti_in_settimana,
      pf.valido_da
    FROM settimane_coinvolte sc
    JOIN prezzi_finale pf ON pf.settimana = sc.settimana_id
    LEFT JOIN hotel h ON pf.id_hotel = h.id
    LEFT JOIN tipi_camere tc ON pf.camera_id = tc.id
    WHERE pf.valido_da <= data_partenza_param
      AND (pf.valido_a IS NULL OR pf.valido_a >= data_arrivo_param)
      -- Modificato filtro paxmax da >= a = per corrispondenza esatta
      AND (paxmax_filter IS NULL OR tc.paxmax = paxmax_filter)
      AND (livello_filter IS NULL OR tc.livello = livello_filter)
    ORDER BY pf.id_hotel, pf.camera_id, sc.settimana_id, pf.valido_da DESC
  ),
  prezzi_aggregati AS (
    SELECT 
      pps.id_hotel,
      pps.nome_hotel,
      pps.camera_id,
      pps.nome_camera,
      pps.paxmax,
      pps.livello,
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
    GROUP BY pps.id_hotel, pps.nome_hotel, pps.camera_id, pps.nome_camera, pps.paxmax, pps.livello
  )
  SELECT * FROM prezzi_aggregati
  ORDER BY nome_hotel, livello, paxmax DESC, nome_camera;
END;
$$;

GRANT EXECUTE ON FUNCTION get_prezzi_finale_comparazione_definitiva TO authenticated;
GRANT EXECUTE ON FUNCTION get_prezzi_finale_comparazione_definitiva TO anon;
