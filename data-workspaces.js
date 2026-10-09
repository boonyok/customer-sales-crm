(() => {
  const ids = ['customers', 'company-profile', 'purchase-tax', 'sales-tax', 'products'];
  let queued = false;
  const nf = new Intl.NumberFormat('th-TH');
  function scan() {
    queued = false;
    ids.forEach(id => document.getElementById(id)?.classList.add('document-workspace', 'data-workspace'));
    const page = document.getElementById('customers');
    if (!page) return;
    let overview = page.querySelector('[data-customer-overview]');
    if (!overview) {
      overview = document.createElement('div');
      overview.className = 'document-overview';
      overview.setAttribute('data-customer-overview', '');
      overview.innerHTML = '<div class="document-section-heading"><span>ภาพรวมลูกค้า</span><small>จำนวนที่แสดงและเครดิตเทอมเปลี่ยนตามการค้นหา</small></div><div class="document-metrics"><article><span class="document-metric-icon" aria-hidden="true">♙</span><div><small>ลูกค้าทั้งหมด</small><strong data-customer-total>0</strong></div></article><article><span class="document-metric-icon" aria-hidden="true">⌕</span><div><small>ลูกค้าที่แสดง</small><strong data-customer-visible>0</strong></div></article><article><span class="document-metric-icon" aria-hidden="true">฿</span><div><small>เงินสด / เครดิต 0 วัน ที่แสดง</small><strong data-customer-cash>0</strong></div></article></div>';
      page.prepend(overview);
    }
    const rows = [...(document.getElementById('customer-body')?.rows || [])].filter(row => row.cells.length > 1 && !row.hidden);
    const total = document.getElementById('customer-count')?.textContent || '0 ราย';
    const termsIndex = [...(page.querySelector('thead tr')?.cells || [])].findIndex(cell => cell.textContent.trim() === 'เครดิตเทอม');
    const cash = rows.filter(row => /เงินสด|^0\s*(?:วัน|days?)?$/i.test(row.cells[termsIndex]?.textContent.trim() || '')).length;
    for (const [selector, value] of [['[data-customer-total]', total], ['[data-customer-visible]', nf.format(rows.length)], ['[data-customer-cash]', nf.format(cash)]]) {
      const el = overview.querySelector(selector);
      if (el.textContent !== value) el.textContent = value;
    }
  }
  function schedule() { if (!queued) { queued = true; requestAnimationFrame(scan); } }
  const main = document.querySelector('main');
  if (!main) return;
  new MutationObserver(schedule).observe(main, { childList: true, subtree: true });
  scan();
})();
