(() => {
  // Boonyok's own SKU convention: style + D + Ins + width I height + color.
  function parse(value) {
    const m=String(value??'').trim().match(/^(RUU|RU|RT|RH|RR|R|E|FZL|FZS|S)(D)?(Ins)?(\d+(?:\.\d+)?)I(\d+(?:\.\d+)?)(BK|W|T)?$/i);
    if(!m)return null;
    return {style:m[1].toUpperCase(),damper:Boolean(m[2]),screen:Boolean(m[3]),width:Number(m[4]),length:Number(m[5]),color:m[6]?.toUpperCase()||'',dimension:m[4]+'I'+m[5]};
  }
  function withScreen(sku){const p=parse(sku);return p&&!p.screen?p.style+(p.damper?'D':'')+'Ins'+p.dimension+p.color:null;}
  function price(base){
    if(base===null||base===undefined||base==='')throw Error('ไม่มีราคาฐาน');
    const cents=Math.round(Number(base)*100);
    if(!Number.isSafeInteger(cents)||cents<=0)throw Error('ราคาฐานต้องมากกว่า 0');
    return Math.round((cents+Math.max(cents*15/100,7000))/100);
  }
  function matchesEquipment(product,filters){
    const p=parse(product.sku);if(!p)return null;
    return (!filters.returnStyle||filters.returnStyle===p.style)
      &&(!filters.damper||(filters.damper==='yes')===p.damper)
      &&(!filters.screen||(filters.screen==='yes')===p.screen)
      &&(!filters.color||filters.color===({W:'white',BK:'black',T:'custom','':'aluminium'}[p.color]));
  }
  window.ReturnAirCode={parse,withScreen,price,matchesEquipment};
})();
