/* =========================================================
   HANI OS v2.9.80
   Final Visual Polish · LG News / HASDAQ / ETF Identity
   UI/read-only patch: no localStorage write, no Supabase write,
   no schema/storage-key/internal-data-version changes.
   ========================================================= */
(() => {
  'use strict';

  const PATCH_ID = 'HANI_UI_V02980_FINAL_POLISH';
  const STYLE_ID = 'hani-ui-v02980-style';
  if (window[PATCH_ID]) return;
  window[PATCH_ID] = true;

  const q = (sel, root = document) => root?.querySelector?.(sel) || null;
  const qa = (sel, root = document) => root?.querySelectorAll ? Array.from(root.querySelectorAll(sel)) : [];
  const txt = el => String(el?.textContent || '').replace(/\s+/g, ' ').trim();

  const ETF_ISSUERS = [
    {id:'ace',   rx:/\bACE\b/i,   color:'#647f9e'},
    {id:'kodex', rx:/\bKODEX\b/i, color:'#1769e0'},
    {id:'sol',   rx:/\bSOL\b/i,   color:'#078bc8'},
    {id:'tiger', rx:/\bTIGER\b/i, color:'#f27616'},
    {id:'robo',  rx:/\bROBO\b|로보\s*글로벌|로보틱스\/자동화/i, color:'#2877ef'},
    {id:'rise',  rx:/\bRISE\b/i,  color:'#f4c400'},
    {id:'plus',  rx:/\bPLUS\b/i,  color:'#f47a1f'},
    {id:'koact', rx:/\bKOACT\b/i, color:'#2468f2'}
  ];

  const STOCKS = [
    {id:'lg', rx:/(LG전자(?:우)?|066570|066575)/i, color:'#a50034', fallback:'LG', icon:'https://cdn.simpleicons.org/lg/FFFFFF'},
    {id:'samsung', rx:/(삼성전자(?:우)?|005930|005935)/i, color:'#1428a0', fallback:'SAMSUNG', icon:'https://cdn.simpleicons.org/samsung/FFFFFF'},
    {id:'nvidia', rx:/(엔비디아|NVIDIA|\bNVDA\b)/i, color:'#76b900', fallback:'N', icon:'https://cdn.simpleicons.org/nvidia/FFFFFF'},
    {id:'amazon', rx:/(아마존|AMAZON|\bAMZN\b|\bAWS\b)/i, color:'#232f3e', fallback:'a', kind:'amazon'}
  ];

  function injectStyle() {
    if (q('#' + STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
/* ===== v2.9.80 · final visual polish ===== */

/* HASDAQ: title and monthly change are one visual line. */
#haniHasdaqBoardV02976 .hani-hasdaq-inline-v02979{display:none!important}
#haniHasdaqBoardV02976 .hani-hasdaq-titleline-v02980{
  display:flex!important;align-items:center!important;gap:12px!important;flex-wrap:wrap!important;min-width:0
}
#haniHasdaqBoardV02976 .hani-hasdaq-titleline-v02980 > b,
#haniHasdaqBoardV02976 .hani-hasdaq-titleline-v02980 > strong,
#haniHasdaqBoardV02976 .hani-hasdaq-titleline-v02980 > h2,
#haniHasdaqBoardV02976 .hani-hasdaq-titleline-v02980 > h3{margin:0!important}
#haniHasdaqBoardV02976 .hani-hasdaq-change-v02980{
  display:inline-flex!important;align-items:baseline!important;gap:6px!important;
  margin:0!important;padding:0!important;background:transparent!important;border:0!important;
  line-height:1!important;white-space:nowrap!important
}
#haniHasdaqBoardV02976 .hani-hasdaq-change-v02980 .value{font-size:19px!important;font-weight:1000!important;letter-spacing:-.04em!important}
#haniHasdaqBoardV02976 .hani-hasdaq-change-v02980.up .value{color:#d83e4c!important}
#haniHasdaqBoardV02976 .hani-hasdaq-change-v02980.down .value{color:#2d6fd3!important}
#haniHasdaqBoardV02976 .hani-hasdaq-change-v02980.flat .value,
#haniHasdaqBoardV02976 .hani-hasdaq-change-v02980.na .value{color:#697587!important}
#haniHasdaqBoardV02976 .hani-hasdaq-change-v02980 small{font-size:10px!important;font-weight:850!important;color:#8791a2!important}

/* v2.9.80 ETF identity: issuer color + product white mark. */
#investment .hani-security-logo-v02979.etf{display:none!important}
.hani-etf-cell-v02980{display:flex!important;align-items:center!important;gap:11px!important;min-width:0!important}
.hani-etf-logo-v02980{
  --etf-color:#647f9e;display:inline-grid!important;place-items:center!important;position:relative!important;
  flex:0 0 36px!important;width:36px!important;height:36px!important;border-radius:11px!important;
  background:var(--etf-color)!important;color:#fff!important;
  border:1px solid color-mix(in srgb,var(--etf-color) 82%,#fff)!important;
  box-shadow:0 3px 9px color-mix(in srgb,var(--etf-color) 20%,transparent)!important;overflow:hidden!important
}
.hani-etf-logo-v02980 svg{width:58%!important;height:58%!important;color:#fff!important}
.hani-etf-logo-v02980 .etf-text{font-size:7px!important;line-height:.92!important;font-weight:1000!important;letter-spacing:-.05em!important;color:#fff!important;white-space:pre-line!important;text-align:center!important}
.hani-etf-logo-v02980.brand-rise{color:#504900!important}.hani-etf-logo-v02980.brand-rise svg,.hani-etf-logo-v02980.brand-rise .etf-text{color:#504900!important}

/* Newsroom logos: always visible and independent from old patch visibility. */
#newsroom .hani-security-logo-v02979{display:none!important}
#newsroom .hani-news-logo-v02980{
  --stock-color:#64748b;display:inline-grid!important;place-items:center!important;position:relative!important;
  flex:0 0 30px!important;width:30px!important;height:30px!important;border-radius:9px!important;
  background:var(--stock-color)!important;border:1px solid color-mix(in srgb,var(--stock-color) 80%,#fff)!important;
  color:#fff!important;overflow:hidden!important;margin-right:9px!important;vertical-align:middle!important
}
#newsroom .hani-news-logo-v02980 img{position:absolute!important;inset:17%!important;width:66%!important;height:66%!important;object-fit:contain!important;opacity:0}
#newsroom .hani-news-logo-v02980.logo-loaded img{opacity:1!important}
#newsroom .hani-news-logo-v02980.logo-loaded .fallback{opacity:0!important}
#newsroom .hani-news-logo-v02980 .fallback{font-size:7px!important;font-weight:1000!important;color:#fff!important;line-height:1!important}
#newsroom .hani-news-logo-v02980.brand-amazon .fallback{font:1000 18px/1 Arial,sans-serif!important;transform:translateY(-2px)}
#newsroom .hani-news-logo-v02980.brand-amazon:after{content:"";position:absolute;left:25%;right:18%;bottom:21%;height:5px;border-bottom:2px solid #ff9900;border-radius:0 0 55% 55%;transform:rotate(-7deg)}
#newsroom .hani-news-cell-v02980{display:flex!important;align-items:center!important;min-width:0!important}
#newsroom .hani-news-cell-copy-v02980{min-width:0!important;display:block!important}

/* LG preferred is visually grouped under LG Electronics, with preferred-stock relation kept as metadata. */
#newsroom .hani-lg-preferred-badge-v02980{
  display:inline-flex!important;align-items:center!important;margin-left:6px!important;padding:2px 6px!important;
  border-radius:999px!important;background:#f7eef2!important;color:#a50034!important;
  border:1px solid #eed4dd!important;font-size:9px!important;font-weight:900!important;white-space:nowrap!important
}
`;
    document.head.appendChild(style);
  }

  function etfTheme(raw) {
    const s = String(raw || '').toUpperCase();
    if (/NASDAQ\s*100|나스닥\s*100|나스닥100/.test(s)) return {kind:'text', label:'나스닥\n100'};
    if (/S&P\s*500|S&P500/.test(s)) return {kind:'text', label:'S&P\n500'};
    if (/국채|채권|TREASURY|BOND/.test(s)) return {kind:'bond'};
    if (/반도체|HBM|SEMICONDUCT/.test(s)) return {kind:'chip'};
    if (/배당|DIVIDEND/.test(s)) return {kind:'dividend'};
    if (/ROBO|로봇|자동화|ROBOT/.test(s)) return {kind:'robot'};
    if (/방산|DEFEN/.test(s)) return {kind:'shield'};
    if (/헬스|HEALTH/.test(s)) return {kind:'health'};
    if (/AI|인공지능/.test(s)) return {kind:'ai'};
    if (/금액티브|GOLD|골드/.test(s)) return {kind:'gold'};
    if (/커버드콜|COVERED/.test(s)) return {kind:'covered'};
    if (/(^|\D)200(\D|$)/.test(s)) return {kind:'text', label:'200'};
    if (/(^|\D)150(\D|$)/.test(s)) return {kind:'text', label:'150'};
    return {kind:'etf'};
  }

  function resolveEtf(raw) {
    const t = String(raw || '').replace(/\s+/g,' ').trim();
    for (const issuer of ETF_ISSUERS) {
      if (issuer.rx.test(t)) return {...issuer, theme:etfTheme(t)};
    }
    return null;
  }

  function iconSvg(kind) {
    const common='viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
    const map={
      bond:`<svg ${common}><circle cx="12" cy="12" r="8"/><path d="M12 6v12M15 8.5c-.8-.7-1.8-1-3-1-1.8 0-3 .8-3 2 0 1.4 1.3 1.8 3.1 2.2 1.8.4 3 .9 3 2.3 0 1.4-1.3 2.3-3.2 2.3-1.3 0-2.5-.4-3.4-1.2"/></svg>`,
      chip:`<svg ${common}><rect x="7" y="7" width="10" height="10" rx="2"/><path d="M9 2v3M12 2v3M15 2v3M9 19v3M12 19v3M15 19v3M2 9h3M2 12h3M2 15h3M19 9h3M19 12h3M19 15h3"/></svg>`,
      dividend:`<svg ${common}><circle cx="12" cy="12" r="8"/><path d="M8.5 12h7M12 8.5v7M9.5 9.5c.7-.6 1.5-1 2.5-1 1.5 0 2.5.7 2.5 1.7 0 2.6-5 1.4-5 4 0 1 1 1.8 2.6 1.8 1 0 2-.3 2.7-1"/></svg>`,
      robot:`<svg ${common}><rect x="5" y="7" width="14" height="11" rx="3"/><path d="M9 12h.01M15 12h.01M9 16h6M12 3v4M8 4 7 3M16 4l1-1"/></svg>`,
      shield:`<svg ${common}><path d="M12 3 19 6v5c0 4.6-2.8 8-7 10-4.2-2-7-5.4-7-10V6l7-3Z"/><path d="m9 12 2 2 4-4"/></svg>`,
      health:`<svg ${common}><path d="M9 4h6v5h5v6h-5v5H9v-5H4V9h5V4Z"/></svg>`,
      ai:`<svg ${common}><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/></svg>`,
      gold:`<svg ${common}><path d="m7 8 2-3h6l2 3 2 9H5l2-9Z"/><path d="M8 11h8"/></svg>`,
      covered:`<svg ${common}><path d="M4 8h11l-3-3M20 16H9l3 3"/><path d="M15 5l3 3-3 3M9 19l-3-3 3-3"/></svg>`,
      etf:`<svg ${common}><path d="M4 18V9M10 18V5M16 18v-7M22 18V3"/></svg>`
    };
    return map[kind] || map.etf;
  }

  function etfLogo(identity) {
    const el=document.createElement('span');
    el.className=`hani-etf-logo-v02980 brand-${identity.id}`;
    el.style.setProperty('--etf-color',identity.color);
    el.setAttribute('role','img');
    el.setAttribute('aria-label',`${identity.id.toUpperCase()} ETF`);
    if (identity.theme?.kind === 'text') {
      const b=document.createElement('b'); b.className='etf-text'; b.textContent=identity.theme.label; el.appendChild(b);
    } else {
      el.innerHTML=iconSvg(identity.theme?.kind || 'etf');
    }
    return el;
  }

  function ensureEtfLogo(target, identity) {
    if (!target || !identity) return;
    qa('.hani-etf-logo-v02980,.hani-security-logo-v02979.etf,.hani-security-logo-v02978.etf,.hani-security-logo-v02976.etf',target).forEach(x=>x.remove());
    target.classList.add('hani-etf-cell-v02980');
    target.insertBefore(etfLogo(identity),target.firstChild);
  }

  function decorateEtfRows() {
    const root=q('#investment'); if(!root)return;
    const rows=qa('tr,.holding-row,.security-row,.instrument-row,.investment-holding-row,.stock-row,.list-row,.item-row',root);
    rows.forEach(row=>{
      if(row.closest('#newsroom'))return;
      const identity=resolveEtf(txt(row)); if(!identity)return;
      let target=q('td:first-child',row);
      if(!target){
        const named=qa('b,strong,h3,h4,.name,.instrument-name,.security-name',row).find(el=>resolveEtf(txt(el)));
        target=named?.parentElement && named.parentElement!==row ? named.parentElement : (named||row.firstElementChild||row);
      }
      ensureEtfLogo(target,identity);
      row.dataset.haniEtfV02980=identity.id;
    });

    /* Fallback for list renderers whose rows do not use the known row classes. */
    qa('td:first-child,b,strong,h3,h4,.name,.instrument-name,.security-name',root).forEach(el=>{
      if(el.closest('.hani-etf-logo-v02980')||el.closest('#newsroom'))return;
      const own=txt(el); const identity=resolveEtf(own); if(!identity)return;
      const row=el.closest('tr,.holding-row,.security-row,.instrument-row,.investment-holding-row,.stock-row,.list-row,.item-row');
      if(row?.dataset?.haniEtfV02980)return;
      const target=el.closest('td')||el.parentElement||el;
      ensureEtfLogo(target,identity);
      if(row)row.dataset.haniEtfV02980=identity.id;
    });
  }

  function stockIdentity(raw) {
    const t=String(raw||'');
    return STOCKS.find(x=>x.rx.test(t)) || null;
  }

  function newsLogo(identity) {
    const el=document.createElement('span');
    el.className=`hani-news-logo-v02980 brand-${identity.id}`;
    el.style.setProperty('--stock-color',identity.color);
    const fallback=document.createElement('b'); fallback.className='fallback'; fallback.textContent=identity.fallback; el.appendChild(fallback);
    if(identity.icon){
      const img=new Image(); img.alt=''; img.loading='eager'; img.decoding='async'; img.referrerPolicy='no-referrer'; img.src=identity.icon;
      img.addEventListener('load',()=>el.classList.add('logo-loaded'),{once:true}); el.appendChild(img);
    }
    return el;
  }

  function wrapNewsCell(cell) {
    if(!cell)return null;
    let copy=q(':scope > .hani-news-cell-copy-v02980',cell);
    if(copy)return copy;
    copy=document.createElement('span'); copy.className='hani-news-cell-copy-v02980';
    Array.from(cell.childNodes).filter(n=>!(n.nodeType===1 && (n.classList?.contains('hani-news-logo-v02980')||n.classList?.contains('hani-security-logo-v02979')))).forEach(n=>copy.appendChild(n));
    cell.appendChild(copy); return copy;
  }

  function ensureNewsLogo(cell,identity) {
    if(!cell||!identity)return;
    qa('.hani-news-logo-v02980,.hani-security-logo-v02979,.hani-security-logo-v02978,.hani-security-logo-v02976',cell).forEach(x=>x.remove());
    const copy=wrapNewsCell(cell);
    cell.classList.add('hani-news-cell-v02980');
    cell.insertBefore(newsLogo(identity),copy||cell.firstChild);
  }

  function findUpperNewsRows(root) {
    const known=qa('.investment-news-entity-row,.investment-news-summary-row,[data-news-entity]',root);
    if(known.length)return known.filter((x,i,a)=>a.indexOf(x)===i);
    return qa('section,div',root).filter(el=>/LG전자우|삼성전자|엔비디아|아마존/.test(txt(el)) && el.children.length>=3 && el.children.length<=8);
  }

  function findFeedRows(root) {
    return qa('.newsroom-v03-row,.investment-news-board-row,[data-news-id]',root).filter((x,i,a)=>a.indexOf(x)===i);
  }

  function preferredBadge(copy) {
    if(!copy || q('.hani-lg-preferred-badge-v02980',copy))return;
    const badge=document.createElement('span'); badge.className='hani-lg-preferred-badge-v02980'; badge.textContent='LG전자우 연관'; copy.appendChild(badge);
  }

  function normalizeLgCell(cell) {
    if(!cell)return;
    const copy=wrapNewsCell(cell)||cell;
    const candidates=qa('b,strong,h3,h4,span',copy).filter(el=>!/hani-lg-preferred-badge-v02980/.test(el.className||''));
    const name=candidates.find(el=>/^LG전자우$/.test(txt(el))) || candidates.find(el=>/LG전자우/.test(txt(el)));
    if(name){
      if(name.childNodes.length===1 && name.firstChild?.nodeType===3) name.textContent=name.textContent.replace(/LG전자우/g,'LG전자');
      else Array.from(name.childNodes).forEach(n=>{if(n.nodeType===3)n.nodeValue=String(n.nodeValue).replace(/LG전자우/g,'LG전자')});
    }
    qa('small,span',copy).forEach(el=>{
      if(el.classList.contains('hani-lg-preferred-badge-v02980'))return;
      if(/발행회사\s*LG전자|LG전자 공통 뉴스\s*·\s*우선주 연관|LG전자 공통 뉴스 연관/.test(txt(el))){
        el.textContent='066575 · 우선주 연관';
      }
    });
    preferredBadge(copy);
  }

  function normalizeLgStory(row) {
    const title=qa('b,strong,h3,h4',row).find(el=>/우선주 직접 요인 점검/.test(txt(el)));
    if(title)title.textContent='LG전자 · 우선주 연관 요인 점검';
  }

  function decorateNewsroom() {
    const root=q('#newsroom'); if(!root)return;
    findUpperNewsRows(root).forEach(row=>{
      const cell=q('.news-entity-main,.investment-news-entity-main,.news-entity-name,[data-news-entity-main]',row)||row.firstElementChild;
      const identity=stockIdentity(txt(cell)||txt(row)); if(!cell||!identity)return;
      ensureNewsLogo(cell,identity);
      if(/LG전자우|066575/.test(txt(row)))normalizeLgCell(cell);
    });
    findFeedRows(root).forEach(row=>{
      const main=q('.newsroom-v03-main,.investment-news-row-main',row); if(!main)return;
      const cell=q('.newsroom-v03-stock,.investment-news-stock,.news-col-stock,[data-news-stock]',row)||main.children?.[0];
      const identity=stockIdentity(txt(cell)||txt(row)); if(!cell||!identity)return;
      ensureNewsLogo(cell,identity);
      if(/LG전자우|066575/.test(txt(row))){normalizeLgCell(cell);normalizeLgStory(row);}
    });

    /* Keep LG preferred filter visually under LG Electronics without changing stored filter value. */
    qa('button,option',root).forEach(el=>{
      if(/^LG전자우(?:\s|$)/.test(txt(el)) && !el.dataset.haniLgLabelV02980){
        el.dataset.haniLgLabelV02980='1';
        if(el.tagName==='OPTION')el.textContent=el.textContent.replace(/^LG전자우/,'LG전자');
        else Array.from(el.childNodes).forEach(n=>{if(n.nodeType===3)n.nodeValue=String(n.nodeValue).replace(/^LG전자우/,'LG전자')});
      }
    });
  }

  function polishHasdaq() {
    const board=q('#haniHasdaqBoardV02976'); if(!board)return;
    const old=q('.hani-hasdaq-inline-v02979',board);
    const oldText=txt(old);
    const tone=old?.classList.contains('up')?'up':old?.classList.contains('down')?'down':old?.classList.contains('flat')?'flat':'na';
    const m=oldText.match(/([+\-]?\d+(?:\.\d+)?)%/);
    const pct=m?.[1] || '';
    const brand=q('.hasdaq-brand',board)||board;
    const title=qa('b,strong,h2,h3',brand).find(el=>/HASDAQ\s*BOARD/i.test(txt(el)))||qa('b,strong,h2,h3',board).find(el=>/HASDAQ\s*BOARD/i.test(txt(el)));
    if(!title)return;
    let line=title.closest('.hani-hasdaq-titleline-v02980');
    if(!line){
      line=document.createElement('div'); line.className='hani-hasdaq-titleline-v02980';
      title.parentElement.insertBefore(line,title); line.appendChild(title);
    }
    qa('.hani-hasdaq-change-v02980',line).forEach(x=>x.remove());
    const chip=document.createElement('span'); chip.className=`hani-hasdaq-change-v02980 ${tone}`;
    chip.innerHTML=pct?`<span class="value">${tone==='up'?'↑ ':tone==='down'?'↓ ':''}${pct.startsWith('-')||pct.startsWith('+')?pct:(tone==='up'?'+':'')+pct}%</span><small>전월 대비</small>`:`<span class="value">—</span><small>비교 데이터 준비 중</small>`;
    line.appendChild(chip);
  }

  function selfAudit(){
    const root=q('#investment');
    const etfNamed=qa('tr,.holding-row,.security-row,.instrument-row,.investment-holding-row,.stock-row,.list-row,.item-row',root).filter(r=>resolveEtf(txt(r)));
    const result={
      hasdaqTitleLine:!!q('#haniHasdaqBoardV02976 .hani-hasdaq-titleline-v02980'),
      hasdaqChange:!!q('#haniHasdaqBoardV02976 .hani-hasdaq-change-v02980'),
      etfRows:etfNamed.length,
      etfRowsWithLogo:etfNamed.filter(r=>!!q('.hani-etf-logo-v02980',r)).length,
      newsroomLogos:qa('#newsroom .hani-news-logo-v02980').length,
      lgNormalized:qa('#newsroom .hani-lg-preferred-badge-v02980').length
    };
    window.HANI_V02980_AUDIT=result;
    return result;
  }

  function refresh(){
    polishHasdaq();
    decorateEtfRows();
    decorateNewsroom();
    selfAudit();
  }

  let timer=0;
  function schedule(ms=100){clearTimeout(timer);timer=setTimeout(refresh,ms)}
  function boot(){
    injectStyle(); refresh();
    const observer=new MutationObserver(records=>{
      const meaningful=records.some(r=>Array.from(r.addedNodes||[]).some(n=>n.nodeType===1&&!n.matches?.('.hani-etf-logo-v02980,.hani-news-logo-v02980,.hani-hasdaq-change-v02980')));
      if(meaningful)schedule(110);
    });
    observer.observe(document.body,{subtree:true,childList:true});
    document.addEventListener('click',ev=>{if(ev.target.closest?.('[data-view],#investment button,#newsroom button,#newsroom select'))setTimeout(refresh,140)},true);
    window.setTimeout(refresh,350);window.setTimeout(refresh,1000);
    console.info('[HANI OS] v2.9.80 Final Visual Polish ready · read-only UI patch');
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();