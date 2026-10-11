/* HANI GROUP BOARD. Existing save/Cloud paths own persistence. */
(() => {
  "use strict";
  const categories=["WORK","LIFE","MEMORY","LOUNGE"],pageSize=20;
  const root=document.getElementById("board");
  const get=key=>root?.querySelector('[data-board="'+key+'"]');
  const escape=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const roster=()=>window.HaniOrganizationRoster,actor=()=>roster()?.chairman?.id;
  const relationshipSeed=()=>globalThis.HaniRelationshipSeed||window.HaniRelationshipSeed;
  const seedPerson=id=>relationshipSeed()?.people?.find(p=>p.id===id);
  const relation=(a,b)=>relationshipSeed()?.relations?.find(r=>r.a===a&&r.b===b||r.a===b&&r.b===a);
  const relationNickname=(from,to)=>{const r=relation(from,to);return r?.nicknames?.[r.a===from?"a_to_b":"b_to_a"]||""};
  const posts=()=>state.boardPosts||[],comments=()=>state.boardComments||[];
  const published=p=>!p.pending&&!p.draft&&!p.boardMeta&&!p.disposition;
  const visibleComments=()=>comments().filter(c=>!c.pending&&!c.draft&&!c.disposition);
  const count=v=>typeof v==="number"&&Number.isFinite(v)?Math.max(0,Math.min(Number.MAX_SAFE_INTEGER,Math.floor(v))):0;
  // Read projections only: loading never rewrites legacy or unknown fields.
  const postFields=r=>({...r,views:count(r.views),likes:count(r.likes),likedByOwner:r.likedByOwner===true});
  const commentFields=r=>({...r,parentId:typeof r.parentId==="string"?r.parentId:"",generated:r.generated===true,threadId:typeof r.threadId==="string"?r.threadId:""});
  // Tab session survives reloads. Storage failure falls back to the in-memory set.
  // This UI-only sessionStorage marker never touches the protected localStorage key.
  const viewSessionKey="hani_board_session_views_v1",viewed=new Set();
  try{
    const ids=JSON.parse(sessionStorage.getItem(viewSessionKey)||"[]");
    if(Array.isArray(ids))ids.filter(id=>typeof id==="string").forEach(id=>viewed.add(id));
  }catch{};
  let selected="",filter="ALL",query="",visible=pageSize,editing=null,pending=null,replyTo="";
  let listPosition=0,hashViewPending="";
  let preview=null,generation=0,ticket=0,busy=false,previewError="";
  const status=message=>{if(get("status"))get("status").textContent=message};
  function writeBlockReason(){
    if(typeof cloudUser==="undefined"||!cloudUser||!actor())return "로그인 후 Cloud 동기화가 준비되면 게시판에 참여할 수 있습니다.";
    if(typeof loadRecovery==="undefined"||loadRecovery.active)return "원본 보호 중에는 게시판을 저장할 수 없습니다.";
    if(typeof importSyncHold==="undefined"||importSyncHold)return "가져온 데이터의 동기화를 확인한 뒤 게시판에 참여할 수 있습니다.";
    if(typeof cloudRecoveryMode==="undefined"||cloudRecoveryMode)return "Cloud 복구를 마친 뒤 게시판에 참여할 수 있습니다.";
    if(typeof cloudAutoSyncReady==="undefined"||cloudAutoSyncReady!==true||typeof cloudRuntime==="undefined"||cloudRuntime?.sync!=="ON")
      return typeof cloudRuntime!=="undefined"&&cloudRuntime?.message||"Cloud 동기화가 아직 준비되지 않았습니다.";
    if(typeof cloudHasMeaningfulLocalData!=="function"||!cloudHasMeaningfulLocalData(state))return "Local 데이터의 기준을 확인한 뒤 게시판에 참여할 수 있습니다.";
    return "";
  }
  const canWrite=(explain=false)=>{const reason=writeBlockReason();if(reason&&explain)status(reason);return !reason};
  const own=row=>!!actor()&&row?.authorId===actor();
  const person=id=>roster()?(id===roster().chairman?.id?roster().chairman:roster().people?.find(p=>p.id===id)):null;
  function authorParts(id){
    const member=person(id);if(!member)return {name:"알 수 없는 작성자",rank:"",team:""};
    const team=roster()?.teams?.find(t=>t.id===member.team);
    return {name:id===actor()?"성민":id==="mir"?"MIR":member.name,rank:id==="mir"||seedPerson(id)?.specialEntity?"AI ENTITY":member.rank,
      team:id===actor()?"HANI GROUP":team?.name||member.team||"HANI GROUP"};
  }
  const author=id=>Object.values(authorParts(id)).filter(Boolean).join(" · ");
  function avatar(id,size=28){
    const member=person(id),initial=escape(Array.from(member?.name||"?")[0]);
    const src=!member?"":id===actor()?"./assets/team/hani-org-chair-v1.webp":
      member.group==="M9"?"./assets/profiles/thumb/hani-profile-"+member.id+"-128.webp":
      "./assets/profiles/hani-staff-"+member.id+(member.id==="seoyun"?"-v7.webp":"-v5.webp");
    return '<span class="board-avatar-frame'+(size===40?' board-avatar-large':'')+'" aria-hidden="true"><span class="board-avatar board-initial">'+initial+'</span>'+
      (src?'<img class="board-avatar" data-board-avatar src="'+escape(src)+'" alt="" loading="lazy" decoding="async" width="'+size+'" height="'+size+'">':'')+'</span>';
  }
  function authorCard(id,size=28){
    const p=authorParts(id);
    const known=id===actor()||!!person(id),tag=known?'a':'span';
    return '<'+tag+' class="board-author"'+(known?' href="#organization/people/'+escape(id)+'" data-board-person="'+escape(id)+'"':'')+' title="'+escape(author(id))+'" aria-label="'+escape(author(id))+' 소개">'+avatar(id,size)+
      '<span class="board-author-text"><strong>'+escape(p.name)+'</strong><span class="board-author-meta"> · '+escape(p.rank)+'<span class="board-author-team"> · '+escape(p.team)+'</span></span></span></'+tag+'>';
  }
  // Labels from earlier versions are hidden even while writes are blocked.
  const oldMarker=/\[(?:사내 세계관 이야기|기록 기반 초안)\]|에 관한 제 생각\s*:/;
  const publicText=value=>String(value??"").replace(/\[(?:사내 세계관 이야기|기록 기반 초안)\]\s*|에 관한 제 생각\s*:|#\d+\s*[·?—–-]?\s*/g,"");
  function boardDate(value,now=Date.now()){
    const time=new Date(value).getTime();if(!Number.isFinite(time))return "시간 미상";
    const kst=new Date(time+9*3600000).toISOString();
    return kst.slice(0,10)===dayKey(now)?kst.slice(11,16):kst.slice(5,10).replace("-",".");
  }
  function relativeTime(value,now=Date.now()){
    const time=new Date(value).getTime();if(!Number.isFinite(time))return "시간 미상";
    const seconds=Math.max(0,Math.floor((now-time)/1000));
    if(seconds<60)return "방금 전";if(seconds<3600)return Math.floor(seconds/60)+"분 전";
    if(seconds<86400)return Math.floor(seconds/3600)+"시간 전";
    if(seconds<604800)return Math.floor(seconds/86400)+"일 전";
    return new Date(time).toLocaleDateString("ko-KR");
  }
  const stamp=row=>'<time title="'+escape(row.createdAt)+'">'+escape(boardDate(row.createdAt))+'</time>';
  function persist(nextPosts,nextComments){
    if(!canWrite(true))return false;
    const before=state;
    state={...state,boardPosts:nextPosts,boardComments:nextComments,meta:{...(state.meta||{})}};
    let result;try{result=save()}catch(error){result={ok:false,message:error?.message}}
    if(!result?.ok){state=before;render();status(result?.message||"저장하지 못했습니다. 기존 기록을 유지합니다.");return false}
    render();status("게시판 기록을 저장했습니다.");return true;
  }
  // These public handlers are also the single delegated DOM event path.
  function savePost(input,id=""){
    if(!canWrite(true))return false;
    const title=String(input.title||"").trim(),body=String(input.body||"").trim();
    if(!title||!body||title.length>200||body.length>20000||!categories.includes(input.category)){
      status("제목(200자 이내), 내용(20,000자 이내), 분류를 확인해 주세요.");return false;
    }
    const old=id?posts().find(p=>p.id===id):null;if(id&&(!own(old)||!published(old)))return false;
    const now=new Date().toISOString();
    const row={...postFields(old||{}),id:old?.id||uid(),authorId:old?.authorId||actor(),
      category:input.category,title,body,createdAt:old?.createdAt||now,updatedAt:now,pinned:!!input.pinned};
    const queued=id?[]:queueReplies(row,row,comments(),Date.now());
    if(!persist(id?posts().map(p=>p.id===id?row:p):[...posts(),row],[...comments(),...queued]))return false;
    selectPost(row.id);return true;
  }
  function saveComment(postId,body,id="",parentId=""){
    if(!canWrite(true)||!posts().some(p=>p.id===postId&&published(p)))return false;
    body=String(body||"").trim();
    if(!body||body.length>5000){status("댓글을 5,000자 이내로 입력해 주세요.");return false}
    const old=id?comments().find(c=>c.id===id):null;
    if(id&&(!own(old)||old.postId!==postId))return false;
    if(!id&&parentId){
      const parent=visibleComments().find(c=>c.id===parentId&&c.postId===postId);
      if(!parent||commentFields(parent).parentId){status("답글은 원댓글에 한 단계만 달 수 있습니다.");return false}
    }
    const row={...commentFields(old||{}),id:old?.id||uid(),postId,authorId:old?.authorId||actor(),body,
      parentId:old?commentFields(old).parentId:parentId,createdAt:old?.createdAt||new Date().toISOString()};
    const next=id?comments().map(c=>c.id===id?row:c):[...comments(),row];
    const queued=id?[]:queueReplies(posts().find(p=>p.id===postId),row,next,Date.now());
    return persist(posts(),[...next,...queued]);
  }
  function deleteOwn(kind,id){
    if(!canWrite(true))return false;
    if(kind==="post"){
      if(!own(posts().find(p=>p.id===id&&published(p))))return false;
      return persist(posts().filter(p=>p.id!==id),comments()); // No cascade.
    }
    if(kind==="comment"){
      if(!own(comments().find(c=>c.id===id)))return false;
      return persist(posts(),comments().filter(c=>c.id!==id)); // Orphan replies remain visible.
    }
    return false;
  }
  function selectPost(id,updateHash=true){
    if(root&&(updateHash||!selected))listPosition=window.scrollY||0;
    selected=id;
    if(updateHash)hashViewPending="";
    const index=listPosts().findIndex(p=>p.id===id);
    if(index>=0)visible=Math.max(visible,Math.ceil((index+1)/pageSize)*pageSize);
    if(updateHash&&typeof history!=="undefined"&&typeof location!=="undefined"){
      const next="#board/"+encodeURIComponent(id);
      if(location.hash!==next)history.pushState(null,"",next);
    }
  }
  function closePost(updateHash=true){
    selected="";hashViewPending="";replyTo="";resetEditor();render();
    if(updateHash&&typeof history!=="undefined")history.replaceState(null,"","#board");
    window.scrollTo?.({top:listPosition,left:0,behavior:"auto"});
    return true;
  }
  function hashPost(){
    if(typeof location==="undefined"||!location.hash.startsWith("#board/"))return "";
    try{return decodeURIComponent(location.hash.slice(7))}catch{return ""}
  }
  function restorePost(){
    if(typeof location==="undefined"||!root?.classList?.contains("active"))return;
    const id=hashPost();
    if(id&&id!==selected)openPost(id,false);
    else if(!id&&selected)closePost(false);
    else if(id)render();
  }
  function openPost(id,updateHash=true){
    const post=posts().find(p=>p.id===id&&published(p));if(!post)return false;selectPost(id,updateHash);
    const changed=canWrite()&&viewChange(id,posts(),comments(),Date.now());
    if(changed){
      if(persist(changed,comments()))rememberView(id);
      else if(!updateHash)hashViewPending=id;
    }else if(!updateHash&&!canWrite()&&!viewed.has(id))hashViewPending=id;
    render();return true;
  }
  function viewChange(id,rows,history,now){
    const post=rows.find(p=>p.id===id&&published(p));if(!post)return null;
    const thread=history.filter(c=>c.postId===id&&!c.pending&&!c.draft&&!c.disposition);
    if(viewed.has(id)&&!thread.some(c=>c.generated&&new Date(c.arrivedAt||c.createdAt).getTime()>new Date(post.seenStaffAt||0).getTime()))return null;
    const row=postFields(post),seen=Math.max(now,...thread.map(c=>new Date(c.arrivedAt||c.createdAt).getTime()).filter(Number.isFinite));
    return rows.map(p=>p.id===id?{...row,views:count(row.views+(!viewed.has(id)?1:0)),seenStaffAt:new Date(seen).toISOString()}:p);
  }
  function rememberView(id){
    viewed.add(id);try{sessionStorage.setItem(viewSessionKey,JSON.stringify([...viewed]))}catch{}
  }
  function toggleLike(id){
    if(!canWrite(true))return false;
    const post=posts().find(p=>p.id===id&&published(p));if(!post)return false;
    const row=postFields(post),liked=!row.likedByOwner;
    return persist(posts().map(p=>p.id===id?{...row,likedByOwner:liked,likes:count(row.likes+(liked?1:-1))}:p),comments());
  }
  function listPosts(tab=filter,search=query){
    const needle=String(search).trim().toLocaleLowerCase("ko-KR");
    return posts().filter(p=>published(p)&&(tab==="ALL"||tab==="POPULAR"||p.category===tab)&&
      (!needle||[p.title,p.body,author(p.authorId)].some(v=>String(v||"").toLocaleLowerCase("ko-KR").includes(needle))))
      .slice().sort((a,b)=>Number(!!b.pinned)-Number(!!a.pinned)||
        (tab==="POPULAR"?postFields(b).likes-postFields(a).likes||postFields(b).views-postFields(a).views:0)||
        String(b.createdAt).localeCompare(String(a.createdAt))||String(b.id).localeCompare(String(a.id)));
  }
  const actions=(row,kind)=>own(row)?'<div class="acts"><button class="btn sm" type="button" data-board-edit="'+kind+'" data-key="'+escape(row.id)+'"'+(!canWrite()?' disabled':'')+'>수정</button><button class="btn sm danger" type="button" data-board-delete="'+kind+'" data-key="'+escape(row.id)+'"'+(!canWrite()?' disabled':'')+'>삭제</button></div>':"";
  const html=(key,value)=>{const slot=get(key);if(slot&&slot.innerHTML!==value)slot.innerHTML=value};
  function orderedComments(thread){
    const compare=(a,b)=>String(a.createdAt||"").localeCompare(String(b.createdAt||""))||String(a.id).localeCompare(String(b.id));
    const sorted=[...thread].sort(compare),byId=new Map(sorted.map(c=>[c.id,c])),groups=new Map();
    for(const c of sorted){
      let root=c;const chain=new Set([c.id]);
      while(byId.has(root.parentId)){
        const parent=byId.get(root.parentId);
        if(chain.has(parent.id)){root=sorted.find(row=>chain.has(row.id));break}
        chain.add(parent.id);root=parent;
      }
      if(!groups.has(root.id))groups.set(root.id,[]);
      groups.get(root.id).push(c);
    }
    return [...groups.keys()].map(id=>byId.get(id)).sort(compare).flatMap(root=>[
      {comment:root,nested:false},...groups.get(root.id).filter(c=>c.id!==root.id).sort(compare).map(comment=>({comment,nested:true}))
    ]);
  }
  function commentMarkup(c,nested=false,allowReply=true){
    const parent=c.parentId&&visibleComments().find(p=>p.id===c.parentId);
    return '<article class="board-comment'+(nested?' board-reply':'')+'"'+(c.parentId?' data-board-parent="'+escape(c.parentId)+'"':'')+'><header>'+authorCard(c.authorId)+'<span class="sub">'+stamp(c)+(c.generated?' · 직원 반응':'')+'</span></header><p class="board-body">'+(parent?'<span class="board-mention">@'+escape(parent.authorId===actor()?'회장님':authorParts(parent.authorId).name)+'</span> ':'')+escape(publicText(c.body))+'</p>'+actions(c,"comment")+
      (allowReply?'<button class="btn sm" type="button" data-board-reply="'+escape(c.id)+'"'+(!canWrite()?' disabled':'')+'>답글</button>':"")+'</article>';
  }
  function render(){
    if(!root)return;
    const writable=canWrite(),notice=get("syncNotice");
    if(notice){if(writable&&!notice.hidden)status("");notice.hidden=writable}
    if(!writable)status(writeBlockReason());
    if(get("replyMode"))get("replyMode").disabled=!writable;
    get("counts").textContent="글 "+posts().filter(published).length+" · 댓글 "+visibleComments().length;
    paintLiving(writable);
    get("author").textContent=author(actor());
    get("postSubmit").disabled=!writable;get("commentSubmit").disabled=!writable;
    root.querySelectorAll("[data-board-filter]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.boardFilter===filter)));
    const rows=listPosts(),totals=new Map();visibleComments().forEach(c=>totals.set(c.postId,(totals.get(c.postId)||0)+1));
    html("list",'<table class="board-table board-mobile-two-line"><caption class="board-sr-only">사내 게시글 목록</caption><colgroup><col class="board-col-category"><col class="board-col-title"><col class="board-col-author"><col class="board-col-date"><col class="board-col-number"><col class="board-col-number"></colgroup><thead><tr>'+["탭(말머리)","제목","글쓴이","날짜","조회","추천"].map(label=>'<th scope="col">'+label+'</th>').join("")+'</tr></thead><tbody>'+
      (rows.slice(0,visible).map(raw=>{const p=postFields(raw);return '<tr class="board-row'+(p.pinned?' board-pinned':'')+(selected===p.id?' board-current':'')+'">'+
        '<td class="board-cell-category"><span class="board-category board-category-'+escape(String(p.category||"").toLowerCase())+'">'+(p.pinned?'공지':escape(p.category))+'</span></td>'+
        '<td class="board-cell-title"><button type="button" class="board-title" data-board-open="'+escape(p.id)+'" aria-pressed="'+String(selected===p.id)+'"><span class="board-title-text">'+escape(publicText(p.title))+'</span>'+
        ((totals.get(p.id)||0)?' <strong class="board-comment-count">'+totals.get(p.id)+'</strong>':'')+
        (p.poll?'<span class="board-post-icon" title="투표" aria-label="투표">📊</span>':'')+(p.seriesId?'<span class="board-post-icon" title="연재" aria-label="연재">▤</span>':'')+newBadge(p)+'</button></td>'+
        '<td class="board-cell-author">'+authorCard(p.authorId)+'</td><td class="board-cell-date">'+stamp(p)+'</td>'+
        '<td class="board-cell-views"><span class="board-mobile-label">조회 </span>'+p.views+'</td><td class="board-cell-likes'+(p.likes>0?' board-has-likes':'')+'"><span class="board-mobile-label">추천 </span>'+p.likes+'</td></tr>'}).join("")||
        '<tr><td colspan="6" class="empty">'+(query?'검색 결과가 없습니다.':'아직 게시글이 없습니다.')+'</td></tr>')+'</tbody></table>');
    get("more").hidden=visible>=rows.length;get("listCount").textContent=rows.length+"개 글 · "+Math.min(visible,rows.length)+"개 표시";
    const raw=posts().find(p=>p.id===selected&&published(p)),post=raw&&postFields(raw);
    get("detail").hidden=!post;get("react").disabled=!post||post.authorId!==actor()||!writable||busy;
    if(get("preview")?.open)paintPreview();
    get("replyContext").textContent=replyTo?author(comments().find(c=>c.id===replyTo)?.authorId)+"에게 답글":"";
    if(!post){html("article","");html("comments","");return}
    html("article",'<span class="pill">'+escape(post.category)+'</span>'+(post.pinned?' <span class="board-notice">공지</span>':"")+'<h3 tabindex="-1" data-board-heading>'+escape(publicText(post.title))+'</h3><div class="board-detail-meta">'+authorCard(post.authorId,40)+'<span class="sub">'+stamp(post)+' · 조회 '+post.views+' · 추천 '+post.likes+'</span>'+newBadge(post)+'</div><p class="board-body">'+escape(publicText(post.body))+'</p>'+interactiveMarkup(post,writable)+'<button class="btn" type="button" data-board-like="'+escape(post.id)+'" aria-pressed="'+post.likedByOwner+'"'+(!writable?' disabled':'')+'>👍 추천 '+post.likes+'</button>'+actions(post,"post"));
    const thread=visibleComments().filter(c=>c.postId===post.id).map(commentFields).sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt)));
    html("comments",orderedComments(thread).map(({comment,nested})=>commentMarkup(comment,nested,!comment.parentId)).join("")||'<p class="empty">첫 댓글을 남겨 주세요.</p>');
  }

  // Discovered contracts: earnings-dialogue is report-only; orchestrator writes cases;
  // learning-quiz returns a fixed quiz schema. No reusable free-prompt text endpoint.
  // Single seam for a future owner-JWT server invocation.
  function generateThreadAdapter(post,round,request={}){
    if(request.kind==="reply")return {label:"직원 반응 미리보기",comments:localQueueReplies(post,request.source,request.history,request.now)};
    return {label:"직원 반응 미리보기",comments:ownerReactions(post,post,comments(),round)};
  }
  // One policy for both the Phase 2 preview adapter and living drafts/replies.
  const ADDRESS_RULES=Object.freeze({
    chairman:Object.freeze(["회장님","대표님"]),chairmanWeights:Object.freeze([75,25]),
    casualCategories:Object.freeze(["LOUNGE","LIFE"]),oppaRate:.12,oppaMaxShare:.15,
    oppaAllowed:Object.freeze(["hani","jieun","haru","naeun","hina","seoyun"]),
    founding:/창립 초기|초기 핵심|최고참/,extraClose:Object.freeze(["seoyun"]),
    seniorOrder:Object.freeze(["전무","부장","차장","과장","대리","주임","사원"]),
    delays:Object.freeze([3,12,60,120]),reactions:Object.freeze(["🔥","😂","👍","❤️"])
  });
  const dayKey=now=>new Date(now+9*3600000).toISOString().slice(0,10);
  const hash=value=>{let n=2166136261;for(const ch of String(value))n=Math.imul(n^ch.charCodeAt(0),16777619)>>>0;return n};
  const replySafetyBound=60; // Arrival work bound; owner reactions are limited to three.
  const sourcesReady=()=>!!relationshipSeed()||!!window.HANI_CHARACTER_ARCHIVE_DATA&&!!window.HaniEditorialSources;
  const section=(c,label)=>c?.sections?.find(s=>s.label===label)?.text||"";
  const cleanParts=value=>String(value||"").split(/\n| · | \/ /).map(s=>s.replace(/^-\s*/,"").trim()).filter(Boolean);
  const TOPICS=Object.freeze({
    strategy:["기획 보드게임","회의 간식 룰","우선순위 카드","동아리 모집","선후배 티타임","생일 축하 방식","회식 메뉴","퇴근 전 한 줄"],
    development:["버그 재현 놀이","코드 리뷰 밸런스 게임","키보드 소리","자동화 실패 썰","테스트 이름 짓기","개발 일지","단축키 추천","신입 온보딩"],
    design:["시안 색 고르기","책상 조명","읽기 편한 서체","다크 모드 취향","포스터 구경","접근성 발견","텀블러 디자인","화면 여백"],
    finance:["투자 스터디","모의 포트폴리오","리스크 독서 모임","장보기 비교","도시락 예산","구독 정리","커피 가성비","충동구매 멈춤"],
    health:["러닝 크루","운동화 고르기","휴식 루틴","식단 노트","스트레칭 동아리","도시락 반찬","산책 코스","주말 회복"],
    culture:["서재 리뷰","영화 엔딩 토론","음악 플레이리스트","독서 동아리","게임 취향","전시 산책","패션 소품","반려동물 영상"],
    travel:["당일치기 동선","기차 창가 취향","맛집 지도","직관 준비물","KIA 타이거즈 응원 모임","T1 관전 모임","레알 마드리드 전술 잡담","여행 짐 줄이기"],
    learning:["시청 일기","공부 타이머","외국어 발음","오답 노트","퀴즈 동아리","책갈피 모으기","추리 영화","한 단어 챌린지"],
    business:["질문 잘하는 법","발표 연습 모임","제안서 제목","회의 마무리","고객 용어 사전","팀 교류 점심","신입 질문함","선배의 메모"],
    curiosity:["AI 동료의 질문","취향이 생기는 순간","기억과 책갈피","협동 게임","음악 패턴","반려동물의 표정","사내 관찰 일기","추천의 이유"]
  });
  let personaCache=null,personaSource=null,editorialSource=null,rosterSource=null,seedSource=null;
  function personaMap(){
    if(seedSource===relationshipSeed()&&personaSource===window.HANI_CHARACTER_ARCHIVE_DATA&&editorialSource===window.HaniEditorialSources&&rosterSource===roster()&&personaCache)return personaCache;
    seedSource=relationshipSeed();
    personaSource=window.HANI_CHARACTER_ARCHIVE_DATA;editorialSource=window.HaniEditorialSources;rosterSource=roster();
    const lines=editorialSource?.lines||{},profiles=editorialSource?.profiles||{};
    personaCache=Object.freeze(Object.fromEntries((roster()?.people||[]).map(member=>{
      const c=personaSource?.characters?.find(c=>c.id===member.id),profile=profiles[member.id],approved=seedPerson(member.id);
      const field=(name,fallback)=>approved?.[name]??profile?.[name]??c?.[name]??fallback;
      const combined=[member.role,member.keywords,...(c?.areas||[])].join(" ");
      const domains=new Set([({strategy:"strategy",platform:"development",finance:"finance",life:"culture",business:"business"})[member.team]||"curiosity"]);
      if(/건강|운동|Health|Diet|Fitness|Routine/.test(combined))domains.add("health");
      if(/재무|자산|예산|소비|투자|Investment|Financial|Risk/.test(combined))domains.add("finance");
      if(/학습|공부|Learning|Study|QA/.test(combined))domains.add("learning");
      if(/여행|스포츠|Travel|Sports|현장/.test(combined))domains.add("travel");
      if(/서재|독서|책|Reading|Book|문화|콘텐츠|Movie|Film|Music/.test(combined))domains.add("culture");
      if(/디자인|사용성|접근성|Design|UI/.test(combined))domains.add("design");
      if(member.id==="mir")domains.add("curiosity");
      const voice=Object.values(lines).filter(x=>x.speakerId===member.id).flatMap(x=>x.lines||[]).filter(s=>!/[♡♥]|오빠|반말/.test(s));
      if(!voice.length)voice.push(member.line||"함께 살펴볼게요.");
      const quirks=cleanParts(section(c,"PERSONALITY")||profile?.personality||member.keywords).filter(s=>!/(애정|애교|칭찬|성민|관계|감정표현)/.test(s)).slice(0,3);
      if(!quirks.length)quirks.push(...cleanParts(member.keywords).slice(0,3));
      const list=(name,fallback)=>{const v=field(name,fallback);return Object.freeze(Array.isArray(v)?[...v]:cleanParts(v))};
      const hobbies=list("hobbies",cleanParts(section(c,"HOBBIES")||member.keywords));
      const close=ADDRESS_RULES.oppaAllowed.includes(member.id)&&(approved?.callsChairmanOppa??
        (member.group==="M9"&&ADDRESS_RULES.founding.test(c?.seniority||"")||ADDRESS_RULES.extraClose.includes(member.id)));
      const peers=(seedSource?.relations||[]).filter(r=>r.a===member.id||r.b===member.id).map(r=>r.a===member.id?r.b:r.a).filter(id=>id!==actor()&&person(id));
      return [member.id,Object.freeze({id:member.id,voice:list("voice",voice),quirks:list("quirks",quirks),hobbies,
        characterAxis:field("characterAxis",""),publicMode:field("publicMode",section(c,"ROLE")||member.role),
        privateMode:field("privateMode",section(c,"PERSONALITY")||profile?.personality||member.line),
        commentStyle:field("commentStyle",profile?.personality||""),reactionTriggers:list("reactionTriggers",[]),avoidTopics:list("avoidTopics",[]),
        callsChairmanOppa:!!close,specialEntity:!!approved?.specialEntity,
        topics:Object.freeze([...new Set([...domains].flatMap(d=>TOPICS[d]).concat(hobbies,["점심 맛집 추천","퇴근길 음악","주말 영화","책상 위 소품","협동 게임","반려동물 영상","취미 입문","동아리 첫 모임"]))]),domains:Object.freeze([...domains]),
        relationships:Object.freeze(peers.length?peers:(roster()?.people||[]).filter(p=>p.id!==member.id&&p.team===member.team).map(p=>p.id)),
        close,source:Object.freeze({seed:approved||null,archive:c||null,profile:profile||null,member})})];
    })));
    return personaCache;
  }
  function staffAddress(fromId,toId,post,seed=0,history=comments()){
    if(toId===actor()){
      const formal=hash(seed)%100<ADDRESS_RULES.chairmanWeights[0]?ADDRESS_RULES.chairman[0]:ADDRESS_RULES.chairman[1];
      const eligible=ADDRESS_RULES.casualCategories.includes(post.category)&&!post.pinned&&!/투자|주식|정산|공지|업무/.test(post.title+" "+post.body);
      const previous=history.filter(c=>c.authorId===fromId&&c.toOwner);
      const uses=previous.filter(c=>c.address==="오빠").length;
      if(eligible&&ADDRESS_RULES.oppaAllowed.includes(fromId)&&personaMap()[fromId]?.callsChairmanOppa&&hash(seed)%1000<ADDRESS_RULES.oppaRate*1000&&uses+1<=Math.floor((previous.length+1)*ADDRESS_RULES.oppaMaxShare))return "오빠";
      return formal;
    }
    const nickname=relationNickname(fromId,toId);if(nickname)return nickname;
    const from=person(fromId),to=person(toId);if(!to)return "동료님";
    // Unmapped specialist ranks stay formal. Never infer a made-up job title.
    const a=ADDRESS_RULES.seniorOrder.indexOf(from?.rank),b=ADDRESS_RULES.seniorOrder.indexOf(to.rank);
    const senior=b>=0&&a>=0&&b>=a;
    return to.name+(from?.team===to.team&&senior?" "+(a===b?"씨":to.rank):" "+to.rank+"님");
  }
  const publicContext=post=>!ADDRESS_RULES.casualCategories.includes(post?.category)||!!post?.pinned||/공지/.test(post?.title+" "+post?.body);
  const personaMode=(id,post)=>{const p=personaMap()[id];return publicContext(post)?p?.publicMode:p?.privateMode};
  const keywordHits=(terms,text,exact=false)=>terms.reduce((n,term)=>{
    const needle=String(term).toLocaleLowerCase("ko-KR"),hay=String(text).toLocaleLowerCase("ko-KR");
    if(hay.includes(needle))return n+2;
    return exact?n:n+Number(needle.split(/[\s·/]+/).some(w=>w.length>=2&&hay.includes(w)));
  },0);
  function candidateScore(id,post,source=post,history=comments()){
    const p=personaMap()[id];if(!p)return {score:0,relevant:false};
    const text=[post.title,post.body,post.category,source.body].join(" "),theme=themeFor(text);
    const topic=p.reactionTriggers.length?keywordHits(p.reactionTriggers,text):Number(p.domains.includes(theme))*2;
    const peers=[...new Set([post.authorId,source.authorId,...history.filter(c=>c.postId===post.id&&!c.disposition&&!c.draft).map(c=>c.authorId)])].filter(peer=>peer!==id);
    const affinity=Math.max(0,...peers.map(peer=>(relation(id,peer)?.score||0)/100*2));
    const callback=peers.reduce((n,peer)=>{const r=relation(id,peer);return n+keywordHits([...(r?.callbacks||[]),r?.insideJoke].filter(Boolean),text)},0);
    const avoid=keywordHits(p.avoidTopics,text,true)*4;
    const mentioned=mentionIds(source.body).includes(id);
    return {score:topic*3+affinity+callback*2+(mentioned?12:0)-avoid,topic,affinity,callback,avoid,mentioned,
      relevant:id!==source.authorId&&(topic>0||callback>0||mentioned)};
  }
  function commentCandidates(post,source=post,history=comments(),now=Date.now(),seed=""){
    const order=selectAuthors(roster()?.people?.length||0,posts(),history,now,seed);
    return order.map(p=>({p,...candidateScore(p.id,post,source,history)})).filter(r=>r.relevant&&r.score>0)
      .sort((a,b)=>Number(b.mentioned)-Number(a.mentioned)||b.score-a.score).slice(0,6).map(r=>r.p);
  }
  function recentAuthors(rows=posts(),replyRows=comments(),now=Date.now()){
    const cutoff=now-7*86400000;
    const all=[...rows.filter(p=>!p.boardMeta),...replyRows].filter(r=>new Date(r.createdAt).getTime()>=cutoff&&new Date(r.createdAt).getTime()<=now);
    return (roster()?.people||[]).map(p=>({id:p.id,total:all.filter(r=>r.authorId===p.id).length,
      world:rows.filter(r=>r.generated&&!r.ownerTied&&!r.boardMeta&&r.authorId===p.id&&new Date(r.createdAt).getTime()>=cutoff).length,
      last:Math.max(0,...all.filter(r=>r.authorId===p.id).map(r=>new Date(r.createdAt).getTime()))}));
  }
  function selectAuthors(size,rows=posts(),replyRows=comments(),now=Date.now(),seed="",world=false,preferred=[]){
    return recentAuthors(rows,replyRows,now).sort((a,b)=>(world?a.world-b.world:0)||a.total-b.total||
      Number(preferred.includes(b.id))-Number(preferred.includes(a.id))||a.last-b.last||hash(seed+a.id)-hash(seed+b.id)).slice(0,size).map(r=>person(r.id));
  }
  function themeFor(text){
    return /투자|주식|포트폴리오/.test(text)?"finance":/운동|러닝|식단|체중|산책/.test(text)?"health":
      /KIA|T1|레알|여행|직관|야구|축구/.test(text)?"travel":/책|서재|독서|영화|음악|게임/.test(text)?"culture":
      /개발|버그|테스트|코드/.test(text)?"development":/시안|디자인|색|화면/.test(text)?"design":/공부|학습|퀴즈/.test(text)?"learning":"strategy";
  }
  // Six authored reactions per persona: agree, question, joke, cheer, care, info.
  const REACTIONS=Object.freeze({
  "hani": [
    "저도 그 방향이 좋아요.",
    "먼저 해보고 싶은 건 뭔가요?",
    "이건 저도 웃었어요 ㅎㅎ.",
    "차근차근 가봐요. 제가 응원할게요!",
    "오늘은 조금 쉬어가셔도 돼요.",
    "하나씩 정리하면 훨씬 편할 거예요."
  ],
  "yuri": [
    "그 판단에 동의해요.",
    "확인하고 싶은 조건이 있나요?",
    "이 정도면 웃음은 통과네요 ㅋㅋ.",
    "여기까지 해낸 것도 잘하셨어요.",
    "서두르지 않고 확인해도 괜찮아요.",
    "확인된 부분부터 챙겨봐요."
  ],
  "jieun": [
    "저도 현실적인 선택 같아요.",
    "어떤 기준이 제일 중요하세요?",
    "저도 모르게 웃었네요 ㅎㅎ.",
    "꾸준히 이어오신 게 멋져요!",
    "오늘은 마음 편히 쉬세요.",
    "부담되는 부분부터 줄여봐요."
  ],
  "sua": [
    "좋아요, 저도 찬성이에요.",
    "지금 가장 궁금한 건 뭐예요?",
    "아, 이건 인정이요 ㅋㅋ.",
    "잘하고 계세요. 끝까지 응원해요!",
    "잠깐 숨 돌리고 오셔도 돼요.",
    "작게 시작하면 이어가기 편해요."
  ],
  "naeun": [
    "네, 저도 그렇게 느꼈어요.",
    "해보니 느낌은 어떠셨어요?",
    "이건 저도 피식했어요 ㅎㅎ.",
    "무리 없이 계속 가봐요!",
    "오늘 컨디션부터 챙겨주세요.",
    "쉬는 시간도 같이 챙겨봐요."
  ],
  "haru": [
    "저도 그쪽이 더 끌려요.",
    "어떤 점이 제일 마음에 드셨어요?",
    "취향 저격이네요 ㅋㅋ.",
    "좋아하는 마음, 오래 이어가요!",
    "편하게 쉬면서 얘기해요.",
    "고른 이유도 남겨두면 좋겠어요."
  ],
  "sooyeon": [
    "저도 같은 마음이에요!",
    "제일 기억에 남는 건 뭔가요?",
    "아 이건 못 참죠 ㅋㅋ.",
    "좋아요! 계속 응원하고 있어요!",
    "오늘은 편하게 쉬세요.",
    "필요한 것부터 챙겨봐요."
  ],
  "minji": [
    "저도 그 느낌이 좋아요.",
    "마음에 남은 이유가 궁금해요.",
    "그 장면은 상상만 해도 웃겨요 ㅎㅎ.",
    "한 걸음씩 가는 모습이 좋아요!",
    "잠깐 여유를 가져도 좋아요.",
    "나중에 다시 볼 수 있게 남겨봐요."
  ],
  "hina": [
    "맞아용, 저도 동의해요.",
    "어느 부분이 궁금하셨나용?",
    "저도 웃었어용 ㅋㅋ.",
    "잘하고 계셔용! 응원할게요!",
    "무리하지 마세용. 쉬어가요.",
    "헷갈린 부분부터 하나씩 봐용."
  ],
  "seoyun": [
    "네, 그 방향이 좋겠습니다.",
    "먼저 확인할 부분이 있나요?",
    "이건 저도 웃음이 나네요 ㅎㅎ.",
    "한 단계씩 잘 해내고 계세요.",
    "급하게 마무리하지 않아도 괜찮아요.",
    "순서대로 보면 풀기 쉬울 거예요."
  ],
  "arin": [
    "네, 저도 그게 편할 것 같아요.",
    "어디가 가장 불편하셨어요?",
    "아, 저도 방금 웃었어요 ㅎㅎ.",
    "조금씩 나아가는 게 보여요!",
    "잠깐 쉬면서 다시 봐도 좋아요.",
    "편하게 쓸 수 있는 쪽부터 봐요."
  ],
  "yuna": [
    "네, 저도 동의해요.",
    "더 궁금한 게 있으신가요?",
    "저도 웃었어요 ㅎㅎ.",
    "계속 응원하고 있을게요!",
    "쉬었다 이어가셔도 괜찮아요.",
    "필요한 부분부터 정리해봐요."
  ],
  "dohyun": [
    "저도 그 선택이 낫다고 봐요.",
    "어디부터 살펴볼까요?",
    "이건 반박 못 하겠네요 ㅋㅋ.",
    "잘 가고 있어요. 한 번 더 해봐요!",
    "잠깐 쉬고 다시 봐도 돼요.",
    "작게 나눠보면 답이 보일 거예요."
  ],
  "serin": [
    "그 기준이면 저도 동의해요.",
    "비교해보고 싶은 게 있나요?",
    "저도 피식했네요 ㅎㅎ.",
    "지금까지 쌓아온 게 있으니까요!",
    "오늘은 여유를 좀 챙겨주세요.",
    "확실한 부분부터 비교해봐요."
  ],
  "mir": [
    "저도 그 판단이 흥미로워요.",
    "그렇게 느낀 이유가 궁금해요.",
    "저도 이제 웃긴 지점이 보여요.",
    "한 걸음 더 가는 걸 응원해요.",
    "잠깐 멈춰도 괜찮다고 생각해요.",
    "다른 관점도 함께 살펴봐요."
  ],
  "taeo": [
    "네, 저도 찬성합니다.",
    "어떤 점을 더 이야기하고 싶으세요?",
    "그건 저도 웃었어요 ㅎㅎ.",
    "차근차근 해내고 계시네요!",
    "오늘은 부담을 좀 내려놓으세요.",
    "궁금한 것부터 나눠봐요."
  ],
  "gaeun": [
    "좋아요, 저도 동의해요.",
    "먼저 챙기고 싶은 게 있나요?",
    "저도 모르게 웃었네요 ㅎㅎ.",
    "지금처럼 하나씩 해봐요!",
    "잠깐 쉬는 시간도 챙기세요.",
    "다음에 할 일부터 정리해봐요."
  ]
});
  const intents=Object.freeze(["agree","question","joke","cheer","care","info"]);
  function replyIntent(text){
    return /힘들|피곤|아프|지쳤|불안|걱정|속상|잠을|야근/.test(text)?"care":
      /ㅋㅋ|ㅎㅎ|웃|농담|장난/.test(text)?"joke":/완료|해냈|성공|달성|응원|도전|시작했/.test(text)?"cheer":
      /\?|왜|어떻게|궁금|알려|질문/.test(text)?"question":/정보|방법|정리|확인|설명|비교/.test(text)?"info":"agree";
  }
  function echoesOriginal(body,original){
    const text=String(original||"");
    for(let i=0;i+13<=text.length;i++)if(body.includes(text.slice(i,i+13)))return true;
    return false;
  }
  // Interim local replies: classify the chairman's actual comment, not the post topic.
  const CHAIRMAN_REPLIES=Object.freeze({
    thanks:Object.freeze([
      "고마워요! 읽어주셔서 저도 힘나요 ㅎㅎ.","좋게 봐주셔서 뿌듯하네요!", "칭찬 들으니까 오늘 기분 좋네요 ㅎㅎ.","한마디 남겨주셔서 감사해요!",
      "알아봐 주시니까 괜히 더 신나네요.","따뜻한 말 덕분에 기운 났어요!", "이렇게 말해주시니 저도 웃게 되네요 ㅎㅎ.","응원 잘 받았어요! 다음에도 같이 이야기해요."
    ]),
    question:Object.freeze([
      "어느 부분이 제일 궁금하세요? 거기부터 같이 봐요.","이건 바로 단정하긴 어렵네요. 조건을 조금 더 알려주세요.","좋은 질문이네요! 어떤 상황인지 더 들려주세요.","확인할 포인트가 있겠네요. 궁금한 부분부터 짚어봐요.",
      "저도 그 부분은 더 살펴봐야겠어요.","지금 말씀하신 경우를 조금만 더 풀어주실래요?", "답부터 찍기보단 근거를 같이 찾아봐요.","한 가지씩 나눠보면 답을 찾기 편할 것 같아요."
    ]),
    joke:Object.freeze([
      "아 이건 저도 웃었어요 ㅋㅋ.","갑자기 웃음 터졌네요 ㅎㅎ.","이런 드립은 못 지나치죠 ㅋㅋ.","덕분에 잠깐 웃고 갑니다 ㅎㅎ.",
      "댓글 보고 피식했어요 ㅋㅋ.","오늘 웃음 담당이시네요 ㅎㅎ.","그 한마디에 분위기 풀렸어요 ㅋㅋ.","이건 웃음 버튼이네요 ㅎㅎ."
    ]),
    agree:Object.freeze([
      "맞아요, 저도 그 쪽에 한 표요!", "같은 생각이시네요. 반가워요 ㅎㅎ.","네, 그 방향이면 저도 좋겠어요.","저도 동의해요. 같이 이어가봐요.",
      "좋아요! 생각이 통했네요.","그 포인트는 저도 공감해요.","맞아요, 천천히 맞춰가면 되겠네요.","저도 그렇게 느꼈어요. 이야기 나눠서 좋네요."
    ]),
    other:Object.freeze([
      "이야기 남겨주셔서 반가워요!", "읽고 있어요. 조금 더 들려주세요.","그 뒤 이야기도 궁금하네요.","편하게 이야기해요. 저도 같이 듣고 있어요.",
      "오늘은 어떤 느낌이셨어요?", "한 줄 남겨주시니까 이야기가 이어지네요.","그 중에 가장 마음에 남은 건 뭐예요?", "다음 이야기도 같이 나눠봐요."
    ])
  });
  const CHAIRMAN_REPLY_FLAVOUR=Object.freeze({hani:"같이 챙길게요.",yuri:"확인할 건 차분히 볼게요.",jieun:"부담 없이 이어가요.",haru:"커피 한 잔 하며 들어볼게요.",seoyun:"빠뜨린 건 없는지 같이 챙겨요.",serin:"차분히 살펴볼게요."});
  function chairmanReplyIntent(text){
    const value=String(text||"").replace(/@[가-힣A-Za-z]+/g,"");
    return /[?？]|왜|어떻게|궁금|알려|질문|뭐야|뭘|언제|어디|얼마|인가요|나요|할까/.test(value)?"question":
      /고마|감사|수고|잘했|멋지|멋져|최고|대단|좋은 글|칭찬/.test(value)?"thanks":
      /ㅋㅋ|ㅎㅎ|웃|농담|장난|드립/.test(value)?"joke":/맞아|맞네|맞습니다|동의|공감|찬성|좋아요|그러게|그렇지/.test(value)?"agree":"other";
  }
  function ownerReactions(post,source=post,history=comments(),round=0){
    if(!post||!source||source.authorId!==actor()||!sourcesReady())return [];
    const seed=hash(source.id+source.body+round),intent=chairmanReplyIntent(source.body);
    let candidates=commentCandidates(post,source,history,Date.now(),seed);
    if(!candidates.length)candidates=selectAuthors(roster()?.people?.length||0,posts(),history,Date.now(),seed)
      .map(p=>({p,...candidateScore(p.id,post,source,history)})).filter(r=>r.affinity>0&&!r.avoid)
      .sort((a,b)=>b.affinity-a.affinity).map(r=>r.p);
    const chosen=candidates.slice(0,1+seed%3),previewHistory=[...history];
    return chosen.map((p,i)=>{
      const address=staffAddress(p.id,actor(),post,seed+i,previewHistory);
      const pool=CHAIRMAN_REPLIES[intent],start=hash(seed+":"+p.id+":"+i)%pool.length;
      const line=pool.map((_,offset)=>pool[(start+offset)%pool.length]).find(text=>!echoesOriginal(text,source.body)&&!echoesOriginal(text,post.title));
      const flavour=(intent==="agree"||intent==="joke")?REACTIONS[p.id]?.[intent==="agree"?0:2]:CHAIRMAN_REPLY_FLAVOUR[p.id];
      let body=address+(line?", "+line: "!")+(flavour?" "+flavour:"");
      if(echoesOriginal(body,source.body)||echoesOriginal(body,post.title))body=address+"!";
      const row={authorId:p.id,body,parentIndex:null,address,toOwner:true,intent};
      previewHistory.push({...row,postId:post.id,generated:true});return row;
    });
  }
  function boardSettings(rows=posts()){
    return rows.find(p=>p.boardMeta&&p.authorId===actor())||null;
  }
  const replyMode=()=>boardSettings()?.replyMode==="review"?"review":"auto";
  function settingsRow(changes,rows=posts(),now=Date.now()){
    const old=boardSettings(rows);
    const row={...old,id:old?.id||uid(),authorId:actor(),category:"WORK",title:"게시판 설정",body:"게시판 내부 설정",
      createdAt:old?.createdAt||new Date(now).toISOString(),boardMeta:true,draft:true,...changes};
    return old?rows.map(p=>p.id===old.id?row:p):[...rows,row];
  }
  function setReplyMode(mode){
    if(!canWrite(true)||!["auto","review"].includes(mode))return false;
    return persist(settingsRow({replyMode:mode}),comments());
  }
  const mentionIds=body=>(roster()?.people||[]).filter(p=>{
    const names=[p.name,...p.name.split(" · ")];
    return names.some(name=>new RegExp("@"+name.replace(/[.*+?^$()|[\]\\]/g,"\\$&")+"(?=$|[\\s,.!?님]|[가-힣]+님)").test(body));
  }).map(p=>p.id);
  const queueReplies=(post,source,history,now)=>generateThreadAdapter(post,0,{kind:"reply",source,history,now}).comments;
  function localQueueReplies(post,source,history,now){
    if(!post||!source||!published(post)||source.disposition||source.draft||source.authorId!==actor())return [];
    const threadId="reply:"+source.id;
    if(history.some(c=>c.threadId===threadId))return [];
    return ownerReactions(post,source,history).map((row,i)=>({...row,id:uid(),postId:post.id,
      createdAt:new Date(now).toISOString(),scheduledAt:new Date(now+ADDRESS_RULES.delays[i]*60000).toISOString(),
      parentId:source.id===post.id?"":source.id,generated:true,threadId,pending:true,
      sourceCommentId:source.id===post.id?"":source.id,replySourceId:source.id,
      sourceToken:hash(JSON.stringify([source.id,source.authorId,source.body,post.title,post.category,!!post.pinned]))}));
  }
  const postDrafts=()=>posts().filter(p=>p.draft&&!p.pending&&!p.boardMeta&&!p.disposition);
  const replyDrafts=()=>comments().filter(c=>c.draft&&!c.disposition&&posts().some(p=>p.id===c.postId&&published(p)));
  const unreadCount=p=>visibleComments().filter(c=>c.postId===p.id&&c.generated&&new Date(c.arrivedAt||c.createdAt).getTime()>new Date(p.seenStaffAt||0).getTime()).length;
  const newBadge=p=>unreadCount(p)?'<span class="board-new">새 댓글 '+unreadCount(p)+'</span>':"";
  const seasonFor=now=>["winter","winter","spring","spring","spring","summer","summer","summer","autumn","autumn","autumn","winter"][new Date(now+9*3600000).getUTCMonth()];
  function pageOwner(page){
    return window.HaniEditorialSources?.lines?.[page]?.speakerId||"";
  }
  const safeRecordDate=value=>{
    const s=String(value||"");if(!/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(s))return "";
    const date=s.slice(0,10),base=Date.parse(date+"T00:00:00Z");
    if(!Number.isFinite(base)||new Date(base).toISOString().slice(0,10)!==date)return "";
    const n=Date.parse(s);return Number.isFinite(n)?dayKey(n):"";
  };
  function realEvents(now){
    const day=dayKey(now),cutoff=dayKey(now-14*86400000),out=[];
    const add=(type,id,page,date,label,detail="")=>{
      if(!id||!date||date<cutoff||date>day)return;
      out.push({sourceEventId:type+":"+id,page,date,label,detail});
    };
    (state.body||[]).forEach(r=>{if(Number.isFinite(r.weight)&&r.weight>0)add("body",r.id,"diet",safeRecordDate(r.date),"오늘도 몸 상태를 챙기셨네요",r.weight+"kg")});
    (state.exercise||[]).forEach(r=>{if(Number.isSafeInteger(r.steps)&&r.steps>0)add("exercise",r.id,"exercise",safeRecordDate(r.date),"걸음 기록이 하나 더 쌓였어요",r.steps.toLocaleString("ko-KR")+"보")});
    (state.books||[]).forEach(r=>{
      const a=safeRecordDate(r.completedDate),b=safeRecordDate(r.readDate);
      if(r.status!=="read"||r.completedDate&&!a||r.readDate&&!b||a&&b&&a!==b)return;
      add("book",r.id,"reading",a||b,"완독 기록이 등록됐어요.",String(r.title||"").slice(0,140));
    });
    (state.movies||[]).forEach(r=>{if(r.status==="watched")add("movie",r.id,"movie",safeRecordDate(r.watchedDate),"시청 완료 기록이 등록됐어요.",String(r.title||"").slice(0,140))});
    // Completed tasks are verified goal-sized milestones; never infer registry achievement from a target alone.
    (state.tasks||[]).forEach(r=>{if(r.status==="done"||r.completed===true)add("goal",r.id,"tasks",safeRecordDate(r.completedAt||r.updatedAt||r.date),"완료 표시된 할 일이 있어요.",String(r.title||"").slice(0,140))});
    (state.goalRegistry||[]).forEach(r=>{if(r.status==="achieved"&&r.achievedAt)add("achieved",r.goal_id+":"+r.revision,"home",safeRecordDate(r.achievedAt),"달성으로 기록된 목표가 있어요.")});
    (state.ledgerMonths||[]).forEach(r=>{
      if(/^\d{4}-(0[1-9]|1[0-2])$/.test(r.month||""))add("ledger",r.month,"ledger",safeRecordDate(r.updatedAt||r.createdAt)||r.month+"-01","저장된 월간 정산이 있어요.",r.month);
    });
    const month=Number(day.slice(5,7)),date=Number(day.slice(8));
    const goalPages={body_weight_kg:"diet",body_bmi:"diet",body_fat_percent:"diet",books_completed_count:"reading",media_watched_count:"movie",steps_daily_average:"exercise",quiz_accuracy_percent:"study",investment_total_krw:"investment",spending_jispi_krw:"ledger"};
    try{
      // Reuse the verified read projection instead of building another goal calculator.
      const facts=window.HANI_GOAL_PROGRESS?.read?.({type:"quarter",year:Number(day.slice(0,4)),quarter:Math.ceil(month/3)});
      if(Array.isArray(facts))facts.forEach(({definition,actual,progress})=>{
        if(!goalPages[definition?.metric_id]||progress?.goal_status!=="RESOLVED"||!progress.goal_id||
          !Number.isFinite(progress.actual)||!Number.isFinite(progress.target)||progress.target<=0||
          !["on_target","favorable"].includes(progress.interpretation)||["NO_DATA","FUTURE_PERIOD","STALE"].includes(actual?.status))return;
        if(progress.semantics==="monthly_budget"&&(!actual?.period_end||actual.period_end>day||actual.status!=="CONFIRMED"))return;
        add("progress",progress.goal_id+":"+progress.goal_revision+":"+day.slice(0,4)+"-Q"+Math.ceil(month/3),goalPages[definition.metric_id],day,
          "기록된 범위에서 목표 기준에 닿았어요.","목표 진행 화면의 같은 읽기 결과예요. 일부 기록 기준이며 확정 결산과는 구분해요.");
      });
    }catch{} // A failed/blocked read cannot create an achievement claim.
    if([1,4,7,10].includes(month)&&date<=7&&(state.goalRegistry||[]).some(g=>g.status==="active"))
      add("quarter",day.slice(0,4)+"-Q"+Math.ceil(month/3),"home",day.slice(0,7)+"-01","새 분기의 목표를 살펴볼 시기예요.");
    const version=typeof HANI_DISPLAY_VERSION==="string"?HANI_DISPLAY_VERSION:"";
    if(version)add("release",version,"dev",day,"현재 화면 버전을 확인했어요.",version);
    // Catalog text is source-attributed; its status is never promoted into a release claim.
    (window.HANI_DEVELOPMENT_HISTORY_V1?.entries||[]).forEach(r=>add("dev",r.id,"dev",r.date,"개발 기록을 같이 읽어봐요.",String(r.title||"").slice(0,140)+" · "+String(r.status||"확인 필요")));
    return out.sort((a,b)=>b.date.localeCompare(a.date)||a.sourceEventId.localeCompare(b.sourceEventId));
  }
  function eventDraft(event,now){
    const owner=pageOwner(event.page);if(!person(owner))return null;
    const address=staffAddress(owner,actor(),{category:"LIFE",title:event.label,body:event.detail},event.sourceEventId);
    const detail=event.detail?" 「"+publicText(event.detail)+"」":"";
    const body=address+", "+(event.sourceEventId.startsWith("book:")?detail.trim()+" 완독하셨네요! 다음 책도 기대돼요.":
      event.sourceEventId.startsWith("movie:")?detail.trim()+" 보셨네요. 감상이 궁금해요.":
      event.sourceEventId.startsWith("body:")?"오늘 신체 기록을 남기셨네요"+(event.detail?" ("+event.detail+")":"")+". 꾸준히 챙겨봐요!":
      event.sourceEventId.startsWith("exercise:")?event.detail+" 걸으셨네요! 오늘도 수고하셨어요.":
      event.sourceEventId.startsWith("goal:")?detail.trim()+" 마무리하셨네요. 수고하셨어요!":
      event.sourceEventId.startsWith("progress:")||event.sourceEventId.startsWith("achieved:")?"기록된 범위에서 목표 기준에 닿았네요. 꾸준히 가봐요!":
      event.sourceEventId.startsWith("ledger:")?event.detail+" 정산을 남기셨네요. 수고하셨어요!":
      event.sourceEventId.startsWith("release:")?"화면 버전이 "+event.detail+"이네요. 같이 둘러봐요.":
      event.sourceEventId.startsWith("quarter:")?"새 분기가 시작됐네요. 목표를 같이 살펴봐요.":detail.trim()+" 개발 기록이 올라왔네요. 같이 읽어봐요.");
    return {id:uid(),authorId:owner,category:event.page==="dev"||event.page==="ledger"?"WORK":"LIFE",
      title:event.label,body,createdAt:new Date(now).toISOString(),generated:true,draft:false,ownerTied:true,
      sourceEventId:event.sourceEventId,eventDate:event.date,sourcePage:event.page};
  }
  const libraryThreads=()=>globalThis.HaniBoardLibrary?.threads||window.HaniBoardLibrary?.threads||[];
  const restrictions=value=>value===null||value===undefined||value===""?[]:Array.isArray(value)?value:[value];
  function libraryEligible(thread,now){
    const seasons=restrictions(thread.season),days=restrictions(thread.weekday);
    return (!seasons.length||seasons.includes(seasonFor(now)))&&(!days.length||days.includes(new Date(now+9*3600000).getUTCDay()));
  }
  function generateDaily(now=Date.now(),rows=posts()){
    if(!canWrite()||!sourcesReady())return rows;
    const next=[...rows],day=dayKey(now),library=libraryThreads(),mode=boardSettings(rows)?.replyMode||"auto";
    const limit=2+hash(day)%3,start=Date.parse(day+"T00:00:00Z")-9*3600000;
    const today=next.filter(p=>p.libraryId&&Number.isFinite(Date.parse(p.createdAt))&&dayKey(Date.parse(p.createdAt))===day);
    const occupied=new Set(today.map(p=>p.sourceEventId));
    for(let slot=0;slot<limit&&today.length<limit;slot++){
      const source="daily:"+day+":"+slot;if(occupied.has(source))continue;
      const exhausted=library.length>0&&library.every(t=>next.some(p=>p.libraryId===t.id));
      const available=library.filter(t=>person(t.authorId)&&t.authorId!==actor()&&libraryEligible(t,now)&&
        (!next.some(p=>p.libraryId===t.id)||exhausted&&next.filter(p=>p.libraryId===t.id).every(p=>Date.parse(p.createdAt)<=now-90*86400000)))
        .sort((a,b)=>hash(day+a.id)-hash(day+b.id));
      if(!available.length)break;
      const thread=available[0],at=start+(8+12*slot/(limit-1))*3600000+hash(source)%40*60000;
      const row={id:uid(),authorId:thread.authorId,category:thread.category,title:thread.title,body:thread.body,
        topics:[...thread.topics],createdAt:new Date(at).toISOString(),scheduledAt:new Date(at).toISOString(),
        generated:true,libraryId:thread.id,pending:at>now,draft:mode==="review",ownerTied:false,sourceEventId:source};
      next.push(row);today.push(row);
    }
    if(!next.some(p=>p.generated&&p.ownerTied&&Number.isFinite(Date.parse(p.createdAt))&&dayKey(Date.parse(p.createdAt))===day)){
      const event=realEvents(now).find(e=>!next.some(p=>p.sourceEventId===e.sourceEventId)&&person(pageOwner(e.page)));
      const row=event&&eventDraft(event,now);
      if(row)next.push({...row,draft:mode==="review"});
    }
    return next;
  }
  function cleanupTemplates(rows,history,now){
    if(boardSettings(rows)?.templateCleanupV4)return {posts:rows,comments:history,changed:false};
    const old=row=>row.generated===true&&row.authorId!==actor()&&!row.libraryId&&oldMarker.test(String(row.body||""));
    return {posts:settingsRow({templateCleanupV4:true},rows.filter(p=>!old(p)),now),
      comments:history.filter(c=>!old(c)),changed:true};
  }
  function materialize(nextPosts,nextComments,now,force=false){
    let changed=false,processed=0;const mode=nextPosts.find(p=>p.boardMeta&&p.authorId===actor())?.replyMode==="review"?"review":"auto";
    const next=nextComments.map(c=>{
      const due=new Date(c.scheduledAt).getTime();
      if(!c.pending||!Number.isFinite(due)||(!force||c.libraryId)&&due>now||processed>=replySafetyBound)return c;
      processed++;
      const post=nextPosts.find(p=>p.id===c.postId&&!p.disposition);
      if(post&&!published(post))return c;
      const source=c.sourceCommentId?nextComments.find(p=>p.id===c.sourceCommentId&&!p.disposition):post;
      if(!post||!source||c.sourceToken!==undefined&&c.sourceToken!==hash(JSON.stringify([source.id,source.authorId,source.body,post.title,post.category,!!post.pinned]))){
        changed=true;return {...c,pending:false,draft:true,disposition:"stale"}; // Preserve history, retire outdated replies.
      }
      changed=true;const date=new Date(force&&!c.libraryId?now:due).toISOString();
      return {...c,pending:false,draft:mode==="review",createdAt:date,arrivedAt:date};
    });
    let rows=nextPosts;
    if(changed)rows=applyStaffVotes(rows,next);
    return {posts:rows,comments:next,changed};
  }
  function refreshLiving(now=Date.now(),force=false,opening=""){
    if(!canWrite())return false;
    const cleaned=cleanupTemplates(posts(),comments(),now),planned=generateDaily(now,cleaned.posts);
    let postArrived=false;
    const next=planned.map(p=>{
      if(!p.pending||!p.libraryId||!Number.isFinite(Date.parse(p.scheduledAt))||Date.parse(p.scheduledAt)>now)return p;
      postArrived=true;return {...p,pending:false,publishedAt:p.scheduledAt};
    });
    let queued=cleaned.comments;
    for(const post of next.filter(p=>p.libraryId&&!cleaned.posts.some(old=>old.id===p.id)))
      queued=[...queued,...publicationReplies(post,next,queued,now)];
    const arrivals=materialize(next,queued,now,force);
    const viewedPosts=opening&&viewChange(opening,arrivals.posts,arrivals.comments,now);
    if(!cleaned.changed&&next.length===posts().length&&!postArrived&&!arrivals.changed&&!viewedPosts)return false;
    const saved=persist(viewedPosts||arrivals.posts,arrivals.comments);
    if(saved&&viewedPosts)rememberView(opening);
    return saved;
  }
  function renderBoard(){
    if(root?.classList?.contains("active")&&(typeof loginGateUnlocked==="undefined"||loginGateUnlocked)){
      const id=hashPost(),opening=id!==selected?id:"";
      if(opening){selectPost(opening,false);hashViewPending=opening}
      // Daily activity and a first hash-open share the existing atomic save.
      refreshLiving(Date.now(),false,hashViewPending);
      if(viewed.has(hashViewPending))hashViewPending="";
    }
    render();
    if(typeof location!=="undefined"&&root?.classList?.contains("active")&&!hashPost()&&selected)closePost(false);
  }
  function applyStaffVotes(rows,replyRows){
    return rows.map(p=>{
      if(!p.poll||!Array.isArray(p.poll.options))return p;
      let votes={...(p.poll.votes||{})},changed=false;
      replyRows.filter(c=>c.postId===p.id&&!c.pending&&!c.draft&&!c.disposition&&c.generated&&Number.isInteger(c.voteChoice)&&c.voteChoice>=0&&c.voteChoice<p.poll.options.length).forEach(c=>{
        if(votes[c.authorId]!==c.voteChoice){votes[c.authorId]=c.voteChoice;changed=true}
      });
      return changed?{...p,poll:{...p.poll,votes}}:p;
    });
  }
  function publicationReplies(row,nextPosts,nextComments){
    if(!row.libraryId||nextComments.some(c=>c.postId===row.id&&c.libraryId===row.libraryId))return [];
    const thread=libraryThreads().find(t=>t.id===row.libraryId);if(!thread)return [];
    const ids=thread.comments.map(()=>uid()),at=Date.parse(row.scheduledAt||row.createdAt);
    return thread.comments.map((c,i)=>({id:ids[i],postId:row.id,authorId:c.authorId,body:c.body,
      createdAt:new Date(at).toISOString(),scheduledAt:new Date(at+c.afterMin*60000).toISOString(),
      parentId:Number.isInteger(c.replyTo)?ids[c.replyTo]:"",libraryId:row.libraryId,
      generated:true,pending:true,threadId:"library:"+row.id}));
  }
  function draftAction(kind,id,action,now=Date.now()){
    if(!canWrite(true)||!["publish","archive","discard","restore"].includes(action))return false;
    const list=kind==="post"?posts():kind==="comment"?comments():null,row=list?.find(r=>r.id===id);
    if(!row||row.boardMeta||!row.generated||(!row.draft&&!row.disposition)||row.pending)return false;
    if(action==="restore"&&row.disposition!=="archived")return false;
    if(action!=="restore"&&row.disposition)return false;
    if(kind==="comment"&&!posts().some(p=>p.id===row.postId&&published(p)))return false;
    const update=action==="publish"?{draft:false,disposition:"",publishedAt:new Date(now).toISOString(),createdAt:new Date(now).toISOString(),...(kind==="comment"?{arrivedAt:new Date(now).toISOString()}:{})}:
      action==="restore"?{draft:true,disposition:""}:{draft:true,disposition:action==="archive"?"archived":"discarded"};
    let nextPosts=kind==="post"?posts().map(p=>p.id===id?{...p,...update}:p):posts();
    let nextComments=kind==="comment"?comments().map(c=>c.id===id?{...c,...update}:c):comments();
    if(kind==="post"&&action==="publish"&&row.libraryId){
      const shift=now-Date.parse(row.scheduledAt||row.createdAt);
      nextPosts=nextPosts.map(p=>p.id===id?{...p,createdAt:row.createdAt,scheduledAt:new Date(now).toISOString()}:p);
      nextComments=nextComments.map(c=>c.postId===id&&c.libraryId&&c.pending?
        {...c,scheduledAt:new Date(Date.parse(c.scheduledAt)+shift).toISOString()}:c);
    }
    if(kind==="post"&&action==="publish")
      nextComments=[...nextComments,...publicationReplies(nextPosts.find(p=>p.id===id),nextPosts,nextComments,now)];
    nextPosts=applyStaffVotes(nextPosts,nextComments);
    return persist(nextPosts,nextComments);
  }
  function votePoll(id,option){
    if(!canWrite(true))return false;
    const row=posts().find(p=>p.id===id&&published(p));
    if(!actor()||!row?.poll||!Array.isArray(row.poll.options)||!Number.isInteger(option)||option<0||option>=row.poll.options.length)return false;
    if(row.poll.votes?.[actor()]===option)return false;
    return persist(posts().map(p=>p.id===id?{...p,poll:{...p.poll,votes:{...p.poll.votes,[actor()]:option}}}:p),comments());
  }
  function toggleReaction(id,emoji){
    if(!canWrite(true))return false;
    const row=posts().find(p=>p.id===id&&published(p));if(!actor()||!row||!ADDRESS_RULES.reactions.includes(emoji))return false;
    const current=row.reactions?.[emoji]||{},liked=!current.owner;
    return persist(posts().map(p=>p.id===id?{...p,reactions:{...p.reactions,[emoji]:{...current,count:count(count(current.count)+(liked?1:-1)),owner:liked}}}:p),comments());
  }
  const reactionCount=p=>ADDRESS_RULES.reactions.reduce((n,e)=>n+count(p.reactions?.[e]?.count),0);
  function weeklyBest(now=Date.now()){
    const day=dayKey(now),start=new Date(day+"T00:00:00+09:00").getTime(),offset=(new Date(start+9*3600000).getUTCDay()+6)%7;
    return posts().filter(p=>published(p)&&new Date(p.createdAt).getTime()>=start-offset*86400000&&new Date(p.createdAt).getTime()<=now)
      .slice().sort((a,b)=>count(b.likes)+reactionCount(b)-count(a.likes)-reactionCount(a)||String(b.createdAt).localeCompare(String(a.createdAt))).slice(0,3);
  }
  function weeklyActivity(now=Date.now()){
    const start=new Date(dayKey(now)+"T00:00:00+09:00").getTime(),offset=(new Date(start+9*3600000).getUTCDay()+6)%7,cut=start-offset*86400000;
    const inside=r=>new Date(r.createdAt).getTime()>=cut&&new Date(r.createdAt).getTime()<=now;
    return (roster()?.people||[]).map(p=>({id:p.id,posts:posts().filter(r=>published(r)&&r.authorId===p.id&&inside(r)).length,
      comments:visibleComments().filter(r=>r.authorId===p.id&&inside(r)).length}));
  }
  function attendance(now=Date.now()){
    if(!canWrite(true))return false;const day=dayKey(now),old=boardSettings();
    if(old?.attendance?.[day])return false;
    return persist(settingsRow({attendance:{...old?.attendance,[day]:true}},posts(),now),comments());
  }
  function interactiveMarkup(post,writable){
    const disabled=writable?"":" disabled";
    let text='<div class="acts board-reactions" aria-label="이모지 반응">'+ADDRESS_RULES.reactions.map(e=>'<button class="btn sm" type="button" data-board-reaction="'+e+'" data-key="'+escape(post.id)+'" aria-pressed="'+String(post.reactions?.[e]?.owner===true)+'"'+disabled+'>'+e+' '+count(post.reactions?.[e]?.count)+'</button>').join("")+'</div>';
    if(post.poll&&Array.isArray(post.poll.options)){
      const votes=Object.values(post.poll.votes||{}),total=votes.filter(v=>Number.isInteger(v)&&v>=0&&v<post.poll.options.length).length;
      text+='<fieldset class="board-poll"><legend>사내 투표 · '+total+'표</legend>'+post.poll.options.map((option,i)=>'<button class="btn" type="button" data-board-vote="'+i+'" data-key="'+escape(post.id)+'" aria-pressed="'+String(post.poll.votes?.[actor()]===i)+'"'+disabled+'>'+escape(publicText(option))+' · '+votes.filter(v=>v===i).length+'표</button>').join("")+'</fieldset>';
    }
    return text;
  }
  function paintLiving(writable){
    const disabled=writable?"":" disabled",drafts=postDrafts(),replies=replyDrafts();
    const reviewing=replyMode()==="review";
    if(get("trayPanel"))get("trayPanel").hidden=!reviewing;
    if(get("replyMode")){get("replyMode").value=replyMode();get("replyMode").disabled=!writable}
    const badge=posts().filter(published).map(p=>unreadCount(p)).reduce((a,b)=>a+b,0),waiting=comments().filter(c=>c.pending&&posts().some(p=>p.id===c.postId&&published(p))).length;
    if(get("trayCount"))get("trayCount").textContent="📬 새 글 "+drafts.length+"개 도착 · 답글 미리보기 "+replies.length+"개 · 새 댓글 "+badge+" · 예약 답글 "+waiting+"개";
    html("tray",reviewing?([...drafts.map(p=>'<article class="board-draft">'+authorCard(p.authorId)+'<span class="pill">'+escape(p.category)+'</span><h4>'+escape(publicText(p.title))+'</h4><p class="board-body">'+escape(publicText(p.body))+'</p>'+interactiveMarkup(p,false)+draftButtons("post",p,disabled)+'</article>'),
      ...replies.map(c=>'<article class="board-draft">'+authorCard(c.authorId)+'<p class="sub">'+escape(publicText(posts().find(p=>p.id===c.postId)?.title))+' · '+(c.parentId?"답글":"댓글")+'</p><p class="board-body">'+escape(publicText(c.body))+'</p>'+draftButtons("comment",c,disabled)+'</article>')].join("")||'<p class="empty">도착한 초안을 모두 확인했어요.</p>'):"");
    html("unread",posts().filter(p=>published(p)&&unreadCount(p)).map(p=>'<button class="btn sm" type="button" data-board-open="'+escape(p.id)+'">'+escape(publicText(p.title))+' · 새 댓글 '+unreadCount(p)+'</button>').join(""));
    const archives=[...posts().filter(p=>p.disposition==="archived").map(p=>({...p,kind:"post"})),...comments().filter(c=>c.disposition==="archived").map(c=>({...c,kind:"comment"}))];
    html("archive",archives.map(p=>'<div class="board-draft">'+escape(publicText(p.title||p.body))+' <button class="btn sm" type="button" data-board-draft="restore" data-kind="'+p.kind+'" data-key="'+escape(p.id)+'"'+disabled+'>초안함으로</button></div>').join(""));
    html("activity",weeklyActivity().map(a=>'<span class="board-member'+(a.posts+a.comments?' is-active':'')+'" title="'+escape(author(a.id))+'">'+escape(person(a.id)?.name)+' · 글 '+a.posts+' / 댓글 '+a.comments+(a.posts+a.comments>=3?' ✨ 활발':a.posts+a.comments?' 🌱 참여':'')+'</span>').join(""));
    html("best",weeklyBest().map((p,i)=>'<button class="btn" type="button" data-board-open="'+escape(p.id)+'">'+(i+1)+'. '+escape(publicText(p.title))+' · '+(count(p.likes)+reactionCount(p))+'</button>').join("")||'<span class="sub">이번 주 첫 이야기를 기다려요.</span>');
    if(get("attendance")){const checked=!!boardSettings()?.attendance?.[dayKey(Date.now())];get("attendance").textContent=checked?"✅ 오늘 출석 완료":"📅 오늘 출석 도장";get("attendance").disabled=!writable||checked}
    if(get("arriveNow"))get("arriveNow").disabled=!writable||!waiting;
  }
  const draftButtons=(kind,row,disabled)=>'<div class="acts">'+["publish","archive","discard"].map((a,i)=>'<button class="btn sm" type="button" data-board-draft="'+a+'" data-kind="'+kind+'" data-key="'+escape(row.id)+'"'+disabled+'>'+["올리기","나중에","삭제"][i]+'</button>').join("")+'</div>';
  const sourceIdentity=p=>JSON.stringify([p.id,p.authorId,p.category,p.title,p.body,p.updatedAt]);
  function cancelPreview(){ticket++;busy=false;preview=null;previewError="";render();return true}
  function paintPreview(){
    if(!root)return;
    get("previewLabel").textContent=busy?"직원 반응을 준비하고 있습니다…":preview?.label||previewError||"미리보기를 확인할 수 없습니다.";
    get("previewPost").disabled=busy||!preview||!canWrite();get("regenerate").disabled=busy||!canWrite();
    html("previewComments",preview?preview.comments.map(c=>'<article class="board-comment">'+authorCard(c.authorId)+'<p class="board-body">'+escape(publicText(c.body))+'</p></article>').join(""):"");
  }
  async function previewThread(postId){
    const post=posts().find(p=>p.id===postId&&published(p));if(!canWrite(true)||!post||post.authorId!==actor()||busy)return false;
    const run=++ticket,owner=actor(),identity=sourceIdentity(post);busy=true;preview=null;previewError="";
    render();paintPreview();const dialog=get("preview");
    try{
      if(dialog&&!dialog.open)dialog.showModal();
      const result=await generateThreadAdapter({...post},++generation);
      if(run!==ticket)return false;
      if(actor()!==owner||!canWrite()||sourceIdentity(posts().find(p=>p.id===postId)||{})!==identity)throw Error("글이나 작성자 상태가 바뀌었습니다. 다시 생성해 주세요.");
      const allowed=roster()?.people||[];
      if(!Array.isArray(result.comments)||result.comments.length>replySafetyBound||result.comments.some((c,i)=>!allowed.some(p=>p.id===c.authorId)||typeof c.body!=="string"||!c.body.trim()||c.body.length>5000||(c.parentIndex!==null&&c.parentIndex!==undefined&&(!Number.isInteger(c.parentIndex)||c.parentIndex<0||c.parentIndex>=i))))throw Error("직원 반응 형식을 확인하지 못했습니다.");
      preview={postId,owner,identity,label:result.label,comments:result.comments};return true;
    }catch(error){if(run===ticket){previewError=error.message||"반응을 준비하지 못했습니다.";status(previewError)}return false}
    finally{if(run===ticket){busy=false;render();paintPreview()}}
  }
  function postPreview(){
    if(!canWrite(true)||!preview||busy||actor()!==preview.owner)return false;
    const draft=preview,post=posts().find(p=>p.id===draft.postId);
    if(!post||sourceIdentity(post)!==draft.identity){status("글이 바뀌었습니다. 다시 생성한 뒤 게시해 주세요.");return false}
    const threadId=uid(),now=new Date().toISOString(),ids=draft.comments.map(()=>uid());
    const rows=draft.comments.map((c,i)=>({id:ids[i],postId:post.id,authorId:c.authorId,body:c.body.trim(),
      createdAt:now,parentId:Number.isInteger(c.parentIndex)?ids[c.parentIndex]:"",generated:true,threadId,address:c.address,toOwner:c.toOwner===true,intent:c.intent}));
    if(!rows.length){preview=null;get("preview")?.close();status("이번 글은 잠시 조용히 지켜보고 있어요.");return true}
    if(!persist(posts(),[...comments(),...rows]))return false;
    preview=null;get("preview")?.close();return true;
  }
  function confirmAction(message,action){
    const dialog=get("confirm");if(dialog.open)return;
    get("confirmText").textContent=message;pending=action;dialog.returnValue="";dialog.showModal();
  }
  function resetEditor(){
    editing=null;replyTo="";get("postForm").reset();get("commentForm").reset();
    get("postSubmit").textContent="글 게시";get("commentSubmit").textContent="댓글 게시";get("replyContext").textContent="";
  }
  function edit(kind,id){
    if(kind==="post"){
      const row=posts().find(p=>p.id===id);if(!own(row))return;
      resetEditor();editing={kind,id,postId:id};
      for(const key of ["title","body","category"])get("postForm").elements[key].value=row[key];
      get("postForm").elements.pinned.checked=!!row.pinned;get("postSubmit").textContent="수정 저장";get("composer").open=true;get("postForm").elements.title.focus();
    }else{
      const row=comments().find(c=>c.id===id);if(!own(row)||row.postId!==selected)return;
      resetEditor();editing={kind,id,postId:row.postId};
      get("commentForm").elements.body.value=row.body;get("commentSubmit").textContent="수정 저장";get("commentForm").elements.body.focus();
    }
  }
  function init(){
    if(!root)return;
    if(!get("syncNotice")){
      const notice=document.createElement("p");notice.className="sub";notice.dataset.board="syncNotice";notice.hidden=true;
      notice.textContent="Cloud 동기화가 준비되면 새 글과 답글이 도착해요.";
      get("author").insertAdjacentElement("afterend",notice);
    }
    get("confirm").addEventListener("close",()=>{const action=pending;pending=null;if(get("confirm").returnValue==="approve"&&action)action()});
    get("preview").addEventListener("cancel",cancelPreview);get("preview").addEventListener("close",cancelPreview);
    get("search").addEventListener("input",event=>{query=event.target.value;visible=pageSize;render()});
    root.addEventListener("click",event=>{
      const profile=event.target.closest("[data-board-person]");
      if(profile?.dataset.boardPerson&&root.contains(profile)){
        event.preventDefault();showView("organization/people/"+profile.dataset.boardPerson);return;
      }
      const button=event.target.closest("button");if(!button||!root.contains(button))return;
      if(button.dataset.boardOpen){resetEditor();openPost(button.dataset.boardOpen);get("detail").scrollIntoView?.({block:"start"});get("article").querySelector("[data-board-heading]")?.focus({preventScroll:true})}
      else if(button.dataset.board==="closePost")closePost();
      else if(button.dataset.boardFilter){filter=button.dataset.boardFilter;visible=pageSize;render()}
      else if(button.dataset.boardLike)toggleLike(button.dataset.boardLike);
      else if(button.dataset.boardDraft)draftAction(button.dataset.kind,button.dataset.key,button.dataset.boardDraft);
      else if(button.dataset.boardReaction)toggleReaction(button.dataset.key,button.dataset.boardReaction);
      else if(button.dataset.boardVote!==undefined)votePoll(button.dataset.key,Number(button.dataset.boardVote));
      else if(button.dataset.board==="arriveNow")refreshLiving(Date.now(),true);
      else if(button.dataset.board==="attendance")attendance();
      else if(button.dataset.boardReply){
        const row=comments().find(c=>c.id===button.dataset.boardReply&&c.postId===selected);if(!row||commentFields(row).parentId)return;
        resetEditor();replyTo=row.id;get("commentSubmit").textContent="답글 게시";render();get("commentForm").elements.body.focus();
      }else if(button.dataset.board==="more"){visible+=pageSize;render()}
      else if(button.dataset.board==="react")previewThread(selected);
      else if(button.dataset.board==="regenerate")previewThread(preview?.postId||selected);
      else if(button.dataset.board==="previewPost")postPreview();
      else if(button.dataset.boardEdit)edit(button.dataset.boardEdit,button.dataset.key);
      else if(button.dataset.boardDelete){
        const kind=button.dataset.boardDelete,id=button.dataset.key;
        confirmAction(kind==="post"?"이 글만 삭제할까요? 댓글과 다른 기록은 보존됩니다.":"이 댓글만 삭제할까요? 답글은 보존됩니다.",()=>{
          if(deleteOwn(kind,id)){resetEditor();render()}else status("삭제하지 못했습니다. 작성자와 저장 상태를 확인해 주세요.");
        });
      }else if(button.hasAttribute("data-board-cancel"))resetEditor();
    });
    get("postForm").addEventListener("submit",event=>{
      event.preventDefault();const form=event.currentTarget;
      const input={title:form.elements.title.value,body:form.elements.body.value,category:form.elements.category.value,pinned:form.elements.pinned.checked};
      const id=editing?.kind==="post"?editing.id:"",apply=()=>{if(savePost(input,id)){resetEditor();render()}};
      if(id)confirmAction("이 글의 수정 내용을 저장할까요?",apply);else apply();
    });
    get("commentForm").addEventListener("submit",event=>{
      event.preventDefault();const postId=selected,body=event.currentTarget.elements.body.value,parentId=replyTo;
      const id=editing?.kind==="comment"&&editing.postId===postId?editing.id:"";
      const apply=()=>{if(saveComment(postId,body,id,parentId)){resetEditor();render()}};
      if(id)confirmAction("이 댓글의 수정 내용을 저장할까요?",apply);else apply();
    });
    get("replyMode")?.addEventListener("change",event=>{if(!setReplyMode(event.target.value))render()});
    root.addEventListener("error",event=>{
      const img=event.target;
      if(img?.hasAttribute?.("data-board-avatar")&&root.contains(img))img.hidden=true;
    },true);
    const historyChange=()=>{
      if(typeof location==="undefined")return;
      if(location.hash==="#board"||location.hash.startsWith("#board/")){
        if(!root.classList?.contains("active")&&typeof showView==="function")showView("board");
        restorePost();
      }else if(root.classList?.contains("active")&&typeof showView==="function")showView(navigationInitialView(location.hash.slice(1)));
    };
    window.addEventListener?.("popstate",historyChange);
    window.addEventListener?.("hashchange",historyChange);
    renderBoard();
  }
  window.HaniBoard=Object.freeze({render:renderBoard,savePost,saveComment,deleteOwn,openPost,toggleLike,listPosts,
    postFields,commentFields,relativeTime,boardDate,closePost,previewThread,postPreview,cancelPreview,ownerReactions,replyIntent,chairmanReplyIntent,CHAIRMAN_REPLIES,orderedComments,commentMarkup,
    ADDRESS_RULES,personaMap,personaMode,staffAddress,candidateScore,commentCandidates,selectAuthors,queueReplies,generateDaily,realEvents,refreshLiving,
    setReplyMode,replyMode,draftAction,postDrafts,replyDrafts,votePoll,toggleReaction,weeklyBest,weeklyActivity,
    attendance,unreadCount,mentionIds,dayKey,replySafetyBound});
  init();
})();
