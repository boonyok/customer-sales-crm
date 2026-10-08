(() => {
  let active=false;
  const ask=message=>{
    if(active)return Promise.resolve(false);
    active=true;
    return new Promise(resolve=>{
      const dialog=document.createElement('dialog');dialog.id='document-delete-confirm';
      dialog.setAttribute('role','alertdialog');dialog.setAttribute('aria-labelledby','document-delete-confirm-title');dialog.setAttribute('aria-describedby','document-delete-confirm-message');
      dialog.style.cssText='width:min(460px,calc(100% - 32px));box-sizing:border-box;padding:28px;border:1px solid #e2e8f0;border-radius:18px;box-shadow:0 24px 80px #16375240';
      dialog.innerHTML='<h2 id="document-delete-confirm-title" style="margin:0 0 14px;color:#982a35">ยืนยันลบเอกสารถาวร</h2><p id="document-delete-confirm-message" style="white-space:pre-line;line-height:1.8"></p><div style="display:flex;justify-content:flex-end;gap:12px;margin-top:24px"><button type="button" class="ghost" data-cancel-delete>ยกเลิก</button><button type="button" class="primary" data-confirm-delete style="background:#b42332;border-color:#b42332;color:white">ยืนยันลบถาวร</button></div>';
      dialog.querySelector('p').textContent=message;
      let finished=false;
      const finish=value=>{if(finished)return;finished=true;active=false;dialog.close();dialog.remove();resolve(value);};
      dialog.querySelector('[data-cancel-delete]').onclick=()=>finish(false);
      dialog.querySelector('[data-confirm-delete]').onclick=()=>finish(true);
      dialog.addEventListener('cancel',event=>{event.preventDefault();finish(false);});
      dialog.addEventListener('close',()=>finish(false));
      document.body.append(dialog);dialog.showModal();dialog.querySelector('[data-cancel-delete]').focus();
    });
  };
  window.DocumentDeleteConfirm={ask};
})();
