-- RPC per recuperare dati dalle chiamate INBOUND con filtro data
create or replace function public.get_inbound_catia(
  data_inizio date default null,
  data_fine date default null
)
returns table (
  id uuid,
  id_chiamata text,
  data date,
  ora time,
  chiamante text,
  numero_chiamato text,
  coda_destinazione text,
  esito text,
  durata_secondi integer
) as $$
begin
  return query
  select 
    ci.id,
    ci.id_chiamata,
    ci.data,
    ci.ora,
    ci.chiamante,
    ci.numero_chiamato,
    ci.coda_destinazione,
    ci.esito,
    ci.durata_secondi
  from public.chiamate_inbound ci
  where (data_inizio is null or ci.data >= data_inizio)
    and (data_fine is null or ci.data <= data_fine)
  order by ci.data desc, ci.ora desc;
end;
$$ language plpgsql security definer;

-- RPC per recuperare lista agenti outbound (normalizzando operatore_chiamante)
create or replace function public.get_operatori_outbound_list(
  data_inizio date default null,
  data_fine date default null
)
returns table (
  profilo_senza_sigla text,
  nome text
) as $$
begin
  return query
  select distinct
    ay."Profilo_senza_sigla",
    ay.nome
  from public.chiamate_outbound co
  inner join public."Agenti Youneed" ay on substring(co.operatore_chiamante, 3) = ay."Profilo_senza_sigla"
  where ay.attivo = true
    and (data_inizio is null or co.data >= data_inizio)
    and (data_fine is null or co.data <= data_fine)
  order by ay.nome asc;
end;
$$ language plpgsql security definer;

-- RPC per statistiche agenti outbound
create or replace function public.get_operatore_outbound_statistiche(
  profilo_senza_sigla_agente text,
  data_inizio date default null,
  data_fine date default null
)
returns table (
  totale_chiamate integer,
  chiamate_risposte integer,
  rapporto_successo numeric,
  durata_totale_secondi integer,
  durata_media_secondi numeric,
  giorni_analisi integer
) as $$
declare
  v_totale integer;
  v_risposte integer;
  v_durata_totale integer;
  v_durata_media numeric;
  v_giorni integer;
begin
  -- Conta totale chiamate agente
  select count(*)::integer into v_totale
  from public.chiamate_outbound co
  where co.agente = profilo_senza_sigla_agente
    and (data_inizio is null or co.data >= data_inizio)
    and (data_fine is null or co.data <= data_fine);
  
  -- Conta chiamate risposte (ANSWERED)
  select count(*)::integer into v_risposte
  from public.chiamate_outbound co
  where co.agente = profilo_senza_sigla_agente
    and co.esito = 'ANSWERED'
    and (data_inizio is null or co.data >= data_inizio)
    and (data_fine is null or co.data <= data_fine);
  
  -- Durata totale
  select COALESCE(sum(co.durata_secondi), 0)::integer into v_durata_totale
  from public.chiamate_outbound co
  where co.agente = profilo_senza_sigla_agente
    and (data_inizio is null or co.data >= data_inizio)
    and (data_fine is null or co.data <= data_fine);
  
  -- Durata media
  select COALESCE(avg(co.durata_secondi)::numeric, 0) into v_durata_media
  from public.chiamate_outbound co
  where co.agente = profilo_senza_sigla_agente
    and (data_inizio is null or co.data >= data_inizio)
    and (data_fine is null or co.data <= data_fine);
  
  -- Giorni unici
  select count(distinct co.data)::integer into v_giorni
  from public.chiamate_outbound co
  where co.agente = profilo_senza_sigla_agente
    and (data_inizio is null or co.data >= data_inizio)
    and (data_fine is null or co.data <= data_fine);
  
  return query
  select 
    v_totale,
    v_risposte,
    case when v_totale > 0 then (v_risposte::numeric / v_totale * 100) else 0 end,
    v_durata_totale,
    v_durata_media,
    v_giorni;
end;
$$ language plpgsql security definer;

