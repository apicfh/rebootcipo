-- RPC per analisi conversioni per area
-- Versione corretta: rimuove riferimento a ccpc.id_hotel che non esiste nella view
-- L'area viene determinata SOLO dalla tabella Agenti Youneed tramite agente_normalizzato

DROP FUNCTION IF EXISTS public.rpc_final_conversioni_per_area_analisi(date, date, integer, uuid);

CREATE OR REPLACE FUNCTION public.rpc_final_conversioni_per_area_analisi(
  p_data_inizio date,
  p_data_fine date,
  p_durata_minima_secondi integer DEFAULT 0,
  p_id_hotel_filter uuid DEFAULT NULL
)
RETURNS TABLE(
  area_id uuid,
  area_nome text,
  conversioni_totali bigint,
  conversioni_risposte bigint,
  tasso_conversione_tutte numeric,
  tasso_conversione_risposte numeric,
  fatturato_totale numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH conversioni_filtrate AS (
    -- Seleziona tutte le righe della view nel range con filtro durata
    -- L'area viene determinata dall'agente tramite Agenti Youneed
    SELECT 
      ccpc.prenotazione_id,
      ccpc.data_prenotazione,
      ccpc.tipo_chiamata,
      ccpc.durata_secondi,
      ccpc.agente_normalizzato,
      ccpc.esito,
      ay.area AS area_id
    FROM public.chiamate_conversione_prenotazioni_chiamate AS ccpc
    LEFT JOIN public."Agenti Youneed" AS ay ON ccpc.agente_normalizzato = ay.nome
    WHERE ccpc.data_prenotazione >= p_data_inizio
      AND ccpc.data_prenotazione <= p_data_fine
      AND ccpc.durata_secondi > p_durata_minima_secondi
  ),
  conversioni_con_area AS (
    SELECT 
      cf.area_id,
      cf.prenotazione_id,
      cf.durata_secondi,
      cf.esito,
      a.id as aree_id,
      a.nome_area
    FROM conversioni_filtrate AS cf
    LEFT JOIN public.aree AS a ON cf.area_id = a.id
  ),
  aggregazioni_per_area AS (
    SELECT 
      COALESCE(cca.aree_id, '00000000-0000-0000-0000-000000000000'::uuid) AS area_id_final,
      COALESCE(cca.nome_area, 'Non Assegnata') AS area_nome_final,
      COUNT(*) AS total_conversioni,
      COUNT(CASE WHEN cca.esito IN ('ANSWERED', 'ANSWER') THEN 1 END) AS conversioni_con_risposta,
      COALESCE(SUM(p.totale_soggiorno), 0::numeric) AS fatturato
    FROM conversioni_con_area AS cca
    LEFT JOIN public.prenotazioni AS p ON cca.prenotazione_id = p.id
    GROUP BY area_id_final, area_nome_final
  )
  SELECT 
    area_id_final,
    area_nome_final,
    total_conversioni,
    conversioni_con_risposta,
    CASE 
      WHEN total_conversioni = 0 THEN 0::numeric
      ELSE ROUND((conversioni_con_risposta::numeric / total_conversioni::numeric) * 100, 2)
    END AS tasso_conversione_tutte,
    CASE 
      WHEN total_conversioni = 0 THEN 0::numeric
      ELSE ROUND((conversioni_con_risposta::numeric / total_conversioni::numeric) * 100, 2)
    END AS tasso_conversione_risposte,
    fatturato
  FROM aggregazioni_per_area
  ORDER BY total_conversioni DESC;
END;
$$ LANGUAGE plpgsql;
