(function(){
"use strict";

const DRAFT_KEY="hani_yuna_helpdesk_draft_v1";
const DIRECT_TARGETS=new Set(["task","book","movie","travelWish","diary"]);
const LABELS={task:"할 일",book:"책 · 독서",movie:"영화 · 드라마",travelWish:"장소",diary:"생활 기록"};
const DESTINATIONS={task:"할 일",book:"성민의 서재",movie:"시청 아카이브",travelWish:"여행 Wish · 장소",diary:"일기 · 생활 기록"};
const QUESTIONS={readingDate:"읽기 시작일이 아직 없어요. 오늘로 기록할까요?",watchedDate:"시청일은 오늘로 할까요?",season:"시즌을 정확히 확인하기 어려워요. 시즌 번호만 알려주세요.",episode:"몇 화까지 봤는지 회차만 알려주세요.",rating:"평점을 정확히 확인하기 어려워요. 평점만 알려주세요.",completedDate:"완독일이 아직 없어요. 오늘로 기록할까요?",due:"언제까지 할 일인지 알려주세요.",title:"제목만 알려주세요.",destination:"장소 이름만 알려주세요.",date:"기록 날짜가 아직 없어요. 오늘로 기록할까요?"};
const todayIso=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};
const offsetIso=days=>{const d=new Date();d.setDate(d.getDate()+days);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};
const clean=value=>String(value??"").replace(/\s+/g," ").trim();
const escapeHtml=value=>clean(value).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[ch]);
const firstMatch=(text,re,index=1)=>{const m=String(text).match(re);return m?clean(m[index]):""};
const explicitDate=text=>{const s=clean(text);if(/오늘/.test(s))return todayIso();if(/내일/.test(s))return offsetIso(1);if(/어제/.test(s))return offsetIso(-1);const iso=s.match(/(20\d{2})[.\/-](\d{1,2})[.\/-](\d{1,2})/);if(iso)return `${iso[1]}-${iso[2].padStart(2,"0")}-${iso[3].padStart(2,"0")}`;const md=s.match(/(?:^|\s)(\d{1,2})월\s*(\d{1,2})일/);if(md)return `${new Date().getFullYear()}-${md[1].padStart(2,"0")}-${md[2].padStart(2,"0")}`;return ""};
const ratingFrom=text=>{const m=String(text).match(/(?:별점|평점)?\s*(\d(?:\.\d)?)\s*점/);return m?Math.max(.1,Math.min(5,Math.round(Number(m[1])*10)/10)):null};
const placeNamePatch=text=>clean(text).replace(/^(?:장소\s*이름|장소이름|가게\s*이름|카페\s*이름|장소|이름)(?:은|는|이|가)?\s*[:：]?\s*/,"").replace(/(?:이야|야|입니다|이에요|예요)[.!]?$/g,"").trim();

function routeIntent(text){
  const s=clean(text).toLowerCase();
  if(/isa|irp|연금|증권|주식|투자|코인|펀드|계좌|자산|잔액|예수금/i.test(s))return {route:"investmentIntake",label:"자산 업데이트실",reason:"금융 기록은 YUNA가 직접 저장하지 않아요."};
  if(/가계부|지출|영수증|결제|입금|출금/i.test(s))return {route:"ledger",label:"가계부",reason:"정교하거나 대량인 가계부 입력은 전문 탭에서 확인해야 해요."};
  if(/운동|웨이트|러닝|세트|중량|심박|페이스|루틴/i.test(s))return {route:"exercise",label:"헬스클럽",reason:"정밀 운동 기록은 전문 탭에서 확인해야 해요."};
  return null;
}

function inferKind(text,hint="auto"){
  if(hint!=="auto")return hint;
  const s=clean(text);
  if(/시즌\s*\d+|\d+\s*화|봤어|봤다|시청|드라마|영화|애니|다큐|예능/.test(s))return "movie";
  if(/읽기\s*시작|읽고\s*있|완독|책|도서|독서/.test(s))return "book";
  if(/맛집|카페|식당|명소|장소|다녀왔|방문했|가보고/.test(s))return "travelWish";
  if(/기록해|메모해|오늘은|기분/.test(s))return "diary";
  return "task";
}