-- RPC per andamento chiamate per operatore (serie temporale)
create or replace function public.get_operatore_outbound_serie_temporale(
  profilo_senza_sigla_agente text,
  data_inizio date default null,
  data_fine date default null
)
returns table (
  data text,
  count_chiamate integer
) as $$
begin
  return query
  select 
    co.data::text,
    count(*)::integer as count_chiamate
  from public.chiamate_outbound co
  where co.agente = profilo_senza_sigla_agente
    and (data_inizio is null or co.data >= data_inizio)
    and (data_fine is null or co.data <= data_fine)
  group by co.data
  order by co.data asc;
end;
$$ language plpgsql security definer;

-- RPC per agente con più chiamate effettuate
create or replace function public.get_operatore_outbound_max_chiamate(
  data_inizio date default null,
  data_fine date default null
)
returns table (
  nome text,
  profilo_senza_sigla text,
  totale_chiamate integer
) as $$
begin
  return query
  select 
    ay.nome,
    co.agente,
    count(*)::integer as totale_chiamate
  from public.chiamate_outbound co
  inner join public."Agenti Youneed" ay on co.agente = ay."Profilo_senza_sigla"
  where (data_inizio is null or co.data >= data_inizio)
    and (data_fine is null or co.data <= data_fine)
  group by co.agente, ay.nome
  order by count(*) desc
  limit 1;
end;
$$ language plpgsql security definer;

-- RPC per agente con rapporto successo più alto
create or replace function public.get_operatore_outbound_max_rapporto(
  data_inizio date default null,
  data_fine date default null
)
returns table (
  nome text,
  profilo_senza_sigla text,
  rapporto_successo numeric
) as $$
begin
  return query
  select 
    ay.nome,
    co.agente,
    (count(case when co.esito = 'ANSWERED' then 1 end)::numeric / count(*)::numeric * 100) as rapporto_successo
  from public.chiamate_outbound co
  inner join public."Agenti Youneed" ay on co.agente = ay."Profilo_senza_sigla"
  where (data_inizio is null or co.data >= data_inizio)
    and (data_fine is null or co.data <= data_fine)
  group by co.agente, ay.nome
  having count(case when co.esito = 'ANSWERED' then 1 end) > 0
  order by (count(case when co.esito = 'ANSWERED' then 1 end)::numeric / count(*)::numeric * 100) desc
  limit 1;
end;
$$ language plpgsql security definer;

-- RPC per agente con durata totale più lunga
create or replace function public.get_operatore_outbound_max_durata_totale(
  data_inizio date default null,
  data_fine date default null
)
returns table (
  nome text,
  profilo_senza_sigla text,
  durata_totale_secondi integer
) as $$
begin
  return query
  select 
    ay.nome,
    co.agente,
    sum(co.durata_secondi)::integer as durata_totale_secondi
  from public.chiamate_outbound co
  inner join public."Agenti Youneed" ay on co.agente = ay."Profilo_senza_sigla"
  where (data_inizio is null or co.data >= data_inizio)
    and (data_fine is null or co.data <= data_fine)
  group by co.agente, ay.nome
  order by sum(co.durata_secondi) desc
  limit 1;
end;
$$ language plpgsql security definer;

-- RPC per agente con durata media più corta
create or replace function public.get_operatore_outbound_min_durata_media(
  data_inizio date default null,
  data_fine date default null
)
returns table (
  nome text,
  profilo_senza_sigla text,
  durata_media_secondi numeric
) as $$
begin
  return query
  select 
    ay.nome,
    co.agente,
    avg(co.durata_secondi)::numeric as durata_media_secondi
  from public.chiamate_outbound co
  inner join public."Agenti Youneed" ay on co.agente = ay."Profilo_senza_sigla"
  where (data_inizio is null or co.data >= data_inizio)
    and (data_fine is null or co.data <= data_fine)
  group by co.agente, ay.nome
  having count(*) > 0
  order by avg(co.durata_secondi) asc
  limit 1;
end;
$$ language plpgsql security definer;

-- RPC per agente con durata media più lunga
create or replace function public.get_operatore_outbound_max_durata_media(
  data_inizio date default null,
  data_fine date default null
)
returns table (
  nome text,
  profilo_senza_sigla text,
  durata_media_secondi numeric
) as $$
begin
  return query
  select 
    ay.nome,
    co.agente,
    avg(co.durata_secondi)::numeric as durata_media_secondi
  from public.chiamate_outbound co
  inner join public."Agenti Youneed" ay on co.agente = ay."Profilo_senza_sigla"
  where (data_inizio is null or co.data >= data_inizio)
    and (data_fine is null or co.data <= data_fine)
  group by co.agente, ay.nome
  having count(*) > 0
  order by avg(co.durata_secondi) desc
  limit 1;
