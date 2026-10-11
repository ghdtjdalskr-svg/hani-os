import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';
import * as P from '../supabase/functions/hani-newsroom-publisher/comment-persona.mjs';
import {LOUNGE_VOICES} from '../supabase/functions/hani-newsroom-publisher/lounge-voices.mjs';
const seed=JSON.parse(fs.readFileSync('data/hani-relationship-seed-v1.json','utf8'));
test('persona seed snapshot is canonical including honorific opt-in and aliases',()=>{
  const policy=P.compactPersonaPolicy();
  for(const p of seed.people.filter(p=>p.id!=='seongmin'))assert.deepEqual(LOUNGE_VOICES[p.id],{voice:p.voice,say:p.commentStyle,avoid:p.avoidTopics,oppa:p.callsChairmanOppa});
  assert.equal(policy.nauen,policy.naeun);assert.equal(policy.suyeon,policy.sooyeon);
});
test('all persona templates are short, natural, number-free and honorific safe',()=>{
  for(const [key,templates] of Object.entries(P.COMMENT_TEMPLATES))for(const s of templates){assert.ok(P.validCommentText(key,s),key+': '+s);assert.ok(s.length<=160);assert.doesNotMatch(s,/\d|에 관한 제 생각:|종합적으로|판단됩니다/);}
  for(const phrase of ['이 기사에 관한 제 생각: 좋아요.','종합적으로 판단됩니다.','주목할 필요가 있습니다.','검토 결과 유효합니다.'])assert.equal(P.validCommentText('serin',phrase),false);
  assert.equal(P.validCommentText('yuna','오빠, 확인할게요.'),false);assert.equal(P.validCommentText('serin','이건 그냥 좋아.'),false);assert.equal(P.validCommentText('yuna','x'.repeat(161)),false);
  assert.equal(P.validCommentText('jieun','영업이익 30%는 눈에 띄네.',{summary:'영업이익 20% 증가'}),false);
  assert.equal(P.validCommentText('jieun','영업이익 20%는 눈에 띄네.',{summary:'영업이익 20% 증가'}),true);
  assert.equal(P.validCommentText('jieun','영업이익 20%는 눈에 띄네.',{summary:'영업이익 120% 증가'}),false);
  assert.ok(P.validCommentText('serin','앞 댓글처럼 비교 기준이 궁금해요.'));
});
test('count/variation plans and serious styles, normalization and safe fallback',()=>{
  for(let i=0;i<200;i++)assert.ok([2,3,4].includes(P.drawCommentCount()));
  assert.equal(P.commentVariationPlan(1,()=>0.1)[0].relationship_ok,true);assert.equal(P.commentVariationPlan(1,()=>0.8)[0].relationship_ok,false);
  for(const key of Object.keys(P.COMMENT_PERSONAS))for(const style of Object.keys(P.effectiveStyleWeights(key,true)))assert.ok(!P.LIGHT_STYLES.has(style));
  const input=[{agent_key:'nauen',comment:'이건 실제 생활에서 어떨까?',tone:'LIFE'},{agent_key:'nauen',comment:'중복'},{agent_key:'serin',comment:'오빠, 90%나 올라요.'},{agent_key:'yuna',comment:'종합적으로 판단됩니다.'}];
  const before=JSON.stringify(input),out=P.normalizeNewsComments(input,{summary:'상승 소식'},4);
  assert.equal(out.length,4);assert.equal(new Set(out.map(c=>c.agent_key)).size,4);assert.equal(JSON.stringify(input),before);
  for(const c of out)assert.ok(P.validCommentText(c.agent_key,c.comment));
  assert.equal(P.normalizeNewsComments([],{},2).length,2);
});
function server(file,exports,fetch){
  let source=fs.readFileSync(file,'utf8').replace(/^import .*;\r?\n/gm,'');
  source+='\nthis.api={'+exports.join(',')+'};';
  const context=vm.createContext({...P,fetch,console,URL,TextEncoder,Uint32Array,crypto:globalThis.crypto,Date,Math,Response,Request,Deno:{env:{get:()=>undefined},serve:()=>{}},createClient:()=>{throw Error('unexpected database access');}});
  vm.runInContext(stripTypeScriptTypes(source),context);return context.api;
}
test('both actual server paths use identical lounge instructions and execute same comment guard',async()=>{
  const article={title:'기업 제품 발표',summary:'신제품을 발표했습니다.',why_it_matters:'출시 일정 확인',comments:[{agent_key:'serin',agent_name:'세린',tone:'QUESTION',comment:'오빠, 300% 성장하겠어요.'}]};
  const parsed={entities:[{name:'기업',ticker:'ABC',market:'US',news:[article]}],weekly_brief:{}};
  const captures=[];
  const fetch=async(url,options)=>{const b=JSON.parse(options.body);captures.push(b);return new Response(JSON.stringify({output_text:JSON.stringify(parsed),output:[],status:'completed'}));};
  const auto=server('supabase/functions/hani-newsroom-publisher/index.ts',['runInterestSearch','INTEREST_SCHEMA'],fetch);
  const manual=server('supabase/functions/hani-agent-orchestrator/index.ts',['runInvestmentNews','INVESTMENT_NEWS_SCHEMA'],fetch);
  const targets=[{name:'기업',ticker:'ABC',market:'US'}];
  for(const result of [await auto.runInterestSearch('test',targets),await manual.runInvestmentNews('test',targets,72)]){
    assert.ok(result.entities[0].news[0].comments.length>=2);for(const c of result.entities[0].news[0].comments)assert.ok(P.validCommentText(c.agent_key,c.comment,article));
  }
  for(const b of captures){assert.ok(b.instructions.includes(P.newsroomCommentInstructions()));const input=typeof b.input==='string'?JSON.parse(b.input):b.input;assert.ok(input.comment_count_plan.every(c=>c>=2&&c<=4));assert.ok(input.persona_policy.serin.say.includes('근거'));}
  for(const schema of [auto.INTEREST_SCHEMA,manual.INVESTMENT_NEWS_SCHEMA]){const c=schema.properties.entities.items.properties.news.items.properties.comments;assert.equal(c.minItems,2);assert.equal(c.maxItems,4);assert.equal(c.items.properties.comment.maxLength,160);}
});
