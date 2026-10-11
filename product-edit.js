(() => {
  let context,busy=false;
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dialog=document.createElement('dialog');dialog.id='product-edit-dialog';dialog.setAttribute('aria-label','แก้ไขข้อมูลสินค้า');
  dialog.style.cssText='width:min(620px,94vw);padding:24px;border:1px solid #b9dcf3;border-radius:16px;color:#174b6b;max-height:90vh;overflow:auto';document.body.append(dialog);
  const style=document.createElement('style');style.textContent='#product-body tr[data-edit-product]{cursor:pointer}#product-body tr[data-edit-product]:hover,#product-body tr[data-edit-product]:focus{background:#e4f5ff;outline:2px solid #b9e5f6;outline-offset:-2px}#product-edit-dialog .field{display:flex;flex-direction:column;gap:7px;margin:18px 0}#product-edit-dialog .field input{width:100%;box-sizing:border-box;padding:12px 14px;border:1px solid #bbd9ec;border-radius:9px;font:inherit;color:#174b6b;background:#fff}#product-edit-dialog input[readonly]{background:#f0f6fb;color:#6d8395}#product-edit-dialog .field small{font-size:12px;color:#71879a}#product-edit-dialog h2{margin:0 0 20px}#product-edit-dialog .form-actions{display:flex;justify-content:flex-end;gap:10px;border-top:1px solid #e0edf6;padding-top:18px}#product-edit-dialog::backdrop{background:#183e5c66}';document.head.append(style);
  async function open(id){
    if(busy||!context||!window.CRMAccess?.can('products','edit'))return;
    const c=context,org=c.currentOrg(),p=c.products().find(p=>p.id===id);if(!p)return;
    dialog.innerHTML=`<form><h2>แก้ไขข้อมูลสินค้า</h2><label class="field"><span>รหัสสินค้า</span><input value="${escape(p.sku)}" readonly><small>รหัสเดิมคงไว้เพื่อรักษาการอ้างอิง</small></label><label class="field"><span>ชื่อสินค้า</span><input name="name" required value="${escape(p.name)}"><small>ชื่อใช้ร่วมกันทุกขนาดของสินค้ารหัสหลักนี้</small></label><label class="field"><span>ขนาด / สเปก</span><input name="size" required value="${escape(p.size)}"></label><label class="field"><span>ราคาขายก่อน VAT (บาท)</span><input name="price" type="number" min="0" step="0.01" required value="${escape(p.price)}"></label><p role="status" data-edit-status></p><div class="form-actions"><button type="button" class="ghost" data-cancel>ยกเลิก</button><button type="submit" class="primary">บันทึกการแก้ไข</button></div></form>`;
    dialog.querySelector('[data-cancel]').onclick=()=>dialog.close();dialog.showModal();
    dialog.querySelector('form').onsubmit=async event=>{
      event.preventDefault();if(busy)return;
      const data=Object.fromEntries(new FormData(event.currentTarget)),name=data.name.trim(),size=data.size.trim(),price=Number(data.price),status=dialog.querySelector('[data-edit-status]');
      if(!name||!size||!Number.isFinite(price)||price<0){status.textContent='กรุณากรอกชื่อ ขนาด และราคาให้ถูกต้อง';return;}
      if(org!==c.currentOrg()||!window.CRMAccess.can('products','edit')){status.textContent='บริษัทหรือสิทธิ์เปลี่ยน กรุณาเปิดใหม่';return;}
      busy=true;const controls=[...dialog.querySelectorAll('input,button')];controls.forEach(n=>n.disabled=true);status.textContent='กำลังบันทึก…';
      const patch=async(table,filter,body)=>{if(org!==c.currentOrg())throw Error('บริษัทเปลี่ยน');const rows=await c.request('/rest/v1/'+table+'?'+filter,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(body)});if(rows.length!==1)throw Error('ไม่พบรายการหรือไม่มีสิทธิ์แก้ไข');};
      try{
        const parent=await c.request('/rest/v1/products?id=eq.'+p.productId+'&organization_id=eq.'+encodeURIComponent(org)+'&select=id');if(parent.length!==1)throw Error('ไม่พบสินค้าในบริษัทนี้');
        if(name!==p.name){await patch('products','id=eq.'+p.productId+'&organization_id=eq.'+encodeURIComponent(org),{name});c.products().filter(row=>row.productId===p.productId).forEach(row=>row.name=name);}
        if(size!==p.size){await patch('product_variants','id=eq.'+p.id+'&product_id=eq.'+p.productId,{label:size});p.size=size;}
        if(price!==Number(p.price)){
          const prices=await c.request('/rest/v1/variant_prices?variant_id=eq.'+p.id+'&select=id&order=starts_on.desc,id.desc&limit=1');
          if(prices.length)await patch('variant_prices','id=eq.'+prices[0].id+'&variant_id=eq.'+p.id,{price});
          else await c.request('/rest/v1/variant_prices',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({variant_id:p.id,price})});
          p.price=price.toFixed(2);
        }
        c.refresh();document.getElementById('product-search').dispatchEvent(new Event('input'));dialog.close();
      }catch(error){c.refresh();status.textContent='บันทึกไม่ครบ: '+error.message+' • ส่วนที่บันทึกสำเร็จแสดงค่าล่าสุดแล้ว กดบันทึกอีกครั้งเพื่อทำต่อ';}
      finally{busy=false;controls.forEach(n=>n.disabled=false);}
    };
  }
  dialog.addEventListener('cancel',event=>{if(busy)event.preventDefault();});
  const body=document.getElementById('product-body');
  body.addEventListener('click',event=>{if(event.target.closest('button,a,input'))return;const row=event.target.closest('[data-edit-product]');if(row)open(row.dataset.editProduct);});
  body.addEventListener('keydown',event=>{if(event.target.matches('[data-edit-product]')&&['Enter',' '].includes(event.key)){event.preventDefault();open(event.target.dataset.editProduct);}});
  window.ProductEdit={configure:value=>{context=value;}};
})();