end;
$$ language plpgsql security definer;


-- RPC per ottenere lista di hotel con telefoni (numeri disponibili per filtrare inbound)
-- Ritorna hotel_id, hotel_nome, numero_hotel (senza 0 iniziale per matching)
create or replace function public.get_hotel_numbers_catia()
returns table (
  hotel_id uuid,
  hotel_nome text,
  numero_hotel text
) as $$
begin
  return query
  select 
    h.id,
    h.nome,
    -- Rimuove lo 0 iniziale dal telefono se presente
    case 
      when h.telefono is not null and h.telefono like '0%' 
        then substring(h.telefono, 2)
      when h.telefono is not null 
        then h.telefono
      else null
    end as numero_hotel
  from public.hotel h
  where h.telefono is not null
  order by h.nome asc;
end;
$$ language plpgsql security definer;

-- RPC per recuperare inbound filtrate per numero specifico e range data
create or replace function public.get_inbound_catia_by_number(
  numero_hotel text,
  data_inizio date default null,
  data_fine date default null
)
returns table (
  id uuid,
  id_chiamata text,
  data date,
  ora time,
  chiamante text,
  numero_chiamato text,
  coda_destinazione text,
  esito text,
  durata_secondi integer
) as $$
begin
  return query
  select 
    ci.id,
    ci.id_chiamata,
    ci.data,
    ci.ora,
    ci.chiamante,
    ci.numero_chiamato,
    ci.coda_destinazione,
    ci.esito,
    ci.durata_secondi
  from public.chiamate_inbound ci
  where ci.numero_chiamato = numero_hotel
    and (data_inizio is null or ci.data >= data_inizio)
    and (data_fine is null or ci.data <= data_fine)
  order by ci.data desc, ci.ora desc;
end;
$$ language plpgsql security definer;

-- RPC per ottenere distribuzione code filtrata per numero hotel
create or replace function public.get_inbound_coda_distribution_by_number(
  numero_hotel text,
  data_inizio date default null,
  data_fine date default null
)
returns table (
  coda_destinazione text,
  count_answered integer
) as $$
begin
  return query
  select 
    ci.coda_destinazione,
    count(*)::integer as count_answered
  from public.chiamate_inbound ci
  where ci.numero_chiamato = numero_hotel
    and ci.esito = 'ANSWERED'
    and (data_inizio is null or ci.data >= data_inizio)
    and (data_fine is null or ci.data <= data_fine)
  group by ci.coda_destinazione
  order by count(*) desc;
end;
$$ language plpgsql security definer;

-- RPC per recuperare lista agenti da tabella "Agenti Youneed" (ottimizzata)
create or replace function public.get_operatori_list_optimized(
  data_inizio date default null,
  data_fine date default null
)
returns table (
  id bigint,
  nome text,
  profilo text
) as $$
begin
  return query
  select distinct
    ay."Id",
    ay.nome,
    ay."Profilo"
  from public."Agenti Youneed" ay
  where ay.attivo = true
    and ay.nome is not null
  order by ay.nome asc;
end;
$$ language plpgsql security definer;

-- RPC per statistiche generali dell'agente (ottimizzata con JOIN)
create or replace function public.get_operatore_statistiche_optimized(
  profilo_agente text,
  data_inizio date default null,
  data_fine date default null
)
returns table (
  totale_chiamate integer,
  chiamate_risposte integer,
  tasso_risposta numeric,
  giorni_analisi integer,
  coda_riferimento text
) as $$
declare
  v_totale integer;
  v_risposte integer;
  v_giorni integer;
