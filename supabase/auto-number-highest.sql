-- Annual auto-numbering. No existing document numbers are rewritten.
begin;
create table if not exists public.crm_auto_number_sequences(
 organization_id uuid not null references public.organizations(id) on delete cascade,
 prefix text not null,
 last_number numeric(20,0) not null check(last_number>=0),
 primary key(organization_id,prefix)
);
alter table public.crm_auto_number_sequences enable row level security;
revoke all on public.crm_auto_number_sequences from public,anon,authenticated;

create or replace function public.crm_allocate_document_number(p_org uuid,p_kind text,p_date date,p_id uuid)
returns text language plpgsql security definer set search_path='' as $fn$
declare v_prefix text; width integer; highest numeric; next_number numeric; existing_number text;
 target text; manual jsonb;
begin
 if auth.uid() is null or not public.crm_permission(p_org,p_kind,'create') then raise exception 'ไม่มีสิทธิ์สร้างเอกสาร' using errcode='42501'; end if;
 case p_kind
 when 'tax_invoice' then v_prefix:='IV/';width:=5;
 when 'cash_bill' then v_prefix:='CS';width:=5;
 when 'quotation' then v_prefix:='QT';width:=5;
 when 'billing_note' then v_prefix:='BL';width:=4;
 when 'delivery_note' then v_prefix:='DN';width:=4;
 else raise exception 'ประเภทเอกสารไม่รองรับ' using errcode='22023';
 end case;
 target:=case when p_kind='delivery_note' then 'delivery_notes' else 'documents' end;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('crm-auto-id:'||target||':'||p_id::text,0));
 if target='delivery_notes' then
  select document_number into existing_number from public.delivery_notes where id=p_id and organization_id=p_org;
 else
  select document_number into existing_number from public.documents where id=p_id and organization_id=p_org and kind::text=p_kind;
 end if;
 if found then return existing_number; end if;
 manual:=nullif(current_setting('crm.manual_number',true),'')::jsonb;
 if manual is not null and manual->>'org'=p_org::text and manual->>'table'=target then
  if manual->>'number' is null or manual->>'number' !~ '^[A-Z0-9][A-Z0-9._/-]{0,79}$' then raise exception 'เลขที่เอกสารไม่ถูกต้อง' using errcode='22023';end if;
  return manual->>'number';
 end if;
 v_prefix:=v_prefix||right((extract(year from coalesce(p_date,(now() at time zone 'Asia/Bangkok')::date))::integer+543)::text,2)||'-';
 -- One lock covers all auto allocations for this org/prefix until commit.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('crm-auto-prefix:'||p_org::text||':'||v_prefix,0));
 -- The registry includes manually entered/edited numbers and recoverable trash.
 select coalesce(max(substring(number_key from char_length(v_prefix)+1)::numeric),0) into highest
 from public.crm_document_numbers where organization_id=p_org and number_key ~ ('^'||v_prefix||'[0-9]+$');
 -- Historical counters may be ahead after permanent deletion. Only existing
 -- numbers reserve a slot; the prefix lock serializes insert transactions.
 next_number:=highest+1;
 if next_number>999999999999999999 then raise exception 'เลขลำดับเอกสารเกินขอบเขตที่รองรับ' using errcode='22023';end if;
 insert into public.crm_auto_number_sequences(organization_id,prefix,last_number) values(p_org,v_prefix,next_number)
 on conflict(organization_id,prefix) do update set last_number=excluded.last_number;
 return v_prefix||lpad(next_number::text,greatest(width,char_length(next_number::text)),'0');
end $fn$;
revoke all on function public.crm_allocate_document_number(uuid,text,date,uuid) from public,anon,authenticated;

create or replace function public.assign_quotation_year_number()
returns trigger language plpgsql security definer set search_path='' as $fn$
begin
 if new.kind::text<>'quotation' then return new;end if;
 new.issue_date:=coalesce(new.issue_date,(now() at time zone 'Asia/Bangkok')::date);
 new.document_number:=public.crm_allocate_document_number(new.organization_id,'quotation',new.issue_date,new.id);
 return new;
end $fn$;
revoke all on function public.assign_quotation_year_number() from public,anon,authenticated;

create or replace function public.assign_tax_invoice_month_number()
returns trigger language plpgsql security definer set search_path='' as $fn$
begin
 if new.kind::text<>'tax_invoice' then return new;end if;
 new.issue_date:=coalesce(new.issue_date,(now() at time zone 'Asia/Bangkok')::date);
 new.document_number:=public.crm_allocate_document_number(new.organization_id,'tax_invoice',new.issue_date,new.id);
 return new;
end $fn$;
revoke all on function public.assign_tax_invoice_month_number() from public,anon,authenticated;

create or replace function public.assign_cash_bill_year_number()
returns trigger language plpgsql security definer set search_path='' as $fn$
begin
 if new.kind::text<>'cash_bill' then return new;end if;
 new.issue_date:=coalesce(new.issue_date,(now() at time zone 'Asia/Bangkok')::date);
 new.document_number:=public.crm_allocate_document_number(new.organization_id,'cash_bill',new.issue_date,new.id);
 return new;
end $fn$;
revoke all on function public.assign_cash_bill_year_number() from public,anon,authenticated;

create or replace function public.assign_billing_year_number()
returns trigger language plpgsql security definer set search_path='' as $fn$
begin
 if new.kind::text<>'billing_note' then return new;end if;
 new.issue_date:=coalesce(new.issue_date,(now() at time zone 'Asia/Bangkok')::date);
 new.document_number:=public.crm_allocate_document_number(new.organization_id,'billing_note',new.issue_date,new.id);
 return new;
end $fn$;
revoke all on function public.assign_billing_year_number() from public,anon,authenticated;

create or replace function public.assign_delivery_note_year_number()
returns trigger language plpgsql security definer set search_path='' as $fn$
begin
 
 new.issue_date:=coalesce(new.issue_date,(now() at time zone 'Asia/Bangkok')::date);
 new.document_number:=public.crm_allocate_document_number(new.organization_id,'delivery_note',new.issue_date,new.id);
 return new;
end $fn$;
revoke all on function public.assign_delivery_note_year_number() from public,anon,authenticated;

notify pgrst,'reload schema';
commit;
