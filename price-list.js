(() => {
  const categories = [['Return Air','Return Air Grille'],['Exhaust Air','Exhaust Air Grille'],['Supply Air','Supply Air Register'],['Square Ceiling','Square Ceiling Diffuser'],['Round Ceiling','Round Ceiling Diffuser'],['Linear Slot','Linear Slot Diffuser'],['Linear Bar','Linear Bar Grille'],['Volume Damper','Volume Damper']];
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const page = document.getElementById('products');
  const data = document.createElement('section'); data.id='product-data';data.className='page document-workspace data-workspace';
  while(page.firstChild)data.append(page.firstChild);
  page.after(data);
  pageMeta.products=['คลังข้อมูล','Price List'];pageMeta['product-data']=['คลังข้อมูล','ข้อมูลสินค้า'];
  const nav=document.querySelector('[data-page="products"]');
  nav.innerHTML='<span>▱</span>Price List';
  const dataNav=document.createElement('button');dataNav.className='nav-link';dataNav.dataset.page='product-data';dataNav.innerHTML='<span>▤</span>ข้อมูลสินค้า';dataNav.onclick=()=>window.go('product-data');nav.after(dataNav);
  data.querySelector('.panel-title .ghost')?.remove();
  page.innerHTML=`<div class="price-hero"><small>BOONYOK SUPPLY CO., LTD.</small><h2>Price List</h2><p>ค้นหารหัสสินค้า หรือเลือกประเภทและขนาดที่ต้องการ</p></div><article class="price-search"><h3>ค้นหาด้วยรหัส / ชื่อสินค้า</h3><form id="price-search-form"><label class="field"><span>รหัสหรือคำที่อยู่ในชื่อสินค้า</span><input name="query" placeholder="เช่น R48I24 หรือ Return Air"></label><div class="price-category-grid">${categories.map(([key,label],i)=>`<button type="button" class="price-category" data-category="${escape(key)}" aria-pressed="${i===0}"><span aria-hidden="true">▥</span>${label}</button>`).join('')}</div><details><summary>ค้นหาแบบระบุรายละเอียด</summary><div class="price-fields"><label class="field"><span>สี</span><select name="color"><option value="">ทั้งหมด</option><option value="aluminium">อลูมิเนียม</option><option value="white">ขาว</option><option value="black">ดำ</option></select></label><label class="field"><span>ตัวปรับลม (Damper)</span><select name="damper"><option value="">ทั้งหมด</option><option value="yes">มี</option><option value="no">ไม่มี</option></select></label><label class="field"><span>มุ้งกันแมลง</span><select name="screen"><option value="">ทั้งหมด</option><option value="yes">มี</option><option value="no">ไม่มี</option></select></label><label class="field"><span>หน่วยขนาด</span><select name="unit"><option value="inch">นิ้ว</option><option value="cm">cm</option><option value="mm">mm</option></select></label><label class="field"><span>ขนาดด้านที่ 1</span><input name="width" type="number" min="0" step="any" placeholder="เช่น 48"></label><label class="field"><span>ขนาดด้านที่ 2</span><input name="length" type="number" min="0" step="any" placeholder="เช่น 24"></label></div><p>cm แปลงเป็นนิ้วโดยหาร 2.5 และปัดเป็นจำนวนเต็ม • ตัวเลือกสีและอุปกรณ์ค้นหาจากรายละเอียดที่บันทึกไว้</p></details><div class="price-actions"><button class="primary" type="submit">⌕ ค้นหาราคา</button><button class="ghost" type="reset">ล้างตัวกรอง</button></div></form></article><section class="price-results" aria-label="ผลการค้นหาราคา"><h3>ผลการค้นหา</h3><p role="status" id="price-status">เลือกประเภทหรือกรอกคำค้นหา แล้วกดค้นหาราคา</p><div id="price-results"></div></section>`;
  let context,category='all',generation=0;
  const form=page.querySelector('form'),status=page.querySelector('#price-status'),results=page.querySelector('#price-results');
  function choose(key){category=key;page.querySelectorAll('[data-category]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category===key)));}
  choose('all');
  page.querySelectorAll('[data-category]').forEach(b=>b.onclick=()=>{choose(b.dataset.category);search();});
  form.onreset=()=>{generation++;choose('all');status.textContent='เลือกประเภทหรือกรอกคำค้นหา แล้วกดค้นหาราคา';results.replaceChildren();};
  form.onsubmit=e=>{e.preventDefault();search();};
  const match = (p,f,category) => {
    const normalize=value=>String(value??'').toLowerCase().replace(/[×✕]/g,'x').replace(/\s*x\s*/g,'x');
    const text=normalize([p.sku,p.name,p.size].join(' '));
    if(f.query&&!normalize(f.query).trim().split(/\s+/).every(word=>text.includes(word)))return false;
    if(category!=='all'&&!String(p.name).toLowerCase().includes(category.toLowerCase()))return false;
    const patterns={aluminium:/alumini?um|อลูมิเนียม/,white:/white|สีขาว/,black:/black|สีดำ/};
    if(f.color&&!patterns[f.color].test(text))return false;
    for(const [key,yes,no] of [['damper',/with damper|มีตัวปรับลม/,/without damper|no damper|ไม่มีตัวปรับลม/],['screen',/with (?:insect )?screen|มีมุ้ง/,/without (?:insect )?screen|no screen|ไม่มีมุ้ง/]]){
      if(f[key]==='yes'&&(!yes.test(text)||no.test(text)))return false;
      if(f[key]==='no'&&!no.test(text))return false;
    }
    if(f.width||f.length){
      const dimensions=String(p.size).match(/(\d+(?:\.\d+)?)\s*(?:"|นิ้ว|cm|mm|ซม\.|มม\.)?\s*[x×]\s*(\d+(?:\.\d+)?)/i);
      if(!dimensions)return false;
      const size=String(p.size),unit=/mm|มม/i.test(size)?'mm':/cm|ซม/i.test(size)?'cm':'inch';
      const inch=(n,u)=>u==='cm'?Math.round(n/2.5):u==='mm'?n/25:n;
      if(f.width&&inch(Number(f.width),f.unit)!==inch(Number(dimensions[1]),unit))return false;
      if(f.length&&inch(Number(f.length),f.unit)!==inch(Number(dimensions[2]),unit))return false;
    }
    return true;
  };
  async function search(){
    const run=++generation;results.replaceChildren();status.textContent='กำลังค้นหาสินค้า…';
    try{if(!context)throw Error('รอเชื่อมต่อฐานข้อมูลสักครู่ แล้วค้นหาอีกครั้ง');await context.prepare();if(run!==generation)return;
      const filters=Object.fromEntries(new FormData(form)),rows=context.products().filter(p=>match(p,filters,category));
      status.textContent=rows.length?`พบ ${rows.length.toLocaleString('th-TH')} รายการ${rows.length>100?' • แสดง 100 รายการแรก กรุณาระบุคำค้นเพิ่มเติม':''}`:'ไม่พบสินค้า • เพิ่มข้อมูลสินค้าและราคาก่อนเริ่มค้นหา';
      results.innerHTML=rows.slice(0,100).map(p=>`<article class="price-result"><small>${escape(p.sku)}</small><h3>${escape(p.name)}</h3><p>${escape(p.size)}</p><strong>฿ ${Number(p.price).toLocaleString('th-TH',{minimumFractionDigits:2})}</strong><small>ราคาก่อน VAT และก่อนหักส่วนลด / ${escape(p.unit||'ชิ้น')}</small></article>`).join('');
    }catch(error){if(run===generation)status.textContent='ค้นหาไม่สำเร็จ: '+error.message;}
  }
  window.PriceList={configure:value=>{context=value;},match};
})();
