(() => {
  // Shop convention requested by the user, not the standard 2.54 cm/inch.
  const convert=value=>{const text=String(value??'').trim();if(!text)return null;const n=Number(text);return Number.isFinite(n)&&n>=0?n/2.5:null;};
  const format=n=>Number(n.toFixed(6)).toString();
  window.ProductUnitConverter={convert,format};
  const page=document.querySelector('#products');if(!page)return;
  const panel=document.createElement('section');panel.id='product-unit-converter';panel.className='panel';
  panel.style.cssText='padding:18px;margin:0 0 18px';
  panel.innerHTML=`<style>#product-unit-converter .unit-grid{display:flex;flex-wrap:wrap;gap:14px;align-items:end}#product-unit-converter label{display:grid;gap:6px;flex:1;min-width:180px}#product-unit-converter input{width:100%;padding:10px;border:1px solid #cbd5e1;border-radius:7px;box-sizing:border-box;font:inherit}#product-unit-converter output{display:block;font-size:20px;font-weight:600;color:#245b57;margin-top:12px;overflow-wrap:anywhere}#product-unit-converter p{font-size:12px;color:#64748b;margin:5px 0 14px}</style><h3 style="margin:0">แปลงขนาด cm เป็นนิ้ว</h3><p>สูตรที่ร้านใช้: เซนติเมตร ÷ 2.5 = นิ้ว (ไม่ใช่อัตรามาตรฐาน 2.54) • แสดงทศนิยมสูงสุด 6 ตำแหน่ง • ไม่เปลี่ยนข้อมูลสินค้า</p><div class="unit-grid"><label>ขนาดด้านที่ 1 (cm)<input data-cm-first type="number" min="0" step="any" inputmode="decimal" placeholder="เช่น 120"></label><label>ขนาดด้านที่ 2 (cm) — ไม่บังคับ<input data-cm-second type="number" min="0" step="any" inputmode="decimal" placeholder="เช่น 60"></label><button type="button" class="ghost" data-unit-clear>ล้างค่า</button></div><output aria-live="polite">กรอกขนาดเป็นเซนติเมตร</output>`;
  const first=panel.querySelector('[data-cm-first]'),second=panel.querySelector('[data-cm-second]'),output=panel.querySelector('output');
  const update=()=>{const a=convert(first.value),b=convert(second.value);if(first.validity.badInput||second.validity.badInput||(first.value&&a===null)||(second.value&&b===null)){output.textContent='กรุณากรอกตัวเลขตั้งแต่ 0 ขึ้นไป';return;}if(a===null){output.textContent='กรอกขนาดด้านที่ 1 เป็นเซนติเมตร';return;}output.textContent=b===null?`${format(a)} นิ้ว`:`${format(a)}" x ${format(b)}"`;};
  first.addEventListener('input',update);second.addEventListener('input',update);
  panel.querySelector('[data-unit-clear]').onclick=()=>{first.value='';second.value='';update();first.focus();};
  page.querySelector('.page-toolbar').after(panel);
})();
