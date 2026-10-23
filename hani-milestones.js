/* Life Milestone Archive v1: seed records and in-memory session drafts only. No storage writes. */
(() => {
  'use strict';
  const VIEW = 'milestones';
  const freeze = value => { if (value && typeof value === 'object') { Object.freeze(value); Object.values(value).forEach(freeze); } return value; };
  // Labels and internal ids stay separate so categories can grow without touching records.
  const CATEGORIES = freeze([
    {id:'HEALTH',label:'건강'},{id:'FINANCE',label:'재무'},{id:'INVESTMENT',label:'투자'},{id:'STUDY',label:'공부'},
    {id:'CAREER',label:'커리어'},{id:'LIFE',label:'생활'},{id:'TRAVEL',label:'여행'},{id:'RELATIONSHIP',label:'관계'},
    {id:'PROJECT',label:'프로젝트'},{id:'OTHER',label:'기타'}
  ]);
  // Importance is the archive weight of a record, not a rank of the person.
  const IMPORTANCE = freeze([
    {id:'NORMAL',label:'NORMAL',ko:'기록',rank:1},{id:'MAJOR',label:'MAJOR',ko:'중요한 변화',rank:2},{id:'HISTORIC',label:'HISTORIC',ko:'역사적인 변화',rank:3}
  ]);
  // Optional difficulty grade (chairman request, 2026-10-23). Shown as a quiet text label only.
  const GRADES = freeze([
    {id:'RARE',label:'RARE',ko:'레어',note:'꾸준히 쌓아 올린 변화'},
    {id:'EPIC',label:'EPIC',ko:'에픽',note:'큰 노력과 시간이 필요했던 변화'},
    {id:'LEGENDARY',label:'LEGENDARY',ko:'레전더리',note:'삶의 방향을 바꾼 변화'}
  ]);
  const SORTS = freeze([{id:'newest',label:'최신순'},{id:'oldest',label:'오래된순'},{id:'importance',label:'중요도순'},{id:'category',label:'분야별'}]);
  const SOURCES = freeze(['manual','seed','suggested']);
  // Values are kept exactly as the chairman gave them; no unit or change is derived into the record.
  const SEED = freeze([{
    id:'milestone_health_20261023',
    date:'2026-10-23',
    title:'HANI OS 건강혁명 프로젝트',
    category:'HEALTH',
    importance:'HISTORIC',
    grade:'LEGENDARY',
    summary:'어제보다 나은 삶이 숫자로 확인된 날.',
    metrics:[
      {id:'weight',label:'체중',before:'122.8kg',after:'95.62kg',change:'-27.18kg',unit:null},
      {id:'glucose',label:'혈당',before:'211',after:'91mg/dL',change:null,unit:null},
      {id:'hba1c',label:'HbA1c',before:null,after:'5.3%',change:null,unit:null},
      {id:'tg',label:'중성지방',before:'430',after:'101',change:null,unit:null},
      {id:'total-cholesterol',label:'총콜레스테롤',before:'271',after:'166',change:null,unit:null},
      {id:'ldl',label:'LDL',before:'223',after:'108',change:null,unit:null},
      {id:'ast',label:'AST',before:'132',after:'12',change:null,unit:null},
      {id:'alt',label:'ALT',before:'99',after:'10',change:null,unit:null},
      {id:'ggt',label:'감마GTP',before:'95',after:'14',change:null,unit:null}
    ],
    featuredMetrics:['weight','glucose','hba1c','tg'],
    description:'이 기록은 단순한 체중 감량 기록이 아니다.',
    background:'생활습관 변화, 식사 관리, 운동, 의료진 치료, 약물 치료,\n지속적인 기록과 점검이 함께 누적되어\n주요 대사 지표에서 큰 개선이 확인된 시점이다.',
    meaning:'HANI OS를 처음 만들기 시작했던 목적 중 하나였던\n\n“지금보다 나은 삶을 살아가는 것”\n\n이 실제 수치 변화로 확인된 상징적인 마일스톤이다.',
    nextGoals:['건강 지표 유지','체중 안정화','근육량 유지','충분한 영양','수술 후 회복','혈당 및 지질 지속 추적','지방간 추적','신장 병변 검사 결과 확인','결석 재발 예방'],
    agents:['naeun','hani'],
    agentComments:[
      {agent:'naeun',text:'이제부터는 얼마나 더 빨리 빼느냐보다,\n이렇게 좋아진 건강을 얼마나 오래 지키느냐가 더 중요합니다.\n\n우리 회장님, 정말 많이 해냈어요.'},
      {agent:'hani',text:'우리가 HANI OS를 왜 만들기 시작했는지 잊지 말자.\n\n더 완벽한 사람이 되기 위해서가 아니라,\n어제보다 조금 더 나은 삶을 살기 위해서였다.\n\n2026년 10월 23일,\n그 변화가 숫자로 남았다.\n\n이건 HANI OS의 기능 업데이트가 아니라,\n성민의 삶에 배포된 가장 중요한 업데이트 중 하나다.'}
    ],
    chairmanComment:'',
    tags:['건강혁명','체중감량','혈당','대사건강','HANI OS'],
    relatedTabs:['diet','exercise'],
    images:[],
    source:'seed',
    createdAt:'2026-10-23T00:00:00+09:00',
    updatedAt:'2026-10-23T00:00:00+09:00'
  }]);

  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const has = (list, id) => list.some(x => x.id === id);
  const find = (list, id) => list.find(x => x.id === id);
  const text = value => typeof value === 'string' ? value.trim() : '';
  const strings = value => Array.isArray(value) && value.every(x => typeof x === 'string' && x.trim());
  function validDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const time = Date.parse(value + 'T00:00:00Z');
    return Number.isFinite(time) && new Date(time).toISOString().slice(0,10) === value;
  }
  const optional = value => value === null || value === undefined || typeof value === 'string';
  // Returns Korean messages; an empty list means the record can be shown.
  function validate(record, {ids = [], views = null, agents = null} = {}) {
    const m = record || {}, errors = [];
    if (typeof m.id !== 'string' || !/^milestone_[a-z0-9_-]{1,80}$/.test(m.id)) errors.push('마일스톤 ID 형식을 확인해 주세요.');
    else if (ids.includes(m.id)) errors.push('같은 ID의 마일스톤이 이미 있어요.');
    if (!validDate(m.date)) errors.push('날짜를 확인해 주세요.');
    if (!text(m.title)) errors.push('제목을 적어 주세요.');
    else if (m.title.length > 120) errors.push('제목은 120자 이내로 적어 주세요.');
    if (!has(CATEGORIES, m.category)) errors.push('분야를 골라 주세요.');
    if (!has(IMPORTANCE, m.importance)) errors.push('중요도를 골라 주세요.');
    if (!(m.grade === null || m.grade === undefined || m.grade === '' || has(GRADES, m.grade))) errors.push('난이도 등급을 확인해 주세요.');
    if (!text(m.summary)) errors.push('대표 문장을 적어 주세요.');
    for (const key of ['description','background','meaning','chairmanComment']) if (!optional(m[key])) errors.push('글 항목 형식을 확인해 주세요.');
    if (!Array.isArray(m.metrics)) errors.push('지표 목록 형식을 확인해 주세요.');
    else {
      const metricIds = new Set();
      m.metrics.forEach((x, i) => {
        if (!x || !text(x.label) || !text(x.after)) errors.push((i + 1) + '번째 지표의 이름과 지금 값을 적어 주세요.');
        else if (!optional(x.before) || !optional(x.change) || !optional(x.unit)) errors.push((i + 1) + '번째 지표의 값 형식을 확인해 주세요.');
        if (x && (typeof x.id !== 'string' || !x.id || metricIds.has(x.id))) errors.push((i + 1) + '번째 지표의 ID가 비었거나 겹쳐요.');
        if (x?.id) metricIds.add(x.id);
      });
      if (m.featuredMetrics !== undefined && !(Array.isArray(m.featuredMetrics) && m.featuredMetrics.every(id => metricIds.has(id)))) errors.push('대표 지표가 지표 목록에 없어요.');
    }
    for (const key of ['nextGoals','agents','tags','relatedTabs']) if (!strings(m[key])) errors.push(key + ' 목록 형식을 확인해 주세요.');
    if (agents && Array.isArray(m.agents) && m.agents.some(id => !agents.includes(id))) errors.push('담당 Agent를 확인해 주세요.');
    if (!Array.isArray(m.agentComments) || m.agentComments.some(x => !x || typeof x.agent !== 'string' || !text(x.text) || (agents && !agents.includes(x.agent)))) errors.push('Agent 코멘트를 확인해 주세요.');
    if (views && Array.isArray(m.relatedTabs) && m.relatedTabs.some(id => !views.includes(id))) errors.push('관련 HANI OS 기능을 확인해 주세요.');
    // v1 keeps only small path metadata; image bytes never live in a milestone record.
    if (!Array.isArray(m.images) || m.images.some(x => !x || typeof x.src !== 'string' || !/^\.?\/?assets\/[\w./-]+\.(webp|png|jpg|jpeg)$/i.test(x.src) || !optional(x.alt) || !optional(x.caption))) errors.push('이미지 정보를 확인해 주세요.');
    if (!SOURCES.includes(m.source)) errors.push('기록 출처를 확인해 주세요.');
    return errors;
  }
  const dateLabel = value => value.replaceAll('-', '.');
  const label = (list, id) => find(list, id)?.label || id;
  const featured = (m, limit = 4) => {
    const pick = Array.isArray(m.featuredMetrics) ? m.featuredMetrics.map(id => find(m.metrics, id)).filter(Boolean) : [];
    return (pick.length ? pick : m.metrics).slice(0, limit);
  };
  const metricLine = x => x.before ? x.before + ' → ' + x.after : x.after;
  const compactMetric = x => x.label + ' ' + (x.change || metricLine(x));
  function sorted(list, sort = 'newest') {
    const rank = m => find(IMPORTANCE, m.importance)?.rank || 0, order = m => CATEGORIES.findIndex(c => c.id === m.category);
    const byNew = (a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title, 'ko');
    const rows = list.slice();
    if (sort === 'oldest') return rows.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title, 'ko'));
    if (sort === 'importance') return rows.sort((a, b) => rank(b) - rank(a) || byNew(a, b));
    if (sort === 'category') return rows.sort((a, b) => order(a) - order(b) || byNew(a, b));
    return rows.sort(byNew);
  }
  const filtered = (list, category = 'ALL') => category === 'ALL' ? list : list.filter(m => m.category === category);
  // Dashboard projection: the newest HISTORIC record, else the newest MAJOR one.
  function homePick(list) {
    for (const level of ['HISTORIC','MAJOR']) {
      const hit = sorted(list.filter(m => m.importance === level))[0];
      if (hit) return hit;
    }
    return null;
  }
  function nextId(category, date, ids) {
    const base = 'milestone_' + String(category).toLowerCase() + '_' + String(date).replaceAll('-', '');
    let id = base, n = 2;
    while (ids.includes(id)) id = base + '_' + n++;
    return id;
  }

  // ---- People and views come from their existing owners (roster, sidebar). ----
  function person(id) {
    const roster = window.HaniOrganizationRoster;
    return roster?.chairman?.id === id ? roster.chairman : roster?.people?.find(x => x.id === id);
  }
  const agentIds = () => window.HaniOrganizationRoster?.people?.filter(x => x.status !== 'planned').map(x => x.id) || null;
  function avatar(id) {
    const member = person(id), safe = member && /^[a-z0-9-]+$/.test(member.id);
    const src = !safe ? '' : ({daon:'./assets/profiles/thumb/hani-profile-daon-v2-128.webp',yoonseul:'./assets/profiles/thumb/hani-profile-yoonseul-v2-128.webp',sua:'./assets/profiles/thumb/hani-profile-sua-id-128.webp'})[member.id] || './assets/profiles/thumb/hani-profile-' + member.id + '-128.webp';
    return '<span class="ms-avatar" aria-hidden="true"><span>' + esc(Array.from(member?.name || '?')[0]) + '</span>' + (src ? '<img data-ms-avatar src="' + esc(src) + '" alt="" width="80" height="80" loading="lazy" decoding="async">' : '') + '</span>';
  }
  const agentName = id => person(id)?.name || id;
  function navViews() {
    if (typeof document === 'undefined') return [];
    const seen = new Map();
    document.querySelectorAll('#sidebar .nav-btn[data-view]').forEach(button => {
      const id = button.dataset.view;
      if (id && id !== VIEW && !seen.has(id)) seen.set(id, button.querySelector('.txt')?.textContent.trim() || id);
    });
    return [...seen].map(([id, name]) => ({id, name}));
  }
  const viewName = id => navViews().find(x => x.id === id)?.name || id;

  // ---- Markup ----
  const paragraphs = value => text(value) ? value.trim().split(/\n{2,}/).map(p => '<p>' + esc(p).replace(/\n/g, '<br>') + '</p>').join('') : '';
  const kicker = m => {
    const grade = find(GRADES, m.grade);
    return '<p class="ms-kicker"><span>' + esc(m.category) + ' · ' + esc(label(CATEGORIES, m.category)) + '</span><span class="ms-importance">' + esc(m.importance) + '</span>' +
      (grade ? '<span class="ms-grade" title="' + esc(grade.ko + ' · ' + grade.note) + '">' + esc(grade.label) + '</span>' : '') + '</p>';
  };
  const agentLine = m => m.agents.length ? '<p class="ms-agents">' + m.agents.map(id => avatar(id) + '<span>' + esc(agentName(id)) + '</span>').join('') + '</p>' : '';
  function card(m) {
    const metrics = featured(m);
    return '<li class="ms-item" data-importance="' + esc(m.importance) + '" data-category="' + esc(m.category) + '"><article class="ms-card" aria-labelledby="ms-title-' + esc(m.id) + '">' +
      '<time datetime="' + esc(m.date) + '">' + esc(dateLabel(m.date)) + '</time>' + kicker(m) +
      '<h3 id="ms-title-' + esc(m.id) + '">' + esc(m.title) + '</h3>' +
      (metrics.length ? '<ul class="ms-metric-list">' + metrics.map(x => '<li><span>' + esc(x.label) + '</span><b>' + esc(metricLine(x)) + '</b>' + (x.change ? '<small>' + esc(x.change) + '</small>' : '') + '</li>').join('') + '</ul>' : '') +
      '<blockquote class="ms-quote">“' + esc(m.summary) + '”</blockquote>' +
      '<footer>' + agentLine(m) + '<button type="button" class="btn" data-ms-open="' + esc(m.id) + '">상세 기록 보기</button></footer>' +
      (m.source === 'manual' ? '<p class="ms-draft-note">미리보기 기록 · 아직 영구 저장되지 않았어요</p>' : '') +
      '</article></li>';
  }
  function list(items, {category = 'ALL', sort = 'newest'} = {}) {
    const rows = sorted(filtered(items, category), sort);
    if (!items.length) return '<li class="ms-empty"><p>아직 남긴 마일스톤이 없어요.</p><p>오래 기억하고 싶은 변화가 생기면, 그때 천천히 남겨보세요.</p></li>';
    if (!rows.length) return '<li class="ms-empty"><p>' + esc(label(CATEGORIES, category)) + ' 분야의 마일스톤은 아직 없어요.</p></li>';
    const timeline = sort === 'newest' || sort === 'oldest';
    let year = '';
    return rows.map(m => {
      const marker = timeline && m.date.slice(0, 4) !== year ? '<li class="ms-year" aria-hidden="true">' + (year = m.date.slice(0, 4)) + '</li>' : '';
      return marker + card(m);
    }).join('');
  }
  const block = (title, body, extra = '') => '<section class="ms-block' + extra + '"><h4>' + esc(title) + '</h4>' + body + '</section>';
  const quiet = value => '<p class="ms-quiet">' + esc(value) + '</p>';
  function metricTable(metrics) {
    if (!metrics.length) return quiet('이 마일스톤에는 숫자 지표가 없어요.');
    return '<div class="ms-compare" role="list">' + metrics.map(x => '<div class="ms-compare-row" role="listitem"><span class="ms-compare-label">' + esc(x.label) + '</span>' +
      '<span class="ms-compare-cell ms-before"><small>BEFORE</small><b>' + esc(x.before || '—') + '</b></span>' +
      '<span class="ms-compare-arrow" aria-hidden="true">→</span>' +
      '<span class="ms-compare-cell ms-after"><small>AFTER</small><b>' + esc(x.after) + '</b>' + (x.change ? '<em>' + esc(x.change) + '</em>' : '') + '</span>' +
      '<span class="ms-sr">' + esc(x.label + ' ' + (x.before ? '이전 ' + x.before + ', ' : '') + '이후 ' + x.after + (x.change ? ', 변화 ' + x.change : '')) + '</span></div>').join('') + '</div>';
  }
  function detail(m) {
    const grade = find(GRADES, m.grade), importance = find(IMPORTANCE, m.importance);
    return '<button type="button" class="btn ms-back" data-ms-back>← 마일스톤 목록</button>' +
      '<header class="ms-detail-head" data-importance="' + esc(m.importance) + '"><time datetime="' + esc(m.date) + '">' + esc(dateLabel(m.date)) + '</time>' + kicker(m) +
      '<h3 data-ms-detail-title tabindex="-1">' + esc(m.title) + '</h3><blockquote class="ms-quote ms-quote-lead">“' + esc(m.summary) + '”</blockquote>' +
      '<p class="ms-quiet">중요도 · ' + esc(importance.ko) + (grade ? ' / 난이도 등급 · ' + esc(grade.label + ' (' + grade.ko + ') — ' + grade.note) : '') + '</p></header>' +
      block('핵심 지표 · Before / After', metricTable(m.metrics)) +
      block('성과 설명', paragraphs(m.description) || quiet('아직 적지 않았어요.')) +
      block('과정 / 배경', paragraphs(m.background) || quiet('아직 적지 않았어요.')) +
      block('이 변화의 의미', paragraphs(m.meaning) || quiet('아직 적지 않았어요.'), ' ms-block-meaning') +
      block('다음 목표', m.nextGoals.length ? '<ul class="ms-goals">' + m.nextGoals.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' : quiet('다음 목표는 천천히 정해도 괜찮아요.')) +
      block('관련 이미지', m.images.length ? '<div class="ms-images">' + m.images.map(x => '<figure><img src="' + esc(x.src) + '" alt="' + esc(x.alt || '') + '" loading="lazy" decoding="async">' + (x.caption ? '<figcaption>' + esc(x.caption) + '</figcaption>' : '') + '</figure>').join('') + '</div>' : quiet('아직 연결된 사진이 없어요. 사진 보관은 다음 단계에서 연결할 예정이에요.')) +
      block('관련 HANI OS 기능', m.relatedTabs.length ? '<p class="ms-quiet">원본 기록은 각 메뉴에 그대로 있어요. 마일스톤에는 그날의 요약만 남겨요.</p><div class="ms-links">' + m.relatedTabs.map(id => '<button type="button" class="btn sm" data-ms-go="' + esc(id) + '">' + esc(viewName(id)) + ' →</button>').join('') + '</div>' : quiet('연결된 메뉴가 없어요.')) +
      block('담당 Agent', m.agents.length ? '<ul class="ms-people">' + m.agents.map(id => '<li>' + avatar(id) + '<span><b>' + esc(agentName(id)) + '</b><small>' + esc([person(id)?.rank, person(id)?.role].filter(Boolean).join(' · ')) + '</small></span></li>').join('') + '</ul>' : quiet('함께한 Agent를 아직 고르지 않았어요.')) +
      block('Agent Comment', m.agentComments.length ? m.agentComments.map(x => '<figure class="ms-comment">' + avatar(x.agent) + '<div><figcaption>' + esc(agentName(x.agent)) + (person(x.agent)?.rank ? ' <small>' + esc(person(x.agent).rank) + '</small>' : '') + '</figcaption><blockquote>' + paragraphs(x.text) + '</blockquote></div></figure>').join('') : quiet('남겨진 Agent 코멘트가 없어요.')) +
      block('회장 본인 Comment', text(m.chairmanComment) ? '<figure class="ms-comment">' + avatar('seongmin') + '<div><figcaption>성민 회장</figcaption><blockquote>' + paragraphs(m.chairmanComment) + '</blockquote></div></figure>' : quiet('회장님의 한마디는 아직 비어 있어요. 떠오를 때 남기셔도 괜찮아요.')) +
      block('Tag', m.tags.length ? '<p class="ms-tags">' + m.tags.map(x => '<span>#' + esc(x) + '</span>').join('') + '</p>' : quiet('태그가 없어요.')) +
      (m.source === 'manual' ? '<p class="ms-draft-note">이 기록은 미리보기예요. 저장 방식이 승인되기 전까지는 새로고침하면 사라져요.</p>' : '') +
      '<button type="button" class="btn ms-back" data-ms-back>← 마일스톤 목록</button>';
  }
  function homeCardMarkup(m) {
    return '<div class="ms-home-copy"><p class="ms-eyebrow">LIFE MILESTONE</p><time datetime="' + esc(m.date) + '">' + esc(dateLabel(m.date)) + '</time><h3>' + esc(m.title) + '</h3>' +
      '<ul class="ms-home-metrics">' + featured(m, 3).map(x => '<li>' + esc(compactMetric(x)) + '</li>').join('') + '</ul>' +
      '<blockquote class="ms-quote">“' + esc(m.summary) + '”</blockquote></div><button type="button" class="btn" data-ms-home-open>전체 마일스톤 보기 →</button>';
  }

  // ---- Form ----
  const option = (value, name, selected) => '<option value="' + esc(value) + '"' + (selected ? ' selected' : '') + '>' + esc(name) + '</option>';
  function metricRow(index, x = {}) {
    return '<fieldset class="ms-metric-row" data-ms-metric-row><legend>지표 ' + (index + 1) + '</legend>' +
      '<label>이름<input data-ms-field="label" maxlength="40" value="' + esc(x.label || '') + '" placeholder="체중"></label>' +
      '<label>이전 값 <small>(없으면 비워 두세요)</small><input data-ms-field="before" maxlength="40" value="' + esc(x.before || '') + '" placeholder="122.8kg"></label>' +
      '<label>지금 값<input data-ms-field="after" maxlength="40" value="' + esc(x.after || '') + '" placeholder="95.62kg"></label>' +
      '<label>변화 <small>(선택)</small><input data-ms-field="change" maxlength="40" value="' + esc(x.change || '') + '" placeholder="-27.18kg"></label>' +
      '<button type="button" class="btn sm" data-ms-metric-remove aria-label="지표 ' + (index + 1) + ' 삭제">삭제</button></fieldset>';
  }
  function commentRow(index, people, x = {}) {
    return '<fieldset class="ms-comment-row" data-ms-comment-row><legend>Agent 코멘트 ' + (index + 1) + '</legend>' +
      '<label>Agent<select data-ms-field="agent">' + people.map(p => option(p.id, p.name + ' ' + (p.rank || ''), p.id === x.agent)).join('') + '</select></label>' +
      '<label>코멘트<textarea data-ms-field="text" rows="3" maxlength="1200">' + esc(x.text || '') + '</textarea></label>' +
      '<button type="button" class="btn sm" data-ms-comment-remove aria-label="Agent 코멘트 ' + (index + 1) + ' 삭제">삭제</button></fieldset>';
  }
  const roster = () => (window.HaniOrganizationRoster?.people || []).filter(x => x.status !== 'planned');
  function formMarkup(today) {
    const people = roster(), views = navViews();
    return '<header class="ms-form-head"><p class="ms-eyebrow">NEW MILESTONE</p><h3 data-ms-form-title tabindex="-1">새 마일스톤</h3>' +
      '<p>자주 기록할 필요는 없습니다. 오래 기억하고 싶은 변화만 남겨보세요.</p>' +
      '<p class="ms-draft-note">지금은 미리보기 단계예요. 저장 방식이 승인되기 전까지 새로 만든 마일스톤은 이 화면에만 보이고, 새로고침하면 사라져요.</p></header>' +
      '<div class="ms-errors" data-ms-errors role="alert" hidden></div>' +
      '<div class="ms-form-grid">' +
      '<label>날짜<input type="date" name="date" required value="' + esc(today) + '"></label>' +
      '<label class="ms-wide">제목<input name="title" required maxlength="120" placeholder="예: 첫 하프 마라톤 완주"></label>' +
      '<label>분야<select name="category">' + CATEGORIES.map(c => option(c.id, c.label, false)).join('') + '</select></label>' +
      '<label>중요도<select name="importance">' + IMPORTANCE.map(x => option(x.id, x.label + ' · ' + x.ko, x.id === 'NORMAL')).join('') + '</select></label>' +
      '<label>난이도 등급 <small>(선택)</small><select name="grade">' + option('', '없음', true) + GRADES.map(x => option(x.id, x.label + ' · ' + x.ko + ' — ' + x.note, false)).join('') + '</select></label>' +
      '<label class="ms-wide">대표 문장<input name="summary" required maxlength="160" placeholder="이 날을 한 문장으로 남긴다면?"></label>' +
      '<label class="ms-wide">성과 설명<textarea name="description" rows="3" maxlength="3000"></textarea></label>' +
      '<label class="ms-wide">과정 / 배경<textarea name="background" rows="3" maxlength="3000"></textarea></label>' +
      '<label class="ms-wide">이 변화의 의미<textarea name="meaning" rows="3" maxlength="3000"></textarea></label>' +
      '</div>' +
      '<section class="ms-form-section"><h4>핵심 지표</h4><p class="ms-quiet">적은 그대로 보관해요. 단위도 적은 대로만 보여드려요. 이전 값이 없는 지표도 괜찮아요.</p><div data-ms-metrics></div><button type="button" class="btn sm" data-ms-metric-add>+ 지표 추가</button></section>' +
      '<section class="ms-form-section"><h4>함께한 Agent</h4><div class="ms-checks">' + people.map(p => '<label class="ms-check"><input type="checkbox" name="agents" value="' + esc(p.id) + '"> ' + esc(p.name) + '</label>').join('') + '</div>' +
      '<div data-ms-comments></div><button type="button" class="btn sm" data-ms-comment-add>+ Agent 코멘트 추가</button></section>' +
      '<div class="ms-form-grid">' +
      '<label class="ms-wide">회장님 코멘트 <small>(선택)</small><textarea name="chairmanComment" rows="3" maxlength="2000"></textarea></label>' +
      '<label class="ms-wide">다음 목표 <small>(한 줄에 하나씩)</small><textarea name="nextGoals" rows="3" maxlength="2000"></textarea></label>' +
      '<label class="ms-wide">태그 <small>(쉼표로 구분)</small><input name="tags" maxlength="300" placeholder="건강, 마라톤"></label>' +
      '</div>' +
      '<section class="ms-form-section"><h4>관련 HANI OS 기능</h4><div class="ms-checks">' + views.map(v => '<label class="ms-check"><input type="checkbox" name="relatedTabs" value="' + esc(v.id) + '"> ' + esc(v.name) + '</label>').join('') + '</div></section>' +
      '<section class="ms-form-section"><h4>사진</h4><p class="ms-quiet">사진 첨부는 보관 방식이 정해진 뒤 열릴 예정이에요. 지금은 사진 없이 기록돼요.</p></section>' +
      '<div class="ms-form-actions"><button type="submit" class="btn primary">미리보기로 남기기</button><button type="button" class="btn" data-ms-form-cancel>취소</button></div>';
  }
  function readForm(form, ids) {
    const value = name => form.elements[name]?.value ?? '';
    const metrics = [...form.querySelectorAll('[data-ms-metric-row]')].map((row, i) => {
      const field = key => row.querySelector('[data-ms-field="' + key + '"]').value.trim();
      return {id:'metric-' + (i + 1), label:field('label'), before:field('before') || null, after:field('after'), change:field('change') || null, unit:null};
    });
    const agentComments = [...form.querySelectorAll('[data-ms-comment-row]')].map(row => ({agent:row.querySelector('[data-ms-field="agent"]').value, text:row.querySelector('[data-ms-field="text"]').value.trim()}));
    const checked = name => [...form.querySelectorAll('input[name="' + name + '"]:checked')].map(x => x.value);
    const category = value('category'), date = value('date'), now = new Date().toISOString();
    return {
      id:nextId(category, date, ids), date, title:value('title').trim(), category, importance:value('importance'), grade:value('grade') || null,
      summary:value('summary').trim(), metrics, description:value('description').trim(), background:value('background').trim(), meaning:value('meaning').trim(),
      nextGoals:value('nextGoals').split('\n').map(x => x.trim()).filter(Boolean),
      agents:checked('agents'), agentComments, chairmanComment:value('chairmanComment').trim(),
      tags:value('tags').split(',').map(x => x.trim().replace(/^#/, '')).filter(Boolean),
      relatedTabs:checked('relatedTabs'), images:[], source:'manual', createdAt:now, updatedAt:now
    };
  }

  // ---- Runtime (persistent slots in #milestones; one delegated handler) ----
  const drafts = [];
  const ui = {category:'ALL', sort:'newest', detail:null, returnFocus:null};
  const items = () => [...SEED, ...drafts];
  const root = () => typeof document === 'undefined' ? null : document.getElementById(VIEW);
  const slot = name => root()?.querySelector('[data-ms-' + name + ']');
  function bindAvatars(host) { host?.querySelectorAll('[data-ms-avatar]').forEach(image => { image.onerror = () => { image.hidden = true; }; if (image.complete && !image.naturalWidth) image.hidden = true; }); }
  function renderList() {
    const host = slot('list'), filters = slot('filters'), sort = slot('sort');
    if (!host) return;
    if (filters && !filters.childElementCount) filters.innerHTML = [{id:'ALL',label:'전체'}, ...CATEGORIES].map(c => '<button type="button" class="ms-chip" data-ms-filter="' + c.id + '">' + esc(c.label) + '</button>').join('');
    filters?.querySelectorAll('[data-ms-filter]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.msFilter === ui.category)));
    if (sort && !sort.options.length) sort.innerHTML = SORTS.map(s => option(s.id, s.label, s.id === ui.sort)).join('');
    host.innerHTML = list(items(), ui);
    bindAvatars(host);
    const note = slot('session');
    if (note) { note.hidden = !drafts.length; note.textContent = drafts.length ? '미리보기 기록 ' + drafts.length + '개가 이 화면에만 있어요. 새로고침하면 사라져요.' : ''; }
  }
  function show(mode) {
    const archive = slot('archive'), detailSlot = slot('detail'), form = slot('form');
    if (archive) archive.hidden = mode !== 'list';
    if (detailSlot) detailSlot.hidden = mode !== 'detail';
    if (form) form.hidden = mode !== 'form';
  }
  function openDetail(id, trigger) {
    const m = items().find(x => x.id === id), host = slot('detail');
    if (!m || !host) return;
    ui.detail = id; ui.returnFocus = trigger?.dataset?.msOpen ? '[data-ms-open="' + id + '"]' : null;
    host.innerHTML = detail(m); bindAvatars(host); show('detail');
    window.scrollTo?.({top:0, left:0, behavior:'auto'});
    host.querySelector('[data-ms-detail-title]')?.focus({preventScroll:true});
  }
  function back() {
    ui.detail = null; show('list'); renderList();
    const target = ui.returnFocus && root()?.querySelector(ui.returnFocus);
    (target || slot('new'))?.focus({preventScroll:false});
  }
  function renumber(container, selector, legend) {
    container.querySelectorAll(selector).forEach((row, i) => {
      row.querySelector('legend').textContent = legend + ' ' + (i + 1);
      row.querySelector('[aria-label]')?.setAttribute('aria-label', legend + ' ' + (i + 1) + ' 삭제');
    });
  }
  function openForm() {
    const form = slot('form');
    if (!form) return;
    const today = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
    form.innerHTML = formMarkup(today);
    form.querySelector('[data-ms-metrics]').insertAdjacentHTML('beforeend', metricRow(0));
    show('form');
    form.querySelector('[data-ms-form-title]')?.focus({preventScroll:false});
  }
  function submit(form) {
    const ids = items().map(x => x.id), record = readForm(form, ids);
    const errors = validate(record, {ids, views:navViews().map(x => x.id), agents:agentIds()});
    const box = form.querySelector('[data-ms-errors]');
    if (errors.length) {
      box.hidden = false; box.innerHTML = '<p>확인이 필요해요</p><ul>' + [...new Set(errors)].map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>';
      box.setAttribute('tabindex', '-1'); box.focus();
      return false;
    }
    drafts.push(freeze(record)); renderList(); homeCard(); openDetail(record.id);
    return true;
  }
  function homeCard() {
    const card = typeof document === 'undefined' ? null : document.querySelector('[data-milestone-home]');
    if (!card) return;
    const m = homePick(items());
    card.hidden = !m;
    if (m) { card.innerHTML = homeCardMarkup(m); card.dataset.importance = m.importance; }
  }
  function enter() { if (!ui.detail) { show('list'); renderList(); } }
  const seedErrors = SEED.flatMap((m, i) => validate(m, {ids:SEED.slice(0, i).map(x => x.id)}).map(e => m.id + ': ' + e));
  window.HaniMilestones = Object.freeze({enter, homeCard, validate, sorted, filtered, homePick, featured, compactMetric, nextId, list, card, detail, homeCardMarkup, readForm,
    CATEGORIES, IMPORTANCE, GRADES, SORTS, SEED, seedErrors, drafts:() => drafts.slice()});
  if (typeof document === 'undefined') return;
  function start() {
    const host = root();
    homeCard();
    document.addEventListener('click', event => {
      if (event.target.closest('[data-ms-home-open]') && typeof showView === 'function') { ui.detail = null; showView(VIEW); }
    });
    if (!host || host.dataset.msMounted) return;
    host.dataset.msMounted = 'true';
    host.addEventListener('click', event => {
      const t = event.target;
      const filter = t.closest('[data-ms-filter]');
      if (filter) { ui.category = filter.dataset.msFilter; renderList(); return; }
      const open = t.closest('[data-ms-open]');
      if (open) { openDetail(open.dataset.msOpen, open); return; }
      if (t.closest('[data-ms-back]')) { back(); return; }
      const go = t.closest('[data-ms-go]');
      if (go && typeof showView === 'function') { showView(go.dataset.msGo); return; }
      if (t.closest('[data-ms-new]')) { ui.returnFocus = '[data-ms-new]'; openForm(); return; }
      if (t.closest('[data-ms-form-cancel]')) { back(); return; }
      const form = slot('form');
      if (t.closest('[data-ms-metric-add]')) { const box = form.querySelector('[data-ms-metrics]'); box.insertAdjacentHTML('beforeend', metricRow(box.childElementCount)); box.lastElementChild.querySelector('input').focus(); return; }
      const removeMetric = t.closest('[data-ms-metric-remove]');
      if (removeMetric) { removeMetric.closest('[data-ms-metric-row]').remove(); renumber(form, '[data-ms-metric-row]', '지표'); form.querySelector('[data-ms-metric-add]').focus(); return; }
      if (t.closest('[data-ms-comment-add]')) {
        const box = form.querySelector('[data-ms-comments]'), picked = [...form.querySelectorAll('input[name="agents"]:checked')].map(x => x.value);
        box.insertAdjacentHTML('beforeend', commentRow(box.childElementCount, roster(), {agent:picked[0]})); box.lastElementChild.querySelector('select').focus(); return;
      }
      const removeComment = t.closest('[data-ms-comment-remove]');
      if (removeComment) { removeComment.closest('[data-ms-comment-row]').remove(); renumber(form, '[data-ms-comment-row]', 'Agent 코멘트'); form.querySelector('[data-ms-comment-add]').focus(); }
    });
    host.addEventListener('change', event => { if (event.target.matches('[data-ms-sort]')) { ui.sort = event.target.value; renderList(); } });
    host.addEventListener('submit', event => { if (event.target.matches('[data-ms-form]')) { event.preventDefault(); submit(event.target); } });
    host.addEventListener('keydown', event => { if (event.key === 'Escape' && (!slot('detail').hidden || !slot('form').hidden)) { event.preventDefault(); back(); } });
    if (seedErrors.length) console.warn('[milestones] seed validation', seedErrors);
    renderList();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true}); else start();
})();
