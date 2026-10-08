-- Upgrade the already-installed allocator without changing permissions or data.
begin;
do $upgrade$
declare definition text;
 old_clause text := E'select greatest(highest,coalesce(s.last_number,0))+1 into next_number\n from (select 1) seed left join public.crm_auto_number_sequences s on s.organization_id=p_org and s.prefix=v_prefix;';
begin
 definition:=pg_get_functiondef('public.crm_allocate_document_number(uuid,text,date,uuid)'::regprocedure);
 if strpos(definition,old_clause)>0 then
  execute replace(definition,old_clause,'next_number:=highest+1;');
 elsif strpos(definition,'next_number:=highest+1;')=0 then
  raise exception 'Unexpected allocator definition: upgrade aborted';
 end if;
end $upgrade$;
notify pgrst,'reload schema';
commit;
