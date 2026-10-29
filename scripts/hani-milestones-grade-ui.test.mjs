// node scripts/hani-milestones-grade-ui.test.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const code = fs.readFileSync(new URL('../hani-milestones.js', import.meta.url), 'utf8');
// Approved v3 seal geometry snapshot; no dependency on temporary design files.
const approvedSeals = ["<circle cx=\"24\" cy=\"24\" r=\"22\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1\"/><circle cx=\"24\" cy=\"24\" r=\"18.5\" fill=\"none\" stroke=\"currentColor\" stroke-width=\".6\" stroke-dasharray=\"1.2 2\"/><path d=\"M24 12l2.6 7.2 7.6.3-6 4.7 2.1 7.3L24 27.3l-6.3 4.2 2.1-7.3-6-4.7 7.6-.3z\" fill=\"currentColor\" opacity=\".9\"/>","<circle cx=\"24\" cy=\"24\" r=\"22\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1\"/><path d=\"M24 13l9 11-9 11-9-11z\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\"/><path d=\"M24 17.5l5.3 6.5L24 30.5 18.7 24z\" fill=\"currentColor\" opacity=\".85\"/>","<circle cx=\"24\" cy=\"24\" r=\"22\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1\"/><circle cx=\"24\" cy=\"24\" r=\"7\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\"/><circle cx=\"24\" cy=\"24\" r=\"3\" fill=\"currentColor\"/>","<circle cx=\"24\" cy=\"24\" r=\"22\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1\"/><path d=\"M17 24h14\" stroke=\"currentColor\" stroke-width=\"1.4\"/>"];
let writes = 0;
const deny = () => { writes++; throw Error('Unexpected write'); };
const context = vm.createContext({window:{}, console, save:deny, localStorage:{setItem:deny,removeItem:deny,clear:deny}, sessionStorage:{setItem:deny,removeItem:deny,clear:deny}});
vm.runInContext(code, context);
const api = context.window.HaniMilestones, seed = JSON.parse(JSON.stringify(api.SEED[0]));
const keys = ['LEGENDARY','EPIC','RARE','RECORD'];
const rows = keys.flatMap((key, i) => ['HEALTH','LIFE'].map((category,j) => ({...seed,id:'milestone_fixture_'+i+'_'+j,category,grade:key === 'RECORD' ? null : key,date:'2026-10-'+(20+i)})));
let checks = 0;
function check(name, run) { run(); console.log('PASS', name); checks++; }
check('each grade has its own class, banner and exact approved seal body without ids', () => {
  const bodies = approvedSeals;
  keys.forEach((key,i) => {
    const markup = api.card(rows[i*2]);
    assert.ok(markup.includes('ms-grade-'+key.toLowerCase()));
    assert.ok(markup.includes('data-ms-seal="'+key+'"'));
    assert.ok(markup.includes(bodies[i]));
    assert.match(markup, /class="ms-grade-banner"/);
    assert.doesNotMatch(markup, /\sid=/);
  });
});
check('grade AND category filtering, sorting and category-scoped counts', () => {
  for (const category of ['ALL','HEALTH','LIFE','TRAVEL']) for (const grade of ['ALL',...keys]) {
    const expected = rows.filter(m => (category === 'ALL' || m.category === category) && (grade === 'ALL' || (m.grade || 'RECORD') === grade));
    assert.equal(api.filtered(rows, category, grade).length, expected.length);
    for (const sort of ['newest','oldest','importance','category']) {
      const markup = api.list(rows,{category,grade,sort});
      assert.equal((markup.match(/class="ms-item"/g)||[]).length, expected.length);
      const ordered = api.sorted(expected,sort).map(m=>m.id);
      assert.deepEqual([...markup.matchAll(/data-ms-open="([^"]+)"/g)].map(m=>m[1]), Array.from(ordered));
    }
    const filters = api.gradeFilters(rows,{category,grade});
    assert.equal((filters.match(/data-ms-grade=/g)||[]).length,4);
    const count = category === 'ALL' ? 2 : category === 'TRAVEL' ? 0 : 1;
    assert.equal((filters.match(new RegExp('<em>'+count+'<span','g'))||[]).length,4);
  }
});
check('null, empty and absent grades render Record', () => {
  for (const grade of [null,undefined,'']) assert.match(api.card({...seed,grade}), /ms-grade-record[\s\S]*Record/);
});
check('first featured id owns highlight, remaining featured values own the table', () => {
  const markup = api.card({...seed,featuredMetrics:['glucose','weight','hba1c']});
  assert.match(markup,/ms-highlight-label">혈당/);
  const highlight = markup.slice(markup.indexOf('class="ms-highlight"'),markup.indexOf('<ul class="ms-metric-list"'));
  assert.ok(highlight.includes('91mg/dL')); assert.ok(!highlight.includes('211'), 'no change means after only');
  assert.match(markup, /<li><span>체중/);
  assert.doesNotMatch(api.card({...seed,featuredMetrics:[]}), /class="ms-highlight"/);
});
check('missing before OR change shows after only and invents no delta or unit', () => {
  for (const missing of [{before:null},{change:null},{before:'',change:''}]) {
    const metric = {...seed.metrics[0],...missing};
    const markup = api.card({...seed,metrics:[metric],featuredMetrics:[metric.id]});
    assert.ok(markup.includes(metric.after));
    assert.doesNotMatch(markup, /class="ms-old"|class="ms-delta"/);
  }
});
check('render/filter is immutable and performs zero writes', () => {
  const before = JSON.stringify(rows); rows.forEach(api.card); api.list(rows,{grade:'EPIC'}); api.gradeFilters(rows);
  assert.equal(JSON.stringify(rows),before); assert.equal(writes,0);
});
check('repeated cards and filters introduce zero ids', () => {
  assert.doesNotMatch(api.list([...rows,...rows])+api.gradeFilters(rows), /\sid=/);
  const html = fs.readFileSync(new URL('../index.html', import.meta.url),'utf8');
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]); assert.equal(new Set(ids).size,ids.length);
});
check('banner whites exceed AA even at the brightest gradient stops and shine', () => {
  const lum = rgb => rgb.map(c=>c/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4).reduce((s,c,i)=>s+c*[.2126,.7152,.0722][i],0);
  for (const hex of ['e3c88a','9b86c4','7c9fc4','b3aaa0']) {
    const rgb = hex.match(/../g).map(x=>parseInt(x,16));
    // Worst case: white shine alpha 0x28, then black scrim alpha 0x88.
    const bg = rgb.map(c=>(c+(255-c)*40/255)*(1-136/255));
    assert.ok(1.05/(lum(bg)+.05)>=4.5,hex);
  }
});
console.log('Grade UI targeted checks: '+checks+' PASS');
