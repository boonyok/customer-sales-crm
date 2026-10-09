(() => {
  const normalize=value=>String(value??'').normalize('NFKC').toLocaleLowerCase('th-TH').replace(/[\u200b-\u200d\ufeff]/g,'').replace(/\s+/g,' ').trim();
  const matches=(name,query)=>normalize(query).split(' ').filter(Boolean).every(word=>normalize(name).includes(word));
  let sequence=0;
  const mount=select=>{
    if(select.dataset.customerNamePicker)return;
    select.dataset.customerNamePicker='true';
    const wrapper=document.createElement('div');wrapper.className='customer-name-picker';
    const input=document.createElement('input');input.type='text';input.autocomplete='off';input.placeholder='พิมพ์คำส่วนไหนของชื่อลูกค้าก็ได้';
    input.setAttribute('role','combobox');input.setAttribute('aria-autocomplete','list');input.setAttribute('aria-expanded','false');input.setAttribute('aria-label','ค้นหาและเลือกลูกค้า');
    input.required=select.required;select.required=false;
    const list=document.createElement('div');list.className='customer-name-options';list.id='customer-name-options-'+(++sequence);list.setAttribute('role','listbox');list.setAttribute('aria-label','ผลค้นหาลูกค้า');list.hidden=true;input.setAttribute('aria-controls',list.id);
    wrapper.append(input,list);select.after(wrapper);select.hidden=true;select.style.display='none';select.tabIndex=-1;
    let results=[],active=-1;
    const close=()=>{list.hidden=true;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');active=-1;};
    const sync=()=>{
      input.disabled=select.disabled;
      const option=select.selectedOptions[0];input.value=option?.value?option.textContent.trim():'';
      input.setCustomValidity('');close();
    };
    const choose=option=>{
      if(select.disabled)return;
      select.value=option.value;sync();select.dispatchEvent(new Event('change',{bubbles:true}));input.focus();close();
    };
    const highlight=index=>{
      active=index;
      [...list.querySelectorAll('[role=option]')].forEach((node,i)=>node.setAttribute('aria-selected',String(i===active)));
      const node=list.querySelectorAll('[role=option]')[active];
      if(node){input.setAttribute('aria-activedescendant',node.id);node.scrollIntoView({block:'nearest'});}
    };
    const render=()=>{
      if(input.disabled)return;
      results=[...select.options].filter(option=>option.value&&!option.disabled&&matches(option.textContent,input.value));active=-1;list.replaceChildren();
      if(!results.length){const empty=document.createElement('p');empty.className='customer-name-empty';empty.textContent='ไม่พบลูกค้าที่ตรงกับคำค้น';list.append(empty);}
      results.forEach((option,index)=>{
        const button=document.createElement('button');button.type='button';button.id=list.id+'-'+index;button.tabIndex=-1;button.setAttribute('role','option');button.setAttribute('aria-selected','false');button.textContent=option.textContent.trim();
        button.onmousedown=event=>event.preventDefault();button.onclick=()=>choose(option);list.append(button);
      });
      list.hidden=false;input.setAttribute('aria-expanded','true');input.removeAttribute('aria-activedescendant');
    };
    input.oninput=()=>{select.value='';input.setCustomValidity('กรุณาเลือกลูกค้าจากผลค้นหา');render();};
    input.onfocus=()=>{input.select();render();};
    input.onblur=()=>setTimeout(close,120);
    input.onkeydown=event=>{
      if(event.key==='Escape'){event.preventDefault();close();return;}
      if(event.key==='Tab'){close();return;}
      if(event.key==='ArrowDown'||event.key==='ArrowUp'){
        event.preventDefault();if(list.hidden)render();if(results.length)highlight(event.key==='ArrowDown'?Math.min(active+1,results.length-1):Math.max(active-1,0));
      }else if(event.key==='Enter'&&!list.hidden){event.preventDefault();if(active>=0)choose(results[active]);else if(results.length===1)choose(results[0]);}
    };
    select.addEventListener('change',sync);select.form?.addEventListener('reset',()=>setTimeout(sync,0));sync();
  };
  const selector='select[name="customerId"],select[name="customer"],select[name="customer_id"]';
  const scan=root=>{if(root.matches?.(selector))mount(root);root.querySelectorAll?.(selector).forEach(mount);};
  if(typeof document!=='undefined'){
    const style=document.createElement('style');style.textContent='.customer-name-picker{position:relative;min-width:0;width:100%}.customer-name-picker>input{box-sizing:border-box;width:100%;font:inherit;padding:12px;border:1px solid #bfdcef;border-radius:7px;background:#fff;color:#163b57}.customer-name-options[hidden]{display:none}.customer-name-options{position:absolute;z-index:100;top:calc(100% + 4px);left:0;right:0;max-height:250px;overflow:auto;border:1px solid #bfdcef;border-radius:9px;background:#fff;box-shadow:0 10px 28px #163b5726;padding:5px}.customer-name-options>button{display:block;width:100%;text-align:left;white-space:normal;border:0;border-radius:5px;background:#fff;color:#163b57;font:inherit;padding:11px 12px;line-height:1.5;cursor:pointer}.customer-name-options>button:hover,.customer-name-options>button[aria-selected=true]{background:#e0f2ff;color:#086b95}.customer-name-empty{padding:10px;margin:0;color:#62809a;font-size:13px}';document.head.append(style);
    scan(document);
    new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(node=>{if(node.nodeType===1)scan(node);}))).observe(document.body,{childList:true,subtree:true});
  }
  window.CustomerNamePicker={matches,normalize,mount};
})();
