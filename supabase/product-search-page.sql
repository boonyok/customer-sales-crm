-- Read-only endpoint equivalent to the existing member + products/view guards.
-- Check these once per request instead of once per variant/join/price row.
create function public.crm_search_product_page(
  p_org uuid, p_words text[] default '{}', p_category text default null,
  p_groups jsonb default '[]', p_cursor uuid default null, p_limit integer default 101
) returns table(id uuid,product_id uuid,sku text,name text,unit text,label text,product_is_active boolean,price numeric)
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or p_org is null
    or not public.is_org_member(p_org)
    or not public.crm_permission(p_org,'products','view') then
    raise exception 'No product view permission for this organization' using errcode='42501';
  end if;
  if p_groups is null or jsonb_typeof(p_groups)<>'array' then
    raise exception 'Invalid search filters' using errcode='22023';
  end if;
  if coalesce(array_length(p_words,1),0)>12
    or jsonb_array_length(p_groups)>8 or length(coalesce(p_category,''))>200
    or exists(select 1 from unnest(p_words) as t(w) where w is null or length(w)>220)
    or exists(select 1 from jsonb_array_elements(p_groups) as t(g) where jsonb_typeof(g->'patterns') is distinct from 'array') then
    raise exception 'Invalid search filters' using errcode='22023';
  end if;
  if exists(select 1 from jsonb_array_elements(p_groups) as t(g)
      where jsonb_array_length(g->'patterns')>10)
    or exists(select 1 from jsonb_array_elements(p_groups) as t(g),
      lateral jsonb_array_elements_text(g->'patterns') as s(pat) where pat is null or length(pat)>220) then
    raise exception 'Invalid search filters' using errcode='22023';
  end if;
  return query
  with matched as (
    select v.id,v.product_id,v.sku,p.name,p.unit,v.label,p.is_active
    from public.product_variants v join public.products p on p.id=v.product_id
    where p.organization_id=p_org and v.is_active
      and (p_cursor is null or v.id>p_cursor)
      and (p_category is null or p.name ilike p_category)
      and not exists(select 1 from unnest(p_words) as t(w)
        where not(v.sku ilike w or p.name ilike w or v.label ilike w))
      and not exists (
        select 1 from jsonb_array_elements(p_groups) as t(g)
        where coalesce((g->>'negative')::boolean,false) = exists (
          select 1 from jsonb_array_elements_text(g->'patterns') as s(pat)
          where v.label ilike pat or (not coalesce((g->>'label_only')::boolean,false) and p.name ilike pat)
        )
      )
    order by v.id limit greatest(1,least(coalesce(p_limit,101),101))
  )
  select m.id,m.product_id,m.sku,m.name,m.unit,m.label,m.is_active,coalesce(pr.price,0)
  from matched m left join lateral (
    select vp.price from public.variant_prices vp where vp.variant_id=m.id
    order by vp.starts_on desc,vp.id desc limit 1
  ) pr on true order by m.id;
end;
$$;
revoke all on function public.crm_search_product_page(uuid,text[],text,jsonb,uuid,integer) from public,anon;
grant execute on function public.crm_search_product_page(uuid,text[],text,jsonb,uuid,integer) to authenticated;
notify pgrst,'reload schema';
