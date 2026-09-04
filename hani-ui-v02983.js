/* =========================================================
   HANI OS v2.9.83
   Newsroom Logo Canonicalization
   UI/read-only patch: no localStorage write, no Supabase write,
   no schema/storage-key/internal-data-version changes.
   ========================================================= */
(() => {
  'use strict';

  const PATCH_ID = 'HANI_UI_V02983_NEWSROOM_LOGO_CANONICAL';
  const STYLE_ID = 'hani-ui-v02983-style';
  if (window[PATCH_ID]) return;
  window[PATCH_ID] = true;

  const q = (sel, root = document) => root?.querySelector?.(sel) || null;
  const qa = (sel, root = document) => root?.querySelectorAll ? Array.from(root.querySelectorAll(sel)) : [];
  const text = el => String(el?.textContent || '').replace(/\s+/g,' ').trim();

  const STOCKS = [
    {id:'lg', rx:/(LG전자(?:우)?|066570|066575)/i, color:'#a50034', fallback:'LG', icon:'https://cdn.simpleicons.org/lg/FFFFFF'},
    {id:'samsung', rx:/(삼성전자(?:우)?|005930|005935)/i, color:'#1428a0', fallback:'SAMSUNG', icon:'https://cdn.simpleicons.org/samsung/FFFFFF'},
    {id:'nvidia', rx:/(엔비디아|NVIDIA|\bNVDA\b)/i, color:'#76b900', fallback:'N', icon:'https://cdn.simpleicons.org/nvidia/FFFFFF'},
    {id:'amazon', rx:/(아마존|AMAZON|\bAMZN\b|\bAWS\b)/i, color:'#232f3e', fallback:'a', kind:'amazon'},
    {id:'alphabet', rx:/(알파벳|GOOGLE|\bGOOGL\b|\bGOOG\b)/i, color:'#ffffff', fallback:'G', kind:'google'},
    {id:'skhynix', rx:/(SK\s*하이닉스|하이닉스|000660|SK\s*HYNIX)/i, color:'#e6002d', fallback:'SK', icon:'https://cdn.simpleicons.org/skhynix/FFFFFF'}
  ];

  const ALL_LOGO_SELECTOR = [
    '.hani-news-logo-v02983',
    '.hani-news-logo-v02982',
    '.hani-news-logo-v02980',
    '.hani-security-logo-v02979',
    '.hani-security-logo-v02978',
    '.hani-security-logo-v02976'
  ].join(',');

  function resolveStock(raw) {
    const s=String(raw||'').replace(/\s+/g,' ').trim();
    for(const item of STOCKS) if(item.rx.test(s)) return item;
    return null;
  }

  function injectStyle() {
    if(q('#'+STYLE_ID)) return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
/* ===== v2.9.83 · newsroom canonical single-logo layer ===== */
#newsroom .hani-news-logo-v02982,
#newsroom .hani-news-logo-v02980,
#newsroom .hani-security-logo-v02979,
#newsroom .hani-security-logo-v02978,
#newsroom .hani-security-logo-v02976{display:none!important;visibility:hidden!important}

#newsroom .hani-news-stockcell-v02983{display:flex!important;align-items:center!important;gap:9px!important;min-width:0!important}
#newsroom .hani-news-logo-v02983{
  --stock-color:#64748b;display:inline-grid!important;place-items:center!important;position:relative!important;
  flex:0 0 30px!important;width:30px!important;height:30px!important;border-radius:9px!important;
  background:var(--stock-color)!important;border:1px solid color-mix(in srgb,var(--stock-color) 80%,#fff)!important;
  color:#fff!important;overflow:hidden!important;box-shadow:0 2px 7px color-mix(in srgb,var(--stock-color) 18%,transparent)!important;
  opacity:1!important;visibility:visible!important
}
#newsroom .investment-news-entity-row .hani-news-logo-v02983{width:34px!important;height:34px!important;flex-basis:34px!important;border-radius:10px!important}
#newsroom .hani-news-logo-v02983 img{position:absolute!important;inset:17%!important;width:66%!important;height:66%!important;object-fit:contain!important;opacity:0!important;visibility:visible!important}
#newsroom .hani-news-logo-v02983.logo-loaded img{opacity:1!important}
#newsroom .hani-news-logo-v02983.logo-loaded .fallback{opacity:0!important}
#newsroom .hani-news-logo-v02983 .fallback{display:block!important;opacity:1!important;visibility:visible!important;color:#fff!important;font-size:7px!important;font-weight:1000!important;line-height:1!important;text-align:center!important;white-space:nowrap!important}
#newsroom .hani-news-logo-v02983.brand-samsung .fallback{font-size:5.5px!important}
#newsroom .hani-news-logo-v02983.brand-amazon{background:#232f3e!important;border-color:#35475a!important}
#newsroom .hani-news-logo-v02983.brand-amazon .fallback{display:block!important;opacity:1!important;visibility:visible!important;color:#fff!important;-webkit-text-fill-color:#fff!important;font:1000 18px/1 Arial,sans-serif!important;transform:translateY(-2px)!important;text-shadow:none!important;filter:none!important;mix-blend-mode:normal!important}
#newsroom .hani-news-logo-v02983.brand-amazon:after{content:"";position:absolute;left:25%;right:18%;bottom:21%;height:5px;border-bottom:2px solid #ff9900;border-radius:0 0 55% 55%;transform:rotate(-7deg)}
#newsroom .hani-news-logo-v02983.brand-alphabet{background:#fff!important;border-color:#d8dee8!important}
#newsroom .hani-news-logo-v02983.brand-alphabet .fallback{font:1000 18px/1 Arial,sans-serif!important;background:conic-gradient(from -40deg,#4285f4 0 25%,#34a853 0 45%,#fbbc05 0 67%,#ea4335 0 82%,#4285f4 0);-webkit-background-clip:text;background-clip:text;color:transparent!important;-webkit-text-fill-color:transparent!important}
`;
    document.head.appendChild(style);
  }

  function makeLogo(identity) {
    const el=document.createElement('span');
    el.className=`hani-news-logo-v02983 brand-${identity.id}`;
    el.dataset.stockId=identity.id;
    el.style.setProperty('--stock-color',identity.color);
    el.setAttribute('role','img');
    el.setAttribute('aria-label',identity.id+' logo');

    if(identity.icon){
      const img=document.createElement('img');
      img.src=identity.icon;
      img.alt='';
      img.loading='eager';
      img.referrerPolicy='no-referrer';
      img.addEventListener('load',()=>el.classList.add('logo-loaded'),{once:true});
      img.addEventListener('error',()=>el.classList.add('logo-failed'),{once:true});
      el.appendChild(img);
    }
    const fallback=document.createElement('b');
    fallback.className='fallback';
    fallback.textContent=identity.fallback;
    el.appendChild(fallback);
    return el;
  }

  function upperRows() {
    const root=q('#newsroom'); if(!root) return [];
    const rows=qa('.investment-news-entity-row,.investment-news-summary-row,[data-news-entity]',root);
    return rows.filter((x,i,a)=>a.indexOf(x)===i);
  }

  function feedRows() {
    const root=q('#newsroom'); if(!root) return [];
    const feed=q('#investmentNewsFeed',root) || root;
    const rows=qa('.newsroom-v03-row,.investment-news-board-row,[data-news-id]',feed);
    return rows.filter((x,i,a)=>a.indexOf(x)===i);
  }

  function stockCell(row, upper) {
    if(!row) return null;
    if(upper) return q('.news-entity-main,.investment-news-entity-main,.news-entity-name,[data-news-entity-main]',row) || row.firstElementChild;
    const main=q('.newsroom-v03-main,.investment-news-row-main',row);
    return q('.newsroom-v03-stock,.investment-news-stock,.news-col-stock,[data-news-stock]',row) || main?.children?.[0] || row.firstElementChild;
  }

  function canonicalizeRow(row, upper) {
    const cell=stockCell(row,upper);
    const identity=resolveStock(text(cell)||text(row));
    if(!cell || !identity) return;

    const all=qa(ALL_LOGO_SELECTOR,row);
    const canonical=all.filter(x=>x.classList.contains('hani-news-logo-v02983') && x.parentElement===cell && x.dataset.stockId===identity.id);
    const alreadyClean=all.length===1 && canonical.length===1;

    qa('.hani-news-stockcell-v02983',row).forEach(el=>{if(el!==cell)el.classList.remove('hani-news-stockcell-v02983')});
    cell.classList.add('hani-news-stockcell-v02983');

    if(alreadyClean) return;
    all.forEach(x=>x.remove());
    cell.insertBefore(makeLogo(identity),cell.firstChild);
  }

  function normalizeNewsroomLogos() {
    upperRows().forEach(r=>canonicalizeRow(r,true));
    feedRows().forEach(r=>canonicalizeRow(r,false));
  }

  function selfAudit() {
    const rows=[...upperRows(),...feedRows()];
    const eligible=rows.filter(r=>resolveStock(text(r)));
    const duplicates=eligible.filter(r=>qa('.hani-news-logo-v02983',r).length!==1).length;
    const legacyVisible=eligible.filter(r=>qa('.hani-news-logo-v02982,.hani-news-logo-v02980,.hani-security-logo-v02979,.hani-security-logo-v02978,.hani-security-logo-v02976',r).some(el=>getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden')).length;
    const amazon=eligible.filter(r=>resolveStock(text(r))?.id==='amazon');
    const result={
      eligibleRows:eligible.length,
      oneLogoRows:eligible.filter(r=>qa('.hani-news-logo-v02983',r).length===1).length,
      duplicateRows:duplicates,
      visibleLegacyRows:legacyVisible,
      amazonRows:amazon.length,
      amazonCanonical:amazon.filter(r=>qa('.hani-news-logo-v02983.brand-amazon',r).length===1).length
    };
    window.HANI_V02983_AUDIT=result;
    return result;
  }

  let timer=0;
  function schedule(ms=70){clearTimeout(timer);timer=setTimeout(()=>{normalizeNewsroomLogos();selfAudit()},ms)}
  function burst(){[0,90,220,500,1000,2200].forEach(ms=>setTimeout(()=>{normalizeNewsroomLogos();selfAudit()},ms))}

  function boot() {
    injectStyle();
    normalizeNewsroomLogos();
    selfAudit();
    const ob=new MutationObserver(records=>{
      const meaningful=records.some(r=>Array.from(r.addedNodes||[]).some(n=>n.nodeType===1&&!n.matches?.('.hani-news-logo-v02983')) || Array.from(r.removedNodes||[]).some(n=>n.nodeType===1));
      if(meaningful)schedule(80);
    });
    const root=q('#newsroom')||document.body;
    ob.observe(root,{subtree:true,childList:true});
    document.addEventListener('click',ev=>{if(ev.target.closest?.('[data-view="newsroom"],#newsroom select,#newsroom button'))burst()},true);
    burst();
    console.info('[HANI OS] v2.9.83 newsroom single-logo canonicalization ready');
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
