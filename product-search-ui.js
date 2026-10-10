(() => {
  const page=document.getElementById('products'),form=page.querySelector('#price-search-form');
  document.getElementById('product-search').closest('.search').hidden=true;
  const panel=page.querySelector('.price-search');panel.before(document.getElementById('product-unit-converter'));
  const input=form.querySelector('[name="query"]'),field=input.closest('.field');
  panel.classList.add('product-search-panel');panel.querySelector('h3').textContent='ค้นหาสินค้าและราคา';
  field.querySelector('span').textContent='รหัสสินค้า / ชื่อสินค้า / ขนาด';
  input.type='search';input.setAttribute('aria-label','ค้นหาสินค้าและราคา');input.placeholder='เช่น R48I24 / Return Air / 24x48';
  const box=document.createElement('div');box.className='product-search-box';input.before(box);box.append(input);
  const clear=document.createElement('button');clear.type='button';clear.className='ghost';clear.textContent='ล้างคำค้น';box.append(clear);
  let timer;const search=()=>{clearTimeout(timer);form.requestSubmit();};
  clear.onclick=()=>{input.value='';input.focus();search();};
  input.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(search,300);});
  form.addEventListener('reset',()=>clearTimeout(timer));form.addEventListener('submit',()=>clearTimeout(timer));
  const hint=document.createElement('small');hint.className='product-search-hint';hint.textContent='ค้นหาทันทีขณะพิมพ์ • ใช้บางส่วนของคำได้ • พิมพ์หลายคำ เช่น Return 24x48';field.after(hint);
  const style=document.createElement('style');
  style.textContent=`#product-data .search[hidden]{display:none!important}#products .product-search-panel{margin:0 0 24px;padding:22px;background:linear-gradient(120deg,#e1f5ff,#f0fbff);border:2px solid #079ac8;border-radius:16px;box-shadow:0 6px 20px #008ab81a}#products .product-search-panel>h3{margin:0 0 14px;font-size:21px;font-weight:700;color:#07658b}#products .product-search-box{display:flex;align-items:center;gap:12px;border:2px solid #139bc8;padding:12px 16px;background:#fff;border-radius:12px;box-shadow:0 3px 10px #007dad12}#products .product-search-box:focus-within{box-shadow:0 0 0 3px #c9edff}#products .product-search-box input{flex:1;min-width:0;width:100%;border:0;background:transparent;padding:8px;outline:none;font-size:16px;min-height:34px;color:#114663}#products .product-search-box button{flex-shrink:0}#products .product-search-hint{display:block;margin:10px 0 18px;color:#386783}#products #product-unit-converter{background:#f7f9fc;border:1px solid #e0e7ee;box-shadow:none;padding:14px 16px!important;margin-bottom:16px!important}#products #product-unit-converter h3{font-size:14px;font-weight:600;color:#657b8f}#products #product-unit-converter p{font-size:11px;margin-bottom:10px;color:#8292a0}#products #product-unit-converter label{font-size:12px;color:#6c8192}#products #product-unit-converter input{padding:8px;font-size:13px;border-color:#d8e1e9;background:#fff}#products #product-unit-converter output{font-size:14px;color:#607c90;margin-top:9px}@media(max-width:600px){#products .product-search-panel{padding:16px}#products .product-search-box{padding:8px 10px}}`;
  document.head.append(style);
})();
