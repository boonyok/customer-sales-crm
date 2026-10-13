(() => {
  let context,button,busy=false;
  const styles={R:'แบบเปิดห้อย',RT:'แบบเปิดห้อย ปีกเรียบ',RH:'แบบติดบานพับ',RR:'แบบถอดหลุด',RU:'แบบวางแทนฝ้า T-Bar',RUU:'แบบวางแทนฝ้า T-Bar เปิด-ปิดได้'};
  const colors={W:'สีขาว',BK:'สีดำ',T:'สีตามแบบ','':''};
  const latest=rows=>[...(rows||[])].sort((a,b)=>String(b.starts_on).localeCompare(String(a.starts_on))||String(b.id).localeCompare(String(a.id)))[0];
  async function run(c,progress=()=>{}){
    const org=c.currentOrg();if(!org)throw Error('ยังไม่ได้เลือกบริษัท');
    const request=(path,options)=>{if(org!==c.currentOrg())throw Error('บริษัทเปลี่ยน กรุณาเริ่มใหม่');return c.request(path,options);};
    const all=[];let cursor=null;
    do{
      const p=new URLSearchParams({select:'id,product_id,sku,label,is_active,specification,product:products!inner(id,code,name,unit,is_active),variant_prices(id,price,starts_on)', 'product.organization_id':'eq.'+org,or:'(sku.ilike.R*,sku.ilike.E*,sku.ilike.FZL*,sku.ilike.FZS*)',order:'id.asc',limit:'200'});
      if(cursor)p.set('id','gt.'+cursor);
      const rows=await request('/rest/v1/product_variants?'+p);if(!Array.isArray(rows))throw Error('อ่านสินค้าไม่สำเร็จ');
      all.push(...rows);progress('อ่านสินค้าฐาน '+all.length+' รายการ…');
      cursor=rows.length===200?rows.at(-1).id:null;
    }while(cursor);
    const counts={added:0,skipped:0,unpriced:0};
    const bySku=new Map();for(const row of all){if(!window.ReturnAirCode.parse(row.sku))continue;const k=row.sku.toUpperCase();if(bySku.has(k))throw Error('พบรหัสซ้ำ '+row.sku+' กรุณาตรวจข้อมูลก่อนสร้างรายการ');bySku.set(k,row);}
    const bases=all.filter(v=>v.is_active&&v.product.is_active&&window.ReturnAirCode.withScreen(v.sku));
    const planned=bases.map(base=>{
      const sku=window.ReturnAirCode.withScreen(base.sku),existing=bySku.get(sku.toUpperCase()),saved=latest(base.variant_prices);
      if(existing&&!(existing.specification?.insect_screen_generated===true&&!latest(existing.variant_prices))){counts.skipped++;return null;}
      if(!saved||!Number.isFinite(Number(saved.price))||Number(saved.price)<=0){counts.unpriced++;return null;}
      return {base,sku,existing,price:window.ReturnAirCode.price(saved.price)};
    }).filter(Boolean);
    // Each item can resume after a failed product/variant/price write.
    for(let i=0;i<planned.length;i++){
      const {base,sku,existing,price}=planned[i],p=window.ReturnAirCode.parse(sku);
      progress('สร้างสินค้า '+(i+1)+' / '+planned.length+' • '+sku);
      let variant=existing;
      if(!variant){
        const q=new URLSearchParams({organization_id:'eq.'+org,code:'eq.'+sku,select:'id,code,is_active'});
        let parents=await request('/rest/v1/products?'+q);
        if(!parents.length)parents=await request('/rest/v1/products',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({organization_id:org,code:sku,name:base.product.name+(/w\/vd|with damper|มีตัวปรับลม/i.test(base.product.name)||!p.damper?'':' W/VD')+' W/Ins',unit:base.product.unit||'ชิ้น'})});
        if(parents.length!==1||parents[0].is_active===false)throw Error('รหัสสินค้าหลักซ้ำหรือปิดใช้งาน: '+sku);
        const rows=await request('/rest/v1/product_variants',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({product_id:parents[0].id,sku,label:p.width+'" x '+p.length+'" '+colors[p.color]+' ติดมุ้งลวดกันแมลง',dimension_unit:'inch',width:p.width,length:p.length,specification:{insect_screen_generated:true,base_variant_id:base.id,base_sku:base.sku,screen_surcharge:Math.max(Math.round(Number(latest(base.variant_prices).price)*15)/100,70)}})});
        if(rows.length!==1)throw Error('บันทึกรหัสไม่สำเร็จ: '+sku);variant=rows[0];
      }
      const savedPrices=await request('/rest/v1/variant_prices',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({variant_id:variant.id,price})});
      if(savedPrices.length!==1||Number(savedPrices[0].price)!==price)throw Error('ตรวจสอบราคาที่บันทึกไม่สำเร็จ: '+sku);
      counts.added++;
    }
    return counts;
  }
  window.ProductInsectScreen={run,configure(c){
    context=c;
    if(!button){button=document.createElement('button');button.type='button';button.className='ghost';button.textContent='เพิ่มสินค้าติดมุ้งลวด';document.getElementById('add-product').before(button);
      button.onclick=async()=>{
        if(busy||!window.CRMAccess?.can('products','create'))return;
        const c=context;busy=true;button.disabled=true;
        try{const result=await run(c,c.notice);await c.refresh();c.notice('เพิ่มมุ้งลวดสำเร็จ '+result.added+' รายการ • ข้ามรหัสเดิม '+result.skipped+' • ไม่มีราคาฐาน '+result.unpriced);}
        catch(error){await c.refresh().catch(()=>{});c.notice('หยุดเพิ่มมุ้งลวด: '+error.message+' • กดอีกครั้งเพื่อทำต่อ รายการเดิมไม่ถูกเขียนทับ');}
        finally{busy=false;button.disabled=false;}
      };
    }
    button.hidden=!window.CRMAccess?.can('products','create');
  }};
})();
