import fs from 'node:fs';
import vm from 'node:vm';
export const remote217Fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/context-remote-217-selection.json',import.meta.url),'utf8'));
// Execute the unmodified selection and renderer from the specified Git revision.
// Keep its season observer callback too, so season transitions are tested independently.
export function remote217Oracle(random=()=>4,{fallback=false}={}){
 const nodes=new Map();let view='home',season='autumn',changeSeason;
 const node=s=>{if(!nodes.has(s))nodes.set(s,{getAttribute(k){return this[k]}});return nodes.get(s)};
 const env=vm.createContext({rail:{},$:node,viewId:()=>view,season:()=>season,
  Math:Object.assign(Object.create(Math),{random:()=>random()/0x100000000}),
  crypto:fallback?undefined:{getRandomValues(a){a[0]=random();return a}},
  document:{documentElement:{}},MutationObserver:class{constructor(callback){changeSeason=callback}observe(){}},
  greetings:Object.fromEntries(['spring','summer','autumn','winter'].map(s=>[s,['staff','greeting']]))});
 vm.runInContext(remote217Fixture.declarations+remote217Fixture.selection+remote217Fixture.updateBanner+'\n'+remote217Fixture.seasonObserver+'\nthis.paint=updateBanner;this.all=banners;',env);
 return {files:[...new Set(Object.values(env.all).flat().map(e=>e[0]))],select(id,s,{changed=false}={}){view=id;season=s;if(changed)changeSeason();else env.paint();return node('.hani-remote-scene img').src}};
}
export function remote217Seed(view,season){
 return [...view+':'+season].reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,0);
}
export async function remote217BrowserEntropy(page){
 await page.addInitScript('window.__remote217Seed='+remote217Seed.toString());
 await page.route('**/hani-context-remote-v1.js?*',route=>{
  const source=fs.readFileSync(new URL('../hani-context-remote-v1.js',import.meta.url),'utf8');
  // Control only the entropy, leaving the real selection/cache/render path intact.
  const body=source.replace('crypto.getRandomValues(value);','value[0]=window.__remote217Seed(viewId(),season());');
  if(body===source)throw Error('remote RNG anchor drift');
  return route.fulfill({status:200,body,contentType:'text/javascript'});
 });
}
