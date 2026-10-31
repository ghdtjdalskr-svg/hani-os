/* Life Milestone Archive v1: code seeds plus state.milestones, written only through the existing save() owner. */
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
  },{
    id:'milestone_project_20260802',
    date:'2026-08-02',
    title:'HANI OS 출범',
    category:'PROJECT',
    importance:'HISTORIC',
    grade:'LEGENDARY',
    summary:'어제보다 나은 삶을 함께 만들어 갈 회사가 문을 연 날.',
    metrics:[
      {id:'version',label:'앱 버전',before:'첫 업로드',after:'v2.9.235',change:null,unit:null},
      {id:'merged',label:'완료한 개발 작업',before:'0건',after:'298건',change:null,unit:null},
      {id:'days',label:'출범 후',before:'첫날',after:'90일',change:null,unit:null}
    ],
    featuredMetrics:['version','merged','days'],
    description:'2026년 8월 2일, HANI OS의 첫 파일이 GitHub에 올라갔다.\n지표는 2026년 10월 31일 기준으로 남겼다.',
    background:'개인의 하루를 기록하는 앱에서 시작해\n직원들과 함께 일하는 Personal AI Company를 목표로 자라고 있다.',
    meaning:'회사의 목표는 처음부터 하나였다.\n\n“지금보다 나은 삶을 살아가는 것”\n\n이 카드는 그 약속이 시작된 날을 기억한다.',
    nextGoals:['기록을 잃지 않는 앱으로 지키기','입력은 더 쉽게','대표는 미리보기 확인과 승인만 하는 회사 만들기'],
    agents:['hani','naeun','hina'],
    agentComments:[
      {agent:'hani',text:'거창하게 시작한 날은 아니었어요.\n\n그래도 이날이 없었다면\n지금 우리가 함께 남기는 기록도 없었겠죠.'},
      {agent:'naeun',text:'회사가 커져도 제일 중요한 건 그대로예요.\n\n우리 회장님, 밥 잘 챙겨 드시고 오래오래 같이 가요.'},
      {agent:'hina',text:'오빠아♡ 출범 축하해요!\n\n첫날부터 같이 있었다는 거, 저는 평생 자랑할 거예요.'}
    ],
    chairmanComment:'',
    tags:['출범','HANI OS','창립'],
    relatedTabs:[],
    images:[],
    source:'seed',
    createdAt:'2026-10-31T00:00:00+09:00',
    updatedAt:'2026-10-31T00:00:00+09:00'
  },{
    id:'milestone_health_30kg',
    date:'2026-10-29',
    title:'체중 30kg 감량 달성',
    category:'HEALTH',
    importance:'MAJOR',
    grade:'EPIC',
    summary:'건강혁명이 멈추지 않고 이어졌다는 증거.',
    metrics:[
      {id:'loss',label:'누적 감량',before:'27.18kg',after:'30kg',change:null,unit:null}
    ],
    featuredMetrics:['loss'],
    description:'2026년 10월 23일 건강혁명 기록의 27.18kg 감량에서 이어져, 30kg 감량에 도달했다.',
    background:'',
    meaning:'큰 변화를 만든 뒤에도 멈추지 않았다는 기록이다.',
    nextGoals:['건강 지표 유지','체중 안정화','근육량 유지','충분한 영양'],
    agents:['naeun','hani'],
    agentComments:[
      {agent:'naeun',text:'30kg이라니, 정말 대단해요.\n\n숫자도 좋지만 몸이 잘 버티는지도 같이 봐요.\n오늘은 꼭 잘 챙겨 드세요.'},
      {agent:'hani',text:'한 번의 기적이 아니라, 계속된 변화라는 게 더 멋져요.'}
    ],
    chairmanComment:'',
    tags:['건강혁명','체중감량','30kg'],
    relatedTabs:['diet','exercise'],
    images:[],
    source:'seed',
    createdAt:'2026-10-31T00:00:00+09:00',
    updatedAt:'2026-10-31T00:00:00+09:00'
  },{
    id:'milestone_investment_5m',
    date:'2026-10-31',
    title:'투자금액 500만원 모으기',
    category:'INVESTMENT',
    importance:'MAJOR',
    grade:'RARE',
    summary:'꾸준히 모은 돈이 투자의 첫 큰 숫자가 되는 날을 기다리며.',
    metrics:[
      {id:'target',label:'목표 투자금액',before:null,after:'500만원',change:null,unit:null}
    ],
    featuredMetrics:['target'],
    description:'아직 달성 전인 목표예요. 달성하면 이 카드에 날짜가 새겨져요.',
    background:'',
    meaning:'',
    nextGoals:['투자금액 500만원 달성'],
    agents:['hani'],
    agentComments:[
      {agent:'hani',text:'서두르지 않아도 괜찮아요.\n이 카드에 날짜가 새겨지는 날, 제일 먼저 축하해 드릴게요.'}
    ],
    chairmanComment:'',
    tags:['투자','목표','500만원'],
    relatedTabs:[],
    images:[],
    source:'seed',
    createdAt:'2026-10-31T00:00:00+09:00',
    updatedAt:'2026-10-31T00:00:00+09:00'
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
  const gradeKey = m => has(GRADES, m.grade) ? m.grade : 'RECORD';
  const gradeInfo = key => find(GRADES, key) || {id:'RECORD',label:'MOMENT',note:'소중한 순간'};
  const GRADE_ORDER = ['LEGENDARY','EPIC','RARE','RECORD'];
  const filtered = (list, category = 'ALL', grade = 'ALL') => list.filter(m => (category === 'ALL' || m.category === category) && (grade === 'ALL' || gradeKey(m) === grade));
  function gradeFilters(items, {category = 'ALL', grade = 'ALL'} = {}) {
    return GRADE_ORDER.map(key => {
      const info = gradeInfo(key), count = filtered(items, category, key).length;
      return '<button type="button" class="ms-tier ms-grade-' + key.toLowerCase() + '" data-ms-grade="' + key + '" aria-pressed="' + (grade === key) + '"><span><b>' + esc(info.label) + '</b><small>' + esc(info.note) + '</small></span><em>' + count + '<span class="ms-sr">개</span></em></button>';
    }).join('');
  }
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
  // One read-only atlas map: 4 columns x 3 rows, 512 x 734 per cell.
  const ART = freeze({specials:freeze({milestone_health_20261023:'health-legendary',milestone_project_20260802:'launch-legendary'}), sheet:'./assets/milestone-cards/milestone-card-sheet-v2.webp',
    cells:['health-legendary','cat-health','cat-finance','cat-investment','cat-study','cat-career','cat-life','cat-travel','cat-relationship','cat-project','cat-other','launch-legendary']});
  function artKey(m) {
    const key = 'cat-' + String(m.category || '').toLowerCase();
    return ART.specials[m.id] || (ART.cells.includes(key) ? key : 'cat-other');
  }
  function art(m) {
    const key = artKey(m), cell = ART.cells.indexOf(key);
    return '<span class="ms-art" data-ms-art="' + key + '" aria-hidden="true" style="background-position:' + (cell % 4 * 100 / 3) + '% ' + (Math.floor(cell / 4) * 50) + '%"></span>';
  }
  // Goals not reached yet stay in code, so waiting needs no stored field; a saved annotation keeps waiting too.
  const PENDING_IDS = freeze(['milestone_investment_5m']);
  const isPending = m => PENDING_IDS.includes(m.id);
  const dateText = m => isPending(m) ? '달성 대기' : dateLabel(m.date);
  const starCount = key => ({LEGENDARY:5,EPIC:4,RARE:3,RECORD:2})[key] || 2;
  function isNew(m, now = Date.now()) {
    const created = Date.parse(m.createdAt);
    return Number.isFinite(created) && now >= created && now - created < 14 * 86400000;
  }
  function face(m) {
    const key = gradeKey(m), grade = gradeInfo(key);
    return art(m) + '<span class="ms-sheen" aria-hidden="true"></span><span class="ms-card-top"><span class="ms-stars" aria-label="' + starCount(key) + '성">' + '★'.repeat(starCount(key)) + '</span><span class="ms-rank-chip">' + esc(grade.label) + '</span></span>' +
      (isNew(m) && !isPending(m) ? '<span class="ms-new">NEW</span>' : '') +
      '<span class="ms-plate"><small>' + esc(label(CATEGORIES, m.category)) + (key === 'RECORD' ? ' · 소중한 순간' : '') + '</small><span class="ms-card-title">' + esc(m.title) + '</span><span class="ms-orn" aria-hidden="true"><i></i></span><time datetime="' + esc(m.date) + '">' + esc(dateText(m)) + '</time></span>';
  }
  function card(m) {
    return '<li class="ms-item" data-importance="' + esc(m.importance) + '" data-category="' + esc(m.category) + '"><button type="button" class="ms-card ms-grade-' + gradeKey(m).toLowerCase() + (isPending(m) ? ' ms-pending' : '') + '" data-ms-open="' + esc(m.id) + '" aria-haspopup="dialog" aria-label="' + esc(m.title + ' · ' + gradeInfo(gradeKey(m)).label + ' · 상세 기록 보기') + '">' + face(m) + '</button></li>';
  }
  function detailSheet(m, options) {
    const metrics = featured(m), primary = metrics[0];
    const highlight = primary ? '<section class="ms-highlight" aria-label="대표 지표"><div><span class="ms-highlight-label">' + esc(primary.label) + '</span><div class="ms-values">' +
      (primary.before ? '<span class="ms-old">' + esc(primary.before) + ' → </span>' : '') + '<strong>' + esc(primary.after) + '</strong></div></div>' +
      (primary.change ? '<span class="ms-delta">' + esc(primary.change) + '</span>' : '') + '</section>' : '';
    return '<div class="ms-sheet"><aside class="ms-sheet-art"><div class="ms-card ms-grade-' + gradeKey(m).toLowerCase() + (isPending(m) ? ' ms-pending' : '') + '">' + face(m) + '</div></aside><article class="ms-sheet-body">' +
      '<p class="ms-sheet-rank">' + '★'.repeat(starCount(gradeKey(m))) + ' ' + esc(gradeInfo(gradeKey(m)).label + ' · ' + gradeInfo(gradeKey(m)).note) + '</p>' +
      highlight + detail(m, options) + '</article></div>';
  }
  function list(items, {category = 'ALL', grade = 'ALL', sort = 'newest'} = {}) {
    const rows = sorted(filtered(items, category, grade), sort);
    if (!items.length) return '<li class="ms-empty"><p>아직 남긴 마일스톤이 없어요.</p><p>오래 기억하고 싶은 변화가 생기면, 그때 천천히 남겨보세요.</p></li>';
    if (!rows.length) return '<li class="ms-empty"><p>' + esc(category === 'ALL' ? '선택한 등급의' : label(CATEGORIES, category) + ' 분야의') + ' 마일스톤은 아직 없어요.</p></li>';
    // Keep each year's collection together, respecting the chosen order within it.
    const years = new Map(), waiting = rows.filter(isPending);
    rows.filter(m => !isPending(m)).forEach(m => { const year = m.date.slice(0,4); if (!years.has(year)) years.set(year, []); years.get(year).push(m); });
    return (waiting.length ? '<li class="ms-year">달성 대기</li>' + waiting.map(card).join('') : '') + [...years].map(([year, records]) => '<li class="ms-year">' + esc(year) + '</li>' + records.map(card).join('')).join('');
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
  // Seed records can be annotated (saved as an override) but never deleted.
  function detail(m, {deletable = false} = {}) {
    const grade = find(GRADES, m.grade), importance = find(IMPORTANCE, m.importance);
    const actions = '<div class="ms-detail-actions"><button type="button" class="btn" data-ms-edit="' + esc(m.id) + '">수정 · 코멘트 남기기</button>' +
      (deletable ? '<button type="button" class="btn" data-ms-delete="' + esc(m.id) + '">삭제</button>' : '') + '</div>';
    return '<div class="ms-detail-top"><button type="button" class="btn ms-back" data-ms-back>← 마일스톤 목록</button>' + actions + '</div>' +
      '<header class="ms-detail-head" data-importance="' + esc(m.importance) + '"><time datetime="' + esc(m.date) + '">' + esc(dateText(m)) + '</time>' + kicker(m) +
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
      '<button type="button" class="btn ms-back" data-ms-back>← 마일스톤 목록</button>';
  }
  function homeCardMarkup(m) {
    return '<div class="ms-home-copy"><p class="ms-eyebrow">LIFE MILESTONE</p><time datetime="' + esc(m.date) + '">' + esc(dateLabel(m.date)) + '</time><h3>' + esc(m.title) + '</h3>' +
      '<ul class="ms-home-metrics">' + featured(m, 3).map(x => '<li>' + esc(compactMetric(x)) + '</li>').join('') + '</ul>' +
      '<blockquote class="ms-quote">“' + esc(m.summary) + '”</blockquote></div><button type="button" class="btn" data-ms-home-open>전체 마일스톤 보기 →</button>';
  }

  // ---- Form ----
  const option = (value, name, selected) => '<option value="' + esc(value) + '"' + (selected ? ' selected' : '') + '>' + esc(name) + '</option>';
  // The metric id rides on the row so edits keep featuredMetrics links intact.
  function metricRow(index, x = {}) {
    return '<fieldset class="ms-metric-row" data-ms-metric-row data-ms-metric-id="' + esc(x.id || '') + '"><legend>지표 ' + (index + 1) + '</legend>' +
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
  function formMarkup(today, m = null, blocked = '') {
    const people = roster(), views = navViews(), v = m || {};
    const textarea = (name, label, rows = 3) => '<label class="ms-wide">' + label + '<textarea name="' + name + '" rows="' + rows + '" maxlength="3000">' + esc(v[name] || '') + '</textarea></label>';
    return '<header class="ms-form-head"><p class="ms-eyebrow">' + (m ? 'EDIT MILESTONE' : 'NEW MILESTONE') + '</p><h3 data-ms-form-title tabindex="-1">' + (m ? '마일스톤 수정' : '새 마일스톤') + '</h3>' +
      '<p>자주 기록할 필요는 없습니다. 오래 기억하고 싶은 변화만 남겨보세요.</p>' +
      '<p class="ms-draft-note" data-ms-form-block' + (blocked ? '' : ' hidden') + '>' + esc(blocked) + '</p></header>' +
      '<div class="ms-errors" data-ms-errors role="alert" hidden></div>' +
      '<div class="ms-form-grid">' +
      '<label>날짜<input type="date" name="date" required value="' + esc(v.date || today) + '"></label>' +
      '<label class="ms-wide">제목<input name="title" required maxlength="120" value="' + esc(v.title || '') + '" placeholder="예: 첫 하프 마라톤 완주"></label>' +
      '<label>분야<select name="category">' + CATEGORIES.map(c => option(c.id, c.label, c.id === v.category)).join('') + '</select></label>' +
      '<label>중요도<select name="importance">' + IMPORTANCE.map(x => option(x.id, x.label + ' · ' + x.ko, x.id === (v.importance || 'NORMAL'))).join('') + '</select></label>' +
      '<label>난이도 등급 <small>(선택)</small><select name="grade">' + option('', '없음', !v.grade) + GRADES.map(x => option(x.id, x.label + ' · ' + x.ko + ' — ' + x.note, x.id === v.grade)).join('') + '</select></label>' +
      '<label class="ms-wide">대표 문장<input name="summary" required maxlength="160" value="' + esc(v.summary || '') + '" placeholder="이 날을 한 문장으로 남긴다면?"></label>' +
      textarea('description', '성과 설명') + textarea('background', '과정 / 배경') + textarea('meaning', '이 변화의 의미') +
      '</div>' +
      '<section class="ms-form-section"><h4>핵심 지표</h4><p class="ms-quiet">적은 그대로 보관해요. 단위도 적은 대로만 보여드려요. 이전 값이 없는 지표도 괜찮아요.</p><div data-ms-metrics></div><button type="button" class="btn sm" data-ms-metric-add>+ 지표 추가</button></section>' +
      '<section class="ms-form-section"><h4>함께한 Agent</h4><div class="ms-checks">' + people.map(p => '<label class="ms-check"><input type="checkbox" name="agents" value="' + esc(p.id) + '"' + ((v.agents || []).includes(p.id) ? ' checked' : '') + '> ' + esc(p.name) + '</label>').join('') + '</div>' +
      '<div data-ms-comments></div><button type="button" class="btn sm" data-ms-comment-add>+ Agent 코멘트 추가</button></section>' +
      '<div class="ms-form-grid">' +
      '<label class="ms-wide">회장님 코멘트 <small>(선택)</small><textarea name="chairmanComment" rows="3" maxlength="2000">' + esc(v.chairmanComment || '') + '</textarea></label>' +
      '<label class="ms-wide">다음 목표 <small>(한 줄에 하나씩)</small><textarea name="nextGoals" rows="3" maxlength="2000">' + esc((v.nextGoals || []).join('\n')) + '</textarea></label>' +
      '<label class="ms-wide">태그 <small>(쉼표로 구분)</small><input name="tags" maxlength="300" value="' + esc((v.tags || []).join(', ')) + '" placeholder="건강, 마라톤"></label>' +
      '</div>' +
      '<section class="ms-form-section"><h4>관련 HANI OS 기능</h4><div class="ms-checks">' + views.map(x => '<label class="ms-check"><input type="checkbox" name="relatedTabs" value="' + esc(x.id) + '"' + ((v.relatedTabs || []).includes(x.id) ? ' checked' : '') + '> ' + esc(x.name) + '</label>').join('') + '</div></section>' +
      '<section class="ms-form-section"><h4>사진</h4><p class="ms-quiet">사진 첨부는 보관 방식이 정해진 뒤 열릴 예정이에요. 지금은 사진 없이 기록돼요.</p></section>' +
      '<div class="ms-form-actions"><button type="submit" class="btn primary">저장하기</button><button type="button" class="btn" data-ms-form-cancel>취소</button></div>';
  }
  // base: the record being edited (keeps id, createdAt, images, source and unknown fields).
  function readForm(form, ids, base = null, now = new Date().toISOString()) {
    const value = name => form.elements[name]?.value ?? '';
    const used = new Set();
    const metrics = [...form.querySelectorAll('[data-ms-metric-row]')].map(row => {
      const field = key => row.querySelector('[data-ms-field="' + key + '"]').value.trim();
      let id = row.dataset.msMetricId || '';
      if (!id || used.has(id)) { let n = used.size + 1; while (used.has('metric-' + n)) n++; id = 'metric-' + n; }
      used.add(id);
      return {id, label:field('label'), before:field('before') || null, after:field('after'), change:field('change') || null, unit:null};
    });
    const agentComments = [...form.querySelectorAll('[data-ms-comment-row]')].map(row => ({agent:row.querySelector('[data-ms-field="agent"]').value, text:row.querySelector('[data-ms-field="text"]').value.trim()}));
    const checked = name => [...form.querySelectorAll('input[name="' + name + '"]:checked')].map(x => x.value);
    const category = value('category'), date = value('date');
    const record = {
      ...(base || {}),
      id:base?.id || nextId(category, date, ids), date, title:value('title').trim(), category, importance:value('importance'), grade:value('grade') || null,
      summary:value('summary').trim(), metrics, description:value('description').trim(), background:value('background').trim(), meaning:value('meaning').trim(),
      nextGoals:value('nextGoals').split('\n').map(x => x.trim()).filter(Boolean),
      agents:checked('agents'), agentComments, chairmanComment:value('chairmanComment').trim(),
      tags:value('tags').split(',').map(x => x.trim().replace(/^#/, '')).filter(Boolean),
      relatedTabs:checked('relatedTabs'), images:Array.isArray(base?.images) ? base.images : [], source:base?.source || 'manual',
      createdAt:base?.createdAt || now, updatedAt:now
    };
    const kept = Array.isArray(base?.featuredMetrics) ? base.featuredMetrics.filter(id => used.has(id)) : [];
    if (kept.length) record.featuredMetrics = kept; else delete record.featuredMetrics;
    return record;
  }

  // ---- Persistence: state.milestones through the existing save() owner ----
  // The list is absent until the first save, so upgrading never changes stored bytes or the Cloud hash.
  const appState = () => typeof state !== 'undefined' && state && typeof state === 'object' ? state : null;
  const savedRows = () => Array.isArray(appState()?.milestones) ? appState().milestones : [];
  const seedIds = SEED.map(x => x.id);
  // Seed defaults stay in code; a saved row with a seed id is its annotated version.
  function merged(rows = savedRows()) {
    const visible = [], hidden = [];
    for (const row of rows) {
      const others = rows.filter(x => x !== row && x?.id).map(x => x.id);
      (row && !validate(row, {ids:others}).length ? visible : hidden).push(row);
    }
    const byId = new Map(visible.map(x => [x.id, x]));
    return {items:[...SEED.map(x => byId.get(x.id) || x), ...visible.filter(x => !seedIds.includes(x.id))], hidden:hidden.length};
  }
  // Same fail-closed conditions as the lounge board: write only while Cloud sync is verified ON.
  function writeBlockReason() {
    if (typeof cloudUser === 'undefined' || !cloudUser) return '로그인 후 Cloud 동기화가 연결되면 저장할 수 있어요.';
    if (typeof loadRecovery === 'undefined' || loadRecovery.active) return '원본 보호 중에는 저장할 수 없어요.';
    if (typeof importSyncHold === 'undefined' || importSyncHold) return '가져온 백업의 동기화를 확인한 뒤 저장할 수 있어요.';
    if (typeof cloudRecoveryMode === 'undefined' || cloudRecoveryMode) return 'Cloud 복구를 마친 뒤 저장할 수 있어요.';
    if (typeof cloudAutoSyncReady === 'undefined' || cloudAutoSyncReady !== true || typeof cloudRuntime === 'undefined' || cloudRuntime?.sync !== 'ON')
      return 'Cloud 동기화가 연결됨 상태일 때 저장할 수 있어요.';
    if (typeof cloudHasMeaningfulLocalData !== 'function' || !cloudHasMeaningfulLocalData(state)) return 'Local 기록의 기준을 확인한 뒤 저장할 수 있어요.';
    if (typeof save !== 'function') return '저장 기능을 찾지 못했어요.';
    return '';
  }
  // Replace only state.milestones; on any failure the previous state object is restored untouched.
  function persist(nextRows) {
    const reason = writeBlockReason();
    if (reason) return {ok:false, message:reason};
    const before = state;
    state = {...state, milestones:nextRows, meta:{...(state.meta || {})}};
    let result;
    try { result = save(); } catch (error) { result = {ok:false, message:error?.message}; }
    if (!result?.ok) { state = before; return {ok:false, message:result?.message || '저장하지 못했어요. 기존 기록은 그대로예요.'}; }
    return {ok:true};
  }

  // ---- Runtime (persistent slots in #milestones; one delegated handler) ----
  const ui = {category:'ALL', grade:'ALL', sort:'newest', detail:null, editing:null, returnFocus:null};
  const items = () => merged().items;
  const root = () => typeof document === 'undefined' ? null : document.getElementById(VIEW);
  const slot = name => root()?.querySelector('[data-ms-' + name + ']');
  function bindAvatars(host) { host?.querySelectorAll('[data-ms-avatar]').forEach(image => { image.onerror = () => { image.hidden = true; }; if (image.complete && !image.naturalWidth) image.hidden = true; }); }
  function status(message) { const note = slot('session'); if (note) { note.hidden = !message; note.textContent = message || ''; } }
  function renderList() {
    const host = slot('list'), filters = slot('filters'), sort = slot('sort');
    if (!host) return;
    if (filters && !filters.childElementCount) filters.innerHTML = [{id:'ALL',label:'전체'}, ...CATEGORIES].map(c => '<button type="button" class="ms-chip" data-ms-filter="' + c.id + '">' + esc(c.label) + '</button>').join('');
    filters?.querySelectorAll('[data-ms-filter]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.msFilter === ui.category)));
    if (sort && !sort.options.length) sort.innerHTML = SORTS.map(s => option(s.id, s.label, s.id === ui.sort)).join('');
    const view = merged();
    const grades = slot('grades');
    if (grades) {
      if (!grades.childElementCount) grades.innerHTML = gradeFilters(view.items, ui);
      grades.querySelectorAll('[data-ms-grade]').forEach(button => {
        const key = button.dataset.msGrade;
        button.setAttribute('aria-pressed', String(key === ui.grade));
        button.querySelector('em').innerHTML = filtered(view.items, ui.category, key).length + '<span class="ms-sr">개</span>';
      });
    }
    host.innerHTML = list(view.items, ui) + (view.hidden ? '<li class="ms-empty"><p>형식을 확인할 수 없는 마일스톤 ' + view.hidden + '개는 원본 그대로 보관하고 목록에서만 숨겼어요.</p></li>' : '');
    bindAvatars(host);
  }
  function show(mode) {
    const archive = slot('archive'), detailSlot = slot('detail'), form = slot('form');
    if (archive) archive.hidden = mode === 'form';
    if (detailSlot) { detailSlot.hidden = mode !== 'detail'; if (mode !== 'detail' && detailSlot.open) detailSlot.close(); }
    if (form) form.hidden = mode !== 'form';
  }
  const isSaved = id => savedRows().some(x => x?.id === id);
  function openDetail(id, trigger) {
    const m = items().find(x => x.id === id), host = slot('detail');
    if (!m || !host) return;
    ui.detail = id;
    if (trigger?.dataset?.msOpen) ui.returnFocus = '[data-ms-open="' + id + '"]';
    host.innerHTML = detailSheet(m, {deletable:isSaved(id) && !seedIds.includes(id)}); bindAvatars(host); show('detail');
    if (!host.open) host.showModal();
    host.scrollTop = 0;
    host.querySelector('[data-ms-detail-title]')?.focus({preventScroll:true});
  }
  function back() {
    ui.detail = null; ui.editing = null; show('list');
    const target = ui.returnFocus && root()?.querySelector(ui.returnFocus);
    (target || slot('new'))?.focus({preventScroll:false});
  }
  function renumber(container, selector, legend) {
    container.querySelectorAll(selector).forEach((row, i) => {
      row.querySelector('legend').textContent = legend + ' ' + (i + 1);
      row.querySelector('[aria-label]')?.setAttribute('aria-label', legend + ' ' + (i + 1) + ' 삭제');
    });
  }
  function openForm(id = null) {
    const form = slot('form');
    if (!form) return;
    const m = id ? items().find(x => x.id === id) : null;
    ui.editing = m ? m.id : null;
    const today = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
    form.innerHTML = formMarkup(today, m, writeBlockReason());
    const metrics = form.querySelector('[data-ms-metrics]'), comments = form.querySelector('[data-ms-comments]');
    metrics.innerHTML = (m ? m.metrics : [{}]).map((x, i) => metricRow(i, x)).join('');
    if (m) comments.innerHTML = m.agentComments.map((x, i) => commentRow(i, roster(), x)).join('');
    show('form');
    form.querySelector('[data-ms-form-title]')?.focus({preventScroll:false});
  }
  function submit(form) {
    const box = form.querySelector('[data-ms-errors]');
    const fail = errors => {
      box.hidden = false; box.innerHTML = '<p>확인이 필요해요</p><ul>' + [...new Set(errors)].map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>';
      box.setAttribute('tabindex', '-1'); box.focus();
      return false;
    };
    const rows = savedRows(), base = ui.editing ? items().find(x => x.id === ui.editing) : null;
    const others = items().map(x => x.id).filter(id => id !== base?.id);
    const record = readForm(form, others, base);
    const errors = validate(record, {ids:others, views:navViews().map(x => x.id), agents:agentIds()});
    if (errors.length) return fail(errors);
    const at = rows.findIndex(x => x?.id === record.id);
    const next = at >= 0 ? rows.map((x, i) => i === at ? record : x) : [...rows, record];
    const result = persist(next);
    if (!result.ok) return fail([result.message]);
    ui.editing = null; renderList(); homeCard(); openDetail(record.id);
    status(base ? '마일스톤을 수정해 저장했어요.' : '새 마일스톤을 저장했어요.');
    return true;
  }
  async function remove(id) {
    const row = savedRows().find(x => x?.id === id);
    if (!row || seedIds.includes(id)) return false;
    const reason = writeBlockReason();
    if (reason) { status(reason); return false; }
    if (typeof confirmRecordDelete !== 'function' || !await confirmRecordDelete(row, '마일스톤')) return false;
    const result = persist(savedRows().filter(x => x !== row));
    if (!result.ok) { status(result.message); return false; }
    ui.returnFocus = null; renderList(); back(); homeCard(); status('마일스톤을 삭제했어요.');
    return true;
  }
  function homeCard() {
    const card = typeof document === 'undefined' ? null : document.querySelector('[data-milestone-home]');
    if (!card) return;
    const m = homePick(items().filter(x => !isPending(x)));
    card.hidden = !m;
    if (m) { card.innerHTML = homeCardMarkup(m); card.dataset.importance = m.importance; }
  }
  // Called from renderHome (every renderAll, including a Cloud pull) to keep projections current.
  function refresh() {
    homeCard();
    if (!root()?.classList.contains('active')) return;
    if (ui.detail && !slot('detail').hidden) { if (items().some(x => x.id === ui.detail)) openDetail(ui.detail); else back(); }
    else if (slot('form').hidden) renderList();
  }
  function enter() { if (!ui.detail && !ui.editing) { show('list'); renderList(); } }
  const seedErrors = SEED.flatMap((m, i) => validate(m, {ids:SEED.slice(0, i).map(x => x.id)}).map(e => m.id + ': ' + e));
  window.HaniMilestones = Object.freeze({enter, refresh, homeCard, validate, sorted, filtered, gradeFilters, homePick, featured, compactMetric, nextId, list, card, detail, homeCardMarkup, readForm, merged, writeBlockReason, persist,
    CATEGORIES, IMPORTANCE, GRADES, SORTS, SEED, ART, artKey, isPending, starCount, isNew, detailSheet, seedErrors});
  if (typeof document === 'undefined') return;
  function start() {
    const host = root();
    homeCard();
    document.addEventListener('click', event => {
      if (event.target.closest('[data-ms-home-open]') && typeof showView === 'function') { ui.detail = null; ui.editing = null; showView(VIEW); }
    });
    if (!host || host.dataset.msMounted) return;
    host.dataset.msMounted = 'true';
    host.style.setProperty('--ms-sheet-url', 'url("' + ART.sheet + '")');
    const dialog = slot('detail');
    dialog?.addEventListener('cancel', event => { event.preventDefault(); back(); });
    // Native dialog top layer, same backdrop-hit pattern as existing dialogs.
    dialog?.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) back();
    });
    dialog?.addEventListener('close', () => { if (ui.detail && !dialog.open) back(); });
    host.addEventListener('click', event => {
      const t = event.target;
      const grade = t.closest('[data-ms-grade]');
      if (grade) { ui.grade = ui.grade === grade.dataset.msGrade ? 'ALL' : grade.dataset.msGrade; renderList(); return; }
      const filter = t.closest('[data-ms-filter]');
      if (filter) { ui.category = filter.dataset.msFilter; renderList(); return; }
      const open = t.closest('[data-ms-open]');
      if (open) { status(''); openDetail(open.dataset.msOpen, open); return; }
      if (t.closest('[data-ms-back]')) { back(); return; }
      const go = t.closest('[data-ms-go]');
      if (go && typeof showView === 'function') { back(); showView(go.dataset.msGo); return; }
      if (t.closest('[data-ms-new]')) { ui.returnFocus = '[data-ms-new]'; openForm(); return; }
      const edit = t.closest('[data-ms-edit]');
      if (edit) { openForm(edit.dataset.msEdit); return; }
      const del = t.closest('[data-ms-delete]');
      if (del) { remove(del.dataset.msDelete); return; }
      if (t.closest('[data-ms-form-cancel]')) { if (ui.editing) { const id = ui.editing; ui.editing = null; openDetail(id); } else back(); return; }
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
