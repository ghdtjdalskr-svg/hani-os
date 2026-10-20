import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import http from 'node:http';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const out=new URL('../artifacts/fix-218/',import.meta.url);
fs.mkdirSync(out,{recursive:true});
const source=fs.readFileSync(new URL('../hani-office-live.js',import.meta.url),'utf8');
const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);
  if(!file.startsWith(root)||!fs.existsSync(file)){res.writeHead(404).end();return;}
  res.setHeader('Content-Type','application/json');res.end(fs.readFileSync(file));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const results=[];
export async function loadScene(time,day='2026-10-18'){
  const instant=Date.parse(`${day}T${time}:00+09:00`),requests=[];
  class Clock extends Date{constructor(...args){super(...(args.length?args:[instant]));}static now(){return instant;}}
  const context=vm.createContext({Date:Clock,window:{},document:{getElementById:()=>null},fetch:async url=>{
    requests.push(url);
    // Keep 218's base-presence contract under the real 216 fallback. The 221 suite
    // separately exercises current night/weekend actions and occupied-floor cadence.
    if(url.endsWith('office-actions-221.json'))return {ok:false};
    const response=await fetch(new URL(url,origin));assert.equal(response.status,200,url);return response;
  }});
  // Await the production async bootstrap. No metadata, action, roster or event fixtures.
  await vm.runInContext(source,context);
  assert.equal(requests.length,5);assert.ok(context.HaniBuildingScene.scheduler);
  return {scene:context.HaniBuildingScene,snapshot:context.HaniBuildingScene.snapshot(),requests};
}

test.after(async()=>{
  await new Promise(resolve=>server.close(resolve));
  fs.writeFileSync(new URL('clock-results.json',out),JSON.stringify(results,null,2));
});

  for(const time of ['19:31','23:00','07:00','12:30','02:00']){
    test(`real metadata/bootstrap + fake Date at Sunday ${time} KST`,async()=>{
      const {scene,snapshot:s,requests}=await loadScene(time);
      const entries=s.floors.flatMap(f=>f.people),ids=entries.map(p=>p.id).sort();
      results.push({time,day:s.day,ids,counts:Object.fromEntries(s.floors.map(f=>[f.id,f.people.length])),note:s.presenceNote,requests});
      assert.equal(s.day,'2026-10-18');assert.ok(ids.includes('mir'),'MIR always present');
      if(time==='02:00'){
        assert.deepEqual(ids,['dohyun','minji','mir','seoyun','yuna']);assert.match(s.presenceNote,/심야.*라운지/);
        assert.ok(s.floors.find(f=>f.id==='3f').people.every(p=>p.line==='야근 중'));
      }else{
        assert.equal(ids.length,17);for(const id of ['1f','2f','3f','4f'])assert.ok(s.floors.find(f=>f.id===id).visible.length>0,id);
        if(time==='19:31'||time==='23:00')assert.ok(entries.every(p=>/퇴근 준비 중|야근 중|자료 확인 중|라운지에서 야근 이야기 중/.test(p.line)));
      }
      assert.equal(new Set(entries.map(p=>p.seat.anchor)).size,entries.length,'no shared seats');
      const lounge=entries.filter(p=>p.activity==='rest');
      if(['19:31','23:00','02:00'].includes(time))assert.deepEqual(lounge.map(p=>p.id).sort(),['minji','yuna']);
      else assert.equal(lounge.length,0);
      for(const p of entries){if(p.activity!=='rest')assert.equal(p.seat.anchor,scene.homeSeat(p.id).anchor);else assert.match(p.seat.anchor,/lobby-/);assert.ok(scene.anchors.has(p.seat.anchor));assert.equal(p.actionId,'base-work');}
      assert.equal(scene.scheduler.plan(s.day).length,0,'weekend presence never enables weekday actions');
    });
  }
  test('01/07/18 boundaries, weekday behaviour, presence exclusions and chairman',async()=>{
    const {scene}=await loadScene('12:30','2026-10-19');
    const at=t=>scene.scheduler.snapshot(`2026-10-19T${t}+09:00`);
    for(const time of ['01:00:00','02:00:00','06:59:59'])assert.deepEqual(Array.from(at(time).entries,p=>p.id).sort(),['dohyun','minji','mir','seoyun','yuna']);
    for(const time of ['00:00:00','00:59:59','07:00:00','09:00:00','17:59:59','18:00:00','22:00:00','23:59:59'])assert.equal(at(time).entries.length,17);
    assert.ok(at('17:59:59').entries.filter(p=>!p.eventId).every(p=>p.line==='자료 확인 중'));
    assert.ok(at('18:00:00').entries.some(p=>p.line==='퇴근 준비 중'));
    const now='2026-10-19T23:00:00+09:00';
    assert.equal(scene.scheduler.snapshot(now,{presentIds:[]}).entries.length,0);
    assert.equal(scene.scheduler.snapshot(now,{summoned:['mir','dohyun']}).entries.length,15);
    assert.ok(scene.scheduler.snapshot(now,{chairmanPresent:true}).entries.some(p=>p.id==='seongmin'&&p.seat.anchor==='ceo-reserved'));
    assert.ok(scene.scheduler.plan('2026-10-19').length>0,'weekday scheduler still runs');
  });
