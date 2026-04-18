-- Funzione RPC per recuperare dati dalla materialized view mw_heatmap_giorni_richiesti
-- con filtri per anni e hotel, periodo fisso 12 maggio - 15 settembre

CREATE OR REPLACE FUNCTION get_heatmap_giorni_richiesti(
  p_anni integer[] DEFAULT NULL,
  p_hotel_ids integer[] DEFAULT NULL
)
RETURNS TABLE (
  day date,
  hotel_id integer,
  requests bigint,
  anno integer,
  nome_hotel text
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mh.day,
    mh.hotel_id,
    mh.requests,
    EXTRACT(YEAR FROM mh.day)::integer as anno,
    ht.nome_hotel
  FROM analytics.mw_heatmap_giorni_richiesti mh
  LEFT JOIN analytics.hotel_travelbrain ht ON mh.hotel_id = ht.hotel_id
  WHERE 
    -- Filtro periodo stagionale: 12 maggio - 15 settembre
    (EXTRACT(MONTH FROM mh.day) = 5 AND EXTRACT(DAY FROM mh.day) >= 12)
    OR (EXTRACT(MONTH FROM mh.day) IN (6, 7, 8))
    OR (EXTRACT(MONTH FROM mh.day) = 9 AND EXTRACT(DAY FROM mh.day) <= 15)
    -- Filtro anni se specificato
    AND (p_anni IS NULL OR EXTRACT(YEAR FROM mh.day)::integer = ANY(p_anni))
    -- Filtro hotel se specificato
    AND (p_hotel_ids IS NULL OR mh.hotel_id = ANY(p_hotel_ids))
  ORDER BY mh.day, mh.hotel_id;
END;
$$;
