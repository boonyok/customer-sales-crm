(() => {
  let context, button, busy = false;
  window.ProductImport.configure = c => {
    context = c;
    if (button) return;
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json'; input.hidden = true;
    document.body.append(input);
    button = document.createElement('button');
    button.type = 'button'; button.className = 'ghost';
    button.textContent = 'นำเข้าราคา VD / VDS';
    button.hidden = window.CRMAccess?.role !== 'admin';
    document.getElementById('add-product').before(button);
    button.onclick = () => { if (!busy) input.click(); };
    input.onchange = async () => {
      const file = input.files?.[0]; if (!file || busy) return;
      const c = context; busy = true; button.disabled = true;
      try {
        const result = await window.ProductImport.run(JSON.parse(await file.text()), c);
        c.notice('บันทึกราคาสำเร็จ • เพิ่ม ' + result.added + ' • ข้ามรายการเดิม ' + result.skipped + ' • รวม ' + result.total);
        await c.refresh();
        c.notice('นำเข้าสำเร็จ • เพิ่ม ' + result.added + ' • ข้ามรายการเดิม ' + result.skipped + ' • รวม ' + result.total);
      } catch (error) {
        c.notice('หยุดนำเข้า: ' + error.message + ' • รายการที่บันทึกแล้วจะยังอยู่ สามารถทำต่อได้โดยไม่เพิ่มซ้ำ');
      } finally { busy = false; button.disabled = false; input.value = ''; }
    };
  };
})();
