// node scripts/hani-board-library-build.mjs [--check]
// Source JSON is owned by the content team. Empty input is a quiet board.
import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

export const repositoryRoot=fileURLToPath(new URL("../",import.meta.url));
export const weekdays=Object.freeze({sun:0,sunday:0,"일":0,"일요일":0,mon:1,monday:1,"월":1,"월요일":1,tue:2,tuesday:2,"화":2,"화요일":2,wed:3,wednesday:3,"수":3,"수요일":3,thu:4,thursday:4,"목":4,"목요일":4,fri:5,friday:5,"금":5,"금요일":5,sat:6,saturday:6,"토":6,"토요일":6});
export const internalMarker=/\[(?:사내 세계관 이야기|기록 기반 초안)\]|에 관한 제 생각\s*:|#\d+\s*[·?—–-]/;
const seasons={spring:"spring",summer:"summer",autumn:"autumn",fall:"autumn",winter:"winter","봄":"spring","여름":"summer","가을":"autumn","겨울":"winter"};
const values=v=>v===null||v===undefined||v===""||v==="all"||v==="any"?[]:v==="weekend"||v==="주말"?["sat","sun"]:v==="weekday"||v==="평일"?["mon","tue","wed","thu","fri"]:Array.isArray(v)?v:[v];
const fail=(id,message)=>{throw Error("Board library "+id+": "+message)};
const text=(v,id,field,max)=>{if(typeof v!=="string"||!v.trim()||v.length>max||internalMarker.test(v))fail(id,"invalid "+field);return v};

export function replyIndex(replyTo,comments,index,threadId){
  if(replyTo===null||replyTo===undefined||replyTo===""||replyTo==="post"||replyTo===threadId)return -1;
  if(Number.isInteger(replyTo))return replyTo>=0&&replyTo<index?replyTo:-2;
  if(typeof replyTo==="string"){
    for(let n=index-1;n>=0;n--)if(comments[n].id===replyTo||comments[n].authorId===replyTo)return n;
  }
  return -2;
}

export function dropChairmanComments(thread){
  if(!thread||!Array.isArray(thread.comments))return thread;
  const map=new Map(),kept=[];
  thread.comments.forEach((c,i)=>{if(c?.authorId!=="seongmin"){map.set(i,kept.length);kept.push(c)}});
  const comments=kept.map(c=>{
    if(!Number.isInteger(c.replyTo))return c;
    return {...c,replyTo:map.has(c.replyTo)?map.get(c.replyTo):null};
  });
  return {...thread,comments};
}
export function validateLibrary(threads,seed){
  if(!Array.isArray(threads))fail("input","expected threads array");
  const authors=new Set(seed.people.filter(p=>p.status!=="planned").map(p=>p.id).filter(id=>id!=="seongmin")),ids=new Set();
  return threads.map(source=>{
    // 회장님 words must only come from 회장님: drop library comments written as seongmin and re-link replies to them.
    const thread=dropChairmanComments(source);
    const id=thread?.id;
    if(typeof id!=="string"||!id.trim()||ids.has(id))fail(id,"missing or duplicate id");ids.add(id);
    if(!authors.has(thread.authorId))fail(id,"unknown staff authorId "+thread.authorId);
    if(!["WORK","LIFE","MEMORY","LOUNGE"].includes(thread.category))fail(id,"invalid category");
    text(thread.title,id,"title",200);text(thread.body,id,"body",20000);
    if(!Array.isArray(thread.topics)||thread.topics.some(v=>typeof v!=="string"||!v.trim()))fail(id,"invalid topics");
    const season=values(thread.season).map(v=>seasons[String(v).toLowerCase()]||fail(id,"invalid season"));
    const weekday=values(thread.weekday).map(v=>Number.isInteger(v)&&v>=0&&v<=6?v:weekdays[String(v).toLowerCase()]??fail(id,"invalid weekday"));
    if(thread.poll){
      if(!Array.isArray(thread.poll.options)||thread.poll.options.length<2||new Set(thread.poll.options).size!==thread.poll.options.length)fail(id,"invalid poll options");
      thread.poll.options.forEach(option=>text(option,id,"poll option",200));
      if(!thread.poll.votes||typeof thread.poll.votes!=="object"||Array.isArray(thread.poll.votes)||Object.keys(thread.poll.votes).length)fail(id,"static poll must start without votes");
    }
    if(!Array.isArray(thread.comments))fail(id,"invalid comments");
    const commentIds=new Set();
    const comments=thread.comments.map((comment,i)=>{
      if(!authors.has(comment?.authorId))fail(id,"unknown comment authorId at "+i);
      text(comment.body,id,"comment body",5000);
      if(!Number.isFinite(comment.afterMin)||comment.afterMin<0||comment.afterMin>(/^queen-\d{4}-\d{2}$/.test(id)?31*1440:10080))fail(id,"invalid afterMin at "+i);
      if(comment.voteChoice!==undefined&&(!thread.poll||!Number.isInteger(comment.voteChoice)||comment.voteChoice<0||comment.voteChoice>=thread.poll.options.length))fail(id,"invalid voteChoice at "+i);
      if(comment.id!==undefined){if(typeof comment.id!=="string"||!comment.id||commentIds.has(comment.id))fail(id,"invalid comment id");commentIds.add(comment.id)}
      const parent=replyIndex(comment.replyTo,thread.comments,i,id);
      if(parent===-2||parent>=0&&comment.afterMin<thread.comments[parent].afterMin)fail(id,"replyTo must reference an earlier comment arriving first at "+i);
      return {...comment,replyTo:parent<0?null:parent};
    });
    return {...thread,season,weekday,comments};
  });
}

