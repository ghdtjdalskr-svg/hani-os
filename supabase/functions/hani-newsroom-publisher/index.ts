// PROJECT HANI
// hani-newsroom-publisher v0.1.0 · Cloud Archive + Scheduled Newsroom
// - Persists Newsroom posts only to hani_newsroom_posts / hani_newsroom_reads.
// - Reads hani_state with service role ONLY for scheduled watchlist discovery.
// - NEVER updates/deletes hani_state and never touches hani_os_life_v23.
// - archive_result requires an authenticated HANI OS user session.
// - scheduled_publish requires HANI_NEWSROOM_CRON_SECRET.

import { createClient } from "npm:@supabase/supabase-js@2";
import { compactPersonaPolicy, commentVariationPlan } from "./comment-persona.mjs";
import { characterVoicePrompt } from "../_shared/character-voice.mjs";

const VERSION = "0.1.2";
const MODEL = "gpt-5.6-luna";
const MAX_TARGETS = 5;
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-hani-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" } });
}
function cleanText(value: unknown, max = 1000) { return String(value ?? "").trim().slice(0, max); }
function asObject(value: unknown): Record<string, any> { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, any> : {}; }
function arr(value: unknown): any[] { return Array.isArray(value) ? value : []; }

function errorDetail(value: any){
  if(!value)return {message:"Unknown error",code:"",details:"",hint:"",status:""};
  return {
    message: cleanText(value?.message || (value instanceof Error ? value.message : "") || String(value), 1600),
    code: cleanText(value?.code, 120),
    details: cleanText(value?.details, 1600),
    hint: cleanText(value?.hint, 1600),
    status: cleanText(value?.status || value?.statusCode, 120)
  };
}
function errorText(prefix:string,value:any){
  const d=errorDetail(value);
  return [
    prefix,
    d.code ? `code=${d.code}` : "",
    d.message ? `message=${d.message}` : "",
    d.details ? `details=${d.details}` : "",
    d.hint ? `hint=${d.hint}` : "",
    d.status ? `status=${d.status}` : ""
  ].filter(Boolean).join(" · ");
}
function defaultKey(envName: string, legacyName: string) {
  const raw=Deno.env.get(envName);
  if(raw){try{const keys=JSON.parse(raw);if(keys?.default)return String(keys.default)}catch{}}
  return Deno.env.get(legacyName)??"";
}
function normalizeMarket(value: unknown): "KR"|"US"|"OTHER" { const v=String(value??"").trim().toUpperCase(); return v==="KR"||v==="US"?v:"OTHER"; }
function inferMarket(ticker: string) { return /^\d{6}$/.test(ticker) ? "KR" : /^[A-Z][A-Z0-9.\-]{0,12}$/.test(ticker) ? "US" : "OTHER"; }
function issuerMeta(name: string, ticker: string) {
  const known: Record<string,{issuer_name:string;issuer_ticker:string}> = {
    "005935": { issuer_name:"삼성전자", issuer_ticker:"005930" },
    "066575": { issuer_name:"LG전자", issuer_ticker:"066570" },
  };
  const m=known[ticker]||null, preferred=!!m||/우선주|우$/.test(name);
  return { issuer_name:m?.issuer_name||(preferred?name.replace(/우선주|우$/g,"").trim():name), issuer_ticker:m?.issuer_ticker||(preferred?"":ticker), security_type:preferred?"PREFERRED":"COMMON" };
}

