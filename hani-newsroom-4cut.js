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
  function render() {
    const list = published({issues});
    if (latest !== list[0]?.number) { selected = null; latest = list[0]?.number; }
    const issue = list.find(x => x.number === selected) || list[0];
    slot.hidden = !issue;
    if (!issue) { painted = ''; return; }
    if (painted === issue.number) return;
    painted = selected = issue.number;
    const q = s => slot.querySelector(s);
    q('.newsroom-4cut-heading').textContent = `이번 주 시장 4컷 · ${list[0].week}`;
    q('.newsroom-4cut-title').textContent = issue.title;
    q('.newsroom-4cut-meta').textContent = `제${issue.number}호 · ${issue.week}`;
    const image = q('.newsroom-4cut-image');
    image.src = imageFile(issue);
    image.alt = issue.alt;
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
      button.type = 'button'; button.textContent = `제${past.number}호 · ${past.week} · ${past.title}`;
      button.setAttribute('aria-pressed', String(past.number === selected));
      button.onclick = () => { selected = past.number; render(); };
      li.append(button); archive.append(li);
    }
    q('.newsroom-4cut-archive').hidden = list.length < 2;
    q('.newsroom-4cut-latest').hidden = issue === list[0];
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
  window.HaniNewsroom4cut = {enter, kstDay, published};
})();
