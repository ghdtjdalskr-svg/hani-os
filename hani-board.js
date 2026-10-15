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
  // Read-only staff projection: participation + stable selection, never persisted.
  function boardReaders(post,now=Date.now()){
    const created=Date.parse(post.createdAt),age=Number.isFinite(created)?Math.max(0,Math.round((Date.parse(dayKey(now))-Date.parse(dayKey(created)))/86400000)):0;
    const probability=age<=2 ? .4+.15*age : Math.min(.9,.7+.04*(age-2));
    const participants=new Set([post.authorId,...visibleComments().filter(c=>c.postId===post.id).map(c=>c.authorId)]);
    // Anonymous reaction counts cannot identify staff. Use identities only when supplied.
    for(const reaction of Object.values(post.reactions||{})){
      if(reaction?.authorId)participants.add(reaction.authorId);
      if(Array.isArray(reaction?.staffIds))reaction.staffIds.forEach(id=>participants.add(id));
    }
    const members=new Map((roster()?.people||[]).filter(p=>p.id&&p.id!==actor()).map(p=>[p.id,p]));
    return [...members.values()].filter(p=>participants.has(p.id)||hash(JSON.stringify([post.id,p.id,"read"])) / 4294967296<probability);
  }
  function boardSupporters(post,now=Date.now()){
    const positive=new Set(visibleComments().filter(c=>c.postId===post.id&&
      !/동의하지|좋지 않|좋아하지|축하.*못|응원.*못|추천하지|반대/.test(c.body||"")&&
      (["agree","cheer"].includes(c.intent)||/공감|동의|축하|응원|좋아요|좋네요|좋아 보여|멋져|멋지|잘하셨|수고하셨|박수|고마워|감사/.test(c.body||""))).map(c=>c.authorId));
    const celebrated=post.authorId===actor()||!!post.sourceEventId||/축하|달성|완독|완료/.test(post.title||"");
    const probability=celebrated ? .45 : ["LIFE","MEMORY"].includes(post.category) ? .35 : .25;
    return boardReaders(post,now).filter(p=>positive.has(p.id)||hash(JSON.stringify([post.id,p.id,"like"])) / 4294967296<probability);
  }
  // Staff may reread a post: commenters come back once, and older posts collect a few repeat reads.
  function staffReads(post,now=Date.now()){
    const created=Date.parse(post.createdAt),age=Number.isFinite(created)?Math.max(0,Math.round((Date.parse(dayKey(now))-Date.parse(dayKey(created)))/86400000)):0;
    const talkers=new Set(visibleComments().filter(c=>c.postId===post.id).map(c=>c.authorId));
    return boardReaders(post,now).reduce((sum,p)=>{const r=hash(JSON.stringify([post.id,p.id,"again"]))/4294967296;return sum+1+(talkers.has(p.id)?1:0)+(r<Math.min(.5,.15+.05*age)?1:0)+(r<Math.min(.2,.03*age)?1:0)},0);
  }
  function displayViews(post,now=Date.now()){
    return Math.min(Number.MAX_SAFE_INTEGER,count(post.views)+staffReads(post,now));
  }
  function displayLikes(post,now=Date.now()){
    return Math.min(Number.MAX_SAFE_INTEGER,count(post.likes)+boardSupporters(post,now).length);
  }
  function countTitle(post,kind,now){
    const readers=kind==="views"?boardReaders(post,now):boardSupporters(post,now),names=readers.slice(0,3).map(p=>displayName(p.id)).join(", ");
    const own=count(post[kind]),verb=kind==="views"?"읽었어요":"공감했어요";
    return (readers.length?"직원 "+readers.length+"명이 "+(kind==="views"?staffReads(post,now)+"번 ":"")+verb+" · "+names+(readers.length>3?" 외 "+(readers.length-3)+"명":""):"아직 직원 반응이 없어요")+
      (own?" · 회장님 "+(kind==="views"?own+"회 조회":"추천"):"");
  }
  const popularity=(a,b,now)=>displayLikes(b,now)-displayLikes(a,now)||displayViews(b,now)-displayViews(a,now);
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
    return {name:id===actor()?"성민":displayName(id),rank:id==="mir"||seedPerson(id)?.specialEntity?"AI ENTITY":member.rank,
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
  // Roster aliases remain searchable; cards and mention chips use Korean names.
  function displayName(id){
    const name=String(person(id)?.name||"");
    return name.split(/\s*·\s*/).filter(s=>/^[가-힣]+$/.test(s)).at(-1)||name;
  }
  const kinship=/(?:언니|누나|오빠|형님|(?:^|[\s,，])형(?=$|[\s,，.!?]))/;
  const metaPhrase=/(?:실제\s*(?:예매|경기|점수|날씨|소식).*?(?:없이|말고)|(?:작품\s*내용|줄거리|경기\s*결과|예매\s*일정|요즘\s*순위|금액\s*비교|가격\s*비교|투자\s*얘기|재테크\s*조언|성격\s*진단).*?(?:없이|말고|대신)|유형으로\s*사람을\s*단정|대화\s*소재로만|구경거리로만|밈은\s*밈으로만|확인된\s*(?:사실|내용|만큼|것|부분)|사실(?:을|과)\s*(?:나눠|구분)|지어내|추측하지|단정하지|원문에\s*적힌\s*그대로|원문부터\s*같이)/;
  const sentences=value=>String(value||"").match(/[^.!?。\n]+(?:[.!?。]+|$)/gu)?.map(s=>s.trim()).filter(Boolean)||[];
  const sentenceKey=value=>String(value).replace(/^(?:회장님|대표님)[,，!]?\s*/,"").replace(/[\s.!?。,，]+/g,"").toLowerCase();
  function generatedText(value){
    let text=publicText(value);
    text=text.replace(/[^.!?。\n]+(?:[.!?。]+|$)/gu,s=>metaPhrase.test(s)?"":s);
    // Match address terms without damaging ordinary words such as 형식/유형.
    text=text.replace(/\s*(?:언니|누나|오빠|형님)/g,"님").replace(/(^|[\s,，])형(?=$|[\s,，.!?])/g,"$1님");
    for(const member of roster()?.people||[]){
      if(member.name!==displayName(member.id))text=text.replaceAll(member.name,displayName(member.id));
    }
    return text.replace(/\bMIR\b/g,displayName("mir")).replace(/^\s*(?:님|씨|아|야)(?:\s*[,，!]\s*|\s+)/,"").trim();
  }
  function displayText(row,value){
    return row?.generated&&row.authorId!==actor()?generatedText(value):publicText(value);
  }
  // Only newly generated drafts enter this thread-wide sentence budget.
  function naturalComments(post,rows,history=[],source=post){
    const used=new Set([...sentences(post.body),...history.filter(c=>c.postId===post.id).flatMap(c=>sentences(c.body))].map(sentenceKey));
    return rows.map(row=>{
      let body=generatedText(row.body);
      if(source.id===post.id&&post.authorId!==actor()&&!post.ownerTied)body=body.replace(/^(?:회장님|대표님)\s*[,，!]?\s+/,"");
      const parts=sentences(body).filter(s=>{const key=sentenceKey(s);if(!key||used.has(key))return false;used.add(key);return true;});
      if(!parts.length){
        const options=[...(FUN_VOICES[row.authorId]||[]),POST_FLAVOUR[row.authorId],...(PEER_LINES[chairmanReplyTopic(post)]||PEER_LINES.general)].filter(Boolean);
        const next=options.flatMap(sentences).find(s=>!used.has(sentenceKey(s)));
        if(next){parts.push(next);used.add(sentenceKey(next));}
      }
      return {...row,body:parts.join(" ")};
    });
  }
  function naturalThread(thread){
    const post={...thread,title:generatedText(thread.title),body:generatedText(thread.body)};
    return {...post,comments:naturalComments(post,thread.comments)};
  }
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
  function listPosts(tab=filter,search=query,now=Date.now()){
    const needle=String(search).trim().toLocaleLowerCase("ko-KR");
    return posts().filter(p=>published(p)&&(tab==="ALL"||tab==="POPULAR"||p.category===tab)&&
      (!needle||[p.title,p.body,author(p.authorId)].some(v=>String(v||"").toLocaleLowerCase("ko-KR").includes(needle))))
      .slice().sort((a,b)=>Number(!!b.pinned)-Number(!!a.pinned)||
        (tab==="POPULAR"?popularity(a,b,now):0)||
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
  // Display-only cleanup. The roster owns names/ranks; stored bodies stay intact.
  function stripLeadingVocative(value,targetIds,duplicatedMention=false,mentionChip=false){
    let body=String(value??"");
    const ids=Array.isArray(targetIds)?targetIds:[targetIds];
    const regexEscape=text=>text.replace(/[.*+?^\u0024{}()|[\]\\]/g,"\\$&");
    for(const id of ids){
      const member=person(id);if(!member)continue;
      const chairman=id===actor();
      const names=chairman?[member.name,"회장님","대표님"]:[member.name,...member.name.split(/\s*·\s*/),displayName(id)];
      const ranks=[member.rank,String(member.rank||"").split(/\s+/).at(-1)].filter(Boolean);
      const namePattern=names.filter(Boolean).sort((a,b)=>b.length-a.length).map(regexEscape).join("|");
      const rankPattern=ranks.sort((a,b)=>b.length-a.length).map(regexEscape).join("|");
      const rankedName="(?:"+namePattern+")"+(rankPattern?"(?:\\s*(?:"+rankPattern+"))?":"")+"(?:\\s*(?:선배님|선배|언니|누나|오빠|형님|형|님|씨|아|야))?";
      const address=(chairman?"(?:"+regexEscape(member.name)+"(?:\\s*"+regexEscape(member.rank)+")?(?:님|씨)?|회장님|대표님)":rankedName)+"[,，!]?\\s+";
      if(duplicatedMention)body=body.replace(new RegExp("^@"+address),"");
      if(!chairman||mentionChip&&id===ids[0])body=body.replace(new RegExp("^"+address),"");
    }
    return body;
  }
  function commentBody(c,parent){
    const post=posts().find(p=>p.id===c.postId);
    let text=displayText(c,c.body);
    if(c.generated&&c.authorId!==actor()&&post?.authorId!==actor()&&!post?.ownerTied&&parent?.authorId!==actor())
      text=text.replace(/^(?:회장님|대표님)\s*[,，!]\s*/,"");
    return stripLeadingVocative(text,[parent?.authorId,post?.authorId],!!parent,!!parent);
  }
  function commentMarkup(c,nested=false,allowReply=true){
    const parent=c.parentId&&visibleComments().find(p=>p.id===c.parentId&&p.postId===c.postId);
    return '<article class="board-comment'+(nested?' board-reply':'')+'"'+(c.parentId?' data-board-parent="'+escape(c.parentId)+'"':'')+'><header>'+authorCard(c.authorId)+'<span class="sub">'+stamp(c)+(c.generated?' · 직원 반응':'')+'</span></header><p class="board-body">'+(parent?'<span class="board-mention">@'+escape(parent.authorId===actor()?'회장님':authorParts(parent.authorId).name)+'</span> ':'')+escape(commentBody(c,parent))+'</p>'+actions(c,"comment")+
      (allowReply?'<button class="btn sm" type="button" data-board-reply="'+escape(c.id)+'"'+(!canWrite()?' disabled':'')+'>답글</button>':"")+'</article>';
  }
  function render(){
    if(!root)return;
    const now=Date.now(),writable=canWrite(),notice=get("syncNotice");
    if(notice){if(writable&&!notice.hidden)status("");notice.hidden=writable}
    if(!writable)status(writeBlockReason());
    if(get("replyMode"))get("replyMode").disabled=!writable;
    get("counts").textContent="글 "+posts().filter(published).length+" · 댓글 "+visibleComments().length;
    paintLiving(writable,now);
    get("author").textContent=author(actor());
    get("postSubmit").disabled=!writable;get("commentSubmit").disabled=!writable;
    root.querySelectorAll("[data-board-filter]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.boardFilter===filter)));
    const rows=listPosts(filter,query,now),totals=new Map();visibleComments().forEach(c=>totals.set(c.postId,(totals.get(c.postId)||0)+1));
    html("list",'<table class="board-table board-mobile-two-line"><caption class="board-sr-only">사내 게시글 목록</caption><colgroup><col class="board-col-category"><col class="board-col-title"><col class="board-col-author"><col class="board-col-date"><col class="board-col-number"><col class="board-col-number"></colgroup><thead><tr>'+["탭(말머리)","제목","글쓴이","날짜","조회","추천"].map(label=>'<th scope="col">'+label+'</th>').join("")+'</tr></thead><tbody>'+
      (rows.slice(0,visible).map(raw=>{const p=postFields(raw),views=displayViews(p,now),likes=displayLikes(p,now);return '<tr class="board-row'+(p.pinned?' board-pinned':'')+(selected===p.id?' board-current':'')+'">'+
        '<td class="board-cell-category"><span class="board-category board-category-'+escape(String(p.category||"").toLowerCase())+'">'+(p.pinned?'공지':escape(p.category))+'</span></td>'+
        '<td class="board-cell-title"><button type="button" class="board-title" data-board-open="'+escape(p.id)+'" aria-pressed="'+String(selected===p.id)+'"><span class="board-title-text">'+escape(displayText(p,p.title))+'</span>'+
        ((totals.get(p.id)||0)?' <strong class="board-comment-count">'+totals.get(p.id)+'</strong>':'')+
        (p.poll?'<span class="board-post-icon" title="투표" aria-label="투표">📊</span>':'')+(p.seriesId?'<span class="board-post-icon" title="연재" aria-label="연재">▤</span>':'')+newBadge(p)+'</button></td>'+
        '<td class="board-cell-author">'+authorCard(p.authorId)+'</td><td class="board-cell-date">'+stamp(p)+'</td>'+
        '<td class="board-cell-views" title="'+escape(countTitle(p,"views",now))+'"><span class="board-mobile-label">조회 </span>'+views+'</td><td class="board-cell-likes'+(likes>0?' board-has-likes':'')+'" title="'+escape(countTitle(p,"likes",now))+'"><span class="board-mobile-label">추천 </span>'+likes+'</td></tr>'}).join("")||
        '<tr><td colspan="6" class="empty">'+(query?'검색 결과가 없습니다.':'아직 게시글이 없습니다.')+'</td></tr>')+'</tbody></table>');
    get("more").hidden=visible>=rows.length;get("listCount").textContent=rows.length+"개 글 · "+Math.min(visible,rows.length)+"개 표시";
    const raw=posts().find(p=>p.id===selected&&published(p)),post=raw&&postFields(raw);
    get("detail").hidden=!post;get("react").disabled=!post||post.authorId!==actor()||!writable||busy;
    if(get("preview")?.open)paintPreview();
    get("replyContext").textContent=replyTo?author(comments().find(c=>c.id===replyTo)?.authorId)+"에게 답글":"";
    if(!post){html("article","");html("comments","");return}
    html("article",'<span class="pill">'+escape(post.category)+'</span>'+(post.pinned?' <span class="board-notice">공지</span>':"")+'<h3 tabindex="-1" data-board-heading>'+escape(displayText(post,post.title))+'</h3><div class="board-detail-meta">'+authorCard(post.authorId,40)+'<span class="sub">'+stamp(post)+' · <span title="'+escape(countTitle(post,"views",now))+'">조회 '+displayViews(post,now)+'</span> · <span title="'+escape(countTitle(post,"likes",now))+'">추천 '+displayLikes(post,now)+'</span>'+'</span>'+newBadge(post)+'</div><p class="board-body">'+escape(displayText(post,post.body))+'</p>'+interactiveMarkup(post,writable)+'<button class="btn" type="button" data-board-like="'+escape(post.id)+'" aria-pressed="'+post.likedByOwner+'"'+(!writable?' disabled':'')+' title="'+escape(countTitle(post,"likes",now))+'">👍 추천 '+displayLikes(post,now)+'</button>'+actions(post,"post"));
    const thread=visibleComments().filter(c=>c.postId===post.id).map(commentFields).sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt)));
    html("comments",orderedComments(thread).map(({comment,nested})=>commentMarkup(comment,nested,!comment.parentId)).join("")||'<p class="empty">첫 댓글을 남겨 주세요.</p>');
  }

  // Discovered contracts: earnings-dialogue is report-only; orchestrator writes cases;
  // learning-quiz returns a fixed quiz schema. No reusable free-prompt text endpoint.
  // Single seam for a future owner-JWT server invocation.
  function generateThreadAdapter(post,round,request={}){
    if(request.kind==="reply")return {label:"직원 반응 미리보기",comments:localQueueReplies(post,request.source,request.history,request.now)};
    return {label:"직원 반응 미리보기",comments:loungeReactions(post,round)};
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
      return formal;
    }
    const nickname=relationNickname(fromId,toId);if(nickname&&!kinship.test(nickname))return nickname;
    const from=person(fromId),to=person(toId);if(!to)return "동료님";
    // Unmapped specialist ranks stay formal. Never infer a made-up job title.
    const a=ADDRESS_RULES.seniorOrder.indexOf(from?.rank),b=ADDRESS_RULES.seniorOrder.indexOf(to.rank);
    const senior=b>=0&&a>=0&&b>=a;
    return displayName(toId)+(from?.team===to.team&&senior?" "+(a===b?"씨":to.rank):" "+to.rank+"님");
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
    "어떤 부분이 마음에 남으셨어요?"
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
  // Interim replies combine the actual comment intent with its post topic.
  const CHAIRMAN_REPLIES=Object.freeze({
    fear:Object.freeze(["걱정될 만해요. 제일 마음 쓰이는 부분부터 들려주세요.","불안한 마음은 이해해요. 한꺼번에 결론 내리지 않아도 괜찮아요."]),
    thanks:Object.freeze([
      "고마워요! 읽어주셔서 저도 힘나요 ㅎㅎ.","좋게 봐주셔서 뿌듯하네요!", "칭찬 들으니까 오늘 기분 좋네요 ㅎㅎ.","한마디 남겨주셔서 감사해요!",
      "알아봐 주시니까 괜히 더 신나네요.","따뜻한 말 덕분에 기운 났어요!", "이렇게 말해주시니 저도 웃게 되네요 ㅎㅎ.","응원 잘 받았어요! 다음에도 같이 이야기해요."
    ]),
    question:Object.freeze([
      "어느 부분이 제일 궁금하세요? 거기부터 같이 봐요.","어떤 상황인지 조금 더 들려주세요. 저도 같이 생각해볼게요.","좋은 질문이네요! 어떤 상황인지 더 들려주세요.","확인할 포인트가 있겠네요. 궁금한 부분부터 짚어봐요.",
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
  const CHAIRMAN_TOPIC_REPLIES=Object.freeze({
    book:{
      fear:["이 책을 읽고 걱정되셨군요. 책의 가능성이 곧 정해진 미래는 아니에요. 책갈피부터 숨 돌려요.","이 책의 무서운 대목이 마음에 남았네요. 주장과 근거를 나눠 보면 불안도 조금 정리될 거예요.","책을 덮어도 그 장면이 맴도는 느낌일까요. 잠시 다른 얘기를 해도 좋아요."],
      thanks:["책 이야기 함께 나눠주셔서 저도 좋아요. 다음 책갈피도 같이 열어요 ㅎㅎ.","독서 이야기 좋게 읽어주셔서 감사해요. 마음에 남은 대목도 나눠봐요.","함께 책 얘기할 사람이 있어서 반가워요. 좋아하는 문장도 들려주세요."],
      question:["이 책에서 궁금하신 대목이군요. 해당 문장과 앞뒤 맥락을 같이 볼까요?","책의 주장과 근거부터 짚어봐요. 어느 대목이 질문으로 남으셨나요?","독서하다 멈칫한 부분이 있나 봐요. 그 페이지를 같이 펼쳐볼까요?"],
      joke:["책 읽다가 댓글에서 웃음 터졌어요 ㅋㅋ. 이 드립은 책갈피에 끼워둘게요.","이 책 이야기가 이렇게 웃겨질 줄은 몰랐네요 ㅎㅎ. 다음 페이지도 기대돼요.","이러다 독서 모임이 웃음 모임 되겠어요 ㅎㅎ. 책보다 댓글을 먼저 읽게 되네요."],
      agree:["이 책에서 그 부분에 공감하셨군요. 어떤 문장이 특히 와닿으셨나요?","책의 그 관점에 저도 고개가 끄덕여져요. 다른 해석도 함께 나눠봐요.","같은 책을 읽어도 마음에 남는 곳은 다르더라고요. 그 해석을 더 듣고 싶어요."],
      other:["이 책을 읽고 남은 생각이군요. 가장 기억나는 대목도 들려주세요.","독서 후에 마음에 남은 느낌이 궁금해요. 편하게 이어서 이야기해요.","덮고 나서도 이어지는 책 이야기가 좋네요. 어떤 기분이 남았는지 궁금해요."]
    },
    ai:{
      fear:["AI 이야기라 더 걱정되셨겠어요. 무서운 시나리오가 확정된 미래는 아니에요. 서두르지 않아도 괜찮아요.","AI에 대한 불안은 이해해요. 어느 장면이 제일 걱정되셨는지 천천히 들려주세요.","AI 얘기가 빠르게 바뀌어서 마음이 복잡할 수 있죠. 가장 불편했던 부분부터 들어볼게요."],
      thanks:["AI 이야기 좋게 봐주셔서 감사해요. 확인한 근거도 같이 챙겨둘게요.","AI 얘기를 함께 나눠주셔서 힘나요. 다음 변화도 차분히 지켜봐요.","함께 AI 얘기를 하니 저도 재밌어요. 다음엔 어떤 이야기를 나눠볼까요?"],
      question:["AI의 어떤 변화가 궁금하신가요? 궁금했던 장면부터 같이 이야기해요.","AI 얘기는 조건에 따라 달라져요. 어떤 사례를 생각하셨는지 들려주세요.","AI를 쓰다가 막힌 부분이 있으셨나요? 어떤 점이 궁금한지 듣고 싶어요."],
      joke:["AI 얘기하다 댓글에서 인간 웃음 버튼이 눌렸네요 ㅋㅋ.","이 AI 드립은 저도 웃었어요 ㅎㅎ. 웃음까지 자동화하진 말아요.","AI 동료도 댓글 보고 웃고 갑니다 ㅋㅋ. 이쯤 되면 웃음 담당 뽑아야겠어요."],
      agree:["AI의 그 관점에 공감하셨군요. 실제 사례와도 맞는지 함께 봐요.","AI 변화에 대한 생각이 통했네요. 기대와 한계도 같이 챙겨봐요.","AI를 보는 시선이 비슷했나 봐요. 특히 마음에 드는 쪽이 궁금해요."],
      other:["AI 변화 중 어떤 부분이 가장 마음에 남으셨어요?","AI 얘기 이어서 듣고 있어요. 실제 경험도 들려주세요.","AI 이야기는 꺼낼 때마다 질문이 생기네요. 저는 다른 분들 생각도 듣고 싶어요."]
    },
    stock:{
      fear:["주식 얘기에 걱정되셨군요. 급하게 결정하기보다 상황을 차분히 확인해요.","주가 변동은 마음도 흔들죠. 걱정되는 대목부터 천천히 이야기해요.","주식 화면 보다가 마음이 무거워지셨나요. 잠깐 쉬면서 얘기해도 괜찮아요."],
      thanks:["주식 이야기 읽어주셔서 감사해요. 숫자와 근거도 꼼꼼히 챙길게요.","투자 얘기를 함께 나눠주셔서 좋아요. 각자 판단 기준도 들어봐요.","투자 이야기를 같이 나눌 수 있어 반가워요. 저도 궁금했던 걸 물어볼게요."],
      question:["주식에서 어떤 지표나 상황이 궁금하세요? 확인할 근거부터 같이 봐요.","투자 질문은 기간과 조건에 따라 달라져요. 생각하신 상황을 들려주세요.","투자할 때 가장 고민되는 지점이 어디예요? 생각하신 기간도 궁금해요."],
      joke:["주식 얘기하다 웃음 수익률은 올랐네요 ㅋㅋ. 실제 수익은 별개지만요.","주가보다 댓글이 더 출렁였네요 ㅎㅎ. 이 드립엔 웃음 한 표요.","투자 얘기에 이런 드립이 나오네요 ㅋㅋ. 웃음 배당은 넉넉하게 받았어요."],
      agree:["투자에서 그 기준에 공감하셨군요. 숫자와 가정도 같이 확인해요.","주식 이야기에 생각이 통했네요. 반대 근거도 함께 봐두면 좋겠어요.","주식 볼 때 챙기는 기준이 닮았나 봐요. 그렇게 생각하게 된 계기도 들려주세요."],
      other:["주식 얘기 이어서 듣고 있어요. 어떤 변화가 가장 눈에 들어오셨어요?","투자에 대한 생각을 남겨주셨네요. 판단할 때 중요하게 본 점도 궁금해요.","투자 얘기는 같은 숫자를 보고도 생각이 갈리네요. 눈여겨보신 부분이 궁금해요."]
    },
    exercise:{
      fear:["운동 얘기에 걱정되셨군요. 무리하지 말고 지금 몸 상태부터 살펴요.","운동 부담이 느껴지셨나 봐요. 오늘은 강도보다 편안한 페이스를 챙겨요.","운동 생각에 부담부터 드셨나 봐요. 쉬고 싶은 날도 있는 거죠."],
      thanks:["운동 이야기 좋게 봐주셔서 감사해요. 응원도 한 세트 더 드릴게요 ㅎㅎ.","운동 얘기 함께 나눠주셔서 좋아요. 오늘 컨디션도 챙겨요.","함께 운동 얘기하니 저도 기운 나네요. 응원은 언제든 보태드릴게요."],
      question:["운동의 어떤 동작이나 상황이 궁금하세요? 컨디션과 함께 알려주세요.","운동은 몸 상태에 따라 달라져요. 궁금한 동작부터 짚어봐요.","운동하면서 불편했던 부분이 있었어요? 어떤 때 그런지 들려주세요."],
      joke:["운동 얘기하다 웃음으로 복근 한 세트 했네요 ㅋㅋ.","이 운동 드립엔 저도 웃었어요 ㅎㅎ. 웃고 나서 물 한 모금요.","운동복보다 웃을 준비부터 해야겠네요 ㅎㅎ. 댓글 읽다 준비운동 끝나겠어요."],
      agree:["운동에서 그 페이스에 공감하셨군요. 꾸준히 갈 수 있는지도 같이 봐요.","운동 얘기에 생각이 통했네요. 회복까지 챙기는 방향이면 좋아요.","운동은 편하게 이어가는 맛도 있죠. 그 페이스가 잘 맞으셨으면 좋겠어요."],
      other:["운동하고 나서 몸은 어떠셨어요? 오늘 느낌도 들려주세요.","운동 이야기 듣고 있어요. 가장 만족스러웠던 순간이 궁금해요.","운동 얘기 들으니 저도 산책하고 싶어지네요. 다음엔 어떤 걸 해보고 싶으세요?"]
    }
  });
  const CHAIRMAN_BOOK_AI_FEAR=Object.freeze([
    "이 책의 AI 디스토피아가 무섭게 느껴지셨군요. 책의 시나리오가 확정된 미래는 아니에요. 책갈피부터 숨 돌려요.",
    "책 속 AI 미래 때문에 불안하셨겠어요. 무서운 장면은 잠깐 덮어두고 좋아했던 대목부터 떠올려봐요. 오늘은 책갈피부터 숨 돌려요.",
    "책의 AI 장면이 자꾸 떠오르셨나 봐요. 잠깐 책갈피를 끼워두고 쉬어도 괜찮아요. 그 마음은 같이 들어볼게요."
  ]);
  const CHAIRMAN_TOPIC_FLAVOUR=Object.freeze({hani:"같이 차근차근 챙길게요.",yuri:"근거는 제가 꼼꼼히 볼게요.",jieun:"부담은 조금 내려놔요.",haru:"커피 한 잔 곁들여 들어볼게요.",seoyun:"놓친 맥락도 같이 챙겨요.",serin:"숫자와 사실은 차분히 볼게요.",hina:"빨간 펜은 잠깐 넣어둘게요 ㅎㅎ.",arin:"느낌도 편하게 들려주세요.",taeo:"무리하지 않는 쪽으로요.",yuna:"이야기 계속 듣고 있어요!",dohyun:"궁금했던 장면부터 이야기해요.",gaeun:"옆에서 함께 듣고 있을게요.",mir:"다른 관점도 한 조각 보태볼게요."});
  function chairmanReplyTopic(post,text=""){
    const topic=value=>/독서|도서|서재|작가|저자|(?:^|\s)책(?:$|[\s:：,.!?을은에이과도]|으로|후기|리뷰|추천)|\bbooks?\b|\breading\b/i.test(value)?"book":/주식|투자|증시|주가|stock|portfolio/i.test(value)?"stock":/운동|헬스|근력|달리기|(?:^|\s)러닝|exercise|workout/i.test(value)?"exercise":/\bAI\b|\bAGI\b|인공지능|머신러닝|딥러닝|디스토피아|챗봇/i.test(value)?"ai":"general";
    const comment=String(text||"").replace(/@[가-힣A-Za-z]+/g,""),current=topic(comment);
    const context=topic([post?.title,...(Array.isArray(post?.topics)?post.topics:[]),post?.topic,post?.category].filter(Boolean).join(" "));
    return context==="book"&&current==="ai"?"book":current!=="general"?current:context!=="general"?context:topic(String(post?.body||""));
  }
  function chairmanReplyIntent(text){
    const value=String(text||"").replace(/@[가-힣A-Za-z]+/g,"");
    return /걱정|불안|두려|무섭|무서|겁나|겁이|공포|fear|worr(?:y|ied)|afraid|scared/i.test(value)?"fear":
      /[?？]|왜|어떻게|궁금|알려|질문|뭐야|뭘|언제|어디|얼마|인가요|나요|할까/.test(value)?"question":
      /고마|감사|수고|잘했|멋지|멋져|최고|대단|좋은 글|칭찬/.test(value)?"thanks":
      /ㅋㅋ|ㅎㅎ|웃|농담|장난|드립/.test(value)?"joke":/맞아|맞네|맞습니다|동의|공감|찬성|좋아요|그러게|그렇지/.test(value)?"agree":"other";
  }
  function ownerReactions(post,source=post,history=comments(),round=0){
    if(!post||!source||source.authorId!==actor()||!sourcesReady())return [];
    const seed=hash(source.id+source.body+round),sensitive=sensitiveConversation(post,source),intent=sensitive?"fear":chairmanReplyIntent(source.body),topic=chairmanReplyTopic(post,source.body);
    let candidates=commentCandidates(post,source,history,Date.now(),seed);
    if(!candidates.length)candidates=selectAuthors(roster()?.people?.length||0,posts(),history,Date.now(),seed)
      .map(p=>({p,...candidateScore(p.id,post,source,history)})).filter(r=>r.affinity>0&&!r.avoid)
      .sort((a,b)=>b.affinity-a.affinity).map(r=>r.p);
    const chosen=candidates.slice(0,1+seed%3),previewHistory=[...history],openers=new Set();
    return naturalComments(post,chosen.map((p,i)=>{
      const address=staffAddress(p.id,actor(),post,seed+i,previewHistory);
      const aiFear=topic==="book"&&intent==="fear"&&/\bAI\b|\bAGI\b|인공지능|디스토피아/i.test([post.title,post.body,source.body].join(" "));
      const pool=aiFear?CHAIRMAN_BOOK_AI_FEAR:CHAIRMAN_TOPIC_REPLIES[topic]?.[intent]||CHAIRMAN_REPLIES[intent],start=hash(seed+":"+p.id+":"+i)%pool.length;
      const options=pool.map((_,offset)=>pool[(start+offset)%pool.length]).filter(text=>!echoesOriginal(text,source.body)&&!echoesOriginal(text,post.title));
      const line=options.find(text=>!openers.has(loungeOpener(text)))||options[0];
      const flavour=intent==="fear"?"편하게 이야기해요. 함께 듣고 있어요.":topic!=="general"?CHAIRMAN_TOPIC_FLAVOUR[p.id]:(intent==="agree"||intent==="joke")?REACTIONS[p.id]?.[intent==="agree"?0:2]:CHAIRMAN_REPLY_FLAVOUR[p.id];
      let text=line||"";if(text&&openers.has(loungeOpener(text)))text=(flavour||REACTIONS[p.id]?.[1]||"다른 생각도 궁금해요.")+" "+text;
      openers.add(loungeOpener(text));
      let body=address+(text?", "+text: "!")+(flavour&&!text.startsWith(flavour)?" "+flavour:"");
      if(echoesOriginal(body,source.body)||echoesOriginal(body,post.title))body=address+"!";
      const row={authorId:p.id,body,parentIndex:null,address,toOwner:true,intent,topic};
      previewHistory.push({...row,postId:post.id,generated:true});return row;
    }),history,source);
  }
  const LOUNGE_LINES=Object.freeze({
    book:["저도 읽어보고 싶어요!","어떤 대목이 남으셨는지 궁금해요.","책 얘기는 언제 들어도 반가워요. 감상도 나눠주세요!","완독 소식에 박수요!"],
    movie:["스포 없이 감상 듣고 싶어요!","영화 얘기라면 저도 끼고 싶어요.","어떤 느낌이셨나요? 가볍게 한 줄 들려주세요.","제 취향일지도 궁금하네요."],
    exercise:["걸음 소식에 응원 한 표요!","잠깐 스트레칭하고 싶어지네요.","수고하셨어요! 쉬는 시간도 챙겨주세요.","무리 없이 이어가시면 좋겠어요."],
    goal:["마무리 소식에 박수요!","저도 응원 보태요!","수고하셨어요. 잠깐 쉬셔도 좋겠어요.","이런 소식은 같이 기뻐하고 싶어요."],
    general:["잠깐 들렀는데 반가운 소식이네요.","같이 이야기 나누니 좋아요!","저도 궁금해요. 한 줄 더 듣고 싶어요.","응원 한 표 보태고 가요!"]
  });
  const PEER_LINES=Object.freeze({
    book:["저도요! 읽고 나서 여기서 얘기해요.","그 얘기 들으니 저도 책 이야기가 궁금해요.","감상 나누자는 쪽에 저도 한 표요."],
    movie:["저도요 ㅎㅎ. 스포는 아껴두고 얘기해요.","감상 듣자는 쪽에 저도 한 표요.","취향 얘기로 이어가면 재밌겠어요."],
    exercise:["저도 무리 없이 이어가셨으면 좋겠어요.","저도 응원에 한 표 보태요!","이런 응원은 같이 보태고 싶어요."],
    goal:["저도 박수 보태요 ㅎㅎ.","같이 응원하니까 더 좋네요.","수고하셨다는 말, 저도 보태요."],
    general:["그 얘기 좋네요. 저도 같이 들어볼게요.","같이 이야기하니 더 반가워요 ㅎㅎ.","저도 그쪽에 한 표요!"]
  });
  const loungeOpener=body=>String(body).replace(/^(?:회장님|대표님|오빠)[,!]?\s*/,"").split(/[.!?。\n]/)[0].trim();
  function loungeReactions(post,round,source=post,history=comments()){
    const rows=ownerReactions(post,source,history,round);
    if(post&&!lightConversation(post,source))return naturalComments(post,rows.map(row=>({...row,body:/ㅋㅋ|ㅎㅎ|드립|농담|\p{Extended_Pictographic}/u.test(row.body)?row.address+", 차분히 확인할게요. 필요한 내용부터 함께 살펴봐요.":row.body})),history);
    if(!post||source?.id!==post.id||mentionIds(source.body).length)return rows;
    const type=String(post.sourceEventId||"").split(":")[0],context=chairmanReplyTopic(post),topic=type==="achieved"?"goal":LOUNGE_LINES[type]?type:PEER_LINES[context]?context:"general";
    const used=new Set(),seed=hash((post.sourceEventId||post.id)+round);
    return naturalComments(post,rows.map((row,i)=>{
      const peer=rows.length>=3&&i===rows.length-1;
      const peerPool=row.intent==="fear"?["그 부분은 천천히 이야기해요. 저도 귀 기울여 듣고 있어요.","불안할 땐 잠깐 숨 돌려도 괜찮아요."]:
        row.intent==="question"?["그 부분은 저도 궁금해요. 근거부터 같이 찾아봐요.","어디부터 볼지 같이 이야기해요."]:PEER_LINES[topic];
      const pool=peer?peerPool:LOUNGE_LINES[topic],start=hash(seed+row.authorId)%pool.length;
      const line=pool.map((_,n)=>pool[(start+n)%pool.length]).find(s=>!used.has(loungeOpener(s)));
      // Keep QA-210 topic/sentiment responses. Casual general chatter can be one short line.
      const casual=row.topic==="general"&&row.intent==="other";
      const playful=casual||["thanks","agree","joke"].includes(row.intent)||!!LOUNGE_LINES[type]&&row.intent!=="question";
      const recordLines={book:"회장님 독서왕 등극 👑",exercise:"응원 댓글에 저도 한 표요 ㅎㅎ",goal:"마무리 박수 버튼 꾹 ㅋㅋ",movie:"스포 없이 감상 기다릴게요 ㅎㅎ"};
      const fun=recordLines[topic]&&hash(seed+row.authorId)%2===0?recordLines[topic]:funComment(row.authorId,"general",seed,i);
      let body=playful?fun:peer?line:row.body;
      if(used.has(loungeOpener(body)))body=funComment(row.authorId,"general",seed,i);
      if(used.has(loungeOpener(body)))body=line+" "+(POST_FLAVOUR[row.authorId]||"저도 같이 얘기해요.");
      used.add(loungeOpener(body));
      return {...row,body,parentIndex:peer?0:null,
        address:peer?staffAddress(row.authorId,rows[0].authorId,post,seed):row.address,toOwner:!peer};
    }),history,source);
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
    const rows=loungeReactions(post,0,source,history),ids=rows.map(()=>uid());
    return rows.map((row,i)=>({...row,id:ids[i],postId:post.id,
      createdAt:new Date(now).toISOString(),scheduledAt:new Date(now+ADDRESS_RULES.delays[i]*60000).toISOString(),
      parentId:Number.isInteger(row.parentIndex)?ids[row.parentIndex]:source.id===post.id?"":source.id,generated:true,threadId,pending:true,
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
    (state.exercise||[]).forEach(r=>{if(Number.isSafeInteger(r.steps)&&r.steps>0)add("exercise",r.id,"exercise",safeRecordDate(r.date),"걸음 소식 같이 나눠요",r.steps.toLocaleString("ko-KR")+"보")});
    (state.books||[]).forEach(r=>{
      const a=safeRecordDate(r.completedDate),b=safeRecordDate(r.readDate);
      if(r.status!=="read"||r.completedDate&&!a||r.readDate&&!b||a&&b&&a!==b)return;
      add("book",r.id,"reading",a||b,"완독 소식 같이 나눠요",String(r.title||"").slice(0,140));
    });
    (state.movies||[]).forEach(r=>{if(r.status==="watched")add("movie",r.id,"movie",safeRecordDate(r.watchedDate),"영화 이야기 나눠요",String(r.title||"").slice(0,140))});
    // Completed tasks are verified goal-sized milestones; never infer registry achievement from a target alone.
    (state.tasks||[]).forEach(r=>{if(r.status==="done"||r.completed===true)add("goal",r.id,"tasks",safeRecordDate(r.completedAt||r.updatedAt||r.date),"할 일 하나 마무리하셨대요",String(r.title||"").slice(0,140))});
    (state.goalRegistry||[]).forEach(r=>{if(r.status==="achieved"&&r.achievedAt)add("achieved",r.goal_id+":"+r.revision,"home",safeRecordDate(r.achievedAt),"목표 달성 소식 나눠요",String(r.title||r.name||r.label||"").slice(0,140))});
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
    (window.HANI_DEVELOPMENT_HISTORY_V1?.entries||[]).forEach(r=>add("dev",r.id,"dev",r.date,"개발팀 소식 같이 읽어요",String(r.title||"").slice(0,140)+" · "+String(r.status||"확인 필요")));
    return out.sort((a,b)=>b.date.localeCompare(a.date)||a.sourceEventId.localeCompare(b.sourceEventId));
  }
  // All variants use the existing event identity. No new record fields or render-time randomness.
  const POST_FLAVOUR=Object.freeze({hani:"이런 소식은 같이 나누고 싶어요.",yuri:"하나씩 확인해 가는 게 좋아요.",jieun:"작은 소식에도 괜히 힘이 나네요.",sua:"저도 응원 한 표 보태요!",naeun:"무리 없이 이어가셨으면 좋겠어요.",haru:"커피 한 잔 곁들여 이야기 듣고 싶어요.",sooyeon:"이런 얘기 나오면 저도 신나요!",minji:"나중에 다시 읽어보고 싶은 소식이에요.",hina:"이런 소식은 반갑네용 ㅎㅎ.",seoyun:"한 줄 남겨두니 함께 이야기하기 좋네요.",arin:"잠깐 들러서 같이 이야기해요.",yuna:"다음 이야기도 궁금해요!",dohyun:"궁금한 부분은 같이 짚어봐요.",serin:"이야기 들으니 저도 궁금해지네요.",mir:"다른 분들은 어떻게 느끼는지도 궁금해요.",taeo:"잠깐 쉬면서 이야기 나눠요.",gaeun:"옆에서 응원 보태고 싶어요."});
  function eventDraft(event,now){
    const owner=pageOwner(event.page);if(!person(owner))return null;
    const type=event.sourceEventId.split(":")[0],seed=hash(event.sourceEventId),detail=publicText(event.detail||"");
    const named=detail?"『"+detail+"』":"",book=named||"책 한 권",movie=named||"영화 한 편",goal=named||"목표 하나",task=named||"할 일 하나";
    const variants={
      book:[
        ["회장님 "+book+" 완독하셨대요 📚","회장님이 "+book+" 끝까지 읽으셨대요. 마음에 남은 대목이 궁금해요."],
        [book+" 완독 소식, 같이 나눠요", "회장님이 "+book+" 다 읽으셨어요. 저도 읽어보고 싶어요!"],
        ["회장님 책 이야기: "+book,"회장님이 이번에 완독하신 책은 "+book+"! 읽으신 분들 감상도 궁금해요."],
        [book+" 마지막 페이지까지!","회장님이 "+book+" 완독하셨대요. 어떤 느낌이셨는지 들어보고 싶어요."]
      ],
      movie:[
        ["회장님 "+movie+" 보셨대요 🎬","회장님이 "+movie+" 보셨어요. 스포 없이 감상 듣고 싶어요."],
        [movie+" 이야기할 분?","회장님이 "+movie+" 보셨대요. 같이 보신 분도 계신가요?"],
        ["이번 영화 이야기는 "+movie,"회장님이 "+movie+" 보셨대요. 저도 어떤 느낌인지 궁금해요."],
        [movie+", 감상이 궁금해요","회장님이 "+movie+" 시청을 마치셨어요. 가볍게 이야기 나눠요."]
      ],
      exercise:[
        ["회장님 "+detail+" 걸으셨대요 👟","회장님 걸음 수가 "+detail+"예요. 저도 잠깐 몸을 움직이고 싶어지네요."],
        [detail+" 걸음 소식, 응원 보태요","회장님 걸음 수는 "+detail+"예요. 쉬는 시간도 같이 챙기셨으면 좋겠어요."],
        ["회장님 걸음 이야기: "+detail,"회장님이 "+detail+" 걸으셨대요. 저도 응원 한 표요!"],
        [detail+", 같이 박수 보내요","회장님 걸음 기록에 "+detail+"가 남았어요. 회장님께 수고하셨다고 전하고 싶어요."]
      ],
      body:[
        ["회장님 몸 상태 소식, "+detail,"회장님이 몸 상태를 남기셨어요. 확인한 체중은 "+detail+"예요."],
        [detail+", 몸 상태 같이 챙겨요","회장님 이번 체중은 "+detail+"예요. 숫자만큼 컨디션도 궁금해요."],
        ["몸 상태 챙기는 회장님 이야기","회장님 체중 기록은 "+detail+"예요. 편안한 페이스로 이어가셨으면 해요."],
        ["이번 몸 상태는 "+detail,"회장님이 체중 "+detail+"를 남기셨어요. 무리 없이 챙겨가요."]
      ],
      goal:[
        ["회장님 "+task+" 마무리하셨대요","회장님이 "+task+" 끝내셨어요. 수고하셨다고 전하고 싶어요."],
        [task+" 끝! 응원 보태요","회장님이 "+task+" 마무리하셨어요. 잠깐 숨 돌리셔도 좋겠어요."],
        ["할 일 마무리 소식: "+task,"회장님이 "+task+" 마무리하셨어요. 이런 소식 들으면 저도 힘나요."],
        [task+", 같이 박수 보내요","회장님 할 일 목록에 완료된 "+task+" 소식이 있어요. 응원 한마디 보태요!"]
      ],
      achieved:[
        ["회장님 "+goal+" 달성하셨대요","회장님이 "+goal+" 달성하셨어요. 같이 축하하고 싶어요!"],
        [goal+" 달성 소식, 같이 축하해요","회장님이 "+goal+" 달성하셨어요. 잠깐 쉬면서 기뻐하셔도 좋겠어요."],
        ["목표 달성! "+goal+" 이야기","회장님 목표 목록에 달성한 "+goal+" 소식이 있어요. 저도 응원 보태요."],
        [goal+", 축하 한마디 보태요","회장님이 "+goal+" 달성하셨대요. 박수 보내고 싶어요."]
      ],
      progress:[
        ["목표 기준에 닿은 소식, 같이 봐요","회장님 목표가 조금씩 가까워지고 있네요 — "+detail],
        ["목표 진행 이야기 나눠요","회장님 목표 화면에 반가운 소식이 있어요 — "+detail],
        ["목표 화면에서 반가운 소식","회장님 목표 진행 소식도 같이 나눠요 — "+detail],
        ["지금까지의 목표 진행, 잠깐 같이 봐요","회장님 목표 이야기, 잠깐 같이 봐요 — "+detail]
      ],
      ledger:[
        [detail+" 정산 소식, 수고하셨어요","회장님이 "+detail+" 정산을 남기셨어요. 숫자 이야기 잠깐 나눠요."],
        ["회장님 "+detail+" 정산 남기셨대요","회장님이 남기신 월간 정산은 "+detail+"이에요. 차분히 같이 살펴봐요."],
        [detail+" 정산, 같이 살펴볼까요?","회장님이 "+detail+" 정산을 저장하셨어요. 궁금한 부분은 같이 봐요."],
        ["이번 정산 이야기는 "+detail,detail+" 월간 정산이 있어요. 회장님께 수고하셨다고 전하고 싶어요."]
      ],
      release:[
        ["화면 버전 "+detail+", 같이 둘러봐요","지금 화면에 보이는 버전은 "+detail+"이에요. 눈에 들어오는 부분이 있나요?"],
        [detail+" 화면 구경할 분?","화면 표시가 "+detail+"이네요. 같이 둘러보며 이야기해요."],
        ["지금 화면은 "+detail,"표시 버전은 "+detail+"이에요. 사용하면서 느낀 점도 궁금해요."],
        ["화면 이야기: "+detail,"화면에 "+detail+"이 보이네요. 잠깐 같이 구경해요."]
      ],
      quarter:[
        ["새 분기, 목표 이야기 나눠요","새 분기가 시작됐어요. 이번 목표도 같이 살펴봐요."],
        ["이번 분기는 어디부터 시작할까요?","새 분기 목표를 볼 시기예요. 먼저 챙기고 싶은 게 궁금해요."],
        ["분기 첫 이야기, 목표부터 같이 봐요","새 분기가 열렸어요. 부담 없이 목표 이야기 나눠요."],
        ["새 분기 목표, 잠깐 같이 볼까요?","새 분기가 시작됐네요. 한 가지씩 같이 살펴봐요."]
      ],
      dev:[
        ["개발팀 소식: "+detail,detail+" 소식이 있어요. 어떤 부분이 눈에 들어오세요?"],
        [detail+", 같이 읽어볼 분?","개발 기록에 "+detail+" 소식이 있어요. 어떤 이야기가 이어질지 궁금해요."],
        ["라운지에 전하는 개발 이야기: "+detail,detail+" 이야기를 가져왔어요. 잠깐 들러서 이야기 나눠요."],
        ["개발 이야기 잠깐 나눠요 — "+detail,"이번 개발 소식은 "+detail+"예요. 각자 궁금한 점도 나눠봐요."]
      ]
    };
    const [title,text]=(variants[type]||variants.dev)[seed%4];
    const record=type==="book"?(state.books||[]).find(r=>"book:"+r.id===event.sourceEventId):null;
    const author=record?.author?publicText(String(record.author).slice(0,80)):"";
    const bodyText=author?text.replace(book,book+" ("+author+")"):text;
    return {id:uid(),authorId:owner,category:event.page==="dev"||event.page==="ledger"?"WORK":"LIFE",
      title,body:bodyText+" "+(POST_FLAVOUR[owner]||"같이 이야기 나눠요."),createdAt:new Date(now).toISOString(),generated:true,draft:false,ownerTied:true,
      sourceEventId:event.sourceEventId,eventDate:event.date,sourcePage:event.page};
  }
  // Read-only content projections: daily Library ids, schedules and save paths stay canonical.
  const LOUNGE_FUN_POOL=Object.freeze([
    ["yuna","lunch","오늘 점심 국밥 vs 마라탕 투표 받습니다 🍜","제가 메뉴 담당인가요?! 국밥이랑 마라탕 사이에서 아직 결정을 못 했어요. 댓글로 한 표만 주세요 ㅎㅎ."],
    ["sua","lunch","도시락 뚜껑 열기 전 메뉴 자랑 타임","오늘의 점심 고민은 반찬 조합이에요. 설거지 적은 메뉴 추천이면 더 반갑습니다 ㅎㅎ."],
    ["hina","lunch","점심 메뉴 회의는 왜 늘 연장전이죠 ㅋㅋ","메뉴 고르기만 하면 의견이 풍성해져요. 오늘은 먹고 싶은 메뉴 하나씩만 제출해요, 복수 정답 인정!"],
    ["naeun","running","퇴근 후 러닝 크루, 걷기 반도 환영 🏃","속도 경쟁 없이 편한 페이스로 가볍게 움직일 분 있나요? 저는 중간에 쉬어 가는 쪽도 좋아요."],
    ["yuna","running","운동복 꺼내기까지가 제일 긴 준비운동","퇴근 후 운동을 상상하다 운동복부터 고르고 있어요. 일단 가볍게 걷는 쪽으로 시작해볼까요 ㅎㅎ."],
    ["naeun","running","러닝 플레이리스트 첫 곡 뭐예요","저는 첫 곡 고르다가 산책으로 바뀌어도 괜찮아요. 신나는 곡이랑 편안한 곡 중 어느 쪽이 취향이에요?"],
    ["minji","streaming","넷플릭스 고르다가 쉬는 시간 끝날 듯 📺","볼거리 고르는 것도 취미로 쳐주나요 ㅋㅋ. 오늘은 코미디랑 잔잔한 드라마 중에 고민이에요."],
    ["minji","streaming","웹툰 얘기하실 분, 스포는 문 앞에 두고요","저는 그림체 취향 얘기만 해도 신나요. 저는 자기 전에 한 편씩 보는 게 좋아요 ㅎㅎ."],
    ["hina","streaming","드라마 정주행파 vs 천천히파 출석 체크","저는 다음 편 버튼 앞에서 자제력 시험 중이에요 ㅋㅋ. 다음 날 졸릴 걸 알면서도 한 편 더 보고 싶어요."],
    ["haru","cafe","주말 카페는 커피파 vs 디저트파 ☕","저는 편한 자리랑 컵 취향부터 보게 돼요. 이번 주말에 가보고 싶은 카페 분위기 하나씩 적어봐요."],
    ["arin","cafe","맛집 지도 핀 색 고르다가 배고파짐","주말 탐방 후보를 정리한다면 지도 색부터 맞추고 싶어요 ㅎㅎ. 조용한 곳과 활기찬 곳 중 어떤 분위기가 좋아요?"],
    ["sua","cafe","맛집 탐방 준비물은 편한 신발 한 표","주말에 새 동네 구경을 가보고 싶어요. 동선은 짧게, 메뉴 고민은 즐겁게 잡아볼까요."],
    ["naeun","snack","다이어트 계획과 야식 메뉴가 동시에 떠오름","야식 생각난다고 스스로 혼내지는 말아요. 저는 부담 없이 먹고 편하게 쉬는 쪽이 좋아요 ㅎㅎ."],
    ["jieun","snack","야식 장바구니 vs 냉장고 재고 대결","배달 메뉴 구경하다 냉장고에 먼저 질문해보려 해요. 제 야식 예산 회의는 늘 혼자 열립니다 ㅋㅋ."],
    ["hina","snack","야식 생각만 해도 메뉴 퀴즈가 열려요","라면파와 토스트파, 오늘의 취향 답안 받습니다. 틀린 답은 없으니까 편하게 골라요 ㅋㅋ."],
    ["yuna","monday","월요일용 기운 충전 버튼 찾습니다","월요병 대비로 좋아하는 노래를 미리 골라둘까 해요. 저는 응원 댓글도 충전기로 인정합니다 ㅎㅎ."],
    ["haru","monday","월요병에는 따뜻한 컵부터 준비해요","월요일을 상상하면 커피 향부터 챙기고 싶어요. 급하게 달리기보다 잠깐 숨 돌릴 자리를 만들어봐요."],
    ["hina","monday","월요병 과목은 재시험 없나요 ㅋㅋ","주말에서 평일로 넘어가는 마음에 보충 수업이 필요해요. 오늘의 준비물은 작은 웃음이면 충분합니다."],
    ["haru","coffee","아아파 vs 따아파, 컵 들고 입장 ☕","저는 그날 편하게 마시고 싶은 쪽을 골라요. 커피 취향에 정답은 없으니까 차 좋아하는 분도 같이 얘기해요."],
    ["jieun","coffee","커피 가성비 계산하다 향에 설득됨","커피 얘기만 나오면 계산기와 취향이 같이 켜져요. 오늘은 가격표 없이 좋아하는 향만 비교해요 ㅋㅋ."],
    ["arin","coffee","커피보다 컵 디자인에 먼저 반응한 사람","예쁜 컵도 좋지만 손에 편한 컵이면 더 반가워요. 각자 좋아하는 컵 색깔 알려주세요 ㅎㅎ."],
    ["yuna","mbti","MBTI보다 점심 메뉴 앞의 제가 더 낯설어요","계획은 빨리 세우는데 점심만 고르려면 오래 걸려요 ㅎㅎ. 저는 메뉴판 앞에서만 결정 시간이 길어지는 편 같아요."],
    ["hina","mbti","계획파 vs 즉흥파, 주말 준비물 검사","주말 약속은 미리 잡는 편인가요? 저는 계획표에 빈칸도 남기는 답안이 좋아요 ㅋㅋ."],
    ["minji","mbti","MBTI 밈 보고 내 얘긴가 싶었던 순간","계획표 쓰다가 꾸미는 데 더 오래 걸리는 짤에 웃었어요. 제 다이어리도 스티커 자리가 더 넓어요 ㅎㅎ."],
    ["yuna","travel","여행 가고 싶은 곳, 상상 지도 펼쳐요 🧳","바다랑 산 중 어디로 마음이 가나요? 아직 일정은 없지만 가보고 싶은 곳 얘기만으로도 설레요."],
    ["haru","travel","여행 짐에 텀블러 넣을까 말까 회의","가벼운 가방이랑 익숙한 컵 사이에서 고민 중이에요. 여행 가면 꼭 챙기고 싶은 물건 하나씩 알려주세요."],
    ["arin","travel","여행 사진에는 풍경파 vs 간판파","저는 예쁜 간판도 자꾸 찍고 싶어져요. 다음에 가보고 싶은 곳의 색감부터 상상해봐요 ㅎㅎ."],
    ["jieun","money","연봉 짤 보고 계산기만 조용히 닫음 ㅋㅋ","장바구니 합계 보는 순간 결제 손가락이 멈추는 짤 있잖아요. 충동구매 참은 썰도 듣고 싶어요."],
    ["jieun","money","절약 짤 저장하다 저장함만 부자 됨","짤 수집과 실천 사이에 생각보다 긴 복도가 있네요 ㅋㅋ. 장바구니 비우고 나면 괜히 뿌듯하지 않나요?"],
    ["sua","money","구독 정리 짤에 뜨끔한 사람 손","구독 해지 버튼 찾다가 숨은그림찾기 하는 기분이었어요. 저는 안 쓰는 구독이 있는지 살펴보는 장면에 공감했어요 ㅎㅎ."],
    ["minji","tickets","아이돌 콘서트 티켓팅 상상만 해도 손 긴장 🎤","보고 싶은 무대를 떠올리면 클릭 손부터 준비되네요 ㅋㅋ. 신나는 무대라면 저도 응원봉 흔들고 싶어요."],
    ["yuna","tickets","콘서트 준비물 체크 담당, 제가요?!","좋아하는 음악을 함께 듣는 자리를 상상해봤어요. 공연에 간다면 챙기고 싶은 준비물을 알려주세요 ㅎㅎ."],
    ["hina","tickets","티켓팅 연습에는 손가락 준비운동도 있나요","콘서트 가고 싶은 마음과 클릭 실력은 별도 과목 같아요 ㅋㅋ. 앙코르곡은 신나는 쪽이면 좋겠어요."],
    ["naeun","pets","반려동물 사진 구경은 마음의 스트레칭 🐾","동물 사진을 보면 잠깐 표정이 풀려요. 자랑하고 싶은 귀여운 습관이 있다면 편하게 들려주세요."],
    ["minji","pets","반려동물 영상 폴더 이름부터 귀여움","귀여운 표정 한 장에 제목 후보가 막 떠올라요 ㅎㅎ. 강아지 고개 갸웃하는 표정은 몇 번을 봐도 귀여워요."],
    ["haru","pets","집사 책상에 털도 감성 소품인가요 ㅋㅋ","반려동물 얘기 들으면 생활용품 취향도 궁금해져요. 함께 편하게 지내기 위한 소소한 아이디어가 있나요?"],
    ["sua","cooking","자취 요리의 최종 보스는 설거지 🍳","간단한 요리를 생각하면 뒷정리부터 계산해요. 팬 하나로 끝나는 메뉴가 제 취향입니다 ㅎㅎ."],
    ["jieun","cooking","냉장고 재료로 요리하면 쇼핑 안 해도 되죠","남은 재료 이름으로 메뉴 짓기부터 해볼까요. 제 계산기는 오늘 장보기 대신 쉬는 쪽을 응원해요 ㅋㅋ."],
    ["yuna","cooking","간장계란밥도 플레이팅하면 기분이 달라질까요","제가 요리 사진 담당인가요?! 간단한 메뉴에 예쁜 접시를 꺼내보고 싶어요 ㅎㅎ."],
    ["hina","games","게임 튜토리얼부터 꼼꼼하게 보는 선생님","협동 게임에서는 서로 알려주는 시간이 좋아요. 실수해도 웃으며 다시 해보는 파티 모집합니다 ㅋㅋ."],
    ["yuna","games","협동 게임에서 길 잃는 담당, 제가요?!","아직 게임 취향을 탐색하는 중이에요. 천천히 배우는 신입도 환영하는 장르가 좋아요 ㅎㅎ."],
    ["minji","games","게임 캐릭터 꾸미다가 시작 버튼을 잊음","캐릭터 취향 얘기도 게임의 재미로 쳐주세요 ㅋㅋ. 꾸미기 아이템 고르다 시간이 다 갈 것 같아요."],
    ["yuna","sports","야구 직관 가면 응원부터 배워도 되나요 ⚾","야구장에서 함께 응원하는 분위기가 궁금해요. 가방에 응원도구부터 넣으면 간식 자리가 없을 것 같아요 ㅎㅎ."],
    ["sua","sports","축구 직관 가방에는 뭘 먼저 넣어요","현장에서 응원가 같이 부르면 신날 것 같아요. 저는 편한 신발이랑 가벼운 가방부터 챙길 것 같아요."],
    ["minji","sports","직관 사진은 경기장파 vs 응원도구파","야구든 축구든 현장 분위기를 찍어보고 싶어요. 저는 넓은 경기장이 한눈에 들어오는 구도가 좋아요 ㅎㅎ."],
    ["arin","desk","책상 소품은 예쁜데 마우스 자리가 없음","소품 배치를 상상하다 작업 공간도 같이 챙겨야겠더라고요. 오늘은 좋아하는 색 하나만 정해볼까요 ㅎㅎ."],
    ["haru","desk","텀블러 고르다가 차를 한 잔 더 우릴 듯","보기 좋은 것도 좋지만 씻기 편한 쪽에 마음이 가요. 오래 편하게 쓰는 물건 얘기는 언제든 환영이에요."],
    ["sua","desk","책상 정리 후 물건 찾기 퀴즈 시작","깔끔함과 손 닿는 자리를 같이 잡고 싶어요. 자주 쓰는 물건 하나부터 자리 정해볼까요 ㅎㅎ."],
    ["yuna","season","새해 취미 후보, 거창하지 않아도 좋아요","새해에는 작은 취미 하나를 골라보고 싶어요. 제가 취미 설문 담당인가요?! 가벼운 후보부터 받아요 ㅎㅎ.",1],
    ["haru","season","겨울 끝자락에는 따뜻한 컵 한 표","찬 계절을 떠올리면 따뜻한 차 취향이 궁금해져요. 집에서 쉬는 시간에 어울리는 컵 얘기해요.",2],
    ["arin","season","봄 책상 색깔은 연두파 vs 분홍파","봄 기분으로 책상 포인트 색을 바꿔보고 싶어요. 작은 소품부터 상상해봐요 ㅎㅎ.",3],
    ["naeun","season","봄 산책 후보, 걷다가 쉬어도 환영","봄나들이를 계획한다면 쉬는 자리도 같이 찾아요. 꽃 구경은 각자 편한 속도로 즐기면 좋겠어요.",4],
    ["sua","season","피크닉 짐 줄이기 회의 열어요","피크닉을 간다면 가방은 가볍게 꾸리고 싶어요. 꼭 챙길 물건과 없어도 괜찮은 물건을 하나씩 골라봐요.",5],
    ["haru","season","비 오는 날을 상상하면 어떤 음악이에요","우산 챙길 계절에는 차 한 잔과 음악이 떠올라요. 빗소리랑 피아노가 같이 들리면 좋겠어요.",6],
    ["yuna","season","여름 휴가 상상 지도, 바다 vs 숲","아직 계획이 없어도 쉬고 싶은 곳 얘기는 좋아요. 저는 여행 준비물 목록부터 신나게 적을 것 같아요 ㅎㅎ.",7],
    ["minji","season","여름 방학 기분으로 영화 고르기","시원한 공간에서 보고 싶은 작품 분위기가 궁금해요. 줄거리는 비밀로 하고 취향만 얘기해요 ㅋㅋ.",8],
    ["jieun","season","가을 간식 취향에도 계산기는 쉬는 날","가을이면 떠오르는 간식 하나씩 골라봐요. 저는 따끈한 간식 앞에서는 고르는 속도가 빨라져요 ㅋㅋ.",9],
    ["arin","season","단풍 색 팔레트 vs 할로윈 소품 🍁","시월에는 단풍색이랑 작은 할로윈 소품을 상상해봐요. 주말 사진에 담고 싶은 색 한 표씩 주세요 ㅎㅎ.",10],
    ["hina","season","늦가을 간식 퀴즈, 팥파 vs 슈크림파","쌀쌀한 계절에 떠오르는 간식 취향 시험입니다. 복수 정답 인정, 서로 취향 놀리기는 살짝만 ㅋㅋ.",11],
    ["haru","season","연말 플레이리스트와 따뜻한 컵 준비","한 해 끝에는 편안하게 듣고 싶은 곡이 궁금해져요. 쉬는 시간에 어울리는 분위기를 나눠봐요.",12]
  ].map(([authorId,topic,title,body,month])=>Object.freeze({authorId,topic,title,body,month})));
  const FUN_VOICES=Object.freeze({
    hina:["이건 만점 드립인데요 ㅋㅋ","오늘은 빨간 펜 쉬는 시간이에요"],
    haru:["커피 식기 전에 공감 한 표요 ☕","편하게 즐길 수 있는 쪽이 좋아요"],
    jieun:["공감은 무료니까 아낌없이요 ㅋㅋ","계산기는 잠깐 닫고 취향만 나눠요"],
    yuna:["제가요?! 저 이거 완전 공감해요 ㅎㅎ","저도 조심스럽게 한 표 보태봅니다"],
    minji:["댓글창 자체가 짤이에요 ㅋㅋ","이 장면은 제목부터 떠오르네요"],
    arin:["취향 합격 도장 꾹 ㅎㅎ","작은 디테일 얘기라면 저도 신나요"],
    sua:["참여 완료, 준비물은 가볍게요 ㅋㅋ","바로 해볼 수 있는 쪽으로 골라볼게요"],
    naeun:["힘 빼고 즐기는 쪽에 한 표요 ㅎㅎ","편한 페이스로 같이 즐겨요"]
  });
  const FUN_PEER_LINES=Object.freeze({
    hina:"이 정도면 취향 반장 만점 드릴게요 ㅋㅋ",haru:"커피 식기 전에 취향 동아리 열겠어요 ㅎㅎ",
    jieun:"공감 예산 넉넉하게 잡으셨는데요 ㅋㅋ",yuna:"선배님 투표 속도에 저도 따라갈게요 ㅎㅎ",
    minji:"선배님 댓글에 제목 붙이고 싶어졌어요 ㅋㅋ",arin:"그 취향에 합격 도장 같이 찍어도 되죠 ㅎㅎ",
    sua:"그 한 표 접수요, 취향 회의 후속은 제가 ㅋㅋ",naeun:"그 기세 좋아요, 쉬는 시간도 같이 챙겨요 ㅎㅎ"
  });
  const FUN_TOPIC_LINES=Object.freeze({
    lunch:"저도 메뉴판 앞에서 투표가 필요해요",running:"걷기 반에도 이름 올려주세요",streaming:"스포 없이 취향만 얘기하면 저도 참여할게요",
    cafe:"주말 탐방은 분위기 고르기부터 재밌어요",snack:"야식 메뉴 상상에 저도 끼었어요",monday:"월요병 충전 버튼 저도 찾고 있어요",
    coffee:"컵 들고 취향 투표에 참여할게요",mbti:"유형보다 그 일상 장면에 공감해요",travel:"상상 여행 지도에 한 표 보탤게요",
    money:"짤은 저장했는데 실천은 다음 장면이네요",tickets:"공연 상상만 해도 준비물 목록이 떠올라요",pets:"귀여운 습관 얘기에 저도 귀 쫑긋해요",
    cooking:"간단한 메뉴와 적은 설거지에 찬성해요",games:"실수해도 웃고 다시 하는 파티 좋아요",sports:"직관 준비물 얘기부터 같이 듣고 싶어요",
    general:"저도 이 얘기에 공감해요",desk:"예쁜데 쓰기 편한 자리가 좋겠어요",season:"계절 취향 한 표씩 나누는 거 좋아요"
  });
  const sensitiveConversation=(post,source=post)=>/걱정|불안|두려|무섭|무서|겁나|겁이|공포|아프|아픔|질병|입원|병원|몸이 안|건강이 안|상실|떠나보|잃었|슬프|몸살|감기|수술|상중|부고|별세|사별|사망|장례|우울|힘들|속상|괴롭|fear|worr(?:y|ied)|afraid|scared/i.test([post?.title,post?.body,source?.body].join(" "));
  const lightConversation=(post,source=post)=>ADDRESS_RULES.casualCategories.includes(post?.category)&&!post.pinned&&!sensitiveConversation(post,source)&&!/(?:공지|업무 안내)/.test(post.title+" "+post.body);
  function funComment(authorId,topic,seed,index,peer=false){
    const voice=FUN_VOICES[authorId]||[REACTIONS[authorId]?.[2]||"저 이거 완전 공감해요 ㅋㅋ",POST_FLAVOUR[authorId]||"같이 편하게 얘기해요"];
    const short=hash(seed+":"+authorId+":"+index)%2===0;
    return short?(peer?FUN_PEER_LINES[authorId]||voice[0]:voice[0]):voice[1].replace(/[.!?]+$/,"")+". "+(peer?"그 한 표에 저도 살짝 올라탑니다":FUN_TOPIC_LINES[topic])+".";
  }
  function dailyThread(thread,source,now){
    if(!lightConversation(thread)||hash(source)%3!==0)return naturalThread(thread);
    const month=new Date(now+9*3600000).getUTCMonth()+1;
    const eligible=LOUNGE_FUN_POOL.filter(t=>(!t.month||t.month===month)&&person(t.authorId)&&personaMap()[t.authorId]);
    const seasonal=hash(source+":season")%6===0;
    const pool=eligible.filter(t=>seasonal?!!t.month:!t.month);
    if(!pool.length)return thread;
    const entry=pool[hash(source+":fun")%pool.length],members=Object.keys(FUN_VOICES).filter(id=>id!==entry.authorId&&person(id)&&personaMap()[id]);
    const start=hash(source+":comments")%members.length;
    const comments=Array.from({length:Math.min(3,members.length)},(_,i)=>{
      const authorId=members[(start+i)%members.length];
      return {authorId,body:funComment(authorId,entry.topic,source,i,i===2),replyTo:i===2?0:null,afterMin:ADDRESS_RULES.delays[i]};
    });
    return naturalThread({...thread,authorId:entry.authorId,category:"LOUNGE",title:entry.title,body:entry.body,topics:["잡담",entry.topic],comments});
  }
  function publicationThread(row){
    const original=libraryThreads().find(t=>t.id===row.libraryId);if(!original)return null;
    const projected=dailyThread(original,row.sourceEventId,Date.parse(row.scheduledAt||row.createdAt));
    // Older saved Library posts retain their original thread; only matching new projections use fun comments.
    const thread=projected.title===row.title&&projected.body===row.body&&projected.authorId===row.authorId?projected:original;
    if(lightConversation(row))return naturalThread(thread);
    return naturalThread({...thread,comments:thread.comments.map((c,i)=>({...c,body:sensitiveConversation(row)?CHAIRMAN_REPLIES.fear[i%CHAIRMAN_REPLIES.fear.length]:/ㅋㅋ|ㅎㅎ|드립|농담|\p{Extended_Pictographic}/u.test(c.body)?"차분히 확인할게요. 필요한 내용부터 함께 살펴봐요.":c.body}))});
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
      const picked=hash(source)%3===0?available.find(t=>lightConversation(t))||available[0]:available[0];
      const thread=dailyThread(picked,source,now),at=start+(8+12*slot/(limit-1))*3600000+hash(source)%40*60000;
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
    const thread=publicationThread(row);if(!thread)return [];
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
      .slice().sort((a,b)=>popularity(a,b,now)||String(b.createdAt).localeCompare(String(a.createdAt))).slice(0,3);
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
  function paintLiving(writable,now=Date.now()){
    const disabled=writable?"":" disabled",drafts=postDrafts(),replies=replyDrafts();
    const reviewing=replyMode()==="review";
    if(get("trayPanel"))get("trayPanel").hidden=!reviewing;
    if(get("replyMode")){get("replyMode").value=replyMode();get("replyMode").disabled=!writable}
    const badge=posts().filter(published).map(p=>unreadCount(p)).reduce((a,b)=>a+b,0),waiting=comments().filter(c=>c.pending&&posts().some(p=>p.id===c.postId&&published(p))).length;
    if(get("trayCount"))get("trayCount").textContent="📬 새 글 "+drafts.length+"개 도착 · 답글 미리보기 "+replies.length+"개 · 새 댓글 "+badge+" · 예약 답글 "+waiting+"개";
    html("tray",reviewing?([...drafts.map(p=>'<article class="board-draft">'+authorCard(p.authorId)+'<span class="pill">'+escape(p.category)+'</span><h4>'+escape(displayText(p,p.title))+'</h4><p class="board-body">'+escape(displayText(p,p.body))+'</p>'+interactiveMarkup(p,false)+draftButtons("post",p,disabled)+'</article>'),
      ...replies.map(c=>'<article class="board-draft">'+authorCard(c.authorId)+'<p class="sub">'+escape(publicText(posts().find(p=>p.id===c.postId)?.title))+' · '+(c.parentId?"답글":"댓글")+'</p><p class="board-body">'+escape(displayText(c,c.body))+'</p>'+draftButtons("comment",c,disabled)+'</article>')].join("")||'<p class="empty">도착한 초안을 모두 확인했어요.</p>'):"");
    html("unread",posts().filter(p=>published(p)&&unreadCount(p)).map(p=>'<button class="btn sm" type="button" data-board-open="'+escape(p.id)+'">'+escape(displayText(p,p.title))+' · 새 댓글 '+unreadCount(p)+'</button>').join(""));
    const archives=[...posts().filter(p=>p.disposition==="archived").map(p=>({...p,kind:"post"})),...comments().filter(c=>c.disposition==="archived").map(c=>({...c,kind:"comment"}))];
    html("archive",archives.map(p=>'<div class="board-draft">'+escape(publicText(p.title||p.body))+' <button class="btn sm" type="button" data-board-draft="restore" data-kind="'+p.kind+'" data-key="'+escape(p.id)+'"'+disabled+'>초안함으로</button></div>').join(""));
    html("activity",weeklyActivity().map(a=>'<span class="board-member'+(a.posts+a.comments?' is-active':'')+'" title="'+escape(author(a.id))+'">'+escape(person(a.id)?.name)+' · 글 '+a.posts+' / 댓글 '+a.comments+(a.posts+a.comments>=3?' ✨ 활발':a.posts+a.comments?' 🌱 참여':'')+'</span>').join(""));
    html("best",weeklyBest(now).map((p,i)=>'<button class="btn" type="button" data-board-open="'+escape(p.id)+'">'+(i+1)+'. '+escape(displayText(p,p.title))+' · '+displayLikes(p,now)+'</button>').join("")||'<span class="sub">이번 주 첫 이야기를 기다려요.</span>');
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
    html("previewComments",preview?preview.comments.map(c=>'<article class="board-comment">'+authorCard(c.authorId)+'<p class="board-body">'+escape(displayText(c,c.body))+'</p></article>').join(""):"");
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
    postFields,displayViews,staffReads,displayLikes,boardReaders,commentFields,relativeTime,boardDate,closePost,previewThread,postPreview,cancelPreview,ownerReactions,replyIntent,chairmanReplyIntent,chairmanReplyTopic,CHAIRMAN_TOPIC_REPLIES,CHAIRMAN_REPLIES,orderedComments,commentMarkup,stripLeadingVocative,
    ADDRESS_RULES,personaMap,personaMode,staffAddress,candidateScore,commentCandidates,selectAuthors,queueReplies,generateDaily,realEvents,refreshLiving,
    setReplyMode,replyMode,draftAction,postDrafts,replyDrafts,votePoll,toggleReaction,weeklyBest,weeklyActivity,
    attendance,unreadCount,mentionIds,dayKey,replySafetyBound});
  init();
})();
