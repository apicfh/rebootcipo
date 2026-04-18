-- Funzione per calcolare il tasso di conversione
CREATE OR REPLACE FUNCTION public.get_conversion_rate(
  p_data_inizio_soggiorno date DEFAULT NULL,
  p_data_fine_soggiorno date DEFAULT NULL,
  p_data_inizio_richiesta date DEFAULT NULL,
  p_data_fine_richiesta date DEFAULT NULL,
  p_hotels uuid[] DEFAULT NULL,
  p_operatore text DEFAULT NULL,
  p_tipo_periodo text DEFAULT 'soggiorno'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  result json;
BEGIN
  WITH preventivi_filtrati AS (
    SELECT 
      pe.*,
      h.nome AS nome_hotel,
      EXTRACT(YEAR FROM pe.data_creazione) AS anno,
      EXTRACT(MONTH FROM pe.data_creazione) AS mese
    FROM 
      preventivi_elaborati pe
    LEFT JOIN 
      hotel h ON pe.id_hotel = h.id
    WHERE 
      -- Filtro per hotel
      (p_hotels IS NULL OR pe.id_hotel = ANY(p_hotels))
      -- Filtro per operatore
      AND (p_operatore IS NULL OR p_operatore = 'tutti' OR pe.operatore_creazione = p_operatore)
      -- Filtro per date soggiorno
      AND (
        p_tipo_periodo != 'soggiorno' 
        OR (
          p_data_inizio_soggiorno IS NULL 
          OR p_data_fine_soggiorno IS NULL 
          OR (
            pe.data_arrivo <= p_data_fine_soggiorno 
            AND pe.data_partenza >= p_data_inizio_soggiorno
          )
        )
      )
      -- Filtro per date richiesta
      AND (
        p_tipo_periodo != 'richiesta' 
        OR (
          p_data_inizio_richiesta IS NULL 
          OR p_data_fine_richiesta IS NULL 
          OR (
            pe.data_creazione BETWEEN p_data_inizio_richiesta AND p_data_fine_richiesta
          )
        )
      )
  ),
  prenotazioni_filtrate AS (
    SELECT 
      p.*,
      EXTRACT(YEAR FROM p.data_prenotazione) AS anno,
      EXTRACT(MONTH FROM p.data_prenotazione) AS mese
    FROM 
      prenotazioni p
    WHERE 
      -- Filtro per hotel
      (p_hotels IS NULL OR p.id_hotel = ANY(p_hotels))
      -- Filtro per date soggiorno
      AND (
        p_tipo_periodo != 'soggiorno' 
        OR (
          p_data_inizio_soggiorno IS NULL 
          OR p_data_fine_soggiorno IS NULL 
          OR (
            p.arrivo <= p_data_fine_soggiorno 
            AND p.partenza >= p_data_inizio_soggiorno
          )
        )
      )
      -- Filtro per date richiesta
      AND (
        p_tipo_periodo != 'richiesta' 
        OR (
          p_data_inizio_richiesta IS NULL 
          OR p_data_fine_richiesta IS NULL 
          OR (
            p.data_prenotazione BETWEEN p_data_inizio_richiesta AND p_data_fine_richiesta
          )
        )
      )
      -- Solo prenotazioni non cancellate
      AND p.stato_prenotazione != 'cancellata'
  ),
  conversione_per_mese AS (
    SELECT
      pf.anno,
      pf.mese,
      TO_CHAR(TO_DATE(pf.mese::text, 'MM'), 'TMMonth') AS nome_mese,
      COUNT(DISTINCT pf.id) AS totale_preventivi,
      COUNT(DISTINCT pr.id) AS prenotazioni_convertite
    FROM
      preventivi_filtrati pf
    LEFT JOIN
      prenotazioni_filtrate pr ON pf.id_cliente = pr.id_cliente
    GROUP BY
      pf.anno, pf.mese
    ORDER BY
      pf.anno, pf.mese
  )
  
  SELECT json_agg(row_to_json(c))
  INTO result
  FROM (
    SELECT
      anno,
      mese,
      nome_mese,
      totale_preventivi,
      prenotazioni_convertite,
      CASE 
        WHEN totale_preventivi > 0 THEN 
          ROUND((prenotazioni_convertite::numeric / totale_preventivi) * 100, 2)
        ELSE 0
      END AS tasso_conversione
    FROM
      conversione_per_mese
  ) c;
  
  RETURN result;
END;
$function$;

-- Imposta i permessi
COMMENT ON FUNCTION public.get_conversion_rate IS 'Calcola il tasso di conversione per periodo';
GRANT EXECUTE ON FUNCTION public.get_conversion_rate TO anon, authenticated, service_role;