begin
  -- Conta totale chiamate agente via JOIN con profilo
  select count(*)::integer into v_totale
  from public.telefonate_automatico ta
  inner join public."Agenti Youneed" ay on ta."Agente" = ay."Profilo"
  where ay."Profilo" = profilo_agente
    and (data_inizio is null or (ta."Data/Ora Inizio")::date >= data_inizio)
    and (data_fine is null or (ta."Data/Ora Inizio")::date <= data_fine);
  
  -- Conta chiamate risposte (ANSWER)
  select count(*)::integer into v_risposte
  from public.telefonate_automatico ta
  inner join public."Agenti Youneed" ay on ta."Agente" = ay."Profilo"
  where ay."Profilo" = profilo_agente
    and ta."Stato" = 'ANSWER'
    and (data_inizio is null or (ta."Data/Ora Inizio")::date >= data_inizio)
    and (data_fine is null or (ta."Data/Ora Inizio")::date <= data_fine);
  
  -- Conta giorni unici
  select count(distinct (ta."Data/Ora Inizio")::date)::integer into v_giorni
  from public.telefonate_automatico ta
  inner join public."Agenti Youneed" ay on ta."Agente" = ay."Profilo"
  where ay."Profilo" = profilo_agente
    and (data_inizio is null or (ta."Data/Ora Inizio")::date >= data_inizio)
    and (data_fine is null or (ta."Data/Ora Inizio")::date <= data_fine);
  
  return query
  select 
    v_totale,
    v_risposte,
    case when v_totale > 0 then (v_risposte::numeric / v_totale * 100) else 0 end,
    v_giorni,
    -- Coda di riferimento
    (select ta."Coda"
     from public.telefonate_automatico ta
     inner join public."Agenti Youneed" ay on ta."Agente" = ay."Profilo"
     where ay."Profilo" = profilo_agente
       and (data_inizio is null or (ta."Data/Ora Inizio")::date >= data_inizio)
       and (data_fine is null or (ta."Data/Ora Inizio")::date <= data_fine)
       and ta."Coda" is not null
     group by ta."Coda"
     order by count(*) desc
     limit 1)
  ;
end;
$$ language plpgsql security definer;

-- RPC per distribuzione code agente (ottimizzata con JOIN)
create or replace function public.get_operatore_coda_distribution_optimized(
  profilo_agente text,
  data_inizio date default null,
  data_fine date default null
)
returns table (
  coda text,
  count_coda integer
) as $$
begin
  return query
  select 
    ta."Coda",
    count(*)::integer as count_coda
  from public.telefonate_automatico ta
  inner join public."Agenti Youneed" ay on ta."Agente" = ay."Profilo"
  where ay."Profilo" = profilo_agente
    and ta."Stato" = 'ANSWER'
    and (data_inizio is null or (ta."Data/Ora Inizio")::date >= data_inizio)
    and (data_fine is null or (ta."Data/Ora Inizio")::date <= data_fine)
    and ta."Coda" is not null
  group by ta."Coda"
  order by count(*) desc;
end;
$$ language plpgsql security definer;

-- RPC per serie temporale giornaliera agente (ottimizzata con JOIN)
create or replace function public.get_operatore_serie_temporale_optimized(
  profilo_agente text,
  data_inizio date default null,
  data_fine date default null
)
returns table (
  data text,
  count_chiamate integer
) as $$
begin
  return query
  select 
    ((ta."Data/Ora Inizio")::date)::text,
    count(*)::integer as count_chiamate
  from public.telefonate_automatico ta
  inner join public."Agenti Youneed" ay on ta."Agente" = ay."Profilo"
  where ay."Profilo" = profilo_agente
    and (data_inizio is null or (ta."Data/Ora Inizio")::date >= data_inizio)
    and (data_fine is null or (ta."Data/Ora Inizio")::date <= data_fine)
  group by (ta."Data/Ora Inizio")::date
  order by (ta."Data/Ora Inizio")::date asc;
end;
$$ language plpgsql security definer;

-- RPC per distribuzione oraria agente (ottimizzata con JOIN)
create or replace function public.get_operatore_distribuzione_oraria_optimized(
  profilo_agente text,
  data_inizio date default null,
  data_fine date default null
)
returns table (
  ora integer,
  count_chiamate integer
) as $$
begin
  return query
  select 
    extract(hour from ta."Data/Ora Inizio")::integer,
    count(*)::integer as count_chiamate
  from public.telefonate_automatico ta
  inner join public."Agenti Youneed" ay on ta."Agente" = ay."Profilo"
  where ay."Profilo" = profilo_agente
    and (data_inizio is null or (ta."Data/Ora Inizio")::date >= data_inizio)
    and (data_fine is null or (ta."Data/Ora Inizio")::date <= data_fine)
  group by extract(hour from ta."Data/Ora Inizio")
  order by extract(hour from ta."Data/Ora Inizio") asc;
