(() => {
  const sidebar = document.querySelector('.sidebar');
  const nav = sidebar?.querySelector('nav');
  if (!nav) return;
  const groups = [
    ['overview','ภาพรวม','▦'], ['sales','งานขาย','▣'], ['data','ข้อมูล','▥'], ['tools','งานบัญชี','<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" style="display:block;margin:auto"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 6h8v4H8zM8 14h1M12 14h1M16 14h0M8 18h1M12 18h1M16 18h0"/></svg>'], ['settings','ตั้งค่า','⚙']
  ];
  const groupFor = page => page === 'dashboard' ? 'overview' : ['quotations','tax-invoices','tax-invoice-control','delivery-notes','invoices','billing','cash-bills'].includes(page) ? 'sales' : ['customers','products','company-profile'].includes(page) ? 'data' : ['members','settings'].includes(page) ? 'settings' : 'tools';
  const brand = sidebar.querySelector('.brand');
  brand.innerHTML = '<span class="by-brand-mark">BY</span><span><strong>BOONYOK</strong><small>SUPPLY CO., LTD.</small></span>';
  const rail = document.createElement('div'); rail.className = 'by-rail'; rail.setAttribute('aria-label','หมวดเมนูหลัก');
  groups.forEach(([key,label,icon]) => { const button=document.createElement('button');button.type='button';button.dataset.rail=key;button.innerHTML='<span aria-hidden="true">'+icon+'</span><small>'+label+'</small>';button.onclick=()=>show(key);rail.append(button); });
  const body = document.createElement('div'); body.className='by-sidebar-body';
  const submenu = document.createElement('div'); submenu.className='by-submenu';
  const heading = document.createElement('p'); heading.className='by-submenu-heading';
  sidebar.insertBefore(body,nav);body.append(rail,submenu);submenu.append(heading,nav);
  const footer = document.createElement('div');footer.className='by-sidebar-footer';
  footer.innerHTML='<div class="by-user"><span>BY</span><div><strong>บุญยก ซัพพลาย</strong><small>พื้นที่ทำงานของบริษัท</small></div></div>';
  const logout = document.getElementById('logout-button'); if(logout)footer.append(logout);
  sidebar.append(footer);
  let current='sales';
  function show(key) {
    current=key;
    const label=groups.find(group=>group[0]===key)?.[1]||'';
    if(heading.textContent!==label)heading.textContent=label;
    rail.querySelectorAll('button').forEach(button=>{const active=button.dataset.rail===key;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
    nav.querySelectorAll('.nav-link[data-page]').forEach(button=>{const visible=groupFor(button.dataset.page)===key;const value=String(visible);if(button.dataset.menuVisible!==value)button.dataset.menuVisible=value;});
  }
  function sync() {
    const active=nav.querySelector('.nav-link.active[data-page]');
    if(active && active.dataset.page!==sync.lastPage){sync.lastPage=active.dataset.page;current=groupFor(sync.lastPage);}
    show(current);
  }
  new MutationObserver(sync).observe(nav,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  window.addEventListener('hashchange',sync);sync();
})();
