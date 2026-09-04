/* =========================================================
   HANI OS v2.9.81
   Newsroom One-Click + Investment Summary + ETF Identity Final
   UI/read-only patch: no localStorage write, no Supabase write,
   no schema/storage-key/internal-data-version changes.
   ========================================================= */
(() => {
  'use strict';

  const PATCH_ID = 'HANI_UI_V02981_NEWS_INVEST_FINAL';
  const STYLE_ID = 'hani-ui-v02981-style';
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

  function resolveEtf(raw) {
    const s=String(raw||'').replace(/\s+/g,' ').trim();
    for(const x of ETF_ISSUERS) if(x.rx.test(s)) return {...x,theme:etfTheme(s)};
    return null;
  }
  function etfTheme(raw) {
    const s=String(raw||'').toUpperCase();
    if(/NASDAQ\s*100|나스닥\s*100|나스닥100/.test(s))return{kind:'text',label:'나스닥\n100'};
    if(/S&P\s*500|S&P500/.test(s))return{kind:'text',label:'S&P\n500'};
    if(/국채|채권|TREASURY|BOND/.test(s))return{kind:'bond'};
    if(/반도체|HBM|SEMICONDUCT/.test(s))return{kind:'chip'};
    if(/배당|DIVIDEND/.test(s))return{kind:'dividend'};
    if(/ROBO|로봇|자동화|ROBOT/.test(s))return{kind:'robot'};
    if(/방산|DEFEN/.test(s))return{kind:'shield'};
    if(/헬스|HEALTH/.test(s))return{kind:'health'};
    if(/AI|인공지능/.test(s))return{kind:'ai'};
    if(/금액티브|GOLD|골드/.test(s))return{kind:'gold'};
    if(/커버드콜|COVERED/.test(s))return{kind:'covered'};
    if(/(^|\D)200(\D|$)/.test(s))return{kind:'text',label:'200'};
    if(/(^|\D)150(\D|$)/.test(s))return{kind:'text',label:'150'};
    return{kind:'etf'};
  }
  function iconSvg(kind){
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
    };return m[kind]||m.etf;
  }
  function etfLogo(identity){
    const el=document.createElement('span');el.className=`hani-etf-logo-v02981 brand-${identity.id}`;el.style.setProperty('--etf-color',identity.color);el.dataset.etfIssuer=identity.id;el.setAttribute('role','img');el.setAttribute('aria-label',identity.id.toUpperCase()+' ETF');
    if(identity.theme?.kind==='text'){const b=document.createElement('b');b.className='etf-text';b.textContent=identity.theme.label;el.appendChild(b)}else el.innerHTML=iconSvg(identity.theme?.kind||'etf');
    return el;
  }

  function injectStyle(){
    if(q('#'+STYLE_ID))return;
    const style=document.createElement('style');style.id=STYLE_ID;style.textContent=`
/* ===== v2.9.81 · final interaction / investment cleanup ===== */
#investment .hani-etf-logo-v02980,#investment .hani-security-logo-v02979.etf,#investment .hani-security-logo-v02978.etf,#investment .hani-security-logo-v02976.etf{display:none!important}
.hani-etf-title-v02981,.hani-etf-cell-v02981{display:flex!important;align-items:center!important;gap:11px!important;min-width:0!important}
.hani-etf-logo-v02981{--etf-color:#647f9e;display:inline-grid!important;place-items:center!important;position:relative!important;flex:0 0 36px!important;width:36px!important;height:36px!important;border-radius:11px!important;background:var(--etf-color)!important;color:#fff!important;border:1px solid color-mix(in srgb,var(--etf-color) 82%,#fff)!important;box-shadow:0 3px 9px color-mix(in srgb,var(--etf-color) 20%,transparent)!important;overflow:hidden!important}
.hani-etf-logo-v02981 svg{width:58%!important;height:58%!important;color:#fff!important}.hani-etf-logo-v02981 .etf-text{font-size:7px!important;line-height:.92!important;font-weight:1000!important;letter-spacing:-.05em!important;color:#fff!important;white-space:pre-line!important;text-align:center!important}
.hani-etf-logo-v02981.brand-rise{color:#504900!important}.hani-etf-logo-v02981.brand-rise svg,.hani-etf-logo-v02981.brand-rise .etf-text{color:#504900!important}

/* Investment overview: one summary only. HASDAQ + detailed KPI move above tabs. */
#investment .hani-legacy-invest-summary-v02981{display:none!important}
#haniInvestmentSummaryHostV02981{display:grid!important;gap:12px!important;margin:0 0 16px!important}
#haniInvestmentSummaryHostV02981 #haniHasdaqBoardV02976{margin:0!important}
#haniInvestmentSummaryHostV02981 #brokerDashboardStats{margin:0!important}

/* Newsroom: one visible comment control, one click, no competing legacy chips. */
#newsroom .hani-news-comment-chip-v02969,#newsroom .hani-news-comment-chip-v02970,#newsroom .hani-news-comment-chip-v02973,#newsroom .hani-news-comment-chip-v02976,#newsroom .hani-news-comment-chip-v02978{display:none!important;pointer-events:none!important}
#newsroom .hani-news-comment-oneclick-v02981{display:inline-flex!important;align-items:center!important;gap:5px!important;margin-left:7px!important;padding:5px 9px!important;border:1px solid #d8cff8!important;border-radius:999px!important;background:#f6f2ff!important;color:#6550c9!important;font-size:10px!important;font-weight:950!important;line-height:1!important;cursor:pointer!important;white-space:nowrap!important;touch-action:manipulation!important;position:relative!important;z-index:30!important}
#newsroom .hani-news-comment-oneclick-v02981[aria-expanded="true"]{background:#ece6ff!important;border-color:#bfb0f2!important;color:#503bb7!important}
#newsroom .hani-close-all-comments-v02981{display:inline-flex!important;align-items:center!important;margin-left:8px!important;padding:6px 10px!important;border:1px solid #d8deea!important;border-radius:10px!important;background:#fff!important;color:#59667a!important;font-size:10px!important;font-weight:900!important;cursor:pointer!important}

@media(max-width:720px){.hani-etf-logo-v02981{width:32px!important;height:32px!important;flex-basis:32px!important}#haniInvestmentSummaryHostV02981{gap:9px!important}}
`;document.head.appendChild(style);
  }

  function minimalCandidate(elements,predicate){
    return elements.filter(predicate).sort((a,b)=>a.querySelectorAll('*').length-b.querySelectorAll('*').length)[0]||null;
  }
  function findInvestmentTabs(root){
    return minimalCandidate(qa('div,nav,section',root),el=>{
      const t=txt(el);return /투자\s*현황/.test(t)&&/월간\s*기록/.test(t)&&/종목\s*관리/.test(t)&&/투자\s*일기/.test(t)&&qa('button',el).length>=4;
    });
  }
  function findLegacySummary(root,board,stats){
    return minimalCandidate(qa('div,section',root),el=>{
      if(el===root||el===board||el===stats||el.contains(board)||el.contains(stats))return false;
      const t=txt(el);return /최근\s*총자산/.test(t)&&/평가금액/.test(t)&&/평가손익/.test(t)&&/기록\s*기준/.test(t);
    });
  }
  function reorganizeInvestmentSummary(){
    const root=q('#investment'),board=q('#haniHasdaqBoardV02976'),stats=q('#brokerDashboardStats');if(!root||!board)return;
    const legacy=findLegacySummary(root,board,stats),tabs=findInvestmentTabs(root);
    let host=q('#haniInvestmentSummaryHostV02981');
    if(!host){host=document.createElement('div');host.id='haniInvestmentSummaryHostV02981';
      if(legacy?.parentElement)legacy.parentElement.insertBefore(host,legacy);
      else if(tabs?.parentElement)tabs.parentElement.insertBefore(host,tabs);
      else root.prepend(host);
    }
    if(legacy)legacy.classList.add('hani-legacy-invest-summary-v02981');
    if(board.parentElement!==host)host.appendChild(board);
    if(stats&&stats.parentElement!==host)host.appendChild(stats);
  }

  function directEtfNameNodes(root){
    const selectors='b,strong,h3,h4,.instrument-name,.security-name,.stock-name,.holding-name,.name,.title,td:first-child';
    return qa(selectors,root).filter(el=>{
      if(el.closest('#haniHasdaqBoardV02976,#brokerDashboardStats,#haniInvestmentSummaryHostV02981'))return false;
      const t=txt(el);if(!resolveEtf(t)||t.length>110)return false;
      if(el.matches('td')&&qa('b,strong,h3,h4,.instrument-name,.security-name,.stock-name,.holding-name,.name,.title',el).some(c=>c!==el&&resolveEtf(txt(c))))return false;
      return true;
    });
  }
  function ensureEtfOnName(el,identity){
    if(!el||!identity)return;
    qa(':scope > .hani-etf-logo-v02981',el).forEach((x,i)=>{if(i)x.remove()});
    if(!q(':scope > .hani-etf-logo-v02981',el))el.insertBefore(etfLogo(identity),el.firstChild);
    el.classList.add('hani-etf-title-v02981');el.dataset.haniEtfV02981=identity.id;
  }
  function decorateEtfs(){
    const root=q('#investment');if(!root)return;
    directEtfNameNodes(root).forEach(el=>ensureEtfOnName(el,resolveEtf(txt(el))));
    /* Fallback for custom row markup: find the smallest row-like block containing an ETF name + code. */
    const rowish=qa('tr,li,[class*="row"],[class*="item"],[class*="security"],[class*="instrument"],[class*="holding"]',root);
    rowish.forEach(row=>{
      const id=resolveEtf(txt(row));if(!id||q('.hani-etf-logo-v02981',row))return;
      const target=qa('b,strong,h3,h4,.instrument-name,.security-name,.stock-name,.holding-name,.name,.title',row).find(el=>resolveEtf(txt(el)))||q('td:first-child',row)||row.firstElementChild;
      if(target)ensureEtfOnName(target,id);
    });
  }

  function feedRows(){
    const root=q('#newsroom');if(!root)return[];
    return qa('.newsroom-v03-row,.investment-news-board-row,[data-news-id]',root).filter((x,i,a)=>a.indexOf(x)===i);
  }
  function commentCount(row){
    const meta=q('.newsroom-v03-title small,.news-col-title small',row);let m=txt(meta).match(/💬\s*(\d+)/);if(m)return Number(m[1]);
    const legacy=q('.hani-news-comment-chip-v02969,.hani-news-comment-chip-v02970,.hani-news-comment-chip-v02973,.hani-news-comment-chip-v02976,.hani-news-comment-chip-v02978',row);m=txt(legacy).match(/(\d+)/);if(m)return Number(m[1]);
    const head=q('.news-comments-head',row);m=txt(head).match(/댓글\s*\(?\s*(\d+)/);if(m)return Number(m[1]);
    return qa('.news-agent-comments .news-agent-comment',row).length;
  }
  function rowOpen(row){
    if(!row)return false;if(row.classList.contains('open')||row.classList.contains('is-open')||row.classList.contains('expanded'))return true;
    if(q('[aria-expanded="true"]',row))return true;
    const panel=q('.newsroom-v03-detail,.investment-news-row-detail,.news-detail,.news-agent-comments,.news-comments',row);
    return !!(panel&&!panel.hidden&&getComputedStyle(panel).display!=='none'&&panel.getClientRects().length);
  }
  function panels(row){return qa('.newsroom-v03-detail,.investment-news-row-detail,.news-detail,.news-agent-comments,.news-comments',row).filter((x,i,a)=>a.indexOf(x)===i)}
  function setRowOpen(row,open){
    if(!row)return;row.classList.toggle('open',open);row.classList.toggle('is-open',open);row.classList.toggle('expanded',open);
    qa('.newsroom-v03-main,.investment-news-row-main,[aria-expanded]',row).forEach(el=>el.setAttribute('aria-expanded',open?'true':'false'));
    panels(row).forEach(el=>{el.hidden=!open;if(open){el.style.removeProperty('display');requestAnimationFrame(()=>{if(getComputedStyle(el).display==='none')el.style.setProperty('display','block','important')})}else el.style.setProperty('display','none','important')});
    qa('.hani-news-comment-oneclick-v02981',row).forEach(btn=>btn.setAttribute('aria-expanded',open?'true':'false'));
  }
  function primeAndOpen(row){
    if(!row)return;const existing=panels(row);if(existing.length){setRowOpen(row,true);return}
    const opener=q('.newsroom-v03-main,.investment-news-row-main',row);
    if(opener&&typeof opener.click==='function'){
      document.documentElement.dataset.haniNativePrimeV02981='1';
      try{opener.click()}catch(_){ }
      delete document.documentElement.dataset.haniNativePrimeV02981;
    }
    setTimeout(()=>setRowOpen(row,true),0);setTimeout(()=>setRowOpen(row,true),80);
  }
  function toggleOneClick(row){const open=rowOpen(row);if(open)setRowOpen(row,false);else primeAndOpen(row)}
  function installCommentControls(){
    feedRows().forEach(row=>{
      const count=commentCount(row),title=q('.newsroom-v03-title,.news-col-title',row);if(!title||count<=0)return;
      let btn=q('.hani-news-comment-oneclick-v02981',title);if(!btn){btn=document.createElement('button');btn.type='button';btn.className='hani-news-comment-oneclick-v02981';const headline=q('b,strong',title);if(headline)headline.insertAdjacentElement('afterend',btn);else title.appendChild(btn)}
      btn.textContent=`💬 AI TEAM ${count}`;btn.setAttribute('aria-label',`AI TEAM 댓글 ${count}개 열기`);btn.setAttribute('aria-expanded',rowOpen(row)?'true':'false');
    });
    const head=q('#newsroom .investment-news-board-shell>.sh')||qa('#newsroom .sh').find(el=>/종목\s*뉴스\s*게시판/.test(txt(el)));
    if(head&&!q('#haniCloseAllCommentsV02981',head)){const b=document.createElement('button');b.type='button';b.id='haniCloseAllCommentsV02981';b.className='hani-close-all-comments-v02981';b.textContent='댓글 모두 닫기';head.appendChild(b)}
  }
  function installOneClickCapture(){
    if(document.documentElement.dataset.haniOneClickV02981)return;document.documentElement.dataset.haniOneClickV02981='1';
    document.addEventListener('click',ev=>{
      const btn=ev.target.closest?.('.hani-news-comment-oneclick-v02981');
      if(btn){ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();const row=btn.closest('.newsroom-v03-row,.investment-news-board-row,[data-news-id]');toggleOneClick(row);return}
      const close=ev.target.closest?.('#haniCloseAllCommentsV02981');
      if(close){ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();feedRows().forEach(r=>setRowOpen(r,false));return}
      const main=ev.target.closest?.('#newsroom .newsroom-v03-main,#newsroom .investment-news-row-main');
      if(main&&!document.documentElement.dataset.haniNativePrimeV02981&&!ev.target.closest?.('a,button,input,select,textarea,label')){
        ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();toggleOneClick(main.closest('.newsroom-v03-row,.investment-news-board-row,[data-news-id]'));
      }
    },true);
    document.addEventListener('dblclick',ev=>{
      if(ev.target.closest?.('#newsroom .hani-news-comment-oneclick-v02981,#newsroom .newsroom-v03-main,#newsroom .investment-news-row-main')){ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation()}
    },true);
  }

  function selfAudit(){
    const root=q('#investment'),etfNodes=root?directEtfNameNodes(root):[];
    const result={
      investmentSummaryHost:!!q('#haniInvestmentSummaryHostV02981'),
      legacySummaryHidden:!!q('#investment .hani-legacy-invest-summary-v02981'),
      hasdaqInTopHost:!!q('#haniInvestmentSummaryHostV02981 #haniHasdaqBoardV02976'),
      brokerStatsInTopHost:!!q('#haniInvestmentSummaryHostV02981 #brokerDashboardStats'),
      etfNameTargets:etfNodes.length,
      etfLogos:qa('#investment .hani-etf-logo-v02981').length,
      oneClickCommentButtons:qa('#newsroom .hani-news-comment-oneclick-v02981').length
    };
    window.HANI_V02981_AUDIT=result;return result;
  }
  function refresh(){reorganizeInvestmentSummary();decorateEtfs();installCommentControls();selfAudit()}
  let timer=0;function schedule(ms=90){clearTimeout(timer);timer=setTimeout(refresh,ms)}
  function boot(){
    injectStyle();installOneClickCapture();refresh();
    const ob=new MutationObserver(records=>{const meaningful=records.some(r=>r.type==='attributes'||Array.from(r.addedNodes||[]).some(n=>n.nodeType===1&&!n.matches?.('.hani-etf-logo-v02981,.hani-news-comment-oneclick-v02981,#haniInvestmentSummaryHostV02981')));if(meaningful)schedule(100)});
    ob.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['data-view']});
    document.addEventListener('click',ev=>{if(ev.target.closest?.('[data-view],#investment button,#investment select,#newsroom select'))setTimeout(refresh,130)},true);
    window.setTimeout(refresh,350);window.setTimeout(refresh,1100);
    console.info('[HANI OS] v2.9.81 newsroom one-click / investment cleanup / ETF identity ready');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
