// Node only. DOM doubles exercise the canonical event path; no browser is launched.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {loadScene,at} from './hani-office-lively-fixture.mjs';
import {fixture} from './hani-building-206-engine.test.mjs';
import {collectReferences} from './hani-runtime-closure.mjs';

const read=file=>fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
const data=JSON.parse(read('assets/data/office-drama-v1.json'));
const ordinary=JSON.parse(read('assets/data/office-tap-lines-v1.json'));
const source=read('hani-office-live.js'),{scene,context,table}=loadScene();
const roster=scene.canon.people,api=scene.tapLines;
const atTime=(day,time='10:00:00')=>new Date(`${day}T${time}+09:00`);
const response=value=>({ok:true,json:async()=>structuredClone(value)});
const fetchBank=async url=>response(url.endsWith('/office-drama-v1.json')?data:ordinary);
async function loaded(fetch=fetchBank){context.fetch=fetch;const instance=api.create(roster);await instance.load();return instance;}
const flush=async()=>{for(let i=0;i<20;i++)await Promise.resolve()};
const options=(floor,chairmanPresent=true)=>({floor,chairmanPresent});

test('selection: every day in November, first four weeks and next cycle, independent of host timezone',()=>{
 const previous=process.env.TZ;
 try{for(const tz of ['UTC','America/Los_Angeles','Pacific/Honolulu','Asia/Tokyo']){
  process.env.TZ=tz;
  for(let n=1;n<=30;n++){
   const date=`2026-11-${String(n).padStart(2,'0')}`,now=atTime(date),day=new Date(date+'T00:00:00Z').getUTCDay();
   const selected=api.dramaDate(now);
   if(day===0||day===6){assert.equal(selected,null,date+' '+tz);continue;}
   assert.equal(selected.date,date);assert.equal(selected.day,day);
   assert.equal(selected.week,Math.floor((n-2)/7)%4+1,date+' '+tz);
  }
 }}finally{if(previous===undefined)delete process.env.TZ;else process.env.TZ=previous;}
});

test('selection: KST midnight, weekends, year boundary, leap date and pre-anchor modulo',()=>{
 for(const [utc,expected] of [
  ['2026-11-01T14:59:59.999Z',null],['2026-11-01T15:00:00Z',[1,1,'2026-11-02']],
  ['2026-11-06T14:59:59.999Z',[1,5,'2026-11-06']],['2026-11-06T15:00:00Z',null],
  ['2026-12-27T15:00:00Z',[1,1,'2026-12-28']],['2026-12-31T14:59:59Z',[1,4,'2026-12-31']],
  ['2026-12-31T15:00:00Z',[1,5,'2027-01-01']],['2027-01-01T15:00:00Z',null],
  ['2027-01-03T15:00:00Z',[2,1,'2027-01-04']],['2026-10-25T15:00:00Z',[4,1,'2026-10-26']],
  ['2028-02-28T15:00:00Z',[2,2,'2028-02-29']]
 ]){const selected=api.dramaDate(new Date(utc));assert.deepEqual(selected?[selected.week,selected.day,selected.date]:null,expected,utc);}
});

