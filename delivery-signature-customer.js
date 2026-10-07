// Delivery notes are signed by the customer on the printed document.
// Do not show the company signature picker for this document type.
(() => {
  const signatures = window.DocumentSignatures;
  if (!signatures?.mount) return;
  const originalMount = signatures.mount;
  signatures.mount = (toolbar, options = {}) => {
    if (options.doc?.kind === 'delivery_note') return;
    return originalMount(toolbar, options);
  };
})();
