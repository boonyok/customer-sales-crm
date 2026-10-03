// Presentation-only enhancement shared by customer create/edit dialogs.
(() => {
 const enhance=(dialog,{edit=false,discount=0}={})=>{
  dialog.classList.add('customer-friendly');
  const form=dialog.querySelector('form'),root=dialog.querySelector('.form-content')||form;
  if(root.querySelector('.customer-grid'))return;
  const style=document.createElement('style');style.dataset.customerStyle='';style.textContent=`
  dialog.customer-friendly{width:min(760px,94vw)!important;max-width:94vw;max-height:90vh!important;padding:0!important;border:0;border-radius:18px;overflow:auto!important;color:#203735}
  .customer-friendly::backdrop{background:#142c365e}
  .customer-friendly > .document-close-bar{display:none}
  .customer-friendly .form-content{padding:0}.customer-friendly form{margin:0}
  .customer-friendly .customer-head{position:sticky;top:0;z-index:3;padding:20px 26px;background:#fff;border-bottom:1px solid #dce7e4;display:flex;align-items:center;justify-content:space-between;gap:16px}
  .customer-friendly h2{margin:0;font-size:23px}.customer-friendly .customer-close{border:0;background:#edf4f2;border-radius:10px;width:40px;height:40px;font-size:24px;cursor:pointer}
  .customer-friendly .customer-help{margin:0;padding:14px 26px;color:#59716d;background:#f4f8f7;font-size:13px;line-height:1.6}
  .customer-friendly .customer-grid{padding:18px 26px;display:grid;grid-template-columns:1fr 1fr;gap:16px 20px}
  .customer-friendly .customer-section{grid-column:1/-1;margin:8px 0 0;font-size:15px;color:#28665e;border-bottom:1px solid #dfebe7;padding-bottom:8px}
  .customer-friendly .field{display:grid!important;gap:6px!important;margin:0!important;min-width:0}.customer-friendly .customer-wide{grid-column:1/-1}
  .customer-friendly input,.customer-friendly select,.customer-friendly textarea{box-sizing:border-box;width:100%;padding:11px 12px!important;border:1px solid #bbcfc9!important;border-radius:8px!important;font:inherit;background:white;min-height:44px}
  .customer-friendly [hidden]{display:none!important}.customer-friendly textarea{resize:vertical;line-height:1.6}
  .customer-friendly input:focus,.customer-friendly select:focus,.customer-friendly textarea:focus{outline:3px solid #b8dcd4;outline-offset:1px;border-color:#28665e!important}
  .customer-friendly small{color:#607872;line-height:1.5}.customer-friendly .customer-actions{position:sticky;bottom:0;background:#fff;border-top:1px solid #dce7e4;display:flex;gap:12px;justify-content:flex-end;padding:16px 26px;margin:0;z-index:2}
  .customer-friendly .customer-actions button{min-height:44px;padding:10px 22px;border-radius:9px;cursor:pointer}.customer-friendly .customer-actions .primary{background:#28665e;color:white}
  .customer-friendly [data-error]{padding:0 26px;color:#a22636}.customer-friendly .credit-options{display:flex;gap:6px;flex-wrap:wrap}.customer-friendly .credit-options button{padding:6px 10px;border:1px solid #c4d8d1;border-radius:6px;background:#f4f8f7;color:#28665e;cursor:pointer}
  @media(max-width:600px){.customer-friendly .customer-grid{grid-template-columns:1fr;padding:16px}.customer-friendly .customer-head,.customer-friendly .customer-help,.customer-friendly .customer-actions{padding:14px 16px}.customer-friendly .customer-actions button{flex:1}}
  `;dialog.append(style);
  const title=root.querySelector('h2'),head=document.createElement('header');head.className='customer-head';
  const close=document.createElement('button');close.type='button';close.className='customer-close';close.textContent='×';close.setAttribute('aria-label','ปิดหน้าต่างลูกค้า');close.onclick=()=>edit?dialog.querySelector('[data-cancel]').click():dialog.close();head.append(title,close);root.prepend(head);
  const oldHelp=root.querySelector(':scope > p:not([data-error])');oldHelp?.remove();
  const help=document.createElement('p');help.className='customer-help';help.textContent=edit?'แก้ข้อมูลสำหรับเอกสารใหม่ • เอกสารเดิมคงข้อมูล ณ วันที่ออกเอกสาร':'กรอกข้อมูลลูกค้าสำหรับใช้ซ้ำในเอกสาร • ช่องที่มี * จำเป็นต้องกรอก';head.after(help);
  const actions=root.querySelector('.form-actions')||root.querySelector('[data-cancel]').parentElement;actions.classList.add('customer-actions');
  if(!edit){const cancel=actions.querySelector('[value="cancel"]');cancel.type='button';cancel.onclick=()=>dialog.close();}
  const grid=document.createElement('div');grid.className='customer-grid';help.after(grid);
  const section=text=>{const h=document.createElement('h3');h.className='customer-section';h.textContent=text;grid.append(h);};
  const field=(name,label,{wide=false,placeholder='',hint=''}={})=>{const input=root.querySelector(`[name="${name}"]`);if(!input)return;const box=input.closest('.field');if(!box)return;if(label)box.querySelector('span').textContent=label;input.placeholder=placeholder;box.classList.toggle('customer-wide',wide);grid.append(box);if(hint){const note=document.createElement('small');note.textContent=hint;note.id='customer-'+name+'-help';input.setAttribute('aria-describedby',note.id);box.append(note);}return input;};
  section('1. ข้อมูลสำหรับออกเอกสาร');
  const name=field('name','ชื่อบริษัท / ชื่อลูกค้า *',{wide:true,placeholder:'เช่น บริษัท ตัวอย่าง จำกัด'});name.maxLength=300;
  const tax=field('taxId','เลขประจำตัวผู้เสียภาษี',{placeholder:'ตัวเลข 13 หลัก',hint:'เว้นว่างได้หากไม่มีเลขผู้เสียภาษี'});tax.inputMode='numeric';tax.maxLength=13;tax.pattern='[0-9]{13}';
  const office=root.querySelector('[name="officeType"]')?.closest('.field');if(office)grid.append(office);
  if(!root.querySelector('[name="address"]')){const label=document.createElement('label');label.className='field';label.innerHTML='<span>ที่อยู่สำหรับออกเอกสาร</span><textarea name="address" rows="3" maxlength="2000"></textarea>';root.insertBefore(label,actions);}
  field('address','ที่อยู่สำหรับออกเอกสาร',{wide:true,placeholder:'บ้านเลขที่ / หมู่ / ถนน / ตำบล / อำเภอ / จังหวัด / รหัสไปรษณีย์'});
  section('2. ข้อมูลติดต่อ');field('contact','ชื่อผู้ติดต่อ',{placeholder:'ชื่อ–นามสกุล'});const phone=field('phone','เบอร์โทรศัพท์',{placeholder:'เช่น 081-234-5678'});phone.type='tel';
  section('3. เงื่อนไขการชำระเงิน');
  const discountBox=document.createElement('label');discountBox.className='field';discountBox.innerHTML='<span>ส่วนลดประจำลูกค้า (%)</span><input name="defaultDiscount" type="number" min="0" max="100" step="0.01" required>';discountBox.querySelector('input').value=String(discount);root.insertBefore(discountBox,actions);
  field('defaultDiscount','ส่วนลดประจำลูกค้า (%)',{wide:true,hint:'เติมส่วนลดให้รายการสินค้าในเอกสารใหม่อัตโนมัติ • ยังแก้ไขในเอกสารได้ • ไม่เปลี่ยนเอกสารเดิม'});
  const credit=field(edit?'creditDays':'terms','เครดิต (วัน) *',{wide:true,hint:'0 วัน = เงินสด • เลือกจำนวนวันหรือพิมพ์เองได้'});credit.value=String(parseInt(credit.value,10)||0);credit.type='number';credit.min=0;credit.max=3650;credit.step=1;credit.required=true;
  const choices=document.createElement('div');choices.className='credit-options';for(const days of [0,7,15,30,45,60]){const b=document.createElement('button');b.type='button';b.textContent=days?days+' วัน':'เงินสด';b.onclick=()=>{credit.value=String(days);credit.dispatchEvent(new Event('input',{bubbles:true}));};choices.append(b);}credit.after(choices);
  let error=root.querySelector('[data-error]');if(!error){error=document.createElement('p');error.dataset.error='';error.setAttribute('role','alert');actions.before(error);}
 };
 window.CustomerForm={enhance};
})();
