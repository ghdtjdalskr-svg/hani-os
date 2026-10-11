import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import vm from 'node:vm';
import test from 'node:test';

const edge = readFileSync(new URL('../supabase/functions/hani-learning-quiz/index.ts', import.meta.url), 'utf8');
const now = Date.parse('2026-10-11T12:00:00Z');
class FixedDate extends Date { static now() { return now; } }
function server(questions = []) {
  let handler, request;
  const context = vm.createContext({URL, Request, Response, Date: FixedDate,
    Deno: {env: {get: key => ({SUPABASE_URL:'https://example.test', SUPABASE_ANON_KEY:'test-public', OPENAI_API_KEY:'test-only', HANI_OWNER_USER_ID:'test-owner'}[key])}, serve: value => { handler = value; }},
    createClient: () => ({auth: {getUser: async () => ({data: {user: {id:'test-owner'}}, error:null})}}),
    fetch: async (url, options) => {
      assert.equal(url, 'https://api.openai.com/v1/responses');
      request = JSON.parse(options.body);
      return new Response(JSON.stringify({output_text: JSON.stringify({questions}), model:'test-model'}));
    },
  });
  vm.runInContext(stripTypeScriptTypes(edge.replace(/^import .*;\r?\n/gm, '') + '\nthis.api = {systemPrompt, newsBalance, isBasicEconomyProject, preferRecentMacroSources, newsMaterialCount, newsMaterialDiagnostics, canonicalNewsContext};'), context);
  return {api:context.api, get request() { return request; },
    run: body => handler(new Request('https://example.test/quiz', {method:'POST', headers:{Authorization:'Bearer test-session'}, body:JSON.stringify(body)}))};
}
const {api} = server();
const plain = value => JSON.parse(JSON.stringify(value));
const source = {source_id:'N1', title:'기준금리 동결 소식', summary:'중앙은행은 기준금리를 동결했다. 물가 흐름을 관찰한다.', source_name:'경제 뉴스', source_url:'https://example.test/news/1', published_at:'2026-10-10T12:00:00Z', material:'news'};
function news(s = source) {
  return {type:'Cause & Effect', topic:'기준금리', difficulty:'easy',
    prompt:`[실제 뉴스 · 자료 기준일 ${s.published_at.slice(0,10)}]\n${s.title}\n출처: ${s.source_name}\n${s.material === 'macro' ? '[저장된 브리핑 요약]' : '[뉴스 요약]'} ${s.summary.slice(0,260)}\n[질문] 다른 조건이 일정할 때 금리와 채권가격의 관계는?`,
    choices:['역관계', '같은 방향', '무관', '항상 동일'], answer_index:0,
    explanation:`금리와 기존 채권가격은 역관계이다. 같은 방향이라는 오답은 고정 이자채권의 상대 가치를 혼동한다. [${s.source_id}] ${s.source_name} · 자료 기준일 ${s.published_at.slice(0,10)} · ${s.source_url}`};
}
function concept() {
  return {type:'Definition', topic:'분산투자', difficulty:'easy', prompt:'분산투자의 목적은?', choices:['위험 분산','수익 보장','손실 금지','한 종목 집중'], answer_index:0, explanation:'위험을 분산한다. 수익을 보장하지는 않는다.'};
}

test('economy builder includes Serin gloss, premise, misconceptions and tempting-wrong-option explanation', () => {
  const prompt = api.systemPrompt(20,7,'economy',2,false,7);
  for (const term of ['쉬운 한국어 뜻', '다른 조건이 일정할 때', '오개념', '상호 배타적', '모두 정답/모두 틀림', '3~4문장', '가장 매력적인 오답', '예측형 질문은 금지', '업종 특성·ROE·성장률']) assert.ok(prompt.includes(term), term);
  for (const category of ['jlpt','other']) {
    const unrelated = api.systemPrompt(20,7,category,2,false,0);
    assert.ok(!unrelated.includes('ceteris paribus'));
    assert.ok(!unrelated.includes('PER/PBR/EPS'));
  }
});

test('basic project detection works with current client name/goal/focus fields and explicit level', () => {
  for (const project of [{level:'기초'}, {name:'주식·경제·거시경제 기초'}, {goal:'기초 원리 이해'}, {focus_areas:['경제기초']}, {difficulty:'basic'}]) assert.equal(api.isBasicEconomyProject({category:'economy',...project}), true);
  assert.equal(api.isBasicEconomyProject({category:'economy',level:'심화',name:'기초 복습과 심화'}), false);
  assert.equal(api.isBasicEconomyProject({category:'jlpt',level:'기초'}), false);
});

