// node scripts/hani-milestones-grade-ui.test.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const code = fs.readFileSync(new URL('../hani-milestones.js', import.meta.url), 'utf8');
let writes = 0;
const deny = () => { writes++; throw Error('Unexpected write'); };
const context = vm.createContext({window:{}, console, save:deny, localStorage:{setItem:deny,removeItem:deny,clear:deny}, sessionStorage:{setItem:deny,removeItem:deny,clear:deny}});
vm.runInContext(code, context);
const api = context.window.HaniMilestones, seed = JSON.parse(JSON.stringify(api.SEED[0]));
const keys = ['LEGENDARY','EPIC','RARE','RECORD'];
const rows = keys.flatMap((key, i) => ['HEALTH','LIFE'].map((category,j) => ({...seed,id:'milestone_fixture_'+i+'_'+j,category,grade:key === 'RECORD' ? null : key,date:'2026-10-'+(20+i)})));
let checks = 0;
function check(name, run) { run(); console.log('PASS', name); checks++; }
check('native card button, grade stars, no long-card fields', () => {
  keys.forEach((key,i) => {
    const markup = api.card(rows[i*2]);
    assert.ok(markup.includes('ms-grade-'+key.toLowerCase()));
    assert.equal(markup.match(/class="ms-stars"[^>]*>([^<]+)/)[1], '★'.repeat(5-i));
    assert.match(markup, /<button type="button"[\s\S]*aria-haspopup="dialog"/);
    assert.doesNotMatch(markup, /ms-highlight|ms-quote|ms-metric-list|\sid=/);
  });
});
check('grade AND category filtering, sorting and scoped counts', () => {
  for (const category of ['ALL','HEALTH','LIFE','TRAVEL']) for (const grade of ['ALL',...keys]) {
    const expected = rows.filter(m => (category === 'ALL' || m.category === category) && (grade === 'ALL' || (m.grade || 'RECORD') === grade));
    assert.equal(api.filtered(rows,category,grade).length,expected.length);
    for (const sort of ['newest','oldest','importance','category']) {
      const markup = api.list(rows,{category,grade,sort});
      assert.equal((markup.match(/class="ms-item"/g)||[]).length,expected.length);
      assert.deepEqual([...markup.matchAll(/data-ms-open="([^"]+)"/g)].map(m=>m[1]),Array.from(api.sorted(expected,sort),m=>m.id));
    }
    const filters=api.gradeFilters(rows,{category,grade});
    assert.equal((filters.match(/data-ms-grade=/g)||[]).length,4);
    const count=category==='ALL'?2:category==='TRAVEL'?0:1;
    assert.equal((filters.match(new RegExp('<em>'+count+'<span','g'))||[]).length,4);
  }
});
check('MOMENT is presentation only; null, empty and absent stay untouched', () => {
  for (const grade of [null,undefined,'']) {
    const m={...seed,grade}, before=JSON.stringify(m);
    assert.match(api.card(m), /MOMENT[\s\S]*소중한 순간/);
    assert.equal(JSON.stringify(m),before);
  }
  assert.match(api.gradeFilters(rows), /MOMENT[\s\S]*소중한 순간/);
});
check('one year boundary per year for every sort', () => {
  const mixed=[...rows,{...rows[0],id:'milestone_old',date:'2025-01-01'}];
  for(const sort of ['newest','oldest','importance','category']) {
    const markup=api.list(mixed,{sort});
    assert.equal((markup.match(/class="ms-year"/g)||[]).length,2);
    assert.equal((markup.match(/data-ms-open=/g)||[]).length,9);
  }
});
check('atlas special override, all ten categories, unknown fallback and positions', () => {
  assert.equal(api.artKey(seed),'health-legendary');
  api.CATEGORIES.forEach(c=>assert.equal(api.artKey({...seed,id:'milestone_other',category:c.id}),'cat-'+c.id.toLowerCase()));
  assert.equal(api.artKey({...seed,id:'milestone_other',category:'UNKNOWN'}),'cat-other');
  assert.match(api.card({...seed,id:'milestone_other',category:'FINANCE'}), /background-position:66\.66666666666667% 0%/);
  assert.match(api.card({...seed,id:'milestone_other',category:'OTHER'}), /background-position:66\.66666666666667% 100%/);
});
check('NEW is a 14-day creation window, rejects future and invalid dates', () => {
  const now=Date.parse('2026-10-30T00:00:00Z'), day=86400000;
  for(const age of [0,13*day,14*day-1]) assert.equal(api.isNew({createdAt:new Date(now-age).toISOString()},now),true);
  for(const age of [-1,14*day,100*day]) assert.equal(api.isNew({createdAt:new Date(now-age).toISOString()},now),false);
  assert.equal(api.isNew({createdAt:'bad'},now),false);
  assert.equal(api.isNew({},now),false);
});
check('detail keeps every field, primary featured metric and escaped text', () => {
  const m={...seed,featuredMetrics:['glucose','weight'],chairmanComment:'회장 검증 코멘트',images:[{src:'./assets/example.webp',alt:'검증 그림',caption:'검증 캡션'}]};
  const detail=api.detailSheet(m);
  for(const value of [m.title,m.summary,m.description,'과정 / 배경','이 변화의 의미','다음 목표','담당 Agent','Agent Comment','회장 검증 코멘트','검증 캡션','관련 HANI OS 기능',...m.metrics.map(x=>x.label),...m.tags,...m.nextGoals]) assert.ok(detail.includes(value),value);
  assert.match(detail,/ms-highlight-label">혈당[\s\S]*91mg\/dL/);
  assert.ok(detail.includes('211'));
  assert.doesNotMatch(api.detailSheet({...m,title:'<img src=x onerror=alert(1)>'}), /<img src=x/);
});
check('renders are immutable and introduce zero ids or writes', () => {
  const before=JSON.stringify(rows);
  rows.forEach(m=>{api.card(m);api.detailSheet(m);}); api.list(rows); api.gradeFilters(rows);
  assert.equal(JSON.stringify(rows),before); assert.equal(writes,0);
  assert.doesNotMatch(api.list([...rows,...rows])+api.gradeFilters(rows)+api.detailSheet(seed),/\sid=/);
  const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const ids=[...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(ids).size,ids.length);
  assert.match(html,/<dialog class="ms-detail" data-ms-detail/);
});
check('real delegated owner opens, closes, returns focus and never saves (DOM fixture)', () => {
  const events={}, devents={}, trigger={dataset:{msOpen:seed.id},focus(){this.focused=true;}};
  const archive={}, form={hidden:true}, title={focus(){this.focused=true;}};
  const dialog={hidden:true,open:false,innerHTML:'',querySelector:()=>title,querySelectorAll:()=>[],
    showModal(){this.open=true;},close(){this.open=false;},getBoundingClientRect:()=>({left:10,right:300,top:10,bottom:500}),
    addEventListener:(name,fn)=>devents[name]=fn};
  const slots={archive,detail:dialog,form,list:{innerHTML:'',querySelectorAll:()=>[]},
    filters:{childElementCount:1,querySelectorAll:()=>[]},sort:{options:[{}]},grades:{childElementCount:1,querySelectorAll:()=>[]},session:{}};
  const host={dataset:{},style:{setProperty(){}},classList:{contains:()=>true},
    querySelector:selector=>selector.startsWith('[data-ms-open=')?trigger:slots[selector.match(/^\[data-ms-(.+)\]$/)?.[1]],
    addEventListener:(name,fn)=>events[name]=fn};
  const document={readyState:'complete',getElementById:()=>host,querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){}};
  const runtime=vm.createContext({window:{},document,console,save:deny});
  vm.runInContext(code,runtime);
  const open=()=>events.click({target:{closest:selector=>selector==='[data-ms-open]'?trigger:null}});
  open(); assert.equal(dialog.open,true); assert.equal(archive.hidden,false); assert.equal(title.focused,true);
  assert.match(dialog.innerHTML,/감마GTP/);
  devents.cancel({preventDefault(){}}); assert.equal(dialog.open,false); assert.equal(trigger.focused,true);
  trigger.focused=false; open(); devents.click({target:dialog,clientX:0,clientY:0});
  assert.equal(dialog.open,false); assert.equal(trigger.focused,true); assert.equal(writes,0);
});
console.log('Collection targeted checks: '+checks+' PASS');
