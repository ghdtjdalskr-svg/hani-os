/* HANI Street Journal V1. Standalone device archive; never uses the life-state persistence path. */
(function (root) {
  'use strict';
  const KEY = 'hani_street_journal_v1';
  const object = v => v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  const rows = v => Array.isArray(v) ? v.map(object) : [];
  const scalar = v => typeof v === 'string' || typeof v === 'number' && Number.isFinite(v);
  const missing = v => !scalar(v) || String(v).trim() === '';
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const noData = '<span class="hsj-nodata">— No data</span>';
  const show = v => missing(v) ? noData : esc(v);
  const number = v => !missing(v) && /^[-+]?\d+(?:\.\d+)?$/.test(String(v).trim()) && Number.isFinite(Number(v)) ? Number(v) : null;
  const validDate = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0,10) === v;
  function parse(raw) {
    const match = String(raw).match(/<<<HSJ\s+v1\s*([\s\S]*?)HSJ>>>/);
    if (!match) throw Error('데이터 블록을 찾지 못했어요');
    let source = match[1].trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    let data;
    try { data = JSON.parse(source); }
    catch (_) {
      source = source.replace(/[“”]/g, '"');
      try { data = JSON.parse(source); }
      catch (error) {
        const pos = /position (\d+)/.exec(error.message), line = /line (\d+) column (\d+)/.exec(error.message);
        const before = pos ? source.slice(0, Number(pos[1])) : '';
        const where = line ? line[1] + '줄 ' + line[2] + '번째 글자' : pos ? before.split('\n').length + '줄 ' + (before.length - before.lastIndexOf('\n')) + '번째 글자' : '블록 끝부분 (' + source.split('\n').length + '줄 ' + (source.length - source.lastIndexOf('\n')) + '번째 글자)';
        throw Error('JSON을 읽지 못했어요. ' + where + ' 부근의 따옴표·쉼표·괄호를 확인해 주세요.');
      }
    }
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw Error('데이터 블록은 JSON 객체 { … }여야 해요.');
    return data;
  }
  function change(value, unit = '%') {
    const n = number(value);
    if (n === null) return noData;
    return '<span class="' + (n > 0 ? 'up' : n < 0 ? 'down' : 'flat') + '">' + (n > 0 ? '▲ ' : n < 0 ? '▼ ' : '') + Math.abs(n) + esc(missing(unit) ? '' : unit) + '</span>';
  }
  const pose = mood => mood === 'up' ? 'cheer' : mood === 'down' ? 'worried' : 'think';
  const closingPose = score => number(score) !== null && number(score) >= 5 ? 'cheer' : 'think';
  const chibi = (person, action, size = 'sm') => '<div class="chibi c-' + size + ' p-' + person + '-' + action + '" role="img" aria-label="' + ({hani:'하니',jieun:'지은',minji:'민지',seoyun:'서윤'}[person]) + '"></div>';
  const heading = (title, asOf = '') => '<h2><span>' + title + '</span><span class="asof">' + show(asOf) + '</span></h2>';
  const quote = (person, action, who, comment) => '<div class="say"><div>' + chibi(person, action) + '<div class="who">' + who + '</div></div><div class="bubble">' + show(comment) + '</div></div>';
  const grid = items => '<div class="grid">' + (rows(items).map(i => '<div class="q' + (missing(i.value) ? ' nodata' : '') + '"><div class="n">' + show(i.name) + '</div><div class="v">' + show(i.value) + '</div><div class="c">' + change(i.chg, i.unit) + '</div></div>').join('') || '<div class="q nodata">' + noData + '</div>') + '</div>';
  function flowValue(value) {
    const sign = typeof value === 'string' ? value.trim()[0] : typeof value === 'number' ? value > 0 ? '+' : value < 0 ? '-' : '' : '';
    const direction = sign === '+' ? ['up','▲ '] : sign === '-' || sign === '−' ? ['down','▼ '] : null;
    return '<b' + (direction ? ' class="' + direction[0] + '"' : '') + '>' + (direction ? direction[1] : '') + show(value) + '</b>';
  }
  function market(data, title, person, who) {
    const d = object(data), moods = {up:['t-up','▲ 상승'],down:['t-down','▼ 하락'],mixed:['t-mix','◆ 혼조'],flat:['t-mix','보합']}, mood = Object.hasOwn(moods,d.mood) ? moods[d.mood] : null;
    const tag = mood ? '<span class="tag ' + mood[0] + '">' + mood[1] + '</span>' : '';
    const flow = object(d.flows);
    return '<section class="sec">' + heading(title + tag, d.asOf) + grid(d.items) + (Object.keys(flow).length ? '<div class="flow">' + [['foreign','외국인'],['institution','기관'],['retail','개인']].map(([key,label]) => '<span>' + label + ' ' + flowValue(flow[key]) + '</span>').join('') + '</div>' : '') + quote(person, pose(d.mood), who, d.comment) + '</section>';
  }
  function sourceHtml(source) {
    if (scalar(source)) return show(source);
    const list = Array.isArray(source) ? source : source ? [source] : [];
    return list.map(item => {
      const s = object(item); let url;
      try { url = new URL(s.url); } catch (_) { /* invalid URLs remain plain labels */ }
      return url && ['http:','https:'].includes(url.protocol) ? '<a href="' + esc(url.href) + '" target="_blank" rel="noopener noreferrer">' + show(s.name || s.url) + '</a>' : show(s.name);
    }).join(' · ') || noData;
  }
  const namespace = html => html.replace(/class="([^"]*)"/g, (_, classes) => 'class="' + classes.split(/\s+/).map(c => c.startsWith('hsj-') ? c : 'hsj-' + c).join(' ') + '"');
  function render(data) {
    const d = object(data), t = object(d.temperature), h = object(d.hani), score = number(t.score), prev = number(t.prev);
    const publication = scalar(d.publishedAt) && String(d.publishedAt).startsWith(String(d.edition) + ' ') ? String(d.publishedAt).slice(11) : d.publishedAt;
    const edition = validDate(d.edition) ? d.edition.replaceAll('-','.') + ' (' + '일월화수목금토'[new Date(d.edition).getUTCDay()] + ')' : d.edition;
    const effect = {pos:['up','▲ 긍정'],neg:['down','▼ 부정'],mixed:['flat','◆ 혼재']};
    return namespace('<article class="hsj-sheet" aria-label="하니 스트리트 저널 미리보기"><header class="mast"><div class="hsj-mast-text"><div class="sub">HANI GROUP · DAILY MARKET BRIEF</div><h1>하니 스트리트<br><b>저널</b></h1><span class="date">' + show(edition) + ' ' + show(publication) + ' 발행</span></div>' + chibi('hani','point','lg') + '</header>'
      + '<div class="temp"><div class="score">' + (score === null ? noData : esc(score.toFixed(1))) + '<small>/10</small></div><div class="gauge"><div class="bar">' + (score === null ? '' : '<div class="pin" style="left:' + Math.max(0,Math.min(100, score * 10)) + '%"></div>') + '</div><div class="lab"><span>공포</span><span>중립</span><span>과열</span></div></div><div class="word">' + show(t.label) + '<br><span class="hsj-previous">어제 ' + show(t.prev) + ' → ' + (score === null || prev === null ? noData : change(Number((score-prev).toFixed(2)),'')) + '</span></div></div>'
      + market(d.kr,'🇰🇷 한국 시장','jieun','지은 · KOSPI') + market(d.us,'🇺🇸 미국 시장','minji','민지 · DOW')
      + '<section class="sec">' + heading('💵 금리 · 환율 · 원자재', object(d.macro).asOf) + grid(object(d.macro).items) + quote('seoyun','point','서윤 · 검증', '숫자는 하니 전무님 브리핑 그대로! 없는 값은 지어내지 않고 No data로 뒀어요 ✓') + '</section>'
      + '<section class="sec">' + heading('🔎 왜 움직였나', '사실 / 하니 해석') + '<ol class="why">' + (rows(d.why).map(i => '<li><div><span class="fact">' + show(i.fact) + (Object.hasOwn(effect,i.effect) ? ' <span class="' + effect[i.effect][0] + '">' + effect[i.effect][1] + '</span>' : '') + '</span><span class="interp">' + show(i.interp) + '</span></div></li>').join('') || '<li>' + noData + '</li>') + '</ol></section>'
      + '<section class="sec">' + heading('💼 내 포트폴리오','시장 온도와 별개 판단') + (rows(d.portfolio).map((p,index) => '<div class="imp"><div class="row"><span class="nm">' + show(p.name) + ' <span class="hsj-price">' + show(p.price) + ' ' + change(p.chg) + '</span></span>' + (['POSITIVE','STABLE','WATCH','NEGATIVE','THESIS ALERT'].includes(p.status) ? '<span class="badge">' + esc(p.status) + '</span>' : '') + '</div><p>단기: ' + show(p.short) + '<br>장기: ' + show(p.long) + '</p><button type="button" class="link" data-hsj-research="' + index + '">→ 종목 리포트 보기</button></div>').join('') || '<div class="imp">' + noData + '</div>') + '</section>'
      + '<section class="sec">' + heading('📅 오늘·내일 일정','') + '<table class="cal"><tbody>' + (rows(d.calendar).map(c => '<tr><td>' + show(c.when) + '</td><td>' + show(c.what) + '</td></tr>').join('') || '<tr><td>' + noData + '</td></tr>') + '</tbody></table></section>'
      + '<div class="close">' + chibi('hani',closingPose(t.score)) + '<div><h3>HANI COMMENT · 오늘의 행동</h3><p>' + show(h.comment) + '</p><ul class="act">' + (Array.isArray(h.actions) ? h.actions.map(a => '<li>' + show(a) + '</li>').join('') : '<li>' + noData + '</li>') + '</ul></div></div><div class="foot">' + sourceHtml(d.sources) + '<br>시장 온도는 하니의 주관적 위험 평가이며 투자 권유가 아닙니다. 직접 매매 기능 없음.</div></article>');
  }
  function archive(storage, confirm) {
    const read = () => {
      try {
        const raw = storage.getItem(KEY);
        if (raw === null) return {schema:1, editions:{}};
        const value = JSON.parse(raw);
        if (!value || value.schema !== 1 || !value.editions || typeof value.editions !== 'object' || Array.isArray(value.editions)) throw Error();
        for (const [date, entry] of Object.entries(value.editions)) {
          if (!validDate(date) || !entry || typeof entry.raw !== 'string' || typeof entry.savedAt !== 'string' || !entry.data || typeof entry.data !== 'object' || Array.isArray(entry.data) || entry.data.edition !== date) throw Error();
        }
        return value;
      } catch (_) { throw Error('보관함을 읽지 못했어요'); }
    };
    return {read, store(raw, data) {
      if (!validDate(data.edition)) throw Error('보관하려면 edition 날짜를 YYYY-MM-DD로 확인해 주세요.');
      const value = read(), exists = Object.hasOwn(value.editions, data.edition);
      if (exists && !confirm('같은 날짜가 있어요. 덮어쓸까요?')) return false;
      if (!exists && Object.keys(value.editions).length >= 400) throw Error('최대 400개까지 보관할 수 있어요. 저장하지 않았어요.');
      value.editions[data.edition] = {savedAt:new Date().toISOString(), raw:String(raw), data};
      try { storage.setItem(KEY, JSON.stringify(value)); } catch (_) { throw Error('보관하지 못했어요. 기기의 저장 공간과 권한을 확인해 주세요.'); }
      return true;
    }, remove(date) {
      const value = read();
      if (!Object.hasOwn(value.editions, date) || !confirm(date + ' 이 날짜를 삭제할까요?')) return false;
      delete value.editions[date];
      try { storage.setItem(KEY, JSON.stringify(value)); } catch (_) { throw Error('삭제하지 못했어요. 기기의 저장 공간과 권한을 확인해 주세요.'); }
      return true;
    }};
  }
  // Local SVG foreignObject rasterization. Assets are inlined; no CDN or runtime dependency.
  async function downloadPNG(sheet, edition) {
    if (!validDate(edition)) throw Error('이미지 파일의 edition 날짜를 YYYY-MM-DD로 확인해 주세요.');
    await document.fonts.ready;
    const copy = sheet.cloneNode(true), originals = [sheet, ...sheet.querySelectorAll('*')], clones = [copy, ...copy.querySelectorAll('*')];
    const images = new Map();
    async function inline(url) {
      if (!images.has(url)) images.set(url, (async () => {
        const response = await fetch(url); if (!response.ok) throw Error('그림을 읽지 못했어요.');
        const blob = await response.blob();
        return new Promise((resolve,reject) => {const reader = new FileReader(); reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});
      })());
      return images.get(url);
    }
    for (let i=0;i<originals.length;i++) {
      const computed = getComputedStyle(originals[i]);
      clones[i].style.cssText = Array.from(computed).filter(k => !k.startsWith('--')).map(k => k + ':' + computed.getPropertyValue(k) + ';').join('');
      const background = computed.backgroundImage, match = /^url\(["']?(.*?)["']?\)$/.exec(background);
      if (match) clones[i].style.backgroundImage = 'url("' + await inline(match[1]) + '")';
      clones[i].removeAttribute('id');
    }
    // Pseudo-elements are explicit in the portable copy.
    copy.querySelectorAll('.hsj-why li').forEach((li,i) => { const n=document.createElement('span');n.textContent=String(i+1);n.style.cssText='flex:none;width:20px;height:20px;border-radius:50%;background:#142640;color:white;text-align:center;font:700 11px/20px sans-serif';li.prepend(n); });
    copy.querySelectorAll('.hsj-act li').forEach(li => {const tick=document.createElement('span');tick.textContent='✓ ';tick.style.color='#b18c44';tick.style.fontWeight='800';li.prepend(tick);});
    const glow=document.createElement('span');glow.style.cssText='position:absolute;right:-30px;top:-30px;width:150px;height:150px;border-radius:50%;background:radial-gradient(circle,rgba(41,91,213,.55),transparent 70%)';copy.querySelector('.hsj-mast').append(glow);
    const width = Math.ceil(sheet.getBoundingClientRect().width), height = Math.ceil(sheet.scrollHeight);
    copy.style.margin = '0';copy.style.width = width + 'px';
    const xml = new XMLSerializer().serializeToString(copy);
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '"><foreignObject width="100%" height="100%">' + xml + '</foreignObject></svg>';
    const img = new Image();
    await new Promise((resolve,reject) => {img.onload=resolve;img.onerror=()=>reject(Error('이미지 변환을 완료하지 못했어요.'));img.src='data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);});
    const canvas = document.createElement('canvas');canvas.width=width*2;canvas.height=height*2;
    const context=canvas.getContext('2d');context.scale(2,2);context.drawImage(img,0,0);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('PNG를 만들지 못했어요.');
    const url=URL.createObjectURL(blob), a=document.createElement('a');a.href=url;a.download='hani-street-journal-' + edition + '.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function mount(panel) {
    if (panel.dataset.hsjMounted) return;
    panel.dataset.hsjMounted='true';
    let current=null, raw='', selected=null;
    // Access storage lazily so a denied getter cannot disable paste/preview.
    const storage={getItem:key=>root.localStorage.getItem(key),setItem:(key,value)=>root.localStorage.setItem(key,value)};
    const saved=archive(storage, message=>root.confirm(message));
    // Compact toolbar keeps the journal at the top; pasting happens in a dialog.
    panel.innerHTML='<div class="hsj-tools"><div class="hsj-bar"><button type="button" class="btn finance" data-hsj="open">📋 브리핑 붙여넣기</button><select aria-label="날짜별 보관"><option value="">보관 날짜 선택</option></select></div><div class="hsj-actions"><button type="button" class="btn" data-hsj="store" disabled>보관하기</button><button type="button" class="btn" data-hsj="png" disabled>이미지로 저장</button><button type="button" class="btn" data-hsj="delete" disabled>이 날짜 삭제</button></div><p role="status" aria-live="polite" class="hsj-message"></p></div><div class="hsj-preview"></div><p class="hsj-note">이 기기에만 보관 · Cloud 동기화 없음</p><dialog class="hsj-dialog" aria-label="아침 브리핑 붙여넣기"><h3>아침 브리핑 붙여넣기</h3><textarea rows="10" placeholder="브리핑 전체와 &lt;&lt;&lt;HSJ v1 데이터 블록을 붙여넣으세요" aria-label="아침 브리핑"></textarea><p class="hsj-dialog-message" aria-live="polite"></p><div class="hsj-actions"><button type="button" class="btn finance" data-hsj="read">브리핑 읽기</button><button type="button" class="btn" data-hsj="close">닫기</button></div></dialog>';
    const message=panel.querySelector('.hsj-message'), dialogMessage=panel.querySelector('.hsj-dialog-message'), list=panel.querySelector('select'), preview=panel.querySelector('.hsj-preview'), dialog=panel.querySelector('dialog');
    const tell=text=>{message.textContent=text;dialogMessage.textContent=text;};
    const openDialog=()=>{dialogMessage.textContent='';if(typeof dialog.showModal==='function'){if(!dialog.open)dialog.showModal();}else dialog.setAttribute('open','');panel.querySelector('textarea').focus();};
    const closeDialog=()=>{if(typeof dialog.close==='function'){if(dialog.open)dialog.close();}else dialog.removeAttribute('open');};
    function refreshList() {
      try {const editions=saved.read().editions;list.innerHTML='<option value="">보관 날짜 선택</option>' + Object.keys(editions).sort().reverse().map(date=>'<option value="'+date+'">'+date+'</option>').join('');list.value=selected||'';}
      catch(error){tell(error.message);}
    }
    function display() {
      preview.innerHTML=current?render(current):'';
      panel.querySelector('[data-hsj="store"]').disabled=!current;
      panel.querySelector('[data-hsj="png"]').disabled=!current;
      panel.querySelector('[data-hsj="delete"]').disabled=!selected;
    }
    list.addEventListener('change',()=>{
      if(!list.value)return;
      try {const entry=saved.read().editions[list.value];if(!entry)throw Error('이 날짜의 보관본을 찾지 못했어요');selected=list.value;current=entry.data;raw=entry.raw;display();tell('보관본을 표시했어요.');}
      catch(error){tell(error.message);}
    });
    panel.addEventListener('click',async event=>{
      const button=event.target.closest('button');if(!button||!panel.contains(button))return;
      try {
        if(button.dataset.hsjResearch!==undefined){const item=rows(current?.portfolio)[Number(button.dataset.hsjResearch)];if(!root.HaniInvestmentCommittee.openResearch(!missing(item.ticker)?String(item.ticker):item.name))tell('종목 리포트 없음');return;}
        if(button.dataset.hsj==='open'){openDialog();return;}
        if(button.dataset.hsj==='close'){closeDialog();return;}
        if(button.dataset.hsj==='read'){
          const input=panel.querySelector('textarea').value;
          // A failed new parse must never leave a stale edition available to save.
          current=null;selected=null;display();current=parse(input);raw=input;list.value='';display();closeDialog();tell('미리보기예요. 보관하기를 눌러야 저장돼요.');
        }
        if(button.dataset.hsj==='store'&&current&&saved.store(raw,current)){selected=current.edition;refreshList();display();tell('이 기기에 보관했어요.');}
        if(button.dataset.hsj==='delete'&&selected&&saved.remove(selected)){selected=null;current=null;raw='';refreshList();display();tell('이 날짜를 삭제했어요.');}
        if(button.dataset.hsj==='png'&&current){const edition=current.edition;button.disabled=true;try{await downloadPNG(preview.querySelector('.hsj-sheet'),edition);tell('PNG를 저장했어요.');}finally{button.disabled=!current;}}
      } catch(error){tell(error.message);}
    });
    refreshList();
    // Read-only: open on the newest saved edition so the journal is the first thing shown.
    try {const editions=saved.read().editions, latest=Object.keys(editions).sort().pop();if(latest){selected=latest;current=editions[latest].data;raw=editions[latest].raw;list.value=latest;}} catch(_) {}
    display();
  }
  const api={KEY,parse,render,archive,missing,change,pose,closingPose,validDate,downloadPNG,mount};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.HaniStreetJournal=api;
})(typeof window!=='undefined'?window:globalThis);
