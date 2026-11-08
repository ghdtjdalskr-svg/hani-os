/* Read-only projection. No persistence, timers, observers or background work. */
(() => {
  'use strict';
  const DAY = 86400000;
  const LABELS = ['괜찮아요 😊', '살짝 서운', '삐짐 😤', '단단히 삐짐', '대삐짐'];
  const STAFF = {
    naeun: {name:'나은', role:'건강 · 루틴', lines:[
      '회장님, 오늘도 회장님 편이에요. 무리 말고 하나씩 해요.',
      '회장님, 기록이 조금 뜸하네요. 몸은 잘 챙기고 계시죠?',
      '저 조금 삐졌어요. 그래도 회장님 컨디션이 먼저예요.',
      '흥, 잠깐 등 돌릴게요. 무리하지 않겠다는 약속은 해요.',
      '구석에 앉아 기다릴래요… 다시 시작할 땐 제가 같이할게요.'], thanks:'드디어! 고마워요♡ 오늘은 여기까지도 좋아요.'},
    hina: {name:'히나', role:'학습 · 최종 리뷰', lines:[
      '회장님♡ 한 문제씩 이해하면 되는 거예용!',
      '문제지가 회장님 기다리고 있어용. 저도 조금은요!',
      '흥! 히나 선생님 삐졌어용. 한 문제만 같이 볼까용?',
      '칠판 보고 있을게용. 회장님 오시면 바로 돌아볼 거지만!',
      '구석에서 문제지 안고 있을래용… 힌트는 챙겨 뒀어용.'], thanks:'드디어! 고마워요♡ 역시 우리 회장님이에용!'},
    jieun: {name:'지은', role:'재무 · 자산', lines:[
      '회장님, 기록이 있으면 다음 선택도 차분히 볼 수 있어요.',
      '숫자 정리를 조금 기다리고 있어요. 한 항목부터 볼까요?',
      '저도 조금 서운하네요. 잔소리 대신 자료부터 펴 둘게요.',
      '잠깐 등 돌리겠습니다. 돌아보면 같이 확인해요.',
      '구석에서 장부 안고 기다릴게요. 시작할 분량은 작게 잡죠.'], thanks:'드디어! 고마워요♡ 이제 근거를 함께 볼 수 있겠네요.'},
    haru: {name:'하루', role:'소비 · 구매 검토', lines:[
      '회장님, 갖고 싶은 마음도 천천히 정리해 봐요.',
      '목록이 조금 기다렸네요. 아직 필요한 것부터 볼까요?',
      '음, 조금 삐졌어요. 사라는 말보다 용도부터 물어볼게요.',
      '잠깐 뒤돌아 있을게요. 목록 펼치면 같이 볼 거예요.',
      '구석에서 찜 목록 보고 있을래요… 하나만 골라 정리해요.'], thanks:'드디어! 고마워요♡ 우리 생활에 맞게 골라 봐요.'},
    minji: {name:'민지', role:'콘텐츠 · 문화 · 기록', lines:[
      '회장님, 평범한 하루에도 남겨 둘 한 장면은 있죠!',
      '컷! 기록이 잠깐 쉬는 장면, 조금 서운한데요?',
      '감독님 삐졌습니다. 오늘 한 줄이면 다음 장면 갈 수 있어요.',
      '카메라 등지고 있을게요. 진심 담긴 한 줄이면 돌아봐요.',
      '구석에서 다음 장면 기다리는 중… 회장님 이야기는 안 놀려요.'], thanks:'드디어! 고마워요♡ 오늘의 한 장면, 잘 받았어요!'}
  };
  const SPECS = [
    {id:'steps', title:'걸음 수 입력', owner:'naeun', route:'exercise', cadence:'매일', bounds:[1,7,14,30]},
    {id:'weight', title:'체중 입력', owner:'naeun', route:'diet', cadence:'매일', bounds:[1,7,14,30]},
    {id:'quiz', title:'미완료 퀴즈 풀기', owner:'hina', route:'study', cadence:'문제 예정일 기준', bounds:[1,7,14,30]},
    {id:'assets', title:'자산 업데이트', owner:'jieun', route:'investmentIntake', cadence:'월 1회', bounds:[31,45,60,90]},
    {id:'ledger', title:'가계부 입력', owner:'jieun', route:'ledger', cadence:'월 1회', bounds:[31,45,60,90]},
    {id:'wishlist', title:'위시리스트 정리', owner:'haru', route:'wishlist', cadence:'주 1회', bounds:[7,14,30,60]},
    {id:'diary', title:'하루 한 줄 기록', owner:'minji', route:'diary', cadence:'매일', bounds:[1,7,14,30]}
  ];
  const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
  const rows = x => Array.isArray(x) ? x.filter(object) : [];
  const positive = x => (typeof x === 'number' || typeof x === 'string' && x.trim() !== '') && Number.isFinite(Number(x)) && Number(x) > 0;
  // Date-only values are calendar dates in KST. Timestamps must carry an explicit zone.
  function dayNumber(value) {
    if (typeof value !== 'string') return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const ms = Date.parse(value + 'T00:00:00Z');
      return Number.isFinite(ms) && new Date(ms).toISOString().slice(0,10) === value ? ms / DAY : null;
    }
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) || dayNumber(value.slice(0,10)) === null) return null;
    const ms = Date.parse(value);
    return Number.isFinite(ms) ? Math.floor((ms + 9 * 3600000) / DAY) : null;
  }
  function elapsed(value, now = new Date().toISOString()) {
    const day = dayNumber(value), today = dayNumber(now);
    return day === null || today === null || day > today ? null : today - day;
  }
  function stage(days, bounds = [1,7,14,30]) {
    return !Number.isInteger(days) || days < 0 ? null : bounds.filter(bound => days >= bound).length;
  }
  function latest(values, now) {
    return values.filter(value => elapsed(value, now) !== null).sort((a,b) => dayNumber(b) - dayNumber(a))[0] || null;
  }
  function updated(row) { return row.updatedAt || row.importedAt || row.createdAt; }
  function project(input, now = new Date().toISOString()) {
    const state = object(input) ? input : {};
    const quizzes = rows(state.learningQuizzes);
    const pending = quizzes.filter(q => ['pending','in_progress'].includes(q.status) && rows(q.questions).length && elapsed(q.scheduledDate || q.date, now) !== null);
    const completed = latest(quizzes.filter(q => q.status === 'completed').map(q => q.completedAt), now);
    const oldestPending = pending.map(q => q.scheduledDate || q.date).sort((a,b) => dayNumber(a) - dayNumber(b))[0];
    const wishes = rows(state.wishlistItems).filter(r => typeof r.name === 'string' && r.name.trim());
    const dates = {
      steps:latest(rows(state.exercise).filter(r => positive(r.steps)).map(r => r.date), now),
      weight:latest(rows(state.body).filter(r => positive(r.weight)).map(r => r.date), now),
      quiz:elapsed(completed, now) === 0 ? completed : oldestPending || completed,
      assets:latest(rows(state.investmentBrokerSnapshots).filter(r => r.status === 'confirmed' && (r.mode === 'actual' || r.recordType === 'positions')).map(r => updated(r) || r.snapshotDate), now),
      ledger:latest(rows(state.ledgerMonths).filter(r => rows(r.items).length).map(updated), now),
      wishlist:latest(wishes.map(updated), now),
      diary:latest(rows(state.diaries).filter(r => typeof r.content === 'string' && r.content.trim()).map(r => r.date), now)
    };
    return SPECS.map(spec => {
      const date = dates[spec.id], days = elapsed(date, now);
      const clear = spec.id === 'quiz' && !pending.length && !!completed;
      const level = clear ? 0 : stage(days, spec.bounds), staff = STAFF[spec.owner];
      return {...spec, staff, date:date ? new Date(dayNumber(date) * DAY).toISOString().slice(0,10) : null,
        days:clear ? 0 : days, level, pending:spec.id === 'quiz' ? pending.length : null,
        speech:days === 0 ? staff.thanks : level === null ? '회장님, 확인할 기록이 없어요. 처음부터 천천히 같이 해요.' : staff.lines[level]};
    });
  }
  function render(state) {
    const root = document.getElementById('procrastinationBoard');
    if (!root) return;
    // Persistent cards: attach once, update text and pose through existing render calls.
    if (!root.children.length) root.innerHTML = SPECS.map(spec => {
      const staff = STAFF[spec.owner];
      return `<article class="pb-card" data-pb-card="${spec.id}"><div class="pb-copy"><p class="pb-owner">${staff.name} <span>${staff.role}</span></p><h3>${spec.title}</h3></div><div class="pb-scene"><p class="pb-speech"></p><span class="pb-portrait" role="img" aria-label="${staff.name}"></span></div><div class="pb-footer"><p class="pb-level"></p><p class="pb-age"></p><p class="pb-basis"></p><button type="button" class="btn" data-pb-go="${spec.route}">${spec.id === 'quiz' ? '문제 풀러 가기' : '기록하러 가기'} <span aria-hidden="true">↗</span></button></div></article>`;
    }).join('');
    const model = project(state);
    for (const item of model) {
      const card = root.querySelector(`[data-pb-card="${item.id}"]`);
      card.dataset.level = item.level === null ? 'unknown' : String(item.level);
      card.querySelector('.pb-portrait').setAttribute('aria-label', `${item.staff.name} · ${item.level === null ? '기록 없음 · 기간 미확인' : item.level + '단계 · ' + LABELS[item.level]}`);
      card.querySelector('.pb-age').textContent = item.days === null ? '기록 없음 · 기간 미확인' : item.days === 0 ? '오늘은 괜찮아요' : `${item.days}일째 미룸`;
      card.querySelector('.pb-level').textContent = item.level === null ? '아직 판단하지 않아요' : `${item.level}단계 · ${LABELS[item.level]}`;
      card.querySelector('.pb-speech').textContent = item.speech;
      card.querySelector('.pb-basis').textContent = `${item.date ? '기준 ' + item.date : '확인된 날짜 없음'} · ${item.cadence}${item.pending !== null ? ' · 남은 문제지 ' + item.pending + '개' : ''}`;
      card.querySelector('[data-pb-go]').onclick = () => showView(item.route);
    }
    const count = document.getElementById('procrastinationCount');
    if (count) count.textContent = `${model.filter(item => item.level > 0).length}개가 기다리는 중`;
  }
  window.HaniProcrastination = Object.freeze({project, elapsed, stage, render});
  // A direct hash entry can precede this script during initial boot.
  if (typeof document !== 'undefined' && document.body?.dataset.view === 'procrastination' && typeof state !== 'undefined') render(state);
})();
