(() => {
  let context;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const validDate=v=>/^\d{4}-\d{2}-\d{2}$/.test(v||'')&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
  const editable=doc=>doc?.kind==='billing_note'&&!doc.deleted_at&&!doc.payment_received&&doc.status!=='cancelled';
  const open=async number=>{
    if(!context||document.getElementById('billing-edit-dialog'))return;
    const ctx=context,dialog=document.createElement('dialog');dialog.id='billing-edit-dialog';
    dialog.style.cssText='width:min(720px,96vw);max-height:92vh;overflow:auto;padding:26px;border:0;border-radius:14px';
    dialog.innerHTML='<button type="button" class="ghost" data-close aria-label="ปิดหน้าแก้ไขใบวางบิล" style="float:right">×</button><h2>แก้ไขใบวางบิล</h2><p role="status">กำลังโหลดข้อมูลล่าสุด…</p>';
    const close=()=>{dialog.close();dialog.remove();};dialog.querySelector('[data-close]').onclick=close;dialog.addEventListener('close',()=>dialog.remove());document.body.append(dialog);dialog.showModal();
    try{
      if(window.CRMAccess&&!window.CRMAccess.can('billing_note','edit'))throw Error('ไม่มีสิทธิ์แก้ไขใบวางบิล');
      const docs=await ctx.request(`/rest/v1/documents?organization_id=eq.${encodeURIComponent(ctx.org)}&kind=eq.billing_note&document_number=eq.${encodeURIComponent(number)}&select=*&limit=2`);
      if(!dialog.isConnected)return;
      const doc=docs[0];if(docs.length!==1||doc.organization_id!==ctx.org||!editable(doc))throw Error('ไม่พบใบวางบิลที่แก้ไขได้ หรือเอกสารถูกชำระ/ยกเลิกแล้ว');
      if(!doc.updated_at)throw Error('ไม่พบข้อมูลรุ่นเอกสาร กรุณารีเฟรชแล้วลองใหม่');
      if(ctx!==context)throw Error('องค์กรเปลี่ยนแล้ว กรุณาเปิดเอกสารใหม่');
      const details=window.QuotationEditor.decode(doc.notes);
      const form=document.createElement('form');form.className='form-content';form.style.padding='0';
      form.innerHTML=`<p><strong>${esc(doc.customer_name_snapshot)}</strong></p><p>แก้ไขเลขที่ วันที่ และเงื่อนไขได้ • ลูกค้า รายการสินค้า และยอดเงินอ้างอิงเอกสารต้นทาง ไม่เปลี่ยนตามการแก้ไขใบวางบิล</p><label class="field"><span>เลขที่เอกสาร</span><input name="number" maxlength="80" required value="${esc(doc.document_number)}"></label><label class="field"><span>วันที่เอกสาร</span><input name="issue" type="date" required min="2000-01-01" max="2199-12-31" value="${esc(doc.issue_date)}"></label><label class="field"><span>วันที่ครบกำหนดชำระเงิน</span><input name="due" type="date" required min="2000-01-01" max="2199-12-31" value="${esc(doc.due_date||doc.issue_date)}"></label><label class="field"><span>เงื่อนไขชำระเงิน</span><select name="terms">${window.QuotationEditor.paymentOptions(details.paymentTerms)}</select></label><label class="field"><span>หมายเหตุ</span><textarea name="notes" rows="3" maxlength="4000" style="width:100%">${esc(details.notes)}</textarea></label><p>ยอดรวม ${Number(doc.grand_total||0).toLocaleString('th-TH',{minimumFractionDigits:2})} บาท</p><p data-error role="alert"></p><div class="form-actions"><button type="button" class="ghost" data-cancel>ยกเลิก</button><button type="submit" class="primary">บันทึกการแก้ไข</button></div>`;
      dialog.querySelector('[role=status]').remove();dialog.append(form);form.querySelector('[data-cancel]').onclick=close;
      let busy=false;
      form.onsubmit=async event=>{
        event.preventDefault();if(busy||!form.reportValidity())return;const error=form.querySelector('[data-error]');error.textContent='';
        try{
          if(ctx!==context)throw Error('องค์กรเปลี่ยนแล้ว กรุณาเปิดเอกสารใหม่');
          if(window.CRMAccess&&!window.CRMAccess.can('billing_note','edit'))throw Error('ไม่มีสิทธิ์แก้ไขใบวางบิล');
          const values=Object.fromEntries(new FormData(form)),newNumber=window.DocumentNumber.normalize(values.number);
          if(!newNumber||!validDate(values.issue)||!validDate(values.due)||values.issue<'2000-01-01'||values.due>'2199-12-31'||values.due<values.issue)throw Error('ตรวจเลขที่เอกสารและวันที่ครบกำหนด ต้องไม่ก่อนวันที่เอกสาร');
          busy=true;const submit=form.querySelector('[type=submit]');submit.disabled=true;
          const notes=window.QuotationEditor.encode({...details,paymentTerms:values.terms,notes:values.notes});
          const filter=`organization_id=eq.${encodeURIComponent(ctx.org)}&kind=eq.billing_note&id=eq.${encodeURIComponent(doc.id)}&updated_at=eq.${encodeURIComponent(doc.updated_at)}&deleted_at=is.null&status=neq.cancelled&payment_received=not.is.true`;
          const result=await ctx.request(`/rest/v1/documents?${filter}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({document_number:newNumber,issue_date:values.issue,due_date:values.due,notes})});
          if(!Array.isArray(result)||result.length!==1||result[0].id!==doc.id)throw Error('เอกสารถูกเปลี่ยนโดยผู้ใช้อื่น กรุณาปิดแล้วเปิดใหม่ก่อนบันทึก');
          close();try{await ctx.refresh();}catch{alert('บันทึกแล้ว แต่รีเฟรชรายการไม่สำเร็จ กรุณารีเฟรชหน้าเว็บ');}
        }catch(e){if(dialog.isConnected){error.textContent=e.code==='23505'?'เลขที่เอกสารซ้ำกับที่มีอยู่ รวมถึงในถังขยะ':e.message;form.querySelector('[type=submit]').disabled=false;}}finally{busy=false;}
      };
    }catch(error){if(dialog.isConnected)dialog.querySelector('[role=status]').textContent=error.message;}
  };
  const mount=()=>{
    if(!context)return;
    document.querySelector('#invoices table')?.querySelectorAll('tbody tr').forEach(row=>{
      if(row.cells.length<2||row.querySelector('[data-edit-billing]'))return;
      const number=row.cells[0].textContent.trim();if(!number)return;
      const button=document.createElement('button');button.type='button';button.className='ghost';button.dataset.editBilling=number;button.textContent='แก้ไข';button.setAttribute('aria-label','แก้ไขใบวางบิล '+number);button.onclick=()=>open(number);row.lastElementChild.prepend(button);
    });
  };
  new MutationObserver(mount).observe(document.querySelector('main'),{childList:true,subtree:true});
  window.BillingEdit={open,configure(request,org,refresh){if(!context||context.org!==org)context={request,org,refresh};else Object.assign(context,{request,refresh});mount();}};
})();
