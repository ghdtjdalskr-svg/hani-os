// 대공사 4단계 측정: 직원이 하루 중 "자기 자리"에 있는 시간과 "다른 곳에서 행동"하는 시간의 비율.
// 운영 화면과 같은 데이터(행동 표 323→315, 지도 v4, 장소 v3)를 읽는다. 7일, 1분 간격. 저장소 쓰기 없음.
import fs from 'node:fs';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
const read=f=>fs.readFileSync(new URL(f,root),'utf8'),json=f=>JSON.parse(read(f)),has=f=>fs.existsSync(new URL(f,root));
const days=['2026-11-23','2026-11-24','2026-11-25','2026-11-26','2026-11-27','2026-11-28','2026-11-29'];
const bands=[['오전 9-12',9,12],['점심 11:30-13',11.5,13],['오후 13-18',13,18],['저녁 18-22',18,22]];
export function loadLive(){
  const table=json(has('assets/data/office-actions-323.json')?'assets/data/office-actions-323.json':'assets/data/office-actions-315.json');
  const assets={canon:json('data/hani-building/spatial-contract-v4.json'),art:json('data/hani-building/art-map-v4.json'),sprites:json('assets/sprites-v2/manifest.json'),spritesV3:json('assets/sprites-v3/manifest-v3.json'),places:json('data/hani-building/office-places-v3.json')};
  const deny={getItem:()=>null,setItem(){throw Error('storage write')},removeItem(){throw Error('storage write')},clear(){throw Error('storage write')},key:()=>null,length:0};
  const context=vm.createContext({HaniOfficeActions221:table,HaniOfficeV2Assets:assets,document:{getElementById:()=>null},window:{},localStorage:deny,sessionStorage:deny});
  vm.runInContext(read('hani-office-live.js'),context);
  return context.HaniBuildingScene;
}
const at=(day,seconds)=>new Date(Date.parse(day+'T00:00:00+09:00')+seconds*1000);
export function share(){
  const scene=loadLive(),s=scene.scheduler,out={};
  for(const [name,a,b] of bands){
    const r={samples:0,desk:0,away:0,walking:0,places:{},lines:{}};
    for(const day of days)for(let sec=a*3600;sec<b*3600;sec+=60){
      for(const e of s.snapshot(at(day,sec)).entries){
        if(e.visitor||['mir','seongmin'].includes(e.id)||/^(pet-|kid-|companion-)/.test(e.id))continue;
        r.samples++;
        if(e.walking)r.walking++;else if(e.state==='AT_HOME')r.desk++;else r.away++;
        if(!e.walking&&e.state!=='AT_HOME'){const k=(e.floor||'?')+':'+(e.placeId||e.seat?.anchor||'?');r.places[k]=(r.places[k]||0)+1;if(e.line)r.lines[e.line]=(r.lines[e.line]||0)+1}
      }
    }
    const pct=n=>Math.round(n/r.samples*1000)/10;
    out[name]={자리:pct(r.desk),다른곳:pct(r.away),걷는중:pct(r.walking),
      장소상위:Object.entries(r.places).sort((x,y)=>y[1]-x[1]).slice(0,10).map(([k,v])=>k+' '+pct(v)+'%'),
      외출문구상위:Object.entries(r.lines).sort((x,y)=>y[1]-x[1]).slice(0,6).map(([k,v])=>k+' '+pct(v)+'%')};
  }
  return out;
}
if(process.argv[1]?.endsWith('hani-office-activity-share.mjs'))console.log(JSON.stringify(share(),null,1));