type Target = { name:string; ticker:string; market:"KR"|"US"|"OTHER"; reason:string; held:boolean; issuer_name:string; issuer_ticker:string; security_type:"COMMON"|"PREFERRED"|"OTHER" };
function targetsFromState(stateLike: unknown): Target[] {
  const state=asObject(stateLike), rows=arr(state.investmentWatchlist), priority:Record<string,number>={consider:4,interest:3,study:2,hold:1};
  const sorted=[...rows].filter(x=>x&&x.newsTracking!==false&&cleanText(x.name,120)).sort((a,b)=>
    ((b?.status==="hold"||b?.held===true)?1:0)-((a?.status==="hold"||a?.held===true)?1:0)+
    (priority[String(b?.status||"")]||0)-(priority[String(a?.status||"")]||0)+
    String(b?.updatedAt||"").localeCompare(String(a?.updatedAt||""))
  );
  const out:Target[]=[]; const seen=new Set<string>();
  for(const x of sorted){
    const name=cleanText(x.name,120),ticker=cleanText(x.ticker,40).toUpperCase(); if(!name)continue;
    const market=normalizeMarket(x.market||inferMarket(ticker)),meta=issuerMeta(name,ticker),key=`${market}|${ticker||name.toLowerCase()}`; if(seen.has(key))continue; seen.add(key);
    const preferredNote=meta.security_type==="PREFERRED"?`발행회사 ${meta.issuer_name}${meta.issuer_ticker?`(${meta.issuer_ticker})`:""} 공통 뉴스와 우선주 직접 요인(배당·주주환원·괴리율·유동성·공시)을 함께 추적.`:"";
    out.push({name,ticker,market,reason:[cleanText(x.reason,800),preferredNote].filter(Boolean).join(" "),held:x?.status==="hold"||x?.held===true,...meta,security_type:meta.security_type as any});
    if(out.length>=MAX_TARGETS)break;
  }
  return out;
}

