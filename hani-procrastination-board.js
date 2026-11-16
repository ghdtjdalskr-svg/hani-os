/* Read-only projection. No persistence, timers, observers or background work. */
(() => {
  'use strict';
  const DAY = 86400000;
  const LABELS = ['괜찮아요 😊', '살짝 서운', '삐짐 😤', '단단히 삐짐', '대삐짐'];
  const UNKNOWN_SPEECH = '회장님, 첫 기록부터 같이 시작해요.';
  const STAFF = {
    naeun: {
      name:'나은', role:'건강 · 루틴',
      lines:[
        '회장님, 오늘도 제가 응원해요!',
        '회장님, 오늘 기록 깜빡하셨죠?',
        '저 살짝 삐졌어요. 물 한 잔 어때요?',
        '흥, 잠깐 삐진 척만 할게요!',
        '구석에서 기다릴래요… 같이 해요.'
      ],
      thanks:'드디어! 고마워요♡ 오늘도 건강해요!',
      reply:'헤헤, 지금 바로 같이 챙겨요!',
      mediation:'회장님, 나은이가 구석에서 시무룩해요…'
    },
    hina: {
      name:'히나', role:'학습 · 최종 리뷰',
      lines:[
        '회장님♡ 오늘도 차근차근 가용!',
        '문제지가 회장님 기다리고 있어용!',
        '흥! 히나 삐졌어용. 한 문제만용?',
        '칠판 보고 있을게용. 오면 봐용!',
        '구석에서 문제지 안고 있을래용…'
      ],
      thanks:'드디어! 고마워요♡ 최고예용!',
      reply:'히히, 연필 딱 깎아 둘게용!',
      mediation:'회장님, 히나가 구석에서 문제지 안고 있어요…'
    },
    jieun: {
      name:'지은', role:'재무 · 자산',
      lines:[
        '회장님, 숫자가 차분히 쌓이고 있어요.',
        '정리할 숫자가 조금 기다려요.',
        '조금 서운해요. 장부 펴 둘게요.',
        '잠깐 등 돌릴게요. 오시면 봐요.',
        '구석에서 장부 안고 기다릴게요…'
      ],
      thanks:'드디어! 고마워요♡ 든든하네요.',
      reply:'좋아요, 계산기 바로 켜 둘게요.',
      mediation:'회장님, 지은이가 장부 안고 돌아앉았어요…'
    },
    haru: {
      name:'하루', role:'소비 · 구매 검토',
      lines:[
        '회장님, 취향이 예쁘게 모이고 있어요.',
        '목록이 회장님 손길을 기다려요.',
        '음, 살짝 삐졌어요. 하나만 볼까요?',
        '잠깐 뒤돌아 있을게요. 꼭 봐요!',
        '구석에서 메모지 접고 있을래요…'
      ],
      thanks:'드디어! 고마워요♡ 딱 알맞네요.',
      reply:'와, 그럼 목록부터 펼쳐 둘게요!',
      mediation:'회장님, 하루가 메모지 만지작거리고 있어요…'
    },
    minji: {
      name:'민지', role:'콘텐츠 · 문화',
      lines:[
        '회장님, 요즘 본 작품 재미있었죠?',
        '엔딩 크레딧 후 감상이 궁금해요!',
        '컷! 책이랑 영화 기록 기다려요.',
        '카메라 덮고 삐질래요. 한 줄만요!',
        '구석에서 팝콘 식히며 기다려요…'
      ],
      thanks:'드디어! 고마워요♡ 멋진 감상이에요!',
      reply:'진짜죠?! 팝콘 들고 기다릴게요!',
      mediation:'회장님, 민지가 카메라 덮고 구석에 있어요…'
    },
    hani: {
      name:'하니', role:'전략 · 총괄',
      lines:[
        '회장님, 오늘 하루도 들려주세요♡',
        '오늘 무슨 일 있었는지 궁금해요.',
        '조금 서운하네, 한 줄만 남겨줘요.',
        '나도 잠깐 삐진 척할래요. 진짜로!',
        '구석에서 일기장 안고 기다릴게요…'
      ],
      thanks:'드디어! 고마워요♡ 오늘도 수고했어요.',
      reply:'알겠어요, 차 한 잔 내어 올게요♡',
      mediation:''
    },
    gaeun: {
      name:'가은', role:'회장 비서',
      lines:[
        '회장님, 오늘 일정이 매끄럽네요.',
        '회장님, 지난 할 일이 하나 남았어요.',
        '조금 아쉽네요. 지금 같이 볼까요?',
        '수첩 덮고 잠깐 서운해할게요…',
        '구석에서 수첩 안고 기다리고 있어요.'
      ],
      thanks:'드디어! 고마워요♡ 깔끔하게 끝났네요.',
      reply:'네, 회장님! 바로 준비해 둘게요.',
      mediation:'회장님, 가은이가 수첩 안고 기다리고 있어요…'
    },
    sooyeon: {
      name:'수연', role:'여행 · 스포츠',
      lines:[
        '회장님, 오늘도 땀 흘릴 준비 됐죠?',
        '회장님! 몸 풀 시간 살짝 지났어요!',
        '승부욕 발동! 오늘 한 판 어때요?',
        '저 삐져서 스트레칭만 하고 있을래요!',
        '트랙 구석에서 기록표 보고 있어요…'
      ],
      thanks:'드디어! 고마워요♡ 오늘 최고예요!',
      reply:'좋았어요! 지금 바로 출발해요!',
      mediation:'회장님, 수연이가 운동화 끈만 만지고 있어요…'
    },
    yoonseul: {
      name:'윤슬', role:'러닝 리서처',
      lines:[
        '회장님, 이거 아세요? 복습이 힘이에요!',
        '회장님, 이거 아세요? 오답이 기다려요.',
        '조금 서운해요. 한 문제만 다시 봐요!',
        '책갈피만 만지작거리고 있을게요…',
        '구석에서 오답노트 꼭 안고 있어요…'
      ],
      thanks:'드디어! 고마워요♡ 딱 정리됐어요!',
      reply:'와! 오답노트 바로 펼쳐 놓을게요!',
      mediation:'회장님, 윤슬이가 책갈피 꽂아두고 기다려요…'
    }
  };
  const SPECS = [
    {id:'steps', title:'걸음 수 입력', owner:'naeun', route:'exercise', cadence:'매일', bounds:[1,7,14,30]},
    {id:'weight', title:'체중 입력', owner:'naeun', route:'diet', cadence:'매일', bounds:[1,7,14,30]},
    {id:'workout', title:'운동 세션 기록', owner:'sooyeon', route:'exercise', cadence:'3일마다', bounds:[3,7,14,30]},
    {id:'quiz', title:'미완료 퀴즈 풀기', owner:'hina', route:'study', cadence:'문제 예정일 기준', bounds:[1,7,14,30]},
    {id:'wrongReview', title:'오답노트 복습', owner:'yoonseul', route:'study', cadence:'주 1회', bounds:[7,14,30,60]},
    {id:'assets', title:'자산 업데이트', owner:'jieun', route:'investmentIntake', cadence:'월 1회', bounds:[31,45,60,90]},
    {id:'ledger', title:'가계부 입력', owner:'jieun', route:'ledger', cadence:'월 1회', bounds:[31,45,60,90]},
    {id:'wishlist', title:'위시리스트 정리', owner:'haru', route:'wishlist', cadence:'주 1회', bounds:[7,14,30,60]},
    {id:'spendReview', title:'소비 후속 리뷰', owner:'haru', route:'ledger', cadence:'구매 2주 후', bounds:[14,30,45,60]},
    {id:'culture', title:'책·영화 기록', owner:'minji', route:'movie', cadence:'주 1회', bounds:[7,14,30,60]},
    {id:'tasks', title:'밀린 할 일', owner:'gaeun', route:'tasks', cadence:'마감일 기준', bounds:[1,7,14,30]},
    {id:'diary', title:'하루 한 줄 기록', owner:'hani', route:'diary', cadence:'매일', bounds:[1,7,14,30]}
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
  function oldest(values, now) {
    return values.filter(value => elapsed(value, now) !== null).sort((a,b) => dayNumber(a) - dayNumber(b))[0] || null;
  }
  function updated(row) { return row.updatedAt || row.importedAt || row.createdAt; }
  function project(input, now = new Date().toISOString()) {
    const state = object(input) ? input : {};
    const projects = rows(state.learningProjects).filter(p => typeof p.id === 'string' && p.id.trim());
    const activeProjectIds = new Set(projects.filter(p => !['paused','archived'].includes(p.status)).map(p => p.id));
    const quizzes = rows(state.learningQuizzes);
    const pendingQuizzes = quizzes.filter(q =>
      ['pending','in_progress'].includes(q.status) &&
      typeof q.projectId === 'string' && activeProjectIds.has(q.projectId) &&
      rows(q.questions).length && elapsed(q.scheduledDate || q.date, now) !== null
    );
    const completedQuiz = latest(quizzes.filter(q => q.status === 'completed').map(q => q.completedAt), now);
    const oldestQuiz = oldest(pendingQuizzes.map(q => q.scheduledDate || q.date), now);

    const wrongs = rows(state.learningWrongAnswers).filter(w => typeof w.projectId === 'string' && activeProjectIds.has(w.projectId));
    const reviewedStates = new Set(['reviewed','retry_completed','mastered']);
    const pendingWrongs = wrongs.filter(w => !reviewedStates.has(w.reviewStatus) && elapsed(w.lastWrongDate || w.firstWrongDate || updated(w), now) !== null);
    const reviewedWrong = latest(wrongs.filter(w => reviewedStates.has(w.reviewStatus)).map(w => w.lastRetryAt || w.reviewedAt || w.masteredAt || updated(w)), now);
    const oldestWrong = oldest(pendingWrongs.map(w => w.lastWrongDate || w.firstWrongDate || updated(w)), now);

    const wishes = rows(state.wishlistItems).filter(r => typeof r.name === 'string' && r.name.trim());
    const spends = rows(state.spendReviews).filter(r => typeof r.date === 'string' && dayNumber(r.date) !== null || rows(r.reviews).length);
    const pendingSpends = spends.filter(r => !rows(r.reviews).length && elapsed(r.date, now) !== null);
    const reviewedSpend = latest(spends.flatMap(r => rows(r.reviews)).map(rv => rv.date || updated(rv)), now);
    const oldestSpend = oldest(pendingSpends.map(r => r.date), now);

    const validTasks = rows(state.tasks).filter(t => typeof t.done === 'boolean' || (typeof t.text === 'string' && t.text.trim()) || elapsed(t.due || t.dueAt, now) !== null);
    const overdueTasks = validTasks.filter(t => !t.done && t.dueKnown !== false && (elapsed(t.due || t.dueAt, now) ?? 0) >= 1);
    const oldestTask = oldest(overdueTasks.map(t => t.due || t.dueAt), now);

    const bookDates = rows(state.books).filter(r => r.title === undefined || (typeof r.title === 'string' && r.title.trim())).map(r => r.completedDate || r.readDate || updated(r));
    const movieDates = rows(state.movies).filter(r => r.title === undefined || (typeof r.title === 'string' && r.title.trim())).map(r => r.watchedDate || updated(r));

    const dates = {
      steps: latest(rows(state.exercise).filter(r => positive(r.steps)).map(r => r.date), now),
      weight: latest(rows(state.body).filter(r => positive(r.weight)).map(r => r.date), now),
      workout: latest([...rows(state.exercise).filter(r => r.strength === true).map(r => r.date), ...rows(state.strength).map(r => r.date)], now),
      quiz: elapsed(completedQuiz, now) === 0 ? completedQuiz : oldestQuiz || completedQuiz,
      wrongReview: elapsed(reviewedWrong, now) === 0 ? reviewedWrong : oldestWrong || reviewedWrong,
      assets: latest(rows(state.investmentBrokerSnapshots).filter(r => r.status === 'confirmed' && (r.mode === 'actual' || r.recordType === 'positions')).map(r => updated(r) || r.snapshotDate), now),
      ledger: latest(rows(state.ledgerMonths).filter(r => rows(r.items).length).map(updated), now),
      wishlist: latest(wishes.map(updated), now),
      spendReview: elapsed(reviewedSpend, now) === 0 ? reviewedSpend : oldestSpend || reviewedSpend,
      culture: latest([...bookDates, ...movieDates], now),
      tasks: oldestTask,
      diary: latest(rows(state.diaries).filter(r => typeof r.content === 'string' && r.content.trim()).map(r => r.date), now)
    };
    const clears = {
      quiz: !pendingQuizzes.length && !!completedQuiz,
      wrongReview: !pendingWrongs.length && wrongs.some(w => reviewedStates.has(w.reviewStatus)),
      spendReview: !pendingSpends.length && spends.some(r => rows(r.reviews).length > 0),
      tasks: !overdueTasks.length && validTasks.length > 0
    };
    const thanksToday = {
      quiz: elapsed(completedQuiz, now) === 0,
      wrongReview: elapsed(reviewedWrong, now) === 0,
      spendReview: elapsed(reviewedSpend, now) === 0,
      tasks: false
    };
    const pendingCounts = {
      quiz: pendingQuizzes.length,
      wrongReview: pendingWrongs.length,
      spendReview: pendingSpends.length,
      tasks: overdueTasks.length
    };

    return SPECS.map(spec => {
      const date = dates[spec.id], rawDays = elapsed(date, now);
      const clear = !!clears[spec.id];
      const level = clear ? 0 : stage(rawDays, spec.bounds), staff = STAFF[spec.owner];
      const days = clear ? 0 : rawDays;
      const pending = Object.prototype.hasOwnProperty.call(pendingCounts, spec.id) ? pendingCounts[spec.id] : null;
      const celebrated = Object.prototype.hasOwnProperty.call(thanksToday, spec.id) ? thanksToday[spec.id] : rawDays === 0;
      const speech = celebrated ? staff.thanks : level === null ? UNKNOWN_SPEECH : staff.lines[level];
      const mediation = Number.isInteger(level) && level >= 3 && spec.owner !== 'hani' ? staff.mediation : null;
      return {
        ...spec, staff,
        date: date ? new Date(dayNumber(date) * DAY).toISOString().slice(0,10) : null,
        days, level, pending, speech, mediation
      };
    });
  }
  function basisSuffix(item) {
    if (item.id === 'quiz' && item.pending !== null) return ` · 남은 문제지 ${item.pending}개`;
    if (item.id === 'wrongReview' && item.pending) return ` · 복습 대기 ${item.pending}개`;
    if (item.id === 'spendReview' && item.pending) return ` · 리뷰 대기 ${item.pending}건`;
    if (item.id === 'tasks' && item.pending) return ` · 마감 지난 일 ${item.pending}개`;
    return '';
  }
  function render(state) {
    const root = document.getElementById('procrastinationBoard');
    if (!root) return;
    // Persistent cards: attach once, update text and pose through existing render calls.
    if (!root.children.length) root.innerHTML = SPECS.map(spec => {
      const staff = STAFF[spec.owner];
      return `<article class="pb-card" data-pb-card="${spec.id}"><div class="pb-copy"><p class="pb-owner">${staff.name} <span>${staff.role}</span></p><h3>${spec.title}</h3></div><div class="pb-scene"><div class="pb-bubble-wrap"><span class="pb-nametag">${staff.name}</span><p class="pb-speech"></p></div><span class="pb-portrait" role="img" aria-label="${staff.name}"></span><div class="pb-mediation" hidden><span class="pb-mediation-tag">하니 전무</span><p class="pb-mediation-text"></p></div></div><div class="pb-footer"><p class="pb-level"></p><p class="pb-age"></p><p class="pb-basis"></p><div class="pb-actions"><button type="button" class="btn pb-reply-btn" data-pb-reply="${spec.id}">미안해, 지금 할게! 🐸</button><button type="button" class="btn" data-pb-go="${spec.route}">${spec.id === 'quiz' ? '문제 풀러 가기' : '기록하러 가기'} <span aria-hidden="true">↗</span></button></div></div></article>`;
    }).join('');
    const model = project(state);
    for (const item of model) {
      const card = root.querySelector(`[data-pb-card="${item.id}"]`);
      card.dataset.level = item.level === null ? 'unknown' : String(item.level);
      card.dataset.owner = item.owner;
      delete card.dataset.replied;
      card.querySelector('.pb-portrait').setAttribute('aria-label', `${item.staff.name} · ${item.level === null ? '기록 없음 · 기간 미확인' : item.level + '단계 · ' + LABELS[item.level]}`);
      card.querySelector('.pb-age').textContent = item.days === null ? '기록 없음 · 기간 미확인' : item.days === 0 ? '오늘은 괜찮아요' : `${item.days}일째 미룸`;
      card.querySelector('.pb-level').textContent = item.level === null ? '아직 판단하지 않아요' : `${item.level}단계 · ${LABELS[item.level]}`;
      const speechEl = card.querySelector('.pb-speech');
      speechEl.textContent = item.speech;
      const mediationSlot = card.querySelector('.pb-mediation');
      mediationSlot.hidden = !item.mediation;
      card.querySelector('.pb-mediation-text').textContent = item.mediation || '';
      card.querySelector('.pb-basis').textContent = `${item.date ? '기준 ' + item.date : '확인된 날짜 없음'} · ${item.cadence}${basisSuffix(item)}`;
      card.querySelector('[data-pb-go]').onclick = () => showView(item.route);
      card.querySelector('[data-pb-reply]').onclick = () => {
        if (card.dataset.replied === 'true') return;
        card.dataset.replied = 'true';
        speechEl.textContent = item.staff.reply;
        setTimeout(() => {
          delete card.dataset.replied;
          showView(item.route);
        }, 480);
      };
    }
    const count = document.getElementById('procrastinationCount');
    if (count) count.textContent = `${model.filter(item => item.level > 0).length}개가 기다리는 중`;
  }
  window.HaniProcrastination = Object.freeze({project, elapsed, stage, render});
  // A direct hash entry can precede this script during initial boot.
  if (typeof document !== 'undefined' && document.body?.dataset.view === 'procrastination' && typeof state !== 'undefined') render(state);
})();
