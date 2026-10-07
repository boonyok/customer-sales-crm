// Delivery notes are signed by the customer on the printed document.
// Do not show the company signature picker for this document type.
(() => {
  const signatures = window.DocumentSignatures;
  if (!signatures?.mount) return;
  const originalMount = signatures.mount;
  signatures.mount = (toolbar, options = {}) => {
    if (['delivery_note','billing_note','cash_bill','tax_invoice','quotation'].includes(options.doc?.kind)) return;
    return originalMount(toolbar, options);
  };
})();
