(() => {
  const steps = Array.from({length:21}, (_, index) => index * 5);
  const controls = new WeakMap();
  let queued = false;
  function scan() {
    queued = false;
    document.querySelectorAll('dialog input[type="number"][max="100"]').forEach(input => {
      const field = input.closest('.field');
      const label = field?.querySelector('span')?.textContent || '';
      if (!field || !label.includes('%')) return;
      let select = controls.get(input);
      if (!select) {
        select = document.createElement('select');
        select.className = 'popup-percent-choice';
        select.setAttribute('aria-label', 'เลือก ' + label + ' ทีละ 5%');
        select.innerHTML = '<option value="">กำหนดเปอร์เซ็นต์เอง</option>' + steps.map(value => `<option value="${value}">${value}%</option>`).join('');
        select.addEventListener('change', () => {
          if (input.disabled || input.readOnly || select.value === '') return;
          input.value = select.value;
          input.dispatchEvent(new Event('input', {bubbles:true}));
          input.dispatchEvent(new Event('change', {bubbles:true}));
        });
        input.after(select);
        input.addEventListener('input', () => sync(input, select));
        input.addEventListener('change', () => sync(input, select));
        controls.set(input, select);
      }
      sync(input, select);
    });
  }
  function sync(input, select) {
    const value = input.value === '' ? NaN : Number(input.value);
    select.value = steps.includes(value) ? String(value) : '';
    select.disabled = input.disabled || input.readOnly;
  }
  function schedule() { if (!queued) { queued = true; requestAnimationFrame(scan); } }
  new MutationObserver(schedule).observe(document.body, {childList:true, subtree:true, attributes:true, attributeFilter:['disabled','readonly']});
  scan();
})();
