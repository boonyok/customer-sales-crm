(() => {
  let context,button,screenStatus,busy=false;
    async function run(c,progress=()=>{}){
    const org=c.currentOrg();if(!org)throw Error('ยังไม่ได้เลือกบริษัท');
    const totals={added:0,skipped:0,unpriced:0};let cursor=null,scanned=0;
    do{
      if(org!==c.currentOrg())throw Error('บริษัทเปลี่ยน กรุณาเริ่มใหม่');
      progress('กำลังสร้างรายการมุ้งลวด • ตรวจแล้ว '+scanned+' • เพิ่มแล้ว '+totals.added);
      const page=await c.request('/rest/v1/rpc/crm_add_insect_screen_page',{method:'POST',body:JSON.stringify({p_org:org,p_cursor:cursor,p_limit:100})});
      if(org!==c.currentOrg())throw Error('บริษัทเปลี่ยน กรุณาเริ่มใหม่');
      if(!page||!['added','skipped','unpriced','scanned'].every(k=>Number.isInteger(page[k])&&page[k]>=0)||typeof page.more!=='boolean')throw Error('ผลการบันทึกไม่ถูกต้อง');
      for(const key of ['added','skipped','unpriced'])totals[key]+=page[key];
      scanned+=page.scanned;
      if(!page.more)break;
      if(!page.next_cursor||page.next_cursor===cursor||page.scanned===0)throw Error('ไม่สามารถอ่านหน้าถัดไปได้');
      cursor=page.next_cursor;
    }while(true);
    return totals;
  }
window.ProductInsectScreen={run,configure(c){
    context=c;
    if(!button){button=document.createElement('button');button.type='button';button.className='ghost';button.textContent='เพิ่มสินค้าติดมุ้งลวด';document.getElementById('add-product').before(button);
      screenStatus=document.createElement('p');screenStatus.setAttribute('role','status');screenStatus.style.cssText='margin:12px 0;color:#235675;overflow-wrap:anywhere';button.closest('.page-toolbar').after(screenStatus);
      button.onclick=async()=>{
        if(busy||!window.CRMAccess?.can('products','create'))return;
        const c=context,notice=message=>{screenStatus.textContent=message;c.notice(message);};busy=true;button.disabled=true;
        try{const result=await run(c,notice);await c.refresh();notice('เพิ่มมุ้งลวดสำเร็จ '+result.added+' รายการ • ข้ามรหัสเดิม '+result.skipped+' • ไม่มีราคาฐาน '+result.unpriced);}
        catch(error){await c.refresh().catch(()=>{});notice('หยุดเพิ่มมุ้งลวด: '+error.message+' • กดอีกครั้งเพื่อทำต่อ รายการเดิมไม่ถูกเขียนทับ');}
        finally{busy=false;button.disabled=false;}
      };
    }
    button.hidden=!window.CRMAccess?.can('products','create');
  }};
})();
