(() => {
  const validId = value => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
  async function list(request, org) {
    if (!validId(org)) throw Error('องค์กรไม่ถูกต้อง');
    const ids = []; let cursor = '';
    for (;;) {
      const rows = await request('/rest/v1/products?organization_id=eq.' + org + '&select=id&order=id.asc&limit=500' + (cursor ? '&id=gt.' + cursor : ''));
      if (!Array.isArray(rows)) throw Error('ตรวจรายการสินค้าไม่สำเร็จ');
      if (!rows.length) return ids;
      if (rows.some(row => !validId(row.id)) || rows.at(-1).id === cursor) throw Error('รายการสินค้าไม่ครบ');
      ids.push(...rows.map(row => row.id)); cursor = rows.at(-1).id;
    }
  }
  async function purge(request, org, ids, currentOrg, progress = () => {}) {
    if (!validId(org) || ids.some(id => !validId(id)) || new Set(ids).size !== ids.length) throw Error('เป้าหมายลบไม่ถูกต้อง');
    let deleted = 0;
    for (let i = 0; i < ids.length; i += 100) {
      if (currentOrg() !== org) throw Error('องค์กรเปลี่ยน หยุดลบข้อมูล');
      const batch = ids.slice(i, i + 100);
      const rows = await request('/rest/v1/products?organization_id=eq.' + org + '&id=in.(' + batch.join(',') + ')&select=id', {method:'DELETE', headers:{Prefer:'return=representation'}});
      if (!Array.isArray(rows) || rows.length !== batch.length || rows.some(row => !batch.includes(row.id))) throw Error('ยืนยันผลลบไม่ได้ กรุณาตรวจรายการใหม่');
      deleted += rows.length; progress(deleted, ids.length);
    }
    return deleted;
  }
  let context, button, busy = false;
  function configure(options) {
    context = options;
    if (!button) {
      button = document.createElement('button'); button.type = 'button'; button.className = 'ghost';
      button.textContent = 'ลบสินค้าทั้งหมดถาวร'; button.style.color = '#b42332';
      button.dataset.purgeAllProducts = '';
      document.getElementById('add-product').before(button);
      button.onclick = async () => {
        if (busy || window.CRMAccess?.role !== 'admin') return;
        const c = context, org = c.currentOrg(); busy = true; button.disabled = true;
        try {
          c.notice('กำลังตรวจรายการสินค้าทั้งหมด รวมถังขยะ…'); await c.prepare();
          const ids = await list(c.request, org);
          if (c.currentOrg() !== org) throw Error('องค์กรเปลี่ยน กรุณาตรวจใหม่');
          if (!ids.length) { c.notice('ไม่มีสินค้าให้ลบ'); return; }
          if (!confirm('ลบสินค้า ' + ids.length.toLocaleString('th-TH') + ' รหัสทั้งหมดของบริษัทนี้ถาวร รวมทุกขนาด ราคา ประวัติราคา และถังขยะ?\nกู้คืนผ่านระบบไม่ได้ • ไม่ลบเอกสารขายเดิม')) { c.notice('ยกเลิกการลบ'); return; }
          const total = await purge(c.request, org, ids, c.currentOrg, (done, count) => c.notice('กำลังลบถาวร ' + done.toLocaleString('th-TH') + ' / ' + count.toLocaleString('th-TH') + ' รหัส…'));
          await c.refresh();
          const remaining = await list(c.request, org);
          c.notice('ลบถาวรแล้ว ' + total.toLocaleString('th-TH') + ' รหัส • คงเหลือ ' + remaining.length.toLocaleString('th-TH') + ' รหัส');
        } catch (error) {
          c.notice('หยุดดำเนินการ: ' + error.message + ' • บางชุดอาจลบแล้ว กรุณาตรวจรายการล่าสุด');
          try { await c.refresh(); } catch {}
        } finally { busy = false; button.disabled = false; }
      };
    }
    button.hidden = window.CRMAccess?.role !== 'admin';
  }
  window.ProductBulkDelete = {list, purge, configure};
})();
