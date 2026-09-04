/* =========================================================
   HANI OS v2.9.82
   Newsroom Event Arbitration + Persistent Identity + ETF Leaf Scan
   UI/read-only patch: no localStorage write, no Supabase write,
   no schema/storage-key/internal-data-version changes.
   ========================================================= */
(() => {
  'use strict';

  const PATCH_ID = 'HANI_UI_V02982_NEWSROOM_EVENT_IDENTITY_FIX';
  const STYLE_ID = 'hani-ui-v02982-style';
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
    {id:'lg', rx:/(LG전자(?:우)?|066570|066575)/i, label:'LG Electronics', color:'#a50034', fallback:'LG', icon:'https://cdn.simpleicons.org/lg/FFFFFF'},
    {id:'samsung', rx:/(삼성전자(?:우)?|005930|005935)/i, label:'Samsung Electronics', color:'#1428a0', fallback:'SAMSUNG', icon:'https://cdn.simpleicons.org/samsung/FFFFFF'},
    {id:'nvidia', rx:/(엔비디아|NVIDIA|\bNVDA\b)/i, label:'NVIDIA', color:'#76b900', fallback:'N', icon:'https://cdn.simpleicons.org/nvidia/FFFFFF'},
    {id:'amazon', rx:/(아마존|AMAZON|\bAMZN\b|\bAWS\b)/i, label:'Amazon / AWS', color:'#232f3e', fallback:'a', kind:'amazon'},
    {id:'alphabet', rx:/(알파벳|GOOGLE|\bGOOGL\b|\bGOOG\b)/i, label:'Alphabet / Google', color:'#ffffff', fallback:'G', kind:'google'},
    {id:'skhynix', rx:/(SK\s*하이닉스|하이닉스|000660|SK\s*HYNIX)/i, label:'SK hynix', color:'#e6002d', fallback:'SK', icon:'https://cdn.simpleicons.org/skhynix/FFFFFF'}
  ];

  function injectStyle() {
    if (q('#' + STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
/* ===== v2.9.82 · newsroom event arbitration / identity persistence ===== */

/* Keep v2.9.81 investment layout untouched; only supersede old ETF badges. */
#investment .hani-etf-logo-v02980,
#investment .hani-etf-logo-v02981,
#investment .hani-security-logo-v02979.etf,
#investment .hani-security-logo-v02978.etf,
#investment .hani-security-logo-v02976.etf{display:none!important;visibility:hidden!important}

.hani-etf-target-v02982{position:relative!important;min-width:0!important}
.hani-etf-target-v02982:not(td){display:flex!important;align-items:center!important;gap:11px!important}
td.hani-etf-target-v02982{padding-left:58px!important}
td.hani-etf-target-v02982>.hani-etf-logo-v02982{position:absolute!important;left:16px!important;top:50%!important;transform:translateY(-50%)!important}
.hani-etf-logo-v02982{
  --etf-color:#647f9e;display:inline-grid!important;place-items:center!important;position:relative!important;
  flex:0 0 36px!important;width:36px!important;height:36px!important;border-radius:11px!important;
  background:var(--etf-color)!important;color:#fff!important;border:1px solid color-mix(in srgb,var(--etf-color) 82%,#fff)!important;
  box-shadow:0 3px 9px color-mix(in srgb,var(--etf-color) 20%,transparent)!important;overflow:hidden!important
}
.hani-etf-logo-v02982 svg{width:58%!important;height:58%!important;color:#fff!important}
.hani-etf-logo-v02982 .etf-text{font-size:7px!important;line-height:.92!important;font-weight:1000!important;letter-spacing:-.05em!important;color:#fff!important;white-space:pre-line!important;text-align:center!important}
.hani-etf-logo-v02982.brand-rise{color:#504900!important}.hani-etf-logo-v02982.brand-rise svg,.hani-etf-logo-v02982.brand-rise .etf-text{color:#504900!important}

/* Newsroom: v2.9.82 owns the visible logo layer so re-renders cannot leave blank identity cells. */
#newsroom .hani-news-logo-v02980,
#newsroom .hani-security-logo-v02979,
#newsroom .hani-security-logo-v02978,
#newsroom .hani-security-logo-v02976{display:none!important;visibility:hidden!important}
#newsroom .hani-news-stockcell-v02982{display:flex!important;align-items:center!important;gap:9px!important;min-width:0!important}
#newsroom .hani-news-logo-v02982{
  --stock-color:#64748b;display:inline-grid!important;place-items:center!important;position:relative!important;
  flex:0 0 30px!important;width:30px!important;height:30px!important;border-radius:9px!important;
  background:var(--stock-color)!important;border:1px solid color-mix(in srgb,var(--stock-color) 80%,#fff)!important;
  color:#fff!important;overflow:hidden!important;box-shadow:0 2px 7px color-mix(in srgb,var(--stock-color) 18%,transparent)!important
}
#newsroom .investment-news-entity-row .hani-news-logo-v02982{width:34px!important;height:34px!important;flex-basis:34px!important;border-radius:10px!important}
#newsroom .hani-news-logo-v02982 img{position:absolute!important;inset:17%!important;width:66%!important;height:66%!important;object-fit:contain!important;opacity:0!important}
#newsroom .hani-news-logo-v02982.logo-loaded img{opacity:1!important}
#newsroom .hani-news-logo-v02982.logo-loaded .fallback{opacity:0!important}
#newsroom .hani-news-logo-v02982 .fallback{display:block!important;color:#fff!important;font-size:7px!important;font-weight:1000!important;line-height:1!important;text-align:center!important;white-space:nowrap!important}
#newsroom .hani-news-logo-v02982.brand-samsung .fallback{font-size:5.5px!important}
#newsroom .hani-news-logo-v02982.brand-amazon .fallback{font:1000 18px/1 Arial,sans-serif!important;transform:translateY(-2px)!important}
#newsroom .hani-news-logo-v02982.brand-amazon:after{content:"";position:absolute;left:25%;right:18%;bottom:21%;height:5px;border-bottom:2px solid #ff9900;border-radius:0 0 55% 55%;transform:rotate(-7deg)}
#newsroom .hani-news-logo-v02982.brand-alphabet{background:#fff!important;border-color:#d8dee8!important}.hani-news-logo-v02982.brand-alphabet .fallback{font:1000 18px/1 Arial,sans-serif!important;background:conic-gradient(from -40deg,#4285f4 0 25%,#34a853 0 45%,#fbbc05 0 67%,#ea4335 0 82%,#4285f4 0);-webkit-background-clip:text;background-clip:text;color:transparent!important}

/* Physical click is owned at window-capture level before legacy document handlers. */
#newsroom .hani-news-comment-chip-v02969,
#newsroom .hani-news-comment-chip-v02970,
#newsroom .hani-news-comment-chip-v02973,
#newsroom .hani-news-comment-chip-v02976,
#newsroom .hani-news-comment-chip-v02978,
#newsroom .hani-news-comment-oneclick-v02981{display:none!important;pointer-events:none!important}
#newsroom .hani-news-comment-oneclick-v02982{display:inline-flex!important;align-items:center!important;gap:5px!important;margin-left:7px!important;padding:5px 9px!important;border:1px solid #d8cff8!important;border-radius:999px!important;background:#f6f2ff!important;color:#6550c9!important;font-size:10px!important;font-weight:950!important;line-height:1!important;cursor:pointer!important;white-space:nowrap!important;touch-action:manipulation!important;position:relative!important;z-index:60!important}
#newsroom .hani-news-comment-oneclick-v02982[aria-expanded="true"]{background:#ece6ff!important;border-color:#bfb0f2!important;color:#503bb7!important}
#newsroom .hani-close-all-comments-v02982{display:inline-flex!important;align-items:center!important;margin-left:8px!important;padding:6px 10px!important;border:1px solid #d8deea!important;border-radius:10px!important;background:#fff!important;color:#59667a!important;font-size:10px!important;font-weight:900!important;cursor:pointer!important}

@media(max-width:720px){.hani-etf-logo-v02982{width:32px!important;height:32px!important;flex-basis:32px!important}td.hani-etf-target-v02982{padding-left:52px!important}td.hani-etf-target-v02982>.hani-etf-logo-v02982{left:12px!important}}
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
    const s = String(raw || '').replace(/\s+/g, ' ').trim();
    for (const item of ETF_ISSUERS) if (item.rx.test(s)) return {...item, theme:etfTheme(s)};
    return null;
  }

  function iconSvg(kind) {
    const c='viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
    const m={
      bond:`<svg ${c}><circle cx="12" cy="12" r="8"/><path d="M12 6v12M15 8.5c-.8-.7-1.8-1-3-1-1.8 0-3 .8-3 2 0 1.4 1.3 1.8 3.1 2.2 1.8.4 3 .9 3 2.3 0 1.4-1.3 2.3-3.2 2.3-1.3 0-2.5-.4-3.4-1.2"/></svg>`,
      chip:`<svg ${c}><rect x="7" y="7" width="10" height="10" rx="2"/><path d="M9 2v3M12 2v3M15 2v3M9 19v3M12 19v3M15 19v3M2 9h3M2 12h3M2 15h3M19 9h3M19 12h3M19 15h3"/></svg>`,
      dividend:`<svg ${c}><circle cx="12" cy="12" r="8"/><path d="M8.5 12h7M12 8.5v7M9.5 9.5c.7-.6 1.5-1 2.5-1 1.5 0 2.5.7 2.5 1.7 0 2.6-5 1.4-5 4 0 1 1 1.8 2.6 1.8 1 0 2-.3 2.7-1"/></svg>`,
      robot:`<svg ${c}><rect x="5" y="7" width="14" height="11" rx="3"/><path d="M9 12h.01M15 12h.01M9 16h6M12 3v4M8 4 7 3M16 4l1-1"/></svg>`,
      shield:`<svg ${c}><path d="M12 3 19 6v5c0 4.6-2.8 8-7 10-4.2-2-7-5.4-7-10V6l7-3Z"/><path d="m9 12 2 2 4-4"/></svg>`,
      health:`<svg ${c}><path d="M9 4h6v5h5v6h-5v5H9v-5H4V9h5V4Z"/></svg>`,
      ai:`<svg ${c}><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/></svg>`,
      gold:`<svg ${c}><path d="m7 8 2-3h6l2 3 2 9H5l2-9Z"/><path d="M8 11h8"/></svg>`,
      covered:`<svg ${c}><path d="M4 8h11l-3-3M20 16H9l3 3"/><path d="M15 5l3 3-3 3M9 19l-3-3 3-3"/></svg>`,
      etf:`<svg ${c}><path d="M4 18V9M10 18V5M16 18v-7M22 18V3"/></svg>`
    };
    return m[kind] || m.etf;
  }

  function etfLogo(identity) {
    const el=document.createElement('span');
    el.className=`hani-etf-logo-v02982 brand-${identity.id}`;
    el.style.setProperty('--etf-color',identity.color);
    el.dataset.etfIssuer=identity.id;
    el.setAttribute('role','img');
    el.setAttribute('aria-label',identity.id.toUpperCase()+' ETF');
    if(identity.theme?.kind==='text'){
      const b=document.createElement('b');b.className='etf-text';b.textContent=identity.theme.label;el.appendChild(b);
    } else el.innerHTML=iconSvg(identity.theme?.kind||'etf');
    return el;
  }

  function leafEtfAnchors(root) {
    if (!root) return [];
    const badTags = new Set(['SCRIPT','STYLE','OPTION','BUTTON','SELECT','TEXTAREA','INPUT']);
    const all = qa('*', root).filter(el => {
      if (badTags.has(el.tagName)) return false;
      if (el.closest('#haniInvestmentSummaryHostV02981,#haniHasdaqBoardV02976,#brokerDashboardStats')) return false;
      const t=txt(el);
      if (!t || t.length>140 || !resolveEtf(t)) return false;
      return !Array.from(el.children || []).some(ch => {
        const ct=txt(ch);
        return ct && ct.length<=140 && resolveEtf(ct);
      });
    });
    return all.filter((el,i,a)=>a.indexOf(el)===i);
  }

  function etfTarget(anchor) {
    if (!anchor) return null;
    if (anchor.matches('td')) return anchor;
    const p=anchor.parentElement;
    if (p && !p.matches('tr,table,tbody,thead') && txt(p).length<=190 && !!resolveEtf(txt(p))) return p;
    return anchor;
  }

  function ensureEtfLogo(anchor) {
    const identity=resolveEtf(txt(anchor));
    if (!anchor || !identity) return;
    const target=etfTarget(anchor) || anchor;
    if (!q(':scope > .hani-etf-logo-v02982',target)) target.insertBefore(etfLogo(identity),target.firstChild);
    target.classList.add('hani-etf-target-v02982');
    target.dataset.haniEtfV02982=identity.id;
  }

  function decorateEtfs() {
    const root=q('#investment');
    if (!root) return;
    leafEtfAnchors(root).forEach(ensureEtfLogo);
  }

  function stockIdentity(raw) {
    const s=String(raw||'').replace(/\s+/g,' ').trim();
    for(const item of STOCKS) if(item.rx.test(s)) return item;
    return null;
  }

  function newsLogo(identity) {
    const el=document.createElement('span');
    el.className=`hani-news-logo-v02982 brand-${identity.id}`;
    el.style.setProperty('--stock-color',identity.color);
    el.dataset.stockId=identity.id;
    el.setAttribute('role','img');
    el.setAttribute('aria-label',identity.label);
    const fallback=document.createElement('b');
    fallback.className='fallback';
    fallback.textContent=identity.fallback;
    el.appendChild(fallback);
    if(identity.icon){
      const img=new Image();
      img.alt='';img.loading='eager';img.decoding='async';img.referrerPolicy='no-referrer';img.src=identity.icon;
      img.addEventListener('load',()=>el.classList.add('logo-loaded'),{once:true});
      img.addEventListener('error',()=>el.classList.add('logo-failed'),{once:true});
      el.appendChild(img);
    }
    return el;
  }

  function feedRows() {
    const root=q('#newsroom');
    if(!root) return [];
    return qa('.newsroom-v03-row,.investment-news-board-row,[data-news-id]',root).filter((x,i,a)=>a.indexOf(x)===i);
  }

  function upperRows() {
    const root=q('#newsroom');
    if(!root) return [];
    return qa('.investment-news-entity-row,.investment-news-summary-row,[data-news-entity]',root).filter((x,i,a)=>a.indexOf(x)===i);
  }

  function stockCell(row, upper=false) {
    if(!row) return null;
    if(upper) return q('.news-entity-main,.investment-news-entity-main,.news-entity-name,[data-news-entity-main]',row) || row.firstElementChild;
    const main=q('.newsroom-v03-main,.investment-news-row-main',row);
    return q('.newsroom-v03-stock,.investment-news-stock,.news-col-stock,[data-news-stock]',row) || main?.children?.[0] || row.firstElementChild;
  }

  function ensureNewsLogo(cell, identity) {
    if(!cell || !identity) return;
    const current=q(':scope > .hani-news-logo-v02982',cell);
    if(current?.dataset.stockId===identity.id) return;
    qa(':scope > .hani-news-logo-v02982',cell).forEach(x=>x.remove());
    cell.insertBefore(newsLogo(identity),cell.firstChild);
    cell.classList.add('hani-news-stockcell-v02982');
    cell.dataset.haniNewsStockV02982=identity.id;
  }

  function decorateNewsLogos() {
    upperRows().forEach(row=>{
      const cell=stockCell(row,true), identity=stockIdentity(txt(cell)||txt(row));
      if(cell&&identity) ensureNewsLogo(cell,identity);
    });
    feedRows().forEach(row=>{
      const cell=stockCell(row,false), identity=stockIdentity(txt(cell)||txt(row));
      if(cell&&identity) ensureNewsLogo(cell,identity);
    });
  }

  function commentCount(row) {
    const meta=q('.newsroom-v03-title small,.news-col-title small',row);
    const mm=String(meta?.textContent||'').match(/💬\s*(\d+)/);
    if(mm) return Number(mm[1]);
    const old=qa('.hani-news-comment-chip-v02969,.hani-news-comment-chip-v02970,.hani-news-comment-chip-v02973,.hani-news-comment-chip-v02976,.hani-news-comment-oneclick-v02981',row)
      .map(el=>String(el.textContent||'').match(/(\d+)/)?.[1]).find(Boolean);
    if(old) return Number(old);
    const head=q('.news-comments-head b',row);
    const hm=String(head?.textContent||'').match(/댓글\s*\((\d+)\)/);
    if(hm) return Number(hm[1]);
    return qa('.news-agent-comments .news-agent-comment',row).length;
  }

  function panels(row) {
    return qa('.newsroom-v03-detail,.investment-news-row-detail,.news-detail,.news-agent-comments,.news-comments,[data-news-detail]',row).filter((x,i,a)=>a.indexOf(x)===i);
  }

  function rowOpen(row) {
    if(!row) return false;
    if(row.classList.contains('open')||row.classList.contains('is-open')||row.classList.contains('expanded')) return true;
    if(q('[aria-expanded="true"]',row)) return true;
    return panels(row).some(el=>!el.hidden && getComputedStyle(el).display!=='none');
  }

  function forceRowState(row,open) {
    if(!row) return;
    row.classList.toggle('open',open);row.classList.toggle('is-open',open);row.classList.toggle('expanded',open);
    qa('.newsroom-v03-main,.investment-news-row-main,[aria-expanded]',row).forEach(el=>el.setAttribute('aria-expanded',open?'true':'false'));
    panels(row).forEach(el=>{
      el.hidden=!open;
      if(open){el.style.removeProperty('display');if(getComputedStyle(el).display==='none')el.style.setProperty('display','block','important')}
      else el.style.setProperty('display','none','important');
    });
    qa('.hani-news-comment-oneclick-v02982',row).forEach(btn=>btn.setAttribute('aria-expanded',open?'true':'false'));
  }

  function nativePrime(row) {
    const opener=q('.newsroom-v03-main,.investment-news-row-main',row);
    if(!opener || typeof opener.click!=='function') return false;
    document.documentElement.dataset.haniNativePrimeV02982='1';
    document.documentElement.dataset.haniNativePrimeV02981='1';
    try{opener.click()}catch(_){return false}
    finally{
      delete document.documentElement.dataset.haniNativePrimeV02982;
      delete document.documentElement.dataset.haniNativePrimeV02981;
    }
    return true;
  }

  function openAdaptive(row) {
    if(!row) return;
    if(panels(row).length){forceRowState(row,true);return}
    nativePrime(row);
    window.setTimeout(()=>{
      if(panels(row).length || rowOpen(row)){forceRowState(row,true);return}
      nativePrime(row);
      window.setTimeout(()=>forceRowState(row,true),40);
    },0);
  }

  function toggleOnePhysicalClick(row) {
    if(!row) return;
    if(rowOpen(row)) forceRowState(row,false);
    else openAdaptive(row);
  }

  function installCommentButtons() {
    feedRows().forEach(row=>{
      const count=commentCount(row), title=q('.newsroom-v03-title,.news-col-title',row);
      if(!title || count<=0) return;
      let btn=q('.hani-news-comment-oneclick-v02982',title);
      if(!btn){
        btn=document.createElement('button');btn.type='button';btn.className='hani-news-comment-oneclick-v02982';
        const headline=q('b,strong',title);if(headline)headline.insertAdjacentElement('afterend',btn);else title.appendChild(btn);
      }
      btn.textContent=`💬 AI TEAM ${count}`;
      btn.setAttribute('aria-label',`AI TEAM 댓글 ${count}개 열기`);
      btn.setAttribute('aria-expanded',rowOpen(row)?'true':'false');
    });
    const head=q('#newsroom .investment-news-board-shell>.sh')||qa('#newsroom .sh').find(el=>/종목\s*뉴스\s*게시판/.test(txt(el)));
    if(head&&!q('#haniCloseAllCommentsV02982',head)){
      const b=document.createElement('button');b.type='button';b.id='haniCloseAllCommentsV02982';b.className='hani-close-all-comments-v02982';b.textContent='댓글 모두 닫기';head.appendChild(b);
    }
  }

  function installWindowCapture() {
    if(window.__HANI_V02982_WINDOW_CAPTURE__) return;
    window.__HANI_V02982_WINDOW_CAPTURE__=true;
    window.addEventListener('click',ev=>{
      if(document.documentElement.dataset.haniNativePrimeV02982==='1') return;
      const btn=ev.target.closest?.('#newsroom .hani-news-comment-oneclick-v02982');
      if(btn){
        ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();
        toggleOnePhysicalClick(btn.closest('.newsroom-v03-row,.investment-news-board-row,[data-news-id]'));
        return;
      }
      const close=ev.target.closest?.('#haniCloseAllCommentsV02982');
      if(close){
        ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();
        feedRows().forEach(r=>forceRowState(r,false));return;
      }
      const main=ev.target.closest?.('#newsroom .newsroom-v03-main,#newsroom .investment-news-row-main');
      if(main && !ev.target.closest?.('a,button,input,select,textarea,label')){
        ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();
        toggleOnePhysicalClick(main.closest('.newsroom-v03-row,.investment-news-board-row,[data-news-id]'));
      }
    },true);
    window.addEventListener('dblclick',ev=>{
      if(ev.target.closest?.('#newsroom .hani-news-comment-oneclick-v02982,#newsroom .newsroom-v03-main,#newsroom .investment-news-row-main')){
        ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();
      }
    },true);
  }

  function refresh() {
    decorateEtfs();
    decorateNewsLogos();
    installCommentButtons();
    selfAudit();
  }

  function selfAudit() {
    const etfAnchors=leafEtfAnchors(q('#investment'));
    const result={
      etfAnchors:etfAnchors.length,
      etfLogos:qa('#investment .hani-etf-logo-v02982').length,
      newsroomUpperLogos:upperRows().filter(r=>!!q('.hani-news-logo-v02982',r)).length,
      newsroomFeedLogos:feedRows().filter(r=>!!q('.hani-news-logo-v02982',r)).length,
      oneClickButtons:qa('#newsroom .hani-news-comment-oneclick-v02982').length,
      windowCapture:true,
      investmentSummaryUntouched:!!q('#haniInvestmentSummaryHostV02981')
    };
    window.HANI_V02982_AUDIT=result;
    return result;
  }

  let timer=0;
  function schedule(ms=80){clearTimeout(timer);timer=setTimeout(refresh,ms)}
  function burst(){[0,80,180,420,900,1800,3200].forEach(ms=>window.setTimeout(refresh,ms))}

  function boot() {
    injectStyle();
    installWindowCapture();
    refresh();
    const ob=new MutationObserver(records=>{
      const meaningful=records.some(r=>Array.from(r.addedNodes||[]).some(n=>n.nodeType===1&&!n.matches?.('.hani-etf-logo-v02982,.hani-news-logo-v02982,.hani-news-comment-oneclick-v02982')));
      if(meaningful)schedule(90);
    });
    ob.observe(document.body,{subtree:true,childList:true});
    document.addEventListener('click',ev=>{
      if(ev.target.closest?.('[data-view],#investment button,#investment select,#newsroom select'))burst();
    },true);
    burst();
    console.info('[HANI OS] v2.9.82 newsroom event arbitration / persistent logos / ETF leaf scan ready');
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
