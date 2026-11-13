import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import outer from './hani-newsroom-288-source.cjs';
import releases from './hani-release-version-layers.cjs';
const source=fs.readFileSync(new URL('../hani-newsroom-4cut.js',import.meta.url),'utf8');
const catalog=JSON.parse(fs.readFileSync(new URL('../assets/data/newsroom-4cut/issues.json',import.meta.url),'utf8'));
test('exact outer inverse round-trips bytes and rejects partial, duplicated and EOL drift',()=>{
  for(const [file,row] of Object.entries(outer.delta.files)){
    const current=releases.projectPreRelease288Source(fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'),file),before=outer.restoreNewsroom288Source(current,file);
    assert.equal(outer.hash(before),row.beforeSha256);assert.deepEqual(outer.restoreNewsroom288Source(Buffer.from(current),file),Buffer.from(before));
    const lines=before.match(/[^\n]*\n|[^\n]+$/g)||[];
    for(const edit of row.edits){const removed=edit.before.match(/[^\n]*\n|[^\n]+$/g)||[];assert.equal(lines.slice(edit.at,edit.at+removed.length).join(''),edit.before);lines.splice(edit.at,removed.length,...(edit.after.match(/[^\n]*\n|[^\n]+$/g)||[]));}
    assert.equal(lines.join(''),current);
    for(const bad of [current+'\n',current.slice(1),current+current,before,current.replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n')]){assert.throws(()=>outer.restoreNewsroom288Source(bad,file),/exact newsroom-288 input/);assert.equal(outer.projectPreNewsroom288Source(bad,file),bad);}
  }
});
function runtime(issue,issues){
  class Element {
    constructor(tag='div'){this.tagName=tag;this.children=[];this.hidden=false;this.attrs={};this.className='';this.textContent='';this.classes=new Set();this.classList={toggle:(name,on)=>on?this.classes.add(name):this.classes.delete(name)};}
    append(...items){this.children.push(...items);}
    replaceChildren(...items){this.children=items;}
    setAttribute(k,v){this.attrs[k]=v;}
    get childElementCount(){return this.children.length;}
    set innerHTML(value){throw Error('HTML sink forbidden: '+value);}
  }
  const nodes=new Map(),slot=new Element();slot.querySelector=s=>{if(!nodes.has(s))nodes.set(s,new Element());return nodes.get(s);};
  const deny=()=>{throw Error('storage access forbidden');},storage={getItem:deny,setItem:deny,removeItem:deny,clear:deny};
  const context=vm.createContext({window:{},URL,document:{body:{dataset:{view:'newsroom'}},querySelector:()=>slot,createElement:t=>new Element(t)},localStorage:storage,sessionStorage:storage,fetch:async()=>({ok:true,json:async()=>({issues:issues||[{number:99,publishDate:'2020-01-01',week:'테스트',image:'fixture',title:'테스트',alt:'장면만',sources:[],...issue}]})})});
  vm.runInContext(source,context);
  return {api:context.window.HaniNewsroom4cut,nodes,slot};
}
const all=node=>[node,...node.children.flatMap(all)];
const text=node=>all(node).map(n=>n.textContent).join('\n');
const section=(r,name)=>r.nodes.get('.newsroom-4cut-context').children.find(n=>n.className==='newsroom-4cut-'+name);
test('actual enter/render: issue 2 renders its three facts and four ordered cuts',async()=>{
  const issue=catalog.issues.find(i=>i.number===2),r=runtime(issue);await r.api.enter();
  assert.deepEqual(issue.facts.map(x=>x.value),['1,356.6원','+165,000명','4.1%']);
  assert.equal(section(r,'facts').children[1].children.length,3);
  assert.equal(section(r,'cuts').children[1].children.length,4);
  assert.match(text(section(r,'facts')),/11\/6 서울 15:30 종가/);
  for(const [i,row] of issue.cuts.entries())assert.match(text(section(r,'cuts').children[1].children[i]),new RegExp(['①','②','③','④'][i]+' '+row.reporter));
  assert.doesNotMatch(text(section(r,'cuts')),/회장/);
  assert.equal(r.nodes.get('.newsroom-4cut-context').children.length,3);
  assert.equal(r.nodes.get('.newsroom-4cut-layout').classes.has('has-context'),true);
  const children=r.nodes.get('.newsroom-4cut-context').children.slice();await r.api.enter();assert.deepEqual(r.nodes.get('.newsroom-4cut-context').children,children,'same issue does not repaint');
});
test('absent fields omit their sections; indices, facts or cuts independently enable context',async()=>{
  for(const issue of [{},{alt:'코스피는 한 주 1% 오른 100'},{facts:[{label:'수치',value:'1'}]},{cuts:[{reporter:'하니',scene:'전광판'}]}]){
    const r=runtime(issue);await r.api.enter();const host=r.nodes.get('.newsroom-4cut-context');
    assert.equal(!!section(r,'facts'),!!issue.facts);assert.equal(!!section(r,'cuts'),!!issue.cuts);
    assert.equal(host.hidden,!Object.keys(issue).length);assert.equal(r.nodes.get('.newsroom-4cut-layout').classes.has('has-context'),!host.hidden);
  }
});
test('weekly change cells are marked down (blue) or up (red) from the rendered change text only',async()=>{
  const r=runtime(catalog.issues.find(i=>i.number===2));await r.api.enter();
  const marked=all(r.nodes.get('.newsroom-4cut-context')).filter(n=>n.tagName==='td'&&n.className);
  assert.deepEqual(marked.map(n=>[n.className,n.textContent]),[['is-down','11.71% 하락'],['is-down','11.06% 하락'],['is-down','2.68% 하락'],['is-down','3.37% 하락']]);
  const up=runtime({alt:'코스피는 한 주 1% 오른 100'});await up.api.enter();
  assert.deepEqual(all(up.nodes.get('.newsroom-4cut-context')).filter(n=>n.tagName==='td'&&n.className).map(n=>[n.className,n.textContent]),[['is-up','1% 상승']]);
});
test('XSS labels, numbers, notes, reporters and scenes reach text nodes only',async()=>{
  const attack='<img src=x onerror=alert(1)><script>alert(2)</script>',r=runtime({facts:[{label:attack,value:attack,note:attack}],cuts:[{reporter:attack,scene:attack}]});
  await r.api.enter();const host=r.nodes.get('.newsroom-4cut-context'),nodes=all(host);
  assert.equal(nodes.filter(n=>n.textContent===attack).length,4);assert.ok(nodes.some(n=>n.textContent==='① '+attack));
  assert.ok(nodes.every(n=>!['img','script'].includes(n.tagName)));assert.ok(nodes.every(n=>!Object.keys(n.attrs).some(k=>/^on/i.test(k))));
});
test('invalid explicit fields and alt prose do not invent additional facts or scenes',async()=>{
  const r=runtime({alt:'원/달러 1,356.6원. 하니가 놀란다.',facts:[null,{label:'x',value:3},{label:' ',value:'1'}],cuts:[null,{reporter:'하니',scene:3}]});
  await r.api.enter();assert.equal(r.nodes.get('.newsroom-4cut-context').hidden,true);
  assert.equal(section(r,'facts'),undefined);assert.equal(section(r,'cuts'),undefined);
  assert.doesNotMatch(source,/innerHTML|localStorage|sessionStorage|supabase|cloudClient/);
});
test('actual archive and latest handlers replace issue contents in the persistent context slot',async()=>{
  const r=runtime(null,catalog.issues);await r.api.enter();const host=r.nodes.get('.newsroom-4cut-context');assert.ok(section(r,'cuts'));
  r.nodes.get('.newsroom-4cut-past').children[0].children[0].onclick();
  assert.equal(r.nodes.get('.newsroom-4cut-context'),host);assert.equal(section(r,'cuts'),undefined);assert.equal(section(r,'facts').children[1].children.length,2);
  assert.match(text(host),/1,334.3원/);assert.doesNotMatch(text(host),/165,000/);
  r.nodes.get('.newsroom-4cut-latest').onclick();assert.equal(r.nodes.get('.newsroom-4cut-context'),host);assert.equal(section(r,'cuts').children[1].children.length,4);assert.equal(section(r,'facts').children[1].children.length,3);
});