test('basic quotas clamp legacy client minima and reserve a third for all six core concept groups', () => {
  for (const size of [1,3,5,10,15,20]) {
    const balance = api.newsBalance(size,2,'economy',Math.ceil(size/3),true);
    assert.deepEqual(plain(balance), {minimum:Math.floor(size/4), maximum:Math.floor(size/4), coreMinimum:Math.ceil(size/3)});
    const prompt = api.systemPrompt(size,2,'economy',2,false,balance.minimum,true);
    assert.ok(prompt.includes(`최대 ${Math.floor(size/4)}문제`));
    assert.ok(prompt.includes(`최소 ${Math.ceil(size/3)}문제(전체의 약 1/3)`));
    for (const term of ['PER/PBR/EPS','기준금리','채권가격-금리','환율-수입물가','인플레이션','분산투자']) assert.ok(prompt.includes(term));
  }
  assert.equal(api.newsBalance(20,2,'economy',undefined,true).minimum,5);
  assert.equal(api.newsBalance(20,0,'economy',7,true).minimum,0);
  assert.equal(api.newsBalance(20,2,'economy',0,true).minimum,0, 'retry needing no more news');
  assert.equal(api.newsBalance(20,2,'economy',undefined,false).minimum,7);
  assert.equal(api.newsBalance(20,2,'economy',10,false).minimum,10);
  assert.equal(api.newsBalance(20,2,'jlpt',7,false).minimum,0);
  assert.ok(!api.systemPrompt(20,7,'economy',2,false,7).includes('전체의 약 1/4'));
});

test('no-source and retry prompts retain fallback and add basic core coverage without current-news invention', () => {
  const prompt = api.systemPrompt(5,2,'economy',0,true,0,true);
  assert.ok(prompt.includes('최신 사건인 것처럼 꾸미지 말고'));
  assert.ok(prompt.includes('보충하는 재시도'));
  assert.ok(prompt.includes('최소 0문제'));
  assert.ok(prompt.includes('최소 2문제(전체의 약 1/3)'));
});

test('macro sources at seven days are preferred to dated older indicators without mutating archive input', () => {
  const dated = (id, days, title) => ({...source, source_id:id, title, published_at:new Date(now-days*86400000).toISOString()});
  const items = [dated('N1',8,'CPI 발표'), {...dated('N2',1,'기업 실적'),summary:'기업이 신제품을 발표했다.'}, dated('N3',7,'환율 동향'), dated('N4',2,'고용 보고서')];
  const before = JSON.stringify(items);
  assert.deepEqual(plain(api.preferRecentMacroSources(items)).map(s=>s.source_id), ['N3','N4','N2','N1']);
  assert.equal(JSON.stringify(items),before);
  const prompt = api.systemPrompt(20,7,'economy',4,false,7);
  for (const term of ['7일 이내','최대 21일 이내','자료 기준일 YYYY-MM-DD','그 당시의 상황','현재·지금·최신 수치로 표현하지 마세요']) assert.ok(prompt.includes(term));
});

test('diagnostics and actual news count accept whitespace/newline variations for articles and briefings', () => {
  for (const material of ['news','macro']) for (const whitespace of ['  ','\n','\r\n','\t','\u00a0','']) {
    const s = {...source,material};
    const q = news(s);
    q.prompt = q.prompt.replace(/ /g,whitespace);
    q.explanation = q.explanation.replace('[N1]',`[${whitespace}N1${whitespace}]`);
    assert.equal(api.newsMaterialCount([q],[s]),1,`${material}: ${JSON.stringify(whitespace)}`);
    assert.deepEqual(plain(api.newsMaterialDiagnostics([q],[s]))[0].missing,[]);
  }
});

test('incorrect dates, text, source identity, URLs and briefing labels are still rejected', () => {
  for (const [field, edit] of [
    ['date', q => {q.prompt=q.prompt.replace('2026-10-10','2026-10-09');}],
    ['title', q => {q.prompt=q.prompt.replace(source.title,'다른 기사');}],
    ['summary', q => {q.prompt=q.prompt.replace(source.summary,'반대 내용');}],
    ['source_name', q => {q.prompt=q.prompt.replace(source.source_name,'다른 출처');}],
    ['source_id', q => {q.explanation=q.explanation.replace('[N1]','[N2]');}],
    ['source_url', q => {q.explanation=q.explanation.replace(source.source_url,'https://example.test/news/2');}],
  ]) {
    const q = news(); edit(q);
    assert.equal(api.newsMaterialCount([q],[source]),0,field);
    assert.ok(plain(api.newsMaterialDiagnostics([q],[source]))[0].missing.includes(field),field);
  }
  const s = {...source,material:'macro'}, q=news(s);
  q.prompt=q.prompt.replace('[저장된 브리핑 요약]','[뉴스 요약]');
  assert.equal(api.newsMaterialCount([q],[s]),0);
  assert.ok(plain(api.newsMaterialDiagnostics([q],[s]))[0].missing.includes('briefing_label'));
  assert.equal(api.newsMaterialDiagnostics([concept()],[source])[0].source_id,null);
});

