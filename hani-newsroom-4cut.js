/* Read-only weekly comic. Entered only by the canonical newsroom route. */
(() => {
  'use strict';
  let issues = null, pending = null, slot = null, selected = null, painted = '', latest = null;

  function kstDay(now = new Date()) {
    return new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
  }
  function published(catalog, now = new Date()) {
    const today = kstDay(now), seen = new Set();
    return (Array.isArray(catalog?.issues) ? catalog.issues : []).filter(issue => {
      if (!Number.isSafeInteger(issue?.number) || issue.number < 1 || seen.has(issue.number) ||
          !/^\d{4}-\d{2}-\d{2}$/.test(issue.publishDate) || issue.publishDate > today ||
          !Number.isFinite(Date.parse(issue.publishDate)) ||
          new Date(issue.publishDate).toISOString().slice(0, 10) !== issue.publishDate ||
          !/^[\w-]+$/.test(issue.image) ||
          !issue.title || !issue.week || !issue.alt) return false;
      seen.add(issue.number);
      return true;
    }).sort((a, b) => b.publishDate.localeCompare(a.publishDate) || b.number - a.number);
  }
  // The catalog stores an id, not a path: release closure resolves JSON paths relative to the JSON file.
  function imageFile(issue) {
    return `assets/newsroom-4cut/${issue.image}.webp`;
  }
  function sourceUrl(value) {
    try { const u = new URL(value); return /^https?:$/.test(u.protocol) ? u.href : ''; }
    catch { return ''; }
  }
  // Only project explicit facts in the selected, published issue. Never borrow live news.
  function issuePanels(issue) {
    const text=typeof issue?.alt==='string'?issue.alt:'', indices=[];
    const kr=/(코스피|코스닥)(?:는|은)\s*(?:한 주\s*)?(\d+(?:\.\d+)?)%\s*(오른|내린)\s*([\d,]+(?:\.\d+)?)/g;
    for(const m of text.matchAll(kr))indices.push({name:m[1],close:m[4],change:m[2]+'% '+(m[3]==='오른'?'상승':'하락')});
    const us=text.match(/S&P500은\s*(\d+(?:\.\d+)?)%,\s*나스닥은\s*(\d+(?:\.\d+)?)%\s*(내렸|올랐)/);
    if(us){
      const direction=us[3]==='내렸'?'하락':'상승';
      const closes=text.match(/금요일 종가는 각각\s*([\d,]+(?:\.\d+)?)과\s*([\d,]+(?:\.\d+)?)/);
      indices.push({name:'S&P500',close:closes?.[1]??null,change:us[1]+'% '+direction},{name:'나스닥',close:closes?.[2]??null,change:us[2]+'% '+direction});
    }
    const facts=(Array.isArray(issue?.facts)?issue.facts:[]).filter(row=>
      typeof row?.label==='string'&&row.label.trim()&&typeof row.value==='string'&&row.value.trim());
    const cuts=(Array.isArray(issue?.cuts)?issue.cuts:[]).filter(row=>
      typeof row?.reporter==='string'&&row.reporter.trim()&&typeof row.scene==='string'&&row.scene.trim()).slice(0,4);
    // Additional numbers and scenes are explicit catalog fields, never inferred from alt.
    return {summary:typeof issue?.title==='string'?issue.title.trim():'',indices,facts,cuts};
  }
  function renderIssuePanels(host,issue) {
    if(!host)return;
    const model=issuePanels(issue);host.replaceChildren();host.hidden=!(model.indices.length||model.facts.length||model.cuts.length);
    const node=(tag,text)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el;};
    if(model.indices.length){
      const panel=node('section'),table=node('table'),caption=node('caption','이 호에 실린 주요 지수'),head=node('thead'),tr=node('tr');
      for(const label of ['지수','종가','주간 변화']){const th=node('th',label);th.setAttribute('scope','col');tr.append(th);}head.append(tr);table.append(caption,head);
      const body=node('tbody');for(const row of model.indices){const line=node('tr'),th=node('th',row.name);th.setAttribute('scope','row');line.append(th,node('td',row.close??''),node('td',row.change));body.append(line);}table.append(body);panel.append(table,node('p','발행 주간 '+issue.week+' · 이 호에 실린 값만 표시합니다.'));host.append(panel);
    }
    if(model.facts.length){
      const panel=node('section'),list=node('dl');panel.className='newsroom-4cut-facts';
      panel.append(node('h4','이 호의 다른 숫자'));
      for(const row of model.facts){
        const entry=node('div'),value=node('dd',row.value);entry.append(node('dt',row.label),value);
        if(typeof row.note==='string'&&row.note.trim())value.append(node('small',row.note));
        list.append(entry);
      }
      panel.append(list);host.append(panel);
    }
    if(model.cuts.length){
      const panel=node('section'),list=node('ol');panel.className='newsroom-4cut-cuts';
      panel.append(node('h4','4컷 줄거리'));
      model.cuts.forEach((row,i)=>{const item=node('li');item.append(node('b',['①','②','③','④'][i]+' '+row.reporter),node('span',row.scene));list.append(item);});
      panel.append(list);host.append(panel);
    }
  }
  function render() {
    const list = published({issues});
    if (latest !== list[0]?.number) { selected = null; latest = list[0]?.number; }
    const issue = list.find(x => x.number === selected) || list[0];
    slot.hidden = !issue;
    if (!issue) { painted = ''; return; }
    if (painted === issue.number) return;
    painted = selected = issue.number;
    const q = s => slot.querySelector(s);
    q('.newsroom-4cut-heading').textContent = `이번 주 시장 4컷 · ${issue.week}`;
    q('.newsroom-4cut-title').textContent = issue.title;
    q('.newsroom-4cut-meta').textContent = `제${issue.number}호 · ${issue.week}`;
    const image = q('.newsroom-4cut-image');
    image.src = imageFile(issue);
    image.alt = issue.alt;
    renderIssuePanels(q('.newsroom-4cut-context'),issue);
    q('.newsroom-4cut-layout').classList?.toggle('has-context',!q('.newsroom-4cut-context').hidden);
    // The published image already contains this notice. Keep the text fallback for other artwork.
    for (const selector of ['.newsroom-4cut-footnote', 'dialog .newsroom-4cut-footnote']) {
      q(selector).hidden = /^00[12]$/.test(issue.image);
    }
    q('.newsroom-4cut-open').setAttribute('aria-label', `${issue.title} 원본 크기로 보기`);
    q('.newsroom-4cut-sources').open = false;
    q('.newsroom-4cut-source-list').replaceChildren();
    for (const source of Array.isArray(issue.sources) ? issue.sources : []) {
      const href = sourceUrl(source?.url);
      if (!href || !source.label) continue;
      const li = document.createElement('li'), a = document.createElement('a');
      a.textContent = source.label; a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer';
      li.append(a); q('.newsroom-4cut-source-list').append(li);
    }
    q('.newsroom-4cut-sources').hidden = !q('.newsroom-4cut-source-list').childElementCount;
    const archive = q('.newsroom-4cut-past');
    archive.replaceChildren();
    for (const past of list.slice(1, 9)) {
      const li = document.createElement('li'), button = document.createElement('button');
      button.type = 'button'; button.textContent = `제${past.number}호 · ${past.week}`;
      button.setAttribute('aria-label', `제${past.number}호 · ${past.week} · ${past.title}`);
      button.setAttribute('aria-pressed', String(past.number === selected));
      button.onclick = () => { selected = past.number; render(); };
      li.append(button); archive.append(li);
    }
    const archivePanel = q('.newsroom-4cut-archive');
    archivePanel.hidden = list.length < 2;
    // Move existing slots once; subsequent issue selections only update their contents.
    if (archivePanel.previousElementSibling !== q('.newsroom-4cut-meta')) {
      q('.newsroom-4cut-meta').after?.(archivePanel, q('.newsroom-4cut-latest'));
      archivePanel.open = true;
    }
    q('.newsroom-4cut-archive summary').textContent = `지난 호 선택 · 현재 제${issue.number}호${issue === list[0] ? ' (최신)' : ''}`;
    q('.newsroom-4cut-latest').hidden = issue === list[0];
    q('.newsroom-4cut-latest').textContent = `최신 호로 · 제${list[0].number}호`;
    q('.newsroom-4cut-latest').onclick = () => { selected = list[0].number; render(); };
    q('.newsroom-4cut-open').onclick = () => {
      const dialog = q('dialog'), full = q('.newsroom-4cut-full');
      full.src = imageFile(issue); full.alt = issue.alt;
      q('.newsroom-4cut-dialog-title').textContent = issue.title;
      dialog.showModal();
    };
  }
  async function enter() {
    // renderInvestmentNews runs on other views too: do not fetch from it.
    if (document.body.dataset.view !== 'newsroom') return;
    slot = document.querySelector('#newsroom .newsroom-4cut');
    if (!slot) return;
    if (issues === null) {
      if (!pending) pending = fetch('assets/data/newsroom-4cut/issues.json', {credentials: 'omit'})
        .then(r => { if (!r.ok) throw new Error('catalog'); return r.json(); })
        .then(data => { issues = Array.isArray(data?.issues) ? data.issues : []; })
        .catch(() => { /* Stay hidden; retry on the next newsroom visit. */ })
        .finally(() => { pending = null; });
      await pending;
    }
    render();
  }
  window.HaniNewsroom4cut = {enter, kstDay, published, issuePanels};
})();