function parseMovie(text){
  const s=clean(text),season=firstMatch(s,/시즌\s*(\d+)/),episode=firstMatch(s,/(\d+)\s*화(?:까지)?/),rating=ratingFrom(s),watchedDate=explicitDate(s);
  let title=s.replace(/(?:오늘|어제)\s*/g,"").replace(/(?:별점|평점)?\s*\d(?:\.\d)?\s*점[.!]?/g,"").replace(/시즌\s*\d+/g,"").replace(/\d+\s*화(?:까지)?/g,"").replace(/(?:영화|드라마|애니|시리즈)?\s*(?:을|를)?\s*(?:봤어|봤다|봤음|시청했어|시청했다).*$/g,"").replace(/[.!]+$/g,"").trim();
  title=title.replace(/^(?:넷플릭스|티빙|왓챠|웨이브|디즈니\+?)\s*/i,"").trim();
  const data={status:"watched",contentType:season||episode?"시리즈":/드라마/.test(s)?"드라마":"영화",origin:"",title,director:"",actors:"",rating,watchedDate,review:[season&&`시즌 ${season}`,episode&&`${episode}화까지`].filter(Boolean).join(" · ")};
  return {target:"movie",data,entities:{season,episode},missing:[!title&&"title",!watchedDate&&"watchedDate"].filter(Boolean)};
}

function parseBook(text){
  const s=clean(text),completed=/완독|다\s*읽/.test(s),date=explicitDate(s);
  let title=s.replace(/(?:오늘|어제)\s*/g,"").replace(/(?:이라는|라는)?\s*(?:책|도서)?\s*(?:을|를)?\s*(?:읽기\s*시작했어|읽기\s*시작했다|읽기\s*시작|읽고\s*있어|완독했어|완독했다|다\s*읽었어|다\s*읽었다).*$/g,"").replace(/[.!]+$/g,"").trim();
  const data={status:completed?"read":"wish",title,author:"",topic:"교양",rating:ratingFrom(s),completedDate:completed?date:"",review:completed?"":"읽기 시작"};
  return {target:"book",data,entities:{readingDate:date},missing:[!title&&"title",!date&&(completed?"completedDate":"readingDate")].filter(Boolean)};
}

function parseTask(text){
  const s=clean(text),date=explicitDate(s),daypart=/오전/.test(s)?"오전":/오후/.test(s)?"오후":/저녁/.test(s)?"저녁":"";
  const label=s.replace(/^(?:오늘|내일|모레)\s*(?:오전|오후|저녁)?\s*까지\s*/g,"").replace(/(?:까지|해야\s*해|해줘)[.!]?$/g,"").trim();
  return {target:"task",data:{text:label,due:date,done:false},entities:{daypart},missing:[!label&&"title",!date&&"due"].filter(Boolean)};
}

