// node scripts/hani-nav-groups.test.mjs
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const read=name=>fs.readFileSync(new URL("../"+name,import.meta.url),"utf8");
const html=read("index.html"),main=read("hani-main.js"),ui=read("hani-ui-v02992.js");
new vm.Script(main,{filename:"hani-main.js"});
new vm.Script(ui,{filename:"hani-ui-v02992.js"});
const aside=html.match(/<aside\b[^>]*class="[^"]*\bside\b[^"]*"[^>]*>([\s\S]*?)<\/aside>/)?.[1];
assert.ok(aside,"canonical sidebar");
const views=text=>Array.from(text.matchAll(/data-view="([^"]+)"/g),m=>m[1]);
const groups=Array.from(aside.matchAll(/<div class="group[^"]*" data-color="([^"]+)">([\s\S]*?)<\/div>\s*<\/div>/g),m=>[m[1],views(m[2])]);
assert.deepEqual(groups,[
  ["office",["intake","agentReview","monthlyReport","organization","ilbo","board"]],
  ["finance",["investment","investmentCommittee","investmentIntake","asset","ledger","newsroom"]],
  ["health",["diet","exercise"]],
  ["growth",["reading","study","university","certificate"]],
  ["life",["wishlist","travel","movie","game","diary"]],
  ["work",["tasks","calendar","work","drive"]],
  ["development",["aiWork","dev","geminiReports","deployment","aiBudget"]]
]);
const navViews=views(aside);
assert.equal(navViews[0],"home");
assert.equal(navViews.at(-1),"settings");
assert.equal(new Set(navViews).size,navViews.length,"unique nav views");
assert.deepEqual(views(aside.match(/<div class="side-bottom">([\s\S]*?)<\/div>/)[1]),["aura","settings"]);
const office=aside.match(/data-color="office">([\s\S]*?)<\/div>\s*<\/div>/)[1];
assert.deepEqual(Array.from(office.matchAll(/<span class="txt">([^<]+)<\/span>/g),m=>m[1]),["인포데스크","대표실","컨퍼런스 룸","회사 소개","하니일보","하니 라운지"]);
assert.doesNotMatch(aside,/nav-floor-|data-go=/,"v204 sidebar structure restored");
assert.match(aside,/data-view="investmentCommittee"[\s\S]*?<span class="txt">하니 투자 리포트<\/span>/);
const pageMetaSource=main.match(/const pageMeta=\{[\s\S]*?\n\};/)[0];
const titles=vm.runInNewContext(pageMetaSource+';pageMeta');
assert.equal(titles.agentReview[0],'대표실','canonical page title');
// Execute the loaded cleanup owner: it runs after markup and can overwrite approved labels.
const cleanup=read('hani-ui-cleanup-v02971.js'),labels=new Map([...aside.matchAll(/data-view="([^"]+)"[^>]*>[\s\S]*?<span class="txt">([^<]+)<\/span>/g)].map(m=>[m[1],{textContent:m[2]}]));
const cleanupContext=vm.createContext({qa:selector=>{const id=selector.match(/data-view="([^"]+)"/)[1];return labels.has(id)?[labels.get(id)]:[];}});
vm.runInContext(cleanup.match(/  const NAV_LABELS = \{[\s\S]*?\r?\n  \};/)[0]+'\n'+cleanup.match(/  function renameNavigation\(\) \{[\s\S]*?\r?\n  \}/)[0]+'\nrenameNavigation();renameNavigation();',cleanupContext);
assert.equal(labels.get('agentReview').textContent,titles.agentReview[0],'cleanup retains approved room name after repeated execution');
assert.equal(labels.get('deployment').textContent,'배포센터','cleanup retains approved deployment label');
const bannerStart=ui.indexOf('  const mainCharacterBannerVariants='),bannerEnd=ui.indexOf('  const mainCharacterInternalViewExists=',bannerStart);
const bannerContext=vm.createContext({});
vm.runInContext(ui.slice(bannerStart,bannerEnd)+';this.banner=mainCharacterBannerConfig("agentReview");',bannerContext);
assert.equal(bannerContext.banner.title,'대표실 - HANI BOARDROOM');
assert.match(bannerContext.banner.description,/대표실입니다/);
assert.equal(bannerContext.banner.owner,'hani','existing banner owner');
assert.ok(aside.indexOf('data-view="investment"')<aside.indexOf('data-view="investmentCommittee"'),'canonical report link remains next to investment');
assert.match(main,/querySelectorAll\("\[data-go\]"\)/,'shortcut uses existing delegated route');
assert.doesNotMatch(aside,/data-color="team"|data-view="policy"|data-view="aiTeam"|data-view="characterArchive"/);
assert.match(html,/data-settings-tab="policy"[^>]*>사내 규칙<\/button>/);
assert.doesNotMatch(html+main,/HANI AURA/);
assert.doesNotMatch(read('hani-design-system.css'),/content:\s*["']HANI AURA["']/);
assert.doesNotMatch(read('hani-development-history-v1.js'),/HANI AURA/);
assert.match(main,/aura:\["테마 스튜디오"/);
const ids=Array.from(html.matchAll(/\bid="([^"]+)"/g),m=>m[1]);
assert.equal(new Set(ids).size,ids.length,"no duplicate markup ids");
const loadedScripts=[...new Set([...html.matchAll(/src="\.\/([^"?]+\.js)(?:\?[^"']*)?"/g)].map(m=>m[1]))];
const literalCounts=new Map();
for(const match of (html+'\n'+loadedScripts.map(read).join('\n')).matchAll(/\bid=["']([^"']+)["']/g))literalCounts.set(match[1],(literalCounts.get(match[1])||0)+1);
for(const id of ['organization','settings','settingsData','settings-tab-data','settings-tab-policy','characterArchive','loginGateFinish'])assert.equal(literalCounts.get(id),1,id+' unique across HTML/runtime JS strings');
// Parse ancestors so moving a tab cannot accidentally nest it inside Cloud recovery.
const stack=[],parents=new Map(),voidTags=new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
const markup=html.replace(/<!--[\s\S]*?-->/g,'').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,'');
for(const match of markup.matchAll(/<\/?([a-z][a-z0-9]*)\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi)){
  const tag=match[1].toLowerCase(),text=match[0];
  if(text.startsWith('</')){const i=stack.findLastIndex(n=>n.tag===tag);if(i>=0)stack.length=i;continue}
  const id=text.match(/\bid="([^"]+)"/)?.[1];
  if(id)parents.set(id,stack.map(n=>n.id).filter(Boolean));
  if(!voidTags.has(tag)&&!text.endsWith('/>'))stack.push({tag,id});
}
assert.equal(parents.get('policy').at(-1),'settings','policy is a direct settings panel');
assert.ok(parents.get('cloudBridgeCard').includes('settingsData'));
assert.ok(parents.get('loadRecoveryPanel').includes('settingsData'));
assert.ok(parents.get('cloudChoicePanel').includes('cloudBridgeCard'));
assert.ok(parents.get('cloudChoicePanel').includes('settingsData'));
assert.equal(parents.get('reading').includes('settings'),false,'later views remain outside settings');
const hubSource=read('hani-organization-hub.js');
const selectHub=hubSource.match(/  function selectHubTab\(tab\)\{[\s\S]*?\n  \}/)[0];
const intro=[{hidden:false},{hidden:false}],chart=[{hidden:false},{hidden:false},{hidden:false}],mast={hidden:false},directory={hidden:false},overview={hidden:false},select={value:''},search={value:''},root={dataset:{},querySelectorAll:s=>s.includes('.ogh-hero')?intro:chart,querySelector:s=>s==='.ogh-overview'?overview:mast};
const hubContext=vm.createContext({root,directory,select,search,group:'ALL',filterPeople(){},renderOverview(){}});vm.runInContext(selectHub,hubContext);
for(const tab of ['overview','people','aiTeam']){
  hubContext.selectHubTab(tab);
  assert.equal(intro.every(n=>n.hidden),tab!=='overview');assert.equal(chart.every(n=>n.hidden),tab!=='people');
  assert.equal(overview.hidden,tab!=='overview');assert.equal(directory.hidden,tab==='overview');assert.equal(mast.hidden,tab!=='people');assert.equal(hubContext.group,tab==='aiTeam'?'AI STAFF':'ALL');
}
const clickOwner=hubSource.match(/  root.addEventListener\('click',e=>\{[\s\S]*?\n  \}\);/)[0];
let onHubClick;const scrollRoutes=[],scrolled=[];
root.addEventListener=(_name,fn)=>{onHubClick=fn};root.contains=()=>true;
root.querySelector=s=>s==='.ogh-mast nav'?mast:{scrollIntoView:()=>scrolled.push(s)};
Object.assign(hubContext,{document:{querySelector:()=>true},matchMedia:()=>({matches:true}),showView:value=>{scrollRoutes.push(value);hubContext.selectHubTab('people')}});
vm.runInContext(clickOwner,hubContext);
for(const target of ['ogh-chart','ogh-teams','ogh-people']){
  hubContext.selectHubTab('overview');const button={dataset:{scroll:target},matches:()=>false};onHubClick({target:{closest:()=>button}});
  assert.equal(scrollRoutes.at(-1),'organization/people');assert.equal(chart.every(n=>!n.hidden),true);assert.equal(scrolled.at(-1),'#'+target);
}

const bundle=ui.match(/\/\/ BEGIN CANONICAL TAB VOICE BUNDLE([\s\S]*?)\/\/ END CANONICAL TAB VOICE BUNDLE/)?.[1];
assert.ok(bundle,"existing quote source");
const context=vm.createContext({});
vm.runInContext(bundle+";globalThis.api={TAB_CHARACTER_LINES,createTabQuoteSelector,characterProfile};",context);
const {TAB_CHARACTER_LINES:map,createTabQuoteSelector:selector,characterProfile}=context.api;
for(const view of navViews){
  assert.ok(Object.hasOwn(map,view),view+" speaker coverage");
  assert.ok(characterProfile(map[view].speakerId),view+" known speaker");
  assert.ok(map[view].lines.length>=3&&map[view].lines.length<=5,view+" 3–5 lines");
  assert.equal(new Set(map[view].lines).size,map[view].lines.length,view+" unique lines");
  const select=selector(()=>0),first=select(view);
  assert.equal(first.agent,map[view].speakerId);
  assert.equal(first.speaker,characterProfile(first.agent).identity.split(" · ")[0]);
  assert.equal(select(view).quote,first.quote,view+" redraw stable");
  select("__unknown__");
  assert.notEqual(select(view).quote,first.quote,view+" re-entry rotates");
}
assert.equal(selector(()=>0)("__unknown__").speaker,"하니");
for(const [view,owner] of Object.entries({diet:"naeun",exercise:"sooyeon",reading:"haru",movie:"minji",diary:"haru"})){
  assert.equal(map[view].speakerId,owner,"reuse existing assignment");
}
const sports=selector(()=>0);
assert.notEqual(sports("game","yankees").quote,sports("game","kia").quote);
assert.equal(sports("game","kia").agent,"sooyeon");

// Both existing render paths share the same session-memory selector.
assert.match(ui,/window\.HaniPageQuote=selectCharacterQuote/);
const pageQuote=main.match(/function pageQuote\(page\)\{[\s\S]*?\n\}/)?.[0];
assert.ok(pageQuote);
const bridge=vm.createContext({window:{HaniPageQuote:selector(()=>0)}});
vm.runInContext(pageQuote,bridge);
for(const view of navViews){
  const result=vm.runInContext("pageQuote("+JSON.stringify(view)+")",bridge);
  assert.equal(result[0],characterProfile(map[view].speakerId).identity.split(" · ")[0]);
  assert.ok(map[view].lines.includes(result[1]));
}

// Execute the canonical collapse handler with minimal DOM doubles.
const binding=main.match(/document\.querySelectorAll\("\.group-head"\)\.forEach\(b=>\{[\s\S]*?\n\}\);/)?.[0];
assert.ok(binding);
let persisted=0;
const heads=[false,true].map((initial,i)=>{
  let collapsed=initial;
  const body={id:""},attributes={},listeners={};
  const group={dataset:{color:"test"+i},querySelector:()=>body,classList:{
    contains:()=>collapsed,toggle:()=>collapsed=!collapsed
  }};
  return {attributes,listeners,body,closest:()=>group,
    setAttribute:(key,value)=>attributes[key]=value,
    addEventListener:(event,fn)=>listeners[event]=fn};
});
vm.runInNewContext(binding,{document:{querySelectorAll:()=>heads},persistCollapsedGroups:()=>persisted++});
for(const [i,head] of heads.entries()){
  assert.equal(head.type,"button","native keyboard activation");
  assert.equal(head.attributes["aria-controls"],head.body.id);
  assert.equal(head.attributes["aria-expanded"],String(i===0));
  head.listeners.click();
  assert.equal(head.attributes["aria-expanded"],String(i!==0));
  head.listeners.click();
  assert.equal(head.attributes["aria-expanded"],String(i===0));
}
assert.equal(persisted,4,"reuse existing persistence path");
const css=read("hani-style-01.css");
assert.match(css,/@media\(max-width:1350px\)\{\s*\.ai-banner\{grid-template-columns:minmax\(220px,1fr\) minmax\(0,590px\)!important\}/);
assert.match(css,/\.ai-character-zone\{width:100%!important;max-width:590px!important;min-width:0!important/);
console.log("PASS nav groups, speaker coverage/rotation/bridge, collapse aria and layout contract");
