import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import {fixture} from './hani-building-206-engine.test.mjs';

const readJson=rel=>JSON.parse(fs.readFileSync(new URL('../'+rel,import.meta.url),'utf8'));
const canon=readJson('data/hani-building/spatial-contract-v4.json');
const art=readJson('data/hani-building/art-map-v4.json');
const sprites=readJson('assets/sprites-v2/manifest.json');
const spritesV3=readJson('assets/sprites-v3/manifest-v3.json');
const table=readJson('assets/data/office-actions-323.json');
const places=readJson('data/hani-building/office-places-v3.json');
const liveSource=fs.readFileSync(new URL('../hani-office-live.js',import.meta.url),'utf8');

function createOfficeFixture(initialTime='09:00',reduced=false){
  return fixture(initialTime,reduced,()=>true,table,{HaniOfficeV2Assets:{canon,sprites,art,spritesV3,places}});
}

function pxDistance(a,b){
  return Math.hypot((a[0]-b[0])*art.width/100,(a[1]-b[1])*art.height/100);
}

const kstMs=hhmmss=>Date.parse('2026-11-27T'+hhmmss+'+09:00');

const FLOOR_1F_OBSTACLES=[
  [0,0,14,38],[0,34,7,46],[6,35,16,40],[11,17,17,38],[14,0,30,26],[29,18,37,31],[36,22,40,37],
  [30,0,62,24],[39,28,61,43],[56,22,62,34],[1,47,27,55],[6,52,12,72],[12,52,21,68],[17,64,25,77],
  [3,72,15,82],[5,78,12,85],[0,60,4,80],[24.5,46,26,63],[0,86,26,93],[28,58,30,95],[29,58,37,66],
  [30,68,37,92],[39.5,51,41,61],[48.5,51,50.5,61],[57.5,51,59.5,61],[36,63,43,87],[57,63,64,87],
  [62,58,74,67],[62,68,69,91],[70,65,74,95],[74,85,100,95],[61.5,29,63,46],[61.5,29,74,32],
  [72.5,29,74.5,47],[65,35,69,45],[62.5,42,66.5,49],[62,0,90,29],[74.5,30,80,39],[84.5,30,90,39],
  [79.5,39,86.5,45.5],[75.5,42.5,80.5,49.5],[86,42.5,91.5,49.5],[80.5,32,83,37.5],[90,0,100,46],
  [94,30,100,47],[87,48,100,84]
];

function hitsObstacle1F(pos){
  return FLOOR_1F_OBSTACLES.some(r=>pos[0]>=r[0]&&pos[0]<=r[2]&&pos[1]>=r[1]&&pos[1]<=r[3]);
}

const SHIFTS=[
  {code:'SCN-N01',label:'편의점 야간->주간 (07:00)',shiftTime:'07:00:00',outId:'npc-clerk-night',inId:'npc-clerk-day',post:'store',postId:'resident_post_store',waitId:'post_shift_wait_store'},
  {code:'SCN-N01',label:'편의점 주간->야간 (19:00)',shiftTime:'19:00:00',outId:'npc-clerk-day',inId:'npc-clerk-night',post:'store',postId:'resident_post_store',waitId:'post_shift_wait_store'},
  {code:'SCN-N02',label:'안내데스크 야간->주간 (09:00)',shiftTime:'09:00:00',outId:'npc-desk-night',inId:'npc-guide',post:'reception',postId:'resident_post_reception',waitId:'post_shift_wait_reception'},
  {code:'SCN-N02',label:'안내데스크 주간->야간 (18:00)',shiftTime:'18:00:00',outId:'npc-guide',inId:'npc-desk-night',post:'reception',postId:'resident_post_reception',waitId:'post_shift_wait_reception'},
  {code:'SCN-N03',label:'카페 야간->주간 (07:00)',shiftTime:'07:00:00',outId:'npc-barista-eunha',inId:'npc-barista-iseul',post:'cafe',postId:'resident_post_cafe',waitId:'post_shift_wait_cafe'},
  {code:'SCN-N03',label:'카페 주간->야간 (19:00)',shiftTime:'19:00:00',outId:'npc-barista-iseul',inId:'npc-barista-eunha',post:'cafe',postId:'resident_post_cafe',waitId:'post_shift_wait_cafe'}
];

