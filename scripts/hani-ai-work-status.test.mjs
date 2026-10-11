import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../hani-main.js',import.meta.url),'utf8').replace(/\r\n/g,'\n');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const versionAtLeast=(value,minimum)=>{
  const match=value.match(/^v(\d+)\.(\d+)\.(\d+)$/);assert.ok(match,'semantic version: '+value);
  const parts=match.slice(1).map(Number);
  for(let i=0;i<3;i++)if(parts[i]!==minimum[i])return parts[i]>minimum[i];
  return true;
};
const validDate=value=>{
  assert.match(value,/^\d{4}-\d{2}-\d{2}$/,'dated catalog snapshot');
  const date=new Date(value+'T00:00:00Z');assert.ok(Number.isFinite(date.getTime()),'valid date');
  assert.equal(date.toISOString().slice(0,10),value,'calendar date');
  assert.ok(value>='2026-10-11','snapshot must not regress');
};
const workSection=html.match(/<section\b[^>]*\bid="aiWork"[^>]*>([\s\S]*?)<\/section>/);
assert.ok(workSection,'AI work section');
const validateSummary=markup=>{
  const summary=markup.match(/<p class="sub">(\d{4}-\d{2}-\d{2}) 기준 · (v\d+\.\d+\.\d+) 반영 완료 · (v\d+\.\d+\.\d+) 후보 진행 중\./);
  assert.ok(summary,'dated shipped/candidate summary');validDate(summary[1]);
  assert.ok(versionAtLeast(summary[2],[2,9,208]),'shipped version >= v2.9.208');
  assert.ok(versionAtLeast(summary[3],[2,9,209]),'candidate version >= v2.9.209');
  assert.ok(!versionAtLeast(summary[2],summary[3].slice(1).split('.').map(Number)),'candidate follows shipped');
  return summary;
};
const summary=validateSummary(workSection[1]);
// Future snapshots still pass; stale versions, invalid dates and reversed status fail.
validateSummary('<p class="sub">2027-01-01 기준 · v2.10.0 반영 완료 · v2.10.1 후보 진행 중.');
for(const text of [
  '2026-10-11 기준 · v2.9.207 반영 완료 · v2.9.209 후보 진행 중.',
  '2026-10-11 기준 · v2.9.208 반영 완료 · v2.9.208 후보 진행 중.',
  '2026-10-11 기준 · v2.10.1 반영 완료 · v2.10.0 후보 진행 중.',
  '2026-02-30 기준 · v2.9.208 반영 완료 · v2.9.209 후보 진행 중.',
  '2026-10-10 기준 · v2.9.208 반영 완료 · v2.9.209 후보 진행 중.'
])assert.throws(()=>validateSummary('<p class="sub">'+text));
const catalog=source.slice(source.indexOf('const developmentTeam='),source.indexOf('const TEAM_PROFILE_META='));
const extract=name=>{const hit=source.match(new RegExp('function '+name+'\\([^\\n]*\\}[ \\t]*(?=\\n)|function '+name+'\\([^]*?\\n\\}'));assert.ok(hit,name);return hit[0];};
const nodes=new Map(),node=id=>nodes.get(id)||nodes.set(id,{innerHTML:'',textContent:'',onclick:null}).get(id);
const ctx=vm.createContext({$:node,team:[{key:'hani'}],TEAM_PROFILE_META:{hani:{}},agentImages:{},sidebarAgentImages:{},activeTeamProfileKey:'',esc:s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),updateTeamActiveState(){},showView(){},localStorage:{setItem(){throw Error('no work catalog writes')}},commit(){throw Error('no work catalog commit')}});
vm.runInContext(catalog+'\nglobalThis.catalog=developmentTeam;',ctx);
for(const name of ['teamMeta','teamByKey','teamCard','teamListHtml','renderTeamProfile'])vm.runInContext(extract(name),ctx);
assert.deepEqual(Array.from(ctx.catalog,x=>x.name),['서윤','도연','세린','하니 전무','유리','아린','히나']);
assert.equal(new Set(ctx.catalog.map(x=>x.key)).size,7);
for(const member of ctx.catalog){
  validDate(member.updatedAt);assert.equal(member.updatedAt,summary[1],'profile and summary snapshot agree');
  assert.ok(member.now.length);assert.ok(member.next.length);
  assert.ok(member.recent.length>=3&&member.recent.length<=5);
  for(const field of ['now','recent','next']){
    assert.ok(Array.isArray(member[field]),field+' list');
    for(const item of member[field])assert.equal(typeof item,'string',field+' text');
  }
  const recentVersions=member.recent.map(item=>{
    const version=item.match(/^v\d+\.\d+\.\d+/);assert.ok(version,'recent shipped version');
    assert.ok(versionAtLeast(version[0],[2,9,200]),'recent history >= v2.9.200');return version[0];
  });
  assert.ok(recentVersions.some(version=>versionAtLeast(version,[2,9,208])),'v2.9.208 or newer shipped work');
  assert.ok(member.now.some(item=>{
    const version=item.match(/^v\d+\.\d+\.\d+/);return version&&versionAtLeast(version[0],[2,9,209]);
  }),'v2.9.209 or newer work in progress');
  ctx.renderTeamProfile(member.key);const rendered=node('developmentTeamProfilePanel').innerHTML;
  for(const label of ['지금 하는 일','최근 완료','다음 할 일',member.updatedAt,member.name])assert.ok(rendered.includes(label),member.name+' '+label);
  for(const item of [...member.now,...member.recent,...member.next])assert.ok(rendered.includes(ctx.esc(item)),member.name+' item rendered');
  assert.match(rendered,/개별 AI의 독립 검수 완료를 뜻하지 않습니다/);
}
// The catalog is a dated snapshot, independent of the machine's current date.
assert.doesNotMatch(html,/Claude와 Codex 에이전트는 추후 등록/);
console.log('PASS AI work status: 7 staff, dated static catalog, 3–5 versioned shipped items each, actual profile renderer, no writes');
