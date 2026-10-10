// Exercise the real board with approved seed and synthetic records only.
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import {api,handlers as h,context,roster,plain,inspection} from "./hani-board.test.mjs";

vm.runInContext(fs.readFileSync(new URL("../hani-character-archive-data.js",import.meta.url),"utf8"),context);
const beforeMap=h.personaMap();
vm.runInContext(fs.readFileSync(new URL("../hani-relationship-seed.js",import.meta.url),"utf8"),context);
const seed=context.HaniRelationshipSeed;
assert.notEqual(h.personaMap(),beforeMap,"cache invalidates when seed loads");
for(const member of roster.people){
  const p=h.personaMap()[member.id],s=seed.people.find(p=>p.id===member.id);
  assert.deepEqual(plain(p.voice),[s.voice]);
  for(const field of ["quirks","hobbies","characterAxis","publicMode","privateMode","commentStyle","reactionTriggers","avoidTopics"])
    assert.deepEqual(plain(p[field]),plain(s[field]),member.id+" "+field);
  assert.equal(p.source.member,member,"roster owns name/rank/team");
  assert.equal(h.personaMode(member.id,{category:"WORK"}),s.publicMode);
  assert.equal(h.personaMode(member.id,{category:"LIFE"}),s.privateMode);
  assert.equal(h.personaMode(member.id,{category:"LOUNGE",pinned:true}),s.publicMode);
  assert.equal(h.personaMode(member.id,{category:"LIFE",title:"공지"}),s.publicMode);
}
assert.equal(h.staffAddress("hina","hani",{category:"LOUNGE"}),"하니 언니");
assert.equal(h.staffAddress("hani","hina",{category:"WORK"}),"히나");
for(const category of ["WORK","LIFE","LOUNGE","MEMORY"]){
  assert.equal(h.staffAddress("sua","seongmin",{category},1),"매니저님");
  assert.equal(h.staffAddress("seoyun","seongmin",{category},1),"대표님");
}
const allowed=["hani","jieun","haru","naeun","hina","seoyun"];
for(const member of roster.people){
  assert.equal(h.personaMap()[member.id].callsChairmanOppa,allowed.includes(member.id));
  const history=[];
  for(let i=0;i<500;i++){
    const casual={category:i%2?"LOUNGE":"LIFE",title:"쉬는 시간",body:"함께 이야기해요"};
    const address=h.staffAddress(member.id,"seongmin",casual,i,history);
    if(address==="오빠")assert.ok(allowed.includes(member.id));
    history.push({authorId:member.id,toOwner:true,address});
    for(const post of [{category:"WORK"},{category:"MEMORY"},{category:"LIFE",pinned:true},{category:"LOUNGE",title:"투자 이야기"},{category:"LIFE",body:"공지"}])
      assert.notEqual(h.staffAddress(member.id,"seongmin",post,i,history),"오빠");
  }
  const count=history.filter(c=>c.address==="오빠").length;
  assert.ok(count/history.length<=.15);
  assert.equal(count>0,allowed.includes(member.id),member.id+" occasional casual address");
}
const now=Date.parse("2026-10-10T01:00:00Z");
const post={id:"seed-topic",authorId:"seongmin",category:"WORK",title:"회귀 테스트와 버그",body:"재현과 검증을 같이 해요",createdAt:new Date(now).toISOString()};
api.setState({...plain(api.freshState()),books:[{id:"existing",title:"existing local record"}],boardPosts:[post]});
const good=h.candidateScore("yuri",post,post,[]);
const avoided={...post,body:post.body+" 검증 없이 '완료'라고 단정하는 글"};
assert.ok(h.candidateScore("yuri",avoided,avoided,[]).score<good.score,"avoidTopics lowers selection score");
assert.ok(h.candidateScore("yuri",avoided,avoided,[]).avoid>0);
assert.ok(h.candidateScore("yuri",{...post,authorId:"seoyun"}).affinity>0);
assert.ok(h.candidateScore("yuri",{...post,authorId:"seoyun"},post,[]).score>
  h.candidateScore("yuri",{...post,authorId:"external"},{...post,authorId:"external"},[]).score,"related author adds affinity");
