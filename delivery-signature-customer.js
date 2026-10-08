// Customer signature slots are signed on paper. Keep the company signer picker.
(() => {
  const signatures = window.DocumentSignatures;
  if (!signatures?.mount) return;
  const originalMount = signatures.mount;
  signatures.mount = (toolbar, options = {}) => {
    const result = originalMount(toolbar, options);
    const customerIndex = options.doc?.kind === 'delivery_note' ? 0 : options.doc?.kind === 'billing_note' ? 1 : 2;
    if (!['delivery_note','billing_note','cash_bill','tax_invoice','quotation'].includes(options.doc?.kind)) return result;
    const button = toolbar.lastElementChild;
    button?.addEventListener('click', () => setTimeout(() => {
      const dialog = document.querySelector('#signer-dialog');
      if (dialog) dialog.querySelectorAll('.signer-row')[customerIndex]?.remove();
    }, 0));
    return result;
  };
})();
