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
      let group = controls.get(input);
      if (!group) {
        group = document.createElement('div');
        group.className = 'popup-percent-buttons';
        group.setAttribute('role', 'group');
        group.setAttribute('aria-label', 'เลือก ' + label + ' ทีละ 5%');
        input.setAttribute('aria-label', label);
        const rows = [document.createElement('div'), document.createElement('div')];
        rows.forEach(row => { row.className = 'popup-percent-row'; group.append(row); });
        steps.forEach(value => {
          const button = document.createElement('button');
          button.type = 'button';
          button.dataset.percent = String(value);
          button.textContent = value + '%';
          button.setAttribute('aria-label', label + ' ' + value + '%');
          button.addEventListener('click', () => {
            if (input.disabled || input.readOnly) return;
            input.value = String(value);
            input.dispatchEvent(new Event('input', {bubbles:true}));
            input.dispatchEvent(new Event('change', {bubbles:true}));
          });
          rows[value <= 50 ? 0 : 1].append(button);
        });
        field.after(group);
        input.addEventListener('input', () => sync(input, group));
        input.addEventListener('change', () => sync(input, group));
        controls.set(input, group);
      }
      sync(input, group);
    });
  }
  function sync(input, group) {
    const value = input.value === '' ? NaN : Number(input.value);
    group.querySelectorAll('button').forEach(button => {
      button.setAttribute('aria-pressed', String(Number(button.dataset.percent) === value));
      button.disabled = input.disabled || input.readOnly;
    });
  }
  function schedule() { if (!queued) { queued = true; requestAnimationFrame(scan); } }
  new MutationObserver(schedule).observe(document.body, {childList:true, subtree:true, attributes:true, attributeFilter:['disabled','readonly']});
  scan();
})();
