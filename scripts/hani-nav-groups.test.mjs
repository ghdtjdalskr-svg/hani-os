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
  ["office",["intake","agentReview","monthlyReport","policy","aura"]],
  ["finance",["investment","investmentIntake","asset","ledger","newsroom"]],
  ["health",["diet","exercise"]],
  ["growth",["reading","study","university","certificate"]],
  ["life",["wishlist","travel","movie","game","diary"]],
  ["team",["organization","board","characterArchive","aiTeam"]],
  ["work",["tasks","calendar","work","drive"]],
  ["development",["dev","geminiReports","deployment","aiBudget"]]
]);
const navViews=views(aside);
assert.equal(navViews[0],"home");
assert.equal(navViews.at(-1),"settings");
assert.equal(new Set(navViews).size,navViews.length,"unique nav views");
assert.deepEqual(views(aside.match(/<div class="side-bottom">([\s\S]*?)<\/div>/)[1]),["settings"]);
const ids=Array.from(html.matchAll(/\bid="([^"]+)"/g),m=>m[1]);
assert.equal(new Set(ids).size,ids.length,"no duplicate markup ids");

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
