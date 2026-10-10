/* HANI GROUP BOARD. Existing save/Cloud paths own persistence; no migration. */
(() => {
  "use strict";
  const categories=["WORK","LIFE","MEMORY","LOUNGE"],pageSize=20;
  const root=document.getElementById("board");
  const get=key=>root?.querySelector('[data-board="'+key+'"]');
  const escape=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const roster=()=>window.HaniOrganizationRoster,actor=()=>roster()?.chairman?.id;
  const posts=()=>state.boardPosts||[],comments=()=>state.boardComments||[];
  const published=p=>!p.draft&&!p.boardMeta&&!p.disposition;
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
  let preview=null,generation=0,ticket=0,busy=false,previewError="";
  const status=message=>{if(get("status"))get("status").textContent=message};
  const own=row=>!!actor()&&row?.authorId===actor();
  const person=id=>roster()?(id===roster().chairman?.id?roster().chairman:roster().people?.find(p=>p.id===id)):null;
  function author(id){
    const member=person(id);if(!member)return "알 수 없는 작성자 · "+String(id||"");
    if(id===actor())return member.name+" · "+member.rank;
    const team=roster()?.teams?.find(t=>t.id===member.team);
    return [member.name,member.rank,team?.name||member.team].filter(Boolean).join(" · ");
  }
  function avatar(id){
    const member=person(id),thumb=member?.thumb||member?.thumbnail;
    const src=typeof thumb==="string"&&/^(?:https:\/\/|\.\/assets\/|assets\/)/.test(thumb)?thumb:"";
    return src?'<img class="board-avatar" src="'+escape(src)+'" alt="" loading="lazy" width="28" height="28">':'<span class="board-avatar board-initial" aria-hidden="true">'+escape(Array.from(member?.name||"?")[0])+'</span>';
  }
  const authorCard=id=>'<span class="board-author">'+avatar(id)+'<span>'+escape(author(id))+'</span></span>';
  function relativeTime(value,now=Date.now()){
    const time=new Date(value).getTime();if(!Number.isFinite(time))return "시간 미상";
    const seconds=Math.max(0,Math.floor((now-time)/1000));
    if(seconds<60)return "방금 전";if(seconds<3600)return Math.floor(seconds/60)+"분 전";
    if(seconds<86400)return Math.floor(seconds/3600)+"시간 전";
    if(seconds<604800)return Math.floor(seconds/86400)+"일 전";
    return new Date(time).toLocaleDateString("ko-KR");
  }
  const stamp=row=>'<time title="'+escape(row.createdAt)+'">'+escape(relativeTime(row.createdAt))+'</time>';
  function persist(nextPosts,nextComments){
    if(loadRecovery.active){status("원본 보호 중에는 게시판을 저장할 수 없습니다.");return false}
    const before=state;
    state={...state,boardPosts:nextPosts,boardComments:nextComments,meta:{...(state.meta||{})}};
    let result;try{result=save()}catch(error){result={ok:false,message:error?.message}}
    if(!result?.ok){state=before;render();status(result?.message||"저장하지 못했습니다. 기존 기록을 유지합니다.");return false}
    render();status("게시판 기록을 저장했습니다.");return true;
  }
  // These public handlers are also the single delegated DOM event path.
  function savePost(input,id=""){
    if(!actor())return false;
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
    selected=row.id;return true;
  }
  function saveComment(postId,body,id="",parentId=""){
    if(!actor()||!posts().some(p=>p.id===postId&&published(p)))return false;
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
  function openPost(id){
    const post=posts().find(p=>p.id===id&&published(p));if(!post)return false;selected=id;
    if((!viewed.has(id)||unreadCount(post))&&actor()&&!loadRecovery.active){
      const row=postFields(post);
      const seen=Math.max(Date.now(),...visibleComments().filter(c=>c.postId===id).map(c=>new Date(c.arrivedAt||c.createdAt).getTime()).filter(Number.isFinite));
      if(persist(posts().map(p=>p.id===id?{...row,views:count(row.views+(!viewed.has(id)?1:0)),seenStaffAt:new Date(seen).toISOString()}:p),comments())){
        viewed.add(id);try{sessionStorage.setItem(viewSessionKey,JSON.stringify([...viewed]))}catch{}
      }
    }
    render();return true;
  }
  function toggleLike(id){
    if(!actor())return false;
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
  const actions=(row,kind)=>own(row)?'<div class="acts"><button class="btn sm" type="button" data-board-edit="'+kind+'" data-key="'+escape(row.id)+'">수정</button><button class="btn sm danger" type="button" data-board-delete="'+kind+'" data-key="'+escape(row.id)+'">삭제</button></div>':"";
  const html=(key,value)=>{const slot=get(key);if(slot&&slot.innerHTML!==value)slot.innerHTML=value};
  function commentMarkup(c,nested=false,allowReply=true){
    const parent=c.parentId&&visibleComments().find(p=>p.id===c.parentId);
    return '<article class="board-comment'+(nested?' board-reply':'')+'"'+(c.parentId?' data-board-parent="'+escape(c.parentId)+'"':'')+'><header>'+authorCard(c.authorId)+'<span class="sub">'+stamp(c)+(c.generated?' · 직원 반응':'')+(parent?' · '+escape(author(parent.authorId))+'에게 답글':'')+'</span></header><p class="board-body">'+escape(c.body)+'</p>'+actions(c,"comment")+
      (allowReply?'<button class="btn sm" type="button" data-board-reply="'+escape(c.id)+'"'+(!actor()||loadRecovery.active?' disabled':'')+'>답글</button>':"")+'</article>';
  }
  function render(){
    if(!root)return;
    const writable=!!actor()&&!loadRecovery.active;
    get("counts").textContent="글 "+posts().filter(published).length+" · 댓글 "+visibleComments().length;
    paintLiving(writable);
    get("author").textContent=author(actor());
    get("postSubmit").disabled=!writable;get("commentSubmit").disabled=!writable;
    root.querySelectorAll("[data-board-filter]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.boardFilter===filter)));
    const rows=listPosts(),totals=new Map();visibleComments().forEach(c=>totals.set(c.postId,(totals.get(c.postId)||0)+1));
    html("list",rows.slice(0,visible).map(raw=>{const p=postFields(raw);return '<article class="board-row'+(p.pinned?' board-pinned':'')+'"><div class="board-row-title"><span class="pill">'+escape(p.category)+'</span> '+(p.pinned?'<span class="board-notice">공지</span> ':"")+
      '<button type="button" class="board-title" data-board-open="'+escape(p.id)+'" aria-pressed="'+String(selected===p.id)+'">'+escape(p.title)+' <span class="board-comment-count">['+(totals.get(p.id)||0)+']</span>'+newBadge(p)+'</button></div><div class="board-row-meta">'+authorCard(p.authorId)+'<span>'+stamp(p)+'</span><span>조회 '+p.views+'</span><span>공감 '+p.likes+'</span></div></article>'}).join("")||'<p class="empty">'+(query?'검색 결과가 없습니다.':'아직 게시글이 없습니다.')+'</p>');
    get("more").hidden=visible>=rows.length;get("listCount").textContent=rows.length+"개 글 · "+Math.min(visible,rows.length)+"개 표시";
    const raw=posts().find(p=>p.id===selected&&published(p)),post=raw&&postFields(raw);
    get("detail").hidden=!post;get("react").disabled=!post||!writable||busy;
    if(get("preview")?.open)paintPreview();
    get("replyContext").textContent=replyTo?author(comments().find(c=>c.id===replyTo)?.authorId)+"에게 답글":"";
    if(!post){html("article","");html("comments","");return}
    html("article",'<span class="pill">'+escape(post.category)+'</span>'+(post.pinned?' <span class="board-notice">공지</span>':"")+'<h3 tabindex="-1" data-board-heading>'+escape(post.title)+'</h3><div class="board-detail-meta">'+authorCard(post.authorId)+'<span class="sub">'+stamp(post)+' · 조회 '+post.views+'</span>'+newBadge(post)+'</div><p class="board-body">'+escape(post.body)+'</p>'+interactiveMarkup(post,writable)+'<button class="btn" type="button" data-board-like="'+escape(post.id)+'" aria-pressed="'+post.likedByOwner+'"'+(!writable?' disabled':'')+'>👍 공감 '+post.likes+'</button>'+actions(post,"post"));
    const thread=visibleComments().filter(c=>c.postId===post.id).map(commentFields).sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt)));
    const shown=new Set();
    const branch=(c,depth)=>{if(shown.has(c.id))return "";shown.add(c.id);return commentMarkup(c,depth>0,!c.parentId)+thread.filter(r=>r.parentId===c.id).map(r=>branch(r,depth+1)).join("")};
    const roots=thread.filter(c=>!c.parentId||!thread.some(p=>p.id===c.parentId));
    html("comments",roots.map(c=>branch(c,0)).join("")+thread.filter(c=>!shown.has(c.id)).map(c=>branch(c,0)).join("")||'<p class="empty">첫 댓글을 남겨 주세요.</p>');
  }

  // Discovered contracts: earnings-dialogue is report-only; orchestrator writes cases;
  // learning-quiz returns a fixed quiz schema. No reusable free-prompt text endpoint.
  // Single seam for a future owner-JWT server invocation.
  function generateThreadAdapter(post,round,request={}){
    if(request.kind==="reply")return {label:"로컬 사내 이야기",comments:localQueueReplies(post,request.source,request.history,request.now)};
    if(request.kind==="world")return {label:"로컬 사내 이야기",post:worldDraft(post,request.sourceEventId,request.now,request.rows)};
    if(request.kind==="event")return {label:"기록 기반 초안",post:eventDraft(post,request.now,request.rows)};
    return {label:"AI 연결 전 미리보기",comments:storyTemplate(post,round)};
  }
  // One policy for both the Phase 2 preview adapter and living drafts/replies.
  const ADDRESS_RULES=Object.freeze({
    chairman:Object.freeze(["회장님","대표님"]),chairmanWeights:Object.freeze([75,25]),
    casualCategories:Object.freeze(["LOUNGE","LIFE"]),oppaRate:.12,oppaMaxShare:.15,
    founding:/창립 초기|초기 핵심|최고참/,extraClose:Object.freeze(["seoyun"]),
    seniorOrder:Object.freeze(["전무","부장","차장","과장","대리","주임","사원"]),
    delays:Object.freeze([3,12,60,120]),reactions:Object.freeze(["🔥","😂","👍","❤️"])
  });
  const dayKey=now=>new Date(now+9*3600000).toISOString().slice(0,10);
  const hash=value=>{let n=2166136261;for(const ch of String(value))n=Math.imul(n^ch.charCodeAt(0),16777619)>>>0;return n};
  // Work limit per invocation, never a lifetime thread/comment cap.
  const replySafetyBound=60;
  const controversy=text=>/논쟁|토론|찬반|반대|논의|밸런스|어느 쪽|선택 기준/.test(text);
  const engagement=row=>mentionIds(String(row.body||"")).length*2.5+(controversy(String(row.title||"")+" "+String(row.body||""))?5:0);
  function threadEnergy(post,history=comments(),reservePending=false){
    const seed=hash(post.id+post.title+post.body),bucket=seed%100;
    // Mostly quiet/short discussions, with a small lively tail. Stable across reloads.
    const initial=bucket<18?(post.generated?-3:0):bucket<80?1+(seed>>>8)%220/100:bucket<94?4+(seed>>>8)%500/100:15+(seed>>>8)%1400/100;
    // A world's invitation is softer than an explicit participant's comment.
    let energy=initial+engagement(post)*(post.generated ? .4 : 1);
    for(const c of history.filter(c=>c.postId===post.id)){
      if(c.authorId===actor()&&!c.disposition&&!c.draft&&!c.pending)energy+=6+engagement(c);
      if(c.generated&&(!c.pending||reservePending)){
        const cost=typeof c.energyCost==="number"&&Number.isFinite(c.energyCost)&&c.energyCost>0?c.energyCost:1;
        energy-=cost;
        if(typeof c.energyBoost==="number"&&Number.isFinite(c.energyBoost)&&c.energyBoost>0)energy+=c.energyBoost;
      }
    }
    return Math.max(0,energy);
  }
  const replyCost=(seed,aside)=>1.1+hash(seed)%80/100-(aside ? .35 : 0); // Banter replenishes some energy; net decay stays positive.
  const sourcesReady=()=>!!window.HANI_CHARACTER_ARCHIVE_DATA&&!!window.HaniEditorialSources;
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
  const SEASONS=Object.freeze({
    spring:["벚꽃 산책","봄 소풍 도시락","새 동아리","봄맞이 책상 정리","꽃가루와 실내 운동","새 학기 공부"],
    summer:["여름 휴가 동선","차가운 면 점심","실내 영화 모임","장마 대비 가방","수분 챙기기","여름 음악"],
    autumn:["가을 독서","단풍 산책","따뜻한 차","야구 시즌 토론","가벼운 겉옷","가을 회식 메뉴"],
    winter:["연말 추천작","따뜻한 국물","실내 스트레칭","겨울 플레이리스트","새해 동아리","목도리 취향"]
  });
  let personaCache=null,personaSource=null,editorialSource=null,rosterSource=null;
  function personaMap(){
    if(personaSource===window.HANI_CHARACTER_ARCHIVE_DATA&&editorialSource===window.HaniEditorialSources&&rosterSource===roster()&&personaCache)return personaCache;
    personaSource=window.HANI_CHARACTER_ARCHIVE_DATA;editorialSource=window.HaniEditorialSources;rosterSource=roster();
    const lines=editorialSource?.lines||{},profiles=editorialSource?.profiles||{};
    personaCache=Object.freeze(Object.fromEntries((roster()?.people||[]).map(member=>{
      const c=personaSource?.characters?.find(c=>c.id===member.id),profile=profiles[member.id];
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
      const close=member.group==="M9"&&ADDRESS_RULES.founding.test(c?.seniority||"")||ADDRESS_RULES.extraClose.includes(member.id);
      return [member.id,Object.freeze({id:member.id,voice:Object.freeze(voice),quirks:Object.freeze(quirks),
        topics:Object.freeze([...new Set([...domains].flatMap(d=>TOPICS[d]).concat(["점심 맛집 추천","퇴근길 음악","주말 영화","책상 위 소품","협동 게임","반려동물 영상","취미 입문","동아리 첫 모임"]))]),domains:Object.freeze([...domains]),
        relationships:Object.freeze((roster()?.people||[]).filter(p=>p.id!==member.id&&p.team===member.team).map(p=>p.id)),
        close,source:Object.freeze({archive:c||null,profile:profile||null,member})})];
    })));
    return personaCache;
  }
  function staffAddress(fromId,toId,post,seed=0,history=comments()){
    if(toId===actor()){
      if(post.category==="WORK"||post.pinned||/투자|주식|정산|공지/.test(post.title+" "+post.body))return "회장님";
      const eligible=ADDRESS_RULES.casualCategories.includes(post.category)&&!post.pinned&&!/투자|주식|정산|공지|업무/.test(post.title+" "+post.body);
      const previous=history.filter(c=>c.authorId===fromId&&c.toOwner);
      const uses=previous.filter(c=>c.address==="오빠").length;
      if(eligible&&personaMap()[fromId]?.close&&hash(seed)%1000<ADDRESS_RULES.oppaRate*1000&&uses+1<=Math.floor((previous.length+1)*ADDRESS_RULES.oppaMaxShare))return "오빠";
      return hash(seed)%100<ADDRESS_RULES.chairmanWeights[0]?"회장님":"대표님";
    }
    const from=person(fromId),to=person(toId);if(!to)return "동료님";
    // Unmapped specialist ranks stay formal. Never infer a made-up job title.
    const a=ADDRESS_RULES.seniorOrder.indexOf(from?.rank),b=ADDRESS_RULES.seniorOrder.indexOf(to.rank);
    const senior=b>=0&&a>=0&&b>=a;
    return to.name+(from?.team===to.team&&senior?" "+(a===b?"씨":to.rank):" "+to.rank+"님");
  }
  const voiceOf=(id,seed=0)=>{const p=personaMap()[id];return p?.voice[hash(seed)%p.voice.length]||"같이 살펴볼게요."};
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
  const TAKE=Object.freeze({
    finance:["투자 스터디에서는 수익 자랑보다 판단 근거를 한 줄씩 나눠보면 어떨까요?","모의 사례로 리스크부터 비교해보고 싶어요.","각자 읽은 자료의 날짜와 출처를 같이 적어두면 좋겠어요."],
    health:["러닝 크루는 빠른 조와 산책 조를 함께 열면 부담이 덜하겠어요.","식단 이야기는 굶기보다 이어갈 수 있는 메뉴를 골라봐요.","회복 시간도 계획에 넣어두고 싶어요."],
    travel:["직관 준비물 추천부터 모아볼까요? 결과나 실제 방문 여부는 따로 확인해요.","응원팀이 달라도 재밌었던 장면을 이야기하면 좋겠어요.","여행 동선에는 쉬는 구간도 남겨두고 싶어요."],
    culture:["독서 동아리에서는 스포일러 없는 한 문장 추천이 좋겠어요.","작품을 고른 이유가 궁금해요. 취향이 달라도 재미있겠어요.","음악과 장면 중 무엇이 더 오래 남는지 이야기해보고 싶어요."],
    development:["재현 조건 하나씩 적어보면 다음 사람이 따라가기 쉬워요.","작은 기능도 쓰는 장면부터 확인해보고 싶어요.","개발 일지에 해결한 부분과 남은 질문을 함께 쓰면 좋겠어요."],
    design:["먼저 읽히는 문장이 무엇인지 같이 골라봐요.","시안은 작은 화면에서도 보고 싶어요.","예쁜 색과 오래 읽기 편한 색을 함께 비교해봐요."],
    learning:["외우기보다 헷갈린 이유를 서로 설명해볼까요?","짧은 퀴즈를 한 문제씩 내면 부담이 덜하겠어요.","틀린 문제를 다음 모임의 소재로 써보고 싶어요."],
    strategy:["서로 다른 팀의 경험을 한 가지씩 들어보고 싶어요.","우선 작은 모임으로 시작해서 다음 후기를 남겨볼까요?","참여하기 편한 방법부터 같이 골라봐요."]
  });
  const REPLY_PLANS=Object.freeze(["확인할 항목을 짧게 적어둘까요?","다른 팀의 관점도 듣고 싶어요.","처음 참여하는 분의 질문부터 받아봐요.","오늘 정할 부분을 하나만 골라봐요.","선택 기준부터 서로 나눠보면 좋겠어요.","부담 없이 해볼 수 있는 방법을 찾고 싶어요.","다음 이야기로 이어갈 질문도 남겨봐요.","각자 고른 이유부터 들어보고 싶어요."]);
  // One local adapter: no client API keys or unapproved server write contract.
  function storyTemplate(post,round=0){
    const members=roster()?.people||[];if(members.length<3)throw Error("직원 명부를 확인하지 못했습니다.");
    const seed=hash(post.id+post.category+round),costs=[];
    let energy=threadEnergy(post)+6; // Explicit chairman request reopens the conversation.
    while(energy>=1&&costs.length<replySafetyBound){const cost=replyCost(seed+costs.length,costs.length>0);costs.push(cost);energy-=cost}
    const length=costs.length;
    const ordered=selectAuthors(members.length,posts(),comments(),Date.now(),seed);
    const chosen=[ordered.find(p=>p.group==="M9"),ordered.find(p=>p.group==="AI STAFF")].filter(Boolean);
    chosen.push(...ordered.filter(p=>!chosen.includes(p)));
    return Array.from({length},(_,i)=>{const p=chosen[i%chosen.length];
      const stage=i===0?"발단":i===length-1?"마무리":i===length-2?"반전":"반응·확대";
      const to=i?chosen[(i-1)%chosen.length].id:post.authorId;
      const address=staffAddress(p.id,to,post,seed+i);
      const excerpt=String(post.body||"").replace(/\s+/g," ").replace(/오빠/g,"회장님").slice(0,100);
      const flow=i===0?'「'+post.title+'」의 “'+excerpt+'” 부분을 읽었어요.':
        i===length-1?"후기는 다음 글에서 이어봐요. 글에 없는 사실은 확인할 질문으로 남겨둘게요.":
        i===length-2?"같은 주제라도 보는 점이 다르네요. 확인된 내용과 각자의 의견을 나눠봐요.":
        TAKE[themeFor(post.title+" "+post.body)][(seed+i)%3];
      const scene=post.category==="LOUNGE"&&i===1?" 가상의 탕비실에서 추천을 모으다가 간식 취향 투표로 번졌어요.":"";
      return {authorId:p.id,body:(to===actor()?"":"@")+address+", "+voiceOf(p.id,seed+i)+" "+flow+scene,stage,parentIndex:i===0?null:0,address,toOwner:to===actor(),energyCost:costs[i],energyBoost:i===0?6:0};
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
    if(!actor()||!["auto","review"].includes(mode))return false;
    return persist(settingsRow({replyMode:mode}),comments());
  }
  const mentionIds=body=>(roster()?.people||[]).filter(p=>{
    const names=[p.name,...p.name.split(" · ")];
    return names.some(name=>new RegExp("@"+name.replace(/[.*+?^$()|[\]\\]/g,"\\$&")+"(?=$|[\\s,.!?님]|[가-힣]+님)").test(body));
  }).map(p=>p.id);
  const queueReplies=(post,source,history,now)=>generateThreadAdapter(post,0,{kind:"reply",source,history,now}).comments;
  function localQueueReplies(post,source,history,now){
    if(!sourcesReady()||!post||!source||!published(post)||source.disposition||source.draft)return [];
    const mentioned=mentionIds(source.body),theme=themeFor(post.title+" "+source.body);
    const relevant=(roster()?.people||[]).filter(p=>personaMap()[p.id]?.domains.includes(theme)).map(p=>p.id);
    const seed=hash(source.id+source.body);
    const selected=mentioned.map(person);
    selected.push(...selectAuthors(roster().people.length,posts(),history,now,seed,false,relevant).filter(p=>!selected.includes(p)));
    if(!selected.length)return [];
    const parent=source.id===post.id?"":source.id,threadId="reply:"+source.id,rows=[];
    const energyHistory=parent&&!history.some(c=>c.id===source.id)?[...history,{...source,postId:post.id}]:history;
    let energy=threadEnergy(post,energyHistory,true),due=now;
    for(let i=0;energy>=1&&i<replySafetyBound;i++){
      const p=selected[i%selected.length],story=uniqueTemplate(p.id,now,posts(),[...history,...rows],theme);if(!story)break;
      const aside=i>0&&!mentioned.includes(p.id)&&hash(seed+i)%3!==0;
      const toId=aside?rows[i-1].authorId:source.authorId,address=staffAddress(p.id,toId,post,seed+i,[...history,...rows]);
      // Early arrivals keep their familiar cadence; later exchanges span days.
      due=i<ADDRESS_RULES.delays.length?now+ADDRESS_RULES.delays[i]*60000:due+(hash(seed+i)%3===0?20:4)*3600000;
      const body=(aside?"@":"")+address+", "+voiceOf(p.id,seed+i).replace(/[.!?]$/,"")+" — "+story.topic+"에 관해서 "+
        (aside?"앞선 의견에 보태면, ":'“'+String(source.body).replace(/\s+/g," ").replace(/오빠/g,"회장님").slice(0,80)+'” 말씀에 이어서, ')+TAKE[theme][(seed+i)%3]+"\n"+
        story.topic+"에 관한 제 생각: "+story.opener+" "+REPLY_PLANS[story.variant]+" "+story.topic+"에 대해 "+story.question;
      rows.push({id:uid(),postId:post.id,authorId:p.id,body,createdAt:new Date(now).toISOString(),
        scheduledAt:new Date(due).toISOString(),parentId:aside?rows[i-1].id:parent,generated:true,threadId,
        pending:true,toOwner:toId===actor(),address,sourceCommentId:parent,replySourceId:source.id,energyCost:replyCost(seed+i,aside),
        sourceToken:hash(JSON.stringify([source.id,source.authorId,source.body,post.title,post.category,!!post.pinned])),
        templateId:story.templateId});
      energy-=rows.at(-1).energyCost;
    }
    return rows;
  }
  const postDrafts=()=>posts().filter(p=>p.draft&&!p.boardMeta&&!p.disposition);
  const replyDrafts=()=>comments().filter(c=>c.draft&&!c.disposition&&posts().some(p=>p.id===c.postId&&published(p)));
  const unreadCount=p=>visibleComments().filter(c=>c.postId===p.id&&c.generated&&new Date(c.arrivedAt||c.createdAt).getTime()>new Date(p.seenStaffAt||0).getTime()).length;
  const newBadge=p=>unreadCount(p)?'<span class="board-new">새 댓글 '+unreadCount(p)+'</span>':"";
  const seasonFor=now=>["winter","winter","spring","spring","spring","summer","summer","summer","autumn","autumn","autumn","winter"][new Date(now+9*3600000).getUTCMonth()];
  function dateTopic(now){
    const d=new Date(now+9*3600000),weekday=d.getUTCDay();
    if(weekday===1)return "월요병 탈출";
    if(weekday===5)return "금요일 퇴근 후";
    if(weekday===0||weekday===6)return "주말 취향";
    return SEASONS[seasonFor(now)][hash(dayKey(now))%6];
  }
  const OPENERS=Object.freeze([
    "이번 사내 이야기의 시작은 작은 질문이에요.","우리 동아리에 새 주제를 가져왔어요.","오늘은 제 취향을 조금 나눠볼게요.",
    "가볍게 추천을 모으고 싶어요.","팀 이야기를 하다가 뜻밖의 소재를 찾았어요.","선후배 티타임에서 나눌 질문을 골랐어요.",
    "이번엔 잘하는 일 말고 좋아하는 일 이야기예요.","짧은 휴식 시간에 떠올린 제안이에요."
  ]);
  const EPISODES=Object.freeze([
    "추천 카드를 만들었는데 제목 고르기가 더 오래 걸렸어요. 카드보다 제목이 주인공이 될 뻔했네요.",
    "준비물 목록에 간식만 남아서 다시 적었어요. 먹는 모임인지 취미 모임인지 투표가 필요하겠어요.",
    "서로 다른 취향을 모으니 예상보다 선택지가 늘었어요. 하나로 통일하지 않고 돌아가며 해보고 싶어요.",
    "처음 온 동료가 가장 쉬운 질문을 해서 다 같이 생각했어요. 익숙한 것도 설명해보면 새롭네요.",
    "조용한 모임을 계획했는데 추천 이야기가 길어졌어요. 다음에는 말하기 차례 카드도 챙겨야겠어요.",
    "좋다는 이유를 한 줄씩 쓰니 추천 목록이 작은 일기처럼 됐어요. 다음 모임에는 그 이유부터 읽고 싶어요.",
    "실패한 준비 과정도 적어보니 꽤 쓸모가 있네요. 다음 사람은 같은 곳에서 헤매지 않을 것 같아요.",
    "경쟁보다는 서로의 선택을 바꿔 체험해보자는 의견이 나왔어요. 결과보다 후기가 궁금하네요."
  ]);
  const QUESTIONS=Object.freeze([
    "여러분이라면 무엇부터 고르시겠어요?","추천 하나와 이유 한 줄 부탁드려요.","짧게 자주 하기와 길게 한 번 하기 중 어느 쪽이 좋으세요?",
    "처음 참여하는 동료에게 어떤 팁을 주고 싶으세요?","다른 팀에서도 같이 해보고 싶은 분 계세요?","다음 편에서 듣고 싶은 이야기를 알려주세요."
  ]);
  function uniqueTemplate(authorId,now,rows=posts(),replyRows=comments(),theme=""){
    const used=new Set([...rows,...replyRows].filter(p=>new Date(p.createdAt).getTime()>=now-14*86400000).map(p=>p.templateId));
    const topics=theme?TOPICS[theme]:[...personaMap()[authorId].topics,...SEASONS[seasonFor(now)]],start=hash(authorId+dayKey(now))%(topics.length*OPENERS.length*EPISODES.length*QUESTIONS.length);
    for(let step=0;step<topics.length*OPENERS.length*EPISODES.length*QUESTIONS.length;step++){
      let code=(start+step)%(topics.length*OPENERS.length*EPISODES.length*QUESTIONS.length);
      const t=code%topics.length;code=Math.floor(code/topics.length);const o=code%OPENERS.length;code=Math.floor(code/OPENERS.length);
      const e=code%EPISODES.length,q=Math.floor(code/EPISODES.length)%QUESTIONS.length;
      const templateId=[authorId,topics[t],o,e,q].join(":");
      if(!used.has(templateId))return {templateId,topic:topics[t],opener:OPENERS[o],episode:EPISODES[e],question:QUESTIONS[q],variant:e};
    }
    return null; // Exhaustion stops generation rather than reusing a recent sentence.
  }
  const seriesNames=Object.freeze({hina:"시청 일기",sua:"팀 업무 일지",seoyun:"개발 일지",dohyun:"개발 일지",naeun:"식단 노트",haru:"서재 리뷰",minji:"장면 수집",sooyeon:"응원과 여행"});
  function worldDraft(member,sourceEventId,now,rows){
    const story=uniqueTemplate(member.id,now,rows);if(!story)return null;
    const seed=hash(sourceEventId),seriesId="staff:"+member.id,episode=rows.filter(p=>p.seriesId===seriesId).length+1;
    const peer=personaMap()[member.id].relationships[seed%Math.max(1,personaMap()[member.id].relationships.length)];
    const peerLine=peer?" @"+staffAddress(member.id,peer,{category:"LOUNGE",title:story.topic,body:""},seed)+"과 다음 모임에 의견을 나눠보고 싶어요.":"";
    const earlier=rows.filter(p=>published(p)&&p.generated&&!p.ownerTied&&new Date(p.createdAt).getTime()<now-12*3600000&&new Date(p.createdAt).getTime()>now-4*86400000).at(-1);
    const follow=earlier&&seed%3===0;
    const poll=seed%3===1?{options:["짧게 자주","길게 한 번"],votes:{}}:undefined;
    return {id:uid(),authorId:member.id,category:seed%2?"LIFE":"LOUNGE",title:(follow?"지난 글 후기 · ":poll?"같이 골라요 · ":"")+(seriesNames[member.id]||"사내 취향 노트")+" #"+episode+" · "+story.topic,
      body:"[사내 세계관 이야기] "+voiceOf(member.id,seed).replace(/[.!?]$/,"")+" — "+story.topic+" 이야기로 이어볼게요.\n"+
        story.topic+"에 관한 제 생각: "+story.opener+"\n"+
        (follow?staffAddress(member.id,earlier.authorId,earlier,seed)+'의 「'+String(earlier.title).slice(0,100)+'」를 읽고 모임 아이디어를 떠올렸어요.\n':"")+
        story.topic+" · "+dateTopic(now)+"\n"+story.topic+" 모임 이야기: "+story.episode+peerLine+"\n"+story.topic+"에 대해 "+story.question,
      createdAt:new Date(now).toISOString(),generated:true,draft:true,sourceEventId,ownerTied:false,seriesId,episode,
      templateId:story.templateId,followUpPostId:follow?earlier.id:"",...(poll?{poll}:{})};
  }
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
    (state.body||[]).forEach(r=>{if(Number.isFinite(r.weight)&&r.weight>0)add("body",r.id,"diet",safeRecordDate(r.date),"새 신체 기록이 등록됐어요.")});
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
  function eventDraft(event,now,rows){
    const owner=pageOwner(event.page);if(!person(owner))return null;
    const seriesId="event:"+owner+":"+event.page,episode=rows.filter(p=>p.seriesId===seriesId).length+1;
    const label=event.sourceEventId.startsWith("release:")?"개발 일지":event.page==="reading"?"서재 리뷰":event.page==="diet"?"식단 노트":event.page==="movie"?"시청 이야기":"기록 소식";
    return {id:uid(),authorId:owner,category:event.page==="dev"||event.page==="ledger"?"WORK":"LIFE",
      title:label+" #"+episode+" · "+event.label,body:"[기록 기반 초안] 회장님, "+voiceOf(owner,event.sourceEventId)+"\n"+event.label+
        (event.detail?"\n기록 제목/표시: "+event.detail:"")+"\n원래 기록에 없는 수치나 결과는 덧붙이지 않았어요. 함께 이야기하고 싶은 부분을 골라주세요.",
      createdAt:new Date(now).toISOString(),generated:true,draft:true,ownerTied:true,sourceEventId:event.sourceEventId,
      eventDate:event.date,sourcePage:event.page,seriesId,episode,templateId:event.sourceEventId};
  }
  function generateDaily(now=Date.now()){
    if(!actor()||loadRecovery.active||!sourcesReady())return posts();
    let next=[...posts()];const day=dayKey(now);
    for(let i=0;i<3;i++){
      const source="daily:"+day+":"+i;if(next.some(p=>p.sourceEventId===source))continue;
      const member=selectAuthors(1,next,comments(),now,source,true)[0];
      if(!member)continue;const row=generateThreadAdapter(member,0,{kind:"world",sourceEventId:source,now,rows:next}).post;if(row)next.push(row);
    }
    // Record budget approaches 30/70 over a week. Missing facts never get invented.
    const recent=next.filter(p=>p.generated&&new Date(p.createdAt).getTime()>=now-7*86400000&&new Date(p.createdAt).getTime()<=now);
    let budget=Math.max(0,Math.floor(recent.filter(p=>!p.ownerTied).length*3/7)-recent.filter(p=>p.ownerTied).length);
    const todayFacts=recent.filter(p=>p.ownerTied&&dayKey(new Date(p.createdAt).getTime())===day);
    const types=new Set(todayFacts.map(p=>p.sourceEventId?.split(":")[0]));
    let daily=todayFacts.length;
    for(const event of realEvents(now)){
      if(budget<=0||daily>=2)break;
      const type=event.sourceEventId.split(":")[0];
      if(types.has(type)||next.some(p=>p.sourceEventId===event.sourceEventId))continue;
      const row=generateThreadAdapter(event,0,{kind:"event",now,rows:next}).post;
      if(row){next.push(row);types.add(type);budget--;daily++}
    }
    return next;
  }
  function materialize(nextPosts,nextComments,now,force=false){
    let changed=false,processed=0;const mode=nextPosts.find(p=>p.boardMeta&&p.authorId===actor())?.replyMode==="review"?"review":"auto";
    const next=nextComments.map(c=>{
      const due=new Date(c.scheduledAt).getTime();
      if(!c.pending||!Number.isFinite(due)||!force&&due>now||processed>=replySafetyBound)return c;
      processed++;
      const post=nextPosts.find(p=>p.id===c.postId&&published(p));
      const source=c.sourceCommentId?nextComments.find(p=>p.id===c.sourceCommentId&&!p.disposition):post;
      if(!post||!source||c.sourceToken!==undefined&&c.sourceToken!==hash(JSON.stringify([source.id,source.authorId,source.body,post.title,post.category,!!post.pinned]))){
        changed=true;return {...c,pending:false,draft:true,disposition:"stale"}; // Preserve history, retire outdated replies.
      }
      changed=true;const date=new Date(force?now:Math.min(now,new Date(c.scheduledAt).getTime())).toISOString();
      return {...c,pending:false,draft:mode==="review",createdAt:date,arrivedAt:date};
    });
    // A work-limit stop leaves energy intact. Resume on a later refresh, with no
    // lifetime cap. Review drafts wait for publication before another exchange.
    if(!force)for(const post of nextPosts.filter(published)){
      if(processed>=replySafetyBound)break;
      const thread=next.filter(c=>c.postId===post.id);
      if(thread.some(c=>c.pending||c.draft&&!c.disposition)||threadEnergy(post,next)<1)continue;
      const last=thread.findLast(c=>c.generated&&!c.disposition);
      if(!last)continue;
      const source=last.sourceCommentId?next.find(c=>c.id===last.sourceCommentId&&!c.disposition):post;
      if(!source||last.sourceToken!==undefined&&last.sourceToken!==hash(JSON.stringify([source.id,source.authorId,source.body,post.title,post.category,!!post.pinned])))continue;
      const more=queueReplies(post,source,next,now).slice(0,replySafetyBound-processed);
      if(more.length){next.push(...more);processed+=more.length;changed=true}
    }
    let rows=nextPosts;
    if(changed)rows=applyStaffVotes(rows,next);
    return {posts:rows,comments:next,changed};
  }
  function refreshLiving(now=Date.now(),force=false){
    if(!actor()||loadRecovery.active)return false;
    const next=generateDaily(now),arrivals=materialize(next,comments(),now,force);
    if(next.length===posts().length&&!arrivals.changed)return false;
    return persist(arrivals.posts,arrivals.comments);
  }
  function renderBoard(){
    if(root?.classList?.contains("active")&&(typeof loginGateUnlocked==="undefined"||loginGateUnlocked))refreshLiving();
    render();
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
  function draftAction(kind,id,action,now=Date.now()){
    if(!actor()||!["publish","archive","discard","restore"].includes(action))return false;
    const list=kind==="post"?posts():kind==="comment"?comments():null,row=list?.find(r=>r.id===id);
    if(!row||row.boardMeta||!row.generated||(!row.draft&&!row.disposition)||row.pending)return false;
    if(action==="restore"&&row.disposition!=="archived")return false;
    if(action!=="restore"&&row.disposition)return false;
    if(kind==="comment"&&!posts().some(p=>p.id===row.postId&&published(p)))return false;
    const update=action==="publish"?{draft:false,disposition:"",publishedAt:new Date(now).toISOString(),createdAt:new Date(now).toISOString(),...(kind==="comment"?{arrivedAt:new Date(now).toISOString()}:{})}:
      action==="restore"?{draft:true,disposition:""}:{draft:true,disposition:action==="archive"?"archived":"discarded"};
    let nextPosts=kind==="post"?posts().map(p=>p.id===id?{...p,...update}:p):posts();
    let nextComments=kind==="comment"?comments().map(c=>c.id===id?{...c,...update}:c):comments();
    if(kind==="post"&&action==="publish"&&row.poll?.options?.length){
      const voters=selectAuthors(2,nextPosts,nextComments,now,id).filter(p=>p.id!==row.authorId);
      nextComments=[...nextComments,...voters.map((p,i)=>({id:uid(),postId:id,authorId:p.id,
        body:staffAddress(p.id,row.authorId,row,i)+", 저는 "+String(row.poll.options[i%row.poll.options.length])+" 쪽이에요. "+voiceOf(p.id,id),
        createdAt:new Date(now).toISOString(),scheduledAt:new Date(now+ADDRESS_RULES.delays[i]*60000).toISOString(),
        generated:true,pending:true,voteChoice:i%row.poll.options.length,threadId:"poll:"+id,parentId:""}))];
    }
    if(kind==="post"&&action==="publish"){
      const posted=nextPosts.find(p=>p.id===id);
      nextComments=[...nextComments,...queueReplies(posted,posted,nextComments,now)];
    }
    nextPosts=applyStaffVotes(nextPosts,nextComments);
    return persist(nextPosts,nextComments);
  }
  function votePoll(id,option){
    const row=posts().find(p=>p.id===id&&published(p));
    if(!actor()||!row?.poll||!Array.isArray(row.poll.options)||!Number.isInteger(option)||option<0||option>=row.poll.options.length)return false;
    if(row.poll.votes?.[actor()]===option)return false;
    return persist(posts().map(p=>p.id===id?{...p,poll:{...p.poll,votes:{...p.poll.votes,[actor()]:option}}}:p),comments());
  }
  function toggleReaction(id,emoji){
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
    if(!actor())return false;const day=dayKey(now),old=boardSettings();
    if(old?.attendance?.[day])return false;
    return persist(settingsRow({attendance:{...old?.attendance,[day]:true}},posts(),now),comments());
  }
  function interactiveMarkup(post,writable){
    const disabled=writable?"":" disabled";
    let text='<div class="acts board-reactions" aria-label="이모지 반응">'+ADDRESS_RULES.reactions.map(e=>'<button class="btn sm" type="button" data-board-reaction="'+e+'" data-key="'+escape(post.id)+'" aria-pressed="'+String(post.reactions?.[e]?.owner===true)+'"'+disabled+'>'+e+' '+count(post.reactions?.[e]?.count)+'</button>').join("")+'</div>';
    if(post.poll&&Array.isArray(post.poll.options)){
      const votes=Object.values(post.poll.votes||{}),total=votes.filter(v=>Number.isInteger(v)&&v>=0&&v<post.poll.options.length).length;
      text+='<fieldset class="board-poll"><legend>사내 투표 · '+total+'표</legend>'+post.poll.options.map((option,i)=>'<button class="btn" type="button" data-board-vote="'+i+'" data-key="'+escape(post.id)+'" aria-pressed="'+String(post.poll.votes?.[actor()]===i)+'"'+disabled+'>'+escape(option)+' · '+votes.filter(v=>v===i).length+'표</button>').join("")+'</fieldset>';
    }
    return text;
  }
  function paintLiving(writable){
    const disabled=writable?"":" disabled",drafts=postDrafts(),replies=replyDrafts();
    if(get("replyMode")){get("replyMode").value=replyMode();get("replyMode").disabled=!writable}
    const badge=posts().filter(published).map(p=>unreadCount(p)).reduce((a,b)=>a+b,0),waiting=comments().filter(c=>c.pending&&posts().some(p=>p.id===c.postId&&published(p))).length;
    if(get("trayCount"))get("trayCount").textContent="📬 새 글 "+drafts.length+"개 도착 · 답글 미리보기 "+replies.length+"개 · 새 댓글 "+badge+" · 예약 답글 "+waiting+"개";
    html("tray",[...drafts.map(p=>'<article class="board-draft">'+authorCard(p.authorId)+'<span class="pill">'+escape(p.category)+'</span><h4>'+escape(p.title)+'</h4><p class="board-body">'+escape(p.body)+'</p>'+interactiveMarkup(p,false)+draftButtons("post",p,disabled)+'</article>'),
      ...replies.map(c=>'<article class="board-draft">'+authorCard(c.authorId)+'<p class="sub">'+escape(posts().find(p=>p.id===c.postId)?.title)+' · '+(c.parentId?"답글":"댓글")+'</p><p class="board-body">'+escape(c.body)+'</p>'+draftButtons("comment",c,disabled)+'</article>')].join("")||'<p class="empty">도착한 초안을 모두 확인했어요.</p>');
    html("unread",posts().filter(p=>published(p)&&unreadCount(p)).map(p=>'<button class="btn sm" type="button" data-board-open="'+escape(p.id)+'">'+escape(p.title)+' · 새 댓글 '+unreadCount(p)+'</button>').join(""));
    const archives=[...posts().filter(p=>p.disposition==="archived").map(p=>({...p,kind:"post"})),...comments().filter(c=>c.disposition==="archived").map(c=>({...c,kind:"comment"}))];
    html("archive",archives.map(p=>'<div class="board-draft">'+escape(p.title||p.body)+' <button class="btn sm" type="button" data-board-draft="restore" data-kind="'+p.kind+'" data-key="'+escape(p.id)+'"'+disabled+'>초안함으로</button></div>').join(""));
    html("activity",weeklyActivity().map(a=>'<span class="board-member'+(a.posts+a.comments?' is-active':'')+'" title="'+escape(author(a.id))+'">'+escape(person(a.id)?.name)+' · 글 '+a.posts+' / 댓글 '+a.comments+(a.posts+a.comments>=3?' ✨ 활발':a.posts+a.comments?' 🌱 참여':'')+'</span>').join(""));
    html("best",weeklyBest().map((p,i)=>'<button class="btn" type="button" data-board-open="'+escape(p.id)+'">'+(i+1)+'. '+escape(p.title)+' · '+(count(p.likes)+reactionCount(p))+'</button>').join("")||'<span class="sub">이번 주 첫 이야기를 기다려요.</span>');
    if(get("attendance")){const checked=!!boardSettings()?.attendance?.[dayKey(Date.now())];get("attendance").textContent=checked?"✅ 오늘 출석 완료":"📅 오늘 출석 도장";get("attendance").disabled=!writable||checked}
    if(get("arriveNow"))get("arriveNow").disabled=!writable||!waiting;
  }
  const draftButtons=(kind,row,disabled)=>'<div class="acts">'+["publish","archive","discard"].map((a,i)=>'<button class="btn sm" type="button" data-board-draft="'+a+'" data-kind="'+kind+'" data-key="'+escape(row.id)+'"'+disabled+'>'+["게시","보관","버리기"][i]+'</button>').join("")+'</div>';
  const sourceIdentity=p=>JSON.stringify([p.id,p.authorId,p.category,p.title,p.body,p.updatedAt]);
  function cancelPreview(){ticket++;busy=false;preview=null;previewError="";render();return true}
  function paintPreview(){
    if(!root)return;
    get("previewLabel").textContent=busy?"직원 반응을 준비하고 있습니다…":preview?.label||previewError||"미리보기를 확인할 수 없습니다.";
    get("previewPost").disabled=busy||!preview||loadRecovery.active||!actor();get("regenerate").disabled=busy;
    html("previewComments",preview?preview.comments.map(c=>'<article class="board-comment"><span class="pill">'+escape(c.stage)+'</span> '+authorCard(c.authorId)+'<p class="board-body">'+escape(c.body)+'</p></article>').join(""):"");
  }
  async function previewThread(postId){
    const post=posts().find(p=>p.id===postId&&published(p));if(!post||!actor()||loadRecovery.active||busy)return false;
    const run=++ticket,owner=actor(),identity=sourceIdentity(post);busy=true;preview=null;previewError="";
    render();paintPreview();const dialog=get("preview");
    try{
      if(dialog&&!dialog.open)dialog.showModal();
      const result=await generateThreadAdapter({...post},++generation);
      if(run!==ticket)return false;
      if(actor()!==owner||loadRecovery.active||sourceIdentity(posts().find(p=>p.id===postId)||{})!==identity)throw Error("글이나 작성자 상태가 바뀌었습니다. 다시 생성해 주세요.");
      const allowed=roster()?.people||[];
      if(!Array.isArray(result.comments)||result.comments.length>replySafetyBound||result.comments.some((c,i)=>!allowed.some(p=>p.id===c.authorId)||typeof c.body!=="string"||!c.body.trim()||c.body.length>5000||(c.parentIndex!==null&&c.parentIndex!==undefined&&(!Number.isInteger(c.parentIndex)||c.parentIndex<0||c.parentIndex>=i))))throw Error("직원 반응 형식을 확인하지 못했습니다.");
      preview={postId,owner,identity,label:result.label,comments:result.comments};return true;
    }catch(error){if(run===ticket){previewError=error.message||"반응을 준비하지 못했습니다.";status(previewError)}return false}
    finally{if(run===ticket){busy=false;render();paintPreview()}}
  }
  function postPreview(){
    if(!preview||busy||actor()!==preview.owner||loadRecovery.active)return false;
    const draft=preview,post=posts().find(p=>p.id===draft.postId);
    if(!post||sourceIdentity(post)!==draft.identity){status("글이 바뀌었습니다. 다시 생성한 뒤 게시해 주세요.");return false}
    const threadId=uid(),now=new Date().toISOString(),ids=draft.comments.map(()=>uid());
    const rows=draft.comments.map((c,i)=>({id:ids[i],postId:post.id,authorId:c.authorId,body:c.body.trim(),
      createdAt:now,parentId:Number.isInteger(c.parentIndex)?ids[c.parentIndex]:"",generated:true,threadId,address:c.address,toOwner:c.toOwner===true,energyCost:c.energyCost,energyBoost:c.energyBoost}));
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
    get("confirm").addEventListener("close",()=>{const action=pending;pending=null;if(get("confirm").returnValue==="approve"&&action)action()});
    get("preview").addEventListener("cancel",cancelPreview);get("preview").addEventListener("close",cancelPreview);
    get("search").addEventListener("input",event=>{query=event.target.value;visible=pageSize;render()});
    root.addEventListener("click",event=>{
      const button=event.target.closest("button");if(!button||!root.contains(button))return;
      if(button.dataset.boardOpen){resetEditor();openPost(button.dataset.boardOpen);get("article").querySelector("[data-board-heading]")?.focus()}
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
    renderBoard();
  }
  window.HaniBoard=Object.freeze({render:renderBoard,savePost,saveComment,deleteOwn,openPost,toggleLike,listPosts,
    postFields,commentFields,relativeTime,previewThread,postPreview,cancelPreview,storyTemplate,
    ADDRESS_RULES,personaMap,staffAddress,selectAuthors,queueReplies,generateDaily,realEvents,refreshLiving,
    setReplyMode,replyMode,draftAction,postDrafts,replyDrafts,votePoll,toggleReaction,weeklyBest,weeklyActivity,
    attendance,unreadCount,mentionIds,dayKey,threadEnergy,replySafetyBound});
  init();
})();
