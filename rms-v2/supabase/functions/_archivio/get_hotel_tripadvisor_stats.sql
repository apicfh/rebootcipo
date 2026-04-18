-- Funzione per ottenere le statistiche di Tripadvisor per un hotel specifico
CREATE OR REPLACE FUNCTION get_hotel_tripadvisor_stats(hotel_id_param UUID)
RETURNS TABLE (
  valutazione_media NUMERIC(3,2),
  totale_recensioni INTEGER,
  recensioni_5_stelle INTEGER,
  recensioni_4_stelle INTEGER,
  recensioni_3_stelle INTEGER,
  recensioni_2_stelle INTEGER,
  recensioni_1_stella INTEGER
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(AVG(r.valutazione)::NUMERIC(3,2), 0) AS valutazione_media,
    COUNT(r.id)::INTEGER AS totale_recensioni,
    COUNT(CASE WHEN r.valutazione = 5 THEN 1 END)::INTEGER AS recensioni_5_stelle,
    COUNT(CASE WHEN r.valutazione = 4 THEN 1 END)::INTEGER AS recensioni_4_stelle,
    COUNT(CASE WHEN r.valutazione = 3 THEN 1 END)::INTEGER AS recensioni_3_stelle,
    COUNT(CASE WHEN r.valutazione = 2 THEN 1 END)::INTEGER AS recensioni_2_stelle,
    COUNT(CASE WHEN r.valutazione = 1 THEN 1 END)::INTEGER AS recensioni_1_stella
  FROM
    tripadvisor_recensioni r
  WHERE
    r.hotel_id = hotel_id_param;
END;
$$;