test('1층 카운터 3쌍 6개 교대 시각(T-200s / T-60s / T+200s) 렌더러 + 스냅샷 핵심 조건 검증',()=>{
  const f=createOfficeFixture('09:00',false);
  const scene=f.context.HaniBuildingScene;
  const gate=[art.anchors.arrival_gate.x,art.anchors.arrival_gate.y];

  for(const s of SHIFTS){
    const T=kstMs(s.shiftTime);
    const snapAt=ms=>{
      f.setDateTime(ms);
      f.click('1f');
      const staff=scene.scheduler.snapshot(new Date(ms));
      return {
        states:scene.residents.snapshot(new Date(ms),staff,true,false),
        visible:f.visible()
      };
    };

    // 기준 1 (T - 200s): 현임자만 근무 중, 후임자 없음
    const pre=snapAt(T-200_000);
    const preOut=pre.states.find(p=>p.id===s.outId);
    const preIn=pre.states.find(p=>p.id===s.inId);
    assert.ok(preOut,`${s.label} T-200s outId 존재`);
    assert.equal(preOut.anchor,s.postId);
    assert.equal(preIn,undefined,`${s.label} T-200s inId 부재`);
    const preActorOut=pre.visible.find(a=>a.dataset.person===s.outId);
    assert.ok(preActorOut,`${s.label} T-200s DOM outActor 표시`);
    assert.equal(preActorOut.dataset.post,s.post);
    assert.equal(pre.visible.find(a=>a.dataset.person===s.inId),undefined);

    // 기준 2 (T - 60s): 양쪽 다 1층, 거리 >= 42px, 서로 마주보고 대사 <= 16자
    const mid=snapAt(T-60_000);
    const midOut=mid.states.find(p=>p.id===s.outId);
    const midIn=mid.states.find(p=>p.id===s.inId);
    assert.ok(midOut&&midIn,`${s.label} T-60s 양쪽 모두 1층 존재`);
    assert.equal(midOut.floor,'1f');
    assert.equal(midIn.floor,'1f');
    assert.equal(midOut.anchor,s.postId);
    assert.equal(midIn.anchor,s.waitId);
    assert.ok(!hitsObstacle1F(midIn.position),`${s.label} 대기 지점은 1층 가구/장애물 바깥`);
    assert.ok(pxDistance(midOut.position,midIn.position)>=42,`${s.label} T-60s 거리 >= 42px`);
    assert.notEqual(midOut.facing,midIn.facing,`${s.label} T-60s 서로 마주봄`);

    const domOut=mid.visible.find(a=>a.dataset.person===s.outId);
    const domIn=mid.visible.find(a=>a.dataset.person===s.inId);
    assert.ok(domOut&&domIn,`${s.label} T-60s DOM 양쪽 모두 표시`);
    assert.equal(domOut.dataset.post,s.post,'카운터 내 근무자는 data-post 유지');
    assert.equal(domIn.dataset.post,undefined,'대기 중인 후임자는 data-post 미적용');

    // 기준 3 (T + 200s): 전임자 퇴장, 후임자만 근무 중
    const post=snapAt(T+200_000);
    const postOut=post.states.find(p=>p.id===s.outId);
    const postIn=post.states.find(p=>p.id===s.inId);
    assert.equal(postOut,undefined,`${s.label} T+200s outId 퇴장`);
    assert.ok(postIn,`${s.label} T+200s inId 근무 중`);
    assert.equal(postIn.anchor,s.postId);
    const postActorIn=post.visible.find(a=>a.dataset.person===s.inId);
    assert.ok(postActorIn,`${s.label} T+200s DOM inActor 표시`);
    assert.equal(postActorIn.dataset.post,s.post);
    assert.equal(post.visible.find(a=>a.dataset.person===s.outId),undefined);

    // 교대 창([-180s..+40s]) 추적: 접근/퇴장은 1초, 중간 대화 구간은 2초 간격으로 검증
    const phases=new Set();
    const linesSeen=new Set();
    const prevPos=new Map();
    let sawInAtGate=false;
    let outLastPos=null;
    let outVanishedAt=null;
    let cachedStaff=null;
    let cachedBucket=null;

    for(let sec=-180;sec<=40;sec+=(sec<-164||sec>=4)?1:2){
      const ms=T+sec*1000;
      const bucket=Math.floor(sec/30);
      if(bucket!==cachedBucket){cachedBucket=bucket;cachedStaff=scene.scheduler.snapshot(new Date(ms));}
      const states=scene.residents.snapshot(new Date(ms),cachedStaff,true,false,false);
      const stIn=states.find(p=>p.id===s.inId);
      const stOut=states.find(p=>p.id===s.outId);

      // 같은 층 교대 NPC 간 겹침 방지 (>= 30px)
      const handover1F=states.filter(p=>p.floor==='1f'&&p.handover);
      for(let i=0;i<handover1F.length;i++){
        for(let j=i+1;j<handover1F.length;j++){
          assert.ok(pxDistance(handover1F[i].position,handover1F[j].position)>=30,`${s.label} ${sec}s 1층 교대 배우 겹침(${handover1F[i].id},${handover1F[j].id})`);
        }
      }

      if(stIn){
        if(stIn.handover?.phase)phases.add(stIn.handover.phase);
        if(stIn.anchor==='arrival_gate'&&stIn.walking)sawInAtGate=true;
        if(stIn.scene?.line){
          assert.ok(stIn.scene.line.length<=16,`${s.label} 대사 16자 초과: ${stIn.scene.line}`);
          linesSeen.add(stIn.scene.line);
        }
        if(prevPos.has(s.inId))assert.ok(pxDistance(prevPos.get(s.inId),stIn.position)<=200,`${s.label} inId ${sec}s 텔레포트`);
        prevPos.set(s.inId,stIn.position);
      }

      if(stOut){
        if(stOut.handover?.phase)phases.add(stOut.handover.phase);
        if(stOut.scene?.line){
          assert.ok(stOut.scene.line.length<=16,`${s.label} 대사 16자 초과: ${stOut.scene.line}`);
          linesSeen.add(stOut.scene.line);
        }
        if(prevPos.has(s.outId))assert.ok(pxDistance(prevPos.get(s.outId),stOut.position)<=200,`${s.label} outId ${sec}s 텔레포트`);
        prevPos.set(s.outId,stOut.position);
        outLastPos=stOut.position;
      }else if(outVanishedAt===null){
        outVanishedAt=sec;
        assert.ok(sec>0,`${s.label} 정각 전 전임자 조기 퇴장 금지(${sec}s)`);
        assert.ok(outLastPos&&pxDistance(outLastPos,gate)<=150,`${s.label} 1층 입구 도달 전 중도 사라짐(${outLastPos})`);
      }

      // 접근/퇴장 로비 보행 시 대기/통로 구간 장애물 비침범 확인
      for(const st of [stIn,stOut]){
        if(st?.walking&&st.anchor==='arrival_gate'){
          assert.ok(!hitsObstacle1F(st.position),`${s.label} ${sec}s ${st.id} 가구/장애물 통과: ${st.position}`);
        }
      }
    }

    for(const beat of ['approach','face','talk','reaction','disperse']){
      assert.ok(phases.has(beat),`${s.label} beat 누락: ${beat}`);
    }
    assert.ok(sawInAtGate,`${s.label} 후임 1층 입구(arrival_gate) 등장 누락`);
    assert.ok(linesSeen.size>=3,`${s.label} 교대 대화 노출 부족(${linesSeen.size})`);
  }
});