test('canonical context tolerates formatting, preserves question focus and never repairs a mismatched source', () => {
  const q = news();
  q.prompt=' \n'+q.prompt.replace(/ /g,'\n').replace('[질문]','[ 질문 ]');
  const before=JSON.stringify(q), canonical=api.canonicalNewsContext(q,[source]);
  assert.ok(canonical.prompt.startsWith('[실제 뉴스 · 자료 기준일 2026-10-10]'));
  assert.ok(canonical.prompt.includes(source.summary));
  assert.ok(canonical.prompt.endsWith('다른\n조건이\n일정할\n때\n금리와\n채권가격의\n관계는?'));
  assert.equal(JSON.stringify(q),before);
  const wrongDate={...q,prompt:q.prompt.replace('2026-10-10','2026-10-09')};
  assert.equal(api.canonicalNewsContext(wrongDate,[source]),wrongDate);
  assert.equal(api.canonicalNewsContext(concept(),[source]).type,'Definition');
  const ambiguous={...q,explanation:q.explanation+' [N2]'};
  assert.equal(api.canonicalNewsContext(ambiguous,[source,{...source,source_id:'N2'}]),ambiguous);
});

test('actual server accepts five formatted news questions for basic twenty-question set instead of returning 502', async () => {
  const questions=[...Array.from({length:5},()=>{const q=news(); q.prompt=q.prompt.replace(/ /g,'\r\n'); return q;}),...Array.from({length:15},concept)];
  const fixture=server(questions);
  const response=await fixture.run({project:{name:'주식·경제·거시경제 기초',category:'economy',quiz_size:20}, question_sources:[source], engine_contract:{news_material_minimum:7}});
  assert.equal(response.status,200);
  const result=await response.json();
  assert.equal(result.news_material_minimum,5);
  assert.equal(result.db_write,false); assert.equal(result.hani_state_touched,false);
  assert.ok(fixture.request.instructions.includes('최대 5문제'));
  assert.ok(fixture.request.instructions.includes('최소 7문제(전체의 약 1/3)'));
  assert.equal(JSON.parse(fixture.request.input).engine_contract.news_material_minimum,5);
  assert.equal(result.quiz.questions.length,20);
});

test('actual server keeps non-basic news minimum and rejects missing dates with useful diagnostics', async () => {
  const bad=news(); bad.prompt=bad.prompt.replace('자료 기준일 2026-10-10','자료 시점 불명');
  const fixture=server([bad,...Array.from({length:4},concept)]);
  const response=await fixture.run({project:{name:'경제 심화',category:'economy',quiz_size:5}, question_sources:[source], engine_contract:{news_material_minimum:1}});
  assert.equal(response.status,502);
  const result=await response.json();
  assert.equal(result.error,'QUIZ_NEWS_MATERIAL_MISSING');
  assert.equal(result.validation.required,1); assert.equal(result.validation.matched,0);
  assert.deepEqual(result.validation.questions[0].missing,['date']);
});

test('actual server filters sources past 21 days/future and sends recent macro first with dated older fallback', async () => {
  const dated=(id,days)=>({...source,source_id:id,title:'CPI 발표',published_at:new Date(now-days*86400000).toISOString()});
  const fixture=server(Array.from({length:5},concept));
  const response=await fixture.run({project:{name:'경제 기초',category:'economy',quiz_size:5}, question_sources:[dated('N1',21),dated('N2',7),dated('N3',22),dated('N4',-1)], engine_contract:{news_material_minimum:0}});
  assert.equal(response.status,200);
  assert.deepEqual(JSON.parse(fixture.request.input).question_sources.map(s=>s.source_id),['N2','N1']);
  assert.equal(fixture.request.store,false);
});

test('older macro fallback requires its explicit reference date even with whitespace variations', () => {
  const s={...source,material:'macro',published_at:new Date(now-21*86400000).toISOString()};
  const q=news(s); q.prompt=q.prompt.replace(/ /g,'\n');
  assert.equal(api.newsMaterialCount([q],[s]),1);
  q.prompt=q.prompt.replace(`자료\n기준일\n${s.published_at.slice(0,10)}`,'지난 자료');
  assert.equal(api.newsMaterialCount([q],[s]),0);
  assert.deepEqual(plain(api.newsMaterialDiagnostics([q],[s]))[0].missing,['date']);
});