end;
$$ language plpgsql security definer;

-- RPC per statistiche generali dell'agente
create or replace function public.get_operatore_statistiche(
  agente_nome text,
  data_inizio date default null,
  data_fine date default null
)
returns table (
  totale_chiamate integer,
  chiamate_risposte integer,
  tasso_risposta numeric,
  giorni_analisi integer,
  coda_riferimento text
) as $$
declare
  v_totale integer;
  v_risposte integer;
  v_giorni integer;
begin
  -- Conta totale chiamate agente
  select count(*)::integer into v_totale
  from public.telefonate_automatico ta
  where ta."Agente" = agente_nome
    and (data_inizio is null or (ta."Data/Ora Inizio")::date >= data_inizio)
    and (data_fine is null or (ta."Data/Ora Inizio")::date <= data_fine);
  
  -- Conta chiamate risposte (ANSWER)
  select count(*)::integer into v_risposte
  from public.telefonate_automatico ta
  where ta."Agente" = agente_nome
    and ta."Stato" = 'ANSWER'
    and (data_inizio is null or (ta."Data/Ora Inizio")::date >= data_inizio)
    and (data_fine is null or (ta."Data/Ora Inizio")::date <= data_fine);
  
  -- Conta giorni unici di analisi
  select count(distinct (ta."Data/Ora Inizio")::date)::integer into v_giorni
  from public.telefonate_automatico ta
  where ta."Agente" = agente_nome
    and (data_inizio is null or (ta."Data/Ora Inizio")::date >= data_inizio)
    and (data_fine is null or (ta."Data/Ora Inizio")::date <= data_fine);
  
  return query
  select 
    v_totale,
    v_risposte,
    case when v_totale > 0 then (v_risposte::numeric / v_totale * 100) else 0 end,
    v_giorni,
    -- Coda di riferimento (più frequente)
    (select ta."Coda"
     from public.telefonate_automatico ta
     where ta."Agente" = agente_nome
       and (data_inizio is null or (ta."Data/Ora Inizio")::date >= data_inizio)
       and (data_fine is null or (ta."Data/Ora Inizio")::date <= data_fine)
       and ta."Coda" is not null
     group by ta."Coda"
     order by count(*) desc
     limit 1)
  ;
end;
$$ language plpgsql security definer;

-- RPC per distribuzione code agente
create or replace function public.get_operatore_coda_distribution(
  agente_nome text,
  data_inizio date default null,
  data_fine date default null
)
returns table (
  coda text,
  count_coda integer
) as $$
begin
  return query
  select 
    ta."Coda",
    count(*)::integer as count_coda
  from public.telefonate_automatico ta
  where ta."Agente" = agente_nome
    and ta."Stato" = 'ANSWER'
    and (data_inizio is null or (ta."Data/Ora Inizio")::date >= data_inizio)
    and (data_fine is null or (ta."Data/Ora Inizio")::date <= data_fine)
    and ta."Coda" is not null
  group by ta."Coda"
  order by count(*) desc;
end;
$$ language plpgsql security definer;

-- RPC per serie temporale giornaliera agente
create or replace function public.get_operatore_serie_temporale(
  agente_nome text,
  data_inizio date default null,
  data_fine date default null
)
returns table (
  data text,
  count_chiamate integer
) as $$
begin
  return query
  select 
    ((ta."Data/Ora Inizio")::date)::text,
    count(*)::integer as count_chiamate
  from public.telefonate_automatico ta
  where ta."Agente" = agente_nome
    and (data_inizio is null or (ta."Data/Ora Inizio")::date >= data_inizio)
    and (data_fine is null or (ta."Data/Ora Inizio")::date <= data_fine)
  group by (ta."Data/Ora Inizio")::date
  order by (ta."Data/Ora Inizio")::date asc;
end;
$$ language plpgsql security definer;

