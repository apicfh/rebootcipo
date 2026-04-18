-- RPC per recuperare le stagioni tariffarie dallo schema rev
create or replace function public.studiorevenue_get_stagionitariffarie()
returns table (
  id uuid,
  nome text,
  data_inizio date,
  data_fine date,
  anno integer,
  tipo_stagione text
) as $$
begin
  return query
  select 
    st.id,
    st.nome,
    st.data_inizio,
    st.data_fine,
    st.anno,
    st.tipo_stagione
  from rev.stagioni_tariffarie st
  order by st.anno desc, st.data_inizio asc;
end;
$$ language plpgsql security definer;
