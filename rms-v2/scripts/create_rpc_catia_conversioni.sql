-- ===== RPC PER TAB CONVERSIONI - CATIA =====

-- RPC: Recupera KPI prenotazioni per tab CONVERSIONI (count, fatturato, notti)
create or replace function public.rpc_conversioni_catia_prenotazioni_kpi(
  data_inizio date default null,
  data_fine date default null,
  id_hotel_filter uuid default null
)
returns table (
  totale_prenotazioni integer,
  totale_fatturato numeric,
  totale_notti integer
) as $$
begin
  return query
  select 
    count(*)::integer,
    COALESCE(sum(p.totale_soggiorno), 0)::numeric,
    COALESCE(sum(p.notti), 0)::integer
  from public.prenotazioni p
  where (data_inizio is null or p.data_prenotazione >= data_inizio)
    and (data_fine is null or p.data_prenotazione <= data_fine)
    and (id_hotel_filter is null or p.id_hotel = id_hotel_filter);
end;
$$ language plpgsql security definer;

-- RPC: Matching bifasico telefoni prenotazioni con telefonate outbound e automatico
create or replace function public.rpc_conversioni_catia_matching_telefoni(
  data_inizio date default null,
  data_fine date default null,
  id_hotel_filter uuid default null
)
returns table (
  cliente_telefono text,
  cliente_cellulare text,
  data_prenotazione date,
  totale_soggiorno numeric,
  notti integer,
  agente_outbound text,
  data_prima_chiamata_outbound date,
  agente_automatico text,
  data_prima_chiamata_automatico date,
  giorni_prima_contatto integer
) as $$
declare
  v_date_start_calls date;
begin
  -- Range telefonate: 4-5 giorni prima rispetto a data_inizio prenotazioni
  v_date_start_calls := COALESCE(data_inizio, CURRENT_DATE) - interval '5 days';
  
  return query
  select 
    p.cliente_telefono,
    p.cliente_cellulare,
    p.data_prenotazione,
    p.totale_soggiorno,
    p.notti,
    -- Agente da chiamate_outbound (cliente_telefono)
    (select ay."Profilo_senza_sigla" 
     from public.chiamate_outbound co
     inner join public."Agenti Youneed" ay on co.agente = ay."Profilo_senza_sigla"
     where (
       (regexp_replace(co.utente_chiamato, '[^0-9]', '', 'g') like '%' || 
        regexp_replace(p.cliente_telefono, '[^0-9]', '', 'g') and 
        length(regexp_replace(p.cliente_telefono, '[^0-9]', '', 'g')) >= 10) or
       (regexp_replace(co.utente_chiamato, '[^0-9]', '', 'g') like '%' || 
        regexp_replace(p.cliente_cellulare, '[^0-9]', '', 'g') and 
        length(regexp_replace(p.cliente_cellulare, '[^0-9]', '', 'g')) >= 10)
     )
     and (v_date_start_calls is null or co.data >= v_date_start_calls)
     and (data_fine is null or co.data <= data_fine)
     order by co.data asc
     limit 1
    )::text as agente_outbound,
    -- Data prima chiamata outbound
    (select co.data 
     from public.chiamate_outbound co
     where (
       (regexp_replace(co.utente_chiamato, '[^0-9]', '', 'g') like '%' || 
        regexp_replace(p.cliente_telefono, '[^0-9]', '', 'g') and 
        length(regexp_replace(p.cliente_telefono, '[^0-9]', '', 'g')) >= 10) or
       (regexp_replace(co.utente_chiamato, '[^0-9]', '', 'g') like '%' || 
        regexp_replace(p.cliente_cellulare, '[^0-9]', '', 'g') and 
        length(regexp_replace(p.cliente_cellulare, '[^0-9]', '', 'g')) >= 10)
     )
     and (v_date_start_calls is null or co.data >= v_date_start_calls)
     and (data_fine is null or co.data <= data_fine)
     order by co.data asc
     limit 1
    ) as data_prima_chiamata_outbound,
    -- Agente da telefonate_automatico (cliente_telefono/cellulare)
    (select ta."Agente" 
     from public.telefonate_automatico ta
     where ta."Stato" = 'ANSWER'
     and (
       (regexp_replace(ta."Chiamante", '[^0-9]', '', 'g') like '%' || 
        regexp_replace(p.cliente_telefono, '[^0-9]', '', 'g') and 
        length(regexp_replace(p.cliente_telefono, '[^0-9]', '', 'g')) >= 10) or
       (regexp_replace(ta."Chiamante", '[^0-9]', '', 'g') like '%' || 
        regexp_replace(p.cliente_cellulare, '[^0-9]', '', 'g') and 
        length(regexp_replace(p.cliente_cellulare, '[^0-9]', '', 'g')) >= 10)
     )
     and (v_date_start_calls is null or ta."Data/Ora Inizio"::date >= v_date_start_calls)
     and (data_fine is null or ta."Data/Ora Inizio"::date <= data_fine)
     order by ta."Data/Ora Inizio" asc
     limit 1
    )::text as agente_automatico,
    -- Data prima chiamata automatico
    (select ta."Data/Ora Inizio"::date 
     from public.telefonate_automatico ta
     where ta."Stato" = 'ANSWER'
     and (
       (regexp_replace(ta."Chiamante", '[^0-9]', '', 'g') like '%' || 
        regexp_replace(p.cliente_telefono, '[^0-9]', '', 'g') and 
        length(regexp_replace(p.cliente_telefono, '[^0-9]', '', 'g')) >= 10) or
       (regexp_replace(ta."Chiamante", '[^0-9]', '', 'g') like '%' || 
        regexp_replace(p.cliente_cellulare, '[^0-9]', '', 'g') and 
        length(regexp_replace(p.cliente_cellulare, '[^0-9]', '', 'g')) >= 10)
     )
     and (v_date_start_calls is null or ta."Data/Ora Inizio"::date >= v_date_start_calls)
     and (data_fine is null or ta."Data/Ora Inizio"::date <= data_fine)
     order by ta."Data/Ora Inizio" asc
     limit 1
    )::date as data_prima_chiamata_automatico,
    -- Giorni prima contatto (minimo tra le due fonti)
    LEAST(
      COALESCE(
        (select (p.data_prenotazione - co.data)::integer 
         from public.chiamate_outbound co
         where (
           (regexp_replace(co.utente_chiamato, '[^0-9]', '', 'g') like '%' || 
            regexp_replace(p.cliente_telefono, '[^0-9]', '', 'g') and 
            length(regexp_replace(p.cliente_telefono, '[^0-9]', '', 'g')) >= 10) or
           (regexp_replace(co.utente_chiamato, '[^0-9]', '', 'g') like '%' || 
            regexp_replace(p.cliente_cellulare, '[^0-9]', '', 'g') and 
            length(regexp_replace(p.cliente_cellulare, '[^0-9]', '', 'g')) >= 10)
         )
         and (v_date_start_calls is null or co.data >= v_date_start_calls)
         and (data_fine is null or co.data <= data_fine)
         order by co.data asc
         limit 1),
        999
      ),
      COALESCE(
        (select (p.data_prenotazione - ta."Data/Ora Inizio"::date)::integer 
         from public.telefonate_automatico ta
         where ta."Stato" = 'ANSWER'
         and (
           (regexp_replace(ta."Chiamante", '[^0-9]', '', 'g') like '%' || 
            regexp_replace(p.cliente_telefono, '[^0-9]', '', 'g') and 
            length(regexp_replace(p.cliente_telefono, '[^0-9]', '', 'g')) >= 10) or
           (regexp_replace(ta."Chiamante", '[^0-9]', '', 'g') like '%' || 
            regexp_replace(p.cliente_cellulare, '[^0-9]', '', 'g') and 
            length(regexp_replace(p.cliente_cellulare, '[^0-9]', '', 'g')) >= 10)
         )
         and (v_date_start_calls is null or ta."Data/Ora Inizio"::date >= v_date_start_calls)
         and (data_fine is null or ta."Data/Ora Inizio"::date <= data_fine)
         order by ta."Data/Ora Inizio" asc
         limit 1),
        999
      )
    )::integer as giorni_prima_contatto
  from public.prenotazioni p
  where (data_inizio is null or p.data_prenotazione >= data_inizio)
    and (data_fine is null or p.data_prenotazione <= data_fine)
    and (id_hotel_filter is null or p.id_hotel = id_hotel_filter)
  order by p.data_prenotazione desc;