async function getAuthenticatedUser(req: Request, supabaseUrl: string, publishableKey: string) {
  const authHeader=req.headers.get("Authorization")??"";
  if(!authHeader.startsWith("Bearer "))return {user:null,error:"HANI OS 로그인 세션이 필요합니다."};
  const client=createClient(supabaseUrl,publishableKey,{global:{headers:{Authorization:authHeader}},auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  const {data:{user},error}=await client.auth.getUser();
  return error||!user?{user:null,error:"HANI OS 로그인 세션을 확인하지 못했습니다."}:{user,error:null};
}

function extractOutputText(payload:any){
  if(typeof payload?.output_text==="string"&&payload.output_text.trim())return payload.output_text.trim();
  const parts:string[]=[]; for(const item of arr(payload?.output))for(const part of arr(item?.content))if(part?.type==="output_text"&&typeof part?.text==="string")parts.push(part.text); return parts.join("").trim();
}
function extractWebSources(payload:any){
  const seen=new Set<string>(),out:Array<{url:string;title:string}>=[];
  for(const item of arr(payload?.output)){if(item?.type!=="web_search_call")continue;for(const s of arr(item?.action?.sources)){const url=cleanText(s?.url,2000);if(!url||seen.has(url))continue;seen.add(url);out.push({url,title:cleanText(s?.title||s?.name||url,240)});}}
  return out;
}
function canonicalUrl(value:unknown){const raw=cleanText(value,2000);if(!/^https?:\/\//i.test(raw))return "";try{const u=new URL(raw);u.hash="";for(const k of ["utm_source","utm_medium","utm_campaign","utm_term","utm_content","gclid","fbclid"])u.searchParams.delete(k);return u.toString().replace(/\/$/,"")}catch{return ""}}
async function sha256(text:string){const buf=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(text));return [...new Uint8Array(buf)].map(x=>x.toString(16).padStart(2,"0")).join("")}
function safeIso(value:unknown){const s=cleanText(value,64);if(!s)return null;const d=new Date(s);return Number.isNaN(d.getTime())?null:d.toISOString()}
function kstParts(date=new Date()){
  const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Seoul",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(date); const get=(t:string)=>Number(parts.find(p=>p.type===t)?.value||0);
  return {year:get("year"),month:get("month"),day:get("day")};
}
function weeklyIdentity(anchor=new Date()){
  const {year,month,day}=kstParts(anchor),week=Math.floor((day-1)/7)+1,mm=String(month).padStart(2,"0");
  return { period_key:`weekly:${year}-${mm}-W${week}`, title:`${year}년 ${month}월 ${week}주차 종합 시황` };
}

const COMMENT_SCHEMA={
  type:"object",additionalProperties:false,
  properties:{agent_key:{type:"string",enum:["hani","jieun","sua","hina","naeun","nauen","haru","sooyeon","suyeon","minji","yuna","arin"]},agent_name:{type:"string"},tone:{type:"string",enum:["ANALYSIS","POSITIVE","SKEPTICAL","QUESTION","REACTION","LIGHT","COUNTERPOINT","CHECK","SHORT","PRACTICAL","LIFE","TREND","BANTER","COUNTER","CAUTION"]},comment:{type:"string"}},
  required:["agent_key","agent_name","tone","comment"]
};
const COMMENT_TONES=new Set(["ANALYSIS","POSITIVE","SKEPTICAL","QUESTION","REACTION","LIGHT","COUNTERPOINT","CHECK","SHORT","PRACTICAL","LIFE","TREND","BANTER","COUNTER","CAUTION"]);
const INTEREST_SCHEMA={
  type:"object",additionalProperties:false,
  properties:{entities:{type:"array",maxItems:5,items:{type:"object",additionalProperties:false,properties:{
    name:{type:"string"},ticker:{type:"string"},market:{type:"string",enum:["KR","US","OTHER"]},issuer_name:{type:"string"},issuer_ticker:{type:"string"},security_type:{type:"string",enum:["COMMON","PREFERRED","OTHER"]},signal:{type:"string",enum:["POSITIVE","NEUTRAL","NEGATIVE","MIXED","NO_NEWS"]},summary:{type:"string"},watch_point:{type:"string"},
    news:{type:"array",maxItems:4,items:{type:"object",additionalProperties:false,properties:{title:{type:"string"},summary:{type:"string"},why_it_matters:{type:"string"},hani_view:{type:"string"},published_at:{type:"string"},source_name:{type:"string"},source_url:{type:"string"},source_grade:{type:"string",enum:["OFFICIAL","MEDIA","BROKER","RUMOR"]},sentiment:{type:"string",enum:["POSITIVE","NEUTRAL","NEGATIVE","MIXED"]},importance:{type:"integer",minimum:1,maximum:5},event_type:{type:"string"},scope:{type:"string",enum:["COMPANY_COMMON","PREFERRED_DIRECT","BOTH"]},comments:{type:"array",minItems:1,maxItems:7,items:COMMENT_SCHEMA}},required:["title","summary","why_it_matters","hani_view","published_at","source_name","source_url","source_grade","sentiment","importance","event_type","scope","comments"]}}
  },required:["name","ticker","market","issuer_name","issuer_ticker","security_type","signal","summary","watch_point","news"]}}},required:["entities"]
};
const WEEKLY_SCHEMA={
  type:"object",additionalProperties:false,properties:{market_brief:{type:"string"},weekly_brief:{type:"object",additionalProperties:false,properties:{korea_market:{type:"string"},us_market:{type:"string"},major_events:{type:"array",minItems:3,maxItems:6,items:{type:"string"}},macro_flow:{type:"array",minItems:2,maxItems:5,items:{type:"string"}},key_themes:{type:"array",minItems:3,maxItems:6,items:{type:"string"}},checkpoints:{type:"array",minItems:3,maxItems:6,items:{type:"string"}},hani_view:{type:"string"}},required:["korea_market","us_market","major_events","macro_flow","key_themes","checkpoints","hani_view"]}},required:["market_brief","weekly_brief"]
};

function drawCommentCount(){const r=crypto.getRandomValues(new Uint32Array(1))[0]/4294967296;return r<.20?1:r<.45?2:r<.70?3:r<.82?4:r<.90?5:r<.96?6:7}
async function openAIJson(openaiKey:string,instructions:string,input:any,schema:any,name:string,maxOutput=8000){
  const res=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:`Bearer ${openaiKey}`,"Content-Type":"application/json"},body:JSON.stringify({model:MODEL,instructions,input:JSON.stringify(input,null,2),tools:[{type:"web_search",search_context_size:"low",user_location:{type:"approximate",country:"KR",timezone:"Asia/Seoul"}}],tool_choice:"required",include:["web_search_call.action.sources"],max_output_tokens:maxOutput,reasoning:{effort:"none"},text:{verbosity:"low",format:{type:"json_schema",name,strict:true,schema}},store:false})});
  const payload=await res.json().catch(()=>({})); if(!res.ok)throw new Error(`OpenAI ${res.status}: ${payload?.error?.message||"API 호출 실패"}`); const text=extractOutputText(payload); if(!text)throw new Error("OpenAI Structured Output이 비어 있습니다.");
  let parsed:any; try{parsed=JSON.parse(text)}catch{throw new Error("OpenAI Structured Output JSON 파싱에 실패했습니다.")}; return {parsed,payload,sources:extractWebSources(payload)};
}

