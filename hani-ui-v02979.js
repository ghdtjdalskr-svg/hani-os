/* =========================================================
   HANI OS v2.9.79
   LIFE MARKET + Investment Identity Finalization
   UI/read-only patch: no localStorage write, no Supabase write,
   no schema/storage-key/internal-data-version changes.
   ========================================================= */
(() => {
  'use strict';

  const PATCH_ID = 'HANI_UI_V02979';
  const STYLE_ID = 'hani-ui-v02979-style';
  if (window[PATCH_ID]) return;
  window[PATCH_ID] = true;

  const q = (sel, root = document) => root?.querySelector?.(sel) || null;
  const qa = (sel, root = document) => root?.querySelectorAll ? Array.from(root.querySelectorAll(sel)) : [];
  const text = el => String(el?.textContent || '').replace(/\s+/g, ' ').trim();
  const number = v => {
    const x = Number(String(v ?? '').replace(/[,₩원%\s]/g, ''));
    return Number.isFinite(x) ? x : null;
  };
  const monthKey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const CURRENT_MONTH = monthKey(new Date());
  const PREV_MONTH = (() => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); return monthKey(d); })();

  const GROUP_BY_VIEW = {
    home: 'home',
    intake: 'office', agentReview: 'office', policy: 'office', deployment: 'office',
    investment: 'finance', investmentIntake: 'finance', asset: 'finance', ledger: 'finance', newsroom: 'finance',
    diet: 'health', exercise: 'health',
    reading: 'growth', study: 'growth', university: 'growth', certificate: 'growth',
    wishlist: 'life', travel: 'life', movie: 'life', game: 'life', diary: 'life',
    tasks: 'system', calendar: 'system', work: 'system', drive: 'system', dev: 'system', settings: 'system', aiTeam: 'system'
  };
  const GROUP_THEME = {
    home:    {accent: '#7569e8', bg: '#f1efff'},
    office:  {accent: '#7b61d9', bg: '#eee9ff'},
    finance: {accent: '#3976c8', bg: '#eaf3ff'},
    health:  {accent: '#239d7b', bg: '#e7f7f0'},
    growth:  {accent: '#d18435', bg: '#fff0df'},
    life:    {accent: '#2b9aa6', bg: '#e6f7f9'},
    system:  {accent: '#60728d', bg: '#edf1f6'}
  };

  const COMPANY = [
    {id:'samsung', rx:/(삼성전자(?:우)?|005930|005935|SAMSUNG)/i, label:'Samsung Electronics', color:'#1428a0', fallback:'SAMSUNG', icon:'https://cdn.simpleicons.org/samsung/FFFFFF'},
    {id:'lg', rx:/(LG전자(?:우)?|066570|066575)/i, label:'LG Electronics', color:'#a50034', fallback:'LG', icon:'https://cdn.simpleicons.org/lg/FFFFFF'},
    {id:'nvidia', rx:/(엔비디아|NVIDIA|\bNVDA\b)/i, label:'NVIDIA', color:'#76b900', fallback:'N', icon:'https://cdn.simpleicons.org/nvidia/FFFFFF'},
    {id:'amazon', rx:/(아마존|AMAZON|\bAMZN\b|\bAWS\b|AMAZON WEB SERVICES)/i, label:'Amazon / AWS', color:'#232f3e', fallback:'a', kind:'amazon'},
    {id:'alphabet', rx:/(알파벳|GOOGLE|\bGOOGL\b|\bGOOG\b)/i, label:'Alphabet / Google', color:'#ffffff', fallback:'G', kind:'google'},
    {id:'skhynix', rx:/(SK\s*하이닉스|하이닉스|000660|SK\s*HYNIX)/i, label:'SK hynix', color:'#e6002d', fallback:'SK', icon:'https://cdn.simpleicons.org/skhynix/FFFFFF'}
  ];

  const ETF_ISSUER = [
    {id:'ace', rx:/\bACE\b/i, label:'ACE', color:'#647f9e'},
    {id:'kodex', rx:/\bKODEX\b/i, label:'KODEX', color:'#1769e0'},
    {id:'sol', rx:/\bSOL\b/i, label:'SOL', color:'#078bc8'},
    {id:'tiger', rx:/\bTIGER\b/i, label:'TIGER', color:'#f27616'},
    {id:'robo', rx:/\bROBO\b|로보\s*글로벌|로보틱스\/자동화/i, label:'ROBO', color:'#2877ef'},
    {id:'rise', rx:/\bRISE\b/i, label:'RISE', color:'#f4c400'},
    {id:'plus', rx:/\bPLUS\b/i, label:'PLUS', color:'#f47a1f'},
    {id:'koact', rx:/\bKOACT\b/i, label:'KOACT', color:'#2468f2'}
  ];

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

  function resolveIdentity(rawText) {
    const raw = String(rawText || '').replace(/\s+/g, ' ').trim();
    if (!raw) return null;
    for (const c of COMPANY) if (c.rx.test(raw)) return {...c, type:'stock'};
    for (const i of ETF_ISSUER) if (i.rx.test(raw)) return {...i, type:'etf', theme:etfTheme(raw)};
    return null;
  }

  function iconSvg(kind) {
    const common = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
    const map = {
      bond:`<svg ${common}><circle cx="12" cy="12" r="8"/><path d="M14.7 8.6c-.7-.7-1.7-1.1-2.8-1.1-1.7 0-2.9.8-2.9 2 0 1.3 1.2 1.7 3 2.1 1.8.4 3 .8 3 2.2 0 1.3-1.2 2.2-3 2.2-1.3 0-2.5-.5-3.3-1.4M12 5.5v13"/></svg>`,
      chip:`<svg ${common}><rect x="7" y="7" width="10" height="10" rx="2"/><path d="M9 2v3M12 2v3M15 2v3M9 19v3M12 19v3M15 19v3M2 9h3M2 12h3M2 15h3M19 9h3M19 12h3M19 15h3"/></svg>`,
      dividend:`<svg ${common}><circle cx="12" cy="12" r="8"/><path d="M8.5 12h7M12 8.5V15.5M9.5 9.5c.6-.7 1.4-1 2.5-1 1.5 0 2.5.7 2.5 1.7 0 2.6-5 1.4-5 4 0 1 1 1.8 2.6 1.8 1 0 1.9-.3 2.7-1"/></svg>`,
      robot:`<svg ${common}><rect x="5" y="7" width="14" height="11" rx="3"/><path d="M9 12h.01M15 12h.01M9 16h6M12 3v4M8 4l-1-1M16 4l1-1"/></svg>`,
      shield:`<svg ${common}><path d="M12 3 19 6v5c0 4.6-2.8 8-7 10-4.2-2-7-5.4-7-10V6l7-3Z"/><path d="m9 12 2 2 4-4"/></svg>`,
      health:`<svg ${common}><path d="M9 4h6v5h5v6h-5v5H9v-5H4V9h5V4Z"/></svg>`,
      ai:`<svg ${common}><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/></svg>`,
      gold:`<svg ${common}><path d="m7 8 2-3h6l2 3 2 9H5l2-9Z"/><path d="M8 11h8"/></svg>`,
      covered:`<svg ${common}><path d="M4 8h11l-3-3M20 16H9l3 3"/><path d="M15 5l3 3-3 3M9 19l-3-3 3-3"/></svg>`,
      etf:`<svg ${common}><path d="M4 18V9M10 18V5M16 18v-7M22 18V3"/></svg>`
    };
    return map[kind] || map.etf;
  }

  function logoElement(identity, size='md') {
    const el = document.createElement('span');
    el.className = `hani-security-logo-v02979 ${size} ${identity.type || ''} brand-${identity.id}`;
    el.style.setProperty('--security-color', identity.color || '#64748b');
    el.dataset.securityId = identity.id;
    el.setAttribute('role','img');
    el.setAttribute('aria-label', identity.label || '종목 아이콘');

    if (identity.type === 'etf') {
      const theme = identity.theme || {kind:'etf'};
      if (theme.kind === 'text') {
        const b = document.createElement('b');
        b.className = 'hani-etf-text-v02979';
        b.textContent = theme.label;
        el.appendChild(b);
      } else {
        el.innerHTML = iconSvg(theme.kind);
      }
      return el;
    }

    if (identity.kind === 'google') {
      const b = document.createElement('b'); b.className='hani-google-mark-v02979'; b.textContent='G'; el.appendChild(b); return el;
    }
    if (identity.kind === 'amazon') {
      const b = document.createElement('b'); b.className='hani-amazon-mark-v02979'; b.textContent='a'; el.appendChild(b);
      const smile = document.createElement('i'); smile.className='hani-amazon-smile-v02979'; el.appendChild(smile); return el;
    }

    const fallback = document.createElement('b');
    fallback.className = 'hani-logo-fallback-v02979';
    fallback.textContent = identity.fallback || identity.label || '';
    el.appendChild(fallback);
    if (identity.icon) {
      const img = new Image();
      img.alt=''; img.loading='eager'; img.decoding='async'; img.referrerPolicy='no-referrer'; img.src=identity.icon;
      img.addEventListener('load',()=>el.classList.add('logo-loaded'),{once:true});
      img.addEventListener('error',()=>el.classList.add('logo-failed'),{once:true});
      el.appendChild(img);
    }
    return el;
  }

  function clearLogos(root) {
    if (!root) return;
    qa('.hani-security-logo-v02976,.hani-security-logo-v02977,.hani-security-logo-v02978,.hani-security-logo-v02979', root).forEach(el=>el.remove());
  }
  function placeLogo(target, identity, size='md') {
    if (!target || !identity) return;
    clearLogos(target);
    target.classList.add('hani-security-cell-v02979');
    target.style.setProperty('--security-color', identity.color || '#64748b');
    target.insertBefore(logoElement(identity,size), target.firstChild);
  }

  function injectStyle() {
    if (q('#'+STYLE_ID)) return;
    const style=document.createElement('style'); style.id=STYLE_ID;
    style.textContent=`
/* ===== v2.9.79 · LIFE MARKET / Security Identity ===== */
.hani-security-logo-v02976,.hani-security-logo-v02977,.hani-security-logo-v02978{display:none!important;visibility:hidden!important;width:0!important;height:0!important;margin:0!important;border:0!important;padding:0!important}
.hani-security-cell-v02979{display:flex!important;align-items:center!important;gap:10px!important;min-width:0!important}
.hani-security-logo-v02979{--security-color:#64748b;width:36px;height:36px;flex:0 0 36px;display:grid!important;place-items:center;position:relative;overflow:hidden;border-radius:11px;background:var(--security-color)!important;color:#fff!important;border:1px solid color-mix(in srgb,var(--security-color) 80%,#fff)!important;box-shadow:0 3px 8px color-mix(in srgb,var(--security-color) 18%,transparent)!important}
.hani-security-logo-v02979.sm{width:28px;height:28px;flex-basis:28px;border-radius:9px}.hani-security-logo-v02979.lg{width:42px;height:42px;flex-basis:42px;border-radius:12px}
.hani-security-logo-v02979 svg{width:58%;height:58%;color:#fff}.hani-security-logo-v02979 img{position:absolute;inset:17%;width:66%;height:66%;object-fit:contain;opacity:0}.hani-security-logo-v02979.logo-loaded img{opacity:1}.hani-security-logo-v02979.logo-loaded .hani-logo-fallback-v02979{opacity:0}
.hani-logo-fallback-v02979{display:block;color:#fff;font-size:7px;font-weight:1000;line-height:1;text-align:center;letter-spacing:-.05em;max-width:86%;white-space:nowrap}.brand-samsung .hani-logo-fallback-v02979{font-size:5.6px}.brand-skhynix{border-radius:50%}.brand-skhynix .hani-logo-fallback-v02979{font-size:8px}.brand-lg{border-radius:11px}
.brand-alphabet{background:#fff!important;border-color:#d8dee8!important}.hani-google-mark-v02979{font:1000 20px/1 Arial,sans-serif;background:conic-gradient(from -40deg,#4285f4 0 25%,#34a853 0 45%,#fbbc05 0 67%,#ea4335 0 82%,#4285f4 0);-webkit-background-clip:text;background-clip:text;color:transparent}
.hani-amazon-mark-v02979{font:1000 20px/1 Arial,sans-serif;transform:translateY(-2px)}.hani-amazon-smile-v02979{position:absolute;left:24%;right:18%;bottom:21%;height:5px;border-bottom:2px solid #ff9900;border-radius:0 0 55% 55%;transform:rotate(-7deg)}
.hani-etf-text-v02979{font-size:7px;line-height:.92;font-weight:1000;color:#fff;white-space:pre-line;text-align:center;letter-spacing:-.05em}.brand-kodex .hani-etf-text-v02979,.brand-tiger .hani-etf-text-v02979{font-size:6.6px}.brand-rise{color:#4d4800!important}.brand-rise svg,.brand-rise .hani-etf-text-v02979{color:#4d4800!important}

/* Main character hero: full surface uses the major-group tint, not white gradient. */
#aiBanner[data-hani-v02979="1"]{background:var(--hani-hero-bg)!important;background-image:none!important;border-color:color-mix(in srgb,var(--hani-hero-accent) 28%,#fff)!important;box-shadow:0 10px 28px rgba(52,64,90,.06)!important}
#aiBanner[data-hani-v02979="1"]:before,#aiBanner[data-hani-v02979="1"]:after{opacity:.34!important;background:color-mix(in srgb,var(--hani-hero-accent) 12%,transparent)!important}
#aiBanner[data-hani-v02979="1"] .ai-kicker{color:var(--hani-hero-accent)!important}

/* Dashboard: four indices + LIFE MARKET. */
#home .home-kpi-grid.hani-life-indices-v02979{grid-template-columns:repeat(4,minmax(0,1fr))!important}
#home .hani-index-card-v02979{position:relative!important;overflow:hidden!important}
#home .hani-index-card-v02979:before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--index-color,#7569e8)}
#home .hani-index-card-v02979 .kpi-head span{font-size:11.5px!important;font-weight:1000!important;white-space:nowrap!important}
#home .hani-index-move-v02979{display:inline-flex!important;align-items:center!important;gap:5px!important;margin-top:5px!important;padding:3px 7px!important;border-radius:8px!important;font-size:14px!important;font-weight:1000!important;line-height:1.15!important}
#home .hani-index-move-v02979.up{color:#d94a56!important;background:#fff1f2!important}#home .hani-index-move-v02979.down{color:#2e6fd2!important;background:#eef4ff!important}#home .hani-index-move-v02979.flat,#home .hani-index-move-v02979.na{color:#6e788a!important;background:#f3f5f8!important}
#home .hani-index-detail-v02979{display:block!important;margin-top:4px!important;color:#778194!important;font-size:10px!important;font-weight:760!important}
#home .hani-index-hidden-v02979{display:none!important}
#haniLifeMarketV02979{display:flex;align-items:center;justify-content:space-between;gap:18px;margin:0 0 14px;padding:15px 18px;border:1px solid #e1dcf8;border-radius:17px;background:#f8f6ff;box-shadow:0 7px 20px rgba(69,56,125,.045)}
#haniLifeMarketV02979 .market-copy{display:grid;gap:3px}#haniLifeMarketV02979 .market-copy small{color:#806ed9;font-weight:1000;font-size:9px;letter-spacing:.08em}#haniLifeMarketV02979 .market-copy b{font-size:17px;color:#29344a}#haniLifeMarketV02979 .market-copy span{font-size:10.5px;color:#778194;font-weight:760}
#haniLifeMarketV02979 .market-state{display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:12px;font-weight:1000;font-size:13px;background:#fff;border:1px solid #e4e7ee}.market-state.strong{color:#d84f58;border-color:#f1cdd1;background:#fff4f4}.market-state.weak{color:#386fca;border-color:#cedcf4;background:#f2f6ff}.market-state.mixed{color:#7259bd;background:#f6f2ff;border-color:#dfd5f6}

/* HASDAQ inline monthly change must stay beside board title. */
#haniHasdaqBoardV02976 .hasdaq-move{display:none!important}
#haniHasdaqBoardV02976 .hasdaq-brand{display:flex!important;align-items:center!important;gap:12px!important;flex-wrap:wrap!important}
.hani-hasdaq-inline-v02979{display:inline-flex!important;align-items:center!important;gap:5px!important;margin-left:2px!important;padding:6px 10px!important;border-radius:999px!important;font-size:15px!important;font-weight:1000!important;line-height:1!important;white-space:nowrap!important}
.hani-hasdaq-inline-v02979.up{background:#fff0f1;color:#d84b57;border:1px solid #f1cbd0}.hani-hasdaq-inline-v02979.down{background:#eef4ff;color:#3270d4;border:1px solid #cbdcf7}.hani-hasdaq-inline-v02979.flat,.hani-hasdaq-inline-v02979.na{background:#f3f4f6;color:#687184;border:1px solid #e1e4e9}.hani-hasdaq-inline-v02979 small{font-size:9px;font-weight:900;opacity:.78}

/* Newsroom: header and rows share the same three-column geometry. */
#newsroom .hani-news-header-v02979,#newsroom .newsroom-v03-main,#newsroom .investment-news-row-main{display:grid!important;grid-template-columns:minmax(230px,.9fr) minmax(150px,.55fr) minmax(0,2.35fr)!important;column-gap:16px!important;align-items:center!important}
#newsroom .hani-news-header-v02979>*:nth-child(1),#newsroom .hani-news-col-stock-v02979{grid-column:1!important}#newsroom .hani-news-header-v02979>*:nth-child(2),#newsroom .hani-news-col-signal-v02979{grid-column:2!important}#newsroom .hani-news-header-v02979>*:nth-child(3),#newsroom .hani-news-col-story-v02979{grid-column:3!important}
#newsroom .hani-news-col-stock-v02979{min-width:0!important}.hani-news-col-stock-v02979 b,.hani-news-col-stock-v02979 strong{white-space:nowrap!important;word-break:keep-all!important}
#newsroom .investment-news-entity-row .news-entity-main{min-width:220px!important;word-break:keep-all!important}
#newsroom .hani-preferred-link-v02979{display:inline-flex;margin-left:5px;padding:2px 6px;border-radius:999px;background:#f4f1ff;color:#7259bd;font-size:9px;font-weight:900;white-space:nowrap}

@media(max-width:1180px){#home .home-kpi-grid.hani-life-indices-v02979{grid-template-columns:repeat(2,minmax(0,1fr))!important}#newsroom .hani-news-header-v02979,#newsroom .newsroom-v03-main,#newsroom .investment-news-row-main{grid-template-columns:minmax(190px,.8fr) minmax(125px,.5fr) minmax(280px,2fr)!important}}
@media(max-width:720px){#home .home-kpi-grid.hani-life-indices-v02979{grid-template-columns:1fr!important}#haniLifeMarketV02979{align-items:flex-start;flex-direction:column}#newsroom .hani-news-header-v02979{display:none!important}#newsroom .newsroom-v03-main,#newsroom .investment-news-row-main{grid-template-columns:1fr!important;row-gap:8px!important}.hani-security-logo-v02979.lg{width:36px;height:36px;flex-basis:36px}}
`;
    document.head.appendChild(style);
  }

  function getStateSafe() { try { return (typeof state !== 'undefined' && state) ? state : null; } catch (_) { return null; } }
  function rowMonth(row) {
    const candidates=[row?.month,row?.period,row?.date,row?.recordDate,row?.recordedAt,row?.watchedDate,row?.finishedAt,row?.completedAt,row?.createdAt,row?.updatedAt];
    for (const v of candidates) { const m=String(v||'').match(/^(\d{4}-\d{2})/); if (m) return m[1]; }
    return '';
  }
  function valueFrom(row, keys) { for (const k of keys) { const x=number(row?.[k]); if (x !== null) return x; } return null; }
  function movement(cur, prev, invert=false) {
    if (cur===null || prev===null || !Number.isFinite(cur) || !Number.isFinite(prev) || prev===0) return {tone:'na',pct:null,label:'비교 데이터 준비 중'};
    const raw=(cur-prev)/Math.abs(prev)*100, pct=invert?-raw:raw;
    return {tone:pct>0?'up':pct<0?'down':'flat',pct,label:`${pct>0?'↑':pct<0?'↓':'—'} ${pct>0?'+':''}${pct.toFixed(2)}% 전월 대비`};
  }
  function brokerRows(st) {
    try { if (typeof officialBrokerSorted === 'function') return officialBrokerSorted(); } catch (_) {}
    return (Array.isArray(st?.investmentBrokerSnapshots)?[...st.investmentBrokerSnapshots]:[]).filter(r=>r?.mode==='actual'&&r?.status==='confirmed').sort((a,b)=>String(a?.period||'').localeCompare(String(b?.period||'')));
  }
  function brokerTotal(snapshot) {
    try { if (typeof brokerCalc === 'function') { const x=Number(brokerCalc(snapshot)?.total); if (Number.isFinite(x)) return x; } } catch (_) {}
    const direct=valueFrom(snapshot,['total','totalAsset','totalAssets','totalValue']); if (direct!==null&&direct>0) return direct;
    return (Array.isArray(snapshot?.accounts)?snapshot.accounts:[]).filter(a=>a?.enabled!==false).reduce((sum,a)=>sum+(valueFrom(a,['estimatedAssets','totalEvaluation','evaluationAmount','value','amount'])??0),0);
  }
  function investByMonth(st,month) { const row=brokerRows(st).filter(r=>String(r?.period||rowMonth(r))===month).at(-1)||null; if(!row)return null; const v=brokerTotal(row); return Number.isFinite(v)&&v>0?{v,row}:null; }
  function lastByMonth(rows,month,keys) { return (Array.isArray(rows)?rows:[]).map((r,i)=>({r,i,m:rowMonth(r),v:valueFrom(r,keys),d:String(r?.date||r?.recordedAt||r?.updatedAt||r?.createdAt||'')})).filter(x=>x.m===month&&x.v!==null).sort((a,b)=>a.d.localeCompare(b.d)||a.i-b.i).at(-1)||null; }
  function averageSteps(rows,month) {
    const byDate=new Map();
    (Array.isArray(rows)?rows:[]).forEach(r=>{if(rowMonth(r)!==month)return;const date=String(r?.date||r?.recordedAt||r?.createdAt||'').slice(0,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return;const steps=valueFrom(r,['steps','stepCount','step','walkSteps']);if(steps===null||steps<0)return;byDate.set(date,(byDate.get(date)||0)+steps)});
    if(!byDate.size)return null; const values=[...byDate.values()]; return {avg:values.reduce((a,b)=>a+b,0)/values.length,days:values.length};
  }
  function cultureCount(st,month) {
    const books=(Array.isArray(st?.books)?st.books:[]).filter(r=>{const status=String(r?.status||r?.state||'').toLowerCase(); if(/planned|wish|예정/.test(status))return false; return rowMonth(r)===month;}).length;
    const movies=(Array.isArray(st?.movies)?st.movies:[]).filter(r=>rowMonth(r)===month).length;
    return {books,movies,total:books+movies};
  }

  function findCard(root,id,pattern) {
    const el=id?q('#'+id,root):null; const card=el?.closest?.('.home-kpi,.card,.kpi-card'); if(card)return card;
    return qa('.home-kpi,.kpi-card',root).find(c=>pattern?.test(text(c))) || null;
  }
  function setIndexCard(card,{name,em,strong,move,detail,color}) {
    if(!card)return;
    card.classList.add('hani-index-card-v02979'); card.style.setProperty('--index-color',color);
    const head=q('.kpi-head span',card)||q('.kpi-head',card)?.firstElementChild; if(head)head.textContent=name;
    const e=q('.kpi-head em',card); if(e)e.textContent=em;
    const s=q(':scope > strong',card)||q('strong',card); if(s&&strong!==undefined)s.textContent=strong;
    qa('.hani-index-move-v02978,.hani-index-detail-v02978',card).forEach(x=>x.remove());
    let mv=q('.hani-index-move-v02979',card); if(!mv){mv=document.createElement('span');(s||card).insertAdjacentElement(s?'afterend':'beforeend',mv)}
    mv.className=`hani-index-move-v02979 ${move.tone||'na'}`; mv.textContent=move.label;
    let dt=q('.hani-index-detail-v02979',card); if(!dt){dt=document.createElement('small');mv.insertAdjacentElement('afterend',dt)} dt.className='hani-index-detail-v02979'; dt.textContent=detail||'';
    qa(':scope > small:not(.hani-index-detail-v02979)',card).forEach(old=>old.style.display='none');
  }

  function renderLifeMarket() {
    const root=q('#home'), grid=q('.home-kpi-grid',root), st=getStateSafe(); if(!root||!grid||!st)return;
    grid.classList.add('hani-life-indices-v02979');
    const finance=findCard(root,'homeAsset',/최근\s*총자산|투자|자산/);
    const health=findCard(root,'homeWeight',/체중|kg/i);
    const growth=findCard(root,'homeBooks',/독서|책/);
    const movie=findCard(root,'homeMovies',/시청|영화|드라마/);
    const activity=findCard(root,'homeSteps',/운동|걸음|\d[\d,]*\s*보/);
    if(movie&&movie!==growth)movie.classList.add('hani-index-hidden-v02979');

    const ic=investByMonth(st,CURRENT_MONTH), ip=investByMonth(st,PREV_MONTH), im=movement(ic?.v??null,ip?.v??null,false);
    setIndexCard(finance,{name:"HASDAQ (하니's 자산 지수)",em:'ASSET',strong:ic?Math.round(ic.v).toLocaleString('ko-KR')+'원':(q('#homeAsset')?.textContent||'-'),move:im,detail:'투자자산 전월 대비 증감',color:'#3478cf'});

    const bc=lastByMonth(st.body,CURRENT_MONTH,['weight','weightKg','kg']), bp=lastByMonth(st.body,PREV_MONTH,['weight','weightKg','kg']), bm=movement(bc?.v??null,bp?.v??null,true), diff=(bc&&bp)?bc.v-bp.v:null;
    setIndexCard(health,{name:"N&E 100 (나은's 체중 지수)",em:'WEIGHT',strong:bc?`${bc.v.toFixed(1)}kg`:(q('#homeWeight')?.textContent||'기록 없음'),move:bm,detail:diff===null?'100kg 목표 · 체중 감소가 상승':`체중 ${diff>0?'+':''}${diff.toFixed(1)}kg · 감소가 상승`,color:'#38a77d'});

    const cc=cultureCount(st,CURRENT_MONTH), cp=cultureCount(st,PREV_MONTH); const cm=cp.total===0?(cc.total>0?{tone:'up',pct:null,label:`↑ 전월 0개 → 이번 달 ${cc.total}개`}:{tone:'flat',pct:0,label:'— 활동 변화 없음'}):movement(cc.total,cp.total,false);
    setIndexCard(growth,{name:"HINA JONES (히나's 독서·시청 지수)",em:'CULTURE',strong:`${cc.total}개`,move:cm,detail:`책 ${cc.books}권 · 시청 ${cc.movies}편`,color:'#8a5bd8'});

    const sc=averageSteps(st.exercise,CURRENT_MONTH), sp=averageSteps(st.exercise,PREV_MONTH), sm=movement(sc?.avg??null,sp?.avg??null,false);
    setIndexCard(activity,{name:"HARUKEI 10K (하루's 걸음 지수)",em:'STEPS',strong:sc?`${Math.round(sc.avg).toLocaleString('ko-KR')}보`:(q('#homeSteps')?.textContent||'기록 없음'),move:sm,detail:sc?`기록 ${sc.days}일 월평균 · 목표 10,000보`:'기록된 날 기준 월평균',color:'#2b9db5'});

    const moves=[im,bm,cm,sm].filter(m=>m.tone!=='na');
    const up=moves.filter(m=>m.tone==='up').length, total=moves.length;
    let label='집계 중',cls='mixed',icon='◐';
    if(total===4){if(up===4){label='매우 강세';cls='strong';icon='↑↑'}else if(up===3){label='강세';cls='strong';icon='↑'}else if(up===2){label='혼조';cls='mixed';icon='↔'}else if(up===1){label='약세';cls='weak';icon='↓'}else{label='매우 약세';cls='weak';icon='↓↓'}}
    let market=q('#haniLifeMarketV02979'); if(!market){market=document.createElement('section');market.id='haniLifeMarketV02979';grid.insertAdjacentElement('beforebegin',market)}
    market.innerHTML=`<div class="market-copy"><small>LIFE MARKET</small><b>이번 달 대표님 종합지수</b><span>${total}개 지수 집계 · ${up}개 상승${total<4?' · 일부 비교 데이터 준비 중':''}</span></div><div class="market-state ${cls}"><span>${icon}</span><b>${label}</b></div>`;
  }

  function decorateHero() {
    const view=document.body?.dataset?.view || qa('.view.active')[0]?.id || 'home', group=GROUP_BY_VIEW[view]||'system', theme=GROUP_THEME[group]||GROUP_THEME.system, banner=q('#aiBanner');
    if(!banner)return; banner.dataset.haniV02979='1'; banner.dataset.haniGroup=group; banner.style.setProperty('--hani-hero-bg',theme.bg); banner.style.setProperty('--hani-hero-accent',theme.accent); banner.style.setProperty('background',theme.bg,'important'); banner.style.setProperty('background-image','none','important');
  }

  function polishHasdaq() {
    const board=q('#haniHasdaqBoardV02976'), st=getStateSafe(); if(!board||!st)return;
    const cur=investByMonth(st,CURRENT_MONTH), prev=investByMonth(st,PREV_MONTH), mv=movement(cur?.v??null,prev?.v??null,false);
    const brand=q('.hasdaq-brand',board)||board, title=qa('b,strong,h2,h3',brand).find(el=>/HASDAQ\s*BOARD/i.test(text(el)))||qa('b,strong,h2,h3',board).find(el=>/HASDAQ\s*BOARD/i.test(text(el))); if(!title)return;
    qa('.hani-hasdaq-inline-v02978,.hani-hasdaq-inline-v02979',brand).forEach(x=>x.remove());
    const chip=document.createElement('span'); chip.className=`hani-hasdaq-inline-v02979 ${mv.tone||'na'}`; chip.innerHTML=mv.pct===null?'비교 데이터 준비 중':`${mv.pct>0?'↑':mv.pct<0?'↓':'—'} ${mv.pct>0?'+':''}${mv.pct.toFixed(2)}% <small>전월 대비</small>`; title.insertAdjacentElement('afterend',chip);
  }

  function newsUpperRows() {
    const root=q('#newsroom'); if(!root)return[];
    return qa('.investment-news-entity-row,.investment-news-summary-row,[data-news-entity]',root).filter((x,i,a)=>a.indexOf(x)===i);
  }
  function newsFeedRows() {
    const root=q('#newsroom'); if(!root)return[]; const feed=q('#investmentNewsFeed',root)||root;
    return qa('.newsroom-v03-row,.investment-news-board-row,[data-news-id]',feed).filter((x,i,a)=>a.indexOf(x)===i&&!x.classList.contains('investment-news-entity-row'));
  }
  function findNewsStockCell(row,upper=false) {
    if(upper)return q('.news-entity-main,.investment-news-entity-main,.news-entity-name,[data-news-entity-main]',row)||row.firstElementChild;
    return q('.newsroom-v03-stock,.investment-news-stock,.news-col-stock,[data-news-stock]',row)||q('.newsroom-v03-main > :first-child,.investment-news-row-main > :first-child',row)||row.firstElementChild;
  }

  function normalizeNewsHeader() {
    const root=q('#newsroom'); if(!root)return;
    qa('*',root).forEach(el=>{
      const kids=Array.from(el.children||[]); if(kids.length<3||kids.length>6)return;
      const a=text(kids[0]),b=text(kids[1]),c=text(kids[2]);
      if(/^종목$/.test(a)&&/^구분$/.test(b)&&/^뉴스$/.test(c))el.classList.add('hani-news-header-v02979');
    });
    newsFeedRows().forEach(row=>{
      const main=q('.newsroom-v03-main,.investment-news-row-main',row); if(!main)return; const kids=Array.from(main.children||[]); if(kids[0])kids[0].classList.add('hani-news-col-stock-v02979'); if(kids[1])kids[1].classList.add('hani-news-col-signal-v02979'); if(kids[2])kids[2].classList.add('hani-news-col-story-v02979');
    });
  }

  function decorateNewsroom() {
    newsUpperRows().forEach(row=>{
      const cell=findNewsStockCell(row,true), stockText=text(cell), identity=resolveIdentity(stockText); if(!cell||!identity)return; placeLogo(cell,identity,'md'); row.dataset.haniSecurityV02979=identity.id;
      if(/LG전자우|066575/.test(stockText)) {
        qa('small,span',cell).forEach(el=>{if(/발행회사\s*LG전자/.test(text(el)))el.textContent=String(el.textContent).replace(/발행회사\s*LG전자/,'LG전자 공통 뉴스 · 우선주 연관')});
        if(!q('.hani-preferred-link-v02979',cell)){const badge=document.createElement('span');badge.className='hani-preferred-link-v02979';badge.textContent='LG전자 공통 뉴스 연관';cell.appendChild(badge)}
      }
    });
    newsFeedRows().forEach(row=>{
      const cell=findNewsStockCell(row,false), stockText=text(cell), identity=resolveIdentity(stockText); if(!cell||!identity)return; placeLogo(cell,identity,'sm'); row.dataset.haniSecurityV02979=identity.id;
    });
    normalizeNewsHeader();
  }

  function isAccountOnly(el) {
    const t=text(el), known=COMPANY.some(x=>x.rx.test(t))||ETF_ISSUER.some(x=>x.rx.test(t));
    return !known && /(?:^|\s)(ISA|IRP|연금|위탁|토스|TOSS)(?:\s|$)/i.test(t);
  }
  function decorateInvestment() {
    const selectors=['#instrumentRows tr','#brokerLatestHoldingRows tr','#overviewAccountHoldingRows tr','#annualStockRows tr','#annualStockHistoryRows tr','#investment table tbody tr','#investment .holding-row','#investment .security-row','#asset table tbody tr','#asset .holding-row','#asset .security-row'].join(',');
    qa(selectors).forEach(row=>{
      if(row.closest('#newsroom'))return; if(isAccountOnly(row)){clearLogos(row);return;} const identity=resolveIdentity(text(row)); if(!identity)return; const cell=q('td:first-child',row)||row.firstElementChild||row; placeLogo(cell,identity,'md'); row.dataset.haniSecurityV02979=identity.id;
    });
    qa('#investmentHighlights > *,#asset .card').forEach(card=>{if(card.closest('#newsroom')||isAccountOnly(card))return; const identity=resolveIdentity(text(card)); if(!identity)return; const target=qa('b,strong,h3,h4',card).find(x=>resolveIdentity(text(x))); if(target)placeLogo(target,identity,'md')});
  }

  function selfAudit() {
    const result={
      lifeMarket:!!q('#haniLifeMarketV02979'),
      harukei:/HARUKEI 10K/.test(text(q('#home'))),
      hasdaqInline:!!q('.hani-hasdaq-inline-v02979'),
      heroTint:!!q('#aiBanner[data-hani-v02979="1"]'),
      newsLogos:qa('#newsroom .hani-security-logo-v02979').length,
      duplicateVisibleLogoTargets:qa('.hani-security-cell-v02979').filter(el=>qa(':scope > .hani-security-logo-v02979',el).length!==1).length
    };
    window.HANI_V02979_AUDIT=result;
    return result;
  }

  function refresh() {
    decorateHero(); renderLifeMarket(); polishHasdaq(); decorateInvestment(); decorateNewsroom(); selfAudit();
  }
  let timer=0; function schedule(ms=80){clearTimeout(timer);timer=setTimeout(refresh,ms)}
  function boot() {
    injectStyle(); refresh();
    const observer=new MutationObserver(records=>{const meaningful=records.some(r=>r.type==='attributes'||Array.from(r.addedNodes||[]).some(n=>n.nodeType===1&&!n.matches?.('.hani-security-logo-v02979,.hani-hasdaq-inline-v02979,#haniLifeMarketV02979')));if(meaningful)schedule(90)});
    observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['data-view']});
    document.addEventListener('click',ev=>{if(ev.target.closest?.('[data-view]'))setTimeout(refresh,120)},true);
    window.setTimeout(refresh,350); window.setTimeout(refresh,1200);
    console.info('[HANI OS] v2.9.79 LIFE MARKET / Security Identity ready · read-only UI patch');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