-- RPC per distribuzione oraria agente
create or replace function public.get_operatore_distribuzione_oraria(
  agente_nome text,
  data_inizio date default null,
  data_fine date default null
)
returns table (
  ora integer,
  count_chiamate integer
) as $$
begin
  return query
  select 
    extract(hour from ta."Data/Ora Inizio")::integer,
    count(*)::integer as count_chiamate
  from public.telefonate_automatico ta
  where ta."Agente" = agente_nome
    and (data_inizio is null or (ta."Data/Ora Inizio")::date >= data_inizio)
    and (data_fine is null or (ta."Data/Ora Inizio")::date <= data_fine)
  group by extract(hour from ta."Data/Ora Inizio")
  order by extract(hour from ta."Data/Ora Inizio") asc;
end;
$$ language plpgsql security definer;

create or replace function public.get_telefonate_automatico_catia(
  data_inizio date default null,
  data_fine date default null
)
returns table (
  id uuid,
  data_ora_inizio timestamp with time zone,
  data_ora_fine timestamp with time zone,
  chiamante text,
  durata_secondi integer,
  durata_mmss text,
  stato text,
  coda text,
  agente text
) as $$
begin
  return query
  select 
    ta.id,
    ta."Data/Ora Inizio",
    ta."Data/Ora Fine",
    ta."Chiamante",
    ta."Durata (sec)",
    ta."Durata (mm:ss)",
    ta."Stato",
    ta."Coda",
    ta."Agente"
  from public.telefonate_automatico ta
  where (data_inizio is null or (ta."Data/Ora Inizio")::date >= data_inizio)
    and (data_fine is null or (ta."Data/Ora Inizio")::date <= data_fine)
  order by ta."Data/Ora Inizio" desc;
end;
$$ language plpgsql security definer;

create or replace function public.get_inbound_conversion_analysis_by_number(
  numero_hotel text,
  data_inizio date default null,
  data_fine date default null
)
returns table (
  categoria text,
  count_chiamate integer
) as $$
declare
  v_anno_prenotazione integer;
  v_data_sistema date;
  v_convertiti integer := 0;
  v_prenotati integer := 0;
  v_altre integer := 0;
  v_total_answered integer := 0;
begin
  v_data_sistema := current_date;
  
  -- Determina l'anno per il filtro arrivo
  if (extract(month from v_data_sistema) < 9) or 
     (extract(month from v_data_sistema) = 9 and extract(day from v_data_sistema) < 30) then
    v_anno_prenotazione := extract(year from v_data_sistema)::integer;
  else
    v_anno_prenotazione := (extract(year from v_data_sistema) + 1)::integer;
  end if;
  
  -- Conta totale chiamate ANSWERED nel range per questo numero
  select count(*)::integer into v_total_answered
  from public.chiamate_inbound ci
  where ci.numero_chiamato = numero_hotel
    and ci.esito = 'ANSWERED'
    and (data_inizio is null or ci.data >= data_inizio)
    and (data_fine is null or ci.data <= data_fine);
  
  -- Conta CONVERTITI (prenotazione dopo la chiamata)
  select count(distinct ci.id)::integer into v_convertiti
  from public.chiamate_inbound ci
  inner join public.prenotazioni p on (
    ci.chiamante = p.cliente_telefono or ci.chiamante = p.cliente_cellulare
  )
  where ci.numero_chiamato = numero_hotel
    and ci.esito = 'ANSWERED'
    and (data_inizio is null or ci.data >= data_inizio)
    and (data_fine is null or ci.data <= data_fine)
    and extract(month from p.arrivo) >= 5
    and (extract(month from p.arrivo) < 9 or 
         (extract(month from p.arrivo) = 9 and extract(day from p.arrivo) <= 30))
    and extract(year from p.arrivo)::integer = v_anno_prenotazione
    and p.data_prenotazione > ci.data;
  
  -- Conta PRENOTATI (prenotazione prima della chiamata)
  select count(distinct ci.id)::integer into v_prenotati
  from public.chiamate_inbound ci
  inner join public.prenotazioni p on (
    ci.chiamante = p.cliente_telefono or ci.chiamante = p.cliente_cellulare
  )
  where ci.numero_chiamato = numero_hotel
    and ci.esito = 'ANSWERED'
    and (data_inizio is null or ci.data >= data_inizio)
    and (data_fine is null or ci.data <= data_fine)
    and extract(month from p.arrivo) >= 5
    and (extract(month from p.arrivo) < 9 or 
         (extract(month from p.arrivo) = 9 and extract(day from p.arrivo) <= 30))
    and extract(year from p.arrivo)::integer = v_anno_prenotazione
    and p.data_prenotazione < ci.data;
  
  -- ALTRE = totale - (convertiti + prenotati)
  v_altre := v_total_answered - (COALESCE(v_convertiti, 0) + COALESCE(v_prenotati, 0));
  
  -- Ritorna i risultati
  return query
  select 'Convertiti'::text, COALESCE(v_convertiti, 0)::integer
  union all
  select 'Prenotati'::text, COALESCE(v_prenotati, 0)::integer
  union all
  select 'Altre'::text, v_altre::integer;
