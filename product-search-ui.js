(() => {
  const input=document.getElementById('product-search');
  const toolbar=input.closest('.page-toolbar');
  toolbar.classList.add('product-search-toolbar');
  const search=input.closest('.search');
  search.classList.add('product-search-box');
  input.type='search';input.setAttribute('aria-label','ค้นหาข้อมูลสินค้า');
  input.placeholder='พิมพ์รหัส ชื่อสินค้า หรือขนาด เช่น R48I24 / Return Air / 24x48';
  const clear=document.createElement('button');clear.type='button';clear.className='ghost';clear.textContent='ล้างคำค้น';
  search.append(clear);
  clear.onclick=()=>{input.value='';input.dispatchEvent(new Event('input'));input.focus();};
  const hint=document.createElement('small');hint.className='product-search-hint';hint.textContent='ค้นหาทันทีขณะพิมพ์ • ใช้บางส่วนของคำได้ • พิมพ์หลายคำเพื่อเจาะจง เช่น Return 24x48';
  toolbar.after(hint);
  const style=document.createElement('style');
  style.textContent='#product-data .product-search-toolbar{display:flex;gap:16px;align-items:center;flex-wrap:wrap}#product-data .product-search-box{flex:1;min-width:min(100%,320px);display:flex;align-items:center;gap:12px;padding:10px 14px;background:#fff;border:1px solid #b9dcf3;border-radius:12px}#product-data .product-search-box:focus-within{border-color:#0089b8;box-shadow:0 0 0 3px #d9f3ff}#product-data .product-search-box input{flex:1;min-width:0;border:0;background:transparent;padding:8px;outline:none;width:100%}#product-data .product-search-box button{flex-shrink:0}#product-data .product-search-hint{display:block;margin:8px 0 20px;color:#62819b}@media(max-width:600px){#product-data .product-search-box{flex-basis:100%}}';
  document.head.append(style);
})();
