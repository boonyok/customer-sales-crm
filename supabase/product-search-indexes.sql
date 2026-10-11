-- Search acceleration only. No data, grants or RLS policies are changed.
create extension if not exists pg_trgm with schema extensions;
-- Run each CONCURRENTLY statement separately, outside a transaction.
create index concurrently if not exists crm_products_name_search_idx
  on public.products using gin (name extensions.gin_trgm_ops);
create index concurrently if not exists crm_variants_sku_search_idx
  on public.product_variants using gin (sku extensions.gin_trgm_ops);
create index concurrently if not exists crm_variants_label_search_idx
  on public.product_variants using gin (label extensions.gin_trgm_ops);