function parsePlace(text){
  const s=clean(text),date=explicitDate(s);
  const type=/카페/.test(s)?"카페":/맛집|식당/.test(s)?"맛집":/명소/.test(s)?"명소":"장소";
  const quoted=firstMatch(s,/["“']([^"”']{1,80})["”']/),named=firstMatch(s,/(?:^|\s)([^\s"“']{1,40}?)(?:이란|란|이라는|라는)\s*(?:카페|맛집|식당|명소|장소)/);
  const location=firstMatch(s,/^(?:오늘|어제|내일)?\s*([^\s"“']{1,24}?)(?:에|에서)\s*(?=["“']|[^\s]+(?:이란|란|이라는|라는)\s*(?:카페|맛집|식당|명소|장소))/);
  let destination=quoted||named;
  if(!destination){
    const direct=s.match(/^(?:와\s*)?(?:여기\s*)?(.+?)\s*(?:맛집|카페|식당|명소|장소)(?:에)?\s*(?:다녀왔어|다녀왔다|방문했어|방문했다|가보고\s*싶어|등록해줘|기록해줘)/);
    destination=clean(direct?.[1]||"").replace(/^(?:오늘|어제|내일)\s*/,"");
    if(/^(?:여기|거기|저기)|맛있|좋다|좋네|좋아|ㅋㅋ|ㅎㅎ/.test(destination))destination="";
  }
  const impression=firstMatch(s,/(분위기[^?!.]*(?:좋\w*|예쁘\w*|멋지\w*)|맛있\w*|또\s*가고\s*싶\w*)/);
  const visited=/다녀왔|방문했|맛있/.test(s),reason=impression||(`${type} ${visited?"방문":"저장"}`);
  return {target:"travelWish",data:{destination,reason,expectedDate:date,transport:"",places:[location,destination].filter(Boolean).join(" · "),foods:"",restaurants:/맛집|카페|식당/.test(s)?destination:"",lodging:"",note:impression,itinerary:[]},entities:{location,type,visited},missing:[!destination&&"destination"].filter(Boolean)};
}

function parseDiary(text){
  const s=clean(text),date=explicitDate(s),title=s.length>28?s.slice(0,28)+"…":s;
  return {target:"diary",data:{date,mood:"neutral",title,content:s},missing:[!s&&"title",!date&&"date"].filter(Boolean)};
}

function parse(text,hint="auto"){
  const route=routeIntent(text);if(route)return {mode:"route",...route,source:clean(text)};
  const kind=inferKind(text,hint),draft=kind==="movie"?parseMovie(text):kind==="book"?parseBook(text):kind==="travelWish"?parsePlace(text):kind==="diary"?parseDiary(text):parseTask(text);
  return {mode:"draft",source:clean(text),...draft};
}

function hydrateMissing(draft,answer){
  if(!draft?.missing?.length)return draft;
  const field=draft.missing[0],value=clean(answer),yes=/^(?:응|네|예|좋아|그래|오늘|오늘로)(?:요)?[.!]?$/.test(value);
  if(field==="watchedDate")draft.data.watchedDate=yes?todayIso():explicitDate(value);
  else if(field==="season"){const season=firstMatch(value,/(\d+)/);if(!season)return draft;draft.entities=draft.entities||{};draft.entities.season=season;draft.data.contentType="시리즈";draft.data.review=[`시즌 ${season}`,draft.entities.episode&&`${draft.entities.episode}화까지`].filter(Boolean).join(" · ");}
  else if(field==="episode"){const episode=firstMatch(value,/(\d+)/);if(!episode)return draft;draft.entities=draft.entities||{};draft.entities.episode=episode;draft.data.contentType="시리즈";draft.data.review=[draft.entities.season&&`시즌 ${draft.entities.season}`,`${episode}화까지`].filter(Boolean).join(" · ");}
  else if(field==="rating"){const rating=ratingFrom(value)||(/^\d(?:\.\d)?$/.test(value)?Number(value):null);if(!(rating>=.1&&rating<=5))return draft;draft.data.rating=Math.round(rating*10)/10;}
  else if(field==="readingDate"){draft.entities=draft.entities||{};draft.entities.readingDate=yes?todayIso():explicitDate(value);if(!draft.entities.readingDate)return draft;}
  else if(field==="completedDate")draft.data.completedDate=yes?todayIso():explicitDate(value);
  else if(field==="date")draft.data.date=yes?todayIso():explicitDate(value);
  else if(field==="due")draft.data.due=yes?todayIso():explicitDate(value);
  else if(field==="title"){if(draft.target==="task")draft.data.text=value;else draft.data.title=value;}
  else if(field==="destination"){
    draft.data.destination=placeNamePatch(value)||value;
    if(draft.data.restaurants!==undefined)draft.data.restaurants=draft.data.destination;
  }
  if((field==="watchedDate"&&!draft.data.watchedDate)||(field==="completedDate"&&!draft.data.completedDate)||(field==="date"&&!draft.data.date)||(field==="due"&&!draft.data.due))return draft;
  draft.missing.shift();return draft;
}

let model={messages:[],draft:null,input:"",category:"auto",status:"대기 중",image:null,resume:null};
let root=null;

function serializable(){return {messages:model.messages,draft:model.draft,input:model.input,category:model.category,status:model.status,savedAt:new Date().toISOString()}}
function persist(){if(model.resume)return;try{if(model.draft||model.input||model.messages.some(m=>m.role==="user"))sessionStorage.setItem(DRAFT_KEY,JSON.stringify(serializable()));else sessionStorage.removeItem(DRAFT_KEY)}catch(e){console.warn("YUNA draft persistence",e)}}
function loadPersisted(){try{const raw=sessionStorage.getItem(DRAFT_KEY);if(!raw)return null;const data=JSON.parse(raw);return data?.draft||data?.input||data?.messages?.length?data:null}catch(e){return null}}
function say(role,text){model.messages.push({role,text:clean(text),at:new Date().toISOString()});model.messages=model.messages.slice(-20)}

function heroMarkup(){return `<div class="yuna-hero"><div class="yuna-hero-copy"><span class="yuna-eyebrow">YUNA HELPDESK</span><h2>유나 인포데스크</h2><p>말하거나 자료를 올리면 필요한 정보만 확인하고 저장 전 Preview를 준비합니다.</p></div><div class="yuna-hero-visual"><div class="yuna-avatar yuna-avatar-lg" aria-hidden="true"></div><span>말씀해 주세요.<br>저장 전 꼭 보여드릴게요.</span></div></div>`}
function deskMarkup(){return `<div class="yuna-desk"><header class="yuna-mobile-head"><div class="yuna-avatar"></div><div><b>유나 인포데스크</b><span>${escapeHtml(model.status)}</span></div><button type="button" class="yuna-new" id="yunaMobileNew">새 접수</button></header><div class="yuna-workspace"><div class="yuna-workspace-head"><div><span>QUICK DESK</span><h3>유나에게 무엇을 맡길까요?</h3></div><span class="yuna-status">${escapeHtml(model.status)}</span></div><div class="yuna-conversation" id="yunaConversation" aria-live="polite"></div><div class="yuna-chips" aria-label="빠른 기록 유형">${[["task","할 일"],["book","책"],["movie","시청"],["travelWish","장소"],["diary","기록"]].map(([v,l])=>`<button type="button" data-yuna-kind="${v}" class="${model.category===v?"is-active":""}">${l}</button>`).join("")}</div><div class="yuna-category-row"><label for="yunaCategory">분류</label><select id="yunaCategory"><option value="auto">유나가 자동 분류</option><option value="task">할 일</option><option value="book">책 · 독서</option><option value="movie">영화 · 드라마</option><option value="travelWish">장소</option><option value="diary">생활 기록</option></select><button type="button" class="yuna-new" id="yunaNew">새 접수</button></div></div><div class="yuna-composer"><button type="button" class="yuna-plus" id="yunaPlus" aria-label="첨부 메뉴">+</button><label class="yuna-photo" aria-label="사진 첨부">사진<input id="yunaFile" type="file" accept="image/png,image/jpeg,image/webp" hidden></label><textarea id="yunaInput" rows="1" placeholder="말하거나 입력" aria-label="유나에게 말하거나 입력"></textarea><button type="button" class="yuna-voice" id="yunaVoice" aria-label="음성 입력" hidden>음성</button><button type="button" class="yuna-send" id="yunaSend"><span class="yuna-desktop-label">유나에게 맡기기</span><span class="yuna-mobile-label">전송</span></button></div></div>`}
function previewMarkup(draft){const d=draft.data,rows=draft.target==="movie"?[["제목",d.title],["진행",[d.review,d.rating!=null?`${d.rating}점`:""].filter(Boolean).join(" · ")],["시청일",d.watchedDate]]:draft.target==="book"?[["제목",d.title],["상태",d.status==="read"?"완독":"읽기 시작"],["기록일",draft.entities?.readingDate||d.completedDate]]:draft.target==="task"?[["할 일",d.text],["기한",[d.due,draft.entities?.daypart].filter(Boolean).join(" · ")]]:draft.target==="travelWish"?[["장소",d.destination],["지역",draft.entities?.location],["유형",draft.entities?.type],["메모",d.reason],["평점",d.rating!=null?`${d.rating}점`:""],["방문일",d.expectedDate]]:[["제목",d.title],["날짜",d.date]];return `<article class="yuna-preview"><div class="yuna-preview-top"><span>YUNA PREVIEW</span><b>${escapeHtml(LABELS[draft.target])}</b></div><div class="yuna-preview-fields">${rows.filter(x=>x[1]!==null&&x[1]!==undefined&&x[1]!=="").map(([k,v])=>`<div><span>${escapeHtml(k)}</span><b>${escapeHtml(v)}</b></div>`).join("")}</div><div class="yuna-preview-destination"><span>저장 위치</span><b>${escapeHtml(DESTINATIONS[draft.target])}</b></div><div class="yuna-preview-actions"><button type="button" id="yunaEdit">수정</button><button type="button" class="is-primary" id="yunaSave">저장하기</button></div></article>`}
function renderConversation(){const box=root?.querySelector("#yunaConversation");if(!box)return;let html=model.resume?`<div class="yuna-resume"><b>아까 하던 기록이 있어요. 이어서 할까요?</b><div><button id="yunaResume">계속하기</button><button id="yunaRestart">새로 시작</button></div></div>`:"";html+=model.messages.map((m,i)=>`<div class="yuna-message ${m.role}">${m.role==="yuna"&&(i===0||model.messages[i-1]?.role!=="yuna")?'<div class="yuna-avatar"></div>':m.role==="yuna"?'<span class="yuna-avatar-spacer"></span>':""}<div class="yuna-bubble">${escapeHtml(m.text)}</div></div>`).join("");if(model.image)html+=`<div class="yuna-file-pill"><span>사진</span><b>${escapeHtml(model.image.name)}</b><button id="yunaRemoveImage" type="button">삭제</button></div>`;if(model.draft?.mode==="route")html+=`<article class="yuna-route"><span>전문 탭에서 이어가기</span><h4>${escapeHtml(model.draft.label)}</h4><p>${escapeHtml(model.draft.reason)}</p><button type="button" id="yunaRoute">${escapeHtml(model.draft.label)} 열기</button></article>`;else if(model.draft&&!model.draft.missing.length)html+=previewMarkup(model.draft);if(!html)html=`<div class="yuna-welcome"><div class="yuna-avatar"></div><div><b>안녕하세요, 유나예요.</b><p>할 일이나 본 작품, 읽은 책, 장소와 생활 기록을 편하게 말해 주세요. 필요한 것만 다시 여쭤볼게요.</p></div></div>`;box.innerHTML=html;box.scrollTop=box.scrollHeight;bindDynamic();applyAvatar()}
function render(){if(!root)return;root.innerHTML=heroMarkup()+deskMarkup();root.querySelector("#yunaCategory").value=model.category;root.querySelector("#yunaInput").value=model.input||"";applyAvatar();bindStatic();renderConversation()}
function applyAvatar(){const image=typeof sidebarAgentImages!=="undefined"?sidebarAgentImages.yuna:"";root?.querySelectorAll(".yuna-avatar").forEach(el=>{if(image)el.style.backgroundImage=`url('${image}')`})}

function askNext(){if(!model.draft?.missing?.length)return;const field=model.draft.missing[0];model.status="확인 필요";say("yuna",QUESTIONS[field]||"이 값만 알려주세요.")}
function patchPlaceDraft(d,text){const rating=ratingFrom(text),date=explicitDate(text),m=clean(text).match(/^(장소(?:\s*이름)?|장소이름|가게\s*이름|카페\s*이름|이름|지역|유형|메모|평점|방문일)(?:은|는|이|가|을|를)?\s*[:：]?\s*(.+)$/);if(!m)return false;const field=m[1].replace(/\s/g,""),v=clean(m[2]);d.entities=d.entities||{};if(/^(장소|장소이름|가게이름|카페이름|이름)$/.test(field)){d.data.destination=placeNamePatch(text);d.data.restaurants=d.data.destination}else if(field==="지역"){d.entities.location=v;d.data.places=[v,d.data.destination].filter(Boolean).join(" · ")}else if(field==="유형")d.entities.type=v;else if(field==="메모"){d.data.reason=v;d.data.note=v}else if(field==="평점"&&rating!==null)d.data.rating=rating;else if(field==="방문일"&&date)d.data.expectedDate=date;else return false;return true}
function editDraft(text){
 const d=model.draft,isPlace=d.target==="travelWish",rating=ratingFrom(text),date=explicitDate(text),title=firstMatch(text,/제목(?:은|을)?\s*[:：]?\s*(.+)/);
 const placeChanged=isPlace&&patchPlaceDraft(d,text);
 if(rating!==null&&(d.target==="movie"||d.target==="book"))d.data.rating=rating;
 if(date&&!isPlace){if(d.target==="movie")d.data.watchedDate=date;else if(d.target==="book"&&d.data.status!=="read"){d.entities=d.entities||{};d.entities.readingDate=date;}else d.data[d.target==="book"?"completedDate":d.target==="task"?"due":"date"]=date;}
 if(title&&d.target!=="travelWish"){d.data[d.target==="task"?"text":"title"]=title;}
 const changed=isPlace?placeChanged:rating!==null||date||title,help=d.target==="travelWish"?"장소 이름·지역·유형·방문일·메모·평점 중 바꿀 부분을 알려주세요.":d.target==="task"?"할 일이나 기한 중 바꿀 부분을 알려주세요.":d.target==="diary"?"제목·날짜·내용 중 바꿀 부분을 알려주세요.":"제목·날짜·평점 중 바꿀 부분을 알려주세요.";
 say("yuna",changed?"바꾼 내용을 Preview에 반영했어요.":`수정할 필드를 확인하기 어려워요. ${help}`);
}
function submitText(){const input=root.querySelector("#yunaInput"),text=clean(input.value);if(model.resume||model.status==="유나 분석 중"||(!text&&!model.image))return;if(text){say("user",text);model.input=""}model.status="유나 분석 중";if(routeIntent(text)){model.draft=parse(text);model.editing=false;model.status="확인 필요";say("yuna","전문 탭을 열어 확인할 수 있어요. 입력 내용은 이곳에 남겨둘게요.");persist();render();return;}if(model.editing&&model.draft?.mode==="draft"){editDraft(text);model.editing=false;model.status=model.draft.missing.length?"확인 필요":"Preview 준비 완료";persist();render();return;}if(model.draft?.mode==="draft"&&model.draft.missing.length&&text){hydrateMissing(model.draft,text);if(model.draft.missing.length)askNext();else{model.status="Preview 준비 완료";say("yuna","말씀해 주신 내용까지 반영했어요. 저장 전 Preview를 확인해 주세요.")}}else if(model.image){analyzeImage(text);return}else{model.draft=parse(text,model.category);if(model.draft.mode==="route"){model.status="확인 필요";say("yuna",`${model.draft.label}에서 안전하게 이어갈게요. 직접 저장하지 않았습니다.`)}else if(model.draft.missing.length)askNext();else{model.status="Preview 준비 완료";say("yuna","필요한 정보가 모두 있어요. 저장 전 Preview를 확인해 주세요.")}}persist();render()}

function visionDraft(extraction,userText="",hint="auto"){
  const confidence=Number(extraction?.confidence),warnings=Array.isArray(extraction?.warnings)?extraction.warnings:[];
  let items=[];try{const parsed=JSON.parse(clean(extraction?.structured_json)||"[]");items=Array.isArray(parsed)?parsed:[parsed]}catch(_){items=[]}
  const item=items.find(Boolean),payload=item?.data&&typeof item.data==="object"?item.data:item;
  const target=clean(item?.target||item?.type||extraction?.target_hint||hint),aliases={media:"movie",film:"movie",series:"movie",reading:"book",place:"travelWish"},kind=aliases[target]||target;
  if(extraction?.financial_detected)return {mode:"route",...routeIntent(userText||clean(extraction?.extracted_text)||"자산 업데이트")};
  if(!payload||!Number.isFinite(confidence)||confidence<.65)return null;
  if(kind==="movie"){
    const title=clean(payload.title||payload.name),season=clean(payload.season||payload.season_number),episode=clean(payload.episode||payload.episode_number),ratingText=clean(payload.rating),rawRating=ratingText===""?NaN:Number(ratingText),rating=Number.isFinite(rawRating)?Math.max(.1,Math.min(5,Math.round(rawRating*10)/10)):ratingFrom(ratingText),watchedDate=explicitDate(clean(payload.watchedDate||payload.watched_date||payload.date));
    if(!title)return null;
    const warningText=warnings.map(clean).join(" ").toLowerCase(),uncertain=field=>warningText.includes(field)||({season:/시즌/,episode:/회차|에피소드|\d+화/,rating:/평점|별점/}[field]||/$^/).test(warningText);
    return {mode:"draft",source:"VISION",target:"movie",data:{status:"watched",contentType:clean(payload.contentType||payload.content_type)||(season||episode?"시리즈":"영화"),origin:"",title,director:"",actors:"",rating,watchedDate,review:[season&&`시즌 ${season}`,episode&&`${episode}화까지`].filter(Boolean).join(" · ")},entities:{season,episode},missing:[uncertain("season")&&!season&&"season",uncertain("episode")&&!episode&&"episode",uncertain("rating")&&rating===null&&"rating",!watchedDate&&"watchedDate"].filter(Boolean),vision:{confidence,warnings}};
  }
  const evidence=clean(extraction?.extracted_text);return evidence?parse([evidence,userText].filter(Boolean).join(" "),kind||hint):null;
}

async function analyzeImage(userText){
  const file=model.image;model.status="유나 분석 중";render();
  try{
    const imageDataUrl=await intakeImageToDataUrl(file),result=await agentApi("extract_intake_image",{image_data_url:imageDataUrl,target_hint:model.category,file_name:file.name}),extraction=agentObj(result.extraction);
    model.image=null;model.draft=visionDraft(extraction,userText,model.category);
    if(!model.draft){model.status="확인 필요";say("yuna","사진 내용을 정확히 확인하기 어려워요. 확인이 필요한 종류와 이름만 텍스트로 알려주세요.");}
    else if(model.draft.mode==="route"){model.status="확인 필요";say("yuna",model.draft.reason||"전문 탭에서 안전하게 이어갈게요. 직접 저장하지 않았습니다.");}
    else if(model.draft.missing.length){model.status="확인 필요";say("yuna","사진에서 확실히 읽은 값은 유지했어요.");askNext();}
    else {model.status="Preview 준비 완료";say("yuna","사진에서 확실히 읽은 내용으로 Preview를 준비했어요.");}
  }catch(e){model.image=null;model.draft=userText?parse(userText,model.category):null;model.status="확인 필요";say("yuna","사진 내용을 정확히 확인하기 어려워요. 필요한 최소 정보만 텍스트로 알려주세요.");if(model.draft?.mode==="draft"&&model.draft.missing.length)askNext();console.warn("YUNA Vision",e)}
  persist();render();
}

function saveData(draft){
  const data=structuredClone(draft.data);
  if(draft.target==="book"&&data.status!=="read"){
    data.completedDate="";
    data.review=[draft.entities?.readingDate&&("읽기 시작일: "+draft.entities.readingDate),data.review].filter(Boolean).join("\n");
  }
  if(draft.target==="task"&&draft.entities?.daypart)data.text+=" · "+draft.entities.daypart+"까지";
  return data;
}
function saveApproved(){if(model.editing)return;if(model.resume||!model.draft||model.draft.mode!=="draft"||model.draft.missing.length||!DIRECT_TARGETS.has(model.draft.target))return;const row={target:model.draft.target,data:saveData(model.draft),selected:true,blocker:intakeBlockerInfo(model.draft.target,model.draft.data),duplicate:intakeDuplicateInfo(model.draft.target,model.draft.data)};if(row.blocker)return alert(row.blocker);if(row.duplicate)return alert(`이미 같은 기록이 있어요: ${row.duplicate}`);const previous=structuredClone(state);try{intakeApplyRow(row);const ok=commit(`유나 인포데스크에서 ${LABELS[row.target]} 기록을 저장했습니다.`);if(!ok)throw new Error("저장 검증을 통과하지 못했습니다.");model={messages:[{role:"yuna",text:"저장했어요. 다음 기록도 편하게 말씀해 주세요.",at:new Date().toISOString()}],draft:null,input:"",category:"auto",status:"대기 중",image:null,resume:null};persist();render()}catch(e){state=previous;renderAll();alert(e?.message||String(e))}}
function openRoute(){const id=model.draft?.route;if(!id)return;showView(id)}
function clearAll(){model={messages:[],draft:null,input:"",category:"auto",status:"대기 중",image:null,resume:null};persist();render()}

function bindDynamic(){root.querySelector("#yunaSave")?.addEventListener("click",saveApproved);root.querySelector("#yunaEdit")?.addEventListener("click",()=>{model.editing=true;model.input="";model.status="수정 중";const help=model.draft?.target==="travelWish"?"예: 장소 이름은 루프트리, 지역은 하남, 메모는 분위기 좋음":"예: 평점 4점, 날짜 어제, 제목 셜록";say("yuna",`바꿀 부분만 알려주세요. ${help}`);persist();render();root.querySelector("#yunaInput")?.focus()});root.querySelector("#yunaRoute")?.addEventListener("click",openRoute);root.querySelector("#yunaRemoveImage")?.addEventListener("click",()=>{model.image=null;persist();render()});root.querySelector("#yunaResume")?.addEventListener("click",()=>{Object.assign(model,model.resume,{resume:null});render()});root.querySelector("#yunaRestart")?.addEventListener("click",clearAll)}
function bindStatic(){const input=root.querySelector("#yunaInput");input.addEventListener("input",()=>{model.input=input.value;input.style.height="auto";input.style.height=Math.min(112,input.scrollHeight)+"px";persist()});input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey&&!e.isComposing){e.preventDefault();submitText()}});root.querySelector("#yunaSend").addEventListener("click",submitText);root.querySelector("#yunaNew").addEventListener("click",clearAll);root.querySelector("#yunaMobileNew").addEventListener("click",clearAll);root.querySelector("#yunaCategory").addEventListener("change",e=>{model.category=e.target.value;persist();render()});root.querySelectorAll("[data-yuna-kind]").forEach(btn=>btn.addEventListener("click",()=>{model.category=btn.dataset.yunaKind;persist();render();root.querySelector("#yunaInput")?.focus()}));root.querySelector("#yunaFile").addEventListener("change",e=>{const file=e.target.files?.[0];if(!file)return;if(!/^image\/(png|jpeg|webp)$/i.test(file.type)||file.size>12*1024*1024)return alert("PNG·JPG·WEBP, 12MB 이하 이미지만 올릴 수 있어요.");model.image=file;model.status="사진 준비됨";render()});root.querySelector("#yunaPlus").addEventListener("click",()=>root.querySelector("#yunaFile").click());if("webkitSpeechRecognition" in window||"SpeechRecognition" in window){const voice=root.querySelector("#yunaVoice");voice.hidden=false;voice.addEventListener("click",startVoice)}}
function startVoice(){const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;if(!Recognition)return;const r=new Recognition();r.lang="ko-KR";r.interimResults=false;r.onresult=e=>{const input=root.querySelector("#yunaInput");input.value=clean(`${input.value} ${e.results[0][0].transcript}`);model.input=input.value;persist()};r.onerror=()=>say("yuna","음성을 정확히 듣지 못했어요. 텍스트로 입력해 주세요.");r.start()}

function init(){if(root)return;root=document.getElementById("intake");if(!root)return;root.classList.add("yuna-helpdesk");const nav=document.querySelector('[data-view="intake"] .txt');if(nav)nav.textContent="유나 인포데스크";const saved=loadPersisted();if(saved)model.resume=saved;render();if(window.visualViewport){const adjust=()=>{const v=window.visualViewport;root.style.setProperty("--yuna-keyboard",Math.max(0,window.innerHeight-v.height-v.offsetTop)+"px");};window.visualViewport.addEventListener("resize",adjust);window.visualViewport.addEventListener("scroll",adjust);adjust();}}

window.HANI_YUNA_HELPDESK={parse,hydrateMissing,patchPlaceDraft,routeIntent,saveData,visionDraft,getDraftKey:()=>DRAFT_KEY,init};
init();
})();
