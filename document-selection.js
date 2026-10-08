(() => {
  const pages = ['quotations', 'tax-invoice-control', 'tax-invoices', 'delivery-notes', 'invoices', 'billing', 'cash-bills'];
  const style = document.createElement('style');
  style.textContent = '.document-selection-bar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:14px 18px;margin:12px 0;border:1px solid #d5e4e1;border-radius:12px;background:#f4faf8}.document-selection-bar p{margin:0;color:#55716a;font-size:13px}.document-selection-cell{position:relative;padding-left:44px!important}.document-selection-check{position:absolute;left:14px;top:50%;transform:translateY(-50%);width:18px!important;height:18px;accent-color:#245b57;cursor:pointer}.document-selected{background:#edf7f4!important}.document-selection-bar button:disabled{opacity:.45;cursor:not-allowed}';
  document.head.append(style);
  const actionStyle = document.createElement('style');
  actionStyle.textContent = '.document-row-actions{display:none!important}';
  document.head.append(actionStyle);
  let scheduled = false;
  const identities = new WeakMap(); let nextIdentity = 0;
  function scan() {
    scheduled = false;
    for (const id of pages) {
      const page = document.getElementById(id);
      if (!page) continue;
      // Billing also contains a secondary tax-invoice table; keep selections separate.
      page.querySelectorAll('table').forEach(table => {
        if (!table.tBodies.length || !table.tHead) return;
        const rows = [...table.tBodies[0].rows].filter(row => row.cells.length > 1 && row.querySelector('button'));
        if (!rows.length) return;
        table.classList.add('document-selection-table');
        const actionHeader = table.tHead.rows[0]?.lastElementChild;
        if (actionHeader && (!actionHeader.textContent.trim() || /^(เอกสาร|การจัดการ|จัดการ)$/.test(actionHeader.textContent.trim()))) {
          actionHeader.classList.add('document-row-actions');
          rows.forEach(row => row.lastElementChild.classList.add('document-row-actions'));
        }
        let bar = table.parentElement.querySelector(':scope > .document-selection-bar');
        if (!bar) {
          bar = document.createElement('div'); bar.className = 'document-selection-bar';
          bar.innerHTML = '<strong data-selection-count aria-live="polite"></strong><div data-selection-actions style="display:flex;gap:8px;flex-wrap:wrap"></div><button type="button" class="ghost" data-clear-selection>ล้างการเลือก</button><p data-selection-help></p>';
          table.before(bar);
          bar.querySelector('[data-clear-selection]').onclick = () => { table.querySelectorAll('[data-document-check]').forEach(input => input.checked = false); update(); };
        }
        const head = table.tHead.rows[0]?.cells[0];
        if (head && !head.querySelector('[data-document-all]')) {
          const all = document.createElement('input'); all.type = 'checkbox'; all.dataset.documentAll = ''; all.className = 'document-selection-check'; all.setAttribute('aria-label', 'เลือกเอกสารทั้งหมดที่แสดง');
          head.classList.add('document-selection-cell'); head.prepend(all);
          all.onchange = () => { rows.forEach(row => row.querySelector('[data-document-check]').checked = all.checked); update(); };
        }
        rows.forEach(row => {
          const numberCell = row.cells[0];
          if (id === 'quotations') {
            const edit = row.querySelector('[data-edit-quotation]');
            const canEdit = edit && !edit.disabled && !edit.hidden && getComputedStyle(edit).display !== 'none';
            row.classList.toggle('quotation-edit-row', Boolean(canEdit));
            if (canEdit) { row.tabIndex = 0; row.setAttribute('aria-label', 'แก้ไขใบเสนอราคา ' + edit.dataset.editQuotation); }
            else { row.removeAttribute('tabindex'); row.removeAttribute('aria-label'); }
            if (!row.dataset.rowEditBound) {
              row.dataset.rowEditBound = 'true';
              const openEdit = () => { const button=row.querySelector('[data-edit-quotation]'); if(button && !button.disabled && !button.hidden && getComputedStyle(button).display!=='none')button.click(); };
              row.addEventListener('click', event => { if(!event.target.closest('button,a,input,select,textarea,label'))openEdit(); });
              row.addEventListener('keydown', event => { if(event.target===row && event.key==='Enter'){event.preventDefault();openEdit();} });
            }
          }
          const previewButton = row.querySelector('[data-view], [data-print-document]');
          if (previewButton && !numberCell.querySelector('button, a')) {
            // Keep the text and column positions used by existing document actions.
            const numberText = [...numberCell.childNodes].filter(node => !(node.nodeType === 1 && node.matches('input')));
            const link = document.createElement('button'); link.type = 'button'; link.className = 'text-button'; link.dataset.documentPreview = '';
            link.setAttribute('aria-label', 'ดูตัวอย่างเอกสาร ' + numberCell.textContent.trim());
            numberText.forEach(node => link.append(node)); numberCell.append(link);
            link.onclick = () => previewButton.click();
          }
          if (id === 'quotations') {
            const numberLink = numberCell.querySelector('[data-document-preview]');
            if (numberLink) {
              numberLink.setAttribute('aria-label', 'แก้ไขใบเสนอราคา ' + numberCell.textContent.trim());
              numberLink.onclick = () => { const edit=row.querySelector('[data-edit-quotation]'); if(edit && !edit.disabled && !edit.hidden && getComputedStyle(edit).display!=='none')edit.click(); };
            }
          }
          if (row.querySelector('[data-document-check]')) return;
          const input = document.createElement('input'); input.type = 'checkbox'; input.dataset.documentCheck = ''; input.className = 'document-selection-check';
          input.setAttribute('aria-label', 'เลือกเอกสาร ' + row.cells[0].textContent.trim());
          row.cells[0].classList.add('document-selection-cell'); row.cells[0].prepend(input); input.onchange = update;
        });
        const allInput = table.querySelector('[data-document-all]');
        if (allInput) allInput.onchange = () => { rows.forEach(row => row.querySelector('[data-document-check]').checked = allInput.checked); update(); };
        function update() {
          const selected = rows.filter(row => row.querySelector('[data-document-check]')?.checked);
          rows.forEach(row => row.classList.toggle('document-selected', selected.includes(row)));
          const all = table.querySelector('[data-document-all]');
          if (all) { all.checked = selected.length === rows.length; all.indeterminate = selected.length > 0 && selected.length < rows.length; }
          const count = 'เลือก ' + selected.length + ' เอกสาร';
          const counter = bar.querySelector('[data-selection-count]'); if (counter.textContent !== count) counter.textContent = count;
          const help = selected.length > 1 ? 'เลือกครั้งละ 1 เอกสารเพื่อแก้ไขหรือออกเอกสารต่อ' : selected.length ? 'เลือกคำสั่งสำหรับเอกสารที่ติ๊กไว้' : 'เลือกเอกสารเพื่อใช้งานคำสั่ง';
          if (bar.querySelector('[data-selection-help]').textContent !== help) bar.querySelector('[data-selection-help]').textContent = help;
          const candidates = (selected.length === 1 ? selected : rows).flatMap(row => [...row.querySelectorAll('button')]).filter(button => !button.hasAttribute('data-document-preview') && !button.hidden && getComputedStyle(button).display !== 'none');
          const seen = new Set();
          const source = candidates.filter(button => { const key=button.textContent.trim(); if(id==='quotations'&&(button.hasAttribute('data-edit-quotation')||key==='แก้ไข'))return false; if(seen.has(key))return false; seen.add(key);return true; });
          const quotationLabel = button => /ออกใบส่ง/.test(button.textContent) ? 'ออกใบส่งของ' : /พิมพ์|PDF/.test(button.textContent) ? 'พิมพ์ PDF' : button.textContent.trim();
          if(id==='quotations'){
            const order=['ออกใบกำกับภาษี','ออกใบส่งของ','พิมพ์ PDF','ดูใบกำกับภาษี'];
            const rank=button=>{const index=order.indexOf(quotationLabel(button));return index<0?order.length:index;};
            source.sort((a,b)=>rank(a)-rank(b));
          }
          const needsSelection = selected.length !== 1;
          const actions = bar.querySelector('[data-selection-actions]');
          const fingerprint = String(needsSelection) + source.map(button => { if (!identities.has(button)) identities.set(button, ++nextIdentity); return identities.get(button) + button.outerHTML; }).join('');
          if (actions.dataset.fingerprint === fingerprint) return;
          actions.dataset.fingerprint = fingerprint; actions.replaceChildren();
          source.forEach(original => {
            if (id==='quotations' && original.dataset.printDocument) {
              for (const [mode,label] of [['a4','พิมพ์'],['pdf','PDF']]) {
                const output=document.createElement('button');output.type='button';output.className='ghost';output.dataset.quotationOutput=mode;output.textContent=label;output.disabled=needsSelection||original.disabled;
                output.onclick=async()=>{output.disabled=true;try{await window.TaxDocumentOutput(original.dataset.printDocument,mode);}catch(error){alert(error.message);}finally{output.disabled=needsSelection||original.disabled;}};
                actions.append(output);
              }
              return;
            }
            if (['tax-invoice-control', 'tax-invoices'].includes(id) && original.dataset.printDocument) {
              if (actions.querySelector('[data-tax-output]')) return;
              for (const [mode, label] of [['a4', 'พิมพ์ A4'], ['continuous', 'พิมพ์กระดาษต่อเนื่อง'], ['pdf', 'บันทึก PDF']]) {
                const output = document.createElement('button'); output.type = 'button'; output.className = 'ghost'; output.dataset.taxOutput = mode; output.textContent = label; output.disabled = needsSelection || original.disabled;
                output.onclick = async () => { output.disabled = true; try { await window.TaxDocumentOutput(original.dataset.printDocument, mode); } catch (error) { alert(error.message); } finally { output.disabled = original.disabled; } };
                actions.append(output);
              }
              return;
            }
            const button = document.createElement('button'); button.type = 'button'; button.className = 'ghost'; button.textContent = id==='quotations'?quotationLabel(original):original.textContent.trim(); button.disabled = needsSelection || original.disabled;
            button.onclick = () => { if (original.isConnected && !original.disabled) original.click(); };
            actions.append(button);
          });
        }
        update();
      });
    }
  }
  new MutationObserver(() => { if (!scheduled) { scheduled = true; requestAnimationFrame(scan); } }).observe(document.querySelector('main') || document.body, { childList: true, subtree: true });
  scan();
})();
