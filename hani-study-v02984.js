/* =========================================================
   HANI OS v2.9.87 · Learning Board v1.1
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
  const VERSION = '2.9.87';
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
  let activeStudyTab = 'board';
  let activeWrongId = '';
  let busy = false;
  let projectFormMode = 'create';
  const autoGenerationAttempts = new Set();
  const generationFailures = new Map();
  const SCHEDULE_LABELS = {
    daily: '매일', mon_wed_fri: '월·수·금', every_2_days: '2일마다',
    every_3_days: '3일마다', weekly: '매주', monthly: '한 달마다', manual: '수동',
  };
  const PROJECT_STATUSES = new Set(['active', 'paused', 'completed', 'archived']);
  const QUIZ_SIZES = new Set([5, 10, 15, 20]);
  const DEFAULT_QUIZ_SIZE = 20;

  function ensureLearningState(target = state) {
    if (!target || typeof target !== 'object') return target;
    if (!Array.isArray(target.learningProjects)) target.learningProjects = [];
    if (!Array.isArray(target.learningQuizzes)) target.learningQuizzes = [];
    if (!Array.isArray(target.learningWrongAnswers)) target.learningWrongAnswers = [];
    return target;
  }

  function normalizeProject(raw = {}) {
    const ts = nowIso();
    const focusAreas = Array.isArray(raw.focusAreas)
      ? raw.focusAreas.map(x => String(x || '').trim()).filter(Boolean).slice(0, 12)
      : String(raw.goal || '').split(/[·,\/]/).map(x => x.trim()).filter(Boolean).slice(0, 12);
    const scheduleType = Object.prototype.hasOwnProperty.call(SCHEDULE_LABELS, raw.scheduleType) ? raw.scheduleType : 'every_3_days';
    const examDate = String(raw.examDate || raw.targetDate || '');
    const quizSize = Number(raw.quizSize ?? raw.quiz_size);
    return {
      id: String(raw.id || makeId()),
      name: String(raw.name || '').trim(),
      category: String(raw.category || 'other'),
      goal: String(raw.goal || '').trim(),
      targetDate: examDate,
      examDate,
      focusAreas,
      scheduleType,
      quizSize: QUIZ_SIZES.has(quizSize) ? quizSize : DEFAULT_QUIZ_SIZE,
      status: PROJECT_STATUSES.has(raw.status) ? raw.status : 'active',
      completedAt: String(raw.completedAt || ''),
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
    const questions = Array.isArray(raw.questions) ? raw.questions.slice(0, DEFAULT_QUIZ_SIZE).map(normalizeQuestion) : [];
    const answers = Array.isArray(raw.answers) ? raw.answers.slice(0, questions.length).map(v => v !== null && v !== '' && Number.isInteger(Number(v)) && Number(v) >= 0 && Number(v) <= 3 ? Number(v) : null) : [];
    while (answers.length < questions.length) answers.push(null);
    const scheduledDate = String(raw.scheduledDate || raw.date || localToday());
    const sequenceNo = Math.max(1, Number(raw.sequenceNo) || 1);
    const rawStatus = String(raw.status || 'pending');
    return {
      id: String(raw.id || makeId()),
      projectId: String(raw.projectId || ''),
      date: scheduledDate,
      scheduledDate,
      sequenceNo,
      title: String(raw.title || '').trim(),
      status: rawStatus === 'completed' ? 'completed' : rawStatus === 'in_progress' ? 'in_progress' : 'pending',
      questions,
      answers,
      score: Number.isFinite(Number(raw.score)) ? Number(raw.score) : null,
      correctCount: Number.isFinite(Number(raw.correctCount)) ? Number(raw.correctCount) : null,
      total: questions.length || Math.max(0, Number(raw.total) || 0),
      completedAt: String(raw.completedAt || ''),
      createdAt: String(raw.createdAt || nowIso()),
      updatedAt: String(raw.updatedAt || raw.createdAt || nowIso()),
    };
  }

  function projectById(id) { return (state.learningProjects || []).find(x => x.id === id) || null; }
  function quizById(id) { return (state.learningQuizzes || []).find(x => x.id === id) || null; }
  function quizDate(quiz) { return String(quiz?.scheduledDate || quiz?.date || ''); }
  function projectQuizzes(id) { return (state.learningQuizzes || []).filter(x => x.projectId === id).sort((a,b) => quizDate(b).localeCompare(quizDate(a)) || Number(b.sequenceNo || 0) - Number(a.sequenceNo || 0) || String(b.createdAt).localeCompare(String(a.createdAt))); }
  function activeProjects() { return (state.learningProjects || []).filter(x => normalizeProject(x).status === 'active').sort((a,b) => String(a.createdAt).localeCompare(String(b.createdAt))); }
  function boardProjects() { return (state.learningProjects || []).filter(x => ['active','paused'].includes(normalizeProject(x).status)).sort((a,b) => String(a.createdAt).localeCompare(String(b.createdAt))); }
  function completedProjects() { return (state.learningProjects || []).filter(x => normalizeProject(x).status === 'completed').sort((a,b) => String(b.completedAt || b.updatedAt || '').localeCompare(String(a.completedAt || a.updatedAt || ''))); }
  function projectLabel(p) { return p?.name || '학습 프로젝트'; }

  function parseLocalDate(value) {
    const m = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
  }

  function localDayNumber(value) {
    const d = parseLocalDate(value);
    return d ? Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000) : NaN;
  }

  function isScheduledDate(project, date = localToday()) {
    const p = normalizeProject(project), type = p.scheduleType;
    if (type === 'manual') return false;
    const d = parseLocalDate(date);
    if (!d) return false;
    if (type === 'daily') return true;
    if (type === 'mon_wed_fri') return [1, 3, 5].includes(d.getDay());
    if (type === 'monthly') {
      const start = parseLocalDate(String(p.createdAt || '').slice(0, 10));
      if (!start || localDayNumber(date) < localDayNumber(String(p.createdAt || '').slice(0, 10))) return false;
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      return d.getDate() === Math.min(start.getDate(), lastDay);
    }
    const interval = type === 'every_2_days' ? 2 : type === 'every_3_days' ? 3 : type === 'weekly' ? 7 : 1;
    const start = String(p.createdAt || '').slice(0, 10) || date;
    const delta = localDayNumber(date) - localDayNumber(start);
    return Number.isFinite(delta) && delta >= 0 && delta % interval === 0;
  }

  function shouldGenerateForDate(project, date = localToday()) {
    return normalizeProject(project).status === 'active' && isScheduledDate(project, date) && !projectQuizzes(project.id).some(x => quizDate(x) === date);
  }

  function nextSequenceNo(projectId) {
    const quizzes = projectQuizzes(projectId);
    return Math.max(quizzes.length, quizzes.reduce((max, quiz) => Math.max(max, Number(quiz.sequenceNo || 0)), 0)) + 1;
  }

  function quizCorrectCount(quiz) {
    if (Number.isFinite(Number(quiz?.correctCount))) return Number(quiz.correctCount);
    const total = Number(quiz?.total || quiz?.questions?.length || 0);
    if (quiz?.status === 'completed' && total > 0 && Number.isFinite(Number(quiz.score))) return Math.round(Number(quiz.score) * total / 100);
    return null;
  }

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

  function persistProjectUpdate(project, changes) {
    const snapshot = cloneLearningValue(project);
    Object.assign(project, changes, { updatedAt: nowIso() });
    try {
      if (learningCommit(`학습 프로젝트 ‘${project.name}’ 설정을 변경했습니다.`)) return true;
    } catch (error) {
      console.error('[HANI Learning] project update failed', error);
    }
    restoreLearningObject(project, snapshot);
    return false;
  }

  function persistProjectStatus(project, status, message) {
    if (!project || !PROJECT_STATUSES.has(status)) return false;
    const snapshot = cloneLearningValue(project);
    Object.assign(project, {
      status,
      completedAt: status === 'completed' ? nowIso() : status === 'active' ? '' : String(project.completedAt || ''),
      updatedAt: nowIso(),
    });
    try {
      if (learningCommit(message)) return true;
    } catch (error) {
      console.error('[HANI Learning] project lifecycle save failed', error);
    }
    restoreLearningObject(project, snapshot);
    return false;
  }

  function pauseProject(projectId) {
    const project = projectById(projectId);
    return project && normalizeProject(project).status === 'active'
      ? persistProjectStatus(project, 'paused', `학습 프로젝트 ‘${project.name}’을 일시중지했습니다.`)
      : false;
  }

  function resumeProject(projectId) {
    const project = projectById(projectId);
    return project && normalizeProject(project).status === 'paused'
      ? persistProjectStatus(project, 'active', `학습 프로젝트 ‘${project.name}’을 재개했습니다.`)
      : false;
  }

  function completeProjectWithConfirmation(projectId, confirmFn = window.confirm) {
    const project = projectById(projectId);
    if (!project || !['active','paused'].includes(normalizeProject(project).status)) return false;
    if (!confirmFn(`‘${project.name}’ 프로젝트를 종료할까요?\n\n문제세트, 오답, 점수와 시작일은 그대로 보존됩니다.`)) return false;
    if (!confirmFn('마지막 확인입니다. 종료 후 새 문제는 생성되지 않고 History로 이동합니다. 계속할까요?')) return false;
    return persistProjectStatus(project, 'completed', `학습 프로젝트 ‘${project.name}’을 종료했습니다.`);
  }

  function archiveProjectWithConfirmation(projectId, confirmFn = window.confirm) {
    const project = projectById(projectId);
    if (!project || project.status === 'archived') return false;
    const quizCount = projectQuizzes(projectId).length;
    const wrongCount = (state.learningWrongAnswers || []).filter(x => x.projectId === projectId).length;
    if (!confirmFn(`‘${project.name}’ 게시판을 삭제할까요?\n\n연결된 문제세트 ${quizCount}개와 오답 ${wrongCount}개는 데이터 보호를 위해 보존됩니다.`)) return false;
    if (!confirmFn('마지막 확인입니다. 프로젝트는 목록에서 숨겨지며, 연결 기록은 삭제하지 않습니다. 계속할까요?')) return false;
    const saved = persistProjectStatus(project, 'archived', `학습 프로젝트 ‘${project.name}’을 보관 처리했습니다.`);
    if (saved && activeProjectId === projectId) { activeProjectId = ''; activeQuizId = ''; }
    return saved;
  }

  function persistGeneratedQuiz(project, quiz) {
    const previousQuizId = activeQuizId;
    state.learningQuizzes.push(quiz);
    activeQuizId = quiz.id;
    try {
      if (learningCommit(`${project.name} 오늘의 퀴즈 ${quiz.questions.length}문제를 생성했습니다.`)) return true;
    } catch (error) {
      console.error('[HANI Learning] quiz save failed', error);
    }
    const index = state.learningQuizzes.indexOf(quiz);
    if (index >= 0) state.learningQuizzes.splice(index, 1);
    activeQuizId = previousQuizId;
    return false;
  }

  function persistQuizAnswer(quiz, questionIndex, value) {
    const previousAnswer = quiz.answers[questionIndex], previousUpdatedAt = quiz.updatedAt, previousStatus = quiz.status;
    quiz.answers[questionIndex] = value;
    if (quiz.status === 'pending') quiz.status = 'in_progress';
    quiz.updatedAt = nowIso();
    try {
      const result = typeof save === 'function' ? save() : null;
      if (result?.ok === true) return true;
    } catch (error) {
      console.error('[HANI Learning] answer save failed', error);
    }
    quiz.answers[questionIndex] = previousAnswer;
    quiz.status = previousStatus;
    quiz.updatedAt = previousUpdatedAt;
    return false;
  }

  async function quizApi(project) {
    if (!cloudClient || !cloudUser) throw new Error('퀴즈 생성은 HANI OS Cloud 로그인 후 사용할 수 있어요.');
    const cfg = cloudConfig();
    const { data: { session }, error } = await cloudClient.auth.getSession();
    if (error) throw error;
    if (!session?.access_token) throw new Error('로그인 세션을 확인하지 못했습니다.');
    const quizSize = normalizeProject(project).quizSize;
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
          target_date: project.examDate || project.targetDate,
          exam_date: project.examDate || project.targetDate,
          focus_areas: Array.isArray(project.focusAreas) ? project.focusAreas : [],
          schedule_type: project.scheduleType || 'every_3_days',
          quiz_size: quizSize,
        },
        weaknesses: recentWeaknesses(project.id),
      }),
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok || result?.ok === false) throw new Error(result?.message || result?.error || `퀴즈 생성 실패 (${res.status})`);
    const questions = Array.isArray(result?.quiz?.questions) ? result.quiz.questions.map(normalizeQuestion) : [];
    if (questions.length !== quizSize) throw new Error(`퀴즈 생성 결과가 ${quizSize}문제가 아닙니다. (${questions.length}문제)`);
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
#study .study-subtabs{display:flex;gap:6px;margin:-4px 0 16px;padding:5px;border:1px solid var(--study-line);border-radius:14px;background:#f8f6ff;overflow-x:auto}.study-subtab{flex:0 0 auto;border:0;border-radius:10px;background:transparent;color:#68637d;font-weight:900;padding:9px 14px;cursor:pointer}.study-subtab.is-active{background:#fff;color:var(--study);box-shadow:0 3px 10px rgba(52,42,110,.09)}
#study .study-project-list{display:grid;gap:9px}.study-project-row{width:100%;text-align:left;border:1px solid #e8e7f2;background:#fff;border-radius:14px;padding:12px;cursor:pointer}.study-project-row.is-active{border-color:#9f91ef;background:var(--study-soft);box-shadow:0 0 0 2px rgba(109,91,208,.08)}
#study .study-project-row b{display:block;font-size:14px}.study-project-row span{display:block;margin-top:3px;font-size:11px;color:#77778a}.study-project-row .study-progress-line{margin-top:8px;display:flex;gap:6px;align-items:center}.study-progress-line i{height:6px;flex:1;background:#ecebf4;border-radius:99px;overflow:hidden}.study-progress-line i:after{content:"";display:block;width:var(--p,0%);height:100%;background:var(--study);border-radius:99px}
#study .study-project-row .study-project-state{display:inline-block;margin:0 0 0 6px;padding:3px 6px;border-radius:99px;background:#eeeafc;color:#6254ac;font-size:10px}.study-project-row .study-project-state.paused{background:#fff2d9;color:#936000}
#study .study-empty{padding:20px 10px;text-align:center;color:#858398;font-size:13px}.study-actions-row{display:flex;gap:8px;flex-wrap:wrap}.study-actions-row button{min-height:38px}
#study .study-project-form{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}.study-project-form .span2{grid-column:1/-1}.study-project-form label{display:block;font-size:11px;font-weight:800;color:#67657c;margin-bottom:5px}.study-project-form input,.study-project-form select{width:100%;box-sizing:border-box;min-height:38px;border:1px solid #dddde8;border-radius:10px;padding:8px 10px;background:#fff}
#study .study-focus-grid{display:flex;flex-wrap:wrap;gap:7px}.study-focus-chip{display:inline-flex!important;align-items:center;gap:5px;border:1px solid #dddbea;border-radius:999px;padding:7px 10px;background:#fff;cursor:pointer}.study-focus-chip input{width:auto!important;min-height:auto!important;margin:0}.study-focus-chip:has(input:checked){border-color:#9587e9;background:#f3f0ff;color:#5445a8}
#study .study-main-empty{display:grid;place-items:center;min-height:320px;text-align:center;color:#7b798e}.study-main-empty b{display:block;color:#343248;font-size:18px;margin-bottom:7px}
#study .study-today-card{border:1px solid var(--study-line);background:linear-gradient(180deg,#fff,#fcfbff)}.study-today-top{display:flex;justify-content:space-between;gap:12px;align-items:center}.study-today-title b{display:block;font-size:18px}.study-today-title span{font-size:12px;color:#77758b}.study-score{font-weight:1000;font-size:24px;color:var(--study)}
#study .study-board-wrap{overflow:auto;border:1px solid #e7e7ee;border-radius:12px}.study-board{width:100%;border-collapse:collapse;min-width:610px;background:#fff}.study-board th{padding:10px 12px;border-bottom:1px solid #dedee7;background:#fafafd;color:#666477;font-size:11px;text-align:left;white-space:nowrap}.study-board td{padding:12px;border-bottom:1px solid #eeeeF3;font-size:12px;color:#4c4a5d}.study-board tbody tr:last-child td{border-bottom:0}.study-board-row{cursor:pointer}.study-board-row:hover,.study-board-row.is-active{background:#f8f6ff}.study-board-title{font-weight:800;color:#29273c}.study-board-no{width:54px;color:#8b8998!important;text-align:center!important}.study-board-score{font-weight:900;color:#5b4bb7!important}.study-status{display:inline-block;font-size:11px;font-weight:900;border-radius:999px;padding:5px 8px;background:#f0f1f5;color:#55586a;white-space:nowrap}.study-status.pending,.study-status.in_progress{background:#fff3db;color:#9c6500}.study-status.completed{background:#e9f8ef;color:#16814c}.study-status.failed{background:#fff0f0;color:#b44747}
#study .study-project-summary{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}.study-project-tools{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px;padding-top:12px;border-top:1px solid #eeeef4}
#study .study-question{border:1px solid #e8e6f2;border-radius:15px;padding:14px;margin-top:11px;background:#fff}.study-question-head{display:flex;gap:7px;align-items:center;margin-bottom:8px}.study-question-head span{font-size:10px;font-weight:900;border-radius:99px;background:#f2efff;color:#5d4eb2;padding:4px 7px}.study-question h4{font-size:14px;line-height:1.55;margin:0 0 10px}.study-choices{display:grid;gap:7px}.study-choice{display:flex;align-items:flex-start;gap:8px;border:1px solid #e5e5ed;border-radius:11px;padding:9px 10px;cursor:pointer}.study-choice:hover{border-color:#afa4ea}.study-choice input{margin-top:2px}.study-question.is-graded .study-choice.is-correct{border-color:#5ec58b;background:#edf9f2}.study-question.is-graded .study-choice.is-wrong{border-color:#ee8c8c;background:#fff1f1}.study-explanation{margin-top:10px;padding:10px 11px;background:#f7f7fb;border-radius:10px;font-size:12px;line-height:1.5;color:#555568}.study-explanation b{color:#40396d}
#study .study-submit-wrap{position:sticky;bottom:12px;z-index:3;margin-top:14px;padding:11px;border:1px solid #e3dffd;border-radius:14px;background:rgba(255,255,255,.94);backdrop-filter:blur(8px);display:flex;justify-content:space-between;gap:10px;align-items:center}.study-submit-wrap .sub{font-size:11px;color:#77758a}
#study .study-wrong-list{display:grid;gap:8px;margin-top:10px}.study-wrong-row{border:1px solid #ecebf3;border-radius:12px;padding:10px 12px}.study-wrong-row b{font-size:12px}.study-wrong-row p{font-size:11px;color:#727083;margin:4px 0 0;line-height:1.45}.study-wrong-meta{display:flex;gap:6px;flex-wrap:wrap;margin-top:7px}.study-wrong-meta span{font-size:10px;padding:4px 6px;background:#f5f4fa;border-radius:99px;color:#66637a}
#study .study-tab-toolbar{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px}.study-wrong-groups{display:grid;gap:10px}.study-wrong-group{min-width:0;border:1px solid #e3e0f2;border-radius:14px;background:#fbfaff;overflow:hidden}.study-wrong-group summary{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:13px 14px;cursor:pointer;list-style:none}.study-wrong-group summary::-webkit-details-marker{display:none}.study-wrong-group summary:after{content:"펼치기";flex:0 0 auto;font-size:10px;font-weight:900;color:#6759b3}.study-wrong-group[open] summary:after{content:"접기"}.study-wrong-group-title{min-width:0}.study-wrong-group-title b{display:block;overflow-wrap:anywhere}.study-wrong-group-title span{display:block;margin-top:3px;font-size:11px;color:#77758a}.study-wrong-group>.study-wrong-list{margin:0;padding:0 12px 12px}.study-wrong-row h4{margin:0 0 8px;font-size:14px;line-height:1.5;overflow-wrap:anywhere}.study-wrong-answer{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:9px 0}.study-wrong-answer div{min-width:0;padding:9px;border-radius:10px;background:#f7f7fb;font-size:12px;overflow-wrap:anywhere}.study-wrong-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.study-retry{margin-top:10px;padding:11px;border-radius:11px;background:#faf9ff}.study-pagination{display:flex;justify-content:center;align-items:center;gap:9px;margin-top:14px}.study-history-grid{display:grid;gap:12px}.study-history-card{border:1px solid #e7e4f3;border-radius:15px;padding:14px;background:#fff}.study-history-card h3{margin:0;font-size:16px}.study-history-meta{display:flex;gap:7px;flex-wrap:wrap;margin:8px 0 12px}
#study .study-quick-note{margin-top:16px}
.home-task-mini-item.learning-derived{cursor:pointer;border-left:3px solid #8b78e8;padding-left:9px}.home-task-mini-item.learning-derived>i{background:#8b78e8!important}.home-task-mini-item.learning-derived b:before{content:"📚 ";}
@media(max-width:800px){#study .study-engine-grid{grid-template-columns:1fr}#study .study-hero-v02984{align-items:flex-start;flex-direction:column}#study .study-project-form{grid-template-columns:1fr}#study .study-project-form .span2{grid-column:auto}#study .study-card-v02984{padding:13px}#study .study-submit-wrap{bottom:8px}#study .study-question{padding:12px}.study-hero-meta{width:100%}.study-chip{flex:1;text-align:center}#study .study-wrong-answer{grid-template-columns:1fr}#study .study-tab-toolbar select{width:100%;max-width:none}}
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
          <div><div class="study-kicker">HINA · LEARNING BOARD v1.1</div><h2>공부</h2><div class="note">시험별 게시판에서 문제세트를 이어 풀고, 틀린 문제는 자동으로 오답 자산으로 남겨요.</div></div>
          <div class="study-hero-meta"><span class="study-chip" id="studyProjectCount">프로젝트 0</span><span class="study-chip" id="studyQuizCount">퀴즈 0</span><span class="study-chip" id="studyWrongCount">오답 0</span></div>
        </div>
        <div class="study-subtabs" role="tablist" aria-label="공부 메뉴"><button class="study-subtab is-active" type="button" data-study-tab="board">Learning Board</button><button class="study-subtab" type="button" data-study-tab="wrong">오답노트</button><button class="study-subtab" type="button" data-study-tab="history">History</button></div>
        <div class="study-engine-grid">
          <div>
            <div class="study-card-v02984">
              <div class="study-card-head"><h3>학습 프로젝트</h3><button class="btn sm primary" type="button" id="studyProjectNew">+ 추가</button></div>
              <div class="study-project-list" id="studyProjectList"></div>
              <div class="study-project-form" id="studyProjectForm" hidden>
                <input id="studyProjectEditId" type="hidden">
                <div class="span2"><label>프로젝트명</label><input id="studyProjectName" placeholder="예: JLPT N3"></div>
                <div><label>분류</label><select id="studyProjectCategory"><option value="jlpt">JLPT</option><option value="certificate">자격증</option><option value="university">대학교</option><option value="ai">AI/실무</option><option value="other">기타</option></select></div>
                <div><label>시험일 · 선택</label><input id="studyProjectTargetDate" type="date"></div>
                <div class="span2"><label>집중영역</label><div class="study-focus-grid" id="studyProjectFocusAreas"><label class="study-focus-chip"><input type="checkbox" value="어휘">어휘</label><label class="study-focus-chip"><input type="checkbox" value="문법">문법</label><label class="study-focus-chip"><input type="checkbox" value="독해">독해</label><label class="study-focus-chip"><input type="checkbox" value="청해">청해</label><label class="study-focus-chip"><input type="checkbox" value="이론">이론</label><label class="study-focus-chip"><input type="checkbox" value="실기">실기</label></div></div>
                <div><label>생성주기</label><select id="studyProjectSchedule"><option value="daily">매일</option><option value="mon_wed_fri">월·수·금</option><option value="every_2_days">2일마다</option><option value="every_3_days" selected>3일마다</option><option value="weekly">매주</option><option value="monthly">한 달마다</option><option value="manual">수동</option></select></div>
                <div><label>문제 수</label><select id="studyProjectQuizSize"><option value="5">5문제</option><option value="10">10문제</option><option value="15">15문제</option><option value="20" selected>20문제</option></select></div>
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
        <div id="studyWrongPanel" hidden></div>
        <div id="studyHistoryPanel" hidden></div>
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
    const projects = boardProjects();
    if (!activeProjectId || !projects.some(x => x.id === activeProjectId)) activeProjectId = projects[0]?.id || '';
    box.innerHTML = projects.length ? projects.map(p => {
      const view = normalizeProject(p), s = projectProgress(p), pct = s.total ? Math.round(s.completed / s.total * 100) : 0;
      return `<button class="study-project-row ${p.id === activeProjectId ? 'is-active' : ''}" type="button" data-study-project="${safe(p.id)}"><b>${safe(p.name)}<span class="study-project-state ${safe(view.status)}">${view.status === 'paused' ? '일시중지' : '학습 중'}</span></b><span>${safe(({jlpt:'JLPT',certificate:'자격증',university:'대학교',ai:'AI/실무',other:'기타'}[p.category] || '기타'))}${view.examDate ? ` · 시험 ${safe(view.examDate)}` : ''} · ${safe(SCHEDULE_LABELS[view.scheduleType])} · ${view.quizSize}문제</span><div class="study-progress-line"><i style="--p:${pct}%"></i><span>${s.completed}/${s.total} · 평균 ${s.avg}점</span></div></button>`;
    }).join('') : `<div class="study-empty"><b>첫 학습 프로젝트를 만들어보세요.</b><br>JLPT N3부터 바로 시작할 수 있어요.</div>`;
    qa('[data-study-project]', box).forEach(btn => btn.onclick = () => { activeProjectId = btn.dataset.studyProject || ''; activeQuizId = ''; renderLearning(); });
  }

  function wrongRows() {
    return (state.learningWrongAnswers || [])
      .filter(x => x.reviewStatus !== 'mastered')
      .sort((a,b) => Number(b.wrongCount || 0) - Number(a.wrongCount || 0) || String(b.lastWrongDate || '').localeCompare(String(a.lastWrongDate || '')));
  }

  function wrongGroups() {
    const groups = new Map();
    wrongRows().forEach(row => {
      if (!groups.has(row.projectId)) groups.set(row.projectId, { projectId:row.projectId, project:projectById(row.projectId), rows:[] });
      groups.get(row.projectId).rows.push(row);
    });
    return Array.from(groups.values());
  }

  function persistWrongUpdate(row, changes, message) {
    const snapshot = cloneLearningValue(row);
    Object.assign(row, changes, { updatedAt: nowIso() });
    try {
      if (learningCommit(message)) return true;
    } catch (error) {
      console.error('[HANI Learning] wrong-note save failed', error);
    }
    restoreLearningObject(row, snapshot);
    return false;
  }

  function confirmWrongAnswer(id) {
    const row = (state.learningWrongAnswers || []).find(x => x.id === id);
    return row ? persistWrongUpdate(row, { reviewStatus:'reviewed', reviewedAt:nowIso() }, '오답 확인을 완료했습니다.') : false;
  }

  function retryWrongAnswer(id, answerIndex) {
    const row = (state.learningWrongAnswers || []).find(x => x.id === id);
    if (!row || !Number.isInteger(answerIndex)) return false;
    const correctIndex = Array.isArray(row.choices) ? row.choices.findIndex(x => String(x) === String(row.correctAnswer)) : -1;
    const correct = correctIndex >= 0 && answerIndex === correctIndex;
    return persistWrongUpdate(row, {
      retryCount:Number(row.retryCount || 0) + 1,
      reviewStatus:correct ? 'retry_completed' : 'review',
      lastRetryAt:nowIso(), lastRetryCorrect:correct,
    }, correct ? '오답 재도전을 완료했습니다.' : '오답 재도전 결과를 저장했습니다.');
  }

  function masterWrongAnswer(id) {
    const row = (state.learningWrongAnswers || []).find(x => x.id === id);
    if (!row || !['reviewed','retry_completed'].includes(row.reviewStatus)) return false;
    return persistWrongUpdate(row, { reviewStatus:'mastered', masteredAt:nowIso() }, '완료한 오답을 오답노트에서 숨겼습니다.');
  }

  function renderWrongTab() {
    const panel = q('#studyWrongPanel');
    if (!panel) return;
    const groups = wrongGroups();
    const renderWrongRow = x => { const retrying = activeWrongId === x.id; const canMaster = ['reviewed','retry_completed'].includes(x.reviewStatus); return `<article class="study-wrong-row"><h4>${safe(x.question)}</h4><div class="study-wrong-answer"><div><strong>내 답</strong><br>${safe(x.userAnswer || '미응답')}</div><div><strong>정답</strong><br>${safe(x.correctAnswer || '')}</div></div><p><strong>해설</strong> ${safe(x.explanation || '')}</p><div class="study-wrong-meta"><span>${safe(projectLabel(projectById(x.projectId)))}</span><span>오답 ${Number(x.wrongCount || 1)}회</span><span>최근 오답 ${safe(x.lastWrongDate || x.firstWrongDate || '')}</span><span>${x.reviewStatus === 'retry_completed' ? '재도전 완료' : x.reviewStatus === 'reviewed' ? '확인 완료' : Number(x.retryCount || 0) ? '재도전 중' : '재도전 전'}</span></div><div class="study-wrong-actions"><button class="btn sm" type="button" data-wrong-retry="${safe(x.id)}">다시 풀기</button><button class="btn sm" type="button" data-wrong-confirm="${safe(x.id)}">확인 완료</button>${canMaster ? `<button class="btn sm ghost" type="button" data-wrong-master="${safe(x.id)}">오답노트에서 지우기</button>` : ''}</div>${retrying ? `<div class="study-retry"><div class="study-choices">${(x.choices || []).map((choice, i) => `<label class="study-choice"><input type="radio" name="wrong-retry-${safe(x.id)}" value="${i}"><span>${i + 1}. ${safe(choice)}</span></label>`).join('')}</div><div class="study-wrong-actions"><button class="btn sm primary" type="button" data-wrong-submit="${safe(x.id)}">재도전 제출</button></div></div>` : ''}</article>`; };
    panel.innerHTML = `<div class="study-card-v02984"><div class="study-tab-toolbar"><div><h3 style="margin:0">오답노트</h3><div class="note">프로젝트를 열어 오답을 확인하고, 다시 푼 뒤 완료한 항목을 목록에서 숨길 수 있어요.</div></div></div>
      ${groups.length ? `<div class="study-wrong-groups">${groups.map(group => { const totalWrongCount = group.rows.reduce((sum, row) => sum + Number(row.wrongCount || 1), 0); const retryOpen = group.rows.some(row => row.id === activeWrongId); return `<details class="study-wrong-group" ${retryOpen ? 'open' : ''}><summary><span class="study-wrong-group-title"><b>${safe(projectLabel(group.project))}</b><span>표시 오답 ${group.rows.length}개 · 누적 오답 ${totalWrongCount}회</span></span></summary><div class="study-wrong-list">${group.rows.map(renderWrongRow).join('')}</div></details>`; }).join('')}</div>` : '<div class="study-empty">표시할 오답이 없습니다.</div>'}</div>`;
    qa('[data-wrong-retry]', panel).forEach(btn => btn.onclick = () => { activeWrongId = activeWrongId === btn.dataset.wrongRetry ? '' : btn.dataset.wrongRetry; renderWrongTab(); });
    qa('[data-wrong-confirm]', panel).forEach(btn => btn.onclick = () => { if (confirmWrongAnswer(btn.dataset.wrongConfirm)) renderLearning(); });
    qa('[data-wrong-master]', panel).forEach(btn => btn.onclick = () => { if (masterWrongAnswer(btn.dataset.wrongMaster)) { activeWrongId = ''; renderLearning(); } });
    qa('[data-wrong-submit]', panel).forEach(btn => btn.onclick = () => { const chosen = q('input[type="radio"]:checked', btn.closest('.study-wrong-row')); if (!chosen) return alert('답을 선택해 주세요.'); if (retryWrongAnswer(btn.dataset.wrongSubmit, Number(chosen.value))) { activeWrongId = ''; renderLearning(); } });
  }

  function renderHistory() {
    const panel = q('#studyHistoryPanel');
    if (!panel) return;
    const projects = completedProjects();
    panel.innerHTML = `<div class="study-card-v02984"><div class="study-card-head"><div><h3>History</h3><div class="note">종료한 프로젝트의 문제세트, 오답, 점수 기록입니다.</div></div><span class="study-status completed">종료 ${projects.length}</span></div><div class="study-history-grid">${projects.length ? projects.map(project => { const view = normalizeProject(project), stats = projectProgress(project), quizzes = projectQuizzes(project.id), wrongs = (state.learningWrongAnswers || []).filter(x => x.projectId === project.id); return `<section class="study-history-card"><h3>${safe(project.name)}</h3><div class="study-history-meta"><span class="study-chip">시작 ${safe(String(project.createdAt || '').slice(0,10))}</span><span class="study-chip">종료 ${safe(String(view.completedAt || '').slice(0,10))}</span><span class="study-chip">완료 ${stats.completed}/${stats.total}</span><span class="study-chip">평균 ${stats.avg}점</span><span class="study-chip">오답 ${wrongs.length}</span></div><div class="study-board-wrap"><table class="study-board"><thead><tr><th>No</th><th>문제세트</th><th>점수</th><th>작성일</th></tr></thead><tbody>${quizzes.length ? quizzes.map((quiz, index) => `<tr><td>${Number(quiz.sequenceNo || quizzes.length-index)}</td><td class="study-board-title">${safe(quiz.title || '문제세트')}</td><td class="study-board-score">${quiz.status === 'completed' ? `${quizCorrectCount(quiz) ?? 0}/${Number(quiz.total || quiz.questions?.length || 0)}` : '미완료'}</td><td>${safe(quizDate(quiz))}</td></tr>`).join('') : '<tr><td colspan="4">보존된 문제세트가 없습니다.</td></tr>'}</tbody></table></div>${wrongs.length ? `<details style="margin-top:10px"><summary>보존된 오답 ${wrongs.length}개 보기</summary><div class="study-wrong-list">${wrongs.map(x => `<div class="study-wrong-row"><h4>${safe(x.question)}</h4><p><strong>내 답</strong> ${safe(x.userAnswer || '미응답')} · <strong>정답</strong> ${safe(x.correctAnswer || '')}</p><p>${safe(x.explanation || '')}</p></div>`).join('')}</div></details>` : ''}<div class="study-actions-row" style="margin-top:10px"><button class="btn sm ghost" type="button" data-history-archive="${safe(project.id)}">프로젝트 삭제</button></div></section>`; }).join('') : '<div class="study-empty">종료한 프로젝트가 없습니다.</div>'}</div></div>`;
    qa('[data-history-archive]', panel).forEach(btn => btn.onclick = () => { if (archiveProjectWithConfirmation(btn.dataset.historyArchive)) renderLearning(); });
  }

  function selectQuiz(id) { activeQuizId = id; renderLearning(); requestAnimationFrame(() => q('#studyQuizDetail')?.scrollIntoView({behavior:'smooth', block:'start'})); }

  function quizStatusLabel(quiz) { const total = Number(quiz.total || quiz.questions?.length || 0); return quiz.status === 'completed' ? `${quizCorrectCount(quiz) ?? 0}/${total}` : `${quiz.answers.filter(x => Number.isInteger(x)).length}/${total} 풀이`; }

  function renderQuizDetail(project, quiz) {
    if (!quiz) return '';
    const graded = quiz.status === 'completed';
    return `<div class="study-card-v02984" id="studyQuizDetail" style="margin-top:16px">
      <div class="study-card-head"><div><h3>${safe(quiz.title || `${project.name} 문제세트`)} · ${graded ? '채점 완료' : '문제 풀이'}</h3><div class="note">${graded ? `점수 ${safe(quizStatusLabel(quiz))} · 해설과 오답을 확인하세요.` : '답을 고른 뒤 제출하면 바로 채점하고 오답노트에 누적합니다.'}</div></div><span class="study-status ${safe(quiz.status || 'pending')}">${safe(quizStatusLabel(quiz))}</span></div>
      ${quiz.questions.map((question, qi) => {
        const selected = quiz.answers[qi];
        return `<article class="study-question ${graded ? 'is-graded' : ''}" data-study-question="${qi}"><div class="study-question-head"><span>Q${qi + 1}</span><span>${safe(question.type || 'general')}</span><span>${safe(question.difficulty || 'medium')}</span></div><h4>${safe(question.prompt)}</h4><div class="study-choices">${question.choices.map((choice, ci) => {
          const correct = graded && ci === question.answerIndex, wrong = graded && ci === selected && ci !== question.answerIndex;
          return `<label class="study-choice ${correct ? 'is-correct' : wrong ? 'is-wrong' : ''}"><input type="radio" name="study-q-${safe(quiz.id)}-${qi}" value="${ci}" ${selected === ci ? 'checked' : ''} ${graded ? 'disabled' : ''}><span>${ci + 1}. ${safe(choice)}</span></label>`;
        }).join('')}</div>${graded ? `<div class="study-explanation"><b>정답 ${question.answerIndex + 1}번</b> · ${safe(question.explanation)}</div>` : ''}</article>`;
      }).join('')}
      ${graded ? '' : `<div class="study-submit-wrap"><div><b>답안 ${quiz.answers.filter(x => Number.isInteger(x)).length}/${Number(quiz.total || quiz.questions.length)}</b><div class="sub">모든 답은 선택 즉시 임시 저장됩니다.</div></div><button class="btn primary" type="button" id="studyQuizSubmit" ${quiz.answers.filter(x => Number.isInteger(x)).length !== Number(quiz.total || quiz.questions.length) ? 'disabled' : ''}>채점하기</button></div>`}
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
    const view = normalizeProject(project), date = localToday(), quizzes = projectQuizzes(project.id), todayQuiz = quizzes.find(x => quizDate(x) === date), pending = quizzes.filter(x => x.status !== 'completed'), completed = quizzes.filter(x => x.status === 'completed');
    const scheduled = isScheduledDate(project, date), failed = generationFailures.get(`${project.id}|${date}`) || '', paused = view.status === 'paused';
    if (!activeQuizId || !quizById(activeQuizId) || quizById(activeQuizId)?.projectId !== project.id) activeQuizId = todayQuiz?.id || pending[0]?.id || quizzes[0]?.id || '';
    const activeQuiz = quizById(activeQuizId);
    main.innerHTML = `
      <div class="study-card-v02984 study-today-card">
        <div class="study-today-top"><div class="study-today-title"><span>${safe(view.category.toUpperCase())} · ${safe(date)}</span><b>${safe(project.name)} Learning Board</b></div>${todayQuiz?.status === 'completed' ? `<div class="study-score">${safe(quizStatusLabel(todayQuiz))}</div>` : paused ? '<span class="study-status in_progress">학습 중지</span>' : `<button class="btn primary" id="studyGenerateQuiz" type="button" ${busy ? 'disabled' : ''}>${todayQuiz ? '오늘 세트 열기' : busy ? '생성 중…' : failed ? '다시 생성' : view.scheduleType === 'manual' ? '문제세트 생성' : scheduled ? '오늘 세트 생성' : '수동 생성'}</button>`}</div>
        <div class="study-project-summary"><span class="study-chip">${safe(SCHEDULE_LABELS[view.scheduleType])}</span><span class="study-chip">${view.quizSize}문제</span>${view.examDate ? `<span class="study-chip">시험 ${safe(view.examDate)}</span>` : ''}${view.focusAreas.map(x => `<span class="study-chip">${safe(x)}</span>`).join('')}</div>
        <div class="note" style="margin-top:8px">${paused ? '일시중지 상태입니다. 기존 문제세트와 오답은 계속 볼 수 있으며 새 문제 생성은 차단됩니다.' : failed ? `자동 생성 실패 · ${safe(failed)} · 버튼으로 한 번씩 다시 시도할 수 있습니다.` : scheduled ? '오늘은 자동 생성 대상일입니다. 프로젝트 진입 시 세트가 없으면 한 번만 요청합니다.' : '오늘은 정기 생성일이 아닙니다. 필요하면 수동으로 생성할 수 있습니다.'}${pending.filter(x => quizDate(x) < date).length ? ` · 지난 미완료 ${pending.filter(x => quizDate(x) < date).length}개` : ''}</div>
        <div class="study-project-tools"><button class="btn sm" type="button" id="studyProjectEdit">설정 수정</button>${paused ? '<button class="btn sm primary" type="button" id="studyProjectResume">학습 재개</button>' : '<button class="btn sm" type="button" id="studyProjectPause">학습 중지</button>'}<button class="btn sm" type="button" id="studyProjectComplete">프로젝트 종료</button><button class="btn sm ghost" type="button" id="studyProjectDelete">프로젝트 삭제</button></div>
      </div>
      <div class="study-card-v02984" style="margin-top:16px">
        <div class="study-card-head"><h3>문제세트 아카이브</h3><span class="study-status">완료 ${completed.length} · 미완료 ${pending.length}</span></div>
        <div class="study-board-wrap"><table class="study-board"><thead><tr><th class="study-board-no">No</th><th>제목</th><th>상태</th><th>점수</th><th>작성일</th></tr></thead><tbody>${quizzes.length ? quizzes.slice(0, 40).map((x, index) => { const no = Number(x.sequenceNo || (quizzes.length - index)); const total = Number(x.total || x.questions?.length || 0); const status = x.status === 'completed' ? '완료' : x.status === 'in_progress' ? '풀이 중' : '미완료'; return `<tr class="study-board-row ${x.id === activeQuizId ? 'is-active' : ''}" data-study-quiz="${safe(x.id)}"><td class="study-board-no">${no}</td><td class="study-board-title">${safe(x.title || `${project.name} 문제세트 #${String(no).padStart(3, '0')}`)}</td><td><span class="study-status ${safe(x.status || 'pending')}">${status}</span></td><td class="study-board-score">${x.status === 'completed' ? `${quizCorrectCount(x) ?? 0}/${total}` : '-'}</td><td>${safe(quizDate(x) || String(x.createdAt || '').slice(0, 10))}</td></tr>`; }).join('') : '<tr><td colspan="5"><div class="study-empty">아직 문제세트가 없습니다.</div></td></tr>'}</tbody></table></div>
      </div>
      ${renderQuizDetail(project, activeQuiz)}`;

    q('#studyGenerateQuiz')?.addEventListener('click', () => todayQuiz ? selectQuiz(todayQuiz.id) : generateTodayQuiz(project));
    q('#studyProjectEdit')?.addEventListener('click', () => openProjectForm(project));
    q('#studyProjectPause')?.addEventListener('click', () => { if (pauseProject(project.id)) renderLearning(); });
    q('#studyProjectResume')?.addEventListener('click', () => { if (resumeProject(project.id)) renderLearning(); });
    q('#studyProjectComplete')?.addEventListener('click', () => { if (completeProjectWithConfirmation(project.id)) { activeStudyTab = 'history'; renderLearning(); } });
    q('#studyProjectDelete')?.addEventListener('click', () => { if (archiveProjectWithConfirmation(project.id)) renderLearning(); });
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
    maybeAutoGenerate(project);
  }

  function renderCounters() {
    if (q('#studyProjectCount')) q('#studyProjectCount').textContent = `프로젝트 ${boardProjects().length}`;
    if (q('#studyQuizCount')) q('#studyQuizCount').textContent = `퀴즈 ${(state.learningQuizzes || []).length}`;
    if (q('#studyWrongCount')) q('#studyWrongCount').textContent = `오답 ${(state.learningWrongAnswers || []).filter(x => x.reviewStatus !== 'mastered').length}`;
  }

  function renderLearning() {
    ensureLearningState();
    injectStudyShell();
    qa('[data-study-tab]').forEach(btn => {
      const selected = btn.dataset.studyTab === activeStudyTab;
      btn.classList.toggle('is-active', selected);
      btn.setAttribute('aria-selected', selected ? 'true' : 'false');
    });
    const grid = q('.study-engine-grid', q('#studyEngineV02984'));
    if (grid) grid.hidden = activeStudyTab !== 'board';
    if (q('#studyWrongPanel')) q('#studyWrongPanel').hidden = activeStudyTab !== 'wrong';
    if (q('#studyHistoryPanel')) q('#studyHistoryPanel').hidden = activeStudyTab !== 'history';
    renderProjectList();
    renderCounters();
    if (activeStudyTab === 'board') {
      renderMain();
      try { if (typeof renderNotes === 'function') renderNotes(); } catch (_) {}
    } else if (activeStudyTab === 'wrong') renderWrongTab();
    else renderHistory();
  }

  function toggleProjectForm(show) {
    const form = q('#studyProjectForm');
    if (!form) return;
    form.hidden = !show;
    if (show) q('#studyProjectName')?.focus();
  }

  function setFocusAreas(values = []) {
    const selected = new Set(values);
    qa('#studyProjectFocusAreas input[type="checkbox"]').forEach(input => { input.checked = selected.has(input.value); });
  }

  function selectedFocusAreas() {
    return qa('#studyProjectFocusAreas input[type="checkbox"]:checked').map(input => input.value).filter(Boolean);
  }

  function resetProjectForm() {
    projectFormMode = 'create';
    if (q('#studyProjectEditId')) q('#studyProjectEditId').value = '';
    if (q('#studyProjectName')) q('#studyProjectName').value = '';
    if (q('#studyProjectCategory')) q('#studyProjectCategory').value = 'jlpt';
    if (q('#studyProjectTargetDate')) q('#studyProjectTargetDate').value = '';
    if (q('#studyProjectSchedule')) q('#studyProjectSchedule').value = 'every_3_days';
    if (q('#studyProjectQuizSize')) q('#studyProjectQuizSize').value = String(DEFAULT_QUIZ_SIZE);
    setFocusAreas([]);
  }

  function openProjectForm(project = null) {
    if (!project) resetProjectForm();
    else {
      const view = normalizeProject(project);
      projectFormMode = 'edit';
      q('#studyProjectEditId').value = project.id;
      q('#studyProjectName').value = view.name;
      q('#studyProjectCategory').value = view.category;
      q('#studyProjectTargetDate').value = view.examDate;
      q('#studyProjectSchedule').value = view.scheduleType;
      q('#studyProjectQuizSize').value = String(view.quizSize);
      setFocusAreas(view.focusAreas);
    }
    toggleProjectForm(true);
  }

  function bindStaticEvents() {
    qa('[data-study-tab]').forEach(btn => btn.addEventListener('click', () => { activeStudyTab = btn.dataset.studyTab || 'board'; activeWrongId = ''; renderLearning(); }));
    q('#studyProjectNew')?.addEventListener('click', () => openProjectForm());
    q('#studyProjectCancel')?.addEventListener('click', () => { resetProjectForm(); toggleProjectForm(false); });
    q('#studyProjectPreset')?.addEventListener('click', () => {
      q('#studyProjectName').value = 'JLPT N3';
      q('#studyProjectCategory').value = 'jlpt';
      q('#studyProjectSchedule').value = 'every_3_days';
      q('#studyProjectQuizSize').value = String(DEFAULT_QUIZ_SIZE);
      setFocusAreas(['어휘','문법','독해','청해']);
      toggleProjectForm(true);
    });
    q('#studyProjectSave')?.addEventListener('click', () => {
      const name = String(q('#studyProjectName')?.value || '').trim();
      if (!name) return alert('프로젝트 이름을 입력해 주세요.');
      const editId = String(q('#studyProjectEditId')?.value || '');
      const duplicate = (state.learningProjects || []).some(x => x.id !== editId && x.status !== 'archived' && String(x.name || '').trim().toLowerCase() === name.toLowerCase());
      if (duplicate) return alert('같은 이름의 활성 학습 프로젝트가 이미 있습니다.');
      const values = {
        name,
        category: q('#studyProjectCategory')?.value || 'other',
        examDate: q('#studyProjectTargetDate')?.value || '',
        targetDate: q('#studyProjectTargetDate')?.value || '',
        focusAreas: selectedFocusAreas(),
        scheduleType: q('#studyProjectSchedule')?.value || 'every_3_days',
        quizSize: Number(q('#studyProjectQuizSize')?.value || DEFAULT_QUIZ_SIZE),
      };
      if (projectFormMode === 'edit' && editId) {
        const project = projectById(editId);
        if (!project || !persistProjectUpdate(project, values)) return;
      } else {
        const row = normalizeProject(values);
        if (!persistNewProject(row)) return;
      }
      resetProjectForm();
      toggleProjectForm(false);
      renderLearning();
    });
  }

  function maybeAutoGenerate(project) {
    const date = localToday(), key = `${project.id}|${date}`;
    if (!shouldGenerateForDate(project, date) || autoGenerationAttempts.has(key) || busy) return false;
    autoGenerationAttempts.add(key);
    Promise.resolve().then(() => generateTodayQuiz(project, { automatic: true }));
    return true;
  }

  async function generateTodayQuiz(project, { automatic = false } = {}) {
    if (normalizeProject(project).status !== 'active') {
      if (!automatic) alert('학습 중인 프로젝트만 새 문제를 생성할 수 있습니다.');
      return false;
    }
    const date = localToday(), key = `${project.id}|${date}`;
    const existing = projectQuizzes(project.id).find(x => quizDate(x) === date);
    if (existing) return selectQuiz(existing.id);
    if (busy) return;
    if (!automatic) autoGenerationAttempts.add(key);
    busy = true;
    renderLearning();
    try {
      const quizSize = normalizeProject(project).quizSize;
      if (typeof haniWorkShow === 'function') haniWorkShow({agent:'hina', title:`히나가 오늘의 ${quizSize}문제를 만들고 있어요!`, step:'HINA · DAILY QUIZ', message:'최근 오답과 프로젝트 목표를 보고 새 문제를 구성합니다.'});
      const questions = await quizApi(project);
      const duplicate = projectQuizzes(project.id).find(x => quizDate(x) === date);
      if (duplicate) return selectQuiz(duplicate.id);
      const sequenceNo = nextSequenceNo(project.id);
      const quiz = normalizeQuiz({ projectId: project.id, date, scheduledDate:date, sequenceNo, title:`${project.name} 문제세트 #${String(sequenceNo).padStart(3, '0')}`, status:'pending', questions, answers:Array(questions.length).fill(null), total:questions.length });
      if (!persistGeneratedQuiz(project, quiz)) throw new Error('퀴즈 저장 검증에 실패했습니다.');
      generationFailures.delete(key);
      if (typeof haniWorkFinish === 'function') haniWorkFinish(true, `오늘의 ${questions.length}문제 준비 완료!`);
      if (typeof haniWorkHide === 'function') haniWorkHide(700);
    } catch (e) {
      generationFailures.set(key, e?.message || String(e));
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
      existing.errorType = question.type || question.topic || 'general';
      existing.lastWrongDate = quizDate(quiz);
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
      type: question.type, topic: question.topic, errorType: question.type || question.topic || 'general',
      firstWrongDate: quizDate(quiz), lastWrongDate: quizDate(quiz),
      wrongCount: 1, retryCount: 0, reviewStatus: 'review', quizId: quiz.id,
      createdAt: nowIso(), updatedAt: nowIso(),
    };
    rows.push(row);
    return row;
  }

  function gradeQuiz(quiz) {
    const project = projectById(quiz.projectId);
    if (!project || quiz.status === 'completed') return;
    const total = Number(quiz.total || quiz.questions.length);
    if (quiz.answers.length !== total || quiz.answers.some(x => !Number.isInteger(x))) return alert(`${total}문제의 답을 모두 선택해 주세요.`);
    const quizSnapshot = cloneLearningValue(quiz);
    const wrongAnswersSnapshot = cloneLearningValue(state.learningWrongAnswers || []);
    const previousQuizId = activeQuizId;
    let correct = 0;
    quiz.questions.forEach((question, index) => {
      if (quiz.answers[index] === question.answerIndex) correct += 1;
      else upsertWrongAnswer(project, quiz, question, quiz.answers[index]);
    });
    quiz.status = 'completed';
    quiz.score = total ? Math.round(correct / total * 100) : 0;
    quiz.correctCount = correct;
    quiz.total = quiz.questions.length;
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
      const quizzes = projectQuizzes(project.id), todayQuiz = quizzes.find(x => quizDate(x) === date);
      if (!todayQuiz && isScheduledDate(project, date)) rows.push({ projectId:project.id, quizId:'', due:date, text:`${project.name} · 오늘 문제세트`, sub:'생성 대상', overdue:false });
      else if (todayQuiz && todayQuiz.status !== 'completed') rows.push({ projectId:project.id, quizId:todayQuiz.id, due:date, text:`${project.name} · 오늘 문제세트`, sub:`${todayQuiz.answers.filter(x => Number.isInteger(x)).length}/${Number(todayQuiz.total || todayQuiz.questions.length)} 풀이`, overdue:false });
      for (const quiz of quizzes.filter(x => x.status !== 'completed' && quizDate(x) < date).slice(0, 3)) rows.push({ projectId:project.id, quizId:quiz.id, due:quizDate(quiz), text:`${project.name} · 미완료 문제세트`, sub:`${quizDate(quiz)} · ${quiz.answers.filter(x => Number.isInteger(x)).length}/${Number(quiz.total || quiz.questions.length)}`, overdue:true });
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

  window.HANI_STUDY_V02984_TEST = {
    ensureLearningState, normalizeProject, normalizeQuestion, normalizeQuiz, questionKey,
    quizDate, isScheduledDate, shouldGenerateForDate, nextSequenceNo, derivedLearningTasks, activeProjects, boardProjects, completedProjects, wrongRows, wrongGroups, renderWrongTab,
    upsertWrongAnswer, persistNewProject, persistProjectUpdate, archiveProjectWithConfirmation,
    pauseProject, resumeProject, completeProjectWithConfirmation, confirmWrongAnswer, retryWrongAnswer, masterWrongAnswer,
    persistGeneratedQuiz, persistQuizAnswer, gradeQuiz,
  };

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
    console.info('[HANI OS] v2.9.87 Learning Board v1.1 ready');
  }

  boot();
})();