async function runInterestSearch(openaiKey:string,targets:Target[]){
  if(!targets.length)return {generated_at:new Date().toISOString(),entities:[],sources:[],model:MODEL,usage:null};
  const commentPlan=Array.from({length:20},drawCommentCount); if(new Set(commentPlan.slice(0,6)).size===1)commentPlan[1]=commentPlan[0]===2?3:2;
  const variationPlan=commentVariationPlan(commentPlan.length);
  const instructions=[
    "당신은 PROJECT HANI Newsroom Auto Publisher의 관심종목 편집자입니다.",
    "현재 시각 기준 최근 72시간 안의 투자판단에 의미 있는 신규 이벤트만 최대 종목당 4건 찾으세요. 단순 홍보·반복 보도·오래된 사건 재탕은 제외하세요.",
    "같은 사건을 여러 매체가 보도하면 하나로 합치고 가장 신뢰도 높은 원출처 또는 대표 출처를 사용하세요.",
    "PREFERRED 종목은 issuer_name/issuer_ticker 기업 공통 뉴스와 우선주 직접 요인(배당·주주환원·괴리율·유동성·직접 공시)을 함께 검색하고 scope를 COMPANY_COMMON/PREFERRED_DIRECT/BOTH로 구분하세요.",
    "source_grade: OFFICIAL=공시/IR/정부/거래소, MEDIA=신뢰 언론, BROKER=증권사 전망, RUMOR=공식 확인 없는 루머. 공식 확정과 전망을 섞지 마세요.",
    "sentiment는 해당 종목의 사업·실적·주가 재료 관점 POSITIVE/NEUTRAL/NEGATIVE/MIXED, importance는 1~5입니다. 매수·매도 지시를 하지 마세요.",
    "각 뉴스의 hani_view는 input.persona_policy.hani의 관점으로 사실 반복이 아니라 앞으로 확인할 핵심을 냉정하게 1~3문장으로 적으세요.",
    "comments 개수는 input.comment_count_plan을 뉴스 출력 순서대로 정확히 따르세요. 1~7개이며 기사마다 수가 달라야 합니다.",
    "기사마다 관련 Agent를 먼저 고른 뒤 input.persona_policy의 해당 Agent w 가중치와 input.comment_variation_plan의 style_roll을 사용해 tone을 고르세요. 모든 Agent를 참여시키지 말고 기존 comment_count_plan 수만 지키세요.",
    "tone은 ANALYSIS/POSITIVE/SKEPTICAL/QUESTION/REACTION/LIGHT/COUNTERPOINT/CHECK/SHORT/PRACTICAL/LIFE/TREND 중 가장 가까운 값을 쓰세요. 3개 이상이면 분석형 외 tone을 최소 1개 넣고, 같은 기사 댓글을 같은 전문 분석체로 통일하지 마세요.",
    "HINA/NAEUN/MINJI는 기본적으로 Reaction·Light 비중이 높지만 무능하거나 늘 농담만 하는 인물로 쓰지 마세요. HINA는 학습·일본, NAEUN은 건강, MINJI는 대중·콘텐츠 뉴스에서 짧고 정확한 의견을 낼 수 있습니다.",
    "심각한 보안 사고·인명/건강 위험·중대한 소송·규제·대규모 재무손실은 serious로 판단하고 REACTION/LIGHT/LIFE/TREND 농담을 사용하지 마세요. CHECK·QUESTION·SKEPTICAL·ANALYSIS·SHORT를 우선하세요.",
    "댓글은 기본 1~3문장입니다. HINA/NAEUN/MINJI/YUNA는 1~2문장을 우선하고 HANI/JIEUN/SUA도 필요한 만큼만 짧게 씁니다.",
    "relationship_ok가 true인 기사에서만 아주 낮은 확률로 뒤 댓글 하나가 앞 댓글에 자연스럽게 반응할 수 있습니다. 기사당 최대 1회이며 사실 설명을 방해하거나 같은 꽁트를 반복하지 마세요.",
    "같은 배치의 연속 기사에서 동일 Agent+tone, 같은 시작문장, 캐치프레이즈, 결론 구조를 반복하지 마세요. 관련성이 더 중요하므로 다양성을 위해 무관한 Agent를 넣지는 마세요.",
    "FACT > ARTICLE RELEVANCE > CHARACTER VIEWPOINT > CHARACTER VOICE > HUMOR 순서입니다. 댓글은 확인된 기사 사실 범위 안에서만 말하고 캐릭터성을 위해 기사에 없는 사실을 만들지 마세요.",
    "published_at과 source_url은 실제 검색에서 확인한 값만 사용하고 모르면 빈 문자열로 두세요. URL을 만들어내지 마세요.",
    "의미 있는 신규 뉴스가 없으면 signal=NO_NEWS, news=[]로 두세요. 결과는 지정 JSON Schema만 따르세요."
  ].join("\n");
  const ai=await openAIJson(openaiKey,instructions,{as_of:new Date().toISOString(),user_locale:"ko-KR",lookback_hours:72,comment_count_plan:commentPlan,comment_variation_plan:variationPlan,persona_policy:compactPersonaPolicy(),targets},INTEREST_SCHEMA,"hani_newsroom_interest_auto",8500);
  const sourceMap=new Map(ai.sources.map(s=>[canonicalUrl(s.url),s])); let ordinal=0; const seen=new Set<string>();
  const entities=arr(ai.parsed?.entities).map((raw:any)=>{const e=asObject(raw),ticker=cleanText(e.ticker,40).toUpperCase(),target=targets.find(t=>t.ticker===ticker)||targets.find(t=>t.name===cleanText(e.name,120)); const news=arr(e.news).map((rawItem:any)=>{const item=asObject(rawItem),can=canonicalUrl(item.source_url),src=can?sourceMap.get(can):undefined,planned=Math.max(1,Math.min(7,Number(commentPlan[ordinal++])||2));return {title:cleanText(item.title,240),summary:cleanText(item.summary,800),why_it_matters:cleanText(item.why_it_matters,600),hani_view:cleanText(item.hani_view,800),published_at:cleanText(item.published_at,64),source_name:cleanText(src?.title||item.source_name,200),source_url:src?.url||"",source_verified:!!src,source_grade:["OFFICIAL","MEDIA","BROKER","RUMOR"].includes(String(item.source_grade))?String(item.source_grade):"MEDIA",sentiment:["POSITIVE","NEUTRAL","NEGATIVE","MIXED"].includes(String(item.sentiment))?String(item.sentiment):"NEUTRAL",importance:Math.max(1,Math.min(5,Math.round(Number(item.importance)||1))),event_type:cleanText(item.event_type,100),scope:["COMPANY_COMMON","PREFERRED_DIRECT","BOTH"].includes(String(item.scope))?String(item.scope):"COMPANY_COMMON",comments:arr(item.comments).slice(0,planned).map((c:any)=>({agent_key:cleanText(c.agent_key,30),agent_name:cleanText(c.agent_name,50),tone:COMMENT_TONES.has(String(c.tone))?String(c.tone):"SHORT",comment:cleanText(c.comment,420)})).filter((c:any)=>c.comment)}}).filter((item:any)=>{if(!item.title)return false;const key=`${ticker}|${item.title.toLowerCase().replace(/\s+/g," ")}`;if(seen.has(key))return false;seen.add(key);return true}).slice(0,4);return {name:cleanText(e.name,120)||target?.name||"",ticker:ticker||target?.ticker||"",market:normalizeMarket(e.market||target?.market),issuer_name:cleanText(e.issuer_name,120)||target?.issuer_name||cleanText(e.name,120),issuer_ticker:cleanText(e.issuer_ticker,40).toUpperCase()||target?.issuer_ticker||ticker,security_type:["COMMON","PREFERRED","OTHER"].includes(String(e.security_type))?String(e.security_type):target?.security_type||"OTHER",signal:["POSITIVE","NEUTRAL","NEGATIVE","MIXED","NO_NEWS"].includes(String(e.signal))?String(e.signal):(news.length?"NEUTRAL":"NO_NEWS"),summary:cleanText(e.summary,800),watch_point:cleanText(e.watch_point,600),news};}).slice(0,5);
  return {generated_at:new Date().toISOString(),entities,sources:ai.sources.slice(0,30),model:String(ai.payload?.model||MODEL),usage:ai.payload?.usage||null};
}

