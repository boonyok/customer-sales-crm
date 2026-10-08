-- Changes future delete operations only; does not purge any existing records.
begin;
create or replace function public.delete_tax_invoice_permanently(p_org uuid,p_id uuid,p_number text)
returns jsonb language plpgsql security definer set search_path='' as $fn$
declare target public.documents%rowtype;
begin
 if auth.uid() is null or not public.is_org_member(p_org)
   or not public.crm_permission(p_org,'tax_invoice','purge') then
  raise exception 'ไม่มีสิทธิ์ลบใบกำกับภาษีถาวร' using errcode='42501';
 end if;
 select * into target from public.documents
 where id=p_id and organization_id=p_org and kind='tax_invoice' for update;
 if not found then raise exception 'ไม่พบใบกำกับภาษี กรุณาโหลดรายการใหม่';end if;
 if p_number is distinct from target.document_number then raise exception 'เลขที่เอกสารไม่ตรงกัน';end if;
 if exists(select 1 from public.payments where document_id=p_id) then
  raise exception 'เอกสารนี้มีประวัติรับชำระเงินจริง กรุณาจัดการรายการรับชำระก่อนลบ';
 end if;
 if exists(select 1 from public.documents where source_document_id=p_id and organization_id<>p_org)
  or exists(select 1 from public.delivery_notes where source_quotation_id=p_id and organization_id<>p_org) then
  raise exception 'พบเอกสารอ้างอิงต่างองค์กร กรุณาติดต่อผู้ดูแล';
 end if;
 update public.documents set source_document_id=null where source_document_id=p_id and organization_id=p_org;
 update public.delivery_notes set source_quotation_id=null where source_quotation_id=p_id and organization_id=p_org;
 delete from public.documents where id=p_id and organization_id=p_org and kind='tax_invoice';
 return jsonb_build_object('id',p_id,'document_number',target.document_number,'deleted',true,'purged',true);
end $fn$;
revoke all on function public.delete_tax_invoice_permanently(uuid,uuid,text) from public,anon;
grant execute on function public.delete_tax_invoice_permanently(uuid,uuid,text) to authenticated;
notify pgrst,'reload schema';
commit;
