// Read only the requested page. Cache is scoped to the authenticated organization.
(() => {
  const escape = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const literal = v => '"' + String(v).replace(/\\/g,'\\\\').replace(/"/g,'\\"') + '"';
  const pattern = v => '*' + String(v).replace(/[\\%_*]/g,'\\$&').replace(/(\d)\s*[x×✕]\s*(?=\d)/gi,'$1*') + '*';
  function build(org, {query='',category='all',filters={},cursor=null,limit=101,firstField=null}={}) {
    const p = new URLSearchParams();
    const select=['id','sku','label','is_active','product:products!inner(id,code,name,unit,is_active)'];
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
    const terms=normalized.trim().split(/\s+/).filter(Boolean),parentConditions=[];
    if(firstField&&terms.length){const first=terms.shift();if(firstField==='name')parentConditions.push('name.ilike.'+literal(pattern(first)));else p.set(firstField,'ilike.'+pattern(first));}
    terms.forEach(word=>text([word],{sku:true}));
    if(category!=='all')parentConditions.push('name.ilike.'+literal(pattern(category)));
    if(parentConditions.length)p.set('product.and','('+parentConditions.join(',')+')');
    const colors={white:['white','สีขาว'],black:['black','สีดำ'],custom:['สีตามแบบ']};
    if(colors[filters.color])text(colors[filters.color]);
    if(filters.color==='aluminium')text(['สีขาว','สีดำ','สีตามแบบ','white','black'],{negative:true});
    const styles={RT:['ปีกเรียบ'],RH:['ติดบานพับ'],RR:['ถอดหลุด'],RUU:['T-Bar ปิด-เปิดได้','T-Bar เปิด-ปิดได้']};
    if(filters.returnStyle==='R')text(['ปีกเรียบ','ติดบานพับ','ถอดหลุด','วางแทนฝ้า T-Bar'],{negative:true});
    else if(styles[filters.returnStyle])text(styles[filters.returnStyle]);
    if(filters.returnStyle==='RU'){
      p.set('product.and','('+[...parentConditions,'name.ilike.'+literal(pattern('วางแทนฝ้า T-Bar'))].join(',')+')');
      text(['ปิด-เปิดได้','เปิด-ปิดได้'],{negative:true});
    }
    for(const [key,yes,no] of [['damper',['with damper','มีตัวปรับลม'],['without damper','no damper','ไม่มีตัวปรับลม']],['screen',['with screen','with insect screen','มีมุ้ง'],['without screen','without insect screen','no screen','ไม่มีมุ้ง']]]) {
      if(filters[key]==='yes'){text(yes);text(no,{negative:true});}
      if(filters[key]==='no')text(no);
    }
    // Safe coarse filtering for dimensions; exact orientation/unit matching is
    // still applied by PriceList.match. Include cm rows to preserve rounding.
    for(const value of [filters.width,filters.length].filter(Boolean)) {
      const n=filters.unit==='cm'?Math.round(Number(value)/2.5):filters.unit==='mm'?Math.round(Number(value)/25):Number(value);
      if(!Number.isFinite(n)||n<=0)throw Error('ขนาดต้องมากกว่า 0');
      const options=[String(n),String(n*25),String(n*2.5),'cm','ซม'];
      conditions.push('or('+options.map(v=>'label.ilike.'+literal(pattern(v))).join(',')+')');
    }
    p.set('select',select.join(','));p.set('product.organization_id','eq.'+org);
    p.set('is_active','eq.true');
    if(conditions.length)p.set('and','('+conditions.join(',')+')');
    p.set('order','id.asc');p.set('limit',String(limit));if(cursor)p.set('id','gt.'+cursor);
    return '/rest/v1/product_variants?'+p.toString();
  }
  function rpcFilters(org,{query='',category='all',filters={},cursor=null,limit=101,exactSku=false}={}) {
    if(category==='Volume Damper')filters={...filters,color:'',damper:'',screen:'',returnStyle:''};
    const words=String(query).replace(/(\d)\s*[x×✕]\s*(?=\d)/gi,'$1x').trim().split(/\s+/).filter(Boolean);
    if(words.length>12||String(query).length>200)throw Error('คำค้นยาวเกินไป กรุณาใช้ไม่เกิน 12 คำ');
    const like=v=>'%'+String(v).replace(/[\\%_]/g,'\\$&').replace(/(\d)\s*[x×✕]\s*(?=\d)/gi,'$1%')+'%';
    const groups=[];
    const add=(values,negative=false,label_only=false)=>groups.push({patterns:values.map(like),negative,label_only});
    const addSku=(patterns,negative=false)=>groups.push({patterns,negative,sku_only:true});
    if(category==='Square Ceiling')addSku(['Q%']);
    if(category==='Volume Damper')addSku(['VD%']);
    const colors={white:['%W'],black:['%BK'],custom:['%T']};
    if(colors[filters.color])addSku(colors[filters.color]);
    if(filters.color==='aluminium')addSku(['%W','%BK','%T'],true);
    if(['R','RT','RH','RR','RU','RUU'].includes(filters.returnStyle)){
      addSku([filters.returnStyle+'_%']);
      if(filters.returnStyle==='R')addSku(['RU%','RT%','RH%','RR%'],true);
      if(filters.returnStyle==='RU')addSku(['RUU%'],true);
    }
    const ownFamilies=['Return Air','Exhaust Air','Fresh Air','Square Ceiling'].includes(category)||Boolean(filters.returnStyle);
    if(ownFamilies){
      if(filters.damper)addSku(['RD%','RUD%','RUUD%','RTD%','RHD%','RRD%','ED%','QD%','FZLD%','FZSD%'],filters.damper==='no');
      if(filters.screen)addSku(['%Ins%'],filters.screen==='no');
    }
    const toInch=value=>filters.unit==='cm'?Math.round(Number(value)/2.5):filters.unit==='mm'?Math.round(Number(value)/25):Number(value);
    const dimensionPattern=ownFamilies&&filters.width&&filters.length?'%'+toInch(filters.width)+'I'+toInch(filters.length)+'%':null;
    for(const value of [filters.width,filters.length].filter(Boolean)) {
      const n=filters.unit==='cm'?Math.round(Number(value)/2.5):filters.unit==='mm'?Math.round(Number(value)/25):Number(value);
      if(!Number.isFinite(n)||n<=0)throw Error('ขนาดต้องมากกว่า 0');
      if(!dimensionPattern)add([String(n),String(n*25),String(n*2.5),'cm','ซม'],false,true);
    }
    const exact=exactSku&&window.ReturnAirCode.parse(query)?String(query).trim():null;
    return {p_org:org,p_words:exact?[]:words.map(like),p_category:category==='all'?null:like(category),p_groups:groups,p_cursor:cursor,p_limit:Math.min(101,Math.max(2,Number(limit)||101)),p_exact_sku:exact,p_dimension_sku_pattern:dimensionPattern};
  }
// Exact catalog SKUs for a Square Ceiling Diffuser size; no records are created.
const squareCeilingCodes=options=>{
  const f=options.filters||{};
  if(!['Square Ceiling','Volume Damper'].includes(options.category)||!f.width||!f.length)return null;
  const inch=n=>f.unit==='cm'?Math.round(Number(n)/2.5):f.unit==='mm'?Math.round(Number(n)/25):Number(n);
  const w=inch(f.width),l=inch(f.length);
  if(!Number.isInteger(w)||!Number.isInteger(l)||w<=0||l<=0)return null;
  if(options.category==='Volume Damper')return ['VD','VDS'].map(root=>`${root}${w}I${l}`);
  const roots=f.damper==='yes'?['QD']:f.damper==='no'?['Q']:['Q','QD'];
  const screens=f.screen==='yes'?['Ins']:f.screen==='no'?['']:['','Ins'];
  const colors={aluminium:[''],white:['W'],black:['BK'],custom:['T']}[f.color]||['','W','BK','T'];
  return roots.flatMap(root=>screens.flatMap(screen=>colors.map(color=>`${root}${w}I${l}${screen}${color}`)));
};

  function create(c) {
    const cache=new Map(),pending=new Map();let epoch=0;
    return {
      clear(){epoch++;cache.clear();pending.clear();},
      async search(options={}) {
        const org=c.currentOrg(),version=epoch,payload=rpcFilters(org,options),key=JSON.stringify(payload)+'|'+(options.offset??0);
        const saved=cache.get(key);if(saved&&Date.now()-saved.time<30000)return saved.value;
        if(pending.has(key))return pending.get(key);
        const task=(async()=>{
          // The read-only RPC checks the same organization/view permission once,
          // then selects <=101 matching rows and only their latest prices.
          const codes=squareCeilingCodes(options);
          const raw=codes?(await Promise.all(codes.map(code=>c.request('/rest/v1/rpc/crm_lookup_product_codes',{method:'POST',body:JSON.stringify({p_org:org,p_query:code})})))).flat().filter(v=>codes.some(code=>code.toUpperCase()===String(v.sku).trim().toUpperCase())):
            await c.request('/rest/v1/rpc/crm_search_product_page_v2',{method:'POST',body:JSON.stringify(payload)});
          if(org!==c.currentOrg()||version!==epoch)throw Error('ข้อมูลเปลี่ยน กรุณาค้นหาอีกครั้ง');
          if(!Array.isArray(raw))throw Error('โหลดสินค้าไม่สำเร็จ');
          const size=payload.p_limit-1,more=raw.length>size,page=raw.slice(0,size);
          const rows=page.map(v=>({id:v.id,productId:v.product_id,sku:v.sku,name:v.name,unit:v.unit||'ชิ้น',size:v.label,price:Number(v.price??0).toFixed(2),status:v.product_is_active?'ใช้งาน':'ปิดใช้งาน',isActive:true}));
          const value={rows,more,next:(options.offset??0)+size,nextCursor:rows.at(-1)?.id??options.cursor??null};
          cache.set(key,{time:Date.now(),value});if(cache.size>30)cache.delete(cache.keys().next().value);
          return value;
        })().finally(()=>{if(pending.get(key)===task)pending.delete(key);});
        pending.set(key,task);return task;
      }
    };
  }
  let service,context,current=[],offset=0,more=false,busy=false,generation=0,timer,boundOrg,cursors=[null];
  const body=document.getElementById('product-body'),input=document.getElementById('product-search'),pager=document.getElementById('product-pager');
  const prev=pager.querySelector('[data-product-prev]'),next=pager.querySelector('[data-product-next]'),status=pager.querySelector('[data-product-page]');
  function paint(){
    if(!service)return;
    body.innerHTML=current.map(p=>`<tr data-edit-product="${escape(p.id)}" tabindex="0" aria-label="แก้ไขสินค้า ${escape(p.sku)}"><td><strong>${escape(p.sku)}</strong></td><td>${escape(p.name)}</td><td>${escape(p.size)}</td><td>฿ ${escape(Number(p.price).toLocaleString('th-TH',{minimumFractionDigits:0,maximumFractionDigits:2}))}</td><td>${badge(p.status)}</td><td>${productDeleteButton(p)}</td></tr>`).join('')||'<tr><td colspan="6" style="text-align:center;padding:32px">'+(busy?'กำลังค้นหาสินค้า…':'ไม่พบสินค้า')+'</td></tr>';
    prev.disabled=busy||offset===0;next.disabled=busy||!more;
    if(!busy)status.textContent=current.length?`แสดง ${offset+1}–${offset+current.length} รายการ · หน้า ${Math.floor(offset/100)+1}${more?' · มีรายการถัดไป':''}`:'ไม่พบรายการ • กด Enter เพื่อค้นหาอีกครั้ง';
  }
  async function load(reset=false,force=false) {
    if(!service)return;
    clearTimeout(timer);if(reset){offset=0;cursors=[null];}if(force)service.clear();
    const run=++generation,pageOffset=offset;busy=true;current=[];context.setRows([]);status.textContent='กำลังค้นหาสินค้า…';paint();
    try {
      const result=await service.search({query:input.value,cursor:cursors[Math.floor(pageOffset/100)],offset:pageOffset});
      if(run!==generation)return;
      current=result.rows;more=result.more;cursors[Math.floor(pageOffset/100)+1]=result.nextCursor;context.setRows(current);context.notice('โหลดเฉพาะหน้านี้แล้ว '+current.length+' รายการ • ค้นหาจากฐานข้อมูลโดยตรง');
    }catch(error){if(run!==generation)return;more=false;context.notice('โหลดสินค้าไม่สำเร็จ: '+error.message+' • กด Enter เพื่อลองอีกครั้ง');}
    finally{if(run===generation){busy=false;paint();}}
  }
  window.ProductCatalog={build,rpcFilters,create};
  window.ProductCatalogUI={get active(){return Boolean(service);},paint,load,
    configure(c){context=c;if(!service)service=create(c);if(boundOrg!==c.currentOrg()){boundOrg=c.currentOrg();generation++;service.clear();current=[];offset=0;more=false;c.setRows([]);}prev.onclick=()=>{offset=Math.max(0,offset-100);load();};next.onclick=()=>{offset+=100;load();};input.oninput=()=>{generation++;clearTimeout(timer);busy=true;more=false;current=[];c.setRows([]);status.textContent='กำลังค้นหาสินค้า…';paint();timer=setTimeout(()=>load(true),250);};input.onkeydown=event=>{if(event.key==='Enter'){event.preventDefault();load(true);}};return service;}
  };
})();
