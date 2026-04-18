-- Funzione RPC per ottenere i filtri disponibili per l'analisi prezzi
CREATE OR REPLACE FUNCTION get_filtri_analisi_prezzo()
RETURNS TABLE (
  hotels json,
  stagioni json,
  settimane json,
  tipi_camere json
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- Hotels
    (SELECT json_agg(
      json_build_object(
        'id', h.id,
        'nome', h.nome,
        'nome_completo', h.nome_completo
      ) ORDER BY h.nome
    ) FROM hotel h WHERE h.nome IS NOT NULL) as hotels,
    
    -- Stagioni
    (SELECT json_agg(
      json_build_object(
        'id', s.id,
        'hotel_id', s.hotel_id,
        'anno', s.anno,
        'stagione', s.stagione,
        'apertura', s.apertura,
        'chiusura', s.chiusura
      ) ORDER BY s.anno DESC, s.apertura
    ) FROM stagioni s) as stagioni,
    
    -- Settimane soggiorno
    (SELECT json_agg(
      json_build_object(
        'id', ss.id,
        'nome', ss.nome,
        'inizio', ss.inizio,
        'fine', ss.fine,
        'anno', ss.anno
      ) ORDER BY ss.inizio
    ) FROM settimane_soggiorno ss) as settimane,
    
    -- Tipi camere (solo quelli attivi)
    (SELECT json_agg(
      json_build_object(
        'id', tc.id,
        'nome', tc.nome,
        'id_hotel', tc.id_hotel,
        'categoria', tc.categoria,
        'livello', tc.livello,
        'tipo', tc.tipo
      ) ORDER BY tc.nome
    ) FROM tipi_camere tc 
    WHERE tc.categoria = 'attivo' AND tc.nome IS NOT NULL) as tipi_camere;
END;
$$;