export function renderLibrary(threads,bulletins={ilbo:[],market:[]}){
  // Freeze nested entries too; the runtime never edits the authored content.
  return "/* Generated by scripts/hani-board-library-build.mjs; do not edit. */\n"+
    "globalThis.HaniBoardLibrary = Object.freeze({threads:Object.freeze("+JSON.stringify(threads)+
    ".map(t=>Object.freeze({...t,...(t.poll?{poll:Object.freeze({...t.poll,options:Object.freeze(t.poll.options),votes:Object.freeze(t.poll.votes)})}:{}),topics:Object.freeze(t.topics),season:Object.freeze(t.season),weekday:Object.freeze(t.weekday),comments:Object.freeze(t.comments.map(c=>Object.freeze(c)))}))),bulletins:Object.freeze("+
    "{ilbo:Object.freeze("+JSON.stringify(bulletins.ilbo)+".map(Object.freeze)),market:Object.freeze("+JSON.stringify(bulletins.market)+".map(Object.freeze))})});\n";
}

// Reuse the newspaper/comic modules' authored publication sources at build time.
// Only dates and headlines travel in the existing bundle; no runtime fetch or image dependency.
export async function publicationBulletins(root){
  const read=async file=>{
    try{return JSON.parse(await fs.readFile(path.join(root,file),"utf8"))}
    catch(error){if(error.code==="ENOENT")return null;throw error}
  };
  const manifest=await read("data/hani-ilbo/issues.json"),ilbo=[];
  for(const entry of manifest?.issues||[]){
    if(!/^data\/hani-ilbo\/[\w-]+\.json$/.test(entry.file))fail("publication","invalid issue path");
    const issue=await read(entry.file);
    if(!issue)fail("publication","missing newspaper issue");
    if(issue.date!==entry.date||issue.number!==entry.number)fail("publication","issue identity mismatch");
    const title=issue.headline||issue.news?.find(x=>x.fictional===false)?.title;
    if(title)ilbo.push({date:issue.date,number:issue.number,title,draft:issue.editorialDraft===true});
  }
  const comic=await read("assets/data/newsroom-4cut/issues.json");
  const market=(comic?.issues||[]).map(issue=>({date:issue.publishDate,number:issue.number,title:issue.title}));
  return {ilbo,market};
}

