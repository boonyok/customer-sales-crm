(() => {
  const key='flowbill-session';let pending;
  const get=()=>{try{return JSON.parse(localStorage.getItem(key)||'null');}catch{return null;}};
  const expiry=s=>{if(s?.expires_at)return Number(s.expires_at)*1000;try{return JSON.parse(atob(s.access_token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).exp*1000;}catch{return 0;}};
  const failure=(message,status)=>Object.assign(new Error(message),{status});
  async function ensure(force=false){
    const current=get();if(!current)return null;
    if(!force&&expiry(current)>Date.now()+60000)return current;
    if(pending)return pending;
    const renew=async()=>{
      const saved=get();if(!saved)return null;
      if(saved.access_token!==current.access_token||(!force&&expiry(saved)>Date.now()+60000))return saved;
      if(!saved.refresh_token)throw failure('เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง',401);
      const config=window.SUPABASE_CONFIG,controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
      try{
        const response=await fetch(config.url+'/auth/v1/token?grant_type=refresh_token',{method:'POST',signal:controller.signal,headers:{apikey:config.publishableKey,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:saved.refresh_token})});
        if(!response.ok)throw failure(response.status===400||response.status===401?'เซสชันถูกยกเลิก กรุณาเข้าสู่ระบบอีกครั้ง':'ต่ออายุเซสชันไม่สำเร็จ กรุณาลองใหม่',response.status===400?401:response.status);
        const next=await response.json();if(!next.access_token||!next.refresh_token||next.user?.id!==saved.user?.id)throw failure('ข้อมูลเซสชันไม่ถูกต้อง',401);
        if(!get())return null; // Never restore a session after explicit logout.
        if(get().refresh_token!==saved.refresh_token)return get();
        next.expires_at=next.expires_at||Math.floor(Date.now()/1000)+Number(next.expires_in||3600);
        localStorage.setItem(key,JSON.stringify(next));return next;
      }finally{clearTimeout(timer);}
    };
    pending=(navigator.locks?.request?navigator.locks.request('flowbill-session-refresh',renew):renew()).finally(()=>{pending=null;});return pending;
  }
  window.CRMSession={get,ensure};
  const maintain=()=>{if(get())ensure().catch(()=>{});};
  setInterval(maintain,30000);
  window.addEventListener('focus',maintain);
  window.addEventListener('online',maintain);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')maintain();});
})();
