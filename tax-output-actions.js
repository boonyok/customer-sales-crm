(() => {
  let pending = false;
  function scan() {
    pending = false;
    document.querySelectorAll('#tax-invoices .document-selection-bar, #tax-invoice-control .document-selection-bar').forEach(bar => {
      const old = [...bar.querySelectorAll('[data-selection-actions] > button')].find(button => /พิมพ์|PDF/.test(button.textContent) && !button.dataset.taxOutput);
      if (!old) return;
      const table = bar.parentElement.querySelector('table');
      const selected = [...table.querySelectorAll('tbody tr')].find(row => row.querySelector('[data-document-check]')?.checked);
      const number = selected?.querySelector('[data-print-document]')?.dataset.printDocument;
      if (!number) return;
      const fragment = document.createDocumentFragment();
      for (const [mode, label] of [['a4','พิมพ์ A4'],['continuous','พิมพ์กระดาษต่อเนื่อง'],['pdf','บันทึก PDF']]) {
        const button = document.createElement('button'); button.type = 'button'; button.className = 'ghost'; button.dataset.taxOutput = mode; button.textContent = label;
        button.onclick = async () => { button.disabled = true; try { await window.TaxDocumentOutput(number, mode); } catch (error) { alert(error.message); } finally { button.disabled = false; } };
        fragment.append(button);
      }
      old.replaceWith(fragment);
    });
  }
  new MutationObserver(() => { if (!pending) { pending = true; requestAnimationFrame(scan); } }).observe(document.querySelector('main'), {childList:true,subtree:true});
  scan();
})();