// Static editorial generation: current staff are female, including the Female AI entity.
// The chairman is outside this roster. No runtime random choice or model request.
export function monthlyQueenThread(template,roster,canon){
  const members=roster.people.filter(p=>p.status!=="planned"&&p.id!==roster.chairman.id);
  const hash=value=>{let n=2166136261;for(const c of value)n=Math.imul(n^c.charCodeAt(0),16777619)>>>0;return n};
  const lines={
    hani:"범위는 인기상까지! 간식 예산까지 늘리진 말자고요 ㅋㅋ",
    yuna:"제가요?! 투표 안내도 빠뜨리지 않고 챙기겠습니다.",
    mir:"왜 함께 일하면 편할까? 이번엔 관찰만 하지 않고 나도 골랐어. 헤헤.",
    seoyun:"설계가 정리되면 다 같이 편해지죠. 오늘은 제 한 표도 통합합니다.",
    dohyun:"한 표 구현 완료. 같이 문제 풀 때 든든한 동료로 골랐어요.",
    serin:"넓게 살펴봤지만 이 선택은 짧게 적을게요. 같이 일해서 고마워요.",
    yuri:"제 선택 근거는 함께 일할 때의 든든함입니다. 인기상도 눌러 보고 갑니다.",
    arin:"매일의 작은 불편을 같이 줄여 주는 동료라 반가워요. 왕관은 클릭 한 번으로!",
    gaeun:"투표 일정 챙기다가 제 한 표도 챙겼어요. 축하 일정은 미리 비워 둘까요?",
    jieun:"한 표 예산 집행합니다. 함께 일하는 즐거움은 장부 밖에도 있네요.",
    haru:"비교는 해 봤는데 같이 커피 마실 때 편한 마음이 먼저더라고요 ㅋㅋ",
    naeun:"무리하지 않고 오래 함께할 수 있는 동료라 좋아요. 응원도 꾸준히 할게요.",
    hina:"이유를 한 번 더 생각했어요. 같이 배우고 확인해 주는 동료에게 보냅니다.",
    minji:"이번 달 회사 이야기의 한 장면으로 남겨 두고 싶어서 골랐어요 ㅋㅋ",
    sooyeon:"같이 있으면 다음 나들이도 기대돼요. 응원석에서 한 표 보냅니다!",
    sua:"제안부터 후속까지 함께 달려 주는 동료에게요. 축하 연락은 제가 챙길게요.",
    taeo:"요구사항은 동료 응원 한 표. 제안과 후속 실행도 함께 챙겨 주니 고맙죠.",
    daon:"하방 위험부터 보던 저도 오늘은 응원부터 적을게요. 든든한 동료라 골랐어요.",
    yoonseul:"같이 궁금한 걸 찾아보고 책장도 넘길 수 있어서 좋아요. 한 표 놓고 갑니다."
  };
  const start=Date.parse(template.date+"T00:00:00+09:00"),month=template.date.slice(0,7);
  const end=Date.UTC(Number(month.slice(0,4)),Number(month.slice(5)),1)-9*3600000;
  const days=Math.round((end-start)/86400000);
  const comments=members.map((member,i)=>{
    const voice=canon.people.find(p=>p.id===member.id)||member;
    const choices=members.filter(p=>p.id!==member.id).map(candidate=>{
      const peer=canon.people.find(p=>p.id===candidate.id)||candidate;
      const relationship=canon.relations.find(r=>r.a===member.id&&r.b===candidate.id||r.b===member.id&&r.a===candidate.id);
      const shared=(voice.hobbies||[]).filter(h=>(peer.hobbies||[]).includes(h)).length;
      const seed=JSON.stringify([template.id,member.id,candidate.id,voice.voice||member.role,peer.voice||candidate.role]);
      return {candidate,score:hash(seed)/4294967296+(relationship?.score||0)/100+shared*.15+(member.team===candidate.team ? .15 : 0)};
    }).sort((a,b)=>b.score-a.score||members.indexOf(a.candidate)-members.indexOf(b.candidate));
    const pick=choices[0].candidate;
    if(!lines[member.id])fail(template.id,"missing staff vote voice "+member.id);
    return {authorId:member.id,body:pick.name+" "+pick.rank+"에게 한 표! "+lines[member.id],
      voteChoice:members.indexOf(pick),replyTo:null,
      afterMin:hash(template.id+":"+member.id+":day")%days*1440+21*60+hash(template.id+":"+member.id+":minute")%120};
  });
  return {...template,poll:{options:members.map(p=>p.name),votes:{}},comments};
}

export async function buildLibrary({root=repositoryRoot,check=false}={}){
  const folder=path.join(root,"data/board-library");
  const files=(await fs.readdir(folder).catch(error=>{if(error.code==="ENOENT")return [];throw error})).filter(f=>f.endsWith(".json")).sort();
  const threads=[];
  for(const file of files){const value=JSON.parse(await fs.readFile(path.join(folder,file),"utf8"));const rows=Array.isArray(value)?value:value.threads;if(!Array.isArray(rows))fail(file,"expected array or {threads}");threads.push(...rows)}
  // Membership follows the same active roster as the lounge; relationship voices can lag new staff.
  const context=vm.createContext({window:{},document:{getElementById:()=>null}});
  vm.runInContext(await fs.readFile(path.join(root,"hani-organization-hub.js"),"utf8"),context);
  const seed=context.window.HaniOrganizationRoster;
  const hasQueen=threads.some(t=>/^queen-\d{4}-\d{2}$/.test(t.id));
  const canon=hasQueen?JSON.parse(await fs.readFile(path.join(root,"data/hani-relationship-seed-v1.json"),"utf8")):null;
  const authored=threads.map(t=>/^queen-\d{4}-\d{2}$/.test(t.id)?monthlyQueenThread(t,seed,canon):t);
  const result=validateLibrary(authored,seed),output=renderLibrary(result,await publicationBulletins(root)),target=path.join(root,"hani-board-library.js");
  if(check){if(await fs.readFile(target,"utf8").catch(()=>"")!==output)fail("runtime","stale hani-board-library.js; run builder")}
  else await fs.writeFile(target,output,"utf8");
  return {files:files.length,threads:result.length,output};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const result=await buildLibrary({check:process.argv.includes("--check")});
  console.log("PASS: board library "+(process.argv.includes("--check")?"check":"build")+" · "+result.files+" files / "+result.threads+" threads");
}
