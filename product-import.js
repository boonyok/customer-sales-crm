(() => {
  let context,busy=false,button;
  function validate(rows){
    if(!Array.isArray(rows)||!rows.length||rows.length>50000)throw Error('จำนวนรายการต้องเป็น 1–50,000');
    const codes=new Set();
    return rows.map(r=>{const sku=String(r.sku??'').trim(),name=String(r.name??'').trim(),size=String(r.size??'').trim(),price=Number(r.price);
      if(!/^[A-Za-z0-9_-]{1,100}$/.test(sku)||!name||!size||r.price==null||!Number.isFinite(price)||price<0)throw Error('ข้อมูลไม่ครบหรือไม่ถูกต้อง: '+sku);
      if(codes.has(sku.toUpperCase()))throw Error('รหัสซ้ำในไฟล์: '+sku);codes.add(sku.toUpperCase());return {sku,name,size,price};});
  }
  async function run(rows,c){
    rows=validate(rows);const org=c.currentOrg();let added=0,skipped=0;
    const guard=()=>{if(c.currentOrg()!==org)throw Error('บริษัทเปลี่ยน หยุดนำเข้า');};
    const post=async(path,body)=>{guard();return c.request('/rest/v1/'+path,{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(body)});};
    for(let start=0;start<rows.length;start+=100){
      guard();const batch=rows.slice(start,start+100),codes=batch.map(r=>r.sku).join(',');
      const existing=await c.request('/rest/v1/products?organization_id=eq.'+encodeURIComponent(org)+'&code=in.('+codes+')&select=id,code&limit=1000');
      const byCode=new Map(existing.map(p=>[p.code.toUpperCase(),p]));
      const pending=batch.filter(r=>!byCode.has(r.sku.toUpperCase()));
      if(pending.length){const created=await post('products',pending.map(r=>({organization_id:org,code:r.sku,name:r.name,unit:'ชิ้น'})));if(created.length!==pending.length)throw Error('จำนวนสินค้าที่เพิ่มไม่ครบ');created.forEach(p=>byCode.set(p.code.toUpperCase(),p));}
      const ids=[...byCode.values()].map(p=>p.id).join(',');
      const variants=await c.request('/rest/v1/product_variants?product_id=in.('+ids+')&select=id,product_id,sku,variant_prices(id)&limit=1000');
      const bySku=new Map(variants.map(v=>[v.sku.toUpperCase(),v]));
      const missing=batch.filter(r=>!bySku.has(r.sku.toUpperCase()));
      if(missing.length){const created=await post('product_variants',missing.map(r=>({product_id:byCode.get(r.sku.toUpperCase()).id,sku:r.sku,label:r.size})));if(created.length!==missing.length)throw Error('จำนวนขนาดที่เพิ่มไม่ครบ');created.forEach(v=>bySku.set(v.sku.toUpperCase(),{...v,variant_prices:[]}));}
      const needPrice=batch.filter(r=>!(bySku.get(r.sku.toUpperCase()).variant_prices||[]).length);
      if(needPrice.length){const saved=await post('variant_prices',needPrice.map(r=>({variant_id:bySku.get(r.sku.toUpperCase()).id,price:r.price})));if(saved.length!==needPrice.length)throw Error('จำนวนราคาที่เพิ่มไม่ครบ');}
      added+=needPrice.length;skipped+=batch.length-needPrice.length;
      c.notice('นำเข้า '+Math.min(start+100,rows.length).toLocaleString('th-TH')+' / '+rows.length.toLocaleString('th-TH')+' รายการ • เพิ่ม '+added.toLocaleString('th-TH')+' • ข้ามรายการเดิม '+skipped);
    }
    return {added,skipped,total:rows.length};
  }
  function configure(c){context=c;if(button){button.hidden=window.CRMAccess?.role!=='admin';return;}
    const input=document.createElement('input');input.type='file';input.accept='.json';input.hidden=true;document.body.append(input);
    button=document.createElement('button');button.type='button';button.className='ghost';button.textContent='นำเข้าข้อมูลสินค้า (JSON)';document.getElementById('add-product').before(button);button.hidden=window.CRMAccess?.role!=='admin';
    button.onclick=()=>{if(!busy)input.click();};
    input.onchange=async()=>{const file=input.files?.[0];if(!file||busy)return;busy=true;button.disabled=true;const c=context;
      try{const rows=JSON.parse(await file.text()),result=await run(rows,c);await c.refresh();c.notice('นำเข้าสำเร็จ '+result.total.toLocaleString('th-TH')+' รายการ • เพิ่ม '+result.added.toLocaleString('th-TH')+' • ข้ามรายการเดิม '+result.skipped.toLocaleString('th-TH'));}
      catch(error){c.notice('หยุดนำเข้า: '+error.message+' • รายการที่เพิ่มสำเร็จแล้วจะยังอยู่ สามารถนำเข้าไฟล์เดิมอีกครั้งได้');}
      finally{busy=false;button.disabled=false;input.value='';}
    };
  }
  window.ProductImport={configure,run,validate};
})();