async function runWeeklySearch(openaiKey:string){
  const instructions=[
    "당신은 PROJECT HANI Newsroom Auto Publisher의 주간 시장 편집자입니다.",
    characterVoicePrompt("hani", "NEWSROOM", true),
    "최근 7일 한국과 미국 주식시장을 종합한 주간 시황을 작성하세요. 단순 1~2문장 요약이 아니라 한 주를 다시 이해할 수 있는 기록이어야 합니다.",
    "market_brief는 4~6문장 Executive Overview. weekly_brief.korea_market/us_market은 각각 3~5문장으로 지수 흐름·수급·대표 업종·핵심 동인을 설명하세요.",
    "major_events는 3~6개, macro_flow는 금리·환율·유가·채권·외국인/기관 수급·정책 변수 2~5개, key_themes 3~6개, checkpoints 3~6개로 작성하세요.",
    "hani_view는 사실 요약과 분리된 HANI의 판단으로 다음 주 무엇을 우선 확인할지 3~5문장. 매수·매도 지시는 금지합니다.",
    "공식자료·거래소·정부·기업 공시와 신뢰 가능한 언론을 우선하고, 날짜와 사실을 추측하지 마세요. 결과는 지정 JSON Schema만 따르세요."
  ].join("\n");
  const ai=await openAIJson(openaiKey,instructions,{as_of:new Date().toISOString(),user_locale:"ko-KR",lookback_hours:168,scope:"KR_US_WEEKLY"},WEEKLY_SCHEMA,"hani_newsroom_weekly_auto",7000);
  const w=asObject(ai.parsed?.weekly_brief); return {generated_at:new Date().toISOString(),market_brief:cleanText(ai.parsed?.market_brief,1800),weekly_brief:{korea_market:cleanText(w.korea_market,2000),us_market:cleanText(w.us_market,2000),major_events:arr(w.major_events).map(x=>cleanText(x,420)).filter(Boolean).slice(0,6),macro_flow:arr(w.macro_flow).map(x=>cleanText(x,420)).filter(Boolean).slice(0,5),key_themes:arr(w.key_themes).map(x=>cleanText(x,320)).filter(Boolean).slice(0,6),checkpoints:arr(w.checkpoints).map(x=>cleanText(x,360)).filter(Boolean).slice(0,6),hani_view:cleanText(w.hani_view,1800)},sources:ai.sources.slice(0,30),model:String(ai.payload?.model||MODEL),usage:ai.payload?.usage||null};
}