test('data: 4 approved scripts, 20 standalone days and all 100 verbatim lines, floors and clues',()=>{
 assert.equal(api.validateDrama(data,roster),true);
 for(const week of data.weeks){
  const script=read(`docs/drafts/office-drama-week${week.week}.md`);
  assert.equal(week.title,script.match(/〈(.+)〉/)[1]);
  const sections=script.split(/^## /m).slice(1,6);
  for(const [index,day] of week.days.entries()){
   const section=sections[index];assert.equal(day.summary,section.match(/\*\*한 줄 요약\*\*: (.+)/)[1]);
   const authored=[...section.matchAll(/^- \*\*(.+?)\*\* \| \*\*(.+?)\*\*[^\n]*\n  “(.+)”/gm)];
   assert.equal(authored.length,5);
   for(const [n,row] of day.lines.entries()){
    const [,floor,name,line]=authored[n],person=roster.find(p=>p.id===row.staffId);
    assert.equal(row.line,line);assert.ok([...line].length<=40);
    assert.equal(row.floor,floor.match(/[1-5]F/)[0].toLowerCase());assert.equal(row.hidden,floor.includes('숨은 단서'));
    assert.ok(person);assert.equal(name.split(' ')[0],row.staffId==='seongmin'?'회장님':person.name.split('/')[0]);
   }
  }
 }
 assert.equal(data.weeks.flatMap(w=>w.days.flatMap(d=>d.lines)).length,100);
});

test('validation rejects malformed shape, every invalid staff/floor/length, empty text and duplicate lines',()=>{
 for(const bad of [null,[],{},'broken',{schemaVersion:'office-drama-v1',weeks:[]}])assert.equal(api.validateDrama(bad,roster),false);
 const mutations=[
  b=>b.schemaVersion='wrong',b=>b.weeks.pop(),b=>b.weeks[0].week=2,b=>b.weeks[0].title='',
  b=>b.weeks[0].days.pop(),b=>b.weeks[0].days[0].day=0,b=>b.weeks[0].days[0].summary=' ',
  b=>b.weeks[0].days[0].lines=null,b=>b.weeks[0].days[0].lines[0]=null,
  b=>b.weeks[0].days[0].lines[1].staffId=b.weeks[0].days[0].lines[0].staffId
 ];
 for(const mutate of mutations){const bad=structuredClone(data);mutate(bad);assert.equal(api.validateDrama(bad,roster),false);}
 for(let w=0;w<4;w++)for(let d=0;d<5;d++)for(let n=0;n<5;n++)for(const [field,value] of [
  ['staffId','invented'],['floor','roof'],['floor',null],['hidden','true'],['line','가'.repeat(41)],['line',''],['line','줄\n바꿈']
 ]){const bad=structuredClone(data);bad.weeks[w].days[d].lines[n][field]=value;assert.equal(api.validateDrama(bad,roster),false,`${w}/${d}/${n}/${field}`);}
 const unicode=structuredClone(data);unicode.weeks[0].days[0].lines[0].line='🌱'.repeat(40);assert.equal(api.validateDrama(unicode,roster),true);
});

test('missing, network error, broken JSON and invalid catalog preserve ordinary taps and hide the caption data',async()=>{
 for(const failing of [async()=>({ok:false}),async()=>{throw Error('offline')},async()=>({ok:true,json:async()=>{throw SyntaxError('broken')}}),async()=>response({schemaVersion:'bad'})]){
  const instance=await loaded(url=>url.endsWith('/office-drama-v1.json')?failing():response(ordinary));
  assert.equal(instance.episode(atTime('2026-11-02')),null);
  assert.equal(instance.tap('yuna',atTime('2026-11-02'),options('4f')).line,ordinary.staff.yuna.morning[0]);
 }
 const instance=await loaded(async()=>({ok:false}));assert.equal(instance.tap('yuna',atTime('2026-11-02'),options('4f')),'');
});

test('first eligible tap then normal cadence; memory is per actor and per date, refreshed pages and four-week repeat reset',async()=>{
 const c=await loaded(),mon=atTime('2026-11-02'),row=data.weeks[0].days[0].lines[0];
 assert.equal(c.tap(row.staffId,mon,options(row.floor)).line,row.line);
 assert.equal(c.tap(row.staffId,mon,options(row.floor)).line,ordinary.staff[row.staffId].morning[0]);
 assert.equal(c.tap(row.staffId,mon,options(row.floor)).line,ordinary.staff[row.staffId].toChairman[0]);
 assert.equal(c.tap('hani',mon,options('4f')).line,data.weeks[0].days[0].lines[1].line);
 assert.equal((await loaded()).tap(row.staffId,mon,options(row.floor)).line,row.line);
 assert.equal(c.tap(row.staffId,atTime('2026-11-30'),options(row.floor)).line,row.line);
});

test('wrong floor and other staff do not consume a drama; hidden clues use their own floor',async()=>{
 const c=await loaded(),mon=atTime('2026-11-02'),clue=data.weeks[0].days[0].lines[4];
 assert.equal(c.tap('yuna',mon,options('1f')).line,ordinary.staff.yuna.morning[0]);
 assert.equal(c.tap('yuna',mon,options('4f')).line,data.weeks[0].days[0].lines[0].line);
 assert.equal(c.tap('haru',mon,options('2f')).line,ordinary.staff.haru.morning[0]);
 assert.equal(c.tap('haru',mon,options('5f')).line,clue.line);
 assert.equal(c.tap('serin',mon,options('3f')).line,ordinary.staff.serin.morning[0]);
 assert.equal(c.tap('visitor',mon,options('1f')),'');
});

test('chairman speaks his own script only when present on the specified floor; Saturday stays ordinary',async()=>{
 const c=await loaded(),thu=atTime('2026-11-05'),line=data.weeks[0].days[3].lines[4].line;
 assert.notEqual(c.tap('seongmin',thu,options('4f',false)).line,line);
 assert.notEqual(c.tap('seongmin',thu,options('5f')).line,line);
 const first=c.tap('seongmin',thu,options('4f'));assert.equal(first.line,line);assert.equal(first.speaker,'seongmin');
 assert.equal(c.tap('seongmin',thu,options('4f')).drama,undefined);
 assert.equal(c.episode(atTime('2026-11-07')),null);
 assert.equal(c.tap('yuna',atTime('2026-11-07'),options('4f')).line,ordinary.staff.yuna.morning[0]);
});

test('loads each literal local GET once, waits for slow drama, and performs zero storage/network writes',async()=>{
 let writes=0,deliver;const calls=[],deny=()=>{writes++;throw Error('forbidden write')};
 context.localStorage=context.sessionStorage={getItem:deny,setItem:deny,removeItem:deny,clear:deny};
 context.XMLHttpRequest=deny;context.navigator={sendBeacon:deny};context.WebSocket=deny;
 const c=api.create(roster);context.fetch=async(url,init)=>{
  calls.push(url);assert.equal(init,undefined);
  return url.endsWith('/office-drama-v1.json')?new Promise(resolve=>{deliver=resolve}):response(ordinary);
 };
 const pending=c.load();assert.equal(c.load(),pending);await flush();
 assert.equal(c.tap('yuna',atTime('2026-11-02'),options('4f')),'');
 deliver(response(data));await pending;
 assert.equal(c.tap('yuna',atTime('2026-11-02'),options('4f')).line,data.weeks[0].days[0].lines[0].line);
 await c.load();for(let i=0;i<20;i++)c.tap('yuna',atTime('2026-11-02'),options('4f'));
 assert.deepEqual(calls,['./assets/data/office-tap-lines-v1.json','./assets/data/office-drama-v1.json']);assert.equal(writes,0);
});

test('DOM owner: Monday caption, delegated first tap during an action, second normal tap, and Saturday clearing',async()=>{
 let writes=0;const deny=()=>{writes++;throw Error('write')};
 const f=fixture('10:00',true,null,table,{fetch:fetchBank,setTimeout:()=>{},localStorage:{setItem:deny},sessionStorage:{setItem:deny}});
 f.setDateTime(atTime('2026-11-02'));await flush();f.click('4f');
 const caption=f.root.querySelector('.hani-building-drama-caption'),node=caption;
 assert.equal(caption.hidden,false);assert.equal(caption.textContent,data.weeks[0].title+' · '+data.weeks[0].days[0].summary);
 const actor=f.visible().find(a=>a.dataset.person==='hani');assert.ok(actor);
 const status=actor.querySelector('.hani-office-status').textContent,labels=actor.querySelector('.hani-office-name');
 actor.dataset.action='test-action';
 const tap=()=>f.ids.get('haniOfficeActors').events.click({target:actor});tap();
 const bubble=f.root.querySelector('.hani-office-character-bubble');assert.ok(bubble.querySelector('p').textContent.includes(data.weeks[0].days[0].lines[1].line));
 actor.dataset.action='base-work';actor.dataset.event='';tap();assert.ok(bubble.querySelector('p').textContent.includes(ordinary.staff.hani.morning[0]));
 assert.equal(actor.querySelector('.hani-office-status').textContent,status);assert.equal(actor.querySelector('.hani-office-name'),labels);
 f.setDateTime(atTime('2026-11-07'));f.click('4f');assert.equal(caption.hidden,true);assert.equal(caption.textContent,'');assert.equal(caption,node);assert.equal(writes,0);
});

test('DOM missing/broken drama keeps the same normal speech and no caption',async()=>{
 for(const fail of [()=>({ok:false}),()=>({ok:true,json:async()=>{throw Error('invalid JSON')}})]){
  const f=fixture('10:00',true,null,table,{fetch:async url=>url.endsWith('/office-drama-v1.json')?fail():response(ordinary),setTimeout:()=>{}});
  f.setDateTime(atTime('2026-11-02'));await flush();f.click('3f');
  const actor=f.visible().find(a=>!a.dataset.event&&a.dataset.action==='base-work');assert.ok(actor);
  f.ids.get('haniOfficeActors').events.click({target:actor});
  assert.ok(f.root.querySelector('.hani-office-character-bubble').querySelector('p').textContent.includes(ordinary.staff[actor.dataset.person].morning[0]));
  assert.equal(f.root.querySelector('.hani-building-drama-caption').hidden,true);
 }
});

test('DOM slow load after a floor change cannot consume the first drama line on the old floor',async()=>{
 let deliver;
 const f=fixture('10:00',true,null,table,{fetch:async url=>url.endsWith('/office-drama-v1.json')?new Promise(resolve=>{deliver=resolve}):response(ordinary),setTimeout:()=>{}});
 f.setDateTime(atTime('2026-11-02'));f.click('4f');await flush();
 const actor=f.visible().find(a=>a.dataset.person==='hani'),tap=()=>f.ids.get('haniOfficeActors').events.click({target:actor});assert.ok(actor);
 tap();f.click('3f');deliver(response(data));await flush();
 assert.equal(f.root.querySelector('.hani-office-character-bubble').hidden,true);
 f.click('4f');tap();assert.ok(f.root.querySelector('.hani-office-character-bubble').querySelector('p').textContent.includes(data.weeks[0].days[0].lines[1].line));
});

test('release trace sees literal JSON path; caption wraps in full; scheduler and label placement remain frozen',()=>{
 assert.ok(collectReferences('hani-office-live.js',source).includes('assets/data/office-drama-v1.json'));
 const css=read('hani-office-live.css');assert.match(css,/\.hani-building-drama-caption\{flex:1 1 100%;/);assert.doesNotMatch(css,/\.hani-building-drama-caption[^{]*\{[^}]*nowrap/);
 const normalized=source.replace(/\r\n/g,'\n');
 for(const [start,end,expected] of [
  ['  function createScheduler(','  function statusLabelPriority(','bd460fdb7f1c9f20d279c794ff4161557adca30cb645cbea506682375a0a1409'],
  ['  function placeStatusLabels(','  const scheduler=','5070f7e62556b89410bc7588600fefe80ba99579e945ae49bab89def98bec6f0']
 ]){const from=normalized.indexOf(start),until=normalized.indexOf(end,from);assert.ok(from>0&&until>from);
  assert.equal(createHash('sha256').update(normalized.slice(from,until)).digest('hex'),expected,start+' unchanged from base 1ce3945');
 }
});

test('09:00–18:00 reachability uses scheduler event/leg intervals and actual snapshot witnesses, floor by floor',()=>{
 const report={window:'09:00 <= KST < 18:00',anchor:'2026-11-02',method:'Each actor event/leg boundary and interval midpoint; verify reachable candidates through scheduler.snapshot. No timetable modification. Counts include clues and transit floors.',days:[]};
 for(let offset=0;offset<28;offset++){
  const date=new Date(Date.UTC(2026,10,2+offset)).toISOString().slice(0,10),selected=api.dramaDate(atTime(date));if(!selected)continue;
  const episode=data.weeks[selected.week-1].days[selected.day-1],row={date,week:selected.week,day:selected.day,presence:{}};
  for(const chairmanPresent of [false,true]){
   const s=loadScene().scene.scheduler,opts={chairmanPresent},formal=s.plan(date,opts),events=[...formal,...s.blockPlan(date,0,formal,opts)];
   const floors=Object.fromEntries(['1f','2f','3f','4f','5f'].map(f=>[f,{reachable:0,total:episode.lines.filter(l=>l.floor===f).length}])),lines=[];
   for(const line of episode.lines){
    const boundaries=new Set([32400,64800]),own=events.filter(e=>e.people.some(p=>p.id===line.staffId));
    for(const event of own){for(const value of [event.start,event.end,event.performStart,event.performEnd])if(value>=32400&&value<=64800)boundaries.add(value);
     const person=event.people.find(p=>p.id===line.staffId);for(const leg of [...person.out,...person.back])for(const value of [leg.start,leg.end])if(value>=32400&&value<=64800)boundaries.add(value);
    }
    const sorted=[...boundaries].sort((a,b)=>a-b),samples=sorted.flatMap((v,i)=>i+1<sorted.length?[v,(v+sorted[i+1])/2]:[]);
    let witness=null;
    if(line.staffId!=='seongmin'||chairmanPresent)for(const seconds of samples){
     // Cheap exact floor projection first; authoritative snapshot confirms any witness.
     const event=own.find(e=>e.start<=seconds&&seconds<e.end),person=table.people.find(p=>p.id===line.staffId);
     const floor=event?s.stateAt(event,event.people.find(p=>p.id===line.staffId),seconds).floor:s.homeAt(person,seconds).floor;
     if(floor!==line.floor)continue;
     const actual=s.snapshot(at(date,seconds),opts).entries.find(p=>p.id===line.staffId&&p.floor===line.floor);
     if(actual){witness=seconds;break;}
    }
    if(witness!==null)floors[line.floor].reachable++;
    lines.push({staffId:line.staffId,floor:line.floor,hidden:line.hidden,reachable:witness!==null,witnessSeconds:witness});
   }
   row.presence[chairmanPresent?'present':'absent']={floors,lines};
  }
  report.days.push(row);
 }
 assert.equal(report.days.length,20);assert.equal(report.days.flatMap(d=>d.presence.present.lines).length,100);
 fs.mkdirSync(new URL('../artifacts/office-drama/',import.meta.url),{recursive:true});
 fs.writeFileSync(new URL('../artifacts/office-drama/reachability.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
});