const related={...post,category:"LIFE",authorId:"hani",title:"히나 퀴즈",body:"넌 너무 직진해."};
assert.ok(h.candidateScore("hina",related).callback>0,"inside joke boosts related candidate");
let participating=0;
for(let i=0;i<40;i++){
  const input={...post,id:"probe-"+i};
  const rows=h.queueReplies(input,input,[],now);
  assert.ok(rows.length<=h.replySafetyBound);
  participating+=Number(rows.length>0);
  assert.ok(new Set(rows.map(c=>c.authorId)).size<roster.people.length);
  assert.ok(rows.every(c=>h.candidateScore(c.authorId,input,input,[]).relevant));
  assert.ok(!rows.some(c=>["gaeun","haru","sua","taeo"].includes(c.authorId)),"unrelated staff do not join technical topic");
  assert.ok(rows.every(c=>!c.body.includes("오빠")),"WORK seed voice/quirks/callbacks cannot leak casual address");
}
assert.ok(participating>0&&participating<40,"Phase 3 energy still allows quiet and active threads");
for(const member of roster.people)for(const category of ["WORK","LIFE","LOUNGE","MEMORY"]){
  const input={...post,id:"generated-address-"+member.id+category,category,title:"같이 이야기해요",body:"@"+member.name+" 의견을 알려주세요"};
  const rows=h.queueReplies(input,input,[],now);
  for(const row of rows.filter(c=>c.body.includes("오빠"))){
    assert.ok(allowed.includes(row.authorId)&&["LIFE","LOUNGE"].includes(category));
    assert.equal(row.address,"오빠","voice/quirk/callback cannot bypass address gate");
  }
}
const empty={...post,title:"zzzz",body:"zzzz",category:"MEMORY"};
assert.equal(h.queueReplies(empty,empty,[],now).length,0,"no relevance means no automatic replies");
const source={id:"mention",authorId:"seongmin",body:"@MIR 왜 그렇게 봤나요?"};
assert.ok(h.queueReplies(empty,source,[],now).some(c=>c.authorId==="mir"),"explicit mention is relevant");
const pair={...post,id:"pair",category:"LOUNGE",authorId:"hani",title:"히나와 일본어 퀴즈",body:"@히나 넌 너무 직진해."};
const history=[];
for(let i=0;i<40;i++)history.push(...h.queueReplies({...pair,id:"pair-"+i},{...pair,id:"pair-"+i},[],now));
const callbackRows=history.filter(c=>seed.relations.some(r=>[...(r.callbacks||[]),r.insideJoke].filter(Boolean).some(s=>c.body.includes("‘"+s+"’"))));
assert.ok(callbackRows.length>0&&callbackRows.length<history.length/3,"callbacks occasional, not every reply");
const replies=h.queueReplies(pair,pair,[],now);
assert.ok(replies.some(c=>c.authorId==="hina"&&c.body.includes("하니 언니")),"relation nickname is used in actual generated body");
const queues=inspection().queues,state=plain(api.getState());
h.storyTemplate(pair,1);assert.equal(inspection().queues,queues);assert.deepEqual(plain(api.getState()),state,"read-only preview");
// Partial seed keeps existing archive fields; cache also handles removing a seed.
const full=context.HaniRelationshipSeed;
context.HaniRelationshipSeed={people:[{id:"hani",voice:"Seed voice"}],relations:[]};
assert.equal(h.personaMap().hani.voice[0],"Seed voice");assert.ok(h.personaMap().hani.quirks.length>0);
context.HaniRelationshipSeed=full;
const slots=new Map(),slot=()=>({textContent:"",innerHTML:"",hidden:false,disabled:false,addEventListener(){}});
for(const key of ["counts","author","postSubmit","commentSubmit","replyContext","detail","react","more","listCount","list","syncNotice","search","postForm","commentForm","preview","confirm"])slots.set(key,slot());
const root={querySelector:s=>slots.get(s.match(/data-board="([^"]+)"/)?.[1])||null,querySelectorAll:()=>[],addEventListener(){},classList:{contains:()=>false}};
context.document.getElementById=id=>id==="board"?root:null;
api.setState({...state,boardPosts:[{...post,authorId:"mir"}],boardComments:[]});
vm.runInContext(fs.readFileSync(new URL("../hani-board.js",import.meta.url),"utf8"),context);
assert.ok(slots.get("list").innerHTML.includes("AI ENTITY · SPECIAL MEMBER"),"MIR rendered title replaces rank");
assert.ok(!slots.get("list").innerHTML.includes("MIR · Native Intelligence"));
console.log("PASS: seed personas/modes, relation nickname, chairman address, six-person/category oppa gate, scoring/avoid/relevance, callbacks, read-only preview, MIR rendered label");
