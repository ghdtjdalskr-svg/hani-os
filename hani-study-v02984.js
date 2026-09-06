/* =========================================================
   HANI OS v2.9.84 · Learning Engine MVP
   Backward-compatible state extension only.
   - learningProjects
   - learningQuizzes
   - learningWrongAnswers
   Uses existing commit()/Cloud sync path.
   Quiz generation is delegated to authenticated read-only
   Supabase Edge Function: hani-learning-quiz.
   ========================================================= */
(() => {
  'use strict';

  const PATCH_ID = 'HANI_STUDY_V02984';
  const STYLE_ID = 'hani-study-v02984-style';
  const VERSION = '2.9.84';
  if (window[PATCH_ID]) return;
  window[PATCH_ID] = true;

  const q = (sel, root = document) => root?.querySelector?.(sel) || null;
  const qa = (sel, root = document) => root?.querySelectorAll ? Array.from(root.querySelectorAll(sel)) : [];
  const safe = (v) => String(v ?? '').replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const localToday = () => {
    try { return typeof today === 'function' ? today() : new Date().toLocaleDateString('en-CA'); }
    catch (_) { return new Date().toLocaleDateString('en-CA'); }
  };
  const makeId = () => {
    try { return typeof uid === 'function' ? uid() : crypto.randomUUID(); }
    catch (_) { return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`; }
  };
  const nowIso = () => new Date().toISOString();

  let activeProjectId = '';
  let activeQuizId = '';
  let busy = false;

  function ensureLearningState(target = state) {
    if (!target || typeof target !== 'object') return target;
    if (!Array.isArray(target.learningProjects)) target.learningProjects = [];
    if (!Array.isArray(target.learningQuizzes)) target.learningQuizzes = [];
    if (!Array.isArray(target.learningWrongAnswers)) target.learningWrongAnswers = [];
    return target;
  }

  function normalizeProject(raw = {}) {
    const ts = nowIso();
    return {
      id: String(raw.id || makeId()),
      name: String(raw.name || '').trim(),
      category: String(raw.category || 'other'),
      goal: String(raw.goal || '').trim(),
      targetDate: String(raw.targetDate || ''),
      status: raw.status === 'archived' ? 'archived' : 'active',
      createdAt: String(raw.createdAt || ts),
      updatedAt: String(raw.updatedAt || raw.createdAt || ts),
    };
  }

  function normalizeQuestion(raw = {}, index = 0) {
    const choices = Array.isArray(raw.choices) ? raw.choices.map(x => String(x ?? '').trim()).filter(Boolean).slice(0, 4) : [];
    const answerIndex = Number(raw.answer_index ?? raw.answerIndex);
    return {
      id: String(raw.id || `q${index + 1}`),
      type: String(raw.type || raw.topic || 'general').trim().slice(0, 80),
      topic: String(raw.topic || raw.type || '').trim().slice(0, 100),
      difficulty: ['easy','medium','hard'].includes(String(raw.difficulty || '').toLowerCase()) ? String(raw.difficulty).toLowerCase() : 'medium',
      prompt: String(raw.prompt || raw.question || '').trim().slice(0, 1200),
      choices,
      answerIndex: Number.isInteger(answerIndex) && answerIndex >= 0 && answerIndex <= 3 ? answerIndex : -1,
      explanation: String(raw.explanation || '').trim().slice(0, 1600),
    };
  }

  function normalizeQuiz(raw = {}) {
    const questions = Array.isArray(raw.questions) ? raw.questions.slice(0, 5).map(normalizeQuestion) : [];
    const answers = Array.isArray(raw.answers) ? raw.answers.slice(0, 5).map(v => v !== null && v !== '' && Number.isInteger(Number(v)) && Number(v) >= 0 && Number(v) <= 3 ? Number(v) : null) : [];
    while (answers.length < questions.length) answers.push(null);
    return {
      id: String(raw.id || makeId()),
      projectId: String(raw.projectId || ''),
      date: String(raw.date || localToday()),
      status: raw.status === 'completed' ? 'completed' : 'pending',
      questions,
      answers,
      score: Number.isFinite(Number(raw.score)) ? Number(raw.score) : null,
      completedAt: String(raw.completedAt || ''),
      createdAt: String(raw.createdAt || nowIso()),
      updatedAt: String(raw.updatedAt || raw.createdAt || nowIso()),
    };
  }

  function projectById(id) { return (state.learningProjects || []).find(x => x.id === id) || null; }
  function quizById(id) { return (state.learningQuizzes || []).find(x => x.id === id) || null; }
  function projectQuizzes(id) { return (state.learningQuizzes || []).filter(x => x.projectId === id).sort((a,b) => String(b.date).localeCompare(String(a.date)) || String(b.createdAt).localeCompare(String(a.createdAt))); }
  function activeProjects() { return (state.learningProjects || []).filter(x => x.status !== 'archived').sort((a,b) => String(a.createdAt).localeCompare(String(b.createdAt))); }
  function projectLabel(p) { return p?.name || '학습 프로젝트'; }

  function questionKey(projectId, question) {
    const src = `${projectId}|${String(question?.type || '').trim().toLowerCase()}|${String(question?.prompt || '').trim().toLowerCase().replace(/\s+/g, ' ')}`;
    let h = 2166136261;
    for (let i = 0; i < src.length; i++) { h ^= src.charCodeAt(i); h = Math.imul(h, 16777619); }
    return `lq-${(h >>> 0).toString(16).padStart(8, '0')}`;
  }

  function recentWeaknesses(projectId) {
    return (state.learningWrongAnswers || [])
      .filter(x => x.projectId === projectId && x.reviewStatus !== 'mastered')
      .sort((a,b) => Number(b.wrongCount || 0) - Number(a.wrongCount || 0) || String(b.lastWrongDate || '').localeCompare(String(a.lastWrongDate || '')))
      .slice(0, 12)
      .map(x => ({ type: x.type || 'general', topic: x.topic || '', wrong_count: Number(x.wrongCount || 1), question: String(x.question || '').slice(0, 260) }));
  }

  function learningCommit(message, notify = true) {
    ensureLearningState();
    if (typeof commit !== 'function') throw new Error('HANI OS 저장 함수를 찾지 못했습니다.');
    return commit(message, notify);
  }

  function cloneLearningValue(value) {
    return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
  }

  function restoreLearningObject(target, snapshot) {
    Object.keys(target).forEach(key => delete target[key]);
    Object.assign(target, snapshot);
  }

  function persistNewProject(row) {
    const previousProjectId = activeProjectId, previousQuizId = activeQuizId;
    state.learningProjects.push(row);
    activeProjectId = row.id;
    activeQuizId = '';
    try {
      if (learningCommit(`학습 프로젝트 ‘${row.name}’을 시작했습니다.`)) return true;
    } catch (error) {
      console.error('[HANI Learning] project save failed', error);
    }
    const index = state.learningProjects.indexOf(row);
    if (index >= 0) state.learningProjects.splice(index, 1);
    activeProjectId = previousProjectId;
    activeQuizId = previousQuizId;
    return false;
  }

  function persistGeneratedQuiz(project, quiz) {
    const previousQuizId = activeQuizId;
    state.learningQuizzes.push(quiz);
    activeQuizId = quiz.id;
    try {
      if (learningCommit(`${project.name} 오늘의 퀴즈 5문제를 생성했습니다.`)) return true;
    } catch (error) {
      console.error('[HANI Learning] quiz save failed', error);
    }
    const index = state.learningQuizzes.indexOf(quiz);
    if (index >= 0) state.learningQuizzes.splice(index, 1);
    activeQuizId = previousQuizId;
    return false;
  }

  function persistQuizAnswer(quiz, questionIndex, value) {
    const previousAnswer = quiz.answers[questionIndex], previousUpdatedAt = quiz.updatedAt;
    quiz.answers[questionIndex] = value;
    quiz.updatedAt = nowIso();
    try {
      const result = typeof save === 'function' ? save() : null;
      if (result?.ok === true) return true;
    } catch (error) {
      console.error('[HANI Learning] answer save failed', error);
    }
    quiz.answers[questionIndex] = previousAnswer;
    quiz.updatedAt = previousUpdatedAt;
    return false;
  }

  async function quizApi(project) {
    if (!cloudClient || !cloudUser) throw new Error('퀴즈 생성은 HANI OS Cloud 로그인 후 사용할 수 있어요.');
    const cfg = cloudConfig();
    const { data: { session }, error } = await cloudClient.auth.getSession();
    if (error) throw error;
    if (!session?.access_token) throw new Error('로그인 세션을 확인하지 못했습니다.');
    const res = await fetch(`${cfg.url}/functions/v1/hani-learning-quiz`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': cfg.key,
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        local_date: localToday(),
        project: {
          id: project.id,
          name: project.name,
          category: project.category,
          goal: project.goal,
          target_date: project.targetDate,
        },
        weaknesses: recentWeaknesses(project.id),
      }),
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok || result?.ok === false) throw new Error(result?.message || result?.error || `퀴즈 생성 실패 (${res.status})`);
    const questions = Array.isArray(result?.quiz?.questions) ? result.quiz.questions.map(normalizeQuestion) : [];
    if (questions.length !== 5) throw new Error(`퀴즈 생성 결과가 5문제가 아닙니다. (${questions.length}문제)`);
    for (const [i, question] of questions.entries()) {
      if (!question.prompt || question.choices.length !== 4 || question.answerIndex < 0 || !question.explanation) {
        throw new Error(`${i + 1}번 문제 구조가 불완전해 저장을 중단했습니다.`);
      }
    }
    return questions;
  }

  function style() {
    if (q(`#${STYLE_ID}`)) return;
    const el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = `
#study.hani-study-v02984{--study:#6d5bd0;--study-soft:#f2efff;--study-line:#ded8ff}
#study .study-engine-grid{display:grid;grid-template-columns:minmax(250px,.78fr) minmax(0,1.72fr);gap:16px;align-items:start}
#study .study-hero-v02984{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:16px;padding:18px 20px;border:1px solid var(--study-line);border-radius:20px;background:linear-gradient(135deg,#fbfaff,#f0edff)}
#study .study-hero-v02984 h2{margin:3px 0 4px;font-size:22px}.study-kicker{font-size:11px;font-weight:900;letter-spacing:.12em;color:var(--study);text-transform:uppercase}
#study .study-hero-meta{display:flex;gap:8px;flex-wrap:wrap}.study-chip{border:1px solid var(--study-line);background:#fff;border-radius:999px;padding:7px 10px;font-size:12px;font-weight:800;color:#514a78}
#study .study-card-v02984{background:#fff;border:1px solid #e8e9f1;border-radius:18px;padding:16px;box-shadow:0 5px 18px rgba(40,35,80,.035)}
#study .study-card-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:12px}.study-card-head h3{margin:0;font-size:16px}
#study .study-project-list{display:grid;gap:9px}.study-project-row{width:100%;text-align:left;border:1px solid #e8e7f2;background:#fff;border-radius:14px;padding:12px;cursor:pointer}.study-project-row.is-active{border-color:#9f91ef;background:var(--study-soft);box-shadow:0 0 0 2px rgba(109,91,208,.08)}
#study .study-project-row b{display:block;font-size:14px}.study-project-row span{display:block;margin-top:3px;font-size:11px;color:#77778a}.study-project-row .study-progress-line{margin-top:8px;display:flex;gap:6px;align-items:center}.study-progress-line i{height:6px;flex:1;background:#ecebf4;border-radius:99px;overflow:hidden}.study-progress-line i:after{content:"";display:block;width:var(--p,0%);height:100%;background:var(--study);border-radius:99px}
#study .study-empty{padding:20px 10px;text-align:center;color:#858398;font-size:13px}.study-actions-row{display:flex;gap:8px;flex-wrap:wrap}.study-actions-row button{min-height:38px}
#study .study-project-form{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}.study-project-form .span2{grid-column:1/-1}.study-project-form label{display:block;font-size:11px;font-weight:800;color:#67657c;margin-bottom:5px}.study-project-form input,.study-project-form select{width:100%;box-sizing:border-box;min-height:38px;border:1px solid #dddde8;border-radius:10px;padding:8px 10px;background:#fff}
#study .study-main-empty{display:grid;place-items:center;min-height:320px;text-align:center;color:#7b798e}.study-main-empty b{display:block;color:#343248;font-size:18px;margin-bottom:7px}
#study .study-today-card{border:1px solid var(--study-line);background:linear-gradient(180deg,#fff,#fcfbff)}.study-today-top{display:flex;justify-content:space-between;gap:12px;align-items:center}.study-today-title b{display:block;font-size:18px}.study-today-title span{font-size:12px;color:#77758b}.study-score{font-weight:1000;font-size:24px;color:var(--study)}
#study .study-quiz-list{display:grid;gap:8px;margin-top:12px}.study-quiz-row{display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid #ecebf3;border-radius:12px;padding:10px 12px;background:#fff;cursor:pointer}.study-quiz-row.is-active{border-color:#aa9ff0;background:#f8f6ff}.study-quiz-row b{font-size:13px}.study-quiz-row span{font-size:11px;color:#7f7c90}.study-status{font-size:11px;font-weight:900;border-radius:999px;padding:5px 8px;background:#f0f1f5;color:#55586a}.study-status.pending{background:#fff3db;color:#9c6500}.study-status.completed{background:#e9f8ef;color:#16814c}
#study .study-question{border:1px solid #e8e6f2;border-radius:15px;padding:14px;margin-top:11px;background:#fff}.study-question-head{display:flex;gap:7px;align-items:center;margin-bottom:8px}.study-question-head span{font-size:10px;font-weight:900;border-radius:99px;background:#f2efff;color:#5d4eb2;padding:4px 7px}.study-question h4{font-size:14px;line-height:1.55;margin:0 0 10px}.study-choices{display:grid;gap:7px}.study-choice{display:flex;align-items:flex-start;gap:8px;border:1px solid #e5e5ed;border-radius:11px;padding:9px 10px;cursor:pointer}.study-choice:hover{border-color:#afa4ea}.study-choice input{margin-top:2px}.study-question.is-graded .study-choice.is-correct{border-color:#5ec58b;background:#edf9f2}.study-question.is-graded .study-choice.is-wrong{border-color:#ee8c8c;background:#fff1f1}.study-explanation{margin-top:10px;padding:10px 11px;background:#f7f7fb;border-radius:10px;font-size:12px;line-height:1.5;color:#555568}.study-explanation b{color:#40396d}
#study .study-submit-wrap{position:sticky;bottom:12px;z-index:3;margin-top:14px;padding:11px;border:1px solid #e3dffd;border-radius:14px;background:rgba(255,255,255,.94);backdrop-filter:blur(8px);display:flex;justify-content:space-between;gap:10px;align-items:center}.study-submit-wrap .sub{font-size:11px;color:#77758a}
#study .study-wrong-list{display:grid;gap:8px;margin-top:10px}.study-wrong-row{border:1px solid #ecebf3;border-radius:12px;padding:10px 12px}.study-wrong-row b{font-size:12px}.study-wrong-row p{font-size:11px;color:#727083;margin:4px 0 0;line-height:1.45}.study-wrong-meta{display:flex;gap:6px;flex-wrap:wrap;margin-top:7px}.study-wrong-meta span{font-size:10px;padding:4px 6px;background:#f5f4fa;border-radius:99px;color:#66637a}
#study .study-quick-note{margin-top:16px}
.home-task-mini-item.learning-derived{cursor:pointer;border-left:3px solid #8b78e8;padding-left:9px}.home-task-mini-item.learning-derived>i{background:#8b78e8!important}.home-task-mini-item.learning-derived b:before{content:"📚 ";}
@media(max-width:800px){#study .study-engine-grid{grid-template-columns:1fr}#study .study-hero-v02984{align-items:flex-start;flex-direction:column}#study .study-project-form{grid-template-columns:1fr}#study .study-project-form .span2{grid-column:auto}#study .study-card-v02984{padding:13px}#study .study-submit-wrap{bottom:8px}#study .study-question{padding:12px}.study-hero-meta{width:100%}.study-chip{flex:1;text-align:center}}
`;
    document.head.appendChild(el);
  }

  function injectStudyShell() {
    const root = q('#study');
    if (!root) return;
    root.classList.add('hani-study-v02984');
    if (q('#studyEngineV02984', root)) return;
    root.innerHTML = `
      <div id="studyEngineV02984">
        <div class="study-hero-v02984">
          <div><div class="study-kicker">HINA · LEARNING ENGINE MVP</div><h2>공부</h2><div class="note">프로젝트를 만들고, 매일 5문제씩 풀고, 틀린 문제는 자동으로 오답 자산으로 남겨요.</div></div>
          <div class="study-hero-meta"><span class="study-chip" id="studyProjectCount">프로젝트 0</span><span class="study-chip" id="studyQuizCount">퀴즈 0</span><span class="study-chip" id="studyWrongCount">오답 0</span></div>
        </div>
        <div class="study-engine-grid">
          <div>
            <div class="study-card-v02984">
              <div class="study-card-head"><h3>학습 프로젝트</h3><button class="btn sm primary" type="button" id="studyProjectNew">+ 추가</button></div>
              <div class="study-project-list" id="studyProjectList"></div>
              <div class="study-project-form" id="studyProjectForm" hidden>
                <div class="span2"><label>프로젝트 이름</label><input id="studyProjectName" placeholder="예: JLPT N3"></div>
                <div><label>분류</label><select id="studyProjectCategory"><option value="jlpt">JLPT</option><option value="certificate">자격증</option><option value="university">대학교</option><option value="ai">AI/실무</option><option value="other">기타</option></select></div>
                <div><label>목표일 · 선택</label><input id="studyProjectTargetDate" type="date"></div>
                <div class="span2"><label>목표 / 범위</label><input id="studyProjectGoal" placeholder="예: 12월 JLPT N3 합격 · 어휘/문법/독해 중심"></div>
                <div class="span2 study-actions-row"><button class="btn primary" type="button" id="studyProjectSave">프로젝트 저장</button><button class="btn" type="button" id="studyProjectPreset">JLPT N3 빠른 시작</button><button class="btn ghost" type="button" id="studyProjectCancel">취소</button></div>
              </div>
            </div>
            <div class="study-card-v02984 study-quick-note">
              <div class="study-card-head"><h3>빠른 메모</h3><span class="study-status">기존 메모 유지</span></div>
              <textarea class="page-note" placeholder="오늘 공부한 내용과 다음 학습 계획을 기록하세요."></textarea>
              <div class="study-actions-row" style="margin-top:10px"><button class="btn primary save-note" type="button">메모 저장</button></div>
            </div>
          </div>
          <div id="studyMainPanel"></div>
        </div>
      </div>`;
  }

  function projectProgress(project) {
    const quizzes = projectQuizzes(project.id);
    const completed = quizzes.filter(x => x.status === 'completed').length;
    const total = quizzes.length;
    const avg = completed ? Math.round(quizzes.filter(x => x.status === 'completed').reduce((s,x) => s + Number(x.score || 0), 0) / completed) : 0;
    return { completed, total, avg };
  }

  function renderProjectList() {
    const box = q('#studyProjectList');
    if (!box) return;
    const projects = activeProjects();
    if (!activeProjectId || !projectById(activeProjectId) || projectById(activeProjectId)?.status === 'archived') activeProjectId = projects[0]?.id || '';
    box.innerHTML = projects.length ? projects.map(p => {
      const s = projectProgress(p), pct = s.total ? Math.round(s.completed / s.total * 100) : 0;
      return `<button class="study-project-row ${p.id === activeProjectId ? 'is-active' : ''}" type="button" data-study-project="${safe(p.id)}"><b>${safe(p.name)}</b><span>${safe(({jlpt:'JLPT',certificate:'자격증',university:'대학교',ai:'AI/실무',other:'기타'}[p.category] || '기타'))}${p.targetDate ? ` · 목표 ${safe(p.targetDate)}` : ''}</span><div class="study-progress-line"><i style="--p:${pct}%"></i><span>${s.completed}/${s.total} · 평균 ${s.avg}점</span></div></button>`;
    }).join('') : `<div class="study-empty"><b>첫 학습 프로젝트를 만들어보세요.</b><br>JLPT N3부터 바로 시작할 수 있어요.</div>`;
    qa('[data-study-project]', box).forEach(btn => btn.onclick = () => { activeProjectId = btn.dataset.studyProject || ''; activeQuizId = ''; renderLearning(); });
  }

  function renderWrongAnswers(project) {
    const rows = (state.learningWrongAnswers || []).filter(x => x.projectId === project.id && x.reviewStatus !== 'mastered').sort((a,b) => Number(b.wrongCount || 0) - Number(a.wrongCount || 0) || String(b.lastWrongDate || '').localeCompare(String(a.lastWrongDate || ''))).slice(0, 8);
    if (!rows.length) return '<div class="study-empty">아직 오답이 없어요. 첫 퀴즈부터 시작해볼까요?</div>';
    return `<div class="study-wrong-list">${rows.map(x => `<div class="study-wrong-row"><b>${safe(x.question)}</b><p>${safe(x.explanation || '')}</p><div class="study-wrong-meta"><span>${safe(x.type || 'general')}</span><span>오답 ${Number(x.wrongCount || 1)}회</span><span>최근 ${safe(x.lastWrongDate || x.firstWrongDate || '')}</span></div></div>`).join('')}</div>`;
  }

  function selectQuiz(id) { activeQuizId = id; renderLearning(); requestAnimationFrame(() => q('#studyQuizDetail')?.scrollIntoView({behavior:'smooth', block:'start'})); }

  function quizStatusLabel(quiz) { return quiz.status === 'completed' ? `${Number(quiz.score || 0)}점` : `${quiz.answers.filter(x => Number.isInteger(x)).length}/5 풀이`; }

  function renderQuizDetail(project, quiz) {
    if (!quiz) return '';
    const graded = quiz.status === 'completed';
    return `<div class="study-card-v02984" id="studyQuizDetail" style="margin-top:16px">
      <div class="study-card-head"><div><h3>${safe(quiz.date)} · ${graded ? '채점 완료' : '퀴즈 풀이'}</h3><div class="note">${graded ? `점수 ${Number(quiz.score || 0)}점 · 해설과 오답을 확인하세요.` : '답을 고른 뒤 제출하면 바로 채점하고 오답노트에 누적합니다.'}</div></div><span class="study-status ${graded ? 'completed' : 'pending'}">${safe(quizStatusLabel(quiz))}</span></div>
      ${quiz.questions.map((question, qi) => {
        const selected = quiz.answers[qi];
        return `<article class="study-question ${graded ? 'is-graded' : ''}" data-study-question="${qi}"><div class="study-question-head"><span>Q${qi + 1}</span><span>${safe(question.type || 'general')}</span><span>${safe(question.difficulty || 'medium')}</span></div><h4>${safe(question.prompt)}</h4><div class="study-choices">${question.choices.map((choice, ci) => {
          const correct = graded && ci === question.answerIndex, wrong = graded && ci === selected && ci !== question.answerIndex;
          return `<label class="study-choice ${correct ? 'is-correct' : wrong ? 'is-wrong' : ''}"><input type="radio" name="study-q-${safe(quiz.id)}-${qi}" value="${ci}" ${selected === ci ? 'checked' : ''} ${graded ? 'disabled' : ''}><span>${ci + 1}. ${safe(choice)}</span></label>`;
        }).join('')}</div>${graded ? `<div class="study-explanation"><b>정답 ${question.answerIndex + 1}번</b> · ${safe(question.explanation)}</div>` : ''}</article>`;
      }).join('')}
      ${graded ? '' : `<div class="study-submit-wrap"><div><b>답안 ${quiz.answers.filter(x => Number.isInteger(x)).length}/5</b><div class="sub">모든 답은 선택 즉시 임시 저장됩니다.</div></div><button class="btn primary" type="button" id="studyQuizSubmit" ${quiz.answers.filter(x => Number.isInteger(x)).length !== 5 ? 'disabled' : ''}>채점하기</button></div>`}
    </div>`;
  }

  function renderMain() {
    const main = q('#studyMainPanel');
    if (!main) return;
    const project = projectById(activeProjectId);
    if (!project) {
      main.innerHTML = `<div class="study-card-v02984 study-main-empty"><div><b>학습 프로젝트를 선택해 주세요.</b><span>왼쪽에서 프로젝트를 만들면 Daily Quiz가 시작됩니다.</span></div></div>`;
      return;
    }
    const date = localToday(), quizzes = projectQuizzes(project.id), todayQuiz = quizzes.find(x => x.date === date), pending = quizzes.filter(x => x.status !== 'completed'), completed = quizzes.filter(x => x.status === 'completed');
    if (!activeQuizId || !quizById(activeQuizId) || quizById(activeQuizId)?.projectId !== project.id) activeQuizId = todayQuiz?.id || pending[0]?.id || quizzes[0]?.id || '';
    const activeQuiz = quizById(activeQuizId);
    main.innerHTML = `
      <div class="study-card-v02984 study-today-card">
        <div class="study-today-top"><div class="study-today-title"><span>${safe(project.category.toUpperCase())} · ${safe(date)}</span><b>${safe(project.name)} · 오늘의 5문제</b></div>${todayQuiz?.status === 'completed' ? `<div class="study-score">${Number(todayQuiz.score || 0)}점</div>` : `<button class="btn primary" id="studyGenerateQuiz" type="button" ${busy ? 'disabled' : ''}>${todayQuiz ? '오늘 퀴즈 열기' : busy ? '생성 중…' : '오늘 퀴즈 생성'}</button>`}</div>
        <div class="note" style="margin-top:8px">${safe(project.goal || '목표를 등록하면 문제 생성에 반영합니다.')}${pending.filter(x => x.date < date).length ? ` · 지난 미완료 ${pending.filter(x => x.date < date).length}개` : ''}</div>
      </div>
      <div class="study-card-v02984" style="margin-top:16px">
        <div class="study-card-head"><h3>퀴즈 아카이브</h3><span class="study-status">완료 ${completed.length} · 미완료 ${pending.length}</span></div>
        <div class="study-quiz-list">${quizzes.length ? quizzes.slice(0, 20).map(x => `<div class="study-quiz-row ${x.id === activeQuizId ? 'is-active' : ''}" data-study-quiz="${safe(x.id)}"><div><b>${safe(x.date)} · ${x.status === 'completed' ? '채점 완료' : '미완료'}</b><span>${x.status === 'completed' ? ` ${Number(x.score || 0)}점` : ` ${x.answers.filter(v => Number.isInteger(v)).length}/5 풀이`}</span></div><span class="study-status ${x.status === 'completed' ? 'completed' : 'pending'}">${safe(quizStatusLabel(x))}</span></div>`).join('') : '<div class="study-empty">아직 퀴즈가 없습니다. 오늘의 5문제를 만들어보세요.</div>'}</div>
      </div>
      ${renderQuizDetail(project, activeQuiz)}
      <div class="study-card-v02984" style="margin-top:16px"><div class="study-card-head"><h3>오답 노트</h3><span class="study-status">약점 자동 누적</span></div>${renderWrongAnswers(project)}</div>`;

    q('#studyGenerateQuiz')?.addEventListener('click', () => todayQuiz ? selectQuiz(todayQuiz.id) : generateTodayQuiz(project));
    qa('[data-study-quiz]', main).forEach(el => el.onclick = () => selectQuiz(el.dataset.studyQuiz || ''));
    if (activeQuiz && activeQuiz.status !== 'completed') {
      qa('input[type="radio"]', q('#studyQuizDetail')).forEach(input => input.onchange = () => {
        const article = input.closest('[data-study-question]'), qi = Number(article?.dataset.studyQuestion), value = Number(input.value);
        if (!Number.isInteger(qi) || !Number.isInteger(value)) return;
        persistQuizAnswer(activeQuiz, qi, value);
        renderLearning();
      });
      q('#studyQuizSubmit')?.addEventListener('click', () => gradeQuiz(activeQuiz));
    }
  }

  function renderCounters() {
    if (q('#studyProjectCount')) q('#studyProjectCount').textContent = `프로젝트 ${activeProjects().length}`;
    if (q('#studyQuizCount')) q('#studyQuizCount').textContent = `퀴즈 ${(state.learningQuizzes || []).length}`;
    if (q('#studyWrongCount')) q('#studyWrongCount').textContent = `오답 ${(state.learningWrongAnswers || []).filter(x => x.reviewStatus !== 'mastered').length}`;
  }

  function renderLearning() {
    ensureLearningState();
    injectStudyShell();
    renderProjectList();
    renderCounters();
    renderMain();
    try { if (typeof renderNotes === 'function') renderNotes(); } catch (_) {}
  }

  function toggleProjectForm(show) {
    const form = q('#studyProjectForm');
    if (!form) return;
    form.hidden = !show;
    if (show) q('#studyProjectName')?.focus();
  }

  function bindStaticEvents() {
    q('#studyProjectNew')?.addEventListener('click', () => toggleProjectForm(true));
    q('#studyProjectCancel')?.addEventListener('click', () => toggleProjectForm(false));
    q('#studyProjectPreset')?.addEventListener('click', () => {
      q('#studyProjectName').value = 'JLPT N3';
      q('#studyProjectCategory').value = 'jlpt';
      q('#studyProjectGoal').value = 'JLPT N3 합격 · 어휘/문법/독해/청해를 균형 있게 학습';
      toggleProjectForm(true);
    });
    q('#studyProjectSave')?.addEventListener('click', () => {
      const name = String(q('#studyProjectName')?.value || '').trim();
      if (!name) return alert('프로젝트 이름을 입력해 주세요.');
      const duplicate = (state.learningProjects || []).some(x => x.status !== 'archived' && x.name.trim().toLowerCase() === name.toLowerCase());
      if (duplicate) return alert('같은 이름의 활성 학습 프로젝트가 이미 있습니다.');
      const row = normalizeProject({
        name,
        category: q('#studyProjectCategory')?.value || 'other',
        goal: q('#studyProjectGoal')?.value || '',
        targetDate: q('#studyProjectTargetDate')?.value || '',
      });
      if (!persistNewProject(row)) return;
      renderLearning();
    });
  }

  async function generateTodayQuiz(project) {
    const existing = projectQuizzes(project.id).find(x => x.date === localToday());
    if (existing) return selectQuiz(existing.id);
    if (busy) return;
    busy = true;
    renderLearning();
    try {
      if (typeof haniWorkShow === 'function') haniWorkShow({agent:'hina', title:'히나가 오늘의 5문제를 만들고 있어요!', step:'HINA · DAILY QUIZ', message:'최근 오답과 프로젝트 목표를 보고 새 문제를 구성합니다.'});
      const questions = await quizApi(project);
      const quiz = normalizeQuiz({ projectId: project.id, date: localToday(), status:'pending', questions, answers:Array(5).fill(null) });
      if (!persistGeneratedQuiz(project, quiz)) throw new Error('퀴즈 저장 검증에 실패했습니다.');
      if (typeof haniWorkFinish === 'function') haniWorkFinish(true, '오늘의 5문제 준비 완료!');
      if (typeof haniWorkHide === 'function') haniWorkHide(700);
    } catch (e) {
      if (typeof haniWorkFinish === 'function') haniWorkFinish(false, '퀴즈 생성 실패');
      if (typeof haniWorkHide === 'function') haniWorkHide(900);
      alert(e?.message || String(e));
    } finally {
      busy = false;
      renderLearning();
    }
  }

  function upsertWrongAnswer(project, quiz, question, userAnswerIndex) {
    const key = questionKey(project.id, question), rows = state.learningWrongAnswers || [];
    const existing = rows.find(x => x.projectId === project.id && x.questionKey === key);
    const userAnswer = Number.isInteger(userAnswerIndex) ? question.choices[userAnswerIndex] || '' : '';
    const correctAnswer = question.choices[question.answerIndex] || '';
    if (existing) {
      existing.userAnswer = userAnswer;
      existing.correctAnswer = correctAnswer;
      existing.explanation = question.explanation;
      existing.type = question.type;
      existing.topic = question.topic;
      existing.lastWrongDate = quiz.date;
      existing.wrongCount = Number(existing.wrongCount || 1) + 1;
      existing.reviewStatus = 'review';
      existing.quizId = quiz.id;
      existing.updatedAt = nowIso();
      return existing;
    }
    const row = {
      id: makeId(), projectId: project.id, questionKey: key,
      question: question.prompt, choices: [...question.choices],
      correctAnswer, userAnswer, explanation: question.explanation,
      type: question.type, topic: question.topic,
      firstWrongDate: quiz.date, lastWrongDate: quiz.date,
      wrongCount: 1, reviewStatus: 'review', quizId: quiz.id,
      createdAt: nowIso(), updatedAt: nowIso(),
    };
    rows.push(row);
    return row;
  }

  function gradeQuiz(quiz) {
    const project = projectById(quiz.projectId);
    if (!project || quiz.status === 'completed') return;
    if (quiz.answers.length !== 5 || quiz.answers.some(x => !Number.isInteger(x))) return alert('5문제의 답을 모두 선택해 주세요.');
    const quizSnapshot = cloneLearningValue(quiz);
    const wrongAnswersSnapshot = cloneLearningValue(state.learningWrongAnswers || []);
    const previousQuizId = activeQuizId;
    let correct = 0;
    quiz.questions.forEach((question, index) => {
      if (quiz.answers[index] === question.answerIndex) correct += 1;
      else upsertWrongAnswer(project, quiz, question, quiz.answers[index]);
    });
    quiz.status = 'completed';
    quiz.score = correct * 20;
    quiz.completedAt = nowIso();
    quiz.updatedAt = quiz.completedAt;
    try {
      if (!learningCommit(`${project.name} 퀴즈 채점 완료 · ${quiz.score}점`)) throw new Error('퀴즈 채점 저장 검증에 실패했습니다.');
    } catch (error) {
      restoreLearningObject(quiz, quizSnapshot);
      state.learningWrongAnswers.splice(0, state.learningWrongAnswers.length, ...wrongAnswersSnapshot);
      activeQuizId = previousQuizId;
      console.error('[HANI Learning] grading save failed', error);
      renderLearning();
      return false;
    }
    activeQuizId = quiz.id;
    renderLearning();
    return true;
  }

  function derivedLearningTasks() {
    const date = localToday(), rows = [];
    for (const project of activeProjects()) {
      const quizzes = projectQuizzes(project.id), todayQuiz = quizzes.find(x => x.date === date);
      if (!todayQuiz) rows.push({ projectId:project.id, quizId:'', due:date, text:`${project.name} · 오늘의 5문제`, sub:'퀴즈 생성 전', overdue:false });
      else if (todayQuiz.status !== 'completed') rows.push({ projectId:project.id, quizId:todayQuiz.id, due:date, text:`${project.name} · 오늘의 5문제`, sub:`${todayQuiz.answers.filter(x => Number.isInteger(x)).length}/5 풀이`, overdue:false });
      for (const quiz of quizzes.filter(x => x.status !== 'completed' && x.date < date).slice(0, 3)) rows.push({ projectId:project.id, quizId:quiz.id, due:quiz.date, text:`${project.name} · 미완료 퀴즈`, sub:`${quiz.date} · ${quiz.answers.filter(x => Number.isInteger(x)).length}/5`, overdue:true });
    }
    return rows.sort((a,b) => String(a.due).localeCompare(String(b.due))).slice(0, 6);
  }

  function renderHomeDerived() {
    const box = q('#homeTaskMini');
    if (!box) return;
    qa('.learning-derived', box).forEach(x => x.remove());
    const rows = derivedLearningTasks();
    if (!rows.length) return;
    if (box.querySelector('.empty')) box.innerHTML = '';
    const fragment = document.createDocumentFragment();
    rows.forEach(row => {
      const el = document.createElement('div');
      el.className = 'home-task-mini-item learning-derived';
      el.dataset.learningProject = row.projectId;
      el.dataset.learningQuiz = row.quizId;
      el.innerHTML = `<i></i><div><b>${safe(row.text)}</b><div class="sub">${safe(row.sub)}</div></div><span class="${row.overdue ? 'is-near' : ''}">${row.overdue ? '미완료' : 'TODAY'}</span>`;
      el.onclick = () => { activeProjectId = row.projectId; activeQuizId = row.quizId || ''; if (typeof showView === 'function') showView('study'); renderLearning(); };
      fragment.appendChild(el);
    });
    box.appendChild(fragment);
    const count = q('#homeTasks');
    if (count) {
      const currentMonth = localToday().slice(0, 7);
      const base = (state.tasks || []).filter(t => !t.done && String(t.due || '').startsWith(currentMonth)).length;
      count.textContent = `${base + rows.length}개`;
    }
  }

  function patchCoreHooks() {
    try {
      const baseRenderAll = renderAll;
      renderAll = function() { const r = baseRenderAll(); renderLearning(); renderHomeDerived(); return r; };
    } catch (_) {}
    try {
      const baseRenderHome = renderHome;
      renderHome = function() { const r = baseRenderHome(); renderHomeDerived(); return r; };
    } catch (_) {}
  }

  function patchVersionSurface() {
    const rx = /v2\.9\.83/g;
    ['title'].forEach(() => { if (document.title.includes('v2.9.83')) document.title = document.title.replace(rx, `v${VERSION}`); });
    qa('.login-brand p,.brand-copy small,.side .foot,.footer').forEach(el => { if (String(el.textContent || '').includes('v2.9.83')) el.textContent = el.textContent.replace(rx, `v${VERSION}`); });
  }

  window.HANI_STUDY_V02984_TEST = { ensureLearningState, normalizeProject, normalizeQuestion, normalizeQuiz, questionKey, derivedLearningTasks, upsertWrongAnswer, persistNewProject, persistGeneratedQuiz, persistQuizAnswer, gradeQuiz };

  function boot() {
    ensureLearningState();
    style();
    injectStudyShell();
    bindStaticEvents();
    patchCoreHooks();
    patchVersionSurface();
    renderLearning();
    renderHomeDerived();
    window.HANI_STUDY_V02984_AUDIT = () => ({
      version: VERSION,
      projectCount: state.learningProjects?.length || 0,
      quizCount: state.learningQuizzes?.length || 0,
      wrongAnswerCount: state.learningWrongAnswers?.length || 0,
      derivedTaskCount: derivedLearningTasks().length,
      studyMounted: !!q('#studyEngineV02984'),
    });
    console.info('[HANI OS] v2.9.84 Learning Engine MVP ready');
  }

  boot();
})();
