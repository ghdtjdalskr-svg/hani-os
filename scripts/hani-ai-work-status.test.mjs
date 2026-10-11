import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../hani-main.js',import.meta.url),'utf8').replace(/\r\n/g,'\n');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const catalog=source.slice(source.indexOf('const developmentTeam='),source.indexOf('const TEAM_PROFILE_META='));
const extract=name=>{const hit=source.match(new RegExp('function '+name+'\\([^\\n]*\\}[ \\t]*(?=\\n)|function '+name+'\\([^]*?\\n\\}'));assert.ok(hit,name);return hit[0];};
const nodes=new Map(),node=id=>nodes.get(id)||nodes.set(id,{innerHTML:'',textContent:'',onclick:null}).get(id);
const ctx=vm.createContext({$:node,team:[{key:'hani'}],TEAM_PROFILE_META:{hani:{}},agentImages:{},sidebarAgentImages:{},activeTeamProfileKey:'',esc:s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),updateTeamActiveState(){},showView(){},localStorage:{setItem(){throw Error('no work catalog writes')}},commit(){throw Error('no work catalog commit')}});
vm.runInContext(catalog+'\nglobalThis.catalog=developmentTeam;',ctx);
for(const name of ['teamMeta','teamByKey','teamCard','teamListHtml','renderTeamProfile'])vm.runInContext(extract(name),ctx);
assert.deepEqual(Array.from(ctx.catalog,x=>x.name),['서윤','도연','세린','하니 전무','유리','아린','히나']);
assert.equal(new Set(ctx.catalog.map(x=>x.key)).size,7);
for(const member of ctx.catalog){
  assert.equal(member.updatedAt,'2026-10-11');assert.ok(member.now.length);assert.ok(member.next.length);
  assert.ok(member.recent.length>=3&&member.recent.length<=5);
  for(const item of member.recent)assert.match(item,/v2\.9\.20[0-4]/,'recent shipped version');
  ctx.renderTeamProfile(member.key);const rendered=node('developmentTeamProfilePanel').innerHTML;
  for(const label of ['지금 하는 일','최근 완료','다음 할 일','2026-10-11',member.name])assert.ok(rendered.includes(label),member.name+' '+label);
  for(const item of [...member.now,...member.recent,...member.next])assert.ok(rendered.includes(ctx.esc(item)),member.name+' item rendered');
  assert.match(rendered,/개별 AI의 독립 검수 완료를 뜻하지 않습니다/);
}
// The catalog is a dated snapshot, independent of the machine's current date.
assert.match(html,/2026-10-11 기준 · v2.9.207 후보 진행 중/);
assert.doesNotMatch(html,/Claude와 Codex 에이전트는 추후 등록/);
console.log('PASS AI work status: 7 staff, dated static catalog, 3–5 versioned shipped items each, actual profile renderer, no writes');
