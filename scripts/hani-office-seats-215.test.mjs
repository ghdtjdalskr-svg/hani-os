// node scripts/hani-office-seats-215.test.mjs [--browser <playwright index.mjs> <browser exe>]
import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import vm from 'node:vm';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {assets} from './hani-office-v2-fixture.mjs';
import {fixture} from './hani-building-206-engine.test.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const source=fs.readFileSync(path.join(root,'hani-office-live.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const context=vm.createContext({HaniOfficeV2Assets:assets,document:{getElementById:()=>null},window:{}});
vm.runInContext(source,context);
const api=context.HaniBuildingScene;
const plain=x=>JSON.parse(JSON.stringify(x));
const overlaps=(a,b)=>a[0]<b[2]&&a[2]>b[0]&&a[1]<b[3]&&a[3]>b[1];
const evidence=path.join(root,'artifacts/office-seats-215');
fs.mkdirSync(evidence,{recursive:true});

test('19 staff have unique named home chairs on their canonical floor; CEO reserved',()=>{
  const all=[];
  for(const f of api.floors){
    assert.ok(Object.isFrozen(api.seatMaps[f.id]));
    assert.equal(new Set(api.seatMaps[f.id].map(s=>s.id)).size,api.seatMaps[f.id].length);
    for(const id of f.residents){const seat=api.homeSeat(id);assert.ok(seat,id);assert.ok(api.seatMaps[f.id].includes(seat),id);all.push(seat);}
  }
  assert.equal(new Set(all).size,19);
  assert.equal(api.homeSeat('seoyun').id,'dev-lead');
  assert.equal(api.homeSeat('hani').id,'office_hani');
  assert.equal(api.homeSeat('yuna').id,'desk_yuna');
  assert.equal(api.homeSeat('chairman'),undefined);
  const f=fixture();
  assert.equal(f.map.querySelector('.hani-office-ceo-nameplate'),null);
  f.click('3f');assert.equal(f.map.querySelector('.hani-office-ceo-nameplate'),null);
});

test('every chair preserves canon ownership and uses its explicit v1 furniture footprint',()=>{
  for(const [floor,seats] of Object.entries(api.seatMaps))for(const seat of seats){
    assert.ok(seat.box.every(n=>n>=0&&n<=100));
    const anchor=assets.canon.anchors.find(a=>a.id===seat.anchor);const point=assets.art.anchors[anchor.id];assert.equal(seat.x,point.x);assert.equal(seat.y,point.y);assert.deepEqual(plain(seat.box),[point.x-1.4,point.y-1.4,point.x+1.4,point.y]);assert.equal(seat.owner,anchor.rendererSeat.owner);assert.equal(seat.zone,point.zone||anchor.rendererSeat.zone);
  }
});

test('31 days of work/break/meeting slots use valid noncolliding chairs with CEO always empty',()=>{
  for(let day=1;day<=31;day++)for(const time of ['09:00','10:05','12:05','15:05','16:05','18:00']){
    const now=`2026-10-${String(day).padStart(2,'0')}T${time}:00+09:00`;
    const snapshot=api.snapshot(now);
    assert.deepEqual(plain(snapshot),plain(api.snapshot(now)));
    for(const floor of snapshot.floors){
      const occupied=[];
      for(const p of floor.people){
        assert.ok(p.seat,`${now}/${p.id}`);assert.ok(api.seatMaps[floor.id].includes(p.seat));
        assert.notEqual(p.seat.owner,'chairman');
        assert.ok(!occupied.some(s=>overlaps(s.box,p.seat.box)),`${now} seat collision`);occupied.push(p.seat);
        if(p.activity==='rest')assert.equal(p.seat.zone,'lounge');
        if(p.activity==='meeting')assert.equal(p.seat.zone,'meeting');
      }
    }
  }
  const guests=api.assignSeats('2f',['hani','jieun','seoyun','dohyun','yuri','arin'].map(id=>({id,activity:'meeting'})));
  assert.equal(new Set(guests.map(p=>p.seat?.id)).size,6);
});

test('zone action pools combine role with place; lounge never claims desk work',()=>{
  for(const floor of api.floors)for(const id of floor.residents)for(const zone of ['desk','lounge','meeting','reception','server']){
    const pool=api.actionPool(id,zone);assert.ok(pool.length>=2);
    if(zone==='lounge')assert.ok(pool.every(t=>/커피|수다|쉬는/.test(t)));
    if(zone==='meeting')assert.ok(pool.every(t=>/회의|의견/.test(t)));
    if(zone==='reception')assert.ok(pool.every(t=>/안내|방문/.test(t)));
    if(zone==='server')assert.ok(pool.every(t=>/서버|자동화/.test(t)));
    const seat={zone};for(let slot=0;slot<20;slot++)assert.ok(pool.some(t=>api.bubble(id,seat,slot).endsWith(t)));
  }
  assert.ok(api.actionPool('seoyun','desk').includes('설계 검토 중'));
  assert.ok(api.actionPool('dohyun','desk').includes('코드 리뷰 중'));
});

test('actual renderer remains seated across timer updates, reloads and meeting round-trip',async()=>{
  const f=fixture('09:00',true,()=>true),g=fixture('09:00',true,()=>true);
  const state=f=>f.visible().map(a=>[a.dataset.person,a.dataset.seat,a.style.left,a.style.top,a.officeText.textContent]);
  for(const floor of ['5f','4f','3f','2f','1f']){
    f.click(floor);g.click(floor);assert.deepEqual(state(f),state(g));
    const original=state(f);for(let n=0;n<40;n++)f.timers.find(t=>t.ms===4200).fn();assert.deepEqual(state(f),original);
    for(const actor of f.visible()){
      const seat=api.seatMaps[floor].find(s=>s.id===actor.dataset.seat);
      assert.equal(actor.style.left,seat.x+'%');assert.equal(actor.style.top,seat.y+'%');
      assert.equal(actor.dataset.zone,seat.zone);assert.ok(actor.querySelector('.hani-office-name').textContent);
    }
  }
  f.click('3f');const home=state(f);
  f.context.window.haniOfficeLiveUpdate({case:{id:'seat-fixture',title:'좌석 확인'},reviews:[{agent_key:'JIEUN',review_round:1,summary:'합성 검토'}]});
  await f.ids.get('haniOfficeMeetingOpen').events.click();
  for(const actor of f.visible())assert.equal(actor.dataset.zone,'meeting');
  await f.ids.get('haniOfficeReturn').events.click();assert.deepEqual(state(f),home);
  f.setTime('12:05');f.click('4f');for(const a of f.visible().filter(a=>a.dataset.activity==='rest'))assert.match(a.officeText.textContent,/커피|수다|쉬는/);
});

test('logo removed, one persistent actor owner, lazy sprite slots and no random render path',()=>{
  assert.doesNotMatch(html,/class="hani-office-ci"/);
  assert.doesNotMatch(source,/Math\.random|localStorage|sessionStorage|\.clear\(/);
  const f=fixture();assert.equal(f.ids.get('haniOfficeActors').children.length,19);
  assert.equal(f.ids.get('haniOfficeActors').children.filter(a=>a.dataset.avatar==='pending').length,15);
  assert.equal(f.visible().length,4);
});
