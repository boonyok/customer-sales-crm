(() => {
  const ids=['quotations','tax-invoices','tax-invoice-control','delivery-notes','invoices','billing','cash-bills'];
  let queued=false;
  const nf=new Intl.NumberFormat('th-TH');
  const money=new Intl.NumberFormat('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2});
  function scan(){
    queued=false;
    ids.forEach(id=>{
      const page=document.getElementById(id);if(!page)return;
      page.classList.add('document-workspace');
      const table=page.querySelector('table');if(!table)return;
      let overview=page.querySelector(':scope > .document-overview');
      if(!overview){
        overview=document.createElement('div');overview.className='document-overview';
        overview.innerHTML='<div class="document-section-heading"><span>ภาพรวมเอกสาร</span><small>สรุปจากรายการที่โหลดและแสดงในตาราง</small></div><div class="document-metrics"><article><span class="document-metric-icon">▤</span><div><small>เอกสารที่แสดง</small><strong data-overview-count>0</strong></div></article><article data-overview-money-card><span class="document-metric-icon">฿</span><div><small>ยอดรวมที่แสดง (บาท)</small><strong data-overview-money>0.00</strong></div></article><article><span class="document-metric-icon">✓</span><div><small>เอกสารที่เลือก</small><strong data-overview-selected>0</strong></div></article></div>';
        page.prepend(overview);
      }
      if(id==='quotations'){
        if(!overview.dataset.quotationSummary){
          overview.dataset.quotationSummary='true';
          overview.innerHTML='<div class="document-section-heading"><span>ภาพรวมเอกสาร</span><small>สรุปใบเสนอราคาทั้งหมด ไม่เปลี่ยนตามตัวกรองตาราง</small></div><div class="document-metrics"><article><span class="document-metric-icon">▤</span><div><small>ใบเสนอราคาทั้งหมด</small><strong data-quote-total>0</strong></div></article><article><span class="document-metric-icon">◷</span><div><small>รออนุมัติ</small><strong data-quote-pending>0</strong></div></article><article><span class="document-metric-icon">✓</span><div><small>อนุมัติแล้ว</small><strong data-quote-approved>0</strong></div></article></div>';
        }
        const counts=typeof state!=='undefined'&&window.QuotationFilters?window.QuotationFilters.select(state.quotations||[]).counts:null;
        for(const [key,selector] of [['all','[data-quote-total]'],['sent','[data-quote-pending]'],['approved','[data-quote-approved]']]){
          const tab=page.querySelector('[data-quotation-filter="'+key+'"]');
          const count=counts?.[key]??Number(tab?.textContent.match(/\((\d+)\)/)?.[1]||0);
          const el=overview.querySelector(selector),value=nf.format(count);if(el.textContent!==value)el.textContent=value;
        }
        return;
      }
      const rows=[...(table.tBodies[0]?.rows||[])].filter(row=>row.cells.length>1&&!row.hidden&&getComputedStyle(row).display!=='none');
      const headings=[...(table.tHead?.rows[0]?.cells||[])].map(cell=>cell.textContent.trim());
      const amountIndex=headings.findIndex(text=>/ยอดรวม|ยอดสุทธิ|จำนวนเงิน|ยอดเงิน/.test(text));
      const sum=amountIndex<0?0:rows.reduce((total,row)=>total+(Number((row.cells[amountIndex]?.textContent||'').replace(/[^\d.-]/g,''))||0),0);
      const set=(selector,value)=>{const el=overview.querySelector(selector);if(el.textContent!==value)el.textContent=value;};
      set('[data-overview-count]',nf.format(rows.length));
      set('[data-overview-money]',money.format(sum));
      set('[data-overview-selected]',nf.format(rows.filter(row=>row.querySelector('[data-document-check]:checked')).length));
      overview.querySelector('[data-overview-money-card]').hidden=amountIndex<0;
    });
  }
  const schedule=()=>{if(!queued){queued=true;requestAnimationFrame(scan);}};
  new MutationObserver(schedule).observe(document.querySelector('main'),{childList:true,subtree:true});
  document.addEventListener('change',event=>{if(event.target.matches('[data-document-check],[data-document-all]'))schedule();});
  document.addEventListener('click',event=>{if(event.target.closest('[data-clear-selection]'))schedule();});
  window.addEventListener('hashchange',schedule);scan();
})();
