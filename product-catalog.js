// Read only the requested page. Cache is scoped to the authenticated organization.
(() => {
  const escape = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const literal = v => '"' + String(v).replace(/\\/g,'\\\\').replace(/"/g,'\\"') + '"';
  const pattern = v => '*' + String(v).replace(/[\\%_*]/g,'\\$&').replace(/(\d)\s*[x×✕]\s*(?=\d)/gi,'$1*') + '*';
  function build(org, {query='',category='all',filters={},offset=0,limit=101}={}) {
    const p = new URLSearchParams();
    const select=['id','sku','label','is_active','product:products!inner(id,code,name,unit,is_active)','variant_prices(price,starts_on)'];
    const conditions=[];
    let alias=0;
    function text(values, {sku=false,negative=false}={}) {
      const key='name'+alias++;
      select.push(key+':products()');
      p.set(key+'.or','('+values.map(v=>'name.ilike.'+literal(pattern(v))).join(',')+')');
      const terms=values.flatMap(v=>[...(sku?['sku.ilike.'+literal(pattern(v))]:[]),'label.ilike.'+literal(pattern(v))]);
      terms.push(key+'.not.is.null');
      conditions.push((negative?'not.or':'or')+'('+terms.join(',')+')');
    }
    const words=String(query).trim().split(/\s+/).filter(Boolean);
    if(words.length>12||String(query).length>200)throw Error('คำค้นยาวเกินไป กรุณาใช้ไม่เกิน 12 คำ');
    // Keep dimension pairs together so both 24x48 and 24 x 48 work.
    const normalized=String(query).replace(/(\d)\s*[x×✕]\s*(?=\d)/gi,'$1x');
    normalized.trim().split(/\s+/).filter(Boolean).forEach(word=>text([word],{sku:true}));
    if(category!=='all') { const key='category';select.push(key+':products()');p.set(key+'.name','ilike.'+pattern(category));conditions.push(key+'.not.is.null'); }
    const colors={aluminium:['aluminium','aluminum','อลูมิเนียม'],white:['white','สีขาว'],black:['black','สีดำ']};
    if(colors[filters.color])text(colors[filters.color]);
    for(const [key,yes,no] of [['damper',['with damper','มีตัวปรับลม'],['without damper','no damper','ไม่มีตัวปรับลม']],['screen',['with screen','with insect screen','มีมุ้ง'],['without screen','without insect screen','no screen','ไม่มีมุ้ง']]]) {
      if(filters[key]==='yes'){text(yes);text(no,{negative:true});}
      if(filters[key]==='no')text(no);
    }
    // Safe coarse filtering for dimensions; exact orientation/unit matching is
    // still applied by PriceList.match. Include cm rows to preserve rounding.
    for(const value of [filters.width,filters.length].filter(Boolean)) {
      const n=filters.unit==='cm'?Math.round(Number(value)/2.5):filters.unit==='mm'?Number(value)/25:Number(value);
      if(!Number.isFinite(n)||n<=0)throw Error('ขนาดต้องมากกว่า 0');
      const options=[String(n),String(n*25),String(n*2.5),'cm','ซม'];
      conditions.push('or('+options.map(v=>'label.ilike.'+literal(pattern(v))).join(',')+')');
    }
    p.set('select',select.join(','));p.set('product.organization_id','eq.'+org);
    p.set('is_active','eq.true');
    p.set('variant_prices.order','starts_on.desc');p.set('variant_prices.limit','1');
    if(conditions.length)p.set('and','('+conditions.join(',')+')');
    p.set('order','sku.asc,id.asc');p.set('limit',String(limit));p.set('offset',String(offset));
    return '/rest/v1/product_variants?'+p.toString();
  }
  function create(c) {
    const cache=new Map(),pending=new Map();let epoch=0;
    return {
      clear(){epoch++;cache.clear();pending.clear();},
      async search(options={}) {
        const org=c.currentOrg(),version=epoch,path=build(org,options),key=org+'|'+path;
        const saved=cache.get(key);if(saved&&Date.now()-saved.time<30000)return saved.value;
        if(pending.has(key))return pending.get(key);
        const task=(async()=>{
          const raw=await c.request(path);
          if(org!==c.currentOrg()||version!==epoch)throw Error('ข้อมูลเปลี่ยน กรุณาค้นหาอีกครั้ง');
          if(!Array.isArray(raw))throw Error('โหลดสินค้าไม่สำเร็จ');
          const size=(options.limit??101)-1,more=raw.length>size;
          const rows=raw.slice(0,size).map(v=>({id:v.id,productId:v.product.id,sku:v.sku||v.product.code,name:v.product.name,unit:v.product.unit||'ชิ้น',size:v.label,price:Number(v.variant_prices?.[0]?.price??0).toFixed(2),status:v.product.is_active?'ใช้งาน':'ปิดใช้งาน',isActive:true}));
          const value={rows,more,next:(options.offset??0)+size};
          cache.set(key,{time:Date.now(),value});if(cache.size>30)cache.delete(cache.keys().next().value);
          return value;
        })().finally(()=>{if(pending.get(key)===task)pending.delete(key);});
        pending.set(key,task);return task;
      }
    };
  }
  let service,context,current=[],offset=0,more=false,busy=false,generation=0,timer,boundOrg;
  const body=document.getElementById('product-body'),input=document.getElementById('product-search'),pager=document.getElementById('product-pager');
  const prev=pager.querySelector('[data-product-prev]'),next=pager.querySelector('[data-product-next]'),status=pager.querySelector('[data-product-page]');
  function paint(){
    if(!service)return;
    body.innerHTML=current.map(p=>`<tr data-edit-product="${escape(p.id)}" tabindex="0" aria-label="แก้ไขสินค้า ${escape(p.sku)}"><td><strong>${escape(p.sku)}</strong></td><td>${escape(p.name)}</td><td>${escape(p.size)}</td><td>฿ ${escape(p.price)}</td><td>${badge(p.status)}</td><td>${productDeleteButton(p)}</td></tr>`).join('')||'<tr><td colspan="6" style="text-align:center;padding:32px">'+(busy?'กำลังค้นหาสินค้า…':'ไม่พบสินค้า')+'</td></tr>';
    prev.disabled=busy||offset===0;next.disabled=busy||!more;
    if(!busy)status.textContent=`แสดง ${current.length?offset+1:0}–${offset+current.length} รายการ · หน้า ${Math.floor(offset/100)+1}${more?' · มีรายการถัดไป':''}`;
  }
  async function load(reset=false,force=false) {
    if(!service)return;
    clearTimeout(timer);if(reset)offset=0;if(force)service.clear();
    const run=++generation,pageOffset=offset;busy=true;current=[];context.setRows([]);status.textContent='กำลังค้นหาสินค้า…';paint();
    try {
      const result=await service.search({query:input.value,offset:pageOffset});
      if(run!==generation)return;
      current=result.rows;more=result.more;context.setRows(current);context.notice('โหลดเฉพาะหน้านี้แล้ว '+current.length+' รายการ • ค้นหาจากฐานข้อมูลโดยตรง');
    }catch(error){if(run!==generation)return;more=false;context.notice('โหลดสินค้าไม่สำเร็จ: '+error.message+' • กด Enter เพื่อลองอีกครั้ง');}
    finally{if(run===generation){busy=false;paint();}}
  }
  window.ProductCatalog={build,create};
  window.ProductCatalogUI={get active(){return Boolean(service);},paint,load,
    configure(c){context=c;if(!service)service=create(c);if(boundOrg!==c.currentOrg()){boundOrg=c.currentOrg();generation++;service.clear();current=[];offset=0;more=false;c.setRows([]);}prev.onclick=()=>{offset=Math.max(0,offset-100);load();};next.onclick=()=>{offset+=100;load();};input.oninput=()=>{generation++;clearTimeout(timer);busy=true;more=false;current=[];c.setRows([]);status.textContent='กำลังค้นหาสินค้า…';paint();timer=setTimeout(()=>load(true),250);};input.onkeydown=event=>{if(event.key==='Enter'){event.preventDefault();load(true);}};return service;}
  };
})();
