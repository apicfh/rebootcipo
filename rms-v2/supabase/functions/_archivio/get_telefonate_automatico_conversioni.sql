-- Drop existing function if exists
DROP FUNCTION IF EXISTS get_telefonate_automatico_conversioni(date, date, text, boolean);

-- Create function for telefonate_automatico conversions
CREATE OR REPLACE FUNCTION get_telefonate_automatico_conversioni(
    data_inizio date,
    data_fine date,
    modalita text DEFAULT 'original',
    escludi_chiamate_brevi boolean DEFAULT false
)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    result json;
BEGIN
    WITH telefonate_risposte AS (
        SELECT 
            ta."Chiamante" as numero_telefono,
            ta."Agente" as agent_name,
            DATE(ta."Data/Ora Inizio") as data_chiamata,
            EXTRACT(HOUR FROM ta."Data/Ora Inizio") as ora_chiamata,
            ta."Durata (sec)" as duration,
            h.nome as hotel_nome,
            h.id as hotel_id
        FROM telefonate_automatico ta
        JOIN code_Youneed cy ON cy.numero_coda::text = ta."Coda"
        JOIN hotel h ON h.id = cy.id_hotel
        WHERE DATE(ta."Data/Ora Inizio") >= data_inizio
          AND DATE(ta."Data/Ora Inizio") <= data_fine
          AND ta."Stato" = 'ANSWER'
          AND ta."Agente" != 'NONE'
          AND ta."Chiamante" IS NOT NULL
          AND ta."Chiamante" != ''
          AND (NOT escludi_chiamate_brevi OR ta."Durata (sec)" >= 10)
    ),
    
    prenotazioni_periodo AS (
        SELECT 
            cliente_cellulare,
            data_prenotazione,
            totale_soggiorno,
            notti,
            id_hotel
        FROM prenotazioni
        WHERE data_prenotazione >= data_inizio
          AND data_prenotazione <= data_fine + INTERVAL '2 days'
          AND cliente_cellulare IS NOT NULL
          AND cliente_cellulare != ''
          AND totale_soggiorno > 0
    ),
    
    conversioni_base AS (
        SELECT 
            tr.*,
            pp.data_prenotazione,
            pp.totale_soggiorno,
            pp.notti,
            (pp.data_prenotazione - tr.data_chiamata) as giorni_conversione
        FROM telefonate_risposte tr
        JOIN prenotazioni_periodo pp ON tr.numero_telefono = pp.cliente_cellulare
        WHERE pp.data_prenotazione >= tr.data_chiamata
          AND pp.data_prenotazione <= tr.data_chiamata + INTERVAL '2 days'
    ),
    
    conversioni_first_contact AS (
        SELECT *,
            ROW_NUMBER() OVER (
                PARTITION BY numero_telefono 
                ORDER BY data_chiamata, ora_chiamata
            ) as rn_first
        FROM conversioni_base
    ),
    
    conversioni_max_duration AS (
        SELECT 
            numero_telefono,
            agent_name,
            SUM(duration) as total_duration,
            ROW_NUMBER() OVER (
                PARTITION BY numero_telefono 
                ORDER BY SUM(duration) DESC
            ) as rn_duration
        FROM conversioni_base
        GROUP BY numero_telefono, agent_name
    ),
    
    conversioni_finali AS (
        SELECT 
            cb.*
        FROM conversioni_base cb
        WHERE 
            CASE 
                WHEN modalita = 'first_contact' THEN 
                    EXISTS (
                        SELECT 1 FROM conversioni_first_contact cfc 
                        WHERE cfc.numero_telefono = cb.numero_telefono 
                          AND cfc.agent_name = cb.agent_name 
                          AND cfc.rn_first = 1
                    )
                WHEN modalita = 'max_duration' THEN 
                    EXISTS (
                        SELECT 1 FROM conversioni_max_duration cmd 
                        WHERE cmd.numero_telefono = cb.numero_telefono 
                          AND cmd.agent_name = cb.agent_name 
                          AND cmd.rn_duration = 1
                    )
                ELSE true -- original: tutte le conversioni
            END
    ),
    
    statistiche_operatori AS (
        SELECT 
            tr.agent_name,
            COUNT(DISTINCT CONCAT(tr.numero_telefono, '|', tr.data_chiamata)) as chiamate_totali,
            COUNT(DISTINCT CASE WHEN cf.numero_telefono IS NOT NULL 
                  THEN CONCAT(cf.numero_telefono, '|', cf.data_prenotazione) END) as prenotazioni,
            ROUND(
                (COUNT(DISTINCT CASE WHEN cf.numero_telefono IS NOT NULL 
                      THEN CONCAT(cf.numero_telefono, '|', cf.data_prenotazione) END)::numeric / 
                 NULLIF(COUNT(DISTINCT CONCAT(tr.numero_telefono, '|', tr.data_chiamata)), 0)) * 100, 2
            ) as tasso_conversione,
            -- Correzione calcolo valore totale per evitare duplicazioni
            COALESCE((
                SELECT SUM(DISTINCT totale_soggiorno) 
                FROM conversioni_finali cf2 
                WHERE cf2.agent_name = tr.agent_name
            ), 0) as valore_totale,
            COALESCE((
                SELECT SUM(DISTINCT notti) 
                FROM conversioni_finali cf2 
                WHERE cf2.agent_name = tr.agent_name
            ), 0) as notti_totali,
            -- Correzione calcolo giorni medi per evitare duplicazioni
            COALESCE((
                SELECT ROUND(AVG(giorni_conversione), 1) 
                FROM conversioni_finali cf2 
                WHERE cf2.agent_name = tr.agent_name
            ), 0) as giorni_medi_conversione
        FROM telefonate_risposte tr
        LEFT JOIN conversioni_finali cf ON tr.numero_telefono = cf.numero_telefono 
                                        AND tr.agent_name = cf.agent_name
                                        AND tr.data_chiamata = cf.data_chiamata
        GROUP BY tr.agent_name
        HAVING COUNT(DISTINCT CONCAT(tr.numero_telefono, '|', tr.data_chiamata)) > 0
        ORDER BY prenotazioni DESC, chiamate_totali DESC
    ),
    
    statistiche_globali AS (
        SELECT 
            COUNT(DISTINCT numero_telefono || '|' || data_prenotazione) as totale_prenotazioni,
            COALESCE(SUM(totale_soggiorno), 0) as valore_totale,
            COALESCE(SUM(notti), 0) as notti_totali
        FROM conversioni_finali
    )
    
    SELECT json_build_object(
        'operatori', COALESCE(
            (SELECT json_agg(row_to_json(so)) FROM statistiche_operatori so), 
            '[]'::json
        ),
        'statistiche_globali', (
            SELECT row_to_json(sg) FROM statistiche_globali sg
        ),
        'modalita', modalita,
        'periodo', json_build_object(
            'data_inizio', data_inizio,
            'data_fine', data_fine
        )
    ) INTO result;
    
    RETURN result;
END;
$$;