test('결정론(동일 시각 동일 상태), reduced 모션 즉시 교대, 은하 졸음(doze) 유지, 무저장/무난수/무네트워크',()=>{
  const f=createOfficeFixture('09:00',false);
  const scene=f.context.HaniBuildingScene;
  const checkMs=kstMs('18:59:00');
  const staff=scene.scheduler.snapshot(new Date(checkMs));
  const a=scene.residents.snapshot(new Date(checkMs),staff,true,false);
  const b=scene.residents.snapshot(new Date(checkMs),staff,true,false);
  assert.deepEqual(a,b,'동일 시각 입력에 완전히 동일한 스냅샷');

  // reduced 모션에서는 걷기 없이 T 이전 현임자 / T 이후 후임자 바로 전환
  const rPre=scene.residents.snapshot(new Date(kstMs('18:59:00')),staff,true,true);
  assert.ok(rPre.some(p=>p.id==='npc-clerk-day'&&!p.walking));
  assert.ok(!rPre.some(p=>p.id==='npc-clerk-night'));
  const rPost=scene.residents.snapshot(new Date(kstMs('19:00:05')),scene.scheduler.snapshot(new Date(kstMs('19:00:05'))),true,true);
  assert.ok(rPost.some(p=>p.id==='npc-clerk-night'&&!p.walking));
  assert.ok(!rPost.some(p=>p.id==='npc-clerk-day'));

  // 은하의 야간 수면 시간대 doze('sitting') 유지 확인 (교대 창 바깥)
  const nightMs=kstMs('03:00:00');
  const eunhaNight=scene.residents.snapshot(new Date(nightMs),scene.scheduler.snapshot(new Date(nightMs)),true,false).find(p=>p.id==='npc-barista-eunha');
  assert.ok(eunhaNight,'새벽 3시 은하 근무 중');
  assert.equal(eunhaNight.pose,'sitting','은하 doze 상태 유지');

  // 금지 항목 정적 검증
  assert.ok(!/Math\.random\s*\(/.test(liveSource),'Math.random 사용 금지');
});

test('대기 지점 포스트 거리(60~100px, 안내데스크는 데스크 전면 하단), occupied 시 두 번째 지점 전환, 19:00 말풍선 실제 표시 검증',()=>{
  const f=createOfficeFixture('18:58',false);
  const scene=f.context.HaniBuildingScene;

  for(const s of SHIFTS){
    const T=kstMs(s.shiftTime);
    const ms=T-60_000;
    const baseStates=scene.residents.snapshot(new Date(ms),null,true,false,false);
    const outSt=baseStates.find(p=>p.id===s.outId);
    const inSt=baseStates.find(p=>p.id===s.inId);
    assert.ok(outSt&&inSt,`${s.label} 기본 대기 스냅샷 존재`);
    const dist=pxDistance(outSt.position,inSt.position);
    const maxDist=s.post==='reception'?175:100;
    assert.ok(dist>=60&&dist<=maxDist,`${s.label} 대기 지점 포스트 거리 ${dist.toFixed(1)}px (60~${maxDist}px)`);
    if(s.post==='reception')assert.ok(inSt.position[1]>46.8,`${s.label} 안내데스크 대기 지점은 기존 46.8% 아래(${inSt.position[1]}%)`);

    const occupiedStaff={floors:[{id:'1f',people:[{id:'occupant-test',floor:'1f',position:inSt.position}]}]};
    const altStates=scene.residents.snapshot(new Date(ms),occupiedStaff,true,false,false);
    const altIn=altStates.find(p=>p.id===s.inId);
    assert.ok(altIn,`${s.label} occupied 시에도 후임자 존재`);
    assert.equal(altIn.anchor,s.waitId);
    assert.ok(!hitsObstacle1F(altIn.position),`${s.label} 두 번째 대기 지점 장애물 바깥`);
    assert.ok(pxDistance(altIn.position,inSt.position)>=60,`${s.label} occupied 시 두 번째 지점으로 이동`);
    const altDist=pxDistance(outSt.position,altIn.position);
    assert.ok(altDist>=60&&altDist<=maxDist,`${s.label} 두 번째 대기 지점 포스트 거리 ${altDist.toFixed(1)}px (60~${maxDist}px)`);
  }

  // 18:57:45~18:59:25 교대 대화 창에서 기존 actorBubble 경로로 말풍선이 실제로 표시되는지 확인 (ms <= 1000 타이머만 실행)
  const bubble=f.map.querySelector('.hani-office-character-bubble');
  const tickFast=()=>{for(const t of f.timers)if(t.ms<=1000)t.fn();};
  const seenBubbles=new Set();
  for(const hhmmss of ['18:58:10','18:58:40','18:59:10']){
    f.setDateTime(kstMs(hhmmss));
    f.click('4f');
    f.click('1f');
    tickFast();
    assert.equal(bubble.hidden,false,`${hhmmss} 1층 교대 말풍선 표시`);
    seenBubbles.add(bubble.querySelector('p').textContent);
  }
  f.hide();
  assert.ok(seenBubbles.size>=2,'19:00 교대 중 서로 다른 교대 대사 말풍선 노출');
});