end;
$$ language plpgsql security definer;

-- RPC: Statistiche agenti per tab CONVERSIONI
create or replace function public.rpc_conversioni_catia_agenti_statistiche(
  data_inizio date default null,
  data_fine date default null,
  id_hotel_filter uuid default null
)
returns table (
  agente_nome text,
  agente_profilo_senza_sigla text,
  totale_chiamate_agente integer,
  prenotazioni_convertite integer,
  tasso_conversione numeric,
  fatturato_generato numeric,
  giorni_media_cottura numeric
) as $$
begin
  return query
  with conversioni_match as (
    select 
      COALESCE(m.agente_outbound, m.agente_automatico) as agente_profilo,
      m.data_prenotazione,
      m.totale_soggiorno,
      m.giorni_prima_contatto
    from public.rpc_conversioni_catia_matching_telefoni(data_inizio, data_fine, id_hotel_filter) m
    where m.agente_outbound is not null or m.agente_automatico is not null
  ),
  agenti_chiamate as (
    select 
      ay.nome,
      ay."Profilo_senza_sigla",
      count(distinct co.id)::integer as totale_chiamate
    from public.chiamate_outbound co
    inner join public."Agenti Youneed" ay on co.agente = ay."Profilo_senza_sigla"
    where (data_inizio is null or co.data >= data_inizio - interval '5 days')
      and (data_fine is null or co.data <= data_fine)
    group by ay."Profilo_senza_sigla", ay.nome
  )
  select 
    ac.nome,
    ac."Profilo_senza_sigla",
    ac.totale_chiamate,
    count(distinct cm.data_prenotazione)::integer as prenotazioni_convertite,
    (count(distinct cm.data_prenotazione)::numeric / ac.totale_chiamate * 100) as tasso_conversione,
    COALESCE(sum(cm.totale_soggiorno), 0)::numeric as fatturato_generato,
    COALESCE(avg(cm.giorni_prima_contatto), 0)::numeric as giorni_media_cottura
  from agenti_chiamate ac
  left join conversioni_match cm on ac."Profilo_senza_sigla" = cm.agente_profilo
  group by ac."Profilo_senza_sigla", ac.nome, ac.totale_chiamate
  order by ac.totale_chiamate desc;
end;
$$ language plpgsql security definer;
