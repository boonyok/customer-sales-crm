(() => {
  const page=document.getElementById('products');
  const details=page.querySelector('.price-search details');
  const advanced=document.createElement('section');advanced.className='price-advanced-search';
  const heading=document.createElement('h4');heading.textContent='ค้นหาแบบระบุรายละเอียด';advanced.append(heading);
  for(const child of [...details.children])if(child.tagName!=='SUMMARY')advanced.append(child);
  details.replaceWith(advanced);
  // Dimensions first, unit last: visual order and keyboard order stay aligned.
  advanced.querySelector('.price-fields').append(advanced.querySelector('[name="unit"]').closest('label'));
  // Show detailed filters only after choosing a product category.
  advanced.id='price-category-filters';
  // Keep search/reset visible even when searching directly by SKU.
  advanced.hidden=true;
  const returnStyle=document.createElement('div');returnStyle.className='field price-return-style';returnStyle.hidden=true;returnStyle.setAttribute('role','group');returnStyle.setAttribute('aria-label','รูปแบบสินค้า');
  const returnChoices=[['R','เปิดห้อย'],['RT','เปิดห้อย ปีกเรียบ'],['RH','ติดบานพับ'],['RR','ถอดหลุด'],['RU','วางแทนฝ้า T-Bar'],['RUU','วางแทนฝ้า T-Bar เปิด-ปิดได้']];
  returnStyle.innerHTML='<span class="price-choice-heading">รูปแบบสินค้า</span><div class="price-return-options">'+returnChoices.map(([value,label])=>`<label class="price-return-option"><input type="radio" name="returnStyle" value="${value}"><span>${label}</span></label>`).join('')+'</div>';
  advanced.querySelector('.price-fields').prepend(returnStyle);
  const slotStyle=document.createElement('div');slotStyle.className='field price-return-style price-slot-style';slotStyle.hidden=true;slotStyle.setAttribute('role','group');slotStyle.setAttribute('aria-label','จำนวน Slot');
  slotStyle.innerHTML='<span class="price-choice-heading">จำนวน Slot</span><div class="price-return-options">'+[1,2,3,4,5,6].map(value=>'<label class="price-return-option"><input type="radio" name="slot" value="'+value+'" disabled><span>'+value+' Slot</span></label>').join('')+'</div>';
  advanced.querySelector('.price-fields').prepend(slotStyle);
  const equipment=document.createElement('div');equipment.className='price-equipment-row';
  for(const name of ['color','damper','screen','unit']){
    const select=advanced.querySelector(`select[name="${name}"]`);
    if(name==='color'){const custom=document.createElement('option');custom.value='custom';custom.textContent='สีตามแบบ';select.append(custom);}
    const oldField=select.closest('label');
    const choices=document.createElement('div');choices.className=name==='unit'?'field price-unit-choice':'field price-choice-filter';choices.setAttribute('role','group');
    const legend=document.createElement('span');legend.className='price-choice-heading';legend.textContent=name==='screen'?'มุ้งลวดกันแมลง':oldField.querySelector('span').textContent;
    choices.setAttribute('aria-label',legend.textContent);
    const options=document.createElement('div');options.className='price-return-options';
    for(const option of select.options){
      if(option.value==='')continue;
      const label=document.createElement('label');label.className='price-return-option';
      const input=document.createElement('input');input.type='radio';input.name=name;input.value=option.value;input.checked=option.selected;input.defaultChecked=option.selected;
      const text=document.createElement('span');text.textContent=option.textContent;
      label.append(input,text);options.append(label);
    }
    choices.append(legend,options);oldField.replaceWith(choices);
    if(name==='color')choices.after(equipment);else if(name!=='unit')equipment.append(choices);
  }
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
      const isSlot=button.dataset.category==='Linear Slot';
      slotStyle.hidden=!isSlot;slotStyle.querySelectorAll('input').forEach(input=>{input.disabled=!isSlot;if(!isSlot)input.checked=false;});
      const isReturn=button.dataset.category==='Return Air';
      const isVolume=button.dataset.category==='Volume Damper';
      advanced.querySelectorAll('.price-choice-filter').forEach(field=>{const hidden=isVolume||(['Square Ceiling','Linear Bar','Supply Air','Round Ceiling','Linear Slot'].includes(button.dataset.category)&&Boolean(field.querySelector('[name="screen"]')));field.hidden=hidden;field.querySelectorAll('input').forEach(input=>{input.disabled=hidden;if(hidden)input.checked=false;});});
      equipment.hidden=isVolume;
      returnStyle.hidden=!isReturn;
      if(!isReturn)returnStyle.querySelectorAll('input').forEach(input=>input.checked=false);
    },true);
  });
  page.querySelector('#price-search-form').addEventListener('reset',()=>showAdvanced(false));
  document.getElementById('product-unit-converter')?.remove();
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
  style.textContent+='#products .price-equipment-row[hidden],#products .price-advanced-search[hidden],#products .price-advanced-search .field[hidden]{display:none!important}';
  style.textContent+='#products .price-return-style{grid-column:1/-1;border:0;padding:0;margin:0;min-width:0}#products .price-return-style legend{padding:0;margin-bottom:10px}#products .price-return-options{display:flex;flex-wrap:wrap;gap:10px}#products .price-return-option{display:flex;align-items:center;gap:9px;min-height:44px;padding:10px 14px;border:1px solid #c6dfed;border-radius:10px;background:#fbfdff;cursor:pointer}#products .price-return-option input{width:18px;height:18px;min-height:0;margin:0;padding:0;accent-color:#087fac}#products .price-return-option:has(input:checked){background:#dff4ff;border-color:#098cc1;color:#07658b}#products .price-return-option:focus-within{outline:2px solid #139bc8;outline-offset:2px}';
  style.textContent+='#products .price-return-options{justify-content:center}#products .price-return-style,#products .price-choice-filter{grid-column:1/-1;display:flex;flex-direction:row;align-items:center;justify-content:center;gap:14px;border:0;padding:0;margin:0;min-width:0}#products .price-choice-heading{flex-shrink:0;white-space:nowrap}#products .price-equipment-row{grid-column:1/-1;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:18px 28px}#products .price-equipment-row .price-return-options{flex-wrap:nowrap}#products .price-equipment-row .price-choice-filter{flex:0 1 auto}@media(max-width:600px){#products .price-return-style{align-items:flex-start}#products .price-return-style .price-choice-heading{padding-top:12px}}';
  style.textContent+=`
    #products .price-return-style,#products .price-choice-filter{display:grid;grid-template-columns:110px minmax(0,1fr);gap:16px;padding:16px;border:1px solid #d6e8f3;border-radius:14px;background:#f7fbfe}
    #products .price-choice-heading{font-weight:600;color:#235675;white-space:normal;line-height:1.5}
    #products .price-return-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;min-width:0}
    #products [aria-label="สี"] .price-return-options{grid-template-columns:repeat(4,minmax(0,1fr))}
    #products .price-return-option{justify-content:flex-start;min-height:48px;padding:10px 12px;gap:9px;line-height:1.4;background:#fff;transition:background .15s,border-color .15s}
    #products .price-return-option span{min-width:0}
    #products .price-return-option input{flex-shrink:0}
    #products .price-return-option:hover{background:#edf8ff;border-color:#75c1df}
    #products .price-return-option:has(input:checked){background:#e0f4ff;border-color:#078aba;box-shadow:0 0 0 1px #078aba;color:#07587d}
    #products .price-equipment-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;align-items:stretch}
    #products .price-equipment-row .price-choice-filter{grid-column:auto;grid-template-columns:128px minmax(0,1fr);gap:12px}
    #products .price-equipment-row .price-return-options{grid-template-columns:repeat(2,minmax(0,1fr))}
    #products .price-equipment-row .price-return-option{justify-content:center;padding:10px 8px}
    #products .price-fields{gap:16px;padding:16px 0}
    @media(max-width:1050px){#products .price-equipment-row{grid-template-columns:1fr}#products .price-equipment-row .price-choice-filter{grid-template-columns:110px minmax(0,1fr)}}
    @media(max-width:600px){#products .price-return-style,#products .price-choice-filter,#products .price-equipment-row .price-choice-filter{grid-template-columns:86px minmax(0,1fr);gap:10px;padding:12px}#products .price-return-style .price-choice-heading{padding-top:0}#products .price-return-style .price-return-options{grid-template-columns:repeat(2,minmax(0,1fr))}#products .price-return-option{padding:9px 8px;font-size:12px}}
  `;
  style.textContent+='#products .price-unit-choice .price-return-options{grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}#products .price-unit-choice .price-return-option{justify-content:center;padding:10px 6px;gap:6px;min-height:46px}#products .price-unit-choice>.price-choice-heading{display:block;margin-bottom:8px;font-weight:400}';
  advanced.querySelectorAll('input[name="width"],input[name="length"]').forEach(input=>input.closest('.field').classList.add('price-size-field'));
  style.textContent+='#products .price-size-field>span{font-size:16px;font-weight:700;color:#08678d}#products .price-size-field>input{min-height:58px;background:#edf9ff;border:2px solid #169dc6;border-radius:12px;font-size:22px;font-weight:650;color:#104960;padding:12px 16px;box-shadow:0 3px 10px #0085b010}#products .price-size-field>input::placeholder{font-size:16px;font-weight:400;color:#6b8da1}#products .price-size-field>input:focus{outline:none;border-color:#007ca8;background:#fff;box-shadow:0 0 0 4px #0a9bcb26}#products .price-unit-choice{align-self:end}';
  style.textContent+='#products .price-equipment-row:has(>.field[hidden]){grid-template-columns:1fr}';
  style.textContent+='#products .price-slot-style .price-return-options{grid-template-columns:repeat(6,minmax(0,1fr))}#products .price-slot-style .price-return-option{justify-content:center;white-space:nowrap;padding:10px 6px}@media(max-width:1050px){#products .price-slot-style .price-return-options{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:600px){#products .price-slot-style .price-return-options{grid-template-columns:repeat(2,minmax(0,1fr))}}';
  document.head.append(style);
})();
