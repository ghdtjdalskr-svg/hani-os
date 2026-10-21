import assert from 'node:assert/strict';
// Source check only: the browser suite remains responsible for actual DOM parsing,
// conditional controls, focus, layout, contrast and event dispatch.
export function verifySettingsMarkup(html,before,plan){
 const section=s=>s.slice(s.indexOf('<section id="settings"'),s.indexOf('<section id="reading"'));
 function scan(source){
  const stack=[],nodes=[];
  for(const match of section(source).matchAll(/<!--[\s\S]*?-->|<\/?[A-Za-z][^>"']*(?:(?:"[^"]*"|'[^']*')[^>"']*)*>/g)){
   const raw=match[0];if(raw.startsWith('<!--'))continue;
   const tag=raw.match(/^<\/?([\w-]+)/)[1].toLowerCase();
   if(raw.startsWith('</')){assert.equal(stack.pop()?.tag,tag,'balanced settings '+tag);continue}
   const attrs=Object.fromEntries([...raw.slice(tag.length+1,-1).matchAll(/([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s]+)))?/g)].map(m=>[m[1],m[2]??m[3]??m[4]??'']));
   const node={tag,attrs,raw,parents:[...stack]};nodes.push(node);
   if(!['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'].includes(tag))stack.push(node);
  }assert.equal(stack.length,0);return nodes;
 }
 const old=scan(before),now=scan(html),ids=new Map();
 for(const n of now)if(n.attrs.id){assert.ok(!ids.has(n.attrs.id),'unique static ID '+n.attrs.id);ids.set(n.attrs.id,n)}
 for(const n of old){if(n.attrs.id)assert.ok(ids.has(n.attrs.id),'original static ID '+n.attrs.id);if(['button','input','select','textarea','form','dialog','iframe','a'].includes(n.tag))assert.equal(now.filter(x=>x.raw===n.raw).length,old.filter(x=>x.raw===n.raw).length,'original control markup '+n.raw)}
 const groups=['backup','cloud','storage','advanced','display','records'];
 const actual=now.filter(n=>n.attrs.class?.split(' ').includes('settings-group'));
 assert.deepEqual(actual.map(n=>n.attrs.id),groups.map(g=>'group-'+g));assert.deepEqual(actual.map(n=>Object.hasOwn(n.attrs,'open')),[true,false,false,false,false,false]);
 let mapped=0;
 for(const m of plan.matchAll(/^\| `#([\w-]+)` \|.*?\| ([①②③④⑤⑥][^|]+|공통\/조건부|사내 규칙) \|$/gm)){
  const n=ids.get(m[1]);if(!n)continue;const group=n.parents.find(p=>p.attrs.class?.split(' ').includes('settings-group'))?.attrs.id||'common';
  const expected=/^[①②③④⑤⑥]/.test(m[2])?'group-'+groups['①②③④⑤⑥'.indexOf(m[2][0])]:m[2]==='사내 규칙'?'policy':'common';
  assert.equal(expected==='policy'?n.parents.some(p=>p.attrs.id==='policy'):group===expected,true,m[1]+' planned source group');mapped++;
 }
 for(const g of groups)assert.equal(now.filter(n=>n.tag==='a'&&n.attrs.href==='#group-'+g).length,1);
 for(const id of ['settingsSaveStatus','settingsCloudStatus','settingsBackupStatus','settingsPhotoStatus'])assert.ok(html.includes('id="'+id+'">확인 전</dd>'));
 // All original protection/approval text nodes remain present after re-parenting.
 const text=s=>section(s).replace(/<!--[\s\S]*?-->/g,'').replace(/<[^>]*>/g,'\n').split('\n').map(t=>t.trim()).filter(Boolean);
 const all=text(html).join('\n');for(const t of text(before))assert.ok(all.includes(t),'original visible copy retained: '+t.slice(0,90));
 return `${ids.size} unique source IDs / ${mapped} planned static IDs, original controls/notices, native group order/defaults and anchors`;
}
