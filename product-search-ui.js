(() => {
  const page=document.getElementById('products');
  const details=page.querySelector('.price-search details');
  const advanced=document.createElement('section');advanced.className='price-advanced-search';
  const heading=document.createElement('h4');heading.textContent='ค้นหาแบบระบุรายละเอียด';advanced.append(heading);
  for(const child of [...details.children])if(child.tagName!=='SUMMARY')advanced.append(child);
  details.replaceWith(advanced);
  // Show detailed filters only after choosing a product category.
  advanced.id='price-category-filters';
  advanced.append(page.querySelector('.price-actions'));
  advanced.hidden=true;
  const returnStyle=document.createElement('fieldset');returnStyle.className='field price-return-style';returnStyle.hidden=true;
  const returnChoices=[['','ทั้งหมด'],['R','เปิดห้อย'],['RT','เปิดห้อย ปีกเรียบ'],['RH','ติดบานพับ'],['RR','ถอดหลุด'],['RU','วางแทนฝ้า T-Bar'],['RUU','วางแทนฝ้า T-Bar เปิด-ปิดได้']];
  returnStyle.innerHTML='<legend>รูปแบบสินค้า</legend><div class="price-return-options">'+returnChoices.map(([value,label])=>`<label class="price-return-option"><input type="radio" name="returnStyle" value="${value}"${value===''?' checked':''}><span>${label}</span></label>`).join('')+'</div>';
  advanced.querySelector('.price-fields').prepend(returnStyle);
  const categoryButtons=page.querySelectorAll('[data-category]');
  const showAdvanced=visible=>{
    advanced.hidden=!visible;
    categoryButtons.forEach(button=>button.setAttribute('aria-expanded',String(visible&&button.getAttribute('aria-pressed')==='true')));
  };
  categoryButtons.forEach(button=>{
    button.setAttribute('aria-controls',advanced.id);
    button.setAttribute('aria-expanded','false');
    button.addEventListener('click',()=>showAdvanced(true));
    button.addEventListener('click',()=>{
      const isReturn=button.dataset.category==='Return Air';
      returnStyle.hidden=!isReturn;
      if(!isReturn)returnStyle.querySelector('input[value=""]').checked=true;
    },true);
  });
  page.querySelector('#price-search-form').addEventListener('reset',()=>showAdvanced(false));
  page.querySelector('.price-search').before(document.getElementById('product-unit-converter'));
  const input=document.getElementById('product-search'),box=input.closest('.search'),toolbar=box.closest('.page-toolbar');
  box.hidden=false;box.classList.add('product-search-box');toolbar.classList.add('product-search-toolbar');
  input.type='search';input.setAttribute('aria-label','ค้นหาข้อมูลสินค้า');input.placeholder='พิมพ์รหัส ชื่อสินค้า หรือขนาด เช่น R48I24 / Return Air / 24x48';
  const panel=document.createElement('section');panel.className='product-search-panel';panel.setAttribute('aria-label','ค้นหาสินค้า');
  const title=document.createElement('h3');title.textContent='ค้นหาสินค้า';toolbar.before(panel);panel.append(title,toolbar);
  const clear=document.createElement('button');clear.type='button';clear.className='ghost';clear.textContent='ล้างคำค้น';box.append(clear);
  clear.onclick=()=>{input.value='';input.dispatchEvent(new Event('input'));input.focus();};
  const hint=document.createElement('small');hint.className='product-search-hint';hint.textContent='ค้นหาทันทีขณะพิมพ์ • ใช้บางส่วนของคำได้ • พิมพ์หลายคำ เช่น Return 24x48';panel.append(hint);
  const style=document.createElement('style');
  style.textContent=`#product-data .search[hidden]{display:none!important}#products .product-search-panel{margin:0 0 24px;padding:22px;background:linear-gradient(120deg,#e1f5ff,#f0fbff);border:2px solid #079ac8;border-radius:16px;box-shadow:0 6px 20px #008ab81a}#products .product-search-panel>h3{margin:0 0 14px;font-size:21px;font-weight:700;color:#07658b}#products .product-search-box{display:flex;align-items:center;gap:12px;border:2px solid #139bc8;padding:12px 16px;background:#fff;border-radius:12px;box-shadow:0 3px 10px #007dad12}#products .product-search-box:focus-within{box-shadow:0 0 0 3px #c9edff}#products .product-search-box input{flex:1;min-width:0;width:100%;border:0;background:transparent;padding:8px;outline:none;font-size:16px;min-height:34px;color:#114663}#products .product-search-box button{flex-shrink:0}#products .product-search-hint{display:block;margin:10px 0 18px;color:#386783}#products #product-unit-converter{background:#f7f9fc;border:1px solid #e0e7ee;box-shadow:none;padding:14px 16px!important;margin-bottom:16px!important}#products #product-unit-converter h3{font-size:14px;font-weight:600;color:#657b8f}#products #product-unit-converter p{font-size:11px;margin-bottom:10px;color:#8292a0}#products #product-unit-converter label{font-size:12px;color:#6c8192}#products #product-unit-converter input{padding:8px;font-size:13px;border-color:#d8e1e9;background:#fff}#products #product-unit-converter output{font-size:14px;color:#607c90;margin-top:9px}@media(max-width:600px){#products .product-search-panel{padding:16px}#products .product-search-box{padding:8px 10px}}`;
  style.textContent=style.textContent.replaceAll('#products .product-search','#product-data .product-search');
  style.textContent+='#product-data .product-search-toolbar{display:flex;gap:16px;align-items:center;flex-wrap:wrap;margin:0}#product-data .product-search-box{flex:1;min-width:min(100%,320px)}#product-data .product-search-hint{margin:12px 0 0}@media(max-width:600px){#product-data .product-search-box{flex-basis:100%}}';
  style.textContent+='#products .price-advanced-search[hidden],#products .price-advanced-search .field[hidden]{display:none!important}';
  style.textContent+='#products .price-return-style{grid-column:1/-1;border:0;padding:0;margin:0;min-width:0}#products .price-return-style legend{padding:0;margin-bottom:10px}#products .price-return-options{display:flex;flex-wrap:wrap;gap:10px}#products .price-return-option{display:flex;align-items:center;gap:9px;min-height:44px;padding:10px 14px;border:1px solid #c6dfed;border-radius:10px;background:#fbfdff;cursor:pointer}#products .price-return-option input{width:18px;height:18px;min-height:0;margin:0;padding:0;accent-color:#087fac}#products .price-return-option:has(input:checked){background:#dff4ff;border-color:#098cc1;color:#07658b}#products .price-return-option:focus-within{outline:2px solid #139bc8;outline-offset:2px}';
  document.head.append(style);
})();