async function archiveWeekly(admin:any,userId:string,news:any,anchor=new Date()){
  const identity=weeklyIdentity(anchor),w=asObject(news?.weekly_brief); if(!cleanText(news?.market_brief,10)&&!cleanText(w.korea_market,10)&&!cleanText(w.us_market,10))return {weekly:0};
  const row={user_id:userId,post_type:"WEEKLY",period_key:identity.period_key,title:identity.title,entity_name:null,ticker:null,market:"GLOBAL",sentiment:null,source_grade:null,importance:null,event_at:null,published_at:safeIso(news?.generated_at)||new Date().toISOString(),source_name:"HANI Newsroom",source_url:null,source_verified:true,summary:cleanText(news?.market_brief,3000),why_it_matters:null,hani_view:cleanText(w.hani_view,2500),comments:[],payload:{market_brief:cleanText(news?.market_brief,3000),weekly_brief:{korea_market:cleanText(w.korea_market,3000),us_market:cleanText(w.us_market,3000),major_events:arr(w.major_events).slice(0,6),macro_flow:arr(w.macro_flow).slice(0,5),key_themes:arr(w.key_themes).slice(0,6),checkpoints:arr(w.checkpoints).slice(0,6),hani_view:cleanText(w.hani_view,2500)},sources:arr(news?.sources).slice(0,30),model:cleanText(news?.model,80)},dedupe_key:identity.period_key,updated_at:new Date().toISOString()};
  const {error}=await admin.from("hani_newsroom_posts").upsert(row,{onConflict:"user_id,dedupe_key"});
  if(error){
    console.error("[Newsroom archiveWeekly DB]", error);
    throw new Error(errorText("WEEKLY_DB_WRITE_FAILED", error));
  }
  return {weekly:1};
}
async function archiveInterest(admin:any,userId:string,news:any){
  const rows:any[]=[];
  for(const eRaw of arr(news?.entities)){const e=asObject(eRaw),ticker=cleanText(e.ticker,40).toUpperCase(),name=cleanText(e.name,120);for(const iRaw of arr(e.news)){const item=asObject(iRaw),title=cleanText(item.title,240);if(!title)continue;const can=canonicalUrl(item.source_url),dateKey=cleanText(item.published_at,64).slice(0,10),fingerprint=await sha256(can||`${ticker||name}|${title.toLowerCase().replace(/\s+/g," ")}|${dateKey}`),dedupe=`interest:${ticker||name}:${fingerprint}`;rows.push({user_id:userId,post_type:"INTEREST",period_key:null,title,entity_name:name,ticker:ticker||null,market:normalizeMarket(e.market),sentiment:["POSITIVE","NEUTRAL","NEGATIVE","MIXED"].includes(String(item.sentiment))?String(item.sentiment):"NEUTRAL",source_grade:["OFFICIAL","MEDIA","BROKER","RUMOR"].includes(String(item.source_grade))?String(item.source_grade):"MEDIA",importance:Math.max(1,Math.min(5,Math.round(Number(item.importance)||1))),event_at:safeIso(item.published_at),published_at:safeIso(item.published_at)||safeIso(news?.generated_at)||new Date().toISOString(),source_name:cleanText(item.source_name,200)||null,source_url:can||null,source_verified:item.source_verified===true&&!!can,summary:cleanText(item.summary,1800),why_it_matters:cleanText(item.why_it_matters,1200),hani_view:cleanText(item.hani_view,1400),comments:arr(item.comments).slice(0,7).map((c:any)=>({agent_key:cleanText(c?.agent_key,30),agent_name:cleanText(c?.agent_name,50),tone:cleanText(c?.tone,30),comment:cleanText(c?.comment,500)})).filter((c:any)=>c.comment),payload:{event_type:cleanText(item.event_type,100),scope:cleanText(item.scope,40),entity_summary:cleanText(e.summary,1200),watch_point:cleanText(e.watch_point,900),issuer_name:cleanText(e.issuer_name,120),issuer_ticker:cleanText(e.issuer_ticker,40),security_type:cleanText(e.security_type,30),signal:cleanText(e.signal,30),model:cleanText(news?.model,80)},dedupe_key:dedupe,updated_at:new Date().toISOString()});}}
  if(!rows.length)return {interest_new:0};
  const {data,error}=await admin.from("hani_newsroom_posts").upsert(rows,{onConflict:"user_id,dedupe_key",ignoreDuplicates:true}).select("id");
  if(error){
    console.error("[Newsroom archiveInterest DB]", error);
    throw new Error(errorText("INTEREST_DB_WRITE_FAILED", error));
  }
  return {interest_new:Array.isArray(data)?data.length:0};
}
async function archiveResult(admin:any,userId:string,news:any,{includeWeekly=true,anchor=new Date()}={}){const out:any={weekly:0,interest_new:0};if(includeWeekly)Object.assign(out,await archiveWeekly(admin,userId,news,anchor));Object.assign(out,await archiveInterest(admin,userId,news));return out;}

