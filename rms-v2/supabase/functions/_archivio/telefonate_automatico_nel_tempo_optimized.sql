DROP FUNCTION IF EXISTS public.telefonate_automatico_nel_tempo_optimized(date, date, uuid[], boolean);

CREATE OR REPLACE FUNCTION public.telefonate_automatico_nel_tempo_optimized(
  data_inizio date,
  data_fine date,
  hotel_ids uuid[] DEFAULT NULL,
  filter_short_calls boolean DEFAULT false
)
RETURNS json
LANGUAGE plpgsql
AS $function$
DECLARE
  result_json json;
BEGIN
  -- Semplificato date_series senza GROUP BY problematico
  WITH date_series AS (
    SELECT generate_series(data_inizio, data_fine, '1 day'::interval)::date AS data
  ),
  
  telefonate_giornaliere AS (
    SELECT 
      -- Uso diretto dell'estrazione data per performance migliori
      ta."Data/Ora Inizio"::date AS data_chiamata,
      COUNT(*) AS totale_chiamate,
      COUNT(CASE WHEN ta."Stato" = 'ANSWER' THEN 1 END) AS chiamate_risposte,
      COUNT(CASE WHEN ta."Stato" = 'ABANDON' THEN 1 END) AS chiamate_abbandonate,
      COUNT(CASE WHEN ta."Stato" = 'EXITWITHTIMEOUT' THEN 1 END) AS chiamate_timeout,
      COALESCE(AVG(CASE WHEN ta."Stato" = 'ANSWER' THEN ta."Durata (sec)" END), 0) AS durata_media,
      COALESCE(SUM(CASE WHEN ta."Stato" = 'ANSWER' THEN ta."Durata (sec)" END), 0) AS durata_totale
    FROM 
      telefonate_automatico ta
    LEFT JOIN 
      code_Youneed c ON ta."Coda" = c.nome_coda
    LEFT JOIN 
      hotel h ON c.id_hotel = h.id
    WHERE 
      ta."Data/Ora Inizio"::date BETWEEN data_inizio AND data_fine
      AND (hotel_ids IS NULL OR h.id = ANY(hotel_ids))
      -- Filtro chiamate brevi adattato per telefonate_automatico
      AND (NOT filter_short_calls OR 
           (ta."Stato" = 'ANSWER' AND ta."Durata (sec)" >= 10) OR
           (ta."Stato" IN ('ABANDON', 'EXITWITHTIMEOUT') AND ta."Durata (sec)" >= 5))
    GROUP BY ta."Data/Ora Inizio"::date
  ),
  
  -- Aggiunta analisi per giorno della settimana usando EXTRACT
  analisi_settimanale AS (
    SELECT 
      EXTRACT(dow FROM ta."Data/Ora Inizio") AS giorno_settimana,
      CASE EXTRACT(dow FROM ta."Data/Ora Inizio")
        WHEN 0 THEN 'Domenica'
        WHEN 1 THEN 'Lunedì'
        WHEN 2 THEN 'Martedì'
        WHEN 3 THEN 'Mercoledì'
        WHEN 4 THEN 'Giovedì'
        WHEN 5 THEN 'Venerdì'
        WHEN 6 THEN 'Sabato'
      END AS nome_giorno,
      COUNT(*) AS totale_chiamate,
      COUNT(CASE WHEN ta."Stato" = 'ANSWER' THEN 1 END) AS chiamate_risposte,
      ROUND(AVG(CASE WHEN ta."Stato" = 'ANSWER' THEN ta."Durata (sec)" END), 2) AS durata_media
    FROM 
      telefonate_automatico ta
    LEFT JOIN 
      code_Youneed c ON ta."Coda" = c.nome_coda
    LEFT JOIN 
      hotel h ON c.id_hotel = h.id
    WHERE 
      ta."Data/Ora Inizio"::date BETWEEN data_inizio AND data_fine
      AND (hotel_ids IS NULL OR h.id = ANY(hotel_ids))
      AND (NOT filter_short_calls OR 
           (ta."Stato" = 'ANSWER' AND ta."Durata (sec)" >= 10) OR
           (ta."Stato" IN ('ABANDON', 'EXITWITHTIMEOUT') AND ta."Durata (sec)" >= 5))
    GROUP BY EXTRACT(dow FROM ta."Data/Ora Inizio")
    ORDER BY giorno_settimana
  )
  
  SELECT json_build_object(
    'andamento_giornaliero', (
      SELECT json_agg(
        json_build_object(
          'data', daily_data.data,
          'totale_chiamate', daily_data.totale_chiamate,
          'chiamate_risposte', daily_data.chiamate_risposte,
          'chiamate_abbandonate', daily_data.chiamate_abbandonate,
          'chiamate_timeout', daily_data.chiamate_timeout,
          'durata_media', daily_data.durata_media,
          'durata_totale', daily_data.durata_totale,
          'tasso_risposta', daily_data.tasso_risposta
        ) ORDER BY daily_data.data
      )
      FROM (
        SELECT 
          ds.data,
          COALESCE(tg.totale_chiamate, 0) as totale_chiamate,
          COALESCE(tg.chiamate_risposte, 0) as chiamate_risposte,
          COALESCE(tg.chiamate_abbandonate, 0) as chiamate_abbandonate,
          COALESCE(tg.chiamate_timeout, 0) as chiamate_timeout,
          COALESCE(tg.durata_media, 0) as durata_media,
          COALESCE(tg.durata_totale, 0) as durata_totale,
          CASE 
            WHEN COALESCE(tg.totale_chiamate, 0) > 0 
            THEN ROUND((COALESCE(tg.chiamate_risposte, 0)::numeric / tg.totale_chiamate) * 100, 2)
            ELSE 0 
          END as tasso_risposta
        FROM date_series ds
        LEFT JOIN telefonate_giornaliere tg ON ds.data = tg.data_chiamata
      ) daily_data
    ),
    'analisi_settimanale', (
      SELECT json_agg(row_to_json(as_row))
      FROM analisi_settimanale as_row
    ),
    'source_table', 'telefonate_automatico',
    'filter_applied', filter_short_calls
  ) INTO result_json;
  
  RETURN result_json;
END;
$function$;
