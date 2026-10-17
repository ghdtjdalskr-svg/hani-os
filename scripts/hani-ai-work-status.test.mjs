// JSON is the read-only status owner; local identities and the actual profile renderer stay canonical.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
const source=read('hani-main.js'),html=read('index.html'),data=JSON.parse(read('assets/data/ai-team-status.json'));
assert.match(html,/<p[^>]*id="aiTeamStatusSummary"/);
assert.match(data.updatedAt,/^\d{4}-\d{2}-\d{2}$/);
assert.equal(new Date(data.updatedAt+'T00:00:00Z').toISOString().slice(0,10),data.updatedAt);
assert.match(data.productionVersion,/^\d+\.\d+\.\d+$/);
const nodes=new Map(),node=id=>nodes.get(id)||nodes.set(id,{innerHTML:'',textContent:'',querySelectorAll:()=>[]}).get(id);
let requests=0;
const ctx=vm.createContext({$:node,team:[{key:'hani'}],agentImages:{},sidebarAgentImages:{},activeTeamProfileKey:'',document:{querySelectorAll:()=>[]},AbortController,setTimeout,clearTimeout,
 fetch:async(url,options)=>{requests++;assert.equal(url,'./assets/data/ai-team-status.json');assert.equal(options.cache,'no-store');return {ok:true,json:async()=>structuredClone(data)}},
 esc:s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),showView(){},
 localStorage:{setItem(){throw Error('no work status writes')},removeItem(){throw Error('no removes')},clear(){throw Error('no clears')}},commit(){throw Error('no work status commit')}});
vm.runInContext(source.slice(source.indexOf('const developmentTeam='),source.indexOf('// ===== v2.9.0 Campus MVP'))+'\nglobalThis.catalog=developmentTeam;renderTeam=()=>{};',ctx);
await ctx.loadAiTeamStatus();await ctx.loadAiTeamStatus();assert.equal(requests,1,'one cached request');
assert.ok(node('aiTeamStatusSummary').textContent.includes(data.updatedAt));
assert.ok(node('aiTeamStatusSummary').textContent.includes('운영 v'+data.productionVersion));
assert.deepEqual(Array.from(ctx.catalog,x=>x.name),['서윤','도연','세린','하니 전무','유리','아린','히나']);
assert.equal(new Set(ctx.catalog.map(x=>x.key)).size,7);
for(const member of ctx.catalog){
 const rows=data.members.filter(x=>x.id===member.imageKey);assert.equal(rows.length,1);const status=rows[0];
 for(const field of ['now','recent','next'])assert.ok(Array.isArray(status[field])&&status[field].length&&status[field].every(x=>typeof x==='string'&&x.trim()));
 ctx.renderTeamProfile(member.key);const rendered=node('developmentTeamProfilePanel').innerHTML;
 for(const label of ['지금 하는 일','최근 완료','다음 할 일',data.updatedAt,member.name,status.role,...status.now,...status.recent,...status.next])assert.ok(rendered.includes(ctx.esc(label)),member.name+' '+label);
 assert.match(rendered,/검증·승인·운영 반영 여부는 각 작업의 인수인계/);
}
vm.runInContext('aiTeamStatus=null;',ctx);ctx.renderTeamProfile(ctx.catalog[0].key);
assert.match(node('developmentTeamProfilePanel').innerHTML,/현황을 불러오지 못했어요/);
console.log('PASS AI work status: 7 local identities, JSON load/cache, dated summary, actual profile render, safe unavailable state, no writes');
