// Reproducible, scene-only geometry and place seed. Does not touch app data.
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const write=(p,v)=>{const url=new URL('../'+p,import.meta.url),eol=fs.existsSync(url)&&fs.readFileSync(url,'utf8').includes('\r\n')?'\r\n':'\n';fs.writeFileSync(url,(JSON.stringify(v,null,2)+'\n').replaceAll('\n',eol))};
const c=read('data/hani-building/spatial-contract.json'),a=read('data/hani-building/art-map-v1.json');
const point=(id,x,y)=>Object.assign(a.anchors[id],{x,y});
// Physical central aisles; branch halls are outside each room's opening.
const halls={
 '1f':{hall_1f:[35,45],hall_business:[29,78],hall_consult:[29,81],hall_lobby:[51,46],hall_cafe:[66,57],stairs_1f:[32,40]},
 '2f':{hall_2f:[51,46],hall_finance:[51,65],hall_life:[51,93],hall_pantry:[51,39],hall_team_meeting:[55,79],stairs_2f:[51,54]},
 '3f':{hall_3f:[51,49],hall_platform:[51,89],hall_server:[60,38],hall_standup:[51,39],hall_release:[56,80],stairs_3f:[51,55]},
 '4f':{hall_4f:[51,52],hall_ceo:[47,49],hall_secretariat:[51,72],hall_hani_office:[54,35],hall_exec:[55,80],hall_exec_lounge:[51,91],stairs_4f:[51,58]},
 '5f':{hall_5f:[51,52],hall_garden:[45,47],hall_terrace:[54,46],hall_event_roof:[45,55],hall_quiet_roof:[54,57],stairs_5f:[51,58]}
};
for(const floor of Object.values(halls))for(const [id,p]of Object.entries(floor))point(id,...p);
// Existing logical room apertures map to the pictured aisle, never a home foot pivot.
for(const [id,p]of Object.entries({door_business:[25,78],door_consult:[25,81],door_lobby:[51,45],door_cafe:[66,55],door_finance:[46,65],door_life:[46,93],junction_life:[42,93],door_pantry:[60,39],door_team_meeting:[58,79],door_platform:[46,89],junction_platform:[39,89],door_server:[69,38],door_standup:[43,39],door_release:[60,80],door_ceo:[40,49],door_secretariat:[43,72],door_exec:[59,80],door_exec_lounge:[42,91],door_garden:[41,47],door_terrace:[61,47],door_event_roof:[41,55],door_quiet_roof:[61,55],junction_consult:[22,80],client_booth:[22,80],path_client_booth_slot_1_7:[23,80],path_client_booth_slot_1_16:[23,79],path_client_booth_slot_1_22:[6.5,79]}))point(id,...p);
// New logical slots attach to an existing walkable room branch. Art slots are on
// bare floor beside exterior glass (5F: the front viewing rail).
const windows=[
 ['1f','cafe',820,540,92,40],
 // 2F/3F/5F moved after 아린 review: open floor facing real glass, clear of shelves/rails/stools.
 ['2f','pantry',320,540,83.5,19],
 ['3f','platform',90,210,33.5,18.5],
 // 4F: the public corridor's north glass end (not the chairman's private room).
 ['4f',null,925,290,51,13],
 ['5f',null,900,345,50,89]
];
for(const [id,x,y]of [['junction_life',46,84.6],['junction_secretariat',43,81],['junction_platform',45,67.5],['approach_desk_seoyun',8.252,67.5],['approach_desk_dohyun',27.5,67.5],['side_desk_dohyun',27.5,64],['approach_desk_serin',40,67.5],['side_desk_serin',40,64],['approach_desk_yuri',45,89],['side_desk_yuri',7.5,85],['approach_desk_arin',45,89],['side_desk_arin',27,85],['path_dev-lounge-a_71',45,39],['path_dev-lounge-b_39',46,39]])point(id,x,y);
// Entry/return paths must also clear a partner already seated at the destination.
for(const [id,x,y]of [['junction_pantry',65,40],['approach_pantry_2f',85,43],['path_finance-lounge-a_5',68,40],['path_finance-lounge-a_19',68,32],['path_finance-lounge-a_25',69,30],['path_finance-lounge-b_5',82,40],['path_finance-lounge-b_19',82,32],['path_finance-lounge-b_25',81,30],['junction_exec',80,72],['junction_business',23,84],['junction_terrace',64,45],['path_rooftop_table_slot_3_7',64,34]])point(id,x,y);
// Window nodes live in office-places.json, not the frozen 326-anchor spatial contract, so the
// production runtime keeps loading the contract whichever of data or code reaches main first.
const windowIds=new Set(windows.map(w=>'window_'+w[0]+'_1'));
c.anchors=c.anchors.filter(n=>!windowIds.has(n.id));c.edges=c.edges.filter(e=>!windowIds.has(e.from)&&!windowIds.has(e.to));
for(const id of windowIds)delete a.anchors[id];
const extraAnchors=[],extraEdges=[],extraArt={};
// Pick a logical, visible-room walkable attachment when a historical path id differs.
for(const [floor,room,x,y,ax,ay]of windows){
 const id='window_'+floor+'_1';
 {
  const node={id,floor,room,x,y,type:'interaction',label:floor==='5f'?'옥상 전망 난간':'바깥 유리창 앞',capacity:1,walkTarget:true};
  const inside=(p,r)=>p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h;
  const f=c.floors.find(f=>f.id===floor);
  // Use a clear logical segment; exclude chairs as intermediate nodes.
  const candidates=c.anchors.filter(n=>n.floor===floor&&n.room===room&&!n.rendererSeat&&n.type!=='door');
  const clear=(n,end=node)=>Array.from({length:101},(_,i)=>({x:n.x+(end.x-n.x)*i/100,y:n.y+(end.y-n.y)*i/100})).every(p=>f.walkable.some(r=>inside(p,r))&&!f.noWalk.some(r=>inside(p,r)));
  let attach=candidates.filter(n=>clear(n)).sort((n,m)=>Math.hypot(n.x-x,n.y-y)-Math.hypot(m.x-x,m.y-y))[0];
  if(!attach)for(const n of candidates.sort((n,m)=>Math.hypot(n.x-x,n.y-y)-Math.hypot(m.x-x,m.y-y))){
   const end={x:n.x+6,y:n.y+6};if(clear(n,end)){Object.assign(node,end);attach=n;break}
  }
  if(!attach)throw Error('No clear window branch: '+id+' (adjust logical slot)');
  extraAnchors.push(node);extraEdges.push({from:attach.id,to:id,kind:'walk',bidirectional:true});
 }
 extraArt[id]={x:ax,y:ay,zone:'lounge'};
}
const places=[];
function card(id,floor,room,kind,slots,name,at,pose='stand'){
 const valid=slots.filter(id=>{const n=[...c.anchors,...extraAnchors].find(n=>n.id===id);return n&&!n.rendererSeat?.owner&&!n.occupant&&n.runtimeAssignable!==false&&!id.startsWith('mir_')});
 if(valid.length)places.push({id,floor,room,kind,name,slots:valid,go:name+' 가는 중',at,pose,stay:[8,14]});
}
card('coffee-1f','1f','cafe','coffee',['coffee_counter'],'카페 커피 카운터로',['카페 커피 카운터에서 커피 주문 중','카페 커피 카운터에서 메뉴 고르는 중']);
card('cafe-1f','1f','cafe','coffee',['lobby-nw','lobby-ne','lobby-sw','lobby-se'],'카페 좌석으로',['카페 좌석에서 커피 마시는 중','카페 좌석에서 잠깐 쉬는 중'],'sit');
card('pantry-2f','2f','pantry','coffee',['pantry_2f'],'팬트리로 커피 내리러',['팬트리에서 커피 내리는 중','팬트리에서 간식 고르는 중']);
card('pantry-seats-2f','2f','pantry','coffee',['finance-lounge-a','finance-lounge-b'],'팬트리 라운지로',['팬트리 라운지에서 커피 마시는 중'],'sit');
card('sofa-3f','3f','platform','sofa',['dev-lounge-a','dev-lounge-b'],'개발실 소파로',['개발실 소파에서 쉬는 중','개발실 소파에서 수다 중'],'sit');
card('sofa-4f','4f','mir_nook','sofa',['lounge-center','lounge-east','hani-side','lounge-armchair'],'임원 라운지 소파로',['임원 라운지 소파에서 쉬는 중','임원 라운지 소파에서 생각 정리 중'],'sit');
card('board-3f','3f','standup','board',['standup_room'],'개발실 화이트보드로',['개발실 화이트보드에서 아이디어 정리 중']);
card('server-3f','3f','server','server',['server-console'],'서버 콘솔로',['서버 콘솔에서 실행 상태 살피는 중']);
for(const [floor,room,ids,name]of [['1f','consult',['client_booth_slot_1','client_booth_slot_2','client_booth_slot_3','client_booth_slot_4'],'상담실'],['2f','team_meeting',['meeting-nw','meeting-ne','meeting-sw','meeting-s','meeting-se','meeting-e'],'협업 회의실'],['3f','release',['dev-meeting-nw','dev-meeting-n','dev-meeting-ne','dev-meeting-sw','dev-meeting-s','dev-meeting-se'],'릴리스 회의실'],['4f','exec',['board-n','board-ne','board-sw','board-s','board-se','board-e'],'임원 회의실']])card('meeting-'+floor,floor,room,'meeting',ids,name+'로',[name+'에서 메모 정리 중'], 'sit');
card('lobby-board','1f','lobby','lobby',['ilbo_board'],'로비 게시판으로',['로비 게시판에서 소식 읽는 중']);
card('lobby-parcel','1f','lobby','lobby',['parcel_box'],'로비 택배함으로',['로비 택배함에서 택배 확인 중']);
card('lobby-reception','1f','lobby','lobby',['reception'],'로비 안내대로',['로비 안내대에서 방문 접수 중']);
card('garden-5f','5f','garden','garden',['rooftop_garden'],'옥상 정원으로',['옥상 정원에서 화분 살피는 중']);
card('terrace-5f','5f','terrace','meeting',Array.from({length:6},(_,i)=>'rooftop_table_slot_'+(i+1)),'옥상 테라스로',['옥상 테라스에서 잠깐 쉬는 중'],'sit');
const windowNames={'1f':'카페 창가','2f':'팬트리 창가','3f':'개발실 창가','4f':'복도 끝 창가'};
for(const [floor,room]of windows)card('window-'+floor,floor,room,'window',['window_'+floor+'_1'],floor==='5f'?'옥상 전망 난간으로':windowNames[floor]+'로',[floor==='5f'?'옥상 전망 난간에서 풍경 보는 중':windowNames[floor]+'에서 창밖 구경 중']);
// The spatial contract itself is never rewritten here (it stays byte-identical to main).
write('data/hani-building/art-map-v1.json',a);write('data/hani-building/office-places.json',{schemaVersion:'office-places-v1',anchors:extraAnchors,edges:extraEdges,art:extraArt,places});
console.log({places:places.length,windows:windows.map(w=>'window_'+w[0]+'_1')});
