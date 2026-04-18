-- Funzione per recuperare i prezzi in base alla data di soggiorno specifica
-- Nota: l'ordine dei parametri è stato invertito per corrispondere a quello che Supabase si aspetta
CREATE OR REPLACE FUNCTION public.get_prezzi_per_data_soggiorno(
  p_data_soggiorno DATE,
  p_id_hotel UUID
)
RETURNS TABLE (
  id_prezzo BIGINT,
  data_soggiorno DATE,
  data_creazione DATE,
  tipo_camera VARCHAR,
  prezzo NUMERIC,
  created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pt.id_prezzo,
    pt.data_soggiorno,
    pt.data_creazione,
    pt.tipo_camera,
    pt.prezzo,
    pt.created_at
  FROM 
    prezzi_tosi pt
  WHERE 
    pt.id_hotel = p_id_hotel
    AND pt.data_soggiorno = p_data_soggiorno
  ORDER BY 
    pt.tipo_camera ASC,
    pt.data_creazione ASC;
END;
$$;