async function scheduledPublish(admin:any,openaiKey:string,mode:string){
  const {data:states,error}=await admin.from("hani_state").select("user_id,state"); if(error)throw error; const results:any[]=[];
  for(const row of arr(states)){const userId=cleanText(row?.user_id,100);if(!userId)continue;const targets=targetsFromState(row?.state);const item:any={user_id:userId,mode,targets:targets.length,weekly:0,interest_new:0,ok:true};try{
      if(mode==="weekly"||mode==="both"){const weekly=await runWeeklySearch(openaiKey);const anchor=new Date(Date.now()-24*3600*1000);Object.assign(item,await archiveWeekly(admin,userId,weekly,anchor));}
      if((mode==="interest"||mode==="both")&&targets.length){const interest=await runInterestSearch(openaiKey,targets);Object.assign(item,await archiveInterest(admin,userId,interest));}
    }catch(e){item.ok=false;item.error=errorDetail(e);}results.push(item);
  }
  return results;
}

Deno.serve(async(req)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders}); if(req.method!=="POST")return json({ok:false,error:"METHOD_NOT_ALLOWED"},405);
  const supabaseUrl=Deno.env.get("SUPABASE_URL")??"",publishableKey=defaultKey("SUPABASE_PUBLISHABLE_KEYS","SUPABASE_ANON_KEY"),secretKey=defaultKey("SUPABASE_SECRET_KEYS","SUPABASE_SERVICE_ROLE_KEY"),openaiKey=Deno.env.get("OPENAI_API_KEY")??"";
  if(!supabaseUrl||!publishableKey||!secretKey)return json({ok:false,error:"SERVER_CONFIG_ERROR",message:"Supabase URL/Key 환경변수를 확인해 주세요."},500);
  let body:Record<string,any>={};try{body=await req.json()}catch{} const action=cleanText(body.action||"health",64).toLowerCase(); const admin=createClient(supabaseUrl,secretKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});

  if(action==="scheduled_publish"){
    const expected=Deno.env.get("HANI_NEWSROOM_CRON_SECRET")??"",provided=req.headers.get("x-hani-cron-secret")??""; if(!expected||provided!==expected)return json({ok:false,error:"CRON_AUTH_FAILED",message:"Newsroom Cron 인증에 실패했습니다."},401); if(!openaiKey)return json({ok:false,error:"OPENAI_SECRET_MISSING"},500);
    const mode=["interest","weekly","both"].includes(cleanText(body.mode,20))?cleanText(body.mode,20):"interest",started=Date.now();
    try{const results=await scheduledPublish(admin,openaiKey,mode);return json({ok:true,service:"PROJECT HANI",function:"hani-newsroom-publisher",version:VERSION,action:"SCHEDULED_PUBLISH",mode,results,latency_ms:Date.now()-started,hani_state_touched:false,message:"Newsroom 자동 발행을 완료했습니다. Life OS 원장은 변경하지 않았습니다."});}catch(e){return json({ok:false,error:"SCHEDULED_PUBLISH_FAILED",message:e instanceof Error?e.message:String(e),hani_state_touched:false},502)}
  }

  const auth=await getAuthenticatedUser(req,supabaseUrl,publishableKey); if(!auth.user)return json({ok:false,error:"INVALID_SESSION",message:auth.error},401);
  if(action==="health"){
    const probe=await admin.from("hani_newsroom_posts").select("id",{count:"exact",head:true}).eq("user_id",auth.user.id);
    return json({
      ok:!probe.error,
      service:"PROJECT HANI",
      function:"hani-newsroom-publisher",
      version:VERSION,
      authenticated:true,
      user_id:auth.user.id,
      admin_db_read:probe.error?{ok:false,error:errorDetail(probe.error)}:{ok:true,count:probe.count??0},
      hani_state_touched:false,
      message:probe.error?"Publisher 인증은 정상이나 service-role DB read 확인이 필요합니다.":"Cloud Archive + Auto Publisher 정상."
    },probe.error?502:200)
  }
  if(action==="archive_result"){
    try{
      const news=asObject(body.news),
        stats=await archiveResult(admin,auth.user.id,news,{includeWeekly:true,anchor:new Date(safeIso(news.generated_at)||Date.now())});
      return json({ok:true,service:"PROJECT HANI",function:"hani-newsroom-publisher",version:VERSION,action:"ARCHIVE_RESULT",stats,hani_state_touched:false,message:"현재 뉴스 결과를 Cloud Archive에 중복 없이 반영했습니다."});
    }catch(e){
      const diagnostic=errorDetail(e);
      console.error("[Newsroom ARCHIVE_RESULT_FAILED]", e);
      return json({
        ok:false,
        error:"ARCHIVE_RESULT_FAILED",
        message:diagnostic.message,
        diagnostic,
        hani_state_touched:false
      },502)
    }
  }
  return json({ok:false,error:"UNKNOWN_ACTION",message:"지원하지 않는 action입니다."},400);
});
