/* Weekly newspaper: projections and static editorial files only. No persistence. */
(() => {
  'use strict';
  const VIEW = 'ilbo', DAY = 86400000;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const rows = value => Array.isArray(value) ? value : [];
  const number = value => value !== null && value !== '' && value !== undefined && Number.isFinite(Number(value)) ? Number(value) : null;
  function date(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';
    const time = Date.parse(value + 'T00:00:00Z');
    return Number.isFinite(time) && new Date(time).toISOString().slice(0,10) === value ? value : '';
  }
  function koreaDate(value) {
    if (value === undefined || value === null || value === '') return '';
    if (date(value)) return value;
    if (typeof value === 'string' && (!/^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/i.test(value) || !date(value.slice(0,10)))) return '';
    const time = new Date(value).getTime();
    return Number.isFinite(time) ? new Date(time + 9*3600000).toISOString().slice(0,10) : '';
  }
  const shift = (day, offset) => new Date(Date.parse(day+'T00:00:00Z')+offset*DAY).toISOString().slice(0,10);
  function period(issueDate) {
    if (!date(issueDate)) throw Error('발행일을 확인해 주세요.');
    return {start:shift(issueDate,-7), end:shift(issueDate,-1)};
  }
  const inside = (day, range) => !!day && day >= range.start && day <= range.end;
  function compute(source, issueDate, now = Date.now()) {
    const range = period(issueDate), today = koreaDate(now), effective = {...range,end:range.end < today ? range.end : today};
    const days = new Map();
    for (const row of rows(source.exercise)) {
      if (!inside(date(row.date),effective)) continue;
      const old = days.get(row.date), stamp = x => Date.parse(x.updatedAt || x.createdAt || '') || 0;
      if (!old || stamp(row) >= stamp(old)) days.set(row.date,row);
    }
    const exercise = [...days.values()];
    const steps = exercise.filter(x => number(x.steps) !== null && number(x.steps) >= 0);
    const workouts = exercise.filter(x => typeof x.strength === 'boolean');
    const books = rows(source.books).filter(x => x.status === 'read' && !(x.completedDate && x.readDate && x.completedDate !== x.readDate) && inside(date(x.completedDate || x.readDate),effective));
    const quizzes = rows(source.learningQuizzes).filter(x => x.status === 'completed' && inside(koreaDate(x.completedAt),effective)).map(x => {
      const total = number(x.total) || rows(x.questions).length, correct = number(x.correctCount), score = number(x.score);
      if (!(total > 0)) return null;
      const rate = correct !== null ? correct / total * 100 : score;
      return rate !== null && rate >= 0 && rate <= 100 ? {total,rate} : null;
    }).filter(Boolean);
    const ledger = rows(source.ledgerMonths).flatMap(x => rows(x.items)).filter(x => ['fixed','variable','special'].includes(x.category) && number(x.amount) !== null && number(x.amount) >= 0 && date(x.date));
    const current = ledger.filter(x => inside(x.date,effective));
    const previousRange = {start:shift(range.start,-7),end:shift(range.end,-7)};
    const previous = ledger.filter(x => inside(x.date,previousRange));
    const sum = list => list.reduce((s,x) => s + number(x.amount),0);
    const tiles = [];
    if (steps.length) tiles.push({key:'steps',label:'이번 주 걸음',value:steps.reduce((s,x) => s+Number(x.steps),0),unit:'보',note:steps.length+'일 기록'});
    if (books.length) tiles.push({key:'books',label:'완독한 책',value:books.length,unit:'권',note:'완독일 기준'});
    if (quizzes.length) tiles.push({key:'quiz',label:'퀴즈 평균',value:Math.round(quizzes.reduce((s,x)=>s+x.rate*x.total,0)/quizzes.reduce((s,x)=>s+x.total,0)),unit:'%',note:'문항 수 가중 평균'});
    if (current.length && previous.length) {
      const value = sum(current), before = sum(previous), delta = value-before;
      tiles.push({key:'spend',label:'이번 주 지출',value,unit:'원',note:'전주 '+before.toLocaleString('ko-KR')+'원 대비 '+(delta>0?'+':'')+delta.toLocaleString('ko-KR')+'원 · 기록분'});
    }
    if (workouts.length) tiles.push({key:'workouts',label:'근력운동',value:new Set(workouts.filter(x=>x.strength).map(x=>x.date)).size,unit:'일',note:'근력운동 여부 기록 기준'});
    const tasks = rows(source.tasks).filter(x => !x.done).map(x => ({text:x.text || x.title || '할 일',due:koreaDate(x.dueAt) || date(x.due)}))
      .filter(x => x.due && x.due >= issueDate && x.due < shift(issueDate,7)).sort((a,b)=>a.due.localeCompare(b.due));
    return {range,tiles,tasks};
  }
  function parseManifest(value) {
    if (!value || !Array.isArray(value.issues)) throw Error('호 목록 형식을 확인해 주세요.');
    const ids = new Set();
    return value.issues.map(x => {
      if (!Number.isInteger(x.number) || x.number < 1 || ids.has(x.number) || !date(x.date) || !/^data\/hani-ilbo\/[\w-]+\.json$/.test(x.file)) throw Error('호 목록의 번호·날짜·파일을 확인해 주세요.');
      ids.add(x.number);return {...x};
    }).sort((a,b)=>b.date.localeCompare(a.date)||b.number-a.number);
  }
  function parseIssue(value, entry) {
    if (!value || value.number !== entry.number || value.date !== entry.date || !value.comic || !Array.isArray(value.comic.captions) || !Array.isArray(value.interview) || !Array.isArray(value.news)) throw Error('기사 형식을 확인해 주세요.');
    if (typeof value.comic.title !== 'string' || value.comic.captions.some(x=>typeof x !== 'string') || value.interview.some(x=>typeof x?.q !== 'string' || typeof x?.a !== 'string') || value.news.some(x=>typeof x?.title !== 'string' || typeof x?.body !== 'string' || typeof x?.fictional !== 'boolean') || typeof value.praise !== 'string') throw Error('기사 문구와 가상 소식 표시를 확인해 주세요.');
    if (!/^assets\/hani-ilbo\/[\w-]+\.(webp|png|jpg)$/.test(value.comic.image)) throw Error('만화 이미지 경로를 확인해 주세요.');
    return value;
  }
  function topPosts(board, issueDate, now = Date.now()) {
    if (!board?.listPosts || !board.displayLikes || !board.displayViews) return [];
    const range = period(issueDate), cutoff = koreaDate(now);
    return board.listPosts('ALL','',now).filter(x => inside(koreaDate(x.createdAt),range) && koreaDate(x.createdAt) <= cutoff)
      .map(x => ({title:x.title || '라운지 이야기',likes:board.displayLikes(x,now),views:board.displayViews(x,now)}))
      .sort((a,b)=>b.likes-a.likes || b.views-a.views).slice(0,5);
  }
  function newsroomPosts(posts, issueDate, now = Date.now()) {
    const range = period(issueDate), cutoff = koreaDate(now);
    const published = x => x.event_at || x.published_at || x.publishedAt || x.created_at;
    return rows(posts).filter(x => inside(koreaDate(published(x)),range) && koreaDate(published(x)) <= cutoff)
      .slice().sort((a,b)=>String(published(b)).localeCompare(String(published(a)))).slice(0,5)
      .map(x => ({title:x.title || x.headline || '뉴스룸 소식',body:x.summary || x.body || ''}));
  }
  const fold = (title, body) => '<details class="ilbo-fold"><summary>'+esc(title)+'</summary><div class="ilbo-fold-body">'+body+'</div></details>';
  const empty = text => '<p class="ilbo-note">'+esc(text)+'</p>';
  function markup(issue, source, board, newsroom, now = Date.now()) {
    const model = compute(source,issue.date,now), top = topPosts(board,issue.date,now), external = newsroomPosts(newsroom,issue.date,now);
    const headline = issue.headline || rows(issue.news).find(x=>x.fictional === false)?.title || '한 주의 기록이 모여, 우리의 이야기가 됩니다';
    const weekday = ['일','월','화','수','목','금','토'][new Date(issue.date+'T00:00:00Z').getUTCDay()];
    return '<article class="ilbo-paper"><header class="ilbo-masthead"><p class="ilbo-eyebrow">HANI GROUP · THE WEEKLY CHRONICLE</p><h2>HANI <span>하니일보</span></h2><div class="ilbo-meta"><span>제 '+issue.number+'호 · '+esc(issue.reporter || '민지 대리')+' 취재</span><time datetime="'+issue.date+'">'+issue.date.replaceAll('-','.')+'('+weekday+')</time></div></header>'+
      (issue.date > koreaDate(now) ? empty('발행 예정호 · '+issue.date+' 발행 / 현재까지의 기록을 미리 보여드려요.') : '')+
      (issue.editorialDraft ? '<p class="ilbo-draft">편집 초안 · 만화와 사내 소식 문구는 최종 확인 중이에요.</p>' : '')+
      '<section class="ilbo-lead"><p class="ilbo-eyebrow">이 주의 헤드라인</p><h3>'+esc(headline)+'</h3><p>'+esc(issue.headlineBody || '')+'</p><small>'+model.range.start+' ~ '+model.range.end+' · 기록이 있는 항목만 싣습니다</small></section>'+
      '<div class="ilbo-front"><section class="ilbo-comic"><h3>'+esc(issue.comic.title)+'</h3><p class="ilbo-note">'+esc(issue.comic.subtitle)+'</p><figure><div class="ilbo-art"><div class="ilbo-placeholder" data-ilbo-placeholder><span aria-hidden="true">✦</span><b>이번 주 만화, 곧 도착해요</b><p>그림을 기다리는 동안 아래 이야기부터 읽어보세요.</p></div><img data-ilbo-comic hidden src="'+esc(issue.comic.image)+'" alt="'+esc(issue.comic.title)+'" decoding="async"></div><figcaption><ol class="ilbo-captions">'+issue.comic.captions.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ol></figcaption></figure></section>'+
      '<aside class="ilbo-numbers"><p class="ilbo-eyebrow">숫자로 읽는 한 주</p><h3>작은 기록, 큰 한 걸음</h3>'+model.tiles.map(x=>'<div class="ilbo-tile" data-ilbo-tile="'+x.key+'"><span>'+x.label+'</span><strong>'+x.value.toLocaleString('ko-KR')+'<small>'+x.unit+'</small></strong><p>'+esc(x.note)+'</p></div>').join('')+(model.tiles.length?'':empty('한 주의 기록이 모이면 이곳에 함께 실을게요.'))+'</aside></div>'+
      '<div class="ilbo-sections">'+fold('사람 & 이야기 · 이 주의 인터뷰', '<p class="ilbo-note">'+esc(issue.interviewTitle || '')+' · HANI GROUP 세계관</p><dl class="ilbo-interview">'+issue.interview.map(x=>'<dt>Q. '+esc(x.q)+'</dt><dd>'+esc(x.a)+'</dd>').join('')+'</dl>')+
      fold('사내 소식', '<div class="ilbo-columns">'+issue.news.map(x=>'<section class="ilbo-story">'+(x.fictional?'<small class="ilbo-fiction">HANI GROUP 가상 소식</small>':'<small class="ilbo-note">실제 업데이트</small>')+'<h4>'+esc(x.title)+'</h4><p>'+esc(x.body)+'</p></section>').join('')+'</div>')+
      fold('라운지 인기글 · 이 주의 이야기', top.length?'<ol class="ilbo-list">'+top.map(x=>'<li><b>'+esc(x.title)+'</b><small>추천 '+x.likes+' · 조회 '+x.views+'</small></li>').join('')+'</ol>':empty('이번 주 라운지 이야기를 기다려요.'))+
      fold('뉴스룸에서 고른 소식', external.length?external.map(x=>'<section class="ilbo-story"><h4>'+esc(x.title)+'</h4><p>'+esc(x.body)+'</p></section>').join(''):empty('현재 불러온 뉴스룸 소식이 없어요.'))+
      fold('다음 주 미리보기 · 할 일과 마감', '<p class="ilbo-note">'+issue.date+' ~ '+shift(issue.date,6)+' · 미완료 일정</p>'+(model.tasks.length?'<ul class="ilbo-list">'+model.tasks.map(x=>'<li><b>'+esc(x.text)+'</b><time datetime="'+x.due+'">'+x.due+'</time></li>').join('')+'</ul>':empty('등록된 마감이 없어요. 여유도 일정의 일부예요.')))+
      fold('하니의 칭찬 한 줄', '<blockquote>'+esc(issue.praise)+'</blockquote>')+'</div><footer class="ilbo-footer">한 주의 작은 순간을 모읍니다 · '+esc(issue.reporter || '민지 대리')+'</footer></article>';
  }
  let entries = [], selected = null, generation = 0, loading = null, seenDate = '', ready = false;
  const cache = new Map();
  const root = () => document.getElementById(VIEW);
  const stateSource = () => typeof state !== 'undefined' ? state : {};
  const newsroomSource = () => typeof investmentNewsArchiveRuntime !== 'undefined' ? investmentNewsArchiveRuntime.posts : [];
  async function json(file) {
    const response = await fetch(file,{credentials:'omit'});
    if (!response.ok) throw Error('신문 파일을 불러오지 못했어요.');
    return response.json();
  }
  function homeCard(now = Date.now()) {
    const card = document.querySelector('[data-ilbo-home]');if (!card) return;
    const latest = entries.find(x=>x.date <= koreaDate(now));
    card.hidden = !latest || latest.date <= seenDate;
    if (latest) card.innerHTML = '<div><small>민지 대리가 전하는 한 주</small><h3>하니일보 제 '+latest.number+'호가 도착했어요</h3><p>'+latest.date.replaceAll('-','.')+' · 이번 주 우리 이야기를 만나보세요.</p></div><button type="button" class="btn" data-ilbo-open>신문 읽기 →</button>';
    const button = card.querySelector('[data-ilbo-open]');if (button) button.onclick = () => { selected = null; if (typeof showView === 'function') showView(VIEW); };
  }
  function bindImage(host) {
    const image = host.querySelector('[data-ilbo-comic]'), placeholder = host.querySelector('[data-ilbo-placeholder]');
    if (!image || !placeholder) return;
    const update = () => {const valid = image.complete && image.naturalWidth > 0;image.hidden = !valid;placeholder.hidden = valid;};
    image.onload = update;image.onerror = update;update();
  }
  function archive(host, now) {
    const slot = host.querySelector('[data-ilbo-archive]');
    slot.innerHTML = '<h3>지난 호 보관함</h3>'+entries.filter(x=>x.date<=koreaDate(now)).map(x=>'<button type="button" class="btn" data-ilbo-issue="'+x.number+'" aria-pressed="'+(x.number===selected?.number)+'">제 '+x.number+'호 · '+x.date+'</button>').join('');
  }
  async function render() {
    const host = root();if (!host) return;
    if (!entries.length) {host.querySelector('[data-ilbo-content]').innerHTML = empty('아직 발행된 신문이 없어요. 첫 소식을 기다려 주세요.');return;}
    const now = Date.now(), entry = selected || entries.find(x=>x.date<=koreaDate(now)) || entries[0], token = ++generation;
    selected = entry;
    const slot = host.querySelector('[data-ilbo-content]');slot.setAttribute('aria-busy','true');
    try {
      let issue = cache.get(entry.number);
      if (!issue) {issue = parseIssue(await json(entry.file),entry);cache.set(entry.number,issue);}
      if (token !== generation) return;
      slot.innerHTML = markup(issue,stateSource(),window.HaniBoard,newsroomSource(),now);bindImage(slot);archive(host,now);
      if (host.classList.contains('active') && entry.date <= koreaDate(now)) {seenDate = seenDate > entry.date ? seenDate : entry.date;homeCard(now);}
    } catch (error) {
      if (token !== generation) return;
      slot.innerHTML = empty(error.message)+'<button class="btn" type="button" data-ilbo-retry>다시 불러오기</button>';
    } finally {if (token === generation) slot.setAttribute('aria-busy','false');}
  }
  async function boot() {
    if (loading) return loading;
    loading = (async () => {
      try {entries = parseManifest(await json('data/hani-ilbo/issues.json'));ready = true;homeCard();await render();}
      catch (error) {const host = root()?.querySelector('[data-ilbo-content]');if (host) host.innerHTML = empty(error.message)+'<button class="btn" type="button" data-ilbo-retry>다시 불러오기</button>';}
    })();
    try {await loading;} finally {loading = null;}
  }
  async function enter() {if (!ready) await boot();else await render();}
  window.HaniIlbo = Object.freeze({enter,homeCard,compute,period,koreaDate,parseManifest,parseIssue,topPosts,newsroomPosts,markup,bindImage});
  if (typeof document === 'undefined') return;
  function start() {
    const host = root();if (!host) return;
    const preparePrint = () => host.querySelectorAll('details').forEach(x=>{if (x.dataset.ilboWasOpen === undefined) x.dataset.ilboWasOpen=String(x.open);x.open=true;});
    host.addEventListener('click',event => {
      const issue = event.target.closest('[data-ilbo-issue]');
      if (issue) {selected = entries.find(x=>x.number===Number(issue.dataset.ilboIssue)) || null;render();}
      if (event.target.closest('[data-ilbo-retry]')) enter();
      if (event.target.closest('[data-ilbo-print]')) {preparePrint();window.print();}
    });
    window.addEventListener('beforeprint',preparePrint);
    window.addEventListener('afterprint',()=>host.querySelectorAll('details[data-ilbo-was-open]').forEach(x=>{x.open=x.dataset.ilboWasOpen==='true';delete x.dataset.ilboWasOpen;}));
    document.addEventListener('visibilitychange',()=>{if (!document.hidden) {homeCard();if (host.classList.contains('active')) enter();}});
    boot();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
