-- Aggiorna la funzione telefonate con supporto per filtri avanzati
CREATE OR REPLACE FUNCTION get_telefonate_with_filters(
  p_hotel_ids uuid[] DEFAULT NULL,
  p_data_inizio date DEFAULT NULL,
  p_data_fine date DEFAULT NULL,
  p_operatore_id uuid DEFAULT NULL,
  p_esito text DEFAULT NULL,
  p_durata_min integer DEFAULT NULL,
  p_durata_max integer DEFAULT NULL,
  p_valore_min numeric DEFAULT NULL,
  p_valore_max numeric DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  id_hotel uuid,
  nome_hotel text,
  operatore_id uuid,
  nome_operatore text,
  data_telefonata date,
  ora_telefonata time,
  durata_minuti integer,
  esito text,
  valore_prenotazione numeric,
  note text,
  cliente_nome text,
  cliente_telefono text
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.id_hotel,
    h.nome as nome_hotel,
    t.operatore_id,
    o.nome as nome_operatore,
    t.data_telefonata,
    t.ora_telefonata,
    t.durata_minuti,
    t.esito,
    t.valore_prenotazione,
    t.note,
    t.cliente_nome,
    t.cliente_telefono
  FROM telefonate t
  LEFT JOIN hotel h ON t.id_hotel = h.id
  LEFT JOIN operatori o ON t.operatore_id = o.id
  WHERE (p_hotel_ids IS NULL OR t.id_hotel = ANY(p_hotel_ids))
    AND (p_data_inizio IS NULL OR t.data_telefonata >= p_data_inizio)
    AND (p_data_fine IS NULL OR t.data_telefonata <= p_data_fine)
    AND (p_operatore_id IS NULL OR t.operatore_id = p_operatore_id)
    AND (p_esito IS NULL OR t.esito = p_esito)
    AND (p_durata_min IS NULL OR t.durata_minuti >= p_durata_min)
    AND (p_durata_max IS NULL OR t.durata_minuti <= p_durata_max)
    AND (p_valore_min IS NULL OR t.valore_prenotazione >= p_valore_min)
    AND (p_valore_max IS NULL OR t.valore_prenotazione <= p_valore_max)
  ORDER BY t.data_telefonata DESC, t.ora_telefonata DESC;
END;
$$;

-- Funzione per statistiche orarie delle telefonate
CREATE OR REPLACE FUNCTION get_telefonate_stats_orarie(
  p_hotel_ids uuid[] DEFAULT NULL,
  p_data_inizio date DEFAULT NULL,
  p_data_fine date DEFAULT NULL
)
RETURNS TABLE (
  ora integer,
  telefonate_totali bigint,
  telefonate_convertite bigint,
  tasso_conversione numeric,
  durata_media numeric,
  valore_medio numeric
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXTRACT(HOUR FROM t.ora_telefonata)::integer as ora,
    COUNT(*) as telefonate_totali,
    COUNT(CASE WHEN t.esito = 'convertita' THEN 1 END) as telefonate_convertite,
    CASE 
      WHEN COUNT(*) > 0 
      THEN ROUND((COUNT(CASE WHEN t.esito = 'convertita' THEN 1 END)::numeric / COUNT(*)::numeric) * 100, 2)
      ELSE 0
    END as tasso_conversione,
    AVG(t.durata_minuti) as durata_media,
    AVG(CASE WHEN t.esito = 'convertita' THEN t.valore_prenotazione ELSE NULL END) as valore_medio
  FROM telefonate t
  WHERE (p_hotel_ids IS NULL OR t.id_hotel = ANY(p_hotel_ids))
    AND (p_data_inizio IS NULL OR t.data_telefonata >= p_data_inizio)
    AND (p_data_fine IS NULL OR t.data_telefonata <= p_data_fine)
    AND t.ora_telefonata IS NOT NULL
  GROUP BY EXTRACT(HOUR FROM t.ora_telefonata)
  ORDER BY ora;
END;
$$;