end;
$$ language plpgsql security definer;


-- RPC per analisi conversione con logica complessa - VERSIONE OTTIMIZZATA
-- Ritorna 3 righe: Convertiti, Prenotati, Altre
create or replace function public.get_inbound_conversion_analysis(
  data_inizio date default null,
  data_fine date default null
)
returns table (
  categoria text,
  count_chiamate integer
) as $$
declare
  v_anno_prenotazione integer;
  v_data_sistema date;
  v_convertiti integer := 0;
  v_prenotati integer := 0;
  v_altre integer := 0;
  v_total_answered integer := 0;
begin
  v_data_sistema := current_date;
  
  -- Determina l'anno per il filtro arrivo
  if (extract(month from v_data_sistema) < 9) or 
     (extract(month from v_data_sistema) = 9 and extract(day from v_data_sistema) < 30) then
    v_anno_prenotazione := extract(year from v_data_sistema)::integer;
  else
    v_anno_prenotazione := (extract(year from v_data_sistema) + 1)::integer;
  end if;
  
  -- Conta totale chiamate ANSWERED nel range
  select count(*)::integer into v_total_answered
  from public.chiamate_inbound ci
  where ci.esito = 'ANSWERED'
    and (data_inizio is null or ci.data >= data_inizio)
    and (data_fine is null or ci.data <= data_fine);
  
  -- Conta CONVERTITI (prenotazione dopo la chiamata)
  select count(distinct ci.id)::integer into v_convertiti
  from public.chiamate_inbound ci
  inner join public.prenotazioni p on (
    ci.chiamante = p.cliente_telefono or ci.chiamante = p.cliente_cellulare
  )
  where ci.esito = 'ANSWERED'
    and (data_inizio is null or ci.data >= data_inizio)
    and (data_fine is null or ci.data <= data_fine)
    and extract(month from p.arrivo) >= 5
    and (extract(month from p.arrivo) < 9 or 
         (extract(month from p.arrivo) = 9 and extract(day from p.arrivo) <= 30))
    and extract(year from p.arrivo)::integer = v_anno_prenotazione
    and p.data_prenotazione > ci.data;
  
  -- Conta PRENOTATI (prenotazione prima della chiamata)
  select count(distinct ci.id)::integer into v_prenotati
  from public.chiamate_inbound ci
  inner join public.prenotazioni p on (
    ci.chiamante = p.cliente_telefono or ci.chiamante = p.cliente_cellulare
  )
  where ci.esito = 'ANSWERED'
    and (data_inizio is null or ci.data >= data_inizio)
    and (data_fine is null or ci.data <= data_fine)
    and extract(month from p.arrivo) >= 5
    and (extract(month from p.arrivo) < 9 or 
         (extract(month from p.arrivo) = 9 and extract(day from p.arrivo) <= 30))
    and extract(year from p.arrivo)::integer = v_anno_prenotazione
    and p.data_prenotazione < ci.data;
  
  -- ALTRE = totale - (convertiti + prenotati)
  v_altre := v_total_answered - (COALESCE(v_convertiti, 0) + COALESCE(v_prenotati, 0));
  
  -- Ritorna i risultati
  return query
  select 'Convertiti'::text, COALESCE(v_convertiti, 0)::integer
  union all
  select 'Prenotati'::text, COALESCE(v_prenotati, 0)::integer
  union all
  select 'Altre'::text, v_altre::integer;
end;
$$ language plpgsql security definer;
