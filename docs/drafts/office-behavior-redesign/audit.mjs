// Read-only audit of the current office model: line/place mismatch, frozen walks, near overlaps.
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
const repo=process.argv[2];
const {fixture}=await import(pathToFileURL(repo+'/scripts/hani-building-206-engine.test.mjs'));
const table=JSON.parse(fs.readFileSync(repo+'/assets/data/office-actions-221.json','utf8'));
const scene=fixture('09:00',false,null,table).context.HaniBuildingScene,s=scene.scheduler,art=scene.art,W=art.width||1672,H=art.height||941;
const px=p=>[p[0]*W/100,p[1]*H/100];
// 1. canon edges whose ends share one screen point (walk time with no visible motion)
const frozen=[];for(const e of scene.canon.edges){const a=scene.anchors.get(e.from),b=scene.anchors.get(e.to);if(!a||!b||a.floor!==b.floor||e.kind==='stairs')continue;
  const pa=px(scene.visualPoint(a)),pb=px(scene.visualPoint(b)),logical=Math.hypot(a.x-b.x,a.y-b.y);if(Math.hypot(pa[0]-pb[0],pa[1]-pb[1])<4&&logical>20)frozen.push(`${a.floor} ${e.from}→${e.to} logical ${logical.toFixed(0)} screen 0`)}
// 2. a full weekday at 1s: place-words vs where they stand, and close pairs
const placeWords=[['창밖',['window','lounge-armchair']],['커피',['coffee','pantry','cafe']],['화분',['plant']],['화이트보드',['whiteboard','board']],['소파',['sofa','lounge']]];
const mismatch=new Map(),near=new Map(),stuck=new Map();let snaps=0;const last=new Map();
for(let t=Date.parse('2026-10-22T08:00:00+09:00');t<Date.parse('2026-10-22T23:00:00+09:00');t+=1000){snaps++;
  const snap=s.snapshot(new Date(t)),hh=new Date(t+32400000).toISOString().slice(11,19);
  for(const p of [...snap.entries,...snap.visitors]){
    const a=scene.anchors.get(p.seat.anchor),where=(a?.id||'')+' '+(a?.room||'')+' '+(a?.type||'');
    // New scheduler: validate semantic place identity, not English substrings in
    // legacy anchor IDs (e.g. lobby-nw is a genuine café lounge chair).
    let wrong=false;
    if(p.state){
      const card=scene.places.find(c=>c.id===p.placeId),lounge=['yuna','minji'].includes(p.id)&&['lobby-nw','lobby-ne'].includes(p.seat.anchor);
      // Guests use their own reception lines (go/at, then a goodbye while leaving).
      if(p.walking)wrong=!(/가는 중|돌아가는 중/.test(p.line)||p.visitor&&p.state==='RETURNING'&&p.line==='안녕히 계세요~');
      else if(p.state==='AT_HOME')wrong=!lounge&&/창밖|창가|화이트보드|소파|팬트리|커피 내리|화분|라운지/.test(p.line);
      else if(p.state==='AT_PLACE'){
        const target=scene.art.anchors[p.targetAnchor],pos=px(p.position||[p.seat.x,p.seat.y]);
        wrong=!target||Math.hypot(pos[0]-target.x*W/100,pos[1]-target.y*H/100)>2||scene.anchors.get(p.targetAnchor).floor!==p.floor||(p.visitor?p.line!==p.at:!!card&&!card.at.includes(p.line));
      }
    }else wrong=placeWords.some(([word,keys])=>p.line?.includes(word)&&!/고민|가는 중/.test(p.line)&&!keys.some(k=>where.includes(k)));
    if(wrong){const k=p.line+' @ '+where.trim();if(!mismatch.has(k))mismatch.set(k,`${hh} ${p.id} ${p.walking?'(걷는 중)':''}`)}
    const pos=px(p.position||[p.seat.x,p.seat.y]),prev=last.get(p.id);
    if(p.walking&&prev?.walking&&prev.floor===p.floor&&prev.state===p.state&&Math.hypot(prev.pos[0]-pos[0],prev.pos[1]-pos[1])<.5){const k=p.id+' '+p.seat.anchor;stuck.set(k,(stuck.get(k)||0)+1)}
    last.set(p.id,{pos,walking:p.walking,floor:p.floor,state:p.state});
  }
  const all=[...snap.entries,...snap.visitors];
  for(let i=0;i<all.length;i++)for(let j=i+1;j<all.length;j++){const p=all[i],q=all[j];if(p.floor!==q.floor)continue;
    const a=px(p.position||[p.seat.x,p.seat.y]),b=px(q.position||[q.seat.x,q.seat.y]),d=Math.hypot(a[0]-b[0],a[1]-b[1]);
    if(d<30){const k=[p.id,q.id].sort().join('+')+' '+(p.walking||q.walking?'이동중':'정지');const cur=near.get(k);if(!cur||d<cur.d)near.set(k,{d:+d.toFixed(1),hh,lines:p.id+':'+p.line+' / '+q.id+':'+q.line,spots:p.seat.anchor+' / '+q.seat.anchor});}}
}
console.log('art size',W,H,'snapshots',snaps);
console.log('\n[1] 화면상 제자리인 보행 구간',frozen.length);frozen.slice(0,20).forEach(x=>console.log(' ',x));
console.log('\n[2] 장소 문구 vs 실제 위치 불일치',mismatch.size);[...mismatch].slice(0,25).forEach(([k,v])=>console.log(' ',v,'|',k));
console.log('\n[3] 걷는 중인데 1초간 안 움직인 경우(사람+지점별 초)');[...stuck].sort((a,b)=>b[1]-a[1]).slice(0,10).forEach(([k,v])=>console.log(' ',k,v+'s'));
console.log('\n[4] 같은 층 30px(1672 기준) 이내로 붙은 쌍',near.size);[...near].sort((a,b)=>a[1].d-b[1].d).slice(0,25).forEach(([k,v])=>console.log(' ',k,v.d+'px',v.hh,'|',v.spots,'|',v.lines));
console.log('SUMMARY',JSON.stringify({snapshots:snaps,frozen:frozen.length,mismatch:mismatch.size,stuckSeconds:[...stuck.values()].reduce((a,b)=>a+b,0),near30:near.size,near24:[...near.values()].filter(p=>p.d<24).length}));
