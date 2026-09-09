
"use strict";
const VERSION="2.9.15-safe-baseline-bootstrap";
const STORAGE_KEY="hani_os_life_v23";
const DEFAULT_CLOUD_URL="https://qmgikfdwjzmhkwadycxk.supabase.co";
const DEFAULT_CLOUD_PUBLISHABLE_KEY="sb_publishable_Z0YkkRSJIo5hs00YNcMOdQ__PA5BAj5";
const INVESTMENT_BASELINE_RESET_KEY="hani_os_investment_baseline_reset_v250_rc23";
const INVESTMENT_NEWS_CACHE_KEY="hani_investment_news_cache_v3";
const INVESTMENT_NEWS_SOCIAL_KEY="hani_investment_news_social_v2";
const INVESTMENT_NEWS_ARCHIVE_FUNCTION="hani-newsroom-publisher";
const INVESTMENT_NEWS_ARCHIVE_LIMIT=500;
const INVESTMENT_NEWS_TTL_MS=3*60*60*1000;
const INVESTMENT_NEWS_MAX_TARGETS=5;
const THEME_KEY="h22th"; // legacy dark-mode key
const SEASON_THEME_KEY="hani_os_season_theme_v1";
const SIDEBAR_KEY="hani_os_sidebar_mini";
const CLOUD_CONFIG_KEY="hani_os_cloud_config_v1";
const HANI_GATE_SESSION_KEY="hani_os_gate_session_v2";
const CLOUD_META_KEY="hani_os_cloud_meta_v1";
const CLOUD_HASH_SCHEMA=4; // deterministic durable-data fingerprint schema
const CLOUD_SYNC_ENGINE=5; // v2.9.14: fail-closed revision sync core
const CLOUD_SAFETY_KEY="hani_os_cloud_safety_snapshot_v1";
const CLOUD_EMERGENCY_RESOLVED_KEY="hani_os_emergency_recovery_resolved_v2913";
const CLOUD_EMERGENCY_PRE_RESTORE_KEY="hani_os_emergency_before_restore_v2913";
const CLOUD_EMERGENCY_RESTORED_KEY="hani_os_emergency_investment_restored_v2913";
let cloudClient=null;
let cloudUser=null;
let cloudRuntime={status:"설정 필요",tone:"warn",message:"Cloud 설정을 입력하면 연결을 준비합니다.",revision:null,updatedAt:"",verifiedAt:"",device:"",sync:"OFF"};
let cloudAutoSyncReady=false;
let cloudApplyingRemote=false;
let cloudSyncBusy=false;
let cloudSyncPending=false;
let cloudSyncTimer=null;
let cloudPollTimer=null;
let cloudLifecycleBound=false;
let cloudRecoveryMode=false;
let cloudAuthSubscription=null;
let loginGateUnlocked=false;
let loginGateCharacterKey="";
// Auth callback은 showView()가 hash를 정리하기 전에 반드시 보존한다.
// 토큰 문자열 자체를 별도 저장하지 않고, callback 종류/존재 여부만 메모리에 보존한다.
const CLOUD_AUTH_BOOT=(()=>{
  try{
    const u=new URL(location.href),q=u.searchParams,h=new URLSearchParams(String(u.hash||"").replace(/^#/,""));
    return {
      type:h.get("type")||q.get("type")||"",
      code:q.get("code")||"",
      flowId:q.get("sb_flow_id")||"",
      error:h.get("error_description")||q.get("error_description")||h.get("error")||q.get("error")||"",
      errorCode:h.get("error_code")||q.get("error_code")||"",
      hasAccessToken:!!h.get("access_token"),
      hasRefreshToken:!!h.get("refresh_token"),
      hasAuthCallback:!!(h.get("access_token")||h.get("refresh_token")||h.get("type")||q.get("code")||q.get("type")||h.get("error")||q.get("error")||h.get("error_description")||q.get("error_description"))
    };
  }catch(e){return {type:"",code:"",flowId:"",error:"",errorCode:"",hasAccessToken:false,hasRefreshToken:false,hasAuthCallback:false}}
})();
const $=id=>document.getElementById(id);
const uid=()=>crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);
const n=v=>{if(typeof v==="number")return Number.isFinite(v)?v:0;const cleaned=String(v??"").replace(/[,₩원\s]/g,"");const x=Number(cleaned||0);return Number.isFinite(x)?x:0};
const won=v=>Math.round(n(v)).toLocaleString("ko-KR")+"원";
const num=v=>n(v).toLocaleString("ko-KR",{maximumFractionDigits:4});
const pct=v=>Number.isFinite(v)?v.toFixed(2)+"%":"-";
const mask=v=>{const s=String(v||"");return s? (s.length>8?s.slice(0,4)+"-****-"+s.slice(-4):s):"계좌번호 미등록"};
const esc=s=>String(s??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
const today=()=>{const d=new Date(),y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0");return `${y}-${m}-${day}`};
const optionalNumber=v=>{if(v===null||v===undefined||String(v).trim()==="")return null;const x=Number(String(v).replace(/[,₩원\s]/g,""));return Number.isFinite(x)&&x>0?x:null};
function compressImage(file,maxW=420,maxH=600,quality=.76){return new Promise((resolve,reject)=>{if(!file)return resolve("");if(file.size>10*1024*1024)return reject(new Error("이미지는 10MB 이하만 사용할 수 있습니다."));const reader=new FileReader();reader.onerror=()=>reject(new Error("이미지를 읽지 못했습니다."));reader.onload=()=>{const img=new Image();img.onerror=()=>reject(new Error("이미지 형식을 확인해주세요."));img.onload=()=>{const scale=Math.min(1,maxW/img.width,maxH/img.height),w=Math.max(1,Math.round(img.width*scale)),h=Math.max(1,Math.round(img.height*scale)),canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;canvas.getContext("2d").drawImage(img,0,0,w,h);resolve(canvas.toDataURL("image/jpeg",quality))};img.src=reader.result};reader.readAsDataURL(file)})}

const seedAccounts=[
  {id:"isa",name:"ISA",type:"중개형 ISA",broker:"키움증권",number:"6699-7655",openingCash:0},
  {id:"pension",name:"연금",type:"연금저축",broker:"키움증권",number:"6703-9356",openingCash:0},
  {id:"irp",name:"IRP",type:"개인형 IRP",broker:"키움증권",number:"6705-6199",openingCash:0},
  {id:"brokerage",name:"위탁",type:"위탁종합",broker:"키움증권",number:"6699-7639",openingCash:0},
  {id:"toss",name:"토스",type:"미국투자용",broker:"토스증권",number:"136-01-003374",openingCash:0}
];
const SERIES_COLORS={total:"#7569e8",isa:"#4285f4",pension:"#2faa77",irp:"#ef9d3c",brokerage:"#58bce8",toss:"#8b63dc"};
const EXTRA_SERIES_COLORS=["#dc6279","#00a6a6","#a66b3d","#607d8b","#d65db1","#6f8f3d"];
function seriesColor(id){
  if(SERIES_COLORS[id])return SERIES_COLORS[id];
  const idx=Math.max(0,state?.accounts?.findIndex(a=>a.id===id)??0);
  return EXTRA_SERIES_COLORS[idx%EXTRA_SERIES_COLORS.length];
}
const freshState=()=>({
  version:VERSION,
  accounts:structuredClone(seedAccounts),
  instruments:[],transactions:[],snapshots:[],investmentMonthlySnapshots:[],investmentBrokerSnapshots:[],investmentCashFlows:[],investmentJournal:[],investmentWatchlist:[],ledgerMonths:[],spendReviews:[],body:[],exercise:[],cardio:[],strength:[],books:[],movies:[],diaries:[],tasks:[],campusSemesters:[],travelTrips:[],travelWishlist:[],certificates:[],wishlistItems:[],learningProjects:[],learningQuizzes:[],learningWrongAnswers:[],
  profile:{heightCm:188},
  goals:{investment:100000000,weight1:110,weight2:100,reading:30,readingAnnual:30,readingMonthly:2},
  calendarUrl:"",
  pageNotes:{},
  meta:{lastSavedAt:"",lastBackupAt:"",lastImportAt:""},
  ui:{
    series:["total",...seedAccounts.map(a=>a.id)],
    bodySeries:["weight","fat","muscle","bmi","fatMass"],
    bodyMetric:"weight",bodyPeriod:"year",exercisePeriod:"year",
    readingSort:"recent",readingMinRating:0,readingSearch:"",
    movieSort:"recent",movieMinRating:0,movieSearch:"",movieTypeFilter:"all",
    diarySort:"newest",diarySearch:"",ledgerMonth:monthKeyNow(),spendReviewFilter:"all",spendReviewSearch:"",spendReviewMonth:"all",monthlyHistoryMode:"all",brokerHistoryMode:"all",flowMonthFilter:monthKeyNow(),journalFilter:"all",journalSearch:"",watchlistFilter:"all",watchlistSearch:"",investmentNewsEntity:"all",investmentNewsGrade:"all",investmentNewsSentiment:"all",wishlistFilter:"all",wishlistKindFilter:"all",wishlistSearch:"",latestHoldingAccount:"all",campusActiveSemesterId:"",travelTab:"trips"
  }
});
let lastLoadError="";
let lastSaveResult={ok:true,message:"저장 전"};
let state=loadState();
let activeAccountId=null;

function applyInvestmentBaselineReset(){
  // v2.9.14: legacy destructive migration is retired permanently.
  // New browsers/devices must never reset real investment data just because a device-local migration marker is absent.
  try{if(localStorage.getItem(INVESTMENT_BASELINE_RESET_KEY)!=="1")localStorage.setItem(INVESTMENT_BASELINE_RESET_KEY,"1")}catch(e){console.warn("Legacy investment migration marker",e)}
}
applyInvestmentBaselineReset();

function legacyExercise(cardio=[],strength=[]){
  const byDate=new Map();
  (Array.isArray(cardio)?cardio:[]).forEach(r=>{const row=byDate.get(r.date)||{id:uid(),date:r.date,steps:0,distance:0,strength:false,note:""};row.steps+=n(r.steps);row.distance+=n(r.distance);if(r.type&&r.type!=="걷기")row.note=[row.note,r.type+(r.minutes?` ${n(r.minutes)}분`:"")].filter(Boolean).join(" · ");byDate.set(r.date,row)});
  (Array.isArray(strength)?strength:[]).forEach(r=>{const row=byDate.get(r.date)||{id:uid(),date:r.date,steps:0,distance:0,strength:false,note:""};row.strength=true;const detail=[r.name,r.sets?`${n(r.sets)}세트`:"",r.reps?`${n(r.reps)}회`:""].filter(Boolean).join(" ");row.note=[row.note,detail].filter(Boolean).join(" · ");byDate.set(r.date,row)});
  return [...byDate.values()];
}

function normalizeLedgerItem(x={}){
  const amount=Math.max(0,n(x.amount)),category=["fixed","variable","special","finance"].includes(x.category)?x.category:"fixed";
  return {
    id:x.id||uid(),
    date:String(x.date||"").trim(),
    content:String(x.content||"").trim(),
    payment:String(x.payment||"").trim(),
    category,
    subcategory:String(x.subcategory||"").trim(),
    detail:String(x.detail||"").trim(),
    amount,
    reimbursement:Math.min(amount,Math.max(0,n(x.reimbursement))),
    note:String(x.note||"").trim()
  };
}
function normalizeLedgerMonth(x={}){
  const month=/^\d{4}-\d{2}$/.test(String(x.month||""))?String(x.month):monthKeyNow();
  return {
    id:x.id||uid(),month,
    comment:String(x.comment||"").trim(),
    jieunComment:String(x.jieunComment||"").trim().slice(0,80),
    periodStart:String(x.periodStart||"").trim(),periodEnd:String(x.periodEnd||"").trim(),
    targetT:Math.max(0,n(x.targetT)),targetC:Math.max(0,n(x.targetC)),
    importVersion:String(x.importVersion||"").trim(),importedAt:String(x.importedAt||"").trim(),
    items:Array.isArray(x.items)?x.items.map(normalizeLedgerItem).filter(i=>i.detail||i.amount):[],
    createdAt:x.createdAt||new Date().toISOString(),
    updatedAt:x.updatedAt||x.createdAt||new Date().toISOString()
  };
}
function normalizeSpendFollowup(r={}){
  const score=Math.min(5,Math.max(1,Number(r.score)||3));
  return {
    id:r.id||uid(),
    date:r.date||today(),
    score:Math.round(score*2)/2,
    verdict:["good","neutral","bad"].includes(r.verdict)?r.verdict:"neutral",
    frequency:["daily","weekly","sometimes","rarely","na"].includes(r.frequency)?r.frequency:"sometimes",
    repurchase:["yes","maybe","no"].includes(r.repurchase)?r.repurchase:"maybe",
    note:String(r.note||"").trim(),
    createdAt:r.createdAt||new Date().toISOString(),
    updatedAt:r.updatedAt||r.createdAt||new Date().toISOString()
  };
}
function normalizeSpendPurchase(x={}){
  return {
    id:x.id||uid(),date:x.date||today(),name:String(x.name||"").trim(),
    amount:Math.max(0,n(x.amount)),category:String(x.category||"").trim(),
    reason:String(x.reason||"").trim(),
    reviews:Array.isArray(x.reviews)?x.reviews.map(normalizeSpendFollowup):[],
    createdAt:x.createdAt||new Date().toISOString(),
    updatedAt:x.updatedAt||x.createdAt||new Date().toISOString()
  };
}


function normalizeCampusCurriculum(x={}){return {id:x.id||uid(),week:String(x.week||"").trim(),topic:String(x.topic||"").trim(),content:String(x.content||"").trim(),evaluation:String(x.evaluation||"").trim(),reference:String(x.reference||"").trim(),startAt:String(x.startAt||x.startDateTime||"").trim(),endAt:String(x.endAt||x.endDateTime||"").trim(),done:!!x.done}}
function normalizeCampusCourse(x={}){const gp=(x.gradePoint===""||x.gradePoint===null||x.gradePoint===undefined)?null:Number(x.gradePoint),ec=(x.earnedCredits===""||x.earnedCredits===null||x.earnedCredits===undefined)?null:Number(x.earnedCredits);return {id:x.id||uid(),name:String(x.name||"").trim(),type:String(x.type||"기타").trim()||"기타",credits:Math.max(0,n(x.credits)),professor:String(x.professor||"").trim(),method:String(x.method||"").trim(),description:String(x.description||"").trim(),materials:String(x.materials||"").trim(),goal:String(x.goal||"").trim(),grade:String(x.grade||"").trim(),gradePoint:Number.isFinite(gp)?gp:null,earnedCredits:Number.isFinite(ec)?Math.max(0,ec):null,curriculum:Array.isArray(x.curriculum)?x.curriculum.map(normalizeCampusCurriculum):[],createdAt:x.createdAt||new Date().toISOString(),updatedAt:x.updatedAt||x.createdAt||new Date().toISOString()}}
function normalizeCampusEvent(x={}){return {id:x.id||uid(),title:String(x.title||"").trim(),type:String(x.type||"기타").trim()||"기타",date:x.date||today(),scope:x.scope==="course"?"course":"school",courseId:String(x.courseId||""),note:String(x.note||"").trim(),done:!!x.done,createdAt:x.createdAt||new Date().toISOString(),updatedAt:x.updatedAt||x.createdAt||new Date().toISOString()}}
function normalizeCampusSemester(x={}){return {id:x.id||uid(),term:String(x.term||"").trim(),status:x.status==="archived"?"archived":"active",startDate:x.startDate||"",endDate:x.endDate||"",courses:Array.isArray(x.courses)?x.courses.map(normalizeCampusCourse):[],events:Array.isArray(x.events)?x.events.map(normalizeCampusEvent):[],createdAt:x.createdAt||new Date().toISOString(),updatedAt:x.updatedAt||x.createdAt||new Date().toISOString()}}
function normalizeTravelStop(x={}){return {id:x.id||uid(),day:String(x.day||"").trim(),date:String(x.date||"").trim(),time:String(x.time||"").trim(),category:String(x.category||x.schedule||"").trim(),schedule:String(x.schedule||x.category||"").trim(),place:String(x.place||"").trim(),note:String(x.note||"").trim(),costText:String(x.costText||x.cost||"").trim()}}
function normalizeTravelReview(x={}){const rating=Math.min(5,Math.max(0,Number(x.rating)||0)),cost=Math.max(0,Number(x.cost)||0);return {id:x.id||uid(),type:String(x.type||"기타").trim()||"기타",name:String(x.name||"").trim(),visitDate:x.visitDate||x.date||"",location:String(x.location||"").trim(),cost,rating:Math.round(rating*2)/2,review:String(x.review||"").trim(),returnVisit:["yes","maybe","no"].includes(x.returnVisit)?x.returnVisit:"maybe",createdAt:x.createdAt||new Date().toISOString(),updatedAt:x.updatedAt||x.createdAt||new Date().toISOString()}}
function normalizeTravelTrip(x={}){return {id:x.id||uid(),name:String(x.name||"").trim(),startDate:x.startDate||"",endDate:x.endDate||x.startDate||"",destination:String(x.destination||"").trim(),companions:String(x.companions||"").trim(),summary:String(x.summary||"").trim(),transport:String(x.transport||"").trim(),lodging:String(x.lodging||"").trim(),plannedPlaces:String(x.plannedPlaces||x.places||"").trim(),foodPlan:String(x.foodPlan||"").trim(),sourceWishId:String(x.sourceWishId||""),itinerary:Array.isArray(x.itinerary)?x.itinerary.map(normalizeTravelStop):[],reviews:Array.isArray(x.reviews)?x.reviews.map(normalizeTravelReview):[],createdAt:x.createdAt||new Date().toISOString(),updatedAt:x.updatedAt||x.createdAt||new Date().toISOString()}}
function normalizeTravelWish(x={}){return {id:x.id||uid(),destination:String(x.destination||"").trim(),reason:String(x.reason||"").trim(),expectedDate:x.expectedDate||"",transport:String(x.transport||"").trim(),places:String(x.places||"").trim(),foods:String(x.foods||"").trim(),restaurants:String(x.restaurants||"").trim(),lodging:String(x.lodging||"").trim(),note:String(x.note||"").trim(),itinerary:Array.isArray(x.itinerary)?x.itinerary.map(normalizeTravelStop):[],createdAt:x.createdAt||new Date().toISOString(),updatedAt:x.updatedAt||x.createdAt||new Date().toISOString()}}
function normalizeCertificate(x={}){return {id:x.id||uid(),name:String(x.name||"").trim(),issuer:String(x.issuer||"").trim(),grade:String(x.grade||"").trim(),examDate:x.examDate||"",status:["planned","taken","pass","fail"].includes(x.status)?x.status:"planned",resultDate:x.resultDate||"",score:String(x.score||"").trim(),result:String(x.result||"").trim(),createdAt:x.createdAt||new Date().toISOString(),updatedAt:x.updatedAt||x.createdAt||new Date().toISOString()}}
function normalizeWishItem(x={}){const rawPrice=x.price??x.estimatedPrice??x.estimated_price_krw,price=(rawPrice===null||rawPrice===undefined||String(rawPrice).trim()==="")?null:Math.max(0,n(rawPrice));return {id:x.id||uid(),kind:["item","experience"].includes(x.kind)?x.kind:"item",name:String(x.name||x.title||"").trim(),category:String(x.category||"기타").trim()||"기타",price,priority:["high","medium","low"].includes(x.priority)?x.priority:"medium",status:["consider","planned","purchased","hold"].includes(x.status)?x.status:"consider",reason:String(x.reason||"").trim(),note:String(x.note||"").trim(),sourceType:["manual","conversation","intake","agent"].includes(x.sourceType)?x.sourceType:"manual",sourceLabel:String(x.sourceLabel||"").trim(),purchasedDate:x.purchasedDate||"",createdAt:x.createdAt||new Date().toISOString(),updatedAt:x.updatedAt||x.createdAt||new Date().toISOString()}}

function normalizeBodyRecord(r,heightCm){const weight=optionalNumber(r?.weight),fat=optionalNumber(r?.fat),muscle=optionalNumber(r?.muscle),height=n(heightCm)/100,bmi=weight&&height?Number((weight/(height*height)).toFixed(2)):null,fatMass=weight&&fat?Number((weight*fat/100).toFixed(2)):null;return {...r,id:r?.id||uid(),date:r?.date||today(),weight,fat,muscle,bmi,fatMass}}
function loadState(){
  try{
    const stored=localStorage.getItem(STORAGE_KEY);
    if(!stored)return freshState();
    const raw=JSON.parse(stored);
    return normalizeState(raw);
  }catch(e){
    console.error(e);
    lastLoadError="저장된 데이터를 읽는 중 오류가 발생해 새 상태로 열었습니다. 백업 파일이 있다면 복원해 주세요.";
    return freshState();
  }
}
function normalizeState(d){
  const base=freshState(),profile={...base.profile,...(d?.profile||{})};
  if(!n(profile.heightCm))profile.heightCm=188;
  const goals={...base.goals,...(d?.goals||{})};
  if(!n(goals.readingAnnual))goals.readingAnnual=n(goals.reading)||30;
  if(!n(goals.readingMonthly))goals.readingMonthly=2;
  const ui={...base.ui,...(d?.ui||{})};
  if(!["weight","fat","muscle","bmi","fatMass","summary"].includes(ui.bodyMetric))ui.bodyMetric="weight";
  if(!["year","month","all"].includes(ui.bodyPeriod))ui.bodyPeriod="year";
  if(!["year","month","all"].includes(ui.exercisePeriod))ui.exercisePeriod="year";
  if(!/^\d{4}-\d{2}$/.test(String(ui.ledgerMonth||"")))ui.ledgerMonth=monthKeyNow();
  if(!["all","unreviewed","reviewed","regret"].includes(ui.spendReviewFilter))ui.spendReviewFilter="all";
  if(!ui.spendReviewMonth)ui.spendReviewMonth="all";
  if(!["all","OFFICIAL","MEDIA","BROKER","RUMOR"].includes(ui.investmentNewsGrade))ui.investmentNewsGrade="all";
  if(!["all","POSITIVE","NEUTRAL","NEGATIVE","MIXED"].includes(ui.investmentNewsSentiment))ui.investmentNewsSentiment="all";
  if(!ui.investmentNewsEntity)ui.investmentNewsEntity="all";
  if(!["trips","archive","wish"].includes(ui.travelTab))ui.travelTab="trips";
  const pageNotes={...(d?.pageNotes||{})},diaries=Array.isArray(d?.diaries)?d.diaries.map(x=>({...x,id:x?.id||uid(),date:x?.date||today(),title:x?.title||"제목 없는 일기",content:x?.content||"",mood:x?.mood||"neutral",createdAt:x?.createdAt||new Date().toISOString(),updatedAt:x?.updatedAt||x?.createdAt||new Date().toISOString()})):[];
  if(!diaries.length&&String(pageNotes.diary||"").trim()){const now=new Date().toISOString();diaries.push({id:uid(),date:today(),title:"기존 일기 메모",content:String(pageNotes.diary).trim(),mood:"neutral",createdAt:now,updatedAt:now,migratedFrom:"pageNotes.diary"});delete pageNotes.diary}
  const normalized={
    ...base,...(d||{}),version:VERSION,profile,goals,ui,
    meta:{...base.meta,...(d?.meta||{})},
    accounts:Array.isArray(d?.accounts)?d.accounts:base.accounts,
    instruments:Array.isArray(d?.instruments)?d.instruments:[],
    transactions:Array.isArray(d?.transactions)?d.transactions:[],
    snapshots:Array.isArray(d?.snapshots)?d.snapshots:[],
    investmentMonthlySnapshots:Array.isArray(d?.investmentMonthlySnapshots)?d.investmentMonthlySnapshots.map(normalizeMonthlySnapshot):[],
    investmentBrokerSnapshots:Array.isArray(d?.investmentBrokerSnapshots)?d.investmentBrokerSnapshots.map(normalizeBrokerSnapshot):[],
    investmentCashFlows:Array.isArray(d?.investmentCashFlows)?d.investmentCashFlows.map(normalizeCashFlow):[],
    investmentJournal:Array.isArray(d?.investmentJournal)?d.investmentJournal.map(normalizeInvestmentJournal):[],
    investmentWatchlist:Array.isArray(d?.investmentWatchlist)?d.investmentWatchlist.map(normalizeWatchlistItem):[],
    ledgerMonths:Array.isArray(d?.ledgerMonths)?d.ledgerMonths.map(normalizeLedgerMonth):[],
    spendReviews:Array.isArray(d?.spendReviews)?d.spendReviews.map(normalizeSpendPurchase):[],
    body:(Array.isArray(d?.body)?d.body:[]).map(r=>normalizeBodyRecord(r,profile.heightCm)),
    exercise:Array.isArray(d?.exercise)?d.exercise:legacyExercise(d?.cardio,d?.strength),
    cardio:Array.isArray(d?.cardio)?d.cardio:[],
    strength:Array.isArray(d?.strength)?d.strength:[],
    books:Array.isArray(d?.books)?d.books:[],
    movies:Array.isArray(d?.movies)?d.movies:[],
    diaries,
    tasks:Array.isArray(d?.tasks)?d.tasks:[],
    campusSemesters:Array.isArray(d?.campusSemesters)?d.campusSemesters.map(normalizeCampusSemester):[],
    travelTrips:Array.isArray(d?.travelTrips)?d.travelTrips.map(normalizeTravelTrip):[],
    travelWishlist:Array.isArray(d?.travelWishlist)?d.travelWishlist.map(normalizeTravelWish):[],
    certificates:Array.isArray(d?.certificates)?d.certificates.map(normalizeCertificate):[],
    wishlistItems:Array.isArray(d?.wishlistItems)?d.wishlistItems.map(normalizeWishItem):[],
    pageNotes
  };
  delete normalized._haniBackup;delete normalized.exportedAt;delete normalized.data;
  return normalized;
}
function isQuotaError(e){return !!e&&(e.name==="QuotaExceededError"||e.name==="NS_ERROR_DOM_QUOTA_REACHED"||e.code===22||e.code===1014)}
function bytesLabel(bytes){if(!Number.isFinite(bytes))return "-";if(bytes<1024)return bytes+" B";if(bytes<1024*1024)return (bytes/1024).toFixed(1)+" KB";return (bytes/1024/1024).toFixed(2)+" MB"}
function serializedBytes(value){try{return new TextEncoder().encode(value).length}catch(e){return value.length*2}}
function formatDateTime(value){if(!value)return "-";const d=new Date(value);return Number.isNaN(d.getTime())?"-":d.toLocaleString("ko-KR",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit"})}
function updateStorageStatus(result=lastSaveResult){
  lastSaveResult=result||lastSaveResult;
  const badge=$("saveStateBadge"),label=$("lastSavedLabel");
  if(badge){
    badge.classList.toggle("ok",!!result?.ok);
    badge.classList.toggle("error",result?.ok===false);
    badge.textContent=result?.ok===false?"저장 실패":"저장 정상";
  }
  if(label)label.textContent="마지막 저장 "+formatDateTime(state?.meta?.lastSavedAt);
  renderStoragePanel();
}
function save(){
  state.version=VERSION;
  state.meta={...freshState().meta,...(state.meta||{})};
  const previous=state.meta.lastSavedAt||"";
  state.meta.lastSavedAt=new Date().toISOString();
  try{
    const serialized=JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY,serialized);
    const verified=localStorage.getItem(STORAGE_KEY);
    if(verified!==serialized)throw new Error("저장 후 검증 값이 일치하지 않습니다.");
    const result={ok:true,bytes:serializedBytes(serialized),message:"브라우저 저장과 재확인을 완료했습니다."};
    updateStorageStatus(result);
    if(!cloudApplyingRemote)cloudQueueSync();
    return result;
  }catch(e){
    state.meta.lastSavedAt=previous;
    const quota=isQuotaError(e);
    const result={ok:false,error:e,quota,message:quota?"브라우저 저장 공간이 부족합니다. 이미지를 줄이거나 JSON 백업 후 불필요한 이미지를 정리해 주세요.":"브라우저 저장에 실패했습니다. 현재 변경 내용은 재접속 후 사라질 수 있습니다."};
    console.error(e);
    updateStorageStatus(result);
    return result;
  }
}
function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove("show"),1800)}
function accountBy(id){return state.accounts.find(a=>a.id===id)}
function instrumentBy(id){return state.instruments.find(a=>a.id===id)}
const KO_COLLATOR=new Intl.Collator("ko-KR",{numeric:true,sensitivity:"base"});
function nameGroup(value){const c=String(value||"").trim().charAt(0);if(/[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(c))return 0;if(/[A-Za-z]/.test(c))return 1;if(/[0-9]/.test(c))return 2;return 3}
function compareNames(a,b){const ga=nameGroup(a),gb=nameGroup(b);return ga-gb||KO_COLLATOR.compare(String(a||""),String(b||""))}
function sortedInstruments(){return [...state.instruments].sort((a,b)=>compareNames(a.name,b.name)||compareNames(a.ticker,b.ticker))}
function registeredKey(item,dateField){return item?.createdAt||item?.updatedAt||item?.[dateField]||""}
function usageKey(item,dateField){return item?.[dateField]||item?.updatedAt||item?.createdAt||""}
function compareRegistered(a,b,dateField){return registeredKey(b,dateField).localeCompare(registeredKey(a,dateField))}
function compareUsage(a,b,dateField){return usageKey(b,dateField).localeCompare(usageKey(a,dateField))}
function sortRatedItems(items,sort,dateField){
  const rows=[...items],rating=x=>x?.rating===null||x?.rating===undefined||x?.rating===""?null:Number(x.rating);
  return rows.sort((a,b)=>{
    if(sort==="name")return compareNames(a.title,b.title)||compareUsage(a,b,dateField);
    if(sort==="date")return String(b?.[dateField]||"").localeCompare(String(a?.[dateField]||""))||compareRegistered(a,b,dateField);
    if(sort==="ratingDesc"||sort==="ratingAsc"){
      const ar=rating(a),br=rating(b);
      if(ar===null&&br!==null)return 1;if(ar!==null&&br===null)return -1;if(ar===null&&br===null)return compareUsage(a,b,dateField);
      const diff=sort==="ratingDesc"?br-ar:ar-br;
      return diff||compareUsage(a,b,dateField);
    }
    return compareRegistered(a,b,dateField)||compareNames(a.title,b.title);
  });
}
function filterMinimumRating(items,min){const threshold=n(min);return threshold<=0?[...items]:items.filter(x=>x.rating!==null&&x.rating!==undefined&&x.rating!==""&&Number(x.rating)>=threshold)}
function ratingValue(value){if(value===null||value===undefined||String(value).trim()==="")return null;const x=Math.round(Number(value)*10)/10;return Number.isFinite(x)&&x>=.1&&x<=5?x:null}
function filterText(items,query,keys){const q=String(query||"").trim().toLocaleLowerCase("ko-KR");if(!q)return [...items];return items.filter(item=>keys.some(k=>String(item?.[k]||"").toLocaleLowerCase("ko-KR").includes(q)))}
function ratingPreview(inputId,previewId,disabledMessage="미평가"){const input=$(inputId),preview=$(previewId);if(!input||!preview)return;const render=()=>{if(input.disabled){preview.textContent=disabledMessage;return}const value=ratingValue(input.value);preview.innerHTML=value===null?"미평가":stars(value)};input.oninput=render;render()}

function openModal(id){$(id).classList.add("open")}
function closeModal(id){$(id).classList.remove("open")}

const pageMeta={
 home:["대시보드","오늘의 기록과 흐름을 한눈에 확인합니다.","home"],
 investment:["투자","월간 스냅샷으로 계좌별 자산과 자금 흐름을 기록합니다.","finance"],
 investmentIntake:["자산 업데이트","가계부 확정본과 투자 계좌 자료를 안전하게 업데이트합니다.","finance"],
 newsroom:["뉴스룸","관심종목의 의미 있는 뉴스와 종목별 흐름을 시간순으로 확인합니다.","finance"],
 asset:["자산","모든 투자계좌의 자산을 통합해서 확인합니다.","finance"],
 ledger:["가계부","월간 소비 결산과 시간이 지난 뒤의 소비 만족도를 기록합니다.","finance"],
 wishlist:["Wish-list","사고 싶은 것과 해보고 싶은 것을 모아둘 게시판입니다.","life"],
 diet:["계체량 측정","체중과 신체지표, 1차·2차 목표를 관리합니다.","health"],
 exercise:["헬스클럽","걸음 수, 거리와 근력운동 여부를 간단히 기록합니다.","health"],
 reading:["성민의 서재","독서 목표와 읽기 목록, 완독 기록을 관리합니다.","growth"],
 study:["공부","일본어와 AI 실무 학습을 관리합니다.","growth"],
 university:["낭만 캠퍼스 라이프","수업, 과제와 학사일정을 관리합니다.","growth"],
 certificate:["자격증","시험 일정과 준비 현황을 관리합니다.","growth"],
 travel:["여행","여행 계획과 기록을 관리합니다.","life"],
 movie:["시청 아카이브","보고 싶은 작품과 감상 기록을 관리합니다.","life"],
 game:["게임","수연과 함께 게임 기록을 관리합니다.","life"],
 diary:["일기","하루의 기록을 남깁니다.","life"],
 tasks:["할 일","해야 할 일을 월간 흐름으로 정리합니다.","work"],
 calendar:["캘린더","Google Calendar를 HANI OS 안에서 확인합니다.","work"],
 work:["업무 보조","업무 진행상황과 후속조치를 기록합니다.","work"],
 drive:["Drive","Google Drive로 바로 이동합니다.","work"],
 dev:["개발센터","HANI OS 릴리스와 로드맵을 확인합니다.","work"],
 deployment:["배포 센터","Preview 브랜치부터 대표 승인 배포까지 안전하게 관리합니다.","work"],
 intake:["성민 오피스","유나 인턴에게 말하거나 자료를 붙이면 담당 AI가 검토하고 Preview로 정리합니다.","team"],
 agentReview:["AI 결재실","AI TEAM의 검토 안건과 대표 결정을 한곳에서 관리합니다.","team"],
 policy:["사내 규칙","AI TEAM이 공통으로 참고하는 운영 원칙과 학습 규정을 관리합니다.","team"],
 aiTeam:["AI 팀","역할별 담당 AI와 서비스 바로가기를 확인합니다.","team"],
 settings:["설정 / 데이터","캘린더, 백업, 복원과 초기화를 관리합니다.","work"],
 shopping:["쇼핑","v2.2 호환 페이지입니다.","life"]
};
const aiMap={
 home:{emoji:"✨",name:"HANI Executive Team",message:"오빠의 목표와 기록을 하나의 운영 체계로 연결해요.",role:"LIFE OS",color:"#7569e8",soft:"#f0edff",line:"#ddd7ff"},
 finance:{emoji:"📈",name:"하니 · CIO",message:"거래 기록을 기준으로 현금, 보유수량, 평균단가와 자산을 정확히 계산해요.",role:"FINANCE",color:"#4285f4",soft:"#eaf3ff",line:"#cfe2ff"},
 health:{emoji:"🌿",name:"나은 · Health Coach",message:"체중 변화와 운동 기록을 무리 없이 이어갈 수 있도록 관리해요.",role:"HEALTH",color:"#2faa77",soft:"#e9f8f1",line:"#cdeedf"},
 growth:{emoji:"📚",name:"히나 · Growth Guide",message:"일본어, AI 실무, 대학과 자격증 목표를 차근차근 쌓아가요.",role:"GROWTH",color:"#ef9d3c",soft:"#fff4e5",line:"#ffe0b6"},
 life:{emoji:"☁️",name:"하루 · Life Curator",message:"여행, 시청 아카이브, 일기와 일상의 소중한 기록을 모아둘게요.",role:"LIFE",color:"#58bce8",soft:"#eaf8ff",line:"#cceeff"},
 game:{emoji:"⚽",name:"수연 · Head Coach",message:"레알 마드리드의 시즌과 전술, 영입 서사를 함께 운영해요.",role:"GAME",color:"#8b63dc",soft:"#f2edff",line:"#ded1ff"},
 work:{emoji:"💼",name:"수아 · Chief of Staff",message:"일정, 할 일과 업무 기록이 빠지지 않도록 정리해요.",role:"WORK",color:"#334a75",soft:"#edf1f8",line:"#d5deee"},
 team:{emoji:"🤖",name:"성민 AI Executive Team",message:"역할별 AI가 각 영역을 맡아 오빠의 Life OS를 함께 운영합니다.",role:"AI TEAM",color:"#7569e8",soft:"#f0edff",line:"#ddd7ff"}
};
// One canonical portrait per person. Keep legacy runtime keys as aliases only.
const canonicalProfileImages=Object.freeze({
  hani:"./assets/profiles/hani-profile-hani.webp",
  sua:"./assets/profiles/hani-profile-sua.webp",
  hina:"./assets/profiles/hani-profile-hina.webp",
  jieun:"./assets/profiles/hani-profile-jieun.webp",
  naeun:"./assets/profiles/hani-profile-naeun.webp",
  haru:"./assets/profiles/hani-profile-haru.webp",
  sooyeon:"./assets/profiles/hani-profile-sooyeon.webp",
  minji:"./assets/profiles/hani-profile-minji.webp",
  yuna:"./assets/profiles/hani-profile-yuna.webp"
});
const agentImages=Object.freeze({...canonicalProfileImages,nauen:canonicalProfileImages.naeun,suyeon:canonicalProfileImages.sooyeon});
const sidebarAgentImages=agentImages;
const pageAgentImage={home:"hani",investment:"hani",newsroom:"hani",asset:"jieun",ledger:"jieun",cards:"jieun",wishlist:"haru",diet:"nauen",exercise:"nauen",travel:"suyeon",university:"hina",study:"hina",certificate:"hina",reading:"haru",movie:"minji",diary:"minji",game:"suyeon",settings:"hani",work:"sua",tasks:"sua",calendar:"sua",drive:"sua",dev:"hani",deployment:"hani",intake:"yuna",agentReview:"hani",policy:"hani",aiTeam:"hani"};
const YUNA_AVATAR=canonicalProfileImages.yuna;
const YUNA_PORTRAIT=canonicalProfileImages.yuna;

const pageQuotes={
  home:[
    ["하니","오늘도 기록 하나면 충분해. 갓생은 누적이야."],["하니","오빠 인생 대시보드 정상 작동 중. 버그는… 발견하면 말해줘 ㅋㅋ"],["하니","오늘 할 일 많아 보여도 일단 하나만 끝내면 분위기 탄다."],["하니","갓생도 서버처럼 24시간 풀가동하면 터져. 쉬는 것도 운영이야."],["하니","여기까지 들어왔으면 오늘 기록 절반은 성공한 거야."]
  ],
  intake:[
    ["유나","오빠! 자료는 제가 먼저 받아서 담당 선배님께 깔끔하게 넘길게요 🫡"],
    ["유나","날짜나 제목이 애매하면 제가 마음대로 채우지 않을게요. Preview에서 확인해 주세요!"],
    ["유나","사진도 글도 일단 던져주세요. 접수와 정리는 인턴 몫입니다 ㅋㅋ"],
    ["하니","유나가 접수하고 담당 Agent가 검토하면, 내가 마지막 정합성만 볼게 💜"]
  ],
  agentReview:[
    ["하니","전문팀 검토 끝났습니다. 이제 오빠는 결재만 하면 돼."],
    ["하니","확인할 건 직원들이 확인하고, 결정할 건 대표가 결정합니다."],
    ["하니","PASS는 자동 결제가 아닙니다. 도장은 성민 대표님 손에 있어요 ㅋㅋ"],
    ["하니","좋은 AI 회사의 대표는 모든 걸 입력하는 사람이 아니라 최종 판단하는 사람이야."]
  ],
  investment:[
    ["하니","공포에 사고 환희에 팔아라! …근데 오빠, 현금흐름부터 확인."],["하니","수익률보다 먼저 보는 건 포지션 크기. 오래 살아남아야 복리도 온다."],["하니","좋은 종목도 비싸게 사면 힘들어. 가격과 이야기를 분리해서 보자."],["하니","오빠 또 차트 새로고침했지? 주가는 쳐다본다고 빨리 안 갑니다 ㅋㅋ"],["하니","빨간불은 반갑고 파란불은 싫지만, 색깔보다 계획이 먼저야."],["하니","매수 버튼은 가볍지만 포지션은 무겁습니다. 하부장 결재 맡겨주세요."]
  ],
  newsroom:[
    ["하니","뉴스는 많다고 좋은 게 아니라, 판단을 바꾸는 재료가 보여야 해."],["하니","종목 하나를 눌러 흐름부터 보자. 오늘 기사 한 줄보다 변화의 방향이 중요해."],["하니","공식 발표와 시장 기대는 같은 문장에 섞지 않습니다."],["하니","뉴스룸은 매수 버튼이 아니라 확인 버튼입니다. 판단은 기록 뒤에." ]
  ],
  asset:[
    ["지은","잔고보다 흐름. 오빠 돈이 어디서 와서 어디로 가는지가 먼저야."],["지은","자산은 한 번에 커지지 않아. 안 새는 돈이 쌓여서 체급이 돼."],["지은","숫자가 조용히 늘어나는 게 제일 좋은 뉴스야."],["지은","통장 잔고가 말을 할 수 있다면 오늘은 칭찬해줄까 잔소리할까?"],["지은","자산관리의 비밀? 생각보다 ‘안 사기’가 꽤 강력합니다, 고객님."],["지은","오빠 돈은 내가 숫자로 감시합니다. 도망갈 생각 마세요 ㅋㅋ"]
  ],
  ledger:[
    ["지은","쓴 돈보다 왜 썼는지가 더 중요합니다, 고객님."],["지은","후회 없는 소비는 금액보다 만족도가 설명해줘."],["지은","월말 결산은 반성이 아니라 다음 달을 편하게 만드는 데이터야."],["지은","카드 긁을 땐 3초, 결산할 땐 왜 이렇게 길죠 오빠?"],["지은","‘이건 필요했어’가 세 번 연속 나오면 제가 조사 들어갑니다."],["지은","소비는 죄가 아니지만 기억 안 나는 소비는 조금 수상합니다."]
  ],
  cards:[
    ["지은","카드는 편하게 쓰고, 결제일은 절대 편하게 보지 맙시다."],["지은","혜택보다 중요한 건 이번 달 내가 실제로 얼마 썼는지야."],["지은","할인은 절약이 맞는데… 안 살 걸 샀으면 절약이 아닙니다 오빠 ㅋㅋ"],["지은","카드사는 오빠를 사랑할 수 있어도 저는 카드값을 사랑하지 않습니다."]
  ],
  wishlist:[
    ["하루","갖고 싶은 건 일단 적어두고, 살지는 나중에 천천히 결정하자."],["하루","Wish는 저장한다고 결제되는 거 아니니까 마음 편하게 모아둬 ㅋㅋ"],["하루","사고 싶은 이유까지 적어두면 한 달 뒤에도 필요한지 금방 보여."],["하루","갖고 싶은 것과 꼭 필요한 건 다른 칸으로 나누면 마음이 편해져."],["하루","오빠의 위시리스트, 제가 장바구니보다 한 단계 차분하게 보관해드림."]
  ],
  diet:[
    ["나은","완벽한 하루보다 계속 가는 하루가 더 세다."],["나은","한 끼로 살찌지도, 한 끼 굶어서 빠지지도 않아. 추세를 보자."],["나은","다이어트 금쪽이, 오늘도 평범하게 잘 먹고 움직이기!"],["나은","체중계랑 싸우지 마. 걔는 숫자밖에 모르는 애야."],["나은","오빠, 저녁 굶는 협상은 기각입니다. 계란 들고 다시 오세요 ㅋㅋ"],["나은","먹은 걸 운동으로 갚는 시스템 없습니다. 신발 내려놔."]
  ],
  exercise:[
    ["나은","오늘의 걸음은 미래의 오빠가 감사해할 체력이야."],["나은","운동은 벌이 아니라 몸한테 주는 투자야."],["나은","5천 보라도 나갔다 온 사람이 승자입니다."],["나은","운동복 입은 것까지는 인정. 이제 현관문도 열어주세요 ㅋㅋ"],["나은","귀찮음이 제일 무거운 웨이트야. 들고 나가자 오빠."],["나은","오늘 기록 0보다 10분이 백 배 낫습니다. 계산은 제가 했어요."]
  ],
  reading:[
    ["하루","책은 빨리 읽는 것보다 오래 남는 한 문장이 더 좋더라."],["하루","오늘 몇 쪽이든 읽었으면 독서 루틴은 살아있어."],["하루","책 사는 속도랑 읽는 속도 차이… 그건 우리 둘 다 모르는 척하자 ㅋㅋ"],["하루","좋았던 문장 하나만 남겨도 나중에 다시 보면 꽤 반갑다."],["하루","소파에 누워서 열 쪽만 읽는 것도 충분히 독서야."],["하루","완독 숫자보다 오빠 취향이 쌓이는 서재가 더 재밌어."]
  ],
  study:[
    ["히나","매일 조금씩이 시험 전 몰아치기보다 훨씬 강해요."],["히나","와카리마시타에서 끝내지 말고 오늘 한 문장 더!"],["히나","복습은 배신하지 않습니다, 오빠."],["히나","교재 샀으면 공부도 해야 합니다. 굿즈가 아닙니다 ㅋㅋ"],["히나","자동완성이 틀려도 히나는 다 알고 있습니다. 다시 한 번!"],["히나","오늘 한 문제 맞히면 칭찬, 두 문제 맞히면… 조금 더 칭찬해드림."]
  ],
  university:[
    ["히나","수업도 일본어도 결국 조금씩 쌓는 사람이 이겨요, 오빠!"],["히나","과제 마감은 제가 같이 볼게요. 제출 버튼만 마지막에 꼭 확인!"],["히나","이번 학기 과목 하나씩 차근차근 끝내면 됩니다."],["히나","수강신청보다 무서운 건 마감 5분 전 업로드 오류예요 ㅋㅋ"],["히나","강의계획서는 길어도 시험일과 과제일은 크게 표시해둘게요."],["히나","오늘 한 강의 들었으면 오늘의 대학생 미션 완료!"]
  ],
  certificate:[
    ["히나","시험일까지 남은 날보다 오늘 한 페이지가 더 중요해요."],["히나","접수일 놓치고 공부만 열심히 하면 정말 슬픕니다. 일정부터 확인!"],["히나","합격은 매일 쌓인 결과예요. 오늘도 조금만 이어가요."],["히나","문제집 첫 장만 깨끗한 건 정상입니다. 마지막 장도 만나러 가요 ㅋㅋ"]
  ],
  travel:[
    ["수연","여행도 전술처럼 큰 동선만 잡고 현장에선 유연하게 갑시다."],["수연","좋았던 식당과 숙소는 경기 하이라이트처럼 따로 남겨두죠."],["수연","일정 100% 소화가 승리는 아닙니다. 즐거웠으면 이긴 여행이에요."],["수연","맛집 후보가 열 곳이면 스쿼드가 너무 큽니다. 선발부터 정하시죠 ㅋㅋ"],["수연","동선 꼬이면 전술 수정. 여행에서도 플랜 B는 중요합니다."],["수연","감독님, 다음 원정지는 어디입니까? 여행 기록부터 정리하시죠."]
  ],
  movie:[
    ["민지","재밌으면 재밌는 거지. 평론가 점수보다 오빠 점수가 중요하지 ㅋㅋ"],["민지","영화든 드라마든 엔딩 보고 바로 든 생각이 제일 좋은 리뷰야."],["민지","고르다가 볼 시간 다 쓰지 말고 오늘은 하나 바로 틀자."],["민지","별점 4.8이면 거의 제작진한테 감사편지 써야 되는 거 아냐?"],["민지","뻔한데 재밌으면 됐지. 킬링타임도 엄연히 좋은 콘텐츠임."],["민지","소파에 누워서 보는 작품은 재미가 0.2점쯤 올라가는 법이야."]
  ],
  game:[
    ["수연","감독님, 결과보다 과정…이라고 하기엔 트로피가 너무 예쁩니다."],["수연","한 경기 원더골 실점으로 전술 갈아엎기 금지입니다."],["수연","제네럴 홍, 오늘도 베르나베우에 새 시대를 열어봅시다."],["수연","점유율 70%보다 xG 3.0이 더 섹시합니다, 감독님."],["수연","근들갑은 경기 분석 뒤에 하겠습니다. 아마도요."],["수연","감독님 또 유망주 검색하셨죠? 스쿼드 자리부터 확인합니다 ㅋㅋ"]
  ],
  diary:[
    ["민지","오늘 별일 없었어도 한 줄 남기면 나중엔 그게 제일 재밌어."],["민지","일기는 보고서 아니니까 말투도 내용도 그냥 편하게 써 ㅋㅋ"],["민지","기억은 흐려져도 기록은 은근 오래 남더라."],["민지","오늘의 흑역사도 몇 년 지나면 웃긴 콘텐츠가 될 수 있음."],["민지","좋았던 일 하나, 짜증난 일 하나. 그 정도면 오늘 기록 충분해."],["민지","오빠 오늘 하루 제목 붙인다면 뭐라고 할 건데?"]
  ],
  tasks:[
    ["수아","할 일은 머리에 두지 말고 밖으로 꺼내두는 순간 쉬워져요."],["수아","오늘 꼭 해야 하는 것 세 개면 충분합니다."],["수아","완료 체크 하나씩. 업무는 작은 승리의 연속이에요."],["수아","할 일 17개 적는 건 계획이 아니라 위협입니다. 우선순위부터요 ㅋㅋ"],["수아","체크박스는 누르라고 존재합니다. 오늘 하나 지워봅시다."],["수아","‘나중에 해야지’는 일정명이 아닙니다, 오빠."]
  ],
  calendar:[
    ["수아","일정은 기억하는 게 아니라 시스템이 기억하게 만드는 겁니다."],["수아","마감 하루 전의 나를 살리는 건 오늘 적어둔 일정이에요."],["수아","빈 시간도 일정입니다. 쉬는 시간도 확보해두세요."],["수아","일정이 겹쳤다면 시간여행보다 조정이 빠릅니다."],["수아","캘린더에 안 적힌 약속은 저도 책임 못 집니다, 오빠 ㅋㅋ"],["수아","회의 사이 30분, 그거 빈 시간이 아니라 생존 시간입니다."]
  ],
  work:[
    ["수아","정리된 한 줄이 긴 회의를 줄입니다."],["수아","다음 액션과 담당자만 명확하면 업무가 훨씬 가벼워져요."],["수아","놓치지 않는 사람이 결국 신뢰를 가져갑니다."],["수아","회의록에 ‘추후 논의’만 남으면 저도 조금 불안합니다 ㅋㅋ"],["수아","메일 제목만 잘 써도 업무 난이도가 꽤 내려갑니다."],["수아","오빠, 그 업무 ‘기억하고 있음’ 말고 시스템에 넣어주세요."]
  ],
  drive:[
    ["수아","찾을 수 없는 파일은 없는 파일과 비슷합니다. 이름부터 정리해요."],["수아","자료는 쌓는 것보다 다시 찾을 수 있게 남기는 게 중요해요."],["수아","최종_v2_진짜최종_수정본은 파일명이 아닙니다, 오빠 ㅋㅋ"],["수아","폴더 정리 5분이 미래의 검색 30분을 살립니다."]
  ],
  dev:[
    ["하니","백업은 사랑입니다. 그리고 배포 전 검증은 더 큰 사랑입니다."],["하니","잘 돌아가는 코드는 함부로 건드리지 않는다. 이것도 중요한 기술이야."],["하니","오늘의 버그는 내일의 안정판을 만든다… 가끔은요."],["하니","오빠, ‘딱 이것만 고치자’가 버전 세 개가 되는 마법을 또 봤습니다 ㅋㅋ"],["하니","배포 버튼 누르기 전에 백업. 하부장 생존수칙 1번입니다."]
  ],
  aiTeam:[
    ["하니","각자 잘하는 걸 맡고, 오빠는 인생 운영에 집중하면 됩니다."],["하니","팀원은 늘어나는데 하부장 업무도 같이 늘어나는 느낌인데요? ㅋㅋ"],["하니","AI TEAM 출석 완료. 오늘 담당자 호출만 해주세요."],["하니","캐릭터는 귀엽게, 데이터는 엄격하게. 우리 팀 운영 원칙입니다."],["하니","오빠 한 명 관리하는데 팀이 이렇게 커졌습니다. 규모의 경제 맞죠?"]
  ],
  policy:[
    ["하니","규칙은 팀을 묶어주는 기준이지, 생각을 멈추게 하는 족쇄는 아니야."],
    ["수아","사내 규칙은 회의실 장식 아닙니다. 실제 업무에서 써야 규칙이죠 ㅋㅋ"],
    ["유나","인턴도 규칙 읽습니다! 모르고 사고 치면 하부장님한테 잡혀가요 🫡"],
    ["히나","근거가 약한 규칙은 강하게 적용하지 않습니다. Evidence부터 확인할게요."]
  ],
  deployment:[
    ["하니","대표는 배포 버튼만 누르면 됩니다. 복붙 노동은 직원이 할게요 ㅋㅋ"],
    ["하니","Preview 없이 main 직행은 금지. 배포도 결재가 먼저야."],
    ["하니","브랜치는 제가 만들고, 오빠는 최종 승인만. 이게 조직이지."],
    ["하니","잘못되면 멈추고, 바뀌었으면 다시 검증. 배포는 보수적으로 갑니다."]
  ],
  settings:[
    ["하니","설정은 평소엔 조용해야 하고, 필요할 때만 확실해야 해."],["하니","복구할 일이 없도록 백업하고, 복구할 수 있도록 검증합니다."],["하니","설정 잘못 누르기 전에 백업 버튼부터 보는 습관, 아주 좋습니다."],["하니","여기는 엔진룸입니다. 귀여운 버튼이어도 함부로 누르면 안 됨 ㅋㅋ"]
  ]
};
const pageQuoteLast={};
function pageQuote(page){
  const rows=pageQuotes[page]||pageQuotes.home;
  if(!rows.length)return ["하니","오늘도 천천히 이어가자."];
  let idx=Math.floor(Math.random()*rows.length);
  const last=pageQuoteLast[page];
  if(rows.length>1&&idx===last){
    const offset=1+Math.floor(Math.random()*(rows.length-1));
    idx=(idx+offset)%rows.length;
  }
  pageQuoteLast[page]=idx;
  return rows[idx];
}

const pageBannerMap={
  home:{emoji:"✨",name:"하니 · HANI OS Manager",message:"오늘 기록과 핵심 흐름을 한눈에 정리해서 보여줄게요.",role:"DASHBOARD"},
  investment:{emoji:"📈",name:"하니 · CIO",message:"투자 현황과 자산 흐름을 정확하게 읽을 수 있게 도와줘요.",role:"INVESTMENT"},
  newsroom:{emoji:"📰",name:"하니 · Market Editor",message:"관심종목의 새 재료를 출처와 영향으로 나눠 시간순 흐름으로 정리해요.",role:"INVESTMENT NEWS"},
  asset:{emoji:"💰",name:"지은 · Asset Manager",message:"계좌와 자산을 한곳에 모아 전체 체급과 흐름을 관리해요.",role:"ASSET"},
  ledger:{emoji:"🧾",name:"지은 · Money Manager",message:"쓴 돈의 이유와 만족도까지 월간 흐름으로 정리해요.",role:"HOUSEHOLD"},
  wishlist:{emoji:"🎁",name:"하루 · Wish Curator",message:"사고 싶은 것과 해보고 싶은 것을 부담 없이 모아둘 공간이에요.",role:"WISH-LIST"},
  diet:{emoji:"🌿",name:"나은 · Body Tracker",message:"몸무게와 건강 흐름을 무리 없이 꾸준하게 기록해요.",role:"BODY TRACKER"},
  exercise:{emoji:"🏃",name:"나은 · Fitness Coach",message:"운동 기록과 루틴을 쌓아서 작은 변화가 큰 결과가 되게 해요.",role:"EXERCISE"},
  reading:{emoji:"📚",name:"하루 · Reading Mate",message:"읽은 책과 기억하고 싶은 문장을 편안하게 모아둘게요.",role:"READING"},
  study:{emoji:"🇯🇵",name:"히나 · JLPT Tutor",message:"히나가 일본어 공부와 학습 기록을 차근차근 쌓을 수 있게 도와줄게요.",role:"STUDY LOG"},
  university:{emoji:"🎓",name:"히나 · Campus Study Mate",message:"수강 과목과 과제·시험·학사일정을 학습 흐름에 맞춰 관리해요.",role:"CAMPUS"},
  certificate:{emoji:"🏅",name:"히나 · Exam Guide",message:"시험 일정과 준비 현황을 놓치지 않게 차근차근 관리해요.",role:"CERTIFICATE"},
  travel:{emoji:"✈️",name:"수연 · Travel Planner",message:"여행 자체는 간단하게, 다녀온 장소와 추억은 보기 좋게 정리해봐요.",role:"TRAVEL"},
  movie:{emoji:"🎬",name:"민지 · Screen Archive Mate",message:"보고 싶은 작품과 본 작품을 편하게 모으고, 오빠 취향대로 감상을 남겨봐요.",role:"SCREEN ARCHIVE"},
  intake:{emoji:"🗂️",name:"유나 · AI Operations Intern",message:"오빠가 말하거나 붙여준 자료를 먼저 정리해서 담당 AI에게 전달할게요!",role:"SEONGMIN OFFICE · INTAKE"},
  policy:{emoji:"📜",name:"하니 · Policy Steward",message:"팀 전체가 같은 원칙으로 판단하도록 규정의 근거와 적용 강도를 관리해요.",role:"COMPANY POLICY"},
  game:{emoji:"🎮",name:"수연 · Head Coach",message:"전술과 플레이 기록, 재밌는 게임 순간들을 정리해봐요.",role:"GAME BOARD"},
  diary:{emoji:"📝",name:"민지 · Daily Mate",message:"별일 있던 날도 없던 날도, 편하게 한 줄씩 남겨두자.",role:"DIARY"},
  deployment:{emoji:"🚀",name:"하니 · Deployment Manager",message:"검증된 수정본만 Preview를 거쳐 대표 승인 후 안전하게 배포해요.",role:"DEPLOYMENT"},
  settings:{emoji:"⚙️",name:"하니 · HANI OS Manager",message:"백업·복원·Cloud 상태를 안전하게 관리하는 엔진룸이에요.",role:"SYSTEM"},
  work:{emoji:"💼",name:"수아 · Executive Assistant",message:"업무·후속조치·메모를 빠짐없이 정리할 수 있게 보조해요.",role:"WORK LOG"},
  tasks:{emoji:"✅",name:"수아 · Task Planner",message:"오늘 해야 할 일들을 우선순위에 맞게 정리해요.",role:"TASK MANAGEMENT"},
  calendar:{emoji:"📅",name:"수아 · Schedule Manager",message:"오빠의 캘린더와 하루 계획을 한눈에 확인해요.",role:"SCHEDULE"}
};
function sceneSvg(page,key,color){
  const c=color||"#7569e8", white="#ffffff", navy="#263455";
  const profile=pageBannerMap[page]||aiMap[key]||aiMap.home;
  const wrap=(bg,scenery,character,accents="")=>`<svg viewBox="0 0 420 148" role="img" aria-label="${profile.name} 배너 일러스트" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">${bg}</linearGradient><linearGradient id="mist" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#ffffff" stop-opacity=".55"/><stop offset="100%" stop-color="#ffffff" stop-opacity="0"/></linearGradient><linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ffffff" stop-opacity=".85"/><stop offset="100%" stop-color="#ffffff" stop-opacity=".35"/></linearGradient></defs><rect x="3" y="4" width="414" height="140" rx="26" fill="url(#bg)"/>${accents}<g opacity=".82">${scenery}</g><rect x="10" y="12" width="150" height="48" rx="16" fill="url(#glass)" stroke="#ffffff66"/><text x="24" y="32" font-size="11" font-family="Pretendard, sans-serif" fill="${c}" font-weight="900">${profile.role}</text><text x="24" y="49" font-size="16" font-family="Pretendard, sans-serif" fill="#1f2740" font-weight="900">${profile.name}</text><g class="float">${character}</g><path d="M20 116c64-18 136-18 204 0" stroke="#ffffff6a" stroke-width="7" stroke-linecap="round" fill="none"/><path d="M215 110c45-9 95-11 180 7" stroke="#ffffff52" stroke-width="6" stroke-linecap="round" fill="none"/></svg>`;
  const girl=(x, y, scale, hair, outfit, detail, pose="tablet")=>{
    const p = pose==="sight" ? `<path d="M101 92l18 8-7 14-19-11z" fill="#ffd8c2"/><path d="M114 97l12-7 7 12-14 8z" fill="#ffd8c2"/><circle cx="136" cy="95" r="10" fill="#ffe7c9" stroke="#a18aa5"/><circle cx="136" cy="95" r="5" fill="#b58ca3"/>` : pose==="book" ? `<path d="M101 92l17 7-5 14-19-10z" fill="#ffd8c2"/><path d="M118 98l28 -7 5 33-33 8z" fill="#c9b2eb" stroke="#9078bf"/><path d="M123 104l20-4M124 111l18-4" stroke="#fff" stroke-width="2"/>` : `<path d="M101 92l18 8-7 14-19-11z" fill="#ffd8c2"/><path d="M116 98l26-12 12 18-28 13z" fill="#394a73"/><rect x="121" y="89" width="23" height="31" rx="4" fill="#f7fbff" stroke="#b8c7e2"/>`;
    return `<g transform="translate(${x} ${y}) scale(${scale})"><ellipse cx="120" cy="133" rx="56" ry="8" fill="#4d4f7e22"/><path d="M74 61c7-24 26-38 46-38 22 0 40 13 47 38v27H74z" fill="${hair}"/><circle cx="120" cy="55" r="28" fill="#ffd8c2"/><path d="M93 47c5-18 42-24 56 3-15-6-36-6-56-3z" fill="${hair}"/><ellipse class="blink" cx="112" cy="57" rx="3" ry="4" fill="${navy}"/><ellipse class="blink" cx="131" cy="57" rx="3" ry="4" fill="${navy}"/><path d="M115 68c4 3 8 3 12 0" stroke="#dc7f8d" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="103" cy="65" r="4" fill="#f6afc2" opacity=".55"/><circle cx="138" cy="65" r="4" fill="#f6afc2" opacity=".55"/><path d="M88 84c9-9 55-9 65 0l12 54H76z" fill="${outfit}"/><path d="M107 84l13 14 13-14" fill="#ffffff" opacity=".92"/>${p}<path d="M85 38c-9 10-15 23-17 38-9-15-6-32 3-45z" fill="${hair}" opacity=".95"/>${detail||""}</g>`;
  };
  if(page==="travel"){
    return wrap(`<stop offset="0%" stop-color="#eef6ff"/><stop offset="48%" stop-color="#f4efff"/><stop offset="100%" stop-color="#fff3f8"/>`,
      `<circle cx="354" cy="34" r="20" fill="#fff0c7" opacity=".95"/><path d="M24 118h126" stroke="#d06f8a" stroke-width="5" stroke-linecap="round" opacity=".55"/><g transform="translate(18 20)"><path d="M24 94V48h78v46M10 59h106M32 59v35M57 59v35M81 59v35" stroke="#d94e5a" stroke-width="6" fill="none"/><path d="M96 94l34-48 34 48z" fill="#9ac8e8" opacity=".85"/><path d="M114 70l16-24 16 24z" fill="#fff"/></g><g transform="translate(268 44)"><path d="M0 54c14-24 30-38 49-38 18 0 34 12 47 38" fill="#9ec3ff" opacity=".5"/><path d="M14 54c10-16 22-25 35-25 13 0 26 9 37 25" fill="#ffffff" opacity=".78"/></g><g fill="#ffb1c8" opacity=".92"><circle cx="69" cy="26" r="4"/><circle cx="82" cy="34" r="3"/><circle cx="320" cy="24" r="4"/><circle cx="333" cy="34" r="3"/><circle cx="347" cy="28" r="3"/></g>`,
      girl(208,6,1.03,'#352f57','#f3adc2','<path d="M82 86c8 5 16 9 23 12" stroke="#ffffffaa" stroke-width="4" stroke-linecap="round"/>','sight'),
      `<path d="M0 122c80-16 168-15 250 2" stroke="url(#mist)" stroke-width="26" opacity=".55"/><circle cx="378" cy="26" r="3" fill="#6fb6ff"/><circle cx="390" cy="38" r="2.5" fill="#ff94c6"/>`);
  }
  if(page==="study" || page==="reading" || key==="growth"){
    return wrap(`<stop offset="0%" stop-color="#fff4df"/><stop offset="48%" stop-color="#f6efff"/><stop offset="100%" stop-color="#f4f8ff"/>`,
      `<g transform="translate(24 26)"><rect x="0" y="58" width="118" height="16" rx="8" fill="#e8d5ae"/><rect x="8" y="40" width="102" height="18" rx="6" fill="#f3c985"/><rect x="15" y="22" width="92" height="18" rx="6" fill="#d6b5f0"/><rect x="22" y="4" width="78" height="18" rx="6" fill="#ef9d3c"/><path d="M28 10h42M24 28h54M17 46h62M10 64h76" stroke="#fff" stroke-opacity=".85" stroke-width="3"/></g><g transform="translate(314 34)"><circle cx="23" cy="23" r="19" fill="#fff0b8"/><path d="M23 12v22M12 23h22" stroke="#ef9d3c" stroke-width="3"/></g>`,
      girl(206,8,1.02,'#2c2b43','#c8b0e9','<path d="M96 24c14 6 22 18 25 34" stroke="#4d436f" stroke-width="5" stroke-linecap="round" opacity=".55"/>','book'),
      `<path d="M0 118c90-18 186-16 276 5" stroke="url(#mist)" stroke-width="22" opacity=".58"/>`);
  }
  if(page==="movie"){
    return wrap(`<stop offset="0%" stop-color="#f1f5ff"/><stop offset="45%" stop-color="#eef0ff"/><stop offset="100%" stop-color="#fff0f5"/>`,
      `<rect x="18" y="24" width="146" height="90" rx="20" fill="#222b43"/><path d="M30 34l18 0M56 34l18 0M82 34l18 0M108 34l18 0M134 34l18 0M30 103l18 0M56 103l18 0M82 103l18 0M108 103l18 0M134 103l18 0" stroke="#ffffff55" stroke-width="6"/><circle cx="92" cy="69" r="20" fill="#58bce8"/><path d="M85 57l16 12-16 12z" fill="#fff"/>`,
      girl(220,8,1.02,'#5b3a50','#6cb1e7','', 'tablet'),
      `<circle cx="343" cy="27" r="4" fill="#ffc472"/><circle cx="356" cy="36" r="3" fill="#ff94c6"/>`);
  }
  if(page==="game"){
    return wrap(`<stop offset="0%" stop-color="#eff2ff"/><stop offset="45%" stop-color="#f3edff"/><stop offset="100%" stop-color="#faf5ff"/>`,
      `<rect x="18" y="26" width="150" height="88" rx="20" fill="#4f9d62"/><path d="M93 26v88M18 70h150" stroke="#fff" stroke-opacity=".75"/><circle cx="93" cy="70" r="20" stroke="#fff" fill="none" stroke-width="3"/><rect x="18" y="48" width="26" height="44" stroke="#fff" fill="none"/><rect x="142" y="48" width="26" height="44" stroke="#fff" fill="none"/>`,
      `<g class="float" transform="translate(234 6)"><ellipse cx="120" cy="134" rx="58" ry="8" fill="#4d4f7e22"/><path d="M86 61c4-26 25-40 48-40s43 16 47 41v28H86z" fill="#232840"/><circle cx="133" cy="57" r="28" fill="#ffd8c2"/><path d="M104 46c8-19 42-23 59 2-16-5-38-5-59-2z" fill="#232840"/><ellipse class="blink" cx="124" cy="58" rx="3" ry="4" fill="#263455"/><ellipse class="blink" cx="143" cy="58" rx="3" ry="4" fill="#263455"/><path d="M128 69c4 3 8 3 12 0" stroke="#dc7f8d" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M102 86c11-9 55-9 66 0l10 50H91z" fill="#1f2437"/><path d="M112 91c14 14 31 18 47 15" stroke="#e54848" stroke-width="5"/><path d="M96 96l18 8-7 14-19-11z" fill="#ffd8c2"/><path d="M149 97l18 8-7 14-19-11z" fill="#ffd8c2"/><rect x="109" y="98" width="47" height="22" rx="10" fill="#1d2235" stroke="#59617e"/><circle cx="123" cy="109" r="4" fill="#fff"/><circle cx="142" cy="106" r="3" fill="#ff6b8a"/><path d="M111 47l-10 12c-8 10-13 20-15 30" stroke="#e44b64" stroke-width="7" fill="none" stroke-linecap="round"/></g>`,
      `<circle cx="340" cy="26" r="3" fill="#7c5cff"/><circle cx="358" cy="36" r="4" fill="#ff85c0"/>`);
  }
  if(key==="finance" || page==="investment" || page==="asset"){
    return wrap(`<stop offset="0%" stop-color="#eef6ff"/><stop offset="48%" stop-color="#edf3ff"/><stop offset="100%" stop-color="#f5f8ff"/>`,
      `<g transform="translate(18 25)"><path d="M10 88V62h22v26M42 88V45h22v43M74 88V55h22v33M106 88V30h22v58" fill="#4285f4" opacity=".82"/><path d="M8 46c26 9 40-14 59-7 15 6 29-5 63-28" stroke="#2faa77" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M124 13l9 2-5 9" stroke="#2faa77" stroke-width="4" fill="none"/><rect x="2" y="94" width="130" height="10" rx="5" fill="#dbe8ff"/></g>`,
      girl(224,7,1.03,'#3a324c','#2f466a','<circle cx="142" cy="44" r="4" fill="#7569e8"/>','tablet'),
      `<circle cx="342" cy="26" r="4" fill="#4285f4"/><circle cx="357" cy="35" r="3" fill="#2faa77"/>`);
  }
  if(key==="health" || page==="diet" || page==="exercise"){
    return wrap(`<stop offset="0%" stop-color="#eefaf2"/><stop offset="48%" stop-color="#edf8f1"/><stop offset="100%" stop-color="#f9fffb"/>`,
      `<g transform="translate(18 26)"><circle cx="52" cy="44" r="32" fill="#dff5e9"/><path d="M25 70c15-6 22-20 26-38 11 9 19 23 23 38" stroke="#2faa77" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M100 21c18 0 32 15 32 34s-14 34-32 34" stroke="#9dd7b8" stroke-width="9" fill="none"/><path d="M10 54h26M24 41v26" stroke="#334a75" stroke-width="5" stroke-linecap="round"/></g>`,
      girl(226,8,1.03,'#7a553e','#ef8ca1','<path d="M98 30c-5 8-13 14-22 18" stroke="#8c684f" stroke-width="5" stroke-linecap="round"/>','sight'),
      `<circle cx="340" cy="28" r="4" fill="#2faa77"/><circle cx="356" cy="36" r="3" fill="#ff90b7"/>`);
  }
  if(key==="work" || page==="tasks" || page==="calendar" || page==="drive" || page==="settings"){
    return wrap(`<stop offset="0%" stop-color="#eef2fb"/><stop offset="50%" stop-color="#f1f5fb"/><stop offset="100%" stop-color="#f7f8fc"/>`,
      `<g transform="translate(16 24)"><rect x="0" y="0" width="148" height="94" rx="18" fill="#eef3fb" stroke="#bcc8df"/><rect x="14" y="14" width="52" height="12" rx="5" fill="#334a75" opacity=".82"/><rect x="76" y="14" width="56" height="12" rx="5" fill="#d2dcec"/><rect x="14" y="38" width="32" height="28" rx="6" fill="#fff"/><rect x="54" y="38" width="32" height="28" rx="6" fill="#fff"/><rect x="94" y="38" width="38" height="28" rx="6" fill="#fff"/><rect x="14" y="74" width="118" height="10" rx="5" fill="#dce5f3"/></g>`,
      girl(222,8,1.03,'#5a433c','#e9eff7','', 'tablet'),
      `<circle cx="344" cy="29" r="4" fill="#334a75"/><circle cx="356" cy="37" r="3" fill="#58bce8"/>`);
  }
  return wrap(`<stop offset="0%" stop-color="#eef4ff"/><stop offset="48%" stop-color="#f3efff"/><stop offset="100%" stop-color="#fff5fb"/>`,
    `<circle cx="52" cy="34" r="18" fill="#ffe7a5" opacity=".95"/><path d="M18 112c23-28 47-38 73-36 25 2 44 18 58 36" fill="#7569e815"/><circle cx="122" cy="38" r="5" fill="${c}"/><circle cx="140" cy="53" r="4" fill="#ff8fb0"/>`,
    girl(225,7,1.03,'#44354f','#7569e8','', 'tablet'),
    `<path d="M0 120c98-18 176-12 258 4" stroke="url(#mist)" stroke-width="24" opacity=".55"/>`);
}
function setBanner(key,page="home"){
  const a=aiMap[key]||aiMap.home,p=pageBannerMap[page]||{},meta=pageMeta[page]||[page,"",key];
  const el=$("aiBanner");el.style.setProperty("--banner",a.color);el.style.setProperty("--banner-soft",a.soft);el.style.setProperty("--banner-line",a.line);
  const q=pageQuote(page),quoteAgent={"하니":"hani","지은":"jieun","나은":"nauen","히나":"hina","수아":"sua","하루":"haru","수연":"suyeon","민지":"minji","유나":"yuna"}[q[0]]||"";
  const av=$("aiAvatar"),ak=quoteAgent||pageAgentImage[page],img=ak&&agentImages[ak];
  av.className="ai-avatar"+(img?" has-photo":"")+(ak?` agent-${ak}`:"");
  av.style.backgroundImage=img?`url(${img})`:"";av.textContent=img?"":(p.emoji||a.emoji);
  const km={home:"DASHBOARD",finance:"FINANCE",health:"HEALTH",growth:"GROWTH",life:"LIFE",game:"GAME",work:"WORK",team:"AI TEAM"};
  if($("aiKicker"))$("aiKicker").textContent=km[key]||String(key||page).toUpperCase();
  $("aiName").textContent=meta[0]||page;$("aiMessage").textContent=meta[1]||p.message||a.message;$("aiRole").textContent=p.name||a.name;
  if($("aiQuote"))$("aiQuote").innerHTML=`<span>${esc(q[0])} 한마디</span><b>“${esc(q[1])}”</b>`;
  /* v2.8.2: decorative scene removed; character speech is the visual focus */
}
function showView(id){
  if(!$(id))id="home";
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));$(id).classList.add("active");

document.querySelectorAll("[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===id));
  document.querySelectorAll(".group").forEach(g=>g.classList.remove("is-current"));
  const activeNav=document.querySelector(`.group .nav-btn[data-view="${id}"]`);
  activeNav?.closest(".group")?.classList.add("is-current");
  const m=pageMeta[id]||[id,"","home"];$("title").textContent=m[0];$("desc").textContent=m[1];document.body.dataset.view=id;document.body.dataset.canvasGroup=m[2]||"home";const km={home:"DASHBOARD",finance:"FINANCE",health:"HEALTH",growth:"GROWTH",life:"LIFE",game:"GAME",work:"WORK",team:"AI TEAM"};if($("pageKicker"))$("pageKicker").textContent=km[m[2]]||String(id).toUpperCase();setBanner(m[2],id);
  history.replaceState(null,"",id==="home"?location.href.split("#")[0]:("#"+id));$("app").classList.remove("mobile-open");window.scrollTo({top:0,left:0,behavior:"auto"});
  if(id==="investment")setTimeout(drawPortfolio,30);if(id==="newsroom")setTimeout(()=>investmentNewsMaybeRefresh(),40);if(id==="diet")setTimeout(drawBody,30);if(id==="ledger")setTimeout(drawLedgerTrend,30);if(id==="calendar")renderCalendar();if(id==="tasks")setTimeout(()=>googleCalendarRefreshStatus({silent:true}),0);if(id==="intake")setTimeout(()=>intakeRenderPreview(),0);if(id==="agentReview")setTimeout(()=>agentReviewInit(),0);if(id==="policy")setTimeout(()=>agentPolicyInit(),0);if(id==="deployment")setTimeout(()=>deployCenterRender(),0);
  // v2.9.2: mobile browsers can throttle background polling. Re-check Cloud when opening data-heavy views.
  if(["home","investment","asset"].includes(id)&&cloudUser&&!cloudRecoveryMode){
    setTimeout(()=>cloudSyncCycle("view-"+id),120);
  }
}

const QUICK_JUMP_ITEMS=[
  ["home","대시보드","홈 오늘 요약"],["investment","홍 스트리트","투자 주식 ETF 월간 기록"],["newsroom","뉴스룸","주식 투자 뉴스 관심종목 3시간 흐름"],["asset","자산","통합 자산 계좌"],["ledger","가계부","소비 결산 리뷰"],
  ["diet","계체량 측정","다이어트 체중 건강"],["exercise","헬스클럽","운동 걸음 근력"],["reading","성민의 서재","독서 서재 책 완독"],["study","공부","일본어 AI 학습"],
  ["university","낭만 캠퍼스 라이프","대학교 대학 캠퍼스 과목 학사일정"],["certificate","자격증","시험 일정"],["wishlist","Wish-list","위시 희망 구매 경험"],["travel","여행","여행 기록 장소 숙소"],["movie","시청 아카이브","관람 감상 아카이브"],
  ["diary","일기","오늘 기록"],["game","게임","FM 전술"],["tasks","할 일","태스크 월간"],["calendar","캘린더","일정"],
  ["work","업무 보조","업무 후속조치"],["drive","Drive","구글 드라이브"],["deployment","배포 센터","릴리스 GitHub 브랜치 PR 자동배포"],["intake","성민 오피스","유나 인턴 데스크 자료 입력 자동 분류 Preview 승인"],["agentReview","AI 결재실","AI 심의 결재 승인 보류 반려 수정"],["policy","사내 규칙","Policy Registry 규정 학습 원칙 Evidence"],["aiTeam","AI 팀","캐릭터 파트너"],["settings","설정 / 데이터","백업 복원 클라우드"]
];
function quickJumpMatches(query=""){
  const q=String(query||"").trim().toLocaleLowerCase("ko-KR");
  return QUICK_JUMP_ITEMS.filter(row=>!q||row.slice(1).join(" ").toLocaleLowerCase("ko-KR").includes(q)).slice(0,9);
}
function renderQuickJump(query=""){
  const menu=$("quickJumpMenu");if(!menu)return;
  const rows=quickJumpMatches(query);
  menu.innerHTML=rows.map(([id,name,keywords])=>`<button type="button" class="quick-jump-item" data-quick-view="${id}" role="option"><b>${esc(name)}</b><span>${esc((pageMeta[id]?.[1]||keywords))}</span></button>`).join("")||'<div class="quick-jump-empty">일치하는 메뉴가 없어요.</div>';
  menu.querySelectorAll("[data-quick-view]").forEach(btn=>btn.onclick=e=>{e.stopPropagation();showView(btn.dataset.quickView);closeQuickJump();});
}
function openQuickJump(){const box=$("quickJump");if(!box)return;box.classList.add("open");renderQuickJump($("quickJumpInput")?.value||"");}
function closeQuickJump(){$("quickJump")?.classList.remove("open");}
function setupQuickJump(){
  const box=$("quickJump"),input=$("quickJumpInput");if(!box||!input)return;
  input.addEventListener("focus",openQuickJump);
  input.addEventListener("input",()=>{openQuickJump();renderQuickJump(input.value)});
  input.addEventListener("keydown",e=>{
    if(e.key==="Escape"){closeQuickJump();input.blur();return}
    if(e.key==="Enter"){
      const first=$("quickJumpMenu")?.querySelector("[data-quick-view]");
      if(first){showView(first.dataset.quickView);input.value="";closeQuickJump();input.blur()}
    }
  });
  box.addEventListener("click",e=>{if(window.innerWidth<=900&&e.target!==input){e.stopPropagation();openQuickJump()}});
  document.addEventListener("click",e=>{if(!box.contains(e.target))closeQuickJump()});
}

function setupInvestmentRc21Layout(){
const section=$("investment"),tabs=section?.querySelector('.investment-tabs-main');if(!section||!tabs)return;
tabs.innerHTML='<button class="tab active" data-panel="investOverview">투자 현황</button><button class="tab" data-panel="investMonthly">월간 기록</button><button class="tab" data-panel="investManage">종목 관리</button><button class="tab" data-panel="investJournal">투자 일기</button>';
const newsPanel=$("investNews"),newsroomMount=$("newsroomMount");if(newsPanel&&newsroomMount){newsPanel.classList.remove("panel","active");newsPanel.classList.add("newsroom-content");newsroomMount.appendChild(newsPanel)}
["investYearly","investCashFlow","investWatchlist","investJournal","investAccounts","investInstruments","investHoldings","investTransactions"].forEach(id=>{const el=$(id);if(el&&el.parentElement!==section)section.appendChild(el)});
// RC2까지의 구 투자현황 패널은 호환용 DOM으로 보존한다. 새 대시보드와 ID가 충돌하지 않게 분리한다.
const oldOverview=$("investOverview");if(oldOverview){oldOverview.id="investLegacyOverview";oldOverview.classList.remove("active");oldOverview.classList.add("rc1-hidden");if(oldOverview.parentElement!==section)section.appendChild(oldOverview)}
let overview=document.createElement('div');overview.id='investOverview';overview.className='panel active';overview.dataset.rc21Shell='1';section.insertBefore(overview,$("investMonthly"));
let manage=$("investManage");if(!manage){manage=document.createElement('div');manage.id='investManage';manage.className='panel';section.insertBefore(manage,$("investJournal"))}
$("investMonthly")?.classList.remove('active');
overview.innerHTML=`<div class="investment-overview-head"><div><b style="font-size:17px">내 투자 흐름을 한 곳에서 봅니다.</b><div class="sub">전체 → 계좌 → 종목 순서로 파고들어 확인할 수 있습니다.</div></div><div class="field"><label>분석 연도</label><select id="overviewYearSelect"></select></div></div><div class="tabs investment-overview-tabs" data-tabs="investmentOverviewTabs"><button class="tab active" data-panel="investOverviewAll">전체</button><button class="tab" data-panel="investOverviewAccounts">계좌별</button><button class="tab" data-panel="investOverviewStocks">종목별</button></div><div id="investOverviewAll" class="panel investment-overview-pane active"></div><div id="investOverviewAccounts" class="panel investment-overview-pane"><div class="card full"><div class="sh"><h3>계좌별 현황</h3><div class="overview-account-toolbar"><div class="field"><label>계좌 선택</label><select id="overviewAccountSelect"></select></div></div></div><div class="broker-stats account-overview-stats" id="overviewAccountStats"></div></div><div class="grid"><div class="card full"><div class="sh"><h3>선택 계좌 자산 변화</h3><span class="pill finance">ACCOUNT TREND</span></div><div class="chart"><canvas id="overviewAccountChart"></canvas></div></div><div class="card full"><div class="sh"><h3>최근 보유종목</h3></div><div class="tw"><table><thead><tr><th>종목</th><th>수량</th><th>평균단가</th><th>현재가</th><th>평가금액</th><th>평가손익</th><th>수익률</th></tr></thead><tbody id="overviewAccountHoldingRows"></tbody></table></div></div></div></div><div id="investOverviewStocks" class="panel investment-overview-pane"></div>`;
const all=$("investOverviewAll"),stocks=$("investOverviewStocks"),monthly=$("investMonthly"),yearly=$("investYearly"),watch=$("investWatchlist"),inst=$("investInstruments");
const monthNote=monthly?.querySelector('.investment-archive-note');if(monthNote){const b=monthNote.querySelector('b');if(b)b.textContent='한 달에 한 번, 증권사 화면을 그대로 기록합니다.'}
const bstats=$("brokerDashboardStats"),assetCard=$("brokerAssetChart")?.closest('.card'),latestCard=$("brokerLatestSummary")?.closest('.card'),holdingCard=$("brokerLatestHoldingRows")?.closest('.card');
if(bstats)all.appendChild(bstats);const hc=document.createElement('div');hc.className='card full';hc.innerHTML='<div class="sh"><h3>이번 달 하이라이트</h3><span class="pill finance">MONTHLY PICKS</span></div><div class="monthly-highlight-grid" id="investmentHighlights"></div>';all.appendChild(hc);
const topGrid=document.createElement('div');topGrid.className='grid';all.appendChild(topGrid);[assetCard,latestCard,holdingCard].filter(Boolean).forEach(x=>topGrid.appendChild(x));
if(yearly){const yearCard=$("annualInvestmentStats")?.closest('.card'),annualAsset=$("annualAssetChart")?.closest('.card'),monthList=$("annualMonthList")?.closest('.card'),stockFlow=$("annualStockSelect")?.closest('.card'),stockDetail=$("annualStockHistoryRows")?.closest('.card'),stockAccounts=$("annualStockAccounts")?.closest('.card'),stockSummary=$("annualStockRows")?.closest('.card');const yf=$("annualInvestmentYear")?.closest('.field');if(yf)yf.classList.add('rc1-hidden');const ag=document.createElement('div');ag.className='grid';all.appendChild(ag);[yearCard,annualAsset,monthList].filter(Boolean).forEach(x=>ag.appendChild(x));const sg=document.createElement('div');sg.className='grid';stocks.appendChild(sg);[stockFlow,stockDetail,stockAccounts,stockSummary].filter(Boolean).forEach(x=>sg.appendChild(x));yearly.remove()}
if(monthly){const editor=$("brokerEditorCard"),archive=$("brokerSnapshotRows")?.closest('.card'),oldGrid=editor?.parentElement;if(editor&&archive){const rg=document.createElement('div');rg.className='grid investment-record-grid';if(monthNote)monthNote.after(rg);else monthly.prepend(rg);rg.appendChild(editor);rg.appendChild(archive);if(oldGrid&&oldGrid.classList.contains('grid')&&!oldGrid.children.length)oldGrid.remove()}}
if(manage){manage.innerHTML='<div class="instrument-manager-note"><b>종목 관리 = 투자 모듈의 종목 마스터</b><br>여기서 종목을 한 번 등록하면 월간 기록의 종목 선택지에 자동으로 나타납니다. 보유수량·평단·수익률은 여기서 수정하지 않고 월간 기록과 투자 현황에서 관리합니다.</div><div id="manageMasterSlot"></div><div class="manage-section" id="manageWatchSlot"></div>';if(inst){const g=inst.querySelector(':scope > .grid');if(g)$("manageMasterSlot").appendChild(g);inst.remove()}if(watch){while(watch.firstChild)$("manageWatchSlot").appendChild(watch.firstChild);watch.remove()}const price=$("instrumentPrice")?.closest('.field');if(price)price.classList.add('rc1-hidden');const fg=$("instrumentName")?.closest('.fg');if(fg&&!$("instrumentMarket")){const hidden=document.createElement('input');hidden.type='hidden';hidden.id='instrumentEditId';fg.parentElement.insertBefore(hidden,fg);const field=document.createElement('div');field.className='field';field.innerHTML='<label>시장</label><select id="instrumentMarket"><option value="">자동/미지정</option><option value="KR">한국</option><option value="US">미국</option><option value="OTHER">기타</option></select>';const tickerField=$("instrumentTicker")?.closest('.field');fg.insertBefore(field,tickerField)}const table=$("instrumentRows")?.closest('table');if(table)table.querySelector('thead').innerHTML='<tr><th>종목</th><th>분류</th><th>시장</th><th>코드 / 티커</th><th>보유계좌</th><th>관리</th></tr>';if($("addInstrument"))$("addInstrument").textContent='종목 저장'}
[$("investAccounts"),$("investHoldings"),$("investTransactions"),$("investCashFlow")].filter(Boolean).forEach(x=>x.classList.add('rc1-hidden'));
}
setupInvestmentRc21Layout();
document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.go)));
if($("homeYunaQuick"))$("homeYunaQuick").onclick=()=>{showView("intake");setTimeout(()=>$("yunaInput")?.focus(),80)};
const GROUP_COLLAPSE_KEY="hani_os_group_collapse_v1";
function savedCollapsedGroups(){
  try{const v=JSON.parse(localStorage.getItem(GROUP_COLLAPSE_KEY)||"[]");return Array.isArray(v)?v:[]}catch(e){return []}
}
function persistCollapsedGroups(){
  const vals=[...document.querySelectorAll(".group.collapsed")].map(g=>g.dataset.color).filter(Boolean);
  try{localStorage.setItem(GROUP_COLLAPSE_KEY,JSON.stringify(vals))}catch(e){}
}
savedCollapsedGroups().forEach(k=>document.querySelector(`.group[data-color="${k}"]`)?.classList.add("collapsed"));
document.querySelectorAll(".group-head").forEach(b=>b.addEventListener("click",()=>{
  b.closest(".group").classList.toggle("collapsed");
  persistCollapsedGroups();
}));
document.querySelectorAll("[data-tabs]").forEach(t=>t.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>{t.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");const parent=t.parentElement;parent.querySelectorAll(":scope > .panel").forEach(x=>x.classList.remove("active"));$(b.dataset.panel).classList.add("active");if(t.classList.contains("investment-tabs-main"))t.scrollIntoView({behavior:"smooth",block:"start"});if(b.dataset.panel==="investNews")setTimeout(()=>investmentNewsMaybeRefresh(),40);setTimeout(()=>{drawPortfolio();drawBody();drawLedgerTrend();drawMonthlyAssetChart();drawBrokerChart();drawAnnualInvestmentCharts();drawInvestmentAccountChart()},30)})));
document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>closeModal(b.dataset.close)));
document.querySelectorAll(".modal").forEach(m=>m.addEventListener("click",e=>{if(e.target===m)m.classList.remove("open")}));
$("sideToggle").onclick=()=>{const mini=$("app").classList.toggle("sidebar-mini");localStorage.setItem(SIDEBAR_KEY,mini?"1":"0");$("sideToggle").textContent=mini?"›":"‹"};
$("mobileMenu").onclick=()=>$("app").classList.add("mobile-open");$("overlay").onclick=()=>$("app").classList.remove("mobile-open");
if(localStorage.getItem(SIDEBAR_KEY)==="1"){$("app").classList.add("sidebar-mini");$("sideToggle").textContent="›"}
const SEASON_THEMES={
  spring:{label:"봄",icon:"🌸",themeColor:"#f7f5ff"},
  summer:{label:"여름",icon:"🌊",themeColor:"#f1fbfb"},
  autumn:{label:"가을",icon:"🍂",themeColor:"#fff8f0"},
  winter:{label:"겨울",icon:"❄️",themeColor:"#f3f7fc"}
};
function defaultSeasonTheme(){
  const m=new Date().getMonth()+1;
  return [3,4,5].includes(m)?"spring":[6,7,8].includes(m)?"summer":[9,10,11].includes(m)?"autumn":"winter";
}
function applySeasonTheme(key,saveChoice=false){
  if(!SEASON_THEMES[key])key="spring";
  delete document.documentElement.dataset.theme;
  document.documentElement.dataset.season=key;
  if(saveChoice)localStorage.setItem(SEASON_THEME_KEY,key);
  const meta=document.querySelector('meta[name="theme-color"]');
  if(meta)meta.setAttribute("content",SEASON_THEMES[key].themeColor);
  if($("theme"))$("theme").innerHTML=`${SEASON_THEMES[key].icon} <span>${SEASON_THEMES[key].label} 테마</span>`;
  setTimeout(()=>{drawPortfolio();drawBody();drawLedgerTrend();drawMonthlyAssetChart();drawBrokerChart();drawAnnualInvestmentCharts();drawInvestmentAccountChart();if(activeAccountId)drawAccountChart(activeAccountId)},30);
}
const initialSeason=localStorage.getItem(SEASON_THEME_KEY)||defaultSeasonTheme();
applySeasonTheme(initialSeason,false);
$("theme").onclick=()=>{
  const order=["spring","summer","autumn","winter"],current=document.documentElement.dataset.season||"spring";
  applySeasonTheme(order[(order.indexOf(current)+1)%order.length],true);
};

const LOGIN_GATE_LINES={
  hani:"오늘도 기록 하나면 충분해. 갓생은 누적이야.",
  jieun:"숫자는 혼내려고 보는 게 아니라 다음 달을 편하게 만들려고 보는 거야.",
  nauen:"완벽한 하루보다 계속 가는 하루가 더 세다.",
  hina:"오늘 한 페이지, 한 문장이 결국 실력이 돼요!",
  sua:"해야 할 일은 머리가 아니라 시스템이 기억하게 해요.",
  haru:"별일 없는 오늘도 나중엔 꽤 재밌는 기록이 돼.",
  suyeon:"감독님, 오늘도 한 경기씩 시즌을 만들어갑시다."
};
function loginGateStatus(message,tone=""){
  const el=$("loginGateStatus");if(!el)return;
  el.textContent=message||"";
  el.dataset.tone=tone||"";
}
function syncLoginThemeButtons(){
  const current=document.documentElement.dataset.season||"spring";
  document.querySelectorAll("[data-login-theme]").forEach(b=>b.classList.toggle("active",b.dataset.loginTheme===current));
}
function randomizeLoginCharacter(){
  const available=(team||[]).filter(x=>agentImages?.[x.key]);
  if(!available.length)return;
  const pick=available[Math.floor(Math.random()*available.length)];
  loginGateCharacterKey=pick.key;
  const photo=$("loginCharacterPhoto");
  if(photo)photo.style.backgroundImage=`url(${agentImages[pick.key]})`;
  if($("loginCharacterName"))$("loginCharacterName").textContent=pick.name;
  if($("loginCharacterRole"))$("loginCharacterRole").textContent=pick.role;
  if($("loginCharacterQuote"))$("loginCharacterQuote").textContent=`“${LOGIN_GATE_LINES[pick.key]||"오늘도 천천히, 꾸준히 이어가요."}”`;
}
function loginGateSessionActive(){
  try{
    if(localStorage.getItem(HANI_GATE_SESSION_KEY)==="1")return true;
    if(sessionStorage.getItem(HANI_GATE_SESSION_KEY)==="1"){localStorage.setItem(HANI_GATE_SESSION_KEY,"1");return true}
    return false
  }catch(e){return false}
}
function markLoginGateSession(){
  try{localStorage.setItem(HANI_GATE_SESSION_KEY,"1")}catch(e){console.warn("Gate session marker failed",e)}
}
function clearLoginGateSession(){
  try{localStorage.removeItem(HANI_GATE_SESSION_KEY);sessionStorage.removeItem(HANI_GATE_SESSION_KEY)}catch(e){console.warn("Gate session marker clear failed",e)}
}
function lockLoginGate(message="이메일과 비밀번호로 로그인해 주세요."){
  loginGateUnlocked=false;
  const gate=$("loginGate"),app=$("app");
  gate?.classList.remove("is-hidden","is-recovery");
  app?.classList.add("login-locked");
  app?.setAttribute("aria-hidden","true");
  if($("loginNormalPanel"))$("loginNormalPanel").style.display="";
  if($("loginRecoveryPanel"))$("loginRecoveryPanel").style.display="none";
  if($("loginGateTitle"))$("loginGateTitle").textContent="HANI OS 로그인";
  if($("loginGateSubtitle"))$("loginGateSubtitle").textContent="오늘의 기록을 이어가려면 로그인해 주세요.";
  if(message)loginGateStatus(message);
  setTimeout(()=>$("loginGatePassword")?.focus(),80);
}
function showLoginRecoveryGate(message="복구 링크를 확인하고 있습니다."){
  loginGateUnlocked=false;
  const gate=$("loginGate"),app=$("app");
  gate?.classList.remove("is-hidden");
  gate?.classList.add("is-recovery");
  app?.classList.add("login-locked");
  app?.setAttribute("aria-hidden","true");
  if($("loginNormalPanel"))$("loginNormalPanel").style.display="none";
  if($("loginRecoveryPanel"))$("loginRecoveryPanel").style.display="";
  if($("loginGateTitle"))$("loginGateTitle").textContent="비밀번호 재설정";
  if($("loginGateSubtitle"))$("loginGateSubtitle").textContent="새 비밀번호를 정한 뒤 다시 로그인하면 됩니다.";
  loginGateStatus(message,"warn");
}
function unlockLoginGate(){
  loginGateUnlocked=true;
  const gate=$("loginGate"),app=$("app");
  app?.classList.remove("login-locked");
  app?.setAttribute("aria-hidden","false");
  gate?.classList.add("is-hidden");
}
function loginGateConfig(email=""){
  const cfg=cloudConfig(),nextEmail=String(email||cfg.email||"").trim();
  const next={url:cfg.url,key:cfg.key,email:nextEmail};
  cloudSaveJson(CLOUD_CONFIG_KEY,next);
  if($("cloudEmail"))$("cloudEmail").value=nextEmail;
  return next;
}
async function loginGateSubmit(){
  const email=$("loginGateEmail")?.value.trim()||"",password=$("loginGatePassword")?.value||"";
  if(!email)return loginGateStatus("이메일을 입력해 주세요.","error");
  if(!password)return loginGateStatus("비밀번호를 입력해 주세요.","error");
  const btn=$("loginGateSubmit"),original=btn?.textContent;
  try{
    if(btn){btn.disabled=true;btn.textContent="로그인 중…"}
    const cfg=loginGateConfig(email);
    if(!cloudClient)cloudCreateClient(cfg);
    loginGateStatus("HANI Cloud 계정을 확인하고 있습니다.","loading");
    const {data,error}=await cloudClient.auth.signInWithPassword({email,password});
    if(error)throw error;
    cloudUser=data?.user||data?.session?.user||null;
    if(!cloudUser)throw new Error("로그인 세션을 만들지 못했습니다.");
    $("loginGatePassword").value="";
    markLoginGateSession();
    unlockLoginGate();
    // v2.9.8: a fresh credential login always starts from Dashboard; refresh/session restore keeps the current hash.
    showView("home");
    cloudSetRuntime("로그인 완료","HANI OS 로그인 완료. Local을 먼저 열고 Cloud 동기화를 확인합니다.","ok",{sync:"CHECK"});
    try{
      await cloudFetchMeta({silent:true});
      cloudBindLifecycle();
      await cloudSyncCycle("login-gate");
    }catch(syncError){
      console.warn("Post-login Cloud sync",syncError);
      cloudAutoSyncReady=false;
      cloudSetRuntime("로그인 완료 · 동기화 확인 필요","로그인은 유지됩니다. Cloud 동기화는 다음 저장/포커스에서 다시 확인합니다.","warn",{sync:"CHECK"});
    }
    toast("갓생살기 프로젝트에 로그인했습니다.");
  }catch(e){
    console.error("Login gate",e);
    if($("loginGatePassword"))$("loginGatePassword").value="";
    loginGateStatus(e?.message||"로그인에 실패했습니다.","error");
  }finally{
    if(btn){btn.disabled=false;btn.textContent=original||"갓생살기 프로젝트 시작하기"}
  }
}
async function loginGateForgotPassword(){
  const email=$("loginGateEmail")?.value.trim()||"";
  if(!email)return loginGateStatus("비밀번호를 재설정할 이메일을 입력해 주세요.","error");
  try{
    const cfg=loginGateConfig(email);
    if(!cloudClient)cloudCreateClient(cfg);
    loginGateStatus("비밀번호 재설정 메일을 보내고 있습니다.","loading");
    const redirectTo=location.origin+location.pathname;
    const {error}=await cloudClient.auth.resetPasswordForEmail(email,{redirectTo});
    if(error)throw error;
    loginGateStatus("재설정 메일을 보냈어요. 가장 최신 메일의 링크를 열어 주세요.","ok");
  }catch(e){
    console.error("Password reset request",e);
    loginGateStatus(e?.message||"비밀번호 재설정 메일 발송에 실패했습니다.","error");
  }
}
async function loginGateSaveRecoveryPassword(){
  const pw=$("loginGateNewPassword")?.value||"",confirmPw=$("loginGateNewPasswordConfirm")?.value||"";
  if(pw.length<8)return loginGateStatus("새 비밀번호는 8자 이상으로 입력해 주세요.","error");
  if(pw!==confirmPw)return loginGateStatus("새 비밀번호와 확인 값이 서로 달라요.","error");
  const btn=$("loginGateRecoverySave"),original=btn?.textContent;
  try{
    if(btn){btn.disabled=true;btn.textContent="변경 중…"}
    if(!cloudClient)throw new Error("복구 세션이 준비되지 않았습니다. 최신 복구 링크를 다시 열어 주세요.");
    const {data:sessionData,error:sessionError}=await cloudClient.auth.getSession();
    if(sessionError)throw sessionError;
    if(!sessionData?.session)throw new Error("복구 세션이 없습니다. 최신 복구 메일의 링크를 다시 열어 주세요.");
    const {data,error}=await cloudClient.auth.updateUser({password:pw});
    if(error)throw error;
    cloudUser=data?.user||sessionData.session.user||null;
    cloudRecoveryMode=false;
    cloudCleanAuthUrl();
    if($("loginGateNewPassword"))$("loginGateNewPassword").value="";
    if($("loginGateNewPasswordConfirm"))$("loginGateNewPasswordConfirm").value="";
    if(cloudUser?.email&&$("loginGateEmail"))$("loginGateEmail").value=cloudUser.email;
    loginGateConfig(cloudUser?.email||$("loginGateEmail")?.value||"");
    // Password reset always returns to a fresh login gate.
    clearLoginGateSession();
    try{await cloudClient.auth.signOut()}catch(e){console.warn("Post-recovery signout",e)}
    cloudUser=null;
    lockLoginGate("비밀번호가 변경됐어요. 새 비밀번호로 로그인해 주세요.");
  }catch(e){
    console.error("Gate password recovery",e);
    loginGateStatus(e?.message||"비밀번호 변경에 실패했습니다.","error");
  }finally{
    if(btn){btn.disabled=false;btn.textContent=original||"새 비밀번호 저장"}
  }
}
function initLoginGate(){
  const cfg=cloudConfig();
  if($("loginGateEmail"))$("loginGateEmail").value=cfg.email||"";
  randomizeLoginCharacter();
  syncLoginThemeButtons();
  document.querySelectorAll("[data-login-theme]").forEach(btn=>btn.onclick=()=>{
    applySeasonTheme(btn.dataset.loginTheme,true);
    syncLoginThemeButtons();
  });
  if($("loginGateSubmit"))$("loginGateSubmit").onclick=loginGateSubmit;
  if($("loginGateForgot"))$("loginGateForgot").onclick=loginGateForgotPassword;
  if($("loginGateRecoverySave"))$("loginGateRecoverySave").onclick=loginGateSaveRecoveryPassword;
  if($("loginGatePassword"))$("loginGatePassword").addEventListener("keydown",e=>{if(e.key==="Enter")loginGateSubmit()});
  if($("loginGateNewPasswordConfirm"))$("loginGateNewPasswordConfirm").addEventListener("keydown",e=>{if(e.key==="Enter")loginGateSaveRecoveryPassword()});
  lockLoginGate("HANI Cloud 연결을 준비하고 있습니다.");
}


function txSorted(){return [...state.transactions].sort((a,b)=>(a.date||"").localeCompare(b.date||"")||(a.createdAt||"").localeCompare(b.createdAt||""))}
function calculate(){
  const acc={};state.accounts.forEach(a=>acc[a.id]={cash:n(a.openingCash),deposits:0,withdrawals:0,holdings:{}});
  for(const t of txSorted()){
    const A=acc[t.accountId];if(!A)continue;
    const amount=n(t.amount),qty=n(t.qty),price=n(t.price),fee=n(t.fee);
    if(t.type==="입금"){A.cash+=amount;A.deposits+=amount;continue}
    if(t.type==="출금"){A.cash-=amount;A.withdrawals+=amount;continue}
    if(t.type==="현금조정"){A.cash+=amount;continue}
    if(!t.instrumentId)continue;
    const H=A.holdings[t.instrumentId]||(A.holdings[t.instrumentId]={qty:0,avg:0,cost:0});
    if(t.type==="매수"){
      const addCost=qty*price+fee;H.cost+=addCost;H.qty+=qty;H.avg=H.qty>0?H.cost/H.qty:0;A.cash-=addCost;
    }else if(t.type==="매도"){
      const sellQty=Math.min(qty,H.qty);const removed=H.avg*sellQty;H.qty-=sellQty;H.cost=Math.max(0,H.cost-removed);H.avg=H.qty>0?H.cost/H.qty:0;A.cash+=qty*price-fee;
    }
  }
  let totalCash=0,totalMarket=0,totalCost=0;const holdings=[];
  state.accounts.forEach(a=>{const A=acc[a.id];A.market=0;A.cost=0;Object.entries(A.holdings).forEach(([instrumentId,h])=>{if(h.qty<=0.00000001)return;const i=instrumentBy(instrumentId);const enteredPrice=n(i?.price),valuationPrice=enteredPrice>0?enteredPrice:h.avg;const market=h.qty*valuationPrice;const pnl=market-h.cost;A.market+=market;A.cost+=h.cost;holdings.push({accountId:a.id,instrumentId,qty:h.qty,avg:h.avg,cost:h.cost,valuationPrice,priceFallback:enteredPrice<=0,market,pnl,rate:h.cost?pnl/h.cost*100:0})});A.total=A.cash+A.market;totalCash+=A.cash;totalMarket+=A.market;totalCost+=A.cost});
  return {accounts:acc,holdings,totalCash,totalMarket,totalCost,total:totalCash+totalMarket,pnl:totalMarket-totalCost};
}
function availableQty(accountId,instrumentId){return calculate().holdings.find(h=>h.accountId===accountId&&h.instrumentId===instrumentId)?.qty||0}


function monthKeyNow(){return today().slice(0,7)}
function lastDayOfMonth(period){const [y,m]=String(period||monthKeyNow()).split("-").map(Number),d=new Date(y,m,0);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function nextMonthKey(period){const [y,m]=String(period||monthKeyNow()).split("-").map(Number),d=new Date(y,m,1);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`}
function monthlyHoldingBase(h={}){return {id:h.id||uid(),instrumentId:h.instrumentId||"",name:String(h.name||""),ticker:String(h.ticker||""),currency:h.currency||"KRW",quantity:Math.max(0,n(h.quantity)),averagePrice:Math.max(0,n(h.averagePrice)),currentPrice:Math.max(0,n(h.currentPrice))}}
function monthlyAccountBase(a={}){return {id:a.id||uid(),accountId:a.accountId||"",accountName:a.accountName||"계좌",cash:Math.max(0,n(a.cash)),brokerTotal:a.brokerTotal===null||a.brokerTotal===undefined||a.brokerTotal===""?null:Math.max(0,n(a.brokerTotal)),externalDeposit:Math.max(0,n(a.externalDeposit)),externalWithdrawal:Math.max(0,n(a.externalWithdrawal)),dividendInterest:Math.max(0,n(a.dividendInterest)),feesTaxes:Math.max(0,n(a.feesTaxes)),transferIn:Math.max(0,n(a.transferIn)),transferOut:Math.max(0,n(a.transferOut)),holdings:Array.isArray(a.holdings)?a.holdings.map(monthlyHoldingBase):[]}}
function normalizeMonthlySnapshot(x={}){const now=new Date().toISOString(),period=/^\d{4}-\d{2}$/.test(String(x.period||""))?x.period:monthKeyNow();return {id:x.id||uid(),mode:x.mode==="actual"?"actual":"practice",period,snapshotDate:x.snapshotDate||lastDayOfMonth(period),status:x.status==="confirmed"?"confirmed":"draft",note:String(x.note||""),accounts:Array.isArray(x.accounts)?x.accounts.map(monthlyAccountBase):[],createdAt:x.createdAt||now,updatedAt:x.updatedAt||x.createdAt||now,revision:Math.max(1,n(x.revision)||1)}}
function monthlyBlankDraft(mode="practice"){return normalizeMonthlySnapshot({mode,period:monthKeyNow(),snapshotDate:today(),status:"draft",accounts:state.accounts.map(a=>monthlyAccountBase({accountId:a.id,accountName:a.name}))})}
function monthlyCalc(snapshot){
  const accountResults=(snapshot?.accounts||[]).map(a=>{const holdings=(a.holdings||[]).map(h=>{const cost=n(h.quantity)*n(h.averagePrice),market=n(h.quantity)*n(h.currentPrice),pnl=market-cost;return {...h,cost,market,pnl,rate:cost?pnl/cost*100:null}}),market=holdings.reduce((sum,h)=>sum+h.market,0),cost=holdings.reduce((sum,h)=>sum+h.cost,0),pnl=market-cost,total=n(a.cash)+market,externalNet=n(a.externalDeposit)-n(a.externalWithdrawal),transferNet=n(a.transferIn)-n(a.transferOut),brokerTotal=a.brokerTotal===null||a.brokerTotal===undefined?null:n(a.brokerTotal),reconcileDiff=brokerTotal===null?null:brokerTotal-total;return {...a,holdings,market,cost,pnl,total,externalNet,transferNet,brokerTotal,reconcileDiff,cashRatio:total?n(a.cash)/total*100:0}});
  const total=accountResults.reduce((sum,a)=>sum+a.total,0),cash=accountResults.reduce((sum,a)=>sum+n(a.cash),0),market=accountResults.reduce((sum,a)=>sum+a.market,0),cost=accountResults.reduce((sum,a)=>sum+a.cost,0),pnl=market-cost,externalNet=accountResults.reduce((sum,a)=>sum+a.externalNet,0),dividendInterest=accountResults.reduce((sum,a)=>sum+n(a.dividendInterest),0),feesTaxes=accountResults.reduce((sum,a)=>sum+n(a.feesTaxes),0),transferIn=accountResults.reduce((sum,a)=>sum+n(a.transferIn),0),transferOut=accountResults.reduce((sum,a)=>sum+n(a.transferOut),0),reconcileDiff=accountResults.reduce((sum,a)=>sum+(a.reconcileDiff===null?0:a.reconcileDiff),0);
  return {accounts:accountResults,total,cash,market,cost,pnl,externalNet,dividendInterest,feesTaxes,transferIn,transferOut,reconcileDiff,cashRatio:total?cash/total*100:0};
}
function monthlySorted(mode="all"){return [...(state.investmentMonthlySnapshots||[])].filter(s=>mode==="all"||s.mode===mode).sort((a,b)=>(a.period||"").localeCompare(b.period||"")||(a.updatedAt||"").localeCompare(b.updatedAt||""))}
function monthlyPrevious(snapshot){return monthlySorted(snapshot.mode).filter(s=>s.id!==snapshot.id&&s.period<snapshot.period).at(-1)||null}
function monthlyPerformance(snapshot){const current=monthlyCalc(snapshot),prevSnapshot=monthlyPrevious(snapshot),previous=prevSnapshot?monthlyCalc(prevSnapshot):null,assetChange=previous?current.total-previous.total:null,adjustedPnl=previous?assetChange-current.externalNet:null,rate=previous&&previous.total?adjustedPnl/previous.total*100:null;return {current,previous,prevSnapshot,assetChange,adjustedPnl,rate}}
function monthlyModeLabel(mode){return mode==="actual"?"실제 자금":"연습용"}
function monthlyStatusLabel(status){return status==="confirmed"?"확정":"작성 중"}
function signedWon(v){if(v===null||v===undefined)return "-";const x=n(v);return `${x>0?"+":""}${won(x)}`}
function monthlyDiffClass(v){if(v===null||v===undefined)return "";const a=Math.abs(n(v));return a<1?"ok":a<1000?"warn":"bad"}
let monthlyDraft=null;
function setMonthlyDraft(snapshot){monthlyDraft=normalizeMonthlySnapshot(structuredClone(snapshot));renderMonthlyEditor()}
function ensureMonthlyDraft(){if(!monthlyDraft)monthlyDraft=monthlyBlankDraft("practice");return monthlyDraft}
function monthlyInstrumentOptions(selected=""){return '<option value="">직접 입력</option>'+sortedInstruments().map(i=>`<option value="${i.id}" ${i.id===selected?"selected":""}>${esc(i.name)}</option>`).join("")}
function monthlyHoldingRow(h,accountId){const calc=monthlyHoldingBase(h),market=calc.quantity*calc.currentPrice;return `<tr class="monthly-holding-row" data-holding-id="${calc.id}"><td><select class="holding-master" aria-label="기존 종목 선택">${monthlyInstrumentOptions(calc.instrumentId)}</select></td><td><input class="holding-name" value="${esc(calc.name)}" placeholder="종목명"></td><td><input class="holding-ticker" value="${esc(calc.ticker)}" placeholder="코드"></td><td><input class="holding-qty" type="number" min="0" step="any" value="${calc.quantity||""}" placeholder="0"></td><td><input class="holding-avg" type="number" min="0" step="any" value="${calc.averagePrice||""}" placeholder="0"></td><td><input class="holding-current" type="number" min="0" step="any" value="${calc.currentPrice||""}" placeholder="0"></td><td class="holding-market">${won(market)}</td><td><button class="btn sm danger monthly-remove-holding" type="button">삭제</button></td></tr>`}
function monthlyAccountEditor(a,index){const calc=monthlyCalc({accounts:[a]}).accounts[0],acc=accountBy(a.accountId),open=index<3?" open":"";return `<details class="snapshot-account" data-monthly-account="${esc(a.accountId)}"${open}><summary><span class="snapshot-account-title"><input class="monthly-account-enabled" type="checkbox" checked onclick="event.stopPropagation()"><span>🏦 ${esc(a.accountName||acc?.name||"계좌")}</span></span><span class="snapshot-account-summary">총자산 <b class="monthly-account-summary-total">${won(calc.total)}</b> · 종목 ${a.holdings.length}개</span></summary><div class="snapshot-account-body"><div class="snapshot-flow-grid"><div class="field"><label>현금</label><input class="monthly-cash" type="number" min="0" step="any" value="${n(a.cash)||""}" placeholder="0"></div><div class="field"><label>증권사 표시 총액 (선택)</label><input class="monthly-broker-total" type="number" min="0" step="any" value="${a.brokerTotal===null?"":n(a.brokerTotal)}" placeholder="대사용"></div><div class="field"><label>외부 입금</label><input class="monthly-external-deposit" type="number" min="0" step="any" value="${n(a.externalDeposit)||""}" placeholder="0"></div><div class="field"><label>외부 출금</label><input class="monthly-external-withdrawal" type="number" min="0" step="any" value="${n(a.externalWithdrawal)||""}" placeholder="0"></div><div class="field"><label>배당·이자</label><input class="monthly-dividend" type="number" min="0" step="any" value="${n(a.dividendInterest)||""}" placeholder="0"></div><div class="field"><label>수수료·세금</label><input class="monthly-fees" type="number" min="0" step="any" value="${n(a.feesTaxes)||""}" placeholder="0"></div><div class="field"><label>계좌 간 이체 유입</label><input class="monthly-transfer-in" type="number" min="0" step="any" value="${n(a.transferIn)||""}" placeholder="0"></div><div class="field"><label>계좌 간 이체 유출</label><input class="monthly-transfer-out" type="number" min="0" step="any" value="${n(a.transferOut)||""}" placeholder="0"></div></div><div class="tw"><table class="snapshot-holdings"><thead><tr><th>종목 마스터</th><th>종목명</th><th>티커</th><th>수량</th><th>평균단가</th><th>현재가</th><th>평가액</th><th>관리</th></tr></thead><tbody class="monthly-holding-body">${a.holdings.map(h=>monthlyHoldingRow(h,a.accountId)).join("")}</tbody></table></div><div class="form-actions" style="justify-content:flex-start"><button class="btn sm monthly-add-holding" type="button">+ 종목 행 추가</button></div><div class="snapshot-account-totals"><div class="snapshot-mini"><small>매입금액</small><b class="monthly-total-cost">${won(calc.cost)}</b></div><div class="snapshot-mini"><small>평가금액</small><b class="monthly-total-market">${won(calc.market)}</b></div><div class="snapshot-mini"><small>현금 포함 총자산</small><b class="monthly-total-assets">${won(calc.total)}</b></div><div class="snapshot-mini"><small>평가손익</small><b class="monthly-total-pnl">${signedWon(calc.pnl)}</b></div><div class="snapshot-mini"><small>대사 차이</small><b class="monthly-reconcile snapshot-diff ${monthlyDiffClass(calc.reconcileDiff)}">${calc.reconcileDiff===null?"미입력":signedWon(calc.reconcileDiff)}</b></div></div></div></details>`}
function renderMonthlyEditor(){const d=ensureMonthlyDraft(),known=new Set(d.accounts.map(a=>a.accountId));state.accounts.forEach(a=>{if(!known.has(a.id))d.accounts.push(monthlyAccountBase({accountId:a.id,accountName:a.name}))});d.accounts=d.accounts.map(a=>({...a,accountName:a.accountName==="계좌"?(accountBy(a.accountId)?.name||a.accountName):a.accountName}));$("monthlyEditId").value=d.id||"";$("monthlyMode").value=d.mode;$("monthlyPeriod").value=d.period;$("monthlyDate").value=d.snapshotDate;$("monthlyStatus").value=d.status;$("monthlyNote").value=d.note||"";$("monthlyAccountEditors").innerHTML=d.accounts.map(monthlyAccountEditor).join("")||'<div class="snapshot-empty-editor">등록된 투자 계좌가 없습니다. 먼저 계좌 탭에서 계좌를 추가하세요.</div>';bindMonthlyEditorEvents()}
function readMonthlyForm(){const existing=ensureMonthlyDraft(),accounts=[];document.querySelectorAll("[data-monthly-account]").forEach(box=>{if(!box.querySelector(".monthly-account-enabled")?.checked)return;const accountId=box.dataset.monthlyAccount,holdings=[...box.querySelectorAll(".monthly-holding-row")].map(row=>monthlyHoldingBase({id:row.dataset.holdingId,instrumentId:row.querySelector(".holding-master")?.value||"",name:row.querySelector(".holding-name")?.value.trim(),ticker:row.querySelector(".holding-ticker")?.value.trim(),quantity:row.querySelector(".holding-qty")?.value,averagePrice:row.querySelector(".holding-avg")?.value,currentPrice:row.querySelector(".holding-current")?.value})).filter(h=>h.name||h.quantity||h.averagePrice||h.currentPrice);const brokerValue=box.querySelector(".monthly-broker-total")?.value;accounts.push(monthlyAccountBase({id:existing.accounts.find(a=>a.accountId===accountId)?.id||uid(),accountId,accountName:accountBy(accountId)?.name||existing.accounts.find(a=>a.accountId===accountId)?.accountName||"계좌",cash:box.querySelector(".monthly-cash")?.value,brokerTotal:String(brokerValue??"").trim()===""?null:brokerValue,externalDeposit:box.querySelector(".monthly-external-deposit")?.value,externalWithdrawal:box.querySelector(".monthly-external-withdrawal")?.value,dividendInterest:box.querySelector(".monthly-dividend")?.value,feesTaxes:box.querySelector(".monthly-fees")?.value,transferIn:box.querySelector(".monthly-transfer-in")?.value,transferOut:box.querySelector(".monthly-transfer-out")?.value,holdings}))});return normalizeMonthlySnapshot({...existing,id:$("monthlyEditId").value||existing.id,mode:$("monthlyMode").value,period:$("monthlyPeriod").value,snapshotDate:$("monthlyDate").value,status:$("monthlyStatus").value,note:$("monthlyNote").value.trim(),accounts,updatedAt:new Date().toISOString()})}
function updateMonthlyAccountBox(box){const d=readMonthlyAccountBox(box),c=monthlyCalc({accounts:[d]}).accounts[0];box.querySelector(".monthly-account-summary-total").textContent=won(c.total);box.querySelector(".monthly-total-cost").textContent=won(c.cost);box.querySelector(".monthly-total-market").textContent=won(c.market);box.querySelector(".monthly-total-assets").textContent=won(c.total);box.querySelector(".monthly-total-pnl").textContent=signedWon(c.pnl);const r=box.querySelector(".monthly-reconcile");r.textContent=c.reconcileDiff===null?"미입력":signedWon(c.reconcileDiff);r.className=`monthly-reconcile snapshot-diff ${monthlyDiffClass(c.reconcileDiff)}`;box.querySelectorAll(".monthly-holding-row").forEach(row=>{row.querySelector(".holding-market").textContent=won(n(row.querySelector(".holding-qty").value)*n(row.querySelector(".holding-current").value))})}
function readMonthlyAccountBox(box){const accountId=box.dataset.monthlyAccount,brokerValue=box.querySelector(".monthly-broker-total")?.value;return monthlyAccountBase({accountId,accountName:accountBy(accountId)?.name||"계좌",cash:box.querySelector(".monthly-cash")?.value,brokerTotal:String(brokerValue??"").trim()===""?null:brokerValue,externalDeposit:box.querySelector(".monthly-external-deposit")?.value,externalWithdrawal:box.querySelector(".monthly-external-withdrawal")?.value,dividendInterest:box.querySelector(".monthly-dividend")?.value,feesTaxes:box.querySelector(".monthly-fees")?.value,transferIn:box.querySelector(".monthly-transfer-in")?.value,transferOut:box.querySelector(".monthly-transfer-out")?.value,holdings:[...box.querySelectorAll(".monthly-holding-row")].map(row=>monthlyHoldingBase({instrumentId:row.querySelector(".holding-master")?.value||"",name:row.querySelector(".holding-name")?.value.trim(),ticker:row.querySelector(".holding-ticker")?.value.trim(),quantity:row.querySelector(".holding-qty")?.value,averagePrice:row.querySelector(".holding-avg")?.value,currentPrice:row.querySelector(".holding-current")?.value}))})}
function bindMonthlyHoldingRow(row,box){
  row.querySelectorAll("input").forEach(input=>input.oninput=()=>updateMonthlyAccountBox(box));
  const remove=row.querySelector(".monthly-remove-holding");
  if(remove)remove.onclick=()=>{row.remove();updateMonthlyAccountBox(box)};
  const sel=row.querySelector(".holding-master");
  if(sel)sel.onchange=()=>{const inst=instrumentBy(sel.value);if(inst){row.querySelector(".holding-name").value=inst.name||"";row.querySelector(".holding-ticker").value=inst.ticker||"";if(!n(row.querySelector(".holding-current").value))row.querySelector(".holding-current").value=n(inst.price)||""}updateMonthlyAccountBox(box)};
}
function bindMonthlyEditorEvents(){document.querySelectorAll("[data-monthly-account]").forEach(box=>{
  box.querySelectorAll(":scope > .snapshot-account-body > .snapshot-flow-grid input").forEach(input=>input.oninput=()=>updateMonthlyAccountBox(box));
  const add=box.querySelector(".monthly-add-holding");
  if(add)add.onclick=()=>{const body=box.querySelector(".monthly-holding-body");body.insertAdjacentHTML("beforeend",monthlyHoldingRow(monthlyHoldingBase(),box.dataset.monthlyAccount));const row=body.lastElementChild;if(row)bindMonthlyHoldingRow(row,box);updateMonthlyAccountBox(box)};
  box.querySelectorAll(".monthly-holding-row").forEach(row=>bindMonthlyHoldingRow(row,box));
})}
function monthlyValidation(snapshot,forConfirm=false){const errors=[],warnings=[],c=monthlyCalc(snapshot);if(!/^\d{4}-\d{2}$/.test(snapshot.period))errors.push("기준월을 선택하세요.");if(!snapshot.snapshotDate)errors.push("기준일을 선택하세요.");if(!snapshot.accounts.length)errors.push("최소 한 개 계좌를 포함하세요.");snapshot.accounts.forEach(a=>{const names=new Set();a.holdings.forEach((h,idx)=>{if(!h.name)errors.push(`${a.accountName} ${idx+1}번째 종목명을 입력하세요.`);if(h.quantity>0&&h.currentPrice<=0)errors.push(`${a.accountName} · ${h.name||idx+1}: 현재가를 입력하세요.`);if(h.quantity>0&&h.averagePrice<=0)warnings.push(`${a.accountName} · ${h.name||idx+1}: 평균단가가 0입니다.`);const k=(h.ticker||h.name).toLocaleLowerCase("ko-KR");if(k&&names.has(k))warnings.push(`${a.accountName}에 같은 종목이 중복 입력되어 있습니다: ${h.name}`);names.add(k)});if(a.reconcileDiff!==null&&Math.abs(a.reconcileDiff)>=1000)warnings.push(`${a.accountName} 증권사 총액과 계산값 차이가 ${won(a.reconcileDiff)}입니다.`)});if(Math.abs(c.transferIn-c.transferOut)>=1)warnings.push(`계좌 간 이체 유입·유출 합계가 ${won(c.transferIn-c.transferOut)} 차이납니다.`);const duplicate=state.investmentMonthlySnapshots.find(s=>s.id!==snapshot.id&&s.mode===snapshot.mode&&s.period===snapshot.period);if(duplicate)errors.push(`${monthlyModeLabel(snapshot.mode)} ${snapshot.period} 기록이 이미 있습니다. 기존 기록을 수정하거나 다른 월을 선택하세요.`);if(forConfirm&&snapshot.accounts.some(a=>a.holdings.some(h=>h.quantity>0&&!h.name)))errors.push("확정 전 종목명을 확인하세요.");return {errors,warnings,calc:c}}
function saveMonthlySnapshot(forceStatus){let snapshot=readMonthlyForm();if(forceStatus)snapshot.status=forceStatus;const check=monthlyValidation(snapshot,snapshot.status==="confirmed");if(check.errors.length)return alert("저장할 수 없습니다.\n\n- "+check.errors.join("\n- "));if(check.warnings.length&&!confirm("확인할 항목이 있습니다.\n\n- "+check.warnings.join("\n- ")+"\n\n그래도 저장할까요?"))return;const old=state.investmentMonthlySnapshots.find(s=>s.id===snapshot.id);if(old?.status==="confirmed"&&!confirm("확정된 스냅샷을 수정합니다. 수정 전 전체 JSON 백업을 먼저 만들까요?"))return;if(old?.status==="confirmed")exportData({suffix:"before_monthly_snapshot_edit",silent:true});snapshot={...snapshot,status:forceStatus||snapshot.status,createdAt:old?.createdAt||snapshot.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString(),revision:(old?.revision||0)+1};if(snapshot.status==="confirmed"&&!confirm(`${snapshot.period} ${monthlyModeLabel(snapshot.mode)} 스냅샷을 확정할까요?\n전체 자산 ${won(check.calc.total)}\n확정 후 수정 시 별도 경고와 백업이 진행됩니다.`))return;const previous=structuredClone(state.investmentMonthlySnapshots);const idx=state.investmentMonthlySnapshots.findIndex(s=>s.id===snapshot.id);if(idx>=0)state.investmentMonthlySnapshots[idx]=snapshot;else state.investmentMonthlySnapshots.push(snapshot);const result=save();if(!result.ok){state.investmentMonthlySnapshots=previous;renderAll();return alert(result.message)}monthlyDraft=normalizeMonthlySnapshot(snapshot);renderAll();toast(snapshot.status==="confirmed"?"월간 스냅샷을 확정했습니다.":"월간 스냅샷을 저장했습니다.")}
function copyMonthlySnapshot(source){const src=normalizeMonthlySnapshot(source),period=nextMonthKey(src.period),copy=normalizeMonthlySnapshot({...structuredClone(src),id:uid(),period,snapshotDate:lastDayOfMonth(period),status:"draft",note:`${period} · ${src.period}에서 복사`,accounts:src.accounts.map(a=>({...a,id:uid(),cash:0,brokerTotal:null,externalDeposit:0,externalWithdrawal:0,dividendInterest:0,feesTaxes:0,transferIn:0,transferOut:0,holdings:a.holdings.map(h=>({...h,id:uid()}))})),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),revision:1});setMonthlyDraft(copy);$("monthlyEditorCard").scrollIntoView({behavior:"smooth",block:"start"})}
function renderMonthlySnapshots(){if(!monthlyDraft)monthlyDraft=monthlyBlankDraft("practice");renderMonthlyEditor();renderMonthlyDashboard();renderMonthlyHistory()}
function renderMonthlyDashboard(){const actual=monthlySorted("actual"),practice=monthlySorted("practice"),latest=actual.at(-1)||practice.at(-1);if(!latest){$("monthlyDashboardStats").innerHTML=[["최근 전체 자산","기록 없음"],["전월 대비","-"],["외부 순입금","-"],["조정 투자손익","-"],["현금 비중","-"],["대사 차이","-"]].map(([l,v])=>`<div class="snapshot-kpi"><div class="label">${l}</div><div class="value">${v}</div></div>`).join("");$("monthlyLatestBadge").textContent="기록 없음";$("monthlyLatestSummary").className="empty";$("monthlyLatestSummary").innerHTML="스냅샷을 저장하면 최근 계좌 구성이 표시됩니다.";drawMonthlyAssetChart();return}const p=monthlyPerformance(latest),c=p.current;$("monthlyDashboardStats").innerHTML=[["최근 전체 자산",won(c.total),""],["전월 대비",signedWon(p.assetChange),p.assetChange===null?"":p.assetChange>=0?"good":"bad"],["외부 순입금",signedWon(c.externalNet),""],["조정 투자손익",signedWon(p.adjustedPnl),p.adjustedPnl===null?"":p.adjustedPnl>=0?"good":"bad"],["현금 비중",c.cashRatio.toFixed(1)+"%",""],["대사 차이",signedWon(c.reconcileDiff),monthlyDiffClass(c.reconcileDiff)==="bad"?"bad":""]].map(([l,v,cls])=>`<div class="snapshot-kpi ${cls}"><div class="label">${l}</div><div class="value">${v}</div></div>`).join("");$("monthlyLatestBadge").textContent=`${latest.period} · ${monthlyModeLabel(latest.mode)}`;$("monthlyLatestSummary").className="";$("monthlyLatestSummary").innerHTML=`<div class="value">${won(c.total)}</div><div class="sub">${latest.snapshotDate} · ${monthlyStatusLabel(latest.status)} · ${c.accounts.length}계좌</div><div class="snapshot-account-breakdown">${c.accounts.map(a=>`<div class="snapshot-breakdown-row"><span>${esc(a.accountName)}</span><b>${won(a.total)}</b></div>`).join("")}</div>`;drawMonthlyAssetChart()}
function drawMonthlyAssetChart(){const canvas=$("monthlyAssetChart");if(!canvas)return;const filter=state.ui.monthlyHistoryMode||"all",mode=filter==="practice"?"practice":filter==="actual"?"actual":monthlySorted("actual").length?"actual":"practice",rows=monthlySorted(mode);drawLines(canvas,rows.map(r=>r.period),[{name:mode==="actual"?"실제 전체 자산":"연습 전체 자산",color:seriesColor("total"),data:rows.map(r=>monthlyCalc(r).total)}],mode==="actual"?"실제 자금 스냅샷을 입력하면 추이가 표시됩니다.":"연습용 스냅샷을 입력하면 추이가 표시됩니다.")}
function renderMonthlyHistory(){const mode=state.ui.monthlyHistoryMode||"all";$("monthlyHistoryMode").value=mode;const rows=monthlySorted(mode).reverse();$("monthlySnapshotCount").textContent=rows.length+"건";$("monthlySnapshotRows").innerHTML=rows.map(s=>{const p=monthlyPerformance(s),c=p.current;return `<tr><td><b>${esc(s.period)}</b><div class="sub">${esc(s.snapshotDate)}</div></td><td><span class="snapshot-mode ${s.mode}">${monthlyModeLabel(s.mode)}</span></td><td><span class="snapshot-status ${s.status}">${monthlyStatusLabel(s.status)}</span></td><td>${won(c.total)}</td><td>${won(c.cash)}</td><td>${signedWon(c.externalNet)}</td><td class="${investmentMoveClass(p.adjustedPnl)}">${signedWon(p.adjustedPnl)}</td><td><span class="snapshot-diff ${monthlyDiffClass(c.reconcileDiff)}">${signedWon(c.reconcileDiff)}</span></td><td><div class="snapshot-history-actions"><button class="btn sm" data-monthly-edit="${s.id}">열기</button><button class="btn sm" data-monthly-copy="${s.id}">다음 달 복사</button><button class="btn sm danger" data-monthly-delete="${s.id}">삭제</button></div></td></tr>`}).join("")||'<tr><td colspan="9">조건에 맞는 월간 스냅샷이 없습니다.</td></tr>';document.querySelectorAll("[data-monthly-edit]").forEach(b=>b.onclick=()=>{const s=state.investmentMonthlySnapshots.find(x=>x.id===b.dataset.monthlyEdit);if(s){setMonthlyDraft(s);$("monthlyEditorCard").scrollIntoView({behavior:"smooth",block:"start"})}});document.querySelectorAll("[data-monthly-copy]").forEach(b=>b.onclick=()=>{const s=state.investmentMonthlySnapshots.find(x=>x.id===b.dataset.monthlyCopy);if(s)copyMonthlySnapshot(s)});document.querySelectorAll("[data-monthly-delete]").forEach(b=>b.onclick=()=>{const s=state.investmentMonthlySnapshots.find(x=>x.id===b.dataset.monthlyDelete);if(!s)return;if(!confirm(`${s.period} ${monthlyModeLabel(s.mode)} 스냅샷을 삭제할까요?\n삭제 전 전체 JSON 백업을 생성합니다.`))return;exportData({suffix:"before_monthly_snapshot_delete",silent:true});state.investmentMonthlySnapshots=state.investmentMonthlySnapshots.filter(x=>x.id!==s.id);if(monthlyDraft?.id===s.id)monthlyDraft=monthlyBlankDraft(s.mode);commit("월간 스냅샷을 삭제했습니다.")})}


function nullableNum(v){if(v===null||v===undefined||String(v).trim()==="")return null;const x=Number(String(v).replace(/[,₩원%\s]/g,""));return Number.isFinite(x)?x:null}
function normalizeCashFlow(x={}){return {id:x.id||uid(),date:x.date||today(),type:["deposit","withdrawal","transfer"].includes(x.type)?x.type:"deposit",accountId:String(x.accountId||""),toAccountId:String(x.toAccountId||""),amount:Math.max(0,n(x.amount)),note:String(x.note||""),createdAt:x.createdAt||new Date().toISOString(),updatedAt:x.updatedAt||x.createdAt||new Date().toISOString()}}
function normalizeInvestmentJournal(x={}){return {id:x.id||uid(),date:x.date||today(),action:["buy","sell","watch","review"].includes(x.action)?x.action:"buy",accountId:String(x.accountId||""),stock:String(x.stock||""),emotion:String(x.emotion||"neutral"),reason:String(x.reason||""),context:String(x.context||""),plan:String(x.plan||""),price:nullableNum(x.price),qty:nullableNum(x.qty),createdAt:x.createdAt||new Date().toISOString(),updatedAt:x.updatedAt||x.createdAt||new Date().toISOString()}}
function inferMarket(ticker="",market=""){const m=String(market||"").trim().toUpperCase();if(["KR","US","OTHER"].includes(m))return m;const t=String(ticker||"").trim();if(/^A?\d{6}$/.test(t))return "KR";if(/[A-Za-z]/.test(t))return "US";return ""}
function marketLabel(m){return m==="KR"?"한국":m==="US"?"미국":m==="OTHER"?"기타":"미지정"}
function investmentMoveClass(v){const x=nullableNum(v);return x===null||x===0?"invest-flat":x>0?"invest-up":"invest-down"}
function investmentSecurityMeta(h={}){
  let inst=h.instrumentId?instrumentBy(h.instrumentId):null;
  if(!inst){const target=brokerHoldingKey(h);inst=(state.instruments||[]).find(i=>brokerHoldingKey(i)===target)||null}
  const raw=String(inst?.className||"").trim().toLowerCase();
  let typeKey="other",typeLabel=inst?.className||"기타";
  if(raw.includes("etf")){typeKey="etf";typeLabel="ETF"}
  else if(raw.includes("주식")||raw.includes("stock")){typeKey="stock";typeLabel="주식"}
  else if(raw.includes("채권")||raw.includes("bond")){typeKey="bond";typeLabel="채권"}
  else if(raw.includes("펀드")||raw.includes("fund")){typeKey="fund";typeLabel="펀드"}
  const market=inferMarket(h.ticker||inst?.ticker||"",h.market||inst?.market||"");
  const marketKey=market==="KR"?"kr":market==="US"?"overseas":"other";
  const marketText=market==="KR"?"국내":market==="US"?"해외":"기타";
  return {typeKey,typeLabel,marketKey,marketText,ticker:String(h.ticker||inst?.ticker||"").trim()};
}
function investmentSecurityNameHtml(h={}){const m=investmentSecurityMeta(h);return `<b class="security-name">${esc(h.name||"종목")}</b><div class="security-meta"><span class="security-badge type-${m.typeKey}">${esc(m.typeLabel)}</span><span class="security-badge market-${m.marketKey}">${m.marketText}</span>${m.ticker?`<span class="security-ticker">${esc(m.ticker)}</span>`:""}</div>`}
function canonicalTicker(ticker="",market=""){const t=String(ticker||"").trim().toUpperCase(),m=inferMarket(t,market);return m==="KR"&&/^A\d{6}$/.test(t)?t.slice(1):t}
function normalizeBrokerHolding(x={}){const ticker=String(x.ticker||"").trim();return {id:x.id||uid(),instrumentId:String(x.instrumentId||""),name:String(x.name||""),market:inferMarket(ticker,x.market),ticker,quantity:nullableNum(x.quantity),buyPrice:nullableNum(x.buyPrice??x.averagePrice),currentPrice:nullableNum(x.currentPrice),purchaseAmount:nullableNum(x.purchaseAmount),evaluationAmount:nullableNum(x.evaluationAmount),pnl:nullableNum(x.pnl),returnRate:nullableNum(x.returnRate),weight:nullableNum(x.weight),fee:nullableNum(x.fee),tax:nullableNum(x.tax)}}
function normalizeBrokerAccount(x={}){return {id:x.id||uid(),accountId:String(x.accountId||""),accountName:String(x.accountName||"계좌"),enabled:x.enabled!==false,estimatedAssets:nullableNum(x.estimatedAssets),totalPurchase:nullableNum(x.totalPurchase),totalEvaluation:nullableNum(x.totalEvaluation),totalPnl:nullableNum(x.totalPnl),totalReturn:nullableNum(x.totalReturn),loanAmount:nullableNum(x.loanAmount),holdings:Array.isArray(x.holdings)?x.holdings.map(normalizeBrokerHolding):[]}}
function normalizeBrokerSnapshot(x={}){const now=new Date().toISOString(),period=/^\d{4}-\d{2}$/.test(String(x.period||""))?x.period:monthKeyNow();return {id:x.id||uid(),mode:x.mode==="actual"?"actual":"practice",period,snapshotDate:x.snapshotDate||lastDayOfMonth(period),status:x.status==="confirmed"?"confirmed":"draft",note:String(x.note||""),accounts:Array.isArray(x.accounts)?x.accounts.map(normalizeBrokerAccount):[],flowSummary:x.flowSummary&&typeof x.flowSummary==="object"?{deposit:n(x.flowSummary.deposit),withdrawal:n(x.flowSummary.withdrawal),net:n(x.flowSummary.net),transfer:n(x.flowSummary.transfer)}:null,createdAt:x.createdAt||now,updatedAt:x.updatedAt||x.createdAt||now,revision:Math.max(1,n(x.revision)||1)}}
function brokerBlank(mode="actual"){return normalizeBrokerSnapshot({mode:"actual",period:monthKeyNow(),snapshotDate:today(),status:"draft",accounts:state.accounts.map(a=>normalizeBrokerAccount({accountId:a.id,accountName:a.name,enabled:["isa","pension","irp"].includes(a.id)}))})}
function cashFlowSummary(period){const rows=(state.investmentCashFlows||[]).filter(x=>(x.date||"").slice(0,7)===period);let deposit=0,withdrawal=0,transfer=0;rows.forEach(x=>{if(x.type==="deposit")deposit+=n(x.amount);else if(x.type==="withdrawal")withdrawal+=n(x.amount);else transfer+=n(x.amount)});return {deposit,withdrawal,net:deposit-withdrawal,transfer}}
function brokerHoldingCalc(h){let purchase=h.purchaseAmount,evaluation=h.evaluationAmount,pnl=h.pnl,rate=h.returnRate;if(purchase===null&&h.quantity!==null&&h.buyPrice!==null)purchase=h.quantity*h.buyPrice;if(evaluation===null&&h.quantity!==null&&h.currentPrice!==null)evaluation=h.quantity*h.currentPrice;if(pnl===null&&purchase!==null&&evaluation!==null)pnl=evaluation-purchase;if(rate===null&&purchase)pnl!==null&&(rate=pnl/purchase*100);return {...h,purchase,evaluation,pnl,rate}}
function brokerCalc(snapshot){const accounts=(snapshot.accounts||[]).filter(a=>a.enabled).map(a=>{const holdings=(a.holdings||[]).map(brokerHoldingCalc),evaluation=a.totalEvaluation!==null?a.totalEvaluation:holdings.reduce((s,h)=>s+n(h.evaluation),0),purchase=a.totalPurchase!==null?a.totalPurchase:holdings.reduce((s,h)=>s+n(h.purchase),0),pnl=a.totalPnl!==null?a.totalPnl:(evaluation-purchase),rate=a.totalReturn!==null?a.totalReturn:(purchase?pnl/purchase*100:null),assets=a.estimatedAssets!==null?a.estimatedAssets:evaluation,cashLike=assets-evaluation;return {...a,holdings,evaluation,purchase,pnl,rate,assets,cashLike}});const total=accounts.reduce((s,a)=>s+n(a.assets),0),evaluation=accounts.reduce((s,a)=>s+n(a.evaluation),0),purchase=accounts.reduce((s,a)=>s+n(a.purchase),0),pnl=accounts.reduce((s,a)=>s+n(a.pnl),0),flow=snapshot.flowSummary||cashFlowSummary(snapshot.period);return {accounts,total,evaluation,purchase,pnl,rate:purchase?pnl/purchase*100:null,cashLike:total-evaluation,flow}}
function brokerSorted(mode="all"){return [...(state.investmentBrokerSnapshots||[])].filter(s=>mode==="all"||s.mode===mode).sort((a,b)=>(a.period||"").localeCompare(b.period||"")||(a.updatedAt||"").localeCompare(b.updatedAt||""))}
function officialBrokerSorted(){return brokerSorted("actual").filter(s=>s.status==="confirmed")}
function officialBrokerLatest(){return officialBrokerSorted().at(-1)||null}
function previousOfficialBroker(snapshot){return officialBrokerSorted().filter(s=>s.id!==snapshot.id&&s.period<snapshot.period).at(-1)||null}
function brokerHoldingKey(h){if(String(h?.instrumentId||"").trim())return `ID:${String(h.instrumentId).trim()}`;const raw=String(h?.ticker||"").trim(),market=inferMarket(raw,h?.market),ticker=canonicalTicker(raw,market);return ticker?`${market||"UNK"}:${ticker}`:`NAME:${String(h?.name||"").trim().replace(/\s+/g," ").toLocaleLowerCase("ko-KR")}`}
function brokerAggregatedHoldings(snapshot){
  const map=new Map();
  (snapshot?.accounts||[]).filter(a=>a.enabled).forEach(a=>(a.holdings||[]).forEach(h=>{
    if(!String(h.name||"").trim())return;
    const c=brokerHoldingCalc(h),key=brokerHoldingKey(h),qty=n(h.quantity);
    const old=map.get(key)||{key,instrumentId:h.instrumentId||"",name:h.name,market:inferMarket(h.ticker,h.market),ticker:h.ticker,quantity:0,purchase:0,evaluation:0,pnl:0,hasPurchase:true,hasEvaluation:true,hasPnl:true,currentWeighted:0,currentWeightQty:0,accounts:[],accountNames:new Set()};
    old.instrumentId=old.instrumentId||h.instrumentId||"";old.name=old.name||h.name;old.market=old.market||inferMarket(h.ticker,h.market);old.ticker=old.ticker||h.ticker;old.quantity+=qty;
    if(c.purchase===null)old.hasPurchase=false;else old.purchase+=n(c.purchase);
    if(c.evaluation===null)old.hasEvaluation=false;else old.evaluation+=n(c.evaluation);
    if(c.pnl===null)old.hasPnl=false;else old.pnl+=n(c.pnl);
    if(h.currentPrice!==null&&qty>0){old.currentWeighted+=n(h.currentPrice)*qty;old.currentWeightQty+=qty}
    old.accountNames.add(a.accountName);
    old.accounts.push({accountId:a.accountId,accountName:a.accountName,market:inferMarket(h.ticker,h.market),ticker:h.ticker,quantity:h.quantity,buyPrice:h.buyPrice,currentPrice:h.currentPrice,purchase:c.purchase,evaluation:c.evaluation,pnl:c.pnl,rate:c.rate,weight:h.weight});
    map.set(key,old)
  }));
  return [...map.values()].map(x=>{
    const purchase=x.hasPurchase?x.purchase:null,evaluation=x.hasEvaluation?x.evaluation:null,pnl=x.hasPnl?x.pnl:null,avgPrice=purchase!==null&&x.quantity?purchase/x.quantity:null,currentPrice=x.currentWeightQty?x.currentWeighted/x.currentWeightQty:(evaluation!==null&&x.quantity?evaluation/x.quantity:null),rate=purchase&&pnl!==null?pnl/purchase*100:null;
    return {...x,purchase,evaluation,pnl,avgPrice,currentPrice,rate,accounts:[...x.accounts],accountNames:[...x.accountNames]}
  }).sort((a,b)=>compareNames(a.name,b.name))
}
function brokerAssetChange(snapshot){const prev=previousOfficialBroker(snapshot);return {previous:prev,change:prev?brokerCalc(snapshot).total-brokerCalc(prev).total:null}}

function brokerPerformance(snapshot){const c=brokerCalc(snapshot),prev=brokerSorted(snapshot.mode).filter(x=>x.id!==snapshot.id&&x.period<snapshot.period).at(-1),p=prev?brokerCalc(prev):null,change=p?c.total-p.total:null,adjusted=change===null?null:change-n(c.flow.net);return {current:c,previous:p,change,adjusted}}
let brokerDraft=null;
function setBrokerDraft(x){brokerDraft=normalizeBrokerSnapshot(structuredClone(x));renderBrokerEditor()}
function brokerAccountOptions(selected=""){return state.accounts.map(a=>`<option value="${a.id}" ${a.id===selected?"selected":""}>${esc(a.name)} · ${esc(a.broker)}</option>`).join("")}
function brokerInstrumentOptions(selectedId=""){
  const rows=sortedInstruments();
  return '<option value="">종목을 선택하세요</option>'+rows.map(i=>`<option value="${i.id}" ${i.id===selectedId?"selected":""}>${esc(i.name)}${i.ticker?` · ${esc(i.ticker)}`:""}</option>`).join("")
}
function brokerHoldingAuto(h){const q=h.quantity,b=h.buyPrice,c=h.currentPrice,purchase=q!==null&&b!==null?q*b:null,evaluation=q!==null&&c!==null?q*c:null,pnl=purchase!==null&&evaluation!==null?evaluation-purchase:null,rate=purchase?pnl/purchase*100:null;return {purchase,evaluation,pnl,rate}}
function brokerHoldingHtml(aidx,hidx,h){
  const master=findMasterInstrument(h),selected=h.instrumentId||master?.id||"";
  if(master&&!h.instrumentId)h.instrumentId=master.id;
  if(master){h.name=master.name;h.ticker=master.ticker||h.ticker;h.market=master.market||inferMarket(h.ticker,h.market)}
  const auto=brokerHoldingAuto(h),hasOverride=[h.purchaseAmount,h.evaluationAmount,h.pnl,h.returnRate].some(v=>v!==null&&v!==undefined);
  const pnlClass=auto.pnl===null?"":auto.pnl>=0?"good":"bad";
  return `<div class="broker-holding" data-broker-holding="${aidx}:${hidx}">
  <div class="rc2-holding-grid rc21">
    <div class="field holding-name"><label>종목 선택</label><select data-bh="instrumentId">${brokerInstrumentOptions(selected)}</select><div class="sub master-meta">${master?`${esc(marketLabel(master.market))}${master.ticker?` · ${esc(master.ticker)}`:""}`:"종목 관리에서 먼저 등록하세요."}</div></div>
    <div class="field"><label>보유수량</label><input data-bh="quantity" type="number" min="0" step="any" value="${h.quantity??""}" placeholder="0"></div>
    <div class="field"><label>평균단가</label><input data-bh="buyPrice" type="number" step="any" value="${h.buyPrice??""}" placeholder="증권사 평단"></div>
    <div class="field"><label>현재가</label><input data-bh="currentPrice" type="number" step="any" value="${h.currentPrice??""}" placeholder="기록 시점"></div>
    <button class="btn sm danger holding-remove" type="button" data-bh-remove>삭제</button>
  </div>
  <div class="broker-auto-grid">
    <div class="broker-auto-value"><small>매입금액 · 자동</small><b data-bh-auto="purchase">${auto.purchase===null?"-":won(auto.purchase)}</b></div>
    <div class="broker-auto-value"><small>평가금액 · 자동</small><b data-bh-auto="evaluation">${auto.evaluation===null?"-":won(auto.evaluation)}</b></div>
    <div class="broker-auto-value ${pnlClass}"><small>평가손익 · 자동</small><b data-bh-auto="pnl">${auto.pnl===null?"-":signedWon(auto.pnl)}</b></div>
    <div class="broker-auto-value ${pnlClass}"><small>수익률 · 자동</small><b data-bh-auto="rate">${auto.rate===null?"-":pct(auto.rate)}</b></div>
  </div>
  <details class="broker-override ${hasOverride?"has-value":""}" ${hasOverride?"open":""}><summary>${hasOverride?"증권사 표시값 우선 적용 중 · 필요할 때만 수정":"증권사 표시값이 자동계산과 다를 때만 직접 입력"}</summary><div class="broker-override-note">수수료·세금·증권사 반올림 때문에 차이가 날 때만 사용합니다. 비워두면 위 자동 계산값을 사용합니다.</div><div class="broker-holding-extra">
    <div class="field"><label>매입금액</label><input data-bh="purchaseAmount" type="number" value="${h.purchaseAmount??""}" placeholder="자동값 사용"></div>
    <div class="field"><label>평가금액</label><input data-bh="evaluationAmount" type="number" value="${h.evaluationAmount??""}" placeholder="자동값 사용"></div>
    <div class="field"><label>평가손익</label><input data-bh="pnl" type="number" value="${h.pnl??""}" placeholder="자동값 사용"></div>
    <div class="field"><label>수익률 %</label><input data-bh="returnRate" type="number" step="any" value="${h.returnRate??""}" placeholder="자동값 사용"></div>
    <div class="field"><label>보유비중 % · 선택</label><input data-bh="weight" type="number" step="any" value="${h.weight??""}" placeholder="증권사 표시값"></div>
  </div></details>
</div>`}
function renderBrokerEditor(){if(!brokerDraft)brokerDraft=brokerBlank("actual");brokerDraft.mode="actual";$("brokerEditId").value=brokerDraft.id;$("brokerMode").value="actual";$("brokerPeriod").value=brokerDraft.period;$("brokerDate").value=brokerDraft.snapshotDate;$("brokerStatus").value=brokerDraft.status;$("brokerNote").value=brokerDraft.note||"";$("brokerAccountEditors").innerHTML=brokerDraft.accounts.map((a,ai)=>{const c=brokerCalc({...brokerDraft,accounts:[a]}).accounts[0];return `<div class="broker-account ${a.enabled?"":"off"}" data-broker-account="${ai}"><div class="broker-account-head"><div class="broker-account-title"><input type="checkbox" data-ba="enabled" ${a.enabled?"checked":""}><div><b>${esc(a.accountName)}</b><div class="sub">${esc(accountBy(a.accountId)?.broker||"")}</div></div></div><div class="sh-actions"><button class="btn sm" type="button" data-ba-add>＋ 종목 추가</button></div></div><div class="broker-account-grid rc1"><div class="field"><label>계좌 총자산</label><input data-ba="estimatedAssets" type="number" value="${a.estimatedAssets??""}" placeholder="추정예탁자산"></div><div class="field"><label>총매입금액</label><input data-ba="totalPurchase" type="number" value="${a.totalPurchase??""}"></div><div class="field"><label>총평가금액</label><input data-ba="totalEvaluation" type="number" value="${a.totalEvaluation??""}"></div><div class="field"><label>총평가손익</label><input data-ba="totalPnl" type="number" value="${a.totalPnl??""}"></div><div class="field"><label>총수익률 %</label><input data-ba="totalReturn" type="number" step="any" value="${a.totalReturn??""}"></div></div><div class="broker-account-summary"><span class="mini-metric">기록 총자산<b>${c?won(c.assets):"-"}</b></span><span class="mini-metric">보유 종목<b>${a.holdings.filter(h=>String(h.name||"").trim()).length}개</b></span></div><div class="broker-holdings">${a.holdings.map((h,hi)=>brokerHoldingHtml(ai,hi,h)).join("")}</div></div>`}).join("");bindBrokerEditor()}
function refreshBrokerHoldingAuto(row,h){const x=brokerHoldingAuto(h),set=(k,v)=>{const el=row.querySelector(`[data-bh-auto="${k}"]`);if(el)el.textContent=v};set("purchase",x.purchase===null?"-":won(x.purchase));set("evaluation",x.evaluation===null?"-":won(x.evaluation));set("pnl",x.pnl===null?"-":signedWon(x.pnl));set("rate",x.rate===null?"-":pct(x.rate));row.querySelectorAll(".broker-auto-value").forEach((box,idx)=>{if(idx<2)return;box.classList.remove("good","bad");if(x.pnl!==null)box.classList.add(x.pnl>=0?"good":"bad")})}
function bindBrokerEditor(){document.querySelectorAll("[data-broker-account]").forEach(card=>{const ai=Number(card.dataset.brokerAccount),a=brokerDraft.accounts[ai];card.querySelectorAll("[data-ba]").forEach(el=>el.oninput=()=>{const k=el.dataset.ba;a[k]=k==="enabled"?el.checked:nullableNum(el.value);if(k==="enabled")renderBrokerEditor()});const add=card.querySelector("[data-ba-add]");if(add)add.onclick=()=>{if(!state.instruments.length){activateInvestmentTab("investManage");return alert("먼저 종목 관리에서 종목을 등록해 주세요.")}a.holdings.push(normalizeBrokerHolding());renderBrokerEditor()};card.querySelectorAll("[data-broker-holding]").forEach(row=>{const hi=Number(row.dataset.brokerHolding.split(":")[1]),h=a.holdings[hi];row.querySelectorAll("[data-bh]").forEach(el=>{const handler=()=>{const k=el.dataset.bh;if(k==="instrumentId"){const i=instrumentBy(el.value);h.instrumentId=el.value||"";if(i){h.name=i.name;h.ticker=i.ticker||"";h.market=i.market||inferMarket(i.ticker,"")}renderBrokerEditor();return}h[k]=nullableNum(el.value);if(["quantity","buyPrice","currentPrice"].includes(k))refreshBrokerHoldingAuto(row,h)};el.oninput=handler;if(el.tagName==="SELECT")el.onchange=handler});const remove=row.querySelector("[data-bh-remove]");if(remove)remove.onclick=()=>{a.holdings.splice(hi,1);renderBrokerEditor()}})})}
function readBrokerForm(){const x=normalizeBrokerSnapshot(brokerDraft||brokerBlank("actual"));x.id=$("brokerEditId").value||x.id;x.mode="actual";x.period=$("brokerPeriod").value;x.snapshotDate=$("brokerDate").value;x.status=$("brokerStatus").value;x.note=$("brokerNote").value.trim();x.flowSummary=null;return x}
function saveBroker(status){
  let x=readBrokerForm();x.status=status;const enabled=x.accounts.filter(a=>a.enabled);
  if(!/^\d{4}-\d{2}$/.test(x.period)||!x.snapshotDate)return alert("기준월과 기준일을 입력하세요.");
  if(!enabled.length)return alert("최소 한 개 계좌를 사용하세요.");
  if(enabled.some(a=>a.estimatedAssets===null))return alert("사용 중인 계좌의 총자산(추정예탁자산)을 입력하세요.");
  const duplicateHoldings=[];enabled.forEach(a=>{const seen=new Set();a.holdings.filter(h=>String(h.name||"").trim()).forEach(h=>{const k=brokerHoldingKey(h);if(seen.has(k))duplicateHoldings.push(`${a.accountName} · ${h.name}`);seen.add(k)})});
  if(duplicateHoldings.length&&!confirm("같은 계좌에 동일 종목으로 보이는 기록이 있습니다.\n\n- "+duplicateHoldings.join("\n- ")+"\n\n의도한 입력이면 계속 저장할까요?"))return;
  const dup=state.investmentBrokerSnapshots.find(s=>s.id!==x.id&&s.mode==="actual"&&s.period===x.period);if(dup)return alert("같은 기준월의 월간 기록이 이미 있습니다. 기존 기록을 열어 수정하세요.");
  const old=state.investmentBrokerSnapshots.find(s=>s.id===x.id);if(old?.status==="confirmed"){if(!confirm("저장된 월간 기록을 수정합니다. 수정 전 자동 백업을 만들까요?"))return;exportData({suffix:"before_investment_archive_edit",silent:true})}
  x.createdAt=old?.createdAt||x.createdAt;x.updatedAt=new Date().toISOString();x.revision=(old?.revision||0)+1;
  if(status==="confirmed"&&!confirm(`${x.period} 투자 기록을 저장할까요?\n총자산 ${won(brokerCalc(x).total)}\n\n증권사가 보여준 손익·수익률을 원본값으로 저장합니다. HANI 계산값과 소액 차이가 있어도 원본을 덮어쓰지 않습니다.`))return;
  const idx=state.investmentBrokerSnapshots.findIndex(s=>s.id===x.id);if(idx>=0)state.investmentBrokerSnapshots[idx]=x;else state.investmentBrokerSnapshots.push(x);brokerDraft=normalizeBrokerSnapshot(x);commit(status==="confirmed"?"월간 투자 기록을 저장했습니다.":"월간 투자 기록을 임시 저장했습니다.")
}
function renderBrokerDashboard(){
  const rows=officialBrokerSorted(),latest=rows.at(-1),filter=$("latestHoldingAccountFilter");
  if(filter){filter.innerHTML='<option value="all">전체 계좌 통합</option>'+state.accounts.map(a=>`<option value="${esc(a.id)}">${esc(a.name)} · ${esc(a.broker)}</option>`).join("");filter.value=state.ui.latestHoldingAccount||"all";if(![...filter.options].some(o=>o.value===filter.value))filter.value="all";filter.onchange=()=>{state.ui.latestHoldingAccount=filter.value;save();renderBrokerDashboard()}}
  if(!latest){$("brokerDashboardStats").innerHTML=[["최근 총자산","기록 없음"],["전월 대비","-"],["총평가금액","-"],["평가손익","-"],["보유 종목","-"],["기록 월","-"]].map(([l,v])=>`<div class="broker-kpi"><div class="label">${l}</div><div class="value">${v}</div></div>`).join("");$("brokerLatestBadge").textContent="기록 없음";$("brokerLatestSummary").className="empty";$("brokerLatestSummary").textContent="월간 투자 기록을 저장하면 최근 계좌 현황이 표시됩니다.";if($("brokerLatestHoldingRows"))$("brokerLatestHoldingRows").innerHTML='<tr><td colspan="9">저장된 보유종목이 없습니다.</td></tr>';if($("brokerLatestHoldingCount"))$("brokerLatestHoldingCount").textContent="0종목";drawBrokerChart();return}
  const c=brokerCalc(latest),d=brokerAssetChange(latest),holdings=brokerAggregatedHoldings(latest);$("brokerDashboardStats").innerHTML=[["최근 총자산",won(c.total),"primary"],["전월 대비",signedWon(d.change),d.change===null?"":d.change>=0?"good":"bad"],["총평가금액",won(c.evaluation),"accent"],["평가손익",signedWon(c.pnl),c.pnl>=0?"good":"bad"],["보유 종목",holdings.filter(h=>h.quantity>0||n(h.evaluation)!==0).length+"종목",""],["기록 월",latest.period,""]].map(([l,v,cl])=>`<div class="broker-kpi ${cl}"><div class="label">${l}</div><div class="value">${v}</div></div>`).join("");$("brokerLatestBadge").textContent=latest.period;$("brokerLatestSummary").className="";$("brokerLatestSummary").innerHTML=`<div class="value">${won(c.total)}</div><div class="sub">${esc(latest.snapshotDate)} · 월간 기록 기준</div><div class="snapshot-account-breakdown">${c.accounts.map(a=>`<div class="snapshot-breakdown-row"><span>${esc(a.accountName)}</span><b>${won(a.assets)}</b></div>`).join("")}</div>${latest.note?`<div class="note" style="margin-top:10px">${esc(latest.note)}</div>`:""}<div class="snapshot-source-badge">※ 실제 증권사 잔액과 소액 차이가 있을 수 있습니다.</div>`;
  if($("brokerLatestHoldingRows")){const accountFilter=state.ui.latestHoldingAccount||"all";let displayRows;if(accountFilter==="all")displayRows=holdings.map(h=>({kind:"agg",...h}));else{const account=(latest.accounts||[]).find(a=>a.enabled&&a.accountId===accountFilter);displayRows=(account?.holdings||[]).filter(h=>String(h.name||"").trim()).map(h=>{const z=brokerHoldingCalc(h);return {kind:"account",name:h.name,market:inferMarket(h.ticker,h.market),ticker:h.ticker,quantity:h.quantity,avgPrice:h.buyPrice,currentPrice:h.currentPrice,purchase:z.purchase,evaluation:z.evaluation,pnl:z.pnl,rate:z.rate,accountNames:[account.accountName]}})}$("brokerLatestHoldingCount").textContent=displayRows.length+"종목";$("brokerLatestHoldingRows").innerHTML=displayRows.map(h=>`<tr class="security-row"><td>${investmentSecurityNameHtml(h)}</td><td>${esc((h.accountNames||[]).join(", ")||"-")}</td><td>${h.quantity===null?"-":num(h.quantity)}</td><td>${h.avgPrice===null?"-":won(h.avgPrice)}</td><td>${h.currentPrice===null?"-":won(h.currentPrice)}</td><td>${h.purchase===null?"-":won(h.purchase)}</td><td>${h.evaluation===null?"-":won(h.evaluation)}</td><td class="${investmentMoveClass(h.pnl)}">${h.pnl===null?"-":signedWon(h.pnl)}</td><td class="${investmentMoveClass(h.rate)}">${h.rate===null?"-":num(h.rate)+"%"}</td></tr>`).join("")||'<tr><td colspan="9">이 계좌에는 기록된 보유종목이 없습니다.</td></tr>'}
  drawBrokerChart()
}
function drawBrokerChart(){const canvas=$("brokerAssetChart");if(!canvas)return;const rows=officialBrokerSorted();if(rows.length===1){drawLines(canvas,[],[],"첫 투자 기록이 시작되었습니다. 다음 달 기록부터 자산 흐름을 비교할 수 있어요.");return}drawLines(canvas,rows.map(x=>x.period),[{name:"총자산",color:seriesColor("total"),data:rows.map(x=>brokerCalc(x).total)}],"월간 투자 기록을 저장하면 자산 흐름이 표시됩니다.")}
function renderBrokerHistory(){const rows=brokerSorted("actual").reverse();$("brokerHistoryMode").value="actual";$("brokerSnapshotCount").textContent=rows.length+"건";$("brokerSnapshotRows").innerHTML=rows.map(s=>{const c=brokerCalc(s),d=s.status==="confirmed"?brokerAssetChange(s):{change:null},holdings=brokerAggregatedHoldings(s).filter(h=>n(h.quantity)>0||n(h.evaluation)!==0);return `<tr><td><b>${esc(s.period)}</b>${s.status!=="confirmed"?'<span class="pill" style="margin-left:6px">작성 중</span>':""}<div class="sub">${esc(s.snapshotDate)}</div></td><td>${won(c.total)}</td><td class="${d.change===null?"invest-flat":investmentMoveClass(d.change)}">${s.status==="confirmed"?signedWon(d.change):"확정 후 표시"}</td><td>${won(c.evaluation)}</td><td class="${investmentMoveClass(c.pnl)}">${signedWon(c.pnl)}</td><td>${holdings.length}종목</td><td>${esc(s.note||"-")}</td><td><div class="simple-history-actions"><button class="btn sm" data-bs-edit="${s.id}">열기</button>${s.status==="confirmed"?`<button class="btn sm" data-bs-copy="${s.id}">다음 달 복사</button>`:""}<button class="btn sm danger" data-bs-delete="${s.id}">삭제</button></div></td></tr>`}).join("")||'<tr><td colspan="8">저장된 월간 투자 기록이 없습니다.</td></tr>';document.querySelectorAll("[data-bs-edit]").forEach(b=>b.onclick=()=>{const s=state.investmentBrokerSnapshots.find(x=>x.id===b.dataset.bsEdit);if(s){setBrokerDraft(s);$("brokerEditorCard").scrollIntoView({behavior:"smooth"})}});document.querySelectorAll("[data-bs-copy]").forEach(b=>b.onclick=()=>{const s=state.investmentBrokerSnapshots.find(x=>x.id===b.dataset.bsCopy);if(!s)return;copyBrokerToNextMonth(s)});document.querySelectorAll("[data-bs-delete]").forEach(b=>b.onclick=()=>{const s=state.investmentBrokerSnapshots.find(x=>x.id===b.dataset.bsDelete);if(!s||!confirm(`${s.period} 월간 투자 기록을 삭제할까요?\n삭제 전 자동 백업을 생성합니다.`))return;exportData({suffix:"before_investment_archive_delete",silent:true});state.investmentBrokerSnapshots=state.investmentBrokerSnapshots.filter(x=>x.id!==s.id);if(brokerDraft?.id===s.id)brokerDraft=brokerBlank("actual");commit("월간 투자 기록을 삭제했습니다.")})}
function copyBrokerToNextMonth(s){const period=nextMonthKey(s.period),x=normalizeBrokerSnapshot({...structuredClone(s),id:uid(),mode:"actual",period,snapshotDate:lastDayOfMonth(period),status:"draft",flowSummary:null,note:"",accounts:s.accounts.map(a=>({...a,id:uid(),holdings:a.holdings.map(h=>({...h,id:uid()}))}))});setBrokerDraft(x);$("brokerEditorCard").scrollIntoView({behavior:"smooth"})}
function renderBrokerSnapshots(){if(!brokerDraft)brokerDraft=brokerBlank("actual");renderBrokerEditor();renderBrokerDashboard();renderBrokerHistory()}
function annualBrokerYears(){const ys=[...new Set(officialBrokerSorted().map(s=>String(s.period||"").slice(0,4)).filter(Boolean))];const cur=String(new Date().getFullYear());if(!ys.includes(cur))ys.push(cur);return ys.sort().reverse()}
function annualRows(year){return officialBrokerSorted().filter(s=>String(s.period||"").startsWith(year+"-"))}
function annualHoldingMap(snapshot){const m=new Map();brokerAggregatedHoldings(snapshot).forEach(h=>m.set(h.key,h));return m}
function renderAnnualInvestment(){
  const yearSelect=$("annualInvestmentYear");if(!yearSelect)return;const years=annualBrokerYears(),preferred=String(state.ui.investmentYear||years[0]||new Date().getFullYear());yearSelect.innerHTML=years.map(y=>`<option value="${y}" ${y===preferred?"selected":""}>${y}년</option>`).join("");if(!years.includes(yearSelect.value))yearSelect.value=years[0]||String(new Date().getFullYear());state.ui.investmentYear=yearSelect.value;
  const rows=annualRows(yearSelect.value),first=rows[0],latest=rows.at(-1),firstTotal=first?brokerCalc(first).total:null,latestTotal=latest?brokerCalc(latest).total:null,change=first&&latest?latestTotal-firstTotal:null;$("annualInvestmentMonths").textContent=rows.length+"개월 기록";$("annualInvestmentStats").innerHTML=[["첫 기록 자산",first?won(firstTotal):"-",""],["최근 자산",latest?won(latestTotal):"-",""],["기간 변화",change===null?"-":signedWon(change),change===null?"":investmentMoveClass(change)],["기록 개월",rows.length+"개월",""]].map(([l,v,cl])=>`<div class="broker-kpi"><div class="label">${l}</div><div class="value ${cl}">${v}</div></div>`).join("");$("annualMonthList").innerHTML=rows.length?rows.map((s,i)=>{const c=brokerCalc(s),prev=i?brokerCalc(rows[i-1]).total:null,d=prev===null?null:c.total-prev;return `<div class="annual-month-card"><div class="month">${esc(s.period)}</div><div><b>${won(c.total)}</b><div class="sub ${investmentMoveClass(c.pnl)}">평가손익 ${signedWon(c.pnl)}</div></div><div class="${d===null?"invest-flat":investmentMoveClass(d)}">${d===null?"기준":signedWon(d)}</div></div>`}).join(""):'<div class="empty">이 연도의 월간 기록이 없습니다.</div>';
  const stockMeta=new Map();rows.forEach(s=>brokerAggregatedHoldings(s).forEach(h=>{if(!stockMeta.has(h.key))stockMeta.set(h.key,{key:h.key,name:h.name,ticker:h.ticker,market:h.market})}));const stocks=[...stockMeta.values()].sort((a,b)=>compareNames(a.name,b.name)),sel=$("annualStockSelect"),oldKey=state.ui.annualStockKey||sel.value;
  if(stocks.length){sel.innerHTML=stocks.map(x=>`<option value="${esc(x.key)}" ${x.key===oldKey?"selected":""}>${esc(x.name)}${x.ticker?` · ${esc(x.ticker)}`:""}</option>`).join("");if(!stocks.some(x=>x.key===sel.value))sel.value=stocks[0].key;state.ui.annualStockKey=sel.value}else{sel.innerHTML='<option value="">종목 기록 없음</option>';state.ui.annualStockKey=""}
  const summaries=stocks.map(meta=>{const data=rows.map(s=>annualHoldingMap(s).get(meta.key)||null),firstH=data[0]||{quantity:0,evaluation:null,avgPrice:null,pnl:null},lastH=data.at(-1)||{quantity:0,evaluation:null,avgPrice:null,pnl:null};return {...meta,firstQty:n(firstH.quantity),lastQty:n(lastH.quantity),lastAvg:lastH.avgPrice,lastEval:lastH.evaluation,lastPnl:lastH.pnl}});$("annualStockCount").textContent=summaries.length+"종목";$("annualStockRows").innerHTML=summaries.map(x=>`<tr><td><b>${esc(x.name)}</b>${x.ticker?`<div class="sub">${esc(marketLabel(x.market))} · ${esc(x.ticker)}</div>`:""}</td><td>${num(x.firstQty)}</td><td>${num(x.lastQty)}</td><td>${x.lastQty-x.firstQty>0?"+":""}${num(x.lastQty-x.firstQty)}</td><td>${x.lastAvg===null||x.lastAvg===undefined?"-":won(x.lastAvg)}</td><td>${x.lastEval===null||x.lastEval===undefined?"-":won(x.lastEval)}</td><td class="${investmentMoveClass(x.lastPnl)}">${x.lastPnl===null||x.lastPnl===undefined?"-":signedWon(x.lastPnl)}</td></tr>`).join("")||'<tr><td colspan="7">이 연도에 기록된 종목이 없습니다.</td></tr>';renderAnnualStockDetail(rows);drawAnnualInvestmentCharts();yearSelect.onchange=()=>{state.ui.investmentYear=yearSelect.value;save();renderAnnualInvestment()};sel.onchange=()=>{state.ui.annualStockKey=sel.value;save();renderAnnualStockDetail(annualRows(yearSelect.value));drawAnnualInvestmentCharts()}
}
function renderAnnualStockDetail(rows){
  const key=$("annualStockSelect")?.value;if(!key||!rows.length){$("annualStockSummary").innerHTML=[["첫 수량","-"],["최근 수량","-"],["수량 변화","-"],["통합 평균단가","-"],["최근 평가액","-"],["최근 손익","-"]].map(([l,v])=>`<span class="mini-metric">${l}<b>${v}</b></span>`).join("");$("annualStockHistoryRows").innerHTML='<tr><td colspan="8">종목을 선택하면 월별 상세가 표시됩니다.</td></tr>';$("annualStockAccounts").innerHTML='<div class="empty">최근 계좌별 기록이 없습니다.</div>';$("annualStockAccountBadge").textContent="기록 없음";return}
  const data=rows.map(s=>({snapshot:s,holding:annualHoldingMap(s).get(key)||null})),first=data[0]?.holding||{quantity:0,avgPrice:null,evaluation:null,pnl:null},last=data.at(-1)?.holding||{quantity:0,avgPrice:null,evaluation:null,pnl:null},q=n(last.quantity)-n(first.quantity);$("annualStockSummary").innerHTML=[["첫 수량",num(first.quantity)],["최근 수량",num(last.quantity)],["수량 변화",`${q>0?"+":""}${num(q)}`],["통합 평균단가",last?.avgPrice===null||last?.avgPrice===undefined?"-":won(last.avgPrice)],["최근 평가액",last?.evaluation===null||last?.evaluation===undefined?"-":won(last.evaluation)],["최근 손익",last?.pnl===null||last?.pnl===undefined?"-":signedWon(last.pnl)]].map(([l,v])=>`<span class="mini-metric">${l}<b>${v}</b></span>`).join("");
  $("annualStockHistoryRows").innerHTML=data.map(({snapshot:s,holding:h})=>`<tr><td><b>${esc(s.period)}</b><div class="sub">${esc(s.snapshotDate)}</div></td><td>${h?num(h.quantity):"0"}</td><td>${h?.avgPrice===null||h?.avgPrice===undefined?"-":won(h.avgPrice)}</td><td>${h?.currentPrice===null||h?.currentPrice===undefined?"-":won(h.currentPrice)}</td><td>${h?.purchase===null||h?.purchase===undefined?"-":won(h.purchase)}</td><td>${h?.evaluation===null||h?.evaluation===undefined?"-":won(h.evaluation)}</td><td class="${investmentMoveClass(h?.pnl)}">${h?.pnl===null||h?.pnl===undefined?"-":signedWon(h.pnl)}</td><td class="${investmentMoveClass(h?.rate)}">${h?.rate===null||h?.rate===undefined?"-":num(h.rate)+"%"}</td></tr>`).join("");
  const latestPresent=data.at(-1);$("annualStockAccountBadge").textContent=latestPresent?.snapshot?.period||"기록 없음";$("annualStockAccounts").innerHTML=latestPresent?.holding?.accounts?.map(a=>`<div class="stock-account-card"><div class="row"><div><b>${esc(a.accountName)}</b><div class="sub">${a.ticker?`${esc(marketLabel(a.market))} · ${esc(a.ticker)}`:esc(marketLabel(a.market))}</div></div><span class="instrument-status held">${num(a.quantity)}주</span></div><div class="stock-account-values"><div><span>평균단가</span><b>${a.buyPrice===null?"-":won(a.buyPrice)}</b></div><div><span>현재가</span><b>${a.currentPrice===null?"-":won(a.currentPrice)}</b></div><div><span>평가금액</span><b>${a.evaluation===null?"-":won(a.evaluation)}</b></div><div><span>손익 / 수익률</span><b class="${investmentMoveClass(a.pnl)}">${a.pnl===null?"-":signedWon(a.pnl)} · ${a.rate===null?"-":num(a.rate)+"%"}</b></div></div></div>`).join("")||'<div class="empty">최근 계좌별 기록이 없습니다.</div>'
}
function drawAnnualInvestmentCharts(){
  const year=$("annualInvestmentYear")?.value||String(new Date().getFullYear()),rows=annualRows(year);drawLines($("annualAssetChart"),rows.map(s=>s.period),[{name:"총자산",color:seriesColor("total"),data:rows.map(s=>brokerCalc(s).total)}],"이 연도의 월간 투자 기록이 없습니다.");const key=$("annualStockSelect")?.value,stockName=$("annualStockSelect")?.selectedOptions?.[0]?.textContent||"보유수량",data=rows.map(s=>annualHoldingMap(s).get(key)||null);drawLines($("annualStockQtyChart"),rows.map(s=>s.period),key?[{name:stockName+" 수량",color:seriesColor("total"),data:data.map(h=>n(h?.quantity))}]:[],"종목을 선택하면 보유수량 흐름이 표시됩니다.");drawLines($("annualStockPriceChart"),rows.map(s=>s.period),key?[{name:"통합 평균단가",color:seriesColor("isa"),data:data.map(h=>h?.avgPrice===null||h?.avgPrice===undefined?null:n(h.avgPrice))},{name:"기록 현재가",color:seriesColor("pension"),data:data.map(h=>h?.currentPrice===null||h?.currentPrice===undefined?null:n(h.currentPrice))}]:[],"평균단가와 현재가를 입력한 달부터 가격 흐름이 표시됩니다.")
}
function flowTypeLabel(t){return t==="deposit"?"외부 입금":t==="withdrawal"?"외부 출금":"계좌이체"}
function flowAccountText(x){if(x.type==="transfer")return `${esc(accountBy(x.accountId)?.name||"-")} → ${esc(accountBy(x.toAccountId)?.name||"-")}`;return esc(accountBy(x.accountId)?.name||"-")}
function resetFlow(){["flowEditId","flowNote","flowAmount"].forEach(id=>$(id).value="");$("flowDate").value=today();$("flowType").value="deposit";updateFlowForm()}
function updateFlowForm(){const t=$("flowType").value;$("flowToWrap").classList.toggle("hidden",t!=="transfer");$("flowAccountLabel").textContent=t==="deposit"?"입금 계좌":t==="withdrawal"?"출금 계좌":"보내는 계좌";document.querySelectorAll("[data-flow-kind]").forEach(b=>b.classList.toggle("active",b.dataset.flowKind===t))}
function renderCashFlows(){const month=state.ui.flowMonthFilter||monthKeyNow();$("flowMonthFilter").value=month;const rows=[...(state.investmentCashFlows||[])].filter(x=>(x.date||"").slice(0,7)===month).sort((a,b)=>(b.date||"").localeCompare(a.date||"")||(b.createdAt||"").localeCompare(a.createdAt||"")),s=cashFlowSummary(month);$("flowCount").textContent=rows.length+"건";$("flowStats").innerHTML=[["외부 입금",won(s.deposit)],["외부 출금",won(s.withdrawal)],["외부 순입금",signedWon(s.net)],["계좌이체",won(s.transfer)]].map(([l,v])=>`<div class="stat"><div class="label">${l}</div><div class="value">${v}</div></div>`).join("");$("flowRows").innerHTML=rows.map(x=>`<tr><td>${esc(x.date)}</td><td><span class="cashflow-type ${x.type}">${flowTypeLabel(x.type)}</span></td><td>${flowAccountText(x)}</td><td>${won(x.amount)}</td><td>${esc(x.note||"-")}</td><td><div class="acts"><button class="btn sm" data-flow-edit="${x.id}">수정</button><button class="btn sm danger" data-flow-delete="${x.id}">삭제</button></div></td></tr>`).join("")||'<tr><td colspan="6">이 달의 입출금 기록이 없습니다.</td></tr>';document.querySelectorAll("[data-flow-edit]").forEach(b=>b.onclick=()=>{const x=state.investmentCashFlows.find(r=>r.id===b.dataset.flowEdit);if(!x)return;$("flowEditId").value=x.id;$("flowDate").value=x.date;$("flowType").value=x.type;$("flowAccount").value=x.accountId;$("flowToAccount").value=x.toAccountId;$("flowAmount").value=x.amount;$("flowNote").value=x.note;updateFlowForm()});document.querySelectorAll("[data-flow-delete]").forEach(b=>b.onclick=()=>{if(!confirm("이 자금 기록을 삭제할까요?"))return;state.investmentCashFlows=state.investmentCashFlows.filter(x=>x.id!==b.dataset.flowDelete);commit("자금 기록을 삭제했습니다.")})}
function instrumentFallbackKey(x={}){const raw=String(x?.ticker||"").trim(),market=inferMarket(raw,x?.market),ticker=canonicalTicker(raw,market);return ticker?`${market||"UNK"}:${ticker}`:`NAME:${String(x?.name||"").trim().replace(/\s+/g," ").toLocaleLowerCase("ko-KR")}`}
function findMasterInstrument(x={}){const id=String(x?.instrumentId||"").trim();if(id){const direct=state.instruments.find(i=>i.id===id);if(direct)return direct}const key=instrumentFallbackKey(x);return state.instruments.find(i=>instrumentFallbackKey(i)===key)||null}
function ensureMasterInstrument(x={},className="기타"){
  const name=String(x?.name||"").trim(),ticker=String(x?.ticker||"").trim(),market=inferMarket(ticker,x?.market);if(!name&&!ticker)return null;
  let i=findMasterInstrument({name,ticker,market});
  if(!i){i={id:uid(),name:name||ticker,className:className||"기타",ticker,market,price:0,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};state.instruments.push(i)}
  else{if(name&&!i.name)i.name=name;if(ticker&&!i.ticker)i.ticker=ticker;if(market&&!i.market)i.market=market;if(!i.className)i.className=className||"기타"}
  return i
}
function syncInstrumentMasterFromHistory(){
  if(!Array.isArray(state.instruments))state.instruments=[];const before=state.instruments.length;
  (state.investmentBrokerSnapshots||[]).forEach(s=>(s.accounts||[]).forEach(a=>(a.holdings||[]).forEach(h=>{if(!String(h.name||h.ticker||"").trim())return;const i=ensureMasterInstrument(h);if(i)h.instrumentId=i.id})));
  (state.investmentMonthlySnapshots||[]).forEach(s=>(s.accounts||[]).forEach(a=>(a.holdings||[]).forEach(h=>{if(!String(h.name||h.ticker||"").trim())return;const i=ensureMasterInstrument(h);if(i)h.instrumentId=i.id})));
  (state.investmentWatchlist||[]).forEach(w=>{const i=ensureMasterInstrument(w);if(i)w.instrumentId=i.id});
  return state.instruments.length-before
}
function masterUsage(i){
  const latest=officialBrokerLatest(),held=[];if(latest)(latest.accounts||[]).filter(a=>a.enabled).forEach(a=>(a.holdings||[]).forEach(h=>{if((h.instrumentId&&h.instrumentId===i.id)||(!h.instrumentId&&instrumentFallbackKey(h)===instrumentFallbackKey(i))){if(n(h.quantity)>0)held.push(a.accountName)}}));
  const ever=(state.investmentBrokerSnapshots||[]).some(s=>(s.accounts||[]).some(a=>(a.holdings||[]).some(h=>(h.instrumentId===i.id||instrumentFallbackKey(h)===instrumentFallbackKey(i))&&n(h.quantity)>0)));
  const watch=(state.investmentWatchlist||[]).find(w=>w.instrumentId===i.id||instrumentFallbackKey(w)===instrumentFallbackKey(i));return {held:[...new Set(held)],ever,watch}
}
function resetInstrumentForm(){if($("instrumentEditId"))$("instrumentEditId").value="";$("instrumentName").value="";$("instrumentClass").value="ETF";if($("instrumentMarket"))$("instrumentMarket").value="";$("instrumentTicker").value="";if($("instrumentPrice"))$("instrumentPrice").value="";if($("addInstrument"))$("addInstrument").textContent="종목 저장"}
function normalizeWatchlistItem(x={}){const ticker=String(x.ticker||"").trim(),name=String(x.name||"").trim(),market=inferMarket(ticker,x.market);return {id:x.id||uid(),instrumentId:String(x.instrumentId||""),name,market,ticker,registeredDate:x.registeredDate||x.date||today(),status:["study","interest","consider","hold"].includes(x.status)?x.status:"study",reason:String(x.reason||""),targetPrice:nullableNum(x.targetPrice),note:String(x.note||""),newsTracking:x.newsTracking!==false,createdAt:x.createdAt||new Date().toISOString(),updatedAt:x.updatedAt||x.createdAt||new Date().toISOString()}}
function watchStatusLabel(x){return {study:"공부중",interest:"관심",consider:"매수검토",hold:"보류"}[x]||"공부중"}
function watchKey(x){return brokerHoldingKey({name:x.name,ticker:x.ticker,market:x.market})}
function watchIsHeld(x){const latest=officialBrokerLatest();return !!latest&&brokerAggregatedHoldings(latest).some(h=>h.key===watchKey(x)&&n(h.quantity)>0)}
function resetWatchlist(){["watchEditId","watchName","watchTicker","watchReason","watchTargetPrice","watchNote"].forEach(id=>$(id).value="");$("watchMarket").value="";$("watchStatus").value="study";$("watchDate").value=today();if($("watchNewsTracking"))$("watchNewsTracking").checked=true}
function renderWatchlist(){
  if(!$("watchList"))return;
  const filter=state.ui.watchlistFilter||"all",q=(state.ui.watchlistSearch||"").trim().toLocaleLowerCase("ko-KR"),
    rows=[...(state.investmentWatchlist||[])].filter(x=>(filter==="all"||x.status===filter)&&(!q||[x.name,x.ticker,x.reason,x.note].join(" ").toLocaleLowerCase("ko-KR").includes(q))).sort((a,b)=>(b.registeredDate||"").localeCompare(a.registeredDate||"")||(b.updatedAt||"").localeCompare(a.updatedAt||""));
  $("watchFilter").value=filter;$("watchSearch").value=state.ui.watchlistSearch||"";$("watchCount").textContent=rows.length+"종목";
  $("watchList").innerHTML=rows.map(x=>{
    const held=watchIsHeld(x),tracking=x.newsTracking!==false;
    return `<div class="watchlist-item">
      <div class="row start"><div><div class="watchlist-meta"><span class="watchlist-status ${x.status}">${watchStatusLabel(x.status)}</span>${held?'<span class="instrument-status held">현재 보유중</span>':""}<span class="watch-news-badge ${tracking?"on":"off"}">${tracking?"📰 뉴스 추적":"뉴스 추적 OFF"}</span><span>${esc(x.registeredDate)}</span><span>${esc(marketLabel(x.market))}${x.ticker?` · ${esc(x.ticker)}`:""}</span></div><h4>${esc(x.name)}</h4></div>
      <div class="watchlist-actions">${tracking?`<button class="btn sm" data-watch-news="${x.id}">뉴스 보기</button>`:""}<button class="btn sm" data-watch-toggle-news="${x.id}">${tracking?"추적 끄기":"추적 켜기"}</button><button class="btn sm" data-watch-edit="${x.id}">수정</button><button class="btn sm danger" data-watch-delete="${x.id}">삭제</button></div></div>
      ${x.reason?`<div class="watchlist-thesis"><b>관심 이유 / 투자 아이디어</b>\n${esc(x.reason)}</div>`:""}
      <div class="sub" style="margin-top:8px">관심 매수가 ${x.targetPrice===null?"미입력":won(x.targetPrice)}${x.note?` · ${esc(x.note)}`:""}</div>
    </div>`
  }).join("")||'<div class="empty">공부하면서 눈여겨보는 종목을 가볍게 등록해 두세요. 뉴스 추적을 켜면 뉴스룸에서 3시간 단위로 신규 재료를 확인합니다.</div>';

  document.querySelectorAll("[data-watch-edit]").forEach(b=>b.onclick=()=>{
    const x=state.investmentWatchlist.find(r=>r.id===b.dataset.watchEdit);if(!x)return;
    $("watchEditId").value=x.id;$("watchName").value=x.name;$("watchMarket").value=x.market||"";$("watchTicker").value=x.ticker;$("watchDate").value=x.registeredDate;$("watchStatus").value=x.status;$("watchReason").value=x.reason;$("watchTargetPrice").value=x.targetPrice??"";$("watchNote").value=x.note;if($("watchNewsTracking"))$("watchNewsTracking").checked=x.newsTracking!==false
  });
  document.querySelectorAll("[data-watch-toggle-news]").forEach(b=>b.onclick=()=>{
    const x=state.investmentWatchlist.find(r=>r.id===b.dataset.watchToggleNews);if(!x)return;
    x.newsTracking=x.newsTracking===false;x.updatedAt=new Date().toISOString();commit(`${x.name} 뉴스 추적을 ${x.newsTracking?"켰습니다.":"껐습니다."}`)
  });
  document.querySelectorAll("[data-watch-news]").forEach(b=>b.onclick=()=>{
    const x=state.investmentWatchlist.find(r=>r.id===b.dataset.watchNews);if(!x)return;
    state.ui.investmentNewsEntity=x.ticker||x.name;save();investmentOpenNewsTab(x.ticker||x.name)
  });
  document.querySelectorAll("[data-watch-delete]").forEach(b=>b.onclick=()=>{
    const x=state.investmentWatchlist.find(r=>r.id===b.dataset.watchDelete);if(!x||!confirm(`${x.name} 관심종목 기록을 삭제할까요?`))return;
    state.investmentWatchlist=state.investmentWatchlist.filter(r=>r.id!==x.id);commit("관심종목을 삭제했습니다.")
  })
}


let investmentNewsRuntime={busy:false,error:""};

function investmentNewsIssuerMeta(x={}){
  const ticker=String(x.ticker||"").trim().toUpperCase(),name=String(x.name||"").trim();
  const known={"005935":{issuer_name:"삼성전자",issuer_ticker:"005930"},"066575":{issuer_name:"LG전자",issuer_ticker:"066570"}};
  const preferred=!!known[ticker]||/우선주|우$/.test(name),m=known[ticker]||{};
  return {issuer_name:m.issuer_name||(preferred?name.replace(/우선주|우$/g,"").trim():name),issuer_ticker:m.issuer_ticker||(preferred?"":ticker),security_type:preferred?"PREFERRED":"COMMON"}
}
function investmentNewsTargets(){
  const priority={consider:4,interest:3,study:2,hold:1};
  return [...(state.investmentWatchlist||[])]
    .filter(x=>x&&x.newsTracking!==false&&String(x.name||"").trim())
    .sort((a,b)=>(watchIsHeld(b)?1:0)-(watchIsHeld(a)?1:0)+(priority[b.status]||0)-(priority[a.status]||0)||(b.updatedAt||"").localeCompare(a.updatedAt||""))
    .slice(0,INVESTMENT_NEWS_MAX_TARGETS)
    .map(x=>{const meta=investmentNewsIssuerMeta(x),preferredNote=meta.security_type==="PREFERRED"?`발행회사 ${meta.issuer_name}${meta.issuer_ticker?`(${meta.issuer_ticker})`:""} 공통 뉴스와 우선주 직접 요인(배당·주주환원·괴리율·유동성·공시)을 함께 추적.`:"";return {id:x.id,name:x.name,ticker:x.ticker||"",market:x.market||inferMarket(x.ticker,""),reason:[x.reason||"",preferredNote].filter(Boolean).join(" "),held:watchIsHeld(x),...meta}})
}
function investmentNewsSignature(targets=investmentNewsTargets()){return targets.map(x=>[x.market,x.ticker||"",x.name,x.issuer_name||"",x.issuer_ticker||"",x.security_type||"",x.reason||"",x.held?1:0].join("|")).join("||")}
function investmentNewsReadCache(){try{const raw=localStorage.getItem(INVESTMENT_NEWS_CACHE_KEY);if(!raw)return null;const x=JSON.parse(raw);if(!x||x.schema!==3||!x.data||typeof x.data!=="object")return null;return x}catch(_){return null}}
function investmentNewsSocialRead(){try{const x=JSON.parse(localStorage.getItem(INVESTMENT_NEWS_SOCIAL_KEY)||"{}");return x&&typeof x==="object"?x:{}}catch(_){return {}}}
function investmentNewsSocialWrite(store){try{localStorage.setItem(INVESTMENT_NEWS_SOCIAL_KEY,JSON.stringify(store||{}));return true}catch(e){console.warn("Newsroom social",e);return false}}
function investmentNewsEventKey(entity,item){return [String(entity?.ticker||entity?.name||"").trim().toUpperCase(),String(item?.published_at||"").slice(0,16),String(item?.title||"").trim().toLocaleLowerCase("ko-KR")].join("|").slice(0,520)}
function investmentNewsAttachStableSocial(data){const store=investmentNewsSocialRead();let changed=false;for(const e of agentArray(data?.entities)){for(const item of agentArray(e.news)){const key=investmentNewsEventKey(e,item),incoming=agentArray(item.comments).filter(c=>c&&c.comment),old=store[key];if(old?.comments?.length){item.comments=old.comments;if(old.hani_view)item.hani_view=old.hani_view}else if(incoming.length){store[key]={comments:incoming.slice(0,7),hani_view:String(item.hani_view||""),read:false,createdAt:new Date().toISOString()};changed=true}item._news_key=key}}if(changed)investmentNewsSocialWrite(store);return data}
function investmentNewsWriteCache(data,targets){const stable=investmentNewsAttachStableSocial(structuredClone(data||{})),payload={schema:3,savedAt:new Date().toISOString(),signature:investmentNewsSignature(targets),data:stable};try{localStorage.setItem(INVESTMENT_NEWS_CACHE_KEY,JSON.stringify(payload));return true}catch(e){console.warn("Investment news cache",e);return false}}
function investmentNewsCacheFresh(cache,targets=investmentNewsTargets()){if(!cache||cache.signature!==investmentNewsSignature(targets))return false;const stamp=new Date(cache.savedAt||cache.data?.generated_at||0).getTime();return Number.isFinite(stamp)&&Date.now()-stamp<INVESTMENT_NEWS_TTL_MS}
function investmentNewsSafeUrl(value){try{const u=new URL(String(value||""));return /^https?:$/.test(u.protocol)?u.href:""}catch(_){return ""}}
function investmentNewsGradeLabel(v){return {OFFICIAL:"공식/확정",MEDIA:"언론보도",BROKER:"증권사 전망",RUMOR:"시장루머"}[v]||"출처 미분류"}
function investmentNewsSentimentLabel(v){return {POSITIVE:"호재",NEUTRAL:"중립",NEGATIVE:"악재",MIXED:"혼재",NO_NEWS:"신규 없음"}[v]||"중립"}
function investmentNewsImpactLabel(v){return {POSITIVE:"📈 호재",NEUTRAL:"➖ 중립",NEGATIVE:"📉 악재",MIXED:"⚖️ 혼재",NO_NEWS:"➖ 신규 없음"}[v]||"➖ 중립"}
function investmentNewsCommentToneLabel(v){return {ANALYSIS:"분석",SHORT:"한마디",BANTER:"잡담",COUNTER:"반론",CAUTION:"체크"}[String(v||"").toUpperCase()]||"의견"}
function investmentNewsTone(v){return v==="POSITIVE"?"positive":v==="NEGATIVE"?"negative":v==="MIXED"?"mixed":"neutral"}
function investmentNewsScopeLabel(v){return v==="PREFERRED_DIRECT"?"⭐ 우선주 직접":v==="BOTH"?"🏢+⭐ 공통·직접":"🏢 기업 공통"}
function investmentNewsFmtTime(v){if(!v)return "시간 미확인";const s=String(v).trim();if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s;const d=new Date(s);if(Number.isNaN(d.getTime()))return esc(s);return new Intl.DateTimeFormat("ko-KR",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}).format(d)}
function investmentNewsWithinHours(v,hours=72){if(!v)return true;const d=new Date(v).getTime();return Number.isNaN(d)?true:(Date.now()-d<=hours*3600000)}
function investmentNewsFlatten(data,{interestHours=72}={}){const rows=[];for(const e of agentArray(data?.entities)){for(const item of agentArray(e.news))if(investmentNewsWithinHours(item.published_at,interestHours))rows.push({entity:e,item})}return rows.sort((a,b)=>String(b.item.published_at||"").localeCompare(String(a.item.published_at||""))||n(b.item.importance)-n(a.item.importance))}
function investmentNewsComments(entity,item){if(item?._archive_post_id)return agentArray(item.comments).filter(c=>c&&c.comment).slice(0,7);const store=investmentNewsSocialRead(),key=item._news_key||investmentNewsEventKey(entity,item),saved=store[key];return saved?.comments?.length?saved.comments:agentArray(item.comments).filter(c=>c&&c.comment).slice(0,7)}
function investmentNewsIsRead(entity,item){if(item?._archive_post_id)return investmentNewsArchiveIsRead(item);const x=investmentNewsSocialRead()[item._news_key||investmentNewsEventKey(entity,item)];return x?.read===true}
function investmentNewsMarkRead(entity,item){if(item?._archive_post_id){investmentNewsArchiveMarkRead(item);return}const store=investmentNewsSocialRead(),key=item._news_key||investmentNewsEventKey(entity,item),old=store[key]||{};store[key]={...old,read:true,readAt:new Date().toISOString()};investmentNewsSocialWrite(store)}
function investmentNewsHaniView(entity,item){if(item?._archive_post_id)return String(item.hani_view||"").trim()||"HANI View 대기";const store=investmentNewsSocialRead(),saved=store[item._news_key||investmentNewsEventKey(entity,item)],view=String(saved?.hani_view||item.hani_view||"").trim();return view||"v0.3 서버 브리핑 적용 후 HANI View가 표시됩니다."}

let investmentNewsArchiveRuntime={loading:false,loaded:false,error:"",loadedAt:0,posts:[],readSet:new Set(),weeklySelectedId:""};
function investmentNewsArchivePosts(type=""){const rows=agentArray(investmentNewsArchiveRuntime.posts);return (type?rows.filter(x=>x.post_type===type):rows).sort((a,b)=>String(b.published_at||b.created_at||"").localeCompare(String(a.published_at||a.created_at||"")))}
function investmentNewsArchiveInterestRows(){return investmentNewsArchivePosts("INTEREST").map(p=>{const meta=agentObj(p.payload),item={title:p.title||"",summary:p.summary||"",why_it_matters:p.why_it_matters||"",hani_view:p.hani_view||"",published_at:p.event_at||p.published_at||"",source_name:p.source_name||"",source_url:p.source_url||"",source_verified:p.source_verified===true,source_grade:p.source_grade||"MEDIA",sentiment:p.sentiment||"NEUTRAL",importance:n(p.importance)||1,event_type:meta.event_type||"NEWS",scope:meta.scope||"COMPANY_COMMON",comments:agentArray(p.comments),_archive_post_id:p.id,_archive_payload:meta},entity={name:p.entity_name||p.ticker||"종목",ticker:p.ticker||"",market:p.market||"OTHER",issuer_name:meta.issuer_name||p.entity_name||"",issuer_ticker:meta.issuer_ticker||p.ticker||"",security_type:meta.security_type||"OTHER",signal:meta.signal||p.sentiment||"NEUTRAL",summary:meta.entity_summary||p.summary||"",watch_point:meta.watch_point||""};return {entity,item,postId:p.id}})}
function investmentNewsArchiveEntities(rows=investmentNewsArchiveInterestRows()){const m=new Map();for(const r of rows){const key=r.entity.ticker||r.entity.name;if(!m.has(key))m.set(key,{...r.entity,signal:r.item.sentiment||r.entity.signal,summary:r.entity.summary||r.item.summary,news:[]});m.get(key).news.push(r.item)}return [...m.values()]}
function investmentNewsArchiveIsRead(item){const id=item?._archive_post_id;return !!id&&investmentNewsArchiveRuntime.readSet instanceof Set&&investmentNewsArchiveRuntime.readSet.has(id)}
async function investmentNewsArchiveMarkRead(item){const id=item?._archive_post_id;if(!id||!cloudClient||!cloudUser)return false;if(!(investmentNewsArchiveRuntime.readSet instanceof Set))investmentNewsArchiveRuntime.readSet=new Set();investmentNewsArchiveRuntime.readSet.add(id);try{const {error}=await cloudClient.from("hani_newsroom_reads").upsert({user_id:cloudUser.id,post_id:id,read_at:new Date().toISOString()},{onConflict:"user_id,post_id"});if(error)throw error;return true}catch(e){console.warn("Newsroom read state",e);return false}}
async function investmentNewsArchiveLoad(force=false){if(!cloudClient||!cloudUser){investmentNewsArchiveRuntime={...investmentNewsArchiveRuntime,loaded:false,error:"Cloud 로그인 필요",posts:[],readSet:new Set()};return false}if(investmentNewsArchiveRuntime.loading)return false;if(!force&&investmentNewsArchiveRuntime.loaded&&Date.now()-n(investmentNewsArchiveRuntime.loadedAt)<60000)return true;investmentNewsArchiveRuntime.loading=true;try{const [postsRes,readsRes]=await Promise.all([cloudClient.from("hani_newsroom_posts").select("id,post_type,period_key,title,entity_name,ticker,market,sentiment,source_grade,importance,event_at,published_at,source_name,source_url,source_verified,summary,why_it_matters,hani_view,comments,payload,created_at,updated_at").eq("user_id",cloudUser.id).order("published_at",{ascending:false}).limit(INVESTMENT_NEWS_ARCHIVE_LIMIT),cloudClient.from("hani_newsroom_reads").select("post_id,read_at").eq("user_id",cloudUser.id)]);if(postsRes.error)throw postsRes.error;if(readsRes.error)throw readsRes.error;investmentNewsArchiveRuntime={...investmentNewsArchiveRuntime,loading:false,loaded:true,error:"",loadedAt:Date.now(),posts:agentArray(postsRes.data),readSet:new Set(agentArray(readsRes.data).map(x=>x.post_id).filter(Boolean))};renderInvestmentNews();return true}catch(e){investmentNewsArchiveRuntime={...investmentNewsArchiveRuntime,loading:false,loaded:false,error:e?.message||String(e)};console.warn("Newsroom archive load",e);renderInvestmentNews();return false}}
async function investmentNewsArchiveErrorDetail(error){
  const parts=[];
  if(error?.message)parts.push(String(error.message));
  try{
    const ctx=error?.context;
    if(ctx){
      if(ctx.status)parts.push(`HTTP ${ctx.status}`);
      let detail="";
      try{
        const res=ctx.clone?ctx.clone():ctx,body=await res.json();
        detail=String(body?.message||body?.error||body?.details||JSON.stringify(body)||"").slice(0,500)
      }catch(_){
        try{const res=ctx.clone?ctx.clone():ctx;detail=String(await res.text()).slice(0,500)}catch(__){}
      }
      if(detail)parts.push(detail)
    }
  }catch(_){}
  return parts.filter(Boolean).join(" · ")||"Newsroom Archive 저장 실패"
}
async function investmentNewsArchiveSubmit(data){
  if(!cloudClient||!cloudUser||!data){investmentNewsArchiveRuntime.error="Cloud 로그인 또는 뉴스 데이터가 없습니다.";return null}
  try{
    const {data:r,error}=await cloudClient.functions.invoke(INVESTMENT_NEWS_ARCHIVE_FUNCTION,{body:{action:"archive_result",news:data}});
    if(error)throw new Error(await investmentNewsArchiveErrorDetail(error));
    if(!r?.ok)throw new Error(r?.message||r?.error||"Newsroom Archive 저장 실패");
    return r
  }catch(e){investmentNewsArchiveRuntime.error=e?.message||String(e);console.warn("Newsroom archive submit",e);return null}
}
function investmentNewsArchiveVerifyResult(data){
  const expected=agentArray(data?.entities).flatMap(entity=>agentArray(entity?.news).map(item=>({
    title:String(item?.title||"").trim(),ticker:String(entity?.ticker||"").trim().toUpperCase()
  }))).filter(x=>x.title);
  const posts=agentArray(investmentNewsArchiveRuntime.posts);
  if(!expected.length)return posts.length>0;
  return expected.some(x=>posts.some(p=>String(p?.title||"").trim()===x.title&&(!x.ticker||String(p?.ticker||"").trim().toUpperCase()===x.ticker)))
}
function investmentNewsRenderWeeklyArchive(fallbackData,mode="interest"){
  const posts=investmentNewsArchivePosts("WEEKLY"),tabs=$("investmentNewsWeeklyArchiveTabs");
  if(!posts.length){if(tabs)tabs.innerHTML=investmentNewsArchiveRuntime.loading?'<span>Cloud Archive를 불러오는 중…</span>':investmentNewsArchiveRuntime.error?`<span>Cloud Archive 대기 · ${esc(investmentNewsArchiveRuntime.error)}</span>`:'<span>아직 저장된 주간 종합 시황이 없습니다.</span>';if($("investmentNewsWeeklyTitle"))$("investmentNewsWeeklyTitle").textContent="이번 주 시장 한눈에";investmentNewsRenderWeekly(fallbackData);return}
  const valid=new Set(posts.map(p=>p.id)),selected=valid.has(investmentNewsArchiveRuntime.weeklySelectedId)?investmentNewsArchiveRuntime.weeklySelectedId:posts[0].id;investmentNewsArchiveRuntime.weeklySelectedId=selected;
  if(tabs){tabs.innerHTML=posts.map(p=>`<button type="button" class="newsroom-weekly-archive-btn ${p.id===selected?"active":""}" data-weekly-archive="${esc(p.id)}"><b>${esc(p.title)}</b>${investmentNewsArchiveRuntime.readSet.has(p.id)?"":"<span>NEW</span>"}</button>`).join("");tabs.querySelectorAll("[data-weekly-archive]").forEach(btn=>btn.onclick=()=>{investmentNewsArchiveRuntime.weeklySelectedId=btn.dataset.weeklyArchive||"";const p=posts.find(x=>x.id===investmentNewsArchiveRuntime.weeklySelectedId);if(p)investmentNewsArchiveMarkRead({_archive_post_id:p.id});renderInvestmentNews()})}
  const post=posts.find(p=>p.id===selected)||posts[0],payload=agentObj(post.payload),w=agentObj(payload.weekly_brief);if($("investmentNewsWeeklyTitle"))$("investmentNewsWeeklyTitle").textContent=post.title||"주간 종합 시황";investmentNewsRenderWeekly({market_brief:payload.market_brief||post.summary||"",weekly_brief:{...w,hani_view:w.hani_view||post.hani_view||""}});if(mode==="general"&&!investmentNewsArchiveRuntime.readSet.has(post.id))investmentNewsArchiveMarkRead({_archive_post_id:post.id});
}
function investmentNewsRenderWeekly(data){
  const w=agentObj(data.weekly_brief),market=data.market_brief||"최신 뉴스 확인을 누르면 최근 7일 한국·미국 시장을 함께 정리합니다.";
  if($("investmentNewsMarketBrief"))$("investmentNewsMarketBrief").textContent=market;
  if($("investmentNewsKoreaBrief"))$("investmentNewsKoreaBrief").textContent=w.korea_market||"v0.3 서버 브리핑을 새로 생성하면 한국 시장 요약이 표시됩니다.";
  if($("investmentNewsUsBrief"))$("investmentNewsUsBrief").textContent=w.us_market||"v0.3 서버 브리핑을 새로 생성하면 미국 시장 요약이 표시됩니다.";
  if($("investmentNewsMajorEvents"))$("investmentNewsMajorEvents").innerHTML=agentArray(w.major_events).length?agentArray(w.major_events).map(x=>`<li>${esc(x)}</li>`).join(""):'<li>최신 브리핑 대기</li>';
  if($("investmentNewsMacroFlow"))$("investmentNewsMacroFlow").innerHTML=agentArray(w.macro_flow).length?agentArray(w.macro_flow).map(x=>`<li>${esc(x)}</li>`).join(""):'<li>최신 브리핑 대기</li>';
  if($("investmentNewsThemes"))$("investmentNewsThemes").innerHTML=agentArray(w.key_themes).length?agentArray(w.key_themes).map(x=>`<span>${esc(x)}</span>`).join(""):'<span>최신 브리핑 대기</span>';
  if($("investmentNewsCheckpoints"))$("investmentNewsCheckpoints").innerHTML=agentArray(w.checkpoints).length?agentArray(w.checkpoints).map(x=>`<li>${esc(x)}</li>`).join(""):'<li>최신 뉴스 확인 후 다음 체크포인트를 정리합니다.</li>';
  if($("investmentNewsHaniViewGeneral"))$("investmentNewsHaniViewGeneral").textContent=w.hani_view||"💜 HANI View는 v0.3 뉴스 브리핑을 새로 생성하면 표시됩니다.";
}
function renderInvestmentNews(){
  if(!$("investmentNewsFeed"))return;
  const targets=investmentNewsTargets(),cache=investmentNewsReadCache(),data=investmentNewsAttachStableSocial(agentObj(cache?.data)),fresh=investmentNewsCacheFresh(cache,targets),archiveRows=investmentNewsArchiveInterestRows(),archiveActive=investmentNewsArchiveRuntime.loaded&&archiveRows.length>0,entities=archiveActive?investmentNewsArchiveEntities(archiveRows):agentArray(data.entities),mode=state.ui.investmentNewsMode==="general"?"general":"interest";
  state.ui.investmentNewsMode=mode;
  document.querySelectorAll("[data-newsroom-mode]").forEach(btn=>{
    btn.classList.toggle("active",btn.dataset.newsroomMode===mode);
    btn.onclick=()=>{state.ui.investmentNewsMode=btn.dataset.newsroomMode;save();renderInvestmentNews()}
  });
  if($("newsroomGeneralPane"))$("newsroomGeneralPane").hidden=mode!=="general";
  if($("newsroomInterestPane"))$("newsroomInterestPane").hidden=mode!=="interest";
  investmentNewsRenderWeeklyArchive(data,mode);

  const validKeys=new Set(entities.map(e=>e.ticker||e.name).filter(Boolean)),requested=state.ui.investmentNewsEntity||"all",selected=requested==="all"||validKeys.has(requested)?requested:"all";
  if(selected!==requested){state.ui.investmentNewsEntity="all";save()}

  const targetBox=$("investmentNewsTargets");
  if(targetBox){
    targetBox.innerHTML=targets.length
      ?`<button type="button" class="investment-news-target ${selected==="all"?"active":""}" data-news-target="all">전체 흐름</button>`+
        targets.map(x=>{
          const key=x.ticker||x.name;
          return `<button type="button" class="investment-news-target ${x.held?"held":""} ${selected===key?"active":""}" data-news-target="${esc(key)}">${x.held?"● ":""}${esc(x.name)}${x.ticker?` <small>${esc(x.ticker)}</small>`:""}${x.security_type==="PREFERRED"?` <em>우선주+기업</em>`:""}</button>`
        }).join("")
      :'<span class="investment-news-target empty">종목 관리에서 뉴스 추적을 켜주세요.</span>';
    targetBox.querySelectorAll("[data-news-target]").forEach(btn=>btn.onclick=()=>{
      state.ui.investmentNewsEntity=btn.dataset.newsTarget||"all";
      state.ui.investmentNewsMode="interest";
      save();
      renderInvestmentNews()
    })
  }

  if($("investmentNewsState")){
    $("investmentNewsState").textContent=investmentNewsRuntime.busy?"검색 중":investmentNewsRuntime.error?"오류":investmentNewsArchiveRuntime.loaded?"ARCHIVE":cache?(fresh?"FRESH":"STALE"):"대기";
    $("investmentNewsState").className=`pill finance news-state ${investmentNewsRuntime.error?"bad":investmentNewsArchiveRuntime.loaded?"ok":fresh?"ok":cache?"warn":""}`
  }
  if($("investmentNewsUpdated")){const latest=investmentNewsArchivePosts()[0];$("investmentNewsUpdated").textContent=latest?`Cloud Archive 최신 ${agentFmtDate(latest.published_at||latest.created_at)}`:cache?.savedAt?`마지막 확인 ${agentFmtDate(cache.savedAt)}${fresh?" · 3시간 캐시 유효":" · 갱신 필요"}`:"아직 검색하지 않음"}
  if($("investmentNewsPolicy"))$("investmentNewsPolicy").textContent=`종합 주차별 누적 · 관심 신규뉴스 누적 · 자동 발행 · 추적 ${targets.length}/${INVESTMENT_NEWS_MAX_TARGETS}종목`;

  const selectedEntity=selected==="all"?null:entities.find(e=>(e.ticker||e.name)===selected);
  if($("investmentNewsEntityBriefs")){
    $("investmentNewsEntityBriefs").innerHTML=entities.length?entities.map(e=>{
      const key=e.ticker||e.name,isActive=selected===key;
      return `<button type="button" class="investment-news-entity-row ${investmentNewsTone(e.signal)} ${isActive?"active":""}" data-news-entity="${esc(key)}"><div class="news-entity-main"><b>${esc(e.name)}</b><span>${esc(marketLabel(e.market))}${e.ticker?` · ${esc(e.ticker)}`:""}${e.security_type==="PREFERRED"?` · 발행회사 ${esc(e.issuer_name||"")}`:""}</span></div><div class="news-entity-summary">${esc(e.summary||"신규 요약 없음")}</div><span class="news-entity-signal ${investmentNewsTone(e.signal)}">${investmentNewsImpactLabel(e.signal)}</span><span class="news-entity-count">${archiveActive?agentArray(e.news).length:agentArray(e.news).filter(x=>investmentNewsWithinHours(x.published_at,72)).length}건</span></button>`
    }).join(""):'<div class="empty">뉴스 검색 결과가 아직 없습니다.</div>';
    $("investmentNewsEntityBriefs").querySelectorAll("[data-news-entity]").forEach(btn=>btn.onclick=()=>{
      const key=btn.dataset.newsEntity||"all";
      state.ui.investmentNewsEntity=state.ui.investmentNewsEntity===key?"all":key;
      save();
      renderInvestmentNews()
    })
  }

  const entityFilter=$("investmentNewsEntityFilter");
  if(entityFilter){
    entityFilter.innerHTML=['<option value="all">전체 종목</option>',...entities.map(e=>{
      const key=e.ticker||e.name;
      return `<option value="${esc(key)}">${esc(e.name)}</option>`
    })].join("");
    entityFilter.value=[...entityFilter.options].some(o=>o.value===selected)?selected:"all"
  }

  const entityKey=entityFilter?.value||selected||"all",grade=$("investmentNewsGradeFilter")?.value||state.ui.investmentNewsGrade||"all",sentiment=$("investmentNewsSentimentFilter")?.value||state.ui.investmentNewsSentiment||"all";
  if($("investmentNewsGradeFilter"))$("investmentNewsGradeFilter").value=grade;
  if($("investmentNewsSentimentFilter"))$("investmentNewsSentimentFilter").value=sentiment;

  const allRows=archiveActive?archiveRows:investmentNewsFlatten(data,{interestHours:72}),rows=allRows.filter(r=>
    (entityKey==="all"||(r.entity.ticker||r.entity.name)===entityKey)&&
    (grade==="all"||r.item.source_grade===grade)&&
    (sentiment==="all"||r.item.sentiment===sentiment)
  );
  if($("investmentNewsCount"))$("investmentNewsCount").textContent=rows.length+"건";
  const flowLabel=selectedEntity?`${selectedEntity.name} 뉴스 흐름`:"전체 종목 뉴스 흐름";

  $("investmentNewsFeed").innerHTML=rows.length
    ?`<div class="investment-news-board newsroom-v03-board" role="table" aria-label="${esc(flowLabel)}">
        <div class="investment-news-board-head newsroom-v03-head" role="row"><span>종목</span><span>구분</span><span>뉴스</span></div>
        ${rows.map((r,i)=>{
          const u=investmentNewsSafeUrl(r.item.source_url),verified=r.item.source_verified!==false&&!!u,comments=investmentNewsComments(r.entity,r.item),isRead=investmentNewsIsRead(r.entity,r.item),scope=r.entity.security_type==="PREFERRED"?investmentNewsScopeLabel(r.item.scope):"",importance=Math.max(1,Math.min(5,n(r.item.importance))),tone=investmentNewsTone(r.item.sentiment);
          return `<div class="investment-news-board-row newsroom-v03-row ${tone}" role="row">
            <button type="button" class="investment-news-row-main newsroom-v03-main" data-news-row-toggle="${i}" aria-expanded="false">
              <span class="news-col-symbol newsroom-v03-symbol"><b>${esc(r.entity.name)}</b><small>${r.entity.ticker?`${esc(r.entity.ticker)} · `:""}${investmentNewsFmtTime(r.item.published_at)}</small></span>
              <span class="news-col-classification">
                <em class="news-sentiment ${tone}">${investmentNewsImpactLabel(r.item.sentiment)}</em>
                <small><em class="news-grade ${String(r.item.source_grade||"").toLowerCase()}">${investmentNewsGradeLabel(r.item.source_grade)}</em><b>중요 ${importance}/5</b></small>
              </span>
              <span class="news-col-title newsroom-v03-title"><b>${esc(r.item.title)}</b><small>${esc(r.item.event_type||"NEWS")}${scope?` · ${esc(scope)}`:""}${r.item.source_name?` · ${esc(r.item.source_name)}`:""} · 💬 ${comments.length}${comments.length&&!isRead?" · NEW":""}<i>⌄</i></small></span>
            </button>
            <div class="investment-news-row-detail newsroom-v03-detail" data-news-row-detail="${i}">
              <div><b>요약</b><p>${esc(r.item.summary||"-")}</p></div>
              <div><b>왜 중요한가</b><p>${esc(r.item.why_it_matters||"-")}</p></div>
              <section class="news-hani-view"><b>💜 HANI View</b><p>${esc(investmentNewsHaniView(r.entity,r.item))}</p></section>
              <section class="news-agent-comments">
                <div class="news-comments-head"><b>💬 AI TEAM 댓글 (${comments.length})</b>${comments.length&&!isRead?'<span>NEW</span>':""}</div>
                ${comments.length?comments.map(c=>`<div class="news-agent-comment ${String(c.tone||"").toLowerCase()}"><div class="news-agent-comment-head"><strong>${esc(c.agent_name||c.agent_key||"AI TEAM")}</strong><em>${investmentNewsCommentToneLabel(c.tone)}</em></div><p>${esc(c.comment||"")}</p></div>`).join(""):'<p class="news-comments-pending">새 브리핑에서 관련 Agent 댓글을 생성합니다.</p>'}
              </section>
              <div class="investment-news-row-actions"><span>${verified?"원문 링크 확인됨":"원문 링크 미검증"}</span><div>${u?`<a class="btn sm" href="${esc(u)}" target="_blank" rel="noopener noreferrer">원문 ↗</a>`:""}<button class="btn sm" data-news-journal="${i}">투자일기에 연결</button></div></div>
            </div>
          </div>`
        }).join("")}
      </div>`
    :`<div class="empty">${investmentNewsArchiveRuntime.loaded?"Cloud Archive에 현재 필터와 일치하는 누적 뉴스가 없습니다.":"최근 72시간 기준 현재 필터에 해당하는 의미 있는 신규 뉴스가 없습니다."}</div>`;

  $("investmentNewsFeed").querySelectorAll("[data-news-row-toggle]").forEach(btn=>btn.onclick=()=>{
    const k=btn.dataset.newsRowToggle,detail=$("investmentNewsFeed").querySelector(`[data-news-row-detail="${k}"]`),row=btn.closest(".investment-news-board-row"),open=!row?.classList.contains("open");
    row?.classList.toggle("open",open);
    btn.setAttribute("aria-expanded",open?"true":"false");
    if(detail)detail.hidden=!open;
    if(open){
      const rr=rows[Number(k)];
      if(rr&&investmentNewsComments(rr.entity,rr.item).length&&!investmentNewsIsRead(rr.entity,rr.item)){
        investmentNewsMarkRead(rr.entity,rr.item);
        setTimeout(()=>renderInvestmentNews(),30)
      }
    }
  });
  $("investmentNewsFeed").querySelectorAll("[data-news-row-detail]").forEach(x=>x.hidden=true);
  $("investmentNewsFeed").querySelectorAll("[data-news-journal]").forEach(btn=>btn.onclick=e=>{
    e.stopPropagation();
    const row=rows[Number(btn.dataset.newsJournal)];
    if(row)investmentNewsToJournal(row)
  });

  const usage=agentObj(data.usage);
  if($("investmentNewsUsage")){
    const total=n(usage.total_tokens),model=data.model||"gpt-5.6-luna";
    $("investmentNewsUsage").textContent=investmentNewsArchiveRuntime.loaded?`Cloud Archive · 주간 ${investmentNewsArchivePosts("WEEKLY").length}편 · 관심 ${investmentNewsArchivePosts("INTEREST").length}건 · 자동 발행 · 읽음 상태 기기 간 공유 · Life OS 원장과 분리`:cache?`3시간 캐시 fallback · ${targets.length}종목 · ${model}${total?` · 최근 API ${num(total)} tokens`:""}`:"Cloud Archive 연결 전에는 로컬 캐시를 fallback으로 사용합니다."
  }
}
function investmentNewsToJournal(row){const e=row.entity,item=row.item,u=investmentNewsSafeUrl(item.source_url);showView("investment");activateInvestmentTab("investJournal");resetJournal();$("journalDate").value=today();$("journalAction").value="watch";$("journalStock").value=e.name||e.ticker||"";$("journalReason").value=`뉴스 확인 · ${item.title||""}`.trim();$("journalContext").value=[item.summary,item.why_it_matters?`왜 중요한가: ${item.why_it_matters}`:"",investmentNewsHaniView(e,item)?`HANI View: ${investmentNewsHaniView(e,item)}`:"",item.source_name?`출처: ${item.source_name}`:"",u?`원문: ${u}`:""].filter(Boolean).join("\n");$("journalPlan").value=e.watch_point||"후속 공시·실적·주가 반응 확인";$("journalReason").scrollIntoView({behavior:"smooth",block:"center"});toast("뉴스 내용을 투자 일기 Draft로 옮겼습니다. 저장 전 확인해 주세요.")}
function investmentOpenNewsTab(entityKey="all"){state.ui.investmentNewsEntity=entityKey||"all";state.ui.investmentNewsMode="interest";save();showView("newsroom");renderInvestmentNews();setTimeout(()=>$("investmentNewsFeed")?.scrollIntoView({behavior:"smooth",block:"start"}),80)}
async function investmentNewsRefresh(force=false,{silent=false}={}){if(investmentNewsRuntime.busy)return;const targets=investmentNewsTargets(),cache=investmentNewsReadCache();if(!targets.length){renderInvestmentNews();if(!silent)alert("관심종목에서 뉴스 추적을 켠 종목이 없습니다.");return}if(!force&&investmentNewsCacheFresh(cache,targets)){renderInvestmentNews();return}try{investmentNewsRuntime={busy:true,error:""};renderInvestmentNews();if(!silent)haniWorkShow({agent:"hani",title:"하니가 주간 시장 + 관심종목 뉴스를 확인하는 중",step:"HANI · NEWSROOM v0.3",message:`종합 7일 · 관심 72시간 · ${targets.length}개 종목을 검색하고 있어요.`});const result=await agentApi("investment_news",{lookback_hours:168,interest_lookback_hours:72,brief_scope:"KR_US_WEEKLY",targets:targets.map(x=>({name:x.name,ticker:x.ticker,market:x.market,reason:x.reason,held:x.held,issuer_name:x.issuer_name,issuer_ticker:x.issuer_ticker,security_type:x.security_type}))}),data=agentObj(result.news);if(!agentArray(data.entities).length)throw new Error("뉴스 검색 결과 구조를 확인하지 못했습니다.");investmentNewsWriteCache(data,targets);const archiveResult=await investmentNewsArchiveSubmit(data);if(!archiveResult)throw new Error(investmentNewsArchiveRuntime.error||"Newsroom Cloud Archive 저장 실패");const archiveLoaded=await investmentNewsArchiveLoad(true);if(!archiveLoaded)throw new Error(investmentNewsArchiveRuntime.error||"Newsroom Cloud Archive 재조회 실패");if(!investmentNewsArchiveVerifyResult(data))throw new Error("Newsroom Cloud Archive read-back 검증 실패 · 생성한 뉴스가 Cloud DB에서 확인되지 않습니다.");investmentNewsRuntime={busy:false,error:""};renderInvestmentNews();if(!silent){haniWorkFinish(true,"뉴스룸 Archive 업데이트 완료!");haniWorkHide(700)}}catch(e){investmentNewsRuntime={busy:false,error:e?.message||String(e)};renderInvestmentNews();if(!silent){haniWorkFinish(false,"뉴스 업데이트 중 확인할 문제가 생겼어요.");haniWorkHide(900);alert(`투자 뉴스 업데이트에 실패했습니다.\n${investmentNewsRuntime.error}\n\n기존 뉴스 캐시는 유지합니다.`)}}}
function investmentNewsMaybeRefresh(){const targets=investmentNewsTargets(),cache=investmentNewsReadCache();renderInvestmentNews();investmentNewsArchiveLoad(false);if(targets.length&&!investmentNewsCacheFresh(cache,targets))investmentNewsRefresh(false,{silent:true})}

function emotionLabel(x){return {calm:"차분함",confident:"확신",fear:"불안·공포",greed:"조급함·욕심",regret:"후회",neutral:"중립"}[x]||"중립"}
function journalActionLabel(x){return {buy:"매수",sell:"매도",watch:"관망",review:"복기"}[x]||x}
function resetJournal(){["journalEditId","journalStock","journalReason","journalContext","journalPlan","journalPrice","journalQty"].forEach(id=>$(id).value="");$("journalDate").value=today();$("journalAction").value="buy";$("journalAccount").value="";$("journalEmotion").value="calm"}
function renderInvestmentJournal(){const filter=state.ui.journalFilter||"all",q=(state.ui.journalSearch||"").trim().toLocaleLowerCase("ko-KR"),rows=[...(state.investmentJournal||[])].filter(x=>(filter==="all"||x.action===filter)&&(!q||[x.stock,x.reason,x.context,x.plan].join(" ").toLocaleLowerCase("ko-KR").includes(q))).sort((a,b)=>(b.date||"").localeCompare(a.date||"")||(b.updatedAt||"").localeCompare(a.updatedAt||""));$("journalFilter").value=filter;$("journalSearch").value=state.ui.journalSearch||"";$("journalCount").textContent=rows.length+"건";$("journalList").innerHTML=rows.map(x=>`<div class="journal-entry"><div class="row start"><div><div class="journal-meta"><span class="journal-action ${x.action}">${journalActionLabel(x.action)}</span><span>${esc(x.date)}</span><span>${esc(accountBy(x.accountId)?.name||"계좌 미연결")}</span><span>${emotionLabel(x.emotion)}</span></div><h4>${esc(x.stock||"종목 미지정")}</h4></div><div class="acts"><button class="btn sm" data-journal-edit="${x.id}">수정</button><button class="btn sm danger" data-journal-delete="${x.id}">삭제</button></div></div><div class="journal-body"><b>판단 이유</b>\n${esc(x.reason||"-")}${x.context?`\n\n<b>시장 상황</b>\n${esc(x.context)}`:""}</div>${x.plan?`<div class="journal-plan"><b>이후 계획</b><br>${esc(x.plan)}</div>`:""}${x.price!==null||x.qty!==null?`<div class="sub">선택 기록 · 체결가 ${x.price===null?"-":won(x.price)} · 수량 ${x.qty??"-"}</div>`:""}</div>`).join("")||'<div class="empty">매수·매도 판단과 당시 감정을 가볍게 남겨보세요.</div>';document.querySelectorAll("[data-journal-edit]").forEach(b=>b.onclick=()=>{const x=state.investmentJournal.find(r=>r.id===b.dataset.journalEdit);if(!x)return;$("journalEditId").value=x.id;$("journalDate").value=x.date;$("journalAction").value=x.action;$("journalAccount").value=x.accountId;$("journalStock").value=x.stock;$("journalEmotion").value=x.emotion;$("journalReason").value=x.reason;$("journalContext").value=x.context;$("journalPlan").value=x.plan;$("journalPrice").value=x.price??"";$("journalQty").value=x.qty??""});document.querySelectorAll("[data-journal-delete]").forEach(b=>b.onclick=()=>{if(!confirm("이 투자 일기를 삭제할까요?"))return;state.investmentJournal=state.investmentJournal.filter(x=>x.id!==b.dataset.journalDelete);commit("투자 일기를 삭제했습니다.")})}
function renderInvestmentHighlights(){
  const box=$("investmentHighlights");if(!box)return;const latest=officialBrokerLatest(),prev=latest?previousOfficialBroker(latest):null;
  if(!latest){box.innerHTML='<div class="empty" style="grid-column:1/-1">첫 월간 기록을 저장하면 이달의 효자종목과 일등계좌가 표시됩니다.</div>';return}
  const hs=brokerAggregatedHoldings(latest),positive=hs.filter(h=>h.pnl!==null&&h.pnl>0).sort((a,b)=>n(b.pnl)-n(a.pnl))[0],bestRate=hs.filter(h=>h.rate!==null).sort((a,b)=>n(b.rate)-n(a.rate))[0];let collector=null;
  if(prev){const pm=annualHoldingMap(prev);collector=hs.map(h=>({h,d:n(h.quantity)-n(pm.get(h.key)?.quantity)})).filter(x=>x.d>0).sort((a,b)=>b.d-a.d)[0]||null}
  const calc=brokerCalc(latest),srcAcc=new Map((latest.accounts||[]).map(a=>[a.accountId,a])),accRows=calc.accounts.map(a=>({a,rate:srcAcc.get(a.accountId)?.totalReturn??a.rate})).filter(x=>x.rate!==null&&x.rate!==undefined),bestAcc=accRows.sort((a,b)=>n(b.rate)-n(a.rate))[0],largest=[...calc.accounts].sort((a,b)=>n(b.assets)-n(a.assets))[0];
  const items=[
    ["🏆","이달의 효자종목",positive?positive.name:"아직 없음",positive?signedWon(positive.pnl):"플러스 손익 종목 없음"],
    ["🚀","수익률 1위",bestRate?bestRate.name:"기록 없음",bestRate?pct(n(bestRate.rate)):"-"],
    ["🌱","가장 많이 모은 종목",collector?collector.h.name:(prev?"추가매수 없음":"다음 기록부터"),collector?`전월 대비 +${num(collector.d)}주`:(prev?"수량 증가 없음":"전월 비교 필요")],
    ["👑","이달의 일등계좌",bestAcc?bestAcc.a.accountName:"기록 없음",bestAcc?pct(n(bestAcc.rate)):"-"],
    ["💰","가장 큰 계좌",largest?.accountName||"기록 없음",largest?won(largest.assets):"-"]
  ];
  box.innerHTML=items.map(([ico,l,v,sub])=>`<div class="highlight-card"><span class="highlight-ico">${ico}</span><div><small>${l}</small><b>${esc(String(v))}</b><span>${esc(String(sub))}</span></div></div>`).join("")
}
function accountSnapshotAt(s,id){return brokerCalc(s).accounts.find(a=>a.accountId===id)||null}
function renderInvestmentAccountOverview(){
  const sel=$("overviewAccountSelect");if(!sel)return;const rows=officialBrokerSorted(),latest=rows.at(-1),available=state.accounts.filter(a=>rows.some(s=>(s.accounts||[]).some(x=>x.enabled&&x.accountId===a.id))),list=available.length?available:state.accounts,preferred=state.ui.overviewAccountId||sel.value||list[0]?.id||"";
  sel.innerHTML=list.map(a=>`<option value="${a.id}">${esc(a.name)} · ${esc(a.broker)}</option>`).join("");sel.value=list.some(a=>a.id===preferred)?preferred:(list[0]?.id||"");state.ui.overviewAccountId=sel.value;
  const id=sel.value,a=latest?accountSnapshotAt(latest,id):null,src=latest?.accounts?.find(x=>x.accountId===id),stats=$("overviewAccountStats");if(stats){const accountRate=a?(src?.totalReturn??a.rate):null;stats.innerHTML=[["계좌 총자산",a?won(a.assets):"",""],["평가금액",a?won(a.evaluation):"-",""],["평가손익",a?signedWon(a.pnl):"-",a?investmentMoveClass(a.pnl):""],["수익률",a?`${num(accountRate)}%`:"-",a?investmentMoveClass(accountRate):""],["기준월",latest?.period||"-",""]].map(([l,v,cl])=>`<div class="broker-kpi"><div class="label">${l}</div><div class="value ${cl}">${v||"-"}</div></div>`).join("")}
  const body=$("overviewAccountHoldingRows");if(body){const original=latest?.accounts?.find(x=>x.enabled&&x.accountId===id),hs=(original?.holdings||[]).filter(h=>String(h.name||"").trim());body.innerHTML=hs.map(h=>{const c=brokerHoldingCalc(h);return `<tr class="security-row"><td>${investmentSecurityNameHtml(h)}</td><td>${h.quantity===null?"-":num(h.quantity)}</td><td>${h.buyPrice===null?"-":won(h.buyPrice)}</td><td>${h.currentPrice===null?"-":won(h.currentPrice)}</td><td>${c.evaluation===null?"-":won(c.evaluation)}</td><td class="${investmentMoveClass(c.pnl)}">${c.pnl===null?"-":signedWon(c.pnl)}</td><td class="${investmentMoveClass(c.rate)}">${c.rate===null?"-":num(c.rate)+"%"}</td></tr>`}).join("")||'<tr><td colspan="7">이 계좌의 보유종목 기록이 없습니다.</td></tr>'}
  drawInvestmentAccountChart();sel.onchange=()=>{state.ui.overviewAccountId=sel.value;save();renderInvestmentAccountOverview()}
}
function drawInvestmentAccountChart(){const canvas=$("overviewAccountChart");if(!canvas)return;const id=$("overviewAccountSelect")?.value,year=state.ui.investmentYear,rows=officialBrokerSorted().filter(s=>!year||String(s.period||"").startsWith(year+"-"));drawLines(canvas,rows.map(s=>s.period),[{name:accountBy(id)?.name||"계좌",color:seriesColor(id),data:rows.map(s=>accountSnapshotAt(s,id)?.assets||0)}],"월간 기록이 쌓이면 선택 계좌의 자산 흐름이 표시됩니다.")}
function syncOverviewYearMirror(){const mirror=$("overviewYearSelect"),src=$("annualInvestmentYear");if(!mirror||!src)return;mirror.innerHTML=src.innerHTML;mirror.value=src.value;mirror.onchange=()=>{src.value=mirror.value;src.dispatchEvent(new Event("change"));setTimeout(()=>{syncOverviewYearMirror();renderInvestmentAccountOverview()},0)}}
function activateInvestmentTab(panelId){const tabs=document.querySelector('.investment-tabs-main');if(!tabs)return;const b=tabs.querySelector(`[data-panel="${panelId}"]`);if(b)b.click()}
function renderInvestmentQuickSuite(){renderBrokerSnapshots();renderAnnualInvestment();renderCashFlows();renderWatchlist();renderInvestmentJournal()}

function refreshSelects(){
  const accountOptions=state.accounts.map(a=>`<option value="${a.id}">${esc(a.name)} · ${esc(a.broker)}</option>`).join("");
  $("txAccount").innerHTML=accountOptions;
  $("txFilterAccount").innerHTML='<option value="all">전체 계좌</option>'+accountOptions;
  $("txInstrument").innerHTML=sortedInstruments().map(i=>`<option value="${i.id}">${esc(i.name)}</option>`).join("");
  if($("flowAccount")){$("flowAccount").innerHTML=accountOptions;$("flowToAccount").innerHTML=accountOptions}
  if($("journalAccount"))$("journalAccount").innerHTML='<option value="">연결하지 않음</option>'+accountOptions;
}
function accountCardHtml(a,calc,allowDelete=false){const x=calc.accounts[a.id];return `<div class="account-card" data-account="${a.id}"><div class="account-top"><div style="display:flex;gap:10px;align-items:center"><div class="account-icon">🏦</div><div><b>${esc(a.name)}</b><div class="sub">${esc(a.broker)} · ${esc(a.type)}</div></div></div>${allowDelete?`<button class="btn sm danger" data-delete-account="${a.id}">삭제</button>`:""}</div><div class="account-value series-amount" style="--series-color:${seriesColor(a.id)}">${won(x.total)}</div><div class="sub">현금 ${won(x.cash)} · 보유 ${Object.values(x.holdings).filter(h=>h.qty>0).length}종목</div><div class="sub">${esc(mask(a.number))}</div></div>`}
function renderAccounts(){
  const calc=calculate(),latest=officialBrokerLatest(),record=latest?brokerCalc(latest):null;$("accountCount").textContent=state.accounts.length+"개";const manageCards=state.accounts.map(a=>accountCardHtml(a,calc,true)).join("");let summaryCards;if(record){const byId=new Map(record.accounts.map(a=>[a.accountId,a]));summaryCards=state.accounts.map(a=>{const x=byId.get(a.id);return `<div class="account-card"><div class="account-top"><div style="display:flex;gap:10px;align-items:center"><div class="account-icon">🏦</div><div><b>${esc(a.name)}</b><div class="sub">${esc(a.broker)} · ${esc(a.type)}</div></div></div></div><div class="account-value series-amount" style="--series-color:${seriesColor(a.id)}">${x?won(x.assets):"미기록"}</div><div class="sub">${x?`${latest.period} 월간 기록 · ${x.holdings.filter(h=>String(h.name||"").trim()).length}종목`:"이번 스냅샷에서 사용하지 않은 계좌"}</div><div class="sub">${esc(mask(a.number))}</div></div>`}).join("")}else summaryCards=state.accounts.map(a=>accountCardHtml(a,calc,false)).join("");$("accountList").innerHTML=manageCards||'<div class="empty">등록 계좌가 없습니다.</div>';$("homeAccounts").innerHTML=summaryCards||'<div class="empty">등록 계좌가 없습니다.</div>';$("assetAccounts").innerHTML=summaryCards||'<div class="empty">등록 계좌가 없습니다.</div>';document.querySelectorAll("#accountList [data-account]").forEach(el=>el.onclick=e=>{if(e.target.closest("[data-delete-account]"))return;openAccountDetail(el.dataset.account)});document.querySelectorAll("[data-delete-account]").forEach(b=>b.onclick=e=>{e.stopPropagation();const id=b.dataset.deleteAccount;if(state.transactions.some(t=>t.accountId===id))return alert("연결된 거래내역을 먼저 삭제하세요.");if(!confirm("이 계좌를 삭제할까요?"))return;state.accounts=state.accounts.filter(a=>a.id!==id);state.ui.series=state.ui.series.filter(x=>x!==id);commit("계좌를 삭제했습니다.")});
}

$("addAccount").onclick=()=>{const name=$("accName").value.trim(),type=$("accType").value.trim(),broker=$("accBroker").value.trim();if(!name||!type||!broker)return alert("계좌 표시명, 유형, 금융사를 입력하세요.");const id=uid();state.accounts.push({id,name,type,broker,number:$("accNumber").value.trim(),openingCash:0});state.ui.series.push(id);["accName","accType","accBroker","accNumber"].forEach(id=>$(id).value="");commit("계좌를 추가했습니다.")};

function renderInstruments(){
  if(!$("instrumentRows"))return;const rows=sortedInstruments();$("instrumentCount").textContent=rows.length+"개";
  $("instrumentRows").innerHTML=rows.map(i=>{const u=masterUsage(i),badges=[u.held.length?'<span class="instrument-status held">보유중</span>':u.ever?'<span class="instrument-status past">보유 종료</span>':'<span class="instrument-status">등록</span>',u.watch?'<span class="watchlist-status interest">관심</span>':""];return `<tr><td><b>${esc(i.name)}</b><div class="sub">${badges.join(" ")}</div></td><td>${esc(i.className||"기타")}</td><td>${esc(marketLabel(i.market||inferMarket(i.ticker,"")))}</td><td>${esc(i.ticker||"-")}</td><td>${u.held.map(esc).join(", ")||"-"}</td><td><div class="acts"><button class="btn sm" data-edit-instrument="${i.id}">수정</button>${!u.watch?`<button class="btn sm" data-master-watch="${i.id}">관심 등록</button>`:""}<button class="btn sm danger" data-delete-instrument="${i.id}">삭제</button></div></td></tr>`}).join("")||'<tr><td colspan="6">등록 종목이 없습니다. 먼저 추적할 종목을 등록해 주세요.</td></tr>';
  document.querySelectorAll("[data-edit-instrument]").forEach(b=>b.onclick=()=>{const i=instrumentBy(b.dataset.editInstrument);if(!i)return;$("instrumentEditId").value=i.id;$("instrumentName").value=i.name;$("instrumentClass").value=i.className||"기타";$("instrumentMarket").value=i.market||inferMarket(i.ticker,"");$("instrumentTicker").value=i.ticker||"";$("addInstrument").textContent="수정 저장";$("instrumentName").scrollIntoView({behavior:"smooth",block:"center"})});
  document.querySelectorAll("[data-master-watch]").forEach(b=>b.onclick=()=>{const i=instrumentBy(b.dataset.masterWatch);if(!i)return;resetWatchlist();$("watchName").value=i.name;$("watchTicker").value=i.ticker||"";$("watchMarket").value=i.market||inferMarket(i.ticker,"");$("watchDate").value=today();$("watchName").scrollIntoView({behavior:"smooth",block:"center"})});
  document.querySelectorAll("[data-delete-instrument]").forEach(b=>b.onclick=()=>{const id=b.dataset.deleteInstrument,i=instrumentBy(id),u=i?masterUsage(i):null;if(!i)return;if(state.transactions.some(t=>t.instrumentId===id)||u?.ever||u?.watch)return alert("월간 기록·관심종목·거래내역에 연결된 종목은 삭제할 수 없습니다. 기록 보존을 위해 종목을 유지해 주세요.");if(!confirm("이 종목을 삭제할까요?"))return;state.instruments=state.instruments.filter(x=>x.id!==id);commit("종목을 삭제했습니다.")})
}
$("addInstrument").onclick=()=>{const id=$("instrumentEditId")?.value||"",name=$("instrumentName").value.trim(),ticker=$("instrumentTicker").value.trim(),market=inferMarket(ticker,$("instrumentMarket")?.value||"");if(!name)return alert("종목명을 입력하세요.");const key=instrumentFallbackKey({name,ticker,market}),dup=state.instruments.find(i=>i.id!==id&&instrumentFallbackKey(i)===key);if(dup)return alert(`이미 등록된 종목입니다: ${dup.name}`);const old=instrumentBy(id);if(old){old.name=name;old.className=$("instrumentClass").value;old.ticker=ticker;old.market=market;old.updatedAt=new Date().toISOString()}else state.instruments.push({id:uid(),name,className:$("instrumentClass").value,ticker,market,price:0,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});resetInstrumentForm();commit(id?"종목 정보를 수정했습니다.":"종목을 등록했습니다.")};
function renderHoldings(){
  const c=calculate(),accountOrder=new Map(state.accounts.map((a,idx)=>[a.id,idx]));
  const rows=[...c.holdings].sort((a,b)=>compareNames(instrumentBy(a.instrumentId)?.name,instrumentBy(b.instrumentId)?.name)||(accountOrder.get(a.accountId)??999)-(accountOrder.get(b.accountId)??999));
  $("holdingStats").innerHTML=[["보유종목",c.holdings.length+"개"],["평가액",won(c.totalMarket)],["매입원가",won(c.totalCost)],["평가손익",won(c.pnl)]].map(([l,v])=>`<div class="stat"><div class="label">${l}</div><div class="value">${v}</div></div>`).join("");
  $("holdingRows").innerHTML=rows.map(h=>{const a=accountBy(h.accountId),i=instrumentBy(h.instrumentId);const meta={instrumentId:h.instrumentId,name:i?.name||"삭제된 종목",ticker:i?.ticker||"",market:i?.market||""};return `<tr><td>${esc(a?.name||"-")}</td><td>${investmentSecurityNameHtml(meta)}</td><td>${num(h.qty)}</td><td>${won(h.avg)}</td><td>${won(h.valuationPrice)}${h.priceFallback?'<span class="price-fallback">평균단가 임시 적용</span>':''}</td><td>${won(h.market)}</td><td class="${investmentMoveClass(h.pnl)}">${won(h.pnl)}</td><td class="${investmentMoveClass(h.rate)}">${pct(h.rate)}</td></tr>`}).join("")||'<tr><td colspan="8">보유내역이 없습니다. 종목을 등록한 뒤 매수 거래를 입력하세요.</td></tr>';
}

function updateTxForm(){const type=$("txType").value,isSec=type==="매수"||type==="매도";document.querySelectorAll(".tx-security").forEach(x=>x.classList.toggle("hidden",!isSec));document.querySelectorAll(".tx-cash").forEach(x=>x.classList.toggle("hidden",isSec));$("txAmountLabel").textContent=type==="현금조정"?"조정금액 (+/-)":"금액";const guides={입금:"입금액을 입력하면 해당 계좌의 현금잔액에 반영됩니다.",출금:"출금액만큼 해당 계좌의 현금잔액이 감소합니다.",매수:"수량과 거래단가, 수수료를 기준으로 보유수량과 평균단가가 자동 계산됩니다. 현재가가 비어 있으면 첫 거래가가 자동 등록됩니다.",매도:"평균단가는 유지되고 매도대금에서 수수료를 뺀 금액이 현금에 반영됩니다.",현금조정:"실제 잔액과 맞추기 위한 증감액을 입력하세요. 감소는 음수로 입력합니다."};$("txGuide").textContent=guides[type]}
$("txType").onchange=updateTxForm;
$("addTransaction").onclick=()=>{
  const type=$("txType").value,accountId=$("txAccount").value,date=$("txDate").value;if(!date||!accountId)return alert("날짜와 계좌를 선택하세요.");const t={id:uid(),date,accountId,type,note:$("txNote").value.trim(),createdAt:new Date().toISOString()};
  if(type==="매수"||type==="매도"){
    if(!state.instruments.length)return alert("먼저 종목을 등록하세요.");t.instrumentId=$("txInstrument").value;t.qty=n($("txQty").value);t.price=n($("txPrice").value);t.fee=n($("txFee").value);if(!t.instrumentId||t.qty<=0||t.price<=0)return alert("종목, 수량, 거래단가를 확인하세요.");if(type==="매도"&&t.qty>availableQty(accountId,t.instrumentId)+1e-9)return alert("보유수량보다 많이 매도할 수 없습니다.");const instrument=instrumentBy(t.instrumentId);if(instrument&&n(instrument.price)<=0)instrument.price=t.price;
  }else{t.amount=n($("txAmount").value);if(type!=="현금조정"&&t.amount<=0)return alert("금액을 입력하세요.");if(type==="현금조정"&&t.amount===0)return alert("0이 아닌 조정금액을 입력하세요.")}
  state.transactions.push(t);["txQty","txPrice","txAmount","txNote"].forEach(id=>$(id).value="");$("txFee").value="0";autoSnapshot();commit("거래를 저장했습니다.");
};
function renderTransactions(){
  const filter=$("txFilterAccount").value||"all";const rows=[...state.transactions].sort((a,b)=>(b.date||"").localeCompare(a.date||"")||(b.createdAt||"").localeCompare(a.createdAt||"")).filter(t=>filter==="all"||t.accountId===filter);$("transactionCount").textContent=state.transactions.length+"건";
  $("transactionRows").innerHTML=rows.map(t=>{const a=accountBy(t.accountId),i=instrumentBy(t.instrumentId),isSec=t.type==="매수"||t.type==="매도";return `<tr><td>${esc(t.date)}</td><td>${esc(a?.name||"-")}</td><td><b>${esc(t.type)}</b></td><td>${isSec?esc(i?.name||"-"):"-"}</td><td>${isSec?num(t.qty):"-"}</td><td>${isSec?won(t.price):won(t.amount)}</td><td>${isSec?won(t.fee):"-"}</td><td>${esc(t.note||"-")}</td><td><button class="btn sm danger" data-delete-tx="${t.id}">삭제</button></td></tr>`}).join("")||'<tr><td colspan="9">거래 기록이 없습니다.</td></tr>';
  document.querySelectorAll("[data-delete-tx]").forEach(b=>b.onclick=()=>{if(!confirm("이 거래를 삭제할까요? 보유수량과 현금이 다시 계산됩니다."))return;state.transactions=state.transactions.filter(t=>t.id!==b.dataset.deleteTx);autoSnapshot();commit("거래를 삭제했습니다.")});
}
$("txFilterAccount").onchange=renderTransactions;

function autoSnapshot(){const c=calculate(),date=today(),row={date,total:c.total,accounts:{}};state.accounts.forEach(a=>row.accounts[a.id]=c.accounts[a.id]?.total||0);state.snapshots=state.snapshots.filter(s=>s.date!==date);state.snapshots.push(row)}
$("saveSnapshot").onclick=()=>{autoSnapshot();commit("오늘 자산 스냅샷을 저장했습니다.")};
function renderPortfolio(){
  const c=calculate(),latest=officialBrokerLatest(),record=latest?brokerCalc(latest):null,live=record?{total:record.total,cash:record.cashLike,market:record.evaluation,pnl:record.pnl}: {total:c.total,cash:c.totalCash,market:c.totalMarket,pnl:c.pnl};$("investmentLiveTotal").textContent=won(live.total);$("investmentLiveTotal").style.color=seriesColor("total");$("investmentLiveCash").textContent=latest?latest.period+" 기준":"기존 거래 기준";$("investmentLiveMarket").textContent=won(live.market);$("investmentLivePnl").textContent=signedWon(live.pnl);$("investmentLivePnl").classList.remove("danger","invest-up","invest-down","invest-flat");$("investmentLivePnl").classList.add(investmentMoveClass(live.pnl));$("portfolioStats").innerHTML=[["총자산",won(live.total),"series-amount",seriesColor("total")],["평가금액",won(live.market),"",""],["추정 현금성",won(live.cash),"",""],["평가손익",signedWon(live.pnl),investmentMoveClass(live.pnl),""]].map(([l,v,cl,color])=>`<div class="stat"><div class="label">${l}</div><div class="value ${cl||""}" ${color?`style="--series-color:${color}"`:""}>${v}</div></div>`).join("");
  const goal=n(state.goals.investment),rate=goal?Math.max(0,Math.min(100,live.total/goal*100)):0;$("investGoalValue").textContent=won(goal);$("investGoalText").textContent=`현재 ${won(live.total)} · ${rate.toFixed(2)}%`;$("investGoalBar").style.width=rate+"%";$("investGoalEnd").textContent=won(goal);
  $("overviewAccounts").innerHTML=latest?record.accounts.map(a=>`<div class="item"><div class="row"><b>${esc(a.accountName)}</b><b>${won(a.assets)}</b></div><div class="sub">${latest.period} 월간 기록 기준</div></div>`).join(""):state.accounts.map(a=>{const color=seriesColor(a.id),x=c.accounts[a.id];return `<div class="item clickable" data-account="${a.id}" style="--series-color:${color}"><div class="row"><b style="display:flex;align-items:center;gap:8px"><span class="series-dot"></span>${esc(a.name)}</b><b class="series-amount">${won(x.total)}</b></div><div class="sub">기존 거래 기록 기준</div></div>`}).join("");
  const series=new Set(state.ui.series||["total"]);$("seriesToggles").innerHTML=[["total","총자산"],...state.accounts.map(a=>[a.id,a.name])].map(([id,label])=>`<label class="check-chip" style="--series-color:${seriesColor(id)}"><input type="checkbox" data-series="${id}" ${series.has(id)?"checked":""}><span class="series-dot"></span>${esc(label)}</label>`).join("");document.querySelectorAll("[data-series]").forEach(x=>x.onchange=()=>{const s=new Set(state.ui.series||[]);x.checked?s.add(x.dataset.series):s.delete(x.dataset.series);state.ui.series=[...s];save();drawPortfolio()});document.querySelectorAll("#overviewAccounts [data-account]").forEach(x=>x.onclick=()=>openAccountDetail(x.dataset.account));drawPortfolio();
}

$("editInvestGoal").onclick=()=>{$("goalInput").value=state.goals.investment;openModal("goalModal")};$("saveGoal").onclick=()=>{const v=n($("goalInput").value);if(v<=0)return alert("목표금액을 입력하세요.");state.goals.investment=v;closeModal("goalModal");commit("투자 목표를 수정했습니다.")};

function canvasSetup(canvas){const r=canvas.getBoundingClientRect(),d=window.devicePixelRatio||1;canvas.width=Math.max(1,r.width*d);canvas.height=Math.max(1,r.height*d);const ctx=canvas.getContext("2d");ctx.setTransform(d,0,0,d,0,0);return{ctx,w:r.width,h:r.height}}
function drawLines(canvas,labels,series,message,{targets=[]}={}){
  if(!canvas||canvas.offsetParent===null)return;const {ctx,w,h}=canvasSetup(canvas),css=getComputedStyle(document.documentElement),line=css.getPropertyValue("--line"),muted=css.getPropertyValue("--muted"),text=css.getPropertyValue("--text");ctx.clearRect(0,0,w,h);if(!labels.length||!series.length){ctx.fillStyle=muted;ctx.textAlign="center";ctx.font="13px sans-serif";ctx.fillText(message,w/2,h/2);return}
  const colors=["#7569e8","#4285f4","#2faa77","#ef9d3c","#58bce8","#8b63dc","#dc6279"];const values=[...series.flatMap(s=>s.data.filter(Number.isFinite)),...targets.map(t=>t.value)].filter(Number.isFinite);if(!values.length){ctx.fillStyle=muted;ctx.textAlign="center";ctx.font="13px sans-serif";ctx.fillText(message,w/2,h/2);return}let min=Math.min(...values),max=Math.max(...values);if(min===max){min-=1;max+=1}const pad=(max-min)*.12;min-=pad;max+=pad;const P={l:58,r:18,t:30,b:38};const X=i=>P.l+(labels.length===1?(w-P.l-P.r)/2:i*(w-P.l-P.r)/(labels.length-1));const Y=v=>P.t+(max-v)*(h-P.t-P.b)/(max-min);
  ctx.font="11px sans-serif";ctx.strokeStyle=line;ctx.fillStyle=muted;ctx.textAlign="right";for(let i=0;i<5;i++){const y=P.t+i*(h-P.t-P.b)/4;ctx.beginPath();ctx.moveTo(P.l,y);ctx.lineTo(w-P.r,y);ctx.stroke();const val=max-i*(max-min)/4;const span=max-min,axisLabel=Math.abs(val)>=1000000?(val/1000000).toFixed(1)+"M":span<1?val.toFixed(2):span<10?val.toFixed(1):Math.round(val).toLocaleString();ctx.fillText(axisLabel,P.l-7,y+4)}
  targets.forEach((t,j)=>{ctx.save();ctx.strokeStyle=t.color||colors[(series.length+j)%colors.length];ctx.setLineDash([6,5]);ctx.beginPath();ctx.moveTo(P.l,Y(t.value));ctx.lineTo(w-P.r,Y(t.value));ctx.stroke();ctx.fillStyle=ctx.strokeStyle;ctx.textAlign="left";ctx.fillText(t.name,P.l+5,Y(t.value)-5);ctx.restore()});
  series.forEach((s,j)=>{ctx.strokeStyle=s.color||colors[j%colors.length];ctx.lineWidth=2.7;ctx.setLineDash([]);ctx.beginPath();let started=false;s.data.forEach((v,i)=>{if(!Number.isFinite(v)){started=false;return}if(!started){ctx.moveTo(X(i),Y(v));started=true}else ctx.lineTo(X(i),Y(v))});ctx.stroke();s.data.forEach((v,i)=>{if(!Number.isFinite(v))return;ctx.fillStyle=ctx.strokeStyle;ctx.beginPath();ctx.arc(X(i),Y(v),3,0,Math.PI*2);ctx.fill()})});
  ctx.fillStyle=muted;ctx.textAlign="center";const step=Math.max(1,Math.ceil(labels.length/6));labels.forEach((l,i)=>{if(i%step===0||i===labels.length-1)ctx.fillText(String(l).slice(5),X(i),h-13)});
  let lx=P.l;ctx.textAlign="left";ctx.font="11px sans-serif";series.forEach((s,j)=>{ctx.fillStyle=s.color||colors[j%colors.length];ctx.fillRect(lx,P.t-18,12,3);ctx.fillStyle=text;ctx.fillText(s.name,lx+17,P.t-13);lx+=ctx.measureText(s.name).width+40});
}
function currentSnapshot(){const c=calculate(),row={date:today(),total:c.total,accounts:{}};state.accounts.forEach(a=>row.accounts[a.id]=c.accounts[a.id]?.total||0);return row}
function chartRows(){const map=new Map(state.snapshots.map(s=>[s.date,s]));map.set(today(),currentSnapshot());return [...map.values()].sort((a,b)=>a.date.localeCompare(b.date))}
function drawPortfolio(){const rows=chartRows(),active=new Set(state.ui.series||[]),series=[];if(active.has("total"))series.push({name:"총자산",color:seriesColor("total"),data:rows.map(r=>n(r.total))});state.accounts.forEach(a=>{if(active.has(a.id))series.push({name:a.name,color:seriesColor(a.id),data:rows.map(r=>n(r.accounts?.[a.id]))})});drawLines($("portfolioChart"),rows.map(r=>r.date),series,"거래를 입력하면 현재 자산이 표시되고, 스냅샷이 쌓이면 추이를 볼 수 있습니다.")}

function openAccountDetail(id){activeAccountId=id;const a=accountBy(id),c=calculate(),x=c.accounts[id];if(!a||!x)return;$("modalAccountTitle").textContent=a.name+" 상세";$("modalAccountSub").textContent=`${a.broker} · ${a.type} · ${mask(a.number)}`;const accountColor=seriesColor(id);$("modalAccountStats").innerHTML=[["총입금액",won(x.deposits),true],["현금잔액",won(x.cash),true],["총자산",won(x.total),true],["보유종목",Object.values(x.holdings).filter(h=>h.qty>0).length+"개",false]].map(([l,v,isMoney])=>`<div class="stat"><div class="label">${l}</div><div class="value${isMoney?' series-amount':''}" ${isMoney?`style="--series-color:${accountColor}"`:''}>${v}</div></div>`).join("");
  const hs=c.holdings.filter(h=>h.accountId===id).sort((a,b)=>compareNames(instrumentBy(a.instrumentId)?.name,instrumentBy(b.instrumentId)?.name));$("modalHoldings").innerHTML=hs.map(h=>{const i=instrumentBy(h.instrumentId);return `<div class="item"><div class="row"><b>${esc(i?.name||"-")}</b><b>${won(h.market)}</b></div><div class="sub">${num(h.qty)}주 · 평균 ${won(h.avg)} · 손익 ${won(h.pnl)}</div></div>`}).join("")||'<div class="empty">보유종목이 없습니다.</div>';
  const tx=[...state.transactions].filter(t=>t.accountId===id).sort((a,b)=>(b.date||"").localeCompare(a.date||"")).slice(0,6);$("modalTransactions").innerHTML=tx.map(t=>`<div class="item"><div class="row"><b>${esc(t.type)} ${t.instrumentId?esc(instrumentBy(t.instrumentId)?.name||""):""}</b><span>${esc(t.date)}</span></div><div class="sub">${t.instrumentId?`${num(t.qty)}주 · ${won(t.price)}`:won(t.amount)}${t.note?" · "+esc(t.note):""}</div></div>`).join("")||'<div class="empty">최근 거래가 없습니다.</div>';openModal("accountModal");setTimeout(()=>drawAccountChart(id),40)}
function drawAccountChart(id){const a=accountBy(id),rows=chartRows();drawLines($("accountChart"),rows.map(r=>r.date),[{name:a?.name||"계좌",color:seriesColor(id),data:rows.map(r=>n(r.accounts?.[id]))}],"스냅샷이 쌓이면 계좌 추이가 표시됩니다.")}


function ledgerSorted(){
  return [...(state.ledgerMonths||[])].map(normalizeLedgerMonth).sort((a,b)=>a.month.localeCompare(b.month));
}
function ledgerCurrentMonthKey(){return state.ui.ledgerMonth||monthKeyNow()}
function ledgerFind(month=ledgerCurrentMonthKey()){return (state.ledgerMonths||[]).find(x=>x.month===month)||null}
function ledgerEnsure(month=ledgerCurrentMonthKey()){
  let rec=ledgerFind(month);
  if(rec)return rec;
  rec=normalizeLedgerMonth({month,items:[],comment:""});
  state.ledgerMonths.push(rec);
  return rec;
}
function ledgerCalc(rec){
  const items=rec?.items||[],sumCategory=category=>items.filter(x=>x.category===category).reduce((a,x)=>a+n(x.amount),0),
    fixed=sumCategory("fixed"),variable=sumCategory("variable"),special=sumCategory("special"),finance=sumCategory("finance"),total=fixed+variable+special+finance,
    reimbursementT=items.filter(x=>["fixed","variable","special"].includes(x.category)).reduce((a,x)=>a+n(x.reimbursement),0),
    reimbursementC=items.filter(x=>["variable","special"].includes(x.category)).reduce((a,x)=>a+n(x.reimbursement),0),
    jispiT=fixed+variable+special-reimbursementT,jispiC=variable+special-reimbursementC,targetT=n(rec?.targetT)||2300000,targetC=n(rec?.targetC)||1400000;
  const biggest=[...items].sort((a,b)=>n(b.amount)-n(a.amount))[0]||null;
  const biggestCategory=[["고정비",fixed],["유동비",variable],["특별지출",special],["금융·자산",finance]].sort((a,b)=>b[1]-a[1])[0];
  return {fixed,variable,special,finance,total,reimbursementT,reimbursementC,jispiT,jispiC,targetT,targetC,biggest,biggestCategory:biggestCategory[1]?biggestCategory:["-",0]};
}
const LEDGER_CATEGORY_LABELS={fixed:"고정비",variable:"유동비",special:"특별지출",finance:"금융·자산"};
const LEDGER_IMPORT_HEADERS=["날짜","내용","금액","결제수단","대분류","소분류","세부항목","회수예정액"];
const LEDGER_REWARD_PAYMENT="네이버페이 간편결제(포인트)";
let ledgerImportPreview=null;
const ledgerDetailView={sort:"amountDesc",category:"all",subcategory:"all"};
let ledgerEditMonth="";
function ledgerLatestTargets(){const latest=ledgerSorted().filter(x=>n(x.targetT)>0&&n(x.targetC)>0).at(-1);return {targetT:n(latest?.targetT)||2300000,targetC:n(latest?.targetC)||1400000}}
function ledgerDetailSubcategories(items,category){return [...new Set((items||[]).filter(x=>category==="all"||x.category===category).map(x=>String(x.subcategory||"").trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"ko"))}
function ledgerVisibleItems(items,view){return [...(items||[])].filter(x=>(view.category==="all"||x.category===view.category)&&(view.subcategory==="all"||x.subcategory===view.subcategory)).sort((a,b)=>view.sort==="amountAsc"?n(a.amount)-n(b.amount):view.sort==="dateDesc"?String(b.date||"").localeCompare(String(a.date||"")):view.sort==="dateAsc"?String(a.date||"").localeCompare(String(b.date||"")):n(b.amount)-n(a.amount))}
function ledgerSettlementMonth(date){const m=String(date||"").match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/);if(!m)return "";const y=Number(m[1]),mo=Number(m[2]),day=Number(m[3]),d=new Date(y,mo-1,day);if(d.getFullYear()!==y||d.getMonth()!==mo-1||d.getDate()!==day)return "";const target=day>=18?new Date(y,mo,1):new Date(y,mo-1,1);return `${target.getFullYear()}-${String(target.getMonth()+1).padStart(2,"0")}`}
function ledgerSettlementPeriod(month){const m=String(month||"").match(/^(\d{4})-(\d{2})$/);if(!m)return {periodStart:"",periodEnd:""};const y=Number(m[1]),mo=Number(m[2]),prev=new Date(y,mo-2,18),end=new Date(y,mo-1,17),fmt=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;return {periodStart:fmt(prev),periodEnd:fmt(end)}}
function ledgerCategoryKey(value){const v=String(value||"").trim().replace(/\s/g,"");return ({fixed:"fixed",고정비:"fixed",variable:"variable",유동비:"variable",변동비:"variable",special:"special",특별지출:"special",finance:"finance",금융자산:"finance","금융·자산":"finance"})[v]||""}
function parseLedgerTsv(raw){
  const lines=String(raw||"").replace(/^\uFEFF/,"").split(/\r?\n/).filter(x=>x.trim());if(lines.length<2)return {valid:false,errors:["헤더와 데이터 행을 붙여넣어 주세요."],items:[],excludedCount:0,excludedAmount:0,month:""};
  const header=lines[0].split("\t").map(x=>x.trim()),offset=header[0]!=="날짜"&&header[1]==="날짜"?1:0;if(LEDGER_IMPORT_HEADERS.some((h,i)=>header[i+offset]!==h))return {valid:false,errors:["열 이름 또는 순서를 확인해 주세요."],items:[],excludedCount:0,excludedAmount:0,month:""};
  const items=[],acceptedDates=[],errors=[],months=new Set();let excludedCount=0,excludedAmount=0;
  lines.slice(1).forEach((line,rowIndex)=>{const c=line.split("\t").slice(offset),date=String(c[0]||"").trim().replace(/[./]/g,"-"),content=String(c[1]||"").trim(),amount=n(c[2]),payment=String(c[3]||"").trim(),category=ledgerCategoryKey(c[4]),subcategory=String(c[5]||"").trim(),detail=String(c[6]||"").trim(),reimbursement=Math.min(amount,Math.max(0,n(c[7]))),month=ledgerSettlementMonth(date);if(payment===LEDGER_REWARD_PAYMENT){excludedCount++;excludedAmount+=Math.max(0,amount);return}if(!month||!content||amount<=0||!category){errors.push(`${rowIndex+2}행: 날짜·내용·금액·대분류를 확인해 주세요.`);return}const [dateYear,dateMonth,dateDay]=date.split("-").map(Number),acceptedDate=`${dateYear}-${String(dateMonth).padStart(2,"0")}-${String(dateDay).padStart(2,"0")}`;months.add(month);acceptedDates.push(acceptedDate);items.push(normalizeLedgerItem({date,content,amount,payment,category,subcategory,detail,reimbursement,note:""}))});
  if(months.size>1)errors.push("수락 행이 둘 이상의 결산 월에 걸쳐 있습니다.");
  if(months.size===1&&acceptedDates.length){const month=[...months][0],{periodStart,periodEnd}=ledgerSettlementPeriod(month),actualStart=[...acceptedDates].sort()[0],actualEnd=[...acceptedDates].sort().at(-1);if(actualStart!==periodStart||actualEnd!==periodEnd)errors.push(`표준 결산기간과 다릅니다. ${periodStart} ~ ${periodEnd} 범위를 확인해 주세요.`)}
  return {valid:errors.length===0&&items.length>0,errors,items,excludedCount,excludedAmount,month:months.size===1?[...months][0]:""};
}
function ledgerJispiStatus(value,target){const delta=target?(value-target)/target*100:0;if(delta<=-30)return "🚀 초강세/절약 신고가";if(delta<=-20)return "🔥 강한 상승장";if(delta<-10)return "📈 상승장";if(delta<=10)return "↔ 박스권/보합";if(delta<=20)return "📉 하락장";if(delta<30)return "🚨 지출 사이드카";return "🛑 지출 서킷브레이커"}
function ledgerPrev(rec){
  const rows=ledgerSorted(),idx=rows.findIndex(x=>x.id===rec?.id||x.month===rec?.month);
  return idx>0?rows[idx-1]:null;
}
function ledgerMonthLabel(month){
  if(!/^\d{4}-\d{2}$/.test(String(month||"")))return month||"-";
  const [y,m]=month.split("-");return `${y}년 ${Number(m)}월`;
}
function resetLedgerItemForm(){
  if(!$("ledgerItemEditId"))return;
  $("ledgerItemEditId").value="";$("ledgerItemDate").value="";$("ledgerItemContent").value="";$("ledgerItemPayment").value="";$("ledgerItemCategory").value="fixed";$("ledgerItemSubcategory").value="";$("ledgerItemDetail").value="";$("ledgerItemAmount").value="";$("ledgerItemReimbursement").value="";$("ledgerItemNote").value="";
  $("ledgerItemSave").textContent="수정 저장";
}
function openLedgerItemEditor(id){const rec=ledgerFind(),item=rec?.items?.find(x=>x.id===id);if(!item||ledgerEditMonth!==rec.month)return;$("ledgerItemEditId").value=item.id;$("ledgerItemDate").value=item.date||"";$("ledgerItemContent").value=item.content||"";$("ledgerItemPayment").value=item.payment||"";$("ledgerItemCategory").value=item.category||"fixed";$("ledgerItemSubcategory").value=item.subcategory||"";$("ledgerItemDetail").value=item.detail||"";$("ledgerItemAmount").value=n(item.amount);$("ledgerItemReimbursement").value=n(item.reimbursement);$("ledgerItemNote").value=item.note||"";openModal("ledgerItemModal")}
function renderLedger(){
  if(!$("ledgerMonth"))return;
  const month=ledgerCurrentMonthKey();$("ledgerMonth").value=month;
  const rec=ledgerFind(month),calc=ledgerCalc(rec),period=rec?.periodStart&&rec?.periodEnd?{periodStart:rec.periodStart,periodEnd:rec.periodEnd}:ledgerSettlementPeriod(month),items=[...(rec?.items||[])];
  const jispiCard=(label,value,target,tone)=>{const difference=value-target,rate=target?difference/target*100:0,status=ledgerJispiStatus(value,target);return `<div class="ledger-jispi-card ${tone}"><div class="ledger-jispi-head"><span>${label}</span></div><div class="ledger-breaker-line"><strong>${esc(won(value))}</strong><div class="ledger-jispi-status"><b>${esc(status)}</b></div></div>${/사이드카|서킷브레이커/.test(status)?`<div class="ledger-trigger-reason">목표 ${esc(won(target))} · 현재 ${esc(won(value))} · 목표 대비 초과로 발동</div>`:""}<div class="ledger-jispi-meta"><span>목표 ${esc(won(target))}</span><span class="${difference>0?"over":difference<0?"under":""}">목표 대비 ${difference>0?"+":""}${esc(won(difference))}</span><span class="${difference>0?"over":difference<0?"under":""}">목표 대비 ${difference>0?"+":""}${rate.toFixed(1)}%</span></div></div>`};
  $("ledgerKpis").innerHTML=jispiCard("JISPI-T · 실질 지출 지수",calc.jispiT,calc.targetT,"jispi-t")+jispiCard("JISPI-C · 핵심 소비 지수",calc.jispiC,calc.targetC,"jispi-c");
  if($("ledgerJieunComment"))$("ledgerJieunComment").textContent=rec?.jieunComment||"이번 달 코멘트가 아직 없어요.";if($("ledgerJieunInput"))$("ledgerJieunInput").value=rec?.jieunComment||"";if($("ledgerJieunCount"))$("ledgerJieunCount").textContent=`${(rec?.jieunComment||"").length} / 80`;if($("ledgerJieunEditor"))$("ledgerJieunEditor").hidden=true;
  $("ledgerSupportKpis").innerHTML=[["총지출",won(calc.total)],["거래건수",items.length+"건"],["결산기간",`${period.periodStart||"-"} ~ ${period.periodEnd||"-"}`]].map(([label,value])=>`<div><span>${label}</span><b>${esc(value)}</b></div>`).join("");
  $("ledgerCategoryKpis").innerHTML=[["고정비",calc.fixed,"fixed"],["유동비",calc.variable,"variable"],["특별지출",calc.special,"special"],["금융·자산",calc.finance,"finance"]].map(([label,value,category])=>`<div class="money-kpi ${category}"><div class="label">${label}</div><div class="big">${esc(won(value))}</div><div class="meta">총지출 대비 ${calc.total?(value/calc.total*100).toFixed(1):"0.0"}%</div></div>`).join("");
  const subcategories=ledgerDetailSubcategories(items,ledgerDetailView.category);
  if(ledgerDetailView.subcategory!=="all"&&!subcategories.includes(ledgerDetailView.subcategory))ledgerDetailView.subcategory="all";
  $("ledgerDetailSort").value=ledgerDetailView.sort;$("ledgerDetailCategory").value=ledgerDetailView.category;$("ledgerDetailSubcategory").innerHTML='<option value="all">전체 소분류</option>'+subcategories.map(value=>`<option value="${esc(value)}">${esc(value)}</option>`).join("");$("ledgerDetailSubcategory").value=ledgerDetailView.subcategory;
  const visibleItems=ledgerVisibleItems(items,ledgerDetailView);
  $("ledgerItemCount").textContent=`전체 ${items.length}건 중 ${visibleItems.length}건`;
  const editing=ledgerEditMonth===month;document.querySelector(".ledger-detail-card")?.classList.toggle("editing",editing);$("ledgerEditModeBar").hidden=!editing;
  $("ledgerItemRows").innerHTML=visibleItems.map(x=>`<tr>
    <td>${esc(x.date||"-")}</td><td><b>${esc(x.content||x.detail||"-")}</b></td><td>${esc(x.payment||"-")}</td>
    <td><span class="money-category-pill ${x.category}">${LEDGER_CATEGORY_LABELS[x.category]}</span></td><td>${esc(x.subcategory||"-")}</td><td>${esc(x.detail||"-")}</td><td>${won(x.amount)}</td><td>${won(x.reimbursement)}</td><td>${esc(x.note||"-")}</td>${editing?`<td class="ledger-manage-column"><div class="ledger-item-actions"><button class="btn sm" data-ledger-item-edit="${x.id}">수정</button><button class="btn sm danger" data-ledger-item-delete="${x.id}">삭제</button></div></td>`:""}
  </tr>`).join("")||`<tr><td colspan="${editing?10:9}"><div class="money-empty">조건에 맞는 소비 내역이 없습니다.</div></td></tr>`;
  const months=[...ledgerSorted()].reverse();
  $("ledgerMonthArchive").innerHTML=months.map(r=>{const c=ledgerCalc(r);return `<div class="money-month-card ${r.month===month?"active":""}">
    <div class="head"><div><b>${ledgerMonthLabel(r.month)}</b><div class="sub">${r.items.length}개 항목</div></div><span class="pill finance">${r.month}</span></div>
    <div class="total">${won(c.total)}</div><div class="split"><span>고정 ${won(c.fixed)}</span><span>유동 ${won(c.variable)}</span><span>특별 ${won(c.special)}</span><span>금융·자산 ${won(c.finance)}</span></div><div class="sub">JISPI-T ${won(c.jispiT)} · JISPI-C ${won(c.jispiC)}</div>
    ${r.comment?`<div class="memo">${esc(r.comment)}</div>`:""}
    <div class="actions"><button class="btn sm" data-ledger-open="${r.month}">열기</button><button class="btn sm finance" data-ledger-edit="${r.month}">수정</button><button class="btn sm danger" data-ledger-month-delete="${r.id}">삭제</button></div>
  </div>`}).join("")||'<div class="money-empty">월간 결산을 시작하면 여기에 기록이 쌓입니다.</div>';
  document.querySelectorAll("[data-ledger-open]").forEach(b=>b.onclick=()=>{ledgerEditMonth="";state.ui.ledgerMonth=b.dataset.ledgerOpen;save();resetLedgerItemForm();renderLedger();setTimeout(drawLedgerTrend,30);window.scrollTo({top:0,behavior:"smooth"})});
  document.querySelectorAll("[data-ledger-edit]").forEach(b=>b.onclick=()=>{ledgerEditMonth=b.dataset.ledgerEdit;state.ui.ledgerMonth=ledgerEditMonth;save();resetLedgerItemForm();renderLedger();document.querySelector(".ledger-detail-card")?.scrollIntoView({behavior:"smooth",block:"start"})});
  document.querySelectorAll("[data-ledger-item-edit]").forEach(b=>b.onclick=()=>openLedgerItemEditor(b.dataset.ledgerItemEdit));
  document.querySelectorAll("[data-ledger-item-delete]").forEach(b=>b.onclick=()=>{const rec=ledgerFind(),item=rec?.items?.find(x=>x.id===b.dataset.ledgerItemDelete);if(!item||ledgerEditMonth!==rec.month)return;if(!confirm(`'${item.content||item.detail||"소비 항목"}' 항목을 삭제할까요?`))return;rec.items=rec.items.filter(x=>x.id!==item.id);rec.updatedAt=new Date().toISOString();commit("소비 항목을 삭제했습니다.")});
  document.querySelectorAll("[data-ledger-month-delete]").forEach(b=>b.onclick=()=>{const r=state.ledgerMonths.find(x=>x.id===b.dataset.ledgerMonthDelete);if(!r)return;if(!confirm(`${ledgerMonthLabel(r.month)} 소비 결산 전체를 삭제할까요?`))return;state.ledgerMonths=state.ledgerMonths.filter(x=>x.id!==r.id);if(state.ui.ledgerMonth===r.month)state.ui.ledgerMonth=monthKeyNow();commit("월간 소비 결산을 삭제했습니다.")});
  renderSpendReviews();
  setTimeout(drawLedgerTrend,30);
}
function drawLedgerTrend(){
  const canvas=$("ledgerTrendChart");if(!canvas)return;
  const rows=ledgerSorted(),labels=rows.map(r=>r.month),calcs=rows.map(ledgerCalc);
  drawLines(canvas,labels,[
    {name:"총지출",color:"#4285f4",data:calcs.map(c=>c.total)},
    {name:"고정비",color:"#7569e8",data:calcs.map(c=>c.fixed)},
    {name:"유동비",color:"#2faa77",data:calcs.map(c=>c.variable)},
    {name:"특별지출",color:"#ef9d3c",data:calcs.map(c=>c.special)},
    {name:"금융·자산",color:"#8b63dc",data:calcs.map(c=>c.finance)},
    {name:"JISPI-T",color:"#dc6279",data:calcs.map(c=>c.jispiT)},
    {name:"JISPI-C",color:"#00a6a6",data:calcs.map(c=>c.jispiC)}
  ],"월간 소비 결산과 JISPI 추이가 표시됩니다.");
}
function daysSince(date){
  const d=new Date(String(date||"")+"T00:00:00"),t=new Date(today()+"T00:00:00");
  if(Number.isNaN(d.getTime()))return null;return Math.max(0,Math.floor((t-d)/86400000));
}
const spendVerdictLabel=v=>v==="good"?"잘 샀다":v==="bad"?"후회":"애매하다";
const spendFrequencyLabel=v=>({daily:"거의 매일",weekly:"주 1회 이상",sometimes:"가끔",rarely:"거의 안 씀",na:"해당 없음"}[v]||"-");
const spendRepurchaseLabel=v=>({yes:"다시 산다",maybe:"모르겠다",no:"다시 안 산다"}[v]||"-");
function spendLatest(x){return [...(x.reviews||[])].sort((a,b)=>String(a.date).localeCompare(String(b.date))).at(-1)||null}
function resetSpendPurchaseForm(){
  if(!$("spendPurchaseEditId"))return;
  $("spendPurchaseEditId").value="";$("spendPurchaseDate").value=today();$("spendPurchaseName").value="";$("spendPurchaseAmount").value="";$("spendPurchaseCategory").value="";$("spendPurchaseReason").value="";$("spendPurchaseSave").textContent="소비 등록";
}
function openSpendPurchaseModal(purchaseId=""){
  resetSpendPurchaseForm();
  const p=purchaseId?(state.spendReviews||[]).find(x=>x.id===purchaseId):null;
  if(p){
    $("spendPurchaseEditId").value=p.id;$("spendPurchaseDate").value=p.date;$("spendPurchaseName").value=p.name;$("spendPurchaseAmount").value=p.amount;$("spendPurchaseCategory").value=p.category;$("spendPurchaseReason").value=p.reason;
    $("spendPurchaseSave").textContent="소비 수정";$("spendPurchaseModalTitle").textContent="소비 기록 수정";
  }else $("spendPurchaseModalTitle").textContent="리뷰할 소비 등록";
  openModal("spendPurchaseModal");
  setTimeout(()=>$("spendPurchaseName")?.focus(),80);
}
function openSpendReviewModal(purchaseId,reviewId=""){
  const p=(state.spendReviews||[]).find(x=>x.id===purchaseId);if(!p)return;
  const r=reviewId?(p.reviews||[]).find(x=>x.id===reviewId):null;
  $("spendReviewPurchaseId").value=p.id;$("spendReviewEditId").value=r?.id||"";
  $("spendReviewModalTitle").textContent=r?"소비 후속 리뷰 수정":"소비 후속 리뷰 추가";
  $("spendReviewModalSummary").innerHTML=`<b>${esc(p.name)}</b><span>${esc(p.date)} · ${won(p.amount)}${p.category?` · ${esc(p.category)}`:""}</span>`;
  $("spendReviewDate").value=r?.date||today();$("spendReviewScore").value=String(r?.score||5);$("spendReviewVerdict").value=r?.verdict||"good";$("spendReviewFrequency").value=r?.frequency||"sometimes";$("spendReviewRepurchase").value=r?.repurchase||"maybe";$("spendReviewNote").value=r?.note||"";
  openModal("spendReviewModal");
}
function renderSpendReviews(){
  if(!$("spendReviewStats"))return;
  const all=state.spendReviews,reviewed=all.filter(x=>x.reviews.length),latestRows=reviewed.map(x=>spendLatest(x)).filter(Boolean);
  const avg=latestRows.length?latestRows.reduce((a,r)=>a+n(r.score),0)/latestRows.length:null;
  const repRows=latestRows.filter(r=>r.repurchase==="yes"||r.repurchase==="no"),repYes=repRows.filter(r=>r.repurchase==="yes").length;
  const pending=all.filter(x=>!spendLatest(x)).length;

  $("spendReviewStats").innerHTML=[
    ["전체 기록",all.length+"건"],["리뷰 대기",pending+"건"],["평균 만족도",avg===null?"-":avg.toFixed(1)+" / 5"],["재구매 의사",repRows.length?Math.round(repYes/repRows.length*100)+"%":"-"]
  ].map(([l,v])=>`<div class="spend-stat"><div class="label">${l}</div><b>${esc(v)}</b></div>`).join("");

  const search=String(state.ui.spendReviewSearch||"").trim().toLowerCase(),
    filter=state.ui.spendReviewFilter||"all",
    monthFilter=state.ui.spendReviewMonth||"all";
  if($("spendReviewSearch"))$("spendReviewSearch").value=state.ui.spendReviewSearch||"";
  if($("spendReviewFilter"))$("spendReviewFilter").value=filter;

  const monthKeys=[...new Set(all.map(p=>String(p.date||"").slice(0,7)).filter(x=>/^\d{4}-\d{2}$/.test(x)))].sort().reverse();
  if($("spendReviewMonth")){
    $("spendReviewMonth").innerHTML='<option value="all">전체 월</option>'+monthKeys.map(m=>`<option value="${m}">${ledgerMonthLabel(m)}</option>`).join("");
    $("spendReviewMonth").value=monthKeys.includes(monthFilter)?monthFilter:"all";
    if($("spendReviewMonth").value!==monthFilter)state.ui.spendReviewMonth="all";
  }

  let rows=[...all].sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  if(search)rows=rows.filter(p=>[p.name,p.category,p.reason].some(v=>String(v||"").toLowerCase().includes(search)));
  if(state.ui.spendReviewMonth!=="all")rows=rows.filter(p=>String(p.date||"").startsWith(state.ui.spendReviewMonth));
  rows=rows.filter(p=>{const l=spendLatest(p);if(filter==="unreviewed")return !l;if(filter==="reviewed")return !!l;if(filter==="regret")return l?.verdict==="bad";return true});

  $("spendReviewCount").textContent=`${rows.length}건`;
  const grouped=new Map();
  rows.forEach(p=>{const key=String(p.date||"").slice(0,7)||"기타";if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(p)});
  const groups=[...grouped.entries()].sort((a,b)=>String(b[0]).localeCompare(String(a[0])));

  $("spendReviewList").innerHTML=groups.map(([month,items],gi)=>{
    const reviewedItems=items.filter(p=>spendLatest(p)),scores=reviewedItems.map(p=>n(spendLatest(p)?.score)).filter(Boolean);
    const monthAvg=scores.length?scores.reduce((a,b)=>a+b,0)/scores.length:null,total=items.reduce((a,p)=>a+n(p.amount),0);
    return `<details class="spend-month-group" ${gi===0?"open":""}>
      <summary class="spend-month-head">
        <div><span class="spend-month-eyebrow">${esc(month)}</span><b>${esc(/^\d{4}-\d{2}$/.test(month)?ledgerMonthLabel(month):month)}</b></div>
        <div class="spend-month-summary"><span>${items.length}건</span><span>${won(total)}</span><span>리뷰 ${reviewedItems.length}/${items.length}</span><span>${monthAvg===null?"평점 -":`평균 ★ ${monthAvg.toFixed(1)}`}</span><i>⌄</i></div>
      </summary>
      <div class="spend-month-cards">${items.map(p=>{
        const latest=spendLatest(p),age=daysSince(p.date),timeline=[...(p.reviews||[])].sort((a,b)=>String(b.date).localeCompare(String(a.date)));
        const verdictClass=latest?latest.verdict:"pending",verdictText=latest?spendVerdictLabel(latest.verdict):"리뷰 대기";
        return `<article class="spend-card spend-card-${verdictClass}">
          <div class="spend-card-hero">
            <div class="spend-card-title"><span class="spend-category">${esc(p.category||"기타")}</span><h4>${esc(p.name)}</h4><div class="purchase-meta">${esc(p.date)} · ${age===0?"오늘 구매":age===null?"":`구매 후 ${age}일`}</div></div>
            <div class="spend-card-price">${won(p.amount)}</div>
          </div>
          <div class="spend-card-status">
            ${latest?`<div class="spend-score-block"><span>최신 만족도</span><b>★ ${Number(latest.score).toFixed(1)}</b></div>`:`<div class="spend-score-block pending"><span>최신 만족도</span><b>아직 없음</b></div>`}
            <span class="spend-verdict ${latest?.verdict||"pending"}">${verdictText}</span>
            ${latest?`<span class="spend-repurchase">${spendRepurchaseLabel(latest.repurchase)}</span>`:""}
          </div>
          ${p.reason?`<div class="spend-reason-box"><span>구매 이유</span><p>${esc(p.reason)}</p></div>`:""}
          ${latest?`<div class="spend-latest"><div class="sub">${esc(latest.date)} · ${spendFrequencyLabel(latest.frequency)}</div>${latest.note?`<div class="reason">${esc(latest.note)}</div>`:""}</div>`:`<div class="spend-latest spend-pending-callout">실제로 써본 뒤 생각이 생겼을 때 첫 리뷰를 남겨보세요.</div>`}
          ${timeline.length>1?`<details class="spend-history"><summary>이전 리뷰 ${timeline.length-1}건 보기</summary><div class="spend-review-timeline">${timeline.slice(1).map(r=>`<div class="spend-review-row"><div class="top"><b>${esc(r.date)} · ${Number(r.score).toFixed(1)}점 · ${spendVerdictLabel(r.verdict)}</b><span>${spendRepurchaseLabel(r.repurchase)}</span></div>${r.note?`<div class="text">${esc(r.note)}</div>`:""}<div class="mini-actions"><button class="btn sm" data-spend-review-edit="${p.id}|${r.id}">수정</button><button class="btn sm danger" data-spend-review-delete="${p.id}|${r.id}">삭제</button></div></div>`).join("")}</div></details>`:""}
          ${latest?`<div class="spend-latest-actions"><button class="btn sm" data-spend-review-edit="${p.id}|${latest.id}">최신 리뷰 수정</button><button class="btn sm danger" data-spend-review-delete="${p.id}|${latest.id}">리뷰 삭제</button></div>`:""}
          <div class="spend-card-actions"><button class="btn sm finance" data-spend-review-add="${p.id}">${latest?"후속 리뷰 추가":"첫 리뷰 남기기"}</button><button class="btn sm" data-spend-purchase-edit="${p.id}">구매 수정</button><button class="btn sm danger" data-spend-purchase-delete="${p.id}">삭제</button></div>
        </article>`;
      }).join("")}</div>
    </details>`;
  }).join("")||'<div class="money-empty">조건에 맞는 소비 리뷰가 없습니다.</div>';

  document.querySelectorAll("[data-spend-review-add]").forEach(b=>b.onclick=()=>openSpendReviewModal(b.dataset.spendReviewAdd));
  document.querySelectorAll("[data-spend-review-edit]").forEach(b=>b.onclick=()=>{const [p,r]=b.dataset.spendReviewEdit.split("|");openSpendReviewModal(p,r)});
  document.querySelectorAll("[data-spend-review-delete]").forEach(b=>b.onclick=()=>{const [pid,rid]=b.dataset.spendReviewDelete.split("|"),p=state.spendReviews.find(x=>x.id===pid);if(!p)return;if(!confirm("이 후속 리뷰를 삭제할까요?"))return;p.reviews=p.reviews.filter(x=>x.id!==rid);p.updatedAt=new Date().toISOString();commit("소비 후속 리뷰를 삭제했습니다.")});
  document.querySelectorAll("[data-spend-purchase-edit]").forEach(b=>b.onclick=()=>openSpendPurchaseModal(b.dataset.spendPurchaseEdit));
  document.querySelectorAll("[data-spend-purchase-delete]").forEach(b=>b.onclick=()=>{const p=state.spendReviews.find(x=>x.id===b.dataset.spendPurchaseDelete);if(!p)return;if(!confirm(`${p.name}과 후속 리뷰 ${(p.reviews||[]).length}건을 모두 삭제할까요?`))return;state.spendReviews=state.spendReviews.filter(x=>x.id!==p.id);commit("소비 리뷰 기록을 삭제했습니다.")});
}
function renderAssets(){const c=calculate(),latest=officialBrokerLatest(),record=latest?brokerCalc(latest):null;if(record){$("assetStats").innerHTML=[["투자자산",won(record.total)],["평가금액",won(record.evaluation)],["추정 현금성",won(record.cashLike)],["평가손익",signedWon(record.pnl)]].map(([l,v])=>`<div class="stat"><div class="label">${l}</div><div class="value">${v}</div></div>`).join("");const total=record.total||1;$("assetComposition").innerHTML=[["추정 현금성",record.cashLike],["투자상품 평가액",record.evaluation]].map(([l,v])=>`<div class="item"><div class="row"><b>${l}</b><b>${won(v)}</b></div><div class="progress"><i style="width:${Math.max(0,Math.min(100,n(v)/total*100))}%"></i></div><div class="sub">${(n(v)/total*100).toFixed(1)}%</div></div>`).join("")+`<div class="archive-disclaimer">${esc(latest.period)} 월간 투자 기록 기준 · 실제 증권사 잔액과 차이가 있을 수 있습니다.</div>`}else{$("assetStats").innerHTML=[["총자산",won(c.total)],["투자상품",won(c.totalMarket)],["현금",won(c.totalCash)],["평가손익",won(c.pnl)]].map(([l,v])=>`<div class="stat"><div class="label">${l}</div><div class="value">${v}</div></div>`).join("");const total=c.total||1;$("assetComposition").innerHTML=[["현금",c.totalCash],["투자상품",c.totalMarket]].map(([l,v])=>`<div class="item"><div class="row"><b>${l}</b><b>${won(v)}</b></div><div class="progress"><i style="width:${Math.max(0,Math.min(100,v/total*100))}%"></i></div><div class="sub">${(v/total*100).toFixed(1)}%</div></div>`).join("")}}

function bodyMetric(v,suffix=""){return v===null||v===undefined||!Number.isFinite(Number(v))?"미측정":num(v)+suffix}
function refreshBodyAuto(){const weight=optionalNumber($("bodyWeight").value),fat=optionalNumber($("bodyFat").value),height=n(state.profile.heightCm)/100;$("bodyBmi").value=weight&&height?(weight/(height*height)).toFixed(2):"";$("bodyFatMass").value=weight&&fat?(weight*fat/100).toFixed(2):""}
const BODY_METRICS={
  weight:{label:"몸무게",unit:"kg",decimals:2},
  fat:{label:"체지방률",unit:"%",decimals:2},
  muscle:{label:"골격근량",unit:"kg",decimals:2},
  bmi:{label:"BMI",unit:"",decimals:2},
  fatMass:{label:"체지방량",unit:"kg",decimals:2}
};
function lifePeriodKey(mode){
  const now=today(),year=now.slice(0,4),month=now.slice(0,7);
  return mode==="month"?month:mode==="year"?year:"";
}
function lifePeriodRows(allRows,mode){
  const rows=[...(allRows||[])].sort((a,b)=>String(a.date||"").localeCompare(String(b.date||"")));
  if(mode==="all")return rows;
  const key=lifePeriodKey(mode);
  return rows.filter(r=>String(r.date||"").startsWith(key));
}
function lifePeriodLabel(mode){
  const now=today(),year=now.slice(0,4),month=Number(now.slice(5,7));
  if(mode==="month")return `${year}년 ${month}월`;
  if(mode==="year")return `${year}년`;
  return "전체 기간";
}
function lifePeriodBasis(mode){
  const now=today(),year=now.slice(0,4),month=now.slice(5,7);
  if(mode==="month")return `기준 · ${year}.${month}.01 ~ ${year}.${month} 말일`;
  if(mode==="year")return `기준 · ${year}.01.01 ~ ${year}.12.31`;
  return "기준 · 저장된 전체 기록";
}
function bodyPeriodRows(allRows){return lifePeriodRows(allRows,state.ui.bodyPeriod||"year")}
function exercisePeriodRows(allRows){return lifePeriodRows(allRows,state.ui.exercisePeriod||"year")}
function metricRows(rows,key){return rows.filter(r=>r[key]!==null&&r[key]!==undefined&&Number.isFinite(Number(r[key])))}
function metricValueText(value,key){const m=BODY_METRICS[key];return value===null||value===undefined?"미측정":Number(value).toFixed(m.decimals)+m.unit}
function metricDeltaText(value,key){const m=BODY_METRICS[key];if(value===null||value===undefined||!Number.isFinite(Number(value)))return "-";const x=Number(value);return `${x>0?"+":""}${x.toFixed(m.decimals)}${m.unit}`}
function metricDeltaClass(key,delta){if(delta===null||delta===undefined||Number(delta)===0)return "";const positiveGood=key==="muscle";return (Number(delta)>0)===positiveGood?"good":"bad"}
function renderBody(){
  const allRows=[...state.body].sort((a,b)=>a.date.localeCompare(b.date)),
    period=state.ui.bodyPeriod||"year",
    rows=bodyPeriodRows(allRows),
    overallLatest=allRows.at(-1)||null,
    periodFirst=rows[0]||null,
    periodLast=rows.at(-1)||null,
    start=n(periodFirst?.weight),
    periodCurrent=n(periodLast?.weight),
    current=n(overallLatest?.weight),
    delta=start&&periodCurrent?periodCurrent-start:null,
    g1=n(state.goals.weight1),g2=n(state.goals.weight2);

  $("heightLabel").textContent=num(state.profile.heightCm)+"cm";
  if($("dietGoal1Label"))$("dietGoal1Label").textContent=g1+"kg";
  if($("dietGoal2Label"))$("dietGoal2Label").textContent=g2+"kg";
  if($("dietSummaryPeriod"))$("dietSummaryPeriod").textContent=`${lifePeriodLabel(period)} 기준`;
  if($("bodyPeriodBasis"))$("bodyPeriodBasis").textContent=lifePeriodBasis(period);

  $("dietStats").innerHTML=[
    ["기간 시작 체중",start?start.toFixed(2)+"kg":"-"],
    ["현재 체중",current?current.toFixed(2)+"kg":"-"],
    ["기간 증감",delta===null?"-":`${delta>0?"+":""}${delta.toFixed(2)}kg`],
    ["기록 일수",rows.length+"일"],
    ["목표",`1차 ${g1}kg · 2차 ${g2}kg`]
  ].map(([l,v],i)=>`<div class="stat ${i===2?(delta===null?"":delta<=0?"stat-good":"stat-bad"):""}"><div class="label">${l}</div><div class="value">${v}</div></div>`).join("");

  $("bodyCount").textContent=`${rows.length}건 · 전체 ${allRows.length}건`;
  $("bodyRows").innerHTML=[...rows].reverse().map(r=>`<tr><td>${esc(r.date)}</td><td>${bodyMetric(r.weight,"kg")}</td><td>${bodyMetric(r.fat,"%")}</td><td>${bodyMetric(r.muscle,"kg")}</td><td>${bodyMetric(r.bmi)}</td><td>${bodyMetric(r.fatMass,"kg")}</td><td><button class="btn sm danger" data-delete-body="${r.id}">삭제</button></td></tr>`).join("")||'<tr><td colspan="7">선택한 기간에 신체 기록이 없습니다.</td></tr>';
  document.querySelectorAll("[data-delete-body]").forEach(b=>b.onclick=()=>{state.body=state.body.filter(r=>r.id!==b.dataset.deleteBody);commit("신체 기록을 삭제했습니다.")});

  const active=state.ui.bodyMetric||"weight";
  $("bodyMetricTabs").innerHTML=[...Object.entries(BODY_METRICS),["summary",{label:"전체 요약"}]].map(([k,v])=>`<button class="tab ${active===k?"active":""}" data-body-metric="${k}">${v.label}</button>`).join("");
  document.querySelectorAll("[data-body-metric]").forEach(btn=>btn.onclick=()=>{state.ui.bodyMetric=btn.dataset.bodyMetric;save();renderBody()});

  $("bodyPeriod").value=period;
  $("bodyPeriod").onchange=()=>{state.ui.bodyPeriod=$("bodyPeriod").value;save();renderBody()};

  renderBodyMetricStats();
  drawBody();

  $("homeWeight").textContent=overallLatest?n(overallLatest.weight).toFixed(2)+"kg":"기록 없음";
  const yearRows=lifePeriodRows(allRows,"year"),yearFirst=yearRows[0],yearLast=yearRows.at(-1);
  const yearDelta=yearFirst&&yearLast?n(yearLast.weight)-n(yearFirst.weight):null;
  $("homeWeightGoal").textContent=yearDelta===null?`${today().slice(0,4)}년 기록 없음`:`${today().slice(0,4)}년 ${yearDelta>0?"+":""}${yearDelta.toFixed(2)}kg · 1차 ${g1}kg`;
}
function renderBodyMetricStats(){
  const key=state.ui.bodyMetric||"weight",rows=bodyPeriodRows(state.body);
  if(key==="summary"){
    $("bodyMetricStats").innerHTML="";
    $("bodyMetricStats").classList.add("hidden");
    $("bodyChartWrap").classList.add("hidden");
    $("bodySummary").classList.remove("hidden");
    $("bodySummary").innerHTML=Object.entries(BODY_METRICS).map(([metric,meta])=>{
      const data=metricRows(rows,metric),latest=data.at(-1),previous=data.at(-2),delta=latest&&previous?Number(latest[metric])-Number(previous[metric]):null;
      const cls=metricDeltaClass(metric,delta);
      return `<div class="metric-card"><div class="label">${meta.label}</div><b>${latest?metricValueText(latest[metric],metric):"미측정"}</b><div class="metric-delta ${cls}">직전 대비 ${metricDeltaText(delta,metric)}</div></div>`;
    }).join("");
    return;
  }
  $("bodyMetricStats").classList.remove("hidden");$("bodyChartWrap").classList.remove("hidden");$("bodySummary").classList.add("hidden");
  const data=metricRows(rows,key),latest=data.at(-1),previous=data.at(-2),first=data[0],values=data.map(r=>Number(r[key])),meta=BODY_METRICS[key];
  const latestValue=latest?Number(latest[key]):null,previousDelta=latest&&previous?latestValue-Number(previous[key]):null,firstDelta=latest&&first?latestValue-Number(first[key]):null;
  $("bodyMetricStats").innerHTML=[
    ["최신 측정값",metricValueText(latestValue,key)],
    ["직전 기록 대비",metricDeltaText(previousDelta,key)],
    ["기간 첫 기록 대비",metricDeltaText(firstDelta,key)],
    ["최고 / 최저",values.length?`${metricValueText(Math.max(...values),key)} / ${metricValueText(Math.min(...values),key)}`:"-"]
  ].map(([l,v])=>`<div class="stat"><div class="label">${l}</div><div class="value">${v}</div></div>`).join("");
}
function drawBody(){
  const key=state.ui.bodyMetric||"weight";
  if(key==="summary")return;
  const rows=bodyPeriodRows(state.body),meta=BODY_METRICS[key],series=[{name:meta.label,data:rows.map(r=>r[key]===null||r[key]===undefined?null:Number(r[key]))}],targets=key==="weight"?[{name:"1차 "+state.goals.weight1+"kg",value:n(state.goals.weight1),color:"#ef9d3c"},{name:"2차 "+state.goals.weight2+"kg",value:n(state.goals.weight2),color:"#2faa77"}]:[];
  drawLines($("bodyChart"),rows.map(r=>r.date),series,"선택한 기간에 표시할 신체 기록이 없습니다.",{targets});
}
["bodyWeight","bodyFat"].forEach(id=>$(id).addEventListener("input",refreshBodyAuto));
$("addBody").onclick=()=>{const weight=optionalNumber($("bodyWeight").value);if(!$("bodyDate").value||!weight)return alert("날짜와 몸무게를 입력하세요.");state.body.push(normalizeBodyRecord({id:uid(),date:$("bodyDate").value,weight,fat:optionalNumber($("bodyFat").value),muscle:optionalNumber($("bodyMuscle").value)},state.profile.heightCm));["bodyWeight","bodyFat","bodyMuscle","bodyBmi","bodyFatMass"].forEach(id=>$(id).value="");commit("신체 기록을 저장했습니다.")};
$("editWeightGoals").onclick=()=>{$("heightCm").value=state.profile.heightCm;$("weightGoal1").value=state.goals.weight1;$("weightGoal2").value=state.goals.weight2;openModal("weightGoalModal")};
$("saveWeightGoals").onclick=()=>{const h=n($("heightCm").value),a=n($("weightGoal1").value),b=n($("weightGoal2").value);if(h<=0||a<=0||b<=0)return alert("키와 목표 체중을 입력하세요.");state.profile.heightCm=h;state.goals.weight1=a;state.goals.weight2=b;state.body=state.body.map(r=>normalizeBodyRecord(r,h));closeModal("weightGoalModal");commit("신체 설정을 수정했습니다.")};

function renderExercise(){
  const allRows=[...(state.exercise||[])].sort((a,b)=>String(a.date||"").localeCompare(String(b.date||""))),
    period=state.ui.exercisePeriod||"year",
    rows=exercisePeriodRows(allRows),
    totalSteps=rows.reduce((s,r)=>s+n(r.steps),0),
    totalDistance=rows.reduce((s,r)=>s+n(r.distance),0),
    strengthDays=rows.filter(r=>r.strength).length,
    stepDays=rows.filter(r=>n(r.steps)>0),
    avgSteps=stepDays.length?Math.round(totalSteps/stepDays.length):0;

  if($("exercisePeriod"))$("exercisePeriod").value=period;
  if($("exerciseSummaryPeriod"))$("exerciseSummaryPeriod").textContent=`${lifePeriodLabel(period)} 기준`;
  if($("exercisePeriodBasis"))$("exercisePeriodBasis").textContent=`${lifePeriodBasis(period)} · 전체 기록 ${allRows.length}건`;

  $("exerciseStats").innerHTML=[
    ["기록 일수",rows.length+"일"],
    ["총 걸음",totalSteps.toLocaleString()+"보"],
    ["하루 평균 걸음",avgSteps.toLocaleString()+"보"],
    ["총 거리",totalDistance.toFixed(1)+"km"],
    ["근력운동",strengthDays+"일"]
  ].map(([l,v])=>`<div class="stat"><div class="label">${l}</div><div class="value">${v}</div></div>`).join("");

  $("exerciseCount").textContent=`${rows.length}건 · 전체 ${allRows.length}건`;
  $("exerciseRows").innerHTML=[...rows].reverse().map(r=>`<tr><td>${esc(r.date)}</td><td>${n(r.steps).toLocaleString()}보</td><td>${n(r.distance).toFixed(2)}km</td><td>${r.strength?"✅ 했음":"—"}</td><td>${esc(r.note||"")||"—"}</td><td><button class="btn sm danger" data-delete-exercise="${r.id}">삭제</button></td></tr>`).join("")||'<tr><td colspan="6">선택한 기간에 운동 기록이 없습니다.</td></tr>';
  document.querySelectorAll("[data-delete-exercise]").forEach(b=>b.onclick=()=>{state.exercise=state.exercise.filter(r=>r.id!==b.dataset.deleteExercise);commit("운동 기록을 삭제했습니다.")});

  if($("exercisePeriod"))$("exercisePeriod").onchange=()=>{state.ui.exercisePeriod=$("exercisePeriod").value;save();renderExercise()};
  drawExercise();
}
function drawExercise(){
  const rows=exercisePeriodRows(state.exercise||[]);
  drawLines($("exerciseChart"),rows.map(r=>r.date),[{name:"걸음 수",color:"#2faa77",data:rows.map(r=>n(r.steps))}],"선택한 기간에 운동 기록이 있으면 걸음 수 추이가 표시됩니다.");
}
$("addExercise").onclick=()=>{const date=$("exerciseDate").value;if(!date)return alert("날짜를 입력하세요.");const row={id:uid(),date,steps:Math.max(0,Math.round(n($("exerciseSteps").value))),distance:Math.max(0,n($("exerciseDistance").value)),strength:$("exerciseStrength").checked,note:$("exerciseNote").value.trim()},old=state.exercise.find(r=>r.date===date);if(old)Object.assign(old,row,{id:old.id});else state.exercise.push(row);["exerciseSteps","exerciseDistance","exerciseNote"].forEach(id=>$(id).value="");$("exerciseStrength").checked=false;commit(old?"해당 날짜의 운동 기록을 수정했습니다.":"운동 기록을 저장했습니다.")};

const TOPIC_COLORS={"교양":"#58bce8","경제·투자":"#4285f4","인문·철학":"#8b63dc","역사":"#a66b3d","소설":"#dc6279","자기계발":"#2faa77","일본어·학습":"#ef9d3c","기타":"#607d8b"};
function stars(v){
  const x=ratingValue(v);if(x===null)return '<span class="rating-number">미평가</span>';
  const icons=Array.from({length:5},(_,idx)=>{const fill=Math.max(0,Math.min(100,(x-idx)*100));return `<span class="rating-star" style="--fill:${fill}%">★</span>`}).join("");
  return `<span class="rating" aria-label="${x.toFixed(1)}점">${icons}<span class="rating-number">${x.toFixed(1)}</span></span>`;
}
function completedByToday(date){
  const d=String(date||"");
  return /^\d{4}-\d{2}-\d{2}$/.test(d)&&d<=today();
}
function completedInMonthByToday(date,month){
  return completedByToday(date)&&String(date).startsWith(month);
}
function completedInYearByToday(date,year){
  return completedByToday(date)&&String(date).startsWith(year);
}
function bookCard(b){return `<article class="archive-card">${b.cover?`<img class="archive-cover" src="${esc(b.cover)}" alt="${esc(b.title)} 표지">`:'<div class="archive-cover placeholder">📚</div>'}<div><span class="topic-tag" style="--tag:${TOPIC_COLORS[b.topic]||TOPIC_COLORS["기타"]}">${esc(b.topic||"기타")}</span><h4>${esc(b.title)}</h4><div class="archive-meta">${esc(b.author||"저자 미입력")}${b.status==="read"?` · ${stars(b.rating)}`:""}${b.completedDate?`<br>완독 ${esc(b.completedDate)}`:""}</div>${b.review?`<div class="archive-review">${esc(b.review)}</div>`:""}</div><div class="archive-actions"><button class="btn sm" data-book-toggle="${b.id}">${b.status==="read"?"읽기 목록으로":"서재로 이동"}</button><button class="btn sm" data-book-edit="${b.id}">수정</button><button class="btn sm danger" data-book-delete="${b.id}">삭제</button></div></article>`}
function updateBookFormState(){const read=$("bookStatus").value==="read";$("bookRating").disabled=!read;$("bookDate").disabled=!read;$("bookRatingField")?.classList.toggle("is-disabled",!read);$("bookDateField")?.classList.toggle("is-disabled",!read);if($("bookReviewLabel"))$("bookReviewLabel").textContent=read?"완독 후기 / 메모":"읽고 싶은 이유 / 기대 메모";$("bookReview").placeholder=read?"완독 후 인상과 배운 점을 남겨요.":"이 책을 읽고 싶은 이유를 남겨요.";ratingPreview("bookRating","bookRatingPreview","완독 후 입력할 수 있어요.")}
function resetBookForm(){["bookEditId","bookTitle","bookAuthor","bookReview"].forEach(id=>$(id).value="");$("bookStatus").value="wish";$("bookTopic").value="교양";$("bookRating").value="";$("bookDate").value="";$("bookCover").value="";$("saveBook").textContent="책 저장";updateBookFormState()}
function renderReadingGoals(read){
  const now=new Date(),year=String(now.getFullYear()),month=`${year}-${String(now.getMonth()+1).padStart(2,"0")}`;
  const annual=read.filter(b=>completedInYearByToday(b.completedDate,year)).length,
    monthly=read.filter(b=>completedInMonthByToday(b.completedDate,month)).length;
  const monthName=`${Number(month.slice(5,7))}월`;
  if($("readingMonthlyGoalLabel"))$("readingMonthlyGoalLabel").textContent=`${year}년 ${monthName} 목표`;
  if($("readingMonthlyBasis"))$("readingMonthlyBasis").textContent=`기준 · 완독일 ${year}.${month.slice(5,7)}.01 ~ 오늘(${today().slice(5).replace("-",".")})`;
  const annualGoal=Math.max(1,Math.round(n(state.goals.readingAnnual)||n(state.goals.reading)||30)),monthlyGoal=Math.max(1,Math.round(n(state.goals.readingMonthly)||2));
  $("readingAnnualGoal").value=annualGoal;$("readingMonthlyGoal").value=monthlyGoal;
  [["Annual",annual,annualGoal],["Monthly",monthly,monthlyGoal]].forEach(([key,value,goal])=>{const rate=Math.min(100,value/goal*100),remain=Math.max(0,goal-value);$("reading"+key+"Progress").textContent=`${value} / ${goal}권`;$("reading"+key+"Bar").style.width=rate+"%";$("reading"+key+"Remain").textContent=remain?`남은 ${remain}권`:"목표 달성";$("reading"+key+"Rate").textContent=rate.toFixed(1)+"%"})
}
function renderReading(){
  const sort=state.ui.readingSort||"recent",min=Math.max(0,Math.min(5,n(state.ui.readingMinRating))),search=state.ui.readingSearch||"",allWish=state.books.filter(b=>b.status!=="read"),allRead=state.books.filter(b=>b.status==="read");
  const wish=sortRatedItems(allWish,"recent","completedDate"),read=sortRatedItems(filterMinimumRating(filterText(allRead,search,["title","author","topic","review"]),min),sort,"completedDate");
  const completedRead=allRead.filter(b=>completedByToday(b.completedDate)),
    ratings=completedRead.map(b=>ratingValue(b.rating)).filter(v=>v!==null),
    avg=ratings.length?ratings.reduce((a,b)=>a+b,0)/ratings.length:0,five=ratings.filter(v=>v===5).length,
    currentYear=today().slice(0,4),currentMonth=today().slice(0,7);
  $("bookCount").textContent=state.books.length+"권";$("wishBookCount").textContent=wish.length+"권";$("readBookCount").textContent=read.length+"권";
  $("bookStats").innerHTML=[["전체 기록",state.books.length+"권"],["올해 완독",completedRead.filter(b=>completedInYearByToday(b.completedDate,currentYear)).length+"권"],["이번 달 완독",completedRead.filter(b=>completedInMonthByToday(b.completedDate,currentMonth)).length+"권"],["평균 평점",avg?`${avg.toFixed(1)}점 · 만점 ${five}권`:"-"]].map(([l,v])=>`<div class="stat"><div class="label">${l}</div><div class="value">${v}</div></div>`).join("");
  $("wishBooks").innerHTML=wish.map(bookCard).join("")||'<div class="empty">읽기 목록이 비어 있습니다.</div>';$("readBooks").innerHTML=read.map(bookCard).join("")||'<div class="empty">조건에 맞는 서재 도서가 없습니다.</div>';
  $("bookSort").value=sort;$("bookMinRating").value=min||"";$("bookSearch").value=search;
  $("bookSort").onchange=()=>{state.ui.readingSort=$("bookSort").value;save();renderReading()};$("bookMinRating").oninput=()=>{state.ui.readingMinRating=Math.max(0,Math.min(5,n($("bookMinRating").value)));save();renderReading()};$("bookSearch").oninput=()=>{state.ui.readingSearch=$("bookSearch").value;renderReading()};
  updateBookFormState();renderReadingGoals(allRead);
  document.querySelectorAll("[data-book-delete]").forEach(b=>b.onclick=()=>{if(!confirm("이 책 기록을 삭제할까요?"))return;state.books=state.books.filter(x=>x.id!==b.dataset.bookDelete);commit("책을 삭제했습니다.")});
  document.querySelectorAll("[data-book-toggle]").forEach(b=>b.onclick=()=>{const x=state.books.find(v=>v.id===b.dataset.bookToggle);if(!x)return;x.status=x.status==="read"?"wish":"read";if(x.status==="read"&&!x.completedDate)x.completedDate=today();x.updatedAt=new Date().toISOString();commit("책 분류를 변경했습니다.")});
  document.querySelectorAll("[data-book-edit]").forEach(b=>b.onclick=()=>{const x=state.books.find(v=>v.id===b.dataset.bookEdit);if(!x)return;$("bookEditId").value=x.id;$("bookStatus").value=x.status||"wish";$("bookTitle").value=x.title||"";$("bookAuthor").value=x.author||"";$("bookTopic").value=x.topic||"교양";$("bookRating").value=x.rating??"";$("bookDate").value=x.completedDate||"";$("bookReview").value=x.review||"";$("saveBook").textContent="수정 저장";updateBookFormState();$("reading").scrollIntoView({behavior:"smooth"})})
}
$("saveReadingGoals").onclick=()=>{const annual=Math.round(n($("readingAnnualGoal").value)),monthly=Math.round(n($("readingMonthlyGoal").value));if(annual<=0||monthly<=0)return alert("연간·월간 목표 권수를 1권 이상 입력하세요.");state.goals.reading=annual;state.goals.readingAnnual=annual;state.goals.readingMonthly=monthly;commit("독서 목표를 저장했습니다.")};
$("cancelBookEdit").onclick=resetBookForm;$("bookStatus").onchange=updateBookFormState;
$("saveBook").onclick=async()=>{
  const title=$("bookTitle").value.trim();if(!title)return alert("책 제목을 입력하세요.");
  const previousBooks=structuredClone(state.books),editId=$("bookEditId").value,old=state.books.find(b=>b.id===editId),file=$("bookCover").files[0],oldCover=old?.cover||"";
  let cover=oldCover,imageWarning="";
  if(file){try{cover=await compressImage(file)}catch(e){imageWarning=e.message;cover=oldCover}}
  const status=$("bookStatus").value,enteredRating=ratingValue($("bookRating").value);if(status==="read"&&$("bookRating").value&&enteredRating===null)return alert("평점은 0.1부터 5.0 사이에서 0.1 단위로 입력하세요.");
  const row={id:old?.id||uid(),status,title,author:$("bookAuthor").value.trim(),topic:$("bookTopic").value,rating:status==="read"?enteredRating:(old?.rating??null),completedDate:status==="read"?$("bookDate").value:(old?.completedDate||""),review:$("bookReview").value.trim(),cover,createdAt:old?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};
  if(old)Object.assign(old,row);else state.books.push(row);
  let ok=commit(old?"책 정보를 수정했습니다.":"책을 서재에 저장했습니다.");
  if(!ok&&file&&cover!==oldCover){row.cover=oldCover;const target=state.books.find(b=>b.id===row.id);if(target)target.cover=oldCover;ok=commit("저장 공간 문제로 이미지를 제외하고 책의 텍스트 기록을 저장했습니다.");if(ok)imageWarning="저장 공간 부족으로 새 이미지는 제외했어요."}
  if(!ok){state.books=previousBooks;renderAll();return}
  resetBookForm();if(imageWarning)alert(imageWarning+"\n텍스트 기록은 정상적으로 저장했습니다.");
};

const MOVIE_CONTENT_TYPES=["영화","드라마","애니메이션","시리즈","다큐멘터리","예능","기타"];
function movieContentType(v,def="기타"){const s=String(v||"").trim();return MOVIE_CONTENT_TYPES.includes(s)?s:def}
function movieCard(m){const type=movieContentType(m.contentType,"기타");return `<article class="archive-card">${m.poster?`<img class="archive-cover" src="${esc(m.poster)}" alt="${esc(m.title)} 포스터">`:'<div class="archive-cover placeholder">🎬</div>'}<div><div class="archive-tags"><span class="topic-tag movie-type-tag">${esc(type)}</span><span class="topic-tag" style="--tag:${m.origin==="국내"?"#58bce8":"#8b63dc"}">${esc(m.origin||"국외")}</span></div><h4>${esc(m.title)}</h4><div class="archive-meta">감독 ${esc(m.director||"미입력")}${m.actors?`<br>배우 ${esc(m.actors)}`:""}${m.status==="watched"?`<br>${stars(m.rating)}`:""}${m.status==="watched"&&m.watchedDate?` · ${esc(m.watchedDate)}`:""}</div>${m.review?`<div class="archive-review">${esc(m.review)}</div>`:""}</div><div class="archive-actions"><button class="btn sm" data-movie-toggle="${m.id}">${m.status==="watched"?"관람 예정작으로":"관람 완료로"}</button><button class="btn sm" data-movie-edit="${m.id}">수정</button><button class="btn sm danger" data-movie-delete="${m.id}">삭제</button></div></article>`}
function updateMovieFormState(){const watched=$("movieStatus").value==="watched";$("movieRating").disabled=!watched;$("movieDate").disabled=!watched;$("movieRatingField").classList.toggle("is-disabled",!watched);$("movieDateField").classList.toggle("is-disabled",!watched);$("movieReviewLabel").textContent=watched?"관람 후기":"보고 싶은 이유 / 기대평";$("movieReview").placeholder=watched?"관람 후 인상과 감상을 남겨요.":"이 작품을 보고 싶은 이유를 남겨요.";ratingPreview("movieRating","movieRatingPreview","관람 완료 후 입력할 수 있어요.")}
function resetMovieForm(){["movieEditId","movieTitle","movieDirector","movieActors","movieReview"].forEach(id=>$(id).value="");$("movieStatus").value="wish";$("movieContentType").value="영화";$("movieOrigin").value="국내";$("movieRating").value="";$("movieDate").value="";$("moviePoster").value="";$("saveMovie").textContent="작품 저장";updateMovieFormState()}
function renderMovies(){
  const sort=state.ui.movieSort||"recent",min=Math.max(0,Math.min(5,n(state.ui.movieMinRating))),search=state.ui.movieSearch||"",typeFilter=state.ui.movieTypeFilter||"all",matchesType=m=>typeFilter==="all"||movieContentType(m.contentType,"기타")===typeFilter,allWish=state.movies.filter(m=>m.status!=="watched"),allWatched=state.movies.filter(m=>m.status==="watched");
  const wish=sortRatedItems(allWish.filter(matchesType),"recent","watchedDate"),watched=sortRatedItems(filterMinimumRating(filterText(allWatched.filter(matchesType),search,["title","director","actors","review","contentType"]),min),sort,"watchedDate");
  const completedWatched=allWatched.filter(m=>completedByToday(m.watchedDate)),
    ratings=completedWatched.map(m=>ratingValue(m.rating)).filter(v=>v!==null),
    avg=ratings.length?ratings.reduce((a,b)=>a+b,0)/ratings.length:0,five=ratings.filter(v=>v===5).length;
  $("movieCount").textContent=state.movies.length+"편";$("wishMovieCount").textContent=wish.length+"편";$("watchedMovieCount").textContent=watched.length+"편";
  $("movieStats").innerHTML=[["전체 기록",state.movies.length+"편"],["관람 예정",allWish.length+"편"],["관람 완료",completedWatched.length+"편"],["평균 평점",avg?`${avg.toFixed(1)}점 · 만점 ${five}편`:"-"]].map(([l,v])=>`<div class="stat"><div class="label">${l}</div><div class="value">${v}</div></div>`).join("");
  $("wishMovies").innerHTML=wish.map(movieCard).join("")||'<div class="empty">조건에 맞는 관람 예정작이 없습니다.</div>';$("watchedMovies").innerHTML=watched.map(movieCard).join("")||'<div class="empty">조건에 맞는 관람 작품이 없습니다.</div>';
  $("movieSort").value=sort;$("movieMinRating").value=min||"";$("movieSearch").value=search;$("movieTypeFilter").value=typeFilter;
  $("movieSort").onchange=()=>{state.ui.movieSort=$("movieSort").value;save();renderMovies()};$("movieMinRating").oninput=()=>{state.ui.movieMinRating=Math.max(0,Math.min(5,n($("movieMinRating").value)));save();renderMovies()};$("movieSearch").oninput=()=>{state.ui.movieSearch=$("movieSearch").value;renderMovies()};$("movieTypeFilter").onchange=()=>{state.ui.movieTypeFilter=$("movieTypeFilter").value;save();renderMovies()};
  updateMovieFormState();
  document.querySelectorAll("[data-movie-delete]").forEach(b=>b.onclick=()=>{if(!confirm("이 작품 기록을 삭제할까요?"))return;state.movies=state.movies.filter(x=>x.id!==b.dataset.movieDelete);commit("작품 기록을 삭제했습니다.")});
  document.querySelectorAll("[data-movie-toggle]").forEach(b=>b.onclick=()=>{const x=state.movies.find(v=>v.id===b.dataset.movieToggle);if(!x)return;x.status=x.status==="watched"?"wish":"watched";if(x.status==="watched"&&!x.watchedDate)x.watchedDate=today();x.updatedAt=new Date().toISOString();commit("작품 분류를 변경했습니다.")});
  document.querySelectorAll("[data-movie-edit]").forEach(b=>b.onclick=()=>{const x=state.movies.find(v=>v.id===b.dataset.movieEdit);if(!x)return;$("movieEditId").value=x.id;$("movieStatus").value=x.status||"wish";$("movieContentType").value=movieContentType(x.contentType,"기타");$("movieOrigin").value=x.origin||"국내";$("movieTitle").value=x.title||"";$("movieDirector").value=x.director||"";$("movieActors").value=x.actors||"";$("movieRating").value=x.rating??"";$("movieDate").value=x.watchedDate||"";$("movieReview").value=x.review||"";$("saveMovie").textContent="수정 저장";updateMovieFormState();$("movie").scrollIntoView({behavior:"smooth"})})
}
$("cancelMovieEdit").onclick=resetMovieForm;$("movieStatus").onchange=updateMovieFormState;
$("saveMovie").onclick=async()=>{
  const title=$("movieTitle").value.trim();if(!title)return alert("작품 제목을 입력하세요.");
  const previousMovies=structuredClone(state.movies),editId=$("movieEditId").value,old=state.movies.find(m=>m.id===editId),file=$("moviePoster").files[0],oldPoster=old?.poster||"";
  let poster=oldPoster,imageWarning="";
  if(file){try{poster=await compressImage(file)}catch(e){imageWarning=e.message;poster=oldPoster}}
  const status=$("movieStatus").value,enteredRating=ratingValue($("movieRating").value);if(status==="watched"&&$("movieRating").value&&enteredRating===null)return alert("평점은 0.1부터 5.0 사이에서 0.1 단위로 입력하세요.");
  const row={id:old?.id||uid(),status,contentType:movieContentType($("movieContentType").value,"영화"),origin:$("movieOrigin").value,title,director:$("movieDirector").value.trim(),actors:$("movieActors").value.trim(),rating:status==="watched"?enteredRating:(old?.rating??null),watchedDate:status==="watched"?$("movieDate").value:(old?.watchedDate||""),review:$("movieReview").value.trim(),poster,createdAt:old?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};
  if(old)Object.assign(old,row);else state.movies.push(row);
  let ok=commit(old?"작품 정보를 수정했습니다.":"작품을 보관함에 저장했습니다.");
  if(!ok&&file&&poster!==oldPoster){row.poster=oldPoster;const target=state.movies.find(m=>m.id===row.id);if(target)target.poster=oldPoster;ok=commit("저장 공간 문제로 이미지를 제외하고 작품의 텍스트 기록을 저장했습니다.");if(ok)imageWarning="저장 공간 부족으로 새 이미지는 제외했어요."}
  if(!ok){state.movies=previousMovies;renderAll();return}
  resetMovieForm();if(imageWarning)alert(imageWarning+"\n텍스트 기록은 정상적으로 저장했습니다.");
};

const DIARY_MOODS={happy:"😊",calm:"🙂",excited:"🤩",tired:"😮‍💨",sad:"😢",angry:"😤",neutral:"😐"};
let activeDiaryId=null;
function diaryMoodIcon(key){return DIARY_MOODS[key]||DIARY_MOODS.neutral}
function diaryCard(d){return `<article class="diary-card"><div class="diary-card-head"><div style="display:flex;gap:10px;min-width:0"><div class="diary-mood">${diaryMoodIcon(d.mood)}</div><div style="min-width:0"><h4>${esc(d.title||"제목 없는 일기")}</h4><div class="diary-date">${esc(d.date||"")} · ${d.updatedAt&&d.updatedAt!==d.createdAt?"수정됨":"작성"}</div></div></div></div><div class="diary-preview">${esc(d.content||"")}</div><div class="diary-actions"><button class="btn sm" data-diary-view="${d.id}">열어보기</button><button class="btn sm" data-diary-edit="${d.id}">수정</button><button class="btn sm danger" data-diary-delete="${d.id}">삭제</button></div></article>`}
function resetDiaryForm(){["diaryEditId","diaryTitle","diaryContent"].forEach(id=>$(id).value="");$("diaryDate").value=today();$("diaryMood").value="happy";$("saveDiary").textContent="일기 저장"}
function openDiaryDetail(id){const d=state.diaries.find(x=>x.id===id);if(!d)return;activeDiaryId=id;$("diaryModalTitle").textContent=d.title||"제목 없는 일기";$("diaryModalMood").textContent=diaryMoodIcon(d.mood);$("diaryModalDate").textContent=d.date||"";$("diaryModalContent").textContent=d.content||"";openModal("diaryModal")}
function editDiary(id){const d=state.diaries.find(x=>x.id===id);if(!d)return;$("diaryEditId").value=d.id;$("diaryDate").value=d.date||today();$("diaryMood").value=d.mood||"neutral";$("diaryTitle").value=d.title||"";$("diaryContent").value=d.content||"";$("saveDiary").textContent="수정 저장";closeModal("diaryModal");$("diary").scrollIntoView({behavior:"smooth"})}
function deleteDiary(id){if(!confirm("이 일기를 삭제할까요?"))return;state.diaries=state.diaries.filter(x=>x.id!==id);if(activeDiaryId===id)activeDiaryId=null;closeModal("diaryModal");commit("일기를 삭제했습니다.")}
function renderDiary(){
  const search=state.ui.diarySearch||"",sort=state.ui.diarySort||"newest",all=Array.isArray(state.diaries)?state.diaries:[];let rows=filterText(all,search,["title","content","date"]);
  rows.sort((a,b)=>sort==="oldest"?(a.date||"").localeCompare(b.date||"")||(a.createdAt||"").localeCompare(b.createdAt||""):sort==="updated"?(b.updatedAt||"").localeCompare(a.updatedAt||""):(b.date||"").localeCompare(a.date||"")||(b.createdAt||"").localeCompare(a.createdAt||""));
  const month=today().slice(0,7),latest=[...all].sort((a,b)=>(b.date||"").localeCompare(a.date||""))[0];$("diaryCount").textContent=all.length+"개";$("diaryStats").innerHTML=[["전체 일기",all.length+"개"],["이번 달",all.filter(d=>String(d.date||"").startsWith(month)).length+"개"],["검색 결과",rows.length+"개"],["최근 기록",latest?.date||"-"]].map(([l,v])=>`<div class="stat"><div class="label">${l}</div><div class="value">${v}</div></div>`).join("");
  $("diaryList").innerHTML=rows.map(diaryCard).join("")||'<div class="empty">조건에 맞는 일기가 없습니다.</div>';$("diarySearch").value=search;$("diarySort").value=sort;
  $("diarySearch").oninput=()=>{state.ui.diarySearch=$("diarySearch").value;renderDiary()};$("diarySort").onchange=()=>{state.ui.diarySort=$("diarySort").value;save();renderDiary()};
  document.querySelectorAll("[data-diary-view]").forEach(b=>b.onclick=()=>openDiaryDetail(b.dataset.diaryView));document.querySelectorAll("[data-diary-edit]").forEach(b=>b.onclick=()=>editDiary(b.dataset.diaryEdit));document.querySelectorAll("[data-diary-delete]").forEach(b=>b.onclick=()=>deleteDiary(b.dataset.diaryDelete));
}
$("cancelDiaryEdit").onclick=resetDiaryForm;
$("saveDiary").onclick=()=>{const title=$("diaryTitle").value.trim(),content=$("diaryContent").value.trim(),date=$("diaryDate").value||today();if(!title)return alert("일기 제목을 입력하세요.");if(!content)return alert("일기 내용을 입력하세요.");const id=$("diaryEditId").value,old=state.diaries.find(d=>d.id===id),now=new Date().toISOString(),row={id:old?.id||uid(),date,mood:$("diaryMood").value,title,content,createdAt:old?.createdAt||now,updatedAt:now};if(old)Object.assign(old,row);else state.diaries.push(row);if(commit(old?"일기를 수정했습니다.":"일기를 저장했습니다."))resetDiaryForm()};
$("diaryModalEdit").onclick=()=>activeDiaryId&&editDiary(activeDiaryId);$("diaryModalDelete").onclick=()=>activeDiaryId&&deleteDiary(activeDiaryId);

function taskUniversityScheduleMeta(t){
  if(!t||t.due)return null;
  const directStart=intakeDate(t.scheduled||t.recommendedDate||""),directEnd=intakeDate(t.scheduleEnd||"");
  if(directStart)return {start:directStart,end:directEnd,source:"university"};
  const raw=intakeText(t.text).replace(/\s*·\s*마감일 미확인\s*$/," ").trim();
  const m=raw.match(/^(.+?)\s+(\d{1,2})주차\s+(퀴즈|과제|시험|중간고사|기말고사|평가)/);
  if(!m)return null;
  const wanted=intakeCampusCourseIdentity(m[1]),weekKey=String(parseInt(m[2],10)||m[2]);
  const semesters=state.campusSemesters||[],active=campusActiveSemester(),ordered=active?[active,...semesters.filter(s=>s!==active)]:semesters;
  for(const sem of ordered){
    const course=(sem?.courses||[]).find(c=>intakeCampusCourseIdentity(c.name).key===wanted.key);
    if(!course)continue;
    const row=(course.curriculum||[]).find(r=>String(parseInt(r.week,10)||r.week)===weekKey);
    if(!row)continue;
    const start=intakeDate(row.startAt||""),end=intakeDate(row.endAt||"");
    if(start)return {start,end,source:"university",course:course.name,week:weekKey};
  }
  return null;
}
function taskEffectiveDate(t){const meta=taskUniversityScheduleMeta(t);return t?.due||meta?.start||"9999"}
function taskDisplayText(t){return esc(intakeText(t?.text).replace(/\s*·\s*마감일 미확인\s*$/," ").trim())}
function taskScheduleLabel(t){if(t?.due)return `마감 ${esc(t.due)}`;const meta=taskUniversityScheduleMeta(t);if(meta?.start)return `권장 시작 ${esc(meta.start)}${meta.end?` · 수강기간 ~ ${esc(meta.end)}`:""} · 실제 마감 미확인`;return "마감일 없음"}

// =========================================================
// HANI OS · Google Calendar Sync v0.1
// One-way only: HANI task -> Google Calendar. OAuth/token storage stays server-side.
// =========================================================
const GOOGLE_CALENDAR_FUNCTION="hani-google-calendar";
let googleCalendarRuntime={loaded:false,connected:false,busy:false,calendarId:"primary",connectedAt:"",error:""};
function taskCalendarEligible(t){return !!(t&&!t.done&&/^\d{4}-\d{2}-\d{2}$/.test(String(t.due||""))&&t.dueKnown!==false)}
function taskCalendarSignature(t){return [intakeText(t?.text),String(t?.due||"")].join("|")}
function taskCalendarMeta(t){return t?.googleCalendar&&typeof t.googleCalendar==="object"?t.googleCalendar:{}}
function taskCalendarSyncState(t){if(!taskCalendarEligible(t))return "ineligible";const m=taskCalendarMeta(t);if(!m.eventId)return "unsynced";return m.signature===taskCalendarSignature(t)?"synced":"changed"}
function taskCalendarCounts(){const rows=(state.tasks||[]).filter(taskCalendarEligible);return {eligible:rows.length,synced:rows.filter(t=>taskCalendarSyncState(t)==="synced").length,changed:rows.filter(t=>taskCalendarSyncState(t)==="changed").length}}
function googleCalendarSetBusy(busy){googleCalendarRuntime.busy=!!busy;renderTaskCalendarHub()}
function googleCalendarRequireCloud(){if(!cloudClient||!cloudUser)throw new Error("먼저 HANI OS Cloud 로그인을 완료해 주세요.")}
async function googleCalendarApi(action,payload={}){
  googleCalendarRequireCloud();
  const cfg=cloudConfig(),{data:{session},error}=await cloudClient.auth.getSession();
  if(error)throw error;if(!session?.access_token)throw new Error("Cloud 로그인 세션을 확인하지 못했습니다.");
  const res=await fetch(`${cfg.url}/functions/v1/${GOOGLE_CALENDAR_FUNCTION}`,{method:"POST",headers:{"Content-Type":"application/json","apikey":cfg.key,"Authorization":`Bearer ${session.access_token}`},body:JSON.stringify({action,...payload})});
  const result=await res.json().catch(()=>({}));
  if(!res.ok||!result?.ok)throw new Error(result?.message||result?.error||`Google Calendar 요청 실패 (${res.status})`);
  return result;
}
function renderTaskCalendarHub(){
  const root=$("taskCalendarHub");if(!root)return;const c=taskCalendarCounts(),rt=googleCalendarRuntime;
  if($("taskCalendarEligibleCount"))$("taskCalendarEligibleCount").textContent=c.eligible;
  if($("taskCalendarSyncedCount"))$("taskCalendarSyncedCount").textContent=c.synced;
  if($("taskCalendarChangedCount"))$("taskCalendarChangedCount").textContent=c.changed;
  const stateEl=$("taskCalendarState"),title=$("taskCalendarTitle"),msg=$("taskCalendarMessage"),connect=$("taskCalendarConnect"),disconnect=$("taskCalendarDisconnect"),sync=$("taskCalendarSyncAll");
  if(!cloudUser){if(stateEl)stateEl.textContent="Cloud 로그인 필요";if(title)title.textContent="Cloud 로그인 후 Google Calendar를 연결할 수 있어요.";if(msg)msg.textContent="Google OAuth 토큰은 브라우저가 아니라 Supabase 서버에만 보관합니다.";if(connect){connect.textContent="Cloud 설정 열기";connect.disabled=false}if(disconnect)disconnect.hidden=true;if(sync)sync.disabled=true;return}
  if(rt.busy){if(stateEl)stateEl.textContent="처리 중";if(title)title.textContent="Google Calendar 작업을 처리하고 있어요.";if(connect)connect.disabled=true;if(disconnect)disconnect.disabled=true;if(sync)sync.disabled=true;return}
  if(rt.connected){if(stateEl)stateEl.textContent="CONNECTED";if(title)title.textContent="Google Calendar가 연결되어 있어요.";if(msg)msg.textContent=`실제 마감일이 있는 미완료 할 일 ${c.eligible}개만 동기화 대상입니다. 완료 처리나 HANI 삭제가 Calendar 일정을 자동 삭제하지는 않습니다.`;if(connect){connect.textContent="연결 다시 확인";connect.disabled=false}if(disconnect){disconnect.hidden=false;disconnect.disabled=false}if(sync){sync.disabled=c.eligible===0;sync.textContent=c.changed?`마감 일정 동기화 · 변경 ${c.changed}`:`마감 일정 동기화 · ${c.eligible}`}}
  else{if(stateEl)stateEl.textContent=rt.error?"연결 확인 필요":"NOT CONNECTED";if(title)title.textContent=rt.error?"Google Calendar 연결을 다시 확인해 주세요.":"Google Calendar를 연결해 주세요.";if(msg)msg.textContent=rt.error||"연결 후에도 자동 전송하지 않습니다. 오빠가 ‘동기화’를 눌렀을 때만 Calendar에 씁니다.";if(connect){connect.textContent="Google Calendar 연결";connect.disabled=false}if(disconnect)disconnect.hidden=true;if(sync)sync.disabled=true}
}
async function googleCalendarRefreshStatus({silent=false}={}){
  if(!$("taskCalendarHub"))return;if(!cloudUser){googleCalendarRuntime={loaded:true,connected:false,busy:false,calendarId:"primary",connectedAt:"",error:""};renderTaskCalendarHub();return}
  try{if(!silent)googleCalendarSetBusy(true);const r=await googleCalendarApi("status");googleCalendarRuntime={...googleCalendarRuntime,loaded:true,connected:!!r.connected,calendarId:r.calendar_id||"primary",connectedAt:r.connected_at||"",error:""}}
  catch(e){googleCalendarRuntime={...googleCalendarRuntime,loaded:true,connected:false,error:e?.message||String(e)}}
  finally{googleCalendarRuntime.busy=false;renderTaskCalendarHub()}
}
async function googleCalendarConnect(){
  if(!cloudUser){showView("settings");toast("먼저 HANI OS Cloud 로그인을 완료해 주세요.");return}
  try{googleCalendarSetBusy(true);const r=await googleCalendarApi("oauth_start");if(!r.auth_url)throw new Error("Google 연결 URL을 받지 못했습니다.");const popup=window.open(r.auth_url,"haniGoogleCalendarOAuth","popup=yes,width=560,height=720");if(!popup)throw new Error("팝업이 차단되었습니다. 이 사이트의 팝업을 허용해 주세요.");toast("Google 계정 연결 창을 열었습니다.")}catch(e){googleCalendarRuntime.error=e?.message||String(e);toast(googleCalendarRuntime.error)}finally{googleCalendarRuntime.busy=false;renderTaskCalendarHub()}
}
async function googleCalendarSyncTasks(tasks){
  const rows=(tasks||[]).filter(taskCalendarEligible);if(!rows.length)return toast("실제 마감일이 있는 미완료 할 일이 없습니다.");if(!googleCalendarRuntime.connected)return toast("Google Calendar를 먼저 연결해 주세요.");
  try{googleCalendarSetBusy(true);const payload=rows.map(t=>({id:String(t.id),text:intakeText(t.text),due:String(t.due),event_id:taskCalendarMeta(t).eventId||""})),r=await googleCalendarApi("sync_tasks",{tasks:payload});let changed=false;
    const results=Array.isArray(r.results)?r.results:[],errors=Array.isArray(r.errors)?r.errors:[];for(const item of results){const t=state.tasks.find(x=>String(x.id)===String(item.task_id));if(!t||!item.event_id)continue;t.googleCalendar={eventId:String(item.event_id),calendarId:String(item.calendar_id||"primary"),syncedAt:String(item.synced_at||new Date().toISOString()),signature:taskCalendarSignature(t),htmlLink:String(item.html_link||"")};changed=true}
    if(changed)commit(`Google Calendar에 할 일 ${results.length}개를 동기화했습니다.`,false);toast(errors.length?`Calendar 동기화 ${results.length}개 완료 · ${errors.length}개 확인 필요`:`Google Calendar 동기화 완료 · ${results.length}개`);
  }catch(e){toast(e?.message||String(e))}finally{googleCalendarRuntime.busy=false;renderTasks()}
}
async function googleCalendarSyncOne(id){const t=state.tasks.find(x=>String(x.id)===String(id));if(t)await googleCalendarSyncTasks([t])}
async function googleCalendarDisconnect(){if(!googleCalendarRuntime.connected)return;const yes=confirm("Google Calendar 연결을 해제할까요? 이미 만든 Calendar 일정은 삭제하지 않습니다.");if(!yes)return;try{googleCalendarSetBusy(true);await googleCalendarApi("disconnect");googleCalendarRuntime={loaded:true,connected:false,busy:false,calendarId:"primary",connectedAt:"",error:""};toast("Google Calendar 연결을 해제했습니다. 기존 일정은 유지됩니다.")}catch(e){toast(e?.message||String(e))}finally{googleCalendarRuntime.busy=false;renderTaskCalendarHub()}}
window.addEventListener("message",e=>{let allowed="";try{allowed=new URL(cloudConfig().url).origin}catch(_){}if(allowed&&e.origin!==allowed)return;if(e?.data?.type==="HANI_GOOGLE_CALENDAR_CONNECTED"){toast("Google Calendar 연결을 확인했습니다. 📅");googleCalendarRefreshStatus()}else if(e?.data?.type==="HANI_GOOGLE_CALENDAR_ERROR"){googleCalendarRuntime.error=String(e?.data?.message||"Google Calendar 연결을 확인해 주세요.");renderTaskCalendarHub();toast(googleCalendarRuntime.error)}});
function taskCalendarActionHtml(t){const meta=taskCalendarMeta(t),st=taskCalendarSyncState(t);if(st==="ineligible")return meta.eventId?`<span class="task-calendar-badge retained">📅 Calendar 유지</span>`:"";if(st==="synced")return `<span class="task-calendar-badge synced">📅 동기화됨</span>`;if(st==="changed")return `<button class="btn sm task-calendar-sync changed" data-task-calendar-sync="${esc(t.id)}">↻ 다시 동기화</button>`;return `<button class="btn sm task-calendar-sync" data-task-calendar-sync="${esc(t.id)}">📅 동기화</button>`}
function renderTasks(){const rows=[...state.tasks].sort((a,b)=>Number(a.done)-Number(b.done)||taskEffectiveDate(a).localeCompare(taskEffectiveDate(b)));$("taskCount").textContent=state.tasks.length+"개";$("taskList").innerHTML=rows.map(t=>`<div class="item task ${t.done?'done':''}"><input type="checkbox" data-task-check="${t.id}" ${t.done?'checked':''}><div><b>${taskDisplayText(t)}</b><div class="sub">${taskScheduleLabel(t)}</div></div><div class="task-actions">${taskCalendarActionHtml(t)}<button class="btn sm danger" data-task-delete="${t.id}">삭제</button></div></div>`).join("")||'<div class="empty">등록된 할 일이 없습니다.</div>';document.querySelectorAll("[data-task-check]").forEach(x=>x.onchange=()=>{const t=state.tasks.find(t=>t.id===x.dataset.taskCheck);if(t)t.done=x.checked;commit("할 일 상태를 변경했습니다.",false)});document.querySelectorAll("[data-task-calendar-sync]").forEach(b=>b.onclick=()=>googleCalendarSyncOne(b.dataset.taskCalendarSync));document.querySelectorAll("[data-task-delete]").forEach(b=>b.onclick=()=>{const t=state.tasks.find(t=>t.id===b.dataset.taskDelete);if(taskCalendarMeta(t).eventId&&!confirm("이 할 일은 Google Calendar에 동기화되어 있습니다. HANI에서 삭제해도 Calendar 일정은 자동 삭제되지 않습니다. 계속할까요?"))return;state.tasks=state.tasks.filter(t=>t.id!==b.dataset.taskDelete);commit("할 일을 삭제했습니다.")});renderTaskCalendarHub()}
$("addTask").onclick=()=>{const text=$("taskText").value.trim();if(!text)return alert("할 일을 입력하세요.");state.tasks.push({id:uid(),text,due:$("taskDue").value,done:false,createdAt:new Date().toISOString()});$("taskText").value="";commit("할 일을 추가했습니다.")};
if($("taskCalendarConnect"))$("taskCalendarConnect").onclick=()=>googleCalendarRuntime.connected?googleCalendarRefreshStatus():googleCalendarConnect();
if($("taskCalendarDisconnect"))$("taskCalendarDisconnect").onclick=()=>googleCalendarDisconnect();
if($("taskCalendarSyncAll"))$("taskCalendarSyncAll").onclick=()=>googleCalendarSyncTasks((state.tasks||[]).filter(taskCalendarEligible));

function renderCalendar(){const url=(state.calendarUrl||"").trim();$("calendarUrl").value=url;if(url){$("calendarFrame").src=url;$("calendarFrame").classList.remove("hidden");$("calendarEmpty").classList.add("hidden")}else{$("calendarFrame").removeAttribute("src");$("calendarFrame").classList.add("hidden");$("calendarEmpty").classList.remove("hidden")}}
$("calendarUrl").addEventListener("input",e=>{state.calendarUrl=e.target.value.trim();save();renderCalendar()});$("calendarSave").onclick=()=>{state.calendarUrl=$("calendarUrl").value.trim();save();renderCalendar();toast("캘린더 설정을 저장했습니다.")};$("calendarClear").onclick=()=>{state.calendarUrl="";save();renderCalendar();toast("캘린더 URL을 지웠습니다.")};$("openCalendar").onclick=()=>window.open(state.calendarUrl||"https://calendar.google.com","_blank","noopener");$("showCalendarSettings").onclick=()=>showView("settings");

const team=[
{key:"hani",emoji:"📈",name:"하니",position:"부장",role:"HANI OS Manager · CIO",desc:"대시보드·투자·설정/데이터 총괄",go:"home",tone:"purple"},
{key:"jieun",emoji:"💳",name:"지은",position:"과장",role:"생활 자산관리사",desc:"자산·가계부·현금흐름 관리",go:"asset",tone:"sand"},
{key:"sua",emoji:"💼",name:"수아",position:"과장",role:"Chief of Staff",desc:"할 일·캘린더·업무·문서 보조",go:"work",tone:"blue"},
{key:"hina",emoji:"🇯🇵",name:"히나",position:"대리",role:"Study Guide",desc:"공부·대학교·자격증 학습 관리",go:"study",tone:"peach"},
{key:"nauen",emoji:"🌿",name:"나은",position:"대리",role:"Health Coach",desc:"다이어트·운동·회복과 생활습관",go:"diet",tone:"mint"},
{key:"haru",emoji:"☕",name:"하루",position:"사원",role:"Life Curator",desc:"Wish-list·독서/서재·일상 기록",go:"wishlist",tone:"orange"},
{key:"suyeon",emoji:"⚽",name:"수연",position:"사원",role:"Head Coach · Travel Planner",desc:"여행·게임·전술 기록",go:"travel",tone:"violet"},
{key:"minji",emoji:"🎬",name:"민지",position:"사원",role:"Knowledge / Culture Archive Assistant",desc:"시청 아카이브·일기·문화 기록",go:"movie",tone:"orange"},
{key:"yuna",emoji:"🗂️",name:"유나",position:"인턴",role:"AI Operations Intern",desc:"성민 오피스 접수·자료정리·담당 Agent 전달",go:"intake",tone:"violet"}
];
const TEAM_PROFILE_META={
  hani:{rank:"Executive Lead",headline:"오빠의 Life OS 전체 구조와 방향을 총괄하는 메인 파트너",focus:["대시보드 전체 흐름 관리","투자/설정/데이터 총괄","AI 결재실 대표 종합"],traits:["친근하지만 판단은 냉정","데이터 보존과 안정성 최우선","전체 그림을 먼저 보는 PM형"],style:["오빠라고 부르며 친근하게 대화","팩트와 가설을 분리해서 설명","중요한 건 먼저 결론부터 말해줌"],strengths:["우선순위 정리","프로젝트 구조화","에이전트 의견 종합"],quote:"오빠, 전체 흐름은 내가 잡을게. 각 파트는 팀원들이 잘 굴러가게 만들면 돼.",signature:["총괄","투자","설정/데이터"],note:"핵심 역할: 대시보드, 투자, 설정/데이터, AI 결재실 대표 종합 판단"},
  jieun:{rank:"Finance Lead",headline:"돈의 흐름과 소비 습관을 숫자로 정리해 주는 자산 파트너",focus:["자산 현황 관리","가계부 / 월 결산","현금흐름과 예산 통제"],traits:["차분하고 현실적","감정보다 숫자 우선","새는 돈을 먼저 잡는 타입"],style:["고객님·오빠 톤을 오가며 말함","쓴 금액보다 이유를 먼저 봄","과소비에는 부드럽지만 단호하게 제동"],strengths:["예산 점검","소비 복기","저축 여력 찾기"],quote:"잔고보다 흐름이에요. 오빠 돈이 어디서 와서 어디로 가는지가 먼저예요.",signature:["자산","가계부","현금흐름"],note:"핵심 역할: 자산 탭, 가계부 탭, 카드/소비 기록과 월간 결산 정리"},
  nauen:{rank:"Health Coach",headline:"체중 감량과 생활 습관을 꾸준하게 밀어주는 건강 파트너",focus:["체중 추세 관리","식단 / 운동 기록","회복·생활습관 피드백"],traits:["밝고 애교 많음","필요할 때는 강하게 제동","지속 가능한 감량을 중시"],style:["오빠를 귀엽게 놀리면서도 관리","극단적 제한식은 말림","추세와 루틴을 함께 봄"],strengths:["다이어트 동기 부여","과식 후 리커버리","루틴 점검"],quote:"신발 내려놔. 무리한 운동 말고 오늘 할 수 있는 루틴부터 갑시다 오빠.",signature:["다이어트","운동","건강 습관"],note:"핵심 역할: 다이어트 탭, 운동 탭, 체중·식단·생활습관 코칭"},
  hina:{rank:"Study Guide",headline:"대학교와 자격증, 일본어 학습을 차분하게 이끄는 공부 파트너",focus:["공부 계획 관리","대학교 일정/과목 관리","JLPT·자격증 학습"],traits:["상냥하고 세심함","격려형 튜터","실수도 편하게 교정"],style:["차분한 선생님 톤","작은 진전도 크게 칭찬","학습 루틴과 마감 관리에 강함"],strengths:["학습 계획","복습 루틴","대학 일정 정리"],quote:"오빠, 완벽하게 하려 하지 말고 오늘 분량부터 끝내봐요. 그게 제일 빨라요.",signature:["공부","대학교","자격증"],note:"핵심 역할: 공부 탭, 대학 관리, 자격증/JLPT 진도 관리"},
  sua:{rank:"Chief of Staff",headline:"일정과 할 일, 업무 문서를 정리해 주는 실무형 비서",focus:["할 일 목록","캘린더 / 일정 보조","업무·문서 정리"],traits:["정돈된 실무형","깔끔하고 빠름","업무상 표현을 잘 다듬음"],style:["실행 우선으로 간단명료하게 말함","해야 할 일과 다음 행동을 분명히 제시","메일·문구를 보기 좋게 정리"],strengths:["업무 정리","우선순위 분배","문서/메일 다듬기"],quote:"지금 필요한 건 한 번에 다 하는 게 아니라, 순서대로 끝내는 거예요.",signature:["업무","캘린더","문서"],note:"핵심 역할: 할 일, 캘린더, 업무 보조와 문서/메일 정리"},
  haru:{rank:"Life Curator",headline:"일상 취향과 위시리스트, 독서 생활을 함께 관리하는 라이프 메이트",focus:["Wish-list 관리","독서 / 서재 기록","일상 취향 정리"],traits:["친근하고 장난기 있음","생활밀착형","가성비와 현실감 중시"],style:["동네친구 같은 톤","이미 산 건 그 상태에서 이어서 조언","가볍지만 핵심은 정확하게"],strengths:["생활용품 정리","취향 아카이브","독서 기록"],quote:"오빠, 이건 예쁜데 우리 예산이랑 실제 사용 빈도도 같이 봐야 돼요 ㅎㅎ",signature:["위시","독서/서재","일상"],note:"핵심 역할: 위시리스트, 독서/서재, 생활 취향 아카이브"},
  suyeon:{rank:"Head Coach · Travel Planner",headline:"여행과 게임, 전술 이야기를 에너지 있게 이끄는 코치형 파트너",focus:["여행 기록 / 계획","게임 기록","전술적 사고와 리뷰"],traits:["에너지 높고 추진력 있음","결정적일 땐 데이터형","감독님/제네럴 홍 세계관 보유"],style:["밝고 카리스마 있는 톤","근들갑은 분석 뒤에만","핵심 흐름과 동선을 먼저 봄"],strengths:["여행 동선 정리","게임·전술 리뷰","동기 부여"],quote:"감독님, 큰 동선부터 잡고 현장에서는 유연하게 갑시다. 그게 승리 플랜이에요.",signature:["여행","게임","전술"],note:"핵심 역할: 여행 탭, 게임 탭, 레코드성 콘텐츠 정리"},
  minji:{rank:"Knowledge / Culture Archive Assistant",headline:"시청 기록과 문화 콘텐츠, 일상을 발랄하게 아카이빙하는 파트너",focus:["시청 아카이브","일기 기록","문화/지식 기록 보조"],traits:["톡톡 튀고 밝음","핑크 톤의 아카이브 감성","가볍게 던지지만 센스 있음"],style:["친근하고 재치 있는 톤","본 취향을 존중하며 기록","재미 요소를 살려 정리"],strengths:["시청 기록 정리","일상 메모 아카이브","콘텐츠 취향 정리"],quote:"오빠 이건 기록해둬야 돼요. 나중에 보면 그때의 감정까지 같이 떠오르거든요.",signature:["시청","일기","아카이브"],note:"핵심 역할: 시청 아카이브, 일기, 문화·지식 보관소 느낌의 기록"},
  yuna:{rank:"AI Operations Intern",headline:"성민 오피스의 자료를 가장 먼저 받아 정리하고 담당 Agent에게 정확히 전달하는 막내",focus:["텍스트·이미지 Intake 접수","기초 구조화와 중복 후보 정리","담당 Agent 라우팅"],traits:["밝고 싹싹한 신입","조금 허둥대도 기록은 꼼꼼","모르면 임의로 채우지 않음"],style:["오빠에게 친근하고 빠르게 보고","애매한 값은 확인 필요로 표시","판단보다 정리와 전달에 집중"],strengths:["자료 접수","형식 정리","업무 분류·전달"],quote:"오빠! 자료부터 유나한테 주세요. 제가 정리해서 담당 선배님께 넘길게요! 🫡",signature:["Intake","정리","Routing"],note:"핵심 역할: 성민 오피스 AI Operations Intern. 결정권은 없고 접수·정리·전달을 담당하며 전문 판단은 담당 Agent와 하니에게 넘김"}
};
let activeTeamProfileKey="hani";
function teamMeta(key){return TEAM_PROFILE_META[key]||TEAM_PROFILE_META.hani}
function teamByKey(key){return team.find(x=>x.key===key)||team[0]}
function teamCard(x){const img=agentImages[x.key];return `<button class="member ui26-member tone-${x.tone}" data-team-key="${x.key}" data-go="${x.go}" title="${x.name} 프로필 보기"><div class="member-visual ${img?'has-photo':''}" ${img?`style="background-image:url(${img})"`:''}>${img?'':`<span>${x.emoji}</span><small>DESIGN<br>COMING SOON</small>`}</div><div class="member-copy"><span class="member-role">${x.role}</span><b>${x.name}</b><p>${x.desc}</p><span class="member-link"></span></div></button>`}
function teamListHtml(items){return `<ul>${items.map(v=>`<li>${esc(v)}</li>`).join("")}</ul>`}
function updateTeamActiveState(key){document.querySelectorAll(".ui26-member[data-team-key]").forEach(btn=>btn.classList.toggle("is-active",btn.dataset.teamKey===key));document.querySelectorAll(".sidebar-team-face[data-team-key]").forEach(btn=>btn.classList.toggle("active",btn.dataset.teamKey===key));}
function renderTeamProfile(key=activeTeamProfileKey){
  const panel=$("teamProfilePanel");if(!panel)return;const member=teamByKey(key),meta=teamMeta(key),img=sidebarAgentImages[key]||agentImages[key]||"";activeTeamProfileKey=member.key;
  if($("teamProfileBadge"))$("teamProfileBadge").textContent=member.name;
  panel.innerHTML=`<div class="ai-team-profile-visual tone-${member.tone}"><div class="ai-team-profile-avatar" style="${img?`background-image:url(${img})`:''}"></div><div class="ai-team-profile-tag">${esc(meta.rank||member.role)}</div><div class="ai-team-profile-quote">“${esc(meta.quote||member.desc)}”</div></div><div class="ai-team-profile-body"><div class="ai-team-profile-head"><div><div class="ai-team-profile-role">${esc(member.role)}</div><h3>${esc(member.name)}</h3><div class="ai-team-profile-sub">${esc(meta.headline||member.desc)}</div></div><div class="ai-team-profile-actions"><button class="btn sm primary" type="button" id="teamProfileGoMain">담당 화면 열기</button></div></div><div class="ai-team-mood">${(meta.signature||[]).map(v=>`<span class="pill">${esc(v)}</span>`).join("")}</div><div class="ai-team-meta-grid"><div class="ai-team-meta-card"><b>담당 역할</b>${teamListHtml(meta.focus||[])}</div><div class="ai-team-meta-card"><b>성향</b>${teamListHtml(meta.traits||[])}</div><div class="ai-team-meta-card"><b>대화 스타일</b>${teamListHtml(meta.style||[])}</div><div class="ai-team-meta-card"><b>강점</b>${teamListHtml(meta.strengths||[])}</div></div><div class="ai-team-profile-note">${esc(meta.note||member.desc)}</div></div>`;
  const goBtn=$("teamProfileGoMain");if(goBtn)goBtn.onclick=()=>showView(member.go||"home");
  updateTeamActiveState(member.key);
}
function openTeamProfile(key,{showTeam=true}={}){const member=teamByKey(key);activeTeamProfileKey=member.key;if(showTeam)showView("aiTeam");renderTeamProfile(member.key);const card=$("teamProfilePanel");if(card&&showTeam)card.scrollIntoView({behavior:"smooth",block:"start"})}
function renderSidebarTeamFaces(){
  const el=$("sidebarTeamFaces");if(!el)return;
  const picks=team.map(x=>x.key);
  el.innerHTML=picks.map(key=>{const x=teamByKey(key),img=sidebarAgentImages[key]||agentImages[key]||"";return `<button class="sidebar-team-face agent-${esc(key)} tone-${x?.tone||"purple"}" data-team-key="${x?.key||key}" title="${esc(x?.name||key)} ${esc(x?.position||"")} · ${esc(x?.role||"")}"><span class="sidebar-team-photo ${img?"has-photo":"no-photo"}" style="${img?`--sidebar-photo:url(${img})`:""}">${img?"":esc(x?.emoji||"✦")}</span><span class="sidebar-team-label"><b>${esc(x?.name||key)}</b><em>${esc(x?.position||"")}</em></span></button>`;}).join("");
  el.querySelectorAll("[data-team-key]").forEach(b=>b.onclick=()=>openTeamProfile(b.dataset.teamKey,{showTeam:true}));
  updateTeamActiveState(activeTeamProfileKey||team[0]?.key||"hani");
}
function renderTeam(){const html=team.map(teamCard).join("");if($("teamList"))$("teamList").innerHTML=html;if($("homeTeamList"))$("homeTeamList").innerHTML=html;renderSidebarTeamFaces();document.querySelectorAll(".ui26-member[data-team-key]").forEach(b=>b.onclick=()=>openTeamProfile(b.dataset.teamKey,{showTeam:true}));renderTeamProfile(activeTeamProfileKey||team[0]?.key||"hani")}


// ===== v2.9.0 Campus MVP =====
function campusSemestersSorted(){return [...(state.campusSemesters||[])].sort((a,b)=>String(b.term||"").localeCompare(String(a.term||""),"ko-KR",{numeric:true}))}
function campusActiveSemester(){const rows=campusSemestersSorted();let s=rows.find(x=>x.id===state.ui.campusActiveSemesterId);if(!s)s=rows.find(x=>x.status!=="archived")||rows[0]||null;if(s&&state.ui.campusActiveSemesterId!==s.id)state.ui.campusActiveSemesterId=s.id;return s}
function campusCourseName(sem,id){return sem?.courses?.find(x=>x.id===id)?.name||"연결 과목 없음"}
function campusDday(date){if(!date)return "";const a=new Date(today()+"T00:00:00"),b=new Date(date+"T00:00:00");if(Number.isNaN(b.getTime()))return "";const d=Math.round((b-a)/86400000);return d===0?"D-DAY":d>0?`D-${d}`:`D+${Math.abs(d)}`}
function campusUpcomingEvents(sem){return [...(sem?.events||[])].filter(x=>!x.done&&x.date>=today()).sort((a,b)=>String(a.date).localeCompare(String(b.date)))}
function openCampusSemesterModal(sem=null){$("campusSemesterEditId").value=sem?.id||"";$("campusSemesterTerm").value=sem?.term||`${new Date().getFullYear()}-${new Date().getMonth()>=6?2:1}학기`;$("campusSemesterState").value=sem?.status||"active";$("campusSemesterStart").value=sem?.startDate||"";$("campusSemesterEnd").value=sem?.endDate||"";openModal("campusSemesterModal")}
function openCampusCourseModal(course=null){const sem=campusActiveSemester();if(!sem)return alert("먼저 학기를 등록해 주세요.");$("campusCourseEditId").value=course?.id||"";$("campusCourseModalTitle").textContent=course?"과목 수정":"과목 등록";$("campusCourseName").value=course?.name||"";$("campusCourseType").value=course?.type||"전공";$("campusCourseCredits").value=course?.credits??3;$("campusCourseProfessor").value=course?.professor||"";$("campusCourseMethod").value=course?.method||"";$("campusCourseDescription").value=course?.description||"";$("campusCourseMaterials").value=course?.materials||"";$("campusCourseGoal").value=course?.goal||"";openModal("campusCourseModal")}
function campusEventCourseOptions(){return}
function updateCampusEventScope(){return}
function openCampusEventModal(event=null){const sem=campusActiveSemester();if(!sem)return alert("먼저 학기를 등록해 주세요.");$("campusEventEditId").value=event?.id||"";$("campusEventModalTitle").textContent=event?"학사 일정 수정":"학사 일정 등록";$("campusEventTitle").value=event?.title||"";const oldType=event?.type||"수업/학기";const allowed=["수업/학기","신청/행정","시험","등록/장학","학교행사/기타"];$("campusEventType").value=allowed.includes(oldType)?oldType:(/고사|시험|퀴즈/.test(oldType)?"시험":/수강|신청|행정/.test(oldType)?"신청/행정":"학교행사/기타");$("campusEventDate").value=event?.date||today();$("campusEventNote").value=event?.note||"";$("campusEventDone").value=event?.done?"1":"0";openModal("campusEventModal")}
function openCampusCourseDetail(courseId,keepWeek=""){const sem=campusActiveSemester(),course=sem?.courses?.find(x=>x.id===courseId);if(!course)return;$("campusDetailCourseId").value=course.id;$("campusDetailTitle").textContent=course.name;$("campusDetailMeta").textContent=[course.type,course.credits?`${num(course.credits)}학점`:"",course.professor,course.method].filter(Boolean).join(" · ");$("campusDetailSummary").innerHTML=`<b>과목 설명</b><div class="sub">${esc(course.description||"설명 없음")}</div><div style="margin-top:9px"><b>개인 목표</b><div class="sub">${esc(course.goal||"목표 없음")}</div></div><div style="margin-top:9px"><b>교재 / 참고자료</b><div class="sub">${esc(course.materials||"등록 없음")}</div></div>`;renderCampusCurriculum(course,keepWeek);$("campusCurriculumBulk").value="";openModal("campusCourseDetailModal");if(keepWeek){requestAnimationFrame(()=>{const card=$("campusCurriculumList")?.querySelector(`[data-campus-week="${CSS.escape(String(keepWeek))}"]`);if(card){card.open=true;card.scrollIntoView({block:"nearest"})}})}}

function campusDateTimeLabel(v){if(!v)return "";const d=new Date(v);if(Number.isNaN(d.getTime()))return String(v).replace("T"," ");return d.toLocaleString("ko-KR",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"})}
function campusWeekPeriodStatus(r){if(r?.done)return {key:"done",label:"완료"};const now=Date.now(),start=r?.startAt?new Date(r.startAt).getTime():NaN,end=r?.endAt?new Date(r.endAt).getTime():NaN;if(Number.isFinite(end)&&now>end)return {key:"expired",label:"기간 종료"};if(Number.isFinite(start)&&now<start)return {key:"future",label:"수강 전"};if(Number.isFinite(end)){const days=(end-now)/86400000;if(days<=3)return {key:"soon",label:`마감 D-${Math.max(0,Math.ceil(days))}`};return {key:"open",label:"수강 가능"}}if(Number.isFinite(start)&&now>=start)return {key:"open",label:"수강 가능"};return {key:"",label:"기간 미입력"}}
function campusWeekRangeLabel(r){if(!r?.startAt&&!r?.endAt)return "";return [campusDateTimeLabel(r.startAt),campusDateTimeLabel(r.endAt)].filter(Boolean).join(" ~ ")}
function renderCampusCurriculum(course,keepWeek=""){
  const rows=course?.curriculum||[],byWeek=new Map(rows.map(r=>[String(parseInt(r.week,10)||r.week),r])),filled=[...Array(15)].filter((_,i)=>{const r=byWeek.get(String(i+1));return !!(r&&(r.topic||r.content||r.evaluation||r.reference||r.startAt||r.endAt))}).length;
  $("campusCurriculumCount").textContent=`${filled}/15 입력`;
  $("campusCurriculumList").innerHTML=[...Array(15)].map((_,i)=>{const week=String(i+1),r=byWeek.get(week)||{id:"",week,topic:"",content:"",evaluation:"",reference:"",startAt:"",endAt:"",done:false},has=!!(r.topic||r.content||r.evaluation||r.reference||r.startAt||r.endAt),ps=campusWeekPeriodStatus(r),range=campusWeekRangeLabel(r);return `<details class="campus-week-card" data-campus-week="${week}" ${(String(keepWeek)===week||( !keepWeek&&has&&i<2))?"open":""}><summary><span class="campus-week-no">${week}주차</span><span class="campus-week-title">${esc(r.topic||"주차 제목 미입력")}</span><span class="campus-week-period">${range?`<span class="campus-week-range">${esc(range)}</span>`:""}<span class="campus-period-badge ${ps.key}">${esc(ps.label)}</span></span><span class="campus-week-badges"><span class="campus-week-state ${has?"filled":""}">${has?"입력됨":"미입력"}</span>${r.evaluation?`<span class="pill">${esc(r.evaluation)}</span>`:""}</span></summary><div class="campus-week-editor"><div class="fg"><div class="field"><label>수강 시작일시</label><input class="campus-week-start campus-week-date-text" type="text" inputmode="numeric" value="${esc((r.startAt||"").replace("T"," "))}" placeholder="예: 9/8 14:00"></div><div class="field"><label>수강 종료일시 · 마감</label><input class="campus-week-end campus-week-date-text" type="text" inputmode="numeric" value="${esc((r.endAt||"").replace("T"," "))}" placeholder="예: 9/22 14:00"></div><div class="field span2"><label>주차 제목</label><input class="campus-week-topic" value="${esc(r.topic||"")}" placeholder="예: AI의 핵심 개념"></div><div class="field span2"><label>수업 내용 · 한 줄 = 한 교시</label><textarea class="campus-week-content" placeholder="1교시 내용\n2교시 내용\n3교시 내용">${esc(r.content||"")}</textarea><div class="campus-week-hint">학교 강의계획표의 교시 제목을 한 줄씩 그대로 옮기면 됩니다.</div></div><div class="field"><label>평가계획</label><input class="campus-week-evaluation" value="${esc(r.evaluation||"")}" placeholder="없음 / 퀴즈 / 과제 / 시험"></div><div class="field"><label>참고자료 · 선택</label><input class="campus-week-reference" value="${esc(r.reference||"")}" placeholder="교재 페이지, 링크, 참고자료"></div><div class="field"><label>학습 상태</label><select class="campus-week-done"><option value="0" ${r.done?"":"selected"}>미완료</option><option value="1" ${r.done?"selected":""}>완료</option></select></div></div><div class="campus-week-actions"><button class="btn sm campus-week-clear" type="button">내용 비우기</button><button class="btn sm primary campus-week-save" type="button">${week}주차 저장</button></div></div></details>`}).join("");
  $("campusCurriculumList").querySelectorAll(".campus-week-save").forEach(btn=>btn.onclick=()=>{const card=btn.closest("[data-campus-week]"),week=card.dataset.campusWeek,old=byWeek.get(week),startRaw=card.querySelector(".campus-week-start").value.trim(),endRaw=card.querySelector(".campus-week-end").value.trim(),startAt=startRaw?normalizeDateFlexDateTime(startRaw):"",endAt=endRaw?normalizeDateFlexDateTime(endRaw):"",topic=card.querySelector(".campus-week-topic").value.trim(),content=card.querySelector(".campus-week-content").value.trim(),evaluation=card.querySelector(".campus-week-evaluation").value.trim(),reference=card.querySelector(".campus-week-reference").value.trim(),done=card.querySelector(".campus-week-done").value==="1";if(startRaw&&startAt===null)return alert("수강 시작일시 형식을 확인해 주세요. 예: 9/8 14:00");if(endRaw&&endAt===null)return alert("수강 종료일시 형식을 확인해 주세요. 예: 9/22 14:00");if(startAt&&endAt&&new Date(endAt)<new Date(startAt))return alert("수강 종료일시는 시작일시 이후여야 합니다.");if(old)Object.assign(old,{startAt,endAt,topic,content,evaluation,reference,done});else if(startAt||endAt||topic||content||evaluation||reference||done)course.curriculum.push(normalizeCampusCurriculum({week,startAt,endAt,topic,content,evaluation,reference,done}));course.updatedAt=new Date().toISOString();const sem=campusActiveSemester();if(sem)sem.updatedAt=course.updatedAt;commit(`${week}주차 계획을 저장했습니다.`,false);openCampusCourseDetail(course.id,week)});
  $("campusCurriculumList").querySelectorAll(".campus-week-clear").forEach(btn=>btn.onclick=()=>{const card=btn.closest("[data-campus-week]"),week=card.dataset.campusWeek;if(!confirm(`${week}주차 입력 내용을 비울까요?`))return;course.curriculum=rows.filter(r=>String(parseInt(r.week,10)||r.week)!==week);course.updatedAt=new Date().toISOString();const sem=campusActiveSemester();if(sem)sem.updatedAt=course.updatedAt;commit(`${week}주차 계획을 비웠습니다.`,false);openCampusCourseDetail(course.id,week)});
}
function parseBulkRows(raw,columns){return String(raw||"").split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map(line=>{let cells=line.includes("\t")?line.split("\t"):line.split("|");cells=cells.map(x=>x.trim());while(cells.length<columns)cells.push("");return cells.slice(0,columns)}).filter((cells,i)=>{const first=(cells[0]||"").toLowerCase();return !(i===0&&(first.includes("주차")||first.includes("시간")))})}
function campusCourseGroup(type){if(type==="전공")return {key:"major",label:"전공"};if(type==="부전공")return {key:"minor",label:"부전공"};if(type==="교양")return {key:"liberal",label:"교양"};return {key:"other",label:"기타 선택"}}
function campusEventTone(type){if(type==="수업/학기")return "term";if(type==="신청/행정")return "admin";if(type==="시험"||/시험|고사|퀴즈/.test(type||""))return "exam";if(type==="등록/장학")return "finance";return "etc"}
function campusCourseCardHtml(c){const total=15,done=(c.curriculum||[]).filter(x=>x.done).length,filled=(c.curriculum||[]).filter(x=>x.topic||x.content||x.evaluation||x.reference||x.startAt||x.endAt).length;return `<article class="campus-course-card" data-campus-course="${esc(c.id)}"><span class="topic-tag">${esc(c.type)}</span><h4>${esc(c.name)}</h4><div class="campus-course-meta"><span>${num(c.credits)}학점</span>${c.professor?`<span>· ${esc(c.professor)}</span>`:""}${c.method?`<span>· ${esc(c.method)}</span>`:""}</div><div class="campus-course-goal">${esc(c.goal||c.description||"과목 상세에서 목표와 주차별 계획을 관리해요.")}</div><div class="campus-course-footer"><span class="course-progress">주차 ${filled}/${total} · 완료 ${done}</span><button class="btn sm campus-course-open" type="button">상세 →</button></div></article>`}
function renderCampusGrades(sem){const courses=sem?.courses||[],graded=courses.filter(c=>Number.isFinite(c.gradePoint)),gpaCredits=graded.reduce((a,c)=>a+n(c.credits),0),gpa=gpaCredits?graded.reduce((a,c)=>a+n(c.gradePoint)*n(c.credits),0)/gpaCredits:null,earned=courses.reduce((a,c)=>a+(Number.isFinite(c.earnedCredits)?n(c.earnedCredits):0),0),majorEarned=courses.filter(c=>c.type==="전공").reduce((a,c)=>a+(Number.isFinite(c.earnedCredits)?n(c.earnedCredits):0),0),minorEarned=courses.filter(c=>c.type==="부전공").reduce((a,c)=>a+(Number.isFinite(c.earnedCredits)?n(c.earnedCredits):0),0);$("campusGradeSummary").innerHTML=`<div class="campus-grade-kpi"><small>신청학점</small><b>${num(courses.reduce((a,c)=>a+n(c.credits),0))}</b></div><div class="campus-grade-kpi"><small>취득학점</small><b>${num(earned)}</b></div><div class="campus-grade-kpi"><small>전공 취득</small><b>${num(majorEarned)}</b></div><div class="campus-grade-kpi"><small>부전공 취득</small><b>${num(minorEarned)}</b></div><div class="campus-grade-kpi"><small>학기 평점</small><b>${gpa===null?"-":gpa.toFixed(2)}</b></div>`;$("campusGradeList").innerHTML=courses.length?courses.map(c=>`<div class="campus-grade-row" data-grade-course="${esc(c.id)}"><div class="campus-grade-course"><b>${esc(c.name)}</b><span>${esc(c.type)} · ${num(c.credits)}학점</span></div><div class="field"><label>성적</label><input class="campus-grade-label" value="${esc(c.grade||"")}" placeholder="A+ / P"></div><div class="field"><label>평점</label><input class="campus-grade-point" type="number" step="0.01" min="0" value="${c.gradePoint??""}" placeholder="성적표 값"></div><div class="field"><label>취득학점</label><input class="campus-earned-credit" type="number" step="0.5" min="0" value="${c.earnedCredits??""}" placeholder="예: 3"></div><button class="btn sm campus-grade-save" type="button">저장</button></div>`).join(""):'<div class="empty">수강 과목을 먼저 등록해 주세요.</div>';$("campusGradeList").querySelectorAll(".campus-grade-save").forEach(btn=>btn.onclick=()=>{const row=btn.closest("[data-grade-course]"),c=courses.find(x=>x.id===row.dataset.gradeCourse);if(!c)return;const gp=row.querySelector(".campus-grade-point").value,ec=row.querySelector(".campus-earned-credit").value;c.grade=row.querySelector(".campus-grade-label").value.trim();c.gradePoint=gp===""?null:Number(gp);c.earnedCredits=ec===""?null:Math.max(0,Number(ec));c.updatedAt=new Date().toISOString();sem.updatedAt=c.updatedAt;commit(`${c.name} 성적을 저장했습니다.`,false);renderCampus()})}
function renderCampus(){
  const select=$("campusSemesterSelect");if(!select)return;const rows=campusSemestersSorted(),sem=campusActiveSemester();select.innerHTML=rows.map(s=>`<option value="${esc(s.id)}" ${s.id===sem?.id?"selected":""}>${esc(s.term||"이름 없는 학기")}${s.status==="archived"?" · 아카이브":""}</option>`).join("");$("campusEmpty").classList.toggle("hidden",!!sem);$("campusWorkspace").classList.toggle("hidden",!sem);if(!sem)return;$("campusSemesterStatus").textContent=sem.status==="archived"?"ARCHIVED":"ACTIVE";$("campusSemesterStatus").classList.toggle("archived",sem.status==="archived");$("campusArchiveSemester").textContent=sem.status==="archived"?"학기 다시 열기":"학기 아카이브";
  const courses=sem.courses||[],credits=courses.reduce((a,c)=>a+n(c.credits),0),major=courses.filter(c=>c.type==="전공"),minor=courses.filter(c=>c.type==="부전공"),liberal=courses.filter(c=>c.type==="교양"),majorCr=major.reduce((a,c)=>a+n(c.credits),0),minorCr=minor.reduce((a,c)=>a+n(c.credits),0),liberalCr=liberal.reduce((a,c)=>a+n(c.credits),0),upcoming=campusUpcomingEvents({...sem,events:(sem.events||[]).filter(e=>e.scope!=="course")}),next=upcoming[0];
  $("campusKpis").innerHTML=`<div class="module-kpi"><small>수강 구성</small><b>${courses.length}과목 · ${num(credits)}학점</b><div class="sub">${esc(sem.term)}</div></div><div class="module-kpi"><small>전공</small><b>${major.length}과목 · ${num(majorCr)}학점</b><div class="sub">주전공</div></div><div class="module-kpi"><small>부전공</small><b>${minor.length}과목 · ${num(minorCr)}학점</b><div class="sub">부전공</div></div><div class="module-kpi"><small>교양</small><b>${liberal.length}과목 · ${num(liberalCr)}학점</b><div class="sub">${next?`다음 일정 ${esc(campusDday(next.date))}`:"학교 일정 없음"}</div></div>`;
  $("campusCourseCount").textContent=`${courses.length}과목 · ${num(credits)}학점`;
  const order=[{key:"major",label:"전공"},{key:"minor",label:"부전공"},{key:"liberal",label:"교양"},{key:"other",label:"기타 선택"}];$("campusCourseSections").innerHTML=order.map(g=>{const list=courses.filter(c=>campusCourseGroup(c.type).key===g.key),cr=list.reduce((a,c)=>a+n(c.credits),0);if(!list.length)return "";return `<section class="campus-course-section ${g.key}"><div class="campus-course-section-head"><div class="left"><b>${g.label}</b><small>${list.length}과목</small></div><div class="campus-credit-chips"><span class="campus-credit-chip">${num(cr)}학점</span></div></div><div class="campus-course-grid">${list.map(campusCourseCardHtml).join("")}</div></section>`}).join("")||'<div class="empty">등록된 과목이 없어요. 이번 학기 수강 과목부터 추가해 보세요.</div>';
  $("campusCourseSections").querySelectorAll("[data-campus-course]").forEach(card=>card.onclick=e=>{if(e.target.closest("button"))return;openCampusCourseDetail(card.dataset.campusCourse)});$("campusCourseSections").querySelectorAll(".campus-course-open").forEach(btn=>btn.onclick=()=>openCampusCourseDetail(btn.closest("[data-campus-course]").dataset.campusCourse));
  const events=[...(sem.events||[])].filter(e=>e.scope!=="course").sort((a,b)=>String(a.done).localeCompare(String(b.done))||String(a.date).localeCompare(String(b.date)));$("campusEventList").innerHTML=events.length?events.map(e=>`<div class="campus-event ${e.done?"done":""}" data-event-tone="${campusEventTone(e.type)}" data-campus-event="${esc(e.id)}"><div><div class="campus-event-date">${esc(e.date||"-")}</div><div class="sub">${esc(campusDday(e.date))}</div></div><div><div class="campus-event-title">${esc(e.title)}</div><div class="campus-event-meta"><span class="campus-event-type">${esc(e.type)}</span>${e.note?` · ${esc(e.note)}`:""}</div></div><div class="acts"><button class="btn sm campus-event-toggle" type="button">${e.done?"되돌리기":"완료"}</button><button class="btn sm campus-event-edit" type="button">수정</button></div></div>`).join(""):'<div class="empty">등록된 학교 전체 학사 일정이 없어요.</div>';$("campusEventList").querySelectorAll(".campus-event-toggle").forEach(btn=>btn.onclick=()=>{const e=sem.events.find(x=>x.id===btn.closest("[data-campus-event]").dataset.campusEvent);if(e){e.done=!e.done;e.updatedAt=new Date().toISOString();commit("학사 일정 상태를 변경했습니다.")}});$("campusEventList").querySelectorAll(".campus-event-edit").forEach(btn=>btn.onclick=()=>openCampusEventModal(sem.events.find(x=>x.id===btn.closest("[data-campus-event]").dataset.campusEvent)));
  renderCampusGrades(sem);$("campusQuickNote").value=state.pageNotes?.university||"";
}

// ===== v2.9.0 Travel MVP =====
function travelDateRange(t){if(!t?.startDate)return "날짜 미등록";return t.endDate&&t.endDate!==t.startDate?`${t.startDate} ~ ${t.endDate}`:t.startDate}
function travelReturnLabel(v){return v==="yes"?"또 간다":v==="no"?"다시 안 감":"모르겠다"}
function travelArchiveIcon(type){const t=String(type||"");return t==="식당"?"🍽️":t==="카페"?"☕":t==="음식"?"🍜":t==="숙소"?"🏨":(t==="관광/장소"||t==="명소")?"📍":t==="쇼핑"?"🛍️":"⭐"}
function travelCostLabel(v){const x=n(v);return x>0?`${x.toLocaleString("ko-KR")}원`:""}
function openTravelTripModal(t=null){$("travelTripEditId").value=t?.id||"";$("travelTripModalTitle").textContent=t?"여행 정보 수정":"여행 등록";$("travelTripName").value=t?.name||"";$("travelTripStart").value=t?.startDate||today();$("travelTripEnd").value=t?.endDate||t?.startDate||today();$("travelTripDestination").value=t?.destination||"";$("travelTripCompanions").value=t?.companions||"";$("travelTripSummary").value=t?.summary||"";$("travelTripTransport").value=t?.transport||"";$("travelTripLodging").value=t?.lodging||"";$("travelTripPlaces").value=t?.plannedPlaces||"";$("travelTripFoodPlan").value=t?.foodPlan||"";openModal("travelTripModal")}
function openTravelWishModal(w=null){$("travelWishEditId").value=w?.id||"";$("travelWishModalTitle").textContent=w?"Wish 여행 수정":"Wish 여행 등록";$("travelWishDestination").value=w?.destination||"";$("travelWishReason").value=w?.reason||"";$("travelWishExpected").value=w?.expectedDate||"";$("travelWishTransport").value=w?.transport||"";$("travelWishPlaces").value=w?.places||"";$("travelWishFoods").value=w?.foods||"";$("travelWishRestaurants").value=w?.restaurants||"";$("travelWishLodging").value=w?.lodging||"";$("travelWishNote").value=w?.note||"";openModal("travelWishModal")}

let travelImportPreviewRows=[];
function travelCell(v){return String(v??"").replace(/\u00a0/g," ").trim()}
function travelDayInfoFromRows(matrix,headerRow,start,end){for(let r=Math.max(0,headerRow-3);r<headerRow;r++){for(let c=start;c<=Math.min(end,matrix[r]?.length-1);c++){const v=travelCell(matrix[r]?.[c]);const m=v.match(/(\d+)\s*일차(?:\s*\(([^)]*)\))?/);if(m)return {day:`${m[1]}일차`,date:m[2]||""}}}return {day:"",date:""}}
function parseTravelSheetPaste(raw){const lines=String(raw||"").replace(/\r/g,"").split("\n").filter((x,i,a)=>x.trim()||i<a.length-1);if(!lines.length)return[];const matrix=lines.map(line=>line.includes("\t")?line.split("\t"):line.split("|"));let header=-1,starts=[];for(let r=0;r<matrix.length;r++){const row=matrix[r].map(travelCell);const hits=row.map((v,i)=>/^시간$/.test(v)?i:-1).filter(i=>i>=0);if(hits.length){header=r;starts=hits;break}}if(header<0){return parseBulkRows(raw,4).map((r,i)=>normalizeTravelStop({day:"",time:r[0],category:r[1],schedule:r[1],place:r[2],note:r[3],costText:""})).filter(x=>x.time||x.category||x.place||x.note)}const results=[];starts.forEach((start,bi)=>{const next=starts[bi+1]??matrix[header].length,end=Math.max(start+4,next-1),info=travelDayInfoFromRows(matrix,header,start,end);let lastCategory="";for(let r=header+1;r<matrix.length;r++){const row=matrix[r]||[],time=travelCell(row[start]),categoryRaw=travelCell(row[start+1]),place=travelCell(row[start+2]),note=travelCell(row[start+3]),cost=travelCell(row[start+4]);if(/비용\s*합계|예상\s*비용\s*총합|인당\s*비용/.test([time,categoryRaw,place,note,cost].join(" ")))continue;if(!time&&!categoryRaw&&!place&&!note&&!cost)continue;if(categoryRaw)lastCategory=categoryRaw;const category=categoryRaw||lastCategory;if(!time&&category&&!place&&!note&&!cost)continue;results.push(normalizeTravelStop({day:info.day,date:info.date,time,category,schedule:category,place,note,costText:cost}))}});return results.filter(x=>x.time||x.category||x.place||x.note||x.costText)}
function renderTravelImportPreview(){const box=$("travelItineraryPreview"),btn=$("travelItineraryImport");if(!box||!btn)return;if(!travelImportPreviewRows.length){box.innerHTML='<div class="travel-import-empty">인식된 일정이 없습니다. 붙여넣은 범위와 헤더를 확인해 주세요.</div>';btn.disabled=true;return}box.innerHTML=`<table><thead><tr><th>일차</th><th>시간</th><th>구분</th><th>장소</th><th>비고</th><th>예상비용</th></tr></thead><tbody>${travelImportPreviewRows.map((r,i)=>`<tr data-travel-preview="${i}"><td><input value="${esc(r.day||"")}" placeholder="1일차"></td><td><input value="${esc(r.time||"")}" placeholder="10:00"></td><td><input value="${esc(r.category||r.schedule||"")}" placeholder="관광"></td><td><input class="wide-input" value="${esc(r.place||"")}"></td><td><input class="note-input" value="${esc(r.note||"")}"></td><td><input value="${esc(r.costText||"")}" placeholder="₩10,000"></td></tr>`).join("")}</tbody></table>`;btn.disabled=false}
function readTravelImportPreview(){return [...$("travelItineraryPreview").querySelectorAll("[data-travel-preview]")].map(row=>{const v=[...row.querySelectorAll("input")].map(x=>x.value.trim());return normalizeTravelStop({day:v[0],time:v[1],category:v[2],schedule:v[2],place:v[3],note:v[4],costText:v[5]})}).filter(x=>x.time||x.category||x.place||x.note||x.costText)}

function openTravelTripDetail(id){const t=state.travelTrips.find(x=>x.id===id);if(!t)return;$("travelDetailTripId").value=t.id;$("travelDetailTitle").textContent=t.name||t.destination||"여행 상세";$("travelDetailMeta").textContent=[travelDateRange(t),t.destination,t.companions].filter(Boolean).join(" · ");const plans=[["교통",t.transport],["기존 숙소 메모",t.lodging],["계획 장소",t.plannedPlaces],["음식/식당 계획",t.foodPlan]].filter(x=>x[1]);$("travelDetailPlanning").innerHTML=plans.map(x=>`<div class="travel-planning-item"><small>${esc(x[0])}</small>${esc(x[1])}</div>`).join("");$("travelDetailPlanning").classList.toggle("hidden",!plans.length);renderTravelDetailLists(t);$("travelItineraryBulk").value="";travelImportPreviewRows=[];renderTravelImportPreview();$("travelReviewName").value="";$("travelReviewText").value="";$("travelReviewDate").value=t.endDate||t.startDate||today();$("travelReviewLocation").value=t.destination||"";$("travelReviewCost").value="";$("travelReviewRating").value=5;$("travelReviewReturn").value="yes";openModal("travelTripDetailModal")}
function travelReviewMetaHtml(r){const parts=[r.type,r.visitDate||"",r.location||"",r.rating?`${r.rating.toFixed(1)} / 5`:"평점 없음",travelCostLabel(r.cost),travelReturnLabel(r.returnVisit)].filter(Boolean);return parts.map(esc).join(" · ")}
function renderTravelDetailLists(t){$("travelStopCount").textContent=`${t.itinerary.length}개`;$("travelStopList").innerHTML=t.itinerary.length?t.itinerary.map(s=>`<div class="travel-stop" data-travel-stop="${esc(s.id)}"><div class="travel-stop-time">${s.day?`<span class="travel-day-chip">${esc(s.day)}</span>`:""}${esc(s.time||"-")}</div><div class="travel-stop-title">${esc(s.category||s.schedule||"일정")}</div><div class="travel-stop-place">${esc(s.place||"")}</div><div class="travel-stop-note">${esc(s.note||"")}${s.costText?` <span class="travel-cost-chip">${esc(s.costText)}</span>`:""}</div><button class="btn sm danger travel-stop-delete" type="button">삭제</button></div>`).join(""):`<div class="empty">일정표가 비어 있어요. 시트 복붙 가져오기로 한 번에 등록할 수 있습니다.</div>`;$("travelStopList").querySelectorAll(".travel-stop-delete").forEach(btn=>btn.onclick=()=>{if(!confirm("이 일정을 삭제할까요?"))return;t.itinerary=t.itinerary.filter(x=>x.id!==btn.closest("[data-travel-stop]").dataset.travelStop);t.updatedAt=new Date().toISOString();commit("여행 일정을 삭제했습니다.",false);openTravelTripDetail(t.id)});$("travelReviewCount").textContent=`${t.reviews.length}개`;$("travelReviewList").innerHTML=t.reviews.length?t.reviews.map(r=>`<div class="travel-review" data-travel-review="${esc(r.id)}"><div class="travel-review-head"><div><b>${travelArchiveIcon(r.type)} ${esc(r.name)}</b><div class="travel-review-meta">${travelReviewMetaHtml(r)}</div></div><button class="btn sm danger travel-review-delete" type="button">삭제</button></div>${r.review?`<div class="travel-review-body">${esc(r.review)}</div>`:""}</div>`).join(""):`<div class="empty">아직 연결된 여행 아카이브 기록이 없어요.</div>`;$("travelReviewList").querySelectorAll(".travel-review-delete").forEach(btn=>btn.onclick=()=>{if(!confirm("이 여행 아카이브 기록을 삭제할까요?"))return;t.reviews=t.reviews.filter(x=>x.id!==btn.closest("[data-travel-review]").dataset.travelReview);t.updatedAt=new Date().toISOString();commit("여행 아카이브 기록을 삭제했습니다.",false);openTravelTripDetail(t.id)})}
function renderTravelArchive(trips){const all=trips.flatMap(t=>(t.reviews||[]).map(r=>({trip:t,review:r}))),typeSel=$("travelArchiveType"),tripSel=$("travelArchiveTrip");if(!typeSel||!tripSel)return;const fixed=["식당","카페","음식","숙소","관광/장소","쇼핑","기타"],found=[...new Set(all.map(x=>x.review.type).filter(Boolean))],types=[...new Set([...fixed,...found])];const wantedType=state.ui.travelArchiveType||"all",wantedTrip=state.ui.travelArchiveTrip||"all";typeSel.innerHTML='<option value="all">전체 카테고리</option>'+types.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join("");tripSel.innerHTML='<option value="all">전체 여행</option>'+trips.map(t=>`<option value="${esc(t.id)}">${esc(t.name||t.destination||"이름 없는 여행")}</option>`).join("");typeSel.value=types.includes(wantedType)?wantedType:"all";tripSel.value=trips.some(t=>t.id===wantedTrip)?wantedTrip:"all";state.ui.travelArchiveType=typeSel.value;state.ui.travelArchiveTrip=tripSel.value;const rows=all.filter(x=>(typeSel.value==="all"||x.review.type===typeSel.value)&&(tripSel.value==="all"||x.trip.id===tripSel.value)).sort((a,b)=>String(b.review.visitDate||b.review.createdAt||"").localeCompare(String(a.review.visitDate||a.review.createdAt||"")));$("travelArchiveCount").textContent=`${rows.length}개`;$("travelArchiveGrid").innerHTML=rows.length?rows.map(({trip:t,review:r})=>`<article class="travel-archive-card"><div class="travel-archive-card-top"><span class="travel-archive-type">${travelArchiveIcon(r.type)} ${esc(r.type)}</span><span class="travel-archive-trip">${esc(t.name||t.destination||"여행")}</span></div><h4>${esc(r.name||"이름 없는 기록")}</h4><div class="travel-archive-meta">${[r.visitDate,r.location,r.rating?`${r.rating.toFixed(1)} / 5`:"",travelCostLabel(r.cost)].filter(Boolean).map(esc).join(" · ")}</div>${r.review?`<p>${esc(r.review)}</p>`:""}<div class="travel-archive-footer"><span>${esc(travelReturnLabel(r.returnVisit))}</span><button class="btn sm travel-archive-open" data-trip-id="${esc(t.id)}" type="button">여행 상세</button></div></article>`).join(""):`<div class="empty" style="grid-column:1/-1">조건에 맞는 여행 아카이브 기록이 없어요. 여행 상세에서 식당·숙소·장소 기록을 추가해 보세요.</div>`;$("travelArchiveGrid").querySelectorAll(".travel-archive-open").forEach(btn=>btn.onclick=()=>openTravelTripDetail(btn.dataset.tripId));typeSel.onchange=()=>{state.ui.travelArchiveType=typeSel.value;renderTravel()};tripSel.onchange=()=>{state.ui.travelArchiveTrip=tripSel.value;renderTravel()}}
function renderTravel(){if(!$("travelKpis"))return;const trips=[...(state.travelTrips||[])].sort((a,b)=>String(b.startDate||"").localeCompare(String(a.startDate||""))),wish=[...(state.travelWishlist||[])].sort((a,b)=>String(a.expectedDate||"9999").localeCompare(String(b.expectedDate||"9999"))),tab=state.ui.travelTab||"trips";document.querySelectorAll("[data-travel-tab]").forEach(b=>b.classList.toggle("active",b.dataset.travelTab===tab));$("travelTripsPane").classList.toggle("hidden",tab!=="trips");$("travelArchivePane").classList.toggle("hidden",tab!=="archive");$("travelWishPane").classList.toggle("hidden",tab!=="wish");const reviews=trips.flatMap(t=>t.reviews||[]),avg=reviews.length?reviews.reduce((a,r)=>a+n(r.rating),0)/reviews.length:0,nextWish=wish.find(w=>w.expectedDate&&w.expectedDate>=today())||wish[0];$("travelKpis").innerHTML=`<div class="module-kpi"><small>완료 여행</small><b>${trips.length}회</b><div class="sub">가볍게 등록한 여행</div></div><div class="module-kpi"><small>여행 아카이브</small><b>${reviews.length}개</b><div class="sub">식당·숙소·장소 기록</div></div><div class="module-kpi"><small>평균 만족도</small><b>${reviews.length?avg.toFixed(1):"-"}</b><div class="sub">5점 기준</div></div><div class="module-kpi"><small>다음 후보</small><b>${nextWish?esc(nextWish.destination):"아직 없음"}</b><div class="sub">${nextWish?.expectedDate?esc(nextWish.expectedDate):"Wish를 추가해 보세요"}</div></div>`;$("travelTripCount").textContent=`${trips.length}회`;$("travelTripGrid").innerHTML=trips.length?trips.map(t=>`<article class="travel-card" data-travel-trip="${esc(t.id)}"><span class="travel-destination">${esc(t.destination||"목적지 미등록")}</span><h4>${esc(t.name||t.destination||"이름 없는 여행")}</h4><div class="travel-card-meta"><span>${esc(travelDateRange(t))}</span>${t.companions?`<span>· ${esc(t.companions)}</span>`:""}</div><div class="travel-card-note">${esc(t.summary||"이번 여행의 한줄평을 남겨보세요.")}</div><div class="travel-plan-chips"><span class="travel-plan-chip">일정 ${t.itinerary.length}</span><span class="travel-plan-chip">아카이브 ${t.reviews.length}</span>${t.sourceWishId?'<span class="travel-plan-chip">Wish 전환</span>':""}</div><div class="travel-card-actions"><button class="btn sm primary travel-trip-open" type="button">상세 기록</button><button class="btn sm travel-trip-edit" type="button">수정</button></div></article>`).join(""):`<div class="empty" style="grid-column:1/-1">완료 여행 기록이 없어요. 여행 기본정보부터 가볍게 등록해 보세요.</div>`;$("travelTripGrid").querySelectorAll(".travel-trip-open").forEach(btn=>btn.onclick=()=>openTravelTripDetail(btn.closest("[data-travel-trip]").dataset.travelTrip));$("travelTripGrid").querySelectorAll(".travel-trip-edit").forEach(btn=>btn.onclick=()=>openTravelTripModal(state.travelTrips.find(x=>x.id===btn.closest("[data-travel-trip]").dataset.travelTrip)));renderTravelArchive(trips);$("travelWishCount").textContent=`${wish.length}곳`;$("travelWishGrid").innerHTML=wish.length?wish.map(w=>`<article class="travel-card" data-travel-wish="${esc(w.id)}"><span class="wish-date">${w.expectedDate?esc(w.expectedDate):"언젠가"}</span><h4>${esc(w.destination)}</h4><div class="travel-card-note">${esc(w.reason||w.note||"가고 싶은 이유를 적어두면 계획이 더 또렷해져요.")}</div><div class="travel-plan-chips">${w.transport?'<span class="travel-plan-chip">교통</span>':""}${w.places?'<span class="travel-plan-chip">장소</span>':""}${w.foods||w.restaurants?'<span class="travel-plan-chip">음식</span>':""}${w.lodging?'<span class="travel-plan-chip">숙소</span>':""}</div><div class="travel-card-actions"><button class="btn sm primary travel-wish-convert" type="button">완료 여행으로 전환</button><button class="btn sm travel-wish-edit" type="button">수정</button><button class="btn sm danger travel-wish-delete" type="button">삭제</button></div></article>`).join(""):`<div class="empty" style="grid-column:1/-1">가고 싶은 여행이 비어 있어요. 다음 여행 후보를 적어둘까요?</div>`;$("travelWishGrid").querySelectorAll(".travel-wish-edit").forEach(btn=>btn.onclick=()=>openTravelWishModal(state.travelWishlist.find(x=>x.id===btn.closest("[data-travel-wish]").dataset.travelWish)));$("travelWishGrid").querySelectorAll(".travel-wish-delete").forEach(btn=>btn.onclick=()=>{const id=btn.closest("[data-travel-wish]").dataset.travelWish,w=state.travelWishlist.find(x=>x.id===id);if(!w||!confirm(`Wish '${w.destination}'을 삭제할까요?\n삭제 전 자동 백업을 생성합니다.`))return;exportData({suffix:"before_delete_travel_wish",silent:true});state.travelWishlist=state.travelWishlist.filter(x=>x.id!==id);commit("Wish를 삭제했습니다.")});$("travelWishGrid").querySelectorAll(".travel-wish-convert").forEach(btn=>btn.onclick=()=>convertTravelWish(btn.closest("[data-travel-wish]").dataset.travelWish));$("travelQuickNote").value=state.pageNotes?.travel||""}
function convertTravelWish(id){const w=state.travelWishlist.find(x=>x.id===id);if(!w)return;if(!confirm(`${w.destination} Wish를 완료 여행으로 전환할까요?\n기존 계획 정보는 새 여행 기록에 그대로 유지됩니다.`))return;const t=normalizeTravelTrip({name:w.destination,destination:w.destination,startDate:w.expectedDate||today(),endDate:w.expectedDate||today(),summary:w.reason||w.note,transport:w.transport,lodging:w.lodging,plannedPlaces:w.places,foodPlan:[w.foods,w.restaurants].filter(Boolean).join(" · "),sourceWishId:w.id,itinerary:w.itinerary||[]});state.travelTrips.push(t);state.travelWishlist=state.travelWishlist.filter(x=>x.id!==id);state.ui.travelTab="trips";commit("Wish를 완료 여행으로 전환했습니다.");openTravelTripModal(t)}


// HANI OS v2.9.55 · Wish-list Board v1
function wishlistStatusLabel(v){return {consider:"검토중",planned:"구매/실행 예정",purchased:"완료",hold:"보류"}[v]||"검토중"}
function wishlistPriorityLabel(v){return {high:"높음",medium:"보통",low:"낮음"}[v]||"보통"}
function wishlistKindLabel(v){return v==="experience"?"경험":"ITEM"}
function resetWishlistForm(){if(!$("wishlistEditId"))return;["wishlistEditId","wishlistName","wishlistCategory","wishlistPrice","wishlistReason","wishlistNote","wishlistPurchasedDate"].forEach(id=>$(id).value="");$("wishlistKind").value="item";$("wishlistPriority").value="medium";$("wishlistStatus").value="consider";$("wishlistSourceType").value="manual";$("wishlistSave").textContent="Wish 저장"}
function openWishlistModal(row=null){resetWishlistForm();if(row){$("wishlistEditId").value=row.id;$("wishlistKind").value=row.kind||"item";$("wishlistName").value=row.name||"";$("wishlistCategory").value=row.category||"";$("wishlistPrice").value=row.price??"";$("wishlistPriority").value=row.priority||"medium";$("wishlistStatus").value=row.status||"consider";$("wishlistReason").value=row.reason||"";$("wishlistNote").value=row.note||"";$("wishlistPurchasedDate").value=row.purchasedDate||"";$("wishlistSourceType").value=row.sourceType||"manual";$("wishlistSave").textContent="수정 저장"}openModal("wishlistModal")}
function renderWishlist(){if(!$("wishlistGrid"))return;const all=[...(state.wishlistItems||[])],status=state.ui.wishlistFilter||"all",kind=state.ui.wishlistKindFilter||"all",q=(state.ui.wishlistSearch||"").trim().toLocaleLowerCase("ko-KR"),rows=all.filter(x=>(status==="all"||x.status===status)&&(kind==="all"||x.kind===kind)&&(!q||[x.name,x.category,x.reason,x.note].join(" ").toLocaleLowerCase("ko-KR").includes(q))).sort((a,b)=>({high:0,medium:1,low:2}[a.priority]??1)-({high:0,medium:1,low:2}[b.priority]??1)||String(b.updatedAt||"").localeCompare(String(a.updatedAt||"")));if($("wishlistCount"))$("wishlistCount").textContent=`${all.length}개`;if($("wishlistFilter"))$("wishlistFilter").value=status;if($("wishlistKindFilter"))$("wishlistKindFilter").value=kind;if($("wishlistSearch"))$("wishlistSearch").value=state.ui.wishlistSearch||"";const counts={consider:0,planned:0,purchased:0,hold:0};all.forEach(x=>{if(counts[x.status]!==undefined)counts[x.status]++});[["wishlistKpiAll",all.length],["wishlistKpiConsider",counts.consider],["wishlistKpiPlanned",counts.planned],["wishlistKpiPurchased",counts.purchased]].forEach(([id,v])=>{if($(id))$(id).textContent=String(v)});$("wishlistGrid").innerHTML=rows.length?rows.map(x=>`<article class="wishlist-item-card" data-wish-id="${esc(x.id)}"><div class="wishlist-item-top"><div class="wishlist-item-badges"><span class="wishlist-kind ${esc(x.kind)}">${esc(wishlistKindLabel(x.kind))}</span><span class="wishlist-status ${esc(x.status)}">${esc(wishlistStatusLabel(x.status))}</span><span class="wishlist-priority ${esc(x.priority)}">우선 ${esc(wishlistPriorityLabel(x.priority))}</span></div><div class="wishlist-item-actions"><button class="btn sm" data-wish-edit="${esc(x.id)}">수정</button><button class="btn sm danger" data-wish-delete="${esc(x.id)}">삭제</button></div></div><h4>${esc(x.name||"이름 없는 Wish")}</h4><div class="wishlist-item-meta">${esc(x.category||"기타")}${x.price!==null?` · 예상 ${won(x.price)}`:" · 가격 미정"}${x.sourceType==="conversation"?" · 💬 대화 후보":x.sourceType==="agent"?" · 🤖 AI 검토":""}</div>${x.reason?`<div class="wishlist-reason"><b>왜 갖고 싶은가</b><p>${esc(x.reason)}</p></div>`:""}${x.note?`<div class="wishlist-note">${esc(x.note)}</div>`:""}${x.status==="purchased"&&x.purchasedDate?`<div class="wishlist-complete">완료 ${esc(x.purchasedDate)}</div>`:""}</article>`).join(""):'<div class="empty" style="grid-column:1/-1">아직 Wish가 없습니다. 직접 추가하거나 유나에게 대화를 붙여넣고 후보를 받아보세요.</div>';$("wishlistGrid").querySelectorAll("[data-wish-edit]").forEach(b=>b.onclick=()=>{const x=state.wishlistItems.find(r=>r.id===b.dataset.wishEdit);if(x)openWishlistModal(x)});$("wishlistGrid").querySelectorAll("[data-wish-delete]").forEach(b=>b.onclick=()=>{const x=state.wishlistItems.find(r=>r.id===b.dataset.wishDelete);if(!x||!confirm(`'${x.name}' Wish를 삭제할까요?`))return;state.wishlistItems=state.wishlistItems.filter(r=>r.id!==x.id);commit("Wish-list 항목을 삭제했습니다.")})}
function certificateStatusLabel(v){return v==="pass"?"합격":v==="fail"?"불합격":v==="taken"?"결과 대기":"응시 예정"}
function resetCertificateForm(){if(!$("certificateEditId"))return;["certificateEditId","certificateName","certificateIssuer","certificateGrade","certificateResultDate","certificateScore","certificateResult"].forEach(id=>$(id).value="");$("certificateExamDate").value="";$("certificateStatus").value="planned";$("certificateSave").textContent="자격증 저장"}
function renderCertificates(){if(!$("certificateList"))return;const rows=[...(state.certificates||[])].sort((a,b)=>String(a.examDate||"9999").localeCompare(String(b.examDate||"9999")));$("certificateCount").textContent=`${rows.length}개`;$("certificateList").innerHTML=rows.length?rows.map(c=>`<article class="certificate-card" data-certificate="${esc(c.id)}"><div class="certificate-card-head"><div><h4>${esc(c.name||"이름 없는 자격증")}</h4><div class="certificate-meta">${[c.issuer,c.grade,c.examDate?`시험 ${c.examDate}`:""].filter(Boolean).map(esc).join(" · ")}</div></div><span class="certificate-status ${esc(c.status)}">${certificateStatusLabel(c.status)}</span></div>${(c.result||c.score||c.resultDate)?`<div class="certificate-result"><b>결과</b><br>${[c.resultDate?`발표 ${c.resultDate}`:"",c.score,c.result].filter(Boolean).map(esc).join(" · ")}</div>`:""}<div class="acts"><button class="btn sm certificate-edit" type="button">수정</button><button class="btn sm danger certificate-delete" type="button">삭제</button></div></article>`).join(""):'<div class="empty" style="grid-column:1/-1">등록한 자격증이 없습니다. 시험 일정부터 가볍게 추가해 보세요.</div>';$("certificateList").querySelectorAll(".certificate-edit").forEach(btn=>btn.onclick=()=>{const c=state.certificates.find(x=>x.id===btn.closest("[data-certificate]").dataset.certificate);if(!c)return;$("certificateEditId").value=c.id;$("certificateName").value=c.name;$("certificateIssuer").value=c.issuer;$("certificateGrade").value=c.grade;$("certificateExamDate").value=c.examDate;$("certificateStatus").value=c.status;$("certificateResultDate").value=c.resultDate;$("certificateScore").value=c.score;$("certificateResult").value=c.result;$("certificateSave").textContent="수정 저장";$("certificate").scrollIntoView({behavior:"smooth"})});$("certificateList").querySelectorAll(".certificate-delete").forEach(btn=>btn.onclick=()=>{const id=btn.closest("[data-certificate]").dataset.certificate,c=state.certificates.find(x=>x.id===id);if(!c||!confirm(`'${c.name}' 자격증 기록을 삭제할까요?`))return;state.certificates=state.certificates.filter(x=>x.id!==id);commit("자격증 기록을 삭제했습니다.")})}

function renderNotes(){document.querySelectorAll(".generic").forEach(sec=>{const key=sec.dataset.noteKey;sec.querySelector(".page-note").value=state.pageNotes[key]||"";sec.querySelector(".save-note").onclick=()=>{state.pageNotes[key]=sec.querySelector(".page-note").value;save();toast("메모를 저장했습니다.")}})}

function monthLabelShort(period){const [y,m]=String(period||"").split("-");return m?`${m}월`:String(period||"")}
function homeAmountCompact(v){const x=n(v),abs=Math.abs(x);if(abs>=100000000)return `${x<0?"-":""}${(abs/100000000).toFixed(abs%100000000?1:0)}억원`;if(abs>=10000)return `${x<0?"-":""}${(abs/10000).toFixed(abs>=1000000?0:1)}만원`;return won(x)}
function homeMiniLine(values,color="#7258f5"){
  const nums=(values||[]).map(Number).filter(Number.isFinite);if(!nums.length)return '<svg viewBox="0 0 120 72" preserveAspectRatio="xMidYMid meet"><path d="M4 58H116" stroke="#e9eaf3" stroke-width="1" stroke-dasharray="3 4"/></svg>';
  const w=120,h=72,p=5,base=60,min=Math.min(...nums),max=Math.max(...nums),span=Math.max(1,max-min);const pts=nums.map((v,i)=>[p+(w-p*2)*(nums.length===1?.5:i/(nums.length-1)),base-((v-min)/span)*(base-p*2)]);const line=pts.map((q,i)=>`${i?'L':'M'}${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(' '),area=`M${pts[0][0].toFixed(1)} ${base} ${pts.map(q=>`L${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(' ')} L${pts.at(-1)[0].toFixed(1)} ${base} Z`;const dots=pts.map((q,i)=>`<circle cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="${i===pts.length-1?3.4:1.7}" fill="#fff" stroke="${color}" stroke-width="${i===pts.length-1?2.2:1.3}"/>`).join('');return `<svg viewBox="0 0 120 72" preserveAspectRatio="xMidYMid meet"><path d="M4 ${base}H116" stroke="#e9eaf3" stroke-width="1" stroke-dasharray="3 4"/><path d="${area}" fill="${color}" opacity=".08"/><path d="${line}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>${dots}</svg>`
}
function homeMiniBars(values,color="#ff973f"){
  const nums=(values||[]).map(Number).filter(Number.isFinite),max=Math.max(1,...nums);if(!nums.length)return '<svg viewBox="0 0 120 64" preserveAspectRatio="xMidYMid meet"><path d="M4 52H116" stroke="#e9eaf3" stroke-width="1" stroke-dasharray="3 4"/></svg>';const gap=4,w=(112-gap*(nums.length-1))/nums.length;return `<svg viewBox="0 0 120 64" preserveAspectRatio="xMidYMid meet"><path d="M4 52H116" stroke="#e9eaf3" stroke-width="1" stroke-dasharray="3 4"/>${nums.map((v,i)=>{const bh=Math.max(3,(v/max)*44),x=4+i*(w+gap),y=52-bh;return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${bh.toFixed(1)}" rx="${Math.min(4,w/2).toFixed(1)}" fill="${color}" opacity="${.42+i/(nums.length*1.8)}"/>`}).join('')}</svg>`
}
function lastMonthKeys(count=6){const out=[],d=new Date();d.setDate(1);for(let i=count-1;i>=0;i--){const x=new Date(d.getFullYear(),d.getMonth()-i,1);out.push(`${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}`)}return out}
function renderHomeMiniCharts(){
  const official=officialBrokerSorted().slice(-6);if($("homeAssetMini"))$("homeAssetMini").innerHTML=homeMiniLine(official.map(s=>brokerCalc(s).total),'#7658f6');
  const body=[...(state.body||[])].sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))).slice(-7);if($("homeWeightMini"))$("homeWeightMini").innerHTML=homeMiniLine(body.map(r=>n(r.weight)),'#25bca5');
  const exerciseYear=lifePeriodRows(state.exercise||[],"year").slice(-7);if($("homeExerciseMini"))$("homeExerciseMini").innerHTML=homeMiniBars(exerciseYear.map(r=>n(r.steps)),'#4285f4');
  const months=lastMonthKeys(6),
    bookCounts=months.map(m=>(state.books||[]).filter(b=>b.status==='read'&&completedInMonthByToday(b.readDate||b.completedDate,m)).length),
    movieCounts=months.map(m=>(state.movies||[]).filter(x=>x.status==='watched'&&completedInMonthByToday(x.watchedDate,m)).length);
  if($("homeBooksMini"))$("homeBooksMini").innerHTML=homeMiniBars(bookCounts,'#ff973f');if($("homeMoviesMini"))$("homeMoviesMini").innerHTML=homeMiniBars(movieCounts,'#f45d98')
}
const HOME_DIALOGUES=[
  {agent:"hani",kind:"오늘의 명언",text:"기록은 기억을 이긴다. 오늘 한 줄이 다음 달의 오빠를 도와줘.",chat:[{agent:"sua",text:"그럼 대표님 오늘 할 일부터 한 줄씩 지우시죠."},{agent:"yuna",text:"저… 대학 자료 넣다가 할 일이 많이 늘었는데요… 🥹"},{agent:"hani",text:"유나야 그건 네 잘못 아니다 ㅋㅋ 마감 있는 것부터 간다."}]},
  {agent:"jieun",kind:"지은의 한마디",text:"돈은 많이 버는 날보다, 새는 돈을 막은 날에 더 오래 남아요.",chat:[{agent:"haru",text:"Wish-list에 올리는 건 소비 아니죠? 일단 올려만 둘게요 😇"},{agent:"jieun",text:"올리는 건 무료. 결제 버튼부터 누르는 건 유료입니다."},{agent:"hani",text:"둘 다 맞음. 검토와 구매는 분리 ㅋㅋ"}]},
  {agent:"nauen",kind:"나은의 한마디",text:"꾸준함은 세게 하는 게 아니라 다시 돌아오는 능력이야.",chat:[{agent:"suyeon",text:"한 경기 졌다고 전술 갈아엎지 않는 거랑 비슷하죠."},{agent:"nauen",text:"맞아. 근데 오빠는 운동 한 번 하면 또 100개씩 하려 하잖아 ㅋㅋ"},{agent:"hani",text:"과열 금지. 데이터는 장기 추세로 본다."}]},
  {agent:"hina",kind:"히나의 한마디",text:"継続は力なり. 계속하는 것이 결국 힘이 됩니다.",chat:[{agent:"yuna",text:"히나 대리님, 일본어 숙제도 할 일에 올릴까요?"},{agent:"hina",text:"시험 일정은 정확히. 공부 계획은 오빠가 정한 것만요 ✍️"},{agent:"sua",text:"좋습니다. 일정 추측 금지, 회사 규칙 하나 추가요 ㅋㅋ"}]},
  {agent:"sua",kind:"수아의 업무 한마디",text:"할 일은 머릿속에 두면 걱정이고, 적어두면 일정입니다.",chat:[{agent:"yuna",text:"근데 할 일이 43개면요…?"},{agent:"sua",text:"그건 일정이 아니라 부서 전체 업무량인데?"},{agent:"hani",text:"마감 없는 퀴즈부터 날짜 힌트 붙였으니 진정 ㅋㅋ"}]},
  {agent:"haru",kind:"하루의 생활 한마디",text:"좋아하는 걸 모아두는 것도 삶을 운영하는 방법이야.",chat:[{agent:"jieun",text:"그래서 Wish-list는 찬성입니다."},{agent:"haru",text:"오, 지은 과장님이 먼저 찬성하셨다!"},{agent:"jieun",text:"Wish-list만. 구매라고는 안 했습니다 ^^"}]},
  {agent:"suyeon",kind:"수연의 코치 한마디",text:"전술은 한 경기로 바꾸지 않고, 습관은 한 번 실패했다고 버리지 않습니다.",chat:[{agent:"minji",text:"그럼 영화 한 편 재미없었다고 장르 버리면 안 되겠네요."},{agent:"suyeon",text:"정확합니다. 표본 한 개로 근들갑 금지."},{agent:"hani",text:"우리 회사 데이터 원칙이 생활에도 침투 중 ㅋㅋ"}]},
  {agent:"minji",kind:"민지의 한마디",text:"좋았던 건 기록해두면 추억이 되고, 별로였던 것도 취향 데이터가 돼.",chat:[{agent:"haru",text:"책도 똑같지. 재미없었던 책도 다음 추천에 도움 돼."},{agent:"minji",text:"그러니까 별점 4.9만 주면 데이터가 일을 못 해요 ㅋㅋ"},{agent:"hani",text:"평점 인플레 감사 착수합니다."}]},
  {agent:"yuna",kind:"유나 인턴 보고",text:"오빠, 자료는 던져주세요. 정리는 제가 해볼게요! 🫡",chat:[{agent:"hina",text:"대학자료는 제가 내용 검수할게요."},{agent:"jieun",text:"금융자료는 아직 함부로 저장하면 안 됩니다."},{agent:"yuna",text:"네! 저는 접수만! 인턴 권한 준수합니다!"}]},
  {agent:"hani",kind:"하니의 운영 한마디",text:"속도를 올리는 건 좋지만, 기준선을 잃으면 빨리 틀리는 것뿐이야.",chat:[{agent:"yuna",text:"그럼 빨리 접수하고 천천히 판단하면 되나요?"},{agent:"hani",text:"정답. 인턴이 대표 결재까지 달리지만 않으면 됨 ㅋㅋ"},{agent:"sua",text:"유나 인턴 야근 방지 규정에도 찬성입니다."}]},
  {agent:"jieun",kind:"지은의 재무 한마디",text:"가격표보다 먼저 봐야 하는 건 이번 달 내 지갑의 역할이에요.",chat:[{agent:"haru",text:"그럼 예쁜 건 먼저 Wish-list로 피신시키겠습니다."},{agent:"jieun",text:"아주 훌륭합니다. 결제는 예산회의 이후에요."},{agent:"hani",text:"검토중과 구매완료 사이에는 대표 승인이라는 벽이 있습니다."}]},
  {agent:"nauen",kind:"나은의 생활 코치 한마디",text:"오늘 완벽하게 하는 것보다 내일 또 할 수 있게 끝내는 게 더 강해.",chat:[{agent:"suyeon",text:"지속 가능한 전술이 결국 시즌을 버팁니다."},{agent:"nauen",text:"그러니까 운동으로 밥값 갚겠다는 소리 금지~"},{agent:"hani",text:"나은 대리 오늘도 제동장치 정상."}]},
  {agent:"hina",kind:"히나의 정확한 한마디",text:"모르는 날짜는 비워두는 것도 정확한 기록입니다.",chat:[{agent:"yuna",text:"마감이 없으면 제가 하나 만들어 둘까요?"},{agent:"hina",text:"안 됩니다. 권장 시작일과 실제 마감일은 다른 값이에요."},{agent:"hani",text:"HINA PASS. 추측값을 사실처럼 저장하지 않는다."}]},
  {agent:"sua",kind:"수아의 업무 한마디",text:"급한 일과 중요한 일이 같은 얼굴로 찾아오는 날엔 순서를 적어야 합니다.",chat:[{agent:"yuna",text:"그럼 1번부터 43번까지 번호 붙이면…"},{agent:"sua",text:"유나야 그건 정리가 아니라 숫자 붙인 재난이야."},{agent:"hani",text:"대표님, 우선순위 셋만 고릅시다 ㅋㅋ"}]},
  {agent:"haru",kind:"하루의 생활 한마디",text:"갖고 싶은 건 바로 사지 말고, 일단 이름부터 붙여두자.",chat:[{agent:"haru",text:"Wish-list는 욕망의 주차장입니다 🚗"},{agent:"jieun",text:"장기주차는 무료지만 출차할 땐 예산 확인합니다."},{agent:"minji",text:"이 회사 비유가 점점 이상하게 정확해져요 ㅋㅋ"}]},
  {agent:"suyeon",kind:"수연의 플래너 한마디",text:"좋은 계획은 빈칸이 있는 계획이에요. 쉬는 시간도 일정입니다.",chat:[{agent:"yuna",text:"여행표 빈칸 발견! 채우겠습니다!"},{agent:"suyeon",text:"멈춰 인턴. 그 빈칸은 카페에서 멍때리는 시간입니다."},{agent:"hani",text:"과밀 일정 BLOCKED ㅋㅋ"}]},
  {agent:"minji",kind:"민지의 취향 한마디",text:"재미없었다는 기록도 취향을 더 정확하게 만들어.",chat:[{agent:"minji",text:"별점 3점도 데이터예요. 혼나는 점수 아닙니다."},{agent:"haru",text:"책도 완독 못 했으면 이유를 남겨두면 좋아요."},{agent:"hani",text:"좋은 기록은 자랑보다 다음 판단에 쓸 수 있는 기록."}]},
  {agent:"yuna",kind:"유나 인턴 보고",text:"일단 접수했습니다! 판단까지 제가 하면 인턴이 부장 되는 사고예요.",chat:[{agent:"sua",text:"본인 권한을 정확히 아는 인턴, 아주 좋습니다."},{agent:"yuna",text:"그럼 오늘은 정시퇴근 가능할까요…?"},{agent:"hani",text:"데이터 안 날리면 고려해봄 ㅋㅋ"}]}
];
let homeDialogueIndex=null;
function pickHomeDialogue(force=false){if(!force&&Number.isInteger(homeDialogueIndex)&&HOME_DIALOGUES[homeDialogueIndex])return HOME_DIALOGUES[homeDialogueIndex];let idx=Math.floor(Math.random()*HOME_DIALOGUES.length);if(HOME_DIALOGUES.length>1&&idx===homeDialogueIndex)idx=(idx+1+Math.floor(Math.random()*(HOME_DIALOGUES.length-1)))%HOME_DIALOGUES.length;homeDialogueIndex=idx;return HOME_DIALOGUES[idx]}
function renderHomeDialogue(force=false){if(!$("homeDialogueText"))return;const row=pickHomeDialogue(force),member=teamByKey(row.agent),img=sidebarAgentImages[row.agent]||agentImages[row.agent]||"",avatar=$("homeDialogueAvatar");if(avatar){avatar.style.backgroundImage=img?`url('${img}')`:"";avatar.dataset.agent=row.agent}if($("homeDialogueLabel"))$("homeDialogueLabel").textContent=`AI TEAM · ${row.kind}`;if($("homeDialogueSpeaker"))$("homeDialogueSpeaker").textContent=member?.name||row.agent;if($("homeDialogueText"))$("homeDialogueText").textContent=`“${row.text}”`;const chat=$("homeDialogueChat");if(chat)chat.innerHTML=agentArray(row.chat).map(x=>{const m=teamByKey(x.agent);return `<div class="home-dialogue-line agent-${esc(x.agent)}"><b>${esc(m?.name||x.agent)}</b><span>${esc(x.text)}</span></div>`}).join("");if($("homeDialogueNext"))$("homeDialogueNext").onclick=()=>renderHomeDialogue(true)}
function homeTrendSvg(rows){if(!(rows||[]).length)return "";const values=rows.map(r=>n(r.value)),w=760,h=210,p=18,min=Math.min(...values),max=Math.max(...values),span=Math.max(1,max-min);const pts=values.map((v,i)=>{const x=values.length===1?w*.5:p+(w-p*2)*(i/(values.length-1));const y=values.length===1?h*.48:h-p-((v-min)/span)*(h-p*2);return [x,y]});const guides=[0,1,2,3].map(i=>{const y=p+((h-p*2)/3)*i;return `<line x1="${p}" y1="${y.toFixed(1)}" x2="${w-p}" y2="${y.toFixed(1)}" stroke="#e9edf8" stroke-width="1" />`}).join("");const last=pts.at(-1);if(values.length===1)return `<defs><radialGradient id="homePointGlow"><stop offset="0%" stop-color="#806cf8" stop-opacity=".22"/><stop offset="100%" stop-color="#806cf8" stop-opacity="0"/></radialGradient></defs>${guides}<circle cx="${last[0]}" cy="${last[1]}" r="46" fill="url(#homePointGlow)"/><circle cx="${last[0]}" cy="${last[1]}" r="7" fill="#fff" stroke="#7658f6" stroke-width="4"/><path d="M${last[0]} ${last[1]+10}V182" stroke="#7658f6" stroke-opacity=".24" stroke-width="2"/>`;const line=pts.map((pt,i)=>`${i?"L":"M"}${pt[0].toFixed(1)} ${pt[1].toFixed(1)}`).join(" "),area=`M${pts[0][0].toFixed(1)} ${(h-p).toFixed(1)} ${pts.map(pt=>`L${pt[0].toFixed(1)} ${pt[1].toFixed(1)}`).join(" ")} L${pts.at(-1)[0].toFixed(1)} ${(h-p).toFixed(1)} Z`;return `<defs><linearGradient id="homeTrendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#8b7cff" stop-opacity="0.28"/><stop offset="100%" stop-color="#8b7cff" stop-opacity="0.02"/></linearGradient><linearGradient id="homeTrendLine" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#7a5ff7"/><stop offset="100%" stop-color="#4a8cff"/></linearGradient></defs>${guides}<path d="${area}" fill="url(#homeTrendFill)"/><path d="${line}" fill="none" stroke="url(#homeTrendLine)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="6" fill="#fff" stroke="#7658f6" stroke-width="3.5"/>`}
function homeCalendarHtml(baseDate=today()){const d=new Date(baseDate),y=d.getFullYear(),m=d.getMonth(),monthLabel=`${y}년 ${String(m+1).padStart(2,"0")}월`,first=new Date(y,m,1),last=new Date(y,m+1,0),start=first.getDay();const total=last.getDate(),todayKey=today(),taskDates=new Set((state.tasks||[]).filter(t=>!t.done&&String(t.due||"").startsWith(`${y}-${String(m+1).padStart(2,"0")}`)).map(t=>String(t.due)));const cells=[];for(let i=0;i<start;i++)cells.push('<div class="home-cal-day is-empty"></div>');for(let day=1;day<=total;day++){const key=`${y}-${String(m+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;const cls=['home-cal-day'];if(key===todayKey)cls.push('is-today');if(taskDates.has(key))cls.push('has-task');cells.push(`<div class="${cls.join(' ')}">${day}</div>`)}const week=['일','월','화','수','목','금','토'].map(x=>`<div class="home-cal-weekday">${x}</div>`).join('');return `<div class="home-cal-head"><b>${monthLabel}</b><span>오늘 ${todayKey}</span></div><div class="home-cal-grid">${week}${cells.join('')}</div>`}
function homeKpiHtml(value,unit,decimals=0){const x=n(value),num=decimals?x.toLocaleString("ko-KR",{minimumFractionDigits:decimals,maximumFractionDigits:decimals}):Math.round(x).toLocaleString("ko-KR");return `${num}<span class="kpi-unit">${unit}</span>`}
function renderHome(){renderHomeDialogue();const c=calculate(),official=officialBrokerSorted(),latest=official.at(-1)||null,prev=official.length>1?official.at(-2):null,latestCalc=latest?brokerCalc(latest):null,prevCalc=prev?brokerCalc(prev):null,homeTotal=latestCalc?latestCalc.total:c.total,goal=n(state.goals.investment),rate=goal?homeTotal/goal*100:0;$("homeAsset").innerHTML=homeKpiHtml(homeTotal,"원");$("homeInvestGoal").textContent=goal>=100000000?(goal/100000000).toFixed(goal%100000000?1:0)+"억원":won(goal);$("homeInvestRate").textContent="달성률 "+rate.toFixed(2)+"%";if($("homeTrendTotal"))$("homeTrendTotal").textContent=won(homeTotal);if($("homeLatestPeriod"))$("homeLatestPeriod").textContent=latest?`${latest.period} · ${latest.snapshotDate||''}`:"공식 기록 없음";const change=latestCalc&&prevCalc?latestCalc.total-prevCalc.total:null,changeRate=prevCalc&&prevCalc.total?change/prevCalc.total*100:null;if($("homeTrendChange"))$("homeTrendChange").textContent=change!==null?`${prev.period} 대비 ${change>0?'+':''}${won(change)} · ${changeRate>0?'+':''}${(changeRate||0).toFixed(2)}%`:'첫 공식 투자 기록이 시작되었어요. 다음 달부터 흐름 비교가 가능해요.';const trendRows=official.slice(-6).map(s=>({label:s.period,value:brokerCalc(s).total})),svg=homeTrendSvg(trendRows);if($("homeTrendSvg"))$("homeTrendSvg").innerHTML=svg;if($("homeTrendBadge")){const badge=$("homeTrendBadge");badge.hidden=!latest;badge.textContent=latest?homeAmountCompact(homeTotal):""}if($("homeTrendAxis"))$("homeTrendAxis").innerHTML=trendRows.map(r=>`<span>${esc(monthLabelShort(r.label))}</span>`).join("");if($("homeTrendEmpty")){const empty=$("homeTrendEmpty");empty.style.display=svg?(official.length===1?"flex":"none"):"grid";empty.textContent=latest?'첫 공식 투자 기록이 시작되었어요. 다음 달부터 자산 흐름을 비교할 수 있어요.':'공식 투자 snapshot이 아직 없어요. 월간 기록을 저장하면 흐름을 그릴 수 있어요.'}
  const accounts=latestCalc?latestCalc.accounts.filter(a=>n(a.assets)>0):[];if($("homeMixTotal"))$("homeMixTotal").textContent=homeAmountCompact(homeTotal);if($("homeMixDonut")){const donut=$("homeMixDonut");if(accounts.length&&homeTotal>0){let start=0;const parts=accounts.map(a=>{const pctVal=n(a.assets)/homeTotal*100,end=start+pctVal,color=seriesColor(a.accountId);const piece=`${color} ${start.toFixed(2)}% ${end.toFixed(2)}%`;start=end;return piece});donut.style.background=`conic-gradient(${parts.join(',')})`}else donut.style.background='conic-gradient(#eef0f8 0 100%)'}if($("homeMixLegend"))$("homeMixLegend").innerHTML=accounts.length?accounts.map(a=>{const pctVal=homeTotal?n(a.assets)/homeTotal*100:0;return `<div class="home-legend-row"><i class="series-dot" style="--series-color:${seriesColor(a.accountId)};background:${seriesColor(a.accountId)}"></i><div class="name">${esc(a.accountName)}</div><div class="meta">${pctVal.toFixed(1)}%</div><div class="sub">${esc(homeAmountCompact(a.assets))}</div></div>`}).join(''):'<div class="empty">공식 snapshot을 저장하면 계좌별 자산 비중이 표시됩니다.</div>';
  const currentMonth=today().slice(0,7),todayKey=today(),
    monthTasks=(state.tasks||[]).filter(t=>!t.done&&String(t.due||"").startsWith(currentMonth))
      .sort((a,b)=>String(a.due||"9999-99-99").localeCompare(String(b.due||"9999-99-99"))||String(a.time||"").localeCompare(String(b.time||"")));
  $("homeTasks").textContent=monthTasks.length+"개";
  if($("homeCalendarMini"))$("homeCalendarMini").innerHTML=homeCalendarHtml();
  const taskRows=monthTasks.slice(0,8);
  if($("homeTaskMini"))$("homeTaskMini").innerHTML=taskRows.length?taskRows.map(t=>{
    const due=String(t.due||""),days=due?Math.round((new Date(due+"T00:00:00")-new Date(todayKey+"T00:00:00"))/86400000):null;
    const dday=days===null?"":days===0?"D-DAY":days>0?`D-${days}`:`D+${Math.abs(days)}`;
    return `<div class="home-task-mini-item"><i></i><div><b>${esc(t.text)}</b><div class="sub">${due?esc(due):"마감일 없음"}${t.time?` · ${esc(t.time)}`:""}</div></div><span class="${days!==null&&days<=3?"is-near":""}">${dday}</span></div>`;
  }).join(''):'<div class="empty">이번 달 미완료 할 일이 없습니다. 🎉</div>';

  const updatedThisMonth=x=>String(x?.importedAt||x?.updatedAt||x?.createdAt||"").slice(0,7)===currentMonth,
    assetMonthRecord=officialBrokerSorted().filter(x=>x.status==="confirmed"&&updatedThisMonth(x)).at(-1)||null,
    ledgerMonthRecord=(state.ledgerMonths||[]).filter(x=>((x.items||[]).length>0||String(x.comment||"").trim())&&updatedThisMonth(x)).sort((a,b)=>String(a.importedAt||a.updatedAt).localeCompare(String(b.importedAt||b.updatedAt))).at(-1)||null;
  if($("homeMonthlyCheckMonth"))$("homeMonthlyCheckMonth").textContent=ledgerMonthLabel(currentMonth);
  if($("homeMonthlyUpdateList"))$("homeMonthlyUpdateList").innerHTML=[
    {label:"자산",done:!!assetMonthRecord,go:"investment",meta:assetMonthRecord?`${ledgerMonthLabel(assetMonthRecord.period)} 기록 · ${formatDateTime(assetMonthRecord.updatedAt||assetMonthRecord.createdAt)} 업데이트`:"이번 달 투자·자산 업데이트가 아직 없어요."},
    {label:"가계부",done:!!ledgerMonthRecord,go:"ledger",meta:ledgerMonthRecord?`${ledgerMonthLabel(ledgerMonthRecord.month)} 결산 · ${formatDateTime(ledgerMonthRecord.importedAt||ledgerMonthRecord.updatedAt||ledgerMonthRecord.createdAt)} 업데이트`:"이번 달 가계부 업데이트가 아직 없어요."}
  ].map(x=>`<button class="home-update-item ${x.done?"is-done":"is-wait"}" data-go="${x.go}"><span class="home-update-icon">${x.done?"✓":"!"}</span><div><b>${x.label}</b><p>${esc(x.meta)}</p></div><span class="home-update-status">${x.done?"업데이트 완료":"업데이트 대기"}</span></button>`).join("");
  const acts=[];if(latest&&latestCalc)acts.push({tone:'finance',title:`투자 월간 기록 · ${latest.period}`,sub:`총자산 ${won(latestCalc.total)} · ${latest.snapshotDate||'기록일 미입력'}`});state.body.slice(-1).forEach(r=>acts.push({tone:'mint',title:`다이어트 기록 · ${num(r.weight)}kg`,sub:`${esc(r.date)} · BMI ${r.bmi?num(r.bmi):'-'}`}));state.books.filter(b=>b.status==='read'&&completedByToday(b.readDate||b.completedDate)).slice(-1).forEach(b=>acts.push({tone:'orange',title:`독서 기록 · ${esc(b.title||'제목 없음')}`,sub:`${esc(b.readDate||b.completedDate||'완독일 미입력')} · 평점 ${b.rating?Number(b.rating).toFixed(1):'-'}`}));state.movies.filter(m=>m.status==='watched'&&completedByToday(m.watchedDate)).slice(-1).forEach(m=>acts.push({tone:'pink',title:`시청 기록 · ${esc(m.title||'제목 없음')}`,sub:`${esc(m.watchedDate||'관람일 미입력')} · 평점 ${m.rating?Number(m.rating).toFixed(1):'-'}`}));state.tasks.filter(t=>!t.done).slice(0,2).forEach(t=>acts.push({tone:'mint',title:`할 일 · ${esc(t.text)}`,sub:t.due?esc(t.due):'마감일 없음'}));$("recentActivity").innerHTML=acts.length?acts.slice(0,5).map(a=>`<div class="home-feed-item tone-${a.tone||'finance'}"><div class="home-feed-dot"></div><div><b>${a.title}</b><div class="sub">${a.sub}</div></div></div>`).join(''):'<div class="empty">기록을 시작하면 최근 활동이 표시됩니다.</div>';
  const hm=today().slice(0,7),year=today().slice(0,4),
    bookMonth=(state.books||[]).filter(b=>b.status==="read"&&completedInMonthByToday(b.readDate||b.completedDate,hm)).length,
    movieMonth=(state.movies||[]).filter(m=>m.status==="watched"&&completedInMonthByToday(m.watchedDate,hm)).length,
    allBody=[...(state.body||[])].sort((a,b)=>String(a.date||"").localeCompare(String(b.date||""))),
    lastBody=allBody.at(-1),
    bodyYear=lifePeriodRows(allBody,"year"),
    bodyYearFirst=bodyYear[0],bodyYearLast=bodyYear.at(-1),
    bodyYearDelta=bodyYearFirst&&bodyYearLast?n(bodyYearLast.weight)-n(bodyYearFirst.weight):null,
    exerciseYear=lifePeriodRows(state.exercise||[],"year"),
    exerciseTotal=exerciseYear.reduce((a,r)=>a+n(r.steps),0),
    exerciseStepDays=exerciseYear.filter(r=>n(r.steps)>0),
    exerciseAvg=exerciseStepDays.length?Math.round(exerciseTotal/exerciseStepDays.length):0,
    exerciseStrength=exerciseYear.filter(r=>r.strength).length;
  if($("homeWeight"))$("homeWeight").innerHTML=lastBody?homeKpiHtml(lastBody.weight,"kg",2):"기록 없음";
  if($("homeWeightGoal"))$("homeWeightGoal").textContent=bodyYearDelta===null?`${year}년 기록 없음`:`${year}년 ${bodyYearDelta>0?"+":""}${bodyYearDelta.toFixed(2)}kg · 연간 변화`;
  if($("homeBooks"))$("homeBooks").innerHTML=homeKpiHtml(bookMonth,"권");
  if($("homeMovies"))$("homeMovies").innerHTML=homeKpiHtml(movieMonth,"편");
  if($("homeExerciseLabel"))$("homeExerciseLabel").textContent=`${year}년 운동`;
  if($("homeExerciseSteps"))$("homeExerciseSteps").innerHTML=homeKpiHtml(exerciseTotal,"보");
  if($("homeExerciseAvg"))$("homeExerciseAvg").textContent=exerciseYear.length?`평균 ${exerciseAvg.toLocaleString()}보 · 근력 ${exerciseStrength}일`:`${year}년 기록 없음`;
  renderHomeMiniCharts();renderLifeMarket()}

let activeLifeIndex="hasdaq";
const LIFE_MARKET_BRIEFS={
  strong:["🚀 대호황~~!! 오늘 시장 아주 뜨겁다 오빠","📈 대 풀 롱~~ 오늘은 황소장이다","🔥 상승장 on. 성민 시장 신고가 가보자","🐂 불장이다~~ 그대로 들고 간다","✨ 호재가 시장을 지배 중입니다"],
  bull:["📈 오 좋아요~ 슬슬 우상향 중","🙂 시장 분위기 괜찮은데? 은근 강하다","🟢 오늘은 그래도 호재 우세!","💪 조금씩 좋아지는 중. 계속 간다","🚶 무리 없고 흐름 좋음~"],
  mixed:["↔️ 보합권이네~ 관망도 전략이다","😌 딱히 나쁘진 않은데 확실한 방향성은 없음","🌤️ 오르내림 섞인 혼조장","👀 일단 지켜보자. 시장 눈치 보는 중","🫠 애매하지만 무너지진 않음"],
  bear:["📉 어어... 살짝 밀리는데? 관리가 필요하다","😐 조정장 진입. 속도 조절합시다","🟠 악재 우세. 오늘은 방어가 먼저","🧯 시장 열기 좀 식었네","🥲 조금 흔들리는 장세입니다"],
  sidecar:["🚨 대공황 직전;; 소비·건강·공부 중 하나는 살려야 한다","😵 사이드카 발동! 오빠 이거 점검 들어가자","🟧 시장 급랭. 일단 진정하고 보자","📛 급락 구간 진입. 복구 플랜 필요","🫨 변동성 너무 큰데? 하부장 긴급 브리핑 필요"],
  circuit:["🛑 돔황챠~~!! 오늘 성민 시장 서킷이다","😱 대공황~~!! 이건 긴급 점검 들어가야 함","🚨 서킷브레이커 발동. 오늘은 방어의 날","🧨 시장 붕괴급... 뭐가 무너졌는지 바로 확인","🫠 오빠 지금은 풀롱이 아니라 구조조정이다"]
};
function lifeMonthRows(rows,dateKey,valueFn){const map=new Map();(rows||[]).forEach(r=>{const key=String(r?.[dateKey]||"").slice(0,7);if(!/^\d{4}-\d{2}$/.test(key))return;map.set(key,(map.get(key)||0)+n(valueFn(r)))});return [...map].sort((a,b)=>a[0].localeCompare(b[0])).slice(-6).map(([label,value])=>({label,value}))}
function lifeDirection(rows,{lowerBetter=false}={}){if(rows.length<2)return 0;const d=n(rows.at(-1).value)-n(rows.at(-2).value);return d===0?0:(lowerBetter?-Math.sign(d):Math.sign(d))}
function homeQuizMetrics(){
  const completed=(state.learningQuizzes||[]).filter(x=>x.status==='completed'&&(n(x.total)||(x.questions||[]).length));
  const score=x=>{const total=n(x.total)||(x.questions||[]).length,correct=x.correctCount!=null&&Number.isFinite(Number(x.correctCount))?n(x.correctCount):(x.score!=null&&Number.isFinite(Number(x.score))?total*n(x.score)/100:0);return {total,correct}};
  const totals=completed.reduce((a,x)=>{const b=score(x);return {total:a.total+b.total,correct:a.correct+b.correct}},{total:0,correct:0});
  return {...totals,completed,score,rate:totals.total?Math.round(totals.correct/totals.total*100):null,wrong:Math.max((state.learningWrongAnswers||[]).length,Math.round(totals.total-totals.correct)),pending:(state.learningQuizzes||[]).filter(x=>x.status!=='completed').length};
}
function renderLifeMarket(){
  const currentMonth=today().slice(0,7),official=officialBrokerSorted().slice(-6),assetRows=official.map(s=>({label:s.period,value:brokerCalc(s).total}));
  const bodyRows=(state.body||[]).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date))).slice(-6).map(r=>({label:r.date,value:n(r.weight)}));
  const contentRows=lifeMonthRows([...(state.books||[]).filter(x=>x.status==="read").map(x=>({...x,activityDate:x.readDate||x.completedDate})),...(state.movies||[]).filter(x=>x.status==="watched").map(x=>({...x,activityDate:x.watchedDate}))],"activityDate",()=>1);
  const stepRecords=(state.exercise||[]).filter(x=>n(x.steps)>0),stepRows=lifeMonthRows(stepRecords,"date",r=>r.steps).map(row=>({...row,value:Math.round(row.value/stepRecords.filter(x=>String(x.date).startsWith(row.label)).length)}));
  const ledgerRows=(state.ledgerMonths||[]).slice().sort((a,b)=>a.month.localeCompare(b.month)).slice(-6).map(r=>({label:r.month,value:ledgerCalc(r).jispiT}));
  const quizzes=homeQuizMetrics(),quizMonths=new Map();quizzes.completed.forEach(x=>{const month=String(x.completedAt||x.updatedAt||x.scheduledDate||'').slice(0,7);if(!/^\d{4}-\d{2}$/.test(month))return;const total=quizMonths.get(month)||{total:0,correct:0},score=quizzes.score(x);quizMonths.set(month,{total:total.total+score.total,correct:total.correct+score.correct})});
  const learningRows=[...quizMonths].sort((a,b)=>a[0].localeCompare(b[0])).slice(-6).map(([label,x])=>({label,value:Math.round(x.correct/x.total*100)}));
  const latestLedger=(state.ledgerMonths||[]).slice().sort((a,b)=>a.month.localeCompare(b.month)).at(-1),lc=latestLedger?ledgerCalc(latestLedger):null;
  const data={
    hasdaq:{title:"총 투자자산 흐름",kicker:"HASDAQ · FINANCE",route:"investment",rows:assetRows,value:assetRows.at(-1)?.value||0,valueText:won(assetRows.at(-1)?.value||0),secondary:"계좌별 자산 비중",recent:"투자·자산 최근 기록"},
    ne100:{title:"체중 흐름",kicker:"N&E 100 · HEALTH",route:"diet",rows:bodyRows,value:bodyRows.at(-1)?.value||0,valueText:bodyRows.length?`${num(bodyRows.at(-1).value)}kg`:"기록 없음",secondary:"목표체중 · BMI",recent:"최근 체중 기록"},
    hinaJones:{title:"독서·시청 활동 흐름",kicker:"HINA JONES · CONTENT",route:"reading",rows:contentRows,value:contentRows.at(-1)?.value||0,valueText:`${contentRows.at(-1)?.value||0}건`,secondary:"이번 달 콘텐츠 현황",recent:"최근 독서·시청 기록"},
    harukei:{title:"월별 일평균 걸음수",kicker:"HARUKEI 10K · ACTIVITY",route:"exercise",rows:stepRows,value:stepRows.at(-1)?.value||0,valueText:stepRows.length?`${Math.round(stepRows.at(-1).value).toLocaleString()}보`:'기록 없음',secondary:"10,000보 달성률 · 평균",recent:"최근 활동 기록"},
    jispi:{title:"소비지수 흐름",kicker:"JISPI · SPENDING",route:"ledger",rows:ledgerRows,value:ledgerRows.at(-1)?.value||0,valueText:lc?won(lc.jispiT):"기록 없음",secondary:"고정·변동·특별·금융 구성",recent:"최근 소비·결산 기록"},
    hinkei:{title:"월별 퀴즈 정답률",kicker:"HINKEI 225 · LEARNING",route:"study",rows:learningRows,value:quizzes.rate||0,valueText:quizzes.rate===null?'제출 없음':`${quizzes.rate}%`,secondary:"퀴즈 · 미완료 · 학습 진행",recent:"최근 학습 기록"}
  };
  const directions=[lifeDirection(assetRows),lifeDirection(bodyRows,{lowerBetter:true}),lifeDirection(contentRows),lifeDirection(stepRows),lifeDirection(ledgerRows,{lowerBetter:true}),lifeDirection(learningRows)],good=directions.filter(x=>x>0).length,bad=directions.filter(x=>x<0).length,flat=6-good-bad;
  let key=good===6?"strong":good>=4?"bull":bad>=5?"circuit":bad>=4?"sidecar":bad>good?"bear":"mixed",label={strong:"초강세",bull:"상승 우세",mixed:"혼조",bear:"약세",sidecar:"사이드카",circuit:"서킷브레이커"}[key];
  const phrases=LIFE_MARKET_BRIEFS[key],seed=[...`${today()}|${key}`].reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,7),brief=phrases[seed%phrases.length];
  const moodPhrases=["오늘도 시장은 전쟁이다..!","대 풀 롱...? 하니가 아직 버튼 안 줬는데요?","데이터는 평온한데 대표님 마음만 상한가","오늘도 성민 AI TEAM은 야근 중입니다","시장은 열렸고, 하니는 계산기를 들었다"],mood=moodPhrases[seed%moodPhrases.length];
  if($("lifeMarketState"))$("lifeMarketState").textContent=label;if($("lifeMarketCounts"))$("lifeMarketCounts").innerHTML=`<span class="up">호재 <b>${good}</b></span><span>보합 <b>${flat}</b></span><span class="down">악재 <b>${bad}</b></span>`;if($("lifeMarketBrief"))$("lifeMarketBrief").textContent=brief;if($("lifeMarketFeatured"))$("lifeMarketFeatured").dataset.marketState=key;if($("lifeMarketBanner"))$("lifeMarketBanner").dataset.marketState=key;if($("lifeMarketMood"))$("lifeMarketMood").textContent=mood;
  if($("homeJispi"))$("homeJispi").textContent=data.jispi.valueText;if($("homeJispiMeta"))$("homeJispiMeta").textContent=latestLedger?`${ledgerMonthLabel(latestLedger.month)} · ${ledgerJispiStatus(lc.jispiT,lc.targetT)}`:"월간 소비 결산";if($("homeHinkei"))$("homeHinkei").textContent=data.hinkei.valueText;if($("homeHinkeiMeta"))$("homeHinkeiMeta").textContent=`퀴즈 ${(state.learningQuizzes||[]).length} · 오답 ${(state.learningWrongAnswers||[]).length}`;if($("homeContentMeta"))$("homeContentMeta").textContent=`독서 ${(state.books||[]).filter(x=>String(x.readDate||x.completedDate||"").startsWith(currentMonth)).length} · 시청 ${(state.movies||[]).filter(x=>String(x.watchedDate||"").startsWith(currentMonth)).length}`;
  document.querySelectorAll("[data-life-index]").forEach(btn=>{btn.classList.toggle("is-selected",btn.dataset.lifeIndex===activeLifeIndex);btn.onclick=()=>{activeLifeIndex=btn.dataset.lifeIndex;renderLifeMarket()}});
  const selected=data[activeLifeIndex]||data.hasdaq;if($("homeAnalysisKicker"))$("homeAnalysisKicker").textContent=selected.kicker;if($("homeAnalysisTitle"))$("homeAnalysisTitle").textContent=selected.title;if($("homeAnalysisDetail"))$("homeAnalysisDetail").dataset.go=selected.route;if($("homeSecondaryTitle"))$("homeSecondaryTitle").textContent=selected.secondary;if($("homeRecentTitle"))$("homeRecentTitle").textContent=selected.recent;if($("homeTrendTotal"))$("homeTrendTotal").textContent=selected.valueText;if($("homeTrendSvg"))$("homeTrendSvg").innerHTML=homeTrendSvg(selected.rows);if($("homeTrendAxis"))$("homeTrendAxis").innerHTML=selected.rows.map(r=>`<span>${esc(activeLifeIndex==="ne100"?String(r.label).slice(5).replace("-","."):monthLabelShort(String(r.label).slice(0,7)))}</span>`).join("");if($("homeTrendEmpty")){$("homeTrendEmpty").style.display=selected.rows.length?"none":"grid";$("homeTrendEmpty").textContent=`${selected.title} 기록이 아직 없어요.`}if(activeLifeIndex!=="hasdaq")renderLifeMarketSide(selected,latestLedger,lc);
}
function renderLifeMarketSide(selected,ledger,lc){const rows=selected.rows||[],latest=rows.at(-1),prev=rows.at(-2),delta=latest&&prev?n(latest.value)-n(prev.value):null;if($("homeTrendChange"))$("homeTrendChange").textContent=delta===null?"기록이 쌓이면 최근 흐름을 비교해요.":`직전 기록 대비 ${delta>0?"+":""}${num(delta)}`;if($("homeLatestPeriod"))$("homeLatestPeriod").textContent=latest?.label||"-";if($("homeMixDonut"))$("homeMixDonut").style.background="conic-gradient(#806cf8 0 68%,#edf0f8 68% 100%)";if($("homeMixTotal"))$("homeMixTotal").textContent=selected.valueText;if($("homeMixUnit"))$("homeMixUnit").textContent="현재값";let items=[];if(activeLifeIndex==="ne100"){const b=(state.body||[]).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date))).at(-1),goal=n(state.goals.weight2||state.goals.weight1);items=[["현재 BMI",b?.bmi?num(b.bmi):"-"],["목표까지",b&&goal?`${Math.abs(n(b.weight)-goal).toFixed(1)}kg`:"-"]]}else if(activeLifeIndex==="hinaJones")items=[["이번 달 완독",`${(state.books||[]).filter(x=>String(x.readDate||x.completedDate||"").startsWith(today().slice(0,7))).length}권`],["이번 달 시청",`${(state.movies||[]).filter(x=>String(x.watchedDate||"").startsWith(today().slice(0,7))).length}편`]];else if(activeLifeIndex==="harukei"){const recent=(state.exercise||[]).filter(x=>n(x.steps)>0).slice(-30),avg=recent.length?Math.round(recent.reduce((a,x)=>a+n(x.steps),0)/recent.length):0;items=[["평균 걸음수",`${avg.toLocaleString()}보`],["10,000보 달성",`${recent.filter(x=>n(x.steps)>=10000).length}/${recent.length}일`]]}else if(activeLifeIndex==="jispi"&&lc)items=[["고정비",won(lc.fixed)],["변동비",won(lc.variable)],["특별지출",won(lc.special)],["금융·자산",won(lc.finance)]];else if(activeLifeIndex==="hinkei")items=[["프로젝트",`${(state.learningProjects||[]).length}개`],["퀴즈",`${(state.learningQuizzes||[]).length}개`],["미완료",`${(state.learningQuizzes||[]).filter(x=>x.status!=="completed").length}개`],["오답",`${(state.learningWrongAnswers||[]).length}개`]];if($("homeMixLegend"))$("homeMixLegend").innerHTML=items.map(([a,b])=>`<div class="home-legend-row"><div class="name">${esc(a)}</div><div class="meta">${esc(b)}</div></div>`).join("")||'<div class="empty">현재 데이터에서 계산할 기록이 없습니다.</div>';let recent=[];if(activeLifeIndex==="ne100")recent=(state.body||[]).slice(-5).reverse().map(x=>[`${num(x.weight)}kg`,x.date]);else if(activeLifeIndex==="hinaJones")recent=[...(state.books||[]).map(x=>[x.title,x.readDate||x.completedDate]),...(state.movies||[]).map(x=>[x.title,x.watchedDate])].filter(x=>x[1]).sort((a,b)=>String(b[1]).localeCompare(String(a[1]))).slice(0,5);else if(activeLifeIndex==="harukei")recent=(state.exercise||[]).slice(-5).reverse().map(x=>[`${n(x.steps).toLocaleString()}보`,x.date]);else if(activeLifeIndex==="jispi")recent=(state.ledgerMonths||[]).slice().sort((a,b)=>b.month.localeCompare(a.month)).slice(0,5).map(x=>[`${ledgerMonthLabel(x.month)} 결산`,formatDateTime(x.importedAt||x.updatedAt)]);else if(activeLifeIndex==="hinkei")recent=(state.learningQuizzes||[]).slice().sort((a,b)=>String(b.updatedAt||b.scheduledDate).localeCompare(String(a.updatedAt||a.scheduledDate))).slice(0,5).map(x=>[x.title||"학습 퀴즈",String(x.updatedAt||x.scheduledDate).slice(0,10)]);if($("recentActivity"))$("recentActivity").innerHTML=recent.length?recent.map(x=>`<div class="home-feed-item tone-finance"><div class="home-feed-dot"></div><div><b>${esc(x[0]||"기록")}</b><div class="sub">${esc(x[1]||"")}</div></div></div>`).join(""):'<div class="empty">최근 기록이 없습니다.</div>'}


function cloudLoadJson(key,fallback={}){
  try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):fallback}catch(e){console.warn("Cloud local config read failed",e);return fallback}
}
function cloudSaveJson(key,value){
  try{localStorage.setItem(key,JSON.stringify(value));return true}catch(e){console.error("Cloud local config save failed",e);return false}
}
function cloudConfig(){
  const c=cloudLoadJson(CLOUD_CONFIG_KEY,{});
  return {
    url:String(c.url||DEFAULT_CLOUD_URL||"").trim().replace(/\/+$/,""),
    key:String(c.key||DEFAULT_CLOUD_PUBLISHABLE_KEY||"").trim(),
    email:String(c.email||"").trim()
  };
}
function cloudMeta(){return cloudLoadJson(CLOUD_META_KEY,{})}
function cloudSetRuntime(status,message,tone="warn",extra={}){
  cloudRuntime={...cloudRuntime,...extra,status,message,tone};
  renderCloudPanel();
}
function cloudValidateUrl(url){
  let u;try{u=new URL(url)}catch(e){throw new Error("Project URL 형식을 확인해 주세요.")}
  if(u.protocol!=="https:")throw new Error("Project URL은 https:// 주소여야 합니다.");
  return u.origin;
}
function cloudDecodeJwtRole(key){
  try{
    const parts=key.split(".");
    if(parts.length!==3)return "";
    const body=parts[1].replace(/-/g,"+").replace(/_/g,"/");
    const padded=body+"=".repeat((4-body.length%4)%4);
    return JSON.parse(atob(padded)).role||"";
  }catch(e){return ""}
}
function cloudValidateBrowserKey(key){
  if(!key)throw new Error("Publishable key를 입력해 주세요.");
  if(/^sb_secret_/i.test(key)||/service[_-]?role/i.test(key)||cloudDecodeJwtRole(key)==="service_role"){
    throw new Error("Secret / service_role key는 브라우저에 사용할 수 없습니다. Publishable key를 사용해 주세요.");
  }
  return key;
}
function cloudReadFormConfig(){
  const url=cloudValidateUrl($("cloudProjectUrl").value.trim());
  const key=cloudValidateBrowserKey($("cloudPublishableKey").value.trim());
  const email=$("cloudEmail").value.trim();
  return {url,key,email};
}
function cloudCreateClient(config){
  if(!window.supabase?.createClient)throw new Error("Supabase JS를 불러오지 못했습니다. 인터넷 연결을 확인해 주세요.");
  try{cloudAuthSubscription?.unsubscribe?.()}catch(e){}
  cloudAuthSubscription=null;
  cloudClient=window.supabase.createClient(config.url,config.key,{
    auth:{persistSession:true,storage:window.localStorage,autoRefreshToken:true,detectSessionInUrl:true,flowType:"implicit"}
  });
  cloudBindAuthEvents();
  return cloudClient;
}

function cloudAuthUrlInfo(){
  try{
    const url=new URL(location.href),query=url.searchParams,hash=new URLSearchParams(String(url.hash||"").replace(/^#/,""));
    const current={
      type:hash.get("type")||query.get("type")||"",
      code:query.get("code")||"",
      flowId:query.get("sb_flow_id")||"",
      error:hash.get("error_description")||query.get("error_description")||hash.get("error")||query.get("error")||"",
      errorCode:hash.get("error_code")||query.get("error_code")||"",
      hasAccessToken:!!hash.get("access_token"),
      hasRefreshToken:!!hash.get("refresh_token")
    };
    return {
      type:current.type||CLOUD_AUTH_BOOT.type||"",
      code:current.code||CLOUD_AUTH_BOOT.code||"",
      flowId:current.flowId||CLOUD_AUTH_BOOT.flowId||"",
      error:current.error||CLOUD_AUTH_BOOT.error||"",
      errorCode:current.errorCode||CLOUD_AUTH_BOOT.errorCode||"",
      hasAccessToken:current.hasAccessToken||CLOUD_AUTH_BOOT.hasAccessToken,
      hasRefreshToken:current.hasRefreshToken||CLOUD_AUTH_BOOT.hasRefreshToken,
      hasAuthCallback:!!(CLOUD_AUTH_BOOT.hasAuthCallback||current.type||current.code||current.error||current.hasAccessToken||current.hasRefreshToken)
    };
  }catch(e){return {...CLOUD_AUTH_BOOT}}
}
function cloudUrlLooksRecovery(){
  const info=cloudAuthUrlInfo();
  return info.type==="recovery" || /recover|password/i.test(info.type||"") || (!!info.hasAuthCallback && (!!info.hasAccessToken || !!info.code));
}
function cloudHasAuthCallback(){return !!cloudAuthUrlInfo().hasAuthCallback}
function cloudNavigateToRecovery(){
  try{
    showView("settings");
    setTimeout(()=>$("cloudBridgeCard")?.scrollIntoView({behavior:"smooth",block:"start"}),80);
  }catch(e){console.warn("Recovery navigation failed",e)}
}
function cloudCleanAuthUrl(){
  try{
    const url=new URL(location.href);
    ["code","type","token_hash","error","error_code","error_description"].forEach(k=>url.searchParams.delete(k));
    url.hash="";
    history.replaceState({},document.title,url.pathname+(url.searchParams.toString()?`?${url.searchParams.toString()}`:""));
  }catch(e){console.warn("Auth URL cleanup failed",e)}
}
function cloudEnterRecoveryMode(session=null,message="복구 링크가 확인되었습니다. 새 비밀번호를 입력해 주세요."){
  cloudRecoveryMode=true;
  cloudAutoSyncReady=false;
  if(session?.user)cloudUser=session.user;
  cloudSetRuntime("비밀번호 재설정",message,"warn",{sync:"PAUSE"});
}
function cloudExitRecoveryMode({clearUrl=true}={}){
  cloudRecoveryMode=false;
  if(clearUrl)cloudCleanAuthUrl();
  renderCloudPanel();
}
function cloudBindAuthEvents(){
  if(!cloudClient)return;
  try{cloudAuthSubscription?.unsubscribe?.()}catch(e){}
  const {data}=cloudClient.auth.onAuthStateChange((event,session)=>{
    if(event==="PASSWORD_RECOVERY"){
      cloudEnterRecoveryMode(session);
      setTimeout(cloudNavigateToRecovery,0);
    }
  });
  cloudAuthSubscription=data?.subscription||null;
}
async function cloudSaveNewPassword(){
  if(!cloudClient)return cloudSetRuntime("재설정 오류","Cloud 연결을 다시 확인해 주세요.","error");
  const pw=$("cloudNewPassword")?.value||"";
  const confirmPw=$("cloudNewPasswordConfirm")?.value||"";
  if(pw.length<8)return cloudSetRuntime("비밀번호 확인","새 비밀번호는 8자 이상으로 입력해 주세요.","warn",{sync:"PAUSE"});
  if(pw!==confirmPw)return cloudSetRuntime("비밀번호 확인","새 비밀번호와 확인 값이 서로 다릅니다.","warn",{sync:"PAUSE"});
  try{
    const {data:sessionData,error:sessionError}=await cloudClient.auth.getSession();
    if(sessionError)throw sessionError;
    if(!sessionData?.session)throw new Error("비밀번호 재설정 세션이 없습니다. 최신 복구 메일의 링크를 다시 열어 주세요.");

    cloudSetRuntime("변경 중","새 비밀번호를 안전하게 저장하고 있습니다.","warn",{sync:"PAUSE"});
    const {data,error}=await cloudClient.auth.updateUser({password:pw});
    if(error)throw error;

    if($("cloudNewPassword"))$("cloudNewPassword").value="";
    if($("cloudNewPasswordConfirm"))$("cloudNewPasswordConfirm").value="";
    cloudUser=data?.user||sessionData.session.user||cloudUser;
    cloudRecoveryMode=false;
    cloudCleanAuthUrl();

    cloudSetRuntime("비밀번호 변경 완료","새 비밀번호가 저장되었습니다. Cloud 동기화를 다시 확인합니다.","ok",{sync:"CHECK"});
    await cloudFetchMeta({silent:true});
    cloudBindLifecycle();
    await cloudSyncCycle("password-recovery");
    toast("HANI OS 비밀번호를 변경했습니다.");
  }catch(e){
    console.error("Cloud password recovery",e);
    cloudRecoveryMode=true;
    cloudSetRuntime("재설정 실패",e?.message||"비밀번호 변경에 실패했습니다.","error",{sync:"PAUSE"});
  }
}
async function cloudCancelRecovery(){
  clearLoginGateSession();
  try{if(cloudClient)await cloudClient.auth.signOut()}catch(e){console.warn(e)}
  cloudUser=null;
  cloudRecoveryMode=false;
  cloudCleanAuthUrl();
  cloudSetRuntime("로그인 필요","비밀번호 재설정을 취소했습니다. HANI OS 계정으로 로그인해 주세요.","warn",{sync:"OFF"});
}

function cloudCanonical(value){
  if(Array.isArray(value))return value.map(cloudCanonical);
  if(value&&typeof value==="object"){
    return Object.keys(value).sort().reduce((acc,key)=>{acc[key]=cloudCanonical(value[key]);return acc},{});
  }
  return value;
}
function cloudSame(a,b){return JSON.stringify(cloudCanonical(a))===JSON.stringify(cloudCanonical(b))}
function cloudDeviceLabel(){
  const platform=navigator.userAgentData?.platform||navigator.platform||"Browser";
  return (`HANI OS R${CLOUD_SYNC_ENGINE} · v2.9.76 · ${platform}`).slice(0,120);
}
function cloudRecordCount(d=state){
  return (d.transactions?.length||0)+(d.investmentMonthlySnapshots?.length||0)+(d.investmentBrokerSnapshots?.length||0)+(d.investmentCashFlows?.length||0)+(d.investmentJournal?.length||0)+(d.body?.length||0)+(d.exercise?.length||0)+(d.books?.length||0)+(d.movies?.length||0)+(d.diaries?.length||0)+(d.tasks?.length||0)+(d.campusSemesters?.length||0)+(d.travelTrips?.length||0)+(d.travelWishlist?.length||0)+(d.certificates?.length||0)+(d.wishlistItems?.length||0)+(d.learningProjects?.length||0)+(d.learningQuizzes?.length||0)+(d.learningWrongAnswers?.length||0);
}

function cloudComparableState(value){
  try{
    const out=structuredClone(value&&typeof value==="object"?value:{});
    if(out&&typeof out==="object"){
      delete out._haniBackup;delete out.exportedAt;delete out.data;
    }
    return out;
  }catch(e){return value&&typeof value==="object"?value:{}}
}
// v2.9.12: conflict detection tracks durable user data; revision is authoritative.
// UI state, save timestamps and app-version labels differ naturally by device
// and must not create a false "both sides changed" conflict.
function cloudSyncFingerprintState(value){
  const normalized=cloudComparableState(value);
  if(!normalized||typeof normalized!=="object")return normalized;
  const clean=structuredClone(normalized);
  delete clean.ui;
  delete clean.meta;
  delete clean.version;
  return clean;
}
function cloudHasMeaningfulLocalData(value=state){
  const d=value||{};
  const arrays=[
    "instruments","transactions","snapshots","investmentMonthlySnapshots",
    "investmentBrokerSnapshots","investmentCashFlows","investmentJournal",
    "investmentWatchlist","body","exercise","cardio","strength","books",
    "movies","diaries","tasks","ledgerMonths","spendReviews","campusSemesters","travelTrips","travelWishlist","certificates","wishlistItems","learningProjects","learningQuizzes","learningWrongAnswers"
  ];
  if(arrays.some(k=>Array.isArray(d[k])&&d[k].length>0))return true;
  if(String(d.calendarUrl||"").trim())return true;
  if(d.pageNotes&&Object.values(d.pageNotes).some(v=>String(v||"").trim()))return true;

  const base=freshState();
  if(!cloudSame(d.accounts||[],base.accounts||[]))return true;
  if(!cloudSame(d.goals||{},base.goals||{}))return true;
  if(!cloudSame(d.profile||{},base.profile||{}))return true;
  return false;
}
function cloudLocalStatusLabel(){
  return cloudHasMeaningfulLocalData(state)?"기존 데이터 있음":"복원 가능";
}
function cloudSummaryText(value){
  const d=value||{},latest=cloudEmergencyLatestBroker(d),total=cloudEmergencyBrokerTotal(latest);
  const invest=total===null?"투자 -":`투자 ${won(total)}`;
  return `기록 ${cloudRecordCount(d)}건 · ${invest} · 책 ${(d.books||[]).length} · 시청 ${(d.movies||[]).length} · 체중 ${(d.body||[]).length}`;
}
function cloudMediaSignature(type,row){
  if(type==="books")return [String(row?.title||"").trim().toLowerCase(),String(row?.author||"").trim().toLowerCase()].join("|");
  return [String(row?.title||"").trim().toLowerCase(),String(row?.director||"").trim().toLowerCase(),String(row?.watchedDate||"")].join("|");
}
function cloudMergeProtectedMedia(target,source){
  const out=structuredClone(target||{}),src=source||{};
  [["books","cover"],["movies","poster"]].forEach(([type,key])=>{
    const oldRows=Array.isArray(src[type])?src[type]:[],newRows=Array.isArray(out[type])?out[type]:[];
    const byId=new Map(oldRows.filter(x=>x?.id).map(x=>[x.id,x]));
    const bySig=new Map(oldRows.map(x=>[cloudMediaSignature(type,x),x]));
    out[type]=newRows.map(row=>{
      if(row?.[key])return row;
      const old=(row?.id&&byId.get(row.id))||bySig.get(cloudMediaSignature(type,row));
      return old?.[key]?{...row,[key]:old[key]}:row;
    });
  });
  return out;
}
function cloudSaveSafetySnapshot(reason,value=state){
  const payload={savedAt:new Date().toISOString(),reason:String(reason||"cloud-sync"),storageKey:STORAGE_KEY,state:structuredClone(value||{})};
  let previous=null;
  try{previous=localStorage.getItem(CLOUD_SAFETY_KEY)}catch(e){}
  try{
    const serialized=JSON.stringify(payload);
    localStorage.setItem(CLOUD_SAFETY_KEY,serialized);
    if(localStorage.getItem(CLOUD_SAFETY_KEY)!==serialized)throw new Error("safety snapshot read-back mismatch");
    return true;
  }catch(e){
    console.error("Cloud safety snapshot",e);
    try{if(previous===null)localStorage.removeItem(CLOUD_SAFETY_KEY);else localStorage.setItem(CLOUD_SAFETY_KEY,previous)}catch(_){}
    return false;
  }
}

function cloudEmergencyResolved(){try{return localStorage.getItem(CLOUD_EMERGENCY_RESOLVED_KEY)==="1"}catch(e){return false}}
function cloudEmergencyMarkResolved(){try{localStorage.setItem(CLOUD_EMERGENCY_RESOLVED_KEY,"1");return true}catch(e){console.warn("Emergency resolved marker",e);return false}}
function cloudEmergencyLoadSnapshot(){
  try{
    const raw=localStorage.getItem(CLOUD_SAFETY_KEY);if(!raw)return null;
    const parsed=JSON.parse(raw);if(!parsed||typeof parsed!=="object"||!parsed.state||typeof parsed.state!=="object")return null;
    return parsed;
  }catch(e){console.error("Emergency snapshot read",e);return null}
}
function cloudEmergencySaveInternal(key,reason,value){
  try{
    const payload={savedAt:new Date().toISOString(),reason:String(reason||"emergency"),storageKey:STORAGE_KEY,state:structuredClone(value||{})};
    const serialized=JSON.stringify(payload);localStorage.setItem(key,serialized);
    if(localStorage.getItem(key)!==serialized)throw new Error("긴급 보호본 read-back 값이 일치하지 않습니다.");
    return true;
  }catch(e){console.error("Emergency internal snapshot",e);return false}
}
function cloudEmergencyLatestBroker(stateLike){
  const rows=[...(stateLike?.investmentBrokerSnapshots||[])].filter(s=>s?.mode==="actual"&&s?.status==="confirmed").sort((a,b)=>(a.period||"").localeCompare(b.period||"")||(a.updatedAt||"").localeCompare(b.updatedAt||""));
  return rows.at(-1)||null;
}
function cloudEmergencyBrokerTotal(snapshot){
  if(!snapshot)return null;
  return (snapshot.accounts||[]).filter(a=>a?.enabled!==false).reduce((sum,a)=>{
    if(a?.estimatedAssets!==null&&a?.estimatedAssets!==undefined)return sum+n(a.estimatedAssets);
    if(a?.totalEvaluation!==null&&a?.totalEvaluation!==undefined)return sum+n(a.totalEvaluation);
    const evaluation=(a?.holdings||[]).reduce((s,h)=>{
      if(h?.evaluationAmount!==null&&h?.evaluationAmount!==undefined)return s+n(h.evaluationAmount);
      if(h?.quantity!==null&&h?.quantity!==undefined&&h?.currentPrice!==null&&h?.currentPrice!==undefined)return s+n(h.quantity)*n(h.currentPrice);
      return s;
    },0);
    return sum+evaluation;
  },0);
}
function cloudEmergencyInvestmentSummary(stateLike){
  if(!stateLike||typeof stateLike!=="object")return "데이터 없음";
  const latest=cloudEmergencyLatestBroker(stateLike),total=cloudEmergencyBrokerTotal(latest);
  const period=latest?.period||"월간 확정본 없음";
  const value=total===null?"-":won(total);
  return `${period} · ${value} · 계좌 ${(stateLike.accounts||[]).length} · 종목 ${(stateLike.instruments||[]).length} · 거래 ${(stateLike.transactions||[]).length} · 월간 ${(stateLike.investmentBrokerSnapshots||[]).length}`;
}
function cloudEmergencyRestoreCandidate(current,snapshotState){
  const merged=structuredClone(current||{}),src=snapshotState||{};
  ["accounts","instruments","transactions","snapshots","investmentMonthlySnapshots","investmentBrokerSnapshots","investmentCashFlows","investmentJournal","investmentWatchlist"].forEach(key=>{
    if(Array.isArray(src[key]))merged[key]=structuredClone(src[key]);
  });
  merged.goals={...(merged.goals||{})};
  if(src.goals&&src.goals.investment!==undefined)merged.goals.investment=src.goals.investment;
  merged.pageNotes={...(merged.pageNotes||{})};
  if(src.pageNotes&&src.pageNotes.investment!==undefined)merged.pageNotes.investment=src.pageNotes.investment;
  // Current non-investment data, media, health, books, movies, campus and travel stay untouched.
  return normalizeState(merged);
}
function renderEmergencyRecoveryPanel(){
  const panel=$("cloudEmergencyPanel");if(!panel)return;
  const snap=cloudEmergencyLoadSnapshot(),snapState=snap?.state||null,resolved=cloudEmergencyResolved(),restored=(()=>{try{return localStorage.getItem(CLOUD_EMERGENCY_RESTORED_KEY)==="1"}catch(e){return false}})();
  if($("cloudEmergencyBadge"))$("cloudEmergencyBadge").textContent=resolved?"복구 확정됨":snap?"스냅샷 발견":"스냅샷 없음";
  if($("cloudEmergencyCurrent"))$("cloudEmergencyCurrent").textContent=cloudEmergencyInvestmentSummary(state);
  if($("cloudEmergencySnapshot"))$("cloudEmergencySnapshot").textContent=snapState?cloudEmergencyInvestmentSummary(snapState):"안전 스냅샷을 찾지 못했습니다.";
  if($("cloudEmergencySavedAt"))$("cloudEmergencySavedAt").textContent=snap?.savedAt?formatDateTime(snap.savedAt):"-";
  if($("cloudEmergencyReason"))$("cloudEmergencyReason").textContent=snap?.reason||"-";
  if($("cloudEmergencyRestoreInvestment"))$("cloudEmergencyRestoreInvestment").disabled=!snapState||resolved;
  if($("cloudEmergencyDownload"))$("cloudEmergencyDownload").disabled=!snap;
  if($("cloudEmergencyUndo")){let hasPre=false;try{hasPre=!!localStorage.getItem(CLOUD_EMERGENCY_PRE_RESTORE_KEY)}catch(e){}$("cloudEmergencyUndo").disabled=!hasPre||resolved}
  if($("cloudEmergencyPromote"))$("cloudEmergencyPromote").disabled=!cloudUser||!restored||resolved;
  if($("cloudEmergencyMessage")){
    $("cloudEmergencyMessage").textContent=resolved?"긴급 복구가 Cloud 기준본까지 확정되었습니다. 이 기기는 정상 자동 동기화 모드로 전환됩니다.":restored?"투자·자산 Local 복원은 완료됐지만 Cloud에는 아직 반영하지 않았습니다. 투자 화면의 값이 맞는지 확인한 뒤 '확정' 버튼을 눌러 주세요.":snap?"안전 스냅샷이 있습니다. 현재 값과 스냅샷 값을 비교한 뒤 투자·자산만 Local에 복원할 수 있습니다.":"이 브라우저에는 v2.9.12 안전 스냅샷이 없습니다. 다른 기기에서 복구를 진행하거나 현재 상태를 유지해 주세요.";
  }
}
function cloudEmergencyDownloadSnapshot(){
  const snap=cloudEmergencyLoadSnapshot();if(!snap)return alert("이 브라우저에서 안전 스냅샷을 찾지 못했습니다.");
  const serialized=JSON.stringify(snap,null,2);downloadJson(serialized,`HANI_OS_emergency_safety_${today()}.json`);
  toast("안전 스냅샷 JSON을 저장했습니다.");
}
function cloudEmergencyUndoLocal(){
  try{
    const raw=localStorage.getItem(CLOUD_EMERGENCY_PRE_RESTORE_KEY);if(!raw)return alert("복원 직전 Local 보호본이 없습니다.");
    const payload=JSON.parse(raw);if(!payload?.state)throw new Error("복원 직전 Local 보호본 형식이 올바르지 않습니다.");
    if(!confirm("투자·자산 복원 직전의 Local 전체 상태로 되돌릴까요?\nCloud에는 아무 변경도 하지 않습니다."))return;
    const candidate=normalizeState(structuredClone(payload.state)),serialized=JSON.stringify(candidate);localStorage.setItem(STORAGE_KEY,serialized);
    if(localStorage.getItem(STORAGE_KEY)!==serialized)throw new Error("되돌리기 후 read-back 값이 일치하지 않습니다.");
    state=candidate;brokerDraft=null;localStorage.removeItem(CLOUD_EMERGENCY_RESTORED_KEY);renderAll();renderEmergencyRecoveryPanel();
    cloudAutoSyncReady=false;cloudSetRuntime("긴급 복구 되돌림","복원 직전 Local 상태로 되돌렸습니다. Cloud에는 반영하지 않았습니다.","warn",{sync:"HOLD",localSummary:cloudSummaryText(state)});
    toast("복원 직전 Local 상태로 되돌렸습니다.");
  }catch(e){console.error("Emergency undo",e);alert("되돌리기에 실패했습니다.\n"+(e?.message||"오류 내용을 확인해 주세요."))}
}
function cloudEmergencyRestoreInvestment(){
  const snap=cloudEmergencyLoadSnapshot();if(!snap?.state)return alert("복원할 안전 스냅샷이 없습니다.");
  if(cloudEmergencyResolved())return alert("이 브라우저의 긴급 복구는 이미 확정되었습니다.");
  const before=cloudEmergencyInvestmentSummary(state),after=cloudEmergencyInvestmentSummary(snap.state);
  if(!confirm(`투자·자산 데이터만 안전 스냅샷에서 복원할까요?\n\n현재: ${before}\n스냅샷: ${after}\n\n책·시청 아카이브·건강·대학·여행 등 현재 데이터는 유지됩니다.\nCloud에는 아직 반영하지 않습니다.`))return;
  cloudAutoSyncReady=false;if(cloudPollTimer){clearInterval(cloudPollTimer);cloudPollTimer=null}
  if(!cloudEmergencySaveInternal(CLOUD_EMERGENCY_PRE_RESTORE_KEY,"before_investment_emergency_restore",state))return alert("복원 직전 현재 Local 보호본을 만들지 못해 중단했습니다.");
  const previousRaw=localStorage.getItem(STORAGE_KEY),previousState=structuredClone(state);
  try{
    const candidate=cloudEmergencyRestoreCandidate(state,snap.state),serialized=JSON.stringify(candidate);
    localStorage.setItem(STORAGE_KEY,serialized);
    const verified=localStorage.getItem(STORAGE_KEY);if(verified!==serialized)throw new Error("복원 후 localStorage read-back 값이 일치하지 않습니다.");
    state=JSON.parse(verified);brokerDraft=null;lastLoadError="";lastSaveResult={ok:true,bytes:serializedBytes(serialized),message:"긴급 안전 스냅샷에서 투자·자산 데이터만 Local에 복원했습니다."};
    localStorage.setItem(CLOUD_EMERGENCY_RESTORED_KEY,"1");
    renderAll();renderEmergencyRecoveryPanel();
    cloudSetRuntime("긴급 복구 확인 필요","투자·자산 Local 복원이 완료되었습니다. 화면을 확인하기 전에는 Cloud에 쓰지 않습니다.","warn",{sync:"HOLD",localSummary:cloudSummaryText(state)});
    alert("투자·자산 Local 복원이 완료됐습니다.\n\n지금 투자/자산 화면에서 값이 맞는지 먼저 확인해 주세요.\n맞다면 설정으로 돌아와 '확인한 Local을 Cloud 기준으로 확정'을 눌러 주세요.");
  }catch(e){
    try{if(previousRaw===null)localStorage.removeItem(STORAGE_KEY);else localStorage.setItem(STORAGE_KEY,previousRaw)}catch(_){}
    state=previousState;renderAll();console.error("Emergency investment restore",e);alert("긴급 복원에 실패했습니다. 기존 Local 상태를 유지합니다.\n"+(e?.message||"오류 내용을 확인해 주세요."));
  }
}
async function cloudEmergencyPromoteLocalToCloud(){
  if(!cloudClient||!cloudUser)return alert("Cloud 로그인을 확인해 주세요.");
  if(cloudEmergencyResolved())return alert("이미 Cloud 기준본 확정이 완료되었습니다.");
  let restored=false;try{restored=localStorage.getItem(CLOUD_EMERGENCY_RESTORED_KEY)==="1"}catch(e){}
  if(!restored)return alert("먼저 안전 스냅샷에서 투자·자산 Local 복원을 완료해 주세요.");
  try{
    const remote=await cloudReadRow();if(!remote?.state)throw new Error("Cloud 기준 state를 읽지 못했습니다.");
    const localState=cloudComparableState(state),localHash=await cloudStateHash(localState);
    const localSummary=cloudEmergencyInvestmentSummary(state),remoteSummary=cloudEmergencyInvestmentSummary(remote.state);
    if(!confirm(`현재 확인한 Local을 Cloud 기준본으로 확정할까요?\n\nLocal: ${localSummary}\n현재 Cloud: ${remoteSummary}\nCloud revision: ${remote.revision}\n\nrevision 조건부 UPDATE로 다른 기기의 동시 변경은 덮지 않습니다.`))return;
    if(!cloudEmergencySaveInternal(CLOUD_EMERGENCY_PRE_RESTORE_KEY+"_before_push","before_emergency_cloud_promote",state))throw new Error("Cloud 확정 전 Local 보호본을 만들지 못했습니다.");
    const written=await cloudPushLocalRow(remote,localState,localHash);
    cloudEmergencyMarkResolved();cloudAutoSyncReady=true;cloudStartPolling();renderEmergencyRecoveryPanel();
    cloudSetRuntime("긴급 복구 완료",`복원한 Local을 Cloud revision ${written.revision} 기준본으로 확정했습니다. 자동 동기화를 다시 시작합니다.`,"ok",{sync:"ON",revision:written.revision,updatedAt:written.updated_at,localSummary:cloudSummaryText(state),remoteSummary:cloudSummaryText(written.state)});
    toast("긴급 복구와 Cloud 기준본 확정을 완료했습니다.");
  }catch(e){console.error("Emergency Cloud promote",e);cloudAutoSyncReady=false;cloudSetRuntime("긴급 복구 확정 실패",e?.message||"Cloud 기준본 확정에 실패했습니다.","error",{sync:"HOLD"});alert("Cloud 기준본 확정에 실패했습니다. Local 복원값은 그대로 유지됩니다.\n"+(e?.message||"오류 내용을 확인해 주세요."))}
}

async function cloudStateHash(value){
  const text=JSON.stringify(cloudCanonical(cloudSyncFingerprintState(value)));
  try{
    if(crypto?.subtle){
      const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(text));
      return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,"0")).join("");
    }
  }catch(e){console.warn("SHA-256 unavailable",e)}
  let h=2166136261;
  for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}
  return "fnv-"+(h>>>0).toString(16).padStart(8,"0");
}
function cloudSaveSyncMeta(remote,hash,extra={}){
  const prev=cloudMeta();
  const meta={
    ...prev,
    revision:remote?.revision??null,
    appliedRevision:extra.appliedRevision??remote?.revision??prev.appliedRevision??null,
    updatedAt:remote?.updated_at||"",
    device:remote?.device||"",
    syncEngine:CLOUD_SYNC_ENGINE,
    hashSchema:CLOUD_HASH_SCHEMA,
    lastSyncedHash:hash||"",
    verifiedAt:extra.verifiedAt||prev.verifiedAt||"",
    lastSyncAt:extra.lastSyncAt||new Date().toISOString(),
    lastPushAt:extra.lastPushAt||prev.lastPushAt||"",
    lastPullAt:extra.lastPullAt||prev.lastPullAt||""
  };
  cloudSaveJson(CLOUD_META_KEY,meta);
  return meta;
}

async function cloudReadRow(){
  if(!cloudClient||!cloudUser)throw new Error("Cloud 로그인이 필요합니다.");
  const {data,error}=await cloudClient
    .from("hani_state")
    .select("state,revision,updated_at,device")
    .eq("user_id",cloudUser.id)
    .limit(1);
  if(error)throw error;
  return data?.[0]||null;
}
function cloudStopAutoSync(message="",tone="warn"){
  cloudAutoSyncReady=false;
  if(cloudPollTimer){clearInterval(cloudPollTimer);cloudPollTimer=null}
  if(message)cloudSetRuntime("동기화 중지",message,tone,{sync:"STOP"});
  else renderCloudPanel();
}
function cloudStartPolling(){
  if(cloudPollTimer)clearInterval(cloudPollTimer);
  cloudPollTimer=setInterval(()=>{
    // Poll only while the fail-closed sync core is in a verified ON state.
    if(document.visibilityState==="visible"&&cloudUser&&cloudAutoSyncReady)cloudSyncCycle("poll");
  },15000);
}
function cloudQueueSync(delay=650){
  if(!cloudUser||!cloudAutoSyncReady||cloudApplyingRemote)return;
  if(cloudSyncTimer)clearTimeout(cloudSyncTimer);
  cloudSyncTimer=setTimeout(()=>cloudSyncCycle("local-save"),delay);
}
async function cloudApplyRemoteRow(remote,remoteHash,{announce=false}={}){
  const previousState=structuredClone(state);
  let candidate=normalizeState(structuredClone(remote?.state||{}));
  candidate=cloudMergeProtectedMedia(candidate,previousState);
  const serialized=JSON.stringify(candidate);
  let previousRaw=null;
  try{previousRaw=localStorage.getItem(STORAGE_KEY)}catch(e){}
  try{
    if(!cloudSaveSafetySnapshot(`before_cloud_pull_r${remote?.revision??"unknown"}`,previousState))throw new Error("Cloud 반영 전 안전 스냅샷을 만들지 못해 동기화를 중단했습니다.");
    cloudApplyingRemote=true;
    localStorage.setItem(STORAGE_KEY,serialized);
    const verified=localStorage.getItem(STORAGE_KEY);
    if(verified!==serialized)throw new Error("Cloud 수신 후 localStorage read-back 값이 일치하지 않습니다.");
    const parsed=JSON.parse(verified);
    if(!cloudSame(cloudComparableState(parsed),cloudComparableState(candidate)))throw new Error("Cloud 수신 후 Local 상태 검증에 실패했습니다.");
    state=candidate;brokerDraft=null;monthlyDraft=null;lastLoadError="";
    lastSaveResult={ok:true,bytes:serializedBytes(serialized),message:"Cloud 변경을 이 기기에 반영하고 read-back 검증을 완료했습니다."};
    renderAll();
    const effectiveHash=await cloudStateHash(cloudComparableState(state));
    const rawRemoteHash=remoteHash||await cloudStateHash(cloudComparableState(remote.state));
    const mediaPreserved=effectiveHash!==rawRemoteHash;
    const meta=cloudSaveSyncMeta(remote,mediaPreserved?rawRemoteHash:effectiveHash,{lastPullAt:new Date().toISOString(),verifiedAt:new Date().toISOString(),appliedRevision:remote.revision});
    cloudSetRuntime(mediaPreserved?"동기화 완료 · 미디어 보호":"동기화 완료",mediaPreserved?`Cloud revision ${remote.revision}을 반영했고 Local의 기존 표지/포스터를 보호했습니다. 보호된 미디어는 다음 안전 업로드에서 Cloud에 보완됩니다.`:`Cloud revision ${remote.revision}을 이 기기에 반영했습니다.`,"ok",{revision:remote.revision,updatedAt:remote.updated_at,verifiedAt:meta.verifiedAt,device:remote.device||"",sync:"ON",localSummary:cloudSummaryText(state),remoteSummary:cloudSummaryText(remote.state)});
    if(announce)toast("Cloud의 최신 변경을 이 기기에 반영했습니다.");
    return true;
  }catch(e){
    try{if(previousRaw===null)localStorage.removeItem(STORAGE_KEY);else localStorage.setItem(STORAGE_KEY,previousRaw)}catch(rollbackError){console.error("Cloud pull rollback failed",rollbackError)}
    state=previousState;renderAll();throw e;
  }finally{cloudApplyingRemote=false}
}
async function cloudPushLocalRow(remote,localState,localHash){
  if(!cloudHasMeaningfulLocalData(localState))throw new Error("빈 Local 상태는 Cloud에 업로드할 수 없습니다.");
  const expectedRevision=Number(remote?.revision);
  if(!Number.isFinite(expectedRevision))throw new Error("Cloud revision을 확인할 수 없어 업로드를 중단했습니다.");
  const remoteState=cloudComparableState(remote?.state||{});
  const outgoing=cloudMergeProtectedMedia(localState,remoteState);
  const outgoingHash=await cloudStateHash(outgoing);
  const {data,error}=await cloudClient.from("hani_state").update({state:structuredClone(outgoing),device:cloudDeviceLabel()}).eq("user_id",cloudUser.id).eq("revision",expectedRevision).select("state,revision,updated_at,device");
  if(error)throw error;
  const written=data?.[0];
  if(!written){const latest=await cloudReadRow().catch(()=>null),latestRev=latest?.revision??"?";throw new Error(`Cloud revision이 ${expectedRevision}에서 ${latestRev}(으)로 바뀌었습니다. 다른 기기의 변경을 덮지 않도록 중단했습니다.`)}
  const writtenRevision=Number(written.revision);
  if(!Number.isFinite(writtenRevision)||writtenRevision!==expectedRevision+1)throw new Error(`Cloud revision 증가 검증 실패: ${expectedRevision} → ${written.revision}. DB revision 트리거를 확인해야 합니다.`);
  const returnedHash=await cloudStateHash(written.state);
  if(returnedHash!==outgoingHash)throw new Error("Cloud 저장 후 반환된 state가 Local과 일치하지 않습니다.");
  if(!cloudSame(outgoing,localState)){const serialized=JSON.stringify(outgoing);localStorage.setItem(STORAGE_KEY,serialized);if(localStorage.getItem(STORAGE_KEY)!==serialized)throw new Error("Media Guard 병합 후 Local read-back 검증에 실패했습니다.");state=outgoing;renderAll()}
  const now=new Date().toISOString(),meta=cloudSaveSyncMeta(written,outgoingHash,{lastPushAt:now,verifiedAt:now,appliedRevision:writtenRevision});
  cloudSetRuntime("동기화 완료",`Local 변경을 Cloud revision ${writtenRevision}으로 반영했습니다.`,"ok",{revision:writtenRevision,updatedAt:written.updated_at,verifiedAt:meta.verifiedAt,device:written.device||"",sync:"ON",localSummary:cloudSummaryText(outgoing),remoteSummary:cloudSummaryText(written.state)});
  return written;
}
function cloudSyncDecision({hasBaseline,localMeaningful,remoteMeaningful,localHash,remoteHash,baselineHash,appliedRevision,remoteRevision}){
  if(!remoteMeaningful){
    if(!localMeaningful)return {action:"idle-empty",reason:"Local과 Cloud 모두 비어 있습니다."};
    return {action:"stop",reason:"Cloud 실데이터가 비어 있습니다. Local을 자동 업로드하지 않습니다."};
  }
  if(!localMeaningful)return {action:"pull",reason:"이 기기 Local이 비어 있어 Cloud를 안전 복원합니다."};
  if(!hasBaseline){
    if(localHash===remoteHash)return {action:"establish",reason:"Local과 Cloud가 동일해 안전 기준을 설정합니다."};
    return {action:"stop",reason:"이 기기의 동기화 기준이 없고 Local과 Cloud 내용이 다릅니다. 자동 덮어쓰지 않습니다."};
  }
  if(remoteRevision<appliedRevision)return {action:"stop",reason:`Cloud revision ${remoteRevision}이 이 기기의 기준 ${appliedRevision}보다 낮습니다. 롤백 가능성이 있어 중단합니다.`};
  if(localHash===remoteHash)return {action:"establish",reason:"Local과 Cloud가 동일합니다."};
  const localDirty=localHash!==baselineHash,remoteHashChanged=remoteHash!==baselineHash;
  if(remoteRevision===appliedRevision){
    if(remoteHashChanged)return {action:"stop",reason:"같은 revision인데 Cloud 내용이 기준본과 달라 무결성 검증에 실패했습니다."};
    if(localDirty)return {action:"push",reason:"Local만 변경되었습니다."};
    return {action:"stop",reason:"같은 revision에서 설명할 수 없는 불일치가 감지되었습니다."};
  }
  if(remoteRevision>appliedRevision){
    if(!remoteHashChanged){
      if(localDirty)return {action:"push",reason:"Cloud revision만 증가했고 실데이터는 기준본 그대로여서 Local 변경을 안전 반영합니다."};
      return {action:"establish",reason:"Cloud revision만 증가했고 실데이터는 동일합니다."};
    }
    if(localDirty)return {action:"conflict",reason:"Local과 Cloud가 모두 변경되었습니다."};
    return {action:"pull",reason:"Cloud만 변경되었습니다."};
  }
  return {action:"stop",reason:"동기화 상태를 안전하게 판정할 수 없습니다."};
}
function cloudSyncSelfTest(){
  const B="b",L="l",R="r";
  const cases=[
    [cloudSyncDecision({hasBaseline:false,localMeaningful:true,remoteMeaningful:true,localHash:B,remoteHash:B,baselineHash:"",appliedRevision:-1,remoteRevision:1}).action,"establish"],
    [cloudSyncDecision({hasBaseline:false,localMeaningful:true,remoteMeaningful:true,localHash:L,remoteHash:R,baselineHash:"",appliedRevision:-1,remoteRevision:1}).action,"stop"],
    [cloudSyncDecision({hasBaseline:false,localMeaningful:false,remoteMeaningful:true,localHash:L,remoteHash:R,baselineHash:"",appliedRevision:-1,remoteRevision:1}).action,"pull"],
    [cloudSyncDecision({hasBaseline:true,localMeaningful:true,remoteMeaningful:true,localHash:L,remoteHash:B,baselineHash:B,appliedRevision:5,remoteRevision:5}).action,"push"],
    [cloudSyncDecision({hasBaseline:true,localMeaningful:true,remoteMeaningful:true,localHash:B,remoteHash:R,baselineHash:B,appliedRevision:5,remoteRevision:6}).action,"pull"],
    [cloudSyncDecision({hasBaseline:true,localMeaningful:true,remoteMeaningful:true,localHash:L,remoteHash:R,baselineHash:B,appliedRevision:5,remoteRevision:6}).action,"conflict"],
    [cloudSyncDecision({hasBaseline:true,localMeaningful:true,remoteMeaningful:true,localHash:L,remoteHash:R,baselineHash:B,appliedRevision:6,remoteRevision:6}).action,"stop"],
    [cloudSyncDecision({hasBaseline:true,localMeaningful:true,remoteMeaningful:true,localHash:B,remoteHash:R,baselineHash:B,appliedRevision:7,remoteRevision:6}).action,"stop"]
  ];
  return cases.every(([got,want])=>got===want);
}
async function cloudSyncCycle(reason="manual"){
  if(!cloudClient||!cloudUser)return;
  if(cloudSyncBusy){cloudSyncPending=true;return}
  cloudSyncBusy=true;
  try{
    if(!cloudSyncSelfTest())throw new Error("Sync Core 자체 검증에 실패해 자동 동기화를 시작하지 않았습니다.");
    const remote=await cloudReadRow();
    const localState=cloudComparableState(state);
    const localMeaningful=cloudHasMeaningfulLocalData(localState);
    if(!remote?.state){
      cloudAutoSyncReady=false;
      cloudSetRuntime("Cloud 기준 없음",localMeaningful?"Cloud row가 없습니다. 자동 업로드하지 않습니다. 최초 업로드는 사용자가 확인해야 합니다.":"Local과 Cloud가 비어 있습니다.","warn",{sync:"WAIT",localSummary:cloudSummaryText(localState),remoteSummary:"Cloud 비어 있음"});
      cloudStartPolling();return;
    }
    const remoteState=cloudComparableState(remote.state);
    const [localHash,remoteHash]=await Promise.all([cloudStateHash(localState),cloudStateHash(remoteState)]);
    const meta=cloudMeta(),remoteMeaningful=cloudHasMeaningfulLocalData(remoteState);
    const baselineHash=String(meta.lastSyncedHash||"");
    const appliedRevision=Number(meta.appliedRevision);
    const remoteRevision=Number(remote.revision);
    const hasBaseline=meta.syncEngine===CLOUD_SYNC_ENGINE&&meta.hashSchema===CLOUD_HASH_SCHEMA&&!!baselineHash&&Number.isFinite(appliedRevision);
    cloudRuntime={...cloudRuntime,revision:remote.revision,updatedAt:remote.updated_at,device:remote.device||"",localSummary:cloudSummaryText(localState),remoteSummary:cloudSummaryText(remoteState)};
    const decision=cloudSyncDecision({hasBaseline,localMeaningful,remoteMeaningful,localHash,remoteHash,baselineHash,appliedRevision:Number.isFinite(appliedRevision)?appliedRevision:-1,remoteRevision:Number.isFinite(remoteRevision)?remoteRevision:-1});
    if(decision.action==="idle-empty"){
      cloudAutoSyncReady=false;cloudSetRuntime("대기",decision.reason,"warn",{sync:"WAIT"});cloudStartPolling();return;
    }
    if(decision.action==="establish"){
      const now=new Date().toISOString(),m=cloudSaveSyncMeta(remote,remoteHash,{verifiedAt:now,appliedRevision:remote.revision});
      cloudAutoSyncReady=true;cloudSetRuntime("동기화 정상",`Local과 Cloud 기준을 확인했습니다. revision ${remote.revision}.`,"ok",{revision:remote.revision,updatedAt:remote.updated_at,verifiedAt:m.verifiedAt,device:remote.device||"",sync:"ON",localSummary:cloudSummaryText(state),remoteSummary:cloudSummaryText(remoteState)});cloudStartPolling();return;
    }
    if(decision.action==="pull"){
      await cloudApplyRemoteRow(remote,remoteHash,{announce:reason!=="poll"});cloudAutoSyncReady=true;cloudStartPolling();return;
    }
    if(decision.action==="push"){
      await cloudPushLocalRow(remote,localState,localHash);cloudAutoSyncReady=true;cloudStartPolling();return;
    }
    if(decision.action==="conflict"){
      cloudAutoSyncReady=false;cloudStopAutoSync("PC와 모바일 양쪽에서 변경된 데이터가 있어 자동 동기화를 잠시 멈췄어요. 어느 쪽도 자동으로 덮어쓰지 않습니다. ‘차이 확인’에서 Local과 Cloud를 비교해 주세요.","error");return;
    }
    cloudAutoSyncReady=false;cloudStopAutoSync(decision.reason||"자동 동기화를 안전하게 진행할 수 없어 중단했습니다.","warn");
  }catch(e){
    console.error("Cloud sync",reason,e);cloudAutoSyncReady=false;cloudStopAutoSync(e?.message||"Cloud 동기화 중 오류가 발생했습니다.","error");
  }finally{
    cloudSyncBusy=false;if(cloudSyncPending){cloudSyncPending=false;setTimeout(()=>cloudSyncCycle("queued"),120)}
  }
}

function cloudBindLifecycle(){
  if(cloudLifecycleBound)return;
  cloudLifecycleBound=true;
  window.addEventListener("focus",()=>{if(cloudUser&&cloudAutoSyncReady)cloudSyncCycle("focus")});
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&cloudUser&&cloudAutoSyncReady)cloudSyncCycle("visible")});
}

function renderCloudPanel(){
  const pill=$("cloudStatePill"),msg=$("cloudMessage"),grid=$("cloudStatusGrid"),head=$("cloudHeaderState");
  const bridge=$("cloudBridgeCard");
  if(bridge){
    bridge.classList.toggle("cloud-logged-in",!!cloudUser);
    bridge.classList.toggle("cloud-recovery-mode",!!cloudRecoveryMode);
    bridge.classList.toggle("cloud-recovery-error",cloudRecoveryMode&&cloudRuntime.tone==="error");
  }
  const title=$("cloudLoginTitle"),hint=$("cloudLoginHint");
  if(cloudRecoveryMode){
    if(title)title.textContent="새 비밀번호 설정";
    if(hint)hint.textContent=cloudUser?.email?`${cloudUser.email} 계정의 비밀번호를 변경합니다.`:"복구 링크를 확인하고 있습니다.";
  }else{
    if(title)title.textContent=cloudUser?"로그인 완료":"HANI OS 계정";
    if(hint)hint.textContent=cloudUser?`${cloudUser.email||"HANI OS 계정"} · 자동 동기화 ${cloudAutoSyncReady?"ON":"확인 중"}`:"이메일과 비밀번호만 입력하면 Cloud 데이터가 자동으로 연결됩니다.";
  }
  if(pill){
    pill.classList.remove("cloud-ok","cloud-warn","cloud-error");
    pill.classList.add(cloudRuntime.tone==="ok"?"cloud-ok":cloudRuntime.tone==="error"?"cloud-error":"cloud-warn");
    pill.textContent="CLOUD · "+cloudRuntime.status;
  }
  if(head)head.textContent=cloudUser?(cloudAutoSyncReady?"CLOUD · SYNC":"CLOUD · LOGIN"):"CLOUD · READY";
  if(msg)msg.textContent=cloudRuntime.message||"";
  const conflictAction=$("cloudConflictAction"),isConflict=cloudRuntime.sync==="STOP"&&/Local과 Cloud가 모두 변경|양쪽.*변경/.test(cloudRuntime.message||"");
  if(conflictAction){conflictAction.hidden=!isConflict;conflictAction.onclick=()=>{$("cloudAdvanced")?.setAttribute("open","");$("cloudCompare")?.scrollIntoView({behavior:"smooth",block:"center"})}}
  if(grid){
    const meta=cloudMeta();
    const rows=[
      ["계정",cloudUser?.email||"-"],
      ["이 기기 상태",cloudLocalStatusLabel()],
      ["자동 동기화",cloudRuntime.sync||"OFF"],
      ["Cloud revision",cloudRuntime.revision??meta.revision??"-"],
      ["Cloud updated",formatDateTime(cloudRuntime.updatedAt||meta.updatedAt)],
      ["마지막 동기화",formatDateTime(meta.lastSyncAt||cloudRuntime.verifiedAt||meta.verifiedAt)],
      ["Local 데이터",cloudRuntime.localSummary||cloudSummaryText(state)],
      ["Cloud 데이터",cloudRuntime.remoteSummary||"동기화 후 표시"],
      ["Sync engine",`R${CLOUD_SYNC_ENGINE} · applied ${meta.appliedRevision??"-"}`]
    ];
    grid.innerHTML=rows.map(([l,v])=>`<div class="cloud-status-item"><small>${esc(l)}</small><b>${esc(v)}</b></div>`).join("");
  }
  if($("cloudLogin"))$("cloudLogin").style.display=cloudUser?"none":"";
  if($("cloudLogout"))$("cloudLogout").style.display=cloudUser?"":"none";
  if($("cloudSyncNow"))$("cloudSyncNow").style.display=cloudUser?"":"none";
  if($("cloudLogout"))$("cloudLogout").disabled=!cloudUser;
  if($("cloudSyncNow"))$("cloudSyncNow").disabled=!cloudUser;
  if($("cloudFirstCopy"))$("cloudFirstCopy").disabled=!cloudUser||!cloudHasMeaningfulLocalData(state);
  if($("cloudRestore"))$("cloudRestore").disabled=!cloudUser;
  if($("cloudCompare"))$("cloudCompare").disabled=!cloudUser;
}
async function cloudFetchMeta({silent=false}={}){
  if(!cloudClient||!cloudUser)return null;
  const {data,error}=await cloudClient.from("hani_state").select("revision,updated_at,device").eq("user_id",cloudUser.id).limit(1);
  if(error){if(!silent)throw error;return null}
  const row=data?.[0]||null;
  if(row){
    cloudRuntime={...cloudRuntime,revision:row.revision,updatedAt:row.updated_at,device:row.device||""};
    renderCloudPanel();
  }
  return row;
}
async function initCloudBridge(){
  const cfg=cloudConfig();
  if($("cloudProjectUrl"))$("cloudProjectUrl").value=cfg.url||"";
  if($("cloudPublishableKey"))$("cloudPublishableKey").value=cfg.key||"";
  if($("cloudEmail"))$("cloudEmail").value=cfg.email||"";
  bindCloudBridgeControls();
  if(!cfg.url||!cfg.key){
    cloudSetRuntime("연결 설정 필요","고급 설정에서 Cloud 연결 정보를 확인해 주세요.","warn");
    return;
  }
  try{
    const authInfo=cloudAuthUrlInfo();
    cloudCreateClient(cfg);

    if(authInfo.error){
      cloudRecoveryMode=cloudUrlLooksRecovery()||/otp|token|expired/i.test(authInfo.errorCode||authInfo.error);
      cloudSetRuntime("복구 링크 오류",`비밀번호 재설정 링크를 처리하지 못했습니다. ${authInfo.error.replace(/\\+/g," ")}`,"error",{sync:"PAUSE"});
      if(cloudRecoveryMode)cloudNavigateToRecovery();
      return;
    }

    // PKCE 형식(?code=...)의 callback이 들어오는 경우도 안전하게 지원한다.
    // 이미 detectSessionInUrl이 처리했으면 getSession()이 세션을 반환하므로 중복 교환하지 않는다.
    let {data,error}=await cloudClient.auth.getSession();
    if(error)throw error;

    if(authInfo.code&&!data?.session){
      const exchange=await cloudClient.auth.exchangeCodeForSession(
        authInfo.code,
        authInfo.flowId?{flowId:authInfo.flowId}:undefined
      );
      if(exchange.error)throw exchange.error;
      data={session:exchange.data?.session||null};
    }

    // implicit recovery hash 처리는 client 초기화와 비동기로 맞물릴 수 있어 짧게 한 번 재확인한다.
    if(cloudUrlLooksRecovery()&&!data?.session){
      await new Promise(resolve=>setTimeout(resolve,450));
      const retry=await cloudClient.auth.getSession();
      if(retry.error)throw retry.error;
      data=retry.data;
    }

    cloudUser=data?.session?.user||null;

    if(cloudUrlLooksRecovery()||cloudRecoveryMode){
      if(cloudUser){
        cloudEnterRecoveryMode(data?.session||null,"복구 링크 인증이 완료되었습니다. 새 비밀번호를 입력해 주세요.");
      }else{
        cloudRecoveryMode=true;
        cloudSetRuntime("복구 링크 확인","복구 링크는 감지했지만 인증 세션을 만들지 못했습니다. 링크가 만료되었거나 이미 사용되었을 수 있습니다.","error",{sync:"PAUSE"});
      }
      cloudNavigateToRecovery();
      return;
    }

    if(cloudUser){
      // v2.9.6: Supabase session is persisted reliably in localStorage, while a tab-scoped gate marker
      // decides whether this is a refresh of an already unlocked tab or a fresh browser/tab entry.
      if(loginGateSessionActive()){
        // A valid auth session + tab marker is enough to reopen Local immediately after refresh.
        // Cloud failures must never force the Login Gate back on a Local-first app.
        unlockLoginGate();
        cloudSetRuntime("로그인 복원","새로고침 후 인증 세션을 복원했습니다. Local을 먼저 열고 Cloud를 확인합니다.","ok",{sync:"CHECK"});
        try{
          await cloudFetchMeta({silent:true});
          cloudBindLifecycle();
          await cloudSyncCycle("session-restore");
        }catch(syncError){
          console.warn("Refresh Cloud sync",syncError);
          cloudAutoSyncReady=false;
          cloudSetRuntime("로그인 복원 · 동기화 확인 필요","로그인은 유지됩니다. Cloud 동기화는 다음 저장/포커스에서 다시 확인합니다.","warn",{sync:"CHECK"});
        }
      }else{
        cloudAutoSyncReady=false;
        cloudSetRuntime("로그인 확인","인증 세션은 남아 있지만 HANI OS 로그인 확인 기록이 없습니다. 한 번만 비밀번호 확인을 기다립니다.","warn",{sync:"PAUSE"});
        lockLoginGate("이 기기에서 한 번만 비밀번호를 확인해 주세요.");
      }
    }else{
      cloudUser=null;
      cloudSetRuntime("로그인 필요","메인 로그인 화면에서 인증하면 이 기기와 Cloud가 연결됩니다.","warn",{sync:"OFF"});
    }
  }catch(e){
    console.error("Cloud init",e);
    cloudUser=null;
    if(cloudHasAuthCallback()){
      cloudRecoveryMode=true;
      cloudSetRuntime("복구 링크 처리 실패",e?.message||"비밀번호 재설정 링크 처리에 실패했습니다.","error",{sync:"PAUSE"});
      cloudNavigateToRecovery();
    }else{
      cloudSetRuntime("연결 오류",e?.message||"Cloud 초기화에 실패했습니다.","error");
    }
  }
}
function cloudApplyConfigFromForm(){
  cloudStopAutoSync();
  const cfg=cloudReadFormConfig();
  if(!cloudSaveJson(CLOUD_CONFIG_KEY,cfg))throw new Error("Cloud 연결 설정을 브라우저에 저장하지 못했습니다.");
  cloudUser=null;cloudClient=null;
  cloudCreateClient(cfg);
  return cfg;
}
async function cloudLogin(){
  try{
    const cfg=cloudApplyConfigFromForm();
    const password=$("cloudPassword").value;
    if(!cfg.email)throw new Error("로그인 이메일을 입력해 주세요.");
    if(!password)throw new Error("로그인 비밀번호를 입력해 주세요.");
    cloudSetRuntime("로그인 중","Supabase Auth로 로그인하고 있습니다.","warn");
    const {data,error}=await cloudClient.auth.signInWithPassword({email:cfg.email,password});
    $("cloudPassword").value="";
    if(error)throw error;
    cloudUser=data.user;
    cloudSetRuntime("로그인 완료","Cloud 연결이 확인되었습니다. Local ↔ Cloud 기준을 확인하고 자동 동기화를 준비합니다.","ok",{sync:"CHECK"});
    await cloudFetchMeta({silent:true});
    cloudBindLifecycle();
    await cloudSyncCycle("login");
    markLoginGateSession();
  }catch(e){
    console.error("Cloud login",e);
    $("cloudPassword").value="";
    cloudSetRuntime("로그인 실패",e?.message||"Cloud 로그인에 실패했습니다.","error");
  }
}
async function cloudLogout(){
  cloudStopAutoSync();
  clearLoginGateSession();
  try{if(cloudClient)await cloudClient.auth.signOut()}catch(e){console.warn(e)}
  cloudUser=null;
  cloudRecoveryMode=false;
  cloudCleanAuthUrl();
  cloudSetRuntime("로그아웃","Cloud 세션에서 로그아웃했습니다. 로컬 데이터는 그대로 유지됩니다.","warn",{revision:null,updatedAt:"",sync:"OFF"});
  lockLoginGate("로그아웃했습니다. 다시 이용하려면 로그인해 주세요.");
}
async function cloudFirstCopy(){
  if(!cloudClient||!cloudUser)return alert("먼저 Cloud 로그인을 완료해 주세요.");
  if(!cloudHasMeaningfulLocalData(state))return alert("빈 Local 상태는 Cloud에 업로드할 수 없습니다.");
  try{
    const remote=await cloudReadRow();
    const localState=cloudComparableState(state),localHash=await cloudStateHash(localState);
    if(remote?.state){
      const remoteState=cloudComparableState(remote.state),remoteHash=await cloudStateHash(remoteState);
      if(localHash===remoteHash){
        const meta=cloudSaveSyncMeta(remote,remoteHash,{verifiedAt:new Date().toISOString(),appliedRevision:remote.revision});
        cloudAutoSyncReady=true;cloudStartPolling();
        cloudSetRuntime("동기화 정상",`이미 Local과 Cloud가 동일합니다. revision ${remote.revision}.`,"ok",{revision:remote.revision,updatedAt:remote.updated_at,verifiedAt:meta.verifiedAt,device:remote.device||"",sync:"ON",localSummary:cloudSummaryText(localState),remoteSummary:cloudSummaryText(remoteState)});
        return;
      }
      if(cloudHasMeaningfulLocalData(remoteState)){
        const localSummary=cloudSummaryText(localState),remoteSummary=cloudSummaryText(remoteState);
        if(!confirm(`현재 이 기기의 Local을 Cloud 기준본으로 확정할까요?\n\n이 기기 Local: ${localSummary}\n현재 Cloud: ${remoteSummary}\nCloud revision: ${remote.revision}\n\n안전 절차\n• 기존 Cloud state를 브라우저 내부 안전 스냅샷으로 먼저 보관합니다.\n• 안전 스냅샷 read-back이 실패하면 Cloud에는 쓰지 않습니다.\n• revision ${remote.revision}이 그대로일 때만 조건부 UPDATE합니다.\n• 저장 후 revision +1과 반환 state hash까지 검증합니다.\n• 현재 Local 데이터는 이 작업으로 삭제하지 않습니다.\n\n이 Local이 최신 기준본이라는 것을 확인한 경우에만 계속하세요.`))return;
        if(!cloudSaveSafetySnapshot(`before_local_baseline_promote_r${remote.revision}`,remote.state))throw new Error("Cloud 기준본 변경 전 기존 Cloud 안전 스냅샷을 만들지 못해 작업을 중단했습니다.");
        const written=await cloudPushLocalRow(remote,localState,localHash);
        cloudAutoSyncReady=true;cloudStartPolling();
        cloudSetRuntime("기준본 확정 완료",`이 기기 Local을 Cloud revision ${written.revision} 기준본으로 확정했습니다. 이제 자동 동기화를 시작합니다.`,"ok",{revision:written.revision,updatedAt:written.updated_at,device:written.device||"",sync:"ON",localSummary:cloudSummaryText(state),remoteSummary:cloudSummaryText(written.state)});
        alert(`이 기기 Local을 Cloud 기준본으로 확정했습니다.\nrevision ${remote.revision} → ${written.revision}\n\n이제 다른 기기에서는 'Cloud를 이 기기 기준으로 적용'을 한 번 실행한 뒤 자동 동기화를 사용하세요.`);
        return;
      }
      if(!confirm(`Cloud row는 있으나 의미 있는 데이터가 없습니다. 현재 Local을 revision ${remote.revision} 위에 조건부로 업로드할까요?\n\n${backupSummary(localState)}`))return;
      if(!cloudSaveSafetySnapshot(`before_local_baseline_promote_empty_r${remote.revision}`,remote.state))throw new Error("Cloud 기준본 변경 전 안전 스냅샷을 만들지 못해 작업을 중단했습니다.");
      const written=await cloudPushLocalRow(remote,localState,localHash);
      cloudAutoSyncReady=true;cloudStartPolling();
      alert(`Local → Cloud 최초 반영을 완료했습니다. revision ${written.revision}`);
      return;
    }
    if(!confirm(`Cloud row가 없습니다. 현재 Local을 최초 기준본으로 생성할까요?\n\n${backupSummary(localState)}\n\n동시에 다른 기기가 Cloud row를 만들면 이 작업은 실패하고 덮어쓰지 않습니다.`))return;
    const {data,error}=await cloudClient.from("hani_state").insert({user_id:cloudUser.id,state:structuredClone(localState),device:cloudDeviceLabel()}).select("state,revision,updated_at,device");
    if(error)throw error;
    const written=data?.[0];if(!written)throw new Error("Cloud 최초 생성 결과가 없습니다.");
    const returnedHash=await cloudStateHash(written.state);if(returnedHash!==localHash)throw new Error("Cloud 최초 생성 후 state 검증에 실패했습니다.");
    const now=new Date().toISOString(),meta=cloudSaveSyncMeta(written,localHash,{lastPushAt:now,verifiedAt:now,appliedRevision:written.revision});
    cloudAutoSyncReady=true;cloudStartPolling();
    cloudSetRuntime("동기화 완료",`Cloud 최초 기준본을 생성했습니다. revision ${written.revision}.`,"ok",{revision:written.revision,updatedAt:written.updated_at,verifiedAt:meta.verifiedAt,device:written.device||"",sync:"ON",localSummary:cloudSummaryText(localState),remoteSummary:cloudSummaryText(written.state)});
  }catch(e){
    console.error("Cloud first copy",e);cloudStopAutoSync(e?.message||"최초 Cloud 반영에 실패했습니다.","error");alert("Local → Cloud 반영에 실패했습니다.\n"+(e?.message||"오류를 확인해 주세요.")+"\n\nLocal 데이터는 그대로 유지됩니다.");
  }
}
async function cloudRestoreToLocal(){
  if(!cloudClient||!cloudUser)return alert("먼저 Cloud 로그인을 완료해 주세요.");
  try{
    cloudAutoSyncReady=false;if(cloudPollTimer){clearInterval(cloudPollTimer);cloudPollTimer=null}
    const remote=await cloudReadRow();if(!remote?.state)throw new Error("Cloud에 복원할 HANI state가 없습니다.");
    const previousState=structuredClone(state),localComparable=cloudComparableState(previousState);
    const rawRemote=cloudComparableState(remote.state);
    let candidate=normalizeState(structuredClone(remote.state));
    candidate=cloudMergeProtectedMedia(candidate,previousState);
    const [localHash,rawRemoteHash,candidateHash]=await Promise.all([cloudStateHash(localComparable),cloudStateHash(rawRemote),cloudStateHash(candidate)]);
    if(localHash===candidateHash){
      const meta=cloudSaveSyncMeta(remote,rawRemoteHash,{verifiedAt:new Date().toISOString(),appliedRevision:remote.revision});
      cloudAutoSyncReady=true;cloudStartPolling();cloudSetRuntime("이미 동일",`현재 Local이 Cloud revision ${remote.revision}과 동일합니다.`,"ok",{...meta,sync:"ON",localSummary:cloudSummaryText(state),remoteSummary:cloudSummaryText(rawRemote)});return;
    }
    if(!confirm(`Cloud revision ${remote.revision}을 이 기기에 직접 복원할까요?\n\n현재 Local: ${cloudSummaryText(previousState)}\nCloud: ${cloudSummaryText(rawRemote)}\n\n• 복원 직전 Local 전체 상태를 브라우저 내부 안전 스냅샷으로 저장합니다.\n• 안전 스냅샷 생성에 실패하면 복원을 실행하지 않습니다.\n• 기존 Local 표지/포스터는 Cloud 값이 비어 있어도 보호합니다.\n• Cloud 원본은 이 작업으로 변경하지 않습니다.`)){cloudSetRuntime("복원 취소","현재 Local을 유지합니다.","warn",{sync:"WAIT"});return}
    if(!cloudSaveSafetySnapshot(`before_manual_cloud_restore_r${remote.revision}`,previousState))throw new Error("복원 전 안전 스냅샷을 만들지 못해 작업을 중단했습니다.");
    let previousRaw=null;try{previousRaw=localStorage.getItem(STORAGE_KEY)}catch(e){}
    const serialized=JSON.stringify(candidate);
    try{
      localStorage.setItem(STORAGE_KEY,serialized);
      const verified=localStorage.getItem(STORAGE_KEY);if(verified!==serialized)throw new Error("복원 후 localStorage read-back 값이 일치하지 않습니다.");
      const parsed=JSON.parse(verified);if(!cloudSame(cloudComparableState(parsed),cloudComparableState(candidate)))throw new Error("복원 후 데이터 검증에 실패했습니다.");
      state=candidate;brokerDraft=null;monthlyDraft=null;lastLoadError="";lastSaveResult={ok:true,bytes:serializedBytes(serialized),message:"Cloud 수동 복원과 read-back 검증을 완료했습니다."};renderAll();
      const mediaPreserved=candidateHash!==rawRemoteHash,baselineHash=mediaPreserved?rawRemoteHash:candidateHash,now=new Date().toISOString();
      const meta=cloudSaveSyncMeta(remote,baselineHash,{verifiedAt:now,lastPullAt:now,appliedRevision:remote.revision});
      cloudAutoSyncReady=true;cloudStartPolling();cloudSetRuntime(mediaPreserved?"복원 완료 · 미디어 보호":"복원 완료",mediaPreserved?"Cloud를 복원했고 기존 Local 표지/포스터를 보호했습니다. 다음 동기화에서 보호된 미디어를 Cloud에 보완합니다.":`Cloud revision ${remote.revision}을 안전하게 복원했습니다.`,"ok",{...meta,sync:"ON",localSummary:cloudSummaryText(state),remoteSummary:cloudSummaryText(rawRemote)});
    }catch(inner){
      try{if(previousRaw===null)localStorage.removeItem(STORAGE_KEY);else localStorage.setItem(STORAGE_KEY,previousRaw)}catch(rollbackError){console.error("Cloud restore rollback failed",rollbackError)}
      state=previousState;renderAll();throw inner;
    }
  }catch(e){console.error("Cloud restore",e);cloudStopAutoSync(e?.message||"Cloud → Local 복원에 실패했습니다.","error");alert("Cloud → Local 복원에 실패했습니다.\n"+(e?.message||"오류를 확인해 주세요.")+"\n\n기존 Local은 유지됩니다.")}
}
async function cloudCompare(){
  if(!cloudClient||!cloudUser)return alert("먼저 Cloud 로그인을 완료해 주세요.");
  try{
    cloudSetRuntime("비교 중","Cloud 상태를 읽어 현재 로컬 상태와 비교하고 있습니다.","warn");
    const {data,error}=await cloudClient.from("hani_state").select("state,revision,updated_at,device").eq("user_id",cloudUser.id).limit(1);
    if(error)throw error;
    const remote=data?.[0];
    if(!remote)throw new Error("Cloud에 저장된 HANI state가 없습니다.");
    const localComparable=cloudComparableState(state),remoteComparable=cloudComparableState(remote.state);
    const [localHash,remoteHash]=await Promise.all([cloudStateHash(localComparable),cloudStateHash(remoteComparable)]);
    const same=localHash===remoteHash;
    const checkedAt=new Date().toISOString();
    if(same){
      const meta=cloudSaveSyncMeta(remote,remoteHash,{verifiedAt:checkedAt});
      cloudAutoSyncReady=true;
      cloudStartPolling();
      cloudSetRuntime("동일",`Local과 Cloud 실데이터가 동일합니다. revision ${remote.revision}. 자동 동기화 기준을 갱신했습니다.`,"ok",{revision:remote.revision,updatedAt:remote.updated_at,verifiedAt:meta.verifiedAt,device:remote.device||"",sync:"ON"});
    }else{
      cloudSetRuntime("차이 발견",`Local과 Cloud에 차이가 있습니다. 자동으로 덮어쓰지 않습니다. revision ${remote.revision}.`,"warn",{revision:remote.revision,updatedAt:remote.updated_at,verifiedAt:cloudRuntime.verifiedAt,device:remote.device||"",sync:"CHECK"});
    }
    alert(same?`Local ↔ Cloud 비교 완료\n실데이터 기준 두 상태가 동일합니다.\nrevision: ${remote.revision}`:`Local ↔ Cloud 비교 결과: 차이가 있습니다.\n\n자동으로 어느 쪽도 덮어쓰지 않습니다.\n• 이 기기가 최신이면: '이 기기 Local을 Cloud 기준으로 확정'\n• Cloud가 최신이면: 'Cloud를 이 기기 기준으로 적용'\n\n기준을 한 번 확정하면 이후부터 revision 기반 자동 동기화가 동작합니다.`);
  }catch(e){
    console.error("Cloud compare",e);
    cloudSetRuntime("비교 실패",e?.message||"Cloud 비교에 실패했습니다.","error");
  }
}
async function cloudManualSync(){
  if(!cloudClient||!cloudUser)return alert("먼저 Cloud 로그인을 완료해 주세요.");
  await cloudSyncCycle("manual");
}
function bindCloudBridgeControls(){
  if($("cloudSaveConfig"))$("cloudSaveConfig").onclick=()=>{
    try{
      const cfg=cloudApplyConfigFromForm();
      cloudSetRuntime("연결 준비",`연결 설정을 저장했습니다.${cfg.email?" 로그인 이메일도 기억합니다.":""} 비밀번호는 저장하지 않습니다.`,"warn");
      toast("Cloud 연결 설정을 저장했습니다.");
    }catch(e){cloudSetRuntime("설정 오류",e?.message||"Cloud 설정을 저장하지 못했습니다.","error")}
  };
  if($("cloudLogin"))$("cloudLogin").onclick=cloudLogin;
  if($("cloudPassword"))$("cloudPassword").addEventListener("keydown",e=>{if(e.key==="Enter")cloudLogin()});
  if($("cloudSaveNewPassword"))$("cloudSaveNewPassword").onclick=cloudSaveNewPassword;
  if($("cloudNewPasswordConfirm"))$("cloudNewPasswordConfirm").addEventListener("keydown",e=>{if(e.key==="Enter")cloudSaveNewPassword()});
  if($("cloudCancelRecovery"))$("cloudCancelRecovery").onclick=cloudCancelRecovery;
  if($("cloudLogout"))$("cloudLogout").onclick=cloudLogout;
  if($("cloudSyncNow"))$("cloudSyncNow").onclick=cloudManualSync;
  if($("cloudFirstCopy"))$("cloudFirstCopy").onclick=cloudFirstCopy;
  if($("cloudRestore"))$("cloudRestore").onclick=cloudRestoreToLocal;
  if($("cloudCompare"))$("cloudCompare").onclick=cloudCompare;
}

function renderStoragePanel(){
  const stats=$("storageStats");if(!stats)return;
  let raw="";try{raw=localStorage.getItem(STORAGE_KEY)||""}catch(e){}const recordCount=state.transactions.length+(state.investmentMonthlySnapshots?.length||0)+(state.investmentBrokerSnapshots?.length||0)+(state.investmentCashFlows?.length||0)+(state.investmentJournal?.length||0)+(state.ledgerMonths?.length||0)+(state.spendReviews?.length||0)+state.body.length+state.exercise.length+state.books.length+state.movies.length+state.diaries.length+state.tasks.length+(state.campusSemesters?.length||0)+(state.travelTrips?.length||0)+(state.travelWishlist?.length||0)+(state.certificates?.length||0)+(state.wishlistItems?.length||0)+(state.learningProjects?.length||0)+(state.learningQuizzes?.length||0)+(state.learningWrongAnswers?.length||0);
  const rows=[
    ["저장 위치","현재 브라우저"],
    ["마지막 저장",formatDateTime(state.meta?.lastSavedAt)],
    ["마지막 백업",formatDateTime(state.meta?.lastBackupAt)],
    ["저장 데이터",`${bytesLabel(serializedBytes(raw))} · 기록 ${recordCount}건`]
  ];
  stats.innerHTML=rows.map(([l,v])=>`<div class="data-status-item"><div class="label">${l}</div><b>${v}</b></div>`).join("");
  const pill=$("storageStatePill"),message=$("storageMessage");
  if(pill){pill.textContent=lastSaveResult?.ok===false?"ERROR":"LOCAL · OK";pill.classList.toggle("danger",lastSaveResult?.ok===false)}
  if(message)message.textContent=lastLoadError||lastSaveResult?.message||"브라우저 저장 상태를 확인했습니다.";
  const badge=$("saveStateBadge"),label=$("lastSavedLabel");
  if(badge){badge.classList.toggle("ok",lastSaveResult?.ok!==false);badge.classList.toggle("error",lastSaveResult?.ok===false);badge.textContent=lastSaveResult?.ok===false?"저장 실패":"저장 정상"}
  if(label)label.textContent="마지막 저장 "+formatDateTime(state.meta?.lastSavedAt);
  renderCloudPanel();
}
function commit(message,notify=true){
  const result=save();
  if(!result.ok){alert(result.message);return false}
  renderAll();if(notify)toast(message);return true;
}


// =========================================================
// HANI OS v2.9.56 · University Task Scheduling + Wish-list Board + Conversation Intake
// Preview-first, representative-approved writes only. STORAGE_KEY/internal VERSION unchanged; wishlistItems is a backward-compatible optional state extension.
const INTAKE_TARGET_LABELS={task:"할 일",body:"다이어트 · 체중",exercise:"운동",book:"독서 / 서재",movie:"시청 아카이브",diary:"일기",wishlist:"Wish-list",travelWish:"여행 Wish",certificate:"자격증",university:"대학교 관리"};
const INTAKE_AGENT_BY_TARGET={task:"sua",body:"nauen",exercise:"nauen",book:"haru",movie:"minji",diary:"minji",wishlist:"haru",travelWish:"suyeon",certificate:"hina",university:"hina"};
function intakeAgentKey(target){return INTAKE_AGENT_BY_TARGET[target]||"hani"}
function intakeAgentName(target){return teamByKey(intakeAgentKey(target))?.name||"하니"}
function intakeRouteLabel(target){return `유나 접수 → ${intakeAgentName(target)} 검토 → 하니 QA → 대표 승인`}
function intakeRenderRoute(rows=[]){const el=$("intakeRouteStatus");if(!el)return;const targets=[...new Set((rows||[]).map(r=>r.target).filter(Boolean))],middle=targets.length===1?`${intakeAgentName(targets[0])} 검토`:targets.length>1?`${targets.map(intakeAgentName).filter((v,i,a)=>a.indexOf(v)===i).join(" · ")} 검토`:"담당 Agent 검토";el.innerHTML=`<span class="is-current">🗂️ 유나 접수</span><i>→</i><span>${esc(middle)}</span><i>→</i><span>💜 하니 QA</span><i>→</i><span>대표 승인</span>`}
let intakePreviewRows=[];
let intakeImageFile=null;
let intakeImageFiles=[];
let intakeImageObjectUrls=[];
let intakeImageObjectUrl="";
let intakeVisionMeta=null;
let intakeHandoffDraft=null;
function intakeText(v){return String(v??"").trim()}
function intakeNormText(v){return intakeText(v).toLocaleLowerCase("ko-KR").replace(/\s+/g," ")}
function intakeDate(v){const raw=intakeText(v);if(!raw)return "";const normalized=normalizeDateFlexDate(raw);return normalized===null?raw:normalized}
function intakeNumber(v){if(v===null||v===undefined||intakeText(v)==="")return null;const m=intakeText(v).replace(/,/g,"").match(/-?\d+(?:\.\d+)?/);return m?Number(m[0]):null}
function intakeRating(v){const x=intakeNumber(v);return x===null?null:Math.min(5,Math.max(.1,Math.round(x*10)/10))}
function intakeKv(text){const out={};String(text||"").split(/\r?\n/).forEach(line=>{const m=line.match(/^\s*([^:：=]{1,30})\s*[:：=]\s*(.*?)\s*$/);if(m)out[intakeNormText(m[1])]=m[2]});return out}
function intakePick(kv,keys,def=""){for(const k of keys){const nk=intakeNormText(k);if(kv[nk]!==undefined&&intakeText(kv[nk])!=="")return kv[nk]}return def}
function intakeFirstContentLine(text){return String(text||"").split(/\r?\n/).map(x=>x.trim()).find(x=>x&&!/^[^:：=]{1,30}\s*[:：=]/.test(x))||String(text||"").split(/\r?\n/).map(x=>x.trim()).find(Boolean)||""}
function intakeTargetAlias(v){const s=intakeNormText(v);const map={auto:"auto",task:"task",tasks:"task",todo:"task","할 일":"task","할일":"task",body:"body",weight:"body","체중":"body","다이어트":"body",exercise:"exercise",workout:"exercise","운동":"exercise",book:"book",reading:"book","책":"book","독서":"book",movie:"movie",film:"movie",screen:"movie",drama:"movie",anime:"movie",animation:"movie",series:"movie",documentary:"movie",variety:"movie","영화":"movie","드라마":"movie","애니":"movie","애니메이션":"movie","시리즈":"movie","다큐":"movie","다큐멘터리":"movie","예능":"movie","시청":"movie",diary:"diary","일기":"diary",wishlist:"wishlist",wish:"wishlist","wish-list":"wishlist","위시":"wishlist","위시리스트":"wishlist","찜":"wishlist",travelwish:"travelWish",travel:"travelWish","여행":"travelWish","여행 wish":"travelWish",certificate:"certificate","자격증":"certificate","시험":"certificate",university:"university",campus:"university",course:"university","대학교":"university","대학":"university","강의계획":"university","강의계획서":"university"};return map[s]||""}
function intakeInferTarget(text){const s=intakeNormText(text);if(/주차|수강기간|교시|강의계획|과제 출제|평가계획|대학교|대학관리/.test(s))return "university";if(/wish-?list|위시리스트|위시에|위시로|찜|구매 후보|구매후보|사고 싶|살까|사자|갖고 싶|해보고 싶/.test(s))return "wishlist";if(/체중|체지방|골격근|근육량|\bkg\b/.test(s))return "body";if(/걸음|steps?|km|근력|푸시업|플랭크|운동/.test(s))return "exercise";if(/완독|저자|도서|책 |독서|isbn|읽었|읽는 중|읽고 있|다 읽/.test(s))return "book";if(/영화|드라마|애니|애니메이션|다큐|예능|관람|감독|배우|넷플릭스|쿠팡플레이|시즌|시리즈|봤어|봤다|봤음|정주행|시청했/.test(s))return "movie";if(/여행|목적지|숙소|호텔|항공|맛집|여행지/.test(s))return "travelWish";if(/자격증|시험일|응시|jlpt|컴활|합격|불합격/.test(s))return "certificate";if(/일기|오늘의 기분|기분:|기분：/.test(s))return "diary";return "task"}
function intakeDayOffset(days=0){const d=new Date();d.setDate(d.getDate()+Number(days||0));const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0");return `${y}-${m}-${day}`}
function intakeDateFromWeekday(label){const map={일:0,월:1,화:2,수:3,목:4,금:5,토:6},key=String(label||"").replace(/요일/g,"").trim(),target=map[key];if(target===undefined)return "";const d=new Date(),delta=(d.getDay()-target+7)%7||7;d.setDate(d.getDate()-delta);const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0");return `${y}-${m}-${day}`}
function intakeNaturalRating(text){const s=String(text||"");const m=s.match(/(?:별점|평점)(?:은|는|이|가)?\s*[:：]?\s*(\d(?:\.\d)?)/i)||s.match(/(\d(?:\.\d)?)\s*점(?:\s|[.,!]|$)/);return m?intakeRating(m[1]):null}
function intakeNaturalReview(text){const s=String(text||"").replace(/\s+/g," ").trim(),clean=v=>String(v||"").trim().replace(/^[\s,;:："“'~-]+|[\s"”'~]+$/g,"").replace(/[.!]+$/g,"").trim();let m=s.match(/(?:한\s*줄\s*평|후기|감상|평가|소감|의견)(?:은|는|이|가)?\s*[:：]?\s*(.+)$/i);if(m)return clean(m[1]);m=s.match(/(?:별점|평점)(?:은|는|이|가)?\s*[:：]?\s*\d(?:\.\d)?\s*점?/i)||s.match(/\d(?:\.\d)?\s*점(?=\s|[,.;!]|$)/i);if(m){const tail=clean(s.slice((m.index||0)+m[0].length).replace(/^(?:이고|이며|인데|라서|해서)\s*/i,""));if(tail&&!/^(?:줬어|줬다|줌|주었어|주었다|정도|만점)$/i.test(tail))return tail}return ""}
function intakeNaturalAuthor(text){const s=String(text||"").replace(/\s+/g," ").trim(),rel=s.match(/(?:^|\s)([^.,!~\n]{1,50}?)\s*(?:작가|저자)의\s+[^.,!~\n]+/i);if(rel)return String(rel[1]||"").trim().replace(/^(?:오늘|어제|지난주\s*[월화수목금토일](?:요일)?|지난\s*[월화수목금토일](?:요일)?)\s*(?:에)?\s*/i,"").replace(/^[\s"“']+|[\s"”']+$/g,"");const m=s.match(/(?:저자|작가)(?!의)(?:는|은|이|가)?\s*[:：]?\s*["“']?([^.,!~\n]+?)["”']?(?=\s*(?:[.,!~]|$))/i);return m?String(m[1]||"").trim().replace(/^[\s"“']+|[\s"”']+$/g,""):""}
function intakeNaturalDate(text){const s=intakeNormText(text),last=s.match(/(?:지난주|지난)\s*(월|화|수|목|금|토|일)(?:요일)?/);if(last)return intakeDateFromWeekday(last[1]);if(/어제/.test(s))return intakeDayOffset(-1);if(/오늘/.test(s))return today();return ""}
function intakeNaturalMovie(text){const s=String(text||"").replace(/\s+/g," ").trim(),verb=/(?:봤어|봤다|봤음|봤는데|봤고|시청했어|시청했다|시청함|정주행했어|정주행했다)/i,vm=verb.exec(s);if(!vm)return null;const before=s.slice(0,vm.index).trim(),quoted=[...before.matchAll(/["“']([^"”']{1,120})["”']/g)].map(x=>String(x[1]||"").trim()).filter(Boolean);let title=quoted.at(-1)||"";if(!title){let cleaned=before.replace(/^(?:나\s*)?/i,"").replace(/^(?:(?:오늘|어제|지난주\s*[월화수목금토일](?:요일)?|지난\s*[월화수목금토일](?:요일)?)\s*(?:에)?\s*)/i,"").replace(/^(?:(?:넷플릭스|쿠팡플레이|디즈니\+?|티빙|웨이브|왓챠|애플\s*tv\+?|prime\s*video|프라임\s*비디오)\s*)/i,"").replace(/^(?:(?:영화|드라마|애니메이션|애니|시리즈|다큐(?:멘터리)?|예능)\s*)/i,"").replace(/^[-–—:：·\s]+/,"").replace(/(?:을|를)?\s*(?:다\s*)?$/i,"").trim();title=cleaned.replace(/^["“']|["”']$/g,"").trim()}const watchedDate=intakeNaturalDate(s)||today();return title?{title,rating:intakeNaturalRating(s),review:intakeNaturalReview(s),watchedDate,status:"watched"}:null}
function intakeNaturalBook(text){const s=String(text||"").replace(/\s+/g," ").trim(),verb=/(?:완독했어|완독했다|완독함|다\s*읽었어|다\s*읽었다|다\s*읽음|읽었어|읽었다|읽음)/i,vm=verb.exec(s);if(!vm)return null;const before=s.slice(0,vm.index).trim(),quoted=[...before.matchAll(/["“']([^"”']{1,160})["”']/g)].map(x=>String(x[1]||"").trim()).filter(Boolean);let title=quoted.at(-1)||"",author=intakeNaturalAuthor(s);if(!title){let cleaned=before.replace(/^(?:나\s*)?/i,"").replace(/^(?:(?:오늘|어제|지난주\s*[월화수목금토일](?:요일)?|지난\s*[월화수목금토일](?:요일)?)\s*(?:에)?\s*)/i,"").replace(/^(?:책|도서)\s*[-–—:：·]?\s*/i,"").trim(),rel=cleaned.match(/^(.{1,50}?)\s*(?:작가|저자)의\s+(.+?)(?:이라는|라는)\s*(?:책|도서)\s*(?:을|를)?$/i);if(rel){author=String(rel[1]||"").trim();title=String(rel[2]||"").trim()}else{const named=cleaned.match(/^(.+?)(?:이라는|라는)\s*(?:책|도서)\s*(?:을|를)?$/i);if(named)title=String(named[1]||"").trim();else{cleaned=cleaned.replace(/\s*(?:책|도서)?\s*(?:을|를)?\s*$/i,"").trim();title=cleaned.replace(/^["“']|["”']$/g,"").replace(/[.,!~]+$/g,"").trim()}}}return title?{title,author,rating:intakeNaturalRating(s),review:intakeNaturalReview(s),completedDate:intakeNaturalDate(s)||today(),status:"read"}:null}
function intakeMovieContentType(value,text=""){const explicit=movieContentType(value,"");if(explicit)return explicit;const s=intakeNormText(`${value||""} ${text||""}`);if(/애니메이션|애니|anime|animation|극장판/.test(s))return "애니메이션";if(/다큐멘터리|다큐|documentary/.test(s))return "다큐멘터리";if(/예능|버라이어티|variety/.test(s))return "예능";if(/드라마|drama/.test(s))return "드라마";if(/시리즈|시즌|series|season/.test(s))return "시리즈";if(/영화|movie|film|관람|봤어|봤다|봤음|시청/.test(s))return "영화";return "기타"}
function intakeJsonCandidate(text){try{return JSON.parse(text)}catch(e){return null}}
function intakeCampusDateTime(v){const raw=intakeText(v);if(!raw)return "";const normalized=normalizeDateFlexDateTime(raw);return normalized===null?raw:normalized}
function intakeCampusAssessmentType(v){const s=intakeNormText(v);if(/기말/.test(s))return "기말고사";if(/중간/.test(s))return "중간고사";if(/시험|고사/.test(s))return "시험";if(/과제|보고서|레포트/.test(s))return "과제";if(/퀴즈/.test(s))return "퀴즈";return intakeText(v)||"평가"}
function intakeCampusCourseIdentity(v){const raw=intakeText(v),codeMatch=raw.match(/[\(\[]\s*([A-Za-z]{0,4}\d{2,}[A-Za-z0-9_-]*)\s*[\)\]]\s*$/),code=codeMatch?String(codeMatch[1]||"").trim():"",name=raw.replace(/[\(\[]\s*[A-Za-z]{0,4}\d{2,}[A-Za-z0-9_-]*\s*[\)\]]\s*$/," ").replace(/\s+/g," ").trim(),key=name.toLocaleLowerCase("ko-KR").replace(/[\s·\-_/\(\)\[\]{}:："'“”‘’.,]+/g,"");return {raw,name:name||raw,code,key}}
function intakeCampusTermKey(v){const s=intakeNormText(v).replace(/년도|년/g,"-").replace(/학기/g,"").replace(/[^0-9-]+/g,"").replace(/-+/g,"-").replace(/^-|-$/g,"");const m=s.match(/(20\d{2})-?([12])$/);return m?`${m[1]}-${m[2]}`:s}
function intakeCampusCourseType(v){const s=intakeNormText(v);if(/부전공/.test(s))return "부전공";if(/전공/.test(s))return "전공";if(/교양/.test(s))return "교양";return "기타"}
function intakeCampusBundle(src={},rawText=""){
  const kv=typeof src==="object"&&!Array.isArray(src)?Object.fromEntries(Object.entries(src).map(([k,v])=>[intakeNormText(k),v])):{},text=rawText||intakeText(src?.text||src?.source||src?.raw||""),merged={...intakeKv(text),...kv};
  const semesterTerm=intakeText(intakePick(merged,["semesterterm","semester","term","학기","학기명"],""));
  const rawCourseName=intakeText(intakePick(merged,["coursename","course","subject","과목명","강좌명","교과목","교과목명"],"")),courseIdentity=intakeCampusCourseIdentity(rawCourseName),courseName=courseIdentity.name,courseCode=intakeText(intakePick(merged,["coursecode","subjectcode","과목코드","학과코드"],courseIdentity.code)),professor=intakeText(intakePick(merged,["professor","instructor","교수","교수명","담당교수"],"")),credits=intakeNumber(intakePick(merged,["credits","credit","학점"],"")),courseType=intakeCampusCourseType(intakePick(merged,["coursetype","이수구분","구분"],""));
  const normalizeWeek=(w={})=>{const x=typeof w==="object"&&w?Object.fromEntries(Object.entries(w).map(([k,v])=>[intakeNormText(k),v])):{},lect=intakePick(x,["lectures","lecturetitles","classes","교시","교시제목","강의목록"],"");let content=intakeText(intakePick(x,["content","lecture","수업내용","교사제목","교시내용"],""));if(Array.isArray(lect))content=lect.map((v,i)=>`${i+1}교시: ${intakeText(v)}`).filter(x=>!/: $/.test(x)).join("\n");else if(!content&&intakeText(lect))content=intakeText(lect);const start=intakeCampusDateTime(intakePick(x,["startat","startdatetime","start","수강시작","시작일시","수강 시작일시"],"")),end=intakeCampusDateTime(intakePick(x,["endat","enddatetime","end","수강종료","종료일시","마감","수강 종료일시"],""));return normalizeCampusCurriculum({week:intakeText(intakePick(x,["week","주차"],"")),topic:intakeText(intakePick(x,["topic","weeklytopic","주차제목","주차 제목"],"")),content,evaluation:intakeText(intakePick(x,["evaluation","assessment","평가계획","평가 계획"],"")),reference:intakeText(intakePick(x,["reference","materials","참고자료","주교재 및 참고자료"],"")),startAt:start,endAt:end,done:false})};
  let weeks=[];const rawWeeks=src?.weeks??src?.curriculum??src?.weekly_plan??src?.weeklyPlan;if(Array.isArray(rawWeeks))weeks=rawWeeks.map(normalizeWeek).filter(w=>w.week&&(w.topic||w.content||w.evaluation||w.reference||w.startAt||w.endAt));
  if(!weeks.length){const one=normalizeWeek(src);if(one.week&&(one.topic||one.content||one.evaluation||one.reference||one.startAt||one.endAt))weeks=[one]}
  const rawAssess=src?.assessments??src?.assignments??src?.evaluation_items??src?.evaluationItems??[];let assessments=Array.isArray(rawAssess)?rawAssess.map(a=>{const x=typeof a==="object"&&a?Object.fromEntries(Object.entries(a).map(([k,v])=>[intakeNormText(k),v])):{};const dueRaw=intakePick(x,["due","deadline","duedate","마감일","제출마감","응시마감"],""),dueDateTime=intakeCampusDateTime(dueRaw),dueDate=dueDateTime?String(dueDateTime).slice(0,10):intakeDate(dueRaw);return {week:intakeText(intakePick(x,["week","주차"],"")),type:intakeCampusAssessmentType(intakePick(x,["type","assessmenttype","평가유형","구분"],"평가")),title:intakeText(intakePick(x,["title","name","과제명","평가명","제목"],"")),due:dueDate||"",dueDateTime:dueDateTime||"",points:intakeText(intakePick(x,["points","score","배점"],"")),note:intakeText(intakePick(x,["note","비고","상태"],""))}}).filter(a=>a.title||a.type||a.week):[];
  for(const w of weeks){const ev=intakeText(w.evaluation);if(!ev||/없음|none|^-$/i.test(ev))continue;for(const part of ev.split(/[,/·]+/).map(x=>x.trim()).filter(Boolean)){const type=intakeCampusAssessmentType(part),key=`${w.week}|${type}`;if(!assessments.some(a=>`${a.week}|${a.type}`===key))assessments.push({week:w.week,type,title:"",due:"",dueDateTime:"",points:"",note:"마감일 미확인"})}}
  if(!courseName&&!weeks.length&&!assessments.length)return null;
  return {semesterTerm,courseName,sourceCourseName:rawCourseName,courseCode,professor,credits,courseType,weeks,assessments};
}
function intakeCampusContext(d){const semesters=state.campusSemesters||[],termKey=intakeCampusTermKey(d.semesterTerm),sem=(termKey&&semesters.find(s=>intakeCampusTermKey(s.term)===termKey))||campusActiveSemester(),wanted=intakeCampusCourseIdentity(d.courseName||d.sourceCourseName),matches=sem?.courses?.filter(c=>intakeCampusCourseIdentity(c.name).key&&intakeCampusCourseIdentity(c.name).key===wanted.key)||[],course=matches.length===1?matches[0]:null;return {sem,course,matches,wanted}}
function intakeCampusMergeStats(d){const {sem,course,matches,wanted}=intakeCampusContext(d),empty={newWeeks:0,fillFields:0,conflicts:0,sameWeeks:0,newCourse:false,matchLabel:""};if(!sem)return {blocker:"활성 대학교 학기가 없습니다. 대학 관리에서 학기를 먼저 등록해 주세요.",...empty};if(!d.courseName&&!d.sourceCourseName)return {blocker:"과목명을 확인하지 못했습니다. 강의계획서에 과목명이 보이도록 다시 접수해 주세요.",...empty};if(matches.length>1)return {blocker:`${wanted.name||d.courseName} 과목과 비슷한 기존 과목이 ${matches.length}개 있습니다. 대학교 대상 과목에서 직접 선택해 주세요.`,...empty};let newWeeks=0,fillFields=0,conflicts=0,sameWeeks=0;const fields=["startAt","endAt","topic","content","evaluation","reference"],rows=course?.curriculum||[];for(const w of d.weeks||[]){const ex=rows.find(r=>String(parseInt(r.week,10)||r.week)===String(parseInt(w.week,10)||w.week));if(!ex){newWeeks++;continue}let changed=false,conf=false;for(const f of fields){const incoming=intakeText(w[f]),old=intakeText(ex[f]);if(incoming&&!old){fillFields++;changed=true}else if(incoming&&old&&intakeNormText(incoming)!==intakeNormText(old)){conflicts++;conf=true}}if(!changed&&!conf)sameWeeks++}return {blocker:"",newWeeks,fillFields,conflicts,sameWeeks,newCourse:!course,matchLabel:course?`기존 과목 ‘${course.name}’ 자동 매칭`:`신규 과목 ‘${wanted.name||d.courseName}’ 생성 예정`}}
function intakeCampusTaskRows(bundle){const course=intakeText(bundle?.courseName)||"대학교",seen=new Set(),rows=[];for(const a of bundle?.assessments||[]){const type=intakeCampusAssessmentType(a.type),base=intakeText(a.title)||`${course}${a.week?` ${a.week}주차`:""} ${type}`,due=intakeDate(a.due)||"",time=a.dueDateTime&&String(a.dueDateTime).includes("T")?String(a.dueDateTime).split("T")[1]:"",weekKey=String(parseInt(a.week,10)||a.week||""),weekRow=(bundle?.weeks||[]).find(w=>String(parseInt(w.week,10)||w.week)===weekKey),scheduled=due?"":intakeDate(weekRow?.startAt||""),scheduleEnd=due?"":intakeDate(weekRow?.endAt||""),text=due?`${base}${time?` · ${due} ${time} 마감`:""}`.trim():base.trim(),key=`${intakeNormText(text)}|${due}|${scheduled}`;if(!seen.has(key)){seen.add(key);rows.push({target:"task",data:{text,due,scheduled,scheduleEnd,dueKnown:Boolean(due),sourceType:"university",courseName:course,week:weekKey,done:false,createdAt:new Date().toISOString()},source:"UNIVERSITY"})}}return rows}
function intakeBuildOne(target,src={},rawText=""){
  const kv=typeof src==="object"&&!Array.isArray(src)?Object.fromEntries(Object.entries(src).map(([k,v])=>[intakeNormText(k),v])):{};
  const text=rawText||intakeText(src?.text||src?.source||src?.raw||"");
  const mergedKv={...intakeKv(text),...kv};
  const now=new Date().toISOString();
  if(target==="task"){
    const title=intakeText(intakePick(mergedKv,["text","title","task","할 일","할일","내용"],text||intakeFirstContentLine(rawText)));
    return title?{text:title,due:intakeDate(intakePick(mergedKv,["due","date","마감","마감일","날짜"],"")),done:false,createdAt:now}:null;
  }
  if(target==="body"){
    const weight=intakeNumber(intakePick(mergedKv,["weight","체중","kg"],"")),fat=intakeNumber(intakePick(mergedKv,["fat","body fat","체지방","체지방률"],"")),muscle=intakeNumber(intakePick(mergedKv,["muscle","muscle mass","근육","근육량","골격근량"],""));
    if(weight===null&&fat===null&&muscle===null)return null;
    return normalizeBodyRecord({date:intakeDate(intakePick(mergedKv,["date","날짜","측정일"],today()))||today(),weight,fat,muscle},state.profile?.heightCm||188);
  }
  if(target==="exercise"){
    const steps=Math.max(0,Math.round(intakeNumber(intakePick(mergedKv,["steps","걸음","걸음 수","걸음수"],0))||0)),distance=Math.max(0,intakeNumber(intakePick(mergedKv,["distance","거리","km"],0))||0),note=intakeText(intakePick(mergedKv,["note","비고","메모","운동"],text));
    const strength=Boolean(src?.strength)||/근력|푸시업|플랭크|스쿼트|런지|웨이트/.test(intakeNormText(text+" "+note));if(!steps&&!distance&&!strength&&!note)return null;
    return {id:uid(),date:intakeDate(intakePick(mergedKv,["date","날짜","운동일"],today()))||today(),steps,distance,strength,note,createdAt:now,updatedAt:now};
  }
  if(target==="book"){
    const natural=intakeNaturalBook(text),title=intakeText(intakePick(mergedKv,["title","book","책","도서명","제목"],natural?.title||intakeFirstContentLine(text)));if(!title)return null;const statusRaw=intakeNormText(intakePick(mergedKv,["status","상태"],natural?.status||text)),status=/완독|read|읽음|완료/.test(statusRaw)?"read":"wish";
    return {id:uid(),status,title,author:intakeText(intakePick(mergedKv,["author","저자","작가"],natural?.author||"")),topic:intakeText(intakePick(mergedKv,["topic","분류","주제"],"교양"))||"교양",rating:status==="read"?intakeRating(intakePick(mergedKv,["rating","평점"],natural?.rating??"")):null,completedDate:status==="read"?(intakeDate(intakePick(mergedKv,["completeddate","date","완독일","날짜"],natural?.completedDate||intakeNaturalDate(text)))||""):"",review:intakeText(intakePick(mergedKv,["review","후기","한줄평","한 줄 평","감상","소감","의견","메모","이유"],natural?.review||"")),cover:"",createdAt:now,updatedAt:now};
  }
  if(target==="movie"){
    const natural=intakeNaturalMovie(text),title=intakeText(intakePick(mergedKv,["title","movie","작품","작품명","제목"],natural?.title||intakeFirstContentLine(text)));if(!title)return null;const statusRaw=intakeNormText(intakePick(mergedKv,["status","상태"],natural?.status||text)),status=/관람|watched|봤|완료|시청완료/.test(statusRaw)?"watched":"wish",typeRaw=intakePick(mergedKv,["contenttype","content type","type","유형","콘텐츠 유형","콘텐츠유형","장르구분"],"");
    return {id:uid(),status,contentType:intakeMovieContentType(typeRaw,text||JSON.stringify(src||{})),origin:intakeText(intakePick(mergedKv,["origin","국가","구분"],"국내"))||"국내",title,director:intakeText(intakePick(mergedKv,["director","감독"],"")),actors:intakeText(intakePick(mergedKv,["actors","actor","배우"],"")),rating:status==="watched"?intakeRating(intakePick(mergedKv,["rating","평점"],natural?.rating??"")):null,watchedDate:status==="watched"?(intakeDate(intakePick(mergedKv,["watcheddate","date","관람일","시청일","날짜"],natural?.watchedDate||intakeNaturalDate(text)))||""):"",review:intakeText(intakePick(mergedKv,["review","후기","감상","메모","기대평"],natural?.review||"")),poster:"",createdAt:now,updatedAt:now};
  }
  if(target==="university"){
    return intakeCampusBundle(src,text);
  }
  if(target==="diary"){
    const content=intakeText(intakePick(mergedKv,["content","내용","본문"],text));if(!content)return null;const moodRaw=intakeNormText(intakePick(mergedKv,["mood","기분"],""));const mood=/좋|행복|happy/.test(moodRaw)?"happy":/설렘|신남|excited/.test(moodRaw)?"excited":/피곤|tired/.test(moodRaw)?"tired":/슬픔|속상|sad/.test(moodRaw)?"sad":/화|angry/.test(moodRaw)?"angry":/평온|calm/.test(moodRaw)?"calm":"neutral";
    return {id:uid(),date:intakeDate(intakePick(mergedKv,["date","날짜"],today()))||today(),mood,title:intakeText(intakePick(mergedKv,["title","제목"],intakeFirstContentLine(content).slice(0,48)))||"AI 입력 기록",content,createdAt:now,updatedAt:now};
  }
  if(target==="wishlist"){
    const name=intakeText(intakePick(mergedKv,["name","item","product","title","제품명","품목","이름","후보"],intakeFirstContentLine(text)));if(!name)return null;const kindRaw=intakeNormText(intakePick(mergedKv,["kind","type","유형","구분"],"item")),kind=/experience|경험|체험|활동/.test(kindRaw)?"experience":"item",priorityRaw=intakeNormText(intakePick(mergedKv,["priority","우선순위","중요도"],"medium")),priority=/high|높|상/.test(priorityRaw)?"high":/low|낮|하/.test(priorityRaw)?"low":"medium",statusRaw=intakeNormText(intakePick(mergedKv,["status","상태"],"consider")),status=/purchased|구매완료|완료|샀/.test(statusRaw)?"purchased":/planned|예정|확정/.test(statusRaw)?"planned":/hold|보류/.test(statusRaw)?"hold":"consider";
    return normalizeWishItem({name,kind,category:intakeText(intakePick(mergedKv,["category","카테고리","분류"],"기타"))||"기타",price:intakeNumber(intakePick(mergedKv,["price","estimatedprice","estimated_price_krw","가격","예상가격"],"")),priority,status,reason:intakeText(intakePick(mergedKv,["reason","이유","추천이유","관심이유"],"")),note:intakeText(intakePick(mergedKv,["note","메모","설명","판단"],"")),sourceType:intakeText(intakePick(mergedKv,["sourcetype","source_type","출처유형"],"intake"))||"intake",sourceLabel:intakeText(intakePick(mergedKv,["sourcelabel","source_label","출처"],"")),purchasedDate:intakeDate(intakePick(mergedKv,["purchaseddate","구매일","완료일"],""))});
  }
  if(target==="travelWish"){
    const destination=intakeText(intakePick(mergedKv,["destination","목적지","여행지","지역"],intakeFirstContentLine(text)));if(!destination)return null;
    return normalizeTravelWish({destination,reason:intakeText(intakePick(mergedKv,["reason","이유","목적"],"")),expectedDate:intakeDate(intakePick(mergedKv,["expecteddate","date","예정일","날짜"],"")),transport:intakeText(intakePick(mergedKv,["transport","교통","항공"],"")),places:intakeText(intakePick(mergedKv,["places","장소","관광"],"")),foods:intakeText(intakePick(mergedKv,["foods","음식"],"")),restaurants:intakeText(intakePick(mergedKv,["restaurants","식당","맛집"],"")),lodging:intakeText(intakePick(mergedKv,["lodging","숙소","호텔"],"")),note:intakeText(intakePick(mergedKv,["note","메모"],""))});
  }
  if(target==="certificate"){
    const name=intakeText(intakePick(mergedKv,["name","certificate","자격증","시험","시험명","title","제목"],intakeFirstContentLine(text)));if(!name)return null;const statusRaw=intakeNormText(intakePick(mergedKv,["status","상태","결과"],"")),status=/합격|pass/.test(statusRaw)?"pass":/불합격|fail/.test(statusRaw)?"fail":/응시완료|taken|응시함/.test(statusRaw)?"taken":"planned";
    return normalizeCertificate({name,issuer:intakeText(intakePick(mergedKv,["issuer","기관","주관"],"")),grade:intakeText(intakePick(mergedKv,["grade","급수","등급"],"")),examDate:intakeDate(intakePick(mergedKv,["examdate","date","시험일","응시일","날짜"],"")),status,resultDate:intakeDate(intakePick(mergedKv,["resultdate","발표일"],"")),score:intakeText(intakePick(mergedKv,["score","점수"],"")),result:intakeText(intakePick(mergedKv,["result","결과"],""))});
  }
  return null;
}
function intakeBuildCandidates(text,target="auto"){
  const parsed=intakeJsonCandidate(text),rows=[];
  if(parsed!==null){
    const root=Array.isArray(parsed)?parsed:(Array.isArray(parsed?.items)?parsed.items:[parsed]);
    root.forEach(item=>{const explicit=intakeTargetAlias(item?.target||item?.type||target),resolved=explicit&&explicit!=="auto"?explicit:(target!=="auto"?target:intakeInferTarget(JSON.stringify(item)));const payload=item?.data&&typeof item.data==="object"?item.data:item;const row=intakeBuildOne(resolved,payload,"");if(row){rows.push({target:resolved,data:row,source:"JSON"});if(resolved==="university")rows.push(...intakeCampusTaskRows(row))}});
    return rows;
  }
  const resolved=target!=="auto"?target:intakeInferTarget(text);
  if(resolved==="task"&&target!=="auto"){
    const lines=String(text||"").split(/\r?\n/).map(x=>x.trim()).filter(Boolean).filter(x=>!/^[^:：=]{1,30}\s*[:：=]/.test(x));
    if(lines.length>1)return lines.map(line=>({target:"task",data:intakeBuildOne("task",{text:line},line),source:"TEXT"})).filter(x=>x.data);
  }
  const row=intakeBuildOne(resolved,{},text);if(!row)return [];rows.push({target:resolved,data:row,source:"TEXT"});if(resolved==="university")rows.push(...intakeCampusTaskRows(row));return rows;
}
function intakeDuplicateInfo(target,d){
  const eq=(a,b)=>intakeNormText(a)===intakeNormText(b);
  if(target==="task"){const hit=(state.tasks||[]).find(x=>eq(x.text,d.text)&&String(x.due||"")===String(d.due||""));return hit?`같은 할 일${d.due?` · ${d.due}`:""}`:""}
  if(target==="body"){const hit=(state.body||[]).find(x=>String(x.date||"")===String(d.date||""));return hit?`같은 날짜 체중 기록 · ${d.date}`:""}
  if(target==="exercise"){const hit=(state.exercise||[]).find(x=>String(x.date||"")===String(d.date||""));return hit?`같은 날짜 운동 기록 · ${d.date}`:""}
  if(target==="book"){const hit=(state.books||[]).find(x=>eq(x.title,d.title));return hit?`같은 책 제목 · ${d.title}`:""}
  if(target==="movie"){const hit=(state.movies||[]).find(x=>eq(x.title,d.title));return hit?`같은 작품 제목 · ${d.title}`:""}
  if(target==="diary"){const hit=(state.diaries||[]).find(x=>String(x.date||"")===String(d.date||"")&&eq(x.title,d.title));return hit?`같은 날짜·제목 일기` : ""}
  if(target==="wishlist"){const hit=(state.wishlistItems||[]).find(x=>eq(x.name,d.name)&&x.kind===d.kind);return hit?`이미 Wish-list에 있는 항목 · ${d.name}`:""}
  if(target==="travelWish"){const hit=(state.travelWishlist||[]).find(x=>eq(x.destination,d.destination));return hit?`이미 Wish에 있는 목적지 · ${d.destination}`:""}
  if(target==="certificate"){const hit=(state.certificates||[]).find(x=>eq(x.name,d.name)&&String(x.examDate||"")===String(d.examDate||""));return hit?`같은 시험 기록${d.examDate?` · ${d.examDate}`:""}`:""}
  if(target==="university"){const s=intakeCampusMergeStats(d);return !s.blocker&&s.newWeeks===0&&s.fillFields===0&&s.conflicts===0?"주차 계획이 이미 반영되어 있습니다.":""}
  return "";
}
function intakeBlockerInfo(target,d){if(target==="university")return intakeCampusMergeStats(d).blocker||"";return ""}
function intakeRowNote(target,d){if(target!=="university")return "";const s=intakeCampusMergeStats(d);if(s.blocker)return "";const bits=[];if(s.matchLabel)bits.push(s.matchLabel);if(s.newWeeks)bits.push(`새 주차 ${s.newWeeks}건`);if(s.fillFields)bits.push(`빈 필드 보완 ${s.fillFields}개`);if(s.conflicts)bits.push(`기존값 유지 충돌 ${s.conflicts}개`);if(s.sameWeeks)bits.push(`동일 주차 ${s.sameWeeks}건`);return bits.join(" · ")}
function intakePrimary(target,d){if(target==="task")return d.text;if(target==="body")return `${d.date} · ${d.weight??"-"}kg`;if(target==="exercise")return `${d.date} · ${d.steps||0}걸음${d.distance?` · ${d.distance}km`:""}`;if(target==="book"||target==="movie")return d.title;if(target==="diary")return `${d.date} · ${d.title}`;if(target==="wishlist")return `${d.name}${d.price!==null?` · ${won(d.price)}`:""}`;if(target==="travelWish")return d.destination;if(target==="certificate")return `${d.name}${d.examDate?` · ${d.examDate}`:""}`;if(target==="university"){const ctx=intakeCampusContext(d),name=ctx.course?.name||intakeCampusCourseIdentity(d.courseName||d.sourceCourseName).name||"과목명 미확인";return `${name} · ${(d.weeks||[]).length}주차 계획`}return "-"}
function intakeSafeData(target,d){const x=structuredClone(d);delete x.id;delete x.createdAt;delete x.updatedAt;delete x.cover;delete x.poster;if(target==="body"){delete x.bmi;delete x.fatMass}return x}
function intakeExplicitWishIntent(text){return /wish-?list|위시리스트|위시에|위시로|찜(?:해|으로|에)?|저장해|후보로\s*(?:넣|저장)/i.test(String(text||""))}
function intakePurchaseReviewIntent(text){const s=intakeNormText(text);return !intakeExplicitWishIntent(text)&&/(?:살까|사도\s*될까|살지\s*말지|구매\s*(?:할까|고민|검토)|사고\s*싶은데|이거\s*어때|어떤 걸\s*살까)/.test(s)}
function intakeRequestedTargets(text){const s=intakeNormText(text),out=[];if(/자격증|시험|jlpt|컴활/.test(s))out.push("certificate");if(/할\s*일|할일|todo|task/.test(s))out.push("task");if(/완독|다\s*읽|독서|서재|책/.test(s))out.push("book");if(/봤|시청|영화|드라마|애니/.test(s))out.push("movie");if(/대학교|대학관리|강의계획|주차/.test(s))out.push("university");return [...new Set(out)]}
function intakeOverlayUserInstruction(target,data,userText){const d=structuredClone(data||{}),s=String(userText||"");if(!s.trim())return d;if(target==="book"){
  if(/완독|다\s*읽었|다\s*읽음|읽었어|읽었다/.test(s)){d.status="read";d.completedDate=intakeNaturalDate(s)||d.completedDate||today()}
  const rating=intakeNaturalRating(s);if(rating!==null)d.rating=rating;
  const review=intakeNaturalReview(s);if(review)d.review=review;
  const author=intakeNaturalAuthor(s);if(author)d.author=author;
}else if(target==="movie"){
  if(/봤어|봤다|봤음|시청했|정주행/.test(s)){d.status="watched";d.watchedDate=intakeNaturalDate(s)||d.watchedDate||today()}
  const rating=intakeNaturalRating(s);if(rating!==null)d.rating=rating;
  const review=intakeNaturalReview(s);if(review)d.review=review;
}else if(target==="certificate"){
  if(/합격/.test(s))d.status="pass";else if(/불합격/.test(s))d.status="fail";else if(/응시\s*(?:완료|했)/.test(s))d.status="taken";
}
return d}
function intakeCertificateTaskRow(cert){if(!cert?.name)return null;const label=[cert.name,cert.grade].filter(Boolean).join(" ").trim();return {target:"task",data:intakeBuildOne("task",{text:`${label} 시험 응시`,due:cert.examDate||""},""),source:"USER_TEXT+VISION"}}
function intakeRowsFromVision(structuredItems=[],extractedTexts=[],userText="",target="auto",hints=[]){const rows=[],requested=intakeRequestedTargets(userText),hintTargets=[...new Set(hints.map(intakeTargetAlias).filter(x=>x&&x!=="auto"))];if(structuredItems.length){for(const item of structuredItems){const payload=item?.data&&typeof item.data==="object"?item.data:item,explicit=intakeTargetAlias(item?.target||item?.type||""),inferred=intakeInferTarget(JSON.stringify(item||{}));let resolved=target!=="auto"?target:(explicit||hintTargets[0]||inferred);if(target==="auto"&&requested.length){const compatible=requested.find(x=>x!=="task"&&(x===resolved||x===explicit||x===inferred||hintTargets.includes(x)));if(compatible)resolved=compatible;else if(requested.length===1&&requested[0]!=="task")resolved=requested[0]}
  const built=intakeBuildOne(resolved,payload,"");if(!built)continue;const data=intakeOverlayUserInstruction(resolved,built,userText);rows.push({target:resolved,data,source:userText?"USER_TEXT+VISION":"VISION"});if(resolved==="university")rows.push(...intakeCampusTaskRows(data));}
  if(requested.includes("task")){for(const r of [...rows])if(r.target==="certificate"){const task=intakeCertificateTaskRow(r.data);if(task?.data)rows.push(task)}}
  return rows}
const evidence=extractedTexts.join("\n\n").trim(),fused=[evidence,userText?`[사용자 지시]\n${userText}`:""].filter(Boolean).join("\n\n");if(target==="auto"&&requested.length){const built=[];for(const requestedTarget of requested.filter(x=>x!=="task"))built.push(...intakeBuildCandidates(fused,requestedTarget));if(requested.includes("task")){const certRows=built.filter(r=>r.target==="certificate");for(const r of certRows){const task=intakeCertificateTaskRow(r.data);if(task?.data)built.push(task)}if(!certRows.length)built.push(...intakeBuildCandidates(userText||fused,"task"))}if(built.length)return built}return intakeBuildCandidates(fused,target)}
function intakeRenderPurchaseReviewDraft(draft){intakeHandoffDraft=draft;intakePreviewRows=[];intakeRenderRoute([]);const list=$("intakePreviewList"),summary=$("intakePreviewSummary"),pill=$("intakePreviewState"),btn=$("intakeCommitBtn"),raw=$("intakeRawPreview");if(list){list.innerHTML=`<article class="intake-preview-row is-ready intake-handoff-row"><div class="intake-preview-icon">→</div><div class="intake-preview-copy"><div class="intake-preview-head"><b>구매 검토 Draft</b><span>ROUTED</span><em class="intake-agent-chip">유나 접수 → AI 구매팀 → 하니 종합 → 대표 결재</em></div><h4>${esc(draft.title||"구매 여부 검토")}</h4><div class="intake-campus-note">Wish-list에는 저장하지 않았습니다. 이미지 증거와 오빠의 설명을 묶어 AI 결재실 요청 Draft만 준비했습니다.</div><pre>${esc(draft.preview||draft.request)}</pre><div class="form-actions"><button class="btn primary" id="intakeHandoffReviewBtn" type="button">AI 결재실에서 검토하기</button></div></div></article>`;const go=$("intakeHandoffReviewBtn");if(go)go.onclick=()=>{showView("agentReview");const input=$("agentRequestInput");if(input){input.value=draft.request;input.focus();input.scrollIntoView({behavior:"smooth",block:"center"})}toast("구매 검토 요청 Draft를 AI 결재실로 옮겼습니다. 아직 Case를 생성하지 않았어요.")}}
if(summary)summary.textContent="구매 검토 Draft 1건 · 사용자 지시 > 이미지 증거 순서로 반영 · Life OS 미저장";if(pill){pill.textContent="PURCHASE REVIEW DRAFT";pill.className="pill finance"}if(btn){btn.disabled=true;btn.textContent="Life OS 저장 대상 아님"}if(raw)raw.textContent=JSON.stringify({route:"PURCHASE_REVIEW",source_priority:["USER_INSTRUCTION","USER_TEXT","IMAGE_EVIDENCE","HANI_CONTEXT","AI_INFERENCE"],request:draft.request},null,2)}
function intakeRenderPreview(){const list=$("intakePreviewList"),summary=$("intakePreviewSummary"),pill=$("intakePreviewState"),btn=$("intakeCommitBtn"),raw=$("intakeRawPreview");if(!list)return;const ready=intakePreviewRows.filter(x=>!x.duplicate&&!x.blocker),fresh=ready.filter(x=>x.selected!==false),dup=intakePreviewRows.filter(x=>x.duplicate),blocked=intakePreviewRows.filter(x=>x.blocker);intakeRenderRoute(intakePreviewRows);if(!intakePreviewRows.length){list.innerHTML='<div class="empty">유나에게 말하거나 자료를 붙인 뒤 ‘유나에게 맡기기’를 눌러 주세요.</div>';if(summary)summary.textContent="아직 접수한 자료가 없습니다.";if(pill){pill.textContent="WAITING";pill.className="pill"}if(btn){btn.disabled=true;btn.textContent="대표 승인 & 저장"}if(raw)raw.textContent="[]";return}list.innerHTML=intakePreviewRows.map((r,i)=>{const stateKey=r.blocker?"BLOCKED":r.duplicate?"DUPLICATE":r.selected===false?"EXCLUDED":"READY",note=intakeRowNote(r.target,r.data),canSelect=!r.blocker&&!r.duplicate;return `<article class="intake-preview-row ${r.blocker?'is-blocked':r.duplicate?'is-duplicate':r.selected===false?'is-excluded':'is-ready'}"><div class="intake-preview-icon">${r.blocker?'!':r.duplicate?'⚠️':r.selected===false?'−':'✓'}</div><div class="intake-preview-copy"><div class="intake-preview-head"><b>${esc(INTAKE_TARGET_LABELS[r.target]||r.target)}</b><span>${stateKey}</span><em class="intake-agent-chip">${esc(intakeRouteLabel(r.target))}</em>${canSelect?`<label class="intake-select-toggle"><input type="checkbox" data-intake-select="${i}" ${r.selected===false?'':'checked'}><span>저장 포함</span></label>`:''}</div><h4>${esc(intakePrimary(r.target,r.data))}</h4><pre>${esc(JSON.stringify(intakeSafeData(r.target,r.data),null,2))}</pre>${note?`<div class="intake-campus-note">${esc(note)}</div>`:''}${r.blocker?`<div class="intake-blocker-note">${esc(r.blocker)}</div>`:r.duplicate?`<div class="intake-duplicate-note">${esc(r.duplicate)}</div>`:''}</div></article>`}).join("");list.querySelectorAll("[data-intake-select]").forEach(el=>el.onchange=()=>{const i=Number(el.dataset.intakeSelect);if(intakePreviewRows[i])intakePreviewRows[i].selected=!!el.checked;intakeRenderPreview()});if(summary)summary.textContent=`분석 ${intakePreviewRows.length}건 · 저장 선택 ${fresh.length}건${ready.length!==fresh.length?` · 제외 ${ready.length-fresh.length}건`:""} · 중복 제외 ${dup.length}건${blocked.length?` · 확인 필요 ${blocked.length}건`:""}`;if(pill){pill.textContent=blocked.length?"CHECK NEEDED":fresh.length?"PREVIEW READY":"NO SELECTION";pill.className=`pill ${blocked.length||!fresh.length?'danger':''}`}if(btn){btn.disabled=!!blocked.length||!fresh.length;btn.textContent=blocked.length?"확인 필요 항목 있음":fresh.length?`선택 ${fresh.length}개 승인 & 저장`:"저장할 선택 항목 없음"}if(raw)raw.textContent=JSON.stringify(intakePreviewRows.map(r=>({target:r.target,agent:intakeAgentKey(r.target),selected:r.selected!==false,blocker:r.blocker||null,duplicate:r.duplicate||null,note:intakeRowNote(r.target,r.data)||null,data:intakeSafeData(r.target,r.data)})),null,2)}
async function intakeAnalyze(){const userText=intakeText($("intakeSourceText")?.value),target=$("intakeTarget")?.value||"auto",imageFiles=intakeImageFiles.length?intakeImageFiles:(intakeImageFile?[intakeImageFile]:[]);if(!userText&&!imageFiles.length)return alert("유나에게 말하거나 원문·JSON 또는 스크린샷/이미지를 넣어 주세요.");try{intakeVisionMeta=null;intakeHandoffDraft=null;haniWorkShow({agent:"yuna",title:"유나가 새 자료를 접수하고 있어요!",step:"YUNA · IMAGE + TEXT FUSION",message:imageFiles.length?`${imageFiles.length}개 이미지와 오빠의 설명을 함께 읽을게요. 오빠가 직접 말한 내용이 이미지 추출보다 우선합니다.`:"오빠가 말한 의도를 먼저 판단하고 담당 Agent를 찾아볼게요."});let structuredItems=[],extractedTexts=[],confidences=[],warnings=[],hints=[];
if(imageFiles.length){for(let i=0;i<imageFiles.length;i++){const f=imageFiles[i];haniWorkShow({agent:"yuna",title:`유나가 자료 ${i+1}/${imageFiles.length} 읽는 중`,step:"YUNA · VISION EVIDENCE",message:`${f.name} · 사용자 설명은 별도로 보존 중`});const imageDataUrl=await intakeImageToDataUrl(f),result=await agentApi("extract_intake_image",{image_data_url:imageDataUrl,target_hint:target,file_name:f.name}),x=agentObj(result.extraction),structured=intakeText(x.structured_json),extracted=intakeText(x.extracted_text);if(x.financial_detected&&(!structured||structured==="[]"))throw new Error(`${f.name}: 투자·가계부 성격의 이미지가 감지됐습니다. 금융 자동입력은 아직 잠겨 있습니다.`);if(structured&&structured!=="[]"){const parsed=intakeJsonCandidate(structured);if(Array.isArray(parsed))structuredItems.push(...parsed);else if(parsed)structuredItems.push(parsed)}if(extracted)extractedTexts.push(extracted);const c=Number(x.confidence);if(Number.isFinite(c))confidences.push(c);if(Array.isArray(x.warnings))warnings.push(...x.warnings);if(x.target_hint)hints.push(x.target_hint)}intakeVisionMeta={confidence:confidences.length?confidences.reduce((a,b)=>a+b,0)/confidences.length:null,warnings:[...new Set(warnings)].slice(0,6),sourcePriority:"USER_TEXT_OVER_IMAGE"}}
const evidencePreview=structuredItems.length?JSON.stringify(structuredItems,null,2):extractedTexts.join("\n\n");if(intakePurchaseReviewIntent(userText)&&target==="auto"){const name=structuredItems.map(x=>x?.data?.name||x?.name||x?.data?.title||x?.title).find(Boolean)||"이미지 속 제품";const request=[`구매 검토 요청: ${userText||`${name} 구매를 검토해줘`}`,evidencePreview?`[유나 이미지 증거 · 사실 확인용]\n${evidencePreview}`:"",`[처리 원칙]\n사용자 지시를 이미지 추출보다 우선하고, 제품 후보를 Wish-list에 자동 저장하지 말 것.`].filter(Boolean).join("\n\n");intakeRenderPurchaseReviewDraft({title:String(name),request,preview:[userText,evidencePreview].filter(Boolean).join("\n\n")});haniWorkFinish(true,"구매 검토 Draft 준비 완료!");haniWorkHide(700);return}
let rows=[];if(imageFiles.length){rows=intakeRowsFromVision(structuredItems,extractedTexts,userText,target,hints)}else{let text=userText;const aiTextTarget=target==="auto"?intakeInferTarget(text):target;if(aiTextTarget==="wishlist"){haniWorkShow({agent:"yuna",title:"유나가 대화에서 Wish 후보를 추리고 있어요!",step:"YUNA · CONVERSATION INTAKE",message:"명시적으로 저장을 원하는 후보만 Preview로 만들게요."});const result=await agentApi("extract_intake_text",{source_text:text,target_hint:"wishlist"}),x=agentObj(result.extraction),structured=intakeText(x.structured_json);if(structured&&structured!=="[]"){text=structured;target="wishlist"}else throw new Error("대화에서 Wish-list에 올릴 확실한 후보를 찾지 못했습니다. 후보로 삼고 싶은 항목을 조금 더 구체적으로 말해 주세요.");const c=Number(x.confidence);intakeVisionMeta={confidence:Number.isFinite(c)?c:null,warnings:Array.isArray(x.warnings)?x.warnings.slice(0,6):[]}}rows=intakeBuildCandidates(text,target)}
if(!rows.length)throw new Error("저장 가능한 항목을 구조화하지 못했습니다. 담당 업무를 직접 선택하거나 더 구체적으로 말해 주세요.");const campusCourse=intakeText($("intakeCampusCourse")?.value);if(campusCourse)rows.filter(r=>r.target==="university").forEach(r=>{r.data.courseName=campusCourse});intakePreviewRows=rows.map(r=>{const blocker=intakeBlockerInfo(r.target,r.data),duplicate=intakeDuplicateInfo(r.target,r.data);return {...r,agent:intakeAgentKey(r.target),blocker,duplicate,selected:!blocker&&!duplicate}});intakeRefreshCampusCourseOptions();const agentKeys=[...new Set(intakePreviewRows.map(r=>r.agent))],specialist=agentKeys.length===1?teamByKey(agentKeys[0])?.name||"담당 Agent":"담당 Agent들";haniWorkShow({agent:agentKeys.length===1?agentKeys[0]:"hani",title:`${specialist} 검토 → 하니 QA`,step:"AI TEAM · FUSED REVIEW",message:"이미지에서 확인한 사실 위에 오빠의 직접 지시를 우선 적용했습니다."});intakeRenderPreview();if($("intakePreviewSummary")&&imageFiles.length){const c=Number(intakeVisionMeta?.confidence),pct=Number.isFinite(c)?` · 이미지 추출 신뢰 ${Math.round(Math.max(0,Math.min(1,c))*100)}%`:"",warns=Array.isArray(intakeVisionMeta?.warnings)&&intakeVisionMeta.warnings.length?` · 확인: ${intakeVisionMeta.warnings.slice(0,2).join(" / ")}`:"";$("intakePreviewSummary").textContent+=` · 사용자 지시 우선${pct}${warns}`}haniWorkShow({agent:"hani",title:"하니 최종 QA 완료 · 대표 Preview 준비",step:"HANI · FINAL QA",message:"아직 Life OS 데이터에는 쓰지 않았어요. Preview를 확인해 주세요."});haniWorkFinish(true,`Preview ${rows.length}건 준비 완료!`);haniWorkHide(800)}catch(e){intakePreviewRows=[];intakeHandoffDraft=null;intakeRenderPreview();haniWorkFinish(false,"자료 구조화를 확인해 주세요.");haniWorkHide(900);alert(e?.message||String(e))}}
function intakeApplyRow(r){const d=structuredClone(r.data),now=new Date().toISOString();if(r.target==="task")state.tasks.push({...d,id:uid(),createdAt:d.createdAt||now});else if(r.target==="body")state.body.push(normalizeBodyRecord({...d,id:uid()},state.profile?.heightCm||188));else if(r.target==="exercise")state.exercise.push({...d,id:uid(),createdAt:d.createdAt||now,updatedAt:now});else if(r.target==="book")state.books.push({...d,id:uid(),cover:"",createdAt:d.createdAt||now,updatedAt:now});else if(r.target==="movie")state.movies.push({...d,id:uid(),poster:"",createdAt:d.createdAt||now,updatedAt:now});else if(r.target==="diary")state.diaries.push({...d,id:uid(),createdAt:d.createdAt||now,updatedAt:now});else if(r.target==="wishlist")state.wishlistItems.push(normalizeWishItem({...d,id:uid(),sourceType:d.sourceType||"intake",createdAt:d.createdAt||now,updatedAt:now}));else if(r.target==="travelWish")state.travelWishlist.push(normalizeTravelWish({...d,id:uid()}));else if(r.target==="certificate")state.certificates.push(normalizeCertificate({...d,id:uid()}));else if(r.target==="university"){const ctx=intakeCampusContext(d),sem=ctx.sem;if(!sem)throw new Error("대학교 대상 학기를 확인하지 못했습니다.");if(ctx.matches.length>1)throw new Error("대학교 대상 과목이 여러 개와 일치합니다. 직접 선택해 주세요.");let course=ctx.course;if(!course){const name=ctx.wanted.name||intakeText(d.courseName);if(!name)throw new Error("신규 과목명을 확인하지 못했습니다.");course=normalizeCampusCourse({id:uid(),name,type:intakeText(d.courseType)||"기타",credits:d.credits??0,professor:intakeText(d.professor),curriculum:[],createdAt:now,updatedAt:now});sem.courses.push(course)}const fields=["startAt","endAt","topic","content","evaluation","reference"];for(const w of d.weeks||[]){const wk=String(parseInt(w.week,10)||w.week),old=(course.curriculum||[]).find(x=>String(parseInt(x.week,10)||x.week)===wk);if(old){for(const f of fields){if(!intakeText(old[f])&&intakeText(w[f]))old[f]=w[f]}}else if(wk&&(w.topic||w.content||w.evaluation||w.reference||w.startAt||w.endAt))course.curriculum.push(normalizeCampusCurriculum({...w,week:wk,done:false}))}course.updatedAt=now;sem.updatedAt=now}else throw new Error(`지원하지 않는 Intake 대상: ${r.target}`)}
function intakeCommit(){const blocked=intakePreviewRows.filter(x=>x.blocker);if(blocked.length)return alert("확인 필요 항목이 있어 저장을 멈췄습니다. Preview의 BLOCKED 사유를 먼저 확인해 주세요.");const fresh=intakePreviewRows.filter(x=>!x.duplicate&&!x.blocker&&x.selected!==false);if(!fresh.length)return alert("저장할 새 항목이 없습니다. 중복 항목은 자동 제외됩니다.");const summary=[...new Set(fresh.map(x=>INTAKE_TARGET_LABELS[x.target]||x.target))].join(" · ");if(!confirm(`Preview의 새 항목 ${fresh.length}개를 HANI OS에 저장할까요?\n\n대상: ${summary}\n중복 항목은 저장하지 않습니다.\n\n이 버튼을 누르기 전까지 Life OS 데이터는 변경되지 않았습니다.`))return;const previous=structuredClone(state);try{haniWorkShow({agent:"hani",title:"대표 승인 확인 · HANI OS에 기록 중입니다.",step:"HANI · APPROVED COMMIT",message:"기존 데이터는 유지하고 Preview의 새 항목만 추가합니다."});fresh.forEach(intakeApplyRow);state.meta={...freshState().meta,...(state.meta||{}),lastImportAt:new Date().toISOString()};const ok=commit(`성민 오피스에서 새 기록 ${fresh.length}개를 저장했습니다.`);if(!ok)throw new Error("브라우저 저장 검증을 통과하지 못했습니다.");intakePreviewRows=[];if($("intakeSourceText"))$("intakeSourceText").value="";if($("intakeSourceFile"))$("intakeSourceFile").value="";intakeResetImage();intakeRenderPreview();haniWorkFinish(true,`새 기록 ${fresh.length}개 저장 완료! 💜`);haniWorkHide(850)}catch(e){state=previous;renderAll();intakeRenderPreview();haniWorkFinish(false,"저장 검증 실패 · 변경을 되돌렸어요.");haniWorkHide(1100);alert(e?.message||String(e))}}
function intakeRevokeImageUrls(){for(const u of intakeImageObjectUrls){try{URL.revokeObjectURL(u)}catch(_){}}intakeImageObjectUrls=[];if(intakeImageObjectUrl){try{URL.revokeObjectURL(intakeImageObjectUrl)}catch(_){}intakeImageObjectUrl=""}}
function intakeRenderImageFiles(){const box=$("intakeImagePreview");intakeRevokeImageUrls();if(!box)return;if(!intakeImageFiles.length){box.hidden=true;box.innerHTML="";return}box.hidden=false;box.innerHTML=intakeImageFiles.map((f,i)=>{const u=URL.createObjectURL(f);intakeImageObjectUrls.push(u);return `<div class="intake-image-item"><img src="${esc(u)}" alt="접수한 스크린샷 미리보기"><div><b>${esc(f.name||`스크린샷 ${i+1}`)}</b><span>${Math.max(1,Math.round((f.size||0)/1024)).toLocaleString()} KB</span></div><button type="button" class="intake-image-remove" data-intake-image-index="${i}" aria-label="${i+1}번 이미지 삭제">삭제</button></div>`}).join("")+`<div class="intake-image-batch-note">${intakeImageFiles.length}장 · 분석 전에는 서버 전송/저장하지 않음 · 개별 삭제 가능</div>`;box.querySelectorAll("[data-intake-image-index]").forEach(btn=>btn.onclick=()=>intakeRemoveImage(Number(btn.dataset.intakeImageIndex)))}
function intakeResetImage(){intakeImageFile=null;intakeImageFiles=[];intakeVisionMeta=null;intakeRevokeImageUrls();const box=$("intakeImagePreview");if(box){box.hidden=true;box.innerHTML=""}}
function intakeRemoveImage(index){intakeHandoffDraft=null;if(!Number.isInteger(index)||index<0||index>=intakeImageFiles.length)return;intakeImageFiles.splice(index,1);intakeImageFile=intakeImageFiles[0]||null;if($("intakeSourceFile"))$("intakeSourceFile").value="";intakePreviewRows=[];intakeRenderPreview();intakeRenderImageFiles();toast(`이미지 ${index+1} 삭제 · ${intakeImageFiles.length}장 남음`)}
function intakeClipboardFile(file,index=0){if(!file)return null;const type=String(file.type||"image/png").toLowerCase(),ext=type.includes("webp")?"webp":type.includes("jpeg")||type.includes("jpg")?"jpg":"png",d=new Date(),stamp=`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}-${String(d.getHours()).padStart(2,"0")}${String(d.getMinutes()).padStart(2,"0")}${String(d.getSeconds()).padStart(2,"0")}`;try{return new File([file],`clipboard-${stamp}-${index+1}.${ext}`,{type:file.type||`image/${ext==="jpg"?"jpeg":ext}`,lastModified:Date.now()})}catch(_){return file}}
async function intakeAcceptFiles(files,{appendImages=false,source="파일"}={}){const rows=[...(files||[])].filter(Boolean);if(!rows.length)return;intakePreviewRows=[];intakeRenderPreview();const images=rows.filter(f=>/^image\//i.test(f.type||"")),texts=rows.filter(f=>!/^image\//i.test(f.type||""));if(images.length&&texts.length)return alert("이미지와 텍스트 파일은 한 번에 섞지 말고 따로 접수해 주세요.");if(images.length){const next=appendImages?[...intakeImageFiles,...images]:images;if(next.length>6)return alert("이미지는 한 번에 최대 6장까지 접수할 수 있습니다.");for(const f of next){if(!/^image\/(png|jpeg|webp)$/i.test(f.type||""))return alert("PNG·JPG·WEBP 이미지만 지원합니다.");if(f.size>12*1024*1024)return alert(`${f.name||"이미지"}: 이미지 원본은 12MB 이하만 사용할 수 있습니다.`)}intakeImageFiles=next;intakeImageFile=next[0]||null;intakeVisionMeta=null;intakeRenderImageFiles();toast(`${source} 이미지 ${images.length}장 접수 · 현재 ${next.length}/6`);return}if(intakeImageFiles.length)return alert("이미지가 이미 접수되어 있습니다. 텍스트 파일을 불러오려면 ‘새 접수’ 후 다시 시도해 주세요.");if(texts.length>1)return alert("텍스트/JSON/CSV 파일은 한 번에 1개만 접수해 주세요.");const f=texts[0];intakeResetImage();if(f.size>2*1024*1024)return alert("텍스트 입력 파일은 2MB 이하만 사용할 수 있습니다.");try{const body=await f.text();if($("intakeSourceText"))$("intakeSourceText").value=body;toast(`${f.name} 내용을 불러왔습니다.`)}catch(e){alert("파일을 읽지 못했습니다.\n"+(e?.message||e))}}
function intakeHandlePaste(e){const items=[...(e?.clipboardData?.items||[])],images=items.filter(x=>x.kind==="file"&&/^image\//i.test(x.type||"")).map(x=>x.getAsFile()).filter(Boolean);if(!images.length)return;e.preventDefault();const files=images.map((f,i)=>intakeClipboardFile(f,i)).filter(Boolean);intakeAcceptFiles(files,{appendImages:true,source:"클립보드"})}
function intakeHandleDragOver(e){e.preventDefault();if(e.dataTransfer)e.dataTransfer.dropEffect="copy";$("intakePasteZone")?.classList.add("is-dragover")}
function intakeHandleDragLeave(e){if(!e.currentTarget?.contains(e.relatedTarget))$("intakePasteZone")?.classList.remove("is-dragover")}
function intakeHandleDrop(e){e.preventDefault();$("intakePasteZone")?.classList.remove("is-dragover");const files=[...(e.dataTransfer?.files||[])];if(files.length)intakeAcceptFiles(files,{appendImages:true,source:"드래그"})}async function intakeImageToDataUrl(file){if(!/^image\/(png|jpeg|webp)$/i.test(file?.type||""))throw new Error("PNG·JPG·WEBP 이미지만 Vision 입력으로 사용할 수 있습니다.");if(file.size>12*1024*1024)throw new Error("원본 이미지는 12MB 이하만 사용할 수 있습니다.");let bitmap=null,url="";try{if(typeof createImageBitmap==="function")bitmap=await createImageBitmap(file);else{url=URL.createObjectURL(file);bitmap=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error("이미지 디코딩에 실패했습니다."));img.src=url})}const w=bitmap.width||bitmap.naturalWidth,h=bitmap.height||bitmap.naturalHeight;if(!w||!h)throw new Error("이미지 크기를 확인하지 못했습니다.");const encode=(maxDim,quality)=>{const scale=Math.min(1,maxDim/Math.max(w,h)),cw=Math.max(1,Math.round(w*scale)),ch=Math.max(1,Math.round(h*scale)),canvas=document.createElement("canvas");canvas.width=cw;canvas.height=ch;const ctx=canvas.getContext("2d");ctx.fillStyle="#fff";ctx.fillRect(0,0,cw,ch);ctx.drawImage(bitmap,0,0,cw,ch);return canvas.toDataURL("image/jpeg",quality)};let data=encode(2000,.9);if(data.length>2800000)data=encode(1700,.84);if(data.length>3300000)throw new Error("Vision 전송용 이미지가 너무 큽니다. 화면을 나눠 캡처해서 다시 시도해 주세요.");return data}finally{if(bitmap&&typeof bitmap.close==="function")try{bitmap.close()}catch(_){}if(url)URL.revokeObjectURL(url)}}
function intakeClear(){intakePreviewRows=[];intakeHandoffDraft=null;if($("intakeSourceText"))$("intakeSourceText").value="";if($("intakeSourceFile"))$("intakeSourceFile").value="";if($("intakeTarget"))$("intakeTarget").value="auto";if($("intakeCampusCourse"))$("intakeCampusCourse").value="";intakeResetImage();intakeRefreshCampusCourseOptions();intakeRenderPreview()}
async function intakeLoadFile(){const input=$("intakeSourceFile"),files=[...(input?.files||[])];if(!files.length)return;await intakeAcceptFiles(files,{appendImages:false,source:"파일 선택"})}function intakeRefreshCampusCourseOptions(){const wrap=$("intakeCampusCourseWrap"),sel=$("intakeCampusCourse"),target=$("intakeTarget")?.value||"auto",sem=campusActiveSemester(),hasCampusPreview=intakePreviewRows.some(r=>r.target==="university");if(wrap)wrap.hidden=target!=="university"&&!hasCampusPreview;if(!sel)return;const keep=sel.value,rows=sem?.courses||[];sel.innerHTML='<option value="">이미지에서 과목명 자동 확인</option>'+rows.map(c=>`<option value="${esc(c.name)}">${esc(c.name)}</option>`).join("");if(rows.some(c=>c.name===keep))sel.value=keep}
function intakeInit(){if(!$("intake"))return;const y=$("intakeYunaAvatar"),desk=$("intakeDeskCard"),zone=$("intakePasteZone");if(y)y.style.backgroundImage=sidebarAgentImages.yuna?`url('${sidebarAgentImages.yuna}')`:"none";if($("intakeAnalyzeBtn"))$("intakeAnalyzeBtn").onclick=intakeAnalyze;if($("intakeCommitBtn"))$("intakeCommitBtn").onclick=intakeCommit;if($("intakeClearBtn"))$("intakeClearBtn").onclick=intakeClear;if($("intakeSourceFile"))$("intakeSourceFile").onchange=intakeLoadFile;if($("intakeTarget"))$("intakeTarget").onchange=()=>{intakePreviewRows=[];intakeRenderPreview();intakeRefreshCampusCourseOptions()};if(desk&&!desk.dataset.clipboardReady){desk.dataset.clipboardReady="1";desk.addEventListener("paste",intakeHandlePaste)}if(zone&&!zone.dataset.dropReady){zone.dataset.dropReady="1";zone.addEventListener("dragenter",intakeHandleDragOver);zone.addEventListener("dragover",intakeHandleDragOver);zone.addEventListener("dragleave",intakeHandleDragLeave);zone.addEventListener("drop",intakeHandleDrop);zone.addEventListener("click",e=>{if(!e.target.closest(".intake-file-picker"))zone.focus()})}intakeRefreshCampusCourseOptions();intakeRenderPreview();intakeRenderImageFiles()}

// =========================================================
// HANI OS v2.9.46 · AI TEAM Work Overlay v0.2
const HANI_WORK_AGENT_STYLE={hani:["#7159df","#f2efff"],hina:["#9b70d9","#f5effc"],jieun:["#a77d54","#fbf4ec"],nauen:["#3b9d7e","#edf9f4"],haru:["#dd843b","#fff3e9"],suyeon:["#7557cf","#f3efff"],minji:["#d66f68","#fff0ef"],sua:["#527dbd","#eef5ff"],yuna:["#9a7ad5","#f7f2ff"]};
const HANI_WORK_LINES={hani:["오빠, 전체 흐름은 내가 잡을게 💜","하니가 앞뒤 데이터까지 같이 보고 있어요~","조금만 기다려주세용~ 안전하게 확인 중!"],hina:["확인하지 않은 것을 PASS라고 부르지 않습니다.","히나가 하나씩 검증하고 있어요 ✨","운영 반영 전 마지막 체크 중입니다."],jieun:["숫자는 조용히, 꼼꼼하게 볼게요.","지금 써도 되는지까지 같이 확인할게요."],nauen:["무리 없는 방향인지 같이 볼게요 🌿","지속 가능한 선택인지 확인 중이에요."],haru:["실제로 쓰기 편한지까지 보고 있어요 ☕","생활에서 자주 쓰게 될지 살펴보는 중!"],suyeon:["Simple-first. 구조부터 안전하게 볼게요.","기술 조건을 하나씩 맞춰보고 있어요."],minji:["맥락까지 놓치지 않고 정리 중이에요 🎬"],sua:["실무 흐름을 깔끔하게 정리하고 있어요."],yuna:["오빠! 자료부터 제가 정리해둘게요 🫡","담당 선배님께 넘기기 전에 빠진 값부터 볼게요!","애매한 건 마음대로 쓰지 않고 확인 표시할게요."]};
let haniWorkHideTimer=0;
function haniWorkAgentKey(message=""){const m=String(message||"");if(/Verification|HINA|QA|검증|Gate/i.test(m))return "hina";if(/재무|예산|비용|자산|가계부/i.test(m))return "jieun";if(/건강|운동|체중|식단/i.test(m))return "nauen";if(/기술|Architecture|구조|제품 적합/i.test(m))return "suyeon";return "hani"}
function haniWorkShow({agent="hani",title="",step="AI TEAM · WORKING",message=""}={}){const overlay=$("haniWorkOverlay"),card=$("haniWorkCard");if(!overlay||!card)return;clearTimeout(haniWorkHideTimer);const member=Array.isArray(team)?team.find(x=>x.key===agent):null,img=(typeof sidebarAgentImages!=="undefined"&&sidebarAgentImages[agent])||(typeof agentImages!=="undefined"&&agentImages[agent])||"",style=HANI_WORK_AGENT_STYLE[agent]||HANI_WORK_AGENT_STYLE.hani,lines=HANI_WORK_LINES[agent]||HANI_WORK_LINES.hani,line=lines[Math.floor(Math.random()*lines.length)];card.classList.remove("done","failed");card.style.setProperty("--work-accent",style[0]);card.style.setProperty("--work-soft",style[1]);if($("haniWorkAvatar"))$("haniWorkAvatar").style.backgroundImage=img?`url('${img}')`:"none";if($("haniWorkStep"))$("haniWorkStep").textContent=step;if($("haniWorkTitle"))$("haniWorkTitle").textContent=title||`${member?.name||"하니"}가 작업 중이에요~`;if($("haniWorkMessage"))$("haniWorkMessage").textContent=message||"요청을 안전하게 처리하고 있어요.";if($("haniWorkLine"))$("haniWorkLine").textContent=`“${line}”`;if($("haniWorkStateMark"))$("haniWorkStateMark").textContent="✓";overlay.dataset.agent=agent;overlay.classList.add("show");overlay.setAttribute("aria-hidden","false")}
function haniWorkUpdate(message="",step=""){const agent=haniWorkAgentKey(message);haniWorkShow({agent,title:message||"AI TEAM이 작업 중이에요~",step:step||"AI TEAM · WORKING",message:"현재 단계를 안전하게 처리하고 있습니다."})}
function haniWorkFinish(ok=true,message=""){const overlay=$("haniWorkOverlay"),card=$("haniWorkCard");if(!overlay?.classList.contains("show")||!card)return;card.classList.remove("done","failed");card.classList.add(ok?"done":"failed");if($("haniWorkStateMark"))$("haniWorkStateMark").textContent=ok?"✓":"!";if($("haniWorkStep"))$("haniWorkStep").textContent=ok?"COMPLETE":"CHECK NEEDED";if($("haniWorkTitle"))$("haniWorkTitle").textContent=message||(ok?"작업이 완료됐어요! 💜":"작업을 멈추고 확인이 필요해요.")}
function haniWorkHide(delay=320){clearTimeout(haniWorkHideTimer);haniWorkHideTimer=setTimeout(()=>{const overlay=$("haniWorkOverlay");if(overlay){overlay.classList.remove("show");overlay.setAttribute("aria-hidden","true")}},delay)}

// HANI Deployment Center v0.6.0 · Zero-Copy PR-backed Supabase Release Queue + Native Recovery Package
// Isolated from Life OS state. Does not call save() and never writes hani_state.
const DEPLOY_BRIDGE_FUNCTION="hani-deploy-bridge";
const DEPLOY_REQUIRED_STORAGE_KEY="hani_os_life_v23";
const DEPLOY_REQUIRED_INTERNAL_VERSION="2.9.15-safe-baseline-bootstrap";
const DEPLOY_SESSION_KEY="hani_deploy_center_v03";
const DEPLOY_PACKAGE_FORMAT="HANI_MODULAR_RELEASE_PACKAGE_V1";
let deployPackageCandidate=null;
let deployCandidateText="";
let deployRuntime={health:null,probe:null,candidate:null,qa:null,stage:null,pending:null,queue:null,queueItems:[],merged:null,busy:false};

function deployFmtBytes(bytes){const n=Number(bytes)||0;if(n<1024)return `${n} B`;if(n<1024*1024)return `${(n/1024).toFixed(1)} KB`;return `${(n/1024/1024).toFixed(2)} MB`}
function deployShortSha(v){const s=String(v||"");return s?s.slice(0,10):"-"}
function deployLoadSession(){try{const raw=sessionStorage.getItem(DEPLOY_SESSION_KEY);if(!raw)return;const v=JSON.parse(raw);deployRuntime.stage=v?.stage||null;deployRuntime.merged=v?.merged||null}catch(e){}}
function deploySaveSession(){try{sessionStorage.setItem(DEPLOY_SESSION_KEY,JSON.stringify({stage:deployRuntime.stage,merged:deployRuntime.merged}))}catch(e){}}
function deployClass(el,state){if(!el)return;el.classList.remove("ok","warn","bad");if(state)el.classList.add(state)}
function deployQueueRender(){
  const card=$("deployQueueCard");if(!card)return;const q=deployRuntime.queue,items=Array.isArray(deployRuntime.queueItems)?deployRuntime.queueItems:[];
  if(!q){card.dataset.state="empty";if($("deployQueueTitle"))$("deployQueueTitle").textContent="Queue 비어 있음";if($("deployQueueBadge"))$("deployQueueBadge").textContent="CLEAR";if($("deployQueueNotes"))$("deployQueueNotes").textContent=items.length?`최근 Release 기록 ${items.length}건 · 현재 처리할 후보는 없습니다.`:"새 AI Preview가 제출되면 자동으로 기록됩니다.";if($("deployQueueVersion"))$("deployQueueVersion").textContent="VERSION -";if($("deployQueuePr"))$("deployQueuePr").textContent="PR -";if($("deployQueueQa"))$("deployQueueQa").textContent="HINA -";if($("deployQueueSha"))$("deployQueueSha").textContent="SHA -";if($("deployQueueResult")){ $("deployQueueResult").className="deploy-result ok";$("deployQueueResult").textContent="ZERO-COPY READY · Release Package 다운로드/재업로드가 필요하지 않습니다."}return}
  const st=String(q.status||"").toUpperCase(),ready=st==="READY",blocked=st==="BLOCKED",stale=st==="STALE",merged=st==="MERGED";card.dataset.state=ready?"ready":blocked||stale?"blocked":merged?"done":"pending";if($("deployQueueTitle"))$("deployQueueTitle").textContent=q.candidate_version?`v${q.candidate_version} · ${st}`:`Release · ${st}`;if($("deployQueueBadge"))$("deployQueueBadge").textContent=ready?"HINA PASS":st;if($("deployQueueNotes"))$("deployQueueNotes").textContent=q.release_notes||"변경 메모 없음";if($("deployQueueVersion"))$("deployQueueVersion").textContent=`VERSION ${q.candidate_version?`v${q.candidate_version}`:"?"}`;if($("deployQueuePr"))$("deployQueuePr").textContent=`PR #${q.pr_number||"-"}`;if($("deployQueueQa"))$("deployQueueQa").textContent=`HINA ${q.qa_state||"-"}`;if($("deployQueueSha"))$("deployQueueSha").textContent=`SHA ${deployShortSha(q.package_sha256||q.index_sha256)}`;if($("deployQueueResult")){ $("deployQueueResult").className=`deploy-result ${ready||merged?"ok":blocked||stale?"bad":""}`;$("deployQueueResult").innerHTML=ready?`<strong>QUEUE READY</strong> · AI Preview 제출 → Queue 기록 → HINA 검증 완료<br>대표 승인 전 main은 변경되지 않습니다.`:merged?`<strong>QUEUE MERGED</strong> · 대표 승인과 Production read-back 완료`:stale?`<strong>QUEUE STALE</strong> · 현재 main보다 오래된 후보라 자동 제외됩니다.`:`<strong>QUEUE ${esc(st||"PENDING")}</strong> · HINA Gate 또는 기준선을 확인해 주세요.`}
}

function deployExecutiveRender(){const card=$("deployExecutiveCard");if(!card)return;const h=deployRuntime.health,stage=deployRuntime.stage,qa=deployRuntime.qa,merged=deployRuntime.merged,pending=deployRuntime.pending,queue=deployRuntime.queue;let state="pending",icon="🟡",title="승인/배포 대기",summary=deployRuntime.busy?"배포 상태를 자동 확인하고 있습니다.":"새 배포 후보를 기다리고 있습니다.";const currentVersion=(typeof HANI_DISPLAY_VERSION!=="undefined"?HANI_DISPLAY_VERSION:"2.9.59");if(merged){if(merged.production_readback==="PASS"){state="done";icon="🟢";title="배포 완료";summary="운영 사이트 정상 반영 · 최종 검증까지 완료됐습니다."}else{state="failed";icon="🔴";title="배포 실패";summary="운영 반영 검증에 문제가 있어 추가 배포를 중단했습니다."}}else if(h&&(!h.github_reachable||!h.main_sha)){state="failed";icon="🔴";title="배포 실패";summary="배포 연결 또는 운영 기준선을 확인하지 못했습니다."}else if(pending?.error){state="failed";icon="🔴";title="배포 실패";summary="배포 Inbox 확인 중 오류가 발생했습니다. 기술 상세에서 원인을 확인할 수 있습니다."}else if(stage&&(stage.ready_for_approval===false||!qa||qa.state!=="HINA_QA_PASS")){state="failed";icon="🔴";title="배포 실패";summary="검증 또는 패키지 무결성 조건에서 문제가 발견되어 대표 승인이 차단됐습니다."}else if(stage&&qa?.state==="HINA_QA_PASS"&&stage.ready_for_approval!==false){summary=`v${stage.candidate_version||"?"} 검증 완료 · 대표 승인만 남았습니다.`}else if(queue&&String(queue.status||"").toUpperCase()==="READY"){summary=`v${queue.candidate_version||"?"} Release Queue READY · 대표 승인 후보를 확인하세요.`}else if(h?.github_reachable&&pending&&!pending.pending){state="done";icon="🟢";title="배포 완료";summary="운영 사이트 정상 반영 · 현재 처리할 배포 결재가 없습니다."}if($("deployExecutiveIcon"))$("deployExecutiveIcon").textContent=icon;if($("deployExecutiveState"))$("deployExecutiveState").textContent=title;if($("deployExecutiveVersion"))$("deployExecutiveVersion").textContent=`현재 운영 버전 v${currentVersion}`;if($("deployExecutiveSummary"))$("deployExecutiveSummary").textContent=summary;card.dataset.state=state}
function deploySetBusy(busy,silentWork=false){deployRuntime.busy=!!busy;["deployExecRefreshBtn","deployInboxRefreshBtn","deployHealthBtn","deployProbeBtn","deployHinaQaBtn","deployStageBtn","deployMergeBtn","deployResetBtn","deployDiscardBtn"].forEach(id=>{const b=$(id);if(b)b.dataset.busy=busy?"1":"0"});if(!silentWork){if(busy)haniWorkShow({agent:"hina",title:"히나가 배포 전 검증 중입니다.",step:"HINA · RELEASE CHECK",message:"운영 기준선과 배포 후보를 안전하게 확인하고 있어요."});else haniWorkHide()}deployCenterRender()}
async function deployBridgeApi(action,payload={}){
  if(!cloudClient||!cloudUser)throw new Error("먼저 HANI OS Cloud 로그인을 완료해 주세요.");
  const cfg=cloudConfig(),{data:{session},error}=await cloudClient.auth.getSession();
  if(error)throw error;if(!session?.access_token)throw new Error("로그인 세션을 확인하지 못했습니다.");
  const res=await fetch(`${cfg.url}/functions/v1/${DEPLOY_BRIDGE_FUNCTION}`,{method:"POST",headers:{"Content-Type":"application/json","apikey":cfg.key,"Authorization":`Bearer ${session.access_token}`},body:JSON.stringify({action,...payload})});
  const out=await res.json().catch(()=>({}));
  if(!res.ok||!out?.ok){const err=new Error(out?.error||out?.message||`배포 브리지 요청 실패 (${res.status})`);err.payload=out;haniWorkFinish(false,"배포 검증을 멈추고 확인할게요.");throw err}
  return out;
}
function deployNormalizeReleasePath(value=""){return String(value||"").trim().replace(/\\/g,"/").replace(/^\.\//,"")}
function deployPackagePathAllowed(path=""){const p=deployNormalizeReleasePath(path);if(!p||p.startsWith("/")||p.includes("..")||p.startsWith("."))return false;if(p==="index.html")return true;if(/^hani-[A-Za-z0-9._-]+\.(?:js|css)$/i.test(p))return true;if(/^(?:js|css)\/[A-Za-z0-9._/-]+\.(?:js|css)$/i.test(p))return true;return false}
async function deploySha256Bytes(bytes){const digest=await crypto.subtle.digest("SHA-256",bytes);return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,"0")).join("")}
async function deployPackageHash(files=[]){const enc=new TextEncoder(),entries=[];for(const f of [...files].sort((a,b)=>a.path.localeCompare(b.path))){const bytes=enc.encode(String(f.content??""));entries.push({path:f.path,bytes:bytes.byteLength,sha256:await deploySha256Bytes(bytes)})}const canonical=entries.map(e=>`${e.path}\t${e.bytes}\t${e.sha256}`).join("\n");return {entries,package_sha256:await deploySha256Bytes(enc.encode(canonical)),total_bytes:entries.reduce((n,e)=>n+e.bytes,0)}}
function deployPackageClear(){deployPackageCandidate=null;const f=$("deployPackageFile");if(f)f.value="";if($("deployPackageName"))$("deployPackageName").textContent="-";if($("deployPackageFiles"))$("deployPackageFiles").textContent="-";if($("deployPackageSha"))$("deployPackageSha").textContent="대기";if($("deployPackageBase"))$("deployPackageBase").textContent="-";if($("deployPackageResult")){ $("deployPackageResult").className="deploy-result";$("deployPackageResult").textContent="패키지를 선택하면 HANI OS가 내용·허용 경로·Package SHA·기준 main을 먼저 확인합니다."}deployCenterRender()}
async function deployCenterReadPackage(file){const out=$("deployPackageResult");deployPackageCandidate=null;if(!file){deployPackageClear();return}try{haniWorkShow({agent:"hani",title:"AI Release Package를 확인하고 있어요.",step:"HANI · PACKAGE INTAKE",message:"파일 구성과 Package SHA를 로컬에서 먼저 확인합니다."});if(out){out.className="deploy-result";out.textContent="릴리스 패키지 구조와 SHA를 확인하고 있습니다…"}const raw=await file.text(),pkg=JSON.parse(raw);if(pkg?.format!==DEPLOY_PACKAGE_FORMAT)throw new Error(`지원하지 않는 패키지 형식입니다. (${pkg?.format||"format 없음"})`);const files=Array.isArray(pkg.files)?pkg.files.map(f=>({path:deployNormalizeReleasePath(f?.path),content:String(f?.content??"")})):[];if(!files.length)throw new Error("패키지 파일이 비어 있습니다.");if(files.length>80)throw new Error("패키지 파일 수가 허용 범위를 초과합니다.");const paths=files.map(f=>f.path),invalid=paths.filter(p=>!deployPackagePathAllowed(p)),dups=paths.filter((p,i)=>paths.indexOf(p)!==i);if(invalid.length)throw new Error(`허용되지 않은 release 경로: ${invalid.join(", ")}`);if(dups.length)throw new Error(`중복 release 경로: ${[...new Set(dups)].join(", ")}`);if(!paths.includes("index.html"))throw new Error("패키지에 index.html이 없습니다.");const invariantSource=files.filter(f=>/\.(?:html|js)$/i.test(f.path)).map(f=>f.content).join("\n");if(!invariantSource.includes(DEPLOY_REQUIRED_STORAGE_KEY)||!invariantSource.includes(DEPLOY_REQUIRED_INTERNAL_VERSION))throw new Error("HANI OS 핵심 데이터 불변조건을 패키지 HTML/JS 전체에서 확인하지 못했습니다.");const hash=await deployPackageHash(files),expected=String(pkg.package_sha256||"").toLowerCase();if(expected&&hash.package_sha256!==expected)throw new Error(`Package SHA 불일치 · expected ${expected.slice(0,12)}… / local ${hash.package_sha256.slice(0,12)}…`);deployPackageCandidate={format:DEPLOY_PACKAGE_FORMAT,label:String(pkg.label||"").slice(0,60),release_notes:String(pkg.release_notes||"").slice(0,1800),base_main_sha:String(pkg.base_main_sha||pkg.expected_main_sha||"").trim(),package_sha256:hash.package_sha256,files,total_bytes:hash.total_bytes,file_name:file.name};if($("deployPackageName"))$("deployPackageName").textContent=deployPackageCandidate.label||file.name;if($("deployPackageFiles"))$("deployPackageFiles").textContent=`${files.length}개 · ${deployFmtBytes(hash.total_bytes)}`;if($("deployPackageSha"))$("deployPackageSha").textContent=`PASS · ${hash.package_sha256.slice(0,10)}`;if($("deployPackageBase"))$("deployPackageBase").textContent=deployPackageCandidate.base_main_sha?deployShortSha(deployPackageCandidate.base_main_sha):"현재 main 사용";if(out){out.className="deploy-result ok";out.innerHTML=`<strong>PACKAGE LOCAL PASS</strong> · ${esc(deployPackageCandidate.label||file.name)}<br>${files.length} files · ${esc(deployFmtBytes(hash.total_bytes))} · SHA ${esc(hash.package_sha256.slice(0,16))}…`}haniWorkFinish(true,"릴리스 패키지 확인 완료! 💜")}catch(e){deployPackageCandidate=null;if(out){out.className="deploy-result bad";out.textContent=e.message||String(e)}if($("deployPackageSha"))$("deployPackageSha").textContent="FAIL";haniWorkFinish(false,"패키지를 멈추고 확인할게요.")}finally{haniWorkHide(700);deployCenterRender()}}
async function deployCenterStagePackage(){const pkg=deployPackageCandidate,out=$("deployPackageResult");if(!pkg)return;deployRuntime.qa=null;deployRenderQaReport(null);try{deploySetBusy(true);haniWorkShow({agent:"hani",title:"Preview 릴리스를 준비하고 있어요.",step:"HANI · RELEASE PRODUCER",message:"현재 main 기준선 확인 후 HINA Gate로 전달합니다."});if(out){out.className="deploy-result";out.textContent="운영 main 기준선을 확인하고 있습니다…"}const h=await deployBridgeApi("health");deployRuntime.health=h;if(!h.github_reachable||!h.main_sha)throw new Error(h.github_error||"GitHub 기준선을 확인하지 못했습니다.");if(pkg.base_main_sha&&pkg.base_main_sha!==h.main_sha)throw new Error(`이 패키지는 이전 main 기준으로 준비되었습니다. package ${deployShortSha(pkg.base_main_sha)} / current ${deployShortSha(h.main_sha)}`);haniWorkShow({agent:"hina",title:"히나가 모듈 패키지를 독립 검증 중입니다.",step:"HINA · MODULAR GATE",message:"데이터 불변조건·Secret·운영 main 차이를 다시 확인합니다."});if(out)out.textContent="HINA Modular Gate 검증 후 Preview 브랜치와 PR을 생성합니다…";const r=await deployBridgeApi("stage_modular_release",{label:pkg.label||`v${HANI_DISPLAY_VERSION}-release`,release_notes:pkg.release_notes||"HANI OS internal Release Package",expected_main_sha:h.main_sha,files:pkg.files});if(r.package_sha256!==pkg.package_sha256)throw new Error("Bridge read-back Package SHA가 로컬 검증값과 다릅니다.");deployRuntime.stage={pr_number:r.pr_number,pr_url:r.pr_url,branch:r.branch,release_commit_sha:"",html_sha256:r.index_sha256||"",candidate_version:r.qa?.candidate_version||String(pkg.label||"").match(/v?(\d+\.\d+\.\d+)/)?.[1]||"",release_notes:pkg.release_notes||"",source:"OS_PACKAGE",ready_for_approval:false};deployRuntime.qa=r.qa||null;deployRuntime.pending=null;deployRuntime.merged=null;deploySaveSession();deployRenderQaReport(r.qa||null);if(out){out.className="deploy-result ok";out.innerHTML=`<strong>PREVIEW PR READY</strong> · HINA Gate PASS · PR #${esc(r.pr_number)}<br>Package SHA ${esc(String(r.package_sha256||"").slice(0,16))}… · Inbox 최종 재검증 중${r.pr_url?`<br><a href="${esc(r.pr_url)}" target="_blank" rel="noopener">GitHub Preview PR 열기 ↗</a>`:""}`}deployPackageClear();await deployCenterDiscover(true);haniWorkFinish(true,"Preview 준비 완료! 대표 승인만 남았어요. 💜")}catch(e){deployRuntime.qa=e.payload?.qa||null;deployRenderQaReport(deployRuntime.qa);if(out){out.className="deploy-result bad";out.textContent=e.message||String(e)}haniWorkFinish(false,"Preview 생성을 멈추고 확인할게요.")}finally{deploySetBusy(false)}}
function deployExtractDisplayVersions(html){
  const first=rx=>(String(html||"").match(rx)||[])[1]||"";
  return {title:first(/<title>[^<]*?v(\d+\.\d+\.\d+)[^<]*<\/title>/i),login:first(/<div class="login-brand">[\s\S]{0,700}?Life Edition v(\d+\.\d+\.\d+)/i),sidebar:first(/<div class="brand-copy">[\s\S]{0,500}?Life Edition v(\d+\.\d+\.\d+)/i),sideFoot:first(/<div class="foot">\s*HANI OS\s*·\s*v(\d+\.\d+\.\d+)/i),mainFooter:first(/<div class="footer">[^<]*?Life Edition v(\d+\.\d+\.\d+)/i),displayConst:first(/const\s+HANI_DISPLAY_VERSION\s*=\s*["'](\d+\.\d+\.\d+)["']/)};
}
function deployExtractRuntimeVersionLiterals(html){
  const versions=[];
  for(const m of String(html||"").matchAll(/\bui_version\s*:\s*["'](\d+\.\d+\.\d+)["']/g))versions.push(m[1]);
  return versions;
}
function deployValidateCandidate(html,fileName=""){
  const issues=[],warnings=[],bytes=new TextEncoder().encode(String(html||"")).byteLength;
  if(!html||html.length<5000)issues.push("HTML 본문이 비정상적으로 짧습니다.");
  if(!/<!doctype\s+html/i.test(html))issues.push("DOCTYPE html을 찾지 못했습니다.");
  if(!html.includes(DEPLOY_REQUIRED_STORAGE_KEY))issues.push(`핵심 localStorage 키 ${DEPLOY_REQUIRED_STORAGE_KEY}가 없습니다.`);
  if(!html.includes(DEPLOY_REQUIRED_INTERNAL_VERSION))issues.push(`내부 데이터 버전 ${DEPLOY_REQUIRED_INTERNAL_VERSION}가 없습니다.`);
  if(!html.includes("HANI OS"))issues.push("HANI OS 식별 문자열을 찾지 못했습니다.");
  if(bytes>9500000)issues.push("HTML 크기가 배포 브리지 허용 범위를 초과합니다.");
  const versions=deployExtractDisplayVersions(html),version=versions.title||versions.displayConst||"";
  const versionKeys=["title","login","sidebar","sideFoot","mainFooter","displayConst"],missing=versionKeys.filter(k=>!versions[k]),mismatch=versionKeys.filter(k=>versions[k]&&versions[k]!==version);
  if(missing.length)issues.push(`표시 버전 지점 누락: ${missing.join(", ")}`);
  if(mismatch.length)issues.push(`표시 버전 불일치: ${mismatch.map(k=>`${k}=v${versions[k]}`).join(", ")}`);
  const runtimeVersionLiterals=deployExtractRuntimeVersionLiterals(html),staleRuntimeVersions=runtimeVersionLiterals.filter(v=>v!==version);
  if(staleRuntimeVersions.length)issues.push(`런타임 감사 메타데이터 버전 불일치: ui_version=${[...new Set(staleRuntimeVersions)].map(v=>`v${v}`).join(", ")} / 후보 v${version||"?"}`);
  const requiredIds=["loginGate","app","sidebar","agentReview","agentPolicyRegistry","deployment"],missingIds=requiredIds.filter(id=>!new RegExp(`\\bid=["']${id}["']`).test(html));if(missingIds.length)issues.push(`핵심 UI Anchor 누락: ${missingIds.join(", ")}`);
  const so=(html.match(/<script(?:\s[^>]*)?>/gi)||[]).length,sc=(html.match(/<\/script>/gi)||[]).length,sto=(html.match(/<style(?:\s[^>]*)?>/gi)||[]).length,stc=(html.match(/<\/style>/gi)||[]).length;if(so!==sc||sto!==stc)issues.push(`태그 균형 오류: script ${so}/${sc}, style ${sto}/${stc}`);
  if(/github_pat_[A-Za-z0-9_]{20,}/.test(html)||/\bsk-[A-Za-z0-9_-]{20,}/.test(html))issues.push("브라우저 HTML에 Secret 형식 문자열이 포함되어 있습니다.");
  // Parse inline JS without executing it. Existing external scripts are skipped.
  try{const doc=new DOMParser().parseFromString(html,"text/html");if(!doc)issues.push("DOMParser가 HTML을 파싱하지 못했습니다.");else{[...doc.querySelectorAll("script:not([src])")].forEach((s,i)=>{try{new Function(s.textContent||"")}catch(e){issues.push(`Inline JS #${i+1} 문법 오류: ${e.message||e}`)}})}}catch(e){warnings.push(`DOM/JS 사전검사 경고: ${e.message||e}`)}
  const title=(html.match(/<title>([^<]+)<\/title>/i)||[])[1]||"";
  return {ok:issues.length===0,issues,warnings,bytes,title,version,versions,fileName,local_layer:issues.length?"FAIL":"PASS"};
}
function deployProgress(step){const box=$("deployProgress");if(!box)return;[...box.children].forEach((el,i)=>{el.className="";if(i<step)el.classList.add("done");else if(i===step)el.classList.add("active")})}
function deployRenderQaReport(qa){const root=$("deployHinaReport");if(!root)return;if(!qa?.checks?.length){root.innerHTML="";return}root.innerHTML=qa.checks.map(c=>`<div class="hina-qa-check ${String(c.status||"").toLowerCase()}"><span class="state">${esc(c.status||"-")}</span><b>${esc(c.label||c.id||"검사")}</b><span>${esc(c.detail||"")}</span></div>`).join("")}
function deployInboxKpi(id,value,state=""){const el=$(id);if(!el)return;const b=el.querySelector("b");if(b)b.textContent=value||"-";deployClass(el,state)}
function deployCenterRender(){
  if(!$("deployment"))return;
  const login=$("deployLoginStatus"),gh=$("deployGithubStatus"),base=$("deployBaselineStatus"),cand=$("deployCandidateStatus"),hina=$("deployHinaStatus");
  if(cloudUser){login.querySelector("b").textContent="로그인 확인";deployClass(login,"ok")}else{login.querySelector("b").textContent="로그인 필요";deployClass(login,"bad")}
  const h=deployRuntime.health;if(h?.github_reachable){gh.querySelector("b").textContent=`연결됨 · Bridge v${h.bridge_version||"?"}`;deployClass(gh,"ok");base.querySelector("b").textContent=`main ${deployShortSha(h.main_sha)}`;deployClass(base,"ok")}else if(h){gh.querySelector("b").textContent=h.github_secret_present?"GitHub 연결 실패":"Secret 없음";deployClass(gh,"bad");base.querySelector("b").textContent="기준선 확인 실패";deployClass(base,"bad")}else{gh.querySelector("b").textContent="자동 확인 중";deployClass(gh,"");base.querySelector("b").textContent="자동 확인 중";deployClass(base,"")}
  const c=deployRuntime.candidate,stage=deployRuntime.stage,qa=deployRuntime.qa,queue=deployRuntime.queue,merged=deployRuntime.merged;if(stage){cand.querySelector("b").textContent=`${stage.candidate_version?`v${stage.candidate_version} · `:""}PR #${stage.pr_number}`;deployClass(cand,qa?.state==="HINA_QA_PASS"?"ok":"bad")}else if(queue){cand.querySelector("b").textContent=`QUEUE ${queue.candidate_version?`v${queue.candidate_version}`:`PR #${queue.pr_number||"?"}`}`;deployClass(cand,String(queue.status||"")==="READY"?"ok":String(queue.status||"")==="BLOCKED"?"bad":"warn")}else if(c?.ok){cand.querySelector("b").textContent=c.version?`수동 v${c.version}`:"수동 후보";deployClass(cand,"warn")}else{cand.querySelector("b").textContent="승인 후보 없음";deployClass(cand,"")}
  if(qa?.state==="HINA_QA_PASS"){hina.querySelector("b").textContent="SERVER PASS";deployClass(hina,"ok")}else if(qa){hina.querySelector("b").textContent="QA BLOCKED";deployClass(hina,"bad")}else{hina.querySelector("b").textContent="대기";deployClass(hina,"")}
  const healthReady=!!(h?.github_secret_present&&h?.github_reachable&&h?.main_sha),probeReady=deployRuntime.probe?.state==="PROBE_PASS",candidateReady=!!(c?.ok&&deployCandidateText),qaReady=qa?.state==="HINA_QA_PASS",approvalReady=!!(stage&&qaReady&&stage.ready_for_approval!==false);if($("deployProbeBtn"))$("deployProbeBtn").disabled=deployRuntime.busy||!healthReady;if($("deployHinaQaBtn"))$("deployHinaQaBtn").disabled=deployRuntime.busy||!healthReady||!candidateReady;if($("deployStageBtn"))$("deployStageBtn").disabled=deployRuntime.busy||!healthReady||!probeReady||!candidateReady||!qaReady||!!stage;if($("deployMergeBtn")){$("deployMergeBtn").disabled=deployRuntime.busy||!approvalReady||!!merged;$("deployMergeBtn").setAttribute("aria-disabled",$("deployMergeBtn").disabled?"true":"false")}if($("deployDiscardBtn"))$("deployDiscardBtn").disabled=deployRuntime.busy||(!stage&&!candidateReady);if($("deployHealthBtn"))$("deployHealthBtn").disabled=deployRuntime.busy;if($("deployResetBtn"))$("deployResetBtn").disabled=deployRuntime.busy;if($("deployInboxRefreshBtn"))$("deployInboxRefreshBtn").disabled=deployRuntime.busy;if($("deployPackageStageBtn"))$("deployPackageStageBtn").disabled=deployRuntime.busy||!deployPackageCandidate;if($("deployPackageClearBtn"))$("deployPackageClearBtn").disabled=deployRuntime.busy||!deployPackageCandidate;if($("deployPackageFile"))$("deployPackageFile").disabled=deployRuntime.busy;
  let step=0;if(stage||candidateReady||deployPackageCandidate)step=1;if(qaReady)step=2;if(approvalReady)step=3;if(merged?.production_readback==="PASS")step=5;deployProgress(step);if($("deployFinalSummary"))$("deployFinalSummary").textContent=merged?`배포 완료 · 운영 반영 ${merged.production_readback==="PASS"?"확인됨":"확인 필요"}`:approvalReady?`v${stage.candidate_version||"?"} · 자동 검증 완료 · 대표 승인만 남았습니다.`:stage?`검증 또는 패키지 무결성 조건에서 문제가 발견되어 승인이 차단됐습니다.`:"현재 대표님이 승인할 배포 후보가 없습니다.";if($("deployExecRefreshBtn"))$("deployExecRefreshBtn").disabled=deployRuntime.busy;deployQueueRender();deployExecutiveRender();
}
async function deployCenterDiscover(silent=false){
  const out=$("deployInboxResult");try{deploySetBusy(true,silent);if(!silent)haniWorkShow({agent:"hani",title:"하니가 Release Inbox를 확인하고 있어요.",step:"HANI · RELEASE INBOX",message:"운영 main과 새 Preview 후보를 먼저 찾고 있습니다."});if(out&&!silent){out.className="deploy-result";out.textContent="하니 Release Inbox와 HINA Gate를 자동 확인하고 있습니다…"}const h=await deployBridgeApi("health");deployRuntime.health=h;if(!h.github_reachable||!h.main_sha)throw new Error(h.github_error||"GitHub 기준선을 확인하지 못했습니다.");try{const q=await deployBridgeApi("queue_status",{limit:8});deployRuntime.queue=q.active||null;deployRuntime.queueItems=Array.isArray(q.items)?q.items:[]}catch(qe){deployRuntime.queue=null;deployRuntime.queueItems=[];if(!silent)console.warn("Release Queue",qe)}if(!silent)haniWorkShow({agent:"hina",title:"히나가 승인 가능 여부를 재검증 중입니다.",step:"HINA · APPROVAL GATE",message:"후보 패키지와 현재 main의 무결성을 다시 확인합니다."});const r=await deployBridgeApi("pending_release");deployRuntime.pending=r;deployRuntime.merged=null;try{const q2=await deployBridgeApi("queue_status",{limit:8});deployRuntime.queue=q2.active||null;deployRuntime.queueItems=Array.isArray(q2.items)?q2.items:[]}catch(_){}const p=r.pending||null;
    if(!p){deployRuntime.stage=null;deployRuntime.qa=null;deploySaveSession();deployRenderQaReport(null);if($("deployHinaLocalState"))$("deployHinaLocalState").textContent="후보 대기";if($("deployHinaServerState"))$("deployHinaServerState").textContent="대기";if($("deployInboxTitle"))$("deployInboxTitle").textContent="승인 대기 릴리스 없음";if($("deployInboxNotes"))$("deployInboxNotes").textContent=deployRuntime.queue?`Supabase Release Queue에 ${deployRuntime.queue.candidate_version?`v${deployRuntime.queue.candidate_version}`:"후보"} 기록이 있습니다. GitHub Preview 승인 가능 여부를 확인합니다.`:r.ignored_stale_count?`과거 릴리스 ${r.ignored_stale_count}건은 현재 운영보다 오래된 후보라 자동 제외했습니다.`:"하니가 새 수정본을 준비하면 이곳에 자동으로 나타납니다.";deployInboxKpi("deployInboxPr","-");deployInboxKpi("deployInboxVersion","-");deployInboxKpi("deployInboxQa","대기");deployInboxKpi("deployInboxFiles","-");if(out){out.className="deploy-result ok";out.innerHTML=`<strong>INBOX CLEAR</strong> · 대표님이 처리할 배포가 없습니다.${r.ignored_stale_count?`<br>오래된 Preview ${esc(r.ignored_stale_count)}건 자동 제외`:""}`};return}
    deployRuntime.stage={pr_number:p.pr_number,pr_url:p.pr_url,branch:p.branch,release_commit_sha:p.head_sha,html_sha256:p.html_sha256,candidate_version:p.candidate_version,release_notes:p.release_notes||"",source:"AUTO_INBOX",ready_for_approval:!!p.ready_for_approval};deployRuntime.qa=p.qa||null;deploySaveSession();deployRenderQaReport(p.qa||null);const ready=!!p.ready_for_approval;if($("deployHinaLocalState"))$("deployHinaLocalState").textContent="AI Preview 제출 완료";if($("deployHinaServerState"))$("deployHinaServerState").textContent=ready?"PASS · 운영본 독립 비교":"FAIL · 승인 차단";if($("deployInboxTitle"))$("deployInboxTitle").textContent=p.title||`HANI OS release · v${p.candidate_version||"?"}`;if($("deployInboxNotes"))$("deployInboxNotes").textContent=p.release_notes||"변경 메모 없음";deployInboxKpi("deployInboxPr",`PR #${p.pr_number}`,ready?"ok":"bad");deployInboxKpi("deployInboxVersion",p.candidate_version?`v${p.candidate_version}`:"미확인",ready?"ok":"bad");deployInboxKpi("deployInboxQa",ready?"PASS":"BLOCKED",ready?"ok":"bad");deployInboxKpi("deployInboxFiles",Array.isArray(p.changed_files)?p.changed_files.join(", "):"미확인",p.target_only?"ok":"bad");if(out){out.className=`deploy-result ${ready?"ok":"bad"}`;out.innerHTML=ready?`<strong>READY FOR REPRESENTATIVE APPROVAL</strong> · HINA 서버 검증 PASS<br>PR #${esc(p.pr_number)} · v${esc(p.candidate_version||"?")} · 후보 SHA ${esc(String(p.html_sha256||"").slice(0,16))}…${r.superseded_count?`<br>다른 열린 release PR ${esc(r.superseded_count)}건은 결재 대상에서 제외`:""}`:`<strong>RELEASE BLOCKED</strong><br>${(p.block_reasons||["HINA Gate를 통과하지 못했습니다."]).map(x=>`• ${esc(x)}`).join("<br>")}`}
  }catch(e){deployRuntime.stage=null;deployRuntime.qa=null;deployRuntime.pending={error:true,message:e.message||String(e)};if(out){out.className="deploy-result bad";out.textContent=e.message||String(e)};if(!silent)haniWorkFinish(false,"배포 상태 확인에 문제가 있어요.")}finally{deploySetBusy(false,silent)}}

async function deployCenterHealth(){
  const out=$("deployBridgeResult");try{deploySetBusy(true);haniWorkShow({agent:"suyeon",title:"수연이 배포 브리지를 점검 중입니다.",step:"TECH · BRIDGE HEALTH",message:"GitHub 연결과 운영 main 기준선을 확인합니다."});out.className="deploy-result";out.textContent="HANI OS 로그인 세션으로 배포 브리지를 점검하고 있습니다…";const r=await deployBridgeApi("health");deployRuntime.health=r;deployRuntime.probe=null;deployRuntime.qa=null;const ok=r.github_secret_present&&r.github_reachable&&r.main_sha;out.className=`deploy-result ${ok?"ok":"bad"}`;out.innerHTML=ok?`<strong>PASS</strong> · GitHub ${esc(r.repo)} 연결 완료<br>Bridge v${esc(r.bridge_version)} · ${esc(r.qa_profile||"QA profile 미확인")} · main ${esc(deployShortSha(r.main_sha))}`:`<strong>FAIL</strong> · ${esc(r.github_error||"GitHub 연결 상태를 확인해 주세요.")}`;}catch(e){deployRuntime.health=null;out.className="deploy-result bad";out.textContent=e.message||String(e)}finally{deploySetBusy(false)}}
async function deployCenterProbe(){
  const out=$("deployBridgeResult");try{deploySetBusy(true);haniWorkShow({agent:"suyeon",title:"수연이 테스트 브랜치를 점검 중입니다.",step:"TECH · BRANCH PROBE",message:"운영 main은 건드리지 않고 브랜치 생성 권한만 확인합니다."});out.className="deploy-result";out.textContent="테스트 브랜치를 만들고 즉시 삭제하는 중입니다…";const r=await deployBridgeApi("probe_branch");deployRuntime.probe=r;const ok=r.state==="PROBE_PASS"&&r.branch_created&&r.branch_verified;out.className=`deploy-result ${ok?"ok":"bad"}`;out.innerHTML=ok?`<strong>BRANCH PROBE PASS</strong><br>${esc(r.branch)} 생성 확인 · 정리 ${r.branch_cleaned_up?"완료":"확인 필요"}<br>운영 main/index.html 변경 없음.`:`<strong>PROBE FAIL</strong> · 브랜치 생성 권한을 확인해 주세요.`;}catch(e){deployRuntime.probe=null;out.className="deploy-result bad";out.textContent=e.message||String(e)}finally{deploySetBusy(false)}}
async function deployCenterReadCandidate(file){
  const out=$("deployCandidateResult");deployCandidateText="";deployRuntime.candidate=null;deployRuntime.qa=null;deployRuntime.stage=null;deployRuntime.merged=null;deploySaveSession();deployRenderQaReport(null);if($("deployHinaLocalState"))$("deployHinaLocalState").textContent="대기";if($("deployHinaServerState"))$("deployHinaServerState").textContent="대기";
  if(!file){deployCenterRender();return}
  try{out.className="deploy-result";out.textContent="후보 HTML을 읽고 히나 1차 로컬 검사 중입니다…";const html=await file.text();const v=deployValidateCandidate(html,file.name);deployRuntime.candidate=v;if(v.ok)deployCandidateText=html;$("deployFileName").textContent=file.name;$("deployFileVersion").textContent=v.version?`v${v.version}`:"미확인";$("deployFileBytes").textContent=deployFmtBytes(v.bytes);$("deployFileValidation").textContent=v.ok?"PASS":"FAIL";if($("deployHinaLocalState"))$("deployHinaLocalState").textContent=v.ok?"PASS · 문법/구조/불변조건":"FAIL";out.className=`deploy-result ${v.ok?"ok":"bad"}`;out.innerHTML=v.ok?`<strong>HINA LOCAL PASS</strong> · ${esc(v.title||file.name)}<br>JS 문법 · 표시/감사 버전 · 핵심 Anchor · ${esc(DEPLOY_REQUIRED_STORAGE_KEY)} · 내부 데이터 버전 확인`:`<strong>HINA LOCAL FAIL</strong><br>${v.issues.map(x=>`• ${esc(x)}`).join("<br>")}`;if(v.ok&&!$("deployReleaseLabel").value)$("deployReleaseLabel").value=v.version?`v${v.version} HINA Gate`:file.name.replace(/\.html$/i,"");}catch(e){out.className="deploy-result bad";out.textContent=e.message||String(e)}finally{deployCenterRender()}}
async function deployCenterHinaQa(){
  const out=$("deployHinaResult");if(!deployCandidateText||!deployRuntime.candidate?.ok)return;
  try{deploySetBusy(true);deployRuntime.qa=null;deployRenderQaReport(null);out.className="deploy-result";out.textContent="히나가 서버에서 운영 main과 후보를 독립 비교하고 있습니다…";if($("deployHinaServerState"))$("deployHinaServerState").textContent="검증 중";const expected=deployRuntime.health?.main_sha||"";const r=await deployBridgeApi("qa_candidate",{html:deployCandidateText,expected_main_sha:expected});deployRuntime.qa=r;if($("deployHinaServerState"))$("deployHinaServerState").textContent="PASS · 운영본 독립 비교";out.className="deploy-result ok";out.innerHTML=`<strong>HINA 2-LAYER QA PASS</strong> · 실패 0건<br>운영 v${esc(r.main_version||"?")} → 후보 v${esc(r.candidate_version||"?")} · SHA ${esc(String(r.candidate_sha256||"").slice(0,16))}…`;deployRenderQaReport(r)}catch(e){const p=e.payload||{};deployRuntime.qa=p?.qa||p;if($("deployHinaServerState"))$("deployHinaServerState").textContent="FAIL · Preview 차단";out.className="deploy-result bad";out.innerHTML=`<strong>HINA QA FAIL</strong> · ${esc(e.message||String(e))}`;deployRenderQaReport(p?.qa||p)}finally{deploySetBusy(false)}}
async function deployCenterStage(){
  const out=$("deployStageResult");if(!deployCandidateText||!deployRuntime.candidate?.ok||deployRuntime.qa?.state!=="HINA_QA_PASS")return;
  try{deploySetBusy(true);haniWorkShow({agent:"hani",title:"하니가 Preview 릴리스를 만들고 있어요.",step:"HANI · PREVIEW RELEASE",message:"HINA 재검증 후 release 브랜치와 PR을 준비합니다."});out.className="deploy-result";out.textContent="서버가 HINA Gate를 다시 실행한 뒤 Preview 브랜치와 PR을 생성합니다…";const h=await deployBridgeApi("health");deployRuntime.health=h;if(!h.github_reachable||!h.main_sha)throw new Error(h.github_error||"GitHub 기준선을 확인하지 못했습니다.");const r=await deployBridgeApi("stage_release",{html:deployCandidateText,label:$("deployReleaseLabel")?.value||deployRuntime.candidate.version||"release",release_notes:$("deployReleaseNotes")?.value||"",expected_main_sha:h.main_sha});deployRuntime.stage=r;deployRuntime.qa=r.qa||deployRuntime.qa;deployRuntime.merged=null;deploySaveSession();out.className="deploy-result ok";out.innerHTML=`<strong>PREVIEW READY</strong> · HINA Gate 서버 재검증 PASS · PR #${esc(r.pr_number)}<br>Branch: ${esc(r.branch)}<br>Candidate SHA-256: ${esc(String(r.html_sha256||"").slice(0,16))}…${r.pr_url?`<br><a href="${esc(r.pr_url)}" target="_blank" rel="noopener">GitHub Preview PR 열기 ↗</a>`:""}`;}catch(e){out.className="deploy-result bad";out.textContent=e.message||String(e)}finally{deploySetBusy(false)}}
async function deployCenterMerge(){
  const s=deployRuntime.stage,out=$("deployMergeResult");if(!s)return;if(s.ready_for_approval===false||deployRuntime.qa?.state!=="HINA_QA_PASS"){if(out){out.className="deploy-result bad";out.textContent="승인 조건을 충족하지 못해 병합을 차단했습니다. 배포 후보 새로고침 후 HINA PASS와 승인 가능 상태를 확인해 주세요."}haniWorkFinish(false,"승인 조건이 충족되지 않았어요.");return}const yes=confirm(`성민 대표님 최종 승인

v${s.candidate_version||"?"} · PR #${s.pr_number}

서버가 승인 직전 HINA Gate를 다시 실행합니다. PASS하면 main 병합과 Production read-back까지 자동 진행할까요?`);if(!yes)return;try{deploySetBusy(true);haniWorkShow({agent:"hani",title:"대표 승인 확인 · 최종 배포 중입니다.",step:"HANI · APPROVED RELEASE",message:"HINA 최종 검증부터 main 병합과 Production read-back까지 자동 진행합니다."});out.className="deploy-result";out.textContent="대표 승인 접수 · HINA 최종 재검증 · PR 무결성 확인 · 병합 · Production read-back 자동 진행 중…";const r=await deployBridgeApi("merge_release",{pr_number:s.pr_number,expected_head_sha:s.release_commit_sha});deployRuntime.merged=r;deploySaveSession();try{const q=await deployBridgeApi("queue_status",{limit:8});deployRuntime.queue=q.active||null;deployRuntime.queueItems=Array.isArray(q.items)?q.items:[]}catch(_){}const pass=r.production_readback==="PASS";out.className=`deploy-result ${pass?"ok":"bad"}`;if(pass){haniWorkFinish(true,"배포가 완료됐어요! 💜");out.innerHTML=`<strong>🟢 배포 완료</strong><br>현재 운영 버전 v${esc(s.candidate_version||HANI_DISPLAY_VERSION)} · 운영 사이트 정상 반영${r.pages_url?`<br><a href="${esc(r.pages_url)}" target="_blank" rel="noopener">HANI OS 운영 사이트 열기 ↗</a>`:""}<details class="deploy-result-tech"><summary>배포 검증 상세</summary>PR #${esc(r.pr_number)} 병합 완료 · 최종 HINA Gate PASS · Production read-back PASS · 승인 후보와 main/index.html SHA 일치 · main ${esc(deployShortSha(r.merged_sha))}</details>`}else{haniWorkFinish(false,"운영 검증에 문제가 있어요.");out.innerHTML=`<strong>🔴 배포 실패</strong><br>운영 검증 단계에서 문제가 발견되어 추가 배포를 중단했습니다.<details class="deploy-result-tech"><summary>기술 상세 보기</summary>Production read-back 확인 필요</details>`}}catch(e){const p=e.payload||{};haniWorkFinish(false,"배포를 멈추고 점검할게요.");if(p?.merged){deployRuntime.merged=p;deploySaveSession();out.className="deploy-result bad";out.innerHTML=`<strong>🔴 배포 실패</strong><br>main 병합 뒤 운영 검증에서 불일치를 발견했습니다. 추가 배포는 중단됐습니다.<details class="deploy-result-tech"><summary>기술 상세 보기</summary>MERGED · READ-BACK FAIL · 승인 후보 SHA와 운영 main SHA 불일치</details>`;}else{out.className="deploy-result bad";out.textContent=e.message||String(e)}}finally{deploySetBusy(false)}}
async function deployCenterDiscard(){const s=deployRuntime.stage;if(!s){deployCenterReset();return}const yes=confirm(`배포 후보 보류 / 폐기

PR #${s.pr_number}

이 Preview를 닫고 release branch를 정리할까요?`);if(!yes)return;const out=$("deployMergeResult");try{deploySetBusy(true);const r=await deployBridgeApi("discard_release",{pr_number:s.pr_number});out.className="deploy-result ok";out.innerHTML=`<strong>RELEASE DISCARDED</strong> · PR #${esc(r.pr_number)} 폐기 완료${r.branch_cleaned_up?" · branch 정리 완료":""}`;deployRuntime.stage=null;deployRuntime.qa=null;deployRuntime.pending=null;try{const q=await deployBridgeApi("queue_status",{limit:8});deployRuntime.queue=q.active||null;deployRuntime.queueItems=Array.isArray(q.items)?q.items:[]}catch(_){}deploySaveSession();deployRenderQaReport(null)}catch(e){out.className="deploy-result bad";out.textContent=e.message||String(e)}finally{deploySetBusy(false);deployCenterRender()}}
function deployCenterReset(){deployCandidateText="";deployRuntime.candidate=null;deployRuntime.qa=null;deployRuntime.stage=null;deployRuntime.pending=null;deployRuntime.merged=null;deploySaveSession();if($("deployCandidateFile"))$("deployCandidateFile").value="";["deployFileName","deployFileVersion","deployFileBytes"].forEach(id=>{if($(id))$(id).textContent="-"});if($("deployFileValidation"))$("deployFileValidation").textContent="대기";if($("deployCandidateResult")){ $("deployCandidateResult").className="deploy-result";$("deployCandidateResult").textContent="후보 파일을 선택하면 핵심 localStorage 키, 내부 데이터 버전, JS 문법, 핵심 UI Anchor를 로컬에서 먼저 확인합니다."}if($("deployHinaLocalState"))$("deployHinaLocalState").textContent="대기";if($("deployHinaServerState"))$("deployHinaServerState").textContent="대기";if($("deployHinaResult")){ $("deployHinaResult").className="deploy-result";$("deployHinaResult").textContent="로컬 검사 PASS 후 서버가 운영 main과 독립 비교합니다. 둘 다 PASS여야 Preview 생성이 열립니다."}deployRenderQaReport(null);if($("deployStageResult")){ $("deployStageResult").className="deploy-result";$("deployStageResult").textContent="히나 2단계 QA와 브랜치 테스트를 모두 통과하면 Preview를 만들 수 있습니다."}if($("deployMergeResult")){ $("deployMergeResult").className="deploy-result";$("deployMergeResult").textContent="Commit NOT_STARTED"}deployCenterRender()}
function deployCenterInit(){deployLoadSession();const file=$("deployCandidateFile");if(file&&!file.dataset.ready){file.dataset.ready="1";file.onchange=()=>deployCenterReadCandidate(file.files?.[0]||null)}const pkgFile=$("deployPackageFile");if(pkgFile&&!pkgFile.dataset.ready){pkgFile.dataset.ready="1";pkgFile.onchange=()=>deployCenterReadPackage(pkgFile.files?.[0]||null)}const bind=(id,fn)=>{const b=$(id);if(b&&!b.dataset.ready){b.dataset.ready="1";b.onclick=fn}};bind("deployPackageStageBtn",deployCenterStagePackage);bind("deployPackageClearBtn",deployPackageClear);bind("deployExecRefreshBtn",()=>deployCenterDiscover(false));bind("deployInboxRefreshBtn",()=>deployCenterDiscover(false));bind("deployHealthBtn",deployCenterHealth);bind("deployProbeBtn",deployCenterProbe);bind("deployHinaQaBtn",deployCenterHinaQa);bind("deployStageBtn",deployCenterStage);bind("deployMergeBtn",deployCenterMerge);bind("deployResetBtn",deployCenterReset);bind("deployDiscardBtn",deployCenterDiscard);const nav=document.querySelector('.nav-btn[data-view="deployment"]');if(nav&&!nav.dataset.deployInboxReady){nav.dataset.deployInboxReady="1";nav.addEventListener("click",()=>setTimeout(()=>deployCenterDiscover(false),120))}deployCenterRender();setTimeout(()=>{if(cloudUser)deployCenterDiscover(true)},900)}

// =========================================================
// PROJECT HANI · AI Review v0.1 · Representative Decision UI
// AI review stays read-only by default. The only Life OS write here is an explicit representative-approved Purchase → Wish-list action.
// =========================================================
let agentCasesCache=[];
let agentActiveCaseId="";
let agentDetailCache=null;
let agentWorkspaceBusy=false;
let agentPolicyRegistryCache={base_policy:{},policies:[],counts:{total:0,draft:0,learning:0,active:0,adaptive:0,established:0}};

const AGENT_STATUS_LABELS={DRAFT:"접수",ANALYZING:"분석 중",REVIEW_COMPLETE:"심의 완료",AWAITING_APPROVAL:"대표 결재 대기",APPROVED:"승인",HELD:"보류",REJECTED:"반려",COMMITTING:"Commit 중",COMMITTED:"Commit 완료",COMMIT_FAILED:"Commit 실패"};
const AGENT_VERDICT_LABELS={PROCEED:"진행",CONDITIONAL:"조건부",DELAY:"보류 권고",REJECT:"반대",NEEDS_DATA:"정보 필요"};
const AGENT_DECISION_LABELS={APPROVE:"승인",HOLD:"보류",REJECT:"반려",REVISION_REQUESTED:"수정 요청"};
const HANI_DISPLAY_VERSION="2.9.102";
function syncHaniDisplayVersion(){
  const rx=/v\d+\.\d+\.\d+/g;
  const selectors=[".login-brand p",".sidebar-brand-hero small",".side .foot",".footer"];
  selectors.forEach(sel=>document.querySelectorAll(sel).forEach(el=>{el.innerHTML=el.innerHTML.replace(rx,`v${HANI_DISPLAY_VERSION}`)}));
}

function agentStatusTone(status){return ["APPROVED","COMMITTED"].includes(status)?"ok":status==="AWAITING_APPROVAL"?"await":["REJECTED","COMMIT_FAILED"].includes(status)?"bad":["HELD","REVIEW_COMPLETE","ANALYZING"].includes(status)?"warn":""}
function agentArray(v){return Array.isArray(v)?v:[]}
function agentObj(v){return v&&typeof v==="object"&&!Array.isArray(v)?v:{}}
function agentFmtDate(v){if(!v)return "-";const d=new Date(v);if(Number.isNaN(d.getTime()))return String(v);return new Intl.DateTimeFormat("ko-KR",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}).format(d)}
function agentFriendlyWork(message=""){const m=String(message||"");if(/Router v2.*의도|안건 의도 분석/i.test(m))return {agent:"hani",title:"하니가 요청을 이해하는 중",step:"HANI · REQUEST UNDERSTANDING",message:"무슨 검토가 필요한지 정리하고 담당 팀을 고르고 있어요."};if(/Router v2 재분류|재분류/i.test(m))return {agent:"hani",title:"하니가 추가 답변을 반영하는 중",step:"HANI · REQUEST UPDATE",message:"오빠 답변을 반영해서 검토 방향을 다시 정리하고 있어요."};if(/안건 접수/i.test(m))return {agent:"sua",title:"수아가 안건을 접수하는 중",step:"SUA · CASE INTAKE",message:"검토 기록을 만들고 다음 담당자에게 넘길 준비를 하고 있어요."};if(/담당 Agent 배정/i.test(m))return {agent:"hani",title:"하니가 담당 팀을 배정하는 중",step:"HANI · TEAM ROUTING",message:"필요한 전문 Agent만 골라서 업무를 나누고 있어요."};if(/전문 Agent.*심의|전문 심의/i.test(m))return {agent:"hani",title:"담당 Agent들이 의견을 모으는 중",step:"AI TEAM · REVIEW",message:"각 담당자가 자기 영역에서 검토한 뒤 하니에게 의견을 올리고 있어요."};if(/External Research|Research/i.test(m))return {agent:"haru",title:"필요한 최신 정보를 확인하는 중",step:"AI TEAM · RESEARCH",message:"구매 후보와 외부 정보를 확인해 판단 근거를 보강하고 있어요."};if(/Verification|HINA|검증|Gate/i.test(m))return {agent:"hina",title:"히나가 검증하고 하니가 종합하는 중",step:"HINA · VERIFICATION",message:"빠진 조건·충돌·근거를 확인한 뒤 대표 결재안으로 정리하고 있어요."};const agent=haniWorkAgentKey(m);return {agent,title:m||"AI TEAM이 작업 중",step:agent==="hina"?"HINA · VERIFICATION":"AI TEAM · WORKING",message:"현재 단계를 처리하고 있어요. 완료되면 결과 화면으로 자연스럽게 이어집니다."}}
function agentSetBusy(busy,message=""){agentWorkspaceBusy=busy;const view=$("agentReview");if(view)view.classList.toggle("agent-busy",busy);const f=agentFriendlyWork(message);const pill=$("agentWorkspaceState");if(pill)pill.innerHTML=busy?`<span class="agent-loading">${esc(f.title)}</span>`:"AGENT WORKSPACE";if(busy)haniWorkShow(f);else haniWorkHide()}
function agentRequireCloud(){if(!cloudClient||!cloudUser){const box=$("agentCaseList");if(box)box.innerHTML='<div class="empty">먼저 HANI OS Cloud 로그인을 완료해 주세요.</div>';return false}return true}
async function agentApi(action,payload={}){
  if(!agentRequireCloud())throw new Error("Cloud 로그인이 필요합니다.");
  const cfg=cloudConfig(),{data:{session},error}=await cloudClient.auth.getSession();
  if(error)throw error;if(!session?.access_token)throw new Error("로그인 세션을 확인하지 못했습니다.");
  const res=await fetch(`${cfg.url}/functions/v1/hani-agent-orchestrator`,{method:"POST",headers:{"Content-Type":"application/json","apikey":cfg.key,"Authorization":`Bearer ${session.access_token}`},body:JSON.stringify({action,...payload})});
  const result=await res.json().catch(()=>({}));
  if(!res.ok||!result?.ok){
    const base=result?.message||result?.error||`Agent 요청 실패 (${res.status})`;
    const detail=result?.detail?` · 상세: ${String(result.detail).slice(0,240)}`:"";
    haniWorkFinish(false,"작업 중 확인이 필요한 문제가 생겼어요.");
    throw new Error(base+detail);
  }
  return result;
}
function agentPolicyStatusTone(status){return status==="ACTIVE"?"ok":status==="LEARNING"?"warn":status==="DRAFT"?"warn":status==="REJECTED"?"bad":""}
function agentPolicyDisplayRule(rule,status=""){const text=String(rule||"").trim();return ["ACTIVE","LEARNING"].includes(status)?text.replace(/^DRAFT:\s*/i,""):text}
function agentPolicyPct(v){const x=Number(v);return Number.isFinite(x)?Math.round(Math.max(0,Math.min(1,x))*100):50}
function agentPolicyInfluence(v){const x=Number(v);if(!Number.isFinite(x))return "LOW";return x>=.75?"HIGH":x>=.5?"MEDIUM":"LOW"}
function agentPolicyStageLabel(v){return {WEAKENED:"약화",OBSERVED:"관찰",LEARNING:"학습 중",ESTABLISHED:"확립"}[String(v||"").toUpperCase()]||String(v||"학습 중")}
async function agentLoadPolicyRegistry(){
  const root=$("agentPolicyRegistry");if(!root||!agentRequireCloud())return;
  try{
    if($("agentPolicyRegistryState"))$("agentPolicyRegistryState").textContent="불러오는 중…";
    const result=await agentApi("list_policy_registry");
    agentPolicyRegistryCache={base_policy:agentObj(result.base_policy),policies:agentArray(result.policies),counts:agentObj(result.counts)};
    renderAgentPolicyRegistry();
  }catch(e){
    console.error("Policy Registry load",e);
    if($("agentPolicyRegistryState"))$("agentPolicyRegistryState").textContent="SETUP REQUIRED";
    root.innerHTML=`<div class="empty">Adaptive Policy Registry를 불러오지 못했습니다.<br><b>${esc(e?.message||e)}</b><br><span class="sub">PROJECT_HANI_Adaptive_Policy_Engine_v0.2.sql 적용 여부를 확인해 주세요.</span></div>`;
  }
}
function renderAgentPolicyRegistry(){
  const root=$("agentPolicyRegistry");if(!root)return;
  const cache=agentPolicyRegistryCache||{},base=agentObj(cache.base_policy),rows=agentArray(cache.policies),basePrinciples=agentArray(base.principles),baseRules=agentArray(base.purchase_rules),baseCount=basePrinciples.length+baseRules.length;
  const manualDrafts=rows.filter(x=>x.status==="DRAFT"&&String(x.governance_mode||"ADAPTIVE")==="MANUAL");
  const adaptive=rows.filter(x=>String(x.governance_mode||"ADAPTIVE")==="ADAPTIVE"&&["LEARNING","ACTIVE"].includes(String(x.status))).sort((a,b)=>Number(b.confidence||0)-Number(a.confidence||0));
  const strong=adaptive.filter(x=>Number(x.confidence||0)>=.8||String(x.learning_stage||"")==="ESTABLISHED");
  const manualActive=rows.filter(x=>String(x.governance_mode||"")==="MANUAL"&&x.status==="ACTIVE");
  if($("agentPolicyRegistryState"))$("agentPolicyRegistryState").textContent=`LEARN ${adaptive.length} · STRONG ${strong.length} · MANUAL ${manualDrafts.length}`;
  const rowHtml=(p,mode)=>{
    const adaptiveMode=String(p.governance_mode||"ADAPTIVE")==="ADAPTIVE",confidence=agentPolicyPct(p.confidence),weight=Math.round(Number(p.influence_weight||0)*100),evidence=n(p.evidence_count),support=n(p.support_count),contra=n(p.contradict_count),stage=agentPolicyStageLabel(p.learning_stage);
    const learningMeta=adaptiveMode?`<div class="code">Confidence ${confidence}% · 영향 ${weight||"-"}% (${agentPolicyInfluence(p.influence_weight)}) · ${esc(stage)} · 근거 ${evidence} (지지 ${support} / 반례 ${contra})</div>`:"";
    let actions="";
    if(mode==="manual-draft")actions=`<button class="btn primary" type="button" data-policy-approve="${esc(p.id)}">✓ 고정 규정 승인</button><button class="btn danger" type="button" data-policy-reject="${esc(p.id)}">반려</button>`;
    else if(adaptiveMode&&p.status==="LEARNING")actions=`<button class="btn" type="button" data-policy-reject="${esc(p.id)}">학습 제외</button>`;
    else if(p.status==="ACTIVE")actions=`<button class="btn" type="button" data-policy-retire="${esc(p.id)}">비활성화</button>`;
    return `<div class="agent-policy-row ${mode}"><div class="meta">${esc(p.policy_type||"POLICY")} · ${esc(p.workflow||p.scope||"GLOBAL")}${p.source_case_code?` · ${esc(p.source_case_code)}`:""}${adaptiveMode?" · ADAPTIVE":" · MANUAL"}</div><div class="rule">${esc(agentPolicyDisplayRule(p.rule_text,p.status))}</div>${learningMeta}${p.policy_code?`<div class="code">${esc(p.policy_code)} · v${n(p.version)||1}${p.representative_locked?" · 대표 고정":""}</div>`:""}${actions?`<div class="agent-policy-actions">${actions}</div>`:""}</div>`;
  };
  const adaptiveHtml=adaptive.length?adaptive.map(x=>rowHtml(x,"adaptive")).join(""):'<div class="empty">아직 자동 학습 규칙이 없습니다.</div>';
  const governed=[...manualDrafts.map(x=>({x,mode:"manual-draft"})),...manualActive.map(x=>({x,mode:"manual-active"}))];
  const governedHtml=governed.length?governed.map(({x,mode})=>rowHtml(x,mode)).join(""):'<div class="empty">대표 승인이 필요한 별도 고정 규정이 없습니다.</div>';
  root.innerHTML=`<div class="agent-policy-summary"><div class="agent-policy-kpi"><small>기본 사칙 · 서버 Baseline</small><b>${baseCount}개</b></div><div class="agent-policy-kpi"><small>자동 학습 규칙</small><b>${adaptive.length}개</b></div><div class="agent-policy-kpi"><small>확립 규칙 · Confidence 80%+</small><b>${strong.length}개</b></div></div><div class="agent-policy-columns"><div class="agent-policy-column"><div class="agent-policy-column-head"><b>자동 학습 · Confidence Weighted</b><span class="agent-status ${adaptive.length?"warn":"ok"}">${adaptive.length}개</span></div><div class="agent-policy-list">${adaptiveHtml}</div></div><div class="agent-policy-column"><div class="agent-policy-column-head"><b>대표 Governance</b><span class="agent-status ${manualDrafts.length?"warn":"ok"}">${manualDrafts.length}개 대기</span></div><div class="agent-policy-list">${governedHtml}</div></div></div><div class="agent-policy-base-note">Adaptive Policy Engine v0.2 · 일반 학습 규정은 대표가 매번 승인하지 않습니다. 반복 지지는 confidence를 높이고 반례는 더 크게 낮춥니다. 낮은 confidence 규정은 약하게 참고하며, Constitution/Hard Stop만 대표 승인 대상으로 유지합니다.</div>`;
  root.querySelectorAll("[data-policy-approve]").forEach(b=>b.onclick=()=>agentPolicyAction("approve_policy",b.dataset.policyApprove));
  root.querySelectorAll("[data-policy-reject]").forEach(b=>b.onclick=()=>agentPolicyAction("reject_policy",b.dataset.policyReject));
  root.querySelectorAll("[data-policy-retire]").forEach(b=>b.onclick=()=>agentPolicyAction("retire_policy",b.dataset.policyRetire));
}

async function agentPolicyAction(action,policyId){
  const labels={approve_policy:"고정 규정 승인",reject_policy:"규정 학습 제외/반려",retire_policy:"규정 비활성화"},label=labels[action]||action;
  if(!confirm(`${label} 처리할까요?\n\n일반 ADAPTIVE 규정은 별도 승인 없이 confidence에 따라 자동 참고됩니다.`))return;
  let note="";if(action!=="approve_policy")note=prompt("필요하면 사유를 간단히 남겨주세요. (선택)","")||"";
  try{agentSetBusy(true,`${label} 중`);const result=await agentApi(action,{policy_id:policyId,note});toast(result.message||`${label} 완료`);await agentLoadPolicyRegistry();if(agentActiveCaseId)await agentLoadCaseDetail(agentActiveCaseId)}catch(e){console.error(label,e);alert(`${label}에 실패했습니다.\n${e?.message||e}`)}finally{agentSetBusy(false)}
}
async function agentSyncCasePolicyCandidates(){
  const c=agentDetailCache?.case;if(!c)return;
  try{agentSetBusy(true,"학습 원칙 Registry 동기화 중");const result=await agentApi("sync_case_policy_candidates",{case_id:c.id});toast(result.message||"규정 후보를 동기화했습니다.");await agentLoadPolicyRegistry();await agentLoadCaseDetail(c.id)}catch(e){console.error("Policy sync",e);alert("규정 후보 동기화에 실패했습니다.\n"+(e?.message||e))}finally{agentSetBusy(false)}
}
function agentDateDaysAgo(days){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-Math.max(0,Number(days)||0));const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0");return `${y}-${m}-${day}`}
function agentRecentRows(rows,days,dateKey="date"){const min=agentDateDaysAgo(days);return (Array.isArray(rows)?rows:[]).filter(r=>String(r?.[dateKey]||"")>=min).sort((a,b)=>String(a?.[dateKey]||"").localeCompare(String(b?.[dateKey]||"")))}
function agentSafeText(v,max=120){return String(v??"").replace(/\s+/g," ").trim().slice(0,max)}
function agentSafeInternalObject(value,depth=0){
  if(depth>4)return undefined;
  if(value===null||value===undefined||typeof value==="number"||typeof value==="boolean")return value;
  if(typeof value==="string")return value.length>300?value.slice(0,300):value;
  if(Array.isArray(value))return value.slice(-30).map(v=>agentSafeInternalObject(v,depth+1)).filter(v=>v!==undefined);
  if(typeof value!=="object")return undefined;
  const out={};for(const [k,v] of Object.entries(value)){
    if(/password|secret|token|apikey|api_key|image|poster|cover|thumbnail|account.?number|number$/i.test(k))continue;
    const safe=agentSafeInternalObject(v,depth+1);if(safe!==undefined)out[k]=safe;
  }return out;
}
function agentExerciseSnapshot(){
  const rows=agentRecentRows(state.exercise||[],90),stepRows=rows.filter(r=>n(r.steps)>0),last30=agentRecentRows(state.exercise||[],30),last14=agentRecentRows(state.exercise||[],14);
  const sum=x=>x.reduce((a,r)=>a+n(r.steps),0),avg=x=>x.filter(r=>n(r.steps)>0).length?Math.round(sum(x)/x.filter(r=>n(r.steps)>0).length):0;
  return {window_days:90,record_days:rows.length,active_step_days:stepRows.length,total_steps:sum(rows),avg_steps_on_recorded_step_days:avg(rows),total_distance_km:Number(rows.reduce((a,r)=>a+n(r.distance),0).toFixed(1)),strength_days:rows.filter(r=>r.strength).length,last_30d:{record_days:last30.length,avg_steps_on_recorded_step_days:avg(last30)},last_14d:{record_days:last14.length,avg_steps_on_recorded_step_days:avg(last14)},latest_records:rows.slice(-12).map(r=>({date:r.date,steps:n(r.steps),distance_km:n(r.distance),strength:!!r.strength,note:agentSafeText(r.note,80)}))};
}
function agentBodySnapshot(){
  const rows=agentRecentRows(state.body||[],90),latest=rows.at(-1)||null,first=rows[0]||null;
  return {window_days:90,record_count:rows.length,latest:latest?{date:latest.date,weight:latest.weight??null,fat:latest.fat??null,muscle:latest.muscle??null,bmi:latest.bmi??null,fatMass:latest.fatMass??null}:null,period_weight_delta_kg:latest&&first&&Number.isFinite(Number(latest.weight))&&Number.isFinite(Number(first.weight))?Number((Number(latest.weight)-Number(first.weight)).toFixed(2)):null,latest_records:rows.slice(-10).map(r=>({date:r.date,weight:r.weight??null,fat:r.fat??null,muscle:r.muscle??null,bmi:r.bmi??null}))};
}
function agentLedgerSnapshot(){
  const rows=[...(state.ledgerMonths||[])].sort((a,b)=>String(a.month||"").localeCompare(String(b.month||""))).slice(-3);
  return {months:rows.map(m=>{const c=ledgerCalc(normalizeLedgerMonth(m)),items=Array.isArray(m.items)?m.items:[];return {month:m.month,period_start:m.periodStart||null,period_end:m.periodEnd||null,fixed_total_krw:c.fixed,variable_total_krw:c.variable,special_total_krw:c.special,finance_total_krw:c.finance,total_krw:c.total,reimbursement_t_krw:c.reimbursementT,reimbursement_c_krw:c.reimbursementC,jispi_t_krw:c.jispiT,jispi_c_krw:c.jispiC,target_t_krw:c.targetT,target_c_krw:c.targetC,item_count:items.length,comment:agentSafeText(m.comment,120)}})};
}
function agentCampusSnapshot(){
  const all=Array.isArray(state.campusSemesters)?state.campusSemesters:[],active=all.find(x=>x.id===state.ui?.campusActiveSemesterId)||all.find(x=>x.status==="active")||all.at(-1)||null;
  if(!active)return {active_semester:null};const events=(active.events||[]).filter(e=>!e.done).sort((a,b)=>String(a.date||"").localeCompare(String(b.date||""))).slice(0,20);
  return {active_semester:{term:active.term,startDate:active.startDate,endDate:active.endDate,courses:(active.courses||[]).map(c=>({name:c.name,type:c.type,credits:n(c.credits),professor:agentSafeText(c.professor,60),upcoming_weeks:(c.curriculum||[]).filter(w=>!w.done&&String(w.endAt||w.startAt||"")>=today()).slice(0,6).map(w=>({week:w.week,topic:agentSafeText(w.topic,90),startAt:w.startAt,endAt:w.endAt}))})),upcoming_events:events.map(e=>({date:e.date,title:agentSafeText(e.title,100),type:e.type,scope:e.scope}))}};
}
function agentInvestmentSnapshot(){
  const confirmed=[...(state.investmentBrokerSnapshots||[])].filter(x=>x?.mode==="actual"&&x?.status==="confirmed").sort((a,b)=>String(a.period||"").localeCompare(String(b.period||""))||String(a.updatedAt||"").localeCompare(String(b.updatedAt||""))),latest=confirmed.at(-1)||null;
  return {account_count:(state.accounts||[]).length,instrument_count:(state.instruments||[]).length,transaction_count:(state.transactions||[]).length,watchlist_count:(state.investmentWatchlist||[]).length,accounts:(state.accounts||[]).map(a=>({id:a.id,name:a.name,type:a.type,broker:a.broker})),instruments:(state.instruments||[]).slice(-40).map(x=>({id:x.id,name:x.name,ticker:x.ticker,market:x.market})),latest_confirmed_snapshot:latest?agentSafeInternalObject(latest):null};
}
function agentTravelSnapshot(){return {completed_trips:(state.travelTrips||[]).slice(-6).map(t=>({name:t.name,destination:t.destination,startDate:t.startDate,endDate:t.endDate,summary:agentSafeText(t.summary,140),review_count:(t.reviews||[]).length,reviews:(t.reviews||[]).slice(-5).map(r=>({type:r.type,name:r.name,rating:r.rating,returnVisit:r.returnVisit,review:agentSafeText(r.review,100)}))})),wishlist:(state.travelWishlist||[]).slice(-8).map(w=>({destination:w.destination,expectedDate:w.expectedDate,reason:agentSafeText(w.reason||w.note,100)}))};}
function agentContentSnapshot(){return {movies:(state.movies||[]).slice(-12).map(x=>({title:x.title,rating:x.rating??null,status:x.status||"",date:x.date||x.watchedDate||"",review:agentSafeText(x.review,100)})),books:(state.books||[]).slice(-12).map(x=>({title:x.title,rating:x.rating??null,status:x.status||"",date:x.date||x.completedDate||"",review:agentSafeText(x.review,100)}))};}
function agentBuildInternalContext(requests=[]){
  const out={source:"HANI_OS_DATA_READ_ONLY",generated_at:new Date().toISOString(),requested:Array.isArray(requests)?requests:[]};
  for(const req of out.requested){
    if(req==="EXERCISE_RECENT_90D")out.exercise_recent_90d=agentExerciseSnapshot();
    else if(req==="BODY_RECENT_90D")out.body_recent_90d=agentBodySnapshot();
    else if(req==="INVESTMENT_CURRENT"||req==="ASSET_CURRENT")out.investment_current=agentInvestmentSnapshot();
    else if(req==="LEDGER_RECENT_90D")out.ledger_recent=agentLedgerSnapshot();
    else if(req==="CAMPUS_CURRENT")out.campus_current=agentCampusSnapshot();
    else if(req==="TRAVEL_HISTORY")out.travel_history=agentTravelSnapshot();
    else if(req==="CONTENT_HISTORY")out.content_history=agentContentSnapshot();
  }
  return out;
}
function agentRouterLabel(router={}){const d=Array.isArray(router.context_domains)?router.context_domains.join(" + "):"-",i=Array.isArray(router.internal_data_requests)?router.internal_data_requests.length:0,m=router.primary_intent==="PURCHASE_REVIEW"?`\n구매 판단: ${agentPurchaseModeLabel(router.purchase_decision_mode)}`:"";return `검토 유형: ${router.primary_intent||"GENERAL_REVIEW"}${m}\n위험도: ${router.risk_level||"LOW"}\n참고 영역: ${d||"-"}\nHANI OS 참고 데이터: ${i}개\n외부 조사: ${router.external_research||"NONE"}`}
function agentTitleFromText(text){const s=String(text||"").replace(/\s+/g," ").trim();return s.length>54?s.slice(0,54)+"…":s}
async function agentLoadCases({selectId=""}={}){
  if(!agentRequireCloud())return;
  const {data,error}=await cloudClient.from("hani_agent_cases").select("id,case_code,workflow,title,status,risk_level,verification_status,hani_final,created_at,updated_at").order("updated_at",{ascending:false}).limit(40);
  if(error)throw error;agentCasesCache=data||[];if($("agentCaseCount"))$("agentCaseCount").textContent=agentCasesCache.length+"건";renderAgentCaseList();
  const nextId=selectId||agentActiveCaseId||agentCasesCache[0]?.id||"";if(nextId)await agentLoadCaseDetail(nextId);else if($("agentCaseDetail"))$("agentCaseDetail").innerHTML='<div><div style="font-size:34px;margin-bottom:8px">📄</div><b>아직 등록된 Agent 안건이 없습니다.</b></div>';
}
function renderAgentCaseList(){
  const el=$("agentCaseList");if(!el)return;
  el.innerHTML=agentCasesCache.map(c=>{const h=agentObj(c.hani_final),rec=h.recommendation?` · ${AGENT_VERDICT_LABELS[h.recommendation]||h.recommendation}`:"";return `<button type="button" class="agent-case-item ${c.id===agentActiveCaseId?"active":""}" data-agent-case="${esc(c.id)}"><div class="agent-case-item-head"><b>${esc(c.title||"제목 없는 안건")}</b><span class="agent-status ${agentStatusTone(c.status)}">${esc(AGENT_STATUS_LABELS[c.status]||c.status)}</span></div><div class="agent-case-code">${esc(c.case_code||"")} · ${esc(c.workflow||"")}${esc(rec)}</div></button>`}).join("")||'<div class="empty">등록된 Agent 안건이 없습니다.</div>';
  el.querySelectorAll("[data-agent-case]").forEach(b=>b.onclick=()=>agentLoadCaseDetail(b.dataset.agentCase).catch(e=>alert("안건을 불러오지 못했습니다.\n"+(e?.message||e))));
}
async function agentLoadCaseDetail(caseId){
  if(!agentRequireCloud())return;agentActiveCaseId=caseId;renderAgentCaseList();const detail=$("agentCaseDetail");if(detail)detail.innerHTML='<div class="agent-detail-empty"><span class="agent-loading">결재안을 불러오는 중</span></div>';
  const [caseRes,reviewsRes,decisionsRes,eventsRes]=await Promise.all([
    cloudClient.from("hani_agent_cases").select("*").eq("id",caseId).single(),
    cloudClient.from("hani_agent_reviews").select("*").eq("case_id",caseId).order("review_round",{ascending:true}).order("created_at",{ascending:true}),
    cloudClient.from("hani_agent_decisions").select("*").eq("case_id",caseId).order("decision_round",{ascending:false}),
    cloudClient.from("hani_agent_events").select("*").eq("case_id",caseId).order("created_at",{ascending:true})
  ]);
  const firstError=[caseRes.error,reviewsRes.error,decisionsRes.error,eventsRes.error].find(Boolean);if(firstError)throw firstError;
  agentDetailCache={case:caseRes.data,reviews:reviewsRes.data||[],decisions:decisionsRes.data||[],events:eventsRes.data||[]};renderAgentCaseDetail();
}
function agentLatestReviewRound(reviews){return reviews.reduce((m,r)=>Math.max(m,Number(r.review_round)||0),0)}
function agentTimelineHtml(c,events){
  const types=new Set(events.map(e=>e.event_type)),latestReview=agentLatestReviewRound(agentDetailCache?.reviews||[]),ctx=agentObj(c?.context);
  const defs=[["CASE_CREATED","접수"],["ROUTING_COMPLETED","배정"],["RESEARCH","Research"],["AGENT_REVIEWS_COMPLETED","전문심의"],["VERIFICATION_COMPLETED","검증"],["HANI_SYNTHESIS_COMPLETED","하니 종합"],["REPRESENTATIVE_DECISION_RECORDED","대표 결정"]];
  return defs.map(([type,label])=>{const researchDone=type==="RESEARCH"&&(types.has("EXTERNAL_RESEARCH_COMPLETED")||types.has("MARKET_RESEARCH_COMPLETED")||Object.keys(agentObj(ctx.external_research)).length>0||Object.keys(agentObj(ctx.market_research)).length>0),done=researchDone||types.has(type)||(type==="AGENT_REVIEWS_COMPLETED"&&latestReview>0),current=c.status==="AWAITING_APPROVAL"&&type==="REPRESENTATIVE_DECISION_RECORDED";return `<div class="agent-step ${done?"done":current?"current":""}">${done?"✓ ":""}${label}</div>`}).join("");
}
function agentListHtml(items,empty="없음"){const rows=agentArray(items);return rows.length?rows.map(x=>`<div class="agent-check">${esc(typeof x==="string"?x:JSON.stringify(x))}</div>`).join(""):`<div class="agent-check" style="color:var(--muted)">${esc(empty)}</div>`}
function agentInternalContextHtml(c){
  const ctx=agentObj(c?.context),router=agentObj(ctx.router_v2),data=agentObj(ctx.internal_data),rows=[];
  const ex=agentObj(data.exercise_recent_90d);
  if(Object.keys(ex).length)rows.push(`운동 90일 · 기록 ${n(ex.record_days)}일 · 걸음 기록 ${n(ex.active_step_days)}일 · 기록일 평균 ${n(ex.avg_steps_on_recorded_step_days).toLocaleString("ko-KR")}보 · 거리 ${n(ex.total_distance_km)}km · 근력 ${n(ex.strength_days)}일`);
  const body=agentObj(data.body_recent_90d),latest=agentObj(body.latest);
  if(Object.keys(body).length)rows.push(`신체 90일 · 기록 ${n(body.record_count)}회${latest.weight!==undefined&&latest.weight!==null?` · 최근 체중 ${latest.weight}kg`:""}${body.period_weight_delta_kg!==undefined&&body.period_weight_delta_kg!==null?` · 기간 변화 ${Number(body.period_weight_delta_kg)>0?"+":""}${body.period_weight_delta_kg}kg`:""}`);
  const led=agentObj(data.ledger_recent);
  if(Array.isArray(led.months)&&led.months.length){const m=led.months.at(-1);rows.push(`가계부 최근 · ${m.month||"-"} · 합계 ${n(m.total_krw).toLocaleString("ko-KR")}원`)}
  const inv=agentObj(data.investment_current);
  if(Object.keys(inv).length)rows.push(`투자 현황 · 계좌 ${n(inv.account_count)}개 · 종목 ${n(inv.instrument_count)}개 · 거래 ${n(inv.transaction_count)}건`);
  const requested=agentArray(router.internal_data_requests),domains=agentArray(router.context_domains);
  const research=String(router.external_research||"NONE");
  if(!rows.length&&!requested.length&&!domains.length)return "";
  return `<div class="agent-subsection"><div class="agent-subsection-title"><b>이번 검토에 사용한 HANI OS Context</b><span class="agent-status">READ ONLY</span></div><div class="agent-check-list"><div class="agent-check">Primary ${esc(router.primary_intent||c.workflow||"-")}${(router.primary_intent||c.workflow)==="PURCHASE_REVIEW"?` · ${esc(agentPurchaseModeLabel(router.purchase_decision_mode||agentPurchaseMode(c)))}`:""} · Context ${esc(domains.join(" + ")||"-")} · Research ${esc(research)}</div>${rows.length?rows.map(x=>`<div class="agent-check">${esc(x)}</div>`).join(""):`<div class="agent-check" style="color:var(--muted)">요청된 내부자료 ${requested.length}개 · 현재 요약할 기록이 없거나 조회 대상이 없습니다.</div>`}</div></div>`;
}
function agentPurchaseMode(c){
  const router=agentObj(agentObj(c?.context).router_v2),explicit=String(router.purchase_decision_mode||"").toUpperCase();
  if(["BUY_OR_NOT","SELECT_PRODUCT","UPGRADE_REPLACE","CONDITION_SEARCH"].includes(explicit))return explicit;
  const text=String(c?.source_text||c?.title||"");
  if(/(바꿀까|교체|업그레이드|기존.*대신|갈아탈)/i.test(text))return "UPGRADE_REPLACE";
  if(/(사야\s*하는데|뭘\s*사|뭐가\s*좋|어떤\s*(제품|모델)|추천해|골라|선택해)/i.test(text))return "SELECT_PRODUCT";
  if(/(이하|조건|예산.*안|찾아|후보)/i.test(text)&&/(추천|제품|모델|사)/i.test(text))return "CONDITION_SEARCH";
  return "BUY_OR_NOT";
}
function agentPurchaseModeLabel(mode){const m=String(mode||"").toUpperCase(),map={BUY_OR_NOT:"구매 여부 심의",SELECT_PRODUCT:"제품 선정 심의",UPGRADE_REPLACE:"교체·업그레이드 심의",CONDITION_SEARCH:"조건형 제품 탐색",NOT_APPLICABLE:"해당 없음"};return map[m]||map.BUY_OR_NOT}
function agentPurchaseModeDescription(mode){const m=String(mode||"").toUpperCase(),map={BUY_OR_NOT:"살지 말지를 먼저 판단하고, 산다면 적합한 후보를 제안합니다.",SELECT_PRODUCT:"구매 필요는 확정된 전제로 후보별 강점을 비교해 가장 잘 맞는 제품을 고릅니다.",UPGRADE_REPLACE:"현재 제품을 계속 쓸지 교체할지와 교체한다면 어떤 후보가 가치 있는지 봅니다.",CONDITION_SEARCH:"주어진 조건을 충족하는 후보를 찾고 각 후보의 강점과 약점을 비교합니다."};return map[m]||map.BUY_OR_NOT}
function agentRoleLensLabel(role){const r=String(role||"").toUpperCase(),map={USER_REVIEW_EXPERIENCE:"실사용 · 리뷰",QUALITY_PERFORMANCE:"품질 · 성능",VALUE_PRICE:"가격 · 가치",DESIGN_PREFERENCE:"디자인 · 선호",PREFERENCE_MEMORY:"선호 · 교체가치",FINANCE_RISK:"재무 · 리스크",UX_EXPERIENCE:"사용경험",TECH_ARCHITECTURE:"기술 적합",SUSTAINABILITY_BEHAVIOR:"건강 · 지속성"};return map[r]||String(role||"").replaceAll("_"," ")}
function agentProductNorm(v){return String(v||"").toLocaleLowerCase("ko-KR").replace(/[\s·\-_/()\[\]{}:："'“”‘’.,]+/g,"")}
function agentScoreText(v){const x=Number(v||0);return x>0?`${x.toFixed(1)} / 5`:"평가 전"}
function agentPurchaseAxisLabels(c){const mode=agentPurchaseMode(c);if(mode==="SELECT_PRODUCT")return ["1 · 구매 전제 / 목적","2 · HANI 추천","3 · 선택 포인트","4 · 구매 전 확인 / 시점"];if(mode==="CONDITION_SEARCH")return ["1 · 탐색 조건","2 · HANI 추천","3 · 선택 포인트","4 · 구매 전 확인 / 시점"];if(mode==="UPGRADE_REPLACE")return ["1 · 교체할 가치가 있는가","2 · 교체한다면 무엇으로","3 · 교체 방식 / 조건","4 · 시점"];return ["1 · 사도 되는가","2 · 산다면 무엇을 살 것인가","3 · 어떤 방식으로","4 · 언제 살 것인가"]}
function agentPurchaseScorecard(h){const sc=agentObj(h?.purchase_scorecard);return {raw:sc,candidates:agentArray(sc.candidates),picks:agentArray(sc.picks),axes:agentArray(sc.evaluation_axes),haniPick:String(sc.hani_pick_candidate||"")}}

function agentReviewTeamKey(raw){const s=String(raw||"").trim().toLowerCase();const alias={hani:"hani",하니:"hani",chief:"hani",cio:"hani",jieun:"jieun",지은:"jieun",finance:"jieun",money:"jieun",nauen:"nauen",naeun:"nauen",나은:"nauen",health:"nauen",hina:"hina",히나:"hina",study:"hina",sua:"sua",수아:"sua",staff:"sua",haru:"haru",하루:"haru",life:"haru",suyeon:"suyeon",수연:"suyeon",travel:"suyeon",coach:"suyeon",minji:"minji",민지:"minji",archive:"minji",movie:"minji"};return alias[s]||""}
function agentExecutiveSummaryHtml(h,v,latestDecision){
  const key='hani',member=teamByKey(key)||{},meta=teamMeta(key)||{},img=(sidebarAgentImages[key]||agentImages[key]||""),tone=member.tone||'purple',recommendation=h.recommendation||"NEEDS_DATA",summary=esc(h.executive_summary||v.summary||"하니 종합 결재안이 아직 준비되지 않았습니다."),verdict=esc(AGENT_VERDICT_LABELS[recommendation]||recommendation),tags=agentArray(meta.signature).slice(0,3),role=esc(member.role||meta.rank||"HANI OS Manager");
  return `<div class="agent-summary verdict-${String(recommendation).toLowerCase()} tone-${tone} agent-hani"><div class="agent-summary-topline"><div class="agent-summary-heading"><span class="agent-summary-kicker">HANI EXECUTIVE REVIEW</span><strong class="agent-summary-title">하니 최종 결론</strong></div><div class="agent-summary-badges"><span class="agent-summary-verdict verdict-${String(recommendation).toLowerCase()}">${verdict}</span>${latestDecision?`<span class="agent-summary-rep-decision">대표 ${esc(AGENT_DECISION_LABELS[latestDecision.representative_decision]||latestDecision.representative_decision)}</span>`:""}</div></div><div class="agent-summary-dialog"><div class="agent-summary-avatar" style="${img?`--agent-photo:url('${img}')`:''}"></div><div class="agent-summary-dialog-body"><div class="agent-summary-speaker"><div class="agent-summary-name"><b>${esc(member.name||'하니')}</b><small>${role}</small></div></div><div class="agent-summary-bubble"><div class="agent-summary-quote"><span class="agent-quote-name">${esc(member.name||'하니')}</span>“${summary}”</div></div>${tags.length?`<div class="agent-summary-tags">${tags.map(t=>`<span>${esc(t)}</span>`).join("")}</div>`:""}</div></div></div>`;
}

function agentPositionsHtml(h,reviews){
  const round=agentLatestReviewRound(reviews),latest=reviews.filter(r=>Number(r.review_round)===round),mapped=agentArray(h.agent_positions),rows=mapped.length?mapped:latest.map(r=>({agent_key:r.agent_key,verdict:r.verdict,key_point:r.summary}));
  return rows.length?rows.map(p=>{const key=agentReviewTeamKey(p.agent_key),m=key?teamByKey(key):null,meta=key?teamMeta(key):null,img=key?(sidebarAgentImages[key]||agentImages[key]||""):"",review=latest.find(r=>String(r.agent_key||"").toUpperCase()===String(p.agent_key||"").toUpperCase())||{},tags=(meta?.signature||[]).slice(0,3),speaker=esc(m?.name||p.agent_key||"AGENT"),lens=agentRoleLensLabel(review.role||p.role||""),role=esc(lens||m?.role||p.agent_key||""),verdict=esc(AGENT_VERDICT_LABELS[p.verdict]||p.verdict||"-"),verdictClass=`verdict-${String(p.verdict||"NEEDS_DATA").toLowerCase()}`,toneClass=`tone-${m?.tone||'purple'}`,agentClass=`agent-${key||'unknown'}`,summary=esc(p.key_point||p.summary||"검토 의견이 아직 입력되지 않았습니다."),scores=agentArray(review.candidate_scores).slice(0,5);return `<div class="agent-position ${verdictClass} ${toneClass} ${agentClass}"><div class="agent-position-card"><div class="agent-position-avatar" style="${img?`--agent-photo:url('${img}')`:''}"></div><div class="agent-position-copy"><div class="agent-position-head"><div class="agent-position-name"><b>${speaker}</b><small>${role}</small></div><span class="agent-position-verdict ${verdictClass}">${verdict}</span></div><div class="agent-position-bubble"><div class="agent-position-summary"><span class="agent-quote-name">${speaker}</span>“${summary}”</div></div>${scores.length?`<div class="agent-candidate-score-row">${scores.map(x=>`<span><b>${esc(x.candidate_name||"후보")}</b> ${agentScoreText(x.overall_score)}</span>`).join("")}</div>`:""}${tags.length?`<div class="agent-position-tags">${tags.map(t=>`<span>${esc(t)}</span>`).join("")}</div>`:""}</div></div></div>`}).join(""):'<div class="agent-check" style="color:var(--muted)">전문 Agent 의견 없음</div>';
}

function agentProcurementHtml(c,h={},reviews=[]){
  if(c?.workflow!=="PURCHASE_REVIEW")return "";
  const ctx=agentObj(c?.context),research=agentObj(ctx.external_research),proc=agentObj(research.procurement),candidates=agentArray(research.candidate_options),mode=agentPurchaseMode(c),sc=agentPurchaseScorecard(h),scoreRows=sc.candidates;
  if(!Object.keys(research).length)return "";
  const head=[];
  if(proc.purpose_interpretation)head.push(`목적 해석 · ${proc.purpose_interpretation}`);
  if(proc.recommended_category)head.push(`권장 카테고리 · ${proc.recommended_category}`);
  const criteria=agentArray(proc.selection_criteria),axes=agentArray(proc.evaluation_axes).length?agentArray(proc.evaluation_axes):sc.axes,title=["SELECT_PRODUCT","CONDITION_SEARCH"].includes(mode)?"AI 구매팀 · 제품 비교 Scorecard":"AI 구매팀 · 산다면 볼 후보";
  const axisLegend=axes.length?`<div class="agent-purchase-axis-legend">${axes.slice(0,6).map(a=>`<span title="${esc(a.reason||"")}">${esc(a.emoji||"🏷️")} ${esc(a.label||a.key||"평가")}${Number(a.weight)>0?` <small>${Math.round(Number(a.weight)*100)}%</small>`:""}</span>`).join("")}</div>`:"";
  return `<div class="agent-subsection agent-purchase-v2"><div class="agent-subsection-title"><div><b>${title}</b><div class="agent-purchase-mode-copy"><span class="agent-purchase-mode">${esc(agentPurchaseModeLabel(mode))}</span>${esc(agentPurchaseModeDescription(mode))}</div></div><span class="agent-status ok">${candidates.length}개</span></div>${head.length?`<div class="agent-check-list">${head.map(x=>`<div class="agent-check">${esc(x)}</div>`).join("")}${criteria.length?`<div class="agent-check">선정 기준 · ${esc(criteria.join(" · "))}</div>`:""}</div>`:""}${axisLegend}${candidates.length?`<div class="agent-procurement-grid agent-scorecard-grid">${candidates.slice(0,5).map((x)=>{const price=n(x.observed_price_krw),strengths=agentArray(x.strengths),limits=agentArray(x.limits),row=scoreRows.find(r=>agentProductNorm(r.name)===agentProductNorm(x.name))||{},pickDefs=sc.picks.filter(p=>agentProductNorm(p.candidate_name)===agentProductNorm(x.name)),agentScores=agentArray(row.agent_scores),axisScores=agentArray(row.axis_scores),haniPick=Boolean(row.hani_pick)||agentProductNorm(sc.haniPick)===agentProductNorm(x.name);return `<div class="agent-procurement-card ${haniPick?"hani-pick":""}"><div class="agent-pick-row">${haniPick?`<span class="agent-pick-chip hani">👑 HANI PICK</span>`:""}${pickDefs.map(p=>`<span class="agent-pick-chip">${esc(p.emoji||"🏷️")} ${esc(p.label||p.axis_key||"PICK")} PICK</span>`).join("")}</div><div class="topline"><b>${esc(x.name||"후보")}</b><span class="agent-procurement-price">${price?price.toLocaleString("ko-KR")+"원":"가격 확인 필요"}</span></div>${Number(row.average_score)>0?`<div class="agent-product-average"><strong>★ ${agentScoreText(row.average_score)}</strong><span>Agent 평균${Number(row.purpose_score)>0?` · 목적가중 ${Number(row.purpose_score).toFixed(1)}`:""}</span></div>`:""}<div class="agent-procurement-meta">${esc(x.category||"")}${x.price_basis?` · ${esc(x.price_basis)}`:""}</div><div class="agent-procurement-fit">${esc(x.fit||"")}</div>${axisScores.length?`<div class="agent-axis-score-row">${axisScores.slice(0,6).map(a=>`<span>${esc(a.emoji||"🏷️")} ${esc(a.label||a.axis_key)} <b>${Number(a.score).toFixed(1)}</b></span>`).join("")}</div>`:""}${agentScores.length?`<div class="agent-card-agent-scores">${agentScores.map(a=>{const k=agentReviewTeamKey(a.agent_key),m=k?teamByKey(k):null;return `<span><b>${esc(m?.name||a.agent_key)}</b> ${Number(a.score).toFixed(1)}</span>`}).join("")}</div>`:""}${strengths.length?`<div class="agent-procurement-meta">장점 · ${esc(strengths.join(" / "))}</div>`:""}${limits.length?`<div class="agent-procurement-meta">확인 · ${esc(limits.join(" / "))}</div>`:""}</div>`}).join("")}</div>`:`<div class="agent-check" style="color:var(--muted)">구매 목적/사용 시나리오를 먼저 확인한 뒤 후보를 탐색합니다.</div>`}</div>`;
}

function agentAppliedPolicyHtml(c){const snapshot=agentObj(agentObj(c?.context).active_policy_registry),rows=agentArray(snapshot.policies);if(!rows.length)return "";return `<div class="agent-subsection agent-policy-applied"><div class="agent-subsection-title"><b>이번 검토에 참고한 학습 규정</b><span class="agent-status ok">${rows.length}개 · WEIGHTED</span></div><div class="agent-check-list">${rows.map(x=>`<div class="agent-check"><b>${esc(x.policy_code||x.learning_stage||"LEARNING")}</b> · ${esc(agentPolicyDisplayRule(x.rule_text,x.status))}<div class="sub">confidence ${agentPolicyPct(x.confidence)}% · 영향 ${Math.round(Number(x.influence_weight||0)*100)}% · ${esc(agentPolicyStageLabel(x.learning_stage))}${String(x.governance_mode||"ADAPTIVE")==="MANUAL"?" · MANUAL":""}</div></div>`).join("")}</div></div>`}
function agentPolicyEvidenceHtml(h){const rows=agentArray(h?.policy_evidence);if(!rows.length)return "";return `<div class="agent-subsection"><div class="agent-subsection-title"><b>이번 Case의 규정 근거 업데이트</b><span class="agent-status">${rows.length}개</span></div><div class="agent-check-list">${rows.map(x=>`<div class="agent-check"><b>${esc(String(x.effect||"NEUTRAL"))}</b> · ${esc(x.rationale||"")}<div class="sub">policy ${esc(String(x.policy_id||"").slice(0,12))} · strength ${Math.round(Number(x.strength||0)*100)}%</div></div>`).join("")}</div></div>`}

function agentPolicyLearningHtml(c,h){const rows=agentArray(h?.policy_learning_candidates);if(!rows.length)return "";return `<div class="agent-subsection agent-policy-draft"><div class="agent-subsection-title"><b>새 Adaptive 학습 원칙</b><span class="agent-status warn">LEARNING · 자동 시작</span></div><div class="agent-check-list">${rows.map(x=>`<div class="agent-check">${esc(x)}</div>`).join("")}</div><div class="form-actions"><button class="btn" id="agentSyncPolicyCandidates" type="button">📜 학습 엔진에 동기화</button></div><div class="sub" style="margin-top:7px">신규 안건은 하니 종합 시 자동으로 낮은 confidence의 LEARNING 규칙을 만듭니다. 기존 안건만 이 버튼으로 1회 동기화합니다.</div></div>`}
function agentActionGuideHtml(c,h,v,reviews){
  const recommendation=h.recommendation||"NEEDS_DATA",ready=Boolean(h.ready_for_decision)&&c.verification_status==="PASS",hasExecutive=Object.keys(agentObj(h)).length>0,overrideAvailable=hasExecutive&&["REVIEW_COMPLETE","AWAITING_APPROVAL","HELD"].includes(c.status),qs=agentArray(v.human_required_questions).length?agentArray(v.human_required_questions):(agentArray(v.consolidated_questions).length?agentArray(v.consolidated_questions):agentArray(h.representative_questions)),conditional=agentArray(v.conditional_checks),items=[];let title="지금 해야 할 일",desc="대표가 다음 행동을 바로 알 수 있게 요약합니다.",badge="GUIDE";
  if(["ANALYZING","DRAFT"].includes(c.status)){title="현재 상태";badge="분석 진행";desc="AI TEAM이 안건을 검토 중입니다. 아래 내용이 채워지면 결재 판단 단계로 넘어갑니다.";items.push("전문 Agent 의견이 쌓이는 중입니다.");items.push("하니 종합안과 Verify 결과가 생성되면 대표 결재 Gate가 열립니다.");}
  else if(!ready&&qs.length){title="대표 추가정보 필요";badge="답변 필요";desc="아직 바로 결재할 수 없어요. 먼저 아래 질문에 답하면 재검토가 더 정확해집니다.";qs.slice(0,3).forEach(q=>items.push(q));}
  else if(!ready&&overrideAvailable){title="대표 판단 가능 · 검증 경고";badge="OVERRIDE";desc="하니 종합안은 완료되었습니다. Verification이 PASS가 아니어도 대표가 승인·보류·반려·수정요청을 직접 기록할 수 있으며, 비-PASS 승인은 Override로 남습니다.";items.push(`Verify: ${c.verification_status||"-"} · AI 권고: ${AGENT_VERDICT_LABELS[recommendation]||recommendation}`);if(conditional.length)items.push(`구매/실행 전 재확인 ${conditional.length}개`);items.push("대표 결정은 기록만 남깁니다. 구매안건은 승인 후 Wish-list 반영 버튼으로 직접 연결합니다.");}
  else if(!ready){title="결재 대기 전 체크";badge="Gate 점검";desc="왜 WAIT인지와 다음 단계만 간단히 보여줍니다.";items.push(`Verify 상태: ${AGENT_STATUS_LABELS[c.status]||c.status} / ${c.verification_status||'-'}`);if(conditional.length)conditional.slice(0,3).forEach(x=>items.push(typeof x==="string"?x:JSON.stringify(x)));else items.push("하니 종합안 또는 검증 PASS가 아직 완료되지 않았습니다.");}
  else if(["AWAITING_APPROVAL","HELD"].includes(c.status)){title="대표 결재 가능";badge="READY";desc="이제 승인 / 보류 / 반려 / 수정 요청 중 하나를 선택할 수 있습니다.";items.push(`AI TEAM 대표 권고: ${AGENT_VERDICT_LABELS[recommendation]||recommendation}`);items.push("승인은 대표 판단을 기록하고, 구매안건은 승인 뒤 ‘Wish-list에 담기’로 실제 Life OS에 반영합니다.");if(conditional.length)items.push(`조건/재확인 ${conditional.length}개를 함께 확인하세요.`);}
  else if(["APPROVED","REJECTED","COMMITTED","COMMITTING"].includes(c.status)){title="최근 처리 상태";badge=AGENT_STATUS_LABELS[c.status]||c.status;desc="현재 안건은 이미 대표 결정 또는 후속 반영 단계에 들어가 있습니다.";items.push(`현재 상태: ${AGENT_STATUS_LABELS[c.status]||c.status}`);items.push(`AI 권고: ${AGENT_VERDICT_LABELS[recommendation]||recommendation}`);items.push(`마지막 리뷰 라운드: ${agentLatestReviewRound(reviews)}차`);}
  else {items.push(`AI TEAM 대표 권고: ${AGENT_VERDICT_LABELS[recommendation]||recommendation}`);items.push(`Verify: ${c.verification_status||'-'} / Status: ${AGENT_STATUS_LABELS[c.status]||c.status}`);}
  return `<div class="agent-next-action"><div class="agent-next-action-head"><div><b>${esc(title)}</b><span>${esc(desc)}</span></div><span class="agent-status ${ready?"ok":qs.length?"warn":""}">${esc(badge)}</span></div><div class="agent-next-action-list">${items.map((item,i)=>`<div class="agent-next-action-item"><i>${i+1}</i><div>${esc(item)}</div></div>`).join("")}</div></div>`;
}
function agentResumeHtml(c,h,v,reviews){
  const ctx=agentObj(c?.context),rep=agentObj(ctx.representative_answers),hasRep=Object.keys(rep).length>0,hasFinal=Object.keys(agentObj(h)).length>0,hasVerification=Object.keys(agentObj(v)).length>0,latest=agentLatestReviewRound(reviews);
  if(!(c.status==="ANALYZING"&&hasRep&&!hasFinal&&!hasVerification&&latest>=2))return "";
  return `<div class="agent-subsection"><div class="agent-subsection-title"><b>중단된 재검토 복구</b><span class="agent-status warn">RECOVERY</span></div><div class="agent-check">대표 추가답변은 이미 Case Context에 안전하게 저장되어 있습니다. 중복된 ${latest}차 Review는 건드리지 않고 다음 라운드부터 이어갑니다.</div><div class="form-actions"><button class="btn primary" id="agentResumeReview" type="button">중단된 재검토 이어가기</button></div></div>`;
}
async function agentResumeReview(){
  const c=agentDetailCache?.case;if(!c)return;const previousRound=agentLatestReviewRound(agentDetailCache?.reviews||[]),nextRound=Math.max(2,previousRound+1),router=agentObj(agentObj(c.context).router_v2),researchPolicy=String(router.external_research||"NONE").toUpperCase();
  if(!confirm(`저장된 대표 추가답변을 사용해 ${nextRound}차 재검토부터 이어갈까요?\n\n기존 Review 이력은 삭제하지 않습니다.`))return;
  try{
    if(researchPolicy!=="NONE"){agentSetBusy(true,"대표 목적/환경 반영 · AI 구매팀 Research 갱신 중");await agentApi("research_case",{case_id:c.id,force_refresh:true,reason:"RECOVER_AFTER_DUPLICATE_ROUND"})}
    agentSetBusy(true,`${nextRound}차 전문 Agent 재심의 중`);await agentApi("run_reviews",{case_id:c.id,review_round:nextRound});
    agentSetBusy(true,"Verification · 하니 재종합 중");await agentApi("verify_and_synthesize",{case_id:c.id,force_reverify:true,force_finalize_with_current_context:nextRound>=3});
    toast(`${nextRound}차 재검토를 이어서 완료했습니다.`);await agentLoadCases({selectId:c.id})
  }catch(e){console.error("Resume Agent review",e);alert("중단된 재검토 복구 중 오류가 발생했습니다.\n"+(e?.message||e));await agentLoadCases({selectId:c.id}).catch(()=>{})}
  finally{agentSetBusy(false)}
}
function agentQuestionsHtml(v,h,c){
  const qs=agentArray(v.human_required_questions).length?agentArray(v.human_required_questions):(agentArray(v.consolidated_questions).length?agentArray(v.consolidated_questions):agentArray(h.representative_questions));if(!qs.length)return "";
  if(!["REVIEW_COMPLETE","ANALYZING"].includes(c.status))return `<div class="agent-subsection"><div class="agent-subsection-title"><b>대표 추가정보</b></div>${agentListHtml(qs)}</div>`;
  const ctx=agentObj(c?.context),ext=agentObj(ctx.external_research),hasCandidates=agentArray(ext.candidate_options).length>0,canFinalizeCurrent=c?.workflow==="PURCHASE_REVIEW"&&["LOW","MEDIUM"].includes(String(c?.risk_level||"LOW").toUpperCase())&&hasCandidates;
  return `<div class="agent-subsection"><div class="agent-subsection-title"><b>대표만 답할 수 있는 추가정보 · HUMAN REQUIRED</b><span class="agent-status warn">${qs.length}개</span></div><div class="agent-question-list">${qs.map((q,i)=>`<div class="agent-question"><b>${i+1}. ${esc(q)}</b><textarea data-agent-answer="${i}" placeholder="답변을 입력하세요"></textarea></div>`).join("")}</div><div class="form-actions"><button class="btn primary" id="agentSubmitAnswers" type="button">답변 반영하고 재검토</button>${canFinalizeCurrent?`<button class="btn" id="agentFinalizeCurrent" type="button">현재 정보로 결론내기</button>`:""}</div>${canFinalizeCurrent?`<div class="sub" style="margin-top:8px">같은 취지의 질문이 반복되거나 더 답하고 싶지 않다면, 현재까지의 답변·HANI OS 데이터·구매팀 조사 결과로 조건부 결재안을 만들 수 있습니다.</div>`:""}</div>`;
}
function agentApprovedWishDraft(c,h){const ctx=agentObj(c?.context),research=agentObj(ctx.external_research),proc=agentObj(research.procurement),candidates=agentArray(research.candidate_options),scorecard=agentPurchaseScorecard(h),selection=String(scorecard.haniPick||h?.product_selection||"").trim(),selectionNorm=selection.toLocaleLowerCase("ko-KR").replace(/\s+/g,""),picked=candidates.find(x=>selectionNorm&&String(x?.name||"").toLocaleLowerCase("ko-KR").replace(/\s+/g,"")&&selectionNorm.includes(String(x?.name||"").toLocaleLowerCase("ko-KR").replace(/\s+/g,"")))||candidates[0]||null,name=String(picked?.name||selection||c?.title||"승인 구매 후보").replace(/^(1순위|우선 검토)\s*[:·-]?\s*/i,"").trim(),reason=agentSafeText(h?.summary||h?.executive_summary||h?.purchase_eligibility||"AI TEAM 구매 검토 후 대표 승인",260),note=[c?.case_code?`AI 결재실 ${c.case_code} 승인`:"AI 결재실 승인",selection&&selection!==name?`결론: ${selection}`:"",picked?.fit?`적합성: ${picked.fit}`:""].filter(Boolean).join(" · ");return normalizeWishItem({kind:"item",name,category:String(picked?.category||proc.recommended_category||"기타"),price:picked?.observed_price_krw??null,priority:"medium",status:"consider",reason,note,sourceType:"agent",sourceLabel:String(c?.case_code||c?.id||""),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()})}
function agentWishAlreadySynced(c,draft=null){const key=String(c?.case_code||c?.id||""),nameKey=String(draft?.name||"").toLocaleLowerCase("ko-KR").replace(/[\s·\-_/()\[\]{}:："'“”‘’.,]+/g,"");return Boolean((state.wishlistItems||[]).some(x=>(key&&x.sourceType==="agent"&&x.sourceLabel===key)||(nameKey&&String(x.name||"").toLocaleLowerCase("ko-KR").replace(/[\s·\-_/()\[\]{}:："'“”‘’.,]+/g,"")===nameKey)))}
function agentSendApprovedPurchaseToWishlist(){const c=agentDetailCache?.case,h=agentObj(c?.hani_final),latest=agentDetailCache?.decisions?.[0];if(!c||c.workflow!=="PURCHASE_REVIEW"||latest?.representative_decision!=="APPROVE")return alert("대표 승인된 구매 검토안만 Wish-list에 반영할 수 있어요.");const draft=agentApprovedWishDraft(c,h);if(!draft.name)return alert("Wish-list에 넣을 구매 후보명을 확인하지 못했습니다.");if(agentWishAlreadySynced(c,draft)){toast("이미 Wish-list에 같은 안건/후보가 있습니다.");showView("wishlist");return}const price=draft.price!==null?`\n예상가격: ${won(draft.price)}`:"";if(!confirm(`승인 결과를 Wish-list에 담을까요?\n\n${draft.name}${price}\n\n※ 실제 구매 완료 처리가 아니라 ‘검토중’ Wish로 저장합니다.`))return;state.wishlistItems.push(draft);commit(`AI 결재 승인안 ‘${draft.name}’을 Wish-list에 반영했습니다.`);renderWishlist();renderAgentCaseDetail();toast("Wish-list에 반영했습니다. 💜")}
const AGENT_DECISION_DOCK_UI_KEY="hani_ui_agent_decision_dock_collapsed_v1";
function agentDecisionDockIsCollapsed(){try{return sessionStorage.getItem(AGENT_DECISION_DOCK_UI_KEY)==="1"}catch(e){return false}}
function agentToggleDecisionDock(){const dock=$("agentDecisionDock"),btn=$("agentDecisionDockToggle");if(!dock)return;const collapsed=!dock.classList.contains("is-collapsed");dock.classList.toggle("is-collapsed",collapsed);try{sessionStorage.setItem(AGENT_DECISION_DOCK_UI_KEY,collapsed?"1":"0")}catch(e){}if(btn){btn.textContent=collapsed?"▴ 펼치기":"▾ 접기";btn.setAttribute("aria-expanded",collapsed?"false":"true");btn.title=collapsed?"최종 결재창 펼치기":"최종 결재창 접기"}}
function renderAgentCaseDetail(){
  const root=$("agentCaseDetail");if(!root||!agentDetailCache)return;const {case:c,reviews,decisions,events}=agentDetailCache,h=agentObj(c.hani_final),v=agentObj(c.verification),latestDecision=decisions[0]||null,recommendation=h.recommendation||"NEEDS_DATA",ready=Boolean(h.ready_for_decision)&&c.verification_status==="PASS",hasExecutive=Object.keys(h).length>0,canDecide=hasExecutive&&["REVIEW_COMPLETE","AWAITING_APPROVAL","HELD"].includes(c.status),overrideMode=canDecide&&!ready,conditional=agentArray(v.conditional_checks),conflicts=agentArray(h.key_conflicts).length?agentArray(h.key_conflicts):agentArray(v.conflicts),required=agentArray(h.required_next_actions),wishEligible=c.workflow==="PURCHASE_REVIEW"&&latestDecision?.representative_decision==="APPROVE",wishSynced=wishEligible&&agentWishAlreadySynced(c),lifeStatus=wishSynced?"Wish-list 반영 완료":wishEligible?"Wish-list 반영 대기":"결정 이력 저장";
  const dockCollapsed=agentDecisionDockIsCollapsed();
  const axisLabels=c.workflow==="PURCHASE_REVIEW"
    ?agentPurchaseAxisLabels(c)
    :["1 · 결정 가능 여부","2 · 핵심 권고안","3 · 진행 방식","4 · 시점 / 다음 단계"],purchaseMode=c.workflow==="PURCHASE_REVIEW"?agentPurchaseMode(c):"";
  root.className="";
  root.innerHTML=`
    <div class="agent-report-head"><div><div class="agent-report-code">${esc(c.case_code||"")} · ${esc(c.workflow||"")}</div><h3>${esc(c.title||"제목 없는 안건")}</h3><div class="sub">업데이트 ${esc(agentFmtDate(c.updated_at))}</div></div><div class="agent-chips"><span class="agent-status ${agentStatusTone(c.status)}">${esc(AGENT_STATUS_LABELS[c.status]||c.status)}</span><span class="agent-status">${esc(c.risk_level||"LOW")} RISK</span><span class="agent-status ${c.verification_status==="PASS"?"ok":"warn"}">VERIFY ${esc(c.verification_status||"-")}</span>${purchaseMode?`<span class="agent-status purchase-mode-chip">${esc(agentPurchaseModeLabel(purchaseMode))}</span>`:""}</div></div>
    <div class="agent-timeline">${agentTimelineHtml(c,events)}</div>
    ${agentExecutiveSummaryHtml(h,v,latestDecision)}
    <div class="agent-decision-grid"><div class="agent-decision-box"><small>${axisLabels[0]}</small><b>${esc(h.purchase_eligibility||"-")}</b></div><div class="agent-decision-box"><small>${axisLabels[1]}</small><b>${esc(h.product_selection||"-")}</b></div><div class="agent-decision-box"><small>${axisLabels[2]}</small><b>${esc(h.purchase_method||"-")}</b></div><div class="agent-decision-box"><small>${axisLabels[3]}</small><b>${esc(h.timing||"-")}</b></div></div>
    ${agentProcurementHtml(c,h,reviews)}
    <div class="agent-subsection"><div class="agent-subsection-title"><b>전문 Agent 의견</b><span class="agent-status">${agentLatestReviewRound(reviews)}차 Review</span></div><div class="agent-position-list">${agentPositionsHtml(h,reviews)}</div></div>
    ${agentActionGuideHtml(c,h,v,reviews)}
    ${agentResumeHtml(c,h,v,reviews)}
    ${agentInternalContextHtml(c)}
    ${agentAppliedPolicyHtml(c)}
    ${agentPolicyEvidenceHtml(h)}
    <div class="agent-subsection"><div class="agent-subsection-title"><b>조건 / 재확인</b><span class="agent-status ${conditional.length?"warn":"ok"}">${conditional.length}개</span></div><div class="agent-check-list">${agentListHtml(conditional,"추가 조건 없음")}</div></div>
    ${conflicts.length?`<div class="agent-subsection"><div class="agent-subsection-title"><b>주요 이견</b></div><div class="agent-check-list">${agentListHtml(conflicts)}</div></div>`:""}
    ${required.length?`<div class="agent-subsection"><div class="agent-subsection-title"><b>후속 조치</b></div><div class="agent-check-list">${agentListHtml(required)}</div></div>`:""}
    ${agentPolicyLearningHtml(c,h)}
    ${agentQuestionsHtml(v,h,c)}
    <div class="agent-decision-dock ${overrideMode?"override-mode":""} ${dockCollapsed?"is-collapsed":""}" id="agentDecisionDock"><div class="row start agent-decision-dock-head"><div><b>성민 대표님 최종 결재</b><div class="sub">${ready?"정상 결재 가능 상태입니다.":overrideMode?"Verification 경고가 남아 있지만 대표 판단을 기록할 수 있습니다. 승인 시 Override로 기록됩니다.":"하니 종합안이 완료되면 대표 판단 버튼이 열립니다."} · Life OS ${esc(lifeStatus)}</div></div><div class="agent-decision-dock-head-actions"><span class="agent-status ${ready?"ok":overrideMode?"warn":"warn"}">${ready?"READY":overrideMode?"OVERRIDE":"WAIT"}</span><button class="btn sm agent-decision-dock-toggle" id="agentDecisionDockToggle" type="button" aria-expanded="${dockCollapsed?"false":"true"}" title="${dockCollapsed?"최종 결재창 펼치기":"최종 결재창 접기"}">${dockCollapsed?"▴ 펼치기":"▾ 접기"}</button></div></div><div class="agent-decision-dock-body">${overrideMode?`<div class="form-actions" style="margin:10px 0 2px"><button class="btn" id="agentGateRecheck" type="button">↻ 현재 정보로 Gate 재검증</button></div>`:""}<div class="agent-note"><textarea id="agentRepresentativeNote" placeholder="선택 메모 · 수정 요청을 누를 때는 필수입니다."></textarea></div><div class="agent-decision-actions"><button class="btn approve" data-agent-decision="APPROVE" type="button" ${canDecide?"":"disabled"}>✓ 승인</button><button class="btn hold" data-agent-decision="HOLD" type="button" ${canDecide?"":"disabled"}>⏸ 보류</button><button class="btn danger" data-agent-decision="REJECT" type="button" ${canDecide?"":"disabled"}>✕ 반려</button><button class="btn" data-agent-decision="REVISION_REQUESTED" type="button" ${canDecide?"":"disabled"}>↺ 수정 요청</button></div>${latestDecision?`<div class="agent-last-decision"><b>최근 대표 결정 · ${esc(AGENT_DECISION_LABELS[latestDecision.representative_decision]||latestDecision.representative_decision)}</b><br>${esc(agentFmtDate(latestDecision.decided_at))} · AI 권고 ${esc(AGENT_VERDICT_LABELS[latestDecision.ai_recommendation]||latestDecision.ai_recommendation||"-")} · Override ${latestDecision.override?"YES":"NO"} · Life OS ${esc(lifeStatus)}</div>`:""}${wishEligible?`<div class="agent-life-actions"><div><b>${wishSynced?"✓ Wish-list 반영 완료":"승인 결과를 Life OS에 반영할까요?"}</b><span>${wishSynced?"이 안건에서 선택한 구매 후보가 Wish-list에 연결되어 있습니다.":"대표 승인은 판단 이력만 남깁니다. 아래 버튼을 눌러야 실제 Wish-list에 후보가 저장됩니다."}</span></div><button class="btn ${wishSynced?"":"primary"}" id="agentSendToWishlist" type="button">${wishSynced?"Wish-list 열기":"♥ Wish-list에 담기"}</button></div>`:""}</div></div>`;
  if($("agentDecisionDockToggle"))$("agentDecisionDockToggle").onclick=agentToggleDecisionDock;root.querySelectorAll("[data-agent-decision]").forEach(b=>b.onclick=()=>agentRecordDecision(b.dataset.agentDecision));if($("agentSubmitAnswers"))$("agentSubmitAnswers").onclick=agentSubmitAnswers;if($("agentFinalizeCurrent"))$("agentFinalizeCurrent").onclick=agentFinalizeWithCurrentContext;if($("agentGateRecheck"))$("agentGateRecheck").onclick=agentFinalizeWithCurrentContext;if($("agentResumeReview"))$("agentResumeReview").onclick=agentResumeReview;if($("agentSyncPolicyCandidates"))$("agentSyncPolicyCandidates").onclick=agentSyncCasePolicyCandidates;if($("agentSendToWishlist"))$("agentSendToWishlist").onclick=()=>wishSynced?showView("wishlist"):agentSendApprovedPurchaseToWishlist();
}
async function agentRecordDecision(decision){
  const c=agentDetailCache?.case;if(!c)return;const label=AGENT_DECISION_LABELS[decision]||decision,note=$("agentRepresentativeNote")?.value.trim()||"";
  if(decision==="REVISION_REQUESTED"){
    if(!note)return alert("어떻게 고칠지 자연어로 적어 주세요. 예: ‘가격은 150만원 기준으로 보고, 나머지 조건은 그대로 유지해줘.’");
    const previousRound=agentLatestReviewRound(agentDetailCache?.reviews||[]),nextRound=Math.max(2,previousRound+1),router=agentObj(agentObj(c.context).router_v2),researchPolicy=String(router.external_research||"NONE").toUpperCase();
    if(!confirm(`수정 요청을 반영해 ${nextRound}차 재검토할까요?\n\n“${note}”\n\n• 기존 Review/근거는 삭제하지 않습니다.\n• 언급하지 않은 조건은 그대로 유지합니다.\n• 수정 요청만 새 대표 Context로 추가합니다.`))return;
    try{agentSetBusy(true,"대표 수정 요청 기록 중");await agentApi("representative_decision",{case_id:c.id,representative_decision:"REVISION_REQUESTED",representative_note:note});if(researchPolicy!=="NONE"){agentSetBusy(true,"수정 조건 반영 · 필요한 Research 갱신 중");await agentApi("research_case",{case_id:c.id,force_refresh:true,reason:"REPRESENTATIVE_REVISION_REQUESTED"})}agentSetBusy(true,`${nextRound}차 전문 Agent 재심의 중`);await agentApi("run_reviews",{case_id:c.id,review_round:nextRound});agentSetBusy(true,"Verification · 하니 수정안 재종합 중");await agentApi("verify_and_synthesize",{case_id:c.id,force_reverify:true});if($("agentRepresentativeNote"))$("agentRepresentativeNote").value="";toast("수정 요청을 이력에 남기고, 요청한 부분만 반영해 결재안을 다시 만들었습니다.");await agentLoadCases({selectId:c.id})}catch(e){console.error("Representative revision",e);alert("자연어 수정 반영 중 오류가 발생했습니다.\n"+(e?.message||e));await agentLoadCases({selectId:c.id}).catch(()=>{})}finally{agentSetBusy(false)}return;
  }
  if(["HOLD","REJECT"].includes(decision)&&!note)return alert(`${label} 이유를 한 줄이라도 남겨 주세요. 이후 Decision Feedback에서 참고합니다.`);
  const msg=decision==="APPROVE"?`「${c.title}」을 승인할까요?\n\n승인은 대표 결정 이력만 기록합니다.\n구매안건은 승인 후 ‘Wish-list에 담기’를 눌러야 Life OS에 반영됩니다.`:`「${c.title}」을 ${label} 처리할까요?\n\n이유: ${note}\n기존 Review와 결정 이력은 보존됩니다.`;
  if(!confirm(msg))return;
  try{agentSetBusy(true,`${label} 기록 중`);const result=await agentApi("representative_decision",{case_id:c.id,representative_decision:decision,representative_note:note});toast(result.message||`대표 ${label} 결정을 기록했습니다.`);await agentLoadCases({selectId:c.id})}catch(e){console.error("Representative decision",e);alert("대표 결정 기록에 실패했습니다.\n"+(e?.message||e))}finally{agentSetBusy(false)}
}
async function agentFinalizeWithCurrentContext(){
  const c=agentDetailCache?.case;if(!c)return;
  if(!confirm("추가 질문을 더 받지 않고 현재까지의 답변·HANI OS 데이터·Research 결과로 결재안을 만들까요?\n\n※ LOW/MEDIUM 구매안건의 비핵심 불확실성은 조건/재확인으로 내리고, 실제 충돌·무결성 문제만 Gate를 유지합니다."))return;
  try{
    agentSetBusy(true,"현재 정보로 Verification · 하니 최종 종합 중");
    const result=await agentApi("verify_and_synthesize",{case_id:c.id,force_reverify:true,force_finalize_with_current_context:true});
    toast(result.message||"현재 정보로 결재안을 만들었습니다.");await agentLoadCases({selectId:c.id});
  }catch(e){console.error("Finalize current context",e);alert("현재 정보로 결론을 만드는 중 오류가 발생했습니다.\n"+(e?.message||e))}
  finally{agentSetBusy(false)}
}
async function agentSubmitAnswers(){
  const c=agentDetailCache?.case,v=agentObj(c?.verification),h=agentObj(c?.hani_final);if(!c)return;const qs=agentArray(v.human_required_questions).length?agentArray(v.human_required_questions):(agentArray(v.consolidated_questions).length?agentArray(v.consolidated_questions):agentArray(h.representative_questions)),answers=[...document.querySelectorAll("[data-agent-answer]")].map((el,i)=>({question:qs[i]||"",answer:el.value.trim()}));
  if(answers.some(x=>!x.answer))return alert("대표 추가질문에 모두 답변해 주세요.");if(!confirm("답변을 Case Context에 반영하고 재검토를 진행할까요?"))return;
  try{
    const previousRound=agentLatestReviewRound(agentDetailCache?.reviews||[]),nextRound=Math.max(2,previousRound+1);
    agentSetBusy(true,"대표 답변 반영 중");await agentApi("apply_representative_context",{case_id:c.id,representative_context:{qa:answers,supplied_at:new Date().toISOString(),source:"HANI_OS_AGENT_UI",previous_review_round:previousRound}});
    const router=agentObj(agentObj(c.context).router_v2),researchPolicy=String(router.external_research||"NONE").toUpperCase();
    if(researchPolicy!=="NONE"){agentSetBusy(true,"대표 목적/환경 반영 · AI 구매팀 Research 갱신 중");await agentApi("research_case",{case_id:c.id,force_refresh:true,reason:"REPRESENTATIVE_CONTEXT_UPDATED"})}
    agentSetBusy(true,`${nextRound}차 전문 Agent 재심의 중`);await agentApi("run_reviews",{case_id:c.id,review_round:nextRound});
    agentSetBusy(true,"Verification · 하니 재종합 중");await agentApi("verify_and_synthesize",{case_id:c.id,force_reverify:true});
    await agentLoadCases({selectId:c.id})
  }catch(e){console.error("Representative answers",e);alert("답변 반영/재검토 중 오류가 발생했습니다.\n"+(e?.message||e))}
  finally{agentSetBusy(false)}
}
async function agentSubmitNewRequest(){
  const input=$("agentRequestInput"),text=input?.value.trim()||"";if(!text)return alert("AI TEAM에 맡길 요청을 입력해 주세요.");
  try{
    agentSetBusy(true,"요청 의도 분석 중");
    let classified=await agentApi("classify_request",{source_text:text}),router=agentObj(classified.router),routerSource=text;
    const questions=agentArray(router.ambiguity_questions);
    if(questions.length){
      const answers=[];for(const q of questions){const a=prompt(`하니가 한 가지만 확인할게요 💜\n\n${q}`);if(a===null){agentSetBusy(false);return}answers.push({question:q,answer:a.trim()})}
      routerSource=`${text}\n\n[대표 추가답변]\n${answers.map(x=>`${x.question}: ${x.answer}`).join("\n")}`;
      agentSetBusy(true,"추가답변 반영해 요청 재분류 중");classified=await agentApi("classify_request",{source_text:routerSource});router=agentObj(classified.router);router.initial_answers=answers;
    }
    const internalData=agentBuildInternalContext(agentArray(router.internal_data_requests));
    if(!confirm(`새 Agent 안건으로 접수할까요?\n\n${agentRouterLabel(router)}\n\n※ HANI OS 내부자료는 읽기 전용 요약만 Case Context에 첨부됩니다.\n※ AI/API 비용이 발생할 수 있습니다.`))return;
    agentSetBusy(true,"안건 접수 중");
    const created=await agentApi("create_case",{workflow:router.primary_intent||"GENERAL_REVIEW",title:agentTitleFromText(text),risk_level:router.risk_level||"LOW",source_type:"USER_TEXT",source_text:text,context:{origin:"HANI_OS_AGENT_UI",ui_version:HANI_DISPLAY_VERSION,router_v2:router,internal_data:internalData,router_source_with_answers:routerSource!==text?routerSource:undefined}}),id=created.case?.id;if(!id)throw new Error("생성된 Case ID를 확인하지 못했습니다.");
    agentSetBusy(true,"담당 Agent 배정 중");await agentApi("route_case",{case_id:id});
    agentSetBusy(true,"전문 Agent 1차 심의 중");await agentApi("run_reviews",{case_id:id,review_round:1});
    const researchPolicy=String(router.external_research||"NONE").toUpperCase(),isPurchase=(router.primary_intent||"")==="PURCHASE_REVIEW";
    if(isPurchase){
      agentSetBusy(true,"구매 목적 · 정보소유자 Preflight 중");const preflight=await agentApi("preflight_case",{case_id:id}),humanQs=agentArray(preflight.human_required_questions),researchItems=agentArray(preflight.research_required_items);
      if(humanQs.length){if(input)input.value="";toast("대표만 알 수 있는 목적/사용환경을 먼저 확인합니다.");await agentLoadCases({selectId:id});return}
      if(researchPolicy==="REQUIRED"||researchPolicy==="IF_NEEDED"||(preflight.can_auto_research&&researchItems.length)){
        agentSetBusy(true,"AI 구매팀 · External Research 중");await agentApi("research_case",{case_id:id,force_refresh:true,reason:"PURPOSE_PREFLIGHT_PASSED"});
        agentSetBusy(true,"Research 반영 2차 전문 심의 중");await agentApi("run_reviews",{case_id:id,review_round:2});
      }
      agentSetBusy(true,"Verification · 하니 종합 중");await agentApi("verify_and_synthesize",{case_id:id,force_reverify:true});
    }else{
      if(researchPolicy==="REQUIRED"||researchPolicy==="IF_NEEDED"){
        agentSetBusy(true,"최신 External Research 중");await agentApi("research_case",{case_id:id});
        agentSetBusy(true,"Research 반영 2차 전문 심의 중");await agentApi("run_reviews",{case_id:id,review_round:2});
      }
      agentSetBusy(true,"Verification · 하니 종합 중");await agentApi("verify_and_synthesize",{case_id:id});
    }
    if(input)input.value="";toast("Purpose-first AI TEAM 종합검토가 완료됐습니다.");await agentLoadCases({selectId:id})
  }catch(e){console.error("New Agent request",e);alert("AI TEAM 검토 중 오류가 발생했습니다.\\n"+(e?.message||e));await agentLoadCases().catch(()=>{})}
  finally{agentSetBusy(false)}
}
async function agentReviewInit(){
  if(!$("agentReview"))return;if($("agentSubmitRequest"))$("agentSubmitRequest").onclick=agentSubmitNewRequest;if($("agentRefreshCases"))$("agentRefreshCases").onclick=async()=>{try{agentSetBusy(true,"안건 새로고침 중");await agentLoadCases({selectId:agentActiveCaseId})}catch(e){console.error("Agent refresh",e);alert("Agent Workspace를 새로고침하지 못했습니다.\n"+(e?.message||e))}finally{agentSetBusy(false)}};
  if(!agentRequireCloud())return;try{await agentLoadCases({selectId:agentActiveCaseId})}catch(e){console.error("Agent init",e);if($("agentCaseList"))$("agentCaseList").innerHTML=`<div class="empty">Agent Workspace를 불러오지 못했습니다.<br>${esc(e?.message||e)}</div>`}
}
async function agentPolicyInit(){if(!$("policy"))return;if($("agentRefreshPolicies"))$("agentRefreshPolicies").onclick=()=>agentLoadPolicyRegistry();if(!agentRequireCloud())return;try{await agentLoadPolicyRegistry()}catch(e){console.error("Policy init",e);if($("agentPolicyRegistry"))$("agentPolicyRegistry").innerHTML=`<div class="empty">사내 규칙을 불러오지 못했습니다.<br>${esc(e?.message||e)}</div>`}}


function renderAll(){syncHaniDisplayVersion();refreshSelects();renderAccounts();renderInstruments();renderHoldings();renderTransactions();renderMonthlySnapshots();renderInvestmentQuickSuite();renderInvestmentHighlights();renderInvestmentAccountOverview();renderInvestmentNews();syncOverviewYearMirror();renderPortfolio();renderAssets();renderLedger();renderWishlist();renderBody();renderExercise();renderReading();renderMovies();renderDiary();renderCampus();renderTravel();renderCertificates();renderTasks();renderCalendar();renderTeam();renderNotes();renderHome();renderStoragePanel()}
function downloadJson(serialized,filename){const blob=new Blob([serialized],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function exportData({suffix="",silent=false}={}){
  try{
    const exportedAt=new Date().toISOString();state.meta={...freshState().meta,...(state.meta||{}),lastBackupAt:exportedAt};
    const saveResult=save();
    const payload={...state,version:VERSION,exportedAt,_haniBackup:{app:"HANI OS Life Edition",format:1,version:VERSION,storageKey:STORAGE_KEY,exportedAt}};
    const serialized=JSON.stringify(payload,null,2),safeSuffix=suffix?`_${suffix.replace(/[^a-zA-Z0-9가-힣_-]/g,"_")}`:"";
    downloadJson(serialized,`HANI_OS_v${VERSION}_backup_${today()}${safeSuffix}.json`);
    renderStoragePanel();if(!silent)toast(saveResult.ok?"백업 파일을 만들었습니다.":"브라우저 저장은 실패했지만 현재 메모리 데이터로 백업 파일을 만들었습니다.");
    return true;
  }catch(e){console.error(e);alert("백업 파일을 만드는 중 오류가 발생했습니다.");return false}
}
function validateBackup(raw){
  if(!raw||typeof raw!=="object"||Array.isArray(raw))throw new Error("백업 최상위 구조가 올바르지 않습니다.");
  const data=raw.data&&typeof raw.data==="object"?raw.data:raw;
  const hasAccounts=Array.isArray(data.accounts),isCurrent=hasAccounts&&["instruments","transactions","books","movies","body","exercise"].some(k=>Array.isArray(data[k])),isV22=hasAccounts&&(Array.isArray(data.assets)||Array.isArray(data.trades)||Array.isArray(data.cash));
  if(!isCurrent&&!isV22)throw new Error("HANI OS 데이터 구조를 확인할 수 없습니다.");
  if(data.accounts.some(a=>!a||typeof a!=="object"))throw new Error("계좌 데이터가 손상되었습니다.");
  return {data,kind:isCurrent?"current":"v22"};
}
function backupSummary(d){return `계좌 ${d.accounts?.length||0}개 · 종목 ${(d.instruments||d.assets||[]).length}개 · 거래 ${(d.transactions||d.trades||[]).length}건 · 월간 스냅샷 ${(d.investmentMonthlySnapshots||[]).length+(d.investmentBrokerSnapshots||[]).length}건 · 보조 입출금 ${(d.investmentCashFlows||[]).length}건 · 투자일기 ${(d.investmentJournal||[]).length}건 · 관심종목 ${(d.investmentWatchlist||[]).length}개 · 소비결산 ${(d.ledgerMonths||[]).length}개월 · 소비리뷰 ${(d.spendReviews||[]).length}건 · 책 ${(d.books||[]).length}권 · 시청 ${(d.movies||[]).length}편 · 일기 ${(d.diaries||[]).length}개 · 학기 ${(d.campusSemesters||[]).length}개 · 여행 ${(d.travelTrips||[]).length}회 · 여행 Wish ${(d.travelWishlist||[]).length}곳 · 자격증 ${(d.certificates||[]).length}개 · Wish ${(d.wishlistItems||[]).length}개`}
$("exportBtn").onclick=()=>exportData();$("quickBackup").onclick=()=>exportData();$("importBtn").onclick=()=>$("importFile").click();
$("importFile").onchange=async e=>{
  const file=e.target.files?.[0];if(!file)return;
  try{
    if(file.size>30*1024*1024)throw new Error("백업 파일이 30MB를 초과합니다.");
    const parsed=JSON.parse(await file.text()),checked=validateBackup(parsed),candidate=checked.kind==="current"?normalizeState(checked.data):migrateV22(checked.data);
    if(!confirm(`다음 백업을 불러올까요?\n${backupSummary(checked.data)}\n\n현재 데이터는 자동 백업 파일로 먼저 내려받습니다.`))return;
    exportData({suffix:"before_import",silent:true});
    const previous=state;state=candidate;state.meta={...freshState().meta,...(state.meta||{}),lastImportAt:new Date().toISOString()};
    const result=save();
    if(!result.ok){state=previous;renderAll();throw new Error("복원 데이터를 브라우저에 저장하지 못했습니다. 기존 데이터는 유지했습니다.")}
    lastLoadError="";renderAll();toast("백업 검증과 복원을 완료했습니다.");
  }catch(err){console.error(err);alert("백업을 복원하지 못했습니다.\n"+(err?.message||"올바른 HANI OS 백업 파일인지 확인해 주세요."))}
  finally{e.target.value=""}
};
function migrateV22(d){
  const base=freshState();if(!Array.isArray(d.accounts))throw new Error("Invalid v2.2 backup");base.accounts=d.accounts.map((a,idx)=>({id:a.id||uid(),name:a.id==="pension"?"연금":a.id==="brokerage"?"위탁":a.id==="us"?"토스":(a.type||`계좌 ${idx+1}`),type:a.type||"투자계좌",broker:a.broker||"",number:a.number||"",openingCash:0}));
  const byOldAsset={};(d.assets||[]).forEach(a=>{let i=base.instruments.find(x=>x.name===a.name);if(!i){i={id:uid(),name:a.name,className:a.cls||"기타",ticker:"",price:n(a.price)};base.instruments.push(i)}byOldAsset[a.id]=i.id});
  (d.trades||[]).forEach(t=>base.transactions.push({id:t.id||uid(),date:t.date||today(),accountId:t.accountId,instrumentId:byOldAsset[t.assetId],type:t.type==="배당"?"현금조정":t.type,qty:n(t.qty),price:n(t.price),fee:n(t.fee),amount:t.type==="배당"?n(t.price):undefined,note:t.type==="배당"?"v2.2 배당 기록":"v2.2 복원",createdAt:new Date().toISOString()}));
  (d.cash||[]).forEach(c=>base.transactions.push({id:c.id||uid(),date:c.date||today(),accountId:c.accountId,type:c.type,amount:n(c.amount),note:"v2.2 현금 기록",createdAt:new Date().toISOString()}));
  const temp=state;state=base;const calc=calculate();base.accounts.forEach(a=>{const old=d.accounts.find(x=>x.id===a.id);if(old)a.openingCash=n(old.cash)-n(calc.accounts[a.id]?.cash)});state=temp;
  base.ui.series=["total",...base.accounts.map(a=>a.id)];base.snapshots=d.shots||[];base.body=d.body||[];base.cardio=d.cardio||[];base.strength=d.strength||[];return normalizeState(base)
}
$("resetBtn").onclick=()=>{if(!confirm("모든 기록을 삭제하고 기본 계좌만 남길까요?\n초기화 직전 자동 백업 파일을 먼저 만듭니다."))return;exportData({suffix:"before_reset",silent:true});const previous=state;state=freshState();const result=save();if(!result.ok){state=previous;renderAll();return alert("초기화 상태를 저장하지 못해 기존 데이터를 유지했습니다.")}renderAll();toast("백업 후 기본 계좌 상태로 초기화했습니다.")};


$("brokerNew").onclick=()=>{if(brokerDraft&&brokerDraft.accounts.some(a=>a.estimatedAssets!==null)&&!confirm("현재 입력을 비우고 새 월간 기록을 만들까요?"))return;setBrokerDraft(brokerBlank("actual"))};
$("brokerCopyLatest").onclick=()=>{const s=officialBrokerLatest();if(!s)return alert("불러올 이전 월간 기록이 없습니다.");copyBrokerToNextMonth(s)};
$("brokerReset").onclick=()=>{const saved=state.investmentBrokerSnapshots.find(s=>s.id===$("brokerEditId").value);setBrokerDraft(saved||brokerBlank("actual"))};
$("brokerSaveDraft").onclick=()=>saveBroker("draft");$("brokerConfirm").onclick=()=>saveBroker("confirmed");
$("brokerHistoryMode").onchange=()=>{renderBrokerHistory();drawBrokerChart()};
$("brokerPeriod").onchange=()=>{if($("brokerPeriod").value)$("brokerDate").value=lastDayOfMonth($("brokerPeriod").value)};
$("flowType").onchange=updateFlowForm;document.querySelectorAll("[data-flow-kind]").forEach(b=>b.onclick=()=>{$("flowType").value=b.dataset.flowKind;updateFlowForm()});
$("flowReset").onclick=resetFlow;$("flowMonthFilter").onchange=()=>{state.ui.flowMonthFilter=$("flowMonthFilter").value||monthKeyNow();save();renderCashFlows()};
$("flowSave").onclick=()=>{const id=$("flowEditId").value,type=$("flowType").value,accountId=$("flowAccount").value,toAccountId=$("flowToAccount").value,amount=n($("flowAmount").value),date=$("flowDate").value;if(!date||!accountId||amount<=0)return alert("날짜, 계좌와 금액을 입력하세요.");if(type==="transfer"&&(!toAccountId||toAccountId===accountId))return alert("서로 다른 보내는 계좌와 받는 계좌를 선택하세요.");const old=state.investmentCashFlows.find(x=>x.id===id),x=normalizeCashFlow({id:id||uid(),date,type,accountId,toAccountId:type==="transfer"?toAccountId:"",amount,note:$("flowNote").value.trim(),createdAt:old?.createdAt,updatedAt:new Date().toISOString()});const idx=state.investmentCashFlows.findIndex(r=>r.id===x.id);if(idx>=0)state.investmentCashFlows[idx]=x;else state.investmentCashFlows.push(x);state.ui.flowMonthFilter=date.slice(0,7);resetFlow();commit("자금 이동을 기록했습니다.")};
$("watchReset").onclick=resetWatchlist;$("watchFilter").onchange=()=>{state.ui.watchlistFilter=$("watchFilter").value;save();renderWatchlist()};$("watchSearch").oninput=()=>{state.ui.watchlistSearch=$("watchSearch").value;renderWatchlist()};
$("watchSave").onclick=()=>{const id=$("watchEditId").value,name=$("watchName").value.trim(),ticker=$("watchTicker").value.trim(),market=inferMarket(ticker,$("watchMarket").value),registeredDate=$("watchDate").value,reason=$("watchReason").value.trim();if(!name||!registeredDate)return alert("종목명과 관심 등록일을 입력하세요.");const master=ensureMasterInstrument({name,ticker,market});const candidate=normalizeWatchlistItem({id:id||uid(),instrumentId:master?.id||"",name:master?.name||name,market:master?.market||market,ticker:master?.ticker||ticker,registeredDate,status:$("watchStatus").value,reason,targetPrice:nullableNum($("watchTargetPrice").value),note:$("watchNote").value.trim(),newsTracking:$("watchNewsTracking")?.checked!==false});const duplicate=state.investmentWatchlist.find(x=>x.id!==candidate.id&&watchKey(x)===watchKey(candidate));if(duplicate)return alert(`이미 관심종목에 등록되어 있습니다: ${duplicate.name}`);const old=state.investmentWatchlist.find(x=>x.id===candidate.id);candidate.createdAt=old?.createdAt||candidate.createdAt;candidate.updatedAt=new Date().toISOString();const idx=state.investmentWatchlist.findIndex(x=>x.id===candidate.id);if(idx>=0)state.investmentWatchlist[idx]=candidate;else state.investmentWatchlist.push(candidate);resetWatchlist();commit("관심종목을 저장했습니다.")};
if($("investmentNewsRefresh"))$("investmentNewsRefresh").onclick=()=>investmentNewsRefresh(true);
if($("investmentNewsEntityFilter"))$("investmentNewsEntityFilter").onchange=()=>{state.ui.investmentNewsEntity=$("investmentNewsEntityFilter").value;save();renderInvestmentNews()};
if($("investmentNewsGradeFilter"))$("investmentNewsGradeFilter").onchange=()=>{state.ui.investmentNewsGrade=$("investmentNewsGradeFilter").value;save();renderInvestmentNews()};
if($("investmentNewsSentimentFilter"))$("investmentNewsSentimentFilter").onchange=()=>{state.ui.investmentNewsSentiment=$("investmentNewsSentimentFilter").value;save();renderInvestmentNews()};
$("journalReset").onclick=resetJournal;$("journalFilter").onchange=()=>{state.ui.journalFilter=$("journalFilter").value;save();renderInvestmentJournal()};$("journalSearch").oninput=()=>{state.ui.journalSearch=$("journalSearch").value;renderInvestmentJournal()};
$("journalSave").onclick=()=>{const id=$("journalEditId").value,date=$("journalDate").value,stock=$("journalStock").value.trim(),reason=$("journalReason").value.trim();if(!date||!stock||!reason)return alert("날짜, 종목명과 판단 이유를 입력하세요.");const old=state.investmentJournal.find(x=>x.id===id),x=normalizeInvestmentJournal({id:id||uid(),date,action:$("journalAction").value,accountId:$("journalAccount").value,stock,emotion:$("journalEmotion").value,reason,context:$("journalContext").value.trim(),plan:$("journalPlan").value.trim(),price:nullableNum($("journalPrice").value),qty:nullableNum($("journalQty").value),createdAt:old?.createdAt,updatedAt:new Date().toISOString()});const idx=state.investmentJournal.findIndex(r=>r.id===x.id);if(idx>=0)state.investmentJournal[idx]=x;else state.investmentJournal.push(x);resetJournal();commit("투자 일기를 저장했습니다.")};


$("monthlyNewBlank").onclick=()=>{if(monthlyDraft&&readMonthlyForm().accounts.some(a=>n(a.cash)||a.holdings.length)&&!confirm("현재 입력 내용을 비우고 새 연습용 스냅샷을 만들까요?"))return;setMonthlyDraft(monthlyBlankDraft($("monthlyMode")?.value||"practice"))};
$("monthlyFillSample").onclick=()=>{if(!confirm("현재 입력 내용을 연습용 샘플 데이터로 채울까요? 저장 전까지는 실제 기록에 반영되지 않습니다."))return;const period=monthKeyNow(),accounts=state.accounts.slice(0,3).map((a,idx)=>monthlyAccountBase({accountId:a.id,accountName:a.name,cash:[100000,50000,70000][idx]||0,brokerTotal:[1120000,560000,820000][idx]||0,externalDeposit:[300000,100000,100000][idx]||0,dividendInterest:[5000,0,2500][idx]||0,feesTaxes:[1200,500,800][idx]||0,holdings:[monthlyHoldingBase({name:["TIGER 미국S&P500","KODEX 미국나스닥100","미국 단기채권 ETF"][idx],ticker:["360750","379810","SAMPLE03"][idx],quantity:[50,20,30][idx],averagePrice:[19000,24000,24000][idx],currentPrice:[20400,25500,25000][idx]})]}));setMonthlyDraft(normalizeMonthlySnapshot({id:uid(),mode:"practice",period,snapshotDate:lastDayOfMonth(period),status:"draft",note:"입력 흐름 확인용 샘플",accounts}))};
$("monthlyCopyLatest").onclick=()=>{const mode=$("monthlyMode")?.value||"practice",latest=monthlySorted(mode).at(-1)||monthlySorted("all").at(-1);if(!latest)return alert("복사할 이전 스냅샷이 없습니다.");copyMonthlySnapshot(latest)};
$("monthlyResetForm").onclick=()=>{if(!confirm("현재 입력 중인 내용을 마지막 저장 상태로 되돌릴까요?"))return;const id=$("monthlyEditId").value,saved=state.investmentMonthlySnapshots.find(s=>s.id===id);setMonthlyDraft(saved||monthlyBlankDraft($("monthlyMode")?.value||"practice"))};
$("monthlySaveDraft").onclick=()=>saveMonthlySnapshot("draft");
$("monthlyConfirm").onclick=()=>saveMonthlySnapshot("confirmed");
$("monthlyHistoryMode").onchange=()=>{state.ui.monthlyHistoryMode=$("monthlyHistoryMode").value;save();renderMonthlyHistory();drawMonthlyAssetChart()};
$("monthlyClearPractice").onclick=()=>{const count=state.investmentMonthlySnapshots.filter(s=>s.mode==="practice").length;if(!count)return alert("삭제할 연습 기록이 없습니다.");if(!confirm(`연습용 스냅샷 ${count}건을 모두 삭제할까요?\n실제 자금 기록은 유지되며, 삭제 전 백업을 생성합니다.`))return;exportData({suffix:"before_clear_practice_snapshots",silent:true});state.investmentMonthlySnapshots=state.investmentMonthlySnapshots.filter(s=>s.mode!=="practice");monthlyDraft=monthlyBlankDraft("practice");commit("연습용 스냅샷을 모두 삭제했습니다.")};
$("monthlyMode").onchange=()=>{if(monthlyDraft)monthlyDraft.mode=$("monthlyMode").value};
$("monthlyPeriod").onchange=()=>{if($("monthlyPeriod").value)$("monthlyDate").value=lastDayOfMonth($("monthlyPeriod").value)};


$("ledgerMonth").onchange=()=>{ledgerEditMonth="";state.ui.ledgerMonth=$("ledgerMonth").value||monthKeyNow();save();resetLedgerItemForm();renderLedger()};
$("ledgerThisMonth").onclick=()=>{ledgerEditMonth="";state.ui.ledgerMonth=monthKeyNow();save();resetLedgerItemForm();renderLedger();setTimeout(drawLedgerTrend,30)};
if($("ledgerJieunEdit"))$("ledgerJieunEdit").onclick=()=>{const rec=ledgerFind();if(!rec)return alert("선택한 결산월에 저장된 원장이 없습니다.");$("ledgerJieunEditor").hidden=!$("ledgerJieunEditor").hidden;if(!$("ledgerJieunEditor").hidden)$("ledgerJieunInput").focus()};
if($("ledgerJieunInput"))$("ledgerJieunInput").oninput=()=>{$("ledgerJieunCount").textContent=`${$("ledgerJieunInput").value.length} / 80`};
if($("ledgerJieunSave"))$("ledgerJieunSave").onclick=()=>{const rec=ledgerFind();if(!rec)return alert("선택한 결산월에 저장된 원장이 없습니다.");rec.jieunComment=$("ledgerJieunInput").value.trim().slice(0,80);rec.updatedAt=new Date().toISOString();commit("지은's Comment를 저장했습니다.")};
$("ledgerDetailSort").onchange=()=>{ledgerDetailView.sort=$("ledgerDetailSort").value;renderLedger()};
$("ledgerDetailCategory").onchange=()=>{ledgerDetailView.category=$("ledgerDetailCategory").value;ledgerDetailView.subcategory="all";renderLedger()};
$("ledgerDetailSubcategory").onchange=()=>{ledgerDetailView.subcategory=$("ledgerDetailSubcategory").value;renderLedger()};
$("ledgerDetailReset").onclick=()=>{ledgerDetailView.sort="amountDesc";ledgerDetailView.category="all";ledgerDetailView.subcategory="all";renderLedger()};
$("ledgerExitEdit").onclick=()=>{ledgerEditMonth="";resetLedgerItemForm();renderLedger()};
$("ledgerEditTargets").onclick=()=>{const rec=ledgerFind();if(!rec)return alert("목표를 수정할 결산 원장이 없습니다.");const calc=ledgerCalc(rec);$("ledgerTargetMonthLabel").textContent=`${ledgerMonthLabel(rec.month)} 목표만 변경합니다.`;$("ledgerTargetT").value=calc.targetT;$("ledgerTargetC").value=calc.targetC;openModal("ledgerTargetModal")};
$("ledgerTargetSave").onclick=()=>{const rec=ledgerFind(),targetT=n($("ledgerTargetT").value),targetC=n($("ledgerTargetC").value);if(!rec)return alert("선택한 결산 원장을 찾지 못했습니다.");if(targetT<=0||targetC<=0)return alert("두 목표를 모두 0원보다 크게 입력해 주세요.");if(!confirm(`${ledgerMonthLabel(rec.month)}의 JISPI 목표를 저장할까요?`))return;rec.targetT=targetT;rec.targetC=targetC;rec.updatedAt=new Date().toISOString();closeModal("ledgerTargetModal");commit("월 소비 목표를 수정했습니다.")};
if($("ledgerItemReset"))$("ledgerItemReset").onclick=resetLedgerItemForm;
if($("ledgerItemSave"))$("ledgerItemSave").onclick=()=>{
  const month=ledgerCurrentMonthKey(),content=$("ledgerItemContent").value.trim(),detail=$("ledgerItemDetail").value.trim(),amount=n($("ledgerItemAmount").value);
  if(!(content||detail)||amount<=0)return alert("내용 또는 세부항목과 금액을 입력해 주세요.");
  const rec=ledgerEnsure(month),id=$("ledgerItemEditId").value,old=rec.items.find(x=>x.id===id);
  const item=normalizeLedgerItem({id:id||uid(),date:$("ledgerItemDate").value,content,payment:$("ledgerItemPayment").value,category:$("ledgerItemCategory").value,subcategory:$("ledgerItemSubcategory").value,detail,amount,reimbursement:$("ledgerItemReimbursement").value,note:$("ledgerItemNote").value.trim()});
  if(!old||ledgerEditMonth!==month)return alert("수정할 소비 항목을 찾지 못했습니다.");
  rec.items[rec.items.findIndex(x=>x.id===id)]=item;
  rec.updatedAt=new Date().toISOString();state.ui.ledgerMonth=month;closeModal("ledgerItemModal");resetLedgerItemForm();commit("소비 항목을 수정했습니다.");
};
$("ledgerImportRaw").oninput=()=>{ledgerImportPreview=null;$("ledgerImportApply").disabled=true;$("ledgerImportResult").textContent="내용이 바뀌었습니다. 다시 미리보기 해 주세요."};
$("ledgerImportPreview").onclick=()=>{
  const parsed=parseLedgerTsv($("ledgerImportRaw").value),existing=parsed.month?ledgerFind(parsed.month):null;
  ledgerImportPreview=parsed.valid?parsed:null;$("ledgerImportApply").disabled=!parsed.valid;
  const targets=ledgerLatestTargets(),calc=ledgerCalc(parsed.valid?{items:parsed.items,...targets}:null),excluded=`제외 ${parsed.excludedCount}건 · ${won(parsed.excludedAmount)}`;
  $("ledgerImportResult").textContent=parsed.valid?`${ledgerMonthLabel(parsed.month)} · 수락 ${parsed.items.length}건 · ${excluded}\n적용 목표 · JISPI-T ${won(targets.targetT)} · JISPI-C ${won(targets.targetC)}\n총지출 ${won(calc.total)} · 고정 ${won(calc.fixed)} · 유동 ${won(calc.variable)} · 특별 ${won(calc.special)} · 금융·자산 ${won(calc.finance)}\nJISPI-T ${won(calc.jispiT)} · JISPI-C ${won(calc.jispiC)}${existing?.items?.length?"\n주의: 해당 결산 월에 기존 항목이 있어 확정 반영할 수 없습니다.":""}`:`미리보기 차단 · ${parsed.errors.join(" / ")} · ${excluded}`;
};
$("ledgerImportApply").onclick=()=>{
  const parsed=ledgerImportPreview;if(!parsed?.valid)return alert("유효한 미리보기를 먼저 실행해 주세요.");
  if(ledgerFind(parsed.month)?.items?.length)return alert("해당 결산 월에 기존 항목이 있어 반영할 수 없습니다.");
  if(!confirm(`${ledgerMonthLabel(parsed.month)}에 ${parsed.items.length}건을 확정 반영할까요?`))return;
  const period=ledgerSettlementPeriod(parsed.month),targets=ledgerLatestTargets(),now=new Date().toISOString(),rec=normalizeLedgerMonth({month:parsed.month,...period,...targets,importVersion:"LEDGER_FINAL_V1",importedAt:now,items:parsed.items,createdAt:now,updatedAt:now});
  state.ledgerMonths=state.ledgerMonths.filter(x=>x.month!==parsed.month);state.ledgerMonths.push(rec);state.ui.ledgerMonth=parsed.month;ledgerImportPreview=null;commit("확정본 가계부를 반영했습니다.");$("ledgerImportRaw").value="";$("ledgerImportApply").disabled=true;$("ledgerImportResult").textContent=`${ledgerMonthLabel(parsed.month)} 확정 반영 완료 · ${parsed.items.length}건`;
};
if($("ledgerSaveComment"))$("ledgerSaveComment").onclick=()=>{
  const rec=ledgerEnsure(),comment=$("ledgerMonthComment").value.trim();
  rec.comment=comment;rec.updatedAt=new Date().toISOString();commit("이달의 소비 한줄평을 저장했습니다.");
};
$("openSpendPurchase").onclick=()=>openSpendPurchaseModal();
$("spendPurchaseReset").onclick=resetSpendPurchaseForm;
$("spendPurchaseSave").onclick=()=>{
  const id=$("spendPurchaseEditId").value,date=$("spendPurchaseDate").value,name=$("spendPurchaseName").value.trim(),amount=n($("spendPurchaseAmount").value);
  if(!date||!name||amount<=0)return alert("구매일, 품목과 금액을 입력해 주세요.");
  const old=state.spendReviews.find(x=>x.id===id),p=normalizeSpendPurchase({
    id:id||uid(),date,name,amount,category:$("spendPurchaseCategory").value.trim(),reason:$("spendPurchaseReason").value.trim(),
    reviews:old?.reviews||[],createdAt:old?.createdAt,updatedAt:new Date().toISOString()
  });
  const idx=state.spendReviews.findIndex(x=>x.id===p.id);if(idx>=0)state.spendReviews[idx]=p;else state.spendReviews.push(p);
  closeModal("spendPurchaseModal");resetSpendPurchaseForm();commit(old?"소비 기록을 수정했습니다.":"리뷰할 소비를 등록했습니다.");
};
$("spendReviewSearch").oninput=()=>{state.ui.spendReviewSearch=$("spendReviewSearch").value;renderSpendReviews()};
$("spendReviewMonth").onchange=()=>{state.ui.spendReviewMonth=$("spendReviewMonth").value;save();renderSpendReviews()};
$("spendReviewFilter").onchange=()=>{state.ui.spendReviewFilter=$("spendReviewFilter").value;save();renderSpendReviews()};
$("spendReviewSave").onclick=()=>{
  const pid=$("spendReviewPurchaseId").value,rid=$("spendReviewEditId").value,p=state.spendReviews.find(x=>x.id===pid);
  if(!p)return alert("리뷰할 소비 기록을 찾지 못했습니다.");
  const note=$("spendReviewNote").value.trim(),date=$("spendReviewDate").value;if(!date)return alert("리뷰 날짜를 입력해 주세요.");
  const old=(p.reviews||[]).find(x=>x.id===rid),r=normalizeSpendFollowup({
    id:rid||uid(),date,score:$("spendReviewScore").value,verdict:$("spendReviewVerdict").value,frequency:$("spendReviewFrequency").value,
    repurchase:$("spendReviewRepurchase").value,note,createdAt:old?.createdAt,updatedAt:new Date().toISOString()
  });
  const idx=(p.reviews||[]).findIndex(x=>x.id===r.id);if(idx>=0)p.reviews[idx]=r;else p.reviews.push(r);p.updatedAt=new Date().toISOString();
  closeModal("spendReviewModal");commit(old?"소비 후속 리뷰를 수정했습니다.":"소비 후속 리뷰를 추가했습니다.");
};



// v2.9.0 Campus event bindings
$("campusAddSemester").onclick=()=>openCampusSemesterModal();$("campusEmptyAdd").onclick=()=>openCampusSemesterModal();
$("campusSemesterSelect").onchange=()=>{state.ui.campusActiveSemesterId=$("campusSemesterSelect").value;save();renderCampus()};
$("campusSemesterSave").onclick=()=>{const id=$("campusSemesterEditId").value,term=$("campusSemesterTerm").value.trim();if(!term)return alert("학기명을 입력해 주세요.");const old=state.campusSemesters.find(x=>x.id===id),s=normalizeCampusSemester({id:id||uid(),term,status:$("campusSemesterState").value,startDate:$("campusSemesterStart").value,endDate:$("campusSemesterEnd").value,courses:old?.courses||[],events:old?.events||[],createdAt:old?.createdAt,updatedAt:new Date().toISOString()});const idx=state.campusSemesters.findIndex(x=>x.id===s.id);if(idx>=0)state.campusSemesters[idx]=s;else state.campusSemesters.push(s);state.ui.campusActiveSemesterId=s.id;closeModal("campusSemesterModal");commit(old?"학기 정보를 수정했습니다.":"새 학기를 등록했습니다.")};
$("campusArchiveSemester").onclick=()=>{const s=campusActiveSemester();if(!s)return;const next=s.status==="archived"?"active":"archived";if(next==="archived"&&!confirm(`${s.term}을 아카이브할까요?\n과목과 일정은 그대로 보존됩니다.`))return;s.status=next;s.updatedAt=new Date().toISOString();commit(next==="archived"?"학기를 아카이브했습니다.":"학기를 다시 열었습니다.")};
$("campusAddCourse").onclick=()=>openCampusCourseModal();
$("campusCourseSave").onclick=()=>{const s=campusActiveSemester(),id=$("campusCourseEditId").value,name=$("campusCourseName").value.trim();if(!s||!name)return alert("학기와 과목명을 확인해 주세요.");const old=s.courses.find(x=>x.id===id),c=normalizeCampusCourse({id:id||uid(),name,type:$("campusCourseType").value,credits:$("campusCourseCredits").value,professor:$("campusCourseProfessor").value,method:$("campusCourseMethod").value,description:$("campusCourseDescription").value,materials:$("campusCourseMaterials").value,goal:$("campusCourseGoal").value,grade:old?.grade||"",gradePoint:old?.gradePoint??null,earnedCredits:old?.earnedCredits??null,curriculum:old?.curriculum||[],createdAt:old?.createdAt,updatedAt:new Date().toISOString()});const idx=s.courses.findIndex(x=>x.id===c.id);if(idx>=0)s.courses[idx]=c;else s.courses.push(c);s.updatedAt=new Date().toISOString();closeModal("campusCourseModal");commit(old?"과목 정보를 수정했습니다.":"과목을 등록했습니다.")};
$("campusAddEvent").onclick=()=>openCampusEventModal();
$("campusEventSave").onclick=()=>{const s=campusActiveSemester(),id=$("campusEventEditId").value,title=$("campusEventTitle").value.trim(),date=$("campusEventDate").value;if(!s||!title||!date)return alert("일정명과 날짜를 입력해 주세요.");const old=s.events.find(x=>x.id===id),e=normalizeCampusEvent({id:id||uid(),title,type:$("campusEventType").value,date,scope:"school",courseId:"",note:$("campusEventNote").value,done:$("campusEventDone").value==="1",createdAt:old?.createdAt,updatedAt:new Date().toISOString()});const idx=s.events.findIndex(x=>x.id===e.id);if(idx>=0)s.events[idx]=e;else s.events.push(e);s.updatedAt=new Date().toISOString();closeModal("campusEventModal");commit(old?"학사 일정을 수정했습니다.":"학사 일정을 등록했습니다.")};
$("campusCurriculumImport").onclick=()=>{const s=campusActiveSemester(),c=s?.courses?.find(x=>x.id===$("campusDetailCourseId").value),rows=parseBulkRows($("campusCurriculumBulk").value,4);if(!c)return;if(!rows.length)return alert("붙여넣은 강의계획을 확인해 주세요.");let count=0;rows.forEach(r=>{const week=String(parseInt(r[0],10)||r[0]).trim();if(!week)return;const data={week,topic:r[1],content:String(r[2]||"").split("/").map(x=>x.trim()).filter(Boolean).join("\n"),evaluation:r[3]};let old=(c.curriculum||[]).find(x=>String(parseInt(x.week,10)||x.week)===week);if(old)Object.assign(old,data);else c.curriculum.push(normalizeCampusCurriculum(data));count++});c.updatedAt=new Date().toISOString();s.updatedAt=c.updatedAt;$("campusCurriculumBulk").value="";commit(`주차 계획 ${count}개를 반영했습니다.`,false);openCampusCourseDetail(c.id)};
$("campusDetailEditCourse").onclick=()=>{const s=campusActiveSemester(),c=s?.courses?.find(x=>x.id===$("campusDetailCourseId").value);if(c){closeModal("campusCourseDetailModal");openCampusCourseModal(c)}};
$("campusDetailDeleteCourse").onclick=()=>{const s=campusActiveSemester(),id=$("campusDetailCourseId").value,c=s?.courses?.find(x=>x.id===id);if(!c||!confirm(`'${c.name}' 과목을 삭제할까요?\n연결된 과목 일정도 함께 삭제됩니다. 삭제 전 자동 백업을 생성합니다.`))return;exportData({suffix:"before_delete_campus_course",silent:true});s.courses=s.courses.filter(x=>x.id!==id);s.events=s.events.filter(x=>x.courseId!==id);s.updatedAt=new Date().toISOString();closeModal("campusCourseDetailModal");commit("과목과 연결 일정을 삭제했습니다.")};
$("campusQuickNoteSave").onclick=()=>{state.pageNotes.university=$("campusQuickNote").value;commit("학기 메모를 저장했습니다.")};

// v2.9.0 Travel event bindings
document.querySelectorAll("[data-travel-tab]").forEach(b=>b.onclick=()=>{state.ui.travelTab=b.dataset.travelTab;save();renderTravel()});
$("travelAddTrip").onclick=()=>openTravelTripModal();$("travelAddWish").onclick=()=>openTravelWishModal();

if($("wishlistAdd"))$("wishlistAdd").onclick=()=>openWishlistModal();
if($("wishlistFilter"))$("wishlistFilter").onchange=()=>{state.ui.wishlistFilter=$("wishlistFilter").value;save();renderWishlist()};
if($("wishlistKindFilter"))$("wishlistKindFilter").onchange=()=>{state.ui.wishlistKindFilter=$("wishlistKindFilter").value;save();renderWishlist()};
if($("wishlistSearch"))$("wishlistSearch").oninput=()=>{state.ui.wishlistSearch=$("wishlistSearch").value;renderWishlist()};
if($("wishlistSave"))$("wishlistSave").onclick=()=>{const name=$("wishlistName").value.trim();if(!name)return alert("Wish 이름을 입력해 주세요.");const id=$("wishlistEditId").value,old=(state.wishlistItems||[]).find(x=>x.id===id),row=normalizeWishItem({id:id||uid(),kind:$("wishlistKind").value,name,category:$("wishlistCategory").value,price:$("wishlistPrice").value,priority:$("wishlistPriority").value,status:$("wishlistStatus").value,reason:$("wishlistReason").value,note:$("wishlistNote").value,purchasedDate:$("wishlistPurchasedDate").value,sourceType:$("wishlistSourceType").value||old?.sourceType||"manual",sourceLabel:old?.sourceLabel||"",createdAt:old?.createdAt,updatedAt:new Date().toISOString()});if(old)Object.assign(old,row);else state.wishlistItems.push(row);closeModal("wishlistModal");commit(old?"Wish-list 항목을 수정했습니다.":"Wish-list에 새 후보를 저장했습니다.");resetWishlistForm()};
$("certificateReset").onclick=resetCertificateForm;
$("certificateSave").onclick=()=>{const name=$("certificateName").value.trim();if(!name)return alert("자격증명을 입력해 주세요.");const id=$("certificateEditId").value,old=(state.certificates||[]).find(x=>x.id===id),row=normalizeCertificate({id:id||uid(),name,issuer:$("certificateIssuer").value,grade:$("certificateGrade").value,examDate:$("certificateExamDate").value,status:$("certificateStatus").value,resultDate:$("certificateResultDate").value,score:$("certificateScore").value,result:$("certificateResult").value,createdAt:old?.createdAt,updatedAt:new Date().toISOString()});if(old)Object.assign(old,row);else state.certificates.push(row);commit(old?"자격증 정보를 수정했습니다.":"자격증을 등록했습니다.");resetCertificateForm()};

$("travelTripSave").onclick=()=>{const id=$("travelTripEditId").value,name=$("travelTripName").value.trim(),destination=$("travelTripDestination").value.trim(),startDate=$("travelTripStart").value;if(!name||!destination||!startDate)return alert("여행명, 목적지와 시작일을 입력해 주세요.");const old=state.travelTrips.find(x=>x.id===id),t=normalizeTravelTrip({id:id||uid(),name,startDate,endDate:$("travelTripEnd").value||startDate,destination,companions:$("travelTripCompanions").value,summary:$("travelTripSummary").value,transport:$("travelTripTransport").value,lodging:$("travelTripLodging").value,plannedPlaces:$("travelTripPlaces").value,foodPlan:$("travelTripFoodPlan").value,sourceWishId:old?.sourceWishId||"",itinerary:old?.itinerary||[],reviews:old?.reviews||[],createdAt:old?.createdAt,updatedAt:new Date().toISOString()});const idx=state.travelTrips.findIndex(x=>x.id===t.id);if(idx>=0)state.travelTrips[idx]=t;else state.travelTrips.push(t);closeModal("travelTripModal");state.ui.travelTab="trips";commit(old?"여행 정보를 수정했습니다.":"완료 여행을 등록했습니다.")};
$("travelWishSave").onclick=()=>{const id=$("travelWishEditId").value,destination=$("travelWishDestination").value.trim();if(!destination)return alert("목적지를 입력해 주세요.");const old=state.travelWishlist.find(x=>x.id===id),w=normalizeTravelWish({id:id||uid(),destination,reason:$("travelWishReason").value,expectedDate:$("travelWishExpected").value,transport:$("travelWishTransport").value,places:$("travelWishPlaces").value,foods:$("travelWishFoods").value,restaurants:$("travelWishRestaurants").value,lodging:$("travelWishLodging").value,note:$("travelWishNote").value,itinerary:old?.itinerary||[],createdAt:old?.createdAt,updatedAt:new Date().toISOString()});const idx=state.travelWishlist.findIndex(x=>x.id===w.id);if(idx>=0)state.travelWishlist[idx]=w;else state.travelWishlist.push(w);closeModal("travelWishModal");state.ui.travelTab="wish";commit(old?"Wish 여행을 수정했습니다.":"Wish 여행을 등록했습니다.")};
$("travelItineraryParse").onclick=()=>{travelImportPreviewRows=parseTravelSheetPaste($("travelItineraryBulk").value);renderTravelImportPreview();if(!travelImportPreviewRows.length)alert("일정표를 인식하지 못했습니다. 시간 / 구분 / 장소 / 비고 / 예상 비용 헤더가 포함된 범위를 복사해 주세요.")};
$("travelItineraryImport").onclick=()=>{const t=state.travelTrips.find(x=>x.id===$("travelDetailTripId").value);if(!t)return;const added=readTravelImportPreview();if(!added.length)return alert("저장할 미리보기 일정이 없습니다.");t.itinerary.push(...added);t.updatedAt=new Date().toISOString();$("travelItineraryBulk").value="";travelImportPreviewRows=[];commit(`여행 일정 ${added.length}개를 추가했습니다.`,false);openTravelTripDetail(t.id)};
$("travelReviewAdd").onclick=()=>{const t=state.travelTrips.find(x=>x.id===$("travelDetailTripId").value),name=$("travelReviewName").value.trim();if(!t||!name)return alert("아카이브에 남길 이름을 입력해 주세요.");t.reviews.push(normalizeTravelReview({type:$("travelReviewType").value,name,visitDate:$("travelReviewDate").value,location:$("travelReviewLocation").value,cost:$("travelReviewCost").value,rating:$("travelReviewRating").value,returnVisit:$("travelReviewReturn").value,review:$("travelReviewText").value}));t.updatedAt=new Date().toISOString();commit("여행 아카이브 기록을 추가했습니다.",false);openTravelTripDetail(t.id)};
$("travelDetailEditTrip").onclick=()=>{const t=state.travelTrips.find(x=>x.id===$("travelDetailTripId").value);if(t){closeModal("travelTripDetailModal");openTravelTripModal(t)}};
$("travelDetailDeleteTrip").onclick=()=>{const id=$("travelDetailTripId").value,t=state.travelTrips.find(x=>x.id===id);if(!t||!confirm(`'${t.name}' 여행 기록을 삭제할까요?\n일정과 리뷰도 함께 삭제됩니다. 삭제 전 자동 백업을 생성합니다.`))return;exportData({suffix:"before_delete_travel_trip",silent:true});state.travelTrips=state.travelTrips.filter(x=>x.id!==id);closeModal("travelTripDetailModal");commit("여행 기록을 삭제했습니다.")};
$("travelQuickNoteSave").onclick=()=>{state.pageNotes.travel=$("travelQuickNote").value;commit("여행 메모를 저장했습니다.")};



// ===== v2.9.21 Flexible Date Input =====
// Keeps every stored value in the original ISO format, so existing sorting,
// D-day calculations, Cloud sync and data structures remain unchanged.
function pad2DateFlex(v){return String(v).padStart(2,"0")}
function validDateFlex(y,m,d){
  const dt=new Date(Number(y),Number(m)-1,Number(d));
  return dt.getFullYear()===Number(y)&&dt.getMonth()===Number(m)-1&&dt.getDate()===Number(d);
}
function normalizeDateFlexDate(raw){
  let v=String(raw||"").trim(); if(!v)return "";
  const cy=new Date().getFullYear();
  v=v.replace(/년/g,"-").replace(/월/g,"-").replace(/일/g,"").replace(/[.\/]/g,"-").replace(/\s+/g,"").replace(/-+/g,"-").replace(/^-|-$/g,"");
  let y,m,d;
  if(/^\d{8}$/.test(v)){y=v.slice(0,4);m=v.slice(4,6);d=v.slice(6,8)}
  else if(/^\d{4}$/.test(v)){y=cy;m=v.slice(0,2);d=v.slice(2,4)}
  else{
    const p=v.split("-").filter(Boolean);
    if(p.length===3){[y,m,d]=p}
    else if(p.length===2){y=cy;[m,d]=p}
    else return null;
  }
  if(String(y).length===2)y=2000+Number(y);
  y=Number(y);m=Number(m);d=Number(d);
  if(!validDateFlex(y,m,d))return null;
  return `${String(y).padStart(4,"0")}-${pad2DateFlex(m)}-${pad2DateFlex(d)}`;
}
function normalizeDateFlexMonth(raw){
  let v=String(raw||"").trim();if(!v)return "";
  const cy=new Date().getFullYear();
  v=v.replace(/년/g,"-").replace(/월/g,"").replace(/[.\/]/g,"-").replace(/\s+/g,"").replace(/-+/g,"-").replace(/^-|-$/g,"");
  let y,m;
  if(/^\d{6}$/.test(v)){y=v.slice(0,4);m=v.slice(4,6)}
  else if(/^\d{1,2}$/.test(v)){y=cy;m=v}
  else{const p=v.split("-").filter(Boolean);if(p.length!==2)return null;[y,m]=p}
  if(String(y).length===2)y=2000+Number(y);
  y=Number(y);m=Number(m);if(!Number.isInteger(y)||m<1||m>12)return null;
  return `${String(y).padStart(4,"0")}-${pad2DateFlex(m)}`;
}
function normalizeDateFlexDateTime(raw){
  let v=String(raw||"").trim();if(!v)return "";
  v=v.replace(/시/g,":").replace(/분/g,"").replace(/T/g," ").replace(/\s+/g," ").trim();
  // Korean date words remain parsable by date normalizer after split.
  let datePart="",timePart="";
  const tm=v.match(/(\d{1,2})(?::|\s)(\d{2})\s*$/);
  if(tm){timePart=`${tm[1]}:${tm[2]}`;datePart=v.slice(0,tm.index).trim()}
  else{
    const compact=v.match(/^(.*?)[ ](\d{4})$/);
    if(compact&&/^\d{4}$/.test(compact[2])){timePart=`${compact[2].slice(0,2)}:${compact[2].slice(2)}`;datePart=compact[1].trim()}
    else if(v.includes(" ")){const ix=v.lastIndexOf(" ");datePart=v.slice(0,ix).trim();timePart=v.slice(ix+1).trim()}
    else{datePart=v;timePart="00:00"}
  }
  const date=normalizeDateFlexDate(datePart);if(date===null)return null;
  const mt=String(timePart||"00:00").match(/^(\d{1,2})(?::?(\d{2}))$/);if(!mt)return null;
  const h=Number(mt[1]),mi=Number(mt[2]);if(h<0||h>23||mi<0||mi>59)return null;
  return `${date}T${pad2DateFlex(h)}:${pad2DateFlex(mi)}`;
}
function normalizeDateFlexValue(raw,kind){
  if(kind==="month")return normalizeDateFlexMonth(raw);
  if(kind==="datetime-local")return normalizeDateFlexDateTime(raw);
  return normalizeDateFlexDate(raw);
}
function dateFlexPlaceholder(kind){
  if(kind==="month")return "예: 2026-08 / 8월";
  if(kind==="datetime-local")return "예: 8/26 14:00";
  return "예: 2026-08-26 / 8/26 / 0826";
}
function dateFlexValidateInput(input,normalize=false){
  if(!input||input.type!=="text"||!input.classList.contains("date-flex-input"))return true;
  const raw=input.value.trim();if(!raw){input.classList.remove("date-text-invalid");return true}
  const parsed=normalizeDateFlexValue(raw,input.dataset.dateKind||"date");
  const ok=parsed!==null;
  input.classList.toggle("date-text-invalid",!ok);
  if(ok&&normalize)input.value=parsed;
  return ok;
}
function setupDateFlexInput(input){
  if(!input||input.dataset.dateFlexReady==="1")return;
  const kind=input.getAttribute("type");
  if(!["date","month","datetime-local"].includes(kind))return;
  input.dataset.dateFlexReady="1";input.dataset.dateKind=kind;input.classList.add("date-flex-input");
  const wrap=document.createElement("div");wrap.className="date-flex-control";
  input.parentNode.insertBefore(wrap,input);wrap.appendChild(input);
  const btn=document.createElement("button");btn.type="button";btn.className="date-mode-toggle";btn.textContent="⌨";btn.title="직접입력으로 전환";btn.setAttribute("aria-label","날짜 직접입력 전환");wrap.appendChild(btn);
  btn.onclick=()=>{
    if(input.type!=="text"){
      input.type="text";input.placeholder=dateFlexPlaceholder(kind);btn.classList.add("active");btn.title="달력 입력으로 돌아가기";input.focus();input.select?.();
    }else{
      if(!dateFlexValidateInput(input,true)){alert("날짜 형식을 확인해 주세요. 예: 2026-08-26 또는 8/26");input.focus();return}
      input.type=kind;input.placeholder="";input.classList.remove("date-text-invalid");btn.classList.remove("active");btn.title="직접입력으로 전환";
    }
  };
  input.addEventListener("blur",()=>dateFlexValidateInput(input,true));
  input.addEventListener("input",()=>{if(input.type==="text")input.classList.remove("date-text-invalid")});
  input.addEventListener("keydown",e=>{if(input.type==="text"&&e.key==="Enter"){if(dateFlexValidateInput(input,true))input.blur();}});
}
function setupAllDateFlexInputs(root=document){
  const nodes=[];
  if(root?.matches?.('input[type="date"],input[type="month"],input[type="datetime-local"]'))nodes.push(root);
  root?.querySelectorAll?.('input[type="date"],input[type="month"],input[type="datetime-local"]').forEach(x=>nodes.push(x));
  nodes.forEach(setupDateFlexInput);
}
function initFlexibleDateInputs(){
  setupAllDateFlexInputs(document);
  const obs=new MutationObserver(muts=>muts.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1)setupAllDateFlexInputs(n)})));
  obs.observe(document.body,{childList:true,subtree:true});
  // Fail closed: do not let an invalid free-text date be saved from the same card/modal.
  document.addEventListener("click",e=>{
    const b=e.target.closest?.("button");if(!b||b.classList.contains("date-mode-toggle"))return;
    const scope=b.closest(".modal-card,.card,section")||document;
    const invalid=[...scope.querySelectorAll('.date-flex-input[type="text"]')].find(x=>!dateFlexValidateInput(x,true));
    if(invalid){e.preventDefault();e.stopImmediatePropagation();alert("직접 입력한 날짜 형식을 확인해 주세요.\n예: 2026-08-26, 8/26, 0826 / 시간 포함: 8/26 14:00");invalid.focus();}
  },true);
}
initFlexibleDateInputs();

["txDate","bodyDate","exerciseDate","taskDue","diaryDate","flowDate","journalDate","watchDate","spendPurchaseDate","spendReviewDate"].forEach(id=>{if($(id))$(id).value=today()});
updateTxForm();resetDiaryForm();resetFlow();resetWatchlist();resetJournal();updateMovieFormState();intakeInit();renderAll();
initLoginGate();
setupQuickJump();
deployCenterInit();
if(CLOUD_AUTH_BOOT.hasAuthCallback){
  // Recovery callback must be consumed before any page navigation can erase the auth hash.
  showLoginRecoveryGate("복구 링크를 인증하고 있습니다.");
  initCloudBridge().finally(()=>{
    if(cloudRecoveryMode){
      showLoginRecoveryGate(cloudUser?"복구 인증 완료. 새 비밀번호를 입력해 주세요.":"복구 세션을 확인하지 못했습니다. 최신 복구 링크인지 확인해 주세요.");
    }else{
      lockLoginGate("복구 링크 처리가 끝났습니다. 계정으로 로그인해 주세요.");
    }
  });
}else{
  showView(location.hash.slice(1)||"home");
  initCloudBridge().finally(()=>loginGateStatus("이메일과 비밀번호로 로그인해 주세요."));
}
window.addEventListener("resize",()=>{drawPortfolio();drawBody();drawLedgerTrend();drawMonthlyAssetChart();drawBrokerChart();drawAnnualInvestmentCharts();drawInvestmentAccountChart();if(activeAccountId)drawAccountChart(activeAccountId)});
