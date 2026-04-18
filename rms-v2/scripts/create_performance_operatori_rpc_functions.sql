-- Script per creare tutte le funzioni RPC per Performance Operatori
-- Eseguire questo script per creare le funzioni nel database

-- Funzione RPC per ottenere la lista degli operatori disponibili
CREATE OR REPLACE FUNCTION get_performance_operatori_travelbrain_operators()
RETURNS TABLE (
  operator_name TEXT,
  total_quotes BIGINT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mop.operator_name,
    SUM(mop.quotes) as total_quotes
  FROM analytics.mw_operatori_preventivi mop
  WHERE mop.operator_name IS NOT NULL 
    AND mop.operator_name != '(sconosciuto)'
  GROUP BY mop.operator_name
  ORDER BY total_quotes DESC;
END;
$$;

-- Funzione RPC per ottenere la lista degli hotel disponibili
CREATE OR REPLACE FUNCTION get_performance_operatori_travelbrain_hotels()
RETURNS TABLE (
  hotel_id INTEGER,
  total_quotes BIGINT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mop.hotel_id::INTEGER,
    SUM(mop.quotes) as total_quotes
  FROM analytics.mw_operatori_preventivi mop
  WHERE mop.hotel_id IS NOT NULL
  GROUP BY mop.hotel_id
  ORDER BY total_quotes DESC;
END;
$$;

-- Funzione RPC per ottenere i dati filtrati per il grafico
CREATE OR REPLACE FUNCTION get_performance_operatori_travelbrain_data(
  p_date_start DATE,
  p_date_end DATE,
  p_operator_name TEXT,
  p_hotel_ids INTEGER[]
)
RETURNS TABLE (
  day DATE,
  hotel_id INTEGER,
  operator_name TEXT,
  quotes BIGINT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mop.day,
    mop.hotel_id::INTEGER,
    mop.operator_name,
    mop.quotes
  FROM analytics.mw_operatori_preventivi mop
  WHERE mop.day >= p_date_start
    AND mop.day <= p_date_end
    AND mop.operator_name = p_operator_name
    AND mop.hotel_id = ANY(p_hotel_ids)
  ORDER BY mop.day, mop.hotel_id;
END;
$$;

-- Funzione RPC per ottenere le statistiche aggregate
CREATE OR REPLACE FUNCTION get_performance_operatori_travelbrain_stats(
  p_date_start DATE,
  p_date_end DATE,
  p_operator_name TEXT,
  p_hotel_ids INTEGER[]
)
RETURNS TABLE (
  operator_total_quotes BIGINT,
  hotel_total_quotes BIGINT,
  operator_percentage NUMERIC,
  hotel_distribution JSONB
) 
LANGUAGE plpgsql
AS $$
DECLARE
  v_operator_total BIGINT;
  v_hotel_total BIGINT;
  v_percentage NUMERIC;
  v_distribution JSONB;
BEGIN
  -- Calcola il totale quotes dell'operatore
  SELECT COALESCE(SUM(mop.quotes), 0)
  INTO v_operator_total
  FROM analytics.mw_operatori_preventivi mop
  WHERE mop.day >= p_date_start
    AND mop.day <= p_date_end
    AND mop.operator_name = p_operator_name
    AND mop.hotel_id = ANY(p_hotel_ids);

  -- Calcola il totale quotes degli hotel nel periodo
  SELECT COALESCE(SUM(mop.quotes), 0)
  INTO v_hotel_total
  FROM analytics.mw_operatori_preventivi mop
  WHERE mop.day >= p_date_start
    AND mop.day <= p_date_end
    AND mop.hotel_id = ANY(p_hotel_ids);

  -- Calcola la percentuale
  IF v_hotel_total > 0 THEN
    v_percentage := ROUND((v_operator_total::NUMERIC / v_hotel_total::NUMERIC) * 100, 1);
  ELSE
    v_percentage := 0;
  END IF;

  -- Calcola la distribuzione per hotel
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'hotel_id', hotel_id,
        'quotes', quotes
      )
    ), 
    '[]'::jsonb
  )
  INTO v_distribution
  FROM (
    SELECT 
      mop.hotel_id::INTEGER,
      SUM(mop.quotes) as quotes
    FROM analytics.mw_operatori_preventivi mop
    WHERE mop.day >= p_date_start
      AND mop.day <= p_date_end
      AND mop.operator_name = p_operator_name
      AND mop.hotel_id = ANY(p_hotel_ids)
    GROUP BY mop.hotel_id
    ORDER BY quotes DESC
  ) dist;

  RETURN QUERY
  SELECT 
    v_operator_total,
    v_hotel_total,
    v_percentage,
    v_distribution;
END;
$$;
