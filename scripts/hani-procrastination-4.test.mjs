// 미룬 일 4차 + 도움봇 얼굴: runs the shipped bytes (no historical preload).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const root=new URL('../',import.meta.url),read=f=>fs.readFileSync(new URL(f,root));
function webpSize(buf){
 assert.equal(buf.toString('ascii',0,4),'RIFF');assert.equal(buf.toString('ascii',8,12),'WEBP');
 const kind=buf.toString('ascii',12,16);
 if(kind==='VP8X')return [1+buf.readUIntLE(24,3),1+buf.readUIntLE(27,3)];
 if(kind==='VP8L'){const b=buf.readUInt32LE(21);return [1+(b&0x3fff),1+((b>>14)&0x3fff)]}
 return [buf.readUInt16LE(26)&0x3fff,buf.readUInt16LE(28)&0x3fff];
}

test('회장님 11/24 cadence: first sulk at 1 week / 2 weeks / 1 month, release weekly',()=>{
 const writes=[],forbidden=new Proxy({},{get:(_t,n)=>{writes.push(String(n));throw Error('forbidden '+String(n))}});
 const window={},context=vm.createContext({window,localStorage:forbidden,sessionStorage:forbidden,fetch:forbidden,setTimeout:forbidden,setInterval:forbidden});
 vm.runInContext(read('hani-procrastination-board.js').toString(),context);
 const api=window.HaniProcrastination,items=api.project({},new Date('2026-11-24T03:00:00Z'));
 const first=Object.fromEntries(items.map(i=>[i.id,i.bounds[0]]));
 assert.deepEqual(first,{steps:7,weight:7,workout:7,quiz:7,wrongReview:14,assets:31,ledger:31,wishlist:31,spendReview:31,culture:31,tasks:7,diary:7,goals:31,backup:31,release:7});
 for(const i of items){assert.equal(api.stage(i.bounds[0]-1,i.bounds),0,i.id+' still calm');assert.equal(api.stage(i.bounds[0],i.bounds),1,i.id+' first sulk');for(let k=1;k<4;k++)assert.ok(i.bounds[k]>i.bounds[k-1])}
 assert.deepEqual(writes,[]);
 assert.match(read('hani-procrastination-board.js').toString(),/item\.level === 0 \? `\$\{item\.days\}일째 · 아직 여유 있어요`/);
});

test('five staff use chibi sheet v2 rows; no profile-photo circles remain',()=>{
 const css=read('hani-procrastination-board.css').toString();
 assert.deepEqual(webpSize(read('assets/procrastination/pb-chibi-sheet-v2.webp')),[1536,1280]);
 assert.match(css,/:is\(\[data-owner="hani"\],\[data-owner="gaeun"\],\[data-owner="sooyeon"\],\[data-owner="yoonseul"\],\[data-owner="ieum"\]\) \.pb-portrait\{background-image:url\("\.\/assets\/procrastination\/pb-chibi-sheet-v2\.webp"\)\}/);
 for(const [id,y]of [['hani',0],['gaeun',25],['sooyeon',50],['yoonseul',75],['ieum',100]])assert.match(css,new RegExp('\\[data-owner="'+id+'"\\]\\{--pb-y:'+y+'%\\}'));
 assert.doesNotMatch(css,/hani-profile-(hani|gaeun|sooyeon|yoonseul|ieum)/);
});

test('helper faces: 20 staff on a 5x4 sheet, unique in-bounds cells, pets untouched',()=>{
 const css=read('hani-style-08.css').toString();
 assert.deepEqual(webpSize(read('assets/helper/helper-faces-v1.webp')),[960,768]);
 const ids=['hani','yuna','mir','seoyun','dohyun','serin','yuri','arin','gaeun','jieun','haru','naeun','hina','minji','sooyeon','sua','taeo','daon','yoonseul','ieum'];
 const tail=css.slice(css.indexOf('/* Helper faces v1'));assert.ok(tail.length>100);
 assert.match(tail,/--helper-image:url\('\.\/assets\/helper\/helper-faces-v1\.webp'\);--helper-size:260px 208px;--helper-trim:0px;--helper-shape:none;--helper-mask:none/);
 const seen=new Set();
 ids.forEach((id,i)=>{const m=tail.match(new RegExp('#haniHelperBot\\[data-staff="'+id+'"\\]\\{--helper-x:(-?\\d+)px;--helper-y:(-?\\d+)px\\}'));assert.ok(m,id);const x=Math.abs(Number(m[1])),y=Math.abs(Number(m[2]));assert.ok(Number(m[1])<=0&&Number(m[2])<=0);assert.equal(x,(i%5)*52);assert.equal(y,Math.floor(i/5)*52);seen.add(x+','+y)});
 assert.equal(seen.size,20);
 assert.doesNotMatch(tail,/pet-/,'pets keep their own portraits');
});
