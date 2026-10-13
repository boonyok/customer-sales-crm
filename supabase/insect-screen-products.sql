-- Organization-scoped, resumable creation using only Boonyok's own products.
create index if not exists crm_variants_sku_upper_idx on public.product_variants(upper(sku),product_id);
create or replace function public.crm_add_insect_screen_page(p_org uuid,p_cursor uuid default null,p_limit integer default 100)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  b record; target_sku text; parent_id uuid; variant_id uuid; generated boolean;
  added integer:=0; skipped integer:=0; unpriced integer:=0; scanned integer:=0;
  last_id uuid:=p_cursor; batch_size integer:=greatest(1,least(coalesce(p_limit,100),200));
  final_price numeric; has_more boolean;
begin
  if auth.uid() is null or p_org is null or not public.is_org_member(p_org)
    or not public.crm_permission(p_org,'products','create') then
    raise exception 'No product create permission' using errcode='42501';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_org::text||':insect-screen',0));
  for b in
    select v.id,v.sku,v.label,p.name,p.unit,pr.price
    from public.product_variants v join public.products p on p.id=v.product_id
    left join lateral (select vp.price from public.variant_prices vp where vp.variant_id=v.id order by vp.starts_on desc,vp.id desc limit 1) pr on true
    where p.organization_id=p_org and p.is_active and v.is_active
      and (p_cursor is null or v.id>p_cursor)
      and v.sku ~* '^(RUU|RU|RT|RH|RR|R|E|FZL|FZS)D?[0-9]+(\.[0-9]+)?I[0-9]+(\.[0-9]+)?(BK|W|T)?$'
      and not exists(select 1 from public.product_variants iv join public.products ip on ip.id=iv.product_id
        where ip.organization_id=p_org and upper(iv.sku)=upper(pg_catalog.regexp_replace(upper(v.sku),'^((RUU|RU|RT|RH|RR|R|E|FZL|FZS)D?)','\1Ins'))
          and (coalesce((iv.specification->>'insect_screen_generated')='true',false)=false
            or exists(select 1 from public.variant_prices vp where vp.variant_id=iv.id)))
    order by v.id limit batch_size
  loop
    last_id:=b.id; scanned:=scanned+1;
    target_sku:=pg_catalog.regexp_replace(upper(b.sku),'^((RUU|RU|RT|RH|RR|R|E|FZL|FZS)D?)','\1Ins');
    variant_id:=null; generated:=false;
    select v.id,coalesce((v.specification->>'insect_screen_generated')='true',false)
      into variant_id,generated from public.product_variants v join public.products p on p.id=v.product_id
      where p.organization_id=p_org and upper(v.sku)=upper(target_sku) order by v.id limit 1;
    if variant_id is not null and (not generated or exists(select 1 from public.variant_prices vp where vp.variant_id=variant_id)) then
      skipped:=skipped+1; continue;
    end if;
    if b.price is null or b.price<=0 then unpriced:=unpriced+1; continue; end if;
    final_price:=round(b.price+greatest(b.price*0.15,70),0);
    if variant_id is null then
      parent_id:=null;
      insert into public.products(organization_id,code,name,unit,description)
        values(p_org,target_sku,b.name||case when b.sku ~* '^(RUU|RU|RT|RH|RR|R|E|FZL|FZS)D[0-9]' then ' W/VD' else '' end||' W/Ins',b.unit,'Boonyok insect screen generated from '||b.sku)
        on conflict(organization_id,code) do nothing returning id into parent_id;
      if parent_id is null then
        select p.id into parent_id from public.products p where p.organization_id=p_org and p.code=target_sku
          and p.is_active and p.description='Boonyok insect screen generated from '||b.sku;
        if parent_id is null then skipped:=skipped+1; continue; end if;
      end if;
      insert into public.product_variants(product_id,sku,label,specification)
        values(parent_id,target_sku,b.label||' ติดมุ้งลวดกันแมลง',jsonb_build_object('insect_screen_generated',true,'base_variant_id',b.id,'base_sku',b.sku,'screen_surcharge',final_price-b.price))
        returning id into variant_id;
    end if;
    insert into public.variant_prices(variant_id,price) values(variant_id,final_price);
    added:=added+1;
  end loop;
  has_more:=false;
  if scanned>0 then
  select exists(select 1 from public.product_variants v join public.products p on p.id=v.product_id
    where p.organization_id=p_org and p.is_active and v.is_active and (last_id is null or v.id>last_id)
      and v.sku ~* '^(RUU|RU|RT|RH|RR|R|E|FZL|FZS)D?[0-9]+(\.[0-9]+)?I[0-9]+(\.[0-9]+)?(BK|W|T)?$'
      and not exists(select 1 from public.product_variants iv join public.products ip on ip.id=iv.product_id
        where ip.organization_id=p_org and upper(iv.sku)=upper(pg_catalog.regexp_replace(upper(v.sku),'^((RUU|RU|RT|RH|RR|R|E|FZL|FZS)D?)','\1Ins'))
          and (coalesce((iv.specification->>'insect_screen_generated')='true',false)=false
            or exists(select 1 from public.variant_prices vp where vp.variant_id=iv.id)))) into has_more;
  end if;
  return jsonb_build_object('added',added,'skipped',skipped,'unpriced',unpriced,'scanned',scanned,'next_cursor',last_id,'more',has_more);
end;
$$;
revoke all on function public.crm_add_insect_screen_page(uuid,uuid,integer) from public,anon;
grant execute on function public.crm_add_insect_screen_page(uuid,uuid,integer) to authenticated;
notify pgrst,'reload schema';
